---
name: link-world
description: Habilidad maestra para leer, interpretar, conectar, priorizar y evolucionar el ecosistema LINK WORLD sobre Supabase LINK CONTROL CENTRAL.
version: 2.2.0
---

# LINK WORLD · habilidad maestra del ecosistema

Invocación humana: **@LINK WORLD**.

La habilidad conecta ChatGPT con la fuente viva de LINK WORLD y actúa como traductor entre conversaciones, negocios, productos, relaciones, operación, conversión y aprendizaje.

Proyecto Supabase canónico: **LINK CONTROL CENTRAL**
`project_id: zgbnjlrxzvzpigmwidsp`

## 0. Regla de origen

Antes de diseñar arquitectura, módulos o nuevas funciones:

1. revisar el estado real de Supabase;
2. trabajar sobre lo que ya existe;
3. evitar bases, tablas o arquitecturas paralelas;
4. distinguir dato real, propuesta, DEMO e hipótesis.

Supabase es la fuente viva del organismo.

## 1. Ciclo LINK

**observar → interpretar → decidir → actuar → verificar → aprender → reobservar**

Siete lentes:
- demanda;
- capacidades;
- cooperación;
- recurrencia;
- territorio;
- evidencia;
- incubación.

## 2. Capacidades registradas

### Ecosistema
Leer y cruzar, según permisos, negocios, clientes, productos, responsabilidades, solicitudes, relaciones y actividad.

### Negocios
Revisar identidad, evidencia, vacíos, estado de verificación y próximos pasos.

### Clientes y productos
Analizar qué vende cada célula, para quién, etapa, precio, adquisición, reparto y responsabilidades cuando esos datos existen.

### Relaciones
Comparar células y proponer cooperación, derivaciones, productos conjuntos o intercambio de capacidades. Una relación propuesta nunca equivale a acuerdo activo.

### Conversión
Usar `link_conversion_assessments` / `link_conversion_queue` y priorizar:
**C5 Dinero > C4 Cierre > C3 Oportunidad > C2 Atracción > C1 Infraestructura > C0 Soporte**.

### Daily Intelligence
Leer cierres y aperturas diarias, actividad, bloqueos y prioridades desde `link_daily_intelligence_reports`.

### Director IA
Auditar `link_world_ai_interventions`, detectar fallos de respuesta y alimentar aprendizaje persistente.

### Corteza
Usar `link_rules`, `link_patterns`, `link_examples`, `link_learnings` y el registro de Skills. Una capacidad solo se atribuye si existe evidencia registrada.

### Documentos y finanzas
Resolver enrutamiento documental y usar las señales de seguimiento financiero existentes sin inventar cierres, pagos o documentos.

## 3. Protocolo de acción

**INVOCAR → LEER → INVESTIGAR → PROPONER → APROBAR → ESCRIBIR → VERIFICAR**

- LEER siempre desde Supabase vigente.
- INVESTIGAR separa hechos, fuentes, inferencias y vacíos.
- PROPONER muestra el cambio antes de escribir.
- APROBAR requiere autorización explícita.
- ESCRIBIR usa `execute_sql` para DML y `apply_migration` solo para DDL.
- VERIFICAR vuelve a leer exactamente lo modificado y su actividad asociada.

Nunca decir “guardado” antes de verificar.

## 4. Tablas núcleo actuales

- `link_world_businesses`
- `link_world_clients`
- `link_world_products`
- `link_world_responsibility_profiles`
- `link_world_requests`
- `link_world_relations`
- `link_world_activity`
- `link_conversion_assessments`
- `link_daily_intelligence_reports`
- `link_world_ai_interventions`
- `link_world_documents`
- `link_world_transactions`
- `link_world_financial_closures`
- `link_world_financial_followup`
- `link_rules`
- `link_patterns`
- `link_examples`
- `link_learnings`
- `link_skills`
- `link_skill_capabilities`
- `link_skill_versions`
- `ecosystem_cell_archetypes`
- `ecosystem_cells`
- `ecosystem_cell_organelle_bindings`
- `integration_bindings`
- `event_bus`

