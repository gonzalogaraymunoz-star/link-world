# LINK WORLD · Director IA conversacional v3

El Director ahora es un **chat real** dentro de la web, no una pantalla de formularios. Código activo: `src/ai/directorChat.js` y `src/ai/chat.css`. El antiguo `directorPanel.js` queda fuera de la compilación.

## Empezar

1. Abre https://link-world-delta.vercel.app/ → **✦ Director IA**. Entras directamente al chat con bienvenida, ejemplos y campo de mensaje.
2. Pulsa **Conexión / Modelo**, pega tu clave de OpenRouter y verifica, si quieres, mediante **Comprobar clave**. La comprobación consulta `/api/v1/key` sin generar texto. Si esa verificación de cuenta no funciona, **puedes enviar un mensaje igualmente**; el chat te dará el error real de generación.
3. El modelo predeterminado es `nvidia/nemotron-3-ultra-550b-a55b:free`. Puedes introducir otro identificador `:free` o `openrouter/free`; la API rechaza automáticamente modelos de pago. La clave NO se persiste en localStorage, GitHub ni el registro.
4. Escribe en el chat. **Enter** envía, **Mayús+Enter** añade línea. Verás tu mensaje, estado «Pensando», luego una burbuja de respuesta o un error visible con el motivo. Si hubo error, tu consulta se recupera en el campo para editarla. No hay reintentos automáticos.
5. El chat mantiene contexto de hasta 12 mensajes anteriores, recortados a 1100 caracteres por mensaje, **solamente en memoria de esta pestaña**. Puedes exportarlo en JSON o abrir una conversación nueva. Recargar borra la conversación no exportada. El registro opcional está separado y nunca guarda la clave.
6. Para autorizar una investigación de datos propios, marca «Incluir datos privados de LINK» antes de enviar. La app intenta leer una muestra actual de Supabase con tu sesión válida en ↔ LINK WORLD y comparte ese resumen con OpenRouter **solo porque lo marcaste**. Los negocios DEMO se identifican como simulación; no hay acceso automático a otras bases de datos.
7. «Google manual» lleva al buscador sobre el mapa. El modelo no ejecuta búsquedas de Places sin interacción humana ni guarda fichas de Google. Máximo 8 búsquedas por sesión y 12 por día en este navegador, no un tope global de Google Cloud.

## Estados comprensibles

- Sin conectar: clave no introducida en esta pestaña.
- Comprobando clave: verificando cuenta sin generar texto.
- Clave verificada · modelo por probar: OpenRouter aceptó la clave, pero aún no respondió el modelo.
- Pensando · modelo gratuito: consulta enviada, esperando respuesta.
- Conectado · modelo exacto: se recibió una respuesta efectiva.
- Consulta fallida: la burbuja de error explica si fue clave, modelo no encontrado, cuota Free, crédito requerido, timeout o respuesta vacía.

El estado **no equivale a una promesa de gasto global $0**. Consultas Free no implican que Google Maps, Vercel o una cuenta OpenRouter con otras rutas habilitadas no puedan generar cargos. El Director no hace llamadas pagadas ni fallback y no impone su antiguo límite artificial de 5 consultas.

## Respuestas y permisos

El prompt real se mantiene en `api/LINK_DIRECTOR_SYSTEM.md`. Responde según lo que se pregunta, estructurando análisis de negocios cuando corresponde y distinguiendo datos, hipótesis y DEMO. El Director es de solo lectura / propuesta: no actualiza operaciones, no crea reservas, no envía mensajes y no negocia alianzas. La habilidad maestra para construir desde ChatGPT es `.agents/skills/link-world/SKILL.md`.
