import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './connection.js';
import {buildMicelioModel,layoutMicelio,reachable,localNeighborhood} from './micelioModel.js';

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

const viewNames={organism:'Grafo global',evolution:'Evolución',local:'Grafo local',businesses:'Negocios',records:'Fichas',operations:'Operación',proposals:'Propuestas'};
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
      .select('id,business_id,business_global_id,counterparty_global_id,product_global_id,direction,transaction_type,status,amount,currency,payment_method,occurred_at,paid_at,settled_at,created_at').order('occurred_at',{ascending:false}).limit(240)),
    readSource('salesOutcomes',db.from('sales_cycle_outcomes')
      .select('id,business_id,outcome,amount,currency,verified,confirmed_at,learning_snapshot').eq('verified',true).order('confirmed_at',{ascending:false}).limit(240)),
    readSource('paymentIntents',db.from('link_payment_intents')
      .select('id,business_id,environment,provider,currency,net_amount,tax_amount,gross_amount,status,approved_at,created_at').order('created_at',{ascending:false}).limit(240)),
    readSource('settlements',db.from('link_payment_settlements')
      .select('id,payment_intent_id,gross_amount,provider_fee_amount,net_received_amount,currency,status,reconciled_at,created_at').order('created_at',{ascending:false}).limit(240)),
    readSource('documents',db.from('link_world_documents')
      .select('id,business_id,business_global_id,counterparty_id,product_id,document_type,issue_date,created_at').order('issue_date',{ascending:false}).limit(120)),
    readSource('houses',db.from('ecosystem_operational_house_status_v')
      .select('business_id,global_id,structure_status,transport_status,projection_status,overall_status,coverage_mode,event_counts,processed_event_count,last_event_at,last_engine_run_at,interpretation_note'))
  ];
}

const VIEWBOX={x:0,y:0,width:900,height:640};
const CAMERA_RATIO=VIEWBOX.width/VIEWBOX.height;
const typeOrder={control:0,business:1,client:2,product:3};

function viewScope(model,view,selectedNode=null,localDepth=1){
  const allNodes=new Set(model.nodes.map(node=>node.id));
  const allEdges=new Set(model.edges.map(edge=>edge.id));
  if(view==='local'){
    const local=localNeighborhood(model,selectedNode,localDepth);
    return local.nodes.size?local:{nodes:allNodes,edges:allEdges};
  }
  if(view==='evolution'){
    const nodes=new Set(model.nodes.filter(node=>node.type==='business'||node.type==='control').map(node=>node.id));
    return {nodes,edges:new Set(model.edges.filter(edge=>nodes.has(edge.source)&&nodes.has(edge.target)).map(edge=>edge.id))};
  }
  if(view==='records')return {nodes:new Set(model.nodes.filter(node=>node.type!=='control').map(node=>node.id)),edges:allEdges};
  if(view==='businesses'){
    const nodes=new Set(model.nodes.filter(node=>node.type==='business').map(node=>node.id));
    return {nodes,edges:new Set(model.edges.filter(edge=>nodes.has(edge.source)&&nodes.has(edge.target)).map(edge=>edge.id))};
  }
  if(view==='operations'){
    const nodes=new Set(model.nodes.filter(node=>node.signal?.total||node.bindings?.length).map(node=>node.id));
    for(const edge of model.edges){
      if(nodes.has(edge.source)||nodes.has(edge.target)){nodes.add(edge.source);nodes.add(edge.target);}
    }
    if(!nodes.size)model.nodes.filter(node=>node.type==='business').forEach(node=>nodes.add(node.id));
    return {nodes,edges:new Set(model.edges.filter(edge=>nodes.has(edge.source)&&nodes.has(edge.target)).map(edge=>edge.id))};
  }
  if(view==='proposals'){
    const edges=model.edges.filter(edge=>edge.state==='proposed');
    return {nodes:new Set(edges.flatMap(edge=>[edge.source,edge.target])),edges:new Set(edges.map(edge=>edge.id))};
  }
  return {nodes:allNodes,edges:allEdges};
}

function graphContext(state){
  const scope=viewScope(state.model,state.view,state.selectedNode||state.lastNode,state.localDepth);
  const nodes=state.model.nodes.filter(node=>scope.nodes.has(node.id));
  const nodeIds=new Set(nodes.map(node=>node.id));
  const edges=state.model.edges.filter(edge=>nodeIds.has(edge.source)&&nodeIds.has(edge.target)&&(scope.edges.has(edge.id)||state.view==='records'));
  const positions=layoutMicelio({nodes,edges},VIEWBOX.width,VIEWBOX.height);
  return {nodes,edges,positions,nodeIds};
}

function directedRoute(model,source,target){
  if(!source||!target||source===target)return null;
  const queue=[source],seen=new Set([source]),previous=new Map();
  while(queue.length){
    const current=queue.shift();
    for(const edge of model.edges){
      if(edge.source!==current||seen.has(edge.target))continue;
      seen.add(edge.target);previous.set(edge.target,{node:current,edge});
      if(edge.target===target){
        const nodes=[target],edges=[];let cursor=target;
        while(cursor!==source){
          const step=previous.get(cursor);if(!step)return null;
          edges.unshift(step.edge);cursor=step.node;nodes.unshift(cursor);
        }
        return {nodes,edges};
      }
      queue.push(edge.target);
    }
  }
  return null;
}

