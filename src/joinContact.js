import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './world/connection.js';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

const validInstagram=value=>{
  const v=String(value||'').trim();
  return /^@[A-Za-z0-9._]{1,30}$/.test(v) ||
    /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?([?#].*)?$/i.test(v);
};

const normalizeInstagram=value=>{
  const v=String(value||'').trim();
  return v.startsWith('@') ? 'https://www.instagram.com/'+v.slice(1) : v;
};

export function initJoinContact({whatsappUrl}){
  document.body.insertAdjacentHTML('beforeend',[
    "<div class='lw-contact-layer' id='lw-contact-layer' aria-hidden='true'>",
    "  <button class='lw-contact-backdrop' type='button' data-close-contact aria-label='Cerrar formulario'></button>",
    "  <section class='lw-contact-sheet' role='dialog' aria-modal='true' aria-labelledby='lw-contact-title'>",
    "    <button class='lw-contact-close' type='button' data-close-contact aria-label='Cerrar'>×</button>",
    "    <span class='lw-contact-kicker'>PRIMER CONTACTO</span>",
    "    <h2 id='lw-contact-title'>Prepáranos la conversación.</h2>",
    "    <p>Antes de abrir WhatsApp, déjanos tres datos concretos para entender con quién vamos a hablar.</p>",
    "    <form id='lw-contact-form' class='lw-contact-form' novalidate>",
    "      <div class='lw-contact-grid'>",
    "        <label><span>Tu nombre</span><input id='lw-contact-name' type='text' maxlength='120' autocomplete='name' placeholder='Nombre y apellido' required></label>",
    "        <label><span>Tu negocio</span><input id='lw-contact-business' type='text' maxlength='120' autocomplete='organization' placeholder='Nombre del negocio' required></label>",
    "      </div>",
    "      <div class='lw-contact-grid'>",
    "        <label><span>Instagram</span><input id='lw-contact-instagram' type='text' maxlength='180' inputmode='url' placeholder='@tunegocio' required></label>",
    "        <label><span>Correo</span><input id='lw-contact-email' type='email' maxlength='180' autocomplete='email' placeholder='tu@correo.com' required></label>",
    "      </div>",
    "      <label><span>¿Por qué te interesa LINK?</span><textarea id='lw-contact-interest' maxlength='600' rows='4' placeholder='Qué te gustaría conectar, mejorar o activar.' required></textarea></label>",
    "      <div class='lw-contact-proof'><i></i><span>Instagram + correo quedan registrados antes de abrir WhatsApp.</span></div>",
    "      <button class='lw-contact-submit' id='lw-contact-submit' type='submit'><span>Continuar a WhatsApp</span><i>→</i></button>",
    "      <div class='lw-contact-status' id='lw-contact-status' role='status' aria-live='polite'></div>",
    "    </form>",
    "  </section>",
    "</div>"
  ].join(''));

  const layer=document.querySelector('#lw-contact-layer');
  const form=document.querySelector('#lw-contact-form');
  const status=document.querySelector('#lw-contact-status');
  const submit=document.querySelector('#lw-contact-submit');

  const setStatus=(state,message)=>{
    status.dataset.state=state||'';
    status.textContent=message||'';
  };

  const open=()=>{
    layer.classList.add('open');
    layer.setAttribute('aria-hidden','false');
    document.body.classList.add('lw-contact-open');
    setTimeout(()=>document.querySelector('#lw-contact-name')?.focus(),160);
  };

  const close=()=>{
    layer.classList.remove('open');
    layer.setAttribute('aria-hidden','true');
    document.body.classList.remove('lw-contact-open');
  };

  document.querySelector('#lw-open-contact')?.addEventListener('click',open);
  document.querySelectorAll('[data-close-contact]').forEach(el=>el.addEventListener('click',close));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&layer.classList.contains('open')) close();
  });

  form.addEventListener('submit',async event=>{
    event.preventDefault();

    const name=document.querySelector('#lw-contact-name').value.trim();
    const business=document.querySelector('#lw-contact-business').value.trim();
    const instagram=document.querySelector('#lw-contact-instagram').value.trim();
    const email=document.querySelector('#lw-contact-email').value.trim();
    const interest=document.querySelector('#lw-contact-interest').value.trim();

    if(name.length<2){setStatus('error','Escribe tu nombre.');return;}
    if(business.length<2){setStatus('error','Escribe el nombre de tu negocio.');return;}
    if(!validInstagram(instagram)){setStatus('error','Ingresa un Instagram válido, por ejemplo @tunegocio.');return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setStatus('error','Ingresa un correo válido.');return;}
    if(interest.length<12){setStatus('error','Cuéntanos brevemente por qué te interesa LINK.');return;}

    submit.disabled=true;
    submit.innerHTML='<span>Preparando conversación…</span><i>·</i>';
    setStatus('loading','Guardando tu información antes de abrir WhatsApp.');

    const {data,error}=await db.rpc('link_world_submit_join_interest',{
      p_name:name,
      p_business:business,
      p_email:email,
      p_instagram:instagram,
      p_interest:interest,
      p_source_url:window.location.pathname
    });

    if(error){
      submit.disabled=false;
      submit.innerHTML='<span>Continuar a WhatsApp</span><i>→</i>';
      setStatus('error',error.message||'No pudimos preparar el contacto.');
      return;
    }

    const row=Array.isArray(data)?data[0]:data;
    const ref=row?.reference_code||'';
    const ig=normalizeInstagram(instagram);
    const message=[
      'Hola LINK, quiero explorar una conexión.',
      '',
      'Nombre: '+name,
      'Negocio: '+business,
      'Instagram: '+ig,
      'Email: '+email,
      '',
      'Me interesa LINK porque:',
      interest,
      ref ? '' : null,
      ref ? 'Referencia: '+ref : null
    ].filter(value=>value!==null).join('\n');

    try{await navigator.clipboard.writeText(message);}catch{}

    submit.disabled=false;
    submit.innerHTML='<span>Abrir WhatsApp</span><i>↗</i>';
    setStatus('success','Listo. Tu presentación quedó registrada y preparada.');

    const target=whatsappUrl+'?text='+encodeURIComponent(message);
    setTimeout(()=>window.open(target,'_blank','noopener,noreferrer'),220);
  });
}
