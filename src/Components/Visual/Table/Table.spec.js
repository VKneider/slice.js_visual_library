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

   // In the mobile 'cards' layout a field is a "label … value" line, whatever
   // the column's own alignment says.
   test('mobile cards lay every field out as label … value', async ({ mount, page }) => {
      await page.setViewportSize({ width: 480, height: 800 });
      await mount('Table', {
         columns: [{ key: 'name', label: 'Name' }, { key: 'n', label: 'N', align: 'left' }],
         rows: [{ name: 'A', n: 1 }],
         mobileLayout: 'cards',
      });
      const field = page.locator('.table_body td[data-label="N"]');
      await expect(field).toHaveClass(/table_cell--left/);
      const layout = await field.evaluate((el) => ({
         display: getComputedStyle(el).display,
         justify: getComputedStyle(el).justifyContent,
         label: getComputedStyle(el, '::before').content,
      }));
      expect(layout).toEqual({ display: 'flex', justify: 'space-between', label: '"N"' });
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

test.describe('Table — mobile layouts', () => {
   const PHONE = { width: 390, height: 800 };
   const WIDE = [
      { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, role: 'admin', joined: '2024-03-10' },
      { id: 2, name: 'Ana López', city: 'Caracas', age: 28, role: 'editor', joined: '2023-11-02' },
      { id: 3, name: 'Luis Galué', city: 'Valencia', age: 41, role: 'viewer', joined: '2025-01-20' },
   ];
   const WIDE_COLS = [
      { key: 'name', label: 'Name', sortable: true }, { key: 'city', label: 'City' },
      { key: 'age', label: 'Age', sortable: true }, { key: 'role', label: 'Role' }, { key: 'joined', label: 'Joined' },
   ];

   test('scroll (default): the real table scrolls sideways with the first column pinned', async ({ mountHtml, page }) => {
      await page.setViewportSize(PHONE);
      const h = await mountHtml(`<div id="host" style="width:100%;min-width:0"></div>`);
      const out = await h.page.evaluate(async ({ rows, columns }) => {
         const el = await slice.build('Table', { columns, rows, rowKey: 'id', selection: 'multiple' });
         document.getElementById('host').appendChild(el);
         await new Promise((r) => setTimeout(r, 100));
         const wrapper = el.querySelector('.table_wrapper');
         const name = el.querySelector('tbody tr td[data-label="Name"]');
         return {
            theadShown: getComputedStyle(el.querySelector('thead')).display !== 'none',
            scrolls: wrapper.scrollWidth > wrapper.clientWidth,
            hostFits: el.getBoundingClientRect().width <= window.innerWidth,
            pinned: getComputedStyle(name).position,
            selectPinned: getComputedStyle(el.querySelector('tbody td.table_select_cell')).position,
         };
      }, { rows: WIDE, columns: WIDE_COLS });
      expect(out).toEqual({ theadShown: true, scrolls: true, hostFits: true, pinned: 'sticky', selectPinned: 'sticky' });
   });

   test('scroll: nothing is pinned on desktop', async ({ mount }) => {
      const c = await mount('Table', { columns: WIDE_COLS, rows: WIDE });
      await expect(c.locator('tbody td[data-label="Name"]').first()).toHaveCSS('position', 'static');
   });

   test('the host shrinks inside a flex parent instead of widening the page', async ({ mountHtml, page }) => {
      await page.setViewportSize(PHONE);
      const h = await mountHtml(`<div id="row" style="display:flex;width:300px"></div>`);
      const width = await h.page.evaluate(async ({ rows, columns }) => {
         const el = await slice.build('Table', { columns, rows });
         document.getElementById('row').appendChild(el);
         return el.getBoundingClientRect().width;
      }, { rows: WIDE, columns: WIDE_COLS });
      expect(width).toBeLessThanOrEqual(300);
   });

   test('cards: one card per row, the first column as its title', async ({ mount, page }) => {
      await page.setViewportSize(PHONE);
      const c = await mount('Table', { columns: WIDE_COLS, rows: WIDE, mobileLayout: 'cards', rowKey: 'id', selection: 'multiple' });
      await expect(c.locator('thead')).toBeHidden();
      await expect(c.locator('tbody tr').first()).toHaveCSS('display', 'grid');
      const title = c.locator('tbody tr').first().locator('td.table_primary_cell');
      await expect(title).toHaveText('José Pérez');
      expect(await title.evaluate((el) => getComputedStyle(el, '::before').content)).toBe('none');
   });

   test('cards: the bar sorts and selects, since the header is hidden', async ({ mount, page }) => {
      await page.setViewportSize(PHONE);
      const c = await mount('Table', { columns: WIDE_COLS, rows: WIDE, mobileLayout: 'cards', rowKey: 'id', selection: 'multiple' }, { spies: ['onSortChange'] });
      const bar = c.locator('.table_cards_bar');
      await expect(bar).toBeVisible();
      await bar.locator('.table_cards_sort').selectOption('age');
      await expect.poll(() => c.locator('tbody td.table_primary_cell').allTextContents()).toEqual(['Ana López', 'José Pérez', 'Luis Galué']);
      await bar.locator('.table_cards_direction').click();
      await expect.poll(() => c.locator('tbody td.table_primary_cell').allTextContents()).toEqual(['Luis Galué', 'José Pérez', 'Ana López']);
      expect((await c.eventArgs('onSortChange')).at(-1)).toEqual([{ key: 'age', direction: 'desc' }]);
      await bar.locator('.table_select_all').check();
      expect(await c.component.evaluate((el) => el.selected.length)).toBe(3);
   });

   test('cards: the bar never shows on desktop', async ({ mount }) => {
      const c = await mount('Table', { columns: WIDE_COLS, rows: WIDE, mobileLayout: 'cards', selection: 'multiple' });
      await expect(c.locator('.table_cards_bar')).toBeHidden();
      await expect(c.locator('thead')).toBeVisible();
   });
});

test.describe('Table — export', () => {
   const DATA = [
      { id: 1, name: 'José "Pepe" Pérez', city: 'Maracaibo, ZU', age: 34, tags: ['a', 'b'], joined: new Date(2024, 2, 10), formula: '=SUM(A1:A9)', secret: 'x' },
      { id: 2, name: 'Ana López', city: 'Caracas', age: -5, tags: [], joined: null, formula: '-negative text', secret: 'y' },
   ];
   const DCOLS = [
      { key: 'name', label: 'Name' },
      { key: 'city', label: 'City' },
      { key: 'age', label: 'Age' },
      { key: 'tags', label: 'Tags' },
      { key: 'joined', label: 'Joined' },
      { key: 'formula', label: 'Formula' },
      { key: 'secret', label: 'Secret', exportable: false },
   ];
   const build = (page, props) => page.evaluate(async (p) => {
      const el = await slice.build('Table', p);
      document.getElementById('host').appendChild(el);
      window.__t = el;
   }, props);

   test('exportData(csv): headers, RFC 4180 quoting, dates, arrays, CSV-injection guard', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      await h.page.evaluate(async (cols) => {
         const data = [
            { id: 1, name: 'José "Pepe" Pérez', city: 'Maracaibo, ZU', age: 34, tags: ['a', 'b'], joined: new Date(2024, 2, 10), formula: '=SUM(A1:A9)', secret: 'x' },
            { id: 2, name: 'Ana López', city: 'Caracas', age: -5, tags: [], joined: null, formula: '-negative text', secret: 'y' },
         ];
         const el = await slice.build('Table', { columns: cols, rows: data });
         document.getElementById('host').appendChild(el);
         window.__t = el;
      }, DCOLS);
      const csv = await page.evaluate(() => window.__t.exportData());
      expect(csv.split('\r\n')).toEqual([
         'Name,City,Age,Tags,Joined,Formula',
         '"José ""Pepe"" Pérez","Maracaibo, ZU",34,"a, b",2024-03-10,\'=SUM(A1:A9)',
         'Ana López,Caracas,-5,,,\'-negative text',
      ]);
   });

   test('exportData honours scope, columns, delimiter and exportValue', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      await build(page, {
         columns: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }, { key: 'city', label: 'City', exportValue: 'city' }],
         rows: CREW, rowKey: 'id', selection: 'multiple', selected: [3, 1],
         filters: [{ key: 'age', type: 'number', op: 'gt', value: 30 }], sortable: true, defaultSort: { key: 'age', direction: 'desc' },
      });
      const out = await page.evaluate(() => ({
         filtered: window.__t.exportData({ columns: ['name'], headers: false }),
         selected: window.__t.exportData({ scope: 'selected', columns: ['name', 'age'], delimiter: ';' }),
         all: window.__t.exportData({ scope: 'all', columns: ['name'], headers: false }).split('\r\n').length,
      }));
      expect(out.filtered.split('\r\n')).toEqual(['María Ruiz', 'Luis Galué', 'Carla Soto', 'José Pérez']);
      expect(out.selected.split('\r\n')).toEqual(['Name;Age', 'Luis Galué;41', 'José Pérez;34']);
      expect(out.all).toBe(6);
      expect(h.pageErrors()).toEqual([]);
   });

   test('exportData(json) and (tsv)', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await build(page, { columns: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }], rows: CREW.slice(0, 2) });
      const out = await page.evaluate(() => ({
         json: JSON.parse(window.__t.exportData({ format: 'json' })),
         tsv: window.__t.exportData({ format: 'tsv' }),
      }));
      expect(out.json).toEqual([{ name: 'José Pérez', age: 34 }, { name: 'Ana López', age: 28 }]);
      expect(out.tsv).toBe('Name\tAge\r\nJosé Pérez\t34\r\nAna López\t28');
   });

   test('downloadData saves a CSV with a BOM, named after exportFilename', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await build(page, { columns: [{ key: 'name', label: 'Name' }], rows: CREW, exportFilename: 'personas' });
      const [download] = await Promise.all([
         page.waitForEvent('download'),
         page.evaluate(() => window.__t.downloadData()),
      ]);
      expect(download.suggestedFilename()).toBe('personas.csv');
      const body = await (await download.createReadStream()).toArray();
      const text = Buffer.concat(body).toString('utf8');
      expect(text.charCodeAt(0)).toBe(0xfeff);
      expect(text.slice(1).split('\r\n')[1]).toBe('José Pérez');
   });

   test('copyToClipboard puts tab-separated rows on the clipboard', async ({ mountHtml, page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await mountHtml(`<div id="host"></div>`);
      await build(page, { columns: [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }], rows: CREW.slice(0, 2), exportable: true });
      const ok = await page.evaluate(() => window.__t.copyToClipboard());
      expect(ok).toBe(true);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Name\tAge\r\nJosé Pérez\t34\r\nAna López\t28');
      await expect(page.locator('#host .table_status')).toHaveText('Copied 2 rows');
   });

   test('the Export menu: keyboard, scope choice, Escape and outside click', async ({ mount, page }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, rowKey: 'id', exportable: true, selection: 'multiple', selected: [2] });
      const toggle = c.locator('.table_export_toggle');
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      const items = c.locator('.table_menu_item');
      await expect(items).toHaveText(['All matching rows (6)', 'Selected rows (1)', 'Download CSV', 'Download JSON', 'Copy to clipboard']);
      await expect(items.first()).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(items.nth(1)).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(items.nth(1)).toHaveAttribute('aria-checked', 'true');
      await page.keyboard.press('Escape');
      await expect(c.locator('.table_menu')).toBeHidden();
      await expect(toggle).toBeFocused();
      await toggle.click();
      await page.mouse.click(5, 5);
      await expect(c.locator('.table_menu')).toBeHidden();
   });

   test('exporting from the menu fires onExport with the chosen scope', async ({ mount, page }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW, rowKey: 'id', exportable: true, selection: 'multiple', selected: [2, 3] }, { spies: ['onExport'] });
      await c.locator('.table_export_toggle').click();
      await c.component.getByRole('menuitemradio', { name: 'Selected rows (2)' }).click();
      const [download] = await Promise.all([
         page.waitForEvent('download'),
         c.component.getByRole('menuitem', { name: 'Download JSON' }).click(),
      ]);
      expect(download.suggestedFilename()).toBe('table.json');
      await expect.poll(() => c.events('onExport')).toBe(1);
      expect((await c.eventArgs('onExport')).at(-1)).toEqual([{ format: 'json', scope: 'selected', count: 2 }]);
   });

   test('the Export button only appears when exportable', async ({ mount }) => {
      const c = await mount('Table', { columns: CREW_COLS, rows: CREW });
      await expect(c.locator('.table_export')).toBeHidden();
   });
});


