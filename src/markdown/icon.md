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

`Icon` exposes **291 names**. `Source` is the Lucide icon behind each name, or
`legacy mark` for the brand, language and Slice marks Lucide does not ship (those keep their
original artwork). The table is generated: see `scripts/generate-icon-table.mjs`.

| Icon name | Source |
|-----------|--------|
| `address-book` | `contact` |
| `adjustments-horizontal` | `sliders-horizontal` |
| `adjustments-vertical` | `sliders-vertical` |
| `align-center` | `align-center-horizontal` |
| `angle-down` | `chevron-down` |
| `angle-left` | `chevron-left` |
| `angle-right` | `chevron-right` |
| `angle-up` | `chevron-up` |
| `annotation` | `message-square-text` |
| `apple` | lucide |
| `archive` | lucide |
| `archive-arrow-down` | `archive-restore` |
| `arrow-down` | lucide |
| `arrow-down-to-bracket` | `corner-down-right` |
| `arrow-left` | lucide |
| `arrow-left-to-bracket` | `corner-left-down` |
| `arrow-right` | lucide |
| `arrow-right-alt` | `move-right` |
| `arrow-right-to-bracket` | `corner-right-down` |
| `arrow-sort-letters` | `arrow-down-a-z` |
| `arrow-up` | lucide |
| `arrow-up-down` | lucide |
| `arrow-up-from-bracket` | `corner-left-up` |
| `arrow-up-right-down-left` | `shuffle` |
| `arrow-up-right-from-square` | `corner-up-right` |
| `arrows-repeat` | `refresh-cw` |
| `arrows-repeat-count` | `repeat-1` |
| `atom` | lucide |
| `backward-step` | `skip-back` |
| `badge-check` | lucide |
| `bars` | `menu` |
| `bars-from-left` | `panel-left` |
| `bell` | lucide |
| `bell-active` | `bell-ring` |
| `bell-active-alt` | `bell` |
| `bell-ring` | lucide |
| `blender-phone` | `phone-call` |
| `book` | lucide |
| `book-open` | lucide |
| `bookmark` | lucide |
| `brain` | lucide |
| `briefcase` | lucide |
| `bug` | lucide |
| `building` | lucide |
| `bullhorn` | `megaphone` |
| `calendar-edit` | `calendar-cog` |
| `calendar-month` | `calendar` |
| `calendar-plus` | lucide |
| `calendar-week` | `calendar-days` |
| `camera-photo` | `camera` |
| `caption` | `captions` |
| `caret-down` | `chevron-down` |
| `caret-left` | `chevron-left` |
| `caret-right` | `chevron-right` |
| `caret-sort` | `chevrons-up-down` |
| `caret-up` | `chevron-up` |
| `cart` | `shopping-cart` |
| `cart-plus` | `shopping-cart` |
| `cart-plus-alt` | `shopping-bag` |
| `cash` | `banknote` |
| `chart` | `chart-column` |
| `chart-line-down` | `trending-down` |
| `chart-line-up` | `trending-up` |
| `chart-mixed` | `chart-no-axes-column` |
| `chart-mixed-dollar` | `badge-dollar-sign` |
| `chart-pie` | lucide |
| `check` | lucide |
| `check-circle` | `circle-check` |
| `check-plus-circle` | `circle-check-big` |
| `chevron-double-down` | `chevrons-down` |
| `chevron-double-left` | `chevrons-left` |
| `chevron-double-right` | `chevrons-right` |
| `chevron-double-up` | `chevrons-up` |
| `chevron-down` | lucide |
| `chevron-left` | lucide |
| `chevron-right` | lucide |
| `chevron-sort` | `chevrons-up-down` |
| `chevron-up` | lucide |
| `circle-pause` | lucide |
| `circle-plus` | lucide |
| `clapperboard-play` | `clapperboard` |
| `clipboard` | lucide |
| `clipboard-check` | lucide |
| `clipboard-list` | lucide |
| `clock` | lucide |
| `close` | `x` |
| `close-circle` | `circle-x` |
| `cloud-arrow-up` | `cloud-upload` |
| `code` | lucide |
| `code-branch` | `git-branch` |
| `code-fork` | `git-fork` |
| `code-merge` | `git-merge` |
| `code-pull-request` | `git-pull-request` |
| `cog` | lucide |
| `column` | `columns-3` |
| `command` | lucide |
| `compress` | `shrink` |
| `computer-speaker` | `volume-2` |
| `credit-card` | lucide |
| `css` | legacy mark |
| `database` | lucide |
| `desktop-pc` | `monitor` |
| `discord` | legacy mark |
| `dna` | lucide |
| `dollar` | `dollar-sign` |
| `dots-horizontal` | `ellipsis` |
| `dots-vertical` | `ellipsis-vertical` |
| `download` | lucide |
| `draw-square` | `square` |
| `dribbble` | legacy mark |
| `dropbox` | legacy mark |
| `edit` | `pencil` |
| `envelope` | `mail` |
| `envelope-open` | `mail-open` |
| `euro` | lucide |
| `exclamation-circle` | `circle-alert` |
| `expand` | lucide |
| `eye` | lucide |
| `eye-slash` | `eye-off` |
| `face-explode` | `face-grinning` |
| `face-grin` | `face-grinning` |
| `face-grin-stars` | `face-slightly-smiling` |
| `face-laugh` | `face-slightly-smiling-plus` |
| `facebook` | legacy mark |
| `file` | lucide |
| `file-chart-bar` | `file-chart-column` |
| `file-check` | lucide |
| `file-circle-plus` | `file-plus` |
| `file-clone` | `copy` |
| `file-code` | lucide |
| `file-copy` | `copy` |
| `file-copy-alt` | `copy-check` |
| `file-csv` | `file-spreadsheet` |
| `file-export` | `file-output` |
| `file-image` | lucide |
| `file-import` | `file-input` |
| `file-invoice` | `receipt` |
| `file-lines` | `file-text` |
| `file-music` | lucide |
| `file-paste` | `clipboard` |
| `file-pdf` | `file-text` |
| `file-pen` | lucide |
| `file-ppt` | `file-chart-column` |
| `file-search` | lucide |
| `file-shield` | `shield` |
| `file-video` | `video` |
| `file-word` | `file-type` |
| `file-zip` | `file-archive` |
| `filter` | `list-filter` |
| `fingerprint` | `scan-face` |
| `fire` | `flame` |
| `flag` | lucide |
| `flowbite` | legacy mark |
| `folder` | lucide |
| `folder-arrow-right` | `folder-symlink` |
| `folder-duplicate` | `folder-plus` |
| `folder-open` | lucide |
| `folder-plus` | lucide |
| `forward` | lucide |
| `forward-step` | `skip-forward` |
| `gift-box` | `gift` |
| `github` | legacy mark |
| `globe` | lucide |
| `google` | legacy mark |
| `grid` | `layout-grid` |
| `grid-plus` | `panel-top` |
| `headphones` | lucide |
| `heart` | lucide |
| `home` | `house` |
| `hourglass` | lucide |
| `html` | legacy mark |
| `image` | lucide |
| `inbox` | lucide |
| `inbox-full` | `inbox` |
| `indent` | `list-indent-increase` |
| `info-circle` | `info` |
| `javascript` | legacy mark |
| `keyboard` | lucide |
| `label` | `tag` |
| `landmark` | lucide |
| `layers` | lucide |
| `letter-bold` | `bold` |
| `letter-italic` | `italic` |
| `letter-underline` | `underline` |
| `life-saver` | `life-buoy` |
| `lightbulb` | lucide |
| `link` | lucide |
| `linkedin` | legacy mark |
| `list` | lucide |
| `list-music` | lucide |
| `lock` | lucide |
| `lock-open` | lucide |
| `lock-time` | `lock-keyhole` |
| `mail-box` | `mailbox` |
| `map-pin` | lucide |
| `map-pin-alt` | `map-pin` |
| `message-caption` | `message-square-text` |
| `message-dots` | `message-circle-more` |
| `messages` | `messages-square` |
| `microphone` | `mic` |
| `minimize` | lucide |
| `minus` | lucide |
| `mobile-phone` | `smartphone` |
| `moon` | lucide |
| `newspaper` | lucide |
| `npm` | legacy mark |
| `ordered-list` | `list-ordered` |
| `outdent` | `list-indent-decrease` |
| `palette` | lucide |
| `paper-clip` | `paperclip` |
| `paper-plane` | `send` |
| `paragraph` | `pilcrow` |
| `pause` | lucide |
| `pen` | lucide |
| `pen-nib` | `pen-tool` |
| `phone` | lucide |
| `play` | lucide |
| `plus` | lucide |
| `printer` | lucide |
| `profile-card` | `id-card` |
| `question-circle` | `circle-question-mark` |
| `quote` | lucide |
| `react` | legacy mark |
| `receipt` | lucide |
| `rectangle-list` | `list` |
| `redo` | lucide |
| `refresh` | `refresh-cw` |
| `reply` | lucide |
| `reply-all` | lucide |
| `restore-window` | `rotate-ccw` |
| `rocket` | lucide |
| `ruler-combined` | `ruler` |
| `sale-percent` | `badge-percent` |
| `scale-balanced` | `scale` |
| `search` | lucide |
| `share-all` | `share-2` |
| `share-nodes` | `share-2` |
| `shield` | lucide |
| `shield-check` | lucide |
| `shopping-bag` | lucide |
| `shuffle` | lucide |
| `singleSlice` | legacy mark |
| `sliceJs` | legacy mark |
| `sliceLogo` | legacy mark |
| `slicePizza` | legacy mark |
| `sort` | `arrow-up-down` |
| `sort-horizontal` | `arrow-down-up` |
| `stackoverflow` | legacy mark |
| `star` | lucide |
| `star-half` | lucide |
| `star-half-stroke` | `star-half` |
| `store` | lucide |
| `sun` | lucide |
| `swatchbook` | `palette` |
| `table-column` | `table-2` |
| `table-row` | `rows-3` |
| `tablet` | lucide |
| `tag` | lucide |
| `tailwind` | legacy mark |
| `terminal` | lucide |
| `text-size` | `type` |
| `text-slash` | `strikethrough` |
| `thumbs-down` | lucide |
| `thumbs-up` | lucide |
| `ticket` | lucide |
| `trash-bin` | `trash` |
| `truck` | lucide |
| `twitter` | legacy mark |
| `undo` | lucide |
| `upload` | lucide |
| `user` | lucide |
| `user-add` | `user-plus` |
| `user-circle` | `circle-user` |
| `user-edit` | `user-round-pen` |
| `user-headset` | `headphones` |
| `user-remove` | `user-minus` |
| `user-settings` | `user-cog` |
| `users` | lucide |
| `users-group` | `users` |
| `video-camera` | `video` |
| `volume-down` | `volume-1` |
| `volume-up` | `volume-2` |
| `vue` | legacy mark |
| `wallet` | lucide |
| `wand-magic-sparkles` | `wand-sparkles` |
| `window` | `app-window` |
| `window-restore` | `copy` |
| `X` | legacy mark |
| `youtube` | legacy mark |
| `zoom-in` | lucide |
| `zoom-out` | lucide |

<!-- icon-table:end -->
