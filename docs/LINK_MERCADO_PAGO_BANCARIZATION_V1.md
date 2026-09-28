# LINK · Mercado Pago + formalización financiera v1

## Propósito
Cerrar el ciclo de cobro sin duplicar responsabilidades:

- **Mercado Pago** procesa el pago y conserva los datos sensibles de tarjeta.
- **Taxi Hotel** mantiene la reserva y su disponibilidad.
- **LINK WORLD** registra intención de pago, tratamiento tributario, evidencia del proveedor, comisión, líquido y conciliación.
- **Cortex / event_bus** reciben eventos verificables para aprendizaje posterior.

## Entornos y barreras
El gateway soporta `test` y `production`.

Producción requiere simultáneamente:
1. cuenta Mercado Pago productiva verificada;
2. perfil tributario con estado `verified`;
3. `metadata.real_charges_enabled=true` en la cuenta productiva.

La migración deja el seguro productivo en `false`.

## Tributación
El perfil Taxi Hotel se instala como **propuesto**, no como decisión tributaria definitiva. La evidencia apunta a fuentes SII sobre transporte de pasajeros exento y documentación exenta. Debe validarse la situación específica del contribuyente/intermediación antes de habilitar producción.

## Checkout
`mercado-pago` crea Checkout Pro desde una reserva con disponibilidad confirmada. El monto se deriva en servidor desde la reserva y el perfil tributario. La preferencia usa una llave de idempotencia derivada de la intención de pago.

## Webhook
El webhook:
1. valida `x-signature` y `x-request-id`;
2. vuelve a consultar el pago directamente a Mercado Pago;
3. verifica referencia, monto y moneda;
4. actualiza pago operativo, transacción financiera y settlement;
5. publica evento idempotente.

## Progresión de formalización
Cinco hitos de producción, 20 puntos cada uno:
- cuenta conectada;
- webhook verificado;
- primer pago aprobado;
- documentación financiera completa;
- settlement conciliado.

**No es un score bancario ni crediticio.** Es una medida interna de cierre operacional basada en evidencia. Los pagos de prueba no generan puntos.

## Secretos requeridos
Se almacenan únicamente en Edge Function Secrets:
- `MERCADO_PAGO_TEST_ACCESS_TOKEN`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`

Opcionales:
- `MERCADO_PAGO_ALLOWED_ORIGINS`
- `MERCADO_PAGO_RETURN_BASE_URL`

Nunca se guardan tokens en tablas, frontend o Git.

## Panel LINK WORLD
Para Taxi Hotel, el workspace muestra:
- estado sandbox / producción;
- estado del webhook;
- perfil tributario;
- volumen productivo observado;
- 5 hitos de formalización;
- botón de checkout sandbox en reservas aptas.

El panel no habilita cobros reales por sí mismo.