// ===================================================== view, state, totals, detail, menus

const STAFF = [
   { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, salary: 1200, role: 'admin' },
   { id: 2, name: 'Ana López', city: 'Caracas', age: 28, salary: 950, role: 'editor' },
   { id: 3, name: 'Luis Galué', city: 'Valencia', age: 41, salary: 1800, role: 'viewer' },
   { id: 4, name: 'María Ruiz', city: 'Mérida', age: 52, salary: 2100, role: 'editor' },
];
const STAFF_COLS = [
   { key: 'name', label: 'Name', sortable: true },
   { key: 'city', label: 'City' },
   { key: 'age', label: 'Age', sortable: true },
   { key: 'salary', label: 'Salary' },
   { key: 'role', label: 'Role' },
];
const heads = (c) => c.locator('thead th[data-column-index]').allTextContents();

test.describe('Table — View menu: columns and density', () => {
   test('columnToggle lists the columns; unchecking one hides it', async ({ mount }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, columnToggle: true }, { spies: ['onColumnsChange'] });
      await c.locator('.table_view_toggle').click();
      const items = c.component.getByRole('menuitemcheckbox');
      await expect(items).toHaveText(['Name', 'City', 'Age', 'Salary', 'Role']);
      await c.component.getByRole('menuitemcheckbox', { name: 'City' }).click();
      await expect(c.component.getByRole('menuitemcheckbox', { name: 'City' })).toHaveAttribute('aria-checked', 'false');
      await expect(c.locator('.table_menu')).toBeVisible(); // a toggle keeps the menu open
      expect(await heads(c)).toEqual(['Name', 'Age', 'Salary', 'Role']);
      expect((await c.eventArgs('onColumnsChange')).at(-1)).toEqual([['city']]);
   });

   test('the last visible column and hideable:false cannot be hidden', async ({ mount }) => {
      const c = await mount('Table', {
         columns: [{ key: 'name', label: 'Name', hideable: false }, { key: 'city', label: 'City' }],
         rows: STAFF, columnToggle: true, hiddenColumns: [],
      });
      await c.locator('.table_view_toggle').click();
      await expect(c.component.getByRole('menuitemcheckbox', { name: 'Name' })).toHaveAttribute('aria-disabled', 'true');
      await c.component.getByRole('menuitemcheckbox', { name: 'City' }).click();
      expect(await heads(c)).toEqual(['Name']);
      // `name` is the only one left and not hideable anyway; a programmatic hide is ignored too.
      await c.component.evaluate((el) => el.setColumnVisible('name', false));
      expect(await heads(c)).toEqual(['Name']);
   });

   test('hidden: true starts hidden; hiddenColumns overrides it', async ({ mount }) => {
      const a = await mount('Table', { columns: [...STAFF_COLS.slice(0, 2), { key: 'age', label: 'Age', hidden: true }], rows: STAFF });
      expect(await heads(a)).toEqual(['Name', 'City']);
      const b = await mount('Table', { columns: STAFF_COLS, rows: STAFF, hiddenColumns: ['salary', 'role'] });
      expect(await heads(b)).toEqual(['Name', 'City', 'Age']);
   });

   test('the search and the export follow the visible columns', async ({ mount }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, searchable: true, hiddenColumns: ['city'] });
      await c.locator('.table_search_input').fill('caracas');
      await expect.poll(() => c.locator('td.table_empty').count()).toBe(1);
      const csv = await c.component.evaluate((el) => el.exportData({ scope: 'all' }).split('\r\n')[0]);
      expect(csv).toBe('Name,Age,Salary,Role');
   });

   test('densityToggle switches the density, which changes the row height', async ({ mount }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, densityToggle: true });
      const rowHeight = () => c.locator('tbody tr').first().evaluate((tr) => tr.getBoundingClientRect().height);
      const comfortable = await rowHeight();
      await c.locator('.table_view_toggle').click();
      await c.component.getByRole('menuitemradio', { name: 'Compact' }).click();
      await expect(c.component).toHaveClass(/table--density-compact/);
      const compact = await rowHeight();
      await c.component.getByRole('menuitemradio', { name: 'Spacious' }).click();
      const spacious = await rowHeight();
      expect(compact).toBeLessThan(comfortable);
      expect(spacious).toBeGreaterThan(comfortable);
   });

   test('the default density adds no class; unknown values fall back', async ({ mount }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, density: 'huge' });
      expect(await c.component.evaluate((el) => el.density)).toBe('comfortable');
      await expect(c.component).not.toHaveClass(/table--density/);
   });
});

