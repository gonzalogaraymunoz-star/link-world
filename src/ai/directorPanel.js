// LINK Director UI: free-only AI access + local request register.
// API key exists ONLY in an input field while this tab is open. Never persisted.
const LOG_KEY='linkworld_local_requests_v1';
const USE_KEY='linkworld_ai_attempts_v1';
const SETTINGS_KEY='linkworld_ai_public_config_v1';
const FREE_URL='https://api.groq.com/openai/v1/chat/completions';
const DAILY_LIMIT=5, MAX_LOG=80;
const $=(s,root=document)=>root.querySelector(s);
const safe=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isoDay=()=>new Date().toISOString().slice(0,10);
const read=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return v===null?fallback:v;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const currentUsage=()=>{
  const u=read(USE_KEY,{day:isoDay(),count:0});
  return u.day===isoDay()?Math.max(0,Number(u.count)||0):0;
};
function debitAttempt(){
  const count=currentUsage();
  if(count>=DAILY_LIMIT)return false;
  return write(USE_KEY,{day:isoDay(),count:count+1});
}
const getLog=()=>read(LOG_KEY,[]);
function addLog(entry){
  const log=getLog();
  const record={id:crypto.randomUUID(),at:new Date().toISOString(),source:'LINK WORLD',...entry};
  return write(LOG_KEY,[record,...log].slice(0,MAX_LOG));
}
const state={open:false,tab:'director',busy:false,key:'',answer:null,config:read(SETTINGS_KEY,{url:FREE_URL,model:'openai/gpt-oss-20b'}),notices:''};
let getContext=()=>({});
function wrap(text){return safe(text).replace(/\n/g,'<br>');}
const emptyLabel='No hay solicitudes registradas en este navegador.';
function renderLog(){
  const container=$('#ai-log');if(!container)return;
  const items=getLog();
  container.innerHTML=items.length?items.map(e=>'<article class="ai-event"><div class="ai-event-top"><span>'+safe(e.kind||'solicitud')+'</span><time>'+safe(new Date(e.at).toLocaleString('es-CL'))+'</time></div><strong>'+safe(e.prompt||'Solicitud registrada')+'</strong><small>'+safe(e.status||'registrada')+' · '+safe(e.model||'sin modelo')+'</small>'+(e.answer?'<p>'+wrap(e.answer)+'</p>':'')+'</article>').join(''):'<p class="ai-caption">'+emptyLabel+'</p>';
}
function registerRecord(kind,prompt,status,answer='',model=''){
  const ok=addLog({kind,prompt:prompt.slice(0,1500),status,answer:answer.slice(0,6500),model});
  if(!ok)state.notices='El navegador no permitió guardar el registro. Exporta lo que ya tengas.';
  renderLog();renderUsage();
}
function renderUsage(){
  const n=$('#ai-usage');if(n)n.textContent=currentUsage()+' / '+DAILY_LIMIT+' intentos hoy (este navegador)';
}
function showNotice(message,error=false){const e=$('#ai-notice');if(e){e.textContent=message;e.classList.toggle('error',error);}}
function renderResult(){
  const e=$('#ai-result');if(!e)return;
  e.replaceChildren();
  const data=state.answer;
  if(!data)return;
  const title=document.createElement('strong');title.textContent='Propuesta del Director · NO verificada';
  const content=document.createElement('div');content.className='ai-answer';content.textContent=data.answer;
  const footer=document.createElement('small');footer.textContent=(data.model||'')+' · '+(data.usage?.inputTokens||0)+' tokens entrada / '+(data.usage?.outputTokens||0)+' salida · No se ejecutaron acciones.';
  e.append(title,content,footer);
}
function savePublicSettings(){
  const config={url:$('#ai-url').value.trim(),model:$('#ai-model').value.trim()};
  state.config=config;
  write(SETTINGS_KEY,config);
}
function setTab(tab){
  state.tab=tab;
  document.querySelectorAll('[data-ai-tab]').forEach(b=>b.classList.toggle('active',b.dataset.aiTab===tab));
  document.querySelectorAll('[data-ai-page]').forEach(n=>n.classList.toggle('hidden',n.dataset.aiPage!==tab));
  if(tab==='log')renderLog();
}
function syncVisibility(){
  const panel=$('#ai-panel');panel.classList.toggle('hidden',!state.open);
  $('#ai-toggle').setAttribute('aria-expanded',String(state.open));
  if(state.open){setTab(state.tab);renderUsage();}
}
function render(){
  if($('#ai-panel'))return;
  const panel=document.createElement('section');panel.className='ai-panel hidden';panel.id='ai-panel';panel.setAttribute('aria-label','Director IA y registro de solicitudes');
  panel.innerHTML=[
    '<div class="ai-head"><div><span class="eyebrow">LINK / MESA DE DECISIONES</span><h2>Director IA</h2><small>Modelos abiertos · configuración BYOK · modo $0</small></div><button id="ai-close" type="button" aria-label="Cerrar Director IA">×</button></div>',
    '<div class="ai-tabs"><button type="button" class="active" data-ai-tab="director">Director</button><button type="button" data-ai-tab="log">Registro</button><button type="button" data-ai-tab="config">URL · MODEL · API</button></div>',
    '<div class="ai-page" data-ai-page="director"><span class="ai-tag">PROPUESTA / NO EJECUCIÓN</span><p class="ai-caption">Describe una necesidad. El modelo recibe tu pregunta y un contexto mínimo de la estrategia y célula LINK, nunca automáticamente tus fichas de Google.</p>',
    '<label for="ai-prompt">TU SOLICITUD</label><textarea id="ai-prompt" maxlength="1800" rows="5" placeholder="¿Cómo desarrollamos esta oportunidad sin prometer servicios que no podemos verificar?"></textarea>',
    '<div class="ai-check"><label><input type="checkbox" id="ai-register" checked /> Registrar solicitud y respuesta en este navegador</label></div>',
    '<div class="ai-limit"><strong id="ai-usage">0 / 5 intentos hoy</strong><span>Hasta 1.800 caracteres · 700 tokens de respuesta · sin reintentos</span></div>',
    '<button type="button" id="ai-send" class="ai-primary">Consultar al Director ↗</button><div id="ai-notice" role="status"></div><div id="ai-result" class="ai-result"></div>',
    '<p class="ai-caption">Sin cuenta Free confirmada, clave o cuota disponible, no se envía nada. Este tope local NO es un control de facturación global.</p></div>',
    '<div class="ai-page hidden" data-ai-page="log"><span class="ai-tag">BITÁCORA LOCAL</span><p class="ai-caption">Incluye solicitudes manuales y las consultas de IA que autorices registrar. Visible sólo en este navegador; no sincronizado con Supabase ni otros chats.</p>',
    '<label for="ai-manual">REGISTRAR SOLICITUD SIN IA</label><textarea id="ai-manual" maxlength="1200" rows="3" placeholder="Ej.: Verificar disponibilidad de un operador para Hotel Experience."></textarea>',
    '<button type="button" id="ai-save-manual" class="ai-primary">Guardar solicitud ↗</button><div class="ai-log-actions"><button type="button" id="ai-export">Exportar JSON</button><button type="button" id="ai-clear-log">Borrar registro local</button></div><div id="ai-log"></div></div>',
    '<div class="ai-page hidden" data-ai-page="config"><span class="ai-tag">SIN GASTO AUTOMÁTICO</span><p class="ai-caption">Modo seguro: únicamente endpoint de Groq Free. Puedes editar URL y MODEL, pero LINK no llamará a otro host mientras estemos en modo $0. Modelos y cuotas dependen de tu cuenta.</p>',
    '<label for="ai-url">URL DEL ENDPOINT / OPENAI-COMPATIBLE</label><input type="url" id="ai-url" spellcheck="false" placeholder="https://…/chat/completions" />',
    '<label for="ai-model">MODEL / ID DEL MODELO</label><input type="text" id="ai-model" spellcheck="false" maxlength="100" />',
    '<label for="ai-key">API KEY / ESTA PESTAÑA SOLAMENTE</label><input type="password" id="ai-key" spellcheck="false" autocomplete="new-password" placeholder="Clave de proveedor Free" />',
    '<div class="ai-check"><label><input type="checkbox" id="ai-free-confirm" /> Confirmo que mi cuenta es Free, no tiene facturación de pago habilitada y el modelo admite consultas gratuitas.</label></div>',
    '<button type="button" class="ai-primary" id="ai-save-config">Guardar URL y modelo</button><button type="button" class="ai-quiet" id="ai-forget">Borrar API de esta pestaña</button>',
    '<p class="ai-caption">La clave no se guarda en GitHub, localStorage, ni en Vercel: viaja en cada petición al proxy LINK por HTTPS y desde allí al proveedor. No la envíes por chat ni la confundas con tu clave de Google Maps.</p>',
    '<a href="https://github.com/gonzalogaraymunoz-star/link-world/blob/main/.agents/skills/link-director/SKILL.md" target="_blank" rel="noopener noreferrer">Abrir habilidad LINK Director ↗</a><button id="ai-copy-skill" type="button" class="ai-quiet">Copiar instrucción para invocarla en otro chat</button>',
    '</div>'
  ].join('');
  document.body.append(panel);
  const addButton=document.createElement('button');addButton.id='ai-toggle';addButton.type='button';addButton.textContent='✦ Director IA';addButton.className='header-button ai-header-btn';addButton.setAttribute('aria-expanded','false');
  const heading=document.querySelector('.header-actions');
  heading.insertBefore(addButton,heading.firstChild);
  $('#ai-url').value=state.config.url||FREE_URL;
  $('#ai-model').value=state.config.model||'openai/gpt-oss-20b';
  $('#ai-close').addEventListener('click',()=>{state.open=false;syncVisibility();});
  addButton.addEventListener('click',()=>{state.open=!state.open;syncVisibility();});
  document.querySelectorAll('[data-ai-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.aiTab)));
  $('#ai-save-config').addEventListener('click',()=>{
    savePublicSettings();
    showNotice('URL y modelo guardados en este navegador. La API key permanece sólo en esta pestaña.');
    setTab('director');
  });
  $('#ai-forget').addEventListener('click',()=>{$('#ai-key').value='';$('#ai-free-confirm').checked=false;showNotice('Clave borrada de esta pestaña.');});
  $('#ai-send').addEventListener('click',queryAI);
  $('#ai-save-manual').addEventListener('click',()=>{
    const p=$('#ai-manual').value.trim();
    if(p.length<3){showNotice('Escribe una solicitud de al menos 3 caracteres.',true);return;}
    registerRecord('solicitud manual',p,'pendiente · no ejecutada');
    $('#ai-manual').value='';
    showNotice('Solicitud guardada en este navegador.');
  });
  $('#ai-export').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({title:'LINK WORLD · registro local',exported_at:new Date().toISOString(),requests:getLog()},null,2)],{type:'application/json'});
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='link-world-solicitudes-'+isoDay()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  });
  $('#ai-clear-log').addEventListener('click',()=>{
    if(!confirm('¿Borrar las solicitudes locales de este navegador? Esta acción no se puede deshacer.'))return;
    try{localStorage.removeItem(LOG_KEY);}catch{}
    renderLog();showNotice('Registro local borrado. El contador diario no se reinicia.');
  });
  $('#ai-copy-skill').addEventListener('click',()=>{
    const txt='Utiliza la habilidad LINK Director de https://github.com/gonzalogaraymunoz-star/link-world/blob/main/.agents/skills/link-director/SKILL.md . Lee el manual maestro del proyecto, distingue hechos/demo/hipótesis, respeta gasto $0 y registra sólo acciones autorizadas.';
    navigator.clipboard?.writeText(txt).then(()=>showNotice('Instrucción copiada.'),()=>showNotice('Copia el enlace de la habilidad desde GitHub.',true));
  });
  renderUsage();renderLog();
}
async function queryAI(){
  if(state.busy)return;
  const prompt=$('#ai-prompt').value.trim();
  if(prompt.length<3){showNotice('Escribe una solicitud de al menos 3 caracteres.',true);return;}
  if(!$('#ai-free-confirm').checked){setTab('config');showNotice('Antes de consultar, confirma que tu cuenta sigue en el plan Free sin facturación de pago.',true);return;}
  const key=$('#ai-key').value.trim();
  if(!key){setTab('config');showNotice('Falta la API key de tu proveedor Free.',true);return;}
  const url=$('#ai-url').value.trim().replace(/\/$/,'');
  const model=$('#ai-model').value.trim();
  if(url!==FREE_URL){setTab('config');showNotice('Modo $0: URL no autorizada. Por seguridad sólo se permite Groq Free; no se envió nada.',true);return;}
  if(!model){setTab('config');showNotice('Introduce el ID del modelo.',true);return;}
  if(currentUsage()>=DAILY_LIMIT){showNotice('Límite de 5 intentos alcanzado en este navegador hoy. Sin reintentos ni fallback de pago.',true);return;}
  if(!debitAttempt()){showNotice('No se pudo registrar el consumo local. Por seguridad, se bloqueó la consulta.',true);return;}
  savePublicSettings();renderUsage();
  const track=$('#ai-register').checked;
  state.busy=true;$('#ai-send').disabled=true;
  showNotice('Consultando una vez al modelo Free…');
  state.answer=null;renderResult();
  try{
    const context=getContext();
    const response=await fetch('/api/director',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      url,model,apiKey:key,prompt,mode:'strict-zero',freeAccountConfirmed:true,
      context:{strategy:context.strategy||'',cell:context.cell||'',mission:context.mission||''}
    })});
    const data=await response.json().catch(()=>({error:'Respuesta no interpretable del servidor.'}));
    if(!response.ok)throw new Error(data.error||'No se pudo consultar al modelo.');
    state.answer=data;renderResult();
    showNotice('Propuesta recibida. No se ejecutó ninguna acción real.');
    if(track)registerRecord('consulta IA',prompt,'respuesta no verificada',data.answer,model);
  }catch(error){
    showNotice(error.message||'Consulta fallida sin reintento.',true);
    if(track)registerRecord('consulta IA',prompt,'fallida · sin reintento','',model);
  }finally{state.busy=false;$('#ai-send').disabled=false;renderUsage();}
}
export function mountDirector(contextProvider){getContext=contextProvider||(()=>({}));render();}
