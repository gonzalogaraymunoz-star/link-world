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

Transporte: **source outbox → authenticated Edge Function → `event_bus`**.

Autenticación: token independiente por Casa; secreto crudo en Vault del origen y sólo hash SHA-256 en LINK WORLD.

Semántica: **at-least-once + dedupe_key**. Recibir un evento no autoriza por sí solo a crear convenios, ventas o relaciones en WORLD.

Eventos canónicos iniciales:

- `counterparty.connected`
- `product.available`
- `sale.confirmed`
- `operation.completed`
- `commission.accrued`
- `feedback.closed`

Los payloads deben llevar referencias mínimas. No incluir documentos, datos médicos, datos de pago completos ni otra PII sensible.

## Projection Engine v1

El bridge entrega evidencia a `event_bus`. El **Projection Engine** transforma esa evidencia en un estado de lectura persistente sin modificar la realidad comercial.

Capas:

```text
Sistema fuente
   ↓
outbox
   ↓
event_bus                 ← evidencia / historial de señales
   ↓
projection ledger         ← consumo idempotente y reintentable
   ↓
projection state          ← lectura derivada y reconstruible
   ↓
status view               ← salud estructural / transporte / proyección
```

Reglas:

- `event_bus` sigue siendo evidencia; no es CRM ni libro de ventas.
- `operational_house_projection_state` es derivado y puede reconstruirse.
- El ledger vive en schema `private`.
- El consumidor corre cada minuto y no bloquea el ingreso de eventos.
- Una proyección jamás crea automáticamente una venta, convenio, cliente o relación.
- No sumar dinero desde eventos mientras el contrato no garantice correcciones/ajustes posteriores.
- Un baseline agregado verificado puede dar contexto inicial sin copiar transacciones ni PII.
- `baseline_metrics` y `event_counts` son dimensiones distintas: nunca se presentan como una sola serie histórica.
- Los logs del cron del engine se retienen 14 días para evitar crecimiento indefinido.

### Estado canónico

La vista canónica es `ecosystem_operational_house_status_v`.

Separa cuatro preguntas:

1. **structure_status** — ¿están registrados todos los roles?
2. **transport_status** — ¿el bridge real está conectado?
3. **projection_status** — ¿el Projection Engine está corriendo sano?
4. **overall_status** — lectura global de salud.

`binding_sync_readiness` se conserva como diagnóstico técnico de bindings, pero no obliga a sincronizar superficies o catálogos que deliberadamente deben permanecer en su sistema fuente.

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

## Instalador Operational House v1

Desde la migración `20260925133026_operational_house_installer_v1.sql`, una nueva Casa se prepara con un flujo declarativo y verificable.

Funciones privadas (solo `service_role`):

- `private.operational_house_installation_plan_v1(global_id)`: inspecciona una célula y devuelve arquetipo, conexión, roles requeridos, roles registrados y vacíos.
- `private.install_operational_house_v1(...)`: aplica el arquetipo, registra/rota la conexión del bridge usando **solo hash SHA-256**, inicializa la proyección y devuelve el siguiente estado.
- `private.register_operational_house_binding_v1(...)`: registra cada binding real y valida que el `contract_role` pertenezca al contrato del arquetipo.

Reglas del instalador:

1. Nunca recibe ni persiste el secreto crudo del bridge; recibe únicamente su hash SHA-256.
2. Nunca crea bindings ficticios para completar un checklist.
3. Un binding queda `connected` sólo cuando existe evidencia real de esa conexión.
4. Los tipos de evento permitidos deben ser subconjunto del contrato de `operational_house_v1`.
5. Inicializar la Casa no copia transacciones, reservas, pagos ni PII.
6. El estado inicial de proyección es `forward_only`; un baseline sólo se agrega después de verificación explícita.
7. El instalador es idempotente: puede volver a ejecutarse para actualizar configuración/credencial sin duplicar la Casa.

### Creación de una nueva Casa

1. Consultar Supabase vigente y confirmar que el negocio/célula existe.
2. Ejecutar `operational_house_installation_plan_v1` para leer el estado inicial.
3. Generar una credencial independiente en el sistema fuente; guardar el secreto crudo sólo en Vault del origen.
4. Calcular fuera de LINK WORLD su hash SHA-256 y pasar únicamente el hash a `install_operational_house_v1`.
5. Registrar los bindings reales con `register_operational_house_binding_v1`.
6. Implementar el outbox del sistema fuente y su productor de eventos.
7. Conectar outbox → `ingest-operational-house-event` → `event_bus`.
8. Verificar retry + deduplicación con evidencia controlada.
9. Proyectar contrapartes/capacidades sólo cuando estén verificadas.
10. Crear baseline agregado sólo si puede validarse sin PII ni copia transaccional.
11. Revisar `ecosystem_operational_house_status_v`.
12. Usar la vista genérica de Casa Operativa; no crear frontend especial por negocio.

El resultado buscado es:

```text
negocio real
  ↓
instalador
  ↓
arquetipo + conexión + proyección
  ↓
bindings reales declarados
  ↓
outbox fuente
  ↓
event_bus
  ↓
Projection Engine
  ↓
LINK WORLD observa y aprende
```

## HOTEL EXPERIENCE · instancia de referencia

- Arquetipo: `operational_house_v1@1.0.0`
- Global ID: `LNK-BIZ-9483042A457C4D36`
- Sistema fuente: Supabase `lpirjwifzosdzgdncsbt`
- Ventas: `ventas-hotelexperience.vercel.app`
- Operación: `hotel-experience.vercel.app`
- Contrapartes proyectadas: Hotel Casa Solcor, Hotel Fauna, Hotel Habitas y LAMA Travelers.
- Catálogo/operación permanecen en HOTEL EXPERIENCE.
- LINK WORLD no almacena una segunda reserva ni PII sensible.
- Outbox fuente: `public.link_world_event_outbox` en HOTEL EXPERIENCE.
- Eventos fuente se generan desde cambios futuros en ventas confirmadas, cierres operacionales, comisiones devengadas, contrapartes activadas, productos activados y feedback respondido.
- El transporte `outbox → Edge Function → event_bus` está conectado y fue verificado end-to-end con reintento idempotente; el evento sintético de prueba fue eliminado tras la comprobación.
- El secreto crudo vive sólo en Vault de HOTEL EXPERIENCE. LINK WORLD almacena únicamente su hash SHA-256 en `integration_connections`.
- No hay backfill automático de eventos históricos.
- `event_bridge` está `connected`.
- Projection Engine v1 está activo y saludable.
- Baseline agregado verificado: 25 de septiembre de 2026; sin PII y separado de los eventos futuros.
- Estado canónico actual: `structure=complete`, `transport=connected`, `projection=healthy`, `overall=ready`.
- El diagnóstico legado de bindings puede seguir mostrando `registered_pending_sync` porque las superficies y proyecciones controladas no necesitan convertirse en sincronizaciones automáticas.

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
