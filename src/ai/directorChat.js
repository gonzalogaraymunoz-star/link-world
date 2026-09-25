// LINK WORLD · full-screen conversational Director. User-owned key, explicit context, no paid-model fallback.
import { readDirectorAppContext } from '../world/bridge.js';

const URL='https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL='nvidia/nemotron-3-ultra-550b-a55b:free';
const MODEL_KEY='linkworld_ai_public_config_v1';
const LOG_KEY='linkworld_local_requests_v1';
const $=(q,root=document)=>root.querySelector(q);
const safe=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
const freeModel=s=>s==='openrouter/free'||/^[A-Za-z0-9._/-]+:free$/.test(s);
const stamp=()=>new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});
const day=()=>new Date().toISOString().slice(0,10);
const stored=read(MODEL_KEY,{});
const s={open:false,settings:false,log:false,busy:false,checking:false,keyChecked:false,
  modelAnswered:false,model:freeModel(stored.model)?stored.model:DEFAULT_MODEL,
  messages:[],history:[],lastStatus:'Sin conectar',context:null,activeModel:'',keyReady:false};
let getContext=()=>({});

function isKeyPresent(){return /^sk-or-[A-Za-z0-9_-]{12,}$/.test($('#lw-key')?.value.trim()||'');}
function model(){return $('#lw-model')?.value.trim()||'';}
function rememberModel(){
  const current=model();
  if(freeModel(current)){s.model=current;save(MODEL_KEY,{url:URL,model:current});return true;}
  return false;
}
function refreshDirectorMeta(){
  const keyState=$('#lw-key-state');
  if(keyState)keyState.textContent=s.keyChecked?'Verificada':isKeyPresent()?'Ingresada · sin probar':'No conectada';
  const modelState=$('#lw-model-state');
  if(modelState)modelState.textContent=s.activeModel||model()||s.model;
  const contextState=$('#lw-context-state');
  if(contextState){
    const enabled=$('#lw-private')?.checked;
    const scope=$('#lw-scope')?.value;
    contextState.textContent=enabled?(scope==='all'?'Autorizado · hasta 15 negocios':'Autorizado · selección resumida'):'No compartido';
    contextState.dataset.active=enabled?'true':'false';
  }
  const saveState=$('#lw-save-state');
  if(saveState)saveState.textContent=$('#lw-save')?.checked?'Registro local activo':'No se guarda';
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
  if(open){s.log=false;showLog(false);$('#lw-key').focus();}
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
function scrollChat(){
  const t=$('#lw-transcript');if(t)t.scrollTop=t.scrollHeight;
}
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
    if(message.model){
      const meta=document.createElement('small');meta.className='lw-message-meta';
      meta.textContent=message.model+(message.tokens?' · '+message.tokens+' tokens de salida':'')+' · propuesta, no ejecución';
      body.append(meta);
    }
    el.append(icon,body);
    t.append(el);
  }
  scrollChat();
}
function showLog(show){
  s.log=show;
  $('#lw-log').classList.toggle('hidden',!show);
  $('#lw-transcript').classList.toggle('hidden',show);
  $('#lw-compose').classList.toggle('hidden',show);
  $('#lw-log-btn').setAttribute('aria-pressed',String(show));
  if(show){setSettings(false);renderLog();}
  else scrollChat();
}
function logEntry(item){
  const list=read(LOG_KEY,[]);
  const entry={id:crypto.randomUUID(),at:new Date().toISOString(),source:'Director IA',
    kind:'conversación',prompt:item.prompt.slice(0,3500),answer:item.answer.slice(0,12500),
    status:'respuesta · no ejecutada',model:item.model};
  if(!save(LOG_KEY,[entry,...list].slice(0,80)))feedback('El navegador no pudo guardar la conversación.',true);
}
function renderLog(){
  const list=$('#lw-log-items');if(!list)return;
  const items=read(LOG_KEY,[]);
  list.innerHTML=items.length?items.map(item=>
    '<article class="lw-log-item"><small>'+safe(item.kind||'solicitud')+' · '+safe(new Date(item.at).toLocaleString('es-CL'))+'</small>'+
    '<strong>'+safe(item.prompt||'Solicitud')+'</strong><p>'+safe(item.answer||item.status||'Pendiente')+'</p></article>'
  ).join(''):'<p class="lw-hint">Todavía no hay solicitudes guardadas aquí. Conversar no guarda información automáticamente.</p>';
}
function historyForRequest(){
  return s.messages.filter(m=>m.role==='user'||m.role==='assistant').slice(-12)
    .map(m=>({role:m.role,content:m.text.slice(0,1100)}));
}
async function verifyKey(){
  if(s.checking||s.busy)return;
  const key=$('#lw-key').value.trim();
  if(!isKeyPresent()){feedback('Pega una clave OpenRouter completa que empiece con sk-or-.',true);status('Clave incompleta','error');return;}
  if(!rememberModel()){feedback('El modelo debe ser openrouter/free o terminar en :free.',true);return;}
  s.checking=true;$('#lw-verify').disabled=true;
  feedback('Comprobando OpenRouter sin generar texto…');status('Comprobando clave…','busy');
  try{
    const r=await fetch('/api/director',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'check',mode:'strict-zero',apiKey:key,url:URL,model:model()})});
    const data=await r.json().catch(()=>({error:'No llegó una respuesta válida del servidor.'}));
    if(!r.ok)throw Error(data.error||'La verificación falló.');
    s.keyChecked=true;status('Clave verificada · modelo por probar','ok');
    feedback('OpenRouter aceptó la clave. Ya puedes conversar: el modelo se confirma en la primera respuesta.');
    $('#lw-connect-note').textContent='Clave aceptada por OpenRouter. '+(data.isFreeTier?'Cuenta reportada como Free.':'El proveedor no confirmó que la cuenta sea Free.')+' La clave NO se guarda.';
    setSettings(false);$('#lw-composer').focus();
  }catch(e){
    s.keyChecked=false;status('Verificación fallida · puedes probar el chat','warn');
    feedback((e.message||'No fue posible verificar.')+' Puedes enviar un mensaje igualmente para comprobar el modelo.',true);
    $('#lw-connect-note').textContent='La verificación de cuenta no es obligatoria para intentar una conversación con un modelo :free.';
  }finally{s.checking=false;$('#lw-verify').disabled=false;refreshDirectorMeta();}
}
async function send(){
  if(s.busy||s.checking)return;
  const prompt=$('#lw-composer').value.trim();
  if(prompt.length<3||prompt.length>3500){feedback('Escribe un mensaje de entre 3 y 3500 caracteres.',true);return;}
  if(!isKeyPresent()){setSettings(true);status('Falta API key','warn');feedback('Pega tu clave en Conexión y después vuelve al chat. Tu mensaje se conserva.',true);return;}
  if(!rememberModel()){setSettings(true);feedback('Usa un modelo terminado en :free u openrouter/free.',true);return;}
  setSettings(false);feedback('');
  const previous=historyForRequest(),key=$('#lw-key').value.trim();
  addMessage('user',prompt);
  const typing=addMessage('assistant','Pensando con '+model()+'…',{pending:true});
  $('#lw-composer').value='';s.busy=true;
  $('#lw-send').disabled=true;$('#lw-composer').disabled=true;
  status('Pensando · modelo gratuito','busy');
  try{
    const context=getContext()||{};
    const payload={
      strategy:context.strategy||'',cell:context.cell||'',mission:context.mission||'',
      demoSnapshot:(context.demoSnapshot||'').slice(0,3200),
      appDataStatus:'Datos LINK privados no compartidos con OpenRouter.'
    };
    if($('#lw-private').checked){
      feedback('Leyendo el contexto autorizado de LINK…');
      const scope=$('#lw-scope').value;
      const result=await readDirectorAppContext(scope);
      payload.approvedAppSnapshot=result.snapshot;
      payload.appDataStatus='LINK autorizado: '+result.count+' negocios; '+result.scope+
        (result.truncated?'; snapshot recortado por límite':'');
    }
    feedback('');
    const response=await fetch('/api/director',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'chat',url:URL,model:model(),apiKey:key,mode:'strict-zero',
        prompt,messages:previous,context:payload})});
    const answer=await response.json().catch(()=>({error:'El servidor no devolvió una respuesta interpretable.'}));
    if(!response.ok)throw Error(answer.error||'No se pudo consultar el modelo.');
    typing.text=answer.answer;typing.pending=false;typing.model=answer.model||model();
    typing.tokens=answer.usage?.outputTokens||0;
    s.modelAnswered=true;s.keyChecked=true;s.activeModel=typing.model;
    status('Conectado · '+typing.model,'ok');
    $('#lw-connect-note').textContent='Última respuesta recibida de '+typing.model+'. Ninguna operación real se ejecutó.';
    if($('#lw-save').checked)logEntry({prompt,answer:answer.answer,model:typing.model});
  }catch(e){
    typing.role='error';typing.pending=false;
    typing.text=(e.message||'No se recibió respuesta.')+'\n\nNo se hizo un segundo intento ni se seleccionó un modelo de pago.';
    $('#lw-composer').value=prompt;
    status('Consulta fallida · ver detalle','warn');
    feedback(e.message||'No se recibió respuesta.',true);
  }finally{
    s.busy=false;$('#lw-send').disabled=false;$('#lw-composer').disabled=false;
    renderMessages();refreshDirectorMeta();$('#lw-composer').focus();
  }
}
function exportConversation(){
  const data={title:'LINK WORLD / conversación local no sincronizada',exported_at:new Date().toISOString(),
    model:model(),messages:s.messages.filter(m=>m.role!=='error').map(m=>({role:m.role,content:m.text}))};
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
      '<div class="lw-identity"><span class="lw-symbol"><img src="/link-world-mark.svg" alt=""></span><div><span class="lw-eyebrow">LINK WORLD / INTELIGENCIA</span><h2>Director IA</h2><small>Centro de decisión, análisis y construcción</small></div></div>',
      '<div class="lw-top-actions"><button id="lw-new" type="button">Nueva conversación</button><button id="lw-export-chat" type="button">Exportar</button><button id="lw-close" type="button" aria-label="Cerrar Director">×</button></div>',
    '</header>',
    '<div class="lw-director-shell">',
      '<aside class="lw-director-rail lw-director-guide">',
        '<section class="lw-rail-card lw-rail-intro"><span class="lw-rail-kicker">CÓMO TRABAJA</span><h3>Entender antes de actuar.</h3><p>El Director organiza contexto, separa hechos de vacíos y prepara una acción verificable. No convierte una idea en dato real por sí solo.</p></section>',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">FLUJO</span><ol class="lw-director-flow"><li><b>01</b><span><strong>Entiende</strong><small>Qué quieres resolver.</small></span></li><li><b>02</b><span><strong>Lee contexto</strong><small>Solo lo que autorizas.</small></span></li><li><b>03</b><span><strong>Analiza</strong><small>Hechos, vacíos y relaciones.</small></span></li><li><b>04</b><span><strong>Propone</strong><small>Un siguiente paso concreto.</small></span></li><li><b>05</b><span><strong>Tú decides</strong><small>No hay escritura automática.</small></span></li></ol></section>',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">PUEDES PEDIRLE</span><div class="lw-capability-list"><span>Investigar un negocio</span><span>Diseñar un producto</span><span>Conectar negocios</span><span>Detectar información faltante</span><span>Preparar una solicitud</span><span>Ordenar una decisión</span></div></section>',
        '<section class="lw-rail-card lw-rule-card"><strong>Regla LINK WORLD</strong><p>Supabase es la fuente de verdad. Conversar no modifica datos. Google se usa manualmente y un resultado externo no se vuelve negocio LINK automáticamente.</p></section>',
      '</aside>',
      '<section class="lw-director-center">',
        '<div class="lw-status-line"><span id="lw-status" data-kind="idle">Sin conectar</span><span class="lw-proposal-note">RESPUESTA = PROPUESTA · NO EJECUCIÓN</span></div>',
        '<div id="lw-alert" class="lw-alert hidden" role="status"></div>',
        '<main id="lw-transcript" class="lw-transcript" aria-live="polite"></main>',
        '<section id="lw-log" class="lw-log hidden"><div class="lw-log-head"><div><span class="lw-rail-kicker">REGISTRO LOCAL</span><h3>Conversaciones y solicitudes guardadas</h3></div><button id="lw-log-back" type="button">Volver al chat</button></div><p class="lw-hint">Este registro vive en este navegador. No sincroniza automáticamente con LINK WORLD.</p><textarea id="lw-manual" maxlength="1200" rows="3" placeholder="Registrar una solicitud local sin usar IA…"></textarea><button id="lw-add-record" class="lw-primary" type="button">Guardar solicitud local</button><div class="lw-log-tools"><button id="lw-export-log" type="button">Exportar registro</button><button id="lw-clear-log" type="button">Borrar registro</button></div><div id="lw-log-items"></div></section>',
        '<footer id="lw-compose" class="lw-compose"><div class="lw-compose-label"><span>Habla con el Director</span><small>Enter para enviar · Shift + Enter para salto de línea</small></div><div class="lw-composer-row"><textarea id="lw-composer" maxlength="3500" rows="3" aria-label="Escribe tu mensaje al Director" placeholder="Ej: revisa LINK Cupones y dime qué sabemos, qué falta y cuál debería ser el siguiente paso…"></textarea><button id="lw-send" class="lw-primary" type="button" aria-label="Enviar mensaje">↑</button></div><div id="lw-feedback" class="lw-feedback hidden" role="status"></div></footer>',
      '</section>',
      '<aside class="lw-director-rail lw-director-context">',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">ESTADO</span><div class="lw-meta-list"><div><span>Conexión</span><strong id="lw-key-state">No conectada</strong></div><div><span>Modelo</span><strong id="lw-model-state">—</strong></div><div><span>Contexto LINK</span><strong id="lw-context-state">No compartido</strong></div><div><span>Memoria local</span><strong id="lw-save-state">No se guarda</strong></div></div></section>',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">CONTEXTO QUE VERÁ</span><label class="lw-context-toggle"><input type="checkbox" id="lw-private"><span><strong>Incluir datos de LINK</strong><small>Actívalo solo cuando quieras que lea contexto real autorizado.</small></span></label><label class="lw-scope-label" for="lw-scope">ALCANCE</label><select id="lw-scope" aria-label="Alcance de investigación"><option value="selected">Selección resumida · hasta 3 negocios</option><option value="all">Resumen global · hasta 15 negocios</option></select></section>',
        '<section class="lw-rail-card"><span class="lw-rail-kicker">FUENTES</span><div class="lw-source-list"><div><i></i><span><strong>Conversación</strong><small>Siempre disponible en esta sesión.</small></span></div><div><i></i><span><strong>LINK WORLD</strong><small>Solo cuando autorizas datos.</small></span></div><div><i></i><span><strong>Google</strong><small>Manual. Nunca se consulta en silencio.</small></span></div></div></section>',
        '<section class="lw-rail-card lw-rail-actions"><span class="lw-rail-kicker">HERRAMIENTAS</span><button id="lw-settings-btn" type="button" aria-expanded="false">Conexión y modelo <span>→</span></button><button id="lw-log-btn" type="button" aria-pressed="false">Registro local <span>→</span></button><button id="lw-google" type="button">Abrir territorio / Google <span>→</span></button><label class="lw-save-toggle"><input type="checkbox" id="lw-save"><span>Guardar respuestas en registro local</span></label></section>',
        '<section id="lw-settings" class="lw-settings hidden"><div class="lw-settings-head"><div><span class="lw-rail-kicker">CONEXIÓN</span><strong>OpenRouter</strong><small>La clave vive solo en esta pestaña y no se guarda en LINK WORLD.</small></div><button id="lw-settings-close" type="button" aria-label="Cerrar configuración">×</button></div><label for="lw-model">MODELO · GRATUITO</label><input id="lw-model" type="text" spellcheck="false" maxlength="100"><label for="lw-key">API KEY OPENROUTER</label><input id="lw-key" type="password" spellcheck="false" autocomplete="new-password" placeholder="sk-or-v1-…"><div class="lw-settings-buttons"><button id="lw-verify" type="button" class="lw-primary">Comprobar clave</button><button id="lw-use" type="button">Usar configuración</button><button id="lw-forget" type="button">Olvidar clave</button></div><small id="lw-connect-note">Usa un modelo :free. No existe fallback automático a modelos pagados.</small></section>',
      '</aside>',
    '</div>'
  ].join('');
  document.body.append(panel);
  $('#lw-model').value=s.model;

  trigger.addEventListener('click',()=>setOpen(!s.open));
  $('#lw-close').addEventListener('click',()=>setOpen(false));
  $('#lw-settings-btn').addEventListener('click',()=>setSettings(!s.settings));
  $('#lw-settings-close').addEventListener('click',()=>setSettings(false));
  $('#lw-log-btn').addEventListener('click',()=>showLog(!s.log));
  $('#lw-log-back').addEventListener('click',()=>showLog(false));
  $('#lw-private').addEventListener('change',refreshDirectorMeta);
  $('#lw-scope').addEventListener('change',refreshDirectorMeta);
  $('#lw-save').addEventListener('change',refreshDirectorMeta);
  $('#lw-new').addEventListener('click',()=>{
    if(s.messages.length&&!confirm('¿Comenzar otra conversación? Exporta la actual si quieres conservarla.'))return;
    s.messages=[];renderMessages();renderWelcome();feedback('Nueva conversación. La clave de esta pestaña no se borró.');
  });
  $('#lw-export-chat').addEventListener('click',exportConversation);
  $('#lw-model').addEventListener('input',()=>{
    s.keyChecked=false;s.modelAnswered=false;
    status('Modelo modificado · pendiente de prueba','warn');rememberModel();refreshDirectorMeta();
  });
  $('#lw-key').addEventListener('input',()=>{
    s.keyChecked=false;s.modelAnswered=false;
    status(isKeyPresent()?'Clave ingresada · pendiente de prueba':'Sin clave','idle');refreshDirectorMeta();
  });
  $('#lw-verify').addEventListener('click',verifyKey);
  $('#lw-use').addEventListener('click',()=>{
    if(!rememberModel()){feedback('El modelo debe terminar en :free o ser openrouter/free.',true);return;}
    status(isKeyPresent()?'Clave ingresada · puedes conversar':'Sin clave','idle');
    setSettings(false);$('#lw-composer').focus();
  });
  $('#lw-forget').addEventListener('click',()=>{
    $('#lw-key').value='';s.keyChecked=false;s.modelAnswered=false;
    status('Sin clave','idle');feedback('Clave borrada de esta pestaña.');refreshDirectorMeta();
  });
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
    save(LOG_KEY,[{id:crypto.randomUUID(),at:new Date().toISOString(),kind:'solicitud manual',
      prompt,status:'pendiente · no ejecutada',source:'LINK WORLD'},...list].slice(0,80));
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
      '<p>Usa este espacio para pensar sobre el ecosistema completo. El Director puede leer contexto autorizado, ordenar información y convertir una conversación en un siguiente paso claro.</p>'+
      '<div class="lw-starters">'+
        '<button type="button" data-start="Revisa un negocio real de LINK WORLD. Dime qué sabemos, qué no sabemos y qué deberíamos resolver a continuación."><b>01</b><span><strong>Revisar un negocio</strong><small>Hechos, vacíos y próximos pasos.</small></span></button>'+
        '<button type="button" data-start="Quiero diseñar un producto dentro de LINK WORLD. Ayúdame a definir oferta, operación, economía y datos faltantes antes de registrarlo."><b>02</b><span><strong>Diseñar un producto</strong><small>Oferta, operación y economía.</small></span></button>'+
        '<button type="button" data-start="Analiza relaciones posibles entre negocios reales de LINK WORLD y explica qué conexión tendría sentido, sin inventar datos."><b>03</b><span><strong>Conectar negocios</strong><small>Relaciones y oportunidades reales.</small></span></button>'+
        '<button type="button" data-start="Quiero preparar un cambio para LINK WORLD. Ordénalo como: estado actual, cambio propuesto, impacto, datos necesarios y acción que debo aprobar."><b>04</b><span><strong>Preparar un cambio</strong><small>De idea a decisión verificable.</small></span></button>'+
      '</div>'+
      '<div class="lw-welcome-flow"><span><b>Contexto</b><small>qué existe</small></span><i>→</i><span><b>Análisis</b><small>qué significa</small></span><i>→</i><span><b>Propuesta</b><small>qué haríamos</small></span><i>→</i><span><b>Decisión</b><small>tú autorizas</small></span></div>'+
    '</div>';
  t.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>{
    $('#lw-composer').value=b.dataset.start;$('#lw-composer').focus();
    if(!isKeyPresent())setSettings(true);
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
