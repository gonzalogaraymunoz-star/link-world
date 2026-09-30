import './linkExplainer.css';

const app = document.querySelector('#app');
document.documentElement.lang = 'es';
document.title = '¿Qué es LINK? · LINK World';
document.body.classList.add('link-explainer-body');

const icons = {
  business: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 10h16v10H4z'/><path d='M3 10l2-5h14l2 5'/><path d='M8 14h3v6'/></svg>",
  users: "<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='9' cy='8' r='3'/><path d='M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6'/><circle cx='17' cy='9' r='2.4'/><path d='M15 14c3.4-.2 5.3 1.6 5.6 5'/></svg>",
  marketing: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 13h4l8 5V6l-8 5H4z'/><path d='M8 13l1 6h3'/><path d='M19 8v8'/></svg>",
  card: "<svg viewBox='0 0 24 24' aria-hidden='true'><rect x='3' y='6' width='18' height='12' rx='2'/><path d='M3 10h18'/><path d='M7 15h4'/></svg>",
  box: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 8l8-4 8 4-8 4z'/><path d='M4 8v8l8 4 8-4V8'/><path d='M12 12v8'/></svg>",
  gear: "<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='12' cy='12' r='3'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1'/></svg>",
  handshake: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M3 8l4-3 4 3 2-1 4 3 4-1'/><path d='M2 10l5 6 3-2 2 2 2-2 2 1 5-5'/><path d='M9 8l3 3 3-2'/></svg>",
  search: "<svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='10.5' cy='10.5' r='6.5'/><path d='M15.5 15.5L21 21'/></svg>",
  link: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M9 15l6-6'/><path d='M7 17l-1.5 1.5a4 4 0 0 1-5.7-5.7L5 7.6a4 4 0 0 1 5.7 0'/><path d='M17 7l1.5-1.5a4 4 0 0 1 5.7 5.7L19 16.4a4 4 0 0 1-5.7 0'/></svg>",
  bolt: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M13 2L5 13h6l-1 9 9-13h-6z'/></svg>",
  chart: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 20V10M10 20V4M16 20v-7M22 20H2'/></svg>",
  brain: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M9 4a4 4 0 0 0-4 4 4 4 0 0 0 1 7.7V18a3 3 0 0 0 3 3c1.7 0 3-1.3 3-3V6a3 3 0 0 0-3-3z'/><path d='M15 4a4 4 0 0 1 4 4 4 4 0 0 1-1 7.7V18a3 3 0 0 1-3 3c-1.7 0-3-1.3-3-3V6a3 3 0 0 1 3-3z'/><path d='M6 10h3M15 10h3M7 16h2M15 16h2'/></svg>",
  leaf: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20 4C12 4 6 8 5 15c4 2 11 0 15-11z'/><path d='M4 21c2-6 7-10 12-13'/></svg>",
  tag: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M3 12l9-9h7l2 2v7l-9 9z'/><circle cx='16.5' cy='7.5' r='1.3'/></svg>",
  music: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M9 18V5l10-2v13'/><circle cx='6' cy='18' r='3'/><circle cx='16' cy='16' r='3'/></svg>",
  van: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M3 7h12l4 5h2v6H3z'/><circle cx='7' cy='18' r='2'/><circle cx='17' cy='18' r='2'/><path d='M15 7v5h4'/></svg>",
  star: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z'/></svg>"
};
const icon = (name) => "<span class='le-icon'>" + (icons[name] || icons.link) + "</span>";

