import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './world/connection.js';
import './authGate.css';

const app=document.querySelector('#app');
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
const LINK_WHATSAPP='https://wa.me/qr/ZYDZ5QZBDG4AJ1';
const IS_LOGIN_ROUTE=/^\/ingreso(?:\/|$)/.test(window.location.pathname);

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderGate(message=''){
  document.documentElement.classList.add('lw-auth-html');
  document.body.classList.add('lw-auth-body');
  document.title='Entrar · LINK World';
  app.innerHTML=[
    "<main class='lw-auth-shell'>",
    "  <div class='lw-auth-ambient a1'></div><div class='lw-auth-ambient a2'></div>",
    "  <header class='lw-auth-top'>",
    "    <a class='lw-auth-brand' href='/que-es-link/' aria-label='Conocer LINK'><img src='/link-world-mark.svg' alt=''><span><b>LINK.</b> World</span></a>",
    "    <a class='lw-auth-about' href='/que-es-link/'>¿Qué es LINK? <span>↗</span></a>",
    "  </header>",
    "  <section class='lw-auth-stage'>",
    "    <div class='lw-auth-message'>",
    "      <span class='lw-auth-kicker'><i></i> ACCESO POR INVITACIÓN</span>",
    "      <h1>El mundo de<br><em>conexiones.</em></h1>",
    "      <p><strong>LINK World es una central de control.</strong> Para acceder y ser parte del mundo de conexiones, contáctanos.</p>",
    "      <div class='lw-auth-whisper'>",
    "        <span>NEGOCIOS</span><i>+</i><span>PERSONAS</span><i>+</i><span>CAPACIDADES</span><i>→</i><b>LINK</b>",
    "      </div>",
    "    </div>",
    "    <div class='lw-auth-panel'>",
    "      <div class='lw-auth-panel-head'><span>Entrar a LINK World</span><small>MIEMBROS</small></div>",
    "      <form id='lw-login-form' class='lw-auth-form' novalidate>",
    "        <label><span>Correo</span><input id='lw-login-email' type='email' autocomplete='email' placeholder='tu@correo.com' required></label>",
    "        <label><span>Contraseña</span><div class='lw-password-wrap'><input id='lw-login-password' type='password' autocomplete='current-password' placeholder='••••••••' required><button id='lw-toggle-password' type='button' aria-label='Mostrar contraseña'>ver</button></div></label>",
    "        <button id='lw-login-submit' class='lw-auth-submit' type='submit'><span>Entrar</span><i>→</i></button>",
    "        <div id='lw-login-status' class='lw-auth-status' role='status' aria-live='polite'>"+escapeHtml(message)+"</div>",
    "      </form>",
    "      <div class='lw-auth-divider'><span>¿Aún no eres parte?</span></div>",
    "      <a class='lw-auth-contact' href='"+LINK_WHATSAPP+"' target='_blank' rel='noopener noreferrer'>",
    "        <span class='lw-auth-contact-mark'><i></i></span>",
    "        <span><small>ABRIR UNA CONEXIÓN</small><b>Hablar con LINK</b></span>",
    "        <em>↗</em>",
    "      </a>",
    "      <p class='lw-auth-foot'>No vendemos acceso abierto. Primero entendemos si existe una conexión real.</p>",
    "    </div>",
    "  </section>",
    "  <footer class='lw-auth-bottom'><span>LINK WORLD · PRIVATE CONTROL SYSTEM</span><span>San Pedro · São Paulo · donde exista una conexión</span></footer>",
    "</main>"
  ].join('');

  const form=document.querySelector('#lw-login-form');
  const email=document.querySelector('#lw-login-email');
  const password=document.querySelector('#lw-login-password');
  const submit=document.querySelector('#lw-login-submit');
  const status=document.querySelector('#lw-login-status');
  const toggle=document.querySelector('#lw-toggle-password');

  toggle?.addEventListener('click',()=>{
    const showing=password.type==='text';
    password.type=showing?'password':'text';
    toggle.textContent=showing?'ver':'ocultar';
  });

  form?.addEventListener('submit',async event=>{
    event.preventDefault();
    const e=email.value.trim();
    const p=password.value;
    if(!e||!p){
      status.textContent='Ingresa correo y contraseña.';
      status.dataset.state='error';
      return;
    }
    submit.disabled=true;
    submit.innerHTML='<span>Comprobando acceso…</span><i>·</i>';
    status.textContent='';
    status.dataset.state='';

    const {error}=await db.auth.signInWithPassword({email:e,password:p});
    if(error){
      submit.disabled=false;
      submit.innerHTML='<span>Entrar</span><i>→</i>';
      status.textContent='No pudimos validar ese acceso.';
      status.dataset.state='error';
      return;
    }

    const check=await db.rpc('link_world_is_member');
    if(check.error||check.data!==true){
      await db.auth.signOut();
      submit.disabled=false;
      submit.innerHTML='<span>Entrar</span><i>→</i>';
      status.textContent='Esta cuenta todavía no pertenece a LINK World.';
      status.dataset.state='error';
      return;
    }
    status.textContent='Acceso confirmado.';
    status.dataset.state='ok';
    if(IS_LOGIN_ROUTE){
      window.location.replace('/');
    }else{
      window.location.reload();
    }
  });
}

async function boot(){
  const {data:{session}}=await db.auth.getSession();
  if(!session){
    renderGate();
    return;
  }
  const check=await db.rpc('link_world_is_member');
  if(check.error||check.data!==true){
    await db.auth.signOut();
    renderGate('Esta cuenta todavía no pertenece a LINK World.');
    return;
  }
  if(IS_LOGIN_ROUTE){
    window.location.replace('/');
    return;
  }
  document.documentElement.classList.remove('lw-auth-html');
  document.body.classList.remove('lw-auth-body');
  await import('./main.js');
}
boot().catch(()=>{
  renderGate('No pudimos comprobar el acceso. Intenta nuevamente.');
});
