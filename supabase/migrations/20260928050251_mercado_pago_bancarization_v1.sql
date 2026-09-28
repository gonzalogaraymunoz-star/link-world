-- LINK Mercado Pago + tax + bankarization milestones v1
-- Hosted checkout keeps card data outside LINK. Mercado Pago owns payment processing;
-- Taxi Hotel owns reservations; LINK WORLD owns the tax profile and financial evidence.

create schema if not exists private;

create table public.link_tax_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null unique,
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  country_code text not null default 'CL',
  tax_treatment text not null default 'unknown',
  tax_code text not null,
  tax_rate numeric(7,4) not null default 0,
  document_type text not null,
  price_includes_tax boolean not null default true,
  status text not null default 'proposed',
  valid_from date not null default current_date,
  valid_until date null,
  evidence jsonb not null default '[]'::jsonb,
  notes text null,
  approved_by text null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint link_tax_profiles_country_chk check (country_code ~ '^[A-Z]{2}$'),
  constraint link_tax_profiles_treatment_chk check (tax_treatment in ('unknown','exempt','included','additive')),
  constraint link_tax_profiles_rate_chk check (tax_rate >= 0 and tax_rate <= 100),
  constraint link_tax_profiles_status_chk check (status in ('proposed','verified','retired')),
  constraint link_tax_profiles_evidence_chk check (jsonb_typeof(evidence)='array'),
  constraint link_tax_profiles_dates_chk check (valid_until is null or valid_until >= valid_from),
  constraint link_tax_profiles_approval_chk check (
    (status='verified' and approved_by is not null and approved_at is not null)
    or status<>'verified'
  )
);

create unique index link_tax_profiles_current_business_country_uidx
  on public.link_tax_profiles(business_id,country_code)
  where status in ('proposed','verified');

create table public.link_payment_provider_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  provider text not null default 'mercado_pago',
  environment text not null default 'test',
  status text not null default 'needs_credentials',
  webhook_status text not null default 'unverified',
  credential_ref text not null,
  external_merchant_id text null,
  verified_at timestamptz null,
  last_webhook_at timestamptz null,
  last_error text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint link_payment_provider_accounts_provider_chk check (provider='mercado_pago'),
  constraint link_payment_provider_accounts_environment_chk check (environment in ('test','production')),
  constraint link_payment_provider_accounts_status_chk check (status in ('needs_credentials','sandbox_ready','active','suspended','error')),
  constraint link_payment_provider_accounts_webhook_chk check (webhook_status in ('unverified','verified','error')),
  constraint link_payment_provider_accounts_metadata_chk check (jsonb_typeof(metadata)='object'),
  constraint link_payment_provider_accounts_business_provider_env_uidx unique (business_id,provider,environment)
);

create table public.link_payment_intents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  provider_account_id uuid not null references public.link_payment_provider_accounts(id) on delete restrict,
  tax_profile_id uuid not null references public.link_tax_profiles(id) on delete restrict,
  reservation_id uuid null references public.taxi_hotel_reservations(id) on delete restrict,
  sales_quote_id uuid null references public.sales_quotes(id) on delete set null,
  transaction_id uuid null references public.link_world_transactions(id) on delete set null,
  operational_payment_id uuid null references public.taxi_hotel_payments(id) on delete set null,
  command_id uuid null references public.command_bus(id) on delete set null,
  environment text not null,
  provider text not null default 'mercado_pago',
  external_reference text not null unique,
  idempotency_key text not null unique,
  version integer not null default 1,
  currency text not null default 'CLP',
  net_amount numeric(14,2) not null,
  tax_amount numeric(14,2) not null default 0,
  gross_amount numeric(14,2) not null,
  provider_preference_id text null,
  provider_payment_id text null,
  checkout_url text null,
  sandbox_checkout_url text null,
  status text not null default 'draft',
  expires_at timestamptz null,
  approved_at timestamptz null,
  cancelled_at timestamptz null,
  refunded_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint link_payment_intents_environment_chk check (environment in ('test','production')),
  constraint link_payment_intents_provider_chk check (provider='mercado_pago'),
  constraint link_payment_intents_version_chk check (version >= 1),
  constraint link_payment_intents_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint link_payment_intents_amounts_chk check (
    net_amount >= 0 and tax_amount >= 0 and gross_amount >= 0
    and gross_amount = net_amount + tax_amount
  ),
  constraint link_payment_intents_status_chk check (status in (
    'draft','preference_created','pending','approved','rejected','cancelled','refunded','charged_back','error'
  )),
  constraint link_payment_intents_metadata_chk check (jsonb_typeof(metadata)='object')
);

create unique index link_payment_intents_active_reservation_env_uidx
  on public.link_payment_intents(reservation_id,environment)
  where reservation_id is not null and status in ('draft','preference_created','pending','approved');
create unique index link_payment_intents_provider_payment_uidx
  on public.link_payment_intents(provider,provider_payment_id)
  where provider_payment_id is not null;
create index link_payment_intents_business_status_idx
  on public.link_payment_intents(business_id,environment,status,created_at desc);

create table public.link_payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null references public.link_payment_intents(id) on delete cascade,
  provider text not null default 'mercado_pago',
  environment text not null,
  event_key text not null unique,
  provider_payment_id text not null,
  provider_status text not null,
  provider_status_detail text null,
  request_id text null,
  signature_verified boolean not null default false,
  payload_digest text null,
  occurred_at timestamptz null,
  received_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint link_payment_events_provider_chk check (provider='mercado_pago'),
  constraint link_payment_events_environment_chk check (environment in ('test','production')),
  constraint link_payment_events_metadata_chk check (jsonb_typeof(metadata)='object')
);

