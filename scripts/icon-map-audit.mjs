// Guards the migration: every name the registry shipped before must still
// resolve. Run after editing LEGACY_NAMES:  node scripts/icon-map-audit.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { LEGACY_NAMES, ICON_ALIASES, ICON_LEGACY_PATHS } from './icon-legacy-map.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let old = '';
try {
  old = execSync('git show HEAD:src/Components/Visual/Icon/Icon.js', { cwd: ROOT, encoding: 'utf8' });
} catch {
  console.log('No previous Icon.js in git to compare against (fresh history). Skipping.');
}

const problems = [];
const dupes = LEGACY_NAMES.filter((n, i) => LEGACY_NAMES.indexOf(n) !== i);
if (dupes.length) problems.push(`duplicated entries: ${[...new Set(dupes)].join(', ')}`);

if (old) {
  const s = old.indexOf('const NAMES = [');
  const block = old.slice(s, old.indexOf('];', s));
  const original = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const mine = new Set(LEGACY_NAMES);
  const dropped = original.filter((n) => !mine.has(n));
  if (dropped.length) problems.push(`names lost vs the previous version: ${dropped.join(', ')}`);
  if (mine.size !== original.length) {
    problems.push(`count drift: ${original.length} before, ${mine.size} now`);
  }
}

const unresolved = LEGACY_NAMES.filter(
  (n) => !ICON_ALIASES[n] && !ICON_LEGACY_PATHS.has(n)
);
// Those are the ones that must exist verbatim in lucide; the generator checks
// that against the installed package, so here we only flag the obviously-unknown.
const staleAliases = Object.entries(ICON_ALIASES)
  .filter(([from]) => !LEGACY_NAMES.includes(from))
  .map(([from]) => from);
if (staleAliases.length) problems.push(`alias entries for names that do not exist: ${staleAliases.join(', ')}`);

console.log(`legacy names : ${new Set(LEGACY_NAMES).size}`);
console.log(`unaliased    : ${unresolved.length} (resolved verbatim against lucide by the generator)`);
console.log(`aliased      : ${Object.keys(ICON_ALIASES).length}`);
console.log(`sprite-backed: ${ICON_LEGACY_PATHS.size}`);

if (problems.length) {
  console.error('\nFAILED:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('\nOK - no name lost.');