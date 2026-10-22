import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Select: input.slice_select[role=combobox] inside .slice_select_container,
// a listbox menu (.slice_select_menu, a manual popover) with role=option rows,
// chips in multiple mode, a floating label (.slice_select_value when floated).
// Props with functions are built inside the page (`mount` serialises props).

const FRUITS = [
   { value: 'apple', text: 'Apple' },
   { value: 'banana', text: 'Banana' },
   { value: 'cherry', text: 'Cherry' },
];

const GROUPED = [
   { label: 'Americas', options: [{ value: 'ar', label: 'Argentina' }, { value: 've', label: 'Venezuela', description: 'Caracas' }] },
   { label: 'Europe', options: [{ value: 'es', label: 'España' }, { value: 'fr', label: 'France', disabled: true }] },
];

const field = (c) => c.component.getByRole('combobox');
const options = (c) => c.component.getByRole('option');

async function build(page, props, setup = '') {
   await page.evaluate(async ({ props, setup }) => {
      window.__log = [];
      // eslint-disable-next-line no-new-func
      const extra = setup ? new Function('log', `return (${setup});`)((...a) => window.__log.push(a)) : {};
      const el = await slice.build('Select', { ...props, ...extra });
      el.id = 'sel';
      document.getElementById('host').appendChild(el);
      window.__sel = el;
   }, { props, setup });
   return page.locator('#sel');
}

test.describe('Select — compatibility', () => {
   test('smoke: a labelled combobox; the list is closed', async ({ mount }) => {
      const c = await mount('Select', { label: 'Fruit', options: FRUITS });
      await expect(field(c)).toBeVisible();
      await expect(c.component.getByRole('combobox', { name: 'Fruit' })).toHaveAttribute('aria-expanded', 'false');
      await expect(c.locator('.slice_select_menu')).toBeHidden();
      expect(c.pageErrors()).toEqual([]);
   });

   test('options render as role=option using visibleProp; visibleProp can change', async ({ mount }) => {
      const c = await mount('Select', { options: [{ value: 1, text: 'One', name: 'Uno' }, { value: 2, text: 'Two', name: 'Dos' }] });
      await c.locator('.slice_select_container').click();
      await expect(options(c)).toHaveText(['One', 'Two']);
      await c.component.evaluate((el) => { el.close(); el.visibleProp = 'name'; });
      await c.locator('.slice_select_container').click();
      await expect(options(c)).toHaveText(['Uno', 'Dos']);
   });

   test('the old value shape still works: an array of option objects in, the object out', async ({ mount }) => {
      const c = await mount('Select', { options: FRUITS, value: [FRUITS[1]] });
      await expect(field(c)).toHaveValue('Banana');
      expect(await c.component.evaluate((el) => el.value)).toEqual(FRUITS[1]);
      const m = await mount('Select', { options: FRUITS, multiple: true, value: [FRUITS[0], FRUITS[2]] });
      expect(await m.component.evaluate((el) => el.value)).toEqual([FRUITS[0], FRUITS[2]]);
      const e = await mount('Select', { options: FRUITS });
      expect(await e.component.evaluate((el) => el.value)).toEqual([]);
   });

   test('a scalar value, or value before options, does not brick the control', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      // value FIRST, options second: the order no longer matters.
      const sel = await build(page, { value: 'cherry', options: FRUITS });
      await expect(sel.getByRole('combobox')).toHaveValue('Cherry');
      expect(await page.evaluate(() => window.__sel.selected)).toBe('cherry');
      await sel.locator('.slice_select_container').click();
      await sel.getByRole('option', { name: 'Apple' }).click();
      expect(await page.evaluate(() => window.__sel.selected)).toBe('apple');
   });

   test('onChange fires with (selected, options) and this = the Select; onOptionSelect is a deprecated alias', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const sel = await build(page, { options: FRUITS }, `{ onChange: function (value, opts) { log(value, opts.map((o) => o.text), this.id); } }`);
      await sel.locator('.slice_select_container').click();
      await sel.getByRole('option', { name: 'Banana' }).click();
      expect(await page.evaluate(() => window.__log)).toEqual([['banana', ['Banana'], 'sel']]);
      const c = await page.evaluate(async (fruits) => {
         const warnings = [];
         const original = console.warn;
         console.warn = (...a) => warnings.push(a.join(' '));
         let calls = 0;
         const el = await slice.build('Select', { options: fruits, onOptionSelect: () => { calls += 1; } });
         document.getElementById('host').appendChild(el);
         el.selected = 'apple';
         el.querySelector('.slice_select_container').click();
         el.querySelector('[role="option"]:nth-child(2)').click();
         console.warn = original;
         return { calls, warned: warnings.filter((w) => w.includes('onOptionSelect')).length };
      }, FRUITS);
      expect(c.calls).toBe(1);
      expect(c.warned).toBeLessThanOrEqual(1);
   });

   test('disabled: does not open', async ({ mount }) => {
      const c = await mount('Select', { options: FRUITS, disabled: true });
      await expect(field(c)).toBeDisabled();
      await c.locator('.slice_select_container').click({ force: true });
      await expect(c.locator('.slice_select_menu')).toBeHidden();
   });
});

