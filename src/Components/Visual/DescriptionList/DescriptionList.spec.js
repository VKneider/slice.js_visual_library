import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const ORDER = {
   id: 1042,
   status: 'paid',
   customer: { name: 'Ana López' },
   email: 'ana@acme.com',
   total: 129.5,
   createdAt: '2026-10-20',
   notes: '',
   priority: 'normal',
   gift: false,
   tags: ['web', 'promo'],
};

// Fields carry functions, which cannot cross into the page as props: the
// specs mount without them and set them inside the page.
const withFields = (c, extra = {}) => c.component.evaluate((el, more) => {
   const STATUS = { paid: { label: 'Paid', tone: 'success' }, pending: { label: 'Pending', tone: 'warning' } };
   el.fields = [
      { key: 'id', label: 'Order', format: (id) => `#${id}`, copy: true },
      { key: 'status', type: 'badge', badge: (s) => STATUS[s] },
      { key: 'customer', type: 'avatar' },
      { key: 'email', type: 'email', copy: true, edit: { required: true } },
      { key: 'total', type: 'currency', currency: 'USD', edit: { min: 0 } },
      { key: 'createdAt', label: 'Created', type: 'date' },
      { key: 'notes', type: 'multiline', edit: true },
      { key: 'priority', edit: { options: [{ value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }] } },
      { key: 'gift', type: 'boolean', edit: true },
      { key: 'tags', type: 'tags' },
   ];
   Object.assign(el, more);
}, extra);
const FIELD_COUNT = 10;

const row = (c, key) => c.locator(`.slice-description-list__field[data-key="${key}"]`);
const value = (c, key) => row(c, key).locator('.slice-description-list__content');
const wide = (c) => c.component.evaluate(async (el) => {
   el.style.width = '720px';
   await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
});

