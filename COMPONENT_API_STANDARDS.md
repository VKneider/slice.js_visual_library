# Slice.js Component API & Naming Standards

> **Status:** Canonical reference for authoring components in this repository.
> **Scope:** This repo (`slicejs-components`) **is the official component registry** —
> the Slice CLI downloads components from
> `raw.githubusercontent.com/VKneider/slicejs-components/master/src/Components`.
> Therefore **every change here is a published, public API change** for all Slice.js
> projects once it reaches `master`. Treat prop renames as breaking unless shipped with a
> backward-compatible alias (see §7).

---

## 1. Principles

1. **Mirror the platform.** Prefer names that match native HTML/DOM (`disabled`, `checked`,
   `value`, `onChange`, `onClick`) over invented ones.
2. **One concept, one name.** The same concept must use the same prop name across every
   component (a click handler is always `onClick`, never `onClickCallback` in one place and
   `onClick` in another).
3. **Backward compatible by default.** Because this repo is the live registry, never remove or
   rename a public prop without keeping the old name working as a deprecated alias (§7).
4. **Safe by default.** No `innerHTML` for dynamic/user content; no hover-only interactions;
   clean up global listeners; scope all CSS.

---

## 2. Casing & identifiers

| Thing | Convention | Example |
| --- | --- | --- |
| Prop names | `camelCase` | `customColor`, `labelPlacement`, `onChange` |
| Boolean props | adjective, **no** `is`/`has` prefix | `disabled`, `checked`, `open`, `loading`, `selected` |
| Event handler props | `on` + PascalCase event | `onClick`, `onChange`, `onSelect`, `onClose` |
| Custom element tag | `slice-<kebab-name>` | `slice-button`, `slice-floating-dock` |
| CSS classes (new components) | root class **identical to the component name**, parts in BEM, scoped under the tag (§8) | `slice-data-list`, `slice-data-list__item`, `slice-data-list__item.is-busy` |
| CSS classes (legacy) | `snake_case` under the tag; keep them, do not mix styles in one component | `slice-button .slice_button` |
| State classes | `is-*` / `has-*` on the element they describe | `is-loading`, `is-active`, `has-error` |
| Variants, sizes, tones | `data-*` attributes on the host, styled with attribute selectors | `slice-badge[data-tone='danger']` |
| CSS custom properties | `--slice-<name>-<thing>`, declared on the host | `--slice-alert-ink`, `--slice-data-list-radius` |
| CSS keyframes | prefix with component to avoid global collision | `slice-badge-pulse`, `slice_input_shake` |
| Internal backing field | `_<prop>` | `_onClick`, `_customColor` |

---

## 3. Standard prop vocabulary

### 3.1 Event handlers (canonical)

| Handler | Use for | Fires with |
| --- | --- | --- |
| `onClick` | activation / navigation (Button, Card, TreeView/TreeItem) | `(event \| item)` |
| `onChange` | value/state changed (Select, Switch, Tabs, Checkbox, Input) | the new value |
| `onSelect` | an item was chosen from a set (when distinct from `onChange`) | the selected item |
| `onClose` / `onOpen` | open/close transitions (modals, drawers) | — |
| `onRemove` | an item asked to be removed (`Chip`) | the removed item's label |
| `onFiles` | files were picked or dropped (`FileUpload`) | `(filesArray, fileList)` |

**`onFiles`, not `onChange`:** the payload is a `FileList`/`File[]`, not a value the component
"holds". `onChange` would imply the component owns a value you can read back, which a file input
does not — and a `File` cannot survive `JSON.stringify`, so it is not a *value* in the sense the
rest of this table means.

**When a component wraps another component's control, prefix the handler.** `EmptyState` builds a
real `Button`; exposing its click as `onClick` would read as though the empty state itself were
clickable, and would collide with any future `onClick` on the wrapper. So it is `buttonLabel` /
`buttonRoute` / `buttonOnClick` — the prefix names *which* child control owns the click.

**Deprecated aliases (still accepted, warn once):**

