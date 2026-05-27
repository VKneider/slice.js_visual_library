---
title: Navbar
route: /docs/navigation/navbar
navLabel: Navbar
section: Navigation
group: Core
order: 30
description: Navbar component documentation with practical setup examples.
component: NavbarDocumentation
generate: true
tags: [navbar, navigation]
---

# Navbar

## Overview
`Navbar` provides top-level navigation with optional logo, menu items and action buttons.

## Core Behavior
- `Navbar` organizes top-level navigation with optional branding, route links, dropdown groups and action buttons.
- Layout behavior is controlled by positioning and direction settings to support product sites and internal dashboards.
- Scenarios below focus on real navigation compositions rather than static prop duplication.

## Basic Usage
```javascript title="Build navbar"
const nav = await slice.build('Navbar', {
  position: 'fixed',
  items: [
    { text: 'Home', path: '/' },
    { text: 'Docs', path: '/docs' }
  ]
});

this.appendChild(nav);
```

## Practical Setups
:::script label="Product docs navbar" expected="fixed navbar with product sections"
const nav = await slice.build('Navbar', {
  position: 'fixed',
  logo: { src: '/images/Slice.js-logo.png', path: '/' },
  items: [
    { text: 'Docs', path: '/docs' },
    { text: 'Components', path: '/docs/input/button' },
    { text: 'Architecture', path: '/docs/internal/markdown-parser-rules' }
  ]
});

const host = document.createElement('div');
host.appendChild(nav);
return host;
:::

:::script label="Navbar with dropdown + actions" expected="mix of text links, dropdown and CTA buttons"
const nav = await slice.build('Navbar', {
  items: [
    { text: 'Overview', path: '/docs' },
    {
      text: 'Guides',
      type: 'dropdown',
      options: [
        { text: 'Input', path: '/docs/input/input' },
        { text: 'Select', path: '/docs/input/select' },
        { text: 'Card', path: '/docs/layout/card' }
      ]
    }
  ],
  buttons: [
    { value: 'Try CLI', color: { button: '#2563eb', label: '#ffffff' } },
    { value: 'GitHub' }
  ]
});

return nav;
:::

:::script label="Dashboard navbar" expected="compact top navigation for admin contexts"
const nav = await slice.build('Navbar', {
  direction: 'normal',
  items: [
    { text: 'Dashboard', path: '/docs' },
    { text: 'Users', path: '/docs/input/select' },
    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }
  ],
  buttons: [
    {
      value: 'Theme',
      onClickCallback: () => {
        const current = slice.stylesManager.themeManager.currentTheme;
        if (current === 'Slice') {
          slice.setTheme('Light');
        } else {
          slice.setTheme('Slice');
        }
      }
    }
  ]
});

return nav;
:::
