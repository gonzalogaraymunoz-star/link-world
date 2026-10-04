# LINK GENESIS · Arquitectura v2

## Reforma

GENESIS v1 trataba a LINK como ingeniería clonable.

GENESIS v2 trata a LINK como **organismo desarrollable**.

El cambio central es:

```text
ANTES
ingeniería → mapa → Business Pack → clon LINKDOT

AHORA
ADN canónico
   ↓
identidad / cigoto
   ↓
mapa corporal
   ↓
innervación
   ↓
regulación
   ↓
primer aliento
   ↓
certificación
   ↓
organismo LINK ready
```

## ADN canónico

La constitución nerviosa no vive dentro de GENESIS.

GENESIS lee:
`memory_namespaces / system / link-nervous-system`.

Eso evita quedar amarrado a una versión antigua.

Al momento de esta reforma, el organismo vigente está en **Sistema Nervioso v1.6** e incorpora Respiración LINK.

## Arquitectura nerviosa

```text
MUNDO / FUENTE REAL
        │
        ▼
ARTEFACTO / RECEPTOR
        │
        │ aferente directa
        ▼
     PAR LINK
        │
        ▼
      TÁLAMO
        │
        ▼
   HOMEOSTASIS
        │
        ▼
    HIPOTÁLAMO
     ╱       ╲
SIMPÁTICO  PARASIMPÁTICO
        │
        ▼
 HIPOCAMPO ↔ CORTEX
   (si hace falta)
        │
        ▼
     DIRECTOR
   genera opciones
        │
        ▼
 NÚCLEOS BASALES
selecciona / inhibe
        │
        ▼
     PAR LINK
      eferente
        │
        ▼
      SUBDOT
        │
        ▼
     ARTEFACTO
        │
        ▼
     EVIDENCIA
        │
        ▼
     CEREBELO
        │
        ▼
   RESPIRACIÓN LINK
        │
        └── feedback → memoria / regulación / conversación
```

GENESIS desarrolla las conexiones a este organismo; no reemplaza los órganos centrales.

## Doble conexión periférica

Cada Par LINK representa un circuito especializado.

Aferente:
`artefacto → centro`.

Eferente:
`centro → conducta seleccionada → SubDOT → artefacto`.

La asimetría es deliberada: sentir puede ser directo; actuar exige gobierno.

## Homeostasis y sistema autónomo

El organismo compara desviación contra baseline/SLA/capacidad antes de escalar.

El Hipotálamo determina el tono:
- balanced;
- sympathetic;
- parasympathetic.

El sistema autónomo resuelve lo rutinario autorizado.
El sistema voluntario conserva decisión.
El reflejo solo existe para acciones preautorizadas, acotadas y reversibles.

Ninguna condición fisiológica quita una aprobación humana.

## Respiración

GENESIS v2 conecta `link_architecture:breathing_system_v1`.

Durante el desarrollo, una instancia hace una única primera respiración:

```text
INHALA
señales / deltas / cola / bloqueos

INTERCAMBIA
Tálamo + Homeostasis + Hipotálamo

EXHALA
selecciones / señales eferentes / comandos

RECUPERA
evidencia + Cerebelo + nuevo estado regulatorio
```

No se usa para decidir ni ejecutar por sí sola.

## Desarrollo persistente

### Genome / Blueprint
`link_organism_core_v2`

### Business Pack
Contexto del negocio + mapa corporal + regulación + versión nerviosa.

### Nervous Bindings
`link_genesis_nervous_bindings`

Registra qué órgano/circuito canónico está conectado a una instancia.

### Development Events
`link_genesis_development_events`

Conserva las transiciones del desarrollo.

### Certifications
`link_genesis_certifications`

Prueba la estructura sin hacer acciones externas.

## Certificación

Un organismo aprobado debe tener:
- versión nerviosa vigente;
- 17 bindings base;
- contratos resolubles;
- Business Pack v2;
- regulación;
- primera respiración;
- cobertura completa de Pares LINK para sus artefactos.

No se inventan artefactos para aprobar una instancia.

## Estado después de la reforma

- CARACOL: nervioso v1.6, 2/2 artefactos pareados, certificación estructural completa.
- HOTEL EXPERIENCE: nervioso v1.6, 7/7 artefactos pareados, certificación estructural completa.
- KIZU PRO: núcleo/regulación/respiración presentes; sin periferia propia registrada todavía.
- LAMA Travelers: núcleo/regulación/respiración presentes; sin periferia propia registrada todavía.
- Transfer Hotel Atacama: núcleo/regulación/respiración presentes; sin periferia propia registrada todavía.

Que una instancia esté parcial no es error: indica exactamente qué tejido periférico falta.

## Endocrino

La capa hormonal/endocrina sigue **conceptual_not_runtime**.

GENESIS reserva su lugar como extensión futura, pero no la materializa hasta que el Sistema Nervioso publique un contrato canónico verificado.

## Principio final

**GENESIS no copia LINK. GENESIS hace que una nueva parte de LINK nazca conectada al organismo real.**
