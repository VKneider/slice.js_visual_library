import test from 'node:test';
import assert from 'node:assert/strict';
import { fullDate, relativeTime, toDate } from './dates.js';

const now = new Date('2026-10-28T12:00:00Z');

test('toDate keeps a YYYY-MM-DD as a local day', () => {
   const date = toDate('2026-10-28');
   assert.equal(date.getFullYear(), 2026);
   assert.equal(date.getMonth(), 9);
   assert.equal(date.getDate(), 28);
   assert.equal(toDate('nope'), null);
});

test('relativeTime uses the translator format when it is enabled', () => {
   globalThis.slice = {
      translator: {
         enabled: true,
         format: {
            relative: (value, unit) => `${value} ${unit} (translated)`,
            date: () => 'DATE (translated)'
         }
      }
   };

   assert.equal(relativeTime(new Date(now.getTime() - 3 * 3600 * 1000), { now }), '-3 hour (translated)');
   assert.equal(fullDate('2026-10-28'), 'DATE (translated)');

   // An explicit locale wins over the active one (a fixed-format column).
   assert.match(relativeTime(new Date(now.getTime() - 3 * 3600 * 1000), { now, locale: 'en-US' }), /hours? ago/);

   delete globalThis.slice;
});

test('relativeTime falls back to Intl when the translator is off', () => {
   delete globalThis.slice;
   assert.match(relativeTime(new Date(now.getTime() - 3 * 3600 * 1000), { now, locale: 'en-US' }), /hours? ago/);
});
