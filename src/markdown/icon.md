---
title: Icon
route: /docs/display/icon
navLabel: Icon
section: Display
group: Basic
order: 20
description: Complete icon reference with all 291 symbols, usage patterns, and style variants.
component: IconDocumentation
generate: true
tags: [icon, display, reference]
---

# Icon

## Overview
`Icon` renders an inline **SVG** glyph: no icon font, no webfont download, no global stylesheet. Use the `name` prop with the exact names listed below.

:::warning Breaking change (Lucide migration)
Icon used to render a glyph from the **slc** icon font, where every symbol came in a `filled` and an `outlined` variant. It now renders **Lucide**, which is stroke-only.

- **All 291 names still work.** Names Lucide spells differently (`trash-bin`, `angle-down`, `check-circle`, ...) are aliased to their Lucide equivalent; the brand, language and Slice marks Lucide does not ship keep their original artwork. Run `node scripts/icon-map-audit.mjs` to see the full mapping, or read `ALIASES` in `icons.generated.js`.
- **`iconStyle` is a deprecated no-op.** It is still accepted (and warns once) so existing callers keep working, but it no longer selects anything: drop it.
- **The `slc-*` glyph classes are gone.** If your CSS targeted `slice-icon .slc-filrocket`, delete that rule and style the host or the `<svg>` instead. The old stylesheet styled `[class^="slc-"]` at global scope, so those rules were leaking anyway.
- **`color` now defaults to `currentColor`**, so an icon inherits its surroundings and follows the theme. Pass an explicit color to override.
- **Size and color land on the host**, so `getComputedStyle(icon).fontSize` is meaningful and the glyph scales with the surrounding text.
- **A few names now draw the same glyph** (`angle-down` and `caret-down` are both the chevron) because Lucide merged the old duplicates.
:::

## API

- `name` (string, default `"youtube"`) — Icon symbol name (see full list below). An unknown name warns and renders nothing.
- `size` (string, default `"small"`) — `"small"` (16px), `"medium"` (20px), `"large"` (24px), or any CSS size.
- `color` (string, default `"currentColor"`) — Any CSS color value.
- `label` (string, default `""`) — Accessible name. Omitted, the icon is `aria-hidden` (right next to a visible label); set it for an icon that stands alone.
- `iconStyle` (string, `"filled"` / `"outlined"`) — **deprecated, ignored.** Kept so existing callers do not break.

Setting any prop re-renders immediately; you no longer need a separate `update()` call.

## Live Preview
:::component name="Icon"
{
  "name": "rocket",
  "size": "large",
  "color": "var(--primary-color)"
}
:::

## Semantic colour

Colour an icon by what it *means*, not by what it looks like, so the same glyph keeps its meaning across themes:

| Meaning | Token |
| --- | --- |
| Primary action / current state | `var(--primary-color)` |
| Secondary / neutral | `var(--secondary-color)` |
| Success, confirmation | `var(--success-color)` |
| Warning, attention | `var(--warning-color)` |
| Danger, destructive | `var(--danger-color)` |
| Muted / supporting | `var(--font-secondary-color)` |

## Demos

:::script label="Semantic colour" expected="the same icon tinted by meaning"
const meanings = [
  ['Primary', 'var(--primary-color)'],
  ['Secondary', 'var(--secondary-color)'],
  ['Success', 'var(--success-color)'],
  ['Warning', 'var(--warning-color)'],
  ['Danger', 'var(--danger-color)'],
  ['Muted', 'var(--font-secondary-color)'],
];

const host = document.createElement('div');
host.style.cssText = 'display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;padding:1rem;';

for (const [label, color] of meanings) {
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';
  box.appendChild(await slice.build('Icon', { name: 'bell', size: 'large', color }));
  const tag = document.createElement('span');
  tag.textContent = label;
  tag.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);';
  box.appendChild(tag);
  host.appendChild(box);
}
return host;
:::

:::script label="Colour and size in context" expected="the same glyph at two sizes, plus a brand mark"
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:2rem;align-items:center;padding:1rem;justify-content:center;';

row.appendChild(await slice.build('Icon', { name: 'star', size: 'large', color: 'var(--warning-color)' }));
row.appendChild(await slice.build('Icon', { name: 'star', size: 'medium', color: 'var(--font-secondary-color)' }));
row.appendChild(await slice.build('Icon', { name: 'github', size: 'large', color: 'var(--primary-color)' }));
return row;
:::

:::script label="Size Variants" expected="renders icons at small, medium and large sizes"
const sizes = ['small','medium','large'];
const icons = await Promise.all(sizes.map(s => slice.build('Icon', { name: 'cog', size: s, color: 'var(--primary-color)' })));

