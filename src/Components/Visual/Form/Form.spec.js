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
// ── Layout API: variant, columns, full, maxWidth ──

test.describe('Form - layout', () => {
   const SCHEMA = [
      { kind: 'section', title: 'Account' },
      { kind: 'field', name: 'firstName', label: 'First name', component: 'Input' },
      { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input' },
      { kind: 'field', name: 'bio', label: 'Bio', component: 'Input', full: true },
   ];

   test('card is the default variant and it draws a surface', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA });

      const state = await c.component.evaluate((el) => {
         const inner = el.querySelector('.slice-form');
         const cs = getComputedStyle(inner);
         return {
            variant: el.dataset.variant,
            padding: cs.padding,
            borderTopWidth: cs.borderTopWidth,
         };
      });

      expect(state.variant).toBe('card');
      expect(Number.parseFloat(state.padding)).toBeGreaterThan(0);
      expect(Number.parseFloat(state.borderTopWidth)).toBeGreaterThan(0);
   });

   test("plain has no surface - for a form already inside a Modal or Card", async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA, variant: 'plain' });

      const state = await c.component.evaluate((el) => {
         const cs = getComputedStyle(el.querySelector('.slice-form'));
         return { variant: el.dataset.variant, padding: cs.padding, borderTopWidth: cs.borderTopWidth };
      });

      expect(state.variant).toBe('plain');
      expect(state.padding).toBe('0px');
      expect(Number.parseFloat(state.borderTopWidth)).toBe(0);
   });

   test('an unknown variant falls back to card rather than rendering unstyled', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA, variant: 'nonsense' });
      expect(await c.component.evaluate((el) => el.dataset.variant)).toBe('card');
   });

   // One mount per test: a second mount() clears the harness root, so a
   // side-by-side comparison in a single test measures the second component
   // twice. This one bit me while writing them.
   test('columns: 1 is a single-column stack', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA, columns: 1 });

      const state = await c.component.evaluate((el) => ({
         declared: getComputedStyle(el).getPropertyValue('--form-columns').trim(),
         tracks: getComputedStyle(el.querySelector('.slice-form__fields'))
            .gridTemplateColumns.split(' ')
            .filter(Boolean).length,
      }));

      expect(state.declared).toBe('1');
      expect(state.tracks).toBe(1);
   });

   test('columns: 2 produces two real tracks', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA, columns: 2 });

      const state = await c.component.evaluate((el) => ({
         declared: getComputedStyle(el).getPropertyValue('--form-columns').trim(),
         tracks: getComputedStyle(el.querySelector('.slice-form__fields'))
            .gridTemplateColumns.split(' ')
            .filter(Boolean).length,
      }));

      expect(state.declared).toBe('2');
      expect(state.tracks).toBe(2);
   });

   test('a `full` field spans every column', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA, columns: 2 });

      const spans = await c.component.evaluate((el) => {
         const out = {};
         for (const f of el.querySelectorAll('.slice-form__field')) {
            out[f.dataset.name] = getComputedStyle(f).gridColumn;
         }
         return out;
      });

      // The opt-out exists for an address or a textarea, which read badly at
      // half width.
      expect(spans.bio).toContain('-1');
      expect(spans.firstName).not.toContain('-1');
   });

   test('sections and separators always span the full row', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA, columns: 2 });

      const spans = await c.component.evaluate((el) => {
         const section = el.querySelector('.slice-form__section');
         return getComputedStyle(section).gridColumn;
      });

      expect(spans).toContain('-1');
   });

   test('maxWidth caps the form', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA, maxWidth: '30rem' });

      const state = await c.component.evaluate((el) => ({
         prop: getComputedStyle(el).getPropertyValue('--form-control').trim(),
         inner: Math.round(el.querySelector('.slice-form').getBoundingClientRect().width),
      }));

      expect(state.prop).toBe('30rem');
      // 30rem resolves to 480px, so the cap is real rather than advisory.
      expect(state.inner).toBeLessThanOrEqual(481);
   });

   test('without maxWidth the default cap applies, not the container width', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA });

      const state = await c.component.evaluate((el) => ({
         prop: getComputedStyle(el).getPropertyValue('--form-control').trim(),
         inner: Math.round(el.querySelector('.slice-form').getBoundingClientRect().width),
      }));

      // 40rem, not the full width of whatever contains it. A text field
      // stretched across a whole docs column is most of why the old demos read
      // as unfinished.
      expect(state.prop).toBe('40rem');
      expect(state.inner).toBeLessThanOrEqual(641);
   });

   test('columns and maxWidth can change at runtime', async ({ mount }) => {
      const c = await mount('Form', { schema: SCHEMA });

      await c.component.evaluate((el) => {
         el.columns = 3;
      });
      await expect
         .poll(() => c.component.evaluate((el) => getComputedStyle(el).getPropertyValue('--form-columns').trim()))
         .toBe('3');

      await c.component.evaluate((el) => {
         el.variant = 'plain';
      });
      expect(await c.component.evaluate((el) => el.dataset.variant)).toBe('plain');
   });
});
// ── Multi-page forms: { kind: 'step' } ──

