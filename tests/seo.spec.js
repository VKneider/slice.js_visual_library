import { test, expect } from '../playwright/harness/sliceFixtures.js';

// Phase 2 of the SEO work: the server reads src/public/seo-manifest.json and
// answers every SPA route with its OWN metadata, and a route that is not a page
// with a real 404 instead of the shell (a "soft 404": 200 + "Loading…" forever).
//
// These assertions are all on the RAW response (no JavaScript), because that is
// exactly what a crawler or a link preview sees.

const ORIGIN = 'https://components.slicejs.com';

const meta = (html) => ({
  title: (html.match(/<title>([^<]*)<\/title>/i) || [])[1] ?? null,
  description: (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] ?? null,
  canonical: (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) || [])[1] ?? null,
  ogTitle: (html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i) || [])[1] ?? null,
  ogUrl: (html.match(/<meta\s+property="og:url"\s+content="([^"]*)"/i) || [])[1] ?? null,
  ogDescription:
    (html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i) || [])[1] ?? null,
  robots: (html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i) || [])[1] ?? null,
  jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (match) => {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    }
  )
});

test.describe('Per-route metadata @server', () => {
  test('home keeps the site-level metadata', async ({ page }) => {
    const response = await page.request.get('/');
    expect(response.status()).toBe(200);

    const tags = meta(await response.text());
    expect(tags.title).toBe('Slice.js Components | Slice.js');
    expect(tags.canonical).toBe(`${ORIGIN}/`);
    expect(tags.robots).toBe('index, follow');
    expect(tags.jsonLd.some((entry) => entry?.['@type'] === 'WebSite')).toBe(true);
  });

  test('a doc page gets its own title, description, canonical and og:url', async ({ page }) => {
    const home = meta(await (await page.request.get('/')).text());
    const response = await page.request.get('/docs/input/button');
    expect(response.status()).toBe(200);

    const tags = meta(await response.text());
    expect(tags.title).toBe('Button | Slice.js');
    expect(tags.canonical).toBe(`${ORIGIN}/docs/input/button`);
    expect(tags.ogUrl).toBe(`${ORIGIN}/docs/input/button`);
    expect(tags.ogTitle).toBe(tags.title);

    // The bug this replaces: every page shipped the home description.
    expect(tags.description).toBeTruthy();
    expect(tags.description).not.toBe(home.description);
    expect(tags.ogDescription).toBe(tags.description);
  });

  test('doc pages carry a TechArticle and a real breadcrumb trail', async ({ page }) => {
    const tags = meta(await (await page.request.get('/docs/input/button')).text());
    const types = tags.jsonLd.map((entry) => entry?.['@type']);

    expect(types).toContain('TechArticle');

    const breadcrumbs = tags.jsonLd.find((entry) => entry?.['@type'] === 'BreadcrumbList');
    expect(breadcrumbs).toBeTruthy();
    const names = breadcrumbs.itemListElement.map((item) => item.name);
    expect(names[0]).toBe('Home');
    expect(names).toContain('Components Library');
    expect(names.at(-1)).toBe('button');
    expect(breadcrumbs.itemListElement.at(-1).item).toBe(`${ORIGIN}/docs/input/button`);
  });

  test('the docs hub canonical points at /docs, not the home', async ({ page }) => {
    const tags = meta(await (await page.request.get('/docs')).text());
    expect(tags.canonical).toBe(`${ORIGIN}/docs`);
    expect(tags.title).toBe('Components Library | Slice.js');
  });

  test('every page in the sitemap answers 200 with a canonical of its own', async ({ page }) => {
    const sitemap = await (await page.request.get('/sitemap.xml')).text();
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(urls.length).toBeGreaterThan(60);

    const canonicals = new Set();
    for (const url of urls) {
      const path = url.replace(ORIGIN, '') || '/';
      const expectedCanonical = path === '/' ? `${ORIGIN}/` : url;
      const response = await page.request.get(path);
      expect(response.status(), `${path} should answer 200`).toBe(200);
      const tags = meta(await response.text());
      expect(tags.canonical, `${path} needs a self canonical`).toBe(expectedCanonical);
      canonicals.add(tags.canonical);
    }

    expect(canonicals.size).toBe(urls.length);
  });
});

test.describe('Real 404 for routes that are not pages @server', () => {
  test('an unknown docs path answers 404 with noindex', async ({ page }) => {
    const response = await page.request.get('/docs/xyz/nope');
    expect(response.status()).toBe(404);

    const tags = meta(await response.text());
    expect(tags.title).toContain('Not found');
    expect(tags.robots).toBe('noindex, nofollow');
  });

  test('the old dead sitemap URL no longer pretends to exist', async ({ page }) => {
    // /docs/utilities/mini-inspector was in the hand-maintained sitemap; the
    // real page is /docs/developer/mini-inspector.
    const response = await page.request.get('/docs/utilities/mini-inspector');
    expect(response.status()).toBe(404);
    expect(meta(await response.text()).robots).toBe('noindex, nofollow');

    expect((await page.request.get('/docs/developer/mini-inspector')).status()).toBe(200);
  });

  test('a path outside the app answers 404', async ({ page }) => {
    const response = await page.request.get('/does-not-exist');
    expect(response.status()).toBe(404);
  });

  test('internal routes still load but are not indexable', async ({ page }) => {
    for (const path of ['/__test', '/playground', '/game']) {
      const response = await page.request.get(path);
      expect(response.status(), `${path} should stay reachable`).toBe(200);
      expect(meta(await response.text()).robots, `${path} must be noindex`).toContain('noindex');
    }
  });

  test('the sitemap never lists a non-indexable route', async ({ page }) => {
    const sitemap = await (await page.request.get('/sitemap.xml')).text();
    for (const path of ['/__test', '/playground', '/game', '/404']) {
      expect(sitemap).not.toContain(`${ORIGIN}${path}<`);
    }
  });
});

test.describe('The SPA is untouched by the metadata injection @server', () => {
  test('a doc page still boots and renders its content', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/docs/input/button');
    await expect(page.locator('h1')).toContainText('Button');

    const title = await page.evaluate(() => document.title);
    expect(title).toBe('Button | Slice.js');
    expect(errors).toEqual([]);
  });

  test('generated runtime files are served as modules, not as the shell', async ({ page }) => {
    // These live at the deploy root and used to be answered by the SPA fallback
    // with index.html, so the browser loaded a page where it expected a module.
    for (const path of ['/routes.js', '/slice-events.generated.js', '/ComponentLibrary.js']) {
      const response = await page.request.get(path);
      expect(response.status(), `${path} should be served`).toBe(200);
      expect(response.headers()['content-type'] || '', `${path} must not be HTML`).not.toContain(
        'html'
      );
    }
  });

  test('every script the shell references resolves to JavaScript', async ({ page }) => {
    const html = await (await page.request.get('/docs/input/button')).text();
    const sources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((src) => src.startsWith('/'));

    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) {
      const response = await page.request.get(src);
      expect(response.status(), `${src} should exist`).toBe(200);
      expect(response.headers()['content-type'] || '', `${src} must be JavaScript`).toContain(
        'javascript'
      );
    }
  });
});
