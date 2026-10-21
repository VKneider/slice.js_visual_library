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

// A re-render replaces `$head`/`$body` wholesale, so the table has to own what
// those containers held. A `render(row)` callback (or a fresh node in `rows`)
// builds a component per render; without `_releaseChildren` every sort, page
// change or `rows` update orphaned the previous one in `activeComponents`.
// A node the NEXT render re-appends is kept, because re-passing the same node is
// a legitimate pattern (the `viewBtn` example in markdown/table.md).
test.describe('Table — cell component ownership', () => {
   const MOUNT_PROPS = { headers: ['Name', 'Action'], rows: [['a', '']] };

   test('a component evicted by the next render is destroyed (no leak)', async ({ mount, page }) => {
      await mount('Table', MOUNT_PROPS);

      const result = await page.evaluate(async () => {
         const controller = window.slice.controller;
         const table = window.__sliceMounted;

         const first = await window.slice.build('Button', { value: 'Open' });
         table.rows = [['a', first]];
         const firstId = first.sliceId;

         const second = await window.slice.build('Button', { value: 'Rename' });
         table.rows = [['b', second]];

         return {
            firstAlive: controller.activeComponents.has(firstId),
            secondAlive: controller.activeComponents.has(second.sliceId),
            rendered: table.querySelectorAll('.table_body slice-button').length,
         };
      });

      expect(result.firstAlive).toBe(false);
      expect(result.secondAlive).toBe(true);
      expect(result.rendered).toBe(1);
   });

   test('a node re-appended by the next render survives (consumer keeps it)', async ({ mount, page }) => {
      await mount('Table', MOUNT_PROPS);

      const result = await page.evaluate(async () => {
         const controller = window.slice.controller;
         const table = window.__sliceMounted;

         const button = await window.slice.build('Button', { value: 'Keep' });
         table.rows = [['a', button]];
         const id = button.sliceId;

         table.rows = [['a', button]]; // the very same node again

         return {
            alive: controller.activeComponents.has(id),
            rendered: table.querySelectorAll('.table_body slice-button').length,
         };
      });

      expect(result.alive).toBe(true);
      expect(result.rendered).toBe(1);
   });

   test('destroying the table also destroys the components held in its cells', async ({ mount, page }) => {
      await mount('Table', MOUNT_PROPS);

      const result = await page.evaluate(async () => {
         const controller = window.slice.controller;
         const table = window.__sliceMounted;

         // Appended after init(), so it is NOT in the table's childrenIndex and
         // the destroy cascade cannot reach it.
         const button = await window.slice.build('Button', { value: 'Gone' });
         table.rows = [['a', button]];
         const id = button.sliceId;

         controller.destroyComponent(table);
         return { alive: controller.activeComponents.has(id) };
      });

      expect(result.alive).toBe(false);
   });
});