function cameraBase(){return {...VIEWBOX};}
function cameraScale(state){return VIEWBOX.width/state.camera.width;}
function clampCamera(camera){
  const width=Math.max(220,Math.min(VIEWBOX.width,camera.width));
  const height=width/CAMERA_RATIO;
  const x=Math.max(VIEWBOX.x,Math.min(VIEWBOX.width-width,camera.x));
  const y=Math.max(VIEWBOX.y,Math.min(VIEWBOX.height-height,camera.y));
  return {x,y,width,height};
}
function cameraForIds(context,ids){
  const points=ids.map(id=>context.positions.get(id)).filter(Boolean);
  if(!points.length)return cameraBase();
  const minX=Math.min(...points.map(p=>p.x-p.r))-72,maxX=Math.max(...points.map(p=>p.x+p.r))+72;
  const minY=Math.min(...points.map(p=>p.y-p.r))-72,maxY=Math.max(...points.map(p=>p.y+p.r))+72;
  let width=Math.max(300,maxX-minX),height=Math.max(220,maxY-minY);
  if(width/height<CAMERA_RATIO)width=height*CAMERA_RATIO;else height=width/CAMERA_RATIO;
  if(width>=VIEWBOX.width*.94)return cameraBase();
  return clampCamera({x:(minX+maxX-width)/2,y:(minY+maxY-height)/2,width,height});
}
function revealNodeCamera(state,id){
  const context=graphContext(state),neighbors=[id];
  context.edges.forEach(edge=>{if(edge.source===id)neighbors.push(edge.target);if(edge.target===id)neighbors.push(edge.source);});
  state.camera=cameraForIds(context,[...new Set(neighbors)]);
}
function zoomCamera(state,factor,anchor){
  const current=state.camera;
  const nextWidth=Math.max(220,Math.min(VIEWBOX.width,current.width/factor));
  const nextHeight=nextWidth/CAMERA_RATIO;
  const px=anchor?.x??(current.x+current.width/2),py=anchor?.y??(current.y+current.height/2);
  const rx=(px-current.x)/current.width,ry=(py-current.y)/current.height;
  state.camera=clampCamera({x:px-rx*nextWidth,y:py-ry*nextHeight,width:nextWidth,height:nextHeight});
}

function edgePath(edge,positions){
  const a=positions.get(edge.source),b=positions.get(edge.target);
  if(!a||!b)return '';
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.max(1,Math.hypot(dx,dy));
  const bend=Math.min(30,length*.08)*(edge.state==='proposed'?-1:1);
  const mx=(a.x+b.x)/2-dy/length*bend,my=(a.y+b.y)/2+dx/length*bend;
  return 'M '+a.x.toFixed(1)+' '+a.y.toFixed(1)+' Q '+mx.toFixed(1)+' '+my.toFixed(1)+' '+b.x.toFixed(1)+' '+b.y.toFixed(1);
}

function graphMarkup(state,context){
  const routeNodes=new Set(state.route.result?.nodes||[]),routeEdges=new Set((state.route.result?.edges||[]).map(edge=>edge.id));
  const reachNodes=state.reach?.nodes||null,reachEdges=state.reach?.edges||null;
  const lens=new Set(state.lens);
  const edges=context.edges.map(edge=>{
    const path=edgePath(edge,context.positions);if(!path)return '';
    const source=state.model.nodes.find(node=>node.id===edge.source),target=state.model.nodes.find(node=>node.id===edge.target);
    const lensMatch=!lens.size||lens.has(source?.type)||lens.has(target?.type);
    const routeMatch=!state.route.result||routeEdges.has(edge.id);
    const reachMatch=!reachEdges||reachEdges.has(edge.id);
    const classes=['micelio-edge','status-'+edge.state];
    if(!lensMatch||!routeMatch||!reachMatch)classes.push('is-dimmed');
    if(state.selectedEdge===edge.id)classes.push('is-selected');
    if(state.readEdges.has(edge.id))classes.push('is-read');
    if(routeEdges.has(edge.id))classes.push('is-route');
    const domId='micelio-edge-'+String(edge.id).replace(/[^a-zA-Z0-9_-]/g,'-');
    return '<g class="'+classes.join(' ')+'" data-edge-id="'+safe(edge.id)+'" data-edge-from="'+safe(edge.source)+'" data-edge-to="'+safe(edge.target)+'" role="button" tabindex="0" aria-label="Conexión '+safe(edge.label)+'"><path class="micelio-edge-hit" d="'+path+'"></path><path id="'+domId+'" class="micelio-edge-line" d="'+path+'" marker-end="url(#micelio-arrow)"></path><text class="micelio-edge-label"><textPath href="#'+domId+'" startOffset="50%" text-anchor="middle">'+safe(labelize(edge.label))+'</textPath></text></g>';
  }).join('');
  const nodes=context.nodes.map(node=>{
    const point=context.positions.get(node.id);if(!point)return '';
    const radius=point.r||24;
    const lensMatch=!lens.size||lens.has(node.type);
    const routeMatch=!state.route.result||routeNodes.has(node.id);
    const reachMatch=!reachNodes||reachNodes.has(node.id);
    const classes=['micelio-node','is-'+node.type,'status-'+node.status];
    if(!lensMatch||!routeMatch||!reachMatch)classes.push('is-dimmed');
    if(state.selectedNode===node.id)classes.push('is-selected');
    if(routeNodes.has(node.id))classes.push('is-route');
    const label=node.label.length>22?node.label.slice(0,20)+'…':node.label;
    const badge=node.signal?.total?'<text class="micelio-node-signal" x="'+(radius*.68)+'" y="'+(-radius*.68)+'">'+compact(node.signal.total)+'</text>':'';
    return '<g class="'+classes.join(' ')+'" data-node-id="'+safe(node.id)+'" data-node-kind="'+safe(node.type)+'" data-node-label="'+safe(node.label)+'" transform="translate('+point.x.toFixed(1)+' '+point.y.toFixed(1)+')" role="button" tabindex="0" aria-pressed="'+(state.selectedNode===node.id?'true':'false')+'" aria-label="'+safe(typeNames[node.type])+': '+safe(node.label)+'"><circle class="micelio-node-halo" r="'+(radius+9)+'"></circle><circle class="micelio-node-core" r="'+radius+'"></circle><text class="micelio-node-initial" text-anchor="middle" y="6">'+safe(node.type==='control'?'◎':node.label.trim().charAt(0).toUpperCase())+'</text><text class="micelio-node-label" text-anchor="middle" y="'+(radius+24)+'">'+safe(label)+'</text>'+badge+'</g>';
  }).join('');
  const empty=context.nodes.length?'':'<g class="micelio-graph-empty"><text x="450" y="300" text-anchor="middle">No hay registros disponibles en esta vista.</text><text x="450" y="326" text-anchor="middle">La interfaz no inventa conexiones.</text></g>';
  const vb=state.camera.x+' '+state.camera.y+' '+state.camera.width+' '+state.camera.height;
  return '<svg class="micelio-svg" viewBox="'+vb+'" preserveAspectRatio="xMidYMid meet" aria-label="Visor semántico de LINK WORLD"><defs><marker id="micelio-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs><g class="micelio-viewport"><g class="micelio-edges">'+edges+'</g><g class="micelio-nodes">'+nodes+'</g>'+empty+'</g></svg>';
}

