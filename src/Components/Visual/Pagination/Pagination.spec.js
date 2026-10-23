import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const page = (c, n) => c.locator(`.slice-pagination__pages [data-page="${n}"]`);
const prev = (c) => c.locator('[data-rel="prev"]');
const next = (c) => c.locator('[data-rel="next"]');

test.describe('Pagination — pages', () => {
   test('smoke: a labelled nav with prev, pages and next', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 1, totalPages: 5 });
      expect(c.pageErrors()).toEqual([]);
      await expect(c.locator('nav')).toHaveAttribute('aria-label', 'Pagination');
      await expect(c.locator('.slice-pagination__pages .slice-pagination__item')).toHaveText(['1', '2', '3', '4', '5']);
      await expect(prev(c)).toHaveAttribute('aria-label', 'Previous page');
      await expect(prev(c)).toBeDisabled();
      await expect(c.locator('.slice-pagination__ellipsis')).toHaveCount(0);
   });

   test('the current page is marked, and ellipses shorten long ranges', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 10, totalPages: 20 });
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('10');
      await expect(c.locator('.slice-pagination__item--current')).toHaveAttribute('aria-current', 'page');
      await expect(c.locator('.slice-pagination__pages > *')).toHaveText(['1', '…', '9', '10', '11', '…', '20']);
   });

   test('siblingCount and boundaryCount widen the range', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 10, totalPages: 20, siblingCount: 2, boundaryCount: 2 });
      await expect(c.locator('.slice-pagination__pages > *')).toHaveText(['1', '2', '…', '8', '9', '10', '11', '12', '…', '19', '20']);
   });

   test('a click moves to the page and reports it with the previous one', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 1, totalPages: 5 }, { spies: ['onPageChange'] });
      await page(c, 3).click();
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('3');
      const [[pageArg, info]] = await c.eventArgs('onPageChange');
      expect(pageArg).toBe(3);
      expect(info.previous).toBe(1);
      await next(c).click();
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('4');
   });

   test('the focus stays on Next while it is used to page through', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 1, totalPages: 5 });
      await next(c).focus();
      await next(c).press('Enter');
      await next(c).press('Enter');
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('3');
      await expect(next(c)).toBeFocused();
   });

   test('controlled: only reports, and waits for currentPage', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 1, totalPages: 5, controlled: true }, { spies: ['onPageChange'] });
      await page(c, 4).click();
      expect((await c.eventArgs('onPageChange'))[0][0]).toBe(4);
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('1');
      await c.component.evaluate((p) => { p.currentPage = 4; });
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('4');
   });

   test('clicking the current page reports nothing; disabled blocks everything', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 2, totalPages: 5 }, { spies: ['onPageChange'] });
      await page(c, 2).click();
      expect(await c.events('onPageChange')).toBe(0);
      await c.component.evaluate((p) => { p.disabled = true; });
      await expect(page(c, 3)).toBeDisabled();
      await page(c, 3).click({ force: true });
      expect(await c.events('onPageChange')).toBe(0);
   });

   test('goTo, next() and previous() clamp to the range', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 2, totalPages: 5 });
      await c.component.evaluate((p) => p.goTo(99));
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('5');
      await c.component.evaluate((p) => { p.previous(); p.previous(); });
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('3');
   });

   test('showFirstLast and showLabels', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 3, totalPages: 9, showFirstLast: true, showLabels: true });
      await expect(c.locator('[aria-label="First page"]')).toBeEnabled();
      await expect(c.locator('[aria-label="Last page"]')).toBeEnabled();
      await expect(prev(c)).toHaveText('Previous');
      await expect(next(c)).toHaveText('Next');
      await c.locator('[aria-label="Last page"]').click();
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('9');
   });
});

test.describe('Pagination — items, sizes and jump', () => {
   test('totalItems and pageSize give the pages and the range on screen', async ({ mount }) => {
      const c = await mount('Pagination', { totalItems: 342, pageSize: 20, currentPage: 3, showInfo: true });
      expect(await c.component.evaluate((p) => p.totalPages)).toBe(18);
      await expect(c.locator('.slice-pagination__info')).toHaveText('41–60 of 342');
      await c.component.evaluate((p) => { p.currentPage = 18; });
      await expect(c.locator('.slice-pagination__info')).toHaveText('341–342 of 342');
      await c.component.evaluate((p) => { p.totalItems = 0; });
      await expect(c.locator('.slice-pagination__info')).toHaveText('No results');
   });

   test('changing the page size keeps the first item on screen in view', async ({ mount, page: pw }) => {
      const c = await mount('Pagination', { totalItems: 200, pageSize: 10, currentPage: 5, pageSizes: [10, 20, 50] }, { spies: ['onPageSizeChange', 'onPageChange'] });
      await expect(c.locator('slice-select')).toBeVisible();
      // Item 41 is on page 5 of 10 rows, and on page 3 of 20 rows.
      await c.component.evaluate((p) => p._sizeSelect.onChange('20'));
      expect((await c.eventArgs('onPageSizeChange'))[0][0]).toBe(20);
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('3');
      expect(await c.component.evaluate((p) => p.totalPages)).toBe(10);
   });

   test('the jump box goes to the typed page', async ({ mount }) => {
      const c = await mount('Pagination', { totalPages: 40, showJump: true });
      const box = c.locator('.slice-pagination__jump');
      await box.fill('27');
      await box.press('Enter');
      await expect(c.locator('.slice-pagination__item--current')).toHaveText('27');
      await expect(box).toHaveValue('');
   });
});

