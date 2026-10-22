import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// DropDown: a menu button with links, actions, toggles and nested submenus.
//   - trigger: <button.slice_dropdown aria-haspopup="menu">; root menu: .slice_dropbox
//     (role="menu", a manual popover); submenus: .slice_dropbox--sub, appended on open.
//   - items: .slice_dropdown_item with role menuitem / menuitemcheckbox / menuitemradio.
// Items carrying functions are built inside the page (`mount` serialises props
// across the boundary, and a function cannot survive that).

const OPTIONS = [
   { text: 'Home', href: '#home' },
   { text: 'Profile', href: '#profile' },
   { label: 'Settings', href: '#settings' },
];

const NESTED = [
   { label: 'New file' },
   {
      label: 'Share', items: [
         { label: 'Email' },
         {
            label: 'Social', items: [
               { label: 'Mastodon' },
               { label: 'More', items: [{ label: 'Deep one' }, { label: 'Deep two' }] },
            ]
         },
      ]
   },
   { label: 'Rename' },
];

/** Build a DropDown inside the page (so items may carry functions). */
async function build(page, props, setup = '') {
   await page.evaluate(async ({ props, setup }) => {
      window.__log = [];
      // eslint-disable-next-line no-new-func
      const extra = setup ? new Function('log', `return (${setup});`)((...a) => window.__log.push(a)) : {};
      const el = await slice.build('DropDown', { ...props, ...extra });
      el.id = 'dd';
      document.getElementById('host').appendChild(el);
   }, { props, setup });
   return page.locator('#dd');
}

const menu = (dd, level = 0) => (level === 0 ? dd.locator('.slice_dropbox').first() : dd.locator(`.slice_dropbox[data-level="${level}"]`));

test.describe('DropDown — basics and compatibility', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_dropdown')).toBeVisible();
      await expect(c.locator('.slice_dropbox')).toBeHidden();
      expect(c.pageErrors()).toEqual([]);
   });

   test('the trigger is a real button wired to its menu', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Account', options: OPTIONS });
      const trigger = c.locator('.slice_dropdown');
      await expect(trigger).toHaveText('Account');
      expect(await trigger.evaluate((el) => el.tagName)).toBe('BUTTON');
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      const controls = await trigger.getAttribute('aria-controls');
      expect(await c.locator('.slice_dropbox').getAttribute('id')).toBe(controls);
   });

   test('legacy options ({ text | label, href | path }) render as links', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', options: OPTIONS });
      await c.locator('.slice_dropdown').click();
      const items = c.component.getByRole('menuitem');
      await expect(items).toHaveText(['Home', 'Profile', 'Settings']);
      expect(await items.first().evaluate((el) => [el.tagName, el.getAttribute('href')])).toEqual(['A', '#home']);
   });

   test('a legacy callback runs, closes the menu and never navigates, even with a path', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const dd = await build(page, { label: 'Actions' }, `{ options: [{ text: 'Both', path: '/should-not-happen', callback: () => log('ran') }] }`);
      const before = await page.evaluate(() => location.pathname + location.hash);
      await dd.locator('.slice_dropdown').click();
      await dd.getByRole('menuitem', { name: 'Both' }).click();
      await expect(menu(dd)).toBeHidden();
      expect(await page.evaluate(() => window.__log)).toEqual([['ran']]);
      expect(await page.evaluate(() => location.pathname + location.hash)).toBe(before);
   });

   test('clicking the trigger toggles; a click outside closes', async ({ mount, page }) => {
      const c = await mount('DropDown', { label: 'Menu', items: NESTED }, { spies: ['onOpenChange'] });
      const trigger = c.locator('.slice_dropdown');
      await trigger.click();
      await expect(c.locator('.slice_dropbox')).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(c.component).toHaveClass(/slice_dropdown--open/);
      await trigger.click();
      await expect(c.locator('.slice_dropbox')).toBeHidden();
      await trigger.click();
      await page.mouse.click(5, 400);
      await expect(c.locator('.slice_dropbox')).toBeHidden();
      expect(await c.eventArgs('onOpenChange')).toEqual([[true], [false], [true], [false]]);
   });

   test('separators are tidied, hidden items dropped, disabled ones skipped', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const dd = await build(page, { label: 'Menu' }, `{ items: [
         'separator',
         { label: 'One' },
         'separator', 'separator',
         { label: 'Ghost', hidden: true },
         { label: 'Off', disabled: () => true, onClick: () => log('off') },
         { label: 'Two' },
         'separator',
      ] }`);
      await dd.locator('.slice_dropdown').click();
      await expect(dd.locator('.slice_dropdown_separator')).toHaveCount(1);
      await expect(dd.getByRole('menuitem')).toHaveText(['One', 'Off', 'Two']);
      const off = dd.getByRole('menuitem', { name: 'Off' });
      await expect(off).toHaveAttribute('aria-disabled', 'true');
      await off.click({ force: true });
      await expect(menu(dd)).toBeVisible();
      expect(await page.evaluate(() => window.__log)).toEqual([]);
      // The keyboard steps over it.
      await dd.getByRole('menuitem', { name: 'One' }).focus();
      await page.keyboard.press('ArrowDown');
      await expect(dd.getByRole('menuitem', { name: 'Two' })).toBeFocused();
   });
});

