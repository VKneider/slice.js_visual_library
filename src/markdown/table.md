---
title: Table
route: /docs/data/table
navLabel: Table
section: Data
group: Tables
order: 10
description: Data table with sorting, pagination, search, typed filters, selection, totals, row detail, custom menus, export, remembered state and virtual scrolling; rows from a slice.context store or a server, add / change / remove with rollback and undo, and cells edited in place like a spreadsheet.
component: TableDocumentation
generate: true
tags: [table, data, display, filter, search, selection, virtual, export, totals, menu, crud, editable, grid, spreadsheet, context]
---

# Table

## Overview
`Table` renders a structured HTML table from `headers` and `rows` arrays. Responsive by default: on phones it scrolls sideways with the first column pinned, or turns into cards (`mobileLayout: 'cards'`).

### When to use it
- **Records compared across the same columns**: orders, invoices, users, stock, logs. People scan down a column, sort it and filter it.
- **Data people work in at the keyboard**: prices, quantities, statuses edited cell by cell, like a spreadsheet.
- **Many rows**: thousands, with virtual scrolling, or a server that pages them (`load`).

### When not to use it
- **Records with a picture, a status and actions, read one by one**: a [DataList](/docs/data/datalist) shows them better, and on a phone.
- **One record with many properties**: a [DescriptionList](/docs/data/description-list).
- **Layout.** A table is for data; for arranging things on a page use [Grid](/docs/layout/grid).

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

## Rows from a store or a server
The same three sources as [DataList](/docs/data/datalist), with the same names:

- `rows`: an array you own.
- `context` and `contextPath`: a `slice.context` store and the path of the array in it (`'items'` by default; `''` when the state is the array). The table follows the store, and every change below is written back to it, so a counter, a chart or a DataList reading the same store sees it at once.
- `load: async ({ page, pageSize, search, filters, sort, signal }) => ({ items, total })`: a server. The table becomes remote and asks again on every sort, page, search or filter (one request for a burst of changes, the previous one cancelled), shows its loading overlay, and on a failure says so with **Try again**. `reload()` asks again. Set `load` when building the table.

## Add, change and remove rows
With `rowKey` set, the table has the CRUD methods DataList has, under the table's own words:

