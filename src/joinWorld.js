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
"      <h1><span class='lw-join-fixed'>Conozcámonos.</span><span class='lw-smoke-line' aria-label='Entendemos tu negocio.'><em class='lw-smoke-phrase lw-smoke-current'>Entendemos tu negocio.</em><em class='lw-smoke-phrase lw-smoke-next' aria-hidden='true'></em><i class='lw-smoke-haze' aria-hidden='true'></i></span></h1>",
"      <p class='lw-join-support'><strong>Empezamos con una conversación.</strong> Entendemos tu negocio, detectamos oportunidades y activamos las conexiones que pueden aportar valor.</p>",
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
  'Entendemos tu negocio.',
  'Encontramos dónde conecta.',
  'Activamos capacidades útiles.',
  'Diseñamos conexiones reales.',
  'Comenzamos tu integración.'
]

const smokeCurrent = document.querySelector('.lw-smoke-current');
const smokeNext = document.querySelector('.lw-smoke-next');
const smokeLine = document.querySelector('.lw-smoke-line');
const smokeHaze = document.querySelector('.lw-smoke-haze');

if (smokeCurrent && smokeNext && smokeLine) {
  let smokeIndex = 0;
  let smokeAnimating = false;
  let smokeTimer = null;

  // Ritmo: cada frase queda realmente disponible para lectura antes de la transición.
  const HOLD_MS = 5200;
  const FIRST_HOLD_MS = 5600;
  const TRANSITION_MS = 1250;

  const scheduleNext = (delay = HOLD_MS) => {
    window.clearTimeout(smokeTimer);
    smokeTimer = window.setTimeout(rotateSmokePhrase, delay);
  };

  const rotateSmokePhrase = () => {
    if (smokeAnimating) return;
    smokeAnimating = true;

    const nextIndex = (smokeIndex + 1) % smokePhrases.length;
    smokeNext.textContent = smokePhrases[nextIndex];
    smokeNext.classList.remove('lw-smoke-in');
    smokeCurrent.classList.remove('lw-smoke-out');
    smokeHaze?.classList.remove('active');

    requestAnimationFrame(() => {
      // Sale primero la frase actual; la siguiente entra una fracción después.
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
      scheduleNext(HOLD_MS);
    }, TRANSITION_MS);
  };

  scheduleNext(FIRST_HOLD_MS);
}
