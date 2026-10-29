export default class TreeViewDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"File explorer","expected":"folders with icons, a badge, a description, a disabled file and a ⋯ menu on hover","kind":"script","content":"const result = document.createElement('p');\nresult.textContent = 'Right-click a row, or hover it and use ⋯.';\n\nconst tree = await slice.build('TreeView', {\n  ariaLabel: 'Files',\n  indicator: 'pill',\n  items: [\n    {\n      label: 'src', icon: 'folder', expanded: true, items: [\n        {\n          label: 'components', icon: 'folder', expanded: true, items: [\n            { label: 'Button.js', icon: 'file-code', badge: 'M' },\n            { label: 'Table.js', icon: 'file-code', description: 'Edited 2 minutes ago' },\n            { label: 'Legacy.js', icon: 'file-code', disabled: true }\n          ]\n        },\n        { label: 'utils', icon: 'folder', items: [{ label: 'format.js', icon: 'file-code' }] },\n        { label: 'index.js', icon: 'file' }\n      ]\n    },\n    { label: 'package.json', icon: 'file' }\n  ],\n  nodeActions: (item) => [\n    { label: 'Rename', icon: 'pen', onClick: () => { result.textContent = `Rename ${item.label}`; } },\n    { label: 'Duplicate', icon: 'file-copy' },\n    'separator',\n    { label: 'Delete', icon: 'trash-bin', danger: true, onClick: () => { result.textContent = `Delete ${item.label}`; } }\n  ],\n  onClick: (row) => { result.textContent = `Opened ${row.value}`; }\n});\n\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(tree, result);\nreturn box;"},{"label":"Checkboxes and search","expected":"type to filter; checking a folder checks its files and a partly checked folder shows a dash","kind":"script","content":"const result = document.createElement('p');\nconst tree = await slice.build('TreeView', {\n  selection: 'multiple',\n  searchable: true,\n  searchPlaceholder: 'Filter permissions…',\n  expanded: 'all',\n  selected: ['users.read'],\n  items: [\n    {\n      label: 'Users', id: 'users', items: [\n        { label: 'Read users', id: 'users.read' },\n        { label: 'Create users', id: 'users.create' },\n        { label: 'Delete users', id: 'users.delete' }\n      ]\n    },\n    {\n      label: 'Billing', id: 'billing', items: [\n        { label: 'See invoices', id: 'billing.read' },\n        { label: 'Change plan', id: 'billing.plan' }\n      ]\n    }\n  ],\n  onSelectionChange: (keys) => { result.textContent = `Checked: ${keys.join(', ') || 'nothing'}`; }\n});\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(tree, result);\nreturn box;"},{"label":"Branches loaded on demand","expected":"each region loads its countries the first time it opens","kind":"script","content":"const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\nconst countries = {\n  Americas: ['Argentina', 'Brasil', 'Colombia', 'México', 'Venezuela'],\n  Europe: ['España', 'France', 'Italia'],\n  Asia: ['Japan', 'Korea', 'Vietnam']\n};\nconst tree = await slice.build('TreeView', {\n  items: Object.keys(countries).map((region) => ({\n    label: region,\n    icon: 'globe',\n    items: async () => {\n      await wait(700);\n      return countries[region].map((name) => ({ label: name }));\n    }\n  }))\n});\nreturn tree;"},{"label":"Drag and drop","expected":"drag rows to reorder them or drop them inside another folder","kind":"script","content":"const log = document.createElement('p');\nlog.textContent = 'Drag a row onto another one.';\nconst tree = await slice.build('TreeView', {\n  draggable: true,\n  expanded: 'all',\n  items: [\n    { label: 'Inbox', id: 'inbox', icon: 'inbox', items: [{ label: 'Invoice March', id: 'm1' }, { label: 'Team lunch', id: 'm2' }] },\n    { label: 'Archive', id: 'archive', icon: 'archive', items: [] },\n    { label: 'Notes', id: 'notes', icon: 'file' }\n  ],\n  onMove: ({ item, target, position }) => {\n    log.textContent = `${item.label} → ${position} ${target.label}`;\n  }\n});\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(tree, log);\nreturn box;"},{"label":"20,000 nodes, virtual","expected":"200 open folders of 99 files each scroll smoothly inside a fixed height","kind":"script","content":"const items = Array.from({ length: 200 }, (_, i) => ({\n  label: `Folder ${i + 1}`,\n  icon: 'folder',\n  expanded: true,\n  items: Array.from({ length: 99 }, (_, j) => ({ label: `File ${i + 1}.${j + 1}` }))\n}));\nconst tree = await slice.build('TreeView', { items, virtual: true, maxHeight: '320px', size: 'sm' });\ntree.style.width = '100%';\nreturn tree;"},{"label":"Navigation sidebar","expected":"the current page is marked with a bar; clicking a page marks it","kind":"script","content":"const tree = await slice.build('TreeView', {\n  indicator: 'bar',\n  activePath: '/docs/navigation/treeview',\n  followRoute: false,\n  items: [\n    { value: 'Data', items: [{ value: 'Table', path: '/docs/data/table' }] },\n    {\n      value: 'Navigation', items: [\n        { value: 'Navbar', path: '/docs/navigation/navbar' },\n        { value: 'DropDown', path: '/docs/navigation/dropdown' },\n        { value: 'TreeView', path: '/docs/navigation/treeview' }\n      ]\n    }\n  ],\n  onClick: (row) => { tree.setActiveTreeItem(row); }\n});\nreturn tree;"}];
  }

  async init() {
    this.markdownPath = "treeview.md";
    this.markdownContent = "---\ntitle: TreeView\nroute: /docs/navigation/treeview\nnavLabel: TreeView\nsection: Navigation\ngroup: Navigation\norder: 50\ndescription: Hierarchical list with full keyboard support, search, checkboxes, lazy branches, virtual scrolling, drag and drop and row menus.\ncomponent: TreeViewDocumentation\ngenerate: true\ntags: [treeview, navigation, tree, files, checkbox, drag]\n---\n\n# TreeView\n\n## Overview\n`TreeView` shows a hierarchy: a navigation sidebar, a file tree, a category picker or nested settings. Branches open and close, the current page is marked, and the whole tree works from the keyboard. It can also search, check items with tri-state checkboxes, load branches on demand, scroll tens of thousands of nodes smoothly, reorder by drag and drop, and give every row its own ⋯ menu.\n\n## Items\nEach entry in `items` is an object:\n\n- `label` (or `value`, or `text`): the text of the row.\n- `path`: makes the row a destination. It is marked when it is the current page.\n- `items` (or `children`): the nested items. They can also be a function, even an async one, and the branch then loads the first time it opens, with a loading row meanwhile. `reload(key)` loads it again.\n- `id`: a stable identity. Without one, the key is the `path`, or else the parent's key plus the label.\n- `icon` (an `Icon` name), `badge`, `description` (a quieter second line), `disabled`, `hidden`, `expanded` (start open) and `actions` (a ⋯ menu, as `DropDown` items).\n\nThe tree never changes your objects, except when you drag a row: then the item really moves inside your arrays, so your data and the tree stay in step.\n\n## Core Behavior\n- A branch opens and closes from its chevron. A branch without a `path` also toggles when you click its label; a row with a `path` is a destination and becomes the current page.\n- `onClick(row, event)` hears every activation (click or Enter). `row.item` is your object, and `row.path` and `row.value` are its path and label.\n- `navigate: true` routes a row with a `path` through `slice.router` by itself.\n- `activePath` marks the current page and opens its branch. With `followRoute` (on by default) it keeps up with router navigations and with back / forward.\n- `expanded: 'all'` starts with every branch open. `stateKey` remembers which branches were open between visits, in `localStorage`; without a `stateKey` nothing is stored.\n- `onToggle(item, open)` fires when a branch opens or closes.\n- From code: `expand(key)`, `collapse(key)`, `toggle(key)`, `expandAll()`, `collapseAll()`, `focusNode(key)`, `keyOf(item)`, `getSelectedItems()`, `clearSelection()` and `activateByPath(path)`. Wherever a key is expected, you can also pass a path or the item itself.\n\n## Keyboard\nThe tree is a single tab stop; inside it:\n- **↑ ↓** move between rows, and **Home / End** jump to the first or last.\n- **→** opens a branch, or steps into it if it is already open. **←** closes it, or steps to the parent.\n- **\\*** opens every sibling branch.\n- Typing jumps to the next row starting with those letters.\n- **Enter** activates the row. **Space** checks it, or selects it.\n- **Shift+F10** or the context-menu key opens the row's ⋯ menu.\n\n## Selection, search and the rest\n- `selection: 'single'` highlights one row (`aria-selected`) and reports it to `onSelect(item)`.\n- `selection: 'multiple'` adds tri-state checkboxes. Checking a parent checks everything under it; a parent with only some checked children shows a dash. `selected` (an array of keys) sets the checks and `onSelectionChange(keys, items)` reports them.\n- `searchable` adds a search box (`filter` sets the query from code). Matching rows show with their ancestors opened, and the match is highlighted. Accents and capitals do not matter: \"cam\" finds \"Cámara\".\n- `virtual: true` draws only the rows in view, so 20,000 nodes scroll like 20. Give it a `maxHeight`; rows share one height, set by `size` or `rowHeight`.\n- `draggable: true` lets you drag a row onto the top edge of another (before it), its bottom edge (after it) or its middle (inside it). Hovering a closed branch opens it. Return `false` from `onMove({ item, target, position })` to refuse a drop. A branch can never be dropped into itself.\n- `nodeActions(item)` returns the ⋯ menu for every row; it opens on hover, with right click or with Shift+F10.\n\n## Looks\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- `indicator` marks the current page: `'tint'` (default, a fading wash), `'pill'` or `'bar'` (an accent line on the left).\n- `guides: false` removes the vertical lines down each open branch.\n\n## Live Preview\n:::component name=\"TreeView\"\n{\n  \"expanded\": \"all\",\n  \"items\": [\n    { \"value\": \"Getting Started\", \"items\": [\n      { \"value\": \"Installation\", \"path\": \"/docs/install\" },\n      { \"value\": \"Project Structure\", \"path\": \"/docs/structure\" }\n    ] },\n    { \"value\": \"Components\", \"items\": [\n      { \"value\": \"Button\", \"path\": \"/docs/input/button\" },\n      { \"value\": \"Input\", \"path\": \"/docs/input/input\" }\n    ] }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"File explorer\" expected=\"folders with icons, a badge, a description, a disabled file and a ⋯ menu on hover\"\nconst result = document.createElement('p');\nresult.textContent = 'Right-click a row, or hover it and use ⋯.';\n\nconst tree = await slice.build('TreeView', {\n  ariaLabel: 'Files',\n  indicator: 'pill',\n  items: [\n    {\n      label: 'src', icon: 'folder', expanded: true, items: [\n        {\n          label: 'components', icon: 'folder', expanded: true, items: [\n            { label: 'Button.js', icon: 'file-code', badge: 'M' },\n            { label: 'Table.js', icon: 'file-code', description: 'Edited 2 minutes ago' },\n            { label: 'Legacy.js', icon: 'file-code', disabled: true }\n          ]\n        },\n        { label: 'utils', icon: 'folder', items: [{ label: 'format.js', icon: 'file-code' }] },\n        { label: 'index.js', icon: 'file' }\n      ]\n    },\n    { label: 'package.json', icon: 'file' }\n  ],\n  nodeActions: (item) => [\n    { label: 'Rename', icon: 'pen', onClick: () => { result.textContent = `Rename ${item.label}`; } },\n    { label: 'Duplicate', icon: 'file-copy' },\n    'separator',\n    { label: 'Delete', icon: 'trash-bin', danger: true, onClick: () => { result.textContent = `Delete ${item.label}`; } }\n  ],\n  onClick: (row) => { result.textContent = `Opened ${row.value}`; }\n});\n\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(tree, result);\nreturn box;\n:::\n\n:::script label=\"Checkboxes and search\" expected=\"type to filter; checking a folder checks its files and a partly checked folder shows a dash\"\nconst result = document.createElement('p');\nconst tree = await slice.build('TreeView', {\n  selection: 'multiple',\n  searchable: true,\n  searchPlaceholder: 'Filter permissions…',\n  expanded: 'all',\n  selected: ['users.read'],\n  items: [\n    {\n      label: 'Users', id: 'users', items: [\n        { label: 'Read users', id: 'users.read' },\n        { label: 'Create users', id: 'users.create' },\n        { label: 'Delete users', id: 'users.delete' }\n      ]\n    },\n    {\n      label: 'Billing', id: 'billing', items: [\n        { label: 'See invoices', id: 'billing.read' },\n        { label: 'Change plan', id: 'billing.plan' }\n      ]\n    }\n  ],\n  onSelectionChange: (keys) => { result.textContent = `Checked: ${keys.join(', ') || 'nothing'}`; }\n});\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(tree, result);\nreturn box;\n:::\n\n:::script label=\"Branches loaded on demand\" expected=\"each region loads its countries the first time it opens\"\nconst wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\nconst countries = {\n  Americas: ['Argentina', 'Brasil', 'Colombia', 'México', 'Venezuela'],\n  Europe: ['España', 'France', 'Italia'],\n  Asia: ['Japan', 'Korea', 'Vietnam']\n};\nconst tree = await slice.build('TreeView', {\n  items: Object.keys(countries).map((region) => ({\n    label: region,\n    icon: 'globe',\n    items: async () => {\n      await wait(700);\n      return countries[region].map((name) => ({ label: name }));\n    }\n  }))\n});\nreturn tree;\n:::\n\n:::script label=\"Drag and drop\" expected=\"drag rows to reorder them or drop them inside another folder\"\nconst log = document.createElement('p');\nlog.textContent = 'Drag a row onto another one.';\nconst tree = await slice.build('TreeView', {\n  draggable: true,\n  expanded: 'all',\n  items: [\n    { label: 'Inbox', id: 'inbox', icon: 'inbox', items: [{ label: 'Invoice March', id: 'm1' }, { label: 'Team lunch', id: 'm2' }] },\n    { label: 'Archive', id: 'archive', icon: 'archive', items: [] },\n    { label: 'Notes', id: 'notes', icon: 'file' }\n  ],\n  onMove: ({ item, target, position }) => {\n    log.textContent = `${item.label} → ${position} ${target.label}`;\n  }\n});\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(tree, log);\nreturn box;\n:::\n\n:::script label=\"20,000 nodes, virtual\" expected=\"200 open folders of 99 files each scroll smoothly inside a fixed height\"\nconst items = Array.from({ length: 200 }, (_, i) => ({\n  label: `Folder ${i + 1}`,\n  icon: 'folder',\n  expanded: true,\n  items: Array.from({ length: 99 }, (_, j) => ({ label: `File ${i + 1}.${j + 1}` }))\n}));\nconst tree = await slice.build('TreeView', { items, virtual: true, maxHeight: '320px', size: 'sm' });\ntree.style.width = '100%';\nreturn tree;\n:::\n\n:::script label=\"Navigation sidebar\" expected=\"the current page is marked with a bar; clicking a page marks it\"\nconst tree = await slice.build('TreeView', {\n  indicator: 'bar',\n  activePath: '/docs/navigation/treeview',\n  followRoute: false,\n  items: [\n    { value: 'Data', items: [{ value: 'Table', path: '/docs/data/table' }] },\n    {\n      value: 'Navigation', items: [\n        { value: 'Navbar', path: '/docs/navigation/navbar' },\n        { value: 'DropDown', path: '/docs/navigation/dropdown' },\n        { value: 'TreeView', path: '/docs/navigation/treeview' }\n      ]\n    }\n  ],\n  onClick: (row) => { tree.setActiveTreeItem(row); }\n});\nreturn tree;\n:::\n\n## Best Practices\n:::tip\nGive items an `id` when they can move or be renamed. The key is what keeps a row's open state, its check and its focus attached to it.\n:::\n\n:::tip\nFor a navigation sidebar, pass `activePath` and a `stateKey`: the current page is always visible, and the sections the reader opened stay open between visits.\n:::\n\n## Pitfalls\n:::warning\n`draggable` moves items inside your own arrays (that is how your data stays in step). If your arrays are frozen or derived on every render, refuse the drop in `onMove` and update your state yourself.\n:::\n\n:::warning\n`virtual` needs one row height: long labels are cut with an ellipsis, and a `description` line needs a bigger `rowHeight`.\n:::\n\n## Language\n\nThe built-in texts are `slice.treeView.*` keys with English and Spanish defaults, registered by\n`shared/text/texts.js` in the translator's lowest layer: an app dictionary always wins, and the\ncomponent keeps its English text when the translator is off.\nThe text prop `texts` still wins over the dictionary.\nKeys: `searchPlaceholder`, `emptyMessage`, `search`, `loading`, `actionsFor`.\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"expanded\": \"all\",\n  \"items\": [\n    { \"value\": \"Getting Started\", \"items\": [\n      { \"value\": \"Installation\", \"path\": \"/docs/install\" },\n      { \"value\": \"Project Structure\", \"path\": \"/docs/structure\" }\n    ] },\n    { \"value\": \"Components\", \"items\": [\n      { \"value\": \"Button\", \"path\": \"/docs/input/button\" },\n      { \"value\": \"Input\", \"path\": \"/docs/input/input\" }\n    ] }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"expanded\": \"all\",\n  \"items\": [\n    { \"value\": \"Getting Started\", \"items\": [\n      { \"value\": \"Installation\", \"path\": \"/docs/install\" },\n      { \"value\": \"Project Structure\", \"path\": \"/docs/structure\" }\n    ] },\n    { \"value\": \"Components\", \"items\": [\n      { \"value\": \"Button\", \"path\": \"/docs/input/button\" },\n      { \"value\": \"Input\", \"path\": \"/docs/input/input\" }\n    ] }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('TreeView', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"activePath\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"followRoute\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"expanded\",\"type\":\"string\",\"required\":false,\"default\":\"none\",\"allowedValues\":[\"none\",\"all\"]},{\"path\":\"stateKey\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"selection\",\"type\":\"string\",\"required\":false,\"default\":\"none\",\"allowedValues\":[\"none\",\"single\",\"multiple\"]},{\"path\":\"selected\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"filter\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"searchPlaceholder\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"emptyMessage\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"draggable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"nodeActions\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"navigate\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"virtual\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"rowHeight\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"maxHeight\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"indicator\",\"type\":\"string\",\"required\":false,\"default\":\"tint\",\"allowedValues\":[\"tint\",\"pill\",\"bar\"]},{\"path\":\"guides\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onToggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSelectionChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onMove\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"activePath\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"followRoute\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"expanded\",\"type\":\"string\",\"required\":false,\"default\":\"none\",\"allowedValues\":[\"none\",\"all\"]},{\"path\":\"stateKey\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"selection\",\"type\":\"string\",\"required\":false,\"default\":\"none\",\"allowedValues\":[\"none\",\"single\",\"multiple\"]},{\"path\":\"selected\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"filter\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"searchPlaceholder\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"emptyMessage\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"draggable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"nodeActions\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"navigate\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"virtual\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"rowHeight\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"maxHeight\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"indicator\",\"type\":\"string\",\"required\":false,\"default\":\"tint\",\"allowedValues\":[\"tint\",\"pill\",\"bar\"]},{\"path\":\"guides\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onToggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSelectionChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onMove\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
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

customElements.define('slice-treeviewdocumentation', TreeViewDocumentation);
