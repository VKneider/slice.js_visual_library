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

   // Regression: the input was `display: none`, which drops it from the
   // accessibility tree AND the tab order — the switch was keyboard-unreachable.
   test('the hidden input stays keyboard reachable and toggles with Space', async ({ mount, page }) => {
      const c = await mount('Switch', { checked: false }, { spies: ['onChange'] });
      const input = c.locator('input[type="checkbox"]');

      await expect(input).toBeAttached();
      const display = await input.evaluate((el) => getComputedStyle(el).display);
      expect(display).not.toBe('none');

      await input.focus();
      const focused = await page.evaluate(() =>
         document.activeElement?.tagName === 'INPUT' &&
         document.activeElement?.type === 'checkbox'
      );
      expect(focused).toBe(true);

      await page.keyboard.press('Space');
      await expect.poll(() => c.events('onChange')).toBeGreaterThan(0);
   });

   test('the text label is associated with the input, so clicking it toggles', async ({ mount }) => {
      const c = await mount('Switch', { label: 'Enable notifications' });

      // The slider's input is wrapped in its own <label>, but the TEXT label is
      // a separate sibling: without a `for` it forwarded clicks nowhere.
      const out = await c.component.evaluate((el) => {
         const input = el.querySelector('input');
         const label = el.querySelector('.switch_label');
         return {
            hasId: !!input.id,
            forMatches: label.getAttribute('for') === input.id,
            checkedBefore: input.checked,
         };
      });

      expect(out.hasId).toBe(true);
      expect(out.forMatches).toBe(true);
      expect(out.checkedBefore).toBe(false);

      await c.locator('.switch_label').click();
      await expect(c.locator('input')).toBeChecked();
   });

   test('two switches on a page get distinct input ids', async ({ mount }) => {
      const c = await mount('Switch', { label: 'One' });

      const ids = await c.root.page().evaluate(async () => {
         const a = await slice.build('Switch', { sliceId: 'sw-a', label: 'A' });
         const b = await slice.build('Switch', { sliceId: 'sw-b', label: 'B' });
         document.body.appendChild(a);
         document.body.appendChild(b);
         return { a: a.querySelector('input').id, b: b.querySelector('input').id };
      });

      // A shared id would make one switch's text label toggle the other.
      expect(ids.a).not.toBe(ids.b);
   });

   // ------------------------------------------------ parity with Checkbox

   test('the input is exposed as role="switch"', async ({ mount, page }) => {
      await mount('Switch', { label: 'Wi-Fi', checked: true });
      const sw = page.getByRole('switch', { name: 'Wi-Fi' });
      await expect(sw).toBeVisible();
      await expect(sw).toBeChecked();
   });

   test('variant applies the matching modifier idempotently', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X', variant: 'danger' });
      const container = c.locator('.slice_switch_container');
      await expect(container).toHaveClass(/slice_switch--danger/);
      await expect(container).not.toHaveClass(/slice_switch--default/);
      await c.component.evaluate((el) => { el.variant = 'soft'; });
      await expect(container).toHaveClass(/slice_switch--soft/);
      await expect(container).not.toHaveClass(/slice_switch--danger/);
   });

   test('invalid variant falls back to "default"', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X', variant: 'neon' });
      await expect(c.locator('.slice_switch_container')).toHaveClass(/slice_switch--default/);
   });

   test('default variant still looks like the original switch', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X', checked: true });
      const colors = await c.component.evaluate((el) => ({
         track: getComputedStyle(el.querySelector('.slider')).backgroundColor,
         success: (() => {
            const probe = document.createElement('span');
            probe.style.color = 'var(--success-color)';
            el.appendChild(probe);
            const v = getComputedStyle(probe).color;
            probe.remove();
            return v;
         })(),
         thumb: getComputedStyle(el.querySelector('.slider'), '::after').backgroundColor,
      }));
      expect(colors.track).toBe(colors.success);
      expect(colors.thumb).toBe('rgb(255, 255, 255)');
   });

   test('checked track uses the variant accent (danger)', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X', checked: true, variant: 'danger' });
      const out = await c.component.evaluate((el) => {
         const probe = document.createElement('span');
         probe.style.color = 'var(--danger-color)';
         el.appendChild(probe);
         const danger = getComputedStyle(probe).color;
         probe.remove();
         return { track: getComputedStyle(el.querySelector('.slider')).backgroundColor, danger };
      });
      expect(out.track).toBe(out.danger);
   });

   test('customColor.accent wins over a variant accent', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X', checked: true, variant: 'outlined', customColor: { accent: 'rgb(255, 0, 0)' } });
      await expect(c.locator('.slider')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
   });

   test('variant=plain drops the container chip, even at size=lg', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X', variant: 'plain', size: 'lg' });
      const container = c.locator('.slice_switch_container');
      await expect(container).toHaveCSS('padding-top', '0px');
      await expect(container).toHaveCSS('border-top-width', '0px');
   });

   test('size sets data-size and scales the track', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      const out = await h.page.evaluate(async () => {
         const host = document.getElementById('host');
         const res = {};
         for (const size of ['sm', 'md', 'lg']) {
            const el = await slice.build('Switch', { size });
            host.appendChild(el);
            res[size] = { attr: el.dataset.size, w: el.querySelector('.slider').getBoundingClientRect().width };
         }
         return res;
      });
      expect(out.sm.attr).toBe('sm');
      expect(out.sm.w).toBeLessThan(out.md.w);
      expect(out.md.w).toBeLessThan(out.lg.w);
   });

   test('invalid size falls back to "md"', async ({ mount }) => {
      const c = await mount('Switch', { size: 'xl' });
      await expect(c.component).toHaveAttribute('data-size', 'md');
   });

   test('setters read their accepted set from static props, not a copy', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X' });
      const out = await c.component.evaluate((el) => {
         const p = el.constructor.props;
         p.variant.allowedValues.push('probe');
         p.size.allowedValues.push('probe-size');
         window.slice.setComponentProps(el, { variant: 'probe', size: 'probe-size' });
         p.variant.allowedValues.pop();
         p.size.allowedValues.pop();
         return {
            variant: el.querySelector('.slice_switch_container').classList.contains('slice_switch--probe'),
            size: el.dataset.size,
         };
      });
      expect(out).toEqual({ variant: true, size: 'probe-size' });
   });

   test('the thumb colour is a per-instance token', async ({ mount }) => {
      const c = await mount('Switch', { label: 'X' });
      await c.component.evaluate((el) => el.style.setProperty('--slice-switch-thumb', 'rgb(0, 0, 0)'));
      // The knob transitions its colour, so poll until it settles.
      await expect
         .poll(() => c.locator('.slider').evaluate((el) => getComputedStyle(el, '::after').backgroundColor))
         .toBe('rgb(0, 0, 0)');
   });

   test('onChange can be cleared with null', async ({ mount }) => {
      const c = await mount('Switch', { checked: false }, { spies: ['onChange'] });
      await c.component.evaluate((el) => { el.onChange = null; });
      await c.locator('.slice_switch label').click();
      await expect(c.locator('input')).toBeChecked();
      expect(await c.events('onChange')).toBe(0);
   });

   // The canonical setter now accepts null; the alias must still win when it is
   // the only handler passed (defaults are applied before provided props).
   test('toggle alone still installs the handler after the onChange change', async ({ mount }) => {
      const c = await mount('Switch', {}, { spies: ['toggle'] });
      await c.locator('.slice_switch label').click();
      expect(await c.events('toggle')).toBe(1);
   });
});