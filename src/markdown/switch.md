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
- `label` and `labelPlacement` improve context readability.
- `toggle` callback can run side-effects when users interact.

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

:::script label="switch with callback" expected="toggle callback executes on interaction"
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
  customColor: '#16a34a'
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
