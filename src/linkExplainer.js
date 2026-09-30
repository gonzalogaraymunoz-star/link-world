import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './world/connection.js';
import './linkExplainer.css';

const app = document.querySelector('#app');
const db = createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const LINK_WHATSAPP = 'https://wa.me/qr/ZYDZ5QZBDG4AJ1';
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
"    <a class='le-brand' href='/ser-parte/' aria-label='Volver a LINK World'><img src='/link-world-mark.svg' alt=''><span><strong>LINK.</strong> World</span></a>",
"    <nav class='le-nav' aria-label='Contenido de LINK'>",
"      <a href='#que-es'>Qué es</a><a href='#modelo-link-cupones'>Modelo</a><a href='#como-funciona'>Cómo funciona</a><a href='#asociativos'>Asociativos</a><a href='#ejemplos'>Ejemplos</a><a href='#contacto'>Contacto</a>",
"    </nav>",
"    <a class='le-back' href='/ser-parte/'>Entrar a LINK World <span>→</span></a>",
"  </header>",
"  <main>",
"    <section class='le-hero le-section' id='que-es'>",
"      <div class='le-hero-copy'>",
"        <span class='le-eyebrow'>LINK · PARA NEGOCIOS</span>",
"        <h1>Tu negocio<br>no está solo.</h1>",
"        <p class='le-lead'><strong>LINK conecta lo que tu negocio hace con lo que otros necesitan.</strong> Ventas, marketing, reservas, pagos, tecnología, eventos, transporte y alianzas pueden activarse cuando aportan valor.</p>",
"        <div class='le-hero-actions'><a class='le-primary' href='#modelo-link-cupones'>Ver modelo LINK Cupones <span>→</span></a><a class='le-secondary' href='#como-funciona'>Cómo funciona LINK</a></div>",
"        <p class='le-note'>Cada negocio activa una combinación distinta de capacidades según su realidad, sus oportunidades y sus objetivos.</p>",
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
"          <p><strong>LINK Cupones convierte distribución en una venta medible.</strong> Un negocio ofrece un beneficio útil, otro punto LINK puede acercarlo al cliente y LINK participa cuando la conexión genera una venta atribuible.</p>",
"        </div>",
"        <div class='le-model-rule'>",
"          <span>Regla simple</span>",
"          <strong>Cliente gana + negocio vende + LINK participa del resultado.</strong>",
"          <small>Los porcentajes se acuerdan por producto y se distribuyen según el rol de cada participante en la venta.</small>",
"        </div>",
"      </div>",
"      <div class='le-model-board'>",
"        <div class='le-model-controls'>",
"          <span class='le-model-label'>Simula una venta</span>",
"          <label for='le-model-price'>Precio base del producto</label>",
"          <div class='le-price-input'><span>$</span><input id='le-model-price' type='number' min='1000' step='1000' value='100000' inputmode='numeric' aria-label='Precio base del producto en pesos chilenos'></div>",
"          <span class='le-model-label le-model-label-spaced'>Distribuye el acuerdo</span>",
"          <div class='le-model-edit-grid'>",
"            <label class='le-model-edit'><span>Beneficio cliente</span><div><input id='le-client-input' type='number' min='0' max='100' step='0.5' value='15' inputmode='decimal'><b>%</b></div></label>",
"            <label class='le-model-edit'><span>Participación LINK</span><div><input id='le-link-input' type='number' min='0' max='100' step='0.5' value='10' inputmode='decimal'><b>%</b></div></label>",
"            <label class='le-model-edit'><span>Aliado / referente</span><div><input id='le-ally-input' type='number' min='0' max='100' step='0.5' value='0' inputmode='decimal'><b>%</b></div></label>",
"          </div>",
"          <div class='le-model-minimum' id='le-model-minimum'><span>Mínimo para acuerdo LINK</span><strong id='le-minimum-status'>25% ✓</strong></div>",
"          <p class='le-model-helper'>Puedes escribir <strong>el monto y los porcentajes que quieras</strong>. La condición es que la suma destinada a cliente + LINK + aliado sea de <strong>25% o más</strong> del precio base.</p>",
"        </div>",
"        <div class='le-model-results' aria-live='polite'>",
"          <article class='client'><span>CLIENTE</span><strong id='le-client-benefit'>15%</strong><small id='le-client-benefit-money'>—</small><p>Beneficio directo para activar la compra.</p></article>",
"          <span class='le-model-plus'>+</span>",
"          <article class='link'><span>LINK</span><strong id='le-link-percent'>10%</strong><small id='le-link-money'>—</small><p>Participación por generar y medir la conexión.</p></article>",
"          <span class='le-model-plus'>+</span>",
"          <article class='ally'><span>ALIADO</span><strong id='le-ally-percent'>0%</strong><small id='le-ally-money'>—</small><p>Participación opcional para quien refiere la venta.</p></article>",
"          <div class='le-model-total-card'><span>APORTE TOTAL DEL NEGOCIO</span><strong id='le-total-percent'>25%</strong><small id='le-total-money'>—</small><p id='le-total-rule'>Cumple el mínimo LINK.</p></div>",
"          <div class='le-model-summary'>",
"            <div><span>Cliente paga</span><strong id='le-client-pays'>—</strong></div>",
"            <div><span>Negocio recibe neto</span><strong id='le-business-receives'>—</strong></div>",
"            <div><span>LINK recibe</span><strong id='le-link-receives'>—</strong></div>",
"            <div><span>Aliado recibe</span><strong id='le-ally-receives'>—</strong></div>",
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
"      <div class='le-process-explain' id='le-process-explain'><b>Entiende</b><p>Identifica qué ofrece el negocio, a quién atiende, qué necesita y dónde existe una oportunidad concreta.</p></div>",
"      <div class='le-flow-strip'><span>Negocio</span><i>→</i><span>Necesidad</span><i>→</i><span>Conexión</span><i>→</i><span>Acción</span><i>→</i><span>Resultado</span><i>→</i><span>Aprendizaje</span></div>",
"    </section>",
"    <section class='le-associative le-section' id='asociativos'>",
"      <div class='le-section-head'><div><span class='le-eyebrow'>NEGOCIOS QUE CRECEN JUNTOS</span><h2>La lógica asociativa de LINK</h2><p>LINK también puede crear productos donde dos o más negocios se ayudan entre sí. El cliente recibe una mejor experiencia y cada negocio obtiene una nueva oportunidad.</p></div></div>",
"      <div class='le-assoc-feature'>",
"        <div class='le-assoc-copy'><div class='le-title-icon'>" + icon('tag') + "</div><span class='le-eyebrow'>EJEMPLOS · ASOCIACIONES LINK</span><h3>Una necesidad puede convertirse en una relación útil.</h3><p>Los negocios pueden asociarse de distintas maneras: compartiendo beneficios, servicios, experiencias, producción, tecnología o canales de venta. Toca un caso para ver la lógica.</p>",
"          <div class='le-coupon-select le-ecosystem-cases'><button class='active' data-coupon='caracol-conciertos'><b>Caracol + LINK Conciertos</b><small>programación + público</small></button><button data-coupon='hotel-transfer'><b>Hotel Experience + Transfer Hotel Atacama</b><small>servicio complementario</small></button><button data-coupon='lama-hotel'><b>Lama Travelers + Hotel Experience</b><small>turismo + hospitalidad</small></button><button data-coupon='caracol-link'><b>Caracol + LINK</b><small>marketing + trazabilidad</small></button><button data-coupon='hotel-conciertos'><b>Hotel + LINK Conciertos</b><small>hospitalidad + cultura</small></button><button data-coupon='transfer-hotel'><b>Transfer Hotel Atacama + Hotel Experience</b><small>movilidad + huésped</small></button></div>",
"          <div class='le-coupon-example' id='le-coupon-example'></div>",
"        </div>",
"        <div class='le-assoc-flow'>",
"          <div class='le-assoc-step'>" + icon('business') + "<strong>1. Un negocio</strong><span>tiene una necesidad u oportunidad.</span></div><i>→</i>",
"          <div class='le-assoc-step'>" + icon('link') + "<strong>2. Otro negocio</strong><span>aporta una capacidad complementaria.</span></div><i>→</i>",
"          <div class='le-assoc-step'>" + icon('users') + "<strong>3. El cliente</strong><span>recibe una solución más completa.</span></div><i>→</i>",
"          <div class='le-assoc-step'>" + icon('chart') + "<strong>4. LINK</strong><span>mide origen, activación y resultado.</span></div>",
"          <div class='le-everyone-wins'><b>El valor circula entre negocios.</b><span>Necesidad + capacidad complementaria + resultado comprobable = una relación que puede repetirse.</span></div>",
"        </div>",
"      </div>",
"      <div class='le-assoc-cards'>",
"        <button class='le-assoc-card' data-assoc='beneficios'><div class='le-title-icon'>" + icon('tag') + "</div><h3>Beneficios compartidos</h3><p>Un negocio crea una ventaja y otro la acerca al cliente.</p><span>Beneficio → Recomendación → Venta</span><em>Ver cómo funciona →</em></button>",
"        <button class='le-assoc-card' data-assoc='experiencias'><div class='le-title-icon'>" + icon('music') + "</div><h3>Experiencias compartidas</h3><p>Una experiencia complementa lo que otro negocio ya entrega.</p><span>Hospitalidad → Experiencia → Cliente</span><em>Ver ejemplos →</em></button>",
"        <button class='le-assoc-card' data-assoc='servicios'><div class='le-title-icon'>" + icon('van') + "</div><h3>Servicios conectados</h3><p>Un negocio suma capacidad sin tener que operar todo.</p><span>Necesidad → Proveedor → Servicio</span><em>Ver ejemplos →</em></button>",
"        <button class='le-assoc-card' data-assoc='promocion'><div class='le-title-icon'>" + icon('star') + "</div><h3>Promoción cruzada</h3><p>Dos negocios comparten audiencia y construyen una oportunidad conjunta.</p><span>Audiencia → Alianza → Oportunidad</span><em>Ver ejemplos →</em></button>",
"        <button class='le-assoc-card' data-assoc='operacion'><div class='le-title-icon'>" + icon('gear') + "</div><h3>Operación complementaria</h3><p>Una parte de la operación puede resolverse con otro negocio.</p><span>Necesidad → Capacidad → Operación</span><em>Ver ejemplos →</em></button>",
"        <button class='le-assoc-card' data-assoc='derivacion'><div class='le-title-icon'>" + icon('link') + "</div><h3>Derivación local</h3><p>Un punto LINK acerca al cliente a otra opción útil cercana.</p><span>Contexto → Derivación → Resultado</span><em>Ver ejemplos →</em></button>",
"      </div>",
"    </section>",
"    <section class='le-benefits le-section' id='ejemplos'>",
"      <div class='le-section-head'><div><span class='le-eyebrow'>LO QUE PUEDE ACTIVARSE</span><h2>¿Qué cambia cuando un negocio se conecta?</h2><p>LINK no promete que todo se active a la vez. Estas son capacidades que pueden aparecer cuando tienen sentido para el negocio.</p></div></div>",
"      <div class='le-benefit-grid'>",
"        <button class='le-benefit-card' data-benefit='ventas'>" + icon('chart') + "<h3>Más ventas</h3><p>Nuevas ocasiones de compra, reserva o contratación.</p><em>Ver ejemplo →</em></button>",
"        <button class='le-benefit-card' data-benefit='visibilidad'>" + icon('marketing') + "<h3>Más visibilidad</h3><p>Presencia en más puntos de contacto.</p><em>Ver ejemplo →</em></button>",
"        <button class='le-benefit-card' data-benefit='organizacion'>" + icon('gear') + "<h3>Mejor organización</h3><p>Procesos más claros y coordinados.</p><em>Ver ejemplo →</em></button>",
"        <button class='le-benefit-card' data-benefit='automatizacion'>" + icon('bolt') + "<h3>Automatización</h3><p>Menos tareas repetitivas y más foco.</p><em>Ver ejemplo →</em></button>",
"        <button class='le-benefit-card' data-benefit='control'>" + icon('chart') + "<h3>Más control</h3><p>Información útil para saber qué funciona.</p><em>Ver ejemplo →</em></button>",
"        <button class='le-benefit-card' data-benefit='alianzas'>" + icon('handshake') + "<h3>Nuevas alianzas</h3><p>Relaciones concretas con negocios complementarios.</p><em>Ver ejemplo →</em></button>",
"      </div>",
"    </section>",
"    <section class='le-principle le-section'>",
"      <span class='le-eyebrow'>LA IDEA CENTRAL</span>",
"      <blockquote>LINK toma lo que hoy está disperso —negocios, necesidades, personas, herramientas y oportunidades— y lo convierte en relaciones que pueden generar valor.</blockquote>",
"      <p>El negocio sigue siendo el centro. LINK amplía lo que puede hacer al conectarlo con capacidades complementarias.</p>",
"    </section>",
"    <section class='le-contact le-section' id='contacto'>",
"      <div class='le-contact-copy'>",
"        <span class='le-eyebrow'>CONECTA TU NEGOCIO</span>",
"        <h2>Empecemos por conocernos.</h2>",
"        <p>Déjanos tu Instagram o WhatsApp. Desde ahí coordinamos una conversación para conocer tu negocio, sus capacidades y las conexiones que pueden aportar valor.</p>",
"        <a class='le-whatsapp-direct' href='https://wa.me/qr/ZYDZ5QZBDG4AJ1' target='_blank' rel='noopener noreferrer'><span class='le-wa-dot'>●</span><span><b>Hablar directamente por WhatsApp</b><small>Abrir contacto LINK</small></span><i>↗</i></a>",
"        <div class='le-contact-rule'><span>1</span><p>Recibimos tu contacto.</p><span>2</span><p>Agendamos una reunión para conocer tu negocio.</p><span>3</span><p>Diseñamos la conexión y comenzamos tu integración.</p></div>",
"      </div>",
"      <form class='le-contact-form' id='le-contact-form' novalidate>",
"        <div class='le-form-head'><span>Solicitud de conexión</span><small>2 minutos</small></div>",
"        <label><span>Negocio *</span><input id='le-contact-business' name='business' type='text' minlength='2' maxlength='120' autocomplete='organization' placeholder='Nombre de tu negocio' required></label>",
"        <label><span>Tu nombre</span><input id='le-contact-name' name='name' type='text' maxlength='120' autocomplete='name' placeholder='Cómo te llamas'></label>",
"        <div class='le-form-split'>",
"          <label><span>Instagram</span><input id='le-contact-instagram' name='instagram' type='text' maxlength='180' inputmode='url' placeholder='@usuario o instagram.com/usuario'></label>",
"          <label><span>WhatsApp</span><input id='le-contact-whatsapp' name='whatsapp' type='tel' maxlength='24' autocomplete='tel' placeholder='+56 9 1234 5678'></label>",
"        </div>",
"        <label class='le-honeypot' aria-hidden='true' tabindex='-1'><span>Sitio web</span><input id='le-contact-website' type='text' autocomplete='off' tabindex='-1'></label>",
"        <p class='le-form-note'>Comparte Instagram o WhatsApp para preparar la reunión y validar el contacto antes de diseñar la conexión.</p>",
"        <button class='le-contact-submit' id='le-contact-submit' type='submit'>Enviar solicitud <span>→</span></button>",
"        <div class='le-contact-status' id='le-contact-status' role='status' aria-live='polite'></div>",
"      </form>",
"    </section>",
"    <section class='le-cta le-section'>",
"      <div><span class='le-eyebrow'>LINK WORLD</span><h2>Explora cómo vive la red.</h2><p>LINK World muestra los negocios, relaciones y aprendizajes que ya fueron incorporados al sistema.</p></div>",
"      <div class='le-cta-actions'><a class='le-primary' href='/ser-parte/'>Entrar a LINK World <span>→</span></a><a class='le-secondary' href='#que-es'>Volver arriba</a></div>",
"    </section>",
"  </main>",
"  <footer class='le-footer'><a class='le-brand' href='/ser-parte/'><img src='/link-world-mark.svg' alt=''><span><strong>LINK.</strong> World</span></a><p>Negocios independientes. Conexiones útiles. Más posibilidades.</p></footer>",
"</div>"
].join('');

