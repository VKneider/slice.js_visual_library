# Visual Library Docs UX + Static Props Hybrid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve docs shell spacing/styling, add left-menu search/navigation compaction, and implement hybrid static-props docs output for object schemas.

**Architecture:** Keep the current docs pipeline and app shell intact, but add a thin navigation transformation/filter layer between generated routes and `TreeView`. For parser output, extend `staticPropsDocs` to render both top-level object rows and flattened nested rows with schema details. Use targeted CSS variable alignment for navbar/sidebars/content offsets to avoid layout regressions.

**Tech Stack:** Vanilla Web Components (Slice.js), Node.js built-in test runner (`node --test`), markdown parser/generator in `parser/`, CSS in component-scoped and shared style files.

---

## File Structure And Responsibilities

- Modify: `src/Components/AppComponents/ComponentsPage/visualComponentRoutes.js`
  - Add navigation normalization/filter helpers for compact left menu and search.
- Modify: `src/Components/AppComponents/ComponentsPage/visualComponentRoutes.test.js`
  - Add tests for compact section generation and search filtering.
- Modify: `src/Components/AppComponents/ComponentsPage/ComponentsPage.js`
  - Wire search updates from `MainMenu` to `TreeView` data refresh.
- Modify: `src/Components/AppComponents/MainMenu/MainMenu.html`
  - Add search input container in left menu.
- Modify: `src/Components/AppComponents/MainMenu/MainMenu.js`
  - Emit search events and expose `setMenuTreeItems` helper for reactive updates.
- Modify: `src/Components/AppComponents/MainMenu/MainMenu.css`
  - Align sidebar offset with navbar variable and style search UI.
- Modify: `src/Components/AppComponents/ComponentsPage/ComponentsPage.css`
  - Align content top offset and lateral spacing with sidebars.
- Modify: `src/Components/AppComponents/MyNavigation/MyNavigation.css`
  - Match right sidebar offset and density.
- Modify: `src/Components/Visual/CodeVisualizer/CodeVisualizer.css`
  - Reduce heavy borders/containers and improve visual consistency.
- Modify: `parser/lib/staticPropsDocs.js`
  - Implement hybrid object rendering (root + nested + schema details).
- Modify: `parser/tests/index.test.js`
  - Add/adjust test assertions for hybrid static props markdown output.
- Modify: `docs/CONTRIBUTING_DOCS.md`
  - Document new static props hybrid behavior and left-menu search expectation.

### Task 1: Add Navigation Filter/Compaction Utilities (TDD)

**Files:**
- Modify: `src/Components/AppComponents/ComponentsPage/visualComponentRoutes.test.js`
- Modify: `src/Components/AppComponents/ComponentsPage/visualComponentRoutes.js`

- [ ] **Step 1: Write failing tests for compact and searchable menu output**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  visualComponentsRoutes,
  getAllRoutes,
  resolveInitialDocsPath,
  createTreeViewItems,
  buildCompactNavigationItems,
  filterNavigationItems
} from './visualComponentRoutes.js';

test('buildCompactNavigationItems groups docs sections into compact buckets', () => {
  const compact = buildCompactNavigationItems(visualComponentsRoutes);
  const labels = compact.map((item) => item.value);
  assert.ok(labels.includes('UI Components'));
  assert.ok(labels.includes('Layout & Structure'));
});

