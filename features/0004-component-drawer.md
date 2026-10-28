---
id: "0004"
title: "Component: Drawer"
repo: "slicejs-components"
status: proposed
area: components
priority: high
created: 2026-10-28
updated: 2026-10-28
target: "TBD"
owners: []
related:
  - "src/Components/Visual/Modal/Modal.js"
  - "src/Components/Visual/Modal/Modal.css"
  - "src/markdown/modal.md"
  - "src/Components/Visual/SideMenu/SideMenu.js"
  - "COMPONENT_API_STANDARDS.md"
---

# Component: Drawer

## Summary

A `Drawer` is a panel that slides in from an edge of the screen: filters on the right, navigation on the left, a task on the bottom on a phone. It is modal like `Modal` (focus trap, backdrop, Escape, scroll lock), but its shape is anchored to an edge and its content usually stays in context.

## Problem / motivation

`Modal` covers centered dialogs. When an app needs a side panel — filters, a details inspector, a mobile menu — it either stretches `Modal` into something it was not designed for or hand-rolls a fixed `<div>` without a focus trap, scroll lock, `inert` background or focus return.

That is the class of bug that looks fine with a mouse and fails with a keyboard: focus stays behind the panel, Escape closes the wrong layer, or the page underneath scrolls. The lab already has a left rail, which is not a Drawer: it is persistent navigation, not an overlay.

## Proposed direction

```js
const drawer = await slice.build('Drawer', {
  side: 'right',          // 'left' | 'right' | 'top' | 'bottom'
  size: 'md',             // 'sm' | 'md' | 'lg' | CSS length
  title: 'Filters',
  description: 'Narrow the ledger',
  content: filtersNode,
  actions: [
    { value: 'Reset', variant: 'ghost', onClick: reset },
    { value: 'Apply', variant: 'filled', onClick: apply }
  ],
  onBeforeClose: () => hasUnsavedChanges ? confirm() : true,
  destroyOnClose: true
});
drawer.show();
```

- `side` chooses the edge. `left`/`right` are full height; `top`/`bottom` are full width.
- `size` is the width (left/right) or height (top/bottom); it accepts a token or a CSS length.
- `title`, `description` and `icon` form the header; `content` and `actions` mirror `Modal`.
- `open`, `show()`, `hide()`, `requestClose(reason)` and `onBeforeClose` keep the same close contract as `Modal`, including `reason` values (`escape`, `backdrop`, `close-button`, `action`, `swipe`, `api`).
- Focus is trapped inside while open and returns to the trigger on close. The background is `inert`/`aria-hidden` as in `Modal`.
- The body scroll is locked; nested `Modal` or a second `Drawer` should stack, not fight over the lock. Reuse the scroll-lock bookkeeping, not a second implementation.
- `<dialog>` in the top layer is the likely base, with `showModal()`; the panel is positioned to the edge.
- Width/height animate, but `prefers-reduced-motion` removes the slide.
- Mobile: `bottom` is the natural filter/task sheet; `right` may become full width below 640px.

## Alternatives considered

- **Add `layout: 'drawer'` to `Modal`.** Tempting because the focus/scroll/Escape logic is shared, but `Modal` already carries centered-dialog assumptions (size, mobile fullscreen, swipe). A separate component can reuse helpers without growing a two-in-one API. Keep the shared close/scroll-lock primitives in a module, not in the public prop surface.
- **A non-modal `Panel`.** Useful later, but most real drawers need the modal semantics. A `modal: false` option can be an explicit follow-up.
- **Reuse `SideMenu`.** Rejected: `SideMenu` is navigation chrome, not an overlay with a backdrop.

## Scope

### In scope

- `Drawer` with four sides, sizes, header, content, actions and the close contract.
- Focus trap, focus return, Escape, backdrop, scroll lock and nested-layer behavior.
- Reduced motion and mobile behavior.
- Component spec, Markdown page with live scenarios, generated docs route and registry entry.

### Out of scope

- A persistent docked panel (that is layout, not an overlay).
- Drag-to-resize or swipe-to-close in the first version (swipe can follow once the base is solid).
- Route-aware drawers or a navigation framework.
- A generic popover.

## Compatibility and risk

- Public API impact: new component; no existing API changes.
- Existing apps affected: none until adopted. The lab's sidebar stays as it is.
- Migration / breaking change: none.
- Security / performance: no `innerHTML` for dynamic content; one scroll-lock owner at a time; no layout reads per frame.
- Accessibility risk: this is the whole point of the component. The spec must cover focus trap, focus return, Escape, `aria-modal`, background inertness and a visible close button.

## Validation plan

- Unit tests: props, side/size classes, open/close, `onBeforeClose` reasons.
- Browser/e2e tests: focus moves in and returns, Tab stays inside, Escape and backdrop, scroll lock, nested Modal/Drawer, reduced motion, 320px bottom sheet.
- Product check (Conclave): not required before adoption; run `verify:conclave` if shared Modal helpers change.
- Artifact/release check: `pnpm run build`; docs and registry generated.

## Documentation impact

- Framework docs pages: none.
- Component docs: `src/markdown/drawer.md`, with a “Drawer, Modal or SideMenu?” section.
- Skill / agent guidance: add to the component catalog and the overlay guidance when shipped.
- Workspace docs: the lab can use it for the feature filters or spec actions once it exists.

## Open questions

- [ ] Standalone component or a `Modal` layout variant with shared internals?
- [ ] First version: `<dialog>` + top layer, or a fixed overlay like the current `Modal`?
- [ ] Should `top`/`bottom` be in v1, or only `left`/`right`?
- [ ] How do two open layers share the scroll lock without double-locking?

## Decision log

- 2026-10-28 - Created as `proposed` from `WANTED_COMPONENTS.md`; priority high because it blocks common app layouts.
