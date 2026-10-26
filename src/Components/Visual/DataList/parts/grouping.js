import { getter } from '../../../shared/data/paths.js';
import { toDate } from '../../../shared/data/dates.js';

// Part of DataList: used only by DataList.js (see shared/README.md).
//
// Splitting a list into groups with a heading each: by a field ("Status:
// Open"), by first letter (contacts), or by day ("Today", "Yesterday").
//
//   groupBy: 'status'                      by a key, a path or a function
//   groupBy: { key: 'name', by: 'letter' } A, B, C…
//   groupBy: { key: 'date', by: 'day' }    Today, Yesterday, This week, …
//
// Groups keep the order the items arrive in (so the list's sort decides),
// unless `order` says otherwise: 'asc', 'desc', or an array of group keys.

export const DAY_BUCKETS = ['today', 'yesterday', 'week', 'month', 'older', 'future', 'none'];

function startOfDay(date) {
   return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** today | yesterday | week | month | older | future | none */
export function dayBucket(value, now = new Date()) {
   const date = toDate(value);
   if (!date) return 'none';
   const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
   if (days < 0) return 'future';
   if (days === 0) return 'today';
   if (days === 1) return 'yesterday';
   if (days < 7) return 'week';
   if (days < 31) return 'month';
   return 'older';
}

/** The function that gives an item's group key, from the `groupBy` prop. */
export function groupKeyGetter(groupBy) {
   if (!groupBy) return null;
   if (typeof groupBy === 'string' || typeof groupBy === 'function') {
      const get = getter(groupBy);
      return (item) => {
         const value = get(item);
         return value === undefined || value === null || value === '' ? '' : value;
      };
   }
   if (typeof groupBy === 'object') {
      const get = getter(groupBy.key ?? groupBy.value);
      if (!get) return null;
      if (groupBy.by === 'letter') {
         return (item) => {
            const first = Array.from(String(get(item) ?? '').trim())[0] || '';
            const letter = first.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleUpperCase();
            return /\p{L}/u.test(letter) ? letter : '#';
         };
      }
      if (groupBy.by === 'day') return (item) => dayBucket(get(item));
      return (item) => get(item) ?? '';
   }
   return null;
}

/**
 * @param {any[]} items  already filtered and sorted
 * @param {any} groupBy
 * @param {{ order?: 'asc' | 'desc' | any[], label?: (key: any, items: any[]) => string, texts?: Record<string, string> }} [options]
 * @returns {{ key: any, label: string, items: any[] }[] | null}  null when not grouped
 */
export function groupItems(items, groupBy, { order, label, texts = {} } = {}) {
   const keyOf = groupKeyGetter(groupBy);
   if (!keyOf) return null;
   /** @type {Map<any, any[]>} */
   const groups = new Map();
   for (const item of items) {
      const key = keyOf(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
   }
   let keys = [...groups.keys()];
   const byDay = groupBy && typeof groupBy === 'object' && groupBy.by === 'day';
   const by = groupBy && typeof groupBy === 'object' ? groupBy.by : null;
   if (Array.isArray(order)) {
      const rank = (k) => {
         const i = order.indexOf(k);
         return i < 0 ? order.length : i;
      };
      keys.sort((a, b) => rank(a) - rank(b));
   } else if (byDay) {
      keys.sort((a, b) => DAY_BUCKETS.indexOf(a) - DAY_BUCKETS.indexOf(b));
   } else if (order === 'asc' || order === 'desc' || by === 'letter') {
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      keys.sort((a, b) => {
         // '#' (not a letter) and empty go last.
         if (a === '#' || a === '') return 1;
         if (b === '#' || b === '') return -1;
         return collator.compare(String(a), String(b));
      });
      if (order === 'desc') keys.reverse();
   }
   return keys.map((key) => {
      const list = groups.get(key);
      let text;
      if (typeof label === 'function') text = label(key, list);
      else if (byDay) text = texts[`day_${key}`] ?? key;
      else text = key === '' ? (texts.noGroup ?? 'Other') : String(key);
      return { key, label: String(text), items: list };
   });
}
