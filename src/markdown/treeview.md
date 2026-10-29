---
title: TreeView
route: /docs/navigation/treeview
navLabel: TreeView
section: Navigation
group: Navigation
order: 50
description: Hierarchical list with full keyboard support, search, checkboxes, lazy branches, virtual scrolling, drag and drop and row menus.
component: TreeViewDocumentation
generate: true
tags: [treeview, navigation, tree, files, checkbox, drag]
---

# TreeView

## Overview
`TreeView` shows a hierarchy: a navigation sidebar, a file tree, a category picker or nested settings. Branches open and close, the current page is marked, and the whole tree works from the keyboard. It can also search, check items with tri-state checkboxes, load branches on demand, scroll tens of thousands of nodes smoothly, reorder by drag and drop, and give every row its own ⋯ menu.

## Items
Each entry in `items` is an object:

- `label` (or `value`, or `text`): the text of the row.
- `path`: makes the row a destination. It is marked when it is the current page.
- `items` (or `children`): the nested items. They can also be a function, even an async one, and the branch then loads the first time it opens, with a loading row meanwhile. `reload(key)` loads it again.
- `id`: a stable identity. Without one, the key is the `path`, or else the parent's key plus the label.
- `icon` (an `Icon` name), `badge`, `description` (a quieter second line), `disabled`, `hidden`, `expanded` (start open) and `actions` (a ⋯ menu, as `DropDown` items).

The tree never changes your objects, except when you drag a row: then the item really moves inside your arrays, so your data and the tree stay in step.

## Core Behavior
- A branch opens and closes from its chevron. A branch without a `path` also toggles when you click its label; a row with a `path` is a destination and becomes the current page.
- `onClick(row, event)` hears every activation (click or Enter). `row.item` is your object, and `row.path` and `row.value` are its path and label.
- `navigate: true` routes a row with a `path` through `slice.router` by itself.
- `activePath` marks the current page and opens its branch. With `followRoute` (on by default) it keeps up with router navigations and with back / forward.
- `expanded: 'all'` starts with every branch open. `stateKey` remembers which branches were open between visits, in `localStorage`; without a `stateKey` nothing is stored.
- `onToggle(item, open)` fires when a branch opens or closes.
- From code: `expand(key)`, `collapse(key)`, `toggle(key)`, `expandAll()`, `collapseAll()`, `focusNode(key)`, `keyOf(item)`, `getSelectedItems()`, `clearSelection()` and `activateByPath(path)`. Wherever a key is expected, you can also pass a path or the item itself.

## Keyboard
The tree is a single tab stop; inside it:
- **↑ ↓** move between rows, and **Home / End** jump to the first or last.
- **→** opens a branch, or steps into it if it is already open. **←** closes it, or steps to the parent.
- **\*** opens every sibling branch.
- Typing jumps to the next row starting with those letters.
- **Enter** activates the row. **Space** checks it, or selects it.
- **Shift+F10** or the context-menu key opens the row's ⋯ menu.

## Selection, search and the rest
- `selection: 'single'` highlights one row (`aria-selected`) and reports it to `onSelect(item)`.
- `selection: 'multiple'` adds tri-state checkboxes. Checking a parent checks everything under it; a parent with only some checked children shows a dash. `selected` (an array of keys) sets the checks and `onSelectionChange(keys, items)` reports them.
- `searchable` adds a search box (`filter` sets the query from code). Matching rows show with their ancestors opened, and the match is highlighted. Accents and capitals do not matter: "cam" finds "Cámara".
- `virtual: true` draws only the rows in view, so 20,000 nodes scroll like 20. Give it a `maxHeight`; rows share one height, set by `size` or `rowHeight`.
- `draggable: true` lets you drag a row onto the top edge of another (before it), its bottom edge (after it) or its middle (inside it). Hovering a closed branch opens it. Return `false` from `onMove({ item, target, position })` to refuse a drop. A branch can never be dropped into itself.
- `nodeActions(item)` returns the ⋯ menu for every row; it opens on hover, with right click or with Shift+F10.

## Looks
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `indicator` marks the current page: `'tint'` (default, a fading wash), `'pill'` or `'bar'` (an accent line on the left).
- `guides: false` removes the vertical lines down each open branch.

## Live Preview
:::component name="TreeView"
{
  "expanded": "all",
  "items": [
    { "value": "Getting Started", "items": [
      { "value": "Installation", "path": "/docs/install" },
      { "value": "Project Structure", "path": "/docs/structure" }
    ] },
    { "value": "Components", "items": [
      { "value": "Button", "path": "/docs/input/button" },
      { "value": "Input", "path": "/docs/input/input" }
    ] }
  ]
}
:::

## Prop Scenarios
:::script label="File explorer" expected="folders with icons, a badge, a description, a disabled file and a ⋯ menu on hover"
const result = document.createElement('p');
result.textContent = 'Right-click a row, or hover it and use ⋯.';

