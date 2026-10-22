// ThemeCreator — page-level editor for the Slice.js theme tokens.
//
// Reads the 15 required tokens (COMPONENT_API_STANDARDS §11) off the ACTIVE theme,
// lets you retune them, and renders the result into a preview subtree that is
// scoped to `.theme-creator__preview`. Nothing here writes to `:root`, so the
// page can never leave the host app in a half-themed state — the whole point of
// the original save/restore dance, which this replaces: there is nothing to
// restore because nothing global was ever touched.
//
// Served as a top-level route (`/theme-creator`, declared in
// parser/lib/routesSync.js), so — unlike every page under the AppShell — it
// renders without a navbar and owns its own navigation.
//
// Everything the page shows is a Slice component: ColorPicker for the tokens,
// Textarea for the generated output, Card for the contrast samples, Grid for
// the layouts. The only hand-written markup left is the template shell
// (ThemeCreator.html) — headings and sections, which is static page structure
// rather than an interactive primitive.

import { normalizeHex, hexToRgb, readableOn, hexToHsv } from '../../shared/color.js';
import ThemeOverride from './ThemeOverride.js';
import { generatePalette } from './palette.js';

/**
 * The 15 required tokens, grouped the way the panel presents them.
 *
 * This table is the single source of truth: the colour controls, the preview and
 * the exported CSS are all generated from it, so a token can never appear in the
 * export but be missing from the UI (or vice versa).
 *
 * `fallback` is only used when the active theme does not define the token — its
 * values come from the library's own LIGHT theme, so an incomplete theme still
 * produces a coherent palette instead of a black-and-white one.
 */
const TOKEN_GROUPS = [
   {
      title: 'Primary colors',
      icon: 'palette',
      tokens: [
         { key: 'primaryColor', cssVar: '--primary-color', label: 'Primary color', fallback: '#9333ea' },
         { key: 'primaryBg', cssVar: '--primary-background-color', label: 'Primary background', fallback: '#fefbff' },
         { key: 'primaryContrast', cssVar: '--primary-color-contrast', label: 'Primary contrast', fallback: '#ffffff' },
         { key: 'primaryShade', cssVar: '--primary-color-shade', label: 'Primary shade', fallback: '#7c3aed' },
      ],
   },
   {
      title: 'Secondary colors',
      icon: 'layers',
      tokens: [
         { key: 'secondaryColor', cssVar: '--secondary-color', label: 'Secondary color', fallback: '#0891b2' },
         { key: 'secondaryBg', cssVar: '--secondary-background-color', label: 'Secondary background', fallback: '#f0f9ff' },
         { key: 'secondaryContrast', cssVar: '--secondary-color-contrast', label: 'Secondary contrast', fallback: '#ffffff' },
      ],
   },
   {
      title: 'Status colors',
      icon: 'check-circle',
      tokens: [
         { key: 'successColor', cssVar: '--success-color', label: 'Success', fallback: '#059669' },
         { key: 'warningColor', cssVar: '--warning-color', label: 'Warning', fallback: '#d97706' },
         { key: 'dangerColor', cssVar: '--danger-color', label: 'Danger', fallback: '#dc2626' },
      ],
   },
   {
      title: 'Typography',
      icon: 'text-size',
      tokens: [
         { key: 'fontPrimary', cssVar: '--font-primary-color', label: 'Primary text', fallback: '#1a0b2e' },
         { key: 'fontSecondary', cssVar: '--font-secondary-color', label: 'Secondary text', fallback: '#6b46c1' },
      ],
   },
   {
      title: 'Surfaces & states',
      icon: 'cog',
      tokens: [
         { key: 'tertiaryBg', cssVar: '--tertiary-background-color', label: 'Tertiary background', fallback: '#f0f4ff' },
         { key: 'mediumColor', cssVar: '--medium-color', label: 'Medium', fallback: '#6b7280' },
         { key: 'disabledColor', cssVar: '--disabled-color', label: 'Disabled', fallback: '#d1d5db' },
      ],
   },
];

/** Flat view of TOKEN_GROUPS, in export order. */
const ALL_TOKENS = TOKEN_GROUPS.flatMap((group) => group.tokens);

/**
 * Contrast tokens are not editable — they are derived. The original wrote the
 * status colour into its own contrast token, which produced a theme whose
 * "Success" button was green text on green. These are picked for contrast
 * against the colour they sit on instead.
 */
const DERIVED_CONTRASTS = [
   ['--success-color', '--success-contrast'],
   ['--warning-color', '--warning-contrast'],
   ['--danger-color', '--danger-contrast'],
   ['--medium-color', '--medium-contrast'],
];

