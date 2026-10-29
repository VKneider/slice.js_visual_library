import { texts } from '../../shared/text/texts.js';

const TEXTS = {
  label: 'Toggle theme',
};

// Spanish mirrors TEXTS key by key; the app can override any of them with its dictionary.
const ES = {
  label: 'Cambiar tema',
};

const t = texts('slice.themeSelector', { en: TEXTS, es: ES });

export default class ThemeSelector extends HTMLElement {
  static props = {
    // Per-instance overrides of any built-in text (see TEXTS).
    texts: { type: 'object', default: null },
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);
    this._texts = {};
    slice.controller.setComponentProps(this, props);
  }

  async init() {
    this.$toggle = this.querySelector('.theme-toggle');
    this.$light = this.querySelector('.toggle-light');
    this.$dark = this.querySelector('.toggle-dark');

    this.currentTheme = slice.stylesManager?.themeManager?.currentTheme || 'LIGHT';
    this.syncActive();

    this._applyTexts();
    // A language change repaints the toggle's name; the applied theme is not touched.
    slice.translator?.watch?.(this, () => this._applyTexts());

    this.$toggle.addEventListener('click', () => this.toggle());

    document.addEventListener('themeChanged', (event) => {
      this.currentTheme = event.detail.themeName;
      this.syncActive();
    });
  }

  get texts() { return this._texts; }
  set texts(value) {
    this._texts = value && typeof value === 'object' ? { ...value } : {};
    this._applyTexts();
  }

  _t(key) {
    return this._texts[key] ?? t(key);
  }

  /** The template ships the English name; the locale may say otherwise. */
  _applyTexts() {
    if (this.$toggle) this.$toggle.setAttribute('aria-label', this._t('label'));
  }

  syncActive() {
    this.$light.classList.toggle('active', this.currentTheme === 'LIGHT');
    this.$dark.classList.toggle('active', this.currentTheme === 'DARK');
  }

  async toggle() {
    const next = this.currentTheme === 'LIGHT' ? 'DARK' : 'LIGHT';
    this.$toggle.classList.add('loading');
    try {
      await slice.setTheme(next);
      this.currentTheme = next;
      this.syncActive();
      document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { themeName: next }
      }));
    } catch (error) {
      console.error('Error changing theme:', error);
    } finally {
      this.$toggle.classList.remove('loading');
    }
  }
}

customElements.define('slice-theme-selector', ThemeSelector);