- `addRow(row, { position, commit, highlight })`: the row shows at once, highlighted. With `commit`, a failure takes it out again; a returned object (the server's id, its dates) replaces it.
- `updateRow(key, changes, { commit })`: `changes` are merged into the row (or a function from the row to them). A failed commit puts the row back as it was.
- `removeRow(keys, { commit, undo })`: the rows leave at once. With `undo: true` a bar says "2 rows removed · Undo" for five seconds, and `commit` runs only when that time is over (or the bar is closed). A failed commit brings the rows back where they were.
- `getRow(key)`, and `onError(error, { type, row })` for every failure. Failures also show on the bar, in red.

The arrays are never changed in place: every change makes a new one, the way a store expects, and rows that did not change keep their `<tr>`.

## Editing cells like a spreadsheet
A column with `edit` makes the table a grid of cells: `edit: true`, a control type, or `{ type, options, required, min, max, step, validate(value, row), parse(value) }`, the same options as [DescriptionList](/docs/data/description-list). The control follows the data: a checkbox for yes/no, a number field for numbers, a Select when there are `options` (and the cell shows the option's label), a DatePicker for `type: 'date'`.

| Key | What it does |
| --- | --- |
| Arrows, Home, End | Move the active cell (Ctrl+Home / Ctrl+End: the first and the last). |
| Tab, Shift+Tab | The next or the previous cell; at the edges, Tab leaves the table. |
| Typing | Starts editing and replaces the value. |
| Enter, F2, a double click | Edit with the value there, the caret at the end. On a cell that does not edit, Enter opens the row. |
| Enter while editing | Save and go down. **Tab** saves and goes on; a click elsewhere saves too. |
| Escape | Cancel the edit. |
| Space on a checkbox | Flip it (saved at once). A choice from a list is saved the moment it is made. |
| Delete, Backspace | Empty the cell (not a `required` one). |
| Ctrl/⌘+C | Copy the value. |

Saving: the cell shows the new value at once, busy, and `commit({ row, before, key, value, previous, column })` runs. The row changes when it resolves (a returned object replaces the row); if it throws or returns `false`, the old value is drawn back, the cell outlined in red with the message, and the bar says why. `onCellChange({ row, key, value, previous })` runs after every saved edit. From code: `editCell(rowKey, columnKey)`, `saveCellEdit()`, `cancelCellEdit()`, `focusCell(rowKey, columnKey)`, `activeCell`.

The whole grid is one tab stop: Tab enters it at the active cell, the arrows move inside.

:::script label="Stock you edit like a spreadsheet" expected="a stock table with Product, Category (a list), Stock, Price and Active (a checkbox); click a cell and use the arrows; type to replace a value, Enter saves and goes down, Tab goes on; a price over 1,000 is refused by the pretend server and the cell turns red; the line below shows the stock value, updated after each save; New product adds a row at the top, Delete selected removes the checked rows with Undo"
const products = [
  { id: 1, name: 'Cat6 cable 3 m', category: 'cables', stock: 120, price: 4.5, active: true },
  { id: 2, name: 'USB-C hub', category: 'adapters', stock: 34, price: 39, active: true },
  { id: 3, name: '24-port switch', category: 'network', stock: 6, price: 389, active: true },
  { id: 4, name: 'HDMI cable 2 m', category: 'cables', stock: 0, price: 7.9, active: false },
  { id: 5, name: 'Rack shelf 1U', category: 'racks', stock: 12, price: 54, active: true }
];
if (!slice.context.has('docsStock')) slice.context.create('docsStock', { items: products });
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const summary = document.createElement('p');
summary.style.cssText = 'margin:0;font-variant-numeric:tabular-nums;opacity:.8';
const paint = (items) => {
  const value = items.reduce((sum, p) => sum + p.stock * p.price, 0);
  summary.textContent = `${items.length} products · stock value ${money.format(value)}`;
};
paint(slice.context.getState('docsStock').items);

const stock = await slice.build('Table', {
  context: 'docsStock',
  rowKey: 'id',
  selection: 'multiple',
  sortable: true,
  columns: [
    { key: 'name', label: 'Product', edit: { required: true } },
    { key: 'category', label: 'Category', edit: { options: [
      { value: 'cables', label: 'Cables' }, { value: 'adapters', label: 'Adapters' },
      { value: 'network', label: 'Network' }, { value: 'racks', label: 'Racks' }
    ] } },
    { key: 'stock', label: 'Stock', edit: { min: 0, step: 1 } },
    { key: 'price', label: 'Price', edit: { min: 0, step: 0.01 } },
    { key: 'active', label: 'Active', edit: true }
  ],
  // A pretend server: a short wait, and no price over 1,000.
  commit: async ({ key, value }) => {
    await new Promise((r) => setTimeout(r, 300));
    if (key === 'price' && value > 1000) throw new Error('Prices over 1,000 need approval.');
  },
  onCellChange: () => paint(slice.context.getState('docsStock').items)
});

let next = 100;
const add = await slice.build('Button', {
  value: 'New product', icon: 'plus', variant: 'filled', size: 'sm',
  onClick: async () => {
    await stock.addRow({ id: next++, name: 'New product', category: 'cables', stock: 0, price: 0, active: false });
    stock.editCell(next - 1, 'name');
  }
});
const remove = await slice.build('Button', {
  value: 'Delete selected', icon: 'trash-bin', variant: 'outlined', size: 'sm',
  onClick: () => {
    const keys = stock.getSelectedRows().map((p) => p.id);
    if (keys.length) stock.removeRow(keys, { undo: true });
  }
});
slice.context.watch('docsStock', stock, (items) => paint(items), (state) => state.items);

const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
bar.append(add, remove);
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:10px;width:100%';
box.append(bar, stock, summary);
return box;
:::

:::script label="Orders from a server with load" expected="orders loaded from a pretend server ten at a time, with the loading overlay each time; sorting, searching and changing the page ask the server again; the 'Fail next request' button makes the next load fail and shows Try again"
const statuses = ['Paid', 'Pending', 'Shipped', 'Refunded'];
const all = Array.from({ length: 64 }, (_, i) => ({
  id: 1000 + i,
  customer: ['Ana López', 'Lucas Molina', 'María Ruiz', 'Andrés Bello', 'Sofía Rey'][i % 5],
  status: statuses[i % 4],
  total: Math.round((20 + ((i * 37) % 900)) * 100) / 100
}));
let failNext = false;

const orders = await slice.build('Table', {
  rowKey: 'id',
  searchable: true,
  sortable: true,
  pagination: { pageSize: 10 },
  columns: [
    { key: 'id', label: 'Order' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total' }
  ],
  load: async ({ page, pageSize, search, sort, signal }) => {
    await new Promise((r) => setTimeout(r, 500));
    if (signal.aborted) return [];
    if (failNext) { failNext = false; throw new Error('Server unavailable'); }
    const q = search.toLowerCase();
    let list = all.filter((o) => !q || `${o.id} ${o.customer} ${o.status}`.toLowerCase().includes(q));
    if (sort) list = [...list].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * (sort.direction === 'asc' ? 1 : -1));
    return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length };
  }
});
const fail = await slice.build('Button', {
  value: 'Fail next request', variant: 'outlined', size: 'sm',
  onClick: () => { failNext = true; orders.reload(); }
});
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:10px;width:100%';
box.append(fail, orders);
return box;
:::

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

:::script label="Search + filters + chips + export" expected="a toolbar with search, Filters and Export; the panel edits each column by type"
const rows = [
  { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, active: true, joined: '2024-03-10', role: 'admin' },
  { id: 2, name: 'Ana López', city: 'Caracas', age: 28, active: false, joined: '2023-11-02', role: 'editor' },
  { id: 3, name: 'Lucas Molina', city: 'Maracaibo', age: 41, active: true, joined: '2025-01-20', role: 'viewer' },
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
  exportable: true,
  exportFilename: 'people',
  selection: 'multiple',
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
host.style.width = '100%';
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
host.style.width = '100%';
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

## Export
`exportable: true` adds an **Export** menu: **Download CSV**, **Download JSON** or **Copy to clipboard**.

- It exports the rows that pass the current search and filters, in the current sort order. When rows are selected, the menu also offers **Selected rows**.
- Values come from the row **data** (`exportValue` → `filterValue` → `row[key]`), never from what `render` draws, so a badge exports its text value and a link its URL field. Give a column `exportValue` (a function or a path) to export something else, or `exportable: false` to leave it out.
- The CSV follows RFC 4180: quotes, commas and line breaks are quoted correctly, lines end in CRLF and the file starts with a UTF-8 BOM, so Excel shows "José" and not "JosÃ©". Dates become `YYYY-MM-DD` and arrays are joined with commas.
- A text that starts with `=`, `+`, `-` or `@` gets an apostrophe in front, so a spreadsheet does not run it as a formula ("CSV injection"). Real numbers are left alone.
- **Copy to clipboard** copies tab-separated text: pasted into Excel or Google Sheets, it lands in cells.
- From code: `exportData({ format, scope, columns, delimiter, headers })` returns the text, `downloadData({ format, scope, filename })` saves a file and `copyToClipboard({ scope })` copies. `scope` is `'filtered'` (default), `'selected'`, `'all'` or `'page'`. Use `delimiter: ';'` for Excel set to a Spanish locale.
- `exportFilename` names the file. `onExport({ format, scope, count })` fires after every export.
- In remote mode only the rows the table holds can be exported; for a full export, use `onFilterChange` state to ask your server for the file.

## Mobile
Below 640px, `mobileLayout` decides how the table adapts:

- `'scroll'` (default): the real table, scrolling sideways. Cells do not wrap and the first column (with the selection column) is pinned, so a row stays identifiable. Sorting, select-all and every header affordance keep working.
- `'cards'`: one card per row. The first column is the card's title, next to its checkbox, and every other field is a "label … value" line. Since the header is hidden, a bar above the cards offers **Sort by**, the direction and **Select all**.
- Virtual tables always keep the table layout (their rows need a fixed height).
- A table inside a flex row shrinks and scrolls instead of widening the page. If you wrap it in your own flex item, give that wrapper `min-width: 0`.

:::script label="Mobile cards with a sort bar" expected="on a phone: cards with a title line; above them, Sort by and Select all (on desktop, a normal table)"
const table = await slice.build('Table', {
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'city', label: 'City' },
    { key: 'age', label: 'Age', sortable: true },
    { key: 'role', label: 'Role' }
  ],
  rows: [
    { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, role: 'admin' },
    { id: 2, name: 'Ana López', city: 'Caracas', age: 28, role: 'editor' },
    { id: 3, name: 'Lucas Molina', city: 'Valencia', age: 41, role: 'viewer' }
  ],
  rowKey: 'id',
  selection: 'multiple',
  mobileLayout: 'cards'
});

