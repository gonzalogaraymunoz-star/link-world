# LINK WORLD · Director IA · Provider Protocol v7

## Instalación

La conexión normal del Director tiene **un solo campo**:

**API OpenRouter**

Proveedor y modelo son constantes de LINK:

- Proveedor: **OpenRouter**
- Modelo: **NVIDIA Nemotron 3 Ultra**
- ID: `nvidia/nemotron-3-ultra-550b-a55b:free`
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`

El usuario pega su API una vez y pulsa **Guardar y conectar**.

## Persistencia

La API se guarda en `localStorage` únicamente en ese navegador porque el usuario pidió no tener que pegarla en cada sesión.

No se guarda en Supabase.
No se guarda en GitHub.
No se archiva con las conversaciones.
No entra al prompt.

La interfaz ofrece **Olvidar API guardada** para eliminarla.

Esta comodidad implica que cualquier script que se ejecute con acceso a ese origen del navegador podría leer `localStorage`; por eso no debe usarse en equipos compartidos.

## Regla central

LINK WORLD usa siempre el modelo canónico anterior.

No hay selector de proveedor.
No hay selector de modelo.
No hay fallback silencioso.

## Conectar

La prueba realiza una generación mínima real para validar:
- API;
- disponibilidad del modelo;
- capacidad de devolver texto.

## Backend

El navegador envía `apiKey`; el backend fija proveedor y modelo aunque el cliente intente enviar otros valores.

## Contexto LINK

El modelo recibe contexto de LINK cuando está autorizado en la interfaz.

Supabase sigue siendo la fuente de verdad.

## Archivo IA

Toda intervención se registra en `link_world_ai_interventions` sin credenciales.

## Principios

1. Modelo LINK constante.
2. Usuario pega solo la API.
3. API persistente solo en su navegador.
4. Sin fallback automático.
5. Sin credenciales en Supabase ni archivo IA.
6. La identidad del Director pertenece a LINK WORLD.
