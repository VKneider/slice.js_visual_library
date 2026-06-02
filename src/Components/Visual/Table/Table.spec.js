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
