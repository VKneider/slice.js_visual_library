// Rebuilds the Icon reference inside src/markdown/icon.md from the generated
// data, so it can never drift from what the component actually renders.
//
//   node scripts/generate-icon-table.mjs
//
// It used to emit a markdown TABLE with one row per name: 291 rows, roughly
// 300 lines of rendered markup, two text columns, no glyphs, and nothing you
// could search. A table is the wrong shape for a catalogue of pictures.
//
// It now emits a single live `:::script` block - a searchable, filterable grid
// of every name with its glyph drawn next to it. The DATA is still generated
// (names and their source mapping are inlined as JS), so it still cannot
// drift, but the page renders a grid instead of a scroll.
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
   const la = a.toLowerCase();
   const lb = b.toLowerCase();
   return la < lb ? -1 : la > lb ? 1 : a < b ? -1 : 1;
});

// null for a name Lucide backs 1:1, the Lucide name for an alias, or
// 'legacy mark' for the brand/language/Slice artwork.
const sourceOf = (name) => {
   if (LEGACY_NODES[name]) return 'legacy mark';
   return ALIASES[name] || null;
};

const rows = names.map((name) => [name, sourceOf(name)]);

const intro = [
   START,
   '',
   `\`Icon\` exposes **${names.length} names**. Every one is listed below, searchable, with its glyph
   drawn next to it. Click a cell to copy its name.

   Hovering a cell names its **source**: which Lucide icon backs the name. Most need no
   explanation, which is why it is a tooltip rather than a column. A name that says
   \`legacy mark\` is a brand, language or Slice mark Lucide does not ship, so it keeps its
   original artwork - and its original, non-24x24 viewBox.

   Generated from \`icons.generated.js\` by \`scripts/generate-icon-table.mjs\`. Edit the generator,
   not this block.`,
   '',
];

