---
title: IndexedDbManager
route: /docs/services/indexed-db-manager
navLabel: IndexedDbManager
section: Services
group: Storage
order: 20
description: A database in the browser. Several stores with indexes, created and upgraded for you; one shared connection; queries by index and range; transactions that keep all or nothing; and another tab's upgrade handled without blocking.
component: IndexedDbManagerDocumentation
generate: true
tags: [service, indexeddb, database, offline, storage, index, query, transaction, upgrade]
---

# IndexedDbManager

## Overview
`IndexedDbManager` is a database in the browser: many records, found by index, kept between visits. Declare the stores and indexes you need; it creates them, opens **one** connection shared by every call, and turns IndexedDB's events into promises.

```js
const db = await slice.build('IndexedDbManager', {
  singleton: true,
  sliceId: 'db',
  databaseName: 'my-app',
  stores: {
    notes: { indexes: { byUpdated: 'updatedAt', byTag: { keyPath: 'tags', multiEntry: true } } },
    settings: { keyPath: 'key' },
  },
});

const id = await db.store('notes').add({ title: 'Ideas', tags: ['work'], updatedAt: Date.now() });
const recent = await db.store('notes').query({ index: 'byUpdated', direction: 'prev', limit: 20 });
```

### When to use it
- Many records, or large ones: an offline copy of a list, attachments, a history.
- Records you look up by something other than their key (by date, by tag, by status).
- Changes to several records that must happen together.

### When not to use it
- A few small values (a theme, a draft): [StorageService](/docs/services/storage-service) is synchronous and simpler.
- State the components share while the app runs: `slice.context`.
- A copy of server data that only needs to live while the page is open: [QueryService](/docs/services/query-service).

## Build it
| Prop | Type | Description |
| --- | --- | --- |
| `databaseName` | `string` | The database. Required. |
| `stores` | `object \| string[]` | The stores and their indexes (below). `['notes', 'tags']` is the short form. |
| `version` | `number` | Optional. Without it, the manager adds the stores and indexes you declare later by itself. With it, you decide when the database changes (and `upgrade` runs). |
| `upgrade` | `(db, oldVersion, newVersion, tx) => void` | Optional. Runs when the version goes up, after the declared stores and indexes exist: move or reshape data here. |
| `storeName` | `string` | The default store for the shortcuts (`db.get(…)`). By default, the first declared one. |

A store:

```js
stores: {
  notes: {
    keyPath: 'id',          // default 'id'; null for keys you pass yourself
    autoIncrement: true,    // default true when keyPath is the default 'id'
    indexes: {
      byUpdated: 'updatedAt',                                   // short form: the keyPath
      byEmail: { keyPath: 'email', unique: true },
      byTag: { keyPath: 'tags', multiEntry: true },              // one entry per tag in the array
      byOwnerAndDate: { keyPath: ['ownerId', 'updatedAt'] },     // compound
    },
  },
}
```

### Adding a store or an index later
Add it to `stores` and deploy. Without `version`, the manager sees it is missing, raises the version by one, and creates it; the data already there stays. With `version`, raise it yourself; until you do, opening fails with an error that says what is missing.

## Methods

### A store
`db.store(name)` gives a store whose calls each run in their own transaction:

| Method | Returns | Description |
| --- | --- | --- |
| `get(key)` | `Promise<value \| undefined>` | One record. |
| `getAll(query?, count?)` | `Promise<value[]>` | All, or those in a key range. |
| `getAllKeys(query?, count?)` | `Promise<key[]>` | Only the keys. |
| `count(query?)` | `Promise<number>` | How many. |
| `add(value, key?)` | `Promise<key>` | Inserts; fails if the key exists. |
| `put(value, key?)` | `Promise<key>` | Inserts or replaces. |
| `delete(keyOrRange)` | `Promise<void>` | Removes. |
| `clear()` | `Promise<void>` | Empties the store. |
| `query(options)` | `Promise<value[]>` | Records in key or index order (below). |

The service has the same methods for its default store: `db.get(1)` is `db.store(db.storeName).get(1)`.

### query
| Option | Description |
| --- | --- |
| `index` | The index to walk; without it, the store's keys. |
| `equals` | Only this value. |
| `from`, `to` | A range (inclusive); `excludeFrom`, `excludeTo` make an end exclusive. |
| `direction` | `'next'` (ascending, default) or `'prev'` (descending). |
| `filter(value)` | Keeps only the records it returns true for. |
| `offset`, `limit` | Skip and take, after the filter. |

```js
// The 20 most recent, then the next 20.
notes.query({ index: 'byUpdated', direction: 'prev', limit: 20 });
notes.query({ index: 'byUpdated', direction: 'prev', offset: 20, limit: 20 });
// Tagged "work", updated this week.
notes.query({ index: 'byTag', equals: 'work', filter: (n) => n.updatedAt > weekAgo });
// A compound index: one owner's notes between two dates.
notes.query({ index: 'byOwnerAndDate', from: [ownerId, start], to: [ownerId, end] });
```

### transaction
```js
await db.transaction(['notes', 'trash'], 'readwrite', async ({ notes, trash }) => {
  const note = await notes.get(id);
  await trash.put({ ...note, deletedAt: Date.now() });
  await notes.delete(id);
});
```
`fn` receives the store (one name) or `{ name: store }` (an array). If it throws, **nothing** it did is kept. Inside, await only these stores' calls: waiting for a `fetch` or a timer lets the browser close the transaction.

