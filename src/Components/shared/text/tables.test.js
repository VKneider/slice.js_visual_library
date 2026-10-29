// Freezes the EN/ES parity of every component's built-in text table. A missing Spanish key
// or a placeholder that drifted is a silent wrong language at runtime, and no component spec
// can see the other locale. The tables are module constants (not exported), so this reads the
// source with a small brace-aware parser; add a component here when it starts using texts().

import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const VISUAL = fileURLToPath(new URL('../../Visual', import.meta.url));

const PAIRS = {
  DatePicker: [['DP_TEXTS', 'ES'], ['DP_MESSAGES', 'ES_MESSAGES']],
  FileUpload: [['TEXTS', 'ES'], ['MESSAGES', 'ES_MESSAGES']],
  Table: [['DEFAULT_LABELS', 'ES']]
};

// Not copy: a variant is a class name, not a translation.
const NON_TEXT = new Set(['confirmVariant']);

/** The object literal assigned to `const <name> = {`, or null. */
function objectSource(source, name) {
  const start = source.search(new RegExp(`const ${name}\\s*=\\s*\\{`));
  if (start < 0) return null;
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  return null;
}

/** `{ 'a.b': Set(placeholders) }` for one object body. */
function entries(body) {
  const result = new Map();
  const lines = body.split(/\r?\n/);
  let depth = 0;
  let prefix = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    if (depth === 0) {
      const match = /^([A-Za-z_$][\w$]*)\s*:\s*(.*)$/.exec(trimmed);
      if (!match) continue;
      const [, key, rest] = match;
      if (rest.startsWith('{')) {
        // Nested group (Table operators, FileUpload messages): recurse into its lines.
        prefix = key;
        depth = 1;
        continue;
      }
      if (NON_TEXT.has(key)) continue;
      result.set(key, placeholders(rest));
      continue;
    }
    if (depth === 1) {
      if (trimmed.startsWith('}')) {
        depth = 0;
        prefix = '';
        continue;
      }
      const match = /^([A-Za-z_$][\w$]*)\s*:\s*(.*)$/.exec(trimmed);
      if (match && !NON_TEXT.has(`${prefix}.${match[1]}`)) {
        result.set(`${prefix}.${match[1]}`, placeholders(match[2]));
      }
    }
  }
  return result;
}

function placeholders(value) {
  const found = new Set();
  for (const match of String(value).matchAll(/\{(\w+)\}/g)) found.add(match[1]);
  return found;
}

const compare = (file, englishName, spanishName) => {
  const source = fs.readFileSync(file, 'utf8');
  const english = objectSource(source, englishName);
  const spanish = objectSource(source, spanishName);
  if (!english && !spanish) return;
  assert.ok(english, `${path.basename(file)}: missing ${englishName}`);
  assert.ok(spanish, `${path.basename(file)}: missing ${spanishName}`);
  const en = entries(english);
  const es = entries(spanish);
  assert.deepEqual([...es.keys()].sort(), [...en.keys()].sort(), `${path.basename(file)}: EN/ES keys differ`);
  for (const [key, enParams] of en) {
    assert.deepEqual(
      [...(es.get(key) || [])].sort(),
      [...enParams].sort(),
      `${path.basename(file)}: placeholders differ for "${key}"`
    );
  }
};

for (const entry of fs.readdirSync(VISUAL, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(VISUAL, entry.name, `${entry.name}.js`);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (!/const ES(_[A-Z]+)?\s*=\s*\{/.test(source)) continue;
  const pairs = PAIRS[entry.name] || [['TEXTS', 'ES']];
  for (const [english, spanish] of pairs) {
    test(`${entry.name}: ${english} and ${spanish} stay in sync`, () => {
      compare(file, english, spanish);
    });
  }
}
