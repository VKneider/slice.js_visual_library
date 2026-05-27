# Diseno: mejora de UX visual + parser static props (hibrido)

Fecha: 2026-05-26
Repositorio: `slice.js_visual_library`
Estado: Aprobado en conversacion, pendiente de implementacion

## Objetivo

Mejorar la experiencia de documentacion de la libreria visual en tres frentes:

1. Corregir espaciados y offsets entre navbar fijo, contenido central y menus laterales.
2. Mejorar estetica general (menos ruido de bordes/contenedores) sin romper patrones existentes.
3. Mejorar navegacion del menu izquierdo para componentes visuales con menos dispersion visual y busqueda local.
4. Corregir/expandir la generacion de docs desde `static props` para soportar objetos con salida hibrida.

## Alcance

Incluye:

- Ajustes de layout y estilos en shell de docs.
- Busqueda en menu izquierdo (solo panel lateral).
- Compactacion visual de arbol para facilitar navegacion de componentes.
- Generacion hibrida de tabla de props para `object` y `array<object>`.
- Ajustes en `CodeVisualizer` de esta libreria (`src/Components/Visual/CodeVisualizer/CodeVisualizer.js` + estilos asociados).

No incluye:

- Cambios estructurales profundos de taxonomia en markdown/front matter.
- Buscador global en contenido central.
- Reescritura completa del componente `TreeView`.

## Situacion actual observada

- El contenido central usa margenes superiores/laterales fijos que no siempre sincronizan con la altura efectiva del navbar fijo.
- Menus laterales izquierdo y derecho usan offsets/hardcodes propios (`top: 72px`, etc.) y generan desalineacion visual.
- Hay exceso de bordes en varios contenedores, lo que recarga la lectura.
- En navegacion, la presentacion del arbol visual se percibe dispersa.
- El parser ya extrae `static props`, pero para objetos la tabla prioriza subrutas y no ofrece contexto raiz + esquema completo en modo hibrido.

## Diseno tecnico

### 1) Layout y espaciado del shell

Estrategia:

- Definir una referencia unica de offset superior (altura navbar) para contenido y sidebars.
- Reemplazar valores duplicados por variables CSS compartidas en el shell de docs.
- Ajustar `slice-components-page slice-multi-route` para eliminar margen superior excesivo y mantener espacio consistente en desktop/mobile.

Componentes/archivos objetivo:

- `src/Components/AppComponents/ComponentsPage/ComponentsPage.css`
- `src/Components/AppComponents/MainMenu/MainMenu.css`
- `src/Components/AppComponents/MyNavigation/MyNavigation.css`
- `src/Components/Visual/Navbar/Navbar.css` (solo si se requiere alinear altura real)

Resultado esperado:

- Sin salto vertical perceptible bajo navbar.
- Menus laterales alineados con inicio de contenido.
- Comportamiento responsive mantenido.

### 2) Estetica (reduccion de ruido visual)

Estrategia:

- Reducir bordes de alto contraste en bloques de docs.
- Mantener jerarquia con espaciado, contraste suave y pesos tipograficos en lugar de cajas repetidas.
- Ajustar `CodeVisualizer` para integrarse visualmente con docs (sin apariencia de contenedor pesado).

Componentes/archivos objetivo:

- `src/Components/Visual/CodeVisualizer/CodeVisualizer.css`
- Ajustes menores de estilos de docs si hacen falta en shell compartido.

Resultado esperado:

- UI mas limpia y legible.
- Menor sensacion de "bloques encerrados".

### 3) Navegacion izquierda: compactacion visual + busqueda

Requisito acordado:

- Busqueda solo en menu izquierdo.

Estrategia:

- Mantener `docsIndex` como fuente canonica de informacion.
- Aplicar transformacion de presentacion para la seccion visual: menos dispersion en ramas visibles y orden mas navegable.
- Agregar input de busqueda en `MainMenu` para filtrar en vivo por `title`, `navLabel` y `tags`.
- El filtrado opera sobre items normalizados y reconstruye los nodos visibles del arbol.

Comportamiento de busqueda:

- Filtrado incremental mientras se escribe.
- Solo mostrar nodos con coincidencia directa o por descendencia.
- Estado vacio cuando no hay resultados.
- Navegacion por `path` intacta al hacer click.

Componentes/archivos objetivo:

- `src/Components/AppComponents/ComponentsPage/visualComponentRoutes.js` (normalizacion/agrupacion para menu)
- `src/Components/AppComponents/ComponentsPage/ComponentsPage.js` (orquestacion de menu + tree + filtro)
- `src/Components/AppComponents/MainMenu/MainMenu.js` y su template/estilos (input search)

### 4) Parser `static props` con salida hibrida para objetos

Requisito acordado:

- Formato hibrido.

Estrategia:

- Mantener fila raiz para cada prop `object` (ej. `config`).
- Mantener filas aplanadas para campos internos (ej. `config.theme`, `config.layout.compact`).
- Agregar detalle expandible con schema JSON normalizado para la prop raiz objeto.
- Para arrays de objetos, mantener convencion `items[]` y subrutas `items[].campo`.

Representacion en markdown generado:

- Tabla principal sigue siendo `Props (Generated from static props)`.
- Para filas raiz tipo objeto se anade bloque `details` con JSON legible del schema.
- Campos sin informacion suficiente mantienen fallback seguro (`-` o literal).

Archivo objetivo:

- `parser/lib/staticPropsDocs.js`

### 5) Riesgos y mitigaciones

- Riesgo: romper alineacion en mobile al ajustar offsets.
  - Mitigacion: mantener breakpoints actuales y validar en ancho <= 770px.
- Riesgo: filtro genere arbol inconsistente.
  - Mitigacion: normalizar estructura antes de render y testear casos sin resultados.
- Riesgo: parser produzca markdown ambiguo para objetos profundos.
  - Mitigacion: tests de snapshots/cadenas para nested object y array<object>.

## Pruebas y verificacion

Validaciones de parser:

- Ejecutar test suite existente de `parser/tests`.
- Agregar test para salida hibrida (fila raiz + flatten + bloque schema).

Validaciones de docs/app:

- `npm run docs:lint-md`
- `npm run docs:generate`
- Smoke test en `/docs`:
  - offset bajo navbar,
  - sidebars alineados,
  - busqueda izquierda funcionando,
  - estado vacio de busqueda,
  - navegacion de rutas sin regresion,
  - apariencia de `CodeVisualizer` consistente.

## Criterios de exito

- El espacio superior bajo navbar deja de verse excesivo.
- Sidebars y contenido central comparten referencia vertical coherente.
- Navegacion izquierda es mas facil de recorrer y filtrar.
- Busqueda local en menu izquierdo responde por titulo/label/tags.
- La docs generada para props tipo object muestra vista hibrida util (raiz + detalle + subcampos).

## Plan de implementacion (alto nivel)

1. Ajustar variables/offsets del shell y sidebars.
2. Limpiar estilo visual de contenedores y `CodeVisualizer`.
3. Integrar search en `MainMenu` y filtrado de nodos del arbol.
4. Implementar salida hibrida de static props en parser.
5. Cubrir casos con tests y regenerar docs.
