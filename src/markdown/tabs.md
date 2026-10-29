---
title: Tabs
route: /docs/navigation/tabs
navLabel: Tabs
section: Navigation
group: Core
order: 31
description: Tab strip with four variants, a sliding indicator, icons, badges, closable and lazy tabs, overflow arrows, vertical layout, the full keyboard pattern and remembered state.
component: TabsDocumentation
generate: true
tags: [tabs, navigation, routing, panels]
---

# Tabs

## Overview
`Tabs` switches between sibling views without leaving the page. It follows the WAI-ARIA tabs pattern in full:
- the tab strip, each tab and each panel carry the roles screen readers expect, and every tab is linked to its panel;
- only one tab is in the Tab order at a time, and the arrow keys move between tabs;
- the active tab is marked by an indicator that slides to it.

Tabs can have icons and badges, be disabled or closed, and load their panel only when first opened. When there are more tabs than fit, arrows appear to scroll the strip.

## Core Behavior
- `items` are the tabs: `{ id, label, icon, badge, disabled, hidden, closable, panel }`.
  - `panel` can be a node, a string, or a **function** that returns one (it may be `async`). A function runs the first time its tab opens, so expensive content (a Table, a chart, a request) only costs anything once someone looks at it. While it loads, the panel shows a shimmer.
  - `badge` is a number (over 99 shows "99+"), a short text, or `true` for a dot. `setBadge(id, value)` updates it without re-rendering; `null` removes it.
  - A tab with only an `icon` and no `label` takes its accessible name from `ariaLabel`.
- `activeTab` sets the open tab. `onChange(id)` and the `tab-change` event (`detail: { tabId, item, previous }`) report changes. `activeItem` and `activeIndex` tell you which one is open.
- `onBeforeChange(next, previous)` can return `false` to stay on the current tab, for example while it has unsaved changes.
- `select(id)`, `next()` and `prev()` switch from code. `addTab(item, index)` and `removeTab(id)` add and remove tabs.

### Keyboard
- **← →** (or **↑ ↓** when vertical) move to the next or previous tab, skipping disabled ones and wrapping at the ends.
- **Home** and **End** jump to the first and last tab.
- **Delete** closes a closable tab, as does a middle click.
- `activation: 'auto'` (default) opens a tab as soon as the arrow keys reach it. With `'manual'`, the arrows only move the focus and **Enter** or **Space** opens the tab. Use manual when opening a panel is slow.

### Closing tabs
- `closable: true` puts a ✕ on every tab; `closable` on an item does it for one tab (or `closable: false` keeps one open).
- `onClose(id, item)` runs first. Return `false` to keep the tab, for example to ask whether to discard changes.
- When a tab is closed, its neighbour opens, and the closed tab's panel is destroyed along with every Slice component inside it.

### Remembering the tab
- `stateKey` remembers the open tab in the browser (localStorage), so it is still open after a reload.
- `urlParam: 'tab'` keeps it in the address (`?tab=billing`), so a link can open a page on the right tab. It replaces the current history entry rather than adding one, so Back leaves the page instead of stepping through every tab clicked.
- On load, the URL wins, then what was remembered, then `activeTab`, then the first enabled tab.

### Memory
The panels belong to the Tabs. When you set `items` again, a tab whose `id` and `panel` are the same keeps its panel exactly as it was, along with everything typed into it. A tab that is gone, or whose `panel` changed, has its panel destroyed. `keepMounted: false` throws away a function panel when you leave its tab and runs it again the next time it opens.

## Looks
- `variant`:
  - `'underline'` (default): a bar under the active tab. It was called `'primary'`, which still works.
  - `'pill'`: a soft pill behind the active tab.
  - `'segmented'`: a segmented control, where the active tab is a filled pill. It was called `'secondary'`, which still works.
  - `'enclosed'`: card-like tabs attached to a bordered panel.
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `orientation: 'vertical'` puts the tabs in a column beside the panels, as in a settings page.
- `align`: `'start'` (default), `'center'`, `'end'` or `'stretch'` (tabs share the width equally).

