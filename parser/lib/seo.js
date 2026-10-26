// SEO artifacts for the documentation site.
//
// Two files, both GENERATED from the same source the docs pages are generated
// from (the markdown front matter), because the previous sitemap was maintained
// by hand and silently rotted: 25 real pages were missing and one URL pointed
// at a route that does not exist. Anything a crawler reads has to be derived
// from the pages, not typed next to them.
//
//   src/public/sitemap.xml        -> what crawlers are told to index
//   src/public/seo-manifest.json  -> what the server injects into the SPA shell
//                                    (title / description / canonical / JSON-LD)
//
// The manifest is also the route inventory the server uses to answer 404 for a
// path that is not a page, instead of serving the shell with a 200.

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

import { writeFileIfChanged } from './fileUtils.js';

const ORIGIN = 'https://components.slicejs.com';
const TITLE_SUFFIX = ' | Slice.js';
const MARKDOWN_DIR = 'src/markdown';

// Routes that are not generated from markdown. `indexable: false` keeps a route
// out of the sitemap (internal or test pages) while still describing it, so the
// server can answer it with a real page and a `noindex` robots tag instead of
// pretending it does not exist.
const STATIC_ROUTES = {
  '/docs': {
    title: 'Components Library',
    description:
      'Every Slice.js component, documented with live examples, prop tables and usage guides, grouped by input, display, layout, navigation, data and services.',
    priority: '0.9',
    changefreq: 'weekly'
  },
  '/theme-creator': {
    title: 'Theme Creator',
    description:
      'Tune the Slice.js theme tokens live - colour, radius, spacing and typography - and export the CSS variables for your own app.',
    priority: '0.5',
    changefreq: 'monthly'
  }
};

// Present in src/routes.js but not part of the public site: the test harness and
// the demos. Indexing them adds thin pages to the crawl and nothing to a visitor.
const HIDDEN_ROUTES = {
  '/__test': 'Test Harness',
  '/playground': 'Playground',
  '/game': 'Game',
  '/404': 'Not found'
};

const DESCRIPTION_FALLBACK = (title) =>
  `${title} - a Slice.js component, documented with live examples, prop tables and usage guides.`;

