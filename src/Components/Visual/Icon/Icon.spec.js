import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Icon renders a single <i> glyph whose class encodes the icon family + name:
//   slc-<fil|out><name>   (filled -> "fil", outlined -> "out")
// size/color reflect to inline styles; an unknown `name` logs a console.warn.

test.describe('Icon', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('i')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('name + filled iconStyle produce the slc-fil<name> glyph class', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', iconStyle: 'filled' });
      await expect(c.locator('i')).toHaveClass('slc-filrocket');
   });

   test('outlined iconStyle produces the slc-out<name> glyph class', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', iconStyle: 'outlined' });
      await expect(c.locator('i')).toHaveClass('slc-outrocket');
   });

   test('invalid iconStyle falls back to filled', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', iconStyle: 'not-a-style' });
      await expect(c.locator('i')).toHaveClass('slc-filrocket');
   });

   test('size keyword reflects to the inline font-size', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', size: 'large' });
      await expect(c.locator('i')).toHaveCSS('font-size', '24px');
   });

   test('color reflects to the inline color style', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', color: 'rgb(255, 0, 0)' });
      await expect(c.locator('i')).toHaveCSS('color', 'rgb(255, 0, 0)');
   });

   test('unknown icon name logs a validation warning', async ({ mount }) => {
      const c = await mount('Icon', { name: 'definitely-not-an-icon' });
      expect(c.warnings().some((w) => w.includes('definitely-not-an-icon'))).toBe(true);
   });

   test('visual: filled rocket icon @visual', async ({ mount }) => {
      const c = await mount('Icon', { name: 'rocket', iconStyle: 'filled', size: 'large' });
      await expect(c.component).toHaveScreenshot('icon-rocket-filled.png');
   });
});
