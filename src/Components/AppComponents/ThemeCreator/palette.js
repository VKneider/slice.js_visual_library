/**
 * Random palette generation — "random, but it makes sense".
 *
 * The incoherence of a naive random palette is not randomness itself, it is
 * randomness applied to the wrong axis. Five independent random hex values have
 * no relationship to each other, and a palette is entirely relationship. So the
 * generator randomises the things that carry character and pins the things that
 * carry meaning:
 *
 *   RANDOMISED — the harmony rule, the base hue, the hue spread, saturation,
 *   and a temperature bias. This is where the variety comes from: nine
 *   harmonies x spread x vividness x temperature x 360 base hues x two modes.
 *
 *   PINNED — lightness per semantic role, and the status hue bands. A page
 *   background must be light, body text must clear AA on it, `--primary-color-shade`
 *   must be darker than `--primary-color`. Random lightness is what makes a
 *   "random theme" unusable, and a purple "Success" badge lies about what it
 *   means.
 *
 * Every colour that can be DERIVED is derived: shade from its primary, contrast
 * from the fill it sits on. Drawing them independently is how you ship a shade
 * lighter than the colour it shades, or a button whose label is unreadable.
 */

import { hsvToHex, hexToHsv, readableOn } from '../../spike/colors.js';

/**
 * Hue relationships in degrees from the base hue. The chosen rule is applied
 * consistently across the palette — that consistency is what reads as "designed".
 */
const HARMONIES = [
   { name: 'monochromatic', offsets: [0, 10, -10, 20, -20] },
   { name: 'analogous', offsets: [0, 24, -24, 48, -48] },
   { name: 'extended-analogous', offsets: [0, 30, -30, 60, 90] },
   { name: 'complementary', offsets: [0, 180, 24, 204, -24] },
   { name: 'split-complementary', offsets: [0, 150, 210, 30, 330] },
   { name: 'triadic', offsets: [0, 120, 240, 60, 300] },
   { name: 'triadic-plus', offsets: [0, 120, 240, 200, 320] },
   { name: 'tetradic', offsets: [0, 60, 180, 240, 30] },
   { name: 'square', offsets: [0, 90, 180, 270, 45] },
];

/** Conventional hue centres for the status colours, ± STATUS_JITTER. */
const STATUS_HUES = {
   success: 152,
   warning: 38,
   danger: 4,
};

/** How far a status hue may drift from its conventional centre. */
const STATUS_JITTER = 24;

/**
 * Per-role saturation / value bands as `[min, max]`, drawn from at random.
 *
 * `surface` and `background` are deliberately tight: they are what body text
 * has to sit on, so their lightness is the one thing the "personality" knobs
 * below are not allowed to touch.
 */
const ROLES = {
   light: {
      background: { hue: 'primary', sat: [0.04, 0.12], v: [0.985, 1] },
      surface: { hue: 'primary', sat: [0.10, 0.22], v: [0.94, 0.97] },
      text: { hue: 'primary', sat: [0.30, 0.45], v: [0.14, 0.22] },
      textMuted: { hue: 'primary', sat: [0.25, 0.40], v: [0.40, 0.50] },
      brand: { hue: 'any', sat: [0.55, 0.80], v: [0.45, 0.60] },
      accent: { hue: 'any', sat: [0.50, 0.75], v: [0.42, 0.58] },
      status: { sat: [0.50, 0.80], v: [0.42, 0.58] },
      neutral: { hue: 'primary', sat: [0.05, 0.15], v: [0.45, 0.58] },
      disabled: { hue: 'primary', sat: [0.08, 0.18], v: [0.80, 0.88] },
   },
   dark: {
      background: { hue: 'primary', sat: [0.12, 0.25], v: [0.06, 0.11] },
      surface: { hue: 'primary', sat: [0.18, 0.32], v: [0.13, 0.20] },
      text: { hue: 'primary', sat: [0.10, 0.25], v: [0.92, 0.98] },
      textMuted: { hue: 'primary', sat: [0.20, 0.35], v: [0.62, 0.72] },
      brand: { hue: 'any', sat: [0.55, 0.80], v: [0.62, 0.78] },
      accent: { hue: 'any', sat: [0.50, 0.75], v: [0.60, 0.75] },
      status: { sat: [0.50, 0.80], v: [0.58, 0.72] },
      neutral: { hue: 'primary', sat: [0.05, 0.15], v: [0.48, 0.62] },
      disabled: { hue: 'primary', sat: [0.08, 0.18], v: [0.26, 0.34] },
   },
};

/** Where the base hue is allowed to land, by temperature. */
const TEMPERATURES = [
   { name: 'any', weight: 0.4, range: [0, 360] },
   { name: 'cool', weight: 0.3, range: [170, 320] },
   { name: 'warm', weight: 0.3, range: [330, 360] },
];

/** Roles the lightness "tone" knob may nudge — never the ones text sits on. */
const TONE_ROLES = new Set(['brand', 'accent', 'status']);