/** Colors each status Button and the surface samples read from. */
const STATUS_SURFACES = [
   { label: 'Success surface', cssVar: '--success-color', contrastVar: '--success-contrast' },
   { label: 'Warning surface', cssVar: '--warning-color', contrastVar: '--warning-contrast' },
   { label: 'Danger surface', cssVar: '--danger-color', contrastVar: '--danger-contrast' },
];

/** Accepted values for the `paletteMode` prop. */
const PALETTE_MODES = ['auto', 'light', 'dark'];

/**
 * Options for the palette-mode Select, in one place because both `options` and
 * the initial `value` have to be built from the SAME objects — Select matches a
 * preselected option structurally (`sameObject`), not by identity.
 */
const PALETTE_MODE_OPTIONS = [
   { text: 'Follow theme', value: 'auto' },
   { text: 'Always light', value: 'light' },
   { text: 'Always dark', value: 'dark' },
];

const DEFAULT_NAV_ITEMS = [
   { text: 'Home', path: '/' },
   { text: 'Components', path: '/docs' },
   { text: 'Theme Creator', path: '/theme-creator' },
];

/** A filename-safe class name derived from the theme name. */
function toCssIdentifier(name) {
   const cleaned = String(name || '').trim().replace(/[^a-zA-Z0-9-_]+/g, '-');
   const trimmed = cleaned.replace(/^-+|-+$/g, '');
   return trimmed || 'CustomTheme';
}

export default class ThemeCreator extends HTMLElement {
   static props = {
      /** Seed for the theme-name field; also the exported file name. */
      themeName: { type: 'string', default: 'CustomTheme' },
      /** Repaint the preview on every colour change instead of on demand. */
      autoPreview: { type: 'boolean', default: true },
      /** What `randomizeTheme` targets: follow the live theme, or force a mode. */
      paletteMode: {
         type: 'string',
         default: 'auto',
         allowedValues: PALETTE_MODES,
      },
      /** Render the live preview panel at all. */
      preview: { type: 'boolean', default: true },
      /** Build the page navbar. Turn it off when embedding the editor in a shell. */
      showNavbar: { type: 'boolean', default: true },
      /** `{ text, path }[]`. Falls back to the library's own routes. */
      navItems: { type: 'array', default: null },
      /** Fired on every colour edit with the resolved `{ '--token': value }` map. */
      onChange: { type: 'function', default: null },
      /** Fired when the user downloads the CSS or copies either output. */
      onExport: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$navbar = this.querySelector('[data-el="navbar"]');
      this.$badge = this.querySelector('[data-el="badge"]');
      this.$actions = this.querySelector('[data-el="actions"]');
      this.$paletteMode = this.querySelector('[data-el="palette-mode"]');
      this.$paletteHint = this.querySelector('[data-el="palette-hint"]');
      this.$nameSlot = this.querySelector('[data-el="name-input"]');
      this.$groups = this.querySelector('[data-el="groups"]');
      this.$previewPanel = this.querySelector('[data-el="preview-panel"]');
      this.$preview = this.querySelector('[data-el="preview"]');
      this.$previewButtons = this.querySelector('[data-el="preview-buttons"]');
      this.$previewInputs = this.querySelector('[data-el="preview-inputs"]');
      this.$previewSwitches = this.querySelector('[data-el="preview-switches"]');
      this.$previewStatus = this.querySelector('[data-el="preview-status"]');

      // Colour state, keyed by token `key` rather than by CSS variable: the
      // pickers are addressed by key and the export by variable, and keeping one
      // map avoids the two drifting.
      this._colors = new Map();
      this._pickers = new Map();
      this._toasts = new Set();
      this._nameInput = null;
      this.$navbarEl = null;
      this.$exportModal = null;
      this._modalPromise = null;
      this._downloads = null;
      this._override = null;
      this.$modeSelect = null;

      // Bound once so beforeDestroy() can remove the exact same listener.
      this._onThemeChanged = () => this.loadCurrentTheme();
      this._onOverrideChanged = (event) => {
         this._syncApplyButton();
         // `superseded` means someone switched the real theme while our override
         // was up. The override dropped itself; say so, or the user pressed
         // LIGHT/DARK and watched the colours change back with no explanation.
         if (event?.detail?.reason === 'superseded') {
            this._notify('The real theme changed — the override was dropped.', 'warning');
         }
      };

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      // Restore a persisted override BEFORE anything reads the theme, so the
      // page opens already showing it. `loadCurrentTheme()` reads the REAL
      // theme regardless (it reads computed values off a detached theme
      // stylesheet path), so the swatches never silently absorb the override.
      ThemeOverride.shared().restore();

      await this._buildGroups();

      await this._buildThemeName();
      await this._buildNavbar();
      await this._buildActionBar();
      await this._buildPaletteMode();
      await this._buildPreview();

      // The shared instance, built eagerly (not on first click) so the button's
      // initial label already reflects an override from an earlier visit.
      this._override = ThemeOverride.shared();
      this._syncApplyButton();

      // `loadCurrentTheme` reads the LIVE theme, so it runs after the ThemeSelector
      // (built inside the navbar above) has had a chance to apply it.
      this.loadCurrentTheme();

      document.addEventListener('themeChanged', this._onThemeChanged);
      document.addEventListener('themeoverridechanged', this._onOverrideChanged);
   }

