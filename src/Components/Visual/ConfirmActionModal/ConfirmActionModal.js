// The "are you sure?" modal, and the prompt variant with a single text field.
//
// Built on `Modal`, so scroll-lock, focus handling, Escape and backdrop
// dismissal are already solved - this only owns the copy, the icon, the two
// buttons, and the answer.
//
// TWO WAYS IN, because apps genuinely need both:
//
//   1. A promise, for the call site that needs the answer to continue its
//      work:
//
//         if (!await confirm.ask({ title: 'Delete project?', danger: true })) return;
//         await deleteProject();
//
//   2. The event manager, for call sites that only want to raise the question
//      and have no reference to this component:
//
//         slice.events.emit('confirm:request', { title: 'Discard draft?' });
//
// The Promise form is the better default: with a bare event plus callbacks,
// every call site juggles two async channels and a "did this already fire?"
// flag, and a caller that returns early leaves the event unfired. But an event
// channel is the right call when the emitter is far from the component that
// would own it - a deep save routine, a store subscriber, a keyboard shortcut.
// `confirm:request` covers that without giving up the promise.
//
// Build EXACTLY ONE and recover it with `slice.getComponent('ConfirmActionModal')`.
// Unlike a Service, a Visual component is not a singleton: a second instance
// would ALSO subscribe to `confirm:request` and both dialogs would open.
//
// THE INVARIANT: every ask()/prompt() resolves exactly once. A dialog that
// can be dismissed without settling would leave the awaiting caller hanging
// forever, so Escape, the backdrop, `open = false`, and a second question
// arriving while one is open all count as "cancelled" and go through
// _settle().
//
// Not a template component: it has no markup of its own. The Modal is built
// lazily on the first question, so an app that never confirms anything never
// pays for it.

const DEFAULTS = {
   confirmLabel: 'Confirm',
   cancelLabel: 'Cancel',
   confirmVariant: 'filled',
   eventName: 'confirm:request',
};

// Valid public Icon names. A destructive question must not look like a
// routine one, so the mark follows `danger` unless the caller overrides it.
const ICONS = {
   danger: 'exclamation-circle',
   neutral: 'question-circle',
};

export default class ConfirmActionModal extends HTMLElement {

   static props = {
      // Defaults for every question. Anything passed to the call wins.
      confirmLabel: { type: 'string', default: DEFAULTS.confirmLabel },
      cancelLabel: { type: 'string', default: DEFAULTS.cancelLabel },
      confirmVariant: { type: 'string', default: DEFAULTS.confirmVariant },

      // Namespace the event channel, so two independently-built modals in one
      // app (an admin override, a test harness) do not answer each other.
      eventName: { type: 'string', default: DEFAULTS.eventName },
   };

   constructor(props) {
      super();

      // Fields BEFORE setComponentProps, not after. The call below runs the
      // `eventName` setter, which reads `_channel` and `_subscribedChannel`;
      // declared afterwards they are `undefined` at that moment.
      this.$modal = null;
      this.$modalPromise = null;
      // $icon is the empty slot in the modal header, built with the Modal.
      this.$icon = null;
      this.$iconEl = null;
      this._iconName = null;
      // NOT `_eventName`: setComponentProps nulls that field for every declared
      // prop and applyDefaultProps writes the PROPERTY, so `this._eventName` is
      // null on every instance - which subscribed to a name nobody emits.
      this._channel = DEFAULTS.eventName;
      this._subId = null;
      this._subscribedChannel = null;
      this._pending = null;
      this._settled = true;

      slice.controller.setComponentProps(this, props);
   }

   init() {
      // `bind` needs a sliceId and registers the subscription for auto-cleanup
      // on destroy, so it cannot outlive the component.
      this.events = slice.events.bind(this);
      this._listen(this._channel);
   }

   _listen(channel) {
      this._subId = this.events.subscribe(channel, (payload) => this._fromEvent(payload));
      this._subscribedChannel = channel;
   }

