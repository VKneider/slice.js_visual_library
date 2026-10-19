# Design system: scale, recipe table, and the theming surface

Status: **SHELVED — started, partly landed, deliberately not continued.**
A spike exists and is green; the architecture was never decided and is not being
pursued right now. This file records the proposal, what the spike proved, and —
more importantly — what it exposed. Read the "What the spike exposed" section
before deciding anything.

> **Shelved on purpose (2026-10-15).** Continuing this means carrying `Input`'s
> and `Button`'s size recipe forward, which touches every control on every page.
> That was declined. Two consequences are now accepted debt rather than
> oversights:
>
> - `Input.css` hardcodes the four values `Button` already had, so `size` works
>   on both instead of being inert on `Input` — duplication, chosen over a
>   declared public API that silently does nothing.
> - `scale.css` stays unloaded. Nothing reads it, and `applySize` setting
>   `data-size` on a host that no stylesheet listens to is why that was easy to
>   miss.
>
> Reopening this is the only way to retire either. `BACKLOG.md` carries both as
> parked entries.
>
> One finding below is **not** part of the spike and stands on its own: the
> `Button` container ring, which predates it and is why two components carry a
> local override for padding they should never have had to think about.

> **The measurements below are the PRE-SPIKE state.** The spike changed some of
> them, in ways that make parts of this file wrong if read as present tense.
> Verified 2026-10-15 against the working tree:
>
> | Claim here | Still true? |
> | --- | --- |
> | #2 "Zero of 43 components declare `className`" | **No** — `Button` and `Input` now declare it. Both are the spike itself, so it is 2 of 43 and both are undecided. |
> | #3 "`Input` had no `size` at all" | Partly — it has the prop and applies the class, but **`Input.css` has no rule that reads it**: measured 19px at `md` and at `sm`. A declared prop that does nothing is worse than an absent one, because §7 makes it public API forever. |
> | #3 "a `Button` at `sm` and an `Input` beside it matched only by coincidence" | **Confirmed, and worse** — they do not match at all. `Button` 43px → 30px; `Input` 19px → 19px. Delta 24px at `md`, 11px at `sm`. |
>
> The general lesson is the one `tests/design-scale-gap.spec.js` holds: a `size`
> prop that is declared, validated and class-swapped but never read by CSS is
> indistinguishable from working, from the outside, until you measure the box.

## The problem, measured

Three separate gaps, none of them visible from the code alone.

**1. There is no shared vocabulary for `size`.** From the components as they
stand:

| Component | `size` | `variant` |
| --- | --- | --- |
| `Button` | `md \| sm` | `filled\|outlined\|ghost\|soft\|danger` |
| `Card` | — | `default\|elevated\|outlined\|minimal` |
| `Badge` | default `md`, **accepts any value** | default `neutral` |
| `Chip` | default `md`, **accepts any value** | default `neutral` |
| `Icon` | default **`small`** | — |

Three vocabularies for one concept. `size: 'sm'` is invalid on `Icon` and
`size: 'small'` is invalid on `Button`. `Badge` and `Chip` accept anything,
because they never declared `allowedValues`. Nobody can tell from the outside
whether two components agree.

**2. There is no `className` prop.** Zero of 43 components declare one. Fourteen
contain the *word* `className` for internal use (`placeholder.className = …`),
which is what a naive grep reports and is not the same thing.

**3. Controls cannot agree on a height.** `Input` padded with a literal `10px`
and had no `size` at all; `Button` had its own `--sm` rule. A `Button` at `sm` and
an `Input` beside it matched only by coincidence.

Consequence: a `Form` is many controls that do not share a rhythm, which is why
the docs demos read as a collection of parts rather than a form.

**4. No Shadow DOM** — 0 of 43. Components are light DOM with `slice_*` prefixed
classes. Outside CSS already reaches in; there is simply no sanctioned path, so
consumers reach in with `!important`. Those classes are **public API in
everything but name**, and nothing says so.

## What already exists, and should be built on

- `src/public/Themes/LIGHT.css` / `DARK.css` — semantic tokens on `:root`.
- A scale convention: `--slice-shadow-sm|md|lg`, with the elevation scale
  documented in the theme file itself.
- The unified "floating surfaces" concept (`--slice-surface-raised`), with the
  reason written next to it.
- Back-compat aliases: `--card-shadow: var(--slice-shadow-sm)`.
- `sliceStyles.css` is loaded first in an app **on purpose** and is meant to be
  shared.
- **The framework already validates `allowedValues` at runtime**, logging an
  error for a value outside the list.

The pattern is right and partly applied. The work is finishing it and making it
structural — not inventing a new mechanism.

## The proposal

### Layer 1 — density scale

Extend the existing `--slice-*` convention from elevation to space and type.
The idea that matters: **a size token is a bundle, not a height**.

```css
--slice-size-sm: 28px;      /* height    */
--slice-space-sm-x: 8px;   /* padding inline */
--slice-space-sm-y: 4px;   /* padding block  */
--slice-type-sm: 12px;
--slice-radius-sm: 6px;
```

Each control reads all five from the same declaration. That is what lets `sm`
mean the same height on a `Button` and an `Input` — which it cannot today,
because each measures what it likes.

Plus a space scale (`--slice-space-1..7`) so spacing between things is not
invented per component either. `Form`'s `--form-gap` should become a reference
to it, not a parallel system.

### Layer 2 — the recipe table

One declaration of which values exist and what each one *means*, per family.

