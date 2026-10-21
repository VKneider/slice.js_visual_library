---
title: Switch
route: /docs/input/switch
navLabel: Switch
section: Input Components
group: Basic
order: 14
description: Switch component documentation with practical interaction scenarios.
component: SwitchDocumentation
generate: true
tags: [switch, input, toggle]
---

# Switch

## Overview
`Switch` provides an on/off control for feature flags and settings toggles.

## Core Behavior
- `checked` controls active state.
- `onChange` fires with the new checked state (`true`/`false`) when the user toggles it — by clicking the track, the label, or pressing Space. Setting `checked` from code does not fire it. Assign `null` to clear the handler.
- `toggle` is the deprecated name for `onChange`. It still works and warns once.
- `label` and `labelPlacement` improve context readability.
- `variant` matches `Checkbox`: `default` (success accent), `outlined`, `soft`, `danger` (for a switch that turns on something risky) or `plain` (no container chip). Unknown values fall back to `default`.
- `size` (`sm` | `md` | `lg`) scales the track, knob and label together; `md` is the default.
- `customColor: { accent }` recolours the active track, in every variant.
- The input is a real checkbox exposed with `role="switch"`, so screen readers announce it as on/off. It is visually hidden but stays focusable, and the focus ring is drawn on the track.
- Per-instance tuning: `--slice-switch-thumb`, `--slice-switch-track-surface`, `--slice-switch-track-border`, `--slice-switch-track-border-width` and `--slice-switch-height` can be set on the host.

## Live Preview
:::component name="Switch"
{
  "label": "Notifications",
  "checked": true
}
:::

## Prop Scenarios
:::script label="settings switch" expected="switch renders with label and initial checked state"
const sw = await slice.build('Switch', {
  label: 'Dark mode',
  checked: true
});

return sw;
:::

:::script label="switch with callback" expected="onChange runs on interaction and updates the status text"
const status = document.createElement('p');
status.textContent = 'State: off';

const sw = await slice.build('Switch', {
  label: 'Auto-save',
  checked: false,
  onChange: () => {
    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;
  }
});

const host = document.createElement('div');
host.appendChild(sw);
host.appendChild(status);
return host;
:::

:::script label="disabled switch" expected="disabled switch keeps value but blocks changes"
const sw = await slice.build('Switch', {
  label: 'Controlled by admin',
  checked: true,
  disabled: true
});

return sw;
:::

:::script label="switch with custom color" expected="customColor updates active visual accent"
const sw = await slice.build('Switch', {
  label: 'Deploy protection',
  checked: true,
  customColor: { accent: '#16a34a' }
});

return sw;
:::

:::script label="labelPlacement variations" expected="left/right/top/bottom placements render correctly"
const placements = ['left', 'right', 'top', 'bottom'];
const host = document.createElement('div');
host.style.display = 'grid';
host.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
host.style.gap = '8px';

for (const placement of placements) {
  const item = await slice.build('Switch', {
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

const onState = await slice.build('Switch', {
  label: 'Checked true',
  checked: true
});

const offState = await slice.build('Switch', {
  label: 'Checked false',
  checked: false
});

host.appendChild(onState);
host.appendChild(offState);
return host;
:::

:::script label="variant variations" expected="default, outlined, soft, danger and plain styles"
const host = document.createElement('div');
host.style.display = 'flex';
host.style.flexWrap = 'wrap';
host.style.gap = '10px';

for (const variant of ['default', 'outlined', 'soft', 'danger', 'plain']) {
  host.appendChild(await slice.build('Switch', {
    label: variant,
    checked: true,
    variant
  }));
}

return host;
:::

:::script label="size variations" expected="sm, md and lg render at increasing sizes"
const host = document.createElement('div');
host.style.display = 'flex';
host.style.alignItems = 'center';
host.style.gap = '10px';

for (const size of ['sm', 'md', 'lg']) {
  host.appendChild(await slice.build('Switch', {
    label: size,
    checked: true,
    size
  }));
}

return host;
:::

:::script label="Switch and Checkbox side by side" expected="same variant and size read as one family"
const host = document.createElement('div');
host.style.display = 'flex';
host.style.flexWrap = 'wrap';
host.style.alignItems = 'center';
host.style.gap = '10px';

host.appendChild(await slice.build('Switch', { label: 'Sync', checked: true, variant: 'outlined', size: 'sm' }));
host.appendChild(await slice.build('Checkbox', { label: 'Remember me', checked: true, variant: 'outlined', size: 'sm' }));

return host;
:::