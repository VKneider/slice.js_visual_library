---
title: Badge
route: /docs/display/badge
navLabel: Badge
section: Display
group: Basic
order: 25
description: A status, a count or a mark next to what it describes. Tone for the meaning, variant for the loudness; icon, live indicator, dot, sizes and colours of your own.
component: BadgeDocumentation
generate: true
tags: [badge, pill, status, count, dot, tag, label]
---

# Badge

## Overview
`Badge` says, in one or two words, what state something is in: an order that is **Paid**, a server that is **Down**, **12** unread messages, a feature that is **New**. It sits next to the thing it describes: a row, a tab, a title, a button, an avatar.

Two separate choices, as everywhere else in the library:

- **`tone`** is what it **means**: `neutral`, `accent`, `success`, `warning`, `danger`, `info`. Each one follows its theme colour, so it means the same in any theme.
- **`variant`** is how **loud** it is, with [Button](/docs/input/button)'s names: `soft` (a tint, the default), `filled` (the colour itself, for what must be seen) or `outlined` (just a line, for many badges side by side).

### When to use it
- **Statuses** of records in lists and tables: Paid / Pending / Overdue, Active / Away, Draft / Published.
- **Counts** that ask for attention: unread messages, pending reviews, items in a cart.
- **Live states**: "● Live", "● Online", "● Deploying", with `indicator` and `pulse`.
- **Short marks**: New, Beta, Pro, a version number (`shape: 'rounded'`).

### When not to use it
- **Something the user can click or remove.** A badge is not a button. Use a [Button](/docs/input/button), or a chip/tag input when tags are edited.
- **A message with a sentence in it.** Use a [Toast](/docs/feedback/toast) or an inline alert; a badge is one or two words.
- **A person.** Use [Avatar](/docs/display/avatar), which already has `status` and its own `badge`.
- **Many colours with no meaning.** Seven coloured pills in one row is noise. Keep `neutral` for the ordinary state and save colour for what needs noticing.

## Core Behavior
- **`label`**: the text. **`value`**: a number, which wins over `label` and is capped by **`max`** (99 by default, so 120 shows "99+").
- A count of `0` hides the badge, so a "0 unread" bubble never shows. **`showZero: true`** keeps it.
- With nothing to show (no label, no value, no icon), the badge hides itself.
- **`icon`**: an [Icon](/docs/display/icon) name before the text. It is built and destroyed with the badge.
- **`indicator`**: a small dot before the text, for a state that is live. **`pulse`** makes it breathe; with reduced motion it stays still.
- **`dot`**: only a dot, no text. `label` becomes what screen readers hear ("New" if there is none).
- **`color`**: a colour of your own (a category, a team, a project) instead of a tone. The text is mixed toward the page's text colour so it stays readable.
- Every prop can change after building: `badge.value = 13`, `badge.tone = 'success'`.

## Looks
- `size`: `'sm'` (20px), `'md'` (24px, default), `'lg'` (30px).
- `shape`: `'pill'` (default) for states and counts, `'rounded'` for labels that are not states (versions, categories, keys).
- In a line of text, the badge sits on the text's optical centre at any font size.

:::note
Before tones, `variant` took the meaning (`variant: 'success'`). That still works: the badge takes it as the tone and logs one note. Change it to `tone: 'success'` when you can.
:::

## Live Preview
:::component name="Badge"
{
  "label": "Paid",
  "tone": "success",
  "icon": "check"
}
:::

