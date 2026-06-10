# Contributing

Thanks for contributing to the official Slice.js component library! This repository **is the
published component registry** — the CLI downloads components straight from it — so every change
here ships to all Slice.js projects. Read
[`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md) before changing any component API.

## Ways to contribute

| You want to… | Start here |
| --- | --- |
| Find a component to build | [`WANTED_COMPONENTS.md`](./WANTED_COMPONENTS.md) — the wishlist with sizes & pointers |
| Add a new component | [Adding a new component](#adding-a-new-component) |
| Change an existing component | [Modifying an existing component](#modifying-an-existing-component) |
| Write or fix tests | [Testing](#testing) → full guide in [`playwright/README.md`](./playwright/README.md) |
| Write or fix documentation pages | [Docs workflow](#docs-workflow) |
| Work on the parser / infrastructure | [`AGENTS.md`](./AGENTS.md) and `parser/` |

## Setup

This project uses **pnpm** (pinned via `packageManager` in `package.json`). Use pnpm, not npm.

1. **Fork** the repository on GitHub.
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/slice.js_visual_library.git
   cd slice.js_visual_library
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```
4. **Install the test browser** (once — Playwright's browser is not auto-downloaded under this
   project's pnpm config):
   ```bash
   pnpm exec playwright install chromium
   ```
5. **Start the dev server** (local preview, port 3001):
   ```bash
   pnpm run dev
   ```

## Adding a new component

Work through these steps end to end — a new component is not done until it has **both** a passing
test and a documentation page.

1. **Scaffold** it with the CLI:
   ```bash
   pnpm run slice:create
   ```
   Name the component and pick its category (`Visual` or `Service`). This creates the folder, the
   three files (`ComponentName.js`, `.html`, `.css`), and registers it in
   `src/Components/components.js`.
2. **Implement** it following every rule in
   [`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md) — prop naming, deprecation/alias
   pattern, CSS encapsulation, lifecycle/cleanup, and accessibility. It must pass the §13 checklist.
3. **Test it** — add `<ComponentName>.spec.js` next to the component (see [Testing](#testing)) and
   run `pnpm run test:e2e` until green.
4. **Document it** — add a markdown page under `src/markdown/` (see [Docs workflow](#docs-workflow)),
   then run `pnpm run docs:lint-md` and `pnpm run docs:generate`.
5. **Open a PR** using the template and complete its checklist.

## Modifying an existing component

> ⚠️ This repo is the **live registry**. A prop rename is a public API change — never remove an old
> prop name; keep it working as a backward-compatible deprecated alias (see §7 of the standards).

1. Make the change per [`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md).
2. **Update or add** assertions in the component's `<Component>.spec.js` — cover the new behaviour,
   and for any alias assert that the deprecated name still works and warns exactly once (§7).
3. Run `pnpm run test:e2e` and `pnpm test`.
4. If props or behaviour changed, update its markdown page and run `pnpm run docs:generate`.

## Testing

Every component ships with a `<Component>.spec.js` next to it, run against the **real Slice
runtime** with Playwright. A component change is not complete until its test passes.

**Run the tests:**

```bash
pnpm run test:e2e          # component tests: render + behaviour + a11y (the PR gate)
pnpm test                  # logic tests (routes/parser) via node:test
```

First time only (the browser binary is not auto-installed under our pnpm config):

```bash
pnpm exec playwright install chromium
```

**Write a test for your component:**

1. Copy `src/Components/Visual/Button/Button.spec.js` next to your component and adjust the
   relative import to `playwright/harness/sliceFixtures.js`.
2. Cover the baseline contract: **smoke render**, **props/setters reflected in the DOM**,
   **deprecated aliases (§7)** if any, **event handlers**, and the **a11y baseline**.
3. Optionally add a `@visual` screenshot (`pnpm run test:e2e:visual:update` to create the
   baseline, then commit it).

Importing `test`/`expect` from the harness also gives your spec full IntelliSense for `mount` and
its helpers (the types are declared centrally in the harness) — no per-file typing needed.

The full guide, the `mount` API, and the gotchas are in
**[`playwright/README.md`](./playwright/README.md)**.

**Service components** (e.g. `FetchManager`, `LocalStorageManager`) are **not** Web Components, so
they are **not** mounted with the Playwright harness. Test their logic with `node:test` in a
`*.test.js` file (run by `pnpm test`), mocking browser/storage APIs as needed.

> The two test runners are kept separate by file suffix: **`*.spec.js` = Playwright (components)**,
> **`*.test.js` = node:test (logic / parser / services)**. Don't mix them.

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
pnpm run docs:lint-md
```

### 6) Generate docs artifacts
```bash
pnpm run docs:generate
```

This updates:
- `src/Components/DocumentationPages/...`
- `src/Components/AppComponents/ComponentsPage/docsIndex.js`
- `src/Components/AppComponents/ComponentsPage/documentationRoutes.generated.js`
- `src/Components/components.js`
- `src/Styles/DocumentationBase.css`

### 7) Run parser tests
```bash
pnpm test                              # runs the whole node:test suite (parser + routes)
# or a single file: node --test parser/tests/index.test.js
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

## Before opening a PR

Run the same gates CI runs:

```bash
pnpm test                                          # node:test: parser + routes (+ services)
pnpm run test:e2e                                  # Playwright: component render + behaviour + a11y
pnpm run docs:lint-md && pnpm run docs:generate    # only if you touched docs/markdown
```

Then confirm:
- [ ] New/changed component follows [`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md) §13.
- [ ] A `<Component>.spec.js` was added/updated and `pnpm run test:e2e` is green.
- [ ] No public prop was renamed or removed without a backward-compatible alias (§7).
- [ ] Docs page added/updated and generated outputs committed (when applicable).
- [ ] The PR template checklist is complete.

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
