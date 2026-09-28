-- Register the verified sales cycle in Corteza and the active LINK WORLD capability catalog.

do $$
declare
  v_skill_id uuid;
  v_doc_id uuid;
  v_content text := '# LINK Sales Learning Cycle v1

## Ciclo
lead → cotización versionada → seguimiento → pago o pérdida → observación en Corteza.

## Ejecución
El ejecutor sales_execute_action_v1 usa command_bus y acciones registradas commerce.*.
Las cotizaciones genéricas requieren aprobación. Taxi Hotel puede cotizar automáticamente desde su calculadora propietaria.
Una venta ganada requiere evidencia operacional verificable o aprobación humana.

## Datos
- sales_leads: estado comercial actual.
- sales_quotes: versiones inmutables de oferta.
- sales_events: historial de acciones.
- sales_cycle_outcomes: desenlace y referencia de evidencia.
- sales_cycle_queue_v: cola operativa.
- sales_cycle_dashboard_v: métricas por negocio.
- sales_learning_signals_v: señales candidatas para validación.

## Aprendizaje
Cada desenlace genera una observación individual en link_learnings. Ninguna observación se convierte sola en regla confirmada.';
begin
  select id into v_skill_id from public.link_skills where slug='link-world' and status='active' limit 1;
  if v_skill_id is null then raise exception 'active LINK WORLD skill not found'; end if;

  insert into public.link_skill_capabilities(skill_id,capability_key,label,description,weight,metadata)
  values
  (v_skill_id,'sales_cycle_orchestration','Orquestación del ciclo comercial',
   'Captura lead, emite oferta versionada, programa seguimiento y cierra con evidencia mediante command_bus y RPC transaccional.',1,
   '{"version":"1.0.0","executor":"sales_execute_action_v1","verified":true}'::jsonb),
  (v_skill_id,'verified_sales_outcome','Cierre comercial verificable',
   'Distingue venta ganada, pérdida y cancelación; una venta ganada exige pago operacional verificable o aprobación humana.',1,
   '{"version":"1.0.0","owner_table":"sales_cycle_outcomes","verified":true}'::jsonb),
  (v_skill_id,'sales_learning_observation','Aprendizaje desde resultados comerciales',
   'Cada cierre crea una observación en Corteza; los grupos de evidencia permanecen como candidatos hasta validación.',1,
   '{"version":"1.0.0","source_kind":"sales_cycle_outcome","verified":true}'::jsonb),
  (v_skill_id,'taxi_hotel_sales_bridge','Puente comercial Taxi Hotel',
   'Convierte reserva, cotización y estado de pago de Taxi Hotel en un ciclo comercial trazable sin duplicar la operación.',1,
   '{"version":"1.0.0","operational_owner":"taxi_hotel","verified":true}'::jsonb)
  on conflict(skill_id,capability_key) do update set
    label=excluded.label,description=excluded.description,weight=excluded.weight,metadata=excluded.metadata;

  update public.link_cortex_documents
  set title='LINK Sales Learning Cycle v1',content=v_content,
      metadata=jsonb_build_object(
        'version','1.0.0','status','implemented_and_transaction_tested',
        'migrations',jsonb_build_array('sales_learning_cycle_v1','sales_learning_cycle_v1_1'),
        'actions',jsonb_build_array('commerce.lead.capture','commerce.quote.issue','commerce.followup.schedule','commerce.cycle.close'),
        'pilot','taxi-hotel','tested_at',now(),'test_policy','rollback_no_fake_sales'
      ),updated_at=now()
  where entity_type='system_capability' and entity_key='sales-learning-cycle-v1'
  returning id into v_doc_id;

  if v_doc_id is null then
    insert into public.link_cortex_documents(entity_type,entity_key,title,content,metadata)
    values(
      'system_capability','sales-learning-cycle-v1','LINK Sales Learning Cycle v1',v_content,
      jsonb_build_object(
        'version','1.0.0','status','implemented_and_transaction_tested',
        'migrations',jsonb_build_array('sales_learning_cycle_v1','sales_learning_cycle_v1_1'),
        'actions',jsonb_build_array('commerce.lead.capture','commerce.quote.issue','commerce.followup.schedule','commerce.cycle.close'),
        'pilot','taxi-hotel','tested_at',now(),'test_policy','rollback_no_fake_sales'
      )
    );
  end if;
end $$;

