-- LINK Sales Learning Cycle v1
-- Closes the traceable loop: lead -> quote -> follow-up -> verified outcome -> Cortex observation.
-- The operational owner keeps reservations and payments. This layer stores commercial state,
-- immutable offer snapshots, references to outcomes, and non-PII ecosystem events.

create schema if not exists private;

alter table public.sales_leads
  add column if not exists business_id uuid null references public.link_world_businesses(id) on delete restrict,
  add column if not exists external_ref text null,
  add column if not exists next_followup_at timestamptz null,
  add column if not exists last_contact_at timestamptz null,
  add column if not exists closed_at timestamptz null,
  add column if not exists loss_reason text null,
  add column if not exists outcome jsonb not null default '{}'::jsonb;

alter table public.sales_leads
  drop constraint if exists sales_leads_outcome_json_chk;
alter table public.sales_leads
  add constraint sales_leads_outcome_json_chk check (jsonb_typeof(outcome)='object');

create unique index if not exists sales_leads_business_source_external_uidx
  on public.sales_leads(business_id,source,external_ref)
  where business_id is not null and external_ref is not null;
create index if not exists sales_leads_business_stage_idx
  on public.sales_leads(business_id,stage,updated_at desc);
create index if not exists sales_leads_followup_due_idx
  on public.sales_leads(next_followup_at)
  where next_followup_at is not null and stage not in ('won','lost');

create table if not exists public.sales_quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.sales_leads(id) on delete cascade,
  business_id uuid not null references public.link_world_businesses(id) on delete restrict,
  quote_number text not null unique default (
    'Q-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))
  ),
  external_ref text null,
  version integer not null,
  status text not null default 'issued',
  product_key text null,
  currency text not null default 'CLP',
  base_amount numeric(14,2) not null default 0,
  adjustments_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null,
  valid_until timestamptz null,
  snapshot jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  issued_at timestamptz not null default now(),
  accepted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_quotes_version_chk check (version >= 1),
  constraint sales_quotes_status_chk check (status in ('draft','issued','accepted','expired','withdrawn','rejected')),
  constraint sales_quotes_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint sales_quotes_amounts_chk check (
    base_amount >= 0 and adjustments_amount >= 0 and tax_amount >= 0 and total_amount >= 0
    and total_amount = base_amount + adjustments_amount + tax_amount
  ),
  constraint sales_quotes_snapshot_chk check (jsonb_typeof(snapshot)='object'),
  constraint sales_quotes_lead_version_uidx unique (lead_id,version)
);

create index if not exists sales_quotes_business_status_idx
  on public.sales_quotes(business_id,status,issued_at desc);
create index if not exists sales_quotes_lead_idx
  on public.sales_quotes(lead_id,version desc);

create table if not exists public.sales_cycle_outcomes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.sales_leads(id) on delete cascade,
  business_id uuid not null references public.link_world_businesses(id) on delete restrict,
  outcome text not null,
  evidence_type text not null,
  evidence_ref text null,
  amount numeric(14,2) null,
  currency text not null default 'CLP',
  loss_reason text null,
  verified boolean not null default false,
  evidence jsonb not null default '{}'::jsonb,
  learning_snapshot jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  confirmed_at timestamptz not null default now(),
  approved_by text null,
  created_at timestamptz not null default now(),
  constraint sales_cycle_outcomes_kind_chk check (outcome in ('won','lost','cancelled')),
  constraint sales_cycle_outcomes_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint sales_cycle_outcomes_amount_chk check (amount is null or amount >= 0),
  constraint sales_cycle_outcomes_evidence_chk check (jsonb_typeof(evidence)='object'),
  constraint sales_cycle_outcomes_learning_chk check (jsonb_typeof(learning_snapshot)='object'),
  constraint sales_cycle_outcomes_semantics_chk check (
    (outcome='won' and evidence_ref is not null and amount is not null and verified=true)
    or (outcome in ('lost','cancelled') and loss_reason is not null)
  )
);

create unique index if not exists sales_cycle_outcomes_won_evidence_uidx
  on public.sales_cycle_outcomes(evidence_type,evidence_ref)
  where outcome='won' and evidence_ref is not null;
create index if not exists sales_cycle_outcomes_business_date_idx
  on public.sales_cycle_outcomes(business_id,confirmed_at desc);

alter table public.sales_events
  add column if not exists business_id uuid null references public.link_world_businesses(id) on delete restrict,
  add column if not exists quote_id uuid null references public.sales_quotes(id) on delete set null,
  add column if not exists outcome_id uuid null references public.sales_cycle_outcomes(id) on delete set null,
  add column if not exists idempotency_key text null,
  add column if not exists actor text not null default 'system',
  add column if not exists occurred_at timestamptz not null default now();

create unique index if not exists sales_events_idempotency_uidx
  on public.sales_events(idempotency_key)
  where idempotency_key is not null;
create index if not exists sales_events_lead_occurred_idx
  on public.sales_events(lead_id,occurred_at desc);
create index if not exists sales_events_business_type_idx
  on public.sales_events(business_id,event_type,occurred_at desc);

alter table public.sales_quotes enable row level security;
alter table public.sales_cycle_outcomes enable row level security;

revoke all on public.sales_leads, public.sales_events, public.sales_quotes, public.sales_cycle_outcomes from anon;
revoke insert,update,delete on public.sales_leads, public.sales_events, public.sales_quotes, public.sales_cycle_outcomes from authenticated;
grant select on public.sales_leads, public.sales_events, public.sales_quotes, public.sales_cycle_outcomes to authenticated;
grant all on public.sales_leads, public.sales_events, public.sales_quotes, public.sales_cycle_outcomes to service_role;

drop policy if exists sales_leads_member_select on public.sales_leads;
create policy sales_leads_member_select on public.sales_leads
for select to authenticated using ((select public.link_world_is_member()));

drop policy if exists sales_events_member_select on public.sales_events;
create policy sales_events_member_select on public.sales_events
for select to authenticated using ((select public.link_world_is_member()));

drop policy if exists sales_quotes_member_select on public.sales_quotes;
create policy sales_quotes_member_select on public.sales_quotes
for select to authenticated using ((select public.link_world_is_member()));

drop policy if exists sales_cycle_outcomes_member_select on public.sales_cycle_outcomes;
create policy sales_cycle_outcomes_member_select on public.sales_cycle_outcomes
for select to authenticated using ((select public.link_world_is_member()));

drop trigger if exists sales_leads_touch on public.sales_leads;
create trigger sales_leads_touch before update on public.sales_leads
for each row execute function public.set_updated_at();

drop trigger if exists sales_quotes_touch on public.sales_quotes;
create trigger sales_quotes_touch before update on public.sales_quotes
for each row execute function public.set_updated_at();

create or replace function private.sales_cycle_caller_authorized_v1()
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(public.link_world_is_member(),false)
    or coalesce(auth.jwt()->>'role','')='service_role';
$$;

