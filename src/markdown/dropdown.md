---
title: DropDown
route: /docs/navigation/dropdown
navLabel: DropDown
section: Navigation
group: Core
order: 32
description: Menu button with links, actions, toggles and nested submenus, trigger variants, smart placement and full keyboard support.
component: DropDownDocumentation
generate: true
tags: [dropdown, menu, navigation, submenu, actions]
---

# DropDown

## Overview
`DropDown` is a menu button: a trigger and a menu of links, actions, checkboxes, radio options and **submenus nested as deep as you need**. You build the menu from plain objects, and the same vocabulary works at every level.

## Core Behavior
- `label` sets the trigger text and `items` the menu. `options` is the old name of `items` and still works.
- The menu opens on click (or on hover with `trigger: 'hover'`). It closes when you pick an item, press Escape, click outside or tab away.
- The menu is drawn in the browser's top layer, so a parent with `overflow: hidden` does not clip it and a transformed parent (a sliding mobile nav) does not move it.
- It opens where `placement` says (`'bottom-end'` by default). If there is no room it flips to the other side, and it never leaves the screen.
- `onSelect(item, ctx)` fires for every link, action or toggle picked, at any depth. `onOpenChange(open)` fires when the menu opens or closes.
- `open()`, `close()` and `toggle()` drive it from code. `isOpen` tells you whether it is open.

## Building the menu
Every entry in `items` (and in any submenu) is one of these:

- `{ label, href }`: a link. It is a real `<a>`, so middle-click and "open in new tab" work. Use `target: '_blank'` for a new tab.
- `{ label, path }`: a route, navigated through `slice.router`.
- `{ label, onClick(ctx) }`: an action. An item with an action never navigates, even if it also has a `path`. `callback` is the old name of `onClick`.
- `{ label, items: [...] }`: a submenu. Nest as deep as you like. `items` can also be a function, even an async one, to load the submenu when it opens; a loading row shows meanwhile.
- `{ label, checked }`: a checkbox item. Picking it flips `checked` and keeps the menu open.
- `{ type: 'radio', group, label, checked }`: a radio item. Only one per `group` is checked.
- `'separator'`: a divider. Leading, trailing and doubled separators are removed.
- `{ type: 'label', label }`: a small section heading.
- `{ render(ctx) }`: anything you build, such as a search field or a slider. Keys typed in it belong to it, and Escape still closes the menu.

Any item can also take `icon` (an `Icon` name or a node), `description` (a second, quieter line), `shortcut`, `badge`, `danger` (red, for destructive actions), `disabled`, `hidden` (`true` or a function of the item), `keepOpen` and `value`.

`ctx` is `{ item, value, dropdown, event, close() }`. `close()` lets your custom content close the menu.

## The trigger
- `variant`: `'outlined'` (default), `'filled'`, `'soft'`, `'ghost'` or `'plain'`. `'plain'` is bare text in the colour around it, made for navigation bars.
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `icon` puts an `Icon` before the label. With no `label` the trigger is a square icon button; give it `ariaLabel` so screen readers can name it.
- `caret: false` hides the chevron. `disabled` turns the whole dropdown off.

## Keyboard
- On the trigger: **Enter**, **Space** or **↓** open the menu on the first item, **↑** on the last.
- In the menu: **↑ ↓** move (disabled items are skipped), **Home / End** jump, and typing a letter jumps to the next item starting with it.
- **→** or **Enter** opens a submenu. **←** or **Escape** closes one level and returns to the item that opened it. Escape on the first level returns to the trigger.
- **Tab** closes everything.

## Submenus on any screen
Submenus open beside their item and flip to the other side at the screen edge. With the mouse, hovering opens them after a short pause, so crossing an item on the way to a submenu does not shut it.

When a submenu fits on neither side, as on a phone or several levels deep on a laptop, it **stacks**: it opens on top of its parent with a "‹ Back" row, like the drill-down menus of native apps. Hover never opens a stacked submenu; a tap or the keyboard does.

## Live Preview
:::component name="DropDown"
{
  "label": "Resources",
  "items": [
    { "label": "Docs", "href": "/docs" },
    { "label": "Components", "items": [
      { "label": "Button", "href": "/docs/input/button" },
      { "label": "Table", "href": "/docs/data/table" }
    ] },
    "separator",
    { "label": "GitHub", "href": "#" }
  ]
}
:::

## Prop Scenarios
:::script label="Nested menu with icons, toggles and a danger zone" expected="a menu with sections; Settings opens a submenu, which opens another"
const result = document.createElement('p');
result.textContent = 'Pick something.';

