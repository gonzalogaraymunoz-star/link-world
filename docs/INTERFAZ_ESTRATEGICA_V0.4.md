# LINK WORLD · v0.4 interfaz estratégica — fase 0/1 + Demo vertical

Especificación de referencia: **LINK_WORLD_MANUAL_MAESTRO_JUEGO_v1(1).md**, entregado por el usuario el 23-09-2026.

## Auditoría y decisiones

| Conservado | Ajustado | Agregado | No intervenido |
| --- | --- | --- | --- |
| Repositorio y Vercel | `src/main.js` como shell modularizado | `src/world-ui.css` en crema/oliva/arena | Supabase existente |
| `src/googleMaps.js` y fuente Google | Escalas Mundo / Organismo / Constelación | Siete lentes estratégicas | Ventas y reservas |
| Nearby/Text Search por demanda | Selección contextual de Google vs DEMO | Ficha contextual desacoplada del mapa | Accesos entre negocios |
| Cinco células conceptuales | Vista de relaciones con estados DEMO | Dock de misión, bloqueos y memoria | Cobros, contratos y QR |
| Skills Google + LINK Geo | Etiquetas v0.3 obsoletas | `src/domain/demoWorld.js` y pruebas | Motor 3D avanzado |
| CI y clave web restringida | UX móvil con contexto plegable | Rama `backup/link-world-v0.3-before-ui` | Identidades reales en un mapa |

### Límites explícitos

- Google Places presenta información de origen Google y **no genera** oportunidad comercial automáticamente.
- La DEMO cuenta un caso ficticio; cada evento registra `source: DEMO FICTICIA` y `verification_state: simulado`.
- El motor no escribe a Supabase, Stripe, Google, Gmail, reservas ni otros sistemas.
- Las células son modelos conceptuales; nombres y genes de referencia no suponen integraciones habilitadas.
- Una sinapsis "ejercida (simulación)" nunca se contabiliza como servicio ni comisión.
- Se puede iniciar otra partida sin tocar registros empresariales; no se persiste estado DEMO.
- El mapa no es una cámara en vivo. No se eliminaron atribuciones de Google.

## Wireframe implementado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ LINK WORLD       TERRITORIO / SAN PEDRO       DEMO       TEMA / CONTEXTO    │
├──────────────────┬─────────────────────────────┬────────────────────────────┤
│ MUNDO            │                             │ CONTEXTO / DECISIÓN        │
│ ORGANISMO        │     GOOGLE MAPS REAL        │ Fuente Google o DEMO       │
│ CONSTELACIÓN     │     búsqueda manual         │ Genes y orgánulos          │
│                  │     sinopsis por vistas     │ Estrategia / siguiente paso│
│ 1–7 estrategias  │                             │                            │
│ Territorios      │                             │                            │
├──────────────────┴─────────────────────────────┴────────────────────────────┤
│ MISIÓN DEMO · acciones alternativas · 6 pasos · bloqueo · memoria           │
└─────────────────────────────────────────────────────────────────────────────┘
```

En móvil, barra de perspectivas y estrategias horizontal, mapa, contexto
plegable y barra de misión. Google conserva controles/atribución.

## Primera misión jugable DEMO

Observación ficticia → seleccionar coordinar / reprogramar / no intervenir →
proponer sinapsis DEMO → simular disponibilidad → simular ejecución →
proponer aprendizaje. Misión, sinapsis y memoria se proyectan desde el mismo
estado, no desde contadores visuales independientes.

Alternativas: rechazo termina sin venta; reprogramación bloquea y permite
revisar; intento de saltarse dependencias se rechaza.

## Pruebas

`npm test` valida estado inicial, ciclo coherente, bloqueo, rechazo, reinicio y
aislamiento del estado por copias; `npm run build` valida la aplicación. CI usa
Node 24. El proveedor Google requiere **prueba visual y funcional con clave
restringida en un navegador real**: las compilaciones y descargas HTTP no
demuestran que la cuenta Cloud autorice Maps/Places ni que el comportamiento
móvil esté certificado.

## Próximas fases (requieren auditoría/autorizaciones)

1. Auditar Supabase concreto y esquema existente; autenticación y RLS.
2. Definir estados y acuerdos de relaciones, evidencia y fuentes de verdad.
3. Conectar una operación de lectura autorizada y validar idempotencia.
4. Extender capacidades de siete estrategias sin convertir Google en CRM.
5. Laboratorio hipotético separado; después evaluar el motor 3D.

**No afirmar "operación comercial en producción" hasta contar con roles,
fuentes, auditoría, pruebas, costos y permisos reales.**
