---
id: "0002"
title: "Component: Skeleton"
repo: "slicejs-components"
status: proposed
area: components
priority: medium
created: 2026-10-28
updated: 2026-10-28
target: "TBD"
owners: []
related:
  - "src/Components/Visual/Loading/Loading.js"
  - "src/Components/Visual/Loading/Loading.css"
  - "src/markdown/loading.md"
  - "src/Components/Visual/Table/Table.js"
  - "COMPONENT_API_STANDARDS.md"
---

# Component: Skeleton

## Summary

A `Skeleton` shows the **shape** of content while it loads: a line of text, a paragraph, a rectangle, a circle or a table row. It replaces the centered spinner in places where the layout is already known, so the page does not jump when the data arrives.

## Problem / motivation

`Loading` covers "something is happening" with a spinner. That is the right answer when the shape is unknown, but it is the wrong answer for a table, a list, a card or a profile: the spinner replaces the content with one small mark, the container collapses, and the real content then moves everything around.

Apps already hand-roll grey blocks with a shimmer. The library has no shared grammar for that, so every app invents its own widths, colors, radius and animation, and usually forgets `prefers-reduced-motion`.

## Proposed direction

One visual component, composed into the shapes consumers need.

```js
const skeleton = await slice.build('Skeleton', {
  variant: 'text',      // 'text' | 'rect' | 'circle'
  lines: 3,             // text only; each line is a block
  width: '60%',         // CSS length; defaults to 100%
  height: 14,           // px or CSS length; defaults by variant
  animation: 'shimmer', // 'shimmer' | 'pulse' | 'none'
  label: 'Loading the order'
});
```

- `variant` picks the base shape. `text` uses the line height and a short last line; `rect` keeps the radius token; `circle` uses `aspect-ratio: 1`.
- `lines` repeats text lines with a narrower last line, for a paragraph preview.
- `width` and `height` accept CSS lengths. A numeric `height` is px.
- `animation` defaults to `shimmer`. `prefers-reduced-motion: reduce` forces `none` while keeping the blocks visible.
- `label` gives the group an accessible name. The blocks themselves are `aria-hidden`; the host is `role="status"` with `aria-busy="true"` when a label is present. Without a label it is purely decorative.
- Theme tokens for the base, highlight and radius; CSS variables (`--slice-skeleton-bg`, `--slice-skeleton-highlight`, `--slice-skeleton-radius`) for a local retint.

Composition examples to document:

- paragraph (`lines: 3`)
- card header + body (rect + text lines)
- table row (several rects in a row)
- avatar + name (circle + text)
- a `Skeleton` group with one label instead of one label per block.

## Alternatives considered

- **Add a `skeleton` variant to `Loading`.** Rejected: `Loading` is a busy indicator with its own semantics; a skeleton is a layout placeholder. One component with two unrelated jobs makes both harder to use.
- **Only document a CSS recipe.** Rejected: every app would still duplicate the markup, the reduced-motion rule and the accessibility contract.
- **Always render one block per line and let the consumer label each one.** Rejected: screen readers would announce the same busy state several times.

## Scope

### In scope

- `Skeleton` visual component with `text`, `rect` and `circle`.
- Paragraph lines and a group label.
- Shimmer and pulse animations, disabled by reduced motion.
- Component spec, Markdown page with live scenarios and generated docs route.
- Registry entry and generated docs artifacts.

### Out of scope

- A generic "replace any component with its skeleton" helper.
- Data fetching or loading-state orchestration.
- Charts, maps or other domain-specific placeholders.
- Per-block animation delays coordinated across a page.

## Compatibility and risk

- Public API impact: new component and new CSS variables; no existing API changes.
- Existing apps affected: none until they adopt it.
- Migration / breaking change: none.
- Security / performance: pure CSS animation, no JS per frame, no `innerHTML`. The main risk is layout shift if consumers give a skeleton a different size than the content; docs must show matching heights.
- Accessibility risk: an unlabeled skeleton that is announced as a status is noise. The default is decorative; a label opts into announcement.

## Validation plan

- Unit tests: prop normalization, line count, variant classes, width/height, reduced-motion behavior where testable.
- Browser/e2e tests: smoke render, variants, group label, `prefers-reduced-motion`, theme switch, no layout overflow at 320px.
- Product check (Conclave): not required; new component, no product adoption yet.
- Artifact/release check: `pnpm run build`; docs and registry generated.

## Documentation impact

- Framework docs pages: none.
- Component docs: `src/markdown/skeleton.md` with live scenarios and a “Skeleton or Loading?” section.
- Skill / agent guidance: mention the new component in the component catalog when it ships.
- Workspace docs: the lab ledger will pick the feature up automatically; add a lab demo when M1 reaches display components.

## Open questions

- [ ] Should the group label live on the host (`role="status"`) or should a separate `SkeletonGroup` own it?
- [ ] Is a numeric `height` useful, or should everything be a CSS length for consistency with `width`?
- [ ] Do we need a `delay` before showing, to avoid a flash on fast loads, or is that the consumer's job?

## Decision log

- 2026-10-28 - Created as `proposed` from `WANTED_COMPONENTS.md`; one feature per wanted component.