   // ── Teardown ──────────────────────────────────────────────────────────────
   //
   // beforeDestroy() is the only hook the framework calls. This used to live in
   // disconnectedCallback(), which also fires on a temporary detach (the router
   // caches components via innerHTML='' + appendChild) while init() does NOT
   // re-run on reconnect — so tearing listeners down there breaks the first
   // detach/reattach cycle.

   beforeDestroy() {
      document.removeEventListener('themeChanged', this._onThemeChanged);
      document.removeEventListener('themeoverridechanged', this._onOverrideChanged);

      // Toast appends itself to <body> and removes itself when it expires; any
      // still on screen when the page goes away has to be torn down by hand,
      // because the destroy cascade only sees what init() left in this subtree.
      for (const toast of this._toasts) {
         if (toast.isConnected) slice.controller.destroyComponent(toast);
      }
      this._toasts.clear();

      // Same story for the export dialog: built on first use and mounted on
      // <body>, so it is invisible to childrenIndex.
      if (this.$exportModal) {
         slice.controller.destroyComponent(this.$exportModal);
         this.$exportModal = null;
      }
      this._modalPromise = null;

      // FileDownloadService is deliberately NOT destroyed: it is built as a
      // singleton, is stateless (no listeners, no timers, no DOM), and may be
      // shared with the rest of the app.
   }

   // ── Controls panel ─────────────────────────────────────────────────────────

   /** Render one labelled colour control per token, grouped by TOKEN_GROUPS. */
   async _buildGroups() {
      const groups = document.createDocumentFragment();

      for (const group of TOKEN_GROUPS) {
         const section = document.createElement('section');
         section.className = 'theme-creator__group';

         const heading = document.createElement('h3');
         heading.className = 'theme-creator__group-title';

         const icon = await slice.build('Icon', { name: group.icon, size: 'small', color: 'currentColor' });
         if (icon) heading.appendChild(icon);
         heading.appendChild(document.createTextNode(group.title));
         section.appendChild(heading);

         // The token cells are a Grid; the heading is page structure.
         const grid = await slice.build('Grid', {
            columnTemplate: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '10px',
         });

         const cells = [];
         for (const token of group.tokens) {
            cells.push(await this._buildSwatch(token));
         }
         grid.setItems(cells);

         section.appendChild(grid);
         groups.appendChild(section);
      }

      this.$groups.replaceChildren(groups);
   }

   /**
    * One ColorPicker bound to a single token.
    *
    * The picker's `onChange` closes over the token, so there is no parallel
    * listener table to keep in sync with the controls — the binding lives with
    * the thing it binds.
    */
   async _buildSwatch(token) {
      const picker = await slice.build('ColorPicker', {
         label: token.label,
         value: token.fallback,
         hint: token.cssVar,
         onChange: (hex) => this._onTokenChange(token, hex),
      });

      this._pickers.set(token.key, picker);
      return picker;
   }

   _onTokenChange(token, hex) {
      this._colors.set(token.key, normalizeHex(hex, token.fallback));
      if (this._autoPreview) this.applyPreview();
      this._notifyChange();
   }

   async _buildThemeName() {
      if (!this.$nameSlot) return;
      this._nameInput = await slice.build('Input', {
         value: this._themeName || 'CustomTheme',
         placeholder: 'Enter theme name',
      });
      this.$nameSlot.replaceChildren(this._nameInput);
   }

