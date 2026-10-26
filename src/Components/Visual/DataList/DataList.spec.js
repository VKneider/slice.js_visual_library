import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const PEOPLE = [
   { id: 1, name: 'José Pérez', email: 'jose@acme.com', city: 'Maracaibo', role: 'Admin', active: true },
   { id: 2, name: 'Ana López', email: 'ana@acme.com', city: 'Caracas', role: 'Editor', active: true },
   { id: 3, name: 'Luis Galué', email: 'luis@acme.com', city: 'Valencia', role: 'Viewer', active: false },
   { id: 4, name: 'María Ruiz', email: 'maria@acme.com', city: 'Caracas', role: 'Editor', active: true },
   { id: 5, name: 'Andrés Bello', email: 'andres@acme.com', city: 'Mérida', role: 'Viewer', active: false },
];

const BASE = { items: PEOPLE, title: 'name', description: 'email' };

const rows = (c) => c.locator('.slice-data-list__item');
// The test root is narrow; most tests want a desktop-wide list.
const wide = (c) => c.component.evaluate(async (el) => {
   el.style.width = '820px';
   // Let the list notice its new width before the test looks at it.
   await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
});
const titles = (c) => c.locator('.slice-data-list__item .slice-data-list__title');
const row = (c, id) => c.locator(`.slice-data-list__item[data-key="${id}"]`);

// Many orders, for paging.
const ORDERS = Array.from({ length: 45 }, (_, i) => ({ id: i + 1, title: `Order #${1001 + i}`, total: (i + 1) * 10 }));

test.describe('DataList — items', () => {
   test('smoke: one row per item, with its title and description', async ({ mount }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      expect(c.pageErrors()).toEqual([]);
      await expect(c.component).toHaveClass(/slice-data-list/);
      await expect(c.locator('ul.slice-data-list__items')).toHaveAttribute('role', 'list');
      await expect(titles(c)).toHaveText(PEOPLE.map((p) => p.name));
      await expect(row(c, 2).locator('.slice-data-list__description')).toHaveText('ana@acme.com');
   });

   test('anatomy: avatar, meta with icons, tags, badge, value and a relative time', async ({ mount }) => {
      const c = await mount('DataList', {
         items: [{ id: 1, name: 'Ana López', city: 'Caracas', tags: ['vip', 'beta'], status: 'Active', spent: '$1,200', seen: new Date(Date.now() - 3 * 3600 * 1000).toISOString() }],
         title: 'name',
         avatar: { name: 'name' },
         meta: [{ value: 'city', icon: 'map-pin' }],
         tags: 'tags',
         value: 'spent',
         timestamp: 'seen',
      });
      await c.component.evaluate((el) => { el.badge = (item) => ({ label: item.status, variant: 'success' }); });
      const item = row(c, 1);
      await expect(item.locator('slice-avatar')).toHaveAttribute('aria-label', 'Ana López');
      await expect(item.locator('.slice-data-list__meta-item')).toHaveText('Caracas');
      await expect(item.locator('.slice-data-list__meta-item slice-icon')).toHaveCount(1);
      await expect(item.locator('slice-chip')).toHaveCount(2);
      await expect(item.locator('slice-badge')).toHaveText('Active');
      await expect(item.locator('.slice-data-list__value')).toHaveText('$1,200');
      await expect(item.locator('time')).toHaveText('3 hours ago');
      await expect(item.locator('time')).toHaveAttribute('title', /\d/);
   });

   test('a path makes the title a link the router follows; Ctrl-click is left to the browser', async ({ mount }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => {
         el.path = (p) => `/people/${p.id}`;
         el._nav = [];
         el._realNavigate = slice.router.navigate;
         slice.router.navigate = (to) => { el._nav.push(to); };
      });
      const link = row(c, 3).locator('a.slice-data-list__title');
      await expect(link).toHaveAttribute('href', '/people/3');
      // The whole row is the link's hit area.
      await row(c, 3).click();
      expect(await c.component.evaluate((el) => el._nav)).toEqual(['/people/3']);
      await c.component.evaluate((el) => { slice.router.navigate = el._realNavigate; });
   });

   test('onItemClick: the row is a button that reports the item', async ({ mount, page }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => { el._clicked = []; el.onItemClick = (item) => el._clicked.push(item.id); });
      await expect(row(c, 2).locator('button.slice-data-list__title')).toBeVisible();
      await row(c, 2).click();
      await row(c, 4).locator('.slice-data-list__title').focus();
      await page.keyboard.press('Enter');
      expect(await c.component.evaluate((el) => el._clicked)).toEqual([2, 4]);
   });

   test('renderItem draws the middle of the row', async ({ mount }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => {
         el.renderItem = (item) => {
            const b = document.createElement('b');
            b.className = 'custom';
            b.textContent = `${item.name} (${item.city})`;
            return b;
         };
      });
      await expect(row(c, 1).locator('.custom')).toHaveText('José Pérez (Maracaibo)');
   });
});

