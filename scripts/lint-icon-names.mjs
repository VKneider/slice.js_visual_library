#!/usr/bin/env node
// Lint icon names used in docs and demos.
//
// An unknown icon name is the quietest failure in the library: `slice.build`
// succeeds, the <svg> paints, and the glyph is simply missing. Nothing in the
// e2e run notices, because every component still renders. The only place it
// surfaces is a human looking at a demo and asking why the button has a gap in
// it.
//
// So this walks the markdown and reports every name it can see, splitting the
// two outcomes that both need action but mean different things:
//
//   unknown  — the name resolves to nothing. Usually a Lucide name typed by
//              habit ('circle-check' where the library publishes
//              'check-circle'); Icon's runtime warning suggests the fix.
//   renamed  — the name is a Lucide name the library used to publish under
//              this alias. Valid syntax, still worth a look.
//
// Exits non-zero on `unknown` only, so `renamed` stays advisory.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { NAMES_SET, ALIASES } from '../src/Components/Visual/Icon/icons.generated.js';

const ROOT = new URL('../src/markdown/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const LUCIDE_TO_PUBLIC = new Map();
for (const [publicName, lucideName] of Object.entries(ALIASES)) {
   if (!LUCIDE_TO_PUBLIC.has(lucideName)) LUCIDE_TO_PUBLIC.set(lucideName, publicName);
}

// Distance-based fallback, mirroring Icon's runtime suggestion so the two
// never disagree about what the closest name is.
function editDistance(a, b) {
   if (a === b) return 0;
   const row = Array.from({ length: b.length + 1 }, (_, i) => i);
   for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
         const next = row[j];
         row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
         prev = next;
      }
   }
   return row[b.length];
}

function suggest(name) {
   const needle = name.toLowerCase();
   const renamed = LUCIDE_TO_PUBLIC.get(needle);
   if (renamed) return `did you mean "${renamed}"?`;
   let best = null;
   let bestDistance = Infinity;
   for (const candidate of NAMES_SET) {
      const d = editDistance(needle, candidate.toLowerCase());
      if (d < bestDistance) {
         bestDistance = d;
         best = candidate;
      }
   }
   return bestDistance <= Math.max(1, Math.floor(needle.length / 3))
      ? `did you mean "${best}"?`
      : null;
}

// Only three shapes can be an icon name, and each is anchored so that a plain
// `name: 'email'` — a Form field key — can never match. That anchoring is the
// whole design of this script: the first version matched ANY `name:` and
// reported 28 form fields as missing icons.
//
//   slice.build('Icon', { name: 'x' })
//   icon: { name: 'x' }        (Button and friends)
//   icon: 'x'                  (Button string shorthand)
//
// A generic `name:` also legitimately appears inside generated code fences and
// inside the Icon reference page itself, where it documents the prop rather
// than using an icon.
const PATTERNS = [
   // slice.build('Icon', { name: 'x' }) — the whole call, so the name is taken
   // from inside it rather than from any later `name:` in the same file.
   /build\(\s*['"]Icon['"]\s*,\s*\{[\s\S]{0,200}?\bname\s*:\s*'([a-z0-9-]+)'/g,
   // icon: { name: 'x' }
   /\bicon\s*:\s*\{\s*name\s*:\s*'([a-z0-9-]+)'/g,
   // icon: 'x'
   /\bicon\s*:\s*'([a-z0-9-]+)'/g,
].map((re) => ({ re }));

// The Icon reference page documents the `name` prop with placeholder values.
// Those are illustrations of the prop, not icon references, so excluding the
// page keeps the report about real usage.
const SELF_REFERENCE = /(^|\/)icon\.md$/;

function markdownFiles(dir) {
   const out = [];
   for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...markdownFiles(full));
      else if (entry.endsWith('.md')) out.push(full);
   }
   return out;
}

const unknown = [];
const renamed = [];

for (const file of markdownFiles(ROOT)) {
   const source = readFileSync(file, 'utf8');
   const rel = file.replace(/\\/g, '/').split('/src/markdown/')[1] ?? file;
   if (SELF_REFERENCE.test(rel)) continue;

   for (const { re } of PATTERNS) {
      re.lastIndex = 0;
      let match;
      while ((match = re.exec(source)) !== null) {
         const name = match[1];
         if (NAMES_SET.has(name)) continue;

         const line = source.slice(0, match.index).split('\n').length;
         const hint = suggest(name);
         const entry = { file: rel, line, name, hint };

         // A known Lucide name that simply is not ours reads differently from a
         // typo, and so does the remedy.
         if (LUCIDE_TO_PUBLIC.has(name.toLowerCase())) renamed.push(entry);
         else unknown.push(entry);
      }
   }
}

const total = unknown.length + renamed.length;

if (total === 0) {
   console.log('Icon names: all resolve.');
   process.exit(0);
}

if (renamed.length) {
   console.log(`\nIcon names that are Lucide aliases (${renamed.length}):`);
   for (const { file, line, name, hint } of renamed) {
      console.log(`  ${file}:${line}  "${name}" — ${hint}`);
   }
}

if (unknown.length) {
   console.log(`\nIcon names that resolve to nothing (${unknown.length}):`);
   for (const { file, line, name, hint } of unknown) {
      console.log(`  ${file}:${line}  "${name}"${hint ? ` — ${hint}` : ' — no close match'}`);
   }
   console.log('');
   process.exit(1);
}

console.log('');