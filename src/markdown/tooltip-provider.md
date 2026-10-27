---
title: ToolTipProvider
route: /docs/services/tooltip-provider
navLabel: ToolTipProvider
section: Services
group: Overlay
order: 15
description: Tooltips for many elements with one shared bubble and no component per trigger. Data attributes or attach(), elements added later included, and the same behaviour as ToolTip.
component: ToolTipProviderDocumentation
generate: true
tags: [tooltip, provider, service, overlay, data-attributes]
---

# ToolTipProvider

## Overview
`ToolTipProvider` is a Service that gives tooltips to many elements with **one shared bubble** and **one set of listeners on the document**. Nothing is built per trigger: a toolbar of twenty buttons or a table of a thousand cells costs one bubble.

It behaves exactly like [ToolTip](/docs/display/tooltip), because both run on the same code:
- the delay and warm-up;
- the top layer above Modals;
- Escape, hovering the bubble, a long press on touch;
- title and shortcut, twelve placements, the variants, and toggletips.

```javascript
const tips = await slice.build('ToolTipProvider', { singleton: true });
tips.scope(document.querySelector('#toolbar'));         // every [data-tooltip] inside
tips.attach(saveButton, { text: 'Save', shortcut: '⌘S' });
```

`{ singleton: true }` makes every build return the same provider, so the whole app shares one. A second provider logs a warning.

### ToolTip or ToolTipProvider?
| You have | Use |
|---|---|
| A few tooltips you build with their buttons | `ToolTip` around each one |
| Many plain tooltips: a toolbar, a table, a list | `ToolTipProvider.scope()` with data attributes |
| Markup you do not build yourself (HTML from a server, a rich-text editor) | `ToolTipProvider.scope()` |
| A tooltip with a node inside, or one that changes often | `ToolTip` (`content`, `text`) |

## API

### `scope(container)`
Every element with `data-tooltip` (or `data-tooltip-title`) inside `container` gets a tooltip:
- **including elements added later**, because the provider looks for the trigger when the pointer or the focus arrives, not when you call `scope()`;
- the attributes are read when the tooltip shows, so changing `data-tooltip` changes the tooltip.

`unscope(container)` stops it.

| Attribute | Same as |
|---|---|
| `data-tooltip` | `text` |
| `data-tooltip-title` | `title` |
| `data-tooltip-shortcut` | `shortcut` |
| `data-tooltip-placement` | `placement` (`top`, `bottom-start`, …) |
| `data-tooltip-variant` | `variant` (`inverse`, `light`, `accent`) |
| `data-tooltip-size` | `size` (`sm`, `md`) |
| `data-tooltip-mode` | `mode` (`tooltip`, `toggletip`) |
| `data-tooltip-offset`, `data-tooltip-max-width` | `offset`, `maxWidth` |
| `data-tooltip-show-delay`, `data-tooltip-hide-delay` | `showDelay`, `hideDelay` |

### `attach(element, config)` and `detach(element)`
`attach` gives one element a tooltip from code, with the same options as ToolTip: `text`, `title`, `shortcut`, `placement`, `variant`, `size`, `mode`, `offset`, `maxWidth`, `showDelay`, `hideDelay`, `arrow` and `customColor`.
- The config wins over the element's data attributes.
- Calling it again merges the new config into the old one.
- `detach` removes the tooltip.

Configs are kept in a `WeakMap`. An element removed from the page takes its config with it, so forgetting `detach` leaks nothing.

### `show(element)` and `hide()`
These open and close a tooltip from code. `open` tells whether one is showing.

### Keyboard reach
An element with nothing focusable in it (a `<span>`, an icon) gets `tabindex="0"` from `attach()` or `scope()`. Keyboard users can then reach its tooltip, and `detach` takes the tab stop back. Buttons and links already have one, and nothing is added.

### Cleanup
Destroying the provider (`slice.controller.destroyComponent(tips)`) removes the bubble and the document listeners.

