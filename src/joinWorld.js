import './joinWorld.css';

const app=document.querySelector('#app');
const LINK_WHATSAPP='https://wa.me/qr/ZYDZ5QZBDG4AJ1';
document.documentElement.lang='es';
document.title='Ser parte · LINK World';
document.body.classList.add('lw-join-body');

app.innerHTML=[
"<main class='lw-join-shell'>",
"  <div class='lw-join-orbit o1'></div><div class='lw-join-orbit o2'></div>",
"  <header class='lw-join-top'>",
"    <a class='lw-join-brand' href='/que-es-link/' aria-label='Volver a ¿Qué es LINK?'><img src='/link-world-mark.svg' alt=''><span><b>LINK.</b> World</span></a>",
"    <a class='lw-join-member' href='/'>Ya soy parte <span>→</span></a>",
"  </header>",
"  <section class='lw-join-hero'>",
"    <div class='lw-join-copy'>",
"      <span class='lw-join-kicker'><i></i> ACCESO POR CONEXIÓN</span>",
"      <h1>No se entra<br>a LINK World.<br><em>Se conecta.</em></h1>",
"      <p><strong>LINK World es una central de control.</strong> Para acceder y ser parte del mundo de conexiones, contáctanos.</p>",
"    </div>",
"    <aside class='lw-join-card'>",
"      <span class='lw-join-card-label'>SER PARTE</span>",
"      <h2>Abre una conexión.</h2>",
"      <p>No necesitas elegir un plan. Primero entendemos tu negocio, qué puedes aportar y qué conexión puede tener sentido.</p>",
"      <a class='lw-join-wa' href='"+LINK_WHATSAPP+"' target='_blank' rel='noopener noreferrer'>",
"        <span class='lw-join-wa-dot'><i></i></span>",
"        <span><small>CONTACTAR A LINK</small><b>Empezar por WhatsApp</b></span>",
"        <em>↗</em>",
"      </a>",
"      <div class='lw-join-steps'>",
"        <div><span>01</span><p>Nos cuentas qué haces.</p></div>",
"        <div><span>02</span><p>Buscamos una conexión real.</p></div>",
"        <div><span>03</span><p>Si tiene sentido, entras a LINK World.</p></div>",
"      </div>",
"      <small class='lw-join-note'>LINK World no es un directorio abierto. Las conexiones se verifican antes de entrar al sistema.</small>",
"    </aside>",
"  </section>",
"  <section class='lw-join-whisper'>",
"    <span>NEGOCIO</span><i>→</i><span>NECESIDAD</span><i>→</i><span>CONEXIÓN</span><i>→</i><b>LINK WORLD</b>",
"  </section>",
"  <footer class='lw-join-footer'><a href='/que-es-link/'>← Volver a ¿Qué es LINK?</a><span>PRIVATE CONNECTION NETWORK</span></footer>",
"</main>"
].join('');
