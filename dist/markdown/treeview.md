---
title: TreeView
route: /docs/navigation/treeview
navLabel: TreeView
section: Navigation
group: Navigation
order: 50
description: TreeView documentation with nested item and navigation scenarios.
component: TreeViewDocumentation
generate: true
tags: [treeview, navigation, tree]
---

# TreeView

## Overview
`TreeView` renders a nested tree structure using `TreeItem` nodes. Each item can contain child items, and items with children include a collapsible caret. Supports click callbacks and path-based navigation.

## API and Behavior
- `items` (array of objects) defines the tree hierarchy.
- Each item accepts: `value` (label), `path` (for navigation), `items` (child array), `onClickCallback`.
- `onClickCallback` is propagated to all child `TreeItem` nodes.
- `TreeView` uses `TreeItem` internally via `slice.build('TreeItem', ...)`.
- Collapse state is persisted to `localStorage`.

## Basic Usage
```javascript title="Build treeview"
const treeview = await slice.build('TreeView', {
  items: [
    {
      value: 'Section 1',
      path: '/section-1',
      items: [
        { value: 'Subsection 1.1', path: '/section-1/sub-1' }
      ]
    }
  ]
});

this.appendChild(treeview);
```

## Prop Scenarios
:::script label="Nested tree with navigation" expected="renders tree with two levels of nesting"
const treeview = await slice.build('TreeView', {
  items: [
    {
      value: 'Getting Started',
      path: '/docs/getting-started',
      items: [
        { value: 'Installation', path: '/docs/installation' },
        { value: 'Quick Start', path: '/docs/quick-start' }
      ]
    },
    {
      value: 'Components',
      path: '/docs/components',
      items: [
        { value: 'Button', path: '/docs/input/button' },
        { value: 'Card', path: '/docs/layout/card' },
        { value: 'Table', path: '/docs/data/table' }
      ]
    },
    {
      value: 'API Reference',
      path: '/docs/api'
    }
  ]
});

return treeview;
:::

:::script label="Flat tree without nesting" expected="renders plain list of items"
const treeview = await slice.build('TreeView', {
  items: [
    { value: 'Dashboard', path: '/dashboard' },
    { value: 'Settings', path: '/settings' },
    { value: 'Profile', path: '/profile' },
    { value: 'Help', path: '/help' }
  ]
});

return treeview;
:::

:::script label="Tree with click callback" expected="items log on click"
let lastClicked = null;

const treeview = await slice.build('TreeView', {
  onClickCallback: (item) => {
    lastClicked = item;
  },
  items: [
    { value: 'Option A', path: '/option-a' },
    { value: 'Option B', path: '/option-b' }
  ]
});

return treeview;
:::

## Best Practices
:::tip
Use `path` on items that should navigate. Items without `path` toggle their children on click instead.
:::

## Pitfalls
:::warning
`TreeItem` uses `localStorage` to persist open/closed state. State persists across sessions for items with the same label.
:::
