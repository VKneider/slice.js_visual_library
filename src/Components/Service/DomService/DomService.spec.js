import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// DomService.reconcile() is the canonical way to render a variable-length list
// of child components. The thing it exists to prevent is a leak: `innerHTML = ''`
// wipes nodes without running beforeDestroy, and re-creating a node re-runs its
// constructor. These tests watch activeComponents, not just the DOM.

test.describe('DomService — reconcile', () => {
   test('creates one child per item, in order', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
         await dom.reconcile(list, items, {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.id, variant: 'accent' }),
         });
         return {
            count: list.children.length,
            order: [...list.children].map((el) => el.getAttribute('slice-id')),
            text: [...list.children].map((el) => el.textContent.trim()),
         };
      });

      expect(out.count).toBe(3);
      expect(out.order).toEqual(['chip-a', 'chip-b', 'chip-c']);
      expect(out.text).toEqual(['a', 'b', 'c']);
      expect(h.pageErrors()).toEqual([]);
   });

   test('an item that survives is refreshed in place, not rebuilt', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const opts = {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.label }),
         };
         await dom.reconcile(list, [{ id: 'a', label: 'first' }], opts);

         // Keep a reference so we can prove the SAME node is reused.
         const before = list.firstElementChild;
         before.__marker = 'original';

         await dom.reconcile(list, [{ id: 'a', label: 'second' }], opts);
         const after = list.firstElementChild;
         return {
            sameNode: before === after,
            markerSurvived: after.__marker === 'original',
            text: after.textContent.trim(),
         };
      });

      expect(out.sameNode).toBe(true);
      expect(out.markerSurvived).toBe(true);   // no re-creation, so no constructor re-run
      expect(out.text).toBe('second');         // props were refreshed
   });

   test('a removed item is DESTROYED, not just detached', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const opts = {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.id }),
         };
         await dom.reconcile(list, [{ id: 'a' }, { id: 'b' }, { id: 'c' }], opts);
         const registeredBefore = window.slice.controller.activeComponents?.size ?? null;

         await dom.reconcile(list, [{ id: 'a' }, { id: 'c' }], opts);
         const registeredAfter = window.slice.controller.activeComponents?.size ?? null;
         return {
            ids: [...list.children].map((el) => el.getAttribute('slice-id')),
            registeredBefore,
            registeredAfter,
            // The destroyed node must be gone from the DOM too.
            staleInDom: !!document.querySelector('[slice-id="chip-b"]'),
         };
      });

      expect(out.ids).toEqual(['chip-a', 'chip-c']);
      expect(out.staleInDom).toBe(false);
      if (out.registeredBefore != null && out.registeredAfter != null) {
         expect(out.registeredAfter).toBe(out.registeredBefore - 1);
      }
      expect(h.pageErrors()).toEqual([]);
   });

   test('reordering moves nodes without recreating them', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const opts = {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.id }),
         };
         const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
         await dom.reconcile(list, rows, opts);
         const before = [...list.children];
         before.forEach((el) => { el.__marker = el.getAttribute('slice-id'); });

         await dom.reconcile(list, [{ id: 'c' }, { id: 'a' }, { id: 'b' }], opts);
         return {
            order: [...list.children].map((el) => el.getAttribute('slice-id')),
            allMarkersIntact: [...list.children].every(
               (el) => el.__marker === el.getAttribute('slice-id')
            ),
            nodesPreserved: [...list.children].every(
               (el) => before.includes(el)
            ),
         };
      });

      expect(out.order).toEqual(['chip-c', 'chip-a', 'chip-b']);
      expect(out.allMarkersIntact).toBe(true);
      expect(out.nodesPreserved).toBe(true);   // moved, never re-created
      expect(h.pageErrors()).toEqual([]);
   });

   test('a custom refresh hook replaces the default in-place update', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         window.__refreshed = [];
         const opts = {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.id }),
            // A consumer passes this when props are interdependent or the child
            // builds sub-components asynchronously, so the default
            // slice.setComponentProps order is not what they want.
            refresh: (node, p) => {
               window.__refreshed.push(p.label);
               node.label = p.label;
               return node;
            },
         };

         // First pass: nothing exists yet, so every item is BUILT. The hook is
         // for refreshing, not for creating, so it must not run.
         await dom.reconcile(list, [{ id: 'a' }, { id: 'b' }], opts);
         const afterBuild = { refreshed: [...window.__refreshed], ids: [...list.children].map((e) => e.getAttribute('slice-id')) };

         // Second pass: both nodes already exist, so the hook runs for each.
         await dom.reconcile(list, [{ id: 'a' }, { id: 'b' }], opts);
         return { afterBuild, afterRefresh: [...window.__refreshed] };
      });

      expect(out.afterBuild.refreshed).toEqual([]);
      expect(out.afterBuild.ids).toEqual(['chip-a', 'chip-b']);
      expect(out.afterRefresh).toEqual(['a', 'b']);
      expect(h.pageErrors()).toEqual([]);
   });

   test('destroyChildren tears the container down completely', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         await dom.reconcile(list, [{ id: 'a' }, { id: 'b' }], {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.id }),
         });
         const before = list.children.length;
         dom.destroyChildren(list);
         return { before, after: list.children.length };
      });

      expect(out.before).toBe(2);
      expect(out.after).toBe(0);
      expect(h.pageErrors()).toEqual([]);
   });

   test('a missing container is a loud error, not a silent no-op', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['DomService'] });
      const threw = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         try {
            await dom.reconcile(null, [], { keyOf: () => 'x', component: 'Badge' });
            return false;
         } catch {
            return true;
         }
      });
      expect(threw).toBe(true);
   });

   // ------------------------------------------------------- queueing & adopting

   test('two overlapping reconciles serialize instead of interleaving', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const opts = {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.id }),
         };

         // Fired in the same tick, with no await between them: without the
         // per-container queue both would pass the "does it exist" check and
         // both would try to build the same sliceIds.
         const first = dom.reconcile(list, [{ id: 'a' }, { id: 'b' }], opts);
         const second = dom.reconcile(list, [{ id: 'a' }, { id: 'b' }, { id: 'c' }], opts);

         await Promise.all([first, second]);
         return [...list.children].map((el) => el.getAttribute('slice-id'));
      });

      // The LAST call wins, with no duplicates — only true if they never
      // overlapped.
      expect(out).toEqual(['chip-a', 'chip-b', 'chip-c']);
      expect(h.pageErrors()).toEqual([]);
   });

   test('a rejected render does not poison the queue for the next one', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');

         // A build that throws, e.g. a component name that does not exist.
         // Populate the container first: `refresh` only runs for nodes that
         // already exist — on a first pass the item is built instead.
         await dom.reconcile(list, [{ id: 'a' }], {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: () => ({ label: 'a' }),
         });

         const broken = dom
            .reconcile(list, [{ id: 'a' }], {
               keyOf: (i) => `chip-${i.id}`,
               component: 'Badge',
               props: () => ({ label: 'a' }),
               // A consumer callback that throws — an unknown component name
               // would not do it, since slice.build resolves to null for those.
               refresh: () => { throw new Error('consumer callback exploded'); },
            })
            .then(() => 'resolved', () => 'rejected');

         const after = dom.reconcile(list, [{ id: 'ok' }], {
            keyOf: (i) => `chip-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.id }),
         });

         const [brokenResult] = await Promise.all([broken, after.catch(() => {})]);
         return {
            brokenResult,
            ids: [...list.children].map((el) => el.getAttribute('slice-id')),
         };
      });

      expect(out.brokenResult).toBe('rejected');
      // The follow-up still ran. With a plain `then(run)` it would sit pending
      // behind the rejection forever.
      expect(out.ids).toEqual(['chip-ok']);
   });

   test('adopts a node already in the container instead of rebuilding it', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const opts = { keyOf: (i) => `chip-${i.id}`, component: 'Badge', props: () => ({ label: 'a' }) };

         await dom.reconcile(list, [{ id: 'a' }], opts);

         // Simulate the registry losing track of a live node — the situation the
         // adopt step exists for. Building it again would throw "already
         // registered".
         const node = list.firstElementChild;
         slice.controller.activeComponents.delete(node.sliceId);

         await dom.reconcile(list, [{ id: 'a' }], opts);
         return { sameNode: list.firstElementChild === node, count: list.children.length };
      });

      expect(out.sameNode).toBe(true);
      expect(out.count).toBe(1);
      expect(h.pageErrors()).toEqual([]);
   });

   test('a cold first paint of many rows keeps every row in data order', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });

      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const rows = Array.from({ length: 25 }, (_, n) => ({ id: `r${n}` }));

         await dom.reconcile(list, rows, {
            keyOf: (r) => `chip-${r.id}`,
            component: 'Badge',
            props: (r) => ({ label: r.id }),
         });

         return {
            count: list.children.length,
            order: [...list.children].map((el) => el.getAttribute('slice-id')),
         };
      });

      // The parallel build batch must land in DATA order, not completion order —
      // which is what the slots array is for.
      expect(out.count).toBe(25);
      expect(out.order).toEqual(Array.from({ length: 25 }, (_, n) => `chip-r${n}`));
   });

   // ----------------------------------------------------- equals (opt-in memo)

   test('without equals, every surviving node is refreshed on every render', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });
      const refreshes = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const rows = [{ id: 'a' }, { id: 'b' }];
         let count = 0;
         const opts = {
            keyOf: (i) => `eq-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.id }),
            refresh: (node, p) => { count += 1; slice.setComponentProps(node, p); },
         };
         await dom.reconcile(list, rows, opts);
         await dom.reconcile(list, rows, opts);
         return count;
      });
      expect(refreshes).toBe(2);
   });

   test('equals skips nodes whose data is unchanged and refreshes the rest', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });
      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const refreshed = [];
         const opts = {
            keyOf: (i) => `memo-${i.id}`,
            component: 'Badge',
            props: (i) => ({ label: i.label }),
            equals: Object.is,
            refresh: (node, p) => { refreshed.push(node.sliceId); slice.setComponentProps(node, p); },
         };
         const a = { id: 'a', label: 'A' };
         const b = { id: 'b', label: 'B' };
         await dom.reconcile(list, [a, b], opts);
         // Immutable update: only b gets a new object.
         await dom.reconcile(list, [a, { ...b, label: 'B2' }], opts);
         return { refreshed, text: [...list.children].map((el) => el.textContent.trim()) };
      });
      expect(out.refreshed).toEqual(['memo-b']);
      expect(out.text).toEqual(['A', 'B2']);
   });

   // ------------------------------------------------------------ coalescing

   test('renders queued behind a running one coalesce to the latest', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });
      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const seen = [];
         const opts = {
            keyOf: (i) => `co-${i.id}`,
            component: 'Badge',
            props: (i) => {
               seen.push(i.id);
               return { label: i.id };
            },
         };
         // First starts immediately; the next two arrive while it runs.
         const p1 = dom.reconcile(list, [{ id: 'one' }], opts);
         const p2 = dom.reconcile(list, [{ id: 'two' }], opts);
         const p3 = dom.reconcile(list, [{ id: 'three' }], opts);
         const settled = await Promise.allSettled([p1, p2, p3]);
         return {
            seen,
            statuses: settled.map((r) => r.status),
            ids: [...list.children].map((el) => el.getAttribute('slice-id')),
         };
      });
      // 'two' was superseded before it started, so it never rendered…
      expect(out.seen).toEqual(['one', 'three']);
      // …but its caller still resolved, once the newer state was applied.
      expect(out.statuses).toEqual(['fulfilled', 'fulfilled', 'fulfilled']);
      expect(out.ids).toEqual(['co-three']);
      expect(h.pageErrors()).toEqual([]);
   });

   // -------------------------------------------------------------- adoption

   test('adoption only looks at direct children, never a nested node', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"><div id="nested"></div></div>`, { services: ['DomService'] });
      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const nested = document.getElementById('nested');

         // A node with the same key, one level down, that the registry lost.
         const deep = await slice.build('Badge', { sliceId: 'adopt-x', label: 'deep' });
         nested.appendChild(deep);
         slice.controller.activeComponents.delete('adopt-x');

         await dom.reconcile(list, [{ id: 'x' }], {
            keyOf: (i) => `adopt-${i.id}`,
            component: 'Badge',
            props: () => ({ label: 'top' }),
         });

         return {
            deepStillNested: deep.parentElement === nested,
            topLevel: [...list.children].filter((el) => el.getAttribute('slice-id') === 'adopt-x').length,
         };
      });
      expect(out.deepStillNested).toBe(true);
      expect(out.topLevel).toBe(1);
   });

   // --------------------------------------------------------- minimal moves

   test('reordering moves the fewest nodes possible', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });
      const out = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const opts = { keyOf: (i) => `mv-${i}`, component: 'Badge', props: (i) => ({ label: i }) };
         const base = ['a', 'b', 'c', 'd', 'e', 'f'];
         await dom.reconcile(list, base, opts);

         const countMoves = async (items) => {
            let moves = 0;
            const mo = new MutationObserver((records) => {
               for (const r of records) moves += r.removedNodes.length;
            });
            mo.observe(list, { childList: true });
            await dom.reconcile(list, items, opts);
            await Promise.resolve();
            mo.takeRecords().forEach((r) => { moves += r.removedNodes.length; });
            mo.disconnect();
            return { moves, order: [...list.children].map((el) => el.textContent.trim()).join('') };
         };

         // Rotating the first item to the end is ONE move, not five.
         const rotate = await countMoves(['b', 'c', 'd', 'e', 'f', 'a']);
         // Swapping two neighbours is one move.
         const swap = await countMoves(['b', 'c', 'e', 'd', 'f', 'a']);
         return { rotate, swap };
      });
      expect(out.rotate).toEqual({ moves: 1, order: 'bcdefa' });
      expect(out.swap).toEqual({ moves: 1, order: 'bcedfa' });
   });

   test('a focused node that does not need to move keeps focus', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="list"></div>`, { services: ['DomService'] });
      const kept = await h.page.evaluate(async () => {
         const dom = window.__sliceServices.DomService;
         const list = document.getElementById('list');
         const opts = { keyOf: (i) => `fx-${i}`, component: 'Button', props: (i) => ({ value: i }) };
         await dom.reconcile(list, ['a', 'b', 'c'], opts);
         const button = list.children[1].querySelector('button');
         button.focus();
         // Move 'a' to the end; 'b' is part of the stable run and must not move.
         await dom.reconcile(list, ['b', 'c', 'a'], opts);
         return document.activeElement === button;
      });
      expect(kept).toBe(true);
   });
});