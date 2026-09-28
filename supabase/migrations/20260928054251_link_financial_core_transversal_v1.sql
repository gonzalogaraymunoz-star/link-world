create table if not exists public.link_financial_policies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  policy_key text not null unique,
  collection_model text not null default 'undecided' check (collection_model in ('undecided','link_collects','business_collects','partner_collects','external')),
  payment_provider text not null default 'mercado_pago',
  provider_connection_key text,
  default_currency text not null default 'CLP' check (default_currency ~ '^[A-Z]{3}$'),
  settlement_model text not null default 'pending_definition' check (settlement_model in ('pending_definition','merchant_direct','business_pays_suppliers','partner_pays_link_commission','link_distributes','external')),
  link_fee_rule jsonb not null default '{}'::jsonb check (jsonb_typeof(link_fee_rule)='object'),
  documentary_rule jsonb not null default '{}'::jsonb check (jsonb_typeof(documentary_rule)='object'),
  status text not null default 'proposed' check (status in ('proposed','verified','retired')),
  sandbox_enabled boolean not null default true,
  production_enabled boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint link_financial_policies_approval_chk check (
    (status='verified' and approved_by is not null and approved_at is not null) or status<>'verified'
  )
);
create unique index if not exists link_financial_policies_business_active_uidx
  on public.link_financial_policies(business_id) where status in ('proposed','verified');

