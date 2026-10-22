import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const day = (c, iso) => c.locator(`.dp_day[data-date="${iso}"]`);

test.describe('DatePicker — field', () => {
   test('smoke: builds, labels its field and shows the value in the locale', async ({ mount, page }) => {
      const c = await mount('DatePicker', { label: 'Due date', value: '2026-10-21', locale: 'en-US', name: 'due' });
      expect(c.pageErrors()).toEqual([]);
      await expect(page.getByRole('combobox', { name: 'Due date' })).toHaveValue('Oct 21, 2026');
      await expect(c.locator('.slice_datepicker_hidden')).toHaveValue('2026-10-21');
      await expect(c.locator('.slice_datepicker_hidden')).toHaveAttribute('name', 'due');
      expect(await c.component.evaluate((el) => el.value)).toBe('2026-10-21');
   });

   test('focusing switches to the typed form; typing a date and Enter sets it', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21', locale: 'es-VE' }, { spies: ['onChange'] });
      const input = c.locator('.slice_datepicker_input');
      await input.focus();
      await expect(input).toHaveValue('21/10/2026');
      await input.fill('5/11/2026');
      await input.press('Enter');
      expect(await c.component.evaluate((el) => el.value)).toBe('2026-11-05');
      expect((await c.eventArgs('onChange'))[0][0]).toBe('2026-11-05');
      await input.blur();
      await expect(input).toHaveValue(/5 nov/);
   });

   test('text that is not a date says so on blur, and the value is kept', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21', locale: 'en-US' });
      const input = c.locator('.slice_datepicker_input');
      await input.fill('31/31/2026');
      await input.blur();
      await expect(c.locator('.slice_datepicker_message')).toHaveText('Enter a valid date');
      expect(await c.component.evaluate((el) => el.value)).toBe('2026-10-21');
   });

   test('an empty required field stays quiet until validate(), which shakes it', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Date', required: true });
      const input = c.locator('.slice_datepicker_input');
      await input.focus();
      await input.fill('1');
      await input.fill('');
      await input.blur();
      await expect(c.locator('.slice_datepicker_field')).not.toHaveClass(/is-invalid/);
      expect(await c.component.evaluate((el) => el.validate())).toBe(false);
      await expect(c.locator('.slice_datepicker_message')).toHaveText('This field is required');
      await expect(c.locator('.slice_datepicker_field')).toHaveClass(/is-shaking/);
   });

   test('the ✕ clears the value and reports it', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21' }, { spies: ['onChange'] });
      await c.locator('.slice_datepicker_clear').click();
      expect(await c.component.evaluate((el) => el.value)).toBe('');
      expect((await c.eventArgs('onChange')).at(-1)[0]).toBe('');
      await expect(c.locator('.slice_datepicker_clear')).toBeHidden();
   });
});