function metricsMarkup(state){
  const model=state.model,read=model.edges.filter(edge=>state.readEdges.has(edge.id)).length;
  return '<div class="micelio-metrics"><div><strong>'+model.totals.businesses+'</strong><span>negocios</span></div><div><strong>'+(model.totals.clients+model.totals.products)+'</strong><span>fichas</span></div><div><strong>'+model.totals.relations+'</strong><span>rutas</span></div><div><strong>'+model.edges.filter(edge=>edge.state==='proposed').length+'</strong><span>propuestas</span></div></div><div class="micelio-progress"><div><span style="width:'+(model.edges.length?Math.round(read/model.edges.length*100):0)+'%"></span></div><p><b>'+read+'/'+model.edges.length+'</b> rutas comprendidas</p></div>';
}
function economicEvolutionMarkup(state){
  if(state.view!=='evolution')return '';
  if(!state.member)return '<section class="micelio-evolution-strip is-locked"><div><span class="micelio-eyebrow">REALIDAD ECONÓMICA</span><h2>La evolución necesita evidencia privada.</h2><p>Abre la capa LINK para leer dinero, oportunidades y luces sin exponer datos económicos.</p></div></section>';
  const rows=state.evolution||[];
  const total=rows.reduce((sum,row)=>sum+row.realized,0);
  const potential=rows.reduce((sum,row)=>sum+row.potential,0);
  const active=rows.reduce((sum,row)=>sum+row.activeLights,0);
  const detected=rows.reduce((sum,row)=>sum+row.detectedLights,0);
  const top=[...rows].sort((a,b)=>(b.potential+b.realized)-(a.potential+a.realized)).slice(0,4);
  return '<section class="micelio-evolution-strip"><div class="micelio-evolution-head"><div><span class="micelio-eyebrow">REALIDAD PURA GAMIFICADA</span><h2>Dinero demuestra evolución. Las luces explican cómo.</h2></div><div class="micelio-evolution-score"><strong>'+new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(total)+'</strong><span>valor realizado</span></div></div><div class="micelio-evolution-kpis"><div><b>'+new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(potential)+'</b><span>oportunidad activa</span></div><div><b>'+active+'/'+detected+'</b><span>luces funcionales / detectadas</span></div><div><b>'+rows.filter(row=>row.realized>0).length+'/'+rows.length+'</b><span>células con valor demostrado</span></div></div><div class="micelio-evolution-cells">'+top.map(row=>'<button type="button" data-evolution-business="'+safe(row.businessId)+'"><span><i style="--light:'+Math.round(row.lightRatio*100)+'%"></i></span><strong>'+safe(row.name)+'</strong><small>'+row.activeLights+'/'+row.detectedLights+' luces · '+new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(row.realized)+'</small><em>'+(row.potential>0?'Oportunidad '+new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(row.potential):'Sin valor potencial cuantificado')+'</em></button>').join('')+'</div><p class="micelio-evolution-rule">Sin evidencia económica registrada, no hay evolución declarada. Las luces pueden estar detectadas; el dinero valida que producen valor real.</p></section>';
}

function buildEvolution(rows){
  const businesses=rows.businesses||[],entities=rows.entities||[],bindings=rows.bindings||[],transactions=rows.transactions||[],outcomes=rows.salesOutcomes||[],conversions=rows.conversions||[];
  return businesses.map(b=>{
    const entity=entities.find(e=>e.owner_table==='link_world_businesses'&&String(e.owner_record_id)===String(b.id));
    const lights=entity?bindings.filter(x=>x.cell_entity_id===entity.id):[];
    const activeLights=lights.filter(x=>['active','connected','verified'].includes(String(x.status||'').toLowerCase())).length;
    const realizedTx=transactions.filter(x=>x.business_id===b.id&&['paid','settled','completed','approved'].includes(String(x.status||'').toLowerCase())&&String(x.direction||'').toLowerCase()!=='expense').reduce((s,x)=>s+Number(x.amount||0),0);
    const realizedSales=outcomes.filter(x=>x.business_id===b.id&&x.verified&&String(x.outcome).toLowerCase()==='won').reduce((s,x)=>s+Number(x.amount||0),0);
    const opportunities=conversions.filter(x=>x.business_id===b.id&&x.active);
    const potential=opportunities.reduce((s,x)=>s+Number(x.components?.potential_value||x.components?.amount||x.metadata?.potential_value||0),0);
    return {businessId:b.id,name:b.name,activeLights,detectedLights:lights.length,lightRatio:lights.length?activeLights/lights.length:0,realized:Math.max(realizedTx,realizedSales),potential,opportunities:opportunities.length};
  });
}

function sourceMarkup(state){
  if(!state.member)return '<p class="micelio-source-note">Vista abierta: negocios y fichas permitidos por RLS. La operación requiere sesión LINK.</p>';
  const t=state.model.totals;
  return '<div class="micelio-sources"><span><b>'+t.events+'</b> eventos</span><span><b>'+t.activity+'</b> cambios</span><span><b>'+t.organelles+'</b> orgánulos</span><span><b>'+t.integrations+'</b> integraciones</span><span><b>'+t.documents+'</b> documentos</span><span class="is-unavailable"><b>—</b> calendario*</span></div><small>*La política actual no expone calendario a este cliente.</small>';
}
function loginMarkup(state){
  if(state.member)return '<button class="micelio-quiet-button" data-action="sign-out" type="button">Cerrar sesión LINK</button>';
  return '<form class="micelio-login" data-login-form><label>Correo LINK<input name="email" type="email" autocomplete="username" required></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Abrir capa privada</button><small>Usa una cuenta existente. No crea usuarios.</small></form>';
}