test.describe('Form - steps', () => {
   const STEP_SCHEMA = [
      { kind: 'step', label: 'Account', description: 'How you sign in', schema: [
         { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },
      ] },
      { kind: 'step', label: 'Profile', description: 'How people see you', schema: [
         { kind: 'field', name: 'nickname', label: 'Nickname', component: 'Input', required: true },
         { kind: 'field', name: 'newsletter', label: 'News', component: 'Switch', valueProp: 'checked' },
      ] },
      { kind: 'step', label: 'Done', description: 'All set', schema: [
         { kind: 'field', name: 'notes', label: 'Notes', component: 'Input' },
      ] },
   ];

   test('a plain schema is one implicit step, with no progress or Back', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [{ kind: 'field', name: 'a', label: 'A', component: 'Input' }],
      });

      const state = await c.component.evaluate((el) => ({
         stepCount: el.stepCount,
         isStepped: el.isStepped,
         steps: el.querySelectorAll('.slice-form__step').length,
         progress: el.querySelectorAll('.slice-form__progress').length,
         backHidden: el.querySelector('.slice-form__actions slice-button')?.hidden ?? null,
         visible: [...el.querySelectorAll('.slice-form__step')].filter((s) => !s.hidden).length,
      }));

      expect(state.stepCount).toBe(1);
      expect(state.isStepped).toBe(false);
      expect(state.steps).toBe(1);
      expect(state.progress).toBe(0);
      expect(state.visible).toBe(1);
   });

   test('steps render one at a time, with only the first visible', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA });

      const state = await c.component.evaluate((el) => ({
         stepCount: el.stepCount,
         isStepped: el.isStepped,
         steps: el.querySelectorAll('.slice-form__step').length,
         visible: [...el.querySelectorAll('.slice-form__step')].filter((s) => !s.hidden).length,
         firstHeading: el.querySelector('.slice-form__step:not([hidden]) .slice-form__step-title')?.textContent,
      }));

      expect(state.stepCount).toBe(3);
      expect(state.isStepped).toBe(true);
      expect(state.steps).toBe(3);
      // The [hidden] companion is what makes this true; see Form.css.
      expect(state.visible).toBe(1);
      expect(state.firstHeading).toBe('Account');
   });

   test('Next advances, but only when the steps behind are valid', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA });

      // Email is required and empty, so Next must refuse.
      const refused = await c.component.evaluate((el) => el.nextStep());
      expect(refused).toBe(false);
      expect(await c.component.evaluate((el) => el.stepIndex)).toBe(0);
      // And it said why, in place.
      await expect(c.locator('.slice-form__field[data-name="email"] .slice-form__error')).toHaveText(
         'This field is required'
      );

      // Fill it, and now it goes through.
      await c.component.evaluate((el) => el.setValue('email', 'a@b.co'));
      expect(await c.component.evaluate((el) => el.nextStep())).toBe(true);
      expect(await c.component.evaluate((el) => el.stepIndex)).toBe(1);
      await expect(c.locator('.slice-form__step[data-step="1"]')).toBeVisible();
      await expect(c.locator('.slice-form__step[data-step="0"]')).toBeHidden();
   });

   test('Back never validates - leaving an incomplete step is allowed', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA });

      await c.component.evaluate((el) => el.setValue('email', 'a@b.co'));
      await c.component.evaluate((el) => el.nextStep());
      expect(await c.component.evaluate((el) => el.stepIndex)).toBe(1);

      // Nickname is required and still empty. Going BACK must still work.
      expect(await c.component.evaluate((el) => el.prevStep())).toBe(true);
      expect(await c.component.evaluate((el) => el.stepIndex)).toBe(0);
   });

   test('a value typed on step 1 survives the whole round trip', async ({ mount }) => {
      // The reason every step's controls stay built rather than being torn down
      // and re-created per step.
      const c = await mount('Form', { schema: STEP_SCHEMA });

      const values = await c.component.evaluate(async (el) => {
         el.setValue('email', 'keep@example.com');
         el.setValue('nickname', 'vicky');
         el.setValue('newsletter', true);
         el.nextStep();
         el.nextStep();
         el.prevStep();
         el.prevStep();
         return el.getValues();
      });

      expect(values.email).toBe('keep@example.com');
      expect(values.nickname).toBe('vicky');
      expect(values.newsletter).toBe(true);
   });

   test('the last step submits instead of advancing', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA });

      const state = await c.component.evaluate(async (el) => {
         el.setValue('email', 'a@b.co');
         el.nextStep();
         el.setValue('nickname', 'vicky');
         el.nextStep();
         return {
            index: el.stepIndex,
            buttonLabel: el.$nextBtn.value,
            // Past the end, Next is a no-op rather than an error.
            advanced: el.nextStep(),
         };
      });

      expect(state.index).toBe(2);
      expect(state.buttonLabel).toBe('Submit');
      expect(state.advanced).toBe(false);
   });

   test('submit on a stepped form validates EVERY step, not just the last', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA, submitText: 'Finish' });

      const state = await c.component.evaluate((el) => {
         el.gotoStep(2); // jump to the end without filling anything
         return { submitted: el.submit() };
      });

      expect(state.submitted).toBe(false);
      // The error is on step 1, which is not even on screen - the progress
      // indicator is the only way back to it.
      await expect(c.locator('.slice-form__field[data-name="email"] .slice-form__error')).toHaveText(
         'This field is required'
      );
   });

   test('rechecking one step does not wipe the errors on another', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA });

      // Put a real error on BOTH steps on purpose: validate() covers everything.
      const before = await c.component.evaluate((el) => {
         el.validate();
         return [...el.querySelectorAll('.slice-form__error')].map((e) => e.textContent).filter(Boolean);
      });
      expect(before).toHaveLength(2);

      // Now recheck ONLY step 0, with it fixed. Step 1's error must survive:
      // clearing everything on every validate would wipe the reason the user
      // was sent back, which is the whole point of a per-step error.
      const after = await c.component.evaluate(async (el) => {
         el.setValue('email', 'a@b.co');
         el.nextStep();
         return {
            email: el.querySelector('.slice-form__field[data-name="email"] .slice-form__error').textContent,
            nickname: el.querySelector('.slice-form__field[data-name="nickname"] .slice-form__error').textContent,
         };
      });

      expect(after.email).toBe('');
      expect(after.nickname).toBe('This field is required');
   });

   test('the progress indicator cannot be used to skip validation', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA });

      // Email is required and empty. Clicking step 3 in the indicator must be
      // refused exactly as Next would be, or the indicator is a hole in the
      // form rather than a shortcut through it.
      const blocked = await c.component.evaluate((el) => el.gotoStep(2));
      expect(blocked).toBe(false);
      expect(await c.component.evaluate((el) => el.stepIndex)).toBe(0);
      await expect(c.locator('.slice-form__field[data-name="email"] .slice-form__error')).toHaveText(
         'This field is required'
      );

      // Going BACK is always allowed, valid or not.
      await c.component.evaluate((el) => el.setValue('email', 'a@b.co'));
      await c.component.evaluate((el) => el.nextStep());
      expect(await c.component.evaluate((el) => el.gotoStep(0))).toBe(true);
      expect(await c.component.evaluate((el) => el.stepIndex)).toBe(0);
   });

   test('progress marks done, current and todo', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA });

      const states = async () =>
         c.component.evaluate(() =>
            [...document.querySelectorAll('.slice-form__progress-step')].map((s) => s.dataset.state)
         );

      expect(await states()).toEqual(['current', 'todo', 'todo']);

      await c.component.evaluate((el) => el.setValue('email', 'a@b.co'));
      await c.component.evaluate((el) => el.nextStep());
      expect(await states()).toEqual(['done', 'current', 'todo']);

      await c.component.evaluate((el) => el.prevStep());
      expect(await states()).toEqual(['current', 'todo', 'todo']);
   });

   test('Back is hidden on the first step and Next becomes Submit on the last', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA, submitText: 'Finish' });

      const state = async () =>
         c.component.evaluate((el) => {
            const buttons = [...el.$actions.querySelectorAll('slice-button')];
            return {
               backHidden: buttons[0]?.hidden ?? null,
               backLabel: buttons[0]?.value,
               nextLabel: buttons[1]?.value,
            };
         });

      expect(await state()).toMatchObject({ backHidden: true, nextLabel: 'Next' });

      await c.component.evaluate(async (el) => {
         el.setValue('email', 'a@b.co');
         el.nextStep();
      });
      expect((await state()).backHidden).toBe(false);

      await c.component.evaluate(async (el) => {
         el.setValue('nickname', 'v');
         el.nextStep();
      });
      expect((await state()).nextLabel).toBe('Finish');
   });

   test('nextText is configurable', async ({ mount }) => {
      const c = await mount('Form', { schema: STEP_SCHEMA, nextText: 'Continue', submitText: 'Finish' });
      const label = await c.component.evaluate((el) => el.$nextBtn.value);
      expect(label).toBe('Continue');
   });

   test('a step change is announced through a live region, not by moving focus', async ({ mount }) => {
      // Moving focus to the new step's heading did announce it, but it painted
      // a focus ring around the heading that read as a text input sitting on
      // the page. A polite live region announces the same thing invisibly.
      const c = await mount('Form', { schema: STEP_SCHEMA });

      const live = await c.component.evaluate(async (el) => {
         const region = el.querySelector('.slice-form__live');
         const before = region?.textContent ?? null;
         el.setValue('email', 'a@b.co');
         el.nextStep();
         await new Promise((r) => setTimeout(r, 60));
         return {
            exists: !!region,
            ariaLive: region?.getAttribute('aria-live'),
            before,
            after: region?.textContent,
            // Nothing should have been focused.
            activeTag: document.activeElement?.tagName ?? null,
            activeIsStepTitle: !!document.activeElement?.matches?.('[data-step-heading]'),
         };
      });

      expect(live.exists).toBe(true);
      expect(live.ariaLive).toBe('polite');
      expect(live.before).toBe('');
      expect(live.after).toBe('Step 2 of 3: Profile');
      expect(live.activeIsStepTitle).toBe(false);
   });

   test('the live region is visually hidden but not display:none', async ({ mount }) => {
      // display:none would stop it being announced at all.
      const c = await mount('Form', { schema: STEP_SCHEMA });
      const cs = await c.component.evaluate((el) => {
         const region = el.querySelector('.slice-form__live');
         const style = getComputedStyle(region);
         return { display: style.display, w: Math.round(region.getBoundingClientRect().width) };
      });
      expect(cs.display).not.toBe('none');
      expect(cs.w).toBeLessThanOrEqual(1);
   });

   test('items before the first step land in an unlabelled leading step', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [
            { kind: 'field', name: 'intro', label: 'Intro', component: 'Input' },
            { kind: 'step', label: 'One', schema: [{ kind: 'field', name: 'a', label: 'A', component: 'Input' }] },
         ],
      });

      const state = await c.component.evaluate((el) => ({
         stepCount: el.stepCount,
         // Both items survive - the leading one is not dropped.
         fields: el.querySelectorAll('.slice-form__field').length,
      }));

      expect(state.stepCount).toBe(2);
      expect(state.fields).toBe(2);
   });

   test('a step with no schema renders an empty step, not a crash', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [
            { kind: 'step', label: 'Empty', schema: [] },
            { kind: 'step', label: 'One', schema: [{ kind: 'field', name: 'a', label: 'A', component: 'Input' }] },
         ],
      });

      expect(await c.component.evaluate((el) => el.nextStep())).toBe(true);
      expect(await c.component.evaluate((el) => el.stepIndex)).toBe(1);
   });
});
// ── Repeatable groups: { kind: 'group' } ──