test.describe('DatePicker — calendar', () => {
   test('the toggle opens the calendar on the value, with the focus on that day', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21', locale: 'en-US' });
      await c.locator('.slice_datepicker_toggle').click();
      await expect(c.locator('.slice_datepicker_popup')).toBeVisible();
      await expect(c.locator('.slice_datepicker_input')).toHaveAttribute('aria-expanded', 'true');
      await expect(day(c, '2026-10-21')).toBeFocused();
      await expect(day(c, '2026-10-21').locator('xpath=..')).toHaveAttribute('aria-selected', 'true');
   });

   test('keyboard: arrows, PageDown, Home / End, Enter picks and returns to the field', async ({ mount, page }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21', locale: 'en-GB' }, { spies: ['onChange'] });
      await c.locator('.slice_datepicker_toggle').click();
      await expect(day(c, '2026-10-21')).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(day(c, '2026-10-22')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(day(c, '2026-10-29')).toBeFocused();
      await page.keyboard.press('PageDown');
      await expect(day(c, '2026-11-29')).toBeFocused();
      await page.keyboard.press('Home');   // en-GB weeks start on Monday
      await expect(day(c, '2026-11-23')).toBeFocused();
      await page.keyboard.press('End');
      await expect(day(c, '2026-11-29')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(c.locator('.slice_datepicker_popup')).toBeHidden();
      await expect(c.locator('.slice_datepicker_input')).toBeFocused();
      expect((await c.eventArgs('onChange'))[0][0]).toBe('2026-11-29');
   });

   test('Escape closes; a click outside closes', async ({ mount, page }) => {
      const c = await mount('DatePicker', { label: 'Date' });
      await c.locator('.slice_datepicker_toggle').click();
      await expect(c.locator('.slice_datepicker_popup')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(c.locator('.slice_datepicker_popup')).toBeHidden();
      await c.locator('.slice_datepicker_input').click();
      await expect(c.locator('.slice_datepicker_popup')).toBeVisible();
      await page.mouse.click(700, 500);
      await expect(c.locator('.slice_datepicker_popup')).toBeHidden();
   });

   test('a mouse pick keeps the focus in the field and closes', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21' });
      await c.locator('.slice_datepicker_input').click();
      await day(c, '2026-10-14').click();
      expect(await c.component.evaluate((el) => el.value)).toBe('2026-10-14');
      await expect(c.locator('.slice_datepicker_popup')).toBeHidden();
      await expect(c.locator('.slice_datepicker_input')).toBeFocused();
   });

   test('min, max and disabled dates cannot be picked, and say why when typed', async ({ mount, page }) => {
      const c = await mount('DatePicker', {
         label: 'Date', value: '2026-10-21', locale: 'en-US', min: '2026-10-10', max: '2026-10-28', disabledDates: ['2026-10-22'],
      });
      await c.locator('.slice_datepicker_toggle').click();
      await expect(day(c, '2026-10-09')).toHaveAttribute('aria-disabled', 'true');
      await expect(day(c, '2026-10-22')).toHaveAttribute('aria-disabled', 'true');
      await expect(day(c, '2026-10-29')).toHaveAttribute('aria-disabled', 'true');
      await expect(c.locator('.dp_nav[data-action="prev"]')).toBeDisabled();
      await expect(c.locator('.dp_nav[data-action="next"]')).toBeDisabled();
      await day(c, '2026-10-22').click({ force: true });   // aria-disabled, still in the grid
      expect(await c.component.evaluate((el) => el.value)).toBe('2026-10-21');
      // Arrowing into a disabled day is allowed (it is in the grid), picking it is not.
      await page.keyboard.press('Escape');
      const input = c.locator('.slice_datepicker_input');
      await input.fill('10/05/2026');
      await input.blur();
      await expect(c.locator('.slice_datepicker_message')).toHaveText('Pick a date on or after Oct 10, 2026');
   });

   test('disabledDates as a function, and disableWeekends', async ({ mount, page }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21', disableWeekends: true });
      await page.evaluate(() => { window.__sliceMounted.disabledDates = (iso) => iso.endsWith('-13'); });
      await c.locator('.slice_datepicker_toggle').click();
      await expect(day(c, '2026-10-24')).toHaveAttribute('aria-disabled', 'true');   // Saturday
      await expect(day(c, '2026-10-13')).toHaveAttribute('aria-disabled', 'true');
      await expect(day(c, '2026-10-14')).not.toHaveAttribute('aria-disabled', 'true');
   });

   test('the week starts where the locale starts it, or at weekStartsOn', async ({ mount, page }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21', locale: 'en-US' });
      await c.locator('.slice_datepicker_toggle').click();
      await expect(c.locator('.dp_grid th').first()).toHaveAttribute('abbr', 'Sunday');
      await page.evaluate(() => { window.__sliceMounted.weekStartsOn = 1; });
      await expect(c.locator('.dp_grid th').first()).toHaveAttribute('abbr', 'Monday');
   });

   test('the month and year views pick a month', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Date', value: '2026-10-21', locale: 'en-US' });
      await c.locator('.slice_datepicker_toggle').click();
      await c.locator('.dp_title').click();
      await c.locator('.dp_title').click();   // years: 2016 – 2027
      await expect(c.locator('.dp_title')).toHaveText('2016 – 2027');
      await c.locator('.dp_nav[data-action="next"]').click();
      await c.locator('.dp_pick[data-year="2028"]').click();
      await c.locator('.dp_pick[data-month="2"]').click();
      await expect(c.locator('.dp_title')).toHaveText('February 2028');
      await expect(day(c, '2028-02-29')).toBeVisible();
   });

   test('texts translate the calendar', async ({ mount, page }) => {
      const c = await mount('DatePicker', { label: 'Fecha', locale: 'es-VE', texts: { today: 'Hoy', clear: 'Borrar', chooseDate: 'Elegir fecha' } });
      await expect(c.locator('.slice_datepicker_toggle')).toHaveAttribute('aria-label', 'Elegir fecha');
      await c.locator('.slice_datepicker_toggle').click();
      await expect(c.locator('.dp_foot_button[data-action="today"]')).toHaveText('Hoy');
   });
});

