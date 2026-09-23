import { flyGoogle, startGoogleWorld } from './googleMaps.js';
import './style.css';

const CELLS = [
  { id: 'lama', name: 'Lama Travelers', type: 'Turismo', monogram: 'LT', accent: '#79d2c5',
    purpose: 'Experiencias turísticas en San Pedro de Atacama, con foco en viajeros de Brasil.',
    genes: ['Tours', 'Cotizaciones', 'Pasajeros', 'Itinerarios', 'Riesgo', 'Proveedores'],
    links: ['Hotel Experience', 'TaxiHotel'] },
  { id: 'hotel', name: 'Hotel Experience', type: 'Hotelería', monogram: 'HE', accent: '#b5a1fb',
    purpose: 'Intermediación entre hotel, venta, reservas y operación turística.',
    genes: ['Reservas', 'Tours', 'Pasajeros', 'Alimentación', 'Riesgo', 'Proveedores'],
    links: ['Lama Travelers', 'TaxiHotel', 'Wellness'] },
  { id: 'taxi', name: 'TaxiHotel', type: 'Transporte', monogram: 'TX', accent: '#f5c27f',
    purpose: 'Solicitudes y coordinación de traslados entre aeropuerto, hotel y destino.',
    genes: ['Flota', 'Rutas', 'Horarios', 'Asignaciones', 'Tarifas', 'Notificaciones'],
    links: ['Hotel Experience', 'Lama Travelers'] },
  { id: 'caracol', name: 'Caracol', type: 'Gastronomía y contenidos', monogram: 'CA', accent: '#f29ba7',
    purpose: 'Restobar, música en vivo, reservas y contenidos de experiencias reales.',
    genes: ['Eventos', 'Contenido', 'Campañas', 'Promociones', 'Reservas', 'Activos'],
    links: [] },
  { id: 'wellness', name: 'Wellness', type: 'Bienestar', monogram: 'WE', accent: '#8bbafd',
    purpose: 'Servicios de bienestar conectados con hoteles, huéspedes y prestadores.',
    genes: ['Solicitudes', 'Cotización', 'Matching', 'Agenda', 'Sesiones', 'Pagos'],
    links: ['Hotel Experience'] }
];

const EDGES = [
  ['lama', 'hotel'], ['lama', 'taxi'], ['hotel', 'taxi'], ['hotel', 'wellness']
];

const nodePosition = {
  lama: [175, 185],
  hotel: [500, 115],
  taxi: [810, 185],
  caracol: [300, 455],
  wellness: [695, 455]
};

