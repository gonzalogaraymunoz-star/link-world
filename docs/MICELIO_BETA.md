# Micelio · beta observable de LINK WORLD

Micelio es una vista de lectura sobre la arquitectura existente de LINK WORLD. No crea una segunda fuente de verdad ni reemplaza las fichas maestras: compone nodos circulares y rutas a partir de los registros vigentes en `LINK CONTROL CENTRAL`.

## Qué se tomó de Archify

La interfaz implementa una adaptación viva de las capacidades reader-facing de [tt-a1i/archify](https://github.com/tt-a1i/archify): Adaptive Reader, Camera con zoom/pan/pinch y Reset, Node Finder, Semantic Lens, Semantic Passport, Route Probe con recorrido dirigido, Guided Views/Story, Reading Depth y Semantic Radar. No se instala el generador estático porque Micelio se recompone desde Supabase; el adaptador conserva los contratos de identidad estable, geometría no canónica, rutas dirigidas y estado del visor separado de la fuente. LINK mantiene su modelo, RLS, identidad visual y fichas maestras.

## Contrato de verdad

- `link_world_businesses`, `link_world_clients` y `link_world_products` sostienen las fichas públicas y privadas según RLS.
- `entity_relations` sostiene las relaciones canónicas. Las relaciones inversas equivalentes se condensan en una sola ruta visual.
- `link_world_relations` se muestra como propuesta cuando su estado lo indica. Nunca se representa como convenio u operación activa.
- Si falta una relación canónica entre una ficha y su propietario, el visor puede derivar una ruta estructural desde las llaves `business_id` o `client_id`. Esa ruta se identifica como “Estructura de ficha” y no suma evidencia documental.
- `ecosystem_entities`, `ecosystem_cells` y `ecosystem_cell_organelle_bindings` añaden identidad, salud y recursos sólo para miembros autorizados.
- Actividad, eventos, integraciones, conversiones, reportes, transacciones y documentos se agregan como señales y conteos. El panel no expone montos, pasajeros, correos, teléfonos ni payloads del bus.
- La capa de calendario no se consulta: su política actual no autoriza lectura desde este cliente. La interfaz lo declara como no disponible en vez de mostrar un cero falso.

## Actualización y tiempo real

Sólo `event_bus` pertenece actualmente a la publicación Realtime. Una sesión LINK autorizada mantiene una suscripción a esa tabla; cada evento invalida la lectura y dispara una reconciliación completa. Como respaldo existe una lectura cada 90 segundos mientras el panel está abierto. Por eso la etiqueta exacta es “Evento vivo + sincronización 90 s”, no “todo en tiempo real”.

La vista abierta se limita a datos permitidos por RLS y no abre una suscripción privada.

## Interacción

- Los círculos representan Control Central, negocios, clientes o productos.
- Cada ruta puede abrirse para leer origen, estado, evidencia y motivo.
- “Aguas arriba” y “aguas abajo” recorren exclusivamente rutas dirigidas registradas.
- “Abrir ficha LINK” reutiliza el workspace existente del negocio propietario; clientes y productos no reciben una ficha paralela.
- El avance de “rutas comprendidas”, el tema día/noche y las texturas de selección viven sólo en `sessionStorage`. No escriben en Supabase ni alteran estados operativos.

## Seguridad y límites

- El navegador usa únicamente la clave publishable existente.
- Nunca se incluye `service_role` ni se desactiva RLS.
- El formulario de acceso reutiliza Supabase Auth y no crea usuarios.
- Esta beta es de observación. Toda mutación continúa por los flujos gobernados de LINK.
- La presencia de una arista expresa estructura registrada; no prueba causalidad, venta, ejecución o acuerdo salvo evidencia explícita de la ficha.

## Criterios de aceptación

1. Una persona sin sesión puede ver sólo negocios y fichas expuestas por RLS.
2. Un miembro puede leer capas privadas permitidas, sin datos sensibles en el DOM.
3. Las propuestas se distinguen por texto, trazo y estado; no dependen sólo del color.
4. Cada conexión explica por qué existe y desde qué capa fue leída.
5. El panel permite teclado, tema claro/oscuro, reducción de movimiento y uso móvil con desplazamiento horizontal acotado del lienzo.
6. El build y los tests del repositorio deben pasar antes de publicar una preview.
