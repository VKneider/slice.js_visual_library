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
});
