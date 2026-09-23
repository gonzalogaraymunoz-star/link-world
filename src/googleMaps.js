// LINK WORLD Google Maps adapter.
// Browser API keys are public credentials: restrict this key by HTTP referrer and API in Google Cloud.
// For a zero-deployment setup, a user may store the restricted browser key in this browser only.
const LOCAL_KEY = 'linkworld_google_maps_browser_key';
const DEFAULT_CITY = { lat: -22.9087, lng: -68.2011 };
const CITIES = {
  atacama: { lat: -22.9087, lng: -68.2011, zoom: 15, label: 'SAN PEDRO DE ATACAMA · CHILE' },
  saopaulo: { lat: -23.5505, lng: -46.6333, zoom: 13, label: 'SÃO PAULO · BRASIL' },
  earth: { lat: -18, lng: -63, zoom: 3, label: 'PLANETA TIERRA · VISTA GLOBAL' }
};
const CATEGORIES = [
  { value: 'lodging', label: 'Hoteles' },
  { value: 'restaurant', label: 'Restaurantes' },
  { value: 'travel_agency', label: 'Turismo' },
  { value: 'taxi_stand', label: 'Transporte' },
  { value: 'spa', label: 'Wellness' },
  { value: 'store', label: 'Comercios' }
];
let map = null;
let markerList = [];
let infoWindow = null;
let activeCategory = 'lodging';
let searchBusy = false;
let scriptPromise = null;
let ready = false;
let onReadyCallback = null;

function el(tag, className, value) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (value !== undefined) item.textContent = value;
  return item;
}
function setStatus(message, ok = false) {
  const target = document.querySelector('#imagery-status');
  const light = document.querySelector('#imagery-light');
  if (target) target.textContent = message;
  if (light) light.className = 'status-light ' + (ok ? 'ok' : 'off');
}
function showFeedback(message, failure = false) {
  const target = document.getElementById('google-feedback');
  if (target) { target.textContent = message; target.classList.toggle('error', failure); }
}
function getKey() {
  try {
    return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem(LOCAL_KEY) || '').trim();
  } catch {
    return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  }
}
function loadGoogle(key) {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const callback = '__linkWorldGoogleReady';
    let settled = false;
    const fail = (message) => {
      if (settled) return;
      settled = true;
      delete window[callback];
      reject(new Error(message));
    };
    window[callback] = () => {
      if (settled) return;
      settled = true;
      delete window[callback];
      resolve();
    };
    window.gm_authFailure = () => fail('Google rechazó la clave. Verifica que autoriza este dominio y Maps JavaScript API.');
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) +
      '&v=weekly&loading=async&callback=' + callback;
    script.async = true;
    script.onerror = () => fail('No fue posible cargar Google Maps. Comprueba la conexión y la clave.');
    document.head.append(script);
  }).catch(error => { scriptPromise = null; throw error; });
  return scriptPromise;
}

function buildControls() {
  const workspace = document.querySelector('.workspace');
  const panel = el('section', 'google-search-panel hidden');
  panel.id = 'google-search-panel';
  panel.innerHTML = '<div class="google-search-title"><span>EXPLORAR NEGOCIOS DE GOOGLE</span><span class="google-powered">Google Maps</span></div>' +
    '<div class="google-category-wrap"></div><button type="button" class="google-search-btn" id="google-search-btn">⌖ Buscar negocios en esta zona</button>' +
    '<div id="google-feedback" class="google-feedback">Los datos se consultan solo cuando lo solicitas.</div>' +
    '<div id="google-results" class="google-results"></div>';
  workspace.append(panel);
  const wrap = panel.querySelector('.google-category-wrap');
  CATEGORIES.forEach((category) => {
    const button = el('button', 'google-category' + (category.value === activeCategory ? ' active' : ''), category.label);
    button.type = 'button';
    button.addEventListener('click', () => {
      activeCategory = category.value;
      wrap.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === button));
      showFeedback('Pulsa «Buscar negocios en esta zona» para consultar Google.');
    });
    wrap.append(button);
  });
  panel.querySelector('#google-search-btn').addEventListener('click', searchPlaces);
}

