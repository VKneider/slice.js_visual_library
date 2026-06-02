import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ToolTip wraps slotted trigger content in `.tooltip-trigger` (a <slot>). On
// hover/focus/click (when `text` is non-empty) it appends a
// `.slice-tooltip-bubble[role="tooltip"]` to document.body — OUTSIDE the harness
// root — so the bubble is queried with a page-level locator (c.root.page()).
//
// LIMITATION: mount() passes only props, never slotted children, and the host is
// `display:inline` with an empty <slot>, so the element has a zero-size box and
// Playwright treats it as "not visible". We therefore (a) assert the trigger is
// ATTACHED rather than visible, and (b) drive show/hide by dispatching the real
// DOM events the component listens for (mouseenter/focusin) via page.evaluate,
// which does not require an actionable/visible target. This exercises the same
// code path as a user hover/focus.
const fire = (page, type) =>
   page.evaluate((t) => {
      const el = window.__sliceMounted;
      const evt =
         t === 'focusin'
            ? new FocusEvent(t, { bubbles: true })
            : new MouseEvent(t, { bubbles: true });
      el.dispatchEvent(evt);
   }, type);

test.describe('ToolTip', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      // Host is display:inline + empty slot => zero box; assert attached, not visible.
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
      const bubble = c.root.page().locator('body > .slice-tooltip-bubble');
      await expect(bubble).toHaveCount(0);
   });

   test('mouseenter shows a role="tooltip" bubble with the text', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Helpful hint' });
      await fire(c.root.page(), 'mouseenter');

      const bubble = c.root.page().locator('body > .slice-tooltip-bubble');
      await expect(bubble).toHaveCount(1);
      await expect(bubble).toHaveAttribute('role', 'tooltip');
      await expect(bubble).toHaveText('Helpful hint');
      await expect(bubble).toHaveClass(/visible/);
   });

   test('empty text never shows a bubble on mouseenter', async ({ mount }) => {
      const c = await mount('ToolTip', { text: '' });
      await fire(c.root.page(), 'mouseenter');
      const bubble = c.root.page().locator('body > .slice-tooltip-bubble');
      await expect(bubble).toHaveCount(0);
   });

   test('focusin shows the bubble (keyboard accessibility)', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Focus hint' });
      await fire(c.root.page(), 'focusin');

      const bubble = c.root.page().locator('body > .slice-tooltip-bubble');
      await expect(bubble).toHaveText('Focus hint');
      await expect(bubble).toHaveClass(/visible/);
   });

   test('visual: trigger render @visual', async ({ mount }) => {
      const c = await mount('ToolTip', { text: 'Hint' });
      await expect(c.component).toHaveScreenshot('tooltip-trigger.png');
   });
});
