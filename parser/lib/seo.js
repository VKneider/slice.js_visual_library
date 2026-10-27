// SEO artifacts for the documentation site.
//
// Two files, both GENERATED from the same source the docs pages are generated
// from (the markdown front matter), because the previous sitemap was maintained
// by hand and silently rotted: 25 real pages were missing and one URL pointed
// at a route that does not exist. Anything a crawler reads has to be derived
// from the pages, not typed next to them.
//
//   src/public/sitemap.xml        -> what crawlers are told to index
//   src/public/seo.json           -> what the server injects into the SPA shell
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
      'Official Slice.js Components library. Interactive documentation with live examples, API tables, and usage guides for every component.'
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
 * Build the route table the framework reads (`seo.json`): one entry per route,
 * in the shape `slicejs-web-framework/api/framework/seo.js` consumes.
 *
 * Titles keep their `| Slice.js` suffix and the manifest declares no template,
 * so what the server sends is exactly what is written here.
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

  const websiteJsonLd = { '@type': 'WebSite', name: 'Slice.js Components', url: ORIGIN };
  const docsJsonLd = (route, title, description) => {
    const canonical = `${ORIGIN}${route}`;
    const parts = route.split('/').filter(Boolean); // ['docs', 'input', 'button']
    const breadcrumbs = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN },
        { '@type': 'ListItem', position: 2, name: 'Components Library', item: `${ORIGIN}/docs` }
      ]
    };
    if (parts.length >= 2) {
      breadcrumbs.itemListElement.push({
        '@type': 'ListItem',
        position: 3,
        name: parts[1],
        item: `${ORIGIN}/docs/${parts[1]}`
      });
    }
    if (parts.length === 3) {
      breadcrumbs.itemListElement.push({
        '@type': 'ListItem',
        position: 4,
        name: parts[2],
        item: canonical
      });
    }
    return [
      {
        '@type': 'TechArticle',
        headline: title,
        description,
        url: canonical,
        author: { '@type': 'Organization', name: 'vkneider.dev' },
        publisher: { '@type': 'Organization', name: 'Slice.js' }
      },
      breadcrumbs
    ];
  };

  routes['/'] = {
    title: `${shellMeta.title}${TITLE_SUFFIX}`,
    description: shellMeta.description,
    robots: { index: true, follow: true },
    sitemap: { priority: '1.0', changefreq: 'weekly' },
    jsonLd: [websiteJsonLd]
  };

  for (const [route, meta] of Object.entries(STATIC_ROUTES)) {
    routes[route] = {
      title: `${meta.title}${TITLE_SUFFIX}`,
      description: meta.description,
      robots: { index: true, follow: true },
      sitemap: { priority: meta.priority, changefreq: meta.changefreq },
      jsonLd: [websiteJsonLd]
    };
  }

  for (const [route, title] of Object.entries(HIDDEN_ROUTES)) {
    routes[route] = {
      title: `${title}${TITLE_SUFFIX}`,
      description: '',
      // The server turns this into <meta name="robots" content="noindex, nofollow">
      // and keeps the route out of the sitemap.
      robots: false,
      jsonLd: [websiteJsonLd]
    };
  }

  for (const entry of entries) {
    const route = normalizeRoute(entry.route);
    if (!route || route === '/') continue;
    // A route listed twice (two files, same page) must not produce two sitemap
    // entries; the first one wins, exactly like the generated route tables.
    if (routes[route]) continue;

    const title = String(entry.title || '').trim() || route;
    const description =
      String(entry.description || '').trim() || DESCRIPTION_FALLBACK(title);
    const markdownFile = entry.markdownFile || '';

    routes[route] = {
      title: `${title}${TITLE_SUFFIX}`,
      description,
      robots: { index: true, follow: true },
      sitemap: {
        lastmod: markdownFile ? lastModified.get(markdownFile) || null : null,
        priority: '0.7',
        changefreq: 'monthly'
      },
      jsonLd: route.startsWith('/docs/')
        ? docsJsonLd(route, `${title}${TITLE_SUFFIX}`, description)
        : [websiteJsonLd]
    };
  }

  // Sorted so the generated file only changes when the input does: an unstable
  // key order would rewrite the manifest (and the sitemap) on every run.
  const sortedRoutes = {};
  for (const route of Object.keys(routes).sort()) sortedRoutes[route] = routes[route];

  return {
    version: 1,
    origin: ORIGIN,
    // Titles already carry the suffix, so there is nothing to compose. The
    // generic banner is the fallback for a route whose card was not generated
    // (internal pages, or a page added before the image generator ran).
    defaults: { titleTemplate: '%s', image: '/images/og-image.png' },
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
 * Sitemap XML from a manifest. Only routes the manifest marks indexable, sorted
 * by URL, with the `<lastmod>` we actually know (no fabricated date).
 */
const buildSitemap = (manifest) => {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];

  const routes = Object.keys(manifest.routes)
    .filter((route) => {
      const meta = manifest.routes[route];
      if (meta.robots === false || meta.robots?.index === false) return false;
      if (meta.sitemap === false) return false;
      return true;
    })
    .sort();

  for (const route of routes) {
    const meta = manifest.routes[route];
    const sitemap = meta.sitemap || {};
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(`${manifest.origin}${route}`)}</loc>`);
    if (sitemap.lastmod) lines.push(`    <lastmod>${escapeXml(sitemap.lastmod)}</lastmod>`);
    if (sitemap.changefreq) lines.push(`    <changefreq>${escapeXml(sitemap.changefreq)}</changefreq>`);
    if (sitemap.priority) lines.push(`    <priority>${escapeXml(sitemap.priority)}</priority>`);
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  lines.push('');
  return lines.join('\n');
};

/**
 * Write the SEO artifacts, skipping files whose content did not change.
 *
 * `seo.json` is the manifest the framework server reads; `sitemap.xml` is still
 * generated here (the CLI's `slice seo sitemap` takes over in a later step).
 *
 * @returns {{ manifest: object, changed: string[] }}
 */
const writeSeoArtifacts = ({ root, publicDir, entries }) => {
  // One `git log` call for the whole run: the sitemap's <lastmod> is the commit
  // date of the markdown file, not its mtime (which a fresh clone resets).
  const manifest = buildSeoManifest(entries, { root, lastModified: collectLastModified(root) });
  const manifestPath = path.join(publicDir, 'seo.json');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const changed = [];

  if (writeFileIfChanged(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)) {
    changed.push('seo.json');
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