test.describe('Select — the combobox', () => {
   test('click opens; the menu escapes overflow: hidden; picking closes and keeps focus', async ({ mountHtml, page }) => {
      await mountHtml('<div style="overflow:hidden;height:70px;padding:24px 10px 0"><div id="host"></div></div>');
      const sel = await build(page, { label: 'Fruit', options: FRUITS });
      await sel.locator('.slice_select_container').click();
      await expect(sel.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
      const last = sel.getByRole('option', { name: 'Cherry' });
      await expect(last).toBeVisible();
      expect(await last.evaluate((el) => {
         const r = el.getBoundingClientRect();
         return el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      })).toBe(true);
      await last.click();
      await expect(sel.locator('.slice_select_menu')).toBeHidden();
      await expect(sel.getByRole('combobox')).toBeFocused();
      await expect(sel.getByRole('combobox')).toHaveValue('Cherry');
   });

   test('keyboard: ↓ opens on the first option, arrows skip disabled, Enter picks, Escape closes; aria-activedescendant follows', async ({ mount, page }) => {
      const c = await mount('Select', { options: [{ value: 'a', text: 'Alpha' }, { value: 'b', text: 'Beta', disabled: true }, { value: 'c', text: 'Gamma' }] });
      await field(c).focus();
      await page.keyboard.press('ArrowDown');
      const active = async () => {
         const id = await field(c).getAttribute('aria-activedescendant');
         return id ? c.component.locator(`#${id}`).textContent() : null;
      };
      expect(await active()).toBe('Alpha');
      await page.keyboard.press('ArrowDown');
      expect(await active()).toBe('Gamma');
      await page.keyboard.press('ArrowDown');
      expect(await active()).toBe('Alpha');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Enter');
      expect(await c.component.evaluate((el) => el.selected)).toBe('c');
      await expect(c.locator('.slice_select_menu')).toBeHidden();
      await page.keyboard.press('Enter');
      await expect(c.locator('.slice_select_menu')).toBeVisible();
      // Reopening lands on the current choice.
      expect(await active()).toBe('Gamma');
      await page.keyboard.press('Escape');
      await expect(c.locator('.slice_select_menu')).toBeHidden();
   });

   test('a select you cannot type in still jumps by letter', async ({ mount, page }) => {
      const c = await mount('Select', { options: ['Apple', 'Banana', 'Blueberry', 'Cherry'] });
      await field(c).focus();
      await page.keyboard.press('b');
      await page.keyboard.press('b');
      await page.keyboard.press('Enter');
      expect(await c.component.evaluate((el) => el.selected)).toBe('Blueberry');
   });

   test('searchable: filters as you type (accents ignored), highlights, shows "No results"', async ({ mount, page }) => {
      const c = await mount('Select', { options: GROUPED, searchable: true, noResultsText: 'Nada' });
      await field(c).click();
      await page.keyboard.type('espa');
      await expect(options(c)).toHaveText(['España']);
      await expect(options(c).first().locator('mark')).toHaveText('Espa');
      await page.keyboard.press('Enter');
      expect(await c.component.evaluate((el) => el.selected)).toBe('es');
      await field(c).click();
      await page.keyboard.type('zz');
      await expect(c.locator('.slice_select_no_results')).toHaveText('Nada');
   });

   test('groups get a heading; a description shows under the label; disabled options do nothing', async ({ mount }) => {
      const c = await mount('Select', { options: GROUPED });
      await c.locator('.slice_select_container').click();
      await expect(c.locator('.slice_select_group')).toHaveText(['Americas', 'Europe']);
      await expect(c.locator('.slice_select_option_description')).toHaveText('Caracas');
      const france = c.component.getByRole('option', { name: 'France' });
      await expect(france).toHaveAttribute('aria-disabled', 'true');
      await france.click({ force: true });
      expect(await c.component.evaluate((el) => el.selected)).toBeNull();
   });

   test('clearable: ✕ clears and fires onChange; hidden until there is a value', async ({ mount }) => {
      const c = await mount('Select', { options: FRUITS, clearable: true }, { spies: ['onChange'] });
      await expect(c.locator('.slice_select_clear')).toBeHidden();
      await c.component.evaluate((el) => { el.selected = 'apple'; });
      await expect(c.locator('.slice_select_clear')).toBeVisible();
      await c.locator('.slice_select_clear').click();
      expect(await c.component.evaluate((el) => el.selected)).toBeNull();
      expect((await c.eventArgs('onChange')).at(-1)[0]).toBeNull();
   });

   test('the floating label rises when there is a value or the list is open, and never overlaps the placeholder', async ({ mount, page }) => {
      const c = await mount('Select', { label: 'Fruit', placeholder: 'Pick one', options: FRUITS, searchable: true });
      const label = c.locator('.slice_select_label');
      await expect(label).not.toHaveClass(/slice_select_value/);
      await expect(field(c)).toHaveAttribute('placeholder', '');
      await field(c).click();
      await expect(label).toHaveClass(/slice_select_value/);
      await expect(field(c)).toHaveAttribute('placeholder', 'Pick one');
      await page.waitForTimeout(300);
      const overlap = await c.component.evaluate((el) => {
         const a = el.querySelector('.slice_select_label').getBoundingClientRect();
         const b = el.querySelector('.slice_select').getBoundingClientRect();
         return a.bottom > b.top + 1 && a.top < b.bottom - 1;
      });
      expect(overlap).toBe(false);
      await page.keyboard.press('Escape');
      await expect(label).not.toHaveClass(/slice_select_value/);
      await expect(field(c)).toHaveAttribute('placeholder', '');
   });
});

test.describe('Select — multiple', () => {
   test('chips show the picks; ✕ and Backspace remove; the list stays open', async ({ mount, page }) => {
      const c = await mount('Select', { options: FRUITS, multiple: true, selected: ['apple'] }, { spies: ['onChange'] });
      await expect(c.locator('.slice_select_chip')).toHaveText(['Apple']);
      await c.locator('.slice_select_container').click();
      await expect(c.locator('.slice_select_menu')).toHaveAttribute('aria-multiselectable', 'true');
      await c.component.getByRole('option', { name: 'Cherry' }).click();
      await expect(c.locator('.slice_select_menu')).toBeVisible();
      await expect(c.locator('.slice_select_chip')).toHaveText(['Apple', 'Cherry']);
      await expect(c.component.getByRole('option', { name: 'Cherry' })).toHaveAttribute('aria-selected', 'true');
      await c.component.getByRole('button', { name: 'Remove Apple' }).click();
      await expect(c.locator('.slice_select_chip')).toHaveText(['Cherry']);
      await field(c).focus();
      await page.keyboard.press('Backspace');
      await expect(c.locator('.slice_select_chip')).toHaveCount(0);
      expect((await c.eventArgs('onChange')).map((args) => args[0])).toEqual([['apple', 'cherry'], ['cherry'], []]);
   });

   test('selectAll toggles every enabled option (mixed when some are picked); max caps the picks', async ({ mount }) => {
      const c = await mount('Select', { options: GROUPED, multiple: true, selectAll: true });
      await c.locator('.slice_select_container').click();
      const all = c.component.getByRole('option', { name: 'Select all' });
      await all.click();
      expect(await c.component.evaluate((el) => el.selected)).toEqual(['ar', 've', 'es']);
      await c.component.getByRole('option', { name: 'Argentina' }).click();
      await expect(all).toHaveClass(/is-mixed/);
      await all.click();
      await all.click();
      expect(await c.component.evaluate((el) => el.selected)).toEqual([]);

      const m = await mount('Select', { options: FRUITS, multiple: true, max: 2 });
      await m.locator('.slice_select_container').click();
      await m.component.getByRole('option', { name: 'Apple' }).click();
      await m.component.getByRole('option', { name: 'Banana' }).click();
      await expect(m.component.getByRole('option', { name: 'Cherry' })).toHaveAttribute('aria-disabled', 'true');
      await m.component.getByRole('option', { name: 'Cherry' }).click({ force: true });
      expect(await m.component.evaluate((el) => el.selected)).toEqual(['apple', 'banana']);
   });
});

test.describe('Select — creatable and remote', () => {
   test('creatable: typing something new offers "Create", and onCreate shapes it', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const sel = await build(page, { options: ['bug', 'docs'], multiple: true, creatable: true }, `{ onCreate: (label) => ({ value: label.toUpperCase(), label }) }`);
      await sel.getByRole('combobox').click();
      await page.keyboard.type('perf');
      await expect(sel.getByRole('option')).toHaveText(['Create “perf”']);
      await page.keyboard.press('Enter');
      await expect(sel.locator('.slice_select_chip')).toHaveText(['perf']);
      expect(await page.evaluate(() => window.__sel.selected)).toEqual(['PERF']);
      // An exact match does not offer to create it again.
      await page.keyboard.type('docs');
      await expect(sel.getByRole('option')).toHaveText(['docs']);
   });

   test('loadOptions: asks the server as you type (debounced), shows Loading…, aborts stale requests', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const sel = await build(page, { searchable: true }, `{ loadOptions: async (query, { signal }) => {
         log(query);
         await new Promise((r) => setTimeout(r, 200));
         if (signal.aborted) { log('aborted:' + query); return []; }
         return ['Ana', 'Andrés', 'Bruno', 'Beatriz'].filter((n) => n.toLowerCase().startsWith(query.toLowerCase())).map((n) => ({ value: n.toLowerCase(), label: n }));
      } }`);
      await sel.getByRole('combobox').click();
      await expect(sel.locator('.slice_select_loading')).toBeVisible();
      await expect(sel.getByRole('option')).toHaveCount(4);
      await page.keyboard.type('an', { delay: 40 });
      await expect(sel.getByRole('option')).toHaveText(['Ana', 'Andrés']);
      const asked = await page.evaluate(() => window.__log.filter((entry) => !String(entry[0]).startsWith('aborted')).map((entry) => entry[0]));
      // '' on open, then only 'an': the keystrokes in between were debounced.
      expect(asked).toEqual(['', 'an']);
      // While filtering, the first match is already the active option.
      await page.keyboard.press('Enter');
      expect(await page.evaluate(() => window.__sel.selected)).toBe('ana');
      await expect(sel.getByRole('combobox')).toHaveValue('Ana');
   });

   test('a remote select keeps the label of a value it was given before loading', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const sel = await build(page, { multiple: true }, `{ loadOptions: async () => [], selected: ['x1'] }`);
      await expect(sel.locator('.slice_select_chip')).toHaveText(['x1']);
   });
});

