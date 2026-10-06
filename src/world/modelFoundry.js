import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './connection.js';
import './modelFoundry.css';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let root=null;
function getRoot(){if(!root)root=document.querySelector('#lw-models');return root;}

const stageOrder=['hobby','candidate','evidenced','repeatable','productizable','business_candidate','business','replicable'];
const stageLabel={
  hobby:'Hobby',
  candidate:'Modelo candidato',
  evidenced:'Evidenciado',
  repeatable:'Repetible',
  productizable:'Productizable',
  business_candidate:'Candidato a negocio',
  business:'Negocio',
  replicable:'Replicable'
};
const moveLabel={
  validar_dolor:'Validar dolor',
  conseguir_evidencia:'Conseguir evidencia',
  repetir_fuera_del_origen:'Repetir fuera del origen',
  validar_economia:'Validar economía',
  empaquetar_y_vender:'Empaquetar y vender',
  decision_director_nacer_negocio:'Decisión: nacer negocio',
  sistematizar_y_delegar:'Sistematizar y delegar',
  replicar:'Replicar',
  revisar:'Revisar'
};

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v){
  const n=Number(v||0);
  if(!Number.isFinite(n)||n<=0)return '';
  return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
}
function confidence(v){return Math.round(Number(v||0)*100)+'%';}
function readinessClass(score){const n=Number(score||0);return n>=90?'ready':n>=70?'strong':n>=45?'building':'early';}

async function load(){
  root=getRoot();
  if(!root)return;
  root.innerHTML='<div class="mf-loading">Leyendo modelos, evidencia y negocios…</div>';
  const {data:{session}}=await db.auth.getSession();
  if(!session){root.innerHTML='<div class="mf-empty">Modelos es un espacio privado de LINK. Entra con tu sesión para ver la cartera.</div>';return;}
  const member=await db.rpc('link_world_is_member');
  if(member.error||member.data!==true){root.innerHTML='<div class="mf-empty">Tu sesión no tiene acceso al registro de modelos.</div>';return;}

  const [portfolioRead,evidenceRead,linksRead]=await Promise.all([
    db.from('link_world_model_portfolio_v')
      .select('id,model_key,name,pain_statement,solution_statement,model_kind,maturity_stage,economic_role,confidence,origin_business_name,source_project_name,estimated_monthly_revenue_clp,estimated_monthly_cost_clp,director_hours_monthly,next_gate,status,evidence_count,verified_evidence_count,linked_business_count,readiness_score,next_move,metadata')
      .eq('status','active')
      .order('readiness_score',{ascending:false}),
    db.from('link_world_model_evidence')
      .select('model_id,evidence_type,source_system,source_ref,result,amount_clp,verified,confidence,occurred_at')
      .order('created_at',{ascending:false}),
    db.from('link_world_model_business_links')
      .select('model_id,role,status,business:link_world_businesses(name,slug)')
      .in('status',['active','proposed'])
  ]);
  const error=portfolioRead.error||evidenceRead.error||linksRead.error;
  if(error){root.innerHTML='<div class="mf-error">No se pudo abrir Modelos: '+esc(error.message)+'</div>';return;}

  const evidenceBy=new Map();
  for(const item of evidenceRead.data||[]){
    if(!evidenceBy.has(item.model_id))evidenceBy.set(item.model_id,[]);
    evidenceBy.get(item.model_id).push(item);
  }
  const linksBy=new Map();
  for(const item of linksRead.data||[]){
    if(!linksBy.has(item.model_id))linksBy.set(item.model_id,[]);
    linksBy.get(item.model_id).push(item);
  }
  render((portfolioRead.data||[]).map(m=>({...m,evidence:evidenceBy.get(m.id)||[],links:linksBy.get(m.id)||[]})));
}

function render(models){
  const withVerified=models.filter(m=>Number(m.verified_evidence_count||0)>0).length;
  const businessCandidates=models.filter(m=>m.maturity_stage==='business_candidate'||m.economic_role==='business_candidate').length;
  const economic=models.filter(m=>['business','replicable'].includes(m.maturity_stage)).length;
  const moneyCandidates=models
    .filter(m=>['product','business_candidate'].includes(m.economic_role)&&!['business','replicable'].includes(m.maturity_stage))
    .sort((a,b)=>Number(b.readiness_score||0)-Number(a.readiness_score||0))
    .slice(0,4);

  root.innerHTML=`
    <div class="mf-head">
      <div><span class="mf-kicker">CONCHA ETERNA · MODELOS</span><h1>Dolor → modelo → dinero.</h1><p>La cartera muestra qué aprendimos, qué evidencia existe y qué falta para convertir una solución en producto o negocio.</p></div>
      <div class="mf-head-actions"><button id="mf-refresh" type="button">↻ Actualizar</button><button id="mf-director" class="primary" type="button">Trabajar con Director</button></div>
    </div>
    <div class="mf-stats">
      <div><b>${models.length}</b><span>Modelos activos</span></div>
      <div><b>${withVerified}</b><span>Con evidencia verificada</span></div>
      <div><b>${businessCandidates}</b><span>Candidatos a negocio</span></div>
      <div><b>${economic}</b><span>Negocio / replicable</span></div>
    </div>
    <section class="mf-money">
      <div class="mf-section-title"><span>PRÓXIMO DINERO</span><h2>Modelos a empujar ahora</h2><p>Orden heurístico por madurez y evidencia; no es una predicción financiera.</p></div>
      <div class="mf-money-grid">${moneyCandidates.length?moneyCandidates.map(moneyCard).join(''):'<div class="mf-empty-inline">Todavía no hay candidatos comercializables.</div>'}</div>
    </section>
    <section class="mf-board-wrap">
      <div class="mf-section-title"><span>CICLO DE MADUREZ</span><h2>La concha completa</h2></div>
      <div class="mf-board">${stageOrder.map(stage=>lane(stage,models.filter(m=>m.maturity_stage===stage))).join('')}</div>
    </section>
  `;

  root.querySelector('#mf-refresh')?.addEventListener('click',load);
  root.querySelector('#mf-director')?.addEventListener('click',()=>askDirector('Revisa la cartera completa de modelos de LINK WORLD. Prioriza qué modelo deberíamos empujar hoy para generar ingreso verificable con el menor aumento posible de horas del Director. Usa evidencia real y no inventes resultados.'));
  root.querySelectorAll('[data-model-director]').forEach(btn=>btn.addEventListener('click',()=>{
    const m=models.find(x=>x.id===btn.dataset.modelDirector);if(m)askModelDirector(m);
  }));
  root.querySelectorAll('[data-model-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
    const detail=root.querySelector('#mf-detail-'+btn.dataset.modelToggle);
    if(detail)detail.hidden=!detail.hidden;
  }));
}