| Deprecated | Canonical |
| --- | --- |
| `onClickCallback` | `onClick` |
| `onOptionSelect` | `onChange` |
| `onTabChange` | `onChange` |
| `toggle` (callback) | `onChange` |

### 3.2 State & value props

| Prop | Meaning |
| --- | --- |
| `value` | the component's current value (Button label text, Input value, Select selection) |
| `checked` | boolean on/off (Checkbox, Switch) |
| `disabled` | non-interactive state |
| `loading` | async/busy state (a component that loads its own data drives it itself; see §13) |
| `error` | an error text to show in place of the content |
| `open` | expanded/visible state (prefer over `isOpen`) |
| `items` | array of structured entries the component renders (see §4) |
| `options` | array of selectable choices (Select, DropDown) |

### 3.3 Layout / variants

| Prop | Values |
| --- | --- |
| `variant` | how **loud** it is, declared via `allowedValues`. Use Button's names where they fit: `'filled' \| 'outlined' \| 'ghost' \| 'soft'` (Badge, Alert, SideMenu follow them). Include a `danger` value on any destructive action control |
| `tone` | what it **means**, separate from `variant`: `'neutral' \| 'accent' \| 'info' \| 'success' \| 'warning' \| 'danger'` (Badge, Alert). Never put meaning in `variant` |
| `size` | `'md' \| 'sm'` — density modifier, declared via `allowedValues`. The class swap must be **idempotent**: remove the previous modifier before adding the next, and fall back to the default on an unknown value |
| `position` | `'static' \| 'fixed'` |
| `direction` | `'normal' \| 'reverse'` |
| `labelPlacement` | `'left' \| 'right' \| 'top' \| 'bottom'` |

### 3.4 Item shapes with an action

A `callback` key inside an `options`/`items` entry marks that entry as an **action** rather than a
destination (`DropDown` options). It is checked **before** any navigation key, so an entry carrying
both runs the callback and does not navigate. Without it, the only way to express a non-navigating
item is a placeholder `href: '#'` that goes nowhere.

---

## 4. Structured array shapes

Use the shape that matches the **semantics**, and keep it identical across similar components.

| Use case | Canonical item shape | Components |
| --- | --- | --- |
| Navigation links | `{ text, path, icon?, type?, options? }` | Navbar, BottomNav, FloatingDock |
| Selectable data options | `{ label, value }` (configurable via `visibleProp`) | Select |
| Link menu entries | `{ text, path }` | DropDown |
| Tab definitions | `{ id, label }` | Tabs |
| Tree nodes | `{ value, path?, items? }` | TreeView, TreeItem |
| Table rows | `string \| number \| Node \| { html }` per cell (§6) | Table |

> Rule of thumb: **navigation-like** items use `text` + `path`; **data/value** options use
> `label` + `value`. Do not mix `text`/`label` arbitrarily within one domain.

---

## 5. Icons

Icons are always passed as an object referencing the built-in icon font:

```js
icon: { name: 'rocket', iconStyle: 'filled' }   // iconStyle: 'filled' | 'outlined'
```

- Prop name is `icon` (never `iconName`/`iconObj`).
- Sizing/color are the consumer's concern via the host; inside a component pass
  `color: 'currentColor'` so the icon inherits the surrounding text color.

---

## 6. `customColor` (per-instance color override)

**Canonical shape:**

```js
customColor: { background, text, accent }
```

| Key | Meaning |
| --- | --- |
| `background` | main surface / fill color |
| `text` | foreground / label color |
| `accent` | active/checked/highlight color |

Each component uses the subset it needs (Button → `background`/`text`; Switch & Checkbox →
`accent`; Card → `background`/`text`/`accent` plus its own `card` surface).

**Deprecated forms (still accepted, warn once):**

| Deprecated | Maps to |
| --- | --- |
| `{ button, label }` (Button/Navbar) | `{ background, text }` |
| a bare color string (Switch/Checkbox) | `{ accent }` |

Always prefer **theme tokens** over hardcoded hex (`var(--primary-color)`, etc., §9).

---