create index link_payment_events_intent_received_idx
  on public.link_payment_events(payment_intent_id,received_at desc);

create table public.link_payment_settlements (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null unique references public.link_payment_intents(id) on delete cascade,
  gross_amount numeric(14,2) not null,
  provider_fee_amount numeric(14,2) not null default 0,
  provider_fee_tax_amount numeric(14,2) null,
  net_received_amount numeric(14,2) not null,
  currency text not null default 'CLP',
  status text not null default 'observed',
  expected_release_at timestamptz null,
  released_at timestamptz null,
  reconciled_at timestamptz null,
  reconciliation_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint link_payment_settlements_amounts_chk check (
    gross_amount >= 0 and provider_fee_amount >= 0
    and (provider_fee_tax_amount is null or provider_fee_tax_amount >= 0)
    and net_received_amount >= 0
  ),
  constraint link_payment_settlements_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint link_payment_settlements_status_chk check (status in ('observed','released','reconciled','disputed')),
  constraint link_payment_settlements_evidence_chk check (jsonb_typeof(reconciliation_evidence)='object')
);

create table public.link_financial_achievements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  environment text not null default 'production',
  milestone_key text not null,
  points integer not null default 20,
  evidence_type text not null,
  evidence_ref text not null,
  evidence jsonb not null default '{}'::jsonb,
  achieved_at timestamptz not null default now(),
  constraint link_financial_achievements_environment_chk check (environment='production'),
  constraint link_financial_achievements_milestone_chk check (milestone_key in (
    'account_connected','webhook_verified','first_approved_payment','documentary_complete','settlement_reconciled'
  )),
  constraint link_financial_achievements_points_chk check (points=20),
  constraint link_financial_achievements_evidence_chk check (jsonb_typeof(evidence)='object'),
  constraint link_financial_achievements_business_milestone_uidx unique (business_id,environment,milestone_key)
);

alter table public.link_tax_profiles enable row level security;
alter table public.link_payment_provider_accounts enable row level security;
alter table public.link_payment_intents enable row level security;
alter table public.link_payment_events enable row level security;
alter table public.link_payment_settlements enable row level security;
alter table public.link_financial_achievements enable row level security;

revoke all on public.link_tax_profiles, public.link_payment_provider_accounts,
  public.link_payment_intents, public.link_payment_events, public.link_payment_settlements,
  public.link_financial_achievements from anon;
revoke insert,update,delete on public.link_tax_profiles, public.link_payment_provider_accounts,
  public.link_payment_intents, public.link_payment_events, public.link_payment_settlements,
  public.link_financial_achievements from authenticated;
grant select on public.link_tax_profiles, public.link_payment_provider_accounts,
  public.link_payment_intents, public.link_payment_events, public.link_payment_settlements,
  public.link_financial_achievements to authenticated;
grant all on public.link_tax_profiles, public.link_payment_provider_accounts,
  public.link_payment_intents, public.link_payment_events, public.link_payment_settlements,
  public.link_financial_achievements to service_role;

create policy link_tax_profiles_member_select on public.link_tax_profiles
  for select to authenticated using ((select public.link_world_is_member()));
create policy link_payment_provider_accounts_member_select on public.link_payment_provider_accounts
  for select to authenticated using ((select public.link_world_is_member()));
create policy link_payment_intents_member_select on public.link_payment_intents
  for select to authenticated using ((select public.link_world_is_member()));
create policy link_payment_events_member_select on public.link_payment_events
  for select to authenticated using ((select public.link_world_is_member()));
create policy link_payment_settlements_member_select on public.link_payment_settlements
  for select to authenticated using ((select public.link_world_is_member()));
create policy link_financial_achievements_member_select on public.link_financial_achievements
  for select to authenticated using ((select public.link_world_is_member()));

create trigger link_tax_profiles_touch before update on public.link_tax_profiles
for each row execute function public.set_updated_at();
create trigger link_payment_provider_accounts_touch before update on public.link_payment_provider_accounts
for each row execute function public.set_updated_at();
create trigger link_payment_intents_touch before update on public.link_payment_intents
for each row execute function public.set_updated_at();
create trigger link_payment_settlements_touch before update on public.link_payment_settlements
for each row execute function public.set_updated_at();

create or replace function private.link_payment_service_authorized_v1()
returns boolean
language sql stable security definer set search_path=''
as $$
  select coalesce(auth.jwt()->>'role','')='service_role';
$$;
revoke all on function private.link_payment_service_authorized_v1() from public,anon,authenticated;
grant execute on function private.link_payment_service_authorized_v1() to service_role;

