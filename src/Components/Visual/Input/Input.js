export default class Input extends HTMLElement {

   static props = {
      placeholder: { 
         type: 'string', 
         default: '', 
         required: false 
      },
      value: { 
         type: 'string', 
         default: '', 
         required: false 
      },
      type: { 
         type: 'string', 
         default: 'text' 
      },
      required: { 
         type: 'boolean', 
         default: false 
      },
      disabled: { 
         type: 'boolean', 
         default: false 
      },
      secret: { 
         type: 'boolean', 
         default: false 
      },
      conditions: { 
         type: 'object', 
         default: null 
      },
      // Canonical change handler (§3.1). Fired with the new value on every
      // `input` event; `value` stays readable for pull-style consumers.
      onChange: { 
         type: 'function', 
         default: null 
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$inputContainer = this.querySelector('.slice_input');
      this.$input = this.querySelector('input');
      this.$placeholder = this.querySelector('.slice_input_placeholder');
      this.$eyeIcon = this.querySelector('.slice_eye_icon');

      slice.controller.setComponentProps(this, props);
   }

   init() {
      // Static props ensure type has a default value
      this.$input.type = this.type;

      // Set up placeholder behavior
      if (this.placeholder) {
         this.$placeholder.textContent = this.placeholder;
      }

      // ✅ AÑADIDO: Set up default value
      if (this.value) {
         this.$input.value = this.value;
         this.updateInputState();
      }

      // Set up disabled state
      this.$input.disabled = this.disabled;

      // Set up required state
      if (this.required) {
         this.$inputContainer.classList.add('required');
      }

      // Set up secret functionality for password fields
      if (this.secret && this.type === 'password') {
         this.setupSecretToggle();
      }

      // Set up conditions if provided
      if (this.conditions) {
         this.setupConditions();
      }

      // Set up event listeners
      this.$input.addEventListener('input', () => {
         this.updateInputState();
         if (typeof this._onChange === 'function') this._onChange(this.$input.value);
      });

      // ✅ AÑADIDO: Permitir clic en el placeholder para enfocar el input
      this.$placeholder.addEventListener('click', () => {
         this.$input.focus();
      });

      // ✅ AÑADIDO: También permitir clic en el contenedor para enfocar el input
      this.$inputContainer.addEventListener('click', () => {
         this.$input.focus();
      });

      // Floating label: sube el placeholder también al enfocar
      this.$input.addEventListener('focus', () => {
         this.$placeholder.classList.add('slice_input_focus');
      });
      this.$input.addEventListener('blur', () => {
         this.$placeholder.classList.remove('slice_input_focus');
      });
   }

   setupSecretToggle() {
      // Idempotent: this runs from both the `secret` setter and init(); only wire once.
      if (!this.$eyeIcon || this._secretToggleReady) return;
      this._secretToggleReady = true;

      this.$eyeIcon.style.display = 'block';
      this.$eyeIcon.setAttribute('aria-pressed', 'false');

      // The two glyphs are static markup in Input.html and CSS picks one from the
      // `aria-pressed` state — no innerHTML, and they inherit `currentColor` so
      // they follow the error/disabled theming of the field.
      const toggleVisibility = () => {
         const revealed = this.$input.type === 'text';
         this.$input.type = revealed ? 'password' : 'text';
         this.$eyeIcon.setAttribute('aria-pressed', String(!revealed));
      };

      this.$eyeIcon.addEventListener('click', toggleVisibility);
      // Keyboard support for the non-native toggle (Enter/Space), per a11y baseline §9.
      this.$eyeIcon.addEventListener('keydown', (event) => {
         if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleVisibility();
         }
      });
   }

   setupConditions() {
      const {
         regex,
         minLength = 0,
         maxLength = Infinity,
         minMinusc = 0,
         maxMinusc = Infinity,
         minMayusc = 0,
         maxMayusc = Infinity,
         minNumber = 0,
         maxNumber = Infinity,
         minSymbol = 0,
         maxSymbol = Infinity
      } = this.conditions;

      let regexPattern;
      if (regex) {
         regexPattern = regex;
      } else {
         regexPattern = 
            `^(?=(?:.*[a-z]){${minMinusc},${maxMinusc}})` +
            `(?=(?:.*[A-Z]){${minMayusc},${maxMayusc}})` +
            `(?=(?:.*\\d){${minNumber},${maxNumber}})` +
            `(?=(?:.*[\\W$]){${minSymbol},${maxSymbol}})` +
            `.{${minLength},${maxLength}}$`;
      }

      this._conditions = new RegExp(regexPattern);
   }

   updateInputState() {
      if (this.$input.value !== '') {
         this.$placeholder.classList.add('slice_input_value');
         // `email` is the one constraint the platform gives us for free, so
         // validate it on every keystroke instead of waiting for a manual
         // `validateValue()` call from a submit button.
         if (this._conditions || this.type === 'email') this.validateValue();
         else this.triggerSuccess();
      } else {
         this.$placeholder.classList.remove('slice_input_value');
         // Clear the error state left over from a previous non-empty value
         // before re-evaluating `required`.
         this.triggerSuccess();
         if (this.required) {
            this.triggerError();
         }
      }
   }

   /**
    * Move focus to the real field.
    *
    * Public because wrapper components (a confirm dialog with a text field, a
    * form that focuses its first invalid input) legitimately need it — without
    * it they have to reach into `.slice_input input`, which breaks the moment
    * the internal markup changes.
    */
   focus() {
      this.$input.focus();
   }

   validateValue() {
      if (this._conditions && !this._conditions.test(this.$input.value)) {
         this.triggerError();
         return false;
      }
      // Native constraint validation, for the types the platform validates
      // (notably `email`).
      if (this.type === 'email' && this.$input.value !== '' && !this.$input.validity.valid) {
         this.triggerError();
         return false;
      }
      this.triggerSuccess();
      return true;
   }

   clear() {
      if (this.$input.value !== '') {
         this.$input.value = '';
         this.$placeholder.className = 'slice_input_placeholder';
      }
   }

   triggerSuccess() {
      this.$inputContainer.classList.remove('required', 'error');
   }

   triggerError() {
      this.$inputContainer.classList.add('error', 'required');
      setTimeout(() => {
         this.$inputContainer.classList.remove('error');
      }, 500);
   }

   // Getters and setters for dynamic prop updates
   get value() {
      return this.$input.value;
   }

   set value(newValue) {
      this.$input.value = newValue;
      this.updateInputState();
   }

   get placeholder() {
      return this._placeholder;
   }

   set placeholder(value) {
      this._placeholder = value;
      if (this.$placeholder) {
         this.$placeholder.textContent = value;
      }
   }

   get type() {
      return this._type;
   }

   set type(value) {
      this._type = value;
      if (this.$input) {
         this.$input.type = value;
      }
   }

   get required() {
      return this._required;
   }

   set required(value) {
      this._required = value;
      if (this.$inputContainer) {
         this.$inputContainer.classList.toggle('required', value);
      }
   }

   get disabled() {
      return this._disabled;
   }

   set disabled(value) {
      this._disabled = value;
      if (this.$input) {
         this.$input.disabled = value;
      }
   }

   get secret() {
      return this._secret;
   }

   set secret(value) {
      this._secret = value;
      if (value && this.type === 'password') {
         this.setupSecretToggle();
      }
   }

   get conditions() {
      return this._conditions;
   }

   set conditions(value) {
      this._conditions = value;
      if (value) {
         this.setupConditions();
      }
   }

   set onChange(value) {
      // Accept null/non-function to CLEAR the handler.
      this._onChange = typeof value === 'function' ? value : null;
   }

   get onChange() {
      return this._onChange;
   }
}

customElements.define('slice-input', Input);