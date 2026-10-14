---
title: DomService
route: /docs/services/dom-service
navLabel: DomService
section: Services
group: Rendering
order: 62
description: Reconciles a list of data against the child components that render it, without leaking.
component: DomServiceDocumentation
generate: true
tags: [dom, list, reconcile, reconcile, rendering, service]
---

# DomService

## Overview

`DomService.reconcile()` is the canonical way to render a variable-length list of child components.
Give it your data and a stable key per item; it keeps the DOM, the component registry and the
destroy lifecycle in sync.

## Why it exists

The two obvious alternatives are both broken, in ways that only show up as a slow memory leak:

- `container.innerHTML = ''` removes nodes **without running `beforeDestroy()`**. Every child's
  document/window listeners, timers and registry entry survive. The framework never gets to clean up.
- Re-creating a node (rather than moving it) re-runs its constructor and does the same thing.

So `reconcile` does three things, in this order:

1. **Refresh in place.** For each item, find the existing node by its stable `sliceId` and update it.
   Only a genuinely new item is built.
2. **Prune.** Every child whose data is gone is destroyed with `slice.controller.destroyComponent`,
   which runs `beforeDestroy()`. This happens **before** reordering so a dead node is never a
   reorder target.
3. **Enforce order.** The DOM is moved to match `items`. `insertBefore` **moves** a node, it does not
   clone it, so no constructor re-runs — and only nodes that are actually out of place move.

## Concurrency: renders queue per container

`reconcile` keeps one promise per container in a `WeakMap`. A render that arrives while another is
still running waits for it instead of interleaving — otherwise the second could prune a node the first
had just ordered, or both could decide to build the same id.

Two details worth knowing, because both were bugs first:

- The chain continues on **failure**. `then(run, run)` rather than `then(run)`, so one bad render
  cannot freeze every later render on that container.
- The chain is **dropped when it drains**. A long-lived list does not accumulate one promise per
  update.

The promise `reconcile` returns resolves after *this* render is applied **and** after any render
already queued on the same container. So `await dom.reconcile(...)` really does mean "the DOM
matches", which is what makes the pattern below correct.

## Adoption, and a build that returns nothing

Before paying for a build, `reconcile` looks for `[slice-id="<key>"]` inside the container and adopts
it. The registry can lose track of a node — a build that failed part-way, a child the consumer
pre-rendered and appended by hand — while the DOM still holds it, and building it again would throw
`already registered`.

For the same reason the final ordered list is assembled from the nodes that actually exist rather
than from the slots that were requested: `slice.build` legitimately returns nothing for an
unregistered component name, and that must not shift every sibling by one.

## Cost of a cold list

The **first** build is awaited on its own, because it warms the template cache; the rest then run in
parallel. A cold list of *n* rows therefore costs **one** fetch per component type, not *n*.

## API

```js
await dom.reconcile(container, items, {
  keyOf:     (item) => `row-${item.id}`,   // required: stable identity per item
  component: 'Row',                      // required: built for new items
  props:     (item) => ({ label: item.name }),
  refresh:   (node, props) => { /* optional: replaces slice.setComponentProps */ },
});
```

- `keyOf(item)` — **the identity used across renders.** Derive it from a stable id, never from the
  array index: an index key makes item 1 keep its component (and its state) when it becomes item 2.
  It is also used to **adopt** an existing node, so it must be unique across the whole page, not just
  within this list — two lists using `row-1` will fight over the same key.
- `props(item)` — the props for one item.
- `refresh(node, props)` — replaces the default `slice.setComponentProps(node, props)`. Use it when
  props are interdependent, or when the child builds sub-components asynchronously and needs its own
  `update()` in a specific order.

`dom.destroyChildren(container)` tears down every registered child at once.

## Prop Scenarios

:::script label="A reconciled list" expected="three badges; add, reverse or remove with the buttons below"
// singleton: true is what you want for a stateless service like this one —
// every script on the page shares the same instance instead of registering a
// new one each time.
const dom = await slice.build('DomService', { singleton: true });

const store = [
  { id: 'design', label: 'Design' },
  { id: 'build', label: 'Build' },
  { id: 'ship', label: 'Ship' },
];

const list = document.createElement('div');
list.id = 'reconcile-demo-list';
list.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:flex-start;font-family:system-ui,sans-serif;';

const render = () => dom.reconcile(list, store, {
  keyOf: (item) => `demo-chip-${item.id}`,
  component: 'Badge',
  props: (item) => ({ label: item.label, variant: 'accent' }),
});

const controls = document.createElement('div');
controls.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;';

const add = await slice.build('Button', {
  value: 'Add item',
  size: 'sm',
  onClick: async () => {
    store.push({ id: `n${Date.now()}`, label: `Item ${store.length + 1}` });
    await render();
  },
});

const reverse = await slice.build('Button', {
  value: 'Reverse',
  size: 'sm',
  variant: 'outlined',
  onClick: async () => {
    store.reverse();
    await render();
  },
});

const drop = await slice.build('Button', {
  value: 'Remove first',
  size: 'sm',
  variant: 'danger',
  onClick: async () => {
    store.shift();
    await render();
  },
});

controls.appendChild(add);
controls.appendChild(reverse);
controls.appendChild(drop);

const wrap = document.createElement('div');
wrap.appendChild(controls);
wrap.appendChild(list);

await render();
mount(wrap);
:::

## Best Practices

:::tip
Call `reconcile` after every change to the data — a push, a filter, a re-sort — and nowhere else.
Concurrent calls on the same container are queued rather than fought over, but two *different*
data sources reconciling one container is still a design error: each will prune what the other
just built.
:::

:::tip
`await` the call. The promise resolves after this render **and** any render already queued on the
container, so a mutation that triggers two `reconcile` calls can still `await` once and know the DOM
matches.
:::

:::tip
Reuse an item **object** across renders rather than rebuilding it, if the child keys off identity
the object carries. `TreeView` keeps a `WeakMap` from item to a generated id for items with no
`path` or `id` of their own, because an index key would hand item 0's component — and its
open/closed state — to whatever took its place after a splice.
:::

## Pitfalls

:::warning
Do not use the array index as `keyOf`. With an index key, inserting at the front makes item 1 inherit
item 0's component — and its scroll position, its open/closed state, and its focus.
:::

:::warning
`reconcile` only manages **direct** children that carry a `slice-id`. Anything you append by hand
inside the container is left alone; wrap it if it should be reconciled with the data.
:::

:::warning
Never spread an item straight into `props`. `props(item)` is assigned by name onto the element, and
several common field names are getter-only DOM properties — `children` most of all — so
`props: (item) => item` throws `Cannot set property children` and the row is silently never
created. Forward only the keys the child declares.
:::