test.describe('DataList — finding things', () => {
   test('search: no accents needed, every word must match; "no results" offers to clear', async ({ mount }) => {
      const c = await mount('DataList', { ...BASE, searchable: true, meta: ['city'] });
      await wide(c);
      const box = c.locator('.slice-data-list__search input');
      await box.fill('jose');
      await expect(titles(c)).toHaveText(['José Pérez']);
      await box.fill('ana caracas');
      await expect(titles(c)).toHaveText(['Ana López']);
      await expect(c.locator('.slice-data-list__summary')).toHaveText('1 of 5');
      await box.fill('zzz');
      await expect(rows(c)).toHaveCount(0);
      await expect(c.locator('.slice-data-list__state slice-emptystate')).toContainText('Nothing matches');
      await c.locator('.slice-data-list__state button').click();
      await expect(rows(c)).toHaveCount(5);
      await expect(box).toHaveValue('');
   });

   test('views: quick filters with counts', async ({ mount }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => {
         el.views = [{ id: 'all', label: 'Everyone' }, { id: 'active', label: 'Active', filter: (p) => p.active }, { id: 'off', label: 'Inactive', filter: (p) => !p.active }];
      });
      const views = c.locator('.slice-data-list__view');
      await expect(views).toHaveText(['Everyone5', 'Active3', 'Inactive2']);
      await views.nth(2).click();
      await expect(views.nth(2)).toHaveAttribute('aria-pressed', 'true');
      await expect(titles(c)).toHaveText(['Luis Galué', 'Andrés Bello']);
   });

   test('filters: options come from the data, and the button says what is picked', async ({ mount }) => {
      const c = await mount('DataList', { ...BASE, filters: [{ key: 'city', label: 'City' }] });
      await wide(c);
      await c.component.evaluate((el) => { el.filterValues = { city: ['Caracas'] }; });
      await expect(titles(c)).toHaveText(['Ana López', 'María Ruiz']);
      await expect(c.locator('.slice-data-list__filter')).toHaveClass(/is-active/);
      expect(await c.locator('.slice-data-list__filter').evaluate((el) => el.label)).toBe('City: Caracas');
      const options = await c.component.evaluate((el) => el._filterOptions(el.filters[0]).map((o) => `${o.label}:${o.count}`));
      expect(options).toEqual(['Caracas:2', 'Maracaibo:1', 'Mérida:1', 'Valencia:1']);
      await c.component.evaluate((el) => { el.filterValues = { city: ['Caracas', 'Mérida'] }; });
      await expect(rows(c)).toHaveCount(3);
   });

   test('sort: by an option, both ways', async ({ mount }) => {
      const c = await mount('DataList', { ...BASE, sortOptions: [{ key: 'name', label: 'Name' }, { key: 'city', label: 'City' }] });
      await wide(c);
      await c.component.evaluate((el) => { el.sort = { key: 'name', direction: 'asc' }; });
      await expect(titles(c)).toHaveText(['Ana López', 'Andrés Bello', 'José Pérez', 'Luis Galué', 'María Ruiz']);
      await c.component.evaluate((el) => { el.sort = { key: 'name', direction: 'desc' }; });
      await expect(titles(c).first()).toHaveText('María Ruiz');
      expect(await c.component.evaluate((el) => el.sort)).toEqual({ key: 'name', direction: 'desc' });
   });

   test('groups: by a field, by letter, and folding a group', async ({ mount }) => {
      const c = await mount('DataList', { ...BASE, groupBy: 'role', collapsibleGroups: true });
      await wide(c);
      await expect(c.locator('.slice-data-list__group-label')).toHaveText(['Admin1', 'Editor2', 'Viewer2']);
      await c.locator('.slice-data-list__group-label').nth(1).click();
      await expect(c.locator('.slice-data-list__group-label').nth(1)).toHaveAttribute('aria-expanded', 'false');
      await expect(rows(c)).toHaveCount(3);
      await c.component.evaluate((el) => { el.groupBy = { key: 'name', by: 'letter' }; });
      await expect(c.locator('.slice-data-list__group-label span:first-child')).toHaveText(['A', 'J', 'L', 'M']);
   });

   test('groups by day: Today, Yesterday, Older', async ({ mount }) => {
      const day = 86400000;
      const c = await mount('DataList', {
         items: [
            { id: 1, title: 'Old', at: new Date(Date.now() - 90 * day).toISOString() },
            { id: 2, title: 'Now', at: new Date().toISOString() },
            { id: 3, title: 'Before', at: new Date(Date.now() - day).toISOString() },
         ],
         groupBy: { key: 'at', by: 'day' },
      });
      await expect(c.locator('.slice-data-list__group-label span:first-child')).toHaveText(['Today', 'Yesterday', 'Older']);
   });
});

