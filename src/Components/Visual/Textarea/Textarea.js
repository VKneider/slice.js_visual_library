import { applySize, SIZE_VALUES } from '../../shared/props.js';
import {
   fieldId, validationMessage, compileConditions, countText,
   VALIDATE_ON, FIELD_VARIANTS, LABEL_PLACEMENTS,
} from '../../shared/validation/fieldRules.js';

// A multi-line text field: Input's sibling.
//
// It shares Input's field system on purpose: the same label (floating or
// above), variants, sizes, help / error line, counter, and the same
// validation (shared/validation/fieldRules.js), so a form of Inputs and Textareas reads and
// behaves as one. The floating label and the error shake use the same rules
// as Input, value for value (Textarea.spec.js holds them together).
//
// What is its own: rows, autoGrow (with maxRows as a ceiling), resize, and
// Ctrl/⌘+Enter as a submit key.
//
// Older API, still supported: `placeholder` alone is the floating label,
// `conditions`, validateValue(), triggerError(), triggerSuccess(), clear(),
// readonly, and the .slice_textarea / .textarea_area classes.

export default class Textarea extends HTMLElement {

   static props = {
      label: { type: 'string', default: '' },
      labelPlacement: { type: 'string', default: 'floating', allowedValues: ['floating', 'above'] },
      placeholder: { type: 'string', default: '', required: false },
      value: { type: 'string', default: '', required: false },
      name: { type: 'string', default: '' },
      rows: { type: 'number', default: 3 },
      maxRows: { type: 'number', default: null },
      minlength: { type: 'number', default: null },
      maxlength: { type: 'number', default: null },
      showCount: { type: 'boolean', default: false },
      autoGrow: { type: 'boolean', default: false },
      resize: { type: 'string', default: 'vertical', allowedValues: ['vertical', 'none', 'both', 'horizontal'] },
      size: { type: 'string', default: 'md', allowedValues: SIZE_VALUES },
      variant: { type: 'string', default: 'outlined', allowedValues: ['outlined', 'filled', 'ghost'] },
      help: { type: 'string', default: '' },
      error: { type: 'string', default: '' },
      invalid: { type: 'boolean', default: false },
      required: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      // Display-only content the user may select and copy but not edit.
      // `disabled` would take it out of the tab order and make it unselectable.
      readonly: { type: 'boolean', default: false },
      conditions: { type: 'object', default: null },
      conditionsMessage: { type: 'string', default: '' },
      validator: { type: 'function', default: null },
      messages: { type: 'object', default: null },
      validateOn: { type: 'string', default: 'blur', allowedValues: ['blur', 'input', 'manual'] },
      debounce: { type: 'number', default: 0 },
      ariaLabel: { type: 'string', default: '' },
      onChange: { type: 'function', default: null },
      // Ctrl+Enter (⌘+Enter on a Mac): (value, event).
      onSubmit: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$wrap = this.querySelector('.slice_textarea_wrap');
      this.$container = this.querySelector('.slice_textarea');
      this.$textarea = this.querySelector('textarea');
      this.$placeholder = this.querySelector('.slice_textarea_placeholder');
      this.$footer = this.querySelector('.slice_textarea_footer');
      this.$message = this.querySelector('.slice_textarea_message');
      this.$count = this.querySelector('.slice_textarea_count');

      const id = fieldId('slice-textarea');
      this.$textarea.id = id;
      this.$placeholder.htmlFor = id;
      this.$message.id = `${id}-message`;

      this._label = '';
      this._labelPlacement = 'floating';
      this._placeholder = '';
      this._rows = 3;
      this._maxRows = null;
      this._minlength = null;
      this._maxlength = null;
      this._showCount = false;
      this._autoGrow = false;
      this._resize = 'vertical';
      this._variant = 'outlined';
      this._help = '';
      this._error = '';
      this._invalid = false;
      this._required = false;
      this._disabled = false;
      this._readonly = false;
      this._conditionsTest = null;
      this._conditionsMessage = '';
      this._validator = null;
      this._messages = null;
      this._validateOn = 'blur';
      this._debounce = 0;
      this._ariaLabel = '';
      this._onChange = null;
      this._onSubmit = null;

      this._shownError = '';
      this._dirty = false;
      this._focused = false;
      this._debounceTimer = null;
      this._shakeTimer = null;

      this._handleInput = this._handleInput.bind(this);
      this._handleFocus = this._handleFocus.bind(this);
      this._handleBlur = this._handleBlur.bind(this);
      this._handleKeyDown = this._handleKeyDown.bind(this);
      this._handleContainerClick = this._handleContainerClick.bind(this);

      slice.controller.setComponentProps(this, props || {});
      this._syncLabel();
      this._syncResize();
      this._syncFooter();
   }

