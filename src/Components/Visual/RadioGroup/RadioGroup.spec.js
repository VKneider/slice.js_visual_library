import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Contract for RadioGroup. Structure (RadioGroup.html + _renderOption):
//   fieldset.slice_radio_group_container[role=radiogroup]
//     > legend.slice_radio_group_label
//     > .slice_radio_group > label.slice_radio_option
//          > input.slice_radio_input[type=radio] + .slice_radio_mark + .slice_radio_text
// The group owns `value` (the selected option's value); `onChange(value, option)`
// fires only for user selection.

const PLANS = [
   { label: 'Free', value: 'free' },
   { label: 'Pro', value: 'pro' },
   { label: 'Team', value: 'team' },
];

test.describe('RadioGroup', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS });
      await expect(c.component).toBeVisible();
      await expect(c.locator('input[type="radio"]')).toHaveCount(3);
      await expect(c.locator('.slice_radio_label')).toHaveText(['Free', 'Pro', 'Team']);
      expect(c.pageErrors()).toEqual([]);
   });

   test('host has an explicit block display (§8.1)', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS });
      await expect(c.component).toHaveCSS('display', 'block');
   });

   test('string and number options are shorthand for { label, value }', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: ['S', 'M', 3], value: 3 });
      await expect(c.locator('.slice_radio_label')).toHaveText(['S', 'M', '3']);
      await expect(c.locator('input[type="radio"]').nth(2)).toBeChecked();
      expect(await c.component.evaluate((el) => el.value)).toBe(3);
   });

   test('value checks the matching option', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'pro' });
      const radios = c.locator('input[type="radio"]');
      await expect(radios.nth(1)).toBeChecked();
      await expect(radios.nth(0)).not.toBeChecked();
      await expect(c.locator('.slice_radio_option').nth(1)).toHaveClass(/slice_radio_option--checked/);
   });

   test('value compares strictly: 1 does not select the option "1"', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: ['1', '2'], value: 1 });
      await expect(c.locator('input[type="radio"]:checked')).toHaveCount(0);
      expect(await c.component.evaluate((el) => el.value)).toBeNull();
   });

   // setComponentProps applies props in the caller's key order, so `value` can
   // arrive before `options` exist. It must still select once they do.
   test('value passed BEFORE options still selects', async ({ mount }) => {
      const c = await mount('RadioGroup', { value: 'team', options: PLANS });
      await expect(c.locator('input[type="radio"]').nth(2)).toBeChecked();
      expect(await c.component.evaluate((el) => el.value)).toBe('team');
   });

   test('nothing is selected by default and value is null', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS });
      await expect(c.locator('input[type="radio"]:checked')).toHaveCount(0);
      expect(await c.component.evaluate((el) => el.value)).toBeNull();
   });

   test('setting value programmatically moves the selection; null clears it', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'free' });
      const radios = c.locator('input[type="radio"]');
      await c.component.evaluate((el) => { el.value = 'team'; });
      await expect(radios.nth(2)).toBeChecked();
      await expect(radios.nth(0)).not.toBeChecked();
      await c.component.evaluate((el) => { el.value = null; });
      await expect(c.locator('input[type="radio"]:checked')).toHaveCount(0);
   });

   test('an unknown value is dropped to null with a warning', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'pro' });
      const value = await c.component.evaluate((el) => { el.value = 'enterprise'; return el.value; });
      expect(value).toBeNull();
      await expect(c.locator('input[type="radio"]:checked')).toHaveCount(0);
   });

   test('replacing options keeps a value that still exists', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'pro' });
      await c.component.evaluate((el) => {
         el.options = [{ label: 'Pro', value: 'pro' }, { label: 'Enterprise', value: 'ent' }];
      });
      await expect(c.locator('input[type="radio"]')).toHaveCount(2);
      await expect(c.locator('input[type="radio"]').nth(0)).toBeChecked();
      expect(await c.component.evaluate((el) => el.value)).toBe('pro');
   });

   test('replacing options clears a value that is gone, without onChange', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'team' }, { spies: ['onChange'] });
      await c.component.evaluate((el) => { el.options = ['A', 'B']; });
      expect(await c.component.evaluate((el) => el.value)).toBeNull();
      await expect(c.locator('input[type="radio"]:checked')).toHaveCount(0);
      expect(await c.events('onChange')).toBe(0);
   });

   test('option objects without a value fall back to their label', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: [{ label: 'Red' }, { label: 'Blue' }], value: 'Blue' });
      await expect(c.locator('input[type="radio"]').nth(1)).toBeChecked();
   });

   test('selectedOption returns the raw option entry', async ({ mount }) => {
      const c = await mount('RadioGroup', {
         options: [{ label: 'Pro', value: 'pro', price: 12 }],
         value: 'pro',
      });
      const option = await c.component.evaluate((el) => el.selectedOption);
      expect(option).toEqual({ label: 'Pro', value: 'pro', price: 12 });
   });

   // ------------------------------------------------------------- handlers

   test('clicking an option selects it and fires onChange(value, option)', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS }, { spies: ['onChange'] });
      await c.locator('.slice_radio_option').nth(1).click();
      await expect(c.locator('input[type="radio"]').nth(1)).toBeChecked();
      expect(await c.component.evaluate((el) => el.value)).toBe('pro');
      await expect.poll(() => c.events('onChange')).toBe(1);
      const args = await c.eventArgs('onChange');
      expect(args.at(-1)).toEqual(['pro', { label: 'Pro', value: 'pro' }]);
   });

   test('clicking the description text also selects (wrapping label)', async ({ mount }) => {
      const c = await mount('RadioGroup', {
         options: [
            { label: 'Standard', value: 'std', description: '3-5 business days' },
            { label: 'Express', value: 'exp', description: 'Next business day' },
         ],
      });
      await c.locator('.slice_radio_description').nth(1).click();
      expect(await c.component.evaluate((el) => el.value)).toBe('exp');
   });

   test('re-clicking the selected option does not fire onChange again', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS }, { spies: ['onChange'] });
      await c.locator('.slice_radio_option').nth(0).click();
      await c.locator('.slice_radio_option').nth(0).click();
      await expect.poll(() => c.events('onChange')).toBe(1);
   });

   test('programmatic value changes do not fire onChange', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS }, { spies: ['onChange'] });
      await c.component.evaluate((el) => { el.value = 'team'; });
      expect(await c.events('onChange')).toBe(0);
   });

   test('onChange can be cleared with null', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS }, { spies: ['onChange'] });
      await c.component.evaluate((el) => { el.onChange = null; });
      await c.locator('.slice_radio_option').nth(2).click();
      expect(await c.events('onChange')).toBe(0);
      expect(await c.component.evaluate((el) => el.value)).toBe('team');
   });

   // ------------------------------------------------------------ keyboard

   test('Tab enters on the selected option; arrows move and select', async ({ mount, page }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'pro' }, { spies: ['onChange'] });
      await c.component.evaluate((el) => el.focus());
      await expect(c.locator('input[type="radio"]').nth(1)).toBeFocused();

      await page.keyboard.press('ArrowDown');
      await expect(c.locator('input[type="radio"]').nth(2)).toBeFocused();
      expect(await c.component.evaluate((el) => el.value)).toBe('team');
      await expect.poll(() => c.events('onChange')).toBe(1);

      await page.keyboard.press('ArrowUp');
      expect(await c.component.evaluate((el) => el.value)).toBe('pro');
   });

   test('focus() with no selection lands on the first enabled option', async ({ mount }) => {
      const c = await mount('RadioGroup', {
         options: [{ label: 'A', value: 'a', disabled: true }, { label: 'B', value: 'b' }],
      });
      await c.component.evaluate((el) => el.focus());
      await expect(c.locator('input[type="radio"]').nth(1)).toBeFocused();
   });

   test('arrow keys skip a disabled option', async ({ mount, page }) => {
      const c = await mount('RadioGroup', {
         options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b', disabled: true },
            { label: 'C', value: 'c' },
         ],
         value: 'a',
      });
      await c.component.evaluate((el) => el.focus());
      await page.keyboard.press('ArrowDown');
      expect(await c.component.evaluate((el) => el.value)).toBe('c');
   });

   test('only one radio of the group is in the tab order', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<button id="before">before</button><div id="host"></div><button id="after">after</button>`);
      await h.page.evaluate(async () => {
         const group = await slice.build('RadioGroup', {
            options: ['A', 'B', 'C'],
            value: 'B',
         });
         document.getElementById('host').appendChild(group);
      });
      await page.locator('#before').focus();
      await page.keyboard.press('Tab');
      await expect(page.locator('#host input[type="radio"]').nth(1)).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.locator('#after')).toBeFocused();
   });

   // ---------------------------------------------------- disabled/required

   test('disabled disables the fieldset and blocks selection', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'free', disabled: true }, { spies: ['onChange'] });
      await expect(c.locator('fieldset')).toBeDisabled();
      await expect(c.locator('input[type="radio"]').nth(1)).toBeDisabled();
      await c.locator('.slice_radio_option').nth(1).click({ force: true });
      expect(await c.component.evaluate((el) => el.value)).toBe('free');
      expect(await c.events('onChange')).toBe(0);
   });

   test('disabled survives an options re-render', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, disabled: true });
      await c.component.evaluate((el) => { el.options = ['X', 'Y']; });
      await expect(c.locator('input[type="radio"]').nth(0)).toBeDisabled();
   });

   test('a disabled option is disabled and marked', async ({ mount }) => {
      const c = await mount('RadioGroup', {
         options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b', disabled: true }],
      });
      await expect(c.locator('input[type="radio"]').nth(1)).toBeDisabled();
      await expect(c.locator('.slice_radio_option').nth(1)).toHaveClass(/slice_radio_option--disabled/);
      await expect(c.locator('input[type="radio"]').nth(0)).toBeEnabled();
   });

   test('required sets native required on every radio and aria-required', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, required: true });
      const radios = c.locator('input[type="radio"]');
      for (let i = 0; i < 3; i += 1) await expect(radios.nth(i)).toHaveAttribute('required', '');
      await expect(c.locator('fieldset')).toHaveAttribute('aria-required', 'true');
      await c.component.evaluate((el) => { el.required = false; });
      await expect(radios.nth(0)).not.toHaveAttribute('required', '');
      await expect(c.locator('fieldset')).not.toHaveAttribute('aria-required', 'true');
   });

   // ------------------------------------------------------------ name/a11y

   test('all radios share one generated name, unique per group', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      const names = await h.page.evaluate(async () => {
         const host = document.getElementById('host');
         const a = await slice.build('RadioGroup', { options: ['1', '2'] });
         const b = await slice.build('RadioGroup', { options: ['1', '2'] });
         host.append(a, b);
         const read = (el) => [...el.querySelectorAll('input')].map((i) => i.name);
         return { a: read(a), b: read(b) };
      });
      expect(new Set(names.a).size).toBe(1);
      expect(new Set(names.b).size).toBe(1);
      expect(names.a[0]).not.toBe(names.b[0]);
   });

   test('name prop sets the radios name, also after a re-render', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, name: 'plan' });
      await expect(c.locator('input[type="radio"]').nth(0)).toHaveAttribute('name', 'plan');
      await c.component.evaluate((el) => { el.options = ['X']; });
      await expect(c.locator('input[type="radio"]').nth(0)).toHaveAttribute('name', 'plan');
   });

   test('a native form submits the selected value under name', async ({ mountHtml }) => {
      const h = await mountHtml(`<form id="f"></form>`);
      const submitted = await h.page.evaluate(async (options) => {
         const form = document.getElementById('f');
         const group = await slice.build('RadioGroup', { options, name: 'plan', value: 'team' });
         form.appendChild(group);
         return new FormData(form).get('plan');
      }, PLANS);
      expect(submitted).toBe('team');
   });

   test('label renders a legend that names the radiogroup', async ({ mount, page }) => {
      const c = await mount('RadioGroup', { options: PLANS, label: 'Plan' });
      await expect(c.locator('legend')).toHaveText('Plan');
      await expect(c.locator('legend')).toBeVisible();
      await expect(page.getByRole('radiogroup', { name: 'Plan' })).toBeVisible();
      await expect(page.getByRole('radio', { name: 'Pro' })).toBeVisible();
   });

   test('no label: the legend is hidden and aria-labelledby is absent', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS });
      await expect(c.locator('legend')).toBeHidden();
      await expect(c.locator('fieldset')).not.toHaveAttribute('aria-labelledby', /.+/);
      await c.component.evaluate((el) => { el.label = 'Later'; });
      await expect(c.locator('legend')).toHaveText('Later');
      await expect(c.locator('fieldset')).toHaveAttribute('aria-labelledby', /.+/);
   });

   test('description is wired with aria-describedby', async ({ mount, page }) => {
      const c = await mount('RadioGroup', {
         options: [{ label: 'Express', value: 'exp', description: 'Next business day' }],
      });
      await expect(c.locator('.slice_radio_description')).toHaveText('Next business day');
      await expect(page.getByRole('radio', { name: 'Express' })).toHaveAccessibleDescription('Next business day');
   });

   // Never display:none (§9): it would drop the radios from the a11y tree and tab order.
   test('radios are visually hidden, not display:none', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS });
      await expect(c.locator('input[type="radio"]').nth(0)).not.toHaveCSS('display', 'none');
      await expect(c.locator('input[type="radio"]').nth(0)).toHaveCSS('clip-path', 'inset(50%)');
   });

   test('keyboard focus is visible on the styled circle', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'free' });
      await c.component.evaluate((el) => el.focus());
      const ring = await c.locator('.slice_radio_mark').nth(0).evaluate((el) => {
         const cs = getComputedStyle(el);
         return { width: cs.outlineWidth, style: cs.outlineStyle };
      });
      expect(ring.style).not.toBe('none');
      expect(parseFloat(ring.width)).toBeGreaterThan(0);
   });

   test('user-supplied labels are text, never markup', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: [{ label: '<img src=x onerror=alert(1)>', value: 'x' }] });
      await expect(c.locator('img')).toHaveCount(0);
      await expect(c.locator('.slice_radio_label')).toHaveText('<img src=x onerror=alert(1)>');
   });

   // ------------------------------------------------------- layout/visual

   test('orientation=horizontal lays options in a row and sets aria-orientation', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, orientation: 'horizontal' });
      await expect(c.locator('.slice_radio_group')).toHaveCSS('flex-direction', 'row');
      await expect(c.locator('fieldset')).toHaveAttribute('aria-orientation', 'horizontal');
   });

   test('invalid orientation falls back to vertical', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, orientation: 'diagonal' });
      await expect(c.locator('.slice_radio_group')).toHaveCSS('flex-direction', 'column');
      await expect(c.locator('fieldset')).toHaveAttribute('aria-orientation', 'vertical');
   });

   test('labelPlacement=left reverses each option', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, labelPlacement: 'left' });
      await expect(c.locator('.slice_radio_option').nth(0)).toHaveCSS('flex-direction', 'row-reverse');
   });

   test('labelPlacement=top stacks the text above the circle', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, labelPlacement: 'top' });
      await expect(c.locator('.slice_radio_option').nth(0)).toHaveCSS('flex-direction', 'column-reverse');
   });

   test('variant applies the matching modifier idempotently', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, variant: 'soft' });
      const fieldset = c.locator('fieldset');
      await expect(fieldset).toHaveClass(/slice_radio_group--soft/);
      await expect(fieldset).not.toHaveClass(/slice_radio_group--default/);
      await c.component.evaluate((el) => { el.variant = 'outlined'; });
      await expect(fieldset).toHaveClass(/slice_radio_group--outlined/);
      await expect(fieldset).not.toHaveClass(/slice_radio_group--soft/);
   });

   test('invalid variant falls back to "default"', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, variant: 'neon' });
      await expect(c.locator('fieldset')).toHaveClass(/slice_radio_group--default/);
   });

   test('variant=plain drops the container chip', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, variant: 'plain', size: 'lg' });
      const fieldset = c.locator('fieldset');
      await expect(fieldset).toHaveCSS('padding-top', '0px');
      await expect(fieldset).toHaveCSS('border-top-width', '0px');
   });

   test('variant=card outlines the selected card with the accent', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, variant: 'card', value: 'pro' });
      const selected = c.locator('.slice_radio_option').nth(1);
      const other = c.locator('.slice_radio_option').nth(0);
      await expect(selected).toHaveClass(/slice_radio_option--checked/);
      const colors = await c.component.evaluate((el) => {
         const [a, b] = el.querySelectorAll('.slice_radio_option');
         const probe = document.createElement('span');
         probe.style.color = 'var(--primary-color)';
         el.appendChild(probe);
         const primary = getComputedStyle(probe).color;
         probe.remove();
         return { selected: getComputedStyle(b).borderTopColor, other: getComputedStyle(a).borderTopColor, primary };
      });
      expect(colors.selected).toBe(colors.primary);
      expect(colors.other).not.toBe(colors.primary);
      await other.click();
      await expect(other).toHaveClass(/slice_radio_option--checked/);
      await expect(selected).not.toHaveClass(/slice_radio_option--checked/);
   });

   test('size sets data-size on the host and scales the options', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      const sizes = await h.page.evaluate(async () => {
         const host = document.getElementById('host');
         const out = {};
         for (const size of ['sm', 'md', 'lg']) {
            const el = await slice.build('RadioGroup', { options: ['A'], size });
            host.appendChild(el);
            out[size] = {
               attr: el.getAttribute('data-size'),
               mark: el.querySelector('.slice_radio_mark').getBoundingClientRect().width,
            };
         }
         return out;
      });
      expect(sizes.sm.attr).toBe('sm');
      expect(sizes.lg.attr).toBe('lg');
      expect(sizes.sm.mark).toBeLessThan(sizes.md.mark);
      expect(sizes.md.mark).toBeLessThan(sizes.lg.mark);
   });

   test('invalid size falls back to "md"', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, size: 'xl' });
      await expect(c.component).toHaveAttribute('data-size', 'md');
   });

   // The enum lists live ONLY in static props (literal arrays for `slice types`).
   // Proof the setters read that list rather than a copy (same probe as Checkbox).
   test('setters read their accepted set from static props, not a copy', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS });
      const result = await c.component.evaluate((el) => {
         const p = el.constructor.props;
         p.variant.allowedValues.push('probe');
         p.size.allowedValues.push('probe-size');
         window.slice.setComponentProps(el, { variant: 'probe', size: 'probe-size' });
         p.variant.allowedValues.pop();
         p.size.allowedValues.pop();
         return {
            variant: el.querySelector('fieldset').classList.contains('slice_radio_group--probe'),
            size: el.getAttribute('data-size'),
         };
      });
      expect(result).toEqual({ variant: true, size: 'probe-size' });
      await c.component.evaluate((el) => window.slice.setComponentProps(el, { variant: 'probe', size: 'probe-size' }));
      await expect(c.locator('fieldset')).toHaveClass(/slice_radio_group--default/);
      await expect(c.component).toHaveAttribute('data-size', 'md');
   });

   test('customColor.accent recolours the selected circle; null restores it', async ({ mount }) => {
      const c = await mount('RadioGroup', { options: PLANS, value: 'free', customColor: { accent: 'rgb(255, 0, 0)' } });
      await expect(c.locator('.slice_radio_mark').nth(0)).toHaveCSS('border-top-color', 'rgb(255, 0, 0)');
      await c.component.evaluate((el) => { el.customColor = null; });
      await expect(c.locator('.slice_radio_mark').nth(0)).not.toHaveCSS('border-top-color', 'rgb(255, 0, 0)');
   });

   // Variants declare their accent on the container; a host-level accent would be
   // shadowed by it unless customColor is resolved below the container.
   test('customColor.accent wins over a variant accent (outlined, card)', async ({ mount }) => {
      for (const variant of ['outlined', 'card']) {
         const c = await mount('RadioGroup', { options: PLANS, value: 'free', variant, customColor: { accent: 'rgb(255, 0, 0)' } });
         await expect(c.locator('.slice_radio_mark').nth(0)).toHaveCSS('border-top-color', 'rgb(255, 0, 0)');
      }
   });

   test('disabled is exposed to assistive tech on the radiogroup', async ({ mount, page }) => {
      await mount('RadioGroup', { options: PLANS, label: 'Plan', disabled: true });
      await expect(page.getByRole('radiogroup', { name: 'Plan' })).toHaveAttribute('aria-disabled', 'true');
      await expect(page.getByRole('radio', { name: 'Pro' })).toBeDisabled();
   });

   // ------------------------------------------------------------ integration

   test('works as a Form field: getValues, setValue and required', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      const out = await h.page.evaluate(async () => {
         const form = await slice.build('Form', {
            schema: [
               {
                  name: 'plan',
                  label: 'Plan',
                  component: 'RadioGroup',
                  required: 'Pick a plan',
                  props: { options: ['free', 'pro'], variant: 'plain' },
               },
            ],
         });
         document.getElementById('host').appendChild(form);
         await new Promise((r) => setTimeout(r, 50));
         const empty = { values: form.getValues(), valid: form.validate() };
         form.setValue('plan', 'pro');
         return { empty, after: { values: form.getValues(), valid: form.validate() } };
      });
      expect(out.empty.values).toEqual({ plan: null });
      expect(out.empty.valid).toBe(false);
      expect(out.after.values).toEqual({ plan: 'pro' });
      expect(out.after.valid).toBe(true);
   });

   test('destroying the group leaves nothing registered and no errors', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      const out = await h.page.evaluate(async () => {
         const before = slice.controller.activeComponents.size;
         const el = await slice.build('RadioGroup', { options: ['A', 'B'] });
         document.getElementById('host').appendChild(el);
         const during = slice.controller.activeComponents.size;
         slice.controller.destroyComponent(el);
         return { before, during, after: slice.controller.activeComponents.size };
      });
      expect(out.during).toBe(out.before + 1);
      expect(out.after).toBe(out.before);
      expect(h.pageErrors()).toEqual([]);
   });
});
