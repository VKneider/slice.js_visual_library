import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('Toast', () => {
  test('smoke: builds and mounts without errors', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Hello' });
    await expect(c.component).toBeAttached();
    expect(c.pageErrors()).toEqual([]);
  });

  test('renders the message text', async ({ mount }) => {
    const c = await mount('Toast', { message: 'File saved' });
    await expect(c.locator('.slice-toast__message')).toHaveText('File saved');
  });

  test('type applies correct CSS class and icon type', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Done', type: 'success' });
    await expect(c.locator('.slice-toast')).toHaveClass(/slice-toast--success/);
    await expect(c.locator('.slice-toast__icon')).toHaveAttribute('data-type', 'success');
  });

  test('default type when no type given', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Hello' });
    await expect(c.locator('.slice-toast')).toHaveClass(/slice-toast--default/);
  });

  test('invalid type falls back to default', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Test', type: 'invalid' });
    await expect(c.locator('.slice-toast')).toHaveClass(/slice-toast--default/);
  });

  test('close button removes the toast from DOM', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Close me', dismissable: true });
    await expect(c.locator('.slice-toast__close')).toBeVisible();
    await c.locator('.slice-toast__close').click();
    // After clicking close, the toast starts exiting and is removed after ~260ms
    await expect(c.component).not.toBeAttached({ timeout: 1000 });
  });

  test('dismissable=false hides the close button', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Sticky', dismissable: false });
    await expect(c.locator('.slice-toast__close')).not.toBeVisible();
  });

  test('customColor sets CSS custom properties', async ({ mount }) => {
    const c = await mount('Toast', {
      message: 'Styled',
      customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }
    });
    const toast = c.locator('.slice-toast');
    await expect(toast).toHaveCSS('--toast-bg', '#1e3a5f');
    await expect(toast).toHaveCSS('--toast-text', '#e0f2fe');
    await expect(toast).toHaveCSS('--toast-accent', '#38bdf8');
  });

  test('auto-dismiss removes toast after duration', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Brief', duration: 200 });
    await expect(c.component).toBeAttached();
    // Should be gone within 1s (200ms duration + 260ms exit animation)
    await expect(c.component).not.toBeAttached({ timeout: 2000 });
  });

  test('a11y: close button has aria-label', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Info' });
    await expect(c.locator('.slice-toast__close')).toHaveAttribute('aria-label', 'Close notification');
  });

  test('visual: success toast @visual', async ({ mount }) => {
    const c = await mount('Toast', { message: 'Operation completed', type: 'success' });
    await expect(c.component).toHaveScreenshot('toast-success.png');
  });
});
