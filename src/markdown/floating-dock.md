---
title: FloatingDock
route: /docs/navigation/floating-dock
navLabel: FloatingDock
section: Navigation
group: Core
order: 34
description: FloatingDock (macOS-style floating navigation capsule) documentation with practical scenarios.
component: FloatingDockDocumentation
generate: true
tags: [floatingdock, navigation, dock, mobile]
---

# FloatingDock

## Overview
`FloatingDock` is a glassy floating navigation capsule that hovers, centered, above the page.
Its signature interaction is macOS-dock-style magnification: items grow and lift toward the
pointer. It shares the same API as `Navbar` (`logo`, `items`, `buttons`, `position`,
`direction`), so it is a drop-in alternative to the classic top navbar.

## Core Behavior
- `items` accept the familiar `{ text, path }`, an optional `icon` (any valid `Icon` name),
  or `type: 'dropdown'` with `options`.
- On fine-pointer devices the items magnify based on their distance to the cursor (smoothstep
  falloff). Touch devices keep the items calm and tappable — no magnification.
- The active item is resolved from the current route (exact match, then longest prefix) and is
  marked with a glowing accent dot; it re-syncs on browser back/forward.
- `position: 'fixed'` floats the capsule centered at the top of the viewport; `position: 'static'`
  renders it inline. `direction: 'reverse'` mirrors the layout (row-reverse).
- On mobile the capsule collapses to the logo plus an animated hamburger; `items` and `buttons`
  drop into a panel beneath the capsule. Tapping outside or choosing an item closes it.

## Live Preview
:::component name="FloatingDock"
{
  "position": "static",
  "items": [
    {
      "text": "Home",
      "path": "/docs",
      "icon": "home"
    },
    {
      "text": "Components",
      "path": "/docs/navigation/navbar",
      "icon": "grid"
    },
    {
      "text": "Docs",
      "path": "/docs/navigation/tabs",
      "icon": "book"
    }
  ]
}
:::

## Prop Scenarios
:::script label="Dock with magnify" expected="capsule of items that magnify toward the cursor"
const dock = await slice.build('FloatingDock', {
  position: 'static',
  items: [
    { text: 'Home', path: '/docs', icon: 'home' },
    { text: 'Components', path: '/docs/navigation/navbar', icon: 'grid' },
    { text: 'Docs', path: '/docs/navigation/tabs', icon: 'book' },
    { text: 'API', path: '/docs/internal/markdown-parser-rules', icon: 'code' }
  ]
});

return dock;
:::

:::script label="Dock with dropdown + action" expected="text items, a dropdown group and a CTA button"
const dock = await slice.build('FloatingDock', {
  position: 'static',
  items: [
    { text: 'Overview', path: '/docs', icon: 'home' },
    {
      text: 'Guides',
      type: 'dropdown',
      options: [
        { text: 'Navbar', path: '/docs/navigation/navbar' },
        { text: 'Tabs', path: '/docs/navigation/tabs' },
        { text: 'DropDown', path: '/docs/navigation/dropdown' }
      ]
    }
  ],
  buttons: [
    { value: 'GitHub', icon: 'github' }
  ]
});

return dock;
:::

:::script label="Reverse direction" expected="dock layout is mirrored"
const dock = await slice.build('FloatingDock', {
  position: 'static',
  direction: 'reverse',
  items: [
    { text: 'First', path: '/docs', icon: 'home' },
    { text: 'Second', path: '/docs/navigation/tabs', icon: 'grid' },
    { text: 'Third', path: '/docs/navigation/navbar', icon: 'book' }
  ]
});

return dock;
:::

## Best Practices
:::tip
Because the dock floats over content on `position: 'fixed'`, add some `padding-top` to your page
so the first rows are never covered. Dropdowns open downward, which fits a top-anchored dock.
:::

## Pitfalls
:::warning
Magnification is intentionally disabled on touch devices and while the mobile panel is open.
Do not rely on it for conveying state — the active item also carries an accent dot.
:::
