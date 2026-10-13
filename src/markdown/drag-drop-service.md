---
title: DragDropService
route: /docs/services/drag-drop
navLabel: DragDropService
section: Services
group: Interaction
order: 60
description: Singleton service for headless drag-and-drop, resize, and sortable — draggable, droppable, resizable, free positioning, and item reorder, with full touch support.
component: DragDropServiceDocumentation
generate: true
tags: [drag, drop, resize, dnd, sortable, reorder, service]
---

# DragDropService

DragDropService is a singleton **Service** that provides headless drag-and-drop and resize capabilities using pointer events. It handles ghost elements, axis constraints, drop target hit-testing, and resize handles without any visual dependency.

## Getting the instance

```js
const dnd = await slice.build('DragDropService', { singleton: true });
```

Because it is a singleton, build it once (anywhere) and recover the same instance elsewhere with `slice.getComponent('DragDropService')` — no need to thread a reference around.

:::warning
**This component ships TWO files, and `slice get` only delivers one.**

```bash
slice get DragDropService
ls src/Components/Service/DragDropService/   # expect DragDropService.js AND dndGeometry.js
```

`DragDropService.js` imports `./dndGeometry.js`, a sibling module holding the resize maths. The
CLI follows imports between *registered components*, but a bare `./relative.js` inside a component
folder is not fetched — the download fails silently and the service throws at runtime with
`dndGeometry is not defined`.

If it is missing after `slice get`, copy it from the registry repo. This is the only component in
the library with a sibling module, and the reason is deliberate: the geometry maths was split out so
it could be tested in plain Node (`DragDropService.test.js` runs under `node --test`, with no
browser).
:::

## Draggable

Make an element follow the pointer with a semi-transparent ghost.

```js
dnd.makeDraggable(node, {
  handle: '.title-bar',   // optional — restrict drag to a child
  axis: 'both',           // 'x', 'y', or 'both'
  ghost: true,            // show a ghost clone
  threshold: 0,           // px before activating
  touchDelay: 200,        // ms of finger stillness before a TOUCH drag arms (mouse/pen unaffected)
  autoScroll: true,       // scroll scrollable ancestors near their edges, chaining outward
  data: { id: 1 },
  onDragStart(node, event, data),
  onDrag(node, event, data, { dx, dy }),
  onDragEnd(node, event, data)
});
```

:::script label="Basic drag with ghost" expected="box moves with a semi-transparent ghost clone"
const dnd = await slice.build('DragDropService', { singleton: true });

const box = document.createElement('div');
box.textContent = 'Drag me';
Object.assign(box.style, {
  width: '140px', height: '90px',
  background: '#3b82f6', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',
  fontWeight: '600', touchAction: 'none'
});

dnd.makeDraggable(box, { ghost: true });
mount(box);
:::

### Drag with axis constraint

Restrict movement to a single axis.

:::script label="Axis constraint" expected="box only moves horizontally"
const dnd = await slice.build('DragDropService', { singleton: true });