   async _buildActionBar() {
      if (!this.$actions) return;

      this.$resetBtn = await slice.build('Button', {
         value: 'Reset to active theme',
         icon: { name: 'refresh', color: 'currentColor' },
         onClick: () => this.reset(),
      });

      // Repainting is NOT enough here. With `autoPreview` on — the default — the
      // preview has already been repainted on every drag, so a click that only
      // repaints is indistinguishable from a dead button. The click therefore
      // also brings the preview into view and confirms it, so it always does
      // something observable. With `autoPreview` off it is the only way to
      // repaint at all, and then this is just the manual refresh.
      this.$previewBtn = await slice.build('Button', {
         value: 'Preview',
         icon: { name: 'eye', color: 'currentColor' },
         variant: 'outlined',
         onClick: () => this.previewNow(),
      });

      this.$exportBtn = await slice.build('Button', {
         value: 'Export theme',
         icon: { name: 'download', color: 'currentColor' },
         onClick: () => this.openExport(),
      });

      this.$randomBtn = await slice.build('Button', {
         value: 'Randomize',
         icon: { name: 'shuffle', color: 'currentColor' },
         variant: 'outlined',
         onClick: () => this.randomizeTheme(),
      });

      // One button, two states. The override is deliberately sticky — it
      // outlives this page so you can walk the whole library in your theme —
      // which means the way back out has to be visible, not implicit.
      this.$applyBtn = await slice.build('Button', {
         value: 'Apply to whole app',
         icon: { name: 'wand-magic-sparkles', color: 'currentColor' },
         variant: 'outlined',
         onClick: () => this.toggleOverride(),
      });

      this.$actions.append(this.$resetBtn, this.$previewBtn, this.$randomBtn, this.$applyBtn, this.$exportBtn);
      this._syncApplyButton();
   }

   /**
    * The light/dark selector that decides what the next roll targets.
    *
    * Three states rather than two, because "follow the active theme" is the
    * default and forcing a choice would mean rolling on a dark theme and
    * silently getting a light palette unless the user remembered to change it.
    */
   async _buildPaletteMode() {
      if (!this.$paletteMode) return;

      this.$modeSelect = await slice.build('Select', {
         label: 'Palette mode',
         placeholder: 'Follow theme',
         options: PALETTE_MODE_OPTIONS,
         // The option's value itself; prop order does not matter.
         selected: this._paletteMode,
         onChange: (next) => {
            const mode = String(next ?? '');
            this._paletteMode = PALETTE_MODES.includes(mode) ? mode : 'auto';
            this._syncPaletteHint();
         },
      });

      this.$paletteMode.replaceChildren(this.$modeSelect);
      this._syncPaletteHint();
   }

   /** Spell out what "Follow theme" currently resolves to, and why it matters. */
   _syncPaletteHint() {
      if (!this.$paletteHint) return;
      const resolved = this._resolvePaletteMode();
      this.$paletteHint.textContent =
         this._paletteMode === 'auto'
            ? `Following the active theme — rolls currently target ${resolved}.`
            : `Rolls target ${this._paletteMode}. Switch back to "Follow theme" to match the app.`;
   }

   /** The mode a roll will actually use, with 'auto' resolved against the theme. */
   _resolvePaletteMode() {
      if (this._paletteMode === 'light' || this._paletteMode === 'dark') return this._paletteMode;

      // Detected from the live background colour rather than the theme NAME:
      // 'DARK' is a convention, the luminance is the fact. A token we cannot
      // parse falls back to light, which never yields dark text on a dark page.
      const background = getComputedStyle(document.documentElement)
         .getPropertyValue('--primary-background-color')
         .trim();
      const bgHsv = hexToHsv(background);
      return !bgHsv || bgHsv.v > 0.5 ? 'light' : 'dark';
   }

   /**
    * Roll a fresh palette into every picker.
    *
    * The mode follows the theme that is actually active, so rolling on a dark
    * theme hands you a dark palette instead of a light one pasted onto a dark
    * page. Detected from the live background colour rather than from the theme
    * NAME, because 'DARK' is a convention and the luminance is the fact.
    */
   randomizeTheme() {
      const mode = this._resolvePaletteMode();
      const { values, harmony, temperature } = generatePalette({ mode });

      for (const token of ALL_TOKENS) {
         const hex = values[token.cssVar];
         if (!hex) continue;
         this._colors.set(token.key, hex);
         // The value setter, not onChange: setting `value` must not re-enter the
         // per-token handler and fire onChange fifteen times for one roll.
         const picker = this._pickers.get(token.key);
         if (picker) picker.value = hex;
      }

      if (this._autoPreview) this.applyPreview();
      this._notifyChange();
      this._syncApplyButton();
      this._syncPaletteHint();
      this._notify(`Random ${harmony}${temperature === 'any' ? '' : ` ${temperature}`} palette (${mode}).`, 'success');
   }

