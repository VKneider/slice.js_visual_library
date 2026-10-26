import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const ITEMS = [
   { label: 'Home', path: '/home', icon: 'home' },
   {
      label: 'Products', icon: 'shopping-bag', id: 'products',
      items: [
         { label: 'Phones', path: '/products/phones' },
         { label: 'Laptops', id: 'laptops', items: [{ label: 'Gaming', path: '/products/laptops/gaming' }, { label: 'Office', path: '/products/laptops/office' }] },
         { label: 'Deals', path: '/products/deals', badge: 12 },
      ],
   },
   {
      label: 'Settings', id: 'settings', path: '/settings',
      items: [{ label: 'Profile', path: '/settings/profile' }, { label: 'Billing', path: '/settings/billing' }],
   },
   { type: 'separator' },
   { label: 'Help', href: 'https://example.com/help', target: '_blank' },
];

const level = (c) => c.locator('.slice-side-menu__level:not(.is-leaving) > .slice-side-menu__item > .slice-side-menu__row');
const row = (c, key) => c.locator(`.slice-side-menu__level:not(.is-leaving) .slice-side-menu__row[data-key="${key}"]`);
const back = (c) => c.locator('.slice-side-menu__back');

// No sliding in tests: levels swap at once.
test.beforeEach(async ({ page }) => {
   await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('SideMenu — drill', () => {
   test('smoke: a labelled nav with links, actions and openers', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, title: 'Store', followRoute: false });
      expect(c.pageErrors()).toEqual([]);
      await expect(c.component).toHaveClass(/slice-side-menu/);
      await expect(c.locator('nav')).toHaveAttribute('aria-label', 'Store');
      await expect(c.locator('.slice-side-menu__title')).toHaveText('Store');
      await expect(level(c)).toHaveText(['Home', 'Products', 'Settings', 'Help']);
      await expect(row(c, '/home')).toHaveAttribute('href', '/home');
      await expect(row(c, 'products')).toHaveAttribute('data-opens', 'true');
      await expect(c.locator('.slice-side-menu__row[href^="https"]')).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(c.locator('.slice-side-menu__separator')).toHaveCount(1);
      await expect(c.locator('.slice-side-menu__row[data-key="/home"] slice-icon')).toHaveCount(1);
   });

   test('a submenu replaces the level, and Back returns to the item that opened it', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false }, { spies: ['onOpenChange'] });
      await row(c, 'products').click();
      await expect(back(c)).toHaveText('Products');
      await expect(back(c)).toHaveAttribute('aria-label', 'Back to Menu');
      await expect(level(c)).toHaveText(['Phones', 'Laptops', 'Deals12']);
      await expect(c.locator('.slice-side-menu__live')).toHaveText('Products, 3 items');
      await expect(row(c, '/products/phones')).toBeFocused();
      expect(await c.component.evaluate((el) => el.level)).toBe(1);

      await row(c, 'laptops').click();
      await expect(back(c)).toHaveText('Laptops');
      await expect(back(c)).toHaveAttribute('aria-label', 'Back to Products');
      await back(c).click();
      await expect(back(c)).toHaveText('Products');
      await expect(row(c, 'laptops')).toBeFocused();
      await back(c).click();
      await expect(back(c)).toBeHidden();
      await expect(row(c, 'products')).toBeFocused();
      expect((await c.eventArgs('onOpenChange')).map(([item, open]) => `${item.label}:${open}`))
         .toEqual(['Products:true', 'Laptops:true', 'Laptops:false', 'Products:false']);
   });

   test('a submenu with a path starts with an "All …" link', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false });
      await row(c, 'settings').click();
      await expect(level(c)).toHaveText(['All Settings', 'Profile', 'Billing']);
      await expect(level(c).first()).toHaveAttribute('href', '/settings');
   });

   test('a link navigates with slice.router; Ctrl-click is left to the browser', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false }, { spies: ['onSelect'] });
      await c.component.evaluate((el) => {
         el._navigated = [];
         el._realNavigate = slice.router.navigate;
         slice.router.navigate = (path) => { el._navigated.push(path); };
      });
      await row(c, '/home').click();
      expect(await c.component.evaluate((el) => el._navigated)).toEqual(['/home']);
      await expect(row(c, '/home')).toHaveAttribute('aria-current', 'page');
      expect((await c.eventArgs('onSelect'))[0][0].label).toBe('Home');
      await c.component.evaluate((el) => { slice.router.navigate = el._realNavigate; });
   });

   test('onSelect returning false stops the navigation', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false });
      await c.component.evaluate((el) => {
         el._navigated = [];
         el._realNavigate = slice.router.navigate;
         slice.router.navigate = (path) => { el._navigated.push(path); };
         el.onSelect = () => false;
      });
      await row(c, '/home').click();
      expect(await c.component.evaluate((el) => el._navigated)).toEqual([]);
      await expect(row(c, '/home')).not.toHaveAttribute('aria-current', 'page');
      await c.component.evaluate((el) => { slice.router.navigate = el._realNavigate; });
   });

   test('an action calls its onClick with the item and the menu', async ({ mount }) => {
      const c = await mount('SideMenu', { followRoute: false });
      await c.component.evaluate((el) => {
         el._calls = [];
         el.items = [{ label: 'Log out', icon: 'arrow-right-to-bracket', danger: true, onClick: ({ item, menu }) => el._calls.push([item.label, menu === el]) }];
      });
      const action = c.locator('.slice-side-menu__row');
      await expect(action).toHaveClass(/is-danger/);
      await expect(action).toHaveJSProperty('tagName', 'BUTTON');
      await action.click();
      expect(await c.component.evaluate((el) => el._calls)).toEqual([['Log out', true]]);
   });

   test('a lazy submenu loads when it opens, and can be retried after an error', async ({ mount }) => {
      const c = await mount('SideMenu', { followRoute: false });
      await c.component.evaluate((el) => {
         el._attempts = 0;
         el._release = null;
         el.items = [{
            label: 'Teams', id: 'teams',
            items: () => new Promise((resolve, reject) => {
               el._attempts += 1;
               el._release = () => (el._attempts === 1 ? reject(new Error('offline')) : resolve([{ label: 'Design', path: '/t/design' }, { label: 'Sales', path: '/t/sales' }]));
            }),
         }];
      });
      await row(c, 'teams').click();
      await expect(c.locator('.slice-side-menu__status.is-loading')).toHaveText('Loading…');
      await c.component.evaluate((el) => el._release());
      await expect(c.locator('.slice-side-menu__status.is-error')).toContainText('Could not load this menu.');
      await c.locator('.slice-side-menu__retry').click();
      await c.component.evaluate((el) => el._release());
      await expect(level(c)).toHaveText(['Design', 'Sales']);
      expect(await c.component.evaluate((el) => el._attempts)).toBe(2);
   });

   test('activePath opens its level and marks it', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, activePath: '/products/laptops/office', followRoute: false });
      await expect(back(c)).toHaveText('Laptops');
      await expect(row(c, '/products/laptops/office')).toHaveAttribute('aria-current', 'page');
      await back(c).click();
      await expect(row(c, 'laptops')).toHaveClass(/has-current/);
   });

   test('keyboard: arrows move, Right opens, Left goes back', async ({ mount, page }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false });
      await row(c, '/home').focus();
      await page.keyboard.press('ArrowDown');
      await expect(row(c, 'products')).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(row(c, '/products/phones')).toBeFocused();
      await page.keyboard.press('End');
      await expect(row(c, '/products/deals')).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(row(c, 'products')).toBeFocused();
      expect(await c.component.evaluate((el) => el.level)).toBe(0);
   });

   test('open(), back() and reset() from code', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false });
      await c.component.evaluate((el) => el.open('laptops'));
      await expect(back(c)).toHaveText('Laptops');
      expect(await c.component.evaluate((el) => el.openItems.map((i) => i.label))).toEqual(['Products', 'Laptops']);
      await c.component.evaluate((el) => el.back());
      await expect(back(c)).toHaveText('Products');
      await c.component.evaluate((el) => el.reset());
      await expect(back(c)).toBeHidden();
   });
});

