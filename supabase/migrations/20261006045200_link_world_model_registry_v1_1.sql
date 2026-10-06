-- Fix aggregate duplication when one model has multiple business links.
create or replace view public.link_world_model_portfolio_v
with (security_invoker=true)
as
select
  m.id,m.model_key,m.name,m.pain_statement,m.solution_statement,m.model_kind,m.maturity_stage,m.economic_role,m.confidence,
  m.origin_business_id,ob.name as origin_business_name,m.source_project_id,p.name as source_project_name,
  m.estimated_monthly_revenue_clp,m.estimated_monthly_cost_clp,m.director_hours_monthly,m.next_gate,
  m.model_definition,m.metrics,m.status,m.metadata,m.created_at,m.updated_at,
  count(distinct e.id)::int as evidence_count,
  count(distinct e.id) filter (where e.verified)::int as verified_evidence_count,
  count(distinct bl.business_id)::int as linked_business_count,
  least(100,
    case m.maturity_stage
      when 'hobby' then 10 when 'candidate' then 25 when 'evidenced' then 45 when 'repeatable' then 60
      when 'productizable' then 75 when 'business_candidate' then 90 when 'business' then 95 when 'replicable' then 100 else 0 end
    + least(10,(count(distinct e.id) filter (where e.verified))::int*2)
    + case when coalesce(m.estimated_monthly_revenue_clp,0)>0 then 5 else 0 end
  )::int as readiness_score,
  case m.maturity_stage
    when 'hobby' then 'validar_dolor' when 'candidate' then 'conseguir_evidencia'
    when 'evidenced' then 'repetir_fuera_del_origen' when 'repeatable' then 'validar_economia'
    when 'productizable' then 'empaquetar_y_vender' when 'business_candidate' then 'decision_director_nacer_negocio'
    when 'business' then 'sistematizar_y_delegar' when 'replicable' then 'replicar' else 'revisar'
  end as next_move
from public.link_world_models m
left join public.link_world_businesses ob on ob.id=m.origin_business_id
left join public.projects p on p.id=m.source_project_id
left join public.link_world_model_evidence e on e.model_id=m.id
left join public.link_world_model_business_links bl on bl.model_id=m.id and bl.status='active'
group by m.id,ob.name,p.name;

grant select on public.link_world_model_portfolio_v to authenticated;
