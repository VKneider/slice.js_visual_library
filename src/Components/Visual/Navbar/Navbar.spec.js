import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Navbar: brand + links (Link, external <a>, or DropDown for items with `items`)
// + actions (Button configs or Nodes), five variants, the current page marked,
// and a mobile menu (drawer / fullscreen / sheet) below `breakpoint`.
// Structure: header.slice_nav_header > a.logo_container + nav.slice_nav_bar
// (> .nav_bar_panel > .nav_bar_menu_wrap > ul.nav_bar_menu, .nav_bar_buttons)
// + button.mobile_menu_button.

const ITEMS = [
   { text: 'Home', path: '/nav-home' },
   { text: 'Docs', path: '/nav-docs' },
];

/** Build a Navbar inside the page (for props that carry Nodes or functions). */
async function build(page, props, setup = '') {
   await page.evaluate(async ({ props, setup }) => {
      window.__log = [];
      // eslint-disable-next-line no-new-func
      const extra = setup ? new Function('log', `return (${setup});`)((...a) => window.__log.push(a)) : {};
      const el = await slice.build('Navbar', { ...props, ...extra });
      el.id = 'nav';
      el.style.width = '100%';
      document.getElementById('host').appendChild(el);
   }, { props, setup });
   return page.locator('#nav');
}

test.describe('Navbar — compatibility', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_nav_header')).toBeVisible();
      await expect(c.component.getByRole('navigation', { name: 'Main' })).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('text items render Link children into the menu', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS });
      await expect(c.locator('.nav_bar_menu li slice-link')).toHaveCount(2);
      await expect(c.locator('.nav_bar_menu li slice-link a').nth(0)).toHaveText('Home');
      await expect(c.locator('.nav_bar_menu li slice-link a').nth(1)).toHaveAttribute('href', '/nav-docs');
   });

   test('buttons render a Button into the buttons container', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, buttons: [{ value: 'Sign in' }] });
      await expect(c.locator('.nav_bar_buttons .slice_button')).toHaveCount(1);
      await expect(c.locator('.nav_bar_buttons .slice_button_value')).toHaveText('Sign in');
   });

   test('position="fixed" adds nav_bar_fixed; spacer: true keeps its height in the page', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, position: 'fixed', spacer: true });
      await expect(c.component).toHaveClass(/nav_bar_fixed/);
      await expect(c.locator('.slice_nav_header')).toHaveCSS('position', 'fixed');
      const [host, bar] = await Promise.all([
         c.component.evaluate((el) => el.getBoundingClientRect().height),
         c.locator('.slice_nav_header').evaluate((el) => el.getBoundingClientRect().height),
      ]);
      expect(Math.abs(host - bar)).toBeLessThan(1);
   });

   test('position="static" does not add the fixed class; position is reactive', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, position: 'static' });
      await expect(c.component).not.toHaveClass(/nav_bar_fixed/);
      await c.component.evaluate((el) => { el.position = 'fixed'; });
      await expect(c.component).toHaveClass(/nav_bar_fixed/);
      await c.component.evaluate((el) => { el.position = 'sticky'; });
      await expect(c.component).not.toHaveClass(/nav_bar_fixed/);
      await expect(c.component).toHaveCSS('position', 'sticky');
   });

   test('direction="reverse" adds direction-row-reverse to the header, and removes it again', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, direction: 'reverse' });
      await expect(c.locator('.slice_nav_header')).toHaveClass(/direction-row-reverse/);
      await c.component.evaluate((el) => { el.direction = 'normal'; });
      await expect(c.locator('.slice_nav_header')).not.toHaveClass(/direction-row-reverse/);
   });

   test('logo prop renders one img, even when set twice', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, logo: { src: '/logo.png', path: '/nav-home' } });
      await expect(c.locator('.logo_container img')).toHaveCount(1);
      await expect(c.locator('.logo_container img')).toHaveAttribute('src', '/logo.png');
      await expect(c.locator('.logo_container')).toHaveAttribute('href', '/nav-home');
      await c.component.evaluate((el) => { el.logo = { src: '/other.png', path: '/x' }; });
      await expect(c.locator('.logo_container img')).toHaveCount(1);
      await expect(c.locator('.logo_container img')).toHaveAttribute('src', '/other.png');
   });

   test('logo click calls router.navigate with logo path', async ({ mount, page }) => {
      const c = await mount('Navbar', { items: ITEMS, logo: { src: '/logo.png', path: '/custom-path' } });
      await page.evaluate(() => {
         window.__navigateCalls = [];
         window.slice.router.navigate = (path) => { window.__navigateCalls.push(path); };
      });
      await c.locator('.logo_container').click();
      expect(await page.evaluate(() => window.__navigateCalls)).toEqual(['/custom-path']);
   });

   test('legacy dropdown items (type + options) still build a DropDown', async ({ mount }) => {
      const c = await mount('Navbar', { items: [{ text: 'More', type: 'dropdown', options: [{ text: 'A', href: '#a' }] }] });
      await expect(c.locator('.nav_bar_item--dropdown slice-dropdown')).toHaveCount(1);
      await c.locator('.slice_dropdown').click();
      await expect(c.component.getByRole('menuitem', { name: 'A' })).toHaveAttribute('href', '#a');
   });
});

