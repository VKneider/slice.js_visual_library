---
title: DataList
route: /docs/data/datalist
navLabel: DataList
section: Data
group: Tables
order: 12
description: The list of records an app works with — people, orders, tasks, files. Rows or cards with avatars, details, status and actions; search, views, filters, sort and groups; selection with bulk actions; create, edit and delete with undo and rollback; pages, load more or infinite scrolling; local data, a slice.context store or a server.
component: DataListDocumentation
generate: true
tags: [datalist, list, crud, records, actions, selection, infinite, pagination, context]
---

# DataList

## Overview
`DataList` shows the records an app works with: the people in a team, the orders of a shop, the tasks of a project, the files of a folder. Each record is a row (or a card) with a title, its details, a status and its actions, and the list adds what an app always needs around them:

- **finding things**: search, quick views ("Open 12 · Mine 5"), filters, sort and groups;
- **acting on things**: buttons and a ⋯ menu per item, selection, and actions on many items at once;
- **changing things**: `addItem`, `updateItem` and `removeItem`, shown at once and taken back if the server says no, with Undo for removals;
- **a lot of things**: pages, "Load more" or infinite scrolling, from memory or from a server.

### When to use it
- **Records people scan and act on**: a member list, an inbox, orders, tickets, files.
- **Phones and narrow panels.** A row carries a title, two lines of details and a status, so nothing scrolls sideways. On a narrow list the row buttons move into the ⋯ menu by themselves.
- **CRUD screens**: a list with "New", edit and delete.

### When not to use it
- **Records people compare column by column**, such as prices, dates and amounts side by side, or that they sort by any column. Use [Table](/docs/data/table).
- **A tree** (folders inside folders): use [TreeView](/docs/navigation/treeview).
- **A short, fixed list of links or options**: a [SideMenu](/docs/navigation/side-menu) or a [Select](/docs/input/select).

## Coming from React or Vue
DataList is plain Slice: you build it with props, it calls you back with functions, and it destroys what it builds. The ideas map one to one:

| You would write… | In Slice |
| --- | --- |
| `const [items, setItems] = useState([])` / `ref([])` | `items: [...]` and set `list.items` again, or a store: `slice.context.create('tasks', { items: [] })` |
| `<List items={items} renderItem={…} />` | `slice.build('DataList', { items, title: 'name', … })` or `renderItem: (item) => node` |
| `onClick={() => edit(item)}` | `actions: [{ label: 'Edit', onClick: ({ item }) => edit(item) }]` |
| `useQuery` / a `fetch` in `useEffect` | `load: async ({ page, search, signal }) => …` |
| optimistic updates with rollback | `list.updateItem(id, changes, { commit: () => api.save(…) })` |
| a store several components read (Pinia, Redux) | `context: 'tasks'`: the list follows `slice.context`, and its changes go back to it |
| unmount cleanup | automatic: destroying the list destroys every component it built |

## Step by step

### 1. Your first list
Give it `items` and say what each item shows. Every part takes a **key** (`'name'`), a **path** (`'owner.name'`) or a **function** (`(item) => …`):

```js
const team = await slice.build('DataList', {
  items: people,
  title: 'name',
  description: 'email',
  avatar: { src: 'photo', name: 'name' },   // Avatar props, read from the item
  meta: [{ value: 'city', icon: 'map-pin' }, { value: 'role' }],
  badge: (p) => ({ label: p.active ? 'Active' : 'Away', tone: p.active ? 'success' : 'neutral' }),
});
```

The parts an item can have:

| Part | What it is |
| --- | --- |
| `title` | The main line (`'title'` by default). |
| `description` | A quieter line under it. |
| `avatar` / `icon` / `image` | What is on the left: an [Avatar](/docs/display/avatar) (`{ src, name, status }`), an icon name, or a picture. |
| `meta` | Small facts with icons: `[{ value: 'city', icon: 'map-pin' }]`. `format(value, item)` changes how one reads. |
| `tags` | An array of words or [Chip](/docs/display/chip) props. |
| `badge` | A status on the right ([Badge](/docs/display/badge) props, a word or a number). |
| `value` | A figure on the right, such as an amount. |
| `timestamp` | A date, shown as "3 hours ago", with the full date on hover. |
| `renderItem(item)` | Draw the middle part yourself; the avatar, status and actions still go around it. |

