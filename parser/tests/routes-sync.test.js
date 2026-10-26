import test from 'node:test';
import assert from 'node:assert/strict';

import { generateMainRoutesFile } from '../lib/routesSync.js';
import { buildRoutesTree } from '../index.js';

test('generateMainRoutesFile lists every doc page and hides the wildcard', () => {
  const entries = [
    { route: '/docs', component: 'DocumentationLibraryHome' },
    { route: '/docs/navigation/tabs', component: 'TabsDocumentation' },
    { route: '/docs/input/button', component: 'ButtonDocumentation' }
  ];

  const output = generateMainRoutesFile(entries);

  assert.match(output, /\{ path: '\/', component: 'App' \}/);
  // The persistent testing-harness route must always be emitted.
  assert.match(output, /\{ path: '\/__test', component: 'TestHarness' \}/);
  // The hidden playground sandbox route must always be emitted.
  assert.match(output, /\{ path: '\/playground', component: 'Playground' \}/);
  assert.match(output, /\{ path: '\/docs', component: 'App' \}/);
  // Each real page is declared, so the Router can tell a page from a typo.
  assert.match(output, /\{ path: '\/docs\/input\/button', component: 'App' \}/);
  assert.match(output, /\{ path: '\/docs\/navigation\/tabs', component: 'App' \}/);
  // No `/docs/${...}` pattern: it would claim every nonexistent docs URL and
  // render the docs layout instead of the 404 page.
  assert.doesNotMatch(output, /\/docs\/\$\{/);
  assert.match(output, /\{ path: '\/404', component: 'NotFound' \}/);
});

test('documentation section paths follow the first page route namespace', () => {
  const tree = buildRoutesTree([
    {
      title: 'MiniInspector',
      navLabel: 'MiniInspector',
      route: '/docs/developer/mini-inspector',
      section: 'Developer Tools',
      group: 'Developer',
      order: 10,
      component: 'MiniInspectorDocumentation'
    }
  ]);

  assert.equal(tree.sections[0].path, '/docs/developer');
});
