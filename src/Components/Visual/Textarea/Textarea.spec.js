import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Baseline contract for the Textarea visual component.
// Derived from Textarea.js / Textarea.html:
//   - root structure: .slice_textarea > label.slice_textarea_placeholder + textarea.textarea_area
//   - props: placeholder, value, rows, maxlength, required (.required class), disabled,
//     autoGrow, conditions (validateValue), onChange (spied handler, fires with new value)

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
