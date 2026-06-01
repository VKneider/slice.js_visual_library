export default class IconDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Filled vs Outlined","expected":"renders two icons with different styles","kind":"script","content":"const filled = await slice.build('Icon', { name: 'star', iconStyle: 'filled', size: 'large', color: 'var(--warning-color)' });\nconst outlined = await slice.build('Icon', { name: 'star', iconStyle: 'outlined', size: 'large', color: 'var(--font-secondary-color)' });\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;gap:2rem;align-items:center;padding:1rem;justify-content:center;';\n\nconst g1 = document.createElement('div');\ng1.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:1rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--warning-color));border:1px solid color-mix(in srgb,var(--warning-color)15%,transparent);';\ng1.appendChild(filled);\nconst l1 = document.createElement('span'); l1.textContent = 'filled'; l1.style.cssText = 'font-size:.7em;color:var(--font-secondary-color);';\ng1.appendChild(l1);\n\nconst g2 = document.createElement('div');\ng2.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:1rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--medium-color));border:1px solid color-mix(in srgb,var(--medium-color)15%,transparent);';\ng2.appendChild(outlined);\nconst l2 = document.createElement('span'); l2.textContent = 'outlined'; l2.style.cssText = 'font-size:.7em;color:var(--font-secondary-color);';\ng2.appendChild(l2);\n\nhost.appendChild(g1); host.appendChild(g2);\nreturn host;"},{"label":"Size Variants","expected":"renders icons at small, medium and large sizes","kind":"script","content":"const sizes = ['small','medium','large'];\nconst icons = await Promise.all(sizes.map(s => slice.build('Icon', { name: 'cog', size: s, color: 'var(--primary-color)' })));\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;gap:1.5rem;align-items:flex-end;padding:1rem;justify-content:center;';\n\nsizes.forEach((s, i) => {\n  const box = document.createElement('div');\n  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';\n  box.appendChild(icons[i]);\n  const label = document.createElement('span'); label.textContent = s; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);';\n  box.appendChild(label);\n  host.appendChild(box);\n});\nreturn host;"},{"label":"Custom Color","expected":"renders icon with custom hex color","kind":"script","content":"const icon = await slice.build('Icon', { name: 'heart', size: 'large', color: '#ef4444' });\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;align-items:center;padding:1rem;justify-content:center;';\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:1rem 2rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 95%,#ef4444);border:1px solid color-mix(in srgb,#ef4444 20%,transparent);';\nbox.appendChild(icon);\nconst label = document.createElement('span'); label.textContent = '#ef4444'; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);font-family:monospace;';\nbox.appendChild(label);\nhost.appendChild(box);\nreturn host;"},{"label":"Brand & Social Icons","expected":"32 brand icons in a responsive grid","kind":"script","content":"const brands = ['apple','discord','dribbble','dropbox','facebook','github','google','linkedin','stackoverflow','twitter','X','youtube','css','html','javascript','npm','react','vue','tailwind','flowbite'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:10px;padding:4px;';\n\nfor (const name of brands) {\n  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'24px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--primary-color));border:1px solid color-mix(in srgb,var(--primary-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.5em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;"},{"label":"UI & Navigation Icons","expected":"common navigation and interface icons in a grid","kind":"script","content":"const uis = ['search','home','bars','grid','list','close','plus','minus','filter','upload','download','zoom-in','zoom-out','shuffle','sort','refresh','undo','redo','pen','edit','trash-bin','bookmark','flag','star','heart','clock','cog','map-pin','lock','lock-open','bell','eye','palette'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of uis) {\n  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--secondary-color));border:1px solid color-mix(in srgb,var(--secondary-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;"},{"label":"Media, Files & Dev Icons","expected":"media playback, file management and development icons","kind":"script","content":"const items = ['play','pause','circle-pause','forward-step','backward-step','camera-photo','video-camera','microphone','headphones','volume-down','volume-up','clapperboard-play','file','file-code','file-pdf','file-image','file-zip','folder','folder-open','cloud-arrow-up','database','terminal','code','code-branch','code-fork','code-merge','bug','atom'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of items) {\n  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--tertiary-background-color));border:1px solid color-mix(in srgb,var(--primary-color)8%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;"},{"label":"Expressions & Objects","expected":"faces, commerce, weather and miscellaneous icons","kind":"script","content":"const misc = ['face-grin','face-laugh','face-explode','face-grin-stars','fire','lightbulb','rocket','gift-box','truck','cart','credit-card','cash','receipt','store','tag','ticket','wallet','moon','sun','globe','paper-plane','envelope','message-dots','phone','building','landmark','briefcase','scale-balanced','brain','wand-magic-sparkles'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of misc) {\n  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--warning-color));border:1px solid color-mix(in srgb,var(--warning-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;"}];
  }

  async init() {
    this.markdownPath = "icon.md";
    this.markdownContent = "---\ntitle: Icon\nroute: /docs/display/icon\nnavLabel: Icon\nsection: Display\ngroup: Basic\norder: 20\ndescription: Complete icon reference with all 291 symbols, usage patterns, and style variants.\ncomponent: IconDocumentation\ngenerate: true\ntags: [icon, display, reference]\n---\n\n# Icon\n\n## Overview\n`Icon` renders a symbol from the built-in **slc** icon font. Every icon is available in **filled** (`iconStyle: \"filled\"`) and/or **outlined** (`iconStyle: \"outlined\"`) style. Use the `name` prop with the exact names listed below.\n\n## API\n\n- `name` (string, default `\"youtube\"`) — Icon symbol name (see full list below).\n- `iconStyle` (string, default `\"filled\"`) — `\"filled\"` or `\"outlined\"`.\n- `size` (string, default `\"small\"`) — `\"small\"` (16px), `\"medium\"` (20px), `\"large\"` (24px), or any CSS size.\n- `color` (string, default `\"black\"`) — Any CSS color value.\n\n## Live Preview\n:::component name=\"Icon\"\n{\n  \"name\": \"rocket\",\n  \"size\": \"large\",\n  \"color\": \"var(--primary-color)\"\n}\n:::\n\n## Demos\n\n:::script label=\"Filled vs Outlined\" expected=\"renders two icons with different styles\"\nconst filled = await slice.build('Icon', { name: 'star', iconStyle: 'filled', size: 'large', color: 'var(--warning-color)' });\nconst outlined = await slice.build('Icon', { name: 'star', iconStyle: 'outlined', size: 'large', color: 'var(--font-secondary-color)' });\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;gap:2rem;align-items:center;padding:1rem;justify-content:center;';\n\nconst g1 = document.createElement('div');\ng1.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:1rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--warning-color));border:1px solid color-mix(in srgb,var(--warning-color)15%,transparent);';\ng1.appendChild(filled);\nconst l1 = document.createElement('span'); l1.textContent = 'filled'; l1.style.cssText = 'font-size:.7em;color:var(--font-secondary-color);';\ng1.appendChild(l1);\n\nconst g2 = document.createElement('div');\ng2.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:1rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--medium-color));border:1px solid color-mix(in srgb,var(--medium-color)15%,transparent);';\ng2.appendChild(outlined);\nconst l2 = document.createElement('span'); l2.textContent = 'outlined'; l2.style.cssText = 'font-size:.7em;color:var(--font-secondary-color);';\ng2.appendChild(l2);\n\nhost.appendChild(g1); host.appendChild(g2);\nreturn host;\n:::\n\n:::script label=\"Size Variants\" expected=\"renders icons at small, medium and large sizes\"\nconst sizes = ['small','medium','large'];\nconst icons = await Promise.all(sizes.map(s => slice.build('Icon', { name: 'cog', size: s, color: 'var(--primary-color)' })));\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;gap:1.5rem;align-items:flex-end;padding:1rem;justify-content:center;';\n\nsizes.forEach((s, i) => {\n  const box = document.createElement('div');\n  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;';\n  box.appendChild(icons[i]);\n  const label = document.createElement('span'); label.textContent = s; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);';\n  box.appendChild(label);\n  host.appendChild(box);\n});\nreturn host;\n:::\n\n:::script label=\"Custom Color\" expected=\"renders icon with custom hex color\"\nconst icon = await slice.build('Icon', { name: 'heart', size: 'large', color: '#ef4444' });\n\nconst host = document.createElement('div');\nhost.style.cssText = 'display:flex;align-items:center;padding:1rem;justify-content:center;';\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:1rem 2rem;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 95%,#ef4444);border:1px solid color-mix(in srgb,#ef4444 20%,transparent);';\nbox.appendChild(icon);\nconst label = document.createElement('span'); label.textContent = '#ef4444'; label.style.cssText = 'font-size:.65em;color:var(--font-secondary-color);font-family:monospace;';\nbox.appendChild(label);\nhost.appendChild(box);\nreturn host;\n:::\n\n## Icon Galleries\n\nBrowse icons by category.\n\n:::script label=\"Brand & Social Icons\" expected=\"32 brand icons in a responsive grid\"\nconst brands = ['apple','discord','dribbble','dropbox','facebook','github','google','linkedin','stackoverflow','twitter','X','youtube','css','html','javascript','npm','react','vue','tailwind','flowbite'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:10px;padding:4px;';\n\nfor (const name of brands) {\n  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'24px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 4px;border-radius:8px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--primary-color));border:1px solid color-mix(in srgb,var(--primary-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.5em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;\n:::\n\n:::script label=\"UI & Navigation Icons\" expected=\"common navigation and interface icons in a grid\"\nconst uis = ['search','home','bars','grid','list','close','plus','minus','filter','upload','download','zoom-in','zoom-out','shuffle','sort','refresh','undo','redo','pen','edit','trash-bin','bookmark','flag','star','heart','clock','cog','map-pin','lock','lock-open','bell','eye','palette'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of uis) {\n  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--secondary-color));border:1px solid color-mix(in srgb,var(--secondary-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;\n:::\n\n:::script label=\"Media, Files & Dev Icons\" expected=\"media playback, file management and development icons\"\nconst items = ['play','pause','circle-pause','forward-step','backward-step','camera-photo','video-camera','microphone','headphones','volume-down','volume-up','clapperboard-play','file','file-code','file-pdf','file-image','file-zip','folder','folder-open','cloud-arrow-up','database','terminal','code','code-branch','code-fork','code-merge','bug','atom'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of items) {\n  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 95%,var(--tertiary-background-color));border:1px solid color-mix(in srgb,var(--primary-color)8%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;\n:::\n\n:::script label=\"Expressions & Objects\" expected=\"faces, commerce, weather and miscellaneous icons\"\nconst misc = ['face-grin','face-laugh','face-explode','face-grin-stars','fire','lightbulb','rocket','gift-box','truck','cart','credit-card','cash','receipt','store','tag','ticket','wallet','moon','sun','globe','paper-plane','envelope','message-dots','phone','building','landmark','briefcase','scale-balanced','brain','wand-magic-sparkles'];\nconst container = document.createElement('div');\ncontainer.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;padding:4px;';\n\nfor (const name of misc) {\n  const icon = await slice.build('Icon', { name, iconStyle:'filled', size:'20px', color:'var(--font-primary-color)' });\n  const cell = document.createElement('div');\n  cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:color-mix(in srgb,var(--primary-background-color) 96%,var(--warning-color));border:1px solid color-mix(in srgb,var(--warning-color)10%,transparent);';\n  cell.appendChild(icon);\n  const label = document.createElement('span'); label.textContent = name; label.style.cssText = 'font-size:.45em;color:var(--font-secondary-color);text-align:center;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap;';\n  cell.appendChild(label);\n  container.appendChild(cell);\n}\nreturn container;\n:::\n\n## Icon Reference\n\nThe slc font contains **291 unique symbols**. Icons with a checkmark are available in that style.\n\n### UI & Navigation\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `angle-down` | | ✓ |\n| `angle-left` | | ✓ |\n| `angle-right` | | ✓ |\n| `angle-up` | | ✓ |\n| `arrow-down` | | ✓ |\n| `arrow-down-to-bracket` | | ✓ |\n| `arrow-left` | | ✓ |\n| `arrow-left-to-bracket` | | ✓ |\n| `arrow-right` | | ✓ |\n| `arrow-right-alt` | ✓ | ✓ |\n| `arrow-right-to-bracket` | | ✓ |\n| `arrow-sort-letters` | | ✓ |\n| `arrow-up` | | ✓ |\n| `arrow-up-down` | | ✓ |\n| `arrow-up-from-bracket` | | ✓ |\n| `arrow-up-right-down-left` | | ✓ |\n| `arrow-up-right-from-square` | ✓ | ✓ |\n| `arrows-repeat` | | ✓ |\n| `arrows-repeat-count` | | ✓ |\n| `bars` | | ✓ |\n| `bars-from-left` | | ✓ |\n| `caret-down` | ✓ | ✓ |\n| `caret-left` | ✓ | ✓ |\n| `caret-right` | ✓ | ✓ |\n| `caret-sort` | ✓ | ✓ |\n| `caret-up` | ✓ | ✓ |\n| `chevron-double-down` | | ✓ |\n| `chevron-double-left` | | ✓ |\n| `chevron-double-right` | | ✓ |\n| `chevron-double-up` | | ✓ |\n| `chevron-down` | | ✓ |\n| `chevron-left` | | ✓ |\n| `chevron-right` | | ✓ |\n| `chevron-sort` | | ✓ |\n| `chevron-up` | | ✓ |\n| `close` | | ✓ |\n| `close-circle` | ✓ | ✓ |\n| `compress` | | ✓ |\n| `draw-square` | ✓ | ✓ |\n| `expand` | | ✓ |\n| `grid` | ✓ | ✓ |\n| `grid-plus` | ✓ | ✓ |\n| `home` | ✓ | ✓ |\n| `list` | | ✓ |\n| `minimize` | | ✓ |\n| `minus` | | ✓ |\n| `ordered-list` | | ✓ |\n| `rectangle-list` | ✓ | ✓ |\n| `plus` | | ✓ |\n| `search` | ✓ | ✓ |\n| `shuffle` | | ✓ |\n| `sort` | | ✓ |\n| `sort-horizontal` | | ✓ |\n| `upload` | ✓ | ✓ |\n| `zoom-in` | ✓ | ✓ |\n| `zoom-out` | ✓ | ✓ |\n\n### Arrows & Directional\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `arrow-down` | | ✓ |\n| `arrow-left` | | ✓ |\n| `arrow-right` | | ✓ |\n| `arrow-up` | | ✓ |\n| `expand` | | ✓ |\n| `forward` | ✓ | ✓ |\n| `forward-step` | ✓ | ✓ |\n| `backward-step` | ✓ | ✓ |\n| `reply` | ✓ | ✓ |\n| `reply-all` | ✓ | ✓ |\n| `share-all` | ✓ | ✓ |\n| `share-nodes` | ✓ | ✓ |\n| `redo` | | ✓ |\n| `undo` | | ✓ |\n| `refresh` | | ✓ |\n| `download` | ✓ | ✓ |\n| `upload` | ✓ | ✓ |\n\n### Communication\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `bell` | ✓ | ✓ |\n| `bell-active` | ✓ | ✓ |\n| `bell-active-alt` | ✓ | ✓ |\n| `bell-ring` | ✓ | ✓ |\n| `bullhorn` | ✓ | ✓ |\n| `envelope` | ✓ | ✓ |\n| `envelope-open` | ✓ | ✓ |\n| `globe` | ✓ | ✓ |\n| `message-caption` | ✓ | ✓ |\n| `message-dots` | ✓ | ✓ |\n| `messages` | ✓ | ✓ |\n| `phone` | ✓ | ✓ |\n| `blender-phone` | ✓ | ✓ |\n| `paper-plane` | ✓ | ✓ |\n\n### Media & Audio\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `play` | ✓ | ✓ |\n| `pause` | ✓ | ✓ |\n| `circle-pause` | ✓ | ✓ |\n| `circle-plus` | ✓ | ✓ |\n| `backward-step` | ✓ | ✓ |\n| `forward-step` | ✓ | ✓ |\n| `forward` | ✓ | ✓ |\n| `camera-photo` | ✓ | ✓ |\n| `video-camera` | ✓ | ✓ |\n| `microphone` | ✓ | ✓ |\n| `headphones` | ✓ | ✓ |\n| `list-music` | ✓ | ✓ |\n| `clapperboard-play` | ✓ | ✓ |\n| `computer-speaker` | ✓ | ✓ |\n| `volume-down` | ✓ | ✓ |\n| `volume-up` | ✓ | ✓ |\n\n### Files & Storage\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `file` | ✓ | ✓ |\n| `file-chart-bar` | ✓ | ✓ |\n| `file-check` | ✓ | ✓ |\n| `file-circle-plus` | ✓ | ✓ |\n| `file-clone` | ✓ | ✓ |\n| `file-code` | ✓ | ✓ |\n| `file-copy` | ✓ | ✓ |\n| `file-copy-alt` | ✓ | ✓ |\n| `file-csv` | ✓ | ✓ |\n| `file-export` | ✓ | ✓ |\n| `file-image` | ✓ | ✓ |\n| `image` | ✓ | ✓ |\n| `file-import` | ✓ | ✓ |\n| `file-invoice` | ✓ | ✓ |\n| `file-lines` | ✓ | ✓ |\n| `file-music` | ✓ | ✓ |\n| `file-paste` | ✓ | ✓ |\n| `file-pdf` | ✓ | ✓ |\n| `file-pen` | ✓ | ✓ |\n| `file-ppt` | ✓ | ✓ |\n| `file-search` | ✓ | ✓ |\n| `file-shield` | ✓ | ✓ |\n| `file-video` | ✓ | ✓ |\n| `file-word` | ✓ | ✓ |\n| `file-zip` | ✓ | ✓ |\n| `folder` | ✓ | ✓ |\n| `folder-arrow-right` | ✓ | ✓ |\n| `folder-duplicate` | ✓ | ✓ |\n| `folder-open` | ✓ | ✓ |\n| `folder-plus` | ✓ | ✓ |\n| `clipboard` | ✓ | ✓ |\n| `clipboard-check` | ✓ | ✓ |\n| `clipboard-list` | ✓ | ✓ |\n| `cloud-arrow-up` | ✓ | ✓ |\n| `archive` | ✓ | ✓ |\n| `archive-arrow-down` | ✓ | ✓ |\n| `database` | ✓ | ✓ |\n| `inbox` | ✓ | ✓ |\n| `inbox-full` | ✓ | ✓ |\n| `download` | ✓ | ✓ |\n\n### Users & People\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `user` | ✓ | ✓ |\n| `users` | ✓ | ✓ |\n| `users-group` | ✓ | ✓ |\n| `user-add` | ✓ | ✓ |\n| `user-circle` | ✓ | ✓ |\n| `user-edit` | ✓ | ✓ |\n| `user-headset` | ✓ | ✓ |\n| `user-remove` | ✓ | ✓ |\n| `user-settings` | ✓ | ✓ |\n| `profile-card` | ✓ | ✓ |\n\n### Commerce & Finance\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `cart` | ✓ | ✓ |\n| `cart-plus` | ✓ | ✓ |\n| `cart-plus-alt` | ✓ | ✓ |\n| `credit-card` | ✓ | ✓ |\n| `cash` | ✓ | ✓ |\n| `dollar` | | ✓ |\n| `euro` | | ✓ |\n| `receipt` | ✓ | ✓ |\n| `sale-percent` | ✓ | ✓ |\n| `shopping-bag` | ✓ | ✓ |\n| `store` | ✓ | ✓ |\n| `gift-box` | ✓ | ✓ |\n| `truck` | ✓ | ✓ |\n| `wallet` | ✓ | ✓ |\n\n### Status & Feedback\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `badge-check` | ✓ | ✓ |\n| `check` | | ✓ |\n| `check-circle` | ✓ | ✓ |\n| `check-plus-circle` | ✓ | ✓ |\n| `exclamation-circle` | ✓ | ✓ |\n| `info-circle` | ✓ | ✓ |\n| `question-circle` | ✓ | ✓ |\n| `flag` | ✓ | ✓ |\n| `fire` | ✓ | ✓ |\n| `shield` | ✓ | ✓ |\n| `shield-check` | ✓ | ✓ |\n| `thumbs-up` | ✓ | ✓ |\n| `thumbs-down` | ✓ | ✓ |\n\n### Objects & Essentials\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `book` | ✓ | ✓ |\n| `book-open` | ✓ | ✓ |\n| `bookmark` | ✓ | ✓ |\n| `clock` | ✓ | ✓ |\n| `cog` | ✓ | ✓ |\n| `heart` | ✓ | ✓ |\n| `hourglass` | ✓ | ✓ |\n| `keyboard` | ✓ | ✓ |\n| `desktop-pc` | ✓ | ✓ |\n| `label` | ✓ | ✓ |\n| `lightbulb` | ✓ | ✓ |\n| `lock` | ✓ | ✓ |\n| `lock-open` | ✓ | ✓ |\n| `lock-time` | ✓ | ✓ |\n| `map-pin` | ✓ | ✓ |\n| `map-pin-alt` | ✓ | ✓ |\n| `newspaper` | ✓ | ✓ |\n| `paper-clip` | | ✓ |\n| `rocket` | ✓ | ✓ |\n| `star` | ✓ | ✓ |\n| `star-half` | ✓ | ✓ |\n| `star-half-stroke` | ✓ | ✓ |\n| `tag` | ✓ | ✓ |\n| `ticket` | ✓ | ✓ |\n| `trash-bin` | ✓ | ✓ |\n| `window` | ✓ | ✓ |\n| `window-restore` | ✓ | ✓ |\n\n### Design & Layout\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `palette` | ✓ | ✓ |\n| `pen` | ✓ | ✓ |\n| `pen-nib` | ✓ | ✓ |\n| `edit` | ✓ | ✓ |\n| `swatchbook` | ✓ | ✓ |\n| `column` | ✓ | ✓ |\n| `layers` | ✓ | ✓ |\n| `grid` | ✓ | ✓ |\n| `table-column` | ✓ | ✓ |\n| `table-row` | ✓ | ✓ |\n| `indent` | ✓ | ✓ |\n| `outdent` | ✓ | ✓ |\n| `paragraph` | ✓ | ✓ |\n| `quote` | ✓ | ✓ |\n| `align-center` | | ✓ |\n| `letter-bold` | | ✓ |\n| `letter-italic` | | ✓ |\n| `letter-underline` | | ✓ |\n| `text-size` | | ✓ |\n| `text-slash` | | ✓ |\n| `ruler-combined` | | ✓ |\n| `dots-horizontal` | | ✓ |\n| `dots-vertical` | | ✓ |\n| `caption` | ✓ | ✓ |\n| `filter` | ✓ | ✓ |\n\n### Development\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `code` | | ✓ |\n| `code-branch` | ✓ | ✓ |\n| `code-fork` | ✓ | ✓ |\n| `code-merge` | ✓ | ✓ |\n| `code-pull-request` | ✓ | ✓ |\n| `terminal` | ✓ | ✓ |\n| `command` | | ✓ |\n| `atom` | | ✓ |\n| `dna` | | ✓ |\n| `fingerprint` | | ✓ |\n| `bug` | ✓ | ✓ |\n| `database` | ✓ | ✓ |\n| `css` | ✓ | |\n| `html` | ✓ | |\n| `javascript` | ✓ | |\n| `npm` | ✓ | |\n| `react` | ✓ | |\n| `vue` | ✓ | |\n| `tailwind` | ✓ | |\n| `flowbite` | ✓ | |\n\n### Brands & Social\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `apple` | ✓ | |\n| `discord` | ✓ | |\n| `dribbble` | ✓ | |\n| `dropbox` | ✓ | |\n| `facebook` | ✓ | |\n| `github` | ✓ | |\n| `google` | ✓ | |\n| `linkedin` | ✓ | |\n| `stackoverflow` | ✓ | |\n| `twitter` | ✓ | |\n| `X` | ✓ | |\n| `youtube` | ✓ | |\n\n### Slice Brand\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `singleSlice` | ✓ | |\n| `sliceJs` | ✓ | |\n| `sliceLogo` | ✓ | |\n| `slicePizza` | ✓ | |\n\n### Weather & Time\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `moon` | ✓ | ✓ |\n| `sun` | ✓ | ✓ |\n| `clock` | ✓ | ✓ |\n| `hourglass` | ✓ | ✓ |\n\n### Miscellaneous\n| Icon name | Filled | Outlined |\n|-----------|--------|----------|\n| `address-book` | ✓ | ✓ |\n| `adjustments-horizontal` | ✓ | ✓ |\n| `adjustments-vertical` | ✓ | ✓ |\n| `annotation` | ✓ | ✓ |\n| `brain` | ✓ | ✓ |\n| `briefcase` | ✓ | ✓ |\n| `building` | ✓ | ✓ |\n| `calendar-edit` | ✓ | ✓ |\n| `calendar-month` | ✓ | ✓ |\n| `calendar-plus` | ✓ | ✓ |\n| `calendar-week` | ✓ | ✓ |\n| `chart` | | ✓ |\n| `chart-line-down` | | ✓ |\n| `chart-line-up` | | ✓ |\n| `chart-mixed` | | ✓ |\n| `chart-mixed-dollar` | ✓ | ✓ |\n| `chart-pie` | ✓ | ✓ |\n| `eye` | ✓ | ✓ |\n| `eye-slash` | ✓ | ✓ |\n| `face-explode` | ✓ | ✓ |\n| `face-grin` | ✓ | ✓ |\n| `face-grin-stars` | ✓ | ✓ |\n| `face-laugh` | ✓ | ✓ |\n| `landmark` | ✓ | ✓ |\n| `life-saver` | ✓ | ✓ |\n| `link` | | ✓ |\n| `mail-box` | ✓ | ✓ |\n| `mobile-phone` | ✓ | ✓ |\n| `printer` | ✓ | ✓ |\n| `restore-window` | | ✓ |\n| `scale-balanced` | ✓ | ✓ |\n| `tablet` | ✓ | ✓ |\n| `wand-magic-sparkles` | ✓ | ✓ |\n\n## Best Practices\n:::tip\nUse consistent `size` and `color` values within a feature to maintain visual alignment. Prefer theme tokens (`var(--primary-color)`, `var(--font-secondary-color)`) over hardcoded hex values when possible.\n:::\n\n:::tip\nFor Slice brand logos (`singleSlice`, `sliceJs`, `sliceLogo`) always use `filled` style — the outlined variants do not exist.\n:::\n\n## Pitfalls\n:::warning\nIcon names are case-sensitive and use kebab-case. For example, use `arrow-up-right-from-square`, not `arrowUpRightFromSquare`.\n:::\n";
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
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `angle-down` | | ✓ |","| `angle-left` | | ✓ |","| `angle-right` | | ✓ |","| `angle-up` | | ✓ |","| `arrow-down` | | ✓ |","| `arrow-down-to-bracket` | | ✓ |","| `arrow-left` | | ✓ |","| `arrow-left-to-bracket` | | ✓ |","| `arrow-right` | | ✓ |","| `arrow-right-alt` | ✓ | ✓ |","| `arrow-right-to-bracket` | | ✓ |","| `arrow-sort-letters` | | ✓ |","| `arrow-up` | | ✓ |","| `arrow-up-down` | | ✓ |","| `arrow-up-from-bracket` | | ✓ |","| `arrow-up-right-down-left` | | ✓ |","| `arrow-up-right-from-square` | ✓ | ✓ |","| `arrows-repeat` | | ✓ |","| `arrows-repeat-count` | | ✓ |","| `bars` | | ✓ |","| `bars-from-left` | | ✓ |","| `caret-down` | ✓ | ✓ |","| `caret-left` | ✓ | ✓ |","| `caret-right` | ✓ | ✓ |","| `caret-sort` | ✓ | ✓ |","| `caret-up` | ✓ | ✓ |","| `chevron-double-down` | | ✓ |","| `chevron-double-left` | | ✓ |","| `chevron-double-right` | | ✓ |","| `chevron-double-up` | | ✓ |","| `chevron-down` | | ✓ |","| `chevron-left` | | ✓ |","| `chevron-right` | | ✓ |","| `chevron-sort` | | ✓ |","| `chevron-up` | | ✓ |","| `close` | | ✓ |","| `close-circle` | ✓ | ✓ |","| `compress` | | ✓ |","| `draw-square` | ✓ | ✓ |","| `expand` | | ✓ |","| `grid` | ✓ | ✓ |","| `grid-plus` | ✓ | ✓ |","| `home` | ✓ | ✓ |","| `list` | | ✓ |","| `minimize` | | ✓ |","| `minus` | | ✓ |","| `ordered-list` | | ✓ |","| `rectangle-list` | ✓ | ✓ |","| `plus` | | ✓ |","| `search` | ✓ | ✓ |","| `shuffle` | | ✓ |","| `sort` | | ✓ |","| `sort-horizontal` | | ✓ |","| `upload` | ✓ | ✓ |","| `zoom-in` | ✓ | ✓ |","| `zoom-out` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `arrow-down` | | ✓ |","| `arrow-left` | | ✓ |","| `arrow-right` | | ✓ |","| `arrow-up` | | ✓ |","| `expand` | | ✓ |","| `forward` | ✓ | ✓ |","| `forward-step` | ✓ | ✓ |","| `backward-step` | ✓ | ✓ |","| `reply` | ✓ | ✓ |","| `reply-all` | ✓ | ✓ |","| `share-all` | ✓ | ✓ |","| `share-nodes` | ✓ | ✓ |","| `redo` | | ✓ |","| `undo` | | ✓ |","| `refresh` | | ✓ |","| `download` | ✓ | ✓ |","| `upload` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `bell` | ✓ | ✓ |","| `bell-active` | ✓ | ✓ |","| `bell-active-alt` | ✓ | ✓ |","| `bell-ring` | ✓ | ✓ |","| `bullhorn` | ✓ | ✓ |","| `envelope` | ✓ | ✓ |","| `envelope-open` | ✓ | ✓ |","| `globe` | ✓ | ✓ |","| `message-caption` | ✓ | ✓ |","| `message-dots` | ✓ | ✓ |","| `messages` | ✓ | ✓ |","| `phone` | ✓ | ✓ |","| `blender-phone` | ✓ | ✓ |","| `paper-plane` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-12"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `play` | ✓ | ✓ |","| `pause` | ✓ | ✓ |","| `circle-pause` | ✓ | ✓ |","| `circle-plus` | ✓ | ✓ |","| `backward-step` | ✓ | ✓ |","| `forward-step` | ✓ | ✓ |","| `forward` | ✓ | ✓ |","| `camera-photo` | ✓ | ✓ |","| `video-camera` | ✓ | ✓ |","| `microphone` | ✓ | ✓ |","| `headphones` | ✓ | ✓ |","| `list-music` | ✓ | ✓ |","| `clapperboard-play` | ✓ | ✓ |","| `computer-speaker` | ✓ | ✓ |","| `volume-down` | ✓ | ✓ |","| `volume-up` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-13"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `file` | ✓ | ✓ |","| `file-chart-bar` | ✓ | ✓ |","| `file-check` | ✓ | ✓ |","| `file-circle-plus` | ✓ | ✓ |","| `file-clone` | ✓ | ✓ |","| `file-code` | ✓ | ✓ |","| `file-copy` | ✓ | ✓ |","| `file-copy-alt` | ✓ | ✓ |","| `file-csv` | ✓ | ✓ |","| `file-export` | ✓ | ✓ |","| `file-image` | ✓ | ✓ |","| `image` | ✓ | ✓ |","| `file-import` | ✓ | ✓ |","| `file-invoice` | ✓ | ✓ |","| `file-lines` | ✓ | ✓ |","| `file-music` | ✓ | ✓ |","| `file-paste` | ✓ | ✓ |","| `file-pdf` | ✓ | ✓ |","| `file-pen` | ✓ | ✓ |","| `file-ppt` | ✓ | ✓ |","| `file-search` | ✓ | ✓ |","| `file-shield` | ✓ | ✓ |","| `file-video` | ✓ | ✓ |","| `file-word` | ✓ | ✓ |","| `file-zip` | ✓ | ✓ |","| `folder` | ✓ | ✓ |","| `folder-arrow-right` | ✓ | ✓ |","| `folder-duplicate` | ✓ | ✓ |","| `folder-open` | ✓ | ✓ |","| `folder-plus` | ✓ | ✓ |","| `clipboard` | ✓ | ✓ |","| `clipboard-check` | ✓ | ✓ |","| `clipboard-list` | ✓ | ✓ |","| `cloud-arrow-up` | ✓ | ✓ |","| `archive` | ✓ | ✓ |","| `archive-arrow-down` | ✓ | ✓ |","| `database` | ✓ | ✓ |","| `inbox` | ✓ | ✓ |","| `inbox-full` | ✓ | ✓ |","| `download` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-14"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `user` | ✓ | ✓ |","| `users` | ✓ | ✓ |","| `users-group` | ✓ | ✓ |","| `user-add` | ✓ | ✓ |","| `user-circle` | ✓ | ✓ |","| `user-edit` | ✓ | ✓ |","| `user-headset` | ✓ | ✓ |","| `user-remove` | ✓ | ✓ |","| `user-settings` | ✓ | ✓ |","| `profile-card` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-15"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `cart` | ✓ | ✓ |","| `cart-plus` | ✓ | ✓ |","| `cart-plus-alt` | ✓ | ✓ |","| `credit-card` | ✓ | ✓ |","| `cash` | ✓ | ✓ |","| `dollar` | | ✓ |","| `euro` | | ✓ |","| `receipt` | ✓ | ✓ |","| `sale-percent` | ✓ | ✓ |","| `shopping-bag` | ✓ | ✓ |","| `store` | ✓ | ✓ |","| `gift-box` | ✓ | ✓ |","| `truck` | ✓ | ✓ |","| `wallet` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-16"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `badge-check` | ✓ | ✓ |","| `check` | | ✓ |","| `check-circle` | ✓ | ✓ |","| `check-plus-circle` | ✓ | ✓ |","| `exclamation-circle` | ✓ | ✓ |","| `info-circle` | ✓ | ✓ |","| `question-circle` | ✓ | ✓ |","| `flag` | ✓ | ✓ |","| `fire` | ✓ | ✓ |","| `shield` | ✓ | ✓ |","| `shield-check` | ✓ | ✓ |","| `thumbs-up` | ✓ | ✓ |","| `thumbs-down` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-17"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `book` | ✓ | ✓ |","| `book-open` | ✓ | ✓ |","| `bookmark` | ✓ | ✓ |","| `clock` | ✓ | ✓ |","| `cog` | ✓ | ✓ |","| `heart` | ✓ | ✓ |","| `hourglass` | ✓ | ✓ |","| `keyboard` | ✓ | ✓ |","| `desktop-pc` | ✓ | ✓ |","| `label` | ✓ | ✓ |","| `lightbulb` | ✓ | ✓ |","| `lock` | ✓ | ✓ |","| `lock-open` | ✓ | ✓ |","| `lock-time` | ✓ | ✓ |","| `map-pin` | ✓ | ✓ |","| `map-pin-alt` | ✓ | ✓ |","| `newspaper` | ✓ | ✓ |","| `paper-clip` | | ✓ |","| `rocket` | ✓ | ✓ |","| `star` | ✓ | ✓ |","| `star-half` | ✓ | ✓ |","| `star-half-stroke` | ✓ | ✓ |","| `tag` | ✓ | ✓ |","| `ticket` | ✓ | ✓ |","| `trash-bin` | ✓ | ✓ |","| `window` | ✓ | ✓ |","| `window-restore` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-18"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `palette` | ✓ | ✓ |","| `pen` | ✓ | ✓ |","| `pen-nib` | ✓ | ✓ |","| `edit` | ✓ | ✓ |","| `swatchbook` | ✓ | ✓ |","| `column` | ✓ | ✓ |","| `layers` | ✓ | ✓ |","| `grid` | ✓ | ✓ |","| `table-column` | ✓ | ✓ |","| `table-row` | ✓ | ✓ |","| `indent` | ✓ | ✓ |","| `outdent` | ✓ | ✓ |","| `paragraph` | ✓ | ✓ |","| `quote` | ✓ | ✓ |","| `align-center` | | ✓ |","| `letter-bold` | | ✓ |","| `letter-italic` | | ✓ |","| `letter-underline` | | ✓ |","| `text-size` | | ✓ |","| `text-slash` | | ✓ |","| `ruler-combined` | | ✓ |","| `dots-horizontal` | | ✓ |","| `dots-vertical` | | ✓ |","| `caption` | ✓ | ✓ |","| `filter` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-19"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `code` | | ✓ |","| `code-branch` | ✓ | ✓ |","| `code-fork` | ✓ | ✓ |","| `code-merge` | ✓ | ✓ |","| `code-pull-request` | ✓ | ✓ |","| `terminal` | ✓ | ✓ |","| `command` | | ✓ |","| `atom` | | ✓ |","| `dna` | | ✓ |","| `fingerprint` | | ✓ |","| `bug` | ✓ | ✓ |","| `database` | ✓ | ✓ |","| `css` | ✓ | |","| `html` | ✓ | |","| `javascript` | ✓ | |","| `npm` | ✓ | |","| `react` | ✓ | |","| `vue` | ✓ | |","| `tailwind` | ✓ | |","| `flowbite` | ✓ | |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-20"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `apple` | ✓ | |","| `discord` | ✓ | |","| `dribbble` | ✓ | |","| `dropbox` | ✓ | |","| `facebook` | ✓ | |","| `github` | ✓ | |","| `google` | ✓ | |","| `linkedin` | ✓ | |","| `stackoverflow` | ✓ | |","| `twitter` | ✓ | |","| `X` | ✓ | |","| `youtube` | ✓ | |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-21"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `singleSlice` | ✓ | |","| `sliceJs` | ✓ | |","| `sliceLogo` | ✓ | |","| `slicePizza` | ✓ | |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-22"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `moon` | ✓ | ✓ |","| `sun` | ✓ | ✓ |","| `clock` | ✓ | ✓ |","| `hourglass` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-23"]');
         if (container) {
            const lines = ["| Icon name | Filled | Outlined |","|-----------|--------|----------|","| `address-book` | ✓ | ✓ |","| `adjustments-horizontal` | ✓ | ✓ |","| `adjustments-vertical` | ✓ | ✓ |","| `annotation` | ✓ | ✓ |","| `brain` | ✓ | ✓ |","| `briefcase` | ✓ | ✓ |","| `building` | ✓ | ✓ |","| `calendar-edit` | ✓ | ✓ |","| `calendar-month` | ✓ | ✓ |","| `calendar-plus` | ✓ | ✓ |","| `calendar-week` | ✓ | ✓ |","| `chart` | | ✓ |","| `chart-line-down` | | ✓ |","| `chart-line-up` | | ✓ |","| `chart-mixed` | | ✓ |","| `chart-mixed-dollar` | ✓ | ✓ |","| `chart-pie` | ✓ | ✓ |","| `eye` | ✓ | ✓ |","| `eye-slash` | ✓ | ✓ |","| `face-explode` | ✓ | ✓ |","| `face-grin` | ✓ | ✓ |","| `face-grin-stars` | ✓ | ✓ |","| `face-laugh` | ✓ | ✓ |","| `landmark` | ✓ | ✓ |","| `life-saver` | ✓ | ✓ |","| `link` | | ✓ |","| `mail-box` | ✓ | ✓ |","| `mobile-phone` | ✓ | ✓ |","| `printer` | ✓ | ✓ |","| `restore-window` | | ✓ |","| `scale-balanced` | ✓ | ✓ |","| `tablet` | ✓ | ✓ |","| `wand-magic-sparkles` | ✓ | ✓ |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-24"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"youtube\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"small\",\"allowedValues\":[]},{\"path\":\"color\",\"type\":\"string\",\"required\":false,\"default\":\"black\",\"allowedValues\":[]},{\"path\":\"iconStyle\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"youtube\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"small\",\"allowedValues\":[]},{\"path\":\"color\",\"type\":\"string\",\"required\":false,\"default\":\"black\",\"allowedValues\":[]},{\"path\":\"iconStyle\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[]}]}");
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
          return createBuildFallbackNode(name);
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