test.describe('Table — headerVariant', () => {
   const ONE = { headers: ['A'], rows: [['1']] };

   /** The theme's --primary-color resolved to a concrete rgb() by the engine. */
   const resolvedPrimary = (locator) =>
      locator.evaluate((el) => {
         const probe = document.createElement('span');
         probe.style.color = getComputedStyle(el).getPropertyValue('--primary-color').trim();
         el.appendChild(probe);
         const color = getComputedStyle(probe).color;
         probe.remove();
         return color;
      });

   test('defaults to the tinted header (a tint, not the primary fill)', async ({ mount }) => {
      const c = await mount('Table', ONE);
      await expect(c.component).toHaveClass(/table--header-tinted/);

      const th = c.locator('.table_head th').first();
      expect(await th.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
         await resolvedPrimary(th)
      );
      expect(await th.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase');
   });

   test('solid reproduces the legacy look exactly (the escape hatch)', async ({ mount }) => {
      const c = await mount('Table', { ...ONE, headerVariant: 'solid' });
      await expect(c.component).toHaveClass(/table--header-solid/);
      await expect(c.component).not.toHaveClass(/table--header-tinted/);

      const th = c.locator('.table_head th').first();
      expect(await th.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await resolvedPrimary(th));
      // Sentence case and the inherited size were part of the look.
      expect(await th.evaluate((el) => getComputedStyle(el).textTransform)).toBe('none');
   });

   test('none drops the fill but keeps the label treatment', async ({ mount }) => {
      const c = await mount('Table', { ...ONE, headerVariant: 'none' });
      await expect(c.component).toHaveClass(/table--header-none/);
      const th = c.locator('.table_head th').first();
      expect(await th.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
      expect(await th.evaluate((el) => getComputedStyle(el).textTransform)).toBe('uppercase');
   });

   test('an unknown variant falls back to the declared default', async ({ mount }) => {
      const c = await mount('Table', { ...ONE, headerVariant: 'neon' });
      await expect(c.component).toHaveClass(/table--header-tinted/);
      await expect(c.component).not.toHaveClass(/table--header-neon/);
   });

   test('variant is reactive and the class swap is idempotent', async ({ mount, page }) => {
      await mount('Table', ONE);
      await page.evaluate(() => { window.__sliceMounted.headerVariant = 'solid'; });
      await expect(page.locator('slice-table')).toHaveClass(/table--header-solid/);
      await page.evaluate(() => { window.__sliceMounted.headerVariant = 'solid'; });
      expect(await page.locator('slice-table').getAttribute('class')).toBe('table--header-solid');
   });
});

test.describe('Table — cell alignment', () => {
   test('column align becomes a class, never an inline style', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name', align: 'right' }],
         rows: [{ name: 'x' }],
      });
      const td = c.locator('.table_body td').first();
      await expect(td).toHaveClass(/table_cell--right/);
      expect(await td.getAttribute('style')).toBeNull();
      await expect(c.locator('.table_head th').first()).toHaveClass(/table_cell--right/);
   });

   test('an unrecognised align value is ignored', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name', align: 'justify' }],
         rows: [{ name: 'x' }],
      });
      await expect(c.locator('.table_body td').first()).not.toHaveClass(/table_cell--/);
   });

   test('numeric cells right-align with tabular figures', async ({ mount }) => {
      const c = await mount('Table', { columns: [{ key: 'n', label: 'N' }], rows: [{ n: 42 }] });
      const td = c.locator('.table_body td').first();
      await expect(td).toHaveClass(/table_cell--num/);
      const css = await td.evaluate((el) => {
         const s = getComputedStyle(el);
         return { align: s.textAlign, numeric: s.fontVariantNumeric };
      });
      expect(css.align).toBe('right');
      expect(css.numeric).toContain('tabular-nums');
   });

   test('only real numbers auto-align, not strings that look like them', async ({ mount }) => {
      const c = await mount('Table', { columns: [{ key: 'n', label: 'N' }], rows: [{ n: '42' }] });
      await expect(c.locator('.table_body td').first()).not.toHaveClass(/table_cell--num/);
   });

   test('a numeric column right-aligns its header too', async ({ mount }) => {
      const c = await mount('Table', { columns: [{ key: 'n', label: 'N' }], rows: [{ n: 1 }, { n: 2 }] });
      await expect(c.locator('.table_head th').first()).toHaveClass(/table_cell--num/);
   });

   test('a mixed column is left alone rather than aligned cell by cell', async ({ mount }) => {
      const c = await mount('Table', { columns: [{ key: 'n', label: 'N' }], rows: [{ n: 1 }, { n: 'n/a' }] });
      await expect(c.locator('.table_body td').nth(0)).not.toHaveClass(/table_cell--num/);
      await expect(c.locator('.table_body td').nth(1)).not.toHaveClass(/table_cell--num/);
   });

   test('a column that declares its own align is not overridden by the numeric rule', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'n', label: 'N', align: 'center' }],
         rows: [{ n: 42 }],
      });
      const td = c.locator('.table_body td').first();
      await expect(td).toHaveClass(/table_cell--center/);
      await expect(td).not.toHaveClass(/table_cell--num/);
   });

   test('mobile cards drop the column alignment', async ({ mount, page }) => {
      await page.setViewportSize({ width: 480, height: 800 });
      await mount('Table', {
         columns: [{ key: 'n', label: 'N', align: 'right' }],
         rows: [{ n: 1 }],
      });
      await expect(page.locator('.table_body td').first()).toHaveClass(/table_cell--right/);
      expect(
         await page.locator('.table_body td').first().evaluate((el) => getComputedStyle(el).textAlign)
      ).toBe('left');
   });
});

