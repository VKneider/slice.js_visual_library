export default class IconDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Semantic colour","expected":"the same icon tinted by meaning","kind":"script","content":"const meanings = [\n  ['Primary', 'var(--primary-color)'],\n  ['Secondary', 'var(--secondary-color)'],\n  ['Success', 'var(--success-color)'],\n  ['Warning', 'var(--warning-color)'],\n  ['Danger', 'var(--danger-color)'],\n  ['Muted', 'var(--font-secondary-color)'],\n];\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;padding:1rem;';\n\nfor (const [label, color] of meanings) {\n  const box = document.createElement('div');\n  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';\n  box.appendChild(await slice.build('Icon', { name: 'bell', size: 'large', color }));\n  const tag = document.createElement('span');\n  tag.textContent = label;\n  tag.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);';\n  box.appendChild(tag);\n  host.appendChild(box);\n}\nreturn host;"},{"label":"Colour and size in context","expected":"the same glyph at two sizes, plus a brand mark","kind":"script","content":"const row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:2rem;align-items:center;padding:1rem;justify-content:center;';\n\nrow.appendChild(await slice.build('Icon', { name: 'star', size: 'large', color: 'var(--warning-color)' }));\nrow.appendChild(await slice.build('Icon', { name: 'star', size: 'medium', color: 'var(--font-secondary-color)' }));\nrow.appendChild(await slice.build('Icon', { name: 'github', size: 'large', color: 'var(--primary-color)' }));\nreturn row;"},{"label":"Size Variants","expected":"renders icons at small, medium and large sizes","kind":"script","content":"const sizes = ['small','medium','large'];\nconst icons = await Promise.all(sizes.map(s => slice.build('Icon', { name: 'cog', size: s, color: 'var(--primary-color)' })));\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;gap:1.5rem;align-items:flex-end;padding:1rem;justify-content:center;';\n\nsizes.forEach((s, i) => {\n  const box = document.createElement('div');\n  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';\n  box.appendChild(icons[i]);\n  const label = document.createElement('span'); label.textContent = s; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);';\n  box.appendChild(label);\n  host.appendChild(box);\n});\nreturn host;"},{"label":"Custom Color","expected":"renders icon with custom hex color","kind":"script","content":"const icon = await slice.build('Icon', { name: 'heart', size: 'large', color: '#ef4444' });\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;align-items:center;padding:1rem;justify-content:center;';\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:1rem 2rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 95%,#ef4444);border:1px solid color-mix(in srgb,#ef4444 20%,transparent);';\nbox.appendChild(icon);\nconst label = document.createElement('span'); label.textContent = '#ef4444'; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);font-family:monospace;';\nbox.appendChild(label);\nhost.appendChild(box);\nreturn host;"},{"label":"Brand & Social Icons","expected":"20 brand icons in a responsive grid","kind":"script","content":"const brands = ['apple','discord','dribbble','dropbox','facebook','github','google','linkedin','stackoverflow','twitter','X','youtube','css','html','javascript','npm','react','vue','tailwind','flowbite'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:10px;padding:4px;';\n\nfor (const name of brands) {\n  const icon = await slice.build('Icon', { name, size:'24px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--primary-color));border:1px solid color-mix(in srgb,var(--primary-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.5em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;"},{"label":"UI & Navigation Icons","expected":"common navigation and interface icons in a grid","kind":"script","content":"const uis = ['search','home','bars','grid','list','close','plus','minus','filter','upload','download','zoom-in','zoom-out','shuffle','sort','refresh','undo','redo','pen','edit','trash-bin','bookmark','flag','star','heart','clock','cog','map-pin','lock','lock-open','bell','eye','palette'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of uis) {\n  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--secondary-color));border:1px solid color-mix(in srgb,var(--secondary-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;"},{"label":"Media, Files & Dev Icons","expected":"media playback, file management and development icons","kind":"script","content":"const items = ['play','pause','circle-pause','forward-step','backward-step','camera-photo','video-camera','microphone','headphones','volume-down','volume-up','clapperboard-play','file','file-code','file-pdf','file-image','file-zip','folder','folder-open','cloud-arrow-up','database','terminal','code','code-branch','code-fork','code-merge','bug','atom'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of items) {\n  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--tertiary-background-color));border:1px solid color-mix(in srgb,var(--primary-color)8%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;"},{"label":"Expressions & Objects","expected":"faces, commerce, weather and miscellaneous icons","kind":"script","content":"const misc = ['face-grin','face-laugh','face-explode','face-grin-stars','fire','lightbulb','rocket','gift-box','truck','cart','credit-card','cash','receipt','store','tag','ticket','wallet','moon','sun','globe','paper-plane','envelope','message-dots','phone','building','landmark','briefcase','scale-balanced','brain','wand-magic-sparkles'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of misc) {\n  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--warning-color));border:1px solid color-mix(in srgb,var(--warning-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;"}];
  }

  async init() {
    this.markdownPath = "icon.md";
    this.markdownContent = "---\ntitle: Icon\nroute: /docs/display/icon\nnavLabel: Icon\nsection: Display\ngroup: Basic\norder: 20\ndescription: Complete icon reference with all 291 symbols, usage patterns, and style variants.\ncomponent: IconDocumentation\ngenerate: true\ntags: [icon, display, reference]\n---\n\n# Icon\n\n## Overview\n`Icon` renders an inline **SVG** glyph: no icon font, no webfont download, no global stylesheet. Use the `name` prop with the exact names listed below.\n\n:::warning Breaking change (Lucide migration)\nIcon used to render a glyph from the **slc** icon font, where every symbol came in a `filled` and an `outlined` variant. It now renders **Lucide**, which is stroke-only.\n\n- **All 291 names still work.** Names Lucide spells differently (`trash-bin`, `angle-down`, `check-circle`, ...) are aliased to their Lucide equivalent; the brand, language and Slice marks Lucide does not ship keep their original artwork. Run `node scripts/icon-map-audit.mjs` to see the full mapping, or read `ALIASES` in `icons.generated.js`.\n- **`iconStyle` is a deprecated no-op.** It is still accepted (and warns once) so existing callers keep working, but it no longer selects anything: drop it.\n- **The `slc-*` glyph classes are gone.** If your CSS targeted `slice-icon .slc-filrocket`, delete that rule and style the host or the `<svg>` instead. The old stylesheet styled `[class^=\"slc-\"]` at global scope, so those rules were leaking anyway.\n- **`color` now defaults to `currentColor`**, so an icon inherits its surroundings and follows the theme. Pass an explicit color to override.\n- **Size and color land on the host**, so `getComputedStyle(icon).fontSize` is meaningful and the glyph scales with the surrounding text.\n- **A few names now draw the same glyph** (`angle-down` and `caret-down` are both the chevron) because Lucide merged the old duplicates.\n:::\n\n## API\n\n- `name` (string, default `\"youtube\"`) — Icon symbol name (see full list below). An unknown name warns and renders nothing.\n- `size` (string, default `\"small\"`) — `\"small\"` (16px), `\"medium\"` (20px), `\"large\"` (24px), or any CSS size.\n- `color` (string, default `\"currentColor\"`) — Any CSS color value.\n- `label` (string, default `\"\"`) — Accessible name. Omitted, the icon is `aria-hidden` (right next to a visible label); set it for an icon that stands alone.\n- `iconStyle` (string, `\"filled\"` / `\"outlined\"`) — **deprecated, ignored.** Kept so existing callers do not break.\n\nSetting any prop re-renders immediately; you no longer need a separate `update()` call.\n\n## Live Preview\n:::component name=\"Icon\"\n{\n  \"name\": \"rocket\",\n  \"size\": \"large\",\n  \"color\": \"var(--primary-color)\"\n}\n:::\n\n## Semantic colour\n\nColour an icon by what it *means*, not by what it looks like, so the same glyph keeps its meaning across themes:\n\n| Meaning | Token |\n| --- | --- |\n| Primary action / current state | `var(--primary-color)` |\n| Secondary / neutral | `var(--secondary-color)` |\n| Success, confirmation | `var(--success-color)` |\n| Warning, attention | `var(--warning-color)` |\n| Danger, destructive | `var(--danger-color)` |\n| Muted / supporting | `var(--font-secondary-color)` |\n\n## Demos\n\n:::script label=\"Semantic colour\" expected=\"the same icon tinted by meaning\"\nconst meanings = [\n  ['Primary', 'var(--primary-color)'],\n  ['Secondary', 'var(--secondary-color)'],\n  ['Success', 'var(--success-color)'],\n  ['Warning', 'var(--warning-color)'],\n  ['Danger', 'var(--danger-color)'],\n  ['Muted', 'var(--font-secondary-color)'],\n];\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;padding:1rem;';\n\nfor (const [label, color] of meanings) {\n  const box = document.createElement('div');\n  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';\n  box.appendChild(await slice.build('Icon', { name: 'bell', size: 'large', color }));\n  const tag = document.createElement('span');\n  tag.textContent = label;\n  tag.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);';\n  box.appendChild(tag);\n  host.appendChild(box);\n}\nreturn host;\n:::\n\n:::script label=\"Colour and size in context\" expected=\"the same glyph at two sizes, plus a brand mark\"\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:2rem;align-items:center;padding:1rem;justify-content:center;';\n\nrow.appendChild(await slice.build('Icon', { name: 'star', size: 'large', color: 'var(--warning-color)' }));\nrow.appendChild(await slice.build('Icon', { name: 'star', size: 'medium', color: 'var(--font-secondary-color)' }));\nrow.appendChild(await slice.build('Icon', { name: 'github', size: 'large', color: 'var(--primary-color)' }));\nreturn row;\n:::\n\n:::script label=\"Size Variants\" expected=\"renders icons at small, medium and large sizes\"\nconst sizes = ['small','medium','large'];\nconst icons = await Promise.all(sizes.map(s => slice.build('Icon', { name: 'cog', size: s, color: 'var(--primary-color)' })));\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;gap:1.5rem;align-items:flex-end;padding:1rem;justify-content:center;';\n\nsizes.forEach((s, i) => {\n  const box = document.createElement('div');\n  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';\n  box.appendChild(icons[i]);\n  const label = document.createElement('span'); label.textContent = s; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);';\n  box.appendChild(label);\n  host.appendChild(box);\n});\nreturn host;\n:::\n\n:::script label=\"Custom Color\" expected=\"renders icon with custom hex color\"\nconst icon = await slice.build('Icon', { name: 'heart', size: 'large', color: '#ef4444' });\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;align-items:center;padding:1rem;justify-content:center;';\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:1rem 2rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 95%,#ef4444);border:1px solid color-mix(in srgb,#ef4444 20%,transparent);';\nbox.appendChild(icon);\nconst label = document.createElement('span'); label.textContent = '#ef4444'; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);font-family:monospace;';\nbox.appendChild(label);\nhost.appendChild(box);\nreturn host;\n:::\n\n## Icon Galleries\n\nBrowse icons by category.\n\n:::script label=\"Brand & Social Icons\" expected=\"20 brand icons in a responsive grid\"\nconst brands = ['apple','discord','dribbble','dropbox','facebook','github','google','linkedin','stackoverflow','twitter','X','youtube','css','html','javascript','npm','react','vue','tailwind','flowbite'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:10px;padding:4px;';\n\nfor (const name of brands) {\n  const icon = await slice.build('Icon', { name, size:'24px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--primary-color));border:1px solid color-mix(in srgb,var(--primary-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.5em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;\n:::\n\n:::script label=\"UI & Navigation Icons\" expected=\"common navigation and interface icons in a grid\"\nconst uis = ['search','home','bars','grid','list','close','plus','minus','filter','upload','download','zoom-in','zoom-out','shuffle','sort','refresh','undo','redo','pen','edit','trash-bin','bookmark','flag','star','heart','clock','cog','map-pin','lock','lock-open','bell','eye','palette'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of uis) {\n  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--secondary-color));border:1px solid color-mix(in srgb,var(--secondary-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;\n:::\n\n:::script label=\"Media, Files & Dev Icons\" expected=\"media playback, file management and development icons\"\nconst items = ['play','pause','circle-pause','forward-step','backward-step','camera-photo','video-camera','microphone','headphones','volume-down','volume-up','clapperboard-play','file','file-code','file-pdf','file-image','file-zip','folder','folder-open','cloud-arrow-up','database','terminal','code','code-branch','code-fork','code-merge','bug','atom'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of items) {\n  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--tertiary-background-color));border:1px solid color-mix(in srgb,var(--primary-color)8%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;\n:::\n\n:::script label=\"Expressions & Objects\" expected=\"faces, commerce, weather and miscellaneous icons\"\nconst misc = ['face-grin','face-laugh','face-explode','face-grin-stars','fire','lightbulb','rocket','gift-box','truck','cart','credit-card','cash','receipt','store','tag','ticket','wallet','moon','sun','globe','paper-plane','envelope','message-dots','phone','building','landmark','briefcase','scale-balanced','brain','wand-magic-sparkles'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of misc) {\n  const icon = await slice.build('Icon', { name, size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--warning-color));border:1px solid color-mix(in srgb,var(--warning-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;\n:::\n\n## Icon Reference\n\n<!-- icon-table:start -->\n\n`Icon` exposes **291 names**. `Source` is the Lucide icon behind each name, or\n`legacy mark` for the brand, language and Slice marks Lucide does not ship (those keep their\noriginal artwork). The table is generated: see `scripts/generate-icon-table.mjs`.\n\n| Icon name | Source |\n|-----------|--------|\n| `address-book` | `contact` |\n| `adjustments-horizontal` | `sliders-horizontal` |\n| `adjustments-vertical` | `sliders-vertical` |\n| `align-center` | `align-center-horizontal` |\n| `angle-down` | `chevron-down` |\n| `angle-left` | `chevron-left` |\n| `angle-right` | `chevron-right` |\n| `angle-up` | `chevron-up` |\n| `annotation` | `message-square-text` |\n| `apple` | lucide |\n| `archive` | lucide |\n| `archive-arrow-down` | `archive-restore` |\n| `arrow-down` | lucide |\n| `arrow-down-to-bracket` | `corner-down-right` |\n| `arrow-left` | lucide |\n| `arrow-left-to-bracket` | `corner-left-down` |\n| `arrow-right` | lucide |\n| `arrow-right-alt` | `move-right` |\n| `arrow-right-to-bracket` | `corner-right-down` |\n| `arrow-sort-letters` | `arrow-down-a-z` |\n| `arrow-up` | lucide |\n| `arrow-up-down` | lucide |\n| `arrow-up-from-bracket` | `corner-left-up` |\n| `arrow-up-right-down-left` | `shuffle` |\n| `arrow-up-right-from-square` | `corner-up-right` |\n| `arrows-repeat` | `refresh-cw` |\n| `arrows-repeat-count` | `repeat-1` |\n| `atom` | lucide |\n| `backward-step` | `skip-back` |\n| `badge-check` | lucide |\n| `bars` | `menu` |\n| `bars-from-left` | `panel-left` |\n| `bell` | lucide |\n| `bell-active` | `bell-ring` |\n| `bell-active-alt` | `bell` |\n| `bell-ring` | lucide |\n| `blender-phone` | `phone-call` |\n| `book` | lucide |\n| `book-open` | lucide |\n| `bookmark` | lucide |\n| `brain` | lucide |\n| `briefcase` | lucide |\n| `bug` | lucide |\n| `building` | lucide |\n| `bullhorn` | `megaphone` |\n| `calendar-edit` | `calendar-cog` |\n| `calendar-month` | `calendar` |\n| `calendar-plus` | lucide |\n| `calendar-week` | `calendar-days` |\n| `camera-photo` | `camera` |\n| `caption` | `captions` |\n| `caret-down` | `chevron-down` |\n| `caret-left` | `chevron-left` |\n| `caret-right` | `chevron-right` |\n| `caret-sort` | `chevrons-up-down` |\n| `caret-up` | `chevron-up` |\n| `cart` | `shopping-cart` |\n| `cart-plus` | `shopping-cart` |\n| `cart-plus-alt` | `shopping-bag` |\n| `cash` | `banknote` |\n| `chart` | `chart-column` |\n| `chart-line-down` | `trending-down` |\n| `chart-line-up` | `trending-up` |\n| `chart-mixed` | `chart-no-axes-column` |\n| `chart-mixed-dollar` | `badge-dollar-sign` |\n| `chart-pie` | lucide |\n| `check` | lucide |\n| `check-circle` | `circle-check` |\n| `check-plus-circle` | `circle-check-big` |\n| `chevron-double-down` | `chevrons-down` |\n| `chevron-double-left` | `chevrons-left` |\n| `chevron-double-right` | `chevrons-right` |\n| `chevron-double-up` | `chevrons-up` |\n| `chevron-down` | lucide |\n| `chevron-left` | lucide |\n| `chevron-right` | lucide |\n| `chevron-sort` | `chevrons-up-down` |\n| `chevron-up` | lucide |\n| `circle-pause` | lucide |\n| `circle-plus` | lucide |\n| `clapperboard-play` | `clapperboard` |\n| `clipboard` | lucide |\n| `clipboard-check` | lucide |\n| `clipboard-list` | lucide |\n| `clock` | lucide |\n| `close` | `x` |\n| `close-circle` | `circle-x` |\n| `cloud-arrow-up` | `cloud-upload` |\n| `code` | lucide |\n| `code-branch` | `git-branch` |\n| `code-fork` | `git-fork` |\n| `code-merge` | `git-merge` |\n| `code-pull-request` | `git-pull-request` |\n| `cog` | lucide |\n| `column` | `columns-3` |\n| `command` | lucide |\n| `compress` | `shrink` |\n| `computer-speaker` | `volume-2` |\n| `credit-card` | lucide |\n| `css` | legacy mark |\n| `database` | lucide |\n| `desktop-pc` | `monitor` |\n| `discord` | legacy mark |\n| `dna` | lucide |\n| `dollar` | `dollar-sign` |\n| `dots-horizontal` | `ellipsis` |\n| `dots-vertical` | `ellipsis-vertical` |\n| `download` | lucide |\n| `draw-square` | `square` |\n| `dribbble` | legacy mark |\n| `dropbox` | legacy mark |\n| `edit` | `pencil` |\n| `envelope` | `mail` |\n| `envelope-open` | `mail-open` |\n| `euro` | lucide |\n| `exclamation-circle` | `circle-alert` |\n| `expand` | lucide |\n| `eye` | lucide |\n| `eye-slash` | `eye-off` |\n| `face-explode` | `face-grinning` |\n| `face-grin` | `face-grinning` |\n| `face-grin-stars` | `face-slightly-smiling` |\n| `face-laugh` | `face-slightly-smiling-plus` |\n| `facebook` | legacy mark |\n| `file` | lucide |\n| `file-chart-bar` | `file-chart-column` |\n| `file-check` | lucide |\n| `file-circle-plus` | `file-plus` |\n| `file-clone` | `copy` |\n| `file-code` | lucide |\n| `file-copy` | `copy` |\n| `file-copy-alt` | `copy-check` |\n| `file-csv` | `file-spreadsheet` |\n| `file-export` | `file-output` |\n| `file-image` | lucide |\n| `file-import` | `file-input` |\n| `file-invoice` | `receipt` |\n| `file-lines` | `file-text` |\n| `file-music` | lucide |\n| `file-paste` | `clipboard` |\n| `file-pdf` | `file-text` |\n| `file-pen` | lucide |\n| `file-ppt` | `file-chart-column` |\n| `file-search` | lucide |\n| `file-shield` | `shield` |\n| `file-video` | `video` |\n| `file-word` | `file-type` |\n| `file-zip` | `file-archive` |\n| `filter` | `list-filter` |\n| `fingerprint` | `scan-face` |\n| `fire` | `flame` |\n| `flag` | lucide |\n| `flowbite` | legacy mark |\n| `folder` | lucide |\n| `folder-arrow-right` | `folder-symlink` |\n| `folder-duplicate` | `folder-plus` |\n| `folder-open` | lucide |\n| `folder-plus` | lucide |\n| `forward` | lucide |\n| `forward-step` | `skip-forward` |\n| `gift-box` | `gift` |\n| `github` | legacy mark |\n| `globe` | lucide |\n| `google` | legacy mark |\n| `grid` | `layout-grid` |\n| `grid-plus` | `panel-top` |\n| `headphones` | lucide |\n| `heart` | lucide |\n| `home` | `house` |\n| `hourglass` | lucide |\n| `html` | legacy mark |\n| `image` | lucide |\n| `inbox` | lucide |\n| `inbox-full` | `inbox` |\n| `indent` | `list-indent-increase` |\n| `info-circle` | `info` |\n| `javascript` | legacy mark |\n| `keyboard` | lucide |\n| `label` | `tag` |\n| `landmark` | lucide |\n| `layers` | lucide |\n| `letter-bold` | `bold` |\n| `letter-italic` | `italic` |\n| `letter-underline` | `underline` |\n| `life-saver` | `life-buoy` |\n| `lightbulb` | lucide |\n| `link` | lucide |\n| `linkedin` | legacy mark |\n| `list` | lucide |\n| `list-music` | lucide |\n| `lock` | lucide |\n| `lock-open` | lucide |\n| `lock-time` | `lock-keyhole` |\n| `mail-box` | `mailbox` |\n| `map-pin` | lucide |\n| `map-pin-alt` | `map-pin` |\n| `message-caption` | `message-square-text` |\n| `message-dots` | `message-circle-more` |\n| `messages` | `messages-square` |\n| `microphone` | `mic` |\n| `minimize` | lucide |\n| `minus` | lucide |\n| `mobile-phone` | `smartphone` |\n| `moon` | lucide |\n| `newspaper` | lucide |\n| `npm` | legacy mark |\n| `ordered-list` | `list-ordered` |\n| `outdent` | `list-indent-decrease` |\n| `palette` | lucide |\n| `paper-clip` | `paperclip` |\n| `paper-plane` | `send` |\n| `paragraph` | `pilcrow` |\n| `pause` | lucide |\n| `pen` | lucide |\n| `pen-nib` | `pen-tool` |\n| `phone` | lucide |\n| `play` | lucide |\n| `plus` | lucide |\n| `printer` | lucide |\n| `profile-card` | `id-card` |\n| `question-circle` | `circle-question-mark` |\n| `quote` | lucide |\n| `react` | legacy mark |\n| `receipt` | lucide |\n| `rectangle-list` | `list` |\n| `redo` | lucide |\n| `refresh` | `refresh-cw` |\n| `reply` | lucide |\n| `reply-all` | lucide |\n| `restore-window` | `rotate-ccw` |\n| `rocket` | lucide |\n| `ruler-combined` | `ruler` |\n| `sale-percent` | `badge-percent` |\n| `scale-balanced` | `scale` |\n| `search` | lucide |\n| `share-all` | `share-2` |\n| `share-nodes` | `share-2` |\n| `shield` | lucide |\n| `shield-check` | lucide |\n| `shopping-bag` | lucide |\n| `shuffle` | lucide |\n| `singleSlice` | legacy mark |\n| `sliceJs` | legacy mark |\n| `sliceLogo` | legacy mark |\n| `slicePizza` | legacy mark |\n| `sort` | `arrow-up-down` |\n| `sort-horizontal` | `arrow-down-up` |\n| `stackoverflow` | legacy mark |\n| `star` | lucide |\n| `star-half` | lucide |\n| `star-half-stroke` | `star-half` |\n| `store` | lucide |\n| `sun` | lucide |\n| `swatchbook` | `palette` |\n| `table-column` | `table-2` |\n| `table-row` | `rows-3` |\n| `tablet` | lucide |\n| `tag` | lucide |\n| `tailwind` | legacy mark |\n| `terminal` | lucide |\n| `text-size` | `type` |\n| `text-slash` | `strikethrough` |\n| `thumbs-down` | lucide |\n| `thumbs-up` | lucide |\n| `ticket` | lucide |\n| `trash-bin` | `trash` |\n| `truck` | lucide |\n| `twitter` | legacy mark |\n| `undo` | lucide |\n| `upload` | lucide |\n| `user` | lucide |\n| `user-add` | `user-plus` |\n| `user-circle` | `circle-user` |\n| `user-edit` | `user-round-pen` |\n| `user-headset` | `headphones` |\n| `user-remove` | `user-minus` |\n| `user-settings` | `user-cog` |\n| `users` | lucide |\n| `users-group` | `users` |\n| `video-camera` | `video` |\n| `volume-down` | `volume-1` |\n| `volume-up` | `volume-2` |\n| `vue` | legacy mark |\n| `wallet` | lucide |\n| `wand-magic-sparkles` | `wand-sparkles` |\n| `window` | `app-window` |\n| `window-restore` | `copy` |\n| `X` | legacy mark |\n| `youtube` | legacy mark |\n| `zoom-in` | lucide |\n| `zoom-out` | lucide |\n\n<!-- icon-table:end -->\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"name\": \"rocket\",\n  \"size\": \"large\",\n  \"color\": \"var(--primary-color)\"\n}") {
               try {
                  props = JSON.parse("{\n  \"name\": \"rocket\",\n  \"size\": \"large\",\n  \"color\": \"var(--primary-color)\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Icon', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| Meaning | Token |","| --- | --- |","| Primary action / current state | `var(--primary-color)` |","| Secondary / neutral | `var(--secondary-color)` |","| Success, confirmation | `var(--success-color)` |","| Warning, attention | `var(--warning-color)` |","| Danger, destructive | `var(--danger-color)` |","| Muted / supporting | `var(--font-secondary-color)` |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            const lines = ["| Icon name | Source |","|-----------|--------|","| `address-book` | `contact` |","| `adjustments-horizontal` | `sliders-horizontal` |","| `adjustments-vertical` | `sliders-vertical` |","| `align-center` | `align-center-horizontal` |","| `angle-down` | `chevron-down` |","| `angle-left` | `chevron-left` |","| `angle-right` | `chevron-right` |","| `angle-up` | `chevron-up` |","| `annotation` | `message-square-text` |","| `apple` | lucide |","| `archive` | lucide |","| `archive-arrow-down` | `archive-restore` |","| `arrow-down` | lucide |","| `arrow-down-to-bracket` | `corner-down-right` |","| `arrow-left` | lucide |","| `arrow-left-to-bracket` | `corner-left-down` |","| `arrow-right` | lucide |","| `arrow-right-alt` | `move-right` |","| `arrow-right-to-bracket` | `corner-right-down` |","| `arrow-sort-letters` | `arrow-down-a-z` |","| `arrow-up` | lucide |","| `arrow-up-down` | lucide |","| `arrow-up-from-bracket` | `corner-left-up` |","| `arrow-up-right-down-left` | `shuffle` |","| `arrow-up-right-from-square` | `corner-up-right` |","| `arrows-repeat` | `refresh-cw` |","| `arrows-repeat-count` | `repeat-1` |","| `atom` | lucide |","| `backward-step` | `skip-back` |","| `badge-check` | lucide |","| `bars` | `menu` |","| `bars-from-left` | `panel-left` |","| `bell` | lucide |","| `bell-active` | `bell-ring` |","| `bell-active-alt` | `bell` |","| `bell-ring` | lucide |","| `blender-phone` | `phone-call` |","| `book` | lucide |","| `book-open` | lucide |","| `bookmark` | lucide |","| `brain` | lucide |","| `briefcase` | lucide |","| `bug` | lucide |","| `building` | lucide |","| `bullhorn` | `megaphone` |","| `calendar-edit` | `calendar-cog` |","| `calendar-month` | `calendar` |","| `calendar-plus` | lucide |","| `calendar-week` | `calendar-days` |","| `camera-photo` | `camera` |","| `caption` | `captions` |","| `caret-down` | `chevron-down` |","| `caret-left` | `chevron-left` |","| `caret-right` | `chevron-right` |","| `caret-sort` | `chevrons-up-down` |","| `caret-up` | `chevron-up` |","| `cart` | `shopping-cart` |","| `cart-plus` | `shopping-cart` |","| `cart-plus-alt` | `shopping-bag` |","| `cash` | `banknote` |","| `chart` | `chart-column` |","| `chart-line-down` | `trending-down` |","| `chart-line-up` | `trending-up` |","| `chart-mixed` | `chart-no-axes-column` |","| `chart-mixed-dollar` | `badge-dollar-sign` |","| `chart-pie` | lucide |","| `check` | lucide |","| `check-circle` | `circle-check` |","| `check-plus-circle` | `circle-check-big` |","| `chevron-double-down` | `chevrons-down` |","| `chevron-double-left` | `chevrons-left` |","| `chevron-double-right` | `chevrons-right` |","| `chevron-double-up` | `chevrons-up` |","| `chevron-down` | lucide |","| `chevron-left` | lucide |","| `chevron-right` | lucide |","| `chevron-sort` | `chevrons-up-down` |","| `chevron-up` | lucide |","| `circle-pause` | lucide |","| `circle-plus` | lucide |","| `clapperboard-play` | `clapperboard` |","| `clipboard` | lucide |","| `clipboard-check` | lucide |","| `clipboard-list` | lucide |","| `clock` | lucide |","| `close` | `x` |","| `close-circle` | `circle-x` |","| `cloud-arrow-up` | `cloud-upload` |","| `code` | lucide |","| `code-branch` | `git-branch` |","| `code-fork` | `git-fork` |","| `code-merge` | `git-merge` |","| `code-pull-request` | `git-pull-request` |","| `cog` | lucide |","| `column` | `columns-3` |","| `command` | lucide |","| `compress` | `shrink` |","| `computer-speaker` | `volume-2` |","| `credit-card` | lucide |","| `css` | legacy mark |","| `database` | lucide |","| `desktop-pc` | `monitor` |","| `discord` | legacy mark |","| `dna` | lucide |","| `dollar` | `dollar-sign` |","| `dots-horizontal` | `ellipsis` |","| `dots-vertical` | `ellipsis-vertical` |","| `download` | lucide |","| `draw-square` | `square` |","| `dribbble` | legacy mark |","| `dropbox` | legacy mark |","| `edit` | `pencil` |","| `envelope` | `mail` |","| `envelope-open` | `mail-open` |","| `euro` | lucide |","| `exclamation-circle` | `circle-alert` |","| `expand` | lucide |","| `eye` | lucide |","| `eye-slash` | `eye-off` |","| `face-explode` | `face-grinning` |","| `face-grin` | `face-grinning` |","| `face-grin-stars` | `face-slightly-smiling` |","| `face-laugh` | `face-slightly-smiling-plus` |","| `facebook` | legacy mark |","| `file` | lucide |","| `file-chart-bar` | `file-chart-column` |","| `file-check` | lucide |","| `file-circle-plus` | `file-plus` |","| `file-clone` | `copy` |","| `file-code` | lucide |","| `file-copy` | `copy` |","| `file-copy-alt` | `copy-check` |","| `file-csv` | `file-spreadsheet` |","| `file-export` | `file-output` |","| `file-image` | lucide |","| `file-import` | `file-input` |","| `file-invoice` | `receipt` |","| `file-lines` | `file-text` |","| `file-music` | lucide |","| `file-paste` | `clipboard` |","| `file-pdf` | `file-text` |","| `file-pen` | lucide |","| `file-ppt` | `file-chart-column` |","| `file-search` | lucide |","| `file-shield` | `shield` |","| `file-video` | `video` |","| `file-word` | `file-type` |","| `file-zip` | `file-archive` |","| `filter` | `list-filter` |","| `fingerprint` | `scan-face` |","| `fire` | `flame` |","| `flag` | lucide |","| `flowbite` | legacy mark |","| `folder` | lucide |","| `folder-arrow-right` | `folder-symlink` |","| `folder-duplicate` | `folder-plus` |","| `folder-open` | lucide |","| `folder-plus` | lucide |","| `forward` | lucide |","| `forward-step` | `skip-forward` |","| `gift-box` | `gift` |","| `github` | legacy mark |","| `globe` | lucide |","| `google` | legacy mark |","| `grid` | `layout-grid` |","| `grid-plus` | `panel-top` |","| `headphones` | lucide |","| `heart` | lucide |","| `home` | `house` |","| `hourglass` | lucide |","| `html` | legacy mark |","| `image` | lucide |","| `inbox` | lucide |","| `inbox-full` | `inbox` |","| `indent` | `list-indent-increase` |","| `info-circle` | `info` |","| `javascript` | legacy mark |","| `keyboard` | lucide |","| `label` | `tag` |","| `landmark` | lucide |","| `layers` | lucide |","| `letter-bold` | `bold` |","| `letter-italic` | `italic` |","| `letter-underline` | `underline` |","| `life-saver` | `life-buoy` |","| `lightbulb` | lucide |","| `link` | lucide |","| `linkedin` | legacy mark |","| `list` | lucide |","| `list-music` | lucide |","| `lock` | lucide |","| `lock-open` | lucide |","| `lock-time` | `lock-keyhole` |","| `mail-box` | `mailbox` |","| `map-pin` | lucide |","| `map-pin-alt` | `map-pin` |","| `message-caption` | `message-square-text` |","| `message-dots` | `message-circle-more` |","| `messages` | `messages-square` |","| `microphone` | `mic` |","| `minimize` | lucide |","| `minus` | lucide |","| `mobile-phone` | `smartphone` |","| `moon` | lucide |","| `newspaper` | lucide |","| `npm` | legacy mark |","| `ordered-list` | `list-ordered` |","| `outdent` | `list-indent-decrease` |","| `palette` | lucide |","| `paper-clip` | `paperclip` |","| `paper-plane` | `send` |","| `paragraph` | `pilcrow` |","| `pause` | lucide |","| `pen` | lucide |","| `pen-nib` | `pen-tool` |","| `phone` | lucide |","| `play` | lucide |","| `plus` | lucide |","| `printer` | lucide |","| `profile-card` | `id-card` |","| `question-circle` | `circle-question-mark` |","| `quote` | lucide |","| `react` | legacy mark |","| `receipt` | lucide |","| `rectangle-list` | `list` |","| `redo` | lucide |","| `refresh` | `refresh-cw` |","| `reply` | lucide |","| `reply-all` | lucide |","| `restore-window` | `rotate-ccw` |","| `rocket` | lucide |","| `ruler-combined` | `ruler` |","| `sale-percent` | `badge-percent` |","| `scale-balanced` | `scale` |","| `search` | lucide |","| `share-all` | `share-2` |","| `share-nodes` | `share-2` |","| `shield` | lucide |","| `shield-check` | lucide |","| `shopping-bag` | lucide |","| `shuffle` | lucide |","| `singleSlice` | legacy mark |","| `sliceJs` | legacy mark |","| `sliceLogo` | legacy mark |","| `slicePizza` | legacy mark |","| `sort` | `arrow-up-down` |","| `sort-horizontal` | `arrow-down-up` |","| `stackoverflow` | legacy mark |","| `star` | lucide |","| `star-half` | lucide |","| `star-half-stroke` | `star-half` |","| `store` | lucide |","| `sun` | lucide |","| `swatchbook` | `palette` |","| `table-column` | `table-2` |","| `table-row` | `rows-3` |","| `tablet` | lucide |","| `tag` | lucide |","| `tailwind` | legacy mark |","| `terminal` | lucide |","| `text-size` | `type` |","| `text-slash` | `strikethrough` |","| `thumbs-down` | lucide |","| `thumbs-up` | lucide |","| `ticket` | lucide |","| `trash-bin` | `trash` |","| `truck` | lucide |","| `twitter` | legacy mark |","| `undo` | lucide |","| `upload` | lucide |","| `user` | lucide |","| `user-add` | `user-plus` |","| `user-circle` | `circle-user` |","| `user-edit` | `user-round-pen` |","| `user-headset` | `headphones` |","| `user-remove` | `user-minus` |","| `user-settings` | `user-cog` |","| `users` | lucide |","| `users-group` | `users` |","| `video-camera` | `video` |","| `volume-down` | `volume-1` |","| `volume-up` | `volume-2` |","| `vue` | legacy mark |","| `wallet` | lucide |","| `wand-magic-sparkles` | `wand-sparkles` |","| `window` | `app-window` |","| `window-restore` | `copy` |","| `X` | legacy mark |","| `youtube` | legacy mark |","| `zoom-in` | lucide |","| `zoom-out` | lucide |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-12"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"youtube\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"small\",\"allowedValues\":[]},{\"path\":\"color\",\"type\":\"string\",\"required\":false,\"default\":\"currentColor\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"iconStyle\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"youtube\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"small\",\"allowedValues\":[]},{\"path\":\"color\",\"type\":\"string\",\"required\":false,\"default\":\"currentColor\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"iconStyle\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

  beforeDestroy() {
    // Cleanup timers, listeners, or pending work here
  }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: '❐'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    const section = document.createElement('section');
    section.classList.add('doc-script-scenarios');

    const title = document.createElement('h2');
    title.textContent = 'Prop Scenarios';
    section.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.classList.add('doc-script-subtitle');
    subtitle.textContent = 'Interactive demos validating component behavior.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };

      section.appendChild(demobox);
      demobox.appendCode(code);
      section.appendChild(errorMessage);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-icondocumentation', IconDocumentation);
