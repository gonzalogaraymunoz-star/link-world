import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './connection.js';
import './modelFoundry.css';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let root=null;
let selectedModelId=null;
let cache=[];
function getRoot(){if(!root)root=document.querySelector('#lw-models');return root;}

const maturityOrder=['hobby','candidate','evidenced','repeatable','productizable','business_candidate','business','replicable'];
const maturityLabel={
  hobby:'Hobby',candidate:'Modelo candidato',evidenced:'Evidenciado',repeatable:'Repetible',
  productizable:'Productizable',business_candidate:'Candidato a negocio',business:'Negocio',replicable:'Replicable'
};
const stageOrder=['marketing','ventas','cierre','onboarding','entrega','postventa'];
const stageLabel={marketing:'MAR',ventas:'Ventas',cierre:'Cierre',onboarding:'Boarding',entrega:'Opera',postventa:'Postventa'};
const stageStatus={not_started:'Sin iniciar',active:'Activo',blocked:'Bloqueado',ready:'Listo',validated:'Validado'};
const moveLabel={
  validar_dolor:'Validar dolor',conseguir_evidencia:'Conseguir evidencia',repetir_fuera_del_origen:'Repetir fuera del origen',
  validar_economia:'Validar economía',empaquetar_y_vender:'Empaquetar y vender',
  decision_director_nacer_negocio:'Decidir nacimiento',sistematizar_y_delegar:'Sistematizar y delegar',replicar:'Replicar',revisar:'Revisar'
};

