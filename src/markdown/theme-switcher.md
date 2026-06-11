---
title: ThemeSwitcher
route: /docs/input/theme-switcher
navLabel: ThemeSwitcher
section: Input Components
group: Basic
order: 16
description: A one-click control that cycles through your registered themes and keeps every theme control in sync.
component: ThemeSwitcherDocumentation
generate: true
tags: [theme, switcher, toggle, dark-mode, settings]
---

# ThemeSwitcher

## Overview
`ThemeSwitcher` is a single button that **cycles** through the themes you give it,
showing the active theme's name as its value. It is the lightweight counterpart to
[`ThemeSelector`](/docs/input/theme-selector): use `ThemeSelector` for a binary
LIGHT/DARK toggle with icons, and `ThemeSwitcher` when you want a compact text control
that walks an arbitrary list of themes (e.g. `LIGHT → DARK → SOLARIZED → …`).

It works in two visual variants — a compact `button` pill for topbars/toolbars, and a
full-width `menu-item` row for dropdowns and user menus.

## Core Behavior
- `themes` is the ordered list to cycle through. Each click advances to the next entry
  and wraps around at the end. Defaults to `['LIGHT', 'DARK']`.
- On switch it calls `slice.setTheme(next)`, dispatches a global `themeChanged`
  `CustomEvent` (so every other theme control on the page stays in sync), and invokes
  the optional `onChange(themeName)` handler.
- It also **listens** for `themeChanged`, so changing the theme anywhere else updates
  the displayed value automatically.
- `variant` switches the layout: `'button'` (default) hides the caption and renders a
  pill; `'menu-item'` shows the `label` caption on the left and the value on the right.
- The document listener is registered in `init()` and removed in `beforeDestroy()`.

## Live Preview
:::component name="ThemeSwitcher"
{
  "label": "Theme",
  "variant": "button"
}
:::

## Example
```javascript title="Cycle through three themes in a topbar"
const switcher = await slice.build('ThemeSwitcher', {
  themes: ['LIGHT', 'DARK', 'SOLARIZED'],
  variant: 'button',
  onChange: (name) => slice.logger.logInfo('App', `Theme changed to ${name}`)
});
this.appendChild(switcher);
```

## Prop Scenarios
:::script label="default button variant" expected="compact pill showing the active theme name"
const switcher = await slice.build('ThemeSwitcher', {
  label: 'Theme'
});
return switcher;
:::

:::script label="menu-item variant" expected="full-width row with caption on the left and value on the right"
const switcher = await slice.build('ThemeSwitcher', {
  label: 'Appearance',
  variant: 'menu-item'
});

const host = document.createElement('div');
host.style.maxWidth = '240px';
host.appendChild(switcher);
return host;
:::

:::script label="custom theme list" expected="cycles through the provided themes in order"
const switcher = await slice.build('ThemeSwitcher', {
  label: 'Theme',
  themes: ['LIGHT', 'DARK']
});
return switcher;
:::

:::script label="onChange callback" expected="status text updates each time the theme is switched"
const status = document.createElement('p');
status.textContent = 'Click the switcher to change the theme';

const switcher = await slice.build('ThemeSwitcher', {
  label: 'Theme',
  onChange: (name) => {
    status.textContent = `Active theme: ${name}`;
  }
});

const host = document.createElement('div');
host.style.display = 'flex';
host.style.flexDirection = 'column';
host.style.gap = '10px';
host.appendChild(switcher);
host.appendChild(status);
return host;
:::

## Best Practices
:::tip
Use the same theme names you registered in `sliceConfig.json` (`themeManager`). The value
shown by the switcher is exactly the name passed to `slice.setTheme`, so keep them
consistent across `ThemeSwitcher`, `ThemeSelector`, and any custom theme UI.
:::

## Pitfalls
:::warning
`themes` must list theme names that actually exist under your themes folder. Cycling to
an unregistered name makes `slice.setTheme` fail; the error is logged via
`slice.logger.logError` and the displayed value falls back to the current theme.
:::
