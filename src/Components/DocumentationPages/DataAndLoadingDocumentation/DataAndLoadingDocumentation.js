export default class DataAndLoadingDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Awaited or not: see the difference","expected":"two buttons; 'Wait for the data' shows nothing for about 1.5 seconds and then the whole record; 'Data after the structure' shows the record's labels with skeleton bars at once and fills them 1.5 seconds later; under each run, how long the first paint and the data took","kind":"script","content":"const fakeServer = () => new Promise((r) => setTimeout(() => r({ name: 'Ana López', email: 'ana@example.com', plan: 'Pro', since: '2023-03-14' }), 1500));\nconst fields = ['name', { key: 'email', type: 'email' }, 'plan', { key: 'since', label: 'Customer since', type: 'date' }];\n\nconst stage = document.createElement('div');\nstage.style.cssText = 'min-height:230px';\nconst timing = document.createElement('p');\ntiming.style.cssText = 'margin:0;font-size:.85rem;opacity:.8;font-variant-numeric:tabular-nums';\n\nconst clear = () => { slice.controller.destroyByContainer(stage); stage.replaceChildren(); timing.textContent = ''; };\n\nconst blocking = await slice.build('Button', {\n  value: 'Wait for the data', variant: 'outlined',\n  onClick: async () => {\n    clear();\n    const start = performance.now();\n    const item = await fakeServer();                      // ❌ awaited before building\n    const view = await slice.build('DescriptionList', { item, fields });\n    stage.append(view);\n    const ms = Math.round(performance.now() - start);\n    timing.textContent = `First paint: ${ms} ms · data: ${ms} ms`;\n  }\n});\nconst streaming = await slice.build('Button', {\n  value: 'Data after the structure', variant: 'filled',\n  onClick: async () => {\n    clear();\n    const start = performance.now();\n    const view = await slice.build('DescriptionList', {\n      fields,\n      load: async () => {                                  // ✅ asked for, not awaited\n        const item = await fakeServer();\n        timing.textContent += ` · data: ${Math.round(performance.now() - start)} ms`;\n        return item;\n      }\n    });\n    stage.append(view);\n    timing.textContent = `First paint: ${Math.round(performance.now() - start)} ms`;\n  }\n});\n\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';\nbar.append(blocking, streaming);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%;max-width:560px';\nbox.append(bar, timing, stage);\nreturn box;"},{"label":"One context, three components, stale-while-revalidate","expected":"a team list, a counter badge and a status line read the same context; on the first run the list shows its skeleton, then the people; Refresh keeps the list on screen and shows 'Refreshing…' in the status line; 'Fail next' makes the next refresh fail: an Alert says so with Try again, and the list keeps the data it had","kind":"script","content":"const wait = (ms) => new Promise((r) => setTimeout(r, ms));\nlet failNext = false;\nlet version = 0;\nconst fetchTeam = async () => {\n  await wait(900);\n  if (failNext) { failNext = false; throw new Error('The server did not answer.'); }\n  version += 1;\n  return [\n    { id: 1, name: 'Ana López', role: 'Design', online: true },\n    { id: 2, name: 'Lucas Molina', role: 'Security', online: version % 2 === 0 },\n    { id: 3, name: 'María Ruiz', role: 'Sales', online: true },\n    ...(version > 1 ? [{ id: 4, name: 'Sofía Rey', role: 'Engineering', online: true }] : [])\n  ];\n};\n\n// The resource (see the code above), in a few lines.\nconst name = 'guideTeam';\nif (!slice.context.has(name)) slice.context.create(name, { status: 'idle', data: null, error: null, updatedAt: 0 });\nlet pending = null;\nconst team = {\n  load({ force = false } = {}) {\n    const { updatedAt } = slice.context.getState(name);\n    if (!force && Date.now() - updatedAt < 30000) return Promise.resolve();\n    if (pending) return pending;\n    slice.context.setState(name, (s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }));\n    pending = fetchTeam()\n      .then((data) => slice.context.setState(name, (s) => ({ ...s, status: 'ready', data, updatedAt: Date.now() })))\n      .catch((error) => slice.context.setState(name, (s) => ({ ...s, status: 'error', error: error.message })))\n      .finally(() => { pending = null; });\n    return pending;\n  }\n};\n\nconst list = await slice.build('DataList', {\n  context: name,\n  contextPath: 'data',\n  title: 'name',\n  description: 'role',\n  avatar: (p) => ({ name: p.name, status: p.online ? 'online' : 'offline' }),\n  loading: true\n});\nconst counter = await slice.build('Badge', { value: 0, tone: 'accent', showZero: true });\nconst status = document.createElement('span');\nstatus.style.cssText = 'font-size:.85rem;opacity:.8';\nconst alert = await slice.build('Alert', { open: false, tone: 'danger', size: 'sm' });\n\nconst paint = (s) => {\n  list.loading = s.status === 'loading';\n  counter.value = (s.data || []).length;\n  status.textContent = s.status === 'loading' ? 'Loading…'\n    : s.status === 'refreshing' ? 'Refreshing…'\n    : s.updatedAt ? `Updated at ${new Date(s.updatedAt).toLocaleTimeString()}` : '';\n  if (s.status === 'error') {\n    alert.show({ message: s.error, actions: [{ label: 'Try again', onClick: () => team.load({ force: true }) }] });\n  } else if (s.status !== 'refreshing') {\n    alert.hide();\n  }\n};\nslice.context.watch(name, list, (s) => paint(s));\npaint(slice.context.getState(name));\nteam.load();\n\nconst refresh = await slice.build('Button', { value: 'Refresh', variant: 'outlined', size: 'sm', onClick: () => team.load({ force: true }) });\nconst fail = await slice.build('Button', { value: 'Fail next', variant: 'ghost', size: 'sm', onClick: () => { failNext = true; } });\n\nconst head = document.createElement('div');\nhead.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap';\nconst label = document.createElement('strong');\nlabel.textContent = 'Team';\nhead.append(label, counter, status, refresh, fail);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px';\nbox.append(head, alert, list);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "guides/data-loading.md";
    this.markdownContent = "---\ntitle: Data and the first load\nroute: /docs/guides/data-and-loading\nnavLabel: Data and loading\nsection: Guides\ngroup: Applications\norder: 1\ndescription: How to bring data from a server into a Slice app without keeping the page behind the loader. Why an awaited fetch in init() slows the first load, and the patterns that avoid it — data that arrives after the structure, a slice.context shared between components, critical data in parallel, refresh in the background, and saving changes.\ncomponent: DataAndLoadingDocumentation\ngenerate: true\ntags: [guide, data, fetch, server, loading, first load, context, skeleton, performance, stale-while-revalidate]\n---\n\n# Data and the first load\n\n## Overview\nAlmost every app shows data from a server. Where you ask for it decides how fast the app feels. This guide explains what Slice waits for before it shows a page, and five patterns that keep pages fast while the data is on its way.\n\nThe short version: **build the page, then bring the data. Never make the page wait for the network.**\n\n## What Slice waits for\nWith `\"loading\": { \"enabled\": true }` in `sliceConfig.json`, Slice shows its loader (`slice.loading`) while it prepares a page: on the first load of the app and on every route change. The router does this:\n\n1. `slice.loading.start()`;\n2. builds the route's component with `await slice.build(...)`. That waits for its `init()`, and inside it, for every `slice.build()` that `init()` awaits, and their `init()`s, all the way down. A cached route that comes back waits for its `update()` instead;\n3. `slice.loading.stop()`.\n\nSo **everything an `init()` awaits happens behind the loader**. One `await fetch(...)` in an `init()` and the whole page waits for the network. In nested components it gets worse: the parent awaits the child, the child awaits its fetch, and the requests run **one after another** instead of together.\n\n```js\n// ❌ The page stays behind the loader until the server answers.\nasync init() {\n  const orders = await fetch('/api/orders').then((r) => r.json());\n  this.$list = await slice.build('DataList', { items: orders });\n  this.appendChild(this.$list);\n}\n```\n\n```js\n// ✅ The page shows at once, with a skeleton; the rows arrive when they arrive.\nasync init() {\n  this.$list = await slice.build('DataList', {\n    load: ({ page, pageSize, search, signal }) => api.orders({ page, pageSize, search, signal }),\n  });\n  this.appendChild(this.$list);\n}\n```\n\nBuilding components is fast and stays awaited: `await slice.build()` is how a component comes to exist. What should not be awaited is **the network**.\n\n:::script label=\"Awaited or not: see the difference\" expected=\"two buttons; 'Wait for the data' shows nothing for about 1.5 seconds and then the whole record; 'Data after the structure' shows the record's labels with skeleton bars at once and fills them 1.5 seconds later; under each run, how long the first paint and the data took\"\nconst fakeServer = () => new Promise((r) => setTimeout(() => r({ name: 'Ana López', email: 'ana@example.com', plan: 'Pro', since: '2023-03-14' }), 1500));\nconst fields = ['name', { key: 'email', type: 'email' }, 'plan', { key: 'since', label: 'Customer since', type: 'date' }];\n\nconst stage = document.createElement('div');\nstage.style.cssText = 'min-height:230px';\nconst timing = document.createElement('p');\ntiming.style.cssText = 'margin:0;font-size:.85rem;opacity:.8;font-variant-numeric:tabular-nums';\n\nconst clear = () => { slice.controller.destroyByContainer(stage); stage.replaceChildren(); timing.textContent = ''; };\n\nconst blocking = await slice.build('Button', {\n  value: 'Wait for the data', variant: 'outlined',\n  onClick: async () => {\n    clear();\n    const start = performance.now();\n    const item = await fakeServer();                      // ❌ awaited before building\n    const view = await slice.build('DescriptionList', { item, fields });\n    stage.append(view);\n    const ms = Math.round(performance.now() - start);\n    timing.textContent = `First paint: ${ms} ms · data: ${ms} ms`;\n  }\n});\nconst streaming = await slice.build('Button', {\n  value: 'Data after the structure', variant: 'filled',\n  onClick: async () => {\n    clear();\n    const start = performance.now();\n    const view = await slice.build('DescriptionList', {\n      fields,\n      load: async () => {                                  // ✅ asked for, not awaited\n        const item = await fakeServer();\n        timing.textContent += ` · data: ${Math.round(performance.now() - start)} ms`;\n        return item;\n      }\n    });\n    stage.append(view);\n    timing.textContent = `First paint: ${Math.round(performance.now() - start)} ms`;\n  }\n});\n\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';\nbar.append(blocking, streaming);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%;max-width:560px';\nbox.append(bar, timing, stage);\nreturn box;\n:::\n\n## Pattern 1 — Let the component load its data\n[DataList](/docs/data/datalist), [Table](/docs/data/table) and [DescriptionList](/docs/data/description-list) take a `load` function. They call it after they are on the page, and they handle every state for you:\n\n- a **skeleton** shaped like the content on the first load;\n- the old content kept, marked busy, when they load again (a new page, a search);\n- an **error with Try again**;\n- a new request **cancels** the previous one (`signal`), and so does leaving the page;\n- `reload()` asks again, and a cached route that comes back reloads by itself.\n\n```js\nconst orders = await slice.build('Table', {\n  rowKey: 'id',\n  pagination: { pageSize: 20 },\n  columns: [{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }, { key: 'total', label: 'Total' }],\n  load: async ({ page, pageSize, search, filters, sort, signal }) => {\n    const res = await fetch(`/api/orders?page=${page}&size=${pageSize}&q=${encodeURIComponent(search)}`, { signal });\n    if (!res.ok) throw new Error(`The server answered ${res.status}`);\n    return res.json(); // { items, total }\n  },\n});\n```\n\nThis is the default. Use it whenever one component shows one set of data.\n\n## Pattern 2 — Share data through a context\nWhen several components show the same data (a list, a counter in the menu, a chart), ask for it **once** and keep it in a context (`slice.context.create(name, …)`). Every component watches the context, so a change anywhere shows everywhere, and nothing is asked twice.\n\n(To create a context from several places safely, keep its creation in one composition-root service; persistence is configured directly on `slice.context.create(name, initial, { persist: true })`. The pattern is the same.)\n\nKeep the request's state in the context next to the data, so every component can show it. A helper like this one lives in a module of your app (for example `src/Components/AppComponents/resources.js`) and is imported with a relative path:\n\n```js\n// A small \"resource\": the data, its state, and one way to load it.\nexport function createResource(name, fetcher, { staleMs = 30_000 } = {}) {\n  if (!slice.context.has(name)) {\n    slice.context.create(name, { status: 'idle', data: null, error: null, updatedAt: 0 });\n  }\n  let pending = null;\n  return {\n    name,\n    get state() { return slice.context.getState(name); },\n    // Fresh enough: nothing to do. Already asking: share that request.\n    load({ force = false } = {}) {\n      const { updatedAt } = slice.context.getState(name);\n      if (!force && Date.now() - updatedAt < staleMs) return Promise.resolve();\n      if (pending) return pending;\n      slice.context.setState(name, (s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }));\n      pending = fetcher()\n        .then((data) => slice.context.setState(name, (s) => ({ ...s, status: 'ready', data, updatedAt: Date.now() })))\n        .catch((error) => slice.context.setState(name, (s) => ({ ...s, status: 'error', error: error.message })))\n        .finally(() => { pending = null; });\n      return pending;\n    },\n  };\n}\n```\n\nThe states mean: `loading` (nothing yet: show a skeleton), `refreshing` (show what you have, quietly busy), `ready`, `error` (keep the old data if there is some, and offer Try again).\n\n:::script label=\"One context, three components, stale-while-revalidate\" expected=\"a team list, a counter badge and a status line read the same context; on the first run the list shows its skeleton, then the people; Refresh keeps the list on screen and shows 'Refreshing…' in the status line; 'Fail next' makes the next refresh fail: an Alert says so with Try again, and the list keeps the data it had\"\nconst wait = (ms) => new Promise((r) => setTimeout(r, ms));\nlet failNext = false;\nlet version = 0;\nconst fetchTeam = async () => {\n  await wait(900);\n  if (failNext) { failNext = false; throw new Error('The server did not answer.'); }\n  version += 1;\n  return [\n    { id: 1, name: 'Ana López', role: 'Design', online: true },\n    { id: 2, name: 'Lucas Molina', role: 'Security', online: version % 2 === 0 },\n    { id: 3, name: 'María Ruiz', role: 'Sales', online: true },\n    ...(version > 1 ? [{ id: 4, name: 'Sofía Rey', role: 'Engineering', online: true }] : [])\n  ];\n};\n\n// The resource (see the code above), in a few lines.\nconst name = 'guideTeam';\nif (!slice.context.has(name)) slice.context.create(name, { status: 'idle', data: null, error: null, updatedAt: 0 });\nlet pending = null;\nconst team = {\n  load({ force = false } = {}) {\n    const { updatedAt } = slice.context.getState(name);\n    if (!force && Date.now() - updatedAt < 30000) return Promise.resolve();\n    if (pending) return pending;\n    slice.context.setState(name, (s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }));\n    pending = fetchTeam()\n      .then((data) => slice.context.setState(name, (s) => ({ ...s, status: 'ready', data, updatedAt: Date.now() })))\n      .catch((error) => slice.context.setState(name, (s) => ({ ...s, status: 'error', error: error.message })))\n      .finally(() => { pending = null; });\n    return pending;\n  }\n};\n\nconst list = await slice.build('DataList', {\n  context: name,\n  contextPath: 'data',\n  title: 'name',\n  description: 'role',\n  avatar: (p) => ({ name: p.name, status: p.online ? 'online' : 'offline' }),\n  loading: true\n});\nconst counter = await slice.build('Badge', { value: 0, tone: 'accent', showZero: true });\nconst status = document.createElement('span');\nstatus.style.cssText = 'font-size:.85rem;opacity:.8';\nconst alert = await slice.build('Alert', { open: false, tone: 'danger', size: 'sm' });\n\nconst paint = (s) => {\n  list.loading = s.status === 'loading';\n  counter.value = (s.data || []).length;\n  status.textContent = s.status === 'loading' ? 'Loading…'\n    : s.status === 'refreshing' ? 'Refreshing…'\n    : s.updatedAt ? `Updated at ${new Date(s.updatedAt).toLocaleTimeString()}` : '';\n  if (s.status === 'error') {\n    alert.show({ message: s.error, actions: [{ label: 'Try again', onClick: () => team.load({ force: true }) }] });\n  } else if (s.status !== 'refreshing') {\n    alert.hide();\n  }\n};\nslice.context.watch(name, list, (s) => paint(s));\npaint(slice.context.getState(name));\nteam.load();\n\nconst refresh = await slice.build('Button', { value: 'Refresh', variant: 'outlined', size: 'sm', onClick: () => team.load({ force: true }) });\nconst fail = await slice.build('Button', { value: 'Fail next', variant: 'ghost', size: 'sm', onClick: () => { failNext = true; } });\n\nconst head = document.createElement('div');\nhead.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap';\nconst label = document.createElement('strong');\nlabel.textContent = 'Team';\nhead.append(label, counter, status, refresh, fail);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:560px';\nbox.append(head, alert, list);\nreturn box;\n:::\n\n## Pattern 3 — Ask early, in parallel\nTwo things make data arrive sooner: asking **before** it is needed, and asking for everything **at the same time**.\n\n- **At the start of the app**, ask for what most pages need (the user, their permissions, the menu), without awaiting it. When a page needs it, it is there or on its way.\n- **When a navigation is likely**, ask then: on hover or focus of a link, `orders.load()`. With the resource above, a second `load()` shares the first request, so asking early costs nothing.\n- **In a route's component**, start every request of the page together and let each part show its own state. Never chain them through nested `init()`s.\n\n```js\n// App start (for example in the App component's init): not awaited.\nsession.load();\nmenu.load();\n\n// A link that will probably be clicked.\nordersLink.addEventListener('pointerenter', () => orders.load(), { once: true });\n```\n\n## Pattern 4 — When the page really cannot show without the data\nSome data decides **what** the page is: whether the user is signed in, whether they may see it, which plan they are on. Waiting for it is correct, but:\n\n- wait only for that, in **one** place (the route's component), with `Promise.all`, never one after another;\n- give it a **time budget**: after it, show the page with what you have and let the rest keep loading;\n- keep it small and cacheable (a session, not the user's whole history).\n\n```js\nasync init() {\n  // Only what decides the page, together, with a budget of 800 ms.\n  const budget = new Promise((resolve) => setTimeout(resolve, 800));\n  await Promise.race([Promise.all([session.load(), permissions.load()]), budget]);\n\n  if (slice.context.getState('permissions').data?.canSeeBilling === false) {\n    slice.router.navigate('/not-allowed');\n    return;\n  }\n  // Everything else: built now, loaded after.\n  this.$invoices = await slice.build('Table', { load: api.invoices, columns: COLUMNS });\n  this.appendChild(this.$invoices);\n}\n```\n\n## Pattern 5 — Coming back to a page\nA route kept in cache runs `update()` when it comes back, and the loader waits for it too. Show what you already have **at once**, and refresh behind it:\n\n```js\nupdate() {\n  // No await: the page is already there; the data catches up.\n  orders.load();          // a resource: does nothing if it is still fresh\n  this.$table.reload();   // or: a component with `load`\n}\n```\n\n## Saving changes\nThe same rule applies the other way: the page stays usable while a change is saved.\n\n- **List changes are optimistic.** `addItem`, `updateItem` and `removeItem` (`addRow`… in Table) show the change at once and run your `commit`. If it fails, the change is taken back and an [Alert](/docs/feedback/alert) says so. `removeItem(keys, { undo: true, commit })` gives an Undo before the server is asked at all.\n- **Field and cell edits are commit-first.** In DescriptionList and Table the edited value shows busy while `commit` runs, and the record changes when it succeeds. If it fails, the old value stays and the field shows the error.\n- **Throw with a message people can act on.** \"Prices over 1,000 need approval.\" shows on the field and on the bar; \"Error 500\" helps nobody.\n\n```js\nlist.removeItem(order.id, {\n  undo: true,\n  commit: () => api.deleteOrder(order.id),   // runs when the undo time is over\n});\n\ntable.commit = async ({ row, key, value }) => {\n  const res = await fetch(`/api/products/${row.id}`, { method: 'PATCH', body: JSON.stringify({ [key]: value }) });\n  if (!res.ok) throw new Error((await res.json()).message);\n  return res.json(); // the server's version of the row\n};\n```\n\n## The app's own loader\n`sliceConfig.loading` sets how [Loading](/docs/feedback/loading) looks while a page is prepared:\n\n- `delayMs`: work that ends before this shows nothing. Use 150–300 ms, so fast route changes do not flash.\n- `minVisibleMs`: once shown, it stays at least this long, so it does not blink.\n- `welcome`: a branded screen for the first load of the app.\n\nNone of this makes a slow `init()` fast. It only makes the wait look better. The real fix is the rule at the top.\n\n## Checklist\n:::tip\n- `init()` and `update()` build and return; they never `await` the network.\n- One set of data, one component: give it `load`.\n- Data several components show: a context with its state (`loading`, `refreshing`, `ready`, `error`), asked for once.\n- Requests start early and together; only what decides the page is awaited, with a time budget.\n- Every place that shows data has a skeleton, an empty state, and an error with Try again.\n- Changes: lists optimistic with rollback (and Undo for removals), fields commit-first; errors say what to do.\n:::\n\n## Pitfalls\n:::warning\n`Promise.all` over requests that do not depend on each other, not a `for` with an `await` inside: five requests of 300 ms take 300 ms together, and 1.5 s in a row.\n:::\n\n:::warning\nDo not hide a slow request behind a longer `minVisibleMs` or a nicer welcome screen. Measure the first paint (as in the first example) and move the request out of `init()`.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// ❌ The page stays behind the loader until the server answers.\nasync init() {\n  const orders = await fetch('/api/orders').then((r) => r.json());\n  this.$list = await slice.build('DataList', { items: orders });\n  this.appendChild(this.$list);\n}",
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
               value: "// ✅ The page shows at once, with a skeleton; the rows arrive when they arrive.\nasync init() {\n  this.$list = await slice.build('DataList', {\n    load: ({ page, pageSize, search, signal }) => api.orders({ page, pageSize, search, signal }),\n  });\n  this.appendChild(this.$list);\n}",
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
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const orders = await slice.build('Table', {\n  rowKey: 'id',\n  pagination: { pageSize: 20 },\n  columns: [{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }, { key: 'total', label: 'Total' }],\n  load: async ({ page, pageSize, search, filters, sort, signal }) => {\n    const res = await fetch(`/api/orders?page=${page}&size=${pageSize}&q=${encodeURIComponent(search)}`, { signal });\n    if (!res.ok) throw new Error(`The server answered ${res.status}`);\n    return res.json(); // { items, total }\n  },\n});",
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
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// A small \"resource\": the data, its state, and one way to load it.\nexport function createResource(name, fetcher, { staleMs = 30_000 } = {}) {\n  if (!slice.context.has(name)) {\n    slice.context.create(name, { status: 'idle', data: null, error: null, updatedAt: 0 });\n  }\n  let pending = null;\n  return {\n    name,\n    get state() { return slice.context.getState(name); },\n    // Fresh enough: nothing to do. Already asking: share that request.\n    load({ force = false } = {}) {\n      const { updatedAt } = slice.context.getState(name);\n      if (!force && Date.now() - updatedAt < staleMs) return Promise.resolve();\n      if (pending) return pending;\n      slice.context.setState(name, (s) => ({ ...s, status: s.data ? 'refreshing' : 'loading', error: null }));\n      pending = fetcher()\n        .then((data) => slice.context.setState(name, (s) => ({ ...s, status: 'ready', data, updatedAt: Date.now() })))\n        .catch((error) => slice.context.setState(name, (s) => ({ ...s, status: 'error', error: error.message })))\n        .finally(() => { pending = null; });\n      return pending;\n    },\n  };\n}",
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
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// App start (for example in the App component's init): not awaited.\nsession.load();\nmenu.load();\n\n// A link that will probably be clicked.\nordersLink.addEventListener('pointerenter', () => orders.load(), { once: true });",
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
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "async init() {\n  // Only what decides the page, together, with a budget of 800 ms.\n  const budget = new Promise((resolve) => setTimeout(resolve, 800));\n  await Promise.race([Promise.all([session.load(), permissions.load()]), budget]);\n\n  if (slice.context.getState('permissions').data?.canSeeBilling === false) {\n    slice.router.navigate('/not-allowed');\n    return;\n  }\n  // Everything else: built now, loaded after.\n  this.$invoices = await slice.build('Table', { load: api.invoices, columns: COLUMNS });\n  this.appendChild(this.$invoices);\n}",
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
               value: "update() {\n  // No await: the page is already there; the data catches up.\n  orders.load();          // a resource: does nothing if it is still fresh\n  this.$table.reload();   // or: a component with `load`\n}",
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
            const code = await slice.build('CodeVisualizer', {
               value: "list.removeItem(order.id, {\n  undo: true,\n  commit: () => api.deleteOrder(order.id),   // runs when the undo time is over\n});\n\ntable.commit = async ({ row, key, value }) => {\n  const res = await fetch(`/api/products/${row.id}`, { method: 'PATCH', body: JSON.stringify({ [key]: value }) });\n  if (!res.ok) throw new Error((await res.json()).message);\n  return res.json(); // the server's version of the row\n};",
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
         const links = [{"text":"DataList","path":"/docs/data/datalist"},{"text":"Table","path":"/docs/data/table"},{"text":"DescriptionList","path":"/docs/data/description-list"},{"text":"Alert","path":"/docs/feedback/alert"},{"text":"Loading","path":"/docs/feedback/loading"}];
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
      label: 'Copy as markdown'
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

customElements.define('slice-dataandloadingdocumentation', DataAndLoadingDocumentation);
