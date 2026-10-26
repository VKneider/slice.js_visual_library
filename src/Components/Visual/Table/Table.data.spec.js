import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Table as an app works with it: rows from a store or a server, add / change /
// remove with rollback and undo, and cells edited in place like a spreadsheet.
// Props with functions (load, commit) cannot cross into the page, so each test
// builds its table inside the page and finds it in the test root.

const PEOPLE = [
   { id: 1, name: 'Ana López', city: 'Caracas', role: 'admin', age: 34, active: true },
   { id: 2, name: 'Luis Galué', city: 'Maracaibo', role: 'editor', age: 41, active: false },
   { id: 3, name: 'María Ruiz', city: 'Valencia', role: 'viewer', age: 29, active: true },
];

const table = (page) => page.locator('[data-test-root] slice-table');
const rows = (page) => table(page).locator('tbody tr[data-row-key]');
const cell = (page, rowKey, column) => table(page).locator(`tr[data-row-key="${rowKey}"] td[data-column-index="${column}"]`);
const notice = (page) => table(page).locator('.table_notice slice-alert');

// Builds an editable table: name (text, required), city (text), role (select),
// age (number), active (checkbox). `extra` is merged into the props in the page.
async function editable(page, extra = 'null') {
   await page.evaluate(async ([people, extraSource]) => {
      const extra = (0, eval)(`(${extraSource})`) || {};
      const t = await slice.build('Table', {
         rows: people,
         rowKey: 'id',
         columns: [
            { key: 'name', label: 'Name', edit: { required: true } },
            { key: 'city', label: 'City', edit: true },
            { key: 'role', label: 'Role', edit: { options: [{ value: 'admin', label: 'Admin' }, { value: 'editor', label: 'Editor' }, { value: 'viewer', label: 'Viewer' }] } },
            { key: 'age', label: 'Age', edit: true },
            { key: 'active', label: 'Active', edit: true },
         ],
         ...extra,
      });
      t.style.width = '760px';
      document.querySelector('[data-test-root]').append(t);
   }, [PEOPLE, extra]);
   await expect(rows(page)).toHaveCount(3);
}

test.describe('Table — data sources', () => {
   test('context: the rows follow a slice.context store, and CRUD writes to it', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await h.page.evaluate(async (people) => {
         if (!slice.context.has('tablePeople')) slice.context.create('tablePeople', { items: people });
         const t = await slice.build('Table', { context: 'tablePeople', rowKey: 'id', columns: [{ key: 'name', label: 'Name' }, { key: 'city', label: 'City' }] });
         document.querySelector('[data-test-root]').append(t);
      }, PEOPLE);
      await expect(rows(h.page)).toHaveCount(3);
      await h.page.evaluate(() => slice.context.setState('tablePeople', (s) => ({ ...s, items: [...s.items, { id: 4, name: 'Sofía Rey', city: 'Coro' }] })));
      await expect(rows(h.page)).toHaveCount(4);
      await table(h.page).evaluate((t) => t.updateRow(1, { city: 'Mérida' }));
      expect(await h.page.evaluate(() => slice.context.getState('tablePeople').items[0].city)).toBe('Mérida');
      await expect(cell(h.page, 1, 1)).toHaveText('Mérida');
   });

   test('load: asks the server for each page, sort and search, with loading and Try again', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await h.page.evaluate(async () => {
         const all = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, name: `Person ${String(i + 1).padStart(2, '0')}` }));
         const root = document.querySelector('[data-test-root]');
         root.dataset.calls = '[]';
         let fail = true;
         const t = await slice.build('Table', {
            rowKey: 'id',
            searchable: true,
            pagination: { pageSize: 10 },
            columns: [{ key: 'id', label: 'Id', sortable: true }, { key: 'name', label: 'Name', sortable: true }],
            load: async ({ page, pageSize, search, sort }) => {
               await new Promise((r) => setTimeout(r, 60));
               const calls = JSON.parse(root.dataset.calls);
               calls.push({ page, search, sort: sort ? `${sort.key}:${sort.direction}` : '' });
               root.dataset.calls = JSON.stringify(calls);
               if (fail) { fail = false; throw new Error('offline'); }
               let list = all.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
               if (sort) list = [...list].sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * (sort.direction === 'asc' ? 1 : -1));
               return { items: list.slice((page - 1) * pageSize, page * pageSize), total: list.length };
            },
         });
         root.append(t);
      });
      const calls = () => h.page.evaluate(() => JSON.parse(document.querySelector('[data-test-root]').dataset.calls));
      await expect(table(h.page).locator('.table_empty--error')).toContainText('The rows could not be loaded.');
      await table(h.page).getByRole('button', { name: 'Try again' }).click();
      await expect(rows(h.page)).toHaveCount(10);
      await expect(cell(h.page, 1, 1)).toHaveText('Person 01');

      await table(h.page).locator('th[data-sort-key="id"]').click();
      await table(h.page).locator('th[data-sort-key="id"]').click();
      await expect(cell(h.page, 23, 1)).toHaveText('Person 23');
      await table(h.page).locator('slice-pagination').getByRole('button', { name: /^(Page )?2$/ }).first().click();
      await expect(cell(h.page, 13, 1)).toHaveText('Person 13');
      await table(h.page).locator('.table_search_input').fill('Person 2');
      await expect(rows(h.page)).toHaveCount(4);
      const log = await calls();
      expect(log[0]).toEqual({ page: 1, search: '', sort: '' });
      expect(log.some((c) => c.sort === 'id:desc' && c.page === 1)).toBe(true);
      expect(log.some((c) => c.sort === 'id:desc' && c.page === 2)).toBe(true);
      expect(log.at(-1)).toEqual({ page: 1, search: 'Person 2', sort: 'id:desc' });
   });
});

