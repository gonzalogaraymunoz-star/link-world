# LINK WORLD

**Observatorio espacial y comercial de las células LINK.**

[Aplicación en Vercel](https://link-world-delta.vercel.app/) · [Skill de Google Maps](.agents/skills/google-maps-platform/SKILL.md) · [Skill LINK Geo](.agents/skills/link-geo/SKILL.md)

## Estado v0.7

**Este es un prototipo navegable y una Demo de estrategia, NO un sistema comercial sincronizado.**

- **Interfaz editorial de estrategia:** mapa central, panel contextual plegable, siete estrategias, perspectivas Mundo/Organismo/Constelación, modo día/noche y diseño móvil.
- **Demo jugable aislada:** oportunidad ficticia → decisión → sinapsis simulada → ejercicio simulado → aprendizaje; alternativas de bloqueo, reprogramación o rechazo. No toca operaciones reales.
- **Memoria de demostración:** eventos tipados y proyecciones coherentes de misión/relación/evidencia. Tests en `npm test`.
- [Auditoría y wireframe del Manual Maestro](docs/INTERFAZ_ESTRATEGICA_V0.4.md).
- Google Maps dentro de la web: San Pedro de Atacama y São Paulo.
- Consulta **bajo demanda** de hoteles, restaurantes, turismo, transporte,
  wellness y comercios cercanos (Places API (New)).
- **Búsqueda por texto** de negocios en torno a la zona actual.
- Marcadores avanzados, ficha básica en pantalla y enlace a Google Maps.
- Vistas Organismo y Constelación con cinco células **conceptuales**.
- La información comercial devuelta por Google **no se guarda como base propia**.

Hay lectura privada opcional de las cuatro tablas LINK WORLD en Supabase, sujeta a Supabase Auth/RLS y consentimiento antes de enviar un resumen a OpenRouter. No hay conexiones operativas con reservas, ventas ni agenda. No existe
transmisión de imágenes satelitales en vivo. Google's imagery is not live.

## Conectar una clave sin modificar GitHub

Abre https://link-world-delta.vercel.app/ y pega tu **clave web restringida**
en la ventana de bienvenida. Se conserva en localStorage de ese navegador;
puede borrarse desde el formulario cuando sea necesario. Las claves para
navegador son técnicamente visibles a través de las solicitudes del navegador:
**restríngele el dominio HTTPS y las APIs permitidas en Cloud**.

Restricción de sitio para la URL principal:
`https://link-world-delta.vercel.app/*`

APIs necesarias en el proyecto Cloud y la clave:

- **Maps JavaScript API** — mapa.
- **Places API (New)** — búsqueda comercial.

Alternativa de despliegue automatizado: configurar
`VITE_GOOGLE_MAPS_API_KEY` en Vercel. Es una **clave pública para el
navegador**, no un secreto de servidor; requiere las mismas restricciones.
Para marcadores avanzados en producción, definir tu propio
`VITE_GOOGLE_MAP_ID` (el valor de demostración `DEMO_MAP_ID` se usa
temporalmente en pruebas).

**Nunca pegar aquí ni en GitHub la clave privada de backend.** No almacenar en
GitHub credenciales ni archivos `.env`.

## LINK WORLD · conversación real entre ChatGPT y la web

**Habilidad primaria:** [LINK WORLD](.agents/skills/link-world/SKILL.md).
[Protocolo de doble vía](docs/LINK_WORLD_BRIDGE_PROTOCOL.md).

Botón **↔ LINK WORLD** en la app, distinto del Director IA: inicia sesión
con usuario miembro de LINK CONTROL CENTRAL, lee fichas empresariales propias,
elige hasta 3 y copia su consulta (UUIDs) para continuar desde ChatGPT.
Registra solicitudes compartidas en Supabase y las muestra al sincronizar.

Esta conversación utiliza el conector Supabase del usuario (proyecto
LINK CONTROL CENTRAL) para leer la misma información y, sólo con
confirmación, agregar negocios, relaciones o solicitudes. No se requiere
OpenRouter para el puente.

Tablas aisladas y privadas por RLS:
- public.link_world_businesses
- public.link_world_requests
- public.link_world_relations
- public.link_world_activity

Ninguna empresa fue importada automáticamente desde Google. Las cinco células
del tablero DEMO no se convirtieron en negocios verificados. Sólo se guardan
hechos propios/independientemente comprobados y Place IDs, no una copia de
Google Places. El registro anterior del Director IA continúa local;
los registros compartidos son otra sección.

La pantalla web exige acceso de un miembro activo de LINK CONTROL CENTRAL
mediante Supabase Auth. Si el usuario utiliza otra autenticación, hay que
configurarla antes de prometer acceso. La habilidad en GitHub no instala
por sí sola un comando @ global.

## Director IA · conexión verificable e investigación

El panel **Conexión** distingue si el servidor está disponible, si OpenRouter validó la clave sin generar texto y si un modelo gratuito ya respondió. En **Conversar**, puedes activar expresamente «Incluir datos propios LINK» para leer una instantánea actual y acotada de negocios, relaciones, solicitudes y actividad autorizados por RLS. Las células DEMO siguen etiquetadas. El Director no realiza búsquedas automáticas de Google y no ejecuta acciones reales. [Manual v2](docs/LINK_DIRECTOR_MANUAL.md).

## Director IA · OpenRouter con sólo tu clave

Abre la aplicación → **✦ Director IA** → **URL · MODEL · API**:

| Campo | Valor preconfigurado |
| --- | --- |
| URL | `https://openrouter.ai/api/v1/chat/completions` |
| MODEL | `openrouter/free` |
| API | tu clave privada `sk-or-…` de OpenRouter |

El proxy `/api/director` **rechaza modelos pagados**, `openrouter/auto`,
URLs externas y modelos no terminados en `:free` salvo `openrouter/free`.
No hay fallback ni reintentos. LINK no impone un límite diario adicional de consultas al Director; OpenRouter sigue aplicando su cuota Free. Cada solicitud admite hasta 3500 caracteres y 1100 tokens de salida como máximo.
**No es límite global de gasto ni cubre Google Maps/Vercel**.

La clave no se guarda en GitHub, Vercel ni localStorage por este formulario;
viaja por HTTPS al proxy de LINK y después a OpenRouter. Las solicitudes se
registran **sólo si el usuario lo elige**, localmente en su navegador
(hasta 80, exportables como JSON); también admite registro manual sin IA.

- [Skill reutilizable LINK Director](.agents/skills/link-director/SKILL.md)
- [Manual de OpenRouter y registro](docs/LINK_DIRECTOR_MANUAL.md)
- [Contrato de instrucciones de ejecución](api/LINK_DIRECTOR_SYSTEM.md)

## Desarrollo sin instalar nada en el Mac antiguo

Vercel construye Vite; GitHub Actions ejecuta la misma compilación con Node 24.
El navegador Chrome solo necesita abrir la URL.

```sh
npm install
npm test
npm run build
```

## Arquitectura

Google Maps y Places son proveedores de visualización y observación.
LINK tendrá su propia identidad empresarial, células, sinapsis, misiones y
operación en Supabase. Google's business content remains governed by Google's
Terms of Service; guardar Place IDs no equivale a poseer su base de empresas.

El futuro motor 3D / God's Eye View debe ser independiente del estado de LINK.
El Google Maps de v0.3 es la etapa operativa mientras investigamos la capa 3D.

## Consumo

Las búsquedas solo se realizan cuando el usuario pulsa Buscar; la interfaz
limita a 8 solicitudes por sesión y 12 por día en este navegador y devuelve hasta 20 resultados
por consulta. **Este límite NO es un bloqueo real de facturación ni evita
otros costos de carga de mapa.** Configura cuotas/alertas en Google Cloud.
Los campos solicitados se limitan a nombre, ID, ubicación, dirección y enlace
para evitar pedir datos de alta tarifa que aún no utilizamos.

## Fuentes, licencia y gobierno

La integración utiliza técnicas de
[googlemaps/agent-skills](https://github.com/googlemaps/agent-skills)
bajo Apache 2.0. El código propio de LINK no representa un producto avalado
oficialmente por Google. El skill original indica explícitamente que no es
un producto de Google con soporte oficial.

Consultar [términos de Google Maps Platform](https://cloud.google.com/maps-platform/terms),
[precios vigentes](https://developers.google.com/maps/billing-and-pricing/pricing)
y [términos de la demostración](https://mapsplatform.google.com/maps-demo-key/)
si se usa la clave demo (no apta para producción).
