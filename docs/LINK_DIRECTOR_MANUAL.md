# LINK WORLD · Director IA conversacional v6

El Director es la sala de inteligencia de LINK WORLD.

## Conectar una IA

1. Abre **Director IA**.
2. Pulsa **Conectar IA**.
3. Elige **Proveedor**.
4. Escribe **Modelo**.
5. Pega **API**.
6. Pulsa **Conectar**.
7. Conversa.

No hay ningún otro paso obligatorio.

## Proveedores disponibles

- OpenRouter
- Groq
- NVIDIA NIM

El campo **Modelo** siempre usa el identificador exacto que entrega el proveedor.

## Estado

- **Configuración incompleta:** falta modelo o API.
- **Probando proveedor…:** LINK WORLD está validando la conexión.
- **Conectado:** proveedor, modelo y API respondieron.
- **Consulta fallida:** se muestra el error real del proveedor.

## Sin fallback

LINK WORLD no cambia automáticamente de proveedor ni de modelo.

## Contexto LINK

Marca **Incluir datos de LINK** únicamente cuando quieras compartir contexto autorizado de LINK WORLD con el modelo seleccionado.

Supabase sigue siendo la fuente de verdad.

## Privacidad

La API:
- no se guarda en localStorage;
- no se guarda en Supabase;
- no se guarda en GitHub;
- no aparece en el archivo de intervenciones;
- no forma parte del prompt del Director.

El proveedor y el modelo sí pueden recordarse localmente sin credenciales.

## Archivo IA

Las intervenciones del Director se archivan en Supabase para auditoría y aprendizaje.

## Documentación técnica

Ver `docs/LINK_DIRECTOR_PROVIDER_PROTOCOL.md`.