test.describe('Table — sort affordance', () => {
   test('the indicator is an empty slot whose width never changes', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: PEOPLE });
      const header = c.locator('.table_head th[data-sort-key="name"]');
      const indicator = header.locator('.table_sort_indicator');

      // No glyph text: the chevron is drawn in CSS.
      await expect(indicator).toHaveText('');

      const widths = [await indicator.evaluate((el) => el.getBoundingClientRect().width)];
      await header.click(); // asc
      widths.push(await indicator.evaluate((el) => el.getBoundingClientRect().width));
      await header.click(); // desc
      widths.push(await indicator.evaluate((el) => el.getBoundingClientRect().width));
      expect(new Set(widths).size).toBe(1);

      // The label itself must not move either.
      const labelLefts = [await header.evaluate((el) => el.getBoundingClientRect().left)];
      await header.click(); // back to unsorted
      labelLefts.push(await header.evaluate((el) => el.getBoundingClientRect().left));
      expect(new Set(labelLefts).size).toBe(1);
   });

   test('only the active column shows a chevron; the others stay quiet', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS, rows: PEOPLE });
      const nameHeader = c.locator('.table_head th[data-sort-key="name"]');
      const nameIndicator = nameHeader.locator('.table_sort_indicator');
      const ageIndicator = c.locator('.table_head th[data-sort-key="age"] .table_sort_indicator');

      expect(await ageIndicator.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');

      await nameHeader.click(); // asc
      await expect(nameIndicator).toHaveClass(/table_sort_indicator--asc/);
      expect(await nameIndicator.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
      await expect(ageIndicator).not.toHaveClass(/table_sort_indicator--asc/);

      await nameHeader.click(); // desc
      await expect(nameIndicator).toHaveClass(/table_sort_indicator--desc/);
      await expect(nameIndicator).not.toHaveClass(/table_sort_indicator--asc/);
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

// ===================================================================== Super Table
// Search, typed filters, chips, selection, row identity, sticky layout and
// virtual scrolling. All opt-in: every test above runs without them.

const CREW = [
   { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, active: true, joined: '2024-03-10', role: 'admin' },
   { id: 2, name: 'Ana López', city: 'Caracas', age: 28, active: false, joined: '2023-11-02', role: 'editor' },
   { id: 3, name: 'Luis Galué', city: 'Maracaibo', age: 41, active: true, joined: '2025-01-20', role: 'viewer' },
   { id: 4, name: 'María Ruiz', city: 'Valencia', age: 52, active: true, joined: '2022-06-15', role: 'editor' },
   { id: 5, name: 'Pedro Díaz', city: 'Mérida', age: 19, active: false, joined: '2024-12-31', role: 'viewer' },
   { id: 6, name: 'Carla Soto', city: 'Caracas', age: 37, active: true, joined: '2024-07-01', role: 'admin' },
];
const CREW_COLS = [
   { key: 'name', label: 'Name', sortable: true },
   { key: 'city', label: 'City' },
   { key: 'age', label: 'Age', sortable: true },
   { key: 'active', label: 'Active' },
   { key: 'joined', label: 'Joined' },
   { key: 'role', label: 'Role' },
];
const names = (c) => c.locator('tbody tr td[data-label="Name"]').allTextContents();

test.describe('Table — search', () => {
   test('the toolbar only appears when asked for', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW });
      await expect(c.locator('.table_toolbar')).toBeHidden();
   });

   test('searching narrows the rows, ignoring case and accents', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, searchable: true }, { spies: ['onFilterChange'] });
      await c.locator('.table_search_input').fill('maria');
      await expect.poll(() => names(c)).toEqual(['María Ruiz']);
      await expect(c.locator('.table_status')).toHaveText('1 of 6 rows');
      await expect.poll(() => c.events('onFilterChange')).toBeGreaterThan(0);
      expect((await c.eventArgs('onFilterChange')).at(-1)).toEqual([{ search: 'maria', filters: [] }]);
   });

   test('several terms must all match, in any column', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, searchable: true });
      await c.locator('.table_search_input').fill('caracas soto');
      await expect.poll(() => names(c)).toEqual(['Carla Soto']);
   });

   test('a search chip appears and removing it restores the rows', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, searchable: true });
      await c.locator('.table_search_input').fill('perez');
      await expect(c.locator('.table_chip')).toHaveText(/Search: “perez”/);
      await c.locator('.table_chip_remove').click();
      await expect.poll(() => names(c)).toHaveLength(6);
      await expect(c.locator('.table_search_input')).toHaveValue('');
      await expect(c.locator('.table_chips')).toBeHidden();
   });

   test('Escape clears the search box', async ({ mount, page }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, searchable: true });
      await c.locator('.table_search_input').fill('ana');
      await expect.poll(() => names(c)).toEqual(['Ana López']);
      await page.keyboard.press('Escape');
      await expect.poll(() => names(c)).toHaveLength(6);
   });

   test('the search reads the data, not what `render` draws', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name' }, { key: 'active', label: 'Active', render: (r) => (r.active ? '✔' : '—') }],
         rows: CREW,
         searchable: true,
      });
      await c.locator('.table_search_input').fill('valencia');
      await expect.poll(() => c.locator('tbody tr td.table_empty').count()).toBe(1);
   });

   test('a column can opt out of the search', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name' }, { key: 'city', label: 'City', searchable: false }],
         rows: CREW,
         searchable: true,
      });
      await c.locator('.table_search_input').fill('caracas');
      await expect.poll(() => c.locator('td.table_empty').count()).toBe(1);
   });
});

