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
`Icon` renders a symbol from the built-in **slc** icon font. Every icon is available in **filled** (`iconStyle: "filled"`) and/or **outlined** (`iconStyle: "outlined"`) style. Use the `name` prop with the exact names listed below.

## API

- `name` (string, default `"youtube"`) — Icon symbol name (see full list below).
- `iconStyle` (string, default `"filled"`) — `"filled"` or `"outlined"`.
- `size` (string, default `"small"`) — `"small"` (16px), `"medium"` (20px), `"large"` (24px), or any CSS size.
- `color` (string, default `"black"`) — Any CSS color value.

## Basic Usage
```javascript title="Build icon"
const icon = await slice.build('Icon', {
  name: 'home',
  size: 'large',
  color: 'var(--primary-color)'
});
this.appendChild(icon);
```

## Demos

:::script label="Filled vs Outlined" expected="renders two icons with different styles"
const filled = await slice.build('Icon', { name: 'star', iconStyle: 'filled', size: 'large', color: 'var(--warning-color)' });
const outlined = await slice.build('Icon', { name: 'star', iconStyle: 'outlined', size: 'large', color: 'var(--font-secondary-color)' });

const host = document.createElement('div');
host.style.cssText = 'display:flex;gap:2rem;align-items:center;padding:1rem;justify-content:center;';

const g1 = document.createElement('div');
g1.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:1rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--warning-color));border:1px solid color-mix(in srgb,var(--warning-color)15%,transparent);';
g1.appendChild(filled);
const l1 = document.createElement('span'); l1.textContent = 'filled'; l1.style.cssText = 'font-size:.7em;color:var(--font-secondary-color);';
g1.appendChild(l1);

const g2 = document.createElement('div');
g2.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:1rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--medium-color));border:1px solid color-mix(in srgb,var(--medium-color)15%,transparent);';
g2.appendChild(outlined);
const l2 = document.createElement('span'); l2.textContent = 'outlined'; l2.style.cssText = 'font-size:.7em;color:var(--font-secondary-color);';
g2.appendChild(l2);

host.appendChild(g1); host.appendChild(g2);
return host;
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

:::script label="Brand & Social Icons" expected="32 brand icons in a responsive grid"
const brands = ['apple','discord','dribbble','dropbox','facebook','github','google','linkedin','stackoverflow','twitter','X','youtube','css','html','javascript','npm','react','vue','tailwind','flowbite'];
const container = document.createElement('div');
container.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:10px;padding:4px;';

for (const name of brands) {
  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'24px', color:'var(--font-primary-color)' });
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
  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });
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
  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });
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
  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });
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

The slc font contains **291 unique symbols**. Icons with a checkmark are available in that style.

### UI & Navigation
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `angle-down` | | ✓ |
| `angle-left` | | ✓ |
| `angle-right` | | ✓ |
| `angle-up` | | ✓ |
| `arrow-down` | | ✓ |
| `arrow-down-to-bracket` | | ✓ |
| `arrow-left` | | ✓ |
| `arrow-left-to-bracket` | | ✓ |
| `arrow-right` | | ✓ |
| `arrow-right-alt` | ✓ | ✓ |
| `arrow-right-to-bracket` | | ✓ |
| `arrow-sort-letters` | | ✓ |
| `arrow-up` | | ✓ |
| `arrow-up-down` | | ✓ |
| `arrow-up-from-bracket` | | ✓ |
| `arrow-up-right-down-left` | | ✓ |
| `arrow-up-right-from-square` | ✓ | ✓ |
| `arrows-repeat` | | ✓ |
| `arrows-repeat-count` | | ✓ |
| `bars` | | ✓ |
| `bars-from-left` | | ✓ |
| `caret-down` | ✓ | ✓ |
| `caret-left` | ✓ | ✓ |
| `caret-right` | ✓ | ✓ |
| `caret-sort` | ✓ | ✓ |
| `caret-up` | ✓ | ✓ |
| `chevron-double-down` | | ✓ |
| `chevron-double-left` | | ✓ |
| `chevron-double-right` | | ✓ |
| `chevron-double-up` | | ✓ |
| `chevron-down` | | ✓ |
| `chevron-left` | | ✓ |
| `chevron-right` | | ✓ |
| `chevron-sort` | | ✓ |
| `chevron-up` | | ✓ |
| `close` | | ✓ |
| `close-circle` | ✓ | ✓ |
| `compress` | | ✓ |
| `draw-square` | ✓ | ✓ |
| `expand` | | ✓ |
| `grid` | ✓ | ✓ |
| `grid-plus` | ✓ | ✓ |
| `home` | ✓ | ✓ |
| `list` | | ✓ |
| `minimize` | | ✓ |
| `minus` | | ✓ |
| `ordered-list` | | ✓ |
| `rectangle-list` | ✓ | ✓ |
| `plus` | | ✓ |
| `search` | ✓ | ✓ |
| `shuffle` | | ✓ |
| `sort` | | ✓ |
| `sort-horizontal` | | ✓ |
| `upload` | ✓ | ✓ |
| `zoom-in` | ✓ | ✓ |
| `zoom-out` | ✓ | ✓ |

