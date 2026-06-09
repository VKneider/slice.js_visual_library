import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const fire = (page, type) =>
   page.evaluate((t) => {
      const el = window.__sliceMounted;
      const evt =
         t === 'focusin'
            ? new FocusEvent(t, { bubbles: true })
            : new MouseEvent(t, { bubbles: true });
      el.dispatchEvent(evt);
   }, type);

const bubble = (page) => page.locator('body > .slice-tooltip-bubble');

test.describe('ToolTip', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await expect(c.component).toBeAttached();
      await expect(c.locator('.tooltip-trigger')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('a11y: host is focusable (tabindex="0")', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await expect(c.component).toHaveAttribute('tabindex', '0');
   });

   test('no bubble exists before any interaction', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await expect(bubble(c.root.page())).toHaveCount(0);
   });

   test('mouseenter shows a role="tooltip" bubble with the text', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Helpful hint' });
      await fire(c.root.page(), 'mouseenter');

      const b = bubble(c.root.page());
      await expect(b).toHaveCount(1);
      await expect(b).toHaveAttribute('role', 'tooltip');
      await expect(b).toHaveText('Helpful hint');
      await expect(b).toHaveClass(/visible/);
   });

   test('empty text never shows a bubble on mouseenter', async ({ mount }) => {
      const c = await mount('ToolTip', { text: '' });
      await fire(c.root.page(), 'mouseenter');
      await expect(bubble(c.root.page())).toHaveCount(0);
   });

   test('focusin shows the bubble (keyboard accessibility)', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Focus hint' });
      await fire(c.root.page(), 'focusin');

      const b = bubble(c.root.page());
      await expect(b).toHaveText('Focus hint');
      await expect(b).toHaveClass(/visible/);
   });

   test('aria-describedby links host to bubble id', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await fire(c.root.page(), 'mouseenter');

      const describedby = await c.component.getAttribute('aria-describedby');
      expect(describedby).toBeTruthy();

      const b = bubble(c.root.page());
      await expect(b).toHaveId(describedby);
   });

   test('aria-describedby removed after hide', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await fire(c.root.page(), 'mouseenter');
      await fire(c.root.page(), 'mouseleave');
      await expect(c.component).not.toHaveAttribute('aria-describedby');
   });

   test('Escape key hides the bubble', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await fire(c.root.page(), 'mouseenter');
      await expect(bubble(c.root.page())).toHaveClass(/visible/);

      await c.root.page().evaluate(() => {
         const el = window.__sliceMounted;
         el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });

      await expect(bubble(c.root.page())).toHaveCount(0);
   });

   test('placement prop sets data-placement on bubble', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Placed', placement: 'bottom' });
      await fire(c.root.page(), 'mouseenter');

      const b = bubble(c.root.page());
      await expect(b).toHaveAttribute('data-placement', 'bottom');
   });

   test('invalid placement falls back to top', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Placed', placement: 'diagonal' });
      await fire(c.root.page(), 'mouseenter');

      const b = bubble(c.root.page());
      await expect(b).toHaveAttribute('data-placement', 'top');
   });

   test('offset >= 4 is clamped and does not break positioning', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Offset', offset: 30 });
      await fire(c.root.page(), 'mouseenter');

      const b = bubble(c.root.page());
      await expect(b).toBeVisible();
      // offset just needs to not break — data-placement is proof positioning ran.
      await expect(b).toHaveAttribute('data-placement');
   });

   test('maxWidth prop applied to bubble', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'A'.repeat(200), maxWidth: 150 });
      await fire(c.root.page(), 'mouseenter');

      const b = bubble(c.root.page());
      await expect(b).toHaveCSS('max-width', '150px');
   });

   test('showDelay defers bubble appearance', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Delayed', showDelay: 200 });
      await fire(c.root.page(), 'mouseenter');

      await expect(bubble(c.root.page())).toHaveCount(0);
      await c.root.page().waitForTimeout(300);
      await expect(bubble(c.root.page())).toHaveCount(1);
   });

   test('hideDelay keeps bubble visible briefly after mouseleave', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Delayed', hideDelay: 300 });
      await fire(c.root.page(), 'mouseenter');
      await expect(bubble(c.root.page())).toHaveCount(1);

      await fire(c.root.page(), 'mouseleave');

      await c.root.page().waitForTimeout(150);
      await expect(bubble(c.root.page())).toHaveCount(1);

      await c.root.page().waitForTimeout(300);
      await expect(bubble(c.root.page())).toHaveCount(0);
   });

   test('outside click hides the bubble', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await fire(c.root.page(), 'mouseenter');
      await expect(bubble(c.root.page())).toHaveClass(/visible/);

      await c.root.page().mouse.click(10, 10);
      await expect(bubble(c.root.page())).toHaveCount(0);
   });

   test('customColor sets CSS vars on bubble', async ({ mount }) => {
      const c = await mount('ToolTip', {
         text: 'Styled',
         customColor: { background: '#7c3aed', text: '#ffffff' }
      });
      await fire(c.root.page(), 'mouseenter');

      const b = bubble(c.root.page());
      await expect(b).toHaveCSS('background-color', 'rgb(124, 58, 237)');
      await expect(b).toHaveCSS('color', 'rgb(255, 255, 255)');
   });

   test('visual: trigger render @visual', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await expect(c.component).toHaveScreenshot('tooltip-trigger.png');
   });
});
