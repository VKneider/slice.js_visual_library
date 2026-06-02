import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Grid baseline contract. Derived from Grid.js / Grid.html.
//   - tag: slice-grid, inner .grid-container holds the layout
//   - columns -> grid-template-columns: repeat(N, 1fr) (unless columnTemplate)
//   - rows    -> grid-template-rows: repeat(N, 1fr) (unless rowTemplate)
//   - gap     -> .grid-container style.gap
//   - columnTemplate / rowTemplate -> explicit grid-template-* override
//
// LIMITATION: `items` expects an array of live DOM nodes (setItem requires
// item.classList and appends them). DOM nodes cannot be serialized across the
// page boundary via `mount` props, so item insertion is not exercised here. The
// layout/style contract is fully covered instead.

test.describe('Grid', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Grid');
      // An empty grid (no items) collapses to 0x0, so assert attachment, not
      // visibility — the layout container is what carries the contract.
      await expect(c.component).toBeAttached();
      await expect(c.locator('.grid-container')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('columns reflect to grid-template-columns via repeat', async ({ mount }) => {
      const c = await mount('Grid', { columns: 3 });
      await expect(c.locator('.grid-container')).toHaveCSS(
         'grid-template-columns',
         /(repeat\(3, 1fr\)|(\d+(\.\d+)?px\s+){2}\d+(\.\d+)?px)/
      );
   });

   test('rows reflect to grid-template-rows via repeat', async ({ mount }) => {
      const c = await mount('Grid', { rows: 2, columns: 1 });
      await expect(c.locator('.grid-container')).toHaveCSS(
         'grid-template-rows',
         /(repeat\(2, 1fr\)|(\d+(\.\d+)?px\s+)\d+(\.\d+)?px)/
      );
   });

   test('gap reflects to the container style', async ({ mount }) => {
      const c = await mount('Grid', { gap: '24px' });
      await expect(c.locator('.grid-container')).toHaveCSS('gap', '24px');
   });

   test('columnTemplate overrides grid-template-columns', async ({ mount }) => {
      const c = await mount('Grid', { columns: 2, columnTemplate: '100px 200px' });
      await expect(c.locator('.grid-container')).toHaveCSS(
         'grid-template-columns',
         '100px 200px'
      );
   });

   test('rowTemplate overrides grid-template-rows', async ({ mount }) => {
      const c = await mount('Grid', { rows: 2, rowTemplate: '50px 80px' });
      await expect(c.locator('.grid-container')).toHaveCSS('grid-template-rows', '50px 80px');
   });

   test('visual: 3-column grid @visual', async ({ mount }) => {
      const c = await mount('Grid', { columns: 3, gap: '12px' });
      await expect(c.component).toHaveScreenshot('grid-3col.png');
   });
});
