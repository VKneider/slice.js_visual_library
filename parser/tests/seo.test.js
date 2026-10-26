import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildSeoManifest,
  buildSitemap,
  normalizeRoute,
  writeSeoArtifacts,
  ORIGIN
} from '../lib/seo.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const SHELL_META = {
  title: 'Slice.js Components',
  description: 'Official visual components library for Slice.js.'
};

const ENTRY = (route, extra = {}) => ({
  route,
  title: extra.title || route.split('/').pop(),
  description: extra.description || 'Description for the page.',
  section: extra.section || 'Input',
  group: extra.group || 'Basic',
  markdownFile: extra.markdownFile || `src/markdown/${route.replace(/^\/docs\//, '')}.md`
});

const routeKeys = (manifest) => Object.keys(manifest.routes);
const sitemapLocations = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapRoute = (loc) => loc.replace(ORIGIN, '') || '/';

test('normalizeRoute trims, adds the leading slash and drops trailing slashes', () => {
  assert.equal(normalizeRoute('/docs/input/button/'), '/docs/input/button');
  assert.equal(normalizeRoute('docs/input/button'), '/docs/input/button');
  assert.equal(normalizeRoute(' /docs '), '/docs');
  assert.equal(normalizeRoute('/'), '/');
  assert.equal(normalizeRoute(''), '');
  assert.equal(normalizeRoute(null), '');
});

test('buildSeoManifest describes every docs entry plus the static routes', () => {
  const manifest = buildSeoManifest(
    [ENTRY('/docs/input/button', { title: 'Button' }), ENTRY('/docs/display/avatar')],
    { shellMeta: SHELL_META }
  );

  assert.deepEqual(routeKeys(manifest), [
    '/',
    '/404',
    '/__test',
    '/docs',
    '/docs/display/avatar',
    '/docs/input/button',
    '/game',
    '/playground',
    '/theme-creator'
  ]);
  assert.equal(manifest.routes['/docs/input/button'].title, 'Button | Slice.js');
  assert.equal(manifest.routes['/docs/input/button'].section, 'Input');
  assert.equal(manifest.routes['/docs/input/button'].indexable, true);
  assert.equal(manifest.routes['/'].title, `${SHELL_META.title} | Slice.js`);
  assert.equal(manifest.routes['/docs'].priority, '0.9');
});

test('manifest keys are sorted so regenerating the file is a no-op', () => {
  const entries = ['/docs/z/last', '/docs/a/first', '/docs/m/middle'].map((route) => ENTRY(route));
  const first = buildSeoManifest(entries, { shellMeta: SHELL_META });
  const second = buildSeoManifest([...entries].reverse(), { shellMeta: SHELL_META });

  assert.deepEqual(routeKeys(first), [...routeKeys(first)].sort());
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(JSON.stringify(first).includes('generatedAt'), false);
});

test('the same route from two markdown files keeps a single manifest entry', () => {
  const manifest = buildSeoManifest(
    [
      ENTRY('/docs/input/button', { title: 'Button' }),
      ENTRY('/docs/input/button', { title: 'Button (duplicate)' })
    ],
    { shellMeta: SHELL_META }
  );

  assert.equal(manifest.routes['/docs/input/button'].title, 'Button | Slice.js');
  assert.equal(
    routeKeys(manifest).filter((route) => route === '/docs/input/button').length,
    1
  );
});

test('a doc without a description gets a readable fallback', () => {
  const manifest = buildSeoManifest(
    [{ route: '/docs/input/slider', title: 'Slider', description: '   ' }],
    { shellMeta: SHELL_META }
  );

  assert.match(manifest.routes['/docs/input/slider'].description, /^Slider - a Slice\.js component/);
});

test('internal routes are described but never indexable', () => {
  const manifest = buildSeoManifest([], { shellMeta: SHELL_META });
  const hidden = ['/__test', '/playground', '/game', '/404'];

  for (const route of hidden) {
    assert.equal(manifest.routes[route].indexable, false, `${route} must not be indexable`);
    assert.equal(manifest.routes[route].noindex, true, `${route} must carry noindex`);
  }
});

test('lastmod comes from the markdown commit date, never fabricated', () => {
  const lastModified = new Map([['src/markdown/input/button.md', '2026-10-24']]);
  const manifest = buildSeoManifest(
    [
      ENTRY('/docs/input/button', { markdownFile: 'src/markdown/input/button.md' }),
      ENTRY('/docs/input/slider', { markdownFile: 'src/markdown/input/slider.md' })
    ],
    { shellMeta: SHELL_META, lastModified }
  );

  assert.equal(manifest.routes['/docs/input/button'].lastmod, '2026-10-24');
  assert.equal(manifest.routes['/docs/input/slider'].lastmod, null);
  assert.equal(manifest.routes['/'].lastmod, null);
});

test('buildSitemap lists only indexable routes, sorted, with the real origin', () => {
  const manifest = buildSeoManifest(
    [ENTRY('/docs/input/button'), ENTRY('/docs/display/avatar')],
    { shellMeta: SHELL_META }
  );
  const xml = buildSitemap(manifest);
  const routes = sitemapLocations(xml).map(sitemapRoute);

  assert.deepEqual(routes, ['/', '/docs', '/docs/display/avatar', '/docs/input/button', '/theme-creator']);
  assert.equal(xml.includes('<loc>'), true);
  for (const hidden of ['/__test', '/playground', '/game', '/404']) {
    assert.equal(xml.includes(`${ORIGIN}${hidden}<`), false, `${hidden} must not be in the sitemap`);
  }
});

