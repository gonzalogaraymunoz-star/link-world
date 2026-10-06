insert into public.link_fin_business_lifecycle_events
(business_id,stage_key,event_at,certification_status,source_system,source_ref,evidence_note,metadata)
select b.id,'link_entry',b.created_at,'verified','link_world_businesses',b.id::text,
'Ingreso certificado por la creación de la identidad canónica del negocio dentro de LINK WORLD.',
jsonb_build_object('business_slug',b.slug,'global_id',b.global_id)
from public.link_world_businesses b
where not exists (
  select 1 from public.link_fin_business_lifecycle_events e
  where e.business_id=b.id and e.stage_key='link_entry' and e.certification_status='verified'
);

with first_docs as (
  select distinct on (d.business_id)
    d.business_id,d.id,d.created_at,d.issue_date,d.document_type,d.tax_identifier
  from public.link_world_documents d
  where nullif(btrim(d.drive_url),'') is not null
  order by d.business_id,coalesce(d.issue_date,d.created_at::date),d.created_at
)
insert into public.link_fin_business_lifecycle_events
(business_id,stage_key,event_at,certification_status,source_system,source_ref,evidence_document_id,evidence_note,metadata)
select f.business_id,'first_economic_evidence',coalesce(f.issue_date::timestamptz,f.created_at),'verified',
'link_world_documents',f.id::text,f.id,'Primer hecho económico documentado con evidencia persistente.',
jsonb_build_object('document_type',f.document_type,'tax_identifier',f.tax_identifier)
from first_docs f
where not exists (
  select 1 from public.link_fin_business_lifecycle_events e
  where e.business_id=f.business_id and e.stage_key='first_economic_evidence' and e.certification_status='verified'
);

with first_billing as (
  select distinct on (d.business_id)
    d.business_id,d.id,d.created_at,d.issue_date,d.document_type,d.tax_identifier
  from public.link_world_documents d
  where nullif(btrim(d.drive_url),'') is not null
    and lower(coalesce(d.document_type,'')) in (
      'boleta','factura','boleta_honorarios','boleta_honorarios_electronica',
      'invoice','receipt','billing_document'
    )
  order by d.business_id,coalesce(d.issue_date,d.created_at::date),d.created_at
)
insert into public.link_fin_business_lifecycle_events
(business_id,stage_key,event_at,certification_status,source_system,source_ref,evidence_document_id,evidence_note,metadata)
select f.business_id,'first_billing',coalesce(f.issue_date::timestamptz,f.created_at),'verified',
'link_world_documents',f.id::text,f.id,'Primera facturación certificada por documento persistente.',
jsonb_build_object('document_type',f.document_type,'tax_identifier',f.tax_identifier)
from first_billing f
where not exists (
  select 1 from public.link_fin_business_lifecycle_events e
  where e.business_id=f.business_id and e.stage_key='first_billing' and e.certification_status='verified'
);

with first_cash as (
  select distinct on (m.business_id)
    m.business_id,m.id,m.occurred_at,m.external_reference,m.evidence_document_id
  from public.link_fin_real_movements_v m
  where m.direction='income' and m.payment_verified
  order by m.business_id,m.occurred_at,m.id
)
insert into public.link_fin_business_lifecycle_events
(business_id,stage_key,event_at,certification_status,source_system,source_ref,evidence_document_id,evidence_transaction_id,evidence_note,metadata)
select f.business_id,'first_collection',f.occurred_at,'verified','link_fin_real_movements_v',f.id::text,
f.evidence_document_id,f.id,'Primer cobro certificado por estado de pago verificado.',
jsonb_build_object('external_reference',f.external_reference)
from first_cash f
where not exists (
  select 1 from public.link_fin_business_lifecycle_events e
  where e.business_id=f.business_id and e.stage_key='first_collection' and e.certification_status='verified'
);