create or replace function private.link_refresh_financial_achievements_v1(p_business_id uuid)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_account public.link_payment_provider_accounts%rowtype;
begin
  select * into v_account
  from public.link_payment_provider_accounts
  where business_id=p_business_id and provider='mercado_pago' and environment='production'
  limit 1;

  if v_account.status='active' then
    insert into public.link_financial_achievements(
      business_id,milestone_key,evidence_type,evidence_ref,evidence
    ) values (
      p_business_id,'account_connected','provider_account',v_account.id::text,
      jsonb_build_object('provider','mercado_pago','verified_at',v_account.verified_at)
    ) on conflict (business_id,environment,milestone_key) do nothing;
  end if;

  if v_account.webhook_status='verified' then
    insert into public.link_financial_achievements(
      business_id,milestone_key,evidence_type,evidence_ref,evidence
    ) values (
      p_business_id,'webhook_verified','provider_account',v_account.id::text,
      jsonb_build_object('provider','mercado_pago','last_webhook_at',v_account.last_webhook_at)
    ) on conflict (business_id,environment,milestone_key) do nothing;
  end if;

  insert into public.link_financial_achievements(
    business_id,milestone_key,evidence_type,evidence_ref,evidence
  )
  select p_business_id,'first_approved_payment','payment_intent',i.id::text,
    jsonb_build_object('payment_intent_id',i.id,'approved_at',i.approved_at,'gross_amount',i.gross_amount,'currency',i.currency)
  from public.link_payment_intents i
  where i.business_id=p_business_id and i.environment='production' and i.status='approved'
  order by i.approved_at nulls last,i.created_at
  limit 1
  on conflict (business_id,environment,milestone_key) do nothing;

  insert into public.link_financial_achievements(
    business_id,milestone_key,evidence_type,evidence_ref,evidence
  )
  select p_business_id,'documentary_complete','transaction',t.id::text,
    jsonb_build_object('transaction_id',t.id,'documentary_status',t.documentary_status)
  from public.link_payment_intents i
  join public.link_world_transactions t on t.id=i.transaction_id
  where i.business_id=p_business_id and i.environment='production' and i.status='approved'
    and t.documentary_status='complete'
  order by t.updated_at
  limit 1
  on conflict (business_id,environment,milestone_key) do nothing;

  insert into public.link_financial_achievements(
    business_id,milestone_key,evidence_type,evidence_ref,evidence
  )
  select p_business_id,'settlement_reconciled','payment_settlement',s.id::text,
    jsonb_build_object('settlement_id',s.id,'reconciled_at',s.reconciled_at)
  from public.link_payment_intents i
  join public.link_payment_settlements s on s.payment_intent_id=i.id
  where i.business_id=p_business_id and i.environment='production' and s.status='reconciled'
  order by s.reconciled_at nulls last
  limit 1
  on conflict (business_id,environment,milestone_key) do nothing;
end;
$$;
revoke all on function private.link_refresh_financial_achievements_v1(uuid) from public,anon,authenticated;
grant execute on function private.link_refresh_financial_achievements_v1(uuid) to service_role;

create or replace function public.link_prepare_mercado_pago_checkout_v1(
  p_reservation_id uuid,
  p_environment text default 'test'
)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_reservation public.taxi_hotel_reservations%rowtype;
  v_business public.link_world_businesses%rowtype;
  v_account public.link_payment_provider_accounts%rowtype;
  v_tax public.link_tax_profiles%rowtype;
  v_intent public.link_payment_intents%rowtype;
  v_payment public.taxi_hotel_payments%rowtype;
  v_transaction public.link_world_transactions%rowtype;
  v_command public.command_bus%rowtype;
  v_quote_id uuid;
  v_intent_id uuid;
  v_net numeric(14,2);
  v_tax_amount numeric(14,2);
  v_gross numeric(14,2);
