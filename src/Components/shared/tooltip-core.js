// What ToolTip and ToolTipProvider share: the bubble, where it goes, and when
// it shows. Both are thin layers over TooltipCore, so they behave the same and
// a fix lands in both.
//
// The bubble is a `popover="manual"` element, so it renders in the top layer:
// above a modal <dialog>, a Drawer or a DatePicker calendar, and never clipped
// by an ancestor's overflow. Browsers without popovers get a fixed, high
// z-index bubble instead.
//
// Two modes:
//   tooltip     describes a control. Hover (after a short delay), keyboard
//               focus or a long press shows it; it can be hovered (WCAG 1.4.13)
//               but holds nothing to click. role="tooltip", aria-describedby.
//   toggletip   a click on the trigger (an ⓘ button) opens it, and it may hold
//               links. It sits right after the trigger in the document, so Tab
//               goes from the trigger into it. aria-expanded on the trigger.
//
// Escape closes it from anywhere and is consumed, so an open tooltip in a
// Modal takes the first Escape and the Modal the second.

export const SIDES = ['top', 'bottom', 'left', 'right'];
export const PLACEMENTS = SIDES.flatMap((side) => [side, `${side}-start`, `${side}-end`]);
export const VARIANTS = ['inverse', 'light', 'accent'];
export const MODES = ['tooltip', 'toggletip'];

export const DEFAULTS = {
   text: '',
   title: '',
   shortcut: '',
   content: null,
   placement: 'top',
   offset: 8,
   maxWidth: 280,
   showDelay: 400,
   hideDelay: 100,
   variant: 'inverse',
   size: 'md',
   mode: 'tooltip',
   arrow: true,
   customColor: null,
};

const MARGIN = 8;
const LONG_PRESS = 500;
const TOUCH_LINGER = 1500;
// Once a tooltip has been seen, its neighbours show at once for a moment,
// so moving along a toolbar reads the labels without waiting for each.
const WARM_WINDOW = 400;
let lastHiddenAt = 0;
let openCore = null;
let uid = 0;

const supportsPopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;

/** Normalise a config: defaults, a valid placement, numbers. */
export function normalizeConfig(config = {}) {
   const merged = { ...DEFAULTS, ...config };
   merged.placement = PLACEMENTS.includes(merged.placement) ? merged.placement : 'top';
   merged.variant = VARIANTS.includes(merged.variant) ? merged.variant : 'inverse';
   merged.mode = MODES.includes(merged.mode) ? merged.mode : 'tooltip';
   merged.size = merged.size === 'sm' ? 'sm' : 'md';
   merged.offset = Number.isFinite(Number(merged.offset)) ? Math.max(0, Number(merged.offset)) : DEFAULTS.offset;
   merged.maxWidth = Number.isFinite(Number(merged.maxWidth)) ? Math.max(80, Number(merged.maxWidth)) : DEFAULTS.maxWidth;
   merged.showDelay = Number.isFinite(Number(merged.showDelay)) ? Math.max(0, Number(merged.showDelay)) : DEFAULTS.showDelay;
   merged.hideDelay = Number.isFinite(Number(merged.hideDelay)) ? Math.max(0, Number(merged.hideDelay)) : DEFAULTS.hideDelay;
   merged.arrow = merged.arrow !== false;
   return merged;
}

export function hasContent(config) {
   return !!(config.text || config.title || config.content);
}

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** The element that takes focus: the trigger itself, or the first focusable thing inside it. */
export function focusableIn(root) {
   if (!root) return null;
   if (root.matches?.(FOCUSABLE)) return root;
   return focusableInside(root);
}

/** The first focusable element inside `root`, not counting `root` itself. */
export function focusableInside(root) {
   return root?.querySelector?.(FOCUSABLE) || null;
}

/**
 * Where the bubble goes: side and alignment against the trigger, flipped to
 * the other side when it does not fit, then shifted into the viewport. The
 * arrow keeps pointing at the trigger's centre after the shift.
 */
