# LINK WORLD · Director IA conversacional v6

El Director es la sala de inteligencia de LINK WORLD.

## Conectar una IA

1. Abre **Director IA**.
2. Pulsa **Conectar IA**.
3. Elige **Proveedor**.
4. Escribe **Modelo**.
5. Pega **API**.
6. Pulsa **Conectar**.
7. Conversa.

No hay ningún otro paso obligatorio.

## Proveedores disponibles

- OpenRouter
- Groq
- NVIDIA NIM

El campo **Modelo** siempre usa el identificador exacto que entrega el proveedor.

## Estado

- **Configuración incompleta:** falta modelo o API.
- **Probando proveedor…:** LINK WORLD está validando la conexión.
- **Conectado:** proveedor, modelo y API respondieron.
- **Consulta fallida:** se muestra el error real del proveedor.

## Sin fallback

LINK WORLD no cambia automáticamente de proveedor ni de modelo.

## Contexto LINK

Marca **Incluir datos de LINK** únicamente cuando quieras compartir contexto autorizado de LINK WORLD con el modelo seleccionado.

Supabase sigue siendo la fuente de verdad.

## Privacidad

La API:
- no se guarda en localStorage;
- no se guarda en Supabase;
- no se guarda en GitHub;
- no aparece en el archivo de intervenciones;
- no forma parte del prompt del Director.

El proveedor y el modelo sí pueden recordarse localmente sin credenciales.

## Archivo IA

Las intervenciones del Director se archivan en Supabase para auditoría y aprendizaje.

## Documentación técnica

Ver `docs/LINK_DIRECTOR_PROVIDER_PROTOCOL.md`.


## Director de orquestación · contrato v1

LINK Director no es un ejecutor generalista. Es el **orquestador transversal** del ecosistema.

### Qué dirige

Director mantiene una visión común de:

- contratos vigentes;
- conversaciones internas persistentes;
- misiones activas;
- asignaciones a LINKDOTs y Directores de etapa;
- evidencia faltante;
- bloqueos y escalaciones;
- handoffs entre etapas;
- aprendizaje que debe volver a LINK Hipocampo.

Superficies canónicas en Supabase:

- `link_director_contracts_v` — contratos persistentes y reglas vigentes.
- `link_director_conversations_v` — sesiones y conversaciones internas resumidas.
- misión persistente `MSN-LINK-DIRECTOR-ORCHESTRATION-V1`.
- memoria operativa `memory_namespaces.scope_key = link-director`.

### Relación con el sistema nervioso

**Cortex encuentra → Hipocampo recuerda y contextualiza → Director decide y dirige → LINKDOTs ejecutan → Hipocampo consolida aprendizaje.**

Director no consulta un resultado de Cortex como verdad directa. Cuando necesita antecedentes, decisiones previas o aprendizaje, consulta a LINK Hipocampo.

### Autonomía bounded-auto

Director puede avanzar sin pedir aprobación humana para acciones **internas y reversibles**:

- crear una misión;
- asignar una misión a un agente registrado;
- pedir evidencia verificable;
- escalar un bloqueo o restricción.

Estas acciones quedan registradas en `command_bus` y `event_bus`.

Mantienen aprobación humana:

- acciones externas;
- acciones financieras;
- operaciones irreversibles;
- escritura/reemplazo de CANON;
- verificaciones/cierres sensibles de etapa.

### Ciclo de dirección

`observar → leer contratos → recuperar memoria → interpretar → crear/reusar misión → asignar → pedir evidencia → escalar → verificar progreso → aprender → reobservar`

Una conversación **no equivale a ejecución**. Director convierte una conversación en misión únicamente cuando existe una necesidad operacional identificable.

Una misión **no autoriza a Director a absorber trabajo de etapa**. El trabajo de Marketing, Ventas, Cierre, Onboarding, Entrega y Postventa sigue perteneciendo a sus Directores/LINKDOTs.

### Regla de avance

Ante un bloqueo, Director no debe quedarse solo describiendo el problema. Debe elegir el siguiente movimiento interno permitido:

1. recuperar contexto desde Hipocampo;
2. localizar contrato vigente;
3. identificar responsable;
4. crear/reusar misión;
5. asignar;
6. pedir evidencia faltante;
7. escalar si existe dependencia;
8. volver a revisar el resultado.

Solo debe detenerse cuando el siguiente movimiento cruce el límite de aprobación humana.
