---
title: Table
route: /docs/data/table
navLabel: Table
section: Data
group: Tables
order: 10
description: Data table with sorting, pagination, search, typed filters, selection, sticky layout and virtual scrolling.
component: TableDocumentation
generate: true
tags: [table, data, display, filter, search, selection, virtual]
---

# Table

## Overview
`Table` renders a structured HTML table from `headers` and `rows` arrays. Responsive by default with label-based cell display on narrow viewports.

## API and Behavior
- `headers` (array of strings) defines the table header row (rendered as `<th scope="col">`).
- `rows` (array of arrays) defines data rows. Each cell can be:
  - a **string / number** → rendered as text (escaped, safe by default),
  - a **DOM node** (e.g. a built component) → appended as-is,
  - `{ html: '<...>' }` → explicit opt-in for **trusted** raw HTML.
- Both props are reactive: setting `rows` again re-renders every cell, so in-place edits to row objects show up. Sorting, filtering, paging and scrolling reuse the rows that did not change instead of rebuilding the body.
- Empty arrays render no table content.

## Columns, sorting and pagination
For richer tables, use `columns` instead of `headers` — an array of column descriptors. Rows can then
be **objects** keyed by `key` (positional `headers` + array rows still work as before).

- `columns`: `[{ key, label, sortable, align, render }]`.
  - `key` — property to read from each row object (or column index for array rows).
  - `label` — header text. `align` — `'left' | 'center' | 'right'`.
  - `sortable` — make the column clickable to sort. `render(row)` — return a string / DOM node / `{ html }` for custom cells.
  - A column whose rendered values are **all numbers** right-aligns itself (header included) with tabular
    figures, unless you set `align` explicitly.
- `sortable` (boolean) — default sortability for every column when not set per-column.
- `defaultSort` — `{ key, direction: 'asc' | 'desc' }` applied on first render.
- `pagination` — `true` or `{ pageSize }` to page the rows (renders a `Pagination` control). Reactive:
  it can be turned on/off or resized at runtime — the pager is shown/hidden and the page size updated,
  never destroyed and rebuilt.
- `emptyMessage` — text shown when there are columns but no rows.
- `headerVariant` — `'tinted'` (default) | `'solid'` | `'none'`. The default header is a quiet tint with
  small uppercase labels; `'solid'` reproduces the older saturated `--primary-color` fill, and `'none'`
  drops the fill but keeps the label treatment. Any unknown value falls back to `'tinted'`.
- `onSortChange({ key, direction } | null)` and `onPageChange(page)` — fire on each change.

Clicking a sortable header cycles **ascending → descending → unsorted**, and sorting returns to page 1.
Sortable headers are keyboard-operable: they are focusable (`tabindex="0"`) and respond to **Enter** /
**Space**, with `aria-sort` kept in sync.

- `loading` (boolean) — shows a self-contained busy overlay (a CSS spinner, no dependency on the
  `Loading` component) and sets `aria-busy`. Drive it yourself in remote mode: set `true` before
  fetching a page, `false` when the new `rows` are in.

## Local vs remote data (`dataSource`)
- **`'local'`** (default): you give the table **all** the rows; it sorts and paginates them itself.
- **`'remote'`**: `rows` is just the **current page** (already sorted/sliced upstream, e.g. by a server).
  The table renders it as-is, tracks the page/sort state, and **emits** `onSortChange` / `onPageChange`
  so you can fetch the next slice. Provide `totalItems` so the pager can compute the page count.

In remote mode the table never re-orders or slices your rows — supplying the next page is your job.

## Live Preview
:::component name="Table"
{
  "headers": [
    "Name",
    "Role",
    "Status"
  ],
  "rows": [
    [
      "Alice",
      "Engineer",
      "Active"
    ],
    [
      "Bob",
      "Designer",
      "Away"
    ],
    [
      "Carol",
      "Manager",
      "Active"
    ]
  ]
}
:::

## Prop Scenarios
:::script label="Table with data" expected="renders table with headers and three rows"
const table = await slice.build('Table', {
  headers: ['Feature', 'Version', 'Release'],
  rows: [
    ['Card component', '1.0.0', '2026-01-15'],
    ['Route sync', '1.0.1', '2026-02-01'],
    ['Tabs component', '1.1.0', '2026-03-10']
  ]
});

