import { test, expect } from '../playwright/harness/sliceFixtures.js';

// Markdown tables are rendered at runtime (a Table component built from the
// rows the parser emits), so these assertions run in the browser, not on the
// raw HTML. They cover the one thing the parser cannot guarantee alone: that a
// row keeps all of its columns.

test.describe('Documentation tables @server', () => {
  test('a cell with an escaped pipe does not swallow the rest of the row', async ({ page }) => {
    await page.goto('/docs/services/fetch-manager');
    await expect(page.locator('h1')).toContainText('FetchManager');

    // | `retry` | `number \| { attempts, delay, statuses }` | `0` | Retries … |
    const row = page.locator('table tr').filter({ hasText: 'attempts, delay, statuses' }).first();
    await expect(row).toBeVisible();

    const cells = row.locator('td');
    await expect(cells).toHaveCount(4);
    await expect(cells.nth(1)).toContainText('number | { attempts, delay, statuses }');
    await expect(cells.nth(3)).toContainText('Retry-After');
  });

  test('no table row loses its last column', async ({ page }) => {
    // The header decides the width; every row must have as many cells as it.
    for (const path of ['/docs/services/fetch-manager', '/docs/services/query-service']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('table').first()).toBeVisible();

      const widths = await page.evaluate(() =>
        [...document.querySelectorAll('table')].map((table) => {
          const head = table.querySelectorAll('thead th').length;
          const short = [...table.querySelectorAll('tbody tr')].filter(
            (tr) => tr.querySelectorAll('td').length !== head
          ).length;
          return { head, short };
        })
      );

      for (const width of widths) {
        expect(width.head, `${path}: a table without headers`).toBeGreaterThan(0);
        expect(width.short, `${path}: rows with fewer cells than headers`).toBe(0);
      }
    }
  });
});