test.describe('Select — large lists, looks and forms', () => {
   test('virtual: 5,000 options render a window of rows; End-to-end keyboard works', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      await page.evaluate(async () => {
         const opts = Array.from({ length: 5000 }, (_, i) => ({ value: i, label: `Item ${i}` }));
         const el = await slice.build('Select', { options: opts, label: 'Many' });
         el.id = 'sel';
         document.getElementById('host').appendChild(el);
      });
      const sel = page.locator('#sel');
      await sel.locator('.slice_select_container').click();
      const rendered = await sel.locator('[role="option"]').count();
      expect(rendered).toBeGreaterThan(5);
      expect(rendered).toBeLessThan(40);
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Enter');
      expect(await page.evaluate(() => document.getElementById('sel').selected)).toBe(4999);
   });

   test('variant, size, error, help and required are reflected; sizes change the height', async ({ mount }) => {
      const c = await mount('Select', { options: FRUITS, variant: 'filled', size: 'lg', error: 'Required', help: 'Ignored while there is an error', required: true, label: 'Fruit' });
      await expect(c.component).toHaveAttribute('data-variant', 'filled');
      await expect(c.locator('.slice_select_message')).toHaveText('Required');
      await expect(field(c)).toHaveAttribute('aria-invalid', 'true');
      await expect(field(c)).toHaveAttribute('aria-required', 'true');
      expect(await field(c).getAttribute('aria-describedby')).toBe(await c.locator('.slice_select_message').getAttribute('id'));
      const lg = await c.locator('.slice_select_container').evaluate((el) => el.getBoundingClientRect().height);
      await c.component.evaluate((el) => { el.size = 'sm'; el.error = ''; el.variant = 'nope'; });
      const sm = await c.locator('.slice_select_container').evaluate((el) => el.getBoundingClientRect().height);
      expect(lg).toBeGreaterThan(sm);
      await expect(c.locator('.slice_select_message')).toHaveText('Ignored while there is an error');
      await expect(c.component).toHaveAttribute('data-variant', 'outlined');
   });

   test('name: hidden inputs carry the value(s) into a form', async ({ mount }) => {
      const c = await mount('Select', { options: FRUITS, multiple: true, selected: ['apple', 'cherry'], name: 'fruits' });
      const values = await c.component.evaluate((el) => [...el.querySelectorAll('input[type="hidden"][name="fruits"]')].map((i) => i.value));
      expect(values).toEqual(['apple', 'cherry']);
   });

   test('destroying it while open leaves no errors', async ({ mount, page }) => {
      const c = await mount('Select', { options: FRUITS });
      await c.locator('.slice_select_container').click();
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      await page.mouse.click(5, 5);
      expect(c.pageErrors()).toEqual([]);
   });
});