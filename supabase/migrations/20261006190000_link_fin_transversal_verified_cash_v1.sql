create or replace view public.link_fin_real_movements_v
with (security_invoker=true) as
select
  t.id,
  t.business_id,
  b.global_id as business_global_id,
  b.slug as business_slug,
  b.name as business_name,
  t.direction,
  t.transaction_type,
  t.status,
  t.amount,
  t.currency,
  t.payment_method,
  t.external_reference,
  t.documentary_status,
  t.occurred_at,
  t.paid_at,
  t.settled_at,
  t.metadata,
  d.id as evidence_document_id,
  d.document_type as evidence_document_type,
  d.drive_url as evidence_url,
  d.file_name as evidence_file_name,
  d.issue_date as evidence_issue_date,
  coalesce((t.metadata->>'gross_amount')::numeric, t.amount, 0) as gross_amount,
  coalesce((t.metadata->>'withholding_amount')::numeric, 0) as tax_amount,
  case when t.direction='income'
    then coalesce((t.metadata->>'net_amount')::numeric, t.amount, 0)
    else coalesce(t.amount,0)
  end as net_basis_amount,
  coalesce(t.metadata->>'service', t.transaction_type, 'Movimiento') as concept,
  (
    t.paid_at is not null
    or t.settled_at is not null
    or lower(coalesce(t.status,'')) in ('paid','settled','completed','confirmed')
    or lower(coalesce(t.metadata->>'payment_status','')) in ('paid','verified','confirmed','settled','completed')
  ) as payment_verified
from public.link_world_transactions t
join public.link_world_businesses b on b.id=t.business_id
join lateral (
  select d1.*
  from public.link_world_documents d1
  where d1.transaction_id=t.id
    and nullif(btrim(d1.drive_url),'') is not null
  order by d1.issue_date desc nulls last, d1.created_at desc
  limit 1
) d on true;

revoke all on public.link_fin_real_movements_v from anon;
grant select on public.link_fin_real_movements_v to authenticated;

create or replace view public.link_fin_real_summary_v
with (security_invoker=true) as
select
  b.id as business_id,
  b.global_id as business_global_id,
  b.slug as business_slug,
  b.name as business_name,
  coalesce(sum(case when m.direction='income' then m.gross_amount else 0 end),0)::numeric as income_gross,
  coalesce(sum(case when m.direction='income' then m.tax_amount else 0 end),0)::numeric as taxes,
  coalesce(sum(case when m.direction='income' then m.net_basis_amount else 0 end),0)::numeric as income_after_tax,
  coalesce(sum(case when m.direction in ('expense','outflow') and m.payment_verified then m.net_basis_amount else 0 end),0)::numeric as outflows,
  (
    coalesce(sum(case when m.direction='income' and m.payment_verified then m.net_basis_amount else 0 end),0)
    -
    coalesce(sum(case when m.direction in ('expense','outflow') and m.payment_verified then m.net_basis_amount else 0 end),0)
  )::numeric as net_real,
  count(m.id)::integer as evidenced_movements,
  count(distinct m.evidence_document_id)::integer as evidence_documents,
  max(m.occurred_at) as last_financial_event_at,
  coalesce(sum(case when m.direction='income' and m.payment_verified then m.net_basis_amount else 0 end),0)::numeric as income_collected,
  count(m.id) filter (where m.payment_verified)::integer as verified_cash_movements
from public.link_world_businesses b
left join public.link_fin_real_movements_v m on m.business_id=b.id
group by b.id,b.global_id,b.slug,b.name;

revoke all on public.link_fin_real_summary_v from anon;
grant select on public.link_fin_real_summary_v to authenticated;

comment on view public.link_fin_real_summary_v is
'Per-business FIN evidence-only totals. Invoicing and taxes come from persistent documents; collected income/outflows/net real require verified payment state.';
