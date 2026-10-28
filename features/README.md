# Features

Durable specs for work in this repository. The workspace standard lives in
[`docs/FEATURES.md`](../../../docs/FEATURES.md); this page only adds the rules for **wanted components**.

## One wanted component, one feature

`WANTED_COMPONENTS.md` is an **index**, not a second spec. Every component we want to add has its
own feature file here, with the API sketch, states, accessibility, scope, validation and docs impact.
The feature frontmatter is the source of truth for status; the index only links to it.

Why one file per component:

- the idea survives a contributor changing their mind or disappearing;
- the API discussion has one home, next to the library's conventions;
- the lab ledger can show every wanted component without a parallel database;
- "shipped" is a status and a decision log, not a row someone forgot to delete.

## Creating a wanted component

```bash
pnpm feature:new "Component: Skeleton" --area components --priority medium
```

Then:

1. Fill the canonical sections from [`features/_TEMPLATE.md`](../../../features/_TEMPLATE.md).
2. Add the component-specific parts: API sketch, variants and states, accessibility, docs page,
   spec plan and what is explicitly out of scope.
3. Link `WANTED_COMPONENTS.md` to the new file.
4. Commit in **this** repository, not in the workspace.

The area is always `components`; the repo is inferred as `slicejs-components`. Use a title in the
form `Component: <Name>` so the lab can group wanted components without a new frontmatter field.

This is a local, single-user workflow: moving the feature to `planned` or `in-progress` is the only
coordination needed. No issue, approval or claim step is required. The tracking issue is optional
when the public repository needs to avoid duplicate work.

## What a wanted component must answer

| Section | The question it answers |
|---|---|
| Summary | What is it, in one paragraph? |
| Problem / motivation | What do apps do today, and what breaks? |
| Proposed direction | API sketch, variants, states, a11y, reduced motion |
| Alternatives | Why not extend an existing component or a pattern? |
| Scope | What ships in v1, and what is explicitly later |
| Compatibility and risk | API impact, migration, security, performance |
| Validation | Unit, e2e, visual, product check |
| Documentation impact | Markdown page, generated route, skill, lab |
| Open questions | Decisions that need evidence, not guesses |
| Decision log | Dated decisions, including rejection |

A wanted component with no API sketch or no a11y section is still `proposed`; it is not ready for
`planned`.

## Lifecycle

1. **`proposed`** - captured. Writing it is not approval to build it.
2. **`planned`** - accepted for a cycle. The API sketch, states, a11y, docs and test plan are
   filled; `target` is set.
3. **`in-progress`** - someone is building it. Link the branch/issue in `related`.
4. **`blocked`** - waiting on a decision or another component. Say which one in the body or
   `related`.
5. **`done`** - component, spec, Markdown page, generated docs, registry and build are complete.
   Move the row from **Open wanted components** to **Shipped** in `WANTED_COMPONENTS.md`; add the docs link.
6. **`rejected`** - decided against. Keep the reasoning; do not delete the file.

## Definition of done

- `<Component>.js`, `.html` and `.css` in `src/Components/Visual/` (or `Service/`).
- `<Component>.spec.js` covering smoke, props/setters, handlers and a11y.
- `src/markdown/<component>.md` with realistic `:::script` scenarios.
- `pnpm run docs:lint-md`, `pnpm run docs:generate`, registry entry.
- `pnpm run build` passes.
- `WANTED_COMPONENTS.md` row moved to shipped with a docs link.
- Decision log entry in this feature with the commit/PR.

The lab consumes this folder automatically through the workspace feature payload, so a new wanted
component appears in the feature ledger without another list to maintain.

## Index

- [`WANTED_COMPONENTS.md`](../WANTED_COMPONENTS.md) - open wanted components and the shipped list.
- [`BACKLOG.md`](../BACKLOG.md) - defects and tooling for components that already ship.
