---
title: SideMenu
route: /docs/navigation/side-menu
navLabel: SideMenu
section: Navigation
group: Navigation
order: 49
description: A navigation menu whose items open more items, as deep as needed. Submenus slide in with a back button (drill) or open in place, indented (tree). Links, actions, lazy submenus, groups, badges and the current page.
component: SideMenuDocumentation
generate: true
tags: [sidemenu, menu, sidebar, navigation, drilldown, submenu, nested]
---

# SideMenu

## Overview
`SideMenu` is the menu of an app's sidebar or drawer. Its items go to a page, run an action, or open a submenu, and a submenu's items can open more submenus, as deep as the app needs.

It shows the levels in one of two ways, with the same items:
- **`mode: 'drill'`** (default): a submenu **replaces** the panel and slides in, with a back button named after the level. Every level gets the whole width, so deep menus fit on a phone. This is the menu of a store app or of iOS Settings.
- **`mode: 'tree'`**: a submenu opens **under** its item, indented, and several can be open at once. People see where they are in the whole menu, which suits a desktop sidebar.
- **`mode: 'auto'`**: a tree when the menu is at least `breakpoint` pixels wide (480 by default), and a drill menu when it is narrower. The menu's own width is used, not the window's, so the same menu works in a wide sidebar and in a phone drawer.

The mode can change at any time, and the menu stays where it was: an open drill level becomes open branches, and the other way round.

### When to use it
- **An app's main navigation** with sections inside sections: an admin panel, a store's categories, a settings area.
- **A mobile menu or drawer** where a deep menu has to fit a narrow screen (drill).
- **A menu that mixes pages and actions**: "Profile" goes to a page, "Log out" runs an action.

### When not to use it
- **A few destinations at the top of a page**: use [Navbar](/docs/navigation/navbar), or [Tabs](/docs/navigation/tabs) for views of one page.
- **A menu of actions opened from a button** ("⋯", "Export"): use [DropDown](/docs/navigation/dropdown). It floats over the page and closes after a choice.
- **Data shaped as a tree**: files, categories to check, an org chart. Use [TreeView](/docs/navigation/treeview), which adds search, checkboxes, drag and drop and virtual scrolling.
- **The path to the current page** at the top of the content: use [Breadcrumbs](/docs/navigation/breadcrumbs).

## Items
Each entry in `items` is an object. What it does depends on what it has:

- `path`: goes to that route with `slice.router`. It is a real link, so Ctrl/⌘-click or a middle click opens it in a new tab.
- `href` (and `target`): a link outside the app.
- `onClick({ item, menu, event })`: an action, such as "Log out" or "Switch theme".
- `items` (or `children`): opens a submenu. It can be an array, or a function that returns one, even an async function. A function runs the first time the submenu opens, with a loading row in the meantime and a "Try again" button if it fails. `reload(id)` runs it again.
- `type: 'group'` with `label` and `items`: a small heading over items **at the same level**, not a submenu.
- `type: 'separator'`: a line.

And, on any item:
- `label`, `icon` (an [Icon](/docs/content/icon) name, or `{ name, color }`), `description` (a quieter second line) and `badge` (a number, a word, or [Badge](/docs/content/badge) props).
- `id`: how `open(id)`, `close(id)` and `reload(id)` find it. Without one, the `path` is used.
- `disabled`, `hidden`, and `danger` (red, for something that cannot be undone).

An item with both `items` and a `path` opens its submenu, and the page is still reachable:
- in drill mode, the submenu starts with an "All Settings" link;
- in tree mode, the label is the link and the chevron beside it opens the submenu.

## Core Behavior

### Moving
- A click on a link calls `onSelect(item, { event, menu })`, marks the item as the current page, and navigates. `onSelect` can return `false` to stop the navigation, for example to close a drawer first or to show the page some other way.
- The `side-menu-select` event reports every choice too.
- `onOpenChange(item, open)` reports every submenu that opens or closes.
- `open(id)`, `close(id)`, `back()` and `reset()` do the same from code. `level` and `openItems` say where the menu is.