const script = `:::script label="Every icon, searchable" expected="${names.length} cells; type to filter, or narrow by source"
const NAMES = ${JSON.stringify(rows.map(([n]) => n))};
const SOURCE = ${JSON.stringify(Object.fromEntries(rows.filter(([, s]) => s)))};

// Joins CSS chunks WITH a separator, and the chunks carry no trailing ";".
// This is not fussy formatting: a naive chunks.join("") glues two
// declarations into one invalid rule and the browser drops it silently, which
// is how this grid first shipped collapsed to a single column.
const css = (...chunks) => chunks.filter(Boolean).join(';');

const host = document.createElement('div');
host.style.cssText = 'display:flex;flex-direction:column;gap:12px';

const count = document.createElement('p');
count.style.cssText = 'margin:0;font-size:.8em;color:var(--font-secondary-color)';

const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap';

const search = document.createElement('input');
search.type = 'search';
search.placeholder = 'Filter ${names.length} icons...';
search.setAttribute('aria-label', 'Filter icons by name');
search.style.cssText = css(
   'flex:1 1 220px;min-width:0;padding:8px 10px',
   'font:inherit;font-size:.85em',
   'border:1px solid var(--slice-border,var(--medium-color))',
   'border-radius:6px',
   'background:var(--primary-background-color);color:var(--font-primary-color)'
);

const FILTERS = [
   ['all', 'All'],
   ['lucide', 'Lucide'],
   ['alias', 'Renamed'],
   ['legacy mark', 'Marks'],
];
const filters = document.createElement('div');
filters.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
let activeFilter = 'all';

const grid = document.createElement('div');
grid.style.cssText = css(
   // The row maths that the broken version lost.
   'display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr))',
   'gap:8px;padding:4px',
   'max-height:520px;overflow:auto'
);

const paintChip = (chip, on) => {
   chip.style.background = on ? 'var(--primary-color)' : 'var(--primary-background-color)';
   chip.style.color = on ? 'var(--primary-color-contrast,#fff)' : 'var(--font-primary-color)';
};

// async: it awaits slice.build for the glyph.
const cellOf = async (name) => {
   const source = SOURCE[name] || null;

   const cell = document.createElement('button');
   cell.type = 'button';
   cell.dataset.name = name;
   cell.title = source ? name + ' -> ' + source + ' (click to copy)' : name + ' (click to copy)';
   cell.style.cssText = css(
      'display:flex;flex-direction:column;align-items:center;gap:6px',
      'padding:12px 6px;border-radius:8px',
      'font:inherit;cursor:pointer',
      'border:1px solid transparent',
      'background:color-mix(in srgb,var(--primary-background-color) 96%,var(--primary-color))',
      'color:var(--font-primary-color)'
   );

   cell.addEventListener('mouseenter', () => {
      cell.style.borderColor = 'color-mix(in srgb,var(--primary-color) 45%,transparent)';
   });
   cell.addEventListener('mouseleave', () => {
      cell.style.borderColor = 'transparent';
   });
   cell.addEventListener('click', async () => {
      try {
         await navigator.clipboard.writeText(name);
         count.textContent = 'Copied "' + name + '"';
      } catch {
         // Clipboard is permission-gated; the name is right there on screen.
         count.textContent = name;
      }
   });

   const glyph = document.createElement('span');
   glyph.style.cssText = 'display:flex;align-items:center;justify-content:center;height:26px';
   glyph.appendChild(await slice.build('Icon', { name, size: '22px' }));
   cell.appendChild(glyph);

   const tag = document.createElement('span');
   tag.textContent = name;
   tag.style.cssText = css(
      'font-size:.5em;line-height:1.2;text-align:center;max-width:100%',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
      'color:' + (source === 'legacy mark' ? 'var(--primary-color)' : 'var(--font-secondary-color)'),
      source === 'legacy mark' ? 'font-weight:600' : null
   );
   cell.appendChild(tag);

   return cell;
};

const matches = () => {
   const q = search.value.trim().toLowerCase();
   return NAMES.filter((name) => {
      const source = SOURCE[name] || null;
      const bySource =
         activeFilter === 'all' ||
         (activeFilter === 'lucide' && source === null) ||
         (activeFilter === 'alias' && source !== null && source !== 'legacy mark') ||
         (activeFilter === 'legacy mark' && source === 'legacy mark');
      if (!bySource) return false;
      if (!q) return true;
      // Match the public name AND the Lucide name behind it, so either
      // spelling finds the icon.
      return name.toLowerCase().includes(q) || (source || '').toLowerCase().includes(q);
   });
};

const render = async () => {
   const list = matches();
   grid.replaceChildren();
   // Awaited in order so the grid fills top-to-bottom as each glyph resolves.
   for (const name of list) grid.appendChild(await cellOf(name));
   count.textContent =
      list.length === NAMES.length
         ? NAMES.length + ' icons'
         : list.length + ' of ' + NAMES.length + ' icons';
};

for (const [key, label] of FILTERS) {
   const chip = document.createElement('button');
   chip.type = 'button';
   chip.textContent = label;
   chip.dataset.filter = key;
   chip.setAttribute('aria-pressed', String(key === activeFilter));
   chip.style.cssText = css(
      'padding:6px 12px;border-radius:999px',
      'font:inherit;font-size:.75em;cursor:pointer',
      'border:1px solid var(--slice-border,var(--medium-color))'
   );
   paintChip(chip, key === activeFilter);
   chip.addEventListener('click', () => {
      activeFilter = key;
      for (const other of filters.children) {
         const on = other.dataset.filter === key;
         other.setAttribute('aria-pressed', String(on));
         paintChip(other, on);
      }
      render();
   });
   filters.appendChild(chip);
}

bar.appendChild(search);
bar.appendChild(filters);

host.appendChild(count);
host.appendChild(bar);
host.appendChild(grid);

let timer = null;
search.addEventListener('input', () => {
   clearTimeout(timer);
   timer = setTimeout(render, 120);
});

await render();
return host;
:::`;

const source = readFileSync(DOC, 'utf8');
const start = source.indexOf(START);
const end = source.indexOf(END);

if (start === -1 || end === -1) {
   throw new Error(`Could not find the ${START} / ${END} markers in src/markdown/icon.md`);
}

const next = `${source.slice(0, start)}${[...intro, script, ''].join('\n')}${source.slice(end + END.length)}`;
writeFileSync(DOC, next, 'utf8');

console.log(`Wrote ${DOC.replace(ROOT + '\\', '')}`);
console.log(`  names      : ${names.length}`);
console.log(`  legacy     : ${names.filter((n) => sourceOf(n) === 'legacy mark').length}`);
console.log(`  renamed    : ${names.filter((n) => sourceOf(n) && sourceOf(n) !== 'legacy mark').length}`);
console.log(`  1:1 lucide : ${names.filter((n) => sourceOf(n) === null).length}`);