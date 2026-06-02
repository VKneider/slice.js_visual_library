import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Link renders a single <a> via DOM APIs (no template). Props: { path, classes, text }.
// Click is intercepted (event.preventDefault) and delegated to slice.router.navigate,
// so the anchor href stays in the DOM but no real navigation happens.

test.describe('Link', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Link', { text: 'Home', path: '/home' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('a')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('text reflects to the anchor text content', async ({ mount }) => {
      const c = await mount('Link', { text: 'Documentation', path: '/docs' });
      await expect(c.locator('a')).toHaveText('Documentation');
   });

   test('path reflects to the anchor href and data-route is set', async ({ mount }) => {
      const c = await mount('Link', { text: 'Docs', path: '/docs' });
      await expect(c.locator('a')).toHaveAttribute('href', '/docs');
      await expect(c.locator('a')).toHaveAttribute('data-route', '');
   });

   test('classes prop is applied to the anchor', async ({ mount }) => {
      const c = await mount('Link', { text: 'X', path: '/x', classes: 'item nav-link' });
      await expect(c.locator('a')).toHaveClass('item nav-link');
   });

   test('defaults: missing path falls back to "#" and empty text', async ({ mount }) => {
      const c = await mount('Link');
      await expect(c.locator('a')).toHaveAttribute('href', '#');
      await expect(c.locator('a')).toHaveText('');
   });

   test('click is intercepted (preventDefault) without throwing', async ({ mount }) => {
      const c = await mount('Link', { text: 'Go', path: '/somewhere' });
      // onClick calls event.preventDefault() then slice.router.navigate(path).
      // We assert it does not error and the anchor remains in place.
      await c.locator('a').click();
      await expect(c.locator('a')).toHaveAttribute('href', '/somewhere');
      expect(c.pageErrors()).toEqual([]);
   });

   test('visual: rendered link @visual', async ({ mount }) => {
      const c = await mount('Link', { text: 'Home', path: '/home', classes: 'item' });
      await expect(c.component).toHaveScreenshot('link-default.png');
   });
});
