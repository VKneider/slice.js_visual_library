---
title: Navbar
route: /docs/navigation/navbar
navLabel: Navbar
section: Navigation
group: Core
order: 30
description: Top navigation bar with five variants, nested dropdowns, the current page marked, sticky or fixed positioning and a real mobile menu.
component: NavbarDocumentation
generate: true
tags: [navbar, navigation, header, menu, mobile]
---

# Navbar

## Overview
`Navbar` is the top navigation bar. It has a brand, links (dropdowns with submenus included) and actions, comes in five looks, marks the page you are on, and below a breakpoint turns into a mobile menu that behaves like one: a drawer, a full screen or a sheet.

## Core Behavior
- `brand` is `{ logo, text, path, alt }`: an image, a name, or both. `logo` (`{ src, path }`) is the older form and still works.
- `items` are the links:
  - `{ text, path }` is a route link, navigated through `slice.router`.
  - `{ text, href, target }` is a plain or external link.
  - `{ text, items: [...] }` is a `DropDown` with submenus as deep as you like. The bar shows it as plain text that opens on hover; click and keyboard work too. See [DropDown](/docs/navigation/dropdown) for what its items can be. `type: 'dropdown'` with `options` is the older form and still works.
  - Any item can also take `icon`, `exact` (see below) or `hidden`.
- `buttons` are Button configs (`{ value, onClick, icon, variant, color }`). `actions` takes the same configs or any node: a ThemeSwitcher, a search box, an avatar `DropDown`. They render in the order you give them.
- Every prop is reactive: set `items`, `buttons`, `variant` or anything else at any time and the bar updates.

## Looks
- `variant`:
  - `'filled'` (default): the primary colour, the original look. Same name as in `Button`; `'solid'` also works.
  - `'surface'`: the page colour with a fine bottom border.
  - `'glass'`: translucent, blurring what scrolls under it.
  - `'transparent'`: no fill, for use over a hero; it turns into `surface` once the page scrolls.
  - `'floating'`: a detached pill with a shadow.
- `size`: `'sm'` (52px), `'md'` (64px, default) or `'lg'` (76px). To use another height, set the `--nav-height` CSS property on the element.
- `align`: where the links sit, `'start'`, `'center'` (default) or `'end'`.
- `indicator` marks the current page:
  - `'underline'` (default): a bar that slides under the link.
  - `'pill'`: a soft background that slides behind the link.
  - `'none'`: colour only.

## The current page
The link whose `path` matches the URL gets `aria-current="page"` and the indicator.
- An exact match wins. Otherwise the longest matching prefix wins, so `/docs/table` keeps "Docs" marked.
- `'/'` only matches itself, and an item with `exact: true` only matches its own path.
- A dropdown counts as current when any page inside it does, at any depth.
- The bar follows `slice.router` navigations and the browser's back and forward buttons. `setActivePath(path)` sets it by hand; `setActivePath(null)` goes back to following the URL.

## Position and scrolling
- `position`:
  - `'static'` (default): part of the page.
  - `'sticky'`: sticks to the top while its parent scrolls.
  - `'fixed'`: pinned to the viewport. With `spacer: true` the bar also keeps its height in the page, so it covers nothing. That is off by default, because pages built for the old fixed bar already leave room for it.
- `hideOnScroll`: the bar slides away while you scroll down and comes back as soon as you scroll up.
- Once the page scrolls, every variant gets the `nav_bar--scrolled` class: `surface` and `glass` gain a soft shadow, and `transparent` gains a fill.
- `direction: 'reverse'` mirrors the bar.

## Mobile
At `breakpoint` (768px by default) and below, the links and actions move behind a hamburger button that turns into an ✕.
- `mobileMenu`:
  - `'drawer'` (default): a panel from the side.
  - `'fullscreen'`: the whole screen.
  - `'sheet'`: a panel hanging under the bar, which stays visible.
- While the menu is open:
  - Focus stays inside it.
  - **Escape**, the ✕, a tap on the dimmed area or following a link closes it, and focus returns to the hamburger.
  - The page behind it does not scroll.
- The menu closes on its own when the window grows past the breakpoint.
- Dropdowns inside it stack their submenus with a "‹ Back" row.
- `openMenu()`, `closeMenu()`, `toggleMenu()` and `isMenuOpen` drive it from code. `onMenuToggle(open)` tells you when it opens or closes.

## Live Preview
:::component name="Navbar"
{
  "variant": "surface",
  "brand": { "text": "Acme", "path": "/" },
  "items": [
    { "text": "Home", "path": "/" },
    { "text": "Docs", "path": "/docs" },
    { "text": "Components", "path": "/docs/input/button" }
  ],
  "buttons": [{ "value": "Sign in" }]
}
:::

