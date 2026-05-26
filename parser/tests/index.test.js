import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { validateFrontMatter, mergeComponentsRegistry, lintMarkdownSourceForManualPropsTable } from '../index.js';
import { buildStaticPropsSectionForFrontMatter } from '../lib/staticPropsDocs.js';

test('validateFrontMatter reports missing required fields', () => {
  const errors = validateFrontMatter({ title: 'Button' }, 'button.md');
  assert.equal(errors.length > 0, true);
  assert.equal(errors.some((error) => error.includes('route')), true);
  assert.equal(errors.some((error) => error.includes('component')), true);
});

test('validateFrontMatter accepts valid front matter', () => {
  const errors = validateFrontMatter(
    {
      title: 'Button',
      route: '/library/input/button',
      section: 'Input',
      group: 'Basic',
      order: '1',
      component: 'ButtonDocumentation'
    },
    'button.md'
  );

  assert.deepEqual(errors, []);
});

test('mergeComponentsRegistry injects documentation components and copy menu', () => {
  const registry = {
    Button: 'Visual',
    FetchManager: 'Service'
  };

  const merged = mergeComponentsRegistry(registry, ['ButtonDocumentation', 'CardDocumentation']);

  assert.equal(merged.Button, 'Visual');
  assert.equal(merged.ButtonDocumentation, 'DocumentationPages');
  assert.equal(merged.CardDocumentation, 'DocumentationPages');
  assert.equal(merged.CopyMarkdownMenu, 'AppComponents');
});

test('mergeComponentsRegistry preserves existing visual components like Tabs', () => {
  const registry = {
    Tabs: 'Visual',
    Button: 'Visual'
  };

  const merged = mergeComponentsRegistry(registry, ['TabsDocumentation']);

  assert.equal(merged.Tabs, 'Visual');
  assert.equal(merged.TabsDocumentation, 'DocumentationPages');
});

test('buildStaticPropsSectionForFrontMatter renders Allowed values from static props', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slice-docs-static-props-'));
  const srcDir = path.join(tmpRoot, 'src');
  const visualDir = path.join(srcDir, 'Components', 'Visual', 'Button');

  fs.mkdirSync(visualDir, { recursive: true });

  fs.writeFileSync(
    path.join(srcDir, 'sliceConfig.json'),
    JSON.stringify(
      {
        paths: {
          components: {
            Visual: { path: '/Components/Visual', type: 'Visual' }
          }
        }
      },
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    path.join(srcDir, 'Components', 'components.js'),
    `const components = {"Button": "Visual", "ButtonDocumentation": "DocumentationPages"};\n\nexport default components;\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(visualDir, 'Button.js'),
    `
    export default class Button extends HTMLElement {
      static props = {
        variant: { type: 'string', required: false, default: 'primary', allowedValues: ['primary', 'secondary', 'danger'] },
        disabled: { type: 'boolean', required: false, default: false }
      };
    }
    `,
    'utf8'
  );

  const section = await buildStaticPropsSectionForFrontMatter({
    projectRoot: tmpRoot,
    frontMatter: {
      component: 'ButtonDocumentation'
    }
  });

  assert.equal(typeof section, 'string');
  assert.match(section, /Props \(Generated from static props\)/);
  assert.match(section, /Allowed values/);
  assert.match(section, /`primary`, `secondary`, `danger`/);
});

test('buildStaticPropsSectionForFrontMatter returns empty string when source component has no static props', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slice-docs-static-props-empty-'));
  const srcDir = path.join(tmpRoot, 'src');
  const visualDir = path.join(srcDir, 'Components', 'Visual', 'Badge');

  fs.mkdirSync(visualDir, { recursive: true });

  fs.writeFileSync(
    path.join(srcDir, 'sliceConfig.json'),
    JSON.stringify(
      {
        paths: {
          components: {
            Visual: { path: '/Components/Visual', type: 'Visual' }
          }
        }
      },
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    path.join(srcDir, 'Components', 'components.js'),
    `const components = {"Badge": "Visual", "BadgeDocumentation": "DocumentationPages"};\n\nexport default components;\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(visualDir, 'Badge.js'),
    `
    export default class Badge extends HTMLElement {
      constructor() {
        super();
      }
    }
    `,
    'utf8'
  );

  const section = await buildStaticPropsSectionForFrontMatter({
    projectRoot: tmpRoot,
    frontMatter: {
      component: 'BadgeDocumentation'
    }
  });

  assert.equal(section, '');
});

test('buildStaticPropsSectionForFrontMatter renders nested schema and array item rows', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slice-docs-static-props-nested-'));
  const srcDir = path.join(tmpRoot, 'src');
  const visualDir = path.join(srcDir, 'Components', 'Visual', 'Wizard');

  fs.mkdirSync(visualDir, { recursive: true });

  fs.writeFileSync(
    path.join(srcDir, 'sliceConfig.json'),
    JSON.stringify(
      {
        paths: {
          components: {
            Visual: { path: '/Components/Visual', type: 'Visual' }
          }
        }
      },
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    path.join(srcDir, 'Components', 'components.js'),
    `const components = {"Wizard": "Visual", "WizardDocumentation": "DocumentationPages"};\n\nexport default components;\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(visualDir, 'Wizard.js'),
    `
    export default class Wizard extends HTMLElement {
      static props = {
        options: {
          type: 'object',
          schema: {
            theme: {
              type: 'object',
              schema: {
                mode: { type: 'string', allowedValues: ['light', 'dark'] }
              }
            }
          }
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            schema: {
              id: { type: 'string', required: true },
              state: { type: 'string', allowedValues: ['pending', 'done'] }
            }
          }
        }
      };
    }
    `,
    'utf8'
  );

  const section = await buildStaticPropsSectionForFrontMatter({
    projectRoot: tmpRoot,
    frontMatter: {
      component: 'WizardDocumentation'
    }
  });

  assert.equal(typeof section, 'string');
  assert.match(section, /`options\.theme\.mode`/);
  assert.match(section, /`steps\[\]\.id`/);
  assert.match(section, /`steps\[\]\.state`/);
  assert.match(section, /`light`, `dark`/);
  assert.match(section, /`pending`, `done`/);
});

test('lint rejects markdown with manual props table pattern', () => {
  const markdown = `---
title: Button
route: /docs/input/button
section: Input
group: Basic
order: 1
component: ButtonDocumentation
---

# Button

## API

| Prop | Type | Default |
| --- | --- | --- |
| variant | string | primary |
`;

  const errors = lintMarkdownSourceForManualPropsTable(markdown, 'src/markdown/button.md');

  assert.equal(errors.length, 1);
  assert.match(errors[0], /src\/markdown\/button\.md/);
  assert.match(errors[0], /Manual props table detected/);
  assert.match(errors[0], /Props \(Generated from static props\)/);
});