test.describe('Table — remembered state (stateKey)', () => {
   test('search, filters, sort, hidden columns and density come back', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      const build = () => page.evaluate(async ({ rows, columns }) => {
         document.getElementById('host').replaceChildren();
         const el = await slice.build('Table', { columns, rows, stateKey: 'spec-staff', searchable: true, filterable: true, columnToggle: true, densityToggle: true });
         document.getElementById('host').appendChild(el);
         window.__t = el;
      }, { rows: STAFF, columns: STAFF_COLS });
      await page.evaluate(() => localStorage.removeItem('slice-table:spec-staff'));
      await build();
      // Nothing is saved just for showing up.
      expect(await page.evaluate(() => localStorage.getItem('slice-table:spec-staff'))).toBeNull();

      await page.locator('#host .table_search_input').fill('a');
      await page.locator('#host th[data-sort-key="age"]').click();
      await page.evaluate(() => {
         window.__t.setFilter('salary', { type: 'number', op: 'gte', value: 1000 });
         window.__t.setColumnVisible('city', false);
         window.__t.density = 'compact';
      });
      await page.locator('#host .table_view_toggle').click();
      await page.locator('#host').getByRole('menuitemradio', { name: 'Compact' }).click();
      await page.waitForTimeout(400);

      await build();
      const state = await page.evaluate(() => ({
         search: window.__t.search,
         filters: window.__t.filters,
         hidden: window.__t.hiddenColumns,
         density: window.__t.density,
      }));
      expect(state.search).toBe('a');
      expect(state.filters).toEqual([{ key: 'salary', type: 'number', op: 'gte', value: 1000 }]);
      expect(state.hidden).toEqual(['city']);
      expect(state.density).toBe('compact');
      // age asc, salary ≥ 1000, has an "a"
      await expect(page.locator('#host tbody td[data-label="Name"]')).toHaveText(['José Pérez', 'Luis Galué', 'María Ruiz']);
      await expect(page.locator('#host .table_search_input')).toHaveValue('a');

      await page.evaluate(() => window.__t.clearSavedState());
      expect(await page.evaluate(() => localStorage.getItem('slice-table:spec-staff'))).toBeNull();
   });

   test('a corrupt saved state is ignored', async ({ mountHtml, page }) => {
      const h = await mountHtml(`<div id="host"></div>`);
      await page.evaluate(() => localStorage.setItem('slice-table:spec-bad', '{not json'));
      await page.evaluate(async ({ rows, columns }) => {
         const el = await slice.build('Table', { columns, rows, stateKey: 'spec-bad' });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      await expect(page.locator('#host tbody tr')).toHaveCount(4);
      expect(h.pageErrors()).toEqual([]);
   });
});

test.describe('Table — totals', () => {
   const COLS_T = [
      { key: 'name', label: 'Name', aggregate: 'count' },
      { key: 'age', label: 'Age', aggregate: 'avg' },
      { key: 'salary', label: 'Salary', aggregate: 'sum' },
      { key: 'role', label: 'Role' },
   ];

   test('sum / avg / count over every filtered row, not just the page', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS_T, rows: STAFF, pagination: { pageSize: 2 } });
      const cells = c.locator('tfoot td');
      await expect(cells.nth(0)).toHaveText('Total4');
      await expect(cells.nth(1)).toHaveText('38.75');
      await expect(cells.nth(2)).toHaveText(/6,?050/);
      await expect(cells.nth(2)).toHaveClass(/table_cell--num/);
   });

   test('totals follow the filters', async ({ mount }) => {
      const c = await mount('Table', { columns: COLS_T, rows: STAFF, searchable: true });
      await c.locator('.table_search_input').fill('editor');
      await expect(c.locator('tfoot td').nth(0)).toHaveText('Total2');
      await expect(c.locator('tfoot td').nth(2)).toHaveText(/3,?050/);
   });

   test('min / max / a custom function / aggregateFormat', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      const out = await page.evaluate(async (rows) => {
         const el = await slice.build('Table', {
            columns: [
               { key: 'name', label: 'Name' },
               { key: 'age', label: 'Age', aggregate: 'min' },
               { key: 'salary', label: 'Salary', aggregate: 'max', aggregateFormat: (v) => `$${v}` },
               { key: 'role', label: 'Role', aggregate: (values) => new Set(values).size + ' roles' },
            ],
            rows,
         });
         document.getElementById('host').appendChild(el);
         return [...el.querySelectorAll('tfoot td')].map((td) => td.textContent);
      }, STAFF);
      expect(out).toEqual(['Total', '28', '$2100', '3 roles']);
   });

   test('no aggregate, no footer', async ({ mount }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF });
      await expect(c.locator('tfoot')).toBeHidden();
   });
});

