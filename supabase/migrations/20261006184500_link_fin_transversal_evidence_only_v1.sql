create table if not exists public.link_financial_real_relationships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.link_world_businesses(id) on delete cascade,
  role_type text not null check (role_type in ('invoice_issuer','collector','service_provider','collaborator','transfer_sender','transfer_recipient','tax_authority')),
  party_name text not null check (nullif(btrim(party_name),'') is not null),
  party_ref text,
  evidence_document_id uuid references public.link_world_documents(id) on delete restrict,
  evidence_transaction_id uuid references public.link_world_transactions(id) on delete restrict,
  evidence_note text,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint link_financial_real_relationships_evidence_chk check (
    evidence_document_id is not null or evidence_transaction_id is not null
  ),
  constraint link_financial_real_relationships_dates_chk check (
    valid_to is null or valid_from is null or valid_to >= valid_from
  )
);

create unique index if not exists link_financial_real_relationships_identity_uidx
on public.link_financial_real_relationships(
  business_id, role_type, lower(party_name),
  coalesce(evidence_document_id,'00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(evidence_transaction_id,'00000000-0000-0000-0000-000000000000'::uuid)
);

alter table public.link_financial_real_relationships enable row level security;
revoke all on public.link_financial_real_relationships from anon;
revoke all on public.link_financial_real_relationships from authenticated;
grant select on public.link_financial_real_relationships to authenticated;

drop policy if exists link_financial_real_relationships_member_select on public.link_financial_real_relationships;
create policy link_financial_real_relationships_member_select
on public.link_financial_real_relationships
for select to authenticated
using ((select public.link_world_is_member()));

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
  case
    when t.direction='income'
      then coalesce((t.metadata->>'net_amount')::numeric, t.amount, 0)
    else coalesce(t.amount,0)
  end as net_basis_amount,
  coalesce(t.metadata->>'service', t.transaction_type, 'Movimiento') as concept
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

create or replace view public.link_fin_real_roles_v
with (security_invoker=true) as
select
  r.id,
  r.business_id,
  b.global_id as business_global_id,
  b.slug as business_slug,
  b.name as business_name,
  r.role_type,
  r.party_name,
  r.party_ref,
  r.evidence_document_id,
  r.evidence_transaction_id,
  coalesce(d.drive_url, td.drive_url) as evidence_url,
  coalesce(d.file_name, td.file_name) as evidence_file_name,
  r.evidence_note,
  r.valid_from,
  r.valid_to,
  r.created_at
from public.link_financial_real_relationships r
join public.link_world_businesses b on b.id=r.business_id
left join public.link_world_documents d on d.id=r.evidence_document_id
left join lateral (
  select d2.drive_url,d2.file_name
  from public.link_world_documents d2
  where d2.transaction_id=r.evidence_transaction_id
    and nullif(btrim(d2.drive_url),'') is not null
  order by d2.issue_date desc nulls last,d2.created_at desc
  limit 1
) td on true
where
  (r.evidence_document_id is not null and nullif(btrim(d.drive_url),'') is not null)
  or
  (r.evidence_transaction_id is not null and nullif(btrim(td.drive_url),'') is not null);

revoke all on public.link_fin_real_roles_v from anon;
grant select on public.link_fin_real_roles_v to authenticated;

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
  coalesce(sum(case when m.direction in ('expense','outflow') then m.net_basis_amount else 0 end),0)::numeric as outflows,
  (
    coalesce(sum(case when m.direction='income' then m.net_basis_amount else 0 end),0)
    -
    coalesce(sum(case when m.direction in ('expense','outflow') then m.net_basis_amount else 0 end),0)
  )::numeric as net_real,
  count(m.id)::integer as evidenced_movements,
  count(distinct m.evidence_document_id)::integer as evidence_documents,
  max(m.occurred_at) as last_financial_event_at
from public.link_world_businesses b
left join public.link_fin_real_movements_v m on m.business_id=b.id
group by b.id,b.global_id,b.slug,b.name;

revoke all on public.link_fin_real_summary_v from anon;
grant select on public.link_fin_real_summary_v to authenticated;

comment on table public.link_financial_real_relationships is
'FIN transversal: only evidence-backed financial roles. Proposed or assumed relationships do not belong here.';
comment on view public.link_fin_real_movements_v is
'FIN evidence-only movements. A transaction appears only when linked to a document with a persistent evidence URL.';
comment on view public.link_fin_real_roles_v is
'FIN evidence-only role relationships: invoice issuer, collector, service provider, collaborators, transfer parties and tax authority.';
comment on view public.link_fin_real_summary_v is
'Per-business FIN evidence-only totals: gross income, taxes, outflows and real net.';
