# LINK DIRECTOR — MANUAL DE USO E INTEGRACIÓN v1.0

**Origen:** Manual Maestro LINK WORLD v1 del usuario, septiembre de 2026.
Esta síntesis de módulo no reemplaza el archivo completo
`LINK_WORLD_MANUAL_MAESTRO_JUEGO_v1(1).md` que originó la arquitectura.
Conserva el mismo principio: transformar una interfaz decorativa en una
capacidad para comprender y coordinar el organismo sin convertir simulaciones
en ventas.

## 1. Tres superficies, una instrucción común

| Superficie | Ubicación | Responsabilidad |
| --- | --- | --- |
| App web | `src/ai/directorPanel.js` | URL / MODEL / API, consulta y casilla de registro |
| Prompt real del modelo | `api/LINK_DIRECTOR_SYSTEM.md` | Contrato del Director leído por el servidor |
| Agentes en otros proyectos/chats | `.agents/skills/link-director/SKILL.md` | Rutas y reglas reutilizables |
| Estado económico / geográfico | `src/domain/demoWorld.js` y `src/googleMaps.js` | Mapa y Demo permanecen separados |

La app **no obtiene acceso a tus conversaciones de ChatGPT** por copiar una
Skill; tampoco invoca modelos sin clave configurada y confirmación del usuario.

## 2. Uso dentro de LINK WORLD

1. Abrir la web y tocar **Director IA**.
2. En **URL · MODEL · API**, introducir la URL de un endpoint compatible con
   chat completions, el ID de un modelo abierto disponible en el proveedor y
   la API key del proveedor. En la primera etapa sólo funciona Groq Free;
   URLs distintas se bloquean deliberadamente.
3. Confirmar en la casilla que la **cuenta externa sigue siendo Free y sin
   facturación de pago**. No añadir tarjeta ni activar upgrade automático.
4. Volver a **Director** y escribir objetivo; marcar **Registrar solicitud y
   respuesta** si quieres archivarla localmente.
5. Revisar propuesta, fuentes faltantes y alternativas; la respuesta no
   ejecuta nada sobre células ni envía mensajes.

Configuración inicial sugerida (verificar disponibilidad actual del modelo
en tu cuenta):

```text
URL   https://api.groq.com/openai/v1/chat/completions
MODEL openai/gpt-oss-20b
API   [tu propia clave de cuenta Free; NO la pongas en el chat]
```

## 3. Registro de solicitudes

En **Registro**: anotar peticiones pendientes sin IA, consultar los
resultados cuyo almacenamiento autorizaste, exportar JSON y borrar todo.
Cada evento incluye fecha, tipo, estado y fuente. La API key no se guarda
en JSON. Capacidad actual: hasta 80 registros, por navegador, con límite
de almacenamiento; si el navegador se borra, se pierde el historial no
exportado. **No hay sincronización con Supabase ni otros chats todavía**.

## 4. Presupuesto y seguridad

- **AI externo apagado hasta introducir clave y confirmar Free.**
- Proxy del servidor sólo admite la URL Groq Free exacta y rechaza las demás
  sin enviar solicitud; sin fallback y sin reintentos.
- Máximo **5 intentos por día y navegador**, incluyendo los fallidos,
  **1.800 caracteres de entrada de usuario** y **700 tokens de salida**;
  límite de tiempo 13 s. No es límite global resistente a usuarios maliciosos.
- La clave viaja en cada petición cifrada por HTTPS al proxy de Vercel,
  que la reenvía a Groq. No se guarda en GitHub ni localStorage. Es
  una clave privada y no debe publicarse.
- La cuenta externa debe permanecer Free, sin facturación o upgrades. Si
  cambia, **los límites de la UI no garantizan que no te cobren**.
- Google Maps/Places y Vercel tienen **facturación independiente**; el
  Director no puede prometer US$0 por ellos.
- No utilizar URL arbitrarias como proxy abierto; la casilla URL existe
  para preparar futuros proveedores, previa auditoría del host, SSRF,
  cumplimiento y garantías de gasto.

## 5. Reutilización de la habilidad

Abrir o incorporar:

https://github.com/gonzalogaraymunoz-star/link-world/blob/main/.agents/skills/link-director/SKILL.md

Solicitar a otro agente:

```text
Usa LINK Director y lee SKILL.md del repositorio link-world.
Sigue su enrutamiento al Manual Maestro, al contrato del sistema
y a la habilidad LINK Geo cuando corresponda. Conserva la autonomía
de cada célula, registra solicitudes y mantén gasto externo $0.
```

**Invocación por nombre no equivale a instalación universal.**
Para que funcione por `@LINK Director` en cada entorno, esa plataforma
debe registrar/instalar la Skill por su mecanismo propio. El .md deja
el contrato portable y accesible por URL.

## 6. Siguiente evolución autorizable

Cuando el usuario seleccione proyecto Supabase real y se auditen schemas/
RLS, integrar solicitudes compartidas con identidad, permisos, auditoría,
trazabilidad entre chats/proyectos y límite global server-side real.
Hasta entonces, no afirmar que la app tiene memoria transversal ni que
el Director ejecuta acciones en negocios.
