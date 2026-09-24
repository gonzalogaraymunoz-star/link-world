import { flyGoogle, startGoogleWorld } from './googleMaps.js';
import { mountWorldBridge } from './world/bridge.js';
import './world/bridge.css';
import { mountDirector } from './ai/directorChat.js';
import './ai/chat.css';
import { DEMO_CELLS, DEMO_STEPS, STRATEGIES, createDemoEngine, demoProjection } from './domain/demoWorld.js';
import './style.css';
import './world-ui.css';
import './responsive.css';

const $ = selector => document.querySelector(selector);
const cellById = id => DEMO_CELLS.find(cell => cell.id === id);
const safe = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let view='world', strategy='demand', selectedCell=null, selectedPlace=null, selectedRelation=null, contextOpen=true, activityOpen=false;
let state;
const demo=createDemoEngine(next=>{state=next;renderAll();});
state=demo.get();
$('#app').innerHTML=[
'<div class="shell new-shell">',
' <header class="topbar"><a class="brand" href="/" aria-label="LINK WORLD"><span class="brandmark">L<span class="brand-dot">•</span></span><span><strong>LINK WORLD</strong><small>Territorio · capacidades · conexiones</small></span></a>',
'  <span class="header-territory" id="header-territory">SAN PEDRO DE ATACAMA / ORGANISMO LINK</span>',
'  <div class="header-actions"><span class="state-pill">● DEMO GUIADA</span><button id="theme-switch" class="header-button" type="button" aria-label="Cambiar tema">◐</button><button id="context-toggle" class="header-button" type="button" aria-label="Mostrar u ocultar contexto" aria-expanded="true">☷</button><a class="repo-link" href="https://github.com/gonzalogaraymunoz-star/link-world" target="_blank" rel="noopener noreferrer">CÓDIGO ↗</a></div></header>',
' <aside class="sidebar"><div class="side-label">PERSPECTIVA</div><div class="mode-menu" role="group" aria-label="Cambiar perspectiva">',
'  <button class="mode active" data-mode="world" type="button"><span class="mode-icon">◎</span><span>Mundo<small>Explorar territorio</small></span><span class="mode-key">01</span></button>',
'  <button class="mode" data-mode="organism" type="button"><span class="mode-icon">⬡</span><span>Organismo<small>Inspeccionar células</small></span><span class="mode-key">02</span></button>',
'  <button class="mode" data-mode="constellation" type="button"><span class="mode-icon">⌁</span><span>Constelación<small>Relaciones y tejidos</small></span><span class="mode-key">03</span></button></div>',
' <div class="side-rule"></div><div class="side-label">7 ESTRATEGIAS <span>elige una lente</span></div><div id="strategy-list" class="strategy-list"></div>',
' <div class="side-rule"></div><div class="side-label">TERRITORIOS</div><div class="territory-list">',
'  <button class="place active" data-location="atacama" type="button"><span class="place-pin">⌖</span><span>San Pedro de Atacama<small>Chile · origen</small></span><span>↗</span></button>',
'  <button class="place" data-location="saopaulo" type="button"><span class="place-pin">⌖</span><span>São Paulo<small>Brasil · expansión</small></span><span>↗</span></button>',
'  <button class="place" data-location="earth" type="button"><span class="place-pin">◎</span><span>Ver planeta<small>Perspectiva global</small></span><span>↗</span></button></div>',
' <div class="sidebar-grow"></div><div class="status-panel"><span class="status-title">FUENTES Y VERDAD</span><div class="status-row"><span class="status-light ok"></span> LINK · Demo aislada</div><div class="status-row"><span class="status-light" id="imagery-light"></span><span id="imagery-status">Google Maps · comprobando…</span></div><div class="status-row"><span id="places-light" class="status-light off"></span><span id="places-status">Google Places · bajo demanda</span></div><div class="status-row"><span class="status-light off"></span> Operaciones · no conectadas</div></div><div class="sidebar-foot">DATOS REALES ≠ SIMULACIÓN</div></aside>',
' <main class="workspace" aria-label="Vista principal"><div id="cesiumContainer" aria-label="Mapa de Google del territorio"></div><div class="map-shade"></div>',
'  <div class="world-heading"><div class="eyebrow" id="scene-kicker">01 / TERRITORIO</div><h1 id="scene-title">Observa el territorio.</h1><p id="scene-subtitle">Negocios reales de Google; decisiones propias de LINK.</p></div>',
'  <div class="view-controls"><button data-location="atacama" type="button">SAN PEDRO ↗</button><button data-location="earth" type="button">PLANETA ◉</button></div>',
'  <div class="world-caption"><span class="tiny-circle"></span><span id="city-label">SAN PEDRO DE ATACAMA · CHILE</span><span class="caption-divider">/</span><span>GOOGLE MAPS · NO EN VIVO</span></div>',
'  <section id="mode-layer" class="mode-layer hidden" aria-live="polite"></section><div class="notice">Google: lugares externos; LINK: demostración. No hay operaciones conectadas.</div></main>',
' <aside class="context-pane" id="context-pane" aria-label="Contexto y decisiones"><div class="context-head"><div><span class="eyebrow">CONTEXTO / DECISIÓN</span><h2 id="context-heading">Tu siguiente decisión.</h2></div><button id="close-context" class="context-close" type="button" aria-label="Cerrar contexto">×</button></div><div class="context-content" id="context-content"></div><div class="context-footer">◌ Google: externo &nbsp; · &nbsp; ⬡ LINK: DEMO</div></aside>',
' <section class="mission-bar" aria-label="Misión estratégica DEMO"><div class="mission-overline"><span>◉ MISIÓN / DEMO GUIADA</span><span id="mission-step-count">PASO 1 DE 6</span></div><div class="mission-row"><div class="mission-intro"><h2 id="mission-title">Una necesidad activa una célula.</h2><p id="mission-explain">Ejercicio ficticio: un huésped solicita una experiencia.</p></div><div class="mission-controls"><div id="mission-actions" class="mission-actions"></div><button id="activity-toggle" class="secondary-action" type="button">Memoria ↗</button></div></div><div id="mission-progress" class="mission-progress" aria-label="Etapas de misión"></div><div id="mission-note" class="mission-note" role="status"></div></section>',
' <section class="activity-panel hidden" id="activity-panel" aria-label="Memoria de demostración"><div class="activity-head"><div><span class="eyebrow">CORTEZA / MEMORIA</span><h2>Historial de esta partida</h2></div><button id="activity-close" type="button">Cerrar ×</button></div><div id="activity-content"></div></section>',
'</div>'
].join('');

