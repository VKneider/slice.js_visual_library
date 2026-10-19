# Backlog

Outstanding work on components that already ship. For components we would like
to *add*, see [`WANTED_COMPONENTS.md`](./WANTED_COMPONENTS.md).

Every item here was found by looking at the rendered result — the class of bug
that builds, passes its specs, and is only visible in a screenshot or a
measurement.

## Read this before trusting this file

A backlog that is confidently wrong costs more than a backlog that is short,
so entries carry the date they were last checked against the code. **Four
entries in this file were stale when last audited (2026-10-15)** — one claimed
a doc had drifted when it had already been rewritten, one counted 2 visual
baselines when there were 6, and two misdescribed a bug's location. The causes
were all the same: an entry written from an earlier session and never
revalidated.

So: re-verify before acting on anything here, and update the date when you do.
The measurements quoted are reproducible from the component; the claims about
what was decided are not.

## Bugs

- [ ] **`Input`'s `size` values are a second copy of `Button`'s — parked on
  purpose, not an oversight.** *(verified 2026-10-15)* `Input.css` hardcodes the
  same `6px 12px` / `12px` / `0.7×` that `Button`'s `.slice_button--sm` already
  carried, because the scale meant to own them (`scale.css`, `[data-size]`) is a
  prototype that **no application code loads**: `applySize` set `data-size` on
  every host and nothing read it. Measured before the fix, `Input` ignored
  `size` completely — 19px at `md` and 19px at `sm`.

  The design-system spike is **shelved**: started, partly landed, deliberately
  not continued. So unifying this means reopening the spike, not just moving a
  declaration — which would mean either loading `scale.css` and deleting both
  hardcoded rule sets, or dropping the scale and keeping one shared declaration
  the components ship themselves. `DESIGN_SYSTEM.md` holds the proposal.
  Until then, four duplicated numbers beat a declared public API that silently
  does nothing.

- [ ] **Trees share open/closed state through `localStorage`, not just within a
  page.** *(verified 2026-10-15)* `TreeItem.getContainerKey()` returns
  `` `treeitem-${this._value}` `` — the label alone — and `toggleContainer` /
  `restoreState` read and write it with `localStorage.setItem` / `getItem`
  (`TreeItem.js:162`, `:182`). That makes it worse than one page's demo moving
  the next: the key is global, so opening a node labelled "Docs" anywhere writes
  state that any other tree with that label reads — across pages, and across
  reloads.

  The fix is a `stateKey` on `TreeView` threaded to every `TreeItem`,
  **including nested children**. An earlier attempt scoped only the top level,
  left a grandchild keyed `treeitem-A.pdf`, and a second tree then reported two
  containers for a one-branch schema. That interaction is still not
  understood, which is why it was reverted rather than shipped half-verified.
  Understand why two trees cross-talk before touching the key again.

- [ ] **22 components declare `font-family: var(--font-family)` with no fallback,
  and this app never loads the file that defines the token.** *(verified
  2026-10-15)* Two facts that were long conflated. `slice init` *does* ship
  `sliceStyles.css` — `init.js:262-298` copies the framework's whole `src/`
  except `Components/Visual` and `Components/Service` — so a consumer gets
  `--font-family` and those 22 declarations resolve. But **this** app has no
  reference to `sliceStyles.css` anywhere, and no `--font-family` in
  `LIGHT.css`/`DARK.css` either, so here the token is undefined and every one of
  those declarations falls through to the inherited family. The question that
  decides it is whether the repo should keep a font declaration in a stylesheet
  nothing loads, or drop it. Adding fallbacks to the 22 would paper over that
  instead of answering it.

  The sibling bug here is **fixed**: `Button` and `NotFound` asked for
  `font-weight: 800`, above what most stacks carry, so the bold was synthesised
  — the glyphs painted twice. Measured: the same run is 37.22px at 700 and
  38.41px at 800. `src/Components/Visual/fontWeights.test.js` now reads the
  `@import`, takes its maximum, and fails on any component that asks for more.

- [ ] **`Details.css:17` carries a dead `.caret` rule.** *(verified
  2026-10-15)* `slice-details .details_summary .caret` styles a class that
  nothing renders: `Details.js:39-43` uses `<div class="symbol plus">` and swaps
  `plus` / `minus`. Safe to delete.

- [ ] **Any component taking geometry from `sliceStyles.css` inherits a coupling
  it cannot ship.** *(verified 2026-10-15)* `TreeItem`'s caret used to take its
  *shape* from a bare `.caret` rule there — measured 0×0 with no hit area, so
  installed standalone the collapse control was invisible and unclickable. Fixed,
  and `TreeItem.css` carries its own now. `sliceStyles.css` is meant to be
  shared, so this is not a defect in it; the note is for whoever adds the next
  rule there.

## Tooling

*(Not a rendered-result defect — this file's usual charter — but it constrains how every component
declares its enums, so it belongs somewhere discoverable.)*

