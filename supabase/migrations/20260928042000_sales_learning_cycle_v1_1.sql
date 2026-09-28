-- LINK Sales Learning Cycle v1.1
-- Fix Cortex daily report section replacement detected by the rollback acceptance test.

create or replace function private.sales_cycle_sync_daily_cortex_v1()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_content text;
begin
  if new.cortex_document_id is null then return new; end if;
  select split_part(content,E'\n\n## Ventas verificadas',1) into v_content
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

