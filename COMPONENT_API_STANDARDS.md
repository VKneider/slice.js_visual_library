# Slice.js Component API & Naming Standards

> **Status:** Canonical reference for authoring components in this repository.
> **Scope:** This repo (`slice.js_visual_library`) **is the official component registry** —
> the Slice CLI downloads components from
> `raw.githubusercontent.com/VKneider/slice.js_visual_library/master/src/Components`.
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
| CSS classes | `kebab_or_snake` scoped under the tag (§8) | `slice-button .slice_button` |
| CSS keyframes | prefix with component to avoid global collision | `slice_input_shake` |
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
| `loading` | async/busy state |
| `open` | expanded/visible state (prefer over `isOpen`) |
| `items` | array of structured entries the component renders (see §4) |
| `options` | array of selectable choices (Select, DropDown) |

### 3.3 Layout / variants

| Prop | Values |
| --- | --- |
| `variant` | enumerated visual style, declared via `allowedValues` (e.g. `'default' \| 'outlined' \| 'elevated' \| 'minimal'`) |
| `position` | `'static' \| 'fixed'` |
| `direction` | `'normal' \| 'reverse'` |
| `labelPlacement` | `'left' \| 'right' \| 'top' \| 'bottom'` |

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

**Safety:**
- No `innerHTML` for dynamic or user-supplied content. Use `textContent`, DOM nodes, or an
  explicit `{ html }` opt-in for trusted markup (see Table).
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
- Use `allowedValues` for enumerated props (dev-mode validation enforces it).
- `type` is documentation/inspector metadata — **not** runtime-enforced — so setters must still
  guard their own inputs.

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

All deprecated forms continue to work and emit a one-time console warning.

---

## 13. Checklist for a new/updated component

- [ ] Props follow §3–§6 vocabulary; new aliases follow §7.
- [ ] `static props` complete with defaults / `allowedValues` (§10).
- [ ] CSS fully scoped under the tag; keyframes prefixed (§8).
- [ ] No `innerHTML` for dynamic content; links via `setAttribute` (§9).
- [ ] No hover-only dismissal; touch works (§9).
- [ ] `beforeDestroy()` cleans global listeners/timers/observers (§9).
- [ ] A11y: role/tabindex/keyboard/aria as applicable (§9).
- [ ] Colors via theme tokens (§11).
- [ ] Registered in `src/Components/components.js`.
- [ ] Markdown doc added/updated in `src/markdown/` using canonical names; run `docs:generate` + `docs:lint-md`.
