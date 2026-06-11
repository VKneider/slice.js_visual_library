import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ThemeSwitcher renders a single `.theme-switcher` button that cycles through the
// `themes` list on click. It shows the current theme name in `.theme-switcher__value`
// and a (hidden in the button variant) caption in `.theme-switcher__label`. Each switch
// calls slice.setTheme(next), dispatches a `themeChanged` event so sibling theme
// controls stay in sync, and invokes the optional `onChange(themeName)` handler.
// The harness sets the theme to LIGHT before each mount, so the initial value is LIGHT.

test.describe('ThemeSwitcher', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('ThemeSwitcher');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.theme-switcher')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('initial value reflects the current LIGHT theme', async ({ mount }) => {
      const c = await mount('ThemeSwitcher', {}, { theme: 'LIGHT' });
      await expect(c.locator('.theme-switcher__value')).toHaveText('LIGHT');
   });

   test('clicking cycles to the next theme and back', async ({ mount }) => {
      const c = await mount('ThemeSwitcher', {}, { theme: 'LIGHT' });

      await c.locator('.theme-switcher').click();
      await expect(c.locator('.theme-switcher__value')).toHaveText('DARK');

      await c.locator('.theme-switcher').click();
      await expect(c.locator('.theme-switcher__value')).toHaveText('LIGHT');
   });

   test('cycle calls slice.setTheme with the next theme', async ({ mount }) => {
      const c = await mount('ThemeSwitcher', {}, { theme: 'LIGHT' });
      await c.locator('.theme-switcher').click();
      // cycle() awaits slice.setTheme('DARK') asynchronously; poll until the runtime
      // reflects the applied theme.
      await expect
         .poll(() =>
            c.component.evaluate(() => window.slice.stylesManager?.themeManager?.currentTheme)
         )
         .toBe('DARK');
      // Restore the global theme to LIGHT for isolation safety.
      await c.component.evaluate(() => window.slice.setTheme('LIGHT'));
   });

   test('onChange handler fires with the new theme name', async ({ mount }) => {
      // Function props can't cross the page boundary, so register onChange as a spy.
      const c = await mount('ThemeSwitcher', {}, { theme: 'LIGHT', spies: ['onChange'] });
      await c.locator('.theme-switcher').click();
      await expect.poll(() => c.events('onChange')).toBe(1);
      expect(await c.eventArgs('onChange')).toEqual([['DARK']]);
      await c.component.evaluate(() => window.slice.setTheme('LIGHT'));
   });

   test('stays in sync when another control dispatches themeChanged', async ({ mount }) => {
      const c = await mount('ThemeSwitcher', {}, { theme: 'LIGHT' });
      await c.component.evaluate(() =>
         document.dispatchEvent(
            new CustomEvent('themeChanged', { detail: { themeName: 'DARK' } })
         )
      );
      await expect(c.locator('.theme-switcher__value')).toHaveText('DARK');
   });

   test('label prop sets the caption text', async ({ mount }) => {
      const c = await mount('ThemeSwitcher', { label: 'Appearance' }, { theme: 'LIGHT' });
      await expect(c.locator('.theme-switcher__label')).toHaveText('Appearance');
   });

   test('menu-item variant exposes the label as a full-width row', async ({ mount }) => {
      const c = await mount('ThemeSwitcher', { variant: 'menu-item' }, { theme: 'LIGHT' });
      await expect(c.component).toHaveClass(/theme-switcher--menu/);
      // The caption is visible in the menu-item variant (hidden in the button variant).
      await expect(c.locator('.theme-switcher__label')).toBeVisible();
   });

   test('a11y: control is a button with an aria-label', async ({ mount }) => {
      const c = await mount('ThemeSwitcher');
      await expect(c.locator('.theme-switcher')).toHaveAttribute('type', 'button');
      await expect(c.locator('.theme-switcher')).toHaveAttribute('aria-label', 'Switch theme');
   });

   test('visual: theme switcher button (light) @visual', async ({ mount }) => {
      const c = await mount('ThemeSwitcher', {}, { theme: 'LIGHT' });
      await expect(c.component).toHaveScreenshot('themeswitcher-button-light.png');
   });
});
