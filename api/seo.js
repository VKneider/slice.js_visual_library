// Adapter: the generated SEO artifacts -> the framework's manifest shape.
//
// The docs pipeline (parser/) owns the content: `seo-manifest.json` has one
// entry per route with title/description/section/lastmod, and `og/manifest.json`
// has the social card the image generator produced. The framework owns the
// mechanics: head injection, prerendering, 200/404, canonical and JSON-LD.
//
// Keeping the translation here (instead of changing the parser) means the
// migration to the framework server does not touch the content pipeline.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const FALLBACK_BANNER = { path: '/images/og-image.png', width: 1893, height: 932 };

const jsonLdFor = (route, meta, canonical, origin) => {
  if (route === '/') {
    return { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Slice.js Components', url: origin };
  }

  if (route.startsWith('/docs/')) {
    const parts = route.split('/').filter(Boolean);
    const breadcrumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
        { '@type': 'ListItem', position: 2, name: 'Components Library', item: `${origin}/docs` }
      ]
    };
    if (parts.length >= 2) {
      breadcrumbs.itemListElement.push({
        '@type': 'ListItem',
        position: 3,
        name: parts[1],
        item: `${origin}/docs/${parts[1]}`
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
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: meta.title,
        description: meta.description,
        url: canonical,
        author: { '@type': 'Organization', name: 'vkneider.dev' },
        publisher: { '@type': 'Organization', name: 'Slice.js' }
      },
      breadcrumbs
    ];
  }

  return { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Slice.js Components', url: origin };
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/**
 * @param {'src'|'dist'} folder deployed folder that holds public/
 * @returns {Object} manifest in the framework's shape (version 1)
 */
export function loadSeoManifest(folder) {
  const publicDir = path.join(here, '..', folder, 'public');
  const seo = readJson(path.join(publicDir, 'seo-manifest.json'));

  let og = { images: {} };
  try {
    og = readJson(path.join(publicDir, 'og', 'manifest.json'));
  } catch {
    // The cards are generated separately; without them every route falls back
    // to the generic banner, exactly like before.
  }

  const origin = seo.origin || 'https://components.slicejs.com';
  const routes = {};

  for (const [route, meta] of Object.entries(seo.routes || {})) {
    const canonical = `${origin}${route === '/' ? '/' : route}`;
    const image = og.images?.[route] || FALLBACK_BANNER;

    routes[route] = {
      title: meta.title,
      description: meta.description || '',
      // The old server emitted `index, follow` for every indexable route and
      // `noindex, nofollow` for internal ones. Same mapping, framework shape.
      robots: meta.indexable ? { index: true, follow: true } : false,
      image: image.path,
      imageAlt: meta.title,
      imageWidth: image.width,
      imageHeight: image.height,
      jsonLd: jsonLdFor(route, meta, canonical, origin)
    };
  }

  return {
    version: 1,
    origin,
    // Titles already carry their suffix ("Button | Slice.js"): no template.
    defaults: { titleTemplate: '%s' },
    routes
  };
}
