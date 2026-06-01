---
title: BottomNav
route: /docs/navigation/bottom-nav
navLabel: BottomNav
section: Navigation
group: Core
order: 33
description: BottomNav (floating bottom tab bar) documentation with practical navigation scenarios.
component: BottomNavDocumentation
generate: true
tags: [bottomnav, navigation, tabs, mobile]
---

# BottomNav

## Overview
`BottomNav` is an app-style floating bottom tab bar. It shares the exact same API
as `Navbar` (`logo`, `items`, `buttons`, `position`, `direction`), so it works as a
drop-in alternative to the classic top navbar — especially on mobile, where it docks
to the bottom edge instead of hiding navigation behind a hamburger.

## Core Behavior
- `items` render as tabs. Each item accepts the familiar `{ text, path }`, an optional
  `icon` (any valid `Icon` name, shown above the label), or `type: 'dropdown'` with `options`.
- A spring-eased indicator slides under the active tab. The active tab is resolved from the
  current route (exact match first, then the longest matching prefix for nested routes such
  as `/docs/button` highlighting the `/docs` tab) and re-syncs on browser back/forward.
- `position: 'fixed'` floats the bar centered at the bottom on desktop and docks it full-width
  to the bottom edge on mobile. `position: 'static'` renders it inline in normal flow.
- `direction: 'reverse'` mirrors the tab order (row-reverse), matching `Navbar`.
- `buttons` reuse the shared `Button` component and sit after the tabs as trailing actions.

## Live Preview
:::component name="BottomNav"
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
:::script label="App-style tabs with icons" expected="icon-over-label tabs with a sliding active indicator"
const nav = await slice.build('BottomNav', {
  position: 'static',
  items: [
    { text: 'Home', path: '/docs', icon: 'home' },
    { text: 'Components', path: '/docs/navigation/navbar', icon: 'grid' },
    { text: 'Docs', path: '/docs/navigation/tabs', icon: 'book' }
  ]
});

return nav;
:::

:::script label="Tabs + trailing action" expected="tabs followed by a CTA button"
const nav = await slice.build('BottomNav', {
  position: 'static',
  items: [
    { text: 'Overview', path: '/docs', icon: 'home' },
    { text: 'Guides', path: '/docs/navigation/dropdown', icon: 'book' }
  ],
  buttons: [
    { value: 'GitHub', icon: 'github' }
  ]
});

return nav;
:::

:::script label="Reverse direction" expected="tab order is mirrored"
const nav = await slice.build('BottomNav', {
  position: 'static',
  direction: 'reverse',
  items: [
    { text: 'First', path: '/docs', icon: 'home' },
    { text: 'Second', path: '/docs/navigation/tabs', icon: 'grid' },
    { text: 'Third', path: '/docs/navigation/navbar', icon: 'book' }
  ]
});

return nav;
:::

## Best Practices
:::tip
On `position: 'fixed'`, add some `padding-bottom` to your page content so the floating bar
never covers the last rows. Pass a per-item `icon` for the clearest app-style tab pattern.
:::

## Pitfalls
:::warning
Avoid `type: 'dropdown'` items inside a bottom-docked `BottomNav`: the shared `DropDown` opens
downward and would render off-screen. Use dropdowns in top-anchored navigations (`Navbar`,
`FloatingDock`) instead.
:::
