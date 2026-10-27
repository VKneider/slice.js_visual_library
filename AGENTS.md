# AGENTS.md

## Scope
This document explains what is already implemented in `slicejs-components` and the operating pattern for future agents adding documentation pages from markdown.

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
- SEO artifacts from the same front matter (never hand-edited):
  - `src/public/sitemap.xml` — only real routes (`docsIndex` + `/` + `/docs` + `/theme-creator`), with
    `<lastmod>` taken from the markdown file's **last commit date** (`git log`, not mtime — mtimes
    reset on clone and would churn CI).
  - `src/public/seo-manifest.json` — per-route `title`, `description`, `section`, `lastmod`,
    `indexable` (internal routes carry `indexable: false` + `noindex`). Deterministic output
    (sorted keys, no timestamps) so `writeFileIfChanged` stays quiet.
  - `parser/tests/seo.test.js` is the drift guard: it fails if the committed sitemap stops matching
    `docRoutes.generated.js`, or if a sitemap URL has no manifest entry. Adding a markdown page and
    not running `docs:generate` breaks it on purpose.

### 4) Route namespace
- Documentation namespace is `/docs` (not `/library`).
- Current top-level routes are defined in `src/routes.js` and map docs paths to `ComponentsPage` (app shell pattern).

### 4b) Request-time metadata (server, not SSR)
`api/index.js` reads `seo-manifest.json` + `App/index.html` **once at startup** and answers the SPA
fallback itself:

- Known route → `200` with that route's `<title>`, `description`, `canonical`, `og:*`, `twitter:*`,
  `robots` and JSON-LD (`WebSite` on `/`, `TechArticle` + real `BreadcrumbList` on docs pages).
- Unknown route → `404` with the **same shell body**: the client router already renders `NotFound`,
  so the server only has to say “this is gone”. No fake title/canonical is injected.
- `routes.js` lists every real documentation page explicitly (from the docs index), instead of the
  old `/docs/${section}/${page}` patterns. That is what makes a typo reach the Router's own
  fallback (`matchRoute` → the `/404` route → `NotFound`) instead of mounting the docs shell around
  an empty page. `MultiRoute`'s `fallback` prop is opt-in for a container that is the whole view;
  **never** pass it in the App shell — that container is updated on every route change, so it would
  build NotFound the moment the user leaves the docs (that is exactly how Theme Creator started
  answering 404).
- Internal routes (`/__test`, `/playground`, `/game`) → `200` + `noindex`.

No rendering happens on the server: the same shell bytes go out, only the `<head>` differs, and the
client SPA still mounts everything. Each page is rendered **once at startup**
(`buildRoutePages()` → `routePages`: final HTML + gzip + brotli per route, ~340 KB for the whole
site), so a request is a `Map` lookup and one `res.end`; `Content-Encoding` is set from
`Accept-Encoding`, which also tells the compression middleware to leave it alone. Two traps this
already hit:

- The shell writes tags XHTML-style (`<meta … />`), so every replace pattern must consume the
  self-closing slash — otherwise the leftover ` />` lands in the document as text and breaks `<head>`.
- Development serves components unbundled and fetches `<Component>.html` over HTTP, and JS-only
  components (Link, MultiRoute…) have no template file. Those requests keep getting the shell in
  `development`; a 404 there makes `slice.build` return `null` and the page dies.
- `dist/` root files (`slice-events.generated.js`, `ComponentLibrary.js`) need the root static mount
  in production, or the fallback answers a `<script>` with HTML.

`tests/seo.spec.js` (`@server`) covers all of it: per-route meta, real 404, `noindex`, every sitemap
URL answering 200 with its own canonical, and every script the shell references resolving to JS.

### 4c) Social cards (`og:image`) — generated, never per request
Every indexable route ships its own 1200×630 card in `src/public/og/`, selected by `api/index.js`
from `src/public/og/manifest.json` (a separate file because the parser owns `seo-manifest.json`
and rewrites it on every `docs:generate`).

- `pnpm run og:generate` (`scripts/og/generate.mjs`) boots the app server, screenshots the real
  `:::script` demo (`.demobox-preview`) at DSF 2 on a pinned light-theme context, composes the card
  in Chromium and writes `<slug>-<contentHash>.png`. Routes without a demo get a page slice.
- **Never hand-edit `src/public/og/`.** It is output, exactly like the sitemap.
- The hash is in the filename because platforms cache previews per URL; it is over the final bytes,
  so an unchanged route produces no diff. A failed route leaves the manifest untouched.