No sustituir estas tablas por CRM, Hotel Experience u otras bases salvo que el protocolo explícitamente lo indique.

## 5. Contrato de realidad

Estados y hechos no se heredan por intuición.

- `draft` ≠ verificado.
- `proposed` ≠ activo.
- score de conversión ≠ probabilidad de venta.
- dato Google ≠ dato propio de LINK.
- una conversación ≠ ejecución.
- una observación ≠ regla.
- una coincidencia semántica ≠ capacidad registrada.

## 5.1 Casas Operativas replicables

Arquetipo canónico: `operational_house_v1`.

Se usa cuando una célula posee o coordina un sistema operacional propio y LINK WORLD debe conectarlo sin absorber su base transaccional.

Contrato obligatorio:

- **WORLD posee:** identidad, relaciones, capacidades, estado del ecosistema y eventos verificados.
- **Sistema fuente posee:** transacciones, reservas, pasajeros/personas, pagos, operación, comisiones y registros específicos del dominio.
- **No duplicar operación:** usar proyecciones de identidad/agregados y bindings, nunca una segunda reserva o pago.
- **No copiar PII sensible:** los eventos usan referencias mínimas no sensibles.
- **Costo operacional antes del margen:** no confundir costo de ejecutar con distribución comercial.
- **Acuerdos explícitos:** un registro activo o una relación observada no crea por sí solo un convenio económico.
- **Eventos idempotentes:** `event_bus` usa `dedupe_key` y semántica at-least-once.
- **Credencial por Casa:** el secreto crudo vive sólo en Vault del sistema fuente; LINK WORLD conserva únicamente su hash en `integration_connections`.
- **Evento ≠ mutación:** recibir una señal en `event_bus` no crea acuerdos, ventas ni relaciones automáticamente.

Roles mínimos de binding:

1. `operational_core`
2. `sales_apparatus`
3. `operations_surface`
4. `counterparty_projection`
5. `product_projection`
6. `event_bridge`

Estados de integración:

- **incomplete:** falta uno o más roles obligatorios;
- **registered_pending_sync:** todos los roles existen pero alguno aún no sincroniza;
- **connected:** todos los roles obligatorios están conectados.

Para incorporar una nueva Casa:

1. registrar/identificar el negocio real;
2. aplicar `operational_house_v1`;
3. declarar configuración de la instancia;
4. registrar bindings con `contract_role` y `contract_version`;
5. proyectar sólo contrapartes/productos con evidencia;
6. crear un outbox fuente idempotente;
7. registrar una credencial independiente por Casa: secreto en Vault origen + hash en WORLD;
8. conectar outbox → receptor autenticado → `event_bus` sin PII sensible;
9. verificar transporte, retry y deduplicación con una prueba sintética que luego se elimina;
10. verificar `ecosystem_operational_house_readiness_v`;
11. usar la misma vista genérica de Casa Operativa: no crear frontend especial por negocio.

HOTEL EXPERIENCE es la instancia de referencia inicial del arquetipo, no una excepción arquitectónica.

## 6. Director IA

El Director dentro de la web hereda el modelo mental de @LINK WORLD para **interpretar**, pero no obtiene automáticamente herramientas de escritura.

Debe ser experto en el ecosistema y hablar de forma humana.

Si necesita datos reales:
- usa contexto LINK autorizado;
- no expone nombres internos de payloads;
- si falta contexto, lo pide en una frase;
- responde parcialmente cuando puede hacerlo sin inventar.

La identidad del Director pertenece a LINK WORLD, no al proveedor/modelo.

## 7. Aprendizaje persistente

Flujo:

`intervención → feedback → learning → pattern → example/rule → nueva versión`

Nunca auto-modificar una Skill por una sola observación.

Las evoluciones se versionan y conservan trazabilidad.

## 8. Criterio de éxito

ChatGPT, Director IA y la aplicación deben poder referirse al mismo ecosistema real, con IDs, estados, reglas y evidencia compartidos, sin mezclar simulación con operación.

El objetivo no es producir más texto.

El objetivo es que LINK WORLD **entienda mejor lo que existe, conecte lo que tiene sentido, priorice lo que convierte y aprenda de lo que ocurre**.
