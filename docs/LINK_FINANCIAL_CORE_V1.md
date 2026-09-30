# LINK Financial Core v1

## Objetivo

Separar la **lógica financiera del negocio** del **riel de pago**.

Mercado Pago no decide quién vende, quién factura, quién recibe la comisión ni quién paga al proveedor. Es un proveedor de cobro. LINK WORLD conserva la política económica y la evidencia.

## Modelo

Cada negocio declara:

1. `collection_model`
   - `link_collects`
   - `business_collects`
   - `partner_collects`
   - `external`
   - `undecided`
2. proveedor/riel de pago;
3. moneda;
4. política tributaria;
5. forma de liquidación;
6. reglas de comisión/reparto;
7. documentación requerida;
8. habilitación separada para sandbox y producción.

## Estado inicial codificado

### Taxi Hotel
- El negocio controla el cobro.
- Taxi Hotel conserva reserva y operación.
- Mercado Pago puede ser el riel.
- Costos/comisiones deben estar verificados antes de considerar margen como cierre.
- Producción permanece deshabilitada.

### Hotel Experience
- El negocio cobra y luego paga proveedores según la lógica operacional ya observada.
- La regla exacta de markup/fee sigue contractual.
- Se crea una ruta Mercado Pago compartida solo como infraestructura; producción permanece deshabilitada.

### LINK Cupones
- El comercio/partner realiza la venta y mantiene su operación tributaria.
- El modelo comercial parte del precio neto del producto y usa como referencia operativa: `precio_venta = neto + IVA comercio 19%`.
- La comisión LINK se calcula sobre el **precio de venta con IVA incluido** y parte en **25% mínimo**.
- La liquidación se realiza **mensualmente** sobre las ventas atribuidas a LINK durante el periodo.
- Sobre la comisión LINK se agrega un **fee de 15% de la propia comisión**, asociado al costo/retención de la boleta de honorarios según el acuerdo comercial. Este fee **no es IVA** y **no es 15% de la venta total**.
- Fórmula comercial: `comision_link = precio_venta × porcentaje_link`; `fee_boleta = comision_link × 15%`; `cierre_link = comision_link + fee_boleta`.
- Los perfiles de responsabilidad pueden elevar la comisión sobre el mínimo de 25%; el 25% no se reparte entre cliente y LINK.
- La política tributaria formal de LINK Cupones sigue separada del modelo comercial y debe verificarse antes de habilitar cobro productivo automatizado.
- No se conecta automáticamente a la cuenta Mercado Pago central.

### Caracol
- La relación financiera actual con LINK es externa al checkout de clientes del local.
- No se enruta automáticamente por Mercado Pago.

## Conexión Mercado Pago

`connection_key = link-mercado-pago-primary` representa una conexión reutilizable para rutas donde corresponda.

Verificar la conexión una vez puede propagar la identidad del merchant a rutas que compartan esa `connection_key`. Esto **no abre cobros reales**.

La activación productiva requiere simultáneamente:

- política financiera `verified`;
- `production_enabled=true`;
- cuenta/ruta productiva activa;
- perfil tributario `verified`;
- `real_charges_enabled=true`.

## Checkout transversal

La Edge Function `mercado-pago` acepta:

- `reservation_id`: adaptador Taxi Hotel;
- `sales_quote_id`: adaptador genérico LINK.

Debe enviarse exactamente uno.

La Edge autentica al miembro LINK. Los RPC que preparan dinero son `service_role` only.

## Marketplace / Split Payments

Una conexión central de LINK no debe confundirse con un marketplace multi-vendedor.

En Split Payments 1:1 de Mercado Pago, cada seller debe autorizar por OAuth y el checkout utiliza el token del vendedor. Por eso LINK Financial Core distingue entre:

- LINK/negocio cobra;
- partner cobra;
- cobro externo.

No se enruta un partner a la cuenta central solo por existir una comisión LINK.

## Pruebas

Se verificó con transacciones reversibles:

- quote genérica Hotel Experience → payment intent;
- monto neto/impuesto/bruto preservados;
- producción rechazada mientras la política esté deshabilitada;
- RLS impide que authenticated altere cuentas de pago;
- preparadores de checkout quedaron service-only;
- 0 leads, quotes o payment intents de prueba persistieron.
