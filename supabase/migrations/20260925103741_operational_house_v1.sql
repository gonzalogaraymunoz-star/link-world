-- LINK WORLD · Operational House v1
-- Canonical schema for reusable operational-house cells.
-- Runtime cell instances, integration connection hashes and source credentials are data/configuration,
-- not committed in this migration.

create schema if not exists private;

create table if not exists public.ecosystem_cell_archetypes (
  archetype_key text primary key,
  version text not null,
  label text not null,
  purpose text not null,
  truth_contract jsonb not null default '{}'::jsonb,
  relation_contract jsonb not null default '{}'::jsonb,
  event_contract jsonb not null default '{}'::jsonb,
  required_binding_roles jsonb not null default '[]'::jsonb,
  default_ui jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ecosystem_cell_archetypes_key_chk check (archetype_key ~ '^[a-z0-9][a-z0-9_]{2,79}$'),
  constraint ecosystem_cell_archetypes_truth_chk check (jsonb_typeof(truth_contract)='object'),
  constraint ecosystem_cell_archetypes_relation_chk check (jsonb_typeof(relation_contract)='object'),
  constraint ecosystem_cell_archetypes_event_chk check (jsonb_typeof(event_contract)='object'),
  constraint ecosystem_cell_archetypes_bindings_chk check (jsonb_typeof(required_binding_roles)='array'),
  constraint ecosystem_cell_archetypes_ui_chk check (jsonb_typeof(default_ui)='object'),
  constraint ecosystem_cell_archetypes_metadata_chk check (jsonb_typeof(metadata)='object')
);

alter table public.ecosystem_cell_archetypes enable row level security;
revoke all on public.ecosystem_cell_archetypes from anon;
grant select on public.ecosystem_cell_archetypes to authenticated;
grant all on public.ecosystem_cell_archetypes to service_role;

drop policy if exists ecosystem_member_select on public.ecosystem_cell_archetypes;
create policy ecosystem_member_select
on public.ecosystem_cell_archetypes
for select to authenticated
using ((select private.lc_is_active_member()));

drop trigger if exists ecosystem_cell_archetypes_touch_updated_at on public.ecosystem_cell_archetypes;
create trigger ecosystem_cell_archetypes_touch_updated_at
before update on public.ecosystem_cell_archetypes
for each row execute function public.link_world_touch_updated_at();

alter table public.ecosystem_cells
  add column if not exists archetype_key text null references public.ecosystem_cell_archetypes(archetype_key),
  add column if not exists archetype_version text null,
  add column if not exists archetype_config jsonb not null default '{}'::jsonb;

alter table public.ecosystem_cells
  drop constraint if exists ecosystem_cells_archetype_config_chk;
alter table public.ecosystem_cells
  add constraint ecosystem_cells_archetype_config_chk check (jsonb_typeof(archetype_config)='object');

create index if not exists ecosystem_cells_archetype_idx
on public.ecosystem_cells(archetype_key)
where archetype_key is not null;

insert into public.ecosystem_cell_archetypes (
  archetype_key,version,label,purpose,truth_contract,relation_contract,event_contract,
  required_binding_roles,default_ui,metadata,active
)
values (
  'operational_house_v1',
  '1.0.0',
  'Casa Operativa',
  'Célula que coordina una red comercial u operacional manteniendo la verdad transaccional en su sistema fuente y proyectando a LINK WORLD sólo identidad, relaciones, capacidades, estados y eventos verificados.',
  jsonb_build_object(
    'world_owns',jsonb_build_array('identity','relations','capabilities','verified_events','ecosystem_state'),
    'source_system_owns',jsonb_build_array('transactions','reservations','passengers','payments','operations','commissions','domain_specific_records'),
    'copy_policy','projection_only',
    'transaction_duplication',false,
    'sensitive_person_data_copy',false,
    'financial_rule','operational_cost_before_margin_distribution'
  ),
  jsonb_build_object(
    'counterparty_relations',jsonb_build_array('works_with','counterparty_of'),
    'product_strategy','observe_or_project_identity_without_copying_transactional_catalog_state',
    'source_identity_required',true,
    'commercial_terms_must_be_explicit',true
  ),
  jsonb_build_object(
    'transport','event_bus',
    'delivery_semantics','at_least_once_with_dedupe_key',
    'payload_policy','minimal_non_sensitive_references',
    'events',jsonb_build_array(
      'counterparty.connected','product.available','sale.confirmed',
      'operation.completed','commission.accrued','feedback.closed'
    ),
    'required_fields',jsonb_build_array('event_type','source_provider','global_id','dedupe_key','occurred_at')
  ),
  jsonb_build_array(
    'operational_core','sales_apparatus','operations_surface',
    'counterparty_projection','product_projection','event_bridge'
  ),
  jsonb_build_object(
    'workspace_mode','operational_house',
    'show_source_of_truth',true,
    'show_bridge_state',true,
    'show_counterparty_network',true,
    'show_aggregate_capacity',true,
    'never_render_sensitive_person_data',true
  ),
  jsonb_build_object(
    'created_from','HOTEL EXPERIENCE reference implementation',
    'replication_rule','new houses declare configuration and bindings; no custom frontend branch required'
  ),
  true
)
on conflict (archetype_key) do update set
  version=excluded.version,
  label=excluded.label,
  purpose=excluded.purpose,
  truth_contract=excluded.truth_contract,
  relation_contract=excluded.relation_contract,
  event_contract=excluded.event_contract,
  required_binding_roles=excluded.required_binding_roles,
  default_ui=excluded.default_ui,
  metadata=excluded.metadata,
  active=excluded.active,
  updated_at=now();

