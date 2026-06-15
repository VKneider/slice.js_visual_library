// Playground — internal, hidden sandbox for hand-testing anything against the
// REAL runtime, without polluting the docs or the navbar. Served at /playground
// (declared in parser/lib/routesSync.js so it survives `docs:generate`).
//
// It is a GENERAL scratch surface — drag-and-drop is just the first set of
// sections. Add your own `_section(...)` blocks freely; this file is not
// auto-generated. Not meant to be consumed by Slice apps.
export default class Playground extends HTMLElement {
   constructor() {
      super();
      slice.attachTemplate(this);
      this.$root = this.querySelector('[data-pg-root]');
   }

   async init() {
      this.dnd = await slice.build('DragDropService', { singleton: true });
      this._registered = [];

      this._dndRawSection();
      await this._dndSliceSection();
      await this._gallerySection();
      this._scratchSection();
   }

   // ── scaffolding ────────────────────────────────────────────────

   _section(title, subtitle) {
      const section = document.createElement('section');
      section.className = 'pg-section';
      const h = document.createElement('h2');
      h.className = 'pg-section__title';
      h.textContent = title;
      section.appendChild(h);
      if (subtitle) {
         const p = document.createElement('p');
         p.className = 'pg-section__sub';
         p.textContent = subtitle;
         section.appendChild(p);
      }
      const grid = document.createElement('div');
      grid.className = 'pg-section__grid';
      section.appendChild(grid);
      this.$root.appendChild(section);
      return grid;
   }

   _card(parent, title, hint) {
      const card = document.createElement('div');
      card.className = 'pg-card';
      const h = document.createElement('p');
      h.className = 'pg-card__title';
      h.textContent = title;
      card.appendChild(h);
      if (hint) {
         const p = document.createElement('p');
         p.className = 'pg-card__hint';
         p.textContent = hint;
         card.appendChild(p);
      }
      parent.appendChild(card);
      return card;
   }

   // Register a node with the DnD singleton and remember it so beforeDestroy can
   // detach it (the singleton outlives this view and holds strong refs).
   _track(node) {
      this._registered.push(node);
      return node;
   }

   // ── Drag & Drop on raw DOM ─────────────────────────────────────

   _dndRawSection() {
      const grid = this._section('Drag & Drop — raw DOM', 'DragDropService on plain elements.');
      this._freePositioningCard(grid);
      this._sortableCard(grid);
      this._dropZoneCard(grid);
      this._autoScrollCard(grid);
   }

   // freePosition WITHOUT a ghost: the real panel follows the pointer (no clone),
   // exactly what most DnD libraries do.
   _freePositioningCard(parent) {
      const card = this._card(parent, 'Free-positioning panel', 'Drag the header to move the panel itself; grab the edge squares to resize.');

      const panel = document.createElement('div');
      panel.innerHTML =
         '<div class="pg-panel__header" style="padding:8px 12px;background:#e0e7ff;border-radius:8px 8px 0 0;cursor:grab;font-weight:600;color:#4338ca;user-select:none">Header (drag here)</div>' +
         '<div style="padding:16px;color:#374151;font-size:14px">Moves the real container — no ghost.</div>';
      Object.assign(panel.style, {
         width: '240px',
         border: '1px solid #a5b4fc',
         borderRadius: '8px',
         background: '#fff',
         position: 'relative',
      });

      card.appendChild(panel);
      this.dnd.makeDraggable(panel, { handle: '.pg-panel__header', ghost: false, freePosition: true });
      this.dnd.makeResizable(panel, { handles: ['se', 'e', 's'], minWidth: 180, minHeight: 100 });
      this._track(panel);
   }

