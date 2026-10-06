create table if not exists public.link_fin_lifecycle_stage_catalog (
  stage_key text primary key,
  stage_order integer not null unique,
  label text not null,
  definition text not null,
  certification_rule text not null,
  requires_economic_evidence boolean not null default false,
  terminal boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.link_fin_lifecycle_stage_catalog
(stage_key,stage_order,label,definition,certification_rule,requires_economic_evidence,terminal,metadata)
values
('birth',10,'Nacimiento','El modelo, solución o unidad económica existe de forma identificable.','Se certifica con un origen persistente: registro de negocio, modelo o artefacto canónico.',false,false,'{"economic_meaning":"existence"}'),
('link_entry',20,'Ingreso a LINK','La unidad entra al ecosistema LINK y obtiene identidad trazable.','Debe existir una ficha o identidad canónica dentro de LINK.',false,false,'{"economic_meaning":"ecosystem_entry"}'),
('activation',30,'Activación','El negocio comienza ejecución real de su modelo.','Debe existir actividad operativa verificable vinculada al negocio.',false,false,'{"economic_meaning":"execution_started"}'),
('first_economic_evidence',40,'Primera evidencia económica','Aparece el primer hecho económico respaldado.','Requiere documento, transacción o evidencia económica persistente.',true,false,'{"economic_meaning":"first_economic_fact"}'),
('first_sale',50,'Primera venta','Existe el primer cierre comercial económicamente identificable.','Debe existir cierre, transacción o evidencia equivalente; una intención no basta.',true,false,'{"economic_meaning":"first_sale"}'),
('first_billing',60,'Primera facturación','Se emite el primer documento de cobro o tributario del negocio.','Requiere factura, boleta u otro documento persistente válido.',true,false,'{"economic_meaning":"first_billing"}'),
('first_collection',70,'Primer cobro','El primer ingreso de caja queda comprobado.','Requiere pago verificado; facturar no equivale a cobrar.',true,false,'{"economic_meaning":"first_cash"}'),
('verified_business',80,'Negocio comprobado','El modelo completó un ciclo económico real y verificable.','Requiere evidencia de venta, prestación/entrega, documento y dinero real. Si falta uno, no se certifica.',true,false,'{"economic_meaning":"real_business","gate":["sale","delivery","document","cash"]}'),
('recurring',90,'Recurrente','El ciclo económico comprobado vuelve a ocurrir.','Requiere al menos dos ciclos económicos comparables con evidencia real.',true,false,'{"economic_meaning":"recurrence"}'),
('profitable',100,'Rentable','Los ingresos reales superan los costos reales durante el período definido.','Debe declararse período y fórmula; solo usa ingresos y egresos verificados.',true,false,'{"economic_meaning":"profitability"}'),
('stable',110,'Estable','El negocio sostiene recurrencia, operación y evidencia durante un período suficiente.','Requiere recurrencia verificada, continuidad operacional y ausencia de dependencias críticas no resueltas.',true,false,'{"economic_meaning":"stability"}'),
('transformation',120,'Transformación','Cambia de forma material el modelo, producto, cliente, estructura o economía.','Debe registrar qué cambió, desde qué estado y con qué evidencia.',false,false,'{"economic_meaning":"model_change"}'),
('mitosis',130,'Mitosis','Un negocio o modelo comprobado se replica como nueva unidad económica.','La unidad origen debe estar comprobada y la nueva unidad debe conservar trazabilidad de origen.',true,false,'{"economic_meaning":"replication"}'),
('meiosis',140,'Meiosis','Partes de modelos comprobados se recombinan para producir una nueva unidad.','Debe registrar modelos de origen, componentes heredados y nueva identidad económica.',true,false,'{"economic_meaning":"recombination"}')
on conflict(stage_key) do update set
  stage_order=excluded.stage_order,label=excluded.label,definition=excluded.definition,
  certification_rule=excluded.certification_rule,requires_economic_evidence=excluded.requires_economic_evidence,
  terminal=excluded.terminal,metadata=excluded.metadata,updated_at=now();

create table if not exists public.link_fin_business_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  stage_key text not null references public.link_fin_lifecycle_stage_catalog(stage_key) on delete restrict,
  event_at timestamptz not null,
  certification_status text not null default 'observed' check (certification_status in ('observed','verified','revoked')),
  source_system text not null,
  source_ref text not null,
  evidence_document_id uuid references public.link_world_documents(id) on delete restrict,
  evidence_transaction_id uuid references public.link_world_transactions(id) on delete restrict,
  model_evidence_id uuid references public.link_world_model_evidence(id) on delete restrict,
  evidence_note text,
  period_start date,
  period_end date,
  predecessor_event_id uuid references public.link_fin_business_lifecycle_events(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint link_fin_business_lifecycle_period_chk check (period_end is null or period_start is null or period_end >= period_start)
);

create unique index if not exists link_fin_business_lifecycle_event_identity_uidx
on public.link_fin_business_lifecycle_events(business_id,stage_key,event_at,source_system,source_ref);
create index if not exists link_fin_business_lifecycle_business_stage_idx
on public.link_fin_business_lifecycle_events(business_id,stage_key,event_at desc);

alter table public.link_fin_lifecycle_stage_catalog enable row level security;
alter table public.link_fin_business_lifecycle_events enable row level security;
revoke all on public.link_fin_lifecycle_stage_catalog from anon,authenticated;
revoke all on public.link_fin_business_lifecycle_events from anon,authenticated;
grant select on public.link_fin_lifecycle_stage_catalog to authenticated;
grant select on public.link_fin_business_lifecycle_events to authenticated;

drop policy if exists link_fin_lifecycle_stage_catalog_member_read on public.link_fin_lifecycle_stage_catalog;
create policy link_fin_lifecycle_stage_catalog_member_read on public.link_fin_lifecycle_stage_catalog for select to authenticated using ((select public.link_world_is_member()));
drop policy if exists link_fin_business_lifecycle_member_read on public.link_fin_business_lifecycle_events;
create policy link_fin_business_lifecycle_member_read on public.link_fin_business_lifecycle_events for select to authenticated using ((select public.link_world_is_member()));

create or replace view public.link_fin_business_lifecycle_v with (security_invoker=true) as
with verified as (
  select e.*,c.stage_order,c.label,c.definition,c.certification_rule,c.requires_economic_evidence
  from public.link_fin_business_lifecycle_events e
  join public.link_fin_lifecycle_stage_catalog c on c.stage_key=e.stage_key
  where e.certification_status='verified'
), ranked as (
  select v.*,row_number() over(partition by v.business_id order by v.stage_order desc,v.event_at desc,v.created_at desc) rn
  from verified v
)
select b.id business_id,b.global_id business_global_id,b.slug business_slug,b.name business_name,
  r.stage_key current_stage_key,r.stage_order current_stage_order,r.label current_stage_label,
  r.event_at current_stage_at,r.certification_rule current_stage_rule,
  (select count(*)::integer from public.link_fin_business_lifecycle_events e where e.business_id=b.id and e.certification_status='verified') verified_milestones,
  (select jsonb_agg(jsonb_build_object('stage_key',e.stage_key,'label',c.label,'stage_order',c.stage_order,'event_at',e.event_at,'source_system',e.source_system,'source_ref',e.source_ref,'evidence_document_id',e.evidence_document_id,'evidence_transaction_id',e.evidence_transaction_id,'model_evidence_id',e.model_evidence_id,'evidence_note',e.evidence_note,'metadata',e.metadata) order by c.stage_order,e.event_at)
   from public.link_fin_business_lifecycle_events e join public.link_fin_lifecycle_stage_catalog c on c.stage_key=e.stage_key
   where e.business_id=b.id and e.certification_status='verified') timeline
from public.link_world_businesses b left join ranked r on r.business_id=b.id and r.rn=1;

revoke all on public.link_fin_business_lifecycle_v from anon;
grant select on public.link_fin_business_lifecycle_v to authenticated;

create or replace view public.link_fin_business_lifecycle_gaps_v with (security_invoker=true) as
select b.id business_id,b.slug business_slug,b.name business_name,c.stage_key,c.stage_order,c.label,c.definition,c.certification_rule,c.requires_economic_evidence,
  exists(select 1 from public.link_fin_business_lifecycle_events e where e.business_id=b.id and e.stage_key=c.stage_key and e.certification_status='verified') certified
from public.link_world_businesses b cross join public.link_fin_lifecycle_stage_catalog c;

revoke all on public.link_fin_business_lifecycle_gaps_v from anon;
grant select on public.link_fin_business_lifecycle_gaps_v to authenticated;