test.describe('DatePicker — range, presets, inline, Form', () => {
   test('range: two clicks in any order, a preview while hovering, ISO interval for forms', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Stay', mode: 'range', months: 2, value: { start: '2026-10-01', end: '' }, name: 'stay' }, { spies: ['onChange'] });
      await c.locator('.slice_datepicker_toggle').click();
      await expect(c.locator('.dp_grid')).toHaveCount(2);
      // The same day is never drawn twice across the two months.
      expect(await c.locator('.dp_day[data-date="2026-11-01"]').count()).toBe(1);
      await day(c, '2026-10-20').click();   // restarts: the range had a start but no end -> this is the end
      expect(await c.component.evaluate((el) => el.value)).toEqual({ start: '2026-10-01', end: '2026-10-20' });
      await c.locator('.slice_datepicker_toggle').click();
      await day(c, '2026-11-05').click();
      await day(c, '2026-10-28').hover();
      await expect(day(c, '2026-11-01').locator('xpath=..')).toHaveClass(/in-range/);
      await day(c, '2026-10-28').click();
      expect(await c.component.evaluate((el) => el.value)).toEqual({ start: '2026-10-28', end: '2026-11-05' });
      await expect(c.locator('.slice_datepicker_hidden')).toHaveValue('2026-10-28/2026-11-05');
   });

   test('range: an unfinished range does not validate', async ({ mount }) => {
      const c = await mount('DatePicker', { label: 'Stay', mode: 'range', value: { start: '2026-10-01' } });
      expect(await c.component.evaluate((el) => el.validate())).toBe(false);
      await expect(c.locator('.slice_datepicker_message')).toHaveText('Pick an end date');
   });

   test('presets set the value (functions included)', async ({ mount, page }) => {
      const c = await mount('DatePicker', { label: 'Period', mode: 'range' });
      await page.evaluate(() => {
         window.__sliceMounted.presets = [
            { label: 'Fixed', value: { start: '2026-01-01', end: '2026-01-31' } },
            { label: 'Seven from today', value: ({ today }) => ({ start: today, end: today }) },
         ];
      });
      await c.locator('.slice_datepicker_toggle').click();
      await c.locator('.dp_preset').filter({ hasText: 'Fixed' }).click();
      expect(await c.component.evaluate((el) => el.value)).toEqual({ start: '2026-01-01', end: '2026-01-31' });
   });

   test('inline shows the calendar on the page, without a field', async ({ mount }) => {
      const c = await mount('DatePicker', { inline: true, value: '2026-10-21' }, { spies: ['onChange'] });
      await expect(c.locator('.slice_datepicker_field')).toBeHidden();
      await expect(c.locator('.dp_grid')).toBeVisible();
      await day(c, '2026-10-09').click();
      expect((await c.eventArgs('onChange'))[0][0]).toBe('2026-10-09');
      await expect(c.locator('.dp_grid')).toBeVisible();
   });

   test('inside a Form: one label, the Form’s error, and the ISO value in getValues()', async ({ mount, page }) => {
      const c = await mount('Form', {
         schema: [{ kind: 'field', name: 'due', label: 'Due date', component: 'DatePicker', required: true }],
      });
      const picker = c.locator('slice-datepicker');
      await expect(picker).toHaveAttribute('data-label-placement', 'above');
      await expect(picker.locator('.slice_datepicker_input')).toHaveAttribute('aria-label', 'Due date');
      expect(await c.component.evaluate((f) => f.submit())).toBe(false);
      await expect(c.locator('.slice-form__error')).toHaveText('This field is required');
      await picker.locator('.slice_datepicker_input').fill('2026-12-24');
      await picker.locator('.slice_datepicker_input').press('Enter');
      await picker.locator('.slice_datepicker_input').blur();
      expect(await c.component.evaluate((f) => f.getValues())).toEqual({ due: '2026-12-24' });
   });

   test('destroying it while open closes the calendar and leaves nothing behind', async ({ mount, page }) => {
      const c = await mount('DatePicker', { label: 'Date' });
      await c.locator('.slice_datepicker_toggle').click();
      await expect(c.locator('.slice_datepicker_popup')).toBeVisible();
      await page.evaluate(() => slice.controller.destroyComponent(window.__sliceMounted));
      expect(await page.evaluate(() => document.querySelectorAll(':popover-open').length)).toBe(0);
      await page.mouse.click(10, 10);   // a stale document listener would throw here
      expect(c.pageErrors()).toEqual([]);
   });
});