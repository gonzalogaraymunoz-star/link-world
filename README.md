# LINK WORLD · real primero

**Un lugar para registrar negocios propios, explorar territorio y trabajar con el Director IA.**
La experiencia principal ya no carga misiones, células ni relaciones de demostración.

[Aplicación](https://link-world-delta.vercel.app/) ·
[Habilidad LINK WORLD](.agents/skills/link-world/SKILL.md) ·
[Protocolo ChatGPT ↔ app](docs/LINK_WORLD_BRIDGE_PROTOCOL.md)

## Tres espacios

**Negocios** — pantalla inicial. Muestra únicamente fichas, solicitudes y
relaciones reales autorizadas de Supabase. Si no existe sesión, presenta
«sin conectar», no contadores ficticios; si no hay registros, invita a crear
el primer negocio real.

**Territorio** — Google Maps/Places se carga únicamente al entrar en el
espacio. La búsqueda de negocios es manual y conserva límites locales
8 por sesión y 12 por día en ese navegador, máximo 20 resultados por
consulta. Esos límites NO son topes globales de facturación. Google Places
no se importa masivamente ni se convierte automáticamente en negocio LINK.

**Director IA** — conversación con OpenRouter, modelo gratuito
\`nvidia/nemotron-3-ultra-550b-a55b:free\` por defecto. No altera datos ni
hace búsquedas Google automáticamente. El usuario decide si comparte una
instantánea acotada de datos LINK autorizados para esa consulta.
No hay fallback a modelos pagados ni reintentos automáticos.

## Primer paso real

Abrir la app → **Negocios → Gestionar negocios** o **+ Nuevo negocio**.
El panel requiere una cuenta existente y autorizada de LINK CONTROL CENTRAL
en Supabase. Si su contraseña de Supabase no funciona, permite solicitar
explícitamente un enlace al correo de esa cuenta, sin crear usuarios nuevos.
La pertenencia a \`app_members\` y las políticas RLS controlan el acceso.

Crear una ficha propia como borrador → sincronizar → comprobar que aparece
en la web → recuperarla por UUID desde ChatGPT mediante el conector Supabase
autorizado. No insertar negocios automáticamente sin aprobación.

Supabase ya contiene tablas propias y privadas:
\`link_world_businesses\`, \`link_world_requests\`, \`link_world_relations\`
y \`link_world_activity\`. Las tablas previas del CRM no se alteran.

La capa anterior de demostración \`src/domain/demoWorld.js\`, pruebas y hojas
de estilo históricas permanecen en GitHub para trazabilidad, pero **no
forman parte de la interfaz activa**. Rama de respaldo:
\`backup/link-world-before-real-first\`.

## Operación y costos

La clave web de Google Maps debe estar restringida al dominio y a Maps
JavaScript/Places API (New). Una clave de navegador es visible técnicamente
en el navegador, aunque se guarde solo localmente. La clave privada
OpenRouter no se guarda en GitHub ni localStorage.

OpenRouter, Google Maps, Supabase y Vercel tienen cuotas independientes.
La app no puede prometer un gasto global cero si una cuenta externa admite
facturación. No habilitar modelos pagados o recargas automáticas.

\`\`\`bash
npm install
npm test
npm run build
\`\`\`

Vercel despliega desde main; GitHub Actions valida build y tests.
No se requiere instalar Node en el equipo antiguo para abrir la web.

## Documentación

- [LINK WORLD / habilidad principal](.agents/skills/link-world/SKILL.md)
- [Protocolo del puente](docs/LINK_WORLD_BRIDGE_PROTOCOL.md)
- [Director IA](docs/LINK_DIRECTOR_MANUAL.md)
- [Google Maps / LINK Geo](.agents/skills/link-geo/SKILL.md)
- [Manual histórico de interfaz](docs/INTERFAZ_ESTRATEGICA_V0.4.md)
