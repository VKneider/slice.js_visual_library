import test from 'node:test';
import assert from 'node:assert/strict';

import { generateMainRoutesFile } from '../lib/routesSync.js';

test('generateMainRoutesFile keeps docs app-shell routes mapped to App', () => {
  const entries = [
    { route: '/docs', component: 'DocumentationLibraryHome' },
    { route: '/docs/navigation/tabs', component: 'TabsDocumentation' },
    { route: '/docs/input/button', component: 'ButtonDocumentation' }
  ];

  const output = generateMainRoutesFile(entries);

  assert.match(output, /\{ path: '\/', component: 'App' \}/);
  // The persistent testing-harness route must always be emitted.
  assert.match(output, /\{ path: '\/__test', component: 'TestHarness' \}/);
  assert.match(output, /\{ path: '\/docs', component: 'App' \}/);
  assert.match(output, /\{ path: '\/docs\/\$\{section\}', component: 'App' \}/);
  assert.match(output, /\{ path: '\/docs\/\$\{section\}\/\$\{page\}', component: 'App' \}/);
  assert.match(output, /\{ path: '\/docs\/\$\{section\}\/\$\{page\}\/\$\{detail\}', component: 'App' \}/);
  assert.match(output, /\{ path: '\/404', component: 'NotFound' \}/);
});
