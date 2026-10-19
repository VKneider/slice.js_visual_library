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
each derives from its own theme token — `--success-color`, `--danger-color`, `--warning-color`,
`--info-color`, `--primary-color` — so a badge means the same thing in light and dark without you
picking a colour.

The five coloured variants were separated by measurement, not by eye: all ten pairs clear a CIE
ΔE of 36 or more, so none of them reads as another. The hues sit in distinct bands — danger 0°,
warning 32°, success 161°, info 213°, brand 271°.

Variants are **tinted**, not solid: a soft wash of the status colour, a hairline border, and text in
a readable shade of that same colour. A solid fill was measured at 3.19–3.77:1 for white text on the
lighter status colours, under the 4.5:1 AA bar for 12px text, and five saturated fills in a row read
as a traffic light rather than as badges.

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

:::script label="Size" expected="the same pill at two sizes"
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;align-items:center;';

row.appendChild(await slice.build('Badge', { variant: 'success', label: 'Healthy', size: 'md' }));
row.appendChild(await slice.build('Badge', { variant: 'success', label: 'Healthy', size: 'sm' }));
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

## Theming

`Badge` needs one token per status colour beyond the standard palette: a **readable shade**, the
version of that colour that clears 4.5:1 against its own tint on the current theme's surface.

The shade has to move in opposite directions per theme. Light darkens the status colour toward black;
dark **lightens it toward white**, because a dark theme's status colours are already light and
darkening them produces a mid-tone with no contrast on a dark surface. Getting this wrong is not
subtle — measured on the wrong direction, five of six variants land between 3.00:1 and 4.05:1 in
dark mode.

Declare the shades on `:root`, derived from the status colours you already have:

```css
:root {
  /* light theme — toward black */
  --primary-color-readable: color-mix(in srgb, var(--primary-color) 88%, #000);
  --success-color-readable: color-mix(in srgb, var(--success-color) 72%, #000);
  --warning-color-readable: color-mix(in srgb, var(--warning-color) 66%, #000);
  --danger-color-readable: color-mix(in srgb, var(--danger-color) 84%, #000);
  --info-color-readable: color-mix(in srgb, var(--info-color) 64%, #000);
}

:root[data-theme='DARK'] {
  /* dark theme — toward white. One value covers four; info needs 80% because
     this palette's status colours are already light, so a darker blue has to
     separate from them by lightness as well as by hue. */
  --primary-color-readable: color-mix(in srgb, var(--primary-color) 92%, #fff);
  --success-color-readable: color-mix(in srgb, var(--success-color) 92%, #fff);
  --warning-color-readable: color-mix(in srgb, var(--warning-color) 92%, #fff);
  --danger-color-readable: color-mix(in srgb, var(--danger-color) 92%, #fff);
  --info-color-readable: color-mix(in srgb, var(--info-color) 80%, #fff);
}
```

:::tip
The `-readable` tokens are **optional for a light theme**. Each `color` in `Badge.css` carries the
light-tuned value as a fallback, so a theme with only the standard tokens still renders between
4.89:1 and 5.38:1. They are **effectively required for a dark theme**: without them, dark badges fall
to 3.00–4.05:1.

That fallback is not belt-and-braces. `slice init` copies the **framework's** `src/`, themes included,
so a new app's theme is `slicejs-web-framework`'s `Light.css` — 21 tokens, and its only shade is
`--primary-color-shade`, a *border* tone. None of the five above are in it.
:::

:::warning
**`--primary-color-shade` is a different token.** It is a border/surface tone of the brand, used in
~40 declarations across 15 components and Required by the component standards.
`--primary-color-readable` is the *text* tone, for text sitting on a tint. The `-readable` suffix
exists to keep the two apart.

**There is no `--accent-color`.** It measured at 3° of hue and 1.52:1 from `--secondary-color` — a
duplicate rather than a third colour — and in the wild "accent" already means *the brand*, which is
`--primary-color` here. The `accent` **variant** survives and is purple; only the redundant token is
gone.
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
