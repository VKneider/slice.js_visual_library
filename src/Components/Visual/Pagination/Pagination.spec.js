import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('Pagination', () => {
  test('smoke: builds and mounts without errors', async ({ mount }) => {
    const c = await mount('Pagination', { currentPage: 1, totalPages: 5 });
    expect(c.pageErrors()).toEqual([]);
  });

  test('renders a page button per page when the range fits (no ellipsis)', async ({ mount }) => {
    const c = await mount('Pagination', { currentPage: 1, totalPages: 5 });
    // 5 page numbers + prev + next = 7 controls, no ellipsis.
    await expect(c.locator('.slice-pagination__item')).toHaveCount(7);
    await expect(c.locator('.slice-pagination__ellipsis')).toHaveCount(0);
  });

  test('marks the current page with aria-current', async ({ mount }) => {
    const c = await mount('Pagination', { currentPage: 3, totalPages: 5 });
    const current = c.locator('.slice-pagination__item--current');
    await expect(current).toHaveText('3');
    await expect(current).toHaveAttribute('aria-current', 'page');
  });

  test('clicking a page emits onPageChange with that page', async ({ mount }) => {
    const c = await mount('Pagination', { currentPage: 1, totalPages: 5 }, { spies: ['onPageChange'] });
    await c.locator('.slice-pagination__item[data-page="3"]').click();
    await expect(async () => {
      expect(await c.eventArgs('onPageChange')).toEqual([[3]]);
    }).toPass({ timeout: 3000 });
  });

  test('prev/next are disabled at the boundaries', async ({ mount }) => {
    const first = await mount('Pagination', { currentPage: 1, totalPages: 5 });
    await expect(first.locator('.slice-pagination__item[data-page="0"]')).toBeDisabled();

    const last = await mount('Pagination', { currentPage: 5, totalPages: 5 });
    await expect(last.locator('.slice-pagination__item[data-page="6"]')).toBeDisabled();
  });

  test('clicking the current page does not emit', async ({ mount }) => {
    const c = await mount('Pagination', { currentPage: 3, totalPages: 5 }, { spies: ['onPageChange'] });
    await c.locator('.slice-pagination__item--current').click();
    await c.locator('.slice-pagination__item[aria-label="Page 4"]').click();
    await expect(async () => {
      expect(await c.eventArgs('onPageChange')).toEqual([[4]]);
    }).toPass({ timeout: 3000 });
  });

  test('renders ellipses for large ranges', async ({ mount }) => {
    const c = await mount('Pagination', { currentPage: 10, totalPages: 20 });
    await expect(c.locator('.slice-pagination__ellipsis')).toHaveCount(2);
    // Window around 10: pages 9, 10, 11 are present.
    await expect(c.locator('.slice-pagination__item[aria-label="Page 9"]')).toHaveCount(1);
    await expect(c.locator('.slice-pagination__item[aria-label="Page 11"]')).toHaveCount(1);
  });

  test('disabled prop blocks navigation clicks', async ({ mount }) => {
    const c = await mount('Pagination', { currentPage: 1, totalPages: 5, disabled: true }, { spies: ['onPageChange'] });
    await c.locator('.slice-pagination__item[data-page="3"]').click({ force: true });
    await c.locator('.slice-pagination').waitFor();
    expect(await c.events('onPageChange')).toBe(0);
  });

  test('showFirstLast renders first/last controls', async ({ mount }) => {
    const c = await mount('Pagination', { currentPage: 3, totalPages: 10, showFirstLast: true });
    await expect(c.locator('.slice-pagination__item[aria-label="First page"]')).toHaveCount(1);
    await expect(c.locator('.slice-pagination__item[aria-label="Last page"]')).toHaveCount(1);
  });
});
