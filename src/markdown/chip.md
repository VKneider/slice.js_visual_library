---
title: Chip
route: /docs/display/chip
navLabel: Chip
section: Display
group: Basic
order: 26
description: Compact label for filters, tags and selections, optionally removable.
component: ChipDocumentation
generate: true
tags: [chip, tag, pill, filter, removable]
---

# Chip

## Overview

A `Chip` is a compact label for a filter, a tag, or a selected value in a multi-select. It sits
inline, wraps long text with an ellipsis, and can carry an icon and a remove affordance.

For a read-only status pill, use `Badge` instead — a Badge carries state, a Chip carries a
selection you can act on.

## API

- `label` (string)
- `icon` (string) — an `Icon` name; empty renders no glyph
- `variant` (`neutral` | `accent` | `success` | `warning` | `danger`, default `neutral`)
- `size` (`sm` | `md`, default `md`)
- `disabled` (boolean)
- `removable` (boolean) — renders a real `<button>` remove affordance
- `removeLabel` (string, default `"Remove"`) — used for the button's `aria-label` and tooltip
- `onRemove` (function) — called with the chip's `label`

The remove button is labelled `"<removeLabel>: <label>"`, so a screen-reader user hears *which* chip
they are removing rather than a list of identical "Remove" buttons.

## Prop Scenarios

:::script label="Chips" expected="plain, accent and warning chips in a row"
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;';

row.appendChild(await slice.build('Chip', { label: 'All' }));
row.appendChild(await slice.build('Chip', { label: 'Active', variant: 'accent', icon: 'check' }));
row.appendChild(await slice.build('Chip', { label: 'Deprecated', variant: 'warning' }));
row.appendChild(await slice.build('Chip', { label: 'Archived', variant: 'neutral', size: 'sm' }));
return row;
:::

:::script label="Removable chips" expected="clicking the x reports which chip was removed"
const log = document.createElement('p');
log.textContent = 'Nothing removed yet';
log.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';

const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

for (const label of ['Vue', 'React', 'Svelte']) {
   row.appendChild(await slice.build('Chip', {
      label,
      removable: true,
      onRemove: (removed) => { log.textContent = `Removed: ${removed}`; },
   }));
}

const wrap = document.createElement('div');
wrap.appendChild(row);
wrap.appendChild(log);
return wrap;
:::

## Best Practices

:::tip
Use `Chip` for things the user chose and can remove, `Badge` for things the system decided. Mixing
the two makes it unclear whether a pill is clickable.
:::

## Pitfalls

:::warning
A Chip is not draggable. To reorder a list of chips, register them with `DragDropService` yourself —
sorting is a container concern, not something a chip should own.
:::