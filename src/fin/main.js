import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '../world/connection.js';
import './style.css';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const safe=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const money=(n,c='CLP')=>{
  const x=Number(n||0);
  try{return new Intl.NumberFormat('es-CL',{style:'currency',currency:c,maximumFractionDigits:0}).format(x);}
  catch{return '$'+Math.round(x).toLocaleString('es-CL');}
};
const day=v=>v?new Date(v).toLocaleDateString('es-CL'):'—';
const human=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());

const sections=[
  ['home','Inicio','⌂'],
  ['evolution','Evolución','↗'],
  ['movements','Movimientos','≋'],
  ['billing','Facturación','▤'],
  ['collections','Cobros','↘'],
  ['outflows','Egresos','↗'],
  ['transfers','Transferencias','⇄'],
  ['collaborators','Colaboradores','◎'],
  ['taxes','Impuestos','%'],
  ['reconciliation','Conciliación','✓'],
  ['documents','Comprobantes','□'],
  ['connections','Conexiones','⌁'],
  ['activity','Actividad','◌']
];

const state={
  session:null,canRead:false,
  businesses:[],business:null,
  summary:null,movements:[],roles:[],documents:[],providers:[],taxProfiles:[],lifecycle:null,lifecycleGaps:[],
  section:'home',period:'all',query:'',selectedMovement:null,loading:false
};

