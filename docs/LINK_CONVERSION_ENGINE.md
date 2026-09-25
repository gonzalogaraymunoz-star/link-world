# LINK WORLD · Conversion Engine v1

## Objetivo

LINK Conversion Engine convierte actividad dispersa en una cola operacional priorizada por cercanía a conversión.

No reemplaza el criterio humano. Produce una señal explícita, auditable y revisable.

## Taxonomía

- **C5 · Dinero** — cobro, pago, reserva o cierre verificable.
- **C4 · Cierre** — cotización, propuesta, seguimiento, negociación o decisión cercana al cierre.
- **C3 · Oportunidad** — lead, contacto, reunión, derivación o avance comercial identificable.
- **C2 · Atracción** — contenido, pauta, campaña o acción que genera demanda.
- **C1 · Infraestructura** — sistema, automatización, documentación o capacidad que habilita conversiones futuras.
- **C0 · Soporte** — mantenimiento o administración sin conversión directa.

Jerarquía por defecto:

`C5 > C4 > C3 > C2 > C1 > C0`

Una dependencia real, evidencia más reciente o un objetivo explícito puede justificar otro orden.

## Fuentes vivas

El motor clasifica actualmente:

- `work_items`
- `link_world_requests`
- `sales_leads`

Los resultados derivados viven en:

- `link_conversion_assessments`
- vista `link_conversion_queue`

## Priority Score

El score 0–100 combina:

- nivel de conversión;
- urgencia;
- señal de valor económico;
- probabilidad operativa;
- efecto desbloqueador;
- esfuerzo estimado.

El score es una **heurística operacional**, no una predicción financiera.

## Refresco

`refresh_link_conversion_assessments()` vuelve a clasificar las fuentes.

Se ejecuta automáticamente cada hora mediante `pg_cron`.

## Daily Intelligence

Los informes viven en:

`link_daily_intelligence_reports`

y además se publican en Corteza:

`link_cortex_documents.entity_type = daily_intelligence_report`

Existen dos tipos:

### closing

Generado a las **23:50 America/Santiago**.

Resume el día que termina:

- actividad LINK;
- intervenciones del Director;
- errores IA;
- eventos comerciales;
- leads nuevos;
- tareas completadas;
- movimientos comerciales;
- cierres;
- cola C0–C5;
- prioridades;
- bloqueos.

### opening

Generado a las **07:30 America/Santiago**.

Usa la actividad del día anterior y la cola vigente para construir la apertura del día.

El cron tiene dos disparadores UTC por informe para soportar cambios de horario de Chile; la función solo ejecuta cuando la hora local coincide.

## Integración con Director IA

Cuando el usuario activa **Incluir datos de LINK**, el contexto puede incluir:

- `conversion_intelligence`
- `daily_intelligence_reports`

El Director debe distinguir que son datos derivados y fechados.

Nunca debe presentar el score como certeza.

## Flujo

```
Actividad real
  ↓
work_items / requests / leads
  ↓
Conversion Engine
  ↓
C0–C5 + score + acción recomendada
  ↓
Daily Intelligence
  ↓
Director IA / ChatGPT / operación
  ↓
resultado real
  ↓
Learning Worker
```

## Consultas desde ChatGPT

Ejemplos:

- «@LINK WORLD dame la cola de conversión actual».
- «¿Qué actividades C5 y C4 están bloqueadas?»
- «Lee el cierre diario de ayer».
- «Dame el brief de apertura de hoy».
- «¿Qué estamos haciendo en C1 mientras hay C4/C5 pendientes?»
- «Revisa las prioridades y dime qué cambió desde ayer».

La fuente debe ser Supabase, no una copia manual.

## Reglas de integridad

1. No inventar conversión si no hay evidencia.
2. Una clasificación automática puede corregirse.
3. El score no equivale a probabilidad de venta.
4. No borrar historial para ocultar malas prioridades.
5. Toda evolución de la taxonomía debe versionarse.
6. Actividad de infraestructura no debe desplazar C3–C5 salvo dependencia explícita.
