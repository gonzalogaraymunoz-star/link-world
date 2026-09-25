# LINK WORLD · Director IA · Provider Protocol v4

## Objetivo

El Director IA no depende de un modelo ni de un proveedor fijo. LINK WORLD mantiene un **contrato interno estable** y conecta el modelo que el usuario elija mediante adaptadores de proveedor.

La regla central es:

**LINK WORLD → contrato Director → proveedor configurado → modelo exacto → respuesta → LINK WORLD**

El proveedor no define la lógica del Director. El prompt de sistema, el contexto autorizado, la trazabilidad y las reglas de no ejecución pertenecen a LINK WORLD.

## Contrato de conexión

La web envía al endpoint interno `/api/director`:

- `provider`: proveedor seleccionado.
- `model`: identificador exacto del modelo.
- `apiKey`: credencial temporal. No se persiste.
- `endpoint`: solo para proveedor `custom`.
- `action`: `check` o `chat`.
- `prompt`: mensaje del usuario.
- `messages`: historial acotado de la sesión.
- `context`: contexto LINK autorizado explícitamente.

La API key se utiliza únicamente para la llamada técnica. No entra al prompt del modelo, no se guarda en Supabase, GitHub, localStorage ni en el registro local.

## Proveedores activos

### OpenRouter

Preset administrado por LINK WORLD.

Endpoint:
`https://openrouter.ai/api/v1/chat/completions`

No se limita a modelos `:free`. El usuario puede utilizar cualquier identificador de modelo permitido por su cuenta OpenRouter.

### Groq

Preset OpenAI-compatible.

Endpoint:
`https://api.groq.com/openai/v1/chat/completions`

### NVIDIA NIM

Preset OpenAI-compatible.

Endpoint:
`https://integrate.api.nvidia.com/v1/chat/completions`

### Otro proveedor / custom

Permite un endpoint público HTTPS compatible con **OpenAI Chat Completions**.

Se acepta:

- una URL base terminada en `/v1`; LINK WORLD añade `/chat/completions`.
- un endpoint completo terminado en `/chat/completions`.

Ejemplos de familias que pueden integrarse por este camino si exponen compatibilidad OpenAI: proveedores de modelos open source, NIMs públicos, gateways propios y servidores gestionados compatibles.

## Seguridad del endpoint custom

El backend no funciona como proxy abierto.

Para endpoints personalizados:

- solo se admite HTTPS;
- no se aceptan credenciales embebidas en la URL;
- no se permiten puertos distintos de 443;
- se bloquean localhost, redes privadas, link-local y hosts internos;
- el hostname se resuelve antes de llamar al proveedor;
- se rechaza si alguna resolución apunta a una dirección privada/reservada;
- no se siguen redirecciones;
- solo se envía una solicitud de chat controlada por LINK WORLD.

Un servidor local como `localhost` no es alcanzable desde Vercel. Para usar un modelo autoalojado, debe exponerse mediante un endpoint público HTTPS seguro.

## Modelo exacto, sin fallback

LINK WORLD nunca cambia automáticamente:

- proveedor;
- modelo;
- endpoint;
- plan de precio.

Si el proveedor responde con error, cuota agotada, crédito requerido, modelo inexistente o timeout, la consulta se detiene y el error vuelve a la interfaz.

No existe fallback silencioso.

## Probar conexión

`action: check` realiza una generación mínima contra el proveedor y modelo seleccionados.

Esto valida de verdad:

1. API key;
2. endpoint;
3. modelo;
4. capacidad de chat.

La prueba puede consumir una cantidad mínima de cuota del proveedor. Por eso la interfaz lo indica explícitamente.

## Chat

`action: chat` utiliza el mismo contrato independientemente del proveedor:

```json
{
  "model": "modelo-seleccionado",
  "messages": [
    {"role": "system", "content": "contrato LINK DIRECTOR + contexto autorizado"},
    {"role": "user", "content": "pregunta"}
  ],
  "max_tokens": 2600,
  "stream": false
}
```

La respuesta se normaliza al formato interno:

```json
{
  "answer": "texto",
  "provider": "openrouter|groq|nvidia|custom",
  "providerLabel": "Proveedor",
  "model": "modelo-real-devuelto",
  "usage": {
    "inputTokens": 0,
    "outputTokens": 0
  },
  "status": "proposal_only",
  "reminder": "Ninguna operación real se ejecutó."
}
```

## Contexto LINK

El proveedor recibe datos de LINK únicamente cuando el usuario activa **Incluir datos de LINK**.

Supabase sigue siendo la fuente de verdad. La IA interpreta una instantánea limitada; no escribe en tablas por conversar.

El proveedor seleccionado cambia quién procesa esa instantánea. Por eso la autorización se presenta antes de enviar.

## Persistencia

Se puede guardar localmente:

- proveedor seleccionado;
- modelo;
- endpoint custom.

No se guarda:

- API key;
- conversación salvo que el usuario active registro local;
- contexto LINK como configuración permanente.

## Extensión futura

La interfaz no debe reescribirse para agregar otro proveedor.

Para un nuevo proveedor OpenAI-compatible basta con agregar un preset al registro del backend y a la lista visual.

Si en el futuro se necesita un protocolo nativo distinto —por ejemplo Messages API, Responses API u otro formato— se crea un adaptador que traduzca:

`contrato Director ↔ formato del proveedor`

El contrato LINK permanece igual.

## Principios no negociables

1. Supabase es fuente de verdad.
2. El usuario elige proveedor y modelo.
3. La API key es efímera.
4. No hay fallback automático.
5. Costos y cuotas pertenecen al proveedor.
6. Conversar no ejecuta operaciones.
7. Contexto privado solo se comparte con autorización explícita.
8. Un endpoint custom jamás debe convertir el backend en un proxy hacia redes internas.