test.describe('DropDown — keyboard', () => {
   test('Enter opens on the first item; arrows wrap; Home/End; Escape returns to the trigger', async ({ mount, page }) => {
      const c = await mount('DropDown', { label: 'Menu', items: ['Alpha', 'Beta', 'Gamma'] });
      const trigger = c.locator('.slice_dropdown');
      await trigger.focus();
      await page.keyboard.press('Enter');
      const item = (name) => c.component.getByRole('menuitem', { name });
      await expect(item('Alpha')).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(item('Gamma')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(item('Alpha')).toBeFocused();
      await page.keyboard.press('End');
      await expect(item('Gamma')).toBeFocused();
      await page.keyboard.press('Home');
      await expect(item('Alpha')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(c.locator('.slice_dropbox')).toBeHidden();
      await expect(trigger).toBeFocused();
   });

   test('ArrowUp on the trigger opens on the last item; Space opens too', async ({ mount, page }) => {
      const c = await mount('DropDown', { label: 'Menu', items: ['Alpha', 'Beta', 'Gamma'] });
      await c.locator('.slice_dropdown').focus();
      await page.keyboard.press('ArrowUp');
      await expect(c.component.getByRole('menuitem', { name: 'Gamma' })).toBeFocused();
      await page.keyboard.press('Escape');
      await page.keyboard.press(' ');
      await expect(c.component.getByRole('menuitem', { name: 'Alpha' })).toBeFocused();
   });

   test('typing a letter jumps to the matching item; repeating it cycles', async ({ mount, page }) => {
      const c = await mount('DropDown', { label: 'Menu', items: ['Apple', 'Banana', 'Blueberry', 'Cherry'] });
      await c.locator('.slice_dropdown').focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('b');
      await expect(c.component.getByRole('menuitem', { name: 'Banana' })).toBeFocused();
      await page.keyboard.press('b');
      await expect(c.component.getByRole('menuitem', { name: 'Blueberry' })).toBeFocused();
      await page.waitForTimeout(600); // the typed buffer resets after a pause
      await page.keyboard.press('c');
      await expect(c.component.getByRole('menuitem', { name: 'Cherry' })).toBeFocused();
   });

   test('Tab closes the menu', async ({ mount, page }) => {
      const c = await mount('DropDown', { label: 'Menu', items: ['Alpha', 'Beta'] });
      await c.locator('.slice_dropdown').focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      await expect(c.locator('.slice_dropbox')).toBeHidden();
   });
});

test.describe('DropDown — submenus', () => {
   test('ArrowRight walks into four levels; ArrowLeft and Escape step back one at a time', async ({ mount, page }) => {
      const c = await mount('DropDown', { label: 'File', items: NESTED });
      const dd = c.component;
      await c.locator('.slice_dropdown').focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      const share = dd.getByRole('menuitem', { name: 'Share' });
      await expect(share).toBeFocused();
      await expect(share).toHaveAttribute('aria-haspopup', 'menu');
      await page.keyboard.press('ArrowRight');
      await expect(share).toHaveAttribute('aria-expanded', 'true');
      await expect(dd.getByRole('menuitem', { name: 'Email' })).toBeFocused();
      expect(await share.getAttribute('aria-controls')).toBe(await menu(dd, 1).getAttribute('id'));

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter'); // Enter opens a submenu too
      await expect(dd.getByRole('menuitem', { name: 'Deep one' })).toBeFocused();
      await expect(dd.locator('.slice_dropbox:popover-open')).toHaveCount(4);

      await page.keyboard.press('ArrowLeft');
      await expect(dd.getByRole('menuitem', { name: 'More' })).toBeFocused();
      await expect(menu(dd, 3)).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(dd.getByRole('menuitem', { name: 'Social' })).toBeFocused();
      await expect(menu(dd)).toBeVisible();
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect(menu(dd)).toBeHidden();
      await expect(c.locator('.slice_dropdown')).toBeFocused();
   });

   test('hovering opens a submenu, hovering a sibling closes it, clicking opens it at once', async ({ mount, page }) => {
      const c = await mount('DropDown', { label: 'File', items: NESTED, placement: 'bottom-start' });
      const dd = c.component;
      await c.locator('.slice_dropdown').click();
      await dd.getByRole('menuitem', { name: 'Share' }).hover();
      await expect(menu(dd, 1)).toBeVisible();
      await dd.getByRole('menuitem', { name: 'Social' }).hover();
      await expect(menu(dd, 2)).toBeVisible();
      // Moving through the submenu keeps it; a sibling at the root closes both.
      await dd.getByRole('menuitem', { name: 'Mastodon' }).hover();
      await expect(menu(dd, 2)).toBeVisible();
      await dd.getByRole('menuitem', { name: 'Rename' }).hover();
      await expect(dd.locator('.slice_dropbox--sub')).toHaveCount(0);
      await dd.getByRole('menuitem', { name: 'Share' }).click();
      await expect(menu(dd, 1)).toBeVisible();
   });

   test('a submenu opens beside its item and flips left at the right edge', async ({ mountHtml, page }) => {
      await page.setViewportSize({ width: 800, height: 600 });
      await page.emulateMedia({ reducedMotion: 'reduce' }); // measure still panels
      await mountHtml('<div id="at-left" style="position:fixed;left:20px;top:20px"></div><div id="at-right" style="position:fixed;right:20px;top:20px"></div>');
      await page.evaluate(async (items) => {
         for (const id of ['left', 'right']) {
            const el = await slice.build('DropDown', { label: id, items, placement: id === 'left' ? 'bottom-start' : 'bottom-end' });
            el.id = id;
            document.getElementById(`at-${id}`).appendChild(el);
         }
      }, NESTED);
      const geo = async (id) => {
         const dd = page.locator(`#${id}`);
         await dd.locator('.slice_dropdown').click();
         await dd.getByRole('menuitem', { name: 'Share' }).click();
         await expect(menu(dd, 1)).toBeVisible();
         return page.evaluate((id) => {
            const el = document.getElementById(id);
            const root = el.querySelector('.slice_dropbox[data-level="0"]').getBoundingClientRect();
            const sub = el.querySelector('.slice_dropbox[data-level="1"]').getBoundingClientRect();
            const item = el.querySelector('.slice_dropdown_item--submenu').getBoundingClientRect();
            return { toRight: sub.left >= root.right - 6, toLeft: sub.right <= root.left + 6, alignedTop: Math.abs(sub.top - item.top) < 10, inside: sub.left >= 0 && sub.right <= innerWidth };
         }, id);
      };
      const left = await geo('left');
      expect(left).toMatchObject({ toRight: true, alignedTop: true, inside: true });
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      const right = await geo('right');
      expect(right).toMatchObject({ toLeft: true, alignedTop: true, inside: true });
   });

   test('items as an async function load on demand, with a loading row meanwhile', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const dd = await build(page, { label: 'Projects' }, `{ items: [{ label: 'Recent', items: async () => {
         await new Promise((r) => setTimeout(r, 300));
         return [{ label: 'Alpha' }, { label: 'Beta' }];
      } }] }`);
      await dd.locator('.slice_dropdown').click();
      await dd.getByRole('menuitem', { name: 'Recent' }).click();
      await expect(dd.locator('.slice_dropdown_loading')).toBeVisible();
      await expect(menu(dd, 1).getByRole('menuitem')).toHaveText(['Alpha', 'Beta']);
      await expect(dd.locator('.slice_dropdown_loading')).toHaveCount(0);
   });

   test('on a narrow screen a submenu stacks over its parent with a Back row', async ({ mount, page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const c = await mount('DropDown', { label: 'File', items: NESTED, placement: 'bottom-start' });
      const dd = c.component;
      await c.locator('.slice_dropdown').click();
      await dd.getByRole('menuitem', { name: 'Share' }).click();
      const sub = menu(dd, 1);
      await expect(sub).toHaveClass(/slice_dropbox--stacked/);
      const [rootBox, subBox] = await Promise.all([menu(dd).boundingBox(), sub.boundingBox()]);
      expect(Math.abs(rootBox.x - subBox.x)).toBeLessThan(1);
      expect(Math.abs(rootBox.y - subBox.y)).toBeLessThan(1);
      const back = sub.locator('.slice_dropdown_back');
      await expect(back).toHaveText('Share');
      // Keyboard: Back returns to the item that opened it.
      await back.focus();
      await page.keyboard.press('Enter');
      await expect(sub).toHaveCount(0);
      await expect(dd.getByRole('menuitem', { name: 'Share' })).toBeFocused();
      // Pointer: a tap on Back closes the layer too.
      await dd.getByRole('menuitem', { name: 'Share' }).click();
      await menu(dd, 1).locator('.slice_dropdown_back').click();
      await expect(menu(dd, 1)).toHaveCount(0);
      await expect(menu(dd)).toBeVisible();
   });
});

test.describe('DropDown — actions, toggles and custom content', () => {
   test('onSelect hears picks at any depth; onClick gets ctx; the menu closes', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const dd = await build(page, { label: 'Menu' }, `{
         onSelect: (item) => log('select', item.label),
         items: [{ label: 'Share', items: [{ label: 'Email', value: 'mail', onClick: ({ item, value, dropdown }) => log('click', item.label, value, dropdown.id) }] }],
      }`);
      await dd.locator('.slice_dropdown').click();
      await dd.getByRole('menuitem', { name: 'Share' }).click();
      await dd.getByRole('menuitem', { name: 'Email' }).click();
      await expect(menu(dd)).toBeHidden();
      await expect(dd.locator('.slice_dropbox--sub')).toHaveCount(0);
      expect(await page.evaluate(() => window.__log)).toEqual([['click', 'Email', 'mail', 'dd'], ['select', 'Email']]);
   });

   test('checkbox items toggle and keep the menu open; radio items are exclusive per group', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const dd = await build(page, { label: 'View' }, `{ items: window.__items = [
         { label: 'Show grid', checked: false },
         'separator',
         { type: 'radio', group: 'size', label: 'Small', checked: true },
         { type: 'radio', group: 'size', label: 'Large' },
      ] }`);
      await dd.locator('.slice_dropdown').click();
      const grid = dd.getByRole('menuitemcheckbox', { name: 'Show grid' });
      await expect(grid).toHaveAttribute('aria-checked', 'false');
      await grid.click();
      await expect(grid).toHaveAttribute('aria-checked', 'true');
      await expect(menu(dd)).toBeVisible();
      await dd.getByRole('menuitemradio', { name: 'Large' }).click();
      await expect(dd.getByRole('menuitemradio', { name: 'Large' })).toHaveAttribute('aria-checked', 'true');
      await expect(dd.getByRole('menuitemradio', { name: 'Small' })).toHaveAttribute('aria-checked', 'false');
      // The state lives on the items, so it survives a reopen.
      expect(await page.evaluate(() => window.__items.map((i) => i.checked))).toEqual([true, undefined, false, true]);
   });

   test('keepOpen and closeOnSelect: false keep the menu up; ctx.close() closes it', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const dd = await build(page, { label: 'Menu', closeOnSelect: false }, `{ items: [
         { label: 'Stay' },
         { label: 'Go', onClick: ({ close }) => close() },
      ] }`);
      await dd.locator('.slice_dropdown').click();
      await dd.getByRole('menuitem', { name: 'Stay' }).click();
      await expect(menu(dd)).toBeVisible();
      await dd.getByRole('menuitem', { name: 'Go' }).click();
      await expect(menu(dd)).toBeHidden();
   });

   test('{ render } puts any node in the menu; its keys belong to it', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const dd = await build(page, { label: 'Menu' }, `{ items: [
         { label: 'First' },
         { render: () => { const i = document.createElement('input'); i.setAttribute('aria-label', 'Search'); return i; } },
      ] }`);
      await dd.locator('.slice_dropdown').click();
      const input = dd.getByLabel('Search');
      await input.click();
      await page.keyboard.type('ab');
      await page.keyboard.press('ArrowUp');
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('ab');
      await page.keyboard.press('Escape');
      await expect(menu(dd)).toBeHidden();
   });

   test('icons, descriptions, shortcuts and badges render in their own columns', async ({ mount }) => {
      const c = await mount('DropDown', {
         label: 'Menu', items: [
            { label: 'Profile', icon: 'user', shortcut: '⌘P' },
            { label: 'Billing', description: 'Plans and invoices', badge: 3 },
            { label: 'Delete', danger: true },
         ]
      });
      await c.locator('.slice_dropdown').click();
      await expect(c.locator('.slice_dropbox')).toHaveClass(/slice_dropbox--icons/);
      await expect(c.locator('.slice_dropdown_item_icon slice-icon')).toHaveCount(1);
      await expect(c.locator('.slice_dropdown_item_shortcut')).toHaveText('⌘P');
      await expect(c.locator('.slice_dropdown_item_description')).toHaveText('Plans and invoices');
      await expect(c.locator('.slice_dropdown_item_badge')).toHaveText('3');
      await expect(c.component.getByRole('menuitem', { name: 'Delete' })).toHaveClass(/slice_dropdown_item--danger/);
   });
});

