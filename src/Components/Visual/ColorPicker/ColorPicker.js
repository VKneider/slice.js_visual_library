// ColorPicker — a labelled colour swatch backed by a native `<input type="color">`.
//
// It exists because `<input type="color">` cannot be used raw in a Slice app for
// three reasons, all of which this absorbs:
//
//   1. It is unlabelled. The native control announces itself as "colour picker",
//      which is useless in a form with fifteen of them.
//   2. It renders BLACK — silently — for any value it cannot parse. Hand it
//      `rgb(0 128 0)` or a named colour and you get a black swatch that looks
//      like a rendering bug rather than a bad argument.
//   3. It shows no value. You cannot read the current hex off it, so a colour
//      table cannot show what it is actually holding.
//
// The native control is still the implementation: it carries the OS colour
// dialog, touch behaviour and keyboard support that no hand-rolled swatch grid
// gets right for free. This only adds the framing, the normalisation and the
// readout.

import { applySize, applyClassName, SIZE_VALUES } from '../../shared/props.js';
import { normalizeHex } from '../../shared/color/hex.js';

const DEFAULT_COLOR = '#000000';

// A <label for> needs a real id, and a page can hold any number of pickers, so
// the id cannot be a constant — two instances would silently share one name and
// the second label would point at the first control.
let instanceCount = 0;

export default class ColorPicker extends HTMLElement {

   static props = {
      // Visible label. Doubles as the control's accessible name via <label for>.
      label: { type: 'string', default: '' },
      // The colour. Always normalized to #rrggbb on the way in and out.
      value: { type: 'string', default: DEFAULT_COLOR },
      // Small secondary line under the control — a CSS variable name, a usage
      // note, anything the label alone doesn't say.
      hint: { type: 'string', default: '' },
      // Density, from the size list every control shares (shared/props.js).
      size: { type: 'string', default: 'md', allowedValues: SIZE_VALUES },
      className: { type: 'string', default: '' },
      disabled: { type: 'boolean', default: false },
      // §6: a colour control has one meaningful slot, the swatch — `accent`.
      customColor: { type: 'object', default: null },
      // Canonical handler (§3.1). Fired on every input event with the new hex.
      onChange: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$root = this.querySelector('.slice_color_picker');
      this.$label = this.querySelector('.slice_color_picker__label');
      this.$input = this.querySelector('.slice_color_picker__input');
      this.$value = this.querySelector('.slice_color_picker__value');
      this.$hint = this.querySelector('.slice_color_picker__hint');

      this._inputId = `slice-color-picker-${++instanceCount}`;
      this.$input.id = this._inputId;
      this.$label.htmlFor = this._inputId;

      // Attached unconditionally and resolved at event time, so it works
      // whether the handler arrived via props or was set later. Reading
      // `_value` (not the raw input) as the fallback means a native control
      // that silently blacked out cannot overwrite the caller's colour.
      this.$input.addEventListener('input', () => {
         this._value = normalizeHex(this.$input.value, normalizeHex(this._value, DEFAULT_COLOR));
         this._render();
         if (typeof this._onChange === 'function') this._onChange(this._value);
      });

      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._render();
   }

   /**
    * Push state into the DOM. One direction only: every field is READ from the
    * backing prop and WRITTEN to its node here.
    *
    * It used to read the label back OUT of the DOM (`this.$label.textContent`)
    * while every other field was read from state. That is two sources of truth,
    * and it breaks the moment they disagree — which they did. The label was
    * written before the element was in the document, so the read-back saw an
    * empty label, hid the label element, and replaced the control's accessible
    * name with a generic "Colour". Deriving both from state makes that
    * impossible, and it means init() re-hydrates the whole control even if the
    * template landed after the setters ran.
    */
   _render() {
      const hex = normalizeHex(this._value, DEFAULT_COLOR);
      if (this.$input.value !== hex) this.$input.value = hex;
      if (this.$value) this.$value.textContent = hex;

      const label = typeof this._label === 'string' ? this._label : '';
      if (this.$label) {
         this.$label.textContent = label;
         this.$label.hidden = !label;
      }

      const hint = typeof this._hint === 'string' ? this._hint : '';
      if (this.$hint) {
         this.$hint.textContent = hint;
         this.$hint.hidden = !hint;
      }

      // An unlabelled picker has no accessible name at all, so fall back to
      // whatever context exists rather than shipping an anonymous control.
      if (label) {
         this.$input.removeAttribute('aria-label');
      } else {
         this.$input.setAttribute('aria-label', hint || 'Colour');
      }
   }

   get label() { return this._label; }
   set label(value) {
      this._label = typeof value === 'string' ? value : '';
      this._render();
   }

   get value() { return this._value; }
   set value(newValue) {
      this._value = normalizeHex(newValue, DEFAULT_COLOR);
      this._render();
   }

   get hint() { return this._hint; }
   set hint(value) {
      this._hint = typeof value === 'string' ? value : '';
      this._render();
   }

   get size() { return this._size; }
   set size(value) {
      this._size = applySize(this, value, 'md');
   }

   get className() { return this._className; }
   /** Marked, never substituted — see Button.className. */
   set className(value) {
      applyClassName(this, value);
      this._className = typeof value === 'string' ? value : '';
   }

   get disabled() { return this._disabled; }
   set disabled(value) {
      this._disabled = value === true;
      if (this.$input) this.$input.disabled = this._disabled;
   }

   get customColor() { return this._customColor; }
   set customColor(value) {
      this._customColor = value && typeof value === 'object' ? value : null;
      if (!this.$input) return;
      const accent = this._customColor?.accent;
      if (accent) {
         // Only the border: filling the swatch here would fight the value the
         // user actually picked, which is the one thing this control must show.
         this.$input.style.borderColor = accent;
      } else {
         this.$input.style.removeProperty('border-color');
      }
   }

   get onChange() { return this._onChange; }
   set onChange(value) {
      // Accept null to CLEAR, so a picker can be disabled programmatically.
      this._onChange = typeof value === 'function' ? value : null;
   }
}

customElements.define('slice-color-picker', ColorPicker);