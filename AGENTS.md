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

## Markdown Contract (authoritative source)

Do **not** duplicate the markdown rules here. The single source of truth for required/optional
front matter, supported `:::` blocks, the `:::script` contract, the commands, and generation rules
is:

- **`src/markdown/parser-rules.md`** — full contract (also rendered at `/docs/internal/markdown-parser-rules`)
- **`src/markdown/_TEMPLATE.md`** — copy-paste scaffold

Commands: `pnpm run docs:lint-md`, `pnpm run docs:generate`, `pnpm run docs:sync-registry`.

## Agent Workflow (for new docs pages)
1. Add new markdown file in `src/markdown/` with required front matter.
2. Add realistic `:::script` examples that return nodes for live previews.
3. Run `pnpm run docs:lint-md`.
4. Run `pnpm run docs:generate`.
5. Verify generated component exists in `src/Components/DocumentationPages/`.
6. Verify route appears in `documentationRoutes.generated.js` and `src/routes.js` mapping exists.
7. Ensure required visual dependencies are in `components.js` (e.g. `Table`, `CodeVisualizer`, `Button`).

## Component Testing (required)
Every component has a `<Component>.spec.js` next to it, run against the real Slice runtime with
Playwright (the `mount` fixture builds it via `slice.build` on the `/__test` harness route).

- When you add or modify a component, add/update its `.spec.js` covering: smoke render,
  props/setters reflected in the DOM, deprecated aliases (§7) if any, handlers, and a11y.
- Run `pnpm run test:e2e` (component gate) and `pnpm test` (node:test logic). Both must pass.
- File-suffix contract: **`*.spec.js` = Playwright**, **`*.test.js` = node:test** — never overlap.
- Full guide + `mount` API: **`playwright/README.md`**. Reference test: `src/Components/Visual/Button/Button.spec.js`.
- Use **pnpm** for everything (never npm). The browser binary is installed once with
  `pnpm exec playwright install chromium`.
- **E2e destroy lifecycle tests** in `src/Components/Visual/Destroy.spec.js` (20 tests) cover
  `destroyComponent`, `destroyByContainer`, and `destroyByPattern` against the real `activeComponents`.
  These are the browser e2e counterpart of the unit tests in `slice.js/Slice/tests/destroy-cascade.test.js`.
- The framework repo (`slice.js`) only has node:unit tests. Any test that requires a real DOM
  (events, visual rendering, destroy with `querySelectorAll`) must be written here in the visual library.

## Quality Rules
- Do not introduce React/JSX in this repository.
- Keep docs examples in Slice.js style (`slice.build(...)`).
- Prefer practical use cases over synthetic test snippets.
- Keep visual style clean and professional in light mode (avoid heavy nested containers).
- Follow **`COMPONENT_API_STANDARDS.md`** for prop naming (`onClick`/`onChange`,
  `customColor: { background, text, accent }`), the deprecation/alias pattern, CSS
  encapsulation, lifecycle/cleanup, and accessibility. This repo is the live registry, so
  **never rename a public prop without keeping the old name as a backward-compatible alias.**
- Write docs examples using the **canonical** prop names (the deprecated aliases must keep
  working, but examples should teach the current API).

## Component Standards
The full contract for authoring/modifying components lives in
[`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md) (naming, aliases, encapsulation,
a11y, theme tokens, and a new-component checklist).

---

## Non-obvious Framework Knowledge

### `destroyByContainer` requires `slice-id` HTML attribute
`destroyByContainer(domNode)` uses `querySelectorAll('[slice-id]')` to discover components inside a container. However, `sliceId` was only stored as a JS property (`component.sliceId = ...`), never as an HTML attribute — so the query always returned empty and `destroyByContainer` always returned 0.

**Fix:** Added `component.setAttribute('slice-id', component.sliceId)` in `Controller.registerComponent()`. Applied both in `slice.js/Slice/.../Controller.js` and in the pnpm store copy at `node_modules/.pnpm/slicejs-web-framework@*/node_modules/.../Controller.js`.

### pnpm store architecture
`node_modules/slicejs-web-framework` is a junction pointing to `.pnpm/slicejs-web-framework@3.3.5/node_modules/slicejs-web-framework`, NOT directly to the `slice.js/` source project. Editing `slice.js/Slice/` does NOT affect the running app until the same change is applied to the `.pnpm` copy.

### `activeComponents` baseline in test harness
The `/__test` TestHarness page always registers infrastructure components (`loading-0`, `route-TestHarness`) in `activeComponents` before any test mounts. Tests that check `activeComponents.size` must account for this baseline (typically 2). Use `sizeBefore` snapshots or check for specific sliceIds rather than asserting `size === 0`.

### Children cascade vs Service destroy
`destroyComponent(parent)` cascades to Visual children via `childrenIndex` (fed by `registerComponentsRecursively` DOM walk). **Services are never auto-cascaded** — if a component builds a Service, it must destroy it explicitly in `beforeDestroy()`. `beforeDestroy` can also destroy additional Visual components that were added after `init()`, since those won't be in `childrenIndex` either.

### `const` in components is safe
All bundler transforms (`BundleGenerator.js`) preserve `const` declarations. Terser targets ES2022. No `const` → `var` downlevel exists. Module-level `const` in components is exclusively private data (`_sliceDeprecated`, icon name arrays, helper functions) — never exported or used as property/class names.
