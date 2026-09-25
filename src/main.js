// deploy: director-link-expert-v1
// LINK WORLD: real data first. No DEMO cells or simulated mission in active UI.
import {flyGoogle,startGoogleWorld,setLinkBusinesses,flyToLinkBusiness} from './googleMaps.js';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './world/connection.js';
import {mountDirector} from './ai/directorChat.js';
import {mountBusinessWorkspace} from './world/businessWorkspace.js';
import './style.css';
import './world/bridge.css';
import './ai/chat.css';
import './world/businessWorkspace.css';
import './simple.css';
import './brand.css';
import './territory-responsive.css';

const $=s=>document.querySelector(s);
const publicDb=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const state={map:false,connected:true,businesses:[],requests:[],relations:[]};
$('#app').innerHTML=[
"<div class='lw-app'>",
"<header class='lw-app-header'>",
"<a href='/' class='lw-app-brand'><span class='lw-brand-symbol' aria-hidden='true'><img src='/link-world-mark.svg' alt=''></span><span><strong>LINK WORLD</strong><small>El mundo de tus negocios</small></span></a>",
"<nav class='lw-app-nav' aria-label='Espacios de trabajo'><button class='active' data-view='businesses'>Negocios</button><button data-view='territory'>Territorio</button><button data-view='director'>Director IA</button></nav>",
"<span class='lw-app-state' id='lw-app-state'>Modo abierto</span>",
"<div class='header-actions' id='lw-hidden-triggers'></div></header>",
"<main class='lw-main'>",
"<section id='lw-businesses' class='lw-home'>",
"<div class='lw-home-hero'><div><span class='lw-kicker'>TU ESPACIO DE TRABAJO</span><h1>Construyamos con lo que existe.</h1><p>Negocios reales, sin puerta de acceso. Los cambios los hacemos desde ChatGPT por ahora.</p></div><button id='lw-new-business' class='lw-btn-primary'>✦ Trabajar con ChatGPT</button></div>",
"<div class='lw-overview'><div><strong id='lw-business-count'>—</strong><span>Negocios</span></div><div><strong id='lw-request-count'>—</strong><span>Solicitudes</span></div><div><strong id='lw-relation-count'>—</strong><span>Relaciones</span></div></div>",
"<section class='lw-owned-section'><div class='lw-section-head'><div><span class='lw-kicker'>FUENTE DE VERDAD / LINK</span><h2>Tus negocios</h2></div><button id='lw-sync' class='lw-btn-secondary'>↻ Sincronizar</button></div>",
"<p class='lw-data-state' id='lw-data-state' role='status'>Cargando negocios abiertos de LINK WORLD…</p><div id='lw-real-businesses' class='lw-business-grid'></div></section>",
"<section class='lw-next-actions'><button id='lw-open-bridge'><span>01</span><strong>Panel de negocios</strong><small>Entrar a los negocios de LINK WORLD ↗</small></button><button data-view='territory'><span>02</span><strong>Explorar territorio</strong><small>Google Maps bajo demanda ↗</small></button><button data-view='director'><span>03</span><strong>Conversar con Director</strong><small>Trabajar sobre LINK WORLD ↗</small></button></section>",
"<p class='lw-boundary'>Google Maps permite observar negocios externos. Solo los datos propios que registremos con autorización forman parte de LINK.</p>",
"</section>",
"<section id='lw-territory' class='lw-territory hidden'>",
"<div id='lw-orientation-gate' class='lw-orientation-gate hidden' aria-live='polite'><div class='lw-orientation-card'><span class='lw-orientation-device' aria-hidden='true'></span><span class='lw-kicker'>TERRITORIO · MODO HORIZONTAL</span><h2>Gira tu dispositivo.</h2><p>Territorio es un tablero espacial. En teléfono o tablet funciona mejor en horizontal para conservar mapa, búsqueda y contexto como en el ordenador.</p><div class='lw-orientation-actions'><button id='lw-landscape-mode' type='button'>Activar modo horizontal</button><button id='lw-portrait-bypass' class='lw-orientation-skip' type='button'>Continuar en vertical</button></div><small id='lw-orientation-note'>Si el navegador no puede girar la pantalla automáticamente, gírala manualmente.</small></div></div>",
"<div class='lw-territory-top'><div><span class='lw-kicker'>TERRITORIO / GOOGLE + LINK</span><h1>Nuestros negocios sobre el territorio real.</h1><p>Los negocios LINK vinculados aparecen automáticamente. Google completa datos en vivo; las búsquedas externas se ejecutan solo cuando pulses Buscar.</p></div><div class='lw-map-locations'><button data-location='atacama'>San Pedro</button><button data-location='saopaulo'>São Paulo</button><button data-location='earth'>Planeta</button></div></div>",
"<div class='workspace lw-map-workspace'><div id='cesiumContainer' aria-label='Mapa de Google'></div><div id='lw-place-card' class='lw-place-card hidden' role='status'></div><div class='notice'>Google Maps no muestra imágenes en vivo. Un resultado externo no es un negocio registrado en LINK.</div></div>",
"<div class='lw-map-foot'><span id='imagery-status'>Google Maps · se abre al entrar en Territorio</span><span id='places-status'>Google Places · bajo demanda</span><span id='city-label'>SAN PEDRO DE ATACAMA · CHILE</span></div></section>",
"</main></div>"
].join('');

