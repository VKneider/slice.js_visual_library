import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Behaviour tests for the headless DragDropService, driven with synthetic
// PointerEvents against the REAL Slice runtime in the `/__test` page (same
// philosophy as the Visual component specs, applied to plain HTML wired to the
// service). Test elements use `position: fixed` so client coordinates are
// viewport-relative and deterministic regardless of the harness root layout.
//
// The pointer helpers injected into the page:
//   pd(target,x,y) — pointerdown ON an element (bubbles to the document listener)
//   pm(x,y)        — pointermove on the document (where the service listens)
//   pu(x,y)        — pointerup on the document
const POINTER_HELPERS = `
  const pd = (t, x, y) => t.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, button: 0, bubbles: true, cancelable: true }));
  const pm = (x, y) => document.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
  const pu = (x, y) => document.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, button: 0, bubbles: true }));
`;

test.describe('DragDropService — draggable', () => {
   test('ghost appears only after the threshold and lifecycle callbacks fire in order', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="box" style="position:fixed;left:50px;top:50px;width:120px;height:80px;background:#3b82f6"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const log = [];
         dnd.makeDraggable(box, {
            ghost: true, threshold: 5,
            onDragStart: () => log.push('start'),
            onDrag: (n, e, d, delta) => log.push('drag:' + delta.dx + ',' + delta.dy),
            onDragEnd: () => log.push('end'),
         });

         pd(box, 110, 90);
         pm(112, 91);                                   // dist ~2.2 < threshold → no activation
         const ghostBeforeThreshold = !!document.querySelector('.dnd-ghost');
         pm(150, 90);                                   // dx 40 → activates
         const ghostDuring = !!document.querySelector('.dnd-ghost');
         const transform = document.querySelector('.dnd-ghost')?.style.transform || '';
         pu(150, 90);
         const ghostAfter = !!document.querySelector('.dnd-ghost');

         return { log, ghostBeforeThreshold, ghostDuring, ghostAfter, transform };
      })()`);

      expect(out.ghostBeforeThreshold).toBe(false);
      expect(out.ghostDuring).toBe(true);
      expect(out.ghostAfter).toBe(false);
      expect(out.log[0]).toBe('start');
      expect(out.log).toContain('drag:40,0');
      expect(out.log[out.log.length - 1]).toBe('end');
      expect(out.transform).toContain('translate(40px');
      expect(h.pageErrors()).toEqual([]);
   });

   test('axis:"x" zeroes vertical movement in the ghost transform and the onDrag delta', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="box" style="position:fixed;left:50px;top:50px;width:120px;height:80px"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         let lastDelta = null;
         dnd.makeDraggable(box, { axis: 'x', ghost: true, threshold: 0, onDrag: (n, e, d, delta) => { lastDelta = delta; } });

         pd(box, 110, 90);
         pm(140, 130);                                  // dx 30, dy 40 — y must be dropped
         const transform = document.querySelector('.dnd-ghost')?.style.transform || '';
         pu(140, 130);
         return { transform, lastDelta };
      })()`);

      expect(out.transform).toContain('translate(30px, 0px)');
      expect(out.lastDelta).toEqual({ dx: 30, dy: 0 });
   });
});

test.describe('DragDropService — free positioning', () => {
   test('lands a position:relative element at the drop point (regression)', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="box" style="position:relative;left:0;top:0;width:120px;height:80px;background:#f43f5e"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         dnd.makeDraggable(box, { ghost: true, freePosition: true, threshold: 0 });

         const before = box.getBoundingClientRect();
         const sx = before.left + 10, sy = before.top + 10;
         pd(box, sx, sy);
         pm(sx + 150, sy + 100);
         pu(sx + 150, sy + 100);
         const after = box.getBoundingClientRect();
         return {
            position: getComputedStyle(box).position,
            dx: after.left - before.left,
            dy: after.top - before.top,
         };
      })()`);

      expect(out.position).toBe('fixed');               // forced out of flow into viewport coords
      expect(Math.abs(out.dx - 150)).toBeLessThan(2);   // before the fix this was off by the flow offset
      expect(Math.abs(out.dy - 100)).toBeLessThan(2);
   });
});

test.describe('DragDropService — ghost', () => {
   test('ghost is fixed at the source position even when the source is position:relative', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div style="height:80px"></div>
          <div id="box" style="position:relative;top:0;left:0;width:120px;height:80px;background:#3b82f6"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         dnd.makeDraggable(box, { ghost: true, threshold: 0 });

         const src = box.getBoundingClientRect();
         pd(box, src.left + 10, src.top + 10);
         pm(src.left + 12, src.top + 12);              // activate (tiny move)
         const g = document.querySelector('.dnd-ghost');
         const gr = g.getBoundingClientRect();
         const result = { position: getComputedStyle(g).position, dTop: gr.top - src.top, dLeft: gr.left - src.left };
         pu(src.left + 12, src.top + 12);
         return result;
      })()`);

      expect(out.position).toBe('fixed');
      expect(Math.abs(out.dTop)).toBeLessThan(5);       // sits on the source, NOT far down the page
      expect(Math.abs(out.dLeft)).toBeLessThan(5);
   });
});

