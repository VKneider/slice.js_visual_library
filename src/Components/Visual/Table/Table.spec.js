import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Table renders `headers` as <th scope="col"> and `rows` (array of cell arrays)
// as <td>. Each cell is rendered SAFELY by default (textContent); a cell may
// opt into trusted raw HTML via { html: '<...>' }. Each <td> gets a
// data-label from the header at its column index.

const HEADERS = ['Name', 'Role'];
const ROWS = [
   ['Ada', 'Engineer'],
   ['Linus', 'Maintainer'],
];

test.describe('Table', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Table', { headers: HEADERS, rows: ROWS });
      await expect(c.component).toBeVisible();
      await expect(c.locator('table.table')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders one header cell per header value', async ({ mount }) => {
      const c = await mount('Table', { headers: HEADERS, rows: ROWS });
      await expect(c.locator('.table_head th')).toHaveCount(2);
      await expect(c.locator('.table_head th').nth(0)).toHaveText('Name');
      await expect(c.locator('.table_head th').nth(1)).toHaveText('Role');
   });

   test('renders one body row per data row with text cells', async ({ mount }) => {
      const c = await mount('Table', { headers: HEADERS, rows: ROWS });
      await expect(c.locator('.table_body tr')).toHaveCount(2);
      const firstRowCells = c.locator('.table_body tr').nth(0).locator('td');
      await expect(firstRowCells).toHaveCount(2);
      await expect(firstRowCells.nth(0)).toHaveText('Ada');
      await expect(firstRowCells.nth(1)).toHaveText('Engineer');
   });

   test('cells carry a data-label matching their column header', async ({ mount }) => {
      const c = await mount('Table', { headers: HEADERS, rows: ROWS });
      const cells = c.locator('.table_body tr').nth(0).locator('td');
      await expect(cells.nth(0)).toHaveAttribute('data-label', 'Name');
      await expect(cells.nth(1)).toHaveAttribute('data-label', 'Role');
   });

   test('a11y: header cells expose scope="col"', async ({ mount }) => {
      const c = await mount('Table', { headers: HEADERS, rows: ROWS });
      await expect(c.locator('.table_head th').nth(0)).toHaveAttribute('scope', 'col');
      await expect(c.locator('.table_head th').nth(1)).toHaveAttribute('scope', 'col');
   });

   test('plain-string cells are escaped (no XSS injection)', async ({ mount }) => {
      const c = await mount('Table', {
         headers: ['Val'],
         rows: [['<b>bold</b>']],
      });
      // Rendered as text, so no real <b> element is created.
      await expect(c.locator('.table_body td').nth(0)).toHaveText('<b>bold</b>');
      expect(await c.locator('.table_body td b').count()).toBe(0);
   });

   test('{ html } cells opt into trusted raw HTML', async ({ mount }) => {
      const c = await mount('Table', {
         headers: ['Val'],
         rows: [[{ html: '<b>bold</b>' }]],
      });
      await expect(c.locator('.table_body td b')).toHaveText('bold');
   });

   test('empty data renders no header/body rows', async ({ mount }) => {
      const c = await mount('Table', { headers: [], rows: [] });
      await expect(c.locator('.table_head th')).toHaveCount(0);
      await expect(c.locator('.table_body tr')).toHaveCount(0);
   });

   test('visual: simple two-column table @visual', async ({ mount }) => {
      const c = await mount('Table', { headers: HEADERS, rows: ROWS });
      await expect(c.component).toHaveScreenshot('table-basic.png');
   });
});

const COLS = [
   { key: 'name', label: 'Name', sortable: true },
   { key: 'age', label: 'Age', sortable: true },
];
const PEOPLE = [
   { name: 'Charlie', age: 30 },
   { name: 'Alice', age: 25 },
   { name: 'Bob', age: 35 },
];
const many = (n) => Array.from({ length: n }, (_, i) => ({ name: `p${String(i + 1).padStart(2, '0')}`, age: i + 1 }));
const firstCell = (c) => c.locator('.table_body tr').nth(0).locator('td').nth(0);

test.describe('Table — sorting', () => {
   test('clicking a sortable header cycles asc → desc → unsorted', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: PEOPLE });
      const nameHeader = c.locator('.table_head th[data-sort-key="name"]');

      await nameHeader.click();
      await expect(firstCell(c)).toHaveText('Alice');
      await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      await nameHeader.click();
      await expect(firstCell(c)).toHaveText('Charlie');
      await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

      await nameHeader.click();
      await expect(firstCell(c)).toHaveText('Charlie'); // back to original order
      await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
   });

   test('non-sortable headers do not get a sort affordance', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name', sortable: false }],
         rows: PEOPLE,
      });
      await expect(c.locator('.table_head th[data-sort-key]')).toHaveCount(0);
   });

   test('onSortChange fires with the new sort state', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: PEOPLE }, { spies: ['onSortChange'] });
      await c.locator('.table_head th[data-sort-key="age"]').click();
      await expect(async () => {
         expect(await c.eventArgs('onSortChange')).toEqual([[{ key: 'age', direction: 'asc' }]]);
      }).toPass({ timeout: 3000 });
   });

   test('defaultSort sorts on first render', async ({ mount }) => {
      const c = await mount('Table', {
         columns: COLS,
         rows: PEOPLE,
         defaultSort: { key: 'age', direction: 'desc' },
      });
      await expect(firstCell(c)).toHaveText('Bob'); // age 35 first
   });
});