export function computePosition(placement, trigger, bubble, offset, viewport = { width: window.innerWidth, height: window.innerHeight }) {
   const [side, align = 'center'] = placement.split('-');
   const flipped = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
   const order = [side, flipped[side], ...SIDES.filter((s) => s !== side && s !== flipped[side])];

   const place = (s) => {
      const vertical = s === 'top' || s === 'bottom';
      let top;
      let left;
      if (vertical) {
         top = s === 'top' ? trigger.top - bubble.height - offset : trigger.bottom + offset;
         if (align === 'start') left = trigger.left;
         else if (align === 'end') left = trigger.right - bubble.width;
         else left = trigger.left + trigger.width / 2 - bubble.width / 2;
      } else {
         left = s === 'left' ? trigger.left - bubble.width - offset : trigger.right + offset;
         if (align === 'start') top = trigger.top;
         else if (align === 'end') top = trigger.bottom - bubble.height;
         else top = trigger.top + trigger.height / 2 - bubble.height / 2;
      }
      return { side: s, top, left };
   };
   const fits = ({ side: s, top, left }) => (
      s === 'top' || s === 'bottom'
         ? top >= MARGIN && top + bubble.height <= viewport.height - MARGIN
         : left >= MARGIN && left + bubble.width <= viewport.width - MARGIN
   );

   let chosen = place(side);
   for (const s of order) {
      const candidate = place(s);
      if (fits(candidate)) {
         chosen = candidate;
         break;
      }
   }
   const top = Math.min(Math.max(chosen.top, MARGIN), Math.max(MARGIN, viewport.height - bubble.height - MARGIN));
   const left = Math.min(Math.max(chosen.left, MARGIN), Math.max(MARGIN, viewport.width - bubble.width - MARGIN));
   // Arrow: the trigger's centre, in bubble coordinates, kept off the corners.
   const corner = 12;
   const arrowX = Math.min(Math.max(trigger.left + trigger.width / 2 - left, corner), bubble.width - corner);
   const arrowY = Math.min(Math.max(trigger.top + trigger.height / 2 - top, corner), bubble.height - corner);
   return { side: chosen.side, top, left, arrowX, arrowY };
}

export class TooltipCore {
   /**
    * @param {object} options
    * @param {(trigger: Element) => Element} [options.describedTarget] the element
    *   that gets aria-describedby / aria-expanded for a trigger.
    * @param {(open: boolean, trigger: Element|null) => void} [options.onOpenChange]
    */
   constructor({ describedTarget, onOpenChange } = {}) {
      this.id = `slice-tooltip-${++uid}`;
      this.trigger = null;
      this.config = normalizeConfig();
      this.visible = false;
      this.bubble = null;
      this._describedTarget = describedTarget || ((trigger) => focusableIn(trigger) || trigger);
      this._onOpenChange = onOpenChange || null;
      this._showTimer = null;
      this._hideTimer = null;
      this._pressTimer = null;
      this._lingerTimer = null;
      this._ownedContent = null;
      this._frame = 0;

      this._reposition = this._reposition.bind(this);
      this._onKeyDown = this._onKeyDown.bind(this);
      this._onOutside = this._onOutside.bind(this);
      this._onBubbleEnter = () => this._cancelHide();
      this._onBubbleLeave = () => { if (this.config.mode !== 'toggletip') this.queueHide(); };
      // Tabbing out of a toggletip (not back to its trigger) closes it.
      this._onBubbleFocusOut = (event) => {
         const next = event.relatedTarget;
         if (this.config.mode !== 'toggletip' || !next) return;
         if (this.bubble?.contains(next) || this.trigger?.contains(next)) return;
         this.hide();
      };
   }

   // ── Showing and hiding ─────────────────────────────────────────

   /** Show for a trigger after its delay (none while tooltips are warm). */
   queueShow(trigger, config, { immediate = false } = {}) {
      const cfg = normalizeConfig(config);
      if (!hasContent(cfg)) return;
      this._cancelHide();
      clearTimeout(this._showTimer);
      const warm = Date.now() - lastHiddenAt < WARM_WINDOW || (openCore && openCore !== this && openCore.visible);
      if (immediate || warm || !cfg.showDelay) {
         this.show(trigger, cfg);
         return;
      }
      this._showTimer = setTimeout(() => this.show(trigger, cfg), cfg.showDelay);
   }

   queueHide() {
      clearTimeout(this._showTimer);
      this._showTimer = null;
      if (!this.visible) return;
      clearTimeout(this._hideTimer);
      const delay = this.config.mode === 'toggletip' ? 0 : this.config.hideDelay;
      if (!delay) {
         this.hide();
         return;
      }
      this._hideTimer = setTimeout(() => this.hide(), delay);
   }

   show(trigger, config) {
      const cfg = normalizeConfig(config);
      if (!trigger || !hasContent(cfg)) return;
      this._cancelHide();
      clearTimeout(this._showTimer);
      // One tooltip at a time on the page.
      if (openCore && openCore !== this) openCore.hide({ instant: true });

      if (this.trigger && this.trigger !== trigger) this._unlink(this.trigger);
      this.trigger = trigger;
      this.config = cfg;
      this._ensureBubble();
      this._fill();
      this._place();
      this._link(trigger);

      if (!this.visible) {
         this.visible = true;
         openCore = this;
         this._open();
         this._addGlobal();
         this._onOpenChange?.(true, trigger);
      } else if (supportsPopover && !this.bubble.matches(':popover-open')) {
         // Moving an open popover in the document closes it: open it again.
         try { this.bubble.showPopover(); } catch { /* not connected */ }
         this.bubble.classList.add('is-visible');
      }
      this._reposition();
   }

