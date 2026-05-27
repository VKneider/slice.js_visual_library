export default class PropsTable extends HTMLElement {

  static props = {
    props: {
      type: 'array',
      default: []
    }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$header = this.querySelector('.props-header');
    this.$body = this.querySelector('.props-body');
    this.$title = this.querySelector('.props-title');
    this.$count = this.querySelector('.props-count');
    this.$tbody = this.querySelector('tbody');

    slice.controller.setComponentProps(this, props);
  }

  init() {
    this.render();
  }

  get props() {
    return this._props;
  }

  set props(value) {
    this._props = Array.isArray(value) ? value : [];
    if (this.$tbody) {
      this.render();
    }
  }

  render() {
    if (!this.$tbody) return;

    const items = this.props;
    this.$count.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

    this.$tbody.innerHTML = '';

    for (const prop of items) {
      const tr = document.createElement('tr');
      tr.innerHTML = this.renderRow(prop);
      this.$tbody.appendChild(tr);
    }
  }

  renderRow(prop) {
    const isNested = prop.path && prop.path.includes('.');
    const nameClass = isNested ? 'prop-name-nested' : '';

    const typeHtml = prop.type ? `<code>${this.escapeHtml(prop.type)}</code>` : '-';

    const requiredHtml = prop.required
      ? '<span class="prop-required-true">required</span>'
      : '<span class="prop-required-false">optional</span>';

    const defaultHtml = prop.default !== undefined && prop.default !== null
      ? `<code>${this.escapeHtml(String(prop.default))}</code>`
      : '<span style="color: var(--medium-color)">—</span>';

    const allowedHtml = Array.isArray(prop.allowedValues) && prop.allowedValues.length > 0
      ? `<span class="prop-allowed">${prop.allowedValues.map(v => `<code>${this.escapeHtml(String(v))}</code>`).join('')}</span>`
      : '<span style="color: var(--medium-color)">—</span>';

    return `
      <td class="${nameClass}"><code>${this.escapeHtml(prop.path || prop.name || '')}</code></td>
      <td>${typeHtml}</td>
      <td>${requiredHtml}</td>
      <td>${defaultHtml}</td>
      <td>${allowedHtml}</td>
    `;
  }

  escapeHtml(text) {
    if (typeof text !== 'string') return String(text);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('slice-props-table', PropsTable);
