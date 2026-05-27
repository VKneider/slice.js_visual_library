export default class DemoBox extends HTMLElement {

  static props = {
    label: { type: 'string', default: 'Demo' },
    expected: { type: 'string', default: '' }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$label = this.querySelector('.demobox-label');
    this.$expected = this.querySelector('.demobox-expected');
    this.$code = this.querySelector('.demobox-code');
    this.$preview = this.querySelector('.demobox-preview');

    slice.controller.setComponentProps(this, props);
  }

  init() {
    if (!this.expected) {
      this.$expected.style.display = 'none';
    }
  }

  get label() {
    return this._label;
  }

  set label(value) {
    this._label = value;
    if (this.$label) this.$label.textContent = value;
  }

  get expected() {
    return this._expected;
  }

  set expected(value) {
    this._expected = value;
    if (this.$expected) {
      this.$expected.textContent = value;
      this.$expected.style.display = value ? '' : 'none';
    }
  }

  appendCode(node) {
    if (node instanceof Node) {
      this.$code.appendChild(node);
    }
  }

  appendDemo(node) {
    if (node instanceof Node) {
      this.$preview.appendChild(node);
    }
  }

  clear() {
    this.$preview.innerHTML = '';
  }
}

customElements.define('slice-demo-box', DemoBox);
