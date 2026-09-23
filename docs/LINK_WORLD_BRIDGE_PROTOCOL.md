# LINK WORLD · PROTOCOLO DE CONVERSACIÓN v1

## Propósito

Una sola base de datos para dos superficies:

- **Aquí (ChatGPT):** habilidad LINK WORLD + conector autorizado Supabase para leer, investigar, preparar borradores y escribir solo después de aprobación.
- **Allá (app LINK WORLD):** pantalla ↔ LINK WORLD con autenticación de miembro, negocios, selección de hasta 3, solicitudes y actividad, sincronizada manualmente.

No se crea un chat secreto entre dos IAs: la comunicación se realiza mediante **registros persistentes, IDs y eventos auditados**. El Director IA/OpenRouter dentro de la app es una capacidad complementaria y no se invoca automáticamente para mover datos.

## Fuente de verdad

Proyecto Supabase existente: LINK CONTROL CENTRAL
Ref: zgbnjlrxzvzpigmwidsp

Tablas nuevas independientes del CRM y Hotel Experience:

| Tabla | Contenido |
| --- | --- |
| public.link_world_businesses | Identidades empresariales y hechos propios de LINK |
| public.link_world_requests | Solicitudes compartidas, estados e IDs asociados |
| public.link_world_relations | Propuestas/relaciones empresariales y evidencia |
| public.link_world_activity | Registro generado automáticamente al crear o actualizar |

No se tocaron registros de la tabla antigua public.requests ni las reservas. Se crearon tablas aisladas con RLS, no un proyecto Supabase nuevo.

### Seguridad

- Solo miembros activos owner/admin/editor del sistema app_members pueden leer/escribir desde la web con Supabase Auth. No se conceden permisos a anon.
- La app incluye exclusivamente la clave pública sb_publishable_, nunca service_role.
- No introducir contraseña, API key o credenciales en chat; ChatGPT debe operar por un conector autorizado y el usuario debe aprobar las mutaciones.
- Autenticación actual de la pantalla web: email y contraseña del usuario existente en el proyecto LINK CONTROL CENTRAL. La pantalla no crea nuevas cuentas. Si el usuario usa otra identidad/login, deberá configurarse su acceso; tener un proyecto Cloud no equivale a estar autenticado en este Supabase.
- Ningún registro creado en la DB se hace público por defecto. No usar un enlace de GitHub JSON como fuente privada.

## Comandos humanos

### Caso A — agregar negocio desde aquí

«@LINK WORLD, prepara el alta de [nombre, sector, ciudad, país, web, datos propios, fuentes, Place ID opcional]».

1. Consultar posibles duplicados en link_world_businesses.
2. Si hay datos nuevos, distinguir propios/verificados, externos y desconocidos.
3. Proponer la ficha completa, slug y estado borrador. Preguntar si se guarda.
4. Con autorización, insertar negocio creado desde chatgpt.
5. Leer su UUID y evento link_world_activity. Decir al usuario «abre la web, inicia sesión y pulsa ↻ Sincronizar ahora».

No crear ficha con nombre o fotos únicamente extraídas de Places sin confirmar procedencia/términos. Google Place ID solo es una referencia.

### Caso B — investigar un negocio que está allá

«@LINK WORLD, busca el negocio [nombre o UUID] de mi app e investígalo».

Consultar por ID si está disponible. Leer facts, evidence, solicitud y relaciones. Investigar fuentes públicas solo si el usuario pide investigación y distinguir resultados actuales de información propia. No inventar ventas, ocupación, acuerdos o reputación. Devolver cuestiones que faltan y, si se aprueba, completar campos propios o crear solicitud.

### Caso C — tres negocios

Seleccionar hasta 3 en app → «Copiar consulta para ChatGPT» → pegarla en esta conversación. La habilidad debe consultar los UUIDs exactos, no emparejar nombres por adivinación. Preparar relación/servicio/propuesta conjunta, con supuestos visibles. Solo tras autorización registrar en link_world_requests o link_world_relations con estado proposed y evidencia. Ningún vínculo se vuelve active automáticamente.

### Caso D — solicitud desde la app

Web → pestaña Negocios → seleccionar 0–3 → escribir título + instrucción → «Registrar en LINK». Se crea link_world_requests con origin link_world_web, status pending. En el chat: «@LINK WORLD revisa solicitudes pendientes». El conector leerá la solicitud desde Supabase.

### Caso E — solicitud desde ChatGPT

Con permiso: crear link_world_requests con origin chatgpt, status pending, business_ids y título. La web la verá en pestaña Solicitudes al sincronizar.

## Estructura mínima de la ficha

- id: UUID estable, nunca reutilizar por nombre.
- slug, name, sector, city, country.
- website y summary: propios o comprobados fuera de contenido restringido Google.
- google_place_id: referencia, no copia de ficha.
- owned_facts: datos que LINK aportó o verificó por separado.
- evidence: fuentes propias, documentos/URLs autorizadas, fecha, nivel de comprobación.
- verification_status: draft, needs_review o verified.
- created_from, created_by, updated_at.

Una ficha con verification_status=verified requiere evidencias y aprobación humana. Datos de otro negocio no heredan estado de verificación.

## Desacoplamiento Google

Google Places muestra el mundo público en el mapa. LINK CONTROL CENTRAL almacena **solo** sus propios datos y Place IDs de referencia, respetando las restricciones de licencia de Google. La app nunca convierte una búsqueda de Google en cliente, alianza o reserva automáticamente. Para un vínculo operativo real hace falta convenio/permiso/evidencia.

## Límites actuales y siguiente fase

- Ya existe infraestructura compartida, cuatro tablas, políticas RLS y pantalla de autenticación/datos. No se han incorporado negocios sin permiso.
- La app no lee tus conversaciones de ChatGPT; recibe altas/solicitudes **que el agente escribe con permiso** mediante Supabase.
- La sincronización web es por botón y al abrir el panel, no streaming ni vigilancia permanente.
- El antiguo registro local del Director IA es distinto del nuevo registro compartido; no migrar datos privados automáticamente.
- No se han construido todavía modelos de negocio generativos autónomos, WhatsApp, Gmail, pagos ni escritura en otras células.
- Para vincular un usuario web que no conozca las credenciales existentes de LINK CONTROL CENTRAL se deberá configurar autenticación compatible, sin dar acceso público.
- La instalación de un SKILL.md en GitHub no lo registra por arte de magia en todos los chats; hacer accesible la habilidad e invocarla desde el entorno conectado.
- Supabase, Google Maps, OpenRouter y Vercel conservan sus cuotas/costos independientes. No prometer uso global ilimitado a US$0.

## Verificación de aceptación

1. Un usuario no autenticado no lee datos de las cuatro tablas vía clave publishable.
2. Un miembro autenticado ve la lista y puede registrar una solicitud.
3. ChatGPT consulta esa solicitud por UUID, sin reutilizar datos antiguos.
4. Usuario autoriza un alta; ChatGPT escribe y relee el mismo UUID.
5. La web muestra el cambio tras «Sincronizar ahora».
6. El registro refleja la operación real, no una Demo ni un clic ficticio.