test('buildSitemap emits lastmod only for the routes that have one', () => {
  const lastModified = new Map([['src/markdown/input/button.md', '2026-10-24']]);
  const manifest = buildSeoManifest(
    [
      ENTRY('/docs/input/button', { markdownFile: 'src/markdown/input/button.md' }),
      ENTRY('/docs/input/slider', { markdownFile: 'src/markdown/input/slider.md' })
    ],
    { shellMeta: SHELL_META, lastModified }
  );
  const xml = buildSitemap(manifest);
  const blocks = xml.split('<url>').slice(1);

  const buttonBlock = blocks.find((block) => block.includes('/docs/input/button<'));
  const sliderBlock = blocks.find((block) => block.includes('/docs/input/slider<'));

  assert.match(buttonBlock, /<lastmod>2026-10-24<\/lastmod>/);
  assert.equal(sliderBlock.includes('<lastmod>'), false);
  assert.equal((xml.match(/<lastmod>/g) || []).length, 1);
});

test('buildSitemap escapes XML entities in titles and routes', () => {
  const manifest = buildSeoManifest(
    [ENTRY('/docs/input/toggle', { title: 'Toggle & Switch <v2>' })],
    { shellMeta: SHELL_META }
  );
  const xml = buildSitemap(manifest);

  assert.equal(xml.includes('&amp;'), false); // no titles in the sitemap
  assert.equal(xml.includes('<loc>https://components.slicejs.com/docs/input/toggle</loc>'), true);

  const escaped = buildSitemap({
    origin: ORIGIN,
    routes: { '/docs/a&b': { indexable: true, priority: '0.7' } }
  });
  assert.match(escaped, /<loc>https:\/\/components\.slicejs\.com\/docs\/a&amp;b<\/loc>/);
});

test('writeSeoArtifacts writes both files and is idempotent', () => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slice-seo-'));
  const options = {
    root: ROOT,
    publicDir,
    entries: [ENTRY('/docs/input/button')]
  };

  const first = writeSeoArtifacts(options);
  assert.deepEqual(first.changed.sort(), ['seo-manifest.json', 'sitemap.xml']);

  const manifestPath = path.join(publicDir, 'seo-manifest.json');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const manifestStat = fs.statSync(manifestPath);

  const second = writeSeoArtifacts(options);
  assert.deepEqual(second.changed, []);
  assert.equal(fs.statSync(manifestPath).mtimeMs, manifestStat.mtimeMs);

  const written = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(written.origin, ORIGIN);
  assert.equal(written.routes['/docs/input/button'].title, 'button | Slice.js');
  assert.match(fs.readFileSync(sitemapPath, 'utf8'), /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
});

test('the committed sitemap matches the real documentation routes (drift guard)', () => {
  const sitemapPath = path.join(ROOT, 'src', 'public', 'sitemap.xml');
  const routesPath = path.join(
    ROOT,
    'src',
    'Components',
    'AppComponents',
    'ComponentsPage',
    'docRoutes.generated.js'
  );

  if (!fs.existsSync(sitemapPath) || !fs.existsSync(routesPath)) {
    assert.fail('sitemap.xml and docRoutes.generated.js must both exist');
  }

  const docRoutes = [...fs.readFileSync(routesPath, 'utf8').matchAll(/path:\s*'([^']+)'/g)].map(
    (match) => match[1]
  );
  const indexed = sitemapLocations(fs.readFileSync(sitemapPath, 'utf8')).map(sitemapRoute);
  const indexedSet = new Set(indexed);
  const staticRoutes = ['/', '/theme-creator'];

  const missing = docRoutes.filter((route) => !indexedSet.has(route));
  assert.deepEqual(missing, [], `sitemap is missing real pages: ${missing.join(', ')}`);

  const dead = indexed.filter(
    (route) => !docRoutes.includes(route) && !staticRoutes.includes(route)
  );
  assert.deepEqual(dead, [], `sitemap advertises routes that do not exist: ${dead.join(', ')}`);

  assert.equal(new Set(indexed).size, indexed.length, 'sitemap must not repeat a URL');
});

test('the committed manifest describes every sitemap URL with its own metadata', () => {
  const manifestPath = path.join(ROOT, 'src', 'public', 'seo-manifest.json');
  const sitemapPath = path.join(ROOT, 'src', 'public', 'sitemap.xml');

  if (!fs.existsSync(manifestPath)) assert.fail('seo-manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const indexed = sitemapLocations(fs.readFileSync(sitemapPath, 'utf8')).map(sitemapRoute);

  for (const route of indexed) {
    const meta = manifest.routes[route];
    assert.ok(meta, `${route} is in the sitemap but missing from the manifest`);
    assert.equal(meta.indexable, true, `${route} is in the sitemap but marked non-indexable`);
    assert.ok(meta.title, `${route} needs a title`);
    assert.ok(meta.description, `${route} needs a description`);
  }

  // The bug this generator replaces: every page shared the home canonical.
  const titles = indexed.map((route) => manifest.routes[route].title);
  assert.equal(new Set(titles).size, titles.length, 'every page needs a unique title');
});
