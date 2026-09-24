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
const state={open:false,business:null,clients:[],products:[],profiles:[],client:null,busy:false};

async function member(){
  const {data:{session}}=await db.auth.getSession();
  if(!session)throw new Error('Conecta tu cuenta LINK WORLD para abrir esta ficha.');
  const {data,error}=await db.rpc('link_world_is_member');
  if(error||data!==true)throw new Error('Tu usuario no tiene acceso a este espacio privado.');
  return session;
}
function notice(text,error=false){
  const el=$('#bw-notice');if(!el)return;
  el.textContent=text||'';el.classList.toggle('error',error);el.classList.toggle('hidden',!text);
}
async function loadBusiness(businessId){
  await member();
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
function renderBusiness(){
  state.client=null;
  const f=facts(),m=businessMetrics();
  const identity=Array.isArray(f.identity_words)?f.identity_words:[];
  const caps=Array.isArray(f.capabilities)?f.capabilities:[];
  const cycle=Array.isArray(f.cycle)?f.cycle:['Detectar','Conversar','Acordar','Activar','Registrar','Aprender','Expandir'];
  const rule=f.economic_rule||{};
  const root=$('#bw-content');
  root.innerHTML=[
    '<section class="bw-business-head">',
      '<div><button class="bw-back" id="bw-close-top" type="button">← LINK WORLD</button>',
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
      '<div class="bw-section-head"><div><span class="bw-kicker">ESCALA / CLIENTES</span><h2>Convenios y productos</h2><p>Cada cliente tiene su propia ficha y sus productos. El crecimiento se mide desde aquí.</p></div><button id="bw-add-client" class="bw-primary" type="button">+ Nuevo cliente</button></div>',
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
    document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt:'Analiza '+state.business.name+' usando solo los datos autorizados de LINK WORLD. Distingue hechos, decisiones pendientes y próximos pasos.'}}));
  });
  $('#bw-add-client').addEventListener('click',()=>$('#bw-client-form').classList.remove('hidden'));
  $('#bwc-cancel').addEventListener('click',()=>$('#bw-client-form').classList.add('hidden'));
  $('#bw-client-form').addEventListener('submit',createClientRecord);
  root.querySelectorAll('[data-client]').forEach(b=>b.addEventListener('click',()=>openClient(b.dataset.client)));
}
function renderProduct(p){
  const e=productEconomics(p),profile=profileFor(p.responsibility_profile_id);
  const split=e.splitKnown?'<div class="bw-split"><span style="--v:'+e.clientShare+'%"><b>Cliente</b><strong>'+e.clientShare+'%</strong></span><span style="--v:'+e.linkShare+'%"><b>LINK</b><strong>'+e.linkShare+'%</strong></span></div>':'<p class="bw-soft">Distribución cliente/LINK todavía sin definir.</p>';
  const blocked=p.economic_state==='blocked'||e.blocked;
  return '<article class="bw-product '+(blocked?'blocked':'')+'">'+
    '<div class="bw-product-head"><div><span class="bw-kicker">'+safe(p.code||p.category||'PRODUCTO')+'</span><h3>'+safe(p.name)+'</h3></div><span class="bw-economic '+safe(p.economic_state)+'">'+(blocked?'Bloqueado':safe(p.economic_state))+'</span></div>'+
    '<div class="bw-product-values"><div><small>Adquisición</small><strong>'+money(p.acquisition_price,p.currency)+'</strong></div><div><small>Precio público</small><strong>'+money(p.public_price,p.currency)+'</strong></div><div><small>Diferencia observada</small><strong>'+money(e.spread,p.currency)+'</strong></div></div>'+
    '<div class="bw-responsibility"><span><small>Responsabilidad</small><strong>'+(profile?safe(profile.label):'Por definir')+'</strong></span><b>'+(p.responsibility_percent==null?'—':safe(p.responsibility_percent)+'%')+'</b></div>'+
    split+
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
    '<section class="bw-products-section"><div class="bw-section-head"><div><span class="bw-kicker">PRODUCTOS</span><h2>'+safe(state.client.name)+'</h2></div><button id="bw-add-product" class="bw-primary" type="button">+ Nuevo producto</button></div>',
    '<form id="bw-product-form" class="bw-form hidden"><h3>Nuevo producto</h3><div class="bw-form-grid"><label>Producto<input id="bwp-name" maxlength="180" required></label><label>Precio de adquisición<input id="bwp-acquisition" type="number" min="0" step="1" placeholder="Precio entregado por convenio"></label><label>Precio público de referencia<input id="bwp-public" type="number" min="0" step="1" placeholder="Opcional"></label><label>Perfil de responsabilidad<select id="bwp-profile"><option value="">Por definir</option>'+state.profiles.map(p=>'<option value="'+safe(p.id)+'" data-min="'+safe(p.min_percent)+'" data-max="'+safe(p.max_percent)+'">'+safe(p.label)+' · '+safe(p.min_percent)+'%'+(Number(p.max_percent)!==Number(p.min_percent)?'–'+safe(p.max_percent)+'%':'')+'</option>').join('')+'</select></label><label>% responsabilidad LINK<input id="bwp-responsibility" type="number" min="0" max="100" step="1" placeholder="Según perfil"></label><label>% beneficio cliente dentro del 100%<input id="bwp-client-share" type="number" min="0" max="100" step="1" placeholder="Ej. 60"></label><label>% mínimo LINK dentro del 100%<input id="bwp-min-link" type="number" min="0" max="100" step="1" placeholder="Ej. 30"></label><label>Etapa<select id="bwp-stage"><option value="detected">Detectar</option><option value="conversation">Conversar</option><option value="agreed">Acordar</option><option value="active">Activar</option></select></label></div><label>Responsabilidades de LINK<textarea id="bwp-notes" rows="2" maxlength="1000" placeholder="Qué asumimos realmente en este producto"></textarea></label><div id="bwp-preview" class="bw-form-preview">El reparto cliente/LINK se calcula sobre un 100% interno. Aún no define por sí solo el precio final.</div><div class="bw-form-actions"><button class="bw-primary" type="submit">Guardar producto</button><button id="bwp-cancel" type="button">Cancelar</button></div></form>',
    '<div class="bw-product-grid">'+(products.length?products.map(renderProduct).join(''):'<div class="bw-empty"><strong>Sin productos registrados.</strong><span>Agrega únicamente productos cuyo convenio/precio de adquisición conozcamos o estemos negociando.</span></div>')+'</div></section>'
  ].join('');
  $('#bw-back-business').addEventListener('click',renderBusiness);
  $('#bw-client-director').addEventListener('click',()=>{
    document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt:'Revisa el cliente '+state.client.name+' dentro de '+state.business.name+'. Analiza sus productos, responsabilidades, bloqueos y siguiente etapa sin inventar datos.'}}));
  });
  $('#bw-add-product').addEventListener('click',()=>$('#bw-product-form').classList.remove('hidden'));
  $('#bwp-cancel').addEventListener('click',()=>$('#bw-product-form').classList.add('hidden'));
  $('#bwp-profile').addEventListener('change',syncResponsibilityRange);
  $('#bwp-client-share').addEventListener('input',previewSplit);
  $('#bwp-min-link').addEventListener('input',previewSplit);
  $('#bw-product-form').addEventListener('submit',createProductRecord);
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
    const session=await member(),name=$('#bwc-name').value.trim();
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
    const session=await member(),clientShare=$('#bwp-client-share').value===''?null:Number($('#bwp-client-share').value);
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
}
async function openBusiness(id){
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
}
export {mount as mountBusinessWorkspace};
