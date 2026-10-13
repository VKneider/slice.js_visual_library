import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Baseline contract for the DropDown visual component.
// Assertions are derived from DropDown.js / DropDown.html:
//   - root structure: .slice_dropdown(label.slice_dropdown_label, .caret) + .slice_dropbox
//   - props: label, options[] (each -> div > a, text from .text||.label, href from .href||.path||'#')
//   - a11y: .slice_dropdown is role=button, tabindex=0, aria-haspopup=true, aria-expanded toggles
//   - keyboard: Enter/Space toggles open; Escape closes
//   - no spied callback prop: option clicks navigate via slice.router OR follow the href and
//     then closeDrop(); behaviour is asserted via the open/close DOM state.

const OPTIONS = [
   { text: 'Home', href: '#home' },
   { text: 'Profile', href: '#profile' },
   { label: 'Settings', href: '#settings' },
];

test.describe('DropDown', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_dropdown')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('label prop renders into the dropdown label', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Account', options: OPTIONS });
      await expect(c.locator('.slice_dropdown_label')).toHaveText('Account');
   });

   test('options render as anchors using text/label and href/path', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      const links = c.locator('.slice_dropbox a');
      await expect(links).toHaveCount(3);
      await expect(links.nth(0)).toHaveText('Home');
      await expect(links.nth(2)).toHaveText('Settings'); // falls back to .label
   });

   test('a11y: trigger carries the expected roles/attributes', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      const trigger = c.locator('.slice_dropdown');
      await expect(trigger).toHaveAttribute('role', 'button');
      await expect(trigger).toHaveAttribute('tabindex', '0');
      await expect(trigger).toHaveAttribute('aria-haspopup', 'true');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
   });

   test('clicking the trigger opens the box and sets aria-expanded', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      await c.locator('.slice_dropdown').click();
      await expect(c.locator('.slice_dropbox')).toHaveClass(/slice_dropbox_open/);
      await expect(c.locator('.slice_dropdown')).toHaveAttribute('aria-expanded', 'true');
   });

   test('keyboard: Enter opens then Escape closes the box', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      const trigger = c.locator('.slice_dropdown');
      await trigger.focus();
      await trigger.press('Enter');
      await expect(c.locator('.slice_dropbox')).toHaveClass(/slice_dropbox_open/);
      await trigger.press('Escape');
      await expect(c.locator('.slice_dropbox')).not.toHaveClass(/slice_dropbox_open/);
   });

   test('selecting an option closes the box', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      await c.locator('.slice_dropdown').click();
      await expect(c.locator('.slice_dropbox')).toHaveClass(/slice_dropbox_open/);
      await c.locator('.slice_dropbox a').nth(0).click();
      await expect(c.locator('.slice_dropbox')).not.toHaveClass(/slice_dropbox_open/);
      await expect(c.locator('.slice_dropdown')).toHaveAttribute('aria-expanded', 'false');
   });

   test('visual: dropdown closed @visual', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      await expect(c.component).toHaveScreenshot('dropdown-default.png');
   });

   // An option with a `callback` is an ACTION, not a destination: the only way
   // out of a navigation-only menu was a fake `href: '#'` that went nowhere.
   // The options are assigned from inside the page because `mount` serialises
   // props across the boundary and a function cannot survive that.
   test('an option with a callback runs it and closes the box', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Actions', options: [] });
      await c.component.evaluate((el) => {
         el.options = [
            { text: 'Download', callback: () => { window.__called = (window.__called || 0) + 1; } },
            { text: 'Print' },
         ];
      });
      await c.locator('.slice_dropdown').click();
      await c.locator('.slice_dropbox a').filter({ hasText: 'Download' }).click();

      await expect(c.locator('.slice_dropbox')).not.toHaveClass(/slice_dropbox_open/);
      await expect(c.locator('.slice_dropdown')).toHaveAttribute('aria-expanded', 'false');
      const calls = await c.root.page().evaluate(() => window.__called || 0);
      expect(calls).toBe(1);
   });

   test('a callback option does not navigate even when it also carries a path', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: [] });
      await c.component.evaluate((el) => {
         window.__ran = false;
         el.options = [
            { text: 'Both', path: '/should-not-happen', callback: () => { window.__ran = true; } },
         ];
      });
      const before = await c.root.page().evaluate(() => location.hash);
      await c.locator('.slice_dropdown').click();
      await c.locator('.slice_dropbox a').first().click();

      const after = await c.root.page().evaluate(() => location.hash);
      expect(after).toBe(before);
      expect(await c.root.page().evaluate(() => window.__ran)).toBe(true);
   });

   test('the box is right-anchored by default so end-of-toolbar triggers fit', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      // `left: auto` resolves to a used pixel value, so assert the geometry:
      // the box's right edge lines up with the trigger's, and it grows leftwards.
      const geo = await c.component.evaluate((el) => {
         const trigger = el.querySelector('.slice_dropdown').getBoundingClientRect();
         const box = el.querySelector('.slice_dropbox').getBoundingClientRect();
         return {
            rightDelta: Math.abs(box.right - trigger.right),
            growsLeft: box.left < trigger.left,
         };
      });
      expect(geo.rightDelta).toBeLessThanOrEqual(1);
      expect(geo.growsLeft).toBe(true);
   });
});
