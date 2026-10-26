// Hex colour helpers for the components that work with colours (ColorPicker,
// ThemeCreator). None of them throw: a value they cannot read gives the
// fallback, or null.

/**
 * Any of `#rgb`, `#rrggbb`, `rgb()` or `rgba()` as lowercase `#rrggbb`, which
 * is what `<input type="color">` can show. Anything else (named colours,
 * `oklch()`, `var()`) gives `fallback`.
 */
export function normalizeHex(value, fallback = null) {
   if (typeof value !== 'string') return fallback;
   const raw = value.trim().toLowerCase();

   const short = /^#([0-9a-f]{3})$/.exec(raw);
   if (short) return `#${short[1].split('').map((c) => c + c).join('')}`;
   if (/^#[0-9a-f]{6}$/.test(raw)) return raw;

   const rgb = /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/][\s\d.]+)?\)$/.exec(raw);
   if (rgb) {
      // CSS clamps channels above 255; do the same, or the hex would have the wrong length.
      const hex = [rgb[1], rgb[2], rgb[3]].map((part) => Math.min(255, Number(part)).toString(16).padStart(2, '0'));
      return `#${hex.join('')}`;
   }
   return fallback;
}

/** `#rrggbb` as `"r, g, b"`, the form of the `--*-color-rgb` theme tokens. */
export function hexToRgb(hex) {
   const value = normalizeHex(hex);
   if (!value) return null;
   const channel = (i) => parseInt(value.slice(i, i + 2), 16);
   return `${channel(1)}, ${channel(3)}, ${channel(5)}`;
}

/** `#ffffff` or `#000000`, whichever has more contrast on `hex` (WCAG luminance). */
export function readableOn(hex) {
   const value = normalizeHex(hex);
   if (!value) return '#ffffff';
   const linear = (i) => {
      const c = parseInt(value.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
   };
   const l = 0.2126 * linear(1) + 0.7152 * linear(3) + 0.0722 * linear(5);
   return 1.05 / (l + 0.05) >= (l + 0.05) / 0.05 ? '#ffffff' : '#000000';
}

/** `#rrggbb` as `{ h, s, v }`: hue in degrees (0–360), s and v from 0 to 1. */
export function hexToHsv(hex) {
   const value = normalizeHex(hex);
   if (!value) return null;
   const [r, g, b] = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
   const max = Math.max(r, g, b);
   const delta = max - Math.min(r, g, b);
   let h = 0;
   if (delta) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
   }
   if (h < 0) h += 360;
   return { h, s: max === 0 ? 0 : delta / max, v: max };
}

/** `{ h, s, v }` as `#rrggbb`. Hue wraps, so offsets like h + 180 just work. */
export function hsvToHex({ h, s, v }) {
   const hue = ((h % 360) + 360) % 360;
   const sat = Math.min(1, Math.max(0, s));
   const val = Math.min(1, Math.max(0, v));
   const c = val * sat;
   const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
   const m = val - c;
   const rgb = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(hue / 60) % 6];
   return `#${rgb.map((ch) => Math.round((ch + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}
