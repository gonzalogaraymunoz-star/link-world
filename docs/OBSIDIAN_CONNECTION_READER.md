# Micelio · Connection Reader v1

## Por qué cambia

El primer Micelio priorizaba una composición circular estable. Eso hacía legible la presencia de negocios, pero escondía la topología: pocas conexiones visibles, relaciones sin etiqueta y escasa navegación desde el grafo hacia las fichas.

La nueva regla es: **Micelio es un lector navegable de relaciones, no un diagrama decorativo.**

## Referencia estudiada

Documentación oficial de Obsidian Graph View:

- https://obsidian.md/help/plugins/graph
- https://obsidian.md/es/help/plugins/graph

Principios observados en la documentación:

1. Los nodos representan entidades/note records.
2. Las líneas representan enlaces.
3. El tamaño del nodo aumenta según las referencias recibidas.
4. Hover resalta las conexiones del nodo.
5. Click abre la nota seleccionada.
6. Existe un grafo global.
7. Existe un grafo local centrado en la nota activa y con profundidad configurable.
8. Filtros, grupos, visualización y fuerzas son controles del lector, no la fuente de verdad.

No se copia el branding ni la interfaz propietaria de Obsidian. Se adopta el modelo de interacción y se mapea a la arquitectura real de LINK WORLD.

## Mapeo LINK

| Obsidian | LINK WORLD |
| --- | --- |
| Note | Ficha canónica LINK |
| Node | Control / Negocio / Cliente / Producto |
| Internal link | Relación registrada |
| Global graph | Todos los nodos visibles y relaciones permitidas |
| Local graph | Ficha activa + conexiones a profundidad 1–3 |
| Click note | Abrir ficha canónica LINK |
| Hover note | Resaltar vecindario y atenuar el resto |
| Link | Ruta con tipo, estado, origen y evidencia |

## Contrato de interacción

- **Grafo global** es la vista inicial.
- **Grafo local** usa el último nodo activo y permite profundidad 1, 2 o 3.
- **Click de nodo** abre la ficha canónica real:
  - negocio → ficha de negocio;
  - cliente → ficha de cliente dentro de su negocio;
  - producto → ficha de cliente y producto enfocado.
- **Click de conexión** abre el pasaporte de relación.
- **Hover** ilumina el vecindario inmediato.
- **Pan / zoom / pinch** se conservan.
- El tamaño del nodo se deriva del grado de conexión, con mínimos visuales por tipo.
- Las relaciones muestran su etiqueta en el lienzo.
- Las relaciones propuestas siguen visualmente diferenciadas y no se presentan como activas.

## Fuente de verdad

Supabase permanece como fuente canónica. El grafo proyecta:

- `entity_relations`
- `link_world_relations`
- relaciones derivadas de foreign keys
- fichas `link_world_businesses`, `link_world_clients`, `link_world_products`

La lógica investigada también está persistida en:

`deep_memories.memory_key = link_world:obsidian_graph_reader_v1`

y su aprendizaje en `link_learnings` con `source_ref = obsidian_graph_reader_v1`.

## Regla de evolución

Una mejora visual de Micelio solo cuenta como evolución si mejora al menos una de estas capacidades:

- descubrir conexiones;
- comprender el tipo/estado de una relación;
- aislar contexto local;
- navegar a una ficha canónica;
- reconocer estructura global;
- detectar propuestas o huecos de relación.
