import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Function-free schema so it survives the harness's prop serialization. Schemas
// with validate() functions are set in-browser (see the custom-validate test).
const SCHEMA = [
  { kind: 'section', title: 'Account', description: 'Login details' },
  { kind: 'field', name: 'name', label: 'Name', component: 'Input', required: true, props: { placeholder: 'Your name' } },
  { kind: 'separator' },
  { kind: 'field', name: 'email', label: 'Email', component: 'Input', props: {} }
];

test.describe('Form', () => {
  test('smoke: renders sections, separators and fields from the schema', async ({ mount }) => {
    const c = await mount('Form', { schema: SCHEMA });
    expect(c.pageErrors()).toEqual([]);
    await expect(c.locator('.slice-form__section-title')).toHaveText('Account');
    await expect(c.locator('.slice-form__separator')).toHaveCount(1);
    await expect(c.locator('.slice-form__field')).toHaveCount(2);
    await expect(c.locator('.slice-form__field[data-name="name"] .slice-form__label')).toContainText('Name');
  });

  test('required validation blocks submit and shows an error', async ({ mount, page }) => {
    const c = await mount('Form', { schema: SCHEMA }, { spies: ['onSubmit'] });
    const ok = await page.evaluate(() => window.__sliceMounted.submit());
    expect(ok).toBe(false);
    await expect(c.locator('.slice-form__field[data-name="name"]')).toHaveClass(/slice-form__field--error/);
    await expect(c.locator('.slice-form__field[data-name="name"] .slice-form__error')).toHaveText('This field is required');
    expect(await c.events('onSubmit')).toBe(0);
  });

  test('valid values submit and call onSubmit with the collected values', async ({ mount, page }) => {
    const c = await mount('Form', { schema: SCHEMA }, { spies: ['onSubmit'] });
    await page.evaluate(() => {
      window.__sliceMounted.setValue('name', 'Ada');
      window.__sliceMounted.setValue('email', 'ada@slice.dev');
    });
    const ok = await page.evaluate(() => window.__sliceMounted.submit());
    expect(ok).toBe(true);
    await expect(async () => {
      expect(await c.eventArgs('onSubmit')).toEqual([[{ name: 'Ada', email: 'ada@slice.dev' }]]);
    }).toPass({ timeout: 3000 });
  });

  test('custom validate shows the returned message', async ({ mount, page }) => {
    const c = await mount('Form', {}, { spies: ['onSubmit'] });
    await page.evaluate(() => {
      window.__sliceMounted.schema = [
        {
          kind: 'field',
          name: 'email',
          label: 'Email',
          component: 'Input',
          validate: (v) => (/\S+@\S+/.test(v) ? null : 'Invalid email')
        }
      ];
    });
    await expect(c.locator('.slice-form__field[data-name="email"]')).toBeVisible();
    await page.evaluate(() => {
      window.__sliceMounted.setValue('email', 'nope');
      window.__sliceMounted.submit();
    });
    await expect(c.locator('.slice-form__field[data-name="email"] .slice-form__error')).toHaveText('Invalid email');
    expect(await c.events('onSubmit')).toBe(0);
  });

  test('reset restores initial values and clears errors', async ({ mount, page }) => {
    const c = await mount('Form', {
      schema: [{ kind: 'field', name: 'name', label: 'Name', component: 'Input', value: 'initial' }],
      resetText: 'Reset'
    });
    await page.evaluate(() => window.__sliceMounted.setValue('name', 'changed'));
    const after = await page.evaluate(() => {
      window.__sliceMounted.reset();
      return window.__sliceMounted.getValues();
    });
    expect(after).toEqual({ name: 'initial' });
  });
});