test.describe('DataList — selection and actions', () => {
   test('multiple: checkboxes, Shift for a range, select all, and a bulk action', async ({ mount, page }) => {
      const c = await mount('DataList', { ...BASE, selection: 'multiple' }, { spies: ['onSelectionChange'] });
      await wide(c);
      await c.component.evaluate((el) => {
         el._bulk = [];
         el.bulkActions = [{ label: 'Archive', onClick: ({ items }) => el._bulk.push(items.map((i) => i.id)) }];
      });
      await row(c, 1).locator('.slice-data-list__check').check();
      await row(c, 4).locator('.slice-data-list__check').click({ modifiers: ['Shift'] });
      expect(await c.component.evaluate((el) => el.selected)).toEqual([1, 2, 3, 4]);
      await expect(c.locator('.slice-data-list__bulk-text')).toHaveText('4 selected');
      await c.locator('.slice-data-list__bulk-actions button', { hasText: 'Archive' }).click();
      expect(await c.component.evaluate((el) => el._bulk)).toEqual([[1, 2, 3, 4]]);
      // A bulk action ends the selection.
      expect(await c.component.evaluate((el) => el.selected)).toEqual([]);
      await c.locator('.slice-data-list__select-all-box').check();
      expect(await c.component.evaluate((el) => el.selected.length)).toBe(5);
      await expect(c.locator('.slice-data-list__select-all-box')).toBeChecked();
      expect((await c.eventArgs('onSelectionChange')).length).toBeGreaterThan(0);
   });

   test('a row that opens nothing is selected by a click; keys outlive new data', async ({ mount }) => {
      const c = await mount('DataList', { ...BASE, selection: 'multiple' });
      await wide(c);
      await row(c, 2).click();
      await expect(row(c, 2)).toHaveClass(/is-selected/);
      await c.component.evaluate((el) => { el.items = el.items.map((p) => ({ ...p })).filter((p) => p.id !== 5); });
      await expect(row(c, 2)).toHaveClass(/is-selected/);
      await c.component.evaluate((el) => { el.items = el.items.filter((p) => p.id !== 2); });
      expect(await c.component.evaluate((el) => el.selected)).toEqual([]);
   });

   test('single: one at a time', async ({ mount }) => {
      const c = await mount('DataList', { ...BASE, selection: 'single' });
      await wide(c);
      await row(c, 1).locator('.slice-data-list__check').check();
      await row(c, 3).locator('.slice-data-list__check').check();
      expect(await c.component.evaluate((el) => el.selected)).toEqual([3]);
   });

   test('actions: buttons on the row and a menu, with hidden and disabled per item', async ({ mount, page }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => {
         el._ran = [];
         el.actions = [
            { label: 'Edit', icon: 'edit', inline: true, onClick: ({ item }) => el._ran.push(`edit ${item.id}`) },
            { label: 'Activate', hidden: (p) => p.active, onClick: ({ item }) => el._ran.push(`activate ${item.id}`) },
            { label: 'Delete', danger: true, disabled: (p) => p.role === 'Admin', onClick: ({ item }) => el._ran.push(`delete ${item.id}`) },
         ];
      });
      await row(c, 2).getByRole('button', { name: 'Edit' }).click();
      await row(c, 3).locator('slice-dropdown button').first().click();
      await expect(page.getByRole('menuitem', { name: 'Activate' })).toBeVisible();
      await page.getByRole('menuitem', { name: 'Activate' }).click();
      await row(c, 2).locator('slice-dropdown button').first().click();
      await expect(page.getByRole('menuitem', { name: 'Activate' })).toHaveCount(0);
      await page.keyboard.press('Escape');
      await row(c, 1).locator('slice-dropdown button').first().click();
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
      expect(await c.component.evaluate((el) => el._ran)).toEqual(['edit 2', 'activate 3']);
   });

   test('confirm: the action waits for a yes', async ({ mount, page }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => {
         el._ran = [];
         el.actions = [{ label: 'Delete', inline: true, danger: true, confirm: 'Delete this person?', onClick: ({ item }) => el._ran.push(item.id) }];
      });
      await row(c, 2).getByRole('button', { name: 'Delete' }).click();
      const dialog = page.getByRole('dialog', { name: 'Delete this person?' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await row(c, 2).getByRole('button', { name: 'Delete' }).click();
      // The first (cancelled) dialog may still be fading out.
      await page.getByRole('dialog', { name: 'Delete this person?' }).last().getByRole('button', { name: 'Delete' }).click();
      await expect.poll(() => c.component.evaluate((el) => el._ran)).toEqual([2]);
   });

   test('a narrow list moves the row buttons into the menu', async ({ mount, page }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => { el.actions = [{ label: 'Edit', inline: true, onClick: () => {} }]; });
      await expect(row(c, 1).getByRole('button', { name: 'Edit' })).toBeVisible();
      await c.component.evaluate((el) => { el.style.width = '360px'; });
      await expect(row(c, 1).getByRole('button', { name: 'Edit' })).toHaveCount(0);
      await row(c, 1).locator('slice-dropdown button').first().click();
      await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
   });
});