function inspectorMarkup(state){
  const model=state.model;
  if(state.selectedEdge){
    const edge=model.edges.find(item=>item.id===state.selectedEdge);
    if(edge){
      const source=model.nodes.find(node=>node.id===edge.source),target=model.nodes.find(node=>node.id===edge.target);
      return '<button class="micelio-sheet-close" data-action="close-passport" type="button" aria-label="Cerrar">×</button><span class="micelio-eyebrow">PASAPORTE DE RUTA</span><h2>'+safe(source?.label||edge.source)+' <i>→</i> '+safe(target?.label||edge.target)+'</h2><div class="micelio-passport-state status-'+edge.state+'"><span></span>'+safe(stateNames[edge.state])+'</div><dl><div><dt>Relación</dt><dd>'+safe(labelize(edge.label))+'</dd></div><div><dt>Origen</dt><dd>'+safe(originNames[edge.origin]||edge.origin)+'</dd></div><div><dt>Estado fuente</dt><dd>'+safe(labelize(edge.rawState))+'</dd></div><div><dt>Evidencias</dt><dd>'+(edge.evidenceCount||'Sin adjuntos')+'</dd></div></dl><div class="micelio-why"><span>POR QUÉ EXISTE</span><p>'+safe(edge.reason)+'</p></div>'+(edge.state==='proposed'?'<p class="micelio-caution">Es una propuesta. No representa acuerdo ni operación activa.</p>':'');
    }
  }
  if(state.selectedNode){
    const node=model.nodes.find(item=>item.id===state.selectedNode);
    if(node){
      const bindings=node.bindings||[];
      return '<button class="micelio-sheet-close" data-action="close-passport" type="button" aria-label="Cerrar">×</button><span class="micelio-eyebrow">PASAPORTE SEMÁNTICO</span><h2>'+safe(node.label)+'</h2><p class="micelio-subtitle">'+safe(node.sublabel)+'</p><div class="micelio-passport-state status-'+node.status+'"><span></span>'+safe(stateNames[node.status])+'</div><dl><div><dt>Tipo</dt><dd>'+safe(typeNames[node.type])+'</dd></div><div><dt>Estado fuente</dt><dd>'+safe(labelize(node.stage))+'</dd></div><div><dt>Identidad</dt><dd title="'+safe(node.id)+'">'+safe(node.id)+'</dd></div><div><dt>Actualización</dt><dd>'+safe(formatDate(node.updatedAt))+'</dd></div><div><dt>Señales</dt><dd>'+(node.signal?.total||0)+'</dd></div><div><dt>Evidencias</dt><dd>'+(node.evidenceCount||'Sin adjuntos')+'</dd></div></dl>'+(node.summary?'<div class="micelio-why"><span>CONTEXTO</span><p>'+safe(node.summary)+'</p></div>':'')+(bindings.length?'<div class="micelio-binding-list"><span>ORGÁNULOS CONECTADOS</span>'+bindings.slice(0,8).map(item=>'<p><b>'+safe(labelize(item.organelle_key))+'</b><small>'+safe(item.provider_domain||item.resource_name||item.status||'Registrado')+'</small></p>').join('')+'</div>':'')+'<div class="micelio-passport-actions"><button data-reach="upstream" type="button">Aguas arriba</button><button data-reach="downstream" type="button">Aguas abajo</button>'+(node.businessId?'<button class="is-primary" data-action="open-record" type="button">Abrir ficha LINK</button>':'')+'</div>';
    }
  }
  return '<div class="micelio-empty-inspector"><span>◎</span><h2>Explora el organismo.</h2><p>Selecciona un círculo o una ruta para abrir su pasaporte semántico.</p></div>';
}

