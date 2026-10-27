---
id: "0001"
title: "Per-route OG images for the components docs"
repo: "slicejs-components"
status: done
area: components
priority: medium
created: 2026-10-27
updated: 2026-10-27
target: "TBD"
owners: []
related:
  - "scripts/og/generate.mjs"
  - "scripts/og/card.mjs"
  - "src/public/og/manifest.json"
  - "api/index.js"
  - "tests/seo.spec.js"
  - "SEO.md"
  - "AGENTS.md"
---

# Per-route OG images for the components docs

## Summary

Every indexable documentation route now has its own 1200×630 social card instead of the single
`images/og-image.png` banner, so a shared `/docs/input/button` link shows the Button demo. The card
is a **screenshot of the real demo on the real page**, composed into a fixed frame and produced
ahead of time by a build script.

## Problem / motivation

- `src/App/index.html` hardcoded one `og:image` for all routes. `injectMeta()` rewrote
  title/description/canonical/`og:url` per route but not the image, so every shared link looked
  identical.
- The banner is off-spec: 1893×932 is 2.03:1, while platforms crop to 1.91:1 (some render 1:1), so
  real content got cut.
- A component library is a visual product; the preview is the cheapest place to show the component.

## Direction (as built)

`scripts/og/generate.mjs` boots the app server on a free port (dev mode, so the source is what gets
captured) and, per route:

1. Opens the page in a pinned context: viewport 1440×960, `deviceScaleFactor: 2`,
   `colorScheme: 'light'`, `reducedMotion: 'reduce'`, `locale: 'en-US'`, `timezoneId: 'UTC'`,
   `page.clock.setFixedTime()`.
2. Waits for `.documentation-content`, then for the `:::script` `DemoBox` to fill
   (`.demobox-preview`); a throw in the scenario is reported and degrades to a page slice.
3. Screenshots **that element**, then trims 1 CSS px off every edge (the element clip rounds
   outward and grabs the neighbouring border).
4. Composes the card in Chromium (`scripts/og/card.mjs`, pure HTML/CSS) and writes
   `src/public/og/<slug>-<contentHash>.<ext>`, then rewrites `src/public/og/manifest.json` and
   deletes orphaned images.

Two kinds of card, because the content differs:

| kind | used for | source | format |
|---|---|---|---|
| `demo` | any route with a `:::script` preview (68) | the demo area at 2× | PNG — flat UI + text stays crisp |
| `page` | `/`, `/docs`, guides, `/theme-creator` (2) | a 1200×630 slice of the page | JPEG q86 — gradients/photos are 3× heavier as PNG |

Real numbers: **70 routes, 2.8 MB, average 40 KB, max 86 KB**, ~40 s for a full regeneration,
budget 120 KB enforced by `og:check`.

### Caching

The hash is over the **final bytes** and lives in the filename, because platforms cache a preview
per URL for weeks. Rewriting the same image therefore costs nothing (same hash → same name → no
write), and an unchanged route produces no diff. Capture always re-renders; only the write is
skipped.

### Server

`api/index.js` reads `public/og/manifest.json` once at startup (separate from `seo-manifest.json`,
which the docs parser owns) and `injectMeta()` replaces `og:image`, `og:image:width/height/type/alt`
and `twitter:image` with the absolute URL. Routes without an entry (`noindex`, the 404 shell) keep
the generic banner, now with its real 1893×932 declared in the shell.

## Alternatives considered

- **Text-only card** (name + description + logo, no browser): deterministic and cheap, but it does
  not show the product. Rejected in favour of the real demo capture.
- **Whole-viewport screenshot as the card**: the component occupies a fraction of the frame and the
  text is unreadable at feed width. The demo area keeps the "real page" fidelity without the waste.
- **Generate on request** (`/og?path=…`): a crawler hitting every route becomes CPU load and a
  cheap DoS vector.
- **`sharp` for composition**: avoided — a new dependency for cropping and re-encoding only. The
  browser that already produced the capture does both (canvas trim, screenshot encoding).

## Scope

### In scope

- `scripts/og/generate.mjs` + `scripts/og/card.mjs`, `src/public/og/` output, `og/manifest.json`.
- `api/index.js` injection + shell tags + `escapeHtml()` fix (it was replacing every entity with
  itself, so a title with `&` or `<` would have produced broken HTML).
- `tests/seo.spec.js`: hashed card per route, file actually served, no two components share one,
  every sitemap URL advertises an image that exists, `noindex` keeps the banner.
