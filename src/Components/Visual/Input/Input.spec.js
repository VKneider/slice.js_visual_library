import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Baseline contract for the Input visual component.
// Assertions are derived from Input.js / Input.html:
//   - root structure: .slice_input > label.slice_input_placeholder + input.input_area
//   - props: placeholder, value, type, required (.required class), disabled, secret (eye icon)
//   - no spied handler prop: the component exposes no onChange/onInput callback prop;
//     `input` events are handled internally only, so interaction is asserted via DOM state.

test.describe('Input', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Input');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_input')).toBeVisible();
      await expect(c.locator('input')).toHaveCount(1);
      expect(c.pageErrors()).toEqual([]);
   });

   test('placeholder prop reflects into the placeholder label', async ({ mount }) => {
      const c = await mount('Input', { placeholder: 'Your name' });
      await expect(c.locator('.slice_input_placeholder')).toHaveText('Your name');
   });

   test('value prop reflects into the native input', async ({ mount }) => {
      const c = await mount('Input', { value: 'hello' });
      await expect(c.locator('input')).toHaveValue('hello');
   });

   test('non-empty value adds the slice_input_value class to the placeholder', async ({ mount }) => {
      const c = await mount('Input', { value: 'filled' });
      await expect(c.locator('.slice_input_placeholder')).toHaveClass(/slice_input_value/);
   });

   test('type prop is applied to the native input', async ({ mount }) => {
      const c = await mount('Input', { type: 'email' });
      await expect(c.locator('input')).toHaveAttribute('type', 'email');
   });

   test('required prop adds the required class to the container', async ({ mount }) => {
      const c = await mount('Input', { required: true });
      await expect(c.locator('.slice_input')).toHaveClass(/required/);
   });

   test('disabled prop disables the native input', async ({ mount }) => {
      const c = await mount('Input', { disabled: true });
      await expect(c.locator('input')).toBeDisabled();
   });

   test('secret password input renders a working visibility toggle', async ({ mount }) => {
      const c = await mount('Input', { type: 'password', secret: true });
      const input = c.locator('input');
      const eye = c.locator('.slice_eye_icon');

      await expect(input).toHaveAttribute('type', 'password');
      await expect(eye).toBeVisible();
      await expect(eye).toHaveAttribute('role', 'button');

      // Click reveals the value (password -> text) and toggles back.
      await eye.click();
      await expect(input).toHaveAttribute('type', 'text');
      await eye.click();
      await expect(input).toHaveAttribute('type', 'password');
      expect(c.pageErrors()).toEqual([]);
   });

   test('non-secret input keeps the eye toggle hidden', async ({ mount }) => {
      const c = await mount('Input', { placeholder: 'Email' });
      await expect(c.locator('.slice_eye_icon')).toBeHidden();
   });

   test('typing into the input updates value and placeholder state', async ({ mount }) => {
      const c = await mount('Input', { placeholder: 'Type here' });
      const input = c.locator('input');
      await input.fill('typed text');
      await expect(input).toHaveValue('typed text');
      await expect(c.locator('.slice_input_placeholder')).toHaveClass(/slice_input_value/);
   });

   // Email used to be validated only when a consumer called validateValue()
   // by hand. It is now judged when the person leaves the field (not on every
   // keystroke, which also made the field shake as they typed), and from then
   // on the error follows the value live.
   test('an invalid email shows its error on blur, and clears as soon as it is fixed', async ({ mount }) => {
      const c = await mount('Input', { type: 'email', placeholder: 'Email' });
      const input = c.locator('input');

      await input.fill('not-an-email');
      await expect(c.locator('.slice_input')).not.toHaveClass(/is-invalid/);
      await input.blur();
      await expect(c.locator('.slice_input')).toHaveClass(/is-invalid/);
      await expect(c.locator('.slice_input_message')).toHaveText('Enter a valid email address');
      await expect(input).toHaveAttribute('aria-invalid', 'true');

      await input.fill('someone@example.com');
      await expect(c.locator('.slice_input')).not.toHaveClass(/is-invalid/);
      await expect(c.locator('.slice_input_footer')).toBeHidden();
   });

   // Regression: emptying a field that had failed left the stale error behind.
   test('clearing a filled field drops the stale error state', async ({ mount }) => {
      const c = await mount('Input', { type: 'email', placeholder: 'Email' });
      const input = c.locator('input');

      await input.fill('not-an-email');
      await input.blur();
      await expect(c.locator('.slice_input')).toHaveClass(/is-invalid/);

      await input.fill('');
      await expect(c.locator('.slice_input')).not.toHaveClass(/is-invalid/);
   });

   test('the secret toggle swaps its glyph from aria-pressed, not text', async ({ mount }) => {
      const c = await mount('Input', { type: 'password', secret: true });
      const eye = c.locator('.slice_eye_icon');
      await expect(eye).toHaveAttribute('aria-pressed', 'false');
      await expect(eye.locator('.eye-open')).toBeVisible();
      await expect(eye.locator('.eye-off')).toBeHidden();

      await eye.click();
      await expect(eye).toHaveAttribute('aria-pressed', 'true');
      await expect(eye.locator('.eye-off')).toBeVisible();
      await expect(c.locator('input')).toHaveAttribute('type', 'text');
   });

   test('onChange fires with the new value on every input', async ({ mount }) => {
      const c = await mount('Input', { placeholder: 'Name' }, { spies: ['onChange'] });
      await c.locator('input').fill('Ada');
      await expect.poll(() => c.events('onChange')).toBeGreaterThan(0);
      const args = await c.eventArgs('onChange');
      expect(args.at(-1)).toEqual(['Ada']);
   });

   test('onChange can be cleared with null', async ({ mount }) => {
      const c = await mount('Input', {}, { spies: ['onChange'] });
      await c.component.evaluate((el) => { el.onChange = null; });
      await c.locator('input').fill('Ada');
      expect(await c.events('onChange')).toBe(0);
   });

   test('visual: input with placeholder @visual', async ({ mount }) => {
      const c = await mount('Input', { placeholder: 'Email' });
      await expect(c.component).toHaveScreenshot('input-default.png');
   });

   // ── interface polish, from the make-interfaces-feel-better pass ─────────
   //
   // Each of these was found by measuring, and each had a plausible-looking
   // verification that passed for the wrong reason. The comments say which.

   test.describe('interface polish', () => {
      test('secret toggle clears the 40px floor, and the extra area really clicks', async ({
         mountHtml,
      }) => {
         const h = await mountHtml(`<div></div>`);

         const geom = await h.page.evaluate(async () => {
            document.body.innerHTML = '';
            const stage = document.createElement('div');
            stage.style.cssText = 'padding:40px';
            document.body.appendChild(stage);

            const input = await slice.build('Input', {
               placeholder: 'Password',
               type: 'password',
               secret: true,
            });
            stage.appendChild(input);
            await new Promise((r) => setTimeout(r, 350));

            const eye = input.querySelector('.slice_eye_icon');
            const field = input.querySelector('.input_area');
            field.value = 'hunter2';
            const cs = getComputedStyle(eye, '::after');
            const er = eye.getBoundingClientRect();

            return {
               // Read the pseudo's OWN box. Deriving it from the insets is how the
               // first verifier got 18px for a 40px target.
               hit: { w: parseFloat(cs.width), h: parseFloat(cs.height) },
               // Inside the target, outside the glyph.
               probeX: Math.round(er.left + er.width / 2),
               probeY: Math.round(er.top + er.height / 2 - 16),
               type: field.type,
            };
         });

         expect(geom.hit.w, 'hit area width').toBeGreaterThanOrEqual(40);
         expect(geom.hit.h, 'hit area height').toBeGreaterThanOrEqual(40);

         await h.page.mouse.click(geom.probeX, geom.probeY);
         await h.page.waitForTimeout(250);

         const after = await h.page.evaluate(() => {
            const field = document.querySelector('.input_area');
            return { type: field.type, value: field.value };
         });

         expect(after.type, 'clicking outside the glyph must still toggle').not.toBe(geom.type);
         expect(after.value, 'toggling must not destroy the value').toBe('hunter2');
      });

      test('a long placeholder is clipped instead of escaping the field', async ({ mountHtml }) => {
         const h = await mountHtml(`<div></div>`);

         const got = await h.page.evaluate(async () => {
            document.body.innerHTML = '';
            const stage = document.createElement('div');
            stage.style.cssText = 'padding:40px';
            document.body.appendChild(stage);

            // A NARROW field. At 1200px this label measured 372px and looked fine,
            // which is exactly why the first check passed without the fix.
            const narrow = document.createElement('div');
            narrow.style.cssText = 'width:220px';
            const input = await slice.build('Input', {
               placeholder: 'Una etiqueta de ejemplo deliberadamente muy larga',
            });
            narrow.appendChild(input);
            stage.appendChild(narrow);
            await new Promise((r) => setTimeout(r, 350));

            const box = input.querySelector('.slice_input');
            const ph = input.querySelector('.slice_input_placeholder');
            const br = box.getBoundingClientRect();
            const pr = ph.getBoundingClientRect();

            return {
               overflows: pr.width > br.width,
               pastRight: pr.right - br.right,
               ellipsis: getComputedStyle(ph).textOverflow === 'ellipsis',
            };
         });

         expect(got.overflows, 'label must not exceed the field').toBe(false);
         expect(got.pastRight, 'label must stay inside the field').toBeLessThanOrEqual(0);
         expect(got.ellipsis, 'a clipped label should show an ellipsis').toBe(true);
      });

      test('the label sits above the field and never crosses its border', async ({ mountHtml }) => {
         const h = await mountHtml(`<div></div>`);

         const states = await h.page.evaluate(async () => {
            document.body.innerHTML = '';
            const stage = document.createElement('div');
            stage.style.cssText = 'padding:30px;width:320px';
            document.body.appendChild(stage);

            const mk = async (opts, after) => {
               const input = await slice.build('Input', opts);
               stage.appendChild(input);
               await new Promise((r) => setTimeout(r, 300));
               if (after) after(input);
               await new Promise((r) => setTimeout(r, 700));
               const box = input.querySelector('.slice_input');
               const ph = input.querySelector('.slice_input_placeholder');
               const br = box.getBoundingClientRect();
               const pr = ph.getBoundingClientRect();
               return {
                  // Positive means the label's bottom is BELOW the field's top edge,
                  // i.e. it is sitting on or inside the box.
                  overlaps: +(pr.bottom - br.top).toFixed(2),
                  crossesBorder: pr.top < br.top && pr.bottom > br.top,
                  labelVisible: pr.height > 0,
               };
            };

            return {
               resting: await mk({ placeholder: 'Email address' }),
               focused: await mk({ placeholder: 'Email address' }, (i) =>
                  i.querySelector('.input_area').focus()
               ),
               filled: await mk({ placeholder: 'Email address' }, (i) => {
                  const f = i.querySelector('.input_area');
                  f.value = 'victor@ejemplo.com';
                  f.dispatchEvent(new Event('input', { bubbles: true }));
                  f.blur();
               }),
               error: await mk({ placeholder: 'Email address', type: 'email' }, (i) => {
                  const f = i.querySelector('.input_area');
                  f.value = 'nope';
                  f.dispatchEvent(new Event('input', { bubbles: true }));
               }),
            };
         });

         for (const [name, s] of Object.entries(states)) {
            // The bug this replaces: a label resting on the border was cut by it,
            // and the only available fixes were painting a colour (wrong on any
            // surface but one) or splitting the border. Above the field there is
            // nothing to cross.
            // At rest the label belongs INSIDE the field: that is the placeholder
            // position. Once floated it must be entirely clear above the edge.
            if (name === 'resting') {
               expect(s.overlaps, 'resting: the label belongs inside the field').toBeGreaterThan(0);
            } else {
               expect(s.overlaps, `${name}: the floated label must clear the top edge`).toBeLessThan(0);
            }

            // The bug this replaces: a label resting ON the border was cut by it,
            // and the only available fixes were painting a colour (wrong on any
            // surface but one) or splitting the border. The destination is now above
            // the edge, so nothing crosses it — asserted for every state.
            expect(s.crossesBorder, `${name}: nothing may cross the border`).toBe(false);
            // It also no longer disappears when the field has a value.
            expect(s.labelVisible, `${name}: label must stay visible`).toBe(true);
         }

         // And it must actually move: the float is the point, not a side effect.
         const offsets = Object.values(states).map((s) => s.overlaps);
         expect(new Set(offsets).size, 'the float must change the label position').toBeGreaterThan(1);
      });
   });
});