   init() {
      this.$textarea.addEventListener('input', this._handleInput);
      this.$textarea.addEventListener('focus', this._handleFocus);
      this.$textarea.addEventListener('blur', this._handleBlur);
      this.$textarea.addEventListener('keydown', this._handleKeyDown);
      this.$container.addEventListener('mousedown', this._handleContainerClick);
      this._syncFloat();
      if (this._autoGrow) this.grow();
   }

   // init() runs during slice.build(), BEFORE the parent appends the node, so
   // the first real measurement happens once the field is attached.
   connectedCallback() {
      if (this._autoGrow) this.grow();
   }

   beforeDestroy() {
      window.clearTimeout(this._debounceTimer);
      window.clearTimeout(this._shakeTimer);
      this._growObserver?.disconnect();
      this._growObserver = null;
      this.$textarea.removeEventListener('input', this._handleInput);
      this.$textarea.removeEventListener('focus', this._handleFocus);
      this.$textarea.removeEventListener('blur', this._handleBlur);
      this.$textarea.removeEventListener('keydown', this._handleKeyDown);
      this.$container.removeEventListener('mousedown', this._handleContainerClick);
   }

   // ── Public API ─────────────────────────────────────────────────

   focus(options) {
      this.$textarea.focus(options);
   }

   blur() {
      this.$textarea.blur();
   }

   select() {
      this.$textarea.select();
   }

   validate() {
      const message = this.validationMessage;
      this._showError(message);
      if (message) this._shake();
      return !message;
   }

   /** Older name for validate(). */
   validateValue() {
      return this.validate();
   }

   get validationMessage() {
      return validationMessage(this.$textarea.value, {
         required: this._required,
         element: /** @type {HTMLTextAreaElement} */ (this.$textarea),
         minlength: this._minlength,
         maxlength: this._maxlength,
         conditions: this._conditionsTest,
         conditionsMessage: this._conditionsMessage,
         validator: this._validator,
         messages: this._messages,
      });
   }

   // What the field says ON ITS OWN, while someone types or leaves it. An
   // empty field says nothing: "required" or "too short" on a field nobody
   // has written in yet is noise, and turning it red for that is a scolding.
   // Those are for validate(), which a form calls when someone tries to
   // submit, with the shake.
   _autoMessage() {
      return this.$textarea.value === '' ? '' : this.validationMessage;
   }

   get isValid() {
      return !this.validationMessage;
   }

   clear() {
      this.$textarea.value = '';
      this._dirty = false;
      this._showError('');
      this._syncFloat();
      this._syncCount();
      if (this._autoGrow) this.grow();
   }

   triggerError() {
      this._showError(this._shownError || this.validationMessage || ' ');
      this._shake();
   }

   triggerSuccess() {
      this._showError('');
   }

   /** Older API: re-run the state after the value changed from outside. */
   updateState() {
      this._syncFloat();
      this._syncCount();
      if (this._shownError) this._showError(this.validationMessage);
   }

   grow() {
      // A detached (or display:none) field has no layout, so scrollHeight is 0
      // there. Bail instead of writing a 0px height that collapses the field.
      if (!this.isConnected || !this._autoGrow) return;
      this._observeGrow();
      const previous = this.$textarea.style.height;
      this.$textarea.style.height = 'auto';
      const h = this.$textarea.scrollHeight;
      if (!h) {
         // Hidden field: keep the last good height and re-measure when visible.
         this.$textarea.style.height = previous;
         this._growPending = true;
         return;
      }
      this._growPending = false;
      const cap = this._maxHeight();
      this.$textarea.style.height = `${cap ? Math.min(h, cap) : h}px`;
      this.$textarea.style.overflowY = cap && h > cap ? 'auto' : 'hidden';
   }

   // ── Props ──────────────────────────────────────────────────────

   get label() { return this._label; }
   set label(value) {
      this._label = typeof value === 'string' ? value : '';
      this._syncLabel();
   }

   get labelPlacement() { return this._labelPlacement; }
   set labelPlacement(value) {
      this._labelPlacement = LABEL_PLACEMENTS.includes(value) ? value : 'floating';
      this._syncLabel();
   }

   get placeholder() { return this._placeholder; }
   set placeholder(value) {
      this._placeholder = typeof value === 'string' ? value : '';
      this._syncLabel();
   }

   get value() { return this.$textarea.value; }
   set value(newValue) {
      this.$textarea.value = newValue === null || newValue === undefined ? '' : String(newValue);
      this.updateState();
      if (this._autoGrow) this.grow();
   }

   get name() { return this.$textarea.name; }
   set name(value) {
      if (value) this.$textarea.name = String(value);
      else this.$textarea.removeAttribute('name');
   }

