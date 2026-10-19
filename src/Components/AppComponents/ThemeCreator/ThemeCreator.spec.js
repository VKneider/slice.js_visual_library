import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ThemeCreator is a top-level page route, but it is still a registered Slice
// component, so it mounts through the same `slice.build` the router uses.
//
// It reads the 15 REQUIRED theme tokens off the LIVE theme into one ColorPicker
// each, repaints a preview subtree as you drag them, and exports the result as
// CSS + a sliceConfig themeManager block. The invariant worth protecting above
// all others: it never writes to `:root`. Everything it paints lands on
// `.theme-creator__preview`, so a half-finished theme cannot leak into the host
// app — which is what the original save/restore dance was paying for.

const REQUIRED_TOKENS = [
   '--primary-color',
   '--primary-background-color',
   '--primary-color-contrast',
   '--primary-color-shade',
   '--secondary-color',
   '--secondary-background-color',
   '--secondary-color-contrast',
   '--success-color',
   '--warning-color',
   '--danger-color',
   '--font-primary-color',
   '--font-secondary-color',
   '--tertiary-background-color',
   '--medium-color',
   '--disabled-color',
];

/**
 * The native input of the picker bound to one CSS token.
 *
 * Addressed by the picker's `hint` rather than by id: ColorPicker generates its
 * own unique input id per instance, and `--primary-color` is a PREFIX of
 * `--primary-color-contrast`, so a substring match would return two pickers.
 * `:text-is()` is the exact-match form.
 */
const pickerFor = (c, cssVar) =>
   c.locator(`slice-color-picker:has(.slice_color_picker__hint:text-is("${cssVar}")) .slice_color_picker__input`);

