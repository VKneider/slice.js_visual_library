---
title: StorageService
route: /docs/services/storage-service
navLabel: StorageService
section: Services
group: Storage
order: 10
description: Small values the browser keeps for the app — preferences, the last filters, a draft. JSON in and out, a namespace per app, expiry per value, watch() that also hears other tabs, a full storage that does not throw, and a memory fallback when the browser refuses storage.
component: StorageServiceDocumentation
generate: true
tags: [service, storage, localStorage, sessionStorage, preferences, persist, ttl, expiry, watch, tabs]
---

# StorageService

## Overview
`StorageService` keeps small values in the browser for the app: the theme, a collapsed sidebar, the last filters, a draft. It is `localStorage` (or `sessionStorage`) with what every app ends up writing around it:

- values go in and come out **as they were** (objects, arrays, numbers), not as strings;
- a **namespace**, so two apps on the same origin never share keys, and `clear()` removes only yours;
- an **expiry** per value (`ttl`);
- a **full storage** returns `false` with a warning instead of throwing in the middle of a click;
- **`watch()`**: a component hears a value change, in this tab **and in other tabs**, until it is destroyed;
- when the browser **refuses storage** (some private modes, blocked site data), values live in memory for the session, with one warning, instead of failing on every call.

```js
const prefs = await slice.build('StorageService', { singleton: true, sliceId: 'prefs', namespace: 'my-app' });

prefs.set('density', 'compact');
prefs.get('density', 'comfortable');          // 'compact'; 'comfortable' when there is none
prefs.set('draft', text, { ttl: 24 * 3600_000 }); // forgotten after a day
prefs.watch('density', this, (density) => this.classList.toggle('is-compact', density === 'compact'));
```

### When to use it
- Preferences and small UI memory: theme, density, the open tab, a dismissed banner, the last search.
- A draft that should survive a reload, with an expiry.
- A value several tabs must agree on (sign-out in one tab, the others follow).

### When not to use it
- **Many records, files, or anything to search**: [IndexedDbManager](/docs/services/indexed-db-manager). Storage holds a few megabytes of text, and every read is synchronous.
- **State the app's components share while it runs**: `slice.context` (with `persist: true` when it must survive a reload).
- **Server data**: [QueryService](/docs/services/query-service).
- **Secrets** (tokens with long lives, personal data): any script on the page can read storage.

