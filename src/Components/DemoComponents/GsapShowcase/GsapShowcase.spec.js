import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('GsapShowcase (interactive gsap)', () => {

   // ── Click interactions ──

   test('bounce button scales and counts', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-bounce');
      await expect(btn).toHaveAttribute('data-bounces', '0');
      await btn.click();
      await expect(btn).toHaveAttribute('data-bounces', '1');
      await btn.click();
      await expect(btn).toHaveAttribute('data-bounces', '2');
      expect(c.pageErrors()).toEqual([]);
   });

   test('shake button oscillates x and resets', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-shake');
      await btn.click();
      // After animation the dataset resets to 'false'
      await expect(btn).toHaveAttribute('data-shook', 'false', { timeout: 3000 });
      expect(c.pageErrors()).toEqual([]);
   });

   test('wobble button rotates and resets', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-wobble');
      await btn.click();
      await expect(btn).toHaveAttribute('data-wobbled', 'false', { timeout: 3000 });
      expect(c.pageErrors()).toEqual([]);
   });

   test('pulse ring creates expanding ring and increments count', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-pulse-btn');
      await btn.click();
      await expect(btn).toHaveAttribute('data-pulses', '1');
      await btn.click();
      await expect(btn).toHaveAttribute('data-pulses', '2');
      expect(c.pageErrors()).toEqual([]);
   });

   // ── Hover / Focus ──

   test('hover lifts the card, leaving settles it', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const card = c.locator('.gx-lift');
      await card.hover();
      await expect(card).toHaveAttribute('data-state', 'lifted');
      await c.locator('.gx-bounce').hover();
      await expect(card).toHaveAttribute('data-state', 'rest');
   });

   test('hover glows the card, leaving returns to normal', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const glow = c.locator('.gx-glow');
      await glow.hover();
      await expect(glow).toHaveAttribute('data-glow', 'on');
      await c.locator('.gx-bounce').hover();
      await expect(glow).toHaveAttribute('data-glow', 'off');
   });

   test('hover on stagger bars animates them', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const group = c.locator('.gx-stagger-hover');
      const bars = c.locator('.gx-sh-bar');
      // Hover in
      await group.hover();
      // Hover out
      await c.locator('.gx-bounce').hover();
      // Bars should have scaleY=1 after settling
      for (let i = 0; i < 3; i++) {
         await expect(bars.nth(i)).toHaveCSS('transform', /matrix\(1,\s*0,\s*0,\s*1/);
      }
   });

   // ── Timelines & Sequencing ──

   test('timeline plays forward and reverses back', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const toggle = c.locator('.gx-tl-toggle');
      const track = c.locator('.gx-tl-track');

      await toggle.click();
      await expect(toggle).toHaveAttribute('data-playing', 'true');
      await expect(track).toHaveAttribute('data-tl', 'done');

      await toggle.click();
      await expect(toggle).toHaveAttribute('data-playing', 'false');
      await expect(track).toHaveAttribute('data-tl', 'start');
   });

   test('keyframes sequence runs through states', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-kf-btn');
      await btn.click();
      await expect(btn).toHaveAttribute('data-kf-state', 'idle', { timeout: 3000 });
      expect(c.pageErrors()).toEqual([]);
   });

   test('chain tweens run sequentially in order', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-chain-btn');
      await btn.click();
      await expect(btn).toHaveAttribute('data-chain', 'ready', { timeout: 3000 });
      expect(c.pageErrors()).toEqual([]);
   });

   test('timeline with labels cycles through stages', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-label-btn');
      const stage = c.locator('.gx-label-stage');

      await btn.click();
      // After timeline completes, stage returns to ⬤
      await expect(stage).toHaveText('⬤', { timeout: 3000 });
      expect(c.pageErrors()).toEqual([]);
   });

   // ── Effects & Visual ──

   test('elastic bounce drops the ball and counts', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-elastic-btn');
      await expect(btn).toHaveAttribute('data-elastic', '0');
      await btn.click();
      await expect(btn).toHaveAttribute('data-elastic', '1');
      await btn.click();
      await expect(btn).toHaveAttribute('data-elastic', '2');
      expect(c.pageErrors()).toEqual([]);
   });

   test('squash & stretch animates and counts', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-squash-btn');
      await expect(btn).toHaveAttribute('data-squashed', '0');
      await btn.click();
      await expect(btn).toHaveAttribute('data-squashed', '1');
      expect(c.pageErrors()).toEqual([]);
   });

   test('spinner toggles on and off', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-spin-btn');
      await btn.click();
      await expect(btn).toHaveAttribute('data-spinning', 'true');
      await expect(btn).toHaveText('Stop');
      await btn.click();
      await expect(btn).toHaveAttribute('data-spinning', 'false');
      await expect(btn).toHaveText('Spin');
   });

   test('3D flip toggles the box content', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-flip-btn');
      const box = c.locator('.gx-flip-box');
      await expect(box).toHaveText('A');
      await btn.click();
      await expect(btn).toHaveAttribute('data-flipped', 'true', { timeout: 2000 });
      // After flipping, text should eventually show B
      await expect(box).toHaveText('B', { timeout: 2000 });
      await btn.click();
      await expect(btn).toHaveAttribute('data-flipped', 'false', { timeout: 2000 });
   });

   test('color shift tweens through 4 colors and counts', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-color-btn');
      await expect(btn).toHaveAttribute('data-color-shifts', '0');
      await btn.click();
      await expect(btn).toHaveAttribute('data-color-shifts', '1');
      expect(c.pageErrors()).toEqual([]);
   });

   test('filter blur toggles on and off', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-blur-btn');
      await btn.click();
      await expect(btn).toHaveAttribute('data-blurred', 'true');
      await btn.click();
      await expect(btn).toHaveAttribute('data-blurred', 'false');
      expect(c.pageErrors()).toEqual([]);
   });

   // ── Stagger & Utilities ──

   test('stagger grid animates cells with from random', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-stag-btn');
      await btn.click();
      await expect(btn).toHaveAttribute('data-stag', 'ready', { timeout: 3000 });
      expect(c.pageErrors()).toEqual([]);
   });

   test('wave stagger animates bars from edges', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const btn = c.locator('.gx-wave-btn');
      await btn.click();
      await expect(btn).toHaveAttribute('data-wave', 'idle', { timeout: 3000 });
      expect(c.pageErrors()).toEqual([]);
   });

   test('counter tweens from 0 to 100', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      await c.locator('.gx-count-btn').click();
      const count = c.locator('.gx-count');
      await expect(count).toHaveAttribute('data-value', '100');
      await expect(count).toHaveText('100');
   });

   test('progress scrub slider controls timeline progress', async ({ mount }) => {
      const c = await mount('GsapShowcase');
      const slider = c.locator('.gx-scrub-slider');
      const pct = c.locator('.gx-scrub-pct');

      // Set slider to 50%
      await slider.fill('0.5');
      await expect(pct).toHaveText('50%');

      // Set slider to 100%
      await slider.fill('1');
      await expect(pct).toHaveText('100%');

      // Back to 0%
      await slider.fill('0');
      await expect(pct).toHaveText('0%');

      expect(c.pageErrors()).toEqual([]);
   });

});
