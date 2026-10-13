import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Baseline contract for the Select visual component.
// Assertions are derived from Select.js / Select.html:
//   - root structure: .slice_select_dropdown > .slice_select_container(label,input.slice_select,.caret) + .slice_select_menu
//   - options[] render as [role=option] divs in .slice_select_menu (text taken from option[visibleProp])
//   - a11y: container is role=button, tabindex=0, aria-haspopup=listbox, aria-expanded toggles; menu role=listbox
//   - keyboard: Enter/Space toggles open; Escape closes
//   - handlers: canonical onChange; deprecated alias onOptionSelect (§7)

const OPTIONS = [{ text: 'Apple' }, { text: 'Banana' }, { text: 'Cherry' }];

test.describe('Select', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_select_container')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('label prop renders into the select label', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Pick a fruit' });
      await expect(c.locator('.slice_select_label')).toHaveText('Pick a fruit');
   });

   test('options render as role=option items using visibleProp text', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit' });
      const opts = c.locator('.slice_select_menu [role="option"]');
      await expect(opts).toHaveCount(3);
      await expect(opts.nth(0)).toHaveText('Apple');
      await expect(opts.nth(2)).toHaveText('Cherry');
   });

   test('visibleProp controls which option property is displayed', async ({ mount }) => {
      const c = await mount('Select', {
         options: [{ name: 'Uno' }, { name: 'Dos' }],
         visibleProp: 'name',
      });
      const opts = c.locator('.slice_select_menu [role="option"]');
      await expect(opts.nth(0)).toHaveText('Uno');
      await expect(opts.nth(1)).toHaveText('Dos');
   });

   test('a11y: container and menu carry the expected roles/attributes', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS });
      const container = c.locator('.slice_select_container');
      await expect(container).toHaveAttribute('role', 'button');
      await expect(container).toHaveAttribute('tabindex', '0');
      await expect(container).toHaveAttribute('aria-haspopup', 'listbox');
      await expect(container).toHaveAttribute('aria-expanded', 'false');
      await expect(c.locator('.slice_select_menu')).toHaveAttribute('role', 'listbox');
   });

   test('clicking the container opens the menu and sets aria-expanded', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS });
      await c.locator('.slice_select_container').click();
      await expect(c.locator('.slice_select_menu')).toHaveClass(/menu_open/);
      await expect(c.locator('.slice_select_container')).toHaveAttribute('aria-expanded', 'true');
   });

   test('keyboard: Enter opens then Escape closes the menu', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS });
      const container = c.locator('.slice_select_container');
      await container.focus();
      await container.press('Enter');
      await expect(c.locator('.slice_select_menu')).toHaveClass(/menu_open/);
      await container.press('Escape');
      await expect(c.locator('.slice_select_menu')).not.toHaveClass(/menu_open/);
   });

   test('disabled select does not open on click', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, disabled: true });
      await c.locator('.slice_select_container').click();
      await expect(c.locator('.slice_select_menu')).not.toHaveClass(/menu_open/);
   });

   test('selecting an option marks it active and updates the field value', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit' });
      await c.locator('.slice_select_container').click();
      const banana = c.locator('.slice_select_menu [role="option"]').nth(1);
      await banana.click();
      await expect(banana).toHaveClass(/active/);
      await expect(banana).toHaveAttribute('aria-selected', 'true');
      await expect(c.locator('.slice_select')).toHaveValue('Banana');
   });

   test('onChange fires when an option is selected', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS }, { spies: ['onChange'] });
      await c.locator('.slice_select_container').click();
      await c.locator('.slice_select_menu [role="option"]').nth(0).click();
      expect(await c.events('onChange')).toBe(1);
   });

   // §7 deprecation: onOptionSelect is the legacy alias for onChange; it must still
   // fire AND emit exactly one deprecation warning.
   test('deprecated onOptionSelect still fires and warns once', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS }, { spies: ['onOptionSelect'] });
      await c.locator('.slice_select_container').click();
      await c.locator('.slice_select_menu [role="option"]').nth(0).click();

      expect(await c.events('onOptionSelect')).toBe(1);
      const deprecations = c.deprecationWarnings();
      expect(deprecations.filter((w) => w.includes('onOptionSelect')).length).toBe(1);
   });

   test('visual: select with options @visual', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit' });
      await expect(c.component).toHaveScreenshot('select-default.png');
   });
});

