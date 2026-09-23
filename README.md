# LINK WORLD

Observatorio espacial del organismo empresarial LINK.

## Primera versión

- Globo 3D navegable centrado en San Pedro de Atacama.
- Vistas Mundo, Organismo y Constelación.
- Células de demostración separadas de entidades geográficas verificadas.
- Sin credenciales, servicios privados ni datos empresariales reales incluidos en el repositorio.

## Arquitectura

El mapa **visualiza** el estado empresarial; no es la fuente de verdad. CesiumJS se encarga del globo, Vite construye la interfaz y, en futuras versiones, Supabase será el estado empresarial, con Google Places como proveedor de observaciones externas bajo sus términos y cuotas.

## Desarrollo

Requiere Node.js 24 o 26 si se ejecuta localmente. No es necesario ejecutarlo en el Mac antiguo: la compilación puede realizarse en Vercel.

```sh
npm install
npm run dev
```

## Despliegue en Vercel

Importar este repositorio como proyecto Vite. Build command: `npm run build`. Output directory: `dist`. Sin variables de entorno para la versión inicial.

## Nota

Las cinco células iniciales son ejemplos conceptuales: no deben confundirse con registros comerciales verificados, posiciones físicas ni conexiones reales. No se incluyen llaves Google, Supabase u otros secretos.
