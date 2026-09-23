---
name: link-world
description: Habilidad maestra para conversar desde ChatGPT con LINK WORLD; negocios, solicitudes, relaciones e investigación con el conector Supabase.
version: 1.0.0
---

# LINK WORLD · ChatGPT ↔ aplicación

Invocación humana: @LINK WORLD. El archivo en GitHub no registra automáticamente un comando @ global en todos los chats: el agente debe poder leerlo, y el usuario debe conectar/autorizar los sistemas necesarios en ese chat.

Fuente canónica:
https://github.com/gonzalogaraymunoz-star/link-world/blob/main/.agents/skills/link-world/SKILL.md

## 0. Enrutamiento

Leer primero este archivo y docs/LINK_WORLD_BRIDGE_PROTOCOL.md. Para tesis y app leer README.md, AGENTS.md, docs/INTERFAZ_ESTRATEGICA_V0.4.md y el Manual Maestro adjunto si está accesible. Para IA en la app leer .agents/skills/link-director/SKILL.md y api/LINK_DIRECTOR_SYSTEM.md. Para Google leer .agents/skills/link-geo/SKILL.md y los términos pertinentes.

Verificar la conexión Supabase del usuario y usar exactamente el proyecto LINK CONTROL CENTRAL (project_id zgbnjlrxzvzpigmwidsp). Las cuatro tablas del puente están aisladas:
- public.link_world_businesses
- public.link_world_requests
- public.link_world_relations
- public.link_world_activity

No usar las tablas public.projects, public.clients, ni la base de Hotel Experience como sustituto. Si el conector no está disponible, reportarlo; no simular escritura ni fingir que leíste la app. La app comparte datos mediante Supabase, no mediante la conversación del modelo ni el GitHub del frontend.

## 1. Protocolo de seis etapas

INVOCAR → LEER → INVESTIGAR → PROPONER → APROBAR → ESCRIBIR Y VERIFICAR.

INVOCAR: detectar objetivo, proyecto, negocio(s) y UUID si el usuario pegó selección de la app. LEER: consultar en ese momento los registros Supabase; no fiarse de memoria previa. INVESTIGAR: separar hecho propio verificable, hecho aportado por usuario, fuente pública, hipótesis y DEMO. PROPONER: preparar el borrador preciso de alta/cambio/solicitud/relación y revisar duplicados por ID, slug y Google Place ID. APROBAR: mostrar lo que se escribirá; investigar/leer no equivale a permiso de escritura. ESCRIBIR: con aprobación explícita del usuario, usar el conector Supabase; después volver a consultar exactamente el UUID modificado y la actividad del trigger antes de decir que está guardado.

El conector Supabase usa execute_sql para DML y apply_migration sólo para DDL. Evitar ejecutar SQL no verificado, interpolaciones inseguras y cambios a tablas ajenas a LINK WORLD.

## 2. Contrato de negocios

link_world_businesses contiene id, slug, name, sector, city, country, website, summary, owned_facts (JSON propio), evidence (JSON), verification_status, created_from, google_place_id (sólo referencia). Sólo incorporar datos propios o verificados independientemente por LINK. No copiar/recrear fichas de Google Places, reseñas, fotos, coordenadas ni su base de negocios en owned_facts. Google Place ID no es propiedad, alianza, demanda ni validación comercial. Pedir identificación y fuentes al usuario si faltan.

Los estados son draft / needs_review / verified. Marcar verified únicamente cuando haya evidencia suficiente y confirmación humana. Relaciones en link_world_relations empiezan proposed; nunca tratar proposed como active sin acuerdo verificable.

## 3. Investigar uno o tres negocios

La app permite elegir hasta tres negocios y pulsar «Copiar consulta para ChatGPT»: el texto lleva UUIDs LINK exactos. Leer esas filas, relaciones entrantes/salientes y solicitudes vinculadas. Contrastar fuentes externas cuando el usuario pide investigar; no inventar resultado si no hay conectores ni web. Mostrar datos faltantes, alternativas y trabajo cooperativo sin afirmar contratos. Tras aprobación registrar una solicitud o relación, comprobar UUID y decir «Pulsa Sincronizar ahora en LINK WORLD».

Si el usuario dice «buscar un negocio allá» sin UUID, buscar por nombre/sector/ciudad entre las filas de LINK WORLD y pedir desambiguación sólo si existen homónimos.

## 4. Solicitudes en ambas direcciones

App → chat: el usuario conectado crea en link_world_requests, origin link_world_web, status pending. En el chat «@LINK WORLD revisa solicitudes pendientes» obliga a consultar DB y devolver IDs/títulos. Tras confirmar alcance, actualizar a researching, awaiting_approval o completed junto a result_summary; no modificar sin permiso.

Chat → app: después de aprobar una propuesta, insertar solicitud con origin chatgpt y business_ids UUID, status pending. La app la verá al sincronizar. La BD genera automáticamente link_world_activity para altas y cambios; verificar que se registró. El viejo Registro local del Director IA aún NO sincroniza con el puente ni con otros chats.

## 5. Autenticación y límites

ChatGPT utiliza el conector Supabase autorizado. La web utiliza Supabase Auth, clave pública publishable y RLS basada en membresía activa en public.app_members. Ninguna tabla del puente permite acceso anon. Si el usuario no tiene un login Supabase compatible, no prometer que ya puede leer desde el panel web; preparar la adaptación Auth antes de afirmar acceso. No pegar contraseñas, tokens ni service_role en chat o GitHub.

La conversación desde este chat NO requiere llamar OpenRouter; Director IA en web es opcional. OpenRouter/free, Google Maps y Vercel pueden tener cuotas y facturación independientes; no prometer gasto global garantizado $0, no activar gasto pago ni fallback.

## 6. Ejemplos

@LINK WORLD revisa mis negocios y dime qué datos faltan.
@LINK WORLD quiero agregar esta ficha de negocio. Muéstrame primero qué guardarás.
@LINK WORLD revisa las solicitudes pendientes de la web.
@LINK WORLD investiga estos tres UUIDs de la app, diseñemos una colaboración.
@LINK WORLD guarda la relación aprobada como propuesta y verifica su ID.

El criterio de éxito es que ChatGPT y la web lean el mismo registro real, con su UUID, permisos y trazabilidad.