app.insertAdjacentHTML('beforeend', [
  "<div class='le-detail-layer' id='le-detail-layer' aria-hidden='true'>",
  "  <button class='le-detail-backdrop' data-detail-close aria-label='Cerrar explicación'></button>",
  "  <aside class='le-detail-pop' role='dialog' aria-modal='true' aria-labelledby='le-detail-title'>",
  "    <button class='le-detail-close' data-detail-close aria-label='Cerrar'>×</button>",
  "    <span class='le-detail-kicker' id='le-detail-kicker'>LINK</span>",
  "    <h3 id='le-detail-title'></h3>",
  "    <p class='le-detail-meaning' id='le-detail-meaning'></p>",
  "    <div class='le-detail-block'><span>QUÉ HACE LINK</span><p id='le-detail-action'></p></div>",
  "    <div class='le-detail-block le-detail-example'><span>EJEMPLO</span><p id='le-detail-example'></p><div class='le-detail-chips' id='le-detail-chips'></div></div>",
  "    <div class='le-detail-key' id='le-detail-key'></div>",
  "  </aside>",
  "</div>"
].join(''));


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

const detailLayer = document.querySelector('#le-detail-layer');
const detailTitle = document.querySelector('#le-detail-title');
const detailKicker = document.querySelector('#le-detail-kicker');
const detailMeaning = document.querySelector('#le-detail-meaning');
const detailAction = document.querySelector('#le-detail-action');
const detailExample = document.querySelector('#le-detail-example');
const detailChips = document.querySelector('#le-detail-chips');
const detailKey = document.querySelector('#le-detail-key');