test.describe('Navbar — content', () => {
   test('brand can be an image, a name, or both', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, brand: { logo: '/logo.png', text: 'Northwind', path: '/' } });
      await expect(c.locator('.logo_container img')).toHaveAttribute('alt', '');
      await expect(c.locator('.nav_bar_brand_text')).toHaveText('Northwind');
      await c.component.evaluate((el) => { el.brand = null; el.logo = null; });
      await expect(c.locator('.logo_container')).toBeHidden();
   });

   test('items are reactive; hidden items are skipped; href items are plain external links', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS });
      await c.component.evaluate((el) => {
         el.items = [
            { text: 'Blog', href: 'https://example.com/blog', target: '_blank' },
            { text: 'Secret', path: '/secret', hidden: true },
            { text: 'Shop', path: '/shop', icon: 'cart' },
         ];
      });
      await expect(c.locator('.nav_bar_item')).toHaveCount(2);
      const blog = c.component.getByRole('link', { name: 'Blog' });
      await expect(blog).toHaveAttribute('target', '_blank');
      await expect(blog).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(c.locator('.nav_bar_item slice-link .slice-link-icon')).toHaveCount(1);
   });

   test('buttons and actions keep the order they were given; actions take Nodes', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const nav = await build(page, { items: ITEMS, buttons: [{ value: 'One' }, { value: 'Two' }] }, `{
         actions: [(() => { const b = document.createElement('button'); b.className = 'my-action'; b.textContent = 'Three'; return b; })(), { value: 'Four' }],
      }`);
      await expect(nav.locator('.nav_bar_buttons > *')).toHaveCount(4);
      expect(await nav.locator('.nav_bar_buttons > *').allTextContents()).toEqual(['One', 'Two', 'Three', 'Four'].map((t) => expect.stringContaining(t)));
      await expect(nav.locator('.nav_bar_buttons > .my-action')).toHaveCount(1);
   });

   test('nodes an app appends to .nav_bar_buttons survive a buttons change', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS });
      await c.component.evaluate((el) => {
         const mine = document.createElement('span');
         mine.className = 'app-theme-selector';
         mine.textContent = 'Theme';
         el.querySelector('.nav_bar_buttons').appendChild(mine);
      });
      await expect(c.locator('.app-theme-selector')).toBeVisible();
      await c.component.evaluate((el) => { el.buttons = [{ value: 'Sign in' }]; });
      await expect(c.locator('.nav_bar_buttons .slice_button')).toHaveCount(1);
      await c.component.evaluate((el) => { el.buttons = [{ value: 'Log in' }, { value: 'Join' }]; });
      await expect(c.locator('.nav_bar_buttons .slice_button_value')).toHaveText(['Log in', 'Join']);
      expect(await c.locator('.nav_bar_buttons > *').last().getAttribute('class')).toBe('app-theme-selector');
   });

   test('variant, size, align and indicator are reflected and validated', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, variant: 'glass', size: 'lg', align: 'end', indicator: 'pill' });
      await expect(c.component).toHaveAttribute('data-variant', 'glass');
      await expect(c.component).toHaveAttribute('data-size', 'lg');
      await expect(c.component).toHaveAttribute('data-align', 'end');
      await expect(c.component).toHaveAttribute('data-indicator', 'pill');
      const lg = await c.locator('.slice_nav_header').evaluate((el) => el.getBoundingClientRect().height);
      await c.component.evaluate((el) => { el.size = 'sm'; el.variant = 'nope'; });
      const sm = await c.locator('.slice_nav_header').evaluate((el) => el.getBoundingClientRect().height);
      expect(lg).toBeGreaterThan(sm);
      await expect(c.component).toHaveAttribute('data-variant', 'solid');
   });
});

