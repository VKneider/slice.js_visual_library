// Playground — internal, hidden sandbox for hand-testing anything against the
// REAL runtime, without polluting the docs or the navbar. Served at /playground
// (declared in parser/lib/routesSync.js so it survives `docs:generate`).
//
// It is a GENERAL scratch surface — drag-and-drop is just the first set of
// sections. Add your own `_section(...)` blocks freely; this file is not
// auto-generated. Not meant to be consumed by Slice apps.
import gsap from 'gsap';

export default class Playground extends HTMLElement {
   constructor() {
      super();
      slice.attachTemplate(this);
      this.$root = this.querySelector('[data-pg-root]');
   }

   async init() {
      this.dnd = await slice.build('DragDropService', { singleton: true });
      this._gsapTweens = [];
      this._registered = [];

      this._dndRawSection();
      await this._dndSliceSection();
      await this._gallerySection();
      await this._externalLibsSection();
      await this._gsapSliceAnimSection();
      await this._gsapUtilitySection();
      await this._threeSection();
      await this._threeGalaxySection();
      this._scratchSection();
   }

   // ── External npm library (GSAP) ────────────────────────────────
   // Demonstrates importing a real, popular frontend package (gsap) with a bare
   // import and using it inside a Slice component — resolved from node_modules.
   async _externalLibsSection() {
      const grid = this._section(
         'External library — GSAP',
         'A real npm animation library (gsap) imported and used inside Slice components.'
      );

      const entrance = this._card(grid, 'Entrance (on mount)', 'Staggered bars via gsap.fromTo() — default 3 bars');
      entrance.appendChild(await slice.build('GsapDemo'));
      entrance.appendChild(
         this._hint('Animates in on mount with stagger 0.08. Data attr: data-gsap="done"')
      );

      const fast = this._card(grid, 'Entrance — fast (6 bars)', 'GsapDemo with bars=6, duration=0.15');
      const fastDemo = await slice.build('GsapDemo', { bars: 6, duration: 0.15 });
      fast.appendChild(fastDemo);
      fast.appendChild(
         this._hint('6 bars, faster stagger: demonstrates props passthrough to GsapDemo')
      );

      const big = this._card(grid, 'Entrance — big (12 bars)', 'GsapDemo with bars=12, duration=0.3');
      const bigDemo = await slice.build('GsapDemo', { bars: 12, duration: 0.3 });
      big.appendChild(bigDemo);
      big.appendChild(
         this._hint('12 bars, slower: demonstrates stagger across a large set')
      );

      const interactive = this._card(grid, 'Showcase (21 patterns)', 'Click, hover, timeline, keyframes, stagger, effects, utilities');
      const showcase = await slice.build('GsapShowcase');
      showcase.style.gridColumn = '1 / -1';
      interactive.appendChild(showcase);
   }