app.innerHTML = [
"<div class='le-page'>",
"  <header class='le-header'>",
"    <a class='le-brand' href='/' aria-label='Volver a LINK World'><img src='/link-world-mark.svg' alt=''><span><strong>LINK.</strong> World</span></a>",
"    <nav class='le-nav' aria-label='Contenido de LINK'>",
"      <a href='#que-es'>Qué es</a><a href='#modelo-link-cupones'>Modelo</a><a href='#como-funciona'>Cómo funciona</a><a href='#asociativos'>Asociativos</a><a href='#ejemplos'>Ejemplos</a>",
"    </nav>",
"    <a class='le-back' href='/'>Entrar a LINK World <span>→</span></a>",
"  </header>",
"  <main>",
"    <section class='le-hero le-section' id='que-es'>",
"      <div class='le-hero-copy'>",
"        <span class='le-eyebrow'>LINK · PARA NEGOCIOS</span>",
"        <h1>Tu negocio<br>no está solo.</h1>",
"        <p class='le-lead'><strong>LINK conecta negocios, personas, herramientas y oportunidades</strong> para que cada negocio pueda hacer más, sin perder su identidad.</p>",
"        <div class='le-hero-actions'><a class='le-primary' href='#modelo-link-cupones'>Ver modelo LINK Cupones <span>→</span></a><a class='le-secondary' href='#como-funciona'>Cómo funciona LINK</a></div>",
"        <p class='le-note'>No es una fórmula única. LINK activa sólo las conexiones que tienen sentido para cada negocio.</p>",
"      </div>",
"      <div class='le-network-wrap' aria-label='Red de posibilidades alrededor de un negocio'>",
"        <div class='le-network-lines' aria-hidden='true'></div>",
"        <button class='le-network-node n1 active' data-network='clientes'>" + icon('users') + "<b>Clientes</b><small>Más personas, más ocasiones de venta</small></button>",
"        <button class='le-network-node n2' data-network='marketing'>" + icon('marketing') + "<b>Marketing</b><small>Mayor visibilidad y alcance</small></button>",
"        <button class='le-network-node n3' data-network='pagos'>" + icon('card') + "<b>Pagos</b><small>Cobros simples y trazables</small></button>",
"        <button class='le-network-node n4' data-network='proveedores'>" + icon('box') + "<b>Proveedores</b><small>Nuevas opciones y mejores condiciones</small></button>",
"        <button class='le-network-node n5' data-network='operaciones'>" + icon('gear') + "<b>Operaciones</b><small>Herramientas que ahorran tiempo</small></button>",
"        <button class='le-network-node n6' data-network='alianzas'>" + icon('handshake') + "<b>Alianzas</b><small>Colaboraciones reales entre negocios</small></button>",
"        <div class='le-network-center'>" + icon('business') + "<strong>Tu negocio</strong><small>en el centro</small></div>",
"        <div class='le-network-caption' id='le-network-caption'><b>Clientes</b><span>LINK puede conectar tu negocio con nuevas ocasiones de compra, reserva o recomendación.</span></div>",
"      </div>",
"    </section>",
"    <section class='le-coupon-model le-section' id='modelo-link-cupones'>",
"      <div class='le-model-intro'>",
"        <div>",
"          <span class='le-eyebrow'>UN EJEMPLO CONCRETO · LINK CUPONES</span>",
"          <h2>Así una conexión se convierte en negocio.</h2>",
"          <p><strong>LINK Cupones no vende publicidad.</strong> Un negocio ofrece un beneficio útil para atraer una venta, otro punto LINK puede acercarlo al cliente y LINK cobra sólo cuando esa venta es atribuible a la conexión.</p>",
"        </div>",
"        <div class='le-model-rule'>",
"          <span>Regla simple</span>",
"          <strong>Cliente gana + negocio vende + LINK participa del resultado.</strong>",
"          <small>Los porcentajes se acuerdan por producto. No se aplica una bolsa universal ni se duplican descuento y comisión.</small>",
"        </div>",
"      </div>",
"      <div class='le-model-board'>",
"        <div class='le-model-controls'>",
"          <span class='le-model-label'>Simula una venta</span>",
"          <label for='le-model-price'>Precio base del producto</label>",
"          <div class='le-price-input'><span>$</span><input id='le-model-price' type='number' min='1000' step='1000' value='100000' inputmode='numeric' aria-label='Precio base del producto en pesos chilenos'></div>",
"          <span class='le-model-label le-model-label-spaced'>Participación LINK</span>",
"          <div class='le-model-options' role='group' aria-label='Porcentaje de comisión de LINK'>",
"            <button class='active' data-model-commission='5'>5% <small>Distribución</small></button>",
"            <button data-model-commission='7.5'>7,5% <small>Distribución + adquisición</small></button>",
"            <button data-model-commission='10'>10% <small>Adquisición + conversión</small></button>",
"          </div>",
"          <p class='le-model-helper'>Para hacer visible la mecánica usamos un <strong>beneficio típico de 15% para el cliente</strong>. El porcentaje real se define según el convenio y la economía del producto.</p>",
"        </div>",
"        <div class='le-model-results' aria-live='polite'>",
"          <article class='client'><span>CLIENTE</span><strong id='le-client-benefit'>15%</strong><small id='le-client-benefit-money'>—</small><p>Beneficio sobre el precio base.</p></article>",
"          <span class='le-model-plus'>+</span>",
"          <article class='link'><span>LINK</span><strong id='le-link-percent'>5%</strong><small id='le-link-money'>—</small><p>Comisión sólo cuando la venta es atribuible.</p></article>",
"          <span class='le-model-plus'>=</span>",
"          <article class='acquisition'><span>COSTO DE ADQUISICIÓN</span><strong id='le-total-percent'>20%</strong><small id='le-total-money'>—</small><p>Beneficio cliente + participación LINK.</p></article>",
"          <div class='le-model-summary'>",
"            <div><span>Cliente paga</span><strong id='le-client-pays'>—</strong></div>",
"            <div><span>Negocio recibe</span><strong id='le-business-receives'>—</strong></div>",
"            <div><span>LINK recibe</span><strong id='le-link-receives'>—</strong></div>",
"          </div>",
"        </div>",
"      </div>",
"      <div class='le-model-scale'>",
"        <div><b>5%</b><span>Sólo distribución</span></div><i>→</i>",
"        <div><b>7,5%</b><span>Distribución + adquisición</span></div><i>→</i>",
"        <div><b>10%</b><span>Adquisición + conversión</span></div><i>→</i>",
"        <div><b>10–15%</b><span>Campaña gestionada</span></div><i>→</i>",
"        <div><b>15–20%</b><span>Venta completa</span></div>",
"      </div>",
"      <p class='le-model-footnote'>A mayor responsabilidad de LINK, cambia la participación y debe cambiar también la economía del producto. La referencia de 15% al cliente + 5–10% a LINK es un ejemplo frecuente para explicar el mecanismo, no una obligación para todos los negocios.</p>",
"    </section>",
"    <section class='le-equation-wrap le-section'>",
"      <div class='le-equation-copy'><span class='le-number'>1</span><div><span class='le-eyebrow'>UNA IDEA SIMPLE</span><h2>¿Qué es LINK?</h2><p>Una red donde negocios independientes pueden conectarse, colaborar y compartir capacidades. Cada uno mantiene su propia esencia; LINK hace visibles las relaciones que pueden generar valor.</p></div></div>",
"      <div class='le-equation'>",
"        <div class='le-eq-card'>" + icon('business') + "<strong>Tu negocio</strong><small>Tu identidad, tu propuesta y tus clientes.</small></div>",
"        <span class='le-eq-symbol'>+</span>",
"        <div class='le-eq-card le-eq-link'><b>LINK</b><small>Conexiones, tecnología, herramientas y comunidad.</small></div>",
"        <span class='le-eq-symbol'>=</span>",
"        <div class='le-eq-card le-eq-result'>" + icon('chart') + "<strong>Más posibilidades</strong><small>Más oportunidades para vender, colaborar y crecer.</small></div>",
"      </div>",
"    </section>",
"    <section class='le-business-section le-section'>",
"      <div class='le-section-head'><div><span class='le-eyebrow'>EMPIEZA POR TU REALIDAD</span><h2>LINK empieza por tu negocio</h2><p>Cada rubro necesita conexiones distintas. Selecciona un tipo de negocio para ver cómo podría funcionar LINK alrededor suyo.</p></div></div>",
"      <div class='le-business-shell'>",
"        <div class='le-business-tabs' role='tablist'><button class='active' data-business='hotel'>Hotel</button><button data-business='restaurante'>Restaurante</button><button data-business='turismo'>Turismo</button><button data-business='servicios'>Servicios</button><button data-business='comercio'>Comercio</button></div>",
"        <div class='le-business-detail' id='le-business-detail'></div>",
"      </div>",
"    </section>",
"    <section class='le-process le-section' id='como-funciona'>",
"      <div class='le-section-head le-inline-head'><div><span class='le-eyebrow'>UN PROCESO SENCILLO</span><h2>Cómo funciona</h2><p>LINK transforma una necesidad en una conexión útil, una acción concreta y un resultado que puede aprenderse.</p></div><span class='le-process-hint'>Toca cada etapa para entenderla</span></div>",
"      <div class='le-process-grid'>",
"        <button class='le-process-step active' data-step='1'><span>1</span>" + icon('search') + "<b>Entiende</b><small>Conoce el negocio y lo que necesita.</small></button>",
"        <button class='le-process-step' data-step='2'><span>2</span>" + icon('link') + "<b>Conecta</b><small>Encuentra personas, negocios o herramientas útiles.</small></button>",
"        <button class='le-process-step' data-step='3'><span>3</span>" + icon('bolt') + "<b>Activa</b><small>Convierte la conexión en una acción concreta.</small></button>",
"        <button class='le-process-step' data-step='4'><span>4</span>" + icon('chart') + "<b>Comprueba</b><small>Mide qué ocurrió realmente.</small></button>",
"        <button class='le-process-step' data-step='5'><span>5</span>" + icon('brain') + "<b>Aprende</b><small>Usa el resultado para decidir mejor.</small></button>",
"        <button class='le-process-step' data-step='6'><span>6</span>" + icon('leaf') + "<b>Crece</b><small>Abre nuevas conexiones cuando tienen sentido.</small></button>",
"      </div>",
"      <div class='le-process-explain' id='le-process-explain'><b>1 · Entiende</b><p>LINK parte observando el negocio: qué ofrece, a quién atiende, qué procesos ya tiene y dónde existe una necesidad concreta.</p></div>",
"      <div class='le-flow-strip'><span>Negocio</span><i>→</i><span>Necesidad</span><i>→</i><span>Conexión</span><i>→</i><span>Acción</span><i>→</i><span>Resultado</span><i>→</i><span>Aprendizaje</span></div>",
"    </section>",
"    <section class='le-associative le-section' id='asociativos'>",
"      <div class='le-section-head'><div><span class='le-eyebrow'>NEGOCIOS QUE CRECEN JUNTOS</span><h2>La lógica asociativa de LINK</h2><p>LINK también puede crear productos donde dos o más negocios se ayudan entre sí. El cliente recibe una mejor experiencia y cada negocio obtiene una nueva oportunidad.</p></div></div>",
"      <div class='le-assoc-feature'>",
"        <div class='le-assoc-copy'><div class='le-title-icon'>" + icon('tag') + "</div><span class='le-eyebrow'>EJEMPLO · LINK CUPONES</span><h3>Un beneficio puede circular por toda la red.</h3><p>Un negocio crea un beneficio. Otro negocio lo muestra a sus clientes. La persona descubre una opción útil cerca de ella, activa el beneficio y LINK puede registrar de dónde llegó esa oportunidad.</p>",
"          <div class='le-coupon-select'><button class='active' data-coupon='hotel'>Hotel + Restaurante</button><button data-coupon='tour'>Tour + Restaurante</button><button data-coupon='comercio'>Comercio + Hotel</button></div>",
"          <div class='le-coupon-example' id='le-coupon-example'></div>",
"        </div>",
"        <div class='le-assoc-flow'>",
"          <div class='le-assoc-step'>" + icon('business') + "<strong>1. Un negocio</strong><span>crea un beneficio útil.</span></div><i>→</i>",
"          <div class='le-assoc-step'>" + icon('link') + "<strong>2. Otro negocio</strong><span>lo comparte con su cliente.</span></div><i>→</i>",
"          <div class='le-assoc-step'>" + icon('users') + "<strong>3. El cliente</strong><span>descubre una nueva opción.</span></div><i>→</i>",
"          <div class='le-assoc-step'>" + icon('chart') + "<strong>4. LINK</strong><span>mide origen, activación y resultado.</span></div>",
"          <div class='le-everyone-wins'><b>El valor no se queda en un solo negocio.</b><span>Cliente + negocio que recomienda + negocio que recibe = una relación que puede repetirse.</span></div>",
"        </div>",
"      </div>",
"      <div class='le-assoc-cards'>",
"        <article><div class='le-title-icon'>" + icon('music') + "</div><h3>Experiencias compartidas</h3><p>Un hotel puede recomendar un concierto, una cena, un tour o un servicio. El negocio asociado gana una oportunidad y el hotel mejora la experiencia del huésped.</p><span>Hospitalidad → Experiencia → Cliente</span></article>",
"        <article><div class='le-title-icon'>" + icon('van') + "</div><h3>Servicios conectados</h3><p>Un negocio puede completar su oferta con proveedores de transporte, producción, bienestar u otros servicios sin tener que convertirse en operador de todo.</p><span>Necesidad → Proveedor → Servicio</span></article>",
"        <article><div class='le-title-icon'>" + icon('star') + "</div><h3>Promoción cruzada</h3><p>Dos negocios que comparten público pueden recomendarse, crear beneficios conjuntos o construir una oferta que sea más valiosa que cada parte por separado.</p><span>Audiencia → Alianza → Nueva oportunidad</span></article>",
"      </div>",
"    </section>",
"    <section class='le-benefits le-section' id='ejemplos'>",
"      <div class='le-section-head'><div><span class='le-eyebrow'>LO QUE PUEDE ACTIVARSE</span><h2>¿Qué cambia cuando un negocio se conecta?</h2><p>LINK no promete que todo se active a la vez. Estas son capacidades que pueden aparecer cuando tienen sentido para el negocio.</p></div></div>",
"      <div class='le-benefit-grid'>",
"        <article>" + icon('chart') + "<h3>Más ventas</h3><p>Nuevas ocasiones de compra, reserva o contratación.</p></article>",
"        <article>" + icon('marketing') + "<h3>Más visibilidad</h3><p>Presencia en otros puntos de contacto y negocios conectados.</p></article>",
"        <article>" + icon('gear') + "<h3>Mejor organización</h3><p>Procesos más claros y herramientas compartidas.</p></article>",
"        <article>" + icon('bolt') + "<h3>Automatización</h3><p>Menos tareas repetitivas y más foco en operar.</p></article>",
"        <article>" + icon('chart') + "<h3>Más control</h3><p>Información útil para saber qué está funcionando.</p></article>",
"        <article>" + icon('handshake') + "<h3>Nuevas alianzas</h3><p>Relaciones concretas con negocios complementarios.</p></article>",
"      </div>",
"    </section>",
"    <section class='le-principle le-section'>",
"      <span class='le-eyebrow'>LA IDEA CENTRAL</span>",
"      <blockquote>LINK toma lo que hoy está disperso —negocios, necesidades, personas, herramientas y oportunidades— y lo convierte en relaciones que pueden generar valor.</blockquote>",
"      <p>El negocio sigue siendo el centro. LINK no reemplaza su identidad: amplía lo que puede hacer conectado con otros.</p>",
"    </section>",
"    <section class='le-cta le-section'>",
"      <div><span class='le-eyebrow'>LINK WORLD</span><h2>Tu negocio puede entrar a LINK.</h2><p>Empieza entendiendo cómo funciona tu negocio y qué conexiones podrían aportarle valor.</p></div>",
"      <div class='le-cta-actions'><a class='le-primary' href='/'>Explorar LINK World <span>→</span></a><a class='le-secondary' href='#que-es'>Volver arriba</a></div>",
"    </section>",
"  </main>",
"  <footer class='le-footer'><a class='le-brand' href='/'><img src='/link-world-mark.svg' alt=''><span><strong>LINK.</strong> World</span></a><p>Negocios independientes. Conexiones útiles. Más posibilidades.</p></footer>",
"</div>"
].join('');