### 2. Opening an item
- `path: (item) => '/orders/' + item.id` makes the title a real link that goes through `slice.router`. The whole row is the link's hit area, and Ctrl/⌘-click opens a new tab.
- `href` does the same for addresses outside the app.
- `onItemClick(item, { event, list })` does anything else, such as opening a [Modal](/docs/feedback/modal).

### 3. Finding things
```js
searchable: true,                                   // a search box
sortOptions: [{ key: 'createdAt', label: 'Newest', direction: 'desc' }, { key: 'name', label: 'Name' }],
views: [{ label: 'All' }, { label: 'Open', filter: (o) => o.status === 'open' }],
filters: [{ key: 'city', label: 'City' }],          // options come from the data
groupBy: { key: 'createdAt', by: 'day' },           // Today, Yesterday, This week…
```

- **Search** ignores case and accents ("jose" finds "José"), and every word must match. It looks at the title, description, meta and tags, or at `searchFields`.
- **Views** are quick filters with counts. Each has a `filter(item)`, or none for "All".
- **Filters** are menus: "City: Caracas ▾". Their options come from the data (with counts), or from `options`. `type: 'boolean'` gives Any / Yes / No, `multiple: false` allows one value, and `match(item, values)` decides for you.
- **Sort** is a menu of `sortOptions`. Each option has a `key` (or a path in `value`), a starting `direction`, or `compare(a, b)` of its own.
- **Groups**: `groupBy` takes a key, `{ key, by: 'letter' }` (A, B, C…) or `{ key, by: 'day' }`. Headings stay on top while scrolling. `collapsibleGroups` lets people fold them, and `groupLabel(key, items)` and `groupOrder` change the heading texts and their order.
- When nothing matches, the list says so and offers to clear the search and filters.

### 4. Actions and selection
```js
actions: [
  { label: 'Edit', icon: 'edit', inline: true, onClick: ({ item }) => openEditor(item) },
  { label: 'Archive', icon: 'archive', hidden: (o) => o.archived, onClick: … },
  'separator',
  { label: 'Delete', icon: 'trash-bin', danger: true, confirm: 'Delete this order?', onClick: … },
],
selection: 'multiple',
bulkActions: [{ label: 'Archive', icon: 'archive', onClick: ({ items }) => … }],
```

- `inline: true` puts an action on the row as a button. The rest go in the ⋯ menu, and on a narrow list (under 520px) all of them do.
- `hidden` and `disabled` take `true` or a function of the item. `actions` itself can be a function of the item.
- `confirm` asks first, in a Modal: `true`, a question, or `{ title, text, confirmLabel }`.
- Every `onClick` receives `{ item, items, keys, list, event }`.
- `selection: 'multiple'` adds a checkbox per row and a "Select all" bar. Shift+click selects a range, and "Select all" takes every item that passes the search and filters. When something is selected, the bar shows the `bulkActions`, which receive the selected `items`. A bulk action clears the selection afterwards, unless it has `keepSelection: true`.
- A click on a row that opens nothing selects it. **Space** selects the focused row.
- The selection is kept **by key** (`itemKey`, `'id'` by default), so it survives new data. `selected` sets it, `getSelectedItems()` reads it, and `onSelectionChange(keys, items)` reports it.

### 5. Create, edit and delete
Three methods, the same three a store would have:

```js
await list.addItem(newTask, { commit: () => api.create(newTask) });
await list.updateItem(task.id, { done: true }, { commit: (after) => api.save(after) });
await list.removeItem(task.id, { undo: true, commit: ([task]) => api.delete(task.id) });
```

