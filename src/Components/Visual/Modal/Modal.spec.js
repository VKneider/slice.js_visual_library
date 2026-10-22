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
    // `open` is applied from a requestAnimationFrame in init(), so wait for the
    // dialog before pressing a key — otherwise the key lands before it exists.
    await expect(c.locator('.slice-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(c.locator('.slice-modal')).not.toBeVisible();
  });

  test('Escape does not dismiss when dismissable is false', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Blocked', open: true, dismissable: false });
    await expect(c.locator('.slice-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(c.locator('.slice-modal')).toBeVisible();
  });

  test('the dialog takes focus when it opens, so Escape always reaches it', async ({ mount }) => {
    const c = await mount('Modal', { title: 'Focus', open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    const inside = await c.component.evaluate((el) =>
      el.querySelector('.slice-modal').contains(document.activeElement)
    );
    expect(inside).toBe(true);
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

  // Regression: the dialog had no height cap and `overflow: visible`, so the
  // body's `flex: 1; min-height: 0; overflow: auto` could never engage — a tall
  // body grew past the viewport and the footer scrolled away instead.
  test('a tall body scrolls inside the dialog and keeps the footer in view', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Tall', open: true });
    const dialog = c.locator('.slice-modal');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(260);   // let the enter animation settle

    await c.component.evaluate((el) => {
      const body = el.querySelector('.slice-modal__body');
      for (let i = 0; i < 60; i++) {
        const p = document.createElement('p');
        p.textContent = `row ${i}`;
        body.appendChild(p);
      }
      // An empty footer is hidden, so give it something to keep in view.
      const ok = document.createElement('button');
      ok.textContent = 'OK';
      el.appendFooter(ok);
    });

    const scrollable = await c.locator('.slice-modal__body').evaluate((el) => ({
      overflowing: el.scrollHeight > el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
    }));
    expect(scrollable.overflowing).toBe(true);
    expect(scrollable.overflowY).toBe('auto');

    // The dialog itself is capped, and the footer is still on screen.
    const box = await dialog.boundingBox();
    const footer = await c.locator('.slice-modal__footer').boundingBox();
    expect(box.height).toBeLessThanOrEqual(641);
    expect(footer.y + footer.height).toBeLessThanOrEqual(721);
  });

  // ── Content from props ───────────────────────────────────────────

  test('title and description label the dialog; ariaLabel names a title-less one', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Delete file', description: 'This cannot be undone.' });
    const dialog = c.locator('.slice-modal');
    const titleId = await c.locator('.slice-modal__title').getAttribute('id');
    const descId = await c.locator('.slice-modal__description').getAttribute('id');
    await expect(dialog).toHaveAttribute('aria-labelledby', titleId);
    await expect(dialog).toHaveAttribute('aria-describedby', descId);
    await expect(c.locator('.slice-modal__description')).toHaveText('This cannot be undone.');

    await page.evaluate(() => {
      const m = window.__sliceMounted;
      m.title = '';
      m.description = '';
      m.ariaLabel = 'Image preview';
    });
    await expect(dialog).toHaveAttribute('aria-label', 'Image preview');
    await expect(dialog).not.toHaveAttribute('aria-labelledby', /.+/);
    await expect(dialog).not.toHaveAttribute('aria-describedby', /.+/);
  });

  test('a tone shows its icon unless icon is "none"', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Careful', tone: 'danger', open: true });
    await expect(c.locator('.slice-modal')).toHaveAttribute('data-tone', 'danger');
    await expect(c.locator('.slice-modal__icon')).toBeVisible();
    await expect(c.locator('.slice-modal__icon slice-icon')).toHaveCount(1);
    await page.evaluate(() => { window.__sliceMounted.icon = 'none'; });
    await expect(c.locator('.slice-modal__icon')).toBeHidden();
    await page.evaluate(() => { window.__sliceMounted.icon = 'cog'; });
    await expect(c.locator('.slice-modal__icon')).toBeVisible();
  });

  test('content takes text or nodes and replaces what it put there before', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Content', content: 'First paragraph', open: true });
    await expect(c.locator('.slice-modal__text')).toHaveText('First paragraph');
    await page.evaluate(() => {
      const m = window.__sliceMounted;
      const kept = document.createElement('div');
      kept.className = 'kept';
      m.appendBody(kept);
      const node = document.createElement('strong');
      node.className = 'mine';
      node.textContent = 'node';
      m.content = ['Line one', node];
    });
    await expect(c.locator('.slice-modal__text')).toHaveText(['Line one']);
    await expect(c.locator('.slice-modal__body .mine')).toHaveText('node');
    // appendBody() content is the caller's: the content prop never touches it.
    await expect(c.locator('.slice-modal__body .kept')).toHaveCount(1);
  });

  test('a header with no title shrinks to the corner ✕, and disappears when not dismissable', async ({ mount, page }) => {
    const c = await mount('Modal', { content: 'Just content', open: true });
    await expect(c.locator('.slice-modal__header')).toHaveClass(/is-bare/);
    await expect(c.locator('.slice-modal__close')).toBeVisible();
    await page.evaluate(() => { window.__sliceMounted.dismissable = false; });
    await expect(c.locator('.slice-modal__header')).toBeHidden();
  });

  // ── Actions ──────────────────────────────────────────────────────

  test('actions: a plain action closes with its value; one with a handler stays open', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Actions', open: true }, { spies: ['onClose'] });
    await expect(c.locator('.slice-modal__footer')).toBeHidden();   // empty footer
    await page.evaluate(() => {
      window.__clicks = 0;
      window.__sliceMounted.actions = [
        { value: 'Preview', variant: 'ghost', onClick: () => { window.__clicks += 1; } },
        { value: 'Cancel', variant: 'outlined' },
        { value: 'Save', close: 'saved' },
      ];
    });
    const buttons = c.locator('.slice-modal__footer .slice-modal__action');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.locator('button')).toHaveText(['Preview', 'Cancel', 'Save']);

    await buttons.nth(0).locator('button').click();
    expect(await page.evaluate(() => window.__clicks)).toBe(1);
    await expect(c.locator('.slice-modal')).toHaveAttribute('open', '');

    await buttons.nth(2).locator('button').click();
    await expect.poll(() => c.events('onClose')).toBe(1);
    const [[detail]] = await c.eventArgs('onClose');
    expect(detail).toEqual({ returnValue: 'saved', reason: 'action' });
  });

  test('replacing actions destroys the buttons it built', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Swap' });
    await page.evaluate(() => { window.__sliceMounted.actions = [{ value: 'A' }, { value: 'B' }]; });
    await expect(c.locator('.slice-modal__action')).toHaveCount(2);
    const ids = await page.evaluate(() =>
      [...window.__sliceMounted.querySelectorAll('.slice-modal__action')].map((b) => b.sliceId));
    await page.evaluate(() => { window.__sliceMounted.actions = [{ value: 'C' }]; });
    await expect(c.locator('.slice-modal__action')).toHaveCount(1);
    const alive = await page.evaluate((list) => list.filter((id) => slice.controller.activeComponents.has(id)), ids);
    expect(alive).toEqual([]);
  });

  test('show() resolves with the answer, however the modal closes', async ({ mount, page }) => {
    await mount('Modal', { title: 'Ask' });
    const result = await page.evaluate(async () => {
      const m = window.__sliceMounted;
      m.actions = [{ value: 'No' }, { value: 'Yes' }];
      const answer = m.show();
      await new Promise((r) => setTimeout(r, 300));
      m.querySelectorAll('.slice-modal__action button')[1].click();
      return answer;
    });
    expect(result).toEqual({ returnValue: 'Yes', reason: 'action' });
  });

  // ── Closing ──────────────────────────────────────────────────────

  test('onBeforeClose can refuse a person closing it, but not close() from code', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Unsaved changes', open: true });
    const dialog = c.locator('.slice-modal');
    await expect(dialog).toBeVisible();
    await page.evaluate(() => {
      window.__reasons = [];
      window.__sliceMounted.onBeforeClose = ({ reason }) => { window.__reasons.push(reason); return false; };
    });

    await page.keyboard.press('Escape');
    await c.locator('.slice-modal__close').click();
    await page.mouse.click(5, 5);   // the backdrop
    await page.waitForTimeout(150);
    await expect(dialog).toHaveAttribute('open', '');
    expect(await page.evaluate(() => window.__reasons)).toEqual(['escape', 'close-button', 'backdrop']);

    await page.evaluate(() => window.__sliceMounted.close());
    await expect(dialog).toBeHidden();
  });

  test('onBeforeClose may answer asynchronously', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Async guard', open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    const closed = await page.evaluate(async () => {
      const m = window.__sliceMounted;
      m.onBeforeClose = () => new Promise((r) => setTimeout(() => r(true), 100));
      return m.requestClose('api');
    });
    expect(closed).toBe(true);
    await expect(c.locator('.slice-modal')).toBeHidden();
  });

  test('a backdrop click closes it with reason "backdrop"; closeOnBackdrop: false keeps it', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Backdrop', open: true, closeOnBackdrop: false }, { spies: ['onClose'] });
    const dialog = c.locator('.slice-modal');
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await page.waitForTimeout(150);
    await expect(dialog).toHaveAttribute('open', '');
    await expect(dialog).toHaveClass(/is-refusing/);

    await page.evaluate(() => { window.__sliceMounted.closeOnBackdrop = true; });
    await page.mouse.click(5, 5);
    await expect.poll(() => c.events('onClose')).toBe(1);
    const [[detail]] = await c.eventArgs('onClose');
    expect(detail.reason).toBe('backdrop');
  });

  test('closeOnEscape: false keeps it open on Escape, the ✕ still works', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'No escape', open: true, closeOnEscape: false });
    const dialog = c.locator('.slice-modal');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await expect(dialog).toHaveAttribute('open', '');
    await c.locator('.slice-modal__close').click();
    await expect(dialog).toBeHidden();
  });

  test('an Escape already handled inside (an open menu) does not close the modal', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Nested', open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.className = 'menu-like';
      input.addEventListener('keydown', (e) => { if (e.key === 'Escape') e.preventDefault(); });
      window.__sliceMounted.appendBody(input);
      input.focus();
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await expect(c.locator('.slice-modal')).toHaveAttribute('open', '');
  });

  test('close() settles open and the dialog at once; onClose follows with the reason', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Sync', open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    const state = await page.evaluate(() => {
      const m = window.__sliceMounted;
      let fired = null;
      m.onClose = (d) => { fired = d; };
      m.close('done');
      const now = { open: m.open, dialogOpen: m.$dialog.open };
      // The browser queues the dialog's 'close' event as a task.
      return new Promise((r) => setTimeout(() => r({ ...now, fired }), 50));
    });
    expect(state).toEqual({ open: false, dialogOpen: false, fired: { returnValue: 'done', reason: 'api' } });
    await expect(c.locator('.slice-modal')).toBeHidden();
  });

  test('a <form method="dialog"> inside closes it with the submitter value', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Form', open: true }, { spies: ['onClose'] });
    await expect(c.locator('.slice-modal')).toBeVisible();
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.method = 'dialog';
      form.innerHTML = '<button value="accept">Accept</button>';
      window.__sliceMounted.appendBody(form);
    });
    await c.locator('form button').click();
    await expect.poll(() => c.events('onClose')).toBe(1);
    const [[detail]] = await c.eventArgs('onClose');
    expect(detail).toEqual({ returnValue: 'accept', reason: 'form' });
  });

  test('destroyOnClose removes and destroys the modal once it has closed', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Temp', open: true, destroyOnClose: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    const id = await page.evaluate(() => window.__sliceMounted.sliceId);
    await c.locator('.slice-modal__close').click();
    await expect(page.locator('slice-modal')).toHaveCount(0);
    expect(await page.evaluate((sid) => slice.controller.activeComponents.has(sid), id)).toBe(false);
  });

  // ── Focus ────────────────────────────────────────────────────────

  test('focus goes back to the element that opened it', async ({ mount, page }) => {
    await mount('Modal', { title: 'Return focus' });
    await page.evaluate(() => {
      const opener = document.createElement('button');
      opener.id = 'opener';
      opener.textContent = 'Open';
      opener.addEventListener('click', () => { window.__sliceMounted.open = true; });
      document.body.appendChild(opener);
    });
    await page.locator('#opener').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.slice-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.slice-modal')).toBeHidden();
    await expect(page.locator('#opener')).toBeFocused();
  });

  test('initialFocus and autofocus actions choose where focus starts', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Focus target' });
    await page.evaluate(() => {
      const m = window.__sliceMounted;
      const input = document.createElement('input');
      input.id = 'name-field';
      m.appendBody(input);
      m.actions = [{ value: 'Cancel' }, { value: 'Delete', autofocus: true }];
    });
    await expect(c.locator('.slice-modal__action')).toHaveCount(2);
    await page.evaluate(() => { window.__sliceMounted.open = true; });
    await expect(c.locator('.slice-modal__action').nth(1).locator('button')).toBeFocused();
    await page.evaluate(() => { window.__sliceMounted.close(); });

    await page.evaluate(() => { window.__sliceMounted.initialFocus = '#name-field'; window.__sliceMounted.open = true; });
    await expect(page.locator('#name-field')).toBeFocused();
  });

  // ── Layouts ──────────────────────────────────────────────────────

  test('size sets the width', async ({ mount, page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const c = await mount('Modal', { title: 'Sizes', size: 'sm', open: true });
    const dialog = c.locator('.slice-modal');
    await expect(dialog).toBeVisible();
    await expect.poll(async () => Math.round((await dialog.boundingBox()).width)).toBe(400);
    await page.evaluate(() => { window.__sliceMounted.size = 'lg'; });
    await expect.poll(async () => Math.round((await dialog.boundingBox()).width)).toBe(720);
    await page.evaluate(() => { window.__sliceMounted.size = 'nope'; });
    await expect(dialog).toHaveAttribute('data-size', 'md');
  });

  test('drawer layout: a full-height panel against the chosen side', async ({ mount, page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    const c = await mount('Modal', { title: 'Filters', layout: 'drawer', open: true });
    const dialog = c.locator('.slice-modal');
    await page.waitForTimeout(350);
    let box = await dialog.boundingBox();
    expect(Math.round(box.x + box.width)).toBe(1200);
    expect(Math.round(box.height)).toBe(800);
    expect(Math.round(box.width)).toBe(400);

    await page.evaluate(() => { window.__sliceMounted.close(); window.__sliceMounted.side = 'left'; window.__sliceMounted.open = true; });
    await page.waitForTimeout(350);
    box = await dialog.boundingBox();
    expect(Math.round(box.x)).toBe(0);
  });

  test('fullscreen layout covers the viewport', async ({ mount, page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    const c = await mount('Modal', { title: 'Editor', layout: 'fullscreen', open: true });
    await page.waitForTimeout(350);
    const box = await c.locator('.slice-modal').boundingBox();
    expect([Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)]).toEqual([0, 0, 1000, 700]);
  });

  test('mobileLayout switches to a sheet below the breakpoint and back above it', async ({ mount, page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    const c = await mount('Modal', { title: 'Responsive', mobileLayout: 'sheet', open: true });
    const dialog = c.locator('.slice-modal');
    await expect(dialog).toHaveAttribute('data-layout', 'center');
    await page.setViewportSize({ width: 390, height: 700 });
    await expect(dialog).toHaveAttribute('data-layout', 'sheet');
    await expect(c.locator('.slice-modal__handle')).toBeVisible();
    await page.waitForTimeout(350);
    const box = await dialog.boundingBox();
    expect(Math.round(box.y + box.height)).toBe(700);
    expect(Math.round(box.width)).toBe(390);
    expect(await page.evaluate(() => window.__sliceMounted.effectiveLayout)).toBe('sheet');
    await page.setViewportSize({ width: 1000, height: 700 });
    await expect(dialog).toHaveAttribute('data-layout', 'center');
  });

  test('a sheet closes when swiped down far enough, and snaps back otherwise', async ({ mount, page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    const c = await mount('Modal', { title: 'Swipe me', layout: 'sheet', content: 'Drag the handle', open: true }, { spies: ['onClose'] });
    const dialog = c.locator('.slice-modal');
    await page.waitForTimeout(350);
    const handle = await c.locator('.slice-modal__handle').boundingBox();
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 20, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(100);
    await expect(dialog).toHaveAttribute('open', '');
    expect(await dialog.evaluate((d) => d.style.transform)).toBe('');

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 200, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => c.events('onClose')).toBe(1);
    const [[detail]] = await c.eventArgs('onClose');
    expect(detail.reason).toBe('swipe');
  });

  test('drag stays off for layouts that do not float', async ({ mount, page }) => {
    const c = await mount('Modal', { title: 'Drawer', layout: 'drawer', draggable: true, resizable: true, open: true });
    await expect(c.locator('.slice-modal')).toBeVisible();
    await page.waitForTimeout(200);
    await expect(c.locator('.dnd-handle--se')).toHaveCount(0);
    await page.evaluate(() => { window.__sliceMounted.layout = 'center'; });
    await expect(c.locator('.dnd-handle--se')).toHaveCount(1);
  });
});