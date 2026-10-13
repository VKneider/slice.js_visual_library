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
    onSubmit: { type: 'function', default: null },

    // Label for the button that advances a step. On the last step the button
    // becomes the submit button and shows submitText instead.
    nextText: { type: 'string', default: 'Next' },

    // 'card' draws a raised surface; 'plain' is rhythm only, for a form that
    // already sits inside one (a Modal body, a Card). Not auto-detected -
    // guessing from the ancestor is worse than being explicit.
    variant: { type: 'string', default: 'card' },

    // Field grid columns. 1 is the plain stack; 2 is what makes a form read as
    // designed. A field opts out of sharing a row with `full: true`.
    columns: { type: 'number', default: 1 },

    // Cap on the form's width, so a single text field is not as wide as the
    // page. A long line of text to read into is a real usability problem, and
    // it is the single thing that most made the old demos look unfinished.
    maxWidth: { type: 'string', default: null }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$form = this.querySelector('.slice-form');
    this.$fields = this.querySelector('.slice-form__fields');
    this.$actions = this.querySelector('.slice-form__actions');

    this._schema = [];
    this._submitText = 'Submit';
    this._nextText = 'Next';
    this._resetText = null;
    this._onSubmit = null;
    this._variant = 'card';
    this._columns = 1;
    this._maxWidth = null;
    // Steps. Every schema is grouped into steps; a plain schema is just a
    // single implicit one, so there is no separate code path to keep correct.
    this._steps = [];
    this._stepIndex = 0;

    this._fields = []; // [{ name, instance, valueProp, config, $error, $field }]
    this._built = []; // every slice.build instance (fields + buttons) to destroy
    this._ready = false;
    // In-flight render guard. The setters fire synchronously, so two schema
    // changes in one tick both used to pass a boolean check and interleave their
    // awaits — each destroying the other's half-built fields and leaving a
    // duplicated form. Guarding with the PROMISE closes the gap: there is no
    // await between the check and the assignment.
    this._rendering = null;

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

  set nextText(value) {
    this._nextText = typeof value === 'string' ? value : 'Next';
    this._syncActionLabels();
  }

  set onSubmit(value) {
    this._onSubmit = typeof value === 'function' ? value : null;
  }

  // Presentation props. These only drive attributes and CSS custom properties,
  // so they re-render like the text props do rather than needing their own
  // update path.
  set variant(value) {
    this._variant = value === 'plain' ? 'plain' : 'card';
    if (this._ready) this._render();
  }
  get variant() { return this._variant; }

  set columns(value) {
    const n = Number(value);
    this._columns = Number.isFinite(n) && n >= 1 && n <= 4 ? Math.round(n) : 1;
    if (this._ready) this._render();
  }
  get columns() { return this._columns; }

  set maxWidth(value) {
    this._maxWidth = typeof value === 'string' && value.trim() ? value.trim() : null;
    if (this._ready) this._render();
  }
  get maxWidth() { return this._maxWidth; }

  async init() {
    this.$form.addEventListener('submit', this._handleSubmit);
    await this._render();
    this._ready = true;
  }

  async beforeDestroy() {
    this.$form.removeEventListener('submit', this._handleSubmit);
    // An in-flight render would otherwise keep building fields into a detached
    // form and push them onto _built after the teardown below.
    await (this._rendering || Promise.resolve()).catch(() => {});
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

  /**
   * Validate the form, or just the fields on one step.
   * @param {number[]} [stepIndexes] restrict to these steps
   */
  validate(stepIndexes = null) {
    const scope = stepIndexes
      ? this._fields.filter((f) => stepIndexes.includes(f.step))
      : this._fields;

    // Clear only what is about to be checked. On a stepped form, clearing
    // everything first would wipe the errors on the steps you already passed.
    for (const field of scope) {
      field.$error.textContent = '';
      field.$field.classList.remove('slice-form__field--error');
    }

    const values = this.getValues();
    let valid = true;

    for (const field of scope) {
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

  /** Number of steps. 1 for a plain schema. */
  get stepCount() {
    return this._steps.length;
  }

  /** Zero-based index of the step on screen. */
  get stepIndex() {
    return this._stepIndex;
  }

  get isStepped() {
    return this._steps.length > 1;
  }

  /**
   * Advance, but only if the steps BEHIND the current one are valid. Returns
   * false and paints the errors in place when they are not.
   */
  nextStep() {
    if (!this.isStepped) return false;
    if (this._stepIndex >= this._steps.length - 1) return false;

    const done = Array.from({ length: this._stepIndex + 1 }, (_, i) => i);
    if (!this.validate(done)) return false;

    this._stepIndex += 1;
    this._syncSteps();
    return true;
  }

  /** Go back. Never validates - leaving a step does not make it invalid. */
  prevStep() {
    if (!this.isStepped || this._stepIndex === 0) return false;
    this._stepIndex -= 1;
    this._syncSteps();
    return true;
  }

  /**
   * Jump to a step, from the progress indicator.
   *
   * Forward jumps are gated exactly like Next: the steps being skipped over
   * must validate. Without that, clicking step 3 in the indicator would be a
   * way around every check Next enforces - the indicator would be a hole in
   * the form rather than a shortcut through it. Going BACK is always allowed.
   *
   * @returns {boolean} whether the move happened
   */
  gotoStep(index) {
    if (!this.isStepped) return false;
    const target = Math.max(0, Math.min(index, this._steps.length - 1));
    if (target === this._stepIndex) return false;

    if (target > this._stepIndex) {
      const passed = Array.from({ length: target }, (_, i) => i);
      if (!this.validate(passed)) return false;
    }

    this._stepIndex = target;
    this._syncSteps();
    return true;
  }

  /**
   * @param {boolean} announce pass false on the INITIAL render. Announcing
   * "Step 1 of 3" the moment a page loads is noise: a screen reader already
   * reads the content on arrival. Only a CHANGE the user made is announced.
   */
  _syncSteps(announce = true) {
    for (const [i, box] of this.$steps.entries()) {
      box.hidden = i !== this._stepIndex;
    }
    if (this.$progress) {
      for (const [i, item] of this.$progressItems.entries()) {
        const state = i === this._stepIndex ? 'current' : i < this._stepIndex ? 'done' : 'todo';
        item.dataset.state = state;
        if (item.firstElementChild) {
          item.firstElementChild.setAttribute('aria-current', state === 'current' ? 'step' : 'false');
        }
      }
    }
    this._syncActionLabels();
    if (announce) this._announceStep();
  }

  /**
   * Announce the step change to assistive tech.
   *
   * This used to move FOCUS to the new step's heading, which a screen reader
   * announces - but it painted a focus ring around the heading that read as a
   * text input sitting on the page. A polite live region announces the same
   * thing with nothing drawn, which is the standard pattern for a wizard and
   * does not fight the user's eyes.
   */
  _announceStep() {
    if (!this.$live) return;
    const step = this._steps[this._stepIndex];
    const where = `Step ${this._stepIndex + 1} of ${this._steps.length}`;
    this.$live.textContent = step?.label ? `${where}: ${step.label}` : where;
  }

  _syncActionLabels() {
    const last = this._steps.length - 1;
    if (this.$nextBtn) {
      this.$nextBtn.value = this._stepIndex >= last ? this._submitText : this._nextText;
      this.$nextBtn.hidden = !this.isStepped;
    }
    if (this.$backBtn) {
      this.$backBtn.hidden = !this.isStepped || this._stepIndex === 0;
    }
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
  /**
   * Queue a render. Concurrent callers chain onto the in-flight one instead of
   * racing it, and a rejection does not poison the queue for the next render.
   */
  _render() {
    // Presentation attributes live on the HOST, not the inner <form>, so the
    // CSS can key off them and so a consumer can target the component.
    this.dataset.variant = this._variant;
    this.style.setProperty('--form-columns', String(this._columns));
    if (this._maxWidth) this.style.setProperty('--form-control', this._maxWidth);
    else this.style.removeProperty('--form-control');

    const run = () => this._renderOnce();
    const previous = this._rendering || Promise.resolve();
    const current = previous.then(run, run);
    this._rendering = current;
    return current.finally(() => {
      if (this._rendering === current) this._rendering = null;
    });
  }

  /**
   * Group the schema into steps.
   *
   * A schema with no `kind: 'step'` still produces ONE implicit step, so
   * there is no separate single-page code path to keep correct - stepping is
   * always what the renderer does, it just happens to have nothing to step
   * between. Items declared before the first step land in an unlabelled
   * leading step rather than being silently dropped.
   */
  _groupSteps() {
    const steps = [];
    let current = null;

    for (const item of this._schema) {
      if ((item.kind || 'field') === 'step') {
        current = {
          label: item.label || item.title || '',
          description: item.description || '',
          items: Array.isArray(item.schema) ? item.schema : [],
        };
        steps.push(current);
        continue;
      }
      if (!current) {
        current = { label: '', description: '', items: [], implicit: true };
        steps.push(current);
      }
      current.items.push(item);
    }

    return steps;
  }

  async _renderOnce() {
    this._destroyBuilt();
    this._fields = [];
    this.$fields.innerHTML = '';
    this.$actions.innerHTML = '';
    this.$steps = [];
    this.$progress = null;
    this.$progressItems = [];
    this.$live = null;
    this.$backBtn = null;
    this.$nextBtn = null;

    this._steps = this._groupSteps();
    this._stepIndex = Math.min(this._stepIndex, Math.max(0, this._steps.length - 1));

    if (this.isStepped) await this._renderProgress();

    for (const [i, step] of this._steps.entries()) {
      const box = document.createElement('div');
      box.className = 'slice-form__step';
      box.dataset.step = String(i);
      this.$steps.push(box);

      if (step.label) {
        const heading = document.createElement('h3');
        heading.className = 'slice-form__step-title';
        heading.dataset.stepHeading = '';
        heading.textContent = step.label;
        box.appendChild(heading);
      }
      if (step.description) {
        const desc = document.createElement('p');
        desc.className = 'slice-form__step-desc';
        desc.textContent = step.description;
        box.appendChild(desc);
      }

      for (const item of step.items) {
        const kind = item.kind || 'field';
        if (kind === 'section') box.appendChild(this._renderSection(item));
        else if (kind === 'separator') box.appendChild(this._renderSeparator());
        else await this._renderField(item, box, i);
      }

      this.$fields.appendChild(box);
    }

    // Back comes FIRST in the DOM so a stray Enter lands on the safe action,
    // the same reasoning the original used for cancel-before-confirm.
    if (this.isStepped) {
      const back = await slice.build('Button', {
        value: 'Back',
        variant: 'outlined',
        onClick: () => this.prevStep(),
      });
      if (back) {
        this._built.push(back);
        this.$backBtn = back;
        this.$actions.appendChild(back);
      }
    }

    const submit = await slice.build('Button', { value: this._submitText, onClick: () => this.submit() });
    if (submit) {
      this._built.push(submit);
      this.$nextBtn = submit;
      this.$actions.appendChild(submit);
    }

    if (this._resetText) {
      const reset = await slice.build('Button', {
        value: this._resetText,
        variant: 'ghost',
        onClick: () => this.reset()
      });
      if (reset) {
        this._built.push(reset);
        this.$actions.appendChild(reset);
      }
    }

    for (const [i, box] of this.$steps.entries()) box.hidden = i !== this._stepIndex;
    this._syncSteps(false);
  }

  /**
   * The progress indicator. Clickable steps are a convenience, NOT a bypass:
   * `gotoStep` refuses to jump FORWARD past a step that does not validate,
   * because Next would refuse too.
   */
  async _renderProgress() {
    const nav = document.createElement('ol');
    nav.className = 'slice-form__progress';
    nav.setAttribute('aria-label', 'Form progress');

    for (const [i, step] of this._steps.entries()) {
      const btn = await slice.build('Button', {
        value: step.label || `Step ${i + 1}`,
        variant: 'ghost',
        onClick: () => this.gotoStep(i),
      });
      if (!btn) continue;

      const li = document.createElement('li');
      li.className = 'slice-form__progress-step';
      li.appendChild(btn);
      this._built.push(btn);
      nav.appendChild(li);
      this.$progressItems.push(li);
    }

    // Visually hidden, still announced. See _announceStep.
    this.$live = document.createElement('p');
    this.$live.className = 'slice-form__live';
    this.$live.setAttribute('aria-live', 'polite');
    this.$live.setAttribute('role', 'status');

    if (this.$progressItems.length) {
      this.$progress = nav;
      this.$form.insertBefore(nav, this.$fields);
    }
    this.$form.appendChild(this.$live);
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

  async _renderField(config, target, stepIndex = 0) {
    // Which container this field lands in. A stepped form passes its own step
    // box; everything else appends to the shared field list.
    const host = target || this.$fields;
    const valueProp = config.valueProp || 'value';

    const wrap = document.createElement('div');
    wrap.className = 'slice-form__field';
    if (config.name) wrap.dataset.name = config.name;

    // `full: true` keeps a field out of the shared grid row - the escape hatch
    // for an address, a textarea, or a switch row that reads badly at half
    // width.
    if (config.full === true) wrap.dataset.full = 'true';

    // Marked up front so CSS can style the whole field even though the
    // diagnosis below may append more children after this point.
    if (!config.component) wrap.dataset.broken = 'true';

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
    const instance = config.component ? await slice.build(config.component, props) : null;

    if (instance) {
      this._built.push(instance);
      wrap.appendChild(instance);
    } else {
      // slice.build returns null for an unregistered name, and a schema item
      // may simply omit `component`. Either way this used to fall through the
      // `if (instance)` and leave a label and an error slot with NOTHING
      // between them - which reads as a layout accident, not as a broken
      // schema, and the field then vanishes from getValues() with no way for
      // the caller to tell why.
      //
      // So: say it in the console, and say it on screen too.
      const reason = config.component
        ? `"${config.component}" is not a registered component`
        : 'the schema item has no `component`';
      slice.logger.logWarning(
        this.sliceId,
        `Form field "${config.name || config.label || '(unnamed)'}" rendered no control: ` +
          `${reason}. It is shown as broken and will be absent from getValues().`
      );

      wrap.dataset.broken = 'true';
      const note = document.createElement('p');
      note.className = 'slice-form__broken';
      note.setAttribute('role', 'note');
      note.textContent = config.component
        ? `Missing component "${config.component}"`
        : 'No component declared for this field';
      wrap.appendChild(note);
    }

    const error = document.createElement('div');
    error.className = 'slice-form__error';
    error.setAttribute('role', 'alert');
    wrap.appendChild(error);

    // A stepped form passes its own step box; everything else appends to the
    // shared field list.
    (target || this.$fields).appendChild(wrap);
    this._fields.push({
      name: config.name,
      instance,
      valueProp,
      config,
      $error: error,
      $field: wrap,
      // Which step this field belongs to, so validate([n]) can scope itself.
      step: stepIndex,
    });
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
