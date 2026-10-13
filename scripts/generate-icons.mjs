// Generates src/Components/Visual/Icon/icons.generated.js from the `lucide`
// package (dev-only) plus the original `slc` sprite.
//
//   pnpm add -D lucide && node scripts/generate-icons.mjs
//
// Why a generated file instead of a runtime dependency: this repository is the
// component registry — consumers copy `Icon` into their app with `slice get`
// and should not have to install an icon package. The file ships only the
// glyphs the registry actually exposes (~270), not all ~1900 Lucide icons, so
// the component stays small.
//
// Re-run it whenever the pinned `lucide` version changes; never edit the output
// by hand. It FAILS on an unmapped legacy name rather than silently dropping it.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { ICON_ALIASES, ICON_LEGACY_PATHS } from './icon-legacy-map.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LUCIDE_ICONS = resolve(ROOT, 'node_modules/lucide/dist/esm/icons');
// The old icon font's sprite. It lives in scripts/, not next to the component,
// so `slice get Icon` does not ship a 240 KB vector-export nobody needs — only
// the 23 brand/mark glyphs extracted from it end up in the generated file.
const SPRITE = resolve(__dirname, 'icon-sprite.source.svg');
const OUT = resolve(ROOT, 'src/Components/Visual/Icon/icons.generated.js');
const LEGACY_SRC = resolve(ROOT, 'src/Components/Visual/Icon/Icon.js');

// ── 1. The legacy name list is the public API.
// `Icon.js` used to carry it inline; `icon-legacy-map.mjs` does now, so the
// generator does not depend on a component's source layout.
const { LEGACY_NAMES } = await import('./icon-legacy-map.mjs');
const legacyNames = LEGACY_NAMES;

// ── 2. Every name lucide ships verbatim.
const lucideNames = new Set(
   readdirSync(LUCIDE_ICONS).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, ''))
);

// ── 3. Brand / language / Slice marks keep their original outlines.
const sprite = readFileSync(SPRITE, 'utf8');
const spritePaths = new Map();
const spriteViewBoxes = new Map();
for (const m of sprite.matchAll(/<symbol[^>]*viewBox="([^"]+)"[^>]*id="slc-(?:fil|out)([^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) {
   // Prefer the outlined variant; brand marks often have no meaningful fill
   // counterpart, and an outline is the only thing that recolours with `color`.
   if (!spritePaths.has(m[2])) {
      spritePaths.set(m[2], sanitizeSprite(m[3]));
      // The symbol's OWN viewBox, which is NOT always 24x24. The sprite mixes
      // authoring systems: most icons are 24x24, but the brand and Slice marks
      // came out of a vector editor on a ~1000-1180 unit grid (`sliceJs` is
      // 1061x1320). Assuming 24x24 for all of them painted those marks ~55x
      // too large — and since Icon.css sets `overflow: visible`, they escaped
      // the layout box and covered the page instead of just looking wrong.
      spriteViewBoxes.set(m[2], m[1]);
   }
}

// The sprite came out of a vector editor, so a few symbols still carry authoring
// debris: a <style> block with hard-coded hex fills, a <title>, and ids. Strip it
// and make every paint follow `currentColor`, then normalise to the same
// [tag, attrs] node tuples Lucide uses — so the component has ONE render path
// and never has to parse markup at runtime.
function sanitizeSprite(markup) {
   const clean = markup
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<title[\s\S]*?<\/title>/gi, '')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

   const nodes = [];
   for (const m of clean.matchAll(/<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*)\/?>/gi)) {
      const attrs = {};
      for (const a of m[2].matchAll(/([a-z-]+)\s*=\s*"([^"]*)"/gi)) {
         // Every paint follows the inherited colour, so an icon recolours with
         // its surroundings instead of freezing a hex from the export.
         if (a[1] === 'class' || a[1] === 'id') continue;
         if (a[1] === 'fill' && a[2] !== 'none') { attrs.fill = 'currentColor'; continue; }
         attrs[a[1]] = a[2];
      }
      nodes.push([m[1], attrs]);
   }
   if (!nodes.length) throw new Error(`No drawable nodes left in sprite symbol:\n${clean.slice(0, 120)}`);
   return nodes;
}