test.describe('Table — filters', () => {
   const open = async (c) => {
      await c.locator('.table_filters_toggle').click();
      await expect(c.locator('.table_filter_panel')).toBeVisible();
   };
   const editor = (c, key) => c.locator(`.table_filter[data-filter-key="${key}"]`);

   test('the toggle opens a panel with one editor per column, typed from the data', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true });
      const toggle = c.locator('.table_filters_toggle');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await open(c);
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(editor(c, 'name')).toHaveClass(/table_filter--text/);
      await expect(editor(c, 'age')).toHaveClass(/table_filter--number/);
      await expect(editor(c, 'active')).toHaveClass(/table_filter--boolean/);
      await expect(editor(c, 'joined')).toHaveClass(/table_filter--date/);
      await expect(editor(c, 'role')).toHaveClass(/table_filter--select/);
      await expect(editor(c, 'role').locator('.table_filter_option')).toHaveText(['admin', 'editor', 'viewer']);
   });

   test('number: an operator and a value', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true });
      await open(c);
      await editor(c, 'age').locator('.table_filter_op').selectOption('gt');
      await editor(c, 'age').locator('input').first().fill('40');
      await expect.poll(() => names(c)).toEqual(['Luis Galué', 'María Ruiz']);
      await expect(c.locator('.table_chip_text')).toHaveText(['Age > 40']);
      await expect(c.locator('.table_filters_count')).toHaveText('1');
   });

   test('number: between shows two inputs, open-ended on either side', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true });
      await open(c);
      const ed = editor(c, 'age');
      await ed.locator('.table_filter_op').selectOption('between');
      const inputs = ed.locator('input');
      await expect(inputs.nth(1)).toBeVisible();
      await inputs.nth(0).fill('30');
      await inputs.nth(1).fill('40');
      await expect.poll(() => names(c)).toEqual(['José Pérez', 'Carla Soto']);
      await inputs.nth(1).fill('');
      await expect.poll(() => names(c)).toEqual(['José Pérez', 'Luis Galué', 'María Ruiz', 'Carla Soto']);
      await expect(c.locator('.table_chip_text')).toHaveText(['Age ≥ 30']);
   });

   test('boolean: yes / no / any', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true });
      await open(c);
      await editor(c, 'active').locator('select').selectOption('false');
      await expect.poll(() => names(c)).toEqual(['Ana López', 'Pedro Díaz']);
      await expect(c.locator('.table_chip_text')).toHaveText(['Active: No']);
      await editor(c, 'active').locator('select').selectOption('');
      await expect.poll(() => names(c)).toHaveLength(6);
   });

   test('date: between two days', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true });
      await open(c);
      const ed = editor(c, 'joined');
      await ed.locator('.table_filter_op').selectOption('between');
      await ed.locator('input').nth(0).fill('2024-01-01');
      await ed.locator('input').nth(1).fill('2024-12-31');
      await expect.poll(() => names(c)).toEqual(['José Pérez', 'Pedro Díaz', 'Carla Soto']);
   });

   test('select: several values, then "is none of"', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true });
      await open(c);
      const ed = editor(c, 'role');
      await ed.getByLabel('admin').check();
      await ed.getByLabel('viewer').check();
      await expect.poll(() => names(c)).toEqual(['José Pérez', 'Luis Galué', 'Pedro Díaz', 'Carla Soto']);
      await ed.locator('.table_filter_op').selectOption('notIn');
      await expect.poll(() => names(c)).toEqual(['Ana López', 'María Ruiz']);
      await expect(c.locator('.table_chip_text')).toHaveText(['Role is none of: admin, viewer']);
   });

   test('filters and search combine; the status counts the result', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true, searchable: true });
      await open(c);
      await editor(c, 'role').getByLabel('admin').check();
      await editor(c, 'active').locator('select').selectOption('true');
      await c.locator('.table_search_input').fill('soto');
      await expect.poll(() => names(c)).toEqual(['Carla Soto']);
      await expect(c.locator('.table_status')).toHaveText('1 of 6 rows');
      await expect(c.locator('.table_chip')).toHaveCount(3);
   });

   test('removing one chip removes only that filter and resets its editor', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true });
      await open(c);
      await editor(c, 'age').locator('.table_filter_op').selectOption('gte');
      await editor(c, 'age').locator('input').first().fill('30');
      await editor(c, 'active').locator('select').selectOption('true');
      await expect.poll(() => names(c)).toHaveLength(4);
      await c.component.locator('.table_chip', { hasText: 'Age' }).locator('.table_chip_remove').click();
      await expect.poll(() => names(c)).toHaveLength(4);
      await expect(c.locator('.table_chip_text')).toHaveText(['Active: Yes']);
      await expect(editor(c, 'age').locator('input').first()).toHaveValue('');
   });

   test('"Clear all" removes the search and every filter', async ({ mount }) => {
      const c = await mount('Table', {
         columns: CREW_COLS,
         rows: CREW,
         filterable: true,
         searchable: true,
         search: 'a',
         filters: [{ key: 'age', type: 'number', op: 'lt', value: 30 }],
      }, { spies: ['onFilterChange'] });
      // "a" is in both names (López, Díaz); both are under 30.
      await expect.poll(() => names(c)).toEqual(['Ana López', 'Pedro Díaz']);
      await c.locator('.table_chips_clear').click();
      await expect.poll(() => names(c)).toHaveLength(6);
      await expect(c.locator('.table_chips')).toBeHidden();
      expect((await c.eventArgs('onFilterChange')).at(-1)).toEqual([{ search: '', filters: [] }]);
   });

   test('filters/search given as props apply without firing onFilterChange', async ({ mount }) => {
      const c = await mount('Table', {
         columns: CREW_COLS,
         rows: CREW,
         filterable: true,
         filters: [{ key: 'city', type: 'select', value: ['Caracas'] }],
      }, { spies: ['onFilterChange'] });
      await expect.poll(() => names(c)).toEqual(['Ana López', 'Carla Soto']);
      expect(await c.events('onFilterChange')).toBe(0);
      const active = await c.component.evaluate((el) => el.filters);
      expect(active).toEqual([{ key: 'city', type: 'select', op: 'in', value: ['Caracas'] }]);
   });

   test('a filtered column header carries a marker', async ({ mount }) => {
      const c = await mount('Table', {
         columns: CREW_COLS,
         rows: CREW,
         filterable: true,
         filters: [{ key: 'age', type: 'number', op: 'gt', value: 1 }],
      });
      await expect(c.component.locator('th', { hasText: 'Age' })).toHaveClass(/table_head_cell--filtered/);
      await expect(c.component.locator('th', { hasText: 'Name' })).not.toHaveClass(/table_head_cell--filtered/);
   });

   test('no matches: a message and a button that clears the filters', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, searchable: true, search: 'zzz' });
      await expect(c.locator('td.table_empty')).toContainText('No rows match');
      await c.locator('.table_empty_clear').click();
      await expect.poll(() => names(c)).toHaveLength(6);
   });

   test('setFilter / clearFilters / getFilteredRows from code', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, filterable: true });
      const out = await c.component.evaluate((el) => {
         el.setFilter('role', { type: 'select', value: ['admin'] });
         const after = el.getFilteredRows().map((r) => r.id);
         el.clearFilters();
         return { after, cleared: el.getFilteredRows().length };
      });
      expect(out).toEqual({ after: [1, 6], cleared: 6 });
   });

   test('filter: false hides a column\'s editor; without filterable only declared ones show', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name', filter: false }, { key: 'age', label: 'Age', filter: 'number' }, { key: 'city', label: 'City' }],
         rows: CREW,
      });
      await c.locator('.table_filters_toggle').click();
      await expect(c.locator('.table_filter')).toHaveCount(1);
      await expect(c.locator('.table_filter')).toHaveAttribute('data-filter-key', 'age');
   });

   test('declared select options use their labels in the editor and the chip', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name' }, {
            key: 'role', label: 'Role',
            filter: { type: 'select', options: [{ value: 'admin', label: 'Administrador' }, { value: 'editor', label: 'Editor' }] },
         }],
         rows: CREW,
      });
      await c.locator('.table_filters_toggle').click();
      await c.component.getByLabel('Administrador').check();
      await expect(c.locator('.table_chip_text')).toHaveText(['Role is any of: Administrador']);
   });

   test('labels translate the UI', async ({ mount }) => {
      const c = await mount('Table', {
         columns: CREW_COLS,
         rows: CREW,
         searchable: true,
         filterable: true,
         labels: { filters: 'Filtros', searchPlaceholder: 'Buscar…', showing: '{shown} de {total}', operators: { gt: 'mayor que' } },
         filters: [{ key: 'age', type: 'number', op: 'gt', value: 40 }],
      });
      await expect(c.locator('.table_filters_toggle_label')).toHaveText('Filtros');
      await expect(c.locator('.table_search_input')).toHaveAttribute('placeholder', 'Buscar…');
      await expect(c.locator('.table_status')).toHaveText('2 de 6');
      await expect(c.locator('.table_chip_text')).toHaveText(['Age mayor que 40']);
   });

   test('remote mode emits filters without filtering the page locally', async ({ mount }) => {
      const c = await mount('Table', {
         columns: CREW_COLS,
         rows: CREW.slice(0, 3),
         dataSource: 'remote',
         totalItems: 60,
         pagination: { pageSize: 3 },
         searchable: true,
      }, { spies: ['onFilterChange'] });
      await c.locator('.table_search_input').fill('zzz');
      await expect.poll(() => c.events('onFilterChange')).toBe(1);
      await expect.poll(() => names(c)).toHaveLength(3);
   });
});

