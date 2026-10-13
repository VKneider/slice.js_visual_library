import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('Badge', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Badge', { label: 'New' });
      await expect(c.locator('.slice_badge')).toBeVisible();
      await expect(c.locator('.slice_badge__text')).toHaveText('New');
      expect(c.pageErrors()).toEqual([]);
   });

   test('variant applies its modifier and an unknown one falls back to neutral', async ({ mount }) => {
      const c = await mount('Badge', { label: 'Live', variant: 'success' });
      await expect(c.locator('.slice_badge')).toHaveClass(/slice_badge--success/);

      await c.component.evaluate((el) => { el.variant = 'not-a-variant'; });
      await expect(c.locator('.slice_badge')).toHaveClass(/slice_badge--neutral/);
      await expect(c.locator('.slice_badge')).not.toHaveClass(/slice_badge--success/);
   });

   test('a variant change never leaves a stale modifier class', async ({ mount }) => {
      const c = await mount('Badge', { label: 'X', variant: 'danger' });
      const cls = await c.locator('.slice_badge').getAttribute('class');
      expect(cls.match(/slice_badge--(neutral|accent|success|warning|danger|info)/g)).toHaveLength(1);
   });

   test('each variant paints from its theme token', async ({ mount }) => {
      const c = await mount('Badge', { label: '3', variant: 'danger' });
      const tokens = await c.component.evaluate((el) => {
         const badge = el.querySelector('.slice_badge');
         const probe = document.createElement('span');
         document.body.appendChild(probe);
         probe.style.color = 'var(--danger-color)';
         const danger = getComputedStyle(probe).color;
         probe.style.color = 'var(--danger-contrast)';
         const contrast = getComputedStyle(probe).color;
         probe.remove();
         const cs = getComputedStyle(badge);
         return { bg: cs.backgroundColor, fg: cs.color, danger, contrast };
      });
      expect(tokens.bg).toBe(tokens.danger);
      expect(tokens.fg).toBe(tokens.contrast);
   });

   test('value wins over label and is capped by max', async ({ mount }) => {
      const c = await mount('Badge', { label: 'ignored', value: 7 });
      await expect(c.locator('.slice_badge__text')).toHaveText('7');

      await c.component.evaluate((el) => { el.value = 1200; });
      await expect(c.locator('.slice_badge__text')).toHaveText('99+');

      await c.component.evaluate((el) => { el.max = 500; });
      await expect(c.locator('.slice_badge__text')).toHaveText('500+');
   });

   test('an empty badge hides itself', async ({ mount }) => {
      const c = await mount('Badge', { label: '' });
      await expect(c.locator('.slice_badge')).toBeHidden();
   });

   test('dot renders a circle with an accessible name but no text', async ({ mount }) => {
      const c = await mount('Badge', { dot: true, label: 'Unread messages' });
      const badge = c.locator('.slice_badge');
      await expect(badge).toHaveClass(/slice_badge--dot/);
      await expect(c.locator('.slice_badge__text')).toBeHidden();
      // Nothing is painted, so the name has to come from aria-label.
      await expect(badge).toHaveAttribute('aria-label', 'Unread messages');
   });

   test('size switches the modifier', async ({ mount }) => {
      const c = await mount('Badge', { label: '1', size: 'sm' });
      await expect(c.locator('.slice_badge')).toHaveClass(/slice_badge--sm/);
   });

   test('visual: badge row @visual', async ({ mount }) => {
      const c = await mount('Badge', { label: 'New', variant: 'accent' });
      await expect(c.component).toHaveScreenshot('badge-accent.png');
   });
});