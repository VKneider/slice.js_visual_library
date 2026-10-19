import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * No component may ask for a font-weight above the library's declared ceiling.
 *
 * `Button` and `NotFound` asked for `800`, and 800 sits above the heaviest weight
 * most font stacks carry — so CSS font matching took the nearest face and
 * emboldened it *synthetically*, painting every glyph twice with an offset.
 * Measured on the same string at the same size: 700 = 37.22px wide,
 * 800 = 38.41px, i.e. 1.19px of weight that does not exist. It read as a
 * misregistered edge on the label.
 *
 * The ceiling is read from the `@import` in `sliceStyles.css` (Source Sans 3 at
 * wght@400;500;600;700), which is this repo's own statement of the weights it
 * works with. Worth being precise: this app never loads that stylesheet, so the
 * ceiling is a house-style bound, not the thing that was actually protecting the
 * label — the defect stands for any font, and the fix (700, already the weight
 * Badge, Table and Toast use) is what removed it.
 *
 * The test exists because the lesson is not "use 700" — it is that a stylesheet
 * and a component can disagree about which weights exist, and only a render
 * shows it.
 */

const STYLES = 'src/public/Styles/sliceStyles.css';
const ROOTS = ['src/Components/Visual'];

function readShippedWeights() {
   const css = readFileSync(STYLES, 'utf8');
   const importLine = css.split('\n').find((l) => l.includes('@import'));
   assert.ok(importLine, `${STYLES} should carry the @import that ships the font`);

   const family = importLine.match(/family=([^&]+)/);
   const weights = importLine.match(/wght@([\d;]+)/);
   assert.ok(family, 'the @import should name a family');
   assert.ok(weights, 'the @import should pin an explicit weight range');

   const list = weights[1].split(';').map(Number);
   return { family: family[1].replace(/\+/g, ' '), weights: list, max: Math.max(...list) };
}

function walk(dir, out = []) {
   for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (entry.endsWith('.css')) out.push(full);
   }
   return out;
}

test('no component requests a font-weight above the one the library ships', () => {
   const shipped = readShippedWeights();
   const offenders = [];

   for (const root of ROOTS) {
      for (const file of walk(root)) {
         readFileSync(file, 'utf8')
            .split('\n')
            .forEach((line, i) => {
               const m = line.match(/font-weight:\s*(\d{3})\s*;/);
               if (!m) return;
               const weight = Number(m[1]);
               if (weight > shipped.max) {
                  offenders.push(`${file}:${i + 1} asks for ${weight}, shipped max is ${shipped.max}`);
               }
            });
      }
   }

   assert.deepEqual(
      offenders,
      [],
      `weights above ${shipped.max} are synthesised, not real.\n` +
         `sliceStyles.css imports ${shipped.family} at wght@${shipped.weights.join(';')}.\n` +
         offenders.join('\n')
   );
});
