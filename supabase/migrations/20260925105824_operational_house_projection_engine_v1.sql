-- LINK WORLD · Operational House Projection Engine v1
-- Persistent, rebuildable projections from event_bus.
-- Runtime baselines remain data in Supabase; this migration does not seed business-specific metrics.

create schema if not exists private;

create table if not exists public.operational_house_projection_state (
  global_id text primary key,
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  archetype_key text not null references public.ecosystem_cell_archetypes(archetype_key),
  projection_version text not null default '1.0.0',
  coverage_mode text not null default 'forward_only',
  projection_started_at timestamptz not null default now(),
  baseline_verified_at timestamptz null,
  baseline_source text null,
  baseline_metrics jsonb not null default '{}'::jsonb,
  event_counts jsonb not null default '{}'::jsonb,
  last_event_at_by_type jsonb not null default '{}'::jsonb,
  processed_event_count bigint not null default 0,
  first_event_at timestamptz null,
  last_event_at timestamptz null,
  last_received_at timestamptz null,
  last_event_type text null,
  last_event_id uuid null references public.event_bus(id) on delete set null,
  last_engine_run_at timestamptz null,
  last_engine_status text not null default 'not_started',
  last_error text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operational_house_projection_state_coverage_chk
    check (coverage_mode in ('forward_only','baseline_plus_forward_events')),
  constraint operational_house_projection_state_status_chk
    check (last_engine_status in ('not_started','healthy','degraded')),
  constraint operational_house_projection_state_json_chk
    check (
      jsonb_typeof(baseline_metrics)='object'
      and jsonb_typeof(event_counts)='object'
      and jsonb_typeof(last_event_at_by_type)='object'
      and jsonb_typeof(metadata)='object'
    ),
  constraint operational_house_projection_state_count_chk
    check (processed_event_count >= 0)
);

alter table public.operational_house_projection_state enable row level security;
revoke all on public.operational_house_projection_state from anon;
revoke insert,update,delete on public.operational_house_projection_state from authenticated;
grant select on public.operational_house_projection_state to authenticated;
grant all on public.operational_house_projection_state to service_role;

drop policy if exists operational_house_projection_member_select on public.operational_house_projection_state;
create policy operational_house_projection_member_select
on public.operational_house_projection_state
for select to authenticated
using ((select private.lc_is_active_member()));

drop trigger if exists operational_house_projection_state_touch on public.operational_house_projection_state;
create trigger operational_house_projection_state_touch
before update on public.operational_house_projection_state
for each row execute function public.link_world_touch_updated_at();

create index if not exists operational_house_projection_state_business_idx
on public.operational_house_projection_state(business_id);

create index if not exists operational_house_projection_state_archetype_idx
on public.operational_house_projection_state(archetype_key);

create index if not exists operational_house_projection_state_last_event_idx
on public.operational_house_projection_state(last_event_id)
where last_event_id is not null;

create table if not exists private.operational_house_projection_event_ledger (
  event_id uuid primary key references public.event_bus(id) on delete cascade,
  global_id text not null,
  event_type text not null,
  status text not null default 'processed',
  attempts integer not null default 1,
  projection_version text not null default '1.0.0',
  processed_at timestamptz null,
  last_attempt_at timestamptz not null default now(),
  error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operational_house_projection_event_status_chk
    check (status in ('processed','ignored','error')),
  constraint operational_house_projection_event_attempts_chk
    check (attempts >= 1)
);

revoke all on private.operational_house_projection_event_ledger from public,anon,authenticated;
grant all on private.operational_house_projection_event_ledger to service_role;

create index if not exists operational_house_projection_event_pending_idx
on private.operational_house_projection_event_ledger(status,last_attempt_at)
where status='error';

create or replace function private.project_operational_house_events(p_limit integer default 500)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event record;
  v_allowed boolean;
  v_processed integer := 0;
  v_ignored integer := 0;
  v_errors integer := 0;
  v_effective_at timestamptz;
  v_existing_attempts integer;
