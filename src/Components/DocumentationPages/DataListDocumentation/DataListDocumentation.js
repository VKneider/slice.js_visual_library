export default class DataListDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Team directory","expected":"a searchable list of people: avatar with status, name, email, city and role with icons, and an Active/Away badge; a City filter and a sort menu; clicking a person opens their card in a Modal","kind":"script","content":"const people = [\n  { id: 1, name: 'José Pérez', email: 'jose@acme.com', city: 'Maracaibo', role: 'Engineering', active: true },\n  { id: 2, name: 'Ana López', email: 'ana@acme.com', city: 'Caracas', role: 'Design', active: true },\n  { id: 3, name: 'Luis Galué', email: 'luis@acme.com', city: 'Valencia', role: 'Security', active: false },\n  { id: 4, name: 'María Ruiz', email: 'maria@acme.com', city: 'Caracas', role: 'Sales', active: true },\n  { id: 5, name: 'Andrés Bello', email: 'andres@acme.com', city: 'Mérida', role: 'Support', active: false },\n  { id: 6, name: 'Sofía Rey', email: 'sofia@acme.com', city: 'Maracaibo', role: 'Engineering', active: true }\n];\n\nconst team = await slice.build('DataList', {\n  items: people,\n  title: 'name',\n  description: 'email',\n  avatar: (p) => ({ name: p.name, status: p.active ? 'online' : 'offline' }),\n  meta: [{ value: 'city', icon: 'map-pin' }, { value: 'role', icon: 'briefcase' }],\n  badge: (p) => ({ label: p.active ? 'Active' : 'Away', tone: p.active ? 'success' : 'neutral' }),\n  searchable: true,\n  filters: [{ key: 'city', label: 'City' }],\n  sortOptions: [{ key: 'name', label: 'Name' }, { key: 'city', label: 'City' }],\n  onItemClick: async (person) => {\n    const avatar = await slice.build('Avatar', { name: person.name, size: 'xl', status: person.active ? 'online' : 'offline' });\n    const modal = await slice.build('Modal', {\n      title: person.name, description: `${person.role} · ${person.city}`, size: 'sm', destroyOnClose: true,\n      content: [avatar, person.email], actions: [{ value: 'Close', variant: 'ghost' }]\n    });\n    document.body.append(modal);\n    await modal.show();\n  }\n});\nteam.style.width = '100%';\nreturn team;"},{"label":"Inbox: groups by day, selection and undo","expected":"messages grouped Today / Yesterday / This week, unread ones with a dot badge; each row has Archive on it and a menu with Mark as read and Delete; selecting several shows Mark read and Archive for all; Archive removes the row with an Undo bar","kind":"script","content":"const hour = 3600 * 1000;\nconst now = Date.now();\nconst messages = [\n  { id: 1, from: 'Ana López', subject: 'Release notes for 3.4', preview: 'I wrote the draft, can you check the API part?', at: now - 0.5 * hour, unread: true },\n  { id: 2, from: 'GitHub', subject: '[slice.js] New issue #412', preview: 'Router: params with dots are not parsed', at: now - 3 * hour, unread: true },\n  { id: 3, from: 'Luis Galué', subject: 'VM access', preview: 'Your key is on the server now.', at: now - 26 * hour, unread: false },\n  { id: 4, from: 'María Ruiz', subject: 'Demo on Friday', preview: 'The client wants to see the dashboard.', at: now - 30 * hour, unread: true },\n  { id: 5, from: 'Billing', subject: 'Invoice October', preview: 'Your invoice is ready.', at: now - 4 * 24 * hour, unread: false }\n];\n\nconst inbox = await slice.build('DataList', {\n  items: messages,\n  title: 'subject',\n  description: 'preview',\n  avatar: (m) => ({ name: m.from }),\n  meta: [{ value: 'from' }],\n  badge: (m) => (m.unread ? { dot: true, label: 'Unread', tone: 'accent' } : null),\n  timestamp: 'at',\n  groupBy: { key: 'at', by: 'day' },\n  selection: 'multiple',\n  maxHeight: '420px',\n  actions: [\n    { label: 'Archive', icon: 'archive', inline: true, iconOnly: true,\n      onClick: ({ item, list }) => list.removeItem(item.id, { undo: true }) },\n    { label: 'Mark as read', icon: 'envelope-open', hidden: (m) => !m.unread,\n      onClick: ({ item, list }) => list.updateItem(item.id, { unread: false }) },\n    'separator',\n    { label: 'Delete', icon: 'trash-bin', danger: true, confirm: { title: 'Delete this message?', text: 'It cannot be recovered.' },\n      onClick: ({ item, list }) => list.removeItem(item.id) }\n  ],\n  bulkActions: [\n    { label: 'Mark read', icon: 'envelope-open', onClick: ({ items, list }) => items.forEach((m) => list.updateItem(m.id, { unread: false })) },\n    { label: 'Archive', icon: 'archive', onClick: ({ keys, list }) => list.removeItem(keys, { undo: true }) }\n  ]\n});\ninbox.style.width = '100%';\nreturn inbox;"},{"label":"Tasks: a CRUD on slice.context","expected":"a task list with views All / To do / Done and their counts, and a 'New task' button; a badge above the list counts the open tasks from the same store; New opens a Modal and adds the task at the top; Edit changes it; Done toggles it; Delete asks first; about one save in four fails on purpose and the change is taken back with a message","kind":"script","content":"if (!slice.context.has('docs-tasks')) {\n  slice.context.create('docs-tasks', { items: [\n    { id: 't1', title: 'Write the release notes', owner: 'Ana López', done: false, tags: ['docs'] },\n    { id: 't2', title: 'Fix the router params bug', owner: 'José Pérez', done: false, tags: ['bug', 'router'] },\n    { id: 't3', title: 'Record the demo video', owner: 'María Ruiz', done: true, tags: ['marketing'] }\n  ] });\n}\n\n// A pretend API that fails now and then, to show the rollback.\nconst api = {\n  save: (task) => new Promise((resolve, reject) => setTimeout(() => (Math.random() < 0.25 ? reject(new Error('Network error')) : resolve(task)), 600))\n};\n\nasync function editor(task = {}) {\n  const title = await slice.build('Input', { label: 'Title', value: task.title ?? '' });\n  const owner = await slice.build('Input', { label: 'Owner', value: task.owner ?? '' });\n  const fields = document.createElement('div');\n  fields.style.cssText = 'display:grid;gap:12px';\n  fields.append(title, owner);\n  const modal = await slice.build('Modal', {\n    title: task.id ? 'Edit task' : 'New task', size: 'sm', destroyOnClose: true, content: fields,\n    actions: [{ value: 'Cancel', variant: 'ghost' }, { value: 'Save', close: 'save' }]\n  });\n  document.body.append(modal);\n  const { returnValue } = await modal.show();\n  if (returnValue !== 'save' || !title.value.trim()) return null;\n  return { title: title.value.trim(), owner: owner.value.trim() };\n}\n\nconst tasks = await slice.build('DataList', {\n  context: 'docs-tasks',\n  title: 'title',\n  avatar: (t) => (t.owner ? { name: t.owner } : null),\n  description: (t) => t.owner || 'Unassigned',\n  tags: 'tags',\n  badge: (t) => (t.done ? { label: 'Done', tone: 'success' } : { label: 'To do', tone: 'warning' }),\n  views: [{ id: 'all', label: 'All' }, { id: 'todo', label: 'To do', filter: (t) => !t.done }, { id: 'done', label: 'Done', filter: (t) => t.done }],\n  searchable: true,\n  createAction: {\n    label: 'New task',\n    onClick: async ({ list }) => {\n      const values = await editor();\n      if (values) list.addItem({ id: `t${Date.now()}`, done: false, tags: [], ...values }, { commit: () => api.save(values) });\n    }\n  },\n  actions: [\n    { label: 'Done', icon: 'check', inline: true, hidden: (t) => t.done,\n      onClick: ({ item, list }) => list.updateItem(item.id, { done: true }, { commit: (after) => api.save(after) }) },\n    { label: 'Edit', icon: 'edit',\n      onClick: async ({ item, list }) => {\n        const values = await editor(item);\n        if (values) list.updateItem(item.id, values, { commit: (after) => api.save(after) });\n      } },\n    { label: 'Reopen', icon: 'refresh', hidden: (t) => !t.done, onClick: ({ item, list }) => list.updateItem(item.id, { done: false }) },\n    'separator',\n    { label: 'Delete', icon: 'trash-bin', danger: true, confirm: 'Delete this task?',\n      onClick: ({ item, list }) => list.removeItem(item.id, { undo: true, commit: () => api.save(item) }) }\n  ],\n  emptyState: { icon: 'check', title: 'No tasks', description: 'Add the first one with New task.' }\n});\n\n// Another component reading the same store: no wiring with the list.\nconst open = await slice.build('Badge', { tone: 'warning', value: 0 });\nslice.context.watch('docs-tasks', open, (count) => { open.value = count; }, (s) => s.items.filter((t) => !t.done).length);\nopen.value = slice.context.getState('docs-tasks').items.filter((t) => !t.done).length;\n\nconst header = document.createElement('div');\nheader.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:600';\nheader.append('Open tasks', open);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(header, tasks);\nreturn box;"},{"label":"Orders from a server","expected":"orders loaded page by page from a pretend server (a short wait each time, with placeholders the first time); search, a Status filter, sort by date or total, and a pager with '1–10 of 64'; the 'Fail next request' switch makes the next load fail and shows Try again","kind":"script","content":"const statuses = ['Paid', 'Shipped', 'Refunded', 'Pending'];\nconst db = Array.from({ length: 64 }, (_, i) => ({\n  id: 5000 + i,\n  customer: ['Ana López', 'José Pérez', 'María Ruiz', 'Luis Galué', 'Sofía Rey'][i % 5],\n  total: Math.round((20 + ((i * 37) % 480)) * 100) / 100,\n  status: statuses[i % 4],\n  date: new Date(Date.now() - i * 7 * 3600 * 1000).toISOString()\n}));\nlet failNext = false;\n\n// The \"server\": filters, sorts and pages, like a real API would.\nasync function server({ page, pageSize, search, filters, sort, signal }) {\n  await new Promise((r) => setTimeout(r, 500));\n  if (signal.aborted) throw new DOMException('aborted', 'AbortError');\n  if (failNext) { failNext = false; throw new Error('503 Service Unavailable'); }\n  let rows = db.filter((o) => !search || `${o.id} ${o.customer}`.toLowerCase().includes(search.toLowerCase()));\n  for (const f of filters) rows = rows.filter((o) => f.values.includes(o[f.key]));\n  if (sort) rows = [...rows].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * (sort.direction === 'desc' ? -1 : 1));\n  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };\n}\n\nconst money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });\nconst tone = { Paid: 'success', Shipped: 'info', Refunded: 'danger', Pending: 'warning' };\n\nconst orders = await slice.build('DataList', {\n  load: server,\n  title: (o) => `Order #${o.id}`,\n  description: 'customer',\n  icon: 'receipt',\n  value: (o) => money.format(o.total),\n  badge: (o) => ({ label: o.status, tone: tone[o.status] }),\n  timestamp: 'date',\n  searchable: true,\n  filters: [{ key: 'status', label: 'Status', options: statuses }],\n  sortOptions: [{ key: 'date', label: 'Date', direction: 'desc' }, { key: 'total', label: 'Total', direction: 'desc' }],\n  sort: { key: 'date', direction: 'desc' },\n  pagination: { pageSize: 10 },\n  variant: 'separated'\n});\n\nconst fail = await slice.build('Switch', { label: 'Fail next request', onChange: (on) => { failNext = on; } });\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(fail, orders);\nreturn box;"},{"label":"Activity feed with infinite scrolling","expected":"a box of activity entries that loads 15 more each time its end comes near, with 'Loading…' while it does, until 'That is everything.'","kind":"script","content":"const verbs = ['commented on', 'closed', 'opened', 'merged', 'reviewed'];\nconst people = ['Ana', 'José', 'María', 'Luis', 'Sofía'];\nconst feed = await slice.build('DataList', {\n  load: async ({ page, pageSize }) => {\n    await new Promise((r) => setTimeout(r, 400));\n    const from = (page - 1) * pageSize;\n    const items = Array.from({ length: Math.max(0, Math.min(pageSize, 70 - from)) }, (_, i) => {\n      const n = from + i;\n      return { id: n, who: people[n % 5], text: `${people[n % 5]} ${verbs[n % 5]} issue #${900 - n}`, at: Date.now() - n * 47 * 60 * 1000 };\n    });\n    return { items, total: 70 };\n  },\n  title: 'text',\n  avatar: (a) => ({ name: a.who, size: 'sm' }),\n  timestamp: 'at',\n  pagination: 'infinite',\n  pageSize: 15,\n  maxHeight: '360px',\n  variant: 'ghost',\n  density: 'compact'\n});\nfeed.style.width = '100%';\nreturn feed;"},{"label":"Files as cards","expected":"a grid of file cards with an icon, the name, its size and date, and a menu with Rename and Delete; Rename changes the card in place","kind":"script","content":"const files = [\n  { id: 'f1', name: 'Q3 report.pdf', icon: 'file-pdf', size: '2.4 MB', kind: 'PDF', at: Date.now() - 2 * 3600e3 },\n  { id: 'f2', name: 'Team photo.jpg', icon: 'image', size: '5.1 MB', kind: 'Image', at: Date.now() - 26 * 3600e3 },\n  { id: 'f3', name: 'Budget 2027.csv', icon: 'file-csv', size: '84 KB', kind: 'Sheet', at: Date.now() - 5 * 86400e3 },\n  { id: 'f4', name: 'Pitch deck.pptx', icon: 'file-ppt', size: '12 MB', kind: 'Slides', at: Date.now() - 9 * 86400e3 },\n  { id: 'f5', name: 'Contract.docx', icon: 'file-word', size: '310 KB', kind: 'Document', at: Date.now() - 40 * 86400e3 }\n];\nconst grid = await slice.build('DataList', {\n  items: files,\n  title: 'name',\n  icon: 'icon',\n  meta: [{ value: 'size' }, { value: 'kind' }],\n  timestamp: 'at',\n  layout: 'grid',\n  minItemWidth: 220,\n  actions: [\n    { label: 'Rename', icon: 'edit', onClick: ({ item, list }) => list.updateItem(item.id, { name: item.name.replace(/(\\.\\w+)$/, ' (renamed)$1') }) },\n    { label: 'Delete', icon: 'trash-bin', danger: true, onClick: ({ item, list }) => list.removeItem(item.id, { undo: true }) }\n  ]\n});\ngrid.style.width = '100%';\nreturn grid;"}];
  }

  async init() {
    this.markdownPath = "datalist.md";
    this.markdownContent = "---\ntitle: DataList\nroute: /docs/data/datalist\nnavLabel: DataList\nsection: Data\ngroup: Tables\norder: 12\ndescription: The list of records an app works with — people, orders, tasks, files. Rows or cards with avatars, details, status and actions; search, views, filters, sort and groups; selection with bulk actions; create, edit and delete with undo and rollback; pages, load more or infinite scrolling; local data, a slice.context store or a server.\ncomponent: DataListDocumentation\ngenerate: true\ntags: [datalist, list, crud, records, actions, selection, infinite, pagination, context]\n---\n\n# DataList\n\n## Overview\n`DataList` shows the records an app works with: the people in a team, the orders of a shop, the tasks of a project, the files of a folder. Each record is a row (or a card) with a title, its details, a status and its actions, and the list adds what an app always needs around them:\n\n- **finding things**: search, quick views (\"Open 12 · Mine 5\"), filters, sort and groups;\n- **acting on things**: buttons and a ⋯ menu per item, selection, and actions on many items at once;\n- **changing things**: `addItem`, `updateItem` and `removeItem`, shown at once and taken back if the server says no, with Undo for removals;\n- **a lot of things**: pages, \"Load more\" or infinite scrolling, from memory or from a server.\n\n### When to use it\n- **Records people scan and act on**: a member list, an inbox, orders, tickets, files.\n- **Phones and narrow panels.** A row carries a title, two lines of details and a status, so nothing scrolls sideways. On a narrow list the row buttons move into the ⋯ menu by themselves.\n- **CRUD screens**: a list with \"New\", edit and delete.\n\n### When not to use it\n- **Records people compare column by column**, such as prices, dates and amounts side by side, or that they sort by any column. Use [Table](/docs/data/table).\n- **A tree** (folders inside folders): use [TreeView](/docs/navigation/treeview).\n- **A short, fixed list of links or options**: a [SideMenu](/docs/navigation/side-menu) or a [Select](/docs/input/select).\n\n## Coming from React or Vue\nDataList is plain Slice: you build it with props, it calls you back with functions, and it destroys what it builds. The ideas map one to one:\n\n| You would write… | In Slice |\n| --- | --- |\n| `const [items, setItems] = useState([])` / `ref([])` | `items: [...]` and set `list.items` again, or a store: `slice.context.create('tasks', { items: [] })` |\n| `<List items={items} renderItem={…} />` | `slice.build('DataList', { items, title: 'name', … })` or `renderItem: (item) => node` |\n| `onClick={() => edit(item)}` | `actions: [{ label: 'Edit', onClick: ({ item }) => edit(item) }]` |\n| `useQuery` / a `fetch` in `useEffect` | `load: async ({ page, search, signal }) => …` |\n| optimistic updates with rollback | `list.updateItem(id, changes, { commit: () => api.save(…) })` |\n| a store several components read (Pinia, Redux) | `context: 'tasks'`: the list follows `slice.context`, and its changes go back to it |\n| unmount cleanup | automatic: destroying the list destroys every component it built |\n\n## Step by step\n\n### 1. Your first list\nGive it `items` and say what each item shows. Every part takes a **key** (`'name'`), a **path** (`'owner.name'`) or a **function** (`(item) => …`):\n\n```js\nconst team = await slice.build('DataList', {\n  items: people,\n  title: 'name',\n  description: 'email',\n  avatar: { src: 'photo', name: 'name' },   // Avatar props, read from the item\n  meta: [{ value: 'city', icon: 'map-pin' }, { value: 'role' }],\n  badge: (p) => ({ label: p.active ? 'Active' : 'Away', tone: p.active ? 'success' : 'neutral' }),\n});\n```\n\nThe parts an item can have:\n\n| Part | What it is |\n| --- | --- |\n| `title` | The main line (`'title'` by default). |\n| `description` | A quieter line under it. |\n| `avatar` / `icon` / `image` | What is on the left: an [Avatar](/docs/display/avatar) (`{ src, name, status }`), an icon name, or a picture. |\n| `meta` | Small facts with icons: `[{ value: 'city', icon: 'map-pin' }]`. `format(value, item)` changes how one reads. |\n| `tags` | An array of words or [Chip](/docs/display/chip) props. |\n| `badge` | A status on the right ([Badge](/docs/display/badge) props, a word or a number). |\n| `value` | A figure on the right, such as an amount. |\n| `timestamp` | A date, shown as \"3 hours ago\", with the full date on hover. |\n| `renderItem(item)` | Draw the middle part yourself; the avatar, status and actions still go around it. |\n\n### 2. Opening an item\n- `path: (item) => '/orders/' + item.id` makes the title a real link that goes through `slice.router`. The whole row is the link's hit area, and Ctrl/⌘-click opens a new tab.\n- `href` does the same for addresses outside the app.\n- `onItemClick(item, { event, list })` does anything else, such as opening a [Modal](/docs/feedback/modal).\n\n### 3. Finding things\n```js\nsearchable: true,                                   // a search box\nsortOptions: [{ key: 'createdAt', label: 'Newest', direction: 'desc' }, { key: 'name', label: 'Name' }],\nviews: [{ label: 'All' }, { label: 'Open', filter: (o) => o.status === 'open' }],\nfilters: [{ key: 'city', label: 'City' }],          // options come from the data\ngroupBy: { key: 'createdAt', by: 'day' },           // Today, Yesterday, This week…\n```\n\n- **Search** ignores case and accents (\"jose\" finds \"José\"), and every word must match. It looks at the title, description, meta and tags, or at `searchFields`.\n- **Views** are quick filters with counts. Each has a `filter(item)`, or none for \"All\".\n- **Filters** are menus: \"City: Caracas ▾\". Their options come from the data (with counts), or from `options`. `type: 'boolean'` gives Any / Yes / No, `multiple: false` allows one value, and `match(item, values)` decides for you.\n- **Sort** is a menu of `sortOptions`. Each option has a `key` (or a path in `value`), a starting `direction`, or `compare(a, b)` of its own.\n- **Groups**: `groupBy` takes a key, `{ key, by: 'letter' }` (A, B, C…) or `{ key, by: 'day' }`. Headings stay on top while scrolling. `collapsibleGroups` lets people fold them, and `groupLabel(key, items)` and `groupOrder` change the heading texts and their order.\n- When nothing matches, the list says so and offers to clear the search and filters.\n\n### 4. Actions and selection\n```js\nactions: [\n  { label: 'Edit', icon: 'edit', inline: true, onClick: ({ item }) => openEditor(item) },\n  { label: 'Archive', icon: 'archive', hidden: (o) => o.archived, onClick: … },\n  'separator',\n  { label: 'Delete', icon: 'trash-bin', danger: true, confirm: 'Delete this order?', onClick: … },\n],\nselection: 'multiple',\nbulkActions: [{ label: 'Archive', icon: 'archive', onClick: ({ items }) => … }],\n```\n\n- `inline: true` puts an action on the row as a button. The rest go in the ⋯ menu, and on a narrow list (under 520px) all of them do.\n- `hidden` and `disabled` take `true` or a function of the item. `actions` itself can be a function of the item.\n- `confirm` asks first, in a Modal: `true`, a question, or `{ title, text, confirmLabel }`.\n- Every `onClick` receives `{ item, items, keys, list, event }`.\n- `selection: 'multiple'` adds a checkbox per row and a \"Select all\" bar. Shift+click selects a range, and \"Select all\" takes every item that passes the search and filters. When something is selected, the bar shows the `bulkActions`, which receive the selected `items`. A bulk action clears the selection afterwards, unless it has `keepSelection: true`.\n- A click on a row that opens nothing selects it. **Space** selects the focused row.\n- The selection is kept **by key** (`itemKey`, `'id'` by default), so it survives new data. `selected` sets it, `getSelectedItems()` reads it, and `onSelectionChange(keys, items)` reports it.\n\n### 5. Create, edit and delete\nThree methods, the same three a store would have:\n\n```js\nawait list.addItem(newTask, { commit: () => api.create(newTask) });\nawait list.updateItem(task.id, { done: true }, { commit: (after) => api.save(after) });\nawait list.removeItem(task.id, { undo: true, commit: ([task]) => api.delete(task.id) });\n```\n\n- **The change shows at once.** With `commit`, the item is marked busy (a line moves under it, its actions wait) until the promise settles.\n- **If `commit` fails, the change is taken back**: the new item leaves, the edited one goes back as it was, and the removed ones return to their places. A bar says \"The change could not be saved\", and `onError(error, { type, item })` reports it.\n- **`addItem`**: `position: 'start'` (default), `'end'` or an index. The new row is scrolled into view and flashes. If `commit` returns an object (the server's version, with its real id and dates), it is merged into the item.\n- **`updateItem`**: `changes` is an object to merge, or a function from the item to one. Only that row is redrawn.\n- **`removeItem`**: one key or an array. With `undo: true`, a bar says \"“Buy milk” removed · Undo\" for five seconds, and `commit` runs only when that time is over, or the bar is closed. Undo brings the items back and nothing reaches the server. Without `undo`, `commit` runs right away.\n- `createAction: { label, icon, onClick }` adds a \"New\" button to the toolbar.\n\n> Why `addItem` and not `add`? Slice calls a component's `update()` when a cached route comes back, so the list keeps that name for the framework, and uses `addItem`, `updateItem` and `removeItem` for your data.\n\n### 6. Sharing the data: `slice.context`\nWith `context: 'tasks'`, the items live in a `slice.context` store (the framework's shared state) instead of the list:\n\n```js\nslice.context.create('tasks', { items: await api.tasks() });\n\nconst list = await slice.build('DataList', { context: 'tasks', title: 'title' });\nconst counter = await slice.build('Badge', {});\nslice.context.watch('tasks', counter, (items) => { counter.value = items.filter((t) => !t.done).length; }, (s) => s.items);\n```\n\n- The list redraws whenever the store changes, whoever changed it.\n- `addItem`, `updateItem` and `removeItem` write to the store, so the counter above follows the list without any wiring.\n- `contextPath` is where the array sits in the state (`'items'` by default; a state that is an array is used as it is).\n\n### 7. Lots of items\n`pagination` decides how many show at a time (`pageSize`, 20 by default):\n\n- `{ pageSize: 20 }` (or `true`): pages, with a [Pagination](/docs/data/pagination) control and \"21–40 of 342\".\n- `'load-more'`: a \"Load more\" button under the list.\n- `'infinite'`: the next slice loads as the end comes into view, through [InfiniteScrollService](/docs/services/infinite-scroll). Give the list a `maxHeight` to scroll inside it, or it follows the page.\n\n### 8. Data from a server\nGive `load` instead of `items`. It is called with the query, and returns the items of that page:\n\n```js\nload: async ({ page, pageSize, search, filters, sort, view, signal }) => {\n  const res = await fetch(`/api/orders?page=${page}&size=${pageSize}&q=${encodeURIComponent(search)}`, { signal });\n  return res.json();       // { items: [...], total: 342 }  (or just an array)\n},\n```\n\n- It is called again when the search, a view, a filter, the sort or the page changes. The request in flight is aborted (`signal`), and a late answer is dropped.\n- While it loads, the list shows placeholders (the first time) or dims the rows. If it fails, the list says so, with a **Try again** button.\n- With `pagination: 'load-more'` or `'infinite'`, pages are added to the ones already shown. Return `done: true`, or fewer items than `pageSize`, at the end.\n- `filters` arrive as `[{ key, values }]`, `sort` as `{ key, direction }` and `view` as the view's id.\n- Filter options cannot come from the data here: give them `options`. View counts appear when a view has a `count`.\n- `refresh()` loads the current page again. `onQueryChange(query)` reports every change, for example to put it in the URL.\n\n## Looks\n- `layout`: `'list'` (default) or `'grid'`, cards in columns at least `minItemWidth` wide (260px).\n- `variant`:\n  - `'outlined'` (default): one box with lines between the rows;\n  - `'separated'`: one card per row;\n  - `'filled'`: tinted rows;\n  - `'ghost'`: lines only.\n- `density`: `'compact'`, `'comfortable'` (default) or `'spacious'`.\n- `maxHeight` makes the list scroll inside itself, with group headings that stay on top.\n- `loading` shows placeholders (or dims the rows) for data you load yourself. `error` shows a message.\n- `emptyState: { icon, title, description, action: { label, onClick } }` is what shows when there is nothing yet.\n\n## Remembering the view\n`stateKey: 'orders'` remembers the search, the view, the filters and the sort in this browser, and puts them back the next time the list is built. `clearSavedState()` forgets them.\n\n## Language\n`texts` replaces every word: `search`, `create`, `sortBy`, `selectAll`, `selected` (`{count}`), `loadMore`, `loading`, `error`, `retry`, `empty`, `noResults`, `clearFilters`, `removed` (`{count}`), `removedOne` (`{title}`), `undo`, `saveError`, `confirm`, `cancel`, the day groups (`day_today`, `day_yesterday`, `day_week`, `day_month`, `day_older`) and the rest listed in `DataList.js`. Relative times use the page's language (`<html lang>`).\n\n## Methods and events\n- `addItem(item, options)`, `updateItem(key, changes, options)`, `removeItem(keys, options)`.\n- `refresh()`, `clearQuery()`, `focusItem(key)`.\n- `select(keys)`, `clearSelection()`, `getSelectedItems()`.\n- `getItems()`, `getVisibleItems()`, `getItem(key)`, `query`, `page`, `totalItems`.\n- Callbacks: `onItemClick`, `onSelectionChange`, `onQueryChange` and `onError`. The `selection-change` event also reports the selection.\n\n## Live Preview\n:::component name=\"DataList\"\n{\n  \"items\": [\n    { \"id\": 1, \"title\": \"Website redesign\", \"description\": \"Marketing · due Nov 14\" },\n    { \"id\": 2, \"title\": \"Mobile app 2.0\", \"description\": \"Product · due Dec 2\" },\n    { \"id\": 3, \"title\": \"Public API\", \"description\": \"Platform · due Oct 30\" }\n  ],\n  \"icon\": \"folder\",\n  \"searchable\": true\n}\n:::\n\n## Examples\n:::script label=\"Team directory\" expected=\"a searchable list of people: avatar with status, name, email, city and role with icons, and an Active/Away badge; a City filter and a sort menu; clicking a person opens their card in a Modal\"\nconst people = [\n  { id: 1, name: 'José Pérez', email: 'jose@acme.com', city: 'Maracaibo', role: 'Engineering', active: true },\n  { id: 2, name: 'Ana López', email: 'ana@acme.com', city: 'Caracas', role: 'Design', active: true },\n  { id: 3, name: 'Luis Galué', email: 'luis@acme.com', city: 'Valencia', role: 'Security', active: false },\n  { id: 4, name: 'María Ruiz', email: 'maria@acme.com', city: 'Caracas', role: 'Sales', active: true },\n  { id: 5, name: 'Andrés Bello', email: 'andres@acme.com', city: 'Mérida', role: 'Support', active: false },\n  { id: 6, name: 'Sofía Rey', email: 'sofia@acme.com', city: 'Maracaibo', role: 'Engineering', active: true }\n];\n\nconst team = await slice.build('DataList', {\n  items: people,\n  title: 'name',\n  description: 'email',\n  avatar: (p) => ({ name: p.name, status: p.active ? 'online' : 'offline' }),\n  meta: [{ value: 'city', icon: 'map-pin' }, { value: 'role', icon: 'briefcase' }],\n  badge: (p) => ({ label: p.active ? 'Active' : 'Away', tone: p.active ? 'success' : 'neutral' }),\n  searchable: true,\n  filters: [{ key: 'city', label: 'City' }],\n  sortOptions: [{ key: 'name', label: 'Name' }, { key: 'city', label: 'City' }],\n  onItemClick: async (person) => {\n    const avatar = await slice.build('Avatar', { name: person.name, size: 'xl', status: person.active ? 'online' : 'offline' });\n    const modal = await slice.build('Modal', {\n      title: person.name, description: `${person.role} · ${person.city}`, size: 'sm', destroyOnClose: true,\n      content: [avatar, person.email], actions: [{ value: 'Close', variant: 'ghost' }]\n    });\n    document.body.append(modal);\n    await modal.show();\n  }\n});\nteam.style.width = '100%';\nreturn team;\n:::\n\n:::script label=\"Inbox: groups by day, selection and undo\" expected=\"messages grouped Today / Yesterday / This week, unread ones with a dot badge; each row has Archive on it and a menu with Mark as read and Delete; selecting several shows Mark read and Archive for all; Archive removes the row with an Undo bar\"\nconst hour = 3600 * 1000;\nconst now = Date.now();\nconst messages = [\n  { id: 1, from: 'Ana López', subject: 'Release notes for 3.4', preview: 'I wrote the draft, can you check the API part?', at: now - 0.5 * hour, unread: true },\n  { id: 2, from: 'GitHub', subject: '[slice.js] New issue #412', preview: 'Router: params with dots are not parsed', at: now - 3 * hour, unread: true },\n  { id: 3, from: 'Luis Galué', subject: 'VM access', preview: 'Your key is on the server now.', at: now - 26 * hour, unread: false },\n  { id: 4, from: 'María Ruiz', subject: 'Demo on Friday', preview: 'The client wants to see the dashboard.', at: now - 30 * hour, unread: true },\n  { id: 5, from: 'Billing', subject: 'Invoice October', preview: 'Your invoice is ready.', at: now - 4 * 24 * hour, unread: false }\n];\n\nconst inbox = await slice.build('DataList', {\n  items: messages,\n  title: 'subject',\n  description: 'preview',\n  avatar: (m) => ({ name: m.from }),\n  meta: [{ value: 'from' }],\n  badge: (m) => (m.unread ? { dot: true, label: 'Unread', tone: 'accent' } : null),\n  timestamp: 'at',\n  groupBy: { key: 'at', by: 'day' },\n  selection: 'multiple',\n  maxHeight: '420px',\n  actions: [\n    { label: 'Archive', icon: 'archive', inline: true, iconOnly: true,\n      onClick: ({ item, list }) => list.removeItem(item.id, { undo: true }) },\n    { label: 'Mark as read', icon: 'envelope-open', hidden: (m) => !m.unread,\n      onClick: ({ item, list }) => list.updateItem(item.id, { unread: false }) },\n    'separator',\n    { label: 'Delete', icon: 'trash-bin', danger: true, confirm: { title: 'Delete this message?', text: 'It cannot be recovered.' },\n      onClick: ({ item, list }) => list.removeItem(item.id) }\n  ],\n  bulkActions: [\n    { label: 'Mark read', icon: 'envelope-open', onClick: ({ items, list }) => items.forEach((m) => list.updateItem(m.id, { unread: false })) },\n    { label: 'Archive', icon: 'archive', onClick: ({ keys, list }) => list.removeItem(keys, { undo: true }) }\n  ]\n});\ninbox.style.width = '100%';\nreturn inbox;\n:::\n\n:::script label=\"Tasks: a CRUD on slice.context\" expected=\"a task list with views All / To do / Done and their counts, and a 'New task' button; a badge above the list counts the open tasks from the same store; New opens a Modal and adds the task at the top; Edit changes it; Done toggles it; Delete asks first; about one save in four fails on purpose and the change is taken back with a message\"\nif (!slice.context.has('docs-tasks')) {\n  slice.context.create('docs-tasks', { items: [\n    { id: 't1', title: 'Write the release notes', owner: 'Ana López', done: false, tags: ['docs'] },\n    { id: 't2', title: 'Fix the router params bug', owner: 'José Pérez', done: false, tags: ['bug', 'router'] },\n    { id: 't3', title: 'Record the demo video', owner: 'María Ruiz', done: true, tags: ['marketing'] }\n  ] });\n}\n\n// A pretend API that fails now and then, to show the rollback.\nconst api = {\n  save: (task) => new Promise((resolve, reject) => setTimeout(() => (Math.random() < 0.25 ? reject(new Error('Network error')) : resolve(task)), 600))\n};\n\nasync function editor(task = {}) {\n  const title = await slice.build('Input', { label: 'Title', value: task.title ?? '' });\n  const owner = await slice.build('Input', { label: 'Owner', value: task.owner ?? '' });\n  const fields = document.createElement('div');\n  fields.style.cssText = 'display:grid;gap:12px';\n  fields.append(title, owner);\n  const modal = await slice.build('Modal', {\n    title: task.id ? 'Edit task' : 'New task', size: 'sm', destroyOnClose: true, content: fields,\n    actions: [{ value: 'Cancel', variant: 'ghost' }, { value: 'Save', close: 'save' }]\n  });\n  document.body.append(modal);\n  const { returnValue } = await modal.show();\n  if (returnValue !== 'save' || !title.value.trim()) return null;\n  return { title: title.value.trim(), owner: owner.value.trim() };\n}\n\nconst tasks = await slice.build('DataList', {\n  context: 'docs-tasks',\n  title: 'title',\n  avatar: (t) => (t.owner ? { name: t.owner } : null),\n  description: (t) => t.owner || 'Unassigned',\n  tags: 'tags',\n  badge: (t) => (t.done ? { label: 'Done', tone: 'success' } : { label: 'To do', tone: 'warning' }),\n  views: [{ id: 'all', label: 'All' }, { id: 'todo', label: 'To do', filter: (t) => !t.done }, { id: 'done', label: 'Done', filter: (t) => t.done }],\n  searchable: true,\n  createAction: {\n    label: 'New task',\n    onClick: async ({ list }) => {\n      const values = await editor();\n      if (values) list.addItem({ id: `t${Date.now()}`, done: false, tags: [], ...values }, { commit: () => api.save(values) });\n    }\n  },\n  actions: [\n    { label: 'Done', icon: 'check', inline: true, hidden: (t) => t.done,\n      onClick: ({ item, list }) => list.updateItem(item.id, { done: true }, { commit: (after) => api.save(after) }) },\n    { label: 'Edit', icon: 'edit',\n      onClick: async ({ item, list }) => {\n        const values = await editor(item);\n        if (values) list.updateItem(item.id, values, { commit: (after) => api.save(after) });\n      } },\n    { label: 'Reopen', icon: 'refresh', hidden: (t) => !t.done, onClick: ({ item, list }) => list.updateItem(item.id, { done: false }) },\n    'separator',\n    { label: 'Delete', icon: 'trash-bin', danger: true, confirm: 'Delete this task?',\n      onClick: ({ item, list }) => list.removeItem(item.id, { undo: true, commit: () => api.save(item) }) }\n  ],\n  emptyState: { icon: 'check', title: 'No tasks', description: 'Add the first one with New task.' }\n});\n\n// Another component reading the same store: no wiring with the list.\nconst open = await slice.build('Badge', { tone: 'warning', value: 0 });\nslice.context.watch('docs-tasks', open, (count) => { open.value = count; }, (s) => s.items.filter((t) => !t.done).length);\nopen.value = slice.context.getState('docs-tasks').items.filter((t) => !t.done).length;\n\nconst header = document.createElement('div');\nheader.style.cssText = 'display:flex;align-items:center;gap:8px;font-weight:600';\nheader.append('Open tasks', open);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(header, tasks);\nreturn box;\n:::\n\n:::script label=\"Orders from a server\" expected=\"orders loaded page by page from a pretend server (a short wait each time, with placeholders the first time); search, a Status filter, sort by date or total, and a pager with '1–10 of 64'; the 'Fail next request' switch makes the next load fail and shows Try again\"\nconst statuses = ['Paid', 'Shipped', 'Refunded', 'Pending'];\nconst db = Array.from({ length: 64 }, (_, i) => ({\n  id: 5000 + i,\n  customer: ['Ana López', 'José Pérez', 'María Ruiz', 'Luis Galué', 'Sofía Rey'][i % 5],\n  total: Math.round((20 + ((i * 37) % 480)) * 100) / 100,\n  status: statuses[i % 4],\n  date: new Date(Date.now() - i * 7 * 3600 * 1000).toISOString()\n}));\nlet failNext = false;\n\n// The \"server\": filters, sorts and pages, like a real API would.\nasync function server({ page, pageSize, search, filters, sort, signal }) {\n  await new Promise((r) => setTimeout(r, 500));\n  if (signal.aborted) throw new DOMException('aborted', 'AbortError');\n  if (failNext) { failNext = false; throw new Error('503 Service Unavailable'); }\n  let rows = db.filter((o) => !search || `${o.id} ${o.customer}`.toLowerCase().includes(search.toLowerCase()));\n  for (const f of filters) rows = rows.filter((o) => f.values.includes(o[f.key]));\n  if (sort) rows = [...rows].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * (sort.direction === 'desc' ? -1 : 1));\n  return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };\n}\n\nconst money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });\nconst tone = { Paid: 'success', Shipped: 'info', Refunded: 'danger', Pending: 'warning' };\n\nconst orders = await slice.build('DataList', {\n  load: server,\n  title: (o) => `Order #${o.id}`,\n  description: 'customer',\n  icon: 'receipt',\n  value: (o) => money.format(o.total),\n  badge: (o) => ({ label: o.status, tone: tone[o.status] }),\n  timestamp: 'date',\n  searchable: true,\n  filters: [{ key: 'status', label: 'Status', options: statuses }],\n  sortOptions: [{ key: 'date', label: 'Date', direction: 'desc' }, { key: 'total', label: 'Total', direction: 'desc' }],\n  sort: { key: 'date', direction: 'desc' },\n  pagination: { pageSize: 10 },\n  variant: 'separated'\n});\n\nconst fail = await slice.build('Switch', { label: 'Fail next request', onChange: (on) => { failNext = on; } });\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(fail, orders);\nreturn box;\n:::\n\n:::script label=\"Activity feed with infinite scrolling\" expected=\"a box of activity entries that loads 15 more each time its end comes near, with 'Loading…' while it does, until 'That is everything.'\"\nconst verbs = ['commented on', 'closed', 'opened', 'merged', 'reviewed'];\nconst people = ['Ana', 'José', 'María', 'Luis', 'Sofía'];\nconst feed = await slice.build('DataList', {\n  load: async ({ page, pageSize }) => {\n    await new Promise((r) => setTimeout(r, 400));\n    const from = (page - 1) * pageSize;\n    const items = Array.from({ length: Math.max(0, Math.min(pageSize, 70 - from)) }, (_, i) => {\n      const n = from + i;\n      return { id: n, who: people[n % 5], text: `${people[n % 5]} ${verbs[n % 5]} issue #${900 - n}`, at: Date.now() - n * 47 * 60 * 1000 };\n    });\n    return { items, total: 70 };\n  },\n  title: 'text',\n  avatar: (a) => ({ name: a.who, size: 'sm' }),\n  timestamp: 'at',\n  pagination: 'infinite',\n  pageSize: 15,\n  maxHeight: '360px',\n  variant: 'ghost',\n  density: 'compact'\n});\nfeed.style.width = '100%';\nreturn feed;\n:::\n\n:::script label=\"Files as cards\" expected=\"a grid of file cards with an icon, the name, its size and date, and a menu with Rename and Delete; Rename changes the card in place\"\nconst files = [\n  { id: 'f1', name: 'Q3 report.pdf', icon: 'file-pdf', size: '2.4 MB', kind: 'PDF', at: Date.now() - 2 * 3600e3 },\n  { id: 'f2', name: 'Team photo.jpg', icon: 'image', size: '5.1 MB', kind: 'Image', at: Date.now() - 26 * 3600e3 },\n  { id: 'f3', name: 'Budget 2027.csv', icon: 'file-csv', size: '84 KB', kind: 'Sheet', at: Date.now() - 5 * 86400e3 },\n  { id: 'f4', name: 'Pitch deck.pptx', icon: 'file-ppt', size: '12 MB', kind: 'Slides', at: Date.now() - 9 * 86400e3 },\n  { id: 'f5', name: 'Contract.docx', icon: 'file-word', size: '310 KB', kind: 'Document', at: Date.now() - 40 * 86400e3 }\n];\nconst grid = await slice.build('DataList', {\n  items: files,\n  title: 'name',\n  icon: 'icon',\n  meta: [{ value: 'size' }, { value: 'kind' }],\n  timestamp: 'at',\n  layout: 'grid',\n  minItemWidth: 220,\n  actions: [\n    { label: 'Rename', icon: 'edit', onClick: ({ item, list }) => list.updateItem(item.id, { name: item.name.replace(/(\\.\\w+)$/, ' (renamed)$1') }) },\n    { label: 'Delete', icon: 'trash-bin', danger: true, onClick: ({ item, list }) => list.removeItem(item.id, { undo: true }) }\n  ]\n});\ngrid.style.width = '100%';\nreturn grid;\n:::\n\n## Best Practices\n:::tip\nGive every item a stable key (`itemKey`, `'id'` by default). Selection, updates and removals find items by it, and rows that did not change are not redrawn.\n:::\n\n:::tip\nUse `commit` for every change that goes to a server. People see the change at once, and a failure undoes it by itself, instead of leaving the list out of step with the server.\n:::\n\n:::tip\nPrefer `removeItem(…, { undo: true })` to a confirmation for things that can be brought back. Undo is faster for the nine times people meant it, and safe for the tenth. Keep `confirm` for what cannot be undone.\n:::\n\n:::tip\nPut the one or two actions people use most on the row (`inline: true`) and the rest in the menu. A row full of buttons is hard to scan.\n:::\n\n## Pitfalls\n:::warning\nWith `load`, filter options and view counts do not come from the data, because the list only holds one page. Give filters their `options`, and views a `count` if you want one.\n:::\n\n:::warning\nDo not change item objects in place (`item.done = true`) and expect the list to notice. Use `updateItem`, or set `items` (or the context) to a new array, the way you would in React or Vue.\n:::\n\n:::warning\nA list inside a flex or grid item needs `min-width: 0` on that item, or long titles push it wider than the screen.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| You would write… | In Slice |","| --- | --- |","| `const [items, setItems] = useState([])` / `ref([])` | `items: [...]` and set `list.items` again, or a store: `slice.context.create('tasks', { items: [] })` |","| `<List items={items} renderItem={…} />` | `slice.build('DataList', { items, title: 'name', … })` or `renderItem: (item) => node` |","| `onClick={() => edit(item)}` | `actions: [{ label: 'Edit', onClick: ({ item }) => edit(item) }]` |","| `useQuery` / a `fetch` in `useEffect` | `load: async ({ page, search, signal }) => …` |","| optimistic updates with rollback | `list.updateItem(id, changes, { commit: () => api.save(…) })` |","| a store several components read (Pinia, Redux) | `context: 'tasks'`: the list follows `slice.context`, and its changes go back to it |","| unmount cleanup | automatic: destroying the list destroys every component it built |"];
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
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const team = await slice.build('DataList', {\n  items: people,\n  title: 'name',\n  description: 'email',\n  avatar: { src: 'photo', name: 'name' },   // Avatar props, read from the item\n  meta: [{ value: 'city', icon: 'map-pin' }, { value: 'role' }],\n  badge: (p) => ({ label: p.active ? 'Active' : 'Away', tone: p.active ? 'success' : 'neutral' }),\n});",
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
            const lines = ["| Part | What it is |","| --- | --- |","| `title` | The main line (`'title'` by default). |","| `description` | A quieter line under it. |","| `avatar` / `icon` / `image` | What is on the left: an [Avatar](/docs/display/avatar) (`{ src, name, status }`), an icon name, or a picture. |","| `meta` | Small facts with icons: `[{ value: 'city', icon: 'map-pin' }]`. `format(value, item)` changes how one reads. |","| `tags` | An array of words or [Chip](/docs/display/chip) props. |","| `badge` | A status on the right ([Badge](/docs/display/badge) props, a word or a number). |","| `value` | A figure on the right, such as an amount. |","| `timestamp` | A date, shown as \"3 hours ago\", with the full date on hover. |","| `renderItem(item)` | Draw the middle part yourself; the avatar, status and actions still go around it. |"];
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
            const code = await slice.build('CodeVisualizer', {
               value: "searchable: true,                                   // a search box\nsortOptions: [{ key: 'createdAt', label: 'Newest', direction: 'desc' }, { key: 'name', label: 'Name' }],\nviews: [{ label: 'All' }, { label: 'Open', filter: (o) => o.status === 'open' }],\nfilters: [{ key: 'city', label: 'City' }],          // options come from the data\ngroupBy: { key: 'createdAt', by: 'day' },           // Today, Yesterday, This week…",
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
               value: "actions: [\n  { label: 'Edit', icon: 'edit', inline: true, onClick: ({ item }) => openEditor(item) },\n  { label: 'Archive', icon: 'archive', hidden: (o) => o.archived, onClick: … },\n  'separator',\n  { label: 'Delete', icon: 'trash-bin', danger: true, confirm: 'Delete this order?', onClick: … },\n],\nselection: 'multiple',\nbulkActions: [{ label: 'Archive', icon: 'archive', onClick: ({ items }) => … }],",
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
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "await list.addItem(newTask, { commit: () => api.create(newTask) });\nawait list.updateItem(task.id, { done: true }, { commit: (after) => api.save(after) });\nawait list.removeItem(task.id, { undo: true, commit: ([task]) => api.delete(task.id) });",
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
               value: "slice.context.create('tasks', { items: await api.tasks() });\n\nconst list = await slice.build('DataList', { context: 'tasks', title: 'title' });\nconst counter = await slice.build('Badge', {});\nslice.context.watch('tasks', counter, (items) => { counter.value = items.filter((t) => !t.done).length; }, (s) => s.items);",
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
               value: "load: async ({ page, pageSize, search, filters, sort, view, signal }) => {\n  const res = await fetch(`/api/orders?page=${page}&size=${pageSize}&q=${encodeURIComponent(search)}`, { signal });\n  return res.json();       // { items: [...], total: 342 }  (or just an array)\n},",
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
            let props = {};
            if ("{\n  \"items\": [\n    { \"id\": 1, \"title\": \"Website redesign\", \"description\": \"Marketing · due Nov 14\" },\n    { \"id\": 2, \"title\": \"Mobile app 2.0\", \"description\": \"Product · due Dec 2\" },\n    { \"id\": 3, \"title\": \"Public API\", \"description\": \"Platform · due Oct 30\" }\n  ],\n  \"icon\": \"folder\",\n  \"searchable\": true\n}") {
               try {
                  props = JSON.parse("{\n  \"items\": [\n    { \"id\": 1, \"title\": \"Website redesign\", \"description\": \"Marketing · due Nov 14\" },\n    { \"id\": 2, \"title\": \"Mobile app 2.0\", \"description\": \"Product · due Dec 2\" },\n    { \"id\": 3, \"title\": \"Public API\", \"description\": \"Platform · due Oct 30\" }\n  ],\n  \"icon\": \"folder\",\n  \"searchable\": true\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('DataList', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-16"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"context\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"contextPath\",\"type\":\"string\",\"required\":false,\"default\":\"items\",\"allowedValues\":[]},{\"path\":\"load\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"itemKey\",\"type\":\"any\",\"required\":false,\"default\":\"id\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"any\",\"required\":false,\"default\":\"title\",\"allowedValues\":[]},{\"path\":\"description\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"avatar\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"image\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"meta\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"badge\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"tags\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"timestamp\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"renderItem\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"path\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"href\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onItemClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"detail\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"selection\",\"type\":\"string\",\"required\":false,\"default\":\"none\",\"allowedValues\":[]},{\"path\":\"selected\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onSelectionChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"bulkActions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"createAction\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"search\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"searchFields\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"sortOptions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"sort\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"filters\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"filterValues\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"views\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"view\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"showCounts\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"groupBy\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"groupLabel\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"groupOrder\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"collapsibleGroups\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onQueryChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pagination\",\"type\":\"any\",\"required\":false,\"default\":\"none\",\"allowedValues\":[]},{\"path\":\"pageSize\",\"type\":\"number\",\"required\":false,\"default\":\"20\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"maxHeight\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"emptyState\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"layout\",\"type\":\"string\",\"required\":false,\"default\":\"list\",\"allowedValues\":[]},{\"path\":\"minItemWidth\",\"type\":\"number\",\"required\":false,\"default\":\"260\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[]},{\"path\":\"density\",\"type\":\"string\",\"required\":false,\"default\":\"comfortable\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"stateKey\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onError\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"context\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"contextPath\",\"type\":\"string\",\"required\":false,\"default\":\"items\",\"allowedValues\":[]},{\"path\":\"load\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"itemKey\",\"type\":\"any\",\"required\":false,\"default\":\"id\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"any\",\"required\":false,\"default\":\"title\",\"allowedValues\":[]},{\"path\":\"description\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"avatar\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"image\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"meta\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"badge\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"tags\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"timestamp\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"renderItem\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"path\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"href\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onItemClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"detail\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"selection\",\"type\":\"string\",\"required\":false,\"default\":\"none\",\"allowedValues\":[]},{\"path\":\"selected\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onSelectionChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"bulkActions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"createAction\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"search\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"searchFields\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"sortOptions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"sort\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"filters\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"filterValues\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"views\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"view\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"showCounts\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"groupBy\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"groupLabel\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"groupOrder\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"collapsibleGroups\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onQueryChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pagination\",\"type\":\"any\",\"required\":false,\"default\":\"none\",\"allowedValues\":[]},{\"path\":\"pageSize\",\"type\":\"number\",\"required\":false,\"default\":\"20\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"maxHeight\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"emptyState\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"layout\",\"type\":\"string\",\"required\":false,\"default\":\"list\",\"allowedValues\":[]},{\"path\":\"minItemWidth\",\"type\":\"number\",\"required\":false,\"default\":\"260\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[]},{\"path\":\"density\",\"type\":\"string\",\"required\":false,\"default\":\"comfortable\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"stateKey\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onError\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Table","path":"/docs/data/table"},{"text":"TreeView","path":"/docs/navigation/treeview"},{"text":"SideMenu","path":"/docs/navigation/side-menu"},{"text":"Select","path":"/docs/input/select"},{"text":"Modal","path":"/docs/feedback/modal"},{"text":"Pagination","path":"/docs/data/pagination"},{"text":"InfiniteScrollService","path":"/docs/services/infinite-scroll"}];
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
      label: '❐'
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
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
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

customElements.define('slice-datalistdocumentation', DataListDocumentation);
