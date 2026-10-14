# Backlog

Outstanding work on components that already ship. For components we would like
to *add*, see [`WANTED_COMPONENTS.md`](./WANTED_COMPONENTS.md).

Ordered roughly by how much they cost the next person. Every item here was found
by looking at the rendered result — the class of bug that builds, passes its
specs, and is only visible in a screenshot or a measurement.

## Bugs

- [ ] **Trees on the same page share their open/closed state.**
  `TreeItem.getContainerKey()` is `treeitem-${label}` — the label alone. Measured:
  open "Docs" in one tree and a second, never-touched tree with the same label
  comes up open too. On the docs page that means one demo's state moves the next
  one. The fix is a `stateKey` on `TreeView` threaded to every `TreeItem`,
  **including nested children** — an attempt that only scoped the top level left
  a grandchild keyed `treeitem-A.pdf`, and a second tree on the page then
  reported two containers for a one-branch schema. That interaction is not
  understood yet, so it was reverted rather than shipped half-verified. Find
  out why two trees cross-talk before fixing the key.

- [ ] **`TreeItem` still depends on the app stylesheet for nothing, but the
  pattern is worth a sweep.** Its caret used to take its *shape* from a bare
  `.caret` rule in `src/public/Styles/sliceStyles.css`, which the component does
  not ship: measured 0×0 with no hit area, so installed standalone the collapse
  control was invisible and unclickable. Fixed, and `TreeItem.css` now carries
  its own. `sliceStyles.css` is loaded first on purpose and meant to be shared,
  so this is not a defect in it — but any component taking geometry from it
  inherits that coupling. `DropDown` and `Select` carry their own;
  `Details.css` still has a `.caret` rule that is **dead** (`Details.js` never
  renders one — it uses `<div class="symbol plus">`) and can be deleted.

## Docs that have drifted from the code

- [ ] **`src/markdown/dom-service.md` predates the hardened `reconcile()`.** It
  still describes the old append-a-loop contract. This matters more than it did:
  `TreeView` and `Grid` both reconcile, so the documented behaviour is what most
  components depend on.

## Tests

- [ ] **Visual coverage: 2 of ~40 baselines are tracked.** Deliberate so far —
  Playwright writes one baseline per platform (`name-win32.png`), so tracking
  them breaks CI elsewhere. Worth doing behind a Linux-only project so the
  opt-in job owns them.

- [ ] **Asserts that are load-sensitive, not component-sensitive.**
  `tests/leak-cleanup.spec.js` and `BottomNav.spec.js` pass in isolation and
  occasionally fail under parallel load. Options: widen the tolerance, add
  `retries`, or run the affected project serially. They are not real defects —
  the one at `BottomNav.spec.js:100` measured a 47px delta against a 0.5px
  tolerance, which is a scheduling artefact rather than geometry.

## Components

- [ ] **Extract `Stepper` out of `Form`.** A stepped form's progress indicator is
  `Form`'s internal CSS with no editable props, but `Stepper` is on
  `WANTED_COMPONENTS.md` and the step model is now settled: one implicit step
  for a flat schema, gating on advance only, a live region for the change.