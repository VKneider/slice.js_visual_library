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

   test('variant:"danger" paints from the danger theme tokens', async ({ mount }) => {
      const c = await mount('Button', { value: 'Delete', variant: 'danger' });
      await expect(c.locator('.slice_button')).toHaveClass(/slice_button--danger/);

      const tokens = await c.component.evaluate((el) => {
         const btn = el.querySelector('.slice_button');
         const btnCs = getComputedStyle(btn);
         const host = getComputedStyle(el);
         // Resolve a raw custom property through a probe element, so hex and
         // rgb() forms compare equal.
         const probe = document.createElement('span');
         probe.style.color = 'var(--danger-color)';
         document.body.appendChild(probe);
         const danger = getComputedStyle(probe).color;
         probe.style.color = 'var(--danger-contrast)';
         const contrast = getComputedStyle(probe).color;
         probe.remove();
         return { bg: btnCs.backgroundColor, fg: btnCs.color, danger, contrast, host: host.getPropertyValue('--danger-color') };
      });
      expect(tokens.host.trim()).not.toBe('');
      expect(tokens.bg).toBe(tokens.danger);
      expect(tokens.fg).toBe(tokens.contrast);
      expect(tokens.bg).not.toBe('rgba(0, 0, 0, 0)');
   });

   test('variant swaps its modifier class idempotently', async ({ mount }) => {
      const c = await mount('Button', { value: 'X', variant: 'outlined' });
      await c.component.evaluate((el) => { el.variant = 'danger'; });
      const cls = await c.locator('.slice_button').getAttribute('class');
      expect(cls).toContain('slice_button--danger');
      expect(cls).not.toContain('slice_button--outlined');
   });

   test('size:"sm" compacts the control; an invalid size falls back to md', async ({ mount }) => {
      const c = await mount('Button', { value: 'X', size: 'sm' });
      await expect(c.locator('.slice_button')).toHaveClass(/slice_button--sm/);
      const small = (await c.locator('.slice_button').boundingBox()).height;

      await c.component.evaluate((el) => { el.size = 'nope'; });
      await expect(c.locator('.slice_button')).not.toHaveClass(/slice_button--sm/);
      await expect(c.locator('.slice_button')).toHaveClass(/slice_button--md/);
      // Padding animates (the base rule transitions `all`), so poll for the
      // settled size rather than measuring mid-transition.
      await expect.poll(async () => (await c.locator('.slice_button').boundingBox()).height)
         .toBeGreaterThan(small);
   });

   test('icon forwards size and color to the Icon child', async ({ mount }) => {
      const c = await mount('Button', {
         value: 'Save',
         icon: { name: 'check', size: '14px', color: 'rgb(1, 2, 3)' },
      });
      const icon = c.locator('slice-icon');
      await expect(icon).toBeAttached();
      // Icon renders an inline <svg>; size and color live on its host.
      await expect(icon.locator('svg > *')).not.toHaveCount(0);
      const applied = await icon.evaluate((el) => ({
         size: getComputedStyle(el).fontSize,
         color: getComputedStyle(el).color,
      }));
      expect(applied.size).toBe('14px');
      expect(applied.color).toBe('rgb(1, 2, 3)');
   });

   test('an icon and a label do not collide', async ({ mount }) => {
      const c = await mount('Button', { value: 'Save', icon: { name: 'check' } });
      await expect(c.locator('slice-icon')).toBeAttached();
      const gap = await c.locator('.slice_button').evaluate((el) => getComputedStyle(el).columnGap);
      expect(parseFloat(gap)).toBeGreaterThan(0);
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