begin
  insert into public.operational_house_projection_state(
    global_id,business_id,archetype_key,projection_version,coverage_mode,projection_started_at,metadata
  )
  select
    b.global_id,b.id,c.archetype_key,'1.0.0','forward_only',now(),
    jsonb_build_object(
      'scope','derived_projection',
      'truth_owner','event_bus',
      'historical_completeness',false
    )
  from public.link_world_businesses b
  join public.ecosystem_entities e on e.global_id=b.global_id and e.entity_type='business'
  join public.ecosystem_cells c on c.entity_id=e.id
  where c.archetype_key='operational_house_v1'
  on conflict (global_id) do nothing;

  update public.operational_house_projection_state s
  set last_engine_run_at=now(),
      last_engine_status='healthy',
      last_error=null,
      updated_at=now()
  where s.archetype_key='operational_house_v1';

  for v_event in
    select
      eb.*,
      a.event_contract,
      coalesce(l.attempts,0) as prior_attempts
    from public.event_bus eb
    join public.ecosystem_entities e
      on e.global_id=eb.global_id
     and e.entity_type='business'
     and e.status='active'
    join public.ecosystem_cells c
      on c.entity_id=e.id
     and c.archetype_key='operational_house_v1'
    join public.ecosystem_cell_archetypes a
      on a.archetype_key=c.archetype_key
     and a.active=true
    join public.integration_connections ic
      on ic.provider='operational_house'
     and ic.connection_key=eb.global_id
     and ic.status='active'
     and coalesce(ic.metadata->>'source_provider','')=eb.source_provider
    left join private.operational_house_projection_event_ledger l
      on l.event_id=eb.id
    where (
      l.event_id is null
      or (l.status='error' and l.attempts < 5)
    )
    order by eb.received_at,eb.id
    limit greatest(1,least(coalesce(p_limit,500),5000))
  loop
    begin
      v_existing_attempts := coalesce(v_event.prior_attempts,0);
      v_allowed := coalesce((v_event.event_contract->'events') ? v_event.event_type,false);

      if not v_allowed then
        insert into private.operational_house_projection_event_ledger(
          event_id,global_id,event_type,status,attempts,projection_version,processed_at,last_attempt_at,error
        )
        values(
          v_event.id,v_event.global_id,v_event.event_type,'ignored',
          greatest(1,v_existing_attempts+1),'1.0.0',now(),now(),'event_type_not_in_archetype_contract'
        )
        on conflict (event_id) do update set
          status='ignored',
          attempts=private.operational_house_projection_event_ledger.attempts+1,
          processed_at=now(),
          last_attempt_at=now(),
          error='event_type_not_in_archetype_contract',
          updated_at=now();

        v_ignored := v_ignored+1;
        continue;
      end if;

      v_effective_at := coalesce(v_event.occurred_at,v_event.received_at,now());

      update public.operational_house_projection_state s
      set event_counts=jsonb_set(
            s.event_counts,
            array[v_event.event_type],
            to_jsonb(coalesce((s.event_counts->>v_event.event_type)::bigint,0)+1),
            true
          ),
          last_event_at_by_type=jsonb_set(
            s.last_event_at_by_type,
            array[v_event.event_type],
            to_jsonb(v_effective_at::text),
            true
          ),
          processed_event_count=s.processed_event_count+1,
          first_event_at=coalesce(least(s.first_event_at,v_effective_at),s.first_event_at,v_effective_at),
          last_event_at=coalesce(greatest(s.last_event_at,v_effective_at),s.last_event_at,v_effective_at),
          last_received_at=coalesce(greatest(s.last_received_at,v_event.received_at),s.last_received_at,v_event.received_at),
          last_event_type=v_event.event_type,
          last_event_id=v_event.id,
          last_engine_run_at=now(),
          last_engine_status='healthy',
          last_error=null,
          updated_at=now()
      where s.global_id=v_event.global_id;

      insert into private.operational_house_projection_event_ledger(
        event_id,global_id,event_type,status,attempts,projection_version,processed_at,last_attempt_at,error
      )
      values(
        v_event.id,v_event.global_id,v_event.event_type,'processed',
        greatest(1,v_existing_attempts+1),'1.0.0',now(),now(),null
      )
      on conflict (event_id) do update set
        status='processed',
        attempts=private.operational_house_projection_event_ledger.attempts+1,
        projection_version='1.0.0',
        processed_at=now(),
        last_attempt_at=now(),
        error=null,
        updated_at=now();

      v_processed := v_processed+1;
    exception when others then
      insert into private.operational_house_projection_event_ledger(
        event_id,global_id,event_type,status,attempts,projection_version,processed_at,last_attempt_at,error
      )
      values(
        v_event.id,v_event.global_id,v_event.event_type,'error',
        greatest(1,v_existing_attempts+1),'1.0.0',null,now(),left(sqlerrm,500)
      )
      on conflict (event_id) do update set
        status='error',
        attempts=private.operational_house_projection_event_ledger.attempts+1,
        processed_at=null,
        last_attempt_at=now(),
        error=left(sqlerrm,500),
        updated_at=now();

      update public.operational_house_projection_state s
      set last_engine_run_at=now(),
          last_engine_status='degraded',
          last_error=left(sqlerrm,500),
          updated_at=now()
      where s.global_id=v_event.global_id;

      v_errors := v_errors+1;
    end;
  end loop;

  return jsonb_build_object(
    'projection_version','1.0.0',
    'processed',v_processed,
    'ignored',v_ignored,
    'errors',v_errors,
    'ran_at',now()
  );
end;
$$;

revoke execute on function private.project_operational_house_events(integer)
from public,anon,authenticated;
grant execute on function private.project_operational_house_events(integer)
to service_role;

