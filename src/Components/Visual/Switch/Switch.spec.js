import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Baseline contract for the Switch visual component.
// Assertions are derived from Switch.js / Switch.html:
//   - root structure: .slice_switch_container > .slice_switch > label > input + span.slider
//   - props: checked, disabled (.slider.disabled), label (.switch_label), labelPlacement (flexDirection), customColor
//   - handlers: canonical onChange(checked); deprecated alias toggle (§7)
//   - onChange/toggle fire on the native input's `change` event

test.describe('Switch', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Switch');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_switch')).toBeVisible();
      await expect(c.locator('input[type="checkbox"]')).toHaveCount(1);
      expect(c.pageErrors()).toEqual([]);
   });

   test('checked prop reflects to the native input', async ({ mount }) => {
      const c = await mount('Switch', { checked: true });
      await expect(c.locator('input[type="checkbox"]')).toBeChecked();
   });

   test('disabled prop disables input and marks the slider', async ({ mount }) => {
      const c = await mount('Switch', { disabled: true });
      await expect(c.locator('input[type="checkbox"]')).toBeDisabled();
      await expect(c.locator('.slider')).toHaveClass(/disabled/);
   });

   test('label prop renders a .switch_label with the text', async ({ mount }) => {
      const c = await mount('Switch', { label: 'Enable notifications' });
      await expect(c.locator('.switch_label')).toHaveText('Enable notifications');
   });

   test('labelPlacement=left applies row-reverse flex direction', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X', labelPlacement: 'left' });
      await expect(c.locator('.slice_switch')).toHaveCSS('flex-direction', 'row-reverse');
   });

   test('labelPlacement=bottom applies column flex direction', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X', labelPlacement: 'bottom' });
      await expect(c.locator('.slice_switch')).toHaveCSS('flex-direction', 'column');
   });

   test('customColor object sets the --success-color accent', async ({ mount }) => {
      const c = await mount('Switch', { customColor: { accent: 'rgb(0, 0, 255)' } });
      await expect(c.component).toHaveCSS('--success-color', 'rgb(0, 0, 255)');
   });

   // §7 deprecation: customColor passed as a STRING warns exactly once.
   test('deprecated customColor:string still applies accent and warns once', async ({ mount }) => {
      const c = await mount('Switch', { customColor: 'rgb(0, 128, 0)' });
      await expect(c.component).toHaveCSS('--success-color', 'rgb(0, 128, 0)');
      const deprecations = c.deprecationWarnings();
      expect(deprecations.filter((w) => w.includes('customColor: string')).length).toBe(1);
   });

   // The native input is visually hidden behind the styled .slider, so we click the
   // wrapping label (the real interaction target) to fire the native change event.
   test('onChange fires with the new checked state when toggled', async ({ mount }) => {
      const c = await mount('Switch', { checked: false }, { spies: ['onChange'] });
      await c.locator('.slice_switch label').click();
      expect(await c.events('onChange')).toBe(1);
      const args = await c.eventArgs('onChange');
      expect(args[0]).toEqual([true]);
   });

   // §7 deprecation: `toggle` is the legacy alias for onChange. It must still fire
   // AND emit exactly one deprecation warning. Spy ONLY on `toggle` so the alias
   // setter (which uses `??=`) installs it as the active handler.
   test('deprecated toggle still fires and warns once', async ({ mount }) => {
      const c = await mount('Switch', { checked: false }, { spies: ['toggle'] });

      const deprecations = c.deprecationWarnings();
      expect(deprecations.filter((w) => w.includes('toggle')).length).toBe(1);

      await c.locator('.slice_switch label').click();
      expect(await c.events('toggle')).toBe(1);
   });

   test('visual: default switch @visual', async ({ mount }) => {
      const c = await mount('Switch', { label: 'Dark mode', checked: true });
      await expect(c.component).toHaveScreenshot('switch-default.png');
   });
});