test.describe('Table — add, change, remove', () => {
   test('addRow shows the row at once; a failed commit takes it out and says so', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      expect(await table(h.page).evaluate((t) => t.addRow({ id: 9, name: 'New one', city: '', role: 'viewer', age: 20, active: false }))).toBe(true);
      await expect(rows(h.page).first()).toHaveAttribute('data-row-key', '9');
      await expect(rows(h.page).first()).toHaveClass(/table_row--new/);
      const ok = await table(h.page).evaluate((t) => t.addRow({ id: 10, name: 'Fails' }, { commit: () => Promise.reject(new Error('No room.')) }));
      expect(ok).toBe(false);
      await expect(table(h.page).locator('tr[data-row-key="10"]')).toHaveCount(0);
      await expect(notice(h.page)).toHaveText(/The change could not be saved\. No room\./);
      await expect(notice(h.page)).toHaveAttribute('data-tone', 'danger');
   });

   test('updateRow merges changes; a failed commit puts the row back', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await table(h.page).evaluate((t) => t.updateRow(2, { city: 'Coro' }));
      await expect(cell(h.page, 2, 1)).toHaveText('Coro');
      const ok = await table(h.page).evaluate((t) => t.updateRow(2, { city: 'Nope' }, { commit: () => Promise.reject(new Error('x')) }));
      expect(ok).toBe(false);
      await expect(cell(h.page, 2, 1)).toHaveText('Coro');
   });

   test('removeRow with undo: the row leaves, Undo brings it back where it was', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      const result = table(h.page).evaluate((t) => t.removeRow(2, { undo: true, commit: () => { t.dataset.committed = 'yes'; } }));
      await expect(rows(h.page)).toHaveCount(2);
      await expect(notice(h.page)).toContainText('Row removed');
      await notice(h.page).getByRole('button', { name: 'Undo' }).click();
      expect(await result).toBe(false);
      await expect(rows(h.page)).toHaveCount(3);
      await expect(rows(h.page).nth(1)).toHaveAttribute('data-row-key', '2');
      expect(await table(h.page).evaluate((t) => t.dataset.committed)).toBeUndefined();
   });

   test('removeRow: closing the bar makes it final and commits', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      const result = table(h.page).evaluate((t) => t.removeRow([1, 3], { undo: true, commit: (gone) => { t.dataset.committed = gone.map((r) => r.id).join(','); } }));
      await expect(notice(h.page)).toContainText('2 rows removed');
      await notice(h.page).getByRole('button', { name: 'Dismiss' }).click();
      expect(await result).toBe(true);
      expect(await table(h.page).evaluate((t) => t.dataset.committed)).toBe('1,3');
      await expect(rows(h.page)).toHaveCount(1);
   });
});