begin
  if not public.link_world_is_member() then raise exception 'LINK WORLD member session required'; end if;
  if p_environment not in ('test','production') then raise exception 'invalid payment environment'; end if;

  select * into v_reservation from public.taxi_hotel_reservations where id=p_reservation_id for update;
  if not found then raise exception 'reservation not found'; end if;
  if v_reservation.status not in ('availability_confirmed','awaiting_payment') then
    raise exception 'reservation must have confirmed availability before checkout';
  end if;
  if v_reservation.currency<>'CLP' or v_reservation.quoted_total_clp<=0 then
    raise exception 'reservation amount or currency is invalid';
  end if;

  select * into v_business from public.link_world_businesses where slug='taxi-hotel';
  if not found then raise exception 'Taxi Hotel business identity not found'; end if;
  select * into v_account from public.link_payment_provider_accounts
    where business_id=v_business.id and provider='mercado_pago' and environment=p_environment;
  if not found then raise exception 'Mercado Pago account is not configured for %',p_environment; end if;
  if (p_environment='test' and v_account.status not in ('sandbox_ready','active'))
     or (p_environment='production' and v_account.status<>'active') then
    raise exception 'Mercado Pago % account is not ready',p_environment;
  end if;
  if p_environment='production' and coalesce((v_account.metadata->>'real_charges_enabled')::boolean,false) is not true then
    raise exception 'production charges are disabled by the safety latch';
  end if;

  select * into v_tax from public.link_tax_profiles
    where business_id=v_business.id and country_code='CL' and status in ('proposed','verified')
      and valid_from<=current_date and (valid_until is null or valid_until>=current_date)
    order by case status when 'verified' then 0 else 1 end,valid_from desc limit 1;
  if not found then raise exception 'active tax profile not found'; end if;
  if p_environment='production' and v_tax.status<>'verified' then
    raise exception 'production checkout requires a verified tax profile';
  end if;

  select * into v_intent from public.link_payment_intents
    where reservation_id=p_reservation_id and environment=p_environment
      and status in ('draft','preference_created','pending','approved')
    order by created_at desc limit 1;
  if found then
    return jsonb_build_object(
      'payment_intent_id',v_intent.id,'status',v_intent.status,'environment',v_intent.environment,
      'external_reference',v_intent.external_reference,'currency',v_intent.currency,
      'net_amount',v_intent.net_amount,'tax_amount',v_intent.tax_amount,'gross_amount',v_intent.gross_amount,
      'checkout_url',case when p_environment='test' then v_intent.sandbox_checkout_url else v_intent.checkout_url end,
      'reused',true
    );
  end if;

  if v_tax.tax_treatment='exempt' then
    v_net:=v_reservation.quoted_total_clp; v_tax_amount:=0; v_gross:=v_reservation.quoted_total_clp;
  elsif v_tax.price_includes_tax then
    v_gross:=v_reservation.quoted_total_clp;
    v_net:=round(v_gross/(1+(v_tax.tax_rate/100.0)),2);
    v_tax_amount:=v_gross-v_net;
  else
    v_net:=v_reservation.quoted_total_clp;
    v_tax_amount:=round(v_net*(v_tax.tax_rate/100.0),2);
    v_gross:=v_net+v_tax_amount;
  end if;

  select sq.id into v_quote_id
  from public.sales_quotes sq
  join public.sales_leads sl on sl.id=sq.lead_id
  where sl.business_id=v_business.id and sl.external_ref='taxi_hotel_reservation:'||p_reservation_id::text
  order by sq.version desc limit 1;

  insert into public.taxi_hotel_payments(
    reservation_id,provider,amount_clp,currency,status,metadata
  ) values (
    p_reservation_id,'mercado_pago',v_gross,'CLP','pending',
    jsonb_build_object('environment',p_environment,'tax_profile_key',v_tax.profile_key)
  ) returning * into v_payment;

  insert into public.link_world_transactions(
    business_id,business_global_id,source_domain,direction,transaction_type,status,
    amount,currency,payment_method,external_reference,documentary_status,occurred_at,due_at,metadata
  ) values (
    v_business.id,v_business.global_id,'world','income','sale','pending_payment',
    v_gross,'CLP','mercado_pago','mercado_pago:'||v_payment.id::text,'required',now(),now(),
    jsonb_build_object(
      'reservation_id',p_reservation_id,'operational_payment_id',v_payment.id,
      'gross_amount',v_gross,'net_sale_amount',v_net,'tax_amount',v_tax_amount,
      'tax_treatment',v_tax.tax_treatment,'tax_profile_key',v_tax.profile_key,
      'environment',p_environment,'payment_status','pending','allocation_status','pending'
    )
  ) returning * into v_transaction;

  v_intent_id:=gen_random_uuid();
  insert into public.link_payment_intents(
    id,business_id,provider_account_id,tax_profile_id,reservation_id,sales_quote_id,
    transaction_id,operational_payment_id,environment,external_reference,idempotency_key,
    currency,net_amount,tax_amount,gross_amount,status,metadata
  ) values (
    v_intent_id,v_business.id,v_account.id,v_tax.id,p_reservation_id,v_quote_id,
    v_transaction.id,v_payment.id,p_environment,'LNKMP-'||v_intent_id::text,'mp-preference:'||v_intent_id::text,
    'CLP',v_net,v_tax_amount,v_gross,'draft',
    jsonb_build_object('reservation_code',v_reservation.reservation_code,'service_code',v_reservation.service_code)
  ) returning * into v_intent;

  insert into public.command_bus(
    control_id,command_type,action_key,actor,target_provider,entity_type,global_id,payload,
    idempotency_key,status,attempts,source_domain,correlation_id,requires_approval,approval_status
  ) values (
    '00000000-0000-0000-0000-000000000001'::uuid,'payment_checkout',
    'finance.payment.checkout.create',coalesce(auth.uid()::text,'link-world-member'),'mercado-pago',
    'payment_intent',v_intent.id::text,
    jsonb_build_object('payment_intent_id',v_intent.id,'reservation_id',p_reservation_id,'environment',p_environment),
    'mp-checkout:'||v_intent.id::text,'processing',1,'world',v_intent.external_reference,false,'not_required'
  ) returning * into v_command;

  update public.link_payment_intents set command_id=v_command.id where id=v_intent.id returning * into v_intent;

  return jsonb_build_object(
    'payment_intent_id',v_intent.id,'command_id',v_command.id,'status',v_intent.status,
    'environment',v_intent.environment,'external_reference',v_intent.external_reference,
    'currency',v_intent.currency,'net_amount',v_intent.net_amount,'tax_amount',v_intent.tax_amount,
    'gross_amount',v_intent.gross_amount,'reservation_code',v_reservation.reservation_code,
    'service_code',v_reservation.service_code,'tax_treatment',v_tax.tax_treatment,
    'document_type',v_tax.document_type,'reused',false
  );
end;
$$;
revoke all on function public.link_prepare_mercado_pago_checkout_v1(uuid,text) from public,anon;
grant execute on function public.link_prepare_mercado_pago_checkout_v1(uuid,text) to authenticated,service_role;

create or replace function public.link_record_mercado_pago_preference_v1(
  p_payment_intent_id uuid,
  p_preference_id text,
  p_checkout_url text,
  p_sandbox_checkout_url text default null,
  p_expires_at timestamptz default null
)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_intent public.link_payment_intents%rowtype;
begin
  if not private.link_payment_service_authorized_v1() then raise exception 'service role required'; end if;
  if nullif(btrim(p_preference_id),'') is null then raise exception 'preference id is required'; end if;
  select * into v_intent from public.link_payment_intents where id=p_payment_intent_id for update;
  if not found then raise exception 'payment intent not found'; end if;
  if v_intent.status not in ('draft','preference_created','pending') then raise exception 'payment intent cannot receive a preference'; end if;

  update public.link_payment_intents set
    provider_preference_id=p_preference_id,checkout_url=p_checkout_url,
    sandbox_checkout_url=p_sandbox_checkout_url,status='preference_created',expires_at=p_expires_at,
    metadata=metadata||jsonb_build_object('preference_created_at',now())
  where id=p_payment_intent_id returning * into v_intent;

  update public.taxi_hotel_payments set
    payment_url=case when v_intent.environment='test' then coalesce(p_sandbox_checkout_url,p_checkout_url) else p_checkout_url end,
    status='link_sent',metadata=metadata||jsonb_build_object('payment_intent_id',v_intent.id,'provider_preference_id',p_preference_id)
  where id=v_intent.operational_payment_id;
  update public.taxi_hotel_reservations set status='awaiting_payment'
    where id=v_intent.reservation_id and status='availability_confirmed';
  update public.command_bus set status='succeeded',processed_at=now(),error=null,
    result=result||jsonb_build_object('payment_intent_id',v_intent.id,'provider_preference_id',p_preference_id)
    where id=v_intent.command_id;

  insert into public.event_bus(
    control_id,source_provider,event_type,entity_type,global_id,external_id,correlation_id,dedupe_key,payload,occurred_at,gesture_code
  ) select
    '00000000-0000-0000-0000-000000000001'::uuid,'mercado-pago','payment.checkout.created',
    'payment_intent',v_intent.id::text,p_preference_id,v_intent.external_reference,
    'mercado-pago:preference:'||p_preference_id,
    jsonb_build_object('payment_intent_id',v_intent.id,'environment',v_intent.environment,'amount',v_intent.gross_amount,'currency',v_intent.currency),
    now(),c.gesture_code
  from public.command_bus c where c.id=v_intent.command_id
  on conflict (dedupe_key) do nothing;

  return jsonb_build_object(
    'payment_intent_id',v_intent.id,'status',v_intent.status,
    'checkout_url',case when v_intent.environment='test' then coalesce(v_intent.sandbox_checkout_url,v_intent.checkout_url) else v_intent.checkout_url end
  );
