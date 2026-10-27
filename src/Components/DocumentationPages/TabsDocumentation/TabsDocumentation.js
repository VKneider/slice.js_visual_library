export default class TabsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"A project page","expected":"Overview, Issues (a Table whose ⋯ menu closes issues and updates the badge), Activity (loads on first open) and Settings (a Form)","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nlet issues = [\n  { id: 101, title: 'Login button misaligned on Safari', label: 'bug', opened: '2 days ago' },\n  { id: 102, title: 'Add dark mode to the export dialog', label: 'feature', opened: 'yesterday' },\n  { id: 103, title: 'Table sort resets after filtering', label: 'bug', opened: '5 hours ago' }\n];\n\nconst overview = document.createElement('div');\noverview.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px';\nconst stat = (label, value) => {\n  const box = document.createElement('div');\n  box.style.cssText = 'padding:14px 16px;border:1px solid var(--slice-border-raised);border-radius:12px';\n  box.innerHTML = '<div style=\"font-size:.8rem;opacity:.7\"></div><div style=\"font-size:1.5rem;font-weight:700\"></div>';\n  box.children[0].textContent = label;\n  box.children[1].textContent = value;\n  return box;\n};\nconst openCount = stat('Open issues', issues.length);\noverview.append(openCount, stat('Contributors', 8), stat('Last release', 'v2.4.1'));\n\nconst issueTable = await slice.build('Table', {\n  columns: [\n    { key: 'id', label: '#', render: (row) => `#${row.id}` },\n    { key: 'title', label: 'Title' },\n    { key: 'label', label: 'Label' },\n    { key: 'opened', label: 'Opened' }\n  ],\n  rows: issues,\n  rowKey: 'id',\n  rowActions: [{\n    label: 'Close issue',\n    onClick: ({ row }) => {\n      issues = issues.filter((i) => i.id !== row.id);\n      issueTable.rows = issues;\n      tabs.setBadge('issues', issues.length || null);\n      openCount.children[1].textContent = issues.length;\n      toasts.show(`Closed #${row.id}`, { type: 'success' });\n    }\n  }]\n});\nissueTable.style.width = '100%';\n\nconst settings = await slice.build('Form', {\n  variant: 'plain',\n  columns: 2,\n  submitText: 'Save settings',\n  schema: [\n    { kind: 'field', name: 'name', label: 'Project name', component: 'Input', required: true, value: 'website-redesign' },\n    { kind: 'field', name: 'visibility', label: 'Visibility', component: 'Select', props: { options: ['Private', 'Team', 'Public'] }, value: 'Team' },\n    { kind: 'field', name: 'description', label: 'Description', component: 'Textarea', full: true, value: 'The new marketing site.' }\n  ],\n  onSubmit: () => toasts.show('Settings saved', { type: 'success' })\n});\n\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'overview', label: 'Overview', icon: 'home', panel: overview },\n    { id: 'issues', label: 'Issues', icon: 'exclamation-circle', badge: issues.length, panel: issueTable },\n    {\n      id: 'activity', label: 'Activity', icon: 'bell',\n      // Lazy: runs the first time the tab opens (the shimmer shows meanwhile).\n      panel: async () => {\n        await new Promise((r) => setTimeout(r, 900));\n        const list = document.createElement('ul');\n        list.style.cssText = 'margin:0;padding-left:18px;line-height:1.9';\n        for (const line of ['Ana merged #98 into main', 'José opened #103', 'Luis released v2.4.1', 'María commented on #101']) {\n          list.appendChild(Object.assign(document.createElement('li'), { textContent: line }));\n        }\n        return list;\n      }\n    },\n    { id: 'settings', label: 'Settings', icon: 'cog', panel: settings }\n  ]\n});\ntabs.style.width = '100%';\nreturn tabs;"},{"label":"An editor with file tabs","expected":"New file adds a tab; editing marks it with a dot; closing an edited tab asks first in a Modal","kind":"script","content":"const files = new Map();   // id -> { name, saved, editor }\nlet count = 0;\n\nconst discard = async (name) => {\n  const modal = await slice.build('Modal', {\n    title: `Close ${name} without saving?`,\n    description: 'Your changes will be lost.',\n    tone: 'warning',\n    size: 'sm',\n    destroyOnClose: true,\n    actions: [{ value: 'Keep editing', variant: 'ghost', autofocus: true }, { value: 'Discard', variant: 'danger', close: 'discard' }]\n  });\n  document.body.appendChild(modal);\n  return (await modal.show()).returnValue === 'discard';\n};\n\nconst newFile = async (name = `untitled-${++count}.md`, text = '') => {\n  const id = `file-${Date.now()}-${count}`;\n  const editor = await slice.build('Textarea', {\n    ariaLabel: name, value: text, rows: 8, autoGrow: true, maxRows: 14, resize: 'none',\n    placeholder: 'Start writing…'\n  });\n  const file = { name, saved: text, editor };\n  editor.onChange = (value) => tabs.setBadge(id, value === file.saved ? null : true);\n  files.set(id, file);\n  tabs.addTab({ id, label: name, icon: 'file-lines', closable: true, panel: editor });\n  tabs.select(id);\n};\n\nconst tabs = await slice.build('Tabs', {\n  items: [],\n  size: 'sm',\n  onClose: (id) => {\n    const file = files.get(id);\n    if (file.editor.value === file.saved) { files.delete(id); return true; }\n    // Ask first; close for real only if they agree.\n    discard(file.name).then((ok) => { if (ok) { files.delete(id); tabs.removeTab(id); } });\n    return false;\n  }\n});\ntabs.style.width = '100%';\n\nconst save = await slice.build('Button', {\n  value: 'Save', size: 'sm', variant: 'outlined',\n  onClick: () => {\n    const file = files.get(tabs.activeTab);\n    if (!file) return;\n    file.saved = file.editor.value;\n    tabs.setBadge(tabs.activeTab, null);\n  }\n});\nconst add = await slice.build('Button', { value: 'New file', icon: 'plus', size: 'sm', onClick: () => newFile() });\nawait newFile('README.md', '# Website redesign\\n\\nThe new marketing site.');\nawait newFile('notes.md', '- Ask Ana about the hero image');\n\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-bottom:8px';\nbar.append(save, add);\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(bar, tabs);\nreturn box;"},{"label":"Pricing with a segmented switch","expected":"Monthly / Yearly switches every price; Yearly carries a -20% badge","kind":"script","content":"const plans = [\n  { name: 'Starter', monthly: 9, features: ['3 projects', 'Email support'] },\n  { name: 'Team', monthly: 29, features: ['Unlimited projects', 'Shared workspaces', 'Priority support'], featured: true },\n  { name: 'Business', monthly: 79, features: ['SSO', 'Audit log', 'Dedicated manager'] }\n];\nconst cards = document.createElement('div');\ncards.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:6px';\nconst prices = [];\nfor (const plan of plans) {\n  const card = document.createElement('div');\n  card.style.cssText = `display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:14px;border:${plan.featured ? '2px solid var(--primary-color)' : '1px solid var(--slice-border-raised)'}`;\n  const name = Object.assign(document.createElement('div'), { textContent: plan.name });\n  name.style.fontWeight = '700';\n  const price = document.createElement('div');\n  price.style.cssText = 'font-size:1.8rem;font-weight:800;font-variant-numeric:tabular-nums';\n  prices.push({ price, plan });\n  const list = document.createElement('ul');\n  list.style.cssText = 'margin:0;padding-left:18px;line-height:1.8;font-size:.9rem';\n  for (const f of plan.features) list.appendChild(Object.assign(document.createElement('li'), { textContent: f }));\n  const cta = await slice.build('Button', { value: `Choose ${plan.name}`, variant: plan.featured ? 'filled' : 'outlined', size: 'sm' });\n  card.append(name, price, list, cta);\n  cards.appendChild(card);\n}\nconst paint = (period) => {\n  for (const { price, plan } of prices) {\n    const value = period === 'yearly' ? Math.round(plan.monthly * 12 * 0.8) : plan.monthly;\n    price.textContent = `$${value}`;\n    price.appendChild(Object.assign(document.createElement('span'), {\n      textContent: period === 'yearly' ? ' / year' : ' / month',\n      style: 'font-size:.85rem;font-weight:500;opacity:.7'\n    }));\n  }\n};\nconst period = await slice.build('Tabs', {\n  variant: 'segmented',\n  align: 'center',\n  ariaLabel: 'Billing period',\n  items: [{ id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly', badge: '-20%' }],\n  onChange: paint\n});\npaint('monthly');\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;gap:16px;align-items:center;width:100%';\ncards.style.width = '100%';\nbox.append(period, cards);\nreturn box;"},{"label":"Settings with a vertical menu","expected":"a vertical pill menu beside the panels; the section is kept in the address as ?section=…","kind":"script","content":"const field = (props) => slice.build('Input', props);\nconst profile = document.createElement('div');\nprofile.style.cssText = 'display:grid;gap:18px;max-width:420px';\nprofile.append(\n  await field({ label: 'Full name', value: 'Ana López' }),\n  await field({ label: 'Email', type: 'email', icon: 'user', value: 'ana@example.com' })\n);\nconst notifications = document.createElement('div');\nnotifications.style.cssText = 'display:flex;flex-direction:column;gap:12px';\nfor (const [label, checked] of [['Comments', true], ['Mentions', true], ['Weekly digest', false]]) {\n  notifications.appendChild(await slice.build('Switch', { label, checked, labelPlacement: 'left' }));\n}\nconst security = document.createElement('div');\nsecurity.style.cssText = 'display:grid;gap:18px;max-width:420px';\nsecurity.append(\n  await field({ label: 'Current password', type: 'password', secret: true }),\n  await field({ label: 'New password', type: 'password', secret: true, minlength: 8, help: 'At least 8 characters' })\n);\nconst tabs = await slice.build('Tabs', {\n  orientation: 'vertical',\n  variant: 'pill',\n  urlParam: 'section',\n  ariaLabel: 'Settings',\n  items: [\n    { id: 'profile', label: 'Profile', icon: 'user', panel: profile },\n    { id: 'notifications', label: 'Notifications', icon: 'bell', badge: 2, panel: notifications },\n    { id: 'security', label: 'Security', icon: 'shield', panel: security },\n    { id: 'billing', label: 'Billing', icon: 'file-invoice', disabled: true }\n  ]\n});\ntabs.style.width = '100%';\nreturn tabs;"},{"label":"Looks at a glance","expected":"the four variants, the three sizes and a strip that overflows","kind":"script","content":"const items = [\n  { id: 'a', label: 'Overview', icon: 'home' },\n  { id: 'b', label: 'Inbox', icon: 'inbox', badge: 12 },\n  { id: 'c', label: 'Team', icon: 'users', badge: true },\n  { id: 'd', label: 'Archived', disabled: true }\n];\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;gap:26px;width:100%';\nfor (const variant of ['underline', 'pill', 'segmented', 'enclosed']) {\n  box.appendChild(await slice.build('Tabs', { variant, items: items.map((i) => ({ ...i, panel: `${variant} — ${i.label}` })) }));\n}\nfor (const size of ['sm', 'lg']) box.appendChild(await slice.build('Tabs', { size, variant: 'pill', items }));\nbox.appendChild(await slice.build('Tabs', {\n  closable: true,\n  items: Array.from({ length: 14 }, (_, i) => ({ id: `f${i}`, label: `report-${i + 1}.csv` }))\n}));\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "tabs.md";
    this.markdownContent = "---\ntitle: Tabs\nroute: /docs/navigation/tabs\nnavLabel: Tabs\nsection: Navigation\ngroup: Core\norder: 31\ndescription: Tab strip with four variants, a sliding indicator, icons, badges, closable and lazy tabs, overflow arrows, vertical layout, the full keyboard pattern and remembered state.\ncomponent: TabsDocumentation\ngenerate: true\ntags: [tabs, navigation, routing, panels]\n---\n\n# Tabs\n\n## Overview\n`Tabs` switches between sibling views without leaving the page. It follows the WAI-ARIA tabs pattern in full:\n- the tab strip, each tab and each panel carry the roles screen readers expect, and every tab is linked to its panel;\n- only one tab is in the Tab order at a time, and the arrow keys move between tabs;\n- the active tab is marked by an indicator that slides to it.\n\nTabs can have icons and badges, be disabled or closed, and load their panel only when first opened. When there are more tabs than fit, arrows appear to scroll the strip.\n\n## Core Behavior\n- `items` are the tabs: `{ id, label, icon, badge, disabled, hidden, closable, panel }`.\n  - `panel` can be a node, a string, or a **function** that returns one (it may be `async`). A function runs the first time its tab opens, so expensive content (a Table, a chart, a request) only costs anything once someone looks at it. While it loads, the panel shows a shimmer.\n  - `badge` is a number (over 99 shows \"99+\"), a short text, or `true` for a dot. `setBadge(id, value)` updates it without re-rendering; `null` removes it.\n  - A tab with only an `icon` and no `label` takes its accessible name from `ariaLabel`.\n- `activeTab` sets the open tab. `onChange(id)` and the `tab-change` event (`detail: { tabId, item, previous }`) report changes. `activeItem` and `activeIndex` tell you which one is open.\n- `onBeforeChange(next, previous)` can return `false` to stay on the current tab, for example while it has unsaved changes.\n- `select(id)`, `next()` and `prev()` switch from code. `addTab(item, index)` and `removeTab(id)` add and remove tabs.\n\n### Keyboard\n- **← →** (or **↑ ↓** when vertical) move to the next or previous tab, skipping disabled ones and wrapping at the ends.\n- **Home** and **End** jump to the first and last tab.\n- **Delete** closes a closable tab, as does a middle click.\n- `activation: 'auto'` (default) opens a tab as soon as the arrow keys reach it. With `'manual'`, the arrows only move the focus and **Enter** or **Space** opens the tab. Use manual when opening a panel is slow.\n\n### Closing tabs\n- `closable: true` puts a ✕ on every tab; `closable` on an item does it for one tab (or `closable: false` keeps one open).\n- `onClose(id, item)` runs first. Return `false` to keep the tab, for example to ask whether to discard changes.\n- When a tab is closed, its neighbour opens, and the closed tab's panel is destroyed along with every Slice component inside it.\n\n### Remembering the tab\n- `stateKey` remembers the open tab in the browser (localStorage), so it is still open after a reload.\n- `urlParam: 'tab'` keeps it in the address (`?tab=billing`), so a link can open a page on the right tab. It replaces the current history entry rather than adding one, so Back leaves the page instead of stepping through every tab clicked.\n- On load, the URL wins, then what was remembered, then `activeTab`, then the first enabled tab.\n\n### Memory\nThe panels belong to the Tabs. When you set `items` again, a tab whose `id` and `panel` are the same keeps its panel exactly as it was, along with everything typed into it. A tab that is gone, or whose `panel` changed, has its panel destroyed. `keepMounted: false` throws away a function panel when you leave its tab and runs it again the next time it opens.\n\n## Looks\n- `variant`:\n  - `'underline'` (default): a bar under the active tab. It was called `'primary'`, which still works.\n  - `'pill'`: a soft pill behind the active tab.\n  - `'segmented'`: a segmented control, where the active tab is a filled pill. It was called `'secondary'`, which still works.\n  - `'enclosed'`: card-like tabs attached to a bordered panel.\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- `orientation: 'vertical'` puts the tabs in a column beside the panels, as in a settings page.\n- `align`: `'start'` (default), `'center'`, `'end'` or `'stretch'` (tabs share the width equally).\n\n## Live Preview\n:::component name=\"Tabs\"\n{\n  \"items\": [\n    { \"id\": \"overview\", \"label\": \"Overview\", \"icon\": \"home\", \"panel\": \"A summary of the project.\" },\n    { \"id\": \"inbox\", \"label\": \"Inbox\", \"icon\": \"inbox\", \"badge\": 4, \"panel\": \"Four unread messages.\" },\n    { \"id\": \"settings\", \"label\": \"Settings\", \"icon\": \"cog\", \"panel\": \"Project settings.\" }\n  ]\n}\n:::\n\n## Examples\n:::script label=\"A project page\" expected=\"Overview, Issues (a Table whose ⋯ menu closes issues and updates the badge), Activity (loads on first open) and Settings (a Form)\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nlet issues = [\n  { id: 101, title: 'Login button misaligned on Safari', label: 'bug', opened: '2 days ago' },\n  { id: 102, title: 'Add dark mode to the export dialog', label: 'feature', opened: 'yesterday' },\n  { id: 103, title: 'Table sort resets after filtering', label: 'bug', opened: '5 hours ago' }\n];\n\nconst overview = document.createElement('div');\noverview.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px';\nconst stat = (label, value) => {\n  const box = document.createElement('div');\n  box.style.cssText = 'padding:14px 16px;border:1px solid var(--slice-border-raised);border-radius:12px';\n  box.innerHTML = '<div style=\"font-size:.8rem;opacity:.7\"></div><div style=\"font-size:1.5rem;font-weight:700\"></div>';\n  box.children[0].textContent = label;\n  box.children[1].textContent = value;\n  return box;\n};\nconst openCount = stat('Open issues', issues.length);\noverview.append(openCount, stat('Contributors', 8), stat('Last release', 'v2.4.1'));\n\nconst issueTable = await slice.build('Table', {\n  columns: [\n    { key: 'id', label: '#', render: (row) => `#${row.id}` },\n    { key: 'title', label: 'Title' },\n    { key: 'label', label: 'Label' },\n    { key: 'opened', label: 'Opened' }\n  ],\n  rows: issues,\n  rowKey: 'id',\n  rowActions: [{\n    label: 'Close issue',\n    onClick: ({ row }) => {\n      issues = issues.filter((i) => i.id !== row.id);\n      issueTable.rows = issues;\n      tabs.setBadge('issues', issues.length || null);\n      openCount.children[1].textContent = issues.length;\n      toasts.show(`Closed #${row.id}`, { type: 'success' });\n    }\n  }]\n});\nissueTable.style.width = '100%';\n\nconst settings = await slice.build('Form', {\n  variant: 'plain',\n  columns: 2,\n  submitText: 'Save settings',\n  schema: [\n    { kind: 'field', name: 'name', label: 'Project name', component: 'Input', required: true, value: 'website-redesign' },\n    { kind: 'field', name: 'visibility', label: 'Visibility', component: 'Select', props: { options: ['Private', 'Team', 'Public'] }, value: 'Team' },\n    { kind: 'field', name: 'description', label: 'Description', component: 'Textarea', full: true, value: 'The new marketing site.' }\n  ],\n  onSubmit: () => toasts.show('Settings saved', { type: 'success' })\n});\n\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'overview', label: 'Overview', icon: 'home', panel: overview },\n    { id: 'issues', label: 'Issues', icon: 'exclamation-circle', badge: issues.length, panel: issueTable },\n    {\n      id: 'activity', label: 'Activity', icon: 'bell',\n      // Lazy: runs the first time the tab opens (the shimmer shows meanwhile).\n      panel: async () => {\n        await new Promise((r) => setTimeout(r, 900));\n        const list = document.createElement('ul');\n        list.style.cssText = 'margin:0;padding-left:18px;line-height:1.9';\n        for (const line of ['Ana merged #98 into main', 'José opened #103', 'Luis released v2.4.1', 'María commented on #101']) {\n          list.appendChild(Object.assign(document.createElement('li'), { textContent: line }));\n        }\n        return list;\n      }\n    },\n    { id: 'settings', label: 'Settings', icon: 'cog', panel: settings }\n  ]\n});\ntabs.style.width = '100%';\nreturn tabs;\n:::\n\n:::script label=\"An editor with file tabs\" expected=\"New file adds a tab; editing marks it with a dot; closing an edited tab asks first in a Modal\"\nconst files = new Map();   // id -> { name, saved, editor }\nlet count = 0;\n\nconst discard = async (name) => {\n  const modal = await slice.build('Modal', {\n    title: `Close ${name} without saving?`,\n    description: 'Your changes will be lost.',\n    tone: 'warning',\n    size: 'sm',\n    destroyOnClose: true,\n    actions: [{ value: 'Keep editing', variant: 'ghost', autofocus: true }, { value: 'Discard', variant: 'danger', close: 'discard' }]\n  });\n  document.body.appendChild(modal);\n  return (await modal.show()).returnValue === 'discard';\n};\n\nconst newFile = async (name = `untitled-${++count}.md`, text = '') => {\n  const id = `file-${Date.now()}-${count}`;\n  const editor = await slice.build('Textarea', {\n    ariaLabel: name, value: text, rows: 8, autoGrow: true, maxRows: 14, resize: 'none',\n    placeholder: 'Start writing…'\n  });\n  const file = { name, saved: text, editor };\n  editor.onChange = (value) => tabs.setBadge(id, value === file.saved ? null : true);\n  files.set(id, file);\n  tabs.addTab({ id, label: name, icon: 'file-lines', closable: true, panel: editor });\n  tabs.select(id);\n};\n\nconst tabs = await slice.build('Tabs', {\n  items: [],\n  size: 'sm',\n  onClose: (id) => {\n    const file = files.get(id);\n    if (file.editor.value === file.saved) { files.delete(id); return true; }\n    // Ask first; close for real only if they agree.\n    discard(file.name).then((ok) => { if (ok) { files.delete(id); tabs.removeTab(id); } });\n    return false;\n  }\n});\ntabs.style.width = '100%';\n\nconst save = await slice.build('Button', {\n  value: 'Save', size: 'sm', variant: 'outlined',\n  onClick: () => {\n    const file = files.get(tabs.activeTab);\n    if (!file) return;\n    file.saved = file.editor.value;\n    tabs.setBadge(tabs.activeTab, null);\n  }\n});\nconst add = await slice.build('Button', { value: 'New file', icon: 'plus', size: 'sm', onClick: () => newFile() });\nawait newFile('README.md', '# Website redesign\\n\\nThe new marketing site.');\nawait newFile('notes.md', '- Ask Ana about the hero image');\n\nconst bar = document.createElement('div');\nbar.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-bottom:8px';\nbar.append(save, add);\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(bar, tabs);\nreturn box;\n:::\n\n:::script label=\"Pricing with a segmented switch\" expected=\"Monthly / Yearly switches every price; Yearly carries a -20% badge\"\nconst plans = [\n  { name: 'Starter', monthly: 9, features: ['3 projects', 'Email support'] },\n  { name: 'Team', monthly: 29, features: ['Unlimited projects', 'Shared workspaces', 'Priority support'], featured: true },\n  { name: 'Business', monthly: 79, features: ['SSO', 'Audit log', 'Dedicated manager'] }\n];\nconst cards = document.createElement('div');\ncards.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:6px';\nconst prices = [];\nfor (const plan of plans) {\n  const card = document.createElement('div');\n  card.style.cssText = `display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:14px;border:${plan.featured ? '2px solid var(--primary-color)' : '1px solid var(--slice-border-raised)'}`;\n  const name = Object.assign(document.createElement('div'), { textContent: plan.name });\n  name.style.fontWeight = '700';\n  const price = document.createElement('div');\n  price.style.cssText = 'font-size:1.8rem;font-weight:800;font-variant-numeric:tabular-nums';\n  prices.push({ price, plan });\n  const list = document.createElement('ul');\n  list.style.cssText = 'margin:0;padding-left:18px;line-height:1.8;font-size:.9rem';\n  for (const f of plan.features) list.appendChild(Object.assign(document.createElement('li'), { textContent: f }));\n  const cta = await slice.build('Button', { value: `Choose ${plan.name}`, variant: plan.featured ? 'filled' : 'outlined', size: 'sm' });\n  card.append(name, price, list, cta);\n  cards.appendChild(card);\n}\nconst paint = (period) => {\n  for (const { price, plan } of prices) {\n    const value = period === 'yearly' ? Math.round(plan.monthly * 12 * 0.8) : plan.monthly;\n    price.textContent = `$${value}`;\n    price.appendChild(Object.assign(document.createElement('span'), {\n      textContent: period === 'yearly' ? ' / year' : ' / month',\n      style: 'font-size:.85rem;font-weight:500;opacity:.7'\n    }));\n  }\n};\nconst period = await slice.build('Tabs', {\n  variant: 'segmented',\n  align: 'center',\n  ariaLabel: 'Billing period',\n  items: [{ id: 'monthly', label: 'Monthly' }, { id: 'yearly', label: 'Yearly', badge: '-20%' }],\n  onChange: paint\n});\npaint('monthly');\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;gap:16px;align-items:center;width:100%';\ncards.style.width = '100%';\nbox.append(period, cards);\nreturn box;\n:::\n\n:::script label=\"Settings with a vertical menu\" expected=\"a vertical pill menu beside the panels; the section is kept in the address as ?section=…\"\nconst field = (props) => slice.build('Input', props);\nconst profile = document.createElement('div');\nprofile.style.cssText = 'display:grid;gap:18px;max-width:420px';\nprofile.append(\n  await field({ label: 'Full name', value: 'Ana López' }),\n  await field({ label: 'Email', type: 'email', icon: 'user', value: 'ana@example.com' })\n);\nconst notifications = document.createElement('div');\nnotifications.style.cssText = 'display:flex;flex-direction:column;gap:12px';\nfor (const [label, checked] of [['Comments', true], ['Mentions', true], ['Weekly digest', false]]) {\n  notifications.appendChild(await slice.build('Switch', { label, checked, labelPlacement: 'left' }));\n}\nconst security = document.createElement('div');\nsecurity.style.cssText = 'display:grid;gap:18px;max-width:420px';\nsecurity.append(\n  await field({ label: 'Current password', type: 'password', secret: true }),\n  await field({ label: 'New password', type: 'password', secret: true, minlength: 8, help: 'At least 8 characters' })\n);\nconst tabs = await slice.build('Tabs', {\n  orientation: 'vertical',\n  variant: 'pill',\n  urlParam: 'section',\n  ariaLabel: 'Settings',\n  items: [\n    { id: 'profile', label: 'Profile', icon: 'user', panel: profile },\n    { id: 'notifications', label: 'Notifications', icon: 'bell', badge: 2, panel: notifications },\n    { id: 'security', label: 'Security', icon: 'shield', panel: security },\n    { id: 'billing', label: 'Billing', icon: 'file-invoice', disabled: true }\n  ]\n});\ntabs.style.width = '100%';\nreturn tabs;\n:::\n\n:::script label=\"Looks at a glance\" expected=\"the four variants, the three sizes and a strip that overflows\"\nconst items = [\n  { id: 'a', label: 'Overview', icon: 'home' },\n  { id: 'b', label: 'Inbox', icon: 'inbox', badge: 12 },\n  { id: 'c', label: 'Team', icon: 'users', badge: true },\n  { id: 'd', label: 'Archived', disabled: true }\n];\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;gap:26px;width:100%';\nfor (const variant of ['underline', 'pill', 'segmented', 'enclosed']) {\n  box.appendChild(await slice.build('Tabs', { variant, items: items.map((i) => ({ ...i, panel: `${variant} — ${i.label}` })) }));\n}\nfor (const size of ['sm', 'lg']) box.appendChild(await slice.build('Tabs', { size, variant: 'pill', items }));\nbox.appendChild(await slice.build('Tabs', {\n  closable: true,\n  items: Array.from({ length: 14 }, (_, i) => ({ id: `f${i}`, label: `report-${i + 1}.csv` }))\n}));\nreturn box;\n:::\n\n## Best Practices\n:::tip\nUse tabs for views at the same level that people switch between. If they have to go through them in order, use a [Form](/docs/input/form) with steps instead.\n:::\n\n:::tip\nMake expensive panels functions. A Table with thousands of rows, a chart or a request in a tab nobody opens then costs nothing.\n:::\n\n:::tip\nUse `urlParam` on pages people link to or come back to (settings, a record's details). A link that opens the right tab saves a click and a \"where was that?\".\n:::\n\n## Pitfalls\n:::warning\nDo not hide validation errors in a tab that is not open. If a tab holds an error, put a badge on it (`setBadge(id, '!')`) and open it on submit, so people know where to look.\n:::\n\n:::warning\nGive every item a stable `id`. The tabs, their panels and what is remembered all go by it: an id that changes on every render rebuilds the panel each time, and throws away what was typed in it.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"items\": [\n    { \"id\": \"overview\", \"label\": \"Overview\", \"icon\": \"home\", \"panel\": \"A summary of the project.\" },\n    { \"id\": \"inbox\", \"label\": \"Inbox\", \"icon\": \"inbox\", \"badge\": 4, \"panel\": \"Four unread messages.\" },\n    { \"id\": \"settings\", \"label\": \"Settings\", \"icon\": \"cog\", \"panel\": \"Project settings.\" }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"items\": [\n    { \"id\": \"overview\", \"label\": \"Overview\", \"icon\": \"home\", \"panel\": \"A summary of the project.\" },\n    { \"id\": \"inbox\", \"label\": \"Inbox\", \"icon\": \"inbox\", \"badge\": 4, \"panel\": \"Four unread messages.\" },\n    { \"id\": \"settings\", \"label\": \"Settings\", \"icon\": \"cog\", \"panel\": \"Project settings.\" }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Tabs', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items[].id\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"items[].label\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"activeTab\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"underline\",\"allowedValues\":[\"underline\",\"pill\",\"segmented\",\"enclosed\",\"primary\",\"secondary\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"orientation\",\"type\":\"string\",\"required\":false,\"default\":\"horizontal\",\"allowedValues\":[\"horizontal\",\"vertical\"]},{\"path\":\"align\",\"type\":\"string\",\"required\":false,\"default\":\"start\",\"allowedValues\":[\"start\",\"center\",\"end\",\"stretch\"]},{\"path\":\"activation\",\"type\":\"string\",\"required\":false,\"default\":\"auto\",\"allowedValues\":[\"auto\",\"manual\"]},{\"path\":\"closable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"keepMounted\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"Tabs\",\"allowedValues\":[]},{\"path\":\"stateKey\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"urlParam\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onBeforeChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClose\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onTabChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items[].id\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"items[].label\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"activeTab\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"underline\",\"allowedValues\":[\"underline\",\"pill\",\"segmented\",\"enclosed\",\"primary\",\"secondary\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"orientation\",\"type\":\"string\",\"required\":false,\"default\":\"horizontal\",\"allowedValues\":[\"horizontal\",\"vertical\"]},{\"path\":\"align\",\"type\":\"string\",\"required\":false,\"default\":\"start\",\"allowedValues\":[\"start\",\"center\",\"end\",\"stretch\"]},{\"path\":\"activation\",\"type\":\"string\",\"required\":false,\"default\":\"auto\",\"allowedValues\":[\"auto\",\"manual\"]},{\"path\":\"closable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"keepMounted\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"Tabs\",\"allowedValues\":[]},{\"path\":\"stateKey\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"urlParam\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onBeforeChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClose\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onTabChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Form","path":"/docs/input/form"}];
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

customElements.define('slice-tabsdocumentation', TabsDocumentation);
