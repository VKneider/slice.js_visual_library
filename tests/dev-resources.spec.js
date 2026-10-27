import { test, expect } from '../playwright/harness/sliceFixtures.js';

// Development serves components unbundled, so the framework fetches
// `<Component>.html` and `<Component>.css` over HTTP. A JS-only Visual
// component (DemoButton, DemoRouteHome, MultiRoute…) ships neither, and the
// dev fallback has to answer 200 for it: a 404 makes `slice.build` return null,
// which is exactly what broke the MiniInspector and Breadcrumbs demos
// ("Live preview error: Expected 3 editable rows, got 0").
//
// The carve-out is deliberately narrow, so half of this file proves it does not
// swallow real 404s. Production never hits it (templates and CSS are bundled).

const serverMode = async (page) => (await (await page.request.get('/api/status')).json()).mode;

test.describe('Development fallback for component resources @server', () => {
  test('a JS-only component answers an empty stylesheet instead of a 404', async ({ page }) => {
    test.skip((await serverMode(page)) !== 'development', 'dev-only carve-out');

    // DemoButton builds its DOM in JS and has no .css file next to it.
    const resp = await page.request.get(
      '/Components/DemoComponents/DemoButton/DemoButton.css'
    );
    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain('text/css');
    const body = await resp.text();
    expect(body).not.toContain('<html');
    expect(body.length).toBeLessThan(200);
  });

  test('a real component stylesheet is served untouched', async ({ page }) => {
    const resp = await page.request.get('/Components/Visual/Button/Button.css');
    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain('text/css');
    expect(await resp.text()).toContain('.slice_button');
  });

  test('a component that does not exist still 404s', async ({ page }) => {
    test.skip((await serverMode(page)) !== 'development', 'dev-only carve-out');

    const resp = await page.request.get('/Components/Visual/Nope/Nope.css');
    expect(resp.status()).toBe(404);
  });

  test('a missing theme is still a real 404', async ({ page }) => {
    test.skip((await serverMode(page)) !== 'development', 'dev-only carve-out');

    // /Themes is outside the component prefixes: a broken theme name must fail.
    const resp = await page.request.get('/Themes/NOPE.css');
    expect(resp.status()).toBe(404);
  });

  test('the demos that used to break render without a live-preview error', async ({ page }) => {
    for (const path of ['/docs/developer/mini-inspector', '/docs/navigation/breadcrumbs']) {
      await page.goto(path);
      await expect(page.locator('.documentation-content')).toBeAttached();
      await page.waitForFunction(
        () => document.querySelectorAll('.demobox-preview').length > 0,
        null,
        { timeout: 20_000 }
      );
      // Give every scenario on the page time to run and fail loudly.
      await page.waitForTimeout(2500);
      const errors = await page.evaluate(() =>
        [...document.querySelectorAll('.doc-script-error')]
          .filter((el) => !el.hidden)
          .map((el) => el.textContent.trim())
      );
      expect(errors, `${path} must not show a live-preview error`).toEqual([]);
    }
  });
});
