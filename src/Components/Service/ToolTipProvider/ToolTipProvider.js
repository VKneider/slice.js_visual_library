import { TooltipCore, DEFAULTS, focusableIn } from  "../../shared/tooltip-core.js";

// ToolTipProvider — tooltips for many elements, with one shared bubble and no
// component per trigger.
//
//   const tips = await slice.build('ToolTipProvider', { singleton: true });
//   tips.scope(toolbar);                       // every [data-tooltip] inside
//   tips.attach(saveButton, { text: 'Save', shortcut: '⌘S' });
//
// It listens once on the document and works out which trigger the pointer or
// the focus is on, so:
//   - nothing is attached per element, and an element removed from the page
//     leaves nothing behind (configs live in a WeakMap);
//   - elements added to a scope later get tooltips too;
//   - data-tooltip attributes are read when the tooltip shows, so changing
//     one changes the tooltip.
//
// It behaves like ToolTip in every way (they share TooltipCore): the delay
// and warm-up, the top layer, Escape, hovering the bubble, long press on
// touch, and aria-describedby on the element that takes focus.

const ATTRS = {
   text: 'data-tooltip',
   title: 'data-tooltip-title',
   shortcut: 'data-tooltip-shortcut',
   placement: 'data-tooltip-placement',
   variant: 'data-tooltip-variant',
   size: 'data-tooltip-size',
   mode: 'data-tooltip-mode',
   offset: 'data-tooltip-offset',
   maxWidth: 'data-tooltip-max-width',
   showDelay: 'data-tooltip-show-delay',
   hideDelay: 'data-tooltip-hide-delay',
};
const NUMERIC = new Set(['offset', 'maxWidth', 'showDelay', 'hideDelay']);
const SELECTOR = '[data-tooltip], [data-tooltip-title]';

export default class ToolTipProvider {
   constructor() {
      this._configs = new WeakMap();   // element -> config given to attach()
      this._ownTabindex = new WeakSet(); // elements we made focusable
      this._scopes = new Set();
      this._listening = false;
      this._hovered = null;

      this._core = new TooltipCore();

      this._onOver = this._onOver.bind(this);
      this._onOut = this._onOut.bind(this);
      this._onDown = this._onDown.bind(this);
      this._onUp = () => this._core.pressEnd();
      this._onFocusIn = this._onFocusIn.bind(this);
      this._onFocusOut = this._onFocusOut.bind(this);
      this._onClick = this._onClick.bind(this);

      ToolTipProvider._ensureCSS();

      // A second provider means a second bubble and a second set of document
      // listeners. Almost always a missing { singleton: true }: say so.
      this._counted = true;
      ToolTipProvider._live += 1;
      if (ToolTipProvider._live > 1) {
         slice.logger?.logWarning?.('ToolTipProvider',
            `${ToolTipProvider._live} ToolTipProviders are alive. Build it with slice.build('ToolTipProvider', { singleton: true }) so the app shares one.`);
      }
   }

   static _live = 0;

   static _cssPromise = null;

   // The bubble's styles live in ToolTip.css. Building one ToolTip loads them;
   // the instance itself is not needed, so it is destroyed at once.
   static _ensureCSS() {
      if (ToolTipProvider._cssPromise) return;
      ToolTipProvider._cssPromise = (async () => {
         if (typeof slice === 'undefined' || !slice.controller) return;
         if (slice.controller.requestedStyles?.has('ToolTip')) return;
         try {
            const dummy = await slice.build('ToolTip', { text: '' });
            if (dummy) {
               slice.controller.destroyComponent(dummy);
               dummy.remove();
            }
         } catch (err) {
            slice.logger?.logWarning?.('ToolTipProvider', 'Could not preload the ToolTip styles', err);
         }
      })();
   }

   // ── API ────────────────────────────────────────────────────────

   /** Give an element a tooltip. `config` wins over its data-tooltip-* attributes. */
   attach(element, config = {}) {
      if (!(element instanceof Element)) return this;
      const previous = this._configs.get(element) || {};
      this._configs.set(element, { ...previous, ...config });
      this._makeReachable(element);
      this._listen();
      return this;
   }

   /** Remove an element's tooltip. */
   detach(element) {
      if (!(element instanceof Element)) return this;
      if (this._core.trigger === element) this._core.hide({ instant: true });
      this._configs.delete(element);
      if (this._ownTabindex.has(element)) {
         element.removeAttribute('tabindex');
         this._ownTabindex.delete(element);
      }
      return this;
   }

   /**
    * Every [data-tooltip] inside `container` gets a tooltip, including ones
    * added later. `unscope(container)` stops it.
    */
   scope(container) {
      if (!(container instanceof Element || container instanceof Document)) return this;
      this._scopes.add(container);
      /** @type {ParentNode} */ (container).querySelectorAll(SELECTOR).forEach((el) => this._makeReachable(el));
      this._listen();
      return this;
   }

   /** Stop handling a container given to scope(). */
   unscope(container) {
      this._scopes.delete(container);
      if (this._core.trigger && container.contains?.(this._core.trigger)) this._core.hide({ instant: true });
      return this;
   }

   /** Show an element's tooltip from code. */
   show(element) {
      const config = this._configFor(element);
      if (config) this._core.show(element, config);
   }

