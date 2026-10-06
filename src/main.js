// deploy: director-link-expert-v1
// LINK WORLD: real data first. No DEMO cells or simulated mission in active UI.
import {flyGoogle,startGoogleWorld,setLinkBusinesses,flyToLinkBusiness} from './googleMaps.js';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './world/connection.js';
import {mountBusinessWorkspace} from './world/businessWorkspace.js';
import {mountMicelioBeta} from './world/micelioBeta.js';
import {mountCronJournal} from './world/cronJournal.js';
import {mountCronStation} from './world/cronStation.js';
import {mountProspectVault} from './world/prospectVault.js';
import {mountModelFoundry} from './world/modelFoundry.js';
import {mountObservatory} from './world/observatory.js';
import './style.css';
import './world/bridge.css';
import './world/businessWorkspace.css';
import './simple.css';
import './brand.css';
import './territory-responsive.css';
import './world/micelioBeta.css';
import './world/cronJournal.css';
import './world/cronStation.css';
import './world/prospectVault.css';
import './world/modelFoundry.css';
import './world/observatory.css';
import './linkTheme.css';

const $=s=>document.querySelector(s);
const LINK_WORLD_THEME_KEY='link-world-theme';
const LINK_WORLD_THEMES=new Set(['day','night','gray']);

function applyLinkWorldTheme(theme='day'){
  const next=LINK_WORLD_THEMES.has(theme)?theme:'day';
  document.documentElement.dataset.theme=next;
  try{localStorage.setItem(LINK_WORLD_THEME_KEY,next);}catch{}
  document.querySelectorAll('[data-theme-btn]').forEach(button=>{
    const active=button.dataset.themeBtn===next;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',active?'true':'false');
  });
}

