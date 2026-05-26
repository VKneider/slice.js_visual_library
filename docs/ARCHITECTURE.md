# Slice.js Visual Library Architecture

## Overview
`slice.js_visual_library` is both:
1. The official component registry source for `slice-cli`.
2. The documentation app where docs pages are generated from markdown.

The application follows an app-shell + routed-content approach, where the shell persists and `MultiRoute` switches content.

---

## High-Level Structure

```text
src/
  App/
  Components/
    AppComponents/
      App/
      ComponentsPage/
        docsIndex.js
        documentationRoutes.generated.js
        visualComponentRoutes.js
      CopyMarkdownMenu/
      MainMenu/
      MyNavigation/
      VisualLibraryHome/
    DocumentationPages/
      ...generated docs components...
    Service/
    Visual/
    components.js
  Styles/
    sliceStyles.css
    DocumentationBase.css
  markdown/
    _TEMPLATE.md
    parser-rules.md
    ...component docs markdown...
  routes.js
  sliceConfig.json

parser/
  index.js
  lib/
  templates/
```

---

## Runtime App Flow

### 1) Root router (`src/routes.js`)
- Maps `/` to `App`.
- Maps `/docs` namespace to `ComponentsPage`.

### 2) App shell (`App` + `ComponentsPage`)
- `App` provides global shell behavior and primary nav.
- `ComponentsPage` builds:
  - `MainMenu` (left navigation)
  - `MyNavigation` (right headings navigation)
  - `MultiRoute` (center content switcher)
  - `Layout` to compose these parts.

### 3) Generated docs routing
- `documentationRoutes.generated.js` is parser-generated from markdown front matter.
- `visualComponentRoutes.js` merges generated docs routes into runtime route config.
- `docsIndex.js` provides structured metadata for docs navigation/indexing.

---

## Markdown-to-Component Pipeline

### Input
- Markdown files in `src/markdown/`.

### Parser responsibilities (`parser/index.js`)
- Validate required front matter.
- Parse markdown blocks.
- Generate documentation component files.
- Update docs index and generated route map.
- Sync registry entries in `src/Components/components.js`.
- Sync style and support components (`DocumentationBase.css`, `CopyMarkdownMenu`).

### Output
- `src/Components/DocumentationPages/<ComponentName>/...`
- `src/Components/AppComponents/ComponentsPage/docsIndex.js`
- `src/Components/AppComponents/ComponentsPage/documentationRoutes.generated.js`

---

## Live Example Execution Model

Each `:::script` block is treated as a live example:
- Code block displayed via `CodeVisualizer`.
- Script executed in async context.
- Live preview rendered immediately below code.
- If execution throws, compact error message is shown.

Execution context provides:
- `component` (documentation component instance)
- `slice`
- `document`
- `mount(node)` helper

Preferred script style:
- return a node (or array of nodes) representing the visual setup.
- use practical usage cases (not synthetic append-only tests).

---

## Styling Strategy

Global app styles:
- `src/Styles/sliceStyles.css`

Documentation-specific styles:
- `src/Styles/DocumentationBase.css`

Design intent:
- Professional, readable docs in light mode.
- Minimal visual noise around examples.
- Code + Live preview prioritized over status widgets.

---

## Registry Role

`src/Components/components.js` is the canonical registry map used by `slice-cli`.

When parser runs:
- Generated docs components are registered as `DocumentationPages`.
- Support components needed by docs (e.g. `CopyMarkdownMenu`) are ensured.

---

## Commands

- `npm run docs:lint-md`
  - Validates markdown front matter and parser contract.

- `npm run docs:generate`
  - Full generation + sync (docs components, routes, index, styles, registry).

- `npm run docs:sync-registry`
  - Sync-oriented run mode.

---

## Extension Guidelines

When adding new docs pages:
1. Add markdown file under `src/markdown/`.
2. Use required front matter and `/docs/...` route.
3. Include multiple `:::script` setups with code + live result.
4. Run lint/generate commands.
5. Verify generated routes and docs entries.

When adding new visual dependencies for docs:
1. Add component in `src/Components/Visual/...`.
2. Register in `src/Components/components.js`.
3. Ensure parser-generated pages can resolve it at runtime.
