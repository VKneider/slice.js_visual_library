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
- `headers` (array of strings) defines the table header row.
- `rows` (array of arrays) defines data rows. Each cell supports HTML content via `innerHTML`.
- Both props are reactive: changes trigger a full re-render.
- Empty arrays render no table content.

## Basic Usage
```javascript title="Build table"
const table = await slice.build('Table', {
  headers: ['Name', 'Role', 'Status'],
  rows: [
    ['Alice', 'Engineer', 'Active'],
    ['Bob', 'Designer', 'Inactive'],
    ['Carol', 'Manager', 'Active']
  ]
});

this.appendChild(table);
```

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

:::script label="Table with HTML cells" expected="renders cells containing styled content"
const table = await slice.build('Table', {
  headers: ['Package', 'Status', 'Action'],
  rows: [
    ['slice.js', '<span style="color:#16a34a">Published</span>', '<button>View</button>'],
    ['slice-cli', '<span style="color:#2563eb">Beta</span>', '<button>Install</button>']
  ]
});

return table;
:::

:::script label="Empty table" expected="renders empty table container"
const table = await slice.build('Table', {
  headers: [],
  rows: []
});

return table;
:::

## Best Practices
:::tip
Keep row data uniform in length. Mismatched columns may produce uneven layout.
:::

## Pitfalls
:::warning
Avoid injecting unsanitized user content. Cells use `innerHTML`, which can introduce XSS if used with raw user input.
:::
