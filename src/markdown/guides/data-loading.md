---
title: Data and the first load
route: /docs/guides/data-and-loading
navLabel: Data and loading
section: Guides
group: Applications
order: 1
description: How to bring data from a server into a Slice app without keeping the page behind the loader. Why an awaited fetch in init() slows the first load, and the patterns that avoid it — data that arrives after the structure, a slice.context shared between components, critical data in parallel, refresh in the background, and saving changes.
component: DataAndLoadingDocumentation
generate: true
tags: [guide, data, fetch, server, loading, first load, context, skeleton, performance, stale-while-revalidate]
---

# Data and the first load

## Overview
Almost every app shows data from a server. Where you ask for it decides how fast the app feels. This guide explains what Slice waits for before it shows a page, and five patterns that keep pages fast while the data is on its way.

The short version: **build the page, then bring the data. Never make the page wait for the network.**

## What Slice waits for
With `"loading": { "enabled": true }` in `sliceConfig.json`, Slice shows its loader (`slice.loading`) while it prepares a page: on the first load of the app and on every route change. The router does this:

1. `slice.loading.start()`;
2. builds the route's component with `await slice.build(...)`. That waits for its `init()`, and inside it, for every `slice.build()` that `init()` awaits, and their `init()`s, all the way down. A cached route that comes back waits for its `update()` instead;
3. `slice.loading.stop()`.

So **everything an `init()` awaits happens behind the loader**. One `await fetch(...)` in an `init()` and the whole page waits for the network. In nested components it gets worse: the parent awaits the child, the child awaits its fetch, and the requests run **one after another** instead of together.

```js
// ❌ The page stays behind the loader until the server answers.
async init() {
  const orders = await fetch('/api/orders').then((r) => r.json());
  this.$list = await slice.build('DataList', { items: orders });
  this.appendChild(this.$list);
}
```

```js
// ✅ The page shows at once, with a skeleton; the rows arrive when they arrive.
async init() {
  this.$list = await slice.build('DataList', {
    load: ({ page, pageSize, search, signal }) => api.orders({ page, pageSize, search, signal }),
  });
  this.appendChild(this.$list);
}
```

Building components is fast and stays awaited: `await slice.build()` is how a component comes to exist. What should not be awaited is **the network**.

:::script label="Awaited or not: see the difference" expected="two buttons; 'Wait for the data' shows nothing for about 1.5 seconds and then the whole record; 'Data after the structure' shows the record's labels with skeleton bars at once and fills them 1.5 seconds later; under each run, how long the first paint and the data took"
const fakeServer = () => new Promise((r) => setTimeout(() => r({ name: 'Ana López', email: 'ana@example.com', plan: 'Pro', since: '2023-03-14' }), 1500));
const fields = ['name', { key: 'email', type: 'email' }, 'plan', { key: 'since', label: 'Customer since', type: 'date' }];

const stage = document.createElement('div');
stage.style.cssText = 'min-height:230px';
const timing = document.createElement('p');
timing.style.cssText = 'margin:0;font-size:.85rem;opacity:.8;font-variant-numeric:tabular-nums';

const clear = () => { slice.controller.destroyByContainer(stage); stage.replaceChildren(); timing.textContent = ''; };

const blocking = await slice.build('Button', {
  value: 'Wait for the data', variant: 'outlined',
  onClick: async () => {
    clear();
    const start = performance.now();
    const item = await fakeServer();                      // ❌ awaited before building
    const view = await slice.build('DescriptionList', { item, fields });
    stage.append(view);
    const ms = Math.round(performance.now() - start);
    timing.textContent = `First paint: ${ms} ms · data: ${ms} ms`;
  }
});
const streaming = await slice.build('Button', {
  value: 'Data after the structure', variant: 'filled',
  onClick: async () => {
    clear();
    const start = performance.now();
    const view = await slice.build('DescriptionList', {
      fields,
      load: async () => {                                  // ✅ asked for, not awaited
        const item = await fakeServer();
        timing.textContent += ` · data: ${Math.round(performance.now() - start)} ms`;
        return item;
      }
    });
    stage.append(view);
    timing.textContent = `First paint: ${Math.round(performance.now() - start)} ms`;
  }
});

const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
bar.append(blocking, streaming);
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;width:100%;max-width:560px';
box.append(bar, timing, stage);
return box;
:::

## Pattern 1 — Let the component load its data
[DataList](/docs/data/datalist), [Table](/docs/data/table) and [DescriptionList](/docs/data/description-list) take a `load` function. They call it after they are on the page, and they handle every state for you:

- a **skeleton** shaped like the content on the first load;
- the old content kept, marked busy, when they load again (a new page, a search);
- an **error with Try again**;
- a new request **cancels** the previous one (`signal`), and so does leaving the page;
- `reload()` asks again, and a cached route that comes back reloads by itself.