## 7. Deprecation & backward-compatibility policy

This repo is the live registry, so renames must not break existing projects. Use the
**alias pattern**:

1. Declare the **canonical** prop **first** in `static props`, the deprecated alias **after**
   it (declaration order = the order `setComponentProps` applies them).
2. Both map to a single backing field (e.g. `_onClick`).
3. The canonical setter ignores non-functional/`null` defaults; the alias setter fills the
   field only if still empty (`??=`) and warns **once**.

```js
const _sliceDeprecated = new Set();
function deprecate(oldName, newName) {
  if (_sliceDeprecated.has(oldName)) return;
  _sliceDeprecated.add(oldName);
  console.warn(`[Slice] "${oldName}" is deprecated; use "${newName}" instead.`);
}

static props = {
  onClick:         { type: 'function', default: null },  // canonical, declared first
  onClickCallback: { type: 'function', default: null },  // deprecated alias
};

set onClick(fn)         { if (typeof fn === 'function') this._onClick = fn; }
set onClickCallback(fn) { if (typeof fn === 'function') { this._onClick ??= fn; deprecate('onClickCallback', 'onClick'); } }
get onClick()           { return this._onClick; }
```

> **Why the order matters:** `setComponentProps` does `this['_'+prop] = null; this[prop] = value`
> for each prop. The framework resets `_onClickCallback` (not `_onClick`) when processing the
> alias, so the shared `_onClick` set by the canonical prop survives. Type is **not** enforced
> by the framework, so a setter may safely accept more than its declared `type`.

**Never** delete a deprecated alias in a patch/minor release. Removal is a major-version,
documented breaking change.

---

## 8. CSS encapsulation (required)

Component styles must be **scoped under the custom-element tag**. App-wide styles live in
`src/Styles/sliceStyles.css`, never in a component's `.css`.

```css
/* ❌ leaks globally */
.slice_button { ... }

/* ✅ encapsulated */
slice-button .slice_button { ... }
```

- Generic class names (`.eye`, `.active`, `.disabled`, `.symbol`, `.menu_open`) are especially
  dangerous unscoped — always prefix with the tag.
- Keyframe names are global: prefix them (`slice_input_shake`).
- Elements appended to `document.body` (e.g. a tooltip bubble) are the exception and use a
  globally-unique class (`slice-tooltip-bubble`).

### 8.1 Always declare an explicit host `display`

A custom element with no `display` rule **defaults to `display: inline`**, which silently breaks
`width`/`height`, drops vertical `margin`, and sits the component on the text baseline. There is no
global default, so **every component must set `display` on its own tag** as the first rule of its
`.css` — never rely on the inline default.

```css
/* ✅ host display is explicit */
slice-input  { display: block; }         /* full-width form / layout / data blocks */
slice-button { display: inline-block; }  /* content-sized controls that sit inline */
```

Pick the value by role:

| `display` | Use for |
| --- | --- |
| `block` | form fields, layout/data containers, full-width strips (Input, Select, Textarea, Card, Grid, Form, Tabs, Navbar, Pagination, Breadcrumbs, TreeView, Layout, …) |
| `inline-block` | content-sized interactive controls meant to flow inline (Button, Switch, Checkbox, Icon) |
| `inline-flex` / `flex` | when the host itself is the flex container (ToolTip) |
| `contents` | pure wrappers that must not introduce a box (Modal) |

> The value is a low-specificity element selector, so a consuming app can still override it
> (`slice-button { display: flex }` in app CSS, or a higher-specificity rule). Setting it just
> removes the broken `inline` default — it doesn't lock layout.

### 8.2 If JS assigns `.hidden`, the CSS must carry a `[hidden]` companion

`el.hidden = true` is silently **ignored** as soon as any author-level rule sets `display` on that
element. The browser's `[hidden] { display: none }` lives in the **user-agent** stylesheet, and
cascade *origin* is resolved before specificity — so any author rule at normal priority beats it at
any specificity.

```css
/* ❌ display wins; .hidden = true does nothing */
slice-badge .slice_badge { display: inline-flex; }

/* ✅ same-file companion, always */
slice-badge .slice_badge[hidden] { display: none; }
```