function openDetail(detail) {
  if (!detailLayer || !detail) return;
  detailKicker.textContent = detail.kicker || 'LINK';
  detailTitle.textContent = detail.title || '';
  detailMeaning.textContent = detail.meaning || '';
  detailAction.textContent = detail.action || '';
  detailExample.textContent = detail.example || '';
  detailChips.innerHTML = (detail.chips || []).map(item => '<span>'+item+'</span>').join('');
  detailKey.innerHTML = detail.key ? '<b>Idea clave</b><span>'+detail.key+'</span>' : '';
  detailLayer.classList.add('open');
  detailLayer.setAttribute('aria-hidden','false');
  document.body.classList.add('le-detail-open');
}
function closeDetail() {
  detailLayer?.classList.remove('open');
  detailLayer?.setAttribute('aria-hidden','true');
  document.body.classList.remove('le-detail-open');
}
document.querySelectorAll('[data-detail-close]').forEach(el => el.addEventListener('click', closeDetail));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDetail(); });

const processDetails = {
  1: {kicker:'1 · ENTIENDE',title:'Primero entiende el negocio.',meaning:'LINK observa antes de mover nada.',action:'Identifica qué ofrece el negocio, a quién atiende, qué necesita y dónde existe una oportunidad concreta.',example:'Un hotel recibe huéspedes que preguntan dónde cenar o qué hacer por la tarde.',chips:['Oferta','Cliente','Necesidad'],key:'No se conecta por conectar: primero se entiende el contexto.'},
  2: {kicker:'2 · CONECTA',title:'Busca la relación más útil.',meaning:'LINK encuentra quién o qué puede resolver esa necesidad.',action:'Relaciona al negocio con clientes, aliados, servicios, herramientas o canales que tienen sentido para el caso.',example:'Ese hotel puede conectarse con un restaurante, un tour o un traslado.',chips:['Aliado','Servicio','Herramienta'],key:'La conexión tiene que resolver algo real.'},
  3: {kicker:'3 · ACTIVA',title:'La conexión se vuelve acción.',meaning:'La relación deja de ser una idea y empieza a operar.',action:'Puede convertirse en una recomendación, beneficio, reserva, campaña, coordinación o cobro.',example:'El hotel comparte un beneficio para cenar o reserva una experiencia para su huésped.',chips:['Beneficio','Reserva','Coordinación'],key:'LINK busca acciones concretas, no relaciones decorativas.'},
  4: {kicker:'4 · COMPRUEBA',title:'Mide qué ocurrió de verdad.',meaning:'LINK separa intención de resultado.',action:'Comprueba si hubo consulta, activación, visita, reserva, compra o uso efectivo de la conexión.',example:'Se registra si la persona fue al restaurante y si esa recomendación terminó en venta.',chips:['Origen','Activación','Venta'],key:'Lo que no se comprueba todavía no cuenta como resultado.'},
  5: {kicker:'5 · APRENDE',title:'El resultado deja aprendizaje.',meaning:'LINK usa lo ocurrido para decidir mejor la siguiente vez.',action:'Detecta qué funciona, qué no y qué conviene repetir, ajustar o descartar.',example:'Si un beneficio de cena convierte mejor que otro, esa ruta puede fortalecerse.',chips:['Resultado','Patrón','Decisión'],key:'Cada acción útil aumenta el contexto del sistema.'},
  6: {kicker:'6 · CRECE',title:'Lo que funciona puede escalar.',meaning:'LINK abre nuevas conexiones sólo cuando agregan valor.',action:'Una relación probada puede repetirse, sumar aliados o convertirse en un producto asociativo.',example:'Una ruta hotel + restaurante puede después sumar tour, traslado o evento.',chips:['Repetir','Escalar','Conectar'],key:'Crecer no es sumar cosas; es ampliar relaciones que ya demostraron valor.'}
};
document.querySelectorAll('[data-step]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-step]').forEach((b) => b.classList.toggle('active', b === button));
    const detail = processDetails[button.dataset.step];
    document.querySelector('#le-process-explain').innerHTML = '<b>' + detail.kicker.replace(' · ',' · ').replace(/^\d+ · /,'') + '</b><p>' + detail.action + '</p>';
    openDetail(detail);
  });
});