return table;
:::

:::script label="Rich cells (DOM nodes + trusted HTML)" expected="cells hold real components and opt-in HTML; plain strings stay escaped"
const viewBtn = await slice.build('Button', { value: 'View' });
const installBtn = await slice.build('Button', { value: 'Install' });

const table = await slice.build('Table', {
  headers: ['Package', 'Status', 'Action'],
  rows: [
    // { html } is an explicit opt-in for TRUSTED markup; plain strings are escaped.
    ['slice.js',  { html: '<span style="color:var(--success-color)">Published</span>' }, viewBtn],
    ['slice-cli', { html: '<span style="color:var(--primary-color)">Beta</span>' }, installBtn]
  ]
});

return table;
:::

:::script label="Sortable + paginated" expected="sortable columns, 5 rows per page, with a pager"
const people = Array.from({ length: 23 }, (_, i) => ({
  name: 'Person ' + String(i + 1).padStart(2, '0'),
  age: 20 + ((i * 7) % 40)
}));

const table = await slice.build('Table', {
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'age',  label: 'Age',  sortable: true, align: 'right' }
  ],
  rows: people,
  pagination: { pageSize: 5 },
  defaultSort: { key: 'name', direction: 'asc' }
});

return table;
:::

:::tip
Cells holding a built component are **owned by the table**. A re-render — sorting, paging, or new `rows`
— destroys the components it replaces, so they never pile up in memory. The table never destroys a node
it is about to show again, so re-passing the same node on every render is safe too.
:::

## Header style
The header is a quiet tint by default, so it does not compete with the page's primary actions.
`headerVariant: 'solid'` restores the older saturated fill, `'none'` removes the fill entirely:

:::script label="Header variants" expected="three tables; solid reproduces the legacy look"
const solid = await slice.build('Table', {
  headers: ['Name', 'Role'],
  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],
  headerVariant: 'solid'
});

const plain = await slice.build('Table', {
  headers: ['Name', 'Role'],
  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],
  headerVariant: 'none'
});

const wrapper = document.createElement('div');
wrapper.append(solid, plain);
return wrapper;
:::

## Match the column, not just the cell
A numeric column right-aligns and uses tabular figures on its own, header included:

:::script label="Numbers align themselves" expected="the Score column is right-aligned with tabular digits"
const table = await slice.build('Table', {
  columns: [
    { key: 'name', label: 'Player' },
    { key: 'score', label: 'Score' }
  ],
  rows: [
    { name: 'Ada', score: 1280 },
    { name: 'Linus', score: 9953 },
    { name: 'Grace', score: 340 }
  ]
});

return table;
:::

## Search
`searchable: true` adds a search box above the table.

- It matches every column whose `searchable` is not `false`, ignoring case and accents: "jose" finds "José".
- Several words must all match, each in any column: "ana caracas" finds Ana in Caracas.
- The search reads the **data** (`row[key]`), not what `render` draws. Give a column `searchValue` (a function or a path such as `'user.name'`) to search something else.
- Typing is debounced; **Enter** applies at once and **Escape** clears the box.
- `search` sets the query from code. That does not fire `onFilterChange`.

## Filters
`filterable: true` adds a **Filters** button that opens a panel with one editor per column. The editor's type comes from the column's `filter`, or is inferred from the data:

| Type | Operators | Editor |
| --- | --- | --- |
| `text` | contains, does not contain, is, is not, starts with, ends with, is empty, is not empty | text box |
| `number` | =, ≠, >, ≥, <, ≤, between, is empty, is not empty | one or two number boxes |
| `boolean` | yes / no / any | select |
| `date` | on, before, after, between, is empty, is not empty | one or two date pickers |
| `select` | is any of, is none of, is empty, is not empty | a checkbox list of the values |