test.describe('Navbar — current page', () => {
   const ROUTED = [
      { text: 'Home', path: '/' },
      { text: 'Docs', path: '/docs' },
      { text: 'Docs API', path: '/docs/api', exact: true },
      { text: 'Products', items: [{ label: 'Table', path: '/products/table' }, { label: 'More', items: [{ label: 'Deep', path: '/products/deep' }] }] },
   ];
   const current = (c) => c.component.evaluate((el) => [...el.querySelectorAll('.nav_bar_item.is-active')].map((li) => li.textContent.trim()));

   test('exact match, longest prefix, exact-only items and dropdown children', async ({ mount }) => {
      const c = await mount('Navbar', { items: ROUTED });
      await c.component.evaluate((el) => el.setActivePath('/docs'));
      expect(await current(c)).toEqual(['Docs']);
      await expect(c.component.getByRole('link', { name: 'Docs', exact: true })).toHaveAttribute('aria-current', 'page');
      await c.component.evaluate((el) => el.setActivePath('/docs/guides/intro'));
      expect(await current(c)).toEqual(['Docs']);
      // `exact` keeps /docs/api from claiming /docs/api/v2, so /docs takes it.
      await c.component.evaluate((el) => el.setActivePath('/docs/api/v2'));
      expect(await current(c)).toEqual(['Docs']);
      await c.component.evaluate((el) => el.setActivePath('/docs/api'));
      expect(await current(c)).toEqual(['Docs API']);
      // '/' only matches itself, never as a prefix.
      await c.component.evaluate((el) => el.setActivePath('/elsewhere'));
      expect(await current(c)).toEqual([]);
      await c.component.evaluate((el) => el.setActivePath('/products/deep'));
      expect(await current(c)).toEqual(['Products']);
      await expect(c.locator('.nav_bar_item--dropdown .slice_dropdown')).toHaveAttribute('aria-current', 'page');
   });

   test('follows the URL through router:change and popstate', async ({ mount, page }) => {
      const c = await mount('Navbar', { items: ROUTED });
      const original = await page.evaluate(() => location.pathname);
      await page.evaluate(() => {
         history.pushState({}, '', '/docs/x');
         window.dispatchEvent(new CustomEvent('router:change', { detail: {} }));
      });
      expect(await current(c)).toEqual(['Docs']);
      await page.evaluate(() => {
         history.pushState({}, '', '/products/table');
         window.dispatchEvent(new PopStateEvent('popstate'));
      });
      expect(await current(c)).toEqual(['Products']);
      await page.evaluate((path) => history.replaceState({}, '', path), original);
   });

   test('the indicator slides under the current item', async ({ mount, page }) => {
      await page.setViewportSize({ width: 1200, height: 600 });
      const c = await mount('Navbar', { items: ROUTED, variant: 'surface' });
      const geometry = async () => page.waitForFunction(() => {
         const el = document.querySelector('slice-nav-bar');
         const ind = el.querySelector('.nav_bar_indicator');
         const item = el.querySelector('.nav_bar_item.is-active .item');
         if (!ind.classList.contains('is-visible') || !item) return null;
         const a = ind.getBoundingClientRect();
         const b = item.getBoundingClientRect();
         return Math.abs(a.left - b.left) < 1.5 && Math.abs(a.width - b.width) < 1.5 && a.top >= b.bottom ? true : null;
      }).then((handle) => handle.jsonValue());
      await c.component.evaluate((el) => el.setActivePath('/docs'));
      expect(await geometry()).toBe(true);
      await c.component.evaluate((el) => el.setActivePath('/products/table'));
      expect(await geometry()).toBe(true);
      await c.component.evaluate((el) => { el.indicator = 'none'; });
      await expect(c.locator('.nav_bar_indicator')).toBeHidden();
   });
});