### The current page
- `activePath` marks the item with that `path` (`aria-current="page"`). The menu opens where it is: on its level in drill mode, and with every branch above it open in tree mode.
- The submenus that hold the current page are marked as well, so a closed section still shows that the page is inside it.
- With `followRoute` (on by default), `activePath` follows the URL as the router moves, including back and forward.

### Keyboard
- ↑ and ↓ move between items; Home and End go to the first and the last.
- → opens a submenu. In tree mode, a second → goes into it.
- ← goes back a level (drill), or closes the submenu and then goes up to the item that holds it (tree).
- Enter and Space do what a click does.

### Focus and screen readers
- When a level slides in, the focus goes to its first item. When it slides out, the focus goes back to the item that opened it, so people never lose their place.
- Each new level is announced, for example "Products, 4 items".
- Tree branches use `aria-expanded`. The menu is a `<nav>` with a name (`label`, or `title`).

## Looks
- `title`: the name of the first level, shown above it in drill mode. Deeper levels show the back button instead.
- `variant`: how the current page is marked:
  - `'soft'` (default): a tint and the accent colour;
  - `'filled'`: the accent colour as the background;
  - `'ghost'`: a bar at the start and the accent colour, for busy sidebars.
- `size`: `'sm'`, `'md'` (default) or `'lg'`. Use `'lg'` for touch-first drawers.
- `multiple: false` (tree) keeps one submenu open per level.
- The CSS variables `--slice-side-menu-accent`, `--slice-side-menu-row-height`, `--slice-side-menu-indent` and `--slice-side-menu-radius` adjust it further.

## Language
`texts` replaces every word:
- `label`;
- `back` (`{label}`) and `overview` (`{label}`);
- `level` (`{label}`, `{count}`);
- `loading`, `error`, `retry`, `empty`;
- `expand` (`{label}`).

## Live Preview
:::component name="SideMenu"
{
  "title": "Workspace",
  "followRoute": false,
  "items": [
    { "label": "Inbox", "path": "/preview/inbox", "icon": "inbox", "badge": 4 },
    { "label": "Projects", "icon": "folder", "items": [
      { "label": "Website", "path": "/preview/website" },
      { "label": "Mobile app", "path": "/preview/app" }
    ] },
    { "label": "Settings", "icon": "cog", "path": "/preview/settings", "items": [
      { "label": "Profile", "path": "/preview/profile" },
      { "label": "Billing", "path": "/preview/billing" }
    ] }
  ]
}
:::

## Examples
:::script label="Admin panel" expected="an app with a tree SideMenu on the left (Dashboard, Orders with a badge, Catalog with nested Products and Categories, Customers, Settings) and a content area; choosing an item shows its page title in the content and marks it as current; Log out at the bottom is red and asks first"
const page = document.createElement('main');
page.style.cssText = 'flex:1;min-width:0;padding:20px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 5%,transparent)';

const show = (item) => {
  page.innerHTML = `<div style="font-size:.8rem;opacity:.65">Admin</div>
    <h3 style="margin:4px 0 8px">${item.label}</h3>
    <p style="margin:0;opacity:.8">${item.description || 'The ' + item.label.toLowerCase() + ' page would render here.'}</p>`;
};

