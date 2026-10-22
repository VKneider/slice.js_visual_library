// A modal dialog on the native <dialog> element.
//
// showModal() gives the hard parts for free: the top layer (no z-index wars,
// no clipping by a transformed or overflow:hidden ancestor), the rest of the
// page made inert, focus kept inside, and ::backdrop. This component adds what
// apps keep re-writing around it:
//
//   - looks: size, a centred / top / drawer / sheet / fullscreen layout, a
//     different layout on phones, tone (info, success, warning, danger);
//   - content from props (title, description, icon, content, actions) as well
//     as appendBody() / appendFooter();
//   - a single close path with a reason ('escape', 'backdrop', 'close-button',
//     'action', 'swipe', 'form', 'api'), guarded by onBeforeClose, so "you have
//     unsaved changes" is one callback;
//   - show(), a promise for the answer;
//   - enter AND exit animations, focus handed back to whatever opened it,
//     scroll lock shared by stacked modals, drag and resize.
//
// Contract other components rely on (ConfirmActionModal, Table, ThemeCreator,
// Form docs): the .slice-modal / __header / __title / __body / __footer /
// __close classes, `open`, appendBody(), appendFooter(), close(), and
// onClose({ returnValue }) firing synchronously from close().

const TONE_ICONS = {
   info: 'info-circle',
   success: 'check-circle',
   warning: 'exclamation-circle',
   danger: 'exclamation-circle',
};

// Long enough for the exit transition in Modal.css (220ms) to finish.
const EXIT_MS = 260;

let uid = 0;

export default class Modal extends HTMLElement {
   static props = {
      open: { type: 'boolean', default: false },
      title: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      icon: { type: 'string', default: '' },
      tone: {
         type: 'string',
         default: 'neutral',
         allowedValues: ['neutral', 'info', 'success', 'warning', 'danger']
      },
      size: {
         type: 'string',
         default: 'md',
         allowedValues: ['sm', 'md', 'lg', 'xl', 'full']
      },
      layout: {
         type: 'string',
         default: 'center',
         allowedValues: ['center', 'top', 'drawer', 'sheet', 'fullscreen']
      },
      side: {
         type: 'string',
         default: 'right',
         allowedValues: ['right', 'left', 'top', 'bottom']
      },
      mobileLayout: {
         type: 'string',
         default: '',
         allowedValues: ['', 'sheet', 'fullscreen']
      },
      breakpoint: { type: 'number', default: 600 },
      accent: { type: 'boolean', default: true },
      content: { type: 'any', default: null },
      actions: { type: 'array', default: [] },
      actionsAlign: {
         type: 'string',
         default: 'end',
         allowedValues: ['end', 'start', 'between', 'stretch']
      },
      dismissable: { type: 'boolean', default: true },
      closeOnBackdrop: { type: 'boolean', default: true },
      closeOnEscape: { type: 'boolean', default: true },
      closeLabel: { type: 'string', default: 'Close' },
      ariaLabel: { type: 'string', default: '' },
      initialFocus: { type: 'string', default: '' },
      returnFocus: { type: 'boolean', default: true },
      scrollLock: { type: 'boolean', default: true },
      destroyOnClose: { type: 'boolean', default: false },
      width: { type: 'string', default: '' },
      maxWidth: { type: 'string', default: '' },
      draggable: { type: 'boolean', default: false },
      resizable: { type: 'boolean', default: false },
      customColor: { type: 'object', default: null },
      onOpen: { type: 'function', default: null },
      onBeforeClose: { type: 'function', default: null },
      onClose: { type: 'function', default: null }
   };

   // Scroll lock shared by every open modal (see _lockScroll).
   static _openCount = 0;
   /** @type {number | null} */
   static _scrollY = null;
   /** @type {string | null} */
   static _originalBodyPosition = null;
   /** @type {string | null} */
   static _originalBodyTop = null;
   /** @type {string | null} */
   static _originalBodyWidth = null;

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$dialog = this.querySelector('.slice-modal');
      this.$handle = this.querySelector('.slice-modal__handle');
      this.$header = this.querySelector('.slice-modal__header');
      this.$icon = this.querySelector('.slice-modal__icon');
      this.$title = this.querySelector('.slice-modal__title');
      this.$description = this.querySelector('.slice-modal__description');
      this.$body = this.querySelector('.slice-modal__body');
      this.$footer = this.querySelector('.slice-modal__footer');
      this.$close = this.querySelector('.slice-modal__close');

