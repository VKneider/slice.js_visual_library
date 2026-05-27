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

:::script label="Metric cards dashboard" expected="four cards with icons and badges"
const cards = await Promise.all([
  slice.build('Card', { title: 'API Response', text: 'Avg 42ms latency', badge: 'Healthy', variant: 'elevated', icon: { name: 'chart-pie', iconStyle: 'filled' } }),
  slice.build('Card', { title: 'Error Rate', text: '0.3% of requests', badge: 'Warning', variant: 'elevated', icon: { name: 'exclamation-circle', iconStyle: 'filled' } }),
  slice.build('Card', { title: 'Uptime', text: '99.97% this month', badge: 'Healthy', variant: 'elevated', icon: { name: 'shield-check', iconStyle: 'filled' } }),
  slice.build('Card', { title: 'Queue Depth', text: '12 pending jobs', badge: 'Blocked', variant: 'elevated', icon: { name: 'inbox', iconStyle: 'filled' } })
]);

const grid = await slice.build('Grid', {
  columns: 2, rows: 2, gap: '12px',
  items: cards
});

const wrapper = document.createElement('div');
wrapper.style.cssText = 'width:100%;';
wrapper.appendChild(grid);
return wrapper;
:::

:::script label="Editor toolbar grid" expected="grid of icon buttons mimicking an editor toolbar"
const tools = [
  { name: 'letter-bold', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'letter-italic', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'letter-underline', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'align-center', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'list', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'indent', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'code', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'table-column', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'palette', color: { button: '#7c3aed', label: '#ffffff' } },
  { name: 'search', color: { button: '#e2e8f0', label: '#0f172a' } },
  { name: 'download', color: { button: '#2563eb', label: '#ffffff' } },
  { name: 'undo', color: { button: '#f59e0b', label: '#ffffff' } }
];

const btns = await Promise.all(tools.map(t =>
  slice.build('Button', { value: '', icon: { name: t.name, iconStyle: 'filled' }, customColor: t.color })
));

const grid = await slice.build('Grid', {
  columns: 6, rows: 2, gap: '6px',
  items: btns
});

const wrapper = document.createElement('div');
wrapper.style.cssText = 'width:100%;padding:8px;background:color-mix(in srgb,var(--primary-background-color) 98%,var(--primary-color));border-radius:8px;';
wrapper.appendChild(grid);
return wrapper;
:::

:::script label="Custom column template" expected="sidebar + main layout using columnTemplate"
const sidebarCard = await slice.build('Card', { title: 'Navigation', text: 'Quick links', variant: 'minimal', icon: { name: 'home', iconStyle: 'filled' }, interactive: false });
const linkItems = await Promise.all([
  slice.build('Button', { value: 'Dashboard', icon: { name: 'grid', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),
  slice.build('Button', { value: 'Analytics', icon: { name: 'chart-pie', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),
  slice.build('Button', { value: 'Settings', icon: { name: 'cog', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),
  slice.build('Button', { value: 'Profile', icon: { name: 'user', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } })
]);

const navContainer = document.createElement('div');
navContainer.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
navContainer.appendChild(sidebarCard);
linkItems.forEach(item => navContainer.appendChild(item));

const mainCard = await slice.build('Card', {
  title: 'Content Area', text: 'Main panel with detailed information. Cards and other components render naturally inside grid cells.', badge: 'Active', variant: 'elevated', icon: { name: 'file-lines', iconStyle: 'filled' }
});

const grid = await slice.build('Grid', {
  columnTemplate: '220px 1fr', gap: '12px', rows: 1, items: [navContainer, mainCard]
});

const wrapper = document.createElement('div');
wrapper.style.cssText = 'width:100%;';
wrapper.appendChild(grid);
return wrapper;
:::

:::script label="Dynamic grid update" expected="items can be replaced by assigning new items array"
const icons = ['bell', 'calendar-month', 'rocket', 'bug', 'flag', 'credit-card'];
const addCard = async (label, badgeVal) => {
  const idx = Math.floor(Math.random() * icons.length);
  return slice.build('Card', { title: label, text: 'Dynamically added item', badge: badgeVal, variant: 'outlined', icon: { name: icons[idx], iconStyle: 'filled' } });
};

const initial = await Promise.all([
  addCard('Task Alpha', 'New'),
  addCard('Task Beta', 'Active')
]);

const grid = await slice.build('Grid', { columns: 2, rows: 2, gap: '10px', items: initial });

const addBtn = await slice.build('Button', {
  value: 'Add card', onClickCallback: async () => {
    const newCard = await addCard('Task ' + Math.random().toString(36).slice(2,5), 'New');
    const existing = grid.items || [];
    grid.items = [...existing, newCard];
  }
});

const clearBtn = await slice.build('Button', {
  value: 'Clear', customColor: { button: '#dc2626', label: '#ffffff' }, onClickCallback: () => {
    grid.clear();
    grid.items = [];
  }
});

const toolbar = document.createElement('div');
toolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
toolbar.appendChild(addBtn);
toolbar.appendChild(clearBtn);

const host = document.createElement('div');
host.appendChild(toolbar);
host.appendChild(grid);
return host;
:::

:::script label="Card variants in grid" expected="four card variants displayed side by side"
const rebuilt = await Promise.all([
  slice.build('Card', { title: 'Default', text: 'Standard card surface', variant: 'default', icon: { name: 'grid', iconStyle: 'filled' } }),
  slice.build('Card', { title: 'Elevated', text: 'Lifted with shadow', variant: 'elevated', icon: { name: 'upload', iconStyle: 'filled' } }),
  slice.build('Card', { title: 'Outlined', text: 'Bordered accent', variant: 'outlined', icon: { name: 'close-circle', iconStyle: 'filled' } }),
  slice.build('Card', { title: 'Minimal', text: 'Clean no-chrome', variant: 'minimal', icon: { name: 'minus', iconStyle: 'outlined' } })
]);

const grid = await slice.build('Grid', { columns: 4, rows: 1, gap: '10px', items: rebuilt });

const wrapper = document.createElement('div');
wrapper.style.cssText = 'width:100%;';
wrapper.appendChild(grid);
return wrapper;
:::

## Best Practices
:::tip
Use `gap` to control spacing — default is `10px`. Combine `columnTemplate` with fixed and flexible units (`200px 1fr`) for mixed layouts.
:::

## Pitfalls
:::warning
Grid items must be valid DOM nodes. Strings are not automatically converted. Items array can be replaced at runtime via `grid.items = [...]`.
:::