   get rows() { return this._rows; }
   set rows(value) {
      const n = Number(value);
      this._rows = Number.isFinite(n) && n > 0 ? n : 3;
      this.$textarea.rows = this._rows;
      if (this._autoGrow) this.grow();
   }

   get maxRows() { return this._maxRows; }
   set maxRows(value) {
      const n = Number(value);
      this._maxRows = value !== null && value !== undefined && Number.isFinite(n) && n > 0 ? n : null;
      if (this._autoGrow) this.grow();
   }

   get minlength() { return this._minlength; }
   set minlength(value) {
      const n = Number(value);
      this._minlength = value !== null && value !== undefined && Number.isFinite(n) && n > 0 ? n : null;
   }

   get maxlength() { return this._maxlength; }
   set maxlength(value) {
      const n = Number(value);
      this._maxlength = value !== null && value !== undefined && Number.isFinite(n) && n > 0 ? n : null;
      if (this._maxlength) this.$textarea.maxLength = this._maxlength;
      else this.$textarea.removeAttribute('maxlength');
      this._syncCount();
   }

   get showCount() { return this._showCount; }
   set showCount(value) {
      this._showCount = value === true;
      this._syncCount();
   }

   get autoGrow() { return this._autoGrow; }
   set autoGrow(value) {
      this._autoGrow = value === true;
      this._syncResize();
      if (this._autoGrow) this.grow();
      else {
         this.$textarea.style.height = '';
         this.$textarea.style.overflowY = '';
      }
   }

   get resize() { return this._resize; }
   set resize(value) {
      this._resize = ['vertical', 'none', 'both', 'horizontal'].includes(value) ? value : 'vertical';
      this._syncResize();
   }

   get size() { return this._size; }
   set size(value) {
      this._size = applySize(this, value, 'md');
   }

   get variant() { return this._variant; }
   set variant(value) {
      this._variant = FIELD_VARIANTS.includes(value) ? value : 'outlined';
      this.dataset.variant = this._variant;
   }

   get help() { return this._help; }
   set help(value) {
      this._help = value ? String(value) : '';
      this._syncFooter();
   }

   get error() { return this._error; }
   set error(value) {
      this._error = value ? String(value) : '';
      this._syncFooter();
   }

   get invalid() { return this._invalid; }
   set invalid(value) {
      this._invalid = value === true;
      this._syncFooter();
   }

   get required() { return this._required; }
   set required(value) {
      this._required = value === true;
      this.$textarea.required = this._required;
      // Kept for compatibility: it marks the field, it no longer paints it red.
      this.$container.classList.toggle('required', this._required);
      this.classList.toggle('slice_textarea--required', this._required);
   }

   get disabled() { return this._disabled; }
   set disabled(value) {
      this._disabled = value === true;
      this.$textarea.disabled = this._disabled;
      this.$container.classList.toggle('disabled', this._disabled);
   }

   get readonly() { return this._readonly; }
   set readonly(value) {
      this._readonly = value === true;
      this.$textarea.readOnly = this._readonly;
      this.$container.classList.toggle('readonly', this._readonly);
   }

   get conditions() { return this._conditions; }
   set conditions(value) {
      this._conditions = value || null;
      this._conditionsTest = compileConditions(this._conditions);
   }

   setupConditions() {
      this._conditionsTest = compileConditions(this._conditions);
   }

   get conditionsMessage() { return this._conditionsMessage; }
   set conditionsMessage(value) { this._conditionsMessage = value ? String(value) : ''; }

   get validator() { return this._validator; }
   set validator(value) { this._validator = typeof value === 'function' ? value : null; }

   get messages() { return this._messages; }
   set messages(value) { this._messages = value && typeof value === 'object' ? value : null; }

   get validateOn() { return this._validateOn; }
   set validateOn(value) { this._validateOn = VALIDATE_ON.includes(value) ? value : 'blur'; }

   get debounce() { return this._debounce; }
   set debounce(value) {
      const n = Number(value);
      this._debounce = Number.isFinite(n) && n > 0 ? n : 0;
   }

   get ariaLabel() { return this._ariaLabel; }
   set ariaLabel(value) {
      this._ariaLabel = typeof value === 'string' ? value : '';
      this._syncLabel();
   }

   get onChange() { return this._onChange; }
   set onChange(fn) { this._onChange = typeof fn === 'function' ? fn : null; }

   get onSubmit() { return this._onSubmit; }
   set onSubmit(fn) { this._onSubmit = typeof fn === 'function' ? fn : null; }

   // ── Rendering ──────────────────────────────────────────────────