```js
const orders = await slice.build('Table', {
  rowKey: 'id',
  pagination: { pageSize: 20 },
  columns: [{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }, { key: 'total', label: 'Total' }],
  load: async ({ page, pageSize, search, filters, sort, signal }) => {
    const res = await fetch(`/api/orders?page=${page}&size=${pageSize}&q=${encodeURIComponent(search)}`, { signal });
    if (!res.ok) throw new Error(`The server answered ${res.status}`);
    return res.json(); // { items, total }
  },
});
```

This is the default. Use it whenever one component shows one set of data.

## Pattern 2 — Share data through a context
When several components show the same data (a list, a counter in the menu, a chart), ask for it **once** and keep it in a context (`slice.context.create(name, …)`). Every component watches the context, so a change anywhere shows everywhere, and nothing is asked twice.

(To create a context from several places safely, keep its creation in one composition-root service; persistence is configured directly on `slice.context.create(name, initial, { persist: true })`. The pattern is the same.)

Keep the request's state in the context next to the data, so every component can show it. A helper like this one lives in a module of your app (for example `src/Components/AppComponents/resources.js`) and is imported with a relative path:

```js
// A small "resource": the data, its state, and one way to load it.
export function createResource(name, fetcher, { staleMs = 30_000 } = {}) {
  if (!slice.context.has(name)) {
    slice.context.create(name, { status: 'idle', data: null, error: null, updatedAt: 0 });
  }
  let pending = null;
  return {
    name,
    get state() { return slice.context.getState(name); },
    // Fresh enough: nothing to do. Already asking: share that request.
    load({ force = false } = {}) {
      const { updatedAt } = slice.context.getState(name);
      if (!force && Date.now() - updatedAt < staleMs) return Promise.resolve();
      if (pending) return pending;
      slice.context.setState(name, (s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }));
      pending = fetcher()
        .then((data) => slice.context.setState(name, (s) => ({ ...s, status: 'ready', data, updatedAt: Date.now() })))
        .catch((error) => slice.context.setState(name, (s) => ({ ...s, status: 'error', error: error.message })))
        .finally(() => { pending = null; });
      return pending;
    },
  };
}
```

The states mean: `loading` (nothing yet: show a skeleton), `refreshing` (show what you have, quietly busy), `ready`, `error` (keep the old data if there is some, and offer Try again).

:::script label="One context, three components, stale-while-revalidate" expected="a team list, a counter badge and a status line read the same context; on the first run the list shows its skeleton, then the people; Refresh keeps the list on screen and shows 'Refreshing…' in the status line; 'Fail next' makes the next refresh fail: an Alert says so with Try again, and the list keeps the data it had"
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let failNext = false;
let version = 0;
const fetchTeam = async () => {
  await wait(900);
  if (failNext) { failNext = false; throw new Error('The server did not answer.'); }
  version += 1;
  return [
    { id: 1, name: 'Ana López', role: 'Design', online: true },
    { id: 2, name: 'Lucas Molina', role: 'Security', online: version % 2 === 0 },
    { id: 3, name: 'María Ruiz', role: 'Sales', online: true },
    ...(version > 1 ? [{ id: 4, name: 'Sofía Rey', role: 'Engineering', online: true }] : [])
  ];
};

// The resource (see the code above), in a few lines.
const name = 'guideTeam';
if (!slice.context.has(name)) slice.context.create(name, { status: 'idle', data: null, error: null, updatedAt: 0 });
let pending = null;
const team = {
  load({ force = false } = {}) {
    const { updatedAt } = slice.context.getState(name);
    if (!force && Date.now() - updatedAt < 30000) return Promise.resolve();
    if (pending) return pending;
    slice.context.setState(name, (s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }));
    pending = fetchTeam()
      .then((data) => slice.context.setState(name, (s) => ({ ...s, status: 'ready', data, updatedAt: Date.now() })))
      .catch((error) => slice.context.setState(name, (s) => ({ ...s, status: 'error', error: error.message })))
      .finally(() => { pending = null; });
    return pending;
  }
};

const list = await slice.build('DataList', {
  context: name,
  contextPath: 'data',
  title: 'name',
  description: 'role',
  avatar: (p) => ({ name: p.name, status: p.online ? 'online' : 'offline' }),
  loading: true
});
const counter = await slice.build('Badge', { value: 0, tone: 'accent', showZero: true });
const status = document.createElement('span');
status.style.cssText = 'font-size:.85rem;opacity:.8';
const alert = await slice.build('Alert', { open: false, tone: 'danger', size: 'sm' });

const paint = (s) => {
  list.loading = s.status === 'loading';
  counter.value = (s.data || []).length;
  status.textContent = s.status === 'loading' ? 'Loading…'
    : s.status === 'refreshing' ? 'Refreshing…'
    : s.updatedAt ? `Updated at ${new Date(s.updatedAt).toLocaleTimeString()}` : '';
  if (s.status === 'error') {
    alert.show({ message: s.error, actions: [{ label: 'Try again', onClick: () => team.load({ force: true }) }] });
  } else if (s.status !== 'refreshing') {
    alert.hide();
  }
};
slice.context.watch(name, list, (s) => paint(s));
paint(slice.context.getState(name));
team.load();

