import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Reference component test. Copy this file as the starting point for a new
// component's `<Component>.spec.js`. It exercises the baseline contract every
// component test should cover:
//   - smoke render (builds without throwing)
//   - props/setters reflected in the DOM
//   - §7 deprecated-alias behaviour (when the component has aliases)
//   - event handlers
//   - accessibility baseline
//   - (opt-in) a visual-regression screenshot, tagged @visual

test.describe('Button', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Button');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_button')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('value reflects to label text and accessible name', async ({ mount }) => {
      const c = await mount('Button', { value: 'Guardar' });
      await expect(c.locator('.slice_button_value')).toHaveText('Guardar');
      await expect(c.locator('.slice_button')).toHaveAttribute('aria-label', 'Guardar');
   });

   test('variant applies the matching modifier class', async ({ mount }) => {
      const c = await mount('Button', { value: 'X', variant: 'outlined' });
      await expect(c.locator('.slice_button')).toHaveClass(/slice_button--outlined/);
   });

   test('invalid variant falls back to "filled"', async ({ mount }) => {
      const c = await mount('Button', { value: 'X', variant: 'not-a-variant' });
      await expect(c.locator('.slice_button')).toHaveClass(/slice_button--filled/);
   });

   test('onClick fires when the button is clicked', async ({ mount }) => {
      const c = await mount('Button', { value: 'Click' }, { spies: ['onClick'] });
      await c.locator('.slice_button_container').click();
      expect(await c.events('onClick')).toBe(1);
   });

   // §7 deprecation/alias contract: the legacy name still works AND warns once.
   test('deprecated onClickCallback still fires and warns once', async ({ mount }) => {
      const c = await mount('Button', { value: 'Legacy' }, { spies: ['onClickCallback'] });
      await c.locator('.slice_button_container').click();

      expect(await c.events('onClickCallback')).toBe(1);

      const deprecations = c.deprecationWarnings();
      expect(deprecations.some((w) => w.includes('onClickCallback'))).toBe(true);
      // "warn once" — exactly one deprecation line for this alias.
      expect(deprecations.filter((w) => w.includes('onClickCallback')).length).toBe(1);
   });

   test('a11y: native button has type="button"', async ({ mount }) => {
      const c = await mount('Button', { value: 'X' });
      await expect(c.locator('.slice_button')).toHaveAttribute('type', 'button');
   });

   // Opt-in visual regression. Runs only in the `visual` project
   // (`pnpm run test:e2e:visual`). Generate baselines with `:update`.
   test('visual: filled button @visual', async ({ mount }) => {
      const c = await mount('Button', { value: 'Guardar', variant: 'filled' });
      await expect(c.component).toHaveScreenshot('button-filled.png');
   });
});
