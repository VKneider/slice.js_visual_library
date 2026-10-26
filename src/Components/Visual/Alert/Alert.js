// Alert — a message inside the page, next to what it is about: "Changes
// saved", "Your trial ends in 3 days", "2 rows removed · Undo", "The list
// could not be loaded · Try again". Toast floats over the whole app and goes
// away; an Alert sits in the layout, and stays until it is dealt with (or its
// `timeout` runs out).
//
//   await slice.build('Alert', { tone: 'warning', title: 'Trial ends soon', message: 'Add a card to keep your data.' });
//   await slice.build('Alert', {
//     tone: 'neutral', variant: 'filled', message: '2 rows removed',
//     actions: [{ label: 'Undo', onClick: undo }], timeout: 5000, dismissible: true,
//     onDismiss: ({ reason }) => { if (reason !== 'action') saveForGood(); },
//   });
//
// Two choices, as in Badge and Button:
//   tone     what it MEANS: neutral, info, success, warning, danger
//   variant  how LOUD it is: soft (a tint, the default), filled, outlined
//
// One alert can be reused for a stream of messages (a list's undo bar):
// show({ message, tone, actions, timeout, onDismiss }) replaces what it says,
// hide(reason) takes it away. onDismiss({ reason }) tells why it went:
// 'close' (the ✕), 'timeout', 'action' (an action was used) or 'api'.

const TONES = ['neutral', 'info', 'success', 'warning', 'danger'];
const VARIANTS = ['soft', 'filled', 'outlined'];
const SIZES = ['sm', 'md'];
const TONE_ICONS = {
   neutral: '',
   info: 'info-circle',
   success: 'check-circle',
   warning: 'exclamation-circle',
   danger: 'close-circle',
};

export default class Alert extends HTMLElement {
   static props = {
      tone: { type: 'string', default: 'info', allowedValues: TONES },
      variant: { type: 'string', default: 'soft', allowedValues: VARIANTS },
      size: { type: 'string', default: 'md', allowedValues: SIZES },
      title: { type: 'string', default: '' },
      message: { type: 'string', default: '' },
      // An Icon name; '' for the tone's own, false for none.
      icon: { type: 'any', default: '' },
      // Buttons on the right: [{ label, onClick({ alert, event }), variant, keepOpen }].
      // Using one closes the alert (reason 'action') unless it says keepOpen.
      actions: { type: 'array', default: [] },
      // A ✕ to close it.
      dismissible: { type: 'boolean', default: false },
      dismissLabel: { type: 'string', default: 'Dismiss' },
      // Milliseconds until it closes by itself (0: never). Paused while the
      // pointer or the focus is on it, so nobody loses an Undo mid-click.
      timeout: { type: 'number', default: 0 },
      // Closed: { reason: 'close' | 'timeout' | 'action' | 'api' }.
      onDismiss: { type: 'function', default: null },
      // Start hidden (an alert waiting for show()).
      open: { type: 'boolean', default: true },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-alert');
      this.$box = this.querySelector('.slice-alert__box');
      this.$icon = this.querySelector('.slice-alert__icon');
      this.$title = this.querySelector('.slice-alert__title');
      this.$message = this.querySelector('.slice-alert__message');
      this.$actions = this.querySelector('.slice-alert__actions');
      this.$close = /** @type {HTMLButtonElement} */ (this.querySelector('.slice-alert__close'));

      this._tone = 'info';
      this._variant = 'soft';
      this._size = 'md';
      this._title = '';
      this._message = '';
      this._icon = /** @type {string | false} */ ('');
      this._actions = [];
      this._dismissible = false;
      this._dismissLabel = 'Dismiss';
      this._timeout = 0;
      this._onDismiss = null;
      this._open = true;

      // Internal state: never a prop's `_<name>` (Slice resets those on build).
      this._ready = false;
      this._timer = 0;
      this._remaining = 0;
      this._startedAt = 0;
      this._hovered = false;
      this._iconComponent = null;
      this._iconName = '';
      this._buttons = [];
      this._actionsRev = 0;
      this._dismissOnce = null;     // onDismiss of the current show()

      this._onPause = () => this._pause();
      this._onResume = () => this._resume();
      this._onCloseClick = () => this.hide('close');

      slice.controller.setComponentProps(this, props);
      this._paint();
   }

