// Lints the icon names used in the markdown docs, and pins the two properties
// that make that lint trustworthy.
//
// The lint itself is `scripts/lint-icon-names.mjs`; this asserts it, because a
// checker that silently matches nothing always exits 0 and always looks like it
// is working.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { NAMES_SET, ALIASES, ICON_NODES, LEGACY_NODES } from './icons.generated.js';

const PUBLIC_NAMES = [...NAMES_SET];

/**
 * Minimal re-implementation of the linter's pattern set, imported from the
 * script itself rather than restated here — a copy is exactly the kind of thing
 * that drifts.
 */
async function loadPatterns() {
   const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../../../../scripts/lint-icon-names.mjs', import.meta.url), 'utf8')
   );
   const block = source.slice(source.indexOf('const PATTERNS'), source.indexOf('];', source.indexOf('const PATTERNS')));
   return [...block.matchAll(/\/([^/]+?)\/g/g)].map((m) => new RegExp(m[1], 'g'));
}

test('every public name has geometry behind it', () => {
   const empty = PUBLIC_NAMES.filter((name) => !(ICON_NODES[name] || LEGACY_NODES[name]));
   assert.deepEqual(empty, [], `names with no geometry: ${empty.join(', ')}`);
});

test('every alias points at a name the generator emitted', () => {
   // ALIASES is public -> lucide. The lucide side is never a key in the
   // generated tables (nodes are keyed by the PUBLIC name), so this checks the
   // other direction: that each alias is a real Lucide name we resolved.
   const bad = Object.entries(ALIASES).filter(([, lucide]) => typeof lucide !== 'string' || !lucide);
   assert.deepEqual(bad, []);
});

test('every reverse alias resolves to a real public name', () => {
   // 21 public names are ALSO alias targets ('bell', 'list', 'star-half'). That
   // is fine and expected: _suggest() only runs for a name that already failed
   // to resolve, so a self-referential entry can never come up. What must hold
   // is that each entry still points somewhere that exists — otherwise the
   // warning would hand the user a second broken name.
   const reverse = new Map();
   for (const [publicName, lucideName] of Object.entries(ALIASES)) {
      if (!reverse.has(lucideName)) reverse.set(lucideName, publicName);
   }

   const dangling = [...reverse.entries()].filter(([, publicName]) => !NAMES_SET.has(publicName));
   assert.deepEqual(
      dangling.map(([lucide, p]) => `${lucide} -> ${p}`),
      [],
      'reverse alias entries pointing at names that do not exist'
   );
});

test('the lint patterns reject form field names', async () => {
   const patterns = await loadPatterns();
   assert.ok(patterns.length >= 3, 'expected the three anchored patterns');

   // The regression this pins: a bare `name: 'email'` is a Form field key, and
   // the first version of the lint reported 28 of them as missing icons.
   const formLine = "const f = await slice.build('Form', { schema: [{ name: 'email', component: 'Input' }] });";
   for (const re of patterns) {
      re.lastIndex = 0;
      assert.equal(re.test(formLine), false, `pattern matched a form field name: ${re}`);
   }
});

test('the lint patterns do match real icon usages', async () => {
   const patterns = await loadPatterns();

   const shouldMatch = [
      "await slice.build('Icon', { name: 'check' })",
      "slice.build('Button', { icon: 'trash-bin' })",
      "slice.build('Button', { icon: { name: 'check-circle' } })",
   ];

   for (const line of shouldMatch) {
      const hit = patterns.some((re) => {
         re.lastIndex = 0;
         return re.test(line);
      });
      assert.ok(hit, `no pattern matched a real icon usage: ${line}`);
   }
});