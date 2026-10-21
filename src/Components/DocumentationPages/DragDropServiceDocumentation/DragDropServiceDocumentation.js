export default class DragDropServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Basic drag with ghost","expected":"box moves with a semi-transparent ghost clone","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst box = document.createElement('div');\r\nbox.textContent = 'Drag me';\r\nObject.assign(box.style, {\r\n  width: '140px', height: '90px',\r\n  background: '#3b82f6', color: '#fff',\r\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\r\n  fontWeight: '600', touchAction: 'none'\r\n});\r\n\r\ndnd.makeDraggable(box, { ghost: true });\r\nmount(box);"},{"label":"Axis constraint","expected":"box only moves horizontally","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst container = document.createElement('div');\r\nObject.assign(container.style, { display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' });\r\n\r\n['both', 'x', 'y'].forEach(axis => {\r\n  const box = document.createElement('div');\r\n  box.textContent = axis;\r\n  Object.assign(box.style, {\r\n    width: '100px', height: '70px',\r\n    background: axis === 'x' ? '#10b981' : axis === 'y' ? '#f59e0b' : '#3b82f6',\r\n    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n    borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\r\n    fontWeight: '600', touchAction: 'none'\r\n  });\r\n  dnd.makeDraggable(box, { axis, ghost: true });\r\n  container.appendChild(box);\r\n});\r\n\r\nmount(container);"},{"label":"Drop zone with visual feedback","expected":"zone highlights on hover, shows success on drop","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst box = document.createElement('div');\r\nbox.textContent = 'Drag me';\r\nObject.assign(box.style, {\r\n  width: '120px', height: '80px',\r\n  background: '#8b5cf6', color: '#fff',\r\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\r\n  fontWeight: '600', touchAction: 'none'\r\n});\r\ndnd.makeDraggable(box, { ghost: true, data: { type: 'task' } });\r\n\r\nconst zone = document.createElement('div');\r\nzone.textContent = 'Drop here';\r\nObject.assign(zone.style, {\r\n  width: '220px', height: '160px',\r\n  border: '2px dashed #c4b5fd', borderRadius: '8px',\r\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n  fontFamily: 'system-ui, sans-serif', color: '#7c3aed',\r\n  fontWeight: '500', transition: 'all .2s'\r\n});\r\ndnd.makeDroppable(zone, {\r\n  accept: (data) => data?.type === 'task',\r\n  onDragEnter: () => { zone.style.background = '#ede9fe'; zone.style.borderColor = '#8b5cf6'; zone.textContent = 'Release to drop'; },\r\n  onDragLeave: () => { zone.style.background = ''; zone.style.borderColor = '#c4b5fd'; zone.textContent = 'Drop here'; },\r\n  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; zone.style.borderColor = '#22c55e'; zone.style.color = '#166534'; }\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nObject.assign(wrapper.style, { display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.5rem' });\r\nwrapper.appendChild(box);\r\nwrapper.appendChild(zone);\r\nmount(wrapper);"},{"label":"Resize from edges","expected":"panel grows and shrinks by dragging the small squares at the right, bottom, and corner","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst panel = document.createElement('div');\r\nObject.assign(panel.style, {\r\n  width: '200px', height: '120px',\r\n  background: '#f0f9ff', border: '1px solid #7dd3fc',\r\n  borderRadius: '8px', display: 'flex',\r\n  alignItems: 'center', justifyContent: 'center',\r\n  fontFamily: 'system-ui, sans-serif', color: '#0369a1',\r\n  fontWeight: '500', textAlign: 'center', padding: '0.5rem'\r\n});\r\n\r\nconst label = document.createElement('span');\r\nlabel.textContent = 'hover the right, bottom, and corner edges';\r\nObject.assign(label.style, { fontSize: '13px', lineHeight: '1.4' });\r\npanel.appendChild(label);\r\n\r\ndnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 120, minHeight: 80 });\r\nmount(panel);"},{"label":"Draggable by header, resizable by edges","expected":"drag the blue header to move, grab the edge squares to resize","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst panel = document.createElement('div');\r\npanel.innerHTML = '<div style=\"padding:8px 12px;background:#e0e7ff;border-radius:8px 8px 0 0;cursor:grab;font-weight:600;font-family:system-ui,sans-serif;color:#4338ca;user-select:none\">Header (drag here)</div><div style=\"padding:16px;font-family:system-ui,sans-serif;color:#374151\">Resize using the edge squares</div>';\r\nObject.assign(panel.style, {\r\n  width: '240px', border: '1px solid #a5b4fc',\r\n  borderRadius: '8px', background: '#fff',\r\n  position: 'relative'\r\n});\r\ndnd.makeDraggable(panel, { handle: 'div:first-child' });\r\ndnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 180, minHeight: 100 });\r\nmount(panel);"},{"label":"Free positioning","expected":"box stays where you drop it","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst box = document.createElement('div');\r\nbox.textContent = 'Drag and release';\r\nObject.assign(box.style, {\r\n  width: '150px', height: '90px',\r\n  background: '#f43f5e', color: '#fff',\r\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\r\n  fontWeight: '600', touchAction: 'none', position: 'relative', zIndex: '1'\r\n});\r\n\r\ndnd.makeDraggable(box, { ghost: true, freePosition: true });\r\nmount(box);"},{"label":"Sortable list","expected":"drag items to reorder the list","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst container = document.createElement('div');\r\nObject.assign(container.style, {\r\n  display: 'flex', flexDirection: 'column', gap: '6px',\r\n  width: '260px', fontFamily: 'system-ui, sans-serif'\r\n});\r\n\r\nconst labels = ['Task A', 'Task B', 'Task C', 'Task D'];\r\nconst colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];\r\n\r\nlabels.forEach((text, i) => {\r\n  const item = document.createElement('div');\r\n  item.textContent = text;\r\n  Object.assign(item.style, {\r\n    padding: '12px 16px', background: colors[i], color: '#fff',\r\n    borderRadius: '6px', cursor: 'grab', fontWeight: '500',\r\n    touchAction: 'none'\r\n  });\r\n  container.appendChild(item);\r\n});\r\n\r\ndnd.makeSortable(container, {\r\n  items: 'div',\r\n  onReorder: ({ fromIndex, toIndex }) => {\r\n    console.log(`Moved ${fromIndex} → ${toIndex}`);\r\n  }\r\n});\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Drag any item to reorder the list';\r\nObject.assign(note.style, { fontSize: '13px', color: '#6b7280', marginTop: '8px' });\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(container);\r\nwrapper.appendChild(note);\r\nmount(wrapper);"},{"label":"Chained auto-scroll","expected":"the inner box scrolls first, then the page takes over and brings a drop target under the held pointer","kind":"script","content":"const dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst frame = document.createElement('div');\r\nObject.assign(frame.style, { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' });\r\n\r\n// A nested scroll container holding the draggable…\r\nconst scroller = document.createElement('div');\r\nObject.assign(scroller.style, {\r\n  width: '200px', height: '180px', overflowY: 'auto',\r\n  border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px'\r\n});\r\nconst box = document.createElement('div');\r\nbox.textContent = 'Hold me at the bottom edge';\r\nObject.assign(box.style, {\r\n  padding: '10px', background: '#3b82f6', color: '#fff',\r\n  borderRadius: '6px', fontFamily: 'system-ui, sans-serif',\r\n  fontSize: '13px', fontWeight: '500', cursor: 'grab',\r\n  touchAction: 'none', marginBottom: '700px'\r\n});\r\nscroller.appendChild(box);\r\nscroller.appendChild(document.createElement('div'));   // makes the container scrollable\r\ndnd.makeDraggable(box, { ghost: true });\r\n\r\n// …and a drop target that lives on the page, far below the fold.\r\nconst zone = document.createElement('div');\r\nzone.textContent = 'Drop here (far below)';\r\nObject.assign(zone.style, {\r\n  marginTop: '900px', padding: '24px', textAlign: 'center',\r\n  border: '2px dashed #a78bfa', borderRadius: '8px',\r\n  fontFamily: 'system-ui, sans-serif', color: '#6d28d9'\r\n});\r\ndnd.makeDroppable(zone, {\r\n  onDragEnter: () => { zone.style.background = '#ede9fe'; },\r\n  onDragLeave: () => { zone.style.background = ''; },\r\n  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; }\r\n});\r\n\r\nframe.appendChild(scroller);\r\nframe.appendChild(zone);\r\nmount(frame);"}];
  }

  async init() {
    this.markdownPath = "drag-drop-service.md";
    this.markdownContent = "---\r\ntitle: DragDropService\r\nroute: /docs/services/drag-drop\r\nnavLabel: DragDropService\r\nsection: Services\r\ngroup: Interaction\r\norder: 60\r\ndescription: Singleton service for headless drag-and-drop, resize, and sortable — draggable, droppable, resizable, free positioning, and item reorder, with full touch support.\r\ncomponent: DragDropServiceDocumentation\r\ngenerate: true\r\ntags: [drag, drop, resize, dnd, sortable, reorder, service]\r\n---\r\n\r\n# DragDropService\r\n\r\nDragDropService is a singleton **Service** that provides headless drag-and-drop and resize capabilities using pointer events. It handles ghost elements, axis constraints, drop target hit-testing, and resize handles without any visual dependency.\r\n\r\n## Getting the instance\r\n\r\n```js\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n```\r\n\r\nBecause it is a singleton, build it once (anywhere) and recover the same instance elsewhere with `slice.getComponent('DragDropService')` — no need to thread a reference around.\r\n\r\n:::warning\r\n**This component ships TWO files, and `slice get` only delivers one.**\r\n\r\n```bash\r\nslice get DragDropService\r\nls src/Components/Service/DragDropService/   # expect DragDropService.js AND dndGeometry.js\r\n```\r\n\r\n`DragDropService.js` imports `./dndGeometry.js`, a sibling module holding the resize maths. The\r\nCLI follows imports between *registered components*, but a bare `./relative.js` inside a component\r\nfolder is not fetched — the download fails silently and the service throws at runtime with\r\n`dndGeometry is not defined`.\r\n\r\nIf it is missing after `slice get`, copy it from the registry repo. This is the only component in\r\nthe library with a sibling module, and the reason is deliberate: the geometry maths was split out so\r\nit could be tested in plain Node (`DragDropService.test.js` runs under `node --test`, with no\r\nbrowser).\r\n:::\r\n\r\n## Draggable\r\n\r\nMake an element follow the pointer with a semi-transparent ghost.\r\n\r\n```js\r\ndnd.makeDraggable(node, {\r\n  handle: '.title-bar',   // optional — restrict drag to a child\r\n  axis: 'both',           // 'x', 'y', or 'both'\r\n  ghost: true,            // show a ghost clone\r\n  threshold: 0,           // px before activating\r\n  touchDelay: 200,        // ms of finger stillness before a TOUCH drag arms (mouse/pen unaffected)\r\n  autoScroll: true,       // scroll scrollable ancestors near their edges, chaining outward\r\n  data: { id: 1 },\r\n  onDragStart(node, event, data),\r\n  onDrag(node, event, data, { dx, dy }),\r\n  onDragEnd(node, event, data)\r\n});\r\n```\r\n\r\n:::script label=\"Basic drag with ghost\" expected=\"box moves with a semi-transparent ghost clone\"\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst box = document.createElement('div');\r\nbox.textContent = 'Drag me';\r\nObject.assign(box.style, {\r\n  width: '140px', height: '90px',\r\n  background: '#3b82f6', color: '#fff',\r\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\r\n  fontWeight: '600', touchAction: 'none'\r\n});\r\n\r\ndnd.makeDraggable(box, { ghost: true });\r\nmount(box);\r\n:::\r\n\r\n### Drag with axis constraint\r\n\r\nRestrict movement to a single axis.\r\n\r\n:::script label=\"Axis constraint\" expected=\"box only moves horizontally\"\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst container = document.createElement('div');\r\nObject.assign(container.style, { display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' });\r\n\r\n['both', 'x', 'y'].forEach(axis => {\r\n  const box = document.createElement('div');\r\n  box.textContent = axis;\r\n  Object.assign(box.style, {\r\n    width: '100px', height: '70px',\r\n    background: axis === 'x' ? '#10b981' : axis === 'y' ? '#f59e0b' : '#3b82f6',\r\n    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n    borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\r\n    fontWeight: '600', touchAction: 'none'\r\n  });\r\n  dnd.makeDraggable(box, { axis, ghost: true });\r\n  container.appendChild(box);\r\n});\r\n\r\nmount(container);\r\n:::\r\n\r\n## Droppable\r\n\r\nRegister drop targets and react when a draggable is dropped on them.\r\n\r\n```js\r\ndnd.makeDroppable(node, {\r\n  accept: (data) => data.type === 'task',\r\n  onDragEnter(node, event, data),\r\n  onDragLeave(node, event, data),\r\n  onDragOver(node, event, data),\r\n  onDrop(node, event, data)\r\n});\r\n```\r\n\r\n:::script label=\"Drop zone with visual feedback\" expected=\"zone highlights on hover, shows success on drop\"\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst box = document.createElement('div');\r\nbox.textContent = 'Drag me';\r\nObject.assign(box.style, {\r\n  width: '120px', height: '80px',\r\n  background: '#8b5cf6', color: '#fff',\r\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\r\n  fontWeight: '600', touchAction: 'none'\r\n});\r\ndnd.makeDraggable(box, { ghost: true, data: { type: 'task' } });\r\n\r\nconst zone = document.createElement('div');\r\nzone.textContent = 'Drop here';\r\nObject.assign(zone.style, {\r\n  width: '220px', height: '160px',\r\n  border: '2px dashed #c4b5fd', borderRadius: '8px',\r\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n  fontFamily: 'system-ui, sans-serif', color: '#7c3aed',\r\n  fontWeight: '500', transition: 'all .2s'\r\n});\r\ndnd.makeDroppable(zone, {\r\n  accept: (data) => data?.type === 'task',\r\n  onDragEnter: () => { zone.style.background = '#ede9fe'; zone.style.borderColor = '#8b5cf6'; zone.textContent = 'Release to drop'; },\r\n  onDragLeave: () => { zone.style.background = ''; zone.style.borderColor = '#c4b5fd'; zone.textContent = 'Drop here'; },\r\n  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; zone.style.borderColor = '#22c55e'; zone.style.color = '#166534'; }\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nObject.assign(wrapper.style, { display: 'flex', gap: '2rem', alignItems: 'center', padding: '0.5rem' });\r\nwrapper.appendChild(box);\r\nwrapper.appendChild(zone);\r\nmount(wrapper);\r\n:::\r\n\r\n## Resizable\r\n\r\nAdd resize handles to any element. The element needs `position: relative` (applied automatically).\r\n\r\n```js\r\ndnd.makeResizable(node, {\r\n  handles: ['se', 'e', 's', 'w', 'n', 'ne', 'nw', 'sw'],\r\n  minWidth: 100, minHeight: 80,\r\n  maxWidth: 600, maxHeight: 400,\r\n  onResizeStart(node, event, rect),\r\n  onResize(node, event, rect),\r\n  onResizeEnd(node, event, rect)\r\n});\r\n```\r\n\r\n:::script label=\"Resize from edges\" expected=\"panel grows and shrinks by dragging the small squares at the right, bottom, and corner\"\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst panel = document.createElement('div');\r\nObject.assign(panel.style, {\r\n  width: '200px', height: '120px',\r\n  background: '#f0f9ff', border: '1px solid #7dd3fc',\r\n  borderRadius: '8px', display: 'flex',\r\n  alignItems: 'center', justifyContent: 'center',\r\n  fontFamily: 'system-ui, sans-serif', color: '#0369a1',\r\n  fontWeight: '500', textAlign: 'center', padding: '0.5rem'\r\n});\r\n\r\nconst label = document.createElement('span');\r\nlabel.textContent = 'hover the right, bottom, and corner edges';\r\nObject.assign(label.style, { fontSize: '13px', lineHeight: '1.4' });\r\npanel.appendChild(label);\r\n\r\ndnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 120, minHeight: 80 });\r\nmount(panel);\r\n:::\r\n\r\n## Combined: Draggable + Resizable\r\n\r\nA panel that is draggable by its header and resizable by its edges.\r\n\r\n:::script label=\"Draggable by header, resizable by edges\" expected=\"drag the blue header to move, grab the edge squares to resize\"\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst panel = document.createElement('div');\r\npanel.innerHTML = '<div style=\"padding:8px 12px;background:#e0e7ff;border-radius:8px 8px 0 0;cursor:grab;font-weight:600;font-family:system-ui,sans-serif;color:#4338ca;user-select:none\">Header (drag here)</div><div style=\"padding:16px;font-family:system-ui,sans-serif;color:#374151\">Resize using the edge squares</div>';\r\nObject.assign(panel.style, {\r\n  width: '240px', border: '1px solid #a5b4fc',\r\n  borderRadius: '8px', background: '#fff',\r\n  position: 'relative'\r\n});\r\ndnd.makeDraggable(panel, { handle: 'div:first-child' });\r\ndnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 180, minHeight: 100 });\r\nmount(panel);\r\n:::\r\n\r\n## Free positioning\r\n\r\nElements stay where they are dropped. The service sets `position: fixed` and applies the final coordinates automatically.\r\n\r\n```js\r\ndnd.makeDraggable(node, { ghost: true, freePosition: true });\r\n```\r\n\r\n:::script label=\"Free positioning\" expected=\"box stays where you drop it\"\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst box = document.createElement('div');\r\nbox.textContent = 'Drag and release';\r\nObject.assign(box.style, {\r\n  width: '150px', height: '90px',\r\n  background: '#f43f5e', color: '#fff',\r\n  display: 'flex', alignItems: 'center', justifyContent: 'center',\r\n  borderRadius: '8px', cursor: 'grab', fontFamily: 'system-ui, sans-serif',\r\n  fontWeight: '600', touchAction: 'none', position: 'relative', zIndex: '1'\r\n});\r\n\r\ndnd.makeDraggable(box, { ghost: true, freePosition: true });\r\nmount(box);\r\n:::\r\n\r\n## Sortable\r\n\r\nReorder items inside a container by dragging them.\r\n\r\n```js\r\ndnd.makeSortable(container, {\r\n  items: ':scope > *',     // selector for sortable items\r\n  axis: 'y',               // 'x' or 'y'\r\n  autoScroll: true,        // scroll a long/overflowing list while dragging near its edges\r\n  touchDelay: 200,         // ms of finger stillness before a TOUCH sort arms\r\n  onReorder: ({ fromIndex, toIndex, item, container }) => {\r\n    console.log(`Moved from ${fromIndex} to ${toIndex}`);\r\n  }\r\n});\r\n```\r\n\r\n`onReorder` fires **only when the order actually changed**. A gesture the browser interrupts with\r\n`pointercancel` puts the item back where it started and reports nothing.\r\n\r\n:::script label=\"Sortable list\" expected=\"drag items to reorder the list\"\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst container = document.createElement('div');\r\nObject.assign(container.style, {\r\n  display: 'flex', flexDirection: 'column', gap: '6px',\r\n  width: '260px', fontFamily: 'system-ui, sans-serif'\r\n});\r\n\r\nconst labels = ['Task A', 'Task B', 'Task C', 'Task D'];\r\nconst colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];\r\n\r\nlabels.forEach((text, i) => {\r\n  const item = document.createElement('div');\r\n  item.textContent = text;\r\n  Object.assign(item.style, {\r\n    padding: '12px 16px', background: colors[i], color: '#fff',\r\n    borderRadius: '6px', cursor: 'grab', fontWeight: '500',\r\n    touchAction: 'none'\r\n  });\r\n  container.appendChild(item);\r\n});\r\n\r\ndnd.makeSortable(container, {\r\n  items: 'div',\r\n  onReorder: ({ fromIndex, toIndex }) => {\r\n    console.log(`Moved ${fromIndex} → ${toIndex}`);\r\n  }\r\n});\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Drag any item to reorder the list';\r\nObject.assign(note.style, { fontSize: '13px', color: '#6b7280', marginTop: '8px' });\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(container);\r\nwrapper.appendChild(note);\r\nmount(wrapper);\r\n:::\r\n\r\n## Touch support\r\n\r\nDrag-and-drop works on touch devices without any extra wiring.\r\n\r\n**A finger on a draggable is ambiguous** — scroll or drag? — and the browser settles it at the first\r\nmove: unless `touch-action` forbids panning, it starts scrolling and fires `pointercancel`, after which\r\nno `pointermove`/`pointerup` ever arrives for that pointer. DragDropService handles this in two ways:\r\n\r\n**1. Hold-to-arm.** A touch drag does not begin at `pointerdown`. The finger has to stay put for\r\n`touchDelay` ms (200 by default) first. Moving more than 8 px during that hold means \"scroll\", so the\r\nservice cancels and hands the gesture back to the page. Once armed, a non-passive `touchmove`\r\nlistener calls `preventDefault()` — the only way to stop the browser panning mid-drag — and the\r\nlong-press context menu and iOS selection callout are suppressed. Mouse and pen are unaffected: they\r\nstart immediately.\r\n\r\n```js\r\ndnd.makeDraggable(node, { touchDelay: 200 });   // ms of stillness before a touch drag arms\r\ndnd.makeSortable(container, { touchDelay: 120 });\r\n```\r\n\r\n**2. `pointercancel` cleans up.** When the browser takes the gesture anyway (a scroll, an incoming\r\ncall, a system gesture), the drag ends *cancelled*, not dropped:\r\n\r\n| What | On `pointercancel` |\r\n| --- | --- |\r\n| Draggable | `onDragLeave` fires for the hovered droppable, the live transform is cleared, and no free-position `left/top` is committed — the node snaps back |\r\n| Draggable | `onDragEnd` **still** fires, so you can undo any `onDragStart` state |\r\n| Sortable | the item returns to its original index and `onReorder` is **not** called |\r\n| Any | the ghost is removed and the service is immediately usable again |\r\n\r\nWithout this the service wedged permanently: `_activeDrag` stayed set, so every later drag was\r\nrefused, and a sortable left its item `display: none` with the ghost stuck on screen.\r\n\r\n## Auto-scroll chains across scrollers\r\n\r\nHolding a pointer near an edge scrolls the nearest scrollable ancestor — and when **that** reaches\r\nits end, the next ancestor takes over, ending at the page. This matters on a phone, where a drag out\r\nof a nested sidebar (a list, a card column) would otherwise only ever scroll that sidebar, leaving\r\nevery drop target out of reach. The target is re-picked on every animation frame, so a finger held\r\nstill at the edge still hands over.\r\n\r\n:::script label=\"Chained auto-scroll\" expected=\"the inner box scrolls first, then the page takes over and brings a drop target under the held pointer\"\r\nconst dnd = await slice.build('DragDropService', { singleton: true });\r\n\r\nconst frame = document.createElement('div');\r\nObject.assign(frame.style, { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' });\r\n\r\n// A nested scroll container holding the draggable…\r\nconst scroller = document.createElement('div');\r\nObject.assign(scroller.style, {\r\n  width: '200px', height: '180px', overflowY: 'auto',\r\n  border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px'\r\n});\r\nconst box = document.createElement('div');\r\nbox.textContent = 'Hold me at the bottom edge';\r\nObject.assign(box.style, {\r\n  padding: '10px', background: '#3b82f6', color: '#fff',\r\n  borderRadius: '6px', fontFamily: 'system-ui, sans-serif',\r\n  fontSize: '13px', fontWeight: '500', cursor: 'grab',\r\n  touchAction: 'none', marginBottom: '700px'\r\n});\r\nscroller.appendChild(box);\r\nscroller.appendChild(document.createElement('div'));   // makes the container scrollable\r\ndnd.makeDraggable(box, { ghost: true });\r\n\r\n// …and a drop target that lives on the page, far below the fold.\r\nconst zone = document.createElement('div');\r\nzone.textContent = 'Drop here (far below)';\r\nObject.assign(zone.style, {\r\n  marginTop: '900px', padding: '24px', textAlign: 'center',\r\n  border: '2px dashed #a78bfa', borderRadius: '8px',\r\n  fontFamily: 'system-ui, sans-serif', color: '#6d28d9'\r\n});\r\ndnd.makeDroppable(zone, {\r\n  onDragEnter: () => { zone.style.background = '#ede9fe'; },\r\n  onDragLeave: () => { zone.style.background = ''; },\r\n  onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; }\r\n});\r\n\r\nframe.appendChild(scroller);\r\nframe.appendChild(zone);\r\nmount(frame);\r\n:::\r\n\r\n## Cleanup\r\n\r\n```js\r\ndnd.detach(node);   // remove registrations from a specific node\r\n```\r\n\r\nAs an app-lifetime singleton, its global listeners, ghost, and registrations are cleaned up automatically by the framework (`beforeDestroy`) when the service is torn down — you don't tear it down by hand.\r\n\r\n## Best Practices\r\n\r\n- Set `touch-action: none` on draggable elements (already set on resize handles). **It does not\r\n  disable scrolling by itself** — the hold-to-arm delay is what keeps a tap-scrollable list\r\n  scrollable while a deliberate hold starts a drag.\r\n- Use `handle` when elements should be draggable only from a specific child (e.g., a header).\r\n- Always call `detach(node)` when removing a registered element from the DOM.\r\n- Use `accept` on droppables to filter which draggables are accepted.\r\n- Auto-scroll is on by default: dragging near an edge scrolls the nearest scrollable ancestor that\r\n  can still move that way, handing over to the next one — and finally the page — as each is\r\n  exhausted. Pass `autoScroll: false` to a draggable or sortable to opt out.\r\n- Auto-scroll only runs when the drag has somewhere to go (`freePosition` or at least one\r\n  droppable). A ghost-only drag with no droppables never scrolls the page.\r\n- Sortables ignore presses that land on an interactive descendant (`button`, `input`, `select`,\r\n  `textarea`, `a`, `[contenteditable]`, `[data-act]`, and the Slice form controls), so a button\r\n  inside a sortable card still works.\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const dnd = await slice.build('DragDropService', { singleton: true });\r",
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
               value: "dnd.makeDraggable(node, {\r\n  handle: '.title-bar',   // optional — restrict drag to a child\r\n  axis: 'both',           // 'x', 'y', or 'both'\r\n  ghost: true,            // show a ghost clone\r\n  threshold: 0,           // px before activating\r\n  touchDelay: 200,        // ms of finger stillness before a TOUCH drag arms (mouse/pen unaffected)\r\n  autoScroll: true,       // scroll scrollable ancestors near their edges, chaining outward\r\n  data: { id: 1 },\r\n  onDragStart(node, event, data),\r\n  onDrag(node, event, data, { dx, dy }),\r\n  onDragEnd(node, event, data)\r\n});\r",
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
               value: "dnd.makeDroppable(node, {\r\n  accept: (data) => data.type === 'task',\r\n  onDragEnter(node, event, data),\r\n  onDragLeave(node, event, data),\r\n  onDragOver(node, event, data),\r\n  onDrop(node, event, data)\r\n});\r",
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
               value: "dnd.makeResizable(node, {\r\n  handles: ['se', 'e', 's', 'w', 'n', 'ne', 'nw', 'sw'],\r\n  minWidth: 100, minHeight: 80,\r\n  maxWidth: 600, maxHeight: 400,\r\n  onResizeStart(node, event, rect),\r\n  onResize(node, event, rect),\r\n  onResizeEnd(node, event, rect)\r\n});\r",
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
               value: "dnd.makeDraggable(node, { ghost: true, freePosition: true });\r",
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
               value: "dnd.makeSortable(container, {\r\n  items: ':scope > *',     // selector for sortable items\r\n  axis: 'y',               // 'x' or 'y'\r\n  autoScroll: true,        // scroll a long/overflowing list while dragging near its edges\r\n  touchDelay: 200,         // ms of finger stillness before a TOUCH sort arms\r\n  onReorder: ({ fromIndex, toIndex, item, container }) => {\r\n    console.log(`Moved from ${fromIndex} to ${toIndex}`);\r\n  }\r\n});\r",
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
               value: "dnd.makeDraggable(node, { touchDelay: 200 });   // ms of stillness before a touch drag arms\r\ndnd.makeSortable(container, { touchDelay: 120 });\r",
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
            const lines = ["| What | On `pointercancel` |\r","| --- | --- |\r","| Draggable | `onDragLeave` fires for the hovered droppable, the live transform is cleared, and no free-position `left/top` is committed — the node snaps back |\r","| Draggable | `onDragEnd` **still** fires, so you can undo any `onDragStart` state |\r","| Sortable | the item returns to its original index and `onReorder` is **not** called |\r","| Any | the ghost is removed and the service is immediately usable again |\r"];
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
               value: "dnd.detach(node);   // remove registrations from a specific node\r",
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
    // Cleanup timers, listeners, or pending work here
  }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: '❐'
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
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
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
