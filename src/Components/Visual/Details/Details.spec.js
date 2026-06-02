import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Details (disclosure) baseline contract. Derived from Details.js / Details.html.
//   - tag: slice-details
//   - title -> textContent of .details_title
//   - text  -> textContent of .details_text
//   - clicking .details_summary toggles .details_open on .details_container and
//     swaps the .symbol class between `plus` (closed) and `minus` (open)
//
// NOTE: this component has no onToggle handler, no aria-expanded, and no
// deprecated aliases, so those parts of the contract are intentionally absent.

test.describe('Details', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Details', { title: 'More' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.details_summary')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('title reflects to the summary label', async ({ mount }) => {
      const c = await mount('Details', { title: 'Section title' });
      await expect(c.locator('.details_title')).toHaveText('Section title');
   });

   test('text reflects to the details body', async ({ mount }) => {
      const c = await mount('Details', { title: 'T', text: 'Hidden body content' });
      await expect(c.locator('.details_text')).toHaveText('Hidden body content');
   });

   test('starts closed: symbol is plus, container not open', async ({ mount }) => {
      const c = await mount('Details', { title: 'T', text: 'Body' });
      await expect(c.locator('.symbol')).toHaveClass(/plus/);
      await expect(c.locator('.details_container')).not.toHaveClass(/details_open/);
   });

   test('clicking summary opens it: symbol becomes minus, container open', async ({ mount }) => {
      const c = await mount('Details', { title: 'T', text: 'Body' });
      await c.locator('.details_summary').click();
      await expect(c.locator('.details_container')).toHaveClass(/details_open/);
      await expect(c.locator('.symbol')).toHaveClass(/minus/);
   });

   test('clicking summary twice toggles back to closed', async ({ mount }) => {
      const c = await mount('Details', { title: 'T', text: 'Body' });
      const summary = c.locator('.details_summary');
      await summary.click();
      await expect(c.locator('.details_container')).toHaveClass(/details_open/);
      await summary.click();
      await expect(c.locator('.details_container')).not.toHaveClass(/details_open/);
      await expect(c.locator('.symbol')).toHaveClass(/plus/);
   });

   test('visual: closed disclosure @visual', async ({ mount }) => {
      const c = await mount('Details', { title: 'Frequently asked', text: 'Answer body' });
      await expect(c.component).toHaveScreenshot('details-closed.png');
   });
});