      const id = `slice-modal-${++uid}`;
      this.$title.id = `${id}-title`;
      this.$description.id = `${id}-desc`;

      this._open = false;
      this._title = '';
      this._description = '';
      this._iconName = '';
      this._tone = 'neutral';
      this._size = 'md';
      this._layout = 'center';
      this._side = 'right';
      this._mobileLayout = '';
      this._breakpoint = 600;
      this._accent = true;
      this._content = null;
      this._contentNodes = [];
      this._actions = [];
      this._actionNodes = [];
      this._actionsToken = 0;
      this._actionsAlign = 'end';
      this._dismissable = true;
      this._closeOnBackdrop = true;
      this._closeOnEscape = true;
      this._closeLabel = 'Close';
      this._ariaLabel = '';
      this._initialFocus = '';
      this._returnFocus = true;
      this._scrollLockEnabled = true;
      this._destroyOnClose = false;
      this._customColor = null;
      this._onOpen = null;
      this._onBeforeClose = null;
      this._onClose = null;
      this._scrollLocked = false;
      this._draggable = false;
      this._resizable = false;
      this._dnd = null;
      this._inited = false;
      this._closeReason = null;
      this._guarding = false;
      this._waiters = [];
      this._returnTo = null;
      this._iconEl = null;
      this._iconToken = 0;
      this._mq = null;
      this._swipe = null;
      this._pressedOnBackdrop = false;

      this._handleClose = this._handleClose.bind(this);
      this._handleKeyDown = this._handleKeyDown.bind(this);
      this._handleCancel = this._handleCancel.bind(this);
      this._handleDialogClose = this._handleDialogClose.bind(this);
      this._handleBackdropClick = this._handleBackdropClick.bind(this);
      this._handleDialogPointerDown = this._handleDialogPointerDown.bind(this);
      this._handleMedia = this._handleMedia.bind(this);
      this._handleSwipeStart = this._handleSwipeStart.bind(this);
      this._handleSwipeMove = this._handleSwipeMove.bind(this);
      this._handleSwipeEnd = this._handleSwipeEnd.bind(this);

