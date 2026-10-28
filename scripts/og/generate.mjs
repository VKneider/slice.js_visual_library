#!/usr/bin/env node
// Generate one 1200×630 social card per indexable route.
//
//   pnpm run og:generate                 # every indexable route
//   pnpm run og:generate -- --only=/docs/input/button
//   pnpm run og:generate -- --base-url=http://localhost:3001
//   pnpm run og:check                    # validate the committed manifest only
//
// What it does, per route: open the real page against a real server, wait for
// the `:::script` demo the docs parser renders into `.demobox-preview`, capture
// that element at deviceScaleFactor 2, then compose the 1200×630 card in
// Chromium and write it to src/public/og/<slug>-<contentHash>.png.
//
// Why the content hash is in the filename: social platforms cache a preview
// **per URL** for weeks. A stable `button.png` would keep serving the old
// design long after a deploy; a hash makes every new image a new URL.
//
// The hash is over the final bytes, so "nothing changed" means "no diff" —
// which is what makes running this on every deploy cheap in review terms.
// Capture always re-renders; only the write is skipped.

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARD, CARD_VERSION, buildCardHtml, displayTitle, routeSlug } from './card.mjs';

// Same rule as playwright.config.js: keep the browser binary inside the
// project (node_modules/…/.local-browsers) instead of the machine-level cache.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '0';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const PUBLIC = path.join(ROOT, 'src', 'public');
const SEO_MANIFEST = path.join(PUBLIC, 'seo-manifest.json');
const OG_DIR = path.join(PUBLIC, 'og');
const OG_MANIFEST = path.join(OG_DIR, 'manifest.json');

/** Hard ceiling per image. Over budget fails `--check`, warns while generating. */
const BUDGET_BYTES = 120 * 1024;

/** Captures are taken at deviceScaleFactor 2, so 1 CSS px = 2 device px. */
const DEVICE_SCALE = 2;
const EDGE_TRIM_DEVICE_PX = DEVICE_SCALE;

/**
 * Demos that show "updated at 14:32" or store `Date.now()` would make the card
 * change on every run (and the content hash with it). `setFixedTime` freezes
 * `Date` while leaving timers running, so async demos still build. Locale and
 * timezone are pinned in the context for the same reason.
 */
const FIXED_TIME = new Date('2026-01-15T10:30:00Z');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const CHECK = flag('check');
const ONLY = value('only');
const BASE_URL = value('base-url');
const CONCURRENCY = Number(value('concurrency')) || 4;

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const log = (...parts) => console.log(...parts);
const isImageFile = (name) => name.endsWith('.png') || name.endsWith('.jpg');

// ── manifest helpers ───────────────────────────────────────────────────────

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const writeIfChanged = (file, content) => {
  const next = `${JSON.stringify(content, null, 2)}\n`;
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (prev === next) return false;
  fs.writeFileSync(file, next);
  return true;
};

