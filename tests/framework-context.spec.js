import { test, expect } from '@playwright/test';

// E2E validation of the locally-copied framework changes (ContextManager.patch /
// .use / use().bind, and the ThemeManager DOM marker) running in a real browser
// inside a consuming Slice app. Uses throwaway `__t_*` contexts so it never
// touches the app's own state.

test.describe('framework: context.patch / context.use + theme marker', () => {
   test.beforeEach(async ({ page }) => {
      await page.goto('/');
      // Wait for the framework to boot and expose the new API.
      await page.waitForFunction(
         () => !!(window.slice && window.slice.context && typeof window.slice.context.use === 'function'),
         null,
         { timeout: 30_000 }
      );
   });

   test('context.patch merges into state (does not replace)', async ({ page }) => {
      const state = await page.evaluate(() => {
         const c = window.slice.context;
         const name = '__t_patch';
         if (c.has(name)) c.destroy(name);
         c.create(name, { a: 1, b: 2, c: 3 });
         c.patch(name, { b: 9 });
         return c.getState(name);
      });
      expect(state).toEqual({ a: 1, b: 9, c: 3 });
   });

   test('context.use(name) returns a handle (get / set / patch / has)', async ({ page }) => {
      const out = await page.evaluate(() => {
         const c = window.slice.context;
         const name = '__t_use';
         if (c.has(name)) c.destroy(name);
         c.create(name, { model: 'a' });
         const h = c.use(name);
         const initial = h.get().model;
         h.set({ model: 'b' });        // replace
         h.patch({ theme: 'dark' });   // merge
         return { initial, final: c.getState(name), has: h.has() };
      });
      expect(out.initial).toBe('a');
      expect(out.final).toEqual({ model: 'b', theme: 'dark' });
      expect(out.has).toBe(true);
   });

   test('use(name).bind fires immediately and on every change', async ({ page }) => {
      const calls = await page.evaluate(async () => {
         const c = window.slice.context;
         const name = '__t_bind';
         if (c.has(name)) c.destroy(name);
         c.create(name, { n: 0 });
         const seen = [];
         // Anchor the watch to a REAL registered component so the EventManager
         // delivers updates (a fake { sliceId } is never delivered to).
         const anchor = await window.slice.build('Button', { value: 'e2e' });
         c.use(name).bind(anchor, (s) => seen.push(s.n));
         c.patch(name, { n: 1 });
         c.patch(name, { n: 2 });
         return seen;
      });
      expect(calls).toEqual([0, 1, 2]);
   });

   test('ThemeManager sets data-slice-theme on <html> when a theme is applied', async ({ page }) => {
      // Actively apply whatever themes this app knows about, then read the marker.
      const result = await page.evaluate(async () => {
         const tm = window.slice.stylesManager?.themeManager;
         if (!tm) return { noThemeManager: true };
         const known = [...(tm.themeStyles?.keys?.() ?? [])];
         for (const name of [...known, 'Light', 'Dark', 'LIGHT', 'DARK']) {
            try {
               await window.slice.setTheme(name);
            } catch {
               /* not a loadable theme in this app */
            }
            const attr = document.documentElement.getAttribute('data-slice-theme');
            if (attr) return { attr, current: tm.currentTheme };
         }
         return { current: tm.currentTheme, attr: document.documentElement.getAttribute('data-slice-theme') };
      });

      test.skip(!!result.noThemeManager || !result.current, 'this app applies no theme — marker only set when a theme is active');
      expect(result.attr).toBe(result.current);
   });
});
