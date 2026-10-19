/**
 * ThemeOverride — apply a set of CSS custom properties to the whole app, and
 * take them back cleanly.
 *
 * NOT a registry component. It is an internal module of the Theme Creator page,
 * imported directly, because there is nothing here a consumer of the public
 * component library could use: it only makes sense next to a theme editor.
 *
 * ## Shared instance
 *
 * `ThemeOverride.shared()` exists because two owners would be a bug, not a
 * feature. App.js restores a persisted override at boot and ThemeCreator toggles
 * it — if each had its own instance there would be two <style> elements writing
 * the same tokens, and the second `clear()` would restore while the first was
 * still applying.
 *
 * ## Why a `<style>` element and not inline styles on `:root`
 *
 * Writing `--primary-color` onto `document.documentElement.style` wins over the
 * theme stylesheet, and it is also invisible: you cannot see it, `getComputedStyle`
 * reports it as though it were the theme, and reverting it means guessing whether an
 * empty string means "unset" or "set to empty". A dedicated element appended to
 * <head> AFTER the theme's own <style> wins by order rather than by specificity,
 * is one node to remove, and leaves nothing behind on :root.
 *
 * ## Why the snapshot is taken once
 *
 * The first `apply()` captures whatever theme is in force and keeps it. Every
 * later `apply()` overwrites the override WITHOUT re-snapshotting — otherwise the
 * second call would capture the first override as "the original" and `clear()`
 * would restore a custom theme instead of the real one.
 */
export default class ThemeOverride {

   static EVENT = 'themeoverridechanged';
   static STYLE_ID = 'slice-theme-override';
   static STORAGE_KEY = 'slice-theme-override';

   static _shared = null;

   /** The one instance. See the note above before adding a second owner. */
   static shared() {
      if (!ThemeOverride._shared) {
         ThemeOverride._shared = new ThemeOverride();
      }
      return ThemeOverride._shared;
   }

   constructor() {
      /** @type {Map<string, string>} the override currently in force */
      this._applied = new Map();
      /** @type {HTMLElement|null} the injected <style>, created on first apply */
      this._styleEl = null;
      /** @type {string|null} theme name captured with the override */
      this._appliedOver = null;

      this._onThemeChanged = this._onThemeChanged.bind(this);
      document.addEventListener('themeChanged', this._onThemeChanged);
   }

   /** True while an override is in force. */
   get isApplied() {
      return this._applied.size > 0;
   }

   /** A copy of the tokens currently overridden, `{ '--token': value }`. */
   get current() {
      return Object.fromEntries(this._applied);
   }

   /** The theme that was active when the override was first applied. */
   get appliedOver() {
      return this._appliedOver;
   }

   /**
    * Put `values` on every page of the app until `clear()`, and remember it
    * across reloads.
    *
    * @param {Record<string, string>} values  `--token: value` pairs
    * @returns {this}
    */
   apply(values, { persist = true } = {}) {
      const next = this._sanitize(values);
      if (next.size === 0) return this;

      if (!this._appliedOver) {
         this._appliedOver =
            slice?.stylesManager?.themeManager?.currentTheme || slice?.theme || null;
      }
      this._applied = next;
      this._render();
      if (persist) this._persist();
      this._emit('applied');
      return this;
   }

   /**
    * Re-apply an override saved by a previous visit.
    *
    * Called at boot by the app shell, because persisting without restoring would
    * mean the theme silently vanished on every reload — the exact "why did my
    * theme disappear" bug that persistence exists to avoid.
    *
    * @returns {boolean} whether something was restored
    */
   restore() {
      let record;
      try {
         const raw = localStorage.getItem(ThemeOverride.STORAGE_KEY);
         if (!raw) return false;
         record = JSON.parse(raw);
      } catch {
         // Corrupt entry. Drop it rather than throwing on every boot.
         this._forget();
         return false;
      }

      if (!record || typeof record.values !== 'object' || record.values === null) {
         this._forget();
         return false;
      }

      const next = this._sanitize(record.values);
      if (next.size === 0) {
         this._forget();
         return false;
      }

      this._applied = next;
      this._appliedOver = typeof record.appliedOver === 'string' ? record.appliedOver : null;
      this._render();
      this._emit('restored');
      return true;
   }

   /**
    * Remove the override entirely, so the real theme applies again — and forget
    * the saved copy, because an override that survives `clear()` would come back
    * on the next reload.
    *
    * @returns {this}
    */
   clear() {
      if (!this.isApplied && !this._readStorage()) return this;
      this._applied = new Map();
      this._appliedOver = null;
      if (this._styleEl?.parentNode) {
         this._styleEl.parentNode.removeChild(this._styleEl);
      }
      this._styleEl = null;
      this._forget();
      this._emit('cleared');
      return this;
   }

   /**
    * A real theme switch supersedes the override.
    *
    * Without this the override keeps winning over the theme the user just picked,
    * and ThemeSelector looks broken — the button changes its icon, the theme name
    * changes, and nothing else happens. Dropping it is the only outcome where
    * both controls stay truthful.
    */
   _onThemeChanged() {
      if (!this.isApplied) return;
      const wasOver = this._appliedOver;
      this.clear();
      this._emit('superseded', { wasOver });
   }

   /** Keep only usable custom properties; a bad entry must not kill the block. */
   _sanitize(values) {
      const out = new Map();
      if (!values || typeof values !== 'object') return out;
      for (const [prop, value] of Object.entries(values)) {
         if (typeof prop !== 'string' || !prop.startsWith('--')) continue;
         if (typeof value !== 'string' || value.trim() === '') continue;
         out.set(prop, value.trim());
      }
      return out;
   }

   _render() {
      if (!this._styleEl) {
         this._styleEl = document.createElement('style');
         this._styleEl.id = ThemeOverride.STYLE_ID;
         // Appended last so it wins over the theme's own <style> by order.
         document.head.appendChild(this._styleEl);
      }
      const body = Array.from(this._applied, ([prop, value]) => `  ${prop}: ${value};`).join('\n');
      this._styleEl.textContent = `:root {\n${body}\n}\n`;
   }

   _persist() {
      try {
         localStorage.setItem(
            ThemeOverride.STORAGE_KEY,
            JSON.stringify({ values: this.current, appliedOver: this._appliedOver })
         );
      } catch {
         // Private mode / quota. The override still works for this page view;
         // it just will not survive a reload.
      }
   }

   _forget() {
      try {
         localStorage.removeItem(ThemeOverride.STORAGE_KEY);
      } catch {
         /* nothing sensible to do */
      }
   }

   _readStorage() {
      try {
         return localStorage.getItem(ThemeOverride.STORAGE_KEY);
      } catch {
         return null;
      }
   }

   _emit(reason, extra = {}) {
      document.dispatchEvent(
         new CustomEvent(ThemeOverride.EVENT, {
            detail: { reason, applied: this.isApplied, values: this.current, ...extra },
         })
      );
   }
}

