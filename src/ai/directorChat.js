// LINK WORLD · full-screen conversational Director with pluggable AI providers.
import { readDirectorAppContext } from '../world/bridge.js';

const MODEL_KEY='linkworld_ai_provider_config_v2';
const LOG_KEY='linkworld_local_requests_v1';
const CONTEXT_KEY='linkworld_director_context_v1';
const CONTEXT_SCOPE_KEY='linkworld_director_context_scope_v1';
const DEFAULT_PROVIDER='openrouter';
const DEFAULT_MODEL='';
const LEGACY_DEFAULT_MODELS=new Set(['nvidia/nemotron-3-ultra-550b-a55b:free','qwen/qwen3-235b-a22b-2507:free']);
const PROVIDERS={
  openrouter:{label:'OpenRouter',detail:'Catálogo completo de OpenRouter · usa el ID exacto del modelo.',keyRequired:true},
  groq:{label:'Groq',detail:'API compatible con OpenAI · usa un modelo disponible en tu cuenta Groq.',keyRequired:true},
  nvidia:{label:'NVIDIA NIM',detail:'NVIDIA API Catalog / NIM · usa el identificador exacto del modelo.',keyRequired:true},
};

const $=(q,root=document)=>root.querySelector(q);
const safe=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const stamp=()=>new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});
const day=()=>new Date().toISOString().slice(0,10);
const stored=read(MODEL_KEY,{});
const s={
  open:false,settings:false,log:false,busy:false,checking:false,keyChecked:false,
  modelAnswered:false,
  provider:PROVIDERS[stored.provider]?stored.provider:DEFAULT_PROVIDER,
  model:typeof stored.model==='string'&&stored.model.trim()&&!LEGACY_DEFAULT_MODELS.has(stored.model)?stored.model:DEFAULT_MODEL,
  endpoint:'',
  messages:[],history:[],lastStatus:'Sin conectar',context:null,activeModel:'',activeProvider:'',
  sessionId:crypto.randomUUID(),turnIndex:0,lastArchiveId:null,archiveState:'Listo',pendingContextPrompt:''
};
let getContext=()=>({});