// ── The field system (label, variants, adornments, help / error, validation) ──

test.describe('Input — field', () => {
   test('a label is a real <label for>: the field is found by its name', async ({ mount, page }) => {
      const c = await mount('Input', { label: 'Full name', placeholder: 'Ana López' });
      await expect(page.getByLabel('Full name')).toHaveCount(1);
      // With a label, the placeholder is the native hint again.
      await expect(c.locator('input')).toHaveAttribute('placeholder', 'Ana López');
   });

   test('placeholder alone is still the floating label (older API)', async ({ mount }) => {
      const c = await mount('Input', { placeholder: 'Email' });
      await expect(c.locator('.slice_input_placeholder')).toHaveText('Email');
      await expect(c.locator('input')).toHaveAttribute('placeholder', '');
   });

   test("labelPlacement: 'above' puts the label in the flow over the field", async ({ mount }) => {
      const c = await mount('Input', { label: 'Company', labelPlacement: 'above' });
      const label = await c.locator('.slice_input_placeholder').boundingBox();
      const field = await c.locator('.slice_input').boundingBox();
      expect(label.y + label.height).toBeLessThanOrEqual(field.y);
      expect(await c.locator('.slice_input_placeholder').evaluate((el) => getComputedStyle(el).position)).toBe('static');
   });

   test('sizes match Select: 32, 42 and 50px', async ({ mount, page }) => {
      const c = await mount('Input', { label: 'Size' });
      const height = () => c.locator('.slice_input').evaluate((el) => Math.round(el.getBoundingClientRect().height));
      expect(await height()).toBe(42);
      await page.evaluate(() => { window.__sliceMounted.size = 'sm'; });
      expect(await height()).toBe(32);
      await page.evaluate(() => { window.__sliceMounted.size = 'lg'; });
      expect(await height()).toBe(50);
   });

   test('variants are reflected on the host', async ({ mount, page }) => {
      const c = await mount('Input', { variant: 'filled' });
      await expect(c.component).toHaveAttribute('data-variant', 'filled');
      await page.evaluate(() => { window.__sliceMounted.variant = 'nope'; });
      await expect(c.component).toHaveAttribute('data-variant', 'outlined');
   });

   test('icon, prefix and suffix render around the field; a prefix keeps the label up', async ({ mount }) => {
      const c = await mount('Input', { label: 'Price', icon: 'search', prefix: '$', suffix: 'USD' });
      await expect(c.locator('.slice_input_icon slice-icon')).toHaveCount(1);
      await expect(c.locator('.slice_input_prefix')).toHaveText('$');
      await expect(c.locator('.slice_input_suffix')).toHaveText('USD');
      await expect(c.locator('.slice_input_placeholder')).toHaveClass(/slice_input_value/);
   });

   test('clearable: the ✕ appears with a value, clears it, and Escape clears too', async ({ mount }) => {
      const c = await mount('Input', { label: 'Search', clearable: true }, { spies: ['onChange'] });
      const input = c.locator('input');
      await expect(c.locator('.slice_input_clear')).toBeHidden();
      await input.fill('modal');
      await expect(c.locator('.slice_input_clear')).toBeVisible();
      await c.locator('.slice_input_clear').click();
      await expect(input).toHaveValue('');
      await expect(input).toBeFocused();
      const args = await c.eventArgs('onChange');
      expect(args.at(-1)).toEqual(['']);

      await input.fill('again');
      await input.press('Escape');
      await expect(input).toHaveValue('');
   });

   test('help shows under the field; an error replaces it and is announced', async ({ mount, page }) => {
      const c = await mount('Input', { label: 'Username', help: 'Letters and numbers only' });
      const message = c.locator('.slice_input_message');
      await expect(message).toHaveText('Letters and numbers only');
      await expect(c.locator('input')).toHaveAttribute('aria-describedby', await message.getAttribute('id'));

      await page.evaluate(() => { window.__sliceMounted.error = 'That username is taken'; });
      await expect(message).toHaveText('That username is taken');
      await expect(message).toHaveClass(/slice_input_message--error/);
      await expect(c.locator('input')).toHaveAttribute('aria-invalid', 'true');

      await page.evaluate(() => { window.__sliceMounted.error = ''; });
      await expect(message).toHaveText('Letters and numbers only');
      await expect(c.locator('input')).toHaveAttribute('aria-invalid', 'false');
   });

   test('showCount counts against maxlength', async ({ mount }) => {
      const c = await mount('Input', { label: 'Handle', maxlength: 20, showCount: true });
      await expect(c.locator('.slice_input_count')).toHaveText('0 / 20');
      await c.locator('input').fill('ana_lopez');
      await expect(c.locator('.slice_input_count')).toHaveText('9 / 20');
   });

   // An empty field is never turned red on its own: not on blur, not when its
   // text is deleted. "Required" and "too short" wait for validate() (submit).
   test('an empty required field stays quiet until validate()', async ({ mount }) => {
      const c = await mount('Input', { label: 'Name', required: true, minlength: 3 });
      const input = c.locator('input');
      await input.focus();
      await input.blur();
      await expect(c.locator('.slice_input')).not.toHaveClass(/is-invalid/);

      await input.fill('A');
      await input.fill('');
      await input.blur();
      await expect(c.locator('.slice_input')).not.toHaveClass(/is-invalid/);
      await expect(c.locator('.slice_input_footer')).toBeHidden();
      expect(await input.evaluate((el) => el.required)).toBe(true);

      expect(await c.component.evaluate((el) => el.validate())).toBe(false);
      await expect(c.locator('.slice_input_message')).toHaveText('This field is required');
   });

   test('an error on screen goes away when the text is deleted, instead of turning into "required"', async ({ mount }) => {
      const c = await mount('Input', { label: 'Code', required: true, minlength: 4 });
      const input = c.locator('input');
      await input.fill('ab');
      await input.blur();
      await expect(c.locator('.slice_input_message')).toHaveText('Use at least 4 characters');
      await input.fill('');
      await expect(c.locator('.slice_input')).not.toHaveClass(/is-invalid/);
      await expect(c.locator('.slice_input_footer')).toBeHidden();
   });

   test('validate() shows the error with one shake and returns false', async ({ mount }) => {
      const c = await mount('Input', { label: 'Name', required: true });
      const valid = await c.component.evaluate((el) => el.validate());
      expect(valid).toBe(false);
      await expect(c.locator('.slice_input')).toHaveClass(/\berror\b/);
      await expect(c.locator('.slice_input')).not.toHaveClass(/\berror\b/, { timeout: 2000 });
      await expect(c.locator('.slice_input')).toHaveClass(/is-invalid/);
   });

   test('validationMessage reports without showing anything', async ({ mount }) => {
      const c = await mount('Input', { label: 'Age', type: 'number', min: 18, value: '12' });
      expect(await c.component.evaluate((el) => el.validationMessage)).toBe('Must be 18 or more');
      await expect(c.locator('.slice_input_footer')).toBeHidden();
   });

   test('lengths, a custom validator and custom messages', async ({ mount, page }) => {
      const c = await mount('Input', { label: 'Code', minlength: 4, messages: { minlength: 'Too short: {minlength}+' } });
      const read = () => c.component.evaluate((el) => el.validationMessage);
      await c.locator('input').fill('ab');
      expect(await read()).toBe('Too short: 4+');
      await page.evaluate(() => {
         window.__sliceMounted.validator = (v) => (v.startsWith('X') ? null : 'Must start with X');
      });
      await c.locator('input').fill('abcd');
      expect(await read()).toBe('Must start with X');
      await c.locator('input').fill('Xbcd');
      expect(await read()).toBe('');
   });

   test("validateOn: 'input' judges while typing; 'manual' never shows on its own", async ({ mount, page }) => {
      const c = await mount('Input', { label: 'Email', type: 'email', validateOn: 'input' });
      await c.locator('input').fill('nope');
      await expect(c.locator('.slice_input')).toHaveClass(/is-invalid/);

      await page.evaluate(() => {
         const m = window.__sliceMounted;
         m.validateOn = 'manual';
         m.clear();
      });
      await c.locator('input').fill('nope');
      await c.locator('input').blur();
      await expect(c.locator('.slice_input')).not.toHaveClass(/is-invalid/);
   });

   test('debounce: onChange fires once after the typing stops', async ({ mount }) => {
      const c = await mount('Input', { label: 'Search', debounce: 150 }, { spies: ['onChange'] });
      await c.locator('input').pressSequentially('hello', { delay: 20 });
      await expect.poll(() => c.events('onChange')).toBe(1);
      expect((await c.eventArgs('onChange'))[0]).toEqual(['hello']);
   });

   test('onEnter receives the value', async ({ mount }) => {
      const c = await mount('Input', { label: 'Search' }, { spies: ['onEnter'] });
      await c.locator('input').fill('slice');
      await c.locator('input').press('Enter');
      await expect.poll(() => c.events('onEnter')).toBe(1);
      expect((await c.eventArgs('onEnter'))[0][0]).toBe('slice');
   });

   test('name makes the field part of a native <form>', async ({ mountHtml, page }) => {
      await mountHtml('<form id="f"></form>');
      const data = await page.evaluate(async () => {
         const input = await slice.build('Input', { label: 'Email', name: 'email', value: 'a@b.co' });
         document.getElementById('f').appendChild(input);
         return Object.fromEntries(new FormData(document.getElementById('f')));
      });
      expect(data).toEqual({ email: 'a@b.co' });
   });

   test('destroying it destroys its Icon', async ({ mount, page }) => {
      const c = await mount('Input', { label: 'Find', icon: 'search' });
      await expect(c.locator('slice-icon')).toHaveCount(1);
      const iconId = await c.locator('slice-icon').evaluate((el) => el.sliceId);
      await page.evaluate(() => slice.controller.destroyComponent(window.__sliceMounted));
      expect(await page.evaluate((id) => slice.controller.activeComponents.has(id), iconId)).toBe(false);
   });
});