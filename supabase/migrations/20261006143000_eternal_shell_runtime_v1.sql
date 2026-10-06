-- LINK WORLD · Concha Eterna runtime v1
-- Canonical runtime for external ChatGPT "Modo Dios", six-stage model development,
-- business/artifact linkage, and model prospect validation.

create table if not exists public.link_world_model_stage_state (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.link_world_models(id) on delete cascade,
  stage_key text not null check (stage_key in ('marketing','ventas','cierre','onboarding','entrega','postventa')),
  stage_number integer not null check (stage_number between 1 and 6),
  status text not null default 'not_started' check (status in ('not_started','active','blocked','ready','validated')),
  business_id uuid references public.link_world_businesses(id) on delete set null,
  objective text not null,
  strategy text,
  next_action text,
  evidence_required text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(model_id,stage_key)
);

create table if not exists public.link_world_model_stage_artifacts (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.link_world_models(id) on delete cascade,
  stage_key text not null check (stage_key in ('marketing','ventas','cierre','onboarding','entrega','postventa')),
  artifact_id uuid not null references public.link_dot_artifacts(id) on delete cascade,
  role text not null default 'enables' check (role in ('enables','evidence','source','delivery','measurement')),
  status text not null default 'active' check (status in ('proposed','active','historical')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  unique(model_id,stage_key,artifact_id,role)
);

create table if not exists public.link_world_model_prospects (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.link_world_models(id) on delete cascade,
  prospect_id uuid not null references public.link_world_prospect_vault(id) on delete cascade,
  stage_key text not null default 'marketing' check (stage_key in ('marketing','ventas','cierre','onboarding','entrega','postventa')),
  status text not null default 'candidate' check (status in ('candidate','contacted','qualified','proposed','won','lost','archived')),
  strategy text,
  evidence_state text not null default 'unverified' check (evidence_state in ('unverified','observed','verified','rejected')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(model_id,prospect_id)
);

create table if not exists public.link_world_chatgpt_outbox (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('model','model_stage','business','prospect','artifact','system')),
  source_id uuid,
  model_id uuid references public.link_world_models(id) on delete set null,
  business_id uuid references public.link_world_businesses(id) on delete set null,
  stage_key text check (stage_key is null or stage_key in ('marketing','ventas','cierre','onboarding','entrega','postventa')),
  title text not null,
  prompt text not null,
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context)='object'),
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  status text not null default 'queued' check (status in ('queued','copied','working','resolved','cancelled')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  copied_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object')
);

create index if not exists link_world_model_stage_state_model_idx on public.link_world_model_stage_state(model_id,stage_number);
create index if not exists link_world_model_stage_state_business_idx on public.link_world_model_stage_state(business_id,status);
create index if not exists link_world_model_stage_artifacts_model_idx on public.link_world_model_stage_artifacts(model_id,stage_key);
create index if not exists link_world_model_prospects_model_idx on public.link_world_model_prospects(model_id,status);
create index if not exists link_world_chatgpt_outbox_status_idx on public.link_world_chatgpt_outbox(status,priority,created_at desc);
create index if not exists link_world_chatgpt_outbox_model_idx on public.link_world_chatgpt_outbox(model_id,stage_key,status);

drop trigger if exists link_world_model_stage_state_touch on public.link_world_model_stage_state;
create trigger link_world_model_stage_state_touch before update on public.link_world_model_stage_state
for each row execute function public.link_world_touch_updated_at();

drop trigger if exists link_world_model_prospects_touch on public.link_world_model_prospects;
create trigger link_world_model_prospects_touch before update on public.link_world_model_prospects
for each row execute function public.link_world_touch_updated_at();

alter table public.link_world_model_stage_state enable row level security;
alter table public.link_world_model_stage_artifacts enable row level security;
alter table public.link_world_model_prospects enable row level security;
alter table public.link_world_chatgpt_outbox enable row level security;

drop policy if exists link_world_member_model_stage_state_all on public.link_world_model_stage_state;
create policy link_world_member_model_stage_state_all on public.link_world_model_stage_state
for all to authenticated using ((select private.lc_is_active_member()))
with check ((select private.lc_is_active_member()));

