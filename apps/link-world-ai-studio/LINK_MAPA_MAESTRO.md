# MAPA MAESTRO · LINK WORLD
## Arquitectura completa de dimensiones, conexiones, navegación y reglas de integración

Este documento constituye la instrucción y arquitectura superior permanente de **LINK WORLD**.  
La aplicación se concibe como **un solo organismo vivo**, no como una colección de dashboards o micro-apps desconectadas.

---

### 0. PRINCIPIO MAESTRO: LAS CUATRO ESCALAS
```
LINK (Escala 0 · Organismo Completo)
│
├── CÉLULAS / NEGOCIOS (Caracol, Lama Travelers, Hotel Experience, Franchutería, Café Roots...)
│   └── LA CONCHA (Columna Operativa)
│       ├── MAR (Escucha y Membrana)
│       ├── VENTA (Propuesta de Valor)
│       ├── CIERRE (Compromiso Formal)
│       ├── BOARDING (Preparación Operacional)
│       ├── OPERACIONES (Ejecución Real)
│       └── POSTVENTA (Cierre, Reparación y Aprendizaje)
│
├── CAPACIDADES TRANSVERSALES (Mismas entidades, vista agregada o filtrada)
│   ├── MAR & COMUNESCUCHA
│   ├── RRSS (Infraestructura de Canales)
│   ├── VENTAS (Pipeline Comercial Transversal)
│   ├── CIERRE (Compromisos y Gates)
│   ├── BOARDING (Readiness Preoperacional)
│   ├── OPERACIONES (Torre de Control)
│   ├── POSTVENTA (Feedback y Reclamos)
│   ├── FIN (Verdad Económica y Certificación)
│   ├── PERSONAS / IDENTIDAD (Identidad Única Multi-rol)
│   ├── EVIDENCIAS (Observada → Verificada → Revocada)
│   ├── ARTEFACTOS (Capacidades Reutilizables)
│   └── EVOLUCIÓN (Ciclo de Vida de 13 Fases)
│
├── GOBIERNO E INTELIGENCIA
│   ├── DIRECTOR (Coordinación y Misiones en Modo Shadow / Bounded-Auto)
│   ├── ADMINISTRACIÓN (Permisos, Políticas y Feature Flags)
│   ├── CONEXIONES (Adaptadores: Zernio, Maps, Calendar, Drive, Mercado Pago, Stripe, Global66)
│   ├── PULSO VIVO (Observación de Eventos Significativos)
│   ├── HIPOCAMPO (Memoria Pertinente Bajo Demanda)
│   ├── CORTEX (Razonamiento Asistido)
│   └── LINK SHOW (Superficie de Interacción)
│
└── REPRODUCCIÓN (La Concha Eterna)
    ├── MODELOS (Lógica Reusable y Recetas)
    ├── GÉNESIS (Dolor → Solución → Artefacto → Modelo → Célula)
    └── MITOSIS / MEIOSIS (Replicación y Recombinación con Genealogía sin Heredar Dinero)
```

---

### REGLAS FUNDAMENTALES VINCULANTES
1. **Regla de las Dos Entradas:** Todo módulo puede abrirse desde la célula (`Lama → Boarding`) o desde la transversal (`LINK → Boarding`). Es la misma información, solo cambia el `businessContext`.
2. **businessContext:** Persiste mientras se navega dentro de un negocio (`businessContext = business_id`). Al entrar desde LINK transversal, `businessContext = all`.
3. **Identificadores Canónicos:** Todo se une por IDs (`business_id`, `person_id`, `commitment_id`, `operation_id`, `evidence_id`, etc.), nunca por texto libre.
4. **Negocio Comprobado:** `Venta + Prestación/Entrega + Documento + Dinero Real Verificado`. Si falta uno, no se certifica.
5. **Separación de Tres Verdades:** Comercial (lo propuesto), Operacional (lo entregado) y Financiera (lo cobrado en caja).
6. **Motor vs. Estado Vivo:** El motor se versiona y compila; el estado cambia en Supabase sin necesidad de nuevo deploy.