## Live Preview
:::component name="Tabs"
{
  "items": [
    { "id": "overview", "label": "Overview", "icon": "home", "panel": "A summary of the project." },
    { "id": "inbox", "label": "Inbox", "icon": "inbox", "badge": 4, "panel": "Four unread messages." },
    { "id": "settings", "label": "Settings", "icon": "cog", "panel": "Project settings." }
  ]
}
:::

## Examples
:::script label="A project page" expected="Overview, Issues (a Table whose ⋯ menu closes issues and updates the badge), Activity (loads on first open) and Settings (a Form)"
const toasts = await slice.build('ToastProvider', { singleton: true });
let issues = [
  { id: 101, title: 'Login button misaligned on Safari', label: 'bug', opened: '2 days ago' },
  { id: 102, title: 'Add dark mode to the export dialog', label: 'feature', opened: 'yesterday' },
  { id: 103, title: 'Table sort resets after filtering', label: 'bug', opened: '5 hours ago' }
];

const overview = document.createElement('div');
overview.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px';
const stat = (label, value) => {
  const box = document.createElement('div');
  box.style.cssText = 'padding:14px 16px;border:1px solid var(--slice-border-raised);border-radius:12px';
  box.innerHTML = '<div style="font-size:.8rem;opacity:.7"></div><div style="font-size:1.5rem;font-weight:700"></div>';
  box.children[0].textContent = label;
  box.children[1].textContent = value;
  return box;
};
const openCount = stat('Open issues', issues.length);
overview.append(openCount, stat('Contributors', 8), stat('Last release', 'v2.4.1'));

const issueTable = await slice.build('Table', {
  columns: [
    { key: 'id', label: '#', render: (row) => `#${row.id}` },
    { key: 'title', label: 'Title' },
    { key: 'label', label: 'Label' },
    { key: 'opened', label: 'Opened' }
  ],
  rows: issues,
  rowKey: 'id',
  rowActions: [{
    label: 'Close issue',
    onClick: ({ row }) => {
      issues = issues.filter((i) => i.id !== row.id);
      issueTable.rows = issues;
      tabs.setBadge('issues', issues.length || null);
      openCount.children[1].textContent = issues.length;
      toasts.show(`Closed #${row.id}`, { type: 'success' });
    }
  }]
});
issueTable.style.width = '100%';

const settings = await slice.build('Form', {
  variant: 'plain',
  columns: 2,
  submitText: 'Save settings',
  schema: [
    { kind: 'field', name: 'name', label: 'Project name', component: 'Input', required: true, value: 'website-redesign' },
    { kind: 'field', name: 'visibility', label: 'Visibility', component: 'Select', props: { options: ['Private', 'Team', 'Public'] }, value: 'Team' },
    { kind: 'field', name: 'description', label: 'Description', component: 'Textarea', full: true, value: 'The new marketing site.' }
  ],
  onSubmit: () => toasts.show('Settings saved', { type: 'success' })
});

const tabs = await slice.build('Tabs', {
  items: [
    { id: 'overview', label: 'Overview', icon: 'home', panel: overview },
    { id: 'issues', label: 'Issues', icon: 'exclamation-circle', badge: issues.length, panel: issueTable },
    {
      id: 'activity', label: 'Activity', icon: 'bell',
      // Lazy: runs the first time the tab opens (the shimmer shows meanwhile).
      panel: async () => {
        await new Promise((r) => setTimeout(r, 900));
        const list = document.createElement('ul');
        list.style.cssText = 'margin:0;padding-left:18px;line-height:1.9';
        for (const line of ['Ana merged #98 into main', 'José opened #103', 'Luis released v2.4.1', 'María commented on #101']) {
          list.appendChild(Object.assign(document.createElement('li'), { textContent: line }));
        }
        return list;
      }
    },
    { id: 'settings', label: 'Settings', icon: 'cog', panel: settings }
  ]
});
tabs.style.width = '100%';
return tabs;
:::

:::script label="An editor with file tabs" expected="New file adds a tab; editing marks it with a dot; closing an edited tab asks first in a Modal"
const files = new Map();   // id -> { name, saved, editor }
let count = 0;

