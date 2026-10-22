---
title: BottomNav
route: /docs/navigation/bottom-nav
navLabel: BottomNav
section: Navigation
group: Core
order: 33
description: App-style bottom tab bar with variants, badges, a raised centre action, label modes, docking on phones and hide-on-scroll.
component: BottomNavDocumentation
generate: true
tags: [bottomnav, navigation, tabs, mobile, badge]
---

# BottomNav

## Overview
`BottomNav` is an app-style tab bar. On wide screens it floats as a capsule; on phones it docks to the bottom edge, leaving room for the home indicator. It shares `Navbar`'s API (`logo`, `items`, `buttons`, `position`, `direction`), so the two are interchangeable, and adds what a bottom bar needs: badges, a raised centre action, label modes and hiding while you scroll.

## Core Behavior
- `items` are the tabs:
  - `{ text, path }` is a route tab, navigated through `slice.router`.
  - `{ text, href }` is a plain link.
  - `{ text, items: [...] }` is a [DropDown](/docs/navigation/dropdown) tab, and its menu opens upwards. `type: 'dropdown'` with `options` is the older form and still works.
- Any tab can also take:
  - `icon`, any `Icon` name, shown above the label.
  - `badge`, a number (over 99 shows "99+"), some text, or `true` for a dot.
  - `exact`, `hidden`, and `onClick(item, event)`.
- Each tab is a real link. It works with the keyboard (**← →** move between tabs, **Home / End** jump to the ends), with middle-click and with screen readers. The current tab carries `aria-current="page"`.
- The current tab follows the URL: an exact match wins, otherwise the longest matching prefix. It keeps up with `slice.router` navigations and back / forward. `setActivePath(path)` sets it by hand, and `onChange(item)` tells you when a click changed it.
- `setBadge(pathOrIndex, value)` updates a badge without rebuilding the bar; `null` removes it.
- `brand` (`{ logo, text, path }`) or the older `logo` adds a brand on the start side. It is hidden when the bar is docked.
- `buttons` add actions on the end side, drawn as the bar's own round pills (not `Button`): `{ value, icon, onClick, path }`. The emphasised one is filled; `variant: 'ghost'` gives a quiet one, and an icon without text makes a round icon button (name it with `ariaLabel`). `actions` takes the same configs or any node of your own. The tabs stay optically centred between the brand and the actions.
- Every prop is reactive.

## Looks and layout
- `variant`:
  - `'filled'` (default): the primary-colour capsule, with labels that pass AA contrast. Same name as in `Button`; `'solid'` also works.
  - `'surface'`: the page colour with a fine border.
  - `'glass'`: translucent and blurred.
- `layout`:
  - `'auto'` (default): floats on wide screens and docks at `breakpoint` (600px) and below.
  - `'floating'` or `'docked'` force one look everywhere.
- `labels`:
  - `'always'` (default).
  - `'active'`: only the current tab shows its name.
  - `'none'`: icons only, but each label still names its link for screen readers.
- `indicator` marks the current tab: `'pill'` (default, a pill that slides), `'line'` (an accent bar; on top of the tab when docked) or `'none'`.
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `fab` adds a round centre action in the middle of the tabs: `{ icon, label, onClick, path }`. When the bar is docked it rises out of the bar.

## Position and scrolling
- `position`: `'fixed'` (default, pinned to the bottom), `'sticky'` or `'static'`. As before, any other value means `'static'`.
- `spacer: true` makes a fixed bar keep its height at the bottom of the page, so it covers nothing. It is off by default, because pages built for it already add a `padding-bottom`.
- `hideOnScroll` slides the bar away while you scroll down and brings it back as soon as you scroll up.
- `direction: 'reverse'` mirrors the bar and the order of the tabs.

## Live Preview
:::component name="BottomNav"
{
  "position": "static",
  "items": [
    { "text": "Home", "path": "/", "icon": "home" },
    { "text": "Docs", "path": "/docs", "icon": "book" },
    { "text": "Inbox", "path": "/inbox", "icon": "inbox", "badge": 4 },
    { "text": "Profile", "path": "/profile", "icon": "user" }
  ]
}
:::

