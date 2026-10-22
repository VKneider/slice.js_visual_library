import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Baseline contract for the Textarea visual component.
// Derived from Textarea.js / Textarea.html:
//   - root structure: .slice_textarea > label.slice_textarea_placeholder + textarea.textarea_area
//   - props: placeholder, value, rows, maxlength, required (.required class), disabled,
//     readonly (.readonly class), autoGrow, conditions (validateValue),
//     onChange (spied handler, fires with new value)

test.describe('Textarea', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Textarea');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_textarea')).toBeVisible();
      await expect(c.locator('textarea')).toHaveCount(1);
      expect(c.pageErrors()).toEqual([]);
   });

   test('placeholder prop reflects into the label and aria-label', async ({ mount }) => {
      const c = await mount('Textarea', { placeholder: 'Your message' });
      await expect(c.locator('.slice_textarea_placeholder')).toHaveText('Your message');
      await expect(c.locator('textarea')).toHaveAttribute('aria-label', 'Your message');
   });

   test('value prop reflects into the native textarea', async ({ mount }) => {
      const c = await mount('Textarea', { value: 'hello world' });
      await expect(c.locator('textarea')).toHaveValue('hello world');
   });

   test('non-empty value floats the label (slice_textarea_value class)', async ({ mount }) => {
      const c = await mount('Textarea', { value: 'filled' });
      await expect(c.locator('.slice_textarea_placeholder')).toHaveClass(/slice_textarea_value/);
   });

   test('rows prop is applied to the native textarea', async ({ mount }) => {
      const c = await mount('Textarea', { rows: 6 });
      await expect(c.locator('textarea')).toHaveAttribute('rows', '6');
   });

   test('maxlength prop limits the native textarea', async ({ mount }) => {
      const c = await mount('Textarea', { maxlength: 10 });
      await expect(c.locator('textarea')).toHaveAttribute('maxlength', '10');
   });

   test('required prop adds the required class to the container', async ({ mount }) => {
      const c = await mount('Textarea', { required: true });
      await expect(c.locator('.slice_textarea')).toHaveClass(/required/);
   });

   test('disabled prop disables the native textarea', async ({ mount }) => {
      const c = await mount('Textarea', { disabled: true });
      await expect(c.locator('textarea')).toBeDisabled();
   });

   test('readonly prop makes the field display-only but still selectable', async ({ mount }) => {
      const c = await mount('Textarea', { value: 'generated payload', readonly: true });
      const ta = c.locator('textarea');

      await expect(ta).toHaveAttribute('readonly', '');
      // The whole point of `readonly` over `disabled`: generated output has to
      // stay copyable. A disabled field drops out of the tab order AND makes
      // the text unselectable.
      await expect(ta).not.toBeDisabled();
      await expect(c.locator('.slice_textarea')).toHaveClass(/readonly/);

      await ta.selectText();
      const selected = await ta.evaluate((node) => node.value.slice(node.selectionStart, node.selectionEnd));
      expect(selected).toBe('generated payload');
   });

   test('readonly can be toggled after mount', async ({ mount }) => {
      const c = await mount('Textarea', { value: 'x' });
      const ta = c.locator('textarea');
      await expect(ta).not.toHaveAttribute('readonly', '');

      await c.component.evaluate((el) => {
         el.readonly = true;
      });
      await expect(ta).toHaveAttribute('readonly', '');

      await c.component.evaluate((el) => {
         el.readonly = false;
      });
      await expect(ta).not.toHaveAttribute('readonly', '');
   });

   test('typing updates value and floats the label', async ({ mount }) => {
      const c = await mount('Textarea', { placeholder: 'Type here' });
      const ta = c.locator('textarea');
      await ta.fill('some typed content');
      await expect(ta).toHaveValue('some typed content');
      await expect(c.locator('.slice_textarea_placeholder')).toHaveClass(/slice_textarea_value/);
   });

   test('onChange fires with the new value on input', async ({ mount }) => {
      const c = await mount('Textarea', { placeholder: 'Notes' }, { spies: ['onChange'] });
      await c.locator('textarea').fill('hi');
      await expect.poll(() => c.events('onChange')).toBeGreaterThan(0);
      const args = await c.eventArgs('onChange');
      expect(args.at(-1)).toEqual(['hi']);
   });

   test('autoGrow disables manual resize', async ({ mount }) => {
      const c = await mount('Textarea', { autoGrow: true });
      await expect(c.locator('textarea')).toHaveCSS('resize', 'none');
   });

   // Regression: init() runs while the node is still detached, so the first
   // grow() measured scrollHeight 0 and left the field collapsed at 0px.
   test('autoGrow sizes to its content instead of collapsing to 0px', async ({ mount }) => {
      const long = Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n');
      const c = await mount('Textarea', { autoGrow: true, value: long });

      await expect.poll(async () =>
         c.locator('textarea').evaluate((el) => parseFloat(el.style.height) || 0)
      ).toBeGreaterThan(40);
      const box = await c.locator('textarea').boundingBox();
      expect(box.height).toBeGreaterThan(40);
   });

   test('autoGrow keeps the last good height while hidden and re-measures on reveal', async ({ mount, page }) => {
      const long = Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n');
      const c = await mount('Textarea', { autoGrow: true, value: long });
      const heightOf = () =>
         c.locator('textarea').evaluate((el) => parseFloat(el.style.height) || 0);

      await expect.poll(heightOf).toBeGreaterThan(40);
      const grown = await heightOf();

      await page.evaluate(() => {
         document.querySelector('[data-test-root]').style.display = 'none';
      });
      // There is no layout while hidden, so a naive measurement would be 0 and
      // collapse the field. grow() must preserve the last good height instead.
      await c.component.evaluate((el) => el.grow());
      expect(await heightOf()).toBe(grown);

      await page.evaluate(() => {
         document.querySelector('[data-test-root]').style.display = '';
      });
      await expect.poll(heightOf).toBeGreaterThan(40);
   });

   // Judged on blur without calling validateValue(), then live once shown.
   test('conditions are validated on blur, then follow the value as it is fixed', async ({ mount }) => {
      const c = await mount('Textarea', { conditions: { minLength: 5 } });
      await c.locator('textarea').fill('hey');
      await c.locator('textarea').blur();
      await expect(c.locator('.slice_textarea')).toHaveClass(/is-invalid/);

      await c.locator('textarea').fill('hello there');
      await expect(c.locator('.slice_textarea')).not.toHaveClass(/is-invalid/);
   });

   test('validateValue enforces conditions (minLength)', async ({ mount }) => {
      const c = await mount('Textarea', { conditions: { minLength: 5 } });
      const ta = c.locator('textarea');

      await ta.fill('hey');
      expect(await c.component.evaluate((el) => el.validateValue())).toBe(false);

      await ta.fill('hello there');
      expect(await c.component.evaluate((el) => el.validateValue())).toBe(true);
   });

   test('clear empties the value and resets the label', async ({ mount }) => {
      const c = await mount('Textarea', { value: 'to be cleared' });
      await c.component.evaluate((el) => el.clear());
      await expect(c.locator('textarea')).toHaveValue('');
      await expect(c.locator('.slice_textarea_placeholder')).not.toHaveClass(/slice_textarea_value/);
   });

   test('visual: textarea with placeholder @visual', async ({ mount }) => {
      const c = await mount('Textarea', { placeholder: 'Message' });
      await expect(c.component).toHaveScreenshot('textarea-default.png');
   });

});

