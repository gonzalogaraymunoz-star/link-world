// LINK WORLD: real data first. No DEMO cells or simulated mission in active UI.
import {flyGoogle,startGoogleWorld} from './googleMaps.js';
import {mountWorldBridge} from './world/bridge.js';
import {mountDirector} from './ai/directorChat.js';
import {mountBusinessWorkspace} from './world/businessWorkspace.js';
import './style.css';
import './world/bridge.css';
import './ai/chat.css';
import './world/businessWorkspace.css';
import './simple.css';

const $=s=>document.querySelector(s);
const state={map:false,connected:false,businesses:[],requests:[],relations:[]};
$('#app').innerHTML=[
"<div class='lw-app'>",
"<header class='lw-app-header'>",
"<a href='/' class='lw-app-brand'><span class='lw-brand-symbol'>L•</span><span><strong>LINK WORLD</strong><small>El mundo de tus negocios</small></span></a>",
"<nav class='lw-app-nav' aria-label='Espacios de trabajo'><button class='active' data-view='businesses'>Negocios</button><button data-view='territory'>Territorio</button><button data-view='director'>Director IA</button></nav>",
"<span class='lw-app-state' id='lw-app-state'>Espacio privado · sin conectar</span>",
"<div class='header-actions' id='lw-hidden-triggers'></div></header>",
"<main class='lw-main'>",
"<section id='lw-businesses' class='lw-home'>",
"<div class='lw-home-hero'><div><span class='lw-kicker'>TU ESPACIO DE TRABAJO</span><h1>Construyamos con lo que existe.</h1><p>Negocios, solicitudes y relaciones reales. Sin misiones ficticias.</p></div><button id='lw-new-business' class='lw-btn-primary'>+ Nuevo negocio</button></div>",
"<div class='lw-overview'><div><strong id='lw-business-count'>—</strong><span>Negocios</span></div><div><strong id='lw-request-count'>—</strong><span>Solicitudes</span></div><div><strong id='lw-relation-count'>—</strong><span>Relaciones</span></div></div>",
"<section class='lw-owned-section'><div class='lw-section-head'><div><span class='lw-kicker'>FUENTE DE VERDAD / LINK</span><h2>Tus negocios</h2></div><button id='lw-sync' class='lw-btn-secondary'>↻ Sincronizar</button></div>",
"<p class='lw-data-state' id='lw-data-state' role='status'>Conecta tu usuario para consultar los negocios reales. Ningún dato de demostración se presenta como negocio.</p><div id='lw-real-businesses' class='lw-business-grid'></div></section>",
"<section class='lw-next-actions'><button id='lw-open-bridge'><span>01</span><strong>Gestionar negocios</strong><small>Acceso privado y solicitudes ↗</small></button><button data-view='territory'><span>02</span><strong>Explorar territorio</strong><small>Google Maps bajo demanda ↗</small></button><button data-view='director'><span>03</span><strong>Conversar con Director</strong><small>OpenRouter gratuito ↗</small></button></section>",
"<p class='lw-boundary'>Google Maps permite observar negocios externos. Solo los datos propios que registremos con autorización forman parte de LINK.</p>",
"</section>",
"<section id='lw-territory' class='lw-territory hidden'><div class='lw-territory-top'><div><span class='lw-kicker'>TERRITORIO / FUENTE EXTERNA</span><h1>Explorar, no inventar.</h1><p>Las búsquedas Google se ejecutan solo cuando pulses Buscar.</p></div><div class='lw-map-locations'><button data-location='atacama'>San Pedro</button><button data-location='saopaulo'>São Paulo</button><button data-location='earth'>Planeta</button></div></div>",
"<div class='workspace lw-map-workspace'><div id='cesiumContainer' aria-label='Mapa de Google'></div><div id='lw-place-card' class='lw-place-card hidden' role='status'></div><div class='notice'>Google Maps no muestra imágenes en vivo. Un resultado externo no es un negocio registrado en LINK.</div></div>",
"<div class='lw-map-foot'><span id='imagery-status'>Google Maps · se abre al entrar en Territorio</span><span id='places-status'>Google Places · bajo demanda</span><span id='city-label'>SAN PEDRO DE ATACAMA · CHILE</span></div></section>",
"</main></div>"
].join('');

const bridge=()=>$('#bridge-toggle');
function openBridge(tab){
  if(!bridge())return;
  if($('#bridge-panel')?.classList.contains('hidden'))bridge().click();
  if(tab)document.querySelector('[data-bridge-tab="'+tab+'"]')?.click();
}
function setView(next){
  if(next==='director'){ $('#ai-toggle')?.click();return; }
  const territory=next==='territory';
  document.querySelectorAll('.lw-app-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===next));
  $('#lw-businesses').classList.toggle('hidden',territory);
  $('#lw-territory').classList.toggle('hidden',!territory);
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
document.addEventListener('linkworld:workspace-data',event=>{
  const d=event.detail||{};
  state.connected=d.authenticated===true;
  state.businesses=Array.isArray(d.businesses)?d.businesses:[];
  state.requests=Array.isArray(d.requests)?d.requests:[];
  state.relations=Array.isArray(d.relations)?d.relations:[];
  $('#lw-app-state').textContent=state.connected?'Espacio LINK · conectado':'Espacio privado · sin conectar';
  $('#lw-business-count').textContent=state.connected?String(state.businesses.length):'—';
  $('#lw-request-count').textContent=state.connected?String(state.requests.length):'—';
  $('#lw-relation-count').textContent=state.connected?String(state.relations.length):'—';
  $('#lw-data-state').textContent=!state.connected?
    'Conecta tu cuenta autorizada de LINK CONTROL CENTRAL para leer los negocios propios. No mostraremos datos ficticios.':
    state.businesses.length?'Información propia sincronizada desde Supabase. Selecciona un negocio para ver su ficha.':
    'Aún no hay negocios registrados en LINK WORLD. Puedes crear la primera ficha como borrador privado.';
  renderBusinessList();
});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('[data-location]').forEach(b=>b.addEventListener('click',()=>flyGoogle(b.dataset.location)));
$('#lw-open-bridge').addEventListener('click',()=>openBridge('directory'));
$('#lw-sync').addEventListener('click',()=>{openBridge('directory');$('#bridge-refresh')?.click();});
$('#lw-new-business').addEventListener('click',()=>openBridge('add'));
document.addEventListener('linkworld:place-selected',event=>{
  const d=event.detail||{},el=$('#lw-place-card');
  el.replaceChildren(make('strong','',d.name||'Lugar de Google'),make('small','',d.address||''));
  if(d.uri&&/^https:\/\/(?:www\.)?google\.[^/]+\/maps/.test(d.uri)){
    const a=make('a','','Abrir en Google Maps ↗');a.href=d.uri;a.target='_blank';a.rel='noopener noreferrer';el.append(a);
  }
  el.classList.remove('hidden');
});
mountWorldBridge();
mountDirector(()=>({strategy:'',cell:'',mission:'',demoSnapshot:''}));
mountBusinessWorkspace();
