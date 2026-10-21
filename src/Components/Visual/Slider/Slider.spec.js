import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Contract for Slider. Structure (Slider.html):
//   .slice_slider_container > .slice_slider_header (label + output)
//                           > .slice_slider_control (track > fill, input--low, input--high)
//                           > .slice_slider_marks
// Native <input type="range"> per thumb: keyboard, aria-valuenow and forms come
// from the platform. `onInput` fires while the value moves, `onChange` on commit,
// neither for programmatic changes.

const valueOf = (c) => c.component.evaluate((el) => el.value);

test.describe('Slider', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Slider', { label: 'Volume', value: 40 });
      await expect(c.component).toBeVisible();
      await expect(c.locator('input[type="range"]:not([hidden])')).toHaveCount(1);
      await expect(c.component).toHaveCSS('display', 'block');
      expect(c.pageErrors()).toEqual([]);
   });

   test('exposes a named slider with min, max and the current value', async ({ mount, page }) => {
      await mount('Slider', { label: 'Volume', min: 0, max: 10, value: 4 });
      const slider = page.getByRole('slider', { name: 'Volume' });
      await expect(slider).toBeVisible();
      await expect(slider).toHaveAttribute('min', '0');
      await expect(slider).toHaveAttribute('max', '10');
      await expect(slider).toHaveValue('4');
   });

   test('defaults: 0..100, value 0, step 1', async ({ mount }) => {
      const c = await mount('Slider');
      expect(await valueOf(c)).toBe(0);
      await expect(c.locator('.slice_slider_input--low')).toHaveAttribute('step', '1');
   });

   // setComponentProps applies props in the caller's key order. Applying
   // `value: 150` before `max: 200` arrived would clamp it to the default 100.
   test('value given before max is not clamped to the default max', async ({ mount }) => {
      const c = await mount('Slider', { value: 150, max: 200 });
      expect(await valueOf(c)).toBe(150);
   });

   test('value is clamped to min/max', async ({ mount }) => {
      const c = await mount('Slider', { min: 10, max: 20, value: 50 });
      expect(await valueOf(c)).toBe(20);
      await c.component.evaluate((el) => { el.value = -3; });
      expect(await valueOf(c)).toBe(10);
   });

   test('value snaps to step, counted from min', async ({ mount }) => {
      const c = await mount('Slider', { min: 1, max: 21, step: 5, value: 9 });
      expect(await valueOf(c)).toBe(11);
   });

   test('decimal steps do not leak float noise', async ({ mount }) => {
      const c = await mount('Slider', { min: 0, max: 1, step: 0.1, value: 0.1 + 0.2 });
      expect(await valueOf(c)).toBe(0.3);
      await expect(c.locator('.slice_slider_value')).toHaveText('0.3');
   });

   // --------------------------------------------------------------- keyboard

   test('arrow keys move by step and fire onInput and onChange', async ({ mount, page }) => {
      const c = await mount('Slider', { value: 10, step: 5 }, { spies: ['onInput', 'onChange'] });
      await c.component.evaluate((el) => el.focus());
      await page.keyboard.press('ArrowRight');
      expect(await valueOf(c)).toBe(15);
      await expect.poll(() => c.events('onChange')).toBe(1);
      expect((await c.eventArgs('onChange')).at(-1)).toEqual([15]);
      expect((await c.eventArgs('onInput')).at(-1)).toEqual([15]);
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      expect(await valueOf(c)).toBe(5);
   });

   test('Home and End jump to min and max', async ({ mount, page }) => {
      const c = await mount('Slider', { min: 5, max: 50, value: 20 });
      await c.component.evaluate((el) => el.focus());
      await page.keyboard.press('End');
      expect(await valueOf(c)).toBe(50);
      await page.keyboard.press('Home');
      expect(await valueOf(c)).toBe(5);
   });

   test('programmatic value changes fire nothing', async ({ mount }) => {
      const c = await mount('Slider', { value: 10 }, { spies: ['onInput', 'onChange'] });
      await c.component.evaluate((el) => { el.value = 70; });
      expect(await valueOf(c)).toBe(70);
      await expect(c.locator('.slice_slider_input--low')).toHaveValue('70');
      expect(await c.events('onInput')).toBe(0);
      expect(await c.events('onChange')).toBe(0);
   });

   test('onChange can be cleared with null', async ({ mount, page }) => {
      const c = await mount('Slider', { value: 10 }, { spies: ['onChange'] });
      await c.component.evaluate((el) => { el.onChange = null; el.focus(); });
      await page.keyboard.press('ArrowRight');
      expect(await valueOf(c)).toBe(11);
      expect(await c.events('onChange')).toBe(0);
   });

   // ----------------------------------------------------------------- pointer

   test('clicking the track jumps the thumb there', async ({ mount, page }) => {
      const c = await mount('Slider', { value: 0 }, { spies: ['onChange'] });
      const box = await c.locator('.slice_slider_control').boundingBox();
      await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2);
      const v = await valueOf(c);
      expect(v).toBeGreaterThan(70);
      expect(v).toBeLessThan(80);
      await expect.poll(() => c.events('onChange')).toBe(1);
   });

   test('dragging the thumb updates the value continuously', async ({ mount, page }) => {
      const c = await mount('Slider', { value: 0 }, { spies: ['onInput'] });
      const box = await c.locator('.slice_slider_control').boundingBox();
      const y = box.y + box.height / 2;
      await page.mouse.move(box.x + box.height / 2, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.3, y, { steps: 5 });
      await page.mouse.move(box.x + box.width * 0.6, y, { steps: 5 });
      await page.mouse.up();
      const v = await valueOf(c);
      expect(v).toBeGreaterThan(50);
      expect(v).toBeLessThan(70);
      expect(await c.events('onInput')).toBeGreaterThan(2);
   });

   test('the fill follows the value', async ({ mount }) => {
      const c = await mount('Slider', { value: 50 });
      const ratio = await c.component.evaluate((el) => {
         const track = el.querySelector('.slice_slider_track').getBoundingClientRect();
         const fill = el.querySelector('.slice_slider_fill').getBoundingClientRect();
         return fill.width / track.width;
      });
      expect(ratio).toBeGreaterThan(0.45);
      expect(ratio).toBeLessThan(0.55);
   });

   // ------------------------------------------------------------------- range

   test('range: two labelled thumbs and a [low, high] value', async ({ mount, page }) => {
      const c = await mount('Slider', { label: 'Price', range: true, value: [20, 80] });
      await expect(c.locator('input[type="range"]:not([hidden])')).toHaveCount(2);
      expect(await valueOf(c)).toEqual([20, 80]);
      await expect(page.getByRole('slider', { name: 'Price (minimum)' })).toHaveValue('20');
      await expect(page.getByRole('slider', { name: 'Price (maximum)' })).toHaveValue('80');
      await expect(c.locator('.slice_slider_value')).toHaveText('20 – 80');
   });

   test('range: a non-array value becomes [min, max]; a reversed pair is sorted', async ({ mount }) => {
      const c = await mount('Slider', { range: true, min: 10, max: 90 });
      expect(await valueOf(c)).toEqual([10, 90]);
      await c.component.evaluate((el) => { el.value = [70, 30]; });
      expect(await valueOf(c)).toEqual([30, 70]);
   });

   test('range: a thumb stops at the other one instead of crossing it', async ({ mount, page }) => {
      const c = await mount('Slider', { range: true, value: [50, 51] }, { spies: ['onChange'] });
      await c.locator('.slice_slider_input--low').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      expect(await valueOf(c)).toEqual([51, 51]);
      await expect(c.locator('.slice_slider_input--low')).toHaveValue('51');
   });

   test('range: both thumbs at max can still be pulled apart', async ({ mount }) => {
      const c = await mount('Slider', { range: true, value: [100, 100] });
      await expect(c.locator('.slice_slider_input--low')).toHaveClass(/slice_slider_input--raised/);
   });

   test('range: clicking the track moves the nearest thumb', async ({ mount, page }) => {
      const c = await mount('Slider', { range: true, value: [20, 80] }, { spies: ['onChange'] });
      const box = await c.locator('.slice_slider_control').boundingBox();
      await page.mouse.click(box.x + box.width * 0.9, box.y + box.height / 2);
      const [low, high] = await valueOf(c);
      expect(low).toBe(20);
      expect(high).toBeGreaterThan(85);
      await page.mouse.click(box.x + box.width * 0.05, box.y + box.height / 2);
      expect((await valueOf(c))[0]).toBeLessThan(15);
      await expect.poll(() => c.events('onChange')).toBe(2);
   });

   test('range: the value getter returns a copy', async ({ mount }) => {
      const c = await mount('Slider', { range: true, value: [20, 80] });
      const after = await c.component.evaluate((el) => { el.value[0] = 99; return el.value; });
      expect(after).toEqual([20, 80]);
   });

   // ------------------------------------------------------------------- marks

   test('marks render under the track; clicking one moves the value', async ({ mount }) => {
      const c = await mount('Slider', {
         value: 0,
         marks: [0, { value: 50, label: 'Half' }, 100, 400],
      }, { spies: ['onChange'] });
      const marks = c.locator('.slice_slider_mark');
      // 400 is outside 0..100 and is dropped.
      await expect(marks).toHaveText(['0', 'Half', '100']);
      await marks.nth(1).click();
      expect(await valueOf(c)).toBe(50);
      await expect.poll(() => c.events('onChange')).toBe(1);
   });

   test('marks are not extra tab stops', async ({ mount }) => {
      const c = await mount('Slider', { marks: [0, 50, 100] });
      await expect(c.locator('.slice_slider_mark').first()).toHaveAttribute('tabindex', '-1');
   });

   test('no marks: the marks row is hidden', async ({ mount }) => {
      const c = await mount('Slider');
      await expect(c.locator('.slice_slider_marks')).toBeHidden();
   });

   // ------------------------------------------------------- formatting/a11y

   test('formatValue drives the visible value and aria-valuetext', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      await h.page.evaluate(async () => {
         const el = await slice.build('Slider', { label: 'Budget', value: 40, formatValue: (v) => `$${v}` });
         document.getElementById('host').appendChild(el);
      });
      await expect(page.locator('#host .slice_slider_value')).toHaveText('$40');
      await expect(page.getByRole('slider', { name: 'Budget' })).toHaveAttribute('aria-valuetext', '$40');
   });

   test('a throwing formatValue falls back to the number', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      await h.page.evaluate(async () => {
         const el = await slice.build('Slider', { value: 7, formatValue: () => { throw new Error('boom'); } });
         document.getElementById('host').appendChild(el);
      });
      await expect(page.locator('#host .slice_slider_value')).toHaveText('7');
      expect(h.pageErrors()).toEqual([]);
   });

   test('showValue=false hides the value', async ({ mount }) => {
      const c = await mount('Slider', { label: 'X', showValue: false });
      await expect(c.locator('.slice_slider_value')).toBeHidden();
   });

   test('without a label the slider still has an accessible name', async ({ mount, page }) => {
      await mount('Slider', { value: 3 });
      await expect(page.getByRole('slider', { name: 'Value' })).toBeVisible();
   });

   // Thumb pseudo-elements are not readable through getComputedStyle, so the
   // ring is checked by what it paints: the control must look different once it
   // has keyboard focus.
   test('keyboard focus is visible on the thumb', async ({ mount, page }) => {
      const c = await mount('Slider', { value: 30 });
      const control = c.locator('.slice_slider_control');
      const before = await control.screenshot({ animations: 'disabled' });
      await page.keyboard.press('Tab');
      await expect(c.locator('.slice_slider_input--low')).toBeFocused();
      const after = await control.screenshot({ animations: 'disabled' });
      expect(Buffer.compare(before, after)).not.toBe(0);
   });

   test('the control never collapses in a shrink-to-fit parent', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host" style="display:inline-flex"></div>`);
      const width = await h.page.evaluate(async () => {
         const el = await slice.build('Slider', {});
         document.getElementById('host').appendChild(el);
         return el.querySelector('.slice_slider_control').getBoundingClientRect().width;
      });
      expect(width).toBeGreaterThan(150);
   });

   // ------------------------------------------------------- state & forms

   test('disabled blocks interaction', async ({ mount, page }) => {
      const c = await mount('Slider', { value: 10, disabled: true });
      await expect(c.locator('.slice_slider_input--low')).toBeDisabled();
      const box = await c.locator('.slice_slider_control').boundingBox();
      await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
      expect(await valueOf(c)).toBe(10);
   });

   test('changing max after mount re-clamps the value silently', async ({ mount }) => {
      const c = await mount('Slider', { value: 80 }, { spies: ['onChange'] });
      await c.component.evaluate((el) => { el.max = 50; });
      expect(await valueOf(c)).toBe(50);
      await expect(c.locator('.slice_slider_input--low')).toHaveAttribute('max', '50');
      expect(await c.events('onChange')).toBe(0);
   });

   test('switching to range after mount turns the value into a pair', async ({ mount }) => {
      const c = await mount('Slider', { value: 30 });
      await c.component.evaluate((el) => { el.range = true; });
      expect(await valueOf(c)).toEqual([0, 100]);
      await expect(c.locator('input[type="range"]:not([hidden])')).toHaveCount(2);
   });

   test('a native form submits the value under name', async ({ mountHtml }) => {
      const h = await mountHtml(`<form id="f"></form>`);
      const out = await h.page.evaluate(async () => {
         const form = document.getElementById('f');
         form.appendChild(await slice.build('Slider', { name: 'volume', value: 35 }));
         form.appendChild(await slice.build('Slider', { name: 'price', range: true, value: [10, 60] }));
         const data = new FormData(form);
         return { volume: data.get('volume'), price: data.getAll('price') };
      });
      expect(out).toEqual({ volume: '35', price: ['10', '60'] });
   });

   test('works as a Form field', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      const values = await h.page.evaluate(async () => {
         const form = await slice.build('Form', {
            schema: [{ name: 'volume', component: 'Slider', props: { label: 'Volume', value: 25, variant: 'plain' } }],
         });
         document.getElementById('host').appendChild(form);
         await new Promise((r) => setTimeout(r, 50));
         const before = form.getValues();
         form.setValue('volume', 60);
         return { before, after: form.getValues() };
      });
      expect(values).toEqual({ before: { volume: 25 }, after: { volume: 60 } });
   });

   // ------------------------------------------------------------- styling

   test('variant applies the modifier idempotently and falls back', async ({ mount }) => {
      const c = await mount('Slider', { variant: 'soft' });
      const container = c.locator('.slice_slider_container');
      await expect(container).toHaveClass(/slice_slider--soft/);
      await c.component.evaluate((el) => { el.variant = 'nope'; });
      await expect(container).toHaveClass(/slice_slider--default/);
      await expect(container).not.toHaveClass(/slice_slider--soft/);
   });

   test('variant=plain drops the container chip, even at size=lg', async ({ mount }) => {
      const c = await mount('Slider', { variant: 'plain', size: 'lg' });
      await expect(c.locator('.slice_slider_container')).toHaveCSS('padding-top', '0px');
      await expect(c.locator('.slice_slider_container')).toHaveCSS('border-top-width', '0px');
   });

   test('size scales the control and falls back to md', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host" style="width:300px"></div>`);
      const out = await h.page.evaluate(async () => {
         const host = document.getElementById('host');
         const res = {};
         for (const size of ['sm', 'md', 'lg', 'xl']) {
            const el = await slice.build('Slider', { size });
            host.appendChild(el);
            res[size] = { attr: el.dataset.size, h: el.querySelector('.slice_slider_control').getBoundingClientRect().height };
         }
         return res;
      });
      expect(out.sm.h).toBeLessThan(out.md.h);
      expect(out.md.h).toBeLessThan(out.lg.h);
      expect(out.xl.attr).toBe('md');
   });

   test('setters read their accepted set from static props, not a copy', async ({ mount }) => {
      const c = await mount('Slider');
      const out = await c.component.evaluate((el) => {
         const p = el.constructor.props;
         p.variant.allowedValues.push('probe');
         p.size.allowedValues.push('probe-size');
         window.slice.setComponentProps(el, { variant: 'probe', size: 'probe-size' });
         p.variant.allowedValues.pop();
         p.size.allowedValues.pop();
         return {
            variant: el.querySelector('.slice_slider_container').classList.contains('slice_slider--probe'),
            size: el.dataset.size,
         };
      });
      expect(out).toEqual({ variant: true, size: 'probe-size' });
   });

   test('customColor.accent colours the fill, over any variant', async ({ mount }) => {
      const c = await mount('Slider', { value: 50, variant: 'soft', customColor: { accent: 'rgb(255, 0, 0)' } });
      await expect(c.locator('.slice_slider_fill')).toHaveCSS('background-color', 'rgb(255, 0, 0)');
   });

   test('destroying it leaves nothing registered', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      const out = await h.page.evaluate(async () => {
         const before = slice.controller.activeComponents.size;
         const el = await slice.build('Slider', { marks: [0, 100] });
         document.getElementById('host').appendChild(el);
         slice.controller.destroyComponent(el);
         return { before, after: slice.controller.activeComponents.size };
      });
      expect(out.after).toBe(out.before);
      expect(h.pageErrors()).toEqual([]);
   });
});