test.describe('DataList — create, edit, delete', () => {
   test('addItem: shows at once at the start; the saved version replaces it', async ({ mount }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => el.addItem({ id: 'tmp', name: 'Nuevo' }, { commit: () => new Promise((r) => setTimeout(() => r({ email: 'nuevo@acme.com' }), 100)) }));
      await expect(titles(c).first()).toHaveText('Nuevo');
      await expect(row(c, 'tmp').locator('.slice-data-list__description')).toHaveText('nuevo@acme.com');
      expect(await c.component.evaluate((el) => el.items.length)).toBe(6);
   });

   test('a failed save takes the change back and says so', async ({ mount }) => {
      const c = await mount('DataList', BASE, { spies: ['onError'] });
      await wide(c);
      const ok = await c.component.evaluate((el) => el.addItem({ id: 9, name: 'Never' }, { commit: () => Promise.reject(new Error('offline')) }));
      expect(ok).toBe(false);
      await expect(row(c, 9)).toHaveCount(0);
      await expect(c.locator('.slice-data-list__notice slice-alert')).toHaveAttribute('data-tone', 'danger');
      await expect(c.locator('.slice-data-list__notice .slice-alert__message')).toHaveText('The change could not be saved.');

      await c.component.evaluate((el) => el.updateItem(2, { name: 'Ana Changed' }, { commit: () => Promise.reject(new Error('offline')) }));
      await expect(row(c, 2).locator('.slice-data-list__title')).toHaveText('Ana López');
      expect((await c.eventArgs('onError')).map(([, info]) => info.type)).toEqual(['add', 'update']);
   });

   test('updateItem: merges the changes into that row only', async ({ mount }) => {
      const c = await mount('DataList', { ...BASE, meta: ['city'] });
      await wide(c);
      const before = await row(c, 1).elementHandle();
      await c.component.evaluate((el) => el.updateItem(2, (p) => ({ city: `${p.city} (moved)` })));
      await expect(row(c, 2).locator('.slice-data-list__meta-item')).toHaveText('Caracas (moved)');
      // The other rows were not rebuilt.
      expect(await row(c, 1).evaluate((el, old) => el === old, before)).toBe(true);
   });

   test('removeItem with undo: gone at once, back with Undo, and nothing is committed', async ({ mount }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => {
         el._committed = [];
         el._done = el.removeItem(3, { undo: true, commit: (items) => el._committed.push(items.map((i) => i.id)) });
      });
      await expect(row(c, 3)).toHaveCount(0);
      await expect(c.locator('.slice-data-list__notice .slice-alert__message')).toHaveText('“Luis Galué” removed');
      await c.locator('.slice-data-list__notice .slice-alert__actions button').click();
      await expect(row(c, 3)).toHaveCount(1);
      expect(await c.component.evaluate(async (el) => [await el._done, el._committed])).toEqual([false, []]);
      await expect(titles(c).nth(2)).toHaveText('Luis Galué');
   });

   test('removeItem with undo: when the time is over (or the bar is closed), it commits', async ({ mount }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => {
         el._committed = [];
         el._done = el.removeItem([1, 2], { undo: true, commit: (items) => { el._committed.push(items.map((i) => i.id)); } });
      });
      await expect(c.locator('.slice-data-list__notice .slice-alert__message')).toHaveText('2 removed');
      await c.locator('.slice-data-list__notice .slice-alert__close').click();
      expect(await c.component.evaluate(async (el) => [await el._done, el._committed])).toEqual([true, [[1, 2]]]);
      await expect(rows(c)).toHaveCount(3);
   });

   test('removeItem: a failed commit brings the items back where they were', async ({ mount }) => {
      const c = await mount('DataList', BASE);
      await wide(c);
      await c.component.evaluate((el) => el.removeItem(2, { commit: () => Promise.reject(new Error('no')) }));
      await expect(titles(c)).toHaveText(PEOPLE.map((p) => p.name));
   });

   test('context: the list follows a slice.context store, and writes go back to it', async ({ mount, page }) => {
      await page.evaluate(() => {
         if (slice.context.has('dl-test-people')) slice.context.destroy('dl-test-people');
         slice.context.create('dl-test-people', { items: [{ id: 1, name: 'Uno' }] });
      });
      const c = await mount('DataList', { context: 'dl-test-people', title: 'name' });
      await wide(c);
      await expect(titles(c)).toHaveText(['Uno']);
      // Someone else changes the store: the list follows.
      await page.evaluate(() => slice.context.setState('dl-test-people', (s) => ({ ...s, items: [...s.items, { id: 2, name: 'Dos' }] })));
      await expect(titles(c)).toHaveText(['Uno', 'Dos']);
      // The list changes it: the store has it.
      await c.component.evaluate((el) => el.removeItem(1));
      await expect(titles(c)).toHaveText(['Dos']);
      expect(await page.evaluate(() => slice.context.getState('dl-test-people').items.map((i) => i.name))).toEqual(['Dos']);
      await page.evaluate(() => slice.context.destroy('dl-test-people'));
   });
});