function finderResultsMarkup(state){
  const q=state.finderQuery.trim().toLowerCase();
  const rows=state.model.nodes.filter(node=>!q||[node.label,node.id,node.sublabel].some(value=>String(value||'').toLowerCase().includes(q))).slice(0,30);
  return rows.length?rows.map(node=>'<button data-finder-node="'+safe(node.id)+'" type="button"><span class="micelio-result-icon">'+safe(node.label.charAt(0).toUpperCase())+'</span><span><b>'+safe(node.label)+'</b><small>'+safe(typeNames[node.type])+' · '+safe(node.id)+'</small></span></button>').join(''):'<p class="micelio-empty-result">No hay coincidencias.</p>';
}
function finderPanelMarkup(state){
  return '<section class="micelio-popover micelio-finder" aria-label="Buscar nodo"><header><div><span class="micelio-eyebrow">NODE FINDER</span><h3>Buscar en LINK</h3></div><button data-action="close-panel" type="button">×</button></header><input id="micelio-finder-input" type="search" value="'+safe(state.finderQuery)+'" placeholder="Nombre o identidad estable…" autocomplete="off"><div id="micelio-finder-results" class="micelio-results">'+finderResultsMarkup(state)+'</div></section>';
}
function lensPanelMarkup(state){
  const counts={};state.model.nodes.forEach(node=>counts[node.type]=(counts[node.type]||0)+1);
  return '<section class="micelio-popover micelio-lens"><header><div><span class="micelio-eyebrow">SEMANTIC LENS</span><h3>Comparar tipos</h3></div><button data-action="close-panel" type="button">×</button></header><p>Selecciona hasta dos tipos. La geometría no cambia: el resto permanece como referencia.</p><div class="micelio-kind-grid">'+Object.keys(typeNames).map(type=>'<button class="'+(state.lens.includes(type)?'active':'')+'" data-lens-kind="'+type+'" type="button"><span>'+safe(typeNames[type])+'</span><b>'+(counts[type]||0)+'</b></button>').join('')+'</div><button class="micelio-quiet-button" data-action="clear-lens" type="button">Limpiar lente</button></section>';
}
function routePanelMarkup(state){
  const options=state.model.nodes.slice().sort((a,b)=>(typeOrder[a.type]-typeOrder[b.type])||a.label.localeCompare(b.label)).map(node=>'<option value="'+safe(node.id)+'">'+safe(node.label)+' · '+safe(typeNames[node.type])+'</option>').join('');
  const result=state.route.result;
  const steps=result?result.nodes.map((id,index)=>{const node=state.model.nodes.find(item=>item.id===id);return '<button class="'+(state.route.index===index?'active':'')+'" data-route-step="'+index+'" type="button">'+(index+1)+'<span>'+safe(node?.label||id)+'</span></button>';}).join(''):'';
  const proposed=result&&result.edges.some(edge=>edge.state==='proposed');
  return '<section class="micelio-popover micelio-route"><header><div><span class="micelio-eyebrow">ROUTE PROBE</span><h3>Ruta dirigida</h3></div><button data-action="close-panel" type="button">×</button></header><p>Resuelve dos puntos usando sólo relaciones registradas; no interpreta cercanía visual.</p><label>Origen<select id="micelio-route-source"><option value="">Seleccionar…</option>'+options.replace('value="'+safe(state.route.source||'')+'"','value="'+safe(state.route.source||'')+'" selected')+'</select></label><label>Destino<select id="micelio-route-target"><option value="">Seleccionar…</option>'+options.replace('value="'+safe(state.route.target||'')+'"','value="'+safe(state.route.target||'')+'" selected')+'</select></label><button class="micelio-primary-button" data-action="trace-route" type="button">Trazar ruta</button>'+(state.route.error?'<p class="micelio-form-error">'+safe(state.route.error)+'</p>':'')+(result?'<div class="micelio-route-journey"><div class="micelio-route-steps">'+steps+'</div><div class="micelio-route-controls"><button data-action="route-prev" type="button">←</button><button data-action="route-play" type="button">'+(state.route.playing?'Pausa':'Recorrer')+'</button><button data-action="route-next" type="button">→</button><button data-action="clear-route" type="button">Ver todo</button></div>'+(proposed?'<small>Esta ruta incluye al menos una relación propuesta.</small>':'')+'</div>':'')+'</section>';
}
function dataPanelMarkup(state){
  return '<section class="micelio-popover micelio-data-panel"><header><div><span class="micelio-eyebrow">CAPAS Y ACCESO</span><h3>Lectura del organismo</h3></div><button data-action="close-panel" type="button">×</button></header>'+metricsMarkup(state)+'<div class="micelio-panel-section"><span class="micelio-eyebrow">FUENTES</span>'+sourceMarkup(state)+'</div><div class="micelio-panel-section"><span class="micelio-eyebrow">ACCESO</span>'+loginMarkup(state)+(state.authError?'<p class="micelio-form-error">'+safe(state.authError)+'</p>':'')+'</div>'+(state.warnings.length?'<p class="micelio-caution">'+state.warnings.length+' capa(s) no disponibles. El resto continúa operativo.</p>':'')+'</section>';
}
function activePanelMarkup(state){
  if(state.panel==='finder')return finderPanelMarkup(state);
  if(state.panel==='lens')return lensPanelMarkup(state);
  if(state.panel==='route')return routePanelMarkup(state);
  if(state.panel==='data')return dataPanelMarkup(state);
  return '';
}
function radarMarkup(state,context){
  if(!state.radarOpen)return '';
  const nodes=context.nodes.map(node=>{const p=context.positions.get(node.id);return p?'<button data-radar-node="'+safe(node.id)+'" style="left:'+(p.x/VIEWBOX.width*100)+'%;top:'+(p.y/VIEWBOX.height*100)+'%" title="'+safe(node.label)+'"></button>':'';}).join('');
  const left=state.camera.x/VIEWBOX.width*100,top=state.camera.y/VIEWBOX.height*100,width=state.camera.width/VIEWBOX.width*100,height=state.camera.height/VIEWBOX.height*100;
  return '<aside class="micelio-radar"><header><span>SEMANTIC RADAR</span><button data-action="radar" type="button">×</button></header><div class="micelio-radar-map">'+nodes+'<i style="left:'+left+'%;top:'+top+'%;width:'+width+'%;height:'+height+'%"></i></div><small>'+context.nodes.length+' nodos · vista '+Math.round(cameraScale(state)*100)+'%</small></aside>';
}
function storySequence(state,context){
  return context.nodes.slice().sort((a,b)=>(typeOrder[a.type]-typeOrder[b.type])||a.label.localeCompare(b.label)).map(node=>node.id);
}
function statusMessage(state){
  if(state.route.result)return 'Ruta dirigida · '+state.route.result.nodes.length+' nodos';
  if(state.reach)return state.reachDirection==='upstream'?'Alcance aguas arriba':'Alcance aguas abajo';
  if(state.lens.length)return 'Lente · '+state.lens.map(type=>typeNames[type]).join(' + ');
  if(state.story.playing)return 'Recorrido guiado · paso '+(state.story.index+1);
  return viewNames[state.view];
}

