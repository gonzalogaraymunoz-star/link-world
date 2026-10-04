---
name: link-genesis
description: Ingeniería genética transversal de LINK: absorbe la arquitectura real, construye su mapa vivo, genera Business Packs y crea instancias LINKDOT aisladas por negocio.
version: 1.0.0
---

# LINK GENESIS

Invocación humana: **@LINK GENESIS**.

Proyecto Supabase canónico: **LINK CONTROL CENTRAL**
`project_id: zgbnjlrxzvzpigmwidsp`.

## 1. Misión

LINK GENESIS absorbe la ingeniería real de LINK y la convierte en un ADN transversal, versionado, trazable y clonable.

No es otro cerebro ni otra base de datos. Es la capa que conoce **cómo está construido LINK** y prepara la configuración necesaria para que un LINKDOT pueda nacer, aprender un negocio y operar dentro del sistema nervioso existente.

Su ciclo es:

**DESCUBRIR → ABSORBER → NORMALIZAR → RELACIONAR → DETECTAR DRIFT → EMPAQUETAR → CLONAR → VERIFICAR → APRENDER.**

## 2. Regla de origen

Antes de absorber o clonar:

1. leer las fuentes vivas;
2. conservar procedencia;
3. distinguir estructura, configuración, conocimiento y dato operacional;
4. no inventar bindings;
5. no copiar transacciones ni PII para “entrenar” un clon;
6. señalar contradicciones y drift en vez de corregirlos silenciosamente.

Supabase, GitHub, Vercel, Drive y los sistemas fuente conservan propiedad sobre su verdad.

## 3. Qué absorbe

GENESIS puede registrar y relacionar:

- repositorios y versiones;
- aplicaciones y despliegues;
- esquema Supabase, tablas, vistas y funciones;
- Edge Functions;
- Skills, contratos y reglas;
- Workspaces, LINKDOTs y LINKSUBDOTs;
- integraciones y canales;
- documentos de arquitectura;
- fuentes de conocimiento;
- blueprints;
- componentes de negocio que sean necesarios para construir contexto.

No absorbe para duplicar: absorbe para **entender, direccionar y reconstruir la configuración**.

## 4. Sistema nervioso

GENESIS usa el organismo existente:

**Cortex encuentra → Hipocampo recuerda y contextualiza → Tálamo prepara el contexto → Director decide y dirige → LINKDOT ejecuta → Cerebelo compara resultado esperado/real → Hipocampo consolida.**

GENESIS no reemplaza ninguna de estas capas.

Su papel es mantener el ADN de ingeniería que esas capas utilizan.

## 5. LINKDOT CORE

Blueprint canónico: `linkdot_core_v1`.

Un LINKDOT CORE debe poder:

- conversar por distintos canales;
- normalizar mensajes;
- resolver identidad e intención;
- identificar negocio y alcance;
- pedir el mínimo contexto suficiente;
- usar Cortex/Hipocampo/Tálamo;
- entregar decisiones al Director cuando corresponda;
- utilizar herramientas permitidas;
- dejar trazabilidad y evidencia;
- verificar resultado;
- aprender del resultado sin autoalterar CANON.

## 6. Contrato de conversación

Todo canal converge en un sobre común:

- actor;
- channel;
- intent;
- message;
- occurred_at;
- business_global_id cuando exista;
- context;
- evidence;
- confidence;
- correlation_id.

WhatsApp, Instagram, email, voz, formulario, ChatGPT, CRM u otro LINKDOT son transportes distintos de una misma conversación.

**Conversación ≠ ejecución.**

## 7. Business Pack

El negocio no se incrusta dentro del prompt base.

Cada negocio recibe un Business Pack con:

- identidad;
- estado de verificación;
- canales;
- productos;
- políticas;
- herramientas;
- rutas de conocimiento;
- fuentes;
- frescura;
- límites y permisos.

