import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './connection.js';
import {buildCronJournal,statusLabel} from './cronJournalModel.js';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
const NAMESPACE_ID='9ed4b7de-076f-458c-bdbc-97fd633e1841';

const safe=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const formatDate=value=>{
  if(!value)return '—';
  try{return new Intl.DateTimeFormat('es-CL',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value+'T12:00:00-03:00')).replace('.','');}
  catch{return String(value);}
};
const formatUpdated=value=>{
  if(!value)return 'Sin hora registrada';
  try{return new Intl.DateTimeFormat('es-CL',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Santiago'}).format(new Date(value));}
  catch{return String(value);}
};
const listMarkup=(items,empty='Sin evidencia registrada.')=>{
  const rows=(items||[]).filter(Boolean);
  if(!rows.length)return '<p class="cj-empty">'+safe(empty)+'</p>';
  return '<ul class="cj-readable-list">'+rows.map(item=>{
    const parts=String(item).split(' · ').map(x=>x.trim()).filter(Boolean);
    const primary=parts.shift()||'Dato';
    const meta=parts.length?'<div class="cj-readable-meta">'+parts.map(part=>{
      const i=part.indexOf(':');
      if(i>0){
        const label=part.slice(0,i).trim(),value=part.slice(i+1).trim();
        const codeLike=/^[A-Z0-9][A-Z0-9_:\-.]{4,}$/.test(value);
        return '<span'+(codeLike?' class="is-code"':'')+'><b>'+safe(label)+'</b>'+safe(value)+'</span>';
      }
      return '<span>'+safe(part)+'</span>';
    }).join('')+'</div>':'';
    return '<li><strong>'+safe(primary)+'</strong>'+meta+'</li>';
  }).join('')+'</ul>';
};
const field=(label,value)=>value?'<div class="cj-field"><span>'+safe(label)+'</span><p>'+safe(value)+'</p></div>':'';
const statusClass=status=>'status-'+String(status||'UNKNOWN').toLowerCase().replaceAll('_','-');

async function isMember(){
  const {data:{session}}=await db.auth.getSession();
  if(!session)return false;
  const {data,error}=await db.rpc('link_world_is_member');
  return !error&&data===true;
}

async function readArchitecture(){
  const {data,error}=await db.from('deep_memories')
    .select('id,memory_key,structured_data,metadata,updated_at')
    .eq('namespace_id',NAMESPACE_ID)
    .eq('memory_key','link_world:cron_bitacora_v1')
    .is('archived_at',null)
    .maybeSingle();
  if(error)throw error;
  return data;
}

async function readGameFacts(){
  const {data,error}=await db.from('event_bus')
    .select('id,event_type,payload,occurred_at')
    .eq('source_provider','link_game')
    .order('occurred_at',{ascending:false})
    .limit(80);
  if(error)throw error;
  return data||[];
}

async function readGameStates(){
  const {data,error}=await db.from('link_game_business_state_v')
    .select('business_id,name,temperature,conversion_percent,game_state,game_state_label,awaiting_evidence_count,last_verified_action_at,next_action_due_at,overdue')
    .order('conversion_percent',{ascending:false});
  if(error)throw error;
  return data||[];
}

function gameIcon(type=''){
  if(type.includes('converted'))return '💰';
  if(type.includes('critical_frozen'))return '🔴🧊';
  if(type.includes('red_close'))return '🔴';
  if(type.includes('frozen'))return '🧊';
  if(type.includes('heated'))return '🔥';
  if(type.includes('cooled'))return '❄️';
  if(type.includes('verified'))return '✅';
  return '•';
}
function gameFactsMarkup(state){
  const events=(state.gameFacts||[]).slice(0,12);
  const states=state.gameStates||[];
  if(!events.length&&!states.length)return '';
  const stateCards=states.map(s=>'<article class="cj-game-state game-'+safe(s.game_state)+'"><header><b>'+safe(s.name)+'</b><span>'+safe(s.game_state_label)+'</span></header><div><strong>'+Math.round(Number(s.temperature||0))+'°</strong><i>·</i><strong>'+Math.round(Number(s.conversion_percent||0))+'%</strong><small>conversión</small></div>'+(Number(s.awaiting_evidence_count||0)?'<p>'+s.awaiting_evidence_count+' acción(es) esperan evidencia.</p>':'')+'</article>').join('');
  const eventRows=events.map(e=>{
    const p=e.payload||{};
    const temp=p.temperature!=null?Math.round(Number(p.temperature))+'°':'';
    const conv=p.conversion_percent!=null?Math.round(Number(p.conversion_percent))+'%':'';
    return '<article class="cj-game-event"><span>'+gameIcon(e.event_type)+'</span><div><strong>'+safe(p.business_name||p.title||'LINK')+'</strong><p>'+safe(p.state_label||p.title||String(e.event_type).replaceAll('.',' · '))+'</p><small>'+safe([temp,conv,formatUpdated(e.occurred_at)].filter(Boolean).join(' · '))+'</small></div></article>';
  }).join('');
  return '<section class="cj-game-history"><div class="cj-section-title"><span>HECHOS DEL JUEGO</span><h2>Solo avanza lo que tiene evidencia.</h2><p>Temperatura, cierres, enfriamientos y conversiones vienen del mismo motor verificable de LINK.</p></div><div class="cj-game-states">'+stateCards+'</div><div class="cj-game-events">'+eventRows+'</div></section>';
}

async function readExecutions(registry){
  const kinds=[...new Set((registry||[]).map(item=>item.source_kind).filter(Boolean))];
  if(!kinds.length)return [];
  const {data,error}=await db.from('deep_memories')
    .select('id,memory_key,kind,source,structured_data,metadata,updated_at')
    .eq('namespace_id',NAMESPACE_ID)
    .is('archived_at',null)
    .in('kind',kinds)
    .order('updated_at',{ascending:false})
    .limit(240);
  if(error)throw error;
  return data||[];
}

function gateMarkup(message='Esta bitácora contiene información operativa interna de LINK.'){
  return '<div class="cj-gate"><div class="cj-gate-mark">◎</div><span class="cj-eyebrow">BITÁCORA PRIVADA</span><h1>La historia operativa de LINK.</h1><p>'+safe(message)+'</p><form data-cj-login><label>Correo LINK<input name="email" type="email" autocomplete="username" required></label><label>Contraseña<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">Abrir Bitácora</button><small>No crea usuarios. Usa una cuenta LINK existente.</small></form></div>';
}

function evolutionMarkup(items){
  const rows=(items||[]).slice(0,6);
  if(!rows.length)return '<p class="cj-empty">Todavía no hay transiciones para comparar.</p>';
  return '<div class="cj-evolution-strip">'+rows.map(item=>{
    const from=item.stateFrom||'Estado inicial no descrito';
    const to=item.closingState||item.nextState||'Siguiente estado pendiente';
    return '<button type="button" data-cj-open="'+safe(item.id)+'"><span>'+safe(formatDate(item.date))+'</span><div><b>'+safe(from)+'</b><i>→</i><strong>'+safe(to)+'</strong></div></button>';
  }).join('')+'</div>';
}

function cardMarkup(item){
  const money=item.money.length?item.money.length+' señal'+(item.money.length===1?'':'es'):'—';
  return '<button class="cj-execution-card" type="button" data-cj-open="'+safe(item.id)+'">'+
    '<div class="cj-card-head"><span>'+safe(formatDate(item.date))+'</span><b class="'+statusClass(item.status)+'">'+safe(statusLabel(item.status))+'</b></div>'+
    '<h3>'+safe(item.title||item.mission)+'</h3>'+
    '<p>'+safe(item.mission)+'</p>'+
    '<div class="cj-card-metrics"><span><b>'+item.evidence.length+'</b> evidencias</span><span><b>'+item.blockers.length+'</b> bloqueos</span><span><b>'+safe(money)+'</b> dinero</span></div>'+
    '<div class="cj-card-flow"><span>08:00</span><i></i><span>14:00</span><i></i><span>21:00</span></div>'+
    '<small>Actualizado '+safe(formatUpdated(item.updatedAt))+' · Abrir informe →</small></button>';
}

function listViewMarkup(state){
  const model=state.model;
  const group=model.groups.find(item=>item.cron_id===state.cronId)||model.groups[0];
  const items=group?.items||[];
  const tabs=model.groups.map(item=>'<button type="button" data-cj-cron="'+safe(item.cron_id)+'" class="'+(item.cron_id===group?.cron_id?'active':'')+'"><span>'+safe(item.label)+'</span><b>'+item.items.length+'</b></button>').join('');
  return '<div class="cj-shell">'+
    '<header class="cj-top"><div><span class="cj-eyebrow">LINK WORLD / BITÁCORA</span><h1>Cómo está evolucionando el sistema.</h1><p>Cada ejecución es un capítulo verificable: estado, misión, trayectoria, resultado y aprendizaje.</p></div><div class="cj-top-actions"><button type="button" data-cj-refresh>↻ Actualizar</button><button type="button" data-cj-signout>Cerrar sesión</button></div></header>'+
    '<section class="cj-summary"><div><strong>'+model.summary.cronCount+'</strong><span>crons registrados</span></div><div><strong>'+model.summary.executionCount+'</strong><span>ejecuciones</span></div><div><strong>'+model.summary.closedCount+'</strong><span>cierres</span></div><div><strong>'+model.summary.blockedCount+'</strong><span>bloqueadas</span></div></section>'+
    gameFactsMarkup(state)+
    '<section class="cj-evolution"><div class="cj-section-title"><span>EVOLUCIÓN RECIENTE</span><h2>Estado → movimiento → siguiente estado</h2></div>'+evolutionMarkup(items)+'</section>'+
    '<div class="cj-workspace"><aside class="cj-crons"><span class="cj-eyebrow">CRONS</span>'+tabs+'</aside><section class="cj-list"><div class="cj-list-head"><div><span class="cj-eyebrow">EJECUCIONES</span><h2>'+safe(group?.label||'Cron')+'</h2></div><small>'+items.length+' capítulos persistidos</small></div><div class="cj-cards">'+(items.length?items.map(cardMarkup).join(''):'<div class="cj-empty-panel"><h3>Sin ejecuciones.</h3><p>Cuando este cron persista su primer registro aparecerá aquí automáticamente.</p></div>')+'</div></section></div>'+
    '<footer class="cj-foot">Fuente de verdad: deep_memories · La vista no modifica la memoria ni decide prioridades.</footer></div>';
}

function phaseState(item,phase){
  if(phase==='opening')return Boolean(item.mission||item.stateFrom||item.criterion);
  if(phase==='control')return Boolean(item.progress||item.evidence.length||item.blockers.length);
  return item.isClosed;
}

function detailViewMarkup(item){
  const target=item.closingState||item.nextState||'Siguiente estado aún no persistido';
  const title=item.title||item.mission;
  return '<div class="cj-detail">'+
    '<header class="cj-detail-head"><button type="button" data-cj-back>← Bitácora</button><div><span class="cj-eyebrow">LINK · DIRECCIÓN DIARIA / '+safe(formatDate(item.date))+'</span><h1>'+safe(title)+'</h1></div><b class="cj-status '+statusClass(item.status)+'">'+safe(statusLabel(item.status))+'</b></header>'+
    '<section class="cj-transition"><div><span>ESTADO DE PARTIDA</span><p>'+safe(item.stateFrom||'No descrito')+'</p></div><i>→</i><div class="is-mission"><span>MISIÓN</span><p>'+safe(item.mission)+'</p></div><i>→</i><div><span>'+(item.closingState?'ESTADO FINAL':'SIGUIENTE ESTADO')+'</span><p>'+safe(target)+'</p></div></section>'+
    '<section class="cj-phases">'+
      '<article class="cj-phase '+(phaseState(item,'opening')?'has-data':'is-pending')+'"><header><span>08:00</span><div><b>COMMAND</b><small>Hacia dónde debe moverse LINK</small></div></header>'+field('MISIÓN',item.mission)+field('CRITERIO DE TERMINADO',item.criterion)+field('PRIMER BLOQUE',item.firstBlock)+field('PRIORIDAD 2',item.priority2)+field('PRIORIDAD 3',item.priority3)+'</article>'+
      '<article class="cj-phase '+(phaseState(item,'control')?'has-data':'is-pending')+'"><header><span>14:00</span><div><b>TRAJECTORY</b><small>Si realmente estamos cruzando</small></div></header>'+field('AVANCE REAL',item.progress)+'<div class="cj-split"><div><span>EVIDENCIA</span>'+listMarkup(item.evidence)+'</div><div><span>BLOQUEOS</span>'+listMarkup(item.blockers,'Sin bloqueos persistidos.')+'</div></div></article>'+
      '<article class="cj-phase '+(phaseState(item,'closing')?'has-data':'is-pending')+'"><header><span>21:00</span><div><b>EVOLUTION</b><small>Dónde terminó LINK y qué aprendió</small></div></header>'+(item.isClosed?'<div class="cj-grid-2"><div><span>DINERO / CONVERSIÓN</span>'+listMarkup(item.money,'Sin movimiento económico persistido.')+'</div><div><span>OPERACIÓN</span>'+listMarkup(item.operational,'Sin cambio operacional persistido.')+'</div><div><span>APRENDIZAJE</span>'+listMarkup(item.learning,'Sin aprendizaje de cierre persistido.')+'</div><div><span>DECISIONES</span>'+listMarkup(item.decisions,'Sin decisiones persistidas.')+'</div></div>'+field('ESTADO FINAL',item.closingState)+field('SIGUIENTE ESTADO',item.nextState)+field('PREGUNTA PARA MAÑANA',item.question):'<div class="cj-pending-close"><b>El capítulo sigue abierto.</b><p>El cierre de las 21:00 todavía no está persistido; la Bitácora no lo inventa.</p></div>')+'</article>'+
    '</section>'+
    '<section class="cj-evidence-panel"><div><span class="cj-eyebrow">SOPORTE DE EVOLUCIÓN</span><h2>Qué queda disponible para aprender después</h2></div><div class="cj-grid-2"><div><span>EVIDENCIA ACUMULADA</span>'+listMarkup(item.evidence)+'</div><div><span>DEUDA DE PERSISTENCIA</span>'+listMarkup(item.persistence,'Sin deuda de persistencia registrada.')+'</div></div></section>'+
    '<footer class="cj-foot">'+safe(item.memoryKey)+' · actualizado '+safe(formatUpdated(item.updatedAt))+'</footer></div>';
}

export function mountCronJournal(){
  const root=document.querySelector('#lw-journal');
  const state={opened:false,loading:false,member:false,error:null,architecture:null,model:null,cronId:null,selectedId:null,gameFacts:[],gameStates:[]};

  function render(){
    if(!root)return;
    if(state.loading){root.innerHTML='<div class="cj-loading"><span></span><p>Reconstruyendo Bitácora desde Supabase…</p></div>';return;}
    if(!state.member){root.innerHTML=gateMarkup(state.error||undefined);bind();return;}
    if(state.error){root.innerHTML='<div class="cj-error"><b>No se pudo abrir la Bitácora.</b><p>'+safe(state.error)+'</p><button type="button" data-cj-refresh>Reintentar</button></div>';bind();return;}
    const item=state.model?.executions.find(row=>row.id===state.selectedId);
    root.innerHTML=item?detailViewMarkup(item):listViewMarkup(state);
    bind();
  }

  async function load(){
    if(!state.opened)return;
    state.loading=true;state.error=null;render();
    try{
      state.member=await isMember();
      if(!state.member){state.loading=false;render();return;}
      const architecture=await readArchitecture();
      const registry=architecture?.structured_data?.registered_crons||[];
      const [rows,gameFacts,gameStates]=await Promise.all([
        readExecutions(registry.length?registry:undefined),
        readGameFacts(),
        readGameStates()
      ]);
      state.architecture=architecture;
      state.gameFacts=gameFacts;
      state.gameStates=gameStates;
      state.model=buildCronJournal({architecture,rows});
      if(!state.cronId)state.cronId=state.model.groups[0]?.cron_id||null;
      if(state.selectedId&&!state.model.executions.some(item=>item.id===state.selectedId))state.selectedId=null;
    }catch(error){
      state.error=error?.message||String(error);
    }
    state.loading=false;render();
  }

  async function signIn(form){
    const fd=new FormData(form);
    const email=String(fd.get('email')||'').trim();
    const password=String(fd.get('password')||'');
    state.loading=true;state.error=null;render();
    const {error}=await db.auth.signInWithPassword({email,password});
    if(error){state.loading=false;state.member=false;state.error=error.message;render();return;}
    const allowed=await isMember();
    if(!allowed){
      await db.auth.signOut();
      state.loading=false;state.member=false;state.error='La sesión es válida, pero no pertenece a un miembro activo de LINK.';
      render();return;
    }
    state.member=true;state.loading=false;
    await load();
  }

  function bind(){
    root?.querySelector('[data-cj-login]')?.addEventListener('submit',event=>{event.preventDefault();signIn(event.currentTarget);});
    root?.querySelectorAll('[data-cj-open]').forEach(button=>button.addEventListener('click',()=>{state.selectedId=button.dataset.cjOpen;render();}));
    root?.querySelectorAll('[data-cj-cron]').forEach(button=>button.addEventListener('click',()=>{state.cronId=button.dataset.cjCron;state.selectedId=null;render();}));
    root?.querySelector('[data-cj-back]')?.addEventListener('click',()=>{state.selectedId=null;render();});
    root?.querySelectorAll('[data-cj-refresh]').forEach(button=>button.addEventListener('click',load));
    root?.querySelector('[data-cj-signout]')?.addEventListener('click',async()=>{await db.auth.signOut();state.member=false;state.model=null;state.selectedId=null;render();});
  }

  return {
    open(){state.opened=true;load();},
    close(){state.opened=false;},
    refresh(){return load();}
  };
}
