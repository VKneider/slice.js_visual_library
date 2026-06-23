import { test, expect } from '@playwright/test';

// E2E validation of the locally-copied framework changes running in a real
// browser inside a consuming Slice app:
//   - typed event registry (register / namespaces / undeclared drift)
//   - emitter tracing (bind attribution, runtime aggregation)
//   - static event graph (loadGraph + staticEmittersOf/staticListenersOf)
//   - dev-mode leak detector (findOrphans criteria) + LeakInspector panel
//   - Events debugger Registry tab (grouped by namespace)
// All use throwaway `e2e:*` / `doc:*` events so they never touch app state.

test.describe('framework: event registry + tracing + leak detector', () => {
   test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(
         () => !!(window.slice && window.slice.events && typeof window.slice.events.register === 'function'),
         null,
         { timeout: 30_000 }
      );
   });

   test('register() declares events; undeclared usage is tracked as drift', async ({ page }) => {
      const r = await page.evaluate(() => {
         const e = window.slice.events;
         e.register('e2e', { ping: { payload: { n: 'number' } } });
         e.emit('e2e:ping', { n: 1 });
         e.emit('e2e:ghost'); // undeclared
         return {
            declared: e.isDeclared('e2e:ping'),
            ghostDeclared: e.isDeclared('e2e:ghost'),
            drift: Array.from(e.undeclared),
            ns: e.namespaceOf('e2e:ping'),
            noNs: e.namespaceOf('plain'),
         };
      });
      expect(r.declared).toBe(true);
      expect(r.ghostDeclared).toBe(false);
      expect(r.drift).toContain('e2e:ghost');
      expect(r.ns).toBe('e2e');
      expect(r.noNs).toBeNull();
   });

   test('register(namespace, catalog) prefixes keys', async ({ page }) => {
      const has = await page.evaluate(() => {
         const e = window.slice.events;
         e.register('user', { login: { payload: { id: 'number' } }, logout: { payload: null } });
         return { login: e.isDeclared('user:login'), logout: e.isDeclared('user:logout') };
      });
      expect(has.login).toBe(true);
      expect(has.logout).toBe(true);
   });

   test('emitter tracing attributes a bound emit to its component', async ({ page }) => {
      const em = await page.evaluate(async () => {
         const e = window.slice.events;
         e.startRecording();
         const comp = await window.slice.build('Button', { value: 'tracer' });
         e.bind(comp).emit('e2e:fromComp', { v: 1 });
         e.bind(comp).emit('e2e:fromComp', { v: 2 });
         const bucket = Array.from(e.emitters.get('e2e:fromComp')?.values() || []);
         window.slice.controller.destroyComponent(comp);
         return bucket;
      });
      expect(em.length).toBe(1);
      expect(em[0].name).toBe('Button');
      expect(em[0].sliceId).toBeTruthy();
      expect(em[0].count).toBe(2);
   });

   test('static graph: loadGraph exposes emitters/listeners (documentation layer)', async ({ page }) => {
      const sg = await page.evaluate(() => {
         const e = window.slice.events;
         e.loadGraph({
            events: {
               'doc:sample': {
                  payload: null,
                  emitters: [{ file: 'src/A.js', line: 3, component: 'A' }],
                  listeners: [{ file: 'src/B.js', line: 7, component: 'B' }],
               },
            },
            dynamic: { emitters: [], listeners: [] },
         });
         return {
            emitters: e.staticEmittersOf('doc:sample'),
            listeners: e.staticListenersOf('doc:sample'),
            none: e.staticEmittersOf('nope:nope'),
         };
      });
      expect(sg.emitters[0].component).toBe('A');
      expect(sg.listeners[0].component).toBe('B');
      expect(sg.none).toEqual([]);
   });

   test('leak detector flags a built-then-detached component (not destroyed)', async ({ page }) => {
      const leak = await page.evaluate(async () => {
         const built = await window.slice.build('Button', { value: 'leaky' });
         document.body.appendChild(built); // connected
         const orphanWhileConnected = window.slice.controller
            .findOrphans()
            .some((o) => o.sliceId === built.sliceId);

         built.remove(); // detach WITHOUT destroyComponent -> leak
         const orphanAfterDetach = window.slice.controller
            .findOrphans()
            .some((o) => o.sliceId === built.sliceId);

         window.slice.controller.destroyComponent(built); // cleanup
         return { orphanWhileConnected, orphanAfterDetach };
      });
      expect(leak.orphanWhileConnected).toBe(false);
      expect(leak.orphanAfterDetach).toBe(true);
   });

   test('leak detector excludes __sliceCached (Route/MultiRoute) instances', async ({ page }) => {
      const flagged = await page.evaluate(async () => {
         const cached = await window.slice.build('Button', { value: 'cached' });
         cached.__sliceCached = true; // detached but intentionally cached
         const isFlagged = window.slice.controller.findOrphans().some((o) => o.sliceId === cached.sliceId);
         window.slice.controller.destroyComponent(cached);
         return isFlagged;
      });
      expect(flagged).toBe(false);
   });

   test('LeakInspector panel opens and reports the active count', async ({ page }) => {
      const panel = await page.evaluate(async () => {
         const li = window.slice.leakInspector;
         if (!li) return { exists: false };
         // Make the active count deterministic regardless of app mount timing.
         const built = await window.slice.build('Button', { value: 'panel-probe' });
         document.body.appendChild(built);
         li.open();
         const active = li.querySelector('#leak-inspector')?.classList.contains('active');
         const size = li.querySelector('#leak-size')?.textContent;
         const acSize = window.slice.controller.activeComponents.size;
         li.close();
         window.slice.controller.destroyComponent(built);
         return { exists: true, active, size, acSize };
      });
      expect(panel.exists).toBe(true);
      expect(panel.active).toBe(true);
      expect(panel.acSize).toBeGreaterThan(0);
      expect(Number(panel.size)).toBe(panel.acSize);
   });

   test('Events debugger Registry tab lists registered events grouped by namespace', async ({ page }) => {
      const reg = await page.evaluate(() => {
         const d = window.slice.eventsDebugger;
         if (!d) return { exists: false };
         window.slice.events.register('e2e', { hello: { description: 'hi', payload: null } });
         d.open();
         d._selectTab('registry');
         const text = d.querySelector('#events-list')?.textContent || '';
         d.close();
         return { exists: true, hasEvent: text.includes('e2e:hello'), hasGroup: text.toLowerCase().includes('e2e') };
      });
      expect(reg.exists).toBe(true);
      expect(reg.hasEvent).toBe(true);
      expect(reg.hasGroup).toBe(true);
   });
});