const container = document.createElement('div');
Object.assign(container.style, { display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' });

['both', 'x', 'y'].forEach(axis => {
  const box = document.createElement('div');
  box.textContent = axis;
  Object.assign(box.style, {
    width: '100px', height: '70px',
    background: axis === 'x' ? '#10b981' : axis === 'y' ? '#f59e0b' : '#3b82f6',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',
    fontWeight: '600', touchAction: 'none'
  });
  dnd.makeDraggable(box, { axis, ghost: true });
  container.appendChild(box);
});

mount(container);
:::

## Droppable

Register drop targets and react when a draggable is dropped on them.

```js
dnd.makeDroppable(node, {
  accept: (data) => data.type === 'task',
  onDragEnter(node, event, data),
  onDragLeave(node, event, data),
  onDragOver(node, event, data),
  onDrop(node, event, data)
});
```

:::script label="Drop zone with visual feedback" expected="zone highlights on hover, shows success on drop"
const dnd = await slice.build('DragDropService', { singleton: true });

const box = document.createElement('div');
box.textContent = 'Drag me';
Object.assign(box.style, {
  width: '120px', height: '80px',
  background: '#8b5cf6', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',
  fontWeight: '600', touchAction: 'none'
});
dnd.makeDraggable(box, { ghost: true, data: { type: 'task' } });

const zone = document.createElement('div');
zone.textContent = 'Drop here';
Object.assign(zone.style, {
  width: '220px', height: '160px',
  border: '2px dashed #c4b5fd', borderRadius: '8px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif', color: '#7c3aed',
  fontWeight: '500', transition: 'all .2s'
});
dnd.makeDroppable(zone, {
  accept: (data) => data?.type === 'task',
  onDragEnter: () => { zone.style.background = '#ede9fe'; zone.style.borderColor = '#8b5cf6'; zone.textContent = 'Release to drop'; },
  onDragLeave: () => { zone.style.background = ''; zone.style.borderColor = '#c4b5fd'; zone.textContent = 'Drop here'; },
  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; zone.style.borderColor = '#22c55e'; zone.style.color = '#166534'; }
});

const wrapper = document.createElement('div');
Object.assign(wrapper.style, { display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.5rem' });
wrapper.appendChild(box);
wrapper.appendChild(zone);
mount(wrapper);
:::

## Resizable

Add resize handles to any element. The element needs `position: relative` (applied automatically).

```js
dnd.makeResizable(node, {
  handles: ['se', 'e', 's', 'w', 'n', 'ne', 'nw', 'sw'],
  minWidth: 100, minHeight: 80,
  maxWidth: 600, maxHeight: 400,
  onResizeStart(node, event, rect),
  onResize(node, event, rect),
  onResizeEnd(node, event, rect)
});
```

:::script label="Resize from edges" expected="panel grows and shrinks by dragging the small squares at the right, bottom, and corner"
const dnd = await slice.build('DragDropService', { singleton: true });

const panel = document.createElement('div');
Object.assign(panel.style, {
  width: '200px', height: '120px',
  background: '#f0f9ff', border: '1px solid #7dd3fc',
  borderRadius: '8px', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif', color: '#0369a1',
  fontWeight: '500', textAlign: 'center', padding: '0.5rem'
});

const label = document.createElement('span');
label.textContent = 'hover the right, bottom, and corner edges';
Object.assign(label.style, { fontSize: '13px', lineHeight: '1.4' });
panel.appendChild(label);

dnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 120, minHeight: 80 });
mount(panel);
:::

## Combined: Draggable + Resizable

A panel that is draggable by its header and resizable by its edges.

:::script label="Draggable by header, resizable by edges" expected="drag the blue header to move, grab the edge squares to resize"
const dnd = await slice.build('DragDropService', { singleton: true });

const panel = document.createElement('div');
panel.innerHTML = '<div style="padding:8px 12px;background:#e0e7ff;border-radius:8px 8px 0 0;cursor:grab;font-weight:600;font-family:system-ui,sans-serif;color:#4338ca;user-select:none">Header (drag here)</div><div style="padding:16px;font-family:system-ui,sans-serif;color:#374151">Resize using the edge squares</div>';
Object.assign(panel.style, {
  width: '240px', border: '1px solid #a5b4fc',
  borderRadius: '8px', background: '#fff',
  position: 'relative'
});
dnd.makeDraggable(panel, { handle: 'div:first-child' });
dnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 180, minHeight: 100 });
mount(panel);
:::

## Free positioning

Elements stay where they are dropped. The service sets `position: fixed` and applies the final coordinates automatically.

```js
dnd.makeDraggable(node, { ghost: true, freePosition: true });
```

:::script label="Free positioning" expected="box stays where you drop it"
const dnd = await slice.build('DragDropService', { singleton: true });

const box = document.createElement('div');
box.textContent = 'Drag and release';
Object.assign(box.style, {
  width: '150px', height: '90px',
  background: '#f43f5e', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',
  fontWeight: '600', touchAction: 'none', position: 'relative', zIndex: '1'
});

dnd.makeDraggable(box, { ghost: true, freePosition: true });
mount(box);
:::

## Sortable

Reorder items inside a container by dragging them.

```js
dnd.makeSortable(container, {
  items: ':scope > *',     // selector for sortable items
  axis: 'y',               // 'x' or 'y'
  autoScroll: true,        // scroll a long/overflowing list while dragging near its edges
  touchDelay: 200,         // ms of finger stillness before a TOUCH sort arms
  onReorder: ({ fromIndex, toIndex, item, container }) => {
    console.log(`Moved from ${fromIndex} to ${toIndex}`);
  }
});
```

`onReorder` fires **only when the order actually changed**. A gesture the browser interrupts with
`pointercancel` puts the item back where it started and reports nothing.

:::script label="Sortable list" expected="drag items to reorder the list"
const dnd = await slice.build('DragDropService', { singleton: true });

const container = document.createElement('div');
Object.assign(container.style, {
  display: 'flex', flexDirection: 'column', gap: '6px',
  width: '260px', fontFamily: 'system-ui, sans-serif'
});

const labels = ['Task A', 'Task B', 'Task C', 'Task D'];
const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

labels.forEach((text, i) => {
  const item = document.createElement('div');
  item.textContent = text;
  Object.assign(item.style, {
    padding: '12px 16px', background: colors[i], color: '#fff',
    borderRadius: '6px', cursor: 'grab', fontWeight: '500',
    touchAction: 'none'
  });
  container.appendChild(item);
});

dnd.makeSortable(container, {
  items: 'div',
  onReorder: ({ fromIndex, toIndex }) => {
    console.log(`Moved ${fromIndex} → ${toIndex}`);
  }
});

const note = document.createElement('p');
note.textContent = 'Drag any item to reorder the list';
Object.assign(note.style, { fontSize: '13px', color: '#6b7280', marginTop: '8px' });

const wrapper = document.createElement('div');
wrapper.appendChild(container);
wrapper.appendChild(note);
mount(wrapper);
:::

## Touch support

Drag-and-drop works on touch devices without any extra wiring.