- `og:check` in `test:gate` (manifest ↔ routes ↔ files ↔ budget ↔ orphans), no browser.
- `SEO.md` §3.5 + `AGENTS.md` §4c.

### Out of scope

- Prerendering page content (open item in `SEO.md` §6).
- OG images for `slicejs.com`, `conclave.*` or the registry artifacts.
- Dark-mode variants (no platform support for switching previews).
- Fixing the two broken demos (`mini-inspector`, `breadcrumbs`).

## Compatibility and risk

- Public API impact: none (no component props or exports change).
- Existing apps affected: only `components.slicejs.com`.
- Migration: the old `og-image.png` stays as the fallback banner.
- Performance: build-time only; one immutable request per crawler hit, 17–86 KB.
- Repo weight: 2.8 MB of committed images, against 107 KB before. Accepted and culled by the orphan
  cleanup; `og:check` fails on anything over 120 KB.
- Determinism: pinned theme/locale/time/motion, and a DOM-stability poll (a fixed delay caught
  `/docs` mid-build under 4 concurrent pages). Card typography falls back to the OS font, so bytes
  are stable per machine — generate locally, let CI run `og:check`.

## Validation

- `pnpm run og:check` — 70 routes, 70 files, 2.8 MB, no orphans.
- `pnpm test` — 130 node tests.
- `pnpm exec playwright test tests/seo.spec.js --project=server-chrome` — 19 passed, including the
  5 new social-card tests.
- `pnpm run build` — passes; `dist/public/og` carries the cards and the production server injects
  the per-route image (verified against a `--production` boot).
- Three consecutive full regenerations: runs 2 and 3 report "Manifest unchanged, 0 orphans".
- Still manual, after deploy: Facebook / Twitter / LinkedIn debuggers (previews cannot be validated
  locally).

## Documentation impact

- Framework docs pages: none (the card is a site concern, not a framework feature).
- Component docs: no markdown change; `SEO.md` §3.5 documents the generator end to end.
- Skill / agent guidance: none — but `AGENTS.md` §4c tells agents the folder is generated output.
- Workspace docs: none.

## Open questions

- [x] Scope: all indexable routes, not only components.
- [x] Composition: a screenshot of what the page shows, with a title strip for legibility.
- [x] Clip target: `DemoBox` demo slot; page slice when there is no demo.
- [x] Several demos on one page: the first one.
- [x] Deployment: Node (`api/index.js`); the build copies `src/public/og` to `dist/public/og`.
- [x] Regenerate locally before a release; CI runs `og:check`.
- [ ] Do we want section-hub cards to differ from the page slice (`/docs/input`, `/docs/display`)?
      They are not pages today, so they share the parent route's card.

## Decision log

- 2026-10-27 - Created as `proposed`. No implementation.
- 2026-10-27 - Scope widened to all indexable routes; composition decided as a real page/demo
  screenshot rather than a synthetic text card, composed onto a 1200×630 frame with a title strip
  (a scaled-down raw screenshot is not readable at feed width).
- 2026-10-27 - Implemented. Formats split by content (demo → PNG, page → JPEG q86). Hash over the
  final bytes. A failed route leaves the manifest untouched instead of dropping the entry.
- 2026-10-27 - Determinism was the bulk of the work: pinned light theme, `locale`/`timezoneId`,
  `page.clock.setFixedTime` (timestamp demos), DOM-stability poll for page slices **and** demos
  (`/docs` raced under 4 workers; `query-service` was captured mid-load), 1 px edge trim (the
  element clip grabbed the neighbouring border).
- 2026-10-27 - Known gaps: `mini-inspector` and `breadcrumbs` demos throw and fall back to a page
  slice — docs bugs, surfaced by the generator, tracked above.
- 2026-10-27 - Both gaps closed. The root cause was one: JS-only Visual components (`DemoButton`,
  `DemoRouteHome`…) ship no `.css`, the dev fallback 404'd it, and `slice.build` returned `null`
  (hence "Expected 3 editable rows, got 0" and `appendChild` of `null`). `api/index.js` now answers
  an empty stylesheet for a component whose `.js` exists but whose `.css` does not, and the demo
  fixtures expose getters so the inspector shows current values. `tests/dev-resources.spec.js`
  guards both sides. Cards regenerated: `mini-inspector` and `breadcrumbs` are now `demo` (28.8 KB /
  25.8 KB), and `file-upload` / `unsaved-changes-guard` lost their null-build placeholder.

