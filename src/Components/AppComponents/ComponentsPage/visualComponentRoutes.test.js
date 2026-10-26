import test from 'node:test';
import assert from 'node:assert/strict';

import { buildVisualRoutes, getAllRoutes, resolveInitialDocsPath } from './visualComponentRoutes.js';

test('default docs route is present in flattened multiroute list', () => {
  const { routes } = buildVisualRoutes();
  const flat = getAllRoutes(routes);
  const hasDocsDefault = flat.some((route) => route.path === '/docs');
  assert.equal(hasDocsDefault, true);
});

test('resolveInitialDocsPath falls back to docs default for non-docs paths', () => {
  assert.equal(resolveInitialDocsPath('/'), '/docs');
  assert.equal(resolveInitialDocsPath('/about'), '/docs');
  assert.equal(resolveInitialDocsPath('/docs/input/button'), '/docs/input/button');
});

test('keeps Guides as a top-level navigation section instead of More', () => {
  const generatedRoutes = {
    Guides: {
      title: 'Guides',
      path: '/docs/guides',
      items: [
        {
          title: 'Data and loading',
          path: '/docs/guides/data-and-loading',
          component: 'DataAndLoadingDocumentation'
        }
      ]
    },
    Display: {
      title: 'Display',
      path: '/docs/display',
      items: [
        {
          title: 'Avatar',
          path: '/docs/display/avatar',
          component: 'AvatarDocumentation'
        }
      ]
    }
  };

  const { routes, buildCompactNavigationItems } = buildVisualRoutes(generatedRoutes);
  const items = buildCompactNavigationItems(routes);
  const guides = items.find((item) => item.value === 'Guides');
  const more = items.find((item) => item.value === 'More');

  assert.ok(guides);
  assert.deepEqual(guides.items.map((item) => item.value), ['Guides']);
  assert.deepEqual(guides.items[0].items.map((item) => item.value), ['Data and loading']);
  assert.equal(more, undefined);
});

test('keeps Developer Tools as a top-level navigation section instead of More', () => {
  const generatedRoutes = {
    DeveloperTools: {
      title: 'Developer Tools',
      path: '/docs/developer-tools',
      items: [
        {
          title: 'MiniInspector',
          path: '/docs/developer/mini-inspector',
          component: 'MiniInspectorDocumentation'
        }
      ]
    }
  };

  const { routes, buildCompactNavigationItems } = buildVisualRoutes(generatedRoutes);
  const items = buildCompactNavigationItems(routes);
  const developerTools = items.find((item) => item.value === 'Developer Tools');

  assert.ok(developerTools);
  assert.equal(developerTools.items[0].value, 'Developer Tools');
  assert.equal(developerTools.items[0].items[0].path, '/docs/developer/mini-inspector');
});