// ── 4. Resolve every legacy name.
const icons = {};
const legacyOnly = {};
const aliasMap = {};
const problems = [];

for (const name of legacyNames) {
   if (lucideNames.has(name)) { icons[name] = name; continue; }
   if (ICON_LEGACY_PATHS.has(name)) {
      const markup = spritePaths.get(name);
      if (!markup) { problems.push(`"${name}": no outline in slc.symbol.svg`); continue; }
      legacyOnly[name] = markup;
      continue;
   }
   const target = ICON_ALIASES[name];
   if (!target) { problems.push(`"${name}": no Lucide match and no alias entry`); continue; }
   if (!lucideNames.has(target)) { problems.push(`"${name}" -> "${target}": not a Lucide icon`); continue; }
   icons[name] = target;
   aliasMap[name] = target;
}

if (problems.length) {
   console.error('Icon migration failed — every legacy name must resolve:\n  ' + problems.join('\n  '));
   process.exit(1);
}

// ── 5. Emit.
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/lucide/package.json'), 'utf8'));
const header = `// GENERATED FILE - do not edit. Run \`node scripts/generate-icons.mjs\`.
//
// Icon data for ${legacyNames.length} names, the same public API the registry
// shipped before the Lucide migration. Lucide ${pkg.version}, inlined so a
// consumer who runs \`slice get Icon\` does not also need an icon dependency.
//
// ALIASES maps a public name to the Lucide icon behind it. LEGACY_NODES holds
// the original sprite markup for the brand, language and Slice marks Lucide
// deliberately does not ship. Both are keyed by the public name, so a consumer's
// existing \`name\` prop never resolves to nothing.
`;

// ICON_NODES holds the geometry for EVERY lucide-backed public name, keyed by
// the public name. ALIASES is the audit table: it only lists the names that had
// to be pointed at a differently-named lucide icon.
const data = new Map();
for (const name of Object.keys(icons).sort()) {
   const src = readFileSync(resolve(LUCIDE_ICONS, `${icons[name]}.mjs`), 'utf8');
   // `const Name = [["path", {...}], ...];` — the array is either one line or
   // pretty-printed, so locate it structurally rather than with a line regex.
   const eq = src.indexOf(' = ');
   const start = src.indexOf('[', eq);
   const end = src.indexOf('];', start);
   if (eq === -1 || start === -1 || end === -1) {
      throw new Error(`Could not parse lucide icon data for ${icons[name]}`);
   }
   data.set(name, src.slice(start, end + 1).replace(/\s*\n\s*/g, ' '));
}

const iconEntries = [...data.entries()].map(([name, nodes]) => `   '${name}': ${nodes},`).join('\n');

// ALIASES is documentation: which public name maps onto which lucide icon.
const aliasEntries = Object.keys(aliasMap).sort()
   .map((from) => `   '${from}': '${aliasMap[from]}',`).join('\n');
const legacyEntries = Object.keys(legacyOnly).sort()
   .map((name) => `   '${name}': ${JSON.stringify(legacyOnly[name]).replace(/","/g, '", "')},`).join('\n');
const viewBoxEntries = Object.keys(legacyOnly).sort()
   .map((name) => `   '${name}': '${spriteViewBoxes.get(name) || '0 0 24 24'}',`).join('\n');

writeFileSync(OUT, `${header}
export const SOURCE = '${pkg.version}';

export const ALIASES = {
${aliasEntries}
};

export const ICON_NODES = {
${iconEntries}
};

export const LEGACY_NODES = {
${legacyEntries}
};

// Each sprite mark's own viewBox. NOT uniform: see the capture above.
export const LEGACY_VIEWBOX = {
${viewBoxEntries}
};

// Every public name resolves to one of the two tables above.
export const NAMES = Object.keys(ICON_NODES).concat(Object.keys(LEGACY_NODES));
export const NAMES_SET = new Set(NAMES);
`);

console.log(`Wrote ${OUT.replace(ROOT + '\\\\', '')}`);
console.log(`  lucide ${pkg.version}`);
console.log(`  lucide-backed : ${Object.keys(icons).length}`);
console.log(`  legacy sprite : ${Object.keys(legacyOnly).length}`);
console.log(`  renamed       : ${Object.keys(aliasMap).length}`);
console.log(`  total public  : ${legacyNames.length}`);