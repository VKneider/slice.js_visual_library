import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// TreeView: one flat list of rows (role="treeitem", aria-level / setsize /
// posinset) inside .simple_treeview (role="tree"). Rows are keyed by
// id → path → parent key + label; a row's `data-key` is that key.
// Items with functions (lazy children, handlers) are built inside the page.

const NAV = [
   {
      value: 'Components', items: [
         { value: 'Button', path: '/t/button' },
         { value: 'Inputs', items: [{ value: 'Input', path: '/t/input' }, { value: 'Select', path: '/t/select' }] },
      ]
   },
   { value: 'Services', items: [{ value: 'Fetch', path: '/t/fetch' }] },
   { value: 'About', path: '/t/about' },
];

const rowsText = (tree) => tree.locator('[role="treeitem"]').evaluateAll((rows) => rows.map((r) => r.querySelector('.slice_treeview_label').textContent));
const row = (tree, name) => tree.getByRole('treeitem', { name, exact: true });

/** Build a TreeView inside the page; `setup` is an expression for function props. */
async function build(page, props, setup = '') {
   await page.evaluate(async ({ props, setup }) => {
      window.__log = [];
      // eslint-disable-next-line no-new-func
      const extra = setup ? new Function('log', `return (${setup});`)((...a) => window.__log.push(a)) : {};
      const el = await slice.build('TreeView', { ...props, ...extra });
      el.id = 'tree';
      document.getElementById('host').appendChild(el);
      window.__tree = el;
   }, { props, setup });
   return page.locator('#tree');
}

test.describe('TreeView — structure', () => {
   test('smoke: a tree of treeitems with levels, sizes and positions', async ({ mount }) => {
      const c = await mount('TreeView', { items: NAV, ariaLabel: 'Docs', expanded: 'all' });
      await expect(c.component.getByRole('tree', { name: 'Docs' })).toBeVisible();
      expect(await rowsText(c.component)).toEqual(['Components', 'Button', 'Inputs', 'Input', 'Select', 'Services', 'Fetch', 'About']);
      const select = row(c.component, 'Select');
      await expect(select).toHaveAttribute('aria-level', '3');
      await expect(select).toHaveAttribute('aria-posinset', '2');
      await expect(select).toHaveAttribute('aria-setsize', '2');
      await expect(row(c.component, 'Components')).toHaveAttribute('aria-expanded', 'true');
      await expect(row(c.component, 'Button')).not.toHaveAttribute('aria-expanded', /.*/);
      expect(c.pageErrors()).toEqual([]);
   });

   test('branches start closed; label, value and text name a node; children and items nest it', async ({ mount }) => {
      const c = await mount('TreeView', {
         items: [
            { label: 'A', children: [{ text: 'A1' }] },
            { value: 'B', items: [{ label: 'B1' }] },
            { text: 'Hidden', hidden: true },
         ]
      });
      expect(await rowsText(c.component)).toEqual(['A', 'B']);
      await row(c.component, 'A').click();
      expect(await rowsText(c.component)).toEqual(['A', 'A1', 'B']);
   });

   test('the chevron opens and closes any branch; a branch without a path also toggles on its label', async ({ mount }) => {
      const c = await mount('TreeView', { items: [{ value: 'Docs', path: '/t/docs', items: [{ value: 'Child', path: '/t/child' }] }, ...NAV] }, { spies: ['onToggle'] });
      const docs = row(c.component, 'Docs');
      await docs.locator('.slice_treeview_toggle').click();
      await expect(docs).toHaveAttribute('aria-expanded', 'true');
      await expect(row(c.component, 'Child')).toBeVisible();
      // A row WITH a path is a destination: its label does not toggle it.
      await docs.locator('.slice_treeview_label').click();
      await expect(docs).toHaveAttribute('aria-expanded', 'true');
      await row(c.component, 'Components').click();
      await expect(row(c.component, 'Components')).toHaveAttribute('aria-expanded', 'true');
      await row(c.component, 'Components').click();
      await expect(row(c.component, 'Components')).toHaveAttribute('aria-expanded', 'false');
      expect((await c.eventArgs('onToggle')).map((args) => args[1])).toEqual([true, true, false]);
   });

   test("expanded: 'all' and item.expanded open branches up front", async ({ mount }) => {
      const a = await mount('TreeView', { items: NAV, expanded: 'all' });
      await expect(row(a.component, 'Select')).toBeVisible();
      const b = await mount('TreeView', { items: [{ value: 'Open', expanded: true, items: [{ value: 'Inside' }] }, { value: 'Shut', items: [{ value: 'Hidden' }] }] });
      await expect(row(b.component, 'Inside')).toBeVisible();
      await expect(row(b.component, 'Hidden')).toHaveCount(0);
   });

   test('setting items re-renders; surviving rows keep their element and open state', async ({ mount }) => {
      const c = await mount('TreeView', { items: NAV });
      await row(c.component, 'Components').click();
      await c.component.evaluate((el) => { window.__kept = el.querySelector('[data-key="/t/button"]'); });
      await c.component.evaluate((el) => {
         el.items = [el.items[0], { value: 'New', path: '/t/new' }];
      });
      expect(await rowsText(c.component)).toEqual(['Components', 'Button', 'Inputs', 'New']);
      expect(await c.component.evaluate((el) => el.querySelector('[data-key="/t/button"]') === window.__kept)).toBe(true);
   });

   test('the caller data is not mutated', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const out = await page.evaluate(async () => {
         const items = [{ value: 'A', items: [{ value: 'A1', path: '/t/a1' }] }];
         const before = JSON.stringify(items);
         const el = await slice.build('TreeView', { items, expanded: 'all', onClick: () => {} });
         document.getElementById('host').appendChild(el);
         return [before, JSON.stringify(items), Object.keys(items[0])];
      });
      expect(out[1]).toBe(out[0]);
      expect(out[2]).toEqual(['value', 'items']);
   });
});

