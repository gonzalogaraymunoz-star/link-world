# OBS · Observatorio de Aprendizaje

## Posición en LINK

OBS es una capacidad transversal de LINK WORLD. No es un negocio y OmniGet no es su memoria.

Flujo canónico:

```
FUENTE EXTERNA
  ↓
OMNIGET · captura / descarga / transcripción
  ↓
DRIVE · evidencia original
  ↓
OBS · extracción / normalización / MD / tags / relaciones
  ↓
HIPOCAMPO · memoria estructurada y trazable
  ↓
LINKDOT / SKILL / MISIÓN · aplicación
  ↓
EVIDENCIA DE RESULTADO
  ↺ OBS
```

## Fuente Drive inicial

Carpeta canónica: **Videos Reel IA**  
ID: `1AN00cm7Ya69o384jiCpB4sPyT9nyjt2V`

Drive conserva el material original. Ningún resumen, transcripción o MD sustituye la evidencia fuente.

## OmniGet

Proveedor de adquisición: `OpenSelena/omniget`.

Se reutilizan sus capacidades de descarga universal, CLI, transcripción y MCP. No se copia su UI ni se convierte su SQLite local en fuente de verdad de LINK.

### Límite de red

OmniGet/MCP es local. LINK WORLD está en Vercel. No se debe publicar el MCP local a Internet. La integración operativa pasa por un bridge controlado del Mac/Control Central que:

1. recibe una orden de captura;
2. ejecuta OmniGet localmente;
3. guarda/sube el original a Drive;
4. devuelve metadatos y estado a OBS;
5. dispara la transformación a conocimiento.

## Contrato mínimo de aprendizaje

Cada unidad debe conservar: `source_url`, `drive_file_id`, `captured_at`, `media_type`, `title`, `author`, `transcript_ref`, `summary`, `principles`, `procedures`, `tags`, `applicable_dots`, `confidence`, `evidence_refs`, `applied_at`, `outcome`.

## Regla de aprendizaje

OBS no considera verdadero algo solo porque apareció en un video. Captura la afirmación con su fuente. Cuando LINK la aplica, el resultado genera nueva evidencia y puede reforzar, corregir o descartar el aprendizaje.
