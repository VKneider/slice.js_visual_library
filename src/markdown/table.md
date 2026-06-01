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

## Best Practices
:::tip
Keep row data uniform in length. Mismatched columns may produce uneven layout.
:::

## Pitfalls
:::warning
Plain string cells are escaped, so user data is safe by default. Only the explicit `{ html: '...' }` form is injected as raw HTML — never pass unsanitized user input through it.
:::
