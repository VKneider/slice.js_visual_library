export default class PaginationDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Search results from a server","expected":"a search box over a list of results; the pager shows the range and the page size; changing the page or the size waits for the 'server' while the list is dimmed","kind":"script","content":"// A pretend API: 342 articles, filtered by a query, one page at a time.\nconst all = Array.from({ length: 342 }, (_, i) => ({\n  id: i + 1,\n  title: `${['Designing', 'Testing', 'Shipping', 'Scaling', 'Debugging'][i % 5]} ${['components', 'forms', 'tables', 'themes', 'routes', 'services'][i % 6]} #${i + 1}`,\n  minutes: 3 + (i % 9)\n}));\nconst api = async ({ q, page, size }) => {\n  await new Promise((r) => setTimeout(r, 350));\n  const found = all.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));\n  return { total: found.length, items: found.slice((page - 1) * size, page * size) };\n};\n\nlet query = '';\nlet size = 10;\n\nconst list = document.createElement('ol');\nlist.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;gap:6px;transition:opacity .15s';\n\nconst pager = await slice.build('Pagination', {\n  pageSize: size,\n  totalItems: 0,\n  showInfo: true,\n  pageSizes: [10, 20, 50],\n  align: 'between',\n  // The page changes only once the server has answered.\n  controlled: true,\n  onPageChange: (page) => load(page),\n  onPageSizeChange: (next) => { size = next; }\n});\n\nasync function load(page = 1) {\n  list.style.opacity = '.45';\n  const { total, items } = await api({ q: query, page, size });\n  list.replaceChildren(...items.map((a) => {\n    const li = document.createElement('li');\n    li.style.cssText = 'display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--slice-border-raised);border-radius:10px';\n    li.innerHTML = '<span></span><span style=\"opacity:.6;white-space:nowrap\"></span>';\n    li.children[0].textContent = a.title;\n    li.children[1].textContent = `${a.minutes} min read`;\n    return li;\n  }));\n  pager.totalItems = total;\n  pager.currentPage = page;\n  list.style.opacity = '1';\n}\n\nconst search = await slice.build('Input', {\n  label: 'Search articles', icon: 'search', clearable: true, debounce: 300,\n  onChange: (value) => { query = value; load(1); }\n});\nload(1);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:14px;width:100%';\nbox.append(search, list, pager);\nreturn box;"},{"label":"Product catalog","expected":"a grid of product Cards with a centred segmented pager with first and last; changing the page scrolls back to the top of the grid","kind":"script","content":"const products = Array.from({ length: 47 }, (_, i) => ({\n  name: `${['Notebook', 'Pen set', 'Sticker pack', 'Washi tape', 'Planner', 'Bookmark'][i % 6]} ${String.fromCharCode(65 + (i % 26))}${i + 1}`,\n  price: (4 + (i * 7) % 30).toFixed(2),\n  icon: ['book-open', 'pen', 'star', 'tag', 'calendar-month', 'bookmark'][i % 6]\n}));\nconst PER_PAGE = 6;\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;scroll-margin-top:90px';\n\nasync function show(page) {\n  // The cards of the page that is leaving are destroyed, not just removed.\n  slice.controller.destroyByContainer(grid);\n  const slice_ = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);\n  const cards = await Promise.all(slice_.map((p) => slice.build('Card', {\n    title: p.name, subtitle: `$${p.price}`, headerIcon: p.icon, size: 'sm', href: '#catalog'\n  })));\n  grid.replaceChildren(...cards);\n}\n\nconst pager = await slice.build('Pagination', {\n  totalItems: products.length,\n  pageSize: PER_PAGE,\n  variant: 'segmented',\n  showFirstLast: true,\n  align: 'center',\n  onPageChange: async (page) => {\n    await show(page);\n    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });\n  }\n});\nawait show(1);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:16px;width:100%';\nbox.append(grid, pager);\nreturn box;"},{"label":"Blog with page links","expected":"an underline pager whose pages are real links (?page=N, with rel prev/next); a click stays in the page and swaps the posts; Ctrl/⌘-click would open the link","kind":"script","content":"const posts = Array.from({ length: 23 }, (_, i) => `Post ${23 - i}: notes from week ${23 - i}`);\nconst PER_PAGE = 5;\nconst list = document.createElement('ul');\nlist.style.cssText = 'margin:0;padding-left:18px;line-height:2';\n\nconst render = (page) => {\n  list.replaceChildren(...posts.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((t) => {\n    const li = document.createElement('li');\n    li.textContent = t;\n    return li;\n  }));\n};\n\nconst pager = await slice.build('Pagination', {\n  totalItems: posts.length,\n  pageSize: PER_PAGE,\n  variant: 'underline',\n  showLabels: true,\n  hrefTemplate: '?page={page}',\n  onPageChange: (page, { event }) => {\n    // A real app lets the router take the link. Here the docs page stays put.\n    event?.preventDefault();\n    render(page);\n  }\n});\nrender(1);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(list, pager);\nreturn box;"},{"label":"Onboarding with dots","expected":"a step Card with dot pagination under it; Next and the dots move between steps; the last step says Get started","kind":"script","content":"const steps = [\n  { icon: 'sliceJs', title: 'Welcome to Slice', text: 'Components you build once and use everywhere.' },\n  { icon: 'cog', title: 'Make it yours', text: 'Pick a theme, or build one in the Theme Creator.' },\n  { icon: 'users', title: 'Invite your team', text: 'Share projects and review changes together.' },\n  { icon: 'rocket', title: 'Ship it', text: 'Build and deploy with one command.' }\n];\nconst toasts = await slice.build('ToastProvider', { singleton: true });\n\nconst card = await slice.build('Card', { variant: 'filled', size: 'lg' });\ncard.style.cssText = 'max-width:420px;width:100%';\nconst button = await slice.build('Button', { value: 'Next', onClick: () => (dots.currentPage < steps.length ? dots.next() : toasts.show('All set!', { type: 'success' })) });\n\nconst show = (page) => {\n  const step = steps[page - 1];\n  card.headerIcon = step.icon;\n  card.title = step.title;\n  card.text = step.text;\n  button.value = page === steps.length ? 'Get started' : 'Next';\n};\n\nconst dots = await slice.build('Pagination', {\n  mode: 'dots', totalPages: steps.length, variant: 'ghost',\n  texts: { page: 'Step {page}' },\n  onPageChange: (page) => show(page)\n});\nshow(1);\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:420px;width:100%';\nrow.append(dots, button);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:14px;justify-items:start;width:100%';\nbox.append(card, row);\nreturn box;"},{"label":"Looks at a glance","expected":"the five variants, round controls with labels, the compact mode, the three sizes, and a narrow container that turns into 'Page 7 of 30'","kind":"script","content":"const box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:18px;width:100%';\nconst row = (label, node) => {\n  const wrap = document.createElement('div');\n  wrap.style.cssText = 'display:grid;gap:6px';\n  const caption = document.createElement('span');\n  caption.style.cssText = 'font-size:.8rem;opacity:.6';\n  caption.textContent = label;\n  wrap.append(caption, node);\n  box.appendChild(wrap);\n};\nfor (const variant of ['outlined', 'soft', 'ghost', 'segmented', 'underline']) {\n  row(`variant: '${variant}'`, await slice.build('Pagination', { variant, currentPage: 5, totalPages: 20, showFirstLast: true }));\n}\nrow(\"shape: 'circle', showLabels\", await slice.build('Pagination', { variant: 'soft', shape: 'circle', showLabels: true, currentPage: 2, totalPages: 8 }));\nrow(\"mode: 'compact'\", await slice.build('Pagination', { mode: 'compact', variant: 'segmented', showLabels: true, currentPage: 3, totalPages: 12 }));\nfor (const size of ['sm', 'lg']) row(`size: '${size}'`, await slice.build('Pagination', { size, currentPage: 2, totalPages: 6 }));\nconst narrow = await slice.build('Pagination', { currentPage: 7, totalPages: 30, showLabels: true });\nnarrow.style.maxWidth = '320px';\nrow('a 320px container', narrow);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "pagination.md";
    this.markdownContent = "---\ntitle: Pagination\nroute: /docs/data/pagination\nnavLabel: Pagination\nsection: Data\ngroup: Tables\norder: 11\ndescription: Moves through pages of a list, a table or search results. Five looks, numbered, compact or dot modes, the range on screen, a page-size picker, a jump box, real links, and a compact form on narrow screens.\ncomponent: PaginationDocumentation\ngenerate: true\ntags: [pagination, pager, pages, navigation, data]\n---\n\n# Pagination\n\n## Overview\n`Pagination` splits a long list into pages and moves between them. It works on its own (search results, a product grid, a feed) and inside a [Table](/docs/data/table), which builds one for you with `pagination: true`.\n\n### When to use it\n- Results people scan page by page and come back to (\"it was on page 3\").\n- Long lists where the total matters: \"41–60 of 342\".\n- Steps of a carousel or an onboarding, with `mode: 'dots'`.\n\n### When not to use it\n- **A feed people only scroll through** reads better with \"Load more\" or infinite scrolling.\n- **Lists that fit on one screen** do not need pages. Show them whole.\n\n## Core Behavior\n\n### Pages\n- `currentPage` and `totalPages` set where it is.\n- Instead of `totalPages`, you can give `totalItems` and `pageSize`, and Pagination works out the pages and the range on screen.\n- Long ranges are shortened with ellipses: `siblingCount` (default 1) pages on each side of the current one, and `boundaryCount` (default 1) at each end.\n- `showFirstLast` adds « and », and `showLabels` writes \"Previous\" and \"Next\" beside the arrows. `showPrevNext: false` hides Previous and Next, for dots under a carousel that has its own arrows.\n\n### Moving\n- A click moves to the page and calls `onPageChange(page, { previous, event })`. The `page-change` event also reports it.\n- `goTo(page)`, `next()` and `previous()` do the same from code, and the page is clamped to the range.\n- `controlled: true` only reports the click, and waits for you to set `currentPage`. Use it when the page lives elsewhere: a router, a store, or a request that has to succeed first. Table uses it this way.\n- When Next or Previous re-renders the pages, the focus stays on the button that was pressed, so the keyboard can keep paging.\n\n### Range, page size and jump\n- `showInfo` shows the range on screen (\"41–60 of 342\"), or \"Page 3 of 18\" without `totalItems`.\n- `pageSizes: [10, 20, 50]` adds a \"Rows per page\" [Select](/docs/input/select).\n  - `onPageSizeChange(size)` reports a new size.\n  - The page changes with the size, so the first item that was on screen stays in view.\n- `showJump` adds a box to type a page number and press **Enter**.\n\n### Modes\n- `'pages'` (default): numbered pages. **In a container narrower than 420px it turns into \"Page 5 of 20\" by itself**, so a phone never gets a wrapped row of numbers.\n- `'compact'`: always \"Page 5 of 20\" between Previous and Next.\n- `'dots'`: one dot per page, for a carousel or an onboarding with a few steps.\n\n### Links\n`hrefTemplate: '?page={page}'` renders real links instead of buttons, with `rel=\"prev\"` and `rel=\"next\"`:\n- each page has an address, so it can be bookmarked or opened in a new tab (Ctrl/⌘-click), and search engines can follow it;\n- a plain click still calls `onPageChange`, which can call `event.preventDefault()` to stay in the page.\n\n## Looks\n- `variant`:\n  - `'outlined'` (default): each control in a border, and the current page filled;\n  - `'soft'`: tinted controls;\n  - `'ghost'`: no border until hover;\n  - `'segmented'`: one joined bar, like a button group;\n  - `'underline'`: text links, with the current page underlined.\n- `shape: 'circle'` makes round controls (`'rounded'` by default).\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- `align`: `'start'` (default), `'center'`, `'end'` or `'between'`, which puts the range at the start and the pages at the end.\n- The CSS variables `--slice-pagination-accent`, `--slice-pagination-size`, `--slice-pagination-radius` and `--slice-pagination-gap` adjust it further.\n\n## Language\n`texts` replaces every word:\n- `label` (the nav's name);\n- `previous`, `next`, `first`, `last`, `previousPage`, `nextPage`;\n- `page` (`{page}`), `pageOf` (`{page}`, `{total}`), `info` (`{from}`, `{to}`, `{total}`);\n- `empty`, `perPage`, `goTo`.\n\n## Live Preview\n:::component name=\"Pagination\"\n{\n  \"currentPage\": 5,\n  \"totalPages\": 20,\n  \"showFirstLast\": true\n}\n:::\n\n## Examples\n:::script label=\"Search results from a server\" expected=\"a search box over a list of results; the pager shows the range and the page size; changing the page or the size waits for the 'server' while the list is dimmed\"\n// A pretend API: 342 articles, filtered by a query, one page at a time.\nconst all = Array.from({ length: 342 }, (_, i) => ({\n  id: i + 1,\n  title: `${['Designing', 'Testing', 'Shipping', 'Scaling', 'Debugging'][i % 5]} ${['components', 'forms', 'tables', 'themes', 'routes', 'services'][i % 6]} #${i + 1}`,\n  minutes: 3 + (i % 9)\n}));\nconst api = async ({ q, page, size }) => {\n  await new Promise((r) => setTimeout(r, 350));\n  const found = all.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));\n  return { total: found.length, items: found.slice((page - 1) * size, page * size) };\n};\n\nlet query = '';\nlet size = 10;\n\nconst list = document.createElement('ol');\nlist.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;gap:6px;transition:opacity .15s';\n\nconst pager = await slice.build('Pagination', {\n  pageSize: size,\n  totalItems: 0,\n  showInfo: true,\n  pageSizes: [10, 20, 50],\n  align: 'between',\n  // The page changes only once the server has answered.\n  controlled: true,\n  onPageChange: (page) => load(page),\n  onPageSizeChange: (next) => { size = next; }\n});\n\nasync function load(page = 1) {\n  list.style.opacity = '.45';\n  const { total, items } = await api({ q: query, page, size });\n  list.replaceChildren(...items.map((a) => {\n    const li = document.createElement('li');\n    li.style.cssText = 'display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--slice-border-raised);border-radius:10px';\n    li.innerHTML = '<span></span><span style=\"opacity:.6;white-space:nowrap\"></span>';\n    li.children[0].textContent = a.title;\n    li.children[1].textContent = `${a.minutes} min read`;\n    return li;\n  }));\n  pager.totalItems = total;\n  pager.currentPage = page;\n  list.style.opacity = '1';\n}\n\nconst search = await slice.build('Input', {\n  label: 'Search articles', icon: 'search', clearable: true, debounce: 300,\n  onChange: (value) => { query = value; load(1); }\n});\nload(1);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:14px;width:100%';\nbox.append(search, list, pager);\nreturn box;\n:::\n\n:::script label=\"Product catalog\" expected=\"a grid of product Cards with a centred segmented pager with first and last; changing the page scrolls back to the top of the grid\"\nconst products = Array.from({ length: 47 }, (_, i) => ({\n  name: `${['Notebook', 'Pen set', 'Sticker pack', 'Washi tape', 'Planner', 'Bookmark'][i % 6]} ${String.fromCharCode(65 + (i % 26))}${i + 1}`,\n  price: (4 + (i * 7) % 30).toFixed(2),\n  icon: ['book-open', 'pen', 'star', 'tag', 'calendar-month', 'bookmark'][i % 6]\n}));\nconst PER_PAGE = 6;\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;scroll-margin-top:90px';\n\nasync function show(page) {\n  // The cards of the page that is leaving are destroyed, not just removed.\n  slice.controller.destroyByContainer(grid);\n  const slice_ = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);\n  const cards = await Promise.all(slice_.map((p) => slice.build('Card', {\n    title: p.name, subtitle: `$${p.price}`, headerIcon: p.icon, size: 'sm', href: '#catalog'\n  })));\n  grid.replaceChildren(...cards);\n}\n\nconst pager = await slice.build('Pagination', {\n  totalItems: products.length,\n  pageSize: PER_PAGE,\n  variant: 'segmented',\n  showFirstLast: true,\n  align: 'center',\n  onPageChange: async (page) => {\n    await show(page);\n    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });\n  }\n});\nawait show(1);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:16px;width:100%';\nbox.append(grid, pager);\nreturn box;\n:::\n\n:::script label=\"Blog with page links\" expected=\"an underline pager whose pages are real links (?page=N, with rel prev/next); a click stays in the page and swaps the posts; Ctrl/⌘-click would open the link\"\nconst posts = Array.from({ length: 23 }, (_, i) => `Post ${23 - i}: notes from week ${23 - i}`);\nconst PER_PAGE = 5;\nconst list = document.createElement('ul');\nlist.style.cssText = 'margin:0;padding-left:18px;line-height:2';\n\nconst render = (page) => {\n  list.replaceChildren(...posts.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((t) => {\n    const li = document.createElement('li');\n    li.textContent = t;\n    return li;\n  }));\n};\n\nconst pager = await slice.build('Pagination', {\n  totalItems: posts.length,\n  pageSize: PER_PAGE,\n  variant: 'underline',\n  showLabels: true,\n  hrefTemplate: '?page={page}',\n  onPageChange: (page, { event }) => {\n    // A real app lets the router take the link. Here the docs page stays put.\n    event?.preventDefault();\n    render(page);\n  }\n});\nrender(1);\n\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;width:100%';\nbox.append(list, pager);\nreturn box;\n:::\n\n:::script label=\"Onboarding with dots\" expected=\"a step Card with dot pagination under it; Next and the dots move between steps; the last step says Get started\"\nconst steps = [\n  { icon: 'sliceJs', title: 'Welcome to Slice', text: 'Components you build once and use everywhere.' },\n  { icon: 'cog', title: 'Make it yours', text: 'Pick a theme, or build one in the Theme Creator.' },\n  { icon: 'users', title: 'Invite your team', text: 'Share projects and review changes together.' },\n  { icon: 'rocket', title: 'Ship it', text: 'Build and deploy with one command.' }\n];\nconst toasts = await slice.build('ToastProvider', { singleton: true });\n\nconst card = await slice.build('Card', { variant: 'filled', size: 'lg' });\ncard.style.cssText = 'max-width:420px;width:100%';\nconst button = await slice.build('Button', { value: 'Next', onClick: () => (dots.currentPage < steps.length ? dots.next() : toasts.show('All set!', { type: 'success' })) });\n\nconst show = (page) => {\n  const step = steps[page - 1];\n  card.headerIcon = step.icon;\n  card.title = step.title;\n  card.text = step.text;\n  button.value = page === steps.length ? 'Get started' : 'Next';\n};\n\nconst dots = await slice.build('Pagination', {\n  mode: 'dots', totalPages: steps.length, variant: 'ghost',\n  texts: { page: 'Step {page}' },\n  onPageChange: (page) => show(page)\n});\nshow(1);\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:420px;width:100%';\nrow.append(dots, button);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:14px;justify-items:start;width:100%';\nbox.append(card, row);\nreturn box;\n:::\n\n:::script label=\"Looks at a glance\" expected=\"the five variants, round controls with labels, the compact mode, the three sizes, and a narrow container that turns into 'Page 7 of 30'\"\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:18px;width:100%';\nconst row = (label, node) => {\n  const wrap = document.createElement('div');\n  wrap.style.cssText = 'display:grid;gap:6px';\n  const caption = document.createElement('span');\n  caption.style.cssText = 'font-size:.8rem;opacity:.6';\n  caption.textContent = label;\n  wrap.append(caption, node);\n  box.appendChild(wrap);\n};\nfor (const variant of ['outlined', 'soft', 'ghost', 'segmented', 'underline']) {\n  row(`variant: '${variant}'`, await slice.build('Pagination', { variant, currentPage: 5, totalPages: 20, showFirstLast: true }));\n}\nrow(\"shape: 'circle', showLabels\", await slice.build('Pagination', { variant: 'soft', shape: 'circle', showLabels: true, currentPage: 2, totalPages: 8 }));\nrow(\"mode: 'compact'\", await slice.build('Pagination', { mode: 'compact', variant: 'segmented', showLabels: true, currentPage: 3, totalPages: 12 }));\nfor (const size of ['sm', 'lg']) row(`size: '${size}'`, await slice.build('Pagination', { size, currentPage: 2, totalPages: 6 }));\nconst narrow = await slice.build('Pagination', { currentPage: 7, totalPages: 30, showLabels: true });\nnarrow.style.maxWidth = '320px';\nrow('a 320px container', narrow);\nreturn box;\n:::\n\n## Best Practices\n:::tip\nShow the range (\"41–60 of 342\") whenever you know the total. It tells people how much there is, and where they are in it, better than page numbers alone.\n:::\n\n:::tip\nUse `controlled: true` when the data comes from a server, and set `currentPage` once the response arrives. The pager then never shows a page whose results are not on screen yet.\n:::\n\n:::tip\nUse `hrefTemplate` for pages people share or come back to (search, a blog, a catalog). A page with an address can be bookmarked, opened in a tab, and found by search engines.\n:::\n\n## Pitfalls\n:::warning\nAfter a page change, bring the start of the list into view (`scrollIntoView`). Otherwise people press Next at the bottom and land at the bottom of the next page.\n:::\n\n:::warning\nWhen the filters or the search change, go back to page 1. Page 7 of the old results may not exist in the new ones.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"currentPage\": 5,\n  \"totalPages\": 20,\n  \"showFirstLast\": true\n}") {
               try {
                  props = JSON.parse("{\n  \"currentPage\": 5,\n  \"totalPages\": 20,\n  \"showFirstLast\": true\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Pagination', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"currentPage\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"totalPages\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pageSize\",\"type\":\"number\",\"required\":false,\"default\":\"10\",\"allowedValues\":[]},{\"path\":\"pageSizes\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"siblingCount\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"boundaryCount\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"showFirstLast\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showPrevNext\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"showLabels\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showInfo\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showJump\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"mode\",\"type\":\"string\",\"required\":false,\"default\":\"pages\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[]},{\"path\":\"shape\",\"type\":\"string\",\"required\":false,\"default\":\"rounded\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"align\",\"type\":\"string\",\"required\":false,\"default\":\"start\",\"allowedValues\":[]},{\"path\":\"hrefTemplate\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"controlled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageSizeChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"currentPage\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"totalPages\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pageSize\",\"type\":\"number\",\"required\":false,\"default\":\"10\",\"allowedValues\":[]},{\"path\":\"pageSizes\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"siblingCount\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"boundaryCount\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"showFirstLast\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showPrevNext\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"showLabels\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showInfo\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showJump\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"mode\",\"type\":\"string\",\"required\":false,\"default\":\"pages\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[]},{\"path\":\"shape\",\"type\":\"string\",\"required\":false,\"default\":\"rounded\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"align\",\"type\":\"string\",\"required\":false,\"default\":\"start\",\"allowedValues\":[]},{\"path\":\"hrefTemplate\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"controlled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageSizeChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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
    // Cleanup timers, listeners, or pending work here
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

customElements.define('slice-paginationdocumentation', PaginationDocumentation);
