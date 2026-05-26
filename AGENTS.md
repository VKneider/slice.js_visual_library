# AGENTS.md

## Scope
This document explains what is already implemented in `slice.js_visual_library` and the operating pattern for future agents adding documentation pages from markdown.

## Implemented So Far

### 1) Registry and docs source
- `slice-cli` registry URL now points to this repository (`src/Components/components.js`).
- Documentation pages are generated from markdown files under `src/markdown/`.

### 2) Local parser (no cross-project references)
- Parser lives in `parser/` with local libs:
  - `parser/index.js`
  - `parser/lib/markdownParser.js`
  - `parser/lib/generator.js`
  - `parser/lib/docsIndex.js`
  - `parser/lib/report.js`
- Templates copied locally for docs support:
  - `parser/templates/DocumentationBase.css`
  - `parser/templates/CopyMarkdownMenu/*`

### 3) Generated outputs
From markdown input, parser generates:
- Documentation components in `src/Components/DocumentationPages/<ComponentName>/`
  - `<ComponentName>.js`
  - `<ComponentName>.html`
  - `<ComponentName>.css`
- Docs index: `src/Components/AppComponents/ComponentsPage/docsIndex.js`
- Generated routes: `src/Components/AppComponents/ComponentsPage/documentationRoutes.generated.js`
- Components registry sync: `src/Components/components.js`
- Global docs style sync: `src/Styles/DocumentationBase.css`
- Copy markdown component sync: `src/Components/AppComponents/CopyMarkdownMenu/*`

### 4) Route namespace
- Documentation namespace is `/docs` (not `/library`).
- Current top-level routes are defined in `src/routes.js` and map docs paths to `ComponentsPage` (app shell pattern).

### 5) Live examples pattern
- `:::script` blocks in markdown are rendered as:
  1. Code block (`CodeVisualizer`)
  2. Live preview rendered automatically below code
- Scripts run in async context (supports `await`).
- A helper `mount(node)` is available in script execution context.
- If execution fails, page shows a compact `Live preview error` message.

## Canonical Markdown Contract

Required front matter fields for generated pages:
- `title`
- `route`
- `section`
- `group`
- `order`
- `component`

Optional useful fields:
- `navLabel`
- `description`
- `tags`
- `generate`

Reference files:
- `src/markdown/_TEMPLATE.md`
- `src/markdown/parser-rules.md`

## Supported Markdown Blocks
- Headings, paragraphs, lists
- Fenced code blocks
- Tables
- `:::tip` and `:::warning`
- `:::details title="..."`
- `:::component name="..."` (JSON props in block body)
- `:::script label="..." expected="..."` (code + live preview)

## Required Commands
- Validate markdown contract:
  - `npm run docs:lint-md`
- Generate docs pages and sync artifacts:
  - `npm run docs:generate`
- Sync registry/index/routes without full regeneration workflow:
  - `npm run docs:sync-registry`

## Agent Workflow (for new docs pages)
1. Add new markdown file in `src/markdown/` with required front matter.
2. Add realistic `:::script` examples that return nodes for live previews.
3. Run `npm run docs:lint-md`.
4. Run `npm run docs:generate`.
5. Verify generated component exists in `src/Components/DocumentationPages/`.
6. Verify route appears in `documentationRoutes.generated.js` and `src/routes.js` mapping exists.
7. Ensure required visual dependencies are in `components.js` (e.g. `Table`, `CodeVisualizer`, `Button`).

## Quality Rules
- Do not introduce React/JSX in this repository.
- Keep docs examples in Slice.js style (`slice.build(...)`).
- Prefer practical use cases over synthetic test snippets.
- Keep visual style clean and professional in light mode (avoid heavy nested containers).