## Prop Scenarios
:::script label="Variants and indicators" expected="a filled capsule with a pill, a surface one with a line, and a glass one showing only the current label"
const items = [
  { text: 'Home', path: '/docs', icon: 'home' },
  { text: 'Search', path: '/search', icon: 'search' },
  { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 3 },
  { text: 'Profile', path: '/profile', icon: 'user', badge: true }
];
const stage = document.createElement('div');
stage.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%;padding:16px 0';
for (const extra of [{ variant: 'filled' }, { variant: 'surface', indicator: 'line' }, { variant: 'glass', labels: 'active' }]) {
  const nav = await slice.build('BottomNav', { items, position: 'static', layout: 'floating', ...extra });
  nav.setActivePath('/search');
  stage.appendChild(nav);
}
return stage;
:::

:::script label="Raised centre action" expected="a round + in the middle of the tabs"
const result = document.createElement('p');
result.style.textAlign = 'center';
const nav = await slice.build('BottomNav', {
  position: 'static',
  layout: 'floating',
  labels: 'none',
  items: [
    { text: 'Home', path: '/docs', icon: 'home' },
    { text: 'Search', path: '/search', icon: 'search' },
    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 12 },
    { text: 'Profile', path: '/profile', icon: 'user' }
  ],
  fab: { icon: 'plus', label: 'New post', onClick: () => { result.textContent = 'Compose a new post'; } }
});
const box = document.createElement('div');
box.style.width = '100%';
box.append(nav, result);
return box;
:::

:::script label="Docked, as on a phone" expected="a full-width bar on its bottom edge, with the centre action rising out of it"
const frame = document.createElement('div');
frame.style.cssText = 'width:100%;max-width:390px;margin:0 auto;border:1px solid var(--slice-border-raised, #ddd);border-radius:24px;overflow:hidden;padding-top:120px;background:var(--secondary-background-color)';
const nav = await slice.build('BottomNav', {
  position: 'static',
  layout: 'docked',
  variant: 'surface',
  indicator: 'line',
  items: [
    { text: 'Home', path: '/docs', icon: 'home' },
    { text: 'Search', path: '/search', icon: 'search' },
    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 2 },
    { text: 'Me', path: '/me', icon: 'user' }
  ],
  fab: { icon: 'plus', label: 'New' }
});
nav.setActivePath('/docs');
frame.appendChild(nav);
return frame;
:::

:::script label="Live badges" expected="the Inbox badge counts up every second; Clear removes it"
const nav = await slice.build('BottomNav', {
  position: 'static',
  layout: 'floating',
  variant: 'surface',
  items: [
    { text: 'Home', path: '/docs', icon: 'home' },
    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 1 }
  ]
});
let count = 1;
const timer = setInterval(() => {
  if (!nav.isConnected) return clearInterval(timer);
  count += 1;
  nav.setBadge('/inbox', count);
}, 1000);
const clear = await slice.build('Button', {
  value: 'Clear',
  variant: 'outlined',
  size: 'sm',
  onClick: () => { count = 0; nav.setBadge('/inbox', null); }
});
const box = document.createElement('div');
box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;width:100%';
box.append(nav, clear);
return box;
:::

:::script label="Brand, tabs and actions" expected="a brand, centred tabs and a Sign in button"
const nav = await slice.build('BottomNav', {
  position: 'static',
  layout: 'floating',
  brand: { text: 'Acme', path: '/docs' },
  items: [
    { text: 'Home', path: '/docs', icon: 'home' },
    { text: 'Guides', path: '/guides', icon: 'book' },
    { text: 'More', items: [{ label: 'Changelog' }, { label: 'Roadmap' }] }
  ],
  buttons: [{ value: 'Sign in' }]
});
return nav;
:::

## Best Practices
:::tip
Keep three to five tabs. A bottom bar is reached with a thumb; more tabs than that make each target too small, so move the rest to a "More" dropdown tab.
:::

:::tip
Use `badge: true` (a dot) for "something new" and numbers only when the count matters. A bar full of numbers stops meaning anything.
:::

## Pitfalls
:::warning
A fixed bar covers the bottom of the page. Either add a `padding-bottom` to your content or pass `spacer: true`, but not both.
:::

:::warning
With `labels: 'none'` give every tab an `icon`. A tab without one keeps showing its label (it would have nothing else to show), so the bar looks uneven.
:::