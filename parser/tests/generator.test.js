import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { writeComponentFiles } from '../lib/generator.js';

test('generated script scenarios render via DemoBox with code and live demo', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slice-docs-generator-'));
  const outputDir = path.join(tmpRoot, 'DocumentationPages');

  const parsed = {
    frontMatter: {
      title: 'Preview First',
      route: '/docs/test/preview-first',
      section: 'Test',
      group: 'Parser',
      order: 1,
      component: 'PreviewFirstDocumentation',
      markdownSource: '# Preview First'
    },
    html: '<h1>Preview First</h1>',
    jsBlocks: [
      {
        id: 'scenario-1',
        type: 'script',
        attrs: { label: 'basic scenario' },
        content: "const el = document.createElement('div'); el.textContent = 'ok'; return el;"
      }
    ]
  };

  writeComponentFiles(parsed, outputDir, 'preview-first.md');

  const generatedJsPath = path.join(
    outputDir,
    'PreviewFirstDocumentation',
    'PreviewFirstDocumentation.js'
  );
  const generatedJs = fs.readFileSync(generatedJsPath, 'utf8');

  // Scenarios render through a DemoBox: it holds both the CodeVisualizer (code)
  // and the executed live demo (appendDemo). See AGENTS.md "Live examples pattern".
  assert.match(generatedJs, /slice\.build\('DemoBox'/);
  assert.match(generatedJs, /slice\.build\('CodeVisualizer'/);
  assert.match(generatedJs, /demobox\.appendCode\(code\)/);
  assert.match(generatedJs, /demobox\.appendDemo\(/);

  // The DemoBox is attached to the scenarios section.
  assert.match(generatedJs, /section\.appendChild\(demobox\)/);
});

test('generated script scenarios pass a safe slice builder to scripts', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slice-docs-generator-safe-slice-'));
  const outputDir = path.join(tmpRoot, 'DocumentationPages');

  const parsed = {
    frontMatter: {
      title: 'Safe Slice',
      route: '/docs/test/safe-slice',
      section: 'Test',
      group: 'Parser',
      order: 2,
      component: 'SafeSliceDocumentation',
      markdownSource: '# Safe Slice'
    },
    html: '<h1>Safe Slice</h1>',
    jsBlocks: [
      {
        id: 'scenario-1',
        type: 'script',
        attrs: { label: 'safe scenario' },
        content: "return await slice.build('MissingComponent', {});"
      }
    ]
  };

  writeComponentFiles(parsed, outputDir, 'safe-slice.md');

  const generatedJsPath = path.join(
    outputDir,
    'SafeSliceDocumentation',
    'SafeSliceDocumentation.js'
  );
  const generatedJs = fs.readFileSync(generatedJsPath, 'utf8');

  assert.match(generatedJs, /const safeSlice = Object\.create\(slice\);/);
  assert.match(generatedJs, /safeSlice\.build = async \(name, props\) =>/);
  assert.match(generatedJs, /const result = await fn\(this, safeSlice, document, mount\);/);
});
