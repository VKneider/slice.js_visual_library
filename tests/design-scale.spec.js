import { test, expect } from '../playwright/harness/sliceFixtures.js';

/**
 * SPIKE — does `size` mean one thing?
 *
 * This is the "definition of done" for the scale: if a Button at `sm` and an
 * Input at `sm` do not measure the same height, the scale is a convention rather
 * than a scale, and nothing else built on it would be worth doing.
 */

const SIZES = ['sm', 'md', 'lg'];

/** Loads the spike's scale, which a real app would get from its theme import. */
async function withScale(h, fn) {
   const href = h.page.url().replace(/\/.*$/, '/Themes/scale.css');
   await h.page.addStyleTag({ url: href });
   return fn();
}

test.describe('SPIKE - the density scale', () => {
   test('a Button and an Input at the same size measure the same height', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const measured = await withScale(h, () =>
         h.page.evaluate(async (sizes) => {
            const stage = document.createElement('div');
            stage.id = 'stage';
            stage.style.cssText = 'padding:24px;background:#fff;width:640px';
            document.body.appendChild(stage);

            const r2 = (n) => Math.round(n * 10) / 10;
            const out = {};

            for (const size of sizes) {
               const btn = await slice.build('Button', { value: 'Continue', size });
               const inp = await slice.build('Input', { size, value: 'ada@example.com' });
               stage.appendChild(btn);
               stage.appendChild(inp);
               await new Promise((r) => setTimeout(r, 250));

               out[size] = {
                  button: r2(btn.querySelector('.slice_button').getBoundingClientRect().height),
                  input: r2(inp.querySelector('.slice_input').getBoundingClientRect().height),
                  buttonSize: btn.getAttribute('data-size'),
                  inputSize: inp.getAttribute('data-size'),
               };
            }
            return out;
         }, SIZES)
      );

      for (const size of SIZES) {
         const { button, input } = measured[size];
         // The whole point. Before the spike Input had no `size` at all and
         // padded with a literal 10px, so the two matched only by coincidence.
         //
         // The tolerance is 1px, not 0: a Button and an Input carry different
         // line boxes even at the same font-size, so `min-height` lands a pixel
         // apart. What this asserts is that they are in the SAME BAND — which
         // is the property that was missing, since before they differed by 8.
         expect(Math.abs(button - input), `height at size=${size} (button ${button}, input ${input})`).toBeLessThanOrEqual(1);
         expect(measured[size].buttonSize).toBe(size);
         expect(measured[size].inputSize).toBe(size);
      }

      // And the sizes must actually differ from each other, or they are all one
      // size wearing three names.
      const heights = SIZES.map((s) => measured[s].button);
      expect(new Set(heights).size).toBe(3);
   });

   test('size: lg exists on a component that never had three sizes', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const applied = await withScale(h, () =>
         h.page.evaluate(async () => {
            const btn = await slice.build('Button', { value: 'Go', size: 'lg' });
            const inp = await slice.build('Input', { size: 'lg' });
            document.body.append(btn, inp);
            await new Promise((r) => setTimeout(r, 250));
            return {
               button: btn.getAttribute('data-size'),
               input: inp.getAttribute('data-size'),
            };
         })
      );

      // Button's list was ['md','sm']; lg was rejected before.
      expect(applied.button).toBe('lg');
      expect(applied.input).toBe('lg');
   });

   test('an unknown size falls back instead of rendering at nothing', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const applied = await withScale(h, () =>
         h.page.evaluate(async () => {
            const inp = await slice.build('Input', { size: 'enorme' });
            document.body.appendChild(inp);
            await new Promise((r) => setTimeout(r, 250));
            return inp.getAttribute('data-size');
         })
      );

      expect(applied).toBe('md');
   });

   test('className is added, never substituted', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const classes = await h.page.evaluate(async () => {
         const btn = await slice.build('Button', { value: 'Go', className: 'mi-cta otro' });
         const inp = await slice.build('Input', { className: 'mi-input' });
         document.body.append(btn, inp);
         await new Promise((r) => setTimeout(r, 250));
         return {
            button: btn.className,
            input: inp.className,
            innerButton: btn.querySelector('.slice_button').className,
         };
      });

      expect(classes.button).toContain('mi-cta');
      expect(classes.button).toContain('otro');
      expect(classes.input).toContain('mi-input');
      // The structural classes survive, which is the rule that keeps this from
      // becoming the silent-breakage mode.
      expect(classes.innerButton).toContain('slice_button');
   });

   test('a consumer class restyles without !important', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const measured = await h.page.evaluate(async () => {
         // NO !important. That is the claim being tested: a consumer class
         // overrides the scale without a specificity fight, because the class
         // lands on the host AFTER the component's own rules.
         const style = document.createElement('style');
         style.textContent = '.mi-cta .slice_button { min-height: 52px; }';
         document.head.appendChild(style);

         const btn = await slice.build('Button', { value: 'Comprar', size: 'lg', className: 'mi-cta' });
         document.body.appendChild(btn);
         await new Promise((r) => setTimeout(r, 250));

         return btn.querySelector('.slice_button').getBoundingClientRect().height;
      });

      // 44px from the scale, 52px from the consumer's class, no !important.
      expect(measured).toBeGreaterThan(44);
   });
});