import {
   normalize, todayISO, parseISO, toISO, addDays, addMonths, addYears, compare, clamp,
   startOfWeek, monthGrid, weekStartFor, numericPattern, formatNumeric, formatDate,
   parseTyped, parseTypedRange, monthNames, weekdayNames, daysBetween,
} from './dates.js';
import { DEFAULT_MESSAGES } from '../../shared/validation/fieldRules.js';

// A date field with a calendar.
//
// The field is the same system as Input (label floating or above, variants
// outlined | filled | ghost, sizes sm | md | lg, help and error under it, a
// clear button), and it follows the same rule for errors: an empty field is
// never flagged on its own; required waits for validate().
//
// People can type the date (in their locale's order: 21/10/2026 in es-VE,
// 10/21/2026 in en-US, or ISO) or pick it from the calendar:
//   - a month view with a header that opens a month and a year view;
//   - mode: 'range' picks a start and an end, previewing the range under the
//     pointer; months: 2 shows two months side by side;
//   - min, max, disabledDates (a list, or a function) and disableWeekends;
//   - presets ("Today", "Last 7 days") beside the calendar;
//   - inline: the calendar on the page, without a field.
//
// The value is ISO text ("2026-10-21"), never a Date: a picked day is a day on
// a calendar, and turning it into an instant is how pickers end up a day off.
// In range mode it is { start, end }. `valueAsDate` gives Dates when needed.
//
// Keyboard (the WAI-ARIA date grid): arrows move a day / a week, PageUp /
// PageDown a month (with Shift, a year), Home / End the week, Enter or Space
// picks, Escape closes. In the field, ↓ or Alt+↓ opens the calendar.

const MENU_GAP = 6;
const VIEWPORT_MARGIN = 8;

const DP_MESSAGES = {
   required: DEFAULT_MESSAGES.required,
   invalid: 'Enter a valid date',
   min: 'Pick a date on or after {min}',
   max: 'Pick a date on or before {max}',
   disabled: 'That date is not available',
   incomplete: 'Pick an end date',
   order: 'The end date is before the start date',
};

// Every word the calendar shows or announces, so it can speak the page's
// language: pass `texts` with any of these keys. {n}, {month} and {year} are
// filled in.
const DP_TEXTS = {
   today: 'Today',
   clear: 'Clear',
   chooseDate: 'Choose date',
   clearDate: 'Clear date',
   calendar: 'Choose a date',
   previousMonth: 'Previous month',
   nextMonth: 'Next month',
   previousYear: 'Previous year',
   nextYear: 'Next year',
   previousYears: 'Previous years',
   nextYears: 'Next years',
   chooseMonth: '{month}, choose a month',
   chooseYear: '{year}, choose a year',
   pickStart: 'Pick a start date',
   pickEnd: 'Pick an end date',
   days: '{n} days',
   quickPicks: 'Quick picks',
};

let uid = 0;

