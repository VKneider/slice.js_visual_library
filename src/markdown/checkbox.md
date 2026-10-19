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
- `onChange` fires with the new checked state (`true`/`false`) whenever the user toggles it, whether they click the box or the label. Assign `null` to clear the handler.
- `label` and `labelPlacement` define readable form semantics.
- `variant` sets the visual style: `default` (success accent), `outlined` (transparent surface, primary accent), `soft` (tinted surface, muted accent), `danger` (destructive confirmations) or `plain` (no container chip — just the bare box and label). Unknown values fall back to `default`.
- Per-instance border tuning: set `--slice-checkbox-box-border-width` on the host to retune or remove the box border without touching the component (pair it with `--slice-checkbox-box-surface` so an unchecked box stays visible).
- `size` (`sm` | `md` | `lg`) scales the box and its label together; `md` is the default.
- `disabled` prevents interaction while keeping current value visible.
- The real `<input>` is visually hidden behind the styled `.checkmark` but stays focusable, and the focus ring is drawn on the checkmark so keyboard users can see where they are.

## Live Preview
:::component name="Checkbox"
{
  "label": "Accept terms & conditions",
  "checked": true
}
:::

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
  onClick: () => {
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

:::script label="variant variations" expected="default, outlined, soft, danger and plain styles"
const variants = ['default', 'outlined', 'soft', 'danger', 'plain'];
const host = document.createElement('div');
host.style.display = 'flex';
host.style.flexWrap = 'wrap';
host.style.gap = '10px';

for (const variant of variants) {
  const item = await slice.build('Checkbox', {
    label: variant,
    checked: true,
    variant
  });
  host.appendChild(item);
}

return host;
:::

:::script label="size variations" expected="sm, md and lg render at increasing sizes"
const sizes = ['sm', 'md', 'lg'];
const host = document.createElement('div');
host.style.display = 'flex';
host.style.alignItems = 'center';
host.style.gap = '10px';

for (const size of sizes) {
  const item = await slice.build('Checkbox', {
    label: size,
    checked: true,
    size
  });
  host.appendChild(item);
}

return host;
:::

:::script label="plain variant in a dense list" expected="no container chip, just the box and label"
const host = document.createElement('div');
host.style.display = 'grid';
host.style.gap = '4px';

for (const label of ['Enable notifications', 'Share usage data', 'Sync across devices']) {
  const item = await slice.build('Checkbox', { label, variant: 'plain' });
  host.appendChild(item);
}

return host;
:::

:::script label="borderless box via a custom property" expected="box keeps its fill but loses the border"
const checkbox = await slice.build('Checkbox', {
  label: 'Borderless',
  checked: true,
  variant: 'plain'
});

checkbox.style.setProperty('--slice-checkbox-box-border-width', '0');
checkbox.style.setProperty(
  '--slice-checkbox-box-surface',
  'color-mix(in srgb, var(--primary-color) 18%, transparent)'
);

return checkbox;
:::

:::script label="destructive confirmation" expected="danger variant for an irreversible action"
const checkbox = await slice.build('Checkbox', {
  label: 'I understand this permanently deletes my account',
  variant: 'danger'
});

return checkbox;
:::
