import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// BottomNav item shape (§4): { text, path, icon? } (also supports type: 'dropdown').
// Each path item renders an <li.slice_bottomnav_tab> with a .slice_bottomnav_label and
// data-path; clicking it calls slice.router.navigate(path). The active tab is derived
// from window.location.pathname, so we keep paths that won't match the /__test route.
const ITEMS = [
   { text: 'Home', path: '/bn-home' },
   { text: 'Docs', path: '/bn-docs' },
   { text: 'About', path: '/bn-about' },
];

test.describe('BottomNav', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      // The host (slice-bottom-nav) is display:block but the default `fixed`
      // position takes the inner bar out of flow, leaving the host zero-height
      // (reported "hidden"). Assert visibility on the inner root with a
      // static position instead.
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      await expect(c.locator('.slice_bottomnav')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders one tab per item with label text and data-path', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS });
      const tabs = c.locator('.slice_bottomnav_tab');
      await expect(tabs).toHaveCount(3);
      await expect(c.locator('.slice_bottomnav_label').nth(0)).toHaveText('Home');
      await expect(tabs.nth(1)).toHaveAttribute('data-path', '/bn-docs');
   });

   test('item icon renders a slice Icon inside the tab', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: [{ text: 'Home', path: '/bn-home', icon: 'home' }],
      });
      await expect(c.locator('.slice_bottomnav_tab .slice_bottomnav_icon')).toHaveCount(1);
   });

   test('position="fixed" sets data-position=fixed on the inner root', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'fixed' });
      await expect(c.locator('.slice_bottomnav')).toHaveAttribute('data-position', 'fixed');
   });

   test('position other than fixed maps to data-position=static', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'relative' });
      await expect(c.locator('.slice_bottomnav')).toHaveAttribute('data-position', 'static');
   });

   test('direction="reverse" adds the reverse modifier class to the bar', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, direction: 'reverse' });
      await expect(c.locator('.slice_bottomnav_bar')).toHaveClass(/slice_bottomnav_reverse/);
   });

   test('logo prop renders an img and marks the logo container visible', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: ITEMS,
         logo: { src: '/logo.png', alt: 'Brand', path: '/bn-home' },
      });
      const logo = c.locator('.slice_bottomnav_logo');
      await expect(logo).toHaveClass(/is-visible/);
      await expect(logo.locator('img')).toHaveAttribute('alt', 'Brand');
   });

   test('buttons render a Button into the actions container', async ({ mount }) => {
      const c = await mount('BottomNav', {
         items: ITEMS,
         buttons: [{ value: 'Login' }],
      });
      await expect(c.locator('.slice_bottomnav_actions .slice_button')).toHaveCount(1);
      await expect(c.locator('.slice_bottomnav_actions .slice_button_value')).toHaveText('Login');
   });

   test('clicking a tab marks it active without throwing', async ({ mount }) => {
      // Clicking calls slice.router.navigate(path); the tab also gets is-active.
      const c = await mount('BottomNav', { items: ITEMS });
      await c.locator('.slice_bottomnav_tab[data-path="/bn-docs"]').click();
      await expect(c.locator('.slice_bottomnav_tab[data-path="/bn-docs"]')).toHaveClass(/is-active/);
      expect(c.pageErrors()).toEqual([]);
   });

   test('visual: bottom nav with items @visual', async ({ mount }) => {
      const c = await mount('BottomNav', { items: ITEMS, position: 'static' });
      await expect(c.component).toHaveScreenshot('bottomnav-items.png');
   });
});
