---
title: Layout
route: /docs/layout/layout
navLabel: Layout
section: Layout
group: Containers
order: 10
description: Layout container documentation with view swapping scenarios.
component: LayoutDocumentation
generate: true
tags: [layout, container]
---

# Layout

## Overview
`Layout` is a generic container that accepts a view node and swaps it on demand. It provides two methods: `onLayOut` for initial mounting and `showing` for replacing the current view.

## API and Behavior
- Accepts `layout` (initial node) and `view` (active view node) as props.
- `showing(view)` replaces the current child with a new view node.
- `onLayOut(view)` appends a view (used for initial layout setup).
- Both props and methods accept any DOM node.

## Prop Scenarios
:::script label="Swap views" expected="renders layout and replaces initial view"
const layout = await slice.build('Layout', {});

const initial = document.createElement('p');
initial.textContent = 'First view';
await layout.showing(initial);

const replacement = document.createElement('p');
replacement.textContent = 'Replaced view';
await layout.showing(replacement);

return layout;
:::

:::script label="Layout with card view" expected="renders layout containing a card"
const layout = await slice.build('Layout', {});

const card = await slice.build('Card', {
  title: 'Layout Demo',
  text: 'This card is mounted inside a Layout container.',
  variant: 'outlined'
});

await layout.showing(card);

return layout;
:::

## Best Practices
:::tip
Use `Layout` as a viewport controller when you need to swap entire sections of a page without full navigation.
:::

## Pitfalls
:::warning
`showing` removes the previous child. Ensure stateful views persist their data externally if needed.
:::