test.describe('Form - repeatable groups', () => {
   const GROUP = {
      kind: 'group',
      name: 'phones',
      label: 'Phone numbers',
      itemLabel: 'Phone',
      min: 1,
      max: 3,
      fields: [
         { name: 'number', label: 'Number', component: 'Input', required: true },
         { name: 'note', label: 'Note', component: 'Input' },
      ],
   };

   test('renders min items to start, never below min', async ({ mount }) => {
      const c = await mount('Form', { schema: [GROUP] });

      const state = await c.component.evaluate((el) => ({
         items: el.querySelectorAll('.slice-form__group-item').length,
         addButtons: el.querySelectorAll('.slice-form__group-actions slice-button').length,
         removeButtons: el.querySelectorAll('.slice-form__group-remove').length,
      }));

      expect(state.items).toBe(1);
      expect(state.addButtons).toBe(1);
      // With one item and max > 1, each item gets a Remove.
      expect(state.removeButtons).toBe(1);
   });

   test('Add appends an item without disturbing what is already typed', async ({ mount }) => {
      const c = await mount('Form', { schema: [GROUP] });

      const values = await c.component.evaluate(async (el) => {
         el.setValue('phones[0].number', '600 000 000');
         el.querySelector('.slice-form__group-actions .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));
         return el.getValues();
      });

      expect(values.phones).toEqual([
         { number: '600 000 000', note: '' },
         { number: '', note: '' },
      ]);
   });

   test('getValues nests the array the way the schema declared it', async ({ mount }) => {
      // Internally flat ("phones[0].number"); on the way out it is an array of
      // objects, which is what the caller wrote in the schema.
      const c = await mount('Form', { schema: [GROUP] });

      const values = await c.component.evaluate(async (el) => {
         el.setValue('phones[0].number', '111');
         el.setValue('phones[0].note', 'home');
         el.querySelector('.slice-form__group-actions .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));
         el.setValue('phones[1].number', '222');
         return el.getValues();
      });

      expect(Array.isArray(values.phones)).toBe(true);
      expect(values.phones).toHaveLength(2);
      expect(values.phones[0]).toEqual({ number: '111', note: 'home' });
      expect(values.phones[1]).toEqual({ number: '222', note: '' });
   });

   test('a group and a plain field coexist without colliding', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [
            { kind: 'field', name: 'email', label: 'Email', component: 'Input' },
            GROUP,
         ],
      });

      const values = await c.component.evaluate(async (el) => {
         el.setValue('email', 'a@b.co');
         el.setValue('phones[0].number', '999');
         return el.getValues();
      });

      expect(values.email).toBe('a@b.co');
      expect(values.phones[0].number).toBe('999');
   });

   test('Remove drops the item and renumbers the rest', async ({ mount }) => {
      // The keys are positional, so a removal has to renumber or the second
      // item would keep reporting itself as phones[1] while sitting at index 0.
      const c = await mount('Form', { schema: [GROUP] });

      const values = await c.component.evaluate(async (el) => {
         el.querySelector('.slice-form__group-actions .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));
         el.querySelector('.slice-form__group-actions .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));

         el.setValue('phones[0].number', 'AAA');
         el.setValue('phones[1].number', 'BBB');
         el.setValue('phones[2].number', 'CCC');

         // Remove the middle one.
         el.querySelectorAll('.slice-form__group-remove .slice_button_container')[1].click();
         await new Promise((r) => setTimeout(r, 300));
         return el.getValues();
      });

      expect(values.phones).toHaveLength(2);
      expect(values.phones[0].number).toBe('AAA');
      // CCC survived the renumbering and is now second.
      expect(values.phones[1].number).toBe('CCC');
   });

   test('Remove never goes below min', async ({ mount }) => {
      const c = await mount('Form', { schema: [GROUP] });

      const count = await c.component.evaluate(async (el) => {
         el.querySelector('.slice-form__group-remove .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));
         return el.querySelectorAll('.slice-form__group-item').length;
      });

      expect(count).toBe(1);
   });

   test('Add is hidden once max is reached', async ({ mount }) => {
      const c = await mount('Form', { schema: [GROUP] });

      const state = await c.component.evaluate(async (el) => {
         const add = el.querySelector('.slice-form__group-actions slice-button');
         const before = { items: el.querySelectorAll('.slice-form__group-item').length, hidden: add.hidden };
         el.querySelector('.slice-form__group-actions .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));
         el.querySelector('.slice-form__group-actions .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));
         return {
            before,
            after: { items: el.querySelectorAll('.slice-form__group-item').length, hidden: add.hidden },
         };
      });

      expect(state.before).toEqual({ items: 1, hidden: false });
      // Capped at max: 3 items, and no fourth button to get there.
      expect(state.after.items).toBe(3);
      expect(state.after.hidden).toBe(true);
   });

   test('required applies to every item, so an empty one blocks submit', async ({ mount }) => {
      const c = await mount('Form', { schema: [GROUP] });

      const state = await c.component.evaluate(async (el) => {
         el.setValue('phones[0].number', '111');
         el.querySelector('.slice-form__group-actions .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));
         const submitted = el.submit();
         return {
            submitted,
            errors: [...el.querySelectorAll('.slice-form__group-item .slice-form__error')]
               .map((e) => e.textContent)
               .filter(Boolean),
         };
      });

      expect(state.submitted).toBe(false);
      // Only the empty second item is flagged.
      expect(state.errors).toHaveLength(1);
      expect(state.errors[0]).toBe('This field is required');
   });

   test('removing an item destroys its controls rather than orphaning them', async ({ mount }) => {
      const c = await mount('Form', { schema: [GROUP] });

      const state = await c.component.evaluate(async (el) => {
         const before = slice.controller.activeComponents.size;
         el.querySelector('.slice-form__group-actions .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 250));
         const afterAdd = slice.controller.activeComponents.size;
         el.querySelector('.slice-form__group-remove .slice_button_container').click();
         await new Promise((r) => setTimeout(r, 300));
         return {
            before,
            afterAdd,
            after: slice.controller.activeComponents.size,
            items: el.querySelectorAll('.slice-form__group-item').length,
         };
      });

      expect(state.items).toBe(1);
      // Adding an item builds its controls; removing it has to take exactly
      // them back down, so the count returns to the baseline rather than
      // climbing. Left orphaned, it would stay at afterAdd.
      expect(state.afterAdd).toBeGreaterThan(state.before);
      expect(state.after).toBe(state.before);
   });

   test('a seeded group starts with its value and reset restores it', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [{ ...GROUP, value: [{ number: '555', note: 'office' }] }],
      });

      const state = await c.component.evaluate(async (el) => {
         const seeded = el.getValues();
         el.setValue('phones[0].number', 'changed');
         el.reset();
         return { seeded, afterReset: el.getValues() };
      });

      expect(state.seeded.phones[0]).toEqual({ number: '555', note: 'office' });
      // Reset has to restore the ITEM, not just the top-level fields.
      expect(state.afterReset.phones[0]).toEqual({ number: '555', note: 'office' });
   });

   test('a group inside a step keeps its items when stepping away and back', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [
            { kind: 'step', label: 'One', schema: [{ kind: 'field', name: 'a', label: 'A', component: 'Input' }] },
            { kind: 'step', label: 'Contact', schema: [GROUP] },
         ],
      });

      const values = await c.component.evaluate(async (el) => {
         el.setValue('a', 'first');
         el.nextStep();
         el.setValue('phones[0].number', '777');
         el.prevStep();
         el.nextStep();
         return el.getValues();
      });

      expect(values.a).toBe('first');
      expect(values.phones[0].number).toBe('777');
   });

   test('a group without a name is skipped rather than rendering unkeyable', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [{ kind: 'group', label: 'No name', fields: [{ name: 'x', label: 'X', component: 'Input' }] }],
      });

      expect(await c.component.evaluate((el) => el.querySelectorAll('.slice-form__group').length)).toBe(0);
   });
});