// LINK WORLD Director IA · explicit connection, real on-demand app research, no local chat-count cap.
// Secret API key remains only in password input until this tab is closed; never in localStorage/logs.
import { readDirectorAppContext } from '../world/bridge.js';

const LOG_KEY='linkworld_local_requests_v1';
const SETTINGS_KEY='linkworld_ai_public_config_v1';
const FREE_URL='https://openrouter.ai/api/v1/chat/completions';
const MAX_LOG=80;
const $=(q,r=document)=>r.querySelector(q);
const safe=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const day=()=>new Date().toISOString().slice(0,10);
const saved=read(SETTINGS_KEY,{});
const state={open:false,tab:'director',busy:false,checking:false,verified:false,modelVerified:false,
  validatedModel:'',serverOk:false,answer:null,showError:'',model:saved.model||'openrouter/free',
  lastModel:'',pendingResearch:false};
let getContext=()=>({});
function freeModel(model){return model==='openrouter/free'||/^[A-Za-z0-9._/-]+:free$/.test(model);}
function status(message,error=false){
  const n=$('#ai-notice');if(n){n.textContent=message;n.classList.toggle('error',error);}
}
function showConnection(text,kind='pending'){
  const badge=$('#ai-connection');if(badge){badge.textContent=text;badge.dataset.status=kind;}
  const head=$('#ai-toggle');if(head){head.dataset.connection=kind;head.title='Director IA · '+text;}
}
function currentModel(){return $('#ai-model')?.value.trim()||'';}
function connectionInvalid(){
  state.verified=false;state.modelVerified=false;state.validatedModel='';
  showConnection('Sin verificar','pending');
}
function usableKey(){const key=$('#ai-key')?.value.trim()||'';return key.startsWith('sk-or-')&&key.length>15;}
function renderLog(){
  const el=$('#ai-log');if(!el)return;
  const items=read(LOG_KEY,[]);
  el.innerHTML=items.length?items.map(e=>'<article class="ai-event"><div class="ai-event-top"><span>'+safe(e.kind)+'</span><time>'+safe(new Date(e.at).toLocaleString('es-CL'))+'</time></div><strong>'+safe(e.prompt)+'</strong><small>'+safe(e.status)+' · '+safe(e.model||'sin modelo')+'</small>'+(e.answer?'<p>'+safe(e.answer)+'</p>':'')+'</article>').join(''):'<p class="ai-caption">Todavía no hay solicitudes en este navegador.</p>';
}
function saveLog(kind,prompt,stat,answer='',model=''){
  const entry={id:crypto.randomUUID(),at:new Date().toISOString(),source:'LINK WORLD',
    kind,prompt:prompt.slice(0,3500),status:stat,answer:answer.slice(0,12500),model};
  const ok=write(LOG_KEY,[entry,...read(LOG_KEY,[])].slice(0,MAX_LOG));
  if(!ok)status('No se pudo guardar el registro local. Exporta lo que tengas.',true);
  renderLog();
}
function setTab(tab){
  state.tab=tab;
  document.querySelectorAll('[data-ai-tab]').forEach(b=>b.classList.toggle('active',b.dataset.aiTab===tab));
  document.querySelectorAll('[data-ai-page]').forEach(e=>e.classList.toggle('hidden',e.dataset.aiPage!==tab));
}
function visibility(open){
  state.open=open;$('#ai-panel').classList.toggle('hidden',!open);
  $('#ai-toggle').setAttribute('aria-expanded',String(open));
  if(open)setTab(state.tab);
}
function renderAnswer(){
  const r=$('#ai-result');r.replaceChildren();
  if(!state.answer)return;
  const t=document.createElement('strong');t.textContent='Respuesta de '+(state.answer.model||state.model)+' · propuesta para revisar';
  const body=document.createElement('div');body.className='ai-answer';body.textContent=state.answer.answer;
  const meta=document.createElement('small');meta.textContent=
    (state.answer.usage?.inputTokens||0)+' tokens de entrada · '+(state.answer.usage?.outputTokens||0)+
    ' de salida · Ningún negocio, pago o reserva se modificó.';
  r.append(t,body,meta);
}
async function checkServer(){
  try{
    const response=await fetch('/api/director',{cache:'no-store'});
    const info=await response.json();
    if(!response.ok||!info.enabled)throw Error('servidor no disponible');
    state.serverOk=true;
    $('#ai-service').textContent='Servidor LINK listo · OpenRouter configurado';
  }catch{
    state.serverOk=false;
    $('#ai-service').textContent='Servidor LINK no disponible · revisa la publicación';
    showConnection('Servidor no disponible','error');
  }
}
async function checkKey({quiet=false}={}){
  if(state.checking||state.busy)return false;
  const key=$('#ai-key').value.trim(),model=currentModel();
  if(!usableKey()){connectionInvalid();setTab('config');status('Pega tu API key sk-or-… para comprobar la conexión.',true);return false;}
  if(!freeModel(model)){connectionInvalid();setTab('config');status('Solo se permite openrouter/free o un ID terminado en :free.',true);return false;}
  if($('#ai-url').value.trim().replace(/\/$/,'')!==FREE_URL){connectionInvalid();setTab('config');status('La URL debe ser la de OpenRouter. No se envió nada.',true);return false;}
  state.checking=true;$('#ai-test').disabled=true;
  showConnection('Comprobando clave…','checking');
  if(!quiet)status('Verificando la clave de OpenRouter sin generar texto ni consumir una consulta del modelo…');
  try{
    const response=await fetch('/api/director',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'check',url:FREE_URL,model,apiKey:key,mode:'strict-zero'})});
    const data=await response.json().catch(()=>({error:'Servidor sin respuesta interpretable.'}));
    if(!response.ok)throw Error(data.error||'No se pudo verificar.');
    state.verified=true;state.validatedModel=model;
    state.modelVerified=false;
    showConnection('Clave conectada · modelo por probar','connected');
    $('#ai-connection-detail').textContent='OpenRouter aceptó la clave. Modelo '+model+
      ' · se confirmará al recibir la primera respuesta. '+(data.isFreeTier?'Cuenta Free reportada por OpenRouter.':'La modalidad de facturación de tu cuenta no queda garantizada por LINK.');
    status('Clave conectada correctamente. Vuelve a Director y consulta cuando quieras.');
    write(SETTINGS_KEY,{url:FREE_URL,model});
    if(!quiet)setTab('director');
    return true;
  }catch(e){
    connectionInvalid();$('#ai-connection-detail').textContent='No se estableció conexión con OpenRouter.';
    status(e.message||'No se pudo comprobar la clave.',true);
    return false;
  }finally{state.checking=false;$('#ai-test').disabled=false;}
}
function selectedContext(){
  const c=getContext()||{};
  return {strategy:c.strategy||'',cell:c.cell||'',mission:c.mission||'',demoSnapshot:c.demoSnapshot||''};
}
async function queryAI(){
  if(state.busy||state.checking)return;
  const prompt=$('#ai-prompt').value.trim(),model=currentModel();
  if(prompt.length<3||prompt.length>3500){status('Escribe una pregunta de entre 3 y 3500 caracteres.',true);return;}
  if(!freeModel(model)){setTab('config');status('Selecciona openrouter/free o un modelo terminado en :free.',true);return;}
  const key=$('#ai-key').value.trim();
  if(!key){setTab('config');connectionInvalid();status('Primero pega y comprueba tu clave OpenRouter.',true);return;}
  if(!state.verified||state.validatedModel!==model){
    setTab('config');status('Pulsa «Comprobar conexión» antes de consultar con esta clave y modelo.',true);return;
  }
  state.busy=true;$('#ai-send').disabled=true;
  state.answer=null;renderAnswer();
  showConnection('Consultando modelo gratuito…','checking');
  status('Preparando respuesta. Ninguna búsqueda en Google se ejecuta automáticamente.');
  const keep=$('#ai-register').checked;
  try{
    const context=selectedContext();
    if(context.demoSnapshot)context.demoSnapshot=context.demoSnapshot.slice(0,3200);
    if($('#ai-research').checked){
      const scope=$('#ai-scope').value;
      status('Leyendo datos propios y solicitudes autorizadas de LINK…');
      const research=await readDirectorAppContext(scope);
      context.appDataStatus='Supabase autorizado, '+research.count+' negocios; '+research.scope+(research.truncated?' · contexto recortado expresamente por límite de seguridad':'');
      context.approvedAppSnapshot=research.snapshot;
      status('Contexto LINK cargado. Consultando el modelo gratuito una sola vez…');
    }else context.appDataStatus='Sin contexto privado: el usuario no autorizó compartir datos LINK con OpenRouter.';
    const res=await fetch('/api/director',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'chat',mode:'strict-zero',url:FREE_URL,apiKey:key,model,prompt,context})});
    const data=await res.json().catch(()=>({error:'El servidor no devolvió JSON válido.'}));
    if(!res.ok)throw Error(data.error||'Consulta fallida.');
    state.answer=data;state.modelVerified=true;state.lastModel=data.model||model;renderAnswer();
    showConnection('Conectado · '+state.lastModel,'connected');
    $('#ai-connection-detail').textContent='Clave validada y respuesta recibida de '+state.lastModel+'. Solo modelos gratuitos; sin ejecución de operaciones.';
    status('Respuesta recibida. Puedes seguir consultando sin límite adicional de LINK; si OpenRouter alcanza su cuota gratuita, se detendrá.');
    if(keep)saveLog('consulta IA',prompt,'respuesta · sin ejecutar',data.answer,model);
  }catch(e){
    showConnection(state.verified?'Clave conectada · consulta fallida':'Sin conectar',state.verified?'connected':'error');
    status(e.message||'Error. No se reintenta ni cambia a pago.',true);
    if(keep)saveLog('consulta IA',prompt,'fallida · sin reintento','',model);
  }finally{state.busy=false;$('#ai-send').disabled=false;}
}
function render(){
  if($('#ai-panel'))return;
  const panel=document.createElement('section');panel.className='ai-panel hidden';panel.id='ai-panel';panel.setAttribute('aria-label','Director IA');
  panel.innerHTML=[
    '<header class="ai-head"><div><span class="eyebrow">LINK WORLD / INTELIGENCIA</span><h2>Director IA</h2><small>Investiga, organiza y propone. Tú decides.</small></div><button id="ai-close" type="button" aria-label="Cerrar Director">×</button></header>',
    '<div class="ai-health"><strong id="ai-connection" data-status="pending">Sin verificar</strong><span id="ai-service">Comprobando servidor…</span><small id="ai-connection-detail">Conecta tu clave una vez por pestaña. No la guardamos.</small></div>',
    '<nav class="ai-tabs"><button class="active" type="button" data-ai-tab="director">Conversar</button><button type="button" data-ai-tab="config">Conexión</button><button type="button" data-ai-tab="log">Registro</button></nav>',
    '<div class="ai-page" data-ai-page="director"><span class="ai-tag">DIRECTOR / MODELOS GRATUITOS</span><p class="ai-caption">Pregunta libremente. El Director estructura su respuesta y puede consultar la información privada LINK únicamente si la autorizas. No ejecuta acciones ni consultas Google por su cuenta.</p>',
    '<label for="ai-prompt">¿QUÉ NECESITAS INVESTIGAR O CONSTRUIR?</label><textarea id="ai-prompt" maxlength="3500" rows="6" placeholder="Ej.: ¿Qué sabemos de los negocios de LINK y cómo podríamos conectar sus capacidades? Señala lo que falta verificar."></textarea>',
    '<div class="ai-research-box"><label class="ai-check-label"><input id="ai-research" type="checkbox" /> Incluir datos propios de LINK (requiere sesión y envía el contexto seleccionado a OpenRouter)</label><label for="ai-scope">ALCANCE DE INVESTIGACIÓN</label><select id="ai-scope"><option value="selected">Hasta 3 negocios seleccionados; si no hay selección, resumen</option><option value="all">Resumen del organismo (hasta 15 negocios)</option></select><small>Lee al momento negocios, relaciones, solicitudes y actividad autorizados. No copia ni envía fichas de Google.</small></div>',
    '<label class="ai-check-label"><input id="ai-register" type="checkbox" /> Guardar esta consulta en el registro local (opcional)</label>',
    '<div class="ai-limit"><strong>Sin límite diario adicional de LINK</strong><span>OpenRouter conserva su cuota Free · 3500 caracteres · 1100 tokens por respuesta</span></div>',
    '<button id="ai-send" class="ai-primary" type="button">Consultar al Director ↗</button><button id="ai-google" class="ai-quiet" type="button">Buscar manualmente en Google Maps ↗</button>',
    '<div id="ai-notice" role="status"></div><div id="ai-result" class="ai-result"></div>',
    '<p class="ai-caption">Google: búsquedas solo cuando pulses Buscar sobre el mapa, con límites independientes. Si el modelo gratuito llega a su cuota, no habrá reintentos ni cambio a pago.</p></div>',
    '<div class="ai-page hidden" data-ai-page="config"><span class="ai-tag">ESTADO REAL DE CONEXIÓN</span><p class="ai-caption">1. Pega tu clave de OpenRouter. 2. Comprueba la conexión. 3. Vuelve a Conversar. La clave permanece únicamente en esta pestaña.</p>',
    '<label for="ai-url">URL / OPENROUTER</label><input type="url" id="ai-url" spellcheck="false" readonly />',
    '<label for="ai-model">MODEL / gratuito</label><input id="ai-model" type="text" maxlength="100" spellcheck="false" /><small>openrouter/free selecciona un modelo gratuito. También puedes usar un ID específico terminado en :free.</small>',
    '<label for="ai-key">API KEY / TU CLAVE PRIVADA</label><input type="password" id="ai-key" spellcheck="false" autocomplete="new-password" placeholder="sk-or-v1-…" />',
    '<button type="button" id="ai-test" class="ai-primary">Comprobar conexión ↗</button><button id="ai-forget" type="button" class="ai-quiet">Borrar clave de esta pestaña</button>',
    '<p class="ai-caption">Comprobar conexión verifica la clave sin generar texto. No prueba que el modelo esté disponible hasta la primera respuesta. La facturación de tu cuenta no depende de este botón.</p>',
    '<a href="https://openrouter.ai/collections/free-models" target="_blank" rel="noopener noreferrer">Ver catálogo de modelos Free ↗</a></div>',
    '<div class="ai-page hidden" data-ai-page="log"><span class="ai-tag">BITÁCORA LOCAL</span><p class="ai-caption">Solo se guardan las conversaciones que autorices; no se guarda la API key. Este registro no es el registro compartido de ↔ LINK WORLD.</p>',
    '<label for="ai-manual">REGISTRAR SOLICITUD SIN IA</label><textarea id="ai-manual" maxlength="1200" rows="3" placeholder="Escribe una solicitud pendiente…"></textarea><button id="ai-save-manual" type="button" class="ai-primary">Guardar solicitud</button>',
    '<div class="ai-log-actions"><button id="ai-export" type="button">Exportar JSON</button><button id="ai-clear-log" type="button">Borrar registro local</button></div><div id="ai-log"></div></div>'
  ].join('');
  document.body.append(panel);
  const add=document.createElement('button');add.id='ai-toggle';add.type='button';
  add.textContent='✦ Director IA';add.className='header-button ai-header-btn';
  add.setAttribute('aria-expanded','false');$('.header-actions').insertBefore(add,$('.header-actions').firstChild);
  $('#ai-url').value=FREE_URL;$('#ai-model').value=freeModel(state.model)?state.model:'openrouter/free';
  $('#ai-key').addEventListener('input',connectionInvalid);
  $('#ai-model').addEventListener('input',()=>{connectionInvalid();write(SETTINGS_KEY,{model:currentModel()});});
  $('#ai-test').addEventListener('click',()=>checkKey());
  $('#ai-forget').addEventListener('click',()=>{$('#ai-key').value='';connectionInvalid();status('Clave eliminada de esta pestaña.');});
  $('#ai-close').addEventListener('click',()=>visibility(false));
  add.addEventListener('click',()=>visibility(!state.open));
  document.querySelectorAll('[data-ai-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.aiTab)));
  $('#ai-send').addEventListener('click',queryAI);
  $('#ai-google').addEventListener('click',()=>{
    visibility(false);const input=$('#google-text-query');
    if(input){input.focus();input.scrollIntoView({block:'nearest'});}
    else status('Conecta Google Maps antes de consultar Places.',true);
  });
  $('#ai-save-manual').addEventListener('click',()=>{
    const p=$('#ai-manual').value.trim();
    if(p.length<3){status('Escribe una solicitud válida.',true);return;}
    saveLog('solicitud manual',p,'pendiente · no ejecutada');
    $('#ai-manual').value='';status('Solicitud guardada localmente.');
  });
  $('#ai-export').addEventListener('click',()=>{
    const b=new Blob([JSON.stringify({title:'LINK WORLD / solicitudes locales',exported_at:new Date().toISOString(),requests:read(LOG_KEY,[])},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='link-world-director-'+day()+'.json';
    a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });
  $('#ai-clear-log').addEventListener('click',()=>{
    if(!confirm('¿Borrar el registro local?'))return;
    localStorage.removeItem(LOG_KEY);renderLog();status('Registro local borrado.');
  });
  renderLog();
  checkServer();
  showConnection('Sin verificar · pega tu clave','pending');
}
export function mountDirector(contextProvider){
  getContext=contextProvider||(()=>({}));
  render();
}
