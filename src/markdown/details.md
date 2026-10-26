---
title: Details
route: /docs/layout/details
navLabel: Details
section: Layout
group: Containers
order: 21
description: Content that folds open. One section, or a group of them as an accordion (one open at a time, or several), with icons, badges, lazy content, keyboard navigation and remembered state. Built on the native details element.
component: DetailsDocumentation
generate: true
tags: [details, accordion, disclosure, faq, collapse, layout]
---

# Details

## Overview
`Details` hides content until someone asks for it. It is one section with a title, or a group of sections (an **accordion**) where opening one closes the others.

### When to use it
- **Questions and answers** (a FAQ, a help page), where people look for one answer and skip the rest.
- **Optional or advanced settings** that most people never change.
- **Long pages split into sections** people open one at a time: a policy, release notes, a product's specs.
- **Secondary information inside a [Card](/docs/layout/card) or a form**, such as an order's line items or how a price was worked out.

### When not to use it
- **Content everyone needs** should not be hidden. If people always open it, show it.
- **Views at the same level that people switch between** are [Tabs](/docs/navigation/tabs). Tabs show one view and keep the others' place. An accordion stacks them.
- **Steps that must be done in order** are a [Form](/docs/input/form) with steps.
- **A message that needs an answer** is a [Modal](/docs/feedback/modal).

## Core Behavior
Each section is a native `<details>` with a `<summary>`, so the browser provides:
- the button role, `aria-expanded`, and **Enter** / **Space** to toggle;
- find-in-page (Ctrl+F) that opens the section holding the match.

On top of that, Details animates the height, keeps a group exclusive, adds arrow-key navigation, loads content on first open and remembers what was open.

### One section
- `title` and `subtitle` are the summary. `icon` puts a mark beside them, and `badge` adds a [Badge](/docs/display/badge) (text, a number, or Badge props such as `{ label, tone }`).
- `text` is the body text. `content` adds nodes or components after it.
- `open` sets the state. `onToggle(open, { details })` and the `details-toggle` event report changes.
- `disabled` keeps the section from opening.
- `name`: standalone sections with the same `name` close each other, like the native attribute. Several Details spread over a page can then act as one group.
- `addDetail(node)`, from the old API, still appends a node to the content.

### An accordion
- `items` is a list of sections: `{ id, title, subtitle, icon, badge, text, content, open, disabled }`.
- By default **one section is open at a time**: opening one closes the one that was open. `multiple: true` lets several stay open.
- `collapsible: false` always keeps one section open, and the open one cannot be closed. It suits steps or a settings menu.
- `onToggle(id, open, { item, details })` reports every change, including the section that closed because another opened. `openIds` lists the open sections.
- `show(id)`, `hide(id)` and `toggle(id)` change a section from code. `showAll()` and `hideAll()` work on all of them (`showAll` only with `multiple`).
- `stateKey` remembers which sections were open, in the browser (localStorage), so they are still open after a reload.

### Keyboard
- **Tab** moves between summaries and into open content.
- **Enter** or **Space** opens or closes the focused section.
- **↓ ↑** move to the next or previous summary, skipping disabled ones and wrapping at the ends.
- **Home** and **End** jump to the first and last summary.

### Lazy content
`content` can be a function `({ id, item, details }) => node | string | array`, and it can be `async`. It runs the first time its section opens, and a shimmer shows while it loads. A section nobody opens, holding a Table, a Form or a request, then costs nothing.

### Memory
The sections own their content. Destroying the Details destroys the components inside, along with the icons and badges it built. When you set `items` again:
- a section with the same `id` and the same `content` keeps its body exactly as it was, with what was typed in it and whether it was open;
- a section that is gone, or whose `content` changed, has its body destroyed.

## Looks
- `variant`:
  - `'outlined'` (default): one border around the group, with dividers between sections;
  - `'separated'`: each section its own box, and the open one stands out;
  - `'filled'`: a tinted surface;
  - `'ghost'`: dividers only, flush with the text around it.
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `marker`: `'chevron'` (default) turns as the section opens. `'plus'` is a plus that becomes a minus.
- The CSS variables `--slice-details-accent`, `--slice-details-bg`, `--slice-details-border` and `--slice-details-radius` retint it.

## Live Preview
:::component name="Details"
{
  "title": "What's included?",
  "subtitle": "Every plan",
  "text": "Source code, tests, documentation and a year of updates."
}
:::