### The connection
| Method | Description |
| --- | --- |
| `open()` | The open database. Every call opens it on first use, so you rarely need this. |
| `close()` | Closes it; the next call opens again. Also done when the service is destroyed. |
| `deleteDatabase()` | Deletes the whole database (a sign-out, a reset). |

When another tab opens the same database with a newer version, this connection closes itself so that tab can upgrade, and opens again on its next call.

## Examples

### Notes that stay offline
Notes are kept in the browser: reload the page and they are still here. The list is a query on an index (newest first), and the tag field filters with a `multiEntry` index.

:::script label="Offline notes" expected="a title field, a tags field and an Add button, a tag filter, and a list of notes newest first with their tags; adding a note puts it on top; typing a tag in the filter shows only notes with that tag; Delete removes a note; reloading the page keeps the notes"
const db = await slice.build('IndexedDbManager', {
  singleton: true,
  sliceId: 'docsNotesDb',
  databaseName: 'slice-docs-notes',
  stores: { notes: { indexes: { byUpdated: 'updatedAt', byTag: { keyPath: 'tags', multiEntry: true } } } }
});
const notes = db.store('notes');

const list = await slice.build('DataList', {
  itemKey: 'id',
  title: 'title',
  description: (n) => new Date(n.updatedAt).toLocaleString(),
  tags: (n) => n.tags,
  actions: [{ label: 'Delete', icon: 'trash-bin', inline: true, danger: true, onClick: async ({ item }) => { await notes.delete(item.id); refresh(); } }]
});

const filter = await slice.build('Input', { label: 'Only tag', size: 'sm', clearable: true, onChange: () => refresh() });
const refresh = async () => {
  const tag = filter.value.trim().toLowerCase();
  list.items = tag
    ? await notes.query({ index: 'byTag', equals: tag })
    : await notes.query({ index: 'byUpdated', direction: 'prev', limit: 50 });
};

const title = await slice.build('Input', { label: 'Title', size: 'sm' });
const tags = await slice.build('Input', { label: 'Tags (comma separated)', size: 'sm' });
const add = await slice.build('Button', {
  value: 'Add', size: 'sm',
  onClick: async () => {
    if (!title.value.trim()) return;
    await notes.add({
      title: title.value.trim(),
      tags: tags.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      updatedAt: Date.now()
    });
    title.value = '';
    tags.value = '';
    refresh();
  }
});
if (!(await notes.count())) {
  await db.transaction('notes', 'readwrite', async (store) => {
    await store.add({ title: 'Plan the release', tags: ['work'], updatedAt: Date.now() - 3600_000 });
    await store.add({ title: 'Buy paint for the shop', tags: ['home', 'shop'], updatedAt: Date.now() - 60_000 });
  });
}
refresh();

const form = document.createElement('div');
form.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end';
form.append(title, tags, add);
const box = document.createElement('div');
box.style.cssText = 'display:grid;gap:10px;width:100%;max-width:620px';
box.append(form, filter, list);
return box;
:::

### Moving data when the shape changes
Version 2 splits `name` into `firstName` and `lastName`. `upgrade` runs once per browser, inside the upgrade transaction.

```js
const db = await slice.build('IndexedDbManager', {
  singleton: true,
  sliceId: 'db',
  databaseName: 'crm',
  version: 2,
  stores: { contacts: { indexes: { byLastName: 'lastName' } } },
  upgrade(database, oldVersion, newVersion, tx) {
    if (oldVersion < 2) {
      const contacts = tx.objectStore('contacts');
      contacts.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) return;
        const [firstName, ...rest] = (cursor.value.name || '').split(' ');
        cursor.update({ ...cursor.value, firstName, lastName: rest.join(' ') });
        cursor.continue();
      };
    }
  },
});
```

### An offline copy of server data
Keep what QueryService got, so the next visit shows it before the server answers.

```js
// stores: { orders: { keyPath: 'key' } }
const saved = await db.store('orders').get('open');
const orders = queries.query(['orders', 'open'], async ({ signal }) => {
  const fresh = await http.get('/orders', { query: { status: 'open' }, signal });
  await db.store('orders').put({ key: 'open', items: fresh, savedAt: Date.now() });
  return fresh;
}, { initialData: saved?.items });

orders.refresh();   // the saved copy shows at once; the server's answer replaces it
```

## From the old API
The old methods still work, on the default store, and warn once.

| Before | Now |
| --- | --- |
| `{ databaseName, storeName }` | the same, or `stores: { … }` with indexes |
| `addItem(item)` | `add(item)` / `store(name).add(item)` |
| `updateItem(item)` | `put(item)` |
| `getItem(id)` | `get(id)` |
| `deleteItem(id)` | `delete(id)` |
| `getAllItems()` | `getAll()` / `query({ … })` |
| `clearItems()` | `clear()` |
| `openDatabase()` / `closeDatabase()` | `open()` / `close()` |

Two instances with different `storeName`s on the same database used to leave the second store uncreated. Now each one adds its store when it is missing.

## Best practices
:::tip
- One manager per database, built once (`singleton: true`), with every store declared there.
- Index what you search by; `filter` walks every record of the range it is given.
- Keep `version` out until you need `upgrade`: adding stores and indexes works without it.
:::

## Pitfalls
:::warning
Inside `transaction`, do not await anything but the stores' own calls. A `fetch` in the middle lets the transaction close, and the next call fails with `TransactionInactiveError`. Fetch first, then write in one transaction.
:::

:::warning
Once you set `version`, never lower it: a browser that already has a higher version refuses to open (`VersionError`).
:::