   /**
    * The channel is read through an explicit accessor for the same reason
    * `Loading` needs one for `active`: setComponentProps nulls the derived
    * `_eventName` for every declared prop and then assigns to the PROPERTY,
    * so without this the value never reaches the field and the subscription
    * lands on a name nobody emits.
    */
   get eventName() { return this._channel; }
   set eventName(value) {
      const next = value || DEFAULTS.eventName;
      // Loose != null on purpose. setComponentProps runs this setter from the
      // CONSTRUCTOR, before the field assignments below, so `_subscribedChannel`
      // is `undefined` at that point. A strict `!== null` test read that as
      // "already live", took the re-subscribe branch, and called
      // unsubscribe(undefined, undefined) - which threw and made slice.build
      // return null for EVERY build of this component.
      const wasLive = this._subscribedChannel != null;
      const previous = this._channel;
      this._channel = next;

      // Setters run in the CONSTRUCTOR, before init(), when there is no
      // binding to re-point yet; init() subscribes to whatever is set by then.
      if (!wasLive || previous === next) return;

      // bind() exposes no unsubscribe, so go through the manager directly with
      // the id subscribe() handed back.
      slice.events.unsubscribe(previous, this._subId);
      this._listen(next);
   }

   beforeDestroy() {
      // Never leave a caller awaiting a dialog that no longer exists. Use the
      // same value a dismissal would give this question, so a caller cannot
      // tell "the component was destroyed" from "the user cancelled".
      this._settle(this._pending?.withInput ? null : false);
      this._destroyModal();
   }

   /**
    * Ask a yes/no question.
    * @returns {Promise<boolean>} true = confirmed, false = cancelled or dismissed
    */
   async ask(options = {}) {
      return (await this._present({ ...options, withInput: false })) === true;
   }

   /**
    * Ask for a single value.
    * @returns {Promise<string|null>} the value, or null if cancelled/dismissed
    */
   async prompt(options = {}) {
      return (await this._present({ ...options, withInput: true }));
   }

   /** True while a question is on screen. */
   get isOpen() {
      return this._pending !== null;
   }

   /**
    * The event-manager entry point. Supports both shapes on the same channel:
    * callbacks if the emitter supplied them, otherwise a fire-and-forget
    * question for a human to answer.
    */
   _fromEvent(payload = {}) {
      const { onConfirm, onCancel, ...options } = payload || {};

      // An `inputLabel` is what distinguishes a prompt from a yes/no, so an
      // event can request one without a separate channel.
      const withInput = !!options.inputLabel;
      const answer = withInput ? this.prompt(options) : this.ask(options);

      if (typeof onConfirm !== 'function' && typeof onCancel !== 'function') return;

      answer.then((value) => {
         const confirmed = withInput ? value !== null : value === true;
         if (confirmed) onConfirm?.(withInput ? value : undefined);
         else onCancel?.();
      });
   }

   async _present(options) {
      // A second question while one is open must settle the first as cancelled.
      // This AWAITS the real close rather than just requesting one, because
      // <dialog>'s close event is dispatched in a queued task: reopening
      // immediately would leave that stale event to land on the NEW question
      // and cancel it a moment after the user opened it.
      await this._closeModal();
      this._settle(null);

      await this._ensureModal();

      // Component-level defaults first, then per-call options. Reading the
      // DEFAULTS module object alone meant the confirmLabel/cancelLabel props
      // were documented and completely inert.
      const merged = {
         ...DEFAULTS,
         confirmLabel: this.confirmLabel,
         cancelLabel: this.cancelLabel,
         confirmVariant: this.confirmVariant,
         ...options,
      };
      const withInput = options.withInput === true;

      this._pending = { withInput };
      this._settled = false;
      // The resolver is installed BEFORE anything can settle, so no path can
      // resolve a promise nobody is holding yet.
      const done = new Promise((resolve) => {
         this._resolve = resolve;
      });

      this.$modal.title = merged.title || '';
      this.$message.textContent = merged.message || '';
      this.$message.hidden = !merged.message;

      this.$cancelBtn.value = merged.cancelLabel;
      this.$confirmBtn.value = merged.confirmLabel;
      // A destructive question must not look like a routine one.
      this.$confirmBtn.variant = merged.danger ? 'danger' : merged.confirmVariant;

      this.$field.hidden = !withInput;
      this.$fieldLabel.textContent = merged.inputLabel || '';
      if (withInput) {
         this.$input.type = merged.inputType || 'text';
         this.$input.placeholder = merged.inputPlaceholder || '';
         this.$input.required = merged.required === true;
         this.$input.value = merged.inputValue || '';
      }

      await this._setIcon(merged);

      // The Modal is built INSIDE this element, so a component that was never
      // appended cannot show anything: showModal() on a detached <dialog> is a
      // silent no-op. The promise would still settle, which makes it look like
      // the caller's button is dead rather than like a wiring mistake.
      if (!this.isConnected) {
         slice.logger.logWarning(
            this.sliceId,
            'ConfirmActionModal is not in the document, so its Modal cannot open. ' +
               'Append the component somewhere real (document.body is usual) before asking.'
         );
      }

      this.$modal.open = true;

      // showModal() claims focus for the dialog itself; for a prompt the field
      // is what the user has to fill in, so it takes focus instead.
      if (withInput) this.$input.focus();

      return done;
   }