const discard = async (name) => {
  const modal = await slice.build('Modal', {
    title: `Close ${name} without saving?`,
    description: 'Your changes will be lost.',
    tone: 'warning',
    size: 'sm',
    destroyOnClose: true,
    actions: [{ value: 'Keep editing', variant: 'ghost', autofocus: true }, { value: 'Discard', variant: 'danger', close: 'discard' }]
  });
  document.body.appendChild(modal);
  return (await modal.show()).returnValue === 'discard';
};

const newFile = async (name = `untitled-${++count}.md`, text = '') => {
  const id = `file-${Date.now()}-${count}`;
  const editor = await slice.build('Textarea', {
    ariaLabel: name, value: text, rows: 8, autoGrow: true, maxRows: 14, resize: 'none',
    placeholder: 'Start writing…'
  });
  const file = { name, saved: text, editor };
  editor.onChange = (value) => tabs.setBadge(id, value === file.saved ? null : true);
  files.set(id, file);
  tabs.addTab({ id, label: name, icon: 'file-lines', closable: true, panel: editor });
  tabs.select(id);
};

const tabs = await slice.build('Tabs', {
  items: [],
  size: 'sm',
  onClose: (id) => {
    const file = files.get(id);
    if (file.editor.value === file.saved) { files.delete(id); return true; }
    // Ask first; close for real only if they agree.
    discard(file.name).then((ok) => { if (ok) { files.delete(id); tabs.removeTab(id); } });
    return false;
  }
});
tabs.style.width = '100%';

const save = await slice.build('Button', {
  value: 'Save', size: 'sm', variant: 'outlined',
  onClick: () => {
    const file = files.get(tabs.activeTab);
    if (!file) return;
    file.saved = file.editor.value;
    tabs.setBadge(tabs.activeTab, null);
  }
});
const add = await slice.build('Button', { value: 'New file', icon: 'plus', size: 'sm', onClick: () => newFile() });
await newFile('README.md', '# Website redesign\n\nThe new marketing site.');
await newFile('notes.md', '- Ask Ana about the hero image');

const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-bottom:8px';
bar.append(save, add);
const box = document.createElement('div');
box.style.width = '100%';
box.append(bar, tabs);
return box;
:::

