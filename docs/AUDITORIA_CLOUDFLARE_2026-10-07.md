# Auditoría de publicación · LINK World

Fecha UTC: 2026-10-07. Aplicación: apps/link-world-ai-studio. Proyecto Pages existente: link-world.

## Problemas encontrados y corregidos

| Hallazgo | Corrección |
|---|---|
| Publicación anterior en blanco: el navegador no resolvía @supabase/supabase-js | Assets compilados con Vite, dependencias empaquetadas y output dist |
| Bun del build no reconocía la versión del lockfile | Instalación explícita npm ci, Node 24 y SKIP_DEPENDENCY_INSTALL |
| Conflicto entre Vite 8 y esbuild 0.25 declarado directamente | Retirada de dependencia directa innecesaria, versiones exactas y package-lock |
| No se consultaban otra vez los datos al ingresar | Suscripción a cambios de sesión y recarga canónica |
| Datos anteriores podían permanecer tras cerrar sesión | Limpieza del estado, regreso a LINK y recarga pública |
| Buscador y atajo sin efecto | Búsqueda por nombre, slug, resumen, sector y ciudad; atajo y acceso móvil |
| Navegación superior sin acción | Botón Volver, breadcrumbs y cierre del panel móvil |
| Consolidado FIN leído como objeto aunque era array | Suma explícita de campos numéricos del resumen |
| Neto cero reemplazado por ingresos | Operador nullish conserva cero y valores negativos |
| Errores de red/esquema confundidos con permisos | Clasificación diferenciada y mensajes de reintento |
| Pestañas FIN sin comportamiento | Tres vistas con comportamiento: Inicio, Evolución y Movimientos |
| Señales mostraban un número fijo | Conteo desde registros cargados |
| Tema oscuro no activaba variantes Tailwind | Variante dark conectada a data-theme |
| Evidencia y roles declarados sin fuente | Estados registrados y vacíos explícitos; no inferir verificación |
| Vista vacía en error de render | ErrorBoundary con recuperación |
| Acceso poco accesible | Labels, foco modal, Escape, ciclo Tab y nombres para botones |
| Mesas y datos grandes cargados al inicio | Carga de mesas bajo demanda y consultas FIN paralelas |
| Prueba histórica de cron fallaba al perder metadatos de un evento | Conservar el evento estructurado como un registro, incluyendo movimiento real y monto de prueba |

## Verificación Supabase

LINK CONTROL CENTRAL se encuentra ACTIVE_HEALTHY. Se verificó el acceso público mediante la clave publishable de la app: 5 células, contrapartes y productos según RLS. FIN y cartera de modelos rechazan lecturas anónimas. Una transacción read only con rol authenticated y membresía existente verificó: 6 células, 6 resúmenes FIN, 8 movimientos, 6 ciclos y 10 modelos. La transacción terminó con rollback; no se cambiaron registros ni permisos.

Las tablas de negocios, contrapartes y productos tienen RLS. Las vistas link_fin_real_summary_v, link_fin_real_movements_v, link_fin_business_lifecycle_v y link_world_model_portfolio_v tienen security_invoker=true. Los 8 movimientos existentes usan CLP. El resumen de la vista actual no separa monedas: antes de incorporar una segunda moneda debe evolucionarse el contrato financiero.

No se probó el ingreso manual con contraseña de usuario: no se solicitaron ni recuperaron credenciales. La verificación de permisos autenticados se hizo en la base, sin modificar usuarios ni sesiones.

## Alertas heredadas del proyecto compartido

El asesor de seguridad también informa condiciones fuera de las tablas/vistas utilizadas por esta exportación:

- 11 vistas SECURITY DEFINER: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
- 12 funciones con search_path mutable: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- 15 funciones SECURITY DEFINER invocables por anon: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- 30 funciones SECURITY DEFINER invocables por authenticated: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Protección de contraseñas filtradas desactivada: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- 49 tablas con RLS sin políticas (INFO): acceso denegado por defecto; no implica exposición.

Estas advertencias no son una certificación de vulnerabilidad para cada función: algunas son APIs públicas intencionales. Corregirlas requiere revisar autorización y consumidores de cada contrato del ecosistema. No se cambiaron globalmente permisos del proyecto compartido durante una reparación de publicación de esta app.

## Límites funcionales

Consultar README-CLOUDFLARE.md. La exportación no implementa las superficies operativas de todos los artefactos del ecosistema. Las capacidades pendientes se muestran como En preparación; no se presentan como procesos activos.

## Validaciones de entrega

- TypeScript, build de producción y pruebas de consolidado, errores y búsqueda.
- Auditoría npm de dependencias de producción sin vulnerabilidades reportadas en el momento de la revisión.
- 29 pruebas aprobadas (26 históricas y 3 nuevas), build legado y build React aprobados. CI configurada para ambas aplicaciones.
- Despliegue Cloudflare y prueba del navegador: registrar resultados finales en el commit de entrega.
