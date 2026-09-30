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
"      <span class='lw-join-kicker'><i></i> DE NEGOCIO AISLADO A NEGOCIO CONECTADO</span>",
"      <h1><span class='lw-join-fixed'>Conozcámonos.</span><span class='lw-smoke-line' aria-label='Entendemos tu negocio.'><em class='lw-smoke-phrase lw-smoke-current'>Entendemos tu negocio.</em><em class='lw-smoke-phrase lw-smoke-next' aria-hidden='true'></em><i class='lw-smoke-haze' aria-hidden='true'></i></span></h1>",
"      <div class='lw-join-support-wrap'><span class='lw-journey-count' id='lw-journey-count'>01 / 05</span><p class='lw-join-support' aria-live='polite'><span class='lw-support-phrase lw-support-current'><strong>Primero lo hacemos visible.</strong> Vemos qué vendes, cómo operas, quiénes son tus clientes y dónde hoy se pierden tiempo u oportunidades.</span><span class='lw-support-phrase lw-support-next' aria-hidden='true'></span></p></div>",
"    </div>",
"    <aside class='lw-join-card'>",
"      <span class='lw-join-card-label'>SER PARTE</span>",
"      <h2>Empecemos por entender tu negocio.</h2>",
"      <p>La primera conversación nos sirve para ver qué ya funciona, qué está aislado y dónde una conexión puede transformarse en una capacidad real.</p>",
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


const journeyFrames = [
  {
    headline:'Entendemos tu negocio.',
    lead:'Primero lo hacemos visible.',
    body:'Vemos qué vendes, cómo operas, quiénes son tus clientes y dónde hoy se pierden tiempo u oportunidades.'
  },
  {
    headline:'Detectamos lo que falta.',
    lead:'Encontramos la oportunidad.',
    body:'Identificamos procesos, relaciones o capacidades que podrían generar más valor si estuvieran conectados.'
  },
  {
    headline:'Conectamos capacidades útiles.',
    lead:'Sumamos sólo lo que aporta.',
    body:'Acercamos aliados, clientes, servicios o herramientas cuando resuelven una necesidad concreta del negocio.'
  },
  {
    headline:'Activamos nuevas operaciones.',
    lead:'La conexión empieza a trabajar.',
    body:'La convertimos en algo real: una venta, una reserva, un servicio, una automatización o una nueva alianza.'
  },
  {
    headline:'Medimos, aprendemos y crecemos.',
    lead:'El resultado abre la siguiente conexión.',
    body:'Vemos qué funcionó, qué generó valor y qué nuevas posibilidades puede activar tu negocio dentro de LINK.'
  }
];

const smokeCurrent = document.querySelector('.lw-smoke-current');
const smokeNext = document.querySelector('.lw-smoke-next');
const smokeLine = document.querySelector('.lw-smoke-line');
const smokeHaze = document.querySelector('.lw-smoke-haze');
const supportCurrent = document.querySelector('.lw-support-current');
const supportNext = document.querySelector('.lw-support-next');
const journeyCount = document.querySelector('#lw-journey-count');

if (smokeCurrent && smokeNext && smokeLine && supportCurrent && supportNext) {
  let smokeIndex = 0;
  let smokeAnimating = false;
  let smokeTimer = null;

  const HOLD_MS = 5600;
  const FIRST_HOLD_MS = 6200;
  const TRANSITION_MS = 1250;

  const supportMarkup = frame =>
    '<strong>'+frame.lead+'</strong> '+frame.body;

  const scheduleNext = (delay = HOLD_MS) => {
    window.clearTimeout(smokeTimer);
    smokeTimer = window.setTimeout(rotateJourney, delay);
  };

  const rotateJourney = () => {
    if (smokeAnimating) return;
    smokeAnimating = true;

    const nextIndex = (smokeIndex + 1) % journeyFrames.length;
    const nextFrame = journeyFrames[nextIndex];

    smokeNext.textContent = nextFrame.headline;
    supportNext.innerHTML = supportMarkup(nextFrame);

    smokeNext.classList.remove('lw-smoke-in');
    smokeCurrent.classList.remove('lw-smoke-out');
    supportNext.classList.remove('lw-support-in');
    supportCurrent.classList.remove('lw-support-out');
    smokeHaze?.classList.remove('active');

    requestAnimationFrame(() => {
      smokeCurrent.classList.add('lw-smoke-out');
      smokeNext.classList.add('lw-smoke-in');
      supportCurrent.classList.add('lw-support-out');
      supportNext.classList.add('lw-support-in');
      smokeHaze?.classList.add('active');
    });

    window.setTimeout(() => {
      smokeIndex = nextIndex;
      const frame = journeyFrames[smokeIndex];

      smokeCurrent.textContent = frame.headline;
      smokeLine.setAttribute('aria-label', frame.headline);
      supportCurrent.innerHTML = supportMarkup(frame);
      journeyCount.textContent = String(smokeIndex + 1).padStart(2,'0')+' / '+String(journeyFrames.length).padStart(2,'0');

      smokeCurrent.classList.remove('lw-smoke-out');
      smokeNext.classList.remove('lw-smoke-in');
      supportCurrent.classList.remove('lw-support-out');
      supportNext.classList.remove('lw-support-in');
      smokeNext.textContent = '';
      supportNext.innerHTML = '';
      smokeHaze?.classList.remove('active');
      smokeAnimating = false;
      scheduleNext(HOLD_MS);
    }, TRANSITION_MS);
  };

  scheduleNext(FIRST_HOLD_MS);
}
