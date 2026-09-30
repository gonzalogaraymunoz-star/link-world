import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './connection.js';
import './prospectVault.css';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const root=document.querySelector('#lw-vault');

const labels={
  submitted:'Nuevo',review:'En revisión',verified:'Verificado',promoted:'En Micelio',rejected:'Rechazado'
};

function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function arr(v){return Array.isArray(v)?v:[]}

async function load(){
  root.innerHTML='<div class="pv-loading">Cargando Prospect Vault…</div>';
  const {data,error}=await db.from('link_world_prospect_vault')
    .select('id,reference_code,business_name,sector,business_summary,primary_goal,adaptive_answer,current_tools,capabilities,needs,association_interests,reference_items,clone_aspects,adapter_path,action_method,dna_summary,status,verification_status,micelio_business_id,review_note,created_at,verified_at,promoted_at')
    .order('created_at',{ascending:false});
  if(error){root.innerHTML='<div class="pv-error">No se pudo abrir Vault: '+esc(error.message)+'</div>';return;}
  render(data||[]);
}

function render(rows){
  const pending=rows.filter(r=>!['promoted','rejected'].includes(r.status)).length;
  const promoted=rows.filter(r=>r.status==='promoted').length;
  root.innerHTML=`
    <div class="pv-head">
      <div><span class="pv-kicker">PROSPECT VAULT</span><h1>Antes del Micelio.</h1><p>Aquí viven los negocios que LINK ya entendió, pero todavía no ha incorporado a la red.</p></div>
      <div class="pv-head-actions"><a href="/conectar-negocio/" target="_blank" rel="noopener noreferrer">+ Nuevo ADN</a><button id="pv-refresh" type="button">↻ Actualizar</button></div>
    </div>
    <div class="pv-stats"><div><b>${rows.length}</b><span>Total</span></div><div><b>${pending}</b><span>Por revisar</span></div><div><b>${promoted}</b><span>En Micelio</span></div></div>
    <div class="pv-list">${rows.length?rows.map(card).join(''):'<div class="pv-empty">Todavía no hay prospectos. Usa “Nuevo ADN” para absorber el primer negocio.</div>'}</div>
  `;
  document.querySelector('#pv-refresh')?.addEventListener('click',load);
  root.querySelectorAll('[data-open-prospect]').forEach(btn=>btn.addEventListener('click',()=>toggle(btn.dataset.openProspect)));
  root.querySelectorAll('[data-verify-prospect]').forEach(btn=>btn.addEventListener('click',()=>verify(btn.dataset.verifyProspect)));
  root.querySelectorAll('[data-promote-prospect]').forEach(btn=>btn.addEventListener('click',()=>promote(btn.dataset.promoteProspect)));
  root.querySelectorAll('[data-reject-prospect]').forEach(btn=>btn.addEventListener('click',()=>reject(btn.dataset.rejectProspect)));
}

function card(r){
  const dna=r.dna_summary||{};
  const method=r.action_method||{};
  const refs=arr(r.reference_items).map(x=>x?.value).filter(Boolean);
  return `
  <article class="pv-card status-${esc(r.status)}">
    <button class="pv-card-main" type="button" data-open-prospect="${r.id}">
      <span class="pv-status">${esc(labels[r.status]||r.status)}</span>
      <div class="pv-title"><b>${esc(r.business_name)}</b><small>${esc(r.sector||'Sin sector')} · ${esc(r.reference_code)}</small></div>
      <div class="pv-goal"><span>Objetivo</span><b>${esc(dna.goal||r.primary_goal)}</b></div>
      <i>⌄</i>
    </button>
    <div class="pv-detail" id="pv-${r.id}" hidden>
      <div class="pv-detail-grid">
        <section><span>NECESITA</span><p>${esc(arr(dna.needs).join(' · ')||'Por definir')}</p></section>
        <section><span>PUEDE APORTAR</span><p>${esc(arr(dna.capabilities).join(' · ')||'Por definir')}</p></section>
        <section><span>FRICCIÓN</span><p>${esc(arr(dna.friction).join(' · ')||'Por revisar')}</p></section>
        <section><span>REFERENCIAS</span><p>${esc(refs.join(' · ')||'Sin referencias')}</p></section>
      </div>
      <div class="pv-method"><span>${esc(method.title||'Método de acción')}</span><div>${arr(method.steps).map((s,i)=>`<b>${i+1}. ${esc(s)}</b>`).join('')}</div></div>
      <div class="pv-actions">
        ${r.status==='submitted'||r.status==='review'?'<button type="button" class="verify" data-verify-prospect="'+r.id+'">Verificar ADN</button>':''}
        ${r.status==='verified'?'<button type="button" class="promote" data-promote-prospect="'+r.id+'">Ingresar al Micelio →</button>':''}
        ${!['promoted','rejected'].includes(r.status)?'<button type="button" class="reject" data-reject-prospect="'+r.id+'">Rechazar</button>':''}
        ${r.status==='promoted'?'<span class="pv-promoted">Micelio · '+esc(r.micelio_business_id||'creado')+'</span>':''}
      </div>
    </div>
  </article>`;
}

function toggle(id){
  const el=document.getElementById('pv-'+id);
  if(el) el.hidden=!el.hidden;
}
async function verify(id){
  const note=window.prompt('Nota de verificación (opcional):','')||'';
  const {error}=await db.rpc('link_world_verify_prospect_vault',{p_prospect_id:id,p_note:note||null});
  if(error){window.alert(error.message);return;}
  await load();
}
async function reject(id){
  const note=window.prompt('Motivo de rechazo:','')||'';
  if(!window.confirm('¿Dejar este prospecto fuera del Micelio?')) return;
  const {error}=await db.rpc('link_world_reject_prospect_vault',{p_prospect_id:id,p_note:note||null});
  if(error){window.alert(error.message);return;}
  await load();
}
async function promote(id){
  if(!window.confirm('Este negocio fue verificado. ¿Crear su entrada candidata en LINK World / Micelio?')) return;
  const {error}=await db.rpc('link_world_promote_prospect_vault',{p_prospect_id:id});
  if(error){window.alert(error.message);return;}
  await load();
}

export function mountProspectVault(){
  return {open:load,close:()=>{}};
}