const host = document.createElement('div');
host.style.cssText = 'display:flex;gap:1.5rem;align-items:flex-end;padding:1rem;justify-content:center;';

sizes.forEach((s, i) => {
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';
  box.appendChild(icons[i]);
  const label = document.createElement('span'); label.textContent = s; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);';
  box.appendChild(label);
  host.appendChild(box);
});
return host;
:::

:::script label="Custom Color" expected="renders icon with custom hex color"
const icon = await slice.build('Icon', { name: 'heart', size: 'large', color: '#ef4444' });

const host = document.createElement('div');
host.style.cssText = 'display:flex;align-items:center;padding:1rem;justify-content:center;';
const box = document.createElement('div');
box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:1rem 2rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 95%,#ef4444);border:1px solid color-mix(in srgb,#ef4444 20%,transparent);';
box.appendChild(icon);
const label = document.createElement('span'); label.textContent = '#ef4444'; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);font-family:monospace;';
box.appendChild(label);
host.appendChild(box);
return host;
:::

## Icon Galleries

Browse icons by category.

:::script label="Brand & Social Icons" expected="20 brand icons in a responsive grid"
const brands = ['apple','discord','dribbble','dropbox','facebook','github','google','linkedin','stackoverflow','twitter','X','youtube','css','html','javascript','npm','react','vue','tailwind','flowbite'];
const container = document.createElement('div');
container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:10px;padding:4px;';

for (const name of brands) {
  const icon = await slice.build('Icon', { name, size:'24px', color:'var(--font-primary-color)' });
  const cell = document.createElement('div');
  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--primary-color));border:1px solid color-mix(in srgb,var(--primary-color)10%,transparent);';
  cell.appendChild(icon);
  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.5em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';
  cell.appendChild(label);
  container.appendChild(cell);
}
return container;
:::

:::script label="UI & Navigation Icons" expected="common navigation and interface icons in a grid"
const uis = ['search','home','bars','grid','list','close','plus','minus','filter','upload','download','zoom-in','zoom-out','shuffle','sort','refresh','undo','redo','pen','edit','trash-bin','bookmark','flag','star','heart','clock','cog','map-pin','lock','lock-open','bell','eye','palette'];
const container = document.createElement('div');
container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';

for (const name of uis) {
  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });
  const cell = document.createElement('div');
  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--secondary-color));border:1px solid color-mix(in srgb,var(--secondary-color)10%,transparent);';
  cell.appendChild(icon);
  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';
  cell.appendChild(label);
  container.appendChild(cell);
}
return container;
:::

:::script label="Media, Files & Dev Icons" expected="media playback, file management and development icons"
const items = ['play','pause','circle-pause','forward-step','backward-step','camera-photo','video-camera','microphone','headphones','volume-down','volume-up','clapperboard-play','file','file-code','file-pdf','file-image','file-zip','folder','folder-open','cloud-arrow-up','database','terminal','code','code-branch','code-fork','code-merge','bug','atom'];
const container = document.createElement('div');
container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';

for (const name of items) {
  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });
  const cell = document.createElement('div');
  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--tertiary-background-color));border:1px solid color-mix(in srgb,var(--primary-color)8%,transparent);';
  cell.appendChild(icon);
  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';
  cell.appendChild(label);
  container.appendChild(cell);
}
return container;
:::

:::script label="Expressions & Objects" expected="faces, commerce, weather and miscellaneous icons"
const misc = ['face-grin','face-laugh','face-explode','face-grin-stars','fire','lightbulb','rocket','gift-box','truck','cart','credit-card','cash','receipt','store','tag','ticket','wallet','moon','sun','globe','paper-plane','envelope','message-dots','phone','building','landmark','briefcase','scale-balanced','brain','wand-magic-sparkles'];
const container = document.createElement('div');
container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';

for (const name of misc) {
  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });
  const cell = document.createElement('div');
  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--warning-color));border:1px solid color-mix(in srgb,var(--warning-color)10%,transparent);';
  cell.appendChild(icon);
  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';
  cell.appendChild(label);
  container.appendChild(cell);
}
return container;
:::

## Icon Reference

<!-- icon-table:start -->

`Icon` exposes **291 names**. Every one is listed below, searchable, with its glyph
   drawn next to it. Click a cell to copy its name.

   Hovering a cell names its **source**: which Lucide icon backs the name. Most need no
   explanation, which is why it is a tooltip rather than a column. A name that says
   `legacy mark` is a brand, language or Slice mark Lucide does not ship, so it keeps its
   original artwork - and its original, non-24x24 viewBox.

   Generated from `icons.generated.js` by `scripts/generate-icon-table.mjs`. Edit the generator,
   not this block.