test.describe('Pagination — modes and links', () => {
   test('compact says "Page 3 of 12" between previous and next', async ({ mount }) => {
      const c = await mount('Pagination', { mode: 'compact', currentPage: 3, totalPages: 12 });
      await expect(c.locator('.slice-pagination__compact')).toHaveText('Page 3 of 12');
      await expect(c.locator('.slice-pagination__compact')).toBeVisible();
      await expect(c.locator('.slice-pagination__pages')).toBeHidden();
   });

   test('a narrow container turns the pages into the compact form', async ({ mount, page: pw }) => {
      const c = await mount('Pagination', { currentPage: 7, totalPages: 30 });
      await c.component.evaluate((p) => { p.style.width = '300px'; });
      await expect(c.locator('.slice-pagination__pages')).toBeHidden();
      await expect(c.locator('.slice-pagination__compact')).toBeVisible();
      await c.component.evaluate((p) => { p.style.width = '800px'; });
      await expect(c.locator('.slice-pagination__pages')).toBeVisible();
   });

   test('dots: one per page, named for screen readers', async ({ mount }) => {
      const c = await mount('Pagination', { mode: 'dots', currentPage: 2, totalPages: 4 });
      await expect(c.locator('.slice-pagination__item--dot')).toHaveCount(4);
      await expect(c.locator('.slice-pagination__item--dot').nth(1)).toHaveAttribute('aria-current', 'page');
      await c.locator('.slice-pagination__item--dot[aria-label="Page 4"]').click();
      await expect(c.locator('.slice-pagination__item--dot').nth(3)).toHaveAttribute('aria-current', 'page');
   });

   test('hrefTemplate renders real links with rel prev / next', async ({ mount }) => {
      const c = await mount('Pagination', { currentPage: 2, totalPages: 5, hrefTemplate: '?page={page}' });
      await expect(page(c, 4)).toHaveAttribute('href', '?page=4');
      await expect(next(c)).toHaveAttribute('rel', 'next');
      await expect(c.locator('.slice-pagination__item--current')).not.toHaveAttribute('href');
   });

   test('texts translate every word', async ({ mount }) => {
      const c = await mount('Pagination', {
         totalItems: 50, pageSize: 10, showInfo: true, showLabels: true,
         texts: { label: 'Paginación', previous: 'Anterior', next: 'Siguiente', page: 'Página {page}', info: '{from}–{to} de {total}' },
      });
      await expect(c.locator('nav')).toHaveAttribute('aria-label', 'Paginación');
      await expect(next(c)).toHaveText('Siguiente');
      await expect(page(c, 2)).toHaveAttribute('aria-label', 'Página 2');
      await expect(c.locator('.slice-pagination__info')).toHaveText('1–10 de 50');
   });
});

test.describe('Pagination — looks and lifecycle', () => {
   test('variant, shape, size and align', async ({ mount }) => {
      const c = await mount('Pagination', { totalPages: 5, variant: 'segmented', shape: 'circle', size: 'lg', align: 'center' });
      await expect(c.component).toHaveClass(/slice-pagination--segmented/);
      await expect(c.component).toHaveAttribute('data-shape', 'circle');
      await expect(c.component).toHaveAttribute('data-size', 'lg');
      await expect(c.component).toHaveAttribute('data-align', 'center');
      await c.component.evaluate((p) => { p.variant = 'nope'; });
      await expect(c.component).toHaveClass(/slice-pagination--outlined/);
   });

   test('every variant fills or marks the current page differently from the rest', async ({ mount }) => {
      for (const variant of ['outlined', 'soft', 'ghost', 'segmented', 'underline']) {
         const c = await mount('Pagination', { totalPages: 3, currentPage: 2, variant });
         const [current, other] = await Promise.all([
            c.locator('.slice-pagination__item--current').evaluate((el) => { const s = getComputedStyle(el); return s.backgroundColor + s.color + s.boxShadow; }),
            page(c, 1).evaluate((el) => { const s = getComputedStyle(el); return s.backgroundColor + s.color + s.boxShadow; }),
         ]);
         expect(current, variant).not.toBe(other);
      }
   });

   test('destroying it destroys the page-size Select', async ({ mount, page: pw }) => {
      const c = await mount('Pagination', { totalItems: 100, pageSizes: [10, 25] });
      const id = await c.component.evaluate((p) => p.querySelector('slice-select').sliceId);
      await c.component.evaluate((p) => slice.controller.destroyComponent(p));
      expect(await pw.evaluate((id) => !!slice.controller.getComponent(id), id)).toBe(false);
   });
});