return table;
:::

## View: columns and density
`columnToggle: true` and `densityToggle: true` add a **View** menu to the toolbar.

- **Columns**: one checkbox per column. Hiding a column takes it out of the table, the search, the cards and the default export; the detail view still shows it. The last visible column cannot be hidden, and `hideable: false` pins a column.
- `hidden: true` on a column starts it hidden. `hiddenColumns` (array of keys) sets the whole list and wins over `hidden`. `setColumnVisible(key, visible)` does it from code. `onColumnsChange(hiddenKeys)` fires on every change.
- **Density**: `density` is `'compact'`, `'comfortable'` (default) or `'spacious'`. It changes padding and, in virtual mode, the row height (36 / 44 / 54px). An explicit `rowHeight` still wins.

## Remember the state (`stateKey`)
Give the table a `stateKey` and it saves the search, filters, sort, hidden columns and density in `localStorage` (under `slice-table:<stateKey>`). The next time a table with that key starts, the saved state wins over the initial props.

- Nothing is saved until the user changes something, and saving is debounced.
- A corrupt or older saved state is ignored. Unknown columns are skipped.
- `clearSavedState()` forgets it. In remote mode, a restored state fires `onFilterChange` / `onSortChange` so you can fetch the right page.
- Use a different key per table: two tables with one key share their state.

