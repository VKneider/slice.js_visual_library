---
title: InfiniteScrollService
route: /docs/services/infinite-scroll
navLabel: InfiniteScrollService
section: Services
group: Interaction
order: 61
description: Headless infinite scrolling. Watches the end of a list and loads the next page, one request at a time, with abort on reset, fill-the-screen, errors with retry, and page or cursor APIs.
component: InfiniteScrollServiceDocumentation
generate: true
tags: [infinite, scroll, pagination, feed, load more, service]
---

# InfiniteScrollService

## Overview
`InfiniteScrollService` loads the next page of a list when its end comes into view, the way a social feed does. It is **headless**: it draws nothing and knows nothing about your items. You decide what the list looks like; it decides **when** to ask for more, and makes sure the answers arrive in order.

You put an element at the end of your list (the *sentinel*), attach it, and give the service a `load` function:

```js
const scroller = await slice.build('InfiniteScrollService', { singleton: true });

const feed = scroller.attach(sentinel, {
  root: listBox,                       // the box that scrolls (null: the page)
  load: async ({ page, signal }) => {
    const res = await fetch(`/api/posts?page=${page}`, { signal });
    return res.json();                 // { items: [...], done: false }
  },
  onItems: (items, { first }) => {
    if (first) list.replaceChildren(); // page 1: start the list over
    list.append(...items.map(renderPost));
  },
  onStateChange: (state) => {          // 'idle' | 'loading' | 'error' | 'done'
    spinner.hidden = state !== 'loading';
  }
});
```

If you know React, it does the work of an `useEffect` with an `IntersectionObserver`, an `AbortController` and a "loading" flag, written once and tested.

### When to use it
- **Feeds and timelines** people scroll through without looking for something in particular: posts, activity, photos.
- **Long lists from a server** where a pager would interrupt reading.
- **Inside your own components.** DataList uses it for `pagination: 'infinite'`, and any list of yours can too.

### When not to use it
- **Results people come back to** ("it was on page 3") or compare: use [Pagination](/docs/data/pagination).
- **Pages with a footer people need** (contact, terms): it is never reached. Use `autoLimit` so a "Load more" button takes over after a few pages, or use Pagination.
- **A list that fits in memory and on screen**: render it whole.

## Core Behavior

### Loading
- `load({ page, cursor, pageSize, signal, feed })` returns the next page: an array of items, or `{ items, done, hasMore, cursor }`. It can be async.
- `onItems(items, { page, cursor, first })` receives each page. `first` is true for the first page after an `attach` or a `reset`, which is when your list should start over.
- The page number starts at `startPage` (1) and goes up by one. With a cursor API, return `cursor` and it is sent back with the next request.

### What it takes care of
- **One request at a time.** Scrolling up and down at the end never asks for the same page twice.
- **Filling the screen.** When a page is not enough to fill the box, it asks for the next one, until the box can scroll or there is nothing more.
- **The end.** It stops in `'done'` when the answer says `done: true` or `hasMore: false`, when `cursor` comes back `null`, when a page is empty, or when a page has fewer items than `pageSize`.
- **Errors.** A failed `load` stops it in `'error'` (`feed.error` holds it, and `onError` gets it) until `feed.retry()`.
- **Changing the query.** `feed.reset()` aborts the request in flight through its `signal`, drops a late answer to the old query, and loads page 1 again. Call it when the search or a filter changes.

### Controlling it
- `feed.loadMore()` loads the next page now, for a "Load more" button.
- `autoLimit`: after this many pages loaded by scrolling, only `loadMore()` loads. Use it to keep a footer reachable.
- `auto: false`: never load on scroll, only through `loadMore()`.
- `feed.pause()` and `feed.resume()`; `feed.configure({ ... })` changes options later.
- `feed.state`, `feed.page`, `feed.cursor`, `feed.loading`, `feed.done` and `feed.error` say where it is.
- `rootMargin` (`'600px'` by default) is how early it loads, before the end is actually visible.

### Cleaning up
`scroller.detach(sentinel)` (or `feed.destroy()`) stops watching and aborts the request in flight. Call it in your component's `beforeDestroy()`.

## Examples
:::script label="A feed" expected="a scrolling box of posts; reaching the end shows 'Loading…' and adds the next 10 posts; after 4 pages it says 'You are all caught up'; a search box starts the feed over"
const scroller = await slice.build('InfiniteScrollService', { singleton: true });