   async init() {
      this._ready = true;
      this.$close.addEventListener('click', this._onCloseClick);
      this.addEventListener('pointerenter', this._onPause);
      this.addEventListener('pointerleave', this._onResume);
      this.addEventListener('focusin', this._onPause);
      this.addEventListener('focusout', this._onResume);
      await Promise.all([this._paintIcon(), this._paintActions()]);
      this._paintClose();
      if (this._open) this._arm();
   }

   beforeDestroy() {
      this._ready = false;
      clearTimeout(this._timer);
      this.$close.removeEventListener('click', this._onCloseClick);
      this.removeEventListener('pointerenter', this._onPause);
      this.removeEventListener('pointerleave', this._onResume);
      this.removeEventListener('focusin', this._onPause);
      this.removeEventListener('focusout', this._onResume);
      if (this._iconComponent) slice.controller.destroyComponent(this._iconComponent);
      this._iconComponent = null;
      this._destroyButtons();
      // The ✕'s icon, built after the template.
      slice.controller.destroyByContainer(this.$close);
   }

   // ── Props ──────────────────────────────────────────────────────

   get tone() { return this._tone; }
   set tone(value) {
      this._tone = TONES.includes(value) ? value : 'info';
      this._paint();
      if (this._ready) this._paintIcon();
   }

   get variant() { return this._variant; }
   set variant(value) { this._variant = VARIANTS.includes(value) ? value : 'soft'; this._paint(); }

   get size() { return this._size; }
   set size(value) { this._size = SIZES.includes(value) ? value : 'md'; this._paint(); }

   get title() { return this._title; }
   set title(value) { this._title = value == null ? '' : String(value); this._paint(); }

   get message() { return this._message; }
   set message(value) { this._message = value == null ? '' : String(value); this._paint(); }

   get icon() { return this._icon; }
   set icon(value) {
      this._icon = value === false ? false : (value ? String(value) : '');
      if (this._ready) this._paintIcon();
   }

   get actions() { return this._actions; }
   set actions(value) {
      this._actions = Array.isArray(value) ? value.filter(Boolean) : [];
      if (this._ready) this._paintActions();
   }

   get dismissible() { return this._dismissible; }
   set dismissible(value) { this._dismissible = value === true; this._paintClose(); }

   get dismissLabel() { return this._dismissLabel; }
   set dismissLabel(value) { this._dismissLabel = value ? String(value) : 'Dismiss'; this._paintClose(); }

   get timeout() { return this._timeout; }
   set timeout(value) {
      const ms = Number(value);
      this._timeout = Number.isFinite(ms) && ms > 0 ? ms : 0;
      if (this._ready && this._open) this._arm();
   }

   get onDismiss() { return this._onDismiss; }
   set onDismiss(value) { this._onDismiss = typeof value === 'function' ? value : null; }

   get open() { return this._open; }
   set open(value) {
      this._open = value !== false;
      this.hidden = !this._open;
      if (!this._open) clearTimeout(this._timer);
      else if (this._ready) this._arm();
   }

   // ── Methods ────────────────────────────────────────────────────

   /**
    * Show it, with new content if given. What is not given stays as it was;
    * `onDismiss` here is for this showing only (it runs once, then the
    * alert's own onDismiss runs as usual).
    * @param {{ tone?: string, variant?: string, title?: string, message?: string, icon?: string | false,
    *   actions?: any[], dismissible?: boolean, timeout?: number, onDismiss?: (detail: { reason: string }) => any }} [content]
    */
   async show(content = {}) {
      clearTimeout(this._timer);
      const { onDismiss, ...rest } = content || {};
      for (const [key, value] of Object.entries(rest)) {
         if (!(key in Alert.props)) continue;
         // Actions are drawn once, below, not once per setter.
         if (key === 'actions') this._actions = Array.isArray(value) ? value.filter(Boolean) : [];
         else /** @type {any} */ (this)[key] = value;
      }
      this._dismissOnce = typeof onDismiss === 'function' ? onDismiss : null;
      this._open = true;
      this.hidden = false;
      if (this._ready) {
         await Promise.all([this._paintIcon(), this._paintActions()]);
         this._arm();
      }
   }

   /**
    * Take it away. `reason` is passed to onDismiss ('api' by default).
    * @param {'close' | 'timeout' | 'action' | 'api'} [reason]
    */
   hide(reason = 'api') {
      if (!this._open) return undefined;
      clearTimeout(this._timer);
      this._open = false;
      this.hidden = true;
      const once = this._dismissOnce;
      this._dismissOnce = null;
      const detail = { reason, alert: this };
      const result = once ? once(detail) : undefined;
      this._onDismiss?.(detail);
      return result;
   }

