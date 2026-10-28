---
id: "0006"
title: "Component: Virtualized list"
repo: "slicejs-components"
status: proposed
area: components
priority: low
created: 2026-10-28
updated: 2026-10-28
target: "TBD"
owners: []
related:
  - "src/Components/Visual/Table/Table.js"
  - "src/Components/Service/DataGridEngine/DataGridEngine.js"
  - "src/markdown/table.md"
  - "src/Components/Visual/Select/Select.js"
  - "src/markdown/select.md"
  - "COMPONENT_API_STANDARDS.md"
---

# Component: Virtualized list

## Summary

A `VirtualList` renders only the rows that are on screen, so a list of thousands of records scrolls without thousands of DOM nodes. It is the generic list counterpart to the Table's existing `virtual` mode: activity feeds, search results, logs, pickers and long menus.

## Problem / motivation

`Table` already supports `virtual: true` with a fixed row height, and `Select` virtualizes its long menus. There is no reusable windowing primitive for a plain list, so apps that need a feed or a result list either render every row or copy the Table's internal windowing.

At a few thousand rows the cost is not just memory: every keystroke in a filter or every theme switch touches the whole list. A small, well-documented virtualizer also gives the lab a real performance scenario.

## Proposed direction

```js
const list = await slice.build('VirtualList', {
  items: results,
  itemKey: (item) => item.id,
  itemHeight: 48,        // fixed height in v1
  height: 420,           // viewport height, CSS length or px
  overscan: 4,           // rows rendered above and below
  renderItem: (item, index) => rowNode,
  onRangeChange: ({ start, end }) => {},
  onEndReached: () => loadMore()
});
```

- `items` is any array; `renderItem(item, index)` returns a node, a string or `{ html }` only for trusted content.
- `itemHeight` is fixed in v1. Variable heights are a later mode (`estimateHeight` + measurement), not a first-version promise.
- `height` is required for a scroll container; `maxHeight` could be an alternative, but one of them must be explicit.
- `overscan` defaults to 4; a spacer before and after the window keeps the scrollbar honest.
- `itemKey` keeps DOM identity stable when items change. Without it, index keys are used and rows re-render more than necessary.
- `scrollToIndex(index, { align })`, `scrollToKey(key)`, `range` and `totalHeight` support programmatic scroll and “jump to today”.
- `onEndReached` fires once per threshold crossing, not on every scroll frame.
- Accessibility: the list is a `list`/`listitem` structure; each rendered row gets `aria-setsize` and `aria-posinset` so screen readers know it is a window, not the whole data set. Focused rows stay mounted during scroll.
- `prefers-reduced-motion` affects `scrollToIndex({ behavior: 'smooth' })`.
- Empty/loading/error states are **not** built in; compose `EmptyState`, `Skeleton` and `Alert`.

## Alternatives considered

- **Use `Table` with one column.** Works today, but a table carries header, sorting and grid semantics that a feed does not need.
- **CSS `content-visibility: auto`.** Cheap for large static documents, but it does not bound the DOM or the number of components, and does not help with focus/keyboard.
- **IntersectionObserver + “load more”.** Good for pagination, not for random access and scroll restoration.
- **Variable heights in v1.** Rejected: measurement, scroll anchoring and keyboard focus make it a much larger component. Fixed height first.

## Scope

### In scope

- Fixed-height `VirtualList` with windowing, overscan and spacers.
- `renderItem`, `itemKey`, `onRangeChange`, `onEndReached`, `scrollToIndex`.
- Keyboard focus stability while the window changes.
- Component spec, Markdown page with large-list scenarios, generated docs route and registry entry.
- A lab performance scenario: 10k rows, mount/scroll/destroy timings.

### Out of scope

- Variable row heights (follow-up).
- Horizontal virtualization.
- A data table, sorting or filtering engine.
- Server fetching or cache management.
- Sticky group headers in v1.

## Compatibility and risk

- Public API impact: new component; no existing API changes.
- Existing apps affected: none.
- Migration / breaking change: none.
- Security / performance: the whole point is performance. Rendering must not read layout per scroll frame; use a single rAF and transform/spacer math. The DOM must stay bounded.
- Accessibility risk: a window of rows can confuse screen readers and keyboard focus. The ARIA set size/position and focus-retention rules are part of the acceptance criteria, not an afterthought.

## Validation plan

- Unit tests: range math, overscan, clamping, key changes, `onEndReached` once per crossing.
- Browser/e2e tests: 10k rows, bounded DOM, scroll restoration, keyboard focus, `scrollToIndex`, reduced motion, 320px.
- Product check (Conclave): not required until adoption.
- Artifact/release check: `pnpm run build`; docs and registry generated.
- Lab: a `/fluidity` scenario comparing a full list, CSS `content-visibility`, and `VirtualList` at 1k/10k rows.

## Documentation impact

- Framework docs pages: none.
- Component docs: `src/markdown/virtual-list.md`, with “VirtualList, Table or load more?”.
- Skill / agent guidance: add performance guidance when it ships.
- Workspace docs: add the lab scenario to `docs/LAB.md` once implemented.

## Open questions

- [ ] Fixed height only in v1, or fixed with a variable-height escape hatch?
- [ ] Should `height` be a number (px) or accept CSS lengths?
- [ ] How should selection work: `selectedKeys` + `onSelectionChange`, or leave it to the row renderer?
- [ ] Do we need sticky group headers before shipping, or is that a separate `VirtualSectionList`?
- [ ] Can `Table`'s virtual mode and this component share one windowing helper, or is that premature?

## Decision log

- 2026-10-28 - Created as `proposed` from `WANTED_COMPONENTS.md`; low priority because `Table` already covers the first high-volume case.
