---
title: Pagination
route: /docs/data/pagination
navLabel: Pagination
section: Data
group: Tables
order: 11
description: A controlled page navigator with ellipsis ranges, reusable on its own or via Table.
component: PaginationDocumentation
generate: true
tags: [pagination, navigation, data]
---

# Pagination

## Overview
`Pagination` is a **controlled** page navigator. It holds no page state of its own: you pass the
`currentPage`, and on a click it calls `onPageChange(page)` — you then update `currentPage` to move it.
Use it on its own for lists and search results, or let [`Table`](/docs/data/table) compose it for you.

## API and Behavior
- `currentPage` (number) — the active page (you own this value).
- `totalPages` (number) — total number of pages.
- `siblingCount` (number, default `1`) — pages shown on each side of the current page.
- `boundaryCount` (number, default `1`) — pages always shown at the start/end.
- `showFirstLast` (boolean, default `false`) — render «first / last» controls.
- `disabled` (boolean) — blocks navigation.
- `onPageChange(page)` — called with the requested page (never the current one).

Large ranges collapse with an ellipsis, e.g. `1 … 9 10 11 … 20`. Because it is controlled, clicking a
page does **not** move it until you set `currentPage` — this keeps it in sync with whatever owns the data.

## Prop Scenarios
:::script label="Controlled pager" expected="clicking a page moves the active page"
let page = 1;
const pager = await slice.build('Pagination', {
  currentPage: page,
  totalPages: 12,
  showFirstLast: true,
  onPageChange: (p) => { page = p; pager.currentPage = p; }
});

return pager;
:::

:::script label="Paginated item list" expected="clicking pages shows different items on each page"
const items = Array.from({ length: 36 }, (_, i) => `Item ${String(i + 1).padStart(2, '0')}`);
const pageSize = 6;
let page = 1;

const container = document.createElement('div');
container.style.display = 'flex';
container.style.flexDirection = 'column';
container.style.gap = '12px';

const list = document.createElement('div');
list.style.display = 'flex';
list.style.flexDirection = 'column';
list.style.gap = '4px';
list.style.padding = '12px';
list.style.background = 'var(--color-surface, #f0f0f0)';
list.style.borderRadius = '8px';
list.style.minHeight = '160px';
list.style.fontFamily = 'monospace';

function renderList() {
  list.innerHTML = '';
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, items.length);
  for (let i = start; i < end; i++) {
    const el = document.createElement('div');
    el.textContent = items[i];
    el.style.padding = '6px 10px';
    el.style.background = 'var(--color-background, #fff)';
    el.style.borderRadius = '4px';
    el.style.border = '1px solid var(--color-border, #ddd)';
    list.appendChild(el);
  }
}
renderList();

const pager = await slice.build('Pagination', {
  currentPage: page,
  totalPages: Math.ceil(items.length / pageSize),
  showFirstLast: true,
  onPageChange: (p) => { page = p; pager.currentPage = p; renderList(); }
});

container.appendChild(list);
container.appendChild(pager);
return container;
:::

:::script label="Custom siblings and boundaries" expected="shows more pages around the current one and pinned edges"
const pager = await slice.build('Pagination', {
  currentPage: 10,
  totalPages: 30,
  siblingCount: 2,
  boundaryCount: 2,
  showFirstLast: true,
  onPageChange: (p) => { pager.currentPage = p; }
});
return pager;
:::

:::script label="First and last buttons" expected="quick-jump controls are visible at both ends"
const pager = await slice.build('Pagination', {
  currentPage: 7,
  totalPages: 15,
  showFirstLast: true,
  onPageChange: (p) => { pager.currentPage = p; }
});
return pager;
:::

:::script label="Disabled pager" expected="buttons are visible but not clickable"
const pager = await slice.build('Pagination', {
  currentPage: 5,
  totalPages: 10,
  disabled: true,
  onPageChange: (p) => { pager.currentPage = p; }
});
return pager;
:::

## Best Practices
:::tip
Keep the page number in the parent (or in a `DataGridEngine`) and treat `Pagination` as a pure view.
For tables, prefer `Table`'s built-in `pagination` prop over wiring this by hand.
:::

## Pitfalls
:::warning
It is **controlled**: if you never update `currentPage` in your `onPageChange` handler, the pager will
appear stuck. That is by design — the owner of the data decides when the page actually changes.
:::
