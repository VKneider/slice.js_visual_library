export default class DragDropServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Basic drag with ghost","expected":"box moves with a semi-transparent ghost clone","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\n\nconst box = document.createElement('div');\nbox.textContent = 'Drag me';\nObject.assign(box.style, {\n  width: '140px', height: '90px',\n  background: '#3b82f6', color: '#fff',\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\n  fontWeight: '600', touchAction: 'none'\n});\n\ndnd.makeDraggable(box, { ghost: true });\nmount(box);"},{"label":"Axis constraint","expected":"box only moves horizontally","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\n\nconst container = document.createElement('div');\nObject.assign(container.style, { display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' });\n\n['both', 'x', 'y'].forEach(axis => {\n  const box = document.createElement('div');\n  box.textContent = axis;\n  Object.assign(box.style, {\n    width: '100px', height: '70px',\n    background: axis === 'x' ? '#10b981' : axis === 'y' ? '#f59e0b' : '#3b82f6',\n    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',\n    borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\n    fontWeight: '600', touchAction: 'none'\n  });\n  dnd.makeDraggable(box, { axis, ghost: true });\n  container.appendChild(box);\n});\n\nmount(container);"},{"label":"Drop zone with visual feedback","expected":"zone highlights on hover, shows success on drop","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\n\nconst box = document.createElement('div');\nbox.textContent = 'Drag me';\nObject.assign(box.style, {\n  width: '120px', height: '80px',\n  background: '#8b5cf6', color: '#fff',\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\n  fontWeight: '600', touchAction: 'none'\n});\ndnd.makeDraggable(box, { ghost: true, data: { type: 'task' } });\n\nconst zone = document.createElement('div');\nzone.textContent = 'Drop here';\nObject.assign(zone.style, {\n  width: '220px', height: '160px',\n  border: '2px dashed #c4b5fd', borderRadius: '8px',\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\n  fontFamily: 'system-ui, sans-serif', color: '#7c3aed',\n  fontWeight: '500', transition: 'all .2s'\n});\ndnd.makeDroppable(zone, {\n  accept: (data) => data?.type === 'task',\n  onDragEnter: () => { zone.style.background = '#ede9fe'; zone.style.borderColor = '#8b5cf6'; zone.textContent = 'Release to drop'; },\n  onDragLeave: () => { zone.style.background = ''; zone.style.borderColor = '#c4b5fd'; zone.textContent = 'Drop here'; },\n  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; zone.style.borderColor = '#22c55e'; zone.style.color = '#166534'; }\n});\n\nconst wrapper = document.createElement('div');\nObject.assign(wrapper.style, { display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.5rem' });\nwrapper.appendChild(box);\nwrapper.appendChild(zone);\nmount(wrapper);"},{"label":"Resize from edges","expected":"panel grows and shrinks by dragging the small squares at the right, bottom, and corner","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\n\nconst panel = document.createElement('div');\nObject.assign(panel.style, {\n  width: '200px', height: '120px',\n  background: '#f0f9ff', border: '1px solid #7dd3fc',\n  borderRadius: '8px', display: 'flex',\n  alignItems: 'center', justifyContent: 'center',\n  fontFamily: 'system-ui, sans-serif', color: '#0369a1',\n  fontWeight: '500', textAlign: 'center', padding: '0.5rem'\n});\n\nconst label = document.createElement('span');\nlabel.textContent = 'hover the right, bottom, and corner edges';\nObject.assign(label.style, { fontSize: '13px', lineHeight: '1.4' });\npanel.appendChild(label);\n\ndnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 120, minHeight: 80 });\nmount(panel);"},{"label":"Draggable by header, resizable by edges","expected":"drag the blue header to move, grab the edge squares to resize","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\n\nconst panel = document.createElement('div');\npanel.innerHTML = '<div style=\"padding:8px 12px;background:#e0e7ff;border-radius:8px 8px 0 0;cursor:grab;font-weight:600;font-family:system-ui,sans-serif;color:#4338ca;user-select:none\">Header (drag here)</div><div style=\"padding:16px;font-family:system-ui,sans-serif;color:#374151\">Resize using the edge squares</div>';\nObject.assign(panel.style, {\n  width: '240px', border: '1px solid #a5b4fc',\n  borderRadius: '8px', background: '#fff',\n  position: 'relative'\n});\ndnd.makeDraggable(panel, { handle: 'div:first-child' });\ndnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 180, minHeight: 100 });\nmount(panel);"},{"label":"Free positioning","expected":"box stays where you drop it","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\n\nconst box = document.createElement('div');\nbox.textContent = 'Drag and release';\nObject.assign(box.style, {\n  width: '150px', height: '90px',\n  background: '#f43f5e', color: '#fff',\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\n  fontWeight: '600', touchAction: 'none', position: 'relative', zIndex: '1'\n});\n\ndnd.makeDraggable(box, { ghost: true, freePosition: true });\nmount(box);"},{"label":"Sortable list","expected":"drag items to reorder the list","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\n\nconst container = document.createElement('div');\nObject.assign(container.style, {\n  display: 'flex', flexDirection: 'column', gap: '6px',\n  width: '260px', fontFamily: 'system-ui, sans-serif'\n});\n\nconst labels = ['Task A', 'Task B', 'Task C', 'Task D'];\nconst colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];\n\nlabels.forEach((text, i) => {\n  const item = document.createElement('div');\n  item.textContent = text;\n  Object.assign(item.style, {\n    padding: '12px 16px', background: colors[i], color: '#fff',\n    borderRadius: '6px', cursor: 'grab', fontWeight: '500',\n    touchAction: 'none'\n  });\n  container.appendChild(item);\n});\n\ndnd.makeSortable(container, {\n  items: 'div',\n  onReorder: ({ fromIndex, toIndex }) => {\n    console.log(`Moved ${fromIndex} → ${toIndex}`);\n  }\n});\n\nconst note = document.createElement('p');\nnote.textContent = 'Drag any item to reorder the list';\nObject.assign(note.style, { fontSize: '13px', color: '#6b7280', marginTop: '8px' });\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(container);\nwrapper.appendChild(note);\nmount(wrapper);"},{"label":"Chained auto-scroll","expected":"the inner box scrolls first, then the page takes over and brings a drop target under the held pointer","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\n\nconst frame = document.createElement('div');\nObject.assign(frame.style, { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' });\n\n// A nested scroll container holding the draggable…\nconst scroller = document.createElement('div');\nObject.assign(scroller.style, {\n  width: '200px', height: '180px', overflowY: 'auto',\n  border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px'\n});\nconst box = document.createElement('div');\nbox.textContent = 'Hold me at the bottom edge';\nObject.assign(box.style, {\n  padding: '10px', background: '#3b82f6', color: '#fff',\n  borderRadius: '6px', fontFamily: 'system-ui, sans-serif',\n  fontSize: '13px', fontWeight: '500', cursor: 'grab',\n  touchAction: 'none', marginBottom: '700px'\n});\nscroller.appendChild(box);\nscroller.appendChild(document.createElement('div'));   // makes the container scrollable\ndnd.makeDraggable(box, { ghost: true });\n\n// …and a drop target that lives on the page, far below the fold.\nconst zone = document.createElement('div');\nzone.textContent = 'Drop here (far below)';\nObject.assign(zone.style, {\n  marginTop: '900px', padding: '24px', textAlign: 'center',\n  border: '2px dashed #a78bfa', borderRadius: '8px',\n  fontFamily: 'system-ui, sans-serif', color: '#6d28d9'\n});\ndnd.makeDroppable(zone, {\n  onDragEnter: () => { zone.style.background = '#ede9fe'; },\n  onDragLeave: () => { zone.style.background = ''; },\n  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; }\n});\n\nframe.appendChild(scroller);\nframe.appendChild(zone);\nmount(frame);"}];
  }

  async init() {
    this.markdownPath = "drag-drop-service.md";
    this.markdownContent = "---\ntitle: DragDropService\nroute: /docs/services/drag-drop\nnavLabel: DragDropService\nsection: Services\ngroup: Interaction\norder: 60\ndescription: Singleton service for headless drag-and-drop, resize, and sortable — draggable, droppable, resizable, free positioning, and item reorder, with full touch support.\ncomponent: DragDropServiceDocumentation\ngenerate: true\ntags: [drag, drop, resize, dnd, sortable, reorder, service]\n---\n\n# DragDropService\n\nDragDropService is a singleton **Service** that provides headless drag-and-drop and resize capabilities using pointer events. It handles ghost elements, axis constraints, drop target hit-testing, and resize handles without any visual dependency.\n\n## Getting the instance\n\n```js\nconst dnd = await slice.build('DragDropService', { singleton: true });\n```\n\nBecause it is a singleton, build it once (anywhere) and recover the same instance elsewhere with `slice.getComponent('DragDropService')` — no need to thread a reference around.\n\n:::warning\n**This component ships TWO files, and `slice get` only delivers one.**\n\n```bash\nslice get DragDropService\nls src/Components/Service/DragDropService/   # expect DragDropService.js AND dndGeometry.js\n```\n\n`DragDropService.js` imports `./dndGeometry.js`, a sibling module holding the resize maths. The\nCLI follows imports between *registered components*, but a bare `./relative.js` inside a component\nfolder is not fetched — the download fails silently and the service throws at runtime with\n`dndGeometry is not defined`.\n\nIf it is missing after `slice get`, copy it from the registry repo. This is the only component in\nthe library with a sibling module, and the reason is deliberate: the geometry maths was split out so\nit could be tested in plain Node (`DragDropService.test.js` runs under `node --test`, with no\nbrowser).\n:::\n\n## Draggable\n\nMake an element follow the pointer with a semi-transparent ghost.\n\n```js\ndnd.makeDraggable(node, {\n  handle: '.title-bar',   // optional — restrict drag to a child\n  axis: 'both',           // 'x', 'y', or 'both'\n  ghost: true,            // show a ghost clone\n  threshold: 0,           // px before activating\n  touchDelay: 200,        // ms of finger stillness before a TOUCH drag arms (mouse/pen unaffected)\n  autoScroll: true,       // scroll scrollable ancestors near their edges, chaining outward\n  data: { id: 1 },\n  onDragStart(node, event, data),\n  onDrag(node, event, data, { dx, dy }),\n  onDragEnd(node, event, data)\n});\n```\n\n:::script label=\"Basic drag with ghost\" expected=\"box moves with a semi-transparent ghost clone\"\nconst dnd = await slice.build('DragDropService', { singleton: true });\n\nconst box = document.createElement('div');\nbox.textContent = 'Drag me';\nObject.assign(box.style, {\n  width: '140px', height: '90px',\n  background: '#3b82f6', color: '#fff',\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\n  fontWeight: '600', touchAction: 'none'\n});\n\ndnd.makeDraggable(box, { ghost: true });\nmount(box);\n:::\n\n### Drag with axis constraint\n\nRestrict movement to a single axis.\n\n:::script label=\"Axis constraint\" expected=\"box only moves horizontally\"\nconst dnd = await slice.build('DragDropService', { singleton: true });\n\nconst container = document.createElement('div');\nObject.assign(container.style, { display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' });\n\n['both', 'x', 'y'].forEach(axis => {\n  const box = document.createElement('div');\n  box.textContent = axis;\n  Object.assign(box.style, {\n    width: '100px', height: '70px',\n    background: axis === 'x' ? '#10b981' : axis === 'y' ? '#f59e0b' : '#3b82f6',\n    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',\n    borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\n    fontWeight: '600', touchAction: 'none'\n  });\n  dnd.makeDraggable(box, { axis, ghost: true });\n  container.appendChild(box);\n});\n\nmount(container);\n:::\n\n## Droppable\n\nRegister drop targets and react when a draggable is dropped on them.\n\n```js\ndnd.makeDroppable(node, {\n  accept: (data) => data.type === 'task',\n  onDragEnter(node, event, data),\n  onDragLeave(node, event, data),\n  onDragOver(node, event, data),\n  onDrop(node, event, data)\n});\n```\n\n:::script label=\"Drop zone with visual feedback\" expected=\"zone highlights on hover, shows success on drop\"\nconst dnd = await slice.build('DragDropService', { singleton: true });\n\nconst box = document.createElement('div');\nbox.textContent = 'Drag me';\nObject.assign(box.style, {\n  width: '120px', height: '80px',\n  background: '#8b5cf6', color: '#fff',\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\n  fontWeight: '600', touchAction: 'none'\n});\ndnd.makeDraggable(box, { ghost: true, data: { type: 'task' } });\n\nconst zone = document.createElement('div');\nzone.textContent = 'Drop here';\nObject.assign(zone.style, {\n  width: '220px', height: '160px',\n  border: '2px dashed #c4b5fd', borderRadius: '8px',\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\n  fontFamily: 'system-ui, sans-serif', color: '#7c3aed',\n  fontWeight: '500', transition: 'all .2s'\n});\ndnd.makeDroppable(zone, {\n  accept: (data) => data?.type === 'task',\n  onDragEnter: () => { zone.style.background = '#ede9fe'; zone.style.borderColor = '#8b5cf6'; zone.textContent = 'Release to drop'; },\n  onDragLeave: () => { zone.style.background = ''; zone.style.borderColor = '#c4b5fd'; zone.textContent = 'Drop here'; },\n  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; zone.style.borderColor = '#22c55e'; zone.style.color = '#166534'; }\n});\n\nconst wrapper = document.createElement('div');\nObject.assign(wrapper.style, { display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.5rem' });\nwrapper.appendChild(box);\nwrapper.appendChild(zone);\nmount(wrapper);\n:::\n\n## Resizable\n\nAdd resize handles to any element. The element needs `position: relative` (applied automatically).\n\n```js\ndnd.makeResizable(node, {\n  handles: ['se', 'e', 's', 'w', 'n', 'ne', 'nw', 'sw'],\n  minWidth: 100, minHeight: 80,\n  maxWidth: 600, maxHeight: 400,\n  onResizeStart(node, event, rect),\n  onResize(node, event, rect),\n  onResizeEnd(node, event, rect)\n});\n```\n\n:::script label=\"Resize from edges\" expected=\"panel grows and shrinks by dragging the small squares at the right, bottom, and corner\"\nconst dnd = await slice.build('DragDropService', { singleton: true });\n\nconst panel = document.createElement('div');\nObject.assign(panel.style, {\n  width: '200px', height: '120px',\n  background: '#f0f9ff', border: '1px solid #7dd3fc',\n  borderRadius: '8px', display: 'flex',\n  alignItems: 'center', justifyContent: 'center',\n  fontFamily: 'system-ui, sans-serif', color: '#0369a1',\n  fontWeight: '500', textAlign: 'center', padding: '0.5rem'\n});\n\nconst label = document.createElement('span');\nlabel.textContent = 'hover the right, bottom, and corner edges';\nObject.assign(label.style, { fontSize: '13px', lineHeight: '1.4' });\npanel.appendChild(label);\n\ndnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 120, minHeight: 80 });\nmount(panel);\n:::\n\n## Combined: Draggable + Resizable\n\nA panel that is draggable by its header and resizable by its edges.\n\n:::script label=\"Draggable by header, resizable by edges\" expected=\"drag the blue header to move, grab the edge squares to resize\"\nconst dnd = await slice.build('DragDropService', { singleton: true });\n\nconst panel = document.createElement('div');\npanel.innerHTML = '<div style=\"padding:8px 12px;background:#e0e7ff;border-radius:8px 8px 0 0;cursor:grab;font-weight:600;font-family:system-ui,sans-serif;color:#4338ca;user-select:none\">Header (drag here)</div><div style=\"padding:16px;font-family:system-ui,sans-serif;color:#374151\">Resize using the edge squares</div>';\nObject.assign(panel.style, {\n  width: '240px', border: '1px solid #a5b4fc',\n  borderRadius: '8px', background: '#fff',\n  position: 'relative'\n});\ndnd.makeDraggable(panel, { handle: 'div:first-child' });\ndnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 180, minHeight: 100 });\nmount(panel);\n:::\n\n## Free positioning\n\nElements stay where they are dropped. The service sets `position: fixed` and applies the final coordinates automatically.\n\n```js\ndnd.makeDraggable(node, { ghost: true, freePosition: true });\n```\n\n:::script label=\"Free positioning\" expected=\"box stays where you drop it\"\nconst dnd = await slice.build('DragDropService', { singleton: true });\n\nconst box = document.createElement('div');\nbox.textContent = 'Drag and release';\nObject.assign(box.style, {\n  width: '150px', height: '90px',\n  background: '#f43f5e', color: '#fff',\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\n  fontWeight: '600', touchAction: 'none', position: 'relative', zIndex: '1'\n});\n\ndnd.makeDraggable(box, { ghost: true, freePosition: true });\nmount(box);\n:::\n\n## Sortable\n\nReorder items inside a container by dragging them.\n\n```js\ndnd.makeSortable(container, {\n  items: ':scope > *',     // selector for sortable items\n  axis: 'y',               // 'x' or 'y'\n  autoScroll: true,        // scroll a long/overflowing list while dragging near its edges\n  touchDelay: 200,         // ms of finger stillness before a TOUCH sort arms\n  onReorder: ({ fromIndex, toIndex, item, container }) => {\n    console.log(`Moved from ${fromIndex} to ${toIndex}`);\n  }\n});\n```\n\n`onReorder` fires **only when the order actually changed**. A gesture the browser interrupts with\n`pointercancel` puts the item back where it started and reports nothing.\n\n:::script label=\"Sortable list\" expected=\"drag items to reorder the list\"\nconst dnd = await slice.build('DragDropService', { singleton: true });\n\nconst container = document.createElement('div');\nObject.assign(container.style, {\n  display: 'flex', flexDirection: 'column', gap: '6px',\n  width: '260px', fontFamily: 'system-ui, sans-serif'\n});\n\nconst labels = ['Task A', 'Task B', 'Task C', 'Task D'];\nconst colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];\n\nlabels.forEach((text, i) => {\n  const item = document.createElement('div');\n  item.textContent = text;\n  Object.assign(item.style, {\n    padding: '12px 16px', background: colors[i], color: '#fff',\n    borderRadius: '6px', cursor: 'grab', fontWeight: '500',\n    touchAction: 'none'\n  });\n  container.appendChild(item);\n});\n\ndnd.makeSortable(container, {\n  items: 'div',\n  onReorder: ({ fromIndex, toIndex }) => {\n    console.log(`Moved ${fromIndex} → ${toIndex}`);\n  }\n});\n\nconst note = document.createElement('p');\nnote.textContent = 'Drag any item to reorder the list';\nObject.assign(note.style, { fontSize: '13px', color: '#6b7280', marginTop: '8px' });\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(container);\nwrapper.appendChild(note);\nmount(wrapper);\n:::\n\n## Touch support\n\nDrag-and-drop works on touch devices without any extra wiring.\n\n**A finger on a draggable is ambiguous** — scroll or drag? — and the browser settles it at the first\nmove: unless `touch-action` forbids panning, it starts scrolling and fires `pointercancel`, after which\nno `pointermove`/`pointerup` ever arrives for that pointer. DragDropService handles this in two ways:\n\n**1. Hold-to-arm.** A touch drag does not begin at `pointerdown`. The finger has to stay put for\n`touchDelay` ms (200 by default) first. Moving more than 8 px during that hold means \"scroll\", so the\nservice cancels and hands the gesture back to the page. Once armed, a non-passive `touchmove`\nlistener calls `preventDefault()` — the only way to stop the browser panning mid-drag — and the\nlong-press context menu and iOS selection callout are suppressed. Mouse and pen are unaffected: they\nstart immediately.\n\n```js\ndnd.makeDraggable(node, { touchDelay: 200 });   // ms of stillness before a touch drag arms\ndnd.makeSortable(container, { touchDelay: 120 });\n```\n\n**2. `pointercancel` cleans up.** When the browser takes the gesture anyway (a scroll, an incoming\ncall, a system gesture), the drag ends *cancelled*, not dropped:\n\n| What | On `pointercancel` |\n| --- | --- |\n| Draggable | `onDragLeave` fires for the hovered droppable, the live transform is cleared, and no free-position `left/top` is committed — the node snaps back |\n| Draggable | `onDragEnd` **still** fires, so you can undo any `onDragStart` state |\n| Sortable | the item returns to its original index and `onReorder` is **not** called |\n| Any | the ghost is removed and the service is immediately usable again |\n\nWithout this the service wedged permanently: `_activeDrag` stayed set, so every later drag was\nrefused, and a sortable left its item `display: none` with the ghost stuck on screen.\n\n## Auto-scroll chains across scrollers\n\nHolding a pointer near an edge scrolls the nearest scrollable ancestor — and when **that** reaches\nits end, the next ancestor takes over, ending at the page. This matters on a phone, where a drag out\nof a nested sidebar (a list, a card column) would otherwise only ever scroll that sidebar, leaving\nevery drop target out of reach. The target is re-picked on every animation frame, so a finger held\nstill at the edge still hands over.\n\n:::script label=\"Chained auto-scroll\" expected=\"the inner box scrolls first, then the page takes over and brings a drop target under the held pointer\"\nconst dnd = await slice.build('DragDropService', { singleton: true });\n\nconst frame = document.createElement('div');\nObject.assign(frame.style, { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' });\n\n// A nested scroll container holding the draggable…\nconst scroller = document.createElement('div');\nObject.assign(scroller.style, {\n  width: '200px', height: '180px', overflowY: 'auto',\n  border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px'\n});\nconst box = document.createElement('div');\nbox.textContent = 'Hold me at the bottom edge';\nObject.assign(box.style, {\n  padding: '10px', background: '#3b82f6', color: '#fff',\n  borderRadius: '6px', fontFamily: 'system-ui, sans-serif',\n  fontSize: '13px', fontWeight: '500', cursor: 'grab',\n  touchAction: 'none', marginBottom: '700px'\n});\nscroller.appendChild(box);\nscroller.appendChild(document.createElement('div'));   // makes the container scrollable\ndnd.makeDraggable(box, { ghost: true });\n\n// …and a drop target that lives on the page, far below the fold.\nconst zone = document.createElement('div');\nzone.textContent = 'Drop here (far below)';\nObject.assign(zone.style, {\n  marginTop: '900px', padding: '24px', textAlign: 'center',\n  border: '2px dashed #a78bfa', borderRadius: '8px',\n  fontFamily: 'system-ui, sans-serif', color: '#6d28d9'\n});\ndnd.makeDroppable(zone, {\n  onDragEnter: () => { zone.style.background = '#ede9fe'; },\n  onDragLeave: () => { zone.style.background = ''; },\n  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; }\n});\n\nframe.appendChild(scroller);\nframe.appendChild(zone);\nmount(frame);\n:::\n\n## Cleanup\n\n```js\ndnd.detach(node);   // remove registrations from a specific node\n```\n\nAs an app-lifetime singleton, its global listeners, ghost, and registrations are cleaned up automatically by the framework (`beforeDestroy`) when the service is torn down — you don't tear it down by hand.\n\n## Best Practices\n\n- Set `touch-action: none` on draggable elements (already set on resize handles). **It does not\n  disable scrolling by itself** — the hold-to-arm delay is what keeps a tap-scrollable list\n  scrollable while a deliberate hold starts a drag.\n- Use `handle` when elements should be draggable only from a specific child (e.g., a header).\n- Always call `detach(node)` when removing a registered element from the DOM.\n- Use `accept` on droppables to filter which draggables are accepted.\n- Auto-scroll is on by default: dragging near an edge scrolls the nearest scrollable ancestor that\n  can still move that way, handing over to the next one — and finally the page — as each is\n  exhausted. Pass `autoScroll: false` to a draggable or sortable to opt out.\n- Auto-scroll only runs when the drag has somewhere to go (`freePosition` or at least one\n  droppable). A ghost-only drag with no droppables never scrolls the page.\n- Sortables ignore presses that land on an interactive descendant (`button`, `input`, `select`,\n  `textarea`, `a`, `[contenteditable]`, `[data-act]`, and the Slice form controls), so a button\n  inside a sortable card still works.\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const dnd = await slice.build('DragDropService', { singleton: true });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "dnd.makeDraggable(node, {\n  handle: '.title-bar',   // optional — restrict drag to a child\n  axis: 'both',           // 'x', 'y', or 'both'\n  ghost: true,            // show a ghost clone\n  threshold: 0,           // px before activating\n  touchDelay: 200,        // ms of finger stillness before a TOUCH drag arms (mouse/pen unaffected)\n  autoScroll: true,       // scroll scrollable ancestors near their edges, chaining outward\n  data: { id: 1 },\n  onDragStart(node, event, data),\n  onDrag(node, event, data, { dx, dy }),\n  onDragEnd(node, event, data)\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "dnd.makeDroppable(node, {\n  accept: (data) => data.type === 'task',\n  onDragEnter(node, event, data),\n  onDragLeave(node, event, data),\n  onDragOver(node, event, data),\n  onDrop(node, event, data)\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "dnd.makeResizable(node, {\n  handles: ['se', 'e', 's', 'w', 'n', 'ne', 'nw', 'sw'],\n  minWidth: 100, minHeight: 80,\n  maxWidth: 600, maxHeight: 400,\n  onResizeStart(node, event, rect),\n  onResize(node, event, rect),\n  onResizeEnd(node, event, rect)\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "dnd.makeDraggable(node, { ghost: true, freePosition: true });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-12"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "dnd.makeSortable(container, {\n  items: ':scope > *',     // selector for sortable items\n  axis: 'y',               // 'x' or 'y'\n  autoScroll: true,        // scroll a long/overflowing list while dragging near its edges\n  touchDelay: 200,         // ms of finger stillness before a TOUCH sort arms\n  onReorder: ({ fromIndex, toIndex, item, container }) => {\n    console.log(`Moved from ${fromIndex} to ${toIndex}`);\n  }\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-14"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "dnd.makeDraggable(node, { touchDelay: 200 });   // ms of stillness before a touch drag arms\ndnd.makeSortable(container, { touchDelay: 120 });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-15"]');
         if (container) {
            const lines = ["| What | On `pointercancel` |","| --- | --- |","| Draggable | `onDragLeave` fires for the hovered droppable, the live transform is cleared, and no free-position `left/top` is committed — the node snaps back |","| Draggable | `onDragEnd` **still** fires, so you can undo any `onDragStart` state |","| Sortable | the item returns to its original index and `onReorder` is **not** called |","| Any | the ghost is removed and the service is immediately usable again |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-17"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "dnd.detach(node);   // remove registrations from a specific node",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: 'â'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios â€” so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all â€” the divs
      // were never filled, nothing in the repo reads .script-block â€” the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-dragdropservicedocumentation', DragDropServiceDocumentation);
