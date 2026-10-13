// Names + geometry, generated from the `lucide` package (see
// scripts/generate-icons.mjs). ALIASES records which Lucide icon backs each
// public name, so the mapping is auditable instead of magic.
//
// Only the default export: the bundler treats a component module as
// single-export, and a named re-export here fails the production build with
// "Export statement may only appear at the top level".
import { ICON_NODES, LEGACY_NODES, LEGACY_VIEWBOX } from './icons.generated.js';

// Warns once per deprecated prop name (kept module-scoped so each component
// reports a given alias only once per session).
const _sliceDeprecated = new Set();
function deprecate(oldName, newName) {
   if (_sliceDeprecated.has(oldName)) return;
   _sliceDeprecated.add(oldName);
   console.warn(`[Slice] "${oldName}" is deprecated; use "${newName}" instead.`);
}

// Stroke geometry for the Lucide-backed icons (Lucide's own defaults). The
// legacy brand marks are filled, so they get `FILL` attributes instead — one
// svg cannot be both stroke and fill.
const STROKE_ATTRS = {
   fill: 'none',
   stroke: 'currentColor',
   'stroke-width': '2',
   'stroke-linecap': 'round',
   'stroke-linejoin': 'round',
};
const FILL_ATTRS = { fill: 'currentColor', stroke: 'none' };

const SVG_NS = 'http://www.w3.org/2000/svg';
const SIZE_KEYWORDS = { small: '16px', medium: '20px', large: '24px' };

export default class Icon extends HTMLElement {

   static props = {
      name: {
         type: 'string',
         default: 'youtube'
      },
      size: {
         type: 'string',
         default: 'small'
      },
      color: {
         type: 'string',
         default: 'currentColor'
      },
      // Accessible name. Omitted (the default) the icon is `aria-hidden`, which
      // is what you want next to a visible label — an unlabelled glyph should
      // not be announced at all.
      label: {
         type: 'string',
         default: ''
      },
      // Deprecated no-op: the icon set moved from the two-style `slc` font to
      // Lucide, which is stroke-only. Accepted and ignored so existing callers
      // keep working.
      iconStyle: {
         type: 'string',
         default: 'filled'
      }
   };

   constructor(props) {
      super();

      slice.attachTemplate(this);
      this.$svg = this.querySelector('svg');

      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._render();
   }

   /** Rebuild the glyph. Safe to call on every prop change — it is cheap. */
   _render() {
      const svg = this.$svg;
      if (!svg) return;

      const nodes = ICON_NODES[this._name];
      const legacy = LEGACY_NODES[this._name];

      if (!nodes && !legacy) {
         // Warn on every path, not just init(): the old version only checked at
         // build time, so renaming `name` to a typo rendered a silent blank box.
         if (this._name) {
            console.warn(
               `[Icon] "${this._name}" is not a valid icon name. ` +
               `Check the Icon reference for valid names.`
            );
         }
         svg.replaceChildren();
         return;
      }

      const attrs = legacy ? FILL_ATTRS : STROKE_ATTRS;
      for (const key of Object.keys(attrs)) svg.setAttribute(key, attrs[key]);

      // The sprite's marks are NOT all 24x24 — the brand and Slice logos were
      // authored on a ~1000-1180 unit grid (sliceJs is 1061x1320). The template's
      // viewBox is 24x24, so without this they painted ~55x too large; combined
      // with `overflow: visible` they escaped the layout box and covered the
      // page. The generator reads each symbol's real viewBox from the sprite.
      svg.setAttribute('viewBox', legacy ? (LEGACY_VIEWBOX[this._name] || '0 0 24 24') : '0 0 24 24');

      // Build with the DOM, never innerHTML: the data is generated and trusted,
      // but node construction costs nothing here and keeps the rule absolute.
      const children = (nodes || legacy).map(([tag, nodeAttrs]) => {
         const el = document.createElementNS(SVG_NS, tag);
         for (const [k, v] of Object.entries(nodeAttrs)) el.setAttribute(k, v);
         return el;
      });
      svg.replaceChildren(...children);

      this._applyA11y();
   }

   _applyA11y() {
      const label = this._label;
      if (label) {
         this.removeAttribute('aria-hidden');
         this.setAttribute('role', 'img');
         this.setAttribute('aria-label', label);
      } else {
         this.removeAttribute('role');
         this.removeAttribute('aria-label');
         this.setAttribute('aria-hidden', 'true');
      }
   }

   // Props re-render on assignment. The previous implementation required a
   // separate update() call, which every consumer had to remember.
   get name() { return this._name; }
   set name(value) {
      this._name = value;
      this._render();
   }

   get iconStyle() { return this._iconStyle; }
   set iconStyle(value) {
      this._iconStyle = value;
      deprecate('iconStyle', 'a single-style icon (Lucide has no filled variant)');
   }

   get size() { return this._size; }
   set size(value) {
      // Applied to the HOST, not an inner node, so `getComputedStyle(icon)
      // .fontSize` is meaningful and the svg scales with the surrounding text.
      this._size = SIZE_KEYWORDS[value] || value;
      this.style.fontSize = this._size;
   }

   get color() { return this._color; }
   set color(value) {
      this._color = value || 'currentColor';
      this.style.color = this._color;
   }

   get label() { return this._label; }
   set label(value) {
      this._label = typeof value === 'string' ? value : '';
      this._applyA11y();
   }

   /** Re-apply every prop. Kept for compatibility with the old contract. */
   update() {
      if (!this.$svg) return;
      this.name = this._name;
      this.size = this._size;
      this.color = this._color;
      this.label = this._label;
   }
}

customElements.define('slice-icon', Icon);