export default class DescriptionListDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Order detail","expected":"an order page: a header 'Order #1042' with Print and Refund buttons; an Order section with a copyable order number, a green Paid badge, the date and a relative 'updated' time, and a total of $1,284.90; a Customer section with Ana López's avatar and her email and phone as links; a Shipping section with the address on several lines, a copyable tracking code in monospace and tags; Refund asks first and then changes the status badge to Refunded","kind":"script","content":"const STATUS = {\n  paid: { label: 'Paid', tone: 'success', icon: 'check' },\n  refunded: { label: 'Refunded', tone: 'neutral' }\n};\nlet order = {\n  id: 1042,\n  status: 'paid',\n  createdAt: '2026-10-21',\n  updatedAt: Date.now() - 1000 * 60 * 60 * 5,\n  total: 1284.9,\n  customer: { name: 'Ana López', email: 'ana@acme.com', phone: '+58 412 555 0142' },\n  address: 'Av. 5 de Julio, Edif. Sol, piso 3\\nMaracaibo 4001\\nVenezuela',\n  tracking: 'VE-88213-4410',\n  tags: ['Express', 'Gift wrap']\n};\n\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst view = await slice.build('DescriptionList', {\n  item: order,\n  title: `Order #${order.id}`,\n  description: 'Placed online, paid by card',\n  sections: [\n    { title: 'Order', fields: [\n      { key: 'id', label: 'Number', format: (id) => `#${id}`, copy: (id) => String(id) },\n      { key: 'status', type: 'badge', badge: STATUS },\n      { key: 'createdAt', label: 'Placed', type: 'date' },\n      { key: 'updatedAt', label: 'Updated', type: 'relative' },\n      { key: 'total', type: 'currency', currency: 'USD' }\n    ] },\n    { title: 'Customer', fields: [\n      { key: 'customer', label: 'Name', type: 'avatar' },\n      { key: 'customer.email', label: 'Email', type: 'email', copy: true },\n      { key: 'customer.phone', label: 'Phone', type: 'phone' }\n    ] },\n    { title: 'Shipping', fields: [\n      { key: 'address', type: 'multiline', copy: true },\n      { key: 'tracking', label: 'Tracking code', type: 'code', copy: true },\n      { key: 'tags', label: 'Options', type: 'tags' }\n    ] }\n  ],\n  actions: [\n    { label: 'Print', icon: 'printer', variant: 'ghost', onClick: () => toasts.show('Sent to the printer') },\n    {\n      label: 'Refund', variant: 'outlined', danger: true,\n      onClick: async ({ item, list }) => {\n        const ask = await slice.build('Modal', {\n          title: `Refund order #${item.id}?`, size: 'sm', tone: 'danger', destroyOnClose: true,\n          content: 'The customer gets the full amount back.',\n          actions: [{ value: 'Cancel', variant: 'ghost', returnValue: 'no' }, { value: 'Refund', variant: 'danger', returnValue: 'yes' }]\n        });\n        document.body.append(ask);\n        const { returnValue } = await ask.show();\n        if (returnValue !== 'yes') return;\n        list.item = { ...item, status: 'refunded', updatedAt: Date.now() };\n        toasts.show('Order refunded', { type: 'success' });\n      }\n    }\n  ]\n});\nview.style.width = '100%';\nview.style.maxWidth = '640px';\nreturn view;"},{"label":"Profile you can edit, saved to a server","expected":"a profile shared through slice.context: the top bar shows the name from the same store; each field has a pencil; changing the name updates the top bar after a short save; the email 'taken@acme.com' is refused by the pretend server and the editor stays open with the message; Language is a select; Newsletter is a switch that saves at once; Member since cannot be edited","kind":"script","content":"if (!slice.context.has('docsProfile')) {\n  slice.context.create('docsProfile', {\n    user: { id: 7, name: 'Luis Galué', email: 'luis@acme.com', phone: '', language: 'es', bio: 'Security at Acme.\\nLikes clean logs.', newsletter: true, memberSince: '2023-03-14' }\n  });\n}\nconst wait = (ms) => new Promise((r) => setTimeout(r, ms));\n// A pretend server: half a second per save, and one email is taken.\nconst api = {\n  async patch(key, value) {\n    await wait(500);\n    if (key === 'email' && value === 'taken@acme.com') throw new Error('That email is already in use.');\n  }\n};\n\nconst bar = document.createElement('header');\nbar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 7%,transparent)';\nconst avatar = await slice.build('Avatar', { name: slice.context.getState('docsProfile').user.name, size: 'sm' });\nconst hello = document.createElement('strong');\nbar.append(avatar, hello);\nconst paintBar = (user) => { hello.textContent = user.name; avatar.name = user.name; };\npaintBar(slice.context.getState('docsProfile').user);\nslice.context.watch('docsProfile', avatar, (user) => paintBar(user), (state) => state.user);\n\nconst profile = await slice.build('DescriptionList', {\n  context: 'docsProfile',\n  contextPath: 'user',\n  variant: 'separated',\n  labelWidth: '160px',\n  fields: [\n    { key: 'name', edit: { required: true, maxlength: 60 } },\n    { key: 'email', type: 'email', copy: true, edit: { required: true }, help: 'Try taken@acme.com' },\n    { key: 'phone', type: 'phone', edit: { placeholder: '+58 …' } },\n    { key: 'language', format: (code) => ({ es: 'Español', en: 'English', pt: 'Português' }[code] || code),\n      edit: { options: [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }, { value: 'pt', label: 'Português' }] } },\n    { key: 'bio', type: 'multiline', edit: { maxlength: 200 } },\n    { key: 'newsletter', type: 'boolean', edit: true },\n    { key: 'memberSince', label: 'Member since', type: 'date' }\n  ],\n  commit: ({ key, value }) => api.patch(key, value)\n});\n\nconst page = document.createElement('div');\npage.style.cssText = 'display:grid;gap:14px;width:100%;max-width:620px';\npage.append(bar, profile);\nreturn page;"},{"label":"Loaded from a server","expected":"a server record that shows skeleton bars while it loads; the first load fails and shows 'This could not be loaded.' with Try again; the second one shows the server's name, region, status, uptime, CPU and the last deploy","kind":"script","content":"let tries = 0;\nconst server = await slice.build('DescriptionList', {\n  title: 'api-prod-03',\n  variant: 'filled',\n  fields: [\n    { key: 'hostname', type: 'code', copy: true },\n    'region',\n    { key: 'status', type: 'badge', badge: (s) => ({ label: s, tone: s === 'Healthy' ? 'success' : 'warning', indicator: true, pulse: s === 'Healthy' }) },\n    { key: 'uptime', type: 'percent', digits: 2 },\n    { key: 'cpu', label: 'CPU', type: 'number', unit: 'cores' },\n    { key: 'deployedAt', label: 'Last deploy', type: 'relative' }\n  ],\n  load: async ({ signal }) => {\n    await new Promise((r) => setTimeout(r, 1200));\n    if (signal.aborted) return null;\n    tries += 1;\n    if (tries === 1) throw new Error('offline');\n    return { hostname: 'api-prod-03.acme.internal', region: 'us-east-1', status: 'Healthy', uptime: 0.99982, cpu: 8, deployedAt: Date.now() - 1000 * 60 * 42 };\n  }\n});\nserver.style.width = '100%';\nserver.style.maxWidth = '560px';\nreturn server;"},{"label":"Specifications in a grid","expected":"a product's specifications in three columns with the label above each value, a Description across the whole width, and a Spacious / Compact switch","kind":"script","content":"const specs = await slice.build('DescriptionList', {\n  title: 'Aurora 14 laptop',\n  layout: 'grid',\n  columns: 3,\n  item: {\n    sku: 'AUR-14-512', price: 1199, weight: 1.29, screen: '14\" 2.8K OLED', cpu: '12 cores', ram: '16 GB',\n    storage: '512 GB SSD', battery: 'Up to 17 h', ports: ['USB-C ×2', 'HDMI', 'Audio'],\n    description: 'A light laptop for work on the move, with a bright screen and a full day of battery.'\n  },\n  fields: [\n    { key: 'sku', label: 'SKU', type: 'code', copy: true },\n    { key: 'price', type: 'currency', currency: 'USD' },\n    { key: 'weight', type: 'number', unit: 'kg' },\n    'screen', { key: 'cpu', label: 'CPU' }, { key: 'ram', label: 'Memory' },\n    'storage', 'battery', { key: 'ports', type: 'tags' },\n    { key: 'description', span: 'full' }\n  ]\n});\nconst density = await slice.build('Switch', {\n  label: 'Compact',\n  onChange: (on) => { specs.density = on ? 'compact' : 'comfortable'; }\n});\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(density, specs);\nreturn box;"},{"label":"A sheet you work at the keyboard","expected":"a spreadsheet-like record of a purchase order with shaded row headers and group rows (Supplier, Terms, Items); click a cell and use the arrows; type to replace a value, Enter to save and go down, Tab to go on, F2 to edit, Escape to cancel; quantities and prices are right-aligned and the total under the sheet recalculates; a price over 10,000 is refused and the cell turns red with the message","kind":"script","content":"const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });\nconst order = {\n  supplier: 'Andes Components', contact: 'm.rivas@andes.com', terms: 'Net 30', currency: 'USD',\n  delivery: '2026-11-12', incoterm: 'FOB', approved: false,\n  cables: 120, cablePrice: 4.5, switches: 6, switchPrice: 389, notes: 'Deliver to dock 2'\n};\n\nconst total = document.createElement('p');\ntotal.style.cssText = 'margin:0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums';\nconst paintTotal = (o) => {\n  total.textContent = `Total ${fmt.format(o.cables * o.cablePrice + o.switches * o.switchPrice)}`;\n};\npaintTotal(order);\n\nconst sheet = await slice.build('DescriptionList', {\n  item: order,\n  variant: 'sheet',\n  title: 'Purchase order PO-2291',\n  description: 'Click a cell, then use the keyboard like a spreadsheet.',\n  sections: [\n    { title: 'Supplier', fields: [\n      { key: 'supplier', edit: { required: true } },\n      { key: 'contact', type: 'email', edit: true },\n      { key: 'approved', type: 'boolean', edit: true }\n    ] },\n    { title: 'Terms', fields: [\n      { key: 'terms', edit: { options: ['Net 15', 'Net 30', 'Net 60', 'Prepaid'] } },\n      { key: 'incoterm', label: 'Incoterm', edit: { options: ['EXW', 'FOB', 'CIF', 'DDP'] } },\n      { key: 'delivery', type: 'date', edit: true },\n      { key: 'notes', type: 'multiline', edit: true }\n    ] },\n    { title: 'Items', fields: [\n      { key: 'cables', label: 'Cat6 cables (qty)', type: 'number', edit: { min: 0, step: 1 } },\n      { key: 'cablePrice', label: 'Cable price', type: 'currency', edit: { min: 0, step: 0.01 } },\n      { key: 'switches', label: 'Switches (qty)', type: 'number', edit: { min: 0, step: 1 } },\n      { key: 'switchPrice', label: 'Switch price', type: 'currency', edit: { min: 0, step: 0.01 } }\n    ] }\n  ],\n  // A pretend server: a short wait, and no price over 10,000.\n  commit: async ({ key, value }) => {\n    await new Promise((r) => setTimeout(r, 300));\n    if (key.endsWith('Price') && value > 10000) throw new Error('Prices over 10,000 need a second approval.');\n  },\n  onChange: ({ item }) => paintTotal(item)\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:620px';\nbox.append(sheet, total);\nreturn box;"},{"label":"One record per page: a review queue with Pagination","expected":"a loan-application review queue: a Pagination above the record says 'Application 1 of 6' and moves through them; each page loads its application from a pretend server (skeleton bars while it loads); the record shows the applicant with an avatar, a status badge, the amount, the income and a relative 'submitted' time; Approve and Reject in the header change the status (saved through commit) and jump to the next application; the Notes field can be edited","kind":"script","content":"// A pretend server: six applications, fetched one at a time.\nconst STATUS = {\n  pending: { label: 'Pending', tone: 'warning', indicator: true },\n  approved: { label: 'Approved', tone: 'success', icon: 'check' },\n  rejected: { label: 'Rejected', tone: 'danger' }\n};\nconst db = [\n  { id: 'L-301', applicant: 'Ana López', email: 'ana@acme.com', amount: 12000, income: 54000, term: 36, status: 'pending', submitted: Date.now() - 36e5 * 3, notes: '' },\n  { id: 'L-302', applicant: 'Luis Galué', email: 'luis@acme.com', amount: 4500, income: 31000, term: 12, status: 'pending', submitted: Date.now() - 36e5 * 20, notes: 'Second loan this year.' },\n  { id: 'L-303', applicant: 'María Ruiz', email: 'maria@acme.com', amount: 30000, income: 61000, term: 60, status: 'pending', submitted: Date.now() - 36e5 * 26, notes: '' },\n  { id: 'L-304', applicant: 'Andrés Bello', email: 'andres@acme.com', amount: 8000, income: 42000, term: 24, status: 'approved', submitted: Date.now() - 36e5 * 50, notes: 'Approved by J. Pérez.' },\n  { id: 'L-305', applicant: 'Sofía Rey', email: 'sofia@acme.com', amount: 15000, income: 28000, term: 48, status: 'pending', submitted: Date.now() - 36e5 * 72, notes: '' },\n  { id: 'L-306', applicant: 'José Pérez', email: 'jose@acme.com', amount: 2000, income: 39000, term: 6, status: 'rejected', submitted: Date.now() - 36e5 * 96, notes: 'Incomplete documents.' }\n];\nconst api = {\n  async get(index) { await new Promise((r) => setTimeout(r, 450)); return { ...db[index] }; },\n  async patch(id, changes) {\n    await new Promise((r) => setTimeout(r, 300));\n    const row = db.find((a) => a.id === id);\n    Object.assign(row, changes);\n    return { ...row };\n  }\n};\n\nlet page = 1;\nconst toasts = await slice.build('ToastProvider', { singleton: true });\n\nconst record = await slice.build('DescriptionList', {\n  variant: 'outlined',\n  labelWidth: '170px',\n  sections: [\n    { title: 'Applicant', fields: [\n      { key: 'applicant', type: 'avatar', avatar: (name) => ({ name }) },\n      { key: 'email', type: 'email', copy: true },\n      { key: 'status', type: 'badge', badge: STATUS }\n    ] },\n    { title: 'Loan', fields: [\n      { key: 'id', label: 'Application', type: 'code', copy: true },\n      { key: 'amount', type: 'currency', currency: 'USD' },\n      { key: 'term', label: 'Term', format: (months) => `${months} months` },\n      { key: 'income', label: 'Yearly income', type: 'currency', currency: 'USD' },\n      { key: 'ratio', label: 'Amount / income', render: (_, item) => `${Math.round((item.amount / item.income) * 100)}%` },\n      { key: 'submitted', type: 'relative' },\n      { key: 'notes', type: 'multiline', edit: { maxlength: 300, placeholder: 'Add a note' } }\n    ] }\n  ],\n  // The record of the page the Pagination is on; reload() asks again.\n  load: () => api.get(page - 1),\n  // Every saved edit (Notes, or a decision below) goes to the server, and its\n  // answer is the record from now on.\n  commit: ({ item, key, value }) => api.patch(item.id, { [key]: value })\n});\n\nconst pager = await slice.build('Pagination', {\n  currentPage: 1,\n  totalPages: db.length,\n  mode: 'compact',\n  align: 'between',\n  texts: { pageOf: 'Application {page} of {total}' },\n  onPageChange: (next) => {\n    page = next;\n    record.reload();\n  }\n});\n\n// A decision saves the status, then moves on to the next application.\nconst decide = async (status) => {\n  const current = record.item;\n  if (!current) return;\n  const saved = await record.setValue('status', status);\n  if (!saved) return;\n  toasts.show(`${current.id} ${status}`, { type: status === 'approved' ? 'success' : 'warning' });\n  if (page < db.length) {\n    page += 1;\n    pager.currentPage = page;\n    record.reload();\n  }\n};\nrecord.actions = [\n  { label: 'Reject', variant: 'outlined', danger: true, onClick: () => decide('rejected') },\n  { label: 'Approve', icon: 'check', variant: 'filled', onClick: () => decide('approved') }\n];\nrecord.title = 'Loan applications';\nrecord.description = 'Review each application and decide.';\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%;max-width:640px';\nbox.append(pager, record);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "description-list.md";
    this.markdownContent = "---\ntitle: DescriptionList\nroute: /docs/data/description-list\nnavLabel: DescriptionList\nsection: Data\ngroup: Tables\norder: 13\ndescription: One record as label → value pairs — the detail of an order, a profile, the settings of a project. Values formatted by type and shown with components (Badge, Avatar), sections, copy buttons, edit in place with commit and rollback, a store or a server as the source, and a skeleton while it loads.\ncomponent: DescriptionListDocumentation\ngenerate: true\ntags: [description list, detail, record, key value, properties, profile, inline edit, dl]\n---\n\n# DescriptionList\n\n## Overview\n`DescriptionList` shows **one record** with all its properties: the detail of an order, a customer's profile, the settings of a project. Each property is a row with a label and a value, and the value is shown the way it should be read: an amount as money, a date as a date, a status as a [Badge](/docs/display/badge), a person with their [Avatar](/docs/display/avatar), an email as a link you can copy.\n\nIt is the other half of [DataList](/docs/data/datalist). DataList shows **many records** with a few properties each; DescriptionList shows one with all of them. DataList's `detail` option opens a DescriptionList in a drawer when you open an item.\n\n### When to use it\n- **The detail page or drawer of a record**: an order, an invoice, a ticket, a user.\n- **A profile or settings screen** where each value can be changed on its own, without a whole form.\n- **A summary before confirming**: \"You are about to pay…\" with the amount, the account and the date.\n- **Specifications**: the properties of a product, a server or a file, in a grid of columns.\n\n### When not to use it\n- **Many records.** Use [DataList](/docs/data/datalist) or [Table](/docs/data/table).\n- **Creating a record, or changing many fields at once and saving them together.** Use a [Form](/docs/input/form); DescriptionList saves each field on its own.\n- **Two or three values.** A line of text or a [Card](/docs/layout/card) says it with less.\n- **Free text with headings.** That is a document, not a record.\n\n## Coming from React or Vue\nIt is the component you would write as a `<dl>` with a `map` over a list of fields, and then keep extending with formatting, copy buttons and an \"edit\" state per field. Here the fields are data:\n\n```js\nconst view = await slice.build('DescriptionList', {\n  item: order,                       // like a prop: set it again to change it\n  fields: [\n    { key: 'id', label: 'Order', format: (id) => `#${id}`, copy: true },\n    { key: 'status', type: 'badge', badge: (status) => STATUS[status] },\n    { key: 'customer', type: 'avatar' },\n    { key: 'email', type: 'email', copy: true, edit: { required: true } },\n    { key: 'total', type: 'currency', currency: 'USD' },\n    { key: 'createdAt', label: 'Created', type: 'relative' },\n  ],\n  commit: ({ key, value, item }) => api.patch(`/orders/${item.id}`, { [key]: value }),\n});\n```\n\n`view.item = nextOrder` re-renders only the values that changed. With `context: 'order'` it follows a `slice.context` store instead, the way a component follows a store in Vue or a selector in React.\n\n## Core Behavior\n\n### Where the record comes from\n- `item`: an object you own. Set it again to show another one. It is never changed in place: a saved edit makes a new object.\n- `context` and `contextPath`: a `slice.context` store and the path of the record inside it (`''` is the whole state). The list follows the store, and saved edits are written back to it, so every component that reads it sees them.\n- `load: async ({ signal }) => record`: a server. While it loads, every value is a skeleton; if it fails, a message with **Try again**. `reload()` asks again, and a cached route that comes back reloads it.\n\n### Fields\nA field is a key (`'email'`) or an object:\n\n| Option | What it does |\n| --- | --- |\n| `key` | A key or a path (`'customer.name'`). |\n| `label` | The label. Without one, the key is turned into one (`createdAt` → \"Created at\"). |\n| `type` | How the value is shown (below). `'text'` by default. |\n| `format(value, item)` | The text to show, when the type's own format is not what you want. |\n| `render(value, item)` | Anything else: return a node or a string. |\n| `badge` | For `type: 'badge'`: a function from the value to [Badge](/docs/display/badge) props, or a map `{ paid: { label: 'Paid', tone: 'success' } }`. |\n| `avatar` | For `type: 'avatar'`: a function from the value to [Avatar](/docs/display/avatar) props. An object with `name` and `src` works without it. |\n| `path`, `href` | Makes the value a link: an app route (through `slice.router`) or an address. A key or a function of the item. |\n| `copy` | A copy button. `true` copies the value; a function returns the text to copy. |\n| `edit` | Makes the field editable (below). |\n| `help` | A short line under the label. |\n| `hidden` | `true`, or a function of the item, to leave the row out. |\n| `empty` | What an empty value shows, instead of \"—\". |\n| `span` | In the grid layout, `2`, `3` or `'full'` columns. |\n\n### Types\n`text`, `number` (with `digits` and `unit`), `currency` (with `currency`), `percent` (a fraction: `0.25` is 25%), `date`, `datetime`, `relative` (\"3 days ago\", the full date on hover), `boolean` (Yes / No), `email`, `url`, `phone` (links), `badge`, `avatar`, `tags` (a Badge for each), `list`, `code` and `multiline`. Numbers and dates use the page's language, or `locale`.\n\n### Editing in place\nA field with `edit` gets a pencil. Clicking it, or the value, opens the right control: an [Input](/docs/input/input) of the right type, a [Textarea](/docs/input/textarea) for `multiline`, a [DatePicker](/docs/input/datepicker) for dates, a [Select](/docs/input/select) when `edit.options` is given, and a [Switch](/docs/input/switch) for a `boolean` that saves the moment it is flipped.\n\n- `edit: true`, or `{ type, options, required, min, max, step, placeholder, validate(value, item), parse(value) }`.\n- **Enter** saves (**Ctrl/⌘ + Enter** in a textarea), **Escape** cancels, and focus goes back to the pencil.\n- **The record changes when the save succeeds.** `commit({ key, value, previous, item, before, field })` runs first, with the field busy. If it throws, or returns `false`, the editor stays open with what was typed and says it could not be saved (with the error's message). If it returns an object, that is the record from now on (with the server's dates, say). Without `commit`, the value is written at once.\n- `onChange({ key, value, previous, item })` runs after each saved change.\n- `readonly: true` turns every pencil off.\n- An update to the store while someone is typing in one field never wipes that editor.\n\n### Methods\n- `edit(key)`, `save()`, `cancelEdit()`, `editing` (the field being edited).\n- `setValue(key, value)`: a change from code, through `commit` like an edit. Resolves to whether it was saved.\n- `getValue(key)`, `item`, `reload()`, `focusField(key)`.\n\n### The sheet: like a spreadsheet\n`variant: 'sheet'` shows the record the way Excel would: a grid of cells, the labels as shaded row headers, the sections as group rows, numbers aligned to the right. It is for people who work through many values at the keyboard: an operations panel, the properties of an item in an editor, a record checked line by line.\n\n| Key | What it does |\n| --- | --- |\n| Arrows, Home, End | Move the active cell (in the `grid` layout, left and right too). |\n| Tab, Shift+Tab | The next or the previous cell; at the first or last, Tab leaves the sheet. |\n| Typing | Starts editing and replaces the value. |\n| Enter, F2, a double click | Edit with the value there, the caret at the end. |\n| Enter while editing | Save and go down. **Tab** saves and goes on. A click elsewhere saves too. |\n| Alt+Enter | A new line, in a `multiline` cell. |\n| Escape | Cancel the edit. |\n| Space or Enter on a Yes/No | Flip it. A choice from a list is saved the moment it is made. |\n| Delete, Backspace | Empty the cell (not a `required` one). |\n| Ctrl/⌘+C | Copy the value. |\n\nA save shows the new value at once, busy while `commit` runs, and the active cell moves on without waiting. If `commit` fails, the cell goes back to the old value, outlined in red with the message. The sheet is one tab stop: Tab enters it at the active cell and leaves it from the edges. `activeField` and `activate(key)` read and move the active cell from code.\n\n## Looks\n- `layout`: `'horizontal'` (label beside the value, the default), `'stacked'` (label above), or `'grid'` with `columns` (2 by default). Below 480px every layout puts the label above the value, in one column.\n- `variant`: `'outlined'` (a box, the default), `'separated'` (lines between rows, no box), `'filled'`, `'ghost'`, or `'sheet'`, the spreadsheet look (below).\n- `density`: `'compact'`, `'comfortable'` (default) or `'spacious'`.\n- `labelWidth`: the width of the label column in the horizontal layout (`'200px'`, `'40%'`).\n- `title`, `description` and `actions` (Buttons on the right: `{ label, icon, variant, danger, onClick({ item, list, event }) }`) make a header.\n- `sections: [{ title, description, fields, collapsible, collapsed }]` groups the fields under headings.\n- `hideEmpty` leaves out the rows with nothing in them.\n- `texts` translates every word it shows (`empty`, `yes`, `no`, `edit`, `copy`, `copied`, `save`, `cancel`, `saving`, `saved`, `saveError`, `error`, `retry`…).\n\n## Live Preview\n:::component name=\"DescriptionList\"\n{\n  \"item\": { \"name\": \"Ana López\", \"email\": \"ana@acme.com\", \"city\": \"Caracas\", \"plan\": \"Pro\" },\n  \"fields\": [\n    \"name\",\n    { \"key\": \"email\", \"type\": \"email\", \"copy\": true },\n    \"city\",\n    \"plan\"\n  ]\n}\n:::\n\n## Examples\n:::script label=\"Order detail\" expected=\"an order page: a header 'Order #1042' with Print and Refund buttons; an Order section with a copyable order number, a green Paid badge, the date and a relative 'updated' time, and a total of $1,284.90; a Customer section with Ana López's avatar and her email and phone as links; a Shipping section with the address on several lines, a copyable tracking code in monospace and tags; Refund asks first and then changes the status badge to Refunded\"\nconst STATUS = {\n  paid: { label: 'Paid', tone: 'success', icon: 'check' },\n  refunded: { label: 'Refunded', tone: 'neutral' }\n};\nlet order = {\n  id: 1042,\n  status: 'paid',\n  createdAt: '2026-10-21',\n  updatedAt: Date.now() - 1000 * 60 * 60 * 5,\n  total: 1284.9,\n  customer: { name: 'Ana López', email: 'ana@acme.com', phone: '+58 412 555 0142' },\n  address: 'Av. 5 de Julio, Edif. Sol, piso 3\\nMaracaibo 4001\\nVenezuela',\n  tracking: 'VE-88213-4410',\n  tags: ['Express', 'Gift wrap']\n};\n\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst view = await slice.build('DescriptionList', {\n  item: order,\n  title: `Order #${order.id}`,\n  description: 'Placed online, paid by card',\n  sections: [\n    { title: 'Order', fields: [\n      { key: 'id', label: 'Number', format: (id) => `#${id}`, copy: (id) => String(id) },\n      { key: 'status', type: 'badge', badge: STATUS },\n      { key: 'createdAt', label: 'Placed', type: 'date' },\n      { key: 'updatedAt', label: 'Updated', type: 'relative' },\n      { key: 'total', type: 'currency', currency: 'USD' }\n    ] },\n    { title: 'Customer', fields: [\n      { key: 'customer', label: 'Name', type: 'avatar' },\n      { key: 'customer.email', label: 'Email', type: 'email', copy: true },\n      { key: 'customer.phone', label: 'Phone', type: 'phone' }\n    ] },\n    { title: 'Shipping', fields: [\n      { key: 'address', type: 'multiline', copy: true },\n      { key: 'tracking', label: 'Tracking code', type: 'code', copy: true },\n      { key: 'tags', label: 'Options', type: 'tags' }\n    ] }\n  ],\n  actions: [\n    { label: 'Print', icon: 'printer', variant: 'ghost', onClick: () => toasts.show('Sent to the printer') },\n    {\n      label: 'Refund', variant: 'outlined', danger: true,\n      onClick: async ({ item, list }) => {\n        const ask = await slice.build('Modal', {\n          title: `Refund order #${item.id}?`, size: 'sm', tone: 'danger', destroyOnClose: true,\n          content: 'The customer gets the full amount back.',\n          actions: [{ value: 'Cancel', variant: 'ghost', returnValue: 'no' }, { value: 'Refund', variant: 'danger', returnValue: 'yes' }]\n        });\n        document.body.append(ask);\n        const { returnValue } = await ask.show();\n        if (returnValue !== 'yes') return;\n        list.item = { ...item, status: 'refunded', updatedAt: Date.now() };\n        toasts.show('Order refunded', { type: 'success' });\n      }\n    }\n  ]\n});\nview.style.width = '100%';\nview.style.maxWidth = '640px';\nreturn view;\n:::\n\n:::script label=\"Profile you can edit, saved to a server\" expected=\"a profile shared through slice.context: the top bar shows the name from the same store; each field has a pencil; changing the name updates the top bar after a short save; the email 'taken@acme.com' is refused by the pretend server and the editor stays open with the message; Language is a select; Newsletter is a switch that saves at once; Member since cannot be edited\"\nif (!slice.context.has('docsProfile')) {\n  slice.context.create('docsProfile', {\n    user: { id: 7, name: 'Luis Galué', email: 'luis@acme.com', phone: '', language: 'es', bio: 'Security at Acme.\\nLikes clean logs.', newsletter: true, memberSince: '2023-03-14' }\n  });\n}\nconst wait = (ms) => new Promise((r) => setTimeout(r, ms));\n// A pretend server: half a second per save, and one email is taken.\nconst api = {\n  async patch(key, value) {\n    await wait(500);\n    if (key === 'email' && value === 'taken@acme.com') throw new Error('That email is already in use.');\n  }\n};\n\nconst bar = document.createElement('header');\nbar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 7%,transparent)';\nconst avatar = await slice.build('Avatar', { name: slice.context.getState('docsProfile').user.name, size: 'sm' });\nconst hello = document.createElement('strong');\nbar.append(avatar, hello);\nconst paintBar = (user) => { hello.textContent = user.name; avatar.name = user.name; };\npaintBar(slice.context.getState('docsProfile').user);\nslice.context.watch('docsProfile', avatar, (user) => paintBar(user), (state) => state.user);\n\nconst profile = await slice.build('DescriptionList', {\n  context: 'docsProfile',\n  contextPath: 'user',\n  variant: 'separated',\n  labelWidth: '160px',\n  fields: [\n    { key: 'name', edit: { required: true, maxlength: 60 } },\n    { key: 'email', type: 'email', copy: true, edit: { required: true }, help: 'Try taken@acme.com' },\n    { key: 'phone', type: 'phone', edit: { placeholder: '+58 …' } },\n    { key: 'language', format: (code) => ({ es: 'Español', en: 'English', pt: 'Português' }[code] || code),\n      edit: { options: [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }, { value: 'pt', label: 'Português' }] } },\n    { key: 'bio', type: 'multiline', edit: { maxlength: 200 } },\n    { key: 'newsletter', type: 'boolean', edit: true },\n    { key: 'memberSince', label: 'Member since', type: 'date' }\n  ],\n  commit: ({ key, value }) => api.patch(key, value)\n});\n\nconst page = document.createElement('div');\npage.style.cssText = 'display:grid;gap:14px;width:100%;max-width:620px';\npage.append(bar, profile);\nreturn page;\n:::\n\n:::script label=\"Loaded from a server\" expected=\"a server record that shows skeleton bars while it loads; the first load fails and shows 'This could not be loaded.' with Try again; the second one shows the server's name, region, status, uptime, CPU and the last deploy\"\nlet tries = 0;\nconst server = await slice.build('DescriptionList', {\n  title: 'api-prod-03',\n  variant: 'filled',\n  fields: [\n    { key: 'hostname', type: 'code', copy: true },\n    'region',\n    { key: 'status', type: 'badge', badge: (s) => ({ label: s, tone: s === 'Healthy' ? 'success' : 'warning', indicator: true, pulse: s === 'Healthy' }) },\n    { key: 'uptime', type: 'percent', digits: 2 },\n    { key: 'cpu', label: 'CPU', type: 'number', unit: 'cores' },\n    { key: 'deployedAt', label: 'Last deploy', type: 'relative' }\n  ],\n  load: async ({ signal }) => {\n    await new Promise((r) => setTimeout(r, 1200));\n    if (signal.aborted) return null;\n    tries += 1;\n    if (tries === 1) throw new Error('offline');\n    return { hostname: 'api-prod-03.acme.internal', region: 'us-east-1', status: 'Healthy', uptime: 0.99982, cpu: 8, deployedAt: Date.now() - 1000 * 60 * 42 };\n  }\n});\nserver.style.width = '100%';\nserver.style.maxWidth = '560px';\nreturn server;\n:::\n\n:::script label=\"Specifications in a grid\" expected=\"a product's specifications in three columns with the label above each value, a Description across the whole width, and a Spacious / Compact switch\"\nconst specs = await slice.build('DescriptionList', {\n  title: 'Aurora 14 laptop',\n  layout: 'grid',\n  columns: 3,\n  item: {\n    sku: 'AUR-14-512', price: 1199, weight: 1.29, screen: '14\" 2.8K OLED', cpu: '12 cores', ram: '16 GB',\n    storage: '512 GB SSD', battery: 'Up to 17 h', ports: ['USB-C ×2', 'HDMI', 'Audio'],\n    description: 'A light laptop for work on the move, with a bright screen and a full day of battery.'\n  },\n  fields: [\n    { key: 'sku', label: 'SKU', type: 'code', copy: true },\n    { key: 'price', type: 'currency', currency: 'USD' },\n    { key: 'weight', type: 'number', unit: 'kg' },\n    'screen', { key: 'cpu', label: 'CPU' }, { key: 'ram', label: 'Memory' },\n    'storage', 'battery', { key: 'ports', type: 'tags' },\n    { key: 'description', span: 'full' }\n  ]\n});\nconst density = await slice.build('Switch', {\n  label: 'Compact',\n  onChange: (on) => { specs.density = on ? 'compact' : 'comfortable'; }\n});\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(density, specs);\nreturn box;\n:::\n\n:::script label=\"A sheet you work at the keyboard\" expected=\"a spreadsheet-like record of a purchase order with shaded row headers and group rows (Supplier, Terms, Items); click a cell and use the arrows; type to replace a value, Enter to save and go down, Tab to go on, F2 to edit, Escape to cancel; quantities and prices are right-aligned and the total under the sheet recalculates; a price over 10,000 is refused and the cell turns red with the message\"\nconst fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });\nconst order = {\n  supplier: 'Andes Components', contact: 'm.rivas@andes.com', terms: 'Net 30', currency: 'USD',\n  delivery: '2026-11-12', incoterm: 'FOB', approved: false,\n  cables: 120, cablePrice: 4.5, switches: 6, switchPrice: 389, notes: 'Deliver to dock 2'\n};\n\nconst total = document.createElement('p');\ntotal.style.cssText = 'margin:0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums';\nconst paintTotal = (o) => {\n  total.textContent = `Total ${fmt.format(o.cables * o.cablePrice + o.switches * o.switchPrice)}`;\n};\npaintTotal(order);\n\nconst sheet = await slice.build('DescriptionList', {\n  item: order,\n  variant: 'sheet',\n  title: 'Purchase order PO-2291',\n  description: 'Click a cell, then use the keyboard like a spreadsheet.',\n  sections: [\n    { title: 'Supplier', fields: [\n      { key: 'supplier', edit: { required: true } },\n      { key: 'contact', type: 'email', edit: true },\n      { key: 'approved', type: 'boolean', edit: true }\n    ] },\n    { title: 'Terms', fields: [\n      { key: 'terms', edit: { options: ['Net 15', 'Net 30', 'Net 60', 'Prepaid'] } },\n      { key: 'incoterm', label: 'Incoterm', edit: { options: ['EXW', 'FOB', 'CIF', 'DDP'] } },\n      { key: 'delivery', type: 'date', edit: true },\n      { key: 'notes', type: 'multiline', edit: true }\n    ] },\n    { title: 'Items', fields: [\n      { key: 'cables', label: 'Cat6 cables (qty)', type: 'number', edit: { min: 0, step: 1 } },\n      { key: 'cablePrice', label: 'Cable price', type: 'currency', edit: { min: 0, step: 0.01 } },\n      { key: 'switches', label: 'Switches (qty)', type: 'number', edit: { min: 0, step: 1 } },\n      { key: 'switchPrice', label: 'Switch price', type: 'currency', edit: { min: 0, step: 0.01 } }\n    ] }\n  ],\n  // A pretend server: a short wait, and no price over 10,000.\n  commit: async ({ key, value }) => {\n    await new Promise((r) => setTimeout(r, 300));\n    if (key.endsWith('Price') && value > 10000) throw new Error('Prices over 10,000 need a second approval.');\n  },\n  onChange: ({ item }) => paintTotal(item)\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:620px';\nbox.append(sheet, total);\nreturn box;\n:::\n\n:::script label=\"One record per page: a review queue with Pagination\" expected=\"a loan-application review queue: a Pagination above the record says 'Application 1 of 6' and moves through them; each page loads its application from a pretend server (skeleton bars while it loads); the record shows the applicant with an avatar, a status badge, the amount, the income and a relative 'submitted' time; Approve and Reject in the header change the status (saved through commit) and jump to the next application; the Notes field can be edited\"\n// A pretend server: six applications, fetched one at a time.\nconst STATUS = {\n  pending: { label: 'Pending', tone: 'warning', indicator: true },\n  approved: { label: 'Approved', tone: 'success', icon: 'check' },\n  rejected: { label: 'Rejected', tone: 'danger' }\n};\nconst db = [\n  { id: 'L-301', applicant: 'Ana López', email: 'ana@acme.com', amount: 12000, income: 54000, term: 36, status: 'pending', submitted: Date.now() - 36e5 * 3, notes: '' },\n  { id: 'L-302', applicant: 'Luis Galué', email: 'luis@acme.com', amount: 4500, income: 31000, term: 12, status: 'pending', submitted: Date.now() - 36e5 * 20, notes: 'Second loan this year.' },\n  { id: 'L-303', applicant: 'María Ruiz', email: 'maria@acme.com', amount: 30000, income: 61000, term: 60, status: 'pending', submitted: Date.now() - 36e5 * 26, notes: '' },\n  { id: 'L-304', applicant: 'Andrés Bello', email: 'andres@acme.com', amount: 8000, income: 42000, term: 24, status: 'approved', submitted: Date.now() - 36e5 * 50, notes: 'Approved by J. Pérez.' },\n  { id: 'L-305', applicant: 'Sofía Rey', email: 'sofia@acme.com', amount: 15000, income: 28000, term: 48, status: 'pending', submitted: Date.now() - 36e5 * 72, notes: '' },\n  { id: 'L-306', applicant: 'José Pérez', email: 'jose@acme.com', amount: 2000, income: 39000, term: 6, status: 'rejected', submitted: Date.now() - 36e5 * 96, notes: 'Incomplete documents.' }\n];\nconst api = {\n  async get(index) { await new Promise((r) => setTimeout(r, 450)); return { ...db[index] }; },\n  async patch(id, changes) {\n    await new Promise((r) => setTimeout(r, 300));\n    const row = db.find((a) => a.id === id);\n    Object.assign(row, changes);\n    return { ...row };\n  }\n};\n\nlet page = 1;\nconst toasts = await slice.build('ToastProvider', { singleton: true });\n\nconst record = await slice.build('DescriptionList', {\n  variant: 'outlined',\n  labelWidth: '170px',\n  sections: [\n    { title: 'Applicant', fields: [\n      { key: 'applicant', type: 'avatar', avatar: (name) => ({ name }) },\n      { key: 'email', type: 'email', copy: true },\n      { key: 'status', type: 'badge', badge: STATUS }\n    ] },\n    { title: 'Loan', fields: [\n      { key: 'id', label: 'Application', type: 'code', copy: true },\n      { key: 'amount', type: 'currency', currency: 'USD' },\n      { key: 'term', label: 'Term', format: (months) => `${months} months` },\n      { key: 'income', label: 'Yearly income', type: 'currency', currency: 'USD' },\n      { key: 'ratio', label: 'Amount / income', render: (_, item) => `${Math.round((item.amount / item.income) * 100)}%` },\n      { key: 'submitted', type: 'relative' },\n      { key: 'notes', type: 'multiline', edit: { maxlength: 300, placeholder: 'Add a note' } }\n    ] }\n  ],\n  // The record of the page the Pagination is on; reload() asks again.\n  load: () => api.get(page - 1),\n  // Every saved edit (Notes, or a decision below) goes to the server, and its\n  // answer is the record from now on.\n  commit: ({ item, key, value }) => api.patch(item.id, { [key]: value })\n});\n\nconst pager = await slice.build('Pagination', {\n  currentPage: 1,\n  totalPages: db.length,\n  mode: 'compact',\n  align: 'between',\n  texts: { pageOf: 'Application {page} of {total}' },\n  onPageChange: (next) => {\n    page = next;\n    record.reload();\n  }\n});\n\n// A decision saves the status, then moves on to the next application.\nconst decide = async (status) => {\n  const current = record.item;\n  if (!current) return;\n  const saved = await record.setValue('status', status);\n  if (!saved) return;\n  toasts.show(`${current.id} ${status}`, { type: status === 'approved' ? 'success' : 'warning' });\n  if (page < db.length) {\n    page += 1;\n    pager.currentPage = page;\n    record.reload();\n  }\n};\nrecord.actions = [\n  { label: 'Reject', variant: 'outlined', danger: true, onClick: () => decide('rejected') },\n  { label: 'Approve', icon: 'check', variant: 'filled', onClick: () => decide('approved') }\n];\nrecord.title = 'Loan applications';\nrecord.description = 'Review each application and decide.';\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%;max-width:640px';\nbox.append(pager, record);\nreturn box;\n:::\n\n## Best Practices\n:::tip\nKeep the order people read in: what it is (number, status), who it belongs to, then the details. Put the two or three things people look for first in the first rows.\n:::\n\n:::tip\nUse `sections` once there are more than eight or nine fields. A heading every few rows makes a long record scannable; `collapsible` hides the parts people rarely open.\n:::\n\n:::tip\nSave each field through `commit` and let it throw on failure. The editor keeps what was typed and shows the message, so nothing is lost and nobody has to read a toast to know what failed.\n:::\n\n:::tip\nChoose `variant: 'sheet'` when people will edit many values in a row at the keyboard. For a record people mostly read, the default looks are calmer and show the copy and edit buttons a mouse user expects.\n:::\n\n## Pitfalls\n:::warning\nDo not use it as a form to create a record. It edits the fields of a record that exists, one at a time; a new record needs a [Form](/docs/input/form) that validates and saves everything together.\n:::\n\n:::warning\n`percent` takes a fraction: `0.25` shows as 25%. Pass `25` and it shows 2,500%. If your data is already in percent, use `type: 'number'` with `unit: '%'`.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const view = await slice.build('DescriptionList', {\n  item: order,                       // like a prop: set it again to change it\n  fields: [\n    { key: 'id', label: 'Order', format: (id) => `#${id}`, copy: true },\n    { key: 'status', type: 'badge', badge: (status) => STATUS[status] },\n    { key: 'customer', type: 'avatar' },\n    { key: 'email', type: 'email', copy: true, edit: { required: true } },\n    { key: 'total', type: 'currency', currency: 'USD' },\n    { key: 'createdAt', label: 'Created', type: 'relative' },\n  ],\n  commit: ({ key, value, item }) => api.patch(`/orders/${item.id}`, { [key]: value }),\n});",
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
            const lines = ["| Option | What it does |","| --- | --- |","| `key` | A key or a path (`'customer.name'`). |","| `label` | The label. Without one, the key is turned into one (`createdAt` → \"Created at\"). |","| `type` | How the value is shown (below). `'text'` by default. |","| `format(value, item)` | The text to show, when the type's own format is not what you want. |","| `render(value, item)` | Anything else: return a node or a string. |","| `badge` | For `type: 'badge'`: a function from the value to SLICE_INLINE_LINK_7_TOKEN props, or a map `{ paid: { label: 'Paid', tone: 'success' } }`. |","| `avatar` | For `type: 'avatar'`: a function from the value to SLICE_INLINE_LINK_8_TOKEN props. An object with `name` and `src` works without it. |","| `path`, `href` | Makes the value a link: an app route (through `slice.router`) or an address. A key or a function of the item. |","| `copy` | A copy button. `true` copies the value; a function returns the text to copy. |","| `edit` | Makes the field editable (below). |","| `help` | A short line under the label. |","| `hidden` | `true`, or a function of the item, to leave the row out. |","| `empty` | What an empty value shows, instead of \"—\". |","| `span` | In the grid layout, `2`, `3` or `'full'` columns. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Key | What it does |","| --- | --- |","| Arrows, Home, End | Move the active cell (in the `grid` layout, left and right too). |","| Tab, Shift+Tab | The next or the previous cell; at the first or last, Tab leaves the sheet. |","| Typing | Starts editing and replaces the value. |","| Enter, F2, a double click | Edit with the value there, the caret at the end. |","| Enter while editing | Save and go down. **Tab** saves and goes on. A click elsewhere saves too. |","| Alt+Enter | A new line, in a `multiline` cell. |","| Escape | Cancel the edit. |","| Space or Enter on a Yes/No | Flip it. A choice from a list is saved the moment it is made. |","| Delete, Backspace | Empty the cell (not a `required` one). |","| Ctrl/⌘+C | Copy the value. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
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
            let props = {};
            if ("{\n  \"item\": { \"name\": \"Ana López\", \"email\": \"ana@acme.com\", \"city\": \"Caracas\", \"plan\": \"Pro\" },\n  \"fields\": [\n    \"name\",\n    { \"key\": \"email\", \"type\": \"email\", \"copy\": true },\n    \"city\",\n    \"plan\"\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"item\": { \"name\": \"Ana López\", \"email\": \"ana@acme.com\", \"city\": \"Caracas\", \"plan\": \"Pro\" },\n  \"fields\": [\n    \"name\",\n    { \"key\": \"email\", \"type\": \"email\", \"copy\": true },\n    \"city\",\n    \"plan\"\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('DescriptionList', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"item\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"context\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"contextPath\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"load\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"fields\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"sections\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"description\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"commit\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onError\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"readonly\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"layout\",\"type\":\"string\",\"required\":false,\"default\":\"horizontal\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"number\",\"required\":false,\"default\":\"2\",\"allowedValues\":[]},{\"path\":\"labelWidth\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[]},{\"path\":\"density\",\"type\":\"string\",\"required\":false,\"default\":\"comfortable\",\"allowedValues\":[]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"hideEmpty\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"locale\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"item\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"context\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"contextPath\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"load\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"fields\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"sections\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"description\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"commit\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onError\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"readonly\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"layout\",\"type\":\"string\",\"required\":false,\"default\":\"horizontal\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"number\",\"required\":false,\"default\":\"2\",\"allowedValues\":[]},{\"path\":\"labelWidth\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[]},{\"path\":\"density\",\"type\":\"string\",\"required\":false,\"default\":\"comfortable\",\"allowedValues\":[]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"hideEmpty\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"locale\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Badge","path":"/docs/display/badge"},{"text":"Avatar","path":"/docs/display/avatar"},{"text":"DataList","path":"/docs/data/datalist"},{"text":"DataList","path":"/docs/data/datalist"},{"text":"Table","path":"/docs/data/table"},{"text":"Form","path":"/docs/input/form"},{"text":"Card","path":"/docs/layout/card"},{"text":"Badge","path":"/docs/display/badge"},{"text":"Avatar","path":"/docs/display/avatar"},{"text":"Input","path":"/docs/input/input"},{"text":"Textarea","path":"/docs/input/textarea"},{"text":"DatePicker","path":"/docs/input/datepicker"},{"text":"Select","path":"/docs/input/select"},{"text":"Switch","path":"/docs/input/switch"},{"text":"Form","path":"/docs/input/form"}];
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

customElements.define('slice-descriptionlistdocumentation', DescriptionListDocumentation);
