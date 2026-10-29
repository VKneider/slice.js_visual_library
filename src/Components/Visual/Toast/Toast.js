import { texts } from '../../shared/text/texts.js';

const TOAST_TYPES = new Set(['success', 'error', 'warning', 'info', 'default']);

const TEXTS = {
  close: 'Close notification',
};

// Spanish mirrors TEXTS key by key; the app can override any of them with its dictionary.
const ES = {
  close: 'Cerrar notificación',
};

const t = texts('slice.toast', { en: TEXTS, es: ES });

function resolveType(value) {
  return TOAST_TYPES.has(value) ? value : 'default';
}

export default class Toast extends HTMLElement {
  static props = {
    message: { type: 'string', default: '' },
    type: { type: 'string', default: 'default' },
    duration: { type: 'number', default: 4000 },
    dismissable: { type: 'boolean', default: true },
    customColor: { type: 'object', default: null },
    // Per-instance overrides of any built-in text (see TEXTS).
    texts: { type: 'object', default: null }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$root = this.querySelector('.slice-toast');
    this.$message = this.querySelector('.slice-toast__message');
    this.$close = this.querySelector('.slice-toast__close');
    this.$icon = this.querySelector('.slice-toast__icon');

    this._message = '';
    this._type = 'default';
    this._duration = 4000;
    this._dismissable = true;
    this._customColor = null;
    this._texts = {};
    this._dismissTimer = null;
    this._exitTimer = null;
    this._exiting = false;

    slice.controller.setComponentProps(this, props || {});

    this._handleClose = this._handleClose.bind(this);
  }

  set message(value) {
    this._message = typeof value === 'string' ? value : '';
    if (this.$message) this.$message.textContent = this._message;
  }

  get message() { return this._message; }

  set type(value) {
    this._type = resolveType(value);
    if (this.$root) {
      this.$root.className = this.$root.className
        .replace(/slice-toast--\w+/g, '')
        .trim() + ` slice-toast--${this._type}`;
    }
    if (this.$icon) this.$icon.dataset.type = this._type;
  }

  get type() { return this._type; }

  set duration(value) {
    this._duration = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 4000;
  }

  get duration() { return this._duration; }

  set dismissable(value) {
    this._dismissable = value !== false;
    if (this.$close) {
      this.$close.style.display = this._dismissable ? '' : 'none';
    }
  }

  get dismissable() { return this._dismissable; }

  set customColor(value) {
    this._customColor = value || null;
    // Clear the previous colours first: a reused toast must not keep them.
    if (this.$root) {
      this.$root.style.removeProperty('--toast-bg');
      this.$root.style.removeProperty('--toast-text');
      this.$root.style.removeProperty('--toast-accent');
    }
    if (!this._customColor) return;
    const cc = this._customColor;
    if (cc.background) this.$root.style.setProperty('--toast-bg', cc.background);
    if (cc.text) this.$root.style.setProperty('--toast-text', cc.text);
    if (cc.accent) this.$root.style.setProperty('--toast-accent', cc.accent);
  }

  get customColor() { return this._customColor; }

  get texts() { return this._texts; }
  set texts(value) {
    this._texts = value && typeof value === 'object' ? { ...value } : {};
    this._applyTexts();
  }

  _t(key) {
    return this._texts[key] ?? t(key);
  }

  _applyTexts() {
    if (this.$close) this.$close.setAttribute('aria-label', this._t('close'));
  }

  init() {
    // Always wired: `dismissable` only hides the button, and a toast reused
    // as dismissable must still close on click.
    if (this.$close) {
      this.$close.addEventListener('click', this._handleClose);
    }
    this._applyTexts();
    // A language change repaints the ✕ name; the toast on screen is not touched.
    slice.translator?.watch?.(this, () => this._applyTexts());
    if (!this._message && this.$message) {
      this.$message.textContent = '';
    }
    this.show();
  }

  show() {
    if (this._exiting) return;
    this._startTimer();
    requestAnimationFrame(() => {
      if (this.$root) this.$root.classList.add('slice-toast--visible');
    });
  }

  hide() {
    if (this._exiting) return;
    this._exiting = true;
    this._clearTimer();
    if (this.$root) {
      this.$root.classList.remove('slice-toast--visible');
      this.$root.classList.add('slice-toast--exiting');
    }
    this._exitTimer = setTimeout(() => {
      this._exitTimer = null;
      if (this.parentNode) this.parentNode.removeChild(this);
      this.dispatchEvent(new CustomEvent('toast-dismissed', { bubbles: true }));
    }, 260);
  }

  /**
   * Make a used toast new again, so a provider can pool instances instead of
   * building one per notification. Stops its timers, clears the hidden and
   * exit state, and applies `props` (missing ones go back to their defaults).
   * Call show() once it is back on the page.
   * @param {{ message?: string, type?: string, duration?: number, dismissable?: boolean, customColor?: object|null }} [props]
   */
  reuse(props = {}) {
    this._clearTimer();
    if (this._exitTimer) {
      clearTimeout(this._exitTimer);
      this._exitTimer = null;
    }
    this._exiting = false;
    if (this.$root) this.$root.classList.remove('slice-toast--visible', 'slice-toast--exiting');
    const defaults = Toast.props;
    this.message = props.message ?? defaults.message.default;
    this.type = props.type ?? defaults.type.default;
    this.duration = props.duration ?? defaults.duration.default;
    this.dismissable = props.dismissable ?? defaults.dismissable.default;
    this.customColor = props.customColor ?? null;
    return this;
  }

  _handleClose() {
    this.hide();
  }

  _startTimer() {
    this._clearTimer();
    if (this._duration > 0) {
      this._dismissTimer = setTimeout(() => this.hide(), this._duration);
    }
  }

  _clearTimer() {
    if (this._dismissTimer) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
  }

  disconnectedCallback() {
    this._clearTimer();
  }

  beforeDestroy() {
    this._clearTimer();
    if (this._exitTimer) {
      clearTimeout(this._exitTimer);
      this._exitTimer = null;
    }
    if (this.$close) this.$close.removeEventListener('click', this._handleClose);
  }
}

customElements.define('slice-toast', Toast);