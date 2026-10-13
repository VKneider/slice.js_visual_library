import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Baseline contract for the Checkbox visual component.
// Assertions are derived from Checkbox.js / Checkbox.html:
//   - root structure: .slice_checkbox_container > .slice_checkbox > label > input + .checkmark
//   - props: checked, disabled, label, labelPlacement (flexDirection), customColor
//   - no canonical event handler prop (change is internal-only)

test.describe('Checkbox', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Checkbox');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_checkbox')).toBeVisible();
      await expect(c.locator('input[type="checkbox"]')).toHaveCount(1);
      expect(c.pageErrors()).toEqual([]);
   });

   test('checked prop reflects to the native input', async ({ mount }) => {
      const c = await mount('Checkbox', { checked: true });
      await expect(c.locator('input[type="checkbox"]')).toBeChecked();
   });

   test('disabled prop disables input and marks the checkmark', async ({ mount }) => {
      const c = await mount('Checkbox', { disabled: true });
      await expect(c.locator('input[type="checkbox"]')).toBeDisabled();
      await expect(c.locator('.checkmark')).toHaveClass(/disabled/);
   });

   test('label prop renders a .checkbox_label with the text', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'Accept terms' });
      await expect(c.locator('.checkbox_label')).toHaveText('Accept terms');
   });

   test('labelPlacement=left applies row-reverse flex direction', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', labelPlacement: 'left' });
      await expect(c.locator('.slice_checkbox')).toHaveCSS('flex-direction', 'row-reverse');
   });

   test('labelPlacement=top applies column-reverse flex direction', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', labelPlacement: 'top' });
      await expect(c.locator('.slice_checkbox')).toHaveCSS('flex-direction', 'column-reverse');
   });

   test('customColor object sets the --success-color accent', async ({ mount }) => {
      const c = await mount('Checkbox', { customColor: { accent: 'rgb(255, 0, 0)' } });
      await expect(c.component).toHaveCSS('--success-color', 'rgb(255, 0, 0)');
   });

   // §7 deprecation: passing customColor as a STRING emits exactly one deprecation warning.
   test('deprecated customColor:string still applies accent and warns once', async ({ mount }) => {
      const c = await mount('Checkbox', { customColor: 'rgb(0, 128, 0)' });
      await expect(c.component).toHaveCSS('--success-color', 'rgb(0, 128, 0)');
      const deprecations = c.deprecationWarnings();
      expect(deprecations.filter((w) => w.includes('customColor: string')).length).toBe(1);
   });

   // The native input is visually hidden behind the styled .checkmark, so we click
   // the wrapping label (the real interaction target) to toggle it.
   test('toggling via the label updates the checked state', async ({ mount }) => {
      const c = await mount('Checkbox', { checked: false });
      const input = c.locator('input[type="checkbox"]');
      await c.locator('.slice_checkbox label').click();
      await expect(input).toBeChecked();
   });

   test('visual: default checkbox @visual', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'Remember me', checked: true });
      await expect(c.component).toHaveScreenshot('checkbox-default.png');
   });

   // The real input is clipped to 0x0 behind the styled .checkmark, so without an
   // explicit ring a keyboard user had no visible focus indicator at all.
   test('keyboard focus is visible on the styled checkmark', async ({ mount, page }) => {
      const c = await mount('Checkbox', { label: 'Remember me' });
      await c.locator('input[type="checkbox"]').focus();
      const ring = await c.locator('.checkmark').evaluate((el) => {
         const cs = getComputedStyle(el);
         return { width: cs.outlineWidth, style: cs.outlineStyle };
      });
      expect(ring.style).not.toBe('none');
      expect(parseFloat(ring.width)).toBeGreaterThan(0);
      const focused = await page.evaluate(() => document.activeElement?.tagName === 'INPUT');
      expect(focused).toBe(true);
   });

   test('onChange fires with the new checked state', async ({ mount }) => {
      const c = await mount('Checkbox', { checked: false }, { spies: ['onChange'] });
      await c.locator('.slice_checkbox label').click();
      await expect.poll(() => c.events('onChange')).toBeGreaterThan(0);
      const args = await c.eventArgs('onChange');
      expect(args.at(-1)).toEqual([true]);
   });

   test('onChange can be cleared with null', async ({ mount }) => {
      const c = await mount('Checkbox', { checked: false }, { spies: ['onChange'] });
      await c.component.evaluate((el) => { el.onChange = null; });
      await c.locator('.slice_checkbox label').click();
      expect(await c.events('onChange')).toBe(0);
   });
});