### Arrows & Directional
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `arrow-down` | | ✓ |
| `arrow-left` | | ✓ |
| `arrow-right` | | ✓ |
| `arrow-up` | | ✓ |
| `expand` | | ✓ |
| `forward` | ✓ | ✓ |
| `forward-step` | ✓ | ✓ |
| `backward-step` | ✓ | ✓ |
| `reply` | ✓ | ✓ |
| `reply-all` | ✓ | ✓ |
| `share-all` | ✓ | ✓ |
| `share-nodes` | ✓ | ✓ |
| `redo` | | ✓ |
| `undo` | | ✓ |
| `refresh` | | ✓ |
| `download` | ✓ | ✓ |
| `upload` | ✓ | ✓ |

### Communication
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `bell` | ✓ | ✓ |
| `bell-active` | ✓ | ✓ |
| `bell-active-alt` | ✓ | ✓ |
| `bell-ring` | ✓ | ✓ |
| `bullhorn` | ✓ | ✓ |
| `envelope` | ✓ | ✓ |
| `envelope-open` | ✓ | ✓ |
| `globe` | ✓ | ✓ |
| `message-caption` | ✓ | ✓ |
| `message-dots` | ✓ | ✓ |
| `messages` | ✓ | ✓ |
| `phone` | ✓ | ✓ |
| `blender-phone` | ✓ | ✓ |
| `paper-plane` | ✓ | ✓ |

### Media & Audio
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `play` | ✓ | ✓ |
| `pause` | ✓ | ✓ |
| `circle-pause` | ✓ | ✓ |
| `circle-plus` | ✓ | ✓ |
| `backward-step` | ✓ | ✓ |
| `forward-step` | ✓ | ✓ |
| `forward` | ✓ | ✓ |
| `camera-photo` | ✓ | ✓ |
| `video-camera` | ✓ | ✓ |
| `microphone` | ✓ | ✓ |
| `headphones` | ✓ | ✓ |
| `list-music` | ✓ | ✓ |
| `clapperboard-play` | ✓ | ✓ |
| `computer-speaker` | ✓ | ✓ |
| `volume-down` | ✓ | ✓ |
| `volume-up` | ✓ | ✓ |

### Files & Storage
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `file` | ✓ | ✓ |
| `file-chart-bar` | ✓ | ✓ |
| `file-check` | ✓ | ✓ |
| `file-circle-plus` | ✓ | ✓ |
| `file-clone` | ✓ | ✓ |
| `file-code` | ✓ | ✓ |
| `file-copy` | ✓ | ✓ |
| `file-copy-alt` | ✓ | ✓ |
| `file-csv` | ✓ | ✓ |
| `file-export` | ✓ | ✓ |
| `file-image` | ✓ | ✓ |
| `image` | ✓ | ✓ |
| `file-import` | ✓ | ✓ |
| `file-invoice` | ✓ | ✓ |
| `file-lines` | ✓ | ✓ |
| `file-music` | ✓ | ✓ |
| `file-paste` | ✓ | ✓ |
| `file-pdf` | ✓ | ✓ |
| `file-pen` | ✓ | ✓ |
| `file-ppt` | ✓ | ✓ |
| `file-search` | ✓ | ✓ |
| `file-shield` | ✓ | ✓ |
| `file-video` | ✓ | ✓ |
| `file-word` | ✓ | ✓ |
| `file-zip` | ✓ | ✓ |
| `folder` | ✓ | ✓ |
| `folder-arrow-right` | ✓ | ✓ |
| `folder-duplicate` | ✓ | ✓ |
| `folder-open` | ✓ | ✓ |
| `folder-plus` | ✓ | ✓ |
| `clipboard` | ✓ | ✓ |
| `clipboard-check` | ✓ | ✓ |
| `clipboard-list` | ✓ | ✓ |
| `cloud-arrow-up` | ✓ | ✓ |
| `archive` | ✓ | ✓ |
| `archive-arrow-down` | ✓ | ✓ |
| `database` | ✓ | ✓ |
| `inbox` | ✓ | ✓ |
| `inbox-full` | ✓ | ✓ |
| `download` | ✓ | ✓ |