   // Same rules as Input._syncLabel(): see there.
   _syncLabel() {
      if (!this.$placeholder) return;
      const floating = this._labelPlacement === 'floating';
      const legacy = !this._label && floating && !!this._placeholder;
      const text = this._label || (legacy ? this._placeholder : '');

      this.$placeholder.textContent = text;
      this.$placeholder.hidden = !text;
      this.$textarea.placeholder = legacy ? '' : this._placeholder;

      if (floating && this.$placeholder.parentNode !== this.$container) {
         this.$container.prepend(this.$placeholder);
      } else if (!floating && this.$placeholder.parentNode !== this.$wrap) {
         this.$wrap.prepend(this.$placeholder);
      }
      this.dataset.labelPlacement = this._labelPlacement;
      this.classList.toggle('slice_textarea--labelled', !!text);

      const name = text || this._ariaLabel;
      if (name) this.$textarea.setAttribute('aria-label', name);
      else this.$textarea.removeAttribute('aria-label');
      this._syncFloat();
   }

   _syncFloat() {
      if (!this.$placeholder) return;
      const hasValue = this.$textarea.value !== '';
      this.$placeholder.classList.toggle('slice_textarea_value', hasValue);
      this.$placeholder.classList.toggle('slice_textarea_focus', this._focused);
      this.classList.toggle('slice_textarea--filled', hasValue);
   }

   _syncResize() {
      if (!this.$textarea) return;
      this.$textarea.style.resize = this._autoGrow ? 'none' : this._resize;
   }

   _syncCount() {
      if (!this.$count) return;
      this.$count.hidden = !this._showCount;
      if (this._showCount) this.$count.textContent = countText(this.$textarea.value, this._maxlength);
      this._syncFooter();
   }

   _syncFooter() {
      if (!this.$message) return;
      const error = this._error || this._shownError.trim();
      const text = error || this._help;
      this.$message.textContent = text;
      this.$message.classList.toggle('slice_textarea_message--error', !!error);
      this.$footer.hidden = !text && !this._showCount;

      const invalid = !!(this._error || this._shownError || this._invalid);
      this.classList.toggle('slice_textarea--invalid', invalid);
      this.$container.classList.toggle('is-invalid', invalid);
      this.$textarea.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      if (text) this.$textarea.setAttribute('aria-describedby', this.$message.id);
      else this.$textarea.removeAttribute('aria-describedby');
   }

   _showError(message) {
      this._shownError = message || '';
      this._syncFooter();
   }

   _shake() {
      this.$container.classList.remove('error');
      void this.$container.offsetWidth;
      this.$container.classList.add('error');
      window.clearTimeout(this._shakeTimer);
      this._shakeTimer = window.setTimeout(() => this.$container.classList.remove('error'), 500);
   }

   _maxHeight() {
      if (!this._maxRows) return 0;
      const cs = getComputedStyle(this.$textarea);
      const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.45;
      return Math.round(line * this._maxRows + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
   }

   // Re-measure when the width changes (text re-wraps) or when the field comes
   // back from display:none. Watches the WIDTH only, so it ignores the height
   // changes grow() itself causes.
   _observeGrow() {
      if (this._growObserver || typeof ResizeObserver === 'undefined') return;
      this._growWidth = 0;
      this._growObserver = new ResizeObserver((entries) => {
         const width = entries[0]?.contentRect?.width ?? 0;
         if (!width) return;
         if (width !== this._growWidth || this._growPending) {
            this._growWidth = width;
            this.grow();
         }
      });
      this._growObserver.observe(this.$textarea);
   }

   // ── Events ─────────────────────────────────────────────────────

   _handleInput() {
      this._dirty = true;
      this._syncFloat();
      this._syncCount();
      if (this._autoGrow) this.grow();
      if (this._validateOn === 'input' || this._shownError) {
         this._showError(this._autoMessage());
      }
      if (typeof this._onChange !== 'function') return;
      if (!this._debounce) {
         this._onChange(this.$textarea.value);
         return;
      }
      window.clearTimeout(this._debounceTimer);
      this._debounceTimer = window.setTimeout(() => {
         if (typeof this._onChange === 'function') this._onChange(this.$textarea.value);
      }, this._debounce);
   }

   _handleFocus() {
      this._focused = true;
      this.classList.add('slice_textarea--focused');
      this._syncFloat();
   }

   _handleBlur() {
      this._focused = false;
      this.classList.remove('slice_textarea--focused');
      this._syncFloat();
      if (this._validateOn !== 'manual' && (this._dirty || this.$textarea.value !== '')) {
         this._showError(this._autoMessage());
      }
   }

   _handleKeyDown(event) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && typeof this._onSubmit === 'function') {
         event.preventDefault();
         this._onSubmit(this.$textarea.value, event);
      }
   }

   _handleContainerClick(event) {
      if (event.target === this.$textarea) return;
      event.preventDefault();
      if (!this._disabled) this.$textarea.focus();
   }
}

customElements.define('slice-textarea', Textarea);