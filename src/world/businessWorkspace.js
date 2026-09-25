// LINK WORLD · full-screen business/client workspace for real operations.
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './connection.js';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
const $=(s,r=document)=>r.querySelector(s);
const safe=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(n,currency='CLP')=>{
  const x=Number(n);
  if(!Number.isFinite(x))return '—';
  try{return new Intl.NumberFormat('es-CL',{style:'currency',currency,maximumFractionDigits:0}).format(x);}
  catch{return '$'+Math.round(x).toLocaleString('es-CL');}
};
const stageNames={detected:'Detectar',conversation:'Conversar',agreed:'Acordar',active:'Activar',recorded:'Registrar',learning:'Aprender',expanding:'Expandir',paused:'Pausado',closed:'Cerrado'};
const resolveEntityColor=(visual={})=>{const raw=String(visual?.assigned_color||'').trim();return visual?.color_visible===true&&/^#[0-9a-f]{6}$/i.test(raw)?raw.toLowerCase():null;};
const colorStyle=color=>color?' style="border-left:4px solid '+safe(color)+'"':'';

const state={open:false,business:null,clients:[],products:[],profiles:[],client:null,busy:false,canWrite:false};

async function writeSession(){
  const {data:{session}}=await db.auth.getSession();
  if(!session)throw new Error('Por ahora los cambios se realizan desde ChatGPT; la navegación web queda abierta.');
  const {data,error}=await db.rpc('link_world_is_member');
  if(error||data!==true)throw new Error('Esta sesión no tiene permisos de edición.');
  return session;
}
async function detectWriteAccess(){
  try{
    const {data:{session}}=await db.auth.getSession();
    if(!session){state.canWrite=false;return;}
    const {data,error}=await db.rpc('link_world_is_member');
    state.canWrite=!error&&data===true;
  }catch{state.canWrite=false;}
}
function notice(text,error=false){
  const el=$('#bw-notice');if(!el)return;
  el.textContent=text||'';el.classList.toggle('error',error);el.classList.toggle('hidden',!text);
}
async function loadBusiness(businessId){
  await detectWriteAccess();
  const [b,c,p,r]=await Promise.all([
    db.from('link_world_businesses').select('id,slug,name,sector,city,country,summary,owned_facts,evidence,verification_status,updated_at').eq('id',businessId).single(),
    db.from('link_world_clients').select('*').eq('business_id',businessId).order('created_at',{ascending:true}),
    db.from('link_world_products').select('*').eq('business_id',businessId).order('created_at',{ascending:true}),
    db.from('link_world_responsibility_profiles').select('*').order('sort_order',{ascending:true})
  ]);
  const problem=[b,c,p,r].find(x=>x.error);
  if(problem)throw problem.error;
  state.business=b.data;state.clients=c.data||[];state.products=p.data||[];state.profiles=r.data||[];
}
function facts(){
  return state.business?.owned_facts&&typeof state.business.owned_facts==='object'?state.business.owned_facts:{};
}
function statusLabel(v){
  return ({draft:'Borrador',needs_review:'Por revisar',verified:'Verificado'})[v]||v||'Borrador';
}
function businessMetrics(){
  const active=state.products.filter(x=>x.economic_state==='active'||x.stage==='active').length;
  const blocked=state.products.filter(x=>x.economic_state==='blocked').length;
  return {clients:state.clients.length,products:state.products.length,active,blocked};
}
function profileFor(id){return state.profiles.find(p=>p.id===id);}
function productEconomics(p){
  const clientShare=Number(p.client_benefit_share_percent);
  const linkShare=Number(p.link_share_percent);
  const min=Number(p.minimum_link_share_percent);
  const splitKnown=Number.isFinite(clientShare)&&Number.isFinite(linkShare);
  const blocked=splitKnown&&Number.isFinite(min)&&linkShare<min;
  const spread=Number.isFinite(Number(p.public_price))&&Number.isFinite(Number(p.acquisition_price))?
    Number(p.public_price)-Number(p.acquisition_price):null;
  return {clientShare,linkShare,min,splitKnown,blocked,spread};
}

function renderClientHub(){
  state.client=null;
  const m=businessMetrics(),root=$('#bw-content');
  root.innerHTML=[
    '<section class="bw-business-head">',
      '<div><button class="bw-back" id="bw-close-hub" type="button">← LINK WORLD</button>',
      '<span class="bw-kicker">'+safe(state.business.name)+' / CLIENTES</span>',
      '<h1>Panel de clientes</h1>',
      '<p>Entra a cada cliente para abrir su ficha maestra y revisar todos sus productos, convenios, responsabilidades y etapas.</p></div>',
      '<div class="bw-head-actions"><button id="bw-business-master" type="button">Ficha de '+safe(state.business.name)+'</button><button id="bw-refresh-hub" type="button">↻ Actualizar</button></div>',
    '</section>',
    '<section class="bw-metrics"><div><strong>'+m.clients+'</strong><span>Clientes / convenios</span></div><div><strong>'+m.products+'</strong><span>Productos</span></div><div><strong>'+m.active+'</strong><span>Productos activos</span></div><div><strong>'+m.blocked+'</strong><span>Productos bloqueados</span></div></section>',
    '<section class="bw-clients-section bw-client-hub">',
      '<div class="bw-section-head"><div><span class="bw-kicker">ESCALA / CLIENTES</span><h2>Clientes de '+safe(state.business.name)+'</h2><p>Cliente → ficha maestra → productos. Esta es la ruta principal del negocio.</p></div>'+(state.canWrite?'<button id="bw-add-client" class="bw-primary" type="button">+ Nuevo cliente</button>':'<span class="bw-open-mode">Modo abierto · cambios desde ChatGPT</span>')+'</div>',
      '<form id="bw-client-form" class="bw-form hidden"><h3>Nuevo cliente / convenio</h3><div class="bw-form-grid"><label>Nombre<input id="bwc-name" required maxlength="180"></label><label>Tipo<select id="bwc-role"><option value="comercio">Comercio</option><option value="proveedor">Proveedor</option><option value="establecimiento">Establecimiento</option><option value="partner">Partner</option><option value="otro">Otro</option></select></label><label>Ciudad<input id="bwc-city" maxlength="120"></label><label>País<input id="bwc-country" maxlength="100" value="Chile"></label></div><label>Contexto<textarea id="bwc-summary" rows="2" maxlength="900" placeholder="Qué relación tenemos y qué queremos probar"></textarea></label><div class="bw-form-actions"><button class="bw-primary" type="submit">Crear borrador</button><button id="bwc-cancel" type="button">Cancelar</button></div></form>',
      '<div id="bw-client-list" class="bw-client-grid">'+(state.clients.length?state.clients.map(c=>{
        const products=state.products.filter(p=>p.client_id===c.id);
        const active=products.filter(p=>p.economic_state==='active'||p.stage==='active').length;
        const blocked=products.filter(p=>p.economic_state==='blocked'||productEconomics(p).blocked).length;
        const cColor=resolveEntityColor(c.owned_facts?.visual_identity||c.metadata?.visual_identity||c.visual_identity);
        return '<button class="bw-client-card master"'+colorStyle(cColor)+' type="button" data-client="'+safe(c.id)+'">'+
          '<div class="bw-client-top"><span class="bw-client-icon">'+safe(c.name?.charAt(0)?.toUpperCase()||'C')+'</span><span class="bw-client-state">'+safe(stageNames[c.relationship_state]||c.relationship_state)+'</span></div>'+
          '<strong>'+safe(c.name)+'</strong>'+
          '<small>'+safe([c.role,c.city,c.country].filter(Boolean).join(' · '))+'</small>'+
          '<p>'+safe(c.summary||'Sin resumen registrado.')+'</p>'+
          '<div class="bw-client-numbers"><span><b>'+products.length+'</b> productos</span><span><b>'+active+'</b> activos</span><span><b>'+blocked+'</b> bloqueados</span></div>'+
          '<em>Abrir ficha maestra →</em>'+
        '</button>';
      }).join(''):'<div class="bw-empty"><strong>Aún no hay clientes registrados.</strong><span>Cuando agreguemos el primer convenio real, aparecerá aquí y abrirá su ficha maestra a pantalla completa.</span></div>')+'</div>',
    '</section>'
  ].join('');
  $('#bw-close-hub').addEventListener('click',close);
  $('#bw-business-master').addEventListener('click',renderBusiness);
  $('#bw-refresh-hub').addEventListener('click',refresh);
  if(state.canWrite){
    $('#bw-add-client')?.addEventListener('click',()=>$('#bw-client-form').classList.remove('hidden'));
    $('#bwc-cancel')?.addEventListener('click',()=>$('#bw-client-form').classList.add('hidden'));
    $('#bw-client-form')?.addEventListener('submit',createClientRecord);
  }
  root.querySelectorAll('[data-client]').forEach(b=>b.addEventListener('click',()=>openClient(b.dataset.client)));
}

function renderClientBusinessCell(){
  state.client=null;
  const f=facts(),contract=f.active_contract||{};
  const fallback=f.sold_product&&Object.keys(f.sold_product).length?[f.sold_product]:[];
  const branches=Array.isArray(f.product_branches)&&f.product_branches.length?f.product_branches:fallback;
  const active=branches.filter(p=>p.status==='active');
  const commitments=branches.flatMap(p=>Array.isArray(p.commitments)?p.commitments:[]);
  const root=$('#bw-content');
  const branchCard=p=>{
    const perSession=p.billing_model==='per_session';
    const price=perSession?money(p.price_clp,'CLP')+' líquidos / jornada':money(p.price_clp,'CLP')+' / mes';
    const schedule=p.schedule&&typeof p.schedule==='object'?
      [Array.isArray(p.schedule.days)?p.schedule.days.join(' · '):'',p.schedule.start_local?('desde '+p.schedule.start_local):'',p.schedule.end_rule==='cierre_del_local'?'hasta cierre':''].filter(Boolean).join(' · '):'';
    const cs=Array.isArray(p.commitments)?p.commitments:[];
    const finance=p.financial_folder_url?'<a href="'+safe(p.financial_folder_url)+'" target="_blank" rel="noopener noreferrer">Abrir carpeta financiera ↗</a>':'';
    const pColor=resolveEntityColor(p.visual_identity||p.visual);
    const visualState=pColor?'<span><b>Color activo</b> '+safe(pColor)+'</span>':'<span><b>Sin color</b> pago/evidencia pendiente</span>';
    return '<article class="bw-product"'+colorStyle(pColor)+'>'+
      '<div class="bw-product-head"><div><span class="bw-kicker">'+safe(p.product_code||'PRODUCTO VENDIDO')+'</span><h3>'+safe(p.name||'Producto')+'</h3></div><span class="bw-economic active">Activo</span></div>'+
      '<div class="bw-product-values"><div><small>Precio acordado</small><strong>'+price+'</strong></div><div><small>Cobro</small><strong>'+safe(perSession?'Por jornada':'Mensual')+'</strong></div><div><small>Documento</small><strong>Boleta de honorarios</strong></div></div>'+
      (schedule?'<p class="bw-product-notes"><b>Compromiso horario:</b> '+safe(schedule)+'</p>':'')+
      (finance?'<p class="bw-product-notes">'+finance+'</p>':'')+
      '<div class="bw-product-foot"><span>Compromisos: <b>'+cs.length+'</b></span><span>Estado: <b>Activo</b></span>'+visualState+'</div>'+
    '</article>';
  };
  const commitmentCard=(c,p)=>'<article class="bw-product"><div class="bw-product-head"><div><span class="bw-kicker">'+safe(c.code||'COMPROMISO')+'</span><h3>'+safe(c.title||'Compromiso')+'</h3></div><span class="bw-economic active">'+safe(c.status==='in_progress'?'En curso':c.status||'Activo')+'</span></div>'+
    '<div class="bw-product-values"><div><small>Producto</small><strong>'+safe(p.name||'—')+'</strong></div><div><small>Valor asociado</small><strong>'+(c.component_clp?money(c.component_clp,'CLP'):(p.billing_model==='per_session'?money(p.price_clp,'CLP')+' / jornada':'Incluido'))+'</strong></div><div><small>Facturación individual</small><strong>'+(p.billing_model==='per_session'?'Sí, por jornada':'No')+'</strong></div></div>'+
    (c.schedule?'<p class="bw-product-notes"><b>Horario:</b> '+safe(c.days||'')+' · '+safe(c.schedule)+'</p>':'')+
  '</article>';
  root.innerHTML=[
    '<section class="bw-client-head"><div><button id="bw-close-client-cell" class="bw-back" type="button">← LINK WORLD</button><span class="bw-kicker">FICHA DE CLIENTE / '+safe(contract.code||'CARACOL')+'</span><h1>'+safe(state.business.name)+'</h1><p>'+safe(state.business.summary||'Cliente activo del ecosistema LINK.')+'</p><div class="bw-tags"><span>Cliente activo</span><span>'+active.length+' productos vendidos activos</span></div></div><button id="bw-client-cell-director" type="button">✦ Revisar con Director</button></section>',
    '<section class="bw-metrics"><div><strong>'+active.length+'</strong><span>Productos vendidos</span></div><div><strong>'+commitments.length+'</strong><span>Compromisos activos</span></div><div><strong>'+money(contract.monthly_fee_clp,'CLP')+'</strong><span>RRSS / mes</span></div><div><strong>'+money(branches.find(p=>p.product_code==='CAR-KARAOKE')?.price_clp,'CLP')+'</strong><span>Karaoke / jornada</span></div></section>',
    '<section class="bw-products-section"><div class="bw-section-head"><div><span class="bw-kicker">RAMAS / PRODUCTOS VENDIDOS</span><h2>Productos activos de CARACOL</h2><p>Cada producto conserva su forma de cobro, compromiso, evidencia y respaldo financiero. <b>Color = acuerdo vigente + producto activo + pago validado.</b> Si falta pago o evidencia, permanece neutro.</p></div></div><div class="bw-product-grid">'+(branches.length?branches.map(branchCard).join(''):'<div class="bw-empty"><strong>Sin productos vendidos.</strong></div>')+'</div></section>',
    '<section class="bw-products-section"><div class="bw-section-head"><div><span class="bw-kicker">COMPROMISOS</span><h2>Qué debemos mantener activo</h2><p>Los compromisos pertenecen a su producto. RRSS se cobra por contrato mensual; Karaoke se cobra por jornada realizada.</p></div></div><div class="bw-product-grid">'+(branches.some(p=>Array.isArray(p.commitments)&&p.commitments.length)?branches.flatMap(p=>(p.commitments||[]).map(c=>commitmentCard(c,p))).join(''):'<div class="bw-empty"><strong>Sin compromisos sincronizados.</strong></div>')+'</div></section>'
  ].join('');
  $('#bw-close-client-cell').addEventListener('click',close);
  $('#bw-client-cell-director').addEventListener('click',()=>{
    const prompt='Revisa la ficha completa de '+state.business.name+' en LINK WORLD: productos vendidos, compromisos, jornadas, evidencias, boletas, pagos y siguiente acción. No inventes pagos ni cierres.';
    close();
    document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt}}));
  });
}

