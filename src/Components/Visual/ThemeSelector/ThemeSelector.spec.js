import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ThemeSelector renders a `.theme-toggle` button with two options (.toggle-light /
// .toggle-dark). On init it reads slice's current theme and marks the matching
// option `.active`. Clicking the button calls slice.setTheme(next), flips
// currentTheme, re-syncs the active option, and dispatches a `themeChanged` event.
// The harness sets the theme to LIGHT before each mount, so initial state is LIGHT.

test.describe('ThemeSelector', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('ThemeSelector');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.theme-toggle')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('initial active option reflects the LIGHT theme', async ({ mount }) => {
      const c = await mount('ThemeSelector', {}, { theme: 'LIGHT' });
      await expect(c.locator('.toggle-light')).toHaveClass(/active/);
      await expect(c.locator('.toggle-dark')).not.toHaveClass(/active/);
   });

   test('initial active option reflects the DARK theme', async ({ mount }) => {
      const c = await mount('ThemeSelector', {}, { theme: 'DARK' });
      await expect(c.locator('.toggle-dark')).toHaveClass(/active/);
      await expect(c.locator('.toggle-light')).not.toHaveClass(/active/);
      // Restore the global theme so test order cannot leak DARK.
      await c.component.evaluate(() => window.slice.setTheme('LIGHT'));
   });

   test('clicking the toggle switches the active option to DARK and back', async ({ mount }) => {
      const c = await mount('ThemeSelector', {}, { theme: 'LIGHT' });

      await c.locator('.theme-toggle').click();
      await expect(c.locator('.toggle-dark')).toHaveClass(/active/);
      await expect(c.locator('.toggle-light')).not.toHaveClass(/active/);

      await c.locator('.theme-toggle').click();
      await expect(c.locator('.toggle-light')).toHaveClass(/active/);

      // Restore the global theme to LIGHT for isolation safety.
      await c.component.evaluate(() => window.slice.setTheme('LIGHT'));
   });

   test('toggle calls slice.setTheme with the next theme', async ({ mount }) => {
      const c = await mount('ThemeSelector', {}, { theme: 'LIGHT' });
      await c.locator('.theme-toggle').click();
      // toggle() awaits slice.setTheme('DARK') asynchronously; poll until the
      // runtime reflects the applied theme.
      await expect
         .poll(() =>
            c.component.evaluate(() => window.slice.stylesManager?.themeManager?.currentTheme)
         )
         .toBe('DARK');
      await c.component.evaluate(() => window.slice.setTheme('LIGHT'));
   });

   test('a11y: toggle is a button with an aria-label', async ({ mount }) => {
      const c = await mount('ThemeSelector');
      await expect(c.locator('.theme-toggle')).toHaveAttribute('type', 'button');
      await expect(c.locator('.theme-toggle')).toHaveAttribute('aria-label', 'Toggle theme');
   });

   test('visual: theme selector (light) @visual', async ({ mount }) => {
      const c = await mount('ThemeSelector', {}, { theme: 'LIGHT' });
      await expect(c.component).toHaveScreenshot('themeselector-light.png');
   });
});