const associationDetails = {
  beneficios:{kicker:'ASOCIACIÓN · BENEFICIOS',title:'Beneficios compartidos',meaning:'Un negocio crea una ventaja y otro la acerca al cliente.',action:'LINK registra quién originó la oportunidad, dónde se activó y qué resultado produjo.',example:'Un hotel entrega a su huésped un beneficio en un restaurante cercano.',chips:['Caracol + LINK','Hotel Experience + Transfer Hotel Atacama','Lama Travelers + Hotel Experience'],key:'El beneficio es un puente entre negocios, no sólo un descuento.'},
  experiencias:{kicker:'ASOCIACIÓN · EXPERIENCIAS',title:'Experiencias compartidas',meaning:'Una experiencia complementa lo que otro negocio ya entrega.',action:'LINK permite que un punto de contacto recomiende y coordine una experiencia de otro negocio.',example:'Un hotel puede acercar una cena, concierto, tour o experiencia de bienestar.',chips:['Hotel + LINK Conciertos','Caracol + LINK Conciertos','Lama Travelers + Hotel Experience'],key:'El cliente recibe una experiencia más completa y ambos negocios ganan valor.'},
  servicios:{kicker:'ASOCIACIÓN · SERVICIOS',title:'Servicios conectados',meaning:'Un negocio suma capacidad sin tener que operar todo.',action:'LINK conecta necesidades operativas con proveedores que pueden resolverlas.',example:'Un hotel puede ofrecer traslado sin transformarse en una empresa de transporte.',chips:['Hotel Experience + Transfer Hotel Atacama','Transfer Hotel Atacama + Hotel Experience','Lama Travelers + Hotel Experience'],key:'La red amplía capacidad sin duplicar estructuras.'},
  promocion:{kicker:'ASOCIACIÓN · PROMOCIÓN',title:'Promoción cruzada',meaning:'Negocios con público compatible pueden recomendarse.',action:'LINK ayuda a ordenar la oferta conjunta y a medir qué canal originó la oportunidad.',example:'Un café y una pastelería pueden crear un beneficio conjunto para una misma audiencia.',chips:['Caracol + LINK','Caracol + LINK Conciertos','Hotel + LINK Conciertos'],key:'Compartir audiencia puede crear demanda nueva para ambos.'},
  operacion:{kicker:'ASOCIACIÓN · OPERACIÓN',title:'Operación complementaria',meaning:'Una parte del trabajo puede vivir en otro negocio especializado.',action:'LINK conecta la operación, deja responsables claros y mantiene trazabilidad del resultado.',example:'Un evento puede apoyarse en ticketing, producción técnica o transporte sin internalizar esas áreas.',chips:['Caracol + LINK','Hotel Experience + Transfer Hotel Atacama','Hotel + LINK Conciertos'],key:'La asociación también puede ser operativa, no sólo comercial.'},
  derivacion:{kicker:'ASOCIACIÓN · DERIVACIÓN',title:'Derivación local',meaning:'El cliente recibe una opción útil en el momento correcto.',action:'LINK convierte cercanía y contexto en una recomendación trazable entre negocios.',example:'La recepción de un hotel puede derivar una cena, un tour o un servicio cercano.',chips:['Hotel Experience → Transfer Hotel Atacama','Hotel → LINK Conciertos','Caracol → LINK','Lama Travelers → Hotel Experience'],key:'La oportunidad aparece donde el cliente ya está tomando una decisión.'}
};
document.querySelectorAll('[data-assoc]').forEach(button => {
  button.addEventListener('click', () => openDetail(associationDetails[button.dataset.assoc]));
});

