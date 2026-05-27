export default class ComponentShowcase extends HTMLElement {

  static props = {
    variants: { type: 'array', default: [] },
    title: { type: 'string', default: '' },
    badgeLabel: { type: 'string', default: 'Variant' }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$root = this.querySelector('.showcase');
    this.$grid = this.querySelector('.showcase-grid');
    this._variantContainers = [];
    this.$title = null;

    slice.controller.setComponentProps(this, props);
  }

  init() {
    this.render();
  }

  get variants() {
    return this._variants;
  }

  set variants(value) {
    this._variants = Array.isArray(value) ? value : [];
    if (this.$grid) {
      this.render();
    }
  }

  get title() {
    return this._title;
  }

  set title(value) {
    this._title = value || '';
    if (this.$root) {
      this.render();
    }
  }

  get badgeLabel() {
    return this._badgeLabel;
  }

  set badgeLabel(value) {
    this._badgeLabel = value || 'Variant';
    if (this.$grid) {
      this.render();
    }
  }

  render() {
    if (!this.$root) return;

    this.$root.innerHTML = '';

    if (this.title) {
      const heading = document.createElement('h3');
      heading.classList.add('showcase-title');
      heading.textContent = this.title;
      this.$root.appendChild(heading);
    }

    const grid = document.createElement('div');
    grid.classList.add('showcase-grid');

    this._variantContainers = [];

    for (const variant of this.variants) {
      const card = document.createElement('div');
      card.classList.add('variant-card');

      const header = document.createElement('div');
      header.classList.add('variant-header');

      const badge = document.createElement('span');
      badge.classList.add('variant-badge');
      badge.textContent = this.badgeLabel;

      const label = document.createElement('span');
      label.classList.add('variant-label');
      label.textContent = variant.label || '';

      header.appendChild(badge);
      header.appendChild(label);

      const preview = document.createElement('div');
      preview.classList.add('variant-preview');

      card.appendChild(header);
      card.appendChild(preview);

      if (variant.description) {
        const desc = document.createElement('p');
        desc.classList.add('variant-description');
        desc.textContent = variant.description;
        card.appendChild(desc);
      }

      grid.appendChild(card);
      this._variantContainers.push(preview);
    }

    this.$root.appendChild(grid);
  }

  getVariantContainer(indexOrLabel) {
    if (typeof indexOrLabel === 'number') {
      return this._variantContainers[indexOrLabel] || null;
    }

    if (typeof indexOrLabel === 'string') {
      const idx = this.variants.findIndex(v => v.label === indexOrLabel);
      return idx !== -1 ? this._variantContainers[idx] : null;
    }

    return null;
  }

  clear() {
    for (const container of this._variantContainers) {
      container.innerHTML = '';
    }
  }
}

customElements.define('slice-component-showcase', ComponentShowcase);
