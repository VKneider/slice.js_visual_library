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

   test('two schema changes in one tick do not interleave into a duplicated form', async ({ mount }) => {
      const c = await mount('Form', { schema: [{ component: 'Input', name: 'a', label: 'A' }], sliceId: 'form-under-test' });

      const out = await c.component.evaluate(async (el) => {
         const fields = () => el.querySelectorAll('.slice-form__fields > *').length;

         // Both fire synchronously with no await between them. Without the
         // in-flight guard both pass a boolean check and interleave their awaits.
         el.submitText = 'One';
         el.schema = [{ component: 'Input', name: 'a', label: 'A' }, { component: 'Input', name: 'b', label: 'B' }];
         el.schema = [{ component: 'Input', name: 'c', label: 'C' }];
         await el._render();

         return {
            fields: fields(),
            inputs: el.querySelectorAll('.slice-form__fields input').length,
            built: el._built.length,
         };
      });

      // One render's worth of fields, from the LAST schema — not a merge of all
      // three, which is what interleaving produced.
      expect(out.fields).toBe(1);
      // Three schema changes, each with fields: interleaving would leave
      // more than one input behind.
      expect(out.inputs).toBe(1);
      // Every built node is accounted for: no orphan left behind by the race.
      expect(out.built).toBe(2); // one field + one submit button
      expect(c.pageErrors()).toEqual([]);
   });

   test('destroying a form waits out an in-flight render', async ({ mount }) => {
      const c = await mount('Form', { schema: [{ component: 'Input', name: 'a', label: 'A' }], sliceId: 'form-destroy-me' });

      const out = await c.component.evaluate(async (el) => {
         el.schema = [{ component: 'Input', name: 'b', label: 'B' }];
         el.schema = [{ component: 'Input', name: 'c', label: 'C' }];
         const rendering = el._rendering;
         slice.controller.destroyComponent('form-destroy-me');
         await rendering.catch(() => {});
         return { stillRegistered: slice.controller.activeComponents.has('form-destroy-me') };
      });

      // Without the await in beforeDestroy, the render would keep building
      // fields into a detached form.
      expect(out.stillRegistered).toBe(false);
      expect(c.pageErrors()).toEqual([]);
   });
});
