export default class TableDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Table with data","expected":"renders table with headers and three rows","kind":"script","content":"const table = await slice.build('Table', {\r\n  headers: ['Feature', 'Version', 'Release'],\r\n  rows: [\r\n    ['Card component', '1.0.0', '2026-01-15'],\r\n    ['Route sync', '1.0.1', '2026-02-01'],\r\n    ['Tabs component', '1.1.0', '2026-03-10']\r\n  ]\r\n});\r\n\r\nreturn table;"},{"label":"Rich cells (DOM nodes + trusted HTML)","expected":"cells hold real components and opt-in HTML; plain strings stay escaped","kind":"script","content":"const viewBtn = await slice.build('Button', { value: 'View' });\r\nconst installBtn = await slice.build('Button', { value: 'Install' });\r\n\r\nconst table = await slice.build('Table', {\r\n  headers: ['Package', 'Status', 'Action'],\r\n  rows: [\r\n    // { html } is an explicit opt-in for TRUSTED markup; plain strings are escaped.\r\n    ['slice.js',  { html: '<span style=\"color:var(--success-color)\">Published</span>' }, viewBtn],\r\n    ['slice-cli', { html: '<span style=\"color:var(--primary-color)\">Beta</span>' }, installBtn]\r\n  ]\r\n});\r\n\r\nreturn table;"},{"label":"Sortable + paginated","expected":"sortable columns, 5 rows per page, with a pager","kind":"script","content":"const people = Array.from({ length: 23 }, (_, i) => ({\r\n  name: 'Person ' + String(i + 1).padStart(2, '0'),\r\n  age: 20 + ((i * 7) % 40)\r\n}));\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Name', sortable: true },\r\n    { key: 'age',  label: 'Age',  sortable: true, align: 'right' }\r\n  ],\r\n  rows: people,\r\n  pagination: { pageSize: 5 },\r\n  defaultSort: { key: 'name', direction: 'asc' }\r\n});\r\n\r\nreturn table;"},{"label":"Header variants","expected":"three tables; solid reproduces the legacy look","kind":"script","content":"const solid = await slice.build('Table', {\r\n  headers: ['Name', 'Role'],\r\n  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],\r\n  headerVariant: 'solid'\r\n});\r\n\r\nconst plain = await slice.build('Table', {\r\n  headers: ['Name', 'Role'],\r\n  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],\r\n  headerVariant: 'none'\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.append(solid, plain);\r\nreturn wrapper;"},{"label":"Numbers align themselves","expected":"the Score column is right-aligned with tabular digits","kind":"script","content":"const table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Player' },\r\n    { key: 'score', label: 'Score' }\r\n  ],\r\n  rows: [\r\n    { name: 'Ada', score: 1280 },\r\n    { name: 'Linus', score: 9953 },\r\n    { name: 'Grace', score: 340 }\r\n  ]\r\n});\r\n\r\nreturn table;"},{"label":"Search + filters + chips","expected":"a toolbar with search and Filters; the panel edits each column by type","kind":"script","content":"const rows = [\r\n  { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, active: true, joined: '2024-03-10', role: 'admin' },\r\n  { id: 2, name: 'Ana López', city: 'Caracas', age: 28, active: false, joined: '2023-11-02', role: 'editor' },\r\n  { id: 3, name: 'Luis Galué', city: 'Maracaibo', age: 41, active: true, joined: '2025-01-20', role: 'viewer' },\r\n  { id: 4, name: 'María Ruiz', city: 'Valencia', age: 52, active: true, joined: '2022-06-15', role: 'editor' },\r\n  { id: 5, name: 'Pedro Díaz', city: 'Mérida', age: 19, active: false, joined: '2024-12-31', role: 'viewer' },\r\n  { id: 6, name: 'Carla Soto', city: 'Caracas', age: 37, active: true, joined: '2024-07-01', role: 'admin' }\r\n];\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Name', sortable: true },\r\n    { key: 'city', label: 'City', filter: 'select' },\r\n    { key: 'age', label: 'Age', sortable: true },\r\n    { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },\r\n    { key: 'joined', label: 'Joined', sortable: true },\r\n    { key: 'role', label: 'Role' }\r\n  ],\r\n  rows,\r\n  rowKey: 'id',\r\n  searchable: true,\r\n  filterable: true,\r\n  filters: [{ key: 'age', type: 'number', op: 'gte', value: 30 }]\r\n});\r\n\r\nreturn table;"},{"label":"Spanish labels and onFilterChange","expected":"the UI is in Spanish and the line below shows the filter state","kind":"script","content":"const state = document.createElement('pre');\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'producto', label: 'Producto' },\r\n    { key: 'precio', label: 'Precio' },\r\n    { key: 'stock', label: 'Stock' }\r\n  ],\r\n  rows: [\r\n    { producto: 'Cuaderno', precio: 4.5, stock: true },\r\n    { producto: 'Agenda 2027', precio: 12, stock: true },\r\n    { producto: 'Stickers', precio: 2, stock: false },\r\n    { producto: 'Libreta kraft', precio: 6, stock: true }\r\n  ],\r\n  searchable: true,\r\n  filterable: true,\r\n  labels: {\r\n    searchPlaceholder: 'Buscar…',\r\n    searchLabel: 'Buscar en la tabla',\r\n    filters: 'Filtros',\r\n    clearAll: 'Limpiar todo',\r\n    clearFilters: 'Limpiar filtros',\r\n    showing: '{shown} de {total} filas',\r\n    noResults: 'Ninguna fila coincide con los filtros.',\r\n    searchChip: 'Búsqueda',\r\n    removeFilter: 'Quitar filtro',\r\n    any: 'Cualquiera', yes: 'Sí', no: 'No', from: 'Desde', to: 'Hasta', value: 'Valor', operator: 'Condición',\r\n    operators: { contains: 'contiene', eq: 'igual a', gt: 'mayor que', lt: 'menor que', between: 'entre', is: 'es' }\r\n  },\r\n  onFilterChange: (value) => { state.textContent = JSON.stringify(value); }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.append(table, state);\r\nreturn host;"},{"label":"Selection and row clicks","expected":"checkboxes with select-all; clicking a row shows it below","kind":"script","content":"const out = document.createElement('p');\r\nout.textContent = 'Click a row or select some.';\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }],\r\n  rows: [\r\n    { id: 'u1', name: 'Ana', role: 'admin' },\r\n    { id: 'u2', name: 'Luis', role: 'editor' },\r\n    { id: 'u3', name: 'María', role: 'viewer' },\r\n    { id: 'u4', name: 'Pedro', role: 'editor' }\r\n  ],\r\n  rowKey: 'id',\r\n  selection: 'multiple',\r\n  selected: ['u2'],\r\n  onSelectionChange: (keys, rows) => { out.textContent = `Selected: ${rows.map((r) => r.name).join(', ') || 'none'}`; },\r\n  onRowClick: (row) => { out.textContent = `Clicked: ${row.name}`; }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.append(table, out);\r\nreturn host;"},{"label":"20,000 rows, virtual + sticky column","expected":"smooth scrolling through 20,000 rows; the Device column stays pinned","kind":"script","content":"const sites = ['North plant', 'South plant', 'Datacenter'];\r\nconst rows = Array.from({ length: 20000 }, (_, i) => ({\r\n  id: i + 1,\r\n  device: `PLC-${String(i + 1).padStart(5, '0')}`,\r\n  site: sites[i % 3],\r\n  temp: 20 + ((i * 13) % 60),\r\n  load: (i * 7) % 100,\r\n  online: i % 7 !== 0\r\n}));\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'device', label: 'Device', sticky: true, sortable: true, width: 130 },\r\n    { key: 'site', label: 'Site', width: 150, filter: 'select' },\r\n    { key: 'temp', label: 'Temp °C', sortable: true, width: 110 },\r\n    { key: 'load', label: 'Load %', sortable: true, width: 110 },\r\n    { key: 'online', label: 'Online', width: 100, render: (row) => (row.online ? 'Yes' : 'No') }\r\n  ],\r\n  rows,\r\n  rowKey: 'id',\r\n  virtual: true,\r\n  maxHeight: '420px',\r\n  rowHeight: 40,\r\n  searchable: true,\r\n  filterable: true,\r\n  selection: 'multiple'\r\n});\r\n\r\nreturn table;"}];
  }

  async init() {
    this.markdownPath = "table.md";
    this.markdownContent = "---\r\ntitle: Table\r\nroute: /docs/data/table\r\nnavLabel: Table\r\nsection: Data\r\ngroup: Tables\r\norder: 10\r\ndescription: Data table with sorting, pagination, search, typed filters, selection, sticky layout and virtual scrolling.\r\ncomponent: TableDocumentation\r\ngenerate: true\r\ntags: [table, data, display, filter, search, selection, virtual]\r\n---\r\n\r\n# Table\r\n\r\n## Overview\r\n`Table` renders a structured HTML table from `headers` and `rows` arrays. Responsive by default with label-based cell display on narrow viewports.\r\n\r\n## API and Behavior\r\n- `headers` (array of strings) defines the table header row (rendered as `<th scope=\"col\">`).\r\n- `rows` (array of arrays) defines data rows. Each cell can be:\r\n  - a **string / number** → rendered as text (escaped, safe by default),\r\n  - a **DOM node** (e.g. a built component) → appended as-is,\r\n  - `{ html: '<...>' }` → explicit opt-in for **trusted** raw HTML.\r\n- Both props are reactive: setting `rows` again re-renders every cell, so in-place edits to row objects show up. Sorting, filtering, paging and scrolling reuse the rows that did not change instead of rebuilding the body.\r\n- Empty arrays render no table content.\r\n\r\n## Columns, sorting and pagination\r\nFor richer tables, use `columns` instead of `headers` — an array of column descriptors. Rows can then\r\nbe **objects** keyed by `key` (positional `headers` + array rows still work as before).\r\n\r\n- `columns`: `[{ key, label, sortable, align, render }]`.\r\n  - `key` — property to read from each row object (or column index for array rows).\r\n  - `label` — header text. `align` — `'left' | 'center' | 'right'`.\r\n  - `sortable` — make the column clickable to sort. `render(row)` — return a string / DOM node / `{ html }` for custom cells.\r\n  - A column whose rendered values are **all numbers** right-aligns itself (header included) with tabular\r\n    figures, unless you set `align` explicitly.\r\n- `sortable` (boolean) — default sortability for every column when not set per-column.\r\n- `defaultSort` — `{ key, direction: 'asc' | 'desc' }` applied on first render.\r\n- `pagination` — `true` or `{ pageSize }` to page the rows (renders a `Pagination` control). Reactive:\r\n  it can be turned on/off or resized at runtime — the pager is shown/hidden and the page size updated,\r\n  never destroyed and rebuilt.\r\n- `emptyMessage` — text shown when there are columns but no rows.\r\n- `headerVariant` — `'tinted'` (default) | `'solid'` | `'none'`. The default header is a quiet tint with\r\n  small uppercase labels; `'solid'` reproduces the older saturated `--primary-color` fill, and `'none'`\r\n  drops the fill but keeps the label treatment. Any unknown value falls back to `'tinted'`.\r\n- `onSortChange({ key, direction } | null)` and `onPageChange(page)` — fire on each change.\r\n\r\nClicking a sortable header cycles **ascending → descending → unsorted**, and sorting returns to page 1.\r\nSortable headers are keyboard-operable: they are focusable (`tabindex=\"0\"`) and respond to **Enter** /\r\n**Space**, with `aria-sort` kept in sync.\r\n\r\n- `loading` (boolean) — shows a self-contained busy overlay (a CSS spinner, no dependency on the\r\n  `Loading` component) and sets `aria-busy`. Drive it yourself in remote mode: set `true` before\r\n  fetching a page, `false` when the new `rows` are in.\r\n\r\n## Local vs remote data (`dataSource`)\r\n- **`'local'`** (default): you give the table **all** the rows; it sorts and paginates them itself.\r\n- **`'remote'`**: `rows` is just the **current page** (already sorted/sliced upstream, e.g. by a server).\r\n  The table renders it as-is, tracks the page/sort state, and **emits** `onSortChange` / `onPageChange`\r\n  so you can fetch the next slice. Provide `totalItems` so the pager can compute the page count.\r\n\r\nIn remote mode the table never re-orders or slices your rows — supplying the next page is your job.\r\n\r\n## Live Preview\r\n:::component name=\"Table\"\r\n{\r\n  \"headers\": [\r\n    \"Name\",\r\n    \"Role\",\r\n    \"Status\"\r\n  ],\r\n  \"rows\": [\r\n    [\r\n      \"Alice\",\r\n      \"Engineer\",\r\n      \"Active\"\r\n    ],\r\n    [\r\n      \"Bob\",\r\n      \"Designer\",\r\n      \"Away\"\r\n    ],\r\n    [\r\n      \"Carol\",\r\n      \"Manager\",\r\n      \"Active\"\r\n    ]\r\n  ]\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"Table with data\" expected=\"renders table with headers and three rows\"\r\nconst table = await slice.build('Table', {\r\n  headers: ['Feature', 'Version', 'Release'],\r\n  rows: [\r\n    ['Card component', '1.0.0', '2026-01-15'],\r\n    ['Route sync', '1.0.1', '2026-02-01'],\r\n    ['Tabs component', '1.1.0', '2026-03-10']\r\n  ]\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n:::script label=\"Rich cells (DOM nodes + trusted HTML)\" expected=\"cells hold real components and opt-in HTML; plain strings stay escaped\"\r\nconst viewBtn = await slice.build('Button', { value: 'View' });\r\nconst installBtn = await slice.build('Button', { value: 'Install' });\r\n\r\nconst table = await slice.build('Table', {\r\n  headers: ['Package', 'Status', 'Action'],\r\n  rows: [\r\n    // { html } is an explicit opt-in for TRUSTED markup; plain strings are escaped.\r\n    ['slice.js',  { html: '<span style=\"color:var(--success-color)\">Published</span>' }, viewBtn],\r\n    ['slice-cli', { html: '<span style=\"color:var(--primary-color)\">Beta</span>' }, installBtn]\r\n  ]\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n:::script label=\"Sortable + paginated\" expected=\"sortable columns, 5 rows per page, with a pager\"\r\nconst people = Array.from({ length: 23 }, (_, i) => ({\r\n  name: 'Person ' + String(i + 1).padStart(2, '0'),\r\n  age: 20 + ((i * 7) % 40)\r\n}));\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Name', sortable: true },\r\n    { key: 'age',  label: 'Age',  sortable: true, align: 'right' }\r\n  ],\r\n  rows: people,\r\n  pagination: { pageSize: 5 },\r\n  defaultSort: { key: 'name', direction: 'asc' }\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n:::tip\r\nCells holding a built component are **owned by the table**. A re-render — sorting, paging, or new `rows`\r\n— destroys the components it replaces, so they never pile up in memory. The table never destroys a node\r\nit is about to show again, so re-passing the same node on every render is safe too.\r\n:::\r\n\r\n## Header style\r\nThe header is a quiet tint by default, so it does not compete with the page's primary actions.\r\n`headerVariant: 'solid'` restores the older saturated fill, `'none'` removes the fill entirely:\r\n\r\n:::script label=\"Header variants\" expected=\"three tables; solid reproduces the legacy look\"\r\nconst solid = await slice.build('Table', {\r\n  headers: ['Name', 'Role'],\r\n  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],\r\n  headerVariant: 'solid'\r\n});\r\n\r\nconst plain = await slice.build('Table', {\r\n  headers: ['Name', 'Role'],\r\n  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],\r\n  headerVariant: 'none'\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.append(solid, plain);\r\nreturn wrapper;\r\n:::\r\n\r\n## Match the column, not just the cell\r\nA numeric column right-aligns and uses tabular figures on its own, header included:\r\n\r\n:::script label=\"Numbers align themselves\" expected=\"the Score column is right-aligned with tabular digits\"\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Player' },\r\n    { key: 'score', label: 'Score' }\r\n  ],\r\n  rows: [\r\n    { name: 'Ada', score: 1280 },\r\n    { name: 'Linus', score: 9953 },\r\n    { name: 'Grace', score: 340 }\r\n  ]\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n## Search\r\n`searchable: true` adds a search box above the table.\r\n\r\n- It matches every column whose `searchable` is not `false`, ignoring case and accents: \"jose\" finds \"José\".\r\n- Several words must all match, each in any column: \"ana caracas\" finds Ana in Caracas.\r\n- The search reads the **data** (`row[key]`), not what `render` draws. Give a column `searchValue` (a function or a path such as `'user.name'`) to search something else.\r\n- Typing is debounced; **Enter** applies at once and **Escape** clears the box.\r\n- `search` sets the query from code. That does not fire `onFilterChange`.\r\n\r\n## Filters\r\n`filterable: true` adds a **Filters** button that opens a panel with one editor per column. The editor's type comes from the column's `filter`, or is inferred from the data:\r\n\r\n| Type | Operators | Editor |\r\n| --- | --- | --- |\r\n| `text` | contains, does not contain, is, is not, starts with, ends with, is empty, is not empty | text box |\r\n| `number` | =, ≠, >, ≥, <, ≤, between, is empty, is not empty | one or two number boxes |\r\n| `boolean` | yes / no / any | select |\r\n| `date` | on, before, after, between, is empty, is not empty | one or two date pickers |\r\n| `select` | is any of, is none of, is empty, is not empty | a checkbox list of the values |\r\n\r\n- Inference: all numbers → `number`, all booleans → `boolean`, all `Date`s or `YYYY-MM-DD` strings → `date`, a few repeated strings → `select`, anything else → `text`.\r\n- A column sets its own: `filter: 'number'`, or `filter: { type: 'select', options: [{ value, label }], label }`. `filter: false` removes its editor. Without `filterable`, only columns that declare `filter` get one.\r\n- `filterValue` (function or path) reads a different value than `row[key]`, e.g. a nested field.\r\n- Every active filter, and the search, combine with AND.\r\n- Active filters show as **chips** under the toolbar; × removes one and **Clear all** removes everything. The button shows how many filters are active, filtered columns get a dot in their header, and the toolbar reads \"12 of 200 rows\".\r\n- When nothing matches, the table says so and offers a button to clear the filters.\r\n- Dates are compared by local calendar day, so a `Date` at 23:30 and the string `'2024-03-10'` are the same day.\r\n- A half-typed filter (an empty value, a `between` with no bounds) is ignored instead of emptying the table.\r\n- `filters` sets them from code (`[{ key, type, op, value }]`). Methods: `setFilter(key, filter | null)`, `clearFilters()`, `getFilteredRows()`. `el.filters` returns the active ones.\r\n- `onFilterChange({ search, filters })` fires on every user change. With `dataSource: 'remote'` nothing is filtered locally: use it to fetch the matching page.\r\n- `labels` translates every string, partially: `{ filters: 'Filtros', showing: '{shown} de {total}', operators: { gt: 'mayor que' } }`.\r\n\r\n## Selection and row clicks\r\n- `selection: 'multiple'` adds a checkbox per row and a select-all checkbox (indeterminate when some are selected). Select-all takes every row that passes the filters, across pages (only the current page in remote mode). **Shift+click** selects a range.\r\n- `selection: 'single'` uses radio buttons.\r\n- Give `rowKey` (a key, a path or a function) so the selection survives new data. Without it, row objects are identified by reference.\r\n- `selected` sets the selected keys from code; `el.selected` and `getSelectedRows()` read them. `onSelectionChange(keys, rows)` fires on user changes.\r\n- `onRowClick(row, event)` fires on a click anywhere in the row, except on links, buttons and inputs inside it. Rows become focusable, and **Enter** activates them.\r\n\r\n## Sticky header, sticky columns and virtual scrolling\r\n- `maxHeight` ('420px', '60vh') bounds the table and scrolls it inside; add `stickyHeader: true` to keep the header visible.\r\n- `sticky: true` on the leading columns pins them while the table scrolls sideways (the selection column pins with them). Their offsets are measured, so they follow the content.\r\n- `virtual: true` renders only the rows in view plus a few around them, so 100,000 rows scroll smoothly. Rows get a fixed `rowHeight` (44 by default) and long text is truncated, the viewport is `maxHeight` (480px by default), the header is sticky and `pagination` is ignored. Virtual tables keep the table layout on phones instead of switching to cards.\r\n\r\n:::script label=\"Search + filters + chips\" expected=\"a toolbar with search and Filters; the panel edits each column by type\"\r\nconst rows = [\r\n  { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, active: true, joined: '2024-03-10', role: 'admin' },\r\n  { id: 2, name: 'Ana López', city: 'Caracas', age: 28, active: false, joined: '2023-11-02', role: 'editor' },\r\n  { id: 3, name: 'Luis Galué', city: 'Maracaibo', age: 41, active: true, joined: '2025-01-20', role: 'viewer' },\r\n  { id: 4, name: 'María Ruiz', city: 'Valencia', age: 52, active: true, joined: '2022-06-15', role: 'editor' },\r\n  { id: 5, name: 'Pedro Díaz', city: 'Mérida', age: 19, active: false, joined: '2024-12-31', role: 'viewer' },\r\n  { id: 6, name: 'Carla Soto', city: 'Caracas', age: 37, active: true, joined: '2024-07-01', role: 'admin' }\r\n];\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Name', sortable: true },\r\n    { key: 'city', label: 'City', filter: 'select' },\r\n    { key: 'age', label: 'Age', sortable: true },\r\n    { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },\r\n    { key: 'joined', label: 'Joined', sortable: true },\r\n    { key: 'role', label: 'Role' }\r\n  ],\r\n  rows,\r\n  rowKey: 'id',\r\n  searchable: true,\r\n  filterable: true,\r\n  filters: [{ key: 'age', type: 'number', op: 'gte', value: 30 }]\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n:::script label=\"Spanish labels and onFilterChange\" expected=\"the UI is in Spanish and the line below shows the filter state\"\r\nconst state = document.createElement('pre');\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'producto', label: 'Producto' },\r\n    { key: 'precio', label: 'Precio' },\r\n    { key: 'stock', label: 'Stock' }\r\n  ],\r\n  rows: [\r\n    { producto: 'Cuaderno', precio: 4.5, stock: true },\r\n    { producto: 'Agenda 2027', precio: 12, stock: true },\r\n    { producto: 'Stickers', precio: 2, stock: false },\r\n    { producto: 'Libreta kraft', precio: 6, stock: true }\r\n  ],\r\n  searchable: true,\r\n  filterable: true,\r\n  labels: {\r\n    searchPlaceholder: 'Buscar…',\r\n    searchLabel: 'Buscar en la tabla',\r\n    filters: 'Filtros',\r\n    clearAll: 'Limpiar todo',\r\n    clearFilters: 'Limpiar filtros',\r\n    showing: '{shown} de {total} filas',\r\n    noResults: 'Ninguna fila coincide con los filtros.',\r\n    searchChip: 'Búsqueda',\r\n    removeFilter: 'Quitar filtro',\r\n    any: 'Cualquiera', yes: 'Sí', no: 'No', from: 'Desde', to: 'Hasta', value: 'Valor', operator: 'Condición',\r\n    operators: { contains: 'contiene', eq: 'igual a', gt: 'mayor que', lt: 'menor que', between: 'entre', is: 'es' }\r\n  },\r\n  onFilterChange: (value) => { state.textContent = JSON.stringify(value); }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.append(table, state);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"Selection and row clicks\" expected=\"checkboxes with select-all; clicking a row shows it below\"\r\nconst out = document.createElement('p');\r\nout.textContent = 'Click a row or select some.';\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }],\r\n  rows: [\r\n    { id: 'u1', name: 'Ana', role: 'admin' },\r\n    { id: 'u2', name: 'Luis', role: 'editor' },\r\n    { id: 'u3', name: 'María', role: 'viewer' },\r\n    { id: 'u4', name: 'Pedro', role: 'editor' }\r\n  ],\r\n  rowKey: 'id',\r\n  selection: 'multiple',\r\n  selected: ['u2'],\r\n  onSelectionChange: (keys, rows) => { out.textContent = `Selected: ${rows.map((r) => r.name).join(', ') || 'none'}`; },\r\n  onRowClick: (row) => { out.textContent = `Clicked: ${row.name}`; }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.append(table, out);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"20,000 rows, virtual + sticky column\" expected=\"smooth scrolling through 20,000 rows; the Device column stays pinned\"\r\nconst sites = ['North plant', 'South plant', 'Datacenter'];\r\nconst rows = Array.from({ length: 20000 }, (_, i) => ({\r\n  id: i + 1,\r\n  device: `PLC-${String(i + 1).padStart(5, '0')}`,\r\n  site: sites[i % 3],\r\n  temp: 20 + ((i * 13) % 60),\r\n  load: (i * 7) % 100,\r\n  online: i % 7 !== 0\r\n}));\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'device', label: 'Device', sticky: true, sortable: true, width: 130 },\r\n    { key: 'site', label: 'Site', width: 150, filter: 'select' },\r\n    { key: 'temp', label: 'Temp °C', sortable: true, width: 110 },\r\n    { key: 'load', label: 'Load %', sortable: true, width: 110 },\r\n    { key: 'online', label: 'Online', width: 100, render: (row) => (row.online ? 'Yes' : 'No') }\r\n  ],\r\n  rows,\r\n  rowKey: 'id',\r\n  virtual: true,\r\n  maxHeight: '420px',\r\n  rowHeight: 40,\r\n  searchable: true,\r\n  filterable: true,\r\n  selection: 'multiple'\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nKeep row data uniform in length. Mismatched columns may produce uneven layout.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nPlain string cells are escaped, so user data is safe by default. Only the explicit `{ html: '...' }` form is injected as raw HTML — never pass unsanitized user input through it.\r\n:::\r\n\r\n:::warning\r\nDo not keep your own reference to a component you hand to a cell and then expect it to survive a\r\nre-render: the table destroys what it replaces. Build a fresh node per render instead (that is what a\r\n`render(row)` callback naturally does).\r\n:::\r\n\r\n:::warning\r\nIn `virtual` mode every row has the same height (`rowHeight`). Cells that need to wrap, or rich components taller than the row, belong in a paginated table instead.\r\n:::\r\n\r\n:::warning\r\nFilters and search read the row DATA. A column whose `render` shows something different from `row[key]` (a formatted date, a label for a code) should give `filterValue` / `searchValue`, or the filter will compare against the raw value.\r\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"headers\": [\r\n    \"Name\",\r\n    \"Role\",\r\n    \"Status\"\r\n  ],\r\n  \"rows\": [\r\n    [\r\n      \"Alice\",\r\n      \"Engineer\",\r\n      \"Active\"\r\n    ],\r\n    [\r\n      \"Bob\",\r\n      \"Designer\",\r\n      \"Away\"\r\n    ],\r\n    [\r\n      \"Carol\",\r\n      \"Manager\",\r\n      \"Active\"\r\n    ]\r\n  ]\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"headers\": [\r\n    \"Name\",\r\n    \"Role\",\r\n    \"Status\"\r\n  ],\r\n  \"rows\": [\r\n    [\r\n      \"Alice\",\r\n      \"Engineer\",\r\n      \"Active\"\r\n    ],\r\n    [\r\n      \"Bob\",\r\n      \"Designer\",\r\n      \"Away\"\r\n    ],\r\n    [\r\n      \"Carol\",\r\n      \"Manager\",\r\n      \"Active\"\r\n    ]\r\n  ]\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Table', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const lines = ["| Type | Operators | Editor |\r","| --- | --- | --- |\r","| `text` | contains, does not contain, is, is not, starts with, ends with, is empty, is not empty | text box |\r","| `number` | =, ≠, >, ≥, <, ≤, between, is empty, is not empty | one or two number boxes |\r","| `boolean` | yes / no / any | select |\r","| `date` | on, before, after, between, is empty, is not empty | one or two date pickers |\r","| `select` | is any of, is none of, is empty, is not empty | a checkbox list of the values |\r"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-12"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"headers\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"sortable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"defaultSort\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pagination\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"dataSource\",\"type\":\"string\",\"required\":false,\"default\":\"local\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"emptyMessage\",\"type\":\"string\",\"required\":false,\"default\":\"No data\",\"allowedValues\":[]},{\"path\":\"headerVariant\",\"type\":\"string\",\"required\":false,\"default\":\"tinted\",\"allowedValues\":[\"tinted\",\"solid\",\"none\"]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"searchPlaceholder\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"search\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"filterable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"filters\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onFilterChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labels\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"rowKey\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"selection\",\"type\":\"string\",\"required\":false,\"default\":\"none\",\"allowedValues\":[\"none\",\"single\",\"multiple\"]},{\"path\":\"selected\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSelectionChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onRowClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"stickyHeader\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"maxHeight\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"virtual\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"rowHeight\",\"type\":\"number\",\"required\":false,\"default\":\"44\",\"allowedValues\":[]},{\"path\":\"onSortChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"headers\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"sortable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"defaultSort\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pagination\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"dataSource\",\"type\":\"string\",\"required\":false,\"default\":\"local\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"emptyMessage\",\"type\":\"string\",\"required\":false,\"default\":\"No data\",\"allowedValues\":[]},{\"path\":\"headerVariant\",\"type\":\"string\",\"required\":false,\"default\":\"tinted\",\"allowedValues\":[\"tinted\",\"solid\",\"none\"]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"searchPlaceholder\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"search\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"filterable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"filters\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onFilterChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labels\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"rowKey\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"selection\",\"type\":\"string\",\"required\":false,\"default\":\"none\",\"allowedValues\":[\"none\",\"single\",\"multiple\"]},{\"path\":\"selected\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSelectionChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onRowClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"stickyHeader\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"maxHeight\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"virtual\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"rowHeight\",\"type\":\"number\",\"required\":false,\"default\":\"44\",\"allowedValues\":[]},{\"path\":\"onSortChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

  beforeDestroy() {
    // Cleanup timers, listeners, or pending work here
  }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: '❐'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-tabledocumentation', TableDocumentation);
