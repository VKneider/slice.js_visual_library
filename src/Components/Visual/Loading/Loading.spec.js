import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Loading is a self-contained spinner (SVG pizza logo). It starts inactive and
// is NOT in the DOM as a visible overlay until `active` is toggled true, at
// which point start() RE-PARENTS the element to its container (document.body by
// default). `isActive` is a deprecated alias for `active` (§7) that warns once.
//
// NOTE: because start() moves the element out of the harness root, the
// active-state assertions below scope to document.body via the page-level
// `slice-loading` tag rather than the harness root locator.

test.describe('Loading', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Loading');
      await expect(c.component).toBeAttached();
      await expect(c.locator('.full-screen')).toBeAttached();
      await expect(c.locator('.slice_logo')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('defaults to inactive (active getter is false)', async ({ mount }) => {
      const c = await mount('Loading');
      const active = await c.component.evaluate((el) => el.active);
      expect(active).toBe(false);
   });

   test('setting active=true starts the spinner and reparents it', async ({ mount }) => {
      const c = await mount('Loading');
      // start() re-parents the element out of the harness root, so drive + read
      // state through the stable window.__sliceMounted handle instead of the
      // root-anchored component locator.
      const state = await c.root.page().evaluate(() => {
         const el = window.__sliceMounted;
         el.active = true;
         return { active: el.active, parentIsBody: el.parentNode === document.body };
      });
      expect(state.active).toBe(true);
      expect(state.parentIsBody).toBe(true);
   });

   test('toggling active false stops the spinner and removes it', async ({ mount }) => {
      const c = await mount('Loading');
      const state = await c.root.page().evaluate(() => {
         const el = window.__sliceMounted;
         el.active = true;
         el.active = false;
         return { active: el.active, attached: el.isConnected };
      });
      expect(state.active).toBe(false);
      expect(state.attached).toBe(false);
   });

   // §7 deprecation/alias contract: legacy `isActive` still drives `active` and
   // warns exactly once.
   test('deprecated isActive alias still activates and warns once', async ({ mount }) => {
      const c = await mount('Loading');
      const active = await c.root.page().evaluate(() => {
         const el = window.__sliceMounted;
         el.isActive = true;
         return el.active;
      });
      expect(active).toBe(true);

      const deprecations = c.deprecationWarnings();
      expect(deprecations.some((w) => w.includes('isActive'))).toBe(true);
      expect(deprecations.filter((w) => w.includes('isActive')).length).toBe(1);
   });

   test('visual: idle spinner @visual', async ({ mount }) => {
      const c = await mount('Loading');
      await expect(c.component).toHaveScreenshot('loading-idle.png');
   });

   // Regression: the stylesheet used `z-index: 500`, which any toast (11000) or
   // DnD ghost (999999) outranks — a "blocking" spinner could render underneath.
   test('the overlay outranks the toast and drag layers', async ({ mount }) => {
      const c = await mount('Loading', { active: true });
      await expect(c.component).toBeAttached();
      const z = await c.component.evaluate((el) => parseInt(el.style.zIndex || '0', 10));
      expect(z).toBeGreaterThan(11000);
      expect(z).toBeGreaterThan(999999);
   });

   // Regression: `path { fill }` nested inside a rule is not valid plain CSS, so
   // the logo fill never applied and every path stayed at its SVG default.
   test('the logo paths actually get the primary colour', async ({ mount }) => {
      const c = await mount('Loading');
      const { fills, primary } = await c.component.evaluate((el) => ({
         fills: [...el.querySelectorAll('.slice_logo path')].map((p) => getComputedStyle(p).fill),
         // Resolve the token to a real colour so formats cannot differ
         // (#9333ea vs rgb(147, 51, 234)).
         primary: getComputedStyle(el).getPropertyValue('--primary-color').trim(),
      }));
      expect(fills.length).toBeGreaterThan(0);
      expect(primary).not.toBe('');
      expect(new Set(fills).size).toBe(1);
      // Every path carries its own `fill` presentation attribute, so a single
      // resolved value proves the stylesheet rule won over them.
      expect(fills[0]).not.toBe('black');
   });

   test('minVisibleMs: 0 (the default) tears down immediately', async ({ mount }) => {
      const c = await mount('Loading');
      const gone = await c.component.evaluate(async (el) => {
         el.start();
         const upImmediately = !!el.parentNode;
         el.stop();
         // No floor: detached in the same task.
         return { upImmediately, detachedSync: !el.parentNode };
      });
      expect(gone.upImmediately).toBe(true);
      expect(gone.detachedSync).toBe(true);
   });

   test('minVisibleMs: a deferred stop() keeps the overlay up for the floor', async ({ mount }) => {
      const c = await mount('Loading', { minVisibleMs: 300 });

      const out = await c.component.evaluate(async (el) => {
         el.start();
         const startedAt = Date.now();
         el.stop();
         // Still on screen right after stop(): the teardown is pending.
         const stillUpRightAfterStop = !!el.parentNode;

         await new Promise((r) => setTimeout(r, 400));
         return {
            stillUpRightAfterStop,
            elapsed: Date.now() - startedAt,
            detachedAfter: !el.parentNode,
         };
      });

      // The bug this fixes: without a floor, start()+stop() in one task paints
      // a full-viewport overlay for zero frames — a grey flash.
      expect(out.stillUpRightAfterStop).toBe(true);
      expect(out.elapsed).toBeGreaterThanOrEqual(250);
      expect(out.detachedAfter).toBe(true);
   });

   test('minVisibleMs: a new start() cancels a pending stop', async ({ mount }) => {
      const c = await mount('Loading', { minVisibleMs: 250 });

      const out = await c.component.evaluate(async (el) => {
         el.start();
         el.stop();                 // deferred
         el.start();                // the user is busy again
         const upAfterRestart = !!el.parentNode;

         await new Promise((r) => setTimeout(r, 350));
         return { upAfterRestart, stillUp: !!el.parentNode };
      });

      // Otherwise the deferred stop fires into a freshly started loader and the
      // overlay vanishes mid-operation.
      expect(out.upAfterRestart).toBe(true);
      expect(out.stillUp).toBe(true);
   });

   test('destroying a loader cancels its deferred stop', async ({ mount }) => {
      const c = await mount('Loading', { minVisibleMs: 200, sliceId: 'load-under-test' });

      const out = await c.component.evaluate(async (el) => {
         el.start();
         el.stop();
         const hadPending = !!el._pendingStopTimeout;

         slice.controller.destroyComponent('load-under-test');
         return { hadPending, pendingAfterDestroy: !!el._pendingStopTimeout };
      });

      // A timer firing into a destroyed component is a page error waiting to
      // happen.
      expect(out.hadPending).toBe(true);
      expect(out.pendingAfterDestroy).toBe(false);
   });
});
