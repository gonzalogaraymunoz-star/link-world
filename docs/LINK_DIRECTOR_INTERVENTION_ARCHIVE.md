# LINK WORLD · Archivo central de intervenciones del Director IA

## Propósito

Este archivo permite revisar **desde ChatGPT / LINK WORLD** todo lo que la IA interna del Director haya hecho.

La fuente viva no es un Markdown estático. Es Supabase:

`public.link_world_ai_interventions`

La vista de lectura es:

`public.link_world_ai_intervention_archive`

Así el archivo no se queda obsoleto cuando el Director sigue conversando.

## Qué se guarda

Cada intervención registra:

- fecha y hora;
- sesión del Director;
- número de turno;
- tipo de evento: chat o prueba de conexión;
- proveedor;
- modelo;
- pregunta enviada por el usuario;
- respuesta de la IA;
- error, si existió;
- si se compartió contexto LINK;
- alcance del contexto;
- cantidad de negocios incluidos;
- tokens de entrada y salida cuando el proveedor los reporta;
- latencia;
- estado;
- metadata técnica no sensible;
- feedback humano futuro.

## Qué NO se guarda

Nunca se guarda en este archivo:

- API keys;
- credenciales;
- endpoint con credenciales embebidas;
- snapshot bruto completo de datos privados LINK;
- razonamiento interno del proveedor.

El archivo registra que hubo contexto autorizado y su alcance, pero no duplica el snapshot privado enviado al modelo.

## Cómo consultarlo desde ChatGPT

Comandos naturales recomendados:

- «@LINK WORLD revisa el archivo del Director de hoy».
- «Muéstrame las últimas 20 intervenciones del Director».
- «Busca dónde el Director habló de LINK Cupones».
- «Compara cómo respondió el Director esta semana».
- «Encuentra respuestas demasiado largas para convertirlas en aprendizaje».
- «Dame todos los errores del Director por proveedor y modelo».
- «Revisa esta sesión del Director: [session_id]».
- «Convierte estas correcciones en link_learnings».

La consulta debe hacerse contra Supabase, no contra una copia manual.

## Consulta base

```sql
select
  created_at,
  session_id,
  turn_index,
  provider_label,
  model,
  status,
  user_prompt,
  assistant_response,
  error_message,
  context_included,
  context_scope,
  input_tokens,
  output_tokens,
  latency_ms
from public.link_world_ai_intervention_archive
order by created_at desc
limit 100;
```

## Relación con el aprendizaje del Director

Este archivo será la evidencia primaria del futuro **Director Response Engine**.

Flujo esperado:

`intervención → feedback humano → link_learning → link_pattern → link_rule / link_example`

El archivo no modifica por sí solo la personalidad del Director.

Primero conserva evidencia. Después LINK WORLD decide qué aprendizaje incorporar.

## Integridad

Las intervenciones se crean desde `/api/director` después de una llamada real al proveedor o después de un error real.

La app muestra **Archivo IA** en el panel de estado:

- Activo: archivo disponible.
- Guardado · [id]: última intervención persistida.
- Error de archivo: la llamada ocurrió pero no se pudo persistir; debe investigarse.

## Sesiones

Cada conversación nueva recibe un `session_id` distinto.

Esto permite reconstruir una conversación completa aunque se cambie de proveedor o modelo dentro de ella.

`turn_index` permite ordenar las intervenciones dentro de esa sesión.

## Regla operativa

El archivo es **append-only en operación normal**.

No borrar ni reescribir intervenciones para “mejorar” el historial. Las correcciones deben vivir como feedback/aprendizajes vinculados a la intervención original.

Esto conserva trazabilidad real.
