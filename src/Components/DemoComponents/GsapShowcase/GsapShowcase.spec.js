import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Interactive GSAP examples (real npm animation library via a bare import),
// driven by user input in a REAL browser via `slice dev`.

test.describe('GsapShowcase (interactive gsap)', () => {
   test('click bounces the button and counts each bounce', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-bounce');
      await expect(btn).toHaveAttribute('data-bounces', '0');
      await btn.click();
      await expect(btn).toHaveAttribute('data-bounces', '1');
      await btn.click();
      await expect(btn).toHaveAttribute('data-bounces', '2');
      expect(c.pageErrors()).toEqual([]);
   });

   test('hover lifts the card, leaving settles it', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const card = c.locator('.gx-lift');
      await card.hover();
      await expect(card).toHaveAttribute('data-state', 'lifted');
      // Move the pointer away.
      await c.locator('.gx-bounce').hover();
      await expect(card).toHaveAttribute('data-state', 'rest');
   });

   test('timeline plays forward and reverses back', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const toggle = c.locator('.gx-tl-toggle');
      const track = c.locator('.gx-tl-track');

      await toggle.click(); // play
      await expect(toggle).toHaveAttribute('data-playing', 'true');
      await expect(track).toHaveAttribute('data-tl', 'done');

      await toggle.click(); // reverse
      await expect(toggle).toHaveAttribute('data-playing', 'false');
      await expect(track).toHaveAttribute('data-tl', 'start');
   });

   test('the tweened counter animates up to 100', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      await c.locator('.gx-count-btn').click();
      const count = c.locator('.gx-count');
      await expect(count).toHaveAttribute('data-value', '100');
      await expect(count).toHaveText('100');
   });
});
