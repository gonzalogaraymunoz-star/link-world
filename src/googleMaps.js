// LINK WORLD Google Maps adapter.
// Reference: googlemaps/agent-skills; official JS API loader and Places API (New).
// Docs: https://developers.google.com/maps/documentation/javascript/advanced-markers/start?utm_campaign=gmp_git_agentskills_v1
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
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
let AdvancedMarkerElement = null;
let PinElement = null;
let requestsThisSession = 0;
const MAX_REQUESTS_PER_SESSION = 8; // Conservative UX guardrail, not a Google Cloud billing cap.
const DAY_LIMIT = 12; // Local browser-only guardrail; NOT a global Cloud quota.
const GOOGLE_DAY_KEY='linkworld_places_daily_calls_v1';
function dailyCalls(){try{const s=JSON.parse(localStorage.getItem(GOOGLE_DAY_KEY)||'null');return s?.day===new Date().toISOString().slice(0,10)?Math.max(0,Number(s.count)||0):0;}catch{return 0;}}
function markDailyCall(){try{localStorage.setItem(GOOGLE_DAY_KEY,JSON.stringify({day:new Date().toISOString().slice(0,10),count:dailyCalls()+1}));return true;}catch{return false;}}
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
async function loadGoogle(key) {
  if (window.google?.maps?.Map) return;
  if (scriptPromise) return scriptPromise;
  // Official loader v2; no dynamic REST calls to places.googleapis.com from browser.
  setOptions({ key, v: 'weekly', language: 'es', region: 'CL' });
  scriptPromise = importLibrary('maps').catch((error) => {
    scriptPromise = null;
    throw new Error('No se pudo cargar Google Maps. Revisa la clave, facturación y dominio autorizado.');
  });
  return scriptPromise;
}