test('filterNavigationItems matches title, navLabel and tags', () => {
  const compact = buildCompactNavigationItems(visualComponentsRoutes);

  const byTitle = filterNavigationItems(compact, 'treeview');
  assert.equal(byTitle.some((section) => JSON.stringify(section).toLowerCase().includes('treeview')), true);

  const byTag = filterNavigationItems(compact, 'routing');
  assert.equal(byTag.some((section) => JSON.stringify(section).toLowerCase().includes('multiroute')), true);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test src/Components/AppComponents/ComponentsPage/visualComponentRoutes.test.js`
Expected: FAIL with missing exports like `buildCompactNavigationItems` and/or `filterNavigationItems`.

- [ ] **Step 3: Implement compact grouping and filter helpers**

```js
const NAV_COMPACT_GROUPS = [
  {
    title: 'UI Components',
    sections: ['Display', 'Input Components', 'Navigation', 'Feedback']
  },
  {
    title: 'Layout & Structure',
    sections: ['Layout', 'Routing', 'Data']
  },
  {
    title: 'Docs Internals',
    sections: ['Internal']
  }
];

const normalizeDocNode = (item, sectionTitle) => ({
  value: item.title,
  path: item.path,
  component: item.component,
  searchText: `${item.title} ${item.navLabel || ''} ${(item.tags || []).join(' ')} ${sectionTitle}`.toLowerCase()
});

export const buildCompactNavigationItems = (routesConfig) => {
  const bySection = new Map();
  Object.entries(routesConfig)
    .filter(([key, section]) => key !== 'defaultRoute' && section?.items?.length)
    .forEach(([, section]) => {
      bySection.set(section.title, section.items.map((item) => normalizeDocNode(item, section.title)));
    });

  const compact = [];
  NAV_COMPACT_GROUPS.forEach((group) => {
    const children = [];
    group.sections.forEach((name) => {
      const sectionItems = bySection.get(name) || [];
      if (sectionItems.length > 0) {
        children.push({ value: name, items: sectionItems });
      }
    });
    if (children.length > 0) {
      compact.push({ value: group.title, items: children });
    }
  });

  return compact;
};

const filterNode = (node, query) => {
  const ownMatch = typeof node.searchText === 'string' && node.searchText.includes(query);
  if (!Array.isArray(node.items) || node.items.length === 0) {
    return ownMatch ? { ...node } : null;
  }
  const filteredChildren = node.items.map((child) => filterNode(child, query)).filter(Boolean);
  if (ownMatch || filteredChildren.length > 0) {
    return { ...node, items: filteredChildren };
  }
  return null;
};

export const filterNavigationItems = (items, rawQuery) => {
  const query = String(rawQuery || '').trim().toLowerCase();
  if (!query) return items;
  return items.map((item) => filterNode(item, query)).filter(Boolean);
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `node --test src/Components/AppComponents/ComponentsPage/visualComponentRoutes.test.js`
Expected: PASS, including new compact/filter tests.

- [ ] **Step 5: Commit**

```bash
git add src/Components/AppComponents/ComponentsPage/visualComponentRoutes.js src/Components/AppComponents/ComponentsPage/visualComponentRoutes.test.js
git commit -m "feat: add compact docs navigation and search filters"
```

### Task 2: Wire Search-Driven Tree Updates in MainMenu and ComponentsPage

**Files:**
- Modify: `src/Components/AppComponents/MainMenu/MainMenu.html`
- Modify: `src/Components/AppComponents/MainMenu/MainMenu.js`
- Modify: `src/Components/AppComponents/MainMenu/MainMenu.css`
- Modify: `src/Components/AppComponents/ComponentsPage/ComponentsPage.js`

- [ ] **Step 1: Capture current failing behavior manually before wiring**

```js
// Manual baseline (no DOM harness in this codebase for custom elements yet):
// 1) Open /docs
// 2) Verify there is no search field in left menu
// 3) Verify tree does not filter while typing (feature missing)
```

- [ ] **Step 2: Run existing automated suite before edits (baseline)**

Run: `npm test`
Expected: PASS (baseline), then proceed with implementation and re-run after changes.

- [ ] **Step 3: Add search input in left menu template and event emission logic**

```html
<div class="slice_menu_search">
  <input
    class="slice_menu_search_input"
    type="search"
    placeholder="Search components..."
    aria-label="Search components"
  />
</div>
<div class="slice_menu_tree_host"></div>
```

```js
this.$searchInput = this.querySelector('.slice_menu_search_input');
this.$treeHost = this.querySelector('.slice_menu_tree_host');

this.$searchInput?.addEventListener('input', () => {
  this.dispatchEvent(
    new CustomEvent('docs-menu-search', {
      bubbles: true,
      detail: { query: this.$searchInput.value || '' }
    })
  );
});

setMenuTreeItems(treeNode) {
  this.$treeHost.innerHTML = '';
  if (treeNode) {
    this.$treeHost.appendChild(treeNode);
  }
}
```

- [ ] **Step 4: Connect ComponentsPage to recalculate and replace TreeView on input**

```js
import {
  visualComponentsRoutes,
  getAllRoutes,
  buildCompactNavigationItems,
  filterNavigationItems,
  resolveInitialDocsPath
} from './visualComponentRoutes.js';

const baseMenuItems = buildCompactNavigationItems(routesConfig);

const buildTree = async (query = '') => {
  const treeItems = filterNavigationItems(baseMenuItems, query);
  return slice.build('TreeView', {
    items: treeItems,
    onClickCallback: async (item) => {
      if (item.path) {
        await slice.router.navigate(item.path);
        if (typeof mainMenu.handleCloseMenu === 'function') {
          mainMenu.handleCloseMenu();
        }
      }
    }
  });
};

let treeview = await buildTree('');
mainMenu.setMenuTreeItems(treeview);

mainMenu.addEventListener('docs-menu-search', async (event) => {
  const query = event?.detail?.query || '';
  treeview = await buildTree(query);
  mainMenu.setMenuTreeItems(treeview);
});
```

- [ ] **Step 5: Style search box and empty states for menu readability**

```css
.slice_menu_search {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 8px 6px 10px;
  background: var(--primary-background-color);
}

.slice_menu_search_input {
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--primary-color-shade) 70%, transparent);
  border-radius: 8px;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--secondary-background-color) 65%, var(--primary-background-color));
}

.slice_menu_empty {
  padding: 10px;
  opacity: 0.8;
  font-size: 0.92rem;
}
```

- [ ] **Step 6: Run tests and lightweight app smoke run**

Run: `npm test`
Expected: PASS.

Run: `npm run docs:generate`
Expected: generated artifacts updated without parser errors.

- [ ] **Step 7: Commit**

```bash
git add src/Components/AppComponents/MainMenu/MainMenu.html src/Components/AppComponents/MainMenu/MainMenu.js src/Components/AppComponents/MainMenu/MainMenu.css src/Components/AppComponents/ComponentsPage/ComponentsPage.js
git commit -m "feat: add left menu search and reactive tree updates"
```

### Task 3: Fix Navbar/Content/Sidebar Offsets and Visual Density

**Files:**
- Modify: `src/Components/AppComponents/ComponentsPage/ComponentsPage.css`
- Modify: `src/Components/AppComponents/MainMenu/MainMenu.css`
- Modify: `src/Components/AppComponents/MyNavigation/MyNavigation.css`
- Modify: `src/Components/Visual/Navbar/Navbar.css`

- [ ] **Step 1: Add failing visual regression checklist entry (manual)**

```md
- [ ] Before fix: /docs shows excessive top gap under navbar and misaligned sidebars.
```

- [ ] **Step 2: Implement shared offset variables and align fixed regions**

```css
slice-components-page {
  --docs-navbar-height: 72px;
  --docs-side-width: 17%;
  --docs-shell-gap: 14px;
}

slice-components-page slice-multi-route {
  margin: calc(var(--docs-navbar-height) + var(--docs-shell-gap)) var(--docs-side-width) 0 var(--docs-side-width);
  padding: 16px 18px 24px;
  min-height: calc(100vh - var(--docs-navbar-height));
}
```

```css
slice-mainmenu,
slice-mynavigation {
  top: var(--docs-navbar-height, 72px);
  height: calc(100% - var(--docs-navbar-height, 72px));
  width: var(--docs-side-width, 17%);
}
```

- [ ] **Step 3: Reduce border noise and improve readable spacing**

```css
slice-mainmenu {
  border-right: 1px solid color-mix(in srgb, var(--primary-color-shade) 60%, transparent);
}

slice-mynavigation {
  border-left: 1px solid color-mix(in srgb, var(--primary-color-shade) 60%, transparent);
}

.my_navigation a {
  padding: 6px 10px;
  border-radius: 6px;
}
```

- [ ] **Step 4: Verify responsive behavior after offsets update**

Run: `npm run run`
Expected: App starts; in mobile width, menu button remains reachable and no top overlap.

- [ ] **Step 5: Commit**

```bash
git add src/Components/AppComponents/ComponentsPage/ComponentsPage.css src/Components/AppComponents/MainMenu/MainMenu.css src/Components/AppComponents/MyNavigation/MyNavigation.css src/Components/Visual/Navbar/Navbar.css
git commit -m "fix: align docs shell offsets and simplify sidebar styling"
```

### Task 4: Refine CodeVisualizer Styling (No Functional Regression)

**Files:**
- Modify: `src/Components/Visual/CodeVisualizer/CodeVisualizer.css`

- [ ] **Step 1: Add style-focused acceptance checks**

```md
- [ ] Code blocks keep copy button usable.
- [ ] Syntax highlight colors remain readable in current themes.
- [ ] Container looks lighter (less heavy border feel).
```

- [ ] **Step 2: Implement lighter container styling**

```css
.codevisualizer_container {
  background: color-mix(in srgb, var(--secondary-background-color) 80%, var(--primary-background-color));
  border: 1px solid color-mix(in srgb, var(--primary-color-shade) 55%, transparent);
  box-shadow: none;
  padding: 14px 10px 10px;
  margin: 12px 0;
}

.copy-button {
  top: 8px;
  right: 8px;
  opacity: 0.85;
}
```

- [ ] **Step 3: Run docs generation and manual smoke check**

Run: `npm run docs:generate`
Expected: PASS with no generation errors.

Run: `npm run run`
Expected: CodeVisualizer docs page renders and copy button still works.

- [ ] **Step 4: Commit**

```bash
git add src/Components/Visual/CodeVisualizer/CodeVisualizer.css
git commit -m "style: polish codevisualizer container visuals"
```

### Task 5: Implement Hybrid Static Props Output for Object Schemas (TDD)

**Files:**
- Modify: `parser/tests/index.test.js`
- Modify: `parser/lib/staticPropsDocs.js`

- [ ] **Step 1: Add failing test assertions for hybrid root + nested + details**

```js
test('buildStaticPropsSectionForFrontMatter renders hybrid object rows with schema details', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'slice-docs-static-props-hybrid-'));
  const srcDir = path.join(tmpRoot, 'src');
  const visualDir = path.join(srcDir, 'Components', 'Visual', 'Wizard');

  fs.mkdirSync(visualDir, { recursive: true });

  fs.writeFileSync(
    path.join(srcDir, 'sliceConfig.json'),
    JSON.stringify(
      {
        paths: {
          components: {
            Visual: { path: '/Components/Visual', type: 'Visual' }
          }
        }
      },
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    path.join(srcDir, 'Components', 'components.js'),
    `const components = {"Wizard": "Visual", "WizardDocumentation": "DocumentationPages"};\n\nexport default components;\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(visualDir, 'Wizard.js'),
    `
    export default class Wizard extends HTMLElement {
      static props = {
        options: {
          type: 'object',
          schema: {
            theme: {
              type: 'object',
              schema: {
                mode: { type: 'string', allowedValues: ['light', 'dark'] }
              }
            }
          }
        }
      };
    }
    `,
    'utf8'
  );

  const section = await buildStaticPropsSectionForFrontMatter({
    projectRoot: tmpRoot,
    frontMatter: { component: 'WizardDocumentation' }
  });

  assert.match(section, /\| `options` \| `object`/);
  assert.match(section, /`options\.theme\.mode`/);
  assert.match(section, /:::details title="Schema: options"/);
  assert.match(section, /"theme"/);
});
```

- [ ] **Step 2: Run parser tests to verify failure**

Run: `node --test parser/tests/index.test.js`
Expected: FAIL because current output omits root object row and schema details block.

- [ ] **Step 3: Implement hybrid rendering in staticPropsDocs builder**

```js
const stringifySchema = (schema) => JSON.stringify(schema, null, 2);