test.describe('DragDropService — free positioning', () => {
   test('without a ghost, the real element moves live and commits on drop', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="box" style="position:relative;left:0;top:0;width:120px;height:80px;background:#f43f5e"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         dnd.makeDraggable(box, { ghost: false, freePosition: true, threshold: 0 });

         const before = box.getBoundingClientRect();
         const sx = before.left + 10, sy = before.top + 10;
         pd(box, sx, sy);
         pm(sx + 120, sy + 90);
         const during = box.getBoundingClientRect();
         const result = {
            ghost: !!document.querySelector('.dnd-ghost'),
            duringTransform: box.style.transform,
            movedDx: during.left - before.left,
            movedDy: during.top - before.top,
         };
         pu(sx + 120, sy + 90);
         const after = box.getBoundingClientRect();
         result.position = getComputedStyle(box).position;
         result.afterTransform = box.style.transform;
         result.committedDx = after.left - before.left;
         result.committedDy = after.top - before.top;
         return result;
      })()`);

      expect(out.ghost).toBe(false);                    // no clone
      expect(out.duringTransform).toContain('translate(120px, 90px)');
      expect(Math.abs(out.movedDx - 120)).toBeLessThan(2);   // the REAL element moved during the drag
      expect(Math.abs(out.movedDy - 90)).toBeLessThan(2);
      expect(out.position).toBe('fixed');               // committed out of flow
      expect(out.afterTransform === '' || out.afterTransform === 'none').toBe(true);
      expect(Math.abs(out.committedDx - 120)).toBeLessThan(2);
      expect(Math.abs(out.committedDy - 90)).toBeLessThan(2);
   });
});

test.describe('DragDropService — droppable', () => {
   test('accepted draggable triggers enter + drop over the zone', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="box" style="position:fixed;left:0;top:0;width:60px;height:60px"></div>
          <div id="zone" style="position:fixed;left:300px;top:200px;width:100px;height:100px"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const zone = document.getElementById('zone');
         const log = [];
         dnd.makeDraggable(box, { ghost: true, threshold: 0, data: { type: 'task' } });
         dnd.makeDroppable(zone, {
            accept: (d) => d?.type === 'task',
            onDragEnter: () => log.push('enter'),
            onDrop: () => log.push('drop'),
         });

         pd(box, 30, 30);
         pm(350, 250);                                  // pointer now inside the zone rect
         pu(350, 250);
         return { log };
      })()`);

      expect(out.log).toContain('enter');
      expect(out.log).toContain('drop');
   });

   test('accept:false suppresses enter and drop', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="box" style="position:fixed;left:0;top:0;width:60px;height:60px"></div>
          <div id="zone" style="position:fixed;left:300px;top:200px;width:100px;height:100px"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const zone = document.getElementById('zone');
         const log = [];
         dnd.makeDraggable(box, { ghost: true, threshold: 0, data: { type: 'note' } });
         dnd.makeDroppable(zone, { accept: (d) => d?.type === 'task', onDragEnter: () => log.push('enter'), onDrop: () => log.push('drop') });

         pd(box, 30, 30);
         pm(350, 250);
         pu(350, 250);
         return { log };
      })()`);

      expect(out.log).toEqual([]);
   });
});

test.describe('DragDropService — resizable', () => {
   test('renders the requested handles', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="panel" style="position:fixed;left:100px;top:100px;width:200px;height:120px"></div>`,
         { services: ['DragDropService'] }
      );
      await h.page.evaluate(() => {
         const dnd = window.__sliceServices.DragDropService;
         dnd.makeResizable(document.getElementById('panel'), { handles: ['se', 'e', 's'] });
      });

      await expect(h.locator('.dnd-handle--se')).toBeAttached();
      await expect(h.locator('.dnd-handle--e')).toBeAttached();
      await expect(h.locator('.dnd-handle--s')).toBeAttached();
      await expect(h.locator('.dnd-handle--n')).toHaveCount(0);
   });

   // Regression: every corner handle must sit at ITS OWN corner. Two corner
   // insets used to resolve to the same box (ne landed on se, sw on nw), so the
   // later handle in DOM order swallowed the pointerdown and the resize ran
   // with the wrong edges. Synthetic pointer events dispatched straight on a
   // handle element cannot catch this — it needs a real hit test.
   test('each corner handle is hit-testable at its own corner', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="panel" style="position:fixed;left:100px;top:100px;width:200px;height:120px"></div>`,
         { services: ['DragDropService'] }
      );

      const hit = await h.page.evaluate(`(() => {
         const dnd = window.__sliceServices.DragDropService;
         const panel = document.getElementById('panel');
         dnd.makeResizable(panel, { handles: ['ne', 'nw', 'se', 'sw'] });
         const r = panel.getBoundingClientRect();
         const at = (x, y) => {
            const el = document.elementFromPoint(x, y);
            return el && el.closest('.dnd-handle') ? el.closest('.dnd-handle').dataset.handle : null;
         };
         return {
            ne: at(r.right - 2, r.top + 2),
            nw: at(r.left + 2, r.top + 2),
            se: at(r.right - 2, r.bottom - 2),
            sw: at(r.left + 2, r.bottom - 2),
         };
      })()`);

      expect(hit).toEqual({ ne: 'ne', nw: 'nw', se: 'se', sw: 'sw' });
   });

   test('a corner drag resizes from that corner (ne moves the north-west edges)', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="panel" style="position:fixed;left:100px;top:100px;width:200px;height:120px"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const panel = document.getElementById('panel');
         dnd.makeResizable(panel, { handles: ['ne'], minWidth: 50, minHeight: 50 });
         const ne = panel.querySelector('.dnd-handle--ne');
         pd(ne, 300, 100);
         pm(340, 140);                                  // delta +40, +40
         pu(340, 140);
         return { width: panel.style.width, height: panel.style.height, top: panel.style.top };
      })()`);

      // ne drives the east edge (width grows) and the north edge (height shrinks,
      // origin moves down) — the opposite of se.
      expect(out.width).toBe('240px');
      expect(out.height).toBe('80px');
      expect(out.top).toBe('140px');
   });

   test('dragging the SE handle grows width and height by the pointer delta', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="panel" style="position:fixed;left:100px;top:100px;width:200px;height:120px"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const panel = document.getElementById('panel');
         let endRect = null;
         dnd.makeResizable(panel, { handles: ['se'], minWidth: 120, minHeight: 80, onResizeEnd: (n, e, r) => { endRect = r; } });

         const se = panel.querySelector('.dnd-handle--se');
         pd(se, 300, 220);
         pm(340, 250);                                  // delta +40, +30
         pu(340, 250);
         return { width: panel.style.width, height: panel.style.height, endRect };
      })()`);

      expect(out.width).toBe('240px');
      expect(out.height).toBe('150px');
      expect(out.endRect).not.toBeNull();
   });

   test('SE resize clamps to the configured minimums', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="panel" style="position:fixed;left:100px;top:100px;width:200px;height:120px"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const panel = document.getElementById('panel');
         dnd.makeResizable(panel, { handles: ['se'], minWidth: 150, minHeight: 100 });
         const se = panel.querySelector('.dnd-handle--se');
         pd(se, 300, 220);
         pm(0, 0);                                      // huge negative delta → clamp
         pu(0, 0);
         return { width: panel.style.width, height: panel.style.height };
      })()`);

      expect(out.width).toBe('150px');
      expect(out.height).toBe('100px');
   });
});