test.describe('DataList — pages, load more, infinite, server', () => {
   test('pages: a pager, the range on screen, and the next page', async ({ mount }) => {
      const c = await mount('DataList', { items: ORDERS, pagination: { pageSize: 20 } });
      await wide(c);
      await expect(rows(c)).toHaveCount(20);
      await expect(c.locator('.slice-data-list__summary')).toHaveText('1–20 of 45');
      await c.locator('.slice-data-list__pager [data-page="3"]').click();
      await expect(titles(c)).toHaveText(['Order #1041', 'Order #1042', 'Order #1043', 'Order #1044', 'Order #1045']);
      await expect(c.locator('.slice-data-list__summary')).toHaveText('41–45 of 45');
   });

   test('load more: each click shows the next slice, until the end', async ({ mount }) => {
      const c = await mount('DataList', { items: ORDERS, pagination: 'load-more', pageSize: 20 });
      await wide(c);
      await expect(rows(c)).toHaveCount(20);
      await c.locator('.slice-data-list__load-more').click();
      await expect(rows(c)).toHaveCount(40);
      await c.locator('.slice-data-list__load-more').click();
      await expect(rows(c)).toHaveCount(45);
      await expect(c.locator('.slice-data-list__load-more')).toHaveCount(0);
   });

   test('infinite: scrolling to the end shows more', async ({ mount }) => {
      const c = await mount('DataList', { items: ORDERS, pagination: 'infinite', pageSize: 15, maxHeight: '300px' });
      await wide(c);
      // It loads ahead (400px before the end), so a short box may hold two slices.
      await expect.poll(() => rows(c).count()).toBeGreaterThanOrEqual(15);
      expect(await rows(c).count()).toBeLessThan(45);
      for (let i = 0; i < 4; i++) {
         await c.locator('.slice-data-list__body').evaluate((el) => { el.scrollTop = el.scrollHeight; });
      }
      await expect.poll(() => rows(c).count()).toBe(45);
   });

   test('server: load() gets the query; a new search starts at page 1 and drops the old answer', async ({ mount }) => {
      const c = await mount('DataList', { searchable: true, pagination: { pageSize: 10 } });
      await wide(c);
      await c.component.evaluate((el) => {
         const all = Array.from({ length: 35 }, (_, i) => ({ id: i + 1, title: `${i % 2 ? 'Odd' : 'Even'} ${i + 1}` }));
         el._calls = [];
         el.load = async ({ page, pageSize, search, signal }) => {
            el._calls.push({ page, search });
            await new Promise((r) => setTimeout(r, search === 'slow' ? 400 : 40));
            if (signal.aborted) throw new DOMException('aborted', 'AbortError');
            const rows = all.filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()));
            return { items: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length };
         };
         el.refresh();
      });
      await expect(rows(c)).toHaveCount(10);
      await expect(c.locator('.slice-data-list__summary')).toHaveText('1–10 of 35');
      await c.locator('.slice-data-list__pager [aria-label="Page 2"]').click();
      await expect(titles(c).first()).toHaveText('Even 11');
      await c.component.evaluate((el) => { el.search = 'slow'; el.search = 'odd'; });
      await expect(c.locator('.slice-data-list__summary')).toHaveText('1–10 of 17');
      const calls = await c.component.evaluate((el) => el._calls.slice(-2));
      expect(calls).toEqual([{ page: 1, search: 'slow' }, { page: 1, search: 'odd' }]);
   });

   test('server: an error shows a retry that works', async ({ mount }) => {
      const c = await mount('DataList', {});
      await wide(c);
      await c.component.evaluate((el) => {
         el._fail = true;
         el.load = async () => {
            if (el._fail) { el._fail = false; throw new Error('down'); }
            return { items: [{ id: 1, title: 'Back' }], total: 1 };
         };
         el.refresh();
      });
      await expect(c.locator('.slice-data-list__state.is-error')).toContainText('The list could not be loaded.');
      await c.locator('.slice-data-list__state.is-error button').click();
      await expect(titles(c)).toHaveText(['Back']);
   });

   test('server + infinite: pages append, and a new search starts over', async ({ mount }) => {
      const c = await mount('DataList', { searchable: true, pagination: 'infinite', pageSize: 10, maxHeight: '260px' });
      await wide(c);
      await c.component.evaluate((el) => {
         el.load = async ({ page, pageSize, search }) => {
            await new Promise((r) => setTimeout(r, 30));
            const all = Array.from({ length: search ? 5 : 32 }, (_, i) => ({ id: `${search}-${i}`, title: `${search || 'Item'} ${i + 1}` }));
            return { items: all.slice((page - 1) * pageSize, page * pageSize), total: all.length };
         };
         el.pagination = 'infinite';
      });
      await expect.poll(() => rows(c).count()).toBeGreaterThanOrEqual(10);
      for (let i = 0; i < 5; i++) {
         await c.locator('.slice-data-list__body').evaluate((el) => { el.scrollTop = el.scrollHeight; });
         await expect.poll(() => rows(c).count()).toBeGreaterThanOrEqual(Math.min(32, 10 * (i + 1)));
      }
      await expect.poll(() => rows(c).count()).toBe(32);
      await c.component.evaluate((el) => { el.search = 'x'; });
      await expect.poll(() => rows(c).count()).toBe(5);
      await expect(titles(c).first()).toHaveText('x 1');
   });
});

