export default class Tabs extends HTMLElement {
  static props = {
    items: {
      type: 'array',
      default: [],
      required: false,
      items: {
        type: 'object',
        schema: {
          id: { type: 'string', required: true },
          label: { type: 'string', required: true }
        }
      }
    },
    activeTab: {
      type: 'string',
      default: '',
      required: false
    },
    onTabChange: {
      type: 'function',
      default: null,
      required: false
    }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$list = this.querySelector('.slice_tabs_list');

    this._items = [];
    this._activeTab = '';
    this._onTabChange = null;

    slice.controller.setComponentProps(this, props || {});
  }

  init() {
    this.renderTabs();
  }

  get items() {
    return this._items;
  }

  set items(value) {
    this._items = Array.isArray(value) ? value : [];
    this.renderTabs();
  }

  get activeTab() {
    return this._activeTab;
  }

  set activeTab(value) {
    this._activeTab = typeof value === 'string' ? value : '';
    this.updateActiveButton();
  }

  get onTabChange() {
    return this._onTabChange;
  }

  set onTabChange(value) {
    this._onTabChange = typeof value === 'function' ? value : null;
  }

  renderTabs() {
    if (!this.$list) return;

    this.$list.innerHTML = '';
    if (!Array.isArray(this._items) || this._items.length === 0) return;

    const hasActive = this._items.some((item) => item && item.id === this._activeTab);
    if (!hasActive) {
      const first = this._items[0];
      this._activeTab = first && typeof first.id === 'string' ? first.id : '';
    }

    this._items.forEach((item) => {
      if (!item || typeof item.id !== 'string' || typeof item.label !== 'string') {
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slice_tab_button';
      button.textContent = item.label;
      button.setAttribute('role', 'tab');
      button.dataset.tabId = item.id;

      button.addEventListener('click', () => {
        this.activeTab = item.id;
        if (typeof this._onTabChange === 'function') {
          this._onTabChange(item.id);
        }
        this.dispatchEvent(new CustomEvent('tab-change', { detail: { tabId: item.id } }));
      });

      this.$list.appendChild(button);
    });

    this.updateActiveButton();
  }

  updateActiveButton() {
    if (!this.$list) return;

    const buttons = this.$list.querySelectorAll('.slice_tab_button');
    buttons.forEach((button) => {
      const isActive = button.dataset.tabId === this._activeTab;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }
}

customElements.define('slice-tabs', Tabs);
