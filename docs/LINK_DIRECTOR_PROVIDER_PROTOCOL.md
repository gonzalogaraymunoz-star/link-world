# LINK WORLD · Director IA · Provider Protocol v5

## Objetivo

La instalación normal del Director debe ser simple:

**Pegar API → Conectar IA → conversar.**

El usuario no necesita elegir proveedor, endpoint ni modelo para empezar.

LINK WORLD mantiene internamente un preset estable y deja la configuración avanzada disponible solo cuando sea necesaria.

## Modo simple · recomendado

El modo simple usa:

- Proveedor: **OpenRouter**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Modelo: **Qwen3 235B A22B Instruct 2507**
- ID: `qwen/qwen3-235b-a22b-2507:free`
- Tipo: modelo open-weight, instruct, sin modo de thinking nativo
- Credencial: API key OpenRouter pegada por el usuario

Flujo:

1. Abrir **Director IA**.
2. Pulsar **Conectar IA**.
3. Pegar la API key de OpenRouter.
4. Pulsar **Conectar IA**.
5. LINK WORLD prueba el modelo con una generación mínima.
6. Si responde, el Director queda listo.

La API key vive solo en la pestaña actual y no se guarda.

## Por qué este preset

El modo simple busca reducir errores de integración:

- un solo proveedor;
- un solo endpoint;
- un modelo de texto directo;
- sin selector técnico visible;
- sin fallback automático;
- sin almacenamiento de credenciales.

El modelo por defecto puede cambiar en una nueva versión del protocolo, pero siempre mediante una actualización explícita y documentada.

## Configuración avanzada

El botón **Configuración avanzada** permite mantener el protocolo abierto.

Se puede elegir:

- OpenRouter;
- Groq;
- NVIDIA NIM;
- otro endpoint público compatible con OpenAI Chat Completions.

En modo avanzado sí se puede editar:

- proveedor;
- endpoint;
- identificador exacto del modelo.

La API key sigue siendo efímera.

## Contrato interno

La web envía a `/api/director`:

- `provider`
- `model`
- `apiKey`
- `endpoint` cuando corresponde
- `action`: `check` o `chat`
- `prompt`
- `messages`
- `context`
- metadata del archivo de intervenciones

El backend normaliza la respuesta para que el resto de LINK WORLD no dependa del proveedor.

## Seguridad

La API key:

- no entra al prompt;
- no se guarda en Supabase;
- no se guarda en GitHub;
- no se guarda en localStorage;
- no aparece en el archivo de intervenciones.

Para endpoints custom:

- solo HTTPS;
- sin credenciales embebidas en URL;
- sin redes privadas;
- sin localhost;
- sin redirecciones;
- sin puertos no estándar.

## Sin fallback

LINK WORLD usa exactamente el proveedor/modelo seleccionado.

Si falla:

- muestra el error;
- no cambia de modelo;
- no cambia de proveedor;
- no activa un modelo pagado;
- no oculta la falla.

## Prueba de conexión

`action: check` hace una generación mínima real.

Valida:

1. credencial;
2. endpoint;
3. modelo;
4. capacidad real de devolver texto.

La prueba puede consumir cuota del proveedor.

## Contexto LINK

El modelo solo recibe contexto de LINK cuando el usuario activa **Incluir datos de LINK**.

Supabase sigue siendo la fuente de verdad.

El Director interpreta una instantánea limitada; conversar no escribe en las tablas.

## Archivo IA

Cada intervención queda registrada en `link_world_ai_interventions` sin credenciales.

Se registra:

- pregunta;
- respuesta;
- proveedor;
- modelo;
- estado;
- error;
- tokens cuando existen;
- latencia;
- si se compartió contexto LINK.

## Principios

1. Instalar debe ser más simple que configurar.
2. El modo simple requiere solo API key.
3. La configuración avanzada no desaparece.
4. No almacenar credenciales.
5. No hacer fallback silencioso.
6. No convertir errores del proveedor en respuestas inventadas.
7. Supabase sigue siendo la fuente de verdad.
8. El proveedor es una capa intercambiable; la identidad del Director pertenece a LINK WORLD.