// Input and Textarea are the same concept and must float their label the same
// way. These specs compare their COMPUTED styles rather than restating the
// values, so they fail the moment one of them drifts.

/** Mounts both fields in one page and reads their computed label styles. */
async function readBoth(h) {
   return h.page.evaluate(async () => {
      const input = await slice.build('Input', { sliceId: 'cmp-input', label: 'Name', value: 'Ada' });
      const textarea = await slice.build('Textarea', { sliceId: 'cmp-textarea', label: 'Bio', value: 'text' });
      document.body.appendChild(input);
      document.body.appendChild(textarea);

      const read = (host, selector) => {
         const label = host.querySelector(selector);
         if (!label) return null;
         const cs = getComputedStyle(label);
         return {
            backgroundColor: cs.backgroundColor,
            padding: cs.padding,
            borderRadius: cs.borderRadius,
            transformOrigin: cs.transformOrigin,
            transitionProperty: cs.transitionProperty,
         };
      };

      // The floated state is the one that used to carry the notch.
      const out = {
         input: read(input, '.slice_input_value'),
         textarea: read(textarea, '.slice_textarea_value'),
      };
      return out;
   });
}

test.describe('Input / Textarea — shared floating label', () => {
   test('the floated label paints no background, so it cannot cut the border', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      // A notch has to hide behind SOME colour. Transparent is the only value
      // that is correct on every surface, because there is no surface to match.
      const out = await readBoth(h);
      for (const [name, styles] of Object.entries(out)) {
         expect(styles, `${name} has no label`).not.toBeNull();
         expect(styles.backgroundColor, `${name} label background`).toBe('rgba(0, 0, 0, 0)');
         expect(styles.padding, `${name} label padding`).toBe('0px');
      }
      expect(h.pageErrors()).toEqual([]);
   });

   test('both fields float the label identically', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      const out = await readBoth(h);

      expect(out.input).toEqual(out.textarea);
   });

   test('both anchor the label at the same origin and transition the same properties', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      const out = await readBoth(h);

      expect(out.input.transformOrigin).toBe(out.textarea.transformOrigin);
      // `transition: all` animates every property, including colour — which is
      // how the old notch flickered while it resized mid-float.
      expect(out.input.transitionProperty).toBe(out.textarea.transitionProperty);
      expect(out.input.transitionProperty).not.toBe('all');
   });

   test('the label sits clear of the field border', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const tops = await h.page.evaluate(async () => {
         const read = async (name, selector) => {
            const host = await slice.build(name, { sliceId: `top-${name}`, label: 'L', value: 'v' });
            document.body.appendChild(host);
            const label = host.querySelector(selector);
            const field = host.querySelector('input, textarea');
            return {
               labelTop: label.getBoundingClientRect().top,
               fieldTop: field.getBoundingClientRect().top,
            };
         };
         return {
            input: await read('Input', '.slice_input_value'),
            textarea: await read('Textarea', '.slice_textarea_value'),
         };
      });

      // The whole label must be ABOVE the field's top edge. Overlapping it was
      // only readable because the notch painted over the border underneath.
      for (const [name, t] of Object.entries(tops)) {
         expect(t.labelTop, `${name} label top`).toBeLessThanOrEqual(t.fieldTop);
      }
   });

   test('the error shake is identical on both', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async () => {
         const read = async (name, cls) => {
            const host = await slice.build(name, { sliceId: `shake-${name}` });
            document.body.appendChild(host);
            host.classList.add('error');
            const target = host.querySelector(cls) || host;
            const cs = getComputedStyle(target);
            return { name: cs.animationName, duration: cs.animationDuration, iterations: cs.animationIterationCount };
         };
         return {
            input: await read('Input', '.slice_input'),
            textarea: await read('Textarea', '.slice_textarea'),
         };
      });

      // Different keyframe NAMES is fine — they cannot be shared across files.
      // Same duration, same iteration count: a shake that runs forever reads as
      // a broken field.
      expect(out.input.duration).toBe(out.textarea.duration);
      expect(out.input.iterations).toBe(out.textarea.iterations);
      expect(out.input.iterations).toBe('1');
   });
});

