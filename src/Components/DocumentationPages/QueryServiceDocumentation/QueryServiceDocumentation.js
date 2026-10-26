export default class QueryServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Orders: a list, a counter and a change","expected":"a list of five orders with a badge 'open' or 'paid' and a 'Mark paid' action on the open ones; above, an 'Open' counter badge and a status line; the list shows a skeleton first, then the orders; 'Mark paid' on an order makes the list and the counter update (after a short busy state); the request line counts what the pretend server answered","kind":"script","content":"// A pretend server: 400 ms per answer, counting the requests it gets.\nconst wait = (ms) => new Promise((r) => setTimeout(r, ms));\nconst orders = [\n  { id: 1041, customer: 'Ana López', total: 120, paid: false },\n  { id: 1042, customer: 'Luis Galué', total: 75.5, paid: true },\n  { id: 1043, customer: 'María Ruiz', total: 310, paid: false },\n  { id: 1044, customer: 'Sofía Rey', total: 48, paid: false },\n  { id: 1045, customer: 'Pedro Díaz', total: 199, paid: true },\n];\nconst log = document.createElement('small');\nlog.style.cssText = 'opacity:.7';\nlet requests = 0;\nconst counted = () => { requests += 1; log.textContent = `The server got ${requests} request${requests === 1 ? '' : 's'}.`; };\nconst server = {\n  async list({ signal }) { counted(); await wait(400); signal?.throwIfAborted(); return { items: orders.map((o) => ({ ...o })), total: orders.length }; },\n  async summary() { counted(); await wait(400); return { open: orders.filter((o) => !o.paid).length }; },\n  async markPaid(id) { await wait(400); orders.find((o) => o.id === id).paid = true; return { ok: true }; },\n};\n\n// The service, once for the whole app. Each run of this example starts clean.\nconst queries = await slice.build('QueryService', { singleton: true, sliceId: 'docsQueries' });\nqueries.remove(['docs-orders']);\n\n// The list: each page or search is a query under ['docs-orders', 'list'].\nconst list = await slice.build('DataList', {\n  load: queries.loader(['docs-orders', 'list'], (params, { signal }) => server.list({ signal })),\n  itemKey: 'id',\n  title: 'customer',\n  description: (o) => `Order #${o.id} · $${o.total.toFixed(2)}`,\n  badge: (o) => (o.paid ? { label: 'Paid', tone: 'success' } : { label: 'Open', tone: 'warning' }),\n  actions: [{\n    label: 'Mark paid', icon: 'check-circle', inline: true, hidden: (o) => o.paid,\n    onClick: ({ item }) => queries.mutate(() => server.markPaid(item.id), { invalidates: [['docs-orders']] }).catch(() => {}),\n  }],\n});\n\n// The counter and the status line watch another query.\nconst counter = await slice.build('Badge', { value: 0, tone: 'warning', showZero: true });\nconst status = document.createElement('span');\nstatus.style.cssText = 'font-size:.85rem;opacity:.8';\nconst summary = queries.query(['docs-orders', 'summary'], () => server.summary());\nsummary.watch(counter, (s) => {\n  counter.value = s.data?.open ?? 0;\n  status.textContent = s.status === 'idle' ? ''\n    : s.status === 'loading' ? 'Loading…'\n    : s.fetching ? 'Refreshing…'\n    : s.status === 'error' ? s.error.message\n    : `Updated at ${new Date(s.updatedAt).toLocaleTimeString()}`;\n});\nsummary.load();\n\nconst head = document.createElement('div');\nhead.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap';\nconst label = document.createElement('strong');\nlabel.textContent = 'Open';\nhead.append(label, counter, status);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px';\nbox.append(head, list, log);\nreturn box;"},{"label":"Prefetch on hover","expected":"three customer buttons and an empty panel; resting the pointer on a button for a moment, then clicking it, shows the customer's details at once; clicking without resting first shows a short skeleton (about 700 ms) before them","kind":"script","content":"const wait = (ms) => new Promise((r) => setTimeout(r, ms));\nconst people = {\n  7: { name: 'Ana López', email: 'ana@example.com', city: 'Maracaibo', since: '2021-03-14' },\n  8: { name: 'Luis Galué', email: 'luis@example.com', city: 'Caracas', since: '2022-11-02' },\n  9: { name: 'María Ruiz', email: 'maria@example.com', city: 'Valencia', since: '2020-06-21' },\n};\nconst fetchCustomer = async (id, signal) => { await wait(700); signal?.throwIfAborted(); return { id, ...people[id] }; };\n\nconst queries = await slice.build('QueryService', { singleton: true, sliceId: 'docsQueries' });\nqueries.remove(['docs-customer']);\nconst customer = (id) => queries.query(['docs-customer', id], ({ signal }) => fetchCustomer(id, signal));\n\nconst panel = document.createElement('div');\nlet detail = null;\nconst open = async (id) => {\n  if (detail) slice.controller.destroyComponent(detail);\n  detail = await slice.build('DescriptionList', {\n    title: 'Customer',\n    load: customer(id).load,     // the query's load: from memory, shared, or asked\n    fields: [\n      { key: 'name', label: 'Name' },\n      { key: 'email', label: 'Email', type: 'email', copy: true },\n      { key: 'city', label: 'City' },\n      { key: 'since', label: 'Customer since', type: 'date' },\n    ],\n  });\n  panel.replaceChildren(detail);\n};\n\nconst buttons = document.createElement('div');\nbuttons.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';\nfor (const id of [7, 8, 9]) {\n  const button = await slice.build('Button', { value: people[id].name, variant: 'outlined', size: 'sm', onClick: () => open(id) });\n  let timer;\n  button.addEventListener('pointerenter', () => { timer = setTimeout(() => customer(id).load().catch(() => {}), 150); });\n  button.addEventListener('pointerleave', () => clearTimeout(timer));\n  buttons.append(button);\n}\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%;max-width:520px';\nbox.append(buttons, panel);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "query-service.md";
    this.markdownContent = "---\ntitle: QueryService\nroute: /docs/services/query-service\nnavLabel: QueryService\nsection: Services\ngroup: Networking\norder: 31\ndescription: What the app already knows from the server. One request per key however many components ask, data kept while it is fresh and refreshed behind the screen when it is not, invalidation after a change, retries, cancellation. React Query, the Slice way.\ncomponent: QueryServiceDocumentation\ngenerate: true\ntags: [service, query, cache, server state, react query, swr, stale-while-revalidate, invalidate, mutate, prefetch]\n---\n\n# QueryService\n\n## Overview\n`QueryService` keeps what the app already got from the server, and knows whether it is still fresh and who is showing it. It is the layer React Query or SWR are in React.\n\nA **query** is a **key** (what the data is) and a **function** (how to get it):\n\n```js\nconst queries = await slice.build('QueryService', { singleton: true, sliceId: 'queries' });\n\nconst open = queries.query(['orders', { status: 'open' }],\n  ({ signal }) => http.get('/orders', { query: { status: 'open' }, signal }));\n\nopen.watch(this, (state) => this.paint(state));   // now, and on every change\nopen.load();                                       // fresh: nothing. In flight: shared. Else: asks.\n```\n\nIt makes no requests itself: the function can call [FetchManager](/docs/services/fetch-manager), `fetch`, IndexedDB, anything that returns a promise. What it adds:\n\n- **One request per key.** Three components that ask for `['orders', 'open']` at the same time cause one request.\n- **Fresh data is not asked again.** For `staleTime` (30 s) it comes from memory. After that it is shown at once and refreshed behind the screen (stale-while-revalidate).\n- **Invalidation.** After a change, `invalidate(['orders'])` makes everything under that key stale, and what is on screen asks again by itself.\n- **Retries** for failures worth retrying (a 5xx, the network); never for a 4xx.\n- **Cancellation.** A request nobody waits for any more is aborted.\n- **A refresh when the tab comes back** or the network returns, for what is on screen.\n- **Forgetting.** A query nobody watches for `gcTime` (5 min) is dropped.\n\n### When to use it\n- The same server data is shown in several places (a list, a counter in the menu, a detail).\n- Going back to a page should show its data at once, not a skeleton again.\n- After a change (a save, a delete) the parts of the app that show that data should update.\n\n### When not to use it\n- One component shows one set of data, once: give it `load` ([DataList](/docs/data/datalist), [Table](/docs/data/table), [DescriptionList](/docs/data/description-list)). They already show the skeleton, the error and Try again.\n- Data the **app** owns (the session after sign-in, the filters chosen, a cart, a draft): that is a `slice.context`. See [server data and contexts](#queries-and-slicecontext).\n\n## Build it once\n```js\nconst queries = await slice.build('QueryService', {\n  singleton: true,\n  sliceId: 'queries',\n  staleTime: 30_000,        // ms a query is fresh\n  gcTime: 5 * 60_000,       // ms an unwatched query is kept\n  retry: 1,                 // retries for a 5xx or the network\n  retryDelay: 500,          // ms, doubled each time\n  refetchOnFocus: true,     // the tab comes back: refresh what is on screen and stale\n  refetchOnReconnect: true,\n  http,                     // optional: a FetchManager, for queries.get()\n});\n```\n\n## A query\n`queries.query(key, fn, options?)` returns the query's **handle**. The same key always gives the same handle, from anywhere in the app.\n\n- **The key** is an array: `['orders']`, `['orders', 42]`, `['orders', 'list', { page: 2, status: 'open' }]`. Objects in it are compared by value, in any order. Keys are a hierarchy: `['orders']` is the prefix of all the others, and invalidating it reaches them all.\n- **The function** receives `{ signal, key }`. Pass `signal` on, so a cancelled query stops its request.\n- **Options:** `staleTime` and `retry` for this query, and `initialData` (shown at once, as `ready`).\n\n### The state\n| Field | Meaning |\n| --- | --- |\n| `status` | `'idle'` (never asked), `'loading'` (asking, no data yet), `'ready'`, `'error'` |\n| `data` | The last data it got. Kept during a refresh and after a failed refresh. |\n| `error` | The last error (an `HttpError` from FetchManager has `status` and the server's `message`). |\n| `fetching` | `true` while a request runs, also when refreshing data it already has. |\n| `updatedAt` | When `data` arrived (ms). |\n\nShow it like this: `loading` → a skeleton; `ready` + `fetching` → the data, quietly busy; `error` with `data` → the data and a small notice; `error` without → the error and Try again.\n\n### The handle\n| Member | Description |\n| --- | --- |\n| `state`, `data` | Now. |\n| `load({ signal }?)` | Loads if needed: fresh → nothing; in flight → the same request; else asks. Resolves with the data, rejects with the error. Usable as a component's `load`. |\n| `refresh()` | Asks again, keeping the data shown meanwhile. |\n| `watch(component, callback)` | Calls `callback(state)` now and on every change, until `component` is destroyed. Returns a function to stop sooner. |\n| `invalidate()` | Stale now; asks again if someone watches it. |\n| `setData(dataOrUpdater)` | Changes its data without asking the server. |\n\n`watch` is the Slice version of a hook: it ties the subscription to the component, as `slice.context.watch` does, so there is nothing to clean up. Only the watchers of **that** query are called, with a new state object each time.\n\n## The service\n| Method | Description |\n| --- | --- |\n| `query(key, fn, options?)` | A query's handle. |\n| `get(key, url, options?)` | A GET through `http` as a query. |\n| `loader(prefix, fn, options?)` | A `load` for DataList, Table or DescriptionList: each page, search, filter or sort is its own query under `prefix`, cached; an invalidation under `prefix` makes the component load again. `fn(params, { signal })`. |\n| `mutate(fn, { invalidates, onSuccess, onError }?)` | Runs a change; when it succeeds, invalidates each prefix in `invalidates`. Resolves with what `fn` returned; rethrows its error. |\n| `invalidate(prefix?)` | Everything under `prefix` is stale; what is watched asks again now, the rest when it is next used. |\n| `prefetch(key, fn, options?)` | Asks before it is needed. Never throws. |\n| `getData(key)` / `setData(key, dataOrUpdater)` | Read or change a query's data directly. |\n| `remove(prefix?)` | Forgets data (a sign-out). Watchers see `idle`. |\n| `inspect()` | Every query with its state and number of watchers, for debugging. |\n\n## Examples\n\n### One query, three places, a change that updates them all\nA list of orders, a counter of open ones and a line that says when the data arrived, all from the server. **Mark paid** saves with `mutate` and invalidates `['orders']`: the list and the counter ask again by themselves. The line under it counts the requests the server got: running the example again, or going to another page and back within 30 seconds, asks for nothing.\n\n:::script label=\"Orders: a list, a counter and a change\" expected=\"a list of five orders with a badge 'open' or 'paid' and a 'Mark paid' action on the open ones; above, an 'Open' counter badge and a status line; the list shows a skeleton first, then the orders; 'Mark paid' on an order makes the list and the counter update (after a short busy state); the request line counts what the pretend server answered\"\n// A pretend server: 400 ms per answer, counting the requests it gets.\nconst wait = (ms) => new Promise((r) => setTimeout(r, ms));\nconst orders = [\n  { id: 1041, customer: 'Ana López', total: 120, paid: false },\n  { id: 1042, customer: 'Luis Galué', total: 75.5, paid: true },\n  { id: 1043, customer: 'María Ruiz', total: 310, paid: false },\n  { id: 1044, customer: 'Sofía Rey', total: 48, paid: false },\n  { id: 1045, customer: 'Pedro Díaz', total: 199, paid: true },\n];\nconst log = document.createElement('small');\nlog.style.cssText = 'opacity:.7';\nlet requests = 0;\nconst counted = () => { requests += 1; log.textContent = `The server got ${requests} request${requests === 1 ? '' : 's'}.`; };\nconst server = {\n  async list({ signal }) { counted(); await wait(400); signal?.throwIfAborted(); return { items: orders.map((o) => ({ ...o })), total: orders.length }; },\n  async summary() { counted(); await wait(400); return { open: orders.filter((o) => !o.paid).length }; },\n  async markPaid(id) { await wait(400); orders.find((o) => o.id === id).paid = true; return { ok: true }; },\n};\n\n// The service, once for the whole app. Each run of this example starts clean.\nconst queries = await slice.build('QueryService', { singleton: true, sliceId: 'docsQueries' });\nqueries.remove(['docs-orders']);\n\n// The list: each page or search is a query under ['docs-orders', 'list'].\nconst list = await slice.build('DataList', {\n  load: queries.loader(['docs-orders', 'list'], (params, { signal }) => server.list({ signal })),\n  itemKey: 'id',\n  title: 'customer',\n  description: (o) => `Order #${o.id} · $${o.total.toFixed(2)}`,\n  badge: (o) => (o.paid ? { label: 'Paid', tone: 'success' } : { label: 'Open', tone: 'warning' }),\n  actions: [{\n    label: 'Mark paid', icon: 'check-circle', inline: true, hidden: (o) => o.paid,\n    onClick: ({ item }) => queries.mutate(() => server.markPaid(item.id), { invalidates: [['docs-orders']] }).catch(() => {}),\n  }],\n});\n\n// The counter and the status line watch another query.\nconst counter = await slice.build('Badge', { value: 0, tone: 'warning', showZero: true });\nconst status = document.createElement('span');\nstatus.style.cssText = 'font-size:.85rem;opacity:.8';\nconst summary = queries.query(['docs-orders', 'summary'], () => server.summary());\nsummary.watch(counter, (s) => {\n  counter.value = s.data?.open ?? 0;\n  status.textContent = s.status === 'idle' ? ''\n    : s.status === 'loading' ? 'Loading…'\n    : s.fetching ? 'Refreshing…'\n    : s.status === 'error' ? s.error.message\n    : `Updated at ${new Date(s.updatedAt).toLocaleTimeString()}`;\n});\nsummary.load();\n\nconst head = document.createElement('div');\nhead.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap';\nconst label = document.createElement('strong');\nlabel.textContent = 'Open';\nhead.append(label, counter, status);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px';\nbox.append(head, list, log);\nreturn box;\n:::\n\n### Ask before the click\nA detail usually opens after the pointer has been on its link for a few hundred milliseconds. `prefetch` uses that time: when the click comes, the data is there or on its way, and `load` shares the same request.\n\n:::script label=\"Prefetch on hover\" expected=\"three customer buttons and an empty panel; resting the pointer on a button for a moment, then clicking it, shows the customer's details at once; clicking without resting first shows a short skeleton (about 700 ms) before them\"\nconst wait = (ms) => new Promise((r) => setTimeout(r, ms));\nconst people = {\n  7: { name: 'Ana López', email: 'ana@example.com', city: 'Maracaibo', since: '2021-03-14' },\n  8: { name: 'Luis Galué', email: 'luis@example.com', city: 'Caracas', since: '2022-11-02' },\n  9: { name: 'María Ruiz', email: 'maria@example.com', city: 'Valencia', since: '2020-06-21' },\n};\nconst fetchCustomer = async (id, signal) => { await wait(700); signal?.throwIfAborted(); return { id, ...people[id] }; };\n\nconst queries = await slice.build('QueryService', { singleton: true, sliceId: 'docsQueries' });\nqueries.remove(['docs-customer']);\nconst customer = (id) => queries.query(['docs-customer', id], ({ signal }) => fetchCustomer(id, signal));\n\nconst panel = document.createElement('div');\nlet detail = null;\nconst open = async (id) => {\n  if (detail) slice.controller.destroyComponent(detail);\n  detail = await slice.build('DescriptionList', {\n    title: 'Customer',\n    load: customer(id).load,     // the query's load: from memory, shared, or asked\n    fields: [\n      { key: 'name', label: 'Name' },\n      { key: 'email', label: 'Email', type: 'email', copy: true },\n      { key: 'city', label: 'City' },\n      { key: 'since', label: 'Customer since', type: 'date' },\n    ],\n  });\n  panel.replaceChildren(detail);\n};\n\nconst buttons = document.createElement('div');\nbuttons.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';\nfor (const id of [7, 8, 9]) {\n  const button = await slice.build('Button', { value: people[id].name, variant: 'outlined', size: 'sm', onClick: () => open(id) });\n  let timer;\n  button.addEventListener('pointerenter', () => { timer = setTimeout(() => customer(id).load().catch(() => {}), 150); });\n  button.addEventListener('pointerleave', () => clearTimeout(timer));\n  buttons.append(button);\n}\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%;max-width:520px';\nbox.append(buttons, panel);\nreturn box;\n:::\n\n### In a component\nA component watches the queries it shows and starts them in `init()`, **without** `await`: the page shows at once with its skeleton (see [Data and the first load](/docs/guides/data-and-loading)).\n\n```js\nexport default class OrderHeader extends HTMLElement {\n  async init() {\n    this.$count = await slice.build('Badge', { tone: 'warning', showZero: true });\n    this.appendChild(this.$count);\n    this.orders = await slice.build('OrdersService', { singleton: true, sliceId: 'orders' });\n    const summary = this.orders.summary();               // a handle\n    summary.watch(this, (s) => {                    // stops when this component is destroyed\n      this.classList.toggle('is-loading', s.status === 'loading');\n      this.$count.value = s.data?.open ?? 0;\n    });\n    summary.load();                                 // not awaited\n  }\n\n  update() {\n    // A cached route came back: fresh → nothing; stale → shown, and refreshed behind.\n    this.orders?.summary().load();\n  }\n}\n```\n\n### Optimistic: show the change before the server answers\n`setData` changes what is shown now; if the save fails, put it back.\n\n```js\nasync function togglePin(note) {\n  const key = ['notes', 'list'];\n  const before = queries.getData(key);\n  queries.setData(key, (notes) => notes.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)));\n  try {\n    await queries.mutate(() => http.patch(`/notes/${note.id}`, { pinned: !note.pinned }), { invalidates: [['notes']] });\n  } catch (error) {\n    queries.setData(key, before);\n    toast.show({ tone: 'danger', message: error.message });\n  }\n}\n```\n\nFor lists shown in DataList or Table, their own `updateItem(…, { commit })` already does this, with the rollback; give it a `commit` that calls `queries.mutate`.\n\n## Queries and slice.context\nThey hold different things, and they meet in the key.\n\n| | `slice.context` | QueryService |\n| --- | --- | --- |\n| Holds | what the **app** owns: the session, the filters chosen, a cart, a draft, preferences | a **copy** of what the **server** owns: orders, users, products |\n| The truth is | what is in it | on the server; the copy can be old |\n| Adds | state, `watch`, persistence | freshness, `loading`/`error`, one request per key, refresh after a change, cancellation, forgetting |\n\nThe rule: **if reloading the page would have to ask the server for it, it is a query; if the user or the app decides it, it is a context.**\n\nThe usual way they work together: a context says **which** data, the query keeps it.\n\n```js\n// The filters are the app's: a context.\nslice.context.watch('orderFilters', this, (filters) => {\n  this._stop?.();                                      // stop watching the previous filters\n  const page = orders.list(filters);                   // ['orders', 'list', filters]\n  this._stop = page.watch(this, (s) => this.paint(s));\n  page.load();                                         // filters seen before: at once, from memory\n});\n```\n\nAnd the other way: a sign-in answer is server data that becomes the app's. Keep it in a context (persisted, if it must survive a reload), and `remove()` the queries on sign-out so the next user sees nothing of the last one.\n\n## Best practices\n:::tip\n- One `QueryService` for the whole app (`singleton: true`), used through a Service per domain (`OrdersService`): components never build keys or URLs. See [the layers](/docs/guides/data-and-loading#layers-transport-cache-and-your-domain).\n- Keys from general to specific: `['orders']`, `['orders', 'list', params]`, `['orders', id]`. Then `invalidate(['orders'])` after any change to orders is always right.\n- Pass `signal` to the request: a query nobody waits for is cancelled.\n- Never `await` a query in `init()`: `watch`, then `load()`.\n:::\n\n## Pitfalls\n:::warning\nDo not copy query data into a context to share it. The query **is** the shared copy; a second one gets out of date, and then you have two truths. Share the handle (or the domain Service that gives it).\n:::\n\n:::warning\nA key must contain everything the function depends on. A function that reads `page` from outside, with a key that does not include it, returns page 1's cached data for page 2.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const queries = await slice.build('QueryService', { singleton: true, sliceId: 'queries' });\n\nconst open = queries.query(['orders', { status: 'open' }],\n  ({ signal }) => http.get('/orders', { query: { status: 'open' }, signal }));\n\nopen.watch(this, (state) => this.paint(state));   // now, and on every change\nopen.load();                                       // fresh: nothing. In flight: shared. Else: asks.",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const queries = await slice.build('QueryService', {\n  singleton: true,\n  sliceId: 'queries',\n  staleTime: 30_000,        // ms a query is fresh\n  gcTime: 5 * 60_000,       // ms an unwatched query is kept\n  retry: 1,                 // retries for a 5xx or the network\n  retryDelay: 500,          // ms, doubled each time\n  refetchOnFocus: true,     // the tab comes back: refresh what is on screen and stale\n  refetchOnReconnect: true,\n  http,                     // optional: a FetchManager, for queries.get()\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Field | Meaning |","| --- | --- |","| `status` | `'idle'` (never asked), `'loading'` (asking, no data yet), `'ready'`, `'error'` |","| `data` | The last data it got. Kept during a refresh and after a failed refresh. |","| `error` | The last error (an `HttpError` from FetchManager has `status` and the server's `message`). |","| `fetching` | `true` while a request runs, also when refreshing data it already has. |","| `updatedAt` | When `data` arrived (ms). |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| Member | Description |","| --- | --- |","| `state`, `data` | Now. |","| `load({ signal }?)` | Loads if needed: fresh → nothing; in flight → the same request; else asks. Resolves with the data, rejects with the error. Usable as a component's `load`. |","| `refresh()` | Asks again, keeping the data shown meanwhile. |","| `watch(component, callback)` | Calls `callback(state)` now and on every change, until `component` is destroyed. Returns a function to stop sooner. |","| `invalidate()` | Stale now; asks again if someone watches it. |","| `setData(dataOrUpdater)` | Changes its data without asking the server. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Method | Description |","| --- | --- |","| `query(key, fn, options?)` | A query's handle. |","| `get(key, url, options?)` | A GET through `http` as a query. |","| `loader(prefix, fn, options?)` | A `load` for DataList, Table or DescriptionList: each page, search, filter or sort is its own query under `prefix`, cached; an invalidation under `prefix` makes the component load again. `fn(params, { signal })`. |","| `mutate(fn, { invalidates, onSuccess, onError }?)` | Runs a change; when it succeeds, invalidates each prefix in `invalidates`. Resolves with what `fn` returned; rethrows its error. |","| `invalidate(prefix?)` | Everything under `prefix` is stale; what is watched asks again now, the rest when it is next used. |","| `prefetch(key, fn, options?)` | Asks before it is needed. Never throws. |","| `getData(key)` / `setData(key, dataOrUpdater)` | Read or change a query's data directly. |","| `remove(prefix?)` | Forgets data (a sign-out). Watchers see `idle`. |","| `inspect()` | Every query with its state and number of watchers, for debugging. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "export default class OrderHeader extends HTMLElement {\n  async init() {\n    this.$count = await slice.build('Badge', { tone: 'warning', showZero: true });\n    this.appendChild(this.$count);\n    this.orders = await slice.build('OrdersService', { singleton: true, sliceId: 'orders' });\n    const summary = this.orders.summary();               // a handle\n    summary.watch(this, (s) => {                    // stops when this component is destroyed\n      this.classList.toggle('is-loading', s.status === 'loading');\n      this.$count.value = s.data?.open ?? 0;\n    });\n    summary.load();                                 // not awaited\n  }\n\n  update() {\n    // A cached route came back: fresh → nothing; stale → shown, and refreshed behind.\n    this.orders?.summary().load();\n  }\n}",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "async function togglePin(note) {\n  const key = ['notes', 'list'];\n  const before = queries.getData(key);\n  queries.setData(key, (notes) => notes.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)));\n  try {\n    await queries.mutate(() => http.patch(`/notes/${note.id}`, { pinned: !note.pinned }), { invalidates: [['notes']] });\n  } catch (error) {\n    queries.setData(key, before);\n    toast.show({ tone: 'danger', message: error.message });\n  }\n}",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            const lines = ["| | `slice.context` | QueryService |","| --- | --- | --- |","| Holds | what the **app** owns: the session, the filters chosen, a cart, a draft, preferences | a **copy** of what the **server** owns: orders, users, products |","| The truth is | what is in it | on the server; the copy can be old |","| Adds | state, `watch`, persistence | freshness, `loading`/`error`, one request per key, refresh after a change, cancellation, forgetting |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// The filters are the app's: a context.\nslice.context.watch('orderFilters', this, (filters) => {\n  this._stop?.();                                      // stop watching the previous filters\n  const page = orders.list(filters);                   // ['orders', 'list', filters]\n  this._stop = page.watch(this, (s) => this.paint(s));\n  page.load();                                         // filters seen before: at once, from memory\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const links = [{"text":"FetchManager","path":"/docs/services/fetch-manager"},{"text":"DataList","path":"/docs/data/datalist"},{"text":"Table","path":"/docs/data/table"},{"text":"DescriptionList","path":"/docs/data/description-list"},{"text":"Data and the first load","path":"/docs/guides/data-and-loading"},{"text":"the layers","path":"/docs/guides/data-and-loading#layers-transport-cache-and-your-domain"}];
         for (const [index, linkProps] of links.entries()) {
            const placeholder = this.querySelector('[data-inline-link="' + index + '"]');
            if (!placeholder) continue;
            const link = await slice.build('Link', linkProps);
            placeholder.replaceWith(link);
            this._inlineLinks.push(link);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: 'â'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios â€” so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all â€” the divs
      // were never filled, nothing in the repo reads .script-block â€” the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-queryservicedocumentation', QueryServiceDocumentation);
