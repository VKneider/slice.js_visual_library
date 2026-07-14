import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('ThreeGalaxy (cosmic particle scene)', () => {

   test('mounts with a canvas element', async ({ mount }) => {
      const c = await mount('ThreeGalaxy');
      const canvas = c.locator('.tgx-canvas canvas');
      await expect(canvas).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('shows bottom overlay with star count and instructions', async ({ mount }) => {
      const c = await mount('ThreeGalaxy');
      const overlay = c.locator('.tgx-overlay');
      await expect(overlay).toContainText('4000 stars');
      await expect(overlay).toContainText('click burst');
      expect(c.pageErrors()).toEqual([]);
   });

   test('control buttons are present with correct labels', async ({ mount }) => {
      const c = await mount('ThreeGalaxy');
      await expect(c.locator('.tgx-rotate-btn')).toContainText('Rotate');
      await expect(c.locator('.tgx-theme-btn')).toContainText('Cosmic');
      await expect(c.locator('.tgx-burst-btn')).toContainText('Burst');
      expect(c.pageErrors()).toEqual([]);
   });

   test('rotate button toggles state', async ({ mount }) => {
      const c = await mount('ThreeGalaxy');
      const btn = c.locator('.tgx-rotate-btn');
      await expect(btn).toHaveAttribute('data-rotating', 'true');
      await btn.click();
      await expect(btn).toHaveAttribute('data-rotating', 'false');
      await expect(btn).toContainText('Paused');
      await btn.click();
      await expect(btn).toHaveAttribute('data-rotating', 'true');
      await expect(btn).toContainText('Rotate');
      expect(c.pageErrors()).toEqual([]);
   });

   test('theme button cycles through themes', async ({ mount }) => {
      const c = await mount('ThreeGalaxy');
      const btn = c.locator('.tgx-theme-btn');
      const themes = ['Cosmic', 'Fire', 'Ice', 'Neon'];
      for (const theme of themes) {
         await expect(btn).toContainText(theme);
         await btn.click();
      }
      // After 4 clicks should be back to Cosmic
      await expect(btn).toContainText('Cosmic');
      expect(c.pageErrors()).toEqual([]);
   });

   test('zoom display shows initial zoom level', async ({ mount }) => {
      const c = await mount('ThreeGalaxy');
      const zoom = c.locator('.tgx-zoom-display');
      await expect(zoom).toContainText('×');
      expect(c.pageErrors()).toEqual([]);
   });

   test('canvas has dimensions after mount', async ({ mount }) => {
      const c = await mount('ThreeGalaxy');
      const canvas = c.locator('.tgx-canvas canvas');
      await expect(canvas).toHaveAttribute('width', /^\d+$/);
      await expect(canvas).toHaveAttribute('height', /^\d+$/);
      expect(c.pageErrors()).toEqual([]);
   });

});