**A finger on a draggable is ambiguous** — scroll or drag? — and the browser settles it at the first
move: unless `touch-action` forbids panning, it starts scrolling and fires `pointercancel`, after which
no `pointermove`/`pointerup` ever arrives for that pointer. DragDropService handles this in two ways:

**1. Hold-to-arm.** A touch drag does not begin at `pointerdown`. The finger has to stay put for
`touchDelay` ms (200 by default) first. Moving more than 8 px during that hold means "scroll", so the
service cancels and hands the gesture back to the page. Once armed, a non-passive `touchmove`
listener calls `preventDefault()` — the only way to stop the browser panning mid-drag — and the
long-press context menu and iOS selection callout are suppressed. Mouse and pen are unaffected: they
start immediately.

```js
dnd.makeDraggable(node, { touchDelay: 200 });   // ms of stillness before a touch drag arms
dnd.makeSortable(container, { touchDelay: 120 });
```

**2. `pointercancel` cleans up.** When the browser takes the gesture anyway (a scroll, an incoming
call, a system gesture), the drag ends *cancelled*, not dropped:

| What | On `pointercancel` |
| --- | --- |
| Draggable | `onDragLeave` fires for the hovered droppable, the live transform is cleared, and no free-position `left/top` is committed — the node snaps back |
| Draggable | `onDragEnd` **still** fires, so you can undo any `onDragStart` state |
| Sortable | the item returns to its original index and `onReorder` is **not** called |
| Any | the ghost is removed and the service is immediately usable again |

Without this the service wedged permanently: `_activeDrag` stayed set, so every later drag was
refused, and a sortable left its item `display: none` with the ghost stuck on screen.

## Auto-scroll chains across scrollers

Holding a pointer near an edge scrolls the nearest scrollable ancestor — and when **that** reaches
its end, the next ancestor takes over, ending at the page. This matters on a phone, where a drag out
of a nested sidebar (a list, a card column) would otherwise only ever scroll that sidebar, leaving
every drop target out of reach. The target is re-picked on every animation frame, so a finger held
still at the edge still hands over.

:::script label="Chained auto-scroll" expected="the inner box scrolls first, then the page takes over and brings a drop target under the held pointer"
const dnd = await slice.build('DragDropService', { singleton: true });

const frame = document.createElement('div');
Object.assign(frame.style, { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' });

// A nested scroll container holding the draggable…
const scroller = document.createElement('div');
Object.assign(scroller.style, {
  width: '200px', height: '180px', overflowY: 'auto',
  border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px'
});
const box = document.createElement('div');
box.textContent = 'Hold me at the bottom edge';
Object.assign(box.style, {
  padding: '10px', background: '#3b82f6', color: '#fff',
  borderRadius: '6px', fontFamily: 'system-ui, sans-serif',
  fontSize: '13px', fontWeight: '500', cursor: 'grab',
  touchAction: 'none', marginBottom: '700px'
});
scroller.appendChild(box);
scroller.appendChild(document.createElement('div'));   // makes the container scrollable
dnd.makeDraggable(box, { ghost: true });

// …and a drop target that lives on the page, far below the fold.
const zone = document.createElement('div');
zone.textContent = 'Drop here (far below)';
Object.assign(zone.style, {
  marginTop: '900px', padding: '24px', textAlign: 'center',
  border: '2px dashed #a78bfa', borderRadius: '8px',
  fontFamily: 'system-ui, sans-serif', color: '#6d28d9'
});
dnd.makeDroppable(zone, {
  onDragEnter: () => { zone.style.background = '#ede9fe'; },
  onDragLeave: () => { zone.style.background = ''; },
  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; }
});

frame.appendChild(scroller);
frame.appendChild(zone);
mount(frame);
:::

## Cleanup

```js
dnd.detach(node);   // remove registrations from a specific node
```

As an app-lifetime singleton, its global listeners, ghost, and registrations are cleaned up automatically by the framework (`beforeDestroy`) when the service is torn down — you don't tear it down by hand.

## Best Practices

- Set `touch-action: none` on draggable elements (already set on resize handles). **It does not
  disable scrolling by itself** — the hold-to-arm delay is what keeps a tap-scrollable list
  scrollable while a deliberate hold starts a drag.
- Use `handle` when elements should be draggable only from a specific child (e.g., a header).
- Always call `detach(node)` when removing a registered element from the DOM.
- Use `accept` on droppables to filter which draggables are accepted.
- Auto-scroll is on by default: dragging near an edge scrolls the nearest scrollable ancestor that
  can still move that way, handing over to the next one — and finally the page — as each is
  exhausted. Pass `autoScroll: false` to a draggable or sortable to opt out.
- Auto-scroll only runs when the drag has somewhere to go (`freePosition` or at least one
  droppable). A ghost-only drag with no droppables never scrolls the page.
- Sortables ignore presses that land on an interactive descendant (`button`, `input`, `select`,
  `textarea`, `a`, `[contenteditable]`, `[data-act]`, and the Slice form controls), so a button
  inside a sortable card still works.