### Users & People
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `user` | ✓ | ✓ |
| `users` | ✓ | ✓ |
| `users-group` | ✓ | ✓ |
| `user-add` | ✓ | ✓ |
| `user-circle` | ✓ | ✓ |
| `user-edit` | ✓ | ✓ |
| `user-headset` | ✓ | ✓ |
| `user-remove` | ✓ | ✓ |
| `user-settings` | ✓ | ✓ |
| `profile-card` | ✓ | ✓ |

### Commerce & Finance
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `cart` | ✓ | ✓ |
| `cart-plus` | ✓ | ✓ |
| `cart-plus-alt` | ✓ | ✓ |
| `credit-card` | ✓ | ✓ |
| `cash` | ✓ | ✓ |
| `dollar` | | ✓ |
| `euro` | | ✓ |
| `receipt` | ✓ | ✓ |
| `sale-percent` | ✓ | ✓ |
| `shopping-bag` | ✓ | ✓ |
| `store` | ✓ | ✓ |
| `gift-box` | ✓ | ✓ |
| `truck` | ✓ | ✓ |
| `wallet` | ✓ | ✓ |

### Status & Feedback
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `badge-check` | ✓ | ✓ |
| `check` | | ✓ |
| `check-circle` | ✓ | ✓ |
| `check-plus-circle` | ✓ | ✓ |
| `exclamation-circle` | ✓ | ✓ |
| `info-circle` | ✓ | ✓ |
| `question-circle` | ✓ | ✓ |
| `flag` | ✓ | ✓ |
| `fire` | ✓ | ✓ |
| `shield` | ✓ | ✓ |
| `shield-check` | ✓ | ✓ |
| `thumbs-up` | ✓ | ✓ |
| `thumbs-down` | ✓ | ✓ |

### Objects & Essentials
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `book` | ✓ | ✓ |
| `book-open` | ✓ | ✓ |
| `bookmark` | ✓ | ✓ |
| `clock` | ✓ | ✓ |
| `cog` | ✓ | ✓ |
| `heart` | ✓ | ✓ |
| `hourglass` | ✓ | ✓ |
| `keyboard` | ✓ | ✓ |
| `desktop-pc` | ✓ | ✓ |
| `label` | ✓ | ✓ |
| `lightbulb` | ✓ | ✓ |
| `lock` | ✓ | ✓ |
| `lock-open` | ✓ | ✓ |
| `lock-time` | ✓ | ✓ |
| `map-pin` | ✓ | ✓ |
| `map-pin-alt` | ✓ | ✓ |
| `newspaper` | ✓ | ✓ |
| `paper-clip` | | ✓ |
| `rocket` | ✓ | ✓ |
| `star` | ✓ | ✓ |
| `star-half` | ✓ | ✓ |
| `star-half-stroke` | ✓ | ✓ |
| `tag` | ✓ | ✓ |
| `ticket` | ✓ | ✓ |
| `trash-bin` | ✓ | ✓ |
| `window` | ✓ | ✓ |
| `window-restore` | ✓ | ✓ |

### Design & Layout
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `palette` | ✓ | ✓ |
| `pen` | ✓ | ✓ |
| `pen-nib` | ✓ | ✓ |
| `edit` | ✓ | ✓ |
| `swatchbook` | ✓ | ✓ |
| `column` | ✓ | ✓ |
| `layers` | ✓ | ✓ |
| `grid` | ✓ | ✓ |
| `table-column` | ✓ | ✓ |
| `table-row` | ✓ | ✓ |
| `indent` | ✓ | ✓ |
| `outdent` | ✓ | ✓ |
| `paragraph` | ✓ | ✓ |
| `quote` | ✓ | ✓ |
| `align-center` | | ✓ |
| `letter-bold` | | ✓ |
| `letter-italic` | | ✓ |
| `letter-underline` | | ✓ |
| `text-size` | | ✓ |
| `text-slash` | | ✓ |
| `ruler-combined` | | ✓ |
| `dots-horizontal` | | ✓ |
| `dots-vertical` | | ✓ |
| `caption` | ✓ | ✓ |
| `filter` | ✓ | ✓ |