test.describe('Table — selection and rows', () => {
   test('multiple: row checkboxes, select-all and onSelectionChange(keys, rows)', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, rowKey: 'id', selection: 'multiple' }, { spies: ['onSelectionChange'] });
      await expect(c.locator('tbody .table_select_row')).toHaveCount(6);
      await c.locator('tbody .table_select_row').nth(1).check();
      await expect.poll(() => c.events('onSelectionChange')).toBe(1);
      const [keys, rows] = (await c.eventArgs('onSelectionChange')).at(-1);
      expect(keys).toEqual(['2']);
      expect(rows.map((r) => r.name)).toEqual(['Ana López']);
      await expect(c.locator('tbody tr').nth(1)).toHaveClass(/table_row--selected/);
      const all = c.locator('.table_select_all');
      expect(await all.evaluate((el) => el.indeterminate)).toBe(true);
      await all.check();
      expect(await c.component.evaluate((el) => el.selected.length)).toBe(6);
      await expect(c.locator('.table_status')).toHaveText('6 selected');
   });

   test('select-all takes every FILTERED row, across pages', async ({ mount }) => {
      const c = await mount('Table', {
         columns: CREW_COLS, rows: CREW, rowKey: 'id', selection: 'multiple', pagination: { pageSize: 2 },
         filters: [{ key: 'active', type: 'boolean', value: true }],
      });
      await c.locator('.table_select_all').check();
      expect(await c.component.evaluate((el) => el.selected)).toEqual(['1', '3', '4', '6']);
   });

   test('Shift+click selects a range', async ({ mount, page }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, rowKey: 'id', selection: 'multiple' });
      await c.locator('tbody .table_select_row').nth(0).click();
      await page.keyboard.down('Shift');
      await c.locator('tbody .table_select_row').nth(3).click();
      await page.keyboard.up('Shift');
      expect(await c.component.evaluate((el) => el.selected)).toEqual(['1', '2', '3', '4']);
   });

   test('single: radios, one row at a time', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, rowKey: 'id', selection: 'single' });
      await expect(c.locator('tbody input[type="radio"]')).toHaveCount(6);
      await expect(c.locator('.table_select_all')).toHaveCount(0);
      await c.locator('tbody .table_select_row').nth(0).check();
      await c.locator('tbody .table_select_row').nth(2).check();
      expect(await c.component.evaluate((el) => el.selected)).toEqual(['3']);
   });

   test('selected as a prop, and getSelectedRows', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, rowKey: 'id', selection: 'multiple', selected: [4, 5] }, { spies: ['onSelectionChange'] });
      await expect(c.locator('tbody tr.table_row--selected')).toHaveCount(2);
      const names2 = await c.component.evaluate((el) => el.getSelectedRows().map((r) => r.name));
      expect(names2).toEqual(['María Ruiz', 'Pedro Díaz']);
      expect(await c.events('onSelectionChange')).toBe(0);
   });

   test('sorting keeps the same <tr> elements (rows are keyed, not rebuilt)', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, rowKey: 'id', selection: 'multiple' });
      await c.locator('tbody .table_select_row').nth(0).check();
      const before = await c.component.evaluate((el) => {
         window.__rowProbe = el.querySelector('tbody tr[data-row-key="1"]');
         return true;
      });
      expect(before).toBe(true);
      await c.locator('th[data-sort-key="age"]').click();
      const same = await c.component.evaluate((el) => el.querySelector('tbody tr[data-row-key="1"]') === window.__rowProbe);
      expect(same).toBe(true);
      await expect(c.locator('tbody tr[data-row-key="1"] .table_select_row')).toBeChecked();
   });

   test('setting rows again re-renders the cells (in-place edits show up)', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW.map((p) => ({ ...p })), rowKey: 'id' });
      await c.component.evaluate((el) => {
         const rows = el.rows;
         rows[0].name = 'Renamed';
         el.rows = rows;
      });
      await expect(c.locator('tbody tr').first().locator('td[data-label="Name"]')).toHaveText('Renamed');
   });

   test('onRowClick fires with the row, but not from the checkbox', async ({ mount, page }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, rowKey: 'id', selection: 'multiple' }, { spies: ['onRowClick'] });
      await c.locator('tbody tr').nth(2).locator('td[data-label="City"]').click();
      await expect.poll(() => c.events('onRowClick')).toBe(1);
      expect((await c.eventArgs('onRowClick')).at(-1)[0].name).toBe('Luis Galué');
      await c.locator('tbody .table_select_row').nth(0).click();
      expect(await c.events('onRowClick')).toBe(1);
      // Keyboard: rows are focusable and Enter activates them.
      await c.locator('tbody tr').nth(4).focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => c.events('onRowClick')).toBe(2);
   });
});