- [ ] **`slice types generate` cannot see an `allowedValues` that is a reference, so a shared
  vocabulary cannot be typed.** *(verified 2026-10-18)* The generator parses each component with
  `@babel/parser` and converts `static props` through `astNodeToValue`
  (`slicejs-cli/commands/types/types.js:37`), which understands literals, `ArrayExpression` and
  `ObjectExpression` — and returns `undefined` for anything else (`:65`). An `Identifier` is
  therefore dropped, and the union is only built when a literal array survived (`:457`), so the prop
  silently emits as `string`.

  The proof is in the generated file itself: `Button`'s `variant` (written inline) becomes
  `'filled' | 'outlined' | …` while its `size` (from `SIZE_VALUES`) becomes `string`. In this library
  the referenced form is the **majority** — `Badge`, `Chip`, `Button.size`, `Input.size`,
  `Textarea`, `ColorPicker` — so each of those is a union that is quietly missing.

  The workaround, applied to `Checkbox`, is to write the list inline in `static props` and have the
  setter read it back from there. That keeps one source (no second copy in the module) but costs the
  *sharing*: `Checkbox` no longer imports `SIZE_VALUES` from `spike/recipes.js`, so its size
  vocabulary is a copy of `SIZE_RECIPE`'s keys rather than the same list. Resolving a same-file const
  is small; resolving an imported one is not (`SIZE_VALUES` is `Object.keys(SIZE_RECIPE)`, so it
  needs evaluation, not just a lookup). Tracked with the fix tiers in the CLI repo's `BACKLOG.md`.

## Tests

- [ ] **Visual coverage: 8 baselines across 69 spec files.** *(verified
  2026-10-18)* An earlier count of "2 of ~40", and then of 6, was stale: the
  committed baselines are `badge-accent`, `checkbox-default`, `checkbox-variants`,
  `chip-removable`, `emptystate-default`, `fileupload-default`, `props-table` and
  `table-basic` (regenerated with the Table visual pass — see `TABLE_IMPROVEMENTS.md`).
  Deliberately not tracked in CI — Playwright writes one baseline per platform
  (`name-win32.png`), so committing them breaks other platforms. Worth doing
  behind a Linux-only project so the opt-in job owns them.

  Note for whoever picks this up: `.gitignore:17` already ignores
  `*-visual-win32.png`, so a **new** baseline cannot be committed at all — the
  existing eight are tracked only because they predate that rule. Adding visual
  coverage for a new state therefore means either forcing the file in (`git add -f`)
  or moving the whole thing into the Linux-only project described above. The Table
  work wanted a second baseline for the sort affordance and dropped it for this
  reason; those states are covered behaviourally in `Table.spec.js` instead.

- [ ] **Asserts that are load-sensitive, not component-sensitive.**
  *(verified 2026-10-15)* `ThreeAimTrainer.spec.js` (a WebGL demo: timed out at 30s once under
  parallel load, passed alone in 27s, did not recur), `tests/leak-cleanup.spec.js` and
  `BottomNav.spec.js:100` pass in isolation and occasionally fail under parallel
  load — the latter asserts `Math.abs(delta) <= 0.5`px, which a scheduling
  artefact can blow. Options: widen the tolerance, add `retries`, or run the
  affected project serially. Not real defects.

## Components

- [ ] **The theme grows a token per retinting need, and no component exposes a
  hook — which is how `--accent-color` was born.** *(verified 2026-10-15, and
  the token is now gone)* It was defined in both themes, used by nothing, and
  measured at 3° of hue and 1.52:1 from `--secondary-color`: a duplicate rather
  than a third colour. It was deleted rather than given a use, because adding a
  sixth brand token to a palette that already had seven hues competing for six
  slots made the collision worse, not better. `info` moved to a new
  `--info-color` in the blue band, the only region of the wheel left that is both
  hue-separated and semantically neutral.

  The root cause is still here: when a component needs a colour the palette does
  not have, the only sanctioned move today is to add a **theme** token, which is
  global by construction. The alternative is a component-level hook with a theme
  fallback — `background: var(--btn-bg, var(--accent))`, the pattern the portfolio
  uses — so a consumer retints one component without the library inventing a
  palette entry. That touches all 43 components, which is why it is its own item
  rather than something to fold into a palette change.

- [ ] **`GamePage` is routed but never imported.** *(verified 2026-10-15)*
  `routes.js:6` maps `/game` to `GamePage` and `components.js:5` registers it,
  but nothing outside those two files references it. Either wire it up or remove
  the route; today it is a path that leads nowhere.

- [ ] **Extract `Stepper` out of `Form`.** A stepped form's progress indicator
  is `Form`'s internal CSS with no editable props, but `Stepper` is on
  `WANTED_COMPONENTS.md` and the step model is now settled: one implicit step
  for a flat schema, gating on advance only, a live region for the change.
