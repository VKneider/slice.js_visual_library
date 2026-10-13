import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Grid contract. Derived from Grid.js / Grid.html.
//   - tag: slice-grid, inner .grid-container holds the layout
//   - columns -> grid-template-columns: repeat(N, 1fr) (unless columnTemplate)
//   - rows    -> grid-template-rows: repeat(N, 1fr) (unless rowTemplate)
//   - gap     -> .grid-container style.gap
//   - columnTemplate / rowTemplate -> explicit grid-template-* override
//   - items   -> live DOM nodes, REPLACED (not appended) on every assignment
//
// `items` holds live DOM nodes, which cannot cross the `mount` prop boundary,
// so the item specs drive them from inside the page. That is also why the old
// append-only behaviour went unnoticed: nothing here ever set items twice.

test.describe('Grid', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Grid');
      // An empty grid (no items) collapses to 0x0, so assert attachment, not
      // visibility — the layout container is what carries the contract.
      await expect(c.component).toBeAttached();
      await expect(c.locator('.grid-container')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('columns reflect to grid-template-columns via repeat', async ({ mount }) => {
      const c = await mount('Grid', { columns: 3 });
      await expect(c.locator('.grid-container')).toHaveCSS(
         'grid-template-columns',
         /(repeat\(3, 1fr\)|(\d+(\.\d+)?px\s+){2}\d+(\.\d+)?px)/
      );
   });

   test('rows reflect to grid-template-rows via repeat', async ({ mount }) => {
      const c = await mount('Grid', { rows: 2, columns: 1 });
      await expect(c.locator('.grid-container')).toHaveCSS(
         'grid-template-rows',
         /(repeat\(2, 1fr\)|(\d+(\.\d+)?px\s+)\d+(\.\d+)?px)/
      );
   });

   test('gap reflects to the container style', async ({ mount }) => {
      const c = await mount('Grid', { gap: '24px' });
      await expect(c.locator('.grid-container')).toHaveCSS('gap', '24px');
   });

   test('columnTemplate overrides grid-template-columns', async ({ mount }) => {
      const c = await mount('Grid', { columns: 2, columnTemplate: '100px 200px' });
      await expect(c.locator('.grid-container')).toHaveCSS('grid-template-columns', '100px 200px');
   });

   test('rowTemplate overrides grid-template-rows', async ({ mount }) => {
      const c = await mount('Grid', { rows: 2, rowTemplate: '50px 80px' });
      await expect(c.locator('.grid-container')).toHaveCSS('grid-template-rows', '50px 80px');
   });

   // ------------------------------------------------------------------- items

   test('setting items twice replaces rather than appends', async ({ mount }) => {
      const c = await mount('Grid', { columns: 2 });

      const out = await c.component.evaluate((el) => {
         const make = (t) => {
            const d = document.createElement('div');
            d.textContent = t;
            return d;
         };
         el.items = [make('a'), make('b')];
         const afterFirst = el.querySelector('.grid-container').children.length;

         el.items = [make('c')];
         const afterSecond = el.querySelector('.grid-container').children.length;
         const text = [...el.querySelector('.grid-container').children].map((n) => n.textContent);

         return { afterFirst, afterSecond, text };
      });

      // The bug: both calls appended, so the second render showed a, b AND c.
      expect(out.afterFirst).toBe(2);
      expect(out.afterSecond).toBe(1);
      expect(out.text).toEqual(['c']);
   });

   test('a node still present is MOVED, keeping its identity and state', async ({ mount }) => {
      const c = await mount('Grid');

      const out = await c.component.evaluate((el) => {
         const make = (t) => {
            const d = document.createElement('div');
            d.textContent = t;
            return d;
         };
         const a = make('a');
         const b = make('b');
         const first = make('first');

         el.items = [a, b];
         a.__marker = 'state-a';

         el.items = [first, a, b];        // same nodes, new order
         const container = el.querySelector('.grid-container');

         return {
            order: [...container.children].map((n) => n.textContent),
            // Identity preserved: moved, not re-created.
            sameA: container.children[1] === a,
            marker: a.__marker,
            count: container.children.length,
         };
      });

      expect(out.order).toEqual(['first', 'a', 'b']);
      expect(out.sameA).toBe(true);
      expect(out.marker).toBe('state-a');
      expect(out.count).toBe(3);
   });

   test('a Slice child that leaves the list is DESTROYED, not just detached', async ({ mount }) => {
      const c = await mount('Grid');

      const out = await c.component.evaluate(async (el) => {
         const badge = await slice.build('Badge', { sliceId: 'grid-badge', label: 'hi' });
         const plain = document.createElement('div');
         plain.textContent = 'plain';

         el.items = [badge, plain];
         const registeredBefore = slice.controller.activeComponents.has('grid-badge');

         // The badge leaves the list; the plain node stays.
         el.items = [plain];

         return {
            registeredBefore,
            stillRegistered: slice.controller.activeComponents.has('grid-badge'),
            children: [...el.querySelector('.grid-container').children].map((n) => n.textContent),
         };
      });

      expect(out.registeredBefore).toBe(true);
      // With innerHTML = '' the component would stay in the registry for the
      // life of the page.
      expect(out.stillRegistered).toBe(false);
      expect(out.children).toEqual(['plain']);
      expect(c.pageErrors()).toEqual([]);
   });

   test('destroying the grid destroys the Slice children it holds', async ({ mount }) => {
      const c = await mount('Grid', { sliceId: 'grid-under-test' });

      const out = await c.component.evaluate(async (el) => {
         const badge = await slice.build('Badge', { sliceId: 'grid-badge-2', label: 'hi' });
         el.items = [badge];
         const before = slice.controller.activeComponents.has('grid-badge-2');

         slice.controller.destroyComponent('grid-under-test');
         return { before, after: slice.controller.activeComponents.has('grid-badge-2') };
      });

      expect(out.before).toBe(true);
      expect(out.after).toBe(false);
   });

   test('clear() empties the grid and destroys its components', async ({ mount }) => {
      const c = await mount('Grid');

      const out = await c.component.evaluate(async (el) => {
         const badge = await slice.build('Badge', { sliceId: 'grid-badge-3', label: 'hi' });
         el.items = [badge];
         el.clear();
         return {
            children: el.querySelector('.grid-container').children.length,
            registered: slice.controller.activeComponents.has('grid-badge-3'),
            items: el.items.length,
         };
      });

      expect(out.children).toBe(0);
      expect(out.registered).toBe(false);
      expect(out.items).toBe(0);
   });

   test('setItem still appends, for incremental use', async ({ mount }) => {
      const c = await mount('Grid');

      const out = await c.component.evaluate(async (el) => {
         const a = document.createElement('div');
         a.textContent = 'a';
         const b = document.createElement('div');
         b.textContent = 'b';
         await el.setItem(a);
         await el.setItem(b);
         return [...el.querySelector('.grid-container').children].map((n) => n.textContent);
      });

      expect(out).toEqual(['a', 'b']);
   });

   test('a non-node entry is skipped, not fatal', async ({ mount }) => {
      const c = await mount('Grid');

      const out = await c.component.evaluate((el) => {
         const good = document.createElement('div');
         good.textContent = 'good';
         el.items = [null, good, 'not-a-node'];
         return [...el.querySelector('.grid-container').children].map((n) => n.textContent);
      });

      expect(out).toEqual(['good']);
   });

   test('visual: 3-column grid @visual', async ({ mount }) => {
      const c = await mount('Grid', { columns: 3, gap: '12px' });
      await expect(c.component).toHaveScreenshot('grid-3col.png');
   });
});
