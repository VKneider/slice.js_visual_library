import { texts } from '../../shared/text/texts.js';
// ElementCarrousel — a row of slides that scrolls one position at a time.
//
// The track is a native scroll container with scroll-snap, so a swipe on a
// phone, a trackpad flick and Shift+wheel all move it the way the platform
// does; a mouse can drag it too. Arrows, dots (or a "2 / 5" count, or
// thumbnails), the keyboard and autoplay drive the same scroll.
//
//   perView   slides side by side: a number, or { 0: 1, 640: 2, 1024: 3 }
//             keyed by the carousel's own width
//   gap       space between slides
//   peek      how much of the next slide shows, as a hint there is more
//   align     'start' snaps slides to the left edge, 'center' to the middle
//   loop      the last position goes on to the first, and back
//   autoplay  true (5s) or milliseconds; pauses on hover and focus, never
//             starts with reduced motion, and shows a pause button (WCAG 2.2.2)
//
// Slides are announced as "Slide 2 of 5"; slides out of view are inert, so
// Tab never lands on something you cannot see.

const DEFAULT_INTERVAL = 5000;
const ARROWS = ['overlay', 'outside', 'none'];
const INDICATORS = ['dots', 'count', 'thumbnails', 'none'];
const ALIGNS = ['start', 'center'];
const NARROW = 480;

const TEXTS = {
   label: 'Carousel',
   slide: '{index} of {total}',
   previous: 'Previous slide',
   next: 'Next slide',
   goTo: 'Go to slide {page}',
   play: 'Play slides',
   pause: 'Pause slides',
   announce: 'Slide {index} of {total}',
};

// Spanish mirrors TEXTS key by key; the app can override any of them with its dictionary.
const ES = {
   label: 'Carrusel',
   slide: '{index} de {total}',
   previous: 'Diapositiva anterior',
   next: 'Diapositiva siguiente',
   goTo: 'Ir a la diapositiva {page}',
   play: 'Reproducir diapositivas',
   pause: 'Pausar diapositivas',
   announce: 'Diapositiva {index} de {total}',
};

const t = texts('slice.carousel', { en: TEXTS, es: ES });