test.describe('DescriptionList', () => {
   test('smoke: a dl of labels and values, formatted by type', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER, locale: 'en-US' });
      await withFields(c);
      expect(c.pageErrors()).toEqual([]);
      await expect(c.component).toHaveClass(/slice-description-list/);
      await expect(c.locator('dl dt')).toHaveCount(FIELD_COUNT);
      await expect(row(c, 'id').locator('dt')).toHaveText('Order');
      await expect(row(c, 'createdAt').locator('dt')).toHaveText('Created');
      // A label from the key when there is none.
      await expect(row(c, 'priority').locator('dt')).toHaveText('Priority');
      await expect(value(c, 'id')).toHaveText('#1042');
      await expect(value(c, 'total')).toHaveText('$129.50');
      await expect(value(c, 'createdAt')).toHaveText('Oct 20, 2026');
      await expect(value(c, 'email').locator('a')).toHaveAttribute('href', 'mailto:ana@acme.com');
   });

   test('components in values: Badge for a status, Avatar for a person, Badges for tags', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER });
      await withFields(c);
      await expect(value(c, 'status').locator('slice-badge')).toHaveAttribute('data-tone', 'success');
      await expect(value(c, 'status').locator('slice-badge')).toHaveText('Paid');
      await expect(value(c, 'customer').locator('slice-avatar')).toHaveCount(1);
      await expect(value(c, 'customer')).toContainText('Ana López');
      await expect(value(c, 'tags').locator('slice-badge')).toHaveCount(2);
   });

   test('an empty value shows a dash; hideEmpty hides the row', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER, fields: [{ key: 'notes' }, { key: 'email' }] });
      await expect(value(c, 'notes')).toHaveText('—');
      await expect(row(c, 'notes')).toHaveClass(/is-empty/);
      await c.component.evaluate((el) => { el.hideEmpty = true; });
      await expect(row(c, 'notes')).toBeHidden();
      await expect(row(c, 'email')).toBeVisible();
   });

   test('sections group fields under a heading, and can fold', async ({ mount }) => {
      const c = await mount('DescriptionList', {
         item: ORDER,
         sections: [
            { title: 'Order', fields: ['id', 'status'] },
            { title: 'Customer', collapsible: true, collapsed: true, fields: ['email'] },
         ],
      });
      await expect(c.locator('.slice-description-list__section-title')).toHaveText(['Order', 'Customer']);
      const toggle = c.locator('.slice-description-list__section-toggle');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(row(c, 'email')).toBeHidden();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(row(c, 'email')).toBeVisible();
   });

   test('layouts: label beside the value, above it, or a grid of columns', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER, fields: ['id', 'email', 'total', 'status'] });
      await wide(c);
      const box = (key, part) => row(c, key).locator(part).boundingBox();
      let label = await box('email', 'dt');
      let val = await box('email', 'dd');
      expect(val.x).toBeGreaterThan(label.x + label.width - 1);
      await c.component.evaluate((el) => { el.layout = 'stacked'; });
      label = await box('email', 'dt');
      val = await box('email', 'dd');
      expect(val.y).toBeGreaterThan(label.y);
      await c.component.evaluate((el) => { el.layout = 'grid'; el.columns = 2; });
      const first = await row(c, 'id').boundingBox();
      const second = await row(c, 'email').boundingBox();
      expect(Math.round(second.y)).toBe(Math.round(first.y));
      expect(second.x).toBeGreaterThan(first.x);
   });

   test('narrow: the label goes above the value', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER, fields: ['email'] });
      await c.component.evaluate(async (el) => {
         el.style.width = '320px';
         await new Promise((r) => setTimeout(r, 100));
      });
      await expect(c.component).toHaveClass(/is-narrow/);
      const label = await row(c, 'email').locator('dt').boundingBox();
      const val = await row(c, 'email').locator('dd').boundingBox();
      expect(val.y).toBeGreaterThan(label.y);
   });

   test('copy: puts the raw value on the clipboard and says so', async ({ mount, page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const c = await mount('DescriptionList', { item: ORDER });
      await withFields(c);
      const button = row(c, 'email').locator('[data-tool="copy"]');
      await expect(button).toHaveAttribute('aria-label', 'Copy Email');
      await button.click();
      await expect(button).toHaveClass(/is-done/);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ana@acme.com');
      await expect(c.locator('.slice-description-list__live')).toHaveText('Copied');
   });

   test('edit: pencil opens an Input; Enter saves through commit, then writes', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER }, { spies: ['onChange'] });
      await withFields(c);
      await c.component.evaluate((el) => {
         el._calls = [];
         el.commit = async (change) => { el._calls.push({ key: change.key, value: change.value, previous: change.previous }); };
      });
      await row(c, 'email').locator('[data-tool="pen"]').click();
      const input = row(c, 'email').locator('.slice-description-list__editor input');
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('ana@acme.com');
      await input.fill('ana.lopez@acme.com');
      await input.press('Enter');
      await expect(row(c, 'email').locator('.slice-description-list__editor')).toHaveCount(0);
      await expect(value(c, 'email')).toHaveText('ana.lopez@acme.com');
      expect(await c.component.evaluate((el) => el._calls)).toEqual([{ key: 'email', value: 'ana.lopez@acme.com', previous: 'ana@acme.com' }]);
      expect(await c.component.evaluate((el) => el.item.email)).toBe('ana.lopez@acme.com');
      // The item you passed was not mutated.
      expect(ORDER.email).toBe('ana@acme.com');
      expect(await c.events('onChange')).toBe(1);
   });

   test('a failed commit keeps the editor and what was typed, and says so', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER });
      await withFields(c);
      await c.component.evaluate((el) => {
         el.commit = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Server says no.')), 150));
      });
      await row(c, 'email').locator('[data-tool="pen"]').click();
      const input = row(c, 'email').locator('.slice-description-list__editor input');
      await input.fill('bad@acme.com');
      await input.press('Enter');
      await expect(row(c, 'email')).toHaveClass(/is-saving/);
      await expect(row(c, 'email').locator('.slice-description-list__error')).toHaveText('The change could not be saved. Server says no.');
      await expect(input).toHaveValue('bad@acme.com');
      await expect(row(c, 'email')).not.toHaveClass(/is-saving/);
      expect(await c.component.evaluate((el) => el.item.email)).toBe('ana@acme.com');
      // Cancelling takes the message away with the editor.
      await input.press('Escape');
      await expect(row(c, 'email').locator('.slice-description-list__error')).toBeHidden();
   });

   test('Escape cancels; required stops an empty save', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER });
      await withFields(c);
      await row(c, 'email').locator('[data-tool="pen"]').click();
      const input = row(c, 'email').locator('.slice-description-list__editor input');
      await input.fill('');
      await row(c, 'email').getByRole('button', { name: 'Save' }).click();
      await expect(row(c, 'email').locator('.slice-description-list__editor')).toHaveCount(1);
      await input.press('Escape');
      await expect(row(c, 'email').locator('.slice-description-list__editor')).toHaveCount(0);
      await expect(value(c, 'email')).toHaveText('ana@acme.com');
      await expect(row(c, 'email').locator('[data-tool="pen"]')).toBeFocused();
   });

   test('a select for options; a switch for a boolean saves at once', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER });
      await withFields(c);
      expect(await c.component.evaluate(async (el) => {
         await el.edit('priority');
         await new Promise((r) => setTimeout(r, 300));
         const select = el.querySelector('.slice-description-list__editor slice-select');
         select.selected = 'high';
         return el.save();
      })).toBe(true);
      await expect(value(c, 'priority')).toHaveText('high');

      const toggle = row(c, 'gift').locator('slice-switch input');
      await expect(toggle).toHaveAttribute('aria-label', 'Gift');
      await row(c, 'gift').locator('slice-switch').click();
      await expect.poll(() => c.component.evaluate((el) => el.item.gift)).toBe(true);
   });

   test('setValue goes through commit too; readonly removes the pencils', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER });
      await withFields(c);
      expect(await c.component.evaluate(async (el) => {
         el.commit = async ({ value }) => value !== 'nope@acme.com';
         const ok = await el.setValue('email', 'new@acme.com');
         const no = await el.setValue('email', 'nope@acme.com');
         return [ok, no, el.item.email];
      })).toEqual([true, false, 'new@acme.com']);
      await expect(c.locator('[data-tool="pen"]')).not.toHaveCount(0);
      await c.component.evaluate((el) => { el.readonly = true; });
      await expect(c.locator('[data-tool="pen"]')).toHaveCount(0);
   });

   test('context: follows the store and writes saved edits back to it', async ({ mount, page }) => {
      await page.evaluate((order) => {
         if (!slice.context.has('dlOrder')) slice.context.create('dlOrder', { order });
      }, ORDER);
      const c = await mount('DescriptionList', { context: 'dlOrder', contextPath: 'order' });
      await withFields(c);
      await expect(value(c, 'email')).toHaveText('ana@acme.com');
      await page.evaluate(() => slice.context.setState('dlOrder', (s) => ({ ...s, order: { ...s.order, status: 'pending' } })));
      await expect(value(c, 'status').locator('slice-badge')).toHaveText('Pending');
      await c.component.evaluate((el) => el.setValue('email', 'store@acme.com'));
      expect(await page.evaluate(() => slice.context.getState('dlOrder').order.email)).toBe('store@acme.com');
   });

   test('a store update while editing another field does not wipe the editor', async ({ mount, page }) => {
      await page.evaluate((order) => {
         if (!slice.context.has('dlOrder2')) slice.context.create('dlOrder2', { order });
      }, ORDER);
      const c = await mount('DescriptionList', { context: 'dlOrder2', contextPath: 'order' });
      await withFields(c);
      await row(c, 'email').locator('[data-tool="pen"]').click();
      const input = row(c, 'email').locator('.slice-description-list__editor input');
      await input.fill('typing@acme.com');
      await page.evaluate(() => slice.context.setState('dlOrder2', (s) => ({ ...s, order: { ...s.order, status: 'pending' } })));
      await expect(value(c, 'status').locator('slice-badge')).toHaveText('Pending');
      await expect(input).toHaveValue('typing@acme.com');
   });

   test('load: skeleton while loading, an error with a retry, then the record', async ({ mount }) => {
      const c = await mount('DescriptionList', { fields: ['id', 'email'] });
      await c.component.evaluate((el) => {
         el._tries = 0;
         el.load = () => new Promise((resolve, reject) => setTimeout(() => {
            el._tries += 1;
            if (el._tries === 1) reject(new Error('offline'));
            else resolve({ id: 7, email: 'loaded@acme.com' });
         }, 200));
      });
      await expect(c.component).toHaveClass(/is-loading/);
      await expect(c.locator('.slice-description-list__skeleton')).toHaveCount(2);
      await expect(c.locator('.slice-description-list__state')).toBeVisible();
      await c.locator('.slice-description-list__state').getByRole('button', { name: 'Try again' }).click();
      await expect(value(c, 'email')).toHaveText('loaded@acme.com');
      await expect(c.component).not.toHaveClass(/is-loading/);
   });

   test('header: title, description and actions that get the current item', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: ORDER, fields: ['id'], title: 'Order #1042', description: 'Placed online' });
      await c.component.evaluate((el) => {
         el.actions = [{ label: 'Refund', icon: 'copy', onClick: ({ item, list }) => { list._clicked = item.id; } }];
      });
      await expect(c.locator('.slice-description-list__title')).toHaveText('Order #1042');
      await expect(c.locator('.slice-description-list__description')).toHaveText('Placed online');
      await c.locator('button', { hasText: 'Refund' }).click();
      expect(await c.component.evaluate((el) => el._clicked)).toBe(1042);
   });

   test('links: path goes through the router, url opens a new tab', async ({ mount }) => {
      const c = await mount('DescriptionList', { item: { ...ORDER, site: 'https://acme.com' } });
      await c.component.evaluate((el) => {
         el.fields = [{ key: 'customer.name', label: 'Customer', path: (o) => `/customers/${o.id}` }, { key: 'site', type: 'url' }];
      });
      await expect(c.locator('a[href="/customers/1042"]')).toHaveText('Ana López');
      await expect(c.locator('a[href="https://acme.com"]')).toHaveAttribute('target', '_blank');
   });

   test('destroying it destroys every component it built, and an open editor', async ({ mount, page }) => {
      const c = await mount('DescriptionList', { item: ORDER, actions: [{ label: 'Edit' }] });
      await withFields(c);
      await row(c, 'email').locator('[data-tool="pen"]').click();
      await expect(row(c, 'email').locator('.slice-description-list__editor input')).toBeVisible();
      await page.waitForTimeout(200);
      const ids = await c.component.evaluate((el) => [...el.querySelectorAll('[slice-id]')].map((n) => n.getAttribute('slice-id')));
      expect(ids.length).toBeGreaterThanOrEqual(8);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      await page.waitForTimeout(100);
      expect(await page.evaluate((all) => all.filter((id) => !!slice.controller.getComponent(id)), ids)).toEqual([]);
   });
});