const tree = await slice.build('TreeView', {
  ariaLabel: 'Files',
  indicator: 'pill',
  items: [
    {
      label: 'src', icon: 'folder', expanded: true, items: [
        {
          label: 'components', icon: 'folder', expanded: true, items: [
            { label: 'Button.js', icon: 'file-code', badge: 'M' },
            { label: 'Table.js', icon: 'file-code', description: 'Edited 2 minutes ago' },
            { label: 'Legacy.js', icon: 'file-code', disabled: true }
          ]
        },
        { label: 'utils', icon: 'folder', items: [{ label: 'format.js', icon: 'file-code' }] },
        { label: 'index.js', icon: 'file' }
      ]
    },
    { label: 'package.json', icon: 'file' }
  ],
  nodeActions: (item) => [
    { label: 'Rename', icon: 'pen', onClick: () => { result.textContent = `Rename ${item.label}`; } },
    { label: 'Duplicate', icon: 'file-copy' },
    'separator',
    { label: 'Delete', icon: 'trash-bin', danger: true, onClick: () => { result.textContent = `Delete ${item.label}`; } }
  ],
  onClick: (row) => { result.textContent = `Opened ${row.value}`; }
});

const box = document.createElement('div');
box.style.width = '100%';
box.append(tree, result);
return box;
:::

:::script label="Checkboxes and search" expected="type to filter; checking a folder checks its files and a partly checked folder shows a dash"
const result = document.createElement('p');
const tree = await slice.build('TreeView', {
  selection: 'multiple',
  searchable: true,
  searchPlaceholder: 'Filter permissions…',
  expanded: 'all',
  selected: ['users.read'],
  items: [
    {
      label: 'Users', id: 'users', items: [
        { label: 'Read users', id: 'users.read' },
        { label: 'Create users', id: 'users.create' },
        { label: 'Delete users', id: 'users.delete' }
      ]
    },
    {
      label: 'Billing', id: 'billing', items: [
        { label: 'See invoices', id: 'billing.read' },
        { label: 'Change plan', id: 'billing.plan' }
      ]
    }
  ],
  onSelectionChange: (keys) => { result.textContent = `Checked: ${keys.join(', ') || 'nothing'}`; }
});
const box = document.createElement('div');
box.style.width = '100%';
box.append(tree, result);
return box;
:::

:::script label="Branches loaded on demand" expected="each region loads its countries the first time it opens"
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const countries = {
  Americas: ['Argentina', 'Brasil', 'Colombia', 'México', 'Venezuela'],
  Europe: ['España', 'France', 'Italia'],
  Asia: ['Japan', 'Korea', 'Vietnam']
};
const tree = await slice.build('TreeView', {
  items: Object.keys(countries).map((region) => ({
    label: region,
    icon: 'globe',
    items: async () => {
      await wait(700);
      return countries[region].map((name) => ({ label: name }));
    }
  }))
});
return tree;
:::

:::script label="Drag and drop" expected="drag rows to reorder them or drop them inside another folder"
const log = document.createElement('p');
log.textContent = 'Drag a row onto another one.';
const tree = await slice.build('TreeView', {
  draggable: true,
  expanded: 'all',
  items: [
    { label: 'Inbox', id: 'inbox', icon: 'inbox', items: [{ label: 'Invoice March', id: 'm1' }, { label: 'Team lunch', id: 'm2' }] },
    { label: 'Archive', id: 'archive', icon: 'archive', items: [] },
    { label: 'Notes', id: 'notes', icon: 'file' }
  ],
  onMove: ({ item, target, position }) => {
    log.textContent = `${item.label} → ${position} ${target.label}`;
  }
});
const box = document.createElement('div');
box.style.width = '100%';
box.append(tree, log);
return box;
:::

:::script label="20,000 nodes, virtual" expected="200 open folders of 99 files each scroll smoothly inside a fixed height"
const items = Array.from({ length: 200 }, (_, i) => ({
  label: `Folder ${i + 1}`,
  icon: 'folder',
  expanded: true,
  items: Array.from({ length: 99 }, (_, j) => ({ label: `File ${i + 1}.${j + 1}` }))
}));
const tree = await slice.build('TreeView', { items, virtual: true, maxHeight: '320px', size: 'sm' });
tree.style.width = '100%';
return tree;
:::

:::script label="Navigation sidebar" expected="the current page is marked with a bar; clicking a page marks it"
const tree = await slice.build('TreeView', {
  indicator: 'bar',
  activePath: '/docs/navigation/treeview',
  followRoute: false,
  items: [
    { value: 'Data', items: [{ value: 'Table', path: '/docs/data/table' }] },
    {
      value: 'Navigation', items: [
        { value: 'Navbar', path: '/docs/navigation/navbar' },
        { value: 'DropDown', path: '/docs/navigation/dropdown' },
        { value: 'TreeView', path: '/docs/navigation/treeview' }
      ]
    }
  ],
  onClick: (row) => { tree.setActiveTreeItem(row); }
});
return tree;
:::

## Best Practices
:::tip
Give items an `id` when they can move or be renamed. The key is what keeps a row's open state, its check and its focus attached to it.
:::

:::tip
For a navigation sidebar, pass `activePath` and a `stateKey`: the current page is always visible, and the sections the reader opened stay open between visits.
:::

## Pitfalls
:::warning
`draggable` moves items inside your own arrays (that is how your data stays in step). If your arrays are frozen or derived on every render, refuse the drop in `onMove` and update your state yourself.
:::

:::warning
`virtual` needs one row height: long labels are cut with an ellipsis, and a `description` line needs a bigger `rowHeight`.
:::

## Language

The built-in texts are `slice.treeView.*` keys with English and Spanish defaults, registered by
`shared/text/texts.js` in the translator's lowest layer: an app dictionary always wins, and the
component keeps its English text when the translator is off.
The text prop `texts` still wins over the dictionary.
Keys: `searchPlaceholder`, `emptyMessage`, `search`, `loading`, `actionsFor`.
