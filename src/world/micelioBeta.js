import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './connection.js';
import {buildMicelioModel,layoutMicelio,reachable} from './micelioModel.js';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

const safe=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const labelize=value=>String(value||'—').replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
const compact=value=>new Intl.NumberFormat('es-CL',{notation:'compact',maximumFractionDigits:1}).format(Number(value)||0);
const formatDate=value=>{
  if(!value)return 'Sin fecha registrada';
  try{return new Intl.DateTimeFormat('es-CL',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}
  catch{return String(value);}
};

const viewNames={organism:'Organismo',businesses:'Negocios',records:'Fichas',operations:'Operación',proposals:'Propuestas'};
const typeNames={control:'Control',business:'Negocio',client:'Cliente',product:'Producto'};
const stateNames={active:'Activo',proposed:'Propuesta',attention:'Atención',unknown:'Sin verificar'};
const originNames={entity_relations:'Relación canónica',link_world_relations:'Propuesta de negocio',foreign_key:'Estructura de ficha'};

function readProgress(){
  try{return new Set(JSON.parse(sessionStorage.getItem('linkworld:micelio:read-routes')||'[]'));}
  catch{return new Set();}
}
function writeProgress(value){
  try{sessionStorage.setItem('linkworld:micelio:read-routes',JSON.stringify([...value]));}catch{}
}
function initialTheme(){
  try{return sessionStorage.getItem('linkworld:micelio:theme')||'light';}catch{return 'light';}
}

async function memberStatus(){
  const {data:{session}}=await db.auth.getSession();
  if(!session)return false;
  const {data,error}=await db.rpc('link_world_is_member');
  return !error&&data===true;
}

async function readSource(key,builder){
  try{
    const {data,error}=await builder;
    if(error)return {key,rows:[],error:error.message||String(error)};
    return {key,rows:Array.isArray(data)?data:[],error:null};
  }catch(error){
    return {key,rows:[],error:error?.message||String(error)};
  }
}

function publicReads(){
  return [
    readSource('businesses',db.from('link_world_businesses')
      .select('id,global_id,slug,name,sector,city,country,summary,verification_status,public_workspace,owned_facts,evidence,updated_at')
      .order('name',{ascending:true})),
    readSource('clients',db.from('link_world_clients')
      .select('id,global_id,business_id,slug,name,role,relationship_state,agreement_status,city,country,summary,evidence,updated_at')
      .order('name',{ascending:true})),
    readSource('products',db.from('link_world_products')
      .select('id,global_id,business_id,client_id,name,category,stage,economic_state,responsibility_notes,agreement_notes,evidence,updated_at')
      .order('name',{ascending:true}))
  ];
}

function memberReads(){
  return [
    readSource('entities',db.from('ecosystem_entities')
      .select('id,global_id,entity_type,owner_domain,owner_table,owner_record_id,status,updated_at')),
    readSource('cells',db.from('ecosystem_cells')
      .select('entity_id,lifecycle_stage,health_status,autonomy_level,archetype_key,updated_at')),
    readSource('bindings',db.from('ecosystem_cell_organelle_bindings')
      .select('id,cell_entity_id,organelle_key,provider_domain,resource_kind,resource_name,truth_role,status,updated_at')),
    readSource('organelleTypes',db.from('ecosystem_organelle_types')
      .select('organelle_key,system_name,purpose,required_for_cell,sort_order')),
    readSource('entityRelations',db.from('entity_relations')
      .select('id,source_global_id,target_global_id,relation,label,state,evidence,metadata,created_at')),
    readSource('businessRelations',db.from('link_world_relations')
      .select('id,source_business_id,target_business_id,relation_type,state,rationale,evidence,created_at')),
    readSource('activity',db.from('link_world_activity')
      .select('id,action,target_type,target_id,note,created_at').order('created_at',{ascending:false}).limit(120)),
    readSource('events',db.from('event_bus')
      .select('id,event_type,entity_type,global_id,gesture_code,occurred_at,received_at').order('occurred_at',{ascending:false}).limit(120)),
    readSource('integrations',db.from('integration_bindings')
      .select('id,global_id,provider,entity_type,external_object,sync_status,last_synced_at')),
    readSource('conversions',db.from('link_conversion_assessments')
      .select('id,business_id,title,source_status,conversion_level,conversion_label,priority_score,conversion_reason,recommended_action,assessed_at,active').eq('active',true)),
    readSource('daily',db.from('link_daily_intelligence_reports')
      .select('id,report_date,report_type,metrics,priorities,blockers,recommendations,generated_at').order('report_date',{ascending:false}).limit(5)),
    readSource('transactions',db.from('link_world_transactions')
      .select('id,business_id,business_global_id,counterparty_global_id,product_global_id,transaction_type,status,occurred_at,created_at').order('occurred_at',{ascending:false}).limit(120)),
    readSource('documents',db.from('link_world_documents')
      .select('id,business_id,business_global_id,counterparty_id,product_id,document_type,issue_date,created_at').order('issue_date',{ascending:false}).limit(120)),
    readSource('houses',db.from('ecosystem_operational_house_status_v')
      .select('business_id,global_id,structure_status,transport_status,projection_status,overall_status,coverage_mode,event_counts,processed_event_count,last_event_at,last_engine_run_at,interpretation_note'))
  ];
}

function viewScope(model,view){
  const all=new Set(model.nodes.map(node=>node.id));
  if(view==='organism')return {nodes:all,edges:new Set(model.edges.map(edge=>edge.id))};
  if(view==='businesses'){
    const nodes=new Set(model.nodes.filter(node=>node.type==='control'||node.type==='business').map(node=>node.id));
    return {nodes,edges:new Set(model.edges.filter(edge=>nodes.has(edge.source)&&nodes.has(edge.target)).map(edge=>edge.id))};
  }
  if(view==='records'){
    const nodes=new Set(model.nodes.filter(node=>node.type!=='control').map(node=>node.id));
    return {nodes,edges:new Set(model.edges.filter(edge=>nodes.has(edge.source)&&nodes.has(edge.target)).map(edge=>edge.id))};
  }
  if(view==='operations'){
    const signalNodes=new Set(model.nodes.filter(node=>node.signal?.total||node.bindings?.length).map(node=>node.id));
    for(const edge of model.edges)if(signalNodes.has(edge.source)||signalNodes.has(edge.target)){signalNodes.add(edge.source);signalNodes.add(edge.target);}
    return {nodes:signalNodes,edges:new Set(model.edges.filter(edge=>signalNodes.has(edge.source)&&signalNodes.has(edge.target)).map(edge=>edge.id))};
  }
  const proposalEdges=model.edges.filter(edge=>edge.state==='proposed');
  return {nodes:new Set(proposalEdges.flatMap(edge=>[edge.source,edge.target])),edges:new Set(proposalEdges.map(edge=>edge.id))};
}

function curve(edge,positions){
  const a=positions.get(edge.source),b=positions.get(edge.target);
  if(!a||!b)return '';
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.max(1,Math.hypot(dx,dy));
  const bend=Math.min(34,length*.09)*(edge.state==='proposed'?-1:1);
  const mx=(a.x+b.x)/2-dy/length*bend,my=(a.y+b.y)/2+dx/length*bend;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

function nodeMarkup(node,point,scope,reachState,selected){
  const inScope=scope.nodes.has(node.id),inReach=!reachState||reachState.nodes.has(node.id);
  const classes=['micelio-node',`is-${node.type}`,`status-${node.status}`];
  if(!inScope||!inReach)classes.push('is-dimmed');
  if(selected===node.id)classes.push('is-selected');
  const short=node.label.length>20?node.label.slice(0,18)+'…':node.label;
  const badge=node.signal?.total?`<text class="micelio-node-signal" x="${point.r*.7}" y="${-point.r*.68}">${compact(node.signal.total)}</text>`:'';
  return `<g class="${classes.join(' ')}" data-node-id="${safe(node.id)}" transform="translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})" role="button" tabindex="0" aria-label="${safe(typeNames[node.type])}: ${safe(node.label)}">
    <circle class="micelio-node-halo" r="${point.r+8}"></circle><circle class="micelio-node-core" r="${point.r}"></circle>
    <text class="micelio-node-initial" text-anchor="middle" y="5">${safe(node.type==='control'?'◎':node.label.trim().charAt(0).toUpperCase())}</text>
    <text class="micelio-node-label" text-anchor="middle" y="${point.r+22}">${safe(short)}</text>${badge}
  </g>`;
}

function graphMarkup(state){
  const model=state.model,positions=layoutMicelio(model,1100,760),scope=viewScope(model,state.view);
  const reachState=state.reach?.origin?reachable(model,state.reach.origin,state.reach.direction):null;
  const edgeHtml=model.edges.map(edge=>{
    const path=curve(edge,positions);if(!path)return '';
    const inScope=scope.edges.has(edge.id),inReach=!reachState||reachState.edges.has(edge.id);
    const classes=['micelio-edge',`status-${edge.state}`];
    if(!inScope||!inReach)classes.push('is-dimmed');
    if(state.selectedEdge===edge.id)classes.push('is-selected');
    if(state.readEdges.has(edge.id))classes.push('is-read');
    return `<g class="${classes.join(' ')}" data-edge-id="${safe(edge.id)}" role="button" tabindex="0" aria-label="Ruta ${safe(edge.label)}"><path class="micelio-edge-hit" d="${path}"></path><path class="micelio-edge-line" d="${path}" marker-end="url(#micelio-arrow)"></path></g>`;
  }).join('');
  const nodeHtml=model.nodes.map(node=>{
    const point=positions.get(node.id);return point?nodeMarkup(node,point,scope,reachState,state.selectedNode):'';
  }).join('');
  return `<svg class="micelio-svg" viewBox="0 0 1100 760" aria-label="Mapa circular de relaciones LINK WORLD">
    <defs><marker id="micelio-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>
    <g class="micelio-edges">${edgeHtml}</g><g class="micelio-nodes">${nodeHtml}</g>
  </svg>`;
}

function sourceMarkup(state){
  if(!state.member)return '<p class="micelio-source-note">Vista abierta: negocios y fichas públicas. Las señales operativas necesitan una sesión LINK.</p>';
  const t=state.model.totals;
  return `<div class="micelio-sources"><span><b>${t.events}</b> eventos</span><span><b>${t.activity}</b> cambios</span><span><b>${t.organelles}</b> orgánulos</span><span><b>${t.integrations}</b> integraciones</span><span><b>${t.documents}</b> documentos</span><span class="is-unavailable"><b>—</b> calendario*</span></div><small>*Calendario no se expone a esta interfaz por su política actual.</small>`;
}

function loginMarkup(state){
  if(state.member)return '<button class="micelio-text-button" data-action="sign-out" type="button">Cerrar sesión LINK</button>';
  return `<form class="micelio-login" data-login-form><label>Correo LINK<input name="email" type="email" autocomplete="username" required></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Abrir capa privada</button><small>Usa una cuenta existente. Este panel no crea usuarios.</small></form>`;
}

function inspectorMarkup(state){
  const model=state.model;
  if(state.selectedEdge){
    const edge=model.edges.find(item=>item.id===state.selectedEdge);
    if(edge){
      const source=model.nodes.find(node=>node.id===edge.source),target=model.nodes.find(node=>node.id===edge.target);
      return `<div class="micelio-passport">
        <span class="micelio-eyebrow">PASAPORTE DE RUTA</span><h2>${safe(source?.label||edge.source)} <i>→</i> ${safe(target?.label||edge.target)}</h2>
        <div class="micelio-passport-state status-${edge.state}"><span></span>${safe(stateNames[edge.state])}</div>
        <dl><div><dt>Relación</dt><dd>${safe(labelize(edge.label))}</dd></div><div><dt>Origen</dt><dd>${safe(originNames[edge.origin]||edge.origin)}</dd></div><div><dt>Estado fuente</dt><dd>${safe(labelize(edge.rawState))}</dd></div><div><dt>Evidencias</dt><dd>${edge.evidenceCount||'Sin adjuntos'}</dd></div></dl>
        <div class="micelio-why"><span>POR QUÉ EXISTE</span><p>${safe(edge.reason)}</p></div>
        ${edge.state==='proposed'?'<p class="micelio-caution">Esta ruta es una propuesta. No representa un acuerdo ni una operación activa.</p>':''}
      </div>`;
    }
  }
  if(state.selectedNode){
    const node=model.nodes.find(item=>item.id===state.selectedNode);
    if(node){
      const bindings=node.bindings||[];
      return `<div class="micelio-passport">
        <span class="micelio-eyebrow">PASAPORTE SEMÁNTICO</span><h2>${safe(node.label)}</h2><p class="micelio-subtitle">${safe(node.sublabel)}</p>
        <div class="micelio-passport-state status-${node.status}"><span></span>${safe(stateNames[node.status])}</div>
        <dl><div><dt>Tipo</dt><dd>${safe(typeNames[node.type])}</dd></div><div><dt>Estado fuente</dt><dd>${safe(labelize(node.stage))}</dd></div><div><dt>Identidad</dt><dd title="${safe(node.id)}">${safe(node.id)}</dd></div><div><dt>Actualización</dt><dd>${safe(formatDate(node.updatedAt))}</dd></div><div><dt>Señales leídas</dt><dd>${node.signal?.total||0}</dd></div><div><dt>Evidencias</dt><dd>${node.evidenceCount||'Sin adjuntos'}</dd></div></dl>
        ${node.summary?`<div class="micelio-why"><span>CONTEXTO</span><p>${safe(node.summary)}</p></div>`:''}
        ${bindings.length?`<div class="micelio-binding-list"><span>ORGÁNULOS CONECTADOS</span>${bindings.slice(0,8).map(item=>`<p><b>${safe(labelize(item.organelle_key))}</b><small>${safe(item.provider_domain||item.resource_name||item.status||'Registrado')}</small></p>`).join('')}</div>`:''}
        <div class="micelio-passport-actions"><button data-reach="upstream" type="button">Ver aguas arriba</button><button data-reach="downstream" type="button">Ver aguas abajo</button>${node.businessId?'<button class="is-primary" data-action="open-record" type="button">Abrir ficha LINK</button>':''}</div>
      </div>`;
    }
  }
  return `<div class="micelio-empty-inspector"><span>◌</span><h2>Elige un círculo o una ruta.</h2><p>Verás su identidad, el motivo de cada conexión y el estado exacto que existe en LINK.</p></div>`;
}

function shellMarkup(state){
  if(state.fatal)return `<div class="micelio-loading is-error"><strong>No pudimos abrir el Micelio.</strong><p>${safe(state.fatal)}</p><button data-action="refresh" type="button">Reintentar</button></div>`;
  if(!state.model)return `<div class="micelio-loading"><span></span><p>Componiendo el organismo desde LINK CONTROL CENTRAL…</p></div>`;
  const model=state.model,understood=model.edges.filter(edge=>state.readEdges.has(edge.id)).length,progress=model.edges.length?Math.round(understood/model.edges.length*100):0;
  return `<div class="micelio-shell">
    <header class="micelio-head"><div><span class="micelio-eyebrow">LINK WORLD / BETA OBSERVABLE</span><h1>Micelio</h1><p>Una lectura circular de cómo negocios, fichas y operación se sostienen entre sí.</p></div><div class="micelio-head-actions"><span class="micelio-sync-state"><i></i>${state.member?'Evento vivo + sincronización 90 s':'Vista abierta'}</span><button data-action="theme" type="button" aria-label="Cambiar tema">${state.theme==='dark'?'Día':'Noche'}</button><button data-action="refresh" type="button" ${state.loading?'disabled':''}>${state.loading?'Leyendo…':'Sincronizar'}</button></div></header>
    <div class="micelio-layout">
      <aside class="micelio-rail micelio-rail-left"><section><span class="micelio-eyebrow">VISTAS GUIADAS</span><nav class="micelio-views">${Object.entries(viewNames).map(([key,name])=>`<button class="${state.view===key?'active':''}" data-micelio-view="${key}" type="button"><span>${safe(name)}</span><small>${key==='proposals'?model.edges.filter(edge=>edge.state==='proposed').length:key==='operations'?model.nodes.filter(node=>node.signal?.total||node.bindings?.length).length:''}</small></button>`).join('')}</nav></section>
        <section><span class="micelio-eyebrow">PULSO DEL ORGANISMO</span><div class="micelio-metrics"><div><strong>${model.totals.businesses}</strong><span>negocios</span></div><div><strong>${model.totals.clients+model.totals.products}</strong><span>fichas</span></div><div><strong>${model.totals.relations}</strong><span>rutas</span></div><div><strong>${model.edges.filter(edge=>edge.state==='proposed').length}</strong><span>propuestas</span></div></div></section>
        <section><span class="micelio-eyebrow">RUTAS COMPRENDIDAS</span><div class="micelio-progress"><div><span style="width:${progress}%"></span></div><p><b>${understood}/${model.edges.length}</b> conexiones abiertas</p></div><small>Abre rutas para revelar por qué existen. El avance vive solo en esta sesión.</small></section>
        <section><span class="micelio-eyebrow">CAPAS LEÍDAS</span>${sourceMarkup(state)}</section>
        <section class="micelio-access"><span class="micelio-eyebrow">ACCESO</span>${loginMarkup(state)}${state.authError?`<p class="micelio-form-error">${safe(state.authError)}</p>`:''}</section>
      </aside>
      <main class="micelio-canvas"><div class="micelio-canvas-bar"><span>${safe(viewNames[state.view])}</span><small>${model.capturedAt?`Corte ${safe(formatDate(model.capturedAt))}`:''}</small>${state.reach?'<button data-action="clear-reach" type="button">Ver todo ×</button>':''}</div>${graphMarkup(state)}<div class="micelio-legend"><span><i class="active"></i>Activo</span><span><i class="proposed"></i>Propuesta</span><span><i class="attention"></i>Atención</span><span><i class="unknown"></i>Sin verificar</span></div></main>
      <aside class="micelio-rail micelio-rail-right">${inspectorMarkup(state)}</aside>
    </div>
    <footer class="micelio-foot"><span>La ruta expresa estructura registrada; no implica causalidad, venta ni acuerdo salvo que la ficha lo demuestre.</span><span>${state.warnings.length?`${state.warnings.length} capa(s) no disponibles`:'Fuentes consultadas sin errores'} · ${safe(formatDate(state.lastRefresh))}</span></footer>
  </div>`;
}

export function mountMicelioBeta(selector='#lw-micelio'){
  const root=document.querySelector(selector);
  if(!root)return {open(){},close(){},refresh(){}};
  const state={open:false,loading:false,member:false,model:null,fatal:null,warnings:[],view:'organism',selectedNode:null,selectedEdge:null,reach:null,readEdges:readProgress(),theme:initialTheme(),lastRefresh:null,authError:null};
  let channel=null,pollTimer=null,refreshTimer=null;

  const render=()=>{
    root.dataset.micelioTheme=state.theme;
    root.innerHTML=shellMarkup(state);
    bind();
  };
  const pulse=element=>{element?.classList.remove('is-pulsing');void element?.getBoundingClientRect();element?.classList.add('is-pulsing');};
  const selectNode=(id,element)=>{
    state.selectedNode=id;state.selectedEdge=null;state.reach=null;pulse(element);render();
  };
  const selectEdge=(id,element)=>{
    state.selectedEdge=id;state.selectedNode=null;state.reach=null;state.readEdges.add(id);writeProgress(state.readEdges);pulse(element);render();
  };
  const keyboardSelect=(event,handler)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();handler();}};
  const bind=()=>{
    root.querySelectorAll('[data-node-id]').forEach(element=>{
      const pick=()=>selectNode(element.dataset.nodeId,element);element.addEventListener('click',pick);element.addEventListener('keydown',event=>keyboardSelect(event,pick));
    });
    root.querySelectorAll('[data-edge-id]').forEach(element=>{
      const pick=()=>selectEdge(element.dataset.edgeId,element);element.addEventListener('click',pick);element.addEventListener('keydown',event=>keyboardSelect(event,pick));
    });
    root.querySelectorAll('[data-micelio-view]').forEach(button=>button.addEventListener('click',()=>{state.view=button.dataset.micelioView;state.reach=null;render();}));
    root.querySelector('[data-action="refresh"]')?.addEventListener('click',()=>refresh({manual:true}));
    root.querySelector('[data-action="theme"]')?.addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';try{sessionStorage.setItem('linkworld:micelio:theme',state.theme);}catch{}render();});
    root.querySelector('[data-action="clear-reach"]')?.addEventListener('click',()=>{state.reach=null;render();});
    root.querySelectorAll('[data-reach]').forEach(button=>button.addEventListener('click',()=>{state.reach={origin:state.selectedNode,direction:button.dataset.reach};render();}));
    root.querySelector('[data-action="open-record"]')?.addEventListener('click',()=>{
      const node=state.model?.nodes.find(item=>item.id===state.selectedNode);if(!node?.businessId)return;
      document.dispatchEvent(new CustomEvent('linkworld:open-business',{detail:{id:node.businessId}}));
    });
    root.querySelector('[data-login-form]')?.addEventListener('submit',async event=>{
      event.preventDefault();state.authError=null;
      const form=new FormData(event.currentTarget),email=String(form.get('email')||'').trim(),password=String(form.get('password')||'');
      const {error}=await db.auth.signInWithPassword({email,password});
      if(error){state.authError='No se pudo abrir la sesión: '+error.message;render();return;}
      await refresh({manual:true});
    });
    root.querySelector('[data-action="sign-out"]')?.addEventListener('click',async()=>{await db.auth.signOut();await refresh({manual:true});});
  };

  const syncRealtime=()=>{
    if(channel){db.removeChannel(channel);channel=null;}
    if(!state.open||!state.member)return;
    channel=db.channel('linkworld-micelio-event-bus')
      .on('postgres_changes',{event:'*',schema:'public',table:'event_bus'},()=>{
        clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refresh({quiet:true}),900);
      }).subscribe();
  };
  const syncPolling=()=>{
    clearInterval(pollTimer);pollTimer=null;
    if(state.open&&state.member)pollTimer=setInterval(()=>refresh({quiet:true}),90000);
  };
  async function refresh({quiet=false}={}){
    if(state.loading)return;
    state.loading=true;state.fatal=null;if(!quiet)render();
    const member=await memberStatus();
    const results=await Promise.all([...publicReads(),...(member?memberReads():[])]);
    const rows={},warnings=[];
    for(const result of results){rows[result.key]=result.rows;if(result.error)warnings.push(`${result.key}: ${result.error}`);}
    const coreFailure=results.find(result=>result.key==='businesses'&&result.error);
    if(coreFailure){state.fatal=coreFailure.error;state.loading=false;render();return;}
    state.member=member;state.warnings=warnings;
    state.model=buildMicelioModel(rows,{member,capturedAt:new Date().toISOString(),warnings});
    state.lastRefresh=new Date().toISOString();state.loading=false;
    if(state.selectedNode&&!state.model.nodes.some(node=>node.id===state.selectedNode))state.selectedNode=null;
    if(state.selectedEdge&&!state.model.edges.some(edge=>edge.id===state.selectedEdge))state.selectedEdge=null;
    syncRealtime();syncPolling();render();
  }
  const open=()=>{state.open=true;root.classList.remove('hidden');if(!state.model)refresh();else{syncRealtime();syncPolling();render();}};
  const close=()=>{state.open=false;clearInterval(pollTimer);pollTimer=null;if(channel){db.removeChannel(channel);channel=null;}};
  db.auth.onAuthStateChange(event=>{if(state.open&&(event==='SIGNED_IN'||event==='SIGNED_OUT'))setTimeout(()=>refresh({quiet:true}),0);});
  render();
  return {open,close,refresh};
}
