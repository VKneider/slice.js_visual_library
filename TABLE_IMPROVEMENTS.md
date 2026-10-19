# Table — improvements

Status: **Part 3 (the leak) and Part 1 (the visual layer) are DONE** (2026-10-18); Part 2
(features) is not started. This file collects everything we want to change in
`src/Components/Visual/Table/` — the visual layer first, then the features to add — with the evidence
and the constraints each item has to respect.

## Progress log

**Part 3 — done.** `renderTable()` now resolves every cell *before* touching the DOM, then calls
`_releaseChildren(container, incoming)` on `$head`/`$body` — which destroys the components this render
**evicts** (a `render(row)` callback builds a fresh one per call) and **keeps** the nodes it is about to
append again, so the legitimate "re-pass the same node" pattern in `markdown/table.md` still works.
`beforeDestroy()` also runs `destroyByContainer` on both containers, because cells appended after
`init()` are not in `childrenIndex` and the destroy cascade never reaches them. Three specs cover it
(evicted→destroyed, re-appended→kept, table-destroyed→cells gone); the first two were verified to FAIL
with the fix reverted in either half.

**Part 1 — done.** `Table.css` was rewritten with `--slice-table-*` knobs on the host: tinted header
(`headerVariant: 'tinted' | 'solid' | 'none'`, default `tinted`, unknown → `tinted`), tinted row
dividers instead of solid `--primary-color-shade`, row hover, a border-drawn sort chevron in a
fixed-width slot (no more glyph-width jitter or permanent `⇅`), class-based alignment instead of inline
`text-align`, numeric columns auto-right-aligned with `tabular-nums` (header included), a primary-tinted
mobile card instead of the light-blue `--secondary-background-color`, and a `currentColor` focus ring
that is visible on the tinted header. `table-basic` was regenerated deliberately (the six tracked
baselines are not in CI, so deleting and re-running is the update path). A second baseline for the sort
affordance was written and then dropped: `.gitignore:17` ignores `*-visual-win32.png`, so a NEW baseline
cannot be committed — see the Tests entry in `BACKLOG.md`. The chevron and the unsorted-hint states are
covered behaviourally in `Table.spec.js` instead. `align` in `_resolvedColumns` is no longer filled in with `'left'` — a
filled default made every column "explicitly aligned" and silently disabled the numeric rule.

Verified for both parts: `Table.spec.js` 54 tests green, the full `components` e2e suite 934/934 green,
`pnpm test` 73/73, `check:teardown`, `icons:lint`, `pnpm run build`, `docs:lint-md`, `docs:generate`
and `slice types generate` (`headerVariant` showed up in the generated union, confirming the
inline-literals requirement).

One decision was made by default and is worth a second look: **the header look changed for everyone**
(tinted is now the default). `headerVariant: 'solid'` restores the old fill exactly. See open decision 1.

It expands two existing entries rather than replacing them: `WANTED_COMPONENTS.md:58` (row selection)
and the visual-baseline note in `BACKLOG.md:117` (the `table-basic` snapshot this work invalidates).

Read `COMPONENT_API_STANDARDS.md` §13 before touching the component; every item below inherits it.

## Where it stands

`Table.js` (360 lines), `Table.css` (178), `Table.spec.js` (26 tests across 7 describes). The engine is
a separate Service (`DataGridEngine.js`), built per instance and destroyed in `beforeDestroy()`.

**Already good, and not up for redesign:** the a11y baseline (`scope="col"`, `aria-sort` kept in sync,
headers operable with Enter/Space, `tabindex="0"`), cells safe by default with an explicit
`{ html }` opt-in, the responsive card layout with `data-label`, `dataSource: 'remote'`, pagination that
is reconfigured instead of rebuilt, and the render/engine split.

The gap is **how it looks** plus a handful of data-grid conveniences. Nothing in Part 1 requires an API
change; Part 2 is additive only.

---

## Part 1 — The visual layer

