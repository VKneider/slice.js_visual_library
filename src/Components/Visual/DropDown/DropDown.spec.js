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
});