## Totals
Give a column `aggregate` and the table gets a totals row (`<tfoot>`), with **Total** in the first column.

- `aggregate`: `'sum'`, `'avg'`, `'count'`, `'min'`, `'max'`, or `fn(values, rows)` for anything else.
- It is computed over **every row that passes the search and filters**, not just the current page.
- Numbers are formatted with `Intl.NumberFormat`. `aggregateFormat(value, rows)` formats it your way (currency, units).
- When the body scrolls (`maxHeight`), the totals row stays at the bottom. On mobile cards it is a card of its own.

:::script label="View menu, totals and remembered state" expected="View menu with density and columns; a Total row; reload the page and the choices are kept"
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const table = await slice.build('Table', {
  columns: [
    { key: 'name', label: 'Name', sortable: true, hideable: false, aggregate: 'count', aggregateFormat: (n) => `${n} people` },
    { key: 'city', label: 'City' },
    { key: 'age', label: 'Age', sortable: true, aggregate: 'avg' },
    { key: 'salary', label: 'Salary', sortable: true, aggregate: 'sum', aggregateFormat: (v) => money.format(v), render: (row) => money.format(row.salary), filterValue: 'salary' },
    { key: 'role', label: 'Role', hidden: true }
  ],
  rows: [
    { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, salary: 1200, role: 'admin' },
    { id: 2, name: 'Ana López', city: 'Caracas', age: 28, salary: 950, role: 'editor' },
    { id: 3, name: 'Lucas Molina', city: 'Valencia', age: 41, salary: 1800, role: 'viewer' },
    { id: 4, name: 'María Ruiz', city: 'Mérida', age: 52, salary: 2100, role: 'editor' }
  ],
  rowKey: 'id',
  searchable: true,
  columnToggle: true,
  densityToggle: true,
  stateKey: 'docs-table-view'
});
table.style.width = '100%';
return table;
:::