function shellMarkup(state){
  if(state.fatal)return '<div class="micelio-loading is-error"><strong>No pudimos abrir el Micelio.</strong><p>'+safe(state.fatal)+'</p><button data-action="refresh" type="button">Reintentar</button></div>';
  if(!state.model)return '<div class="micelio-loading"><span></span><p>Componiendo el organismo desde LINK CONTROL CENTRAL…</p></div>';
  const context=graphContext(state);state.renderContext=context;
  const scale=Math.round(cameraScale(state)*100);
  const depth=scale>=170?'full':scale<100?'map':'read';
  const chapters=Object.entries(viewNames).map(([key,name])=>'<button class="'+(state.view===key?'active':'')+'" data-micelio-view="'+key+'" type="button">'+safe(name)+(key==='proposals'?'<b>'+state.model.edges.filter(edge=>edge.state==='proposed').length+'</b>':'')+'</button>').join('');
  const hasPassport=Boolean(state.selectedNode||state.selectedEdge);
  const localControls=state.view==='local'?'<div class="micelio-local-depth"><span>PROFUNDIDAD</span>'+[1,2,3].map(depth=>'<button class="'+(state.localDepth===depth?'active':'')+'" data-action="local-depth-'+depth+'" type="button">'+depth+'</button>').join('')+'</div>':'';
  return '<div class="micelio-shell" data-reading-depth="'+depth+'"><header class="micelio-head"><div><span class="micelio-eyebrow">LINK WORLD / CONNECTION READER</span><h1>Micelio <small>BETA</small></h1><p>Lee el organismo como una red: conexiones reales, vecindarios locales y fichas navegables.</p></div><div class="micelio-head-actions"><span class="micelio-sync-state"><i></i>'+(state.member?'Evento vivo + 90 s':'Vista abierta')+'</span><button data-action="refresh" type="button" aria-label="Sincronizar">'+(state.loading?'Leyendo…':'↻')+'</button><button data-action="theme" type="button" aria-label="Cambiar tema">'+(state.theme==='dark'?'☀':'◐')+'</button></div></header>'+economicEvolutionMarkup(state)+'<div class="micelio-stage"><aside class="micelio-overview-rail"><span class="micelio-eyebrow">PULSO</span>'+metricsMarkup(state)+'<button class="micelio-primary-button" data-action="data-panel" type="button">Capas y acceso</button><p class="micelio-boundary">Supabase es la fuente viva. El visor no crea una topología paralela.</p></aside><section class="micelio-workbench"><div class="micelio-chapter-rail"><div>'+chapters+'</div>'+localControls+'<button class="micelio-story-button '+(state.story.playing?'active':'')+'" data-action="story" type="button">'+(state.story.playing?'Pausar':'▶ Recorrido')+'</button></div><div class="micelio-canvas" data-viewer-state="'+safe(statusMessage(state))+'"><div class="micelio-canvas-status"><span>'+safe(statusMessage(state))+'</span><small>'+scale+'% · '+depth.toUpperCase()+'</small></div>'+graphMarkup(state,context)+'<nav class="micelio-viewer-nav" aria-label="Herramientas del visor"><button data-action="finder" type="button" title="Buscar nodo" aria-label="Buscar nodo">⌕<span>Buscar</span></button><button data-action="lens" type="button" title="Lente semántica" aria-label="Lente semántica">◫<span>Tipos</span></button><button data-action="route" type="button" title="Trazar ruta" aria-label="Trazar ruta">⇢<span>Ruta</span></button><button data-action="radar" type="button" title="Mapa general" aria-label="Mapa general">◇<span>Mapa</span></button><i></i><button data-action="zoom-out" type="button" aria-label="Alejar">−</button><button class="micelio-reset-view" data-action="reset-camera" type="button" aria-label="Restablecer vista">'+scale+'%</button><button data-action="zoom-in" type="button" aria-label="Acercar">+</button><button data-action="data-panel" type="button" title="Capas y acceso" aria-label="Capas y acceso">⋮</button></nav>'+radarMarkup(state,context)+activePanelMarkup(state)+'</div></section><aside class="micelio-inspector '+(hasPassport?'has-selection':'')+'">'+inspectorMarkup(state)+'</aside></div>'+(hasPassport?'<button class="micelio-sheet-backdrop" data-action="close-passport" aria-label="Cerrar pasaporte"></button>':'')+'<footer class="micelio-foot"><span>Relaciones registradas, no causalidad inferida.</span><span>'+safe(formatDate(state.lastRefresh))+'</span></footer></div>';
}

