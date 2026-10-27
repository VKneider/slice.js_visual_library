import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Each test uses its own database name, deleted at the end, so they never
// see each other's data. `code` runs in the page with `build(props)` and `name`.
const run = (page, code) => page.evaluate(async (src) => {
   const name = `spec-${Math.random().toString(36).slice(2)}`;
   const built = [];
   const build = async (props) => {
      const db = await slice.build('IndexedDbManager', { databaseName: name, ...props });
      built.push(db);
      return db;
   };
   try {
      return await (0, eval)(`(async (build, name) => { ${src} })`)(build, name);
   } finally {
      for (const db of built) slice.controller.destroyComponent(db);
      await new Promise((resolve) => {
         const request = indexedDB.deleteDatabase(name);
         request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
   }
}, code);

test.describe('IndexedDbManager', () => {
   test('declared stores and indexes; add, get, put, count, delete; queries by index, range, direction and limit', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const db = await build({ stores: {
            notes: { indexes: { byUpdated: 'updatedAt', byTag: { keyPath: 'tags', multiEntry: true } } },
            settings: { keyPath: 'key' },
         } });
         const notes = db.store('notes');
         const a = await notes.add({ title: 'A', tags: ['work'], updatedAt: 10 });
         const b = await notes.add({ title: 'B', tags: ['home', 'work'], updatedAt: 30 });
         await notes.add({ title: 'C', tags: ['home'], updatedAt: 20 });
         await notes.put({ id: a, title: 'A2', tags: ['work'], updatedAt: 40 });
         await db.store('settings').put({ key: 'theme', value: 'dark' });
         const titles = (list) => list.map((n) => n.title);
         const result = {
            ids: [a, b],
            one: (await notes.get(a)).title,
            count: await notes.count(),
            newest: titles(await notes.query({ index: 'byUpdated', direction: 'prev', limit: 2 })),
            range: titles(await notes.query({ index: 'byUpdated', from: 15, to: 30 })),
            work: titles(await notes.query({ index: 'byTag', equals: 'work' })),
            page2: titles(await notes.query({ index: 'byUpdated', offset: 1, limit: 1 })),
            filtered: titles(await notes.query({ filter: (n) => n.title.length > 1 })),
            setting: await db.store('settings').get('theme'),
            shortcut: (await db.get(b)).title,     // the default store is the first declared
         };
         await notes.delete(b);
         result.afterDelete = await notes.count();
         return result;
      `);
      expect(out).toEqual({
         ids: [1, 2], one: 'A2', count: 3,
         newest: ['A2', 'B'], range: ['C', 'B'], work: ['A2', 'B'], page2: ['B'], filtered: ['A2'],
         setting: { key: 'theme', value: 'dark' }, shortcut: 'B', afterDelete: 2,
      });
   });

   test('one connection for every call, even concurrent ones', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const original = indexedDB.open.bind(indexedDB);
         let opens = 0;
         indexedDB.open = (...args) => { opens += 1; return original(...args); };
         try {
            const db = await build({ stores: ['items'] });
            const items = db.store('items');
            await Promise.all([items.add({ n: 1 }), items.add({ n: 2 }), items.count(), items.getAll()]);
            await items.add({ n: 3 });
            return { opens, count: await items.count() };
         } finally {
            indexedDB.open = original;
         }
      `);
      expect(out).toEqual({ opens: 1, count: 3 });
   });

   test('a store or index declared later is added without losing data', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const v1 = await build({ stores: ['notes'] });
         await v1.add({ title: 'kept', tag: 'x' });
         slice.controller.destroyComponent(v1);
         // The next release declares an index and a new store.
         const v2 = await build({ stores: { notes: { indexes: { byTag: 'tag' } }, tags: { keyPath: 'name' } } });
         const kept = await v2.store('notes').query({ index: 'byTag', equals: 'x' });
         await v2.store('tags').put({ name: 'x' });
         // A second manager on the same database, with its own store (the old pattern).
         const other = await build({ storeName: 'cache' });
         await other.put({ id: 'k', v: 1 });
         const db = await v2.open();
         return { kept: kept.map((n) => n.title), tags: await v2.store('tags').count(), cache: (await other.get('k')).v,
            version: (await other.open()).version, stores: [...(await other.open()).objectStoreNames].sort() };
      `);
      expect(out.kept).toEqual(['kept']);
      expect(out.tags).toBe(1);
      expect(out.cache).toBe(1);
      expect(out.version).toBe(3);
      expect(out.stores).toEqual(['cache', 'notes', 'tags']);
   });

   test('an explicit version runs upgrade() with the old version; a missing store asks for a higher one', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const v1 = await build({ version: 1, stores: ['contacts'] });
         await v1.add({ name: 'Ana López' });
         slice.controller.destroyComponent(v1);
         const calls = [];
         const v2 = await build({
            version: 2,
            stores: { contacts: { indexes: { byLast: 'lastName' } } },
            upgrade(db, oldVersion, newVersion, tx) {
               calls.push([oldVersion, newVersion]);
               tx.objectStore('contacts').openCursor().onsuccess = (event) => {
                  const cursor = event.target.result;
                  if (!cursor) return;
                  const [firstName, lastName] = cursor.value.name.split(' ');
                  cursor.update({ ...cursor.value, firstName, lastName });
                  cursor.continue();
               };
            },
         });
         const found = await v2.query({ index: 'byLast', equals: 'López' });
         slice.controller.destroyComponent(v2);
         let error = '';
         try { await (await build({ version: 2, stores: ['contacts', 'notes'] })).count(); } catch (e) { error = e.message; }
         return { calls, found: found.map((c) => c.firstName), error };
      `);
      expect(out.calls).toEqual([[1, 2]]);
      expect(out.found).toEqual(['Ana']);
      expect(out.error).toContain('store "notes"');
      expect(out.error).toContain('Raise `version`');
   });

   test('transaction: all or nothing across stores', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const db = await build({ stores: ['notes', 'trash'] });
         const id = await db.store('notes').add({ title: 'Old' });
         await db.transaction(['notes', 'trash'], 'readwrite', async ({ notes, trash }) => {
            const note = await notes.get(id);
            const { id: _key, ...copy } = note;   // a new key in trash (an explicit undefined is not a key)
            await trash.add({ ...copy, from: id });
            await notes.delete(id);
         });
         const moved = [await db.store('notes').count(), await db.store('trash').count()];
         let error = '';
         try {
            await db.transaction(['notes', 'trash'], 'readwrite', async ({ notes, trash }) => {
               await notes.add({ title: 'Half' });
               await trash.clear();
               throw new Error('stop');
            });
         } catch (e) { error = e.message; }
         return { moved, error, after: [await db.store('notes').count(), await db.store('trash').count()] };
      `);
      expect(out).toEqual({ moved: [0, 1], error: 'stop', after: [0, 1] });
   });

   test('another tab upgrading: this connection steps aside and opens again', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const db = await build({ stores: ['items'] });
         await db.add({ n: 1 });
         // "Another tab": a raw connection at a higher version.
         const current = (await db.open()).version;
         await new Promise((resolve, reject) => {
            const request = indexedDB.open(name, current + 1);
            request.onupgradeneeded = () => request.result.createObjectStore('extra');
            request.onsuccess = () => { request.result.close(); resolve(); };
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('blocked'));
         });
         return { count: await db.count(), version: (await db.open()).version };
      `);
      expect(out.count).toBe(1);
      expect(out.version).toBeGreaterThan(1);
   });

   test('the old API still works, on the default store, and warns once', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const warnings = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('deprecated')) warnings.push(log.message); });
         const db = await build({ storeName: 'todos' });
         const id = await db.addItem({ text: 'Write docs', done: false });
         const todo = await db.getItem(id);
         await db.updateItem({ ...todo, done: true });
         const all = await db.getAllItems();
         await db.deleteItem(id);
         const empty = await db.getAllItems();
         await db.addItem({ text: 'x' });
         await db.clearItems();
         slice.logger.offLog?.(listener);
         return { all, empty, cleared: await db.count(), warnings: warnings.length, opened: !!(await db.openDatabase()) };
      `);
      expect(out.all).toEqual([{ id: 1, text: 'Write docs', done: true }]);
      expect(out.empty).toEqual([]);
      expect(out.cleared).toBe(0);
      expect(out.warnings).toBe(1);
      expect(out.opened).toBe(true);
   });
   test('errors from the database reach the caller: a unique index, an existing key; compound indexes, open ends, keys only', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const db = await build({ stores: { users: { indexes: { byEmail: { keyPath: 'email', unique: true }, byTeamAndAge: ['team', 'age'] } } } });
         const users = db.store('users');
         await users.add({ email: 'ana@x.com', team: 'a', age: 30 });
         await users.add({ email: 'luis@x.com', team: 'a', age: 41 });
         await users.add({ email: 'maria@x.com', team: 'b', age: 35 });
         const errors = [];
         try { await users.add({ email: 'ana@x.com', team: 'c', age: 1 }); } catch (e) { errors.push(e.name); }
         try { await users.add({ id: 1, email: 'other@x.com' }); } catch (e) { errors.push(e.name); }
         const names = (list) => list.map((u) => u.email.split('@')[0]);
         return {
            errors,
            count: await users.count(),
            teamA: names(await users.query({ index: 'byTeamAndAge', from: ['a', 0], to: ['a', 200] })),
            teamAOver30: names(await users.query({ index: 'byTeamAndAge', from: ['a', 30], to: ['a', 200], excludeFrom: true })),
            keys: await users.getAllKeys(),
            cleared: await users.clear().then(() => users.count()),
         };
      `);
      expect(out).toEqual({
         errors: ['ConstraintError', 'ConstraintError'], count: 3,
         teamA: ['ana', 'luis'], teamAOver30: ['luis'], keys: [1, 2, 3], cleared: 0,
      });
   });

   test('close() and deleteDatabase(): the next call opens again (empty after a delete)', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         const db = await build({ stores: ['items'] });
         await db.add({ n: 1 });
         db.close();
         const afterClose = await db.count();
         await db.deleteDatabase();
         const afterDelete = await db.count();
         await db.add({ n: 2 });
         return { afterClose, afterDelete, all: (await db.getAll()).map((i) => i.n) };
      `);
      expect(out).toEqual({ afterClose: 1, afterDelete: 0, all: [2] });
   });

   test('without a databaseName it says so; an upgrade() that throws leaves the database as it was', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, `
         let noName = '';
         const nameless = await slice.build('IndexedDbManager', { stores: ['x'] });
         try { await nameless.count(); } catch (e) { noName = e.message; }
         slice.controller.destroyComponent(nameless);

         const v1 = await build({ version: 1, stores: ['items'] });
         await v1.add({ n: 1 });
         slice.controller.destroyComponent(v1);
         let failed = '';
         const broken = await build({ version: 2, stores: ['items', 'extra'], upgrade() { throw new Error('migration failed'); } });
         try { await broken.count(); } catch (e) { failed = e.message; }
         slice.controller.destroyComponent(broken);
         const again = await build({ version: 1, stores: ['items'] });
         const db = await again.open();
         return { noName, failed, version: db.version, stores: [...db.objectStoreNames], count: await again.count() };
      `);
      expect(out.noName).toContain('databaseName');
      expect(out.failed).toBe('migration failed');
      expect(out).toMatchObject({ version: 1, stores: ['items'], count: 1 });
   });
});