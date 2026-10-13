---
title: Badge
route: /docs/display/badge
navLabel: Badge
section: Display
group: Basic
order: 25
description: Small status pill or count, with semantic variants that follow the theme.
component: BadgeDocumentation
generate: true
tags: [badge, pill, status, count, dot]
---

# Badge

## Overview

A `Badge` is a small status pill: a count, a label, or a bare dot. It answers "what state is this
thing in" at a glance, next to a list item, a tab, an avatar or a button.

Variants are **semantic** (`success`, `danger`, `warning`, `info`, `accent`), not decorative, and
each derives from theme tokens — so a badge means the same thing in light and dark without you
picking a colour.

## API

- `variant` (`neutral` | `accent` | `success` | `warning` | `danger` | `info`, default `neutral`)
- `label` (string) — the text. Doubles as the accessible name when `dot` is set.
- `value` (number | null) — a count. Wins over `label`, and is capped by `max` (`99` → `99+`).
- `max` (number, default `99`) — the cap for `value`.
- `dot` (boolean) — render a bare dot instead of text.
- `size` (`sm` | `md`, default `md`)

## Prop Scenarios

:::script label="Semantic variants" expected="six pills, each in its semantic theme colour"
const meanings = [
  ['neutral', 'Archived'],
  ['accent', 'Live'],
  ['success', 'Healthy'],
  ['warning', 'Degraded'],
  ['danger', 'Down'],
  ['info', 'Beta'],
];

const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';

for (const [variant, label] of meanings) {
  row.appendChild(await slice.build('Badge', { variant, label }));
}
return row;
:::

:::script label="Counts" expected="a count badge, and a capped one"
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;align-items:center;';

row.appendChild(await slice.build('Badge', { variant: 'accent', value: 3 }));
row.appendChild(await slice.build('Badge', { variant: 'danger', value: 1200 }));
row.appendChild(await slice.build('Badge', { variant: 'neutral', label: 'New' }));
return row;
:::

:::script label="Dot" expected="a bare dot with an accessible name"
const wrap = document.createElement('div');
wrap.style.cssText = 'display:flex;gap:12px;align-items:center;font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);';

const badge = await slice.build('Badge', { variant: 'accent', dot: true, label: 'Unread messages' });
wrap.appendChild(badge);
wrap.appendChild(document.createTextNode('a dot carries no text, so it needs a label for screen readers'));
return wrap;
:::

## Best Practices

:::tip
Overlaid on a button or an avatar, keep the badge `absolute` in your own layout — `Badge` only
styles itself, not its position relative to a sibling.
:::

## Pitfalls

:::warning
Colour alone is not enough of a signal. A `danger` badge next to a `success` one reads differently to
everyone, but only the text tells a colourblind user which is which — keep `label` or `value` set.
:::