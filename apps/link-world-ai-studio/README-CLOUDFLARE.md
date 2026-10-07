# LINK World · Cloudflare Pages

Esta aplicación React es la superficie publicada por el proyecto existente `link-world`.

- URL: https://link-world-9h0.pages.dev/
- Cuenta: 2aba80869464953bafa02c63a32f7b13
- Rama: feature/cloud-run-ai-studio-2026-10-06
- Root: apps/link-world-ai-studio
- Output: dist
- Build: npm ci --no-audit --no-fund && npm test && npm run build
- NODE_VERSION: 24.19.0
- SKIP_DEPENDENCY_INSTALL: true (producción y preview)

El package-lock.json y las versiones exactas evitan resolver un árbol diferente en cada deploy. No usar Bun para este build.

## Desarrollo y verificación

```sh
npm ci
npm test
npm run build
npm run dev
```

El build verifica TypeScript antes de producir assets. Cloudflare debe publicar `dist`, nunca `src` ni el index de desarrollo. Los assets contienen todas las dependencias empaquetadas; no necesitan un import map.

## Supabase

Usa LINK CONTROL CENTRAL: zgbnjlrxzvzpigmwidsp. La clave del navegador es publishable. Se pueden reemplazar los valores públicos mediante VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Nunca configurar un service_role o secreto con prefijo VITE_.

Las lecturas públicas existentes siguen sus políticas de public_workspace. FIN y Modelos requieren miembro autorizado. La app no amplía permisos, no crea cuentas ni crea datos demo. Los cambios de sesión limpian el estado y vuelven a consultar la fuente. El botón Actualizar vuelve a consultar y remonta las mesas.

La sesión de Supabase en este dominio es independiente de otros dominios LINK: el usuario debe ingresar con su cuenta existente. No se copian sesiones ni contraseñas entre dominios.

## Alcance funcional

- Territorio: células reales, búsqueda, señales registradas y acceso a fichas.
- Ficha: identidad y roles registrados, conteo de contrapartes y ofertas, evidencia registrada.
- Concha: navegación de las seis etapas y sus contratos; no ejecuta automáticamente operaciones.
- FIN: resumen histórico CLP, lista de los últimos 50 movimientos con filtros y ciclo económico.
- Director: señales derivadas de fichas y copia de contexto para ChatGPT; no hay ejecución IA automática en esta exportación.
- Modelos: cartera canónica con permisos de miembro.
- Operaciones: arquitectura registrada en fichas; no equivale a una lista de reservas ni una certificación de entrega.

MAR, Ventas, Cierre, Boarding, Postventa, RRSS, Personas, Evidencias, Artefactos, Evolución, Génesis, Mitosis, Administración y Conexiones se identifican como En preparación. Conectarlas requiere sus contratos y superficies existentes; esta publicación no simula que estén ejecutando trabajo. No hay integración de Google Maps en esta exportación. Las imágenes son ilustrativas.