test.describe('Table — layout', () => {
   test('stickyHeader + maxHeight: the header sticks inside a bounded scroll area', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, stickyHeader: true, maxHeight: '150px' });
      await expect(c.locator('thead th').first()).toHaveCSS('position', 'sticky');
      await expect(c.locator('.table_wrapper')).toHaveCSS('max-height', '150px');
      const pinned = await c.component.evaluate(async (el) => {
         const wrapper = el.querySelector('.table_wrapper');
         wrapper.scrollTop = 120;
         await new Promise((r) => requestAnimationFrame(r));
         return Math.round(el.querySelector('thead th').getBoundingClientRect().top - wrapper.getBoundingClientRect().top);
      });
      expect(Math.abs(pinned)).toBeLessThanOrEqual(1);
   });

   test('sticky columns pin the leading columns with measured offsets', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name', sticky: true }, { key: 'city', label: 'City', sticky: true }, { key: 'role', label: 'Role' }],
         rows: CREW,
         selection: 'multiple',
         rowKey: 'id',
      });
      const out = await c.component.evaluate((el) => {
         const cells = el.querySelectorAll('tbody tr:first-child td');
         const head = el.querySelectorAll('thead th');
         return {
            sticky: [...cells].map((td) => td.classList.contains('table_cell--sticky')),
            nameLeft: parseFloat(getComputedStyle(cells[1]).left),
            cityLeft: parseFloat(getComputedStyle(cells[2]).left),
            selectWidth: head[0].getBoundingClientRect().width,
            nameWidth: head[1].getBoundingClientRect().width,
         };
      });
      expect(out.sticky).toEqual([true, true, true, false]);
      expect(Math.abs(out.nameLeft - out.selectWidth)).toBeLessThan(1);
      expect(Math.abs(out.cityLeft - (out.selectWidth + out.nameWidth))).toBeLessThan(1);
   });
});