   /** Point the apply button at the action it will actually perform. */
   _syncApplyButton() {
      if (!this.$applyBtn) return;
      const applied = this._override?.isApplied === true;
      this.$applyBtn.value = applied ? 'Restore real theme' : 'Apply to whole app';
      this.$applyBtn.icon = { name: applied ? 'restore-window' : 'wand-magic-sparkles', color: 'currentColor' };
      this.$applyBtn.variant = applied ? 'danger' : 'outlined';
   }

   /**
    * Apply the edited tokens to the whole app, or hand the app back.
    *
    * Persisted, so the theme is still there after a reload — the app shell
    * restores it at boot (see App.js).
    */
   toggleOverride() {
      if (this._override.isApplied) {
         this._override.clear();
         this._notify('Restored the real theme.', 'info');
      } else {
         this._override.apply(this.getTokenValues());
         this._notify('Applied to the whole app — browse the library in your theme.', 'success');
      }
      this._syncApplyButton();
   }

   // ── Navbar ────────────────────────────────────────────────────────────────

   async _buildNavbar() {
      if (!this._showNavbar || !this.$navbar) return;

      const items = Array.isArray(this._navItems) && this._navItems.length
         ? this._navItems
         : DEFAULT_NAV_ITEMS;

      const navbar = await slice.build('Navbar', {
         position: 'fixed',
         logo: { src: '/images/Slice.js-logo.png', path: '/' },
         // Navbar.addItem mutates each entry (`value.type = 'text'`), so hand it
         // fresh objects rather than the caller's array.
         items: items.map((item) => ({ text: item.text, path: item.path })),
      });

      const themeSelector = await slice.build('ThemeSelector');
      navbar.querySelector('.nav_bar_buttons')?.appendChild(themeSelector);

      this.$navbarEl = navbar;
      this.$navbar.replaceChildren(navbar);
   }

   // ── Preview ───────────────────────────────────────────────────────────────

   async _buildPreview() {
      if (this.$previewPanel) {
         this.$previewPanel.hidden = !this._preview;
      }
      if (!this._preview) return;

      // The template ships empty slots; each becomes a Grid so the preview lays
      // out responsively with the rest of the library instead of a bespoke
      // flex-wrap rule.
      const asGrid = async (slot) => {
         const grid = await slice.build('Grid', {
            columnTemplate: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px',
         });
         slot.replaceChildren(grid);
         return grid;
      };

      const buttonsGrid = await asGrid(this.$previewButtons);
      const inputsGrid = await asGrid(this.$previewInputs);
      const switchesGrid = await asGrid(this.$previewSwitches);
      const statusGrid = await asGrid(this.$previewStatus);

      const buttons = [
         {
            label: 'Primary',
            customColor: { background: 'var(--primary-color)', text: 'var(--primary-color-contrast)' },
         },
         {
            label: 'Secondary',
            customColor: { background: 'var(--secondary-color)', text: 'var(--secondary-color-contrast)' },
         },
      ];
      for (const button of buttons) {
         buttonsGrid.setItem(await slice.build('Button', { value: button.label, customColor: button.customColor }));
      }
      for (const variant of /** @type {const} */ (['filled', 'outlined', 'ghost', 'soft', 'danger'])) {
         buttonsGrid.setItem(await slice.build('Button', { value: variant, variant }));
      }

      inputsGrid.setItem(await slice.build('Input', { placeholder: 'Primary input', value: 'Example text' }));
      inputsGrid.setItem(await slice.build('Input', { placeholder: 'Secondary input', value: 'Another text' }));

      switchesGrid.setItem(await slice.build('Switch', { checked: true, label: 'Enabled' }));
      switchesGrid.setItem(await slice.build('Switch', { checked: false, label: 'Disabled' }));
      switchesGrid.setItem(
         await slice.build('Checkbox', { label: 'Primary checkbox', checked: true })
      );

      // Surface samples: the fastest way to see whether a colour pair is
      // actually readable, which a swatch alone cannot tell you. Card is the
      // library's surface primitive, and its customColor takes the token pair
      // directly — the sample repaints when the preview subtree repaints,
      // because it reads `var(--…)` rather than a baked-in value.
      for (const surface of STATUS_SURFACES) {
         statusGrid.setItem(
            await slice.build('Card', {
               title: surface.label,
               variant: 'minimal',
               customColor: {
                  background: `var(${surface.cssVar})`,
                  text: `var(${surface.contrastVar})`,
               },
            })
         );
      }
   }