   // ── Painting ───────────────────────────────────────────────────

   _paint() {
      if (!this.$box) return;
      this.dataset.tone = this._tone;
      this.dataset.variant = this._variant;
      this.dataset.size = this._size;
      // Something that went wrong interrupts; everything else waits its turn.
      const urgent = this._tone === 'danger' || this._tone === 'warning';
      this.$box.setAttribute('role', urgent ? 'alert' : 'status');
      this.$box.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
      this.$title.textContent = this._title;
      this.$title.hidden = !this._title;
      this.$message.textContent = this._message;
      this.$message.hidden = !this._message;
      this.classList.toggle('has-title', !!this._title);
      this.hidden = !this._open;
   }

   _paintClose() {
      if (!this.$close) return;
      this.$close.hidden = !this._dismissible;
      this.classList.toggle('is-dismissible', this._dismissible);
      this.$close.setAttribute('aria-label', this._dismissLabel);
      this.$close.title = this._dismissLabel;
      if (this._dismissible && this._ready && !this.$close.querySelector('slice-icon')) {
         slice.build('Icon', { name: 'close', size: '16px' }).then((icon) => {
            if (!icon) return;
            if (!this._ready || this.$close.querySelector('slice-icon')) {
               slice.controller.destroyComponent(icon);
               return;
            }
            this.$close.append(icon);
         });
      }
   }

   async _paintIcon() {
      const name = this._icon === false ? '' : (this._icon || TONE_ICONS[this._tone] || '');
      this.$icon.hidden = !name;
      this.classList.toggle('has-icon', !!name);
      if (name === this._iconName && (this._iconComponent || !name)) return;
      this._iconName = name;
      if (!name) return;
      if (this._iconComponent) {
         this._iconComponent.name = name;
         return;
      }
      const icon = await slice.build('Icon', { name, size: this._size === 'sm' ? '18px' : '20px' });
      if (!icon) return;
      if (!this._ready || this._iconComponent) {
         slice.controller.destroyComponent(icon);
         if (this._iconComponent) this._iconComponent.name = this._iconName;
         return;
      }
      this._iconComponent = icon;
      this.$icon.replaceChildren(icon);
   }

   async _paintActions() {
      const rev = ++this._actionsRev;
      const actions = this._actions;
      // Filled alerts take quiet buttons; the others, buttons in their tone.
      const quiet = this._variant === 'filled';
      const built = await Promise.all(actions.map((action) => slice.build('Button', {
         value: action.label || '',
         icon: action.icon,
         size: 'sm',
         variant: action.variant || (quiet ? 'ghost' : 'outlined'),
         onClick: (event) => {
            action.onClick?.({ alert: this, event });
            if (!action.keepOpen) this.hide('action');
         },
      })));
      if (!this._ready || rev !== this._actionsRev) {
         for (const button of built) if (button) slice.controller.destroyComponent(button);
         return;
      }
      this._destroyButtons();
      this._buttons = built.filter(Boolean);
      this.$actions.replaceChildren(...this._buttons);
      this.$actions.hidden = !this._buttons.length;
   }

   _destroyButtons() {
      for (const button of this._buttons) slice.controller.destroyComponent(button);
      this._buttons = [];
   }

   // ── Timeout ────────────────────────────────────────────────────

   _arm() {
      clearTimeout(this._timer);
      this._remaining = this._timeout;
      if (!this._remaining || this._hovered) return;
      this._run();
   }

   _run() {
      clearTimeout(this._timer);
      this._startedAt = Date.now();
      this._timer = window.setTimeout(() => this.hide('timeout'), this._remaining);
   }

   _pause() {
      this._hovered = true;
      if (!this._open || !this._timeout || !this._timer) return;
      clearTimeout(this._timer);
      this._timer = 0;
      this._remaining = Math.max(0, this._remaining - (Date.now() - this._startedAt));
   }

   _resume() {
      // Still inside (focus moved between its own buttons): stay paused.
      if (this.matches(':hover') || this.contains(document.activeElement)) return;
      this._hovered = false;
      if (!this._open || !this._timeout || this._timer) return;
      this._remaining = this._remaining || this._timeout;
      this._run();
   }
}

customElements.define('slice-alert', Alert);