const menu = await slice.build('SideMenu', {
  mode: 'tree',
  title: 'Northwind admin',
  followRoute: false,
  activePath: '/admin/dashboard',
  items: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'chart-pie' },
    { label: 'Orders', path: '/admin/orders', icon: 'receipt', badge: { value: 7, tone: 'accent' } },
    {
      label: 'Catalog', icon: 'store', id: 'catalog',
      items: [
        { label: 'Products', path: '/admin/products', description: '1,204 items' },
        { label: 'Categories', id: 'categories', items: [
          { label: 'Electronics', path: '/admin/categories/electronics' },
          { label: 'Home', path: '/admin/categories/home' },
          { label: 'Toys', path: '/admin/categories/toys' }
        ] },
        { label: 'Discounts', path: '/admin/discounts', icon: 'sale-percent' }
      ]
    },
    { label: 'Customers', path: '/admin/customers', icon: 'users' },
    { label: 'Settings', path: '/admin/settings', icon: 'cog', items: [
      { label: 'Store details', path: '/admin/settings/store' },
      { label: 'Payments', path: '/admin/settings/payments' },
      { label: 'Team', path: '/admin/settings/team', disabled: true, description: 'Owners only' }
    ] },
    { type: 'separator' },
    {
      label: 'Log out', icon: 'arrow-right-to-bracket', danger: true,
      onClick: async () => {
        const ask = await slice.build('Modal', {
          title: 'Log out?', size: 'sm', destroyOnClose: true,
          content: 'You will need to sign in again to manage the store.',
          actions: [{ value: 'Stay', variant: 'ghost' }, { value: 'Log out', variant: 'danger', onClick: () => show({ label: 'Signed out', description: 'See you soon.' }) }]
        });
        document.body.appendChild(ask);
        await ask.show();
      }
    }
  ],
  // In a real app the router shows the page. Here the example stops the
  // navigation, draws the page itself and marks it as current.
  onSelect: (item) => {
    if (!item.path) return;
    show(item);
    menu.activePath = item.path;
    return false;
  }
});
show({ label: 'Dashboard', description: 'Sales, orders and visitors for today.' });

const aside = document.createElement('aside');
aside.style.cssText = 'width:240px;flex:none';
aside.appendChild(menu);

const app = document.createElement('div');
app.style.cssText = 'display:flex;gap:16px;width:100%;min-width:0;flex-wrap:wrap';
app.append(aside, page);
return app;
:::

