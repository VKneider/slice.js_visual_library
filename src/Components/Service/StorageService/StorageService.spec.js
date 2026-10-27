import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Runs `code` in the page with a StorageService built from `props`, then
// destroys it. Storage is emptied first, so each test starts clean.
const run = (page, props, code) => page.evaluate(async ([p, src]) => {
   localStorage.clear();
   sessionStorage.clear();
   const storage = await slice.build('StorageService', p);
   try {
      return await (0, eval)(`(async (storage) => { ${src} })`)(storage);
   } finally {
      slice.controller.destroyComponent(storage);
   }
}, [props, code]);

test.describe('StorageService', () => {
   test('values come back as they went in; a namespace keeps keys apart; clear() removes only its own', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, { namespace: 'app' }, `
         localStorage.setItem('other-app:theme', '"light"');
         localStorage.setItem('app:plain', 'hello');            // written by other code, not JSON
         storage.set('theme', 'dark');
         storage.set('filters', { status: ['open'], page: 2 });
         storage.set('count', 0);
         const read = [storage.get('theme'), storage.get('filters'), storage.get('count'), storage.get('plain'), storage.get('missing', 'fallback')];
         const raw = localStorage.getItem('app:theme');
         const keys = storage.keys().sort();
         storage.clear();
         return { read, raw, keys, afterClear: storage.keys(), other: localStorage.getItem('other-app:theme') };
      `);
      expect(out.read).toEqual(['dark', { status: ['open'], page: 2 }, 0, 'hello', 'fallback']);
      expect(out.raw).toBe('"dark"');
      expect(out.keys).toEqual(['count', 'filters', 'plain', 'theme']);
      expect(out.afterClear).toEqual([]);
      expect(out.other).toBe('"light"');
   });

   test('ttl: a value is forgotten after its time; change() and set(undefined)', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, { namespace: 'app' }, `
         storage.set('draft', 'Hi', { ttl: 80 });
         const before = [storage.get('draft'), storage.has('draft')];
         await new Promise((r) => setTimeout(r, 120));
         const after = [storage.get('draft', null), storage.has('draft'), localStorage.getItem('app:draft')];
         storage.change('visits', (n) => n + 1, 0);
         storage.change('visits', (n) => n + 1, 0);
         const visits = storage.get('visits');
         storage.set('visits', undefined);
         return { before, after, visits, removed: storage.has('visits') };
      `);
      expect(out).toEqual({ before: ['Hi', true], after: [null, false, null], visits: 2, removed: false });
   });

   test('a full storage returns false and warns instead of throwing', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, { namespace: 'app' }, `
         const warnings = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('full')) warnings.push(log.message); });
         const original = Storage.prototype.setItem;
         Storage.prototype.setItem = function (key, value) {
            if (key.startsWith('app:big')) throw new DOMException('full', 'QuotaExceededError');
            return original.call(this, key, value);
         };
         try {
            return { ok: storage.set('big', 'x'.repeat(10)), kept: storage.has('big'), warnings: warnings.length };
         } finally {
            Storage.prototype.setItem = original;
            slice.logger.offLog?.(listener);
         }
      `);
      expect(out).toEqual({ ok: false, kept: false, warnings: 1 });
   });

   test('watch(): now, on changes from any StorageService in the page and from other tabs; stops with its component', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, { namespace: 'app' }, `
         const other = await slice.build('StorageService', { namespace: 'app' });
         const host = await slice.build('Badge', { label: 'x' });
         const seen = [];
         storage.watch('theme', host, (value) => seen.push(value), 'light');
         other.set('theme', 'dark');                         // another service, same namespace
         // Another tab: the browser fires 'storage' here after it writes.
         localStorage.setItem('app:theme', '"blue"');
         window.dispatchEvent(new StorageEvent('storage', { key: 'app:theme', newValue: '"blue"', storageArea: localStorage }));
         window.dispatchEvent(new StorageEvent('storage', { key: 'other:theme', newValue: '"x"', storageArea: localStorage }));
         slice.controller.destroyComponent(host);
         other.set('theme', 'green');                        // nobody listens any more
         slice.controller.destroyComponent(other);
         return seen;
      `);
      expect(out).toEqual(['light', 'dark', 'blue']);
   });

   test('session area, and memory when the browser refuses storage', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await h.page.evaluate(async () => {
         sessionStorage.clear();
         const session = await slice.build('StorageService', { area: 'session', namespace: 'tab' });
         session.set('step', 3);
         const inSession = sessionStorage.getItem('tab:step');
         slice.controller.destroyComponent(session);

         const warnings = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('does not allow')) warnings.push(log.message); });
         const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
         Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('denied', 'SecurityError'); } });
         try {
            const refused = await slice.build('StorageService', { namespace: 'app' });
            const ok = refused.set('theme', 'dark');
            const value = refused.get('theme');
            refused.get('again');
            slice.controller.destroyComponent(refused);
            return { inSession, ok, value, warnings: warnings.length };
         } finally {
            if (descriptor) Object.defineProperty(window, 'localStorage', descriptor);
            else delete window.localStorage;
            slice.logger.offLog?.(listener);
         }
      });
      expect(out).toEqual({ inSession: '3', ok: true, value: 'dark', warnings: 1 });
   });
   test('expired values are purged when it starts; keys() leaves them out; a value that is not JSON is refused', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await h.page.evaluate(async () => {
         localStorage.clear();
         // Left by an earlier visit: one expired, one still valid.
         localStorage.setItem('app:old', JSON.stringify({ __sliceExpires: Date.now() - 1000, value: 'gone' }));
         localStorage.setItem('app:fresh', JSON.stringify({ __sliceExpires: Date.now() + 60_000, value: 'kept' }));
         const errors = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('not JSON')) errors.push(log.message); });
         const storage = await slice.build('StorageService', { namespace: 'app' });
         try {
            const purged = localStorage.getItem('app:old');
            const keys = storage.keys();
            const cyclic = {}; cyclic.self = cyclic;
            const ok = storage.set('bad', cyclic);
            return { purged, keys, fresh: storage.get('fresh'), ok, stored: localStorage.getItem('app:bad'), errors: errors.length };
         } finally {
            slice.controller.destroyComponent(storage);
            slice.logger.offLog?.(listener);
         }
      });
      expect(out).toEqual({ purged: null, keys: ['fresh'], fresh: 'kept', ok: false, stored: null, errors: 1 });
   });

   test('watch(): the returned function stops it; clear() here or in another tab reaches it; a failing watcher does not stop the rest', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, { namespace: 'app' }, `
         const host = await slice.build('Badge', { label: 'x' });
         const a = [], b = [], stopped = [];
         // Its first call (inside watch()) throws to the caller; later ones are caught.
         let initialError = '';
         try { storage.watch('theme', host, () => { throw new Error('boom'); }); } catch (e) { initialError = e.message; }
         storage.watch('theme', host, (v) => a.push(v), 'light');
         const stop = storage.watch('theme', host, (v) => stopped.push(v));
         stop();
         storage.set('theme', 'dark');
         storage.clear();                                   // here: back to the fallback
         storage.watch('lang', host, (v) => b.push(v), 'es');
         storage.set('lang', 'en');
         localStorage.clear();                              // another tab cleared everything
         window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
         slice.controller.destroyComponent(host);
         return { initialError, a, b, stopped };
      `);
      expect(out).toEqual({ initialError: 'boom', a: ['light', 'dark', 'light', 'light'], b: ['es', 'en', 'es'], stopped: [null] });
   });

   test('without a namespace it shares keys with LocalStorageManager, which still works and warns once', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, {}, `
         const warnings = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('deprecated')) warnings.push(log.message); });
         const legacy = await slice.build('LocalStorageManager', {});
         const legacy2 = await slice.build('LocalStorageManager', {});
         legacy.setItem('theme', { mode: 'dark' });
         const read = storage.get('theme');
         storage.set('lang', 'es');
         const back = legacy2.getItem('lang');
         const removed = legacy.removeItem('lang') && !storage.has('lang');
         slice.controller.destroyComponent(legacy);
         slice.controller.destroyComponent(legacy2);
         slice.logger.offLog?.(listener);
         return { read, back, removed, missing: legacy2.getItem('nothing'), warnings: warnings.length };
      `);
      expect(out).toEqual({ read: { mode: 'dark' }, back: 'es', removed: true, missing: null, warnings: 1 });
   });
});