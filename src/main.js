// LINK WORLD: real data first. No DEMO cells or simulated mission in active UI.
import {flyGoogle,startGoogleWorld} from './googleMaps.js';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './world/connection.js';
import {mountDirector} from './ai/directorChat.js';
import {mountBusinessWorkspace} from './world/businessWorkspace.js';
import './style.css';
import './world/bridge.css';
import './ai/chat.css';
import './world/businessWorkspace.css';
import './simple.css';\nimport './brand.css';

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
"<section id='lw-territory' class='lw-territory hidden'><div class='lw-territory-top'><div><span class='lw-kicker'>TERRITORIO / FUENTE EXTERNA</span><h1>Explorar, no inventar.</h1><p>Las búsquedas Google se ejecutan solo cuando pulses Buscar.</p></div><div class='lw-map-locations'><button data-location='atacama'>San Pedro</button><button data-location='saopaulo'>São Paulo</button><button data-location='earth'>Planeta</button></div></div>",
"<div class='workspace lw-map-workspace'><div id='cesiumContainer' aria-label='Mapa de Google'></div><div id='lw-place-card' class='lw-place-card hidden' role='status'></div><div class='notice'>Google Maps no muestra imágenes en vivo. Un resultado externo no es un negocio registrado en LINK.</div></div>",
"<div class='lw-map-foot'><span id='imagery-status'>Google Maps · se abre al entrar en Territorio</span><span id='places-status'>Google Places · bajo demanda</span><span id='city-label'>SAN PEDRO DE ATACAMA · CHILE</span></div></section>",
"</main></div>"
].join('');

async function loadOpenWorld(){
  $('#lw-data-state').textContent='Sincronizando LINK WORLD…';
  const {data,error}=await publicDb.from('link_world_businesses')
    .select('id,slug,name,sector,city,country,summary,verification_status,public_workspace')
    .eq('public_workspace',true).order('name',{ascending:true});
  if(error){
    $('#lw-data-state').textContent='No se pudo abrir LINK WORLD: '+error.message;
    return;
  }
  state.connected=true;state.businesses=data||[];state.requests=[];state.relations=[];
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
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('[data-location]').forEach(b=>b.addEventListener('click',()=>flyGoogle(b.dataset.location)));
$('#lw-open-bridge').addEventListener('click',()=>{$('#lw-real-businesses')?.scrollIntoView({behavior:'smooth',block:'center'});});
$('#lw-sync').addEventListener('click',loadOpenWorld);
$('#lw-new-business').addEventListener('click',()=>document.dispatchEvent(new CustomEvent('linkworld:director-prompt',{detail:{prompt:'Quiero trabajar en LINK WORLD. Ayúdame a revisar el siguiente cambio antes de registrarlo.'}})));
document.addEventListener('linkworld:place-selected',event=>{
  const d=event.detail||{},el=$('#lw-place-card');
  el.replaceChildren(make('strong','',d.name||'Lugar de Google'),make('small','',d.address||''));
  if(d.uri&&/^https:\/\/(?:www\.)?google\.[^/]+\/maps/.test(d.uri)){
    const a=make('a','','Abrir en Google Maps ↗');a.href=d.uri;a.target='_blank';a.rel='noopener noreferrer';el.append(a);
  }
  el.classList.remove('hidden');
});
mountDirector(()=>({strategy:'',cell:'',mission:'',demoSnapshot:''}));
mountBusinessWorkspace();
loadOpenWorld();