test.describe('Select — searchable / clearable / keyboard', () => {
   test('searchable filters the options as you type', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, label: 'Fruit', searchable: true });
      await c.locator('.slice_select_container').click();
      await c.locator('.slice_select').fill('an'); // only "Banana" contains "an"
      const visible = c.locator('.slice_select_menu [role="option"]:visible');
      await expect(visible).toHaveCount(1);
      await expect(visible.nth(0)).toHaveText('Banana');
   });

   test('searchable shows a no-results row when nothing matches', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, searchable: true });
      await c.locator('.slice_select_container').click();
      await c.locator('.slice_select').fill('zzz');
      await expect(c.locator('.slice_select_menu [role="option"]:visible')).toHaveCount(0);
      await expect(c.locator('.slice_select_no_results')).toBeVisible();
   });

   test('clearable: a clear button resets the selection and fires onChange', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, clearable: true }, { spies: ['onChange'] });
      await c.locator('.slice_select_container').click();
      await c.locator('.slice_select_menu [role="option"]').nth(0).click();
      await expect(c.locator('.slice_select')).toHaveValue('Apple');

      const clear = c.locator('.slice_select_clear');
      await expect(clear).toBeVisible();
      await clear.click();

      await expect(c.locator('.slice_select')).toHaveValue('');
      expect(await c.events('onChange')).toBe(2); // one select + one clear
   });

   test('clear button is hidden until something is selected', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS, clearable: true });
      await expect(c.locator('.slice_select_clear')).toBeHidden();
   });

   test('keyboard: ArrowDown highlights options and Enter selects', async ({ mount }) => {
      const c = await mount('Select', { options: OPTIONS });
      const container = c.locator('.slice_select_container');
      await container.focus();
      await container.press('ArrowDown'); // open
      await container.press('ArrowDown'); // highlight Apple
      await container.press('ArrowDown'); // highlight Banana
      await container.press('Enter');
      await expect(c.locator('.slice_select')).toHaveValue('Banana');
   });
});

// ── Searching must not overprint the label on the placeholder ──
//
// `.slice_select_label` is position:absolute in the input's own place whenever
// the field is empty. _setOpen(true) also sets the input's placeholder, so
// before this fix the two strings were drawn on top of each other and the field
// read as garbled overlapping text rather than as "label + placeholder".