   /** Hide whatever tooltip is showing. */
   hide() {
      this._core.hide();
   }

   get open() { return this._core.visible; }

   get bubble() { return this._core.bubble; }

   // Framework teardown hook: the controller calls beforeDestroy().
   beforeDestroy() {
      if (this._counted) {
         this._counted = false;
         ToolTipProvider._live = Math.max(0, ToolTipProvider._live - 1);
      }
      this._unlisten();
      this._core.destroy();
      this._scopes.clear();
      this._configs = new WeakMap();
   }

   // ── Finding the trigger ────────────────────────────────────────

   _triggerFor(node) {
      let el = node instanceof Element ? node : node?.parentElement;
      // The bubble is not a trigger, even if it sits next to one.
      if (!el || this._core.bubble?.contains(el)) return null;
      while (el) {
         if (this._configs.has(el)) return el;
         if (el.matches?.(SELECTOR)) {
            for (const scope of this._scopes) {
               if (!scope.isConnected && scope !== document) {
                  this._scopes.delete(scope);
                  continue;
               }
               if (scope.contains(el)) return el;
            }
         }
         el = el.parentElement;
      }
      return null;
   }

   _configFor(element) {
      if (!element) return null;
      const fromAttributes = {};
      for (const [key, attr] of Object.entries(ATTRS)) {
         const value = element.getAttribute(attr);
         if (value === null) continue;
         fromAttributes[key] = NUMERIC.has(key) ? Number(value) : value;
      }
      return { ...DEFAULTS, ...fromAttributes, ...(this._configs.get(element) || {}) };
   }

   // An element with nothing focusable in it (an icon, a span) gets a tab
   // stop, so keyboard users can reach its tooltip too.
   _makeReachable(element) {
      if (focusableIn(element)) return;
      if (element.hasAttribute('tabindex')) return;
      element.setAttribute('tabindex', '0');
      this._ownTabindex.add(element);
   }

   // ── Document listeners ─────────────────────────────────────────

   _listen() {
      if (this._listening) return;
      this._listening = true;
      document.addEventListener('pointerover', this._onOver);
      document.addEventListener('pointerout', this._onOut);
      document.addEventListener('pointerdown', this._onDown, true);
      document.addEventListener('pointerup', this._onUp, true);
      document.addEventListener('pointercancel', this._onUp, true);
      document.addEventListener('focusin', this._onFocusIn);
      document.addEventListener('focusout', this._onFocusOut);
      document.addEventListener('click', this._onClick, true);
   }

   _unlisten() {
      if (!this._listening) return;
      this._listening = false;
      document.removeEventListener('pointerover', this._onOver);
      document.removeEventListener('pointerout', this._onOut);
      document.removeEventListener('pointerdown', this._onDown, true);
      document.removeEventListener('pointerup', this._onUp, true);
      document.removeEventListener('pointercancel', this._onUp, true);
      document.removeEventListener('focusin', this._onFocusIn);
      document.removeEventListener('focusout', this._onFocusOut);
      document.removeEventListener('click', this._onClick, true);
   }

   _onOver(event) {
      if (event.pointerType === 'touch') return;
      const trigger = this._triggerFor(event.target);
      if (!trigger || trigger === this._hovered) return;
      this._hovered = trigger;
      const config = this._configFor(trigger);
      if (config.mode === 'toggletip') return;
      this._core.queueShow(trigger, config);
   }

   _onOut(event) {
      if (event.pointerType === 'touch' || !this._hovered) return;
      const to = event.relatedTarget;
      if (to && (this._hovered.contains(to))) return;
      const trigger = this._hovered;
      this._hovered = null;
      if (this._configFor(trigger).mode === 'toggletip') return;
      // Moving onto the bubble keeps it (the bubble cancels the hide itself).
      this._core.queueHide();
   }

   _onDown(event) {
      if (event.pointerType !== 'touch') return;
      const trigger = this._triggerFor(event.target);
      if (!trigger) return;
      const config = this._configFor(trigger);
      if (config.mode !== 'toggletip') this._core.pressStart(trigger, config);
   }

   _onFocusIn(event) {
      const trigger = this._triggerFor(event.target);
      if (!trigger) return;
      const config = this._configFor(trigger);
      if (config.mode === 'toggletip') return;
      // Keyboard focus shows it; a mouse click that focuses the element does not.
      if (!event.target.matches?.(':focus-visible')) return;
      this._core.queueShow(trigger, config, { immediate: true });
   }

   _onFocusOut(event) {
      const trigger = this._triggerFor(event.target);
      if (!trigger || trigger !== this._core.trigger) return;
      const next = event.relatedTarget;
      if (next && (trigger.contains(next) || this._core.bubble?.contains(next))) return;
      this._core.hide();
   }

   _onClick(event) {
      const trigger = this._triggerFor(event.target);
      if (!trigger) return;
      const config = this._configFor(trigger);
      if (config.mode === 'toggletip') {
         this._core.toggle(trigger, config);
         return;
      }
      // Clicking the control does what the control does; the tooltip steps aside.
      if (this._core.trigger === trigger) this._core.hide({ instant: true });
   }
}