drop policy if exists link_world_member_model_stage_artifacts_all on public.link_world_model_stage_artifacts;
create policy link_world_member_model_stage_artifacts_all on public.link_world_model_stage_artifacts
for all to authenticated using ((select private.lc_is_active_member()))
with check ((select private.lc_is_active_member()));

drop policy if exists link_world_member_model_prospects_all on public.link_world_model_prospects;
create policy link_world_member_model_prospects_all on public.link_world_model_prospects
for all to authenticated using ((select private.lc_is_active_member()))
with check ((select private.lc_is_active_member()));

drop policy if exists link_world_member_chatgpt_outbox_all on public.link_world_chatgpt_outbox;
create policy link_world_member_chatgpt_outbox_all on public.link_world_chatgpt_outbox
for all to authenticated using ((select private.lc_is_active_member()))
with check ((select private.lc_is_active_member()));

drop policy if exists link_world_prospect_vault_owner_insert on public.link_world_prospect_vault;
create policy link_world_prospect_vault_owner_insert on public.link_world_prospect_vault
for insert to authenticated with check (link_world_is_owner());

grant select,insert,update,delete on public.link_world_model_stage_state to authenticated;
grant select,insert,update,delete on public.link_world_model_stage_artifacts to authenticated;
grant select,insert,update,delete on public.link_world_model_prospects to authenticated;
grant select,insert,update,delete on public.link_world_chatgpt_outbox to authenticated;
grant insert on public.link_world_prospect_vault to authenticated;

update public.link_stage_processes
set name=case stage_key when 'marketing' then 'MAR' when 'onboarding' then 'Boarding' when 'entrega' then 'Opera' else name end,
metadata=metadata || jsonb_build_object('canonical_label',
  case stage_key when 'marketing' then 'MAR' when 'ventas' then 'Ventas' when 'cierre' then 'Cierre'
  when 'onboarding' then 'Boarding' when 'entrega' then 'Opera' when 'postventa' then 'Postventa' end
),
updated_at=now()
where stage_key in ('marketing','ventas','cierre','onboarding','entrega','postventa');

insert into public.link_world_model_stage_state
(model_id,stage_key,stage_number,status,business_id,objective,strategy,next_action,evidence_required,metadata)
select m.id,s.stage_key,s.stage_number,case when s.stage_number=1 then 'active' else 'not_started' end,m.origin_business_id,
case s.stage_key
 when 'marketing' then 'Encontrar y entender el mercado real donde este modelo resuelve un dolor.'
 when 'ventas' then 'Convertir el dolor validado en una propuesta comprensible y una oportunidad comercial real.'
 when 'cierre' then 'Conseguir compromiso verificable: aceptación, contrato, reserva o pago.'
 when 'onboarding' then 'Transformar el cierre en un caso ejecutable con datos, recursos, responsables y handoff.'
 when 'entrega' then 'Ejecutar la promesa usando artefactos concretos y registrar el resultado.'
 when 'postventa' then 'Verificar impacto, recurrencia, recomendación y aprendizaje reutilizable.' end,
case s.stage_key
 when 'marketing' then 'Segmentar, observar territorio, capturar prospectos y validar el dolor.'
 when 'ventas' then 'Construir oferta, precio, argumento, canal y siguiente paso.'
 when 'cierre' then 'Eliminar incertidumbre final y registrar evidencia económica.'
 when 'onboarding' then 'Crear checklist, expediente y traspaso sin pérdida de información.'
 when 'entrega' then 'Operar con el artefacto responsable y medir cumplimiento.'
 when 'postventa' then 'Medir satisfacción, resultado económico y nueva oportunidad.' end,
case s.stage_key
 when 'marketing' then 'Conseguir al menos un prospecto real adecuado para validar el modelo.'
 when 'ventas' then 'Convertir un prospecto adecuado en oportunidad con propuesta.'
 when 'cierre' then 'Obtener una decisión económica verificable.'
 when 'onboarding' then 'Completar la información mínima para ejecutar sin improvisación.'
 when 'entrega' then 'Entregar la solución y adjuntar evidencia del resultado.'
 when 'postventa' then 'Registrar resultado, aprendizaje y posibilidad de repetición.' end,