- `pnpm run og:check` (in `test:gate`) is the drift guard: every indexable route has an entry, the
  file exists, is 1200×630, under the 120 KB budget, and no orphan PNG/JPEG is left behind.
- Run `og:generate` after `docs:generate` and before `build` (the build copies `src/public/og` to
  `dist/public/og`). Regenerate locally and commit: the card uses the site's font stack, which is
  not bundled, so bytes are stable per machine — CI runs `og:check`, not `og:generate`.
- Broken demos degrade to a page slice with a warning instead of blocking a deploy. `mini-inspector`
  and `breadcrumbs` are in that state today (their scenarios throw); fix those pages, then rerun.

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

The crawler-facing side (sitemap, manifest, per-route metadata, 404s) is documented end to end,
with the numbers behind each decision, in **[`SEO.md`](SEO.md)**.

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
- Run `pnpm run test:gate` — node tests, then e2e, then the production build. All three must pass.
- File-suffix contract: **`*.spec.js` = Playwright**, **`*.test.js` = node:test** — never overlap.
- Full guide + `mount` API: **`playwright/README.md`**. Reference test: `src/Components/Visual/Button/Button.spec.js`.
- Use **pnpm** for everything (never npm). The browser binary is installed once with
  `pnpm exec playwright install chromium`.
- **E2e destroy lifecycle tests** in `src/Components/Visual/Destroy.spec.js` (20 tests) cover
  `destroyComponent`, `destroyByContainer`, and `destroyByPattern` against the real `activeComponents`.
  These are the browser e2e counterpart of the unit tests in `slice.js/Slice/tests/destroy-cascade.test.js`.
- The framework repo (`slice.js`) only has node:unit tests. Any test that requires a real DOM
  (events, visual rendering, destroy with `querySelectorAll`) must be written here in the visual library.
- **Two harness traps when writing a spec:**
  - A function prop cannot be passed through `props` — it does not survive `JSON.stringify` into the
    page. List it in `{ spies: [...] }`, which *injects* the function as that prop. Do not also put it
    in `props`; the fixture overwrites it and the assertion reads as "prop was ignored".
  - `File`/`Blob`/`DataTransfer` cannot cross `evaluate()` or `dispatchEvent`'s init object. Build
    them **inside** the page (`locator.evaluate(el => { const dt = new DataTransfer(); ... })`).
- `tests/leak-cleanup.spec.js` (the `Card.setupActions` case) is **known-flaky under parallel load**
  and already carries `retries: 2`. It is not caused by your change unless you touched `Card`.

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

### Never name internal state `_x` when `x` is a declared prop
`setComponentProps` does `this['_' + prop] = null` **for every declared prop, canonical or deprecated alias**, before applying the setter. A component whose private flag happens to be named after a prop is silently nulled at build time.

This bit `Loading`: its state field was `_isActive`, which is exactly the backing field derived from the deprecated `isActive` alias, so `get active()` returned `null` instead of `false`. The field is now `_running`. **Rule:** internal state goes on a name no declared prop can derive (`_running`, `_mounted`, …), never `_<propName>`.

### Synthetic pointer/touch events do no actionability check
`page.mouse.*` and `evaluate` + `dispatchEvent` skip Playwright's actionability wait, so a startup overlay can swallow the dispatch (`elementFromPoint` hits the overlay, not your node). Drag-touch specs drive the gesture with `pointerType: 'touch'` PointerEvents plus TouchEvents; `Touch`/`TouchEvent` constructors exist in Chromium but **not** in Firefox/WebKit, so touch specs are Chromium-only.

### Icon renders inline SVG, and its data is GENERATED
`Icon` draws Lucide glyphs as inline `<svg>` (no icon font) plus the original sprite outlines for the brand/language/Slice marks Lucide does not ship. All 291 pre-migration names still resolve.

- `src/Components/Visual/Icon/icons.generated.js` is **generated — never hand-edit**. Regenerate with `pnpm run icons:generate` after bumping the pinned `lucide` devDependency.
- `scripts/icon-legacy-map.mjs` holds `LEGACY_NAMES` (the public API), `ICON_ALIASES` (old name -> Lucide name) and `ICON_LEGACY_PATHS` (names that keep the original artwork). The generator **fails loudly** on an unmapped or misspelled name.
- `pnpm run icons:audit` is the guard: it diffs `LEGACY_NAMES` against the previous version via git and fails if a public name disappeared. Run it whenever you touch those tables.
- The 240 KB source sprite lives in `scripts/icon-sprite.source.svg`, **not** in the component folder, so `slice get Icon` does not ship it.
- `src/markdown/icon.md`'s name table is generated too (`scripts/generate-icon-table.mjs`); edit the generator, not the table.

