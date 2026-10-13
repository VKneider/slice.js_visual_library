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
});
