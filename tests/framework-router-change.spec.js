import { test, expect } from '@playwright/test';

// E2E validation of the locally-copied framework change (Router §3): when
// `router:change` fires, slice.router.activeRoute must already reflect the
// navigated route. Before the fix the event was observable ~10ms before
// handleRoute() assigned activeRoute, so a listener reading activeRoute saw the
// previous route. Runs against the REAL Slice runtime in a real browser.
//
// Requires the local framework to be copied into node_modules/slicejs-web-framework
// (same "locally-copied framework" precondition as framework-context.spec.js).

test.describe('framework: router:change emits after activeRoute is updated (§3)', () => {
   test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(
         () => !!(window.slice
            && window.slice.router && typeof window.slice.router.navigate === 'function'
            && window.slice.events && typeof window.slice.events.subscribeOnce === 'function'),
         null,
         { timeout: 30_000 }
      );
   });

   test('activeRoute reflects the new route the instant router:change fires', async ({ page }) => {
      const r = await page.evaluate(() => new Promise((resolve) => {
         const target = '/playground';
         const timer = setTimeout(() => resolve({ timedOut: true }), 15_000);
         slice.events.subscribeOnce('router:change', ({ to, from }) => {
            clearTimeout(timer);
            resolve({
               toPath: to?.path,
               activeRoutePath: slice.router.activeRoute?.path,
               urlPath: window.location.pathname,
               hasFrom: !!from,
            });
         });
         slice.router.navigate(target);
      }));

      expect(r.timedOut).toBeUndefined();          // the event actually fired
      expect(r.toPath).toBe('/playground');        // payload carries the resolved route
      expect(r.hasFrom).toBe(true);                // { to, from } payload shape
      expect(r.urlPath).toBe(r.toPath);            // URL is current when it fires
      expect(r.activeRoutePath).toBe(r.toPath);    // §3: activeRoute is current too (the fix)
   });
});