function renderStrategies(){
  $('#strategy-list').innerHTML=STRATEGIES.map((s,i)=>'<button type="button" class="strategy '+(s.id===strategy?'active':'')+'" data-strategy="'+s.id+'"><span class="strategy-num">'+(i+1)+'</span><span><strong>'+s.name+'</strong><small>'+s.short+'</small></span><span class="strategy-arrow">↗</span></button>').join('');
  document.querySelectorAll('[data-strategy]').forEach(b=>b.addEventListener('click',()=>{strategy=b.dataset.strategy;selectedCell=null;selectedPlace=null;selectedRelation=null;renderStrategies();renderContext();toggleContext(true);}));
}
function renderContext(){
  const cell=cellById(selectedCell), lens=STRATEGIES.find(s=>s.id===strategy), p=demoProjection(state);
  let title='Tu siguiente decisión.',html='';
  if(selectedPlace){
    title='Negocio encontrado.';
    html='<span class="source-tag google">GOOGLE PLACES / FUENTE EXTERNA</span><h3>'+safe(selectedPlace.name)+'</h3><p>'+safe(selectedPlace.address)+'</p>'+
      '<div class="source-disclaimer">Un lugar encontrado no es una célula LINK, un cliente, un aliado ni demanda verificada.</div>'+
      (selectedPlace.uri?'<a class="context-cta" href="'+safe(selectedPlace.uri)+'" target="_blank" rel="noopener noreferrer">Abrir Google Maps ↗</a>':'')+
      '<button type="button" class="quiet-btn" data-context-action="clear">Volver a LINK</button>';
  }else if(cell){
    title=cell.name;
    html='<span class="source-tag demo">CÉLULA DE REFERENCIA · DEMO</span><div class="cell-portrait" style="--accent:'+cell.color+'">'+cell.monogram+'</div><h3>'+cell.name+'</h3><p>'+cell.purpose+'</p>'+
      '<div class="context-section"><span class="eyebrow">GENES / CAPACIDADES DE REFERENCIA</span><div class="gene-list">'+cell.genes.map(g=>'<span class="gene">'+g+'</span>').join('')+'</div></div>'+
      '<div class="context-section"><span class="eyebrow">ORGÁNULOS · NO VERIFICADOS</span>'+cell.organelles.map(o=>'<div class="mini-row">↗ '+o+'</div>').join('')+'</div>'+
      '<div class="context-section"><span class="eyebrow">MISIÓN</span><p>'+safe(p.mission)+' · '+safe(p.next)+'</p></div>'+
      '<button type="button" class="context-cta" data-context-action="mission">Ver misión DEMO ↗</button><button type="button" class="quiet-btn" data-context-action="clear">Cerrar ficha</button>';
  }else{
    html='<span class="source-tag demo">DEMO GUIADA · SIN DATOS COMERCIALES</span><p>Google permite observar lugares. LINK coordina decisiones, capacidades, cooperación y memoria propia.</p>'+
      '<div class="focus-card"><span class="eyebrow">LENTE ESTRATÉGICA</span><h3>'+lens.name+'</h3><p>'+lens.detail+'</p></div>'+
      '<div class="context-section"><span class="eyebrow">ESTADO DE LA MISIÓN</span><div class="mini-row"><span>Oportunidad</span><strong>'+safe(p.opportunity)+'</strong></div><div class="mini-row"><span>Sinapsis</span><strong>'+safe(p.relation)+'</strong></div><div class="mini-row"><span>Evidencia</span><strong>'+safe(p.evidence)+'</strong></div></div>'+
      '<div class="context-section"><span class="eyebrow">CÉLULAS DE REFERENCIA</span><div class="context-cell-list">'+DEMO_CELLS.map(c=>'<button type="button" data-cell="'+c.id+'"><span class="tiny-cell" style="--accent:'+c.color+'">'+c.monogram+'</span>'+c.name+' ↗</button>').join('')+'</div></div>';
  }
  $('#context-heading').textContent=title;$('#context-content').innerHTML=html;
  $('#context-content').querySelectorAll('[data-cell]').forEach(b=>b.addEventListener('click',()=>selectCell(b.dataset.cell)));
  $('#context-content').querySelectorAll('[data-context-action]').forEach(b=>b.addEventListener('click',()=>{
    if(b.dataset.contextAction==='clear'){selectedCell=null;selectedPlace=null;renderContext();}
    if(b.dataset.contextAction==='mission'){selectedCell=null;setMode('world');renderContext();$('#mission-actions button')?.focus();}
  }));
}
function openDirector(prompt){
  toggleContext(false);
  document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt}}));
}
function openBridgeRequest(title,instruction){
  toggleContext(false);
  document.dispatchEvent(new CustomEvent('linkworld:bridge-request',{detail:{title,instruction}}));
}
function selectCell(id){
  selectedPlace=null;selectedRelation=null;selectedCell=selectedCell===id?null:id;
  renderContext();if(view!=='world')renderMode();toggleContext(true);
}
function selectRelation(fromId,toId,index){
  selectedPlace=null;selectedCell=null;selectedRelation={fromId,toId,index:Number(index)||0};
  renderContext();toggleContext(true);
}
function renderMission(){
  const p=demoProjection(state),n=p.stage;
  const narratives=[
    ['Observa una necesidad.','Caso ficticio: un huésped solicita una experiencia turística. No existe reserva.'],
    ['¿Cómo responderías?','Una oportunidad puede generar alternativas, no una venta automática.'],
    ['Coordinar exige capacidad.','Una sinapsis propuesta no equivale a un acuerdo ni disponibilidad.'],
    ['Actuar requiere condiciones.','Simular una ejecución no modifica ningún sistema operativo real.'],
    ['¿Qué puede aprender LINK?','El resultado es ficticio: registra un aprendizaje DEMO.'],
    ['El ciclo vuelve a comenzar.','Prueba otra decisión o explora negocios reales sobre el mapa.']
  ];
  $('#mission-step-count').textContent='PASO '+Math.min(n+1,6)+' DE 6';
  $('#mission-title').textContent=narratives[n][0];$('#mission-explain').textContent=narratives[n][1];
  const actions=n===0?[['observe','Registrar hipótesis DEMO','primary']]
    : n===1?[['coordinate','Proponer coordinación','primary'],['defer','Reprogramar','secondary'],['decline','No intervenir','secondary']]
    : n===2&&state.decision==='defer'?[['revise','Revisar opciones','primary'],['reset','Reiniciar','secondary']]
    : n===2?[['simulate_availability','Simular disponibilidad','primary'],['reset','Reiniciar','secondary']]
    : n===3?[['simulate_execution','Simular ejecución','primary'],['reset','Reiniciar','secondary']]
    : n===4?[['record_lesson','Proponer aprendizaje','primary'],['reset','Reiniciar','secondary']]
    :[['reset','Nueva partida DEMO','primary']];
  $('#mission-actions').innerHTML=actions.map(([a,t,k])=>'<button type="button" class="mission-action '+k+'" data-demo-action="'+a+'">'+t+'</button>').join('');
  $('#mission-actions').querySelectorAll('[data-demo-action]').forEach(b=>b.addEventListener('click',()=>{
    const result=demo.dispatch(b.dataset.demoAction);
    if(!result.ok)$('#mission-note').textContent=result.error;
  }));
  $('#mission-progress').innerHTML=DEMO_STEPS.map((s,i)=>'<span class="step '+(i<n?'done':i===n?'current':'')+'"><i>'+(i<n?'✓':i+1)+'</i><span>'+s+'</span></span>').join('');
  $('#mission-note').textContent=p.blocked?'BLOQUEO DEMO · '+p.blocked:state.finished?
    'Partida finalizada. No se ha registrado ninguna operación real.':'SIMULACIÓN · No registra ventas, reservas, pagos o acuerdos reales.';
}
function renderActivity(){
  const e=demoProjection(state).events;
  $('#activity-content').innerHTML=e.length?e.map((v,i)=>'<article class="event-line"><span class="event-index">'+String(i+1).padStart(2,'0')+'</span><div><strong>'+safe(v.label)+'</strong><small>'+safe(v.source)+' · '+safe(v.verification_state)+'</small></div></article>').reverse().join(''):'<p class="empty-copy">Todavía no hay eventos. Cada decisión DEMO aparecerá aquí.</p>';
}
function renderOrganism(){
  const p=demoProjection(state);
  return '<div class="editorial-board"><div class="eyebrow">02 / ORGANISMO · DEMO</div><h2>Un ADN. Varias células.</h2><p>Elige una célula. Las capacidades son referencias: no implican sistemas conectados.</p><div class="cell-board">'+DEMO_CELLS.map(c=>'<button type="button" class="board-cell" data-cell="'+c.id+'" style="--accent:'+c.color+'"><span class="board-monogram">'+c.monogram+'</span><strong>'+c.name+'</strong><small>'+c.sector+'</small><em>Explorar ↗</em></button>').join('')+'</div><div class="board-rule"><strong>Estado de esta DEMO</strong><span>Oportunidad: '+safe(p.opportunity)+' · Misión: '+safe(p.mission)+'</span></div></div>';
}
function renderConstellation(){
  const p=demoProjection(state);
  return '<div class="editorial-board"><div class="eyebrow">03 / CONSTELACIÓN · DEMO</div><h2>Las conexiones tienen estados.</h2><p>Una línea conceptual no demuestra un convenio ni una operación.</p><div class="connections-board">'+
    [['hotel','lama'],['hotel','taxi'],['hotel','wellness']].map(([a,b],i)=>{
      const c=cellById(a),d=cellById(b);
      return '<button type="button" class="connection-row" data-relation-from="'+a+'" data-relation-to="'+b+'" data-relation-index="'+i+'"><span class="small-cell" style="--accent:'+c.color+'">'+c.monogram+'</span><span class="connection-names">'+c.name+' <b>→</b> '+d.name+'<small>'+(i===0?safe(p.relation):'conceptual')+' · DEMO</small><em>Explorar relación ↗</em></span><span class="small-cell" style="--accent:'+d.color+'">'+d.monogram+'</span></button>';
    }).join('')+'</div><p class="board-caption">Las sinapsis reales exigirán acuerdos, permisos y evidencia autorizada.</p></div>';
}
function renderMode(){
  const layer=$('#mode-layer');layer.classList.toggle('hidden',view==='world');
  if(view==='world'){layer.replaceChildren();return;}
  layer.innerHTML=view==='organism'?renderOrganism():renderConstellation();
  layer.querySelectorAll('[data-cell]').forEach(b=>b.addEventListener('click',()=>selectCell(b.dataset.cell)));
  layer.querySelectorAll('[data-relation-from]').forEach(b=>b.addEventListener('click',()=>selectRelation(b.dataset.relationFrom,b.dataset.relationTo,b.dataset.relationIndex)));
}
function setMode(next){
  view=next;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===next));
  const t={world:['01 / TERRITORIO','Observa el territorio.','Negocios reales de Google; decisiones propias de LINK.'],
    organism:['02 / ORGANISMO','Inspecciona las células.','Capacidades de referencia hasta conectar fuentes autorizadas.'],
    constellation:['03 / CONSTELACIÓN','Comprende las relaciones.','Una conexión propuesta no equivale a una operación real.']};
  $('#scene-kicker').textContent=t[next][0];$('#scene-title').textContent=t[next][1];$('#scene-subtitle').textContent=t[next][2];renderMode();
}
function renderAll(){renderContext();renderMission();renderActivity();if(view!=='world')renderMode();}
function toggleContext(open){contextOpen=open;document.body.classList.toggle('context-collapsed',!open);$('#context-toggle').setAttribute('aria-expanded',String(open));}
renderStrategies();renderAll();
const mobileLayout=window.matchMedia('(max-width:900px)');
if (mobileLayout.matches) toggleContext(false);
mobileLayout.addEventListener?.('change',event=>{
  if(event.matches) toggleContext(false);
});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelectorAll('[data-location]').forEach(b=>b.addEventListener('click',()=>{
  setMode('world');flyGoogle(b.dataset.location);
  $('#header-territory').textContent=(b.dataset.location==='saopaulo'?'SÃO PAULO':b.dataset.location==='earth'?'PLANETA':'SAN PEDRO DE ATACAMA')+' / ORGANISMO LINK';
}));
$('#theme-switch').addEventListener('click',()=>document.body.classList.toggle('link-dark'));
$('#context-toggle').addEventListener('click',()=>toggleContext(!contextOpen));
$('#close-context').addEventListener('click',()=>toggleContext(false));
$('#activity-toggle').addEventListener('click',()=>{activityOpen=!activityOpen;$('#activity-panel').classList.toggle('hidden',!activityOpen);});
$('#activity-close').addEventListener('click',()=>{activityOpen=false;$('#activity-panel').classList.add('hidden');});
document.addEventListener('linkworld:place-selected',event=>{
  const detail=event.detail||{};selectedPlace={name:detail.name||'Lugar de Google',address:detail.address||'',uri:detail.uri||''};
  selectedCell=null;selectedRelation=null;toggleContext(true);renderContext();
});
mountDirector(() => ({
  strategy: STRATEGIES.find(s=>s.id===strategy)?.name || '',
  cell: cellById(selectedCell)?.name || '',
  mission: demoProjection(state).mission+' (DEMO, no comprobada)',
  demoSnapshot: JSON.stringify({
    source:'DEMO FICTICIA · NO SON FICHAS EMPRESARIALES',
    cells:DEMO_CELLS.map(({id,name,sector,purpose,genes,organelles})=>({id,name,sector,purpose,genes,organelles})),
    mission:demoProjection(state),note:'No equivale a reservas, acuerdos, datos verificados ni estado de Supabase.'
  }).slice(0,3200)
}));
mountWorldBridge();
startGoogleWorld(()=>flyGoogle('atacama'));