test.describe('SideMenu — tree', () => {
   test('a submenu opens under its item, indented', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, mode: 'tree', followRoute: false });
      await expect(c.component).toHaveAttribute('data-mode', 'tree');
      const products = c.locator('.slice-side-menu__row[data-key="products"]');
      await expect(products).toHaveAttribute('aria-expanded', 'false');
      await products.click();
      await expect(products).toHaveAttribute('aria-expanded', 'true');
      const phones = c.locator('.slice-side-menu__row[data-key="/products/phones"]');
      await expect(phones).toBeVisible();
      const [outer, inner] = await Promise.all([products.boundingBox(), phones.locator('.slice-side-menu__label').boundingBox()]);
      const outerLabel = await products.locator('.slice-side-menu__label').boundingBox();
      expect(inner.x).toBeGreaterThan(outer.x + 10);
      expect(outerLabel).not.toBeNull();
      await products.click();
      await expect(phones).toHaveCount(0);
   });

   test('a submenu with a path: the label is a link, the chevron opens it', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, mode: 'tree', followRoute: false });
      const link = c.locator('.slice-side-menu__row[data-key="settings"]');
      await expect(link).toHaveAttribute('href', '/settings');
      const toggle = c.locator('[data-toggle="settings"]');
      await expect(toggle).toHaveAttribute('aria-label', 'Open Settings');
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(c.locator('.slice-side-menu__row[data-key="/settings/billing"]')).toBeVisible();
   });

   test('multiple: false keeps one submenu open per level', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, mode: 'tree', multiple: false, followRoute: false });
      await c.locator('.slice-side-menu__row[data-key="products"]').click();
      await c.locator('[data-toggle="settings"]').click();
      await expect(c.locator('.slice-side-menu__row[data-key="products"]')).toHaveAttribute('aria-expanded', 'false');
      await expect(c.locator('[data-toggle="settings"]')).toHaveAttribute('aria-expanded', 'true');
   });

   test('activePath opens every branch above it', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, mode: 'tree', activePath: '/products/laptops/gaming', followRoute: false });
      await expect(c.locator('.slice-side-menu__row[data-key="products"]')).toHaveAttribute('aria-expanded', 'true');
      await expect(c.locator('.slice-side-menu__row[data-key="laptops"]')).toHaveAttribute('aria-expanded', 'true');
      await expect(c.locator('[aria-current="page"]')).toHaveText('Gaming');
      await expect(c.locator('.slice-side-menu__row[data-key="products"]')).toHaveClass(/has-current/);
   });

   test('keyboard: Right opens then enters, Left closes then goes up', async ({ mount, page }) => {
      const c = await mount('SideMenu', { items: ITEMS, mode: 'tree', followRoute: false });
      const products = c.locator('.slice-side-menu__row[data-key="products"]');
      await products.focus();
      await page.keyboard.press('ArrowRight');
      await expect(products).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('ArrowRight');
      await expect(c.locator('.slice-side-menu__row[data-key="/products/phones"]')).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(products).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(products).toHaveAttribute('aria-expanded', 'false');
   });

   test("mode 'auto': a tree when wide, a drill when narrow, in the same place", async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, mode: 'auto', breakpoint: 420, followRoute: false });
      await c.component.evaluate((el) => { el.style.width = '600px'; });
      await expect(c.component).toHaveAttribute('data-mode', 'tree');
      await c.component.evaluate((el) => el.open('laptops'));
      await c.component.evaluate((el) => { el.style.width = '300px'; });
      await expect(c.component).toHaveAttribute('data-mode', 'drill');
      await expect(back(c)).toHaveText('Laptops');
      expect(await c.component.evaluate((el) => el.mode)).toBe('auto');
      await c.component.evaluate((el) => { el.style.width = '600px'; });
      await expect(c.locator('.slice-side-menu__row[data-key="/products/laptops/office"]')).toBeVisible();
   });

   test('switching mode keeps the place', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false });
      await c.component.evaluate((el) => el.open('laptops'));
      await c.component.evaluate((el) => { el.mode = 'tree'; });
      await expect(c.locator('.slice-side-menu__row[data-key="laptops"]')).toHaveAttribute('aria-expanded', 'true');
      await expect(c.locator('.slice-side-menu__row[data-key="/products/laptops/gaming"]')).toBeVisible();
      await c.component.evaluate((el) => { el.mode = 'drill'; });
      await expect(back(c)).toHaveText('Laptops');
   });
});