function showSetup() {
  const workspace = document.querySelector('.workspace');
  const setup = el('section', 'google-setup');
  setup.id = 'google-setup';
  setup.innerHTML = '<div class="eyebrow">LINK WORLD · GOOGLE MAPS</div>' +
    '<h2>Conecta el mapa real.</h2><p>Pega aquí tu clave web de Google Maps. No tienes que editar GitHub ni Vercel para empezar.</p>' +
    '<form id="google-key-form"><label for="google-api-key">CLAVE API WEB RESTRINGIDA</label>' +
    '<input id="google-api-key" type="password" spellcheck="false" autocomplete="off" placeholder="AIza…" required />' +
    '<button type="submit">Conectar Google Maps ↗</button></form>' +
    '<div id="google-setup-feedback" role="status"></div>' +
    '<small>Se guarda solamente en este navegador, no en GitHub. Restringe la clave al dominio de esta web y a las APIs necesarias.</small>';
  workspace.append(setup);
  setup.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const key = setup.querySelector('input').value.trim();
    const output = setup.querySelector('#google-setup-feedback');
    if (!key) return;
    output.textContent = 'Conectando con Google Maps…';
    setup.querySelector('button').disabled = true;
    try {
      // Do not persist invalid keys.
      await initializeMap(key);
      try { localStorage.setItem(LOCAL_KEY, key); } catch { /* private browsing */ }
      setup.remove();
    } catch (error) {
      output.textContent = error.message || 'No se pudo cargar Google Maps.';
      setup.querySelector('button').disabled = false;
    }
  });
}
async function initializeMap(key) {
  setStatus('Conectando Google Maps…');
  await loadGoogle(key);
  const holder = document.getElementById('cesiumContainer');
  holder.innerHTML = '';
  map = new google.maps.Map(holder, {
    center: DEFAULT_CITY, zoom: 15, mapTypeId: 'hybrid', mapTypeControl: true,
    streetViewControl: false, fullscreenControl: true, gestureHandling: 'greedy',
    clickableIcons: true, controlSize: 30
  });
  infoWindow = new google.maps.InfoWindow();
  ready = true;
  holder.classList.add('google-map-active');
  document.getElementById('google-search-panel')?.classList.remove('hidden');
  const notice = document.querySelector('.notice');
  if (notice) notice.textContent = 'GOOGLE MAPS · Cartografía dinámica; las imágenes satelitales no son en vivo. Los resultados comerciales son consultas bajo demanda.';
  const caption = document.querySelector('.world-caption span:last-child');
  if (caption) caption.textContent = 'MAPA DE GOOGLE · NO EN VIVO';
  setStatus('Google Maps · conectado', true);
  if (onReadyCallback) onReadyCallback();
  return map;
}

function clearMarkers() {
  markerList.forEach((marker) => marker.setMap(null));
  markerList = [];
  if (infoWindow) infoWindow.close();
}
function renderResults(places) {
  const results = document.getElementById('google-results');
  if (!results) return;
  results.replaceChildren();
  if (!places.length) { showFeedback('Google no devolvió negocios de esta categoría en esta zona. Prueba otra o desplaza el mapa.'); return; }
  showFeedback(places.length + ' resultados de Google en esta consulta. No es un censo completo.');
  places.forEach((place) => {
    if (!place.location) return;
    const name = place.displayName || 'Negocio sin nombre';
    const marker = new google.maps.Marker({
      map, position: place.location, title: name,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#6ad4bc', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 }
    });
    markerList.push(marker);
    const row = el('button', 'google-result');
    row.type = 'button';
    row.append(el('strong', '', name), el('small', '', place.formattedAddress || 'Ubicación registrada en Google'));
    const focus = () => {
      map.panTo(place.location);
      map.setZoom(Math.max(map.getZoom(), 16));
      const card = el('div', 'google-place-info');
      card.append(el('strong', '', name), el('p', '', place.formattedAddress || ''));
      const link = el('a', '', 'Ver ficha en Google Maps ↗');
      link.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name) +
        (place.id ? '&query_place_id=' + encodeURIComponent(place.id) : '');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      card.append(link);
      infoWindow.setContent(card);
      infoWindow.open(map, marker);
    };
    row.addEventListener('click', focus);
    marker.addListener('click', focus);
    results.append(row);
  });
}
async function searchPlaces() {
  if (!map || searchBusy) return;
  searchBusy = true;
  const button = document.getElementById('google-search-btn');
  if (button) { button.disabled = true; button.textContent = 'Buscando en Google…'; }
  showFeedback('Consultando negocios en esta zona…');
  try {
    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary('places');
    const { places } = await Place.searchNearby({
      fields: ['id', 'displayName', 'location', 'formattedAddress'],
      locationRestriction: { center: map.getCenter(), radius: 1800 },
      includedTypes: [activeCategory],
      maxResultCount: 20,
      rankPreference: SearchNearbyRankPreference.POPULARITY
    });
    clearMarkers();
    renderResults(places || []);
  } catch (error) {
    showFeedback('No se pudo consultar Places. Comprueba que Places API (New) esté habilitada y permitida en esta clave. Google Maps puede seguir funcionando sin Places.', true);
    console.warn('LINK WORLD Places: consulta no disponible.', error?.message || '');
  } finally {
    searchBusy = false;
    if (button) { button.disabled = false; button.textContent = '⌖ Buscar negocios en esta zona'; }
  }
}
export function flyGoogle(where) {
  const city = CITIES[where];
  if (!city) return;
  const label = document.getElementById('city-label');
  if (label) label.textContent = city.label;
  document.querySelectorAll('[data-location]').forEach(button => button.classList.toggle('active', button.dataset.location === where));
  if (map) {
    map.panTo({ lat: city.lat, lng: city.lng });
    map.setZoom(city.zoom);
    clearMarkers();
    const results = document.getElementById('google-results');
    if (results) results.replaceChildren();
    showFeedback('Selecciona una categoría y pulsa «Buscar negocios en esta zona».');
  }
}
export async function startGoogleWorld(onReady) {
  onReadyCallback = onReady;
  buildControls();
  const configured = getKey();
  if (!configured) {
    setStatus('Google Maps · falta conectar la clave');
    showSetup();
    return;
  }
  try { await initializeMap(configured); }
  catch {
    setStatus('Google Maps · revisar clave');
    showSetup();
    const output = document.getElementById('google-setup-feedback');
    if (output) output.textContent = 'La clave guardada no pudo iniciar el mapa. Puedes introducir una clave válida.';
  }
}