test.describe('Table — row detail', () => {
   test('modal: a row click opens every column (hidden ones too); Escape returns to the row', async ({ mount, page }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, rowKey: 'id', rowDetail: 'modal', hiddenColumns: ['salary'] });
      await c.locator('tbody tr').nth(1).locator('td[data-label="City"]').click();
      const dialog = page.locator('dialog[open]');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('.slice-modal__title')).toHaveText('Ana López');
      await expect(dialog.locator('.table_detail_list dt')).toHaveText(['Name', 'City', 'Age', 'Salary', 'Role']);
      await expect(dialog.locator('.table_detail_list dd').nth(3)).toHaveText('950');
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(c.locator('tbody tr').nth(1)).toBeFocused();
   });

   test('modal: Enter on a focused row opens it; renderDetail and detailTitle customise it', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await page.evaluate(async ({ rows, columns }) => {
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id', rowDetail: 'modal',
            detailTitle: (row) => `Employee #${row.id}`,
            renderDetail: async (row) => {
               await new Promise((r) => setTimeout(r, 50));
               const p = document.createElement('p');
               p.className = 'custom-detail';
               p.textContent = `${row.name} earns ${row.salary}`;
               return p;
            },
         });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      await page.locator('#host tbody tr').nth(2).focus();
      await page.keyboard.press('Enter');
      const dialog = page.locator('dialog[open]');
      await expect(dialog.locator('.slice-modal__title')).toHaveText('Employee #3');
      await expect(dialog.locator('.custom-detail')).toHaveText('Luis Galué earns 1800');
   });

   test('expand: the chevron opens the detail under the row and closes it again', async ({ mount, page }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, rowKey: 'id', rowDetail: 'expand' });
      const toggle = c.locator('tbody tr[data-row-key="2"] .table_expand_toggle');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      const detail = c.locator('tbody tr.table_detail_row');
      await expect(detail).toHaveCount(1);
      await expect(detail.locator('dd').first()).toHaveText('Ana López');
      const order = await c.component.evaluate((el) => [...el.querySelectorAll('tbody tr')].map((tr) => tr.dataset.rowKey || 'detail'));
      expect(order).toEqual(['1', '2', 'detail', '3', '4']);
      expect(await detail.locator('td').evaluate((td) => td.colSpan)).toBe(6); // 5 columns + the chevron
      const controls = await toggle.getAttribute('aria-controls');
      expect(await detail.locator('td').getAttribute('id')).toBe(controls);
      await toggle.click();
      await expect(detail).toHaveCount(0);
   });

   test('expand: clicking the row toggles too; the detail stays across a sort', async ({ mount }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, rowKey: 'id', rowDetail: 'expand' });
      await c.locator('tbody tr[data-row-key="3"] td[data-label="City"]').click();
      await expect(c.locator('tbody tr.table_detail_row')).toHaveCount(1);
      await c.locator('th[data-sort-key="age"]').click();
      const order = await c.component.evaluate((el) => [...el.querySelectorAll('tbody tr')].map((tr) => tr.dataset.rowKey || 'detail'));
      expect(order).toEqual(['2', '1', '3', 'detail', '4']);
   });
});

