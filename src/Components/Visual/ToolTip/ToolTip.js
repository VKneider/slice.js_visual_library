import { TooltipCore, DEFAULTS, PLACEMENTS, VARIANTS, MODES, focusableInside, normalizeConfig } from '../../shared/tooltip-core.js';

// ToolTip — wraps a control and explains it.
//
//   const tip = await slice.build('ToolTip', { text: 'Bold', shortcut: '⌘B' });
//   tip.appendChild(boldButton);
//
// What is inside the ToolTip is its trigger. When that holds a focusable
// control (a Button, a link, an input), the control keeps its own place in
// the Tab order and gets aria-describedby; the ToolTip adds no tab stop of its
// own. When it holds only text, or a disabled control, the ToolTip itself
// becomes focusable, so the explanation is still reachable by keyboard — that
// is how a disabled button can say why it is disabled.
//
// mode: 'toggletip' turns it into an ⓘ that opens on click and may hold links.
// For many triggers with plain text, ToolTipProvider shares one bubble.

export default class ToolTip extends HTMLElement {
   static props = {
      text: { type: 'string', default: '' },
      title: { type: 'string', default: '' },
      shortcut: { type: 'string', default: '' },
      content: { type: 'any', default: null },
      placement: { type: 'string', default: 'top', allowedValues: PLACEMENTS },
      offset: { type: 'number', default: DEFAULTS.offset },
      maxWidth: { type: 'number', default: DEFAULTS.maxWidth },
      showDelay: { type: 'number', default: DEFAULTS.showDelay },
      hideDelay: { type: 'number', default: DEFAULTS.hideDelay },
      variant: { type: 'string', default: 'inverse', allowedValues: VARIANTS },
      size: { type: 'string', default: 'md', allowedValues: ['sm', 'md'] },
      mode: { type: 'string', default: 'tooltip', allowedValues: MODES },
      arrow: { type: 'boolean', default: true },
      disabled: { type: 'boolean', default: false },
      customColor: { type: 'object', default: null },
      onOpenChange: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-tooltip');

      this._config = { ...DEFAULTS };
      this._disabled = false;
      this._onOpenChange = null;
      this._ready = false;

      this._core = new TooltipCore({
         describedTarget: () => this._target(),
         onOpenChange: (open) => {
            this.classList.toggle('is-open', open);
            this._onOpenChange?.(open, { tooltip: this });
         },
      });

      this._handlers = {
         pointerenter: (e) => this._pointerEnter(e),
         pointerleave: (e) => this._pointerLeave(e),
         pointerdown: (e) => this._pointerDown(e),
         pointerup: () => this._core.pressEnd(),
         pointercancel: () => this._core.pressEnd(),
         focusin: (e) => this._focusIn(e),
         focusout: (e) => this._focusOut(e),
         click: (e) => this._click(e),
         keydown: (e) => this._keyDown(e),
         contextmenu: (e) => { if (this._core.visible && e.pointerType !== 'mouse') e.preventDefault(); },
      };

      slice.controller.setComponentProps(this, props || {});
   }

