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
