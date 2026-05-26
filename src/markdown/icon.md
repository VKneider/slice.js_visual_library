---
title: Icon
route: /docs/display/icon
navLabel: Icon
section: Display
group: Basic
order: 20
description: Icon documentation with name, size, color and style prop scenarios.
component: IconDocumentation
generate: true
tags: [icon, display]
---

# Icon

## Overview
`Icon` renders a Material-style icon from a predefined symbol set. Supports filled and outlined styles, configurable size, and custom color.

## API and Behavior
- `name` selects the icon symbol (default: `youtube`).
- `iconStyle` accepts `filled` or `outlined`.
- `size` accepts `small` (16px), `medium` (20px), `large` (24px), or a custom pixel value.
- `color` sets the icon color via CSS color value.
- An `update()` method reapplies all props, useful after route navigation.

## Basic Usage
```javascript title="Build icon"
const icon = await slice.build('Icon', {
  name: 'home',
  size: 'large',
  color: '#2563eb'
});

this.appendChild(icon);
```

## Prop Scenarios
:::script label="Filled vs outlined" expected="renders two icons with different styles"
const filled = await slice.build('Icon', {
  name: 'star',
  iconStyle: 'filled',
  size: 'large',
  color: '#f59e0b'
});

const outlined = await slice.build('Icon', {
  name: 'star',
  iconStyle: 'outlined',
  size: 'large',
  color: '#6b7280'
});

const host = document.createElement('div');
host.style.display = 'flex';
host.style.gap = '1rem';
host.style.alignItems = 'center';
host.appendChild(filled);
host.appendChild(outlined);
return host;
:::

:::script label="Size variants" expected="renders icons at small, medium and large sizes"
const small = await slice.build('Icon', {
  name: 'settings',
  size: 'small',
  color: '#2563eb'
});

const medium = await slice.build('Icon', {
  name: 'settings',
  size: 'medium',
  color: '#2563eb'
});

const large = await slice.build('Icon', {
  name: 'settings',
  size: 'large',
  color: '#2563eb'
});

const host = document.createElement('div');
host.style.display = 'flex';
host.style.gap = '1rem';
host.style.alignItems = 'center';
host.appendChild(small);
host.appendChild(medium);
host.appendChild(large);
return host;
:::

:::script label="Custom color" expected="renders icon with custom hex color"
const icon = await slice.build('Icon', {
  name: 'favorite',
  size: 'large',
  color: '#ef4444'
});

return icon;
:::

## Best Practices
:::tip
Use consistent `size` and `color` values within a feature to maintain visual alignment.
:::

## Pitfalls
:::warning
Not every Material icon name is available. Verify the icon name against the included symbol set before use.
:::