- Inference: all numbers → `number`, all booleans → `boolean`, all `Date`s or `YYYY-MM-DD` strings → `date`, a few repeated strings → `select`, anything else → `text`.
- A column sets its own: `filter: 'number'`, or `filter: { type: 'select', options: [{ value, label }], label }`. `filter: false` removes its editor. Without `filterable`, only columns that declare `filter` get one.
- `filterValue` (function or path) reads a different value than `row[key]`, e.g. a nested field.
- Every active filter, and the search, combine with AND.
- Active filters show as **chips** under the toolbar; × removes one and **Clear all** removes everything. The button shows how many filters are active, filtered columns get a dot in their header, and the toolbar reads "12 of 200 rows".
- When nothing matches, the table says so and offers a button to clear the filters.
- Dates are compared by local calendar day, so a `Date` at 23:30 and the string `'2024-03-10'` are the same day.
- A half-typed filter (an empty value, a `between` with no bounds) is ignored instead of emptying the table.
- `filters` sets them from code (`[{ key, type, op, value }]`). Methods: `setFilter(key, filter | null)`, `clearFilters()`, `getFilteredRows()`. `el.filters` returns the active ones.
- `onFilterChange({ search, filters })` fires on every user change. With `dataSource: 'remote'` nothing is filtered locally: use it to fetch the matching page.
- `labels` translates every string, partially: `{ filters: 'Filtros', showing: '{shown} de {total}', operators: { gt: 'mayor que' } }`.

## Selection and row clicks
- `selection: 'multiple'` adds a checkbox per row and a select-all checkbox (indeterminate when some are selected). Select-all takes every row that passes the filters, across pages (only the current page in remote mode). **Shift+click** selects a range.
- `selection: 'single'` uses radio buttons.
- Give `rowKey` (a key, a path or a function) so the selection survives new data. Without it, row objects are identified by reference.
- `selected` sets the selected keys from code; `el.selected` and `getSelectedRows()` read them. `onSelectionChange(keys, rows)` fires on user changes.
- `onRowClick(row, event)` fires on a click anywhere in the row, except on links, buttons and inputs inside it. Rows become focusable, and **Enter** activates them.

## Sticky header, sticky columns and virtual scrolling
- `maxHeight` ('420px', '60vh') bounds the table and scrolls it inside; add `stickyHeader: true` to keep the header visible.
- `sticky: true` on the leading columns pins them while the table scrolls sideways (the selection column pins with them). Their offsets are measured, so they follow the content.
- `virtual: true` renders only the rows in view plus a few around them, so 100,000 rows scroll smoothly. Rows get a fixed `rowHeight` (44 by default) and long text is truncated, the viewport is `maxHeight` (480px by default), the header is sticky and `pagination` is ignored. Virtual tables keep the table layout on phones instead of switching to cards.

:::script label="Search + filters + chips" expected="a toolbar with search and Filters; the panel edits each column by type"
const rows = [
  { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, active: true, joined: '2024-03-10', role: 'admin' },
  { id: 2, name: 'Ana López', city: 'Caracas', age: 28, active: false, joined: '2023-11-02', role: 'editor' },
  { id: 3, name: 'Luis Galué', city: 'Maracaibo', age: 41, active: true, joined: '2025-01-20', role: 'viewer' },
  { id: 4, name: 'María Ruiz', city: 'Valencia', age: 52, active: true, joined: '2022-06-15', role: 'editor' },
  { id: 5, name: 'Pedro Díaz', city: 'Mérida', age: 19, active: false, joined: '2024-12-31', role: 'viewer' },
  { id: 6, name: 'Carla Soto', city: 'Caracas', age: 37, active: true, joined: '2024-07-01', role: 'admin' }
];

const table = await slice.build('Table', {
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'city', label: 'City', filter: 'select' },
    { key: 'age', label: 'Age', sortable: true },
    { key: 'active', label: 'Active', render: (row) => (row.active ? 'Yes' : 'No') },
    { key: 'joined', label: 'Joined', sortable: true },
    { key: 'role', label: 'Role' }
  ],
  rows,
  rowKey: 'id',
  searchable: true,
  filterable: true,
  filters: [{ key: 'age', type: 'number', op: 'gte', value: 30 }]
});

return table;
:::

:::script label="Spanish labels and onFilterChange" expected="the UI is in Spanish and the line below shows the filter state"
const state = document.createElement('pre');

