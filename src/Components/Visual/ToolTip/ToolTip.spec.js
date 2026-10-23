import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const bubble = (page) => page.locator('.slice-tooltip-bubble:popover-open');

// A ToolTip around a Button, built in the page (functions and nodes cannot be mount props).
async function withButton(c, props = {}, buttonProps = {}) {
   await c.component.evaluate(async (tip, { props, buttonProps }) => {
      Object.assign(tip, props);
      const button = await slice.build('Button', { value: 'Save', ...buttonProps });
      tip.replaceChildren(button);
   }, { props, buttonProps });
   // Let the MutationObserver settle the tab stop.
   await c.component.evaluate(() => new Promise((r) => setTimeout(r, 30)));
}

test.describe('ToolTip — showing', () => {
   test('smoke: no bubble until asked; hover shows it after the delay', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Saves the draft' });
      await withButton(c);
      expect(c.pageErrors()).toEqual([]);
      await expect(bubble(page)).toHaveCount(0);
      await c.locator('button').hover();
      await page.waitForTimeout(150);
      await expect(bubble(page)).toHaveCount(0);   // still within the 400ms delay
      await expect(bubble(page)).toHaveText('Saves the draft');
      await expect(bubble(page)).toHaveAttribute('role', 'tooltip');
   });

   test('a focusable child keeps the only tab stop and gets aria-describedby', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Saves the draft' });
      await withButton(c);
      await expect(c.component).not.toHaveAttribute('tabindex');
      await page.keyboard.press('Tab');
      await expect(c.locator('button')).toBeFocused();
      await expect(bubble(page)).toBeVisible();   // keyboard focus shows it at once
      const id = await bubble(page).getAttribute('id');
      await expect(c.locator('button')).toHaveAttribute('aria-describedby', id);
      await page.keyboard.press('Tab');
      await expect(bubble(page)).toHaveCount(0);
      await expect(c.locator('button')).not.toHaveAttribute('aria-describedby');
   });

   test('text alone: the ToolTip itself becomes focusable', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Annual percentage rate' });
      await c.component.evaluate((tip) => { tip.textContent = 'APR'; });
      await c.component.evaluate(() => new Promise((r) => setTimeout(r, 30)));
      await expect(c.component).toHaveAttribute('tabindex', '0');
      await page.keyboard.press('Tab');
      await expect(c.component).toBeFocused();
      await expect(bubble(page)).toHaveText('Annual percentage rate');
      await expect(c.component).toHaveAttribute('aria-describedby', /slice-tooltip-/);
   });

   test('a disabled button still explains itself, by hover and by keyboard', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'You need edit rights', showDelay: 0 });
      await withButton(c, {}, { disabled: true });
      await expect(c.component).toHaveAttribute('tabindex', '0');
      await c.component.hover();
      await expect(bubble(page)).toHaveText('You need edit rights');
      // Enabling the button hands the tab stop back to it.
      await c.component.evaluate(async (tip) => { tip.querySelector('slice-button').disabled = false; await new Promise((r) => setTimeout(r, 30)); });
      await expect(c.component).not.toHaveAttribute('tabindex');
   });

   test('clicking the control hides the tooltip instead of toggling it', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Saves', showDelay: 0 });
      await withButton(c);
      await c.locator('button').hover();
      await expect(bubble(page)).toBeVisible();
      await c.locator('button').click();
      await expect(bubble(page)).toHaveCount(0);
   });

   test('the bubble can be hovered without closing (WCAG 1.4.13)', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Hover me too', showDelay: 0, hideDelay: 150, placement: 'bottom' });
      await withButton(c);
      await c.locator('button').hover();
      await expect(bubble(page)).toBeVisible();
      await bubble(page).hover();
      await page.waitForTimeout(300);
      await expect(bubble(page)).toBeVisible();
      await page.mouse.move(5, 5);
      await expect(bubble(page)).toHaveCount(0);
   });

   test('Escape closes it from anywhere, and does not reach a Modal', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Tip', showDelay: 0 });
      await withButton(c);
      await c.locator('button').hover();
      await expect(bubble(page)).toBeVisible();
      const reached = await page.evaluate(() => new Promise((resolve) => {
         const seen = (e) => resolve(e.defaultPrevented);
         document.body.addEventListener('keydown', seen, { once: true });
         document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
         setTimeout(() => resolve('stopped'), 50);
      }));
      expect(reached).toBe('stopped');
      await expect(bubble(page)).toHaveCount(0);
   });

   test('warm-up: once one has shown, the next shows without the delay', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'First' });
      await c.component.evaluate(async (tip) => {
         const b = await slice.build('Button', { value: 'One' });
         tip.replaceChildren(b);
         const second = await slice.build('ToolTip', { text: 'Second' });
         second.id = 'second';
         second.appendChild(await slice.build('Button', { value: 'Two' }));
         tip.after(second);
      });
      await c.locator('button').first().hover();
      await expect(bubble(page)).toHaveText('First');
      await page.locator('#second button').hover();
      await page.waitForTimeout(120);
      await expect(bubble(page)).toHaveText('Second');
   });

   test('disabled: true never shows', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Off', showDelay: 0, disabled: true });
      await withButton(c);
      await c.locator('button').hover();
      await page.waitForTimeout(100);
      await expect(bubble(page)).toHaveCount(0);
   });

   test('empty text shows nothing', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: '', showDelay: 0 });
      await withButton(c);
      await c.locator('button').hover();
      await page.waitForTimeout(100);
      await expect(bubble(page)).toHaveCount(0);
   });
});

