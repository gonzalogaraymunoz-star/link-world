# Agentes de LINK WORLD

Antes de modificar código geográfico de este repositorio:

1. Leer `.agents/skills/google-maps-platform/SKILL.md` (fuente googlemaps/agent-skills).
2. Leer `.agents/skills/link-geo/SKILL.md` (adaptación LINK).
3. Contrastar la solución con la documentación actual de Google Maps Platform y revisar términos.
4. Mantener los datos comerciales de Google separados de la información original de LINK.
5. Ejecutar `npm run build`; GitHub Actions valida cada push.

No instalar God's Eye View en el Mac Catalina. El repositorio actual usa Google Maps en el navegador; el motor espacial futuro será una capa separada.

## LINK Director · IA transversal

Antes de modificar IA, registro de solicitudes, límites o prompts, leer:

1. `.agents/skills/link-director/SKILL.md` (enrutamiento portable entre proyectos).
2. `docs/LINK_DIRECTOR_MANUAL.md` (uso, seguridad y límites actuales).
3. `api/LINK_DIRECTOR_SYSTEM.md` (prompt real, leído por `api/director.js`).
4. Si está disponible, el `LINK_WORLD_MANUAL_MAESTRO_JUEGO_v1(1).md` aportado por el usuario; la síntesis no lo sustituye.

No crear fallback pagado, URLs API arbitrarias, claves en código/localStorage, ni afirmar límite global de costo si sólo existe uno local. `npm test` y `npm run build` antes de publicar.

## Habilidad primaria: LINK WORLD · puente bidireccional

Antes de consultas o cambios de negocios, solicitudes o relaciones desde
ChatGPT o la app, leer:
- .agents/skills/link-world/SKILL.md
- docs/LINK_WORLD_BRIDGE_PROTOCOL.md

LINK WORLD es la habilidad maestra. LINK Director es una subhabilidad para
el modelo OpenRouter dentro de la web; LINK Geo es subhabilidad geográfica.
No llamar «LINK Director» a la habilidad maestra.

Los negocios, solicitudes, relaciones y eventos compartidos residen en
Supabase proyecto LINK CONTROL CENTRAL, tablas public.link_world_* con RLS
de membresía. El único cliente de web usa una clave publishable. Jamás
insertar service_role en GitHub. Un negocio seleccionado en Google no es
un cliente ni un registro propio hasta que el usuario valida y autoriza.

ChatGPT sólo escribe mediante el conector Supabase autorizado y después de
aprobar el borrador. La app debe volver a leer por el mismo UUID tras
sincronizar. No afirmar que el .md instala un comando universal en Chats.