// A pretend API: 37 posts, 10 per page, a little slow.
const all = Array.from({ length: 37 }, (_, i) => ({ id: i + 1, author: ['Ana', 'Luis', 'María', 'José'][i % 4], text: `Post number ${i + 1}` }));
const api = async ({ page, query, signal }) => {
  await new Promise((r) => setTimeout(r, 450));
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
  const rows = all.filter((p) => !query || p.text.includes(query) || p.author.toLowerCase().includes(query.toLowerCase()));
  return { items: rows.slice((page - 1) * 10, page * 10), done: page * 10 >= rows.length };
};

const box = document.createElement('div');
box.style.cssText = 'height:320px;overflow:auto;border:1px solid var(--slice-border-raised,#ddd);border-radius:12px;padding:8px';
const list = document.createElement('div');
list.style.cssText = 'display:grid;gap:8px';
const status = document.createElement('p');
status.style.cssText = 'margin:10px;text-align:center;opacity:.7';
const sentinel = document.createElement('div');
box.append(list, status, sentinel);

let query = '';
const feed = scroller.attach(sentinel, {
  root: box,
  pageSize: 10,
  load: ({ page, signal }) => api({ page, query, signal }),
  onItems: async (items, { first }) => {
    if (first) list.replaceChildren();
    for (const post of items) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;align-items:center;padding:10px;border-radius:10px;background:color-mix(in srgb,var(--primary-color) 5%,transparent)';
      row.append(await slice.build('Avatar', { name: post.author, size: 'sm' }), `${post.author}: ${post.text}`);
      list.append(row);
    }
  },
  onStateChange: (state) => {
    status.textContent = { loading: 'Loading…', done: 'You are all caught up', error: 'Could not load more.', idle: '' }[state];
  }
});

const search = await slice.build('Input', {
  label: 'Search posts', debounce: 250,
  onChange: (value) => { query = value.trim(); feed.reset(); }
});

const wrap = document.createElement('div');
wrap.style.cssText = 'display:grid;gap:12px;width:100%;max-width:480px';
wrap.append(search, box);
return wrap;
:::

:::script label="Load more after three pages" expected="a list that loads by scrolling for three pages, then shows a 'Load more' button; the button loads one page at a time until the end"
const scroller = await slice.build('InfiniteScrollService', { singleton: true });
const total = 80;

const box = document.createElement('div');
box.style.cssText = 'height:260px;overflow:auto;border:1px solid var(--slice-border-raised,#ddd);border-radius:12px';
const list = document.createElement('ol');
list.style.cssText = 'margin:0;padding:8px 8px 8px 40px';
const footer = document.createElement('div');
footer.style.cssText = 'display:flex;justify-content:center;padding:10px';
const sentinel = document.createElement('div');
box.append(list, footer, sentinel);

const more = await slice.build('Button', { value: 'Load more', variant: 'outlined', onClick: () => feed.loadMore() });
more.hidden = true;
footer.append(more);

const feed = scroller.attach(sentinel, {
  root: box,
  pageSize: 15,
  autoLimit: 3,
  load: async ({ page }) => {
    await new Promise((r) => setTimeout(r, 300));
    const from = (page - 1) * 15;
    return Array.from({ length: Math.max(0, Math.min(15, total - from)) }, (_, i) => `Order #${1000 + from + i}`);
  },
  onItems: (items) => list.append(...items.map((text) => Object.assign(document.createElement('li'), { textContent: text }))),
  onStateChange: (state) => {
    // After the automatic pages, the button takes over.
    more.hidden = state === 'done' || feed.page <= 3;
    more.disabled = state === 'loading';
  }
});
return box;
:::

## Best Practices
:::tip
Call `feed.reset()` whenever the query changes (search, filters, sort). It cancels the old request, so results of two queries never mix.
:::

:::tip
Pass the `signal` to `fetch`. A reset then cancels the network request itself, not only its answer.
:::

## Pitfalls
:::warning
Detach the sentinel when your component is destroyed (`beforeDestroy`), or the service keeps watching an element that is gone.
:::

:::warning
Infinite scrolling hides the footer. If the page has one, set `autoLimit` so a "Load more" button appears after a few pages.
:::