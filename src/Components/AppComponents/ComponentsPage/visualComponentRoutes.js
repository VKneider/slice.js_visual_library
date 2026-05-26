import documentationRoutes from './documentationRoutes.generated.js';

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

export const createTreeViewItems = (routesConfig) => {
  const skipKeys = new Set(['defaultRoute']);
  const items = [];

  for (const [key, section] of Object.entries(routesConfig)) {
    if (skipKeys.has(key)) continue;
    if (!section || !Array.isArray(section.items) || section.items.length === 0) continue;

    items.push({
      value: section.title,
      items: section.items.map((item) => ({
        value: item.title,
        path: item.path,
        component: item.component
      }))
    });
  }

  return items;
};

export const resolveInitialDocsPath = (pathname, defaultPath = '/docs') => {
  const current = typeof pathname === 'string' ? pathname : '';
  if (current.startsWith('/docs')) {
    return current;
  }
  return defaultPath;
};
