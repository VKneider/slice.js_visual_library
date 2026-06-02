import test from 'node:test';
import assert from 'node:assert/strict';

import { generateMainRoutesFile } from '../lib/routesSync.js';

test('generateMainRoutesFile includes all docs routes and maps them to ComponentsPage', () => {
  const entries = [
    { route: '/docs', component: 'DocumentationLibraryHome' },
    { route: '/docs/navigation/tabs', component: 'TabsDocumentation' },
    { route: '/docs/input/button', component: 'ButtonDocumentation' }
  ];

  const output = generateMainRoutesFile(entries);

  assert.match(output, /\{ path: '\/', component: 'App' \}/);
  // The persistent testing-harness route must always be emitted.
  assert.match(output, /\{ path: '\/__test', component: 'TestHarness' \}/);
  assert.match(output, /\{ path: '\/docs\/navigation\/tabs', component: 'ComponentsPage' \}/);
  assert.match(output, /\{ path: '\/docs\/input\/button', component: 'ComponentsPage' \}/);
  assert.match(output, /\{ path: '\/404', component: 'NotFound' \}/);
});