test.describe('DragDropService — sortable', () => {
   const listHtml = `
      <div id="list" style="position:fixed;left:0;top:0;width:200px">
         <div class="it" style="height:40px;margin:0">A</div>
         <div class="it" style="height:40px;margin:0">B</div>
         <div class="it" style="height:40px;margin:0">C</div>
         <div class="it" style="height:40px;margin:0">D</div>
      </div>`;

   test('dragging the first item to the bottom reorders the DOM and reports from→to', async ({ mountHtml }) => {
      const h = await mountHtml(listHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         let report = null;
         dnd.makeSortable(list, { items: 'div', axis: 'y', onReorder: (p) => { report = { fromIndex: p.fromIndex, toIndex: p.toIndex }; } });

         const first = list.children[0];                // A
         pd(first, 100, 20);                            // grab inside A's row
         pm(100, 150);                                  // drag below D
         pu(100, 150);
         return { order: [...list.children].map((c) => c.textContent), report };
      })()`);

      expect(out.order).toEqual(['B', 'C', 'D', 'A']);
      expect(out.report).toEqual({ fromIndex: 0, toIndex: 3 });
   });

   test('dragging the last item to the top reorders the DOM', async ({ mountHtml }) => {
      const h = await mountHtml(listHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         let report = null;
         dnd.makeSortable(list, { items: 'div', axis: 'y', onReorder: (p) => { report = { fromIndex: p.fromIndex, toIndex: p.toIndex }; } });

         const last = list.children[3];                 // D
         pd(last, 100, 140);                            // grab inside D's row
         pm(100, 5);                                    // drag above A
         pu(100, 5);
         return { order: [...list.children].map((c) => c.textContent), report };
      })()`);

      expect(out.order).toEqual(['D', 'A', 'B', 'C']);
      expect(out.report).toEqual({ fromIndex: 3, toIndex: 0 });
   });

   test('a multi-step drag across several slots converges correctly (cached midpoints)', async ({ mountHtml }) => {
      const h = await mountHtml(listHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         let report = null;
         dnd.makeSortable(list, { items: 'div', axis: 'y', onReorder: (p) => { report = { fromIndex: p.fromIndex, toIndex: p.toIndex }; } });

         const first = list.children[0];               // A
         pd(first, 100, 20);
         // Many small moves, each potentially crossing a slot → exercises the
         // re-measure path, not just a single jump to the bottom.
         pm(100, 45);
         pm(100, 75);
         pm(100, 95);
         pm(100, 135);
         pm(100, 175);
         pu(100, 175);
         return { order: [...list.children].map((c) => c.textContent), report };
      })()`);

      expect(out.order).toEqual(['B', 'C', 'D', 'A']);
      expect(out.report).toEqual({ fromIndex: 0, toIndex: 3 });
   });

   test('items added AFTER makeSortable are sortable (container delegation)', async ({ mountHtml }) => {
      const h = await mountHtml(listHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         let report = null;
         dnd.makeSortable(list, { items: 'div', axis: 'y', onReorder: (p) => { report = { fromIndex: p.fromIndex, toIndex: p.toIndex }; } });

         // Item appended after wiring — only works with container-level delegation.
         const e = document.createElement('div');
         e.style.cssText = 'height:40px;margin:0';
         e.textContent = 'E';
         list.appendChild(e);

         pd(e, 100, 180);                               // grab the brand-new item (index 4)
         pm(100, 5);                                    // drag to the top
         pu(100, 5);
         return { order: [...list.children].map((c) => c.textContent), report };
      })()`);

      expect(out.order).toEqual(['E', 'A', 'B', 'C', 'D']);
      expect(out.report).toEqual({ fromIndex: 4, toIndex: 0 });
   });

   test('the dragged item is hidden even against a display:!important rule (no clone)', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<style>#list > div { display: flex !important; }</style>
          <div id="list" style="position:fixed;left:0;top:0;width:200px">
             <div style="height:40px;margin:0">A</div>
             <div style="height:40px;margin:0">B</div>
             <div style="height:40px;margin:0">C</div>
          </div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         dnd.makeSortable(list, { items: 'div' });

         const first = list.children[0];
         pd(first, 100, 20);
         pm(100, 90);
         const draggedDisplay = getComputedStyle(first).display;   // must win over !important flex
         pu(100, 90);
         const restoredDisplay = getComputedStyle(first).display;
         return { draggedDisplay, restoredDisplay };
      })()`);

      expect(out.draggedDisplay).toBe('none');     // hidden during the drag, no visible clone
      expect(out.restoredDisplay).toBe('flex');    // inline override removed on drop
   });

   test('detach stops the container from starting a sort', async ({ mountHtml }) => {
      const h = await mountHtml(listHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         let reordered = 0;
         dnd.makeSortable(list, { items: 'div', onReorder: () => { reordered++; } });
         dnd.detach(list);

         const first = list.children[0];
         pd(first, 100, 20);
         pm(100, 150);
         pu(100, 150);
         return { order: [...list.children].map((c) => c.textContent), reordered };
      })()`);

      expect(out.order).toEqual(['A', 'B', 'C', 'D']);
      expect(out.reordered).toBe(0);
   });
});