- **The change shows at once.** With `commit`, the item is marked busy (a line moves under it, its actions wait) until the promise settles.
- **If `commit` fails, the change is taken back**: the new item leaves, the edited one goes back as it was, and the removed ones return to their places. A bar says "The change could not be saved", and `onError(error, { type, item })` reports it.
- **`addItem`**: `position: 'start'` (default), `'end'` or an index. The new row is scrolled into view and flashes. If `commit` returns an object (the server's version, with its real id and dates), it is merged into the item.
- **`updateItem`**: `changes` is an object to merge, or a function from the item to one. Only that row is redrawn.
- **`removeItem`**: one key or an array. With `undo: true`, a bar says "“Buy milk” removed · Undo" for five seconds, and `commit` runs only when that time is over, or the bar is closed. Undo brings the items back and nothing reaches the server. Without `undo`, `commit` runs right away.
- `createAction: { label, icon, onClick }` adds a "New" button to the toolbar.

> Why `addItem` and not `add`? Slice calls a component's `update()` when a cached route comes back, so the list keeps that name for the framework, and uses `addItem`, `updateItem` and `removeItem` for your data.

### 6. Sharing the data: `slice.context`
With `context: 'tasks'`, the items live in a `slice.context` store (the framework's shared state) instead of the list:

```js
slice.context.create('tasks', { items: await api.tasks() });

const list = await slice.build('DataList', { context: 'tasks', title: 'title' });
const counter = await slice.build('Badge', {});
slice.context.watch('tasks', counter, (items) => { counter.value = items.filter((t) => !t.done).length; }, (s) => s.items);
```

- The list redraws whenever the store changes, whoever changed it.
- `addItem`, `updateItem` and `removeItem` write to the store, so the counter above follows the list without any wiring.
- `contextPath` is where the array sits in the state (`'items'` by default; a state that is an array is used as it is).

### 7. Lots of items
`pagination` decides how many show at a time (`pageSize`, 20 by default):

- `{ pageSize: 20 }` (or `true`): pages, with a [Pagination](/docs/data/pagination) control and "21–40 of 342".
- `'load-more'`: a "Load more" button under the list.
- `'infinite'`: the next slice loads as the end comes into view, through [InfiniteScrollService](/docs/services/infinite-scroll). Give the list a `maxHeight` to scroll inside it, or it follows the page.

### 8. Data from a server
Give `load` instead of `items`. It is called with the query, and returns the items of that page:

```js
load: async ({ page, pageSize, search, filters, sort, view, signal }) => {
  const res = await fetch(`/api/orders?page=${page}&size=${pageSize}&q=${encodeURIComponent(search)}`, { signal });
  return res.json();       // { items: [...], total: 342 }  (or just an array)
},
```

- It is called again when the search, a view, a filter, the sort or the page changes. The request in flight is aborted (`signal`), and a late answer is dropped.
- While it loads, the list shows placeholders (the first time) or dims the rows. If it fails, the list says so, with a **Try again** button.
- With `pagination: 'load-more'` or `'infinite'`, pages are added to the ones already shown. Return `done: true`, or fewer items than `pageSize`, at the end.
- `filters` arrive as `[{ key, values }]`, `sort` as `{ key, direction }` and `view` as the view's id.
- Filter options cannot come from the data here: give them `options`. View counts appear when a view has a `count`.
- `refresh()` loads the current page again. `onQueryChange(query)` reports every change, for example to put it in the URL.

## Looks
- `layout`: `'list'` (default) or `'grid'`, cards in columns at least `minItemWidth` wide (260px).
- `variant`:
  - `'outlined'` (default): one box with lines between the rows;
  - `'separated'`: one card per row;
  - `'filled'`: tinted rows;
  - `'ghost'`: lines only.
- `density`: `'compact'`, `'comfortable'` (default) or `'spacious'`.
- `maxHeight` makes the list scroll inside itself, with group headings that stay on top.
- `loading` shows placeholders (or dims the rows) for data you load yourself. `error` shows a message.
- `emptyState: { icon, title, description, action: { label, onClick } }` is what shows when there is nothing yet.

## Remembering the view
`stateKey: 'orders'` remembers the search, the view, the filters and the sort in this browser, and puts them back the next time the list is built. `clearSavedState()` forgets them.

## Language
`texts` replaces every word: `search`, `create`, `sortBy`, `selectAll`, `selected` (`{count}`), `loadMore`, `loading`, `error`, `retry`, `empty`, `noResults`, `clearFilters`, `removed` (`{count}`), `removedOne` (`{title}`), `undo`, `saveError`, `confirm`, `cancel`, the day groups (`day_today`, `day_yesterday`, `day_week`, `day_month`, `day_older`) and the rest listed in `DataList.js`. Relative times use the page's language (`<html lang>`).

## Methods and events
- `addItem(item, options)`, `updateItem(key, changes, options)`, `removeItem(keys, options)`.
- `refresh()`, `clearQuery()`, `focusItem(key)`.
- `select(keys)`, `clearSelection()`, `getSelectedItems()`.
- `getItems()`, `getVisibleItems()`, `getItem(key)`, `query`, `page`, `totalItems`.
- Callbacks: `onItemClick`, `onSelectionChange`, `onQueryChange` and `onError`. The `selection-change` event also reports the selection.

## Live Preview
:::component name="DataList"
{
  "items": [
    { "id": 1, "title": "Website redesign", "description": "Marketing · due Nov 14" },
    { "id": 2, "title": "Mobile app 2.0", "description": "Product · due Dec 2" },
    { "id": 3, "title": "Public API", "description": "Platform · due Oct 30" }
  ],
  "icon": "folder",
  "searchable": true
}
:::

## Examples
:::script label="Team directory" expected="a searchable list of people: avatar with status, name, email, city and role with icons, and an Active/Away badge; a City filter and a sort menu; clicking a person opens their card in a Modal"
const people = [
  { id: 1, name: 'José Pérez', email: 'jose@example.com', city: 'Maracaibo', role: 'Engineering', active: true },
  { id: 2, name: 'Ana López', email: 'ana@example.com', city: 'Caracas', role: 'Design', active: true },
  { id: 3, name: 'Lucas Molina', email: 'lucas@example.com', city: 'Valencia', role: 'Security', active: false },
  { id: 4, name: 'María Ruiz', email: 'maria@example.com', city: 'Caracas', role: 'Sales', active: true },
  { id: 5, name: 'Andrés Bello', email: 'andres@example.com', city: 'Mérida', role: 'Support', active: false },
  { id: 6, name: 'Sofía Rey', email: 'sofia@example.com', city: 'Maracaibo', role: 'Engineering', active: true }
];

const team = await slice.build('DataList', {
  items: people,
  title: 'name',
  description: 'email',
  avatar: (p) => ({ name: p.name, status: p.active ? 'online' : 'offline' }),
  meta: [{ value: 'city', icon: 'map-pin' }, { value: 'role', icon: 'briefcase' }],
  badge: (p) => ({ label: p.active ? 'Active' : 'Away', tone: p.active ? 'success' : 'neutral' }),
  searchable: true,
  filters: [{ key: 'city', label: 'City' }],
  sortOptions: [{ key: 'name', label: 'Name' }, { key: 'city', label: 'City' }],
  onItemClick: async (person) => {
    const avatar = await slice.build('Avatar', { name: person.name, size: 'xl', status: person.active ? 'online' : 'offline' });
    const modal = await slice.build('Modal', {
      title: person.name, description: `${person.role} · ${person.city}`, size: 'sm', destroyOnClose: true,
      content: [avatar, person.email], actions: [{ value: 'Close', variant: 'ghost' }]
    });
    document.body.append(modal);
    await modal.show();
  }
});
team.style.width = '100%';
return team;
:::

:::script label="Inbox: groups by day, selection and undo" expected="messages grouped Today / Yesterday / This week, unread ones with a dot badge; each row has Archive on it and a menu with Mark as read and Delete; selecting several shows Mark read and Archive for all; Archive removes the row with an Undo bar"
const hour = 3600 * 1000;
const now = Date.now();
const messages = [
  { id: 1, from: 'Ana López', subject: 'Release notes for 3.4', preview: 'I wrote the draft, can you check the API part?', at: now - 0.5 * hour, unread: true },
  { id: 2, from: 'GitHub', subject: '[slice.js] New issue #412', preview: 'Router: params with dots are not parsed', at: now - 3 * hour, unread: true },
  { id: 3, from: 'Lucas Molina', subject: 'Handbook update', preview: 'The new onboarding page is live.', at: now - 26 * hour, unread: false },
  { id: 4, from: 'María Ruiz', subject: 'Demo on Friday', preview: 'The client wants to see the dashboard.', at: now - 30 * hour, unread: true },
  { id: 5, from: 'Billing', subject: 'Invoice October', preview: 'Your invoice is ready.', at: now - 4 * 24 * hour, unread: false }
];

const inbox = await slice.build('DataList', {
  items: messages,
  title: 'subject',
  description: 'preview',
  avatar: (m) => ({ name: m.from }),
  meta: [{ value: 'from' }],
  badge: (m) => (m.unread ? { dot: true, label: 'Unread', tone: 'accent' } : null),
  timestamp: 'at',
  groupBy: { key: 'at', by: 'day' },
  selection: 'multiple',
  maxHeight: '420px',
  actions: [
    { label: 'Archive', icon: 'archive', inline: true, iconOnly: true,
      onClick: ({ item, list }) => list.removeItem(item.id, { undo: true }) },
    { label: 'Mark as read', icon: 'envelope-open', hidden: (m) => !m.unread,
      onClick: ({ item, list }) => list.updateItem(item.id, { unread: false }) },
    'separator',
    { label: 'Delete', icon: 'trash-bin', danger: true, confirm: { title: 'Delete this message?', text: 'It cannot be recovered.' },
      onClick: ({ item, list }) => list.removeItem(item.id) }
  ],
  bulkActions: [
    { label: 'Mark read', icon: 'envelope-open', onClick: ({ items, list }) => items.forEach((m) => list.updateItem(m.id, { unread: false })) },
    { label: 'Archive', icon: 'archive', onClick: ({ keys, list }) => list.removeItem(keys, { undo: true }) }
  ]
});
inbox.style.width = '100%';
return inbox;
:::

:::script label="Tasks: a CRUD on slice.context" expected="a task list with views All / To do / Done and their counts, and a 'New task' button; a badge above the list counts the open tasks from the same store; New opens a Modal and adds the task at the top; Edit changes it; Done toggles it; Delete asks first; about one save in four fails on purpose and the change is taken back with a message"
if (!slice.context.has('docs-tasks')) {
  slice.context.create('docs-tasks', { items: [
    { id: 't1', title: 'Write the release notes', owner: 'Ana López', done: false, tags: ['docs'] },
    { id: 't2', title: 'Fix the router params bug', owner: 'José Pérez', done: false, tags: ['bug', 'router'] },
    { id: 't3', title: 'Record the demo video', owner: 'María Ruiz', done: true, tags: ['marketing'] }
  ] });
}

// A pretend API that fails now and then, to show the rollback.
const api = {
  save: (task) => new Promise((resolve, reject) => setTimeout(() => (Math.random() < 0.25 ? reject(new Error('Network error')) : resolve(task)), 600))
};

async function editor(task = {}) {
  const title = await slice.build('Input', { label: 'Title', value: task.title ?? '' });
  const owner = await slice.build('Input', { label: 'Owner', value: task.owner ?? '' });
  const fields = document.createElement('div');
  fields.style.cssText = 'display:grid;gap:12px';
  fields.append(title, owner);
  const modal = await slice.build('Modal', {
    title: task.id ? 'Edit task' : 'New task', size: 'sm', destroyOnClose: true, content: fields,
    actions: [{ value: 'Cancel', variant: 'ghost' }, { value: 'Save', close: 'save' }]
  });
  document.body.append(modal);
  const { returnValue } = await modal.show();
  if (returnValue !== 'save' || !title.value.trim()) return null;
  return { title: title.value.trim(), owner: owner.value.trim() };
}

const tasks = await slice.build('DataList', {
  context: 'docs-tasks',
  title: 'title',
  avatar: (t) => (t.owner ? { name: t.owner } : null),
  description: (t) => t.owner || 'Unassigned',
  tags: 'tags',
  badge: (t) => (t.done ? { label: 'Done', tone: 'success' } : { label: 'To do', tone: 'warning' }),
  views: [{ id: 'all', label: 'All' }, { id: 'todo', label: 'To do', filter: (t) => !t.done }, { id: 'done', label: 'Done', filter: (t) => t.done }],
  searchable: true,
  createAction: {
    label: 'New task',
    onClick: async ({ list }) => {
      const values = await editor();
      if (values) list.addItem({ id: `t${Date.now()}`, done: false, tags: [], ...values }, { commit: () => api.save(values) });
    }
  },
  actions: [
    { label: 'Done', icon: 'check', inline: true, hidden: (t) => t.done,
      onClick: ({ item, list }) => list.updateItem(item.id, { done: true }, { commit: (after) => api.save(after) }) },
    { label: 'Edit', icon: 'edit',
      onClick: async ({ item, list }) => {
        const values = await editor(item);
        if (values) list.updateItem(item.id, values, { commit: (after) => api.save(after) });
      } },
    { label: 'Reopen', icon: 'refresh', hidden: (t) => !t.done, onClick: ({ item, list }) => list.updateItem(item.id, { done: false }) },
    'separator',
    { label: 'Delete', icon: 'trash-bin', danger: true, confirm: 'Delete this task?',
      onClick: ({ item, list }) => list.removeItem(item.id, { undo: true, commit: () => api.save(item) }) }
  ],
  emptyState: { icon: 'check', title: 'No tasks', description: 'Add the first one with New task.' }
});

// Another component reading the same store: no wiring with the list.
const open = await slice.build('Badge', { tone: 'warning', value: 0 });
slice.context.watch('docs-tasks', open, (count) => { open.value = count; }, (s) => s.items.filter((t) => !t.done).length);
open.value = slice.context.getState('docs-tasks').items.filter((t) => !t.done).length;

const header = document.createElement('div');
header.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:600';
header.append('Open tasks', open);

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;width:100%';
box.append(header, tasks);
return box;
:::

:::script label="Orders from a server" expected="orders loaded page by page from a pretend server (a short wait each time, with placeholders the first time); search, a Status filter, sort by date or total, and a pager with '1–10 of 64'; the 'Fail next request' switch makes the next load fail and shows Try again"
const statuses = ['Paid', 'Shipped', 'Refunded', 'Pending'];
const db = Array.from({ length: 64 }, (_, i) => ({
  id: 5000 + i,
  customer: ['Ana López', 'José Pérez', 'María Ruiz', 'Lucas Molina', 'Sofía Rey'][i % 5],
  total: Math.round((20 + ((i * 37) % 480)) * 100) / 100,
  status: statuses[i % 4],
  date: new Date(Date.now() - i * 7 * 3600 * 1000).toISOString()
}));
let failNext = false;

// The "server": filters, sorts and pages, like a real API would.
async function server({ page, pageSize, search, filters, sort, signal }) {
  await new Promise((r) => setTimeout(r, 500));
  if (signal.aborted) throw new DOMException('aborted', 'AbortError');
  if (failNext) { failNext = false; throw new Error('503 Service Unavailable'); }
  let rows = db.filter((o) => !search || `${o.id} ${o.customer}`.toLowerCase().includes(search.toLowerCase()));
  for (const f of filters) rows = rows.filter((o) => f.values.includes(o[f.key]));
  if (sort) rows = [...rows].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * (sort.direction === 'desc' ? -1 : 1));
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const tone = { Paid: 'success', Shipped: 'info', Refunded: 'danger', Pending: 'warning' };

const orders = await slice.build('DataList', {
  load: server,
  title: (o) => `Order #${o.id}`,
  description: 'customer',
  icon: 'receipt',
  value: (o) => money.format(o.total),
  badge: (o) => ({ label: o.status, tone: tone[o.status] }),
  timestamp: 'date',
  searchable: true,
  filters: [{ key: 'status', label: 'Status', options: statuses }],
  sortOptions: [{ key: 'date', label: 'Date', direction: 'desc' }, { key: 'total', label: 'Total', direction: 'desc' }],
  sort: { key: 'date', direction: 'desc' },
  pagination: { pageSize: 10 },
  variant: 'separated'
});

const fail = await slice.build('Switch', { label: 'Fail next request', onChange: (on) => { failNext = on; } });
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;width:100%';
box.append(fail, orders);
return box;
:::

:::script label="Activity feed with infinite scrolling" expected="a box of activity entries that loads 15 more each time its end comes near, with 'Loading…' while it does, until 'That is everything.'"
const verbs = ['commented on', 'closed', 'opened', 'merged', 'reviewed'];
const people = ['Ana', 'José', 'María', 'Luis', 'Sofía'];
const feed = await slice.build('DataList', {
  load: async ({ page, pageSize }) => {
    await new Promise((r) => setTimeout(r, 400));
    const from = (page - 1) * pageSize;
    const items = Array.from({ length: Math.max(0, Math.min(pageSize, 70 - from)) }, (_, i) => {
      const n = from + i;
      return { id: n, who: people[n % 5], text: `${people[n % 5]} ${verbs[n % 5]} issue #${900 - n}`, at: Date.now() - n * 47 * 60 * 1000 };
    });
    return { items, total: 70 };
  },
  title: 'text',
  avatar: (a) => ({ name: a.who, size: 'sm' }),
  timestamp: 'at',
  pagination: 'infinite',
  pageSize: 15,
  maxHeight: '360px',
  variant: 'ghost',
  density: 'compact'
});
feed.style.width = '100%';
return feed;
:::

:::script label="Files as cards" expected="a grid of file cards with an icon, the name, its size and date, and a menu with Rename and Delete; Rename changes the card in place"
const files = [
  { id: 'f1', name: 'Q3 report.pdf', icon: 'file-pdf', size: '2.4 MB', kind: 'PDF', at: Date.now() - 2 * 3600e3 },
  { id: 'f2', name: 'Team photo.jpg', icon: 'image', size: '5.1 MB', kind: 'Image', at: Date.now() - 26 * 3600e3 },
  { id: 'f3', name: 'Budget 2027.csv', icon: 'file-csv', size: '84 KB', kind: 'Sheet', at: Date.now() - 5 * 86400e3 },
  { id: 'f4', name: 'Pitch deck.pptx', icon: 'file-ppt', size: '12 MB', kind: 'Slides', at: Date.now() - 9 * 86400e3 },
  { id: 'f5', name: 'Contract.docx', icon: 'file-word', size: '310 KB', kind: 'Document', at: Date.now() - 40 * 86400e3 }
];
const grid = await slice.build('DataList', {
  items: files,
  title: 'name',
  icon: 'icon',
  meta: [{ value: 'size' }, { value: 'kind' }],
  timestamp: 'at',
  layout: 'grid',
  minItemWidth: 220,
  actions: [
    { label: 'Rename', icon: 'edit', onClick: ({ item, list }) => list.updateItem(item.id, { name: item.name.replace(/(\.\w+)$/, ' (renamed)$1') }) },
    { label: 'Delete', icon: 'trash-bin', danger: true, onClick: ({ item, list }) => list.removeItem(item.id, { undo: true }) }
  ]
});
grid.style.width = '100%';
return grid;
:::

## Best Practices
:::tip
Give every item a stable key (`itemKey`, `'id'` by default). Selection, updates and removals find items by it, and rows that did not change are not redrawn.
:::

:::tip
Use `commit` for every change that goes to a server. People see the change at once, and a failure undoes it by itself, instead of leaving the list out of step with the server.
:::

:::tip
Prefer `removeItem(…, { undo: true })` to a confirmation for things that can be brought back. Undo is faster for the nine times people meant it, and safe for the tenth. Keep `confirm` for what cannot be undone.
:::

:::tip
Put the one or two actions people use most on the row (`inline: true`) and the rest in the menu. A row full of buttons is hard to scan.
:::

## Pitfalls
:::warning
With `load`, filter options and view counts do not come from the data, because the list only holds one page. Give filters their `options`, and views a `count` if you want one.
:::

:::warning
Do not change item objects in place (`item.done = true`) and expect the list to notice. Use `updateItem`, or set `items` (or the context) to a new array, the way you would in React or Vue.
:::

:::warning
A list inside a flex or grid item needs `min-width: 0` on that item, or long titles push it wider than the screen.
:::