The table reads as basic for one dominant reason: **the header is the loudest thing on the page.** It
is a solid `--primary-color` fill with white bold text (`Table.css:29-33`) — the same token `Button`
uses — so in a data-dense screen it competes with the page's own primary actions. In a table, the
header should be the quietest plane, not the loudest.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `Table.css:29-33` | `background: var(--primary-color)`, `color: var(--primary-color-contrast)`, `font-weight: 600` | Tinted header: `background: color-mix(in srgb, var(--primary-color) 8%, var(--primary-background-color))`, text `var(--font-secondary-color)`, `0.75rem`, uppercase, `letter-spacing: .06em` | `Badge.css:48-52` already settled this: *tinted, not solid*. A saturated fill leaves no room for hover or for marking the active column — which is why the current hover has to darken it to `80%, black` (`Table.css:51-53`) |
| HIGH | `Table.css:22-27` | `border-bottom: 1px solid var(--primary-color-shade)` on every row | `border-bottom: 1px solid color-mix(in srgb, var(--primary-color) 12%, transparent)` | The token's *role* is right (`LIGHT.css:93-101` says `-shade` is a border tone, not text), but its *value* is a saturated purple (`#7c3aed`): twenty purple lines fight the header. A tint separates without shouting |
| HIGH | `Table.css:64-67` | No row hover state at all | `tbody tr:hover { background: color-mix(in srgb, var(--primary-color) 4%, transparent) }` + `transition: background-color 120ms ease-out` | In a wide table the eye loses the line. Highest value per line of code in this list. Specify the property — `transition: all` is banned (`make-interfaces-feel-better` #14) |
| MEDIUM | `Table.js:304`, `Table.css:93-96` | Sort state as literal text glyphs: `' ▲'`, `' ▼'`, `' ⇅'` in a `<span>` with `font-size: .8em; opacity: .8` | Real chevrons in a fixed-width slot; inactive nearly invisible, active in `currentColor` | They are font glyphs, so metrics depend on the font — and `▲`/`▼`/`⇅` have **different widths**, so toggling sort shifts the column label. `⇅` on every column is also permanent noise |
| MEDIUM | `Table.js:293`, `Table.js:335` | `th.style.textAlign = column.align` — inline styles | A class (`table_cell--right` / `--center`) | An inline style cannot be overridden without `!important`, which is exactly the specificity fight the design system exists to avoid. A class is also what lets numeric cells auto-align |
| MEDIUM | `Table.css:16-20` | `table-layout` defaults to `auto` | Opt-in `fixed` (or per-column `width`) | With `auto`, **every sort and every page change recomputes column widths** because the content changed: the table visibly jumps. Real jank, not taste |
| MEDIUM | `Table.css:145` | Mobile cards on `background: var(--secondary-background-color)` — light blue `#f0f9ff` | A primary tint: `color-mix(in srgb, var(--primary-color) 4%, var(--primary-background-color))` | This is the exact mistake `LIGHT.css:66-70` documents: *"a menu, a dropdown and a popover are the SAME concept, and they used to pick different backgrounds… which is how DropDown ended up light-blue in a purple theme"* |
| LOW | `Table.js:355`, `Table.css:35-39` | Numbers left-aligned, proportional digits | Auto right-align + `font-variant-numeric: tabular-nums` for numeric cells | Proportional digits in a column of figures read badly and shift when the values update |
| LOW | `Table.js:316-329`, `Table.css:98-102` | Empty state is one centred sentence | Reuse `EmptyState` (it already has `buttonLabel` / `buttonOnClick`) | An empty table is the canonical "nothing here + do this" moment |
| LOW | `Table.css` (whole file) | No theming knobs | `--slice-table-*` declared **on the `slice-table` host** | The idiom `Card` (`--card-*`) and `Checkbox` (`--slice-checkbox-*`) already use, and the design system's Layer 3: it makes internals refactorable without breaking consumers |

### The header recipe, concretely

```css
slice-table {
  /* Declared on the HOST, never on an inner element: a declaration on an
     element beats the inherited one and shadows the consumer's override. */
  --slice-table-header-bg: color-mix(in srgb, var(--primary-color) 8%, var(--primary-background-color));
  --slice-table-header-fg: var(--font-secondary-color);
  --slice-table-row-divider: color-mix(in srgb, var(--primary-color) 12%, transparent);
  --slice-table-row-hover: color-mix(in srgb, var(--primary-color) 4%, transparent);
  --slice-table-cell-padding: 10px 12px;
}
```

`--primary-color`, `--primary-background-color` and `--font-secondary-color` are all in the 15
**required** tokens of `COMPONENT_API_STANDARDS.md` §11, so this works on any installed theme and not
just this repo's. That matters: the `--*-readable` tones have the opposite property — they live in this
repo's `LIGHT.css`/`DARK.css` and **not** in the theme a consumer gets, which is why `Badge.css:56-78`
calls its inlined fallback *load-bearing*. Any new token used here needs the same treatment.

---

## Part 2 — Features to add

Additive only. Per §7 nothing is renamed or removed; `headers` + array rows stay supported.

| # | Feature | Prop surface | Acceptance | Cost |
| --- | --- | --- | --- | --- |
| 1 | **Per-column sorting control** | `columns[].sortValue` (function or nested key path, e.g. `'user.name'`), `columns[].compare(a, b)` | Sorting by a nested key and with a custom comparator both work; `aria-sort` and the asc → desc → unsorted cycle unchanged | 🟢 small |
| 2 | **Row selection** | `selectable`, `selectedKeys`, `rowKey`, `onSelectionChange(keys, rows)` | Header checkbox selects/clears, shows **indeterminate** on a partial selection; selection survives paging; nested `Checkbox` components are destroyed on re-render | 🟡 medium |
| 3 | **Sticky header** | `stickyHeader` | `<th>` sticks while the consumer's scroll container scrolls; documented that the consumer owns the height | 🟢 small |
| 4 | **Row interaction** | `onRowClick(row, index)`, `rowKey` | Row click fires with the row and its index; `rowKey` also becomes the selection identity in remote mode | 🟢 small |
| 5 | **Density** | `size: 'sm' \| 'md'` (default `md`) | `[data-size]` on the host drives padding/type; unknown values fall back to `md`; the class swap is idempotent (§3.3) | 🟢 small |
| 6 | **Striped rows** | `striped` (boolean, default off) | Alternating background, never fighting the hover state | 🟢 small |
| 7 | **Header style** | `headerVariant: 'tinted' \| 'solid' \| 'none'` (default `tinted`) | `solid` reproduces today's look exactly, so nobody's page changes without a deliberate choice | 🟢 small |
| 8 | **Accessible name** | `caption`, `label` | `caption` renders a real `<caption>`; `label` sets `aria-label` when there is no visible caption | 🟢 small |
| 9 | **Column sizing** | `columns[].width`, `columns[].minWidth`, `layout: 'auto' \| 'fixed'` | Widths apply; `fixed` removes the sort/page jitter from Part 1 | 🟡 medium |
| 10 | **Empty state action** | `emptyAction: { label, onClick }` | Renders an `EmptyState` with a working button in the empty row | 🟡 medium |

Notes that decide how 1–4 are built:

- **#1 is nearly free because the engine already supports it.** `DataGridEngine.sortItems()` accepts
  `{ key, accessor, comparator }` (`DataGridEngine.js:108-119`) — but `Table` never passes them:
  `setSort` (`:47-51`) and `toggleSort` (`:61-71`) build `{ key, direction }` only, and that is what
  `pageRows()` hands to `sortItems`. So the fix is to let `_sort` carry `accessor`/`comparator` from the
  column descriptor. No new sorting code.
- **#2 depends on `rowKey` (#4).** Selecting by array index is wrong the moment the data is paged,
  sorted or replaced by a remote fetch. In `dataSource: 'remote'` the selection must be keyed, never
  positional.
- **#3 and the scroll container.** `slice-table .table_wrapper` already has `overflow-x: auto`; a
  `position: sticky` header only sticks relative to whatever actually scrolls vertically, so the
  consumer has to constrain the height (a `max-height` on the host or a wrapper). This has to be said in
  `src/markdown/table.md`, or it will read as broken. `MainMenu.css:29` already uses sticky in this repo.
- **#4 has an a11y cost.** A clickable `<tr>` is not a control: making every row focusable turns the
  table into a tab-trap. Recommendation: ship `onRowClick` as a convenience, keep rows
  **non-focusable**, and have the docs show an action column for keyboard users. If rows do become
  focusable, it must be opt-in and only when the prop is set.

---

## Part 3 — Correctness prerequisite: re-render leaks cells

This one is a bug, not polish, and it blocks #2 and #10.

`Table.js:281-282` wipes both containers:

```js
this.$head.innerHTML = '';
this.$body.innerHTML = '';
```

That runs on **every** sort, page change and `rows` update — and it destroys nothing. A cell holding a
component built with `slice.build` (the documented case in `src/markdown/table.md`, which passes a
`Button` into a cell) stays in `activeComponents` forever. `beforeDestroy()` (`Table.js:167-181`)
destroys the engine and the pager, but not what is inside the cells.

This is a bug class the repo already names — `slice.js/AGENTS.md`: *"`innerHTML=''` without
`destroyByContainer`"*. The mechanism exists and works: `Controller.js:1223` finds components by
`[slice-id]` attribute and destroys them recursively, and that attribute is set by `registerComponent`
(`Controller.js:723`). So the fix is `slice.controller.destroyByContainer(this.$head)` and
`...(this.$body)` immediately before each wipe — the "destroy-before-clear" path.

Ownership note, because it is a real decision: with `destroyByContainer` the table destroys what a
consumer put in a cell. That is the correct reading — the table is what wipes the container, so it owns
the contents — and it is the only option that does not leak. It also matters for #2: a selection column
builds a `Checkbox` per row, and paging would leak one per row per page without this.

---

## Sequencing

1. **Part 3 — the leak.** Independent, small, provable with a spec. Do it first: it is a real defect and
   it unblocks #2 and #10.
2. **Part 1 — the visual layer.** The CSS pass, plus the class-based alignment and the indicator slot.
   Regenerate the `table-basic` snapshot deliberately (`BACKLOG.md:117` — the baselines are not tracked
   in CI) and update `src/markdown/table.md`.
3. **Part 2 — features.** #1 first (almost free and the most-missed), then #5–#8 (each small), then
   #2/#4 (selection + row interaction, which share `rowKey`), then #9/#10.

Each step: `Table.spec.js` updated, `pnpm run docs:lint-md` + `pnpm run docs:generate` after any
markdown edit, and `pnpm run test:gate` green.

---

## Constraints every item must respect

- **No renames, no removals** (§7). Every new prop is additive; the legacy `headers` + array-rows API
  keeps working, and any new prop that supersedes an old one keeps the old name as an alias.
- **`allowedValues` must be a literal array**, declared inline in `static props`, with the setter
  reading it back from `this.constructor.props.<prop>`. Never a module const or an imported list: the
  CLI's generator only emits a TypeScript union from a literal array, so a referenced list silently
  degrades the prop to `string`. This is documented in both `BACKLOG.md` files and is why `Checkbox`
  declares its lists inline. Applies to `size`, `headerVariant` and `layout`.
- **Only tokens a consumer actually has**, or carry a fallback. The `--*-readable` tones are this repo's
  and not the framework theme's (`Badge.css:56-78`).
- **Custom-property defaults on the host**, never on an inner element — an inner declaration shadows
  the consumer's override.
- **Plain CSS scoped under `slice-table`**; explicit host `display` (§8.1); keyframes prefixed; no
  `!important`; classes instead of inline styles; a `[hidden]` companion for anything whose `.hidden` is
  toggled (§8.2).
- **Teardown in `beforeDestroy()`**, and destroy anything the component builds or wipes.
- **Docs are generated**: `src/markdown/table.md` is the source, the `TableDocumentation` page is output.
- **The snapshot changes on purpose.** `table-basic.png` is one of 8 committed baselines; deleting and
  re-running is the intended update path.

---

## Open decisions

1. **Change the default header look, or opt in?** The plan changes the default to `tinted` and keeps
   `solid` as an escape hatch. The alternative is to leave `solid` as the default and make this opt-in,
   which fixes nothing for anyone who does not read the docs.
2. **Select-all scope:** the current page, or every row after filtering? Page-only is what most grids
   do and it is the honest reading of the header checkbox; it must be documented either way.
3. **`size` vocabulary:** `sm | md` (matches §3.3) or `sm | md | lg` (matches what `Checkbox` adopted).
   Two vocabularies for one concept is the debt `DESIGN_SYSTEM.md:46-61` already measures.
4. **Knob prefix:** `--slice-table-*` (the `Checkbox` precedent) versus `--table-*` (the `Card` one).
5. **`onRowClick` and focus:** rows stay non-focusable, or become focusable when the prop is set.
6. **`striped` default:** off, so nobody's table changes twice.

---

## Out of scope

Deliberately not part of this: virtualization / windowing (`WANTED_COMPONENTS.md:59`, a separate 🔴
item), column resizing and reordering, pinned/frozen columns, row grouping or tree rows, CSV/export,
inline cell editing, and a footer aggregation row. None of these are "improve the Table"; they are
different components or a different ticket.