## Practical Setups
:::script label="The five variants" expected="filled, surface, glass, transparent and floating bars, each marking Docs as the current page"
const stage = document.createElement('div');
stage.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;padding:16px 0;background:linear-gradient(135deg,color-mix(in srgb,var(--primary-color) 14%,transparent),transparent)';
const items = [
  { text: 'Home', path: '/' },
  { text: 'Docs', path: '/docs' },
  { text: 'Products', items: [{ label: 'Table', path: '/docs/data/table' }, { label: 'DropDown', path: '/docs/navigation/dropdown' }] },
  { text: 'Blog', href: '#' }
];
const looks = [['filled', 'underline'], ['surface', 'underline'], ['glass', 'pill'], ['transparent', 'pill'], ['floating', 'pill']];
for (const [variant, indicator] of looks) {
  const nav = await slice.build('Navbar', {
    variant,
    indicator,
    brand: { text: variant },
    items,
    buttons: [{ value: 'Sign in' }]
  });
  nav.style.width = '100%';
  nav.setActivePath('/docs');
  stage.appendChild(nav);
}
return stage;
:::

:::script label="Product site: nested menus and actions" expected="Products opens on hover with submenus; Sign up on the right"
const nav = await slice.build('Navbar', {
  variant: 'surface',
  align: 'start',
  brand: { logo: '/images/Slice.js-logo.png', text: 'Slice.js', path: '/' },
  items: [
    {
      text: 'Products',
      items: [
        { label: 'Analytics', icon: 'chart', description: 'Dashboards and reports' },
        {
          label: 'Automation', icon: 'rocket', items: [
            { label: 'Workflows' },
            { label: 'Integrations', items: [{ label: 'Slack' }, { label: 'GitHub' }] }
          ]
        }
      ]
    },
    { text: 'Docs', path: '/docs' },
    { text: 'Pricing', path: '/pricing' }
  ],
  buttons: [{ value: 'Log in', variant: 'ghost' }, { value: 'Sign up' }]
});
nav.style.width = '100%';
return nav;
:::

:::script label="Your own actions: a theme toggle and an avatar menu" expected="a theme switch and an icon-only DropDown on the right"
const avatar = await slice.build('DropDown', {
  icon: 'user-circle',
  ariaLabel: 'Account',
  variant: 'ghost',
  items: [
    { type: 'label', label: 'Signed in as Ana' },
    { label: 'Profile', icon: 'user' },
    { label: 'Settings', icon: 'cog' },
    'separator',
    { label: 'Sign out', danger: true }
  ]
});
const theme = await slice.build('Button', {
  value: 'Theme',
  variant: 'soft',
  size: 'sm',
  onClick: () => slice.setTheme(slice.stylesManager.themeManager.currentTheme === 'LIGHT' ? 'DARK' : 'LIGHT')
});
const nav = await slice.build('Navbar', {
  variant: 'glass',
  align: 'end',
  indicator: 'pill',
  brand: { text: 'Dashboard' },
  items: [
    { text: 'Overview', path: '/docs' },
    { text: 'Users', path: '/docs/input/select' },
    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }
  ],
  actions: [theme, avatar]
});
nav.style.width = '100%';
return nav;
:::

:::script label="Mobile menu modes" expected="three narrow bars; tap a hamburger to open a drawer, a full screen or a sheet"
const row = document.createElement('div');
row.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px;width:100%';
for (const mobileMenu of ['drawer', 'fullscreen', 'sheet']) {
  const frame = document.createElement('div');
  frame.style.cssText = 'flex:1 1 220px;min-width:0';
  const nav = await slice.build('Navbar', {
    variant: 'surface',
    mobileMenu,
    // A huge breakpoint keeps this demo in mobile mode on any screen.
    breakpoint: 100000,
    brand: { text: mobileMenu },
    items: [
      { text: 'Home', path: '/' },
      { text: 'Docs', path: '/docs' },
      { text: 'More', items: [{ label: 'Blog' }, { label: 'Changelog' }] }
    ],
    buttons: [{ value: 'Sign in' }]
  });
  nav.style.width = '100%';
  frame.appendChild(nav);
  row.appendChild(frame);
}
return row;
:::

:::script label="Sticky bar that hides on scroll" expected="the bar sticks to the top of the page and hides while you scroll down"
const nav = await slice.build('Navbar', {
  variant: 'glass',
  position: 'sticky',
  hideOnScroll: true,
  brand: { text: 'Scroll me' },
  items: [{ text: 'Home', path: '/' }, { text: 'Docs', path: '/docs' }]
});
nav.style.width = '100%';
return nav;
:::

## Best Practices
:::tip
Keep the bar to five or six top-level links and move the rest into dropdowns. The bar is the first thing people read, so short and scannable wins.
:::

:::tip
Use `exact: true` on a link whose path is a prefix of other links' paths (an "Overview" at `/docs` next to "API" at `/docs/api`), so only one of them is marked as current.
:::

## Pitfalls
:::warning
`position: 'fixed'` takes the bar out of the page. Either leave room for it yourself (a `padding-top` on your content) or pass `spacer: true`, but not both.
:::

:::warning
`hideOnScroll` and the scrolled state listen to the window's scroll. A bar inside a scrolling panel (not the page) will not see that panel scroll.
:::