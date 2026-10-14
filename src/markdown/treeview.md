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

### Item aliases

`text`/`label` are accepted for `value`, and `children` for `items`. The `children`
alias exists because it is what nearly every other tree library calls it, and the
cost of *not* accepting it was severe: `children` is a **getter-only property on
`HTMLElement`**, so spreading an item that carried one made the props assignment
throw `Cannot set property children`, the item was never created, and **every
branch of the tree disappeared** — with one `ERROR` in a console you are not
watching and nothing at all on screen.

Only the keys `TreeItem` declares are forwarded to it, so no data shape can
clobber a native DOM property the same way.

```javascript
// Both of these render the same tree.
{ value: 'Docs', items: [ ... ] }
{ text: 'Docs', children: [ ... ] }
```

## Live Preview
:::component name="TreeView"
{
  "items": [
    {
      "value": "Getting Started",
      "path": "/docs",
      "items": [
        {
          "value": "Installation",
          "path": "/docs"
        },
        {
          "value": "Quick Start",
          "path": "/docs"
        }
      ]
    },
    {
      "value": "Components",
      "path": "/docs",
      "items": [
        {
          "value": "Button",
          "path": "/docs/input/button"
        },
        {
          "value": "Card",
          "path": "/docs/layout/card"
        }
      ]
    }
  ]
}
:::

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
  onClick: (item) => {
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

:::tip
How a branch opens depends on whether it has a `path`. A branch **with** one toggles only from its caret — clicking the label is left free for navigation. A branch **without** one toggles from the caret *or* the label, so it works with no caret affordance expected. Drop the `path` from a branch you always want collapsible.
:::

:::warning
A branch collapses by animating `.container` from `scrollHeight` to `0`, then leaving `height: auto`. A branch that is *route*-opened goes straight to `height: auto`, so it will not animate — that is deliberate, since a fixed pixel height clips descendants that expand later.
:::