test.describe('DescriptionList — sheet', () => {
   const cell = (c, key) => row(c, key).locator('.slice-description-list__value');
   const sheet = async (mount, props = {}) => {
      const c = await mount('DescriptionList', { item: ORDER, variant: 'sheet', ...props });
      await withFields(c);
      await wide(c);
      return c;
   };

   test('a grid of cells: the first cell is the one tab stop', async ({ mount, page }) => {
      const c = await sheet(mount);
      await expect(c.component).toHaveAttribute('data-variant', 'sheet');
      await expect(c.locator('[data-cell][tabindex="0"]')).toHaveCount(1);
      await expect(cell(c, 'id')).toHaveAttribute('tabindex', '0');
      await expect(cell(c, 'email')).toHaveAttribute('aria-labelledby', /label-email/);
      // No pencils or copy buttons: the keyboard and the cell do that.
      await expect(c.locator('.slice-description-list__tool')).toHaveCount(0);
      await expect(cell(c, 'email')).toHaveAttribute('data-editable', '');
      await expect(cell(c, 'id')).toHaveAttribute('aria-readonly', 'true');
   });

   test('arrows, Home and End move the active cell; Tab too, until the edge', async ({ mount, page }) => {
      const c = await sheet(mount);
      await cell(c, 'id').focus();
      await page.keyboard.press('ArrowDown');
      await expect(cell(c, 'status')).toBeFocused();
      await expect(cell(c, 'status')).toHaveClass(/is-active/);
      await page.keyboard.press('Tab');
      await expect(cell(c, 'customer')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('ArrowUp');
      await expect(cell(c, 'id')).toBeFocused();
      await page.keyboard.press('End');
      await expect(cell(c, 'tags')).toBeFocused();
      await expect(c.locator('[data-cell][tabindex="0"]')).toHaveCount(1);
   });

   test('typing on a cell replaces its value; Enter saves through commit and goes down', async ({ mount, page }) => {
      const c = await sheet(mount);
      await c.component.evaluate((el) => {
         el._calls = [];
         el.commit = async ({ key, value }) => { el._calls.push([key, value]); };
      });
      await cell(c, 'email').click();
      await expect(cell(c, 'email')).toBeFocused();
      await page.keyboard.type('new@acme.com');
      const input = cell(c, 'email').locator('input');
      await expect(input).toHaveValue('new@acme.com');
      await page.keyboard.press('Enter');
      await expect(cell(c, 'email')).toContainText('new@acme.com');
      await expect(cell(c, 'total')).toBeFocused();
      expect(await c.component.evaluate((el) => el._calls)).toEqual([['email', 'new@acme.com']]);
   });

   test('F2 edits with the value and the caret at the end; Escape cancels and keeps the cell', async ({ mount, page }) => {
      const c = await sheet(mount);
      await cell(c, 'email').click();
      await page.keyboard.press('F2');
      const input = cell(c, 'email').locator('input');
      await expect(input).toBeFocused();
      await page.keyboard.type('.ve');
      await expect(input).toHaveValue('ana@acme.com.ve');
      await page.keyboard.press('Escape');
      await expect(cell(c, 'email')).toContainText('ana@acme.com');
      await expect(cell(c, 'email')).toBeFocused();
   });

   test('Tab saves and moves on; a click elsewhere saves too', async ({ mount, page }) => {
      const c = await sheet(mount);
      await cell(c, 'email').dblclick();
      const input = cell(c, 'email').locator('input');
      await input.fill('tab@acme.com');
      await page.keyboard.press('Tab');
      await expect(cell(c, 'total')).toBeFocused();
      await expect(cell(c, 'email')).toContainText('tab@acme.com');

      await cell(c, 'notes').dblclick();
      await cell(c, 'notes').locator('textarea').fill('Leave at the door');
      await cell(c, 'id').click();
      await expect(cell(c, 'notes')).toContainText('Leave at the door');
      await expect(cell(c, 'id')).toBeFocused();
   });

   test('a failed commit shows the old value back, the cell in red with the message', async ({ mount, page }) => {
      const c = await sheet(mount);
      await c.component.evaluate((el) => {
         el.commit = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Locked.')), 150));
      });
      await cell(c, 'email').click();
      await page.keyboard.type('x@acme.com');
      await page.keyboard.press('Enter');
      // At once: the typed value, busy; the active cell has moved on.
      await expect(cell(c, 'email')).toContainText('x@acme.com');
      await expect(row(c, 'email')).toHaveClass(/is-saving/);
      await expect(cell(c, 'total')).toBeFocused();
      await expect(row(c, 'email')).toHaveClass(/has-error/);
      await expect(row(c, 'email').locator('.slice-description-list__error')).toHaveText('The change could not be saved. Locked.');
      await expect(cell(c, 'email').locator('.slice-description-list__content')).toHaveText('ana@acme.com');
   });

   test('Space flips a boolean; Delete clears a value; Ctrl+C copies the cell', async ({ mount, page, context }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const c = await sheet(mount);
      await cell(c, 'gift').click();
      await page.keyboard.press('Space');
      await expect.poll(() => c.component.evaluate((el) => el.item.gift)).toBe(true);
      await expect(cell(c, 'gift')).toBeFocused();

      await cell(c, 'notes').click();
      await page.keyboard.type('Fragile');
      await page.keyboard.press('Alt+Enter');
      await page.keyboard.type('This side up');
      await page.keyboard.press('Enter');
      await expect.poll(() => c.component.evaluate((el) => el.item.notes)).toBe('Fragile\nThis side up');
      await cell(c, 'notes').click();
      await page.keyboard.press('Delete');
      await expect.poll(() => c.component.evaluate((el) => el.item.notes)).toBe(null);
      await expect(cell(c, 'notes')).toContainText('—');

      await cell(c, 'email').click();
      await page.keyboard.press('Control+c');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ana@acme.com');
      // A required field is not cleared by Delete.
      await page.keyboard.press('Delete');
      expect(await c.component.evaluate((el) => el.item.email)).toBe('ana@acme.com');
   });

   test('fast typing: keys and Enter pressed before the editor is built are kept', async ({ mount, page }) => {
      const c = await sheet(mount);
      await cell(c, 'total').click();
      // No waiting between keys: the editor is built while they arrive.
      await page.keyboard.type('150', { delay: 0 });
      await page.keyboard.press('Enter');
      await expect.poll(() => c.component.evaluate((el) => el.item.total)).toBe(150);
      await expect(cell(c, 'createdAt')).toBeFocused();
   });

   test('a select saves the moment a choice is made', async ({ mount, page }) => {
      const c = await sheet(mount);
      await cell(c, 'priority').click();
      await page.keyboard.press('Enter');
      const select = cell(c, 'priority').locator('slice-select');
      await expect(select).toHaveCount(1);
      await select.evaluate((el) => { el.selected = 'high'; el._onChange?.call(el, el.selected, el.selectedOptions); });
      await expect.poll(() => c.component.evaluate((el) => el.item.priority)).toBe('high');
      await expect(cell(c, 'priority').locator('slice-select')).toHaveCount(0);
   });

   test('grid layout: up and down follow the column', async ({ mount, page }) => {
      const c = await sheet(mount, { layout: 'grid', columns: 2 });
      await cell(c, 'id').focus();
      await page.keyboard.press('ArrowDown');
      await expect(cell(c, 'customer')).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(cell(c, 'email')).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(cell(c, 'status')).toBeFocused();
   });

   test('a hidden row is skipped and never the tab stop', async ({ mount, page }) => {
      const c = await sheet(mount);
      await c.component.evaluate((el) => { el.hideEmpty = true; });
      await expect(row(c, 'notes')).toBeHidden();
      await cell(c, 'createdAt').focus();
      await page.keyboard.press('ArrowDown');
      await expect(cell(c, 'priority')).toBeFocused();
   });
});

test.describe('DescriptionList — before the record arrives', () => {
   test('render is not called without a record; with load, the first paint is the skeleton', async ({ mount, page }) => {
      const c = await mount('DescriptionList', {});
      await c.component.evaluate((el) => {
         el.fields = [{ key: 'ratio', render: (_, item) => `${item.a / item.b}` }, 'name'];
      });
      expect(c.pageErrors()).toEqual([]);
      await expect(c.locator('.slice-description-list__field[data-key="ratio"] .slice-description-list__content')).toHaveText('—');
      const first = await page.evaluate(async () => {
         const view = await slice.build('DescriptionList', {
            fields: ['name'],
            load: () => new Promise((r) => setTimeout(() => r({ name: 'Ana' }), 300)),
         });
         const shown = view.querySelectorAll('.slice-description-list__skeleton').length;
         slice.controller.destroyComponent(view);
         return shown;
      });
      expect(first).toBe(1);
   });
});