function toast(msg,error=false){
  let n=$('#fin-toast');
  if(!n){n=document.createElement('div');n.id='fin-toast';document.body.append(n);}
  n.textContent=msg;n.className=error?'show error':'show';
  setTimeout(()=>n.className='',2400);
}
function syncUrl(){
  const u=new URL(location.href);
  if(state.business)u.searchParams.set('business',state.business.id);
  u.searchParams.set('section',state.section);
  history.replaceState({},'',u);
}
async function auth(){
  const {data:{session}}=await db.auth.getSession();
  state.session=session;
  state.canRead=false;
  if(session){
    const {data}=await db.rpc('link_world_is_member');
    state.canRead=data===true;
  }
}
async function signIn(ev){
  ev.preventDefault();
  const email=$('#login-email').value.trim();
  const password=$('#login-password').value;
  const {error}=await db.auth.signInWithPassword({email,password});
  if(error){toast(error.message,true);return;}
  await boot();
}
async function signOut(){
  await db.auth.signOut();await boot();
}
async function loadBusinesses(){
  const {data,error}=await db.from('link_world_businesses')
    .select('id,global_id,slug,name,sector,country,verification_status')
    .order('name');
  if(error)throw error;
  state.businesses=data||[];
  const params=new URLSearchParams(location.search);
  const wanted=params.get('business');
  state.business=state.businesses.find(x=>x.id===wanted||x.slug===wanted)||state.businesses[0]||null;
}
async function loadFinance(){
  if(!state.business||!state.canRead)return;
  state.loading=true;render();
  const id=state.business.id;
  const [s,m,r,d,p,t,l,g]=await Promise.all([
    db.from('link_fin_real_summary_v').select('*').eq('business_id',id).maybeSingle(),
    db.from('link_fin_real_movements_v').select('*').eq('business_id',id).order('occurred_at',{ascending:false}),
    db.from('link_fin_real_roles_v').select('*').eq('business_id',id).order('role_type'),
    db.from('link_world_documents').select('id,transaction_id,document_type,drive_url,file_name,issue_date,amount,currency,tax_identifier,metadata').eq('business_id',id).order('issue_date',{ascending:false}),
    db.from('link_payment_provider_accounts').select('id,provider,environment,status,webhook_status,external_merchant_id,verified_at,last_webhook_at,last_error,metadata').eq('business_id',id).order('provider'),
    db.from('link_tax_profiles').select('id,profile_key,country_code,tax_treatment,tax_code,tax_rate,document_type,price_includes_tax,status,notes,approved_at').eq('business_id',id).order('valid_from',{ascending:false}),
    db.from('link_fin_business_lifecycle_v').select('*').eq('business_id',id).maybeSingle(),
    db.from('link_fin_business_lifecycle_gaps_v').select('*').eq('business_id',id).order('stage_order')
  ]);
  state.summary=s.error?null:s.data;
  state.movements=m.error?[]:(m.data||[]);
  state.roles=r.error?[]:(r.data||[]);
  state.documents=d.error?[]:(d.data||[]);
  state.providers=p.error?[]:(p.data||[]);
  state.taxProfiles=t.error?[]:(t.data||[]);
  state.lifecycle=l.error?null:l.data;
  state.lifecycleGaps=g.error?[]:(g.data||[]);
  state.selectedMovement=state.movements.find(x=>x.id===state.selectedMovement?.id)||null;
  state.loading=false;
  render();
}
function withinPeriod(row){
  if(state.period==='all')return true;
  const dt=new Date(row.occurred_at||row.issue_date||row.created_at||0);
  const now=new Date(), ms=now-dt;
  return state.period==='7d'?ms<=7*864e5:state.period==='30d'?ms<=30*864e5:state.period==='90d'?ms<=90*864e5:true;
}
function matchQuery(...parts){
  if(!state.query)return true;
  const hay=parts.flat().filter(Boolean).join(' ').toLowerCase();
  return hay.includes(state.query.toLowerCase());
}
function filteredMovements(kind='all'){
  return state.movements.filter(m=>{
    if(!withinPeriod(m))return false;
    if(!matchQuery(m.concept,m.external_reference,m.transaction_type,m.status,m.currency))return false;
    if(kind==='billing')return m.direction==='income';
    if(kind==='collections')return m.direction==='income'&&m.payment_verified;
    if(kind==='outflows')return ['expense','outflow'].includes(m.direction);
    if(kind==='transfers')return /transfer/i.test(m.transaction_type||'')||/transfer/i.test(m.direction||'');
    return true;
  });
}
function roleGroups(){
  const labels={invoice_issuer:'Factura / emite',collector:'Cobra',service_provider:'Presta el servicio',collaborator:'Colaborador',transfer_sender:'Transfiere',transfer_recipient:'Recibe transferencia',tax_authority:'Impuesto / retención'};
  return Object.entries(labels).map(([key,label])=>({key,label,items:state.roles.filter(r=>r.role_type===key)}));
}
function navMarkup(){
  return sections.map(([id,label,icon])=>'<button class="'+(state.section===id?'active':'')+'" data-section="'+id+'"><b>'+icon+'</b><span>'+label+'</span></button>').join('');
}
function shellStart(title,subtitle=''){
  return '<section class="fin-page-head"><div><span class="fin-eyebrow">LINK FIN / '+safe(state.business?.slug||'')+'</span><h1>'+safe(title)+'</h1><p>'+safe(subtitle)+'</p></div><button id="refresh-fin">↻ Actualizar</button></section>';
}
function summaryCards(){
  const s=state.summary||{};
  const pending=Math.max(0,Number(s.income_after_tax||0)-Number(s.income_collected||0));
  return '<div class="fin-kpis">'+
    '<article><span>Facturado</span><strong>'+money(s.income_gross||0)+'</strong><small>'+safe(String(s.evidenced_movements||0))+' respaldos</small></article>'+
    '<article><span>Cobrado verificado</span><strong>'+money(s.income_collected||0)+'</strong><small>'+safe(String(s.verified_cash_movements||0))+' movimientos de caja</small></article>'+
    '<article><span>Pendiente de cobro</span><strong>'+money(pending)+'</strong><small>Facturado líquido sin pago verificado</small></article>'+
    '<article class="net"><span>Neto real</span><strong>'+money(s.net_real||0)+'</strong><small>Solo caja verificada</small></article>'+
  '</div>';
}
function movementTable(rows=state.movements){
  if(!rows.length)return '<div class="fin-empty"><strong>Sin movimientos en esta vista.</strong><span>No se inventan relaciones ni montos sin evidencia.</span></div>';
  return '<div class="fin-table-wrap"><table class="fin-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Estado</th><th>Bruto</th><th>Impuesto</th><th>Caja</th><th></th></tr></thead><tbody>'+
    rows.map(m=>'<tr data-movement="'+safe(m.id)+'" class="'+(state.selectedMovement?.id===m.id?'selected':'')+'">'+
      '<td>'+safe(day(m.occurred_at))+'</td>'+
      '<td><b>'+safe(m.concept||m.transaction_type)+'</b><small>'+safe(m.external_reference||'sin referencia')+'</small></td>'+
      '<td><span class="pill '+(m.payment_verified?'ok':'pending')+'">'+(m.payment_verified?'Cobro verificado':'Solo facturado')+'</span></td>'+
      '<td>'+money(m.gross_amount,m.currency)+'</td>'+
      '<td>'+money(m.tax_amount,m.currency)+'</td>'+
      '<td>'+money(m.payment_verified?m.net_basis_amount:0,m.currency)+'</td>'+
      '<td>›</td>'+
    '</tr>').join('')+'</tbody></table></div>';
}
function movementDetail(){
  const m=state.selectedMovement;
  if(!m)return '<aside class="fin-detail"><div class="fin-empty compact"><strong>Selecciona un movimiento</strong><span>Aquí veremos su trazabilidad, comprobante y estado de caja.</span></div></aside>';
  return '<aside class="fin-detail">'+
    '<div class="detail-head"><div><span>MOVIMIENTO</span><h3>'+safe(m.concept||m.transaction_type)+'</h3></div><button id="close-detail">×</button></div>'+
    '<dl>'+
      '<div><dt>Fecha</dt><dd>'+safe(day(m.occurred_at))+'</dd></div>'+
      '<div><dt>Referencia</dt><dd>'+safe(m.external_reference||'—')+'</dd></div>'+
      '<div><dt>Bruto</dt><dd>'+money(m.gross_amount,m.currency)+'</dd></div>'+
      '<div><dt>Retención / impuesto</dt><dd>'+money(m.tax_amount,m.currency)+'</dd></div>'+
      '<div><dt>Cobrado verificado</dt><dd>'+money(m.payment_verified?m.net_basis_amount:0,m.currency)+'</dd></div>'+
      '<div><dt>Estado</dt><dd>'+safe(m.payment_verified?'Caja verificada':'Cobro no verificado')+'</dd></div>'+
    '</dl>'+
    (m.evidence_url?'<a class="fin-primary-link" target="_blank" rel="noopener noreferrer" href="'+safe(m.evidence_url)+'">Abrir comprobante ↗</a>':'')+
    '<p class="detail-rule">FIN separa documento emitido de dinero efectivamente recibido.</p>'+
  '</aside>';
}
function renderHome(){
  const roles=roleGroups().filter(g=>g.items.length);
  const recent=filteredMovements('all').slice(0,6);
  return shellStart('Mesa financiera','Verdad económica transversal por negocio, con evidencia y trazabilidad.')+
    summaryCards()+
    '<div class="fin-home-grid">'+
      '<article class="fin-panel"><div class="panel-head"><div><span>ESTADO DE CAJA</span><h2>Qué está pasando</h2></div></div>'+
        '<div class="fin-health-row"><b>'+safe(String(state.summary?.evidence_documents||0))+'</b><span>comprobantes enlazados</span></div>'+
        '<div class="fin-health-row"><b>'+safe(String(state.summary?.verified_cash_movements||0))+'</b><span>movimientos de caja verificados</span></div>'+
        '<div class="fin-health-row"><b>'+safe(String(state.providers.filter(x=>x.status==='active').length))+'</b><span>rutas de cobro activas</span></div>'+
      '</article>'+
      '<article class="fin-panel span2"><div class="panel-head"><div><span>RELACIONES REALES</span><h2>Quién hace qué con el dinero</h2></div></div>'+
        (roles.length?'<div class="role-grid">'+roles.map(g=>'<div><small>'+safe(g.label)+'</small>'+g.items.map(x=>'<strong>'+safe(x.party_name)+'</strong>').join('')+'</div>').join('')+'</div>':'<div class="fin-empty compact"><strong>Sin relaciones financieras verificadas.</strong><span>Cuando exista un comprobante que pruebe quién factura, cobra, presta o recibe, aparecerá aquí.</span></div>')+
      '</article>'+
    '</div>'+
    '<section class="fin-panel"><div class="panel-head"><div><span>ÚLTIMOS MOVIMIENTOS</span><h2>Actividad respaldada</h2></div></div>'+movementTable(recent)+'</section>';
}
function renderEvolution(){
  const life=state.lifecycle||{};
  const timeline=Array.isArray(life.timeline)?life.timeline:[];
  const gaps=Array.isArray(state.lifecycleGaps)?state.lifecycleGaps:[];
  const certifiedKeys=new Set(timeline.map(x=>x.stage_key));
  const next=gaps.find(x=>!x.certified&&x.stage_order>Number(life.current_stage_order||0))||gaps.find(x=>!x.certified);
  const stages=gaps.map(stage=>{
    const event=timeline.find(x=>x.stage_key===stage.stage_key);
    const certified=certifiedKeys.has(stage.stage_key);
    return '<article class="fin-life-stage '+(certified?'done':'pending')+'">'+
      '<div class="fin-life-dot">'+(certified?'✓':safe(String(stage.stage_order/10)))+'</div>'+
      '<div><small>'+safe(stage.label)+'</small><strong>'+safe(stage.definition)+'</strong>'+
      '<span>'+(certified?('Certificado · '+safe(day(event?.event_at))):safe(stage.certification_rule))+'</span>'+
      (event?.evidence_note?'<em>'+safe(event.evidence_note)+'</em>':'')+
      '</div>'+
    '</article>';
  }).join('');
  return shellStart('Evolución económica','FIN certifica hechos económicos del negocio desde su ingreso a LINK hasta recurrencia, estabilidad y reproducción.')+
    '<div class="fin-evolution-hero">'+
      '<article><span>ETAPA CERTIFICADA</span><strong>'+safe(life.current_stage_label||'Sin etapa económica certificada')+'</strong><small>'+safe(life.current_stage_at?day(life.current_stage_at):'Aún sin hito suficiente')+'</small></article>'+
      '<article><span>HITOS VERIFICADOS</span><strong>'+safe(String(life.verified_milestones||0))+'</strong><small>Solo hechos respaldados</small></article>'+
      '<article><span>SIGUIENTE GATE</span><strong>'+safe(next?.label||'—')+'</strong><small>'+safe(next?.certification_rule||'No hay un siguiente gate pendiente')+'</small></article>'+
    '</div>'+
    '<section class="fin-panel"><div class="panel-head"><div><span>LÍNEA DE VIDA FIN</span><h2>Nacimiento → negocio → transformación</h2></div></div>'+
      '<div class="fin-life-timeline">'+stages+'</div>'+
    '</section>'+
    '<section class="fin-panel fin-principle"><span>REGLA DE CERTIFICACIÓN</span><h2>FIN certifica lo que ocurrió.</h2><p>Una idea, propuesta o intención no avanza la etapa económica. “Negocio comprobado” exige venta, prestación o entrega, documento y dinero real. Rentabilidad usa ingresos y egresos verificados. Mitosis y meiosis solo nacen desde modelos con trazabilidad de origen.</p></section>';
}

