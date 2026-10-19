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

   // Regression: email used to be validated only when a consumer called
   // validateValue() by hand, so a bad address showed no error while typing.
   test('an invalid email shows the error state while typing', async ({ mount }) => {
      const c = await mount('Input', { type: 'email', placeholder: 'Email' });
      const input = c.locator('input');

      await input.fill('not-an-email');
      await expect(c.locator('.slice_input')).toHaveClass(/\berror\b/);

      await input.fill('someone@example.com');
      await expect(c.locator('.slice_input')).not.toHaveClass(/\berror\b/);
   });

   // Regression: emptying a field that had failed left the stale error classes
   // behind, so the field kept showing as invalid until a manual re-check.
   test('clearing a filled field drops the stale error state', async ({ mount }) => {
      const c = await mount('Input', { type: 'email', placeholder: 'Email' });
      const input = c.locator('input');

      await input.fill('not-an-email');
      await expect(c.locator('.slice_input')).toHaveClass(/\berror\b/);

      await input.fill('');
      await expect(c.locator('.slice_input')).not.toHaveClass(/\berror\b/);
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