function mountThemeSwitcher(){
  let stored='day';
  try{stored=localStorage.getItem(LINK_WORLD_THEME_KEY)||'day';}catch{}
  applyLinkWorldTheme(LINK_WORLD_THEMES.has(stored)?stored:'day');
  document.querySelectorAll('[data-theme-btn]').forEach(button=>{
    button.addEventListener('click',()=>applyLinkWorldTheme(button.dataset.themeBtn));
  });
}
const publicDb=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const state={map:false,connected:true,businesses:[],requests:[],relations:[],modelContext:null};
$('#app').innerHTML=[
"<div class='lw-app'>",
"<header class='lw-app-header'>",
"<a href='/' class='lw-app-brand'><span class='lw-brand-symbol' aria-hidden='true'><img src='/link-world-mark.svg' alt=''></span><span><strong>LINK WORLD</strong><small>El mundo de tus negocios</small></span></a>",
"<nav class='lw-app-nav' aria-label='Espacios de trabajo'><button class='active' data-view='businesses'>Negocios</button><button data-view='models'>Modelos</button><button data-view='vault'>Vault</button><button data-view='territory'>Territorio</button><button data-view='micelio'>Micelio <sup class='lw-nav-beta'>BETA</sup></button><button data-view='crons'>CRON</button><button data-view='journal'>Bitácora</button><button data-view='observatory'>Observatorio</button><a class='lw-link-explain' href='/que-es-link/'>LINK</a></nav>",
"<span class='lw-app-state' id='lw-app-state'>Sesión LINK</span>",
"<div class='lw-theme-switcher' role='group' aria-label='Apariencia'>",
"<button type='button' data-theme-btn='day' aria-pressed='false'>Día</button>",
"<button type='button' data-theme-btn='night' aria-pressed='false'>Noche</button>",
"<button type='button' data-theme-btn='gray' aria-pressed='false'>Gris</button>",
"</div>",
"<div class='header-actions' id='lw-hidden-triggers'><a class='lw-btn-secondary' href='https://linkcontrolgeneral.vercel.app/' target='_blank' rel='noopener noreferrer'>CONTROL CENTRAL ↗</a></div></header>",
"<main class='lw-main'>",
"<section id='lw-businesses' class='lw-home'>",
"<div class='lw-home-hero'><div><span class='lw-kicker'>TU ESPACIO DE TRABAJO</span><h1>Construyamos con lo que existe.</h1><p>Negocios reales, relaciones verificadas y herramientas de control en un espacio privado.</p></div><button id='lw-new-business' class='lw-btn-primary'>✦ Trabajar con ChatGPT</button></div>",
"<div class='lw-overview'><div><strong id='lw-business-count'>—</strong><span>Negocios</span></div><div><strong id='lw-request-count'>—</strong><span>Solicitudes</span></div><div><strong id='lw-relation-count'>—</strong><span>Relaciones</span></div></div>",
"<section class='lw-owned-section'><div class='lw-section-head'><div><span class='lw-kicker'>FUENTE DE VERDAD / LINK</span><h2>Tus negocios</h2></div><button id='lw-sync' class='lw-btn-secondary'>↻ Sincronizar</button></div>",
"<p class='lw-data-state' id='lw-data-state' role='status'>Cargando negocios de LINK WORLD…</p><div id='lw-real-businesses' class='lw-business-grid'></div></section>",
"<section class='lw-next-actions'><button id='lw-open-bridge'><span>01</span><strong>Panel de negocios</strong><small>Entrar a los negocios de LINK WORLD ↗</small></button><button data-view='territory'><span>02</span><strong>Explorar territorio</strong><small>Google Maps bajo demanda ↗</small></button><button data-view='models'><span>03</span><strong>Desarrollar modelos</strong><small>Entrar a la Concha Eterna ↗</small></button></section>",
"<p class='lw-boundary'>Google Maps permite observar negocios externos. Solo los datos propios que registremos con autorización forman parte de LINK.</p>",
"</section>",
"<section id='lw-territory' class='lw-territory hidden'>",
"<div id='lw-orientation-gate' class='lw-orientation-gate hidden' aria-live='polite'><div class='lw-orientation-card'><span class='lw-orientation-device' aria-hidden='true'></span><span class='lw-kicker'>TERRITORIO · MODO HORIZONTAL</span><h2>Gira tu dispositivo.</h2><p>Territorio es un tablero espacial. En teléfono o tablet funciona mejor en horizontal para conservar mapa, búsqueda y contexto como en el ordenador.</p><div class='lw-orientation-actions'><button id='lw-landscape-mode' type='button'>Activar modo horizontal</button><button id='lw-portrait-bypass' class='lw-orientation-skip' type='button'>Continuar en vertical</button></div><small id='lw-orientation-note'>Si el navegador no puede girar la pantalla automáticamente, gírala manualmente.</small></div></div>",
"<div class='lw-territory-top'><div><span class='lw-kicker'>TERRITORIO / GOOGLE + LINK</span><h1>Nuestros negocios sobre el territorio real.</h1><p>Los negocios LINK vinculados aparecen automáticamente. Google completa datos en vivo; las búsquedas externas se ejecutan solo cuando pulses Buscar.</p></div><div class='lw-map-locations'><button data-location='atacama'>San Pedro</button><button data-location='saopaulo'>São Paulo</button><button data-location='earth'>Planeta</button></div></div>",
"<div class='workspace lw-map-workspace'><div id='cesiumContainer' aria-label='Mapa de Google'></div><div id='lw-place-card' class='lw-place-card hidden' role='status'></div><div class='notice'>Google Maps no muestra imágenes en vivo. Un resultado externo no es un negocio registrado en LINK.</div></div>",
"<div class='lw-map-foot'><span id='imagery-status'>Google Maps · se abre al entrar en Territorio</span><span id='places-status'>Google Places · bajo demanda</span><span id='city-label'>SAN PEDRO DE ATACAMA · CHILE</span></div></section>",
"<section id='lw-models' class='model-foundry hidden' aria-label='Modelos LINK WORLD'></section><section id='lw-vault' class='prospect-vault hidden' aria-label='Prospect Vault LINK WORLD'></section><section id='lw-micelio' class='micelio-beta hidden' aria-label='Micelio LINK WORLD beta'></section>",
"<section id='lw-crons' class='cron-station hidden' aria-label='CRON de LINK WORLD'></section><section id='lw-journal' class='cron-journal hidden' aria-label='Bitácora de evolución de LINK WORLD'></section><section id='lw-observatory' class='observatory hidden' aria-label='OBS Observatorio de Aprendizaje'></section>",
"</main></div>"
].join('');