   // ── GSAP animating real Slice components ───────────────────────
   async _gsapSliceAnimSection() {
      const grid = this._section(
         'GSAP + Real Slice Components',
         'Using gsap.to() and gsap.timeline() on components built with slice.build().'
      );

      // Animate a Slice Button on click
      const btnCard = this._card(grid, 'Animate <slice-button>', 'Click to tween the button: pulse (scale) + color shift');
      const btn = await slice.build('Button', { value: 'Click to pulse' });
      if (btn) {
         btn.style.marginBottom = '8px';
         btn.addEventListener('click', () => {
            gsap.to(btn, { scale: 1.15, duration: 0.1, yoyo: true, repeat: 1, ease: 'power1.inOut' });
            gsap.to(btn, { borderColor: '#f59e0b', duration: 0.2, yoyo: true, repeat: 1, ease: 'none' });
         });
         btnCard.appendChild(btn);
         btnCard.appendChild(this._hint('Each click: scale pulse + border color flash via concurrent gsap.to()'));
         this._gsapTweens.push(btn);
      }

      // Animate a Slice Card with timeline
      const cardCard = this._card(grid, 'Animate <slice-card>', 'Hover to lift + glow; click to shake');
      const card = await slice.build('Card', { title: 'Hover / click me', text: 'GSAP animates this card in real time.' });
      if (card) {
         card.style.cursor = 'pointer';
         card.addEventListener('mouseenter', () => {
            gsap.to(card, { y: -8, boxShadow: '0 8px 24px rgba(108,92,231,0.25)', duration: 0.2, ease: 'power2.out' });
         });
         card.addEventListener('mouseleave', () => {
            gsap.to(card, { y: 0, boxShadow: 'none', duration: 0.2, ease: 'power2.out' });
         });
         card.addEventListener('click', () => {
            gsap.fromTo(card, { x: 0 }, { x: 6, duration: 0.04, repeat: 5, yoyo: true, ease: 'none',
               onComplete: () => { gsap.set(card, { x: 0 }); }
            });
         });
         cardCard.appendChild(card);
         cardCard.appendChild(this._hint('Hover: translateY + shadow. Click: shake effect. All GSAP.'));
         this._gsapTweens.push(card);
      }

      // Animate a Slice Switch
      const switchCard = this._card(grid, 'Animate <slice-switch>', 'Toggle to animate with timeline');
      const sw = await slice.build('Switch', {});
      if (sw) {
         sw.addEventListener('change', (e) => {
            const on = e.detail?.value ?? sw.hasAttribute('on');
            const tl = gsap.timeline();
            tl.to(sw, { scale: 0.85, duration: 0.08, ease: 'none' });
            tl.to(sw, { scale: 1.05, duration: 0.1, ease: 'back.out(3)' });
            tl.to(sw, { scale: 1, duration: 0.06, ease: 'none' });
         });
         switchCard.appendChild(sw);
         switchCard.appendChild(this._hint('Flip toggles a 3-step timeline: compress → overshoot → settle'));
         this._gsapTweens.push(sw);
      }

      // Timeline driving a Checkbox + Icon sequence
      const seqCard = this._card(grid, 'Sequenced components', 'Timeline drives Checkbox → Icon → Button in sequence');
      const seqBox = document.createElement('div');
      seqBox.style.display = 'flex';
      seqBox.style.gap = '12px';
      seqBox.style.alignItems = 'center';
      seqBox.style.flexWrap = 'wrap';

      const cb = await slice.build('Checkbox', {});
      const icon = await slice.build('Icon', { name: 'star' });
      const seqBtn = await slice.build('Button', { value: 'Play sequence' });

      if (cb && icon && seqBtn) {
         seqBox.appendChild(cb);
         seqBox.appendChild(icon);
         seqBox.appendChild(seqBtn);

         seqBtn.addEventListener('click', () => {
            const tl = gsap.timeline({
               onComplete: () => {
                  setTimeout(() => {
                     gsap.set([cb, icon, seqBtn], { scale: 1, opacity: 1 });
                  }, 600);
               }
            });
            tl.to(cb, { scale: 1.25, opacity: 0.5, duration: 0.2, ease: 'power2.out' })
               .to(icon, { rotation: 180, scale: 1.4, duration: 0.25, ease: 'back.out(2)' })
               .to(seqBtn, { scale: 1.2, backgroundColor: '#10b981', duration: 0.2, ease: 'power2.out' })
               .to([cb, icon, seqBtn], { scale: 1, opacity: 1, duration: 0.2, ease: 'power2.in' });
         });

         seqCard.appendChild(seqBox);
         seqCard.appendChild(this._hint('Button triggers a timeline: Checkbox → Icon (spin) → Button (green) → all reset'));
      }
   }