const buildSchemaDetailsBlock = (rootPath, schema) => {
  if (!schema || typeof schema !== 'object') return '';
  return [
    `:::details title="Schema: ${rootPath}"`,
    '```json',
    stringifySchema(schema),
    '```',
    ':::',
    ''
  ].join('\n');
};

// In collectRows for object:
rows.push({ path: fullPath, meta, isObjectRoot: true });
Object.keys(meta.schema || {}).forEach((key) => collectRows(key, meta.schema[key], fullPath));

// After table rendering:
const objectDetails = rows
  .filter((row) => row.isObjectRoot && row.meta?.schema)
  .map((row) => buildSchemaDetailsBlock(row.path, row.meta.schema))
  .join('\n');

if (objectDetails) {
  lines.push(objectDetails);
}
```

- [ ] **Step 4: Run parser tests to verify pass**

Run: `node --test parser/tests/index.test.js`
Expected: PASS for old and new static props scenarios.

- [ ] **Step 5: Run full suite to catch regressions**

Run: `npm test`
Expected: PASS for parser and route utility tests.

- [ ] **Step 6: Commit**

```bash
git add parser/lib/staticPropsDocs.js parser/tests/index.test.js
git commit -m "feat: render hybrid static props docs for object schemas"
```

### Task 6: Update Contributor Documentation + End-to-End Verification

**Files:**
- Modify: `docs/CONTRIBUTING_DOCS.md`

- [ ] **Step 1: Document new static props hybrid behavior and menu search expectations**

```md
## Static Props (Generated)