## Examples
:::script label="Help center with search" expected="an accordion of questions with an icon each; typing in the search keeps only the matching questions and opens the first one; no match shows an empty state"
const faqs = [
  { id: 'ship', icon: 'truck', title: 'How long does shipping take?', text: 'Orders leave our warehouse within one business day and arrive in 2–4 days.' },
  { id: 'return', icon: 'refresh', title: 'Can I return an order?', text: 'Yes. You have 30 days from delivery to return anything, unused and in its box.' },
  { id: 'pay', icon: 'credit-card', title: 'Which payment methods do you take?', text: 'Cards, bank transfers and mobile payments. You are only charged when the order ships.' },
  { id: 'track', icon: 'map-pin', title: 'How do I track my order?', text: 'The shipping email has a tracking link. You can also find it under Orders in your account.' },
  { id: 'cancel', icon: 'close-circle', title: 'Can I cancel an order?', text: 'Until it ships, from Orders in your account. After that, return it instead.' }
];

const help = await slice.build('Details', { items: faqs, variant: 'separated' });
const empty = await slice.build('EmptyState', { icon: 'search', title: 'No questions match', description: 'Try another word, or write to us.' });
empty.hidden = true;

const search = await slice.build('Input', {
  label: 'Search the help center',
  icon: 'search',
  clearable: true,
  debounce: 200,
  onChange: (query) => {
    const q = query.trim().toLowerCase();
    const found = q ? faqs.filter((f) => (f.title + ' ' + f.text).toLowerCase().includes(q)) : faqs;
    // Sections that stay keep their state; only the list changes.
    help.items = found;
    help.hidden = found.length === 0;
    empty.hidden = found.length > 0;
    if (q && found.length) help.show(found[0].id);
  }
});

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:16px;width:100%;max-width:640px';
box.append(search, help, empty);
return box;
:::

:::script label="Order summary in a Card" expected="a Card with the order total; 'Items' opens a lazily built Table of the order lines and 'How the total is worked out' shows the breakdown"
const lines = [
  { item: 'Notebook A5, dotted', qty: 3, price: 6.5 },
  { item: 'Gel pens, pack of 10', qty: 1, price: 9 },
  { item: 'Washi tape set', qty: 2, price: 4.25 }
];
const subtotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
const shipping = 4;
const tax = Math.round(subtotal * 0.16 * 100) / 100;
const money = (n) => `$${n.toFixed(2)}`;

const breakdown = document.createElement('dl');
breakdown.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:6px 16px;margin:0;font-size:.9rem';
for (const [label, value] of [['Subtotal', subtotal], ['Shipping', shipping], ['VAT (16%)', tax]]) {
  breakdown.insertAdjacentHTML('beforeend', `<dt>${label}</dt><dd style="margin:0;text-align:right">${money(value)}</dd>`);
}

const more = await slice.build('Details', {
  variant: 'ghost',
  size: 'sm',
  multiple: true,
  items: [
    {
      id: 'items', title: 'Items', badge: lines.length,
      // Built the first time someone opens it.
      content: () => slice.build('Table', {
        columns: [
          { key: 'item', label: 'Item' },
          { key: 'qty', label: 'Qty' },
          { key: 'price', label: 'Price', render: (row) => money(row.qty * row.price) }
        ],
        rows: lines
      })
    },
    { id: 'total', title: 'How the total is worked out', content: breakdown }
  ]
});

const total = document.createElement('div');
total.style.cssText = 'font-size:1.6rem;font-weight:700';
total.textContent = money(subtotal + shipping + tax);

const card = await slice.build('Card', {
  title: 'Order #1042',
  subtitle: 'Placed today · ships tomorrow',
  headerIcon: 'shopping-bag',
  badge: { label: 'Paid', tone: 'success' },
  content: [total, more],
  actions: [{ value: 'Track order', variant: 'filled' }, { value: 'Invoice', variant: 'ghost', icon: 'download' }]
});
card.style.maxWidth = '460px';
return card;
:::

:::script label="Settings, one section at a time" expected="a settings accordion that always keeps one section open; each section holds a Form built on first open; saving shows a toast and the section's badge"
const toasts = await slice.build('ToastProvider', { singleton: true });

const form = (schema, label) => async () => slice.build('Form', {
  variant: 'plain',
  columns: 2,
  submitText: 'Save',
  schema,
  onSubmit: () => {
    toasts.show(`${label} saved`, { type: 'success' });
    const items = settings.items.map((i) => (i.title === label ? { ...i, badge: { label: 'Saved', tone: 'success' } } : i));
    settings.items = items;
  }
});

