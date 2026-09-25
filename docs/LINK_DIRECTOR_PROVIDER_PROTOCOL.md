# LINK WORLD · Director IA · Provider Protocol v6

## Instalación

La conexión normal del Director tiene exactamente **tres campos**:

1. **Proveedor**
2. **Modelo**
3. **API**

Luego se pulsa **Conectar**.

No hay modelo preseleccionado, modo simple, configuración avanzada ni endpoint visible en el flujo normal.

## Proveedores visibles

- OpenRouter
- Groq
- NVIDIA NIM

El usuario escribe el identificador exacto del modelo disponible en su cuenta y pega la API correspondiente.

## Regla central

**LINK WORLD usa exactamente el proveedor y el modelo elegidos por el usuario.**

No cambia de modelo.
No cambia de proveedor.
No hace fallback silencioso.

## API

La credencial:
- vive solo en la pestaña;
- no se guarda en Supabase;
- no se guarda en GitHub;
- no se guarda en localStorage;
- no entra al prompt;
- no aparece en el archivo de intervenciones.

## Conectar

Al pulsar **Conectar**, LINK WORLD hace una generación mínima real para validar conjuntamente:
- proveedor;
- modelo;
- API;
- capacidad real de devolver texto.

Si el modelo no existe, dejó de estar disponible, requiere saldo o la API no tiene acceso, se muestra el error real del proveedor.

## Backend

La web llama a `/api/director` con:
- `provider`
- `model`
- `apiKey`
- `action`
- `prompt`
- `messages`
- `context`
- metadata del archivo de intervenciones

El backend conserva compatibilidad interna con endpoints OpenAI-compatible personalizados, pero esa opción no forma parte del formulario principal.

## Contexto LINK

El modelo recibe contexto de LINK únicamente cuando el usuario activa **Incluir datos de LINK**.

Supabase sigue siendo la fuente de verdad.

## Archivo IA

Toda intervención se registra en `link_world_ai_interventions` sin credenciales.

## Principios

1. Proveedor.
2. Modelo.
3. API.
4. Conectar.
5. Nada más en el flujo normal.
6. Sin fallback automático.
7. Sin credenciales persistentes.
8. La identidad del Director pertenece a LINK WORLD, no al modelo.
