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

   test('visual: input with placeholder @visual', async ({ mount }) => {
      const c = await mount('Input', { placeholder: 'Email' });
      await expect(c.component).toHaveScreenshot('input-default.png');
   });
});
