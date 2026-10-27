export default class IndexedDbManagerDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Offline notes","expected":"a title field, a tags field and an Add button, a tag filter, and a list of notes newest first with their tags; adding a note puts it on top; typing a tag in the filter shows only notes with that tag; Delete removes a note; reloading the page keeps the notes","kind":"script","content":"const db = await slice.build('IndexedDbManager', {\n  singleton: true,\n  sliceId: 'docsNotesDb',\n  databaseName: 'slice-docs-notes',\n  stores: { notes: { indexes: { byUpdated: 'updatedAt', byTag: { keyPath: 'tags', multiEntry: true } } } }\n});\nconst notes = db.store('notes');\n\nconst list = await slice.build('DataList', {\n  itemKey: 'id',\n  title: 'title',\n  description: (n) => new Date(n.updatedAt).toLocaleString(),\n  tags: (n) => n.tags,\n  actions: [{ label: 'Delete', icon: 'trash-bin', inline: true, danger: true, onClick: async ({ item }) => { await notes.delete(item.id); refresh(); } }]\n});\n\nconst filter = await slice.build('Input', { label: 'Only tag', size: 'sm', clearable: true, onChange: () => refresh() });\nconst refresh = async () => {\n  const tag = filter.value.trim().toLowerCase();\n  list.items = tag\n    ? await notes.query({ index: 'byTag', equals: tag })\n    : await notes.query({ index: 'byUpdated', direction: 'prev', limit: 50 });\n};\n\nconst title = await slice.build('Input', { label: 'Title', size: 'sm' });\nconst tags = await slice.build('Input', { label: 'Tags (comma separated)', size: 'sm' });\nconst add = await slice.build('Button', {\n  value: 'Add', size: 'sm',\n  onClick: async () => {\n    if (!title.value.trim()) return;\n    await notes.add({\n      title: title.value.trim(),\n      tags: tags.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),\n      updatedAt: Date.now()\n    });\n    title.value = '';\n    tags.value = '';\n    refresh();\n  }\n});\nif (!(await notes.count())) {\n  await db.transaction('notes', 'readwrite', async (store) => {\n    await store.add({ title: 'Plan the release', tags: ['work'], updatedAt: Date.now() - 3600_000 });\n    await store.add({ title: 'Buy paint for the shop', tags: ['home', 'shop'], updatedAt: Date.now() - 60_000 });\n  });\n}\nrefresh();\n\nconst form = document.createElement('div');\nform.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end';\nform.append(title, tags, add);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:620px';\nbox.append(form, filter, list);\nreturn box;"}];
  }

  async init() {
    this.markdownPath = "indexed-db-manager.md";
    this.markdownContent = "---\ntitle: IndexedDbManager\nroute: /docs/services/indexed-db-manager\nnavLabel: IndexedDbManager\nsection: Services\ngroup: Storage\norder: 20\ndescription: A database in the browser. Several stores with indexes, created and upgraded for you; one shared connection; queries by index and range; transactions that keep all or nothing; and another tab's upgrade handled without blocking.\ncomponent: IndexedDbManagerDocumentation\ngenerate: true\ntags: [service, indexeddb, database, offline, storage, index, query, transaction, upgrade]\n---\n\n# IndexedDbManager\n\n## Overview\n`IndexedDbManager` is a database in the browser: many records, found by index, kept between visits. Declare the stores and indexes you need; it creates them, opens **one** connection shared by every call, and turns IndexedDB's events into promises.\n\n```js\nconst db = await slice.build('IndexedDbManager', {\n  singleton: true,\n  sliceId: 'db',\n  databaseName: 'my-app',\n  stores: {\n    notes: { indexes: { byUpdated: 'updatedAt', byTag: { keyPath: 'tags', multiEntry: true } } },\n    settings: { keyPath: 'key' },\n  },\n});\n\nconst id = await db.store('notes').add({ title: 'Ideas', tags: ['work'], updatedAt: Date.now() });\nconst recent = await db.store('notes').query({ index: 'byUpdated', direction: 'prev', limit: 20 });\n```\n\n### When to use it\n- Many records, or large ones: an offline copy of a list, attachments, a history.\n- Records you look up by something other than their key (by date, by tag, by status).\n- Changes to several records that must happen together.\n\n### When not to use it\n- A few small values (a theme, a draft): [StorageService](/docs/services/storage-service) is synchronous and simpler.\n- State the components share while the app runs: `slice.context`.\n- A copy of server data that only needs to live while the page is open: [QueryService](/docs/services/query-service).\n\n## Build it\n| Prop | Type | Description |\n| --- | --- | --- |\n| `databaseName` | `string` | The database. Required. |\n| `stores` | `object \\| string[]` | The stores and their indexes (below). `['notes', 'tags']` is the short form. |\n| `version` | `number` | Optional. Without it, the manager adds the stores and indexes you declare later by itself. With it, you decide when the database changes (and `upgrade` runs). |\n| `upgrade` | `(db, oldVersion, newVersion, tx) => void` | Optional. Runs when the version goes up, after the declared stores and indexes exist: move or reshape data here. |\n| `storeName` | `string` | The default store for the shortcuts (`db.get(…)`). By default, the first declared one. |\n\nA store:\n\n```js\nstores: {\n  notes: {\n    keyPath: 'id',          // default 'id'; null for keys you pass yourself\n    autoIncrement: true,    // default true when keyPath is the default 'id'\n    indexes: {\n      byUpdated: 'updatedAt',                                   // short form: the keyPath\n      byEmail: { keyPath: 'email', unique: true },\n      byTag: { keyPath: 'tags', multiEntry: true },              // one entry per tag in the array\n      byOwnerAndDate: { keyPath: ['ownerId', 'updatedAt'] },     // compound\n    },\n  },\n}\n```\n\n### Adding a store or an index later\nAdd it to `stores` and deploy. Without `version`, the manager sees it is missing, raises the version by one, and creates it; the data already there stays. With `version`, raise it yourself; until you do, opening fails with an error that says what is missing.\n\n## Methods\n\n### A store\n`db.store(name)` gives a store whose calls each run in their own transaction:\n\n| Method | Returns | Description |\n| --- | --- | --- |\n| `get(key)` | `Promise<value \\| undefined>` | One record. |\n| `getAll(query?, count?)` | `Promise<value[]>` | All, or those in a key range. |\n| `getAllKeys(query?, count?)` | `Promise<key[]>` | Only the keys. |\n| `count(query?)` | `Promise<number>` | How many. |\n| `add(value, key?)` | `Promise<key>` | Inserts; fails if the key exists. |\n| `put(value, key?)` | `Promise<key>` | Inserts or replaces. |\n| `delete(keyOrRange)` | `Promise<void>` | Removes. |\n| `clear()` | `Promise<void>` | Empties the store. |\n| `query(options)` | `Promise<value[]>` | Records in key or index order (below). |\n\nThe service has the same methods for its default store: `db.get(1)` is `db.store(db.storeName).get(1)`.\n\n### query\n| Option | Description |\n| --- | --- |\n| `index` | The index to walk; without it, the store's keys. |\n| `equals` | Only this value. |\n| `from`, `to` | A range (inclusive); `excludeFrom`, `excludeTo` make an end exclusive. |\n| `direction` | `'next'` (ascending, default) or `'prev'` (descending). |\n| `filter(value)` | Keeps only the records it returns true for. |\n| `offset`, `limit` | Skip and take, after the filter. |\n\n```js\n// The 20 most recent, then the next 20.\nnotes.query({ index: 'byUpdated', direction: 'prev', limit: 20 });\nnotes.query({ index: 'byUpdated', direction: 'prev', offset: 20, limit: 20 });\n// Tagged \"work\", updated this week.\nnotes.query({ index: 'byTag', equals: 'work', filter: (n) => n.updatedAt > weekAgo });\n// A compound index: one owner's notes between two dates.\nnotes.query({ index: 'byOwnerAndDate', from: [ownerId, start], to: [ownerId, end] });\n```\n\n### transaction\n```js\nawait db.transaction(['notes', 'trash'], 'readwrite', async ({ notes, trash }) => {\n  const note = await notes.get(id);\n  await trash.put({ ...note, deletedAt: Date.now() });\n  await notes.delete(id);\n});\n```\n`fn` receives the store (one name) or `{ name: store }` (an array). If it throws, **nothing** it did is kept. Inside, await only these stores' calls: waiting for a `fetch` or a timer lets the browser close the transaction.\n\n### The connection\n| Method | Description |\n| --- | --- |\n| `open()` | The open database. Every call opens it on first use, so you rarely need this. |\n| `close()` | Closes it; the next call opens again. Also done when the service is destroyed. |\n| `deleteDatabase()` | Deletes the whole database (a sign-out, a reset). |\n\nWhen another tab opens the same database with a newer version, this connection closes itself so that tab can upgrade, and opens again on its next call.\n\n## Examples\n\n### Notes that stay offline\nNotes are kept in the browser: reload the page and they are still here. The list is a query on an index (newest first), and the tag field filters with a `multiEntry` index.\n\n:::script label=\"Offline notes\" expected=\"a title field, a tags field and an Add button, a tag filter, and a list of notes newest first with their tags; adding a note puts it on top; typing a tag in the filter shows only notes with that tag; Delete removes a note; reloading the page keeps the notes\"\nconst db = await slice.build('IndexedDbManager', {\n  singleton: true,\n  sliceId: 'docsNotesDb',\n  databaseName: 'slice-docs-notes',\n  stores: { notes: { indexes: { byUpdated: 'updatedAt', byTag: { keyPath: 'tags', multiEntry: true } } } }\n});\nconst notes = db.store('notes');\n\nconst list = await slice.build('DataList', {\n  itemKey: 'id',\n  title: 'title',\n  description: (n) => new Date(n.updatedAt).toLocaleString(),\n  tags: (n) => n.tags,\n  actions: [{ label: 'Delete', icon: 'trash-bin', inline: true, danger: true, onClick: async ({ item }) => { await notes.delete(item.id); refresh(); } }]\n});\n\nconst filter = await slice.build('Input', { label: 'Only tag', size: 'sm', clearable: true, onChange: () => refresh() });\nconst refresh = async () => {\n  const tag = filter.value.trim().toLowerCase();\n  list.items = tag\n    ? await notes.query({ index: 'byTag', equals: tag })\n    : await notes.query({ index: 'byUpdated', direction: 'prev', limit: 50 });\n};\n\nconst title = await slice.build('Input', { label: 'Title', size: 'sm' });\nconst tags = await slice.build('Input', { label: 'Tags (comma separated)', size: 'sm' });\nconst add = await slice.build('Button', {\n  value: 'Add', size: 'sm',\n  onClick: async () => {\n    if (!title.value.trim()) return;\n    await notes.add({\n      title: title.value.trim(),\n      tags: tags.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),\n      updatedAt: Date.now()\n    });\n    title.value = '';\n    tags.value = '';\n    refresh();\n  }\n});\nif (!(await notes.count())) {\n  await db.transaction('notes', 'readwrite', async (store) => {\n    await store.add({ title: 'Plan the release', tags: ['work'], updatedAt: Date.now() - 3600_000 });\n    await store.add({ title: 'Buy paint for the shop', tags: ['home', 'shop'], updatedAt: Date.now() - 60_000 });\n  });\n}\nrefresh();\n\nconst form = document.createElement('div');\nform.style.cssText = 'display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end';\nform.append(title, tags, add);\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:620px';\nbox.append(form, filter, list);\nreturn box;\n:::\n\n### Moving data when the shape changes\nVersion 2 splits `name` into `firstName` and `lastName`. `upgrade` runs once per browser, inside the upgrade transaction.\n\n```js\nconst db = await slice.build('IndexedDbManager', {\n  singleton: true,\n  sliceId: 'db',\n  databaseName: 'crm',\n  version: 2,\n  stores: { contacts: { indexes: { byLastName: 'lastName' } } },\n  upgrade(database, oldVersion, newVersion, tx) {\n    if (oldVersion < 2) {\n      const contacts = tx.objectStore('contacts');\n      contacts.openCursor().onsuccess = (event) => {\n        const cursor = event.target.result;\n        if (!cursor) return;\n        const [firstName, ...rest] = (cursor.value.name || '').split(' ');\n        cursor.update({ ...cursor.value, firstName, lastName: rest.join(' ') });\n        cursor.continue();\n      };\n    }\n  },\n});\n```\n\n### An offline copy of server data\nKeep what QueryService got, so the next visit shows it before the server answers.\n\n```js\n// stores: { orders: { keyPath: 'key' } }\nconst saved = await db.store('orders').get('open');\nconst orders = queries.query(['orders', 'open'], async ({ signal }) => {\n  const fresh = await http.get('/orders', { query: { status: 'open' }, signal });\n  await db.store('orders').put({ key: 'open', items: fresh, savedAt: Date.now() });\n  return fresh;\n}, { initialData: saved?.items });\n\norders.refresh();   // the saved copy shows at once; the server's answer replaces it\n```\n\n## From the old API\nThe old methods still work, on the default store, and warn once.\n\n| Before | Now |\n| --- | --- |\n| `{ databaseName, storeName }` | the same, or `stores: { … }` with indexes |\n| `addItem(item)` | `add(item)` / `store(name).add(item)` |\n| `updateItem(item)` | `put(item)` |\n| `getItem(id)` | `get(id)` |\n| `deleteItem(id)` | `delete(id)` |\n| `getAllItems()` | `getAll()` / `query({ … })` |\n| `clearItems()` | `clear()` |\n| `openDatabase()` / `closeDatabase()` | `open()` / `close()` |\n\nTwo instances with different `storeName`s on the same database used to leave the second store uncreated. Now each one adds its store when it is missing.\n\n## Best practices\n:::tip\n- One manager per database, built once (`singleton: true`), with every store declared there.\n- Index what you search by; `filter` walks every record of the range it is given.\n- Keep `version` out until you need `upgrade`: adding stores and indexes works without it.\n:::\n\n## Pitfalls\n:::warning\nInside `transaction`, do not await anything but the stores' own calls. A `fetch` in the middle lets the transaction close, and the next call fails with `TransactionInactiveError`. Fetch first, then write in one transaction.\n:::\n\n:::warning\nOnce you set `version`, never lower it: a browser that already has a higher version refuses to open (`VersionError`).\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const db = await slice.build('IndexedDbManager', {\n  singleton: true,\n  sliceId: 'db',\n  databaseName: 'my-app',\n  stores: {\n    notes: { indexes: { byUpdated: 'updatedAt', byTag: { keyPath: 'tags', multiEntry: true } } },\n    settings: { keyPath: 'key' },\n  },\n});\n\nconst id = await db.store('notes').add({ title: 'Ideas', tags: ['work'], updatedAt: Date.now() });\nconst recent = await db.store('notes').query({ index: 'byUpdated', direction: 'prev', limit: 20 });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| Prop | Type | Description |","| --- | --- | --- |","| `databaseName` | `string` | The database. Required. |","| `stores` | `object \\| string[]` | The stores and their indexes (below). `['notes', 'tags']` is the short form. |","| `version` | `number` | Optional. Without it, the manager adds the stores and indexes you declare later by itself. With it, you decide when the database changes (and `upgrade` runs). |","| `upgrade` | `(db, oldVersion, newVersion, tx) => void` | Optional. Runs when the version goes up, after the declared stores and indexes exist: move or reshape data here. |","| `storeName` | `string` | The default store for the shortcuts (`db.get(…)`). By default, the first declared one. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "stores: {\n  notes: {\n    keyPath: 'id',          // default 'id'; null for keys you pass yourself\n    autoIncrement: true,    // default true when keyPath is the default 'id'\n    indexes: {\n      byUpdated: 'updatedAt',                                   // short form: the keyPath\n      byEmail: { keyPath: 'email', unique: true },\n      byTag: { keyPath: 'tags', multiEntry: true },              // one entry per tag in the array\n      byOwnerAndDate: { keyPath: ['ownerId', 'updatedAt'] },     // compound\n    },\n  },\n}",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| Method | Returns | Description |","| --- | --- | --- |","| `get(key)` | `Promise<value \\| undefined>` | One record. |","| `getAll(query?, count?)` | `Promise<value[]>` | All, or those in a key range. |","| `getAllKeys(query?, count?)` | `Promise<key[]>` | Only the keys. |","| `count(query?)` | `Promise<number>` | How many. |","| `add(value, key?)` | `Promise<key>` | Inserts; fails if the key exists. |","| `put(value, key?)` | `Promise<key>` | Inserts or replaces. |","| `delete(keyOrRange)` | `Promise<void>` | Removes. |","| `clear()` | `Promise<void>` | Empties the store. |","| `query(options)` | `Promise<value[]>` | Records in key or index order (below). |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Option | Description |","| --- | --- |","| `index` | The index to walk; without it, the store's keys. |","| `equals` | Only this value. |","| `from`, `to` | A range (inclusive); `excludeFrom`, `excludeTo` make an end exclusive. |","| `direction` | `'next'` (ascending, default) or `'prev'` (descending). |","| `filter(value)` | Keeps only the records it returns true for. |","| `offset`, `limit` | Skip and take, after the filter. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// The 20 most recent, then the next 20.\nnotes.query({ index: 'byUpdated', direction: 'prev', limit: 20 });\nnotes.query({ index: 'byUpdated', direction: 'prev', offset: 20, limit: 20 });\n// Tagged \"work\", updated this week.\nnotes.query({ index: 'byTag', equals: 'work', filter: (n) => n.updatedAt > weekAgo });\n// A compound index: one owner's notes between two dates.\nnotes.query({ index: 'byOwnerAndDate', from: [ownerId, start], to: [ownerId, end] });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "await db.transaction(['notes', 'trash'], 'readwrite', async ({ notes, trash }) => {\n  const note = await notes.get(id);\n  await trash.put({ ...note, deletedAt: Date.now() });\n  await notes.delete(id);\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const lines = ["| Method | Description |","| --- | --- |","| `open()` | The open database. Every call opens it on first use, so you rarely need this. |","| `close()` | Closes it; the next call opens again. Also done when the service is destroyed. |","| `deleteDatabase()` | Deletes the whole database (a sign-out, a reset). |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const db = await slice.build('IndexedDbManager', {\n  singleton: true,\n  sliceId: 'db',\n  databaseName: 'crm',\n  version: 2,\n  stores: { contacts: { indexes: { byLastName: 'lastName' } } },\n  upgrade(database, oldVersion, newVersion, tx) {\n    if (oldVersion < 2) {\n      const contacts = tx.objectStore('contacts');\n      contacts.openCursor().onsuccess = (event) => {\n        const cursor = event.target.result;\n        if (!cursor) return;\n        const [firstName, ...rest] = (cursor.value.name || '').split(' ');\n        cursor.update({ ...cursor.value, firstName, lastName: rest.join(' ') });\n        cursor.continue();\n      };\n    }\n  },\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// stores: { orders: { keyPath: 'key' } }\nconst saved = await db.store('orders').get('open');\nconst orders = queries.query(['orders', 'open'], async ({ signal }) => {\n  const fresh = await http.get('/orders', { query: { status: 'open' }, signal });\n  await db.store('orders').put({ key: 'open', items: fresh, savedAt: Date.now() });\n  return fresh;\n}, { initialData: saved?.items });\n\norders.refresh();   // the saved copy shows at once; the server's answer replaces it",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-12"]');
         if (container) {
            const lines = ["| Before | Now |","| --- | --- |","| `{ databaseName, storeName }` | the same, or `stores: { … }` with indexes |","| `addItem(item)` | `add(item)` / `store(name).add(item)` |","| `updateItem(item)` | `put(item)` |","| `getItem(id)` | `get(id)` |","| `deleteItem(id)` | `delete(id)` |","| `getAllItems()` | `getAll()` / `query({ … })` |","| `clearItems()` | `clear()` |","| `openDatabase()` / `closeDatabase()` | `open()` / `close()` |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const links = [{"text":"StorageService","path":"/docs/services/storage-service"},{"text":"QueryService","path":"/docs/services/query-service"}];
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

customElements.define('slice-indexeddbmanagerdocumentation', IndexedDbManagerDocumentation);