revoke all on function private.sales_cycle_caller_authorized_v1() from public,anon,authenticated;
grant execute on function private.sales_cycle_caller_authorized_v1() to service_role;

create or replace function private.sales_cycle_append_event_v1(
  p_lead_id uuid,
  p_event_type text,
  p_idempotency_key text,
  p_payload jsonb default '{}'::jsonb,
  p_actor text default 'system',
  p_quote_id uuid default null,
  p_outcome_id uuid default null,
  p_occurred_at timestamptz default now()
)
returns bigint
language plpgsql
security definer
set search_path=''
as $$
declare
  v_lead public.sales_leads%rowtype;
  v_event_id bigint;
begin
  if nullif(btrim(p_event_type),'') is null or nullif(btrim(p_idempotency_key),'') is null then
    raise exception 'event_type and idempotency_key are required';
  end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then
    raise exception 'event payload must be a JSON object';
  end if;

  select * into v_lead from public.sales_leads where id=p_lead_id;
  if not found then raise exception 'sales lead not found'; end if;

  insert into public.sales_events(
    control_id,client_id,project_id,lead_id,business_id,session_id,
    event_type,event_name,cta_id,pack_key,product_key,page_path,payload,
    quote_id,outcome_id,idempotency_key,actor,occurred_at,created_at
  ) values (
    v_lead.control_id,v_lead.client_id,v_lead.project_id,v_lead.id,v_lead.business_id,null,
    btrim(p_event_type),initcap(replace(btrim(p_event_type),'.',' ')),
    v_lead.source_cta,v_lead.interested_pack,v_lead.interested_product,v_lead.source_page,
    p_payload,p_quote_id,p_outcome_id,btrim(p_idempotency_key),coalesce(nullif(btrim(p_actor),''),'system'),
    coalesce(p_occurred_at,now()),coalesce(p_occurred_at,now())
  )
  on conflict (idempotency_key) where idempotency_key is not null do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select id into v_event_id from public.sales_events where idempotency_key=p_idempotency_key;
  end if;
  return v_event_id;
end;
$$;

revoke all on function private.sales_cycle_append_event_v1(uuid,text,text,jsonb,text,uuid,uuid,timestamptz) from public,anon,authenticated;
grant execute on function private.sales_cycle_append_event_v1(uuid,text,text,jsonb,text,uuid,uuid,timestamptz) to service_role;

