import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// App is the shell behind every `/docs*` route: it builds the persistent
// Navbar (outside the router) and then the inner MultiRoute. The one thing worth
// pinning here is reachability — a route declared in routes.js but absent from
// this navbar is served fine and discoverable from nowhere, which is exactly
// how `/theme-creator` shipped.
//
// `mount()` mounts into the chrome-free /__test harness, so these tests drive
// the real route instead.

test.describe('App shell', () => {
   test('the site navbar links to the top-level Theme Creator route', async ({ page }) => {
      await page.goto('/');
      await page.waitForFunction(() => !!window.slice?.router, null, { timeout: 30_000 });
      await expect(page.locator('slice-app .app-navbar slice-nav-bar')).toBeVisible();

      const items = await page
         .locator('slice-app .app-navbar slice-nav-bar .nav_bar_menu')
         .evaluateAll((nodes) =>
            nodes.flatMap((node) => Array.from(node.querySelectorAll('a')).map((a) => a.getAttribute('href')))
         );

      expect(items).toContain('/theme-creator');
      expect(items).toContain('/docs');
   });

   test('/theme-creator resolves to the ThemeCreator page, not a 404', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto('/theme-creator');
      await page.waitForFunction(() => !!window.slice?.router, null, { timeout: 30_000 });

      await expect(page.locator('slice-theme-creator')).toBeVisible();
      await expect(page.locator('slice-theme-creator .theme-creator__title')).toHaveText('Theme Creator');
      expect(errors).toEqual([]);
   });
});