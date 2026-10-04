# LINK GENESIS · Arquitectura v1

## Propósito

LINK GENESIS es el complemento transversal que mantiene el **ADN de ingeniería** del ecosistema LINK.

Su función no es crear una copia monolítica del sistema. Mantiene un mapa verificable de cómo se conectan fuentes, repositorios, aplicaciones, base de datos, Skills, contratos, servicios y negocios, y usa ese mapa para generar configuración reusable.

## Modelo

```text
MUNDO
  ↓
Canal / Evento / Conversación
  ↓
LINKDOT CORE
  ↓
TÁLAMO ── prepara contexto
  ↓
HIPOCAMPO ── recuerda y relaciona
  ↕
CORTEX ── recupera conocimiento
  ↓
DIRECTOR ── decide y coordina
  ↓
LINKDOT / LINKSUBDOT ── ejecuta
  ↓
CEREBELO ── compara esperado vs real
  ↓
HIPOCAMPO ── consolida aprendizaje

           LINK GENESIS
        ↙       ↓        ↘
   absorbe    mapea     clona
      ↓         ↓         ↓
  ingeniería  ADN      Business Pack
```

GENESIS rodea el organismo; no reemplaza el sistema nervioso.

## Capas persistentes

### Sources
Dónde vive la verdad: Supabase, GitHub, Vercel, Drive, aplicaciones, contratos y fuentes registradas.

### Components
Qué piezas existen: repos, apps, tablas, funciones, Edge Functions, Skills, workspaces, servicios, contratos y blueprints.

### Relations
Cómo se conectan las piezas y con qué nivel de evidencia.

### Blueprints
ADN reusable. Define constitución y capacidades, no datos de negocio.

### Business Packs
Contexto aislado de un negocio: identidad, canales, productos, políticas, herramientas, fuentes y rutas de conocimiento.

### Instances
Manifestación de un blueprint + Business Pack. Es una configuración de LINKDOT, no una base operacional duplicada.

## Contrato de aislamiento

Una instancia de Caracol puede heredar el mismo CORE que Lama Travelers, Hotel Experience o Taxi Hotel, pero el Tálamo debe cargar únicamente el Business Pack pertinente.

El negocio se determina antes de recuperar información de dominio.

Si el negocio no puede resolverse con suficiente confianza, el DOT no mezcla contextos para completar la respuesta.

## Contrato de absorción

```json
{
  "source_key": "github:owner/repo",
  "business_global_id": "opcional",
  "mode": "delta",
  "components": [
    {
      "component_key": "repo:owner/repo",
      "component_type": "repository",
      "name": "repo",
      "version_ref": "main",
      "truth_owner": "source",
      "clone_policy": "reference",
      "capabilities": [],
      "dependencies": [],
      "interfaces": {}
    }
  ],
  "relations": [
    {
      "from": "repo:owner/repo",
      "to": "app:example",
      "type": "deploys_to",
      "status": "observed",
      "confidence": 0.95
    }
  ]
}
```

GENESIS registra el run, normaliza componentes, registra relaciones y sincroniza el conocimiento recuperable con Cortex.

## Contrato de clonación

```text
LINKDOT CORE
  + Business Pack
  + Source bindings
  + Tool bindings
  + Permissions
  + Overrides mínimos
  = LINKDOT INSTANCE
```

Nunca clonar datos transaccionales.

## Pulso operativo

La arquitectura v1 incluye:

- `link-genesis`: Edge Function JWT que expone el contrato operativo de GENESIS;
- `link_genesis_refresh_local_inventory_v1()`: reobservación de ingeniería local;
- `link-genesis-local-inventory-daily`: cron persistente;
- Cortex como índice recuperable de fuentes, componentes, blueprints, Business Packs e instancias.

Esto separa dos ritmos:

1. **pulso local**: Supabase se reobserva automáticamente;
2. **eventos externos**: GitHub/Vercel/otras fuentes entregan deltas mediante el contrato de absorción cuando son observados.

## Drift

GENESIS debe poder identificar, entre otras cosas:

- versión en Supabase distinta de la documentación de GitHub;
- repositorio sin aplicación conocida;
- aplicación sin repo conocido;
- Edge Function sin contrato;
- Skill activa sin versión documentada;
- componente retirado todavía referenciado;
- Business Pack desactualizado respecto a sus fuentes;
- instancia con blueprint anterior.

El drift es una señal para Director, no permiso automático para reescribir.

## Estado inicial 2026-10-04

La primera absorción de GENESIS registró la fuente canónica de Supabase, inventario GitHub/Vercel disponible, esquema público, rutinas, Edge Functions, Skills y Workspaces observables.

Los negocios verificados reciben un Business Pack y una instancia `ready`; la activación operacional no se deriva automáticamente de la clonación.

## Principio

**LINK no se entrena copiando todo dentro de un prompt. Aprende a encontrar su ingeniería, recuperar el contexto correcto, cargar el negocio correspondiente y actuar a través de contratos compartidos.**
