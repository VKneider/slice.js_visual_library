---
title: Card
route: /docs/layout/card
navLabel: Card
section: Layout
group: Containers
order: 20
description: One thing, summed up. A product, a person, a file, a project or a metric, shown among others like it, that can lead to its detail. Image or icon, title, badge, content, actions, selectable and loading states.
component: CardDocumentation
generate: true
tags: [card, layout, grid, list, tile]
---

# Card

## Overview
A `Card` sums up **one thing**: a product, a person, a file, a project, a metric. Cards usually come in groups of the same kind, in a grid or a list, so people can scan and compare them. When the thing has more to it than fits, the card leads there: a link, a Modal, a page.

### When to use it
- A collection of items of the same kind: projects, listings, team members, reports.
- A summary that leads to the full record: a click on the card opens it.
- A choice between a few rich options: plans, delivery methods, templates (`selectable`).
- A dashboard tile: one metric with its context.

### When not to use it
- **A section of a page** (a settings group, a form) is not one thing among others like it. Use a plain container or a [Form](/docs/input/form) with sections.
- **Content that folds open** belongs in [Details](/docs/layout/details).
- **A message** that comes and goes is a [Toast](/docs/feedback/toast).
- **Rows people sort and filter** are a [Table](/docs/data/table). Cards are for scanning, tables for comparing values.
- **One card alone**, with nothing like it next to it, is usually a section in disguise.

## Anatomy
Every part is optional, and nothing is drawn unless you ask for it:
- **Media** at the top: `image`, or `icon` as a large mark. When an image fails to load, the icon takes its place, or there is no media.
- **Header**:
  - `headerIcon`, a small mark in a chip beside the title;
  - `title` and `subtitle`;
  - `badge` in the corner.
- **Body**: `text`, then `content`, which takes any nodes or components: a chart, a list, a progress bar, a Table.
- **Footer**: `actions`, always visible, so they work on phones and from the keyboard.

## Core Behavior

### Leading somewhere
- `href` turns the title into a link. `target: '_blank'` opens it in a new tab and adds `rel="noopener noreferrer"`.
- `onClick({ card, event })` turns the title into a button.
- Either way, the title's click area is stretched over the whole card, so a click anywhere opens it.
- For screen readers and the keyboard, the card is **one control** (its title) and each action is its own control. There are no buttons inside a button, and Tab goes title → actions.
- A card with neither `href` nor `onClick` is not a control at all: it is not focusable and does not lift on hover.
- With no `title`, give the card an `ariaLabel` so the link or button still has a name.

### Actions
- `actions` is a list of [Button](/docs/input/button) configs: `{ value, variant, icon, onClick, disabled }`. You can also pass nodes you built yourself.
- `onClick({ card, action })` runs the action. Clicking an action never opens the card.
- `actionsAlign` arranges the buttons: `'start'` (default), `'end'`, `'between'` or `'stretch'`.
- Buttons default to `variant: 'outlined'` and a size that follows the card's.

### Choosing
- `selectable: true` makes the card a toggle (`aria-pressed`). A click selects it or clears it.
- `onSelect(selected, { card })` and the `card-select` event report the change. `selected` sets it from code.
- To allow only one selected card (a plan, a shipping method), clear the others in `onSelect`. See the plan example below.

### States
- `disabled` greys the card out and switches off its link or button and its actions.
- `loading` shows a skeleton in place of the content and sets `aria-busy`. Use it for a card whose data is on the way, so the grid does not jump when it arrives.

### Badge
`badge` is a [Badge](/docs/display/badge):
- a text (`'New'`);
- a number (`12`, over 99 shows "99+");
- or a full config (`{ label: 'Blocked', variant: 'danger' }`).

It shows in the header's corner, with or without media.

### Memory
The card owns what it builds (icons, badge, buttons) and what you hand it in `content`. Replacing `content` or `actions` destroys the components that are gone, and destroying the card destroys all of them. Nodes you pass again keep their state.

## Looks
- `variant`:
  - `'outlined'` (default): a border;
  - `'elevated'`: a shadow, no border;
  - `'filled'`: a tinted surface;
  - `'ghost'`: neither, for cards inside a surface that already has one.

  `'default'` and `'minimal'`, the old names, still work as `'outlined'` and `'ghost'`.