const table = await slice.build('Table', {
  columns: [
    { key: 'producto', label: 'Producto' },
    { key: 'precio', label: 'Precio' },
    { key: 'stock', label: 'Stock' }
  ],
  rows: [
    { producto: 'Cuaderno', precio: 4.5, stock: true },
    { producto: 'Agenda 2027', precio: 12, stock: true },
    { producto: 'Stickers', precio: 2, stock: false },
    { producto: 'Libreta kraft', precio: 6, stock: true }
  ],
  searchable: true,
  filterable: true,
  labels: {
    searchPlaceholder: 'Buscar…',
    searchLabel: 'Buscar en la tabla',
    filters: 'Filtros',
    clearAll: 'Limpiar todo',
    clearFilters: 'Limpiar filtros',
    showing: '{shown} de {total} filas',
    noResults: 'Ninguna fila coincide con los filtros.',
    searchChip: 'Búsqueda',
    removeFilter: 'Quitar filtro',
    any: 'Cualquiera', yes: 'Sí', no: 'No', from: 'Desde', to: 'Hasta', value: 'Valor', operator: 'Condición',
    operators: { contains: 'contiene', eq: 'igual a', gt: 'mayor que', lt: 'menor que', between: 'entre', is: 'es' }
  },
  onFilterChange: (value) => { state.textContent = JSON.stringify(value); }
});

const host = document.createElement('div');
host.append(table, state);
return host;
:::

:::script label="Selection and row clicks" expected="checkboxes with select-all; clicking a row shows it below"
const out = document.createElement('p');
out.textContent = 'Click a row or select some.';

const table = await slice.build('Table', {
  columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }],
  rows: [
    { id: 'u1', name: 'Ana', role: 'admin' },
    { id: 'u2', name: 'Luis', role: 'editor' },
    { id: 'u3', name: 'María', role: 'viewer' },
    { id: 'u4', name: 'Pedro', role: 'editor' }
  ],
  rowKey: 'id',
  selection: 'multiple',
  selected: ['u2'],
  onSelectionChange: (keys, rows) => { out.textContent = `Selected: ${rows.map((r) => r.name).join(', ') || 'none'}`; },
  onRowClick: (row) => { out.textContent = `Clicked: ${row.name}`; }
});

const host = document.createElement('div');
host.append(table, out);
return host;
:::

:::script label="20,000 rows, virtual + sticky column" expected="smooth scrolling through 20,000 rows; the Device column stays pinned"
const sites = ['North plant', 'South plant', 'Datacenter'];
const rows = Array.from({ length: 20000 }, (_, i) => ({
  id: i + 1,
  device: `PLC-${String(i + 1).padStart(5, '0')}`,
  site: sites[i % 3],
  temp: 20 + ((i * 13) % 60),
  load: (i * 7) % 100,
  online: i % 7 !== 0
}));

const table = await slice.build('Table', {
  columns: [
    { key: 'device', label: 'Device', sticky: true, sortable: true, width: 130 },
    { key: 'site', label: 'Site', width: 150, filter: 'select' },
    { key: 'temp', label: 'Temp °C', sortable: true, width: 110 },
    { key: 'load', label: 'Load %', sortable: true, width: 110 },
    { key: 'online', label: 'Online', width: 100, render: (row) => (row.online ? 'Yes' : 'No') }
  ],
  rows,
  rowKey: 'id',
  virtual: true,
  maxHeight: '420px',
  rowHeight: 40,
  searchable: true,
  filterable: true,
  selection: 'multiple'
});

return table;
:::

## Best Practices
:::tip
Keep row data uniform in length. Mismatched columns may produce uneven layout.
:::

## Pitfalls
:::warning
Plain string cells are escaped, so user data is safe by default. Only the explicit `{ html: '...' }` form is injected as raw HTML — never pass unsanitized user input through it.
:::

:::warning
Do not keep your own reference to a component you hand to a cell and then expect it to survive a
re-render: the table destroys what it replaces. Build a fresh node per render instead (that is what a
`render(row)` callback naturally does).
:::

:::warning
In `virtual` mode every row has the same height (`rowHeight`). Cells that need to wrap, or rich components taller than the row, belong in a paginated table instead.
:::

:::warning
Filters and search read the row DATA. A column whose `render` shows something different from `row[key]` (a formatted date, a label for a code) should give `filterValue` / `searchValue`, or the filter will compare against the raw value.
:::