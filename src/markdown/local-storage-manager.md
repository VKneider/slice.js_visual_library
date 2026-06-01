---
title: LocalStorageManager
route: /docs/services/local-storage-manager
navLabel: LocalStorageManager
section: Services
group: Storage
order: 10
description: Service wrapper over window.localStorage with automatic JSON serialization.
component: LocalStorageManagerDocumentation
generate: true
tags: [service, storage, localstorage]
---

# LocalStorageManager

## Overview
`LocalStorageManager` is a **Service** component: a plain logic class (no DOM, no template)
that wraps `window.localStorage` and serializes values to/from JSON automatically. Every
method is wrapped in a `try/catch` so a failure never throws — it returns `null` or `false`.

Build it like any service, with a `sliceId`:

```javascript title="Build the service"
const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });
```

## Methods

| Method | Returns | Description |
| --- | --- | --- |
| `getItem(key)` | parsed value, or `null` | Reads a key and `JSON.parse`s it. Returns `null` if missing or on parse error. |
| `setItem(key, value)` | `boolean` | `JSON.stringify`s `value` and stores it. Returns `false` if storage fails (e.g. quota). |
| `removeItem(key)` | `boolean` | Removes a single key. |
| `clear()` | `boolean` | Clears the entire `localStorage` for the origin. |

## Usage

```javascript title="Store and read structured data"
const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });

store.setItem('user', { id: 7, name: 'Ada', roles: ['admin'] });

const user = store.getItem('user');
// -> { id: 7, name: 'Ada', roles: ['admin'] }

store.removeItem('user');
```

```javascript title="Persist UI preferences"
const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });

const theme = store.getItem('theme') || 'LIGHT';
slice.setTheme(theme);

// later, when the user toggles:
store.setItem('theme', 'DARK');
```

## Best Practices
:::tip
Values are JSON-serialized, so plain objects and arrays round-trip cleanly. Always provide a
fallback when reading (`store.getItem('key') ?? defaultValue`) since `getItem` returns `null`
for both "missing" and "unparseable".
:::

## Pitfalls
:::warning
Only JSON-serializable values survive the round-trip — `Date`, `Map`, `Set`, and functions do
not. `localStorage` is synchronous and origin-scoped; for larger or structured datasets prefer
[`IndexedDbManager`](/docs/services/indexed-db-manager).
:::