## Examples
:::script label="Orders: one status per row" expected="a list of orders, each with the customer, the total and a status badge on the right: Paid in green, Pending in amber, Shipped in blue with a truck icon, Refunded in grey and Overdue in red filled"
const STATUS = {
  paid: { label: 'Paid', tone: 'success', icon: 'check' },
  pending: { label: 'Pending', tone: 'warning', icon: 'clock' },
  shipped: { label: 'Shipped', tone: 'info', icon: 'truck' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  overdue: { label: 'Overdue', tone: 'danger', variant: 'filled' }
};
const orders = [
  { id: 1042, customer: 'Ana López', total: '$129.00', status: 'paid' },
  { id: 1041, customer: 'Lucas Molina', total: '$54.50', status: 'pending' },
  { id: 1040, customer: 'María Ruiz', total: '$310.00', status: 'shipped' },
  { id: 1039, customer: 'Andrés Bello', total: '$18.90', status: 'refunded' },
  { id: 1038, customer: 'Sofía Rey', total: '$740.00', status: 'overdue' }
];

const list = await slice.build('DataList', {
  items: orders,
  title: (o) => `#${o.id} · ${o.customer}`,
  description: 'total',
  badge: (o) => STATUS[o.status],
  searchable: true
});
list.style.width = '100%';
return list;
:::

:::script label="Counts on navigation" expected="a row of three ghost buttons: Inbox with a red 12, Reviews with a soft 3, Archive with nothing because its count is 0; clicking Inbox clears its count"
const bar = document.createElement('nav');
bar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';

const tabs = [
  { label: 'Inbox', count: 12, tone: 'danger', variant: 'filled' },
  { label: 'Reviews', count: 3, tone: 'accent' },
  { label: 'Archive', count: 0 }
];
for (const tab of tabs) {
  const counter = await slice.build('Badge', { value: tab.count, tone: tab.tone || 'neutral', variant: tab.variant || 'soft', size: 'sm' });
  const button = await slice.build('Button', {
    value: tab.label,
    variant: 'ghost',
    onClick: () => { counter.value = 0; }
  });
  button.querySelector('button')?.append(' ', counter);
  bar.append(button);
}
return bar;
:::

:::script label="Live status" expected="a service status panel: API with a pulsing green Operational, Database with an amber Degraded, Webhooks with a red Down; a Live badge in the header; a Simulate button that cycles the API status"
const panel = document.createElement('section');
panel.style.cssText = 'display:grid;gap:10px;width:100%;max-width:420px;padding:16px;border-radius:12px;border:1px solid var(--primary-color-shade, #ddd)';
const head = document.createElement('header');
head.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
head.innerHTML = '<strong>System status</strong>';
head.append(await slice.build('Badge', { label: 'Live', tone: 'danger', variant: 'filled', indicator: true, pulse: true, size: 'sm' }));
panel.append(head);

const STATES = [
  { label: 'Operational', tone: 'success', pulse: true },
  { label: 'Degraded', tone: 'warning', pulse: false },
  { label: 'Down', tone: 'danger', pulse: false }
];
const services = [['API', 0], ['Database', 1], ['Webhooks', 2]];
const badges = [];
for (const [name, state] of services) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:space-between;align-items:center';
  row.textContent = name;
  const badge = await slice.build('Badge', { ...STATES[state], indicator: true });
  badges.push(badge);
  row.append(badge);
  panel.append(row);
}

let api = 0;
const simulate = await slice.build('Button', {
  value: 'Simulate API change',
  variant: 'outlined',
  onClick: () => {
    api = (api + 1) % STATES.length;
    Object.assign(badges[0], STATES[api]);
  }
});
panel.append(simulate);
return panel;
:::

:::script label="Tones, variants and sizes" expected="a grid: six tones in rows, each in soft, filled and outlined; then the three sizes; then a dot, a rounded version tag and two custom colours"
const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:auto repeat(3, auto);gap:10px 16px;align-items:center;justify-items:start';
grid.innerHTML = '<span></span><small>soft</small><small>filled</small><small>outlined</small>';
for (const tone of ['neutral', 'accent', 'success', 'warning', 'danger', 'info']) {
  const name = document.createElement('small');
  name.textContent = tone;
  grid.append(name);
  for (const variant of ['soft', 'filled', 'outlined']) {
    grid.append(await slice.build('Badge', { label: tone[0].toUpperCase() + tone.slice(1), tone, variant }));
  }
}

