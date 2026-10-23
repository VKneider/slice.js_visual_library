---
title: Pagination
route: /docs/data/pagination
navLabel: Pagination
section: Data
group: Tables
order: 11
description: Moves through pages of a list, a table or search results. Five looks, numbered, compact or dot modes, the range on screen, a page-size picker, a jump box, real links, and a compact form on narrow screens.
component: PaginationDocumentation
generate: true
tags: [pagination, pager, pages, navigation, data]
---

# Pagination

## Overview
`Pagination` splits a long list into pages and moves between them. It works on its own (search results, a product grid, a feed) and inside a [Table](/docs/data/table), which builds one for you with `pagination: true`.

### When to use it
- Results people scan page by page and come back to ("it was on page 3").
- Long lists where the total matters: "41–60 of 342".
- Steps of a carousel or an onboarding, with `mode: 'dots'`.

### When not to use it
- **A feed people only scroll through** reads better with "Load more" or infinite scrolling.
- **Lists that fit on one screen** do not need pages. Show them whole.

## Core Behavior

### Pages
- `currentPage` and `totalPages` set where it is.
- Instead of `totalPages`, you can give `totalItems` and `pageSize`, and Pagination works out the pages and the range on screen.
- Long ranges are shortened with ellipses: `siblingCount` (default 1) pages on each side of the current one, and `boundaryCount` (default 1) at each end.
- `showFirstLast` adds « and », and `showLabels` writes "Previous" and "Next" beside the arrows.

### Moving
- A click moves to the page and calls `onPageChange(page, { previous, event })`. The `page-change` event also reports it.
- `goTo(page)`, `next()` and `previous()` do the same from code, and the page is clamped to the range.
- `controlled: true` only reports the click, and waits for you to set `currentPage`. Use it when the page lives elsewhere: a router, a store, or a request that has to succeed first. Table uses it this way.
- When Next or Previous re-renders the pages, the focus stays on the button that was pressed, so the keyboard can keep paging.

### Range, page size and jump
- `showInfo` shows the range on screen ("41–60 of 342"), or "Page 3 of 18" without `totalItems`.
- `pageSizes: [10, 20, 50]` adds a "Rows per page" [Select](/docs/input/select).
  - `onPageSizeChange(size)` reports a new size.
  - The page changes with the size, so the first item that was on screen stays in view.
- `showJump` adds a box to type a page number and press **Enter**.

### Modes
- `'pages'` (default): numbered pages. **In a container narrower than 420px it turns into "Page 5 of 20" by itself**, so a phone never gets a wrapped row of numbers.
- `'compact'`: always "Page 5 of 20" between Previous and Next.
- `'dots'`: one dot per page, for a carousel or an onboarding with a few steps.

### Links
`hrefTemplate: '?page={page}'` renders real links instead of buttons, with `rel="prev"` and `rel="next"`:
- each page has an address, so it can be bookmarked or opened in a new tab (Ctrl/⌘-click), and search engines can follow it;
- a plain click still calls `onPageChange`, which can call `event.preventDefault()` to stay in the page.

## Looks
- `variant`:
  - `'outlined'` (default): each control in a border, and the current page filled;
  - `'soft'`: tinted controls;
  - `'ghost'`: no border until hover;
  - `'segmented'`: one joined bar, like a button group;
  - `'underline'`: text links, with the current page underlined.
- `shape: 'circle'` makes round controls (`'rounded'` by default).
- `size`: `'sm'`, `'md'` (default) or `'lg'`.
- `align`: `'start'` (default), `'center'`, `'end'` or `'between'`, which puts the range at the start and the pages at the end.
- The CSS variables `--slice-pagination-accent`, `--slice-pagination-size`, `--slice-pagination-radius` and `--slice-pagination-gap` adjust it further.

