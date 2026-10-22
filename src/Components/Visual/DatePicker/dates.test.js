import test from 'node:test';
import assert from 'node:assert/strict';
import {
   parseISO, normalize, addDays, addMonths, addYears, monthGrid, startOfWeek, weekday,
   daysInMonth, daysBetween, clamp, weekStartFor, fieldOrder, numericPattern, formatNumeric,
   parseTyped, parseTypedRange, formatDate, weekdayNames,
} from './dates.js';

test('parseISO accepts only real calendar days', () => {
   assert.deepEqual(parseISO('2026-10-21'), { y: 2026, m: 10, d: 21 });
   assert.equal(parseISO('2026-02-29'), null);
   assert.deepEqual(parseISO('2028-02-29'), { y: 2028, m: 2, d: 29 });
   assert.equal(parseISO('2026-13-01'), null);
   assert.equal(parseISO('21/10/2026'), null);
   assert.equal(parseISO(''), null);
});

test('normalize takes ISO, a local Date or parts', () => {
   assert.equal(normalize('2026-10-21'), '2026-10-21');
   assert.equal(normalize(new Date(2026, 9, 21, 23, 59)), '2026-10-21');
   assert.equal(normalize({ y: 2026, m: 1, d: 5 }), '2026-01-05');
   assert.equal(normalize('nope'), '');
   assert.equal(normalize(new Date('invalid')), '');
});

test('day and month arithmetic across month, year and DST boundaries', () => {
   assert.equal(addDays('2026-10-31', 1), '2026-11-01');
   assert.equal(addDays('2026-01-01', -1), '2025-12-31');
   // The weekend clocks change in Europe and the US: still one day per step.
   assert.equal(addDays('2026-03-28', 1), '2026-03-29');
   assert.equal(addDays('2026-03-29', 1), '2026-03-30');
   assert.equal(addDays('2026-11-01', 1), '2026-11-02');
   assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
   assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
   assert.equal(addMonths('2026-12-15', 1), '2027-01-15');
   assert.equal(addMonths('2026-01-15', -1), '2025-12-15');
   assert.equal(addYears('2028-02-29', 1), '2029-02-28');
   assert.equal(daysInMonth(2026, 2), 28);
   assert.equal(daysBetween('2026-10-01', '2026-10-21'), 20);
});

test('weeks start where the locale starts them', () => {
   assert.equal(weekday('2026-10-21'), 3);   // a Wednesday
   assert.equal(startOfWeek('2026-10-21', 1), '2026-10-19');
   assert.equal(startOfWeek('2026-10-21', 0), '2026-10-18');
   assert.equal(weekStartFor('en-US'), 0);
   assert.equal(weekStartFor('de-DE'), 1);
});

test('a month grid is six weeks from the first week day', () => {
   const grid = monthGrid(2026, 10, 1);
   assert.equal(grid.length, 42);
   assert.equal(grid[0], '2026-09-28');   // the Monday before Oct 1
   assert.ok(grid.includes('2026-10-31'));
   assert.equal(weekday(grid[0]), 1);
});

test('clamp keeps a date inside min and max', () => {
   assert.equal(clamp('2026-10-21', '2026-11-01', ''), '2026-11-01');
   assert.equal(clamp('2026-10-21', '', '2026-10-01'), '2026-10-01');
   assert.equal(clamp('2026-10-21', '2026-10-01', '2026-10-31'), '2026-10-21');
});

test('the typed form follows the locale', () => {
   assert.deepEqual(fieldOrder('en-US'), ['month', 'day', 'year']);
   assert.deepEqual(fieldOrder('es-VE'), ['day', 'month', 'year']);
   assert.equal(numericPattern('en-US'), 'mm/dd/yyyy');
   assert.equal(formatNumeric('2026-10-21', 'es-VE'), '21/10/2026');
   assert.equal(formatNumeric('2026-10-21', 'en-US'), '10/21/2026');
});

test('typed dates: ISO, the locale order, any separator, two-digit years', () => {
   assert.equal(parseTyped('2026-10-21', 'en-US'), '2026-10-21');
   assert.equal(parseTyped('21/10/2026', 'es-VE'), '2026-10-21');
   assert.equal(parseTyped('21.10.26', 'de-DE'), '2026-10-21');
   assert.equal(parseTyped('10/21/2026', 'en-US'), '2026-10-21');
   assert.equal(parseTyped('2026/10/21', 'es-VE'), '2026-10-21');
   assert.equal(parseTyped('31/02/2026', 'es-VE'), null);
   assert.equal(parseTyped('hello', 'es-VE'), null);
   assert.deepEqual(parseTypedRange('01/10/2026 – 07/10/2026', 'es-VE'), ['2026-10-01', '2026-10-07']);
   assert.deepEqual(parseTypedRange('2026-10-01/2026-10-07', 'es-VE'), ['2026-10-01', '2026-10-07']);
});

test('formatting for reading, and weekday names from the week start', () => {
   assert.equal(formatDate('2026-10-21', 'en-US'), 'Oct 21, 2026');
   assert.equal(formatDate('2026-10-21', 'en-US', { weekday: 'long' }), 'Wednesday');
   assert.deepEqual(weekdayNames('en-US', 0, 'narrow'), ['S', 'M', 'T', 'W', 'T', 'F', 'S']);
   assert.equal(weekdayNames('en-US', 1, 'short')[0], 'Mon');
});