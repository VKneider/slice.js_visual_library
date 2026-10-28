# Wanted Components

Components we would like to add to the library. Each wanted component is a **feature** in
[`features/`](./features/), so the API, states, accessibility, docs and validation live in one
durable file. This page is the index: the feature frontmatter is the source of truth for status.

**Before you start:** read [`CONTRIBUTING.md`](./CONTRIBUTING.md),
[`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md) and
[`features/README.md`](./features/README.md). Scaffold with `pnpm slice:create <Name>`, test with
`pnpm run test:gate`, and add `src/markdown/<name>.md`.

**Starting one:** move the feature to `planned` or `in-progress` before writing code. Local
single-user work needs no issue or approval; if the repository is public and you want to avoid
duplicate work, leave a note on the tracking issue.

**Size legend:** `S` small, `M` medium, `L` large.

## Open wanted components

| Component | What | Size | Priority | Feature |
| --- | --- | --- | --- | --- |
| **Skeleton** | Loading placeholder blocks: text, rect, circle, paragraph | S | medium | [`0002`](./features/0002-component-skeleton.md) |
| **ProgressBar** | Determinate progress with `value`/`max`, label and tone | S | medium | [`0003`](./features/0003-component-progressbar.md) |
| **Drawer** | Edge panel with backdrop, focus trap, scroll lock and actions | M | high | [`0004`](./features/0004-component-drawer.md) |
| **Stepper** | Ordered steps with done/current/error, linear gating | M | medium | [`0005`](./features/0005-component-stepper.md) |
| **Virtualized list** | Windowed list for thousands of rows, fixed height first | L | low | [`0006`](./features/0006-component-virtualized-list.md) |

## How a wanted component becomes a component

1. **Proposed** - the feature exists and the problem is written down. Not approval to build.
2. **Planned** - API sketch, states, a11y, docs and test plan are filled; a cycle is chosen.
3. **In progress** - component, spec and Markdown page are being written; branch linked in
   `related`.
4. **Done** - component, spec, docs, generated artifacts, registry and build pass. Move the row to
   the shipped list and add the docs link to the feature decision log.
5. **Rejected** - keep the file and the reasoning; remove it from the open table.

## Already shipped - do not rebuild

Form, Pagination, Table (**including row selection and `virtual`**), Select (searchable, clearable,
keyboard, virtual menu), Modal, Toast/ToastProvider, ToolTip/ToolTipProvider, Tabs, Details,
Loading, Switch, Checkbox, RadioGroup, Input (with `help`/`error`/`validate()`), Textarea, Slider,
DatePicker, Card, Grid, EmptyState, Badge, Chip, Alert, Avatar/AvatarGroup, FileUpload, and the
services `DomService`, `StoreService`, `FileDownloadService`, `HtmlService`, `DragDropService`,
`FetchManager`, `QueryService`, `ShortcutService`, `RealtimeService`, `InfiniteScrollService`,
`DataGridEngine`.

When one of these is missing a feature, it belongs in [`BACKLOG.md`](./BACKLOG.md), not here: the
component exists and the work is a defect or a tooling change.

## What makes a good PR here

- Follows [`COMPONENT_API_STANDARDS.md`](./COMPONENT_API_STANDARDS.md): canonical prop names,
  theme tokens, no `innerHTML` for dynamic content, cleanup in `beforeDestroy()`, and the a11y
  baseline (role, tabindex, keyboard, ARIA).
- Ships with a `<Component>.spec.js` (smoke, props, a11y, handlers) and a
  `src/markdown/<component>.md` doc with live scenarios.
- Reuses existing components where it makes sense instead of reinventing them.
- Updates this index and the feature decision log in the same PR.