/** Pixel size straight out of the file header — PNG IHDR or JPEG SOF. */const imageSize = (buffer) => {
  if (buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  // JPEG: walk the segments until a start-of-frame marker.
  let offset = 2;
  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const isSof = marker >= 0xc0 && marker <= 0xcf
      && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  throw new Error('could not read the image size');
};

const indexableRoutes = (seo) => Object.entries(seo.routes || {})
  .filter(([, meta]) => meta && meta.indexable)
  .map(([route, meta]) => ({ route, meta }))
  .sort((a, b) => a.route.localeCompare(b.route));

// ── --check: no browser, no server ─────────────────────────────────────────

const runCheck = () => {
  const seo = readJson(SEO_MANIFEST);
  const routes = indexableRoutes(seo);
  const problems = [];

  if (!fs.existsSync(OG_MANIFEST)) {
    console.error('og/manifest.json is missing. Run: pnpm run og:generate');
    process.exit(1);
  }

  const manifest = readJson(OG_MANIFEST);
  const images = manifest.images || {};
  const origin = seo.origin || manifest.origin;

  if (manifest.origin !== origin) {
    problems.push(`manifest origin "${manifest.origin}" != seo origin "${origin}"`);
  }
  if (manifest.card?.width !== CARD.width || manifest.card?.height !== CARD.height) {
    problems.push('manifest card size disagrees with the template');
  }

  for (const { route } of routes) {
    const entry = images[route];
    if (!entry) {
      problems.push(`${route}: no OG image`);
      continue;
    }
    const file = path.join(PUBLIC, entry.path.replace(/^\//, ''));
    if (!fs.existsSync(file)) {
      problems.push(`${route}: missing file ${entry.path}`);
      continue;
    }
    const buffer = fs.readFileSync(file);
    const size = imageSize(buffer);
    if (size.width !== CARD.width || size.height !== CARD.height) {
      problems.push(`${route}: ${size.width}×${size.height}, expected ${CARD.width}×${CARD.height}`);
    }
    if (buffer.length > BUDGET_BYTES) {
      problems.push(`${route}: ${kb(buffer.length)} over the ${kb(BUDGET_BYTES)} budget`);
    }
    if (entry.width !== size.width || entry.height !== size.height) {
      problems.push(`${route}: manifest size disagrees with the file`);
    }
  }

  for (const route of Object.keys(images)) {
    if (!routes.some((item) => item.route === route)) {
      problems.push(`${route}: stale manifest entry (route is gone or noindex)`);
    }
  }

  const referenced = new Set(Object.values(images).map((entry) => path.basename(entry.path)));
  const files = fs.existsSync(OG_DIR)
    ? fs.readdirSync(OG_DIR).filter(isImageFile)
    : [];
  const budget = files.reduce((total, name) => total + fs.statSync(path.join(OG_DIR, name)).size, 0);
  for (const name of files) {
    if (!referenced.has(name)) problems.push(`og/${name}: orphan file`);
  }

  if (problems.length) {
    console.error(`OG images: ${problems.length} problem(s)\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }

  log(`OG images OK: ${routes.length} routes, ${files.length} files, ${kb(budget)} total.`);
};

// ── server ─────────────────────────────────────────────────────────────────

const getFreePort = () => new Promise((resolve, reject) => {
  const probe = createServer();
  probe.unref();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});

const waitForServer = async (baseUrl, timeoutMs = 60_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/api/status`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`server did not answer at ${baseUrl} within ${timeoutMs} ms`);
};

const startServer = async () => {
  const port = await getFreePort();
  const child = spawn(process.execPath, ['api/index.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(baseUrl);
  } catch (error) {
    child.kill();
    throw new Error(`${error.message}\n--- server output ---\n${output}`, { cause: error });
  }
  return { baseUrl, stop: () => child.kill() };
};

// ── capture ────────────────────────────────────────────────────────────────

const settle = async (page, ms = 200) => {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (ms) await page.waitForTimeout(ms);
};

/**
 * Wait until the DOM stops growing. A page-slice capture has no single marker
 * to wait for (the shell mounts, then Layout, then the article), and under a
 * few concurrent pages a fixed delay caught `/docs` mid-build — same route,
 * different pixels, different hash. Polling the DOM size is cheap and settles
 * exactly as late as the page needs.
 */
const waitForStableDom = async (page, { quietMs = 400, timeoutMs = 8_000 } = {}) => {
  const deadline = Date.now() + timeoutMs;
  let last = -1;
  let stableSince = 0;
  while (Date.now() < deadline) {
    const size = await page.evaluate(() => document.body.innerHTML.length);
    if (size === last) {
      if (!stableSince) stableSince = Date.now();
      if (Date.now() - stableSince >= quietMs) return;
    } else {
      last = size;
      stableSince = 0;
    }
    await page.waitForTimeout(100);
  }
};

/**
 * Returns `{ kind, shot }` where kind is `demo` (the `:::script` preview) or
 * `page` (a 1200×630 slice of the page, for routes with no demo).
 */
const captureRoute = async (page, baseUrl, route) => {
  // Freeze the clock before the first byte: demos read `Date` during init.
  await page.clock.setFixedTime(FIXED_TIME).catch(() => {});
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // Pin the light theme explicitly: `defaultTheme` is LIGHT and the site does
  // not follow the OS, but a demo can flip it (ThemeSwitcher/ThemeSelector).
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'LIGHT');
    document.documentElement.style.colorScheme = 'light';
  });

  // The shell mounts asynchronously; on a docs route the generated article is
  // the marker that the router has actually rendered the page. Without this
  // wait the first `hasPreview` check always misses and every card silently
  // degrades to a page screenshot.
  await page.waitForSelector('#app > *', { timeout: 30_000 }).catch(() => {});
  if (route.startsWith('/docs')) {
    await page.waitForSelector('.documentation-content', { timeout: 30_000 });
  }

  await page.evaluate(() => document.fonts.ready.then(() => true));

  // A page with `:::script` blocks builds its DemoBoxes during `init`, so the
  // article can be mounted a beat before the first preview exists — checking
  // once classified whole pages as "no demo". Wait briefly for one, then fall
  // back to a page slice.
  const hasPreview = await page.waitForSelector('.demobox-preview', { timeout: 4_000 })
    .then(() => true)
    .catch(() => false);

  if (!hasPreview) {
    await waitForStableDom(page);
    await settle(page, 400);
    const shot = await page.screenshot({
      type: 'png',
      animations: 'disabled',
      clip: { x: 0, y: 0, width: CARD.width, height: CARD.height },
    });
    return { kind: 'page', shot };
  }

  // A demo is built asynchronously (`slice.build`); an empty slot means it has
  // not landed yet. A real failure shows up as `.doc-script-error`.
  await page.waitForFunction(() => {
    const preview = document.querySelector('.demobox-preview');
    const failed = document.querySelector('.doc-script-error:not([hidden])');
    return Boolean(failed) || (preview && preview.childElementCount > 0);
  }, null, { timeout: 20_000 }).catch(() => {});

  const failure = await page.evaluate(() => {
    const element = document.querySelector('.doc-script-error:not([hidden])');
    return element ? element.textContent.trim().replace(/^Live preview error:\s*/, '') : '';
  });

  if (failure) {
    // A broken demo is a docs bug, not a reason to block a deploy: ship the
    // page slice and say so loudly enough to get fixed.
    console.warn(`  ! ${route}: live preview failed (${failure}); using a page screenshot`);
    await waitForStableDom(page);
    await settle(page, 400);
    const shot = await page.screenshot({
      type: 'png',
      animations: 'disabled',
      clip: { x: 0, y: 0, width: CARD.width, height: CARD.height },
    });
    return { kind: 'page', shot };
  }

  // Demos that fetch something (`query-service` waits 400 ms for a pretend
  // server) render a loading state first. A fixed delay captured a different
  // frame on every run; wait until the DOM stops changing instead.
  await waitForStableDom(page, { quietMs: 350, timeoutMs: 4_000 });
  await settle(page, 100);

  // Re-assert the theme: a demo may have toggled it while it settled.
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'LIGHT'));

  // The capture is taken at deviceScaleFactor 2 and the element clip rounds
  // outward, so it picks up ~1 device px of whatever is adjacent: the code
  // block's bottom border above, the DemoBox border on the left. Trimming the
  // outer edge in the page's own canvas is exact and needs no image library.
  const raw = await page.locator('.demobox-preview').first().screenshot({
    type: 'png',
    animations: 'disabled',
  });
  const shot = await trimEdges(page, raw, EDGE_TRIM_DEVICE_PX);
  return { kind: 'demo', shot };
};