case s.stage_key
 when 'marketing' then 'Prospecto real + señal de dolor o interés.'
 when 'ventas' then 'Propuesta o cotización enviada + respuesta.'
 when 'cierre' then 'Pago, contrato, reserva o rechazo explícito.'
 when 'onboarding' then 'Checklist completo + handoff aceptado.'
 when 'entrega' then 'Artefacto utilizado + entrega comprobada.'
 when 'postventa' then 'Resultado medido + feedback + siguiente acción.' end,
jsonb_build_object('canonical_label',
  case s.stage_key when 'marketing' then 'MAR' when 'ventas' then 'Ventas' when 'cierre' then 'Cierre'
  when 'onboarding' then 'Boarding' when 'entrega' then 'Opera' when 'postventa' then 'Postventa' end)
from public.link_world_models m
cross join (values ('marketing',1),('ventas',2),('cierre',3),('onboarding',4),('entrega',5),('postventa',6)) s(stage_key,stage_number)
on conflict (model_id,stage_key) do nothing;

insert into public.link_world_model_stage_artifacts(model_id,stage_key,artifact_id,role,status,metadata)
select m.id,'entrega',a.id,'delivery','active','{"seed":"known_artifact"}'::jsonb
from public.link_world_models m join public.link_dot_artifacts a on a.artifact_key='link-karaoke-caracol'
where m.model_key='karaoke_recurring_venue_v1' on conflict do nothing;

insert into public.link_world_model_stage_artifacts(model_id,stage_key,artifact_id,role,status,metadata)
select m.id,'marketing',a.id,'enables','active','{"seed":"known_artifact"}'::jsonb
from public.link_world_models m join public.link_dot_artifacts a on a.artifact_key='caracol-oct-2026-brief'
where m.model_key='monthly_content_rrss_v1' on conflict do nothing;

insert into public.link_world_model_stage_artifacts(model_id,stage_key,artifact_id,role,status,metadata)
select m.id,'ventas',a.id,'enables','active','{"seed":"known_artifact"}'::jsonb
from public.link_world_models m join public.link_dot_artifacts a on a.artifact_key='he-link-ventas'
where m.model_key='tourism_intermediation_traceability_v1' on conflict do nothing;

insert into public.link_world_model_stage_artifacts(model_id,stage_key,artifact_id,role,status,metadata)
select m.id,'onboarding',a.id,'enables','active','{"seed":"known_artifact"}'::jsonb
from public.link_world_models m join public.link_dot_artifacts a on a.artifact_key='he-sales-ops-handoff'
where m.model_key='tourism_intermediation_traceability_v1' on conflict do nothing;

insert into public.link_world_model_stage_artifacts(model_id,stage_key,artifact_id,role,status,metadata)
select m.id,'entrega',a.id,'delivery','active','{"seed":"known_artifact"}'::jsonb
from public.link_world_models m join public.link_dot_artifacts a on a.artifact_key='he-operations'
where m.model_key='tourism_intermediation_traceability_v1' on conflict do nothing;

insert into public.link_world_model_stage_artifacts(model_id,stage_key,artifact_id,role,status,metadata)
select m.id,'marketing',a.id,'source','active','{"seed":"known_artifact"}'::jsonb
from public.link_world_models m join public.link_dot_artifacts a on a.artifact_key='conversation-control'
where m.model_key='consultative_conversation_sales_v1' on conflict do nothing;

create or replace view public.link_world_chatgpt_outbox_pending_v
with (security_invoker=true) as
select o.id,o.title,o.prompt,o.source_type,o.source_id,o.model_id,m.model_key,m.name as model_name,
       o.business_id,b.name as business_name,o.stage_key,
       case o.stage_key when 'marketing' then 'MAR' when 'ventas' then 'Ventas' when 'cierre' then 'Cierre'
         when 'onboarding' then 'Boarding' when 'entrega' then 'Opera' when 'postventa' then 'Postventa' end as stage_name,
       o.priority,o.status,o.context,o.created_at,o.copied_at
from public.link_world_chatgpt_outbox o
left join public.link_world_models m on m.id=o.model_id
left join public.link_world_businesses b on b.id=o.business_id
where o.status in ('queued','copied','working')
order by case o.priority when 'critical' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,o.created_at desc;

grant select on public.link_world_chatgpt_outbox_pending_v to authenticated;