create or replace function private.sales_cycle_capture_lead_core_v1(
  p_business_id uuid,
  p_source text,
  p_external_ref text,
  p_contact jsonb,
  p_need jsonb,
  p_attribution jsonb,
  p_idempotency_key text,
  p_next_followup_at timestamptz default null,
  p_actor text default 'system'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_lead public.sales_leads%rowtype;
  v_source text;
  v_external_ref text;
begin
  if not exists(select 1 from public.link_world_businesses where id=p_business_id) then
    raise exception 'business not found';
  end if;
  if p_contact is null or jsonb_typeof(p_contact)<>'object'
     or p_need is null or jsonb_typeof(p_need)<>'object'
     or p_attribution is null or jsonb_typeof(p_attribution)<>'object' then
    raise exception 'contact, need and attribution must be JSON objects';
  end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'idempotency_key is required'; end if;

  v_source := coalesce(nullif(btrim(p_source),''),'link-sales');
  v_external_ref := coalesce(nullif(btrim(p_external_ref),''),'idem:'||btrim(p_idempotency_key));

  insert into public.sales_leads(
    control_id,business_id,source,external_ref,source_page,source_cta,
    full_name,email,phone,company,interested_pack,interested_product,budget_range,
    message,stage,score,metadata,next_followup_at,last_contact_at
  ) values (
    '00000000-0000-0000-0000-000000000001'::uuid,p_business_id,v_source,v_external_ref,
    nullif(btrim(p_attribution->>'source_page'),''),nullif(btrim(p_attribution->>'source_cta'),''),
    nullif(btrim(p_contact->>'full_name'),''),nullif(btrim(p_contact->>'email'),''),
    nullif(btrim(p_contact->>'phone'),''),nullif(btrim(p_contact->>'company'),''),
    nullif(btrim(p_need->>'pack_key'),''),nullif(btrim(p_need->>'product_key'),''),
    nullif(btrim(p_need->>'budget_range'),''),nullif(btrim(p_need->>'message'),''),
    'new',greatest(0,least(100,coalesce(nullif(p_need->>'score','')::smallint,0))),
    jsonb_build_object('need',p_need,'attribution',p_attribution,'capture_idempotency_key',p_idempotency_key),
    p_next_followup_at,null
  )
  on conflict (business_id,source,external_ref)
    where business_id is not null and external_ref is not null
  do update set
    full_name=coalesce(excluded.full_name,public.sales_leads.full_name),
    email=coalesce(excluded.email,public.sales_leads.email),
    phone=coalesce(excluded.phone,public.sales_leads.phone),
    company=coalesce(excluded.company,public.sales_leads.company),
    interested_pack=coalesce(excluded.interested_pack,public.sales_leads.interested_pack),
    interested_product=coalesce(excluded.interested_product,public.sales_leads.interested_product),
    budget_range=coalesce(excluded.budget_range,public.sales_leads.budget_range),
    message=coalesce(excluded.message,public.sales_leads.message),
    score=greatest(public.sales_leads.score,excluded.score),
    metadata=public.sales_leads.metadata || excluded.metadata,
    next_followup_at=coalesce(excluded.next_followup_at,public.sales_leads.next_followup_at),
    updated_at=now()
  returning * into v_lead;

  perform private.sales_cycle_append_event_v1(
    v_lead.id,'lead.created',p_idempotency_key||':lead.created',
    jsonb_build_object('source',v_lead.source,'external_ref',v_lead.external_ref,'stage',v_lead.stage),
    p_actor,null,null,now()
  );

  return jsonb_build_object(
    'lead_id',v_lead.id,'business_id',v_lead.business_id,'stage',v_lead.stage,
    'external_ref',v_lead.external_ref,'next_followup_at',v_lead.next_followup_at
  );
end;
$$;

revoke all on function private.sales_cycle_capture_lead_core_v1(uuid,text,text,jsonb,jsonb,jsonb,text,timestamptz,text) from public,anon,authenticated;
grant execute on function private.sales_cycle_capture_lead_core_v1(uuid,text,text,jsonb,jsonb,jsonb,text,timestamptz,text) to service_role;

create or replace function private.sales_cycle_issue_quote_core_v1(
  p_lead_id uuid,
  p_product_key text,
  p_currency text,
  p_base_amount numeric,
  p_adjustments_amount numeric,
  p_tax_amount numeric,
  p_total_amount numeric,
  p_valid_until timestamptz,
  p_snapshot jsonb,
  p_idempotency_key text,
  p_external_ref text default null,
  p_actor text default 'system'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_lead public.sales_leads%rowtype;
  v_quote public.sales_quotes%rowtype;
  v_version integer;
begin
  if p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' then raise exception 'snapshot must be a JSON object'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'idempotency_key is required'; end if;
  if upper(coalesce(p_currency,'')) !~ '^[A-Z]{3}$' then raise exception 'invalid currency'; end if;
  if coalesce(p_base_amount,-1)<0 or coalesce(p_adjustments_amount,-1)<0 or coalesce(p_tax_amount,-1)<0
     or coalesce(p_total_amount,-1)<0
     or p_total_amount <> p_base_amount+p_adjustments_amount+p_tax_amount then
    raise exception 'quote amounts are invalid';
  end if;

  select * into v_lead from public.sales_leads where id=p_lead_id for update;
  if not found then raise exception 'sales lead not found'; end if;
  if v_lead.stage in ('won','lost') then raise exception 'sales cycle is already closed'; end if;

  select * into v_quote from public.sales_quotes where idempotency_key=p_idempotency_key;
  if found then
    return jsonb_build_object('quote_id',v_quote.id,'quote_number',v_quote.quote_number,'version',v_quote.version,'status',v_quote.status,'total_amount',v_quote.total_amount,'currency',v_quote.currency);
  end if;

  select coalesce(max(version),0)+1 into v_version from public.sales_quotes where lead_id=p_lead_id;
  update public.sales_quotes set status='withdrawn',updated_at=now()
  where lead_id=p_lead_id and status='issued';

  insert into public.sales_quotes(
    lead_id,business_id,external_ref,version,status,product_key,currency,
    base_amount,adjustments_amount,tax_amount,total_amount,valid_until,snapshot,idempotency_key,issued_at
  ) values (
    v_lead.id,v_lead.business_id,nullif(btrim(p_external_ref),''),v_version,'issued',
    coalesce(nullif(btrim(p_product_key),''),v_lead.interested_product),upper(p_currency),
    p_base_amount,p_adjustments_amount,p_tax_amount,p_total_amount,p_valid_until,p_snapshot,p_idempotency_key,now()
  ) returning * into v_quote;

  update public.sales_leads
  set stage='proposal',interested_product=coalesce(interested_product,v_quote.product_key),
      last_contact_at=now(),next_followup_at=coalesce(p_valid_until,now()+interval '24 hours'),updated_at=now()
  where id=v_lead.id;

  perform private.sales_cycle_append_event_v1(
    v_lead.id,'quote.issued',p_idempotency_key||':quote.issued',
    jsonb_build_object('quote_number',v_quote.quote_number,'version',v_quote.version,
      'product_key',v_quote.product_key,'currency',v_quote.currency,'total_amount',v_quote.total_amount,
      'valid_until',v_quote.valid_until),
    p_actor,v_quote.id,null,now()
  );

  return jsonb_build_object('quote_id',v_quote.id,'quote_number',v_quote.quote_number,'version',v_quote.version,'status',v_quote.status,'total_amount',v_quote.total_amount,'currency',v_quote.currency,'valid_until',v_quote.valid_until);
end;
$$;

revoke all on function private.sales_cycle_issue_quote_core_v1(uuid,text,text,numeric,numeric,numeric,numeric,timestamptz,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function private.sales_cycle_issue_quote_core_v1(uuid,text,text,numeric,numeric,numeric,numeric,timestamptz,jsonb,text,text,text) to service_role;

create or replace function private.sales_cycle_schedule_followup_core_v1(
  p_lead_id uuid,
  p_due_at timestamptz,
  p_channel text,
  p_reason text,
  p_idempotency_key text,
  p_actor text default 'system'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_lead public.sales_leads%rowtype;
begin
  if p_due_at is null or p_due_at<=now() then raise exception 'follow-up must be scheduled in the future'; end if;
  if nullif(btrim(p_reason),'') is null or nullif(btrim(p_idempotency_key),'') is null then raise exception 'reason and idempotency_key are required'; end if;
  select * into v_lead from public.sales_leads where id=p_lead_id for update;
  if not found then raise exception 'sales lead not found'; end if;
  if v_lead.stage in ('won','lost') then raise exception 'sales cycle is already closed'; end if;

  update public.sales_leads set next_followup_at=p_due_at,updated_at=now() where id=p_lead_id returning * into v_lead;
  perform private.sales_cycle_append_event_v1(
    p_lead_id,'followup.scheduled',p_idempotency_key||':followup.scheduled',
    jsonb_build_object('due_at',p_due_at,'channel',coalesce(nullif(btrim(p_channel),''),'unspecified'),'reason',p_reason),
    p_actor,null,null,now()
  );
  return jsonb_build_object('lead_id',p_lead_id,'stage',v_lead.stage,'next_followup_at',v_lead.next_followup_at);
end;
$$;

revoke all on function private.sales_cycle_schedule_followup_core_v1(uuid,timestamptz,text,text,text,text) from public,anon,authenticated;
grant execute on function private.sales_cycle_schedule_followup_core_v1(uuid,timestamptz,text,text,text,text) to service_role;

create or replace function private.sales_cycle_close_core_v1(
  p_lead_id uuid,
  p_outcome text,
  p_evidence_type text,
  p_evidence_ref text,
  p_amount numeric,
  p_currency text,
  p_loss_reason text,
  p_evidence jsonb,
  p_learning_snapshot jsonb,
  p_idempotency_key text,
  p_approved_by text default null,
  p_actor text default 'system'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_lead public.sales_leads%rowtype;
  v_outcome public.sales_cycle_outcomes%rowtype;
  v_business_slug text;
  v_payment public.taxi_hotel_payments%rowtype;
  v_reservation public.taxi_hotel_reservations%rowtype;
  v_verified boolean := false;
begin
  if p_outcome not in ('won','lost','cancelled') then raise exception 'invalid outcome'; end if;
  if p_evidence is null or jsonb_typeof(p_evidence)<>'object'
     or p_learning_snapshot is null or jsonb_typeof(p_learning_snapshot)<>'object' then
    raise exception 'evidence and learning_snapshot must be JSON objects';
  end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'idempotency_key is required'; end if;

  select * into v_lead from public.sales_leads where id=p_lead_id for update;
  if not found then raise exception 'sales lead not found'; end if;
  select slug into v_business_slug from public.link_world_businesses where id=v_lead.business_id;

  select * into v_outcome from public.sales_cycle_outcomes where lead_id=p_lead_id;
  if found then
    if v_outcome.idempotency_key<>p_idempotency_key then raise exception 'sales cycle already has a different final outcome'; end if;
    return jsonb_build_object('outcome_id',v_outcome.id,'lead_id',v_outcome.lead_id,'outcome',v_outcome.outcome,'verified',v_outcome.verified,'amount',v_outcome.amount,'currency',v_outcome.currency);
  end if;

  if p_outcome='won' then
    if nullif(btrim(p_evidence_ref),'') is null or p_amount is null or p_amount<0 then
      raise exception 'won outcome requires evidence_ref and non-negative amount';
    end if;
    if v_business_slug='taxi-hotel' and p_evidence_type='taxi_hotel_payment' then
      select * into v_payment from public.taxi_hotel_payments where id=p_evidence_ref::uuid and status='paid';
      if not found then raise exception 'paid Taxi Hotel payment not found'; end if;
      select * into v_reservation from public.taxi_hotel_reservations where id=v_payment.reservation_id;
      if v_lead.external_ref <> 'taxi_hotel_reservation:'||v_reservation.id::text then raise exception 'payment does not belong to this sales cycle'; end if;
      if v_payment.amount_clp<>p_amount or v_payment.currency<>upper(p_currency) then raise exception 'payment amount or currency does not match'; end if;
      v_verified := true;
    elsif nullif(btrim(p_approved_by),'') is not null then
      v_verified := true;
    else
      raise exception 'non-operational win requires a human approval reference';
    end if;
  else
    if nullif(btrim(p_loss_reason),'') is null then raise exception 'lost or cancelled outcome requires loss_reason'; end if;
    v_verified := true;
  end if;

  insert into public.sales_cycle_outcomes(
    lead_id,business_id,outcome,evidence_type,evidence_ref,amount,currency,loss_reason,
    verified,evidence,learning_snapshot,idempotency_key,confirmed_at,approved_by
  ) values (
    v_lead.id,v_lead.business_id,p_outcome,coalesce(nullif(btrim(p_evidence_type),''),'declared'),
    nullif(btrim(p_evidence_ref),''),case when p_outcome='won' then p_amount else null end,
    upper(coalesce(nullif(btrim(p_currency),''),'CLP')),nullif(btrim(p_loss_reason),''),
    v_verified,p_evidence,p_learning_snapshot,p_idempotency_key,now(),nullif(btrim(p_approved_by),'')
  ) returning * into v_outcome;

  update public.sales_leads
  set stage=case when p_outcome='won' then 'won' else 'lost' end,
      closed_at=v_outcome.confirmed_at,next_followup_at=null,loss_reason=v_outcome.loss_reason,
      outcome=jsonb_build_object('outcome_id',v_outcome.id,'result',v_outcome.outcome,
        'verified',v_outcome.verified,'amount',v_outcome.amount,'currency',v_outcome.currency,
        'evidence_type',v_outcome.evidence_type,'confirmed_at',v_outcome.confirmed_at),
      updated_at=now()
  where id=v_lead.id;

  update public.sales_quotes
  set status=case when p_outcome='won' then 'accepted' else 'rejected' end,
      accepted_at=case when p_outcome='won' then v_outcome.confirmed_at else accepted_at end,
      updated_at=now()
  where lead_id=v_lead.id and status='issued';

  perform private.sales_cycle_append_event_v1(
    v_lead.id,case when p_outcome='won' then 'sale.won' else 'sale.'||p_outcome end,
    p_idempotency_key||':sale.'||p_outcome,
    jsonb_build_object('result',p_outcome,'verified',v_verified,'amount',v_outcome.amount,
      'currency',v_outcome.currency,'loss_reason',v_outcome.loss_reason,'evidence_type',v_outcome.evidence_type),
    p_actor,null,v_outcome.id,v_outcome.confirmed_at
  );

  return jsonb_build_object('outcome_id',v_outcome.id,'lead_id',v_outcome.lead_id,'outcome',v_outcome.outcome,'verified',v_outcome.verified,'amount',v_outcome.amount,'currency',v_outcome.currency);
end;
$$;

revoke all on function private.sales_cycle_close_core_v1(uuid,text,text,text,numeric,text,text,jsonb,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function private.sales_cycle_close_core_v1(uuid,text,text,text,numeric,text,text,jsonb,jsonb,text,text,text) to service_role;

create or replace function private.sales_cycle_publish_event_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_global_id text;
begin
  select global_id into v_global_id from public.link_world_businesses where id=new.business_id;
  if v_global_id is null then return new; end if;

  insert into public.event_bus(
    control_id,source_provider,event_type,entity_type,global_id,external_id,
    correlation_id,dedupe_key,payload,occurred_at
  ) values (
    new.control_id,'link-sales',new.event_type,'sales_lead',v_global_id,new.lead_id::text,
    new.lead_id::text,'sales:'||coalesce(new.idempotency_key,new.id::text),
    (coalesce(new.payload,'{}'::jsonb)-'message'-'content'-'email'-'phone') ||
      jsonb_build_object('sales_event_id',new.id,'lead_id',new.lead_id,'business_id',new.business_id,
        'quote_id',new.quote_id,'outcome_id',new.outcome_id,'actor',new.actor),
    new.occurred_at
  ) on conflict (dedupe_key) do nothing;
  return new;
end;
$$;

revoke all on function private.sales_cycle_publish_event_v1() from public,anon,authenticated;

drop trigger if exists sales_cycle_publish_event on public.sales_events;
create trigger sales_cycle_publish_event after insert on public.sales_events
for each row execute function private.sales_cycle_publish_event_v1();

create unique index if not exists link_learnings_sales_outcome_source_uidx
  on public.link_learnings(source_kind,source_ref)
  where source_kind='sales_cycle_outcome';

create or replace function private.sales_cycle_capture_learning_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_business_name text;
  v_product text;
  v_source text;
begin
  select b.name,l.interested_product,l.source into v_business_name,v_product,v_source
  from public.sales_leads l join public.link_world_businesses b on b.id=l.business_id
  where l.id=new.lead_id;

  insert into public.link_learnings(
    title,description,learning_type,lifecycle_status,confidence,evidence,source_kind,source_ref,created_at
  ) values (
    case when new.outcome='won' then 'Venta confirmada · ' else 'Ciclo comercial '||new.outcome||' · ' end || v_business_name,
    'Observación individual del ciclo comercial. Requiere contraste con otros casos antes de convertirse en patrón o regla.',
    'observation','observed',case when new.verified then 1 else 0.6 end,
    jsonb_build_object('sales_outcome_id',new.id,'lead_id',new.lead_id,'business_id',new.business_id,
      'result',new.outcome,'product_key',v_product,'source',v_source,'amount',new.amount,
      'currency',new.currency,'loss_reason',new.loss_reason,'evidence_type',new.evidence_type,
      'learning_snapshot',new.learning_snapshot,'confirmed_at',new.confirmed_at),
    'sales_cycle_outcome',new.id::text,now()
  ) on conflict (source_kind,source_ref) where source_kind='sales_cycle_outcome' do nothing;
  return new;
end;
$$;

revoke all on function private.sales_cycle_capture_learning_v1() from public,anon,authenticated;

drop trigger if exists sales_cycle_capture_learning on public.sales_cycle_outcomes;
create trigger sales_cycle_capture_learning after insert on public.sales_cycle_outcomes
for each row execute function private.sales_cycle_capture_learning_v1();

create or replace function private.sales_cycle_assessment_enrich_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_lead public.sales_leads%rowtype;
begin
  if new.source_type='sales_lead' then
    select * into v_lead from public.sales_leads where id=new.source_id::uuid;
    if found then
      new.business_id := v_lead.business_id;
      new.due_at := v_lead.next_followup_at;
      new.metadata := coalesce(new.metadata,'{}'::jsonb) || jsonb_build_object(
        'business_id',v_lead.business_id,'external_ref',v_lead.external_ref,
        'next_followup_at',v_lead.next_followup_at,'closed_at',v_lead.closed_at,
        'loss_reason',v_lead.loss_reason,'verified_outcome',v_lead.outcome
      );
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.sales_cycle_assessment_enrich_v1() from public,anon,authenticated;

drop trigger if exists sales_cycle_assessment_enrich on public.link_conversion_assessments;
create trigger sales_cycle_assessment_enrich before insert or update on public.link_conversion_assessments
for each row execute function private.sales_cycle_assessment_enrich_v1();

create or replace function private.sales_cycle_enrich_daily_report_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_won integer;
  v_lost integer;
  v_revenue numeric;
  v_quotes integer;
  v_followups_due integer;
  v_manual_closures integer;
  v_base_summary text;
begin
  select count(*) filter(where outcome='won')::int,
         count(*) filter(where outcome in ('lost','cancelled'))::int,
         coalesce(sum(amount) filter(where outcome='won' and verified),0)
  into v_won,v_lost,v_revenue
  from public.sales_cycle_outcomes
  where confirmed_at>=new.period_start and confirmed_at<new.period_end;

  select count(*)::int into v_quotes from public.sales_quotes
  where issued_at>=new.period_start and issued_at<new.period_end;

  select count(*)::int into v_followups_due from public.sales_leads
  where stage not in ('won','lost') and next_followup_at is not null and next_followup_at<=now();

  v_manual_closures := coalesce(nullif(new.metrics->>'manual_progress_closures','')::int,
                                nullif(new.metrics->>'closures','')::int,0);
  new.metrics := coalesce(new.metrics,'{}'::jsonb) || jsonb_build_object(
    'closures',v_won+v_lost,'won_sales',v_won,'lost_sales',v_lost,
    'confirmed_revenue_clp',v_revenue,'quotes_issued',v_quotes,
    'followups_due_current',v_followups_due,'manual_progress_closures',v_manual_closures,
    'sales_metrics_source','sales_cycle_outcomes_v1'
  );
  v_base_summary := split_part(coalesce(new.conversion_summary,''),' Ventas verificadas:',1);
  new.conversion_summary := v_base_summary || format(
    ' Ventas verificadas: ganadas=%s · perdidas=%s · ingresos confirmados CLP=%s · cotizaciones=%s · seguimientos vencidos=%s.',
    v_won,v_lost,v_revenue,v_quotes,v_followups_due
  );
  return new;
end;
$$;

revoke all on function private.sales_cycle_enrich_daily_report_v1() from public,anon,authenticated;

drop trigger if exists sales_cycle_enrich_daily_report on public.link_daily_intelligence_reports;
create trigger sales_cycle_enrich_daily_report before insert or update on public.link_daily_intelligence_reports
for each row execute function private.sales_cycle_enrich_daily_report_v1();

create or replace function private.sales_cycle_sync_daily_cortex_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_content text;
begin
  if new.cortex_document_id is null then return new; end if;
  select split_part(content,E'\n\n## Ventas verificadas') into v_content
  from public.link_cortex_documents where id=new.cortex_document_id;
  update public.link_cortex_documents
  set content=coalesce(v_content,'') || E'\n\n## Ventas verificadas\n' ||
      format('- Ganadas: %s\n- Perdidas/canceladas: %s\n- Ingresos confirmados CLP: %s\n- Cotizaciones emitidas: %s\n- Seguimientos vencidos ahora: %s',
        coalesce(new.metrics->>'won_sales','0'),coalesce(new.metrics->>'lost_sales','0'),
        coalesce(new.metrics->>'confirmed_revenue_clp','0'),coalesce(new.metrics->>'quotes_issued','0'),
        coalesce(new.metrics->>'followups_due_current','0')),
      metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object('verified_sales_metrics',new.metrics),
      updated_at=now()
  where id=new.cortex_document_id;
  return new;
end;
$$;

revoke all on function private.sales_cycle_sync_daily_cortex_v1() from public,anon,authenticated;

drop trigger if exists sales_cycle_sync_daily_cortex on public.link_daily_intelligence_reports;
create trigger sales_cycle_sync_daily_cortex after insert or update of cortex_document_id,metrics on public.link_daily_intelligence_reports
for each row execute function private.sales_cycle_sync_daily_cortex_v1();

create or replace function private.sales_cycle_from_taxi_reservation_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_business_id uuid;
  v_minutes integer;
  v_lead_result jsonb;
  v_lead_id uuid;
begin
  select id into v_business_id from public.link_world_businesses where slug='taxi-hotel' limit 1;
  if v_business_id is null then raise exception 'Taxi Hotel business identity is missing'; end if;
  select confirmation_max_minutes into v_minutes from public.taxi_hotel_service_catalog where code=new.service_code;

  v_lead_result := private.sales_cycle_capture_lead_core_v1(
    v_business_id,'taxi_hotel','taxi_hotel_reservation:'||new.id::text,
    jsonb_build_object('full_name',new.contact_name,'email',new.contact_email,'phone',new.contact_phone),
    jsonb_build_object('product_key',new.service_code,'message','Solicitud de traslado','score',70),
    jsonb_build_object('source_page','taxihotel_web','source_cta','booking_form',
      'reservation_id',new.id,'reservation_code',new.reservation_code),
    'taxi-reservation:'||new.id::text,
    new.created_at + make_interval(mins=>coalesce(v_minutes,15)),'taxi_hotel'
  );
  v_lead_id := (v_lead_result->>'lead_id')::uuid;

  update public.sales_leads
  set metadata=metadata || jsonb_build_object('taxi_hotel_reservation_id',new.id,
      'reservation_code',new.reservation_code,'trip_type',new.trip_type,
      'passenger_count',new.passenger_count,'outbound_at',new.outbound_at),updated_at=now()
  where id=v_lead_id;

  perform private.sales_cycle_issue_quote_core_v1(
    v_lead_id,new.service_code,new.currency,new.quoted_subtotal_clp,new.quoted_extras_clp,0,
    new.quoted_total_clp,new.created_at+interval '24 hours',
    new.pricing_snapshot || jsonb_build_object('pricing_owner','taxi_hotel_reservations',
      'reservation_id',new.id,'reservation_code',new.reservation_code),
    'taxi-reservation:'||new.id::text||':quote',new.reservation_code,'taxi_hotel'
  );
  perform public.refresh_link_conversion_assessments();
  return new;
end;
$$;

revoke all on function private.sales_cycle_from_taxi_reservation_v1() from public,anon,authenticated;

drop trigger if exists sales_cycle_from_taxi_reservation on public.taxi_hotel_reservations;
create trigger sales_cycle_from_taxi_reservation after insert on public.taxi_hotel_reservations
for each row execute function private.sales_cycle_from_taxi_reservation_v1();

create or replace function private.sales_cycle_from_taxi_reservation_status_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_lead public.sales_leads%rowtype;
begin
  if old.status is not distinct from new.status then return new; end if;
  select l.* into v_lead from public.sales_leads l
  join public.link_world_businesses b on b.id=l.business_id and b.slug='taxi-hotel'
  where l.external_ref='taxi_hotel_reservation:'||new.id::text limit 1;
  if not found then return new; end if;

  if new.status='availability_confirmed' then
    update public.sales_leads set stage='contacted',last_contact_at=now(),updated_at=now() where id=v_lead.id and stage not in ('won','lost');
    perform private.sales_cycle_append_event_v1(v_lead.id,'availability.confirmed',
      'taxi-reservation:'||new.id::text||':availability.confirmed',jsonb_build_object('reservation_code',new.reservation_code),
      'taxi_hotel',null,null,now());
  elsif new.status='awaiting_payment' then
    update public.sales_leads set stage='proposal',last_contact_at=now(),next_followup_at=now()+interval '24 hours',updated_at=now()
    where id=v_lead.id and stage not in ('won','lost');
    perform private.sales_cycle_append_event_v1(v_lead.id,'payment.awaiting',
      'taxi-reservation:'||new.id::text||':payment.awaiting',jsonb_build_object('reservation_code',new.reservation_code),
      'taxi_hotel',null,null,now());
  elsif new.status in ('cancelled','no_show') and not exists(select 1 from public.sales_cycle_outcomes where lead_id=v_lead.id) then
    perform private.sales_cycle_close_core_v1(v_lead.id,'lost','taxi_hotel_reservation',new.id::text,null,'CLP',
      'reservation_'||new.status,jsonb_build_object('reservation_code',new.reservation_code,'status',new.status),
      jsonb_build_object('loss_reason','reservation_'||new.status,'product_key',new.service_code),
      'taxi-reservation:'||new.id::text||':lost:'||new.status,null,'taxi_hotel');
  elsif new.status='completed' then
    perform private.sales_cycle_append_event_v1(v_lead.id,'service.completed',
      'taxi-reservation:'||new.id::text||':service.completed',jsonb_build_object('reservation_code',new.reservation_code),
      'taxi_hotel',null,null,coalesce(new.completed_at,now()));
  end if;
  perform public.refresh_link_conversion_assessments();
  return new;
end;
$$;

revoke all on function private.sales_cycle_from_taxi_reservation_status_v1() from public,anon,authenticated;

drop trigger if exists sales_cycle_from_taxi_reservation_status on public.taxi_hotel_reservations;
create trigger sales_cycle_from_taxi_reservation_status after update of status on public.taxi_hotel_reservations
for each row execute function private.sales_cycle_from_taxi_reservation_status_v1();

create or replace function private.sales_cycle_from_taxi_payment_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_reservation public.taxi_hotel_reservations%rowtype;
  v_lead public.sales_leads%rowtype;
begin
  if tg_op='UPDATE' and old.status is not distinct from new.status then return new; end if;
  select * into v_reservation from public.taxi_hotel_reservations where id=new.reservation_id;
  select l.* into v_lead from public.sales_leads l
  join public.link_world_businesses b on b.id=l.business_id and b.slug='taxi-hotel'
  where l.external_ref='taxi_hotel_reservation:'||new.reservation_id::text limit 1;
  if not found then return new; end if;

  if new.status='link_sent' then
    update public.sales_leads set stage='proposal',last_contact_at=now(),next_followup_at=now()+interval '24 hours',updated_at=now()
    where id=v_lead.id and stage not in ('won','lost');
    perform private.sales_cycle_append_event_v1(v_lead.id,'payment.link_sent',
      'taxi-payment:'||new.id::text||':link.sent',jsonb_build_object('provider',new.provider,'amount',new.amount_clp,'currency',new.currency),
      'taxi_hotel',null,null,now());
  elsif new.status='paid' then
    perform private.sales_cycle_close_core_v1(v_lead.id,'won','taxi_hotel_payment',new.id::text,new.amount_clp,new.currency,null,
      jsonb_build_object('payment_id',new.id,'reservation_id',new.reservation_id,'provider',new.provider),
      jsonb_build_object('product_key',v_reservation.service_code,'trip_type',v_reservation.trip_type,
        'passenger_count',v_reservation.passenger_count,'source','taxi_hotel'),
      'taxi-payment:'||new.id::text||':paid','operational:taxi_hotel','taxi_hotel');
  elsif new.status='failed' then
    update public.sales_leads set next_followup_at=now()+interval '1 hour',updated_at=now() where id=v_lead.id and stage not in ('won','lost');
    perform private.sales_cycle_append_event_v1(v_lead.id,'payment.failed',
      'taxi-payment:'||new.id::text||':failed',jsonb_build_object('provider',new.provider,'amount',new.amount_clp,'currency',new.currency),
      'taxi_hotel',null,null,now());
  elsif new.status='refunded' then
    perform private.sales_cycle_append_event_v1(v_lead.id,'sale.refunded',
      'taxi-payment:'||new.id::text||':refunded',jsonb_build_object('provider',new.provider,'amount',new.amount_clp,'currency',new.currency),
      'taxi_hotel',null,null,coalesce(new.refunded_at,now()));
  end if;
  perform public.refresh_link_conversion_assessments();
  return new;
end;
$$;

revoke all on function private.sales_cycle_from_taxi_payment_v1() from public,anon,authenticated;

drop trigger if exists sales_cycle_from_taxi_payment_insert on public.taxi_hotel_payments;
create trigger sales_cycle_from_taxi_payment_insert after insert on public.taxi_hotel_payments
for each row execute function private.sales_cycle_from_taxi_payment_v1();

drop trigger if exists sales_cycle_from_taxi_payment_update on public.taxi_hotel_payments;
create trigger sales_cycle_from_taxi_payment_update after update of status on public.taxi_hotel_payments
for each row execute function private.sales_cycle_from_taxi_payment_v1();

create or replace view public.sales_cycle_queue_v
with (security_invoker=true)
as
select
  l.id as lead_id,l.business_id,b.global_id as business_global_id,b.name as business_name,
  l.source,l.external_ref,l.full_name,l.email,l.phone,l.company,l.interested_product,l.interested_pack,
  l.stage,l.score,l.next_followup_at,l.last_contact_at,l.closed_at,l.loss_reason,l.outcome,
  q.id as latest_quote_id,q.quote_number,q.version as quote_version,q.status as quote_status,
  q.total_amount as quote_total,q.currency as quote_currency,q.valid_until as quote_valid_until,
  o.id as outcome_id,o.outcome as final_outcome,o.verified as outcome_verified,o.amount as outcome_amount,
  o.currency as outcome_currency,o.confirmed_at,
  case
    when l.stage in ('won','lost') then 'closed'
    when l.next_followup_at is null then 'unscheduled'
    when l.next_followup_at<=now() then 'due'
    else 'scheduled'
  end as followup_state,
  l.created_at,l.updated_at
from public.sales_leads l
left join public.link_world_businesses b on b.id=l.business_id
left join lateral (
  select sq.* from public.sales_quotes sq where sq.lead_id=l.id order by sq.version desc limit 1
) q on true
left join public.sales_cycle_outcomes o on o.lead_id=l.id;

create or replace view public.sales_cycle_dashboard_v
with (security_invoker=true)
as
select
  b.id as business_id,b.global_id,b.name as business_name,
  count(l.id) as total_cycles,
  count(l.id) filter(where l.stage not in ('won','lost')) as open_cycles,
  count(l.id) filter(where l.stage='new') as new_cycles,
  count(l.id) filter(where l.stage='proposal') as proposals,
  count(l.id) filter(where l.stage not in ('won','lost') and l.next_followup_at<=now()) as followups_due,
  count(o.id) filter(where o.outcome='won') as won_cycles,
  count(o.id) filter(where o.outcome in ('lost','cancelled')) as lost_cycles,
  coalesce(sum(o.amount) filter(where o.outcome='won' and o.verified),0) as confirmed_revenue,
  case when count(o.id)>0 then round(100.0*count(o.id) filter(where o.outcome='won')/count(o.id),1) else 0 end as close_rate_percent,
  max(l.updated_at) as last_commercial_activity_at
from public.link_world_businesses b
left join public.sales_leads l on l.business_id=b.id
left join public.sales_cycle_outcomes o on o.lead_id=l.id
group by b.id,b.global_id,b.name;

create or replace view public.sales_learning_signals_v
with (security_invoker=true)
as
select
  l.business_id,b.name as business_name,l.source,l.interested_product,
  o.outcome,o.loss_reason,count(*) as evidence_count,
  min(o.confirmed_at) as first_observed_at,max(o.confirmed_at) as last_observed_at,
  array_agg(o.id order by o.confirmed_at) as outcome_ids,
  'candidate_only_requires_validation'::text as learning_status
from public.sales_cycle_outcomes o
join public.sales_leads l on l.id=o.lead_id
join public.link_world_businesses b on b.id=l.business_id
group by l.business_id,b.name,l.source,l.interested_product,o.outcome,o.loss_reason;

revoke all on public.sales_cycle_queue_v, public.sales_cycle_dashboard_v, public.sales_learning_signals_v from anon;
grant select on public.sales_cycle_queue_v, public.sales_cycle_dashboard_v, public.sales_learning_signals_v to authenticated,service_role;

insert into public.action_registry(action_key,provider,description,permission_key,mode,input_schema,success_event,failure_event,enabled,metadata,updated_at)
values
('commerce.lead.capture','link-sales','Captura o recupera un lead comercial de forma idempotente.','commerce:lead:write','write',
 '{"type":"object","required":["business_id","source","contact","need"],"properties":{"business_id":{"type":"string","format":"uuid"},"source":{"type":"string"},"external_ref":{"type":"string"},"contact":{"type":"object"},"need":{"type":"object"},"attribution":{"type":"object"},"next_followup_at":{"type":"string","format":"date-time"}}}'::jsonb,
 'lead.created','lead.capture_failed',true,'{"executor":"sales_execute_action_v1","autonomy":"allowed"}'::jsonb,now()),
('commerce.quote.issue','link-sales','Emite una versión inmutable de cotización y mueve el ciclo a propuesta.','commerce:quote:write','write',
 '{"type":"object","required":["lead_id","currency","base_amount","adjustments_amount","tax_amount","total_amount","snapshot"],"properties":{"lead_id":{"type":"string","format":"uuid"},"product_key":{"type":"string"},"currency":{"type":"string"},"base_amount":{"type":"number"},"adjustments_amount":{"type":"number"},"tax_amount":{"type":"number"},"total_amount":{"type":"number"},"valid_until":{"type":"string","format":"date-time"},"snapshot":{"type":"object"}}}'::jsonb,
 'quote.issued','quote.issue_failed',true,'{"executor":"sales_execute_action_v1","autonomy":"approval_required_outside_operational_pricing"}'::jsonb,now()),
('commerce.followup.schedule','link-sales','Programa el siguiente contacto y lo deja visible en la cola.','commerce:followup:write','write',
 '{"type":"object","required":["lead_id","due_at","reason"],"properties":{"lead_id":{"type":"string","format":"uuid"},"due_at":{"type":"string","format":"date-time"},"channel":{"type":"string"},"reason":{"type":"string"}}}'::jsonb,
 'followup.scheduled','followup.schedule_failed',true,'{"executor":"sales_execute_action_v1","autonomy":"allowed"}'::jsonb,now()),
('commerce.cycle.close','link-sales','Cierra el ciclo con evidencia verificable y genera una observación en Corteza.','commerce:cycle:close','write',
 '{"type":"object","required":["lead_id","outcome","evidence_type"],"properties":{"lead_id":{"type":"string","format":"uuid"},"outcome":{"enum":["won","lost","cancelled"]},"evidence_type":{"type":"string"},"evidence_ref":{"type":"string"},"amount":{"type":"number"},"currency":{"type":"string"},"loss_reason":{"type":"string"},"evidence":{"type":"object"},"learning_snapshot":{"type":"object"}}}'::jsonb,
 'sale.closed','sale.close_failed',true,'{"executor":"sales_execute_action_v1","autonomy":"won_requires_operational_evidence_or_human_approval"}'::jsonb,now())
on conflict (action_key) do update set
  provider=excluded.provider,description=excluded.description,permission_key=excluded.permission_key,
  mode=excluded.mode,input_schema=excluded.input_schema,success_event=excluded.success_event,
  failure_event=excluded.failure_event,enabled=excluded.enabled,metadata=excluded.metadata,updated_at=now();

create or replace function private.sales_cycle_dispatch_command_v1(p_command_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_command public.command_bus%rowtype;
  v_payload jsonb;
  v_result jsonb;
  v_actor text;
begin
  select * into v_command from public.command_bus where id=p_command_id for update;
  if not found then raise exception 'command not found'; end if;
  if v_command.status='succeeded' then return v_command.result; end if;
  if v_command.status not in ('pending','failed') then raise exception 'command is not executable in status %',v_command.status; end if;
  if v_command.requires_approval and v_command.approval_status<>'approved' then raise exception 'command approval is pending'; end if;
  if v_command.action_key not in ('commerce.lead.capture','commerce.quote.issue','commerce.followup.schedule','commerce.cycle.close') then
    raise exception 'unsupported sales action';
  end if;

  update public.command_bus set status='processing',attempts=attempts+1,error=null where id=p_command_id;
  v_payload := v_command.payload;
  v_actor := coalesce(nullif(v_command.actor,''),'link-sales');

  begin
    if v_command.action_key='commerce.lead.capture' then
      v_result := private.sales_cycle_capture_lead_core_v1(
        (v_payload->>'business_id')::uuid,v_payload->>'source',v_payload->>'external_ref',
        coalesce(v_payload->'contact','{}'::jsonb),coalesce(v_payload->'need','{}'::jsonb),
        coalesce(v_payload->'attribution','{}'::jsonb),v_command.idempotency_key,
        nullif(v_payload->>'next_followup_at','')::timestamptz,v_actor);
    elsif v_command.action_key='commerce.quote.issue' then
      v_result := private.sales_cycle_issue_quote_core_v1(
        (v_payload->>'lead_id')::uuid,v_payload->>'product_key',v_payload->>'currency',
        (v_payload->>'base_amount')::numeric,coalesce((v_payload->>'adjustments_amount')::numeric,0),
        coalesce((v_payload->>'tax_amount')::numeric,0),(v_payload->>'total_amount')::numeric,
        nullif(v_payload->>'valid_until','')::timestamptz,coalesce(v_payload->'snapshot','{}'::jsonb),
        v_command.idempotency_key,v_payload->>'external_ref',v_actor);
    elsif v_command.action_key='commerce.followup.schedule' then
      v_result := private.sales_cycle_schedule_followup_core_v1(
        (v_payload->>'lead_id')::uuid,(v_payload->>'due_at')::timestamptz,
        v_payload->>'channel',v_payload->>'reason',v_command.idempotency_key,v_actor);
    else
      v_result := private.sales_cycle_close_core_v1(
        (v_payload->>'lead_id')::uuid,v_payload->>'outcome',v_payload->>'evidence_type',
        v_payload->>'evidence_ref',nullif(v_payload->>'amount','')::numeric,
        coalesce(v_payload->>'currency','CLP'),v_payload->>'loss_reason',
        coalesce(v_payload->'evidence','{}'::jsonb),coalesce(v_payload->'learning_snapshot','{}'::jsonb),
        v_command.idempotency_key,v_command.approved_by,v_actor);
    end if;

    perform public.refresh_link_conversion_assessments();
    update public.command_bus set status='succeeded',result=result||v_result,error=null,processed_at=now() where id=p_command_id;
    return v_result;
  exception when others then
    update public.command_bus set status='failed',error=left(sqlerrm,500),processed_at=now() where id=p_command_id;
    return jsonb_build_object('command_id',p_command_id,'status','failed','error',left(sqlerrm,500));
  end;
end;
$$;

revoke all on function private.sales_cycle_dispatch_command_v1(uuid) from public,anon,authenticated;
grant execute on function private.sales_cycle_dispatch_command_v1(uuid) to service_role;

create or replace function public.sales_execute_action_v1(
  p_action_key text,
  p_payload jsonb,
  p_idempotency_key text,
  p_requires_approval boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_command public.command_bus%rowtype;
  v_business_id uuid;
  v_global_id text;
  v_requires_approval boolean;
  v_actor text;
begin
  if not private.sales_cycle_caller_authorized_v1() then raise exception 'not authorized'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'payload must be a JSON object'; end if;
  if nullif(btrim(p_idempotency_key),'') is null then raise exception 'idempotency_key is required'; end if;
  if not exists(select 1 from public.action_registry where action_key=p_action_key and provider='link-sales' and enabled=true) then
    raise exception 'sales action is not registered or enabled';
  end if;

  v_business_id := nullif(p_payload->>'business_id','')::uuid;
  if v_business_id is null and nullif(p_payload->>'lead_id','') is not null then
    select business_id into v_business_id from public.sales_leads where id=(p_payload->>'lead_id')::uuid;
  end if;
  select global_id into v_global_id from public.link_world_businesses where id=v_business_id;
  if v_global_id is null then raise exception 'business identity not found'; end if;

  v_requires_approval := coalesce(p_requires_approval,false)
    or p_action_key='commerce.quote.issue'
    or (p_action_key='commerce.cycle.close' and p_payload->>'outcome'='won' and p_payload->>'evidence_type'<>'taxi_hotel_payment');
  v_actor := coalesce(auth.uid()::text,auth.jwt()->>'role','link-sales');

  insert into public.command_bus(
    control_id,command_type,action_key,actor,target_provider,entity_type,global_id,payload,
    idempotency_key,status,source_domain,correlation_id,requires_approval,approval_status
  ) values (
    '00000000-0000-0000-0000-000000000001'::uuid,'sales_cycle',p_action_key,v_actor,
    'link-sales','business',v_global_id,p_payload,'sales:'||p_idempotency_key,'pending','world',
    coalesce(p_payload->>'lead_id',p_idempotency_key),v_requires_approval,
    case when v_requires_approval then 'pending' else 'not_required' end
  ) on conflict (idempotency_key) do nothing returning * into v_command;

  if v_command.id is null then
    select * into v_command from public.command_bus where idempotency_key='sales:'||p_idempotency_key;
  end if;
  if v_command.status='succeeded' then return v_command.result; end if;
  if v_command.requires_approval and v_command.approval_status<>'approved' then
    return jsonb_build_object('command_id',v_command.id,'gesture_code',v_command.gesture_code,
      'status','pending_approval','action_key',v_command.action_key);
  end if;
  return private.sales_cycle_dispatch_command_v1(v_command.id);
end;
$$;

revoke all on function public.sales_execute_action_v1(text,jsonb,text,boolean) from public,anon;
grant execute on function public.sales_execute_action_v1(text,jsonb,text,boolean) to authenticated,service_role;

create or replace function public.sales_approve_and_execute_command_v1(
  p_command_id uuid,
  p_approval_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_actor text;
begin
  if not public.link_world_is_member() then raise exception 'human member approval required'; end if;
  v_actor := auth.uid()::text;
  update public.command_bus
  set approval_status='approved',approved_by=v_actor,approved_at=now(),
      result=result || jsonb_build_object('approval_note',p_approval_note)
  where id=p_command_id and target_provider='link-sales' and status='pending' and requires_approval=true and approval_status='pending';
  if not found then raise exception 'pending sales command not found'; end if;
  return private.sales_cycle_dispatch_command_v1(p_command_id);
end;
$$;

revoke all on function public.sales_approve_and_execute_command_v1(uuid,text) from public,anon;
grant execute on function public.sales_approve_and_execute_command_v1(uuid,text) to authenticated;

comment on table public.sales_quotes is 'Immutable commercial offer versions. Operational product/booking systems remain the pricing owners.';
comment on table public.sales_cycle_outcomes is 'Verified commercial outcomes referencing their operational evidence; never a replacement for payment or reservation records.';
comment on view public.sales_cycle_queue_v is 'Member-only operational queue for open and closed sales cycles.';
comment on view public.sales_learning_signals_v is 'Evidence groups for Cortex review. Rows are candidates and never auto-confirmed rules.';