test.describe('TreeView — current page and clicks', () => {
   test('activePath marks its row and opens its ancestors', async ({ mount }) => {
      const c = await mount('TreeView', { items: NAV, activePath: '/t/select' });
      const select = row(c.component, 'Select');
      await expect(select).toHaveAttribute('aria-current', 'page');
      await expect(select).toHaveClass(/is-active/);
      await expect(row(c.component, 'Inputs')).toHaveAttribute('aria-expanded', 'true');
      await expect(row(c.component, 'Services')).toHaveAttribute('aria-expanded', 'false');
   });

   test('onClick gets the row with path, value and item; setActiveTreeItem(row) marks it', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const tree = await build(page, { items: NAV, expanded: 'all' }, `{ onClick: (r) => { log(r.path, r.value, r.item.value); window.__tree.setActiveTreeItem(r); } }`);
      await row(tree, 'Fetch').click();
      expect(await page.evaluate(() => window.__log)).toEqual([['/t/fetch', 'Fetch', 'Fetch']]);
      await expect(row(tree, 'Fetch')).toHaveAttribute('aria-current', 'page');
      await row(tree, 'Button').click();
      await expect(row(tree, 'Fetch')).not.toHaveAttribute('aria-current', 'page');
      await expect(row(tree, 'Button')).toHaveAttribute('aria-current', 'page');
   });

   test('the deprecated onClickCallback still works and warns once', async ({ mount }) => {
      const c = await mount('TreeView', { items: NAV }, { spies: ['onClickCallback'] });
      await row(c.component, 'About').click();
      expect(await c.eventArgs('onClickCallback')).toHaveLength(1);
      expect(c.warnings().filter((w) => w.includes('onClickCallback')).length).toBeLessThanOrEqual(1);
   });

   test('follows the router (router:change) and back / forward (popstate)', async ({ mount, page }) => {
      const c = await mount('TreeView', { items: NAV });
      const original = await page.evaluate(() => location.pathname);
      await page.evaluate(() => {
         history.pushState({}, '', '/t/input');
         window.dispatchEvent(new CustomEvent('router:change', { detail: {} }));
      });
      await expect(row(c.component, 'Input')).toHaveAttribute('aria-current', 'page');
      await page.evaluate(() => {
         history.pushState({}, '', '/t/fetch');
         window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await expect(row(c.component, 'Fetch')).toHaveAttribute('aria-current', 'page');
      await page.evaluate((path) => history.replaceState({}, '', path), original);
   });

   test('navigate: true routes a row with a path', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      await page.evaluate(() => { window.__nav = []; slice.router.navigate = (path) => { window.__nav.push(path); }; });
      const tree = await build(page, { items: NAV, navigate: true });
      await row(tree, 'About').click();
      expect(await page.evaluate(() => window.__nav)).toEqual(['/t/about']);
   });
});