## Language
`texts` replaces every word:
- `label` (the nav's name);
- `previous`, `next`, `first`, `last`, `previousPage`, `nextPage`;
- `page` (`{page}`), `pageOf` (`{page}`, `{total}`), `info` (`{from}`, `{to}`, `{total}`);
- `empty`, `perPage`, `goTo`.

## Live Preview
:::component name="Pagination"
{
  "currentPage": 5,
  "totalPages": 20,
  "showFirstLast": true
}
:::

## Examples
:::script label="Search results from a server" expected="a search box over a list of results; the pager shows the range and the page size; changing the page or the size waits for the 'server' while the list is dimmed"
// A pretend API: 342 articles, filtered by a query, one page at a time.
const all = Array.from({ length: 342 }, (_, i) => ({
  id: i + 1,
  title: `${['Designing', 'Testing', 'Shipping', 'Scaling', 'Debugging'][i % 5]} ${['components', 'forms', 'tables', 'themes', 'routes', 'services'][i % 6]} #${i + 1}`,
  minutes: 3 + (i % 9)
}));
const api = async ({ q, page, size }) => {
  await new Promise((r) => setTimeout(r, 350));
  const found = all.filter((a) => a.title.toLowerCase().includes(q.toLowerCase()));
  return { total: found.length, items: found.slice((page - 1) * size, page * size) };
};

let query = '';
let size = 10;

const list = document.createElement('ol');
list.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;gap:6px;transition:opacity .15s';

const pager = await slice.build('Pagination', {
  pageSize: size,
  totalItems: 0,
  showInfo: true,
  pageSizes: [10, 20, 50],
  align: 'between',
  // The page changes only once the server has answered.
  controlled: true,
  onPageChange: (page) => load(page),
  onPageSizeChange: (next) => { size = next; }
});

async function load(page = 1) {
  list.style.opacity = '.45';
  const { total, items } = await api({ q: query, page, size });
  list.replaceChildren(...items.map((a) => {
    const li = document.createElement('li');
    li.style.cssText = 'display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--slice-border-raised);border-radius:10px';
    li.innerHTML = '<span></span><span style="opacity:.6;white-space:nowrap"></span>';
    li.children[0].textContent = a.title;
    li.children[1].textContent = `${a.minutes} min read`;
    return li;
  }));
  pager.totalItems = total;
  pager.currentPage = page;
  list.style.opacity = '1';
}

const search = await slice.build('Input', {
  label: 'Search articles', icon: 'search', clearable: true, debounce: 300,
  onChange: (value) => { query = value; load(1); }
});
load(1);

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:14px;width:100%';
box.append(search, list, pager);
return box;
:::

:::script label="Product catalog" expected="a grid of product Cards with a centred segmented pager with first and last; changing the page scrolls back to the top of the grid"
const products = Array.from({ length: 47 }, (_, i) => ({
  name: `${['Notebook', 'Pen set', 'Sticker pack', 'Washi tape', 'Planner', 'Bookmark'][i % 6]} ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
  price: (4 + (i * 7) % 30).toFixed(2),
  icon: ['book-open', 'pen', 'star', 'tag', 'calendar-month', 'bookmark'][i % 6]
}));
const PER_PAGE = 6;

const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;scroll-margin-top:90px';

async function show(page) {
  // The cards of the page that is leaving are destroyed, not just removed.
  slice.controller.destroyByContainer(grid);
  const slice_ = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const cards = await Promise.all(slice_.map((p) => slice.build('Card', {
    title: p.name, subtitle: `$${p.price}`, headerIcon: p.icon, size: 'sm', href: '#catalog'
  })));
  grid.replaceChildren(...cards);
}

const pager = await slice.build('Pagination', {
  totalItems: products.length,
  pageSize: PER_PAGE,
  variant: 'segmented',
  showFirstLast: true,
  align: 'center',
  onPageChange: async (page) => {
    await show(page);
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
await show(1);

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:16px;width:100%';
box.append(grid, pager);
return box;
:::

:::script label="Blog with page links" expected="an underline pager whose pages are real links (?page=N, with rel prev/next); a click stays in the page and swaps the posts; Ctrl/⌘-click would open the link"
const posts = Array.from({ length: 23 }, (_, i) => `Post ${23 - i}: notes from week ${23 - i}`);
const PER_PAGE = 5;
const list = document.createElement('ul');
list.style.cssText = 'margin:0;padding-left:18px;line-height:2';

const render = (page) => {
  list.replaceChildren(...posts.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    return li;
  }));
};

const pager = await slice.build('Pagination', {
  totalItems: posts.length,
  pageSize: PER_PAGE,
  variant: 'underline',
  showLabels: true,
  hrefTemplate: '?page={page}',
  onPageChange: (page, { event }) => {
    // A real app lets the router take the link. Here the docs page stays put.
    event?.preventDefault();
    render(page);
  }
});
render(1);

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;width:100%';
box.append(list, pager);
return box;
:::

:::script label="Onboarding with dots" expected="a step Card with dot pagination under it; Next and the dots move between steps; the last step says Get started"
const steps = [
  { icon: 'sliceJs', title: 'Welcome to Slice', text: 'Components you build once and use everywhere.' },
  { icon: 'cog', title: 'Make it yours', text: 'Pick a theme, or build one in the Theme Creator.' },
  { icon: 'users', title: 'Invite your team', text: 'Share projects and review changes together.' },
  { icon: 'rocket', title: 'Ship it', text: 'Build and deploy with one command.' }
];
const toasts = await slice.build('ToastProvider', { singleton: true });

const card = await slice.build('Card', { variant: 'filled', size: 'lg' });
card.style.cssText = 'max-width:420px;width:100%';
const button = await slice.build('Button', { value: 'Next', onClick: () => (dots.currentPage < steps.length ? dots.next() : toasts.show('All set!', { type: 'success' })) });

const show = (page) => {
  const step = steps[page - 1];
  card.headerIcon = step.icon;
  card.title = step.title;
  card.text = step.text;
  button.value = page === steps.length ? 'Get started' : 'Next';
};

const dots = await slice.build('Pagination', {
  mode: 'dots', totalPages: steps.length, variant: 'ghost',
  texts: { page: 'Step {page}' },
  onPageChange: (page) => show(page)
});
show(1);

const row = document.createElement('div');
row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:420px;width:100%';
row.append(dots, button);
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:14px;justify-items:start;width:100%';
box.append(card, row);
return box;
:::

:::script label="Looks at a glance" expected="the five variants, round controls with labels, the compact mode, the three sizes, and a narrow container that turns into 'Page 7 of 30'"
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:18px;width:100%';
const row = (label, node) => {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;gap:6px';
  const caption = document.createElement('span');
  caption.style.cssText = 'font-size:.8rem;opacity:.6';
  caption.textContent = label;
  wrap.append(caption, node);
  box.appendChild(wrap);
};
for (const variant of ['outlined', 'soft', 'ghost', 'segmented', 'underline']) {
  row(`variant: '${variant}'`, await slice.build('Pagination', { variant, currentPage: 5, totalPages: 20, showFirstLast: true }));
}
row("shape: 'circle', showLabels", await slice.build('Pagination', { variant: 'soft', shape: 'circle', showLabels: true, currentPage: 2, totalPages: 8 }));
row("mode: 'compact'", await slice.build('Pagination', { mode: 'compact', variant: 'segmented', showLabels: true, currentPage: 3, totalPages: 12 }));
for (const size of ['sm', 'lg']) row(`size: '${size}'`, await slice.build('Pagination', { size, currentPage: 2, totalPages: 6 }));
const narrow = await slice.build('Pagination', { currentPage: 7, totalPages: 30, showLabels: true });
narrow.style.maxWidth = '320px';
row('a 320px container', narrow);
return box;
:::

## Best Practices
:::tip
Show the range ("41–60 of 342") whenever you know the total. It tells people how much there is, and where they are in it, better than page numbers alone.
:::

:::tip
Use `controlled: true` when the data comes from a server, and set `currentPage` once the response arrives. The pager then never shows a page whose results are not on screen yet.
:::

:::tip
Use `hrefTemplate` for pages people share or come back to (search, a blog, a catalog). A page with an address can be bookmarked, opened in a tab, and found by search engines.
:::

## Pitfalls
:::warning
After a page change, bring the start of the list into view (`scrollIntoView`). Otherwise people press Next at the bottom and land at the bottom of the next page.
:::

:::warning
When the filters or the search change, go back to page 1. Page 7 of the old results may not exist in the new ones.
:::