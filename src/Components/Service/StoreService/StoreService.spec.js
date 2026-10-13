import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// StoreService is a stateless facade, so what matters is that it forwards to
// slice.context correctly AND stays idempotent: `ensure` runs from every owning
// service's init(), so a second call must be a no-op, not a reset.

test.describe('StoreService', () => {
   test('smoke: builds without errors', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['StoreService'] });
      const ok = await h.page.evaluate(() => !!window.__sliceServices.StoreService);
      expect(ok).toBe(true);
      expect(h.pageErrors()).toEqual([]);
   });

   test('ensure creates the context, and a second call does not reset it', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['StoreService'] });

      const out = await h.page.evaluate(() => {
         const store = window.__sliceServices.StoreService;
         store.ensure('spec-counter', { count: 0 }, 'spec-counter-key');

         store.set('spec-counter', (prev) => ({ ...prev, count: 41 }));

         // The whole point of `ensure`: a second owning service runs it again on
         // init and must not wipe the state the first one already owns.
         store.ensure('spec-counter', { count: 0 }, 'spec-counter-key');

         return { count: store.get('spec-counter').count, has: store.has('spec-counter') };
      });

      expect(out.has).toBe(true);
      expect(out.count).toBe(41);
      expect(h.pageErrors()).toEqual([]);
   });

   test('set takes an updater over the previous state', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['StoreService'] });

      const out = await h.page.evaluate(() => {
         const store = window.__sliceServices.StoreService;
         store.ensure('spec-list', { items: [] });

         store.set('spec-list', (prev) => ({ items: [...prev.items, 'a'] }));
         store.set('spec-list', (prev) => ({ items: [...prev.items, 'b'] }));

         return store.get('spec-list');
      });

      expect(out).toEqual({ items: ['a', 'b'] });
   });

   test('has() distinguishes a missing context from an empty one', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['StoreService'] });

      const out = await h.page.evaluate(() => {
         const store = window.__sliceServices.StoreService;
         const missing = store.has('never-created');
         store.ensure('spec-empty', {});
         return { missing, empty: store.has('spec-empty') };
      });

      expect(out.missing).toBe(false);
      expect(out.empty).toBe(true);
   });

   test('watch fires on change and unwatches when the component is destroyed', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['StoreService'] });

      const out = await h.page.evaluate(async () => {
         const store = window.__sliceServices.StoreService;
         store.ensure('spec-watched', { n: 0 });

         // A throwaway host stands in for a real component: the watcher is
         // registered WITH it, so destroying the host must clean it up.
         const host = await slice.build('Badge', { sliceId: 'spec-watch-host', label: 'host' });
         window.__fired = 0;
         store.watch('spec-watched', host, () => { window.__fired++; });

         store.set('spec-watched', (prev) => ({ n: prev.n + 1 }));
         const whileAlive = window.__fired;

         slice.controller.destroyComponent('spec-watch-host');
         store.set('spec-watched', (prev) => ({ n: prev.n + 1 }));
         const afterDestroy = window.__fired;

         return { whileAlive, afterDestroy };
      });

      // The watcher fires while its component is alive...
      expect(out.whileAlive).toBeGreaterThan(0);
      // ...and stops firing once the component is gone, which is what makes it
      // safe to never unwatch by hand.
      expect(out.afterDestroy).toBe(out.whileAlive);
      expect(h.pageErrors()).toEqual([]);
   });

   test('a selector narrows a watcher to part of the state', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['StoreService'] });

      const out = await h.page.evaluate(async () => {
         const store = window.__sliceServices.StoreService;
         store.ensure('spec-selective', { name: 'a', unrelated: 0 });

         const host = await slice.build('Badge', { sliceId: 'spec-select-host', label: 'host' });
         window.__nameFired = 0;
         store.watch('spec-selective', host, () => { window.__nameFired++; }, (s) => s.name);

         store.set('spec-selective', (prev) => ({ ...prev, unrelated: prev.unrelated + 1 }));
         const afterUnrelated = window.__nameFired;

         store.set('spec-selective', (prev) => ({ ...prev, name: 'b' }));
         const afterName = window.__nameFired;

         slice.controller.destroyComponent('spec-select-host');
         return { afterUnrelated, afterName };
      });

      expect(out.afterUnrelated).toBe(0);
      expect(out.afterName).toBeGreaterThan(0);
   });
});