test.describe('TreeView — keyboard', () => {
   test('one tab stop; arrows walk, open and close; Home / End; Enter activates', async ({ mount, page }) => {
      const c = await mount('TreeView', { items: NAV }, { spies: ['onClick'] });
      const tree = c.component;
      await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
      await row(tree, 'Components').focus();
      await page.keyboard.press('ArrowRight');
      await expect(row(tree, 'Components')).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('ArrowRight');
      await expect(row(tree, 'Button')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await expect(row(tree, 'Input')).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(row(tree, 'Inputs')).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(row(tree, 'Inputs')).toHaveAttribute('aria-expanded', 'false');
      await page.keyboard.press('End');
      await expect(row(tree, 'About')).toBeFocused();
      await page.keyboard.press('Home');
      await expect(row(tree, 'Components')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      expect(await c.eventArgs('onClick')).toHaveLength(1);
      await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1);
   });

   test('* opens every sibling; typing jumps by label', async ({ mount, page }) => {
      const c = await mount('TreeView', { items: NAV });
      await row(c.component, 'Components').focus();
      await page.keyboard.press('*');
      await expect(row(c.component, 'Services')).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('a');
      await expect(row(c.component, 'About')).toBeFocused();
      await page.waitForTimeout(600);
      await page.keyboard.press('f');
      await expect(row(c.component, 'Fetch')).toBeFocused();
   });
});

test.describe('TreeView — remembered state', () => {
   test('stateKey remembers open branches; without it nothing is stored', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      await page.evaluate(() => localStorage.removeItem('slice-tree:spec'));
      let tree = await build(page, { items: NAV, stateKey: 'spec' });
      await row(tree, 'Services').click();
      expect(JSON.parse(await page.evaluate(() => localStorage.getItem('slice-tree:spec')))).toEqual(['/Services']);
      await page.evaluate(() => { document.getElementById('host').replaceChildren(); });
      tree = await build(page, { items: NAV, stateKey: 'spec' });
      await expect(row(tree, 'Fetch')).toBeVisible();
      const before = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('treeitem-') || k.startsWith('slice-tree:')).sort());
      await page.evaluate(() => { document.getElementById('host').replaceChildren(); });
      tree = await build(page, { items: NAV });
      await row(tree, 'Components').click();
      const after = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('treeitem-') || k.startsWith('slice-tree:')).sort());
      expect(after).toEqual(before);
   });
});

