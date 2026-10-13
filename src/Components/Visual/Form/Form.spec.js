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

// ── A field that renders no control must never be silent ──
//
// `slice.build` returns null for an unregistered component name, and a schema
// item may omit `component` entirely. Both used to fall straight through the
// `if (instance)` guard: the field painted a label, a description and an empty
// error slot with NOTHING between them - which reads as a layout accident -
// and the field then vanished from getValues() with no way for the caller to
// tell why.

test.describe('Form - a field with no renderable control', () => {
   const SCHEMA = [
      { kind: 'field', name: 'ok', label: 'Valid', component: 'Input' },
      { kind: 'field', name: 'noName', label: 'No component declared', description: 'Helpful text' },
      { kind: 'field', name: 'ghost', label: 'Missing component', component: 'NoSuchComponent' },
   ];

   test('an unregistered component renders a visible broken marker, not an empty hole', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA });

      const markers = c.locator('.slice-form__broken');
      await expect(markers).toHaveCount(2);
      // The note says WHICH component is missing, not just that something is.
      await expect(markers.nth(1)).toContainText('NoSuchComponent');
      await expect(markers.nth(0)).toContainText('No component declared');

      // And the broken field is marked for CSS / tests.
      await expect(c.locator('.slice-form__field[data-broken]')).toHaveCount(2);
   });

   test('a valid field is never marked broken', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA });

      const valid = c.locator('.slice-form__field[data-name="ok"]');
      await expect(valid).toHaveCount(1);
      await expect(valid).not.toHaveAttribute('data-broken', 'true');
      await expect(valid.locator('.slice-form__broken')).toHaveCount(0);
      await expect(valid.locator('input')).toHaveCount(1);
   });

   test('the broken field still renders its label and description', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA });

      const field = c.locator('.slice-form__field[data-name="noName"]');
      await expect(field.locator('.slice-form__label')).toHaveText('No component declared');
      await expect(field.locator('.slice-form__description')).toHaveText('Helpful text');
   });

   test('it warns, naming the field and the reason', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA });

      // Spy on slice.logger rather than reading consoleMessages(): the point is
      // that FORM calls the logger with an actionable message, not how the
      // framework formats it for the console.
      const warnings = await c.component.evaluate(async (el) => {
         const seen = [];
         const original = slice.logger.logWarning;
         slice.logger.logWarning = (sliceId, message) => seen.push(`${sliceId} :: ${message}`);

         el._render();
         await new Promise((r) => setTimeout(r, 400));

         slice.logger.logWarning = original;
         return seen.filter((t) => /rendered no control/.test(t));
      });

      expect(warnings).toHaveLength(2);
      // Both reasons are distinguishable - "no component" is a different
      // mistake from "that name is not registered".
      const all = warnings.join('\n');
      expect(all).toContain('noName');
      expect(all).toContain('the schema item has no `component`');
      expect(all).toContain('"NoSuchComponent" is not a registered component');
      // And the consequence is stated, since it changes the submitted payload.
      expect(all).toContain('absent from getValues()');
   });

   test('getValues() omits the broken fields and keeps the valid one', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA });

      const values = await c.component.evaluate((el) => el.getValues());

      // Documented contract: a field with no control contributes nothing, which
      // is why it has to be visible rather than silent.
      expect(Object.keys(values)).toEqual(['ok']);
   });

   test('a form whose schema is entirely valid produces no warning at all', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [{ kind: 'field', name: 'a', label: 'A', component: 'Input' }],
      });

      const warnings = await c.component.evaluate(async (el) => {
         const seen = [];
         const original = slice.logger.logWarning;
         slice.logger.logWarning = (sliceId, message) => seen.push(`${sliceId} :: ${message}`);

         el._render();
         await new Promise((r) => setTimeout(r, 400));

         slice.logger.logWarning = original;
         return seen.filter((t) => /rendered no control/.test(t));
      });

      expect(warnings).toEqual([]);
      await expect(c.locator('.slice-form__broken')).toHaveCount(0);
   });
});