## Build it
```js
const prefs = await slice.build('StorageService', {
  singleton: true,
  sliceId: 'prefs',
  namespace: 'my-app',   // keys are stored as "my-app:<key>"
  area: 'local',         // 'local' (default) or 'session' (until the tab closes)
});
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `namespace` | `string` | `''` | Prefix of every key (`my-app:theme`). Without it, keys are stored as they are and `clear()` empties the whole storage of the origin. |
| `area` | `'local' \| 'session'` | `'local'` | `localStorage` survives closing the browser; `sessionStorage` lives as long as the tab. |

Build one per namespace and area, as a singleton, and give components the service.

## Methods
| Method | Returns | Description |
| --- | --- | --- |
| `get(key, fallback = null)` | value | The value, or `fallback` when there is none or it expired. |
| `set(key, value, { ttl }?)` | `boolean` | Keeps the value (JSON). `ttl` in ms: forgotten after that. `undefined` removes it. `false` when the storage is full or the value is not JSON. |
| `change(key, updater, fallback?, { ttl }?)` | `boolean` | `set(key, updater(current))`: `change('visits', (n) => n + 1, 0)`. |
| `remove(key)` | `true` | Removes it. |
| `has(key)` | `boolean` | There is a value, not expired. |
| `keys()` | `string[]` | The keys of this namespace (without the prefix). |
| `clear()` | `true` | Removes every value of this namespace. |
| `purge()` | — | Removes the expired values now (also done when the service starts). |
| `watch(key, component, callback, fallback?)` | `() => void` | Calls `callback(value)` now and on every change of `key` — from this service, another one in the page, or another tab — until `component` is destroyed. Returns a function to stop sooner. |

A value written as plain text by other code (`localStorage.setItem('x', 'hello')`) is read back as that text.

## Examples

### Preferences that follow you between tabs
The switches keep their state in storage, and the panel below watches it. Open this page in a second tab and change a switch there: this one follows.

:::script label="Remembered preferences" expected="two switches, 'Compact list' and 'Show archived', and a line describing the current preferences; changing a switch updates the line at once; reloading the page or opening it in another tab keeps the choices, and a change in the other tab shows here too"
const prefs = await slice.build('StorageService', { singleton: true, sliceId: 'docsPrefs', namespace: 'slice-docs' });

const compact = await slice.build('Switch', {
  label: 'Compact list',
  checked: prefs.get('compact', false),
  onChange: (checked) => prefs.set('compact', checked)
});
const archived = await slice.build('Switch', {
  label: 'Show archived',
  checked: prefs.get('archived', false),
  onChange: (checked) => prefs.set('archived', checked)
});

const summary = await slice.build('Badge', { label: '', tone: 'accent' });
const paint = () => {
  const parts = [prefs.get('compact', false) ? 'compact' : 'comfortable', prefs.get('archived', false) ? 'with archived' : 'without archived'];
  summary.label = `List: ${parts.join(', ')}`;
};
// The switches follow other tabs too; the badge repaints on any change.
prefs.watch('compact', compact, (value) => { compact.checked = value; paint(); }, false);
prefs.watch('archived', archived, (value) => { archived.checked = value; paint(); }, false);

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:12px;justify-items:start';
box.append(compact, archived, summary);
return box;
:::

### A draft that survives a reload, for a while
Every change is kept with a `ttl`: reload within ten minutes and the text is back; after that it is gone.

:::script label="Draft with expiry" expected="a text area and a line under it; typing shows 'Draft kept until <time>'; reloading the page within ten minutes brings the text back; 'Discard' empties it and the line says there is no draft"
const drafts = await slice.build('StorageService', { singleton: true, sliceId: 'docsDrafts', namespace: 'slice-docs-drafts' });
const TEN_MINUTES = 10 * 60_000;

const status = document.createElement('small');
status.style.cssText = 'opacity:.75';
const say = () => {
  status.textContent = drafts.has('message')
    ? `Draft kept until ${new Date(Date.now() + TEN_MINUTES).toLocaleTimeString()}`
    : 'No draft kept.';
};

const message = await slice.build('Textarea', {
  label: 'Message',
  rows: 4,
  value: drafts.get('message', ''),
  onChange: (text) => {
    if (text.trim()) drafts.set('message', text, { ttl: TEN_MINUTES });
    else drafts.remove('message');
    say();
  }
});
const discard = await slice.build('Button', {
  value: 'Discard', variant: 'ghost', size: 'sm',
  onClick: () => { drafts.remove('message'); message.value = ''; say(); }
});
say();

const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:8px;width:100%;max-width:480px';
box.append(message, status, discard);
return box;
:::

### Signing out in every tab
A value all tabs watch. When one tab signs out, the others hear it and follow.

```js
// In the App component.
const session = await slice.build('StorageService', { singleton: true, sliceId: 'session', namespace: 'my-app' });

session.watch('signedIn', this, (signedIn) => {
  if (!signedIn && slice.router.activeRoute?.path !== '/login') slice.router.navigate('/login');
}, true);

// The sign-out button, in any tab.
session.set('signedIn', false);
```

### Remembering a list's filters
```js
const ui = await slice.build('StorageService', { singleton: true, sliceId: 'ui', namespace: 'my-app' });

const orders = await slice.build('DataList', {
  filterValues: ui.get('orders.filters', {}),
  onQueryChange: (query) => ui.set('orders.filters', query.filters),
  // …
});
```

## From LocalStorageManager
`LocalStorageManager` is deprecated and keeps working as it was, with one warning.

| LocalStorageManager | StorageService |
| --- | --- |
| `getItem(key)` | `get(key, fallback)` |
| `setItem(key, value)` | `set(key, value, { ttl })` |
| `removeItem(key)` | `remove(key)` |
| `clear()` (the whole origin) | `clear()` (only its namespace) |

Without a `namespace`, StorageService reads and writes the same keys as LocalStorageManager, so a move does not lose what users had.

## Best practices
:::tip
- Always give a `namespace`: other code on the origin (an analytics script, another app on the same domain) uses storage too.
- Keep values small and few. Storage is synchronous: a large value read on every route change is felt.
- Read with a `fallback`: the first visit, another device, or a cleared browser has nothing.
:::

## Pitfalls
:::warning
Storage is not private: any script on the page can read it. Do not keep long-lived tokens or personal data there.
:::

:::warning
`watch()` reports changes made **through StorageService** in this page, and any change in other tabs. A `localStorage.setItem` written directly in this same tab is not seen until something reads the key again.
:::