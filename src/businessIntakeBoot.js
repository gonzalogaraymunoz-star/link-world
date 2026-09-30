import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './world/connection.js';
import './authGate.css';

const app=document.querySelector('#app');
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

function esc(value=''){
  return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderGate(message=''){
  document.documentElement.classList.add('lw-auth-html');
  document.body.classList.add('lw-auth-body');
  document.title='ADN LINK · Acceso privado';

  app.innerHTML=[
    "<main class='lw-auth-shell'>",
    "  <div class='lw-auth-ambient a1'></div><div class='lw-auth-ambient a2'></div>",
    "  <header class='lw-auth-top'>",
    "    <a class='lw-auth-brand' href='/' aria-label='Volver a LINK World'><img src='/link-world-mark.svg' alt=''><span><b>LINK.</b> ADN</span></a>",
    "    <a class='lw-auth-about' href='/'>LINK World <span>←</span></a>",
    "  </header>",
    "  <section class='lw-auth-stage'>",
    "    <div class='lw-auth-message'>",
    "      <span class='lw-auth-kicker'><i></i> HERRAMIENTA PRIVADA DE ENTREVISTA</span>",
    "      <h1>Absorber.<br><em>Entender.</em></h1>",
    "      <p><strong>ADN LINK es una herramienta interna.</strong> Sólo el propietario de LINK World puede abrirla y usarla durante entrevistas con nuevos negocios.</p>",
    "      <div class='lw-auth-whisper'><span>ENTREVISTA</span><i>→</i><span>ADN</span><i>→</i><span>VAULT</span><i>→</i><b>MICELIO</b></div>",
    "    </div>",
    "    <div class='lw-auth-panel'>",
    "      <div class='lw-auth-panel-head'><span>Entrar a ADN LINK</span><small>OWNER</small></div>",
    "      <form id='lw-login-form' class='lw-auth-form' novalidate>",
    "        <label><span>Correo LINK World</span><input id='lw-login-email' type='email' autocomplete='email' placeholder='tu@correo.com' required></label>",
    "        <label><span>Contraseña</span><div class='lw-password-wrap'><input id='lw-login-password' type='password' autocomplete='current-password' placeholder='••••••••' required><button id='lw-toggle-password' type='button' aria-label='Mostrar contraseña'>ver</button></div></label>",
    "        <button id='lw-login-submit' class='lw-auth-submit' type='submit'><span>Abrir ADN LINK</span><i>→</i></button>",
    "        <div id='lw-login-status' class='lw-auth-status' role='status' aria-live='polite'>"+esc(message)+"</div>",
    "      </form>",
    "      <p class='lw-auth-foot'>Esta ruta no es pública. Los datos capturados pasan al Prospect Vault y no ingresan al Micelio sin verificación.</p>",
    "    </div>",
    "  </section>",
    "  <footer class='lw-auth-bottom'><span>ADN LINK · PRIVATE INTAKE SYSTEM</span><span>LINK WORLD · OWNER ACCESS</span></footer>",
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
      status.textContent='Ingresa tu correo y contraseña de LINK World.';
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
      submit.innerHTML='<span>Abrir ADN LINK</span><i>→</i>';
      status.textContent='No pudimos validar ese acceso.';
      status.dataset.state='error';
      return;
    }

    const check=await db.rpc('link_world_is_owner');
    if(check.error||check.data!==true){
      await db.auth.signOut();
      submit.disabled=false;
      submit.innerHTML='<span>Abrir ADN LINK</span><i>→</i>';
      status.textContent='ADN LINK está restringido al propietario de LINK World.';
      status.dataset.state='error';
      return;
    }

    status.textContent='Acceso confirmado.';
    status.dataset.state='ok';
    window.location.reload();
  });
}

async function boot(){
  const {data:{session}}=await db.auth.getSession();
  if(!session){
    renderGate();
    return;
  }

  const check=await db.rpc('link_world_is_owner');
  if(check.error||check.data!==true){
    await db.auth.signOut();
    renderGate('ADN LINK está restringido al propietario de LINK World.');
    return;
  }

  document.documentElement.classList.remove('lw-auth-html');
  document.body.classList.remove('lw-auth-body');
  await import('./businessIntake.js');
}

boot().catch(()=>renderGate('No pudimos comprobar el acceso. Intenta nuevamente.'));