   /**
    * Paint the current colours onto the preview subtree only.
    *
    * Scoped on purpose: writing these to `:root` would restyle the whole app
    * behind the user's back, and the page has no way to know what the original
    * values were once something else (a ThemeSelector, a route change) has
    * changed them in the meantime.
    */
   applyPreview() {
      if (!this.$preview) return;
      const values = this.getTokenValues();
      for (const [cssVar, value] of Object.entries(values)) {
         this.$preview.style.setProperty(cssVar, value);
      }
   }

   /**
    * The Preview button: repaint, show the result, say so happened.
    *
    * `preview: false` turns the panel off, and then there is nothing to scroll
    * to or show — so it says exactly that instead of silently scrolling to an
    * invisible element, which is what `scrollIntoView` on a `display:none`
    * subtree amounts to.
    */
   async previewNow() {
      this.applyPreview();

      if (this._preview && this.$previewPanel) {
         this.$previewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
         this._notify('Preview updated.', 'info');
      } else {
         this._notify('Preview is turned off — enable the `preview` prop to see it.', 'warning');
      }
   }

   // ── Theme state ───────────────────────────────────────────────────────────

   /**
    * Every token the export writes, resolved from the current swatch values.
    *
    * @returns {Record<string, string>} `--token` -> value
    */
   getTokenValues() {
      /** @type {Record<string, string>} */
      const values = {};
      for (const token of ALL_TOKENS) {
         values[token.cssVar] = this._colors.get(token.key) || token.fallback;
      }

      values['--primary-color-rgb'] = hexToRgb(values['--primary-color']) || '0, 0, 0';
      values['--secondary-color-rgb'] = hexToRgb(values['--secondary-color']) || '0, 0, 0';

      for (const [colorVar, contrastVar] of DERIVED_CONTRASTS) {
         values[contrastVar] = readableOn(values[colorVar]);
      }

      return values;
   }

   /**
    * Read the live theme off the document.
    *
    * Computed style rather than parsing the theme manager's <style> text: the
    * original regexed `themeManager.themeStyle.textContent`, which only ever
    * sees the LAST applied theme, so it read stale values after a theme switch
    * and could not see a theme set from anywhere else at all (browser theme,
    * inline overrides).
    */
   loadCurrentTheme() {
      const computed = getComputedStyle(document.documentElement);
      let unresolved = 0;

      for (const token of ALL_TOKENS) {
         const raw = computed.getPropertyValue(token.cssVar);
         const hex = normalizeHex(raw, null);
         if (!hex) {
            // A token the active theme never defines. Fall back loudly enough
            // to debug, quietly enough not to spam a console the user opened.
            unresolved += 1;
            this._colors.set(token.key, token.fallback);
         } else {
            this._colors.set(token.key, hex);
         }

         const picker = this._pickers.get(token.key);
         if (picker) picker.value = this._colors.get(token.key);
      }

      if (unresolved > 0) {
         slice.logger.logInfo(
            'ThemeCreator',
            `${unresolved} theme token(s) are not defined by the active theme; using fallbacks.`
         );
      }

      this._syncBadge();
      this.applyPreview();
   }

   _syncBadge() {
      if (!this.$badge) return;
      const active = slice.stylesManager?.themeManager?.currentTheme || slice.theme || 'unknown';
      this.$badge.textContent = `Active theme: ${active}`;
   }

   reset() {
      this.loadCurrentTheme();
      this._notify('Swatches reset to the active theme.', 'info');
   }

   _notifyChange() {
      if (typeof this._onChange === 'function') {
         this._onChange(this.getTokenValues());
      }
   }

   getThemeName() {
      // Input.value is pull-style: it reads the live <input>, so typing in it is
      // reflected without the component having to subscribe to anything.
      const typed = this._nameInput?.value?.trim();
      return typed || this._themeName || 'CustomTheme';
   }

   // ── Export ────────────────────────────────────────────────────────────────

   /**
    * Open the export dialog, building it on first use.
    *
    * The Modal is mounted on <body> (a <dialog> cannot showModal() while
    * disconnected), which puts it outside this subtree — hence the explicit
    * destroy in beforeDestroy(). The in-flight promise is memoised so a
    * double-click cannot build two dialogs and fight over the top layer.
    */
   async openExport() {
      try {
         const modal = await this._ensureExportModal();
         if (!modal) return;
         this._populateExportContent();
         modal.open = true;
      } catch (error) {
         slice.logger.logError('ThemeCreator', 'Could not open the export dialog', error);
         this._notify('Could not open the export dialog.', 'error');
      }
   }