   init() {
      this._ready = true;
      for (const [type, handler] of Object.entries(this._handlers)) this.addEventListener(type, handler);
      // The trigger changes (a child added, a button enabled or disabled):
      // decide again whether the ToolTip itself needs a tab stop.
      this._observer = new MutationObserver(() => this._syncFocus());
      this._observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'tabindex', 'href'] });
      this._syncFocus();
   }

   beforeDestroy() {
      this._ready = false;
      for (const [type, handler] of Object.entries(this._handlers)) this.removeEventListener(type, handler);
      this._observer?.disconnect();
      this._observer = null;
      this._core.destroy();
   }

   // ── Props ──────────────────────────────────────────────────────

   get text() { return this._config.text; }
   set text(v) { this._set('text', v == null ? '' : String(v)); }

   get title() { return this._config.title; }
   set title(v) { this._set('title', v == null ? '' : String(v)); }

   get shortcut() { return this._config.shortcut; }
   set shortcut(v) { this._set('shortcut', v == null ? '' : String(v)); }

   get content() { return this._config.content; }
   set content(v) { this._set('content', v ?? null); }

   get placement() { return this._config.placement; }
   set placement(v) { this._set('placement', PLACEMENTS.includes(v) ? v : 'top'); }

   get offset() { return this._config.offset; }
   set offset(v) { this._set('offset', v); }

   get maxWidth() { return this._config.maxWidth; }
   set maxWidth(v) { this._set('maxWidth', v); }

   get showDelay() { return this._config.showDelay; }
   set showDelay(v) { this._set('showDelay', v); }

   get hideDelay() { return this._config.hideDelay; }
   set hideDelay(v) { this._set('hideDelay', v); }

   get variant() { return this._config.variant; }
   set variant(v) { this._set('variant', VARIANTS.includes(v) ? v : 'inverse'); }

   get size() { return this._config.size; }
   set size(v) { this._set('size', v === 'sm' ? 'sm' : 'md'); }

   get mode() { return this._config.mode; }
   set mode(v) {
      this._set('mode', MODES.includes(v) ? v : 'tooltip');
      this._ready && this._syncFocus();
   }

   get arrow() { return this._config.arrow; }
   set arrow(v) { this._set('arrow', v !== false); }

   get customColor() { return this._config.customColor; }
   set customColor(v) { this._set('customColor', v && typeof v === 'object' ? v : null); }

   get disabled() { return this._disabled; }
   set disabled(v) {
      this._disabled = v === true;
      if (this._disabled) this._core.hide({ instant: true });
   }

   get onOpenChange() { return this._onOpenChange; }
   set onOpenChange(v) { this._onOpenChange = typeof v === 'function' ? v : null; }

   /** Whether the bubble is showing. */
   get open() { return this._core.visible; }

   /** The bubble element, while it exists (for tests and styling). */
   get bubble() { return this._core.bubble; }

   // ── Methods ────────────────────────────────────────────────────

   show() {
      if (!this._disabled) this._core.show(this, this._config);
   }

   hide() {
      this._core.hide();
   }

   toggle() {
      if (this._core.visible) this.hide();
      else this.show();
   }

   /** Recompute the position, after the trigger moved without a scroll or resize. */
   updatePosition() {
      this._core._reposition();
   }

   // ── Internals ──────────────────────────────────────────────────

   _set(key, value) {
      this._config = normalizeConfig({ ...this._config, [key]: value });
      if (this._core.visible) this._core.update(this._config);
   }

   // The control the description belongs to: the focusable thing inside, or
   // the ToolTip itself when there is none.
   _target() {
      const inner = focusableInside(this);
      return inner && !this._core.bubble?.contains(inner) ? inner : this;
   }

   _syncFocus() {
      const inner = focusableInside(this);
      const own = !inner || this._core.bubble?.contains(inner);
      if (own) {
         if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
         this.dataset.ownFocus = 'true';
         if (this._config.mode === 'toggletip') {
            this.setAttribute('role', 'button');
            this.setAttribute('aria-expanded', String(this._core.visible));
         }
      } else if (this.dataset.ownFocus === 'true') {
         this.removeAttribute('tabindex');
         this.removeAttribute('role');
         delete this.dataset.ownFocus;
      }
   }

   _fromBubble(event) {
      return this._core.bubble?.contains(event.target);
   }

   _pointerEnter(event) {
      if (this._disabled || event.pointerType === 'touch' || this._config.mode === 'toggletip') return;
      this._core.queueShow(this, this._config);
   }

   _pointerLeave(event) {
      if (event.pointerType === 'touch' || this._config.mode === 'toggletip') return;
      this._core.queueHide();
   }

   _pointerDown(event) {
      if (this._disabled || event.pointerType !== 'touch' || this._config.mode === 'toggletip' || this._fromBubble(event)) return;
      this._core.pressStart(this, this._config);
   }

   _focusIn(event) {
      if (this._disabled || this._config.mode === 'toggletip' || this._fromBubble(event)) return;
      // Keyboard focus shows it; a mouse click that focuses the button does not.
      if (!event.target.matches?.(':focus-visible')) return;
      this._core.queueShow(this, this._config, { immediate: true });
   }

   _focusOut(event) {
      if (this._config.mode === 'toggletip') {
         // Leaving both the trigger and the toggletip closes it.
         if (!this.contains(event.relatedTarget) && !this._core.bubble?.contains(event.relatedTarget)) this._core.hide();
         return;
      }
      if (!this.contains(event.relatedTarget)) this._core.hide();
   }

   // A text-only toggletip is the ToolTip itself acting as the button.
   _keyDown(event) {
      if (this._config.mode !== 'toggletip' || this.dataset.ownFocus !== 'true' || event.target !== this) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._click(event);
   }

   _click(event) {
      if (this._fromBubble(event)) return;
      if (this._config.mode === 'toggletip') {
         if (this._disabled) return;
         this._core.toggle(this, this._config);
         if (this.dataset.ownFocus === 'true') this.setAttribute('aria-expanded', String(this._core.visible));
         return;
      }
      // Clicking the control does what the control does; the tooltip steps aside.
      this._core.hide({ instant: true });
   }
}

customElements.define('slice-tooltip', ToolTip);