   hide({ instant = false, restoreFocus = false } = {}) {
      clearTimeout(this._showTimer);
      clearTimeout(this._hideTimer);
      clearTimeout(this._lingerTimer);
      this._showTimer = null;
      this._hideTimer = null;
      if (!this.visible) return;
      const trigger = this.trigger;
      this.visible = false;
      if (openCore === this) openCore = null;
      lastHiddenAt = instant ? 0 : Date.now();
      this._removeGlobal();
      if (trigger) this._unlink(trigger);
      this._close(instant);
      if (restoreFocus) this._describedTarget(trigger)?.focus?.();
      this._onOpenChange?.(false, trigger);
   }

   toggle(trigger, config) {
      if (this.visible && this.trigger === trigger) this.hide();
      else this.show(trigger, config);
   }

   /** Touch: a long press shows the tooltip, which lingers a moment after release. */
   pressStart(trigger, config) {
      clearTimeout(this._pressTimer);
      this._pressTimer = setTimeout(() => {
         this._pressed = true;
         this.show(trigger, config);
      }, LONG_PRESS);
   }

   pressEnd() {
      clearTimeout(this._pressTimer);
      this._pressTimer = null;
      if (this._pressed) {
         this._pressed = false;
         clearTimeout(this._lingerTimer);
         this._lingerTimer = setTimeout(() => this.hide(), TOUCH_LINGER);
      }
   }

   /** Follow a changed config while open (text edited, placement changed). */
   update(config) {
      if (!this.visible) return;
      this.config = normalizeConfig(config);
      if (!hasContent(this.config)) {
         this.hide({ instant: true });
         return;
      }
      this._fill();
      this._place();
      this._reposition();
   }

   destroy() {
      this.hide({ instant: true });
      clearTimeout(this._pressTimer);
      if (this.bubble) {
         this.bubble.removeEventListener('pointerenter', this._onBubbleEnter);
         this.bubble.removeEventListener('pointerleave', this._onBubbleLeave);
         this.bubble.removeEventListener('focusout', this._onBubbleFocusOut);
         this.bubble.remove();
      }
      this.bubble = null;
      this._ownedContent = null;
   }

   // ── The bubble ─────────────────────────────────────────────────

   _ensureBubble() {
      if (this.bubble) return;
      const bubble = document.createElement('div');
      bubble.className = 'slice-tooltip-bubble';
      bubble.id = this.id;
      if (supportsPopover) bubble.setAttribute('popover', 'manual');
      bubble.innerHTML = '<div class="slice-tooltip-bubble__title" hidden></div><div class="slice-tooltip-bubble__body"></div><kbd class="slice-tooltip-bubble__shortcut" hidden></kbd>';
      bubble.addEventListener('pointerenter', this._onBubbleEnter);
      bubble.addEventListener('pointerleave', this._onBubbleLeave);
      bubble.addEventListener('focusout', this._onBubbleFocusOut);
      this.bubble = bubble;
   }

   _fill() {
      const { bubble, config } = this;
      const $title = bubble.querySelector('.slice-tooltip-bubble__title');
      const $body = bubble.querySelector('.slice-tooltip-bubble__body');
      const $shortcut = bubble.querySelector('.slice-tooltip-bubble__shortcut');
      $title.textContent = config.title || '';
      $title.hidden = !config.title;
      if (config.content instanceof Node) {
         if ($body.firstChild !== config.content || $body.childNodes.length !== 1) $body.replaceChildren(config.content);
         this._ownedContent = config.content;
      } else {
         $body.textContent = config.content != null && config.content !== '' ? String(config.content) : config.text || '';
      }
      $body.hidden = !$body.childNodes.length || ($body.textContent === '' && !(config.content instanceof Node));
      $shortcut.textContent = config.shortcut || '';
      $shortcut.hidden = !config.shortcut;

      bubble.dataset.variant = config.variant;
      bubble.dataset.size = config.size;
      bubble.dataset.mode = config.mode;
      bubble.classList.toggle('has-arrow', config.arrow);
      bubble.classList.toggle('is-rich', !!(config.title || config.content instanceof Node));
      bubble.style.maxWidth = `${config.maxWidth}px`;
      bubble.setAttribute('role', config.mode === 'toggletip' ? 'region' : 'tooltip');
      if (config.mode === 'toggletip') bubble.setAttribute('aria-label', config.title || config.text || 'More information');
      else bubble.removeAttribute('aria-label');
      for (const prop of ['--tt-bg', '--tt-text', '--tt-border']) bubble.style.removeProperty(prop);
      const cc = config.customColor;
      if (cc && typeof cc === 'object') {
         if (cc.background) bubble.style.setProperty('--tt-bg', cc.background);
         if (cc.text) bubble.style.setProperty('--tt-text', cc.text);
         if (cc.border) bubble.style.setProperty('--tt-border', cc.border);
      }
   }

