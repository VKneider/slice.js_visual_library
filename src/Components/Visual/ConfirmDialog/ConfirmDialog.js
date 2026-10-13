// A "are you sure?" dialog, and the prompt variant with a single text field.
//
// Built on `Modal`, so scroll-lock, focus handling, Escape and backdrop
// dismissal are already solved — this only owns the copy, the two buttons, and
// the promise.
//
// API is promise-based on purpose. The obvious alternative is a global event
// (`confirm:request`) plus callbacks, but then every caller has to juggle two
// async channels and a "did this already fire?" flag. With a promise the
// control flow is linear and impossible to get wrong:
//
//   if (!await confirm.ask({ title: 'Delete project?', danger: true })) return;
//
// THE INVARIANT: every `ask()`/`prompt()` resolves exactly once. A dialog that
// can be dismissed without settling would leave the awaiting caller hanging
// forever, so Escape, the backdrop, `open = false` and a second `ask()` while
// one is open all count as "cancelled" and go through _settle().
//
// Not a template component: it has no markup of its own. The Modal is built
// lazily on first use, so an app that never confirms anything never pays for
// it.

const DEFAULTS = {
   confirmLabel: 'Confirm',
   cancelLabel: 'Cancel',
   confirmVariant: 'filled',
};

export default class ConfirmDialog extends HTMLElement {

   static props = {
      // Defaults for every ask()/prompt(). Anything passed to the call wins.
      confirmLabel: { type: 'string', default: DEFAULTS.confirmLabel },
      cancelLabel: { type: 'string', default: DEFAULTS.cancelLabel },
      confirmVariant: { type: 'string', default: DEFAULTS.confirmVariant },
   };

   constructor(props) {
      super();
      slice.controller.setComponentProps(this, props);

      this.$modal = null;
      this.$modalPromise = null;
      this.$input = null;
      this._pending = null;
      this._settled = true;
   }

   beforeDestroy() {
      // Never leave a caller awaiting a dialog that no longer exists. Use the
      // same value a dismissal would give this question, so a caller cannot
      // tell "the component was destroyed" from "the user cancelled".
      this._settle(this._pending?.withInput ? null : false);
      if (this.$modal) {
         slice.controller.destroyComponent(this.$modal);
         this.$modal = null;
         this.$modalPromise = null;
      }
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

   /** True while a dialog is on screen. */
   get isOpen() {
      return this._pending !== null;
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

      const merged = { ...DEFAULTS, ...options };
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

      this.$modal.open = true;

      // showModal() claims focus for the dialog itself; for a prompt the field
      // is what the user has to fill in, so it takes focus instead.
      if (withInput) this.$input.focus();

      return done;
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
   // question is a cancellation — never a silent hang.
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
      this.$modal.classList.add('slice_confirm_dialog');
      document.body.appendChild(this.$modal);

      this.$message = document.createElement('p');
      this.$message.className = 'slice_confirm_dialog__message';
      this.$message.hidden = true;
      this.$modal.appendBody(this.$message);

      this.$field = document.createElement('label');
      this.$field.className = 'slice_confirm_dialog__field';
      this.$field.hidden = true;

      this.$fieldLabel = document.createElement('span');
      this.$fieldLabel.className = 'slice_confirm_dialog__field-label';
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

   async _ensureInput() {
      if (this.$input) return;
      await this._buildModal();
   }
}

customElements.define('slice-confirmdialog', ConfirmDialog);