const networkCopy = {
  clientes: ['Clientes', 'LINK puede conectar tu negocio con nuevas ocasiones de compra, reserva o recomendación.'],
  marketing: ['Marketing', 'Tu negocio puede aparecer en canales, contenidos y puntos de contacto de otros negocios conectados.'],
  pagos: ['Pagos', 'Una conexión comercial puede continuar hasta el cobro y dejar un resultado trazable.'],
  proveedores: ['Proveedores', 'LINK puede acercar opciones que completan tu oferta sin obligarte a producir todo internamente.'],
  operaciones: ['Operaciones', 'Herramientas y procesos compartidos pueden reducir tareas repetitivas y ordenar el trabajo.'],
  alianzas: ['Alianzas', 'Dos negocios complementarios pueden crear una oportunidad que no existía cuando actuaban por separado.']
};
document.querySelectorAll('[data-network]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-network]').forEach((b) => b.classList.toggle('active', b === button));
    const copy = networkCopy[button.dataset.network];
    const caption = document.querySelector('#le-network-caption');
    caption.innerHTML = '<b>' + copy[0] + '</b><span>' + copy[1] + '</span>';
  });
});

const businessModels = {
  hotel: {
    eyebrow: 'HOTEL',
    title: 'Un hotel puede convertirse en un punto de conexión.',
    summary: 'Además de vender habitaciones, puede acercar experiencias y servicios que mejoren la estadía sin tener que operar cada servicio por sí mismo.',
    benefits: ['Experiencias para huéspedes', 'Restaurantes y actividades cercanas', 'Transfer y servicios complementarios', 'Promociones cruzadas con negocios asociados'],
    side: 'El huésped encuentra más opciones. El hotel mejora su propuesta. Otros negocios acceden a nuevos clientes.'
  },
  restaurante: {
    eyebrow: 'RESTAURANTE',
    title: 'Un restaurante puede recibir público desde toda la red.',
    summary: 'Puede conectarse con hoteles, tours, eventos y otros negocios que comparten visitantes o clientes potenciales.',
    benefits: ['Promociones y beneficios cruzados', 'Contenido y visibilidad compartida', 'Reservas originadas desde aliados', 'Eventos y experiencias conjuntas'],
    side: 'Una mesa vacía puede transformarse en una oportunidad cuando otro negocio ya tiene al cliente correcto.'
  },
  turismo: {
    eyebrow: 'TURISMO',
    title: 'Una experiencia puede llegar más lejos conectada.',
    summary: 'Tours y actividades pueden aparecer dentro de hoteles, alojamientos, restaurantes y otros puntos donde el viajero ya está tomando decisiones.',
    benefits: ['Distribución en negocios asociados', 'Reservas y coordinación', 'Servicios complementarios', 'Promoción conjunta'],
    side: 'El viajero descubre una experiencia en el momento adecuado y el proveedor gana un nuevo canal.'
  },
  servicios: {
    eyebrow: 'SERVICIOS',
    title: 'Un servicio puede convertirse en una capacidad compartida.',
    summary: 'Transporte, producción, bienestar, diseño u otros servicios pueden conectarse a negocios que los necesitan de forma recurrente.',
    benefits: ['Nuevos clientes B2B', 'Demanda proveniente de la red', 'Procesos de coordinación', 'Alianzas recurrentes'],
    side: 'En vez de buscar desde cero cada vez, la red puede acercar capacidad disponible donde existe una necesidad.'
  },
  comercio: {
    eyebrow: 'COMERCIO',
    title: 'Un comercio puede transformar cercanía en colaboración.',
    summary: 'Tiendas y negocios locales pueden crear beneficios, recomendaciones y productos conjuntos con otros puntos cercanos.',
    benefits: ['LINK Cupones', 'Promoción cruzada', 'Nuevas audiencias', 'Beneficios por ubicación'],
    side: 'Los negocios dejan de competir únicamente por separado y pueden crear razones para que el cliente visite más de un lugar.'
  }
};
function renderBusiness(key) {
  const model = businessModels[key];
  document.querySelectorAll('[data-business]').forEach((b) => b.classList.toggle('active', b.dataset.business === key));
  document.querySelector('#le-business-detail').innerHTML =
    "<div class='le-business-copy'><span class='le-eyebrow'>" + model.eyebrow + "</span><h3>" + model.title + "</h3><p>" + model.summary + "</p><ul>" +
    model.benefits.map((item) => '<li><span>✓</span>' + item + '</li>').join('') +
    "</ul></div><aside><span>¿Qué gana la conexión?</span><strong>" + model.side + "</strong><div class='le-mini-network'><i></i><b>Tu negocio</b><i></i><b>LINK</b><i></i><b>Nuevas oportunidades</b></div></aside>";
}
document.querySelectorAll('[data-business]').forEach((button) => button.addEventListener('click', () => renderBusiness(button.dataset.business)));
renderBusiness('hotel');

