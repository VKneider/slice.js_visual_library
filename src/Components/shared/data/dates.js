// Dates the way people say them: "3 hours ago", "Oct 24, 2026, 9:10 AM".
// Used by DataList (timestamps, grouping by day) and DescriptionList (dates).

/** A Date from a Date, a timestamp or an ISO text; null when it is not one. */
export function toDate(value) {
   if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
   if (typeof value === 'number') return new Date(value);
   if (typeof value === 'string' && value.trim()) {
      // "2026-10-24" is a local day, not midnight UTC.
      const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
      const date = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
   }
   return null;
}

/** @type {[Intl.RelativeTimeFormatUnit, number][]} */
const UNITS = [
   ['year', 365 * 24 * 3600],
   ['month', 30 * 24 * 3600],
   ['week', 7 * 24 * 3600],
   ['day', 24 * 3600],
   ['hour', 3600],
   ['minute', 60],
];

/**
 * "3 hours ago", "in 2 days", "just now" — in the page's language, or `locale`.
 * With the translator enabled, its active locale wins unless `locale` is passed.
 * @param {any} value
 * @param {{ locale?: string, now?: Date, justNow?: string }} [options]
 */
export function relativeTime(value, { locale, now = new Date(), justNow } = {}) {
   const date = toDate(value);
   if (!date) return '';
   const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
   const abs = Math.abs(seconds);

   const translator = globalThis.slice?.translator;
   if (!locale && translator?.enabled) {
      const { format } = translator;
      if (abs < 45) return justNow || format.relative(0, 'second');
      for (const [unit, size] of UNITS) {
         if (abs >= size) return format.relative(Math.round(seconds / size), unit);
      }
      return format.relative(Math.round(seconds / 60), 'minute');
   }

   const pageLocale = globalThis.document?.documentElement?.lang;
   const format = new Intl.RelativeTimeFormat(locale || pageLocale || undefined, { numeric: 'auto' });
   if (abs < 45) return justNow || format.format(0, 'second');
   for (const [unit, size] of UNITS) {
      if (abs >= size) return format.format(Math.round(seconds / size), unit);
   }
   return format.format(Math.round(seconds / 60), 'minute');
}

/** The full date and time, for a title attribute next to a relative time. */
export function fullDate(value, locale) {
   const date = toDate(value);
   if (!date) return '';

   const translator = globalThis.slice?.translator;
   if (!locale && translator?.enabled) {
      return translator.format.date(date, { dateStyle: 'medium', timeStyle: 'short' });
   }

   const pageLocale = globalThis.document?.documentElement?.lang;
   return new Intl.DateTimeFormat(locale || pageLocale || undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
