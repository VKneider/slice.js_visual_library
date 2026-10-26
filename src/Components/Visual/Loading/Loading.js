import { SIZE_VALUES } from '../../shared/props.js';

// Loading — shows that the app is busy: over the whole page, or over one part
// of it (a form, a card, a table).
//
//   const loading = await slice.build('Loading', { label: 'Saving…' });
//   loading.start(form);   …   loading.stop();
//
// Slice builds one for the app when sliceConfig has `loading.enabled`: it
// shows while the first page loads and on every route change
// (slice.loading). The rest of `sliceConfig.loading` sets how it looks, so the
// app's loading screen is configured where the app is configured:
//
//   "loading": {
//     "enabled": true,
//     "variant": "slice",        slice | spinner | dots | bar
//     "delayMs": 150,            route changes faster than this show nothing
//     "minVisibleMs": 300,
//     "welcome": {               the first load of the page only
//       "title": "Conclave", "kicker": "Welcome to",
//       "subtitle": "Getting your space ready",
//       "logo": "/images/logo.svg",
//       "minVisibleMs": 1500,
//       "component": "AppSplash", "props": {}    or a component of your own
//     }
//   }
//
// The welcome screen is the markup in Loading.html, so an app changes it the
// way it changes any component it owns: edit Loading.html and Loading.css.
// `"welcome": true` shows it as written; an object also fills its texts.
//
// Props given to a Loading win over sliceConfig.

const VARIANTS = ['slice', 'spinner', 'dots', 'bar'];
const BACKDROPS = ['dim', 'blur', 'solid', 'none'];
const WELCOME_MIN_MS = 1200;
const WELCOME_EXIT_MS = 320;

// Warns once per deprecated prop name.
const deprecated = new Set();
function deprecate(oldName, newName) {
   if (deprecated.has(oldName)) return;
   deprecated.add(oldName);
   console.warn(`[Slice] "${oldName}" is deprecated; use "${newName}" instead.`);
}

