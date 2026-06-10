// Form — a declarative form built from a schema, composing the library's own
// components (Input, Select, Checkbox, Switch, ...). It renders sections,
// separators, per-field labels/descriptions and validation errors, and reads
// values back from each child component. It is a plain Visual, so drop it
// anywhere — a view, a Modal body (`modal.appendBody(form)`), etc.
//
// Schema items are discriminated by `kind`:
//   { kind: 'section',  title, description }
//   { kind: 'separator' }
//   { kind: 'field', name, label, description, component, props, valueProp,
//                    value, required, validate }
//
// - `component` is a Slice component name (built via slice.build).
// - `valueProp` is which prop holds the value (default 'value'; use 'checked'
//   for Checkbox/Switch).
// - `required` is `true` or a custom message; `validate(value, values)` returns
//   an error string (or a falsy value when valid). Validation runs on submit.
export default class Form extends HTMLElement {
  static props = {
    schema: { type: 'array', default: [] },
    submitText: { type: 'string', default: 'Submit' },
    resetText: { type: 'string', default: null },
    onSubmit: { type: 'function', default: null }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$form = this.querySelector('.slice-form');
    this.$fields = this.querySelector('.slice-form__fields');
    this.$actions = this.querySelector('.slice-form__actions');

    this._schema = [];
    this._submitText = 'Submit';
    this._resetText = null;
    this._onSubmit = null;

    this._fields = []; // [{ name, instance, valueProp, config, $error, $field }]
    this._built = []; // every slice.build instance (fields + buttons) to destroy
    this._ready = false;

    this._handleSubmit = this._handleSubmit.bind(this);

    slice.controller.setComponentProps(this, props || {});
  }

  set schema(value) {
    this._schema = Array.isArray(value) ? value : [];
    if (this._ready) this._render();
  }
  get schema() { return this._schema; }

  set submitText(value) {
    this._submitText = typeof value === 'string' ? value : 'Submit';
    if (this._ready) this._render();
  }

  set resetText(value) {
    this._resetText = typeof value === 'string' ? value : null;
    if (this._ready) this._render();
  }

  set onSubmit(value) {
    this._onSubmit = typeof value === 'function' ? value : null;
  }

  async init() {
    this.$form.addEventListener('submit', this._handleSubmit);
    await this._render();
    this._ready = true;
  }

  beforeDestroy() {
    this.$form.removeEventListener('submit', this._handleSubmit);
    // Children built with slice.build are not auto-cascaded on destroy — release
    // them explicitly (a Service among them would never be cleaned otherwise).
    this._destroyBuilt();
    this._fields = [];
  }

  // --- public API ---
  getValues() {
    const values = {};
    for (const field of this._fields) {
      if (field.name && field.instance) values[field.name] = field.instance[field.valueProp];
    }
    return values;
  }

  setValue(name, value) {
    const field = this._fields.find((f) => f.name === name);
    if (field && field.instance) {
      try {
        field.instance[field.valueProp] = value;
      } catch (error) {
        slice.logger?.logWarning?.('Form', `Could not set value for "${name}": ${error.message}`);
      }
    }
  }

  setError(name, message) {
    const field = this._fields.find((f) => f.name === name);
    if (!field) return;
    field.$error.textContent = message || '';
    field.$field.classList.toggle('slice-form__field--error', !!message);
  }

  clearErrors() {
    for (const field of this._fields) {
      field.$error.textContent = '';
      field.$field.classList.remove('slice-form__field--error');
    }
  }

  validate() {
    this.clearErrors();
    const values = this.getValues();
    let valid = true;

    for (const field of this._fields) {
      if (!field.name) continue;
      const value = values[field.name];
      let error = null;

      if (field.config.required && this._isEmpty(value)) {
        error = typeof field.config.required === 'string' ? field.config.required : 'This field is required';
      } else if (typeof field.config.validate === 'function') {
        error = field.config.validate(value, values) || null;
      }

      if (error) {
        this.setError(field.name, error);
        valid = false;
      }
    }
    return valid;
  }

  submit() {
    if (!this.validate()) return false;
    if (this._onSubmit) this._onSubmit(this.getValues());
    return true;
  }

  reset() {
    this.clearErrors();
    for (const field of this._fields) {
      if (field.config.value !== undefined) this.setValue(field.name, field.config.value);
    }
  }

  // --- rendering ---
  async _render() {
    this._destroyBuilt();
    this._fields = [];
    this.$fields.innerHTML = '';
    this.$actions.innerHTML = '';

    for (const item of this._schema) {
      const kind = item.kind || 'field';
      if (kind === 'section') {
        this.$fields.appendChild(this._renderSection(item));
      } else if (kind === 'separator') {
        this.$fields.appendChild(this._renderSeparator());
      } else {
        await this._renderField(item);
      }
    }

    const submit = await slice.build('Button', { value: this._submitText, onClick: () => this.submit() });
    if (submit) {
      this._built.push(submit);
      this.$actions.appendChild(submit);
    }
    if (this._resetText) {
      const reset = await slice.build('Button', {
        value: this._resetText,
        variant: 'outlined',
        onClick: () => this.reset()
      });
      if (reset) {
        this._built.push(reset);
        this.$actions.appendChild(reset);
      }
    }
  }

  _renderSection(item) {
    const section = document.createElement('div');
    section.className = 'slice-form__section';
    if (item.title) {
      const title = document.createElement('h3');
      title.className = 'slice-form__section-title';
      title.textContent = item.title;
      section.appendChild(title);
    }
    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'slice-form__section-desc';
      desc.textContent = item.description;
      section.appendChild(desc);
    }
    return section;
  }

  _renderSeparator() {
    const hr = document.createElement('hr');
    hr.className = 'slice-form__separator';
    return hr;
  }

  async _renderField(config) {
    const valueProp = config.valueProp || 'value';

    const wrap = document.createElement('div');
    wrap.className = 'slice-form__field';
    if (config.name) wrap.dataset.name = config.name;

    if (config.label) {
      const label = document.createElement('label');
      label.className = 'slice-form__label';
      label.textContent = config.label;
      if (config.required) {
        const star = document.createElement('span');
        star.className = 'slice-form__required';
        star.setAttribute('aria-hidden', 'true');
        star.textContent = ' *';
        label.appendChild(star);
      }
      wrap.appendChild(label);
    }
    if (config.description) {
      const desc = document.createElement('p');
      desc.className = 'slice-form__description';
      desc.textContent = config.description;
      wrap.appendChild(desc);
    }

    const props = { ...(config.props || {}) };
    if (config.value !== undefined) props[valueProp] = config.value;
    const instance = await slice.build(config.component, props);
    if (instance) {
      this._built.push(instance);
      wrap.appendChild(instance);
    }

    const error = document.createElement('div');
    error.className = 'slice-form__error';
    error.setAttribute('role', 'alert');
    wrap.appendChild(error);

    this.$fields.appendChild(wrap);
    this._fields.push({ name: config.name, instance, valueProp, config, $error: error, $field: wrap });
  }

  _handleSubmit(event) {
    event.preventDefault();
    this.submit();
  }

  _destroyBuilt() {
    if (this._built.length) {
      slice.controller.destroyComponent(this._built);
      this._built = [];
    }
  }

  _isEmpty(value) {
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }
}

customElements.define('slice-form', Form);