function fill(template, values) {
   return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

export default class DatePicker extends HTMLElement {
   static props = {
      value: { type: 'any', default: '' },
      mode: { type: 'string', default: 'single', allowedValues: ['single', 'range'] },
      label: { type: 'string', default: '' },
      labelPlacement: { type: 'string', default: 'floating', allowedValues: ['floating', 'above'] },
      placeholder: { type: 'string', default: '' },
      help: { type: 'string', default: '' },
      error: { type: 'string', default: '' },
      invalid: { type: 'boolean', default: false },
      required: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      readonly: { type: 'boolean', default: false },
      clearable: { type: 'boolean', default: true },
      size: { type: 'string', default: 'md', allowedValues: ['sm', 'md', 'lg'] },
      variant: { type: 'string', default: 'outlined', allowedValues: ['outlined', 'filled', 'ghost'] },
      min: { type: 'any', default: '' },
      max: { type: 'any', default: '' },
      disabledDates: { type: 'any', default: null },
      disableWeekends: { type: 'boolean', default: false },
      locale: { type: 'string', default: '' },
      weekStartsOn: { type: 'number', default: null },
      format: { type: 'object', default: null },
      months: { type: 'number', default: 1 },
      presets: { type: 'array', default: [] },
      inline: { type: 'boolean', default: false },
      closeOnSelect: { type: 'boolean', default: true },
      showToday: { type: 'boolean', default: true },
      name: { type: 'string', default: '' },
      ariaLabel: { type: 'string', default: '' },
      messages: { type: 'object', default: null },
      texts: { type: 'object', default: null },
      validateOn: { type: 'string', default: 'blur', allowedValues: ['blur', 'manual'] },
      onChange: { type: 'function', default: null },
      onOpenChange: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$wrap = this.querySelector('.slice_datepicker_wrap');
      this.$field = this.querySelector('.slice_datepicker_field');
      this.$label = this.querySelector('.slice_datepicker_label');
      this.$input = this.querySelector('.slice_datepicker_input');
      this.$clear = this.querySelector('.slice_datepicker_clear');
      this.$toggle = this.querySelector('.slice_datepicker_toggle');
      this.$footer = this.querySelector('.slice_datepicker_footer');
      this.$message = this.querySelector('.slice_datepicker_message');
      this.$popup = this.querySelector('.slice_datepicker_popup');
      this.$hidden = this.querySelector('.slice_datepicker_hidden');

      const id = `slice-datepicker-${++uid}`;
      this.$input.id = id;
      this.$label.htmlFor = id;
      this.$message.id = `${id}-message`;
      this.$popup.id = `${id}-popup`;
      this.$input.setAttribute('aria-controls', this.$popup.id);

      this._mode = 'single';
      this._start = '';          // the value, or the start of a range
      this._end = '';            // the end of a range
      this._label = '';
      this._labelPlacement = 'floating';
      this._placeholder = '';
      this._help = '';
      this._error = '';
      this._invalid = false;
      this._required = false;
      this._disabled = false;
      this._readonly = false;
      this._clearable = true;
      this._variant = 'outlined';
      this._size = 'md';
      this._min = '';
      this._max = '';
      this._disabledDates = null;
      this._disableWeekends = false;
      this._locale = '';
      this._weekStartsOn = null;
      this._format = null;
      this._months = 1;
      this._presets = [];
      this._inline = false;
      this._closeOnSelect = true;
      this._showToday = true;
      this._messages = null;
      this._validateOn = 'blur';
      this._onChange = null;
      this._onOpenChange = null;

      this._open = false;
      this._view = 'days';       // days | months | years
      this._cursor = '';         // the day the keyboard is on
      this._viewMonth = '';      // first day of the first month shown
      this._hover = '';          // range preview end
      this._typed = null;        // text being edited, null when not editing
      this._focused = false;
      this._dirty = false;
      this._shownError = '';
      this._shakeTimer = null;

      this._handleInput = this._handleInput.bind(this);
      this._handleFocus = this._handleFocus.bind(this);
      this._handleFocusOut = this._handleFocusOut.bind(this);
      this._handlePopupPointerDown = this._handlePopupPointerDown.bind(this);
      this._handleFieldKeyDown = this._handleFieldKeyDown.bind(this);
      this._handleFieldPointerDown = this._handleFieldPointerDown.bind(this);
      this._handleToggle = this._handleToggle.bind(this);
      this._handleClear = this._handleClear.bind(this);
      this._handlePopupClick = this._handlePopupClick.bind(this);
      this._handlePopupKeyDown = this._handlePopupKeyDown.bind(this);
      this._handlePopupOver = this._handlePopupOver.bind(this);
      this._handleOutsidePointer = this._handleOutsidePointer.bind(this);
      this._handleViewport = this._handleViewport.bind(this);

      slice.controller.setComponentProps(this, props || {});
      this._syncLabel();
      this._syncText();
      this._syncFooter();
   }

   init() {
      this.$input.addEventListener('input', this._handleInput);
      this.$input.addEventListener('focus', this._handleFocus);
      this.addEventListener('focusout', this._handleFocusOut);
      this.$input.addEventListener('keydown', this._handleFieldKeyDown);
      this.$field.addEventListener('pointerdown', this._handleFieldPointerDown);
      this.$toggle.addEventListener('click', this._handleToggle);
      this.$clear.addEventListener('click', this._handleClear);
      this.$popup.addEventListener('click', this._handlePopupClick);
      this.$popup.addEventListener('keydown', this._handlePopupKeyDown);
      this.$popup.addEventListener('pointerover', this._handlePopupOver);
      this.$popup.addEventListener('pointerdown', this._handlePopupPointerDown);
      this._syncInline();
   }

   beforeDestroy() {
      this._setOpen(false, { silent: true });
      window.clearTimeout(this._shakeTimer);
      this.$input.removeEventListener('input', this._handleInput);
      this.$input.removeEventListener('focus', this._handleFocus);
      this.removeEventListener('focusout', this._handleFocusOut);
      this.$input.removeEventListener('keydown', this._handleFieldKeyDown);
      this.$field.removeEventListener('pointerdown', this._handleFieldPointerDown);
      this.$toggle.removeEventListener('click', this._handleToggle);
      this.$clear.removeEventListener('click', this._handleClear);
      this.$popup.removeEventListener('click', this._handlePopupClick);
      this.$popup.removeEventListener('keydown', this._handlePopupKeyDown);
      this.$popup.removeEventListener('pointerover', this._handlePopupOver);
      this.$popup.removeEventListener('pointerdown', this._handlePopupPointerDown);
      this._toggleDocumentListeners(false);
   }

   // ── Value ──────────────────────────────────────────────────────

   /** ISO date ('' when empty); in range mode { start, end }. */
   get value() {
      return this._mode === 'range' ? { start: this._start, end: this._end } : this._start;
   }

   set value(value) {
      this._assign(value);
      this._typed = null;
      this._syncText();
      this._syncHidden();
      if (this._shownError) this._showError(this.validationMessage);
      if (this._open || this._inline) this._render();
   }

   /** The value as local Dates (midnight): a Date or null; in range mode [start, end]. */
   get valueAsDate() {
      const toDate = (iso) => {
         const p = parseISO(iso);
         return p ? new Date(p.y, p.m - 1, p.d) : null;
      };
      return this._mode === 'range' ? [toDate(this._start), toDate(this._end)] : toDate(this._start);
   }

   _assign(value) {
      if (this._mode === 'range') {
         let start = '';
         let end = '';
         if (Array.isArray(value)) [start, end] = value;
         else if (value && typeof value === 'object' && !(value instanceof Date)) ({ start, end } = value);
         else if (typeof value === 'string' && value.includes('/')) [start, end] = value.split('/');
         this._start = normalize(start);
         this._end = normalize(end);
         if (this._start && this._end && this._end < this._start) [this._start, this._end] = [this._end, this._start];
      } else {
         this._start = normalize(Array.isArray(value) ? value[0] : value);
         this._end = '';
      }
   }

   // ── Props ──────────────────────────────────────────────────────

   get mode() { return this._mode; }
   set mode(value) {
      const current = this.value;
      this._mode = value === 'range' ? 'range' : 'single';
      this.dataset.mode = this._mode;
      this._assign(current);
      this._syncText();
      this._syncHidden();
      if (this._open || this._inline) this._render();
   }

   get label() { return this._label; }
   set label(value) { this._label = typeof value === 'string' ? value : ''; this._syncLabel(); }

   get labelPlacement() { return this._labelPlacement; }
   set labelPlacement(value) { this._labelPlacement = value === 'above' ? 'above' : 'floating'; this._syncLabel(); }

   get placeholder() { return this._placeholder; }
   set placeholder(value) { this._placeholder = typeof value === 'string' ? value : ''; this._syncText(); }

   get help() { return this._help; }
   set help(value) { this._help = value ? String(value) : ''; this._syncFooter(); }

   get error() { return this._error; }
   set error(value) { this._error = value ? String(value) : ''; this._syncFooter(); }

   get invalid() { return this._invalid; }
   set invalid(value) { this._invalid = value === true; this._syncFooter(); }

   get required() { return this._required; }
   set required(value) {
      this._required = value === true;
      this.$input.setAttribute('aria-required', String(this._required));
      this.classList.toggle('slice_datepicker--required', this._required);
   }

   get disabled() { return this._disabled; }
   set disabled(value) {
      this._disabled = value === true;
      this.$input.disabled = this._disabled;
      this.$toggle.disabled = this._disabled;
      this.$field.classList.toggle('is-disabled', this._disabled);
      if (this._disabled) this._setOpen(false);
      this._syncClear();
   }

   get readonly() { return this._readonly; }
   set readonly(value) {
      this._readonly = value === true;
      this.$input.readOnly = this._readonly;
      this.$field.classList.toggle('is-readonly', this._readonly);
      this._syncClear();
   }

   get clearable() { return this._clearable; }
   set clearable(value) { this._clearable = value !== false; this._syncClear(); }

   get size() { return this._size; }
   set size(value) { this._size = ['sm', 'md', 'lg'].includes(value) ? value : 'md'; this.dataset.size = this._size; }

   get variant() { return this._variant; }
   set variant(value) {
      this._variant = ['outlined', 'filled', 'ghost'].includes(value) ? value : 'outlined';
      this.dataset.variant = this._variant;
   }

   get min() { return this._min; }
   set min(value) { this._min = value === 'today' ? todayISO() : normalize(value); this._refreshIfShown(); }

   get max() { return this._max; }
   set max(value) { this._max = value === 'today' ? todayISO() : normalize(value); this._refreshIfShown(); }

   get disabledDates() { return this._disabledDates; }
   set disabledDates(value) {
      if (typeof value === 'function') this._disabledDates = value;
      else if (Array.isArray(value)) this._disabledDates = new Set(value.map(normalize).filter(Boolean));
      else this._disabledDates = null;
      this._refreshIfShown();
   }

   get disableWeekends() { return this._disableWeekends; }
   set disableWeekends(value) { this._disableWeekends = value === true; this._refreshIfShown(); }

   get locale() { return this._locale || this._defaultLocale(); }
   set locale(value) { this._locale = typeof value === 'string' ? value : ''; this._syncText(); this._refreshIfShown(); }

   get weekStartsOn() { return this._weekStartsOn ?? weekStartFor(this.locale); }
   set weekStartsOn(value) {
      const n = Number(value);
      this._weekStartsOn = value === null || value === undefined || !Number.isInteger(n) ? null : ((n % 7) + 7) % 7;
      this._refreshIfShown();
   }

   get format() { return this._format; }
   set format(value) { this._format = value && typeof value === 'object' ? value : null; this._syncText(); }

   get months() { return this._months; }
   set months(value) { this._months = Number(value) === 2 ? 2 : 1; this._refreshIfShown(); }

   get presets() { return this._presets; }
   set presets(value) { this._presets = Array.isArray(value) ? value : []; this._refreshIfShown(); }

   get inline() { return this._inline; }
   set inline(value) { this._inline = value === true; this._syncInline(); }

   get closeOnSelect() { return this._closeOnSelect; }
   set closeOnSelect(value) { this._closeOnSelect = value !== false; }

   get showToday() { return this._showToday; }
   set showToday(value) { this._showToday = value !== false; this._refreshIfShown(); }

   get name() { return this.$hidden.name; }
   set name(value) {
      if (value) this.$hidden.name = String(value);
      else this.$hidden.removeAttribute('name');
   }

   get ariaLabel() { return this._ariaLabel || ''; }
   set ariaLabel(value) { this._ariaLabel = typeof value === 'string' ? value : ''; this._syncLabel(); }

   get messages() { return this._messages; }
   set messages(value) { this._messages = value && typeof value === 'object' ? value : null; }

   get texts() { return this._texts || null; }
   set texts(value) {
      this._texts = value && typeof value === 'object' ? value : null;
      if (this.$clear) {
         this.$clear.setAttribute('aria-label', this._t('clearDate'));
         this.$toggle.setAttribute('aria-label', this._t('chooseDate'));
         this._syncLabel();
      }
      this._refreshIfShown();
   }

   _t(key, values = {}) {
      const template = (this._texts && this._texts[key]) ?? DP_TEXTS[key];
      return fill(template, values);
   }

   get validateOn() { return this._validateOn; }
   set validateOn(value) { this._validateOn = value === 'manual' ? 'manual' : 'blur'; }

   get onChange() { return this._onChange; }
   set onChange(value) { this._onChange = typeof value === 'function' ? value : null; }

   get onOpenChange() { return this._onOpenChange; }
   set onOpenChange(value) { this._onOpenChange = typeof value === 'function' ? value : null; }

   get isOpen() { return this._open; }

   // ── Public API ─────────────────────────────────────────────────

   open() { this._setOpen(true, { focusGrid: false }); }
   close() { this._setOpen(false); }
   toggle() { this._setOpen(!this._open, { focusGrid: false }); }
   focus(options) { this.$input.focus(options); }

   clear() {
      this._commit('', '');
      this._dirty = false;
      this._showError('');
   }

   /** Is a day selectable? */
   isDateDisabled(value) {
      const iso = normalize(value);
      if (!iso) return true;
      if (this._min && iso < this._min) return true;
      if (this._max && iso > this._max) return true;
      if (this._disableWeekends) {
         const p = parseISO(iso);
         const day = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
         if (day === 0 || day === 6) return true;
      }
      if (this._disabledDates instanceof Set) return this._disabledDates.has(iso);
      if (typeof this._disabledDates === 'function') {
         const p = parseISO(iso);
         return this._disabledDates(iso, new Date(p.y, p.m - 1, p.d)) === true;
      }
      return false;
   }

   validate() {
      this._commitTyped();
      const message = this.validationMessage;
      this._showError(message);
      if (message) this._shake();
      return !message;
   }

   get validationMessage() {
      const messages = { ...DP_MESSAGES, ...(this._messages || {}) };
      if (this._typed !== null && this._typed.trim() !== '' && !this._parseTyped(this._typed)) return messages.invalid;
      const empty = !this._start && !this._end;
      if (empty) return this._required ? messages.required : '';
      const fmt = (iso) => formatDate(iso, this.locale, this._format);
      for (const iso of [this._start, this._end].filter(Boolean)) {
         if (this._min && iso < this._min) return fill(messages.min, { min: fmt(this._min) });
         if (this._max && iso > this._max) return fill(messages.max, { max: fmt(this._max) });
         if (this.isDateDisabled(iso)) return messages.disabled;
      }
      if (this._mode === 'range') {
         if (!this._end || !this._start) return messages.incomplete;
         if (this._end < this._start) return messages.order;
      }
      return '';
   }

   get isValid() { return !this.validationMessage; }

   // ── Text in the field ──────────────────────────────────────────

   _defaultLocale() {
      return document.documentElement.lang || navigator.language || 'en-US';
   }

   _parseTyped(text) {
      if (this._mode === 'range') return parseTypedRange(text, this.locale);
      return parseTyped(text, this.locale);
   }

   // Shown while the field is not being edited: the readable form
   // ("21 oct 2026"). While editing: the numeric form people type.
   _displayText() {
      const fmt = (iso) => formatDate(iso, this.locale, this._format);
      if (this._mode === 'range') {
         if (!this._start && !this._end) return '';
         return `${this._start ? fmt(this._start) : '…'} – ${this._end ? fmt(this._end) : '…'}`;
      }
      return this._start ? fmt(this._start) : '';
   }

   _editText() {
      const num = (iso) => (iso ? formatNumeric(iso, this.locale) : '');
      if (this._mode === 'range') return this._start || this._end ? `${num(this._start)} – ${num(this._end)}` : '';
      return num(this._start);
   }

   _pattern() {
      const one = numericPattern(this.locale);
      return this._mode === 'range' ? `${one} – ${one}` : one;
   }

   _syncText() {
      if (!this.$input) return;
      if (this._typed === null) this.$input.value = this._focused ? this._editText() : this._displayText();
      this.$input.placeholder = this._focused ? (this._placeholder || this._pattern()) : (this._label ? '' : this._placeholder || this._pattern());
      this._syncFloat();
      this._syncClear();
   }

   _syncHidden() {
      if (!this.$hidden) return;
      this.$hidden.value = this._mode === 'range'
         ? (this._start && this._end ? `${this._start}/${this._end}` : '')
         : this._start;
   }

   _syncLabel() {
      if (!this.$label) return;
      const floating = this._labelPlacement === 'floating';
      this.$label.textContent = this._label;
      this.$label.hidden = !this._label;
      if (floating && this.$label.parentNode !== this.$field) this.$field.prepend(this.$label);
      else if (!floating && this.$label.parentNode !== this.$wrap) this.$wrap.prepend(this.$label);
      this.dataset.labelPlacement = this._labelPlacement;
      this.classList.toggle('slice_datepicker--labelled', !!this._label);
      if (!this._label && this._ariaLabel) this.$input.setAttribute('aria-label', this._ariaLabel);
      else this.$input.removeAttribute('aria-label');
      this.$popup.setAttribute('aria-label', this._label || this._ariaLabel || this._t('calendar'));
      this._syncText();
   }

   _syncFloat() {
      if (!this.$label) return;
      const up = this._focused || this.$input.value !== '' || this._open;
      this.$label.classList.toggle('is-floated', up);
      this.$label.classList.toggle('is-focused', this._focused || this._open);
      this.classList.toggle('slice_datepicker--filled', !!(this._start || this._end));
   }

   _syncClear() {
      if (!this.$clear) return;
      this.$clear.hidden = !(this._clearable && (this._start || this._end) && !this._disabled && !this._readonly);
   }

   _syncFooter() {
      if (!this.$message) return;
      const error = this._error || this._shownError;
      const text = error || this._help;
      this.$message.textContent = text;
      this.$message.classList.toggle('slice_datepicker_message--error', !!error);
      this.$footer.hidden = !text;
      const invalid = !!(this._error || this._shownError || this._invalid);
      this.classList.toggle('slice_datepicker--invalid', invalid);
      this.$field.classList.toggle('is-invalid', invalid);
      this.$input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      if (text) this.$input.setAttribute('aria-describedby', this.$message.id);
      else this.$input.removeAttribute('aria-describedby');
   }

   _showError(message) {
      this._shownError = message || '';
      this._syncFooter();
   }

   _shake() {
      this.$field.classList.remove('is-shaking');
      void this.$field.offsetWidth;
      this.$field.classList.add('is-shaking');
      window.clearTimeout(this._shakeTimer);
      this._shakeTimer = window.setTimeout(() => this.$field.classList.remove('is-shaking'), 500);
   }

   // What a field says on its own: never "required" for an empty field (that
   // waits for validate(), i.e. a submit), the same rule as Input.
   _autoMessage() {
      const emptyText = (this._typed ?? this.$input.value).trim() === '';
      if (emptyText && !this._start && !this._end) return '';
      return this.validationMessage;
   }

   // ── Committing ─────────────────────────────────────────────────

   _commit(start, end, { close = false } = {}) {
      const before = JSON.stringify(this.value);
      this._start = start || '';
      this._end = this._mode === 'range' ? (end || '') : '';
      this._typed = null;
      this._syncText();
      this._syncHidden();
      if (this._shownError) this._showError(this._autoMessage());
      if (this._open || this._inline) this._render();
      if (close) this._setOpen(false);
      if (JSON.stringify(this.value) !== before) {
         if (this._onChange) this._onChange(this.value, { valueAsDate: this.valueAsDate });
         this.dispatchEvent(new CustomEvent('date-change', { detail: { value: this.value }, bubbles: true }));
      }
   }

   // Turn what was typed into the value, if it parses. Text that does not
   // parse stays in the field so it can be fixed, and validation says why.
   _commitTyped() {
      if (this._typed === null) return;
      const text = this._typed.trim();
      if (text === '') {
         this._commit('', '');
         return;
      }
      const parsed = this._parseTyped(text);
      if (!parsed) return;
      if (this._mode === 'range') {
         const [a, b] = parsed;
         this._commit(a < b ? a : b, a < b ? b : a);
      } else {
         this._commit(parsed, '');
      }
   }

   // ── Opening ────────────────────────────────────────────────────

   _syncInline() {
      if (!this.$popup) return;
      this.classList.toggle('slice_datepicker--inline', this._inline);
      if (this._inline) {
         this.$popup.removeAttribute('popover');
         this.$popup.setAttribute('role', 'group');
         this._resetView();
         this._render();
      } else {
         this.$popup.setAttribute('popover', 'manual');
         this.$popup.setAttribute('role', 'dialog');
         if (!this._open) this.$popup.replaceChildren();
      }
   }

   _resetView() {
      const anchor = this._start || clamp(todayISO(), this._min, this._max);
      this._cursor = this._firstEnabledNear(anchor);
      this._viewMonth = this._monthOf(this._cursor);
      this._view = 'days';
   }

   _setOpen(open, { focusGrid = false, silent = false } = {}) {
      if (this._inline) return;
      if (open && (this._disabled || this._readonly)) return;
      if (open === this._open) {
         if (open && focusGrid) this._focusCursor();
         return;
      }
      this._open = open;
      this.$input.setAttribute('aria-expanded', String(open));
      this.classList.toggle('slice_datepicker--open', open);
      if (open) {
         this._resetView();
         this._render();
         try { this.$popup.showPopover?.(); } catch { /* no popover support */ }
         this._position();
         requestAnimationFrame(() => {
            if (!this._open) return;
            this.$popup.classList.add('is-open');
            this._position();
            if (focusGrid) this._focusCursor();
         });
         this._toggleDocumentListeners(true);
      } else {
         this._hover = '';
         this.$popup.classList.remove('is-open');
         try { this.$popup.hidePopover?.(); } catch { /* already hidden */ }
         this.$popup.replaceChildren();
         this._toggleDocumentListeners(false);
      }
      this._syncFloat();
      if (!silent && this._onOpenChange) this._onOpenChange(open);
   }

   _toggleDocumentListeners(on) {
      const method = on ? 'addEventListener' : 'removeEventListener';
      document[method]('pointerdown', this._handleOutsidePointer, true);
      window[method]('resize', this._handleViewport);
      document[method]('scroll', this._handleViewport, true);
   }

   _handleViewport() {
      this._position();
   }

   _position() {
      if (!this._open) return;
      const anchor = this.$field.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const popup = this.$popup;
      const height = popup.offsetHeight;
      const width = popup.offsetWidth;
      const below = vh - anchor.bottom - MENU_GAP - VIEWPORT_MARGIN;
      const above = anchor.top - MENU_GAP - VIEWPORT_MARGIN;
      const down = height <= below || below >= above;
      const left = Math.min(Math.max(VIEWPORT_MARGIN, anchor.left), Math.max(VIEWPORT_MARGIN, vw - width - VIEWPORT_MARGIN));
      const top = down ? anchor.bottom + MENU_GAP : Math.max(VIEWPORT_MARGIN, anchor.top - MENU_GAP - height);
      popup.style.left = `${Math.round(left)}px`;
      popup.style.top = `${Math.round(top)}px`;
      popup.dataset.side = down ? 'bottom' : 'top';
   }

   _refreshIfShown() {
      if (!this.$popup) return;
      if (this._open || this._inline) {
         if (this._cursor) this._cursor = this._firstEnabledNear(this._cursor);
         this._render();
      }
   }

   // ── Calendar ───────────────────────────────────────────────────

   _monthOf(iso) {
      const p = parseISO(iso);
      return toISO({ y: p.y, m: p.m, d: 1 });
   }

   _firstEnabledNear(iso) {
      let day = clamp(iso, this._min, this._max);
      // Up to a year either way, in case most days are disabled.
      for (let i = 0; i < 366; i++) {
         const forward = addDays(day, i);
         if (!this.isDateDisabled(forward) && (!this._max || forward <= this._max)) return forward;
         const back = addDays(day, -i);
         if (!this.isDateDisabled(back) && (!this._min || back >= this._min)) return back;
      }
      return day;
   }

   _render() {
      const popup = this.$popup;
      const locale = this.locale;
      const panel = document.createElement('div');
      panel.className = 'dp_panel';

      if (this._presets.length) panel.appendChild(this._renderPresets());

      const main = document.createElement('div');
      main.className = 'dp_main';
      main.appendChild(this._renderHeader(locale));

      if (this._view === 'days') {
         const months = document.createElement('div');
         months.className = 'dp_months';
         for (let i = 0; i < this._months; i++) {
            months.appendChild(this._renderMonth(addMonths(this._viewMonth, i), locale, i));
         }
         main.appendChild(months);
      } else if (this._view === 'months') {
         main.appendChild(this._renderMonthPicker(locale));
      } else {
         main.appendChild(this._renderYearPicker());
      }

      const foot = document.createElement('div');
      foot.className = 'dp_foot';
      if (this._mode === 'range') {
         const status = document.createElement('span');
         status.className = 'dp_status';
         status.setAttribute('aria-live', 'polite');
         const end = this._end || (this._start && this._hover >= this._start ? this._hover : '');
         status.textContent = this._start && end
            ? this._t('days', { n: daysBetween(this._start, end) + 1 })
            : this._t(this._start ? 'pickEnd' : 'pickStart');
         foot.appendChild(status);
      }
      const actions = document.createElement('span');
      actions.className = 'dp_foot_actions';
      if (this._showToday && !this.isDateDisabled(todayISO())) {
         actions.appendChild(this._footButton(this._t('today'), 'today'));
      }
      if (this._clearable && (this._start || this._end)) actions.appendChild(this._footButton(this._t('clear'), 'clear'));
      foot.appendChild(actions);
      if (foot.textContent || actions.childElementCount) main.appendChild(foot);

      panel.appendChild(main);
      const keepFocus = popup.contains(document.activeElement) && this._view === 'days';
      // Replacing the focused day fires a focusout with nowhere to go; that is
      // the calendar redrawing, not someone leaving the picker.
      this._rendering = true;
      try {
         popup.replaceChildren(panel);
      } finally {
         this._rendering = false;
      }
      if (keepFocus) this._focusCursor();
      if (this._open) this._position();
   }

   _footButton(text, action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dp_foot_button';
      button.dataset.action = action;
      button.textContent = text;
      return button;
   }

   _renderHeader(locale) {
      const head = document.createElement('div');
      head.className = 'dp_head';
      const prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'dp_nav';
      prev.dataset.action = 'prev';
      prev.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
      const next = prev.cloneNode(true);
      next.dataset.action = 'next';
      next.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';

      const title = document.createElement('button');
      title.type = 'button';
      title.className = 'dp_title';
      title.setAttribute('aria-live', 'polite');
      const p = parseISO(this._viewMonth);
      if (this._view === 'days') {
         const last = addMonths(this._viewMonth, this._months - 1);
         const fmt = (iso) => formatDate(iso, locale, { month: 'long', year: 'numeric' });
         title.textContent = this._months === 2 ? `${fmt(this._viewMonth)} – ${fmt(last)}` : fmt(this._viewMonth);
         title.dataset.action = 'view-months';
         title.setAttribute('aria-label', this._t('chooseMonth', { month: title.textContent }));
         prev.setAttribute('aria-label', this._t('previousMonth'));
         next.setAttribute('aria-label', this._t('nextMonth'));
      } else if (this._view === 'months') {
         title.textContent = String(p.y);
         title.dataset.action = 'view-years';
         title.setAttribute('aria-label', this._t('chooseYear', { year: p.y }));
         prev.setAttribute('aria-label', this._t('previousYear'));
         next.setAttribute('aria-label', this._t('nextYear'));
      } else {
         const from = p.y - (p.y % 12);
         title.textContent = `${from} – ${from + 11}`;
         title.dataset.action = 'view-days';
         prev.setAttribute('aria-label', this._t('previousYears'));
         next.setAttribute('aria-label', this._t('nextYears'));
      }
      const canPrev = this._navAllowed(-1);
      const canNext = this._navAllowed(1);
      prev.disabled = !canPrev;
      next.disabled = !canNext;
      head.append(prev, title, next);
      return head;
   }

   _navAllowed(direction) {
      const p = parseISO(this._viewMonth);
      if (this._view === 'days') {
         if (direction < 0) return !this._min || addDays(this._viewMonth, -1) >= this._monthOf(this._min);
         const after = addMonths(this._viewMonth, this._months);
         return !this._max || after <= this._max;
      }
      const span = this._view === 'months' ? 1 : 12;
      const year = this._view === 'months' ? p.y + direction : p.y - (p.y % 12) + direction * 12;
      const min = this._min ? parseISO(this._min).y : -Infinity;
      const max = this._max ? parseISO(this._max).y : Infinity;
      return direction < 0 ? year + span - 1 >= min : year <= max;
   }

   _renderMonth(monthIso, locale, index) {
      const p = parseISO(monthIso);
      const weekStart = this.weekStartsOn;
      const wrap = document.createElement('div');
      wrap.className = 'dp_month';
      if (this._months === 2) {
         const name = document.createElement('div');
         name.className = 'dp_month_name';
         name.textContent = formatDate(monthIso, locale, { month: 'long', year: 'numeric' });
         wrap.appendChild(name);
      }
      const grid = document.createElement('table');
      grid.className = 'dp_grid';
      grid.setAttribute('role', 'grid');
      grid.setAttribute('aria-label', formatDate(monthIso, locale, { month: 'long', year: 'numeric' }));
      const head = document.createElement('thead');
      const headRow = document.createElement('tr');
      const short = weekdayNames(locale, weekStart, 'short');
      const long = weekdayNames(locale, weekStart, 'long');
      short.forEach((label, i) => {
         const th = document.createElement('th');
         th.scope = 'col';
         th.abbr = long[i];
         th.textContent = label.slice(0, 2);
         headRow.appendChild(th);
      });
      head.appendChild(headRow);
      grid.appendChild(head);

      const body = document.createElement('tbody');
      const days = monthGrid(p.y, p.m, weekStart);
      const today = todayISO();
      const [rangeStart, rangeEnd] = this._rangeForPaint();
      for (let w = 0; w < 6; w++) {
         const row = document.createElement('tr');
         for (let d = 0; d < 7; d++) {
            const iso = days[w * 7 + d];
            const inMonth = iso.slice(0, 7) === monthIso.slice(0, 7);
            const td = document.createElement('td');
            td.setAttribute('role', 'gridcell');
            // With two months, a day belongs to one of them: the other leaves
            // its cell empty so the same day is never drawn (and focusable) twice.
            if (!inMonth && this._months === 2) {
               row.appendChild(td);
               continue;
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'dp_day';
            button.dataset.date = iso;
            button.tabIndex = iso === this._cursor ? 0 : -1;
            button.textContent = String(parseISO(iso).d);
            button.setAttribute('aria-label', formatDate(iso, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
            const disabled = this.isDateDisabled(iso);
            if (disabled) {
               button.setAttribute('aria-disabled', 'true');
               button.classList.add('is-disabled');
            }
            if (!inMonth) button.classList.add('is-outside');
            if (iso === today) {
               button.classList.add('is-today');
               button.setAttribute('aria-current', 'date');
            }
            const selected = this._mode === 'range'
               ? (iso === this._start || iso === this._end)
               : iso === this._start;
            if (selected) td.setAttribute('aria-selected', 'true');
            button.classList.toggle('is-selected', selected);
            if (rangeStart && rangeEnd && iso >= rangeStart && iso <= rangeEnd) {
               td.classList.add('in-range');
               if (iso === rangeStart) td.classList.add('range-start');
               if (iso === rangeEnd) td.classList.add('range-end');
               if (!this._end) td.classList.add('is-preview');
            }
            td.appendChild(button);
            row.appendChild(td);
         }
         body.appendChild(row);
      }
      grid.appendChild(body);
      wrap.appendChild(grid);
      return wrap;
   }

   _rangeForPaint() {
      if (this._mode !== 'range' || !this._start) return ['', ''];
      if (this._end) return [this._start, this._end];
      if (this._hover) return this._hover < this._start ? [this._hover, this._start] : [this._start, this._hover];
      return ['', ''];
   }

   _renderMonthPicker(locale) {
      const p = parseISO(this._viewMonth);
      const grid = document.createElement('div');
      grid.className = 'dp_picker';
      monthNames(locale, 'short').forEach((label, i) => {
         const button = document.createElement('button');
         button.type = 'button';
         button.className = 'dp_pick';
         button.dataset.month = String(i + 1);
         button.textContent = label;
         const first = toISO({ y: p.y, m: i + 1, d: 1 });
         const last = addDays(addMonths(first, 1), -1);
         const out = (this._min && last < this._min) || (this._max && first > this._max);
         button.disabled = !!out;
         if (this._start && this._start.slice(0, 7) === first.slice(0, 7)) button.classList.add('is-selected');
         if (todayISO().slice(0, 7) === first.slice(0, 7)) button.classList.add('is-today');
         grid.appendChild(button);
      });
      return grid;
   }

   _renderYearPicker() {
      const p = parseISO(this._viewMonth);
      const from = p.y - (p.y % 12);
      const grid = document.createElement('div');
      grid.className = 'dp_picker';
      const minY = this._min ? parseISO(this._min).y : -Infinity;
      const maxY = this._max ? parseISO(this._max).y : Infinity;
      for (let y = from; y < from + 12; y++) {
         const button = document.createElement('button');
         button.type = 'button';
         button.className = 'dp_pick';
         button.dataset.year = String(y);
         button.textContent = String(y);
         button.disabled = y < minY || y > maxY;
         if (this._start && parseISO(this._start).y === y) button.classList.add('is-selected');
         if (parseISO(todayISO()).y === y) button.classList.add('is-today');
         grid.appendChild(button);
      }
      return grid;
   }

   _renderPresets() {
      const list = document.createElement('div');
      list.className = 'dp_presets';
      list.setAttribute('role', 'group');
      list.setAttribute('aria-label', this._t('quickPicks'));
      this._presets.forEach((preset, i) => {
         const button = document.createElement('button');
         button.type = 'button';
         button.className = 'dp_preset';
         button.dataset.preset = String(i);
         button.textContent = preset.label;
         const value = this._resolvePreset(preset);
         const [a, b] = typeof value === 'object' && value ? [value.start, value.end] : [value, ''];
         if (a && a === this._start && (this._mode !== 'range' || b === this._end)) button.classList.add('is-selected');
         list.appendChild(button);
      });
      return list;
   }

   _resolvePreset(preset) {
      let value = typeof preset.value === 'function' ? preset.value({ today: todayISO() }) : preset.value;
      if (value === 'today') value = todayISO();
      if (this._mode === 'range') {
         if (Array.isArray(value)) value = { start: value[0], end: value[1] };
         return value ? { start: normalize(value.start), end: normalize(value.end) } : null;
      }
      return normalize(value);
   }

   _focusCursor() {
      const button = this.$popup.querySelector(`.dp_day[data-date="${this._cursor}"]`);
      if (button) button.focus({ preventScroll: true });
   }

   _moveCursor(iso) {
      const target = clamp(iso, this._min, this._max);
      this._cursor = target;
      const firstShown = this._viewMonth;
      const lastShown = addDays(addMonths(this._viewMonth, this._months), -1);
      if (target < firstShown || target > lastShown) {
         this._viewMonth = target < firstShown ? this._monthOf(target) : this._monthOf(addMonths(target, -(this._months - 1)));
      }
      if (this._mode === 'range' && this._start && !this._end) this._hover = target;
      this._render();
      this._focusCursor();
   }

   _pick(iso) {
      if (this.isDateDisabled(iso)) return;
      this._cursor = iso;
      if (this._mode === 'range') {
         if (!this._start || this._end) {
            this._hover = '';
            this._commit(iso, '');
            this._focusCursor();
            return;
         }
         const [a, b] = iso < this._start ? [iso, this._start] : [this._start, iso];
         this._hover = '';
         this._commit(a, b, { close: this._closeOnSelect });
         if (this._closeOnSelect && !this._inline) this.$input.focus();
         return;
      }
      this._commit(iso, '', { close: this._closeOnSelect });
      if (this._closeOnSelect && !this._inline) this.$input.focus();
      else this._focusCursor();
   }

   // ── Events ─────────────────────────────────────────────────────

   _handlePopupClick(event) {
      const day = event.target.closest('.dp_day');
      if (day) {
         this._pick(day.dataset.date);
         return;
      }
      const control = event.target.closest('button');
      if (!control || control.disabled) return;
      const action = control.dataset.action;
      const p = parseISO(this._viewMonth);
      if (action === 'prev' || action === 'next') {
         const dir = action === 'prev' ? -1 : 1;
         if (this._view === 'days') this._viewMonth = addMonths(this._viewMonth, dir);
         else if (this._view === 'months') this._viewMonth = addYears(this._viewMonth, dir);
         else this._viewMonth = addYears(this._viewMonth, dir * 12);
         if (this._view === 'days') this._cursor = this._firstEnabledNear(this._viewMonth);
         this._render();
         this.$popup.querySelector(`[data-action="${action}"]`)?.focus();
      } else if (action === 'view-months') {
         this._view = 'months';
         this._render();
         this.$popup.querySelector('.dp_pick.is-selected, .dp_pick:not(:disabled)')?.focus();
      } else if (action === 'view-years') {
         this._view = 'years';
         this._render();
         this.$popup.querySelector('.dp_pick.is-selected, .dp_pick:not(:disabled)')?.focus();
      } else if (action === 'view-days') {
         this._view = 'days';
         this._render();
      } else if (control.dataset.month) {
         this._viewMonth = toISO({ y: p.y, m: Number(control.dataset.month), d: 1 });
         this._cursor = this._firstEnabledNear(this._viewMonth);
         this._view = 'days';
         this._render();
         this._focusCursor();
      } else if (control.dataset.year) {
         this._viewMonth = toISO({ y: Number(control.dataset.year), m: p.m, d: 1 });
         this._view = 'months';
         this._render();
         this.$popup.querySelector(`.dp_pick[data-month="${p.m}"]`)?.focus();
      } else if (action === 'today') {
         const today = todayISO();
         if (this._mode === 'range') {
            this._viewMonth = this._monthOf(today);
            this._pick(today);
         } else {
            this._commit(today, '', { close: this._closeOnSelect });
            if (this._closeOnSelect && !this._inline) this.$input.focus();
         }
      } else if (action === 'clear') {
         this._commit('', '');
         if (!this._inline) this.$input.focus();
      } else if (control.dataset.preset !== undefined) {
         const value = this._resolvePreset(this._presets[Number(control.dataset.preset)]);
         // A range preset resolves to { start, end } (or null), a single one to ISO text.
         if (typeof value === 'object') {
            if (value?.start && value?.end) this._commit(value.start, value.end, { close: this._closeOnSelect });
         } else if (value) {
            this._commit(value, '', { close: this._closeOnSelect });
         }
         if (this._closeOnSelect && !this._inline) this.$input.focus();
      }
   }

   _handlePopupOver(event) {
      if (this._mode !== 'range' || !this._start || this._end) return;
      const day = event.target.closest('.dp_day');
      if (!day || day.dataset.date === this._hover) return;
      this._hover = day.dataset.date;
      // Repaint only the range classes: rebuilding the grid on every pointer
      // move would also steal the keyboard focus.
      const [a, b] = this._rangeForPaint();
      for (const button of this.$popup.querySelectorAll('.dp_day')) {
         const td = button.parentElement;
         const iso = button.dataset.date;
         const inside = a && b && iso >= a && iso <= b;
         td.classList.toggle('in-range', !!inside);
         td.classList.toggle('range-start', inside && iso === a);
         td.classList.toggle('range-end', inside && iso === b);
         td.classList.toggle('is-preview', !!inside);
      }
      const status = this.$popup.querySelector('.dp_status');
      if (status && a && b) status.textContent = this._t('days', { n: daysBetween(a, b) + 1 });
   }

   _handlePopupKeyDown(event) {
      if (event.key === 'Escape') {
         event.preventDefault();
         event.stopPropagation();
         if (this._view !== 'days') {
            this._view = 'days';
            this._render();
            this._focusCursor();
            return;
         }
         this._setOpen(false);
         this.$input.focus();
         return;
      }
      const day = event.target.closest('.dp_day');
      if (!day) return;
      const iso = day.dataset.date;
      const weekStart = this.weekStartsOn;
      let target;
      switch (event.key) {
         case 'ArrowLeft': target = addDays(iso, -1); break;
         case 'ArrowRight': target = addDays(iso, 1); break;
         case 'ArrowUp': target = addDays(iso, -7); break;
         case 'ArrowDown': target = addDays(iso, 7); break;
         case 'Home': target = startOfWeek(iso, weekStart); break;
         case 'End': target = addDays(startOfWeek(iso, weekStart), 6); break;
         case 'PageUp': target = event.shiftKey ? addYears(iso, -1) : addMonths(iso, -1); break;
         case 'PageDown': target = event.shiftKey ? addYears(iso, 1) : addMonths(iso, 1); break;
         case 'Enter':
         case ' ':
            event.preventDefault();
            this._pick(iso);
            return;
         default:
            return;
      }
      event.preventDefault();
      this._moveCursor(target);
   }

   _handleOutsidePointer(event) {
      const path = event.composedPath();
      if (path.includes(this) || path.includes(this.$popup)) return;
      this._commitTyped();
      this._setOpen(false);
   }

   _handleFieldPointerDown(event) {
      if (this._disabled || this._readonly) return;
      if (event.target.closest('.slice_datepicker_clear, .slice_datepicker_toggle')) return;
      if (event.target !== this.$input) {
         event.preventDefault();
         this.$input.focus();
      }
      if (!this._open) this._setOpen(true, { focusGrid: false });
   }

   _handleToggle() {
      if (this._open) {
         this._setOpen(false);
         this.$input.focus();
      } else {
         this._commitTyped();
         this._setOpen(true, { focusGrid: true });
      }
   }

   _handleClear() {
      if (this._disabled || this._readonly) return;
      this._commit('', '');
      this._dirty = true;
      this.$input.focus();
   }

   _handleInput() {
      this._dirty = true;
      this._typed = this.$input.value;
      this._syncFloat();
      // Follow what is being typed in the calendar, without committing yet.
      const parsed = this._parseTyped(this._typed);
      if (parsed && (this._open || this._inline)) {
         const first = Array.isArray(parsed) ? parsed[0] : parsed;
         this._cursor = first;
         this._viewMonth = this._monthOf(first);
         this._render();
      }
      if (this._shownError) this._showError(this._autoMessage());
   }

   _handleFocus() {
      this._focused = true;
      this.classList.add('slice_datepicker--focused');
      if (this._typed === null) this.$input.value = this._editText();
      this._syncText();
   }

   // A mouse press in the calendar keeps the focus in the field, so someone
   // typing can also click a day, and a browser that does not focus buttons
   // on click (Safari) does not read the press as leaving the picker.
   _handlePopupPointerDown(event) {
      if (event.pointerType === 'mouse' && event.target.closest('button') && !this._inline) {
         event.preventDefault();
      }
   }

   // Leaving the whole picker (field and calendar), not moving inside it.
   _handleFocusOut(event) {
      if (this._rendering) return;
      if (event.relatedTarget && this.contains(event.relatedTarget)) return;
      if (this._inline && event.target !== this.$input) return;
      this._setOpen(false);
      this._focused = false;
      this.classList.remove('slice_datepicker--focused');
      this._commitTyped();
      if (this._typed === null) this.$input.value = this._displayText();
      this._syncText();
      if (this._validateOn !== 'manual' && this._dirty) this._showError(this._autoMessage());
   }

   _handleFieldKeyDown(event) {
      if (event.key === 'ArrowDown') {
         event.preventDefault();
         this._commitTyped();
         this._setOpen(true, { focusGrid: true });
      } else if (event.key === 'Enter') {
         this._commitTyped();
         if (this._open) this._setOpen(false);
      } else if (event.key === 'Escape' && this._open) {
         event.preventDefault();
         event.stopPropagation();
         this._setOpen(false);
      }
   }
}

customElements.define('slice-datepicker', DatePicker);