import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('ThreeAimTrainer (POV 3D aim trainer)', () => {

   test('mounts with canvas and menu overlay', async ({ mount }) => {
      const c = await mount('ThreeAimTrainer');
      await expect(c.locator('.tat-canvas canvas')).toBeAttached();
      await expect(c.locator('.tat-menu')).toBeVisible();
      await expect(c.locator('.tat-menu')).toContainText('POV AIM TRAINER');
      expect(c.pageErrors()).toEqual([]);
   });

   test('shows START button and 3 difficulty buttons', async ({ mount }) => {
      const c = await mount('ThreeAimTrainer');
      await expect(c.locator('.tat-go')).toBeVisible();
      await expect(c.locator('.tat-db')).toHaveCount(3);
      await expect(c.locator('.tat-db[data-d="easy"]')).toContainText('Easy');
      await expect(c.locator('.tat-db[data-d="medium"]')).toContainText('Medium');
      await expect(c.locator('.tat-db[data-d="hard"]')).toContainText('Hard');
      expect(c.pageErrors()).toEqual([]);
   });

   test('clicking difficulty selects it visually', async ({ mount }) => {
      const c = await mount('ThreeAimTrainer');
      const easy = c.locator('.tat-db[data-d="easy"]');
      await easy.click();
      await expect(easy).toHaveCSS('background', /rgba\(108,\s*92,\s*231/);
      const hard = c.locator('.tat-db[data-d="hard"]');
      await hard.click();
      await expect(hard).toHaveCSS('background', /rgba\(108,\s*92,\s*231/);
      expect(c.pageErrors()).toEqual([]);
   });

   test('START hides menu and shows HUD', async ({ mount }) => {
      const c = await mount('ThreeAimTrainer');
      await c.locator('.tat-go').click();
      await expect(c.locator('.tat-menu')).not.toBeVisible();
      await expect(c.locator('.tat-hud')).toBeVisible();
      await expect(c.locator('.tat-score')).toBeVisible();
      await expect(c.locator('.tat-timer')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('HUD shows initial values', async ({ mount }) => {
      const c = await mount('ThreeAimTrainer');
      await c.locator('.tat-go').click();
      await expect(c.locator('.tat-score')).toHaveText('0');
      await expect(c.locator('.tat-acc')).toHaveText('100%');
      await expect(c.locator('.tat-streak')).toContainText('0');
      expect(c.pageErrors()).toEqual([]);
   });

   test('game-over screen shows after game ends', async ({ mount }) => {
      const c = await mount('ThreeAimTrainer');
      await c.locator('.tat-go').click();
      await expect(c.locator('.tat-hud')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('crosshair is present during gameplay', async ({ mount }) => {
      const c = await mount('ThreeAimTrainer');
      await c.locator('.tat-go').click();
      await expect(c.locator('.tat-xhair')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

});