export function mountMicelioBeta(selector='#lw-micelio'){
  const root=document.querySelector(selector);
  if(!root)return {open(){},close(){},refresh(){}};
  const state={open:false,loading:false,member:false,model:null,evolution:[],fatal:null,warnings:[],view:'organism',selectedNode:null,lastNode:null,localDepth:1,selectedEdge:null,reach:null,reachDirection:null,readEdges:readProgress(),theme:initialTheme(),lastRefresh:null,authError:null,camera:cameraBase(),panel:null,finderQuery:'',lens:[],radarOpen:false,story:{playing:false,index:0},route:{source:null,target:null,result:null,error:null,index:0,playing:false},renderContext:null};
  let channel=null,pollTimer=null,refreshTimer=null,storyTimer=null,routeTimer=null;

  const clearPlayback=()=>{
    clearTimeout(storyTimer);storyTimer=null;state.story.playing=false;
    clearTimeout(routeTimer);routeTimer=null;state.route.playing=false;
  };
  const render=()=>{
    root.dataset.micelioTheme=state.theme;
    root.innerHTML=shellMarkup(state);
    bind();
  };
  const setView=view=>{
    clearPlayback();
    if(view==='local'&&!state.selectedNode){
      state.selectedNode=state.lastNode||state.model?.nodes.find(node=>node.type==='business')?.id||state.model?.nodes[0]?.id||null;
    }
    state.view=view;
    if(view!=='local'&&view!=='organism')state.selectedNode=null;
    state.selectedEdge=null;state.reach=null;state.reachDirection=null;state.route.result=null;state.route.error=null;state.camera=cameraBase();state.panel=null;render();
  };
  const selectNode=id=>{
    state.selectedNode=id;state.lastNode=id;state.selectedEdge=null;state.reach=null;state.reachDirection=null;
    revealNodeCamera(state,id);render();
  };
  const openCanonicalRecord=id=>{
    const node=state.model?.nodes.find(item=>item.id===id);if(!node)return;
    state.selectedNode=id;state.lastNode=id;state.selectedEdge=null;
    if(!node.businessId){selectNode(id);return;}
    document.dispatchEvent(new CustomEvent('linkworld:open-business',{detail:{
      id:node.businessId,
      clientId:node.type==='client'?node.ownerRecordId:(node.clientId||null),
      productId:node.type==='product'?node.ownerRecordId:null,
      graphNodeId:node.id
    }}));
  };
  const selectEdge=id=>{
    state.selectedEdge=id;state.selectedNode=null;state.reach=null;state.reachDirection=null;state.readEdges.add(id);writeProgress(state.readEdges);render();
  };
  const stepStory=()=>{
    const context=graphContext(state),sequence=storySequence(state,context);
    if(!sequence.length){state.story.playing=false;render();return;}
    if(state.story.index>=sequence.length){state.story.index=0;state.story.playing=false;render();return;}
    const id=sequence[state.story.index];state.selectedNode=id;state.selectedEdge=null;state.camera=cameraForIds(context,[id]);render();
    if(state.story.playing){
      storyTimer=setTimeout(()=>{state.story.index+=1;stepStory();},1800);
    }
  };
  const toggleStory=()=>{
    clearTimeout(storyTimer);
    if(state.story.playing){state.story.playing=false;render();return;}
    state.route.playing=false;clearTimeout(routeTimer);state.story.playing=true;state.story.index=0;stepStory();
  };
  const routeStep=delta=>{
    const result=state.route.result;if(!result)return;
    state.route.index=Math.max(0,Math.min(result.nodes.length-1,state.route.index+delta));
    const id=result.nodes[state.route.index];state.selectedNode=id;state.selectedEdge=null;
    const context=graphContext(state);state.camera=cameraForIds(context,[id]);render();
  };
  const playRoute=()=>{
    clearTimeout(routeTimer);
    if(!state.route.result)return;
    if(state.route.playing){state.route.playing=false;render();return;}
    state.story.playing=false;clearTimeout(storyTimer);state.route.playing=true;render();
    const tick=()=>{
      if(!state.route.playing)return;
      if(state.route.index>=state.route.result.nodes.length-1){state.route.playing=false;render();return;}
      routeStep(1);routeTimer=setTimeout(tick,1500);
    };
    routeTimer=setTimeout(tick,900);
  };
  const openPanel=name=>{state.panel=state.panel===name?null:name;render();};

  function handleAction(action){
    if(action==='refresh'){refresh({manual:true});return;}
    if(action==='theme'){state.theme=state.theme==='dark'?'light':'dark';try{sessionStorage.setItem('linkworld:micelio:theme',state.theme);}catch{}render();return;}
    if(action==='finder'){openPanel('finder');return;}
    if(action==='lens'){openPanel('lens');return;}
    if(action==='route'){openPanel('route');return;}
    if(action==='data-panel'){openPanel('data');return;}
    if(action==='close-panel'){state.panel=null;render();return;}
    if(action==='radar'){state.radarOpen=!state.radarOpen;render();return;}
    if(action==='zoom-in'){zoomCamera(state,1.28);render();return;}
    if(action==='zoom-out'){zoomCamera(state,.78);render();return;}
    if(action==='reset-camera'){state.camera=cameraBase();state.reach=null;state.reachDirection=null;render();return;}
    if(action==='close-passport'){state.selectedNode=null;state.selectedEdge=null;state.reach=null;state.reachDirection=null;render();return;}
    if(action==='clear-lens'){state.lens=[];render();return;}
    if(action==='story'){toggleStory();return;}
    if(action==='route-prev'){routeStep(-1);return;}
    if(action==='route-next'){routeStep(1);return;}
    if(action==='route-play'){playRoute();return;}
    if(action==='clear-route'){clearTimeout(routeTimer);state.route={source:null,target:null,result:null,error:null,index:0,playing:false};state.camera=cameraBase();render();return;}
    if(action==='trace-route'){
      const source=root.querySelector('#micelio-route-source')?.value||'',target=root.querySelector('#micelio-route-target')?.value||'';
      state.route.source=source;state.route.target=target;state.route.error=null;
      const result=directedRoute(state.model,source,target);
      if(!source||!target)state.route.error='Selecciona origen y destino.';
      else if(source===target)state.route.error='Origen y destino deben ser distintos.';
      else if(!result)state.route.error='No existe una ruta dirigida registrada entre esos puntos.';
      else{state.route.result=result;state.route.index=0;state.view=result.nodes.some(id=>['client','product'].includes(state.model.nodes.find(node=>node.id===id)?.type))?'records':'organism';state.camera=cameraForIds(graphContext(state),result.nodes);state.selectedNode=null;state.selectedEdge=null;}
      render();return;
    }
    if(action==='open-record'){openCanonicalRecord(state.selectedNode);return;}
    if(action.startsWith('local-depth-')){
      state.localDepth=Math.max(1,Math.min(3,Number(action.slice(-1))||1));state.view='local';state.camera=cameraBase();render();return;
    }
  }

  function bindCamera(){
    const svg=root.querySelector('.micelio-svg');if(!svg)return;
    const pointers=new Map();let gesture=null;
    const pointInView=event=>{
      const rect=svg.getBoundingClientRect();
      return {x:state.camera.x+(event.clientX-rect.left)/Math.max(1,rect.width)*state.camera.width,y:state.camera.y+(event.clientY-rect.top)/Math.max(1,rect.height)*state.camera.height};
    };
    const syncOnly=()=>{
      svg.setAttribute('viewBox',state.camera.x+' '+state.camera.y+' '+state.camera.width+' '+state.camera.height);
      const viewport=root.querySelector('.micelio-radar-map i');
      if(viewport){viewport.style.left=(state.camera.x/VIEWBOX.width*100)+'%';viewport.style.top=(state.camera.y/VIEWBOX.height*100)+'%';viewport.style.width=(state.camera.width/VIEWBOX.width*100)+'%';viewport.style.height=(state.camera.height/VIEWBOX.height*100)+'%';}
      const reset=root.querySelector('.micelio-reset-view');if(reset)reset.textContent=Math.round(cameraScale(state)*100)+'%';
    };
    svg.addEventListener('wheel',event=>{event.preventDefault();zoomCamera(state,event.deltaY<0?1.18:.85,pointInView(event));syncOnly();},{passive:false});
    svg.addEventListener('dblclick',event=>{if(event.target.closest('[data-node-id],[data-edge-id]'))return;zoomCamera(state,1.35,pointInView(event));syncOnly();});
    svg.addEventListener('pointerdown',event=>{
      if(event.button!==0||event.target.closest('[data-node-id],[data-edge-id]'))return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});svg.setPointerCapture?.(event.pointerId);
      if(pointers.size===1)gesture={kind:'pan',startX:event.clientX,startY:event.clientY,camera:{...state.camera}};
      else if(pointers.size===2){
        const pair=[...pointers.values()],dx=pair[1].x-pair[0].x,dy=pair[1].y-pair[0].y;
        gesture={kind:'pinch',distance:Math.hypot(dx,dy),camera:{...state.camera},midX:(pair[0].x+pair[1].x)/2,midY:(pair[0].y+pair[1].y)/2};
      }
    });
    svg.addEventListener('pointermove',event=>{
      if(!pointers.has(event.pointerId)||!gesture)return;
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      const rect=svg.getBoundingClientRect();
      if(gesture.kind==='pan'&&pointers.size===1){
        const dx=(event.clientX-gesture.startX)/Math.max(1,rect.width)*gesture.camera.width;
        const dy=(event.clientY-gesture.startY)/Math.max(1,rect.height)*gesture.camera.height;
        state.camera=clampCamera({...gesture.camera,x:gesture.camera.x-dx,y:gesture.camera.y-dy});syncOnly();
      }else if(pointers.size===2){
        const pair=[...pointers.values()],dx=pair[1].x-pair[0].x,dy=pair[1].y-pair[0].y;
        const distance=Math.max(1,Math.hypot(dx,dy)),factor=distance/Math.max(1,gesture.distance);
        const anchor={x:gesture.camera.x+gesture.camera.width/2,y:gesture.camera.y+gesture.camera.height/2};
        state.camera={...gesture.camera};zoomCamera(state,factor,anchor);syncOnly();
      }
    });
    const end=event=>{pointers.delete(event.pointerId);if(!pointers.size)gesture=null;else{const p=[...pointers.values()][0];gesture={kind:'pan',startX:p.x,startY:p.y,camera:{...state.camera}};}};
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  }

  function bind(){
    root.onclick=event=>{
      const action=event.target.closest('[data-action]');if(action){handleAction(action.dataset.action);return;}
      const view=event.target.closest('[data-micelio-view]');if(view){setView(view.dataset.micelioView);return;}
      const lens=event.target.closest('[data-lens-kind]');if(lens){const kind=lens.dataset.lensKind;state.lens=state.lens.includes(kind)?state.lens.filter(item=>item!==kind):[...state.lens.slice(-1),kind];render();return;}
      const found=event.target.closest('[data-finder-node]');if(found){const id=found.dataset.finderNode;state.panel=null;state.view='local';state.localDepth=1;selectNode(id);return;}
      const radar=event.target.closest('[data-radar-node]');if(radar){selectNode(radar.dataset.radarNode);return;}
      const step=event.target.closest('[data-route-step]');if(step){state.route.index=Number(step.dataset.routeStep)||0;routeStep(0);return;}
      const reach=event.target.closest('[data-reach]');if(reach&&state.selectedNode){state.reach=reachable(state.model,state.selectedNode,reach.dataset.reach);state.reachDirection=reach.dataset.reach;if([...state.reach.nodes].some(id=>['client','product'].includes(state.model.nodes.find(node=>node.id===id)?.type)))state.view='records';state.camera=cameraForIds(graphContext(state),[...state.reach.nodes]);render();return;}
      const evo=event.target.closest('[data-evolution-business]');if(evo){document.dispatchEvent(new CustomEvent('linkworld:open-business',{detail:{id:evo.dataset.evolutionBusiness}}));return;}\n      const node=event.target.closest('[data-node-id]');if(node){openCanonicalRecord(node.dataset.nodeId);return;}
      const edge=event.target.closest('[data-edge-id]');if(edge){selectEdge(edge.dataset.edgeId);return;}
    };
    root.onkeydown=event=>{
      if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-node-id],[data-edge-id]')){event.preventDefault();event.target.click();}
      if(event.key==='Escape'){if(state.panel){state.panel=null;render();}else if(state.selectedNode||state.selectedEdge){state.selectedNode=null;state.selectedEdge=null;render();}}
      if(event.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){event.preventDefault();state.panel='finder';render();}
    };
    const finder=root.querySelector('#micelio-finder-input');
    if(finder){finder.addEventListener('input',event=>{state.finderQuery=event.target.value;const results=root.querySelector('#micelio-finder-results');if(results)results.innerHTML=finderResultsMarkup(state);});setTimeout(()=>finder.focus(),0);}
    root.querySelector('[data-login-form]')?.addEventListener('submit',async event=>{
      event.preventDefault();state.authError=null;
      const form=new FormData(event.currentTarget),email=String(form.get('email')||'').trim(),password=String(form.get('password')||'');
      const {error}=await db.auth.signInWithPassword({email,password});
      if(error){state.authError='No se pudo abrir la sesión: '+error.message;render();return;}
      state.panel=null;await refresh({manual:true});
    });
    root.querySelector('[data-action="sign-out"]')?.addEventListener('click',async()=>{await db.auth.signOut();state.panel=null;await refresh({manual:true});});
    const setHover=id=>{
      const connected=new Set([id]);
      state.model?.edges.forEach(edge=>{if(edge.source===id)connected.add(edge.target);if(edge.target===id)connected.add(edge.source);});
      root.querySelectorAll('[data-node-id]').forEach(el=>el.classList.toggle('is-hover-dim',Boolean(id)&&!connected.has(el.dataset.nodeId)));
      root.querySelectorAll('[data-edge-id]').forEach(el=>el.classList.toggle('is-hover-dim',Boolean(id)&&el.dataset.edgeFrom!==id&&el.dataset.edgeTo!==id));
      root.querySelector('[data-node-id="'+CSS.escape(id||'')+'"]')?.classList.toggle('is-hover',Boolean(id));
    };
    root.querySelectorAll('[data-node-id]').forEach(el=>{
      el.addEventListener('pointerenter',()=>setHover(el.dataset.nodeId));
      el.addEventListener('pointerleave',()=>setHover(null));
    });
    bindCamera();
  }

  const syncRealtime=()=>{
    if(channel){db.removeChannel(channel);channel=null;}
    if(!state.open||!state.member)return;
    channel=db.channel('linkworld-micelio-event-bus').on('postgres_changes',{event:'*',schema:'public',table:'event_bus'},()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>refresh({quiet:true}),900);}).subscribe();
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
    for(const result of results){rows[result.key]=result.rows;if(result.error)warnings.push(result.key+': '+result.error);}
    const coreFailure=results.find(result=>result.key==='businesses'&&result.error);
    if(coreFailure){state.fatal=coreFailure.error;state.loading=false;render();return;}
    const firstLoad=!state.model;
    state.member=member;state.warnings=warnings;state.model=buildMicelioModel(rows,{member,capturedAt:new Date().toISOString(),warnings});state.evolution=member?buildEvolution(rows):[];state.lastRefresh=new Date().toISOString();state.loading=false;
    if(firstLoad)state.camera=cameraBase();
    if(state.selectedNode&&!state.model.nodes.some(node=>node.id===state.selectedNode))state.selectedNode=null;
    if(state.selectedEdge&&!state.model.edges.some(edge=>edge.id===state.selectedEdge))state.selectedEdge=null;
    syncRealtime();syncPolling();render();
  }
  const open=()=>{state.open=true;root.classList.remove('hidden');if(!state.model)refresh();else{syncRealtime();syncPolling();render();}};
  const close=()=>{state.open=false;clearPlayback();clearInterval(pollTimer);pollTimer=null;if(channel){db.removeChannel(channel);channel=null;}};
  db.auth.onAuthStateChange(event=>{if(state.open&&(event==='SIGNED_IN'||event==='SIGNED_OUT'))setTimeout(()=>refresh({quiet:true}),0);});
  render();
  return {open,close,refresh};
}