const more = document.createElement('div');
more.style.cssText = 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px';
for (const size of ['sm', 'md', 'lg']) more.append(await slice.build('Badge', { label: size, tone: 'accent', size }));
more.append(
  await slice.build('Badge', { dot: true, tone: 'danger', label: 'Unread' }),
  await slice.build('Badge', { label: 'v3.4.1', shape: 'rounded' }),
  await slice.build('Badge', { label: 'Design', color: '#db2777' }),
  await slice.build('Badge', { label: 'Platform', color: '#0d9488', icon: 'tag' })
);

const box = document.createElement('div');
box.append(grid, more);
return box;
:::

## Theming
Each tone uses its theme colour (`--primary-color` for `accent`, `--success-color`, `--warning-color`, `--danger-color`, `--info-color`, `--medium-color` for `neutral`) and a **readable shade** of it for the text: the version of the colour that clears 4.5:1 against its own tint, and that `filled` uses as its fill.

The shade has to move in opposite directions per theme. Light darkens the colour toward black; dark **lightens it toward white**, because a dark theme's status colours are already light. Declare the shades on `:root`:

```css
:root {
  /* light theme: toward black */
  --primary-color-readable: color-mix(in srgb, var(--primary-color) 88%, #000);
  --success-color-readable: color-mix(in srgb, var(--success-color) 72%, #000);
  --warning-color-readable: color-mix(in srgb, var(--warning-color) 66%, #000);
  --danger-color-readable: color-mix(in srgb, var(--danger-color) 84%, #000);
  --info-color-readable: color-mix(in srgb, var(--info-color) 64%, #000);
}

:root[data-theme='DARK'] {
  /* dark theme: toward white */
  --primary-color-readable: color-mix(in srgb, var(--primary-color) 92%, #fff);
  --success-color-readable: color-mix(in srgb, var(--success-color) 92%, #fff);
  --warning-color-readable: color-mix(in srgb, var(--warning-color) 92%, #fff);
  --danger-color-readable: color-mix(in srgb, var(--danger-color) 92%, #fff);
  --info-color-readable: color-mix(in srgb, var(--info-color) 80%, #fff);
}
```

:::tip
The `-readable` tokens are **optional for a light theme**: `Badge.css` carries the light values as fallbacks, so a fresh app's theme already passes. They are **needed for a dark theme**, where the fallbacks would be too dark. The specs measure every tone in every variant, in both themes, against 4.5:1.
:::

:::warning
`--primary-color-shade` is a different token: a border and surface tone of the brand. `--primary-color-readable` is the text tone. The `-readable` suffix keeps the two apart.
:::

To restyle one badge or all of them, the per-badge variables are `--slice-badge-color`, `--slice-badge-ink` (text and fill), `--slice-badge-tint` (how strong the soft background is), `--slice-badge-height`, `--slice-badge-font`, `--slice-badge-pad` and `--slice-badge-dot`.

## Best Practices
:::tip
Map your statuses to badges in one place (`const STATUS = { paid: { label, tone, icon } }`) and pass `STATUS[row.status]`. Every screen then shows the same state the same way.
:::

:::tip
Use `filled` only for what must be seen before anything else (Overdue, Down, a count of unread messages). If everything is filled, nothing stands out.
:::

:::tip
On top of a button or an avatar, position the badge in your own layout (`position: absolute`). `Badge` styles itself, not its place next to a sibling. [Avatar](/docs/display/avatar) already does it with its `badge` prop.
:::

## Pitfalls
:::warning
Colour alone is not enough. Keep a `label` or a `value`: red and green look different to most people, but only the word tells a colour-blind user which is which. A `dot` needs a `label` too, for screen readers.
:::

:::warning
Do not show a live `pulse` the app cannot keep up to date. A green "● Online" that stays on after the server went down is worse than no badge.
:::