- Props tables are generated from component `static props`.
- Object props now render in hybrid form:
  - root row (example: `options`)
  - flattened nested rows (example: `options.theme.mode`)
  - schema details block with JSON for quick inspection.

## Docs Navigation

- Left menu includes component search by title/label/tags.
- If no items match, the menu shows a compact empty state.
```

- [ ] **Step 2: Run full docs workflow commands**

Run: `npm run docs:lint-md`
Expected: PASS.

Run: `npm run docs:generate`
Expected: PASS and regenerated docs artifacts if needed.

- [ ] **Step 3: Run final manual smoke checklist**

Run: `npm run run`
Expected checks:
- `/docs` has corrected top spacing under navbar.
- Left search filters TreeView items in real time.
- No-results state appears for gibberish queries.
- `CodeVisualizer` is visually lighter and copy works.
- Object static props docs show hybrid table + details schema.

- [ ] **Step 4: Commit**

```bash
git add docs/CONTRIBUTING_DOCS.md
git commit -m "docs: describe hybrid static props output and menu search"
```

## Final Verification Gate

- [ ] Run: `npm test`
- [ ] Run: `npm run docs:lint-md`
- [ ] Run: `npm run docs:generate`
- [ ] Run: `npm run run` and complete smoke checklist
- [ ] Run: `git status` to confirm only expected files changed
