---
name: link-director
description: Habilidad compartida para diseñar, auditar y evolucionar el Director IA de cualquier célula LINK; enruta a la tesis, las siete estrategias, el registro y la política de gasto cero.
version: 1.0.0
---

# LINK Director · habilidad maestra reutilizable

## Invocación

`@LINK Director` es el **nombre humano de invocación**, no una garantía de
que ChatGPT haya instalado automáticamente esta habilidad en todas las
conversaciones. Para utilizarla en otro proyecto/chat, añadir esta skill al
entorno del agente, compartir su URL o proporcionar el archivo y pedir:
**«Usa LINK Director; lee SKILL.md y su manual de enrutamiento antes de actuar»**.

Fuente canónica: https://github.com/gonzalogaraymunoz-star/link-world/blob/main/.agents/skills/link-director/SKILL.md

## Primer enrutamiento obligatorio

1. Identificar el negocio/proyecto y su autorización. Si es LINK WORLD, leer
   `README.md`, `AGENTS.md`, `docs/INTERFAZ_ESTRATEGICA_V0.4.md`
   y `docs/LINK_DIRECTOR_MANUAL.md`.
2. Si el usuario adjuntó el Manual Maestro
   `LINK_WORLD_MANUAL_MAESTRO_JUEGO_v1(1).md`, leerlo antes de alterar la
   arquitectura: **no inferir que la skill reemplaza el documento**.
3. La política de **ejecución dentro de la app** está en
   `api/LINK_DIRECTOR_SYSTEM.md`; `api/director.js` la lee en cada
   inicialización de servidor. Cualquier cambio en el prompt principal se
   realiza ahí, no sólo en el texto de la interfaz.
4. Para mapas, leer además
   `.agents/skills/link-geo/SKILL.md` y
   `.agents/skills/google-maps-platform/SKILL.md`;
   verificar documentación y condiciones de Google actualizadas.
5. Antes de usar sistemas externos de otra célula, identificar contrato,
   permisos, fuente de verdad y estado actual. No inventar conectores.

## Objeto del sistema

LINK es un organismo económico cooperativo de células autónomas. El Director
no es una pantalla de chat decorativa; traduce necesidades a alternativas,
acciones verificables y memoria. Su trabajo comienza por las siete estrategias:
demanda, capacidades, cooperación, recurrencia, territorio, evidencia e
incubación. Ciclo: observar → interpretar → decidir → actuar → verificar →
aprender → reobservar.

La geografía es una fuente de observación, no un CRM; la Demo es simulación,
no resultado comercial; los eventos reales requieren autorización y evidencia.

## Contrato de la IA y herramientas

- Entradas: objetivo, estrategia, célula, misión, restricciones y fuentes
  autorizadas. La app actual **solo envía** el texto ingresado, estrategia,
  célula y estado DEMO; nunca una ficha Places por defecto.
- Salida: objetivo, datos conocidos con procedencia, incertidumbres,
  alternativas, dependencias, próxima acción y regla de verificación.
- Jamás afirmar que hay reserva, operación, ingreso, alianza o sinapsis
  ejercida por mera sugerencia del modelo.
- El Director sólo propone; cualquier misión real, mensaje, pago, acuerdo,
  actualización de datos o comunicación externa exige permiso y fuente
  autorizada. Sin consentimiento, no ejecutar.
- No insertar credenciales en Markdown, GitHub, mensajes, historial ni
  `localStorage`.

## Conector URL / MODEL / API

La interfaz actual permite registrar URL y MODEL como configuración pública;
la API key se escribe en un campo de contraseña y no se persiste. El proxy
`api/director.js` restringe URL y modelo antes de llamar al proveedor y lee
el prompt desde `api/LINK_DIRECTOR_SYSTEM.md`.

**Fase estricta $0:** sólo endpoint de Groq Free
`https://api.groq.com/openai/v1/chat/completions`, clave propia de una cuenta
confirmada Free **sin facturación de pago**, hasta 5 intentos/día/navegador,
entrada hasta 1800 caracteres, salida hasta 700 tokens, sin reintentos ni
fallback. Otros endpoints, aunque tengan campos URL/MODEL/API, no están
autorizados por el proxy $0. Añadir otro proveedor requiere auditar
facturación, seguridad, CORS, reglas de API, protección SSRF y claves; nunca
habilitar hosts arbitrarios.

**Importante:** el contador del navegador no es cuota global, no controla
otras apps, ni garantiza matemáticamente coste cero en una cuenta externa que
puede facturar. Si el usuario exige nunca pagar, debe mantener un proveedor
Free sin método de pago/auto-upgrade y revisar también su uso de Google Maps
y Vercel, cuyas facturaciones son independientes. No indicar que se instaló
una protección de gasto real en Cloud si no existe.

## Registro

La sección **Registro** de LINK WORLD admite solicitudes manuales (sin IA)
y respuestas del modelo cuando el usuario marca la casilla. Hoy persiste
localmente en el navegador y permite exportar JSON; **no se sincroniza**
entre equipos, chats ni negocios; las claves jamás entran al registro.
La fecha, fuente, tipo y estado acompañan cada anotación. Evitar detalles
personales innecesarios y no guardar contenido Google Places como registro
propio. Para registros compartidos, auditar Supabase/Auth/RLS antes de crear
tablas o dar acceso multiempresa.

## Criterios de aceptación por proyecto

1. Modelo/API configurables sin claves en GitHub.
2. Sin clave, sin cuenta Free confirmada, URL prohibida o cuota local agotada:
   no se envía la solicitud.
3. Un fallo no activa servicio de pago ni reintento automático.
4. La casilla Registrar controla si se persiste pregunta/respuesta;
   las solicitudes manuales se registran sin IA.
5. El registro se exporta y borra; la clave nunca se exporta.
6. Google Maps, capas, Demo y operación real no se confunden.
7. Se prueba build, reglas del Director y endpoints; cualquier verificación
   incompleta se declara. Ningún botón inerte disfrazado de capacidad real.
