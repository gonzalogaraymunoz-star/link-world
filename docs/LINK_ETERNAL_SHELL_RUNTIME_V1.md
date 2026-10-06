# LINK WORLD · Concha Eterna runtime v1

## Decisión arquitectónica

LINK WORLD deja de contener un Director IA operativo. La inteligencia de dirección vive fuera de la app, en ChatGPT, donde el usuario trabaja en **Modo Dios**.

LINK WORLD queda como sistema de realidad, navegación y evidencia:

- muestra negocios;
- contiene modelos;
- conecta artefactos;
- desarrolla cada modelo por seis áreas;
- captura prospectos reales;
- registra evidencia;
- genera paquetes persistentes para ChatGPT.

## Seis áreas canónicas

Los keys internos existentes se mantienen por compatibilidad, pero sus nombres visibles son:

1. MAR
2. Ventas
3. Cierre
4. Boarding
5. Opera
6. Postventa

Cada modelo tiene un estado persistente para las seis etapas en `link_world_model_stage_state`.

## Concha de un modelo

```text
                    MODO DIOS / CHATGPT
                           ↑
      MAR → VENTAS → CIERRE → BOARDING → OPERA → POSTVENTA
       ↑        ↑        ↑         ↑         ↑         ↑
       └────────┴────────┴─────────┴─────────┴─────────┘
                    NEGOCIO PROMOTOR
                           ↑
                       ARTEFACTOS
                           ↑
                         MODELO
                           ↑
                         DOLOR
```

La app no debe sustituir el razonamiento. Debe preparar la realidad para que el razonamiento tenga contexto y pueda devolver cambios persistentes.

## Evidencia y Territorio

Cuando una etapa necesita validar un modelo:

1. Modelos → abrir modelo.
2. MAR → Buscar negocio.
3. Territorio → Google Places.
4. Elegir negocio real.
5. Guardar en Prospect Vault.
6. Crear vínculo `link_world_model_prospects`.
7. Preparar prompt persistente para ChatGPT.
8. Trabajar desde ChatGPT.
9. Volver a registrar evidencia y mover etapa.

## Modo Dios / Outbox

`link_world_chatgpt_outbox` guarda solicitudes que LINK WORLD necesita que ChatGPT resuelva.

No es una IA interna. Es una bandeja persistente de trabajo.

La vista `link_world_chatgpt_outbox_pending_v` permite recuperar desde ChatGPT los pendientes con modelo, negocio, etapa y prompt.

Los estados son:

`queued → copied → working → resolved`

## Artefactos

`link_world_model_stage_artifacts` conecta una etapa del modelo con el artefacto que realmente permite ejecutarla.

Un botón de desarrollo debe llevar a:

- el negocio promotor;
- el artefacto responsable;
- el prospecto real;
- o Modo Dios cuando falta resolver/construir algo.

No se debe inventar un artefacto si el negocio ya posee uno capaz de resolver el trabajo.