      slice.controller.setComponentProps(this, props || {});
      this._syncHeader();
      this._syncLabelling();
   }

   // ── Props ──────────────────────────────────────────────────────

   _pick(name, value) {
      const { allowedValues, default: fallback } = Modal.props[name];
      return allowedValues.includes(value) ? value : fallback;
   }

   set open(value) {
      const next = value === true;
      // During construction the host is not connected yet and showModal() would
      // throw; just record the state and let init() apply it. Once mounted, the
      // prop drives the dialog so `modal.open = true/false` actually works.
      if (!this.$dialog || !this.isConnected) {
         this._open = next;
         return;
      }
      if (next) this.showModal();
      else if (this.$dialog.open) this.close();
      else this._open = false;
   }
   get open() { return this._open; }
   get isOpen() { return this._open; }

   set title(value) {
      this._title = typeof value === 'string' ? value : '';
      if (this.$title) this.$title.textContent = this._title;
      this._syncHeader();
      this._syncLabelling();
   }
   get title() { return this._title; }

   set description(value) {
      this._description = typeof value === 'string' ? value : '';
      if (this.$description) {
         this.$description.textContent = this._description;
         this.$description.hidden = !this._description;
      }
      this._syncHeader();
      this._syncLabelling();
   }
   get description() { return this._description; }

   set icon(value) {
      this._iconName = typeof value === 'string' ? value : '';
      this._renderIcon();
   }
   get icon() { return this._iconName; }

   set tone(value) {
      this._tone = this._pick('tone', value);
      if (this.$dialog) this.$dialog.dataset.tone = this._tone;
      this._renderIcon();
   }
   get tone() { return this._tone; }

   set size(value) {
      this._size = this._pick('size', value);
      if (this.$dialog) this.$dialog.dataset.size = this._size;
   }
   get size() { return this._size; }

   set layout(value) {
      this._layout = this._pick('layout', value);
      this._applyLayout();
   }
   get layout() { return this._layout; }

   set side(value) {
      this._side = this._pick('side', value);
      this._applyLayout();
   }
   get side() { return this._side; }

   set mobileLayout(value) {
      this._mobileLayout = this._pick('mobileLayout', value ?? '');
      this._watchMedia();
      this._applyLayout();
   }
   get mobileLayout() { return this._mobileLayout; }

   set breakpoint(value) {
      const n = Number(value);
      this._breakpoint = Number.isFinite(n) && n > 0 ? n : 600;
      this._watchMedia();
      this._applyLayout();
   }
   get breakpoint() { return this._breakpoint; }

   set accent(value) {
      this._accent = value !== false;
      if (this.$dialog) this.$dialog.classList.toggle('slice-modal--plain', !this._accent);
   }
   get accent() { return this._accent; }

   set content(value) {
      this._content = value ?? null;
      this._renderContent();
   }
   get content() { return this._content; }

   set actions(value) {
      this._actions = Array.isArray(value) ? value : [];
      this._renderActions();
   }
   get actions() { return this._actions; }

   set actionsAlign(value) {
      this._actionsAlign = this._pick('actionsAlign', value);
      if (this.$footer) this.$footer.dataset.align = this._actionsAlign;
   }
   get actionsAlign() { return this._actionsAlign; }

   set dismissable(value) {
      this._dismissable = value !== false;
      if (this.$close) this.$close.hidden = !this._dismissable;
      this._syncHeader();
   }
   get dismissable() { return this._dismissable; }

   set closeOnBackdrop(value) { this._closeOnBackdrop = value !== false; }
   get closeOnBackdrop() { return this._closeOnBackdrop; }

   set closeOnEscape(value) { this._closeOnEscape = value !== false; }
   get closeOnEscape() { return this._closeOnEscape; }

   set closeLabel(value) {
      this._closeLabel = typeof value === 'string' && value ? value : 'Close';
      if (this.$close) this.$close.setAttribute('aria-label', this._closeLabel);
   }
   get closeLabel() { return this._closeLabel; }

   set ariaLabel(value) {
      this._ariaLabel = typeof value === 'string' ? value : '';
      this._syncLabelling();
   }
   get ariaLabel() { return this._ariaLabel; }

   set initialFocus(value) { this._initialFocus = typeof value === 'string' ? value : ''; }
   get initialFocus() { return this._initialFocus; }

   set returnFocus(value) { this._returnFocus = value !== false; }
   get returnFocus() { return this._returnFocus; }

   set scrollLock(value) { this._scrollLockEnabled = value !== false; }
   get scrollLock() { return this._scrollLockEnabled; }

   set destroyOnClose(value) { this._destroyOnClose = value === true; }
   get destroyOnClose() { return this._destroyOnClose; }

   set width(value) {
      if (!this.$dialog) return;
      if (value) this.$dialog.style.setProperty('--modal-width', value);
      else this.$dialog.style.removeProperty('--modal-width');
   }

   set maxWidth(value) {
      if (!this.$dialog) return;
      if (value) this.$dialog.style.setProperty('--modal-max-width', value);
      else this.$dialog.style.removeProperty('--modal-max-width');
   }

   set draggable(value) {
      this._draggable = value === true;
      this.classList.toggle('is-draggable', this._draggable);
      this._syncDnD();
   }
   get draggable() { return this._draggable; }

   set resizable(value) {
      this._resizable = value === true;
      this.classList.toggle('is-resizable', this._resizable);
      this._syncDnD();
   }
   get resizable() { return this._resizable; }

   set customColor(value) {
      this._customColor = value || null;
      if (!this._customColor || !this.$dialog) return;
      if (this._customColor.background) this.$dialog.style.setProperty('--modal-bg', this._customColor.background);
      if (this._customColor.text) this.$dialog.style.setProperty('--modal-text', this._customColor.text);
      if (this._customColor.accent) this.$dialog.style.setProperty('--modal-accent', this._customColor.accent);
   }
   get customColor() { return this._customColor; }

   set onOpen(value) { this._onOpen = typeof value === 'function' ? value : null; }
   get onOpen() { return this._onOpen; }

   set onBeforeClose(value) { this._onBeforeClose = typeof value === 'function' ? value : null; }
   get onBeforeClose() { return this._onBeforeClose; }

   set onClose(value) { this._onClose = typeof value === 'function' ? value : null; }
   get onClose() { return this._onClose; }

   // ── Public API ─────────────────────────────────────────────────

   showModal() {
      this._open = true;
      this.removeAttribute('open');
      if (!this.$dialog || !this.isConnected) return;
      // showModal() throws InvalidStateError if the dialog is already open.
      if (this.$dialog.open) return;

      const active = document.activeElement;
      this._returnTo = active && active !== document.body && !this.$dialog.contains(active) ? active : null;
      this._closeReason = null;
      this._cancelExit();
      this._applyLayout();

      // Lock scroll BEFORE showModal() so Chrome cannot scroll the page when
      // auto-focusing the dialog ("scroll the dialog into view" step).
      if (this._scrollLockEnabled) this._lockScroll();
      if (this._dndEnabled()) this._resetDnDLayout();
      this.$dialog.showModal();
      this._focusInitial();
      if (this._dndEnabled()) this._pinForDnD();
      if (this._onOpen) this._onOpen({ modal: this });
   }

   // Open and wait for the answer: resolves with { returnValue, reason } once
   // the modal closes, however it closes.
   show() {
      return new Promise((resolve) => {
         this._waiters.push(resolve);
         if (this.isConnected) this.showModal();
         else this._open = true;
      });
   }

   // Closes now, without asking onBeforeClose: a call from code is a decision
   // already made. Use requestClose() to go through the guard.
   close(returnValue) {
      this._open = false;
      if (!this.$dialog) return;
      if (!this._closeReason) this._closeReason = 'api';
      if (this.$dialog.open) {
         if (returnValue !== undefined) this.$dialog.close(String(returnValue));
         else this.$dialog.close();
      }
      this._restoreScroll();
   }

   // The close path for anything a person did. Asks onBeforeClose first and
   // resolves with whether the modal actually closed.
   async requestClose(reason = 'api', returnValue) {
      if (!this.$dialog?.open || this._guarding) return false;
      if (this._onBeforeClose) {
         this._guarding = true;
         let allowed = true;
         try {
            const answer = await this._onBeforeClose({ reason, returnValue, modal: this });
            allowed = answer !== false;
         } catch (error) {
            slice.logger?.logError?.('Modal', 'onBeforeClose threw; keeping the modal open', error);
            allowed = false;
         } finally {
            this._guarding = false;
         }
         if (!allowed || !this.$dialog.open) return false;
      }
      this._closeReason = reason;
      this.close(returnValue);
      return true;
   }

   toggle(force) {
      const next = typeof force === 'boolean' ? force : !this._open;
      this.open = next;
   }

   appendBody(node) {
      if (node && this.$body) this.$body.appendChild(node);
   }

   appendFooter(node) {
      if (node && this.$footer) this.$footer.appendChild(node);
   }

   get bodyElement() { return this.$body; }
   get footerElement() { return this.$footer; }

   // ── Lifecycle ──────────────────────────────────────────────────

   async init() {
      this.$close.addEventListener('click', this._handleClose);
      this.$dialog.addEventListener('keydown', this._handleKeyDown);
      this.$dialog.addEventListener('cancel', this._handleCancel);
      this.$dialog.addEventListener('close', this._handleDialogClose);
      this.$dialog.addEventListener('click', this._handleBackdropClick);
      this.$dialog.addEventListener('pointerdown', this._handleDialogPointerDown);
      this.$handle.addEventListener('pointerdown', this._handleSwipeStart);
      this.$header.addEventListener('pointerdown', this._handleSwipeStart);

      this._inited = true;
      this._watchMedia();
      this._applyLayout();

      if (this._dndEnabled()) {
         this._dnd = await slice.build('DragDropService', { singleton: true });
         this._applyDnD();
      }

      if (this._open) {
         requestAnimationFrame(() => {
            if (this.isConnected && this._open) this.showModal();
         });
      }
   }

   disconnectedCallback() {
      // Listeners are added once in init() and are NOT re-added on reconnect, so
      // tearing them down here would break a detach/reattach cycle (e.g. the
      // router caches instances via innerHTML='' + appendChild without re-running
      // init()). Listener cleanup lives in beforeDestroy(). Here we only release
      // the scroll lock for teardown that never reaches beforeDestroy().
      this._restoreScroll();
   }

   beforeDestroy() {
      this._cancelExit();
      if (this.$dialog.open) {
         this._closeReason = this._closeReason || 'api';
         this.$dialog.close();
      }
      this._restoreScroll();
      this._settleWaiters({ returnValue: '', reason: 'destroy' });
      if (this._dnd) this._dnd.detach(this.$dialog);
      this._endSwipe(false);
      this._removeListeners();
      if (this._mq) {
         this._mq.removeEventListener('change', this._handleMedia);
         this._mq = null;
      }
      this._destroyNodes(this._actionNodes);
      this._actionNodes = [];
      if (this._iconEl) {
         slice.controller.destroyComponent(this._iconEl);
         this._iconEl = null;
      }
   }

   // ── Rendering ──────────────────────────────────────────────────

   // A header with nothing but the ✕ shrinks to a corner button, and with
   // nothing at all it disappears, so a content-only modal has no empty band.
   _syncHeader() {
      if (!this.$header) return;
      const hasText = !!(this._title || this._description);
      const hasIcon = !!this._effectiveIcon();
      const bare = !hasText && !hasIcon;
      this.$header.classList.toggle('is-bare', bare);
      this.$header.hidden = bare && !this._dismissable;
   }

   _syncLabelling() {
      const d = this.$dialog;
      if (!d) return;
      if (this._title) d.setAttribute('aria-labelledby', this.$title.id);
      else d.removeAttribute('aria-labelledby');
      if (this._ariaLabel && !this._title) d.setAttribute('aria-label', this._ariaLabel);
      else d.removeAttribute('aria-label');
      if (this._description) d.setAttribute('aria-describedby', this.$description.id);
      else d.removeAttribute('aria-describedby');
   }

   _effectiveIcon() {
      if (this._iconName === 'none') return '';
      return this._iconName || TONE_ICONS[this._tone] || '';
   }

   async _renderIcon() {
      if (!this.$icon) return;
      const name = this._effectiveIcon();
      this._syncHeader();
      const token = ++this._iconToken;
      if (!name) {
         this.$icon.hidden = true;
         if (this._iconEl) {
            slice.controller.destroyComponent(this._iconEl);
            this._iconEl.remove();
            this._iconEl = null;
         }
         return;
      }
      this.$icon.hidden = false;
      if (this._iconEl) {
         this._iconEl.name = name;
         return;
      }
      const el = await slice.build('Icon', { name, size: '20px' });
      if (!el) return;
      if (token !== this._iconToken || this._iconEl) {
         slice.controller.destroyComponent(el);
         if (this._iconEl && token === this._iconToken) this._iconEl.name = this._effectiveIcon();
         return;
      }
      this._iconEl = el;
      this.$icon.appendChild(el);
   }

   _renderContent() {
      if (!this.$body) return;
      for (const node of this._contentNodes) node.remove();
      this._contentNodes = [];
      const list = Array.isArray(this._content) ? this._content : [this._content];
      const anchor = this.$body.firstChild;
      for (const item of list) {
         if (item === null || item === undefined || item === false || item === '') continue;
         let node;
         if (item instanceof Node) {
            node = item;
         } else {
            node = document.createElement('p');
            node.className = 'slice-modal__text';
            node.textContent = String(item);
         }
         this.$body.insertBefore(node, anchor);
         this._contentNodes.push(node);
      }
   }

   async _renderActions() {
      if (!this.$footer) return;
      const token = ++this._actionsToken;
      const built = [];
      const own = [];
      for (const action of this._actions) {
         if (!action) continue;
         if (action instanceof Node) {
            built.push(action);
            continue;
         }
         if (typeof action !== 'object' || action.hidden) continue;
         const node = await this._buildAction(action);
         if (node) own.push(node);
         // A newer `actions` arrived while this one was building: drop ours.
         if (token !== this._actionsToken) {
            this._destroyNodes(own);
            return;
         }
         if (node) built.push(node);
      }
      this._destroyNodes(this._actionNodes.filter((n) => !built.includes(n)));
      for (const node of built) this.$footer.appendChild(node);
      this._actionNodes = built;
   }

   async _buildAction(action) {
      const { value, text, label, variant, icon, size, close, onClick, autofocus, disabled, className } = action;
      const caption = value ?? text ?? label ?? '';
      // An action with no handler is a "Cancel"/"OK" button: it closes. One
      // with a handler stays open unless it says `close`.
      const closes = close !== undefined ? close : typeof onClick !== 'function';
      const props = {
         value: String(caption),
         variant: variant || 'filled',
         onClick: async () => {
            if (button.$button?.disabled) return;
            let result;
            if (typeof onClick === 'function') result = await onClick({ modal: this, action });
            if (result === false || closes === false) return;
            const returnValue = closes === true ? String(action.returnValue ?? caption) : String(closes);
            await this.requestClose('action', returnValue);
         }
      };
      if (size) props.size = size;
      if (icon) props.icon = icon;
      if (className) props.className = className;
      const button = await slice.build('Button', props);
      if (!button) return null;
      button.classList.add('slice-modal__action');
      if (button.$button) {
         if (disabled) button.$button.disabled = true;
         if (autofocus) button.$button.setAttribute('autofocus', '');
      }
      return button;
   }

   _destroyNodes(nodes) {
      for (const node of nodes) {
         if (!node) continue;
         if (node.sliceId && !this._actions.includes(node)) slice.controller.destroyComponent(node);
         node.remove();
      }
   }

   // ── Layout ─────────────────────────────────────────────────────

   _watchMedia() {
      if (!this._inited) return;
      if (this._mq) this._mq.removeEventListener('change', this._handleMedia);
      this._mq = null;
      if (!this._mobileLayout || typeof window.matchMedia !== 'function') return;
      this._mq = window.matchMedia(`(max-width: ${this._breakpoint}px)`);
      this._mq.addEventListener('change', this._handleMedia);
   }

   _handleMedia() {
      this._applyLayout();
   }

   get effectiveLayout() {
      if (this._mobileLayout && this._mq?.matches) return this._mobileLayout;
      return this._layout;
   }

   _applyLayout() {
      const d = this.$dialog;
      if (!d) return;
      const layout = this.effectiveLayout;
      const prev = d.dataset.layout;
      d.dataset.layout = layout;
      if (layout === 'drawer') d.dataset.side = this._side;
      else delete d.dataset.side;
      d.classList.toggle('is-swipeable', layout === 'sheet');
      if (prev && prev !== layout && this._inited) {
         // Drag and resize only make sense for a floating box.
         this._syncDnD();
         if (d.open && this._dndEnabled()) {
            this._resetDnDLayout();
            this._pinForDnD();
         } else if (!this._dndEnabled()) {
            this._resetDnDLayout();
         }
      }
   }

   _floats() {
      const layout = this.effectiveLayout;
      return layout === 'center' || layout === 'top';
   }

   // ── Focus ──────────────────────────────────────────────────────

   _focusInitial() {
      const d = this.$dialog;
      let target = null;
      if (this._initialFocus && this._initialFocus !== 'dialog') {
         if (this._initialFocus === 'first') {
            target = d.querySelector('button:not([disabled]):not([hidden]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (target === this.$close && this._firstFocusableAfterClose()) target = this._firstFocusableAfterClose();
         } else {
            try { target = d.querySelector(this._initialFocus); } catch { target = null; }
         }
      } else if (this._initialFocus !== 'dialog') {
         target = d.querySelector('[autofocus]');
      }
      if (target && typeof target.focus === 'function') {
         target.focus({ preventScroll: true });
      } else if (document.activeElement === this.$close) {
         // The browser hands focus to the first focusable thing, which is the
         // ✕: it would open wearing a focus ring and invite an accidental
         // Enter. Start on the dialog itself; Tab reaches the ✕ next.
         this.$close.blur();
      }
      // A modal <dialog> only handles Escape while focus is inside it, and UA
      // auto-focus can land on the body. Claim focus explicitly.
      if (!d.contains(document.activeElement)) {
         if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '-1');
         d.focus({ preventScroll: true });
      }
   }

   _firstFocusableAfterClose() {
      const all = this.$dialog.querySelectorAll('.slice-modal__body button:not([disabled]), .slice-modal__body [href], .slice-modal__body input:not([disabled]), .slice-modal__body select:not([disabled]), .slice-modal__body textarea:not([disabled]), .slice-modal__body [tabindex]:not([tabindex="-1"]), .slice-modal__footer button:not([disabled])');
      return all[0] || null;
   }

   _restoreFocus() {
      const target = this._returnTo;
      this._returnTo = null;
      if (!this._returnFocus || !target || !target.isConnected) return;
      const active = document.activeElement;
      if (active && active !== document.body && !this.$dialog.contains(active)) return;
      try { target.focus({ preventScroll: true }); } catch { /* not focusable any more */ }
   }

   // ── Scroll lock ────────────────────────────────────────────────

   _lockScroll() {
      // Guard per-instance so the same modal can never increment the shared
      // counter twice (e.g. showModal() + a stray init path).
      if (this._scrollLocked) return;
      this._scrollLocked = true;
      Modal._openCount++;
      if (Modal._openCount === 1) {
         // position:fixed instead of overflow:hidden, so Chrome does not
         // propagate overflow to the viewport and reset scrollY to 0.
         Modal._scrollY = window.scrollY;
         Modal._originalBodyPosition = document.body.style.position;
         Modal._originalBodyTop = document.body.style.top;
         Modal._originalBodyWidth = document.body.style.width;
         document.body.style.position = 'fixed';
         document.body.style.top = `-${Modal._scrollY}px`;
         document.body.style.width = '100%';
      }
   }

   _restoreScroll() {
      // Idempotent: only the instance that actually locked may release, so it is
      // safe to call from every close path without double-decrementing.
      if (!this._scrollLocked) return;
      this._scrollLocked = false;
      Modal._openCount = Math.max(0, Modal._openCount - 1);
      if (Modal._openCount === 0) {
         const scrollY = Modal._scrollY;
         document.body.style.position = Modal._originalBodyPosition || '';
         document.body.style.top = Modal._originalBodyTop || '';
         document.body.style.width = Modal._originalBodyWidth || '';
         Modal._originalBodyPosition = null;
         Modal._originalBodyTop = null;
         Modal._originalBodyWidth = null;
         Modal._scrollY = null;
         if (scrollY !== null) window.scrollTo(0, scrollY);
      }
   }

   // ── Drag & resize (DragDropService integration) ───────────────

   _dndEnabled() {
      return (this._draggable || this._resizable) && this._floats();
   }

   // (Re)wire the dialog with the DnD service from the current flags. Idempotent:
   // detach first so toggling never stacks duplicate resize-handle containers.
   _applyDnD() {
      if (!this._dnd || !this.$dialog) return;
      this._dnd.detach(this.$dialog);
      const on = this._dndEnabled();
      // A resizable modal must not be capped by the default max-width/height,
      // otherwise resizing wider/taller has no visible effect.
      this.$dialog.style.maxWidth = on && this._resizable ? 'none' : '';
      this.$dialog.style.maxHeight = on && this._resizable ? 'none' : '';
      if (!on) return;
      if (this._draggable) {
         this._dnd.makeDraggable(this.$dialog, {
            handle: '.slice-modal__header',
            ghost: false,
            freePosition: true,
            threshold: 4,        // a click on the header (e.g. the ✕) must not start a drag
            autoScroll: false,   // the background scroll is locked while a modal is open
         });
      }
      if (this._resizable) {
         this._dnd.makeResizable(this.$dialog, {
            handles: ['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n'],
            minWidth: 280,
            minHeight: 140,
         });
      }
   }

   // From the draggable/resizable/layout setters: build the service on demand
   // when DnD becomes enabled after init(); detach when it is turned off.
   _syncDnD() {
      if (!this._inited) return;
      if (this._dndEnabled()) {
         if (this._dnd) {
            this._applyDnD();
         } else {
            slice.build('DragDropService', { singleton: true }).then((s) => {
               this._dnd = s;
               this._applyDnD();
            });
         }
      } else if (this._dnd) {
         this._applyDnD();
      }
   }

   // A modal opened with showModal() is UA-centred via margin:auto. Drag/resize
   // need real viewport coordinates, so pin it to fixed + explicit left/top.
   // offsetWidth/Height ignore the enter transform, so the measurement is stable.
   _pinForDnD() {
      const d = this.$dialog;
      const w = d.offsetWidth;
      const h = d.offsetHeight;
      const top = this.effectiveLayout === 'top'
         ? Math.min(window.innerHeight * 0.12, 120)
         : (window.innerHeight - h) / 2;
      d.style.position = 'fixed';
      d.style.margin = '0';
      d.style.left = Math.max(8, (window.innerWidth - w) / 2) + 'px';
      d.style.top = Math.max(8, top) + 'px';
   }

   // Clear drag/resize inline styles so each open starts from the default size.
   _resetDnDLayout() {
      const s = this.$dialog.style;
      s.position = '';
      s.left = '';
      s.top = '';
      s.right = '';
      s.bottom = '';
      s.margin = '';
      s.width = '';
      s.height = '';
      s.transform = '';
   }

   // ── Swipe to close (sheet) ─────────────────────────────────────

   _handleSwipeStart(event) {
      if (this.effectiveLayout !== 'sheet' || !this.$dialog.open) return;
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest('button, a, input, select, textarea, [role="button"]')) return;
      this._swipe = {
         id: event.pointerId,
         startY: event.clientY,
         lastY: event.clientY,
         lastT: performance.now(),
         velocity: 0,
         dy: 0,
      };
      this.$dialog.classList.add('is-swiping');
      window.addEventListener('pointermove', this._handleSwipeMove);
      window.addEventListener('pointerup', this._handleSwipeEnd);
      window.addEventListener('pointercancel', this._handleSwipeEnd);
   }

   _handleSwipeMove(event) {
      const s = this._swipe;
      if (!s || event.pointerId !== s.id) return;
      const now = performance.now();
      const dy = Math.max(0, event.clientY - s.startY);
      s.velocity = (event.clientY - s.lastY) / Math.max(1, now - s.lastT);
      s.lastY = event.clientY;
      s.lastT = now;
      s.dy = dy;
      this.$dialog.style.transform = dy ? `translateY(${dy}px)` : '';
   }

   async _handleSwipeEnd(event) {
      const s = this._swipe;
      if (!s || (event && event.pointerId !== s.id)) return;
      const height = this.$dialog.offsetHeight || 1;
      const dismiss = event?.type === 'pointerup' && (s.dy > height * 0.3 || (s.dy > 24 && s.velocity > 0.6));
      this._endSwipe(true);
      if (dismiss && this._dismissable) {
         const closed = await this.requestClose('swipe');
         if (!closed) this.$dialog.style.transform = '';
      } else {
         this.$dialog.style.transform = '';
      }
   }

   _endSwipe(keepTransform) {
      window.removeEventListener('pointermove', this._handleSwipeMove);
      window.removeEventListener('pointerup', this._handleSwipeEnd);
      window.removeEventListener('pointercancel', this._handleSwipeEnd);
      this._swipe = null;
      if (!this.$dialog) return;
      this.$dialog.classList.remove('is-swiping');
      if (!keepTransform) this.$dialog.style.transform = '';
   }

   // ── Event handlers ─────────────────────────────────────────────

   _handleClose() {
      this.requestClose('close-button');
   }

   _handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      // Something inside (an open Select or DropDown) already used this Escape.
      if (event.defaultPrevented) return;
      // Handled here instead of by the browser, so onBeforeClose can run and a
      // non-dismissable modal stays put.
      event.preventDefault();
      if (this._dismissable && this._closeOnEscape) this.requestClose('escape');
   }

   // A close request the keydown did not see (the Android back gesture, or an
   // Escape pressed while focus was outside the dialog).
   _handleCancel(event) {
      event.preventDefault();
      if (this._dismissable && this._closeOnEscape) this.requestClose('escape');
   }

   _handleDialogClose() {
      this._open = false;
      // The native <dialog> fires 'close' on EVERY close path. Restoring scroll
      // here is the single source of truth so no path can leave the page locked.
      this._restoreScroll();
      this._endSwipe(false);
      const reason = this._closeReason || 'form';
      this._closeReason = null;
      const detail = { returnValue: this.$dialog.returnValue, reason };
      this._restoreFocus();
      if (typeof this._onClose === 'function') this._onClose(detail);
      this._settleWaiters(detail);
      this.dispatchEvent(new CustomEvent('modal-close', { detail, bubbles: true }));
      if (this._destroyOnClose) this._scheduleDestroy();
   }

   _settleWaiters(detail) {
      const waiters = this._waiters;
      this._waiters = [];
      for (const resolve of waiters) resolve(detail);
   }

   _scheduleDestroy() {
      this._cancelExit();
      this._exitTimer = window.setTimeout(() => {
         this._exitTimer = null;
         if (this._open) return;   // reopened in the meantime
         slice.controller.destroyComponent(this);
         this.remove();
      }, EXIT_MS);
   }

   _cancelExit() {
      if (this._exitTimer) {
         window.clearTimeout(this._exitTimer);
         this._exitTimer = null;
      }
   }

   _handleDialogPointerDown(event) {
      // Only a press that STARTS on the backdrop (the dialog element itself, not
      // its content) counts as an outside click, so a drag or a text selection
      // released outside never closes the modal.
      this._pressedOnBackdrop = event.target === this.$dialog;
   }

   _handleBackdropClick(event) {
      if (event.target !== this.$dialog || !this._pressedOnBackdrop) return;
      this._pressedOnBackdrop = false;
      if (!this._dismissable || !this._closeOnBackdrop) {
         // Say "no" visibly instead of ignoring the click.
         this.$dialog.classList.remove('is-refusing');
         void this.$dialog.offsetWidth;
         this.$dialog.classList.add('is-refusing');
         return;
      }
      this.requestClose('backdrop');
   }

   _removeListeners() {
      this.$close.removeEventListener('click', this._handleClose);
      this.$dialog.removeEventListener('keydown', this._handleKeyDown);
      this.$dialog.removeEventListener('cancel', this._handleCancel);
      this.$dialog.removeEventListener('close', this._handleDialogClose);
      this.$dialog.removeEventListener('click', this._handleBackdropClick);
      this.$dialog.removeEventListener('pointerdown', this._handleDialogPointerDown);
      this.$handle.removeEventListener('pointerdown', this._handleSwipeStart);
      this.$header.removeEventListener('pointerdown', this._handleSwipeStart);
   }
}

customElements.define('slice-modal', Modal);