-- LINK WORLD · registro canónico de modelos v1
-- Producción aplicada el 2026-10-06. Mantener este archivo como fuente reproducible.

create table if not exists public.link_world_models (
  id uuid primary key default gen_random_uuid(),
  model_key text not null unique check (model_key ~ '^[a-z0-9][a-z0-9_\\-]{2,119}$'),
  name text not null check (char_length(name) between 3 and 200),
  pain_statement text not null,
  solution_statement text not null,
  model_kind text not null check (model_kind in ('commercial','service','operational','product','infrastructure','business_system')),
  maturity_stage text not null default 'hobby' check (maturity_stage in ('hobby','candidate','evidenced','repeatable','productizable','business_candidate','business','replicable')),
  economic_role text not null default 'unknown' check (economic_role in ('unknown','internal_capability','product','business_candidate','business')),
  confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
  origin_business_id uuid references public.link_world_businesses(id) on delete set null,
  source_project_id uuid references public.projects(id) on delete set null,
  estimated_monthly_revenue_clp numeric(14,2),
  estimated_monthly_cost_clp numeric(14,2),
  director_hours_monthly numeric(10,2),
  next_gate text,
  model_definition jsonb not null default '{}'::jsonb check (jsonb_typeof(model_definition)='object'),
  metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(metrics)='object'),
  status text not null default 'active' check (status in ('active','paused','archived')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.link_world_model_evidence (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.link_world_models(id) on delete cascade,
  business_id uuid references public.link_world_businesses(id) on delete set null,
  evidence_type text not null,
  source_system text not null,
  source_ref text not null,
  result text not null,
  amount_clp numeric(14,2),
  verified boolean not null default false,
  confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
  occurred_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  unique(model_id,source_system,source_ref)
);

create table if not exists public.link_world_model_business_links (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.link_world_models(id) on delete cascade,
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  role text not null check (role in ('origin','validated_in','installed_in','commercialized_by','candidate_spinout','supports')),
  status text not null default 'active' check (status in ('proposed','active','historical')),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence)='array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(model_id,business_id,role)
);

create index if not exists link_world_models_maturity_idx on public.link_world_models(maturity_stage,status);
create index if not exists link_world_model_evidence_model_idx on public.link_world_model_evidence(model_id,verified);
create index if not exists link_world_model_business_links_model_idx on public.link_world_model_business_links(model_id,status);

alter table public.link_world_models enable row level security;
alter table public.link_world_model_evidence enable row level security;
alter table public.link_world_model_business_links enable row level security;

create or replace view public.link_world_model_portfolio_v
with (security_invoker=true)
as
select
  m.*,ob.name as origin_business_name,p.name as source_project_name,
  count(e.id)::int as evidence_count,
  count(e.id) filter (where e.verified)::int as verified_evidence_count,
  count(distinct bl.business_id)::int as linked_business_count,
  least(100,
    case m.maturity_stage
      when 'hobby' then 10 when 'candidate' then 25 when 'evidenced' then 45
      when 'repeatable' then 60 when 'productizable' then 75 when 'business_candidate' then 90
      when 'business' then 95 when 'replicable' then 100 else 0 end
    + least(10,(count(e.id) filter (where e.verified))::int*2)
    + case when coalesce(m.estimated_monthly_revenue_clp,0)>0 then 5 else 0 end
  )::int as readiness_score,
  case m.maturity_stage
    when 'hobby' then 'validar_dolor' when 'candidate' then 'conseguir_evidencia'
    when 'evidenced' then 'repetir_fuera_del_origen' when 'repeatable' then 'validar_economia'
    when 'productizable' then 'empaquetar_y_vender' when 'business_candidate' then 'decision_director_nacer_negocio'
    when 'business' then 'sistematizar_y_delegar' when 'replicable' then 'replicar' else 'revisar'
  end as next_move
from public.link_world_models m
left join public.link_world_businesses ob on ob.id=m.origin_business_id
left join public.projects p on p.id=m.source_project_id
left join public.link_world_model_evidence e on e.model_id=m.id
left join public.link_world_model_business_links bl on bl.model_id=m.id and bl.status='active'
group by m.id,ob.name,p.name;
