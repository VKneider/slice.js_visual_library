# SEO — what we changed and why

Status: **done** (2026-10-26). This file records the audit, every change we made, the evidence for
each one, the traps we hit, and what is still open. It is the companion of `AGENTS.md` §4b (the
short version for agents); this one is the long one, with numbers.

Scope: `components.slicejs.com` — a Slice.js SPA (`src/`) served by `api/index.js`, with the
documentation generated from `src/markdown/` by `parser/`.

---

## 1. What was wrong

Measured against the production build (`pnpm start`, mode `production`, serving `dist/`), not
against assumptions:

| # | Problem | Evidence |
|---|---|---|
| 1 | **Canonical pointed at the home everywhere** | `/docs/input/button` returned `rel=canonical` → `https://components.slicejs.com`. Every page told Google "I am a copy of the home page" |
| 2 | **Soft 404** | `/docs/xyz/nope`, `/does-not-exist`, `/docs/utilities/mini-inspector` all answered **HTTP 200** with the same shell; the docs shell mounted and the article area stayed empty |
| 3 | **Sitemap maintained by hand and rotten** | 42 URLs vs 65 real doc routes → **25 pages missing**, 1 dead URL (`/docs/utilities/mini-inspector`; the page is `/docs/developer/mini-inspector`), no `<lastmod>` |
| 4 | **Same `<title>`, description and `og:*` on all 71 pages** | The raw HTML of any route was the 3.4 KB shell with the home metadata; `document.title` was only fixed client-side |
| 5 | **JSON-LD static** | One `WebSite` + a 2-item `BreadcrumbList` on every page, so the breadcrumb was wrong on deep pages |
| 6 | **H1 contained the "copy page" button** | The heading read "Button Copy page as markdown" to a screen reader (and the glyph rendered as tofu) |
| 7 | **Links inside table cells were plain text** | `[Avatar](/docs/display/avatar)` in a markdown table rendered literally; an escaped pipe (`number \| { … }`) split the row and dropped the description column |
| 8 | **Bundles went out with `no-store`** | `/bundles/*.js?v=<hash>` (3.1 MB raw / **486 KB brotli** for `shared-core` alone) were re-downloaded on every visit |

Points 1–7 are fixed. Point 8 is open (see §6).

---

## 2. The generator: `parser/lib/seo.js`

Both crawler-facing files are now **output of the docs pipeline**, from the same front matter the
pages are generated from, because the hand-maintained sitemap had already drifted once.

```
pnpm run docs:generate      # runs parser/index.js
  ├─ …markdown → DocumentationPages/*
  └─ writeSeoArtifacts()
       ├─ src/public/seo-manifest.json
       └─ src/public/sitemap.xml
```

### `src/public/seo-manifest.json`

One entry per route: `title`, `description`, `section`, `group`, `lastmod`, `indexable`,
`priority`, `changefreq`.

- **71 routes today**: 65 docs pages + `/` + `/docs` + `/theme-creator` (indexable) and `/__test`,
  `/playground`, `/game`, `/404` (`indexable: false` + `noindex: true`).
- `/` takes its title and description **from `src/App/index.html`**, so the home page has one source
  of truth instead of two.
- **Deterministic**: keys sorted, no `generatedAt`. `writeFileIfChanged` therefore writes nothing
  when nothing changed, and the CI auto-commit stays quiet.

### `src/public/sitemap.xml`

- Only routes that answer a `200` as a real page: the docs routes + `/` + `/docs` +
  `/theme-creator`. Section hubs (`/docs/input`) are **not** pages and are not listed.
- 67 URLs today, **64 with `<lastmod>`**; the other 3 (static routes) have no commit date.
- `<lastmod>` is the **last commit date of the markdown file** (`git log --format=@@%cs --name-only
  -- src/markdown`), not its mtime: a fresh clone resets mtimes to "today", which would rewrite the
  sitemap on every CI run. CI checks out with `fetch-depth: 0`, so the history is there. When there
  is no git (a tarball), the file is still valid, just without `lastmod`.