test.describe('Navbar — mobile menu', () => {
   test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 720 });
   });

   test('below the breakpoint the links move behind a real hamburger button', async ({ mount, page }) => {
      const c = await mount('Navbar', { items: ITEMS, buttons: [{ value: 'Sign in' }] }, { spies: ['onMenuToggle'] });
      const toggle = c.locator('.mobile_menu_button');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(await toggle.getAttribute('aria-controls')).toBe(await c.locator('.slice_nav_bar').getAttribute('id'));
      await expect(c.component.getByRole('link', { name: 'Home' })).toBeHidden();

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(c.component.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(c.component.getByRole('link', { name: 'Home' })).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');

      await page.keyboard.press('Escape');
      await expect(c.component.getByRole('link', { name: 'Home' })).toBeHidden();
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
      expect(await c.eventArgs('onMenuToggle')).toEqual([[true], [false]]);
   });

   test('focus stays inside the open menu', async ({ mount, page }) => {
      const c = await mount('Navbar', { items: ITEMS, buttons: [{ value: 'Sign in' }] });
      await c.locator('.mobile_menu_button').click();
      const close = c.locator('.mobile_close_menu');
      const signIn = c.locator('.nav_bar_buttons .slice_button');
      await signIn.focus();
      await page.keyboard.press('Tab');
      await expect(close).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(signIn).toBeFocused();
   });

   test('the close button, the dimmed area and following a link all close it', async ({ mount, page }) => {
      const c = await mount('Navbar', { items: ITEMS });
      const toggle = c.locator('.mobile_menu_button');
      const open = () => expect(c.component).toHaveClass(/nav_bar--open/);
      const closed = () => expect(c.component).not.toHaveClass(/nav_bar--open/);
      await toggle.click();
      await open();
      await c.locator('.mobile_close_menu').click();
      await closed();
      await toggle.click();
      await page.mouse.click(10, 600); // the dimmed area left of the drawer
      await closed();
      await page.evaluate(() => { window.slice.router.navigate = () => {}; });
      await toggle.click();
      await c.component.getByRole('link', { name: 'Docs' }).click();
      await closed();
   });

   for (const mode of ['drawer', 'sheet', 'fullscreen']) {
      test(`mobileMenu: '${mode}' places the panel`, async ({ mountHtml, page }) => {
         await page.emulateMedia({ reducedMotion: 'reduce' });
         await mountHtml('<div id="host"></div>');
         const nav = await build(page, { items: ITEMS, mobileMenu: mode, variant: 'surface' });
         await nav.locator('.mobile_menu_button').click();
         await expect(nav.locator('.slice_nav_bar')).toHaveClass(/is-open/);
         const [panel, header] = await Promise.all([
            nav.locator('.nav_bar_panel').boundingBox(),
            nav.locator('.slice_nav_header').boundingBox(),
         ]);
         if (mode === 'drawer') {
            // From the side, full height, not full width.
            expect(Math.round(panel.x + panel.width)).toBe(390);
            expect(panel.width).toBeLessThan(390);
            expect(Math.round(panel.height)).toBe(720);
         } else if (mode === 'sheet') {
            // Right under the bar, full width; the bar stays in view.
            expect(Math.abs(panel.y - (header.y + header.height))).toBeLessThan(1);
            expect(Math.round(panel.width)).toBe(390);
            await expect(nav.locator('.mobile_menu_button')).toBeVisible();
         } else {
            expect([panel.x, panel.y, Math.round(panel.width), Math.round(panel.height)]).toEqual([0, 0, 390, 720]);
         }
      });
   }

   test('growing past the breakpoint closes the menu and restores the bar', async ({ mount, page }) => {
      const c = await mount('Navbar', { items: ITEMS });
      await c.locator('.mobile_menu_button').click();
      await expect(c.component).toHaveClass(/nav_bar--open/);
      await page.setViewportSize({ width: 1100, height: 720 });
      await expect(c.component).not.toHaveClass(/nav_bar--open/);
      await expect(c.locator('.mobile_menu_button')).toBeHidden();
      await expect(c.component.getByRole('link', { name: 'Home' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
   });

   test('breakpoint is configurable', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, breakpoint: 300 });
      await expect(c.locator('.mobile_menu_button')).toBeHidden();
      await c.component.evaluate((el) => { el.breakpoint = 500; });
      await expect(c.locator('.mobile_menu_button')).toBeVisible();
   });

   test('destroying it while open gives the page its scroll back', async ({ mount, page }) => {
      const c = await mount('Navbar', { items: ITEMS });
      await c.locator('.mobile_menu_button').click();
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
      expect(c.pageErrors()).toEqual([]);
   });
});

test.describe('Navbar — scrolling', () => {
   test('hideOnScroll hides going down and shows going up; any variant marks itself scrolled', async ({ mountHtml, page }) => {
      await page.setViewportSize({ width: 1000, height: 600 });
      await mountHtml('<div id="host"></div><div style="height:3000px"></div>');
      const nav = await build(page, { items: ITEMS, position: 'sticky', hideOnScroll: true, variant: 'transparent' });
      await page.evaluate(() => window.scrollTo(0, 400));
      await expect(nav).toHaveClass(/nav_bar--hidden/);
      await expect(nav).toHaveClass(/nav_bar--scrolled/);
      await page.evaluate(() => window.scrollTo(0, 300));
      await expect(nav).not.toHaveClass(/nav_bar--hidden/);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(nav).not.toHaveClass(/nav_bar--scrolled/);
   });

   test('a fixed bar takes no room by default (pages built for the old bar already leave it)', async ({ mount }) => {
      const c = await mount('Navbar', { items: ITEMS, position: 'fixed' });
      expect(await c.component.evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
      await c.component.evaluate((el) => { el.spacer = true; });
      expect(await c.component.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(40);
   });
});