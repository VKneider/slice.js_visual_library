// RadioGroup — a single-choice control. The group OWNS the value: exactly one
// option (or none) is selected, and `value` is that option's `value`.
//
// Built on real `<input type="radio">` elements that share one `name`, inside a
// `<fieldset role="radiogroup">`. That is a deliberate choice, not a shortcut:
// the browser then provides the whole keyboard model for free and gets it right —
// Tab enters the group on the checked option (or the first enabled one), the
// arrow keys move AND select, disabled options are skipped, and a disabled
// fieldset disables every option at once. Re-implementing that with
// role="radio" divs is how roving-tabindex bugs are born.
//
// The enumerated vocabularies (`variant`, `size`, `orientation`,
// `labelPlacement`) are declared as LITERAL arrays inside `static props`, and the
// setters read the accepted set back from there — `slice types generate` only
// understands literals (COMPONENT_API_STANDARDS.md §10).

// Unique per instance: the shared radio `name`, the legend id the fieldset
// points at, and the per-option ids. Not derived from sliceId, which is not set
// yet while the constructor runs the setters.
let _sliceRadioGroupSeq = 0;

export default class RadioGroup extends HTMLElement {

   static props = {
      // The choices. Each entry is `{ label, value, description?, disabled? }`
      // (the data-option shape, §4). A bare string or number is shorthand for
      // `{ label: String(x), value: x }`.
      options: {
         type: 'array',
         default: []
      },
      // The selected option's `value`, or null for "nothing selected yet".
      // Compared with Object.is, so 1 and '1' are different values. Declared
      // `string` because that is the common case (and `slice types` flags
      // `any`); numbers and booleans work too — `type` is metadata, not
      // enforced (§10).
      value: {
         type: 'string',
         default: null
      },
      // Shared `name` of the native radios. Generated when omitted, so two
      // groups on a page can never capture each other's arrow keys.
      name: {
         type: 'string',
         default: null
      },
      // Visible group label, rendered as the fieldset's <legend> and used as the
      // radiogroup's accessible name.
      label: {
         type: 'string',
         default: null
      },
      disabled: {
         type: 'boolean',
         default: false
      },
      // Native `required` on every radio, plus aria-required on the group.
      required: {
         type: 'boolean',
         default: false
      },
      orientation: {
         type: 'string',
         default: 'vertical',
         allowedValues: ['vertical', 'horizontal']
      },
      // Where each option's text sits relative to its circle.
      labelPlacement: {
         type: 'string',
         default: 'right',
         allowedValues: ['right', 'left', 'top', 'bottom']
      },
      // Mirrors Checkbox (default/outlined/soft/plain) so a form that mixes the
      // two reads as one family, plus `card`: every option becomes a selectable
      // card — the plan / shipping-method picker. No `danger`: choosing one of
      // several options is not a destructive action (§3.3).
      variant: {
         type: 'string',
         default: 'default',
         allowedValues: ['default', 'outlined', 'soft', 'plain', 'card']
      },
      size: {
         type: 'string',
         default: 'md',
         allowedValues: ['sm', 'md', 'lg']
      },
      // Canonical change handler (§3.1). Fired with `(value, option)` when the
      // USER selects an option — never for programmatic `value` changes.
      onChange: {
         type: 'function',
         default: null
      },
      // `{ accent }` (§6): the selected circle / card colour.
      customColor: {
         type: 'object',
         default: null
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$container = this.querySelector('.slice_radio_group_container');
      this.$legend = this.querySelector('.slice_radio_group_label');
      this.$group = this.querySelector('.slice_radio_group');

      // Internal state uses names no declared prop can derive (§10): the
      // framework nulls `_<prop>` for every prop before applying it.
      this._uid = `slice-radio-group-${++_sliceRadioGroupSeq}`;
      this._items = [];
      this._entries = [];
      this._mounted = false;
      this.$legend.id = `${this._uid}-label`;

      // Delegated on the group's own node, so it is auto-cleaned with the
      // component and survives every options re-render.
      this._onInputChange = this._onInputChange.bind(this);
      this.$group.addEventListener('change', this._onInputChange);

      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._mounted = true;
      // Props arrive in whatever order the caller wrote them, so `value` may have
      // been set before `options` existed. Only now is it safe to judge it.
      this._dropUnknownValue(true);
      this._syncChecked();
   }

   // ------------------------------------------------------------------ public

   /** The raw option entry that is selected (as passed in `options`), or null. */
   get selectedOption() {
      const index = this._indexOf(this._value);
      return index === -1 ? null : this._items[index].option;
   }

   /**
    * Focus the group the way Tab would: the selected option, or the first one
    * that is enabled. The host itself is not focusable.
    */
   focus(options) {
      const enabled = this._entries.filter((entry) => !entry.input.disabled);
      const target = enabled.find((entry) => entry.input.checked) || enabled[0];
      if (target) target.input.focus(options);
   }

   // ------------------------------------------------------------- rendering

   _normalize(entry) {
      if (entry === null || entry === undefined) return null;
      if (typeof entry !== 'object') {
         return { label: String(entry), value: entry, description: null, disabled: false, option: entry };
      }
      // An object without `value` falls back to its label, so `{ label: 'Red' }`
      // still selects instead of every such option sharing `undefined`.
      const value = entry.value !== undefined ? entry.value : (entry.label ?? null);
      return {
         label: entry.label !== undefined && entry.label !== null ? String(entry.label) : String(value ?? ''),
         value,
         description: entry.description ? String(entry.description) : null,
         disabled: entry.disabled === true,
         option: entry
      };
   }

   _render() {
      // Plain DOM nodes only — no Slice child components live in this list, so
      // replacing them leaks nothing (contrast `innerHTML = ''` over components).
      const nodes = this._items.map((item, index) => this._renderOption(item, index));
      this.$group.replaceChildren(...nodes.map((entry) => entry.option));
      this._entries = nodes;
   }

   _renderOption(item, index) {
      const id = `${this._uid}-${index}`;

      // A wrapping <label>: a click anywhere on the row — circle, text or the
      // whole card — selects the option, with no `for` bookkeeping.
      const option = document.createElement('label');
      option.className = 'slice_radio_option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.className = 'slice_radio_input';
      input.id = id;
      input.name = this._effectiveName();
      // The real value, stringified, so a native <form> around the group still
      // submits something meaningful. The data value is mapped back by index.
      input.value = String(item.value ?? '');
      input.dataset.index = String(index);
      input.disabled = item.disabled;
      input.required = this._required === true;

      const mark = document.createElement('span');
      mark.className = 'slice_radio_mark';
      mark.setAttribute('aria-hidden', 'true');

      const text = document.createElement('span');
      text.className = 'slice_radio_text';

      const label = document.createElement('span');
      label.className = 'slice_radio_label';
      label.textContent = item.label;
      text.appendChild(label);

      if (item.description) {
         const description = document.createElement('span');
         description.className = 'slice_radio_description';
         description.id = `${id}-description`;
         description.textContent = item.description;
         input.setAttribute('aria-describedby', description.id);
         text.appendChild(description);
      }

      option.classList.toggle('slice_radio_option--disabled', item.disabled);
      option.append(input, mark, text);
      return { option, input };
   }

   // --------------------------------------------------------------- state

   _indexOf(value) {
      if (value === null || value === undefined) return -1;
      return this._items.findIndex((item) => Object.is(item.value, value));
   }

   _syncChecked() {
      const selected = this._indexOf(this._value);
      this._entries.forEach((entry, index) => {
         const isSelected = index === selected;
         entry.input.checked = isSelected;
         entry.option.classList.toggle('slice_radio_option--checked', isSelected);
      });
   }

   // A value that matches no option is not a selection. Before init() it is kept
   // (options may simply not have arrived yet); after, it is dropped to null —
   // loudly when it came from the caller, quietly when new options replaced the
   // one that was selected.
   _dropUnknownValue(warn) {
      if (!this._mounted) return;
      if (this._value === null || this._indexOf(this._value) !== -1) return;
      if (warn) {
         slice.logger?.logWarning?.(
            'RadioGroup',
            `value ${JSON.stringify(this._value)} matches no option; the group is left unselected.`
         );
      }
      this._value = null;
   }

   _effectiveName() {
      return this._name || this._uid;
   }

   _onInputChange(event) {
      const input = event.target;
      if (!input || !input.classList || !input.classList.contains('slice_radio_input')) return;
      const item = this._items[Number(input.dataset.index)];
      if (!item) return;

      this._value = item.value;
      this._syncChecked();
      if (typeof this._onChange === 'function') this._onChange(item.value, item.option);
   }

   _swapClass(prefix, allowedValues, next) {
      for (const value of allowedValues) this.$container.classList.remove(prefix + value);
      this.$container.classList.add(prefix + next);
   }

   // --------------------------------------------------------- props/setters

   get options() {
      return this._options;
   }

   set options(value) {
      this._options = Array.isArray(value) ? value : [];
      this._items = this._options.map((entry) => this._normalize(entry)).filter(Boolean);
      this._render();
      // The selected option may be gone from the new data. That is a data
      // change, not a caller mistake, so it clears without a warning — and
      // without onChange, which is reserved for user interaction.
      this._dropUnknownValue(false);
      this._syncChecked();
   }

   get value() {
      return this._value;
   }

   set value(value) {
      this._value = value === undefined ? null : value;
      this._dropUnknownValue(true);
      this._syncChecked();
   }

   get name() {
      return this._name;
   }

   set name(value) {
      this._name = typeof value === 'string' && value.trim() ? value : null;
      const name = this._effectiveName();
      for (const entry of this._entries) entry.input.name = name;
   }

   get label() {
      return this._label;
   }

   set label(value) {
      this._label = value === null || value === undefined || value === '' ? null : String(value);
      this.$legend.textContent = this._label || '';
      this.$legend.hidden = !this._label;
      if (this._label) {
         this.$container.setAttribute('aria-labelledby', this.$legend.id);
      } else {
         this.$container.removeAttribute('aria-labelledby');
      }
   }

   get disabled() {
      return this._disabled;
   }

   set disabled(value) {
      this._disabled = value === true;
      // A disabled fieldset disables every radio inside it natively — no
      // per-input loop that a later options re-render could forget.
      this.$container.disabled = this._disabled;
      // The fieldset carries role="radiogroup", and an explicit ARIA role is not
      // one whose disabled state is inferred from the native attribute.
      if (this._disabled) {
         this.$container.setAttribute('aria-disabled', 'true');
      } else {
         this.$container.removeAttribute('aria-disabled');
      }
      this.$container.classList.toggle('slice_radio_group--disabled', this._disabled);
   }

   get required() {
      return this._required;
   }

   set required(value) {
      this._required = value === true;
      for (const entry of this._entries) entry.input.required = this._required;
      if (this._required) {
         this.$container.setAttribute('aria-required', 'true');
      } else {
         this.$container.removeAttribute('aria-required');
      }
   }

   get orientation() {
      return this._orientation;
   }

   set orientation(value) {
      const { allowedValues, default: fallback } = RadioGroup.props.orientation;
      const next = allowedValues.includes(value) ? value : fallback;
      this._swapClass('slice_radio_group--', allowedValues, next);
      this.$container.setAttribute('aria-orientation', next);
      this._orientation = next;
   }

   get labelPlacement() {
      return this._labelPlacement;
   }

   set labelPlacement(value) {
      const { allowedValues, default: fallback } = RadioGroup.props.labelPlacement;
      const next = allowedValues.includes(value) ? value : fallback;
      this._swapClass('slice_radio_group--label-', allowedValues, next);
      this._labelPlacement = next;
   }

   get variant() {
      return this._variant;
   }

   set variant(value) {
      const { allowedValues, default: fallback } = RadioGroup.props.variant;
      const next = allowedValues.includes(value) ? value : fallback;
      this._swapClass('slice_radio_group--', allowedValues, next);
      this._variant = next;
   }

   get size() {
      return this._size;
   }

   set size(value) {
      // `data-size` on the host; RadioGroup.css decides what the values mean.
      const { allowedValues, default: fallback } = RadioGroup.props.size;
      const next = allowedValues.includes(value) ? value : fallback;
      this.dataset.size = next;
      this._size = next;
   }

   get customColor() {
      return this._customColor;
   }

   set customColor(value) {
      this._customColor = value && typeof value === 'object' ? value : null;
      const accent = this._customColor && (this._customColor.accent ?? this._customColor.background);
      if (accent) {
         this.style.setProperty('--slice-radio-custom-accent', accent);
      } else {
         this.style.removeProperty('--slice-radio-custom-accent');
      }
   }

   get onChange() {
      return this._onChange;
   }

   set onChange(value) {
      // Accept null/non-function to CLEAR the handler.
      this._onChange = typeof value === 'function' ? value : null;
   }
}

customElements.define('slice-radio-group', RadioGroup);