const processCopy = {
  1: ['1 · Entiende', 'LINK parte observando el negocio: qué ofrece, a quién atiende, qué procesos ya tiene y dónde existe una necesidad concreta.'],
  2: ['2 · Conecta', 'Busca una relación útil: un cliente, un proveedor, otro negocio, una herramienta o un canal que pueda resolver esa necesidad.'],
  3: ['3 · Activa', 'La relación se transforma en una acción: una recomendación, una campaña, una reserva, un beneficio, una coordinación o un cobro.'],
  4: ['4 · Comprueba', 'LINK diferencia la intención del resultado. Lo importante es saber si la acción ocurrió y qué produjo.'],
  5: ['5 · Aprende', 'Cada resultado aporta contexto para repetir lo que funciona, corregir lo que no y tomar mejores decisiones.'],
  6: ['6 · Crece', 'Cuando una relación demuestra valor, puede repetirse, conectarse con otras o convertirse en una nueva capacidad para la red.']
};
document.querySelectorAll('[data-step]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-step]').forEach((b) => b.classList.toggle('active', b === button));
    const copy = processCopy[button.dataset.step];
    document.querySelector('#le-process-explain').innerHTML = '<b>' + copy[0] + '</b><p>' + copy[1] + '</p>';
  });
});

const modelState = { price: 100000, clientBenefit: 15, commission: 5 };
const clp = new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
function renderCouponBusinessModel() {
  const price = Math.max(1000, Number(modelState.price) || 100000);
  const clientMoney = price * modelState.clientBenefit / 100;
  const linkMoney = price * modelState.commission / 100;
  const totalMoney = clientMoney + linkMoney;
  const clientPays = price - clientMoney;
  const businessReceives = price - totalMoney;
  document.querySelector('#le-client-benefit').textContent = modelState.clientBenefit.toLocaleString('es-CL') + '%';
  document.querySelector('#le-client-benefit-money').textContent = clp.format(clientMoney);
  document.querySelector('#le-link-percent').textContent = modelState.commission.toLocaleString('es-CL') + '%';
  document.querySelector('#le-link-money').textContent = clp.format(linkMoney);
  document.querySelector('#le-total-percent').textContent = (modelState.clientBenefit + modelState.commission).toLocaleString('es-CL') + '%';
  document.querySelector('#le-total-money').textContent = clp.format(totalMoney);
  document.querySelector('#le-client-pays').textContent = clp.format(clientPays);
  document.querySelector('#le-business-receives').textContent = clp.format(businessReceives);
  document.querySelector('#le-link-receives').textContent = clp.format(linkMoney);
}
document.querySelector('#le-model-price')?.addEventListener('input', (event) => {
  modelState.price = event.currentTarget.value;
  renderCouponBusinessModel();
});
document.querySelectorAll('[data-model-commission]').forEach((button) => {
  button.addEventListener('click', () => {
    modelState.commission = Number(button.dataset.modelCommission);
    document.querySelectorAll('[data-model-commission]').forEach((b) => b.classList.toggle('active', b === button));
    renderCouponBusinessModel();
  });
});
renderCouponBusinessModel();

