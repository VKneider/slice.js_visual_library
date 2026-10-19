---
title: ColorPicker
route: /docs/input/color-picker
navLabel: ColorPicker
section: Input Components
group: Basic
order: 17
description: A labelled colour swatch with a hex readout that normalizes any CSS colour before the browser can silently black it out.
component: ColorPickerDocumentation
generate: true
tags: [color, colour, picker, swatch, theme, hex, form]
---

# ColorPicker

## Overview

`ColorPicker` is a labelled colour control: a native swatch, the current hex value, and an
optional hint line underneath.

It wraps `<input type="color">` rather than replacing it. The native control carries the OS
colour dialog, touch behaviour and keyboard support that a hand-rolled swatch grid never gets
right for free — what it does not carry is a label, a readable value, or any way to report that
it could not understand the colour you gave it.

## Core Behavior
- `label` names the control through a real `<label for>` association, so it appears as the
  accessible name. Each instance generates its own input id, so several pickers on one page never
  cross-wire.
- `value` is always normalized to lowercase `#rrggbb`. `#rgb` is expanded and `rgb()` / `rgba()`
  (comma or space syntax) are converted.
- The hex readout mirrors the value. A native colour input shows nothing, so a colour table
  cannot tell you what it is actually holding.
- `hint` renders a small monospace line under the control — a CSS variable name, a usage note.
- `onChange(value)` fires on every `input` event with the normalized hex, so it follows a drag
  rather than waiting for the dialog to close.
- `size` (`md` | `sm`) comes from the shared recipe every control validates against.
- `customColor.accent` tints the swatch **border** only. Filling the swatch would fight the
  colour the user actually picked, which is the one thing the control exists to show.
- `disabled` removes the control from interaction.

## Why not a bare `<input type="color">`

The failure this component exists to absorb is silent. Hand a native colour input `rgb(0 128 0)`,
`var(--brand)` or `rebeccapurple` and it renders **black** and reports nothing. The result looks
like a rendering bug, not a bad argument — so `ColorPicker` normalizes on the way in and shows
you the fallback it actually landed on.

## Live Preview
:::component name="ColorPicker"
{
  "label": "Primary color",
  "value": "#9333ea",
  "hint": "--primary-color"
}
:::

## Prop Scenarios
:::script label="plain picker" expected="a labelled swatch showing its hex value"
const picker = await slice.build('ColorPicker', {
  label: 'Primary color',
  value: '#9333ea'
});
return picker;
:::

:::script label="with a CSS variable hint" expected="the variable name under the control"
const picker = await slice.build('ColorPicker', {
  label: 'Danger',
  value: '#dc2626',
  hint: '--danger-color'
});

const host = document.createElement('div');
host.style.maxWidth = '280px';
host.appendChild(picker);
return host;
:::

:::script label="colour table" expected="a row of independent swatches, each with its own value"
const tokens = [
  { label: 'Primary', value: '#9333ea' },
  { label: 'Secondary', value: '#0891b2' },
  { label: 'Success', value: '#059669' },
  { label: 'Warning', value: '#d97706' },
  { label: 'Danger', value: '#dc2626' }
];

const host = document.createElement('div');
host.style.display = 'grid';
host.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
host.style.gap = '0.75rem';

for (const token of tokens) {
  host.appendChild(await slice.build('ColorPicker', {
    label: token.label,
    value: token.value,
    hint: '--' + token.label.toLowerCase() + '-color'
  }));
}
return host;
:::

:::script label="onChange on every edit" expected="the swatch updates as the value is dragged"
const readout = document.createElement('p');
readout.style.fontFamily = 'var(--font-family-code, monospace)';
readout.style.marginTop = '0.5rem';

const picker = await slice.build('ColorPicker', {
  label: 'Pick a colour',
  value: '#059669',
  onChange: (hex) => {
    readout.textContent = 'onChange -> ' + hex;
  }
});

const host = document.createElement('div');
host.style.maxWidth = '280px';
host.appendChild(picker);
host.appendChild(readout);
return host;
:::

## Normalization
`value` accepts the three spellings that actually reach a UI, and falls back for the rest.

| Input | Result |
| --- | --- |
| `#9333ea` | `#9333ea` |
| `#0f8` | `#00ff88` |
| `rgb(147, 51, 234)` | `#9333ea` |
| `rgb(147 51 234 / 0.5)` | `#9333ea` |
| `var(--brand)` | `#000000` (documented fallback) |
| `rebeccapurple` | `#000000` (documented fallback) |

Named colours and `oklch()` / `color-mix()` cannot be rendered in a swatch at all, so they fall
back rather than going black in silence.

## Best Practices
:::tip
Use `hint` for whatever the label cannot say in a couple of words — a CSS custom property name
in a theme editor, a token key in a design system. It is rendered in the code font for exactly
that kind of identifier.
:::

:::tip
Pair `onChange` with `value` rather than only `onChange`. `onChange` fires on every input event
during a drag, so a consumer that does expensive work per call should debounce it.
:::

## Pitfalls
:::warning
`customColor` tints the border only. Setting `accent` to the same colour as `value` does not fill
the swatch — the whole point of the control is to show the value the user picked.
:::

:::warning
The hex readout is `aria-hidden`. Screen readers already announce the value through the input
itself, and `<output>` has an implicit `role="status"`, which would otherwise announce every
intermediate value during a drag.
:::