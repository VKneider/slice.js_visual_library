---
title: Slider
route: /docs/input/slider
navLabel: Slider
section: Input Components
group: Basic
order: 15
description: Numeric slider with keyboard support, a two-thumb range mode, marks and formatted values.
component: SliderDocumentation
generate: true
tags: [slider, range, input, forms, number]
---

# Slider

## Overview
`Slider` picks a number within a range by dragging, clicking the track or using the keyboard. With `range: true` it has two thumbs and picks an interval (`[low, high]`), such as a price filter.

Use it when an approximate value is fine and seeing it relative to the whole range helps (volume, opacity, a price band). When the exact number matters, prefer `Input` with a number type — dragging to precisely 1,375 is frustrating.

## Core Behavior
- `min`, `max` and `step` define the scale (defaults `0`, `100`, `1`). Decimal steps such as `0.1` work and never leak float noise (`0.30000000000000004` is stored as `0.3`).
- `value` is a number, clamped to `min`/`max` and snapped to `step` counted from `min`. Props can arrive in any order: `{ value: 150, max: 200 }` keeps 150.
- `range: true` makes `value` a `[low, high]` pair. A non-array value becomes `[min, max]`, a reversed pair is sorted, and a thumb stops at the other one instead of crossing it.
- `onInput(value)` fires continuously while the value moves (dragging, a held arrow key). `onChange(value)` fires once the user commits it (thumb released, key pressed, mark clicked). Setting `value`, `min`, `max`, `step` or `range` from code fires neither. Assign `null` to clear a handler.
- `value` returns a copy in range mode, so mutating the array you got back does not change the slider.
- `formatValue(value)` formats the visible value **and** the `aria-valuetext` read by screen readers, for example `(v) => '$' + v`. If it throws, the plain number is shown.
- `showValue: false` hides the value next to the label.
- `marks` is an array of numbers or `{ value, label }`, drawn under the track. Clicking a mark moves the (nearest) thumb there. Marks outside `min`/`max` are ignored.
- `label` names the slider; in range mode each thumb is named `"<label> (minimum)"` / `"<label> (maximum)"`.
- `name` sets the native input name, so a surrounding `<form>` submits the value (both ends under the same name in range mode).
- `disabled` blocks dragging, clicking and the keyboard.
- `variant`: `default`, `outlined`, `soft` or `plain` (no container chip). `size`: `sm`, `md`, `lg`. `customColor: { accent }` recolours the fill and thumb, in every variant.

## Keyboard and accessibility
Each thumb is a native `<input type="range">`, so the browser provides the standard slider behaviour:

- **← / ↓** and **→ / ↑** move by one `step`.
- **Page Up / Page Down** move by a larger amount.
- **Home / End** jump to `min` / `max`.

Screen readers announce the role, the name, the current value (or the `formatValue` text) and the bounds. `el.focus()` focuses the (low) thumb. The focus ring is drawn on the thumb. Marks are a pointer shortcut and are not extra tab stops.

## Theming
Per-instance custom properties on the host: `--slice-slider-track`, `--slice-slider-track-height`, `--slice-slider-thumb`, `--slice-slider-thumb-size`, `--slice-slider-thumb-border-width`, `--slice-slider-surface` and `--slice-slider-surface-border`. Use `customColor` for the accent.

## Live Preview
:::component name="Slider"
{
  "label": "Volume",
  "value": 40
}
:::

## Prop Scenarios
:::script label="basic slider" expected="a labelled slider at 40"
const slider = await slice.build('Slider', {
  label: 'Volume',
  value: 40
});

return slider;
:::

:::script label="onInput vs onChange" expected="the first line updates while dragging, the second only on release"
const live = document.createElement('p');
const committed = document.createElement('p');
live.textContent = 'onInput: 50';
committed.textContent = 'onChange: 50';

const slider = await slice.build('Slider', {
  label: 'Brightness',
  value: 50,
  onInput: (value) => { live.textContent = `onInput: ${value}`; },
  onChange: (value) => { committed.textContent = `onChange: ${value}`; }
});