- `size`: `'sm'`, `'md'` (default) or `'lg'` sets the padding, the title size and the icon size.
- `layout: 'horizontal'` puts the media beside the content, which suits lists. On narrow screens it stacks again.
- `mediaRatio` is the image's aspect ratio (`'16 / 9'` by default).
- `headingLevel` (default 3) sets the title's heading level, to fit the page's outline.
- `customColor: { accent, background, text, border }` retints one card. The CSS variables `--slice-card-accent`, `--slice-card-bg`, `--slice-card-text`, `--slice-card-border` and `--slice-card-radius` do the same from a stylesheet.

### Icons
`icon` and `headerIcon` take a name, or `{ name, size, color }`. The Slice marks (`sliceJs`, `slicePizza`, `sliceLogo`, `singleSlice`) carry their own viewBox, so they fill the chip instead of overflowing it.

## Live Preview
:::component name="Card"
{
  "title": "Website redesign",
  "subtitle": "Marketing · due Nov 14",
  "text": "New landing page, pricing and the docs home.",
  "headerIcon": "rocket",
  "badge": "In progress"
}
:::

## Examples
:::script label="Projects" expected="a grid of project cards with a progress bar; clicking a card opens its details in a Modal; Archive asks first, then removes the card and a toast confirms"
const toasts = await slice.build('ToastProvider', { singleton: true });
const projects = [
  { id: 'web', name: 'Website redesign', team: 'Marketing', due: 'Nov 14', done: 68, status: 'On track', icon: 'rocket' },
  { id: 'app', name: 'Mobile app 2.0', team: 'Product', due: 'Dec 2', done: 35, status: 'At risk', icon: 'mobile-phone' },
  { id: 'api', name: 'Public API', team: 'Platform', due: 'Oct 30', done: 92, status: 'On track', icon: 'code' },
  { id: 'hr', name: 'Onboarding guide', team: 'People', due: 'Jan 10', done: 10, status: 'Blocked', icon: 'users' }
];
const tone = { 'On track': 'success', 'At risk': 'warning', 'Blocked': 'danger' };

const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;width:100%';

const progress = (done) => {
  const box = document.createElement('div');
  box.style.cssText = 'display:grid;gap:6px;font-size:.8rem;opacity:.85';
  box.innerHTML = `<div style="display:flex;justify-content:space-between"><span>Progress</span><strong>${done}%</strong></div>
    <div style="height:6px;border-radius:3px;background:color-mix(in srgb,currentColor 14%,transparent)">
      <div style="height:100%;width:${done}%;border-radius:3px;background:var(--primary-color)"></div></div>`;
  return box;
};

async function openDetails(project) {
  const modal = await slice.build('Modal', {
    title: project.name,
    description: `${project.team} · due ${project.due}`,
    icon: project.icon,
    destroyOnClose: true,
    content: [progress(project.done), `Status: ${project.status}.`],
    actions: [{ value: 'Close', variant: 'ghost' }]
  });
  document.body.appendChild(modal);
  await modal.show();
}

async function cardFor(project) {
  const card = await slice.build('Card', {
    title: project.name,
    subtitle: `${project.team} · due ${project.due}`,
    headerIcon: project.icon,
    badge: { label: project.status, variant: tone[project.status] },
    content: progress(project.done),
    onClick: () => openDetails(project),
    actions: [{
      value: 'Archive', variant: 'ghost', icon: 'archive',
      onClick: async ({ card }) => {
        const ask = await slice.build('Modal', {
          title: `Archive “${project.name}”?`,
          tone: 'warning',
          size: 'sm',
          destroyOnClose: true,
          content: 'It leaves the board. You can restore it from the archive later.',
          actions: [{ value: 'Cancel', variant: 'ghost' }, { value: 'Archive' }]
        });
        document.body.appendChild(ask);
        if ((await ask.show()).returnValue !== 'Archive') return;
        // Destroying the card destroys what it built: icons, badge, buttons.
        slice.controller.destroyComponent(card);
        card.remove();
        toasts.show(`Archived “${project.name}”`, { type: 'success' });
      }
    }]
  });
  return card;
}

for (const project of projects) grid.appendChild(await cardFor(project));
return grid;
:::