Rule: **in the same edit that adds a `display` to an element, add the `[hidden]` companion if
anything in your JS toggles `.hidden` on it.** This is a silent failure — the element just stays
visible and nothing errors.

---

## 9. Lifecycle, safety & accessibility baseline

**Lifecycle (per the framework):**
- `slice.attachTemplate(this)` is the **first** statement in the constructor.
- `slice.controller.setComponentProps(this, props)` is the **last**.
- `await` every `slice.build()`.
- Implement `update()` when used inside a cached `MultiRoute`.

**Cleanup:** remove any `window`/`document` listeners, timers, and observers in
`beforeDestroy()`. Listeners on the component's own node and Slice subscriptions
(`slice.events.bind`, `slice.context.watch`) are auto-cleaned — do not clean those.
- **`beforeDestroy()` is the ONLY teardown hook.** The framework calls that name and nothing else —
  a method called `destroy()`, `dispose()` or `teardown()` is **dead code that reads like it works**,
  which is the worst failure mode in a registry because consumers copy the pattern. This repo shipped
  it three times (`Route`, `MultiRoute`, `UnsavedChangesGuard`) before it was caught. Verified in
  `Slice.js` / `Controller.js`: `if (typeof component.beforeDestroy === 'function')` is the only hook
  invocation.
- **Put teardown in `beforeDestroy()`, not `disconnectedCallback()`.** `disconnectedCallback` also
  fires on *temporary* detach (router caching, `innerHTML=''`) and `init()` does **not** re-run on
  reconnect — tearing listeners down there breaks a detach/reattach cycle (see Modal).
- **Destroy any component/Service you built with `slice.build`.** A parent's destroy does **not**
  reliably cascade to them, and a **Service has no DOM so it is never auto-cleaned by anything**.
  Destroy them explicitly with `slice.controller.destroyComponent(...)` (see Table → DataGridEngine +
  Pagination). App-lifetime singletons are the exception — they are never destroyed.
- **The destroy cascade only covers what was inside the parent's DOM when `init()` finished.** Anything
  appended to `document.body`, built *after* `init()`, or built outside the subtree is invisible to
  `childrenIndex` and must be destroyed by hand.

**Safety:**
- No `innerHTML` for dynamic or user-supplied content. Use `textContent`, DOM nodes, or an
  explicit `{ html }` opt-in for trusted markup (see Table).