test.describe('DragDropService — auto-scroll', () => {
   const scrollHtml = `
      <div id="sc" style="position:fixed;left:0;top:0;width:200px;height:200px;overflow:auto">
         <div style="height:1200px;position:relative">
            <div id="box" style="position:absolute;top:0;left:20px;width:120px;height:40px;background:#3b82f6"></div>
         </div>
      </div>`;

   const frames = (n) =>
      `await new Promise((res) => { let i = 0; const t = () => (++i >= ${n} ? res() : requestAnimationFrame(t)); requestAnimationFrame(t); });`;

   test('dragging near the bottom edge scrolls the container, and stops on drop', async ({ mountHtml }) => {
      const h = await mountHtml(scrollHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(async () => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const sc = document.getElementById('sc');
         dnd.makeDraggable(box, { ghost: true, threshold: 0, freePosition: true });

         pd(box, 60, 20);
         pm(60, 195);                                   // hold near the bottom edge (container is 0..200)
         const before = sc.scrollTop;
         ${frames(12)}
         const afterScroll = sc.scrollTop;

         pu(60, 195);                                   // release → loop must stop
         const atRelease = sc.scrollTop;
         ${frames(6)}
         const afterRelease = sc.scrollTop;

         return { before, afterScroll, atRelease, afterRelease };
      })()`);

      expect(out.before).toBe(0);
      expect(out.afterScroll).toBeGreaterThan(0);        // it scrolled while held at the edge
      expect(out.afterRelease).toBe(out.atRelease);      // no scrolling after pointerup
   });

   test('no auto-scroll when the pointer stays in the middle', async ({ mountHtml }) => {
      const h = await mountHtml(scrollHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(async () => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const sc = document.getElementById('sc');
         dnd.makeDraggable(box, { ghost: true, threshold: 0, freePosition: true });

         pd(box, 60, 20);
         pm(60, 100);                                   // middle of the container — outside the edge zone
         ${frames(12)}
         const scrolled = sc.scrollTop;
         pu(60, 100);
         return { scrolled };
      })()`);

      expect(out.scrolled).toBe(0);
   });

   test('autoScroll:false disables edge scrolling', async ({ mountHtml }) => {
      const h = await mountHtml(scrollHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(async () => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const sc = document.getElementById('sc');
         dnd.makeDraggable(box, { ghost: true, threshold: 0, freePosition: true, autoScroll: false });

         pd(box, 60, 20);
         pm(60, 195);
         ${frames(12)}
         const scrolled = sc.scrollTop;
         pu(60, 195);
         return { scrolled };
      })()`);

      expect(out.scrolled).toBe(0);
   });

   // The "somewhere to go" heuristic: a plain ghost-only drag (no freePosition,
   // no droppables) must NOT scroll the page even at the edge — this is the
   // surprise the heuristic removes.
   test('a plain ghost-only drag with no droppables does NOT auto-scroll', async ({ mountHtml }) => {
      const h = await mountHtml(scrollHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(async () => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const sc = document.getElementById('sc');
         dnd.makeDraggable(box, { ghost: true, threshold: 0 });   // no freePosition, no droppable

         pd(box, 60, 20);
         pm(60, 195);                                   // at the bottom edge
         ${frames(12)}
         const scrolled = sc.scrollTop;
         pu(60, 195);
         return { scrolled };
      })()`);

      expect(out.scrolled).toBe(0);
   });

   test('a registered droppable re-enables auto-scroll (drag has somewhere to land)', async ({ mountHtml }) => {
      const h = await mountHtml(scrollHtml, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(async () => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const sc = document.getElementById('sc');
         dnd.makeDraggable(box, { ghost: true, threshold: 0 });   // no freePosition...
         dnd.makeDroppable(document.body, {});                    // ...but a drop target exists

         pd(box, 60, 20);
         pm(60, 195);
         ${frames(12)}
         const scrolled = sc.scrollTop;
         pu(60, 195);
         dnd.detach(document.body);
         return { scrolled };
      })()`);

      expect(out.scrolled).toBeGreaterThan(0);
   });
});

test.describe('DragDropService — detach', () => {
   test('a detached draggable no longer starts a drag', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="box" style="position:fixed;left:50px;top:50px;width:120px;height:80px"></div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(() => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         let starts = 0;
         dnd.makeDraggable(box, { ghost: true, threshold: 0, onDragStart: () => { starts++; } });
         dnd.detach(box);

         pd(box, 110, 90);
         pm(150, 90);
         pu(150, 90);
         return { starts, ghost: !!document.querySelector('.dnd-ghost') };
      })()`);

      expect(out.starts).toBe(0);
      expect(out.ghost).toBe(false);
   });

   test('detach removes the resize handles from a resizable node', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="panel" style="position:fixed;left:100px;top:100px;width:200px;height:120px"></div>`,
         { services: ['DragDropService'] }
      );
      await h.page.evaluate(() => {
         const dnd = window.__sliceServices.DragDropService;
         const panel = document.getElementById('panel');
         dnd.makeResizable(panel, { handles: ['se', 'e', 's'] });
      });
      await expect(h.locator('.dnd-handle--se')).toBeAttached();

      await h.page.evaluate(() => {
         const dnd = window.__sliceServices.DragDropService;
         dnd.detach(document.getElementById('panel'));
      });
      await expect(h.locator('.dnd-handle--se')).toHaveCount(0);
      await expect(h.locator('.dnd-resize-handles')).toHaveCount(0);
   });
});

// ─── Touch ────────────────────────────────────────────────────
//
// Playwright's touchscreen API can only tap, so the gesture is driven with
// synthetic PointerEvents carrying `pointerType: 'touch'` plus TouchEvents —
// which is exactly the input the service reacts to (see its header comment).
// The helpers therefore dispatch on the element under the point, so bubbling
// matches a real finger.
//
// `tpd/tpm/tpu/tpc` = touch pointerdown/move/up/cancel; `tmoveBlocked()` reports
// whether the service preventDefault()ed a touchmove (which is how an armed
// drag takes the gesture away from the browser).
const TOUCH_HELPERS = `
  const ev = (x, y, extra) => new PointerEvent(extra.type, {
    bubbles: true, cancelable: true, composed: true,
    pointerId: 7, pointerType: 'touch', isPrimary: true,
    button: 0, buttons: 1,
    clientX: x, clientY: y,
  });
  const at = (x, y) => document.elementFromPoint(x, y) || document.body;
  const tpd = (x, y) => at(x, y).dispatchEvent(ev(x, y, { type: 'pointerdown' }));
  const tpm = (x, y) => at(x, y).dispatchEvent(ev(x, y, { type: 'pointermove' }));
  const tpu = (x, y) => at(x, y).dispatchEvent(ev(x, y, { type: 'pointerup' }));
  const tpc = (x, y) => at(x, y).dispatchEvent(ev(x, y, { type: 'pointercancel' }));
  const tmoveBlocked = (x, y) => {
    const target = at(x, y);
    const t = new Touch({ identifier: 7, target, clientX: x, clientY: y });
    const e = new TouchEvent('touchmove', {
      bubbles: true, cancelable: true,
      touches: [t], targetTouches: [t], changedTouches: [t],
    });
    return !target.dispatchEvent(e);
  };
  const state = () => {
    const d = window.__sliceServices.DragDropService;
    return { drag: !!d._activeDrag, touch: !!d._touch, ghost: !!document.querySelector('.dnd-ghost') };
  };
`;

test.describe('DragDropService — touch', () => {
   const SCENE = `
      <div id="zone" style="position:fixed;left:400px;top:100px;width:200px;height:150px;border:1px solid #999"></div>
      <div id="box"  style="position:fixed;left:40px;top:100px;width:100px;height:60px;background:#3b82f6"></div>
   `;

   test('a fast scroll does not start a drag and pointercancel leaves the service clean', async ({ mountHtml }) => {
      const h = await mountHtml(SCENE, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(async () => {
         ${TOUCH_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         dnd.makeDraggable(box, { ghost: true });
         const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
         const steps = {};

         tpd(90, 130);
         steps.afterDown = state();          // pending hold: no drag yet, but a touch is tracked

         tpm(90, 180);                       // finger moves at once → this is a scroll
         steps.afterScrollMove = state();    // the hold is dropped, nothing is dragging

         tpc(90, 180);                       // the browser takes the gesture
         steps.afterCancel = state();

         // Not stuck: a later gesture still works.
         tpd(90, 130);
         await sleep(300);
         steps.afterHold = state();          // armed: ghost under the finger
         tpu(90, 130);
         steps.afterUp = state();
         return steps;
      })()`);

      expect(out.afterDown).toEqual({ drag: false, touch: true, ghost: false });
      expect(out.afterScrollMove).toEqual({ drag: false, touch: false, ghost: false });
      expect(out.afterCancel).toEqual({ drag: false, touch: false, ghost: false });
      expect(out.afterHold).toEqual({ drag: true, touch: true, ghost: true });
      expect(out.afterUp).toEqual({ drag: false, touch: false, ghost: false });
      expect(h.pageErrors()).toEqual([]);
   });

   test('holding arms the drag, blocks touchmove, and drops on the zone', async ({ mountHtml }) => {
      const h = await mountHtml(SCENE, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(async () => {
         ${TOUCH_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const zone = document.getElementById('zone');
         let hovered = 0, dropped = 0;
         dnd.makeDraggable(box, { ghost: true, data: { id: 42 } });
         dnd.makeDroppable(zone, {
            onDragOver: () => { hovered++; },
            onDrop: (n, e, data) => { dropped = data && data.id; },
         });
         const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

         tpd(90, 130);
         const beforeArm = tmoveBlocked(90, 130);   // not armed: the page may still scroll
         await sleep(300);
         const afterArm = tmoveBlocked(92, 132);    // armed: touchmove is taken over

         tpm(500, 180);
         tpu(500, 180);
         return { beforeArm, afterArm, hovered, dropped, state: state() };
      })()`);

      expect(out.beforeArm).toBe(false);
      expect(out.afterArm).toBe(true);
      expect(out.hovered).toBeGreaterThan(0);       // the zone was under the finger
      expect(out.dropped).toBe(42);                 // and the drop landed with the payload
      expect(out.state).toEqual({ drag: false, touch: false, ghost: false });
      expect(h.pageErrors()).toEqual([]);
   });

   test('pointercancel mid-drag: no drop, no ghost, hover cleared', async ({ mountHtml }) => {
      const h = await mountHtml(SCENE, { services: ['DragDropService'] });

      const out = await h.page.evaluate(`(async () => {
         ${TOUCH_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const box = document.getElementById('box');
         const zone = document.getElementById('zone');
         let over = 0, leave = 0, dropped = 0, ended = 0;
         dnd.makeDraggable(box, { ghost: true, onDragEnd: () => { ended++; } });
         dnd.makeDroppable(zone, {
            onDragOver: () => { over++; },
            onDragLeave: () => { leave++; },
            onDrop: () => { dropped++; },
         });
         const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

         tpd(90, 130);
         await sleep(300);
         tpm(500, 180);
         const overBefore = over;

         tpc(500, 180);
         await sleep(50);
         return { overBefore, over, leave, dropped, ended, state: state() };
      })()`);

      expect(out.overBefore).toBeGreaterThan(0);    // was hovering before the cancel
      expect(out.leave).toBe(1);                    // onDragLeave fired on cancel
      expect(out.dropped).toBe(0);                  // cancelled ≠ dropped
      expect(out.ended).toBe(1);                    // but consumers still get told it ended
      expect(out.state).toEqual({ drag: false, touch: false, ghost: false });
      expect(h.pageErrors()).toEqual([]);
   });

   test('auto-scroll chains from the inner scroller out to the page', async ({ mountHtml }) => {
      // The draggable lives INSIDE a tall inner scroller (a sidebar); the drop
      // target lives on the PAGE, far below the fold. It is only reachable if,
      // once the scroller is exhausted, the page scrolls under the held finger.
      const h = await mountHtml(
         `<div id="page-filler" style="height:3000px"></div>
          <div id="zone" style="position:absolute;left:380px;top:1300px;width:200px;height:100px;border:1px solid #999"></div>
          <div id="scroller" style="position:fixed;left:300px;top:0;width:300px;height:600px;overflow-y:auto;z-index:2">
            <div id="box" style="height:60px;background:#3b82f6"></div>
            <div style="height:900px"></div>
          </div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(async () => {
         ${TOUCH_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const scroller = document.getElementById('scroller');
         const box = document.getElementById('box');
         let over = 0;
         dnd.makeDraggable(box, { ghost: true });
         dnd.makeDroppable(document.getElementById('zone'), { onDragOver: () => { over++; } });
         const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
         // A real finger at the edge jitters, so re-dispatch a move each tick:
         // hover hit-testing only happens on pointermove, and a page scrolling
         // under a perfectly still pointer would otherwise never re-target it.
         const until = async (fn, ms) => {
            const t0 = performance.now();
            while (performance.now() - t0 < ms) {
               tpm(450, window.innerHeight - 16);
               if (fn()) return true;
               await sleep(50);
            }
            return false;
         };

         const before = { inner: scroller.scrollTop, page: window.scrollY };
         const cx = 450;
         tpd(cx, 30);                  // on the box, at the top of the inner scroller
         await sleep(300);

         // Hold the finger at the bottom edge, INSIDE the inner scroller. Only
         // the chained logic can hand the scroll over to the page.
         const edgeY = window.innerHeight - 16;
         tpm(cx, edgeY);
         const innerMoved = await until(() => scroller.scrollTop > before.inner, 4000);
         const innerPeak = scroller.scrollTop;
         const pageMoved = await until(() => window.scrollY > before.page, 6000);
         const reached = await until(() => over > 0, 8000);
         const after = { inner: innerPeak, page: window.scrollY };
         tpu(cx, edgeY);
         return { before, after, innerMoved, pageMoved, reached, over };
      })()`);

      // The inner scroller ran to its end…
      expect(out.innerMoved).toBe(true);
      // …and then the PAGE took over, which is what makes a target that lives
      // outside the scroller reachable at all.
      expect(out.pageMoved).toBe(true);
      // The scroll carried a target that lives outside the scroller under the finger.
      expect(out.reached).toBe(true);
      expect(out.over).toBeGreaterThan(0);
      expect(h.pageErrors()).toEqual([]);
   });

   test('sortable: arms after the hold, and pointercancel returns the row to its slot', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="list" style="position:fixed;left:40px;top:60px;width:300px">
            <div class="row" data-id="a" style="height:50px">A</div>
            <div class="row" data-id="b" style="height:50px">B</div>
            <div class="row" data-id="c" style="height:50px">C</div>
            <div class="row" data-id="d" style="height:50px">D</div>
          </div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(async () => {
         ${TOUCH_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         let reorders = 0;
         dnd.makeSortable(list, { onReorder: () => { reorders++; } });
         const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
         const ids = () => [...list.querySelectorAll('.row')].map((r) => r.dataset.id);
         const order = () => ids().join(',');

         const before = order();
         tpd(190, 90);                                    // on row A
         const notArmed = document.querySelectorAll('.dnd-sortable-ph').length;
         await sleep(300);
         const armed = { placeholders: document.querySelectorAll('.dnd-sortable-ph').length, ghosts: document.querySelectorAll('.dnd-ghost').length };

         tpm(190, 220);                                   // drag down two rows
         tpc(190, 220);                                   // browser interrupts
         await sleep(100);
         return { before, notArmed, armed, after: order(), reorders, visible: list.querySelectorAll('.row').length };
      })()`);

      expect(out.notArmed).toBe(0);              // nothing is touched before the hold
      expect(out.armed.placeholders).toBe(1);
      expect(out.armed.ghosts).toBe(1);
      expect(out.after).toBe(out.before);        // back in the original order…
      expect(out.reorders).toBe(0);               // …and no bogus reorder was reported
      expect(out.visible).toBe(4);               // …with no row left display:none
      expect(h.pageErrors()).toEqual([]);
   });

   test('sortable: a real touch drop reorders', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="list" style="position:fixed;left:40px;top:60px;width:300px">
            <div class="row" data-id="a" style="height:50px">A</div>
            <div class="row" data-id="b" style="height:50px">B</div>
            <div class="row" data-id="c" style="height:50px">C</div>
            <div class="row" data-id="d" style="height:50px">D</div>
          </div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(async () => {
         ${TOUCH_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         let report = null;
         dnd.makeSortable(list, { onReorder: (info) => { report = { from: info.fromIndex, to: info.toIndex, id: info.item.dataset.id }; } });
         const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
         const ids = () => [...list.querySelectorAll('.row')].map((r) => r.dataset.id).join(',');

         const before = ids();
         tpd(190, 90);          // row A (a, b, c, d) — index 0
         await sleep(300);
         tpm(190, 250);         // down past C
         tpu(190, 250);
         await sleep(100);
         return { before, after: ids(), report };
      })()`);

      expect(out.after).not.toBe(out.before);
      expect(out.after).toBe('b,c,d,a');   // A moved to the bottom
      expect(out.report).toEqual({ from: 0, to: 3, id: 'a' });
      expect(h.pageErrors()).toEqual([]);
   });

   test('sortable ignores interactive descendants (a button inside a row is not a drag)', async ({ mountHtml }) => {
      const h = await mountHtml(
         `<div id="list" style="position:fixed;left:40px;top:60px;width:300px">
            <div class="row" data-id="a" style="height:50px">A<button id="btn" style="float:right">x</button></div>
            <div class="row" data-id="b" style="height:50px">B</div>
          </div>`,
         { services: ['DragDropService'] }
      );

      const out = await h.page.evaluate(`(async () => {
         ${POINTER_HELPERS}
         const dnd = window.__sliceServices.DragDropService;
         const list = document.getElementById('list');
         dnd.makeSortable(list);
         const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
         const ph = () => document.querySelectorAll('.dnd-sortable-ph').length;

         const btn = document.getElementById('btn');
         const row = list.querySelector('.row');
         const bb = btn.getBoundingClientRect();

         pd(btn, bb.x + 2, bb.y + 2);        // press ON the button inside the row
         pm(bb.x + 2, bb.y + 60);
         pu(bb.x + 2, bb.y + 60);
         await sleep(20);
         const afterButton = ph();

         pd(row, 60, 85);                   // press on the row itself → eligible
         await sleep(20);
         const afterRow = ph();
         return { afterButton, afterRow };
      })()`);

      // The button press never started a sort; the row press did.
      expect(out.afterButton).toBe(0);
      expect(out.afterRow).toBe(1);
      expect(h.pageErrors()).toEqual([]);
   });
});
