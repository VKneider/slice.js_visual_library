// Rebuilds the Icon name table inside src/markdown/icon.md from the generated
// data, so it can never drift from what the component actually renders.
//
//   node scripts/generate-icon-table.mjs
//
// The table used to carry "Filled | Outlined" columns, which described the old
// two-style icon font. There is one style now, so it carries the source instead:
// which Lucide icon backs the name, or that it is one of the legacy marks.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { ALIASES, ICON_NODES, LEGACY_NODES } from '../src/Components/Visual/Icon/icons.generated.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DOC = resolve(ROOT, 'src/markdown/icon.md');

const START = '<!-- icon-table:start -->';
const END = '<!-- icon-table:end -->';

const names = Object.keys(ICON_NODES).concat(Object.keys(LEGACY_NODES)).sort((a, b) => {
   // Case-insensitive, but keep `X` (the brand mark) next to the other capitals.
   const la = a.toLowerCase();
   const lb = b.toLowerCase();
   return la < lb ? -1 : la > lb ? 1 : a < b ? -1 : 1;
});

const rows = names.map((name) => {
   if (LEGACY_NODES[name]) return `| \`${name}\` | legacy mark |`;
   const target = ALIASES[name];
   return `| \`${name}\` | ${target ? `\`${target}\`` : 'lucide'} |`;
});

const table = [
   START,
   '',
   `\`Icon\` exposes **${names.length} names**. \`Source\` is the Lucide icon behind each name, or`,
   '`legacy mark` for the brand, language and Slice marks Lucide does not ship (those keep their',
   'original artwork). The table is generated: see `scripts/generate-icon-table.mjs`.',
   '',
   '| Icon name | Source |',
   '|-----------|--------|',
   rows.join('\n'),
   '',
   END,
].join('\n');

const doc = readFileSync(DOC, 'utf8');
if (doc.includes(START)) {
   writeFileSync(DOC, doc.replace(new RegExp(`${START}[\\s\\S]*${END}`), table), 'utf8');
} else {
   // First run: drop everything from "## Icon Reference" to EOF and replace it.
   const at = doc.indexOf('## Icon Reference');
   if (at === -1) throw new Error('Could not find the "## Icon Reference" heading in icon.md');
   writeFileSync(DOC, `${doc.slice(0, at)}## Icon Reference\n\n${table}\n`, 'utf8');
}

console.log(`icon.md: ${names.length} rows (${Object.keys(LEGACY_NODES).length} legacy marks)`);