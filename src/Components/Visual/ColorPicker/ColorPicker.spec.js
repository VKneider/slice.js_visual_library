import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ColorPicker wraps a native `<input type="color">`. The wrapper exists for
// three reasons, and each has a test: the label/accessible name, the silent
// black-swatch failure on a value the input cannot parse, and the hex readout.
// The last two are the ones a raw `<input type="color">` gets wrong with no
// error at all, so they are the ones worth pinning.

test.describe('ColorPicker', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('ColorPicker', { label: 'Primary', value: '#9333ea' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_color_picker__input')).toHaveValue('#9333ea');
      expect(c.pageErrors()).toEqual([]);
   });

   test('label prop names the control via <label for>', async ({ mount }) => {
      const c = await mount('ColorPicker', { label: 'Primary color' });
      await expect(c.locator('.slice_color_picker__label')).toHaveText('Primary color');

      const wired = await c.component.evaluate((el) => {
         const input = el.querySelector('.slice_color_picker__input');
         const label = el.querySelector('.slice_color_picker__label');
         return { inputId: input.id, labelFor: label.htmlFor };
      });
      expect(wired.inputId).toBeTruthy();
      expect(wired.labelFor).toBe(wired.inputId);
   });

   test('two instances get distinct ids so labels do not cross-wire', async ({ mount }) => {
      const c = await mount('ColorPicker', { label: 'One' });
      // The mount handle exposes locators, not the page; `Locator.page()` is the
      // way back out to a full-page evaluate.
      const ids = await c.root.page().evaluate(async () => {
         const node = await window.slice.build('ColorPicker', { label: 'Two' });
         document.querySelector('[data-test-root]').appendChild(node);
         return Array.from(document.querySelectorAll('.slice_color_picker__input')).map((i) => i.id);
      });
      expect(ids).toHaveLength(2);
      expect(ids[0]).not.toBe(ids[1]);
   });

   test('value normalizes rgb() to hex instead of silently rendering black', async ({ mount }) => {
      const c = await mount('ColorPicker', { value: 'rgb(147, 51, 234)' });
      // A raw <input type="color"> renders BLACK for this and reports nothing.
      await expect(c.locator('.slice_color_picker__input')).toHaveValue('#9333ea');
      await expect(c.locator('.slice_color_picker__value')).toHaveText('#9333ea');
   });

   test('value expands the #rgb shorthand', async ({ mount }) => {
      const c = await mount('ColorPicker', { value: '#0f8' });
      await expect(c.locator('.slice_color_picker__input')).toHaveValue('#00ff88');
   });

   test('an unparseable colour falls back rather than going black', async ({ mount }) => {
      const c = await mount('ColorPicker', { value: 'var(--brand)' });
      // The fallback is the documented default, not the black a native input
      // would have shown.
      await expect(c.locator('.slice_color_picker__input')).toHaveValue('#000000');
      await expect(c.locator('.slice_color_picker__value')).toHaveText('#000000');
   });

   test('onChange fires with the normalized hex', async ({ mount }) => {
      const c = await mount('ColorPicker', {}, { spies: ['onChange'] });
      await c.locator('.slice_color_picker__input').fill('#ff0000');
      await expect.poll(() => c.events('onChange')).toBe(1);
      expect(await c.eventArgs('onChange')).toEqual([['#ff0000']]);
   });

   test('hint renders under the control and is hidden when empty', async ({ mount }) => {
      const c = await mount('ColorPicker', { hint: '--primary-color' });
      await expect(c.locator('.slice_color_picker__hint')).toHaveText('--primary-color');

      const bare = await mount('ColorPicker');
      // The JS sets `hidden`; without the [hidden] companion rule in the css
      // this element would stay on screen as an empty line (§8.2).
      await expect(bare.locator('.slice_color_picker__hint')).toBeHidden();
   });

   test('an unlabelled picker still has an accessible name', async ({ mount }) => {
      const c = await mount('ColorPicker', { hint: '--danger-color' });
      await expect(c.locator('.slice_color_picker__input')).toHaveAttribute(
         'aria-label',
         '--danger-color'
      );
   });

   test('size prop follows the shared recipe', async ({ mount }) => {
      const c = await mount('ColorPicker', { size: 'sm' });
      await expect(c.component).toHaveAttribute('data-size', 'sm');

      const bogus = await mount('ColorPicker', { size: 'enormous' });
      await expect(bogus.component).toHaveAttribute('data-size', 'md');
   });

   test('disabled blocks interaction', async ({ mount }) => {
      const c = await mount('ColorPicker', { disabled: true });
      await expect(c.locator('.slice_color_picker__input')).toBeDisabled();
   });

   test('setting value after mount repaints the swatch and the readout', async ({ mount }) => {
      const c = await mount('ColorPicker', { value: '#111111' });
      await c.component.evaluate((el) => {
         el.value = '#22aa88';
      });
      await expect(c.locator('.slice_color_picker__input')).toHaveValue('#22aa88');
      await expect(c.locator('.slice_color_picker__value')).toHaveText('#22aa88');
   });

   test('the label is VISIBLE, not just present', async ({ mount }) => {
      const c = await mount('ColorPicker', { label: 'Primary color', hint: '--primary-color' });
      const label = c.locator('.slice_color_picker__label');

      // Regression: _render() used to read the label back OUT of the DOM while
      // every other field was read from state. The label was written before the
      // element was in the document, so the read-back saw an empty label and
      // hid it — a control that was present, labelled and completely invisible,
      // with its accessible name replaced by a generic "Colour".
      await expect(label).toBeVisible();
      await expect(label).toHaveText('Primary color');
      // The <label for> is the accessible name; aria-label must not shadow it.
      await expect(c.locator('.slice_color_picker__input')).not.toHaveAttribute('aria-label', /.*/);
   });

   test('a11y: the control is a labelled native colour input', async ({ mount }) => {
      const c = await mount('ColorPicker', { label: 'Success' });
      const input = c.locator('.slice_color_picker__input');
      await expect(input).toHaveAttribute('type', 'color');
      await expect(input).toHaveAttribute('id', /slice-color-picker-\d+/);
   });
});