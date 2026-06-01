---
title: IndexedDbManager
route: /docs/services/indexed-db-manager
navLabel: IndexedDbManager
section: Services
group: Storage
order: 20
description: Async Service wrapper over IndexedDB for a single auto-keyed object store.
component: IndexedDbManagerDocumentation
generate: true
tags: [service, storage, indexeddb]
---

# IndexedDbManager

## Overview
`IndexedDbManager` is a **Service** component: a thin async wrapper over the browser's
IndexedDB. Each instance manages **one object store** inside a database. The store is created
on demand with a `keyPath` of `'id'` and `autoIncrement: true`, so every item gets a numeric
`id` automatically.

Build it with a `databaseName` and `storeName`:

```javascript title="Build the service"
const db = await slice.build('IndexedDbManager', {
  sliceId: 'IndexedDbManager',
  databaseName: 'app-db',
  storeName: 'todos'
});
```

## Methods

| Method | Returns | Description |
| --- | --- | --- |
| `openDatabase()` | `Promise<IDBDatabase>` | Opens (and upgrades/creates the store if needed). Called automatically by the data methods. |
| `closeDatabase()` | `void` | Closes the active connection. |
| `addItem(item)` | `Promise<number>` | Adds an item; resolves with the generated `id`. |
| `updateItem(item)` | `Promise<number>` | Upserts an item by its `id` (the `item` must include `id`). |
| `getItem(id)` | `Promise<object \| undefined>` | Reads one item by `id`. |
| `deleteItem(id)` | `Promise<void>` | Removes one item by `id`. |
| `getAllItems()` | `Promise<object[]>` | Returns every item in the store. |
| `clearItems()` | `Promise<void>` | Empties the store. |

## Usage

```javascript title="CRUD round-trip"
const db = await slice.build('IndexedDbManager', {
  sliceId: 'IndexedDbManager',
  databaseName: 'app-db',
  storeName: 'todos'
});

const id = await db.addItem({ text: 'Write docs', done: false });

const todo = await db.getItem(id);
await db.updateItem({ ...todo, done: true });

const all = await db.getAllItems();
// -> [{ id, text: 'Write docs', done: true }]

await db.deleteItem(id);
```

```javascript title="Reset a store"
const cache = await slice.build('IndexedDbManager', {
  sliceId: 'IndexedDbManager',
  databaseName: 'app-db',
  storeName: 'http-cache'
});

await cache.clearItems();
```

## Best Practices
:::tip
You don't need to call `openDatabase()` yourself — every data method opens the database as
needed. Let `addItem` assign the `id`, and pass the full object (including `id`) to `updateItem`.
:::

## Pitfalls
:::warning
All data methods are asynchronous — always `await` them. `updateItem` and `deleteItem` require a
valid existing `id`. Each instance is bound to a single store; use separate instances (or
`storeName`s) for different collections.
:::