function renderMovements(kind='all',title='Movimientos',subtitle='Todos los movimientos financieros respaldados por evidencia.'){
  const rows=filteredMovements(kind);
  return shellStart(title,subtitle)+summaryCards()+'<div class="fin-work-grid"><section class="fin-panel table-panel">'+movementTable(rows)+'</section>'+movementDetail()+'</div>';
}
function renderCollaborators(){
  const group=roleGroups().find(g=>g.key==='collaborator');
  return shellStart('Colaboradores','Personas o entidades con relación económica demostrada.')+
    '<section class="fin-panel">'+(group?.items.length?'<div class="role-list">'+group.items.map(r=>'<article><div><span>COLABORADOR</span><h3>'+safe(r.party_name)+'</h3></div>'+(r.evidence_url?'<a target="_blank" rel="noopener noreferrer" href="'+safe(r.evidence_url)+'">Evidencia ↗</a>':'')+'</article>').join('')+'</div>':'<div class="fin-empty"><strong>No hay colaboradores económicos verificados.</strong><span>Los nombres conversados pero sin respaldo no entran a FIN.</span></div>')+'</section>';
}
function renderTaxes(){
  return shellStart('Impuestos','Tratamiento tributario y retenciones documentadas.')+
    summaryCards()+
    '<div class="fin-home-grid">'+
      '<article class="fin-panel span2"><div class="panel-head"><div><span>PERFILES TRIBUTARIOS</span><h2>Configuración verificada</h2></div></div>'+
      (state.taxProfiles.length?'<div class="tax-grid">'+state.taxProfiles.map(t=>'<div><small>'+safe(t.country_code||'CL')+' · '+safe(t.status||'')+'</small><strong>'+safe(human(t.tax_treatment||'sin definir'))+'</strong><span>'+safe(String(t.tax_rate??0))+'% · '+safe(human(t.document_type||''))+'</span></div>').join('')+'</div>':'<div class="fin-empty compact"><strong>Sin perfil tributario registrado.</strong></div>')+
      '</article>'+
      '<article class="fin-panel"><span class="big-label">RETENCIONES DOCUMENTADAS</span><strong class="big-number">'+money(state.summary?.taxes||0)+'</strong><p>Este valor proviene de documentos; no se interpreta como egreso bancario hasta que exista el evento correspondiente.</p></article>'+
    '</div>';
}
function renderReconciliation(){
  const invoiced=filteredMovements('billing');
  const unpaid=invoiced.filter(x=>!x.payment_verified);
  const paid=invoiced.filter(x=>x.payment_verified);
  return shellStart('Conciliación','Cruza documento, estado de pago y caja sin asumir que facturación equivale a cobro.')+
    '<div class="fin-reconcile">'+
      '<article><span>1 · DOCUMENTO</span><strong>'+invoiced.length+'</strong><small>facturas / boletas con respaldo</small></article>'+
      '<i>→</i>'+
      '<article><span>2 · COBRO</span><strong>'+paid.length+'</strong><small>pagos verificados</small></article>'+
      '<i>→</i>'+
      '<article><span>3 · PENDIENTES</span><strong>'+unpaid.length+'</strong><small>documentos sin caja comprobada</small></article>'+
    '</div>'+
    '<section class="fin-panel"><div class="panel-head"><div><span>PENDIENTES DE CONCILIAR</span><h2>Facturado, aún no cobrado</h2></div></div>'+movementTable(unpaid)+'</section>';
}
function renderDocuments(){
  const docs=state.documents.filter(d=>withinPeriod(d)&&matchQuery(d.file_name,d.document_type,d.tax_identifier,d.metadata?.service));
  return shellStart('Comprobantes','Documentos financieros persistentes vinculados a la ficha del negocio.')+
    '<section class="fin-panel"><div class="doc-grid">'+(docs.length?docs.map(d=>'<article><span>'+safe(day(d.issue_date))+' · '+safe(human(d.document_type))+'</span><h3>'+safe(d.metadata?.service||d.file_name||'Documento')+'</h3><strong>'+money(d.amount||0,d.currency||'CLP')+'</strong><small>'+safe(d.tax_identifier||'sin folio')+'</small>'+(d.drive_url?'<a target="_blank" rel="noopener noreferrer" href="'+safe(d.drive_url)+'">Abrir en Drive ↗</a>':'')+'</article>').join(''):'<div class="fin-empty"><strong>Sin comprobantes.</strong></div>')+'</div></section>';
}
function renderConnections(){
  return shellStart('Conexiones','Rieles y cuentas de pago conectadas al negocio; no definen por sí solas la economía.')+
    '<section class="fin-panel"><div class="connection-grid">'+(state.providers.length?state.providers.map(p=>'<article><div><span>'+safe(p.provider||'Proveedor')+'</span><h3>'+safe(human(p.environment||''))+'</h3></div><span class="pill '+(p.status==='active'?'ok':'pending')+'">'+safe(human(p.status||''))+'</span><small>Webhook: '+safe(human(p.webhook_status||'sin verificar'))+'</small></article>').join(''):'<div class="fin-empty"><strong>Sin rutas de pago configuradas.</strong></div>')+'</div></section>';
}
function renderActivity(){
  const rows=state.movements.slice(0,50);
  return shellStart('Actividad','Cronología de eventos financieros observables para este negocio.')+
    '<section class="fin-panel"><div class="timeline">'+(rows.length?rows.map(m=>'<article><time>'+safe(day(m.occurred_at))+'</time><i></i><div><strong>'+safe(m.concept||m.transaction_type)+'</strong><span>'+safe(m.payment_verified?'Cobro verificado':'Documento registrado · cobro no verificado')+'</span></div><b>'+money(m.gross_amount,m.currency)+'</b></article>').join(''):'<div class="fin-empty"><strong>Sin actividad financiera.</strong></div>')+'</div></section>';
}
function content(){
  if(state.section==='home')return renderHome();
  if(state.section==='evolution')return renderEvolution();
  if(state.section==='movements')return renderMovements();
  if(state.section==='billing')return renderMovements('billing','Facturación','Boletas y facturas respaldadas, separadas de la caja.');
  if(state.section==='collections')return renderMovements('collections','Cobros','Solo dinero cuyo pago está verificado.');
  if(state.section==='outflows')return renderMovements('outflows','Egresos','Pagos y salidas de dinero respaldados.');
  if(state.section==='transfers')return renderMovements('transfers','Transferencias','Movimientos entre partes con trazabilidad.');
  if(state.section==='collaborators')return renderCollaborators();
  if(state.section==='taxes')return renderTaxes();
  if(state.section==='reconciliation')return renderReconciliation();
  if(state.section==='documents')return renderDocuments();
  if(state.section==='connections')return renderConnections();
  return renderActivity();
}
function authMarkup(){
  return '<main class="fin-auth"><img src="/link-world-mark.svg" alt="LINK"><span>LINK FIN</span><h1>Mesa financiera transversal</h1><p>Ingresa con una cuenta miembro de LINK para consultar datos financieros.</p><form id="login-form"><input id="login-email" type="email" placeholder="Correo" required><input id="login-password" type="password" placeholder="Contraseña" required><button>Ingresar</button></form><a href="/">← Volver a LINK WORLD</a></main>';
}
function render(){
  const root=$('#app');
  if(!state.canRead){root.innerHTML=authMarkup();$('#login-form')?.addEventListener('submit',signIn);return;}
  root.innerHTML='<div class="fin-shell">'+
    '<aside class="fin-sidebar">'+
      '<a class="fin-brand" href="/"><img src="/link-world-mark.svg" alt=""><div><strong>LINK FIN</strong><span>Financial workspace</span></div></a>'+
      '<div class="fin-business-picker"><label>NEGOCIO</label><select id="business-select">'+state.businesses.map(b=>'<option value="'+b.id+'" '+(state.business?.id===b.id?'selected':'')+'>'+safe(b.name)+'</option>').join('')+'</select></div>'+
      '<nav>'+navMarkup()+'</nav>'+
      '<div class="sidebar-bottom"><a href="/">← LINK WORLD</a><button id="logout">Salir</button></div>'+
    '</aside>'+
    '<main class="fin-main">'+
      '<header class="fin-toolbar"><div class="search-wrap"><input id="fin-search" value="'+safe(state.query)+'" placeholder="Buscar concepto, folio, movimiento…"></div>'+
        '<div class="periods">'+[['7d','7 días'],['30d','30 días'],['90d','90 días'],['all','Todo']].map(([v,l])=>'<button class="'+(state.period===v?'active':'')+'" data-period="'+v+'">'+l+'</button>').join('')+'</div>'+
      '</header>'+
      '<div class="fin-content">'+(state.loading?'<div class="fin-loading">Actualizando FIN…</div>':content())+'</div>'+
    '</main>'+
  '</div>';

  $('#business-select')?.addEventListener('change',async e=>{state.business=state.businesses.find(x=>x.id===e.target.value);state.selectedMovement=null;syncUrl();await loadFinance();});
  $('#logout')?.addEventListener('click',signOut);
  $('#refresh-fin')?.addEventListener('click',loadFinance);
  $('#fin-search')?.addEventListener('input',e=>{state.query=e.target.value;render();$('#fin-search')?.focus();});
  $$('[data-period]').forEach(b=>b.addEventListener('click',()=>{state.period=b.dataset.period;render();}));
  $$('[data-section]').forEach(b=>b.addEventListener('click',()=>{state.section=b.dataset.section;state.selectedMovement=null;syncUrl();render();}));
  $$('[data-movement]').forEach(row=>row.addEventListener('click',()=>{state.selectedMovement=state.movements.find(x=>x.id===row.dataset.movement)||null;render();}));
  $('#close-detail')?.addEventListener('click',()=>{state.selectedMovement=null;render();});
}
async function boot(){
  try{
    await auth();
    if(state.canRead){
      await loadBusinesses();
      const req=new URLSearchParams(location.search).get('section');
      if(req&&sections.some(x=>x[0]===req))state.section=req;
      await loadFinance();
    }else render();
  }catch(e){console.error(e);toast(e.message||'No se pudo abrir LINK FIN',true);render();}
}
boot();