test.describe('ThemeCreator', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.theme-creator__title')).toHaveText('Theme Creator');
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders one ColorPicker per required theme token', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      await expect(c.locator('slice-color-picker')).toHaveCount(REQUIRED_TOKENS.length);

      // Every token is named in the UI, not just editable — a token that exists
      // only in the export is the failure mode this guards.
      const hints = await c.locator('.slice_color_picker__hint').allTextContents();
      expect(hints.map((v) => v.trim())).toEqual(REQUIRED_TOKENS);
   });

   test('the token controls are Slice components, not raw inputs', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      // The pre-migration page hand-rolled `<input type="color">` per token.
      // Every interactive primitive it renders should now be a registered one.
      await expect(c.locator('[data-el="groups"] slice-color-picker')).toHaveCount(REQUIRED_TOKENS.length);
      await expect(c.locator('[data-el="groups"] slice-grid')).toHaveCount(5);

      // Every colour input on the page belongs to a ColorPicker — none is the
      // page's own hand-rolled markup.
      const orphanInputs = await c.component.evaluate(
         (root) => root.querySelectorAll('input[type="color"]').length
      );
      expect(orphanInputs).toBe(REQUIRED_TOKENS.length);
      expect(
         await c.component.evaluate((root) => root.querySelectorAll('slice-color-picker input[type="color"]').length)
      ).toBe(REQUIRED_TOKENS.length);
   });

   test('pickers load the ACTIVE theme, not hardcoded defaults', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      // LIGHT.css ships a purple primary (#9333ea); the pre-migration defaults
      // were blue (#0066ff), so this reads as #0066ff when the component is
      // falling back instead of reading the theme.
      await expect(pickerFor(c, '--primary-color')).toHaveValue('#9333ea');
   });

   test('reloads the pickers when a theme control switches the theme', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      // The sequence ThemeSelector/ThemeSwitcher perform: apply the theme, then
      // announce it. ThemeCreator listens for the announcement, so this is the
      // exact path the page's own navbar takes when the user clicks the toggle.
      await c.component.evaluate(async () => {
         await window.slice.setTheme('DARK');
         document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeName: 'DARK' } }));
      });
      await expect.poll(() => pickerFor(c, '--primary-color').inputValue()).not.toBe('#9333ea');

      await c.component.evaluate(async () => {
         await window.slice.setTheme('LIGHT');
         document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeName: 'LIGHT' } }));
      });
   });

   test('editing a picker repaints the preview subtree', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      await pickerFor(c, '--primary-color').fill('#ff0000');

      await expect
         .poll(() =>
            c.locator('.theme-creator__preview').evaluate((el) => el.style.getPropertyValue('--primary-color'))
         )
         .toBe('#ff0000');
   });

   test('never writes the edited theme onto :root', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      await pickerFor(c, '--primary-color').fill('#ff0000');

      const rootValue = await c.component.evaluate(() =>
         document.documentElement.style.getPropertyValue('--primary-color')
      );
      expect(rootValue).toBe('');
   });

   test('preview=false hides the preview panel', async ({ mount }) => {
      const c = await mount('ThemeCreator', { preview: false });
      // `hidden` only works because the stylesheet carries the [hidden]
      // companion rule (§8.2) — without it the panel stays visible.
      await expect(c.locator('[data-el="preview-panel"]')).toBeHidden();
   });

   test('preview defaults to visible', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      await expect(c.locator('[data-el="preview-panel"]')).toBeVisible();
   });

   test('the preview is built from Slice components', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      await expect(c.locator('[data-el="preview-buttons"] slice-button')).toHaveCount(7);
      await expect(c.locator('[data-el="preview-inputs"] slice-input')).toHaveCount(2);
      await expect(c.locator('[data-el="preview-switches"] slice-switch')).toHaveCount(2);
      // Status surfaces are Cards reading var(--…) so they repaint with the rest.
      await expect(c.locator('[data-el="preview-status"] slice-card')).toHaveCount(3);
   });

   test('showNavbar=false skips the page navbar', async ({ mount }) => {
      const c = await mount('ThemeCreator', { showNavbar: false });
      await expect(c.locator('[data-el="navbar"] slice-nav-bar')).toHaveCount(0);
   });

   test('the page navbar links back into the site, including this route', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const links = await c.locator('[data-el="navbar"] slice-nav-bar .nav_bar_menu').evaluateAll((nodes) =>
         nodes.flatMap((node) =>
            Array.from(node.querySelectorAll('a')).map((a) => ({
               text: a.textContent.trim(),
               path: a.getAttribute('href'),
            }))
         )
      );

      // This route is top-level, so the AppShell navbar is not on the page —
      // without a link here the page would be a dead end.
      expect(links.map((l) => l.path)).toContain('/theme-creator');
      expect(links.map((l) => l.text)).toContain('Theme Creator');
      expect(links.map((l) => l.path)).toContain('/docs');
   });

   test('themeName seeds the name field and the exported config', async ({ mount }) => {
      const c = await mount('ThemeCreator', { themeName: 'Ocean' });
      await expect(c.locator('[data-el="name-input"] input')).toHaveValue('Ocean');

      const config = await c.component.evaluate((el) => el.generateConfig());
      expect(JSON.parse(config).themeManager.defaultTheme).toBe('Ocean');
   });

   test('export dialog renders the generated CSS in a read-only Textarea', async ({ mount }) => {
      const c = await mount('ThemeCreator', { themeName: 'Ocean' });
      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Export theme' }).click();

      // The dialog is mounted on <body>, deliberately outside the page subtree.
      const dialog = c.root.page().locator('slice-modal');
      await expect(dialog).toBeVisible();

      const fields = dialog.locator('slice-textarea textarea');
      await expect(fields).toHaveCount(2);
      // Read-only, not disabled: a disabled field cannot be selected, which
      // would break the "copy it manually" fallback.
      await expect(fields.first()).toHaveAttribute('readonly', '');

      const css = await fields.first().inputValue();
      expect(css).toContain(':root {');
      expect(css).toContain('--primary-color:');
      // Derived tokens are computed, not editable — they must still ship.
      expect(css).toContain('--primary-color-rgb:');
      expect(css).toContain('--success-contrast:');
   });

   test('derived status contrasts are readable, not copies of the status colour', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const contrasts = await c.component.evaluate((el) => {
         const values = el.getTokenValues();
         return {
            success: [values['--success-color'], values['--success-contrast']],
            danger: [values['--danger-color'], values['--danger-contrast']],
         };
      });
      // The pre-migration version wrote the status colour into its own contrast
      // token, which shipped "Success" as green text on a green background.
      expect(contrasts.success[0]).not.toBe(contrasts.success[1]);
      expect(contrasts.danger[0]).not.toBe(contrasts.danger[1]);
   });

   test('autoPreview=false holds the preview until Preview is pressed', async ({ mount }) => {
      const c = await mount('ThemeCreator', { autoPreview: false }, { theme: 'LIGHT' });
      const previewValue = () =>
         c.locator('.theme-creator__preview').evaluate((el) => el.style.getPropertyValue('--primary-color'));

      await pickerFor(c, '--primary-color').fill('#ff0000');
      // The edit is recorded, but nothing is painted until asked.
      expect(await previewValue()).toBe('#9333ea');

      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Preview' }).click();
      await expect.poll(previewValue).toBe('#ff0000');
   });

   test('the Preview button does something visible even when autoPreview is on', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      // With autoPreview the panel is already correct, so a click that only
      // repaints reads as a dead button. It must still confirm itself.
      const page = c.root.page();
      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Preview' }).click();

      await expect(page.locator('body slice-toast').first()).toBeVisible();
      await expect(page.locator('body slice-toast').first()).toContainText('Preview updated.');
   });

   test('Preview says so when the preview panel is disabled', async ({ mount }) => {
      const c = await mount('ThemeCreator', { preview: false });
      const page = c.root.page();
      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Preview' }).click();

      // Nothing to scroll to and nothing to show — say THAT instead of
      // silently scrolling into a display:none subtree.
      await expect(page.locator('body slice-toast').first()).toContainText('turned off');
   });

   test('the page clears the fixed navbar instead of hiding behind it', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      // This route is top-level, so it never gets the AppShell's
      // `.app-content { padding-top: 72px }`. The host must reserve that space
      // itself or the fixed navbar sits on the header.
      const title = c.locator('.theme-creator__title');
      const top = await title.evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeGreaterThan(72);
   });

   test('Apply to whole app re-themes the document, and the button becomes Restore', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      const page = c.root.page();
      const applyBtn = c.locator('[data-el="actions"] slice-button').filter({ hasText: /whole app|Restore/ });

      await expect(applyBtn).toContainText('Apply to whole app');
      expect(
         await c.component.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()
         )
      ).not.toBe('#ff0000');

      await pickerFor(c, '--primary-color').fill('#ff0000');
      await applyBtn.click();

      expect(
         await c.component.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()
         )
      ).toBe('#ff0000');
      await expect(applyBtn).toContainText('Restore real theme');

      // And back again.
      await applyBtn.click();
      await expect(applyBtn).toContainText('Apply to whole app');
      expect(
         await c.component.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()
         )
      ).not.toBe('#ff0000');
   });

   test('an override from a previous visit is reflected on mount', async ({ mount }) => {
      // Persisted + sticky by design: coming back to the page must not silently
      // re-apply, nor silently forget that the app is currently in a custom theme.
      const first = await mount('ThemeCreator');
      await first.root.page().evaluate(() => {
         window.ThemeOverride.shared().apply({ '--primary-color': '#ff00ff' });
      });

      // Drop everything a reload would not keep, leaving only localStorage.
      await first.root.page().evaluate(() => {
         document.getElementById('slice-theme-override')?.remove();
         window.ThemeOverride._shared = null;
      });

      const c = await mount('ThemeCreator');
      await expect(c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Restore' })).toBeVisible();
      // Restored on mount, not only on the next Apply click.
      expect(
         await c.component.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()
         )
      ).toBe('#ff00ff');

      await c.root.page().evaluate(() => window.ThemeOverride.shared().clear());
   });

   test('a real theme switch drops the override and says so', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      const page = c.root.page();

      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'whole app' }).click();
      expect(
         await c.component.evaluate(() => !!document.getElementById('slice-theme-override'))
      ).toBe(true);

      // What ThemeSelector does. Without the override dropping itself, the
      // switch would look broken: icon changes, colours do not.
      await c.component.evaluate(async () => {
         await window.slice.setTheme('DARK');
         document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeName: 'DARK' } }));
      });

      expect(
         await c.component.evaluate(() => !!document.getElementById('slice-theme-override'))
      ).toBe(false);
      // Match by text, not `.first()` — the "Applied to the whole app" toast from
      // the click above is still on screen and would be the first match.
      await expect(
         page.locator('body slice-toast').filter({ hasText: 'override was dropped' })
      ).toBeVisible();

      await c.component.evaluate(async () => {
         await window.slice.setTheme('LIGHT');
         document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeName: 'LIGHT' } }));
      });
   });

   test('the palette-mode selector offers follow/light/dark and defaults to follow', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      await expect(c.locator('[data-el="palette-mode"] slice-select')).toBeVisible();
      // `auto` is the default so rolling on a dark theme does not silently
      // produce a light palette.
      expect(await c.component.evaluate((el) => el.paletteMode)).toBe('auto');
      await expect(c.locator('[data-el="palette-hint"]')).toContainText('Following the active theme');
      await expect(c.locator('[data-el="palette-hint"]')).toContainText('light');
   });

   test('choosing a mode in the Select updates the prop and the hint', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      const page = c.root.page();
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await c.locator('[data-el="palette-mode"] .slice_select_container').click();
      await c.locator('[data-el="palette-mode"] [role="option"]').nth(2).click(); // Always dark

      expect(await c.component.evaluate((el) => el.paletteMode)).toBe('dark');
      await expect(c.locator('[data-el="palette-hint"]')).toContainText('Rolls target dark');
      expect(pageErrors).toEqual([]);
   });

   test('paletteMode=dark rolls a dark palette on a LIGHT theme', async ({ mount }) => {
      const c = await mount('ThemeCreator', { paletteMode: 'dark' }, { theme: 'LIGHT' });
      await expect(c.locator('[data-el="palette-hint"]')).toContainText('Rolls target dark');

      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Randomize' }).click();

      // Forced dark, even though the active theme is light — that is the point
      // of the override.
      const value = await c.component.evaluate((el) =>
         el.getTokenValues()['--primary-background-color']
      );
      expect(value).toMatch(/^#[0-9a-f]{6}$/);
      expect(await c.component.evaluate((el) => el._resolvePaletteMode())).toBe('dark');
   });

   test('paletteMode=light rolls a light palette on a DARK theme', async ({ mount }) => {
      const c = await mount('ThemeCreator', { paletteMode: 'light' }, { theme: 'DARK' });
      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Randomize' }).click();
      expect(await c.component.evaluate((el) => el._resolvePaletteMode())).toBe('light');
      await c.component.evaluate(async () => {
         await window.slice.setTheme('LIGHT');
      });
   });

   test('an unknown paletteMode falls back to auto', async ({ mount }) => {
      const c = await mount('ThemeCreator', { paletteMode: 'chartreuse' }, { theme: 'LIGHT' });
      expect(await c.component.evaluate((el) => el.paletteMode)).toBe('auto');
   });

   test('Randomize fills every picker and repaints the preview', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      const before = await c.component.evaluate((el) => el.getTokenValues());

      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Randomize' }).click();

      const after = await c.component.evaluate((el) => el.getTokenValues());
      const changed = Object.keys(after).filter((token) => after[token] !== before[token]);
      expect(changed.length).toBeGreaterThan(10);

      // Every picker shows the new value — a rolled palette nobody can see is
      // not a rolled palette.
      const mismatch = await c.component.evaluate((el) => {
         const values = el.getTokenValues();
         const out = [];
         for (const [token, picker] of el._pickers) {
            const expected = values[picker.querySelector('.slice_color_picker__hint').textContent.trim()];
            if (picker.value !== expected) out.push(token);
         }
         return out;
      });
      expect(mismatch).toEqual([]);
   });

   test('Randomize fires onChange ONCE, not once per token', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { spies: ['onChange'] });
      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Randomize' }).click();

      await expect.poll(() => c.events('onChange')).toBe(1);
      // Setting a picker's `value` must not re-enter its onChange handler.
      const [[payload]] = await c.eventArgs('onChange');
      expect(Object.keys(payload).length).toBeGreaterThan(15);
   });

   test('Randomize produces a readable palette on the LIGHT theme', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      const page = c.root.page();
      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Randomize' }).click();

      // The rolled palette is only useful if the body text still reads. Assert
      // it on the preview subtree, which is where those tokens are applied.
      const ratio = await page.evaluate(() => {
         const el = document.querySelector('slice-theme-creator .theme-creator__preview');
         // Custom properties are NOT resolved to rgb() by getComputedStyle, so
         // what the preview holds is the hex the editor wrote.
         const channels = (token) => {
            const hex = el.style.getPropertyValue(token).trim().replace('#', '');
            return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
         };
         const lum = (rgb) => {
            const [r, g, b] = rgb.map((v) => {
               const c = v;
               return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
         };
         const fg = lum(channels('--font-primary-color'));
         const bg = lum(channels('--primary-background-color'));
         const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
         return (hi + 0.05) / (lo + 0.05);
      });

      expect(ratio).toBeGreaterThanOrEqual(4.5);
   });

   test('onChange fires with the resolved token map on every edit', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { spies: ['onChange'] });
      await pickerFor(c, '--success-color').fill('#00ff00');
      await expect.poll(() => c.events('onChange')).toBe(1);

      // eventArgs() is [[argsOfCall0], [argsOfCall1], ...]
      const [[payload]] = await c.eventArgs('onChange');
      expect(payload['--success-color']).toBe('#00ff00');
   });

   test('reset restores the active theme values', async ({ mount }) => {
      const c = await mount('ThemeCreator', {}, { theme: 'LIGHT' });
      await pickerFor(c, '--primary-color').fill('#ff0000');
      await expect(pickerFor(c, '--primary-color')).toHaveValue('#ff0000');

      await c.locator('[data-el="actions"] slice-button').filter({ hasText: 'Reset' }).click();
      await expect(pickerFor(c, '--primary-color')).toHaveValue('#9333ea');
   });

   test('a11y: every picker has a <label for> pointing at its own control', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const wiring = await c.locator('slice-color-picker').evaluateAll((pickers) =>
         pickers.map((picker) => {
            const input = picker.querySelector('.slice_color_picker__input');
            const label = picker.querySelector('.slice_color_picker__label');
            return {
               id: input?.id,
               for: label?.htmlFor,
               labelText: label?.textContent,
               hint: picker.querySelector('.slice_color_picker__hint')?.textContent,
            };
         })
      );

      expect(wiring).toHaveLength(REQUIRED_TOKENS.length);
      const ids = new Set();
      for (const entry of wiring) {
         expect(entry.id).toBeTruthy();
         expect(entry.for).toBe(entry.id);
         expect(entry.labelText).toBeTruthy();
         expect(entry.hint).toMatch(/^--/);
         ids.add(entry.id);
      }
      // Fifteen controls, fifteen ids — a shared id silently points every label
      // at the first picker on the page.
      expect(ids.size).toBe(REQUIRED_TOKENS.length);
   });

   test('a11y: action buttons expose an accessible name', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      const labels = await c.locator('[data-el="actions"] slice-button .slice_button').evaluateAll((nodes) =>
         nodes.map((node) => node.getAttribute('aria-label'))
      );
      expect(labels).toEqual([
         'Reset to active theme',
         'Preview',
         'Randomize',
         'Apply to whole app',
         'Export theme',
      ]);
   });

   test('css is scoped: no bare class names leak out of the page markup', async ({ mount }) => {
      const c = await mount('ThemeCreator');
      // Only the page's OWN markup is checked. Anything inside a slice-* element
      // belongs to that component, not to ThemeCreator.
      const leaked = await c.component.evaluate((root) =>
         Array.from(root.querySelectorAll('*'))
            .filter((node) => {
               for (let el = node; el && el !== root; el = el.parentElement) {
                  if (el.tagName.toLowerCase().startsWith('slice-')) return false;
               }
               return true;
            })
            .flatMap((node) => Array.from(node.classList))
            .filter((name) => !name.startsWith('theme-creator'))
      );
      // The pre-migration page shipped bare `.btn`, `.modal` and `.close`
      // selectors that styled every button in the host app.
      expect(leaked).toEqual([]);
   });
});