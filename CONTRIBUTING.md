# Contributing

## Setup

1. **Fork the repository** on GitHub.
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/slice.js_visual_library.git
   cd slice.js_visual_library
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the dev server** (for local preview):
   ```bash
   npm run run
   ```

## Adding a new component

1. **Scaffold the component** using the CLI:
   ```bash
   npm run slice:create
   ```
   Follow the prompts to name your component and select its category (`Visual` or `Service`). This creates the folder, the three required files (`ComponentName.js`, `.html`, `.css`), and registers the component in `src/Components/components.js`.

2. Follow all rules in **[`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md)** for prop naming, deprecation/alias patterns, CSS encapsulation, lifecycle, and accessibility.

## Docs workflow

### 1) Create or update markdown
- Location: `src/markdown/`
- Use `_TEMPLATE.md` as base.
- Keep routes under `/docs/...`.

### 2) Required front matter
Every generated page must include:
- `title`
- `route`
- `section`
- `group`
- `order`
- `component`

### 3) Write practical examples
- Prefer real use cases over synthetic tests.
- Use `:::script` blocks for **code + live result** examples.
- Return a node from scripts whenever possible.

### 4) Use supported blocks
- Headings, paragraphs, lists
- Fenced code blocks
- Tables
- `:::tip`, `:::warning`, `:::details`
- `:::component`
- `:::script`

### 5) Validate markdown
```bash
npm run docs:lint-md
```

### 6) Generate docs artifacts
```bash
npm run docs:generate
```

This updates:
- `src/Components/DocumentationPages/...`
- `src/Components/AppComponents/ComponentsPage/docsIndex.js`
- `src/Components/AppComponents/ComponentsPage/documentationRoutes.generated.js`
- `src/Components/components.js`
- `src/Styles/DocumentationBase.css`

### 7) Run parser tests
```bash
node --test parser/tests/index.test.js
```

### 8) Ensure route mapping exists
- Verify `src/routes.js` includes your `/docs/...` paths mapped to `ComponentsPage`.

### 9) Check visual dependencies
- If docs use components like `Table`, `CodeVisualizer`, etc., ensure they are present and registered in `src/Components/components.js`.

### 10) Manual smoke check
- Open app and navigate to your docs route.
- Confirm:
  - code block renders
  - live preview renders
  - left menu search filters components by name/tags
  - no runtime errors in console

### 11) Review generated changes
- `src/Components/DocumentationPages/`
- `src/Components/AppComponents/ComponentsPage/docsIndex.js`
- `src/Components/AppComponents/ComponentsPage/documentationRoutes.generated.js`
- `src/Components/components.js`

### 12) Open a PR
Use `.github/pull_request_template.md` and complete the verification checklist.

## Component standards

When adding or modifying components, follow **[`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md)**:
prop naming (`onClick` / `onChange`, `customColor: { background, text, accent }`), the
backward-compatible deprecation/alias pattern, CSS encapsulation under the element tag,
lifecycle/cleanup, and the accessibility baseline. New or changed components should pass its
§13 checklist.

> ⚠️ This repository **is the published component registry** — the CLI downloads components
> from it. Any prop rename is a public API change, so never remove an old prop name without
> keeping it working as a deprecated alias (see §7).

## Static props generation behavior
- Component props docs are generated from `static props` in source components.
- For `object` props, generated output is hybrid:
  - root row (for example `options`)
  - flattened nested rows (for example `options.theme.mode`)
  - a details block with schema JSON (`Schema: <prop>`)
- For props with `allowedValues` or meaningful variant combinations, include one `:::script` scenario per relevant value/state.

## Demo components for showcases
- Keep reusable demo-only components under `src/Components/DemoComponents/`.
- Register them in `src/Components/components.js` with category `DemoComponents`.
- Use these demo components in navigation showcases (`Route`, `MultiRoute`, etc.) to avoid coupling demos to documentation pages.

## Notes
- Keep component documentation as the single source of truth in this repository.
- Avoid manual edits to generated files unless the generator requires a fix.
- Keep examples concise, professional, and production-oriented.
- Avoid heavy nested container styling in examples. Favor clean spacing in light mode.