const refresh = await slice.build('Button', { value: 'Refresh', variant: 'outlined', size: 'sm', onClick: () => team.load({ force: true }) });
const fail = await slice.build('Button', { value: 'Fail next', variant: 'ghost', size: 'sm', onClick: () => { failNext = true; } });

const head = document.createElement('div');
head.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap';
const label = document.createElement('strong');
label.textContent = 'Team';
head.append(label, counter, status, refresh, fail);
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px';
box.append(head, alert, list);
return box;
:::

## Pattern 3 — Ask early, in parallel
Two things make data arrive sooner: asking **before** it is needed, and asking for everything **at the same time**.

- **At the start of the app**, ask for what most pages need (the user, their permissions, the menu), without awaiting it. When a page needs it, it is there or on its way.
- **When a navigation is likely**, ask then: on hover or focus of a link, `orders.load()`. With the resource above, a second `load()` shares the first request, so asking early costs nothing.
- **In a route's component**, start every request of the page together and let each part show its own state. Never chain them through nested `init()`s.

```js
// App start (for example in the App component's init): not awaited.
session.load();
menu.load();

// A link that will probably be clicked.
ordersLink.addEventListener('pointerenter', () => orders.load(), { once: true });
```

## Pattern 4 — When the page really cannot show without the data
Some data decides **what** the page is: whether the user is signed in, whether they may see it, which plan they are on. Waiting for it is correct, but:

- wait only for that, in **one** place (the route's component), with `Promise.all`, never one after another;
- give it a **time budget**: after it, show the page with what you have and let the rest keep loading;
- keep it small and cacheable (a session, not the user's whole history).

```js
async init() {
  // Only what decides the page, together, with a budget of 800 ms.
  const budget = new Promise((resolve) => setTimeout(resolve, 800));
  await Promise.race([Promise.all([session.load(), permissions.load()]), budget]);

  if (slice.context.getState('permissions').data?.canSeeBilling === false) {
    slice.router.navigate('/not-allowed');
    return;
  }
  // Everything else: built now, loaded after.
  this.$invoices = await slice.build('Table', { load: api.invoices, columns: COLUMNS });
  this.appendChild(this.$invoices);
}
```

## Pattern 5 — Coming back to a page
A route kept in cache runs `update()` when it comes back, and the loader waits for it too. Show what you already have **at once**, and refresh behind it:

```js
update() {
  // No await: the page is already there; the data catches up.
  orders.load();          // a resource: does nothing if it is still fresh
  this.$table.reload();   // or: a component with `load`
}
```

## Saving changes
The same rule applies the other way: the page stays usable while a change is saved.

- **List changes are optimistic.** `addItem`, `updateItem` and `removeItem` (`addRow`… in Table) show the change at once and run your `commit`. If it fails, the change is taken back and an [Alert](/docs/feedback/alert) says so. `removeItem(keys, { undo: true, commit })` gives an Undo before the server is asked at all.
- **Field and cell edits are commit-first.** In DescriptionList and Table the edited value shows busy while `commit` runs, and the record changes when it succeeds. If it fails, the old value stays and the field shows the error.
- **Throw with a message people can act on.** "Prices over 1,000 need approval." shows on the field and on the bar; "Error 500" helps nobody.

```js
list.removeItem(order.id, {
  undo: true,
  commit: () => api.deleteOrder(order.id),   // runs when the undo time is over
});

table.commit = async ({ row, key, value }) => {
  const res = await fetch(`/api/products/${row.id}`, { method: 'PATCH', body: JSON.stringify({ [key]: value }) });
  if (!res.ok) throw new Error((await res.json()).message);
  return res.json(); // the server's version of the row
};
```

## The app's own loader
`sliceConfig.loading` sets how [Loading](/docs/feedback/loading) looks while a page is prepared:

- `delayMs`: work that ends before this shows nothing. Use 150–300 ms, so fast route changes do not flash.
- `minVisibleMs`: once shown, it stays at least this long, so it does not blink.
- `welcome`: a branded screen for the first load of the app.

None of this makes a slow `init()` fast. It only makes the wait look better. The real fix is the rule at the top.

## Checklist
:::tip
- `init()` and `update()` build and return; they never `await` the network.
- One set of data, one component: give it `load`.
- Data several components show: a context with its state (`loading`, `refreshing`, `ready`, `error`), asked for once.
- Requests start early and together; only what decides the page is awaited, with a time budget.
- Every place that shows data has a skeleton, an empty state, and an error with Try again.
- Changes: lists optimistic with rollback (and Undo for removals), fields commit-first; errors say what to do.
:::

## Pitfalls
:::warning
`Promise.all` over requests that do not depend on each other, not a `for` with an `await` inside: five requests of 300 ms take 300 ms together, and 1.5 s in a row.
:::

:::warning
Do not hide a slow request behind a longer `minVisibleMs` or a nicer welcome screen. Measure the first paint (as in the first example) and move the request out of `init()`.
:::
