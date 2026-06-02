import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// PropsTable is data-driven: `props` is an array of row descriptors with shape
//   { path|name, type, required, default, allowedValues }
// render() writes one <tr> per item into <tbody>, sets .props-count to
// "N item(s)", and per row renders: name (.prop-name-nested when path has a dot),
// type <code>, required/optional span, default <code> or em-dash, allowedValues
// <code> chips or em-dash. escapeHtml() escapes &,<,>," in text.
// Derived from PropsTable.js and PropsTable.html.

const DATA = [
   {
      path: 'value',
      type: 'string',
      required: true,
      default: '',
      allowedValues: []
   },
   {
      path: 'variant',
      type: 'string',
      required: false,
      default: 'filled',
      allowedValues: ['filled', 'outlined', 'ghost']
   },
   {
      path: 'icon.name',
      type: 'string',
      required: false
   }
];

test.describe('PropsTable', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('PropsTable');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.props-table')).toBeAttached();
      await expect(c.locator('tbody')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders one row per prop', async ({ mount }) => {
      const c = await mount('PropsTable', { props: DATA });
      await expect(c.locator('tbody tr')).toHaveCount(3);
   });

   test('count reflects number of items (plural)', async ({ mount }) => {
      const c = await mount('PropsTable', { props: DATA });
      await expect(c.locator('.props-count')).toHaveText('3 items');
   });

   test('count is singular for a single item', async ({ mount }) => {
      const c = await mount('PropsTable', { props: [DATA[0]] });
      await expect(c.locator('.props-count')).toHaveText('1 item');
   });

   test('empty props => 0 items and no rows', async ({ mount }) => {
      const c = await mount('PropsTable', { props: [] });
      await expect(c.locator('.props-count')).toHaveText('0 items');
      await expect(c.locator('tbody tr')).toHaveCount(0);
   });

   test('row name, type, required and default render in the first row', async ({ mount }) => {
      const c = await mount('PropsTable', { props: DATA });
      const firstRow = c.locator('tbody tr').nth(0);
      await expect(firstRow.locator('td').nth(0)).toHaveText('value');
      await expect(firstRow.locator('td').nth(1)).toHaveText('string');
      await expect(firstRow.locator('.prop-required-true')).toHaveText('required');
   });

   test('optional prop renders the optional badge', async ({ mount }) => {
      const c = await mount('PropsTable', { props: DATA });
      const secondRow = c.locator('tbody tr').nth(1);
      await expect(secondRow.locator('.prop-required-false')).toHaveText('optional');
      await expect(secondRow.locator('td').nth(3)).toContainText('filled');
   });

   test('allowedValues render as chips', async ({ mount }) => {
      const c = await mount('PropsTable', { props: DATA });
      const secondRow = c.locator('tbody tr').nth(1);
      const chips = secondRow.locator('.prop-allowed code');
      await expect(chips).toHaveCount(3);
      await expect(chips.nth(0)).toHaveText('filled');
      await expect(chips.nth(2)).toHaveText('ghost');
   });

   test('nested path gets .prop-name-nested on the name cell', async ({ mount }) => {
      const c = await mount('PropsTable', { props: DATA });
      const nestedRow = c.locator('tbody tr').nth(2);
      await expect(nestedRow.locator('td').nth(0)).toHaveClass(/prop-name-nested/);
      await expect(nestedRow.locator('td').nth(0)).toHaveText('icon.name');
   });

   test('HTML in values is escaped (no injection)', async ({ mount }) => {
      const c = await mount('PropsTable', {
         props: [{ path: '<b>x</b>', type: 'string' }]
      });
      const nameCell = c.locator('tbody tr').nth(0).locator('td').nth(0);
      // Text content shows the literal markup; no injected <b> element exists.
      await expect(nameCell).toContainText('<b>x</b>');
      await expect(nameCell.locator('b')).toHaveCount(0);
   });

   test('a11y: header columns are real <th> cells', async ({ mount }) => {
      const c = await mount('PropsTable', { props: DATA });
      await expect(c.locator('thead th')).toHaveCount(5);
      await expect(c.locator('thead th').nth(0)).toHaveText('Prop');
   });

   test('visual: props table @visual', async ({ mount }) => {
      const c = await mount('PropsTable', { props: DATA });
      await expect(c.component).toHaveScreenshot('props-table.png');
   });
});
