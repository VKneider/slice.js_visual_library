import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Navbar item shape (§4): { text, path, type? } — text items build a Link into
// `.nav_bar_menu`; dropdown items build a DropDown. Buttons build a Button into
// `.nav_bar_buttons`. position='fixed' adds `nav_bar_fixed` to the host;
// direction='reverse' adds `direction-row-reverse` to the header.
const ITEMS = [
   { text: 'Home', path: '/nav-home' },
   { text: 'Docs', path: '/nav-docs' },
];

test.describe('Navbar', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_nav_header')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('text items render Link children into the menu', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS });
      const links = c.locator('.nav_bar_menu li slice-link');
      await expect(links).toHaveCount(2);
      await expect(c.locator('.nav_bar_menu li slice-link a').nth(0)).toHaveText('Home');
      await expect(c.locator('.nav_bar_menu li slice-link a').nth(1)).toHaveAttribute(
         'href',
         '/nav-docs'
      );
   });

   test('buttons render a Button into the buttons container', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, buttons: [{ value: 'Sign in' }] });
      await expect(c.locator('.nav_bar_buttons .slice_button')).toHaveCount(1);
      await expect(c.locator('.nav_bar_buttons .slice_button_value')).toHaveText('Sign in');
   });

   test('position="fixed" adds nav_bar_fixed to the host', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, position: 'fixed' });
      await expect(c.component).toHaveClass(/nav_bar_fixed/);
   });

   test('position="static" does not add the fixed class', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, position: 'static' });
      await expect(c.component).not.toHaveClass(/nav_bar_fixed/);
   });

   test('direction="reverse" adds direction-row-reverse to the header', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, direction: 'reverse' });
      await expect(c.locator('.slice_nav_header')).toHaveClass(/direction-row-reverse/);
   });

   test('logo prop renders an img into the logo container', async ({ mount }) => {
      const c = await mount('Navbar', {
         items: ITEMS,
         logo: { src: '/logo.png', path: '/nav-home' },
      });
      await expect(c.locator('.logo_container img')).toHaveCount(1);
      await expect(c.locator('.logo_container img')).toHaveAttribute('src', '/logo.png');
   });

   test('logo click calls router.navigate with logo path', async ({ mount, page }) => {
      const c = await mount('Navbar', {
         items: ITEMS,
         logo: { src: '/logo.png', path: '/custom-path' },
      });

      // Spy on router.navigate
      await page.evaluate(() => {
         window.__navigateCalls = [];
         window.slice.router.navigate = (path) => {
            window.__navigateCalls.push(path);
         };
      });

      await c.locator('.logo_container').click();

      const calls = await page.evaluate(() => window.__navigateCalls);
      expect(calls).toEqual(['/custom-path']);
   });

   test('logo keeps href attribute for accessibility and right-click', async ({ mount }) => {
      const c = await mount('Navbar', {
         items: ITEMS,
         logo: { src: '/logo.png', path: '/nav-home' },
      });
      await expect(c.locator('.logo_container')).toHaveAttribute('href', '/nav-home');
   });

   test('visual: navbar with items and button @visual', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, buttons: [{ value: 'Sign in' }] });
      await expect(c.component).toHaveScreenshot('navbar-items.png');
   });
});
