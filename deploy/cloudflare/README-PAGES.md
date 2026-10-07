# Cloudflare Pages · LINK WORLD AI Studio (staging)

Estado: **en preparación; no desplegar todavía**. La carpeta de aplicación `apps/link-world-ai-studio/` aún **no está subida a esta rama**.

## Datos para la pantalla Cloudflare Pages

- **Repositorio**: `gonzalogaraymunoz-star/link-world`
- **Rama de producción Pages (staging)**: `feature/cloud-run-ai-studio-2026-10-06`
- **Nombre del proyecto**: `link-world`
- **Framework**: `Vite` (si no aparece, `None` + configuración manual)
- **Directorio raíz**: `apps/link-world-ai-studio`
- **Comando de compilación**: `npm run build`
- **Directorio de salida**: `dist`
- **Versión de Node**: `22` mediante la variable `NODE_VERSION=22` si Cloudflare usa una incompatible.

No se necesita Dockerfile, Cloud Run ni `server.mjs` en Cloudflare Pages para esta interfaz SPA (Vite). La app utiliza Supabase como API externa.

## Antes de desplegar
1. Comprobar en GitHub que `apps/link-world-ai-studio/package.json`, `index.html`, `src/` y los assets efectivamente existen **en esta rama**.
2. No subir `node_modules`, `dist`, secretos, `.env` privados, ni el archivo ZIP como sustituto del código.
3. Verificar la compilación Vite y que el import de `src/assets/images.ts` resuelva todas sus imágenes.
4. Revisar las claves **publicables** Vite de Supabase y las reglas RLS; nunca exponer `service_role` o Gemini API key.
5. Confirmar que los dominios de Pages se permitan en autenticación Supabase, si se requiere.
6. El editor AI Studio puede haber dejado lógica de FIN/Director/Operaciones parcial; no confundir build exitoso con equivalencia funcional.
7. El mapa Google Places no estaba integrado en el ZIP React comprobado; no anunciarlo como presente hasta verificarlo.

## Verificación posterior
- HOME carga vía HTTPS
- Refresh de rutas funciona; si hay rutas no soportadas, revisar fallback SPA
- Auth Supabase abre y cierra sesión
- Los datos protegidos respetan RLS
- No hay cifras o actividades inventadas
- Maps y fotografías: conectados solo si las APIs y atribuciones lo permiten

Este archivo es documentación. No despliega ni cambia `main`.