:::script label="Store categories on a phone (drill, loaded on demand)" expected="a phone-sized panel with a Shop menu; Departments slides in its departments with an 'All departments' link; each department loads its categories after a short wait (with a loading row); the back button names the level; Deals has a badge"
// A pretend API: categories arrive after a short wait.
const api = {
  departments: async () => {
    await new Promise((r) => setTimeout(r, 500));
    return [
      { label: 'Electronics', id: 'electronics', icon: 'desktop-pc', items: () => api.categories('Electronics') },
      { label: 'Home & kitchen', id: 'home', icon: 'home', items: () => api.categories('Home & kitchen') },
      { label: 'Sports', id: 'sports', icon: 'heart', items: () => api.categories('Sports') }
    ];
  },
  categories: async (name) => {
    await new Promise((r) => setTimeout(r, 400));
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '-');
    return ['Best sellers', 'New arrivals', 'Under $25'].map((label) => ({ label, path: `/shop/${slug}/${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }));
  }
};

const status = document.createElement('p');
status.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7';
status.textContent = 'Pick a category.';

const menu = await slice.build('SideMenu', {
  title: 'Shop',
  size: 'lg',
  followRoute: false,
  items: [
    { label: 'Departments', path: '/shop/departments', icon: 'grid', id: 'departments', items: api.departments },
    { label: 'Deals', path: '/shop/deals', icon: 'sale-percent', badge: { label: 'Today', tone: 'danger' } },
    { label: 'Orders', path: '/shop/orders', icon: 'truck', description: 'Track and return' },
    { type: 'separator' },
    { label: 'Help', href: 'https://example.com/help', target: '_blank', icon: 'life-saver' }
  ],
  onSelect: (item) => {
    status.textContent = `Would open ${item.path || item.href}`;
    if (item.path) menu.activePath = item.path;
    return false;
  }
});

const phone = document.createElement('div');
phone.style.cssText = 'width:100%;max-width:320px;min-width:0;padding:12px;border:1px solid var(--slice-border-raised, #ddd);border-radius:24px;box-shadow:var(--slice-shadow-md)';
phone.append(menu, status);
return phone;
:::

:::script label="Account menu with groups and actions" expected="a drill menu with an Account group (Profile, Notifications with a badge, Billing disabled) and a Preferences group with a theme action and a Language submenu; choosing a language updates a status line; Log out is red"
const toasts = await slice.build('ToastProvider', { singleton: true });
let dark = false;
const languages = ['English', 'Español', 'Português'];

const menu = await slice.build('SideMenu', {
  label: 'Account',
  variant: 'ghost',
  followRoute: false,
  items: [
    { type: 'group', label: 'Account', items: [
      { label: 'Profile', path: '/account/profile', icon: 'user', description: 'Name, photo and email' },
      { label: 'Notifications', path: '/account/notifications', icon: 'bell', badge: 3 },
      { label: 'Billing', path: '/account/billing', icon: 'credit-card', disabled: true, description: 'Ask an owner' }
    ] },
    { type: 'group', label: 'Preferences', items: [
      { label: 'Switch theme', icon: 'moon', onClick: () => { dark = !dark; toasts.show(`Theme: ${dark ? 'dark' : 'light'}`); } },
      { label: 'Language', id: 'language', icon: 'globe', items: languages.map((name) => ({
        label: name,
        onClick: ({ menu: m }) => { toasts.show(`Language: ${name}`, { type: 'success' }); m.back(); }
      })) }
    ] },
    { type: 'separator' },
    { label: 'Log out', icon: 'arrow-right-to-bracket', danger: true, onClick: () => toasts.show('Logged out') }
  ],
  onSelect: (item) => { if (item.path) { toasts.show(`Open ${item.label}`); return false; } }
});

const card = document.createElement('div');
card.style.cssText = 'width:100%;max-width:300px;min-width:0';
card.appendChild(menu);
return card;
:::

:::script label="Tree on wide, drill on narrow" expected="a resizable box (drag its corner) holding a menu with mode 'auto'; wider than 420px it is a tree, narrower it becomes a drill menu, and the open section stays open"
const menu = await slice.build('SideMenu', {
  title: 'Docs',
  // A tree from 420px wide, a drill menu below.
  mode: 'auto',
  breakpoint: 420,
  followRoute: false,
  activePath: '/guide/components/props',
  items: [
    { label: 'Getting started', path: '/guide/start', icon: 'rocket' },
    { label: 'Guide', icon: 'book-open', id: 'guide', items: [
      { label: 'Components', id: 'components', items: [
        { label: 'Templates', path: '/guide/components/templates' },
        { label: 'Props', path: '/guide/components/props' },
        { label: 'Lifecycle', path: '/guide/components/lifecycle' }
      ] },
      { label: 'Routing', path: '/guide/routing' },
      { label: 'Services', path: '/guide/services' }
    ] },
    { label: 'API reference', path: '/api', icon: 'code' }
  ],
  onSelect: (item) => { if (item.path) menu.activePath = item.path; return false; }
});

const box = document.createElement('div');
box.style.cssText = 'resize:horizontal;overflow:auto;width:520px;max-width:100%;min-width:240px;padding:12px;border:1px dashed var(--slice-border-raised, #ccc);border-radius:12px';
box.appendChild(menu);

const note = document.createElement('p');
note.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7';
note.textContent = 'Drag the corner of the box to make it narrower.';

const wrap = document.createElement('div');
wrap.style.cssText = 'width:100%;min-width:0';
wrap.append(box, note);
return wrap;
:::

## Best Practices
:::tip
Keep each level short (about 7 items) and give it a clear name: in drill mode the name is all people see of where they are. Use `type: 'group'` headings to split a long level instead of adding another one.
:::

:::tip
Give a submenu a `path` when its section has a page of its own. People can then reach the page in one click ("All Settings") and still browse inside the section.
:::

:::tip
Load big submenus on demand with a function in `items`. The first level shows at once, and each department or project loads only when someone opens it.
:::

## Pitfalls
:::warning
Do not put the same item in two places. The current page is marked once, and people stop trusting a menu where the same page lives in two sections.
:::

:::warning
In drill mode, an action that stays in the menu (such as choosing a language) should go back a level, or show a result, so people see that it worked. `onClick` receives the menu, so it can call `menu.back()`.
:::

:::warning
Inside a drawer, close the drawer in `onSelect` after a link is chosen, or people are left looking at the menu over the new page.
:::