test.describe('TreeView — selection', () => {
   test("'single': aria-selected follows the pick; onSelect hears it", async ({ mount }) => {
      const c = await mount('TreeView', { items: NAV, selection: 'single', expanded: 'all' }, { spies: ['onSelect'] });
      await row(c.component, 'Fetch').click();
      await expect(row(c.component, 'Fetch')).toHaveAttribute('aria-selected', 'true');
      await expect(row(c.component, 'Button')).toHaveAttribute('aria-selected', 'false');
      expect(await c.component.evaluate((el) => el.selected)).toEqual(['/t/fetch']);
      expect((await c.eventArgs('onSelect'))[0][0].value).toBe('Fetch');
   });

   test("'multiple': a parent checks its subtree, children make it mixed, disabled rows are skipped", async ({ mount, page }) => {
      const items = [{ value: 'All', items: [{ value: 'One', id: 'one' }, { value: 'Two', id: 'two' }, { value: 'Locked', id: 'lock', disabled: true }] }];
      const c = await mount('TreeView', { items, selection: 'multiple', expanded: 'all' }, { spies: ['onSelectionChange'] });
      const tree = c.component;
      await expect(tree.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
      await row(tree, 'One').locator('.slice_treeview_check').click();
      await expect(row(tree, 'All')).toHaveAttribute('aria-checked', 'mixed');
      await row(tree, 'All').locator('.slice_treeview_check').click();
      await expect(row(tree, 'Two')).toHaveAttribute('aria-checked', 'true');
      await expect(row(tree, 'Locked')).toHaveAttribute('aria-checked', 'false');
      // Space on a focused row toggles it too.
      await row(tree, 'Two').focus();
      await page.keyboard.press(' ');
      await expect(row(tree, 'Two')).toHaveAttribute('aria-checked', 'false');
      expect((await c.eventArgs('onSelectionChange')).at(-1)[0]).toEqual(['one']);
   });

   test('selected sets the initial checks; a checked parent checks its children', async ({ mount }) => {
      const c = await mount('TreeView', { items: NAV, selection: 'multiple', selected: ['/Components/Inputs'], expanded: 'all' });
      await expect(row(c.component, 'Input')).toHaveAttribute('aria-checked', 'true');
      await expect(row(c.component, 'Select')).toHaveAttribute('aria-checked', 'true');
      await expect(row(c.component, 'Components')).toHaveAttribute('aria-checked', 'mixed');
   });
});

test.describe('TreeView — search', () => {
   test('shows matches with their ancestors, accent-insensitive, highlighted; empty message', async ({ mount }) => {
      const items = [{ value: 'Configuración', items: [{ value: 'Cámara' }, { value: 'Audio' }] }, { value: 'Otros', items: [{ value: 'Camión' }] }];
      const c = await mount('TreeView', { items, searchable: true, emptyMessage: 'Sin resultados' });
      await c.locator('.slice_treeview_search_input').fill('cam');
      await expect.poll(() => rowsText(c.component)).toEqual(['Configuración', 'Cámara', 'Otros', 'Camión']);
      await expect(row(c.component, 'Cámara').locator('mark')).toHaveText('Cám');
      await c.locator('.slice_treeview_search_input').fill('zzz');
      await expect(c.locator('.slice_treeview_empty')).toHaveText('Sin resultados');
      await expect(c.locator('.slice_treeview_empty')).toBeVisible();
      await c.component.evaluate((el) => { el.filter = ''; });
      expect(await rowsText(c.component)).toEqual(['Configuración', 'Otros']);
   });
});

test.describe('TreeView — lazy branches', () => {
   test('items as an async function load when the branch first opens', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const tree = await build(page, {}, `{ items: [{ value: 'Remote', id: 'remote', items: async () => {
         log('load');
         await new Promise((r) => setTimeout(r, 300));
         return [{ value: 'Loaded A' }, { value: 'Loaded B', items: [{ value: 'Deep' }] }];
      } }] }`);
      await expect(row(tree, 'Remote')).toHaveAttribute('aria-expanded', 'false');
      await row(tree, 'Remote').click();
      await expect(tree.locator('.slice_treeview_row--loading')).toBeVisible();
      await expect(row(tree, 'Loaded A')).toBeVisible();
      await expect(tree.locator('.slice_treeview_row--loading')).toHaveCount(0);
      await row(tree, 'Remote').click();
      await row(tree, 'Remote').click();
      expect(await page.evaluate(() => window.__log)).toEqual([['load']]);
      await page.evaluate(() => window.__tree.reload('remote'));
      expect(await page.evaluate(() => window.__log)).toEqual([['load'], ['load']]);
   });
});

test.describe('TreeView — virtual', () => {
   test('20,000 nodes render a window of rows; End reaches the last', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      await page.evaluate(async () => {
         const items = Array.from({ length: 200 }, (_, i) => ({ value: `Folder ${i}`, expanded: true, items: Array.from({ length: 99 }, (_, j) => ({ value: `File ${i}.${j}` })) }));
         const el = await slice.build('TreeView', { items, virtual: true, maxHeight: '300px' });
         el.id = 'tree';
         document.getElementById('host').appendChild(el);
      });
      const tree = page.locator('#tree');
      const count = await tree.locator('[role="treeitem"]').count();
      expect(count).toBeGreaterThan(5);
      expect(count).toBeLessThan(60);
      await row(tree, 'Folder 0').focus();
      await page.keyboard.press('End');
      await expect(row(tree, 'File 199.98')).toBeFocused();
      expect(await tree.locator('[role="treeitem"]').count()).toBeLessThan(60);
   });
});

