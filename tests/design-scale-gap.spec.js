import { test, expect } from '../playwright/harness/sliceFixtures.js';

/**
 * PENDING — the conformance test the scale is missing.
 *
 * This is deliberately skipped. It is the test that decides whether the density
 * scale is a property of this codebase or a habit of the two components that
 * happened to be migrated first.
 *
 * Measured today, with scale.css loaded:
 *
 *   Button    data-size=sm    28px at sm, 36px at md   ✅
 *   Input     data-size=sm    28px at sm, 36px at md   ✅
 *   Select    data-size=null  41px at sm AND at md    ❌ ignored, silently
 *   Textarea  data-size=null  89.2px at sm AND at md  ❌ ignored, silently
 *   Switch    data-size=null  35.4px                    ❌ ignored, silently
 *
 * 41 of 43 components accept `size` and do nothing with it: no error, no
 * warning, no data attribute. A consumer who asks for a smaller Select gets the
 * same Select, with no signal that anything was ignored.
 *
 * That is the failure the recipe table was supposed to remove — a list someone
 * has to remember to extend — reintroduced one level up. A hand-written test
 * over the two migrated components is not enforcement, and this file is the
 * reminder.
 *
 * TO ENABLE: drive the loop from SIZE_RECIPE (every control, every size, compare
 * against --control-height) instead of listing components by hand, then drop the
 * skip. See DESIGN_SYSTEM.md.
 */
test.describe('PENDING - every control honours the density scale', () => {
   test.skip(
      'no control may accept size and ignore it',
      async ({ mountHtml }) => {
         const h = await mountHtml(`<div></div>`);
         const href = h.page.url().replace(/\/.*$/, '/Themes/scale.css');
         await h.page.addStyleTag({ url: href });
         await h.page.waitForTimeout(300);

         const offenders = await h.page.evaluate(async () => {
            // Driven by the recipe, not by a list. The list is the bug.
            const { SIZE_VALUES } = await import('/Components/spike/recipes.js');
            const PARTICIPANTS = ['Button', 'Input', 'Select', 'Textarea', 'Switch', 'Chip', 'Badge'];

            const stage = document.createElement('div');
            stage.style.cssText = 'padding:20px;background:#fff;width:600px';
            document.body.appendChild(stage);

            const r2 = (n) => Math.round(n * 10) / 10;
            const bad = [];

            for (const name of PARTICIPANTS) {
               for (const size of SIZE_VALUES) {
                  const el = await slice.build(name, { size });
                  if (!el) {
                     bad.push(`${name}@${size}: build returned null`);
                     continue;
                  }
                  stage.appendChild(el);
                  await new Promise((r) => setTimeout(r, 200));

                  if (el.getAttribute('data-size') !== size) {
                     bad.push(`${name}@${size}: data-size=${el.getAttribute('data-size')} (ignored)`);
                  }
                  el.remove();
               }
            }
            return bad;
         });

         expect(offenders, 'controls that accept size and ignore it').toEqual([]);
      },
      'conformance is not enforced yet — 41 of 43 controls ignore the scale silently'
   );
});