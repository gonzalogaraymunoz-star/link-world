# LINK WORLD · Cloud Run staging candidate

This is the React export from Google AI Studio packaged for Google Cloud Run. The legacy source is preserved in `upstream-link-world/` as an archive; it is excluded from the runtime Docker image. This is a **staging candidate**, not a completed consolidation of the old application.

## What's included
- React/Vite single-page app and local conceptual illustrations.
- Supabase browser client with Row Level Security expectations.
- Dockerfile (Bun builder / Node 22 static production server).
- `/healthz` health endpoint.
- `deploy-cloud-run.sh` with **private** Cloud Run access by default.

## Important limitations
- **Google Maps Places is not integrated into the current React UI**. The original `upstream-link-world/src/googleMaps.js` remains in the ZIP but is not called by React. There is no production Maps API request in `src`.
- Local illustrative JPEGs are not Google Places photographs. They are labelled as illustrations in the territory view.
- Financial, operations, model and mission sections require real data/permissions verification before a public release.
- `src/lib/supabase.ts` presently contains a **publishable (public, not service_role)** Supabase key fallback from the AI Studio export. Confirm production RLS and replace this fallback with environment-managed build config in a subsequent hardening change.
- Never place Gemini API secret, Google Cloud service-account private key, or Supabase `service_role` credentials in Vite client env variables.

## Deploy via Google Cloud Shell / terminal
1. Create or select your Google Cloud project, enable billing, and make sure `run.googleapis.com` and `cloudbuild.googleapis.com` are available. Cloud Run build/deploy may incur charges. Confirm account/budget controls first.
2. Unzip into a folder, then deploy:

   ```bash
   PROJECT_ID=YOUR_GOOGLE_CLOUD_PROJECT REGION=southamerica-west1 bash deploy-cloud-run.sh
   ```

3. The resulting service is **private** by default. Grant access through Google IAM or explicitly review the RLS/auth configuration before making it public.
4. Use `gcloud run services describe link-world --project YOUR_GOOGLE_CLOUD_PROJECT --region southamerica-west1 --format='value(status.url)'` to find the service URL.
5. If you deploy from source directly: `gcloud run deploy link-world --source . --region southamerica-west1 --no-allow-unauthenticated`. The Dockerfile is automatically used.

## Repo recommendation
Keep the existing canonical `gonzalogaraymunoz-star/link-world` repo and integrate this candidate on a dedicated branch or subdirectory. Do **not** overwrite main. Avoid copying the nested `upstream-link-world` into the same repo (those files already exist in main).

## Build checks
This archive uses `bun.lock`. In environments with dependency access:

```bash
bun install --frozen-lockfile
bun run lint
bun run build
node server.mjs # after successful build
curl -I http://localhost:8080/
curl http://localhost:8080/healthz
```

The private runtime has no server-side Gemini calls. Any future Gemini integration requires a proper server-side route/secret.
