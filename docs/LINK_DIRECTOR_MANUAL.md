# LINK WORLD · Director IA conversacional v4

El Director es una **sala de inteligencia a pantalla completa** dentro de LINK WORLD. Ya no está amarrado a OpenRouter ni a un único modelo.

Código activo:

- `src/ai/directorChat.js`
- `src/ai/chat.css`
- `api/director.js`
- `api/LINK_DIRECTOR_SYSTEM.md`
- `docs/LINK_DIRECTOR_PROVIDER_PROTOCOL.md`

## Empezar

1. Abre https://link-world-delta.vercel.app/ → **Director IA**.
2. En la columna derecha entra a **Proveedor, modelo y API**.
3. Selecciona:
   - OpenRouter,
   - Groq,
   - NVIDIA NIM,
   - u **Otro · OpenAI-compatible**.
4. Escribe el identificador exacto del modelo.
5. Pega la API key del proveedor. La clave vive solo en la pestaña y no se guarda.
6. En proveedor custom, pega una URL pública HTTPS que termine en `/v1` o en `/chat/completions`.
7. Puedes pulsar **Probar conexión**. Esta prueba hace una generación mínima real y puede consumir una pequeña cantidad de cuota.
8. Escribe en el chat. **Enter** envía y **Mayús+Enter** añade línea.

## OpenRouter abierto

OpenRouter ya no está limitado a `:free`.

Puedes escribir cualquier ID de modelo permitido por tu propia cuenta. LINK WORLD usa exactamente ese modelo y no cambia a otro automáticamente.

Si OpenRouter exige crédito, limita cuota o rechaza el modelo, verás el error y la consulta se detiene.

## Otros proveedores

Groq y NVIDIA NIM tienen presets.

Para otros hosts de modelos open source usa **Otro · OpenAI-compatible**. El backend normaliza una URL base `/v1` hacia `/chat/completions`.

El endpoint debe ser público HTTPS. No se permiten localhost, redes privadas ni endpoints internos.

## Estado comprensible

- **Configuración incompleta:** falta modelo, endpoint custom o API key obligatoria.
- **Proveedor modificado · pendiente de prueba:** cambiaste de proveedor.
- **Modelo modificado · pendiente de prueba:** cambiaste el modelo.
- **Probando proveedor…:** se está haciendo una generación mínima.
- **Conectado · proveedor:** el proveedor y modelo respondieron.
- **Pensando · proveedor:** una consulta real está en curso.
- **Consulta fallida:** la interfaz muestra el error devuelto por proveedor/backend.

## Sin fallback

LINK WORLD nunca cambia automáticamente:

- proveedor;
- modelo;
- endpoint;
- plan de precio.

Una falla no dispara un segundo proveedor ni un modelo de pago.

## Contexto LINK

Para compartir datos propios, marca **Incluir datos de LINK** antes de enviar.

La app lee una muestra autorizada de Supabase LINK CONTROL CENTRAL y la entrega únicamente al proveedor seleccionado en esa consulta.

Supabase sigue siendo la fuente de verdad. El modelo recibe una instantánea, no acceso directo a las tablas.

## Privacidad de credenciales

La API key:

- no se guarda en localStorage;
- no se guarda en Supabase;
- no se guarda en GitHub;
- no aparece en el registro local;
- no forma parte del prompt del Director.

Sí se pueden recordar localmente el proveedor, el modelo y el endpoint custom para no tener que configurarlos en cada apertura.

## Conversación y registro

El chat mantiene hasta 12 mensajes anteriores recortados para contexto durante la sesión.

Puedes:

- exportar la conversación;
- iniciar una nueva;
- activar **Guardar respuestas en registro local**;
- registrar solicitudes locales manuales.

El registro local no equivale a una escritura en LINK WORLD.

## Google

**Abrir territorio / Google** sale del Director y abre la herramienta territorial.

El modelo no ejecuta búsquedas Google en silencio.

## Costos

LINK WORLD no promete costo cero.

Cada proveedor conserva sus propias reglas de cuota, crédito, límites y precios. La prueba de conexión y cada consulta pueden consumir cuota del proveedor configurado.

## Contrato completo

Ver:

`docs/LINK_DIRECTOR_PROVIDER_PROTOCOL.md`

Ese protocolo separa la lógica del Director del proveedor de IA y permite ampliar el sistema sin rehacer la interfaz.
