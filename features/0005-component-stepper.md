---
id: "0005"
title: "Component: Stepper"
repo: "slicejs-components"
status: proposed
area: components
priority: medium
created: 2026-10-28
updated: 2026-10-28
target: "TBD"
owners: []
related:
  - "src/Components/Visual/Tabs/Tabs.js"
  - "src/markdown/tabs.md"
  - "src/Components/Visual/Form/Form.js"
  - "src/markdown/form.md"
  - "src/Components/Visual/Breadcrumbs/Breadcrumbs.js"
  - "COMPONENT_API_STANDARDS.md"
---

# Component: Stepper

## Summary

A `Stepper` shows a multi-step task as an ordered row (or column) of steps: done, current, upcoming, optional error. It is the progress model for a wizard, a checkout, an onboarding flow or a settings assistant, and it pairs with `Form` rather than replacing it.

## Problem / motivation

A multi-step form currently has no shared navigation model. Apps hand-roll numbered circles and connectors, then reimplement the states (complete, current, disabled, error), the keyboard order and the mobile layout. `Tabs` is close, but tabs are sibling views, not an ordered process: a tab can be opened in any order and has no “done” state.

The missing piece is not just visuals. Users need to know where they are, what is done, what is blocked and whether they can go back.

## Proposed direction

```js
const stepper = await slice.build('Stepper', {
  active: 'payment',
  steps: [
    { id: 'cart', label: 'Cart', status: 'done' },
    { id: 'address', label: 'Address', status: 'done' },
    { id: 'payment', label: 'Payment', status: 'current' },
    { id: 'review', label: 'Review', status: 'upcoming', disabled: true }
  ],
  linear: true,          // cannot jump ahead of the first incomplete step
  clickable: true,       // completed/current steps are buttons; future steps are not
  orientation: 'horizontal',
  onChange: (id) => goToStep(id)
});
```

- `steps` items: `{ id, label, description, icon, status, disabled }`.
- `status`: `upcoming` (default), `current`, `done`, `error`; `active` is the convenience prop that marks one step current.
- `linear` gates forward navigation; `clickable` controls whether completed steps are actionable. A step that is `disabled` is never clickable.
- `orientation`: `horizontal` (default) and `vertical`.
- The component reports `onChange(id, { previous, step })` and the `step-change` event; it does not own the panel content. Consumers render the panel with `Tabs`-like local state or a router.
- Looks: numbered circles with connectors, `size`, `tone` for the current step, `marker: 'number' | 'icon' | 'dot'`.
- Mobile: horizontal becomes a compact “Step 2 of 4 — Payment” summary with a `Details`-like reveal, or scrolls with the active step in view. Decide in the design pass.
- CSS variables for connector, completed, current and error colors.

Composition to document:

- checkout with Back/Continue actions
- onboarding with optional steps
- vertical settings wizard
- error state after a failed save.

## Alternatives considered

- **Extend `Tabs` with a `steps` variant.** Rejected: tabs have no order, completion or gating; adding them would make `Tabs` carry two mental models.
- **Only document a pattern with `Breadcrumbs`.** Rejected: breadcrumbs are location, not progress or gating.
- **Let the app own everything and ship only CSS.** Rejected: the keyboard order and ARIA states are exactly what gets forgotten.

## Scope

### In scope

- `Stepper` with `steps`, `active`, statuses, orientation, `linear` and `clickable`.
- Keyboard navigation across actionable steps.
- Horizontal and vertical layouts; compact mobile behavior.
- Component spec, Markdown page with live scenarios, generated docs route and registry entry.

### Out of scope

- A full wizard engine, form validation or route orchestration.
- Animated transitions between step panels (the consumer owns the panel).
- Nested sub-steps in v1.
- A timeline/history component.

## Compatibility and risk

- Public API impact: new component; no existing API changes.
- Existing apps affected: none.
- Migration / breaking change: none.
- Security / performance: static DOM, no data fetching.
- Accessibility risk: steps are not tabs. Use an ordered list (`<ol>`) with `aria-current="step"` on the current item, not `role="tablist"`. Only actionable steps are buttons; future disabled steps are text.

## Validation plan

- Unit tests: status normalization, `active`, `linear`, `clickable`, orientation classes, `onChange`.
- Browser/e2e tests: keyboard order, disabled/future steps, horizontal and vertical, 320px compact mode, reduced motion.
- Product check (Conclave): not required until adoption.
- Artifact/release check: `pnpm run build`; docs and registry generated.

## Documentation impact

- Framework docs pages: none.
- Component docs: `src/markdown/stepper.md`, with “Stepper, Tabs or Breadcrumbs?”.
- Skill / agent guidance: add to the component catalog and form guidance when shipped.
- Workspace docs: the lab can use it for the feature create/edit flow once the editor exists.

## Open questions

- [ ] Does the component own panel content, or only the step indicator? Recommendation: only the indicator.
- [ ] Is `active` redundant with `status: 'current'`? Keep `status` as the source and `active` as sugar.
- [ ] What exactly happens on mobile: horizontal scroll, compact summary, or vertical by default?
- [ ] Should `linear` block only forward jumps, or also hide future steps entirely?

## Decision log

- 2026-10-28 - Created as `proposed` from `WANTED_COMPONENTS.md`.