test.describe('DropDown — trigger', () => {
   test('variant and size', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', items: ['a'], variant: 'soft', size: 'lg' });
      await expect(c.locator('.slice_dropdown')).toHaveClass(/slice_dropdown--soft/);
      await expect(c.component).toHaveAttribute('data-size', 'lg');
      const lg = await c.locator('.slice_dropdown').evaluate((el) => el.getBoundingClientRect().height);
      await c.component.evaluate((el) => { el.size = 'sm'; el.variant = 'nope'; });
      const sm = await c.locator('.slice_dropdown').evaluate((el) => el.getBoundingClientRect().height);
      expect(lg).toBeGreaterThan(sm);
      await expect(c.locator('.slice_dropdown')).toHaveClass(/slice_dropdown--outlined/);
   });

   test('an icon-only trigger takes its name from ariaLabel', async ({ mount }) => {
      const c = await mount('DropDown', { icon: 'dots-vertical', ariaLabel: 'More actions', items: ['a'] });
      await expect(c.component.getByRole('button', { name: 'More actions' })).toBeVisible();
      await expect(c.locator('.slice_dropdown_icon slice-icon')).toHaveCount(1);
      await expect(c.locator('.slice_dropdown_label')).toBeHidden();
   });

   test('disabled: the trigger does nothing', async ({ mount }) => {
      const c = await mount('DropDown', { label: 'Menu', items: ['a'], disabled: true });
      await expect(c.locator('.slice_dropdown')).toBeDisabled();
      await c.locator('.slice_dropdown').click({ force: true });
      await expect(c.locator('.slice_dropbox')).toBeHidden();
   });

   test("trigger: 'hover' opens on mouse hover and closes on leaving", async ({ mountHtml, page }) => {
      await mountHtml('<div id="host" style="padding:20px"></div><div id="away" style="height:300px"></div>');
      const dd = await build(page, { label: 'Products', trigger: 'hover', items: NESTED, placement: 'bottom-start' });
      await dd.locator('.slice_dropdown').hover();
      await expect(menu(dd)).toBeVisible();
      // Crossing the gap into the menu does not close it.
      await dd.getByRole('menuitem', { name: 'New file' }).hover();
      await page.waitForTimeout(350);
      await expect(menu(dd)).toBeVisible();
      await page.mouse.move(600, 500);
      await expect(menu(dd)).toBeHidden();
   });

   test('placement: start / end alignment, and a flip upwards near the bottom', async ({ mountHtml, page }) => {
      await page.setViewportSize({ width: 800, height: 500 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await mountHtml('<div id="host" style="padding:40px 200px"></div><div id="low" style="position:fixed;left:200px;bottom:10px"></div>');
      const box = async (parent, placement) => {
         const id = `${parent}-${placement}`;
         await page.evaluate(async ({ parent, placement, id }) => {
            const el = await slice.build('DropDown', { label: 'A long trigger label', items: ['One', 'Two', 'Three'], placement });
            el.id = id;
            document.getElementById(parent).replaceChildren(el);
         }, { parent, placement, id });
         const dd = page.locator(`#${id}`);
         await dd.locator('.slice_dropdown').click();
         await expect(menu(dd)).toHaveClass(/is-open/);
         const out = await page.evaluate((id) => {
            const el = document.getElementById(id);
            const t = el.querySelector('.slice_dropdown').getBoundingClientRect();
            const m = el.querySelector('.slice_dropbox').getBoundingClientRect();
            return { leftAligned: Math.abs(m.left - t.left) < 1.5, rightAligned: Math.abs(m.right - t.right) < 1.5, below: m.top >= t.bottom, above: m.bottom <= t.top, side: el.querySelector('.slice_dropbox').dataset.side };
         }, id);
         await page.keyboard.press('Escape');
         return out;
      };
      expect(await box('host', 'bottom-start')).toMatchObject({ leftAligned: true, below: true, side: 'bottom' });
      expect(await box('host', 'bottom-end')).toMatchObject({ rightAligned: true, below: true });
      expect(await box('low', 'bottom-start')).toMatchObject({ leftAligned: true, above: true, side: 'top' });
   });

   test('the menu escapes overflow: hidden ancestors (top layer)', async ({ mountHtml, page }) => {
      await mountHtml('<div style="overflow:hidden;height:60px;padding:10px;border:1px solid"><div id="host"></div></div>');
      const dd = await build(page, { label: 'Menu', items: ['Alpha', 'Beta', 'Gamma', 'Delta'], placement: 'bottom-start' });
      await dd.locator('.slice_dropdown').click();
      const last = dd.getByRole('menuitem', { name: 'Delta' });
      await expect(last).toBeVisible();
      const hit = await last.evaluate((el) => {
         const r = el.getBoundingClientRect();
         return el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      });
      expect(hit).toBe(true);
   });

   test('items replaced while open redraw the menu; destroying while open leaves no errors', async ({ mount, page }) => {
      const c = await mount('DropDown', { label: 'Menu', items: ['Alpha'] });
      await c.locator('.slice_dropdown').click();
      await c.component.evaluate((el) => { el.items = ['Beta', 'Gamma']; });
      await expect(c.component.getByRole('menuitem')).toHaveText(['Beta', 'Gamma']);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      await page.mouse.click(5, 5);
      expect(c.pageErrors()).toEqual([]);
   });
});

test.describe('DropDown — in a Navbar', () => {
   test('nested items become a plain, hover-opening dropdown with submenus', async ({ mount, page }) => {
      await page.setViewportSize({ width: 1200, height: 700 });
      const c = await mount('Navbar', {
         items: [
            { text: 'Home', path: '/nav-home' },
            { text: 'Products', items: [{ label: 'Analytics' }, { label: 'Automation', items: [{ label: 'Workflows' }] }] },
            { text: 'Legacy', type: 'dropdown', options: [{ text: 'Old', href: '#old' }] },
         ]
      });
      const products = c.component.locator('slice-dropdown').first();
      await expect(products.locator('.slice_dropdown')).toHaveClass(/slice_dropdown--plain/);
      await products.locator('.slice_dropdown').hover();
      await expect(products.getByRole('menuitem', { name: 'Analytics' })).toBeVisible();
      await products.getByRole('menuitem', { name: 'Automation' }).hover();
      await expect(products.getByRole('menuitem', { name: 'Workflows' })).toBeVisible();
      const legacy = c.component.locator('slice-dropdown').nth(1);
      await legacy.locator('.slice_dropdown').click();
      await expect(legacy.getByRole('menuitem', { name: 'Old' })).toHaveAttribute('href', '#old');
   });
});