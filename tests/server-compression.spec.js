import { test, expect } from '../playwright/harness/sliceFixtures.js';

test.describe('Server compression & infrastructure @server', () => {
  test('compresses JS responses with gzip or brotli', async ({ page }) => {
    const resp = await page.request.get('/App/index.js');
    expect(resp.status()).toBe(200);
    const enc = resp.headers()['content-encoding'] || 'none';
    expect(['gzip', 'br', 'deflate']).toContain(enc);
    expect(resp.headers()['content-type']).toContain('javascript');
  });

  test('compresses CSS responses with gzip or brotli', async ({ page }) => {
    const resp = await page.request.get('/App/style.css');
    expect(resp.status()).toBe(200);
    const enc = resp.headers()['content-encoding'] || 'none';
    expect(['gzip', 'br', 'deflate']).toContain(enc);
  });

  test('compresses HTML responses with gzip or brotli', async ({ page }) => {
    const resp = await page.request.get('/App/index.html');
    expect(resp.status()).toBe(200);
    const enc = resp.headers()['content-encoding'] || 'none';
    expect(['gzip', 'br', 'deflate']).toContain(enc);
    expect(resp.headers()['content-type']).toContain('html');
  });

  test('serves /robots.txt without 403', async ({ page }) => {
    const resp = await page.request.get('/robots.txt');
    expect(resp.status()).toBe(200);
    expect(await resp.text()).toContain('User-agent');
  });

  test('serves /sitemap.xml without 403', async ({ page }) => {
    const resp = await page.request.get('/sitemap.xml');
    expect(resp.status()).toBe(200);
    expect(await resp.text()).toContain('<?xml');
  });

  test('returns /api/status as JSON', async ({ page }) => {
    const resp = await page.request.get('/api/status');
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe('ok');
    expect(body.framework).toBe('Slice.js');
  });

  test('returns JSON 404 for unknown API routes', async ({ page }) => {
    const resp = await page.request.get('/api/nonexistent-route-xyz');
    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.error).toBe('API route not found');
  });

  test('homepage loads without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await expect(page.locator('#app')).toBeAttached();
    expect(errors).toEqual([]);
  });
});

test.describe('Components still work with compression @server', () => {
  test('Button smoke: builds and mounts', async ({ mount }) => {
    const c = await mount('Button', { value: 'Compress Me' });
    await expect(c.component).toBeVisible();
    await expect(c.locator('.slice_button_value')).toHaveText('Compress Me');
    expect(c.pageErrors()).toEqual([]);
  });

  test('Button onClick fires correctly', async ({ mount }) => {
    const c = await mount('Button', { value: 'Click' }, { spies: ['onClick'] });
    await c.locator('.slice_button_container').click();
    expect(await c.events('onClick')).toBe(1);
  });

  test('Input smoke: builds and accepts value', async ({ mount }) => {
    const c = await mount('Input', { value: 'hello' });
    await expect(c.locator('.slice_input')).toBeVisible();
    expect(c.pageErrors()).toEqual([]);
  });
});