function providerId(){return $('#lw-provider')?.value||s.provider||DEFAULT_PROVIDER;}
function providerInfo(){return PROVIDERS[providerId()]||PROVIDERS.openrouter;}
function apiKey(){return $('#lw-key')?.value.trim()||'';}
function model(){return $('#lw-model')?.value.trim()||'';}
function keyReady(){
  const info=providerInfo();
  return !info.keyRequired||apiKey().length>=8;
}
function configReady(){
  if(model().length<1)return false;
  return keyReady();
}
function rememberConfig(){
  const p=providerId(),m=model();
  if(!PROVIDERS[p]||!m)return false;
  s.provider=p;s.model=m;s.endpoint='';
  save(MODEL_KEY,{provider:p,model:m});
  return true;
}
function archiveEnvelope(contextScope='none',contextBusinessCount=null){
  s.turnIndex+=1;
  return {
    sessionId:s.sessionId,
    turnIndex:s.turnIndex,
    contextScope,
    contextBusinessCount
  };
}
function currentPayload(extra={}){
  return {
    provider:providerId(),
    model:model(),
    apiKey:apiKey(),
    ...extra
  };
}
function refreshProviderUI(){refreshDirectorMeta();}
function needsLinkContext(prompt){
  const p=String(prompt||'').toLowerCase();
  return /(link world|link cupones|negocios? reales?|nuestros? negocios?|nuestros? clientes?|nuestros? productos?|wine experience|supabase|corteza|solicitudes? pendientes?|relaciones? entre negocios|cola de conversi[oó]n|prioridades? de hoy|informe diario|actividad de hoy|c[3-5]\b)/i.test(p);
}
function persistContextPreference(){
  save(CONTEXT_KEY,Boolean($('#lw-private')?.checked));
  save(CONTEXT_SCOPE_KEY,$('#lw-scope')?.value||'all');
}
function refreshDirectorMeta(){
  const providerState=$('#lw-provider-state');
  if(providerState)providerState.textContent=providerInfo().label;
  const keyState=$('#lw-key-state');
  if(keyState){
    keyState.textContent=s.keyChecked?'Conexión probada':(keyReady()?(apiKey()?'API ingresada':'Sin API requerida'):'Falta API key');
  }
  const modelState=$('#lw-model-state');
  if(modelState)modelState.textContent=s.activeModel||model()||'Sin definir';
  const contextState=$('#lw-context-state');
  if(contextState){
    const enabled=$('#lw-private')?.checked;
    const scope=$('#lw-scope')?.value;
    contextState.textContent=enabled?(scope==='all'?'Autorizado · hasta 15 negocios':'Autorizado · selección resumida'):'No compartido';
    contextState.dataset.active=enabled?'true':'false';
  }
  const saveState=$('#lw-save-state');
  if(saveState)saveState.textContent=$('#lw-save')?.checked?'Registro local activo':'No se guarda';
  const archiveState=$('#lw-archive-state');
  if(archiveState){
    archiveState.textContent=s.archiveState==='saved'?(s.lastArchiveId?'Guardado · '+s.lastArchiveId.slice(0,8):'Guardado'):
      s.archiveState==='failed'?'Error de archivo':'Activo';
    archiveState.dataset.kind=s.archiveState;
  }
}
function status(text,kind='idle'){
  s.lastStatus=text;
  const chip=$('#lw-status'),detail=$('#lw-alert');
  if(chip){chip.textContent=text;chip.dataset.kind=kind;}
  if(detail){detail.textContent=kind==='error'?text:'';detail.classList.toggle('hidden',kind!=='error');}
  const trigger=$('#ai-toggle');if(trigger){trigger.dataset.kind=kind;trigger.title='Director IA · '+text;}
  refreshDirectorMeta();
}
function setSettings(open){
  s.settings=open;
  $('#lw-settings').classList.toggle('hidden',!open);
  $('#lw-settings-btn').setAttribute('aria-expanded',String(open));
  if(open){s.log=false;showLog(false);setTimeout(()=>$('#lw-provider')?.focus(),0);}
}
function setOpen(open){
  s.open=open;
  $('#lw-panel').classList.toggle('hidden',!open);
  $('#ai-toggle').setAttribute('aria-expanded',String(open));
  document.body.classList.toggle('lw-director-open',open);
  document.dispatchEvent(new CustomEvent('linkworld:director-state',{detail:{open}}));
  refreshDirectorMeta();
  if(open){scrollChat();setTimeout(()=>$('#lw-composer')?.focus(),0);}
}
function feedback(text,error=false){
  const bar=$('#lw-feedback');
  bar.textContent=text;bar.classList.toggle('error',error);
  bar.classList.toggle('hidden',!text);
}
function scrollChat(){const t=$('#lw-transcript');if(t)t.scrollTop=t.scrollHeight;}
function addMessage(role,text,extra={}){
  const item={role,text,at:stamp(),...extra};
  s.messages.push(item);renderMessages();return item;
}
function renderMessages(){
  const t=$('#lw-transcript');
  t.replaceChildren();
  for(const message of s.messages){
    const el=document.createElement('article');el.className='lw-message '+message.role+(message.pending?' pending':'');
    const icon=document.createElement('div');icon.className='lw-avatar';
    icon.textContent=message.role==='user'?'TÚ':message.role==='error'?'!':'D';
    const body=document.createElement('div');body.className='lw-bubble-wrap';
    const eyebrow=document.createElement('div');eyebrow.className='lw-message-name';
    eyebrow.textContent=(message.role==='user'?'Tú':message.role==='error'?'No se completó':'Director')+' · '+message.at;
    const bubble=document.createElement('div');bubble.className='lw-bubble';
    bubble.textContent=message.text;
    body.append(eyebrow,bubble);
    if(message.action==='enable_link_context'){
      const action=document.createElement('button');
      action.type='button';action.className='lw-inline-action';
      action.textContent='Usar contexto LINK y continuar';
      action.addEventListener('click',()=>{
        $('#lw-private').checked=true;
        $('#lw-scope').value='all';
        persistContextPreference();
        s.pendingContextPrompt=message.prompt||'';
        s.messages=s.messages.filter(m=>m!==message);
        renderMessages();refreshDirectorMeta();
        $('#lw-composer').value=s.pendingContextPrompt;
        s.pendingContextPrompt='';
        send();
      });
      body.append(action);
    }
    if(message.model||message.provider){
      const meta=document.createElement('small');meta.className='lw-message-meta';
      meta.textContent=[message.provider,message.model,message.tokens?message.tokens+' tokens de salida':'','propuesta · no ejecución'].filter(Boolean).join(' · ');
      body.append(meta);
    }
    el.append(icon,body);t.append(el);
  }
  scrollChat();
}
function showLog(show){
  s.log=show;
  $('#lw-log').classList.toggle('hidden',!show);
  $('#lw-transcript').classList.toggle('hidden',show);
  $('#lw-compose').classList.toggle('hidden',show);
  $('#lw-log-btn').setAttribute('aria-pressed',String(show));
  if(show){setSettings(false);renderLog();}else scrollChat();
}
function logEntry(item){
  const list=read(LOG_KEY,[]);
  const entry={
    id:crypto.randomUUID(),at:new Date().toISOString(),source:'Director IA',
    kind:'conversación',prompt:item.prompt.slice(0,3500),answer:item.answer.slice(0,12500),
    status:'respuesta · no ejecutada',provider:item.provider,model:item.model
  };
  if(!save(LOG_KEY,[entry,...list].slice(0,80)))feedback('El navegador no pudo guardar la conversación.',true);
}
function renderLog(){
  const list=$('#lw-log-items');if(!list)return;
  const items=read(LOG_KEY,[]);
  list.innerHTML=items.length?items.map(item=>
    '<article class="lw-log-item"><small>'+safe(item.kind||'solicitud')+' · '+safe(new Date(item.at).toLocaleString('es-CL'))+'</small>'+
    '<strong>'+safe(item.prompt||'Solicitud')+'</strong><p>'+safe(item.answer||item.status||'Pendiente')+'</p>'+
    (item.provider||item.model?'<small>'+safe([item.provider,item.model].filter(Boolean).join(' · '))+'</small>':'')+
    '</article>'
  ).join(''):'<p class="lw-hint">Todavía no hay solicitudes guardadas aquí. Conversar no guarda información automáticamente.</p>';
}
function historyForRequest(){
  return s.messages.filter(m=>m.role==='user'||m.role==='assistant').slice(-12)
    .map(m=>({role:m.role,content:m.text.slice(0,1100)}));
}
function explainMissingConfig(){
  if(!model())return 'Escribe el identificador exacto del modelo.';
  if(!keyReady())return 'Pega una API key válida para '+providerInfo().label+'.';
  return 'Revisa proveedor, modelo y API.';
}
async function verifyConnection(){
  if(s.checking||s.busy)return;
  if(!configReady()){feedback(explainMissingConfig(),true);status('Configuración incompleta','warn');setSettings(true);return;}
  if(!rememberConfig())return;
  s.checking=true;$('#lw-verify').disabled=true;
  feedback('Probando el proveedor y el modelo con una generación mínima…');
  status('Probando '+providerInfo().label+'…','busy');
  try{
    const r=await fetch('/api/director',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(currentPayload({action:'check',archive:archiveEnvelope('connection_check',null)}))
    });
    const data=await r.json().catch(()=>({error:'El servidor no devolvió una respuesta válida.'}));
    if(!r.ok){
      const err=Error(data.error||'La prueba falló.');
      err.archiveStatus=data.archiveStatus;err.archiveId=data.archiveId;
      throw err;
    }
    s.lastArchiveId=data.archiveId||null;s.archiveState=data.archiveStatus||'failed';
    s.keyChecked=true;s.activeProvider=data.providerLabel||providerInfo().label;s.activeModel=data.model||model();
    status('Conectado · '+s.activeProvider,'ok');
    feedback('Conexión lista. El modelo respondió. Esta prueba puede haber consumido una cantidad mínima de cuota.');
    $('#lw-connect-note').textContent='Conexión probada con '+s.activeProvider+' · '+s.activeModel+'. La API key no se guarda.';
    setSettings(false);
  }catch(e){
    if(e.archiveStatus){s.archiveState=e.archiveStatus;s.lastArchiveId=e.archiveId||null;}
    s.keyChecked=false;status('Conexión fallida','error');
    feedback((e.message||'No fue posible probar el proveedor.')+(s.archiveState==='failed'?' · No se pudo archivar esta intervención.':''),true);
  }finally{
    s.checking=false;$('#lw-verify').disabled=false;refreshDirectorMeta();
  }
}
async function send(){
  if(s.busy||s.checking)return;
  const prompt=$('#lw-composer').value.trim();
  if(prompt.length<3||prompt.length>3500){feedback('Escribe un mensaje de entre 3 y 3500 caracteres.',true);return;}
  if(!configReady()){setSettings(true);status('Configuración incompleta','warn');feedback(explainMissingConfig(),true);return;}
  if(!rememberConfig()){setSettings(true);feedback('Revisa proveedor y modelo.',true);return;}
  if(needsLinkContext(prompt)&&!$('#lw-private').checked){
    s.pendingContextPrompt=prompt;
    addMessage('assistant','Para responder con negocios y datos reales necesito leer el contexto de LINK WORLD. Puedes autorizarlo una vez y continuar con la misma pregunta.',{
      action:'enable_link_context',prompt
    });
    feedback('La pregunta quedó preparada. Autoriza contexto LINK para continuar con datos reales.');
    return;
  }
  setSettings(false);feedback('');
  const previous=historyForRequest();
  addMessage('user',prompt);
  const typing=addMessage('assistant','Pensando con '+providerInfo().label+' · '+model()+'…',{pending:true});
  $('#lw-composer').value='';s.busy=true;
  $('#lw-send').disabled=true;$('#lw-composer').disabled=true;
  status('Pensando · '+providerInfo().label,'busy');
  try{
    const context=getContext()||{};
    const payload={
      strategy:context.strategy||'',cell:context.cell||'',mission:context.mission||'',
      demoSnapshot:(context.demoSnapshot||'').slice(0,3200),
      appDataStatus:'Datos LINK no compartidos con el proveedor de IA.'
    };
    let archiveScope='none',archiveBusinessCount=null;
    if($('#lw-private').checked){
      feedback('Leyendo el contexto autorizado de LINK…');
      const scope=$('#lw-scope').value;
      const result=await readDirectorAppContext(scope);
      archiveScope=scope;archiveBusinessCount=result.count;
      payload.approvedAppSnapshot=result.snapshot;
      payload.appDataStatus='LINK autorizado: '+result.count+' negocios; '+result.scope+(result.truncated?'; snapshot recortado por límite':'');
    }
    feedback('');
    const response=await fetch('/api/director',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(currentPayload({
        action:'chat',prompt,messages:previous,context:payload,
        archive:archiveEnvelope(archiveScope,archiveBusinessCount)
      }))
    });
    const answer=await response.json().catch(()=>({error:'El servidor no devolvió una respuesta interpretable.'}));
    if(!response.ok){
      const err=Error(answer.error||'No se pudo consultar el modelo.');
      err.archiveStatus=answer.archiveStatus;err.archiveId=answer.archiveId;
      throw err;
    }
    s.lastArchiveId=answer.archiveId||null;s.archiveState=answer.archiveStatus||'failed';
    typing.text=answer.answer;typing.pending=false;
    typing.model=answer.model||model();typing.provider=answer.providerLabel||providerInfo().label;
    typing.tokens=answer.usage?.outputTokens||0;
    s.modelAnswered=true;s.keyChecked=true;s.activeModel=typing.model;s.activeProvider=typing.provider;
    status('Conectado · '+typing.provider,'ok');
    $('#lw-connect-note').textContent='Última respuesta: '+typing.provider+' · '+typing.model+'. Ninguna operación real se ejecutó.';
    if($('#lw-save').checked)logEntry({prompt,answer:answer.answer,model:typing.model,provider:typing.provider});
  }catch(e){
    if(e.archiveStatus){s.archiveState=e.archiveStatus;s.lastArchiveId=e.archiveId||null;}
    typing.role='error';typing.pending=false;
    typing.text=(e.message||'No se recibió respuesta.')+'\n\nLINK WORLD no cambió automáticamente de proveedor ni de modelo.'+
      (s.archiveState==='failed'?'\n\nAdvertencia: esta intervención no pudo guardarse en el archivo central.':'');
    $('#lw-composer').value=prompt;
    status('Consulta fallida · revisa proveedor','warn');
    feedback(e.message||'No se recibió respuesta.',true);
  }finally{
    s.busy=false;$('#lw-send').disabled=false;$('#lw-composer').disabled=false;
    renderMessages();refreshDirectorMeta();$('#lw-composer').focus();
  }
}
function exportConversation(){
  const data={
    title:'LINK WORLD / conversación local no sincronizada',
    exported_at:new Date().toISOString(),
    provider:providerId(),model:model(),
    messages:s.messages.filter(m=>m.role!=='error').map(m=>({role:m.role,content:m.text}))
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);
  link.download='link-world-chat-'+day()+'.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1500);
}
function render(){
  const trigger=document.createElement('button');trigger.type='button';trigger.id='ai-toggle';
  trigger.className='header-button lw-header-button';trigger.textContent='Director IA';
  trigger.setAttribute('aria-expanded','false');$('.header-actions').insertBefore(trigger,$('.header-actions').firstChild);

  const panel=document.createElement('section');panel.id='lw-panel';panel.className='lw-chat hidden';
  panel.setAttribute('aria-label','Director IA de LINK WORLD');
  panel.innerHTML=[
    '<header class="lw-top">',
      '<div class="lw-identity"><span class="lw-symbol"><img src="/link-world-mark.svg" alt=""></span><div><span class="lw-eyebrow">LINK WORLD / INTELIGENCIA</span><h2>Director IA</h2><small>Proveedor · modelo · API</small></div></div>',
      '<div class="lw-top-actions"><button id="lw-new" type="button">Nueva conversación</button><button id="lw-export-chat" type="button">Exportar</button><button id="lw-close" type="button" aria-label="Cerrar Director">×</button></div>',
    '</header>',
    '<div class="lw-director-shell">',
      '<aside class="lw-director-rail lw-director-guide">',
        '<section class="lw-rail-card lw-rail-intro"><span class="lw-rail-kicker">CÓMO TRABAJA</span><h3>Entender antes de actuar.</h3><p>El Director organiza contexto, separa hechos de vacíos y prepara una acción verificable. No convierte una idea en dato real por sí solo.</p></section>',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">FLUJO</span><ol class="lw-director-flow"><li><b>01</b><span><strong>Entiende</strong><small>Qué quieres resolver.</small></span></li><li><b>02</b><span><strong>Lee contexto</strong><small>Solo lo que autorizas.</small></span></li><li><b>03</b><span><strong>Analiza</strong><small>Hechos, vacíos y relaciones.</small></span></li><li><b>04</b><span><strong>Propone</strong><small>Un siguiente paso concreto.</small></span></li><li><b>05</b><span><strong>Tú decides</strong><small>No hay escritura automática.</small></span></li></ol></section>',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">PUEDES PEDIRLE</span><div class="lw-capability-list"><span>Investigar un negocio</span><span>Diseñar un producto</span><span>Conectar negocios</span><span>Detectar información faltante</span><span>Preparar una solicitud</span><span>Ordenar una decisión</span></div></section>',
        '<section class="lw-rail-card lw-rule-card"><strong>Regla LINK WORLD</strong><p>Supabase es la fuente de verdad. Conversar no modifica datos. El proveedor/modelo son los que tú elijas y LINK no cambia a otro automáticamente.</p></section>',
      '</aside>',
      '<section class="lw-director-center">',
        '<div class="lw-status-line"><span id="lw-status" data-kind="idle">Sin conectar</span><span class="lw-proposal-note">RESPUESTA = PROPUESTA · NO EJECUCIÓN</span></div>',
        '<div id="lw-alert" class="lw-alert hidden" role="status"></div>',
        '<main id="lw-transcript" class="lw-transcript" aria-live="polite"></main>',
        '<section id="lw-log" class="lw-log hidden"><div class="lw-log-head"><div><span class="lw-rail-kicker">REGISTRO LOCAL</span><h3>Conversaciones y solicitudes guardadas</h3></div><button id="lw-log-back" type="button">Volver al chat</button></div><p class="lw-hint">Este registro vive en este navegador. No sincroniza automáticamente con LINK WORLD y nunca guarda tu API key.</p><textarea id="lw-manual" maxlength="1200" rows="3" placeholder="Registrar una solicitud local sin usar IA…"></textarea><button id="lw-add-record" class="lw-primary" type="button">Guardar solicitud local</button><div class="lw-log-tools"><button id="lw-export-log" type="button">Exportar registro</button><button id="lw-clear-log" type="button">Borrar registro</button></div><div id="lw-log-items"></div></section>',
        '<footer id="lw-compose" class="lw-compose"><div class="lw-compose-label"><span>Habla con el Director</span><small>Enter para enviar · Shift + Enter para salto de línea</small></div><div class="lw-composer-row"><textarea id="lw-composer" maxlength="3500" rows="3" aria-label="Escribe tu mensaje al Director" placeholder="Ej: revisa LINK Cupones y dime qué sabemos, qué falta y cuál debería ser el siguiente paso…"></textarea><button id="lw-send" class="lw-primary" type="button" aria-label="Enviar mensaje">↑</button></div><div id="lw-feedback" class="lw-feedback hidden" role="status"></div></footer>',
      '</section>',
      '<aside class="lw-director-rail lw-director-context">',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">ESTADO</span><div class="lw-meta-list"><div><span>Proveedor</span><strong id="lw-provider-state">—</strong></div><div><span>Conexión</span><strong id="lw-key-state">No conectada</strong></div><div><span>Modelo</span><strong id="lw-model-state">—</strong></div><div><span>Contexto LINK</span><strong id="lw-context-state">No compartido</strong></div><div><span>Memoria local</span><strong id="lw-save-state">No se guarda</strong></div><div><span>Archivo IA</span><strong id="lw-archive-state">Activo</strong></div></div></section>',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">CONTEXTO LINK</span><label class="lw-context-toggle"><input type="checkbox" id="lw-private"><span><strong>Usar contexto LINK automáticamente</strong><small>Recuerda esta autorización en este navegador. El proveedor recibe solo una instantánea acotada cuando consultas al Director.</small></span></label><label class="lw-scope-label" for="lw-scope">ALCANCE</label><select id="lw-scope" aria-label="Alcance de investigación"><option value="all">Ecosistema · hasta 15 negocios</option><option value="selected">Selección · hasta 3 negocios</option></select></section>',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">FUENTES</span><div class="lw-source-list"><div><i></i><span><strong>Conversación</strong><small>Disponible durante esta sesión.</small></span></div><div><i></i><span><strong>LINK WORLD</strong><small>Solo cuando autorizas datos.</small></span></div><div><i></i><span><strong>Proveedor IA</strong><small>Solo el proveedor/modelo que configuras.</small></span></div><div><i></i><span><strong>Archivo IA</strong><small>Cada intervención se guarda en Supabase para auditoría y aprendizaje.</small></span></div><div><i></i><span><strong>Google</strong><small>Manual. Nunca se consulta en silencio.</small></span></div></div></section>',
        '<section class="lw-rail-card lw-rail-actions"><span class="lw-rail-kicker">HERRAMIENTAS</span><button id="lw-settings-btn" type="button" aria-expanded="false">Conectar IA <span>→</span></button><button id="lw-log-btn" type="button" aria-pressed="false">Registro local <span>→</span></button><button id="lw-google" type="button">Abrir territorio / Google <span>→</span></button><label class="lw-save-toggle"><input type="checkbox" id="lw-save"><span>Guardar respuestas en registro local</span></label></section>',
        '<section id="lw-settings" class="lw-settings hidden"><div class="lw-settings-head"><div><span class="lw-rail-kicker">CONEXIÓN IA</span><strong>Proveedor · modelo · API</strong><small>Elige dónde corre el modelo, escribe su ID exacto y pega tu API. Nada más.</small></div><button id="lw-settings-close" type="button" aria-label="Cerrar configuración">×</button></div>',
          '<label for="lw-provider">PROVEEDOR</label><select id="lw-provider"><option value="openrouter">OpenRouter</option><option value="groq">Groq</option><option value="nvidia">NVIDIA NIM</option></select>',
          '<label for="lw-model">MODELO</label><input id="lw-model" type="text" spellcheck="false" maxlength="180" placeholder="ID exacto del modelo">',
          '<label for="lw-key">API</label><input id="lw-key" type="password" spellcheck="false" autocomplete="new-password" placeholder="Pega aquí tu API key">',
          '<button id="lw-verify" type="button" class="lw-primary lw-connect-main">Conectar</button>',
          '<small id="lw-connect-note">LINK WORLD prueba exactamente ese proveedor y ese modelo. La API no se guarda.</small></section>',
      '</aside>',
    '</div>'
  ].join('');
  document.body.append(panel);

  $('#lw-provider').value=s.provider;
  $('#lw-model').value=s.model;
  $('#lw-private').checked=read(CONTEXT_KEY,false)===true;
  $('#lw-scope').value=read(CONTEXT_SCOPE_KEY,'all')||'all';
  refreshProviderUI();

  trigger.addEventListener('click',()=>setOpen(!s.open));
  $('#lw-close').addEventListener('click',()=>setOpen(false));
  $('#lw-settings-btn').addEventListener('click',()=>setSettings(!s.settings));
  $('#lw-settings-close').addEventListener('click',()=>setSettings(false));
  $('#lw-log-btn').addEventListener('click',()=>showLog(!s.log));
  $('#lw-log-back').addEventListener('click',()=>showLog(false));
  $('#lw-private').addEventListener('change',()=>{persistContextPreference();refreshDirectorMeta();});
  $('#lw-scope').addEventListener('change',()=>{persistContextPreference();refreshDirectorMeta();});
  $('#lw-save').addEventListener('change',refreshDirectorMeta);
  $('#lw-provider').addEventListener('change',()=>{
    s.keyChecked=false;s.activeProvider='';s.activeModel='';
    rememberConfig();refreshProviderUI();status('Proveedor modificado · pendiente de prueba','warn');
  });
  $('#lw-model').addEventListener('input',()=>{
    s.keyChecked=false;s.modelAnswered=false;s.activeModel='';
    rememberConfig();status('Modelo modificado · pendiente de prueba','warn');
  });
  $('#lw-key').addEventListener('input',()=>{
    s.keyChecked=false;s.modelAnswered=false;
    status(keyReady()?'API ingresada · lista para conectar':'Falta API key','idle');
  });
  $('#lw-new').addEventListener('click',()=>{
    if(s.messages.length&&!confirm('¿Comenzar otra conversación? Exporta la actual si quieres conservarla.'))return;
    s.messages=[];s.sessionId=crypto.randomUUID();s.turnIndex=0;s.lastArchiveId=null;s.archiveState='Listo';
    renderMessages();renderWelcome();feedback('Nueva conversación. Se abrió una nueva sesión de archivo. La configuración del proveedor se conserva; la API key no se guarda al recargar.');
  });
  $('#lw-export-chat').addEventListener('click',exportConversation);
  $('#lw-verify').addEventListener('click',verifyConnection);
  $('#lw-send').addEventListener('click',send);
  $('#lw-composer').addEventListener('keydown',e=>{
    if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send();}
  });
  $('#lw-google').addEventListener('click',()=>{
    setOpen(false);
    document.querySelector('[data-view="territory"]')?.click();
    setTimeout(()=>$('#google-text-query')?.focus(),100);
  });
  $('#lw-add-record').addEventListener('click',()=>{
    const prompt=$('#lw-manual').value.trim();
    if(prompt.length<3){feedback('Escribe una solicitud para guardar.',true);return;}
    const list=read(LOG_KEY,[]);
    save(LOG_KEY,[{id:crypto.randomUUID(),at:new Date().toISOString(),kind:'solicitud manual',prompt,status:'pendiente · no ejecutada',source:'LINK WORLD'},...list].slice(0,80));
    $('#lw-manual').value='';renderLog();
  });
  $('#lw-export-log').addEventListener('click',()=>{
    const b=new Blob([JSON.stringify(read(LOG_KEY,[]),null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='link-world-registro-'+day()+'.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  });
  $('#lw-clear-log').addEventListener('click',()=>{
    if(!confirm('¿Borrar el registro local de este navegador?'))return;
    localStorage.removeItem(LOG_KEY);renderLog();
  });

  renderWelcome();refreshDirectorMeta();
}
function renderWelcome(){
  if(s.messages.length)return;
  const t=$('#lw-transcript');t.innerHTML=
    '<div class="lw-welcome">'+
      '<div class="lw-welcome-mark"><img src="/link-world-mark.svg" alt=""></div>'+
      '<div class="lw-eyebrow">DIRECTOR IA / LINK WORLD</div>'+
      '<h3>¿Qué quieres entender o construir?</h3>'+
      '<p>El Director conoce la lógica del ecosistema LINK. Con contexto autorizado puede cruzar negocios, clientes, productos, relaciones, conversión y actividad real sin exponerte la mecánica interna.</p>'+
      '<div class="lw-starters">'+
        '<button type="button" data-start="Revisa un negocio real de LINK WORLD. Dime qué sabemos, qué no sabemos y qué deberíamos resolver a continuación."><b>01</b><span><strong>Revisar un negocio</strong><small>Hechos, vacíos y próximos pasos.</small></span></button>'+
        '<button type="button" data-start="Quiero diseñar un producto dentro de LINK WORLD. Ayúdame a definir oferta, operación, economía y datos faltantes antes de registrarlo."><b>02</b><span><strong>Diseñar un producto</strong><small>Oferta, operación y economía.</small></span></button>'+
        '<button type="button" data-start="Analiza relaciones posibles entre negocios reales de LINK WORLD y explica qué conexión tendría sentido, sin inventar datos."><b>03</b><span><strong>Conectar negocios</strong><small>Relaciones y oportunidades reales.</small></span></button>'+
        '<button type="button" data-start="Quiero preparar un cambio para LINK WORLD. Ordénalo como: estado actual, cambio propuesto, impacto, datos necesarios y acción que debo aprobar."><b>04</b><span><strong>Preparar un cambio</strong><small>De idea a decisión verificable.</small></span></button>'+
      '</div>'+
      '<div class="lw-welcome-flow"><span><b>Proveedor</b><small>dónde corre</small></span><i>→</i><span><b>Modelo</b><small>cuál usas</small></span><i>→</i><span><b>API</b><small>tu acceso</small></span><i>→</i><span><b>Director</b><small>conversa</small></span></div>'+
    '</div>';
  t.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>{
    $('#lw-composer').value=b.dataset.start;$('#lw-composer').focus();
    if(!configReady())setSettings(true);
  }));
}
export function mountDirector(contextProvider){
  getContext=contextProvider||(()=>({}));
  render();
  document.addEventListener('linkworld:director-prompt',event=>{
    const prompt=String(event.detail?.prompt||'').trim().slice(0,3500);
    setOpen(true);showLog(false);setSettings(false);
    if(prompt){
      $('#lw-composer').value=prompt;
      feedback('Consulta preparada desde LINK WORLD. Revísala y envíala cuando quieras.');
    }
    $('#lw-composer').focus();
  });
}
