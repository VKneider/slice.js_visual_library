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

:::script label="labelPlacement variations" expected="left/right/top/bottom placements render correctly"
const placements = ['left', 'right', 'top', 'bottom'];
const host = document.createElement('div');
host.style.display = 'grid';
host.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
host.style.gap = '8px';

for (const placement of placements) {
  const item = await slice.build('Checkbox', {
    label: `Placement ${placement}`,
    checked: placement === 'left' || placement === 'top',
    labelPlacement: placement
  });
  host.appendChild(item);
}

return host;
:::

:::script label="checked state variations" expected="shows both checked=true and checked=false states"
const host = document.createElement('div');
host.style.display = 'flex';
host.style.flexWrap = 'wrap';
host.style.gap = '10px';

const checkedOn = await slice.build('Checkbox', {
  label: 'Checked true',
  checked: true
});

const checkedOff = await slice.build('Checkbox', {
  label: 'Checked false',
  checked: false
});

host.appendChild(checkedOn);
host.appendChild(checkedOff);
return host;
:::
