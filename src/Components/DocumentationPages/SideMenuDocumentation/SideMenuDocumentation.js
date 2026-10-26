export default class SideMenuDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Admin panel","expected":"an app with a tree SideMenu on the left (Dashboard, Orders with a badge, Catalog with nested Products and Categories, Customers, Settings) and a content area; choosing an item shows its page title in the content and marks it as current; Log out at the bottom is red and asks first","kind":"script","content":"const page = document.createElement('main');\npage.style.cssText = 'flex:1;min-width:0;padding:20px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 5%,transparent)';\n\nconst show = (item) => {\n  page.innerHTML = `<div style=\"font-size:.8rem;opacity:.65\">Admin</div>\n    <h3 style=\"margin:4px 0 8px\">${item.label}</h3>\n    <p style=\"margin:0;opacity:.8\">${item.description || 'The ' + item.label.toLowerCase() + ' page would render here.'}</p>`;\n};\n\nconst menu = await slice.build('SideMenu', {\n  mode: 'tree',\n  title: 'Acme admin',\n  followRoute: false,\n  activePath: '/admin/dashboard',\n  items: [\n    { label: 'Dashboard', path: '/admin/dashboard', icon: 'chart-pie' },\n    { label: 'Orders', path: '/admin/orders', icon: 'receipt', badge: { value: 7, tone: 'accent' } },\n    {\n      label: 'Catalog', icon: 'store', id: 'catalog',\n      items: [\n        { label: 'Products', path: '/admin/products', description: '1,204 items' },\n        { label: 'Categories', id: 'categories', items: [\n          { label: 'Electronics', path: '/admin/categories/electronics' },\n          { label: 'Home', path: '/admin/categories/home' },\n          { label: 'Toys', path: '/admin/categories/toys' }\n        ] },\n        { label: 'Discounts', path: '/admin/discounts', icon: 'sale-percent' }\n      ]\n    },\n    { label: 'Customers', path: '/admin/customers', icon: 'users' },\n    { label: 'Settings', path: '/admin/settings', icon: 'cog', items: [\n      { label: 'Store details', path: '/admin/settings/store' },\n      { label: 'Payments', path: '/admin/settings/payments' },\n      { label: 'Team', path: '/admin/settings/team', disabled: true, description: 'Owners only' }\n    ] },\n    { type: 'separator' },\n    {\n      label: 'Log out', icon: 'arrow-right-to-bracket', danger: true,\n      onClick: async () => {\n        const ask = await slice.build('Modal', {\n          title: 'Log out?', size: 'sm', destroyOnClose: true,\n          content: 'You will need to sign in again to manage the store.',\n          actions: [{ value: 'Stay', variant: 'ghost' }, { value: 'Log out', variant: 'danger', onClick: () => show({ label: 'Signed out', description: 'See you soon.' }) }]\n        });\n        document.body.appendChild(ask);\n        await ask.show();\n      }\n    }\n  ],\n  // In a real app the router shows the page. Here the example stops the\n  // navigation, draws the page itself and marks it as current.\n  onSelect: (item) => {\n    if (!item.path) return;\n    show(item);\n    menu.activePath = item.path;\n    return false;\n  }\n});\nshow({ label: 'Dashboard', description: 'Sales, orders and visitors for today.' });\n\nconst aside = document.createElement('aside');\naside.style.cssText = 'width:240px;flex:none';\naside.appendChild(menu);\n\nconst app = document.createElement('div');\napp.style.cssText = 'display:flex;gap:16px;width:100%;min-width:0;flex-wrap:wrap';\napp.append(aside, page);\nreturn app;"},{"label":"Store categories on a phone (drill, loaded on demand)","expected":"a phone-sized panel with a Shop menu; Departments slides in its departments with an 'All departments' link; each department loads its categories after a short wait (with a loading row); the back button names the level; Deals has a badge","kind":"script","content":"// A pretend API: categories arrive after a short wait.\nconst api = {\n  departments: async () => {\n    await new Promise((r) => setTimeout(r, 500));\n    return [\n      { label: 'Electronics', id: 'electronics', icon: 'desktop-pc', items: () => api.categories('Electronics') },\n      { label: 'Home & kitchen', id: 'home', icon: 'home', items: () => api.categories('Home & kitchen') },\n      { label: 'Sports', id: 'sports', icon: 'heart', items: () => api.categories('Sports') }\n    ];\n  },\n  categories: async (name) => {\n    await new Promise((r) => setTimeout(r, 400));\n    const slug = name.toLowerCase().replace(/[^a-z]+/g, '-');\n    return ['Best sellers', 'New arrivals', 'Under $25'].map((label) => ({ label, path: `/shop/${slug}/${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }));\n  }\n};\n\nconst status = document.createElement('p');\nstatus.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7';\nstatus.textContent = 'Pick a category.';\n\nconst menu = await slice.build('SideMenu', {\n  title: 'Shop',\n  size: 'lg',\n  followRoute: false,\n  items: [\n    { label: 'Departments', path: '/shop/departments', icon: 'grid', id: 'departments', items: api.departments },\n    { label: 'Deals', path: '/shop/deals', icon: 'sale-percent', badge: { label: 'Today', tone: 'danger' } },\n    { label: 'Orders', path: '/shop/orders', icon: 'truck', description: 'Track and return' },\n    { type: 'separator' },\n    { label: 'Help', href: 'https://example.com/help', target: '_blank', icon: 'life-saver' }\n  ],\n  onSelect: (item) => {\n    status.textContent = `Would open ${item.path || item.href}`;\n    if (item.path) menu.activePath = item.path;\n    return false;\n  }\n});\n\nconst phone = document.createElement('div');\nphone.style.cssText = 'width:100%;max-width:320px;min-width:0;padding:12px;border:1px solid var(--slice-border-raised, #ddd);border-radius:24px;box-shadow:var(--slice-shadow-md)';\nphone.append(menu, status);\nreturn phone;"},{"label":"Account menu with groups and actions","expected":"a drill menu with an Account group (Profile, Notifications with a badge, Billing disabled) and a Preferences group with a theme action and a Language submenu; choosing a language updates a status line; Log out is red","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nlet dark = false;\nconst languages = ['English', 'Español', 'Português'];\n\nconst menu = await slice.build('SideMenu', {\n  label: 'Account',\n  variant: 'ghost',\n  followRoute: false,\n  items: [\n    { type: 'group', label: 'Account', items: [\n      { label: 'Profile', path: '/account/profile', icon: 'user', description: 'Name, photo and email' },\n      { label: 'Notifications', path: '/account/notifications', icon: 'bell', badge: 3 },\n      { label: 'Billing', path: '/account/billing', icon: 'credit-card', disabled: true, description: 'Ask an owner' }\n    ] },\n    { type: 'group', label: 'Preferences', items: [\n      { label: 'Switch theme', icon: 'moon', onClick: () => { dark = !dark; toasts.show(`Theme: ${dark ? 'dark' : 'light'}`); } },\n      { label: 'Language', id: 'language', icon: 'globe', items: languages.map((name) => ({\n        label: name,\n        onClick: ({ menu: m }) => { toasts.show(`Language: ${name}`, { type: 'success' }); m.back(); }\n      })) }\n    ] },\n    { type: 'separator' },\n    { label: 'Log out', icon: 'arrow-right-to-bracket', danger: true, onClick: () => toasts.show('Logged out') }\n  ],\n  onSelect: (item) => { if (item.path) { toasts.show(`Open ${item.label}`); return false; } }\n});\n\nconst card = document.createElement('div');\ncard.style.cssText = 'width:100%;max-width:300px;min-width:0';\ncard.appendChild(menu);\nreturn card;"},{"label":"Tree on wide, drill on narrow","expected":"a resizable box (drag its corner) holding a menu with mode 'auto'; wider than 420px it is a tree, narrower it becomes a drill menu, and the open section stays open","kind":"script","content":"const menu = await slice.build('SideMenu', {\n  title: 'Docs',\n  // A tree from 420px wide, a drill menu below.\n  mode: 'auto',\n  breakpoint: 420,\n  followRoute: false,\n  activePath: '/guide/components/props',\n  items: [\n    { label: 'Getting started', path: '/guide/start', icon: 'rocket' },\n    { label: 'Guide', icon: 'book-open', id: 'guide', items: [\n      { label: 'Components', id: 'components', items: [\n        { label: 'Templates', path: '/guide/components/templates' },\n        { label: 'Props', path: '/guide/components/props' },\n        { label: 'Lifecycle', path: '/guide/components/lifecycle' }\n      ] },\n      { label: 'Routing', path: '/guide/routing' },\n      { label: 'Services', path: '/guide/services' }\n    ] },\n    { label: 'API reference', path: '/api', icon: 'code' }\n  ],\n  onSelect: (item) => { if (item.path) menu.activePath = item.path; return false; }\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'resize:horizontal;overflow:auto;width:520px;max-width:100%;min-width:240px;padding:12px;border:1px dashed var(--slice-border-raised, #ccc);border-radius:12px';\nbox.appendChild(menu);\n\nconst note = document.createElement('p');\nnote.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7';\nnote.textContent = 'Drag the corner of the box to make it narrower.';\n\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'width:100%;min-width:0';\nwrap.append(box, note);\nreturn wrap;"}];
  }

  async init() {
    this.markdownPath = "Sidemenu.md";
    this.markdownContent = "---\ntitle: SideMenu\nroute: /docs/navigation/side-menu\nnavLabel: SideMenu\nsection: Navigation\ngroup: Navigation\norder: 49\ndescription: A navigation menu whose items open more items, as deep as needed. Submenus slide in with a back button (drill) or open in place, indented (tree). Links, actions, lazy submenus, groups, badges and the current page.\ncomponent: SideMenuDocumentation\ngenerate: true\ntags: [sidemenu, menu, sidebar, navigation, drilldown, submenu, nested]\n---\n\n# SideMenu\n\n## Overview\n`SideMenu` is the menu of an app's sidebar or drawer. Its items go to a page, run an action, or open a submenu, and a submenu's items can open more submenus, as deep as the app needs.\n\nIt shows the levels in one of two ways, with the same items:\n- **`mode: 'drill'`** (default): a submenu **replaces** the panel and slides in, with a back button named after the level. Every level gets the whole width, so deep menus fit on a phone. This is the menu of a store app or of iOS Settings.\n- **`mode: 'tree'`**: a submenu opens **under** its item, indented, and several can be open at once. People see where they are in the whole menu, which suits a desktop sidebar.\n- **`mode: 'auto'`**: a tree when the menu is at least `breakpoint` pixels wide (480 by default), and a drill menu when it is narrower. The menu's own width is used, not the window's, so the same menu works in a wide sidebar and in a phone drawer.\n\nThe mode can change at any time, and the menu stays where it was: an open drill level becomes open branches, and the other way round.\n\n### When to use it\n- **An app's main navigation** with sections inside sections: an admin panel, a store's categories, a settings area.\n- **A mobile menu or drawer** where a deep menu has to fit a narrow screen (drill).\n- **A menu that mixes pages and actions**: \"Profile\" goes to a page, \"Log out\" runs an action.\n\n### When not to use it\n- **A few destinations at the top of a page**: use [Navbar](/docs/navigation/navbar), or [Tabs](/docs/navigation/tabs) for views of one page.\n- **A menu of actions opened from a button** (\"⋯\", \"Export\"): use [DropDown](/docs/navigation/dropdown). It floats over the page and closes after a choice.\n- **Data shaped as a tree**: files, categories to check, an org chart. Use [TreeView](/docs/navigation/treeview), which adds search, checkboxes, drag and drop and virtual scrolling.\n- **The path to the current page** at the top of the content: use [Breadcrumbs](/docs/navigation/breadcrumbs).\n\n## Items\nEach entry in `items` is an object. What it does depends on what it has:\n\n- `path`: goes to that route with `slice.router`. It is a real link, so Ctrl/⌘-click or a middle click opens it in a new tab.\n- `href` (and `target`): a link outside the app.\n- `onClick({ item, menu, event })`: an action, such as \"Log out\" or \"Switch theme\".\n- `items` (or `children`): opens a submenu. It can be an array, or a function that returns one, even an async function. A function runs the first time the submenu opens, with a loading row in the meantime and a \"Try again\" button if it fails. `reload(id)` runs it again.\n- `type: 'group'` with `label` and `items`: a small heading over items **at the same level**, not a submenu.\n- `type: 'separator'`: a line.\n\nAnd, on any item:\n- `label`, `icon` (an [Icon](/docs/content/icon) name, or `{ name, color }`), `description` (a quieter second line) and `badge` (a number, a word, or [Badge](/docs/content/badge) props).\n- `id`: how `open(id)`, `close(id)` and `reload(id)` find it. Without one, the `path` is used.\n- `disabled`, `hidden`, and `danger` (red, for something that cannot be undone).\n\nAn item with both `items` and a `path` opens its submenu, and the page is still reachable:\n- in drill mode, the submenu starts with an \"All Settings\" link;\n- in tree mode, the label is the link and the chevron beside it opens the submenu.\n\n## Core Behavior\n\n### Moving\n- A click on a link calls `onSelect(item, { event, menu })`, marks the item as the current page, and navigates. `onSelect` can return `false` to stop the navigation, for example to close a drawer first or to show the page some other way.\n- The `side-menu-select` event reports every choice too.\n- `onOpenChange(item, open)` reports every submenu that opens or closes.\n- `open(id)`, `close(id)`, `back()` and `reset()` do the same from code. `level` and `openItems` say where the menu is.\n\n### The current page\n- `activePath` marks the item with that `path` (`aria-current=\"page\"`). The menu opens where it is: on its level in drill mode, and with every branch above it open in tree mode.\n- The submenus that hold the current page are marked as well, so a closed section still shows that the page is inside it.\n- With `followRoute` (on by default), `activePath` follows the URL as the router moves, including back and forward.\n\n### Keyboard\n- ↑ and ↓ move between items; Home and End go to the first and the last.\n- → opens a submenu. In tree mode, a second → goes into it.\n- ← goes back a level (drill), or closes the submenu and then goes up to the item that holds it (tree).\n- Enter and Space do what a click does.\n\n### Focus and screen readers\n- When a level slides in, the focus goes to its first item. When it slides out, the focus goes back to the item that opened it, so people never lose their place.\n- Each new level is announced, for example \"Products, 4 items\".\n- Tree branches use `aria-expanded`. The menu is a `<nav>` with a name (`label`, or `title`).\n\n## Looks\n- `title`: the name of the first level, shown above it in drill mode. Deeper levels show the back button instead.\n- `variant`: how the current page is marked:\n  - `'soft'` (default): a tint and the accent colour;\n  - `'filled'`: the accent colour as the background;\n  - `'ghost'`: a bar at the start and the accent colour, for busy sidebars.\n- `size`: `'sm'`, `'md'` (default) or `'lg'`. Use `'lg'` for touch-first drawers.\n- `multiple: false` (tree) keeps one submenu open per level.\n- The CSS variables `--slice-side-menu-accent`, `--slice-side-menu-row-height`, `--slice-side-menu-indent` and `--slice-side-menu-radius` adjust it further.\n\n## Language\n`texts` replaces every word:\n- `label`;\n- `back` (`{label}`) and `overview` (`{label}`);\n- `level` (`{label}`, `{count}`);\n- `loading`, `error`, `retry`, `empty`;\n- `expand` (`{label}`).\n\n## Live Preview\n:::component name=\"SideMenu\"\n{\n  \"title\": \"Workspace\",\n  \"followRoute\": false,\n  \"items\": [\n    { \"label\": \"Inbox\", \"path\": \"/preview/inbox\", \"icon\": \"inbox\", \"badge\": 4 },\n    { \"label\": \"Projects\", \"icon\": \"folder\", \"items\": [\n      { \"label\": \"Website\", \"path\": \"/preview/website\" },\n      { \"label\": \"Mobile app\", \"path\": \"/preview/app\" }\n    ] },\n    { \"label\": \"Settings\", \"icon\": \"cog\", \"path\": \"/preview/settings\", \"items\": [\n      { \"label\": \"Profile\", \"path\": \"/preview/profile\" },\n      { \"label\": \"Billing\", \"path\": \"/preview/billing\" }\n    ] }\n  ]\n}\n:::\n\n## Examples\n:::script label=\"Admin panel\" expected=\"an app with a tree SideMenu on the left (Dashboard, Orders with a badge, Catalog with nested Products and Categories, Customers, Settings) and a content area; choosing an item shows its page title in the content and marks it as current; Log out at the bottom is red and asks first\"\nconst page = document.createElement('main');\npage.style.cssText = 'flex:1;min-width:0;padding:20px;border-radius:12px;background:color-mix(in srgb,var(--primary-color) 5%,transparent)';\n\nconst show = (item) => {\n  page.innerHTML = `<div style=\"font-size:.8rem;opacity:.65\">Admin</div>\n    <h3 style=\"margin:4px 0 8px\">${item.label}</h3>\n    <p style=\"margin:0;opacity:.8\">${item.description || 'The ' + item.label.toLowerCase() + ' page would render here.'}</p>`;\n};\n\nconst menu = await slice.build('SideMenu', {\n  mode: 'tree',\n  title: 'Acme admin',\n  followRoute: false,\n  activePath: '/admin/dashboard',\n  items: [\n    { label: 'Dashboard', path: '/admin/dashboard', icon: 'chart-pie' },\n    { label: 'Orders', path: '/admin/orders', icon: 'receipt', badge: { value: 7, tone: 'accent' } },\n    {\n      label: 'Catalog', icon: 'store', id: 'catalog',\n      items: [\n        { label: 'Products', path: '/admin/products', description: '1,204 items' },\n        { label: 'Categories', id: 'categories', items: [\n          { label: 'Electronics', path: '/admin/categories/electronics' },\n          { label: 'Home', path: '/admin/categories/home' },\n          { label: 'Toys', path: '/admin/categories/toys' }\n        ] },\n        { label: 'Discounts', path: '/admin/discounts', icon: 'sale-percent' }\n      ]\n    },\n    { label: 'Customers', path: '/admin/customers', icon: 'users' },\n    { label: 'Settings', path: '/admin/settings', icon: 'cog', items: [\n      { label: 'Store details', path: '/admin/settings/store' },\n      { label: 'Payments', path: '/admin/settings/payments' },\n      { label: 'Team', path: '/admin/settings/team', disabled: true, description: 'Owners only' }\n    ] },\n    { type: 'separator' },\n    {\n      label: 'Log out', icon: 'arrow-right-to-bracket', danger: true,\n      onClick: async () => {\n        const ask = await slice.build('Modal', {\n          title: 'Log out?', size: 'sm', destroyOnClose: true,\n          content: 'You will need to sign in again to manage the store.',\n          actions: [{ value: 'Stay', variant: 'ghost' }, { value: 'Log out', variant: 'danger', onClick: () => show({ label: 'Signed out', description: 'See you soon.' }) }]\n        });\n        document.body.appendChild(ask);\n        await ask.show();\n      }\n    }\n  ],\n  // In a real app the router shows the page. Here the example stops the\n  // navigation, draws the page itself and marks it as current.\n  onSelect: (item) => {\n    if (!item.path) return;\n    show(item);\n    menu.activePath = item.path;\n    return false;\n  }\n});\nshow({ label: 'Dashboard', description: 'Sales, orders and visitors for today.' });\n\nconst aside = document.createElement('aside');\naside.style.cssText = 'width:240px;flex:none';\naside.appendChild(menu);\n\nconst app = document.createElement('div');\napp.style.cssText = 'display:flex;gap:16px;width:100%;min-width:0;flex-wrap:wrap';\napp.append(aside, page);\nreturn app;\n:::\n\n:::script label=\"Store categories on a phone (drill, loaded on demand)\" expected=\"a phone-sized panel with a Shop menu; Departments slides in its departments with an 'All departments' link; each department loads its categories after a short wait (with a loading row); the back button names the level; Deals has a badge\"\n// A pretend API: categories arrive after a short wait.\nconst api = {\n  departments: async () => {\n    await new Promise((r) => setTimeout(r, 500));\n    return [\n      { label: 'Electronics', id: 'electronics', icon: 'desktop-pc', items: () => api.categories('Electronics') },\n      { label: 'Home & kitchen', id: 'home', icon: 'home', items: () => api.categories('Home & kitchen') },\n      { label: 'Sports', id: 'sports', icon: 'heart', items: () => api.categories('Sports') }\n    ];\n  },\n  categories: async (name) => {\n    await new Promise((r) => setTimeout(r, 400));\n    const slug = name.toLowerCase().replace(/[^a-z]+/g, '-');\n    return ['Best sellers', 'New arrivals', 'Under $25'].map((label) => ({ label, path: `/shop/${slug}/${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }));\n  }\n};\n\nconst status = document.createElement('p');\nstatus.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7';\nstatus.textContent = 'Pick a category.';\n\nconst menu = await slice.build('SideMenu', {\n  title: 'Shop',\n  size: 'lg',\n  followRoute: false,\n  items: [\n    { label: 'Departments', path: '/shop/departments', icon: 'grid', id: 'departments', items: api.departments },\n    { label: 'Deals', path: '/shop/deals', icon: 'sale-percent', badge: { label: 'Today', tone: 'danger' } },\n    { label: 'Orders', path: '/shop/orders', icon: 'truck', description: 'Track and return' },\n    { type: 'separator' },\n    { label: 'Help', href: 'https://example.com/help', target: '_blank', icon: 'life-saver' }\n  ],\n  onSelect: (item) => {\n    status.textContent = `Would open ${item.path || item.href}`;\n    if (item.path) menu.activePath = item.path;\n    return false;\n  }\n});\n\nconst phone = document.createElement('div');\nphone.style.cssText = 'width:100%;max-width:320px;min-width:0;padding:12px;border:1px solid var(--slice-border-raised, #ddd);border-radius:24px;box-shadow:var(--slice-shadow-md)';\nphone.append(menu, status);\nreturn phone;\n:::\n\n:::script label=\"Account menu with groups and actions\" expected=\"a drill menu with an Account group (Profile, Notifications with a badge, Billing disabled) and a Preferences group with a theme action and a Language submenu; choosing a language updates a status line; Log out is red\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nlet dark = false;\nconst languages = ['English', 'Español', 'Português'];\n\nconst menu = await slice.build('SideMenu', {\n  label: 'Account',\n  variant: 'ghost',\n  followRoute: false,\n  items: [\n    { type: 'group', label: 'Account', items: [\n      { label: 'Profile', path: '/account/profile', icon: 'user', description: 'Name, photo and email' },\n      { label: 'Notifications', path: '/account/notifications', icon: 'bell', badge: 3 },\n      { label: 'Billing', path: '/account/billing', icon: 'credit-card', disabled: true, description: 'Ask an owner' }\n    ] },\n    { type: 'group', label: 'Preferences', items: [\n      { label: 'Switch theme', icon: 'moon', onClick: () => { dark = !dark; toasts.show(`Theme: ${dark ? 'dark' : 'light'}`); } },\n      { label: 'Language', id: 'language', icon: 'globe', items: languages.map((name) => ({\n        label: name,\n        onClick: ({ menu: m }) => { toasts.show(`Language: ${name}`, { type: 'success' }); m.back(); }\n      })) }\n    ] },\n    { type: 'separator' },\n    { label: 'Log out', icon: 'arrow-right-to-bracket', danger: true, onClick: () => toasts.show('Logged out') }\n  ],\n  onSelect: (item) => { if (item.path) { toasts.show(`Open ${item.label}`); return false; } }\n});\n\nconst card = document.createElement('div');\ncard.style.cssText = 'width:100%;max-width:300px;min-width:0';\ncard.appendChild(menu);\nreturn card;\n:::\n\n:::script label=\"Tree on wide, drill on narrow\" expected=\"a resizable box (drag its corner) holding a menu with mode 'auto'; wider than 420px it is a tree, narrower it becomes a drill menu, and the open section stays open\"\nconst menu = await slice.build('SideMenu', {\n  title: 'Docs',\n  // A tree from 420px wide, a drill menu below.\n  mode: 'auto',\n  breakpoint: 420,\n  followRoute: false,\n  activePath: '/guide/components/props',\n  items: [\n    { label: 'Getting started', path: '/guide/start', icon: 'rocket' },\n    { label: 'Guide', icon: 'book-open', id: 'guide', items: [\n      { label: 'Components', id: 'components', items: [\n        { label: 'Templates', path: '/guide/components/templates' },\n        { label: 'Props', path: '/guide/components/props' },\n        { label: 'Lifecycle', path: '/guide/components/lifecycle' }\n      ] },\n      { label: 'Routing', path: '/guide/routing' },\n      { label: 'Services', path: '/guide/services' }\n    ] },\n    { label: 'API reference', path: '/api', icon: 'code' }\n  ],\n  onSelect: (item) => { if (item.path) menu.activePath = item.path; return false; }\n});\n\nconst box = document.createElement('div');\nbox.style.cssText = 'resize:horizontal;overflow:auto;width:520px;max-width:100%;min-width:240px;padding:12px;border:1px dashed var(--slice-border-raised, #ccc);border-radius:12px';\nbox.appendChild(menu);\n\nconst note = document.createElement('p');\nnote.style.cssText = 'margin:8px 0 0;font-size:.8rem;opacity:.7';\nnote.textContent = 'Drag the corner of the box to make it narrower.';\n\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'width:100%;min-width:0';\nwrap.append(box, note);\nreturn wrap;\n:::\n\n## Best Practices\n:::tip\nKeep each level short (about 7 items) and give it a clear name: in drill mode the name is all people see of where they are. Use `type: 'group'` headings to split a long level instead of adding another one.\n:::\n\n:::tip\nGive a submenu a `path` when its section has a page of its own. People can then reach the page in one click (\"All Settings\") and still browse inside the section.\n:::\n\n:::tip\nLoad big submenus on demand with a function in `items`. The first level shows at once, and each department or project loads only when someone opens it.\n:::\n\n## Pitfalls\n:::warning\nDo not put the same item in two places. The current page is marked once, and people stop trusting a menu where the same page lives in two sections.\n:::\n\n:::warning\nIn drill mode, an action that stays in the menu (such as choosing a language) should go back a level, or show a result, so people see that it worked. `onClick` receives the menu, so it can call `menu.back()`.\n:::\n\n:::warning\nInside a drawer, close the drawer in `onSelect` after a link is chosen, or people are left looking at the menu over the new page.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"title\": \"Workspace\",\n  \"followRoute\": false,\n  \"items\": [\n    { \"label\": \"Inbox\", \"path\": \"/preview/inbox\", \"icon\": \"inbox\", \"badge\": 4 },\n    { \"label\": \"Projects\", \"icon\": \"folder\", \"items\": [\n      { \"label\": \"Website\", \"path\": \"/preview/website\" },\n      { \"label\": \"Mobile app\", \"path\": \"/preview/app\" }\n    ] },\n    { \"label\": \"Settings\", \"icon\": \"cog\", \"path\": \"/preview/settings\", \"items\": [\n      { \"label\": \"Profile\", \"path\": \"/preview/profile\" },\n      { \"label\": \"Billing\", \"path\": \"/preview/billing\" }\n    ] }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"title\": \"Workspace\",\n  \"followRoute\": false,\n  \"items\": [\n    { \"label\": \"Inbox\", \"path\": \"/preview/inbox\", \"icon\": \"inbox\", \"badge\": 4 },\n    { \"label\": \"Projects\", \"icon\": \"folder\", \"items\": [\n      { \"label\": \"Website\", \"path\": \"/preview/website\" },\n      { \"label\": \"Mobile app\", \"path\": \"/preview/app\" }\n    ] },\n    { \"label\": \"Settings\", \"icon\": \"cog\", \"path\": \"/preview/settings\", \"items\": [\n      { \"label\": \"Profile\", \"path\": \"/preview/profile\" },\n      { \"label\": \"Billing\", \"path\": \"/preview/billing\" }\n    ] }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('SideMenu', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Navbar","path":"/docs/navigation/navbar"},{"text":"Tabs","path":"/docs/navigation/tabs"},{"text":"DropDown","path":"/docs/navigation/dropdown"},{"text":"TreeView","path":"/docs/navigation/treeview"},{"text":"Breadcrumbs","path":"/docs/navigation/breadcrumbs"},{"text":"Icon","path":"/docs/content/icon"},{"text":"Badge","path":"/docs/content/badge"}];
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

customElements.define('slice-sidemenudocumentation', SideMenuDocumentation);