test.describe('ToolTip — content and looks', () => {
   test('title, text and shortcut', async ({ mount, page }) => {
      const c = await mount('ToolTip', { title: 'Publish', text: 'Makes the page public', shortcut: '⌘P', showDelay: 0 });
      await withButton(c);
      await c.locator('button').hover();
      await expect(bubble(page).locator('.slice-tooltip-bubble__title')).toHaveText('Publish');
      await expect(bubble(page).locator('.slice-tooltip-bubble__body')).toHaveText('Makes the page public');
      await expect(bubble(page).locator('kbd')).toHaveText('⌘P');
   });

   test('content takes a node', async ({ mount, page }) => {
      const c = await mount('ToolTip', { showDelay: 0 });
      await withButton(c);
      await c.component.evaluate((tip) => {
         const strong = document.createElement('strong');
         strong.className = 'custom';
         strong.textContent = 'Rich';
         tip.content = strong;
      });
      await c.locator('button').hover();
      await expect(bubble(page).locator('.custom')).toHaveText('Rich');
   });

   test('changing the text while open updates the bubble', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Copy link', showDelay: 0 });
      await withButton(c);
      await c.locator('button').hover();
      await c.component.evaluate((tip) => { tip.text = 'Copied!'; });
      await expect(bubble(page)).toHaveText('Copied!');
   });

   test('placement with alignment, flipped when there is no room', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Below, aligned left', placement: 'bottom-start', showDelay: 0 });
      await withButton(c);
      await c.locator('button').hover();
      await expect(bubble(page)).toHaveAttribute('data-placement', 'bottom');
      const [b, t] = [await bubble(page).boundingBox(), await c.locator('button').boundingBox()];
      expect(Math.abs(b.x - t.x)).toBeLessThan(2);
      expect(b.y).toBeGreaterThan(t.y + t.height);
      // The button at the very top: 'top' has no room and flips to the bottom.
      await page.mouse.move(5, 500);
      await c.component.evaluate((tip) => { tip.placement = 'top'; tip.style.cssText = 'position:fixed;top:0;left:200px'; });
      await c.locator('button').hover();
      await expect(bubble(page)).toHaveAttribute('data-placement', 'bottom');
   });

   test('variant, size and customColor', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Tip', variant: 'light', size: 'sm', showDelay: 0, customColor: { background: 'rgb(1, 2, 3)' } });
      await withButton(c);
      await c.locator('button').hover();
      await expect(bubble(page)).toHaveAttribute('data-variant', 'light');
      await expect(bubble(page)).toHaveAttribute('data-size', 'sm');
      expect(await bubble(page).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(1, 2, 3)');
   });
});

test.describe('ToolTip — toggletip, modals and lifecycle', () => {
   test('toggletip: a click opens it, Tab reaches its link, Escape returns to the trigger', async ({ mount, page }) => {
      const c = await mount('ToolTip', { mode: 'toggletip', title: 'Why we ask' });
      await c.component.evaluate((tip) => {
         const p = document.createElement('p');
         p.innerHTML = 'Only for delivery. <a href="#privacy">Privacy</a>';
         tip.content = p;
         const button = document.createElement('button');
         button.textContent = 'i';
         button.setAttribute('aria-label', 'Why we ask');
         tip.appendChild(button);
      });
      const trigger = c.locator('button');
      await trigger.hover();
      await page.waitForTimeout(500);
      await expect(bubble(page)).toHaveCount(0);   // hover does nothing
      await trigger.click();
      await expect(bubble(page)).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Tab');
      await expect(page.locator('a[href="#privacy"]')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(bubble(page)).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
   });

   test('inside a Modal, the bubble is on top', async ({ mount, page }) => {
      await mount('Badge', { label: 'host' });
      const onTop = await page.evaluate(async () => {
         const tip = await slice.build('ToolTip', { text: 'Inside a modal', showDelay: 0 });
         tip.appendChild(await slice.build('Button', { value: 'In modal' }));
         const modal = await slice.build('Modal', { title: 'M', content: tip, destroyOnClose: true });
         document.body.appendChild(modal);
         modal.show();
         await new Promise((r) => setTimeout(r, 400));
         tip.show();
         await new Promise((r) => setTimeout(r, 250));
         const b = tip.bubble.getBoundingClientRect();
         const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
         const result = tip.bubble.contains(hit);
         modal.close();
         return result;
      });
      expect(onTop).toBe(true);
   });

   test('destroying it removes the bubble and the listeners', async ({ mount, page }) => {
      const c = await mount('ToolTip', { text: 'Gone soon', showDelay: 0 });
      await withButton(c);
      await c.locator('button').hover();
      await expect(bubble(page)).toBeVisible();
      await c.component.evaluate((tip) => slice.controller.destroyComponent(tip));
      expect(await page.locator('.slice-tooltip-bubble').count()).toBe(0);
   });
});