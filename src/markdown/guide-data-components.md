---
title: Writing a component that loads data
route: /docs/guides/data-components
navLabel: Data components
section: Guides
group: Components
order: 2
description: The standard every Slice component that shows server data follows — three sources with the same names, the states it must show, requests that never block the page and are cancelled when they are not needed, and how changes are saved and taken back. With a complete component to copy.
component: DataComponentsDocumentation
generate: true
tags: [guide, component, data, load, context, states, skeleton, abort, commit, rollback, standards]
---

# Writing a component that loads data

## Overview
DataList, Table and DescriptionList load, show and save data the same way, with the same names. This page is that standard, for anyone writing a component (in the library or in an app) that does the same: a profile card, a dashboard tile, an order summary.

Follow it and your component behaves like the library's: it never keeps the page behind the loader, it always shows what is happening, and an app developer already knows its API. The rules are also in `COMPONENT_API_STANDARDS.md` §13, the checklist for library contributions.

### When it applies
- The component shows data it does not receive whole as a prop: from a server, or from a `slice.context`.
- It changes that data (saves, deletes) and has to say whether that worked.

### When it does not
- The data is a prop the app already has. Take it as a prop (`item`, `items`) and redraw when it changes. Nothing to load.
- Many components show the same data. Then the app keeps it in a context ([Data and the first load](/docs/guides/data-and-loading), pattern 2), and your component takes `context`.

## The rules

### 1. `init()` never awaits the network
The app's loader waits for every `init()` the page awaits (see [Data and the first load](/docs/guides/data-and-loading)). Build the structure, start the request **without** `await`, return.

### 2. Three sources, the same names
| Prop | Meaning |
| --- | --- |
| `item` / `items` (`rows` in Table) | data the app owns. Setting it again redraws. |
| `context` + `contextPath` | a `slice.context` context, and where the data is in it. Watch it; write changes back to it. |
| `load` | `async ({ …query, signal }) => data`. A list returns `{ items, total }` or an array. |

Plus `reload()` (ask again), `update()` calling it (a cached route came back), and `onError(error, { type })`.

### 3. Every state is shown
| State | Shows |
| --- | --- |
| first load | a skeleton shaped like the content; the **first paint** is already it |
| loading again | the old content, marked busy (`aria-busy`) |
| empty | what would be here, and how to add it |
| error | what failed, and **Try again** (`role="alert"`) |
| saving | the part being saved busy; the rest usable |

### 4. One request at a time, cancelled when not needed
A new request aborts the previous one (`AbortController`). `beforeDestroy()` aborts too. An answer that arrives for an aborted request is ignored, so a slow old answer never overwrites a new one.

### 5. Changes: optimistic lists, commit-first fields, never mutate
- Add, change and remove are `addItem`, `updateItem`, `removeItem` with `{ commit }`. They show at once and are taken back if `commit` throws. Never call one `update()`: that name is the framework's.
- A single value edited in place is saved first (`commit`), written after.
- Make new arrays and objects; never change the ones you were given. `shared/data/collection.js` and `writePath` in `shared/data/paths.js` do it for you inside the library.

## A complete example
`UserCard` shows one user. It follows every rule above: it takes `item`, `context` or `load`; it shows a skeleton, an error with Try again, and a busy state while it saves; it cancels what it does not need; and its one action (follow) is optimistic with rollback.