   async _ensureExportModal() {
      if (this.$exportModal) return this.$exportModal;
      if (this._modalPromise) return this._modalPromise;

      this._modalPromise = (async () => {
         const modal = await slice.build('Modal', {
            title: 'Export theme',
            width: '860px',
         });
         if (!modal || !this.isConnected) {
            if (modal) slice.controller.destroyComponent(modal);
            return null;
         }

         this.$cssOutput = await this._buildCodeBlock({
            title: 'CSS',
            description: 'Drop this into your project as a theme file.',
         });
         this.$configOutput = await this._buildCodeBlock({
            title: 'sliceConfig.json',
            description: 'Point themeManager at the exported theme name.',
         });

         const download = await slice.build('Button', {
            value: 'Download .css',
            icon: { name: 'download', color: 'currentColor' },
            onClick: () => this.downloadCss(),
         });
         const copyCss = await slice.build('Button', {
            value: 'Copy CSS',
            icon: { name: 'file-copy', color: 'currentColor' },
            variant: 'outlined',
            onClick: () =>
               this.copyToClipboard(this.$cssOutput.textarea.value, this.$cssOutput.textarea, 'CSS code copied.'),
         });
         const copyConfig = await slice.build('Button', {
            value: 'Copy config',
            icon: { name: 'file-copy', color: 'currentColor' },
            variant: 'outlined',
            onClick: () =>
               this.copyToClipboard(
                  this.$configOutput.textarea.value,
                  this.$configOutput.textarea,
                  'Configuration copied.'
               ),
         });

         const fileRow = this._buildRow();
         fileRow.append(
            this._buildText('Saves the tokens as a ready-to-serve theme file.'),
            this._buildButtonRow(download)
         );

         modal.appendBody(fileRow);
         modal.appendBody(this.$cssOutput.root);
         modal.appendBody(this.$configOutput.root);
         modal.appendFooter(this._buildButtonRow(copyCss, copyConfig));

         document.body.appendChild(modal);
         this.$exportModal = modal;
         return modal;
      })();

      try {
         return await this._modalPromise;
      } finally {
         this._modalPromise = null;
      }
   }

   /**
    * A titled, described block holding a read-only code area.
    *
    * `readonly` rather than `disabled`: a disabled field cannot be selected, so
    * the "clipboard unavailable — copy it manually" fallback would have nothing
    * to select. Textarea exposes `value` both ways, so the block reports the
    * component instead of reaching past it into the native node.
    */
   async _buildCodeBlock({ title, description }) {
      const root = document.createElement('section');
      root.className = 'theme-creator__export-block';

      const heading = document.createElement('h4');
      heading.className = 'theme-creator__export-title';
      heading.textContent = title;

      // `placeholder` is what Textarea turns into the floating label AND the
      // accessible name, so the block is announced as "CSS" / "sliceConfig.json".
      const textarea = await slice.build('Textarea', {
         placeholder: title,
         readonly: true,
         rows: 10,
      });

      root.append(heading, this._buildText(description), textarea);
      return { root, textarea };
   }

   _buildRow() {
      const row = document.createElement('div');
      row.className = 'theme-creator__export-row';
      return row;
   }

   _buildText(content) {
      const paragraph = document.createElement('p');
      paragraph.className = 'theme-creator__export-desc';
      paragraph.textContent = content;
      return paragraph;
   }

   _buildButtonRow(...nodes) {
      const actions = document.createElement('div');
      actions.className = 'theme-creator__export-actions';
      actions.append(...nodes);
      return actions;
   }

   _populateExportContent() {
      if (!this.$cssOutput || !this.$configOutput) return;
      const themeName = this.getThemeName();
      this.$cssOutput.textarea.value = this.generateCss(themeName);
      this.$configOutput.textarea.value = this.generateConfig(themeName);
   }

   generateCss(themeName = this.getThemeName()) {
      const values = this.getTokenValues();
      const lines = Object.entries(values).map(([cssVar, value]) => `  ${cssVar}: ${value};`);

      return [
         `/* ${themeName} — Slice.js theme */`,
         '/* Generated by ThemeCreator. Tokens marked "derived" are computed, not editable. */',
         '',
         ':root {',
         ...lines,
         '}',
         '',
      ].join('\n');
   }

