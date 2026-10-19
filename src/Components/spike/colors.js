/**
 * Colour maths shared by the components that deal in hex values.
 *
 * These live here rather than inside `ColorPicker` because the moment a second
 * component needs one of them — a theme editor deriving contrast tokens, a chart
 * picking readable text — copying it is how two copies start disagreeing. Same
 * arrangement as `recipes.js`: a plain module of named exports, imported by
 * whichever component needs it.
 *
 * Every function takes `fallback` and returns it rather than throwing, because
 * the platform primitive these exist to paper over (`<input type="color">`)
 * cannot report failure: hand it `rgb(0 0 0)` and it silently renders BLACK.
 */

/**
 * Normalize any CSS colour into the `#rrggbb` form a colour input can display.
 *
 * Handles the three spellings that actually reach a UI: `#rgb`, `#rrggbb`, and
 * `rgb()`/`rgba()` in comma or space syntax. Anything else (named colours,
 * `oklch()`, `color-mix()`, a `var()` reference) cannot be shown in a swatch at
 * all, so it returns the fallback.
 *
 * @param {unknown} value
 * @param {string|null} [fallback]
 * @returns {string|null} lowercase `#rrggbb`, or `fallback`
 */
export function normalizeHex(value, fallback = null) {
   if (typeof value !== 'string') return fallback;
   const raw = value.trim().toLowerCase();

   // #rgb -> #rrggbb. The naive `p + p` on an already-6-digit string is the bug
   // this guards against, so the length is checked first, not assumed.
   const short = /^#([0-9a-f]{3})$/.exec(raw);
   if (short) {
      return `#${short[1].split('').map((char) => char + char).join('')}`;
   }
   if (/^#[0-9a-f]{6}$/.test(raw)) {
      return raw;
   }

   const rgb = /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/][\s\d.]+)?\)$/.exec(raw);
   if (rgb) {
      const channels = [rgb[1], rgb[2], rgb[3]].map((part) => {
         // Out-of-range channels are legal CSS (they clamp) but would produce a
         // 1- or 3-digit hex, which the input rejects — so clamp explicitly.
         const clamped = Math.min(255, Math.max(0, Number(part)));
         return clamped.toString(16).padStart(2, '0');
      });
      return `#${channels.join('')}`;
   }

   return fallback;
}

/**
 * `#rrggbb` -> `"r, g, b"`, the shape the `--*-color-rgb` theme tokens take.
 *
 * @param {string} hex
 * @returns {string|null} null when the input is not a hex colour
 */
export function hexToRgb(hex) {
   const normalized = normalizeHex(hex, null);
   if (!normalized) return null;
   const channel = (offset) => parseInt(normalized.slice(offset, offset + 2), 16);
   return `${channel(1)}, ${channel(3)}, ${channel(5)}`;
}

/**
 * Black or white — whichever actually has more contrast against `hex`.
 *
 * Uses the WCAG relative-luminance formula rather than a naive brightness
 * average: perceived brightness and contrast ratio are not the same thing, and a
 * plain average picks white for mid greens that black reads far better on.
 *
 * @param {string} hex
 * @returns {string} `#ffffff` or `#000000`
 */
export function readableOn(hex) {
   const normalized = normalizeHex(hex, null);
   if (!normalized) return '#ffffff';

   const luminance = (offset) => {
      const raw = parseInt(normalized.slice(offset, offset + 2), 16) / 255;
      return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
   };
   const lightness = 0.2126 * luminance(1) + 0.7152 * luminance(3) + 0.0722 * luminance(5);

   const onWhite = 1.05 / (lightness + 0.05);
   const onBlack = (lightness + 0.05) / 0.05;
   return onWhite >= onBlack ? '#ffffff' : '#000000';
}

/**
 * `#rrggbb` -> `{ h, s, v }`, hue in degrees, s/v in 0..1.
 *
 * HSV rather than HSL because the palette generator needs hue as a NUMBER it can
 * add to — a colour harmony is literally a set of angular offsets from one base
 * hue, and hue arithmetic is the whole idea.
 *
 * @param {string} hex
 * @returns {{ h: number, s: number, v: number }|null}
 */
export function hexToHsv(hex) {
   const normalized = normalizeHex(hex, null);
   if (!normalized) return null;

   const r = parseInt(normalized.slice(1, 3), 16) / 255;
   const g = parseInt(normalized.slice(3, 5), 16) / 255;
   const b = parseInt(normalized.slice(5, 7), 16) / 255;

   const max = Math.max(r, g, b);
   const min = Math.min(r, g, b);
   const delta = max - min;

   let h = 0;
   if (delta !== 0) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
   }
   // A negative hue is the same hue one wheel-turn earlier; leave it negative
   // and let hsvToHex wrap it, so offsets compose correctly before conversion.
   if (h < 0) h += 360;

   return { h, s: max === 0 ? 0 : delta / max, v: max };
}

/**
 * `{ h, s, v }` -> `#rrggbb`. The inverse of {@link hexToHsv}, and the only
 * place the generator touches colour space — everything upstream works in
 * angles and ratios.
 *
 * @param {{ h: number, s: number, v: number }} hsv
 * @returns {string} lowercase `#rrggbb`
 */
export function hsvToHex({ h, s, v }) {
   const hue = ((h % 360) + 360) % 360;
   const sat = Math.min(1, Math.max(0, s));
   const val = Math.min(1, Math.max(0, v));

   const c = val * sat;
   const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
   const m = val - c;

   const sector = Math.floor(hue / 60) % 6;
   const rgb = [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
   ][sector];

   return (
      '#' +
      rgb.map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')
   );
}