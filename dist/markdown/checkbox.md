---
title: Checkbox
route: /docs/input/checkbox
navLabel: Checkbox
section: Input Components
group: Basic
order: 13
description: Checkbox component documentation with practical prop scenarios.
component: CheckboxDocumentation
generate: true
tags: [checkbox, input, forms]
---

# Checkbox

## Overview
`Checkbox` handles boolean selection with optional label, placement, and disabled state.

## Core Behavior
- `checked` controls current selection state.
- `label` and `labelPlacement` define readable form semantics.
- `disabled` prevents interaction while keeping current value visible.

## Basic Usage
```javascript title="Build checkbox"
const checkbox = await slice.build('Checkbox', {
  label: 'Accept terms',
  checked: false
});

this.appendChild(checkbox);
```

## Prop Scenarios
:::script label="default unchecked" expected="checkbox starts unchecked with right label"
const checkbox = await slice.build('Checkbox', {
  label: 'Receive newsletter'
});

return checkbox;
:::

:::script label="pre-checked agreement" expected="checkbox renders checked when checked is true"
const checkbox = await slice.build('Checkbox', {
  label: 'I agree with privacy policy',
  checked: true
});

return checkbox;
:::

:::script label="disabled checkbox" expected="disabled state blocks interaction"
const checkbox = await slice.build('Checkbox', {
  label: 'Managed by policy',
  checked: true,
  disabled: true
});

return checkbox;
:::

:::script label="checkbox with external toggle" expected="button can update checkbox checked prop"
const checkbox = await slice.build('Checkbox', {
  label: 'Enable reminders',
  checked: false
});

const toggle = await slice.build('Button', {
  value: 'Toggle reminders',
  onClickCallback: () => {
    checkbox.checked = !checkbox.checked;
  }
});

const host = document.createElement('div');
host.appendChild(checkbox);
host.appendChild(toggle);
return host;
:::
