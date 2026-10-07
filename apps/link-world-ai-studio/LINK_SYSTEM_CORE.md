# LINK SYSTEM CORE (CONSTITUCIÓN DE LINK)

Versión: 1.0.0  
Fecha: 2026-10-06  
Estado: Aprobado  
Ámbito: Universal para todo el ecosistema LINK

---

## 1. PRINCIPIO SUPREMO: MOTOR VS. ESTADO VIVO

1. **El Motor es inmutable ante cambios de negocio:**  
   El código, los componentes, las pantallas y las reglas del videojuego se construyen y versionan en el repositorio.
2. **El Estado Vivo reside en Supabase:**  
   Los negocios, operaciones, ventas, finanzas, evidencias, misiones y transformaciones se consultan y persisten en la base de datos viva.
3. **Regla de Cero Deploys Operativos:**  
   Si un negocio realiza una venta, avanza de fase en la Concha, emite una factura o sufre una mitosis, **se escribe en Supabase y se refleja automáticamente en LINK WORLD sin requerir nuevo deploy ni recompilación de código**.

---

## 2. ANATOMÍA Y CICLO DE UN NEGOCIO LINK

Todo negocio dentro de LINK debe poseer una estructura estricta y trazable:

```
[ DOLOR ] 
   ↓
[ MODELO ] 
   ↓
[ NEGOCIO ] 
   ↓
[ ROLES ] (Quién vende, quién compra, quién opera, quién factura; propio / cliente / híbrido)
   ↓
[ ARTEFACTO NÚCLEO ] (Producto o servicio central entregable)
   ↓
[ ARTEFACTOS DE APOYO ] (Documentos, cotizaciones, manuales, guías)
   ↓
[ LA CONCHA ] (Las 6 fases operativas)
   ↓
[ EVIDENCIA ECONÓMICA ] (Documento tributario + dinero real)
```

---

## 3. LA CONCHA: 6 ETAPAS OPERATIVAS PERMANENTES

Cada negocio se mueve a través de una concha con seis puertas operacionales:

1. **MAR**  
   Prospección activa, captación, atracción y generación de tráfico o interés en canales.
2. **VENTA**  
   Presentación de propuesta, cotización, negociación de valor y alineación de condiciones.
3. **CIERRE**  
   Aceptación formal, firma de contrato, orden de compra o compromiso vinculante.
4. **BOARDING**  
   Recepción del cliente/huésped/usuario, recopilación de insumos, configuración inicial y preparación operativa.
5. **OPERACIONES**  
   Ejecución del servicio o entrega del artefacto físico/digital, cumplimiento de promesas y logística.
6. **POSTVENTA**  
   Cobranza, soporte, garantía, retroalimentación, recompra o activación de nuevos ciclos.

---

## 4. ESCALA Y CICLO ECONÓMICO LINK

La evolución económica de un negocio no se declara por opinión; se certifica por hechos observables y verificables:

```
01. Nacimiento
02. Ingreso a LINK
03. Activación
04. Primera evidencia económica
05. Primera venta
06. Primera facturación
07. Primer cobro
08. Negocio Comprobado (GATE FUNDAMENTAL)
09. Recurrente
10. Rentable
11. Estable
12. Transformación
13. Mitosis / Meiosis
```

---

## 5. REGLA DEL NEGOCIO COMPROBADO

> **Negocio Comprobado = Venta + Prestación / Entrega + Documento + Dinero Real.**

Si falta cualquiera de estos 4 pilares:
- No existe certificación de negocio comprobado.
- El estado permanecerá en *Etapa previa* o *Pendiente de comprobación*.

### Estados de Hitos y Evidencias:
- **`observed` (Observado):** Se tiene noticia o registro preliminar del hecho, pero carece de respaldo documental o bancario.
- **`verified` (Verificado / Demostrado):** Respaldado con documento formal (DTE/factura/boleta/contrato) y comprobante de transferencia bancaria efectiva o depósito.
- **`revoked` (Revocado):** El hecho fue anulado, cancelado o rebotado.

---

## 6. SISTEMAS TRANSVERSALES ÚNICOS

No existen sistemas paralelos por negocio. Existe un único motor LINK subdividido en 4 mesas maestras:

1. **LINK FIN (Mesa Financiera):**  
   Ingresos, egresos, conciliación bancaria, documentos tributarios, cobros, ciclo de vida económico y próximo gate.
2. **LINK RRSS (Mesa de Redes y Audiencias):**  
   Cuentas, publicaciones, interacciones, conversaciones, captación de leads y oportunidades.
3. **LINK VENTAS (Mesa Comercial):**  
   Pipeline de cotizaciones, reservas, embudo de conversión, cierres y acuerdos comerciales.
4. **LINK OPERACIONES (Mesa de Ejecución):**  
   Servicios programados, reservas activas, asignaciones de equipo, checklists de entrega y estado de satisfacción.

*Cada negocio (Caracol, Lama Travelers, Hotel Experience, Franchutería, Café Roots, etc.) es una vista filtrada de estas mesas transversales.*

---

## 7. ESPECIFICACIÓN DE EVENTOS DEL SISTEMA (EVENT STREAM)

Toda modificación relevante genera un evento inmutable registrado en `link_events`:

- `business.created` / `business.updated`
- `concha.stage_changed`
- `sale.created` / `sale.quoted` / `sale.closed`
- `operation.scheduled` / `operation.completed`
- `payment.invoiced` / `payment.received` / `payment.reconciled`
- `evidence.registered` / `evidence.verified` / `evidence.revoked`
- `economic_milestone.reached` / `economic_milestone.verified`
- `mission.created` / `mission.completed`
- `transformation.mitosis` / `transformation.meiosis`

Cada evento almacena: `id`, `business_id`, `actor_id`, `timestamp`, `event_type`, `previous_state`, `next_state`, `evidence_refs`, `metadata`.

---

## 8. REGLA DE SEGURIDAD Y CREDENCIALES

1. **Frontend / Browser:**  
   Solo consume claves públicas (`anon_key`) con Row Level Security (RLS) habilitado.
2. **Backend Proxy / Server:**  
   Gestiona operaciones privilegiadas o claves maestras (`service_role`).
3. **Prohibición:**  
   Cero secrets expuestos en commits o código cliente.
