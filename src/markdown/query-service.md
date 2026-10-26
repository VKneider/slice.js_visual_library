---
title: QueryService
route: /docs/services/query-service
navLabel: QueryService
section: Services
group: Networking
order: 31
description: What the app already knows from the server. One request per key however many components ask, data kept while it is fresh and refreshed behind the screen when it is not, invalidation after a change, retries, cancellation. React Query, the Slice way.
component: QueryServiceDocumentation
generate: true
tags: [service, query, cache, server state, react query, swr, stale-while-revalidate, invalidate, mutate, prefetch]
---

# QueryService

## Overview
`QueryService` keeps what the app already got from the server, and knows whether it is still fresh and who is showing it. It is the layer React Query or SWR are in React.

A **query** is a **key** (what the data is) and a **function** (how to get it):

```js
const queries = await slice.build('QueryService', { singleton: true, sliceId: 'queries' });

const open = queries.query(['orders', { status: 'open' }],
  ({ signal }) => http.get('/orders', { query: { status: 'open' }, signal }));

open.watch(this, (state) => this.paint(state));   // now, and on every change
open.load();                                       // fresh: nothing. In flight: shared. Else: asks.
```

It makes no requests itself: the function can call [FetchManager](/docs/services/fetch-manager), `fetch`, IndexedDB, anything that returns a promise. What it adds:

- **One request per key.** Three components that ask for `['orders', 'open']` at the same time cause one request.
- **Fresh data is not asked again.** For `staleTime` (30 s) it comes from memory. After that it is shown at once and refreshed behind the screen (stale-while-revalidate).
- **Invalidation.** After a change, `invalidate(['orders'])` makes everything under that key stale, and what is on screen asks again by itself.
- **Retries** for failures worth retrying (a 5xx, the network); never for a 4xx.
- **Cancellation.** A request nobody waits for any more is aborted.
- **A refresh when the tab comes back** or the network returns, for what is on screen.
- **Forgetting.** A query nobody watches for `gcTime` (5 min) is dropped.

### When to use it
- The same server data is shown in several places (a list, a counter in the menu, a detail).
- Going back to a page should show its data at once, not a skeleton again.
- After a change (a save, a delete) the parts of the app that show that data should update.