test.describe('TreeView — drag and drop', () => {
   const ITEMS = `[
      { value: 'Inbox', id: 'inbox', items: [{ value: 'Mail 1', id: 'm1' }, { value: 'Mail 2', id: 'm2' }] },
      { value: 'Archive', id: 'archive', items: [] },
      { value: 'Notes', id: 'notes' },
   ]`;

   test('dropping on the middle of a row moves the item inside it, in your data', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const tree = await build(page, { draggable: true, expanded: 'all' }, `{ items: window.__data = ${ITEMS}, onMove: ({ item, target, position }) => log(item.value, target.value, position) }`);
      const target = row(tree, 'Archive');
      const box = await target.boundingBox();
      await row(tree, 'Mail 1').dragTo(target, { targetPosition: { x: 40, y: box.height / 2 } });
      await expect.poll(() => rowsText(tree)).toEqual(['Inbox', 'Mail 2', 'Archive', 'Mail 1', 'Notes']);
      expect(await page.evaluate(() => window.__log)).toEqual([['Mail 1', 'Archive', 'inside']]);
      expect(await page.evaluate(() => window.__data[1].items.map((i) => i.value))).toEqual(['Mail 1']);
   });

   test('dropping on the top edge puts it before; onMove returning false refuses; a branch never drops into itself', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const tree = await build(page, { draggable: true, expanded: 'all' }, `{ items: ${ITEMS}, onMove: ({ target }) => target.value !== 'Notes' }`);
      await row(tree, 'Notes').dragTo(row(tree, 'Inbox'), { targetPosition: { x: 40, y: 2 } });
      await expect.poll(() => rowsText(tree)).toEqual(['Notes', 'Inbox', 'Mail 1', 'Mail 2', 'Archive']);
      await row(tree, 'Archive').dragTo(row(tree, 'Notes'), { targetPosition: { x: 40, y: 2 } });
      expect(await rowsText(tree)).toEqual(['Notes', 'Inbox', 'Mail 1', 'Mail 2', 'Archive']);
      const mail = await row(tree, 'Mail 1').boundingBox();
      await row(tree, 'Inbox').dragTo(row(tree, 'Mail 1'), { targetPosition: { x: 40, y: mail.height / 2 } });
      expect(await rowsText(tree)).toEqual(['Notes', 'Inbox', 'Mail 1', 'Mail 2', 'Archive']);
   });
});

test.describe('TreeView — row actions and looks', () => {
   test('a ⋯ menu per row: clicking it does not activate the row; Shift+F10 and right click open it', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host"></div>');
      const tree = await build(page, { items: NAV }, `{
         onClick: () => log('row'),
         nodeActions: (item) => [{ label: 'Rename ' + item.value, onClick: () => log('rename', item.value) }],
      }`);
      const about = row(tree, 'About');
      await about.hover();
      await about.getByRole('button', { name: 'Actions for About' }).click();
      await tree.getByRole('menuitem', { name: 'Rename About' }).click();
      expect(await page.evaluate(() => window.__log)).toEqual([['rename', 'About']]);
      await about.focus();
      await page.keyboard.press('Shift+F10');
      await expect(tree.getByRole('menuitem', { name: 'Rename About' })).toBeFocused();
      await page.keyboard.press('Escape');
      await row(tree, 'Services').click({ button: 'right' });
      await expect(tree.getByRole('menuitem', { name: 'Rename Services' })).toBeVisible();
   });

   test('icons, badges, descriptions, disabled; size, indicator and guides are reflected', async ({ mount }) => {
      const c = await mount('TreeView', {
         items: [{ value: 'Docs', icon: 'folder', badge: 3, description: 'All pages', items: [{ value: 'Off', disabled: true }] }],
         size: 'lg', indicator: 'bar', guides: false, expanded: 'all',
      });
      await expect(c.locator('.slice_treeview_icon slice-icon')).toHaveCount(1);
      await expect(c.locator('.slice_treeview_badge')).toHaveText('3');
      await expect(c.locator('.slice_treeview_description')).toHaveText('All pages');
      await expect(row(c.component, 'Off')).toHaveAttribute('aria-disabled', 'true');
      await expect(c.component).toHaveAttribute('data-size', 'lg');
      await expect(c.component).toHaveAttribute('data-indicator', 'bar');
      await expect(c.component).not.toHaveClass(/slice_treeview--guides/);
   });

   test('no row is wider than the tree', async ({ mountHtml, page }) => {
      await mountHtml('<div id="host" style="width:260px"></div>');
      const tree = await build(page, { items: [{ value: 'A very very long label that does not fit at all in the tree', items: [{ value: 'Child with an equally long and winding label to wrap' }] }], expanded: 'all' });
      const widths = await tree.evaluate((el) => {
         const max = el.querySelector('.simple_treeview').clientWidth;
         return [...el.querySelectorAll('[role="treeitem"]')].map((r) => r.getBoundingClientRect().width <= max + 0.5);
      });
      expect(widths).toEqual([true, true]);
   });

   test('destroying the tree releases its row menus without errors', async ({ mount, page }) => {
      const c = await mount('TreeView', { items: NAV, nodeActions: null });
      await c.component.evaluate((el) => { el.nodeActions = () => [{ label: 'X' }]; });
      await expect(c.locator('slice-dropdown')).toHaveCount(3);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      await page.mouse.click(5, 5);
      expect(c.pageErrors()).toEqual([]);
   });
});