test.describe('Table — pagination', () => {
   test('renders only one page of rows and a pager', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: many(25), pagination: { pageSize: 10 } });
      await expect(c.locator('.table_body tr')).toHaveCount(10);
      await expect(c.locator('.slice-pagination')).toBeVisible();
   });

   test('navigating pages swaps the visible rows', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: many(25), pagination: { pageSize: 10 } });
      await expect(firstCell(c)).toHaveText('p01');
      await c.locator('.slice-pagination__item[aria-label="Page 2"]').click();
      await expect(firstCell(c)).toHaveText('p11');
   });

   test('onPageChange fires with the new page', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: many(25), pagination: { pageSize: 10 } }, { spies: ['onPageChange'] });
      await c.locator('.slice-pagination__item[aria-label="Page 3"]').click();
      await expect(async () => {
         expect(await c.eventArgs('onPageChange')).toEqual([[3]]);
      }).toPass({ timeout: 3000 });
   });

   test('sorting resets to the first page', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: many(25), pagination: { pageSize: 10 } });
      await c.locator('.slice-pagination__item[data-page="3"]').click();
      await c.locator('.table_head th[data-sort-key="name"]').click();
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('1');
   });
});

test.describe('Table — columns API & empty state', () => {
   test('object rows render by column key with custom render', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [
            { key: 'name', label: 'Name' },
            { key: 'age', label: 'Age', render: (row) => `${row.age}y` },
         ],
         rows: PEOPLE,
      });
      const cells = c.locator('.table_body tr').nth(0).locator('td');
      await expect(cells.nth(0)).toHaveText('Charlie');
      await expect(cells.nth(1)).toHaveText('30y');
   });

   test('shows the empty message when columns exist but there are no rows', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: [], emptyMessage: 'Nothing here' });
      await expect(c.locator('.table_empty')).toHaveText('Nothing here');
   });
});

test.describe('Table — remote data source', () => {
   const remoteProps = {
      columns: COLS,
      rows: many(10), // already "page 1" from the server
      pagination: { pageSize: 10 },
      dataSource: 'remote',
      totalItems: 25,
   };

   test('renders the given page as-is and pages from totalItems', async ({ mount }) => {
      const c = await mount('Table', remoteProps);
      await expect(c.locator('.table_body tr')).toHaveCount(10);
      // totalItems 25 / pageSize 10 => 3 pages, so a "page 3" control exists.
      await expect(c.locator('.slice-pagination__item[data-page="3"]')).toHaveCount(1);
   });

   test('paging emits onPageChange without re-slicing locally', async ({ mount }) => {
      const c = await mount('Table', remoteProps, { spies: ['onPageChange'] });
      await expect(firstCell(c)).toHaveText('p01');
      await c.locator('.slice-pagination__item[aria-label="Page 2"]').click();
      await expect(async () => {
         expect(await c.eventArgs('onPageChange')).toEqual([[2]]);
      }).toPass({ timeout: 3000 });
      // Rows are unchanged: the consumer is responsible for supplying page 2.
      await expect(firstCell(c)).toHaveText('p01');
   });

   test('sorting emits onSortChange and resets the pager to page 1', async ({ mount }) => {
      const c = await mount('Table', remoteProps, { spies: ['onSortChange'] });
      await c.locator('.slice-pagination__item[aria-label="Page 2"]').click();
      await c.locator('.table_head th[data-sort-key="name"]').click();
      await expect(async () => {
         expect(await c.eventArgs('onSortChange')).toEqual([[{ key: 'name', direction: 'asc' }]]);
      }).toPass({ timeout: 3000 });
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('1');
   });
});

test.describe('Table — keyboard a11y & loading', () => {
   test('sortable headers are focusable and keyboard operable', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: PEOPLE });
      const nameHeader = c.locator('.table_head th[data-sort-key="name"]');
      await expect(nameHeader).toHaveAttribute('tabindex', '0');

      await nameHeader.focus();
      await nameHeader.press('Enter');
      await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      await expect(firstCell(c)).toHaveText('Alice');

      await nameHeader.press(' '); // Space sorts too
      await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
   });

   test('loading shows a busy overlay and sets aria-busy', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: PEOPLE, loading: true });
      await expect(c.locator('.table_loading')).toHaveClass(/table_loading--active/);
      await expect(c.locator('.table')).toHaveAttribute('aria-busy', 'true');
   });

   test('loading can be toggled off after mount', async ({ mount, page }) => {
      await mount('Table', { columns: COLS, rows: PEOPLE, loading: true });
      await page.evaluate(() => { window.__sliceMounted.loading = false; });
      await expect(page.locator('.table_loading')).not.toHaveClass(/table_loading--active/);
      await expect(page.locator('.table')).toHaveAttribute('aria-busy', 'false');
   });
});

test.describe('Table — reactive pagination', () => {
   test('pagination can be turned on, resized, and turned off without a rebuild', async ({ mount, page }) => {
      const c = await mount('Table', { columns: COLS, rows: many(25) });
      await expect(c.locator('.table_body tr')).toHaveCount(25);
      await expect(c.locator('.slice-pagination')).toHaveCount(0);

      // turn on with pageSize 10 → pager is lazily built
      await page.evaluate(() => { window.__sliceMounted.pagination = { pageSize: 10 }; });
      await expect(c.locator('.table_body tr')).toHaveCount(10);
      await expect(c.locator('.slice-pagination')).toBeVisible();

      // shrink the page size
      await page.evaluate(() => { window.__sliceMounted.pagination = { pageSize: 5 }; });
      await expect(c.locator('.table_body tr')).toHaveCount(5);

      // turn off → all rows, pager hidden (not destroyed)
      await page.evaluate(() => { window.__sliceMounted.pagination = false; });
      await expect(c.locator('.table_body tr')).toHaveCount(25);
      await expect(c.locator('.slice-pagination')).toBeHidden();
   });
});