create table if not exists public.link_financial_split_rules (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.link_financial_policies(id) on delete cascade,
  rule_key text not null,
  beneficiary_type text not null check (beneficiary_type in ('link','business','partner','supplier','hotel','seller','other')),
  beneficiary_ref text,
  calculation_type text not null check (calculation_type in ('contractual','percentage','fixed','remainder')),
  value numeric(14,4),
  priority integer not null default 100 check (priority>=0),
  status text not null default 'proposed' check (status in ('proposed','verified','retired')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(policy_id,rule_key),
  constraint link_financial_split_rules_value_chk check (
    (calculation_type='contractual' and value is null)
    or (calculation_type='percentage' and value between 0 and 100)
    or (calculation_type='fixed' and value>=0)
    or (calculation_type='remainder' and value is null)
  )
);

alter table public.link_payment_provider_accounts add column if not exists connection_key text;
update public.link_payment_provider_accounts set connection_key='link-mercado-pago-primary'
where provider='mercado_pago' and connection_key is null;

insert into public.link_financial_policies(
  business_id,policy_key,collection_model,payment_provider,provider_connection_key,default_currency,
  settlement_model,link_fee_rule,documentary_rule,status,sandbox_enabled,production_enabled,metadata
)
select b.id,'financial:'||b.slug||':v1',
 case b.slug when 'taxi-hotel' then 'business_collects' when 'hotel-experience' then 'business_collects'
   when 'link-cupones' then 'partner_collects' when 'caracol' then 'external' else 'undecided' end,
 'mercado_pago',case when b.slug in ('taxi-hotel','hotel-experience') then 'link-mercado-pago-primary' else null end,'CLP',
 case b.slug when 'taxi-hotel' then 'business_pays_suppliers' when 'hotel-experience' then 'business_pays_suppliers'
   when 'link-cupones' then 'partner_pays_link_commission' when 'caracol' then 'external' else 'pending_definition' end,
 case b.slug
   when 'taxi-hotel' then jsonb_build_object('type','margin_after_supplier_and_commissions','status','requires_normalization')
   when 'hotel-experience' then jsonb_build_object('type','markup_or_fee','status','contractual')
   when 'link-cupones' then jsonb_build_object('type','contractual_percentage','known_range_percent',jsonb_build_array(5,10),'status','requires_agreement')
   when 'caracol' then jsonb_build_object('type','service_fee','status','external_contract')
   else jsonb_build_object('type','unknown') end,
 jsonb_build_object('tax_profile_required_for_production',true,'financial_document_required_for_close',true),
 'proposed',true,false,jsonb_build_object('source','link_financial_core_v1','no_invented_split_amounts',true)
from public.link_world_businesses b
where b.slug in ('taxi-hotel','hotel-experience','link-cupones','caracol')
on conflict (policy_key) do nothing;

insert into public.link_financial_split_rules(policy_id,rule_key,beneficiary_type,calculation_type,value,priority,status,metadata)
select p.id,'link-commission','link','contractual',null,10,'proposed',
 jsonb_build_object('known_range_percent',jsonb_build_array(5,10),'requires_business_agreement',true)
from public.link_financial_policies p join public.link_world_businesses b on b.id=p.business_id
where b.slug='link-cupones' on conflict (policy_id,rule_key) do nothing;

insert into public.link_financial_split_rules(policy_id,rule_key,beneficiary_type,calculation_type,value,priority,status,metadata)
select p.id,'supplier-cost','supplier','contractual',null,10,'proposed',jsonb_build_object('requires_supplier_cost_evidence',true)
from public.link_financial_policies p join public.link_world_businesses b on b.id=p.business_id
where b.slug in ('taxi-hotel','hotel-experience') on conflict (policy_id,rule_key) do nothing;

insert into public.link_financial_split_rules(policy_id,rule_key,beneficiary_type,calculation_type,value,priority,status,metadata)
select p.id,'link-margin','link','remainder',null,100,'proposed',jsonb_build_object('only_after_verified_costs_and_commissions',true)
from public.link_financial_policies p join public.link_world_businesses b on b.id=p.business_id
where b.slug='taxi-hotel' on conflict (policy_id,rule_key) do nothing;

insert into public.link_payment_provider_accounts(
  business_id,provider,environment,status,webhook_status,credential_ref,connection_key,metadata
)
select b.id,'mercado_pago',env.environment,'needs_credentials','unverified',
 case env.environment when 'test' then 'MERCADO_PAGO_TEST_ACCESS_TOKEN' else 'MERCADO_PAGO_ACCESS_TOKEN' end,
 'link-mercado-pago-primary',
 jsonb_build_object('integration','checkout_pro','connection_scope','link_shared','secrets_location','supabase_edge_function_secrets','real_charges_enabled',false)
from public.link_world_businesses b cross join (values ('test'),('production')) env(environment)
where b.slug='hotel-experience'
on conflict (business_id,provider,environment) do update set
 connection_key=excluded.connection_key,
 metadata=public.link_payment_provider_accounts.metadata||jsonb_build_object('connection_scope','link_shared','real_charges_enabled',false),
 updated_at=now();

update public.link_payment_provider_accounts
set metadata=metadata||jsonb_build_object('connection_scope','link_shared'),
 connection_key='link-mercado-pago-primary',updated_at=now()
where provider='mercado_pago' and business_id=(select id from public.link_world_businesses where slug='taxi-hotel');

insert into public.link_tax_profiles(
 profile_key,business_id,country_code,tax_treatment,tax_code,tax_rate,document_type,price_includes_tax,status,evidence,notes
)
select 'financial:'||b.slug||':tax-pending-v1',b.id,'CL','unknown','PENDING',0,'pending_definition',true,'proposed','[]'::jsonb,
 'Placeholder explícito: no habilita cobro productivo. Requiere definición tributaria verificada por negocio.'
from public.link_world_businesses b
where b.slug in ('hotel-experience','link-cupones','caracol')
 and not exists(select 1 from public.link_tax_profiles t where t.business_id=b.id and t.status in ('proposed','verified'))
on conflict (profile_key) do nothing;

alter table public.link_financial_policies enable row level security;
alter table public.link_financial_split_rules enable row level security;
revoke all on public.link_financial_policies from anon;
revoke all on public.link_financial_split_rules from anon;
grant select on public.link_financial_policies to authenticated;
grant select on public.link_financial_split_rules to authenticated;
create policy link_financial_policies_member_select on public.link_financial_policies
 for select to authenticated using ((select public.link_world_is_member()));
create policy link_financial_split_rules_member_select on public.link_financial_split_rules
 for select to authenticated using ((select public.link_world_is_member()));

create or replace view public.link_financial_core_v with (security_invoker=true) as
select b.id business_id,b.global_id,b.slug,b.name,b.sector,b.country,
 p.id policy_id,p.policy_key,p.collection_model,p.payment_provider,p.provider_connection_key,
 p.default_currency,p.settlement_model,p.link_fee_rule,p.documentary_rule,p.status policy_status,
 p.sandbox_enabled,p.production_enabled,
 coalesce((select jsonb_agg(jsonb_build_object(
   'rule_key',s.rule_key,'beneficiary_type',s.beneficiary_type,'beneficiary_ref',s.beneficiary_ref,
   'calculation_type',s.calculation_type,'value',s.value,'status',s.status,'metadata',s.metadata
 ) order by s.priority,s.rule_key) from public.link_financial_split_rules s where s.policy_id=p.id and s.status<>'retired'),'[]'::jsonb) split_rules,
 coalesce((select jsonb_agg(jsonb_build_object(
   'environment',a.environment,'status',a.status,'webhook_status',a.webhook_status,
   'connection_key',a.connection_key,'merchant_verified',a.external_merchant_id is not null,
   'real_charges_enabled',coalesce((a.metadata->>'real_charges_enabled')::boolean,false)
 ) order by a.environment) from public.link_payment_provider_accounts a where a.business_id=b.id),'[]'::jsonb) payment_routes,
 coalesce((select jsonb_agg(jsonb_build_object(
   'profile_key',t.profile_key,'tax_treatment',t.tax_treatment,'tax_rate',t.tax_rate,'document_type',t.document_type,'status',t.status
 ) order by t.valid_from desc) from public.link_tax_profiles t where t.business_id=b.id and t.status<>'retired'),'[]'::jsonb) tax_profiles
from public.link_world_businesses b
left join public.link_financial_policies p on p.business_id=b.id and p.status in ('proposed','verified');
grant select on public.link_financial_core_v to authenticated;
revoke all on public.link_financial_core_v from anon;

create or replace function public.link_verify_mercado_pago_account_v1(p_business_id uuid,p_environment text,p_external_merchant_id text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_account public.link_payment_provider_accounts%rowtype; v_business public.link_world_businesses%rowtype;
 v_connection_key text; v_updated integer:=0;
begin
 if not private.link_payment_service_authorized_v1() then raise exception 'service role required'; end if;
 if p_environment not in ('test','production') then raise exception 'invalid payment environment'; end if;
 if nullif(btrim(p_external_merchant_id),'') is null then raise exception 'merchant id is required'; end if;
 select * into v_business from public.link_world_businesses where id=p_business_id;
 if not found then raise exception 'business not found'; end if;
 select * into v_account from public.link_payment_provider_accounts
  where business_id=p_business_id and provider='mercado_pago' and environment=p_environment;
 if not found then raise exception 'payment provider account not found'; end if;
 v_connection_key:=coalesce(v_account.connection_key,v_business.global_id||':'||p_environment);
 update public.link_payment_provider_accounts set
  external_merchant_id=btrim(p_external_merchant_id),
  status=case when p_environment='test' then 'sandbox_ready' else 'active' end,
  verified_at=now(),last_error=null,updated_at=now()
 where provider='mercado_pago' and environment=p_environment and coalesce(connection_key,'')=coalesce(v_connection_key,'');
 get diagnostics v_updated=row_count;
 insert into public.integration_connections(provider,connection_key,mode,status,last_seen_at,last_error,metadata)
 values('mercado_pago',v_connection_key||':'||p_environment,'checkout_pro','active',now(),null,
  jsonb_build_object('environment',p_environment,'auth','edge_secret_reference','secret_stored',false,'routed_businesses',v_updated))
 on conflict (provider,connection_key) do update set status='active',last_seen_at=now(),last_error=null,
  metadata=public.integration_connections.metadata||excluded.metadata,updated_at=now();
 perform private.link_refresh_financial_achievements_v1(p_business_id);
 return jsonb_build_object('connection_key',v_connection_key,'status',case when p_environment='test' then 'sandbox_ready' else 'active' end,
  'environment',p_environment,'verified_at',now(),'routed_businesses',v_updated,'production_charges_enabled',false);
end; $$;
revoke all on function public.link_verify_mercado_pago_account_v1(uuid,text,text) from public,anon,authenticated;
grant execute on function public.link_verify_mercado_pago_account_v1(uuid,text,text) to service_role;

comment on table public.link_financial_policies is 'Transversal financial policy per LINK WORLD business. Separates collection ownership from payment rails.';
comment on table public.link_financial_split_rules is 'Proposed/verified economic allocation rules. Contractual rows intentionally allow null amounts until evidence exists.';
comment on view public.link_financial_core_v is 'Read model for LINK financial core: collection, provider route, tax posture and split rules per business.';