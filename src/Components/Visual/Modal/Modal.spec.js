import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('Modal', () => {
  test('smoke: builds and mounts without errors', async ({ mount }) => {
    const c = await mount('Modal', { title: 'Hello' });
    expect(c.pageErrors()).toEqual([]);
  });

  test('title is rendered', async ({ mount }) => {
    const c = await mount('Modal', { title: 'Confirm action' });
    await expect(c.locator('.slice-modal__title')).toHaveText('Confirm action');
  });

  test('open=true calls showModal and opens the dialog', async ({ mount }) => {
    const c = await mount('Modal', { title: 'Open', open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    await expect(c.locator('.slice-modal')).toHaveAttribute('open', '');
  });

  test('open prop drives the dialog after mount', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Reactive' });
    await expect(c.locator('.slice-modal')).not.toBeVisible();
    await page.evaluate(() => { window.__sliceMounted.open = true; });
    await expect(c.locator('.slice-modal')).toBeVisible();
    await page.evaluate(() => { window.__sliceMounted.open = false; });
    await expect(c.locator('.slice-modal')).not.toBeVisible();
  });

  test('close button hides the modal', async ({ mount }) => {
    const c = await mount('Modal', { title: 'Dismiss', open: true });
    await c.locator('.slice-modal__close').click();
    await expect(c.locator('.slice-modal')).not.toBeVisible();
  });

  test('dismissable=false hides close button', async ({ mount }) => {
    const c = await mount('Modal', { title: 'No close', dismissable: false });
    await expect(c.locator('.slice-modal__close')).not.toBeVisible();
  });

  test('onClose fires when modal is closed', async ({ mount }) => {
    const c = await mount('Modal', { title: 'Callback', open: true }, { spies: ['onClose'] });
    await c.locator('.slice-modal__close').click();
    await expect(async () => {
      expect(await c.events('onClose')).toBe(1);
    }).toPass({ timeout: 3000 });
  });

  test('customColor sets CSS custom properties', async ({ mount }) => {
    const c = await mount('Modal', {
      title: 'Styled',
      open: true,
      customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }
    });
    await expect(c.locator('.slice-modal')).toHaveCSS('--modal-bg', '#1e3a5f');
    await expect(c.locator('.slice-modal')).toHaveCSS('--modal-text', '#e0f2fe');
    await expect(c.locator('.slice-modal')).toHaveCSS('--modal-accent', '#38bdf8');
  });

  test('width and maxWidth props are applied', async ({ mount }) => {
    const c = await mount('Modal', { title: 'Wide', open: true, width: '600px', maxWidth: '700px' });
    await expect(c.locator('.slice-modal')).toHaveCSS('--modal-width', '600px');
    await expect(c.locator('.slice-modal')).toHaveCSS('--modal-max-width', '700px');
  });

  test('Escape key dismisses the modal', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Esc', open: true });
    await page.keyboard.press('Escape');
    await expect(c.locator('.slice-modal')).not.toBeVisible();
  });

  test('Escape does not dismiss when dismissable is false', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Blocked', open: true, dismissable: false });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(c.locator('.slice-modal')).toBeVisible();
  });

  test('locks body scroll when open and restores on close', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Scroll lock', open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    let pos = await page.evaluate(() => document.body.style.position);
    expect(pos).toBe('fixed');
    await c.locator('.slice-modal__close').click();
    await expect(c.locator('.slice-modal')).not.toBeVisible();
    pos = await page.evaluate(() => document.body.style.position);
    expect(pos).toBe('');
  });

  test('restores body scroll when closed with Escape', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Esc scroll', open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    let pos = await page.evaluate(() => document.body.style.position);
    expect(pos).toBe('fixed');
    await page.keyboard.press('Escape');
    await expect(c.locator('.slice-modal')).not.toBeVisible();
    await expect(async () => {
      pos = await page.evaluate(() => document.body.style.position);
      expect(pos).toBe('');
    }).toPass({ timeout: 3000 });
  });

  test('restores body scroll on destroy', async ({ mount, page }) => {
    await mount('Modal', { title: 'Destroy', open: true });
    await expect(page.locator('.slice-modal')).toBeVisible();
    let pos = await page.evaluate(() => document.body.style.position);
    expect(pos).toBe('fixed');
    await page.evaluate(() => {
      const el = document.querySelector('[data-test-root]');
      if (el) el.innerHTML = '';
    });
    pos = await page.evaluate(() => document.body.style.position);
    expect(pos).toBe('');
  });

  test('draggable: dragging the header moves the modal', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Drag me', open: true, draggable: true });
    const dialog = c.locator('.slice-modal');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(260);   // let the enter animation (scale) settle before measuring

    const before = await dialog.boundingBox();
    const hb = await c.locator('.slice-modal__header').boundingBox();
    const sx = hb.x + 40, sy = hb.y + hb.height / 2;   // left side of the header (away from close)
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 60, sy + 70, { steps: 5 });
    await page.mouse.move(sx + 120, sy + 150, { steps: 5 });
    await page.mouse.up();

    const after = await dialog.boundingBox();
    expect(await dialog.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
    expect(Math.abs(after.x - (before.x + 120))).toBeLessThan(20);
    expect(Math.abs(after.y - (before.y + 150))).toBeLessThan(20);
    expect(c.pageErrors()).toEqual([]);
  });

  test('draggable: clicking the close button still closes (threshold blocks drag)', async ({ mount }) => {
    const c = await mount('Modal', { title: 'X', open: true, draggable: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    await c.locator('.slice-modal__close').click();
    await expect(c.locator('.slice-modal')).not.toBeVisible();
  });

  test('resizable: renders handles and the SE handle grows the modal', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Resize me', open: true, resizable: true });
    const dialog = c.locator('.slice-modal');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(260);   // let the enter animation (scale) settle before measuring
    await expect(c.locator('.dnd-handle--se')).toBeAttached();

    const before = await dialog.boundingBox();
    const hb = await c.locator('.dnd-handle--se').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    expect(hb.width).toBeGreaterThan(0);
    const cx = hb.x + hb.width / 2, cy = hb.y + hb.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 50, cy + 50, { steps: 5 });
    await page.mouse.move(cx + 90, cy + 90, { steps: 5 });
    await page.mouse.up();

    const after = await dialog.boundingBox();
    expect(after.width).toBeGreaterThan(before.width + 40);
    expect(after.height).toBeGreaterThan(before.height + 40);
    expect(c.pageErrors()).toEqual([]);
  });

  test('default modal wires no DnD (no resize handles)', async ({ mount }) => {
    const c = await mount('Modal', { title: 'Plain', open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    await expect(c.locator('.dnd-handle--se')).toHaveCount(0);
  });
});
