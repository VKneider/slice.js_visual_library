export default class DetailsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Help center with search","expected":"an accordion of questions with an icon each; typing in the search keeps only the matching questions and opens the first one; no match shows an empty state","kind":"script","content":"const faqs = [\n  { id: 'ship', icon: 'truck', title: 'How long does shipping take?', text: 'Orders leave our warehouse within one business day and arrive in 2–4 days.' },\n  { id: 'return', icon: 'refresh', title: 'Can I return an order?', text: 'Yes. You have 30 days from delivery to return anything, unused and in its box.' },\n  { id: 'pay', icon: 'credit-card', title: 'Which payment methods do you take?', text: 'Cards, bank transfers and mobile payments. You are only charged when the order ships.' },\n  { id: 'track', icon: 'map-pin', title: 'How do I track my order?', text: 'The shipping email has a tracking link. You can also find it under Orders in your account.' },\n  { id: 'cancel', icon: 'close-circle', title: 'Can I cancel an order?', text: 'Until it ships, from Orders in your account. After that, return it instead.' }\n];\n\nconst help = await slice.build('Details', { items: faqs, variant: 'separated' });\nconst empty = await slice.build('EmptyState', { icon: 'search', title: 'No questions match', description: 'Try another word, or write to us.' });\nempty.hidden = true;\n\nconst search = await slice.build('Input', {\n  label: 'Search the help center',\n  icon: 'search',\n  clearable: true,\n  debounce: 200,\n  onChange: (query) => {\n    const q = query.trim().toLowerCase();\n    const found = q ? faqs.filter((f) => (f.title + ' ' + f.text).toLowerCase().includes(q)) : faqs;\n    // Sections that stay keep their state; only the list changes.\n    help.items = found;\n    help.hidden = found.length === 0;\n    empty.hidden = found.length > 0;\n    if (q && found.length) help.show(found[0].id);\n  }\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:16px;width:100%;max-width:640px';\nbox.append(search, help, empty);\nreturn box;"},{"label":"Order summary in a Card","expected":"a Card with the order total; 'Items' opens a lazily built Table of the order lines and 'How the total is worked out' shows the breakdown","kind":"script","content":"const lines = [\n  { item: 'Notebook A5, dotted', qty: 3, price: 6.5 },\n  { item: 'Gel pens, pack of 10', qty: 1, price: 9 },\n  { item: 'Washi tape set', qty: 2, price: 4.25 }\n];\nconst subtotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0);\nconst shipping = 4;\nconst tax = Math.round(subtotal * 0.16 * 100) / 100;\nconst money = (n) => `$${n.toFixed(2)}`;\n\nconst breakdown = document.createElement('dl');\nbreakdown.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:6px 16px;margin:0;font-size:.9rem';\nfor (const [label, value] of [['Subtotal', subtotal], ['Shipping', shipping], ['VAT (16%)', tax]]) {\n  breakdown.insertAdjacentHTML('beforeend', `<dt>${label}</dt><dd style=\"margin:0;text-align:right\">${money(value)}</dd>`);\n}\n\nconst more = await slice.build('Details', {\n  variant: 'ghost',\n  size: 'sm',\n  multiple: true,\n  items: [\n    {\n      id: 'items', title: 'Items', badge: lines.length,\n      // Built the first time someone opens it.\n      content: () => slice.build('Table', {\n        columns: [\n          { key: 'item', label: 'Item' },\n          { key: 'qty', label: 'Qty' },\n          { key: 'price', label: 'Price', render: (row) => money(row.qty * row.price) }\n        ],\n        rows: lines\n      })\n    },\n    { id: 'total', title: 'How the total is worked out', content: breakdown }\n  ]\n});\n\nconst total = document.createElement('div');\ntotal.style.cssText = 'font-size:1.6rem;font-weight:700';\ntotal.textContent = money(subtotal + shipping + tax);\n\nconst card = await slice.build('Card', {\n  title: 'Order #1042',\n  subtitle: 'Placed today · ships tomorrow',\n  headerIcon: 'shopping-bag',\n  badge: { label: 'Paid', tone: 'success' },\n  content: [total, more],\n  actions: [{ value: 'Track order', variant: 'filled' }, { value: 'Invoice', variant: 'ghost', icon: 'download' }]\n});\ncard.style.maxWidth = '460px';\nreturn card;"},{"label":"Settings, one section at a time","expected":"a settings accordion that always keeps one section open; each section holds a Form built on first open; saving shows a toast and the section's badge","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\n\nconst form = (schema, label) => async () => slice.build('Form', {\n  variant: 'plain',\n  columns: 2,\n  submitText: 'Save',\n  schema,\n  onSubmit: () => {\n    toasts.show(`${label} saved`, { type: 'success' });\n    const items = settings.items.map((i) => (i.title === label ? { ...i, badge: { label: 'Saved', tone: 'success' } } : i));\n    settings.items = items;\n  }\n});\n\nconst settings = await slice.build('Details', {\n  collapsible: false,\n  stateKey: 'docs-settings-demo',\n  items: [\n    { id: 'profile', title: 'Profile', subtitle: 'Name and contact', icon: 'user', content: form([\n      { kind: 'field', name: 'name', label: 'Full name', component: 'Input', required: true, value: 'Ana Pérez' },\n      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true, value: 'ana@example.com', props: { type: 'email' } }\n    ], 'Profile') },\n    { id: 'notifications', title: 'Notifications', subtitle: 'What we email you about', icon: 'bell', content: form([\n      { kind: 'field', name: 'orders', label: 'Order updates', component: 'Switch', valueProp: 'checked', value: true },\n      { kind: 'field', name: 'news', label: 'Newsletter', component: 'Switch', valueProp: 'checked', value: false }\n    ], 'Notifications') },\n    { id: 'security', title: 'Security', subtitle: 'Password and sessions', icon: 'shield-check', content: form([\n      { kind: 'field', name: 'password', label: 'New password', component: 'Input', required: true, props: { type: 'password', minlength: 8 }, full: true }\n    ], 'Security') },\n    { id: 'billing', title: 'Billing', subtitle: 'Available on paid plans', icon: 'credit-card', disabled: true }\n  ]\n});\nsettings.style.cssText = 'width:100%;max-width:640px';\nreturn settings;"},{"label":"Release notes","expected":"versions as a ghost accordion with a plus marker; several can be open; Expand all and Collapse all work on every version","kind":"script","content":"const releases = [\n  { id: '3.2', title: 'v3.2.0', subtitle: 'October 2026', badge: { label: 'Latest', tone: 'accent' }, open: true, notes: ['DatePicker, with ranges and presets', 'Card rebuilt: actions, selectable, loading', 'Details groups into an accordion'] },\n  { id: '3.1', title: 'v3.1.0', subtitle: 'September 2026', notes: ['Tabs: four variants, lazy panels', 'Modal: drawer and sheet layouts'] },\n  { id: '3.0', title: 'v3.0.0', subtitle: 'August 2026', badge: { label: 'Breaking', tone: 'danger' }, notes: ['Lucide icons replace the icon font', 'Themes moved to CSS variables'] }\n];\nconst list = (notes) => {\n  const ul = document.createElement('ul');\n  ul.style.cssText = 'margin:0;padding-left:20px;line-height:1.8';\n  for (const note of notes) ul.insertAdjacentHTML('beforeend', `<li>${note}</li>`);\n  return ul;\n};\n\nconst notes = await slice.build('Details', {\n  variant: 'ghost',\n  marker: 'plus',\n  multiple: true,\n  items: releases.map((r) => ({ ...r, content: list(r.notes) }))\n});\n\nconst expand = await slice.build('Button', { value: 'Expand all', variant: 'ghost', size: 'sm', onClick: () => notes.showAll() });\nconst collapse = await slice.build('Button', { value: 'Collapse all', variant: 'ghost', size: 'sm', onClick: () => notes.hideAll() });\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:4px;justify-content:flex-end';\nbar.append(expand, collapse);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:8px;width:100%;max-width:640px';\nbox.append(bar, notes);\nreturn box;"},{"label":"Looks at a glance","expected":"the four variants side by side, a small one with the plus marker, and a single section","kind":"script","content":"const items = [\n  { id: 'a', title: 'First section', icon: 'star', text: 'Some text inside.', open: true },\n  { id: 'b', title: 'Second section', badge: 2, text: 'More text.' },\n  { id: 'c', title: 'Disabled', disabled: true }\n];\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;width:100%';\nfor (const variant of ['outlined', 'separated', 'filled', 'ghost']) {\n  box.appendChild(await slice.build('Details', { items, variant }));\n}\nbox.appendChild(await slice.build('Details', { items, size: 'sm', marker: 'plus' }));\nbox.appendChild(await slice.build('Details', { title: 'A single section', subtitle: 'No items needed', text: 'Just a title and what it hides.' }));\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "details.md";
    this.markdownContent = "---\ntitle: Details\nroute: /docs/layout/details\nnavLabel: Details\nsection: Layout\ngroup: Containers\norder: 21\ndescription: Content that folds open. One section, or a group of them as an accordion (one open at a time, or several), with icons, badges, lazy content, keyboard navigation and remembered state. Built on the native details element.\ncomponent: DetailsDocumentation\ngenerate: true\ntags: [details, accordion, disclosure, faq, collapse, layout]\n---\n\n# Details\n\n## Overview\n`Details` hides content until someone asks for it. It is one section with a title, or a group of sections (an **accordion**) where opening one closes the others.\n\n### When to use it\n- **Questions and answers** (a FAQ, a help page), where people look for one answer and skip the rest.\n- **Optional or advanced settings** that most people never change.\n- **Long pages split into sections** people open one at a time: a policy, release notes, a product's specs.\n- **Secondary information inside a [Card](/docs/layout/card) or a form**, such as an order's line items or how a price was worked out.\n\n### When not to use it\n- **Content everyone needs** should not be hidden. If people always open it, show it.\n- **Views at the same level that people switch between** are [Tabs](/docs/navigation/tabs). Tabs show one view and keep the others' place. An accordion stacks them.\n- **Steps that must be done in order** are a [Form](/docs/input/form) with steps.\n- **A message that needs an answer** is a [Modal](/docs/feedback/modal).\n\n## Core Behavior\nEach section is a native `<details>` with a `<summary>`, so the browser provides:\n- the button role, `aria-expanded`, and **Enter** / **Space** to toggle;\n- find-in-page (Ctrl+F) that opens the section holding the match.\n\nOn top of that, Details animates the height, keeps a group exclusive, adds arrow-key navigation, loads content on first open and remembers what was open.\n\n### One section\n- `title` and `subtitle` are the summary. `icon` puts a mark beside them, and `badge` adds a [Badge](/docs/display/badge) (text, a number, or Badge props such as `{ label, tone }`).\n- `text` is the body text. `content` adds nodes or components after it.\n- `open` sets the state. `onToggle(open, { details })` and the `details-toggle` event report changes.\n- `disabled` keeps the section from opening.\n- `name`: standalone sections with the same `name` close each other, like the native attribute. Several Details spread over a page can then act as one group.\n- `addDetail(node)`, from the old API, still appends a node to the content.\n\n### An accordion\n- `items` is a list of sections: `{ id, title, subtitle, icon, badge, text, content, open, disabled }`.\n- By default **one section is open at a time**: opening one closes the one that was open. `multiple: true` lets several stay open.\n- `collapsible: false` always keeps one section open, and the open one cannot be closed. It suits steps or a settings menu.\n- `onToggle(id, open, { item, details })` reports every change, including the section that closed because another opened. `openIds` lists the open sections.\n- `show(id)`, `hide(id)` and `toggle(id)` change a section from code. `showAll()` and `hideAll()` work on all of them (`showAll` only with `multiple`).\n- `stateKey` remembers which sections were open, in the browser (localStorage), so they are still open after a reload.\n\n### Keyboard\n- **Tab** moves between summaries and into open content.\n- **Enter** or **Space** opens or closes the focused section.\n- **↓ ↑** move to the next or previous summary, skipping disabled ones and wrapping at the ends.\n- **Home** and **End** jump to the first and last summary.\n\n### Lazy content\n`content` can be a function `({ id, item, details }) => node | string | array`, and it can be `async`. It runs the first time its section opens, and a shimmer shows while it loads. A section nobody opens, holding a Table, a Form or a request, then costs nothing.\n\n### Memory\nThe sections own their content. Destroying the Details destroys the components inside, along with the icons and badges it built. When you set `items` again:\n- a section with the same `id` and the same `content` keeps its body exactly as it was, with what was typed in it and whether it was open;\n- a section that is gone, or whose `content` changed, has its body destroyed.\n\n## Looks\n- `variant`:\n  - `'outlined'` (default): one border around the group, with dividers between sections;\n  - `'separated'`: each section its own box, and the open one stands out;\n  - `'filled'`: a tinted surface;\n  - `'ghost'`: dividers only, flush with the text around it.\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- `marker`: `'chevron'` (default) turns as the section opens. `'plus'` is a plus that becomes a minus.\n- The CSS variables `--slice-details-accent`, `--slice-details-bg`, `--slice-details-border` and `--slice-details-radius` retint it.\n\n## Live Preview\n:::component name=\"Details\"\n{\n  \"title\": \"What's included?\",\n  \"subtitle\": \"Every plan\",\n  \"text\": \"Source code, tests, documentation and a year of updates.\"\n}\n:::\n\n## Examples\n:::script label=\"Help center with search\" expected=\"an accordion of questions with an icon each; typing in the search keeps only the matching questions and opens the first one; no match shows an empty state\"\nconst faqs = [\n  { id: 'ship', icon: 'truck', title: 'How long does shipping take?', text: 'Orders leave our warehouse within one business day and arrive in 2–4 days.' },\n  { id: 'return', icon: 'refresh', title: 'Can I return an order?', text: 'Yes. You have 30 days from delivery to return anything, unused and in its box.' },\n  { id: 'pay', icon: 'credit-card', title: 'Which payment methods do you take?', text: 'Cards, bank transfers and mobile payments. You are only charged when the order ships.' },\n  { id: 'track', icon: 'map-pin', title: 'How do I track my order?', text: 'The shipping email has a tracking link. You can also find it under Orders in your account.' },\n  { id: 'cancel', icon: 'close-circle', title: 'Can I cancel an order?', text: 'Until it ships, from Orders in your account. After that, return it instead.' }\n];\n\nconst help = await slice.build('Details', { items: faqs, variant: 'separated' });\nconst empty = await slice.build('EmptyState', { icon: 'search', title: 'No questions match', description: 'Try another word, or write to us.' });\nempty.hidden = true;\n\nconst search = await slice.build('Input', {\n  label: 'Search the help center',\n  icon: 'search',\n  clearable: true,\n  debounce: 200,\n  onChange: (query) => {\n    const q = query.trim().toLowerCase();\n    const found = q ? faqs.filter((f) => (f.title + ' ' + f.text).toLowerCase().includes(q)) : faqs;\n    // Sections that stay keep their state; only the list changes.\n    help.items = found;\n    help.hidden = found.length === 0;\n    empty.hidden = found.length > 0;\n    if (q && found.length) help.show(found[0].id);\n  }\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:16px;width:100%;max-width:640px';\nbox.append(search, help, empty);\nreturn box;\n:::\n\n:::script label=\"Order summary in a Card\" expected=\"a Card with the order total; 'Items' opens a lazily built Table of the order lines and 'How the total is worked out' shows the breakdown\"\nconst lines = [\n  { item: 'Notebook A5, dotted', qty: 3, price: 6.5 },\n  { item: 'Gel pens, pack of 10', qty: 1, price: 9 },\n  { item: 'Washi tape set', qty: 2, price: 4.25 }\n];\nconst subtotal = lines.reduce((sum, l) => sum + l.qty * l.price, 0);\nconst shipping = 4;\nconst tax = Math.round(subtotal * 0.16 * 100) / 100;\nconst money = (n) => `$${n.toFixed(2)}`;\n\nconst breakdown = document.createElement('dl');\nbreakdown.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:6px 16px;margin:0;font-size:.9rem';\nfor (const [label, value] of [['Subtotal', subtotal], ['Shipping', shipping], ['VAT (16%)', tax]]) {\n  breakdown.insertAdjacentHTML('beforeend', `<dt>${label}</dt><dd style=\"margin:0;text-align:right\">${money(value)}</dd>`);\n}\n\nconst more = await slice.build('Details', {\n  variant: 'ghost',\n  size: 'sm',\n  multiple: true,\n  items: [\n    {\n      id: 'items', title: 'Items', badge: lines.length,\n      // Built the first time someone opens it.\n      content: () => slice.build('Table', {\n        columns: [\n          { key: 'item', label: 'Item' },\n          { key: 'qty', label: 'Qty' },\n          { key: 'price', label: 'Price', render: (row) => money(row.qty * row.price) }\n        ],\n        rows: lines\n      })\n    },\n    { id: 'total', title: 'How the total is worked out', content: breakdown }\n  ]\n});\n\nconst total = document.createElement('div');\ntotal.style.cssText = 'font-size:1.6rem;font-weight:700';\ntotal.textContent = money(subtotal + shipping + tax);\n\nconst card = await slice.build('Card', {\n  title: 'Order #1042',\n  subtitle: 'Placed today · ships tomorrow',\n  headerIcon: 'shopping-bag',\n  badge: { label: 'Paid', tone: 'success' },\n  content: [total, more],\n  actions: [{ value: 'Track order', variant: 'filled' }, { value: 'Invoice', variant: 'ghost', icon: 'download' }]\n});\ncard.style.maxWidth = '460px';\nreturn card;\n:::\n\n:::script label=\"Settings, one section at a time\" expected=\"a settings accordion that always keeps one section open; each section holds a Form built on first open; saving shows a toast and the section's badge\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\n\nconst form = (schema, label) => async () => slice.build('Form', {\n  variant: 'plain',\n  columns: 2,\n  submitText: 'Save',\n  schema,\n  onSubmit: () => {\n    toasts.show(`${label} saved`, { type: 'success' });\n    const items = settings.items.map((i) => (i.title === label ? { ...i, badge: { label: 'Saved', tone: 'success' } } : i));\n    settings.items = items;\n  }\n});\n\nconst settings = await slice.build('Details', {\n  collapsible: false,\n  stateKey: 'docs-settings-demo',\n  items: [\n    { id: 'profile', title: 'Profile', subtitle: 'Name and contact', icon: 'user', content: form([\n      { kind: 'field', name: 'name', label: 'Full name', component: 'Input', required: true, value: 'Ana Pérez' },\n      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true, value: 'ana@example.com', props: { type: 'email' } }\n    ], 'Profile') },\n    { id: 'notifications', title: 'Notifications', subtitle: 'What we email you about', icon: 'bell', content: form([\n      { kind: 'field', name: 'orders', label: 'Order updates', component: 'Switch', valueProp: 'checked', value: true },\n      { kind: 'field', name: 'news', label: 'Newsletter', component: 'Switch', valueProp: 'checked', value: false }\n    ], 'Notifications') },\n    { id: 'security', title: 'Security', subtitle: 'Password and sessions', icon: 'shield-check', content: form([\n      { kind: 'field', name: 'password', label: 'New password', component: 'Input', required: true, props: { type: 'password', minlength: 8 }, full: true }\n    ], 'Security') },\n    { id: 'billing', title: 'Billing', subtitle: 'Available on paid plans', icon: 'credit-card', disabled: true }\n  ]\n});\nsettings.style.cssText = 'width:100%;max-width:640px';\nreturn settings;\n:::\n\n:::script label=\"Release notes\" expected=\"versions as a ghost accordion with a plus marker; several can be open; Expand all and Collapse all work on every version\"\nconst releases = [\n  { id: '3.2', title: 'v3.2.0', subtitle: 'October 2026', badge: { label: 'Latest', tone: 'accent' }, open: true, notes: ['DatePicker, with ranges and presets', 'Card rebuilt: actions, selectable, loading', 'Details groups into an accordion'] },\n  { id: '3.1', title: 'v3.1.0', subtitle: 'September 2026', notes: ['Tabs: four variants, lazy panels', 'Modal: drawer and sheet layouts'] },\n  { id: '3.0', title: 'v3.0.0', subtitle: 'August 2026', badge: { label: 'Breaking', tone: 'danger' }, notes: ['Lucide icons replace the icon font', 'Themes moved to CSS variables'] }\n];\nconst list = (notes) => {\n  const ul = document.createElement('ul');\n  ul.style.cssText = 'margin:0;padding-left:20px;line-height:1.8';\n  for (const note of notes) ul.insertAdjacentHTML('beforeend', `<li>${note}</li>`);\n  return ul;\n};\n\nconst notes = await slice.build('Details', {\n  variant: 'ghost',\n  marker: 'plus',\n  multiple: true,\n  items: releases.map((r) => ({ ...r, content: list(r.notes) }))\n});\n\nconst expand = await slice.build('Button', { value: 'Expand all', variant: 'ghost', size: 'sm', onClick: () => notes.showAll() });\nconst collapse = await slice.build('Button', { value: 'Collapse all', variant: 'ghost', size: 'sm', onClick: () => notes.hideAll() });\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:4px;justify-content:flex-end';\nbar.append(expand, collapse);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:8px;width:100%;max-width:640px';\nbox.append(bar, notes);\nreturn box;\n:::\n\n:::script label=\"Looks at a glance\" expected=\"the four variants side by side, a small one with the plus marker, and a single section\"\nconst items = [\n  { id: 'a', title: 'First section', icon: 'star', text: 'Some text inside.', open: true },\n  { id: 'b', title: 'Second section', badge: 2, text: 'More text.' },\n  { id: 'c', title: 'Disabled', disabled: true }\n];\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;width:100%';\nfor (const variant of ['outlined', 'separated', 'filled', 'ghost']) {\n  box.appendChild(await slice.build('Details', { items, variant }));\n}\nbox.appendChild(await slice.build('Details', { items, size: 'sm', marker: 'plus' }));\nbox.appendChild(await slice.build('Details', { title: 'A single section', subtitle: 'No items needed', text: 'Just a title and what it hides.' }));\nreturn box;\n:::\n\n## Best Practices\n:::tip\nWrite summaries people can scan: the question as they would ask it, or the name of the setting. The answer goes inside. A summary that only says \"More\" makes people open every section to find anything.\n:::\n\n:::tip\nMake heavy sections functions. A Table, a chart or a request in a section nobody opens then costs nothing, and the page loads faster.\n:::\n\n:::tip\nUse `multiple` when people compare sections (release notes, specs) and the default one-at-a-time when they look for one thing (a FAQ). One at a time keeps the page short. Several at once let people read side by side.\n:::\n\n## Pitfalls\n:::warning\nDo not hide errors in a closed section. When a form inside a section fails, open it (`show(id)`) and put a badge on it, so people know where to look.\n:::\n\n:::warning\nGive every item a stable `id`. Open state, remembered state and kept content all go by it: an id that changes on every render rebuilds the section and closes it.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"title\": \"What's included?\",\n  \"subtitle\": \"Every plan\",\n  \"text\": \"Source code, tests, documentation and a year of updates.\"\n}") {
               try {
                  props = JSON.parse("{\n  \"title\": \"What's included?\",\n  \"subtitle\": \"Every plan\",\n  \"text\": \"Source code, tests, documentation and a year of updates.\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Details', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"subtitle\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"content\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"badge\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"collapsible\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"stateKey\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"marker\",\"type\":\"string\",\"required\":false,\"default\":\"chevron\",\"allowedValues\":[]},{\"path\":\"onToggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"subtitle\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"content\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"badge\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"collapsible\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"stateKey\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"marker\",\"type\":\"string\",\"required\":false,\"default\":\"chevron\",\"allowedValues\":[]},{\"path\":\"onToggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Card","path":"/docs/layout/card"},{"text":"Tabs","path":"/docs/navigation/tabs"},{"text":"Form","path":"/docs/input/form"},{"text":"Modal","path":"/docs/feedback/modal"},{"text":"Badge","path":"/docs/display/badge"}];
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

customElements.define('slice-detailsdocumentation', DetailsDocumentation);