   // ── GSAP Utility methods ───────────────────────────────────────
   async _gsapUtilitySection() {
      const grid = this._section(
         'GSAP Utilities',
         'gsap.utils provides interpolate, clamp, snap, random, pipe, and more — no DOM needed.'
      );

      // Interpolate
      const interpCard = this._card(grid, 'gsap.utils.interpolate', 'Interpolate between two values (0 → 100) with easing');
      const interpBox = document.createElement('div');
      interpBox.style.display = 'flex';
      interpBox.style.flexDirection = 'column';
      interpBox.style.gap = '8px';

      const interpSlider = document.createElement('input');
      interpSlider.type = 'range';
      interpSlider.min = '0';
      interpSlider.max = '100';
      interpSlider.value = '0';
      interpSlider.style.width = '100%';
      interpSlider.style.accentColor = '#6c5ce7';

      const interpDisplay = document.createElement('div');
      interpDisplay.style.fontSize = '24px';
      interpDisplay.style.fontWeight = '700';
      interpDisplay.style.fontVariantNumeric = 'tabular-nums';
      interpDisplay.style.color = '#6c5ce7';
      interpDisplay.textContent = '0';

      const interpEased = document.createElement('div');
      interpEased.style.fontSize = '13px';
      interpEased.style.color = '#888';

      const interpolator = gsap.utils.interpolate(0, 100);
      interpSlider.addEventListener('input', () => {
         const raw = parseFloat(interpSlider.value);
         const eased = gsap.parseEase('power2.out')(raw / 100);
         interpDisplay.textContent = String(Math.round(interpolator(raw / 100)));
         interpEased.textContent = `linear: ${Math.round(interpolator(raw / 100))} · eased (power2.out): ${Math.round(interpolator(eased))}`;
      });
      interpBox.appendChild(interpSlider);
      interpBox.appendChild(interpDisplay);
      interpBox.appendChild(interpEased);
      interpCard.appendChild(interpBox);

      // Clamp + Snap
      const clampCard = this._card(grid, 'gsap.utils.clamp + .snap', 'Drag the slider — values are clamped [20, 80] and snapped to steps of 10');
      const clampBox = document.createElement('div');
      clampBox.style.display = 'flex';
      clampBox.style.flexDirection = 'column';
      clampBox.style.gap = '8px';

      const clampSlider = document.createElement('input');
      clampSlider.type = 'range';
      clampSlider.min = '0';
      clampSlider.max = '100';
      clampSlider.value = '50';
      clampSlider.style.width = '100%';
      clampSlider.style.accentColor = '#10b981';

      const clampDisplay = document.createElement('div');
      clampDisplay.style.fontSize = '18px';
      clampDisplay.style.fontWeight = '600';
      clampDisplay.style.fontVariantNumeric = 'tabular-nums';
      clampDisplay.textContent = 'raw: 50 · clamped: 50 · snapped: 50';

      const clamp = gsap.utils.clamp(20, 80);
      const snap = gsap.utils.snap(10);
      clampSlider.addEventListener('input', () => {
         const raw = parseFloat(clampSlider.value);
         const clamped = clamp(raw);
         const snapped = snap(raw);
         clampDisplay.textContent = `raw: ${raw} · clamped: ${clamped} · snapped: ${snapped}`;
      });
      clampBox.appendChild(clampSlider);
      clampBox.appendChild(clampDisplay);
      clampCard.appendChild(clampBox);

      // Random
      const randomCard = this._card(grid, 'gsap.utils.random', 'Generate random values with distribution control');
      const randomBox = document.createElement('div');
      randomBox.style.display = 'flex';
      randomBox.style.flexDirection = 'column';
      randomBox.style.gap = '8px';

      const randomBtn = document.createElement('button');
      Object.assign(randomBtn.style, {
         font: 'inherit', fontSize: '13px', padding: '8px 14px', borderRadius: '8px',
         cursor: 'pointer', border: '1px solid #ccc', background: '#f4f4f5', color: '#111',
         alignSelf: 'flex-start'
      });
      randomBtn.textContent = 'Roll';

      const randomResults = document.createElement('div');
      randomResults.style.display = 'flex';
      randomResults.style.gap = '16px';
      randomResults.style.flexWrap = 'wrap';

      const random1 = document.createElement('span');
      random1.style.fontWeight = '600';
      random1.style.color = '#3b82f6';
      const random2 = document.createElement('span');
      random2.style.fontWeight = '600';
      random2.style.color = '#10b981';
      const random3 = document.createElement('span');
      random3.style.fontWeight = '600';
      random3.style.color = '#f59e0b';

      const randInt = gsap.utils.random(1, 100, 1);
      const randFloat = gsap.utils.random(0, 1, 0.01);
      const randColor = () => {
         const r = Math.round(gsap.utils.random(0, 255, 1)());
         const g = Math.round(gsap.utils.random(0, 255, 1)());
         const b = Math.round(gsap.utils.random(0, 255, 1)());
         return `rgb(${r},${g},${b})`;
      };

      randomBtn.addEventListener('click', () => {
         random1.textContent = `int: ${randInt()}`;
         random2.textContent = `float: ${randFloat().toFixed(2)}`;
         random3.textContent = `color: ${randColor()}`;
         random3.style.color = randColor();
      });

      randomResults.appendChild(random1);
      randomResults.appendChild(random2);
      randomResults.appendChild(random3);
      randomBox.appendChild(randomBtn);
      randomBox.appendChild(randomResults);
      randomCard.appendChild(randomBox);

      // Pipe + ease
      const pipeCard = this._card(grid, 'gsap.utils.pipe + .toArray', 'Compose utility functions with pipe() — ramp input through multiple transforms');
      const pipeBox = document.createElement('div');
      pipeBox.style.display = 'flex';
      pipeBox.style.flexDirection = 'column';
      pipeBox.style.gap = '8px';

      const pipeSlider = document.createElement('input');
      pipeSlider.type = 'range';
      pipeSlider.min = '0';
      pipeSlider.max = '100';
      pipeSlider.value = '25';
      pipeSlider.style.width = '100%';
      pipeSlider.style.accentColor = '#ef4444';

      const pipeDisplay = document.createElement('div');
      pipeDisplay.style.fontSize = '14px';
      pipeDisplay.style.fontFamily = 'monospace';

      const pipe = gsap.utils.pipe(
         (v) => v / 100,
         gsap.parseEase('power3.inOut'),
         (v) => Math.round(v * 200),
         (v) => `$${v}`
      );
      pipeSlider.addEventListener('input', () => {
         const raw = parseFloat(pipeSlider.value);
         pipeDisplay.textContent = `pipe(${raw}): input → normalize → ease → scale(0-200) → currency → ${pipe(raw)}`;
      });
      pipeDisplay.textContent = `pipe(25): input → normalize → ease → scale(0-200) → currency → ${pipe(25)}`;
      pipeBox.appendChild(pipeSlider);
      pipeBox.appendChild(pipeDisplay);
      pipeCard.appendChild(pipeBox);
   }