:::script label="Every icon, searchable" expected="291 cells; type to filter, or narrow by source"
const NAMES = ["address-book","adjustments-horizontal","adjustments-vertical","align-center","angle-down","angle-left","angle-right","angle-up","annotation","apple","archive","archive-arrow-down","arrow-down","arrow-down-to-bracket","arrow-left","arrow-left-to-bracket","arrow-right","arrow-right-alt","arrow-right-to-bracket","arrow-sort-letters","arrow-up","arrow-up-down","arrow-up-from-bracket","arrow-up-right-down-left","arrow-up-right-from-square","arrows-repeat","arrows-repeat-count","atom","backward-step","badge-check","bars","bars-from-left","bell","bell-active","bell-active-alt","bell-ring","blender-phone","book","book-open","bookmark","brain","briefcase","bug","building","bullhorn","calendar-edit","calendar-month","calendar-plus","calendar-week","camera-photo","caption","caret-down","caret-left","caret-right","caret-sort","caret-up","cart","cart-plus","cart-plus-alt","cash","chart","chart-line-down","chart-line-up","chart-mixed","chart-mixed-dollar","chart-pie","check","check-circle","check-plus-circle","chevron-double-down","chevron-double-left","chevron-double-right","chevron-double-up","chevron-down","chevron-left","chevron-right","chevron-sort","chevron-up","circle-pause","circle-plus","clapperboard-play","clipboard","clipboard-check","clipboard-list","clock","close","close-circle","cloud-arrow-up","code","code-branch","code-fork","code-merge","code-pull-request","cog","column","command","compress","computer-speaker","credit-card","css","database","desktop-pc","discord","dna","dollar","dots-horizontal","dots-vertical","download","draw-square","dribbble","dropbox","edit","envelope","envelope-open","euro","exclamation-circle","expand","eye","eye-slash","face-explode","face-grin","face-grin-stars","face-laugh","facebook","file","file-chart-bar","file-check","file-circle-plus","file-clone","file-code","file-copy","file-copy-alt","file-csv","file-export","file-image","file-import","file-invoice","file-lines","file-music","file-paste","file-pdf","file-pen","file-ppt","file-search","file-shield","file-video","file-word","file-zip","filter","fingerprint","fire","flag","flowbite","folder","folder-arrow-right","folder-duplicate","folder-open","folder-plus","forward","forward-step","gift-box","github","globe","google","grid","grid-plus","headphones","heart","home","hourglass","html","image","inbox","inbox-full","indent","info-circle","javascript","keyboard","label","landmark","layers","letter-bold","letter-italic","letter-underline","life-saver","lightbulb","link","linkedin","list","list-music","lock","lock-open","lock-time","mail-box","map-pin","map-pin-alt","message-caption","message-dots","messages","microphone","minimize","minus","mobile-phone","moon","newspaper","npm","ordered-list","outdent","palette","paper-clip","paper-plane","paragraph","pause","pen","pen-nib","phone","play","plus","printer","profile-card","question-circle","quote","react","receipt","rectangle-list","redo","refresh","reply","reply-all","restore-window","rocket","ruler-combined","sale-percent","scale-balanced","search","share-all","share-nodes","shield","shield-check","shopping-bag","shuffle","singleSlice","sliceJs","sliceLogo","slicePizza","sort","sort-horizontal","stackoverflow","star","star-half","star-half-stroke","store","sun","swatchbook","table-column","table-row","tablet","tag","tailwind","terminal","text-size","text-slash","thumbs-down","thumbs-up","ticket","trash-bin","truck","twitter","undo","upload","user","user-add","user-circle","user-edit","user-headset","user-remove","user-settings","users","users-group","video-camera","volume-down","volume-up","vue","wallet","wand-magic-sparkles","window","window-restore","X","youtube","zoom-in","zoom-out"];
const SOURCE = {"address-book":"contact","adjustments-horizontal":"sliders-horizontal","adjustments-vertical":"sliders-vertical","align-center":"align-center-horizontal","angle-down":"chevron-down","angle-left":"chevron-left","angle-right":"chevron-right","angle-up":"chevron-up","annotation":"message-square-text","archive-arrow-down":"archive-restore","arrow-down-to-bracket":"corner-down-right","arrow-left-to-bracket":"corner-left-down","arrow-right-alt":"move-right","arrow-right-to-bracket":"corner-right-down","arrow-sort-letters":"arrow-down-a-z","arrow-up-from-bracket":"corner-left-up","arrow-up-right-down-left":"shuffle","arrow-up-right-from-square":"corner-up-right","arrows-repeat":"refresh-cw","arrows-repeat-count":"repeat-1","backward-step":"skip-back","bars":"menu","bars-from-left":"panel-left","bell-active":"bell-ring","bell-active-alt":"bell","blender-phone":"phone-call","bullhorn":"megaphone","calendar-edit":"calendar-cog","calendar-month":"calendar","calendar-week":"calendar-days","camera-photo":"camera","caption":"captions","caret-down":"chevron-down","caret-left":"chevron-left","caret-right":"chevron-right","caret-sort":"chevrons-up-down","caret-up":"chevron-up","cart":"shopping-cart","cart-plus":"shopping-cart","cart-plus-alt":"shopping-bag","cash":"banknote","chart":"chart-column","chart-line-down":"trending-down","chart-line-up":"trending-up","chart-mixed":"chart-no-axes-column","chart-mixed-dollar":"badge-dollar-sign","check-circle":"circle-check","check-plus-circle":"circle-check-big","chevron-double-down":"chevrons-down","chevron-double-left":"chevrons-left","chevron-double-right":"chevrons-right","chevron-double-up":"chevrons-up","chevron-sort":"chevrons-up-down","clapperboard-play":"clapperboard","close":"x","close-circle":"circle-x","cloud-arrow-up":"cloud-upload","code-branch":"git-branch","code-fork":"git-fork","code-merge":"git-merge","code-pull-request":"git-pull-request","column":"columns-3","compress":"shrink","computer-speaker":"volume-2","css":"legacy mark","desktop-pc":"monitor","discord":"legacy mark","dollar":"dollar-sign","dots-horizontal":"ellipsis","dots-vertical":"ellipsis-vertical","draw-square":"square","dribbble":"legacy mark","dropbox":"legacy mark","edit":"pencil","envelope":"mail","envelope-open":"mail-open","exclamation-circle":"circle-alert","eye-slash":"eye-off","face-explode":"face-grinning","face-grin":"face-grinning","face-grin-stars":"face-slightly-smiling","face-laugh":"face-slightly-smiling-plus","facebook":"legacy mark","file-chart-bar":"file-chart-column","file-circle-plus":"file-plus","file-clone":"copy","file-copy":"copy","file-copy-alt":"copy-check","file-csv":"file-spreadsheet","file-export":"file-output","file-import":"file-input","file-invoice":"receipt","file-lines":"file-text","file-paste":"clipboard","file-pdf":"file-text","file-ppt":"file-chart-column","file-shield":"shield","file-video":"video","file-word":"file-type","file-zip":"file-archive","filter":"list-filter","fingerprint":"scan-face","fire":"flame","flowbite":"legacy mark","folder-arrow-right":"folder-symlink","folder-duplicate":"folder-plus","forward-step":"skip-forward","gift-box":"gift","github":"legacy mark","google":"legacy mark","grid":"layout-grid","grid-plus":"panel-top","home":"house","html":"legacy mark","inbox-full":"inbox","indent":"list-indent-increase","info-circle":"info","javascript":"legacy mark","label":"tag","letter-bold":"bold","letter-italic":"italic","letter-underline":"underline","life-saver":"life-buoy","linkedin":"legacy mark","lock-time":"lock-keyhole","mail-box":"mailbox","map-pin-alt":"map-pin","message-caption":"message-square-text","message-dots":"message-circle-more","messages":"messages-square","microphone":"mic","mobile-phone":"smartphone","npm":"legacy mark","ordered-list":"list-ordered","outdent":"list-indent-decrease","paper-clip":"paperclip","paper-plane":"send","paragraph":"pilcrow","pen-nib":"pen-tool","profile-card":"id-card","question-circle":"circle-question-mark","react":"legacy mark","rectangle-list":"list","refresh":"refresh-cw","restore-window":"rotate-ccw","ruler-combined":"ruler","sale-percent":"badge-percent","scale-balanced":"scale","share-all":"share-2","share-nodes":"share-2","singleSlice":"legacy mark","sliceJs":"legacy mark","sliceLogo":"legacy mark","slicePizza":"legacy mark","sort":"arrow-up-down","sort-horizontal":"arrow-down-up","stackoverflow":"legacy mark","star-half-stroke":"star-half","swatchbook":"palette","table-column":"table-2","table-row":"rows-3","tailwind":"legacy mark","text-size":"type","text-slash":"strikethrough","trash-bin":"trash","twitter":"legacy mark","user-add":"user-plus","user-circle":"circle-user","user-edit":"user-round-pen","user-headset":"headphones","user-remove":"user-minus","user-settings":"user-cog","users-group":"users","video-camera":"video","volume-down":"volume-1","volume-up":"volume-2","vue":"legacy mark","wand-magic-sparkles":"wand-sparkles","window":"app-window","window-restore":"copy","X":"legacy mark","youtube":"legacy mark"};

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
search.placeholder = 'Filter 291 icons...';
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
:::

