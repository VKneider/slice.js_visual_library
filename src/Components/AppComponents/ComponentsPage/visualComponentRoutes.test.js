import test from 'node:test';
import assert from 'node:assert/strict';

import { visualComponentsRoutes, getAllRoutes, resolveInitialDocsPath } from './visualComponentRoutes.js';

test('default docs route is present in flattened multiroute list', () => {
  const routes = getAllRoutes(visualComponentsRoutes);
  const hasDocsDefault = routes.some((route) => route.path === '/docs');
  assert.equal(hasDocsDefault, true);
});

test('resolveInitialDocsPath falls back to docs default for non-docs paths', () => {
  assert.equal(resolveInitialDocsPath('/'), '/docs');
  assert.equal(resolveInitialDocsPath('/about'), '/docs');
  assert.equal(resolveInitialDocsPath('/docs/input/button'), '/docs/input/button');
});
