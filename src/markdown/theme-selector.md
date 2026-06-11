---
title: ThemeSelector
route: /docs/input/theme-selector
navLabel: ThemeSelector
section: Input Components
group: Basic
order: 15
description: A binary LIGHT/DARK toggle with sun and moon icons that switches the app theme and keeps every theme control in sync.
component: ThemeSelectorDocumentation
generate: true
tags: [theme, selector, toggle, dark-mode, settings, light]
---

# ThemeSelector

## Overview
`ThemeSelector` is a compact icon-only toggle that switches between **LIGHT** and **DARK**
themes. It renders a pill-shaped button with a sun icon for LIGHT and a moon icon for DARK;
the active option is highlighted with the `--primary-color` background.

It is the visual counterpart to [`ThemeSwitcher`](/docs/input/theme-switcher): use
`ThemeSelector` when you want an icon-based binary control in a topbar or navbar, and
`ThemeSwitcher` when you need a text-based control that cycles through an arbitrary list
of themes.

## Core Behavior
- Reads the current theme from `slice.stylesManager.themeManager.currentTheme` on init and
  marks the matching option as `.active`.
- Clicking the button calls `slice.setTheme(next)`, toggling between `'LIGHT'` and `'DARK'`.
- After setting the theme it dispatches a global `themeChanged` `CustomEvent` with
  `{ detail: { themeName } }` so every other theme control on the page stays in sync.
- It also **listens** for `themeChanged`, so changing the theme from another control (e.g.
  `ThemeSwitcher`) updates the active option automatically.
- A `.loading` class is applied during the async `slice.setTheme` call; the button becomes
  non-interactive and visually dimmed until the theme finishes applying.

## Live Preview
:::component name="ThemeSelector"
{}
:::

## Example
```javascript title="Build a theme selector and append it to a toolbar"
const selector = await slice.build('ThemeSelector');
toolbar.appendChild(selector);
```

## Props
`ThemeSelector` has no configurable props — it is a self-contained, single-purpose toggle
that reads the current theme directly from the framework's `themeManager`.

## Best Practices
:::tip
Place `ThemeSelector` in a persistent shell element (navbar, topbar, sidebar) so the user
can switch themes from any page. The component auto-syncs with other theme controls via the
`themeChanged` event, so you can safely use multiple selectors and switchers on the same
page.
:::

## Pitfalls
:::warning
`ThemeSelector` is hardcoded to the `'LIGHT'` / `'DARK'` pair. If your app uses additional
themes (e.g. `'SOLARIZED'`), use [`ThemeSwitcher`](/docs/input/theme-switcher) instead,
which accepts a custom `themes` array.
:::
