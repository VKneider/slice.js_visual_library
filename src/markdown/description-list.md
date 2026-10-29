---
title: DescriptionList
route: /docs/data/description-list
navLabel: DescriptionList
section: Data
group: Tables
order: 13
description: One record as label → value pairs — the detail of an order, a profile, the settings of a project. Values formatted by type and shown with components (Badge, Avatar), sections, copy buttons, edit in place with commit and rollback, a store or a server as the source, and a skeleton while it loads.
component: DescriptionListDocumentation
generate: true
tags: [description list, detail, record, key value, properties, profile, inline edit, dl]
---

# DescriptionList

## Overview
`DescriptionList` shows **one record** with all its properties: the detail of an order, a customer's profile, the settings of a project. Each property is a row with a label and a value, and the value is shown the way it should be read: an amount as money, a date as a date, a status as a [Badge](/docs/display/badge), a person with their [Avatar](/docs/display/avatar), an email as a link you can copy.

It is the other half of [DataList](/docs/data/datalist). DataList shows **many records** with a few properties each; DescriptionList shows one with all of them. DataList's `detail` option opens a DescriptionList in a drawer when you open an item.

### When to use it
- **The detail page or drawer of a record**: an order, an invoice, a ticket, a user.
- **A profile or settings screen** where each value can be changed on its own, without a whole form.
- **A summary before confirming**: "You are about to pay…" with the amount, the account and the date.
- **Specifications**: the properties of a product, a server or a file, in a grid of columns.

### When not to use it
- **Many records.** Use [DataList](/docs/data/datalist) or [Table](/docs/data/table).
- **Creating a record, or changing many fields at once and saving them together.** Use a [Form](/docs/input/form); DescriptionList saves each field on its own.
- **Two or three values.** A line of text or a [Card](/docs/layout/card) says it with less.
- **Free text with headings.** That is a document, not a record.

## Coming from React or Vue
It is the component you would write as a `<dl>` with a `map` over a list of fields, and then keep extending with formatting, copy buttons and an "edit" state per field. Here the fields are data:

```js
const view = await slice.build('DescriptionList', {
  item: order,                       // like a prop: set it again to change it
  fields: [
    { key: 'id', label: 'Order', format: (id) => `#${id}`, copy: true },
    { key: 'status', type: 'badge', badge: (status) => STATUS[status] },
    { key: 'customer', type: 'avatar' },
    { key: 'email', type: 'email', copy: true, edit: { required: true } },
    { key: 'total', type: 'currency', currency: 'USD' },
    { key: 'createdAt', label: 'Created', type: 'relative' },
  ],
  commit: ({ key, value, item }) => api.patch(`/orders/${item.id}`, { [key]: value }),
});
```

`view.item = nextOrder` re-renders only the values that changed. With `context: 'order'` it follows a `slice.context` store instead, the way a component follows a store in Vue or a selector in React.

## Core Behavior

### Where the record comes from
- `item`: an object you own. Set it again to show another one. It is never changed in place: a saved edit makes a new object.
- `context` and `contextPath`: a `slice.context` store and the path of the record inside it (`''` is the whole state). The list follows the store, and saved edits are written back to it, so every component that reads it sees them.
- `load: async ({ signal }) => record`: a server. While it loads, every value is a skeleton; if it fails, a message with **Try again**. `reload()` asks again, and a cached route that comes back reloads it.

### Fields
A field is a key (`'email'`) or an object:

| Option | What it does |
| --- | --- |
| `key` | A key or a path (`'customer.name'`). |
| `label` | The label. Without one, the key is turned into one (`createdAt` → "Created at"). |
| `type` | How the value is shown (below). `'text'` by default. |
| `format(value, item)` | The text to show, when the type's own format is not what you want. |
| `render(value, item)` | Anything else: return a node or a string. |
| `badge` | For `type: 'badge'`: a function from the value to [Badge](/docs/display/badge) props, or a map `{ paid: { label: 'Paid', tone: 'success' } }`. |
| `avatar` | For `type: 'avatar'`: a function from the value to [Avatar](/docs/display/avatar) props. An object with `name` and `src` works without it. |
| `path`, `href` | Makes the value a link: an app route (through `slice.router`) or an address. A key or a function of the item. |
| `copy` | A copy button. `true` copies the value; a function returns the text to copy. |
| `edit` | Makes the field editable (below). |
| `help` | A short line under the label. |
| `hidden` | `true`, or a function of the item, to leave the row out. |
| `empty` | What an empty value shows, instead of "—". |
| `span` | In the grid layout, `2`, `3` or `'full'` columns. |

### Types
`text`, `number` (with `digits` and `unit`), `currency` (with `currency`), `percent` (a fraction: `0.25` is 25%), `date`, `datetime`, `relative` ("3 days ago", the full date on hover), `boolean` (Yes / No), `email`, `url`, `phone` (links), `badge`, `avatar`, `tags` (a Badge for each), `list`, `code` and `multiline`. Numbers and dates use the page's language, or `locale`.

### Editing in place
A field with `edit` gets a pencil. Clicking it, or the value, opens the right control: an [Input](/docs/input/input) of the right type, a [Textarea](/docs/input/textarea) for `multiline`, a [DatePicker](/docs/input/datepicker) for dates, a [Select](/docs/input/select) when `edit.options` is given, and a [Switch](/docs/input/switch) for a `boolean` that saves the moment it is flipped.

- `edit: true`, or `{ type, options, required, min, max, step, placeholder, validate(value, item), parse(value) }`.
- **Enter** saves (**Ctrl/⌘ + Enter** in a textarea), **Escape** cancels, and focus goes back to the pencil.
- **The record changes when the save succeeds.** `commit({ key, value, previous, item, before, field })` runs first, with the field busy. If it throws, or returns `false`, the editor stays open with what was typed and says it could not be saved (with the error's message). If it returns an object, that is the record from now on (with the server's dates, say). Without `commit`, the value is written at once.
- `onChange({ key, value, previous, item })` runs after each saved change.
- `readonly: true` turns every pencil off.
- An update to the store while someone is typing in one field never wipes that editor.

### Methods
- `edit(key)`, `save()`, `cancelEdit()`, `editing` (the field being edited).
- `setValue(key, value)`: a change from code, through `commit` like an edit. Resolves to whether it was saved.
- `getValue(key)`, `item`, `reload()`, `focusField(key)`.

### The sheet: like a spreadsheet
`variant: 'sheet'` shows the record the way Excel would: a grid of cells, the labels as shaded row headers, the sections as group rows, numbers aligned to the right. It is for people who work through many values at the keyboard: an operations panel, the properties of an item in an editor, a record checked line by line.

| Key | What it does |
| --- | --- |
| Arrows, Home, End | Move the active cell (in the `grid` layout, left and right too). |
| Tab, Shift+Tab | The next or the previous cell; at the first or last, Tab leaves the sheet. |
| Typing | Starts editing and replaces the value. |
| Enter, F2, a double click | Edit with the value there, the caret at the end. |
| Enter while editing | Save and go down. **Tab** saves and goes on. A click elsewhere saves too. |
| Alt+Enter | A new line, in a `multiline` cell. |
| Escape | Cancel the edit. |
| Space or Enter on a Yes/No | Flip it. A choice from a list is saved the moment it is made. |
| Delete, Backspace | Empty the cell (not a `required` one). |
| Ctrl/⌘+C | Copy the value. |

A save shows the new value at once, busy while `commit` runs, and the active cell moves on without waiting. If `commit` fails, the cell goes back to the old value, outlined in red with the message. The sheet is one tab stop: Tab enters it at the active cell and leaves it from the edges. `activeField` and `activate(key)` read and move the active cell from code.

## Looks
- `layout`: `'horizontal'` (label beside the value, the default), `'stacked'` (label above), or `'grid'` with `columns` (2 by default). Below 480px every layout puts the label above the value, in one column.
- `variant`: `'outlined'` (a box, the default), `'separated'` (lines between rows, no box), `'filled'`, `'ghost'`, or `'sheet'`, the spreadsheet look (below).
- `density`: `'compact'`, `'comfortable'` (default) or `'spacious'`.
- `labelWidth`: the width of the label column in the horizontal layout (`'200px'`, `'40%'`).
- `title`, `description` and `actions` (Buttons on the right: `{ label, icon, variant, danger, onClick({ item, list, event }) }`) make a header.
- `sections: [{ title, description, fields, collapsible, collapsed }]` groups the fields under headings.
- `hideEmpty` leaves out the rows with nothing in them.
- `texts` translates every word it shows (`empty`, `yes`, `no`, `edit`, `copy`, `copied`, `save`, `cancel`, `saving`, `saved`, `saveError`, `error`, `retry`…).

## Live Preview
:::component name="DescriptionList"
{
  "item": { "name": "Ana López", "email": "ana@example.com", "city": "Caracas", "plan": "Pro" },
  "fields": [
    "name",
    { "key": "email", "type": "email", "copy": true },
    "city",
    "plan"
  ]
}
:::

## Examples
:::script label="Order detail" expected="an order page: a header 'Order #1042' with Print and Refund buttons; an Order section with a copyable order number, a green Paid badge, the date and a relative 'updated' time, and a total of $1,284.90; a Customer section with Ana López's avatar and her email and phone as links; a Shipping section with the address on several lines, a copyable tracking code in monospace and tags; Refund asks first and then changes the status badge to Refunded"
const STATUS = {
  paid: { label: 'Paid', tone: 'success', icon: 'check' },
  refunded: { label: 'Refunded', tone: 'neutral' }
};
let order = {
  id: 1042,
  status: 'paid',
  createdAt: '2026-10-21',
  updatedAt: Date.now() - 1000 * 60 * 60 * 5,
  total: 1284.9,
  customer: { name: 'Ana López', email: 'ana@example.com', phone: '+58 412 555 0142' },
  address: 'Av. 5 de Julio, Edif. Sol, piso 3\nMaracaibo 4001\nVenezuela',
  tracking: 'VE-88213-4410',
  tags: ['Express', 'Gift wrap']
};

const toasts = await slice.build('ToastProvider', { singleton: true });
const view = await slice.build('DescriptionList', {
  item: order,
  title: `Order #${order.id}`,
  description: 'Placed online, paid by card',
  sections: [
    { title: 'Order', fields: [
      { key: 'id', label: 'Number', format: (id) => `#${id}`, copy: (id) => String(id) },
      { key: 'status', type: 'badge', badge: STATUS },
      { key: 'createdAt', label: 'Placed', type: 'date' },
      { key: 'updatedAt', label: 'Updated', type: 'relative' },
      { key: 'total', type: 'currency', currency: 'USD' }
    ] },
    { title: 'Customer', fields: [
      { key: 'customer', label: 'Name', type: 'avatar' },
      { key: 'customer.email', label: 'Email', type: 'email', copy: true },
      { key: 'customer.phone', label: 'Phone', type: 'phone' }
    ] },
    { title: 'Shipping', fields: [
      { key: 'address', type: 'multiline', copy: true },
      { key: 'tracking', label: 'Tracking code', type: 'code', copy: true },
      { key: 'tags', label: 'Options', type: 'tags' }
    ] }
  ],
  actions: [
    { label: 'Print', icon: 'printer', variant: 'ghost', onClick: () => toasts.show('Sent to the printer') },
    {
      label: 'Refund', variant: 'outlined', danger: true,
      onClick: async ({ item, list }) => {
        const ask = await slice.build('Modal', {
          title: `Refund order #${item.id}?`, size: 'sm', tone: 'danger', destroyOnClose: true,
          content: 'The customer gets the full amount back.',
          actions: [{ value: 'Cancel', variant: 'ghost', returnValue: 'no' }, { value: 'Refund', variant: 'danger', returnValue: 'yes' }]
        });
        document.body.append(ask);
        const { returnValue } = await ask.show();
        if (returnValue !== 'yes') return;
        list.item = { ...item, status: 'refunded', updatedAt: Date.now() };
        toasts.show('Order refunded', { type: 'success' });
      }
    }
  ]
});
view.style.width = '100%';
view.style.maxWidth = '640px';
return view;
:::