   /** Swap the header mark. `false` / `''` / `null` hides it entirely. */
   async _setIcon({ danger, icon }) {
      // `icon === false` must mean "no mark", so the default cannot be reached
      // through `||`: `false || default` yields the default, and the documented
      // way to suppress the icon would silently do nothing.
      const name =
         icon === undefined || icon === null
            ? danger
               ? ICONS.danger
               : ICONS.neutral
            : icon || null;

      if (!name) {
         this._destroyIcon();
         return;
      }
      // Rebuilding an Icon to change nothing would leak the old one and flash
      // the mark out for a task, so an unchanged name is a no-op.
      if (this._iconName === name && this.$iconEl) return;

      this._destroyIcon();

      // No header slot means Modal's markup moved; degrade to "no icon"
      // rather than failing the whole question.
      if (!this.$icon) return;

      // Namespaced per instance. A fixed sliceId collides as soon as a page has two
      // modals - the docs page has exactly that - and slice.build returns null
      // on a duplicate, which then threw on `this.$iconEl.classList`.
      const iconId = `${this.sliceId || 'confirm-action-modal'}-icon-${name}`;
      this.$iconEl = await slice.build('Icon', {
         sliceId: iconId,
         name,
         size: '22px',
      });
      // Belt and braces: a duplicate sliceId still resolves to null rather
      // than throwing, and a missing mark must not fail the whole question.
      if (!this.$iconEl) return;
      this._iconName = name;
      this.$iconEl.classList.add('slice_confirm_action_modal__icon-mark');
      // An explicit class, because the danger and neutral marks are the same
      // element type - a :has() selector could not tell them apart.
      this.$icon.classList.toggle('is-danger', danger === true);
      // Danger reads through the danger token, everything else through the
      // page foreground. An attribute, because `color` is not an Icon prop.
      this.$iconEl.setAttribute(
         'style',
         `color: var(${danger ? '--danger-color' : '--font-primary-color'})`
      );
      this.$icon.hidden = false;
      this.$icon.appendChild(this.$iconEl);
   }

   /** Close the dialog and resolve once the browser has actually closed it. */
   async _closeModal() {
      if (!this.$modal) return;
      // The native `open` is the ground truth here, not the wrapper's cached
      // flag: a native close event arrives a task later, so the two disagree
      // in the window right after Escape.
      const dialog = this.$modal.querySelector('dialog');
      if (!dialog || !dialog.open) {
         if (this.$modal.open) this.$modal.open = false;
         return;
      }
      await new Promise((resolve) => {
         dialog.addEventListener('close', () => resolve(), { once: true });
         this.$modal.open = false;
      });
   }

   _settle(value) {
      if (this._settled) return;
      this._settled = true;
      const resolve = this._resolve;
      this._resolve = null;
      this._pending = null;
      if (resolve) resolve(value);
   }