test.describe('SideMenu — items and lifecycle', () => {
   test('groups, disabled and hidden items', async ({ mount }) => {
      const c = await mount('SideMenu', {
         followRoute: false,
         items: [
            { type: 'group', label: 'Workspace', items: [{ label: 'Inbox', path: '/inbox' }, { label: 'Archive', path: '/archive', disabled: true }] },
            { type: 'group', label: 'Account', items: [{ label: 'Secret', path: '/secret', hidden: true }, { label: 'Profile', path: '/profile', description: 'Name and photo' }] },
         ],
      });
      await expect(c.locator('.slice-side-menu__group-label')).toHaveText(['Workspace', 'Account']);
      await expect(c.locator('.slice-side-menu__group ul').first()).toHaveAttribute('aria-labelledby', /.+/);
      await expect(c.locator('.slice-side-menu__row[data-key="/archive"]')).toHaveAttribute('aria-disabled', 'true');
      await expect(c.locator('.slice-side-menu__row[data-key="/archive"]')).not.toHaveAttribute('href');
      await expect(c.locator('.slice-side-menu__row[data-key="/secret"]')).toHaveCount(0);
      await expect(c.locator('.slice-side-menu__description')).toHaveText('Name and photo');
   });

   test('new items keep the open level when it still exists', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false });
      await c.component.evaluate((el) => el.open('products'));
      await c.component.evaluate((el) => {
         el.items = el.items.map((item) => (item.id === 'products' ? { ...item, items: [...item.items, { label: 'Tablets', path: '/products/tablets' }] } : item));
      });
      await expect(back(c)).toHaveText('Products');
      await expect(level(c).last()).toHaveText('Tablets');
   });

   test('texts translate every word', async ({ mount }) => {
      const c = await mount('SideMenu', {
         items: ITEMS, followRoute: false,
         texts: { label: 'Menú', back: 'Volver a {label}', overview: 'Todo en {label}', level: '{label}, {count} opciones' },
      });
      await expect(c.locator('nav')).toHaveAttribute('aria-label', 'Menú');
      await row(c, 'settings').click();
      await expect(back(c)).toHaveAttribute('aria-label', 'Volver a Menú');
      await expect(level(c).first()).toHaveText('Todo en Settings');
      await expect(c.locator('.slice-side-menu__live')).toHaveText('Settings, 2 opciones');
   });

   test('size and variant', async ({ mount }) => {
      const c = await mount('SideMenu', { items: ITEMS, size: 'lg', variant: 'filled', activePath: '/home', followRoute: false });
      await expect(c.component).toHaveAttribute('data-size', 'lg');
      await expect(c.component).toHaveAttribute('data-variant', 'filled');
      const height = await row(c, '/home').evaluate((el) => el.getBoundingClientRect().height);
      expect(height).toBeGreaterThanOrEqual(48);
   });

   test('built first and added to the page later, it still gets its icons and badges', async ({ mount }) => {
      const c = await mount('SideMenu', { followRoute: false });
      const counts = await c.component.evaluate(async (host) => {
         const menu = await slice.build('SideMenu', { followRoute: false, items: [{ label: 'Inbox', path: '/inbox', icon: 'inbox', badge: 3 }] });
         await new Promise((r) => setTimeout(r, 300));
         host.after(menu);
         const result = [menu.querySelectorAll('slice-icon').length, menu.querySelectorAll('slice-badge').length];
         slice.controller.destroyComponent(menu);
         menu.remove();
         return result;
      });
      expect(counts).toEqual([1, 1]);
   });

   test('destroying it destroys its icons and badges, including levels left behind', async ({ mount, page }) => {
      const c = await mount('SideMenu', { items: ITEMS, followRoute: false });
      await row(c, 'products').click();
      await expect(c.locator('.slice-side-menu__badge slice-badge')).toHaveCount(1);
      await back(c).click();
      await expect(c.locator('.slice-side-menu__row[data-key="/home"] slice-icon')).toHaveCount(1);
      const ids = await c.component.evaluate((el) => [...el.querySelectorAll('[slice-id]')].map((n) => n.getAttribute('slice-id')));
      expect(ids.length).toBeGreaterThan(2);
      // Nothing built for the level that was left is still alive.
      const orphans = await page.evaluate(() => [...slice.controller.activeComponents.values()]
         .filter((comp) => (comp.tagName === 'SLICE-ICON' || comp.tagName === 'SLICE-BADGE') && !comp.isConnected).length);
      expect(orphans).toBe(0);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      expect(await page.evaluate((all) => all.filter((id) => !!slice.controller.getComponent(id)), ids)).toEqual([]);
   });
});