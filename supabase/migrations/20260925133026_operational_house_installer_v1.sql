create or replace function private.install_operational_house_v1(
  p_global_id text,
  p_source_provider text,
  p_source_project_id text,
  p_bridge_token_hash text,
  p_source_name text default null,
  p_allowed_event_types jsonb default null,
  p_config jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_archetype_version text;
  v_contract_events jsonb;
  v_required_roles jsonb;
  v_allowed_events jsonb;
  v_invalid_event text;
  v_connection_id uuid;
  v_readiness jsonb;
begin
  if p_global_id is null or p_global_id !~ '^LNK-BIZ-[A-Z0-9]+$' then
    raise exception 'Invalid LINK WORLD business global_id';
  end if;
  if nullif(btrim(p_source_provider),'') is null then
    raise exception 'p_source_provider is required';
  end if;
  if nullif(btrim(p_source_project_id),'') is null then
    raise exception 'p_source_project_id is required';
  end if;
  if p_bridge_token_hash is null or p_bridge_token_hash !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'p_bridge_token_hash must be a SHA-256 hex digest; raw bridge tokens are never stored';
  end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'p_config must be a JSON object';
  end if;

  select b.id
    into v_business_id
  from public.link_world_businesses b
  join public.ecosystem_entities e
    on e.global_id=b.global_id
   and e.entity_type='business'
   and e.status='active'
  join public.ecosystem_cells c
    on c.entity_id=e.id
  where b.global_id=p_global_id;

  if v_business_id is null then
    raise exception 'Active LINK WORLD business cell not found for %', p_global_id;
  end if;

  select a.version,
         a.event_contract->'events',
         a.required_binding_roles
    into v_archetype_version,v_contract_events,v_required_roles
  from public.ecosystem_cell_archetypes a
  where a.archetype_key='operational_house_v1'
    and a.active=true;

  if v_archetype_version is null then
    raise exception 'Operational House v1 archetype is not active';
  end if;

  v_allowed_events := coalesce(p_allowed_event_types,v_contract_events);
  if v_allowed_events is null
     or jsonb_typeof(v_allowed_events) <> 'array'
     or jsonb_array_length(v_allowed_events)=0 then
    raise exception 'p_allowed_event_types must be a non-empty JSON array when provided';
  end if;

  select x.value
    into v_invalid_event
  from jsonb_array_elements_text(v_allowed_events) x(value)
  where not coalesce(v_contract_events ? x.value,false)
  limit 1;

  if v_invalid_event is not null then
    raise exception 'Event type % is outside the Operational House v1 contract', v_invalid_event;
  end if;

  perform private.ecosystem_apply_cell_archetype(
    p_global_id,
    'operational_house_v1',
    p_config || jsonb_build_object(
      'source_provider',btrim(p_source_provider),
      'source_project_id',btrim(p_source_project_id),
      'contract_version','operational-house-bridge-v1',
      'installed_by','operational_house_installer_v1',
      'installed_at',now()
    )
  );

  insert into public.integration_connections(
    provider,connection_key,mode,status,webhook_token_hash,last_error,metadata
  )
  values(
    'operational_house',
    p_global_id,
    'event_bridge',
    'active',
    lower(p_bridge_token_hash),
    null,
    jsonb_build_object(
      'auth','sha256_bridge_token',
      'source_provider',btrim(p_source_provider),
      'source_project_id',btrim(p_source_project_id),
      'source_name',coalesce(nullif(btrim(p_source_name),''),btrim(p_source_provider)),
      'contract_version','operational-house-bridge-v1',
      'pii_policy','minimal_non_sensitive_references',
      'allowed_event_types',v_allowed_events,
      'installer','operational_house_installer_v1'
    )
  )
  on conflict (provider,connection_key) do update set
    mode=excluded.mode,
    status='active',
    webhook_token_hash=excluded.webhook_token_hash,
    last_error=null,
    metadata=public.integration_connections.metadata || excluded.metadata,
    updated_at=now()
  returning id into v_connection_id;

  insert into public.operational_house_projection_state(
    global_id,business_id,archetype_key,projection_version,coverage_mode,metadata
  )
  values(
    p_global_id,v_business_id,'operational_house_v1',v_archetype_version,'forward_only',
    jsonb_build_object(
      'scope','derived_projection',
      'truth_owner','event_bus',
      'historical_completeness',false,
      'installer','operational_house_installer_v1'
    )
  )
  on conflict (global_id) do update set
    business_id=excluded.business_id,
    archetype_key=excluded.archetype_key,
    projection_version=excluded.projection_version,
    metadata=public.operational_house_projection_state.metadata || jsonb_build_object(
      'installer','operational_house_installer_v1',
      'installer_last_run_at',now()
    ),
    updated_at=now();

  select to_jsonb(r)
    into v_readiness
  from public.ecosystem_operational_house_readiness_v r
  where r.global_id=p_global_id;

  return jsonb_build_object(
    'ok',true,
    'global_id',p_global_id,
    'business_id',v_business_id,
    'archetype_key','operational_house_v1',
    'archetype_version',v_archetype_version,
    'connection_id',v_connection_id,
    'connection_status','active',
    'event_endpoint','/functions/v1/ingest-operational-house-event',
    'allowed_event_types',v_allowed_events,
    'required_binding_roles',v_required_roles,
    'readiness',coalesce(v_readiness,'{}'::jsonb),
    'next_step','register real source/app bindings explicitly; do not fabricate connected state'
  );
end;
$$;

revoke execute on function private.install_operational_house_v1(text,text,text,text,text,jsonb,jsonb)
from public,anon,authenticated;
grant execute on function private.install_operational_house_v1(text,text,text,text,text,jsonb,jsonb)
to service_role;

create or replace function private.register_operational_house_binding_v1(
  p_global_id text,
  p_contract_role text,
  p_provider text,
  p_external_object text,
  p_external_id text,
  p_source_app text default null,
  p_sync_status text default 'pending',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_required_roles jsonb;
  v_binding_id uuid;
  v_readiness jsonb;
begin
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'p_metadata must be a JSON object';
  end if;
  if p_sync_status not in ('connected','pending','warning','error','disconnected') then
    raise exception 'Invalid sync status %', p_sync_status;
  end if;
  if nullif(btrim(p_provider),'') is null
     or nullif(btrim(p_external_object),'') is null
     or nullif(btrim(p_external_id),'') is null
     or nullif(btrim(p_contract_role),'') is null then
    raise exception 'contract role, provider, external object and external id are required';
  end if;

  select a.required_binding_roles
    into v_required_roles
  from public.ecosystem_entities e
  join public.ecosystem_cells c on c.entity_id=e.id
  join public.ecosystem_cell_archetypes a on a.archetype_key=c.archetype_key
  where e.global_id=p_global_id
    and e.entity_type='business'
    and e.status='active'
    and c.archetype_key='operational_house_v1'
    and a.active=true;

  if v_required_roles is null then
    raise exception 'Operational House v1 is not installed for %', p_global_id;
  end if;
  if not (v_required_roles ? btrim(p_contract_role)) then
    raise exception 'Contract role % is not part of Operational House v1', p_contract_role;
  end if;

  insert into public.integration_bindings(
    provider,global_id,entity_type,external_object,external_id,source_app,
    sync_status,last_synced_at,metadata
  )
  values(
    btrim(p_provider),p_global_id,'business',btrim(p_external_object),btrim(p_external_id),
    nullif(btrim(p_source_app),''),
    p_sync_status,
    case when p_sync_status='connected' then now() else null end,
    p_metadata || jsonb_build_object(
      'contract_role',btrim(p_contract_role),
      'contract_version','operational-house-bridge-v1',
      'registered_by','operational_house_installer_v1'
    )
  )
  on conflict (provider,global_id,external_object) do update set
    external_id=excluded.external_id,
    source_app=excluded.source_app,
    sync_status=excluded.sync_status,
    last_synced_at=case
      when excluded.sync_status='connected' then coalesce(public.integration_bindings.last_synced_at,now())
      else public.integration_bindings.last_synced_at
    end,
    metadata=public.integration_bindings.metadata || excluded.metadata,
    updated_at=now()
  returning id into v_binding_id;

  select to_jsonb(r)
    into v_readiness
  from public.ecosystem_operational_house_readiness_v r
  where r.global_id=p_global_id;

  return jsonb_build_object(
    'ok',true,
    'binding_id',v_binding_id,
    'global_id',p_global_id,
    'contract_role',btrim(p_contract_role),
    'sync_status',p_sync_status,
    'readiness',coalesce(v_readiness,'{}'::jsonb)
  );
end;
$$;

revoke execute on function private.register_operational_house_binding_v1(text,text,text,text,text,text,text,jsonb)
from public,anon,authenticated;
grant execute on function private.register_operational_house_binding_v1(text,text,text,text,text,text,text,jsonb)
to service_role;

create or replace function private.operational_house_installation_plan_v1(p_global_id text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'global_id',b.global_id,
    'business_id',b.id,
    'business_name',b.name,
    'archetype_installed',coalesce(c.archetype_key='operational_house_v1',false),
    'archetype_version',c.archetype_version,
    'required_binding_roles',coalesce(a.required_binding_roles,'[]'::jsonb),
    'registered_binding_roles',coalesce(r.registered_binding_roles,'[]'::jsonb),
    'missing_binding_roles',coalesce(r.missing_binding_roles,a.required_binding_roles,'[]'::jsonb),
    'bridge_readiness',coalesce(r.bridge_readiness,'not_installed'),
    'connection',case when ic.id is null then null else jsonb_build_object(
      'id',ic.id,
      'status',ic.status,
      'mode',ic.mode,
      'last_seen_at',ic.last_seen_at,
      'last_error',ic.last_error,
      'source_provider',ic.metadata->>'source_provider',
      'source_project_id',ic.metadata->>'source_project_id',
      'allowed_event_types',coalesce(ic.metadata->'allowed_event_types','[]'::jsonb)
    ) end,
    'event_endpoint','/functions/v1/ingest-operational-house-event',
    'source_contract',jsonb_build_object(
      'delivery','at_least_once_with_dedupe_key',
      'payload_policy','minimal_non_sensitive_references',
      'raw_bridge_token_storage',false
    )
  )
  from public.link_world_businesses b
  left join public.ecosystem_entities e
    on e.global_id=b.global_id and e.entity_type='business'
  left join public.ecosystem_cells c on c.entity_id=e.id
  left join public.ecosystem_cell_archetypes a
    on a.archetype_key='operational_house_v1' and a.active=true
  left join public.ecosystem_operational_house_readiness_v r
    on r.global_id=b.global_id
  left join public.integration_connections ic
    on ic.provider='operational_house' and ic.connection_key=b.global_id
  where b.global_id=p_global_id;
$$;

revoke execute on function private.operational_house_installation_plan_v1(text)
from public,anon,authenticated;
grant execute on function private.operational_house_installation_plan_v1(text)
to service_role;

update public.ecosystem_cell_archetypes
set metadata=metadata || jsonb_build_object(
      'installer',jsonb_build_object(
        'key','operational_house_installer_v1',
        'version','1.0.0',
        'install_function','private.install_operational_house_v1',
        'binding_function','private.register_operational_house_binding_v1',
        'plan_function','private.operational_house_installation_plan_v1',
        'credential_policy','store_sha256_hash_only',
        'binding_policy','explicit_real_bindings_only'
      )
    ),
    updated_at=now()
where archetype_key='operational_house_v1';