test.describe('Table — virtual', () => {
   const big = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}`, value: i * 3 }));

   test('10,000 rows render only a window, with spacers for the rest', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host" style="width:600px"></div>`);
      const out = await h.page.evaluate(async (rows) => {
         const el = await slice.build('Table', {
            columns: [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value', sortable: true }],
            rows, rowKey: 'id', virtual: true, maxHeight: '400px', rowHeight: 40, pagination: { pageSize: 10 },
         });
         document.getElementById('host').appendChild(el);
         await new Promise((r) => setTimeout(r, 50));
         return {
            rendered: el.querySelectorAll('tbody tr:not(.table_spacer)').length,
            rowcount: el.querySelector('table').getAttribute('aria-rowcount'),
            pagerHidden: !el.querySelector('slice-pagination') || el.querySelector('slice-pagination').style.display === 'none',
         };
      }, big(10000));
      expect(out.rendered).toBeLessThan(40);
      expect(out.rendered).toBeGreaterThan(5);
      expect(out.rowcount).toBe('10001');
      expect(out.pagerHidden).toBe(true);

      await page.locator('#host .table_wrapper').evaluate((w) => { w.scrollTop = w.scrollHeight; });
      await expect(page.locator('#host tbody tr[data-row-key="10000"]')).toBeVisible();
      await expect(page.locator('#host tbody tr[data-row-key="1"]')).toHaveCount(0);
   });

   test('filtering a virtual table resets the scroll and the window', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host" style="width:600px"></div>`);
      await h.page.evaluate(async (rows) => {
         const el = await slice.build('Table', {
            columns: [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }],
            rows, rowKey: 'id', virtual: true, searchable: true,
         });
         document.getElementById('host').appendChild(el);
      }, big(5000));
      await page.locator('#host .table_wrapper').evaluate((w) => { w.scrollTop = 50000; });
      await page.locator('#host .table_search_input').fill('Row 4999');
      await expect(page.locator('#host tbody tr[data-row-key="4999"]')).toBeVisible();
      await expect(page.locator('#host .table_status')).toHaveText('1 of 5000 rows');
      expect(await page.locator('#host .table_wrapper').evaluate((w) => w.scrollTop)).toBe(0);
   });

   test('components in cells survive scrolling away and back', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host" style="width:600px"></div>`);
      await h.page.evaluate(async (rows) => {
         const el = await slice.build('Table', {
            columns: [
               { key: 'name', label: 'Name' },
               { key: 'id', label: 'Badge', render: (row) => {
                  const span = document.createElement('span');
                  slice.build('Badge', { label: `#${row.id}` }).then((b) => span.appendChild(b));
                  return span;
               } },
            ],
            rows, rowKey: 'id', virtual: true, maxHeight: '300px',
         });
         document.getElementById('host').appendChild(el);
      }, big(400));
      await page.waitForTimeout(200);
      const wrapper = page.locator('#host .table_wrapper');
      await wrapper.evaluate((w) => { w.scrollTop = 6000; });
      await page.waitForTimeout(200);
      await wrapper.evaluate((w) => { w.scrollTop = 0; });
      await expect(page.locator('#host tbody tr[data-row-key="1"] slice-badge')).toBeVisible();
      const alive = await page.evaluate(() => {
         const badge = document.querySelector('#host tbody tr[data-row-key="1"] slice-badge');
         return slice.controller.activeComponents.has(badge.sliceId);
      });
      expect(alive).toBe(true);
      expect(h.pageErrors()).toEqual([]);
   });

   // Regression: with `table-layout: fixed` a `1%` selection column collapsed to
   // 0px, and the sticky-header rule out-specified the pinned header cell's
   // z-index, so scrolled header cells painted over it.
   test('virtual + selection + sticky column: pinned cells keep width and stay on top', async ({ mountHtml }) => {
      const h = await mountHtml(`<div id="host" style="width:500px"></div>`);
      const out = await h.page.evaluate(async () => {
         const rows = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, device: `D${i}`, site: 'North', temp: i }));
         const el = await slice.build('Table', {
            columns: [{ key: 'device', label: 'Device', sticky: true, width: 120 }, { key: 'site', label: 'Site', width: 300 }, { key: 'temp', label: 'Temp', width: 300 }],
            rows, rowKey: 'id', virtual: true, maxHeight: '300px', selection: 'multiple',
         });
         document.getElementById('host').appendChild(el);
         await new Promise((r) => setTimeout(r, 100));
         const wrapper = el.querySelector('.table_wrapper');
         wrapper.scrollLeft = 150;
         await new Promise((r) => requestAnimationFrame(r));
         const [select, device] = el.querySelectorAll('thead th');
         const r = device.getBoundingClientRect();
         const top = document.elementFromPoint(r.x + 10, r.y + r.height / 2);
         return { selectWidth: select.getBoundingClientRect().width, deviceOnTop: device.contains(top) };
      });
      expect(out.selectWidth).toBeGreaterThanOrEqual(40);
      expect(out.deviceOnTop).toBe(true);
   });
});