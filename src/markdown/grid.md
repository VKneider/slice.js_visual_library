---
title: Grid
route: /docs/layout/grid
navLabel: Grid
section: Layout
group: Containers
order: 22
description: Grid component documentation with layout composition scenarios.
component: GridDocumentation
generate: true
tags: [grid, layout]
---

# Grid

## Overview
`Grid` arranges content in structured rows and columns with configurable templates and spacing.

## Core Behavior
- `columns` and `rows` define the base matrix.
- `gap` controls spacing between cells.
- `items` appends DOM nodes as grid children.

## Basic Usage
```javascript title="Build grid"
const one = document.createElement('div');
one.textContent = 'One';

const two = document.createElement('div');
two.textContent = 'Two';

const grid = await slice.build('Grid', {
  columns: 2,
  rows: 1,
  items: [one, two]
});

this.appendChild(grid);
```

## Prop Scenarios
:::script label="two-column card grid" expected="grid renders card items in two columns"
const cardA = await slice.build('Card', {
  title: 'Alpha',
  text: 'First card',
  variant: 'outlined'
});

const cardB = await slice.build('Card', {
  title: 'Beta',
  text: 'Second card',
  variant: 'outlined'
});

const grid = await slice.build('Grid', {
  columns: 2,
  rows: 1,
  gap: '12px',
  items: [cardA, cardB]
});

return grid;
:::

:::script label="custom column template" expected="columnTemplate overrides fixed columns repeat"
const a = document.createElement('div');
a.textContent = 'Main panel';

const b = document.createElement('div');
b.textContent = 'Sidebar';

const grid = await slice.build('Grid', {
  columnTemplate: '2fr 1fr',
  rows: 1,
  items: [a, b]
});

return grid;
:::

:::script label="dynamic grid update" expected="items can be replaced by assigning new items array"
const first = document.createElement('div');
first.textContent = 'Item 1';

const second = document.createElement('div');
second.textContent = 'Item 2';

const third = document.createElement('div');
third.textContent = 'Item 3';

const grid = await slice.build('Grid', {
  columns: 2,
  rows: 2,
  items: [first, second]
});

grid.items = [first, second, third];
return grid;
:::