```js
// src/Components/AppComponents/UserCard/UserCard.js
import { readPath, writePath } from '../../shared/data/paths.js';

export default class UserCard extends HTMLElement {
  static props = {
    item: { type: 'object', default: null },
    context: { type: 'string', default: '' },
    contextPath: { type: 'string', default: '' },
    load: { type: 'function', default: null },
    commit: { type: 'function', default: null },   // ({ key, value, item }) => any
    onError: { type: 'function', default: null },
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);
    this.classList.add('slice-user-card');
    this.$body = this.querySelector('.slice-user-card__body');
    this.$state = this.querySelector('.slice-user-card__state');
    // Internal state: never `_<prop>` (Slice resets those on build).
    this._loaded = null;
    this._status = 'idle';          // idle | loading | error
    this._abort = null;
    slice.controller.setComponentProps(this, props);
  }

  async init() {
    this._ready = true;
    this.$avatar = await slice.build('Avatar', { size: 'lg' });   // building: awaited
    this.$follow = await slice.build('Button', { value: 'Follow', size: 'sm', onClick: () => this.toggleFollow() });
    this.$body.prepend(this.$avatar);
    this.$body.append(this.$follow);
    if (this._context) {
      slice.context.watch(this._context, this, () => this._paint(), (s) => readPath(s, this._contextPath));
    }
    if (this._load) this._status = 'loading';   // first paint: the skeleton
    this._paint();
    if (this._load) this._fetch();               // the network: NOT awaited
  }

  update() { if (this._ready) this.reload(); }  // a cached route came back

  beforeDestroy() {
    this._ready = false;
    this._abort?.abort();
    slice.controller.destroyComponent(this.$avatar);   // built with slice.build after init
    slice.controller.destroyComponent(this.$follow);
  }

  get item() { return this._current(); }
  set item(value) { this._item = value; this._paint(); }
  get load() { return this._load; }
  set load(fn) { this._load = typeof fn === 'function' ? fn : null; if (this._ready && this._load) this._fetch(); }
  get context() { return this._context; }
  set context(name) { this._context = name || ''; }
  get contextPath() { return this._contextPath; }
  set contextPath(path) { this._contextPath = path || ''; }
  get commit() { return this._commit; }
  set commit(fn) { this._commit = typeof fn === 'function' ? fn : null; }
  get onError() { return this._onError; }
  set onError(fn) { this._onError = typeof fn === 'function' ? fn : null; }

  reload() {
    return this._load ? this._fetch() : Promise.resolve(this._paint());
  }

  // Where the user is: the context, what `load` returned, or the prop.
  _current() {
    if (this._context) return readPath(slice.context.getState(this._context), this._contextPath) ?? null;
    return this._load ? this._loaded : this._item;
  }

  // Write a new user to wherever it lives.
  _write(next) {
    if (this._context) slice.context.setState(this._context, (s) => writePath(s, this._contextPath, next));
    else if (this._load) this._loaded = next;
    else this._item = next;
    this._paint();
  }

  async _fetch() {
    this._abort?.abort();                       // one request at a time
    const abort = new AbortController();
    this._abort = abort;
    this._status = 'loading';
    this._paint();
    try {
      const user = await this._load({ signal: abort.signal });
      if (abort.signal.aborted || !this._ready) return;   // a newer request, or gone
      this._loaded = user;
      this._status = 'idle';
    } catch (error) {
      if (abort.signal.aborted || !this._ready) return;
      this._status = 'error';
      this._onError?.(error, { type: 'load' });
    }
    this._paint();
  }

  // Optimistic: shows at once, taken back if the server says no.
  async toggleFollow() {
    const before = this._current();
    if (!before) return;
    const next = { ...before, following: !before.following };   // a new object
    this._write(next);
    this.$follow.disabled = true;
    try {
      await this._commit?.({ key: 'following', value: next.following, item: next });
    } catch (error) {
      this._write(before);
      this._onError?.(error, { type: 'save' });
      // …and say so: an Alert, or the app's ToastProvider.
    } finally {
      this.$follow.disabled = false;
    }
  }

  _paint() {
    if (!this._ready) return;
    const user = this._current();
    const loading = this._status === 'loading' && !user;
    this.classList.toggle('is-loading', loading);            // CSS draws the skeleton
    this.setAttribute('aria-busy', String(this._status === 'loading'));
    this.$state.hidden = this._status !== 'error';
    this.$state.setAttribute('role', 'alert');
    this.$state.textContent = this._status === 'error' ? 'This user could not be loaded.' : '';
    if (this._status === 'error') {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Try again';
      retry.addEventListener('click', () => this._fetch());
      this.$state.append(' ', retry);
    }
    if (!user) return;
    this.$avatar.name = user.name;
    this.$avatar.src = user.photo || '';
    this.$follow.value = user.following ? 'Following' : 'Follow';
  }
}

customElements.define('slice-user-card', UserCard);
```

```html
<!-- UserCard.html -->
<div class="slice-user-card__body"></div>
<p class="slice-user-card__state" hidden></p>
```

Used three ways, with the same names as the library's components:

```js
await slice.build('UserCard', { item: currentUser });
await slice.build('UserCard', { context: 'session', contextPath: 'user' });
await slice.build('UserCard', {
  load: ({ signal }) => fetch(`/api/users/${id}`, { signal }).then((r) => r.json()),
  commit: ({ key, value, item }) => api.patchUser(item.id, { [key]: value }),
});
```

## How the library does it
Read these when your component grows:

- `Visual/DescriptionList/DescriptionList.js`: one record from `item`, `context` or `load`; skeleton, error with Try again; fields edited with `commit` first.
- `Visual/DataList/DataList.js`: many records; queries (page, search, filters, sort) sent to `load`; optimistic `addItem`, `updateItem`, `removeItem` with Undo.
- `Visual/Table/Table.js`: the same for rows, with cells edited in place.
- `shared/README.md`: the helpers they share (`data/paths.js`, `data/collection.js`, `editing/inlineControl.js`).

## Checklist
:::tip
- `init()` / `update()` do not await the network; the first paint is the skeleton.
- `item(s)` / `context` + `contextPath` / `load`, `reload()`, `onError(error, { type })`.
- States: skeleton, busy, empty, error with Try again, saving.
- `AbortController`: a new request and `beforeDestroy()` abort the previous one; late answers are ignored.
- Changes with `{ commit }`: lists optimistic with rollback, fields commit-first; nothing mutated.
- Every component built with `slice.build` after `init()` is destroyed in `beforeDestroy()`.
:::

## Pitfalls
:::warning
A `_fetch()` that does not check `signal.aborted` after its `await` lets a slow, old answer overwrite a fast, new one: the user searches "ana", then "anabel", and sees the results for "ana".
:::

:::warning
Do not name internal state after a prop (`this._items` for loaded data when `items` is a prop): Slice resets `_<prop>` when the component is built, and the data disappears. Use `_loaded`, `_status`.
:::