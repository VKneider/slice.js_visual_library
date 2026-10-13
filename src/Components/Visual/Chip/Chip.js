const VARIANTS = ['neutral', 'accent', 'success', 'warning', 'danger'];
const SIZES = ['sm', 'md'];

export default class Chip extends HTMLElement {

   static props = {
      label: { type: 'string', default: '' },
      icon: { type: 'string', default: '' },
      variant: {
         type: 'string',
         default: 'neutral',
         required: false,
         allowedValues: VARIANTS,
      },
      size: {
         type: 'string',
         default: 'md',
         required: false,
         allowedValues: SIZES,
      },
      disabled: { type: 'boolean', default: false },
      // A removable chip renders a real <button> for the remove affordance, so
      // it is reachable by keyboard and announced.
      removable: { type: 'boolean', default: false },
      removeLabel: { type: 'string', default: 'Remove' },
      onRemove: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      // Modifier classes live on the inner element, which is what the component
      // CSS targets (`slice-chip .slice_chip--*`); the host stays clean.
      this.$chip = this.querySelector('.slice_chip');
      this.$iconSlot = this.querySelector('[data-el="icon"]');
      this.$label = this.querySelector('[data-el="label"]');
      this.$remove = this.querySelector('[data-el="remove"]');

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this._inited = true;
      this.$remove.addEventListener('click', (event) => {
         event.preventDefault();
         event.stopPropagation();
         if (this._disabled) return;
         if (typeof this._onRemove === 'function') this._onRemove(this._label);
      });

      this._applyClasses();
      this._applyText();
      await this._renderIcon();
   }

   beforeDestroy() {
      if (this._iconEl) {
         slice.controller.destroyComponent(this._iconEl);
         this._iconEl = null;
      }
   }

   _applyClasses() {
      for (const v of VARIANTS) this.$chip.classList.remove('slice_chip--' + v);
      for (const s of SIZES) this.$chip.classList.remove('slice_chip--' + s);
      this.$chip.classList.add('slice_chip--' + this._variant);
      this.$chip.classList.add('slice_chip--' + this._size);
      this.$chip.classList.toggle('is-disabled', this._disabled === true);
      this.$chip.classList.toggle('is-removable', this._removable === true);
   }

   _applyText() {
      this.$label.textContent = this._label;
      this.$remove.hidden = this._removable !== true;
      this.$remove.setAttribute('aria-label', `${this._removeLabel}: ${this._label}`);
      this.$remove.title = this._removeLabel;
   }

   async _renderIcon() {
      // The setters run from the constructor via setComponentProps, before the
      // element is connected; building there would orphan a child when init()
      // builds the real one.
      if (!this._inited) return;
      if (this._iconEl) {
         slice.controller.destroyComponent(this._iconEl);
         this._iconEl = null;
      }
      this.$iconSlot.replaceChildren();
      if (!this._icon) return;
      this._iconEl = await slice.build('Icon', {
         name: this._icon,
         size: this._size === 'sm' ? 'small' : 'medium',
         color: 'currentColor',
      });
      this.$iconSlot.appendChild(this._iconEl);
   }

   get label() { return this._label; }
   set label(v) {
      this._label = v == null ? '' : String(v);
      this._applyText();
   }

   get icon() { return this._icon; }
   set icon(v) { this._icon = v || ''; this._renderIcon(); }

   get variant() { return this._variant; }
   set variant(v) {
      this._variant = VARIANTS.includes(v) ? v : 'neutral';
      this._applyClasses();
   }

   get size() { return this._size; }
   set size(v) {
      this._size = SIZES.includes(v) ? v : 'md';
      this._applyClasses();
      this._renderIcon();
   }

   get disabled() { return this._disabled; }
   set disabled(v) {
      this._disabled = v === true;
      this._applyClasses();
   }

   get removable() { return this._removable; }
   set removable(v) {
      this._removable = v === true;
      this._applyClasses();
      this._applyText();
   }

   get removeLabel() { return this._removeLabel; }
   set removeLabel(v) {
      this._removeLabel = v || 'Remove';
      this._applyText();
   }

   get onRemove() { return this._onRemove; }
   set onRemove(v) { this._onRemove = typeof v === 'function' ? v : null; }
}

customElements.define('slice-chip', Chip);