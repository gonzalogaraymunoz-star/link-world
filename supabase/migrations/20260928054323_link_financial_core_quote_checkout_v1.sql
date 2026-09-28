create or replace function public.link_prepare_mercado_pago_quote_checkout_v1(
  p_sales_quote_id uuid,
  p_environment text default 'test'
)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
  v_quote public.sales_quotes%rowtype;
  v_business public.link_world_businesses%rowtype;
  v_policy public.link_financial_policies%rowtype;
  v_account public.link_payment_provider_accounts%rowtype;
  v_tax public.link_tax_profiles%rowtype;
  v_intent public.link_payment_intents%rowtype;
  v_transaction public.link_world_transactions%rowtype;
  v_command public.command_bus%rowtype;
  v_intent_id uuid;
  v_net numeric(14,2);
  v_tax_amount numeric(14,2);
  v_gross numeric(14,2);
begin
  if not public.link_world_is_member() then raise exception 'LINK WORLD member session required'; end if;
  if p_environment not in ('test','production') then raise exception 'invalid payment environment'; end if;

  select * into v_quote from public.sales_quotes where id=p_sales_quote_id for update;
  if not found then raise exception 'sales quote not found'; end if;
  if v_quote.status not in ('issued','accepted') then raise exception 'sales quote must be issued or accepted'; end if;
  if v_quote.valid_until is not null and v_quote.valid_until<now() then raise exception 'sales quote expired'; end if;
  if v_quote.total_amount<=0 then raise exception 'sales quote amount is invalid'; end if;

  select * into v_business from public.link_world_businesses where id=v_quote.business_id;
  if not found then raise exception 'business not found'; end if;

  select * into v_policy from public.link_financial_policies
   where business_id=v_business.id and status in ('proposed','verified')
   order by case status when 'verified' then 0 else 1 end,created_at desc limit 1;
  if not found then raise exception 'financial policy not found'; end if;
  if v_policy.collection_model not in ('link_collects','business_collects') then
    raise exception 'business collection model does not permit LINK checkout';
  end if;
  if p_environment='test' and v_policy.sandbox_enabled is not true then raise exception 'sandbox checkout disabled by financial policy'; end if;
  if p_environment='production' and (v_policy.status<>'verified' or v_policy.production_enabled is not true) then
    raise exception 'production financial policy is not enabled';
  end if;

  select * into v_account from public.link_payment_provider_accounts
   where business_id=v_business.id and provider='mercado_pago' and environment=p_environment;
  if not found then raise exception 'Mercado Pago route is not configured for business'; end if;
  if (p_environment='test' and v_account.status not in ('sandbox_ready','active'))
     or (p_environment='production' and v_account.status<>'active') then
    raise exception 'Mercado Pago account is not ready';
  end if;
  if p_environment='production' and coalesce((v_account.metadata->>'real_charges_enabled')::boolean,false) is not true then
    raise exception 'production charges are disabled by the safety latch';
  end if;

  select * into v_tax from public.link_tax_profiles
   where business_id=v_business.id and status in ('proposed','verified')
    and valid_from<=current_date and (valid_until is null or valid_until>=current_date)
   order by case status when 'verified' then 0 else 1 end,valid_from desc limit 1;
  if not found then raise exception 'active tax profile not found'; end if;
  if p_environment='production' and v_tax.status<>'verified' then raise exception 'production checkout requires a verified tax profile'; end if;

  select * into v_intent from public.link_payment_intents
   where sales_quote_id=p_sales_quote_id and environment=p_environment
    and status in ('draft','preference_created','pending','approved')
   order by created_at desc limit 1;
  if found then
    return jsonb_build_object(
      'payment_intent_id',v_intent.id,'status',v_intent.status,'environment',v_intent.environment,
      'external_reference',v_intent.external_reference,'currency',v_intent.currency,
      'net_amount',v_intent.net_amount,'tax_amount',v_intent.tax_amount,'gross_amount',v_intent.gross_amount,
      'checkout_url',case when p_environment='test' then v_intent.sandbox_checkout_url else v_intent.checkout_url end,
      'business_name',v_business.name,'quote_number',v_quote.quote_number,'product_key',v_quote.product_key,'reused',true
    );
  end if;

  v_net:=round(v_quote.base_amount+v_quote.adjustments_amount,2);
  v_tax_amount:=round(v_quote.tax_amount,2);
  v_gross:=round(v_quote.total_amount,2);

  insert into public.link_world_transactions(
    business_id,business_global_id,source_domain,direction,transaction_type,status,
    amount,currency,payment_method,external_reference,documentary_status,occurred_at,due_at,metadata
  ) values (
    v_business.id,v_business.global_id,'world','income','sale','pending_payment',
    v_gross,v_quote.currency,'mercado_pago','sales_quote:'||v_quote.id::text,'required',now(),now(),
    jsonb_build_object(
      'sales_quote_id',v_quote.id,'quote_number',v_quote.quote_number,'product_key',v_quote.product_key,
      'gross_amount',v_gross,'net_sale_amount',v_net,'tax_amount',v_tax_amount,
      'tax_treatment',v_tax.tax_treatment,'tax_profile_key',v_tax.profile_key,
      'financial_policy_key',v_policy.policy_key,'collection_model',v_policy.collection_model,
      'environment',p_environment,'payment_status','pending','allocation_status','pending'
    )
  ) returning * into v_transaction;

  v_intent_id:=gen_random_uuid();
  insert into public.link_payment_intents(
    id,business_id,provider_account_id,tax_profile_id,sales_quote_id,transaction_id,
    environment,external_reference,idempotency_key,currency,net_amount,tax_amount,gross_amount,status,metadata
  ) values (
    v_intent_id,v_business.id,v_account.id,v_tax.id,v_quote.id,v_transaction.id,
    p_environment,'LNKMP-'||v_intent_id::text,'mp-preference:'||v_intent_id::text,
    v_quote.currency,v_net,v_tax_amount,v_gross,'draft',
    jsonb_build_object(
      'business_slug',v_business.slug,'business_name',v_business.name,'quote_number',v_quote.quote_number,
      'product_key',v_quote.product_key,'financial_policy_key',v_policy.policy_key
    )
  ) returning * into v_intent;

  insert into public.command_bus(
    control_id,command_type,action_key,actor,target_provider,entity_type,global_id,payload,
    idempotency_key,status,attempts,source_domain,correlation_id,requires_approval,approval_status
  ) values (
    '00000000-0000-0000-0000-000000000001'::uuid,'payment_checkout',
    'finance.payment.checkout.create',coalesce(auth.uid()::text,'link-world-member'),'mercado-pago',
    'payment_intent',v_intent.id::text,
    jsonb_build_object('payment_intent_id',v_intent.id,'sales_quote_id',v_quote.id,'business_id',v_business.id,'environment',p_environment),
    'mp-checkout:'||v_intent.id::text,'processing',1,'world',v_intent.external_reference,false,'not_required'
  ) returning * into v_command;

  update public.link_payment_intents set command_id=v_command.id where id=v_intent.id returning * into v_intent;

  return jsonb_build_object(
    'payment_intent_id',v_intent.id,'command_id',v_command.id,'status',v_intent.status,
    'environment',v_intent.environment,'external_reference',v_intent.external_reference,
    'currency',v_intent.currency,'net_amount',v_intent.net_amount,'tax_amount',v_intent.tax_amount,
    'gross_amount',v_intent.gross_amount,'business_name',v_business.name,'business_slug',v_business.slug,
    'quote_number',v_quote.quote_number,'product_key',v_quote.product_key,'tax_treatment',v_tax.tax_treatment,
    'document_type',v_tax.document_type,'collection_model',v_policy.collection_model,'reused',false
  );
end; $$;

revoke all on function public.link_prepare_mercado_pago_quote_checkout_v1(uuid,text) from public,anon;
grant execute on function public.link_prepare_mercado_pago_quote_checkout_v1(uuid,text) to authenticated;

comment on function public.link_prepare_mercado_pago_quote_checkout_v1(uuid,text)
is 'Generic LINK WORLD checkout adapter: converts an issued/accepted sales quote into a Mercado Pago payment intent under verified financial gates.';