test.describe('Table — row menu (rowActions)', () => {
   test('rowActions: true gives the default menu', async ({ mount }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, rowKey: 'id', selection: 'multiple', rowActions: true });
      await c.locator('tbody tr').first().locator('.table_row_menu_toggle').click();
      await expect(c.component.getByRole('menuitem')).toHaveText(['Details', 'Copy row', 'Select']);
      await c.component.getByRole('menuitem', { name: 'Select' }).click();
      expect(await c.component.evaluate((el) => el.selected)).toEqual(['1']);
      await c.locator('tbody tr').first().locator('.table_row_menu_toggle').click();
      await expect(c.component.getByRole('menuitem', { name: 'Deselect' })).toBeVisible();
   });

   test('custom items: labels, separators, danger, disabled, hidden and onClick({ row, key, table })', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await page.evaluate(async ({ rows, columns }) => {
         window.__calls = [];
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id',
            rowActions: [
               { type: 'label', label: 'Manage' },
               { label: 'Edit', icon: '✎', shortcut: 'E', onClick: ({ row, key, table }) => window.__calls.push(['edit', row.name, key, table === el]) },
               'separator',
               { label: 'Promote', hidden: (row) => row.role === 'admin', onClick: () => {} },
               { label: 'Delete', danger: true, disabled: (row) => row.role === 'admin', onClick: ({ row }) => window.__calls.push(['delete', row.name]) },
            ],
         });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      const host = page.locator('#host');
      const admin = host.locator('tbody tr[data-row-key="1"] .table_row_menu_toggle');
      await expect(admin).toHaveAttribute('aria-label', 'Row actions: José Pérez');
      await admin.click();
      await expect(host.locator('.table_menu_label')).toHaveText('Manage');
      await expect(host.getByRole('menuitem')).toHaveText(['✎EditE', 'Delete']);
      await expect(host.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('aria-disabled', 'true');
      await expect(host.getByRole('menuitem', { name: 'Delete' })).toHaveClass(/table_menu_item--danger/);
      await host.getByRole('menuitem', { name: 'Delete' }).click({ force: true });
      await host.getByRole('menuitem', { name: /Edit/ }).click();
      await expect(admin).toBeFocused();
      await host.locator('tbody tr[data-row-key="2"] .table_row_menu_toggle').click();
      await expect(host.getByRole('menuitem')).toHaveText(['✎EditE', 'Promote', 'Delete']);
      await host.getByRole('menuitem', { name: 'Delete' }).click();
      expect(await page.evaluate(() => window.__calls)).toEqual([['edit', 'José Pérez', '1', true], ['delete', 'Ana López']]);
   });

   test('rowActions as a function builds a menu per row; { render } adds anything', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await page.evaluate(async ({ rows, columns }) => {
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id',
            rowActions: (row) => (row.age > 40
               ? ['details', { render: ({ row }) => { const s = document.createElement('small'); s.className = 'senior'; s.textContent = `Senior: ${row.name}`; return s; } }]
               : ['details']),
         });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      await page.locator('#host tbody tr[data-row-key="3"] .table_row_menu_toggle').click();
      await expect(page.locator('#host .table_menu .senior')).toHaveText('Senior: Luis Galué');
      await page.keyboard.press('Escape');
      await page.locator('#host tbody tr[data-row-key="2"] .table_row_menu_toggle').click();
      await expect(page.locator('#host .table_menu .senior')).toHaveCount(0);
   });

   test('"Details" from the row menu opens the modal', async ({ mount, page }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, rowKey: 'id', rowActions: ['details'] });
      await c.locator('tbody tr').nth(3).locator('.table_row_menu_toggle').click();
      await c.component.getByRole('menuitem', { name: 'Details' }).click();
      await expect(page.locator('dialog[open] .slice-modal__title')).toHaveText('María Ruiz');
   });

   test('the menu: arrows move, Escape closes and returns focus, an outside press closes', async ({ mount, page }) => {
      const c = await mount('Table', { columns: STAFF_COLS, rows: STAFF, rowKey: 'id', rowActions: ['details', 'copy'] });
      const toggle = c.locator('tbody tr').first().locator('.table_row_menu_toggle');
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(c.component.getByRole('menuitem', { name: 'Details' })).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(c.component.getByRole('menuitem', { name: 'Copy row' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(c.locator('.table_menu')).toBeHidden();
      await expect(toggle).toBeFocused();
      await toggle.click();
      await page.mouse.click(2, 2);
      await expect(c.locator('.table_menu')).toBeHidden();
   });

   test('exportMenu: pick built-ins and add your own item', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await page.evaluate(async ({ rows, columns }) => {
         window.__exported = null;
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id', exportable: true,
            exportMenu: ['csv', 'separator', { label: 'Excel (server)', onClick: ({ rows, scope }) => { window.__exported = [scope, rows.length]; } }],
         });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      await page.locator('#host .table_export_toggle').click();
      await expect(page.locator('#host').getByRole('menuitem')).toHaveText(['Download CSV', 'Excel (server)']);
      await page.locator('#host').getByRole('menuitem', { name: 'Excel (server)' }).click();
      expect(await page.evaluate(() => window.__exported)).toEqual(['filtered', 4]);
   });
});

