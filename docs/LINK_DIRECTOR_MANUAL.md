# LINK DIRECTOR — MANUAL DE USO v1.1 · OPENROUTER

Origen: Manual Maestro LINK WORLD v1. No sustituye el documento original de
la tesis ni acredita operación real con otras células.

## Inicio sencillo: SÓLO API KEY

LINK WORLD → **Director IA** → **URL · MODEL · API**.

| Campo | Ya preparado |
| --- | --- |
| URL | `https://openrouter.ai/api/v1/chat/completions` |
| MODEL | `openrouter/free` |
| API | **Pega solamente tu clave OpenRouter sk-or-…** |

La URL y el modelo son visibles/editables, pero la URL distinta de OpenRouter
se bloquea y sólo se admite `openrouter/free` o un slug específico
terminado en `:free`. No usar `openrouter/auto`, Claude o un slug de
pago para este modo. No hay fallback a pago.

Después, escribe tu objetivo en **Director** y pulsa «Consultar». La respuesta
es una propuesta: no envía mensajes, cobra, actualiza Supabase ni registra
ventas. Puedes activar la casilla de registro local o dejarla desmarcada.

[Crear una API key en OpenRouter](https://openrouter.ai/settings/keys) ·
[Router de modelos gratuitos](https://openrouter.ai/openrouter/free) ·
[API Chat Completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request)

## Protocolo para Claude Code (distinto de LINK WORLD web)

Si en otro momento deseas usar el comando `claude` con OpenRouter en
terminal, su protocolo compatible con Anthropic utiliza:

```bash
export OPENROUTER_API_KEY="<PEGA_TU_CLAVE_OPENROUTER_LOCALMENTE>"
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY"
export ANTHROPIC_API_KEY=""
claude --model openrouter/free
```

Revisa compatibilidad y nombres de modelos según
[las instrucciones oficiales para Claude Code](https://openrouter.ai/docs/guides/coding-agents/claude-code-integration).
**El comando de Claude Code no se ejecuta dentro de LINK WORLD ni se necesita
para conectar la app.** Nunca compartir la clave o guardar un archivo
`.env` en GitHub.

## Seguridad y cero gasto

- Router gratuito `openrouter/free` o variantes `:free` exclusivamente.
  OpenRouter publica precio de cero tokens para su router Free; el catálogo
  y las cuotas pueden cambiar.
- Cinco intentos diarios por **navegador**, incluidos errores; 1800
  caracteres de pregunta; máximo 700 tokens de respuesta; timeout 13 s.
- La clave permanece sólo en el campo de esta pestaña. El navegador la envía
  vía HTTPS a una función LINK/Vercel que la reenvía a OpenRouter. El proxy
  no persiste claves, conversaciones o respuestas; el registro optativo se
  almacena en el navegador.
- Los límites de navegador no son un tope servidor global ni impiden que la
  misma clave se utilice fuera de LINK. Mantener auto-recarga de créditos
  deshabilitada y, si está disponible, límite $0 a la clave/cuenta; no
  habilitar rutas de pago. Si el proveedor agota cuota, el sistema debe
  detenerse y no cambiar a modelos facturables.
- OpenRouter, Google Maps/Places y Vercel tienen políticas/costos
  independientes. Ninguna interfaz puede garantizar US$0 total si otra
  cuenta/sistema permite facturación.

## Registro de solicitudes

La pestaña Registro permite anotar solicitudes manuales **sin IA** y
consultar las que elegiste conservar. Hasta 80 registros **locales por
navegador**, con fecha, fuente y estado; exportar JSON o borrar. No se
sincronizan chats ni equipos, no contienen API keys y desaparecen si se
borra almacenamiento local sin exportación.

## Habilidad transversal

Usar:
https://github.com/gonzalogaraymunoz-star/link-world/blob/main/.agents/skills/link-director/SKILL.md

`@LINK Director` es un nombre de invocación humano; para que otro
chat/entorno use el archivo deberá tenerlo disponible e invocarlo por URL
o instalarlo según la plataforma. Instrucción canónica que usa la API:
`api/LINK_DIRECTOR_SYSTEM.md`. Para geografía, consultar `link-geo`.