function reducedMotion() {
   return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function appConfig() {
   const config = typeof slice !== 'undefined' ? slice.loadingConfig : null;
   return config && typeof config === 'object' ? config : {};
}

export default class Loading extends HTMLElement {
   // Above every other layer the page can have: the toast stack (11000) and a
   // drag ghost (999999). Set inline, since the host is positioned from JS.
   // A native <dialog> (Modal) is in the top layer, which nothing covers: a
   // modal shows its own busy state instead.
   static OVERLAY_Z_INDEX = 2147483000;

   // The welcome view is for the first load of the page, once.
   static _welcomed = false;

   // Props without a default fall back to sliceConfig.loading, then to the
   // built-in value (see _opt).
   static props = {
      variant: { type: 'string', allowedValues: VARIANTS },
      size: { type: 'string', allowedValues: SIZE_VALUES },
      // Text under the indicator ("Saving…"). Screen readers hear it too.
      label: { type: 'string' },
      backdrop: { type: 'string', allowedValues: BACKDROPS },
      // Show only when the work takes longer than this (no flash for fast work).
      delayMs: { type: 'number' },
      // Once shown, stay at least this long (no flicker).
      minVisibleMs: { type: 'number' },
      // variant 'bar': 0–1 for a known amount, null for "somewhere in between".
      progress: { type: 'number' },
      // The first-load view: { title, kicker, subtitle, logo, minVisibleMs,
      // component, props }, or false for none.
      welcome: { type: 'any' },
      active: { type: 'boolean', default: false },
      isActive: { type: 'boolean', default: false },
      container: { type: 'object', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-loading');

      this.$overlay = this.querySelector('.slice-loading__overlay');
      this.$welcome = this.querySelector('.slice-loading__welcome');
      this.$indicator = this.querySelector('.slice-loading__indicator');
      this.$label = this.querySelector('.slice-loading__label');
      this.$status = this.querySelector('.slice-loading__status');
      this.$bar = this.querySelector('.slice-loading__mark--bar > i');

      // Instance state goes before setComponentProps: `active: true` at build
      // time calls start() from inside it.
      /** @type {Record<string, any>} values given as props; the rest come from sliceConfig */
      this._given = {};
      this._container = null;
      this._running = false;     // between start() and the end of stop()
      this._visible = false;     // on screen (after delayMs)
      this._currentContainer = null;
      this._showTimer = null;
      this._pendingStopTimeout = null;
      this._exitTimer = null;
      this._minimumVisibleUntil = 0;
      this._welcomeShown = false;
      this._welcomeComponent = null;

      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._applyLooks();
   }

   // ── Options: prop, then sliceConfig.loading, then built-in ──────

   _opt(name, fallback) {
      if (this._given[name] !== undefined && this._given[name] !== null) return this._given[name];
      const value = appConfig()[name];
      return value !== undefined && value !== null ? value : fallback;
   }

   _setGiven(name, value) {
      if (value === undefined) delete this._given[name];
      else this._given[name] = value;
      this._applyLooks();
   }

   get variant() { const v = this._opt('variant', 'slice'); return VARIANTS.includes(v) ? v : 'slice'; }
   set variant(value) { this._setGiven('variant', value); }

   get size() { const v = this._opt('size', 'md'); return SIZE_VALUES.includes(v) ? v : 'md'; }
   set size(value) { this._setGiven('size', value); }

   get label() { return String(this._opt('label', '') ?? ''); }
   set label(value) { this._setGiven('label', value); }

   get backdrop() {
      // A bar sits at the top of the page and blocks nothing.
      const v = this._opt('backdrop', this.variant === 'bar' ? 'none' : 'dim');
      return BACKDROPS.includes(v) ? v : 'dim';
   }
   set backdrop(value) { this._setGiven('backdrop', value); }

   get delayMs() { return Math.max(0, Number(this._opt('delayMs', 0)) || 0); }
   set delayMs(value) { this._setGiven('delayMs', value); }

   get minVisibleMs() { return Math.max(0, Number(this._opt('minVisibleMs', 0)) || 0); }
   set minVisibleMs(value) { this._setGiven('minVisibleMs', value); }

   get progress() {
      const v = this._given.progress;
      return typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null;
   }
   set progress(value) { this._setGiven('progress', value); }

   /**
    * The first-load view as configured ({} for `true`: the template as it is),
    * or null when there is none.
    */
   get welcome() {
      const v = this._opt('welcome', null);
      if (v === true) return {};
      return v && typeof v === 'object' ? v : null;
   }
   set welcome(value) {
      // false is a choice ("no welcome"): kept, so sliceConfig does not win.
      if (value === false || value === true || (value && typeof value === 'object')) this._given.welcome = value;
      else delete this._given.welcome;
   }

   // Canonical busy flag: true starts, false stops.
   get active() { return this._running; }
   set active(value) {
      if (value === true && !this._running) this.start();
      else if (value === false && this._running) this.stop();
   }

   // Deprecated alias for `active`.
   get isActive() { return this._running; }
   set isActive(value) {
      if (value) deprecate('isActive', 'active');
      this.active = value;
   }

   get container() { return this._container; }
   set container(value) { this._container = value instanceof HTMLElement ? value : null; }

   /** Whether it is on screen now (false while waiting for delayMs). */
   get visible() { return this._visible; }

   // ── Start and stop ─────────────────────────────────────────────

   /**
    * Show it over `container` (or the `container` prop, or the whole page).
    * @param {HTMLElement | null} [container]
    * @param {{ welcome?: boolean }} [options] welcome: true shows the
    *   first-load view again (for a preview, or after a sign-in).
    */
   start(container = null, { welcome } = {}) {
      const target = container || this._container || document.body;

      // Busy again: a stop that was waiting (for the minimum time, or for the
      // welcome to fade out) is called off.
      clearTimeout(this._pendingStopTimeout);
      this._pendingStopTimeout = null;
      if (this._exitTimer) {
         clearTimeout(this._exitTimer);
         this._exitTimer = null;
         this.classList.remove('is-leaving');
      }

      if (this._running && this._currentContainer === target) return;
      if (this._running) this._teardown();

      this._running = true;
      this._currentContainer = target;
      target.setAttribute('aria-busy', 'true');

      // The welcome view: on the first full-page load when one is configured,
      // or when asked for.
      const firstLoad = !Loading._welcomed && target === document.body;
      if (target === document.body) Loading._welcomed = true;
      const showWelcome = welcome === true || (welcome !== false && firstLoad && !!this.welcome);

      if (showWelcome) {
         this._show({ welcome: true });
      } else if (this.delayMs > 0) {
         this._showTimer = setTimeout(() => {
            this._showTimer = null;
            if (this._running) this._show({ welcome: false });
         }, this.delayMs);
      } else {
         this._show({ welcome: false });
      }
   }

   /** Hide it (after minVisibleMs, if it is on screen). */
   stop() {
      if (!this._running) return;

      // Never shown (the work beat delayMs): nothing to hide.
      if (!this._visible) {
         this._teardown();
         return;
      }

      const remaining = this._minimumVisibleUntil - Date.now();
      if (remaining > 0) {
         if (!this._pendingStopTimeout) {
            this._pendingStopTimeout = setTimeout(() => {
               this._pendingStopTimeout = null;
               this.stop();
            }, remaining);
         }
         return;
      }

      // The welcome fades out instead of vanishing.
      if (this._welcomeShown && !reducedMotion()) {
         if (this._exitTimer) return;
         this.classList.add('is-leaving');
         this._exitTimer = setTimeout(() => {
            this._exitTimer = null;
            this._teardown();
         }, WELCOME_EXIT_MS);
         return;
      }
      this._teardown();
   }

   beforeDestroy() {
      clearTimeout(this._showTimer);
      clearTimeout(this._pendingStopTimeout);
      clearTimeout(this._exitTimer);
      this._showTimer = this._pendingStopTimeout = this._exitTimer = null;
      if (this._running) this._teardown();
      this._destroyWelcomeComponent();
   }

   _show({ welcome }) {
      const target = this._currentContainer;
      if (target === document.body) {
         this.style.position = 'fixed';
      } else {
         // Cover only the container: it becomes the positioning box, and
         // hides what would stick out, until stop() restores it.
         this._originalPosition = target.style.position;
         this._originalOverflow = target.style.overflow;
         // A container not in the page yet has no computed position (''):
         // it is static as far as the overlay is concerned.
         const position = getComputedStyle(target).position;
         if (!position || position === 'static') target.style.position = 'relative';
         target.style.overflow = 'hidden';
         this.style.position = 'absolute';
      }
      Object.assign(this.style, { inset: '0', width: '100%', height: '100%', zIndex: String(Loading.OVERLAY_Z_INDEX) });

      this.classList.toggle('is-welcome', welcome);
      this.classList.remove('is-leaving');
      if (welcome) this._renderWelcome();
      else this._emptyWelcome();
      this._welcomeShown = welcome;
      this._applyLooks();

      target.appendChild(this);
      this._visible = true;
      const floor = welcome ? Math.max(0, Number(this.welcome?.minVisibleMs ?? WELCOME_MIN_MS) || 0) : this.minVisibleMs;
      this._minimumVisibleUntil = Date.now() + floor;
   }

   _teardown() {
      clearTimeout(this._showTimer);
      this._showTimer = null;
      const target = this._currentContainer;
      if (target && target !== document.body) {
         if (this._originalPosition !== undefined) target.style.position = this._originalPosition;
         if (this._originalOverflow !== undefined) target.style.overflow = this._originalOverflow;
      }
      target?.removeAttribute('aria-busy');
      this.remove();
      this.classList.remove('is-leaving', 'is-welcome');
      this._clearWelcome();
      this._running = false;
      this._visible = false;
      this._currentContainer = null;
      this._originalPosition = undefined;
      this._originalOverflow = undefined;
      this._minimumVisibleUntil = 0;
   }

   // ── Looks ──────────────────────────────────────────────────────

   _applyLooks() {
      if (!this.$overlay) return;
      this.dataset.variant = this.variant;
      this.dataset.size = this.size;
      this.dataset.backdrop = this._welcomeShown ? 'solid' : this.backdrop;
      const label = this.label;
      this.$label.textContent = label;
      this.$label.hidden = !label;
      this.$status.textContent = label || (this._welcomeShown ? this._welcomeText() : 'Loading…');
      const progress = this.progress;
      this.dataset.progress = progress === null ? 'indeterminate' : 'determinate';
      if (this.$bar) this.$bar.style.width = progress === null ? '' : `${progress * 100}%`;
   }

   // What screen readers hear while the welcome shows: its visible texts.
   _welcomeText() {
      const texts = [...this.$welcome.querySelectorAll('[data-welcome]:not([hidden]):not(img)')]
         .map((node) => node.textContent.trim())
         .filter(Boolean);
      return texts.join(' ') || 'Loading…';
   }

   // The first-load view is the markup in Loading.html (edit it in your copy
   // of the component). sliceConfig fills its [data-welcome] fields; a field
   // left without text or image is hidden. welcome.component puts the app's
   // own component there instead.
   _renderWelcome() {
      const config = this.welcome || {};
      this._emptyWelcome();
      this.$welcome.hidden = false;
      const custom = !!config.component;

      for (const field of /** @type {NodeListOf<HTMLElement>} */ (this.$welcome.querySelectorAll('[data-welcome]'))) {
         const value = config[field.dataset.welcome];
         const isImage = field instanceof HTMLImageElement;
         if (value !== undefined && value !== null && value !== '') {
            if (isImage) {
               field.setAttribute('src', String(value));
               // A logo that does not load is left out, not shown broken.
               field.addEventListener('error', () => { field.hidden = true; }, { once: true });
            }
            else field.textContent = String(value);
         }
         field.hidden = isImage ? !field.getAttribute('src') : !field.textContent.trim() && !field.children.length;
      }
      const card = this.$welcome.querySelector('.slice-loading__card');
      if (card) card.hidden = custom || ![...card.children].some((child) => !(/** @type {HTMLElement} */ (child).hidden));
      const burst = this.$welcome.querySelector('.slice-loading__burst');
      if (burst) /** @type {HTMLElement} */ (burst).hidden = custom;

      const slot = /** @type {HTMLElement} */ (this.$welcome.querySelector('.slice-loading__welcome-custom'));
      if (!slot) return;
      slot.hidden = !custom;
      if (!custom) return;
      const token = this._welcomeToken;
      // Any component name the app registered (not only the library's).
      slice.build(/** @type {any} */ (String(config.component)), config.props && typeof config.props === 'object' ? config.props : {})
         .then((component) => {
            if (!component) return;
            // Gone or replaced while it was being built.
            if (token !== this._welcomeToken || !this._welcomeShown) {
               slice.controller.destroyComponent(component);
               return;
            }
            this._welcomeComponent = component;
            slot.append(component);
         })
         .catch((error) => slice.logger?.logWarning?.('Loading', `Could not build the welcome component "${config.component}"`, error));
   }

   // Hide the welcome and drop the app's component; the template markup stays.
   _emptyWelcome() {
      this._welcomeToken = (this._welcomeToken || 0) + 1;
      this._destroyWelcomeComponent();
      this.$welcome.querySelector('.slice-loading__welcome-custom')?.replaceChildren();
      this.$welcome.hidden = true;
   }

   _clearWelcome() {
      this._emptyWelcome();
      this._welcomeShown = false;
   }

   _destroyWelcomeComponent() {
      if (this._welcomeComponent) {
         slice.controller.destroyComponent(this._welcomeComponent);
         this._welcomeComponent = null;
      }
   }
}

customElements.define('slice-loading', Loading);