:::script label="Pricing with a segmented switch" expected="Monthly / Yearly switches every price; Yearly carries a -20% badge"
const plans = [
  { name: 'Starter', monthly: 9, features: ['3 projects', 'Email support'] },
  { name: 'Team', monthly: 29, features: ['Unlimited projects', 'Shared workspaces', 'Priority support'], featured: true },
  { name: 'Business', monthly: 79, features: ['SSO', 'Audit log', 'Dedicated manager'] }
];
const cards = document.createElement('div');
cards.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:6px';
const prices = [];
for (const plan of plans) {
  const card = document.createElement('div');
  card.style.cssText = `display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:14px;border:${plan.featured ? '2px solid var(--primary-color)' : '1px solid var(--slice-border-raised)'}`;
  const name = Object.assign(document.createElement('div'), { textContent: plan.name });
  name.style.fontWeight = '700';
  const price = document.createElement('div');
  price.style.cssText = 'font-size:1.8rem;font-weight:800;font-variant-numeric:tabular-nums';
  prices.push({ price, plan });
  const list = document.createElement('ul');
  list.style.cssText = 'margin:0;padding-left:18px;line-height:1.8;font-size:.9rem';
  for (const f of plan.features) list.appendChild(Object.assign(document.createElement('li'), { textContent: f }));
  const cta = await slice.build('Button', { value: `Choose ${plan.name}`, variant: plan.featured ? 'filled' : 'outlined', size: 'sm' });
  card.append(name, price, list, cta);
  cards.appendChild(card);
}
const paint = (period) => {
  for (const { price, plan } of prices) {
    const value = period === 'yearly' ? Math.round(plan.monthly * 12 * 0.8) : plan.monthly;
    price.textContent = `$${value}`;
    price.appendChild(Object.assign(document.createElement('span'), {
      textContent: period === 'yearly' ? ' / year' : ' / month',
      style: 'font-size:.85rem;font-weight:500;opacity:.7'
    }));
  }
};
const period = await slice.build('Tabs', {
  variant: 'segmented',
  align: 'center',
  ariaLabel: 'Billing period',
  items: [{ id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly', badge: '-20%' }],
  onChange: paint
});
paint('monthly');
const box = document.createElement('div');
box.style.cssText = 'display:flex;flex-direction:column;gap:16px;align-items:center;width:100%';
cards.style.width = '100%';
box.append(period, cards);
return box;
:::

:::script label="Settings with a vertical menu" expected="a vertical pill menu beside the panels; the section is kept in the address as ?section=…"
const field = (props) => slice.build('Input', props);
const profile = document.createElement('div');
profile.style.cssText = 'display:grid;gap:18px;max-width:420px';
profile.append(
  await field({ label: 'Full name', value: 'Ana López' }),
  await field({ label: 'Email', type: 'email', icon: 'user', value: 'ana@example.com' })
);
const notifications = document.createElement('div');
notifications.style.cssText = 'display:flex;flex-direction:column;gap:12px';
for (const [label, checked] of [['Comments', true], ['Mentions', true], ['Weekly digest', false]]) {
  notifications.appendChild(await slice.build('Switch', { label, checked, labelPlacement: 'left' }));
}
const security = document.createElement('div');
security.style.cssText = 'display:grid;gap:18px;max-width:420px';
security.append(
  await field({ label: 'Current password', type: 'password', secret: true }),
  await field({ label: 'New password', type: 'password', secret: true, minlength: 8, help: 'At least 8 characters' })
);
const tabs = await slice.build('Tabs', {
  orientation: 'vertical',
  variant: 'pill',
  urlParam: 'section',
  ariaLabel: 'Settings',
  items: [
    { id: 'profile', label: 'Profile', icon: 'user', panel: profile },
    { id: 'notifications', label: 'Notifications', icon: 'bell', badge: 2, panel: notifications },
    { id: 'security', label: 'Security', icon: 'shield', panel: security },
    { id: 'billing', label: 'Billing', icon: 'file-invoice', disabled: true }
  ]
});
tabs.style.width = '100%';
return tabs;
:::

:::script label="Looks at a glance" expected="the four variants, the three sizes and a strip that overflows"
const items = [
  { id: 'a', label: 'Overview', icon: 'home' },
  { id: 'b', label: 'Inbox', icon: 'inbox', badge: 12 },
  { id: 'c', label: 'Team', icon: 'users', badge: true },
  { id: 'd', label: 'Archived', disabled: true }
];
const box = document.createElement('div');
box.style.cssText = 'display:flex;flex-direction:column;gap:26px;width:100%';
for (const variant of ['underline', 'pill', 'segmented', 'enclosed']) {
  box.appendChild(await slice.build('Tabs', { variant, items: items.map((i) => ({ ...i, panel: `${variant} — ${i.label}` })) }));
}
for (const size of ['sm', 'lg']) box.appendChild(await slice.build('Tabs', { size, variant: 'pill', items }));
box.appendChild(await slice.build('Tabs', {
  closable: true,
  items: Array.from({ length: 14 }, (_, i) => ({ id: `f${i}`, label: `report-${i + 1}.csv` }))
}));
return box;
:::

## Best Practices
:::tip
Use tabs for views at the same level that people switch between. If they have to go through them in order, use a [Form](/docs/input/form) with steps instead.
:::

:::tip
Make expensive panels functions. A Table with thousands of rows, a chart or a request in a tab nobody opens then costs nothing.
:::

:::tip
Use `urlParam` on pages people link to or come back to (settings, a record's details). A link that opens the right tab saves a click and a "where was that?".
:::

## Pitfalls
:::warning
Do not hide validation errors in a tab that is not open. If a tab holds an error, put a badge on it (`setBadge(id, '!')`) and open it on submit, so people know where to look.
:::

:::warning
Give every item a stable `id`. The tabs, their panels and what is remembered all go by it: an id that changes on every render rebuilds the panel each time, and throws away what was typed in it.
:::

## Language

The built-in texts are `slice.tabs.*` keys with English and Spanish defaults, registered by
`shared/text/texts.js` in the translator's lowest layer: an app dictionary always wins, and the
component keeps its English text when the translator is off.
`ariaLabel` and `texts` still win over the dictionary.
Keys: `label`.