const root = document.getElementById('app');
root.innerHTML = [
  '<div class="shell">',
  ' <header class="topbar">',
  '   <a class="brand" href="/" aria-label="LINK WORLD"><span class="brandmark">L<span class="brand-dot">•</span></span><span><strong>LINK WORLD</strong><small>CONTROL CENTRAL / OBSERVATORIO</small></span></a>',
  '   <div class="topbar-mid"><span class="live-dot"></span> ORGANISMO EN CONSTRUCCIÓN <span class="mid-separator">/</span> v0.2</div>',
  '   <a class="repo-link" href="https://github.com/gonzalogaraymunoz-star/link-world" target="_blank" rel="noopener noreferrer">REPOSITORIO ↗</a>',
  ' </header>',
  ' <aside class="sidebar">',
  '  <div class="eyebrow">ESCALAS DE VISIÓN</div>',
  '  <div class="mode-menu" role="group" aria-label="Cambiar vista">',
  '   <button data-mode="world" class="mode active"><span class="mode-icon">◉</span><span>Mundo<small>Territorio real</small></span><span class="mode-key">01</span></button>',
  '   <button data-mode="organism" class="mode"><span class="mode-icon">◎</span><span>Organismo<small>Células LINK</small></span><span class="mode-key">02</span></button>',
  '   <button data-mode="constellation" class="mode"><span class="mode-icon">✧</span><span>Constelación<small>Vínculos propuestos</small></span><span class="mode-key">03</span></button>',
  '  </div>',
  '  <div class="sidebar-rule"></div>',
  '  <div class="eyebrow">EXPLORAR TERRITORIO</div>',
  '  <button class="place active" data-location="atacama"><span class="place-pin">⌖</span><span>San Pedro de Atacama<small>Chile · punto de partida</small></span><span>↗</span></button>',
  '  <button class="place" data-location="saopaulo"><span class="place-pin">⌖</span><span>São Paulo<small>Brasil · mercado objetivo</small></span><span>↗</span></button>',
  '  <button class="place" data-location="earth"><span class="place-pin">◎</span><span>Ver planeta<small>Alejar cámara</small></span><span>↗</span></button>',
  '  <div class="sidebar-grow"></div>',
  '  <div class="status-panel"><span class="status-title">FUENTES CONECTADAS</span><div class="status-row"><span class="status-light ok"></span> LINK WORLD · interfaz</div><div class="status-row"><span class="status-light" id="imagery-light"></span> <span id="imagery-status">Google Maps · comprobando…</span></div><div class="status-row"><span id="places-light" class="status-light off"></span> <span id="places-status">Google Places · listo para consultar</span></div><div class="status-row"><span class="status-light off"></span> Supabase · pendiente</div></div>',
  '  <div class="sidebar-foot">REALIDAD EXTERNA <span>→</span> INTELIGENCIA LINK</div>',
  ' </aside>',
  ' <main class="workspace">',
  '  <div id="cesiumContainer" aria-label="Mapa tridimensional del planeta"></div>',
  '  <div class="map-shade"></div>',
  '  <div class="world-heading"><div class="eyebrow" id="scene-kicker">VISTA / TERRITORIO</div><h1 id="scene-title">El mundo desde LINK.</h1><p id="scene-subtitle">Primero observamos la realidad. Después descubrimos las conexiones.</p></div>',
  '  <div class="view-controls"><button data-location="atacama">SAN PEDRO ↗</button><button data-location="earth">◉ PLANETA</button></div>',
  '  <div class="world-caption"><span class="tiny-circle"></span><span id="city-label">SAN PEDRO DE ATACAMA · CHILE</span><span class="caption-divider">/</span><span>MAPA GEOGRÁFICO, NO COMERCIAL</span></div>',
  '  <section id="mode-layer" class="mode-layer hidden" aria-live="polite"></section>',
  '  <aside class="cells-dock" aria-label="Células de demostración"><div class="dock-head"><span>CÉLULAS LINK</span><span>05 / DEMO</span></div><div id="cell-list" class="cell-list"></div><p class="dock-foot">Capacidades de referencia. Sin conexión a datos operativos todavía.</p></aside>',
  '  <section id="cell-detail" class="cell-detail hidden" aria-live="polite"></section>',
  '  <div class="notice">LINK WORLD v0.2 · Mapa comercial Google bajo demanda. Células y sinapsis: demostración, no datos operativos.</div>',
  ' </main>',
  '</div>'
].join('');

const $ = (selector) => document.querySelector(selector);
let mode = 'world';
let chosenCell = null;

function cellMarkup(cell) {
  return '<button class="cell-item ' + (chosenCell === cell.id ? 'selected' : '') + '" data-cell="' + cell.id + '">' +
    '<span class="cell-emblem" style="--cell-accent:' + cell.accent + '">' + cell.monogram + '</span>' +
    '<span class="cell-text"><strong>' + cell.name + '</strong><small>' + cell.type + '</small></span><span class="cell-chevron">↗</span></button>';
}

function renderCells() {
  $('#cell-list').innerHTML = CELLS.map(cellMarkup).join('');
  document.querySelectorAll('[data-cell]').forEach((button) => {
    button.addEventListener('click', () => selectCell(button.dataset.cell));
  });
}