   generateConfig(themeName = this.getThemeName()) {
      // Shaped like the real sliceConfig.json themeManager block so it can be
      // pasted straight in — `defaultTheme` must match the served file name.
      return JSON.stringify(
         {
            themeManager: {
               enabled: true,
               defaultTheme: themeName,
               saveThemeLocally: false,
               useBrowserTheme: false,
            },
         },
         null,
         2
      );
   }

   async downloadCss() {
      const themeName = toCssIdentifier(this.getThemeName());
      const css = this.$cssOutput?.value || this.generateCss();

      if (!this._downloads) {
         this._downloads = await slice.build('FileDownloadService', { singleton: true });
      }
      this._downloads?.download(`${themeName}.css`, css, 'text/css');

      this._notify(`Downloaded ${themeName}.css`, 'success');
      this._emitExport({
         kind: 'download',
         css,
         config: this.$configOutput?.textarea?.value || '',
         themeName,
      });
   }

   async copyToClipboard(text, textarea, successMessage) {
      try {
         await navigator.clipboard.writeText(text || '');
         this._notify(successMessage, 'success');
      } catch {
         // Clipboard access is denied on an insecure origin and unavailable in
         // some embedded webviews; selecting the text is the useful fallback.
         textarea?.select?.();
         this._notify('Clipboard unavailable — the code is selected, copy it manually.', 'warning');
         return;
      }
      this._emitExport({
         kind: 'copy',
         css: this.$cssOutput?.textarea?.value || '',
         config: this.$configOutput?.textarea?.value || '',
         themeName: this.getThemeName(),
      });
   }

   _emitExport(payload) {
      if (typeof this._onExport === 'function') {
         this._onExport({ ...payload, values: this.getTokenValues() });
      }
   }

   // ── Notifications ─────────────────────────────────────────────────────────

   /**
    * Show a Toast instead of hand-rolling a positioned div.
    *
    * Toast owns the enter/exit transition, the timer and `role="alert"`, all of
    * which the original reimplemented with inline styles and a setTimeout it
    * never cancelled.
    */
   async _notify(message, type = 'default') {
      const toast = await slice.build('Toast', { message, type, duration: 3200 });
      if (!toast) return;

      document.body.appendChild(toast);
      this._toasts.add(toast);
      // Toast removes itself when it expires; drop the reference with it so the
      // Set cannot grow across a long editing session.
      toast.addEventListener('toast-dismissed', () => this._toasts.delete(toast), { once: true });
   }

   // ── Props ─────────────────────────────────────────────────────────────────
   //
   // setComponentProps runs every setter in the CONSTRUCTOR, before the element
   // is connected and before init() has run. A setter that touches the DOM here
   // would act on a half-built component, so they only record; init() renders.

   get paletteMode() {
      return this._paletteMode;
   }
   set paletteMode(value) {
      this._paletteMode = PALETTE_MODES.includes(value) ? value : 'auto';
      // Reflect it on the control, but only once one exists: the setter runs in
      // the constructor, long before _buildPaletteMode(). Select wants the
      // option OBJECT wrapped in an array, not the bare mode string.
      if (this.$modeSelect) {
         this.$modeSelect.value = [PALETTE_MODE_OPTIONS.find((o) => o.value === this._paletteMode)];
      }
      this._syncPaletteHint();
   }

   get preview() {
      return this._preview;
   }
   set preview(value) {
      this._preview = value !== false;
      // `hidden` is ignored on any element whose display this stylesheet sets,
      // so the CSS carries the [hidden] companion (see §8.2).
      if (this.$previewPanel) this.$previewPanel.hidden = !this._preview;
   }

   get autoPreview() {
      return this._autoPreview;
   }
   set autoPreview(value) {
      this._autoPreview = value !== false;
   }

   get showNavbar() {
      return this._showNavbar;
   }
   set showNavbar(value) {
      this._showNavbar = value !== false;
   }

   get themeName() {
      return this._themeName;
   }
   set themeName(value) {
      this._themeName = typeof value === 'string' && value.trim() ? value.trim() : 'CustomTheme';
      // Read from the live <input>; setting it back is a no-op once the user
      // has typed, which is exactly when this setter can still run.
      if (this._nameInput) this._nameInput.value = this._themeName;
   }

   get navItems() {
      return this._navItems;
   }
   set navItems(value) {
      this._navItems = Array.isArray(value) && value.length ? value : null;
   }

   get onChange() {
      return this._onChange;
   }
   set onChange(value) {
      if (typeof value === 'function') this._onChange = value;
   }

   get onExport() {
      return this._onExport;
   }
   set onExport(value) {
      if (typeof value === 'function') this._onExport = value;
   }
}

customElements.define('slice-theme-creator', ThemeCreator);