   // A toggletip sits right after its trigger, so Tab reaches its links and a
   // modal dialog around it does not make it inert. A tooltip holds nothing to
   // focus and lives at the end of <body>.
   _place() {
      const { bubble, trigger } = this;
      if (this.config.mode === 'toggletip') {
         const anchor = trigger;
         if (anchor.nextElementSibling !== bubble) anchor.after(bubble);
      } else {
         // Outside a modal dialog everything is inert (no hover), so a trigger
         // inside one keeps its bubble inside it too.
         const host = trigger.closest('dialog[open]') || document.body;
         if (bubble.parentNode !== host) host.appendChild(bubble);
      }
   }

   _open() {
      const { bubble } = this;
      bubble.classList.remove('is-visible');
      if (supportsPopover) {
         try {
            if (!bubble.matches(':popover-open')) bubble.showPopover();
         } catch { /* not connected yet */ }
      } else {
         bubble.classList.add('is-fallback');
      }
      cancelAnimationFrame(this._frame);
      this._frame = requestAnimationFrame(() => {
         if (this.visible) bubble.classList.add('is-visible');
      });
   }

   _close(instant) {
      const { bubble } = this;
      if (!bubble) return;
      cancelAnimationFrame(this._frame);
      bubble.classList.remove('is-visible');
      const finish = () => {
         if (this.visible) return;
         if (supportsPopover) {
            try {
               if (bubble.matches(':popover-open')) bubble.hidePopover();
            } catch { /* already gone */ }
         } else {
            bubble.classList.remove('is-fallback');
         }
      };
      if (instant) finish();
      else setTimeout(finish, 160);
   }

   _link(trigger) {
      const target = this._describedTarget(trigger);
      if (!target) return;
      if (this.config.mode === 'toggletip') {
         target.setAttribute('aria-expanded', 'true');
         target.setAttribute('aria-controls', this.id);
      } else {
         const ids = (target.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== this.id);
         target.setAttribute('aria-describedby', [...ids, this.id].join(' '));
      }
   }

   _unlink(trigger) {
      const target = this._describedTarget(trigger);
      if (!target) return;
      if (target.getAttribute('aria-controls') === this.id) {
         target.setAttribute('aria-expanded', 'false');
         target.removeAttribute('aria-controls');
      }
      const ids = (target.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== this.id);
      if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
      else target.removeAttribute('aria-describedby');
   }

   _reposition() {
      const { bubble, trigger } = this;
      if (!bubble || !trigger || !this.visible) return;
      if (!trigger.isConnected) {
         this.hide({ instant: true });
         return;
      }
      const rect = trigger.getBoundingClientRect();
      // The trigger scrolled out of view: the tooltip goes with it.
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth || (rect.width === 0 && rect.height === 0)) {
         this.hide({ instant: true });
         return;
      }
      const size = { width: bubble.offsetWidth, height: bubble.offsetHeight };
      const pos = computePosition(this.config.placement, rect, size, this.config.offset + (this.config.arrow ? 4 : 0));
      bubble.style.top = `${pos.top}px`;
      bubble.style.left = `${pos.left}px`;
      bubble.style.setProperty('--tt-arrow-x', `${pos.arrowX}px`);
      bubble.style.setProperty('--tt-arrow-y', `${pos.arrowY}px`);
      bubble.dataset.placement = pos.side;
   }

   _cancelHide() {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
   }

   // ── Global listeners, only while open ──────────────────────────

   _addGlobal() {
      window.addEventListener('resize', this._reposition);
      window.addEventListener('scroll', this._reposition, true);
      document.addEventListener('keydown', this._onKeyDown, true);
      document.addEventListener('pointerdown', this._onOutside, true);
   }

   _removeGlobal() {
      window.removeEventListener('resize', this._reposition);
      window.removeEventListener('scroll', this._reposition, true);
      document.removeEventListener('keydown', this._onKeyDown, true);
      document.removeEventListener('pointerdown', this._onOutside, true);
   }

   _onKeyDown(event) {
      if (event.key !== 'Escape' || !this.visible) return;
      // Consumed: the Escape that closes a tooltip does not also close the Modal around it.
      event.preventDefault();
      event.stopPropagation();
      const inside = this.bubble?.contains(document.activeElement);
      this.hide({ instant: true, restoreFocus: this.config.mode === 'toggletip' || inside });
   }

   _onOutside(event) {
      const target = event.target;
      if (this.trigger?.contains(target) || this.bubble?.contains(target)) return;
      this.hide({ instant: true });
   }
}