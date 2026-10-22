import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const liveToasts = (page) => page.evaluate(() =>
  [...slice.controller.activeComponents.values()].filter((c) => c.tagName === 'SLICE-TOAST').map((c) => c.sliceId));

// Always through the framework: { singleton: true } returns the one shared
// provider, so every page.evaluate gets the same instance back.
async function provider(page, mount) {
  await mount('Badge', { value: 'host' });
  await page.evaluate(async () => {
    await slice.build('ToastProvider', { singleton: true });
    await new Promise((r) => setTimeout(r, 200));   // let the pool pre-warm
  });
}

test.describe('ToastProvider', () => {
  test('shows a toast and takes it off the page when it expires', async ({ mount, page }) => {
    await provider(page, mount);
    await page.evaluate(async () => (await slice.build('ToastProvider', { singleton: true })).show('Saved', { type: 'success', duration: 300 }));
    await expect(page.locator('slice-toast', { hasText: 'Saved' })).toBeVisible();
    await expect(page.locator('slice-toast')).toHaveCount(0, { timeout: 3000 });
  });

  test('reuses pooled toasts instead of building new ones', async ({ mount, page }) => {
    await provider(page, mount);
    const before = await liveToasts(page);
    expect(before).toHaveLength(1);   // the pre-warmed one

    for (let round = 0; round < 3; round++) {
      await page.evaluate(async () => (await slice.build('ToastProvider', { singleton: true })).show('Again', { duration: 100 }));
      await expect(page.locator('slice-toast')).toHaveCount(0, { timeout: 3000 });
    }
    expect(await liveToasts(page)).toEqual(before);
  });

  test('a burst never owns more than maxToasts once it settles, and nothing is left registered beyond the pool', async ({ mount, page }) => {
    await provider(page, mount);
    await page.evaluate(async () => {
      const toasts = await slice.build('ToastProvider', { singleton: true });
      for (let i = 0; i < 12; i++) await toasts.show(`burst ${i}`, { duration: 300 });
    });
    // Never more than 5 showing at once; the overflow is animating out.
    expect(await page.locator('slice-toast .slice-toast:not(.slice-toast--exiting)').count()).toBeLessThanOrEqual(5);
    await expect(page.locator('slice-toast')).toHaveCount(0, { timeout: 4000 });
    await expect.poll(async () => (await liveToasts(page)).length).toBeLessThanOrEqual(5);
    expect(await page.evaluate(async () => (await slice.build('ToastProvider', { singleton: true })).poolSize))
      .toBe((await liveToasts(page)).length);
  });

  test('a reused toast starts clean: message, type, colours and the close button', async ({ mount, page }) => {
    await provider(page, mount);
    await page.evaluate(async () => (await slice.build('ToastProvider', { singleton: true })).show('Locked', {
      type: 'error', dismissable: false, duration: 150, customColor: { background: 'rgb(1, 2, 3)' }
    }));
    await expect(page.locator('slice-toast')).toHaveCount(0, { timeout: 3000 });

    await page.evaluate(async () => (await slice.build('ToastProvider', { singleton: true })).show('Fresh', { type: 'info', duration: 0 }));
    const toast = page.locator('slice-toast', { hasText: 'Fresh' });
    await expect(toast).toBeVisible();
    await expect(toast.locator('.slice-toast')).toHaveClass(/slice-toast--info/);
    await expect(toast.locator('.slice-toast')).not.toHaveClass(/slice-toast--error|slice-toast--exiting/);
    expect(await toast.locator('.slice-toast').evaluate((el) => el.style.getPropertyValue('--toast-bg'))).toBe('');
    await toast.locator('.slice-toast__close').click();
    await expect(page.locator('slice-toast')).toHaveCount(0, { timeout: 3000 });
  });

  test('dismiss() and clear() return toasts to the pool', async ({ mount, page }) => {
    await provider(page, mount);
    await page.evaluate(async () => {
      const toasts = await slice.build('ToastProvider', { singleton: true });
      const id = await toasts.show('one', { duration: 0 });
      await toasts.show('two', { duration: 0 });
      await toasts.show('three', { duration: 0 });
      toasts.dismiss(id);
      toasts.clear();
    });
    await expect(page.locator('slice-toast')).toHaveCount(0, { timeout: 3000 });
    const ids = await liveToasts(page);
    expect(ids).toHaveLength(3);
    expect(await page.evaluate(async () => (await slice.build('ToastProvider', { singleton: true })).poolSize)).toBe(3);
  });

  test('destroying the provider destroys every toast it owns', async ({ mount, page }) => {
    await provider(page, mount);
    await page.evaluate(async () => {
      const toasts = await slice.build('ToastProvider', { singleton: true });
      await toasts.show('on screen', { duration: 0 });
      slice.controller.destroyComponent(toasts);
    });
    expect(await liveToasts(page)).toEqual([]);
    await expect(page.locator('slice-toast')).toHaveCount(0);
  });

  test('{ singleton: true } shares one provider; a second plain build warns', async ({ mount, page }) => {
    await provider(page, mount);
    const same = await page.evaluate(async () =>
      (await slice.build('ToastProvider', { singleton: true })) === (await slice.build('ToastProvider', { singleton: true })));
    expect(same).toBe(true);

    const warned = await page.evaluate(async () => {
      const seen = [];
      const original = slice.logger.logWarning.bind(slice.logger);
      slice.logger.logWarning = (id, msg, ...rest) => { seen.push(String(msg)); return original(id, msg, ...rest); };
      const extra = await slice.build('ToastProvider');
      slice.logger.logWarning = original;
      slice.controller.destroyComponent(extra);
      return seen.some((m) => m.includes('singleton: true'));
    });
    expect(warned).toBe(true);
  });
});