### When not to use it
- One component shows one set of data, once: give it `load` ([DataList](/docs/data/datalist), [Table](/docs/data/table), [DescriptionList](/docs/data/description-list)). They already show the skeleton, the error and Try again.
- Data the **app** owns (the session after sign-in, the filters chosen, a cart, a draft): that is a `slice.context`. See [server data and contexts](#queries-and-slicecontext).

## Build it once
```js
const queries = await slice.build('QueryService', {
  singleton: true,
  sliceId: 'queries',
  staleTime: 30_000,        // ms a query is fresh
  gcTime: 5 * 60_000,       // ms an unwatched query is kept
  retry: 1,                 // retries for a 5xx or the network
  retryDelay: 500,          // ms, doubled each time
  refetchOnFocus: true,     // the tab comes back: refresh what is on screen and stale
  refetchOnReconnect: true,
  http,                     // optional: a FetchManager, for queries.get()
});
```

## A query
`queries.query(key, fn, options?)` returns the query's **handle**. The same key always gives the same handle, from anywhere in the app.

- **The key** is an array: `['orders']`, `['orders', 42]`, `['orders', 'list', { page: 2, status: 'open' }]`. Keys are a hierarchy: `['orders']` is the prefix of all the others, and invalidating it reaches them all.

  Two keys are the same query when they describe the same thing: objects compare by value in any order (`{ page: 2, status: 'open' }` = `{ status: 'open', page: 2 }`), arrays by order, `Date` by its instant, `Map` and `Set` by their entries, `Blob` by name, size and type. Anything else — a `URL`, an instance of your own class — compares by its type and its text, so **key by an id** when it has one: two different instances of the same class with the same `toString()` are the same query.
- **The function** receives `{ signal, key }`. Pass `signal` on, so a cancelled query stops its request.
- **Options:** `staleTime` and `retry` for this query, and `initialData` (shown at once, as `ready`).

### The state
| Field | Meaning |
| --- | --- |
| `status` | `'idle'` (never asked), `'loading'` (asking, no data yet), `'ready'`, `'error'` |
| `data` | The last data it got. Kept during a refresh and after a failed refresh. |
| `error` | The last error (an `HttpError` from FetchManager has `status` and the server's `message`). |
| `fetching` | `true` while a request runs, also when refreshing data it already has. |
| `updatedAt` | When `data` arrived (ms). |

Show it like this: `loading` → a skeleton; `ready` + `fetching` → the data, quietly busy; `error` with `data` → the data and a small notice; `error` without → the error and Try again.

### The handle
| Member | Description |
| --- | --- |
| `state`, `data` | Now. |
| `load({ signal }?)` | Loads if needed: fresh → nothing; in flight → the same request; else asks. Resolves with the data, rejects with the error. Usable as a component's `load`. |
| `refresh()` | Asks again, keeping the data shown meanwhile. |
| `watch(component, callback)` | Calls `callback(state)` now and on every change, until `component` is destroyed. Returns a function to stop sooner. |
| `invalidate()` | Stale now; asks again if someone watches it. |
| `setData(dataOrUpdater)` | Changes its data without asking the server. |

`watch` is the Slice version of a hook: it ties the subscription to the component, as `slice.context.watch` does, so there is nothing to clean up. Only the watchers of **that** query are called, with a new state object each time. If a watcher publishes from its callback (a `setData`, say), the others still receive the newest state in the same pass — nobody is left showing the old one.

## The service
| Method | Description |
| --- | --- |
| `query(key, fn, options?)` | A query's handle. |
| `get(key, url, options?)` | A GET through `http` as a query. |
| `loader(prefix, fn, options?)` | A `load` for DataList, Table or DescriptionList: each page, search, filter or sort is its own query under `prefix`, cached; an invalidation under `prefix` makes the component load again. `fn(params, { signal })`. `options.base` is where the listener sits when `prefix` is a key function that does not put the params last. |
| `mutate(fn, { invalidates, onSuccess, onError }?)` | Runs a change; when it succeeds, invalidates each prefix in `invalidates`. Resolves with what `fn` returned; rethrows its error. |
| `invalidate(prefix?)` | Everything under `prefix` is stale; what is watched asks again now, the rest when it is next used. |
| `prefetch(key, fn, options?)` | Asks before it is needed. Never throws. |
| `getData(key)` / `setData(key, dataOrUpdater)` | Read or change a query's data directly. |
| `remove(prefix?)` | Forgets data (a sign-out). Watchers see `idle`. |
| `inspect()` | Every query with its state and number of watchers, for debugging. |

`loader(prefix, fn, { base })`: the listener that an invalidation wakes sits at `prefix`. When `prefix` is a key function that does not put the params last (`(p) => [p, 'orders']`), pass `base: ['orders']` — otherwise the pages are cached as usual but an invalidation never reaches the list. With an array prefix, or a function that appends the params (`(p) => ['orders', 'list', p]`), it is inferred and you can leave it out.

## Examples

### One query, three places, a change that updates them all
A list of orders, a counter of open ones and a line that says when the data arrived, all from the server. **Mark paid** saves with `mutate` and invalidates `['orders']`: the list and the counter ask again by themselves. The line under it counts the requests the server got: running the example again, or going to another page and back within 30 seconds, asks for nothing.

:::script label="Orders: a list, a counter and a change" expected="a list of five orders with a badge 'open' or 'paid' and a 'Mark paid' action on the open ones; above, an 'Open' counter badge and a status line; the list shows a skeleton first, then the orders; 'Mark paid' on an order makes the list and the counter update (after a short busy state); the request line counts what the pretend server answered"
// A pretend server: 400 ms per answer, counting the requests it gets.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const orders = [
  { id: 1041, customer: 'Ana López', total: 120, paid: false },
  { id: 1042, customer: 'Luis Galué', total: 75.5, paid: true },
  { id: 1043, customer: 'María Ruiz', total: 310, paid: false },
  { id: 1044, customer: 'Sofía Rey', total: 48, paid: false },
  { id: 1045, customer: 'Pedro Díaz', total: 199, paid: true },
];
const log = document.createElement('small');
log.style.cssText = 'opacity:.7';
let requests = 0;
const counted = () => { requests += 1; log.textContent = `The server got ${requests} request${requests === 1 ? '' : 's'}.`; };
const server = {
  async list({ signal }) { counted(); await wait(400); signal?.throwIfAborted(); return { items: orders.map((o) => ({ ...o })), total: orders.length }; },
  async summary() { counted(); await wait(400); return { open: orders.filter((o) => !o.paid).length }; },
  async markPaid(id) { await wait(400); orders.find((o) => o.id === id).paid = true; return { ok: true }; },
};

// The service, once for the whole app. Each run of this example starts clean.
const queries = await slice.build('QueryService', { singleton: true, sliceId: 'docsQueries' });
queries.remove(['docs-orders']);

// The list: each page or search is a query under ['docs-orders', 'list'].
const list = await slice.build('DataList', {
  load: queries.loader(['docs-orders', 'list'], (params, { signal }) => server.list({ signal })),
  itemKey: 'id',
  title: 'customer',
  description: (o) => `Order #${o.id} · $${o.total.toFixed(2)}`,
  badge: (o) => (o.paid ? { label: 'Paid', tone: 'success' } : { label: 'Open', tone: 'warning' }),
  actions: [{
    label: 'Mark paid', icon: 'check-circle', inline: true, hidden: (o) => o.paid,
    onClick: ({ item }) => queries.mutate(() => server.markPaid(item.id), { invalidates: [['docs-orders']] }).catch(() => {}),
  }],
});

// The counter and the status line watch another query.
const counter = await slice.build('Badge', { value: 0, tone: 'warning', showZero: true });
const status = document.createElement('span');
status.style.cssText = 'font-size:.85rem;opacity:.8';
const summary = queries.query(['docs-orders', 'summary'], () => server.summary());
summary.watch(counter, (s) => {
  counter.value = s.data?.open ?? 0;
  status.textContent = s.status === 'idle' ? ''
    : s.status === 'loading' ? 'Loading…'
    : s.fetching ? 'Refreshing…'
    : s.status === 'error' ? s.error.message
    : `Updated at ${new Date(s.updatedAt).toLocaleTimeString()}`;
});
summary.load();

const head = document.createElement('div');
head.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap';
const label = document.createElement('strong');
label.textContent = 'Open';
head.append(label, counter, status);
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px';
box.append(head, list, log);
return box;
:::

### Ask before the click
A detail usually opens after the pointer has been on its link for a few hundred milliseconds. `prefetch` uses that time: when the click comes, the data is there or on its way, and `load` shares the same request.

:::script label="Prefetch on hover" expected="three customer buttons and an empty panel; resting the pointer on a button for a moment, then clicking it, shows the customer's details at once; clicking without resting first shows a short skeleton (about 700 ms) before them"
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const people = {
  7: { name: 'Ana López', email: 'ana@example.com', city: 'Maracaibo', since: '2021-03-14' },
  8: { name: 'Luis Galué', email: 'luis@example.com', city: 'Caracas', since: '2022-11-02' },
  9: { name: 'María Ruiz', email: 'maria@example.com', city: 'Valencia', since: '2020-06-21' },
};
const fetchCustomer = async (id, signal) => { await wait(700); signal?.throwIfAborted(); return { id, ...people[id] }; };

const queries = await slice.build('QueryService', { singleton: true, sliceId: 'docsQueries' });
queries.remove(['docs-customer']);
const customer = (id) => queries.query(['docs-customer', id], ({ signal }) => fetchCustomer(id, signal));

const panel = document.createElement('div');
let detail = null;
const open = async (id) => {
  if (detail) slice.controller.destroyComponent(detail);
  detail = await slice.build('DescriptionList', {
    title: 'Customer',
    load: customer(id).load,     // the query's load: from memory, shared, or asked
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', type: 'email', copy: true },
      { key: 'city', label: 'City' },
      { key: 'since', label: 'Customer since', type: 'date' },
    ],
  });
  panel.replaceChildren(detail);
};