## Row detail
`rowDetail` decides what a click (or **Enter**) on a row does:

- `'modal'`: opens a `Modal` with the row. Its title is the first column (`detailTitle(row)` to change it), and focus returns to the row when it closes.
- `'expand'`: a chevron column opens the detail right under the row, inside the table. It stays open across sorting and paging. Not available in virtual mode (rows there need one height).
- The default content is a list of **every** column, hidden ones included, with their rendered values. `renderDetail(row)` replaces it: return a string, a DOM node, a component or a Promise of one.
- `openDetail(rowOrKey)` opens it from code. `onRowClick` still fires on each click.

## Menus you build
The table's menus share one item vocabulary, so a menu is just an array:

- `'details'`, `'copy'`, … — a built-in action (see below).
- `'separator'` — a divider (repeated or edge separators are dropped).
- `{ label, icon, shortcut, onClick(ctx) }` — your action. Add `danger: true` for destructive ones, `keepOpen: true` to leave the menu open after the click, and `checked` to show a tick.
- `disabled` / `hidden` — `true` or a function of the row.
- `{ type: 'label', label }` — a small section title.
- `{ render(ctx) }` — anything: return a node (a form, a component). Keys typed inside it belong to it: arrows and Tab do not move the menu, Escape still closes it.

Every `ctx` also has `close()`, so your item can close the menu itself (after saving a form, say).

The menus are real menus: arrows, Home/End, Enter, Escape (focus goes back to the button) and a click outside all work.

- **`rowActions`** adds a ⋯ button at the end of each row. `true` gives the default menu (`['details', 'copy', 'select']`), an array builds your own, and a function `row => items` gives each row its own. Built-ins: `'details'` (opens the detail), `'copy'` (copies the row as tab-separated text) and `'select'` (toggles the row's selection; needs `selection`). `onClick` receives `{ row, key, table }`.
- **`exportMenu`** replaces the Export menu: pick from `'scope'`, `'csv'`, `'json'`, `'copy'` and add your own items. `onClick` receives `{ table, scope, rows }`, the rows the user chose to export. That is how to plug in an Excel export from your server.

:::script label="Row detail and a custom row menu" expected="click a row for the detail modal; the ⋯ menu has Edit, Copy row and a red Delete, disabled for admins"
const log = document.createElement('p');
log.textContent = 'Pick an action from a ⋯ menu.';
const table = await slice.build('Table', {
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'city', label: 'City' },
    { key: 'role', label: 'Role' },
    { key: 'email', label: 'Email', hidden: true }
  ],
  rows: [
    { id: 1, name: 'José Pérez', city: 'Maracaibo', role: 'admin', email: 'jose@example.com' },
    { id: 2, name: 'Ana López', city: 'Caracas', role: 'editor', email: 'ana@example.com' },
    { id: 3, name: 'Lucas Molina', city: 'Valencia', role: 'viewer', email: 'lucas@example.com' }
  ],
  rowKey: 'id',
  rowDetail: 'modal',
  rowActions: [
    { label: 'Edit', icon: '✎', onClick: ({ row }) => { log.textContent = `Edit ${row.name}`; } },
    'copy',
    'separator',
    {
      label: 'Delete',
      danger: true,
      disabled: (row) => row.role === 'admin',
      onClick: ({ row }) => { log.textContent = `Delete ${row.name}`; }
    }
  ]
});
table.style.width = '100%';
const box = document.createElement('div');
box.style.width = '100%';
box.append(table, log);
return box;
:::