mountThemeSwitcher();

const vault=mountProspectVault();
const modelFoundry=mountModelFoundry();
const micelio=mountMicelioBeta();
const journal=mountCronJournal();
const cronStation=mountCronStation();
const observatory=mountObservatory();

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
  const {data:{session}}=await publicDb.auth.getSession();
  let member=false;
  if(session){
    const check=await publicDb.rpc('link_world_is_member');
    member=!check.error&&check.data===true;
  }
  const [businessRead,gameRead,bridgeRead]=await Promise.all([
    publicDb.from('link_world_businesses')
      .select('id,slug,name,sector,city,country,summary,verification_status,public_workspace,google_place_id,owned_facts')
      .eq('public_workspace',true).order('name',{ascending:true}),
    member
      ? publicDb.from('link_game_business_state_v')
          .select('business_id,temperature,conversion_percent,game_state,game_state_label,awaiting_evidence_count,next_action_due_at,overdue')
      : Promise.resolve({data:[],error:null}),
    member
      ? publicDb.from('link_control_world_summary_v')
          .select('control_global_id,businesses,agents,stage_directors,active_edges,world_activity_events,graph_updated_at')
          .maybeSingle()
      : Promise.resolve({data:null,error:null})
  ]);
  const {data,error}=businessRead;
  if(error){
    $('#lw-data-state').textContent='No se pudo abrir LINK WORLD: '+error.message;
    return;
  }
  const gameMap=new Map((gameRead.data||[]).map(row=>[String(row.business_id),row]));
  state.connected=true;state.businesses=(data||[]).map(b=>({...b,game_state:gameMap.get(String(b.id))||null}));state.requests=[];state.relations=[];
  setLinkBusinesses(state.businesses);
  $('#lw-app-state').textContent=member&&bridgeRead.data
    ? 'CONTROL CENTRAL ↔ LINK WORLD'
    : member?'Sesión LINK · juego vivo':'Modo abierto';
  $('#lw-business-count').textContent=String(state.businesses.length);
  $('#lw-request-count').textContent='—';
  $('#lw-relation-count').textContent='—';
  $('#lw-data-state').textContent=state.businesses.length?
    'Selecciona un negocio para entrar a su ficha maestra y manejar su lógica, clientes y productos.':
    'Todavía no hay negocios abiertos en LINK WORLD.';
  renderBusinessList();
}
function setView(next){
  const territory=next==='territory';
  const modelsView=next==='models';
  const vaultView=next==='vault';
  const micelioView=next==='micelio';
  const journalView=next==='journal';
  const cronsView=next==='crons';
  const observatoryView=next==='observatory';
  const wasTerritory=!$('#lw-territory').classList.contains('hidden');
  if(territory&&!wasTerritory)territoryPortraitBypass=false;
  document.querySelectorAll('.lw-app-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===next));
  $('#lw-businesses').classList.toggle('hidden',territory||modelsView||vaultView||micelioView||journalView||cronsView||observatoryView);
  $('#lw-models').classList.toggle('hidden',!modelsView);
  $('#lw-vault').classList.toggle('hidden',!vaultView);
  $('#lw-territory').classList.toggle('hidden',!territory);
  $('#lw-micelio').classList.toggle('hidden',!micelioView);
  $('#lw-journal').classList.toggle('hidden',!journalView);
  $('#lw-crons').classList.toggle('hidden',!cronsView);
  $('#lw-observatory').classList.toggle('hidden',!observatoryView);
  if(modelsView)modelFoundry.open();else modelFoundry.close();
  if(vaultView)vault.open();else vault.close();
  if(micelioView)micelio.open();else micelio.close();
  if(journalView)journal.open();else journal.close();
  if(cronsView)cronStation.open();else cronStation.close();
  if(observatoryView)observatory.open();else observatory.close();
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
    const game=b.game_state||null;
    const card=make('button','lw-real-business'+(game?' game-'+game.game_state:''));
    card.type='button';
    const visual=b.owned_facts?.visual_identity||{};
    const color=visual.color_visible===true&&/^#[0-9a-f]{6}$/i.test(visual.assigned_color||'')?visual.assigned_color:null;
    if(color&&!game){card.style.borderLeft='4px solid '+color;card.style.paddingLeft='18px';}
    card.append(make('span','lw-business-icon',b.name?.trim()?.charAt(0)?.toUpperCase()||'L'),
      make('strong','lw-business-name',b.name||'Negocio'),
      make('small','lw-business-sector',[b.sector,b.city,b.country].filter(Boolean).join(' · ')),
      make('small','lw-business-status',game
        ? (game.game_state_label+' · '+Math.round(Number(game.temperature||0))+'° · '+Math.round(Number(game.conversion_percent||0))+'%')
        : (b.verification_status==='verified'?'Verificado':b.verification_status==='needs_review'?'Por verificar':'Borrador')));
    card.addEventListener('click',()=>{
      document.dispatchEvent(new CustomEvent('linkworld:open-business',{detail:{id:b.id}}));
    });
    list.append(card);
  }
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
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
$('#lw-new-business').addEventListener('click',()=>document.dispatchEvent(new CustomEvent('linkworld:godmode-prompt',{detail:{sourceType:'system',title:'Crear nuevo negocio en LINK WORLD',prompt:'Quiero crear un nuevo negocio en LINK WORLD desde Modo Dios. Antes de registrarlo, revisa si ya existe como hobby, modelo, prospecto o negocio. Pídeme solo la información realmente faltante. Si es físico, necesitamos dirección o Place ID. Después deja persistentes negocio, modelo, artefactos y relaciones necesarias, y verifica el resultado.',context:{entry:'home_new_business'}}})));
function showGodModeToast(message,kind='ok'){
  let el=document.querySelector('#lw-godmode-toast');
  if(!el){
    el=document.createElement('div');
    el.id='lw-godmode-toast';
    el.className='lw-godmode-toast';
    document.body.append(el);
  }
  el.textContent=message;
  el.dataset.kind=kind;
  el.classList.add('visible');
  clearTimeout(showGodModeToast.timer);
  showGodModeToast.timer=setTimeout(()=>el.classList.remove('visible'),3600);
}

async function queueGodModePrompt(detail={}){
  const prompt=String(detail.prompt||'').trim();
  if(!prompt)return;
  let persisted=false,rowId=null,copied=false;
  try{
    const {data:{session}}=await publicDb.auth.getSession();
    if(session){
      const member=await publicDb.rpc('link_world_is_member');
      if(!member.error&&member.data===true){
        const payload={
          source_type:detail.sourceType||'system',
          source_id:detail.sourceId||null,
          model_id:detail.modelId||null,
          business_id:detail.businessId||null,
          stage_key:detail.stageKey||null,
          title:detail.title||'Pendiente LINK WORLD',
          prompt,
          context:detail.context||{},
          priority:detail.priority||'normal',
          status:'queued',
          metadata:{bridge:'chatgpt_external_god_mode'}
        };
        const write=await publicDb.from('link_world_chatgpt_outbox').insert(payload).select('id').single();
        if(!write.error){persisted=true;rowId=write.data?.id||null;}
      }
    }
  }catch{}
  try{
    await navigator.clipboard.writeText(prompt);
    copied=true;
    if(rowId)await publicDb.from('link_world_chatgpt_outbox').update({status:'copied',copied_at:new Date().toISOString()}).eq('id',rowId);
  }catch{}
  showGodModeToast(
    persisted&&copied?'Guardado para ChatGPT y copiado al portapapeles.':
    persisted?'Guardado en la bandeja de ChatGPT.':
    copied?'Prompt copiado. La sesión no permitió persistirlo.':
    'No se pudo persistir ni copiar el prompt.',
    persisted||copied?'ok':'error'
  );
}

async function addPlaceToModel(place,button){
  const ctx=state.modelContext;
  if(!ctx?.modelId)return;
  if(button){button.disabled=true;button.textContent='Guardando…';}
  try{
    const adapterPath='model-validation/'+ctx.modelKey+'/google/'+String(place.placeId||place.name).replace(/\s+/g,'-').toLowerCase();
    let prospect=null;
    const existing=await publicDb.from('link_world_prospect_vault')
      .select('id,business_name,reference_code').eq('adapter_path',adapterPath).maybeSingle();
    if(!existing.error&&existing.data){
      prospect=existing.data;
    }else{
      const insert=await publicDb.from('link_world_prospect_vault').insert({
        business_name:place.name||'Negocio Google',
        sector:'prospecto_modelo',
        business_summary:place.address||'Negocio encontrado en Google Places.',
        primary_goal:'Validar el modelo '+ctx.modelName+' en un negocio real.',
        adaptive_answer:{
          model_id:ctx.modelId,model_key:ctx.modelKey,model_name:ctx.modelName,
          pain:ctx.pain,solution:ctx.solution,google_place_id:place.placeId||null,
          address:place.address||null,google_maps_uri:place.uri||null
        },
        reference_items:[{
          type:'google_place',
          value:place.placeId||place.name||'',
          name:place.name||'',
          address:place.address||'',
          uri:place.uri||''
        }],
        answers:{source:'territory',model_key:ctx.modelKey},
        adapter_path:adapterPath,
        action_method:{
          title:'Validación comercial del modelo',
          steps:['Confirmar dolor','Contactar negocio','Presentar solución','Registrar respuesta','Convertir respuesta en evidencia']
        },
        dna_summary:{
          goal:'Validar '+ctx.modelName,
          needs:[ctx.pain],
          capabilities:[ctx.solution],
          friction:['Modelo aún requiere evidencia fuera de su origen']
        }
      }).select('id,business_name,reference_code').single();
      if(insert.error)throw insert.error;
      prospect=insert.data;
    }
    const link=await publicDb.from('link_world_model_prospects').upsert({
      model_id:ctx.modelId,
      prospect_id:prospect.id,
      stage_key:ctx.stageKey||'marketing',
      status:'candidate',
      evidence_state:'unverified',
      strategy:'Validar dolor y encaje del modelo antes de presentar una oferta.',
      metadata:{google_place_id:place.placeId||null,address:place.address||null}
    },{onConflict:'model_id,prospect_id'}).select('id').single();
    if(link.error)throw link.error;

    await publicDb.from('link_world_model_stage_state').update({
      status:'active',
      next_action:'Contactar '+(place.name||'el prospecto')+' y validar si el dolor existe antes de ofrecer la solución.',
      metadata:{last_prospect_id:prospect.id,last_google_place_id:place.placeId||null}
    }).eq('model_id',ctx.modelId).eq('stage_key',ctx.stageKey||'marketing');

    document.dispatchEvent(new CustomEvent('linkworld:godmode-prompt',{detail:{
      sourceType:'prospect',
      sourceId:prospect.id,
      modelId:ctx.modelId,
      stageKey:ctx.stageKey||'marketing',
      title:'Validar '+ctx.modelName+' con '+(place.name||'prospecto'),
      prompt:[
        'Trabajemos este prospecto real capturado desde Territorio de LINK WORLD.',
        'MODELO: '+ctx.modelName,
        'DOLOR QUE RESUELVE: '+ctx.pain,
        'SOLUCIÓN: '+ctx.solution,
        'PROSPECTO: '+(place.name||''),
        'DIRECCIÓN: '+(place.address||''),
        'GOOGLE PLACE ID: '+(place.placeId||''),
        '',
        'MISIÓN: investiga solo lo necesario para decidir si este negocio es un buen candidato para validar el modelo. Diseña una aproximación concreta, qué evidencia debemos conseguir y el siguiente paso. No inventes contacto, necesidad ni intención. Si confirmamos evidencia, déjala persistente en LINK WORLD.'
      ].join('\n'),
      context:{prospect_id:prospect.id,google_place_id:place.placeId||null}
    }}));
    if(button){button.textContent='✓ En Vault · prompt listo';}
    showGodModeToast('Negocio guardado como prospecto del modelo. Trabajo preparado para ChatGPT.');
  }catch(error){
    if(button){button.disabled=false;button.textContent='Agregar para validar este modelo';}
    showGodModeToast('No se pudo guardar el prospecto: '+(error?.message||String(error)),'error');
  }
}

document.addEventListener('linkworld:toast',event=>{
  showGodModeToast(event.detail?.message||'',event.detail?.kind||'ok');
});
document.addEventListener('linkworld:godmode-prompt',event=>queueGodModePrompt(event.detail||{}));
document.addEventListener('linkworld:director-prompt',event=>queueGodModePrompt({
  sourceType:'system',
  title:'Acción heredada de LINK WORLD',
  prompt:event.detail?.prompt||'',
  context:{legacy_event:'linkworld:director-prompt'}
}));
document.addEventListener('linkworld:set-view',event=>{
  const view=String(event.detail?.view||'');
  if(view)setView(view);
});
document.addEventListener('linkworld:model-territory',event=>{
  state.modelContext={...(event.detail||{})};
  setView('territory');
  showGodModeToast('Territorio está validando: '+(state.modelContext.modelName||'modelo')+'. Selecciona un negocio real.');
});

document.addEventListener('linkworld:open-territory-business',event=>{
  const id=String(event.detail?.id||'');
  if(!id)return;
  setView('territory');
  const go=()=>flyToLinkBusiness(id);
  if(state.map)setTimeout(go,100); else setTimeout(go,900);
});
document.addEventListener('linkworld:place-selected',event=>{
  const d=event.detail||{},el=$('#lw-place-card');
  el.replaceChildren(
    make('strong','',d.name||'Lugar de Google'),
    make('small','',d.address||''),
    make('small','',d.placeId?('Place ID · '+d.placeId):'')
  );
  if(d.uri&&/^https:\/\/(?:www\.)?google\.[^/]+\/maps/.test(d.uri)){
    const a=make('a','','Abrir en Google Maps ↗');a.href=d.uri;a.target='_blank';a.rel='noopener noreferrer';el.append(a);
  }
  if(state.modelContext?.modelId){
    el.append(
      make('small','lw-place-model-context','Validando modelo · '+(state.modelContext.modelName||''))
    );
    const add=make('button','lw-place-model-add','Agregar para validar este modelo');
    add.type='button';
    add.addEventListener('click',()=>addPlaceToModel(d,add));
    el.append(add);
  }
  el.classList.remove('hidden');
});
mountBusinessWorkspace();

const initialParams=new URLSearchParams(window.location.search);
if(initialParams.get('space')==='models')setView('models');
if(initialParams.get('space')==='vault'){
  setView('vault');
}
if(initialParams.get('space')==='micelio'){
  setView('micelio');
  const micelioView=initialParams.get('view');
  if(['processes','organism','local','businesses','records','operations','proposals','evolution'].includes(micelioView||'')){
    micelio.setView(micelioView);
  }
}

if(initialParams.get('space')==='crons')setView('crons');
if(initialParams.get('space')==='observatory')setView('observatory');
loadOpenWorld();
