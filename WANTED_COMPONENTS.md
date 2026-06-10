# Wanted Components

Components we'd love to add to the library — a starting point if you want to contribute. Each entry
has a rough **size**, a **model-after** (an existing component to learn the conventions from), and a few
acceptance notes. Pick one, build it the Slice way, and open a PR. 💚

**Before you start:** read [`CONTRIBUTING.md`](./CONTRIBUTING.md) (setup, scaffold, test, docs, PR flow)
and [`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md) (prop vocabulary, lifecycle/cleanup,
a11y, the §13 checklist). Scaffold with `pnpm slice:create <Name>`, test with `pnpm test:e2e`, and add a
`src/markdown/<name>.md` doc (`pnpm docs:generate`).

**Claiming one:** open an issue (or comment on the tracking issue) saying which you're taking, so we
don't double up. Small, focused PRs are easier to review than one big one.

**Size legend:** 🟢 small · 🟡 medium · 🔴 large.

> Already shipped — don't re-build these: `Form`, `Pagination`, `Table` (sorting + pagination + remote),
> `Select` (searchable/clearable/keyboard), `Modal`, `Toast`/`ToastProvider`, `ToolTip`/`ToolTipProvider`,
> `Tabs`, `Details`, `Loading` (indeterminate spinner), `Switch`, `Checkbox`, `Input`, `Card`, `Grid`.

## Form controls

| Component | What | Size | Model after | Notes |
| --- | --- | --- | --- | --- |
| **Radio / RadioGroup** | Single-choice control + group | 🟢🟡 | `Checkbox`, `Switch` | `RadioGroup` owns the value; only one option selected. `name`, `options`, `value`, `onChange`, `disabled`. |
| **Textarea** | Multi-line text input | 🟢 | `Input` | Either a standalone component or `Input` with `multiline`/`rows`. Auto-grow is a nice-to-have. |
| **Input error/helper text** | Inline validation message + hint under `Input` | 🟢 | `Input` (has `conditions`) | Surface an `error` message and a `helperText`, with `aria-describedby`. Pairs with `Form`. |
| **Slider / Range** | Numeric drag selector | 🟡 | `Switch` (drag/keyboard) | `min`/`max`/`step`/`value`, keyboard (←/→/Home/End), `aria-valuenow`. Optional dual-handle range. |
| **FileUpload / Dropzone** | File picker with drag-and-drop | 🟡🔴 | `Button` | `accept`, `multiple`, drag-over state, list selected files, `onChange(files)`. |
| **DatePicker** | Calendar date selection | 🔴 | `Select`, `DropDown` | Month grid, keyboard nav, `min`/`max`, range mode later. Keep it dependency-free. |

## Feedback & display

| Component | What | Size | Model after | Notes |
| --- | --- | --- | --- | --- |
| **Alert / Banner** | Inline, persistent message (info/success/warning/danger) | 🟢 | `Toast`, `Card` | Distinct from `Toast` (ephemeral). `variant`, optional `dismissable`, icon, title + body. |
| **Badge** | Small count / status pill | 🟢 | `Button` (variants) | `variant`, `value` (count or dot). Often overlaid on an avatar/icon. |
| **Avatar** | User image with initials/fallback | 🟢 | `Icon`, `Card` | `src`, `name` → initials fallback, `size`, optional status dot. |
| **Skeleton** | Loading placeholder blocks | 🟢🟡 | `Loading` | Shimmer animation; `variant` (text/rect/circle), `lines`. Respect `prefers-reduced-motion`. |
| **ProgressBar** | Determinate progress | 🟢 | `Loading` (indeterminate) | `value`/`max`, `aria-valuenow`; indeterminate variant optional. (The spinner already covers busy state.) |
| **EmptyState** | "Nothing here" placeholder | 🟢 | `NotFound`, `Card` | Icon + title + description + optional action slot. Used by `Table` and lists. |

## Layout & navigation

| Component | What | Size | Model after | Notes |
| --- | --- | --- | --- | --- |
| **Drawer / Off-canvas** | Side panel that slides in | 🟡 | `Modal` (native `<dialog>`, scroll-lock) | `side` (left/right/top/bottom), `open`, backdrop, focus trap + `Escape`. Reuse `Modal`'s scroll-lock lessons. |
| **Accordion** | Group of collapsible panels (one/many open) | 🟢🟡 | `Details`, `Tabs` | Wraps multiple `Details`-style panels with single- or multi-expand. |
| **Stepper / Wizard** | Multi-step progress + content | 🟡 | `Tabs`, `Breadcrumbs` | `steps`, `active`, next/back; pairs nicely with `Form`. |
| **Chip / Tag** | Compact label, optionally removable | 🟢 | `Button`, `Badge` | `removable` + `onRemove`, `variant`. Useful for multi-select / filters. |

## Data

| Component | What | Size | Model after | Notes |
| --- | --- | --- | --- | --- |
| **Table row selection** | Checkbox column + selection API | 🟡 | `Table`, `Checkbox` | Enhance `Table`: `selectable`, header "select all", `onSelectionChange`. See `BACKLOG.md`. |
| **Virtualized list** | Render only visible rows for huge lists | 🔴 | `Table`, `DataGridEngine` | Windowing for performance; could back a future big `Table`. |

## What makes a good PR here

- Follows [`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md) — canonical prop names, theme
  tokens, no `innerHTML` for dynamic content, **cleanup in `beforeDestroy()`** (and destroy any child
  built with `slice.build`), and the a11y baseline (role/tabindex/keyboard/aria).
- Ships with a `<Component>.spec.js` (smoke + props + a11y + handlers) and a `src/markdown/<name>.md` doc
  with live scenarios.
- Reuses existing components where it makes sense (e.g. a `Form` field, a `Modal`/`Drawer` body) instead
  of reinventing them.
