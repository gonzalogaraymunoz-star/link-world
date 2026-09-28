do $$
declare v_oid oid; v_def text;
begin
  select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='link_prepare_mercado_pago_checkout_v1'
    and pg_get_function_identity_arguments(p.oid)='p_reservation_id uuid, p_environment text';
  if v_oid is null then raise exception 'reservation checkout function not found'; end if;
  v_def:=pg_get_functiondef(v_oid);
  v_def:=replace(v_def,
    'if not public.link_world_is_member() then raise exception ''LINK WORLD member session required''; end if;',
    'if not private.link_payment_service_authorized_v1() then raise exception ''service role required''; end if;');
  execute v_def;

  select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='link_prepare_mercado_pago_quote_checkout_v1'
    and pg_get_function_identity_arguments(p.oid)='p_sales_quote_id uuid, p_environment text';
  if v_oid is null then raise exception 'quote checkout function not found'; end if;
  v_def:=pg_get_functiondef(v_oid);
  v_def:=replace(v_def,
    'if not public.link_world_is_member() then raise exception ''LINK WORLD member session required''; end if;',
    'if not private.link_payment_service_authorized_v1() then raise exception ''service role required''; end if;');
  execute v_def;
end $$;

revoke all on function public.link_prepare_mercado_pago_checkout_v1(uuid,text) from public,anon,authenticated;
grant execute on function public.link_prepare_mercado_pago_checkout_v1(uuid,text) to service_role;
revoke all on function public.link_prepare_mercado_pago_quote_checkout_v1(uuid,text) from public,anon,authenticated;
grant execute on function public.link_prepare_mercado_pago_quote_checkout_v1(uuid,text) to service_role;