test.describe('Select - searching', () => {
   const FRAMEWORKS = [{ name: 'Angular' }, { name: 'React' }, { name: 'Slice.js' }];

   const build = async (mount, extra = {}) =>
      mount('Select', {
         options: FRAMEWORKS,
         visibleProp: 'name',
         label: 'Framework',
         placeholder: 'Pick one',
         searchable: true,
         ...extra,
      });

   test('an empty searchable hides the label while the menu is open', async ({ mount }) => {
      const c = await build(mount);

      const closed = await c.component.evaluate((el) => ({
         searching: el.$label.classList.contains('slice_select_searching'),
         opacity: getComputedStyle(el.$label).opacity,
      }));
      expect(closed.searching).toBe(false);
      expect(closed.opacity).toBe('1');

      await c.component.evaluate((el) => el._setOpen(true));
      await expect(c.locator('.slice_select_label.slice_select_searching')).toHaveCount(1);

      // Wait out the 0.5s opacity transition rather than sampling it mid-flight.
      await expect
         .poll(() => c.component.evaluate((el) => getComputedStyle(el.$label).opacity), {
            timeout: 5000,
         })
         .toBe('0');
   });

   test('the input keeps the placeholder once the label is out of the way', async ({ mount }) => {
      const c = await build(mount);

      const state = await c.component.evaluate(async (el) => {
         el._setOpen(true);
         await new Promise((r) => setTimeout(r, 600));
         return {
            placeholder: el.$select.placeholder,
            labelOpacity: getComputedStyle(el.$label).opacity,
            readOnly: el.$select.readOnly,
         };
      });

      expect(state.placeholder).toBe('Pick one');
      expect(state.readOnly).toBe(false);
      expect(state.labelOpacity).toBe('0');
   });

   test('a FLOATED label stays visible while searching', async ({ mount }) => {
      // With a value selected the label is lifted clear of the input
      // (slice_select_value), so there is nothing to overprint and hiding it
      // would strip the field of its label the moment you start typing.
      const c = await build(mount);

      const state = await c.component.evaluate(async (el) => {
         await el._selectOption(el._optionEls[0].option, el._optionEls[0].el);
         el._setOpen(true);
         await new Promise((r) => setTimeout(r, 600));
         return {
            searching: el.$label.classList.contains('slice_select_searching'),
            floated: el.$label.classList.contains('slice_select_value'),
            opacity: getComputedStyle(el.$label).opacity,
         };
      });

      // The class IS applied - the guard lives in the CSS selector, not here.
      expect(state.searching).toBe(true);
      expect(state.floated).toBe(true);
      expect(state.opacity).toBe('1');
   });

   test('closing removes the searching state', async ({ mount }) => {
      const c = await build(mount);

      const state = await c.component.evaluate(async (el) => {
         el._setOpen(true);
         await new Promise((r) => setTimeout(r, 50));
         const whileOpen = el.$label.classList.contains('slice_select_searching');
         el._setOpen(false);
         await new Promise((r) => setTimeout(r, 50));
         return {
            whileOpen,
            afterClose: el.$label.classList.contains('slice_select_searching'),
         };
      });

      expect(state.whileOpen).toBe(true);
      expect(state.afterClose).toBe(false);
   });

   test('a NON-searchable select never enters the searching state', async ({ mount }) => {
      const c = await mount('Select', {
         options: FRAMEWORKS,
         visibleProp: 'name',
         label: 'Framework',
         placeholder: 'Pick one',
      });

      const state = await c.component.evaluate(async (el) => {
         el._setOpen(true);
         await new Promise((r) => setTimeout(r, 300));
         return {
            searching: el.$label.classList.contains('slice_select_searching'),
            opacity: getComputedStyle(el.$label).opacity,
         };
      });

      expect(state.searching).toBe(false);
      expect(state.opacity).toBe('1');
   });

   test('the label and the placeholder do not overlap on screen', async ({ mount }) => {
      // The user-visible invariant behind all of the above: while searching an
      // empty field, the only thing painted in the input is the placeholder.
      const c = await build(mount);

      const geom = await c.component.evaluate(async (el) => {
         el._setOpen(true);
         await new Promise((r) => setTimeout(r, 600));
         const input = el.$select.getBoundingClientRect();
         const label = el.$label.getBoundingClientRect();

         // Do the two boxes really share space? That is the whole reason the
         // label has to go: they overlap, so both being painted is unreadable.
         const overlap =
            input.left < label.right &&
            label.left < input.right &&
            input.top < label.bottom &&
            label.top < input.bottom;

         return {
            labelOpacity: Number(getComputedStyle(el.$label).opacity),
            inputBox: `${Math.round(input.x)},${Math.round(input.y)} ${Math.round(input.width)}x${Math.round(input.height)}`,
            labelBox: `${Math.round(label.x)},${Math.round(label.y)} ${Math.round(label.width)}x${Math.round(label.height)}`,
            overlap,
         };
      });

      expect(geom.overlap, `label ${geom.labelBox} vs input ${geom.inputBox}`).toBe(true);
      expect(geom.labelOpacity).toBe(0);
   });
});