test.describe('Table — editing cells', () => {
   test('an editable table is a grid with one tab stop; the arrows move through cells', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await expect(table(h.page).locator('table')).toHaveAttribute('role', 'grid');
      await expect(table(h.page).locator('td[data-cell][tabindex="0"]')).toHaveCount(1);
      await expect(cell(h.page, 1, 0)).toHaveAttribute('tabindex', '0');
      await cell(h.page, 1, 0).focus();
      await h.page.keyboard.press('ArrowRight');
      await expect(cell(h.page, 1, 1)).toBeFocused();
      await h.page.keyboard.press('ArrowDown');
      await expect(cell(h.page, 2, 1)).toBeFocused();
      await h.page.keyboard.press('End');
      await expect(cell(h.page, 2, 4)).toBeFocused();
      await h.page.keyboard.press('Control+Home');
      await expect(cell(h.page, 1, 0)).toBeFocused();
      await expect(table(h.page).locator('td[data-cell][tabindex="0"]')).toHaveCount(1);
   });

   test('a select column shows the option label', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await expect(cell(h.page, 1, 2)).toHaveText('Admin');
   });

   test('typing replaces the value; Enter saves through commit and goes down', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page, `{ commit: async ({ key, value, previous, row }) => {
         const t = document.querySelector('[data-test-root] slice-table');
         t.dataset.saved = JSON.stringify([key, value, previous, row.id]);
      }, onCellChange: ({ key, value }) => { document.querySelector('[data-test-root] slice-table').dataset.changed = key + '=' + value; } }`);
      await cell(h.page, 1, 1).click();
      await h.page.keyboard.type('Valera');
      await expect(cell(h.page, 1, 1).locator('input')).toHaveValue('Valera');
      await h.page.keyboard.press('Enter');
      await expect(cell(h.page, 1, 1)).toHaveText('Valera');
      await expect(cell(h.page, 2, 1)).toBeFocused();
      expect(JSON.parse(await table(h.page).getAttribute('data-saved'))).toEqual(['city', 'Valera', 'Caracas', 1]);
      expect(await table(h.page).getAttribute('data-changed')).toBe('city=Valera');
      expect(await table(h.page).evaluate((t) => t.getRow(1).city)).toBe('Valera');
   });

   test('numbers are saved as numbers; Tab saves and moves to the next cell', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await cell(h.page, 2, 3).dblclick();
      await cell(h.page, 2, 3).locator('input').fill('42');
      await h.page.keyboard.press('Tab');
      await expect(cell(h.page, 2, 4)).toBeFocused();
      expect(await table(h.page).evaluate((t) => t.getRow(2).age)).toBe(42);
   });

   test('F2 edits with the caret at the end; Escape cancels; a click elsewhere saves', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await cell(h.page, 3, 0).click();
      await h.page.keyboard.press('F2');
      const input = cell(h.page, 3, 0).locator('input');
      await expect(input).toBeFocused();
      await h.page.keyboard.type(' R.');
      await expect(input).toHaveValue('María Ruiz R.');
      await h.page.keyboard.press('Escape');
      await expect(cell(h.page, 3, 0)).toHaveText('María Ruiz');
      await expect(cell(h.page, 3, 0)).toBeFocused();

      await cell(h.page, 3, 1).dblclick();
      await cell(h.page, 3, 1).locator('input').fill('Coro');
      await cell(h.page, 1, 0).click();
      await expect(cell(h.page, 3, 1)).toHaveText('Coro');
      await expect(cell(h.page, 1, 0)).toBeFocused();
   });

   test('a failed commit draws the old value back, in red, and says why', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page, `{ commit: () => new Promise((_, reject) => setTimeout(() => reject(new Error('Locked.')), 150)) }`);
      await cell(h.page, 1, 1).click();
      await h.page.keyboard.type('Coro');
      await h.page.keyboard.press('Enter');
      await expect(cell(h.page, 1, 1)).toHaveText('Coro');
      await expect(cell(h.page, 1, 1)).toHaveClass(/table_cell--saving/);
      await expect(cell(h.page, 1, 1)).toHaveClass(/table_cell--error/);
      await expect(cell(h.page, 1, 1)).toHaveText('Caracas');
      await expect(cell(h.page, 1, 1)).toHaveAttribute('title', 'The change could not be saved. Locked.');
      await expect(notice(h.page)).toContainText('Locked.');
      expect(await table(h.page).evaluate((t) => t.getRow(1).city)).toBe('Caracas');
   });

   test('a checkbox flips with Space and saves; Delete empties a cell, not a required one', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await cell(h.page, 2, 4).click();
      await h.page.keyboard.press('Space');
      await expect.poll(() => table(h.page).evaluate((t) => t.getRow(2).active)).toBe(true);
      await expect(cell(h.page, 2, 4).locator('input')).toBeChecked();

      await cell(h.page, 2, 1).click();
      await h.page.keyboard.press('Delete');
      await expect.poll(() => table(h.page).evaluate((t) => t.getRow(2).city)).toBe(null);
      await cell(h.page, 2, 0).click();
      await h.page.keyboard.press('Delete');
      expect(await table(h.page).evaluate((t) => t.getRow(2).name)).toBe('Luis Galué');
   });

   test('a select saves the moment a choice is made', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await cell(h.page, 3, 2).click();
      await h.page.keyboard.press('Enter');
      const select = cell(h.page, 3, 2).locator('slice-select');
      await expect(select).toHaveCount(1);
      await select.evaluate((el) => { el.selected = 'editor'; el.onChange?.call(el, el.selected, el.selectedOptions); });
      await expect.poll(() => table(h.page).evaluate((t) => t.getRow(3).role)).toBe('editor');
      await expect(cell(h.page, 3, 2)).toHaveText('Editor');
   });

   test('Ctrl+C copies the active cell', async ({ mountHtml, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await cell(h.page, 1, 0).click();
      await h.page.keyboard.press('Control+c');
      expect(await h.page.evaluate(() => navigator.clipboard.readText())).toBe('Ana López');
   });

   test('destroying the table destroys an open editor too', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await editable(h.page);
      await cell(h.page, 1, 2).dblclick();
      await expect(cell(h.page, 1, 2).locator('slice-select')).toHaveCount(1);
      const id = await cell(h.page, 1, 2).locator('slice-select').evaluate((el) => el.sliceId);
      await table(h.page).evaluate((t) => slice.controller.destroyComponent(t));
      expect(await h.page.evaluate((i) => !!slice.controller.getComponent(i), id)).toBe(false);
   });
});
