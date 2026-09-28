# LINK Sales Learning Cycle v1

## Estado

Implementado en Supabase `LINK CONTROL CENTRAL` y probado el 28-09-2026 mediante transacciones con `ROLLBACK`.

El circuito probado fue:

`reserva Taxi Hotel → lead → cotización → enlace de pago → pago confirmado → venta ganada → evento → observación en Corteza → informe diario`

No se conservaron reservas, contactos, pagos ni ventas de prueba.

## Dueños de verdad

| Dato | Dueño |
| --- | --- |
| Negocio y producto | LINK WORLD / sistema propietario |
| Contacto y oportunidad | `sales_leads` y CRM vinculado |
| Cotización comercial | `sales_quotes` |
| Reserva Taxi Hotel | `taxi_hotel_reservations` |
| Pago Taxi Hotel | `taxi_hotel_payments` |
| Desenlace comercial | `sales_cycle_outcomes`, con referencia a la evidencia propietaria |
| Historial | `sales_events` y `event_bus` |
| Observación de aprendizaje | `link_learnings` |

Una fila de `sales_cycle_outcomes` nunca sustituye el pago ni la reserva. Sólo confirma el resultado y apunta a su evidencia.

## Acciones ejecutables

Las acciones están registradas en `action_registry` y se ejecutan con:

`sales_execute_action_v1(action_key, payload, idempotency_key, requires_approval)`

| Acción | Resultado | Autonomía |
| --- | --- | --- |
| `commerce.lead.capture` | Crea o recupera un lead | Permitida |
| `commerce.quote.issue` | Crea una versión inmutable de oferta | Requiere aprobación fuera de una calculadora propietaria |
| `commerce.followup.schedule` | Programa el siguiente contacto | Permitida |
| `commerce.cycle.close` | Registra ganado, perdido o cancelado | Ganado exige pago verificable o aprobación humana |

Las acciones que necesitan aprobación quedan en `command_bus` con `approval_status=pending`. Un miembro activo las ejecuta con `sales_approve_and_execute_command_v1`.

## Automatización Taxi Hotel

Taxi Hotel es el primer piloto porque ya posee catálogo y cálculo de precios.

- Al crear una reserva se crea el lead de manera idempotente.
- La cotización toma el snapshot calculado por Taxi Hotel.
- El tiempo de confirmación alimenta `next_followup_at`.
- `link_sent` registra el enlace de pago enviado.
- `paid` cierra la venta sólo si el pago pertenece a esa reserva y coincide en monto y moneda.
- `cancelled` o `no_show` cierran como pérdida cuando aún no existe un desenlace.
- `refunded` conserva el cierre original y añade el evento posterior.

## Paneles de lectura

- `sales_cycle_queue_v`: lista operativa de leads, cotizaciones, seguimientos y cierres.
- `sales_cycle_dashboard_v`: abiertos, propuestas, seguimientos vencidos, ganados, perdidos, ingresos y tasa de cierre por negocio.
- `sales_learning_signals_v`: grupos de evidencia para que Corteza proponga patrones. Siempre quedan como candidatos hasta validación.

## Informes diarios

`link_daily_intelligence_reports.metrics` ahora incorpora:

- `won_sales`
- `lost_sales`
- `confirmed_revenue_clp`
- `quotes_issued`
- `followups_due_current`
- `sales_metrics_source=sales_cycle_outcomes_v1`

La misma sección se sincroniza con el documento diario de Corteza.

## Eventos canónicos

- `lead.created`
- `quote.issued`
- `followup.scheduled`
- `availability.confirmed`
- `payment.awaiting`
- `payment.link_sent`
- `payment.failed`
- `sale.won`
- `sale.lost`
- `sale.cancelled`
- `sale.refunded`
- `service.completed`

Los eventos que llegan a `event_bus` excluyen correo, teléfono y contenido libre.

## Criterio de aprendizaje

Cada desenlace crea una observación individual en `link_learnings` con `lifecycle_status=observed`. Una observación no cambia una regla ni una habilidad. `sales_learning_signals_v` agrupa la evidencia para revisión y validación posteriores.

## Pruebas aplicadas

1. Flujo completo Taxi Hotel con pago verificado y enriquecimiento del informe diario.
2. Ejecución por `command_bus` con captura autónoma, cotización detenida, aprobación de miembro y cierre perdido.
3. Confirmación posterior de cero filas de prueba.
4. RLS activo; tablas comerciales sin acceso `anon` y lectura de miembros mediante política.