/** Crop `cut` device pixels off every edge, inside the page's canvas. */
const trimEdges = async (page, buffer, cut) => {
  const base64 = await page.evaluate(async ({ src, px }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${src}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth - px * 2;
    canvas.height = image.naturalHeight - px * 2;
    canvas.getContext('2d').drawImage(image, -px, -px);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { src: buffer.toString('base64'), px: cut });
  return Buffer.from(base64, 'base64');
};

// PNG keeps flat UI and text crisp. A full-page slice contains gradients,
// shadows and photos, where PNG is 3× heavier for no visible gain — JPEG q86
// there costs nothing. The manifest carries the real type per route.
const FORMATS = {
  demo: { type: 'image/png', ext: '.png' },
  page: { type: 'image/jpeg', ext: '.jpg', quality: 86 },
};

const renderCard = async (cardPage, { route, meta, capture, host }) => {
  const html = buildCardHtml({
    route,
    title: meta.title,
    section: meta.section,
    group: meta.group,
    description: meta.description,
    host,
    kind: capture.kind,
    imageData: capture.shot ? `data:image/png;base64,${capture.shot.toString('base64')}` : null,
  });

  const format = FORMATS[capture.kind] || FORMATS.demo;
  await cardPage.setContent(html, { waitUntil: 'load' });
  await cardPage.evaluate(() => document.fonts.ready.then(() => true));
  const buffer = await cardPage.screenshot({
    type: format.ext === '.jpg' ? 'jpeg' : 'png',
    quality: format.quality,
    animations: 'disabled',
    clip: { x: 0, y: 0, width: CARD.width, height: CARD.height },
  });
  return { buffer, format };
};

// ── main ───────────────────────────────────────────────────────────────────

const runPool = async (items, limit, worker) => {
  const results = new Array(items.length);
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(lanes);
  return results;
};

const generate = async () => {
  const seo = readJson(SEO_MANIFEST);
  const origin = seo.origin || 'https://components.slicejs.com';
  const host = origin.replace(/^https?:\/\//, '');
  let routes = indexableRoutes(seo).map(({ route, meta }) => ({
    route,
    meta: { ...meta, title: displayTitle(meta.title) },
  }));

  if (ONLY) {
    const wanted = new Set(ONLY.split(',').map((item) => item.trim()).filter(Boolean));
    routes = routes.filter((item) => wanted.has(item.route));
    if (!routes.length) {
      console.error(`--only=${ONLY} matches no indexable route.`);
      process.exit(1);
    }
  }

  fs.mkdirSync(OG_DIR, { recursive: true });

  const previous = fs.existsSync(OG_MANIFEST) ? readJson(OG_MANIFEST) : { images: {} };
  const previousImages = previous.images || {};

  const server = BASE_URL ? null : await startServer();
  const baseUrl = BASE_URL || server.baseUrl;
  log(`OG: ${routes.length} route(s) against ${baseUrl}`);

  const browser = await chromium.launch();
  let failed = 0;

  try {
    // DSF 2: every capture is supersampled so the card can scale it down (or up
    // to 2× of its CSS size) without ever looking soft.
    const captureContext = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      deviceScaleFactor: DEVICE_SCALE,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      locale: 'en-US',
      timezoneId: 'UTC',
    });
    const cardContext = await browser.newContext({
      viewport: CARD,
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
      locale: 'en-US',
    });

    const images = {};

    await runPool(routes, CONCURRENCY, async ({ route, meta }) => {
      const page = await captureContext.newPage();
      const cardPage = await cardContext.newPage();
      try {
        const capture = await captureRoute(page, baseUrl, route);
        const card = await renderCard(cardPage, { route, meta, capture, host });
        const hash = crypto.createHash('sha256').update(card.buffer).digest('hex').slice(0, 10);
        const fileName = `${routeSlug(route)}-${hash}${card.format.ext}`;
        const file = path.join(OG_DIR, fileName);
        const size = imageSize(card.buffer);
        const existed = fs.existsSync(file);

        if (!existed) fs.writeFileSync(file, card.buffer);

        if (card.buffer.length > BUDGET_BYTES) {
          console.warn(`  ! ${route} is ${kb(card.buffer.length)}, over the ${kb(BUDGET_BYTES)} budget`);
        }

        images[route] = {
          path: `/og/${fileName}`,
          width: size.width,
          height: size.height,
          type: card.format.type,
          bytes: card.buffer.length,
          kind: capture.kind,
        };

        log(`  ${existed ? 'cached' : 'new   '} ${route.padEnd(42)} ${kb(card.buffer.length).padStart(9)}  ${capture.kind}`);
      } catch (error) {
        failed += 1;
        console.error(`  FAILED ${route}: ${error.message}`);
      } finally {
        await page.close();
        await cardPage.close();
      }
    });

    if (failed) {
      // Never write a manifest that silently drops the routes that failed:
      // the next `og:check` would then report them as gone instead of broken.
      throw new Error(`${failed} route(s) failed; og/manifest.json and the images were left untouched.`);
    }

    // Keep the previous entries when --only rendered a subset.
    const merged = ONLY ? { ...previousImages, ...images } : images;

    for (const entry of Object.values(merged)) {
      if (entry.bytes == null) {
        entry.bytes = fs.statSync(path.join(PUBLIC, entry.path.replace(/^\//, ''))).size;
      }
    }

    const manifest = {
      version: 1,
      generator: CARD_VERSION,
      origin,
      card: { width: CARD.width, height: CARD.height },
      images: Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b))),
    };
    const changed = writeIfChanged(OG_MANIFEST, manifest);
    log(`Manifest ${changed ? 'updated' : 'unchanged'}: ${Object.keys(manifest.images).length} entries`);

    const referenced = new Set(Object.values(manifest.images).map((entry) => path.basename(entry.path)));
    const orphans = fs.readdirSync(OG_DIR)
      .filter((name) => isImageFile(name) && !referenced.has(name));
    for (const name of orphans) {
      fs.unlinkSync(path.join(OG_DIR, name));
      log(`  removed orphan ${name}`);
    }

    const total = Object.values(manifest.images)
      .reduce((sum, entry) => sum + fs.statSync(path.join(PUBLIC, entry.path.replace(/^\//, ''))).size, 0);
    log(`Done: ${Object.keys(images).length} rendered, ${kb(total)} total, ${orphans.length} orphan(s) removed.`);
  } finally {
    await browser.close();
    if (server) server.stop();
  }
};

if (CHECK) {
  runCheck();
} else {
  generate().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
