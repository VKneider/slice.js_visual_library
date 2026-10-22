const VARIANTS = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const SIZES = ['sm', 'md'];

export default class Badge extends HTMLElement {

   static props = {
      // Semantic intent, not appearance: `success`/`danger` follow the theme
      // tokens, so a badge means the same thing in light and dark.
      variant: {
         type: 'string',
         default: 'neutral',
         required: false,
         allowedValues: VARIANTS,
      },
      label: { type: 'string', default: '' },
      // A count. Wins over `label` when set, and is capped by `max` so a 1200
      // notification badge reads "99+" instead of breaking the layout.
      value: { type: 'number', default: null },
      max: { type: 'number', default: 99 },
      // A bare dot, for "something changed here" with no number yet.
      dot: { type: 'boolean', default: false },
      size: {
         type: 'string',
         default: 'md',
         required: false,
         allowedValues: SIZES,
      },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$badge = this.querySelector('.slice_badge');
      this.$text = this.querySelector('.slice_badge__text');
      // Set before the props arrive: the first setter to run paints both
      // classes, and an unset one painted "slice_badge--undefined".
      this._variant = 'neutral';
      this._size = 'md';

      slice.controller.setComponentProps(this, props);
   }

   _applyClasses() {
      // One modifier class at a time, so a prop change never leaves a stale one.
      for (const v of VARIANTS) this.$badge.classList.remove('slice_badge--' + v);
      for (const s of SIZES) this.$badge.classList.remove('slice_badge--' + s);
      this.$badge.classList.add('slice_badge--' + this._variant);
      this.$badge.classList.add('slice_badge--' + this._size);
   }

   _applyText() {
      // `dot` means "show a bare dot". Nothing is painted, so the label cannot
      // reach assistive tech as text — it becomes the accessible name instead.
      const dotOnly = this._dot === true;
      this.$badge.classList.toggle('slice_badge--dot', dotOnly);
      if (dotOnly) {
         this.$text.textContent = '';
         this.$badge.setAttribute('aria-label', this._label || 'New');
         return;
      }
      this.$badge.removeAttribute('aria-label');

      let text = this._label;
      if (this._value != null) {
         text = this._value > this._max ? `${this._max}+` : String(this._value);
      }
      this.$text.textContent = text;
      this.$badge.hidden = text === '';
   }

   get variant() { return this._variant; }
   set variant(v) {
      this._variant = VARIANTS.includes(v) ? v : 'neutral';
      this._applyClasses();
   }

   get size() { return this._size; }
   set size(v) {
      this._size = SIZES.includes(v) ? v : 'md';
      this._applyClasses();
   }

   get label() { return this._label; }
   set label(v) {
      this._label = v == null ? '' : String(v);
      this._applyText();
   }

   get value() { return this._value; }
   set value(v) {
      this._value = v === null || v === undefined || v === '' ? null : Number(v);
      this._applyText();
   }

   get max() { return this._max; }
   set max(v) {
      this._max = Number(v) || 99;
      this._applyText();
   }

   get dot() { return this._dot; }
   set dot(v) {
      this._dot = v === true;
      this._applyText();
   }
}

customElements.define('slice-badge', Badge);