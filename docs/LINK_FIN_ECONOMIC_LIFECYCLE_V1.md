# LINK FIN · Ciclo de vida económico V1

## Propósito

LINK FIN es la memoria económica transversal de los negocios de LINK.

Su función no es declarar que un negocio “parece viable”, sino certificar hechos económicos reales y conservar la evolución de cada unidad desde su ingreso al ecosistema hasta su transformación o reproducción.

FIN responde dos preguntas:

1. ¿Qué ocurrió económicamente?
2. ¿En qué estado económico comprobable se encuentra este negocio?

## Regla central

**FIN certifica hechos; no certifica intenciones.**

Una propuesta, conversación, cotización, proyección, contrato no ejecutado o documento sin pago no constituye caja real.

Del mismo modo:

- facturar no equivale a cobrar;
- cobrar no prueba por sí solo que el servicio fue prestado;
- una venta única no demuestra recurrencia;
- ingresos sin costos verificados no demuestran rentabilidad;
- una idea, marca, web o software sin evidencia económica sigue siendo un modelo o proyecto, no un negocio comprobado.

## Ciclo de vida canónico

| Orden | Etapa | Qué significa | Gate de certificación |
|---:|---|---|---|
| 10 | Nacimiento | Existe una solución, modelo o unidad identificable | Origen persistente y trazable |
| 20 | Ingreso a LINK | La unidad obtiene identidad dentro de LINK | Ficha/identidad canónica |
| 30 | Activación | Comienza ejecución real | Actividad operacional verificable |
| 40 | Primera evidencia económica | Aparece el primer hecho económico | Documento, transacción o evidencia persistente |
| 50 | Primera venta | Existe primer cierre comercial real | Cierre/transacción verificable |
| 60 | Primera facturación | Se emite primer documento de cobro/tributario | Factura, boleta o equivalente persistente |
| 70 | Primer cobro | Entra la primera caja comprobada | Pago verificado |
| 80 | Negocio comprobado | El modelo completó un ciclo económico real | Venta + prestación/entrega + documento + dinero |
| 90 | Recurrente | El ciclo vuelve a ocurrir | Dos o más ciclos comparables con evidencia |
| 100 | Rentable | Ingresos reales superan costos reales | Período y fórmula explícitos; solo caja/egresos verificados |
| 110 | Estable | Mantiene recurrencia y operación | Continuidad + recurrencia + evidencia |
| 120 | Transformación | Cambia modelo, producto, cliente, estructura o economía | Cambio material trazado desde estado anterior |
| 130 | Mitosis | Un modelo comprobado se replica | Origen comprobado + nueva identidad trazable |
| 140 | Meiosis | Se recombinan componentes de modelos comprobados | Orígenes y componentes heredados identificables |

## Negocio comprobado

El gate económico principal de LINK FIN es:

**venta → prestación/entrega → documento → dinero real**

Los cuatro componentes deben poder demostrarse.

Si falta uno, FIN no certifica la etapa `verified_business`.

Este gate implementa la regla económica de LINK: una solución puede ser útil y un proyecto puede estar activo, pero mientras no exista evidencia económica completa todavía no se considera un negocio comprobado.

## Relación con La Concha Eterna

La Concha describe cómo LINK transforma dolor en capacidad económica reutilizable.

FIN actúa como certificador económico de esa transformación:

dolor
→ solución
→ modelo
→ ejecución
→ primera evidencia económica
→ negocio comprobado
→ recurrencia
→ rentabilidad/estabilidad
→ transformación
→ mitosis o meiosis

FIN no sustituye a MAR, Ventas, Cierre, Boarding, Operaciones o Postventa. Esas capacidades explican y ejecutan el proceso. FIN conserva la evidencia económica que permite certificar los saltos de etapa.

## Evidencia y trazabilidad

Cada hito de ciclo de vida se guarda en `link_fin_business_lifecycle_events`.

Un evento conserva:

- negocio;
- etapa;
- fecha;
- estado de certificación;
- sistema fuente;
- referencia fuente;
- documento financiero cuando exista;
- transacción cuando exista;
- evidencia de modelo cuando exista;
- período de evaluación cuando corresponda;
- hito precedente;
- nota de evidencia;
- metadata.

Estados posibles:

- `observed`: señal registrada, todavía no certificada;
- `verified`: gate satisfecho con evidencia;
- `revoked`: certificación invalidada por nueva evidencia o corrección.

## Automatización permitida

FIN puede reconstruir automáticamente solo hitos cuya evidencia sea inequívoca.

Actualmente se reconstruyen:

- **Ingreso a LINK** desde la identidad canónica `link_world_businesses`;
- **Primera evidencia económica** desde el primer documento persistente;
- **Primera facturación** desde el primer documento de facturación persistente;
- **Primer cobro** solo desde un movimiento cuyo pago esté verificado.

FIN **no** infiere automáticamente:

- nacimiento anterior al ingreso a LINK;
- activación;
- primera venta;
- negocio comprobado;
- recurrencia;
- rentabilidad;
- estabilidad;
- transformación;
- mitosis;
- meiosis.

Esos hitos requieren evidencia suficiente del dominio correspondiente.

## Fuente de verdad

La vista `link_fin_business_lifecycle_v` devuelve la etapa económica certificada actual y su línea de vida.

La vista `link_fin_business_lifecycle_gaps_v` devuelve todas las etapas y permite saber qué está certificado y qué gate falta.

LINK FIN consume ambas vistas en la pestaña **Evolución**.

## Principio de no invención

Cuando LINK adquiere o incorpora un negocio existente, FIN no inventa su pasado.

Se puede reconstruir historia previa únicamente cuando exista evidencia suficiente: documentos, pagos, contratos ejecutados, entregas, archivos, sistemas fuente u otras pruebas persistentes.

Lo desconocido permanece desconocido hasta ser demostrado.