test.describe('Textarea — field', () => {
   test('label, help and counter work as on Input', async ({ mount, page }) => {
      const c = await mount('Textarea', { label: 'Bio', help: 'Shown on your profile', maxlength: 40, showCount: true });
      await expect(page.getByLabel('Bio')).toHaveCount(1);
      await expect(c.locator('.slice_textarea_message')).toHaveText('Shown on your profile');
      await c.locator('textarea').fill('Hello there');
      await expect(c.locator('.slice_textarea_count')).toHaveText('11 / 40');
   });

   test('required: validate() shows the shared message', async ({ mount }) => {
      const c = await mount('Textarea', { label: 'Feedback', required: true });
      expect(await c.component.evaluate((el) => el.validate())).toBe(false);
      await expect(c.locator('.slice_textarea_message')).toHaveText('This field is required');
      await expect(c.locator('textarea')).toHaveAttribute('aria-invalid', 'true');
   });

   test('maxRows caps autoGrow, and the rest scrolls', async ({ mount }) => {
      const c = await mount('Textarea', { label: 'Notes', autoGrow: true, rows: 2, maxRows: 4 });
      const ta = c.locator('textarea');
      await ta.fill(Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n'));
      const state = await ta.evaluate((el) => {
         const line = parseFloat(getComputedStyle(el).lineHeight);
         return { rows: Math.round(el.clientHeight / line), overflow: getComputedStyle(el).overflowY };
      });
      expect(state.rows).toBe(4);
      expect(state.overflow).toBe('auto');
   });

   test('resize: none removes the handle', async ({ mount }) => {
      const c = await mount('Textarea', { resize: 'none' });
      expect(await c.locator('textarea').evaluate((el) => getComputedStyle(el).resize)).toBe('none');
   });

   test('Ctrl+Enter calls onSubmit with the value', async ({ mount }) => {
      const c = await mount('Textarea', { label: 'Message' }, { spies: ['onSubmit'] });
      await c.locator('textarea').fill('Ship it');
      await c.locator('textarea').press('Control+Enter');
      await expect.poll(() => c.events('onSubmit')).toBe(1);
      expect((await c.eventArgs('onSubmit'))[0][0]).toBe('Ship it');
   });

   test('sizes and variants share Input’s attributes', async ({ mount }) => {
      const c = await mount('Textarea', { size: 'lg', variant: 'ghost' });
      await expect(c.component).toHaveAttribute('data-size', 'lg');
      await expect(c.component).toHaveAttribute('data-variant', 'ghost');
   });

   test('an empty required field with a minimum stays quiet until validate()', async ({ mount }) => {
      const c = await mount('Textarea', { label: 'Feedback', required: true, minlength: 20 });
      const ta = c.locator('textarea');
      await ta.fill('x');
      await ta.fill('');
      await ta.blur();
      await expect(c.locator('.slice_textarea')).not.toHaveClass(/is-invalid/);
      expect(await c.component.evaluate((el) => el.validate())).toBe(false);
      await expect(c.locator('.slice_textarea')).toHaveClass(/is-invalid/);
   });
});