const buttons = document.createElement('div');
buttons.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
for (const id of [7, 8, 9]) {
  const button = await slice.build('Button', { value: people[id].name, variant: 'outlined', size: 'sm', onClick: () => open(id) });
  let timer;
  button.addEventListener('pointerenter', () => { timer = setTimeout(() => customer(id).load().catch(() => {}), 150); });
  button.addEventListener('pointerleave', () => clearTimeout(timer));
  buttons.append(button);
}
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;width:100%;max-width:520px';
box.append(buttons, panel);
return box;
:::

### In a component
A component watches the queries it shows and starts them in `init()`, **without** `await`: the page shows at once with its skeleton (see [Data and the first load](/docs/guides/data-and-loading)).

```js
export default class OrderHeader extends HTMLElement {
  async init() {
    this.$count = await slice.build('Badge', { tone: 'warning', showZero: true });
    this.appendChild(this.$count);
    this.orders = await slice.build('OrdersService', { singleton: true, sliceId: 'orders' });
    const summary = this.orders.summary();               // a handle
    summary.watch(this, (s) => {                    // stops when this component is destroyed
      this.classList.toggle('is-loading', s.status === 'loading');
      this.$count.value = s.data?.open ?? 0;
    });
    summary.load();                                 // not awaited
  }

  update() {
    // A cached route came back: fresh → nothing; stale → shown, and refreshed behind.
    this.orders?.summary().load();
  }
}
```