- **`innerHTML` is only ever assigned from `HtmlService`.** If a component finds itself wanting to
  turn a string into markup, that string is a trust boundary: route it through `esc()` as you
  interpolate, then `sanitize()` for your own HTML or `sanitizeRichText()` for content someone else
  wrote (`sanitize()` allows `<img>`, which leaks the reader's IP in foreign content). Do not widen
  DOMPurify's allowlist to make something render — `sanitize()` already passes inline SVG through.
- Build links/attributes with `setAttribute`/`textContent`, not string templates.
- No hover-only dismissal (`mouseleave`/`mouseenter` as the only close path) — it breaks on
  touch. Use outside-click + an explicit close affordance; gate hover behavior with
  `matchMedia('(hover: hover) and (pointer: fine)')` if needed.

**Accessibility baseline:**
- Interactive non-native elements get `role`, `tabindex="0"`, and keyboard handlers
  (`Enter`/`Space`, `Escape` to dismiss).
- Disclosure triggers expose `aria-expanded`; listboxes/options use `role="listbox"`/`option`
  + `aria-selected`; tooltips use `role="tooltip"`; tables set `scope="col"` on `<th>`.
- Native `<button>` already gives focus + keyboard for free — prefer it, and add
  `type="button"` to avoid accidental form submits.
- **Never hide a real `<input>` with `display: none`.** It is dropped from the accessibility tree
  *and* the tab order, so the control becomes keyboard-unreachable. Use the visually-hidden pattern
  (`position: absolute; 1px; clip-path: inset(50%)`) and draw the focus ring on the visible
  surrogate, since the input itself has no box to outline.
- Decorative animation (shakes, pops, spinners, ripples, press transforms) must run inside
  `@media (prefers-reduced-motion: no-preference)` or be neutralised in a
  `prefers-reduced-motion: reduce` block. Never `infinite` on an *error* state — it is a
  persistent distraction, not feedback.

---

## 10. `static props` declaration

```js
static props = {
  value:    { type: 'string',   default: '' },
  disabled: { type: 'boolean',  default: false },
  variant:  { type: 'string',   default: 'default', allowedValues: ['default', 'outlined'] },
  onChange: { type: 'function', default: null },
  name:     { type: 'string',   required: true },   // no default → required
};
```

- Always provide a `default` unless the prop is `required`.
- **Internal state must not be named `_<propName>`.** `setComponentProps` nulls the backing field
  it derives from **every** declared prop, canonical or deprecated alias. A private flag named
  `_isActive` next to a deprecated `isActive` prop gets silently wiped to `null` at build time. Use a
  name no prop can derive (`_running`, `_mounted`).
- Use `allowedValues` for enumerated props (dev-mode validation enforces it).
- `type` is documentation/inspector metadata — **not** runtime-enforced — so setters must still
  guard their own inputs.
- **`allowedValues` must be a literal array, never a reference to a shared constant.**
  `slice types generate` reads the AST of the component file and only understands literal values,
  so `allowedValues: SIZE_VALUES` silently degrades the generated union to plain `string` — no error,
  no warning, just a wider type. Keep the list as the **single** source inside `static props` and
  have the setter read it back:

  ```js
  size: { type: 'string', default: 'md', allowedValues: ['sm', 'md', 'lg'] },

  set size(value) {
    const { allowedValues, default: fallback } = this.constructor.props.size;
    const next = allowedValues.includes(value) ? value : fallback;
    // ...
  }
  ```

  That way the runtime fallback and the emitted union cannot disagree. See `BACKLOG.md` (Tooling) for
  the generator fix that would make shared vocabularies type again.

---

## 11. Canonical theme variables

Use these tokens instead of hardcoded colors. **Required** (15):

```
--primary-color              --primary-background-color   --primary-color-contrast
--primary-color-shade        --secondary-color            --secondary-background-color
--secondary-color-contrast   --tertiary-background-color  --font-primary-color
--font-secondary-color       --success-color              --warning-color
--danger-color               --medium-color               --disabled-color
```

**Optional / recommended:**

```
--primary-color-rgb   --secondary-color-rgb   --accent-color
--success-contrast    --warning-contrast      --danger-contrast   --medium-contrast
--border-radius-slice --slice-border          --font-family       --font-family-code
```

Prefer `color-mix(in srgb, var(--token) X%, transparent)` for tints over raw `rgba()`.

---

## 12. Migration map (this library)

| Component(s) | Deprecated | Canonical |
| --- | --- | --- |
| Button, TreeView, TreeItem | `onClickCallback` | `onClick` |
| Select | `onOptionSelect` | `onChange` |
| Tabs | `onTabChange` | `onChange` |
| Switch | `toggle` | `onChange` |
| Button (and nav button items) | `customColor: { button, label }` | `customColor: { background, text }` |
| Switch, Checkbox | `customColor: '<string>'` | `customColor: { accent }` |
| Table cells | raw HTML string → injected | text by default; DOM node, or `{ html }` opt-in |
| Button | hardcoded icon size/colour | `icon: { size, color }` honoured per instance |
| DropDown options | placeholder `href: '#'` for an action | `callback` key in the option |

All deprecated forms continue to work and emit a one-time console warning.

---

## 13. Data-driven components: sources, states and loading

Applies to every component that shows **records** (DataList, Table, DescriptionList) or loads
anything over the network. The app-developer side of the same rules is the docs guide
**Data and the first load** (`src/markdown/guide-data-and-loading.md`).

### 13.1 Never await the network in `init()` or `update()`

The router shows the app's loader (`slice.loading`) around **the whole build of the route**: it
calls `loading.start()`, awaits `slice.build()` of the route component (which awaits its `init()`,
and every `slice.build()` that `init()` awaits), or `update()` for a cached route, and only then
`loading.stop()`. One `await fetch()` in an `init()` keeps the whole page behind the loader, and
nested ones run **one after the other**.

So: `init()` builds the structure and returns. Data is started **without** `await`
(`this._fetch()`), and the component shows its own loading state until it arrives.

### 13.2 Three sources, one vocabulary

| Prop | Meaning |
| --- | --- |
| `items` (`rows` in Table) | an array the app owns; setting it again redraws |
| `context` + `contextPath` | a `slice.context` context and the path of the data in it (`'items'` for lists, `''` when the state is the data). The component **watches** it, and **writes its changes back** to it |
| `load` | `async ({ …query, signal }) => result`. Lists receive `{ page, pageSize, search, filters, sort, view, signal }` and return `{ items, total }` or an array; one record returns the record |

- One request at a time: a new one **aborts** the previous (`AbortController`); `beforeDestroy()`
  aborts too. A late answer to an aborted request is ignored.
- A burst of query changes (sort + page reset) makes **one** request (queue it in a microtask).
- `reload()` asks again; `update()` (a cached route that came back) calls it.
- `onError(error, { type, … })` for every failure: `type` is `'load'`, `'add'`, `'update'`,
  `'remove'`, `'edit'` or `'save'`.

### 13.3 The states every data component shows

| State | What the user sees |
| --- | --- |
| first load | a **skeleton** shaped like the content (never an empty box, never a spinner over nothing). The first paint is already the skeleton |
| loading again | the old content stays, marked busy (`aria-busy`, a thin progress line or the component's overlay) |
| empty | an EmptyState saying what would be here, with the action that fills it |
| no results | "Nothing matches" and a way to clear the search and filters |
| error | what failed and **Try again** (`role="alert"`). Never a blank area |
| saving | the row / field / cell busy, the rest usable |

### 13.4 Changing data: commit first, or optimistic with rollback

- **CRUD methods** are `addItem` / `updateItem` / `removeItem` (`addRow` / `updateRow` /
  `removeRow` in Table). Never `update()`: that name belongs to the framework (§9).
- Options are always `{ commit, … }`. A **list change is optimistic**: it shows at once; if
  `commit` throws, it is taken back and an error Alert says so. `removeItem(…, { undo: true })`
  waits for the undo time before calling `commit`.
- A **field or cell edit is commit-first**: `commit({ key, value, previous, … })` runs while the
  field is busy, and the record changes when it resolves. If it throws or returns `false`, the
  old value stays and the field shows the error's message. A returned object replaces the record.
- Arrays and records are **never mutated**: every change makes a new one
  (`shared/data/collection.js`, `writePath`), so a context sees it.
- A component built from data must not lose what someone is typing when the context updates
  elsewhere (keep the open editor; redraw it when it closes).

### 13.5 Editing uses `edit`

A field or column is editable with `edit: true | type | { type, options, required, min, max,
step, validate(value, record), parse(value) }`. The control is chosen by
`shared/editing/inlineControl.js`, so the same `edit` works in DescriptionList and Table.

---

## 14. Code organisation: component, part or shared

| It… | It is a… | Where |
| --- | --- | --- |
| has markup of its own, and an app would use it alone with props | **component** | `Visual/<Name>/` (no markup but state: `Service/<Name>/`) |
| is a piece of one component | **part** | `Visual/<Name>/parts/` |
| is used by two or more components, and is neither | **shared** | `src/Components/shared/` |

- `shared/README.md` lists every shared file and who uses it; update it when you add a user.
- A component's own `.js` has **only** `export default` (named exports break the bundler);
  parts and shared files may have named exports.
- Class files are PascalCase (`parts/Selection.js`), function files camelCase by subject
  (`data/dates.js`). Every file starts with what it is and who uses it.
- When shared code starts drawing its own interface, make it a component (that is how DataList's
  and Table's undo bar became `Alert`).

---

## 15. Checklist for a new/updated component

- [ ] Props follow §3–§6 vocabulary; new aliases follow §7.
- [ ] `static props` complete with defaults / `allowedValues` (§10).
- [ ] CSS fully scoped under the tag; keyframes prefixed; **explicit host `display`** (§8 / §8.1).
- [ ] No `innerHTML` for dynamic content; links via `setAttribute` (§9).
- [ ] Teardown is in `beforeDestroy()` — never `destroy()`/`dispose()`/`unmount()` (§9).
- [ ] Every element whose `.hidden` is toggled in JS has a `[hidden]` companion rule in the same file (§8.2).
- [ ] No hover-only dismissal; touch works (§9).
- [ ] `beforeDestroy()` cleans global listeners/timers/observers (§9) **and destroys any child
      Service/component built with `slice.build`** (not auto-cascaded; Services have no DOM).
- [ ] Resource/listener teardown is in `beforeDestroy()`, not `disconnectedCallback()` (§9).
- [ ] A11y: role/tabindex/keyboard/aria as applicable (§9).
- [ ] Colors via theme tokens (§11).
- [ ] Registered in `src/Components/components.js`.
- [ ] **Test added/updated**: `<Component>.spec.js` next to the component, covering smoke
      render, props/setters, deprecated aliases (§7) if any, handlers, and a11y. `pnpm run
      test:e2e` passes. See `playwright/README.md`.
- [ ] Markdown doc added/updated in `src/markdown/` using canonical names; run `docs:generate` + `docs:lint-md`.
      The doc says **when to use it and when not**, and its examples are complete app scenarios that
      use other components.
- [ ] Root class identical to the component name (`slice-<name>`), parts in BEM, variants as
      `data-*` (§2).
- [ ] Loads data? Not awaited in `init()`/`update()`; `items`/`context`/`load`; skeleton, empty,
      error with Try again; requests aborted on destroy (§13).
- [ ] Changes data? `{ commit }` with rollback, never mutating the input (§13.4).
- [ ] Code it shares lives in `shared/` (README updated), its private pieces in `parts/` (§14).
- [ ] Built-in texts are `slice.*` keys with en/es defaults from `shared/text/texts.js`, marked with
      `data-t`; text props win and routes use `slice.path` / `slice.href()` (§16).
## 16. Built-in texts, formatting and routes under `slice.translator`

A component that writes text by itself (a close label, "No results", "Try again") does not hardcode
English. It ships **keys with defaults**, so it works in an app without the translator and translates
itself when the app enables it.

1. **Keys live under `slice.<namespace>`**: `slice.notFound.title`, `slice.table.noRows`. One
   namespace per component keeps an app override obvious (`slice.modal.close`).
2. **Defaults come from `shared/text/texts.js`**, at module scope (before the first template is
   translated), with English **and** Spanish:
   ```js
   import { texts } from '../../shared/text/texts.js';
   const t = texts('slice.notFound', {
      en: { title: 'Page Not Found' },
      es: { title: 'P�gina no encontrada' },
   });
   ```
   They go to the translator's `defaults` layer: an app dictionary always wins, and with the
   translator off `t()` returns the English default.
3. **Templates are marked, not written**: `<h2 data-t="slice.notFound.title">Page Not Found</h2>`.
   An attribute needs its own entry (`key.ariaLabel`) and `data-t` on the element.
4. **Text props still win.** Read the prop when painting, not once in the constructor; when an
   instance prop overrides a built-in text, write the prop's text and remove that element's `data-t`.
5. **Text passed as a prop is a marker**: `slice.t.ref('slice.modal.close')`, so it is
   re-assigned on a locale change.
6. **Formatting** goes through `slice.translator.format.*` (dates, numbers, lists) unless the
   component has an explicit `locale` prop for a fixed-format column � then that locale wins.
7. **Routes and links**: read `slice.path` and build anchors with `slice.href(path)`, never
   `window.location.pathname` or a raw `href`. The router owns locale prefixes and keeps `/en/x` out
   of route matching.