function fill(template, values) {
   return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

export default class ElementCarrousel extends HTMLElement {
   static props = {
      elements: { type: 'array', default: [] },
      perView: { type: 'any', default: 1 },
      gap: { type: 'number', default: 16 },
      peek: { type: 'number', default: 0 },
      align: { type: 'string', default: 'start', allowedValues: ALIGNS },
      loop: { type: 'boolean', default: false },
      autoplay: { type: 'any', default: false },
      arrows: { type: 'string', default: 'overlay', allowedValues: ARROWS },
      indicators: { type: 'string', default: 'dots', allowedValues: INDICATORS },
      // (slide, index) => Node, for indicators: 'thumbnails'
      thumbnail: { type: 'function', default: null },
      startIndex: { type: 'number', default: 0 },
      label: { type: 'string', default: '' },
      texts: { type: 'object', default: null },
      onChange: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-element-carrousel');

      this.$viewport = this.querySelector('.slice-element-carrousel__viewport');
      this.$track = this.querySelector('.slice-element-carrousel__track');
      this.$prevSlot = this.querySelector('.slice-element-carrousel__arrow--prev');
      this.$nextSlot = this.querySelector('.slice-element-carrousel__arrow--next');
      this.$footer = this.querySelector('.slice-element-carrousel__footer');
      this.$playSlot = this.querySelector('.slice-element-carrousel__play');
      this.$count = this.querySelector('.slice-element-carrousel__count');
      this.$dotsSlot = this.querySelector('.slice-element-carrousel__dots');
      this.$thumbs = this.querySelector('.slice-element-carrousel__thumbs');
      this.$live = this.querySelector('.slice-element-carrousel__live');

      this.setAttribute('role', 'region');
      this.setAttribute('aria-roledescription', 'carousel');

      this._elements = [];
      /** @type {number | Record<number, number>} */
      this._perView = 1;
      this._gap = 16;
      this._peek = 0;
      this._align = 'start';
      this._loop = false;
      this._autoplay = 0;
      this._arrows = 'overlay';
      this._indicators = 'dots';
      this._thumbnail = null;
      this._startIndex = 0;
      this._label = '';
      this._texts = {};
      this._onChange = null;

      this.slides = [];
      this._index = 0;
      this._visibleCount = 1;
      this._narrow = false;
      this._ready = false;
      this._built = {};
      this._paused = false;        // paused by the person (button)
      this._held = false;          // paused while hovered or focused
      this._timer = null;
      this._scrollFrame = 0;
      this._drag = null;
      this._announce = false;
      this._controlsToken = 0;     // newest control build; older ones are dropped
      this._dotsToken = 0;

      this._onScroll = this._onScroll.bind(this);
      this._gliding = 0;
      this._onScrollEnd = () => {
         if (!this._gliding) return;
         this._gliding = 0;
         this._onScroll();
      };
      this._onKeyDown = this._onKeyDown.bind(this);
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);
      this._suppressClickUntil = 0;
      // A drag is not a click on what is under the pointer when it ends.
      this._onClickCapture = (event) => {
         if (performance.now() > this._suppressClickUntil) return;
         event.preventDefault();
         event.stopPropagation();
      };
      this._hold = () => { this._held = true; this._stopTimer(); };
      this._release = (event) => {
         if (event?.type === 'focusout' && this.contains(event.relatedTarget)) return;
         if (event?.type === 'pointerleave' && this.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
         this._held = false;
         this._startTimer();
      };

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this._ready = true;
      this.$track.addEventListener('scroll', this._onScroll, { passive: true });
      this.$track.addEventListener('scrollend', this._onScrollEnd);
      this.$track.addEventListener('pointerdown', this._onPointerDown);
      this.addEventListener('keydown', this._onKeyDown);
      this.addEventListener('click', this._onClickCapture, true);
      this.addEventListener('pointerenter', this._hold);
      this.addEventListener('pointerleave', this._release);
      this.addEventListener('focusin', this._hold);
      this.addEventListener('focusout', this._release);
      this._resize = new ResizeObserver(() => this._layout());
      this._resize.observe(this);
      this._applyLabel();
      slice.translator?.watch?.(this, () => {
         this._applyLabel();
         this._renderControls();
         this._renderSlides();
         this.goTo(this._index, { behavior: 'instant', silent: true });
      });
      this._applyLooks();
      this._renderSlides();
      await this._renderControls();
      this._layout();
      this.goTo(this._startIndex, { behavior: 'instant', silent: true });
      this._startTimer();
   }

   beforeDestroy() {
      this._ready = false;
      this._stopTimer();
      this._resize?.disconnect();
      this.$track.removeEventListener('scroll', this._onScroll);
      this.$track.removeEventListener('scrollend', this._onScrollEnd);
      this.$track.removeEventListener('pointerdown', this._onPointerDown);
      this.removeEventListener('keydown', this._onKeyDown);
      this.removeEventListener('click', this._onClickCapture, true);
      this.removeEventListener('pointerenter', this._hold);
      this.removeEventListener('pointerleave', this._release);
      this.removeEventListener('focusin', this._hold);
      this.removeEventListener('focusout', this._release);
      this._endDrag();
      cancelAnimationFrame(this._scrollFrame);
      for (const node of Object.values(this._built)) if (node?.sliceId) slice.controller.destroyComponent(node);
      this._built = {};
      this._destroySlides(new Set());
   }

   // ── Props ──────────────────────────────────────────────────────

   get elements() { return this._elements; }
   set elements(value) {
      this._elements = Array.isArray(value) ? value : [];
      if (this._ready) {
         this._renderSlides();
         this._renderIndicators();
         this._layout();
         this.goTo(Math.min(this._index, this.maxIndex), { behavior: 'instant', silent: true });
      }
   }

   get perView() { return this._perView; }
   set perView(value) { this._perView = value && typeof value === 'object' ? value : Math.max(1, Number(value) || 1); this._ready && this._layout(); }

   get gap() { return this._gap; }
   set gap(value) { this._gap = Math.max(0, Number(value) || 0); this._ready && this._layout(); }

   get peek() { return this._peek; }
   set peek(value) { this._peek = Math.max(0, Number(value) || 0); this._ready && this._layout(); }

   get align() { return this._align; }
   set align(value) { this._align = ALIGNS.includes(value) ? value : 'start'; this._ready && this._layout(); }

   get loop() { return this._loop; }
   set loop(value) { this._loop = value === true; this._ready && this._syncControls(); }

   get autoplay() { return this._autoplay; }
   /** @param {boolean | number} value true (5 s) or milliseconds */
   set autoplay(value) {
      this._autoplay = value === true ? DEFAULT_INTERVAL : Number(value) > 0 ? Number(value) : 0;
      if (this._ready) {
         this._renderControls();
         this._startTimer();
      }
   }

   get arrows() { return this._arrows; }
   set arrows(value) { this._arrows = ARROWS.includes(value) ? value : 'overlay'; this._ready && this._applyLooks(); }

   get indicators() { return this._indicators; }
   set indicators(value) {
      this._indicators = INDICATORS.includes(value) ? value : 'dots';
      if (this._ready) {
         this._applyLooks();
         this._renderIndicators();
      }
   }

   get thumbnail() { return this._thumbnail; }
   set thumbnail(value) { this._thumbnail = typeof value === 'function' ? value : null; this._ready && this._renderIndicators(); }

   get startIndex() { return this._startIndex; }
   set startIndex(value) { this._startIndex = Math.max(0, Math.trunc(Number(value) || 0)); }

   get label() { return this._label; }
   set label(value) { this._label = value ? String(value) : ''; this._applyLabel(); }

   get texts() { return this._texts; }
   set texts(value) {
      this._texts = value && typeof value === 'object' ? { ...value } : {};
      this._applyLabel();
      if (this._ready) {
         this._renderControls();
         this._renderSlides();
      }
   }

   get onChange() { return this._onChange; }
   set onChange(value) { this._onChange = typeof value === 'function' ? value : null; }

   /** The first slide in view. */
   get index() { return this._index; }

   /** The last position the carousel can scroll to. */
   get maxIndex() { return Math.max(0, this.slides.length - this._visibleCount); }

   /** Whether autoplay is running. */
   get playing() { return !!this._autoplay && !this._paused && !this._held && !this._reducedMotion(); }

   // ── Methods ────────────────────────────────────────────────────

   /**
    * Move to a slide (clamped; wraps with loop).
    * @param {number} index
    * @param {{ behavior?: ScrollBehavior, silent?: boolean }} [options]
    */
   goTo(index, { behavior, silent = false } = {}) {
      if (!this.slides.length) return;
      let target = Math.trunc(Number(index) || 0);
      if (this._loop) {
         const positions = this.maxIndex + 1;
         target = ((target % positions) + positions) % positions;
      } else {
         target = Math.min(Math.max(0, target), this.maxIndex);
      }
      const slide = this.slides[target];
      const padStart = parseFloat(getComputedStyle(this.$track).scrollPaddingInlineStart) || 0;
      let left = slide.offsetLeft - padStart;
      if (this._align === 'center') left = slide.offsetLeft - (this.$track.clientWidth - slide.offsetWidth) / 2;
      const smooth = behavior ? behavior : this._reducedMotion() ? 'instant' : 'smooth';
      // While it glides there, the scroll passes other slides: they are not
      // the index. The scroll takes over again once it ends.
      this._gliding = smooth === 'smooth' ? performance.now() + 1000 : 0;
      this.$track.scrollTo({ left, behavior: smooth });
      this._setIndex(target, { silent });
   }

   next() { this.goTo(this._index + 1 > this.maxIndex && this._loop ? 0 : this._index + 1); }

   previous() { this.goTo(this._index - 1 < 0 && this._loop ? this.maxIndex : this._index - 1); }

   play() {
      this._paused = false;
      this._syncPlay();
      this._startTimer();
   }

   pause() {
      this._paused = true;
      this._stopTimer();
      this._syncPlay();
   }

   // ── Slides ─────────────────────────────────────────────────────

   // Slides belong to the carousel: when one is dropped from `elements`, the
   // Slice components in it are destroyed, not just detached. Elements passed
   // again are kept as they are.
   _destroySlides(keep) {
      for (const slide of this.slides) {
         for (const node of Array.from(slide.children)) {
            if (keep.has(node)) continue;
            if (node.sliceId) slice.controller.destroyComponent(node);
            else slice.controller.destroyByContainer(node);
         }
      }
      this.$track.replaceChildren();
      this.slides = [];
   }

   _renderSlides() {
      this._destroySlides(new Set(this._elements));
      const total = this._elements.length;
      this._elements.forEach((element, i) => {
         const slide = document.createElement('li');
         slide.className = 'slice-element-carrousel__slide';
         slide.setAttribute('role', 'group');
         slide.setAttribute('aria-roledescription', 'slide');
         slide.setAttribute('aria-label', this._t('slide', { index: i + 1, total }));
         if (element instanceof Node) slide.appendChild(element);
         else slide.textContent = String(element);
         this.$track.appendChild(slide);
         this.slides.push(slide);
      });
      this.classList.toggle('is-empty', total === 0);
   }

   // ── Controls ───────────────────────────────────────────────────

   async _renderControls() {
      const token = (this._controlsToken += 1);
      for (const key of ['prev', 'next', 'play']) {
         if (this._built[key]) slice.controller.destroyComponent(this._built[key]);
         this._built[key] = null;
      }
      this.$prevSlot.replaceChildren();
      this.$nextSlot.replaceChildren();
      this.$playSlot.replaceChildren();

      const make = (icon, label, onClick) => slice.build('Button', {
         value: '', ariaLabel: label, icon, variant: 'outlined', size: 'sm', onClick,
      });
      const [prev, next, play] = await Promise.all([
         make('chevron-left', this._t('previous'), () => this.previous()),
         make('chevron-right', this._t('next'), () => this.next()),
         this._autoplay ? make('pause', this._t('pause'), () => (this._paused ? this.play() : this.pause())) : null,
      ]);
      if (token !== this._controlsToken || !this._ready) {
         for (const b of [prev, next, play]) if (b) slice.controller.destroyComponent(b);
         return;
      }
      Object.assign(this._built, { prev, next, play });
      if (prev) this.$prevSlot.appendChild(prev);
      if (next) this.$nextSlot.appendChild(next);
      if (play) this.$playSlot.appendChild(play);
      await this._renderIndicators();
      this._syncControls();
      this._syncPlay();
   }

   async _renderIndicators() {
      const token = (this._dotsToken += 1);
      if (this._built.dots) slice.controller.destroyComponent(this._built.dots);
      this._built.dots = null;
      this.$dotsSlot.replaceChildren();
      this.$thumbs.replaceChildren();
      this.$thumbs.hidden = this._indicators !== 'thumbnails';
      this.$count.hidden = this._indicators !== 'count';

      if (this._indicators === 'dots' && this.slides.length > 1) {
         const dots = await slice.build('Pagination', {
            mode: 'dots',
            totalPages: this.maxIndex + 1,
            currentPage: this._index + 1,
            controlled: true,
            showPrevNext: false,
            variant: 'ghost',
            size: 'sm',
            texts: { label: this._t('label'), page: this._texts.goTo ?? t('goTo') },
            onPageChange: (page) => this.goTo(Number(page) - 1),
         });
         if (token !== this._dotsToken || !this._ready) {
            if (dots) slice.controller.destroyComponent(dots);
            return;
         }
         this._built.dots = dots;
         if (dots) this.$dotsSlot.appendChild(dots);
      } else if (this._indicators === 'thumbnails') {
         this.slides.forEach((slide, i) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'slice-element-carrousel__thumb';
            button.dataset.index = String(i);
            button.setAttribute('aria-label', this._t('goTo', { page: i + 1 }));
            const content = this._thumbnail?.(this._elements[i], i);
            if (content instanceof Node) button.appendChild(content);
            else button.textContent = String(i + 1);
            button.addEventListener('click', () => this.goTo(i));
            this.$thumbs.appendChild(button);
         });
      }
      this._syncControls();
   }

   _syncControls() {
      const { prev, next, dots } = this._built;
      const atStart = this._index <= 0;
      const atEnd = this._index >= this.maxIndex;
      if (prev) prev.disabled = !this._loop && atStart;
      if (next) next.disabled = !this._loop && atEnd;
      const single = this.maxIndex === 0;
      this.classList.toggle('is-single', single);
      if (dots) {
         if (dots.totalPages !== this.maxIndex + 1) dots.totalPages = this.maxIndex + 1;
         dots.currentPage = this._index + 1;
      }
      this.$count.textContent = `${this._index + 1} / ${this.maxIndex + 1}`;
      for (const thumb of this.$thumbs.children) {
         const current = Number(thumb.dataset.index) === this._index;
         thumb.classList.toggle('is-current', current);
         if (current) thumb.setAttribute('aria-current', 'true');
         else thumb.removeAttribute('aria-current');
      }
      // Slides out of view cannot be tabbed into or read out.
      const start = this._index;
      const end = this._index + this._visibleCount - 1;
      this.slides.forEach((slide, i) => {
         const visible = i >= start && i <= end;
         slide.inert = !visible;
         slide.classList.toggle('is-visible', visible);
      });
   }

   _syncPlay() {
      const { play } = this._built;
      this.classList.toggle('is-playing', this.playing);
      // While it moves by itself, announcing every slide would talk over the page.
      this.$live.setAttribute('aria-live', this.playing ? 'off' : 'polite');
      if (!play) return;
      const paused = this._paused || this._reducedMotion();
      play.icon = paused ? 'play' : 'pause';
      play.ariaLabel = paused ? this._t('play') : this._t('pause');
   }

   // ── Layout ─────────────────────────────────────────────────────

   _layout() {
      const width = this.clientWidth || this.getBoundingClientRect().width;
      let perView = this._perView;
      if (perView && typeof perView === 'object') {
         const points = Object.keys(perView).map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
         let chosen = perView[points[0]] ?? 1;
         for (const point of points) if (width >= point) chosen = perView[point];
         perView = chosen;
      }
      perView = Math.max(1, Math.min(Number(perView) || 1, this.slides.length || 1));
      const changed = perView !== this._visibleCount;
      this._visibleCount = Math.floor(perView);
      this.style.setProperty('--element-carrousel-per-view', String(perView));
      this.style.setProperty('--element-carrousel-gap', `${this._gap}px`);
      this.style.setProperty('--element-carrousel-peek', `${this._peek}px`);
      this.dataset.align = this._align;
      const narrow = width > 0 && width < NARROW;
      if (narrow !== this._narrow) {
         this._narrow = narrow;
         this._applyLooks();
      }
      if (changed && this._ready) {
         this._renderIndicators();
         this.goTo(Math.min(this._index, this.maxIndex), { behavior: 'instant', silent: true });
      }
      this._syncControls();
   }

   _applyLooks() {
      // Arrows beside the row would take a third of a phone's width: on a
      // narrow carousel they sit over the slides instead.
      this.dataset.arrows = this._arrows === 'outside' && this._narrow ? 'overlay' : this._arrows;
      this.dataset.indicators = this._indicators;
   }

   _applyLabel() {
      this.setAttribute('aria-label', this._label || this._t('label'));
   }

   // ── Index ──────────────────────────────────────────────────────

   _setIndex(index, { silent = false } = {}) {
      const previous = this._index;
      this._index = index;
      this._syncControls();
      if (index === previous || silent) return;
      if (!this.playing) this.$live.textContent = this._t('announce', { index: index + 1, total: this.maxIndex + 1 });
      this._onChange?.(index, { previous });
      this.dispatchEvent(new CustomEvent('slide-change', { bubbles: true, detail: { index, previous } }));
   }

   // The scroll is the truth: a swipe or a flick lands somewhere, and the
   // index follows it.
   _onScroll() {
      if (this._drag?.active) return;
      if (this._gliding > performance.now()) return;
      cancelAnimationFrame(this._scrollFrame);
      this._scrollFrame = requestAnimationFrame(() => {
         const index = this._indexFromScroll();
         if (index !== this._index) this._setIndex(index);
      });
   }

   _indexFromScroll() {
      const track = this.$track;
      if (!this.slides.length) return 0;
      if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) return this.maxIndex;
      const anchor = this._align === 'center' ? track.scrollLeft + track.clientWidth / 2 : track.scrollLeft + (parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0);
      let best = 0;
      let distance = Infinity;
      this.slides.forEach((slide, i) => {
         const point = this._align === 'center' ? slide.offsetLeft + slide.offsetWidth / 2 : slide.offsetLeft;
         const d = Math.abs(point - anchor);
         if (d < distance) {
            distance = d;
            best = i;
         }
      });
      return Math.min(best, this.maxIndex);
   }

   // ── Autoplay ───────────────────────────────────────────────────

   _reducedMotion() {
      return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
   }

   _startTimer() {
      this._stopTimer();
      this._syncPlay();
      if (!this.playing || this.maxIndex === 0 || !this._ready) return;
      this._timer = setInterval(() => {
         if (!this.playing) return;
         if (this._index >= this.maxIndex) this.goTo(0);
         else this.goTo(this._index + 1);
      }, this._autoplay);
   }

   _stopTimer() {
      clearInterval(this._timer);
      this._timer = null;
      this._syncPlay();
   }

   // ── Keyboard and mouse drag ────────────────────────────────────

   _onKeyDown(event) {
      // Typing in a field inside a slide keeps its arrows.
      if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft') this.previous();
      else if (event.key === 'ArrowRight') this.next();
      else if (event.key === 'Home') this.goTo(0);
      else if (event.key === 'End') this.goTo(this.maxIndex);
      else return;
      event.preventDefault();
   }

   _onPointerDown(event) {
      // Touch and pens scroll natively; a mouse drags.
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      if (event.target.closest('a, button, input, textarea, select, [contenteditable="true"]')) return;
      this._drag = { x: event.clientX, left: this.$track.scrollLeft, active: false, id: event.pointerId, moved: 0, lastX: event.clientX, lastT: performance.now(), velocity: 0 };
      window.addEventListener('pointermove', this._onPointerMove);
      window.addEventListener('pointerup', this._onPointerUp);
      window.addEventListener('pointercancel', this._onPointerUp);
   }

   _onPointerMove(event) {
      const drag = this._drag;
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (!drag.active && Math.abs(dx) > 5) {
         drag.active = true;
         this.classList.add('is-dragging');
      }
      if (!drag.active) return;
      const now = performance.now();
      drag.velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
      drag.lastX = event.clientX;
      drag.lastT = now;
      drag.moved = dx;
      this.$track.scrollLeft = drag.left - dx;
   }

   _onPointerUp() {
      const drag = this._drag;
      this._endDrag();
      if (!drag?.active) return;
      this._suppressClickUntil = performance.now() + 80;
      let index = this._indexFromScroll();
      // A quick flick goes one further in its direction.
      if (Math.abs(drag.velocity) > 0.4 && index === this._index) index += drag.velocity < 0 ? 1 : -1;
      requestAnimationFrame(() => this.goTo(index));
   }

   _endDrag() {
      window.removeEventListener('pointermove', this._onPointerMove);
      window.removeEventListener('pointerup', this._onPointerUp);
      window.removeEventListener('pointercancel', this._onPointerUp);
      this.classList.remove('is-dragging');
      this._drag = null;
   }

   _t(key, values = {}) {
      return fill(this._texts[key] ?? t(key), values);
   }
}

customElements.define('slice-element-carrousel', ElementCarrousel);