### Optimistic: show the change before the server answers
`setData` changes what is shown now; if the save fails, put it back.

```js
async function togglePin(note) {
  const key = ['notes', 'list'];
  const before = queries.getData(key);
  queries.setData(key, (notes) => notes.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)));
  try {
    await queries.mutate(() => http.patch(`/notes/${note.id}`, { pinned: !note.pinned }), { invalidates: [['notes']] });
  } catch (error) {
    queries.setData(key, before);
    toast.show({ tone: 'danger', message: error.message });
  }
}
```

For lists shown in DataList or Table, their own `updateItem(…, { commit })` already does this, with the rollback; give it a `commit` that calls `queries.mutate`.

## Queries and slice.context
They hold different things, and they meet in the key.

| | `slice.context` | QueryService |
| --- | --- | --- |
| Holds | what the **app** owns: the session, the filters chosen, a cart, a draft, preferences | a **copy** of what the **server** owns: orders, users, products |
| The truth is | what is in it | on the server; the copy can be old |
| Adds | state, `watch`, persistence | freshness, `loading`/`error`, one request per key, refresh after a change, cancellation, forgetting |

The rule: **if reloading the page would have to ask the server for it, it is a query; if the user or the app decides it, it is a context.**

The usual way they work together: a context says **which** data, the query keeps it.

```js
// The filters are the app's: a context.
slice.context.watch('orderFilters', this, (filters) => {
  this._stop?.();                                      // stop watching the previous filters
  const page = orders.list(filters);                   // ['orders', 'list', filters]
  this._stop = page.watch(this, (s) => this.paint(s));
  page.load();                                         // filters seen before: at once, from memory
});
```

And the other way: a sign-in answer is server data that becomes the app's. Keep it in a context (persisted, if it must survive a reload), and `remove()` the queries on sign-out so the next user sees nothing of the last one.

## Best practices
:::tip
- One `QueryService` for the whole app (`singleton: true`), used through a Service per domain (`OrdersService`): components never build keys or URLs. See [the layers](/docs/guides/data-and-loading#layers-transport-cache-and-your-domain).
- Keys from general to specific: `['orders']`, `['orders', 'list', params]`, `['orders', id]`. Then `invalidate(['orders'])` after any change to orders is always right.
- Pass `signal` to the request: a query nobody waits for is cancelled.
- Never `await` a query in `init()`: `watch`, then `load()`.
:::

## Pitfalls
:::warning
Do not copy query data into a context to share it. The query **is** the shared copy; a second one gets out of date, and then you have two truths. Share the handle (or the domain Service that gives it).
:::

:::warning
A key must contain everything the function depends on. A function that reads `page` from outside, with a key that does not include it, returns page 1's cached data for page 2.
:::
