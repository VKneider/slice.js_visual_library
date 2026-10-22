// Calendar dates for DatePicker, as ISO strings ("2026-10-21").
//
// A date in a date picker is a day on a calendar, not an instant, so it is
// kept as text and every calculation is done in UTC. Local Date arithmetic is
// how date pickers end up an hour (and so a day) off around a daylight-saving
// change, or show "yesterday" to someone west of Greenwich.
//
// Pure functions, no DOM: DatePicker.js uses them and dates.test.js runs them
// in Node.

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Is `y-m-d` a real calendar day (m 1-12)? */
export function isValidParts(y, m, d) {
   if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
   if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1) return false;
   return d <= daysInMonth(y, m);
}

export function daysInMonth(y, m) {
   return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** "2026-10-21" -> { y, m, d }, or null for anything that is not a real day. */
export function parseISO(value) {
   const match = ISO.exec(String(value ?? '').trim());
   if (!match) return null;
   const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
   return isValidParts(y, m, d) ? { y, m, d } : null;
}

export function toISO({ y, m, d }) {
   return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Normalise an ISO string, a Date (its LOCAL day) or a {y,m,d} to ISO, or ''. */
export function normalize(value) {
   if (!value) return '';
   if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return '';
      return toISO({ y: value.getFullYear(), m: value.getMonth() + 1, d: value.getDate() });
   }
   if (typeof value === 'object' && 'y' in value) return isValidParts(value.y, value.m, value.d) ? toISO(value) : '';
   const parts = parseISO(value);
   return parts ? toISO(parts) : '';
}

/** Today, on the person's own calendar. */
export function todayISO(now = new Date()) {
   return normalize(now);
}

function utc(iso) {
   const { y, m, d } = parseISO(iso);
   const date = new Date(Date.UTC(2000, m - 1, d));
   date.setUTCFullYear(y);   // Date.UTC maps years 0-99 to 1900-1999
   return date;
}

function fromUTC(date) {
   return toISO({ y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() });
}

export function addDays(iso, n) {
   const date = utc(iso);
   date.setUTCDate(date.getUTCDate() + n);
   return fromUTC(date);
}

/** Months later, keeping the day where it can (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(iso, n) {
   const { y, m, d } = parseISO(iso);
   const index = y * 12 + (m - 1) + n;
   const ny = Math.floor(index / 12);
   const nm = (index % 12) + 1;
   return toISO({ y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) });
}

export function addYears(iso, n) {
   return addMonths(iso, n * 12);
}

/** ISO strings sort as dates, so this is a plain comparison. */
export function compare(a, b) {
   if (a === b) return 0;
   return a < b ? -1 : 1;
}

export function clamp(iso, min, max) {
   if (min && iso < min) return min;
   if (max && iso > max) return max;
   return iso;
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(iso) {
   return utc(iso).getUTCDay();
}

export function startOfMonth(iso) {
   const { y, m } = parseISO(iso);
   return toISO({ y, m, d: 1 });
}

export function startOfWeek(iso, weekStart = 1) {
   const back = (weekday(iso) - weekStart + 7) % 7;
   return addDays(iso, -back);
}

/** The 42 days (6 weeks) a month view shows, starting on `weekStart`. */
export function monthGrid(y, m, weekStart = 1) {
   const first = startOfWeek(toISO({ y, m, d: 1 }), weekStart);
   return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

export function daysBetween(a, b) {
   return Math.round((utc(b).getTime() - utc(a).getTime()) / 86400000);
}

// ── Locale ──────────────────────────────────────────────────────

/** First day of the week for a locale: 0 = Sunday, 1 = Monday, 6 = Saturday. */
export function weekStartFor(locale) {
   try {
      // getWeekInfo() (weekInfo in older engines) is newer than the TS lib types.
      /** @type {Intl.Locale & { getWeekInfo?: () => { firstDay: number }, weekInfo?: { firstDay: number } }} */
      const loc = new Intl.Locale(locale);
      const info = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo;
      if (info && Number.isInteger(info.firstDay)) return info.firstDay % 7;
   } catch { /* older engines */ }
   // Without weekInfo: Sunday where it is the custom, Monday elsewhere.
   const region = String(locale).split('-')[1]?.toUpperCase() || '';
   return ['US', 'CA', 'MX', 'BR', 'JP', 'IL', 'PH', 'VE', 'CO', 'PE', 'AR'].includes(region) ? 0 : 1;
}

/** Order of day / month / year in the locale's numeric dates, e.g. ['day','month','year']. */
export function fieldOrder(locale) {
   try {
      const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
         .formatToParts(new Date(Date.UTC(2026, 10, 23)));
      const order = parts.filter((p) => ['day', 'month', 'year'].includes(p.type)).map((p) => p.type);
      if (order.length === 3) return order;
   } catch { /* unknown locale */ }
   return ['year', 'month', 'day'];
}

/** The numeric form people type, e.g. "dd/mm/yyyy" or "mm/dd/yyyy". */
export function numericPattern(locale) {
   const sep = numericSeparator(locale);
   const names = { day: 'dd', month: 'mm', year: 'yyyy' };
   return fieldOrder(locale).map((part) => names[part]).join(sep);
}

function numericSeparator(locale) {
   try {
      const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
         .formatToParts(new Date(Date.UTC(2026, 10, 23)));
      const literal = parts.find((p) => p.type === 'literal');
      if (literal && literal.value.trim()) return literal.value.trim();
   } catch { /* unknown locale */ }
   return '/';
}

/** A date in the numeric form people type: "21/10/2026" in es-VE. */
export function formatNumeric(iso, locale) {
   const { y, m, d } = parseISO(iso);
   const values = { day: String(d).padStart(2, '0'), month: String(m).padStart(2, '0'), year: String(y) };
   return fieldOrder(locale).map((part) => values[part]).join(numericSeparator(locale));
}

/** A date for reading: Intl options, default { dateStyle: 'medium' } ("21 oct 2026"). */
export function formatDate(iso, locale, options) {
   if (!iso) return '';
   try {
      return new Intl.DateTimeFormat(locale, { ...(options || { dateStyle: 'medium' }), timeZone: 'UTC' }).format(utc(iso));
   } catch {
      return iso;
   }
}

/**
 * What someone typed, as ISO, or null. Accepts ISO ("2026-10-21") and the
 * locale's numeric order with any separator ("21/10/2026", "21.10.26",
 * "21 10 2026"). A two-digit year means 2000-2099.
 */
export function parseTyped(text, locale) {
   const value = String(text ?? '').trim();
   if (!value) return null;
   const iso = parseISO(value);
   if (iso) return toISO(iso);
   const numbers = value.match(/\d+/g);
   if (!numbers || numbers.length !== 3) return null;
   const order = fieldOrder(locale);
   const parts = {};
   order.forEach((name, i) => { parts[name] = Number(numbers[i]); });
   // A 4-digit first number is a year whatever the locale says (2026/10/21).
   if (numbers[0].length === 4 && order[0] !== 'year') {
      parts.year = Number(numbers[0]);
      parts.month = Number(numbers[1]);
      parts.day = Number(numbers[2]);
   }
   if (parts.year < 100 && String(parts.year).length <= 2) parts.year += 2000;
   return isValidParts(parts.year, parts.month, parts.day)
      ? toISO({ y: parts.year, m: parts.month, d: parts.day })
      : null;
}

/** Two typed dates ("01/10/2026 – 07/10/2026"), as [startISO, endISO] or null. */
export function parseTypedRange(text, locale) {
   const value = String(text ?? '').trim();
   if (!value) return null;
   const isoPair = value.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/);
   if (isoPair) {
      const a = normalize(isoPair[1]);
      const b = normalize(isoPair[2]);
      return a && b ? [a, b] : null;
   }
   const numbers = value.match(/\d+/g);
   if (!numbers || numbers.length !== 6) return null;
   const sep = numericSeparator(locale);
   const a = parseTyped(numbers.slice(0, 3).join(sep), locale);
   const b = parseTyped(numbers.slice(3).join(sep), locale);
   return a && b ? [a, b] : null;
}

/**
 * Month names for the month view: ["January", …] in the locale.
 * @param {string} locale
 * @param {'long' | 'short' | 'narrow'} [style]
 */
export function monthNames(locale, style = 'long') {
   const fmt = new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' });
   return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2026, i, 1))));
}

/**
 * Weekday names starting on `weekStart`: ["Mo", "Tu", …].
 * @param {string} locale
 * @param {number} [weekStart]
 * @param {'long' | 'short' | 'narrow'} [style]
 */
export function weekdayNames(locale, weekStart = 1, style = 'short') {
   const fmt = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
   // 2026-11-01 is a Sunday.
   return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(Date.UTC(2026, 10, 1 + ((weekStart + i) % 7)))));
}