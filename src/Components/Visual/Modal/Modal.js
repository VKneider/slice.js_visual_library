export default class Modal extends HTMLElement {
  static props = {
    open: { type: 'boolean', default: false },
    title: { type: 'string', default: '' },
    dismissable: { type: 'boolean', default: true },
    width: { type: 'string', default: '' },
    maxWidth: { type: 'string', default: '' },
    customColor: { type: 'object', default: null },
    onClose: { type: 'function', default: null }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$dialog = this.querySelector('.slice-modal');
    this.$title = this.querySelector('.slice-modal__title');
    this.$body = this.querySelector('.slice-modal__body');
    this.$footer = this.querySelector('.slice-modal__footer');
    this.$close = this.querySelector('.slice-modal__close');

    this._open = false;
    this._title = '';
    this._dismissable = true;
    this._customColor = null;
    this._onClose = null;

    slice.controller.setComponentProps(this, props || {});

    this._handleClose = this._handleClose.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleDialogClose = this._handleDialogClose.bind(this);
    this._handleBackdropClick = this._handleBackdropClick.bind(this);
  }

  set open(value) {
    this._open = value === true;
  }

  get open() { return this._open; }

  set title(value) {
    this._title = typeof value === 'string' ? value : '';
    if (this.$title) this.$title.textContent = this._title;
  }

  get title() { return this._title; }

  set dismissable(value) {
    this._dismissable = value !== false;
    if (this.$close) {
      this.$close.style.display = this._dismissable ? '' : 'none';
    }
  }

  get dismissable() { return this._dismissable; }

  set width(value) {
    if (value && this.$dialog) {
      this.$dialog.style.setProperty('--modal-width', value);
    }
  }

  set maxWidth(value) {
    if (value && this.$dialog) {
      this.$dialog.style.setProperty('--modal-max-width', value);
    }
  }

  set customColor(value) {
    this._customColor = value || null;
    if (!this._customColor || !this.$dialog) return;
    if (this._customColor.background) this.$dialog.style.setProperty('--modal-bg', this._customColor.background);
    if (this._customColor.text) this.$dialog.style.setProperty('--modal-text', this._customColor.text);
    if (this._customColor.accent) this.$dialog.style.setProperty('--modal-accent', this._customColor.accent);
  }

  get customColor() { return this._customColor; }

  set onClose(value) {
    this._onClose = typeof value === 'function' ? value : null;
  }

  get onClose() { return this._onClose; }

  showModal() {
    this._open = true;
    this.removeAttribute('open');
    if (this.$dialog) this.$dialog.showModal();
  }

  close(result) {
    this._open = false;
    if (result !== undefined) {
      this.$dialog.close(result);
    } else {
      this.$dialog.close();
    }
  }

  init() {
    if (this.$close) {
      this.$close.addEventListener('click', this._handleClose);
    }
    this.$dialog.addEventListener('keydown', this._handleKeyDown);
    this.$dialog.addEventListener('close', this._handleDialogClose);
    this.$dialog.addEventListener('click', this._handleBackdropClick);
    if (this._open) {
      requestAnimationFrame(() => {
        if (this.isConnected && this._open) {
          this.$dialog.showModal();
        }
      });
    }
  }

  _handleClose() {
    this.close();
  }

  _handleKeyDown(event) {
    if (event.key === 'Escape' && !this._dismissable) {
      event.preventDefault();
    }
  }

  _handleDialogClose() {
    this._open = false;
    if (typeof this._onClose === 'function') {
      this._onClose({ returnValue: this.$dialog.returnValue });
    }
  }

  _handleBackdropClick(event) {
    if (event.target === this.$dialog && this._dismissable) {
      this.close();
    }
  }

  disconnectedCallback() {
    this.$dialog.removeEventListener('click', this._handleBackdropClick);
    this.$dialog.removeEventListener('keydown', this._handleKeyDown);
  }

  beforeDestroy() {
    if (this._open) {
      this.$dialog.close();
    }
    this.$dialog.removeEventListener('keydown', this._handleKeyDown);
    this.$dialog.removeEventListener('close', this._handleDialogClose);
  }
}

customElements.define('slice-modal', Modal);