:::script label="Profile you can edit, saved to a server" expected="a profile shared through slice.context: the top bar shows the name from the same store; each field has a pencil; changing the name updates the top bar after a short save; the email 'taken@example.com' is refused by the pretend server and the editor stays open with the message; Language is a select; Newsletter is a switch that saves at once; Member since cannot be edited"
if (!slice.context.has('docsProfile')) {
  slice.context.create('docsProfile', {
    user: { id: 7, name: 'Lucas Molina', email: 'lucas@example.com', phone: '', language: 'es', bio: 'Security at Northwind.\nLikes clean logs.', newsletter: true, memberSince: '2023-03-14' }
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// A pretend server: half a second per save, and one email is taken.
const api = {
  async patch(key, value) {
    await wait(500);
    if (key === 'email' && value === 'taken@example.com') throw new Error('That email is already in use.');
  }
};

const bar = document.createElement('header');
bar.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 7%,transparent)';
const avatar = await slice.build('Avatar', { name: slice.context.getState('docsProfile').user.name, size: 'sm' });
const hello = document.createElement('strong');
bar.append(avatar, hello);
const paintBar = (user) => { hello.textContent = user.name; avatar.name = user.name; };
paintBar(slice.context.getState('docsProfile').user);
slice.context.watch('docsProfile', avatar, (user) => paintBar(user), (state) => state.user);

const profile = await slice.build('DescriptionList', {
  context: 'docsProfile',
  contextPath: 'user',
  variant: 'separated',
  labelWidth: '160px',
  fields: [
    { key: 'name', edit: { required: true, maxlength: 60 } },
    { key: 'email', type: 'email', copy: true, edit: { required: true }, help: 'Try taken@example.com' },
    { key: 'phone', type: 'phone', edit: { placeholder: '+58 …' } },
    { key: 'language', format: (code) => ({ es: 'Español', en: 'English', pt: 'Português' }[code] || code),
      edit: { options: [{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }, { value: 'pt', label: 'Português' }] } },
    { key: 'bio', type: 'multiline', edit: { maxlength: 200 } },
    { key: 'newsletter', type: 'boolean', edit: true },
    { key: 'memberSince', label: 'Member since', type: 'date' }
  ],
  commit: ({ key, value }) => api.patch(key, value)
});

const page = document.createElement('div');
page.style.cssText = 'display:grid;gap:14px;width:100%;max-width:620px';
page.append(bar, profile);
return page;
:::

:::script label="Loaded from a server" expected="a server record that shows skeleton bars while it loads; the first load fails and shows 'This could not be loaded.' with Try again; the second one shows the server's name, region, status, uptime, CPU and the last deploy"
let tries = 0;
const server = await slice.build('DescriptionList', {
  title: 'api-prod-03',
  variant: 'filled',
  fields: [
    { key: 'hostname', type: 'code', copy: true },
    'region',
    { key: 'status', type: 'badge', badge: (s) => ({ label: s, tone: s === 'Healthy' ? 'success' : 'warning', indicator: true, pulse: s === 'Healthy' }) },
    { key: 'uptime', type: 'percent', digits: 2 },
    { key: 'cpu', label: 'CPU', type: 'number', unit: 'cores' },
    { key: 'deployedAt', label: 'Last deploy', type: 'relative' }
  ],
  load: async ({ signal }) => {
    await new Promise((r) => setTimeout(r, 1200));
    if (signal.aborted) return null;
    tries += 1;
    if (tries === 1) throw new Error('offline');
    return { hostname: 'api-prod-03.internal', region: 'us-east-1', status: 'Healthy', uptime: 0.99982, cpu: 8, deployedAt: Date.now() - 1000 * 60 * 42 };
  }
});
server.style.width = '100%';
server.style.maxWidth = '560px';
return server;
:::

:::script label="Specifications in a grid" expected="a product's specifications in three columns with the label above each value, a Description across the whole width, and a Spacious / Compact switch"
const specs = await slice.build('DescriptionList', {
  title: 'Aurora 14 laptop',
  layout: 'grid',
  columns: 3,
  item: {
    sku: 'AUR-14-512', price: 1199, weight: 1.29, screen: '14" 2.8K OLED', cpu: '12 cores', ram: '16 GB',
    storage: '512 GB SSD', battery: 'Up to 17 h', ports: ['USB-C ×2', 'HDMI', 'Audio'],
    description: 'A light laptop for work on the move, with a bright screen and a full day of battery.'
  },
  fields: [
    { key: 'sku', label: 'SKU', type: 'code', copy: true },
    { key: 'price', type: 'currency', currency: 'USD' },
    { key: 'weight', type: 'number', unit: 'kg' },
    'screen', { key: 'cpu', label: 'CPU' }, { key: 'ram', label: 'Memory' },
    'storage', 'battery', { key: 'ports', type: 'tags' },
    { key: 'description', span: 'full' }
  ]
});
const density = await slice.build('Switch', {
  label: 'Compact',
  onChange: (on) => { specs.density = on ? 'compact' : 'comfortable'; }
});
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;width:100%';
box.append(density, specs);
return box;
:::

:::script label="A sheet you work at the keyboard" expected="a spreadsheet-like record of a purchase order with shaded row headers and group rows (Supplier, Terms, Items); click a cell and use the arrows; type to replace a value, Enter to save and go down, Tab to go on, F2 to edit, Escape to cancel; quantities and prices are right-aligned and the total under the sheet recalculates; a price over 10,000 is refused and the cell turns red with the message"
const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const order = {
  supplier: 'Andes Components', contact: 'm.rivas@andes.com', terms: 'Net 30', currency: 'USD',
  delivery: '2026-11-12', incoterm: 'FOB', approved: false,
  cables: 120, cablePrice: 4.5, switches: 6, switchPrice: 389, notes: 'Deliver to dock 2'
};

const total = document.createElement('p');
total.style.cssText = 'margin:0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums';
const paintTotal = (o) => {
  total.textContent = `Total ${fmt.format(o.cables * o.cablePrice + o.switches * o.switchPrice)}`;
};
paintTotal(order);

const sheet = await slice.build('DescriptionList', {
  item: order,
  variant: 'sheet',
  title: 'Purchase order PO-2291',
  description: 'Click a cell, then use the keyboard like a spreadsheet.',
  sections: [
    { title: 'Supplier', fields: [
      { key: 'supplier', edit: { required: true } },
      { key: 'contact', type: 'email', edit: true },
      { key: 'approved', type: 'boolean', edit: true }
    ] },
    { title: 'Terms', fields: [
      { key: 'terms', edit: { options: ['Net 15', 'Net 30', 'Net 60', 'Prepaid'] } },
      { key: 'incoterm', label: 'Incoterm', edit: { options: ['EXW', 'FOB', 'CIF', 'DDP'] } },
      { key: 'delivery', type: 'date', edit: true },
      { key: 'notes', type: 'multiline', edit: true }
    ] },
    { title: 'Items', fields: [
      { key: 'cables', label: 'Cat6 cables (qty)', type: 'number', edit: { min: 0, step: 1 } },
      { key: 'cablePrice', label: 'Cable price', type: 'currency', edit: { min: 0, step: 0.01 } },
      { key: 'switches', label: 'Switches (qty)', type: 'number', edit: { min: 0, step: 1 } },
      { key: 'switchPrice', label: 'Switch price', type: 'currency', edit: { min: 0, step: 0.01 } }
    ] }
  ],
  // A pretend server: a short wait, and no price over 10,000.
  commit: async ({ key, value }) => {
    await new Promise((r) => setTimeout(r, 300));
    if (key.endsWith('Price') && value > 10000) throw new Error('Prices over 10,000 need a second approval.');
  },
  onChange: ({ item }) => paintTotal(item)
});

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:10px;width:100%;max-width:620px';
box.append(sheet, total);
return box;
:::

:::script label="One record per page: a review queue with Pagination" expected="a loan-application review queue: a Pagination above the record says 'Application 1 of 6' and moves through them; each page loads its application from a pretend server (skeleton bars while it loads); the record shows the applicant with an avatar, a status badge, the amount, the income and a relative 'submitted' time; Approve and Reject in the header change the status (saved through commit) and jump to the next application; the Notes field can be edited"
// A pretend server: six applications, fetched one at a time.
const STATUS = {
  pending: { label: 'Pending', tone: 'warning', indicator: true },
  approved: { label: 'Approved', tone: 'success', icon: 'check' },
  rejected: { label: 'Rejected', tone: 'danger' }
};
const db = [
  { id: 'L-301', applicant: 'Ana López', email: 'ana@example.com', amount: 12000, income: 54000, term: 36, status: 'pending', submitted: Date.now() - 36e5 * 3, notes: '' },
  { id: 'L-302', applicant: 'Lucas Molina', email: 'lucas@example.com', amount: 4500, income: 31000, term: 12, status: 'pending', submitted: Date.now() - 36e5 * 20, notes: 'Second loan this year.' },
  { id: 'L-303', applicant: 'María Ruiz', email: 'maria@example.com', amount: 30000, income: 61000, term: 60, status: 'pending', submitted: Date.now() - 36e5 * 26, notes: '' },
  { id: 'L-304', applicant: 'Andrés Bello', email: 'andres@example.com', amount: 8000, income: 42000, term: 24, status: 'approved', submitted: Date.now() - 36e5 * 50, notes: 'Approved by J. Pérez.' },
  { id: 'L-305', applicant: 'Sofía Rey', email: 'sofia@example.com', amount: 15000, income: 28000, term: 48, status: 'pending', submitted: Date.now() - 36e5 * 72, notes: '' },
  { id: 'L-306', applicant: 'José Pérez', email: 'jose@example.com', amount: 2000, income: 39000, term: 6, status: 'rejected', submitted: Date.now() - 36e5 * 96, notes: 'Incomplete documents.' }
];
const api = {
  async get(index) { await new Promise((r) => setTimeout(r, 450)); return { ...db[index] }; },
  async patch(id, changes) {
    await new Promise((r) => setTimeout(r, 300));
    const row = db.find((a) => a.id === id);
    Object.assign(row, changes);
    return { ...row };
  }
};

let page = 1;
const toasts = await slice.build('ToastProvider', { singleton: true });

const record = await slice.build('DescriptionList', {
  variant: 'outlined',
  labelWidth: '170px',
  sections: [
    { title: 'Applicant', fields: [
      { key: 'applicant', type: 'avatar', avatar: (name) => ({ name }) },
      { key: 'email', type: 'email', copy: true },
      { key: 'status', type: 'badge', badge: STATUS }
    ] },
    { title: 'Loan', fields: [
      { key: 'id', label: 'Application', type: 'code', copy: true },
      { key: 'amount', type: 'currency', currency: 'USD' },
      { key: 'term', label: 'Term', format: (months) => `${months} months` },
      { key: 'income', label: 'Yearly income', type: 'currency', currency: 'USD' },
      { key: 'ratio', label: 'Amount / income', render: (_, item) => `${Math.round((item.amount / item.income) * 100)}%` },
      { key: 'submitted', type: 'relative' },
      { key: 'notes', type: 'multiline', edit: { maxlength: 300, placeholder: 'Add a note' } }
    ] }
  ],
  // The record of the page the Pagination is on; reload() asks again.
  load: () => api.get(page - 1),
  // Every saved edit (Notes, or a decision below) goes to the server, and its
  // answer is the record from now on.
  commit: ({ item, key, value }) => api.patch(item.id, { [key]: value })
});

const pager = await slice.build('Pagination', {
  currentPage: 1,
  totalPages: db.length,
  mode: 'compact',
  align: 'between',
  texts: { pageOf: 'Application {page} of {total}' },
  onPageChange: (next) => {
    page = next;
    record.reload();
  }
});

// A decision saves the status, then moves on to the next application.
const decide = async (status) => {
  const current = record.item;
  if (!current) return;
  const saved = await record.setValue('status', status);
  if (!saved) return;
  toasts.show(`${current.id} ${status}`, { type: status === 'approved' ? 'success' : 'warning' });
  if (page < db.length) {
    page += 1;
    pager.currentPage = page;
    record.reload();
  }
};
record.actions = [
  { label: 'Reject', variant: 'outlined', danger: true, onClick: () => decide('rejected') },
  { label: 'Approve', icon: 'check', variant: 'filled', onClick: () => decide('approved') }
];
record.title = 'Loan applications';
record.description = 'Review each application and decide.';

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;width:100%;max-width:640px';
box.append(pager, record);
return box;
:::

## Best Practices
:::tip
Keep the order people read in: what it is (number, status), who it belongs to, then the details. Put the two or three things people look for first in the first rows.
:::

:::tip
Use `sections` once there are more than eight or nine fields. A heading every few rows makes a long record scannable; `collapsible` hides the parts people rarely open.
:::

:::tip
Save each field through `commit` and let it throw on failure. The editor keeps what was typed and shows the message, so nothing is lost and nobody has to read a toast to know what failed.
:::

:::tip
Choose `variant: 'sheet'` when people will edit many values in a row at the keyboard. For a record people mostly read, the default looks are calmer and show the copy and edit buttons a mouse user expects.
:::

## Pitfalls
:::warning
Do not use it as a form to create a record. It edits the fields of a record that exists, one at a time; a new record needs a [Form](/docs/input/form) that validates and saves everything together.
:::

:::warning
`percent` takes a fraction: `0.25` shows as 25%. Pass `25` and it shows 2,500%. If your data is already in percent, use `type: 'number'` with `unit: '%'`.
:::

## Language

The built-in texts are `slice.descriptionList.*` keys with English and Spanish defaults, registered by
`shared/text/texts.js` in the translator's lowest layer: an app dictionary always wins, and the
component keeps its English text when the translator is off.
The text prop `texts` still wins over the dictionary.
Keys: `empty`, `yes`, `no`, `edit`, `editing`, `copy`, `copied`, `save`, `cancel`, `saving`, `saved`, `saveError`, `error`, `retry`, `loading`, `expand`, `collapse`.