end;
$$;
revoke all on function public.link_record_mercado_pago_preference_v1(uuid,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.link_record_mercado_pago_preference_v1(uuid,text,text,text,timestamptz) to service_role;

create or replace function public.link_fail_mercado_pago_checkout_v1(p_payment_intent_id uuid,p_error text)
returns void
language plpgsql security definer set search_path=''
as $$
declare v_intent public.link_payment_intents%rowtype;
begin
  if not private.link_payment_service_authorized_v1() then raise exception 'service role required'; end if;
  select * into v_intent from public.link_payment_intents where id=p_payment_intent_id for update;
  if not found then return; end if;
  update public.link_payment_intents set status='error',metadata=metadata||jsonb_build_object('last_error',left(coalesce(p_error,'unknown error'),500)) where id=v_intent.id;
  update public.taxi_hotel_payments set status='failed',metadata=metadata||jsonb_build_object('last_error',left(coalesce(p_error,'unknown error'),500)) where id=v_intent.operational_payment_id;
  update public.command_bus set status='failed',error=left(coalesce(p_error,'unknown error'),500),processed_at=now() where id=v_intent.command_id;
end;
$$;
revoke all on function public.link_fail_mercado_pago_checkout_v1(uuid,text) from public,anon,authenticated;
grant execute on function public.link_fail_mercado_pago_checkout_v1(uuid,text) to service_role;

create or replace function public.link_verify_mercado_pago_account_v1(
  p_business_id uuid,p_environment text,p_external_merchant_id text
)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_account public.link_payment_provider_accounts%rowtype; v_business public.link_world_businesses%rowtype;
begin
  if not private.link_payment_service_authorized_v1() then raise exception 'service role required'; end if;
  if p_environment not in ('test','production') then raise exception 'invalid payment environment'; end if;
  if nullif(btrim(p_external_merchant_id),'') is null then raise exception 'merchant id is required'; end if;
  select * into v_business from public.link_world_businesses where id=p_business_id;
  if not found then raise exception 'business not found'; end if;
  update public.link_payment_provider_accounts set
    external_merchant_id=btrim(p_external_merchant_id),
    status=case when p_environment='test' then 'sandbox_ready' else 'active' end,
    verified_at=now(),last_error=null
  where business_id=p_business_id and provider='mercado_pago' and environment=p_environment
  returning * into v_account;
  if not found then raise exception 'payment provider account not found'; end if;

  insert into public.integration_connections(provider,connection_key,mode,status,last_seen_at,last_error,metadata)
  values('mercado_pago',v_business.global_id||':'||p_environment,'checkout_pro','active',now(),null,
    jsonb_build_object('business_id',p_business_id,'environment',p_environment,'auth','edge_secret_reference','secret_stored',false))
  on conflict (provider,connection_key) do update set status='active',last_seen_at=now(),last_error=null,
    metadata=public.integration_connections.metadata||excluded.metadata,updated_at=now();

  perform private.link_refresh_financial_achievements_v1(p_business_id);
  return jsonb_build_object('account_id',v_account.id,'status',v_account.status,'environment',v_account.environment,'verified_at',v_account.verified_at);
end;
$$;
revoke all on function public.link_verify_mercado_pago_account_v1(uuid,text,text) from public,anon,authenticated;
grant execute on function public.link_verify_mercado_pago_account_v1(uuid,text,text) to service_role;

create or replace function public.link_ingest_mercado_pago_payment_v1(
  p_payment jsonb,
  p_event_key text,
  p_signature_verified boolean,
  p_request_id text default null,
  p_payload_digest text default null
)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_intent public.link_payment_intents%rowtype;
  v_event public.link_payment_events%rowtype;
  v_status text;
  v_internal_status text;
  v_payment_status text;
  v_amount numeric(14,2);
  v_net_received numeric(14,2);
  v_fee numeric(14,2);
  v_payment_id text;
  v_external_reference text;
  v_occurred_at timestamptz;
begin
  if not private.link_payment_service_authorized_v1() then raise exception 'service role required'; end if;
  if p_payment is null or jsonb_typeof(p_payment)<>'object' then raise exception 'payment must be an object'; end if;
  if p_signature_verified is not true then raise exception 'verified webhook signature required'; end if;
  if nullif(btrim(p_event_key),'') is null then raise exception 'event key is required'; end if;

  select * into v_event from public.link_payment_events where event_key=p_event_key;
  if found then return jsonb_build_object('duplicate',true,'event_id',v_event.id,'payment_intent_id',v_event.payment_intent_id); end if;

  v_payment_id:=nullif(p_payment->>'id','');
  v_status:=lower(coalesce(p_payment->>'status',''));
  v_external_reference:=nullif(p_payment->>'external_reference','');
  v_amount:=nullif(p_payment->>'transaction_amount','')::numeric;
  if v_payment_id is null or v_external_reference is null or v_amount is null then raise exception 'payment identity, reference and amount are required'; end if;

  select * into v_intent from public.link_payment_intents where external_reference=v_external_reference for update;
  if not found then raise exception 'payment intent not found for external reference'; end if;
  if v_intent.provider_payment_id is not null and v_intent.provider_payment_id<>v_payment_id then raise exception 'provider payment id mismatch'; end if;
  if v_amount<>v_intent.gross_amount then raise exception 'payment amount mismatch'; end if;
  if coalesce(p_payment->>'currency_id','')<>v_intent.currency then raise exception 'payment currency mismatch'; end if;

  v_internal_status:=case v_status
    when 'approved' then 'approved'
    when 'pending' then 'pending'
    when 'in_process' then 'pending'
    when 'rejected' then 'rejected'
    when 'cancelled' then 'cancelled'
    when 'refunded' then 'refunded'
    when 'charged_back' then 'charged_back'
    else 'pending' end;
  v_payment_status:=case v_internal_status
    when 'approved' then 'paid'
    when 'rejected' then 'failed'
    when 'cancelled' then 'cancelled'
    when 'refunded' then 'refunded'
    when 'charged_back' then 'refunded'
    else 'link_sent' end;
  v_occurred_at:=coalesce(nullif(p_payment->>'date_last_updated','')::timestamptz,now());

  insert into public.link_payment_events(
    payment_intent_id,environment,event_key,provider_payment_id,provider_status,provider_status_detail,
    request_id,signature_verified,payload_digest,occurred_at,metadata
  ) values (
    v_intent.id,v_intent.environment,p_event_key,v_payment_id,v_status,p_payment->>'status_detail',
    p_request_id,true,p_payload_digest,v_occurred_at,
    jsonb_build_object('payment_method_id',p_payment->>'payment_method_id','payment_type_id',p_payment->>'payment_type_id')
  ) returning * into v_event;

  update public.link_payment_intents set
    provider_payment_id=v_payment_id,status=v_internal_status,
    approved_at=case when v_internal_status='approved' then coalesce(nullif(p_payment->>'date_approved','')::timestamptz,now()) else approved_at end,
    cancelled_at=case when v_internal_status in ('cancelled','charged_back') then now() else cancelled_at end,
    refunded_at=case when v_internal_status in ('refunded','charged_back') then now() else refunded_at end,
    metadata=metadata||jsonb_build_object('provider_status_detail',p_payment->>'status_detail','last_event_id',v_event.id)
  where id=v_intent.id returning * into v_intent;

  update public.taxi_hotel_payments set
    provider_payment_id=v_payment_id,status=v_payment_status,
    paid_at=case when v_payment_status='paid' then coalesce(nullif(p_payment->>'date_approved','')::timestamptz,now()) else paid_at end,
    refunded_at=case when v_payment_status='refunded' then now() else refunded_at end,
    metadata=metadata||jsonb_build_object('payment_intent_id',v_intent.id,'provider_status',v_status,'provider_status_detail',p_payment->>'status_detail')
  where id=v_intent.operational_payment_id;

  update public.link_world_transactions set
    status=case when v_internal_status='approved' then 'paid' when v_internal_status in ('cancelled','refunded','charged_back') then 'cancelled' else status end,
    paid_at=case when v_internal_status='approved' then coalesce(nullif(p_payment->>'date_approved','')::timestamptz,now()) else paid_at end,
    payment_method='mercado_pago:'||coalesce(p_payment->>'payment_method_id','unknown'),
    metadata=metadata||jsonb_build_object('payment_status',v_internal_status,'provider_payment_id',v_payment_id,'provider_status_detail',p_payment->>'status_detail')
  where id=v_intent.transaction_id;

  if v_internal_status='approved' then
    v_net_received:=coalesce(nullif(p_payment#>>'{transaction_details,net_received_amount}','')::numeric,v_amount);
    select coalesce(sum((x->>'amount')::numeric),0) into v_fee
    from jsonb_array_elements(coalesce(p_payment->'fee_details','[]'::jsonb)) x;
    insert into public.link_payment_settlements(
      payment_intent_id,gross_amount,provider_fee_amount,provider_fee_tax_amount,net_received_amount,currency,status,
      expected_release_at,reconciliation_evidence
    ) values (
      v_intent.id,v_amount,v_fee,null,v_net_received,v_intent.currency,'observed',
      nullif(p_payment->>'money_release_date','')::timestamptz,
      jsonb_build_object('source','mercado_pago_payment_api','provider_fee_tax_status','pending_report_reconciliation')
    ) on conflict (payment_intent_id) do update set
      gross_amount=excluded.gross_amount,provider_fee_amount=excluded.provider_fee_amount,
      net_received_amount=excluded.net_received_amount,expected_release_at=excluded.expected_release_at,
      reconciliation_evidence=public.link_payment_settlements.reconciliation_evidence||excluded.reconciliation_evidence,
      updated_at=now();
  end if;

  update public.link_payment_provider_accounts set webhook_status='verified',last_webhook_at=now(),last_error=null
    where id=v_intent.provider_account_id;

  insert into public.event_bus(
    control_id,source_provider,event_type,entity_type,global_id,external_id,correlation_id,dedupe_key,payload,occurred_at,gesture_code
  ) select
    '00000000-0000-0000-0000-000000000001'::uuid,'mercado-pago','payment.'||v_internal_status,
    'payment_intent',v_intent.id::text,v_payment_id,v_intent.external_reference,
    'mercado-pago:payment-event:'||p_event_key,
    jsonb_build_object('payment_intent_id',v_intent.id,'environment',v_intent.environment,'amount',v_intent.gross_amount,'currency',v_intent.currency,'status',v_internal_status),
    v_occurred_at,c.gesture_code
  from public.command_bus c where c.id=v_intent.command_id
  on conflict (dedupe_key) do nothing;

  perform private.link_refresh_financial_achievements_v1(v_intent.business_id);
  return jsonb_build_object('duplicate',false,'event_id',v_event.id,'payment_intent_id',v_intent.id,'status',v_internal_status);
end;
$$;
revoke all on function public.link_ingest_mercado_pago_payment_v1(jsonb,text,boolean,text,text) from public,anon,authenticated;
grant execute on function public.link_ingest_mercado_pago_payment_v1(jsonb,text,boolean,text,text) to service_role;

create or replace function public.link_reconcile_mercado_pago_settlement_v1(
  p_payment_intent_id uuid,p_evidence jsonb
)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_intent public.link_payment_intents%rowtype; v_settlement public.link_payment_settlements%rowtype;
begin
  if not public.link_world_is_member() then raise exception 'LINK WORLD member session required'; end if;
  if p_evidence is null or jsonb_typeof(p_evidence)<>'object' or p_evidence='{}'::jsonb then raise exception 'reconciliation evidence is required'; end if;
  select * into v_intent from public.link_payment_intents where id=p_payment_intent_id for update;
  if not found or v_intent.status<>'approved' then raise exception 'approved payment intent not found'; end if;
  update public.link_payment_settlements set status='reconciled',reconciled_at=now(),released_at=coalesce(released_at,now()),
    reconciliation_evidence=reconciliation_evidence||p_evidence||jsonb_build_object('reconciled_by',auth.uid())
  where payment_intent_id=v_intent.id returning * into v_settlement;
  if not found then raise exception 'payment settlement not found'; end if;
  update public.link_world_transactions set status='settled',settled_at=now(),metadata=metadata||jsonb_build_object('settlement_id',v_settlement.id)
    where id=v_intent.transaction_id and status='paid';
  perform private.link_refresh_financial_achievements_v1(v_intent.business_id);
  return jsonb_build_object('payment_intent_id',v_intent.id,'settlement_id',v_settlement.id,'status',v_settlement.status,'reconciled_at',v_settlement.reconciled_at);
end;
$$;
revoke all on function public.link_reconcile_mercado_pago_settlement_v1(uuid,jsonb) from public,anon;
grant execute on function public.link_reconcile_mercado_pago_settlement_v1(uuid,jsonb) to authenticated,service_role;

create or replace view public.link_bancarization_progress_v
with (security_invoker=true)
as
select
  b.id as business_id,b.global_id as business_global_id,b.name as business_name,
  coalesce(sum(a.points),0)::integer as progress_points,
  (count(a.id) filter(where a.milestone_key='account_connected')>0) as account_connected,
  (count(a.id) filter(where a.milestone_key='webhook_verified')>0) as webhook_verified,
  (count(a.id) filter(where a.milestone_key='first_approved_payment')>0) as first_approved_payment,
  (count(a.id) filter(where a.milestone_key='documentary_complete')>0) as documentary_complete,
  (count(a.id) filter(where a.milestone_key='settlement_reconciled')>0) as settlement_reconciled,
  case
    when coalesce(sum(a.points),0)>=100 then 'ciclo_financiero_cerrado'
    when coalesce(sum(a.points),0)>=60 then 'flujo_formal_en_progreso'
    when coalesce(sum(a.points),0)>=20 then 'cobro_digital_conectado'
    else 'por_conectar'
  end as progress_stage,
  max(a.achieved_at) as last_achievement_at,
  'Madurez operativa basada en evidencia; no es un score crediticio.'::text as score_disclaimer
from public.link_world_businesses b
left join public.link_financial_achievements a on a.business_id=b.id and a.environment='production'
group by b.id,b.global_id,b.name;

create or replace view public.link_payment_dashboard_v
with (security_invoker=true)
as
select
  b.id as business_id,b.name as business_name,a.environment,a.status as account_status,
  a.webhook_status,count(i.id) as payment_intents,
  count(i.id) filter(where i.status='approved') as approved_payments,
  coalesce(sum(i.gross_amount) filter(where i.status='approved'),0) as approved_gross_amount,
  coalesce(sum(s.provider_fee_amount) filter(where i.status='approved'),0) as provider_fee_amount,
  coalesce(sum(s.net_received_amount) filter(where i.status='approved'),0) as net_received_amount,
  count(s.id) filter(where s.status='reconciled') as reconciled_settlements,
  max(i.updated_at) as last_payment_activity_at
from public.link_world_businesses b
join public.link_payment_provider_accounts a on a.business_id=b.id and a.provider='mercado_pago'
left join public.link_payment_intents i on i.provider_account_id=a.id
left join public.link_payment_settlements s on s.payment_intent_id=i.id
group by b.id,b.name,a.environment,a.status,a.webhook_status;

revoke all on public.link_bancarization_progress_v,public.link_payment_dashboard_v from anon;
grant select on public.link_bancarization_progress_v,public.link_payment_dashboard_v to authenticated,service_role;

insert into public.link_tax_profiles(
  profile_key,business_id,country_code,tax_treatment,tax_code,tax_rate,document_type,
  price_includes_tax,status,evidence,notes
)
select
  'taxi-hotel-cl-passenger-transport-v1',b.id,'CL','exempt','IVA_EXENTO_TRANSPORTE_PASAJEROS',0,
  'boleta_o_factura_exenta',true,'proposed',
  jsonb_build_array(
    jsonb_build_object('authority','Servicio de Impuestos Internos de Chile','url','https://www.sii.cl/preguntas_frecuentes/iva/001_030_1807.htm','claim','El transporte de pasajeros está exento de IVA.','checked_at','2026-09-28'),
    jsonb_build_object('authority','Servicio de Impuestos Internos de Chile','url','https://www.sii.cl/preguntas_frecuentes/iva/001_030_0756.htm','claim','Los servicios exentos deben documentarse con boleta o factura exenta.','checked_at','2026-09-28')
  ),
  'Hipótesis jurídica específica del servicio de transporte. Requiere revisión del contribuyente, intermediación y documento tributario antes de producción.'
from public.link_world_businesses b where b.slug='taxi-hotel'
on conflict (profile_key) do update set evidence=excluded.evidence,notes=excluded.notes,updated_at=now();

insert into public.link_payment_provider_accounts(
  business_id,provider,environment,status,webhook_status,credential_ref,metadata
)
select b.id,'mercado_pago',e.environment,'needs_credentials','unverified',
  case e.environment when 'test' then 'MERCADO_PAGO_TEST_ACCESS_TOKEN' else 'MERCADO_PAGO_ACCESS_TOKEN' end,
  jsonb_build_object('integration','checkout_pro','secrets_location','supabase_edge_function_secrets','real_charges_enabled',false)
from public.link_world_businesses b
cross join (values ('test'),('production')) e(environment)
where b.slug='taxi-hotel'
on conflict (business_id,provider,environment) do update set
  credential_ref=excluded.credential_ref,metadata=public.link_payment_provider_accounts.metadata||excluded.metadata,updated_at=now();

insert into public.integration_connections(provider,connection_key,mode,status,metadata)
select 'mercado_pago',b.global_id||':'||e.environment,'checkout_pro','disabled',
  jsonb_build_object('business_id',b.id,'environment',e.environment,'auth','edge_secret_reference','secret_stored',false,'activation','verify_connection')
from public.link_world_businesses b
cross join (values ('test'),('production')) e(environment)
where b.slug='taxi-hotel'
on conflict (provider,connection_key) do update set mode=excluded.mode,metadata=public.integration_connections.metadata||excluded.metadata,updated_at=now();

insert into public.action_registry(
  action_key,provider,description,permission_key,mode,input_schema,success_event,failure_event,enabled,metadata,updated_at
)
values
('finance.mercado_pago.verify_connection','mercado-pago','Verifica credenciales server-side con Mercado Pago y activa la cuenta correspondiente.','finance:provider:connect','write',
 '{"type":"object","required":["business_id","environment"],"properties":{"business_id":{"type":"string","format":"uuid"},"environment":{"enum":["test","production"]}}}'::jsonb,
 'payment.provider.verified','payment.provider.verification_failed',true,'{"executor":"edge:mercado-pago","autonomy":"member_requested","stores_secrets":false}'::jsonb,now()),
('finance.payment.checkout.create','mercado-pago','Crea un Checkout Pro idempotente desde una reserva y monto calculado en servidor.','finance:payment:create','write',
 '{"type":"object","required":["reservation_id","environment"],"properties":{"reservation_id":{"type":"string","format":"uuid"},"environment":{"enum":["test","production"]}}}'::jsonb,
 'payment.checkout.created','payment.checkout.failed',true,'{"executor":"edge:mercado-pago","autonomy":"member_requested","payment_data_owner":"mercado_pago"}'::jsonb,now()),
('finance.payment.webhook.ingest','mercado-pago','Valida firma, relee el pago desde Mercado Pago e ingiere evidencia idempotente.','finance:payment:ingest','write',
 '{"type":"object","required":["payment_id","signature"],"properties":{"payment_id":{"type":"string"},"signature":{"type":"string"}}}'::jsonb,
 'payment.status.updated','payment.webhook.rejected',true,'{"executor":"edge:mercado-pago","autonomy":"provider_event","requires_signature":true}'::jsonb,now()),
('finance.payment.settlement.reconcile','mercado-pago','Cierra la conciliación con evidencia y actualiza la madurez financiera.','finance:settlement:reconcile','write',
 '{"type":"object","required":["payment_intent_id","evidence"],"properties":{"payment_intent_id":{"type":"string","format":"uuid"},"evidence":{"type":"object"}}}'::jsonb,
 'payment.settlement.reconciled','payment.settlement.reconciliation_failed',true,'{"executor":"link_reconcile_mercado_pago_settlement_v1","autonomy":"human_evidence_required"}'::jsonb,now())
on conflict (action_key) do update set
  provider=excluded.provider,description=excluded.description,permission_key=excluded.permission_key,
  mode=excluded.mode,input_schema=excluded.input_schema,success_event=excluded.success_event,
  failure_event=excluded.failure_event,enabled=excluded.enabled,metadata=excluded.metadata,updated_at=now();

comment on table public.link_tax_profiles is 'Business-specific tax treatment with authoritative evidence. Proposed profiles cannot enable production checkout.';
comment on table public.link_payment_intents is 'Idempotent payment projection. Card data remains exclusively with Mercado Pago Checkout Pro.';
comment on table public.link_financial_achievements is 'Evidence-backed production milestones. Test payments never award points; this is not a credit score.';
comment on view public.link_bancarization_progress_v is 'Five production milestones of operational formalization, 20 points each. Not a bank or credit score.';