## Examples
:::script label="A toolbar from data attributes" expected="a toolbar of icon buttons described only by data attributes, sharing one bubble; most buttons show a shortcut; moving along shows each label at once after the first"
const tips = await slice.build('ToolTipProvider', { singleton: true });
const tools = [
  ['letter-bold', 'Bold', '⌘B'], ['letter-italic', 'Italic', '⌘I'], ['letter-underline', 'Underline', '⌘U'], null,
  ['list', 'Bulleted list', '⇧⌘8'], ['align-center', 'Centre', '⇧⌘E'], null,
  ['link', 'Insert link', '⌘K'], ['image', 'Insert image', ''], ['table-row', 'Insert a row', '']
];
const bar = document.createElement('div');
bar.setAttribute('role', 'toolbar');
bar.setAttribute('aria-label', 'Formatting');
bar.style.cssText = 'display:inline-flex;flex-wrap:wrap;gap:4px;padding:6px;border:1px solid var(--slice-border-raised);border-radius:12px';
for (const tool of tools) {
  if (!tool) {
    const sep = document.createElement('span');
    sep.style.cssText = 'width:1px;margin:4px 4px;background:var(--slice-border-raised)';
    bar.appendChild(sep);
    continue;
  }
  const [icon, label, shortcut] = tool;
  const button = await slice.build('Button', { value: '', ariaLabel: label, icon, variant: 'ghost', size: 'sm' });
  // The tooltip lives in attributes: no ToolTip component per button.
  button.dataset.tooltip = label;
  if (shortcut) button.dataset.tooltipShortcut = shortcut;
  button.dataset.tooltipPlacement = 'bottom';
  bar.appendChild(button);
}
tips.scope(bar);
return bar;
:::

:::script label="Truncated cells in a growing list" expected="a list of files whose long names are cut with an ellipsis; hovering or tabbing to a name shows it in full; Add file adds rows that get tooltips without any extra call"
const tips = await slice.build('ToolTipProvider', { singleton: true });
const list = document.createElement('ul');
list.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;grid-template-columns:minmax(0,1fr);gap:6px;width:min(320px,100%)';

const names = [
  'Quarterly financial report – final version (approved by the board).pdf',
  'Team offsite photos, Mérida, October 2026.zip',
  'contract-renewal-2027-signed.docx'
];
let n = 0;
const addRow = (name) => {
  const li = document.createElement('li');
  li.style.cssText = 'display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--slice-border-raised);border-radius:10px';
  const label = document.createElement('span');
  label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0';
  label.textContent = name;
  // The full name, for when it does not fit.
  label.dataset.tooltip = name;
  label.dataset.tooltipPlacement = 'top-start';
  label.tabIndex = 0;
  li.appendChild(label);
  list.appendChild(li);
};
names.forEach(addRow);
// One call for the list: rows added later are covered too.
tips.scope(list);

const add = await slice.build('Button', {
  value: 'Add file', icon: 'plus', variant: 'outlined', size: 'sm',
  onClick: () => addRow(`Scanned receipt ${++n} – supermarket, pharmacy and fuel for the month.pdf`)
});
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;justify-items:start';
box.append(list, add);
return box;
:::

:::script label="Attach from code, with a toggletip" expected="three Buttons get rich tooltips through attach(); an ⓘ gets a toggletip that opens on click and holds a link"
const tips = await slice.build('ToolTipProvider', { singleton: true });
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap';

const save = await slice.build('Button', { value: 'Save', icon: 'download' });
const share = await slice.build('Button', { value: 'Share', icon: 'share-nodes', variant: 'outlined' });
const archive = await slice.build('Button', { value: 'Archive', icon: 'archive', variant: 'ghost' });
tips.attach(save, { text: 'Save the draft', shortcut: '⌘S' });
tips.attach(share, { title: 'Share', text: 'Anyone with the link can view it.', variant: 'light', placement: 'bottom' });
tips.attach(archive, { text: 'Move it out of the list. You can restore it later.', variant: 'accent', placement: 'right' });

const info = await slice.build('Button', { value: '', ariaLabel: 'About sharing', icon: 'info-circle', variant: 'ghost', size: 'sm' });
tips.attach(info, { mode: 'toggletip', title: 'About sharing', text: 'Links expire after 30 days. Manage them in Settings → Sharing.', variant: 'light' });

row.append(save, share, archive, info);
return row;
:::

## Best Practices
:::tip
Use one provider for the whole app (`{ singleton: true }`) and `scope()` the containers that hold tooltips: the toolbar, the table, the sidebar. Rows and buttons added later are covered with no extra code.
:::

:::tip
Give truncated text a tooltip with the full text. Make the element focusable (`tabIndex = 0`) or let `scope()` do it, so keyboard users can read it too.
:::

## Pitfalls
:::warning
One provider shows one tooltip at a time, and so does ToolTip: opening one closes any other. A comparison that needs two explanations side by side belongs on the page, not in tooltips.
:::

:::warning
An element added after `scope()` does not get the automatic `tabindex`. If it is not focusable on its own (a `<span>`), set `tabIndex = 0` on it, or call `attach()` for it.
:::