function renderBusiness(){
  const f=facts();
  if(f.ecosystem_role==='client_business_cell'){renderClientBusinessCell();return;}
  state.client=null;
  const m=businessMetrics();
  const identity=Array.isArray(f.identity_words)?f.identity_words:[];
  const caps=Array.isArray(f.capabilities)?f.capabilities:[];
  const cycle=Array.isArray(f.cycle)?f.cycle:['Detectar','Conversar','Acordar','Activar','Registrar','Aprender','Expandir'];
  const rule=f.economic_rule||{};
  const root=$('#bw-content');
  root.innerHTML=[
    '<section class="bw-business-head">',
      '<div><button class="bw-back" id="bw-close-top" type="button">← Negocios LINK WORLD</button>',
      '<span class="bw-kicker">NEGOCIO / '+safe(state.business.slug||'')+'</span>',
      '<h1>'+safe(state.business.name)+'</h1>',
      '<p>'+safe(f.tagline||state.business.summary||'')+'</p>',
      '<div class="bw-tags">'+identity.map(x=>'<span>'+safe(x)+'</span>').join('')+'<span class="status">'+safe(f.status||statusLabel(state.business.verification_status))+'</span></div></div>',
      '<div class="bw-head-actions"><button id="bw-open-director" type="button">✦ Conversar con Director</button><button id="bw-refresh" type="button">↻ Actualizar</button></div>',
    '</section>',
    '<section class="bw-metrics"><div><strong>'+m.clients+'</strong><span>Clientes / convenios</span></div><div><strong>'+m.products+'</strong><span>Productos</span></div><div><strong>'+m.active+'</strong><span>Activos</span></div><div><strong>'+m.blocked+'</strong><span>Bloqueados</span></div></section>',
    '<section class="bw-grid">',
      '<article class="bw-panel span-2"><div class="bw-panel-head"><div><span class="bw-kicker">CAPACIDADES</span><h2>Qué aporta al ecosistema</h2></div></div><div class="bw-capabilities">'+caps.map((x,i)=>'<div><b>0'+(i+1)+'</b><span>'+safe(x)+'</span></div>').join('')+'</div></article>',
      '<article class="bw-panel"><span class="bw-kicker">REGLA ECONÓMICA</span><h2>Responsabilidad → porcentaje</h2><p>'+safe(rule.principle||'Cada producto define su economía según la responsabilidad real de LINK.')+'</p><div class="bw-profiles">'+state.profiles.map(p=>'<div><strong>'+safe(p.label)+'</strong><span>'+safe(p.min_percent)+'%'+(Number(p.max_percent)!==Number(p.min_percent)?'–'+safe(p.max_percent)+'%':'')+'</span><small>'+safe(p.description||'')+'</small></div>').join('')+'</div></article>',
      '<article class="bw-panel"><span class="bw-kicker">CICLO</span><h2>Cómo avanza</h2><div class="bw-cycle">'+cycle.map((x,i)=>'<span><b>'+(i+1)+'</b>'+safe(x)+'</span>').join('')+'</div></article>',
    '</section>',
    '<section class="bw-clients-section">',
      '<div class="bw-section-head"><div><span class="bw-kicker">ESCALA / CLIENTES</span><h2>Convenios y productos</h2><p>Cada cliente tiene su propia ficha y sus productos. El crecimiento se mide desde aquí.</p></div>'+(state.canWrite?'<button id="bw-add-client" class="bw-primary" type="button">+ Nuevo cliente</button>':'<span class="bw-open-mode">Modo abierto · cambios desde ChatGPT</span>')+'</div>',
      '<form id="bw-client-form" class="bw-form hidden"><h3>Nuevo cliente / convenio</h3><div class="bw-form-grid"><label>Nombre<input id="bwc-name" required maxlength="180"></label><label>Tipo<select id="bwc-role"><option value="comercio">Comercio</option><option value="proveedor">Proveedor</option><option value="establecimiento">Establecimiento</option><option value="partner">Partner</option><option value="otro">Otro</option></select></label><label>Ciudad<input id="bwc-city" maxlength="120"></label><label>País<input id="bwc-country" maxlength="100" value="Chile"></label></div><label>Contexto<textarea id="bwc-summary" rows="2" maxlength="900" placeholder="Qué relación tenemos y qué queremos probar"></textarea></label><div class="bw-form-actions"><button class="bw-primary" type="submit">Crear borrador</button><button id="bwc-cancel" type="button">Cancelar</button></div></form>',
      '<div id="bw-client-list" class="bw-client-grid">'+(state.clients.length?state.clients.map(c=>{
        const products=state.products.filter(p=>p.client_id===c.id),active=products.filter(p=>p.economic_state==='active').length;
        return '<button class="bw-client-card" type="button" data-client="'+safe(c.id)+'"><div class="bw-client-top"><span class="bw-client-icon">'+safe(c.name?.charAt(0)?.toUpperCase()||'C')+'</span><span class="bw-client-state">'+safe(stageNames[c.relationship_state]||c.relationship_state)+'</span></div><strong>'+safe(c.name)+'</strong><small>'+safe([c.role,c.city].filter(Boolean).join(' · '))+'</small><div class="bw-client-numbers"><span><b>'+products.length+'</b> productos</span><span><b>'+active+'</b> activos</span></div></button>';
      }).join(''):'<div class="bw-empty"><strong>Aún no hay clientes.</strong><span>El primer convenio real que registremos aparecerá aquí; no se crearán fichas ficticias.</span></div>')+'</div>',
    '</section>'
  ].join('');
  $('#bw-close-top').addEventListener('click',close);
  $('#bw-refresh').addEventListener('click',refresh);
  $('#bw-open-director').addEventListener('click',()=>{
    const prompt='Analiza '+state.business.name+' usando solo los datos autorizados de LINK WORLD. Distingue hechos, decisiones pendientes y próximos pasos.';
    close();
    document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt}}));
  });
  if(state.canWrite){
    $('#bw-add-client')?.addEventListener('click',()=>$('#bw-client-form').classList.remove('hidden'));
    $('#bwc-cancel')?.addEventListener('click',()=>$('#bw-client-form').classList.add('hidden'));
    $('#bw-client-form')?.addEventListener('submit',createClientRecord);
  }
  root.querySelectorAll('[data-client]').forEach(b=>b.addEventListener('click',()=>openClient(b.dataset.client)));
}
function renderProduct(p){
  const e=productEconomics(p),profile=profileFor(p.responsibility_profile_id);
  const pColor=resolveEntityColor(p.metadata?.visual_identity||p.owned_facts?.visual_identity||p.visual_identity);
  const split=e.splitKnown?'<div class="bw-split"><span style="--v:'+e.clientShare+'%"><b>Cliente</b><strong>'+e.clientShare+'%</strong></span><span style="--v:'+e.linkShare+'%"><b>LINK</b><strong>'+e.linkShare+'%</strong></span></div>':'<p class="bw-soft">Distribución cliente/LINK todavía sin definir.</p>';
  const blocked=p.economic_state==='blocked'||e.blocked;
  return '<article class="bw-product '+(blocked?'blocked':'')+'"'+colorStyle(pColor)+'>'+
    '<div class="bw-product-head"><div><span class="bw-kicker">'+safe(p.code||p.category||'PRODUCTO')+'</span><h3>'+safe(p.name)+'</h3></div><span class="bw-economic '+safe(p.economic_state)+'">'+(blocked?'Bloqueado':safe(p.economic_state))+'</span></div>'+
    '<div class="bw-product-values"><div><small>Adquisición</small><strong>'+money(p.acquisition_price,p.currency)+'</strong></div><div><small>Precio público</small><strong>'+money(p.public_price,p.currency)+'</strong></div><div><small>Diferencia observada</small><strong>'+money(e.spread,p.currency)+'</strong></div></div>'+
    '<div class="bw-responsibility"><span><small>Responsabilidad</small><strong>'+(profile?safe(profile.label):'Por definir')+'</strong></span><b>'+(p.responsibility_percent==null?'—':safe(p.responsibility_percent)+'%')+'</b></div>'+
    split+
    '<div class="bw-product-logic"><span><small>1 · Adquisición</small><b>'+money(p.acquisition_price,p.currency)+'</b></span><i>→</i><span><small>2 · Responsabilidad LINK</small><b>'+(p.responsibility_percent==null?'Por definir':safe(p.responsibility_percent)+'%')+'</b></span><i>→</i><span><small>3 · Reparto interno</small><b>'+(e.splitKnown?('Cliente '+e.clientShare+'% / LINK '+e.linkShare+'%'):'Por definir')+'</b></span><i>→</i><span><small>4 · Estado</small><b>'+(blocked?'Bloqueado':safe(p.economic_state))+'</b></span></div>'+
    (p.responsibility_notes?'<p class="bw-product-notes"><b>Responsabilidad asumida:</b> '+safe(p.responsibility_notes)+'</p>':'')+
    '<div class="bw-product-foot"><span>Etapa: <b>'+safe(stageNames[p.stage]||p.stage)+'</b></span><span>Mínimo LINK: <b>'+(p.minimum_link_share_percent==null?'—':safe(p.minimum_link_share_percent)+'% de su reparto')+'</b></span></div>'+
    (blocked?'<p class="bw-block-reason">No puede activarse: el reparto actual deja a LINK bajo su mínimo definido.</p>':'')+
  '</article>';
}
function openClient(id){
  state.client=state.clients.find(c=>c.id===id);if(!state.client)return;
  const products=state.products.filter(p=>p.client_id===id);
  const root=$('#bw-content'),active=products.filter(p=>p.economic_state==='active').length,blocked=products.filter(p=>p.economic_state==='blocked'||productEconomics(p).blocked).length;
  root.innerHTML=[
    '<section class="bw-client-head"><div><button id="bw-back-business" class="bw-back" type="button">← '+safe(state.business.name)+'</button><span class="bw-kicker">FICHA DE CLIENTE / '+safe(state.client.role)+'</span><h1>'+safe(state.client.name)+'</h1><p>'+safe(state.client.summary||'Sin contexto adicional registrado.')+'</p><div class="bw-tags"><span>'+safe(stageNames[state.client.relationship_state]||state.client.relationship_state)+'</span><span>'+safe(state.client.agreement_status)+'</span></div></div><button id="bw-client-director" type="button">✦ Revisar con Director</button></section>',
    '<section class="bw-metrics"><div><strong>'+products.length+'</strong><span>Productos</span></div><div><strong>'+active+'</strong><span>Activos</span></div><div><strong>'+blocked+'</strong><span>Bloqueados</span></div><div><strong>'+products.filter(p=>p.stage==='learning'||p.stage==='expanding').length+'</strong><span>Aprendiendo / escalando</span></div></section>',
    '<section class="bw-grid"><article class="bw-panel"><span class="bw-kicker">RELACIÓN</span><h2>Convenio</h2><div class="bw-facts"><span><b>Estado</b>'+safe(state.client.agreement_status)+'</span><span><b>Etapa</b>'+safe(stageNames[state.client.relationship_state]||state.client.relationship_state)+'</span><span><b>Ubicación</b>'+safe([state.client.city,state.client.country].filter(Boolean).join(', ')||'—')+'</span></div></article><article class="bw-panel span-2"><span class="bw-kicker">LECTURA DE ESCALA</span><h2>Productos de este cliente</h2><p>Cada producto conserva su precio de adquisición, nivel de responsabilidad y distribución propia. Así LINK puede crecer sin imponer una economía idéntica a todos.</p></article></section>',
    '<section class="bw-products-section"><div class="bw-section-head"><div><span class="bw-kicker">PRODUCTOS</span><h2>'+safe(state.client.name)+'</h2></div>'+(state.canWrite?'<button id="bw-add-product" class="bw-primary" type="button">+ Nuevo producto</button>':'<span class="bw-open-mode">Modo abierto · cambios desde ChatGPT</span>')+'</div>',
    '<form id="bw-product-form" class="bw-form hidden"><h3>Nuevo producto</h3><div class="bw-form-grid"><label>Producto<input id="bwp-name" maxlength="180" required></label><label>Precio de adquisición<input id="bwp-acquisition" type="number" min="0" step="1" placeholder="Precio entregado por convenio"></label><label>Precio público de referencia<input id="bwp-public" type="number" min="0" step="1" placeholder="Opcional"></label><label>Perfil de responsabilidad<select id="bwp-profile"><option value="">Por definir</option>'+state.profiles.map(p=>'<option value="'+safe(p.id)+'" data-min="'+safe(p.min_percent)+'" data-max="'+safe(p.max_percent)+'">'+safe(p.label)+' · '+safe(p.min_percent)+'%'+(Number(p.max_percent)!==Number(p.min_percent)?'–'+safe(p.max_percent)+'%':'')+'</option>').join('')+'</select></label><label>% responsabilidad LINK<input id="bwp-responsibility" type="number" min="0" max="100" step="1" placeholder="Según perfil"></label><label>% beneficio cliente dentro del 100%<input id="bwp-client-share" type="number" min="0" max="100" step="1" placeholder="Ej. 60"></label><label>% mínimo LINK dentro del 100%<input id="bwp-min-link" type="number" min="0" max="100" step="1" placeholder="Ej. 30"></label><label>Etapa<select id="bwp-stage"><option value="detected">Detectar</option><option value="conversation">Conversar</option><option value="agreed">Acordar</option><option value="active">Activar</option></select></label></div><label>Responsabilidades de LINK<textarea id="bwp-notes" rows="2" maxlength="1000" placeholder="Qué asumimos realmente en este producto"></textarea></label><div id="bwp-preview" class="bw-form-preview">El reparto cliente/LINK se calcula sobre un 100% interno. Aún no define por sí solo el precio final.</div><div class="bw-form-actions"><button class="bw-primary" type="submit">Guardar producto</button><button id="bwp-cancel" type="button">Cancelar</button></div></form>',
    '<div class="bw-product-grid">'+(products.length?products.map(renderProduct).join(''):'<div class="bw-empty"><strong>Sin productos registrados.</strong><span>Agrega únicamente productos cuyo convenio/precio de adquisición conozcamos o estemos negociando.</span></div>')+'</div></section>'
  ].join('');
  $('#bw-back-business').addEventListener('click',renderBusiness);
  $('#bw-client-director').addEventListener('click',()=>{
    const prompt='Revisa el cliente '+state.client.name+' dentro de '+state.business.name+'. Analiza sus productos, responsabilidades, bloqueos y siguiente etapa sin inventar datos.';
    close();
    document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt}}));
  });
  if(state.canWrite){
    $('#bw-add-product')?.addEventListener('click',()=>$('#bw-product-form').classList.remove('hidden'));
    $('#bwp-cancel')?.addEventListener('click',()=>$('#bw-product-form').classList.add('hidden'));
    $('#bwp-profile')?.addEventListener('change',syncResponsibilityRange);
    $('#bwp-client-share')?.addEventListener('input',previewSplit);
    $('#bwp-min-link')?.addEventListener('input',previewSplit);
    $('#bw-product-form')?.addEventListener('submit',createProductRecord);
  }
}
function syncResponsibilityRange(){
  const sel=$('#bwp-profile'),opt=sel.selectedOptions[0],input=$('#bwp-responsibility');
  if(!opt?.value){input.removeAttribute('min');input.setAttribute('min','0');input.setAttribute('max','100');return;}
  input.min=opt.dataset.min;input.max=opt.dataset.max;
  if(opt.dataset.min===opt.dataset.max)input.value=opt.dataset.min;
  previewSplit();
}
function previewSplit(){
  const client=Number($('#bwp-client-share')?.value),min=Number($('#bwp-min-link')?.value);
  const out=$('#bwp-preview');if(!out)return;
  if(!Number.isFinite(client)||client<0||client>100){out.textContent='Define el beneficio del cliente para ver el reparto.';return;}
  const link=100-client,blocked=Number.isFinite(min)&&link<min;
  out.innerHTML='Reparto interno: <b>Cliente '+client+'%</b> · <b>LINK '+link+'%</b>'+(Number.isFinite(min)?' · mínimo LINK '+min+'%':'')+(blocked?' · <strong class="danger">BLOQUEADO</strong>':'');
}
async function createClientRecord(event){
  event.preventDefault();if(state.busy)return;state.busy=true;notice('Creando ficha…');
  try{
    const session=await writeSession(),name=$('#bwc-name').value.trim();
    const slug=(name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'cliente')+'-'+Date.now().toString().slice(-6);
    const {error}=await db.from('link_world_clients').insert({
      business_id:state.business.id,slug,name,role:$('#bwc-role').value,
      city:$('#bwc-city').value.trim()||null,country:$('#bwc-country').value.trim()||null,
      summary:$('#bwc-summary').value.trim()||null,created_by:session.user.id
    });
    if(error)throw error;
    await refresh();
  }catch(e){notice('No se creó el cliente: '+(e.message||e),true);}
  finally{state.busy=false;}
}
async function createProductRecord(event){
  event.preventDefault();if(state.busy)return;state.busy=true;notice('Guardando producto…');
  try{
    const session=await writeSession(),clientShare=$('#bwp-client-share').value===''?null:Number($('#bwp-client-share').value);
    const linkShare=clientShare==null?null:100-clientShare;
    const minimum=$('#bwp-min-link').value===''?null:Number($('#bwp-min-link').value);
    const blocked=linkShare!=null&&minimum!=null&&linkShare<minimum;
    const responsibility=$('#bwp-responsibility').value===''?null:Number($('#bwp-responsibility').value);
    const {error}=await db.from('link_world_products').insert({
      business_id:state.business.id,client_id:state.client.id,name:$('#bwp-name').value.trim(),
      acquisition_price:$('#bwp-acquisition').value===''?null:Number($('#bwp-acquisition').value),
      public_price:$('#bwp-public').value===''?null:Number($('#bwp-public').value),
      responsibility_profile_id:$('#bwp-profile').value||null,responsibility_percent:responsibility,
      client_benefit_share_percent:clientShare,link_share_percent:linkShare,minimum_link_share_percent:minimum,
      stage:$('#bwp-stage').value,economic_state:blocked?'blocked':'proposal',
      responsibility_notes:$('#bwp-notes').value.trim()||null,created_by:session.user.id
    });
    if(error)throw error;
    const clientId=state.client.id;await loadBusiness(state.business.id);state.client=state.clients.find(c=>c.id===clientId);openClient(clientId);
    notice(blocked?'Producto guardado y bloqueado por margen mínimo LINK.':'Producto guardado como propuesta.');
  }catch(e){notice('No se guardó el producto: '+(e.message||e),true);}
  finally{state.busy=false;}
}
async function refresh(){
  if(!state.business)return;
  const businessId=state.business.id,clientId=state.client?.id;
  notice('Sincronizando…');
  try{
    await loadBusiness(businessId);
    if(clientId&&state.clients.some(c=>c.id===clientId)){state.client=state.clients.find(c=>c.id===clientId);openClient(clientId);}
    else renderBusiness();
    notice('');
  }catch(e){notice('No se pudo sincronizar: '+(e.message||e),true);}
}
function close(){
  state.open=false;state.client=null;$('#business-workspace').classList.add('hidden');
  const url=new URL(window.location.href);url.searchParams.delete('business');
  window.history.replaceState({},'',url.pathname+url.search+url.hash);
}
async function openBusiness(id){
  const url=new URL(window.location.href);url.searchParams.set('business',id);
  window.history.replaceState({},'',url.pathname+url.search+url.hash);
  state.open=true;state.client=null;$('#business-workspace').classList.remove('hidden');
  $('#bw-content').innerHTML='<div class="bw-loading">Abriendo ficha real…</div>';
  notice('');
  try{await loadBusiness(id);renderBusiness();}
  catch(e){notice(e.message||'No se pudo abrir la ficha.',true);$('#bw-content').innerHTML='<div class="bw-loading">No pudimos leer esta ficha.</div>';}
}
function mount(){
  if($('#business-workspace'))return;
  const shell=document.createElement('section');shell.id='business-workspace';shell.className='business-workspace hidden';
  shell.innerHTML='<div id="bw-notice" class="bw-notice hidden" role="status"></div><main id="bw-content"></main>';
  document.body.append(shell);
  document.addEventListener('linkworld:open-business',event=>{
    const id=String(event.detail?.id||'');if(id)openBusiness(id);
  });
  const deepLinkBusiness=new URLSearchParams(window.location.search).get('business');
  if(deepLinkBusiness&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(deepLinkBusiness)){
    openBusiness(deepLinkBusiness);
  }
}
export {mount as mountBusinessWorkspace};
