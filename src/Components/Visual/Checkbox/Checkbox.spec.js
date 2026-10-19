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

   test('variant applies the matching modifier class on the container', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', variant: 'danger' });
      await expect(c.locator('.slice_checkbox_container')).toHaveClass(/slice_checkbox--danger/);
      // Idempotent swap: the previous modifier is gone, not stacked.
      await expect(c.locator('.slice_checkbox_container')).not.toHaveClass(/slice_checkbox--default/);
   });

   test('invalid variant falls back to "default"', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', variant: 'not-a-variant' });
      await expect(c.locator('.slice_checkbox_container')).toHaveClass(/slice_checkbox--default/);
   });

   test('variant=outlined drops the surface background', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', variant: 'outlined' });
      await expect(c.locator('.slice_checkbox_container')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
   });

   test('checked box uses the variant accent', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', checked: true, variant: 'danger' });
      const tokens = await c.component.evaluate((el) => {
         const cs = getComputedStyle(el.querySelector('.slice_checkbox_container'));
         return {
            accent: cs.getPropertyValue('--slice-checkbox-accent').trim(),
            danger: cs.getPropertyValue('--danger-color').trim(),
         };
      });
      expect(tokens.accent).toBe(tokens.danger);
   });

   test('variant=plain drops the container chip', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', variant: 'plain' });
      const container = c.locator('.slice_checkbox_container');
      await expect(container).toHaveClass(/slice_checkbox--plain/);
      await expect(container).toHaveCSS('border-top-width', '0px');
      await expect(container).toHaveCSS('padding-top', '0px');
   });

   // `plain` ties on specificity with the size rules, so it must still win the
   // container padding while size keeps driving the box and the label.
   test('variant=plain still wins the container padding at size=lg', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', variant: 'plain', size: 'lg' });
      await expect(c.locator('.slice_checkbox_container')).toHaveCSS('padding-top', '0px');
   });

   // The border width is exposed as a custom property so a consumer can retune or
   // remove the box border for one instance without touching the component (§8).
   test('--slice-checkbox-box-border-width is a per-instance escape hatch', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X' });
      await expect(c.locator('.checkmark')).not.toHaveCSS('border-top-width', '0px');
      await c.component.evaluate((el) => el.style.setProperty('--slice-checkbox-box-border-width', '0'));
      await expect(c.locator('.checkmark')).toHaveCSS('border-top-width', '0px');
   });

   test('size sets data-size on the host', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', size: 'lg' });
      await expect(c.component).toHaveAttribute('data-size', 'lg');
   });

   test('invalid size falls back to "md"', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', size: 'huge' });
      await expect(c.component).toHaveAttribute('data-size', 'md');
   });

   // The enum vocabularies live ONLY in `static props` (they must be literal
   // arrays there for `slice types generate` to emit a union). This is the proof
   // that the setters read that list instead of keeping a second copy: a value
   // added to the metadata is accepted with no code change. Each probe restores
   // the array afterwards, because the class is shared inside the page.
   test('setters read their accepted set from static props, not a copy', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', variant: 'soft', size: 'sm' });
      const container = c.locator('.slice_checkbox_container');
      await expect(container).toHaveClass(/slice_checkbox--soft/);

      await c.component.evaluate((el) => {
         const p = el.constructor.props;
         p.variant.allowedValues.push('probe');
         p.size.allowedValues.push('probe-size');
         window.slice.setComponentProps(el, { variant: 'probe', size: 'probe-size' });
         p.variant.allowedValues.pop();
         p.size.allowedValues.pop();
      });

      await expect(container).toHaveClass(/slice_checkbox--probe/);
      await expect(c.component).toHaveAttribute('data-size', 'probe-size');

      // ...and with the metadata restored, the same values are unknown again.
      await c.component.evaluate((el) => window.slice.setComponentProps(el, { variant: 'probe', size: 'probe-size' }));
      await expect(container).toHaveClass(/slice_checkbox--default/);
      await expect(c.component).toHaveAttribute('data-size', 'md');
   });

   test('size=sm shrinks the checkmark relative to the host type', async ({ mount }) => {
      const c = await mount('Checkbox', { label: 'X', size: 'sm' });
      const sizes = await c.component.evaluate((el) => ({
         box: parseFloat(getComputedStyle(el.querySelector('.checkmark')).fontSize),
         host: parseFloat(getComputedStyle(el).fontSize),
      }));
      expect(sizes.box).toBeLessThan(sizes.host);
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

   // Opt-in visual regression for the new axes. Built with the REAL runtime (via
   // `mountHtml`) so the snapshot covers the actual theme tokens, and in both
   // checked and unchecked states so a variant's box/border is visible too.
   // Only runs in the `visual` project (grep @visual).
   test('visual: variant and size strip @visual', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="checkbox-strip"></div>`);

      await h.page.evaluate(async () => {
         const strip = document.getElementById('checkbox-strip');
         strip.style.cssText =
            'display: inline-flex; flex-direction: column; gap: 10px; padding: 20px; background: #ffffff;';

         const makeRow = async (specs) => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 12px;';
            for (const spec of specs) row.appendChild(await slice.build('Checkbox', spec));
            return row;
         };

         const variants = [
            { label: 'default', variant: 'default' },
            { label: 'outlined', variant: 'outlined' },
            { label: 'soft', variant: 'soft' },
            { label: 'danger', variant: 'danger' },
            { label: 'plain', variant: 'plain' },
         ];

         strip.appendChild(await makeRow(variants.map((v) => ({ ...v, checked: true }))));
         strip.appendChild(await makeRow(variants));
         strip.appendChild(
            await makeRow([
               { label: 'sm', size: 'sm', checked: true },
               { label: 'md', size: 'md', checked: true },
               { label: 'lg', size: 'lg', checked: true },
            ])
         );

         await new Promise((resolve) => setTimeout(resolve, 300));
      });

      await expect(h.locator('#checkbox-strip')).toHaveScreenshot('checkbox-variants.png');
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