- Sorted by URL, escaped with `&amp;`/`&lt;`/`&gt;`/`&quot;`/`&apos;`.

### The drift guard: `parser/tests/seo.test.js`

13 tests. The two that matter:

- the committed sitemap must match `docRoutes.generated.js` **exactly** (no missing page, no dead
  URL, no duplicate), and every `<loc>` must have a manifest entry with `indexable: true` and a
  unique title;
- the manifest must describe hidden routes as non-indexable.

Verified against the previous sitemap: the test fails with exactly the 25 missing pages listed.

---

## 3. The server: `api/index.js`

### 3.1 One read, then prerender (no per-request work)

At startup:

1. `loadSeoManifest()` reads `public/seo-manifest.json` and `App/index.html` once.
2. `buildRoutePages()` renders **every route** through `injectMeta()`, then compresses each result
   once:

   ```
   routePages: Map<path, { html: Buffer, gzip: Buffer, br: Buffer }>
   shellPage:  the same, for the shell
   ```

   Cost: **~200 ms** and **~340 KB** of memory for the whole site.

A request is then a `Map.get`, an `Accept-Encoding` check and `res.end(bytes)`.
`Content-Encoding` is set, which is also how the `compression` middleware is told to leave the
response alone (it only transforms what is not encoded yet); `Vary: Accept-Encoding` is explicit.

Measured on localhost with keep-alive, 500 requests per run, three runs: `/docs/input/button` went
from a **1.54 ms** median to **1.21–1.24 ms** (~20 %). Payload for a docs page: **775 B brotli** vs
2.7 KB raw.

### 3.2 What `injectMeta()` replaces