const benefitDetails = {
  ventas:{kicker:'CAPACIDAD · VENTAS',title:'Más ventas',meaning:'Aparecen nuevas ocasiones de compra, reserva o contratación.',action:'LINK abre canales donde otro negocio, una experiencia o un servicio puede generar una oportunidad comercial.',example:'Un hotel deriva una cena o un tour y esa recomendación termina en venta.',chips:['Consulta','Reserva','Venta'],key:'La venta puede nacer fuera del negocio que finalmente la recibe.'},
  visibilidad:{kicker:'CAPACIDAD · VISIBILIDAD',title:'Más visibilidad',meaning:'El negocio aparece en más puntos de contacto relevantes.',action:'LINK puede hacer visible una oferta dentro de otros negocios, canales, mensajes o beneficios asociados.',example:'Un restaurante aparece ante huéspedes de hoteles cercanos.',chips:['Hotel','RRSS','Beneficio'],key:'No es aparecer en todas partes; es aparecer donde hay contexto.'},
  organizacion:{kicker:'CAPACIDAD · ORGANIZACIÓN',title:'Mejor organización',meaning:'Las conexiones necesitan procesos claros para no perderse.',action:'LINK ordena cómo se registra, deriva, sigue y comprueba cada oportunidad.',example:'Una recomendación deja de depender sólo de memoria o WhatsApp disperso.',chips:['Registro','Responsable','Seguimiento'],key:'Ordenar la relación permite repetirla.'},
  automatizacion:{kicker:'CAPACIDAD · AUTOMATIZACIÓN',title:'Automatización',meaning:'Las tareas repetitivas pueden convertirse en flujo.',action:'LINK conecta formularios, registros, avisos y acciones para reducir trabajo manual.',example:'Una solicitud puede registrarse, clasificarse y quedar lista para seguimiento automáticamente.',chips:['Formulario','Registro','Seguimiento'],key:'Automatizar sirve cuando libera tiempo sin perder control.'},
  control:{kicker:'CAPACIDAD · CONTROL',title:'Más control',meaning:'El negocio puede ver qué conexión está funcionando.',action:'LINK conserva origen, estado y resultado para comparar acciones y alianzas.',example:'Se puede saber qué hotel está generando visitas o qué beneficio convierte mejor.',chips:['Origen','Resultado','Comparación'],key:'Lo importante no es tener más datos, sino saber qué produjo valor.'},
  alianzas:{kicker:'CAPACIDAD · ALIANZAS',title:'Nuevas alianzas',meaning:'Negocios complementarios pueden construir algo juntos.',action:'LINK convierte una coincidencia en una relación operable y medible.',example:'Hotel, restaurante, traslado y experiencia pueden trabajar como una red alrededor del mismo huésped.',chips:['Hotel','Restaurante','Transfer','Experiencia'],key:'Una alianza vale cuando mejora la experiencia y genera resultado para las partes.'}
};
document.querySelectorAll('[data-benefit]').forEach(button => {
  button.addEventListener('click', () => openDetail(benefitDetails[button.dataset.benefit]));
});


