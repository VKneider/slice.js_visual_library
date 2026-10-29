import { texts } from '../../shared/text/texts.js';

const TEXTS = {
   label: 'Theme',
};

// Spanish mirrors TEXTS key by key; the app can override any of them with its dictionary.
const ES = {
   label: 'Tema',
};

const t = texts('slice.themeSwitcher', { en: TEXTS, es: ES });

export default class ThemeSwitcher extends HTMLElement {
   static props = {
      themes: { type: 'array', default: ['LIGHT', 'DARK'] },
      variant: { type: 'string', default: 'button', allowedValues: ['button', 'menu-item'] },
      label: { type: 'string', default: 'Theme' },
      // Per-instance overrides of any built-in text (see TEXTS).
      texts: { type: 'object', default: null },
      // Per-theme presentation: `{ LIGHT: { label: 'Light', icon: 'sun' } }`.
      // Opt-in and empty by default, so the raw registered theme name keeps
      // showing unless the consumer supplies names — no surprise rename.
      display: { type: 'object', default: null },
      onChange: { type: 'function', default: null },
   };

   // Shown when the current theme has no entry in `display`, so a custom theme
   // never renders an empty control.
   static FALLBACK_ICON = 'palette';

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$btn = this.querySelector('.theme-switcher');
      this.$iconSlot = this.querySelector('.theme-switcher__icon');
      this.$label = this.querySelector('.theme-switcher__label');
      this.$value = this.querySelector('.theme-switcher__value');

      // Keep every theme control in the app (selector, switcher, menus) in sync.
      this._onThemeChanged = (e) => this._sync(e.detail?.themeName);

      this._label = null;
      this._texts = {};
      this.$btn.addEventListener('click', () => this.cycle());

      slice.controller.setComponentProps(this, props);
   }

   init() {
      document.addEventListener('themeChanged', this._onThemeChanged);
      this._paintLabel();
      // A language change repaints the label and the current theme name; the
      // applied theme is not touched.
      slice.translator?.watch?.(this, () => {
         this._paintLabel();
         this._sync();
      });
      this._sync();
   }

   beforeDestroy() {
      document.removeEventListener('themeChanged', this._onThemeChanged);
      if (this.$icon) {
         slice.controller.destroyComponent(this.$icon);
         this.$icon = null;
      }
   }

   /** Advance to the next theme in `themes`, wrapping around at the end. */
   async cycle() {
      const list = this._themes;
      const current = this._currentTheme();
      const next = list[(list.indexOf(current) + 1) % list.length];
      await this.setTheme(next);
   }

   /** Apply a theme by name and notify every other theme control. */
   async setTheme(name) {
      try {
         await slice.setTheme(name);
         document.dispatchEvent(new CustomEvent('themeChanged', { detail: { themeName: name } }));
         if (typeof this._onChange === 'function') this._onChange(name);
      } catch (error) {
         slice.logger.logError('ThemeSwitcher', `Could not switch to theme "${name}"`, error);
      }
      this._sync(name);
   }

   _currentTheme() {
      return (
         slice.stylesManager?.themeManager?.currentTheme ||
         slice.theme ||
         this._themes[0]
      );
   }

   _sync(name) {
      const current = name || this._currentTheme();
      const entry = this._display?.[current];
      // An unregistered theme falls back to its raw name, so a custom theme is
      // still readable instead of blank.
      const text = entry?.label || current;
      if (this.$value) this.$value.textContent = text;

      const iconName = entry?.icon || ThemeSwitcher.FALLBACK_ICON;
      this._renderIcon(iconName);
   }

   async _renderIcon(name) {
      if (!this.$iconSlot) return;
      if (this._iconName === name && this.$icon) return;
      this._iconName = name;
      if (this.$icon) {
         slice.controller.destroyComponent(this.$icon);
         this.$icon = null;
      }
      try {
         const node = await slice.build('Icon', { name, size: 'medium', color: 'currentColor' });
         if (!this.isConnected || this._iconName !== name) {
            slice.controller.destroyComponent(node);   // stale build, or we are gone
            return;
         }
         this.$icon = node;
         this.$iconSlot.replaceChildren(node);
      } catch {
         // A name the Icon font does not know must not break the control.
      }
   }

   set display(value) {
      this._display = value && typeof value === 'object' ? value : null;
      this._sync();
   }
   get display() {
      return this._display;
   }

   set themes(value) {
      this._themes = Array.isArray(value) && value.length ? value : ['LIGHT', 'DARK'];
      this._sync();
   }
   get themes() {
      return this._themes;
   }

   set variant(value) {
      this._variant = value === 'menu-item' ? 'menu-item' : 'button';
      this.classList.toggle('theme-switcher--menu', this._variant === 'menu-item');
      this.classList.toggle('theme-switcher--button', this._variant === 'button');
   }
   get variant() {
      return this._variant;
   }

   set label(value) {
      // 'Theme' is the English default, not an override: keeping null lets the
      // built-in t('label') answer, so the word follows the translator.
      const text = value ? String(value) : null;
      this._label = text === ThemeSwitcher.props.label.default ? null : text;
      this._paintLabel();
   }
   get label() {
      return this._label ?? this._t('label');
   }

   get texts() {
      return this._texts;
   }
   set texts(value) {
      this._texts = value && typeof value === 'object' ? { ...value } : {};
      this._paintLabel();
   }

   _t(key) {
      return this._texts[key] ?? t(key);
   }

   _paintLabel() {
      if (this.$label) this.$label.textContent = this._label ?? this._t('label');
   }

   set onChange(fn) {
      if (typeof fn === 'function') this._onChange = fn;
   }
   get onChange() {
      return this._onChange;
   }
}

customElements.define('slice-theme-switcher', ThemeSwitcher);
