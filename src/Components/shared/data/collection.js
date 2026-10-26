// Creating, changing and removing items in an array, without touching the
// array you passed: every function returns a new one, the way a React or Vue
// store expects. DataList (addItem, updateItem, removeItem) and Table (addRow,
// updateRow, removeRow) use them, and keep what they return to undo a change
// the server says no to.

/**
 * @param {any[]} list
 * @param {any} item
 * @param {'start' | 'end' | number} [position]
 */
export function insertItem(list, item, position = 'start') {
   const next = list.slice();
   if (position === 'end') next.push(item);
   else if (typeof position === 'number') next.splice(Math.max(0, Math.min(position, next.length)), 0, item);
   else next.unshift(item);
   return next;
}

/**
 * Replace one item with a changed copy.
 * @param {any[]} list
 * @param {(item: any) => any} keyOf
 * @param {any} key
 * @param {object | ((item: any) => object)} patch  fields to change, or a
 *   function from the item to them
 * @returns {{ list: any[], before: any, after: any } | null}  null when no item has `key`
 */
export function patchItem(list, keyOf, key, patch) {
   const index = list.findIndex((item) => keyOf(item) === key);
   if (index < 0) return null;
   const before = list[index];
   const changes = typeof patch === 'function' ? patch(before) : patch;
   const after = { ...before, ...(changes || {}) };
   const next = list.slice();
   next[index] = after;
   return { list: next, before, after };
}

/**
 * Remove the items with these keys.
 * @returns {{ list: any[], removed: { item: any, index: number }[] }}
 */
export function removeItems(list, keyOf, keys) {
   const wanted = new Set(keys);
   const removed = [];
   const next = [];
   list.forEach((item, index) => {
      if (wanted.has(keyOf(item))) removed.push({ item, index });
      else next.push(item);
   });
   return { list: next, removed };
}

/** Put removed items back where they were (for undo, or a failed save). */
export function restoreItems(list, removed) {
   const next = list.slice();
   for (const { item, index } of [...removed].sort((a, b) => a.index - b.index)) {
      next.splice(Math.min(index, next.length), 0, item);
   }
   return next;
}

/** Put back an item as it was before a patch. */
export function revertItem(list, keyOf, before) {
   const key = keyOf(before);
   const index = list.findIndex((item) => keyOf(item) === key);
   if (index < 0) return list;
   const next = list.slice();
   next[index] = before;
   return next;
}