   _sortableCard(parent) {
      const card = this._card(parent, 'Sortable list', 'Drag items to reorder. Result logged to the console.');

      const list = document.createElement('div');
      Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '6px' });
      ['Task A', 'Task B', 'Task C', 'Task D'].forEach((text, i) => {
         const item = document.createElement('div');
         item.textContent = text;
         Object.assign(item.style, {
            padding: '12px 16px',
            background: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i],
            color: '#fff',
            borderRadius: '6px',
            cursor: 'grab',
            fontWeight: '500',
            touchAction: 'none',
         });
         list.appendChild(item);
      });

      card.appendChild(list);
      this.dnd.makeSortable(list, {
         items: 'div',
         onReorder: ({ fromIndex, toIndex }) => slice.logger?.logInfo?.('Playground', `reorder ${fromIndex} → ${toIndex}`),
      });
      this._track(list);
   }

   _dropZoneCard(parent) {
      const card = this._card(parent, 'Draggable + drop zone', 'Drag the chip into the zone (accept: type === "task").');

      const wrap = document.createElement('div');
      Object.assign(wrap.style, { display: 'flex', gap: '1rem', alignItems: 'center' });

      const chip = document.createElement('div');
      chip.textContent = 'task';
      Object.assign(chip.style, {
         width: '90px', height: '60px', background: '#8b5cf6', color: '#fff',
         display: 'flex', alignItems: 'center', justifyContent: 'center',
         borderRadius: '8px', cursor: 'grab', fontWeight: '600', touchAction: 'none',
      });
      this.dnd.makeDraggable(chip, { ghost: true, data: { type: 'task' } });

      const zone = document.createElement('div');
      zone.textContent = 'Drop here';
      Object.assign(zone.style, {
         width: '140px', height: '90px', border: '2px dashed #c4b5fd',
         borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
         color: '#7c3aed', fontWeight: '500', transition: 'all .2s',
      });
      this.dnd.makeDroppable(zone, {
         accept: (d) => d?.type === 'task',
         onDragEnter: () => { zone.style.background = '#ede9fe'; zone.style.borderColor = '#8b5cf6'; },
         onDragLeave: () => { zone.style.background = ''; zone.style.borderColor = '#c4b5fd'; },
         onDrop: () => { zone.textContent = 'Dropped!'; zone.style.background = '#dcfce7'; zone.style.borderColor = '#22c55e'; zone.style.color = '#166534'; },
      });

      wrap.appendChild(chip);
      wrap.appendChild(zone);
      card.appendChild(wrap);
      this._track(chip);
      this._track(zone);
   }

   _autoScrollCard(parent) {
      const card = this._card(parent, 'Auto-scroll', 'Drag the chip toward the bottom edge — the box scrolls.');

      const sc = document.createElement('div');
      Object.assign(sc.style, {
         width: '100%', height: '180px', overflow: 'auto',
         border: '1px solid #e5e7eb', borderRadius: '8px', position: 'relative',
      });

      const inner = document.createElement('div');
      Object.assign(inner.style, { height: '900px', position: 'relative', padding: '10px' });

      const chip = document.createElement('div');
      chip.textContent = 'drag me down';
      Object.assign(chip.style, {
         width: '120px', height: '40px', background: '#3b82f6', color: '#fff',
         display: 'flex', alignItems: 'center', justifyContent: 'center',
         borderRadius: '6px', cursor: 'grab', fontWeight: '500', touchAction: 'none',
      });
      this.dnd.makeDraggable(chip, { ghost: true });

      inner.appendChild(chip);
      sc.appendChild(inner);
      card.appendChild(sc);
      this._track(chip);
   }

   // ── Drag & Drop on real Slice components ───────────────────────

   async _dndSliceSection() {
      const grid = this._section('Drag & Drop — Slice components', 'The same service wired to real slice.build() components.');
      await this._sliceSortableCard(grid);
      await this._sliceButtonSortableCard(grid);
      await this._sliceFreePosCard(grid);
      await this._sliceModalCard(grid);
   }

   async _sliceModalCard(parent) {
      const card = this._card(parent, 'Draggable + resizable Modal', 'Opens a real Modal with draggable & resizable props.');
      const btn = await slice.build('Button', { value: 'Open modal' });
      if (!btn) return;
      btn.addEventListener('click', async () => {
         const modal = await slice.build('Modal', {
            title: 'Move me / resize me',
            open: true,
            draggable: true,
            resizable: true,
         });
         if (!modal) return;
         const p = document.createElement('p');
         p.textContent = 'Drag the header to move. Drag the edges or corners to resize.';
         modal.appendBody(p);
         document.body.appendChild(modal);
      });
      card.appendChild(btn);
   }

   async _sliceButtonSortableCard(parent) {
      const card = this._card(parent, 'Sortable <slice-button>s', 'Reorder real Button components.');

      const list = document.createElement('div');
      Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' });

      for (const label of ['One', 'Two', 'Three']) {
         const btn = await slice.build('Button', { value: label });
         if (!btn) continue;
         btn.style.cursor = 'grab';
         btn.style.touchAction = 'none';
         list.appendChild(btn);
      }

      card.appendChild(list);
      this.dnd.makeSortable(list, {
         items: ':scope > *',
         onReorder: ({ fromIndex, toIndex }) => slice.logger?.logInfo?.('Playground', `button reorder ${fromIndex} → ${toIndex}`),
      });
      this._track(list);
   }

   async _sliceSortableCard(parent) {
      const card = this._card(parent, 'Sortable <slice-card>s', 'Reorder real Card components built via slice.build().');

      const list = document.createElement('div');
      Object.assign(list.style, { display: 'flex', flexDirection: 'column', gap: '8px' });

      const data = [['Alpha', 'First card'], ['Beta', 'Second card'], ['Gamma', 'Third card']];
      for (const [title, text] of data) {
         const cardEl = await slice.build('Card', { title, text });
         if (!cardEl) continue;
         cardEl.style.cursor = 'grab';
         cardEl.style.touchAction = 'none';
         list.appendChild(cardEl);
      }

      card.appendChild(list);
      this.dnd.makeSortable(list, {
         items: ':scope > *',
         onReorder: ({ fromIndex, toIndex }) => slice.logger?.logInfo?.('Playground', `slice-card reorder ${fromIndex} → ${toIndex}`),
      });
      this._track(list);
   }

   async _sliceFreePosCard(parent) {
      const card = this._card(parent, 'Draggable <slice-button>', 'freePosition + no ghost: the real Button follows the pointer.');

      const btn = await slice.build('Button', { value: 'Drag me' });
      if (btn) {
         btn.style.cursor = 'grab';
         btn.style.touchAction = 'none';
         btn.style.position = 'relative';
         card.appendChild(btn);
         this.dnd.makeDraggable(btn, { ghost: false, freePosition: true });
         this._track(btn);
      }
   }

   // ── Slice components gallery (not DnD) ─────────────────────────

   async _gallerySection() {
      const grid = this._section('Slice components gallery', 'Any component renders here — the sandbox is not DnD-only.');
      await this._componentCard(grid, 'Input', 'Input', { placeholder: 'Type here…' });
      await this._componentCard(grid, 'Switch', 'Switch', {});
      await this._componentCard(grid, 'Checkbox', 'Checkbox', {});
      await this._componentCard(grid, 'Icon', 'Icon', {});
   }

   async _componentCard(parent, title, name, props) {
      const card = this._card(parent, title, null);
      const el = await slice.build(name, props);
      if (el) {
         card.appendChild(el);
      } else {
         const err = document.createElement('p');
         err.textContent = `(${name} failed to build — check the console)`;
         err.style.color = '#b91c1c';
         err.style.fontSize = '0.8rem';
         card.appendChild(err);
      }
   }

   // ── General scratch ────────────────────────────────────────────

   _scratchSection() {
      const grid = this._section('Scratch', 'General sandbox — add any experiment here, DnD or not.');
      this._card(grid, 'Empty card', 'Edit Playground.js to add your own scenarios.');
   }

   beforeDestroy() {
      // The DnD singleton outlives this view, so DON'T destroy it (that would
      // tear down drag-and-drop for the whole app). Just detach the nodes we
      // registered so the service stops retaining them.
      for (const node of this._registered || []) this.dnd?.detach(node);
   }
}

customElements.define('slice-playground', Playground);
