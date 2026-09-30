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
"      <span class='lw-join-kicker'><i></i> CONEXIÓN PARA NEGOCIOS</span>",
"      <h1><span class='lw-join-fixed'>Conocemos tu negocio.</span><span class='lw-smoke-line' aria-label='Encontramos dónde conecta.'><em class='lw-smoke-phrase lw-smoke-current'>Encontramos dónde conecta.</em><em class='lw-smoke-phrase lw-smoke-next' aria-hidden='true'></em><i class='lw-smoke-haze' aria-hidden='true'></i></span></h1>",
"      <p><strong>LINK World conecta negocios, capacidades y oportunidades.</strong> Empezamos conociendo tu realidad y activamos las conexiones que pueden aportar valor.</p>",
"    </div>",
"    <aside class='lw-join-card'>",
"      <span class='lw-join-card-label'>SER PARTE</span>",
"      <h2>Empecemos por conocernos.</h2>",
"      <p>Cuéntanos qué hace tu negocio. Agendamos una reunión, identificamos capacidades útiles y diseñamos la mejor forma de integrarte a LINK.</p>",
"      <a class='lw-join-wa' href='"+LINK_WHATSAPP+"' target='_blank' rel='noopener noreferrer'>",
"        <span class='lw-join-wa-dot'><i></i></span>",
"        <span><small>CONTACTAR A LINK</small><b>Empezar por WhatsApp</b></span>",
"        <em>↗</em>",
"      </a>",
"      <div class='lw-join-steps'>",
"        <div><span>01</span><p>Recibimos tu contacto.</p></div>",
"        <div><span>02</span><p>Agendamos una reunión para conocer tu negocio.</p></div>",
"        <div><span>03</span><p>Diseñamos tu conexión y comenzamos tu integración.</p></div>",
"      </div>",
"      <small class='lw-join-note'>Cada integración se construye alrededor de una necesidad, una capacidad o una oportunidad concreta.</small>",
"    </aside>",
"  </section>",
"  <section class='lw-join-whisper'>",
"    <span>NEGOCIO</span><i>→</i><span>CONVERSACIÓN</span><i>→</i><span>CAPACIDADES</span><i>→</i><span>CONEXIÓN</span><i>→</i><b>LINK WORLD</b>",
"  </section>",
"  <footer class='lw-join-footer'><a href='/que-es-link/'>← Volver a ¿Qué es LINK?</a><span>PRIVATE CONNECTION NETWORK</span></footer>",
"</main>"
].join('');


const smokePhrases = [
  'Encontramos dónde conecta.',
  'Activamos capacidades útiles.',
  'Diseñamos conexiones reales.',
  'Abrimos nuevas oportunidades.',
  'Comenzamos tu integración.'
];

const smokeCurrent = document.querySelector('.lw-smoke-current');
const smokeNext = document.querySelector('.lw-smoke-next');
const smokeLine = document.querySelector('.lw-smoke-line');
const smokeHaze = document.querySelector('.lw-smoke-haze');

if (smokeCurrent && smokeNext && smokeLine) {
  let smokeIndex = 0;
  let smokeAnimating = false;

  const rotateSmokePhrase = () => {
    if (smokeAnimating) return;
    smokeAnimating = true;

    const nextIndex = (smokeIndex + 1) % smokePhrases.length;
    smokeNext.textContent = smokePhrases[nextIndex];
    smokeNext.classList.remove('lw-smoke-in');
    smokeCurrent.classList.remove('lw-smoke-out');
    smokeHaze?.classList.remove('active');

    requestAnimationFrame(() => {
      smokeCurrent.classList.add('lw-smoke-out');
      smokeNext.classList.add('lw-smoke-in');
      smokeHaze?.classList.add('active');
    });

    window.setTimeout(() => {
      smokeIndex = nextIndex;
      smokeCurrent.textContent = smokePhrases[smokeIndex];
      smokeLine.setAttribute('aria-label', smokePhrases[smokeIndex]);
      smokeCurrent.classList.remove('lw-smoke-out');
      smokeNext.classList.remove('lw-smoke-in');
      smokeNext.textContent = '';
      smokeHaze?.classList.remove('active');
      smokeAnimating = false;
    }, 980);
  };

  window.setInterval(rotateSmokePhrase, 3600);
}