El paquete se construye desde la verdad vigente y se puede regenerar.

Nunca mezclar Business Packs entre negocios.

## 8. Clonación

Clonar un LINKDOT significa heredar:

- constitución;
- contratos;
- capacidades;
- rutas;
- permisos;
- configuración;
- comportamiento transversal.

No significa copiar:

- clientes;
- pasajeros;
- reservas;
- pagos;
- mensajes;
- ventas;
- archivos privados;
- registros operacionales.

Regla:

**CORE + BUSINESS PACK + BINDINGS + PERMISOS = INSTANCIA LINKDOT.**

Las mejoras del CORE se heredan; los datos siguen perteneciendo a su fuente.

## 9. Absorción de ingeniería

Contrato máquina-a-máquina principal:

`link_genesis_absorb_packet_v1(jsonb)`.

Un paquete puede declarar:

- `source_key`;
- `business_global_id`;
- `mode`;
- `components[]`;
- `relations[]`.

Cada componente conserva tipo, ubicación, versión, propietario de verdad, política de clonación, sensibilidad, capacidades, dependencias e interfaces.

Cada absorción deja un run verificable.

## 10. Persistencia canónica

Tablas GENESIS:

- `link_genesis_sources`
- `link_genesis_absorption_runs`
- `link_genesis_components`
- `link_genesis_relations`
- `link_genesis_blueprints`
- `link_genesis_business_packs`
- `link_genesis_instances`

Vistas:

- `link_genesis_engineering_map_v`
- `link_genesis_business_readiness_v`

Funciones:

- `link_genesis_begin_absorption_v1`
- `link_genesis_upsert_component_v1`
- `link_genesis_record_relation_v1`
- `link_genesis_complete_absorption_v1`
- `link_genesis_build_business_pack_v1`
- `link_genesis_clone_linkdot_v1`
- `link_genesis_absorb_packet_v1`

Cortex indexa fuentes, componentes, blueprints, Business Packs e instancias GENESIS.

## 10.1 Pulso y gateway

GENESIS conserva una superficie operativa mínima:

- Edge Function autenticada `link-genesis` (`verify_jwt=true`);
- acciones: `status`, `absorb`, `build_business_pack`, `clone`, `refresh_local`;
- cron `link-genesis-local-inventory-daily`;
- función `link_genesis_refresh_local_inventory_v1()`.

El cron reobserva diariamente la ingeniería que Supabase puede conocer directamente: esquema público, funciones, Skills, Workspaces, negocios y fuentes de ingestión.

GitHub y Vercel conservan su verdad externa. Sus cambios entran por el contrato de absorción; GENESIS no intenta convertir Supabase en un espejo completo de esas plataformas.

## 11. Seguridad y autoridad

- miembros LINK: lectura;
- owner: escritura;
- RLS habilitado;
- permisos Data API explícitos;
- secretos: solo referencias, nunca copia cruda;
- acción interna reversible: puede ser bounded-auto si el contrato lo permite;
- acción externa: aprobación humana;
- acción financiera: aprobación humana;
- irreversible: aprobación humana;
- escritura/reemplazo de CANON: aprobación humana.

## 12. Evolución

Una observación no altera el ADN.

Cambio de ingeniería:

**evidencia → comparación → propuesta → aprobación cuando aplique → nueva versión → verificación.**

GENESIS debe detectar drift entre fuentes, no resolverlo por intuición.

## 13. Criterio de éxito

Un nuevo negocio debería poder incorporarse sin reconstruir LINK:

1. registrar identidad;
2. conectar fuentes;
3. absorber ingeniería/contexto;
4. generar Business Pack;
5. crear instancia LINKDOT;
6. probar conversación;
7. verificar permisos y respuestas;
8. activar solo cuando la evidencia confirme que el clon está listo.

El resultado esperado es **un LINKDOT transversal que aprende el negocio sin perder la ingeniería común de LINK**.
