import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// NotFound is a static, prop-less 404 view.

test.describe('NotFound', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('NotFound');
      await expect(c.component).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('mounts as the slice-notfound custom element', async ({ mount }) => {
      const c = await mount('NotFound');
      const tag = await c.component.evaluate((el) => el.tagName.toLowerCase());
      expect(tag).toBe('slice-notfound');
   });

   test('renders the 404 heading', async ({ mount }) => {
      const c = await mount('NotFound');
      await expect(c.locator('.error-code')).toHaveText('404');
   });

   test('renders the subtitle', async ({ mount }) => {
      const c = await mount('NotFound');
      await expect(c.locator('.error-subtitle')).toHaveText('Page Not Found');
   });

   test('renders the descriptive message', async ({ mount }) => {
      const c = await mount('NotFound');
      await expect(c.locator('.message')).toHaveText("The page you are looking for doesn't exist or has been moved.");
   });

   test('has main landmark and labelledby association', async ({ mount }) => {
      const c = await mount('NotFound');
      const mainEl = c.locator('[role="main"]');
      await expect(mainEl).toHaveAttribute('aria-labelledby', 'notfound-title');
      await expect(c.locator('#notfound-title')).toBeAttached();
   });

   test('renders the home button', async ({ mount }) => {
      const c = await mount('NotFound');
      await expect(c.locator('.home-btn')).toBeVisible();
      await expect(c.locator('.home-btn')).toHaveText('Go Home');
   });

   test('home button navigates to / on click', async ({ mount }) => {
      const c = await mount('NotFound');
      await c.locator('.home-btn').click();
      const path = await c.component.evaluate(() => window.location.pathname);
      expect(path).toBe('/');
   });

   test('init() sets the page title to the 404 message', async ({ mount }) => {
      const c = await mount('NotFound');
      await expect(async () => {
         const title = await c.component.evaluate(() => document.title);
         expect(title).toBe('404 - Not Found');
      }).toPass();
   });

   test('visual: 404 view @visual', async ({ mount }) => {
      const c = await mount('NotFound');
      await expect(c.component).toHaveScreenshot('notfound.png');
   });
});