test.describe('DataList — states, memory, keyboard, lifecycle', () => {
   test('loading shows placeholders; an empty list shows its empty state and action', async ({ mount }) => {
      const c = await mount('DataList', { items: [], loading: true });
      await wide(c);
      await expect(c.locator('.slice-data-list__skeleton')).toHaveCount(4);
      await expect(c.component).toHaveAttribute('aria-busy', '');
      await c.component.evaluate((el) => {
         el._created = 0;
         el.emptyState = { icon: 'users', title: 'No people yet', description: 'Invite your team.', action: { label: 'Invite', onClick: () => { el._created += 1; } } };
         el.loading = false;
      });
      await expect(c.locator('slice-emptystate')).toContainText('No people yet');
      await c.locator('slice-emptystate button').click();
      expect(await c.component.evaluate((el) => el._created)).toBe(1);
   });

   test('stateKey remembers the search and the view', async ({ mount, page }) => {
      await page.evaluate(() => localStorage.removeItem('slice-data-list:dl-spec'));
      const props = { ...BASE, searchable: true, stateKey: 'dl-spec' };
      const c = await mount('DataList', props);
      await wide(c);
      await c.locator('.slice-data-list__search input').fill('ana');
      await page.waitForTimeout(600);
      const again = await mount('DataList', props);
      await expect(again.locator('.slice-data-list__item .slice-data-list__title')).toHaveText(['Ana López']);
      await expect(again.locator('.slice-data-list__search input')).toHaveValue('ana');
      await page.evaluate(() => localStorage.removeItem('slice-data-list:dl-spec'));
   });

   test('keyboard: arrows move between items, Space selects', async ({ mount, page }) => {
      const c = await mount('DataList', { ...BASE, selection: 'multiple' });
      await wide(c);
      await c.component.evaluate((el) => { el.onItemClick = () => {}; });
      await row(c, 1).locator('.slice-data-list__title').focus();
      await page.keyboard.press('ArrowDown');
      await expect(row(c, 2).locator('.slice-data-list__title')).toBeFocused();
      await page.keyboard.press('End');
      await expect(row(c, 5).locator('.slice-data-list__title')).toBeFocused();
      await page.keyboard.press('Space');
      expect(await c.component.evaluate((el) => el.selected)).toEqual([5]);
   });

   test('destroying it destroys every component it built', async ({ mount, page }) => {
      const c = await mount('DataList', { ...BASE, avatar: { name: 'name' }, searchable: true, selection: 'multiple', pagination: { pageSize: 2 } });
      await wide(c);
      await c.component.evaluate((el) => {
         el.actions = [{ label: 'Edit', inline: true, onClick: () => {} }, { label: 'Delete', onClick: () => {} }];
      });
      await expect(c.locator('slice-avatar')).toHaveCount(2);
      await expect(c.locator('slice-pagination')).toHaveCount(1);
      const ids = await c.component.evaluate((el) => [...el.querySelectorAll('[slice-id]')].map((n) => n.getAttribute('slice-id')));
      expect(ids.length).toBeGreaterThanOrEqual(6);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      await page.waitForTimeout(100);
      expect(await page.evaluate((all) => all.filter((id) => !!slice.controller.getComponent(id)), ids)).toEqual([]);
   });
});