```js
export const SIZE_RECIPE = { sm: {…}, md: {…}, lg: {…} };
export const SIZE_VALUES = Object.keys(SIZE_RECIPE);
export const VARIANT_RECIPES = {
   action:  ['filled', 'outlined', 'ghost', 'soft', 'danger'],
   surface: ['default', 'elevated', 'outlined', 'minimal'],
   status:  ['neutral', 'brand', 'success', 'warning', 'danger'],
};
```

Because the framework already validates `allowedValues`, the table can *be* the
source of those lists, so a component stops carrying its own.

`variant` stays **per family** on purpose. "filled/outlined/ghost" is a button
idea and "neutral/brand" is a badge idea; pretending otherwise is how you get 43
lists.

### Layer 3 — the theming surface

Document, per component, which `slice_*` classes and which custom properties are
**stable**. This is the layer that makes the other two safe: it lets internals be
refactored without breaking consumers, and gives consumers something to rely on
instead of a class name they had to guess.

### `className`

A prop on every component, **added** to the component's own classes, never
substituted for them. A `className` that replaced them would strip the control of
its structural classes and break it in silence — the same failure mode as passing
a bare string to `Button.icon`, which rendered an empty `<svg>` with no warning.

**From JavaScript or from CSS?** Both, and they answer different questions. The
CSS is always yours; `className` (JS) *marks* an instance so your CSS can find
it. With light DOM you can already target `.slice-button` directly, so
`className` is not needed to restyle — it is what keeps a repeated customisation
out of a specificity fight, and out of the internals.

Contract: `size`/`variant` for the scale, `className` for the one-off, never
`!important` against internals.

## The spike

`src/public/Themes/scale.css`, `src/Components/spike/recipes.js`, and `size` +
`className` wired into `Button` and `Input`. Every CSS token is consumed with
**today's value as the fallback**, so a component that never loads the scale is
byte-for-byte unchanged.

`tests/design-scale.spec.js` is the "definition of done" this proposal promised:
a `Button` and an `Input` at the same `size` must measure the same height.

```
sm   button 28   input 28
md   button 36   input 36
lg   button 44   input 44
```

Exact, not "within 1px". The spike is green and the full gate passes.

## What the spike exposed

**The mechanism works. The enforcement does not exist — and that is the whole
problem.** Asked for `size: 'sm'`, with the scale loaded:

| Control | `data-size` | at `sm` | at `md` |
| --- | --- | --- | --- |
| `Button` | `sm` | 28px | 36px |
| `Input` | `sm` | 28px | 36px |
| `Select` | **null** | **41px** | **41px** |
| `Textarea` | **null** | **89.2px** | **89.2px** |
| `Switch` | **null** | **35.4px** | — |

**41 of 43 components accept `size` and silently do nothing with it.** No error,
no warning, no attribute. A consumer who asks for a smaller `Select` gets the
same `Select` and no signal that anything was ignored.

This is the exact failure the recipe table was meant to remove — a list someone
has to remember to extend — reintroduced one level up. `applySize` is still a
manual call per component, and the conformance test was written **by hand for the
two components that happened to be migrated**. That test is not enforcement; it
is the same rot in a different place.

`tests/design-scale-gap.spec.js` holds this as a **skipped** test, so the debt is
in the repo and enabling it is un-skipping rather than remembering.

### Three failed hypotheses, recorded because they are the useful part

1. **`min-height` was the wrong tool.** First attempt used it. Measured: sm 29 vs
   30, lg 47 vs 45 — a gap that **grows with size**, so it is line-box height,
   not an offset. Which means `sm` was never 28px: it was "28 or a bit more
   depending on font metrics". A token that cannot predict its own height is not a
   contract. Fixed with `height` + `box-sizing: border-box`, after which the
   numbers are exact.
2. **The scale is opt-in and silent when absent.** Without `scale.css` everything
   reverts to the old behaviour with no signal. The default state is "you do not
   have what you think you have".
3. **A component cannot import from outside `src/Components/`.** Putting the
   recipe in `scripts/` made `slice.build('Button')` return `null`. The spec
   caught it, not the author.

Also worth recording: the first version of the conformance test passed itself —
it asserted "no `!important`" while containing one, and passed at 43px because
the class landed on the host while the painted control is a child. A test that
fakes itself is worse than no test.

## Open questions, not yet decided

- **Does the conformance test get generated from `SIZE_RECIPE`?** Without it this
  does not scale. This is the decision that separates an architecture from a
  demo.
- **Warning at development time** when a control receives `size` and does not
  apply it. Turns silence into a diagnostic.
- **Should the scale always be loaded** rather than opt-in?
- **The bundle fits a control box, not a control interior.** `Textarea` needs a
  minimum, `Badge` needs no height, `Card` needs neither. The recipe is
  per-family, which is more design than "one list" and better said now than later.
- **Rhythm is only half-demonstrated.** In the spike the *box* comes from the
  scale but the space between fields still comes from `Form`'s `--form-gap`, so
  the gap looks large against 28px controls. The two systems have to meet.
- **Where the line falls** between "extend the scale" and "write a class" — and
  the fact that a consumer cannot add `xl` without editing the library.

## If this is picked up

1. Generate the conformance test from the recipe table; enable the skipped test.
   **Nothing else matters until this passes.**
2. Add the dev-time warning.
3. Stop making the scale opt-in.
4. Fold `--slice-space-*` into `Form` and the remaining layout tokens.
5. Migrate controls one at a time, gate between each — starting with the ones a
   `Form` composes, since that is where the problem is visible.
