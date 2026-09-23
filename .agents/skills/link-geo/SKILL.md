---
name: link-geo
description: Capacidad geográfica compartida de LINK para mapas web, descubrimiento comercial y futuras rutas/3D.
---

# LINK Geo · capa geográfica compartida

## Origen y dependencia

Basada en el skill **Google Maps Platform** de https://github.com/googlemaps/agent-skills (v1.0.1, Apache-2.0).
Skill original copiado en `.agents/skills/google-maps-platform/SKILL.md`; licencia en
`THIRD_PARTY_GOOGLEMAPS_AGENT_SKILLS_LICENSE`.

Para modificar integraciones de Google Maps, leer primero el skill original y contrastar
con la documentación oficial vigente, porque endpoints, precios y condiciones cambian.
El Google Maps Platform Skills Index remoto y sus sub-skills pueden requerir acceso a red;
si no están disponibles, dejar constancia y verificar en documentación oficial.

## ADN de LINK

**Identidad propia de negocio** != **ficha temporal de Google Place**.
Google Maps representa el terreno; el estado operativo de células y sinapsis
pertenece a LINK/Supabase, nunca a la API de Maps. El mapa es visualización.

## Estado funcional actual

- LINK WORLD v0.3: Vite + Maps JavaScript API + Places API (New) en navegador.
- Mapas centrados en San Pedro de Atacama y São Paulo (centros geográficos, no
  establecimientos ni geolocalización de usuarios).
- Búsquedas Nearby y Text Search SOLO por pulsación explícita, máximo 20
  resultados por solicitud.
- Campos mínimos: id, displayName, formattedAddress, location, googleMapsURI.
- AdvancedMarkerElement y loader oficial v2; DEMO_MAP_ID solo para pruebas
  hasta asignar un ID de mapa propio (`VITE_GOOGLE_MAP_ID`).
- Células y sinapsis visibles en UI son conceptuales, no datos de Google.

## Rutas de evolución (no afirmar que ya están implementadas)

| Fase | Módulo LINK | Google Maps Platform |
| --- | --- | --- |
| 1 | LINK WORLD búsqueda y ficha comercial | Maps JavaScript API, Places API (New) |
| 2 | LINK Geo identidad verificable | Place IDs en tabla propia + observación bajo demanda |
| 3 | TaxiHotel / Lama Travelers | Routes API, Geocoding (direcciones y tiempos) |
| 4 | Hotel Experience | Place Autocomplete para formularios de llegada y recogida |
| 5 | Observatorio territorial | Marker clustering, zonas y capas propias |
| 6 | LINK WORLD espacial | Maps 3D/Map Tiles API, sujetos a costo, GPU y licencia |

## Reglas de implementación

1. No recrear una base completa de Google Maps ni extraer en masa fichas, reseñas,
   direcciones o coordenadas para almacenarlas. Guardar Place IDs según permiso
   y datos originales obtenidos legítimamente por LINK, por separado.
2. Representar contenido de Places sobre un Google Map y conservar branding,
   atribución y vínculos oficiales sin oscurecerlos.
3. No usar scraping de Google Maps, endpoints legacy o
   `google.maps.Marker`. Usar `Place`, `AdvancedMarkerElement` y map ID válido.
4. Evitar llamadas silenciosas al mover el mapa. Mostrar costo potencial de
   cada interacción y pedir solo campos necesarios. El límite cliente de 40
   consultas/sesión es una pausa UX, **NO** un tope de cobro.
5. Clave web: visible por naturaleza en navegador; restringir por HTTPS referrer
   de dominio y por APIs. No publicar llaves en código, issues o chats.
   Credenciales privadas futuras deben vivir en servidor con autentificación,
   cuotas y permisos independientes.
6. No deducir demanda, ingresos, cupos, reputación global ni relaciones
   comerciales desde la mera existencia de fichas Google.
7. Las operaciones reales de LINK solo aparecen una vez conectadas y
   autorizadas sus fuentes propias; etiquetar siempre mock vs real.
8. Antes de cada cambio sustantivo, comprobar documentación/ToS y ejecutar
   compilación Vite en CI; comprobar visualmente el mapa en navegador real.

## Documentación de referencia

- https://developers.google.com/maps/documentation/javascript/load-maps-js-api
- https://developers.google.com/maps/documentation/javascript/nearby-search
- https://developers.google.com/maps/documentation/javascript/place-search
- https://developers.google.com/maps/documentation/javascript/advanced-markers/start
- https://cloud.google.com/maps-platform/terms

## Costos y credenciales

Google Maps Platform puede cobrar al proyecto Cloud después de las cuotas
gratuitas aplicables. El prototipo no promete US$0 ni aplica límites de cobro
reales. Antes de publicación comercial confirmar consumo, presupuestos, cuotas
y términos del proveedor. Google Maps Demo Key está disponible como vía
temporal de prueba según elegibilidad/condiciones; nunca para producción.

## Gobierno de capacidades

La skill no es una API, licencia de datos ni acceso automático a Google.
No activar de golpe 35 APIs: cada función debe justificar su necesidad,
credenciales, atribución, SKU y tratamiento de datos antes de integrarla.