let territoryPortraitBypass=false;
let territoryOrientationOwned=false;
let territoryFullscreenOwned=false;

function isPortableTerritoryDevice(){
  const coarse=window.matchMedia?.('(pointer: coarse)').matches;
  return Boolean(coarse&&Math.min(window.innerWidth,window.innerHeight)<=1100);
}
function isPortraitViewport(){
  return window.innerHeight>window.innerWidth;
}
function syncTerritoryOrientation(){
  const territory=$('#lw-territory'),gate=$('#lw-orientation-gate');
  if(!territory||!gate)return;
  const visible=!territory.classList.contains('hidden');
  const portable=visible&&isPortableTerritoryDevice();
  const portrait=portable&&isPortraitViewport();
  if(portable&&!portrait)territoryPortraitBypass=false;
  const gated=portrait&&!territoryPortraitBypass;
  gate.classList.toggle('hidden',!gated);
  territory.classList.toggle('lw-landscape-board',portable&&!portrait);
  document.body.classList.toggle('lw-territory-portrait-gated',gated);
}
async function requestTerritoryLandscape(){
  territoryPortraitBypass=false;
  const note=$('#lw-orientation-note');
  let locked=false;
  try{
    if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
      await document.documentElement.requestFullscreen({navigationUI:'hide'});
      territoryFullscreenOwned=true;
    }
  }catch{}
  try{
    if(screen.orientation?.lock){
      await screen.orientation.lock('landscape');
      territoryOrientationOwned=true;
      locked=true;
    }
  }catch{}
  if(note){
    note.textContent=locked
      ?'Modo horizontal activo.'
      :'Tu navegador no puede girar la pantalla automáticamente. Gira el dispositivo para entrar al Territorio.';
  }
  setTimeout(syncTerritoryOrientation,120);
}
function releaseTerritoryOrientation(){
  if(territoryOrientationOwned){
    try{screen.orientation?.unlock?.();}catch{}
    territoryOrientationOwned=false;
  }
  if(territoryFullscreenOwned&&document.fullscreenElement){
    try{
      const result=document.exitFullscreen?.();
      result?.catch?.(()=>{});
    }catch{}
  }
  territoryFullscreenOwned=false;
  document.body.classList.remove('lw-territory-portrait-gated');
}

