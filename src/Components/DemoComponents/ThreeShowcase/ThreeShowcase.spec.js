import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('ThreeShowcase (Three.js 3D demos)', () => {

   test('mounts six canvas elements with Three.js scenes', async ({ mount }) => {
      const c = await mount('ThreeShowcase');
      const canvases = c.locator('.tx-canvas-wrap canvas');
      await expect(canvases).toHaveCount(6);
      expect(c.pageErrors()).toEqual([]);
   });

   test('cube card renders with a canvas and "three" label', async ({ mount }) => {
      const c = await mount('ThreeShowcase');
      const canvas = c.locator('.tx-cube canvas');
      await expect(canvas).toBeAttached();
      await expect(c.locator('.tx-cube .tx-status')).toHaveText('three');
      expect(c.pageErrors()).toEqual([]);
   });

   test('sphere card renders with "lights" label', async ({ mount }) => {
      const c = await mount('ThreeShowcase');
      await expect(c.locator('.tx-sphere .tx-ok')).toHaveText('lights');
      expect(c.pageErrors()).toEqual([]);
   });

   test('wireframe toggle button toggles state', async ({ mount }) => {
      const c = await mount('ThreeShowcase');
      const btn = c.locator('.tx-wf-btn');
      await expect(btn).toHaveAttribute('data-wf', 'false');
      await expect(btn).toHaveText('Wireframe: OFF');
      await btn.click();
      await expect(btn).toHaveAttribute('data-wf', 'true');
      await expect(btn).toHaveText('Wireframe: ON');
      await btn.click();
      await expect(btn).toHaveAttribute('data-wf', 'false');
      await expect(btn).toHaveText('Wireframe: OFF');
      expect(c.pageErrors()).toEqual([]);
   });

   test('color change button increments hits count', async ({ mount }) => {
      const c = await mount('ThreeShowcase');
      const btn = c.locator('.tx-color-btn');
      await expect(btn).toHaveAttribute('data-color-hits', '0');
      await btn.click();
      await expect(btn).toHaveAttribute('data-color-hits', '1');
      await btn.click();
      await expect(btn).toHaveAttribute('data-color-hits', '2');
      expect(c.pageErrors()).toEqual([]);
   });

   test('bounce button increments bounce count', async ({ mount }) => {
      const c = await mount('ThreeShowcase');
      const btn = c.locator('.tx-bounce-btn');
      await expect(btn).toHaveAttribute('data-bounces', '0');
      await btn.click();
      await expect(btn).toHaveAttribute('data-bounces', '1');
      await btn.click();
      await expect(btn).toHaveAttribute('data-bounces', '2');
      expect(c.pageErrors()).toEqual([]);
   });

   test('multi-geometry card shows "4 objects" label', async ({ mount }) => {
      const c = await mount('ThreeShowcase');
      await expect(c.locator('.tx-multi .tx-geo-count')).toHaveText('4 objects');
      expect(c.pageErrors()).toEqual([]);
   });

});