const settings = await slice.build('Details', {
  collapsible: false,
  stateKey: 'docs-settings-demo',
  items: [
    { id: 'profile', title: 'Profile', subtitle: 'Name and contact', icon: 'user', content: form([
      { kind: 'field', name: 'name', label: 'Full name', component: 'Input', required: true, value: 'Ana Pérez' },
      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true, value: 'ana@example.com', props: { type: 'email' } }
    ], 'Profile') },
    { id: 'notifications', title: 'Notifications', subtitle: 'What we email you about', icon: 'bell', content: form([
      { kind: 'field', name: 'orders', label: 'Order updates', component: 'Switch', valueProp: 'checked', value: true },
      { kind: 'field', name: 'news', label: 'Newsletter', component: 'Switch', valueProp: 'checked', value: false }
    ], 'Notifications') },
    { id: 'security', title: 'Security', subtitle: 'Password and sessions', icon: 'shield-check', content: form([
      { kind: 'field', name: 'password', label: 'New password', component: 'Input', required: true, props: { type: 'password', minlength: 8 }, full: true }
    ], 'Security') },
    { id: 'billing', title: 'Billing', subtitle: 'Available on paid plans', icon: 'credit-card', disabled: true }
  ]
});
settings.style.cssText = 'width:100%;max-width:640px';
return settings;
:::

:::script label="Release notes" expected="versions as a ghost accordion with a plus marker; several can be open; Expand all and Collapse all work on every version"
const releases = [
  { id: '3.2', title: 'v3.2.0', subtitle: 'October 2026', badge: { label: 'Latest', tone: 'accent' }, open: true, notes: ['DatePicker, with ranges and presets', 'Card rebuilt: actions, selectable, loading', 'Details groups into an accordion'] },
  { id: '3.1', title: 'v3.1.0', subtitle: 'September 2026', notes: ['Tabs: four variants, lazy panels', 'Modal: drawer and sheet layouts'] },
  { id: '3.0', title: 'v3.0.0', subtitle: 'August 2026', badge: { label: 'Breaking', tone: 'danger' }, notes: ['Lucide icons replace the icon font', 'Themes moved to CSS variables'] }
];
const list = (notes) => {
  const ul = document.createElement('ul');
  ul.style.cssText = 'margin:0;padding-left:20px;line-height:1.8';
  for (const note of notes) ul.insertAdjacentHTML('beforeend', `<li>${note}</li>`);
  return ul;
};

const notes = await slice.build('Details', {
  variant: 'ghost',
  marker: 'plus',
  multiple: true,
  items: releases.map((r) => ({ ...r, content: list(r.notes) }))
});

const expand = await slice.build('Button', { value: 'Expand all', variant: 'ghost', size: 'sm', onClick: () => notes.showAll() });
const collapse = await slice.build('Button', { value: 'Collapse all', variant: 'ghost', size: 'sm', onClick: () => notes.hideAll() });
const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:4px;justify-content:flex-end';
bar.append(expand, collapse);

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:8px;width:100%;max-width:640px';
box.append(bar, notes);
return box;
:::

:::script label="Looks at a glance" expected="the four variants side by side, a small one with the plus marker, and a single section"
const items = [
  { id: 'a', title: 'First section', icon: 'star', text: 'Some text inside.', open: true },
  { id: 'b', title: 'Second section', badge: 2, text: 'More text.' },
  { id: 'c', title: 'Disabled', disabled: true }
];
const box = document.createElement('div');
box.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;width:100%';
for (const variant of ['outlined', 'separated', 'filled', 'ghost']) {
  box.appendChild(await slice.build('Details', { items, variant }));
}
box.appendChild(await slice.build('Details', { items, size: 'sm', marker: 'plus' }));
box.appendChild(await slice.build('Details', { title: 'A single section', subtitle: 'No items needed', text: 'Just a title and what it hides.' }));
return box;
:::

## Best Practices
:::tip
Write summaries people can scan: the question as they would ask it, or the name of the setting. The answer goes inside. A summary that only says "More" makes people open every section to find anything.
:::

:::tip
Make heavy sections functions. A Table, a chart or a request in a section nobody opens then costs nothing, and the page loads faster.
:::

:::tip
Use `multiple` when people compare sections (release notes, specs) and the default one-at-a-time when they look for one thing (a FAQ). One at a time keeps the page short. Several at once let people read side by side.
:::

## Pitfalls
:::warning
Do not hide errors in a closed section. When a form inside a section fails, open it (`show(id)`) and put a badge on it, so people know where to look.
:::

:::warning
Give every item a stable `id`. Open state, remembered state and kept content all go by it: an id that changes on every render rebuilds the section and closes it.
:::