### Your own menu (`onRowMenu`)
To draw the menu yourself (your Dropdown, a popover, a modal), give `onRowMenu({ row, key, anchor, table, close })`. The ⋯ button then calls it instead of opening the table's menu.

- `anchor` is the ⋯ button, to position your popup. Call `close()` when your menu closes: the table resets `aria-expanded` and returns focus to the button.
- Return a cleanup function and the table runs it whenever it closes your menu for you: the ⋯ button pressed again, another row's menu opened, the row filtered or scrolled away, or the table destroyed.
- `onRowMenu` alone is enough to show the ⋯ column; it wins over `rowActions`.

:::script label="Your own row menu with onRowMenu" expected="the ⋯ button opens a popover drawn by the page, not by the table"
const table = await slice.build('Table', {
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City' }
  ],
  rows: [
    { id: 1, name: 'José Pérez', city: 'Maracaibo' },
    { id: 2, name: 'Ana López', city: 'Caracas' }
  ],
  rowKey: 'id',
  onRowMenu: ({ row, anchor, close }) => {
    const pop = document.createElement('div');
    pop.style.cssText = 'position:fixed;z-index:1000;padding:12px;border-radius:10px;background:var(--secondary-background-color);box-shadow:0 8px 24px rgb(0 0 0 / .2)';
    const box = anchor.getBoundingClientRect();
    pop.style.top = `${box.bottom + 4}px`;
    pop.style.left = `${Math.max(8, box.right - 200)}px`;
    pop.style.width = '200px';
    const title = document.createElement('strong');
    title.textContent = row.name;
    const ok = document.createElement('button');
    ok.textContent = 'Close';
    ok.style.marginTop = '8px';
    ok.addEventListener('click', () => close());
    pop.append(title, document.createElement('br'), ok);
    document.body.appendChild(pop);
    ok.focus();
    return () => pop.remove();
  }
});
table.style.width = '100%';
return table;
:::

:::script label="Expand rows with a custom detail" expected="a chevron opens a custom panel under each row"
const table = await slice.build('Table', {
  columns: [
    { key: 'order', label: 'Order' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total', aggregate: 'sum' }
  ],
  rows: [
    { order: 'A-101', customer: 'José Pérez', total: 120, items: ['Keyboard', 'Mouse'] },
    { order: 'A-102', customer: 'Ana López', total: 75, items: ['Headphones'] }
  ],
  rowKey: 'order',
  rowDetail: 'expand',
  renderDetail: (row) => {
    const list = document.createElement('ul');
    for (const item of row.items) {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    }
    return list;
  }
});
table.style.width = '100%';
return table;
:::

## Best Practices
:::tip
Editable tables save each cell on its own. Let `commit` throw with a message people can act on ("Prices over 1,000 need approval."): it shows on the cell and on the bar.
:::

:::tip
Keep row data uniform in length. Mismatched columns may produce uneven layout.
:::

:::tip
Give `rowKey` whenever rows have an id: selection, expanded rows and the row menu follow the row through sorting and filtering instead of its position.
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
In `virtual` mode every row has the same height (`rowHeight`, or the one `density` gives). Cells that need to wrap, or rich components taller than the row, belong in a paginated table instead.
:::

:::warning
`stateKey` state lives in the user's browser. Change the key when you rename or remove columns, or the saved state may hide a column under its old meaning.
:::

:::warning
Filters and search read the row DATA. A column whose `render` shows something different from `row[key]` (a formatted date, a label for a code) should give `filterValue` / `searchValue`, or the filter will compare against the raw value.
:::