const modelState = { price: 100000, clientBenefit: 15, commission: 10, ally: 0 };
const clp = new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));
function renderCouponBusinessModel() {
  const price = Math.max(0, Number(modelState.price) || 0);
  const clientPct = clampPercent(modelState.clientBenefit);
  const linkPct = clampPercent(modelState.commission);
  const allyPct = clampPercent(modelState.ally);
  const totalPct = clientPct + linkPct + allyPct;

  const clientMoney = price * clientPct / 100;
  const linkMoney = price * linkPct / 100;
  const allyMoney = price * allyPct / 100;
  const totalMoney = clientMoney + linkMoney + allyMoney;
  const clientPays = Math.max(0, price - clientMoney);
  const businessReceives = Math.max(0, clientPays - linkMoney - allyMoney);
  const meetsMinimum = totalPct >= 25;
  const totalIsValid = totalPct <= 100;

  document.querySelector('#le-client-benefit').textContent = clientPct.toLocaleString('es-CL') + '%';
  document.querySelector('#le-client-benefit-money').textContent = clp.format(clientMoney);
  document.querySelector('#le-link-percent').textContent = linkPct.toLocaleString('es-CL') + '%';
  document.querySelector('#le-link-money').textContent = clp.format(linkMoney);
  document.querySelector('#le-ally-percent').textContent = allyPct.toLocaleString('es-CL') + '%';
  document.querySelector('#le-ally-money').textContent = clp.format(allyMoney);
  document.querySelector('#le-total-percent').textContent = totalPct.toLocaleString('es-CL') + '%';
  document.querySelector('#le-total-money').textContent = clp.format(totalMoney);
  document.querySelector('#le-client-pays').textContent = clp.format(clientPays);
  document.querySelector('#le-business-receives').textContent = totalIsValid ? clp.format(businessReceives) : 'Revisar';
  document.querySelector('#le-link-receives').textContent = clp.format(linkMoney);
  document.querySelector('#le-ally-receives').textContent = clp.format(allyMoney);

  const minimum = document.querySelector('#le-model-minimum');
  const minimumStatus = document.querySelector('#le-minimum-status');
  const totalRule = document.querySelector('#le-total-rule');
  if (!totalIsValid) {
    minimum?.setAttribute('data-state','invalid');
    minimumStatus.textContent = 'Máximo 100%';
    totalRule.textContent = 'La suma no puede superar el 100% del precio.';
  } else if (meetsMinimum) {
    minimum?.setAttribute('data-state','ok');
    minimumStatus.textContent = totalPct.toLocaleString('es-CL') + '% ✓';
    totalRule.textContent = 'Cumple el mínimo LINK.';
  } else {
    const missing = 25 - totalPct;
    minimum?.setAttribute('data-state','low');
    minimumStatus.textContent = totalPct.toLocaleString('es-CL') + '% · faltan ' + missing.toLocaleString('es-CL') + '%';
    totalRule.textContent = 'Debe llegar al menos al 25% para un acuerdo LINK.';
  }
}
document.querySelector('#le-model-price')?.addEventListener('input', (event) => {
  modelState.price = event.currentTarget.value;
  renderCouponBusinessModel();
});
document.querySelector('#le-client-input')?.addEventListener('input', (event) => {
  modelState.clientBenefit = event.currentTarget.value;
  renderCouponBusinessModel();
});
document.querySelector('#le-link-input')?.addEventListener('input', (event) => {
  modelState.commission = event.currentTarget.value;
  renderCouponBusinessModel();
});
document.querySelector('#le-ally-input')?.addEventListener('input', (event) => {
  modelState.ally = event.currentTarget.value;
  renderCouponBusinessModel();
});
renderCouponBusinessModel();