const couponExamples = {
  hotel: ['Hotel + Restaurante', 'El hotel ofrece a su huésped un beneficio en un restaurante cercano. El restaurante recibe una visita que probablemente no habría captado por sí solo.'],
  tour: ['Tour + Restaurante', 'Después de una excursión, el pasajero recibe una opción útil para comer. El tour mejora el cierre de la experiencia y el restaurante obtiene un cliente nuevo.'],
  comercio: ['Comercio + Hotel', 'Un comercio local crea un beneficio para huéspedes de alojamientos asociados. El visitante descubre el lugar y el hotel agrega valor sin operar ese comercio.']
};
function renderCoupon(key) {
  document.querySelectorAll('[data-coupon]').forEach((b) => b.classList.toggle('active', b.dataset.coupon === key));
  const copy = couponExamples[key];
  document.querySelector('#le-coupon-example').innerHTML = '<b>' + copy[0] + '</b><p>' + copy[1] + '</p>';
}
document.querySelectorAll('[data-coupon]').forEach((button) => button.addEventListener('click', () => renderCoupon(button.dataset.coupon)));
renderCoupon('hotel');

document.querySelectorAll('.le-nav a').forEach((anchor) => {
  anchor.addEventListener('click', () => document.querySelector('.le-nav')?.classList.remove('open'));
});

const navLinks = [...document.querySelectorAll('.le-nav a')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((e) => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + visible.target.id));
}, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });
sections.forEach((section) => observer.observe(section));
