import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './connection.js';
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const monthName=d=>new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric'}).format(d);
const dayKey=d=>d.toISOString().slice(0,10);
const humanStatus=s=>({IN_PROGRESS:'Avanzando',BLOCKED:'Necesita atención',COMPLETED:'Terminado',PARTIAL:'Avanzó en parte',NOT_COMPLETED:'No se completó',NOT_STARTED:'Aún no comienza'}[s]||'Registrado');
const plain=s=>String(s||'').replaceAll('_',' ').replace(/\b(runtime|webhook|payment intent|payment_intent)\b/gi,'proceso interno');
export function mountCronStation(){
 const root=document.querySelector('#lw-crons'); const state={opened:false,date:new Date(),selected:dayKey(new Date()),crons:[],runs:[],recs:[]};
 async function load(){
  const [c,r,p]=await Promise.all([
   db.from('link_cron_registry').select('*').eq('status','active').order('name'),
   db.from('link_cron_runs').select('*').order('run_at',{ascending:false}).limit(300),
   db.from('link_cron_prompt_recommendations').select('*').eq('status','proposed').order('created_at',{ascending:false})
  ]);
  if(c.error||r.error||p.error){root.innerHTML='<div class="cs-message"><h2>No pudimos abrir CRON.</h2><p>Inicia sesión como miembro de LINK y vuelve a intentar.</p></div>';return}
  state.crons=c.data||[];state.runs=r.data||[];state.recs=p.data||[];render();
 }
 function calendar(){
  const y=state.date.getFullYear(),m=state.date.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),cells=[];
  for(let i=0;i<first.getDay();i++)cells.push('<span></span>');
  for(let n=1;n<=last.getDate();n++){const d=new Date(y,m,n),k=dayKey(d),runs=state.runs.filter(x=>x.run_date===k),needs=runs.some(x=>x.needs_user_action),done=runs.filter(x=>x.status==='COMPLETED').length;
   cells.push('<button class="cs-day '+(state.selected===k?'active ':'')+(runs.length?'has-work':'')+'" data-date="'+k+'"><b>'+n+'</b>'+(runs.length?'<small>'+runs.length+' registro'+(runs.length>1?'s':'')+'</small>':'')+(needs?'<i>Necesita de ti</i>':done?'<i>'+done+' terminado</i>':'')+'</button>');
  } return cells.join('');
 }
 function day(){
  const runs=state.runs.filter(x=>x.run_date===state.selected), byCron=new Map();
  runs.forEach(r=>{const a=byCron.get(r.cron_id)||[];a.push(r);byCron.set(r.cron_id,a)});
  if(!runs.length)return '<div class="cs-empty"><h2>Este día todavía no tiene recopilaciones.</h2><p>Cuando un proceso trabaje, aparecerá aquí explicado en lenguaje común.</p></div>';
  return [...byCron.entries()].map(([id,items])=>{const c=state.crons.find(x=>x.id===id),latest=items[0],rec=state.recs.find(x=>x.cron_id===id);
   return '<article class="cs-cron"><header><div><span>PROCESO</span><h2>'+esc(c?.name||'Proceso LINK')+'</h2><p>'+esc(c?.description||'')+'</p></div><b>'+esc(humanStatus(latest.status))+'</b></header>'+
    '<section class="cs-now"><span>¿Qué está pasando?</span><h3>'+esc(latest.title||latest.summary||'LINK está trabajando en este proceso.')+'</h3><p>'+esc(plain(latest.summary||latest.mission))+'</p></section>'+
    '<div class="cs-steps"><div><span>1</span><p><b>De dónde partimos</b>'+esc(plain(latest.current_state||'Estado registrado por LINK.'))+'</p></div><div><span>2</span><p><b>Qué queremos conseguir</b>'+esc(plain(latest.target_state||latest.done_criterion||'Completar el siguiente estado.'))+'</p></div><div><span>3</span><p><b>Qué hacemos ahora</b>'+esc(plain(latest.next_step||'Esperar la siguiente revisión del proceso.'))+'</p></div></div>'+
    (latest.needs_user_action?'<aside class="cs-needs"><span>NECESITA DE TI</span><strong>'+esc(plain(latest.user_action))+'</strong></aside>':'')+
    '<details><summary>Ver recopilaciones del día</summary>'+items.map(x=>'<div class="cs-run"><b>'+esc(x.edition==='opening'?'Mañana · decisión':x.edition==='control'?'Mediodía · revisión':x.edition==='closing'?'Noche · cierre':'Actualización')+'</b><span>'+esc(humanStatus(x.status))+'</span><p>'+esc(plain(x.mission||x.summary))+'</p></div>').join('')+'</details>'+
    (rec?'<details><summary>Cómo podemos mejorar este proceso</summary><p class="cs-rec">'+esc(plain(rec.recommendation))+'</p><small>Es una recomendación. No cambia el proceso hasta ser aprobada.</small></details>':'')+'</article>';
  }).join('');
 }
 function render(){root.innerHTML='<div class="cs-shell"><header class="cs-head"><div><span>LINK WORLD / CRON</span><h1>La agenda de lo que LINK piensa, hace y aprende.</h1><p>Elige un día. Te contamos qué procesos trabajaron, qué descubrieron y cuál es el siguiente paso.</p></div><button data-refresh>↻ Actualizar</button></header><div class="cs-layout"><aside class="cs-calendar"><div class="cs-month"><button data-prev>←</button><strong>'+esc(monthName(state.date))+'</strong><button data-next>→</button></div><div class="cs-week"><span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span></div><div class="cs-grid">'+calendar()+'</div></aside><main class="cs-dayview"><div class="cs-date-title"><span>DÍA SELECCIONADO</span><h2>'+esc(new Intl.DateTimeFormat('es-CL',{dateStyle:'full'}).format(new Date(state.selected+'T12:00:00')))+'</h2></div>'+day()+'</main></div></div>';bind()}
 function bind(){root.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{state.selected=b.dataset.date;render()});root.querySelector('[data-prev]')?.addEventListener('click',()=>{state.date=new Date(state.date.getFullYear(),state.date.getMonth()-1,1);render()});root.querySelector('[data-next]')?.addEventListener('click',()=>{state.date=new Date(state.date.getFullYear(),state.date.getMonth()+1,1);render()});root.querySelector('[data-refresh]')?.addEventListener('click',load)}
 return {open(){state.opened=true;load()},close(){state.opened=false},refresh:load};
}