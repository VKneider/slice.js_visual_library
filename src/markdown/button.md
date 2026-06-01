---
title: Button
route: /docs/input/button
navLabel: Button
section: Input Components
group: Basic
order: 10
description: Button documentation with executable prop scenarios.
component: ButtonDocumentation
generate: true
tags: [button, input]
---

# Button

## Overview
The `Button` component renders an action trigger and supports text, callback, icon and custom colors.

## Core Behavior
- `Button` dispatches action intent through `onClick` while keeping visual state driven by props.
- The look is set with `variant` (`filled` · `outlined` · `ghost` · `soft`), all derived from theme tokens; `customColor` overrides the colors when you need an exact value.
- Use script scenarios below as the living behavior contract; static props are documented in the generated props section.

## Live Preview
:::component name="Button"
{
  "value": "Save changes"
}
:::

## Variants
All variants are built from the theme tokens, so they follow the active theme automatically.

:::script label="Variants" expected="filled, outlined, ghost and soft buttons"
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';

for (const variant of ['filled', 'outlined', 'ghost', 'soft']) {
  const btn = await slice.build('Button', { value: variant, variant });
  row.appendChild(btn);
}

return row;
:::

## Prop Scenarios
:::script label="Primary and secondary variants" expected="renders two styled action buttons"
const primary = await slice.build('Button', { value: 'Primary Action' });
const secondary = await slice.build('Button', {
  value: 'Secondary Action',
  customColor: { background: '#5468ff', text: '#ffffff' }
});

const row = document.createElement('div');
row.appendChild(primary);
row.appendChild(secondary);
return row;
:::

:::script label="Button with callback state" expected="click toggles button label"
const clickButton = await slice.build('Button', {
  value: 'Click me',
  onClick: () => {
    clickButton.value = clickButton.value === 'Click me' ? 'Clicked' : 'Click me';
  }
});

const helper = document.createElement('p');
helper.textContent = 'Click the button to toggle its text.';

const wrapper = document.createElement('div');
wrapper.appendChild(helper);
wrapper.appendChild(clickButton);
return wrapper;
:::

:::script label="Icon + custom color use case" expected="renders call-to-action button with icon"
const cta = await slice.build('Button', {
  value: 'Download package',
  icon: { name: 'download', iconStyle: 'filled' },
  customColor: { background: '#16a34a', text: '#ffffff' }
});

const text = document.createElement('p');
text.textContent = 'Typical CTA usage with icon and branded color.';

const block = document.createElement('div');
block.appendChild(text);
block.appendChild(cta);
return block;
:::

:::script label="Toolbar action group" expected="renders a compact row of related actions"
const actions = [
  { value: 'Edit', icon: { name: 'edit', iconStyle: 'filled' } },
  { value: 'Share', icon: { name: 'share-nodes', iconStyle: 'filled' }, customColor: { background: '#2563eb', text: '#ffffff' } },
  { value: 'Delete', icon: { name: 'trash-bin', iconStyle: 'filled' }, customColor: { background: '#dc2626', text: '#ffffff' } }
];

const row = document.createElement('div');

for (const config of actions) {
  const button = await slice.build('Button', config);
  row.appendChild(button);
}

return row;
:::

:::script label="Button inside card footer" expected="button used as secondary action in card"
const card = await slice.build('Card', {
  title: 'Invoice #412',
  text: 'Pending approval from accounting.',
  variant: 'outlined'
});

const approve = await slice.build('Button', {
  value: 'Approve',
  customColor: { background: '#15803d', text: '#ffffff' }
});

const reject = await slice.build('Button', {
  value: 'Reject',
  customColor: { background: '#b91c1c', text: '#ffffff' }
});

const footer = document.createElement('div');
footer.appendChild(approve);
footer.appendChild(reject);

const host = document.createElement('div');
host.appendChild(card);
host.appendChild(footer);
return host;
:::

:::script label="Icon-only utility row" expected="small icon buttons for quick actions"
const iconConfigs = [
  { name: 'search', iconStyle: 'filled', color: '#0f172a' },
  { name: 'download', iconStyle: 'filled', color: '#0f172a' },
  { name: 'copy', iconStyle: 'filled', color: '#0f172a' }
];

const row = document.createElement('div');

for (const iconConfig of iconConfigs) {
  const button = await slice.build('Button', {
    value: '',
    icon: iconConfig,
    customColor: { background: '#e2e8f0', text: '#0f172a' }
  });
  row.appendChild(button);
}

return row;
:::

:::script label="async loading action" expected="button reflects loading-like action flow"
const submit = await slice.build('Button', {
  value: 'Submit',
  onClick: async () => {
    submit.value = 'Submitting...';
    await new Promise((resolve) => setTimeout(resolve, 400));
    submit.value = 'Submitted';
  }
});

return submit;
:::

## Best Practices
:::tip
Prefer explicit `onClickCallback` instead of manually attaching listeners outside the component.
:::

## Pitfalls
:::warning
Do not pass non-object values into `customColor` or `icon`. Static props validation reports type warnings.
:::
