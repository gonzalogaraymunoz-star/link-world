# LINK DIRECTOR · manual de uso v2

## Entra en la app

Abre https://link-world-delta.vercel.app/ y pulsa «✦ Director IA».

1. **Conexión**: URL fija https://openrouter.ai/api/v1/chat/completions, modelo openrouter/free. Pega tu clave OpenRouter sk-or-… y pulsa «Comprobar conexión». LINK valida la clave con el endpoint /api/v1/key sin generar texto. El panel muestra «Clave conectada · modelo por probar». La disponibilidad del modelo se confirma con su primera respuesta, no con el check.
2. **Conversar**: escribe tu pregunta en hasta 3500 caracteres y pulsa «Consultar al Director». Respuestas de hasta 1100 tokens, con estructura adaptable a lo que preguntaste. Puedes consultar sin un límite diario adicional de LINK, pero OpenRouter conserva la cuota de su plan gratuito.
3. **Investigar LINK**: activa explícitamente «Incluir datos propios de LINK». Esto requiere iniciar sesión como miembro autorizado en el panel ↔ LINK WORLD; la app lee de Supabase al momento un resumen de negocios, solicitudes, relaciones y actividad. Puedes seleccionar hasta tres negocios o un resumen del organismo. La muestra está acotada y, si se recorta, se señala. Se envía solo al proveedor OpenRouter cuando eliges esa opción.
4. **Google**: «Buscar manualmente en Google Maps» te lleva al buscador visible. El Director no ejecuta búsquedas automáticas, no rastrea zonas completas, no convierte fichas Google en negocio LINK ni envía Places a OpenRouter por defecto.
5. **Registro**: puedes guardar preguntas y respuestas localmente mediante la casilla (desactivada inicialmente), anotar solicitudes sin IA y exportar o borrar JSON. Este registro no es el registro compartido de ↔ LINK WORLD.

## Estado de conexión

- «Sin verificar»: aún no hay clave validada en esta pestaña.
- «Comprobando clave»: se está validando la clave sin gastar tokens de generación.
- «Clave conectada · modelo por probar»: OpenRouter aceptó la clave; el modelo está pendiente de su primera respuesta.
- «Conectado · [modelo]»: una respuesta del modelo se recibió correctamente.
- Mensaje de error: se muestra si OpenRouter rechaza la clave, el modelo, la cuota o si no está disponible; no hay reintentos automáticos ni fallback pagado.

La API key no se guarda en localStorage, GitHub ni registros. Sale cifrada mediante HTTPS al proxy Vercel y desde allí a OpenRouter. La URL/modelo no son secretos. Si recargas, vuelve a pegar la clave.

## Modelo, consulta libre y costo

Solo se admiten openrouter/free e identificadores que terminen en :free. No se permite openrouter/auto ni modelos pagados. LINK no impone el antiguo límite artificial de 5 preguntas; OpenRouter aplica sus límites Free y el sistema se detiene cuando devuelve 429. No existe garantía global de costo cero en cuentas externas.

Para Google Places: solo consulta tras pulsación humana; máximo 8 búsquedas por sesión y 12 por día en este navegador, máximo 20 resultados por búsqueda, radius 1800 m para Nearby, sin búsquedas silenciosas. Son barreras de interfaz, **no topes de facturación de Google Cloud**. Google Maps y Vercel tienen costos/cuotas independientes.

## Alcance real

La lectura privada usa tablas link_world_businesses, link_world_requests, link_world_relations y link_world_activity, mediante Supabase Auth/RLS. No tiene acceso a pagos, CRM externo, reservas reales ni otras bases de datos. Las cinco células y misión inicial son DEMO claramente etiquetada y pueden analizarse sin acceso privado; nunca equivalen a hechos comerciales. La IA solo propone, no escribe cambios operativos.

La habilidad principal para trabajar desde ChatGPT sigue siendo LINK WORLD:
https://github.com/gonzalogaraymunoz-star/link-world/blob/main/.agents/skills/link-world/SKILL.md

La política ejecutada por el modelo está en api/LINK_DIRECTOR_SYSTEM.md y la habilidad secundaria en .agents/skills/link-director/SKILL.md.