test.describe('Table — your own menus (close, custom content, onRowMenu)', () => {
   test('ctx.close() lets a form inside the menu close it', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await page.evaluate(async ({ rows, columns }) => {
         window.__notes = [];
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id',
            rowActions: [
               'details',
               {
                  render: ({ row, close }) => {
                     const form = document.createElement('form');
                     form.className = 'note-form';
                     const input = document.createElement('input');
                     input.setAttribute('aria-label', 'Note');
                     const save = document.createElement('button');
                     save.textContent = 'Save';
                     form.append(input, save);
                     form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        window.__notes.push([row.name, input.value]);
                        close();
                     });
                     return form;
                  },
               },
            ],
         });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      const host = page.locator('#host');
      const toggle = host.locator('tbody tr[data-row-key="2"] .table_row_menu_toggle');
      await toggle.click();
      const input = host.getByLabel('Note');
      await input.click();
      // Keys typed in custom content belong to it: arrows do not move the menu, Tab does not close it.
      await page.keyboard.type('hola');
      await page.keyboard.press('ArrowUp');
      await expect(input).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(host.locator('.table_menu')).toBeVisible();
      await host.getByRole('button', { name: 'Save' }).click();
      await expect(host.locator('.table_menu')).toBeHidden();
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => window.__notes)).toEqual([['Ana López', 'hola']]);
   });

   test('Escape inside custom content closes; focus leaving the menu closes it', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div><button id="elsewhere">elsewhere</button>`);
      await page.evaluate(async ({ rows, columns }) => {
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id',
            rowActions: [{ render: () => { const i = document.createElement('input'); i.setAttribute('aria-label', 'Note'); return i; } }],
         });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      const host = page.locator('#host');
      const toggle = host.locator('tbody tr').first().locator('.table_row_menu_toggle');
      await toggle.click();
      await host.getByLabel('Note').focus();
      await page.keyboard.press('Escape');
      await expect(host.locator('.table_menu')).toBeHidden();
      await expect(toggle).toBeFocused();
      await toggle.click();
      await host.getByLabel('Note').focus();
      await page.locator('#elsewhere').focus();
      await expect(host.locator('.table_menu')).toBeHidden();
   });

   test('a stale close() from an old menu does nothing', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await page.evaluate(async ({ rows, columns }) => {
         window.__closers = [];
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id',
            rowActions: [{ render: ({ close }) => { window.__closers.push(close); return document.createElement('span'); } }],
         });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      const host = page.locator('#host');
      await host.locator('tbody tr').nth(0).locator('.table_row_menu_toggle').click();
      await host.locator('tbody tr').nth(1).locator('.table_row_menu_toggle').click();
      await page.evaluate(() => window.__closers[0]());
      await expect(host.locator('.table_menu')).toBeVisible();
      await page.evaluate(() => window.__closers[1]());
      await expect(host.locator('.table_menu')).toBeHidden();
   });

   test('onRowMenu replaces the table menu: you get the row and the anchor, the table keeps aria-expanded', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await page.evaluate(async ({ rows, columns }) => {
         window.__log = [];
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id', searchable: true,
            onRowMenu: ({ row, key, anchor, table, close }) => {
               const pop = document.createElement('div');
               pop.className = 'my-popover';
               pop.textContent = `Menu for ${row.name}`;
               const done = document.createElement('button');
               done.textContent = 'Done';
               done.addEventListener('click', () => close());
               pop.appendChild(done);
               document.body.appendChild(pop);
               window.__log.push(['open', key, anchor.classList.contains('table_row_menu_toggle'), table === el]);
               return () => { pop.remove(); window.__log.push(['cleanup', key]); };
            },
         });
         document.getElementById('host').appendChild(el);
      }, { rows: STAFF, columns: STAFF_COLS });
      const host = page.locator('#host');
      const first = host.locator('tbody tr[data-row-key="1"] .table_row_menu_toggle');
      const second = host.locator('tbody tr[data-row-key="2"] .table_row_menu_toggle');

      await first.click();
      await expect(page.locator('.my-popover')).toHaveText(/Menu for José Pérez/);
      await expect(host.locator('.table_menu')).toBeHidden();
      await expect(first).toHaveAttribute('aria-expanded', 'true');

      // Your close(): cleanup runs, aria-expanded resets, focus returns.
      await page.getByRole('button', { name: 'Done' }).click();
      await expect(page.locator('.my-popover')).toHaveCount(0);
      await expect(first).toHaveAttribute('aria-expanded', 'false');
      await expect(first).toBeFocused();

      // The toggle closes it; opening another row's menu closes the first.
      await first.click();
      await first.click();
      await second.click();
      await first.click();
      expect(await page.evaluate(() => window.__log)).toEqual([
         ['open', '1', true, true], ['cleanup', '1'],
         ['open', '1', true, true], ['cleanup', '1'],
         ['open', '2', true, true], ['cleanup', '2'],
         ['open', '1', true, true],
      ]);

      // Its row filtered away: the table closes it.
      await host.locator('.table_search_input').fill('valencia');
      await expect(page.locator('.my-popover')).toHaveCount(0);
      expect((await page.evaluate(() => window.__log)).at(-1)).toEqual(['cleanup', '1']);
   });

   test('onRowMenu alone adds the ⋯ column; destroying the table runs the cleanup', async ({ mountHtml, page }) => {
      await mountHtml(`<div id="host"></div>`);
      await page.evaluate(async ({ rows, columns }) => {
         window.__cleaned = 0;
         const el = await slice.build('Table', {
            columns, rows, rowKey: 'id',
            onRowMenu: () => () => { window.__cleaned += 1; },
         });
         document.getElementById('host').appendChild(el);
         window.__t = el;
      }, { rows: STAFF, columns: STAFF_COLS });
      await expect(page.locator('#host tbody .table_row_menu_toggle')).toHaveCount(4);
      await page.locator('#host tbody .table_row_menu_toggle').first().click();
      await page.evaluate(() => slice.controller.destroyComponent(window.__t));
      expect(await page.evaluate(() => window.__cleaned)).toBe(1);
   });
});