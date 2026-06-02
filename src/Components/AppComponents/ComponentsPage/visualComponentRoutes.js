// ⚠️ Must stay absolute (/Components/...) — relative imports break when the
// bundle generator inlines this file into slice-bundle.vendor-shared.js served
// from /bundles/. Node tests resolve these via scripts/resolve-loader.js.
import documentationRoutes from '/Components/AppComponents/ComponentsPage/documentationRoutes.generated.js';
import docsIndex from '/Components/AppComponents/ComponentsPage/docsIndex.js';

if (typeof slice !== 'undefined' && slice.context && !slice.context.has('docsIndex')) {
  slice.context.create('docsIndex', docsIndex, { persist: false });
}

const baseVisualRoutes = {
  defaultRoute: {
    path: '/docs',
    component: 'VisualLibraryHome',
    title: 'Visual Library'
  }
};

const toSectionKey = (title) => {
  const safe = (title || 'Generated').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  if (!safe) return 'generatedDocumentation';
  const words = safe.split(/\s+/);
  return words
    .map((word, index) => {
      if (index === 0) return word.charAt(0).toLowerCase() + word.slice(1);
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
};

const mergeGeneratedDocumentation = (baseRoutes, generatedRoutes) => {
  if (!generatedRoutes || typeof generatedRoutes !== 'object') return baseRoutes;

  const merged = { ...baseRoutes };

  const generatedSections = Object.entries(generatedRoutes)
    .filter(([key, value]) => key !== 'defaultRoute' && value && Array.isArray(value.items));

  if (generatedSections.length === 0) return baseRoutes;

  for (const [, section] of generatedSections) {
    if (!section || !Array.isArray(section.items) || section.items.length === 0) continue;
    const key = toSectionKey(section.title);
    merged[key] = {
      title: section.title,
      path: section.path,
      items: section.items
    };
  }

  if (generatedRoutes.defaultRoute && generatedRoutes.defaultRoute.path && generatedRoutes.defaultRoute.component) {
    merged.defaultRoute = generatedRoutes.defaultRoute;
  }

  return merged;
};

export const visualComponentsRoutes = mergeGeneratedDocumentation(baseVisualRoutes, documentationRoutes);

const COMPACT_NAV_GROUPS = [
  {
    value: 'UI Components',
    sections: ['Display', 'Input Components', 'Navigation', 'Feedback']
  },
  {
    value: 'Layout & Structure',
    sections: ['Layout', 'Routing', 'Data']
  },
  {
    value: 'Services',
    sections: ['Services']
  },
  {
    value: 'Docs Internals',
    sections: ['Internal']
  }
];

const docsMetaByPath = new Map(
  (docsIndex || [])
    .filter((item) => item && item.route)
    .map((item) => [item.route, item])
);

const normalizeLeafItem = (sectionTitle, item) => {
  const meta = docsMetaByPath.get(item.path) || {};
  const tagsText = Array.isArray(meta.tags) ? meta.tags.join(' ') : '';
  const label = meta.navLabel || item.title;

  return {
    value: label,
    path: item.path,
    component: item.component,
    searchText: `${item.title || ''} ${label || ''} ${tagsText} ${sectionTitle || ''} ${item.path || ''}`
      .trim()
      .toLowerCase()
  };
};

const stripSearchMetadata = (node) => {
  const clean = {
    value: node.value
  };

  if (node.path) {
    clean.path = node.path;
  }

  if (node.component) {
    clean.component = node.component;
  }

  if (Array.isArray(node.items) && node.items.length > 0) {
    clean.items = node.items.map(stripSearchMetadata);
  }

  return clean;
};

const filterNode = (node, query) => {
  const ownText = `${node.value || ''} ${node.searchText || ''}`.toLowerCase();
  const ownMatch = ownText.includes(query);
  const children = Array.isArray(node.items) ? node.items : [];

  if (children.length === 0) {
    return ownMatch ? { ...node } : null;
  }

  const filteredChildren = children
    .map((child) => filterNode(child, query))
    .filter(Boolean);

  if (ownMatch || filteredChildren.length > 0) {
    return {
      ...node,
      items: filteredChildren
    };
  }

  return null;
};

export const getAllRoutes = (routesObj) => {
  const allRoutes = [];

  const processItems = (items) => {
    if (!items) return;

    for (const item of items) {
      if (item.path && item.component) {
        allRoutes.push({
          path: item.path,
          component: item.component
        });
      }

      if (item.items) {
        processItems(item.items);
      }
    }
  };

  for (const section of Object.values(routesObj)) {
    if (section.path && section.component) {
      allRoutes.push({
        path: section.path,
        component: section.component
      });
    }

    if (section.items) {
      processItems(section.items);
    }
  }

  return allRoutes;
};

export const buildCompactNavigationItems = (routesConfig) => {
  const skipKeys = new Set(['defaultRoute']);
  const sections = [];

  for (const [key, section] of Object.entries(routesConfig)) {
    if (skipKeys.has(key)) continue;
    if (!section || !Array.isArray(section.items) || section.items.length === 0) continue;

    sections.push({
      value: section.title,
      items: section.items.map((item) => normalizeLeafItem(section.title, item))
    });
  }

  const sectionByName = new Map(sections.map((section) => [section.value, section]));
  const compact = [];

  COMPACT_NAV_GROUPS.forEach((group) => {
    const groupedSections = group.sections
      .map((name) => sectionByName.get(name))
      .filter(Boolean);

    if (groupedSections.length > 0) {
      compact.push({
        value: group.value,
        items: groupedSections
      });
    }
  });

  const coveredSections = new Set(COMPACT_NAV_GROUPS.flatMap((group) => group.sections));
  const leftovers = sections.filter((section) => !coveredSections.has(section.value));

  if (leftovers.length > 0) {
    compact.push({
      value: 'More',
      items: leftovers
    });
  }

  return compact;
};

export const filterNavigationItems = (items, rawQuery = '') => {
  const query = String(rawQuery || '').trim().toLowerCase();
  if (!query) {
    return items;
  }

  return items
    .map((item) => filterNode(item, query))
    .filter(Boolean);
};

export const toTreeViewItems = (items) => {
  return (items || []).map(stripSearchMetadata);
};

export const createTreeViewItems = (routesConfig) => {
  return toTreeViewItems(buildCompactNavigationItems(routesConfig));
};

export const resolveInitialDocsPath = (pathname, defaultPath = '/docs') => {
  const current = typeof pathname === 'string' ? pathname : '';
  if (current.startsWith('/docs')) {
    return current;
  }
  return defaultPath;
};