function renderDetail() {
  const detail = $('#cell-detail');
  const cell = CELLS.find((item) => item.id === chosenCell);
  if (!cell) { detail.classList.add('hidden'); detail.innerHTML = ''; return; }
  detail.classList.remove('hidden');
  detail.innerHTML = '<div class="detail-top"><span class="eyebrow">MICROSCOPIO / CÉLULA DEMO</span><button class="close-detail" aria-label="Cerrar ficha">×</button></div>' +
    '<div class="detail-emblem" style="--cell-accent:' + cell.accent + '">' + cell.monogram + '</div>' +
    '<h2>' + cell.name + '</h2><p class="detail-purpose">' + cell.purpose + '</p>' +
    '<div class="detail-section"><span class="eyebrow">GENES / CAPACIDADES DE REFERENCIA</span><div class="gene-list">' +
    cell.genes.map((gene) => '<span class="gene">' + gene + '</span>').join('') + '</div></div>' +
    '<div class="detail-section"><span class="eyebrow">SINAPSIS CONCEPTUALES</span><p>' +
    (cell.links.length ? cell.links.join(' · ') : 'Todavía no se definieron conexiones para esta célula.') + '</p></div>' +
    '<div class="detail-disclaimer">Esta ficha explica la arquitectura prevista; no informa ventas, salud, reservas ni conexiones verificadas.</div>';
  $('.close-detail').addEventListener('click', () => selectCell(null));
}

function selectCell(id) {
  chosenCell = chosenCell === id ? null : id;
  renderCells();
  renderDetail();
  if (mode === 'constellation') renderModeLayer();
}

function constellationMarkup() {
  let svg = '<svg class="network-lines" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">';
  EDGES.forEach(([a, b]) => {
    const start = nodePosition[a];
    const end = nodePosition[b];
    svg += '<line x1="' + start[0] + '" y1="' + start[1] + '" x2="' + end[0] + '" y2="' + end[1] + '" />';
  });
  svg += '</svg>';
  const nodes = CELLS.map((cell) => {
    const position = nodePosition[cell.id];
    return '<button class="network-cell ' + (chosenCell === cell.id ? 'selected' : '') + '" data-network-cell="' + cell.id + '" style="left:' + (position[0] / 10) + '%;top:' + (position[1] / 6) + '%;--cell-accent:' + cell.accent + '"><span>' + cell.monogram + '</span><strong>' + cell.name + '</strong></button>';
  }).join('');
  return '<div class="network-head"><span class="eyebrow">CONSTELACIÓN / EXPLORACIÓN</span><h2>Las conexiones crean nuevas posibilidades.</h2><p>Relaciones conceptuales para explorar; todavía no son integraciones ni transacciones verificadas.</p></div><div class="network-canvas">' + svg + nodes + '</div>';
}

function organismMarkup() {
  return '<div class="organism-head"><span class="eyebrow">ORGANISMO / CINCO CÉLULAS</span><h2>Un ADN. Distintas expresiones.</h2><p>Las fichas muestran funciones previstas. Al conectar Supabase se sustituirán por su estado real.</p></div><div class="organism-grid">' +
    CELLS.map((cell) => '<button class="organism-cell" data-network-cell="' + cell.id + '" style="--cell-accent:' + cell.accent + '"><span class="organism-symbol">' + cell.monogram + '</span><strong>' + cell.name + '</strong><small>' + cell.type + '</small></button>').join('') +
    '</div>';
}

function renderModeLayer() {
  const layer = $('#mode-layer');
  layer.classList.toggle('hidden', mode === 'world');
  layer.classList.toggle('is-constellation', mode === 'constellation');
  if (mode === 'world') { layer.innerHTML = ''; return; }
  layer.innerHTML = mode === 'constellation' ? constellationMarkup() : organismMarkup();
  document.querySelectorAll('[data-network-cell]').forEach((button) => button.addEventListener('click', () => selectCell(button.dataset.networkCell)));
}

function setMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  const copy = {
    world: ['VISTA / TERRITORIO', 'El mundo desde LINK.', 'Primero observamos la realidad. Después descubrimos las conexiones.'],
    organism: ['VISTA / ORGANISMO', 'Cada negocio es una célula.', 'El mismo ADN LINK puede expresar capacidades diferentes.'],
    constellation: ['VISTA / CONSTELACIÓN', 'El valor también vive entre células.', 'Explora los vínculos que podrían formar el tejido LINK.']
  }[mode];
  $('#scene-kicker').textContent = copy[0];
  $('#scene-title').textContent = copy[1];
  $('#scene-subtitle').textContent = copy[2];
  renderModeLayer();
}

function flyToLocation(which) { flyGoogle(which); }

renderCells();
document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelectorAll('[data-location]').forEach((button) => button.addEventListener('click', () => flyToLocation(button.dataset.location)));
startGoogleWorld(() => flyToLocation("atacama"));