const couponExamples = {
  'caracol-conciertos': {
    title:'Caracol + LINK Conciertos',
    type:'Programación + público',
    description:'Caracol aporta espacio, ambiente y público. LINK Conciertos conecta artistas, programación y producción para convertir una noche en una experiencia comercial repetible.',
    flow:'Espacio → Programación → Público → Consumo'
  },
  'hotel-transfer': {
    title:'Hotel Experience + Transfer Hotel Atacama',
    type:'Servicio complementario',
    description:'La experiencia hotelera suma una solución de traslado contextualizada para el huésped. El hotel amplía su servicio y Transfer Hotel Atacama recibe una oportunidad concreta.',
    flow:'Huésped → Necesidad → Transfer → Servicio'
  },
  'lama-hotel': {
    title:'Lama Travelers + Hotel Experience',
    type:'Turismo + hospitalidad',
    description:'Un viajero puede conectar alojamiento y experiencia turística dentro de una misma relación. Cada negocio mantiene su especialidad y el cliente recibe una solución más completa.',
    flow:'Viajero → Hotel → Experiencia → Estadía'
  },
  'caracol-link': {
    title:'Caracol + LINK',
    type:'Marketing + trazabilidad',
    description:'Caracol puede conectar contenido, campañas, beneficios y conversaciones con visitas medibles. LINK aporta distribución, seguimiento y aprendizaje sobre qué acciones generan resultado.',
    flow:'Contenido → Conversación → Visita → Resultado'
  },
  'hotel-conciertos': {
    title:'Hotel + LINK Conciertos',
    type:'Hospitalidad + cultura',
    description:'Un hotel puede incorporar música, artistas o programación cultural como parte de la experiencia del huésped mediante una capacidad especializada de LINK.',
    flow:'Hotel → Artista → Experiencia → Huésped'
  },
  'transfer-hotel': {
    title:'Transfer Hotel Atacama + Hotel Experience',
    type:'Movilidad + huésped',
    description:'La movilidad se integra a la experiencia del huésped desde el momento adecuado: llegada, salida o traslado local. La coordinación genera valor para ambas partes.',
    flow:'Reserva → Traslado → Hotel → Experiencia'
  }
}
function renderCoupon(key) {
  document.querySelectorAll('[data-coupon]').forEach((b) => b.classList.toggle('active', b.dataset.coupon === key));
  const copy = couponExamples[key];
  document.querySelector('#le-coupon-example').innerHTML =
    '<span class="le-case-type">'+copy.type+'</span>'+
    '<b>'+copy.title+'</b>'+
    '<p>'+copy.description+'</p>'+
    '<small>'+copy.flow+'</small>';
}
document.querySelectorAll('[data-coupon]').forEach((button) => button.addEventListener('click', () => renderCoupon(button.dataset.coupon)));
renderCoupon('caracol-conciertos');