:::script label="Pick a plan" expected="three selectable plan cards where only one can be chosen; the chosen plan shows a check; Continue is enabled once a plan is picked and confirms with a toast"
const toasts = await slice.build('ToastProvider', { singleton: true });
const plans = [
  { id: 'free', name: 'Free', price: '$0', features: ['1 project', 'Community support'] },
  { id: 'pro', name: 'Pro', price: '$12 / month', features: ['Unlimited projects', 'Email support', 'Custom domain'], badge: 'Popular' },
  { id: 'team', name: 'Team', price: '$29 / month', features: ['Everything in Pro', 'Shared workspaces', 'SSO'] }
];
let chosen = null;

const list = (items) => {
  const ul = document.createElement('ul');
  ul.style.cssText = 'margin:0;padding-left:18px;line-height:1.8;font-size:.9rem';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  }
  return ul;
};

const row = document.createElement('div');
row.setAttribute('role', 'group');
row.setAttribute('aria-label', 'Plans');
row.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;width:100%';

const cards = [];
for (const plan of plans) {
  const card = await slice.build('Card', {
    title: plan.name,
    subtitle: plan.price,
    badge: plan.badge || null,
    content: list(plan.features),
    selectable: true,
    // Only one plan at a time: picking one clears the others.
    onSelect: (selected) => {
      chosen = selected ? plan : null;
      if (selected) for (const other of cards) if (other !== card) other.selected = false;
      next.disabled = !chosen;
    }
  });
  cards.push(card);
  row.appendChild(card);
}

const next = await slice.build('Button', {
  value: 'Continue',
  disabled: true,
  onClick: () => toasts.show(`${chosen.name} plan selected`, { type: 'success' })
});

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:16px;justify-items:end;width:100%';
box.append(row, next);
return box;
:::