const host = document.createElement('div');
host.append(slider, live, committed);
return host;
:::

:::script label="price range with formatted values" expected="two thumbs, values shown as dollars"
const slider = await slice.build('Slider', {
  label: 'Price',
  range: true,
  min: 0,
  max: 500,
  step: 10,
  value: [80, 320],
  formatValue: (v) => `$${v}`
});

return slider;
:::

:::script label="decimal step with a percentage" expected="0 to 1 in tenths, shown as a percentage"
const slider = await slice.build('Slider', {
  label: 'Opacity',
  min: 0,
  max: 1,
  step: 0.1,
  value: 0.6,
  formatValue: (v) => `${Math.round(v * 100)}%`
});

return slider;
:::

:::script label="marks" expected="labelled stops under the track; clicking one jumps there"
const slider = await slice.build('Slider', {
  label: 'Quality',
  min: 0,
  max: 100,
  step: 25,
  value: 50,
  showValue: false,
  marks: [
    { value: 0, label: 'Low' },
    { value: 50, label: 'Medium' },
    { value: 100, label: 'High' }
  ]
});

return slider;
:::

:::script label="controlled from outside" expected="the buttons set the value without firing onChange"
const slider = await slice.build('Slider', { label: 'Zoom', min: 50, max: 200, step: 10, value: 100, formatValue: (v) => `${v}%` });

const actions = document.createElement('div');
actions.style.display = 'flex';
actions.style.gap = '8px';

for (const value of [50, 100, 200]) {
  actions.appendChild(await slice.build('Button', {
    value: `${value}%`,
    size: 'sm',
    variant: 'outlined',
    onClick: () => { slider.value = value; }
  }));
}

const host = document.createElement('div');
host.append(slider, actions);
return host;
:::

:::script label="variant variations" expected="default, outlined, soft and plain"
const host = document.createElement('div');
host.style.display = 'grid';
host.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
host.style.gap = '12px';

for (const variant of ['default', 'outlined', 'soft', 'plain']) {
  host.appendChild(await slice.build('Slider', { label: variant, variant, value: 60 }));
}

return host;
:::

:::script label="sizes, disabled and custom accent" expected="sm, md, lg, a disabled slider and an amber one"
const host = document.createElement('div');
host.style.display = 'grid';
host.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
host.style.gap = '12px';

for (const size of ['sm', 'md', 'lg']) {
  host.appendChild(await slice.build('Slider', { label: `Size ${size}`, size, value: 40 }));
}
host.appendChild(await slice.build('Slider', { label: 'Disabled', value: 60, disabled: true }));
host.appendChild(await slice.build('Slider', { label: 'Custom accent', value: 70, customColor: { accent: '#d97706' } }));

return host;
:::

:::script label="inside a Form" expected="submitting prints the numbers"
const result = document.createElement('pre');

const form = await slice.build('Form', {
  submitText: 'Save',
  schema: [
    { name: 'volume', component: 'Slider', props: { label: 'Volume', value: 30, variant: 'plain' } },
    { name: 'budget', component: 'Slider', props: { label: 'Budget', range: true, max: 1000, step: 50, value: [200, 600], formatValue: (v) => `$${v}`, variant: 'plain' } }
  ],
  onSubmit: (values) => { result.textContent = JSON.stringify(values); }
});

const host = document.createElement('div');
host.append(form, result);
return host;
:::

## Best Practices
:::tip
Always pass `formatValue` when the number has a unit. It is what a screen reader announces, so "40%" is understood where "0.4" is not.
:::

:::tip
Use `onInput` for cheap live feedback (a preview) and `onChange` for anything expensive (a request, saving), so dragging does not fire a hundred requests.
:::

## Pitfalls
:::warning
A slider has no intrinsic width. It reserves a minimum of `12rem` so it never collapses; give it a real width in tight rows.
:::

:::warning
In range mode, when both thumbs sit on the same value, dragging grabs the top one, which can only move away from the other in one direction. Use the keyboard (Tab to the other thumb) or click the track on the side you want.
:::