create or replace view public.ecosystem_operational_house_status_v
with (security_invoker=true)
as
select
  r.business_id,
  r.global_id,
  r.name,
  r.archetype_key,
  r.archetype_version,
  r.lifecycle_stage,
  r.health_status,
  r.required_binding_roles,
  r.registered_binding_roles,
  r.missing_binding_roles,
  r.connected_binding_roles,
  r.bridge_readiness as binding_sync_readiness,
  case
    when jsonb_array_length(r.missing_binding_roles)=0 then 'complete'
    else 'incomplete'
  end as structure_status,
  case
    when coalesce(eb.sync_status,'missing')='connected'
      and coalesce(ic.status,'missing')='active'
      and ic.last_error is null
      then 'connected'
    when coalesce(ic.status,'')='warning'
      or coalesce(eb.sync_status,'')='error'
      or ic.last_error is not null
      then 'degraded'
    else 'pending'
  end as transport_status,
  case
    when ps.global_id is null then 'not_initialized'
    when ps.last_engine_status='degraded' then 'degraded'
    when ps.last_engine_run_at is null then 'not_started'
    when ps.last_engine_run_at < now()-interval '5 minutes' then 'stale'
    else 'healthy'
  end as projection_status,
  case
    when jsonb_array_length(r.missing_binding_roles)=0
      and coalesce(eb.sync_status,'missing')='connected'
      and coalesce(ic.status,'missing')='active'
      and ic.last_error is null
      and ps.last_engine_status='healthy'
      and ps.last_engine_run_at >= now()-interval '5 minutes'
      then 'ready'
    when coalesce(ic.status,'')='warning'
      or coalesce(eb.sync_status,'')='error'
      or ic.last_error is not null
      or ps.last_engine_status='degraded'
      or (ps.last_engine_run_at is not null and ps.last_engine_run_at < now()-interval '5 minutes')
      then 'attention'
    else 'pending'
  end as overall_status,
  coalesce(ps.coverage_mode,'forward_only') as coverage_mode,
  ps.projection_started_at,
  ps.baseline_verified_at,
  ps.baseline_source,
  coalesce(ps.baseline_metrics,'{}'::jsonb) as baseline_metrics,
  coalesce(ps.event_counts,'{}'::jsonb) as event_counts,
  coalesce(ps.processed_event_count,0) as processed_event_count,
  ps.first_event_at,
  ps.last_event_at,
  ps.last_received_at,
  ps.last_event_type,
  ps.last_engine_run_at,
  ps.last_engine_status,
  ps.last_error as projection_error,
  ic.last_seen_at as transport_last_seen_at,
  ic.last_error as transport_error,
  'baseline and forward events are separate; event counts are not a historical total'::text as interpretation_note
from public.ecosystem_operational_house_readiness_v r
left join public.operational_house_projection_state ps
  on ps.global_id=r.global_id
left join public.integration_bindings eb
  on eb.global_id=r.global_id
 and eb.external_object='event_bridge'
left join public.integration_connections ic
  on ic.provider='operational_house'
 and ic.connection_key=r.global_id;

revoke all on public.ecosystem_operational_house_status_v from anon;
grant select on public.ecosystem_operational_house_status_v to authenticated,service_role;

update public.ecosystem_cell_archetypes
set metadata=metadata || jsonb_build_object(
      'projection_engine',jsonb_build_object(
        'key','operational_house_projection_engine_v1',
        'version','1.0.0',
        'state_table','operational_house_projection_state',
        'status_view','ecosystem_operational_house_status_v',
        'ledger','private.operational_house_projection_event_ledger',
        'consumer','private.project_operational_house_events',
        'schedule','every_minute',
        'coverage_policy','verified_aggregate_baseline_plus_forward_events',
        'mutation_policy','projection_only_no_business_mutation'
      )
    ),
    updated_at=now()
where archetype_key='operational_house_v1';

do $$
declare
  v_job bigint;
begin
  select jobid into v_job
  from cron.job
  where jobname='link-world-operational-house-projection'
  limit 1;

  if v_job is not null then
    perform cron.unschedule(v_job);
  end if;

  perform cron.schedule(
    'link-world-operational-house-projection',
    '* * * * *',
    'select private.project_operational_house_events(500);'
  );
end;
$$;

do $$
declare
  v_job bigint;
begin
  select jobid into v_job
  from cron.job
  where jobname='link-world-operational-house-cron-retention'
  limit 1;

  if v_job is not null then
    perform cron.unschedule(v_job);
  end if;

  perform cron.schedule(
    'link-world-operational-house-cron-retention',
    '17 4 * * *',
    $job$
      delete from cron.job_run_details d
      where d.start_time < now()-interval '14 days'
        and d.jobid in (
          select j.jobid
          from cron.job j
          where j.jobname in (
            'link-world-operational-house-projection',
            'link-world-operational-house-cron-retention'
          )
        );
    $job$
  );
end;
$$;