   _handleConfirm() {
      if (this.$input && this._pending?.withInput) {
         // validateValue() both reports and paints the error, so a blocked
         // confirm leaves the user with something to act on.
         if (this.$input.validateValue() === false) return;
         const value = this.$input.value.trim();
         if (this.$input.required && !value) return;
         this._closeWith(value);
         return;
      }
      this._closeWith(true);
   }

   _handleCancel() {
      this._closeWith(this._pending?.withInput ? null : false);
   }

   _closeWith(value) {
      // Settle FIRST, then close. Modal.close() fires the native `close` event
      // synchronously, which runs onClose -> _handleClose -> _settle(cancel).
      // Settling first makes that second call a guarded no-op; the opposite
      // order would resolve EVERY confirmation as a cancellation.
      this._settle(value);
      if (this.$modal) this.$modal.open = false;
   }

   // Escape / backdrop / the X button / any programmatic close. An unresolved
   // question is a cancellation - never a silent hang.
   _handleClose() {
      this._settle(this._pending?.withInput ? null : false);
   }

   async _ensureModal() {
      if (!this.$modalPromise) this.$modalPromise = this._buildModal();
      await this.$modalPromise;
   }

   async _buildModal() {
      this.$modal = await slice.build('Modal', {
         dismissable: true,
         onClose: () => this._handleClose(),
      });
      this.$modal.classList.add('slice_confirm_action_modal');

      // Inside `this`, NOT document.body. A <dialog> opened with showModal()
      // renders in the top layer wherever it sits in the tree, so this costs
      // nothing - and it is what lets every style below stay scoped under
      // `slice-confirmactionmodal`. Appending to body put the modal outside
      // this element, which silently made the whole stylesheet dead.
      this.appendChild(this.$modal);

      // The mark sits in the modal's own header. Guarded because it couples
      // to a sibling component's class: if Modal's markup changes, the icon
      // degrades to "no icon" rather than throwing on every question.
      const header = this.$modal.querySelector('.slice-modal__header');
      if (header) {
         this.$icon = document.createElement('span');
         this.$icon.className = 'slice_confirm_action_modal__icon';
         this.$icon.hidden = true;
         header.prepend(this.$icon);
      }

      this.$message = document.createElement('p');
      this.$message.className = 'slice_confirm_action_modal__message';
      this.$message.hidden = true;
      this.$modal.appendBody(this.$message);

      this.$field = document.createElement('label');
      this.$field.className = 'slice_confirm_action_modal__field';
      this.$field.hidden = true;

      this.$fieldLabel = document.createElement('span');
      this.$fieldLabel.className = 'slice_confirm_action_modal__field-label';
      this.$field.appendChild(this.$fieldLabel);

      this.$input = await slice.build('Input');
      this.$input.addEventListener('keydown', (event) => {
         if (event.key !== 'Enter') return;
         // Otherwise the keypress reaches the dialog and can double-fire.
         event.preventDefault();
         event.stopPropagation();
         this._handleConfirm();
      });
      this.$field.appendChild(this.$input);
      this.$modal.appendBody(this.$field);

      this.$cancelBtn = await slice.build('Button', {
         variant: 'ghost',
         onClick: () => this._handleCancel(),
      });

      this.$confirmBtn = await slice.build('Button', {
         onClick: () => this._handleConfirm(),
      });

      // Cancel first: the safe action must not be the one a stray Enter hits.
      this.$modal.appendFooter(this.$cancelBtn);
      this.$modal.appendFooter(this.$confirmBtn);
   }

   _destroyIcon() {
      this._iconName = null;
      if (!this.$iconEl) return;
      slice.controller.destroyComponent(this.$iconEl);
      this.$iconEl = null;
      if (this.$icon) {
         this.$icon.hidden = true;
         this.$icon.replaceChildren();
      }
   }

   _destroyModal() {
      this._destroyIcon();
      if (!this.$modal) return;
      slice.controller.destroyComponent(this.$modal);
      this.$modal = null;
      this.$modalPromise = null;
   }
}

customElements.define('slice-confirmactionmodal', ConfirmActionModal);