import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generatePalette, HARMONY_NAMES, TEMPERATURE_NAMES } from './palette.js';
import { hexToHsv } from '../../spike/colors.js';

// The point of the generator is COHERENCE, so that is what is asserted. Testing
// "it returns 15 hex strings" would pass for a random number generator, which is
// exactly the version this file exists to replace.

/** WCAG relative luminance. */
function luminance(hex) {
   const channel = (offset) => {
      const raw = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return raw <= 0.03928 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
   };
   return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrastRatio(a, b) {
   const la = luminance(a);
   const lb = luminance(b);
   const [hi, lo] = la > lb ? [la, lb] : [lb, la];
   return (hi + 0.05) / (lo + 0.05);
}

const HEX = /^#[0-9a-f]{6}$/;
const ROLLS = 40;

test('generatePalette — shape', async (t) => {
   await t.test('produces every token the editor owns, as valid hex', () => {
      const { values } = generatePalette({ mode: 'light' });
      const expected = [
         '--primary-color',
         '--primary-background-color',
         '--primary-color-contrast',
         '--primary-color-shade',
         '--secondary-color',
         '--secondary-background-color',
         '--secondary-color-contrast',
         '--success-color',
         '--warning-color',
         '--danger-color',
         '--font-primary-color',
         '--font-secondary-color',
         '--tertiary-background-color',
         '--medium-color',
         '--disabled-color',
      ];
      for (const token of expected) {
         assert.ok(values[token], `missing ${token}`);
         assert.match(values[token], HEX, `${token} is not #rrggbb: ${values[token]}`);
      }
   });

   await t.test('reports the harmony it used', () => {
      for (let i = 0; i < 20; i++) {
         const { harmony } = generatePalette();
         assert.ok(HARMONY_NAMES.includes(harmony), `unknown harmony ${harmony}`);
      }
   });

   await t.test('is actually random, not a constant', () => {
      const seen = new Set();
      for (let i = 0; i < ROLLS; i++) {
         seen.add(JSON.stringify(generatePalette({ mode: 'light' }).values));
      }
      // Over 40 rolls a fixed palette could only ever produce one signature.
      assert.ok(seen.size > ROLLS * 0.9, `only ${seen.size} distinct palettes in ${ROLLS} rolls`);
   });
});

test('generatePalette — variety', async (t) => {
   await t.test('every harmony is reachable', () => {
      const seen = new Set();
      for (let i = 0; i < 400; i++) seen.add(generatePalette().harmony);
      // Nine harmonies at random: anything less than all nine after 400 rolls
      // means one is unreachable.
      assert.equal(seen.size, HARMONY_NAMES.length, `only reached ${[...seen].join(', ')}`);
   });

   await t.test('every temperature is reachable', () => {
      const seen = new Set();
      for (let i = 0; i < 400; i++) seen.add(generatePalette().temperature);
      assert.equal(seen.size, TEMPERATURE_NAMES.length, `only reached ${[...seen].join(', ')}`);
   });

   await t.test('the primary/secondary hue DISTANCE varies', () => {
      // The variety that matters most: how far apart the two brand colours sit.
      // With primary and secondary pinned to fixed harmony slots, every palette
      // has the same distance and only the rotation changes.
      const distances = new Set();
      for (let i = 0; i < 200; i++) {
         const { values } = generatePalette();
         const a = hexToHsv(values['--primary-color']).h;
         const b = hexToHsv(values['--secondary-color']).h;
         const d = Math.abs(((a - b + 540) % 360) - 180);
         distances.add(Math.round(d / 15));
      }
      assert.ok(distances.size >= 4, `only ${distances.size} distinct brand separations`);
   });

   await t.test('vividness ranges from muted to vivid', () => {
      const saturations = [];
      for (let i = 0; i < 300; i++) {
         saturations.push(hexToHsv(generatePalette().values['--primary-color']).s);
      }
      assert.ok(Math.max(...saturations) > 0.85, 'never produced a vivid primary');
      assert.ok(Math.min(...saturations) < 0.35, 'never produced a muted primary');
   });

   await t.test('temperature bias moves the BASE hue, not every slot', () => {
      // Asserted on baseHue, not on the primary: the harmony offsets legitimately
      // rotate individual colours far from the base — a split-complementary is
      // partly warm by design, and a "cool" palette whose secondary landed at 60°
      // would be a bug, not a feature.
      const cool = [];
      const warm = [];
      for (let i = 0; i < 400; i++) {
         const { baseHue, temperature } = generatePalette();
         if (temperature === 'cool') cool.push(baseHue);
         if (temperature === 'warm') warm.push(baseHue);
      }
      assert.ok(cool.length > 0, 'cool was never sampled');
      assert.ok(warm.length > 0, 'warm was never sampled');
      assert.ok(
         cool.every((h) => h >= 170 && h < 320),
         `a cool palette was based outside the cool range: ${cool.filter((h) => h < 170 || h >= 320)}`
      );
      assert.ok(
         warm.every((h) => h >= 330 || h < 360),
         `a warm palette was based outside the warm range: ${warm.filter((h) => h < 330 && h >= 360)}`
      );
   });

   await t.test('hue spread genuinely varies', () => {
      // Narrow spread clusters the brand hues; wide spread pulls them apart.
      const spreads = new Set();
      for (let i = 0; i < 200; i++) {
         const { values } = generatePalette();
         const a = hexToHsv(values['--primary-color']).h;
         const b = hexToHsv(values['--secondary-color']).h;
         spreads.add(Math.round(Math.abs(((a - b + 540) % 360) - 180) / 20));
      }
      assert.ok(spreads.size >= 5, `spread only produced ${spreads.size} buckets`);
   });
});

test('generatePalette — coherence', async (t) => {
   await t.test('light mode has a light background and dark text', () => {
      for (let i = 0; i < ROLLS; i++) {
         const { values } = generatePalette({ mode: 'light' });
         const bg = hexToHsv(values['--primary-background-color']);
         const text = hexToHsv(values['--font-primary-color']);
         assert.ok(bg.v > 0.85, `background too dark in light mode: ${bg.v}`);
         assert.ok(text.v < 0.4, `body text too light in light mode: ${text.v}`);
      }
   });

   await t.test('dark mode is the mirror image', () => {
      for (let i = 0; i < ROLLS; i++) {
         const { values } = generatePalette({ mode: 'dark' });
         const bg = hexToHsv(values['--primary-background-color']);
         const text = hexToHsv(values['--font-primary-color']);
         assert.ok(bg.v < 0.25, `background too light in dark mode: ${bg.v}`);
         assert.ok(text.v > 0.85, `body text too dark in dark mode: ${text.v}`);
      }
   });

   await t.test('body text clears WCAG AA on the page background, every roll', () => {
      // The single most important invariant: random lightness is exactly how a
      // "random theme" ships unreadable body copy.
      for (const mode of ['light', 'dark']) {
         for (let i = 0; i < ROLLS; i++) {
            const { values } = generatePalette({ mode });
            const ratio = contrastRatio(values['--font-primary-color'], values['--primary-background-color']);
            assert.ok(ratio >= 4.5, `${mode}: body text contrast ${ratio.toFixed(2)}:1 (needs 4.5)`);
         }
      }
   });

   await t.test('brand text clears WCAG AA on brand fills, every roll', () => {
      for (const mode of ['light', 'dark']) {
         for (let i = 0; i < ROLLS; i++) {
            const { values } = generatePalette({ mode });
            const primary = contrastRatio(values['--primary-color-contrast'], values['--primary-color']);
            const secondary = contrastRatio(values['--secondary-color-contrast'], values['--secondary-color']);
            assert.ok(primary >= 4.5, `${mode}: primary button text ${primary.toFixed(2)}:1`);
            assert.ok(secondary >= 4.5, `${mode}: secondary button text ${secondary.toFixed(2)}:1`);
         }
      }
   });

   await t.test('shade is always darker than the primary it shades', () => {
      for (const mode of ['light', 'dark']) {
         for (let i = 0; i < ROLLS; i++) {
            const { values } = generatePalette({ mode });
            const primary = luminance(values['--primary-color']);
            const shade = luminance(values['--primary-color-shade']);
            assert.ok(shade < primary, `${mode}: shade is not darker than its primary`);
         }
      }
   });

   await t.test('status colours stay in their conventional hue bands', () => {
      // A purple "Success" badge is random, but it lies about what it means.
      // `danger` wraps the 0/360 seam, so its band is two ranges.
      //
      // ±2° of slack, because the generated hue is round-tripped through
      // #rrggbb: 8 bits per channel cannot express hue 62.0 exactly, so a band
      // checked to a tenth of a degree fails at its own edge roughly one run in
      // five. The slack is the quantisation, not a loosened requirement.
      const SLACK = 2;
      const band = {
         success: [[128 - SLACK, 176 + SLACK]],
         warning: [[14 - SLACK, 62 + SLACK]],
         danger: [[340 - SLACK, 360], [0, 28 + SLACK]],
      };
      for (let i = 0; i < ROLLS; i++) {
         const { values } = generatePalette();
         for (const [token, ranges] of Object.entries(band)) {
            const hue = hexToHsv(values[`--${token}-color`]).h;
            const inBand = ranges.some(([lo, hi]) => hue >= lo && hue <= hi);
            assert.ok(inBand, `${token} hue ${hue.toFixed(0)} outside ${JSON.stringify(ranges)}`);
         }
      }
   });

   await t.test('brand hues are NOT confined — they roam the whole wheel', () => {
      // The complement of the status rule: the brand side must stay genuinely
      // free, or "random" is just "slightly different purple".
      const hues = new Set();
      for (let i = 0; i < 200; i++) {
         hues.add(Math.floor(hexToHsv(generatePalette().values['--primary-color']).h / 30));
      }
      assert.ok(hues.size >= 10, `base hues only covered ${hues.size} of 12 sectors`);
   });

   await t.test('surfaces sit between the background and the brand, not on top of them', () => {
      // --secondary-background-color is a container fill; it must not end up
      // darker than the page it sits on in light mode, or every card inverts.
      for (let i = 0; i < ROLLS; i++) {
         const { values } = generatePalette({ mode: 'light' });
         const bg = luminance(values['--primary-background-color']);
         const surface = luminance(values['--secondary-background-color']);
         assert.ok(surface < bg, 'secondary surface is darker than the page background in light mode');
         assert.ok(surface > 0.2, 'secondary surface is too dark to be a container fill');
      }
   });

   await t.test('falls back to light for an unreadable mode', () => {
      const { values } = generatePalette({ mode: 'nonsense' });
      assert.match(values['--primary-background-color'], HEX);
      assert.ok(hexToHsv(values['--primary-background-color']).v > 0.85);
   });
});