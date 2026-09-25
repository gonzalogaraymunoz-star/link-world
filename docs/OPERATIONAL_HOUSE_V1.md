# LINK WORLD · Operational House v1

## Propósito

`operational_house_v1` es el arquetipo replicable para negocios que poseen o coordinan una infraestructura comercial/operacional propia y deben integrarse a LINK WORLD sin duplicar su sistema transaccional.

**HOTEL EXPERIENCE es la instancia de referencia #1.**

La regla central es:

> LINK WORLD entiende, conecta, observa y aprende.  
> La Casa Operativa sigue ejecutando su dominio.

## Separación de verdad

### LINK WORLD es dueño de

- identidad global;
- relaciones entre células y contrapartes;
- capacidades;
- estado del ecosistema;
- bindings;
- eventos verificados;
- evidencia y aprendizaje.

### La Casa Operativa / sistema fuente es dueño de

- leads o solicitudes transaccionales;
- reservas;
- pasajeros/personas;
- pagos;
- costos operacionales;
- operación;
- comisiones;
- cierres;
- registros específicos del dominio.

No se crea una segunda reserva, un segundo pago ni una copia sensible de pasajeros en LINK WORLD.

## Economía

Para Casas Operativas que intermedian servicios:

1. se reconoce primero el costo real de ejecución;
2. luego se calcula el margen comercial;
3. después se distribuye el margen según convenio;
4. porcentajes y reglas deben ser configurables por instancia/producto/contraparte;
5. una regla de referencia nunca se convierte automáticamente en un convenio activo.

## Contrato de integración

Versión: `operational-house-bridge-v1`.

Cada Casa debe registrar estos roles en `integration_bindings.metadata.contract_role`:

| Rol | Responsabilidad |
| --- | --- |
| `operational_core` | Fuente transaccional canónica |
| `sales_apparatus` | Superficie o canal que capta/convierte |
| `operations_surface` | Superficie que administra la ejecución |
| `counterparty_projection` | Fuente de contrapartes y relaciones |
| `product_projection` | Fuente de productos/capacidades |
| `event_bridge` | Transporte de eventos mínimos hacia LINK WORLD |

Estados de `ecosystem_operational_house_readiness_v`:

- `incomplete`: falta al menos un rol requerido;
- `registered_pending_sync`: todos están registrados pero alguno no sincroniza;
- `connected`: roles obligatorios conectados.

## Eventos

Transporte: `event_bus`.

Semántica: **at-least-once + dedupe_key**.

Eventos canónicos iniciales:

- `counterparty.connected`
- `product.available`
- `sale.confirmed`
- `operation.completed`
- `commission.accrued`
- `feedback.closed`

Los payloads deben llevar referencias mínimas. No incluir documentos, datos médicos, datos de pago completos ni otra PII sensible.

## Relaciones

La Casa se relaciona con contrapartes mediante identidad global y evidencia:

`Casa → works_with → Contraparte`

`Contraparte → counterparty_of → Casa`

Un registro activo en el sistema fuente indica existencia/actividad operacional. **No prueba por sí solo un convenio económico.**

## Proyecciones

Las proyecciones deben preferir:

- IDs fuente;
- códigos/prefijos;
- tipo de contraparte;
- estado;
- capacidades;
- agregados;
- evidencia.

Evitar copiar:

- pasajeros;
- reservas completas;
- pagos completos;
- precios si la Casa es su fuente canónica;
- notas sensibles;
- información duplicada sin función ecosistémica.

## Creación de una nueva Casa

1. Revisar Supabase vigente y comprobar que no exista.
2. Crear o identificar `link_world_businesses`.
3. Confirmar que el negocio tenga `global_id` y `ecosystem_cells`.
4. Aplicar `operational_house_v1`.
5. Registrar configuración de instancia:
   - tipo de Casa;
   - etiqueta;
   - sistema fuente;
   - superficies;
   - vocabulario de dominio.
6. Registrar los seis roles de binding.
7. Proyectar contrapartes verificadas.
8. Proyectar identidad/capacidad de productos, no transacciones.
9. Implementar `event_bridge`.
10. Consultar `ecosystem_operational_house_readiness_v`.
11. Recién entonces elevar salud/conectividad.
12. Usar la vista genérica de Casa Operativa; no crear frontend especial por negocio.

## HOTEL EXPERIENCE · instancia de referencia

- Arquetipo: `operational_house_v1@1.0.0`
- Global ID: `LNK-BIZ-9483042A457C4D36`
- Sistema fuente: Supabase `lpirjwifzosdzgdncsbt`
- Ventas: `ventas-hotelexperience.vercel.app`
- Operación: `hotel-experience.vercel.app`
- Contrapartes proyectadas: Hotel Casa Solcor, Hotel Fauna, Hotel Habitas y LAMA Travelers.
- Catálogo/operación permanecen en HOTEL EXPERIENCE.
- LINK WORLD no almacena una segunda reserva ni PII sensible.
- Estado esperado mientras no exista transporte de eventos: `incomplete` con `event_bridge` faltante.

## Patrón de crecimiento

```text
LINK WORLD
   │
   ├── Casa Operativa A
   │     ├── Aparato de venta 1
   │     ├── Aparato de venta 2
   │     ├── Contrapartes
   │     ├── Productos/capacidades
   │     └── Sistema transaccional propio
   │
   ├── Casa Operativa B
   │     └── mismo contrato, distinta configuración
   │
   └── nuevas células
```

La escala ocurre agregando **instancias y bindings**, no reconstruyendo la arquitectura.