async function loadOpenWorld(){
  $('#lw-data-state').textContent='Sincronizando LINK WORLD…';
  const {data,error}=await publicDb.from('link_world_businesses')
    .select('id,slug,name,sector,city,country,summary,verification_status,public_workspace,google_place_id,owned_facts')
    .eq('public_workspace',true).order('name',{ascending:true});
  if(error){
    $('#lw-data-state').textContent='No se pudo abrir LINK WORLD: '+error.message;
    return;
  }
  state.connected=true;state.businesses=data||[];state.requests=[];state.relations=[];
  setLinkBusinesses(state.businesses);
  $('#lw-app-state').textContent='Modo abierto';
  $('#lw-business-count').textContent=String(state.businesses.length);
  $('#lw-request-count').textContent='—';
  $('#lw-relation-count').textContent='—';
  $('#lw-data-state').textContent=state.businesses.length?
    'Selecciona un negocio para entrar a su ficha maestra y manejar su lógica, clientes y productos.':
    'Todavía no hay negocios abiertos en LINK WORLD.';
  renderBusinessList();
}
function setView(next){
  if(next==='director'){
    document.querySelectorAll('.lw-app-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='director'));
    $('#ai-toggle')?.click();
    return;
  }
  const territory=next==='territory';
  const wasTerritory=!$('#lw-territory').classList.contains('hidden');
  if(territory&&!wasTerritory)territoryPortraitBypass=false;
  document.querySelectorAll('.lw-app-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===next));
  $('#lw-businesses').classList.toggle('hidden',territory);
  $('#lw-territory').classList.toggle('hidden',!territory);
  syncTerritoryOrientation();
  if(!territory&&wasTerritory)releaseTerritoryOrientation();
  if(territory&&!state.map){
    state.map=true; // Google JS loads only on explicit territory visit.
    startGoogleWorld(()=>flyGoogle('atacama')).catch(()=>{
      $('#imagery-status').textContent='Google Maps · no se pudo conectar';
    });
  }
}
function make(tag,css,text){
  const node=document.createElement(tag);node.className=css;
  if(text!==undefined)node.textContent=String(text);
  return node;
}
function renderBusinessList(){
  const list=$('#lw-real-businesses');list.replaceChildren();
  if(!state.connected)return;
  for(const b of state.businesses){
    const card=make('button','lw-real-business');
    card.type='button';
    const visual=b.owned_facts?.visual_identity||{};
    const color=visual.color_visible===true&&/^#[0-9a-f]{6}$/i.test(visual.assigned_color||'')?visual.assigned_color:null;
    if(color){card.style.borderLeft='4px solid '+color;card.style.paddingLeft='18px';}
    card.append(make('span','lw-business-icon',b.name?.trim()?.charAt(0)?.toUpperCase()||'L'),
      make('strong','lw-business-name',b.name||'Negocio'),
      make('small','lw-business-sector',[b.sector,b.city,b.country].filter(Boolean).join(' · ')),
      make('small','lw-business-status',b.verification_status==='verified'?'Verificado':b.verification_status==='needs_review'?'Por verificar':'Borrador'));
    card.addEventListener('click',()=>{
      document.dispatchEvent(new CustomEvent('linkworld:open-business',{detail:{id:b.id}}));
    });
    list.append(card);
  }
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.addEventListener('linkworld:director-state',event=>{
  const open=Boolean(event.detail?.open);
  const fallback=$('#lw-territory').classList.contains('hidden')?'businesses':'territory';
  document.querySelectorAll('.lw-app-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===(open?'director':fallback)));
});
document.querySelectorAll('[data-location]').forEach(b=>b.addEventListener('click',()=>flyGoogle(b.dataset.location)));
$('#lw-landscape-mode').addEventListener('click',requestTerritoryLandscape);
$('#lw-portrait-bypass').addEventListener('click',()=>{territoryPortraitBypass=true;syncTerritoryOrientation();});
function syncTerritoryViewport(){
  const h=window.visualViewport?.height||window.innerHeight;
  document.documentElement.style.setProperty('--lw-visual-height',Math.round(h)+'px');
  syncTerritoryOrientation();
}
window.addEventListener('resize',syncTerritoryViewport,{passive:true});
window.visualViewport?.addEventListener?.('resize',syncTerritoryViewport,{passive:true});
window.visualViewport?.addEventListener?.('scroll',syncTerritoryViewport,{passive:true});
syncTerritoryViewport();
window.addEventListener('orientationchange',()=>setTimeout(syncTerritoryOrientation,60),{passive:true});
screen.orientation?.addEventListener?.('change',()=>setTimeout(syncTerritoryOrientation,60));
document.addEventListener('fullscreenchange',()=>setTimeout(syncTerritoryOrientation,60));
$('#lw-open-bridge').addEventListener('click',()=>{$('#lw-real-businesses')?.scrollIntoView({behavior:'smooth',block:'center'});});
$('#lw-sync').addEventListener('click',loadOpenWorld);
$('#lw-new-business').addEventListener('click',()=>document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt:'Quiero crear un nuevo negocio en LINK WORLD. Antes de registrarlo, pídeme nombre y si es físico o virtual. Si es físico, pídeme la dirección exacta y vincúlalo con Google Maps mediante Place ID; no cierres la ficha sin resolver su estado territorial.'}})));
document.addEventListener('linkworld:open-territory-business',event=>{
  const id=String(event.detail?.id||'');
  if(!id)return;
  setView('territory');
  const go=()=>flyToLinkBusiness(id);
  if(state.map)setTimeout(go,100); else setTimeout(go,900);
});
document.addEventListener('linkworld:place-selected',event=>{
  const d=event.detail||{},el=$('#lw-place-card');
  el.replaceChildren(make('strong','',d.name||'Lugar de Google'),make('small','',d.address||''),make('small','',d.placeId?('Place ID · '+d.placeId):''));
  if(d.uri&&/^https:\/\/(?:www\.)?google\.[^/]+\/maps/.test(d.uri)){
    const a=make('a','','Abrir en Google Maps ↗');a.href=d.uri;a.target='_blank';a.rel='noopener noreferrer';el.append(a);
  }
  el.classList.remove('hidden');
});
mountDirector(()=>({strategy:'',cell:'',mission:'',demoSnapshot:''}));
mountBusinessWorkspace();
loadOpenWorld();
