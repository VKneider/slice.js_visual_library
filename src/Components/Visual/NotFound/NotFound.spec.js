import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// NotFound is a static, prop-less 404 view. It has no observable public props;
// its one observable behaviour is the document.title side effect set in init().
// NOTE: this component ships only a NotFound.js (no .html/.css template), so
// assertions stay at the element + side-effect level rather than internal DOM.

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

   test('init() sets the page title to the 404 message', async ({ mount }) => {
      const c = await mount('NotFound');
      // init() runs during build; the side effect is on document.title.
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