function buildControls() {
  const workspace = document.querySelector('.workspace');
  const panel = el('section', 'google-search-panel hidden');
  panel.id = 'google-search-panel';
  panel.innerHTML = '<div class="google-search-title"><span>EXPLORAR NEGOCIOS DE GOOGLE</span><span class="google-powered">Google Maps</span></div>' +
    '<div class="google-category-wrap"></div><form id="google-text-form" class="google-text-form"><label for="google-text-query">BUSCAR POR NOMBRE O ACTIVIDAD</label><div class="google-text-fields"><input id="google-text-query" maxlength="100" autocomplete="off" placeholder="Hotel, restaurante, agencia…" /><button type="submit" aria-label="Buscar por nombre">Buscar</button></div></form><button type="button" class="google-search-btn" id="google-search-btn">⌖ Buscar negocios en esta zona</button>' +
    '<div id="google-feedback" class="google-feedback">Solo búsquedas manuales: 8 por sesión, 12 por día y máximo 20 fichas por búsqueda. No son topes de facturación.</div><button type="button" class="google-disconnect">Olvidar clave de este navegador</button>' +
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
  panel.querySelector('.google-disconnect').addEventListener('click', () => {
    try { localStorage.removeItem(LOCAL_KEY); } catch { /* private browsing */ }
    location.reload();
  });
  panel.querySelector('#google-search-btn').addEventListener('click', () => searchPlaces());
  panel.querySelector('#google-text-form').addEventListener('submit', event => {
    event.preventDefault();
    const text = panel.querySelector('#google-text-query').value.trim();
    if (text) searchPlaces(text);
  });
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
    '<small>Una clave web es visible técnicamente en el navegador. Se conserva solo en este navegador, no en GitHub. Restringe sus dominios y APIs. <button type="button" class="forget-key" id="forget-google-key">Olvidar clave guardada</button></small>';
  workspace.append(setup);
  setup.querySelector('#forget-google-key').addEventListener('click', () => {
    try { localStorage.removeItem(LOCAL_KEY); } catch { /* private browsing */ }
    setup.querySelector('#google-setup-feedback').textContent = 'Clave local eliminada. Recarga si Google ya se intentó cargar con otra clave.';
  });
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
  const [{ Map, InfoWindow }, { AdvancedMarkerElement: Advanced, PinElement: Pin }] = await Promise.all([
    importLibrary('maps'), importLibrary('marker')
  ]);
  AdvancedMarkerElement = Advanced;
  PinElement = Pin;
  const holder = document.getElementById('cesiumContainer');
  holder.innerHTML = '';
  map = new Map(holder, {
    center: DEFAULT_CITY, zoom: 15, mapTypeId: 'hybrid', mapId: import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID', mapTypeControl: true,
    streetViewControl: false, fullscreenControl: true, gestureHandling: 'greedy',
    clickableIcons: true, controlSize: 30
  });
  infoWindow = new InfoWindow();
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
  markerList.forEach((marker) => { marker.map = null; });
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
    const pin = new PinElement({ background: '#64c7af', borderColor: '#ffffff', glyphColor: '#0a2730', scale: 1.0 });
    const marker = new AdvancedMarkerElement({ map, position: place.location, title: name });
    marker.append(pin);
    markerList.push(marker);
    const row = el('button', 'google-result');
    row.type = 'button';
    row.append(el('strong', '', name), el('small', '', place.formattedAddress || 'Ubicación registrada en Google'));
    const focus = () => {
      document.dispatchEvent(new CustomEvent('linkworld:place-selected', { detail: {
        name, address: place.formattedAddress || '', uri: place.googleMapsURI || ''
      }}));
      map.panTo(place.location);
      map.setZoom(Math.max(map.getZoom(), 16));
      const card = el('div', 'google-place-info');
      card.append(el('strong', '', name), el('p', '', place.formattedAddress || ''));
      const link = el('a', '', 'Ver ficha en Google Maps ↗');
      link.href = place.googleMapsURI || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name) +
        (place.id ? '&query_place_id=' + encodeURIComponent(place.id) : ''));
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      card.append(link);
      infoWindow.setContent(card);
      infoWindow.open({ map, anchor: marker });
    };
    row.addEventListener('click', focus);
    marker.addListener('click', focus);
    results.append(row);
  });
}
async function searchPlaces(textQuery = '') {
  if (!map || searchBusy) return;
  if (requestsThisSession >= MAX_REQUESTS_PER_SESSION || dailyCalls() >= DAY_LIMIT) {
    showFeedback('Pausa de Google Places: máximo 8 búsquedas por sesión y 12 por día en este navegador. No es un tope global de Google Cloud.', true);
    return;
  }
  if (!markDailyCall()) {
    showFeedback('No se pudo registrar el uso en este navegador: se evita esta consulta.', true);
    return;
  }
  searchBusy = true;
  const button = document.getElementById('google-search-btn');
  const textButton = document.querySelector('#google-text-form button');
  if (button) { button.disabled = true; button.textContent = 'Buscando en Google…'; }
  if (textButton) textButton.disabled = true;
  showFeedback('Consultando negocios en esta zona…');
  try {
    const { Place, SearchNearbyRankPreference } = await importLibrary('places');
    requestsThisSession += 1;
    // Intentional minimal field list: no ratings/reviews/phone/photo until explicitly requested.
    const fields = ['id', 'displayName', 'location', 'formattedAddress', 'googleMapsURI'];
    const request = { fields, maxResultCount: 20, internalUsageAttributionIds: ['gmp_git_agentskills_v1'] };
    const { places } = textQuery
      ? await Place.searchByText({ ...request, textQuery, locationBias: { center: map.getCenter(), radius: 2800 }, language: 'es', region: 'CL' })
      : await Place.searchNearby({ ...request, locationRestriction: { center: map.getCenter(), radius: 1800 }, includedTypes: [activeCategory], rankPreference: SearchNearbyRankPreference.POPULARITY });
    clearMarkers();
    renderResults(places || []);
    document.getElementById('places-status').textContent = 'Google Places · conectado';
    document.getElementById('places-light').className = 'status-light ok';
  } catch (error) {
    document.getElementById('places-status').textContent = 'Google Places · revisar acceso';
    document.getElementById('places-light').className = 'status-light off';
    showFeedback('No se pudo consultar Places. Comprueba que Places API (New) esté habilitada y permitida en esta clave. Google Maps puede seguir funcionando sin Places.', true);
    console.warn('LINK WORLD Places: consulta no disponible.', error?.message || '');
  } finally {
    searchBusy = false;
    if (button) { button.disabled = false; button.textContent = '⌖ Buscar negocios en esta zona'; }
    if (textButton) textButton.disabled = false;
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
    showFeedback('Selecciona una categoría y pulsa Buscar. Google solo se consulta si tú lo solicitas.');
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