   // ── Three.js section ───────────────────────────────────────────
   async _threeSection() {
      const grid = this._section(
         'Three.js 3D Graphics',
         'WebGL 3D rendering with three.js — geometries, materials, lights, interaction, and animation.'
      );

      const showcase = this._card(grid, 'ThreeShowcase (6 demos)', 'Cube, sphere with lights, wireframe toggle, color change, bounce, multi-geometry');
      const ts = await slice.build('ThreeShowcase');
      if (ts) {
         showcase.appendChild(ts);
         showcase.appendChild(
            this._hint('6 independent Three.js scenes with WebGL renderers. Each canvas has its own camera, lights, and animation loop.')
         );
         this._gsapTweens.push(ts);
      }
   }

   // ── Three.js Galaxy (hero) ─────────────────────────────────────
   async _threeGalaxySection() {
      const section = document.createElement('section');
      section.className = 'pg-section';
      const h = document.createElement('h2');
      h.className = 'pg-section__title';
      h.textContent = 'Three.js — Galactic Core';
      section.appendChild(h);
      const p = document.createElement('p');
      p.className = 'pg-section__sub';
      p.textContent = 'Large-scale cosmic particle scene: 4000 stars in a spiral galaxy with zoom, drag-to-orbit, 4 themes, and click-to-burst effect.';
      section.appendChild(p);
      const galaxy = await slice.build('ThreeGalaxy');
      if (galaxy) {
         galaxy.style.display = 'block';
         section.appendChild(galaxy);
      }
      this.$root.appendChild(section);
      if (galaxy) this._gsapTweens.push(galaxy);
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

   _hint(text) {
      const p = document.createElement('p');
      p.className = 'pg-card__hint';
      p.textContent = text;
      p.style.marginTop = '6px';
      p.style.marginBottom = '0';
      return p;
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
      // Kill any GSAP tweens that might still be running.
      for (const el of this._gsapTweens || []) gsap.killTweensOf(el);
      // The DnD singleton outlives this view, so DON'T destroy it (that would
      // tear down drag-and-drop for the whole app). Just detach the nodes we
      // registered so the service stops retaining them.
      for (const node of this._registered || []) this.dnd?.detach(node);
   }
}

customElements.define('slice-playground', Playground);