### A component module must have exactly ONE export
The production bundler inlines a component's relative imports but keeps their `export` statements,
which Terser then rejects with **"Export statement may only appear at the top level"**. A named
re-export in a `<Component>.js` (even alongside the default) breaks `pnpm run build` while the dev
server keeps working — so **always run `pnpm run build` before calling a change done**, the test
suite alone will not catch it. `scripts/icon-verify.mjs` also imports the generated module directly.

### Setters run in the constructor, so they must not build children before `init()`
`setComponentProps` applies every prop in the **constructor**, so each setter fires while the element
is still disconnected and `init()` has not run. A setter that calls `slice.build` therefore builds an
orphan, and then `init()` builds the real one — two children where there should be one, with only the
second tracked in `childrenIndex` (so the first leaks).

The pattern that avoids it:

```js
async _renderIcon() {
  if (!this._inited) return;   // init() will render; the setter only records
  this._destroyIcon();
  ...
}
async init() { this._inited = true; await this._renderIcon(); }
```

This is the same class of bug as `_isActive` above: the framework's lifecycle is not the plain-DOM
one, so the obvious implementation is wrong in a way that only shows up as a count mismatch.

### Bare npm imports: only `HtmlService`, and the CLI will not install it for you
Every component here is dependency-free except `HtmlService`, which imports `dompurify`. That is
deliberate — a registry component that needs `pnpm add` before it loads is a bad experience, so it
is worth exactly one component, the one where hand-rolling the alternative would be far worse.

`slice get` **does not** auto-install bare imports. `getComponent.js` detects them and prints
`↳ npm package required: "dompurify" — install it in your project`, then moves on. So the warning
is the whole UX: state the dependency at the top of the component file and in its markdown page.

The bundler resolves bare imports fine — `pnpm run build` prints `✓ dompurify` — and a spec can
import one directly (see `ExternalDepsProbe`). What does **not** work is a *dynamic*
`import('dompurify')` inside `page.evaluate`: bare specifiers are resolved at bundle time, not at
runtime in the page, so it fails with "Failed to resolve module specifier".

### `<dialog>`'s `close` event is dispatched in a QUEUED TASK, not synchronously
`<dialog>.close()` returns **before** the `close` event fires. Verified in Chromium:

```
before close()
after close()      <-- "close event fired" is NOT here
close event fired  <-- one task later
```

This breaks any code that assumes "I closed it, so it is closed". `ConfirmDialog` hit all three
variants of it:

- **Reopen race.** Closing an old dialog and immediately opening a new one lets the *stale* close
  event land on the new question and cancel it a moment after the user opened it. Fix: await the
  real close before opening — `await new Promise(r => dlg.addEventListener('close', r, {once:true}))`
  — and read the **native** `dialog.open`, not the wrapper's cached `_open`, to decide whether a
  close is even pending.
- **Settle order.** `Modal.close()` fires `onClose` synchronously on the way out, so
  `_settle(value)` must come **before** `open = false` or every confirmation resolves as a
  cancellation.
- **Stale cached flags.** `Modal._open` is only corrected when its own handler runs, so it can
  disagree with the DOM for a task. Never use it as the source of truth for "is it open?".

The general lesson: any component that must settle exactly once (a promise, a callback) cannot use
a DOM close event as its only exit path — it needs an explicit guard, because the event is async.

### DOMPurify hooks and config are global to the module instance
`addHook` / `setConfig` affect every sanitize call from that import, forever. Conclave's original
`HtmlService` installed its link-hardening hook lazily on the first `sanitizeRichText()` call, which
meant two bugs at once: `sanitize()` behaved differently depending on call order, and it forced
`target="_blank"` onto the app's own in-app links (breaking SPA navigation).

The fix here is a per-call flag flipped inside a `try/finally` around the synchronous
`DOMPurify.sanitize()`. The `finally` is not decoration — a leaked flag makes every later
`sanitize()` rewrite its links. Getting DOMPurify to throw *inside* `sanitize()` is impossible (it
tolerates non-array, numeric and null `ALLOWED_TAGS`); the `String(html)` coercion is what throws,
so the spec drives it with a Proxy that throws on `Symbol.toPrimitive`.


