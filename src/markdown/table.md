---
title: Table
route: /docs/data/table
navLabel: Table
section: Data
group: Tables
order: 10
description: Table documentation with header and row rendering scenarios.
component: TableDocumentation
generate: true
tags: [table, data, display]
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
- Both props are reactive: changes trigger a full re-render.
- Empty arrays render no table content.

## Columns, sorting and pagination
For richer tables, use `columns` instead of `headers` — an array of column descriptors. Rows can then
be **objects** keyed by `key` (positional `headers` + array rows still work as before).

- `columns`: `[{ key, label, sortable, align, render }]`.
  - `key` — property to read from each row object (or column index for array rows).
  - `label` — header text. `align` — `'left' | 'center' | 'right'`.
  - `sortable` — make the column clickable to sort. `render(row)` — return a string / DOM node / `{ html }` for custom cells.
- `sortable` (boolean) — default sortability for every column when not set per-column.
- `defaultSort` — `{ key, direction: 'asc' | 'desc' }` applied on first render.
- `pagination` — `true` or `{ pageSize }` to page the rows (renders a `Pagination` control). Reactive:
  it can be turned on/off or resized at runtime — the pager is shown/hidden and the page size updated,
  never destroyed and rebuilt.
- `emptyMessage` — text shown when there are columns but no rows.
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

## Best Practices
:::tip
Keep row data uniform in length. Mismatched columns may produce uneven layout.
:::

## Pitfalls
:::warning
Plain string cells are escaped, so user data is safe by default. Only the explicit `{ html: '...' }` form is injected as raw HTML — never pass unsanitized user input through it.
:::