/** Read the shell's own metadata so the home page has ONE source of truth. */
const readShellMeta = (root) => {
  const shellPath = path.join(root, 'src', 'App', 'index.html');
  const fallback = {
    title: 'Slice.js Components',
    description:
      'Official visual components library for Slice.js. Interactive documentation with live examples, API tables, and usage guides for every component.'
  };

  try {
    const html = fs.readFileSync(shellPath, 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    const description = html.match(
      /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
    )?.[1]?.trim();
    return {
      title: title || fallback.title,
      description: description || fallback.description
    };
  } catch {
    return fallback;
  }
};

/**
 * Latest commit date per markdown file, in one `git log` call.
 *
 * File mtimes are useless here: a fresh clone makes every file "modified today",
 * which would rewrite the sitemap on every CI run and turn the auto-commit into
 * noise. The commit date is stable across clones and only moves when the page
 * actually changed - CI checks out with `fetch-depth: 0`, so the history is there.
 *
 * @returns {Map<string, string>} repo-relative path -> YYYY-MM-DD
 */
const collectLastModified = (root) => {
  const dates = new Map();

  try {
    const output = execFileSync(
      'git',
      ['log', '--format=@@%cs', '--name-only', '--', MARKDOWN_DIR],
      { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
    );

    let currentDate = null;
    for (const rawLine of output.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('@@')) {
        currentDate = line.slice(2);
        continue;
      }
      // `git log` walks newest first, so the first date seen for a file is its
      // last change. Later (older) commits must not overwrite it.
      if (currentDate && !dates.has(line)) dates.set(line, currentDate);
    }
  } catch {
    // No git (a tarball export, a docker image without .git): the sitemap is
    // still valid, it just omits <lastmod>.
  }

  return dates;
};

const normalizeRoute = (route) => {
  const trimmed = String(route || '').trim();
  if (!trimmed) return '';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : '/';
};

/**
 * Build the route table the sitemap and the server both read.
 *
 * @param {Array<{route: string, title: string, description?: string, section?: string,
 *   group?: string, tags?: string[], markdownFile?: string}>} entries docs entries
 * @param {{ root?: string, lastModified?: Map<string, string>, shellMeta?: object }} [options]
 */
const buildSeoManifest = (entries = [], options = {}) => {
  const root = options.root || process.cwd();
  const shellMeta = options.shellMeta || readShellMeta(root);
  const lastModified = options.lastModified || new Map();
  const routes = {};

  routes['/'] = {
    title: `${shellMeta.title}${TITLE_SUFFIX}`,
    description: shellMeta.description,
    section: null,
    group: null,
    indexable: true,
    priority: '1.0',
    changefreq: 'weekly',
    lastmod: null
  };

  for (const [route, meta] of Object.entries(STATIC_ROUTES)) {
    routes[route] = {
      title: `${meta.title}${TITLE_SUFFIX}`,
      description: meta.description,
      section: null,
      group: null,
      indexable: true,
      priority: meta.priority,
      changefreq: meta.changefreq,
      lastmod: null
    };
  }

  for (const [route, title] of Object.entries(HIDDEN_ROUTES)) {
    routes[route] = {
      title: `${title}${TITLE_SUFFIX}`,
      description: '',
      section: null,
      group: null,
      indexable: false,
      priority: '0.0',
      changefreq: 'yearly',
      lastmod: null,
      // The server turns this into <meta name="robots" content="noindex">.
      noindex: true
    };
  }

  for (const entry of entries) {
    const route = normalizeRoute(entry.route);
    if (!route || route === '/') continue;
    // A route listed twice (two files, same page) must not produce two sitemap
    // entries; the first one wins, exactly like the generated route tables.
    if (routes[route]) continue;

    const title = String(entry.title || '').trim() || route;
    const markdownFile = entry.markdownFile || '';

    routes[route] = {
      title: `${title}${TITLE_SUFFIX}`,
      description: String(entry.description || '').trim() || DESCRIPTION_FALLBACK(title),
      section: entry.section || null,
      group: entry.group || null,
      indexable: true,
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: markdownFile ? lastModified.get(markdownFile) || null : null
    };
  }

  // Sorted so the generated file only changes when the input does: an unstable
  // key order would rewrite the manifest (and the sitemap) on every run.
  const sortedRoutes = {};
  for (const route of Object.keys(routes).sort()) sortedRoutes[route] = routes[route];

  return {
    version: 1,
    origin: ORIGIN,
    routes: sortedRoutes
  };
};

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Sitemap XML from a manifest. Only `indexable` routes, sorted by URL, with the
 * `<lastmod>` we actually know (no fabricated date).
 */
const buildSitemap = (manifest) => {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  const routes = Object.keys(manifest.routes)
    .filter((route) => manifest.routes[route].indexable !== false)
    .sort();

  for (const route of routes) {
    const meta = manifest.routes[route];
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(`${manifest.origin}${route}`)}</loc>`);
    if (meta.lastmod) lines.push(`    <lastmod>${escapeXml(meta.lastmod)}</lastmod>`);
    if (meta.changefreq) lines.push(`    <changefreq>${escapeXml(meta.changefreq)}</changefreq>`);
    if (meta.priority) lines.push(`    <priority>${escapeXml(meta.priority)}</priority>`);
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  lines.push('');
  return lines.join('\n');
};

/**
 * Write both SEO artifacts, skipping files whose content did not change.
 *
 * @returns {{ manifest: object, changed: string[] }}
 */
const writeSeoArtifacts = ({ root, publicDir, entries }) => {
  // One `git log` call for the whole run: the sitemap's <lastmod> is the commit
  // date of the markdown file, not its mtime (which a fresh clone resets).
  const manifest = buildSeoManifest(entries, { root, lastModified: collectLastModified(root) });
  const manifestPath = path.join(publicDir, 'seo-manifest.json');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const changed = [];

  if (writeFileIfChanged(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)) {
    changed.push('seo-manifest.json');
  }
  if (writeFileIfChanged(sitemapPath, buildSitemap(manifest))) {
    changed.push('sitemap.xml');
  }

  return { manifest, changed };
};

export {
  ORIGIN,
  MARKDOWN_DIR,
  STATIC_ROUTES,
  HIDDEN_ROUTES,
  collectLastModified,
  readShellMeta,
  buildSeoManifest,
  buildSitemap,
  normalizeRoute,
  writeSeoArtifacts
};