For a known route: `<title>`, `meta[name=description]`, `link[rel=canonical]`, `og:title`,
`og:description`, `og:url`, `twitter:title`, `twitter:description`, `meta[name=robots]`, and the
JSON-LD (all previous blocks are dropped, then this page's are inserted before `</head>`).

JSON-LD per route:

| Route | Blocks |
|---|---|
| `/` | `WebSite` |
| `/docs/...` | `TechArticle` + `BreadcrumbList` (Home → Components Library → section → page) |
| statics | `WebSite` |

Canonical is `https://components.slicejs.com` + the path, so each page is its own URL.

### 3.3 Unknown paths: a real 404, the same shell

```js
const page = routePages.get(pathname);
if (!page) return sendPage(req, res, shellPage, 404);
```

The body is the shell on purpose: the client router renders `NotFound`, so the server only has to
say "this is gone". No fake title, no fabricated canonical. Internal routes (`/__test`,
`/playground`, `/game`) answer `200` + `noindex`, so they are reachable but never indexed.

### 3.4 Two server details that bit us

- **Development serves components unbundled**, so the framework fetches `<Component>.html` over
  HTTP; a JS-only component (`Link`, `MultiRoute`) has no template file. Those requests keep
  receiving the shell in `development`; a 404 there makes `slice.build` return `null` and the page
  dies. The production build inlines templates, so it never asks.
- **`dist/` root artifacts** (`slice-events.generated.js`, `ComponentLibrary.js`) needed
  `express.static(dist)` in production. Before, the SPA fallback answered a `<script>` with
  `index.html`.

### 3.5 Social cards (`og:image`) — `scripts/og/`

Every indexable route gets its own 1200×630 card. This is the one asset that cannot be produced
at request time (a crawler hitting every route would turn into CPU load), so it is generated ahead
of time and committed.

```
pnpm run og:generate      # scripts/og/generate.mjs — needs a browser, ~40 s for 70 routes
pnpm run og:check         # manifest ↔ routes ↔ files, no browser; runs in `test:gate`
```

**Pipeline, per route:** boot the app server on a free port (`PORT=<free>`, dev mode, so the
source is what gets captured), open the real page with a pinned context — `deviceScaleFactor: 2`,
`colorScheme: 'light'`, `reducedMotion: 'reduce'`, `locale: 'en-US'`, `timezoneId: 'UTC'`,
`page.clock.setFixedTime()` — wait for `.documentation-content` and then for the `:::script`
`DemoBox` to fill (`.demobox-preview`), screenshot **that element**, trim 1 CSS px off every edge,
then compose the card in Chromium and write `src/public/og/<slug>-<hash>.png`.

- **Demo vs page.** A route with a demo → `kind: demo`, PNG (flat UI + text stays crisp, 17–55 KB).
  A route without one (`/`, `/docs`, guides, `/theme-creator`) → `kind: page`, a 1200×630 slice of
  the page, JPEG q86 (gradients and photos are 3× heavier as PNG for no gain).
  A demo that throws still produces a card: the generator warns and falls back to the page slice.
- **Hash in the filename.** Platforms cache a preview *per URL* for weeks, so the image URL has to
  change when the image changes. The hash is over the final bytes, which also means "nothing
  changed" is "no diff" — running it on every deploy only writes what actually moved.
- **Failure is not destructive.** If a route fails, the manifest and the images are left untouched
  (`og:check` would otherwise report the route as *gone* instead of *broken*).
- **Orphans are deleted**, so the folder cannot grow with every design tweak.
- **Budget:** 120 KB per image (enforced by `og:check`). Today: 70 routes, **2.8 MB total**,
  average 40 KB, max 86 KB.

**Selection at runtime.** `api/index.js` reads `public/og/manifest.json` once at startup (separate
from `seo-manifest.json` on purpose: the parser owns that one and rewrites it on every
`docs:generate`). `injectMeta()` replaces `og:image`, `og:image:width/height/type/alt` and
`twitter:image` with the absolute URL for the route; routes without an entry — everything
`noindex`, the 404 shell — keep the generic `images/og-image.png` banner that ships in
`App/index.html` (1893×932, declared with its real size so crawlers reserve the right box).

**Traps, all of them measured:**

- Element screenshots round outward at fractional coordinates: the capture picked up ~1 device px
  of the `DemoBox` border above and on the left, which painted a purple hairline across the top of
  every card. Fixed by trimming 1 CSS px in the page's own canvas (no image library needed).
- Demos that print `new Date()` made the hash change on every run. `page.clock.setFixedTime()`
  freezes `Date` without freezing timers, so async demos still build.
- `/docs` changed pixels under 4 concurrent pages: the shell mounts in stages and a fixed delay
  caught it mid-build. `waitForStableDom()` polls until the DOM size stops changing — it is used
  inside demos too, because `query-service` waits 400 ms for a pretend server and a fixed 200 ms
  delay captured a different loading frame on every run.
- Two demos are genuinely broken (they throw in the console): `mini-inspector` asserts
  "Expected 3 editable rows, got 0" and `breadcrumbs` passes a non-Node to `appendChild`. They get
  the page-slice fallback and a warning; the fix belongs to those pages, not to this script.
- The card is composed from the site's own font stack (`Source Sans 3` → system fallback), which
  is not bundled. Images are therefore byte-stable on one machine, not across OSes — generate
  locally and commit; let CI run `og:check`, not `og:generate`.

---

## 4. Routing: `routes.js` lists every page

`parser/lib/routesSync.js` used to emit three wildcards:

```js
{ path: '/docs/${section}', component: 'App' },
{ path: '/docs/${section}/${page}', component: 'App' },
{ path: '/docs/${section}/${page}/${detail}', component: 'App' },
```

Which meant a `/docs/xyz/nope` **matched** and mounted the App shell: the Router had a route, only
the inner `MultiRoute` found nothing, and the visitor got the docs layout with an empty article.

Now the generator writes **one entry per real page** (from the docs index) and keeps only `/docs`.
A `/docs` path that is not a page matches nothing, so the Router's own fallback (`matchRoute` →
the `/404` route) renders `NotFound` on its own — exactly what already happened for `/nope`.

