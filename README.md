# LINK WORLD

**Observatorio espacial y comercial de las células LINK.**

[Aplicación en Vercel](https://link-world-delta.vercel.app/) · [Skill de Google Maps](.agents/skills/google-maps-platform/SKILL.md) · [Skill LINK Geo](.agents/skills/link-geo/SKILL.md)

## Estado v0.4

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

No hay conexiones activas con Supabase, reservas, ventas o agenda. No existe
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
limita a 40 solicitudes de búsqueda por sesión y devuelve hasta 20 resultados
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