### Development
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `code` | | ✓ |
| `code-branch` | ✓ | ✓ |
| `code-fork` | ✓ | ✓ |
| `code-merge` | ✓ | ✓ |
| `code-pull-request` | ✓ | ✓ |
| `terminal` | ✓ | ✓ |
| `command` | | ✓ |
| `atom` | | ✓ |
| `dna` | | ✓ |
| `fingerprint` | | ✓ |
| `bug` | ✓ | ✓ |
| `database` | ✓ | ✓ |
| `css` | ✓ | |
| `html` | ✓ | |
| `javascript` | ✓ | |
| `npm` | ✓ | |
| `react` | ✓ | |
| `vue` | ✓ | |
| `tailwind` | ✓ | |
| `flowbite` | ✓ | |

### Brands & Social
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `apple` | ✓ | |
| `discord` | ✓ | |
| `dribbble` | ✓ | |
| `dropbox` | ✓ | |
| `facebook` | ✓ | |
| `github` | ✓ | |
| `google` | ✓ | |
| `linkedin` | ✓ | |
| `stackoverflow` | ✓ | |
| `twitter` | ✓ | |
| `X` | ✓ | |
| `youtube` | ✓ | |

### Slice Brand
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `singleSlice` | ✓ | |
| `sliceJs` | ✓ | |
| `sliceLogo` | ✓ | |
| `slicePizza` | ✓ | |

### Weather & Time
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `moon` | ✓ | ✓ |
| `sun` | ✓ | ✓ |
| `clock` | ✓ | ✓ |
| `hourglass` | ✓ | ✓ |

### Miscellaneous
| Icon name | Filled | Outlined |
|-----------|--------|----------|
| `address-book` | ✓ | ✓ |
| `adjustments-horizontal` | ✓ | ✓ |
| `adjustments-vertical` | ✓ | ✓ |
| `annotation` | ✓ | ✓ |
| `brain` | ✓ | ✓ |
| `briefcase` | ✓ | ✓ |
| `building` | ✓ | ✓ |
| `calendar-edit` | ✓ | ✓ |
| `calendar-month` | ✓ | ✓ |
| `calendar-plus` | ✓ | ✓ |
| `calendar-week` | ✓ | ✓ |
| `chart` | | ✓ |
| `chart-line-down` | | ✓ |
| `chart-line-up` | | ✓ |
| `chart-mixed` | | ✓ |
| `chart-mixed-dollar` | ✓ | ✓ |
| `chart-pie` | ✓ | ✓ |
| `eye` | ✓ | ✓ |
| `eye-slash` | ✓ | ✓ |
| `face-explode` | ✓ | ✓ |
| `face-grin` | ✓ | ✓ |
| `face-grin-stars` | ✓ | ✓ |
| `face-laugh` | ✓ | ✓ |
| `landmark` | ✓ | ✓ |
| `life-saver` | ✓ | ✓ |
| `link` | | ✓ |
| `mail-box` | ✓ | ✓ |
| `mobile-phone` | ✓ | ✓ |
| `printer` | ✓ | ✓ |
| `restore-window` | | ✓ |
| `scale-balanced` | ✓ | ✓ |
| `tablet` | ✓ | ✓ |
| `wand-magic-sparkles` | ✓ | ✓ |

## Best Practices
:::tip
Use consistent `size` and `color` values within a feature to maintain visual alignment. Prefer theme tokens (`var(--primary-color)`, `var(--font-secondary-color)`) over hardcoded hex values when possible.
:::

:::tip
For Slice brand logos (`singleSlice`, `sliceJs`, `sliceLogo`) always use `filled` style — the outlined variants do not exist.
:::

## Pitfalls
:::warning
Icon names are case-sensitive and use kebab-case. For example, use `arrow-up-right-from-square`, not `arrowUpRightFromSquare`.
:::