`parser/tests/routes-sync.test.js` asserts the explicit entries and that **no** `/docs/${...}`
pattern comes back.

### The `MultiRoute` fallback trap

`MultiRoute` accepts `fallback: '<Component>'` (opt-in; without it the slot clears, as always).
**Never pass it in the App shell.** That container is updated on *every* route change
(`App.update` → `renderIfCurrentRoute`); with a fallback it builds `NotFound` the moment the user
leaves the docs area, which also rewrites `document.title`. That is exactly how Theme Creator
started answering 404 when you arrived from a docs page. It is the right tool for a container that
*is* the whole view.

---

## 5. Content and structure fixes

| What | Where | Detail |
|---|---|---|
| Copy button out of the `<h1>` | `parser/lib/markdownParser.js`, `parser/templates/DocumentationBase.css` | The heading now carries only the title. The border and padding moved to `.doc-title-bar`, the `h1` became `inline-block`, and the gap the button had inside the heading is restored with `margin-right: 0.15em` on the `h1`. Measured before/after at 1280 px: bar 800×60 at (260,164), title 105.5×43 at (585.7,162), button 34×34 at (700.3,173) — identical to the pixel. Same at 420 px, no overflow. |
| Copy button icon | `parser/templates/CopyMarkdownMenu/*` | It was the text glyph `❐` (U+2750), which is not in the bundled fonts, so it rendered as tofu; the "copied" state was `✓` with the same problem. It is now `Button`'s `icon`: `clipboard` while idle, `check` after copying (`copy` is not one of the shipped icon names and would render an empty `<svg>`). The label is the accessible name: "Copy as markdown" → "Copied". |
| Anchor links land below the fixed navbar | `DocumentationBase.css` | `.documentation-content :is(h1,h2,h3,h4)[id] { scroll-margin-top: calc(var(--docs-navbar-height, 72px) + 16px) }` |
| Internal links inside table cells | `parser/lib/markdownParser.js` | `tokenizeInternalLinks()` is shared by the text and by table rows, so `[Avatar](/docs/display/avatar)` inside a table becomes a real `Link` instead of literal markdown. |
| Escaped pipes in table cells | `parser/lib/generator.js` | A cell with `number \| { attempts, … }` was split on that pipe and every later column was dropped (the fetch-manager props table lost its `retry` description; three other pages too). The splitter treats `\|` as a character inside the cell. |
| `Link` with `#section` | `src/Components/Visual/Link/Link.js` | The router gets the page, then the section is scrolled into view; a malformed hash (`#100%`) is used as written instead of throwing inside the frame callback. |
| Client titles | `src/Components/AppComponents/App/App.js` | The client's title map only knew the docs routes, so navigating to `/theme-creator`, `/playground` or `/game` replaced the server's title with a bare `Slice.js`. They are in the map now; the manifest stays the source of truth. |

---

## 6. Still open

These are measured, not guesses. They are the next levers for the docs page.

| Item | Numbers | Effort |
|---|---|---|
| **Cache the bundles** (`Cache-Control: public, max-age=31536000, immutable` for `/bundles/*`, since they carry `?v=<hash>`; `max-age=86400, stale-while-revalidate=604800` for `/images|Styles|Themes`) | Everything goes out with `no-store` today: a docs page re-downloads **~700 KB of JS** per visit (`shared-core` 486 KB br + vendor 163 KB br + framework 27 KB + critical 21 KB) | ~10 lines in `api/index.js` |
| **Take the markdown out of the bundle** | `this.markdownContent` is **664 KB** of prose across 65 pages (avg 10.2 KB, max 39.6 KB), embedded only for the copy button; `scriptScenarios` are another **344 KB**. The build does not copy `src/markdown` to `dist` yet | Parser + `CopyMarkdownMenu` fetch on click + copy the `.md` in the build |
| **Split `shared-core`** | It is **3.1 MB raw / 486 KB br** and holds all 65 doc pages, because every docs route points at `App` and its children. A docs page downloads all of them | Needs the doc components to resolve through dynamic imports (framework-level) |
| **Prerender the articles** | The whole content is client-rendered; a crawler that does not run JS sees the shell. Prerendering each `/docs/*` into its own HTML is the only real fix for first paint | Big: content HTML at build time + hydration |
| **Trim descriptions** | 20 of 71 descriptions are over 160 characters | Small, when injecting or in the front matter |