const between = ([min, max]) => min + Math.random() * (max - min);
const clamp01 = (n) => Math.min(1, Math.max(0, n));
const pickWeighted = (entries) => {
   const roll = Math.random() * entries.reduce((sum, e) => sum + e.weight, 0);
   let acc = 0;
   for (const entry of entries) {
      acc += entry.weight;
      if (roll <= acc) return entry;
   }
   return entries[entries.length - 1];
};

/**
 * Sample the axes that give a palette its character. Sampled ONCE per palette,
 * so every colour in it comes from the same hand.
 */
function samplePersonality() {
   const temperature = pickWeighted(TEMPERATURES);
   return {
      temperature: temperature.name,
      // How far apart the harmony's hues sit. <1 tightens toward monochrome,
      // >1 pushes toward a louder spread.
      spread: 0.7 + Math.random() * 0.8,
      // Low is muted and elegant, high is vivid. The floor has to reach low
      // enough that a genuinely desaturated palette is actually reachable —
      // with a higher floor the "muted" end of the range never materialised.
      vividness: 0.45 + Math.random() * 0.9,
      // A lightness bias for the expressive roles only.
      tone: -0.1 + Math.random() * 0.2,
      shade: 0.6 + Math.random() * 0.2,
      [temperature.name]: true,
      baseHue: temperature.range[0] + Math.random() * (temperature.range[1] - temperature.range[0]),
   };
}

/**
 * Build one coherent, fully random palette.
 *
 * @param {object}  [options]
 * @param {'light'|'dark'} [options.mode]
 * @returns {{
 *    values: Record<string, string>,
 *    harmony: string,
 *    baseHue: number,
 *    temperature: string,
 * }}
 */
export function generatePalette({ mode = 'light' } = {}) {
   const bands = ROLES[mode] || ROLES.light;

   const p = samplePersonality();
   const harmony = HARMONIES[Math.floor(Math.random() * HARMONIES.length)];

   // Which harmony slot becomes the primary, and which the secondary. Letting
   // these vary changes the hue DISTANCE between the two brand colours, which a
   // fixed primary=slot0 / secondary=slot1 pairing can never produce.
   const slots = harmony.offsets.map((_, i) => i);
   const primarySlot = slots.splice(Math.floor(Math.random() * slots.length), 1)[0];
   const secondarySlot = slots.splice(Math.floor(Math.random() * slots.length), 1)[0];

   const hueAt = (slot) => p.baseHue + harmony.offsets[slot] * p.spread;

   const fromBands = (role) => {
      const spec = bands[role];
      const h =
         spec.hue === 'any' ? hueAt(role === 'accent' ? secondarySlot : primarySlot) : hueAt(primarySlot);
      const v = TONE_ROLES.has(role) ? clamp01(between(spec.v) + p.tone) : clamp01(between(spec.v));
      return hsvToHex({ h, s: clamp01(between(spec.sat) * p.vividness), v });
   };

   const status = (name) => {
      const spec = bands.status;
      const h = STATUS_HUES[name] + (Math.random() * 2 - 1) * STATUS_JITTER;
      const v = clamp01(between(spec.v) + p.tone);
      return hsvToHex({ h, s: clamp01(between(spec.sat) * p.vividness), v });
   };

   const primaryHsv = hexToHsv(fromBands('brand'));
   const primary = primaryHsv ? hsvToHex(primaryHsv) : '#0066ff';

   // DERIVED, never drawn: same hue, lower value. Two independent draws from
   // the same band can produce a "shade" LIGHTER than the colour it shades.
   const shade = primaryHsv
      ? hsvToHex({ ...primaryHsv, v: clamp01(primaryHsv.v * p.shade) })
      : '#dddddd';

   const secondary = fromBands('accent');
   const background = fromBands('background');

   return {
      harmony: harmony.name,
      // Floor, not round: the temperature ranges are half-open [lo, hi), and
      // rounding a base of 319.7 up to 320 would report a hue outside the very
      // range it was sampled from.
      baseHue: Math.floor(((p.baseHue % 360) + 360) % 360),
      temperature: p.temperature,
      values: {
         '--primary-color': primary,
         '--primary-color-shade': shade,
         '--primary-background-color': background,
         '--primary-color-contrast': readableOn(primary),

         '--secondary-color': secondary,
         '--secondary-background-color': fromBands('surface'),
         '--secondary-color-contrast': readableOn(secondary),

         '--tertiary-background-color': fromBands('surface'),

         '--success-color': status('success'),
         '--warning-color': status('warning'),
         '--danger-color': status('danger'),

         '--font-primary-color': fromBands('text'),
         '--font-secondary-color': fromBands('textMuted'),

         '--medium-color': fromBands('neutral'),
         '--disabled-color': fromBands('disabled'),
      },
   };
}

/** The harmony names, so a UI can explain what it just produced. */
export const HARMONY_NAMES = HARMONIES.map((h) => h.name);

/** The temperature names, likewise. */
export const TEMPERATURE_NAMES = TEMPERATURES.map((t) => t.name);