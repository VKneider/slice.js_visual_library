import { test, expect } from '../../../playwright/harness/sliceFixtures.js';

test.describe('Controller — destroy lifecycle', () => {

  test('destroyComponent by sliceId removes from activeComponents and DOM', async ({ mount, page }) => {
    const c = await mount('Button', { value: 'Test' });
    await expect(c.component).toBeVisible();

    const sliceId = await page.evaluate(() => window.__sliceMounted.sliceId);
    expect(
      await page.evaluate((id) => window.slice.controller.activeComponents.has(id), sliceId)
    ).toBe(true);

    const destroyed = await page.evaluate(
      (id) => window.slice.controller.destroyComponent(id), sliceId
    );
    expect(destroyed).toBe(1);

    expect(
      await page.evaluate((id) => window.slice.controller.activeComponents.has(id), sliceId)
    ).toBe(false);

    await expect(page.locator('[data-test-root] > *')).toHaveCount(0);
  });

  test('destroyComponent by component reference', async ({ mount, page }) => {
    await mount('Button', { value: 'Ref' });

    const sliceId = await page.evaluate(() => window.__sliceMounted.sliceId);
    const destroyed = await page.evaluate((id) => {
      const comp = window.slice.controller.activeComponents.get(id);
      return window.slice.controller.destroyComponent(comp);
    }, sliceId);
    expect(destroyed).toBe(1);
    expect(
      await page.evaluate((id) => window.slice.controller.activeComponents.has(id), sliceId)
    ).toBe(false);
  });

  test('destroyByContainer removes mounted components from activeComponents', async ({ mount, page }) => {
    const sizeBefore = await page.evaluate(() => window.slice.controller.activeComponents.size);

    await mount('Button', { value: 'A' });
    await page.evaluate(async () => {
      const root = document.querySelector('[data-test-root]');
      root.appendChild(await window.slice.build('Button', { value: 'B' }));
    });

    const sizeWithMounted = await page.evaluate(() => window.slice.controller.activeComponents.size);
    expect(sizeWithMounted).toBe(sizeBefore + 2);

    const destroyed = await page.evaluate(() =>
      window.slice.controller.destroyByContainer(document.querySelector('[data-test-root]'))
    );
    expect(destroyed).toBe(2);

    const sizeAfter = await page.evaluate(() => window.slice.controller.activeComponents.size);
    expect(sizeAfter).toBe(sizeBefore);
  });

  test('destroyComponent cascades to child components', async ({ mount, page }) => {
    const sizeBefore = await page.evaluate(() => window.slice.controller.activeComponents.size);

    const c = await mount('Table', {
      columns: [{ key: 'n', label: 'N' }],
      rows: Array.from({ length: 25 }, (_, i) => ({ n: `item${i}` })),
      pagination: { pageSize: 10 },
    });
    await expect(c.locator('.slice-pagination')).toBeVisible();

    const idsBefore = await page.evaluate(() => ({
      size: window.slice.controller.activeComponents.size,
      allIds: Array.from(window.slice.controller.activeComponents.keys()),
    }));
    expect(idsBefore.size).toBeGreaterThanOrEqual(sizeBefore + 2);

    const sliceId = await page.evaluate(() => window.__sliceMounted.sliceId);

    const childIdsBefore = await page.evaluate((parentId) => {
      const children = window.slice.controller.childrenIndex.get(parentId);
      return children ? Array.from(children) : [];
    }, sliceId);
    expect(childIdsBefore.length).toBeGreaterThanOrEqual(1);

    const destroyed = await page.evaluate(
      (id) => window.slice.controller.destroyComponent(id), sliceId
    );
    expect(destroyed).toBeGreaterThanOrEqual(1 + childIdsBefore.length);

    const idsAfter = await page.evaluate(() => ({
      size: window.slice.controller.activeComponents.size,
      allIds: Array.from(window.slice.controller.activeComponents.keys()),
    }));

    expect(idsAfter.allIds).not.toContain(sliceId);
    for (const childId of childIdsBefore) {
      expect(idsAfter.allIds).not.toContain(childId);
    }
  });

  test('destroyByContainer with nested and sibling components', async ({ mount, page }) => {
    const sizeBefore = await page.evaluate(() => window.slice.controller.activeComponents.size);

    const c = await mount('Table', {
      columns: [{ key: 'n', label: 'N' }],
      rows: Array.from({ length: 25 }, (_, i) => ({ n: `item${i}` })),
      pagination: { pageSize: 10 },
    });
    await expect(c.locator('.slice-pagination')).toBeVisible();

    const tableSliceId = await page.evaluate(() => window.__sliceMounted.sliceId);

    const childIdsBefore = await page.evaluate((parentId) => {
      const children = window.slice.controller.childrenIndex.get(parentId);
      return children ? Array.from(children) : [];
    }, tableSliceId);
    expect(childIdsBefore.length).toBeGreaterThanOrEqual(1);

    await page.evaluate(async () => {
      const root = document.querySelector('[data-test-root]');
      root.appendChild(await window.slice.build('Button', { value: 'Extra' }));
    });

    const sizeWithAll = await page.evaluate(() => window.slice.controller.activeComponents.size);
    expect(sizeWithAll).toBeGreaterThanOrEqual(sizeBefore + 2 + childIdsBefore.length);

    const destroyed = await page.evaluate(() =>
      window.slice.controller.destroyByContainer(document.querySelector('[data-test-root]'))
    );
    expect(destroyed).toBeGreaterThanOrEqual(1 + childIdsBefore.length + 1);

    const idsAfter = await page.evaluate(() => ({
      size: window.slice.controller.activeComponents.size,
      allIds: Array.from(window.slice.controller.activeComponents.keys()),
    }));
    expect(idsAfter.size).toBe(sizeBefore);
    expect(idsAfter.allIds).not.toContain(tableSliceId);
    for (const childId of childIdsBefore) {
      expect(idsAfter.allIds).not.toContain(childId);
    }
  });

  test('destroyComponent on non-existent sliceId returns 0', async ({ mount, page }) => {
    await mount('Button');
    const count = await page.evaluate(
      () => window.slice.controller.destroyComponent('no-such-id')
    );
    expect(count).toBe(0);
  });

  test('destroyByContainer on empty container returns 0', async ({ mount, page }) => {
    await mount('Button');
    const count = await page.evaluate(() => {
      const div = document.createElement('div');
      return window.slice.controller.destroyByContainer(div);
    });
    expect(count).toBe(0);
  });

  test('destroyComponent with null/undefined returns 0 gracefully', async ({ mount, page }) => {
    await mount('Button');
    const nullCount = await page.evaluate(
      () => window.slice.controller.destroyComponent(null)
    );
    expect(nullCount).toBe(0);
  });

  test('destroyByPattern matches sliceIds by regex', async ({ mount, page }) => {
    const sizeBefore = await page.evaluate(() => window.slice.controller.activeComponents.size);

    await mount('Button', { value: 'Alpha' });
    await page.evaluate(async () => {
      const root = document.querySelector('[data-test-root]');
      root.appendChild(await window.slice.build('Button', { value: 'Beta' }));
    });

    const mountIds = await page.evaluate(() =>
      Array.from(window.slice.controller.activeComponents.keys())
        .filter((id) => id.startsWith('button-'))
    );
    expect(mountIds.length).toBe(2);

    const destroyed = await page.evaluate(
      () => window.slice.controller.destroyByPattern(/^button-/)
    );
    expect(destroyed).toBe(2);

    const remainingButtons = await page.evaluate(() =>
      Array.from(window.slice.controller.activeComponents.keys())
        .filter((id) => id.startsWith('button-'))
    );
    expect(remainingButtons.length).toBe(0);

    const sizeAfter = await page.evaluate(() => window.slice.controller.activeComponents.size);
    expect(sizeAfter).toBe(sizeBefore);
  });

  test('destroyByPattern with string pattern', async ({ mount, page }) => {
    await mount('Button', { value: 'X' });
    const sliceId = await page.evaluate(() => window.__sliceMounted.sliceId);
    const prefix = sliceId.split('-')[0];

    const destroyed = await page.evaluate(
      (p) => window.slice.controller.destroyByPattern(p), prefix
    );
    expect(destroyed).toBe(1);
    expect(
      await page.evaluate((id) => window.slice.controller.activeComponents.has(id), sliceId)
    ).toBe(false);
  });

  test('destroyByPattern with no match returns 0', async ({ mount, page }) => {
    await mount('Button');
    const count = await page.evaluate(
      () => window.slice.controller.destroyByPattern(/^zzz-nothing-/)
    );
    expect(count).toBe(0);
  });

  test('beforeDestroy runs and cleans up Service children', async ({ mount, page }) => {
    const sizeBefore = await page.evaluate(() => window.slice.controller.activeComponents.size);

    const c = await mount('Table', {
      columns: [{ key: 'n', label: 'N' }],
      rows: [{ n: '1' }],
      pagination: { pageSize: 10 },
    });
    await expect(c.locator('.slice-pagination')).toBeVisible();

    const allIds = await page.evaluate(() =>
      Array.from(window.slice.controller.activeComponents.keys())
    );
    const engineId = allIds.find((id) => id.startsWith('slice-table-grid-'));
    expect(engineId).toBeTruthy();

    const sliceId = await page.evaluate(() => window.__sliceMounted.sliceId);
    await page.evaluate(
      (id) => window.slice.controller.destroyComponent(id), sliceId
    );

    const remaining = await page.evaluate(() =>
      Array.from(window.slice.controller.activeComponents.keys())
    );
    expect(remaining).not.toContain(engineId);
    expect(remaining).not.toContain(sliceId);
    expect(
      await page.evaluate(() => window.slice.controller.activeComponents.size)
    ).toBe(sizeBefore);
  });

  test('destroyComponent with mixed array of sliceIds and references', async ({ mount, page }) => {
    const sizeBefore = await page.evaluate(() => window.slice.controller.activeComponents.size);

    await mount('Button', { value: 'A' });
    const idA = await page.evaluate(() => window.__sliceMounted.sliceId);

    await page.evaluate(async () => {
      const root = document.querySelector('[data-test-root]');
      root.appendChild(await window.slice.build('Button', { value: 'B' }));
    });
    const idB = await page.evaluate((a) =>
      Array.from(window.slice.controller.activeComponents.keys())
        .find((id) => id !== a && id.startsWith('button-')),
      idA
    );

    const destroyed = await page.evaluate(([a, b]) =>
      window.slice.controller.destroyComponent([a, b]), [idA, idB]
    );
    expect(destroyed).toBe(2);

    const sizeAfter = await page.evaluate(() => window.slice.controller.activeComponents.size);
    expect(sizeAfter).toBe(sizeBefore);
  });

  test('destroyComponent with duplicate entries counts each once', async ({ mount, page }) => {
    await mount('Button');
    const sliceId = await page.evaluate(() => window.__sliceMounted.sliceId);

    const destroyed = await page.evaluate((id) =>
      window.slice.controller.destroyComponent([id, id, id]), sliceId
    );
    expect(destroyed).toBe(1);
  });

  test('destroyComponent twice on same component is idempotent', async ({ mount, page }) => {
    await mount('Button');
    const sliceId = await page.evaluate(() => window.__sliceMounted.sliceId);

    const first = await page.evaluate(
      (id) => window.slice.controller.destroyComponent(id), sliceId
    );
    expect(first).toBe(1);

    const second = await page.evaluate(
      (id) => window.slice.controller.destroyComponent(id), sliceId
    );
    expect(second).toBe(0);
  });

  test('destroyComponent with empty array returns 0', async ({ mount, page }) => {
    await mount('Button');
    const count = await page.evaluate(
      () => window.slice.controller.destroyComponent([])
    );
    expect(count).toBe(0);
  });

  test('destroyComponent with mixed valid and invalid array', async ({ mount, page }) => {
    await mount('Button', { value: 'A' });
    const validId = await page.evaluate(() => window.__sliceMounted.sliceId);

    const destroyed = await page.evaluate((id) =>
      window.slice.controller.destroyComponent([id, null, 'non-existent']), validId
    );
    expect(destroyed).toBe(1);
  });

  test('destroyByContainer with null returns 0', async ({ mount, page }) => {
    await mount('Button');
    const count = await page.evaluate(
      () => window.slice.controller.destroyByContainer(null)
    );
    expect(count).toBe(0);
  });

  test('destroyByContainer with undefined returns 0', async ({ mount, page }) => {
    await mount('Button');
    const count = await page.evaluate(
      () => window.slice.controller.destroyByContainer(undefined)
    );
    expect(count).toBe(0);
  });

  test('destroyByPattern with null pattern returns 0 gracefully', async ({ mount, page }) => {
    await mount('Button');
    const count = await page.evaluate(
      () => window.slice.controller.destroyByPattern(null)
    );
    expect(count).toBe(0);
  });

});