function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));}
function money(v){
  const n=Number(v||0);if(!Number.isFinite(n)||n<=0)return '';
  return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n);
}
function confidence(v){return Math.round(Number(v||0)*100)+'%';}
function readinessClass(score){const n=Number(score||0);return n>=90?'ready':n>=70?'strong':n>=45?'building':'early';}
function promoterBusiness(model){
  const links=(model.links||[]).filter(x=>x.business?.id);
  return links.find(x=>['commercialized_by','origin','supports','validated_in','installed_in'].includes(x.role))?.business
    ||(model.origin_business_id?{id:model.origin_business_id,name:model.origin_business_name}:null);
}
function artifactHref(route){
  const value=String(route||'').trim();
  if(!value)return '';
  if(/^https?:\/\//i.test(value)||value.startsWith('/'))return value;
  return '';
}
function toast(message,kind='ok'){
  document.dispatchEvent(new CustomEvent('linkworld:toast',{detail:{message,kind}}));
}

async function load(){
  root=getRoot();if(!root)return;
  root.innerHTML='<div class="mf-loading">Leyendo modelos, etapas, artefactos, prospectos y evidencia…</div>';
  const {data:{session}}=await db.auth.getSession();
  if(!session){root.innerHTML='<div class="mf-empty">Modelos es un espacio privado de LINK. Entra con tu sesión para ver la cartera.</div>';return;}
  const member=await db.rpc('link_world_is_member');
  if(member.error||member.data!==true){root.innerHTML='<div class="mf-empty">Tu sesión no tiene acceso al registro de modelos.</div>';return;}

  const [portfolioRead,evidenceRead,linksRead,stagesRead,artifactLinksRead,prospectsRead]=await Promise.all([
    db.from('link_world_model_portfolio_v')
      .select('id,model_key,name,pain_statement,solution_statement,model_kind,maturity_stage,economic_role,confidence,origin_business_id,origin_business_name,source_project_name,estimated_monthly_revenue_clp,estimated_monthly_cost_clp,director_hours_monthly,next_gate,status,evidence_count,verified_evidence_count,linked_business_count,readiness_score,next_move,metadata')
      .eq('status','active').order('readiness_score',{ascending:false}),
    db.from('link_world_model_evidence')
      .select('id,model_id,business_id,evidence_type,source_system,source_ref,result,amount_clp,verified,confidence,occurred_at')
      .order('created_at',{ascending:false}),
    db.from('link_world_model_business_links')
      .select('model_id,role,status,business:link_world_businesses(id,name,slug,sector)')
      .in('status',['active','proposed']),
    db.from('link_world_model_stage_state')
      .select('id,model_id,stage_key,stage_number,status,business_id,objective,strategy,next_action,evidence_required,metadata')
      .order('stage_number',{ascending:true}),
    db.from('link_world_model_stage_artifacts')
      .select('model_id,stage_key,role,status,artifact:link_dot_artifacts(id,artifact_key,name,artifact_type,route,business_id,source_system,status)')
      .in('status',['active','proposed']),
    db.from('link_world_model_prospects')
      .select('id,model_id,stage_key,status,strategy,evidence_state,prospect:link_world_prospect_vault(id,business_name,sector,status,verification_status,reference_code,business_summary)')
      .neq('status','archived')
  ]);
  const error=[portfolioRead,evidenceRead,linksRead,stagesRead,artifactLinksRead,prospectsRead].find(x=>x.error)?.error;
  if(error){root.innerHTML='<div class="mf-error">No se pudo abrir Modelos: '+esc(error.message)+'</div>';return;}

  const group=(rows,key)=>{
    const map=new Map();
    for(const row of rows||[]){const id=row[key];if(!map.has(id))map.set(id,[]);map.get(id).push(row);}
    return map;
  };
  const evidenceBy=group(evidenceRead.data,'model_id');
  const linksBy=group(linksRead.data,'model_id');
  const stagesBy=group(stagesRead.data,'model_id');
  const artifactsBy=group(artifactLinksRead.data,'model_id');
  const prospectsBy=group(prospectsRead.data,'model_id');

  cache=(portfolioRead.data||[]).map(m=>({
    ...m,
    evidence:evidenceBy.get(m.id)||[],
    links:linksBy.get(m.id)||[],
    stages:stagesBy.get(m.id)||[],
    artifactLinks:artifactsBy.get(m.id)||[],
    prospects:prospectsBy.get(m.id)||[]
  }));
  if(selectedModelId&&!cache.some(m=>m.id===selectedModelId))selectedModelId=null;
  render();
}

function render(){
  const models=cache;
  const withVerified=models.filter(m=>Number(m.verified_evidence_count||0)>0).length;
  const businessCandidates=models.filter(m=>m.maturity_stage==='business_candidate'||m.economic_role==='business_candidate').length;
  const economic=models.filter(m=>['business','replicable'].includes(m.maturity_stage)).length;
  const moneyCandidates=models
    .filter(m=>['product','business_candidate'].includes(m.economic_role)&&!['business','replicable'].includes(m.maturity_stage))
    .sort((a,b)=>Number(b.readiness_score||0)-Number(a.readiness_score||0)).slice(0,4);
  const selected=models.find(m=>m.id===selectedModelId)||null;

  root.innerHTML=`
    <div class="mf-head">
      <div>
        <span class="mf-kicker">CONCHA ETERNA · MODELOS</span>
        <h1>Dolor → modelo → negocio.</h1>
        <p>LINK WORLD no piensa por nosotros. Ordena la realidad: modelo, negocio, seis áreas, artefactos y evidencia. El razonamiento sale a ChatGPT mediante Modo Dios.</p>
      </div>
      <div class="mf-head-actions">
        <span class="mf-god-mode"><i></i>MODO DIOS · CHATGPT EXTERNO</span>
        <button id="mf-refresh" type="button">↻ Actualizar</button>
      </div>
    </div>
    <div class="mf-stats">
      <div><b>${models.length}</b><span>Modelos activos</span></div>
      <div><b>${withVerified}</b><span>Con evidencia verificada</span></div>
      <div><b>${businessCandidates}</b><span>Candidatos a negocio</span></div>
      <div><b>${economic}</b><span>Negocio / replicable</span></div>
    </div>
    <section class="mf-money">
      <div class="mf-section-title"><span>PRÓXIMO DINERO</span><h2>Modelos a desarrollar ahora</h2><p>Cada modelo abre su propia concha de seis etapas.</p></div>
      <div class="mf-money-grid">${moneyCandidates.length?moneyCandidates.map(moneyCard).join(''):'<div class="mf-empty-inline">Todavía no hay candidatos comercializables.</div>'}</div>
    </section>
    ${selected?modelWorkspace(selected):''}
    <section class="mf-board-wrap">
      <div class="mf-section-title"><span>CICLO DE MADUREZ</span><h2>La concha completa</h2></div>
      <div class="mf-board">${maturityOrder.map(stage=>lane(stage,models.filter(m=>m.maturity_stage===stage))).join('')}</div>
    </section>
  `;

  root.querySelector('#mf-refresh')?.addEventListener('click',load);
  root.querySelectorAll('[data-model-open]').forEach(btn=>btn.addEventListener('click',()=>{
    selectedModelId=btn.dataset.modelOpen;render();root.querySelector('#mf-workspace')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  root.querySelector('[data-close-workspace]')?.addEventListener('click',()=>{selectedModelId=null;render();});
  root.querySelectorAll('[data-open-business]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.openBusiness;if(id)document.dispatchEvent(new CustomEvent('linkworld:open-business',{detail:{id}}));
  }));
  root.querySelectorAll('[data-open-artifact]').forEach(btn=>btn.addEventListener('click',()=>{
    const route=btn.dataset.openArtifact;if(route)window.open(route,'_blank','noopener,noreferrer');
  }));
  root.querySelectorAll('[data-find-prospect]').forEach(btn=>btn.addEventListener('click',()=>{
    const model=models.find(m=>m.id===btn.dataset.findProspect);if(!model)return;
    document.dispatchEvent(new CustomEvent('linkworld:model-territory',{detail:{
      modelId:model.id,modelKey:model.model_key,modelName:model.name,modelKind:model.model_kind,
      pain:model.pain_statement,solution:model.solution_statement,stageKey:'marketing'
    }}));
  }));
  root.querySelectorAll('[data-godmode]').forEach(btn=>btn.addEventListener('click',()=>{
    const model=models.find(m=>m.id===btn.dataset.godmode);if(!model)return;
    const stageKey=btn.dataset.stageKey||null;
    queueGodMode(model,stageKey);
  }));
  root.querySelectorAll('[data-open-vault]').forEach(btn=>btn.addEventListener('click',()=>{
    document.dispatchEvent(new CustomEvent('linkworld:set-view',{detail:{view:'vault'}}));
  }));
}

function moneyCard(m){
  return `<article class="mf-money-card">
    <div class="mf-money-top"><span class="mf-stage">${esc(maturityLabel[m.maturity_stage]||m.maturity_stage)}</span><b>${Number(m.readiness_score||0)}</b></div>
    <h3>${esc(m.name)}</h3>
    <p>${esc(m.pain_statement)}</p>
    <div class="mf-money-meta">
      <span>${Number(m.verified_evidence_count||0)} evidencias verificadas</span>
      ${m.estimated_monthly_revenue_clp?'<strong>'+esc(money(m.estimated_monthly_revenue_clp))+' ref./mes</strong>':''}
    </div>
    <button type="button" data-model-open="${m.id}">Desarrollar modelo →</button>
  </article>`;
}

function lane(stage,rows){
  return `<div class="mf-lane stage-${stage}">
    <div class="mf-lane-head"><span>${esc(maturityLabel[stage])}</span><b>${rows.length}</b></div>
    <div class="mf-lane-list">${rows.length?rows.map(modelCard).join(''):'<div class="mf-lane-empty">Sin modelos</div>'}</div>
  </div>`;
}

function modelCard(m){
  const verified=(m.evidence||[]).filter(x=>x.verified);
  return `<article class="mf-card readiness-${readinessClass(m.readiness_score)}">
    <button class="mf-card-main" type="button" data-model-open="${m.id}">
      <span class="mf-kind">${esc(String(m.model_kind||'modelo').replaceAll('_',' '))}</span>
      <h3>${esc(m.name)}</h3>
      <p>${esc(m.pain_statement)}</p>
      <div class="mf-card-kpis">
        <span><b>${Number(m.readiness_score||0)}</b> readiness</span>
        <span><b>${verified.length}</b> evid.</span>
        <span><b>${confidence(m.confidence)}</b> conf.</span>
      </div>
    </button>
  </article>`;
}

function modelWorkspace(m){
  const business=promoterBusiness(m);
  const artifacts=(m.artifactLinks||[]).filter(x=>x.artifact);
  const prospects=m.prospects||[];
  const verified=(m.evidence||[]).filter(x=>x.verified);
  return `<section class="mf-workspace" id="mf-workspace">
    <div class="mf-workspace-head">
      <div>
        <span class="mf-kicker">MODELO EN DESARROLLO</span>
        <h2>${esc(m.name)}</h2>
        <p>${esc(m.pain_statement)}</p>
      </div>
      <button class="mf-close" type="button" data-close-workspace>×</button>
    </div>

    <div class="mf-shell-summary">
      <div><span>NEGOCIO PROMOTOR</span><strong>${esc(business?.name||'Sin negocio promotor')}</strong>
        ${business?.id?'<button type="button" data-open-business="'+business.id+'">Abrir negocio →</button>':'<small>Este modelo todavía necesita un negocio que lo empuje.</small>'}
      </div>
      <div><span>ARTEFACTOS CONECTADOS</span><strong>${artifacts.length}</strong><small>Lo que permite ejecutar el modelo.</small></div>
      <div><span>PROSPECTOS DE VALIDACIÓN</span><strong>${prospects.length}</strong><button type="button" data-open-vault>Ver Vault →</button></div>
      <div><span>EVIDENCIA VERIFICADA</span><strong>${verified.length}</strong><small>${esc(m.next_gate||moveLabel[m.next_move]||'Siguiente gate por definir')}</small></div>
    </div>

    <div class="mf-six-title"><span>LA CONCHA DEL MODELO</span><h3>MAR → Ventas → Cierre → Boarding → Opera → Postventa</h3></div>
    <div class="mf-six-stages">
      ${stageOrder.map(key=>stageCard(m,key,business)).join('')}
    </div>

    <div class="mf-workspace-foot">
      <button type="button" class="mf-find" data-find-prospect="${m.id}">⌖ Buscar negocio real para validar</button>
      <button type="button" class="mf-god" data-godmode="${m.id}">Preparar trabajo para ChatGPT →</button>
    </div>
  </section>`;
}

function stageCard(m,key,business){
  const stage=(m.stages||[]).find(x=>x.stage_key===key)||{
    stage_key:key,stage_number:stageOrder.indexOf(key)+1,status:'not_started',
    objective:'Etapa aún no configurada.',strategy:'',next_action:'',evidence_required:''
  };
  const artifacts=(m.artifactLinks||[]).filter(x=>x.stage_key===key&&x.artifact);
  const stageProspects=(m.prospects||[]).filter(x=>x.stage_key===key);
  const businessId=stage.business_id||business?.id||'';
  return `<article class="mf-stage-card status-${esc(stage.status)}">
    <div class="mf-stage-card-head"><b>${stage.stage_number}</b><div><span>${esc(stageLabel[key])}</span><small>${esc(stageStatus[stage.status]||stage.status)}</small></div></div>
    <p class="mf-stage-objective">${esc(stage.objective)}</p>
    <div class="mf-stage-block"><span>ESTRATEGIA</span><p>${esc(stage.strategy||'Por desarrollar.')}</p></div>
    <div class="mf-stage-block"><span>SIGUIENTE ACCIÓN</span><p>${esc(stage.next_action||'Definir siguiente acción verificable.')}</p></div>
    <div class="mf-stage-block"><span>EVIDENCIA NECESARIA</span><p>${esc(stage.evidence_required||'Resultado verificable.')}</p></div>
    ${stageProspects.length?'<div class="mf-stage-prospects"><span>PROSPECTOS</span>'+stageProspects.slice(0,3).map(p=>'<small>'+esc(p.prospect?.business_name||'Prospecto')+' · '+esc(p.status)+'</small>').join('')+'</div>':''}
    <div class="mf-stage-artifacts">
      <span>ARTEFACTOS</span>
      ${artifacts.length?artifacts.map(link=>{
        const a=link.artifact;const href=artifactHref(a.route);
        return '<div><b>'+esc(a.name)+'</b>'+(href?'<button type="button" data-open-artifact="'+esc(href)+'">Abrir ↗</button>':'<small>Ruta pendiente</small>')+'</div>';
      }).join(''):'<div class="mf-no-artifact"><small>Falta artefacto responsable.</small></div>'}
    </div>
    <div class="mf-stage-actions">
      ${businessId?'<button type="button" data-open-business="'+esc(businessId)+'">Negocio</button>':''}
      ${key==='marketing'?'<button type="button" data-find-prospect="'+m.id+'">Buscar negocio</button>':''}
      <button type="button" data-godmode="${m.id}" data-stage-key="${key}">ChatGPT</button>
    </div>
  </article>`;
}

function buildPrompt(m,stageKey=null){
  const business=promoterBusiness(m);
  const stage=stageKey?(m.stages||[]).find(x=>x.stage_key===stageKey):null;
  const artifacts=(m.artifactLinks||[]).filter(x=>!stageKey||x.stage_key===stageKey).map(x=>x.artifact?.name).filter(Boolean);
  const prospects=(m.prospects||[]).map(x=>x.prospect?.business_name).filter(Boolean);
  return [
    'Trabajemos este pendiente real de LINK WORLD en Modo Dios.',
    '',
    'MODELO: '+m.name,
    'MODEL KEY: '+m.model_key,
    'MADUREZ: '+m.maturity_stage,
    'READINESS: '+m.readiness_score+'/100',
    'DOLOR: '+m.pain_statement,
    'SOLUCIÓN: '+m.solution_statement,
    'NEGOCIO PROMOTOR: '+(business?.name||'sin negocio promotor'),
    'ARTEFACTOS DISPONIBLES: '+(artifacts.join(' · ')||'ninguno conectado'),
    'PROSPECTOS ASOCIADOS: '+(prospects.join(' · ')||'ninguno'),
    stage?('ETAPA: '+stageLabel[stage.stage_key]+'\nOBJETIVO: '+stage.objective+'\nESTRATEGIA ACTUAL: '+(stage.strategy||'sin desarrollar')+'\nSIGUIENTE ACCIÓN: '+(stage.next_action||'por definir')+'\nEVIDENCIA NECESARIA: '+(stage.evidence_required||'por definir')):'ETAPA: revisar la concha completa MAR → Ventas → Cierre → Boarding → Opera → Postventa.',
    '',
    'MISIÓN: desarrolla esta etapa usando la información viva de LINK. Prioriza una acción que produzca evidencia real, ingreso o autonomía. Revisa primero el negocio y sus artefactos antes de proponer crear algo nuevo. Si hace falta buscar prospectos, usa Territorio/Vault. Deja cualquier cambio persistente en Supabase/GitHub/Vercel y verifica el resultado.'
  ].join('\n');
}

function queueGodMode(m,stageKey=null){
  const business=promoterBusiness(m);
  const prompt=buildPrompt(m,stageKey);
  document.dispatchEvent(new CustomEvent('linkworld:godmode-prompt',{detail:{
    sourceType:stageKey?'model_stage':'model',
    sourceId:m.id,
    modelId:m.id,
    businessId:business?.id||null,
    stageKey,
    title:(stageKey?stageLabel[stageKey]+' · ':'')+m.name,
    prompt,
    context:{model_key:m.model_key,maturity_stage:m.maturity_stage,readiness_score:m.readiness_score,next_gate:m.next_gate}
  }}));
  toast('Preparando paquete para ChatGPT…');
}

export function mountModelFoundry(){
  return {open:load,close:()=>{}};
}