:::script label="Stays: grid or list" expected="listing cards with images; a segmented switch turns the grid into a horizontal list; the heart saves a stay and the badge counts saved stays"
const scene = (from, to, hill) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/><circle cx="250" cy="50" r="22" fill="#fff8" /><path d="M0 180 L0 ${hill} Q80 ${hill - 50} 160 ${hill} T320 ${hill - 10} L320 180Z" fill="#0003"/><path d="M0 180 L0 ${hill + 30} Q120 ${hill - 10} 220 ${hill + 25} T320 ${hill + 20} L320 180Z" fill="#0004"/></svg>`);

const stays = [
  { name: 'Mountain cabin', place: 'Mérida, Venezuela', price: '$84 / night', text: 'Wood stove, a view of the valley and a trail from the door.', image: scene('#7dd3fc', '#a78bfa', 120) },
  { name: 'Beach house', place: 'Los Roques', price: '$140 / night', text: 'Steps from the sand, with a hammock and kayaks.', image: scene('#fde68a', '#38bdf8', 140) },
  { name: 'City loft', place: 'Caracas', price: '$62 / night', text: 'Bright, quiet, and ten minutes from the metro.', image: scene('#fca5a5', '#6366f1', 110) }
];
const saved = new Set();

const counter = await slice.build('Badge', { variant: 'accent', value: 0 });
const container = document.createElement('div');

const cards = [];
for (const stay of stays) {
  const card = await slice.build('Card', {
    title: stay.name,
    subtitle: `${stay.place} · ${stay.price}`,
    text: stay.text,
    image: stay.image,
    imageAlt: `Photo of the ${stay.name.toLowerCase()}`,
    href: '#stays',
    actions: [heartFor(stay)]
  });
  cards.push(card);
  container.appendChild(card);
}

function heartFor(stay) {
  return {
    value: 'Save', variant: 'ghost', icon: 'heart',
    onClick: ({ card }) => {
      const on = !saved.has(stay.name);
      on ? saved.add(stay.name) : saved.delete(stay.name);
      counter.value = saved.size;
      card.actions = [{ ...heartFor(stay), value: on ? 'Saved' : 'Save', variant: on ? 'soft' : 'ghost' }];
    }
  };
}

function show(view) {
  const list = view === 'list';
  container.style.cssText = list
    ? 'display:grid;gap:12px'
    : 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px';
  for (const card of cards) card.layout = list ? 'horizontal' : 'vertical';
}
show('grid');

const switcher = await slice.build('Tabs', {
  variant: 'segmented', size: 'sm', ariaLabel: 'View',
  items: [{ id: 'grid', label: 'Grid', icon: 'grid' }, { id: 'list', label: 'List', icon: 'list' }],
  onChange: (id) => show(id)
});

const bar = document.createElement('div');
bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';
const label = document.createElement('span');
label.style.cssText = 'display:flex;align-items:center;gap:8px';
label.append('Saved', counter);
bar.append(switcher, label);

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:16px;width:100%';
box.append(bar, container);
return box;
:::

:::script label="A dashboard that loads" expected="four metric cards show a skeleton, then fill in with the value and a coloured change; Refresh loads them again"
const metrics = [
  { name: 'Revenue', icon: 'chart-mixed-dollar', unit: '$' },
  { name: 'Active users', icon: 'users' },
  { name: 'Error rate', icon: 'bug', unit: '%', lowerIsBetter: true },
  { name: 'Response time', icon: 'clock', unit: 'ms', lowerIsBetter: true }
];

const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;width:100%';

const cards = [];
for (const metric of metrics) {
  const card = await slice.build('Card', { title: metric.name, headerIcon: metric.icon, size: 'sm', loading: true });
  cards.push(card);
  grid.appendChild(card);
}

const value = (text) => {
  const el = document.createElement('div');
  el.style.cssText = 'font-size:1.6rem;font-weight:700;letter-spacing:-.01em';
  el.textContent = text;
  return el;
};

async function load() {
  for (const card of cards) card.loading = true;
  // A pretend request per card: they arrive one by one, and the grid never jumps.
  await Promise.all(cards.map(async (card, i) => {
    await new Promise((r) => setTimeout(r, 500 + i * 350));
    const metric = metrics[i];
    const raw = Math.round(Math.random() * 900 + 100);
    const change = Math.round((Math.random() * 30 - 15) * 10) / 10;
    const good = metric.lowerIsBetter ? change < 0 : change > 0;
    const shown = metric.unit === '$' ? `$${raw}k` : metric.unit === '%' ? `${(raw / 400).toFixed(2)}%` : metric.unit ? `${raw} ${metric.unit}` : raw.toLocaleString();
    card.content = value(shown);
    card.badge = { label: `${change > 0 ? '+' : ''}${change}%`, variant: good ? 'success' : 'danger' };
    card.subtitle = 'vs. last week';
    card.loading = false;
  }));
}
load();

const refresh = await slice.build('Button', { value: 'Refresh', icon: 'refresh', variant: 'outlined', size: 'sm', onClick: () => load() });
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;justify-items:start;width:100%';
box.append(refresh, grid);
return box;
:::

:::script label="Looks at a glance" expected="the four variants, the three sizes, a card with an icon banner, a disabled card and one with a custom colour"
const box = document.createElement('div');
box.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;width:100%';
for (const variant of ['outlined', 'elevated', 'filled', 'ghost']) {
  box.appendChild(await slice.build('Card', { title: variant, text: `variant: '${variant}'`, variant, headerIcon: 'star' }));
}
for (const size of ['sm', 'md', 'lg']) {
  box.appendChild(await slice.build('Card', { title: `Size ${size}`, text: 'Padding, title and icon scale together.', size, headerIcon: 'bell', badge: 3 }));
}
box.appendChild(await slice.build('Card', { title: 'Icon banner', text: 'A large mark above the content.', icon: 'cloud-arrow-up', badge: 'New' }));
box.appendChild(await slice.build('Card', { title: 'Disabled', text: 'Nothing here can be clicked.', disabled: true, onClick: () => {}, actions: [{ value: 'Retry' }] }));
box.appendChild(await slice.build('Card', { title: 'Custom colour', text: 'customColor retints one card.', customColor: { background: '#0f172a', text: '#f8fafc', accent: '#38bdf8' }, headerIcon: 'moon' }));
return box;
:::

## Best Practices
:::tip
Keep the cards in a group the same shape: the same parts, in the same order, with text of similar length. People compare cards by looking at the same spot on each one.
:::

:::tip
Put the action people take most often on the card itself (`onClick` or `href`) and the rest in `actions`. A card with five buttons is a form in disguise.
:::

:::tip
Use `loading` while the data is on the way instead of building the cards afterwards. The grid keeps its shape, and nothing jumps under the pointer.
:::

## Pitfalls
:::warning
Do not put links or buttons in `text`. Put controls in `content` or `actions`: they sit above the card's click area, so they keep working on their own.
:::

:::warning
Give images an `imageAlt` that says what is in the picture, or leave it empty when the picture only decorates. Repeating the title in it makes screen readers say the name twice.
:::

:::warning
`details`, `open` and the fold-out chevron are gone. A card that has to unfold something holds a [Details](/docs/layout/details) in `content`.
:::