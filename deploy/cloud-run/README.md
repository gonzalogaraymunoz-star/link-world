# LINK WORLD · Integración AI Studio → Cloud Run

Rama de integración protegida. **No reemplazar `main` todavía.**

## Estado
- El código React se preparó como artefacto ZIP descargable en la conversación de ChatGPT: `link-world-cloud-run-github.zip`.
- **Pendiente:** subir la carpeta `apps/link-world-ai-studio/` de ese ZIP a esta rama (incluye `Dockerfile`, `server.mjs`, `bun.lock`, `src/` y assets).
- El código upstream ya existe en la raíz de este repositorio: no subir la copia anidada `upstream-link-world/`.
- La rama no desplegará nada automáticamente; el workflow de Cloud Run es manual.
- Se requiere configurar Google Cloud Workload Identity Federation y secretos de GitHub para ejecutar el despliegue.

## Comprobaciones
La versión empaquetada contiene app React/Vite, un Dockerfile multi-etapa y un servidor Node que responde `GET /healthz`. Las pruebas estáticas HTTP pasaron. No se verificó la compilación completa debido a dependencias npm/bun no disponibles en el entorno de preparación.

## Advertencias
- La app React exportada todavía no integra el mapa interactivo real de Google Places: `google_place_id` existe, pero la lógica Maps del upstream no ha sido migrada.
- Las imágenes locales en `src/assets/images/` son **ilustrativas**, no fotografías oficiales de Google Maps.
- La Home empaquetada fue ajustada para evitar cifras y alertas de demostración presentadas como hechos.
- Cloud Run se configuró **privado** por defecto. El proyecto de Google Cloud debe tener facturación, API de Cloud Run y Cloud Build habilitadas; puede generar cargos.
- No publicar sin revisar RLS de Supabase, control de acceso, FIN y pruebas de interfaz.

## Publicación manual desde Cloud Shell
```bash
cd apps/link-world-ai-studio
PROJECT_ID=TU_PROYECTO REGION=southamerica-west1 bash deploy-cloud-run.sh
```

## GitHub Actions
El workflow `cloud-run-link-world-manual.yml` está limitado a disparo manual y a esta rama.