test.describe('DataList — detail', () => {
   const DETAIL = {
      fields: [
         { key: 'email', type: 'email', edit: true },
         { key: 'city', edit: true },
         { key: 'role', type: 'badge' },
         { key: 'active', type: 'boolean' },
      ],
   };
   const drawer = (page) => page.locator('dialog.slice-modal[open], .slice-modal dialog[open]').last();
   const field = (page, key) => page.locator(`slice-description-list .slice-description-list__field[data-key="${key}"]`);

   test('opening an item shows the whole record in a drawer', async ({ mount, page }) => {
      const c = await mount('DataList', { ...BASE, detail: DETAIL });
      await expect(rows(c).nth(1).locator('button.slice-data-list__title')).toHaveText('Ana López');
      await rows(c).nth(1).locator('.slice-data-list__title').click();
      await expect(page.locator('slice-description-list')).toHaveCount(1);
      await expect(page.locator('.slice-modal__title').last()).toHaveText('Ana López');
      await expect(field(page, 'email').locator('a')).toHaveText('ana@acme.com');
      await expect(field(page, 'role').locator('slice-badge')).toHaveText('Editor');
      expect(await c.component.evaluate((el) => el.detailKey)).toBe(2);
      await page.keyboard.press('Escape');
      await expect(page.locator('slice-description-list')).toHaveCount(0);
      expect(await c.component.evaluate((el) => el.detailKey)).toBe(null);
   });

   test('an edit saved in the detail updates the row, through detail.commit', async ({ mount, page }) => {
      const c = await mount('DataList', { ...BASE });
      await c.component.evaluate((el, d) => {
         el._saved = [];
         el.detail = { ...d, commit: async (change) => { el._saved.push([change.key, change.value]); } };
      }, DETAIL);
      await c.component.evaluate((el) => { el.openDetail(2); });
      await field(page, 'email').locator('[data-tool="pen"]').click();
      const input = field(page, 'email').locator('input');
      await input.fill('ana.l@acme.com');
      await input.press('Enter');
      await expect(field(page, 'email').locator('a')).toHaveText('ana.l@acme.com');
      await expect(rows(c).nth(1)).toContainText('ana.l@acme.com');
      expect(await c.component.evaluate((el) => el._saved)).toEqual([['email', 'ana.l@acme.com']]);
   });

   test('a failed commit puts the row back and the detail says why', async ({ mount, page }) => {
      const c = await mount('DataList', { ...BASE });
      await c.component.evaluate((el, d) => {
         el.detail = { ...d, commit: () => new Promise((_, reject) => setTimeout(() => reject(new Error('Locked.')), 100)) };
         el.openDetail(2);
      }, DETAIL);
      await field(page, 'city').locator('[data-tool="pen"]').click();
      const input = field(page, 'city').locator('input');
      await input.fill('Coro');
      await input.press('Enter');
      await expect(field(page, 'city').locator('.slice-description-list__error')).toHaveText('The change could not be saved. Locked.');
      await expect(input).toHaveValue('Coro');
      expect(await c.component.evaluate((el) => el.getItem(2).city)).toBe('Caracas');
   });

   test('the detail follows the list: a change elsewhere shows, a removal closes it', async ({ mount, page }) => {
      const c = await mount('DataList', { ...BASE, detail: DETAIL });
      await c.component.evaluate((el) => { el.openDetail(3); });
      await expect(field(page, 'city')).toContainText('Valencia');
      await c.component.evaluate((el) => el.updateItem(3, { city: 'Coro', name: 'Luis G.' }));
      await expect(field(page, 'city')).toContainText('Coro');
      await expect(page.locator('.slice-modal__title').last()).toHaveText('Luis G.');
      await c.component.evaluate((el) => el.removeItem(3));
      await expect(page.locator('slice-description-list')).toHaveCount(0);
   });

   test('destroying the list closes its detail and destroys what it built', async ({ mount, page }) => {
      const c = await mount('DataList', { ...BASE, detail: DETAIL });
      await c.component.evaluate((el) => { el.openDetail(1); });
      await expect(page.locator('slice-description-list')).toHaveCount(1);
      await page.waitForTimeout(300);
      const id = await page.locator('slice-description-list').evaluate((el) => el.sliceId);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      await page.waitForTimeout(600);
      expect(await page.evaluate((i) => !!slice.controller.getComponent(i), id)).toBe(false);
      await expect(page.locator('slice-description-list')).toHaveCount(0);
   });
});