---

## 7. Working on it

```bash
pnpm run docs:generate     # pages, routes, sitemap, manifest
pnpm run docs:lint-md      # markdown contract only
pnpm run og:generate       # social cards (needs a browser; run after docs:generate)
pnpm run og:check          # cards ↔ routes ↔ files, no browser
pnpm test                  # node tests, includes parser/tests/seo.test.js and routes-sync.test.js
pnpm exec playwright test tests/seo.spec.js --project=server-chrome   # @server, needs a server
pnpm run build             # production bundle; run it before calling a change done
```

The `@server` suite runs against the dev server by default. To point it at a production server on
8080: `SLICE_TEST_PORT=8080 pnpm exec playwright test tests/seo.spec.js --project=server-chrome`.

### Files

```
parser/lib/seo.js                                   manifest + sitemap + git lastmod
parser/lib/routesSync.js                            routes.js (explicit pages, no wildcards)
parser/lib/markdownParser.js                        h1/title bar, internal links in tables
parser/lib/generator.js                             table cells (links, escaped pipes)
parser/tests/seo.test.js                            drift guard (sitemap ↔ routes)
parser/tests/routes-sync.test.js                    no /docs/${...} wildcards
parser/tests/index.test.js                          title bar, table links
api/index.js                                        prerender, injectMeta, 404, compression
scripts/og/generate.mjs                             social cards: capture, compose, manifest, --check
scripts/og/card.mjs                                 the 1200×630 card (HTML + CSS, pure)
src/public/og/                                      generated: one card per indexable route
src/public/og/manifest.json                         generated: route → { path, width, height, type }
src/public/seo-manifest.json                        generated
src/public/sitemap.xml                              generated
src/App/index.html                                  home metadata (source of truth for /)
src/Components/AppComponents/App/App.js             client title map
src/Components/AppComponents/ComponentsPage/…       docs shell (no MultiRoute fallback)
src/Components/Visual/MultiRoute/MultiRoute.js      opt-in fallback + scroll behaviour
src/Components/Visual/Link/Link.js                  #section handling
tests/seo.spec.js                                   @server: meta, 404, sitemap
tests/docs-tables.spec.js                           @server: table columns survive
```

### Traps, for whoever touches this next

- The shell writes its tags **XHTML-style** (`<meta … />`). Every replacement pattern must consume
  the self-closing slash, or the leftover ` />` lands in the document as text and breaks the whole
  `<head>`.
- `generator.js` emits code **inside a template string**, so every backslash has to be doubled. A
  first attempt at the escaped-pipe split shipped `/(?<!\\)|/` (one backslash lost) and killed the
  router with an invalid regular expression. When in doubt there, avoid regex.
- The compression middleware skips a response that already has `Content-Encoding`. Precompressed
  buffers are safe; setting the header on an uncompressed body would corrupt it.
- `Slice's` client `document.title` overwrites whatever the server sent. Any new top-level route
  needs an entry in `App._titleByRoute`, or its title degrades to `Slice.js` after navigation.
- `parser/index.js` runs on every `docs:generate` and can reorder `src/Components/components.js` and
  rewrite some generated files with different line endings. Check `git diff` before committing and
  drop pure-formatting churn.