create or replace function private.ecosystem_apply_cell_archetype(
  p_global_id text,
  p_archetype_key text,
  p_config jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
declare
  v_entity_id uuid;
  v_version text;
  v_label text;
begin
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'p_config must be a JSON object';
  end if;

  select e.id into v_entity_id
  from public.ecosystem_entities e
  where e.global_id=p_global_id
    and e.entity_type='business'
    and e.status='active';

  if v_entity_id is null then
    raise exception 'Active business cell not found for %', p_global_id;
  end if;

  select a.version,a.label into v_version,v_label
  from public.ecosystem_cell_archetypes a
  where a.archetype_key=p_archetype_key
    and a.active=true;

  if v_version is null then
    raise exception 'Active archetype not found for %', p_archetype_key;
  end if;

  update public.ecosystem_cells c
  set archetype_key=p_archetype_key,
      archetype_version=v_version,
      archetype_config=p_config,
      constitution_version=p_archetype_key||'@'||v_version,
      metadata=c.metadata || jsonb_build_object(
        'archetype_key',p_archetype_key,
        'archetype_version',v_version,
        'archetype_applied_at',now()
      ),
      updated_at=now()
  where c.entity_id=v_entity_id;

  if not found then
    raise exception 'Cell row not found for %', p_global_id;
  end if;

  return jsonb_build_object(
    'global_id',p_global_id,
    'entity_id',v_entity_id,
    'archetype_key',p_archetype_key,
    'archetype_version',v_version,
    'archetype_label',v_label,
    'configuration',p_config
  );
end;
$$;

revoke execute on function private.ecosystem_apply_cell_archetype(text,text,jsonb)
from public, anon, authenticated;
grant execute on function private.ecosystem_apply_cell_archetype(text,text,jsonb)
to service_role;

create or replace view public.ecosystem_operational_house_readiness_v
with (security_invoker=true)
as
select
  b.id as business_id,
  b.global_id,
  b.name,
  c.archetype_key,
  c.archetype_version,
  c.lifecycle_stage,
  c.health_status,
  a.required_binding_roles,
  coalesce((
    select jsonb_agg(distinct ib.metadata->>'contract_role')
    from public.integration_bindings ib
    where ib.global_id=b.global_id
      and nullif(ib.metadata->>'contract_role','') is not null
  ),'[]'::jsonb) as registered_binding_roles,
  coalesce((
    select jsonb_agg(r.role order by r.role)
    from jsonb_array_elements_text(a.required_binding_roles) r(role)
    where not exists (
      select 1
      from public.integration_bindings ib
      where ib.global_id=b.global_id
        and ib.metadata->>'contract_role'=r.role
    )
  ),'[]'::jsonb) as missing_binding_roles,
  coalesce((
    select jsonb_agg(distinct ib.metadata->>'contract_role')
    from public.integration_bindings ib
    where ib.global_id=b.global_id
      and ib.sync_status='connected'
      and nullif(ib.metadata->>'contract_role','') is not null
  ),'[]'::jsonb) as connected_binding_roles,
  case
    when exists (
      select 1
      from jsonb_array_elements_text(a.required_binding_roles) r(role)
      where not exists (
        select 1 from public.integration_bindings ib
        where ib.global_id=b.global_id
          and ib.metadata->>'contract_role'=r.role
      )
    ) then 'incomplete'
    when exists (
      select 1
      from public.integration_bindings ib
      where ib.global_id=b.global_id
        and ib.metadata->>'contract_role' in (
          select value from jsonb_array_elements_text(a.required_binding_roles)
        )
        and ib.sync_status <> 'connected'
    ) then 'registered_pending_sync'
    else 'connected'
  end as bridge_readiness,
  c.updated_at
from public.link_world_businesses b
join public.ecosystem_entities e on e.global_id=b.global_id
join public.ecosystem_cells c on c.entity_id=e.id
join public.ecosystem_cell_archetypes a on a.archetype_key=c.archetype_key
where c.archetype_key='operational_house_v1';

revoke all on public.ecosystem_operational_house_readiness_v from anon;
grant select on public.ecosystem_operational_house_readiness_v to authenticated, service_role;