const instagramOk = value => {
  const v = String(value||'').trim();
  if (!v) return true;
  return /^@[A-Za-z0-9._]{1,30}$/.test(v) || /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?([?#].*)?$/i.test(v);
};
const whatsappDigits = value => String(value||'').replace(/\D/g,'');
const contactStatus = (type, html) => {
  const box = document.querySelector('#le-contact-status');
  if (!box) return;
  box.dataset.state = type;
  box.innerHTML = html;
};
document.querySelector('#le-contact-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const business = document.querySelector('#le-contact-business')?.value.trim() || '';
  const name = document.querySelector('#le-contact-name')?.value.trim() || '';
  const instagram = document.querySelector('#le-contact-instagram')?.value.trim() || '';
  const whatsappRaw = document.querySelector('#le-contact-whatsapp')?.value.trim() || '';
  const honeypot = document.querySelector('#le-contact-website')?.value.trim() || '';
  const whatsapp = whatsappDigits(whatsappRaw);
  const button = document.querySelector('#le-contact-submit');

  if (honeypot) return;
  if (business.length < 2) {
    contactStatus('error','<b>Falta el nombre del negocio.</b><span>Escribe al menos 2 caracteres.</span>');
    return;
  }
  if (!instagram && !whatsapp) {
    contactStatus('error','<b>Necesitamos una forma de comprobar el contacto.</b><span>Agrega Instagram o WhatsApp.</span>');
    return;
  }
  if (!instagramOk(instagram)) {
    contactStatus('error','<b>Ese Instagram no parece válido.</b><span>Usa @usuario o el enlace completo del perfil.</span>');
    return;
  }
  if (whatsapp && (whatsapp.length < 8 || whatsapp.length > 15)) {
    contactStatus('error','<b>Ese número de WhatsApp no parece válido.</b><span>Incluye código de país.</span>');
    return;
  }

  button.disabled = true;
  button.textContent = 'Enviando…';
  contactStatus('loading','<b>Registrando la solicitud…</b><span>Preparando el siguiente paso para conocernos.</span>');

  const {data,error} = await db.rpc('link_world_submit_public_contact',{
    p_business_name: business,
    p_contact_name: name || null,
    p_instagram: instagram || null,
    p_whatsapp: whatsappRaw || null,
    p_source_url: window.location.pathname + window.location.search
  });

  button.disabled = false;
  button.innerHTML = 'Enviar solicitud <span>→</span>';

  if (error) {
    contactStatus('error','<b>No pudimos registrar la solicitud.</b><span>'+String(error.message||'Intenta nuevamente.').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</span>');
    return;
  }

  const row = Array.isArray(data) ? data[0] : data;
  const code = row?.verification_code || '';
  const codeHtml = code ? '<code>'+code+'</code>' : '';
  const needsWhatsapp = Boolean(whatsapp);
  const verificationAction = needsWhatsapp
    ? '<button type="button" id="le-copy-wa-code">Copiar código y abrir WhatsApp ↗</button>'
    : '<a href="'+LINK_WHATSAPP+'" target="_blank" rel="noopener noreferrer">Abrir WhatsApp LINK ↗</a>';
  contactStatus('success',
    '<b>Solicitud recibida.</b>'+
    '<span>El siguiente paso es validar el contacto y coordinar una reunión para conocer tu negocio.</span>'+
    (code ? '<div class="le-verification-code"><small>Código de verificación</small>'+codeHtml+'</div>' : '')+
    '<div class="le-status-actions">'+verificationAction+'</div>'
  );
  const waButton = document.querySelector('#le-copy-wa-code');
  waButton?.addEventListener('click', async () => {
    if (code) {
      try { await navigator.clipboard.writeText(code); } catch {}
    }
    window.open(LINK_WHATSAPP,'_blank','noopener,noreferrer');
  });
});

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