const menu = await slice.build('DropDown', {
  label: 'Account',
  icon: 'user',
  variant: 'soft',
  placement: 'bottom-start',
  onSelect: (item) => { result.textContent = `Picked: ${item.label}`; },
  items: [
    { type: 'label', label: 'Signed in as José' },
    { label: 'Profile', icon: 'user', shortcut: '⌘P' },
    { label: 'Billing', icon: 'credit-card', description: 'Plans, invoices and payment', badge: 3 },
    {
      label: 'Settings', icon: 'cog', items: [
        { label: 'General' },
        {
          label: 'Appearance', items: [
            { type: 'radio', group: 'theme', label: 'Light', checked: true },
            { type: 'radio', group: 'theme', label: 'Dark' },
            'separator',
            { label: 'Accent colour', items: [{ label: 'Purple' }, { label: 'Orange' }, { label: 'Teal' }] }
          ]
        },
        { label: 'Email notifications', checked: true }
      ]
    },
    'separator',
    { label: 'Sign out', icon: 'arrow-right-to-bracket' },
    { label: 'Delete account', icon: 'trash-bin', danger: true }
  ]
});

const box = document.createElement('div');
box.style.width = '100%';
box.append(menu, result);
return box;
:::

:::script label="Trigger variants and sizes" expected="five trigger styles, three sizes and an icon-only button"
const items = [{ label: 'Edit' }, { label: 'Duplicate' }, 'separator', { label: 'Delete', danger: true }];
const row = document.createElement('div');
row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;width:100%';
for (const variant of ['outlined', 'filled', 'soft', 'ghost', 'plain']) {
  row.appendChild(await slice.build('DropDown', { label: variant, variant, items }));
}
for (const size of ['sm', 'md', 'lg']) {
  row.appendChild(await slice.build('DropDown', { label: `Size ${size}`, size, items }));
}
row.appendChild(await slice.build('DropDown', { icon: 'dots-vertical', ariaLabel: 'More actions', variant: 'ghost', items }));
return row;
:::

:::script label="Submenu loaded on demand" expected="Recent projects shows a loading row, then the list"
const menu = await slice.build('DropDown', {
  label: 'Open',
  placement: 'bottom-start',
  items: [
    { label: 'New project', shortcut: '⌘N' },
    {
      label: 'Recent projects',
      items: async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return ['Inventory', 'Website', 'Mobile app'].map((name) => ({ label: name, onClick: () => console.log('open', name) }));
      }
    }
  ]
});
return menu;
:::

:::script label="Custom content inside the menu" expected="a search box filters nothing yet, but you can type in it; Escape closes"
const menu = await slice.build('DropDown', {
  label: 'Jump to',
  placement: 'bottom-start',
  items: [
    {
      render: ({ close }) => {
        const input = document.createElement('input');
        input.type = 'search';
        input.placeholder = 'Type a page and press Enter';
        input.style.cssText = 'width:100%;box-sizing:border-box;padding:6px 8px';
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') close();
        });
        return input;
      }
    },
    'separator',
    { label: 'Dashboard', path: '/docs' },
    { label: 'Settings', path: '/docs/input/switch' }
  ]
});
return menu;
:::

:::script label="Action menu (legacy options)" expected="picking an item runs the action and shows the result"
const result = document.createElement('p');
result.textContent = 'No action yet';

const menu = await slice.build('DropDown', {
  label: 'Export',
  options: [
    { text: 'Download JSON', callback: () => { result.textContent = 'Downloaded'; } },
    { text: 'Print view', callback: () => { result.textContent = 'Print dialog opened'; } },
    { text: 'Back to docs', path: '/docs' }
  ]
});

const host = document.createElement('div');
host.appendChild(menu);
host.appendChild(result);
return host;
:::

## In a Navbar
Give a `Navbar` item an `items` array and it becomes a dropdown: plain text in the bar, opening on hover (click and keyboard work too), with any submenus you nest. `type: 'dropdown'` with `options` keeps working. Per item you can override `variant`, `trigger`, `placement` and `icon`.

:::script label="Navbar with nested menus" expected="Products opens on hover; Automation and Integrations open submenus"
const nav = await slice.build('Navbar', {
  items: [
    { text: 'Home', path: '/docs' },
    {
      text: 'Products',
      items: [
        { label: 'Analytics', icon: 'chart', description: 'Dashboards and reports' },
        {
          label: 'Automation', icon: 'rocket', items: [
            { label: 'Workflows' },
            { label: 'Integrations', items: [{ label: 'Slack' }, { label: 'GitHub' }, { label: 'Jira' }] }
          ]
        },
        { label: 'Security', icon: 'shield-check' }
      ]
    },
    { text: 'Docs', items: [{ label: 'Guides', path: '/docs' }, { label: 'API', path: '/docs/data/table' }] }
  ]
});
nav.style.width = '100%';
return nav;
:::

## Best Practices
:::tip
Keep menus shallow when you can: two or three levels read well. Go deeper for real hierarchies (a file tree, categories), not to hide options.
:::

:::tip
Use `danger: true` for destructive actions and put them last, after a separator, so they are never the item a quick click lands on.
:::

## Pitfalls
:::warning
Checkbox and radio items keep their state on the item objects (`checked` is flipped in place). Rebuild the array from your own state if you need the menu to reflect changes made elsewhere, or pass `checked` as a function.
:::

:::warning
An icon-only trigger has no visible text, so give it `ariaLabel`; otherwise screen readers announce an unnamed button.
:::