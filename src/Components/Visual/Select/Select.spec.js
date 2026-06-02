import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Baseline contract for the Select visual component.
// Assertions are derived from Select.js / Select.html:
//   - root structure: .slice_select_dropdown > .slice_select_container(label,input.slice_select,.caret) + .slice_select_menu
//   - options[] render as [role=option] divs in .slice_select_menu (text taken from option[visibleProp])
//   - a11y: container is role=button, tabindex=0, aria-haspopup=listbox, aria-expanded toggles; menu role=listbox
//   - keyboard: Enter/Space toggles open; Escape closes
//   - handlers: canonical onChange; deprecated alias onOptionSelect (§7)

const OPTIONS = [{ text: 'Apple' }, { text: 'Banana' }, { text: 'Cherry' }];

test.describe('Select', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_select_container')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('label prop renders into the select label', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Pick a fruit' });
      await expect(c.locator('.slice_select_label')).toHaveText('Pick a fruit');
   });

   test('options render as role=option items using visibleProp text', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit' });
      const opts = c.locator('.slice_select_menu [role="option"]');
      await expect(opts).toHaveCount(3);
      await expect(opts.nth(0)).toHaveText('Apple');
      await expect(opts.nth(2)).toHaveText('Cherry');
   });

   test('visibleProp controls which option property is displayed', async ({ mount }) => {
      const c = await mount('Select', {
         options: [{ name: 'Uno' }, { name: 'Dos' }],
         visibleProp: 'name',
      });
      const opts = c.locator('.slice_select_menu [role="option"]');
      await expect(opts.nth(0)).toHaveText('Uno');
      await expect(opts.nth(1)).toHaveText('Dos');
   });

   test('a11y: container and menu carry the expected roles/attributes', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS });
      const container = c.locator('.slice_select_container');
      await expect(container).toHaveAttribute('role', 'button');
      await expect(container).toHaveAttribute('tabindex', '0');
      await expect(container).toHaveAttribute('aria-haspopup', 'listbox');
      await expect(container).toHaveAttribute('aria-expanded', 'false');
      await expect(c.locator('.slice_select_menu')).toHaveAttribute('role', 'listbox');
   });

   test('clicking the container opens the menu and sets aria-expanded', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS });
      await c.locator('.slice_select_container').click();
      await expect(c.locator('.slice_select_menu')).toHaveClass(/menu_open/);
      await expect(c.locator('.slice_select_container')).toHaveAttribute('aria-expanded', 'true');
   });

   test('keyboard: Enter opens then Escape closes the menu', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS });
      const container = c.locator('.slice_select_container');
      await container.focus();
      await container.press('Enter');
      await expect(c.locator('.slice_select_menu')).toHaveClass(/menu_open/);
      await container.press('Escape');
      await expect(c.locator('.slice_select_menu')).not.toHaveClass(/menu_open/);
   });

   test('disabled select does not open on click', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, disabled: true });
      await c.locator('.slice_select_container').click();
      await expect(c.locator('.slice_select_menu')).not.toHaveClass(/menu_open/);
   });

   test('selecting an option marks it active and updates the field value', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit' });
      await c.locator('.slice_select_container').click();
      const banana = c.locator('.slice_select_menu [role="option"]').nth(1);
      await banana.click();
      await expect(banana).toHaveClass(/active/);
      await expect(banana).toHaveAttribute('aria-selected', 'true');
      await expect(c.locator('.slice_select')).toHaveValue('Banana');
   });

   test('onChange fires when an option is selected', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS }, { spies: ['onChange'] });
      await c.locator('.slice_select_container').click();
      await c.locator('.slice_select_menu [role="option"]').nth(0).click();
      expect(await c.events('onChange')).toBe(1);
   });

   // §7 deprecation: onOptionSelect is the legacy alias for onChange; it must still
   // fire AND emit exactly one deprecation warning.
   test('deprecated onOptionSelect still fires and warns once', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS }, { spies: ['onOptionSelect'] });
      await c.locator('.slice_select_container').click();
      await c.locator('.slice_select_menu [role="option"]').nth(0).click();

      expect(await c.events('onOptionSelect')).toBe(1);
      const deprecations = c.deprecationWarnings();
      expect(deprecations.filter((w) => w.includes('onOptionSelect')).length).toBe(1);
   });

   test('visual: select with options @visual', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit' });
      await expect(c.component).toHaveScreenshot('select-default.png');
   });
});