function moneyCard(m){
  return `<article class="mf-money-card">
    <div class="mf-money-top"><span class="mf-stage">${esc(stageLabel[m.maturity_stage]||m.maturity_stage)}</span><b>${Number(m.readiness_score||0)}</b></div>
    <h3>${esc(m.name)}</h3>
    <p>${esc(m.pain_statement)}</p>
    <div class="mf-money-meta">
      <span>${Number(m.verified_evidence_count||0)} evidencias verificadas</span>
      ${m.estimated_monthly_revenue_clp?'<strong>'+esc(money(m.estimated_monthly_revenue_clp))+' ref./mes</strong>':''}
    </div>
    <button type="button" data-model-director="${m.id}">Mover este modelo →</button>
  </article>`;
}

function lane(stage,rows){
  return `<div class="mf-lane stage-${stage}">
    <div class="mf-lane-head"><span>${esc(stageLabel[stage])}</span><b>${rows.length}</b></div>
    <div class="mf-lane-list">${rows.length?rows.map(modelCard).join(''):'<div class="mf-lane-empty">Sin modelos</div>'}</div>
  </div>`;
}

function modelCard(m){
  const links=(m.links||[]).map(x=>x.business?.name).filter(Boolean);
  const verified=(m.evidence||[]).filter(x=>x.verified);
  return `<article class="mf-card readiness-${readinessClass(m.readiness_score)}">
    <button class="mf-card-main" type="button" data-model-toggle="${m.id}">
      <span class="mf-kind">${esc(m.model_kind.replaceAll('_',' '))}</span>
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.pain_statement)}</p>
      <div class="mf-card-kpis">
        <span><b>${Number(m.readiness_score||0)}</b> readiness</span>
        <span><b>${Number(m.verified_evidence_count||0)}</b> evid.</span>
        <span><b>${confidence(m.confidence)}</b> conf.</span>
      </div>
    </button>
    <div class="mf-detail" id="mf-detail-${m.id}" hidden>
      <dl>
        <div><dt>Solución</dt><dd>${esc(m.solution_statement)}</dd></div>
        <div><dt>Vive en</dt><dd>${esc(links.join(' · ')||m.origin_business_name||'Sin negocio todavía')}</dd></div>
        <div><dt>Próximo gate</dt><dd>${esc(m.next_gate||moveLabel[m.next_move]||'Revisar')}</dd></div>
        ${m.estimated_monthly_revenue_clp?'<div><dt>Referencia económica</dt><dd>'+esc(money(m.estimated_monthly_revenue_clp))+'/mes</dd></div>':''}
      </dl>
      <div class="mf-evidence">
        <span>EVIDENCIA</span>
        ${verified.length?verified.slice(0,3).map(e=>'<p><b>✓</b> '+esc(e.result)+'</p>').join(''):'<p><b>○</b> Aún no tiene evidencia verificada.</p>'}
      </div>
      <button class="mf-work" type="button" data-model-director="${m.id}">${esc(moveLabel[m.next_move]||'Trabajar modelo')} →</button>
    </div>
  </article>`;
}

function askDirector(prompt){
  document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt}}));
}
function askModelDirector(m){
  askDirector([
    'Trabajemos este modelo real de LINK WORLD:',
    'Modelo: '+m.name,
    'Madurez: '+m.maturity_stage,
    'Rol económico: '+m.economic_role,
    'Readiness: '+m.readiness_score+'/100',
    'Dolor: '+m.pain_statement,
    'Solución: '+m.solution_statement,
    'Evidencia verificada: '+m.verified_evidence_count,
    'Próximo gate: '+(m.next_gate||m.next_move),
    'Propón una sola acción concreta para moverlo al siguiente estado. Si el próximo estado implica crear un negocio, no lo crees sin aprobación explícita del Director.'
  ].join('\n'));
}

export function mountModelFoundry(){
  return {open:load,close:()=>{}};
}
