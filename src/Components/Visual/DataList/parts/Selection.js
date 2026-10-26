// Part of DataList: used only by DataList.js (see shared/README.md).
//
// Which items are selected, by key.
//
// Keys, not objects: the selection survives new data (a refresh, an edit, a
// page from the server), as long as an item keeps its key.

export default class Selection {
   /** @param {'none' | 'single' | 'multiple'} mode */
   constructor(mode = 'none') {
      this.mode = mode;
      /** @type {Set<any>} */
      this.keys = new Set();
      // Where a Shift+click range starts.
      this.anchor = null;
   }

   get size() { return this.keys.size; }

   has(key) { return this.keys.has(key); }

   /** Replace the selection (respects the mode). */
   set(keys) {
      const list = Array.isArray(keys) ? keys : keys == null ? [] : [keys];
      this.keys = new Set(this.mode === 'single' ? list.slice(0, 1) : this.mode === 'multiple' ? list : []);
      this.anchor = list[list.length - 1] ?? null;
   }

   clear() {
      this.keys.clear();
      this.anchor = null;
   }

   /** Select or unselect one key. Single mode keeps only the new one. */
   toggle(key, on = !this.keys.has(key)) {
      if (this.mode === 'none') return;
      if (this.mode === 'single') {
         this.keys = new Set(on ? [key] : []);
      } else if (on) {
         this.keys.add(key);
      } else {
         this.keys.delete(key);
      }
      this.anchor = key;
   }

   /**
    * Shift+click: everything between the anchor and `key`, in the order the
    * items are on screen, takes the state of `key`'s new value.
    */
   range(key, orderedKeys) {
      if (this.mode !== 'multiple' || this.anchor === null) {
         this.toggle(key);
         return;
      }
      const from = orderedKeys.indexOf(this.anchor);
      const to = orderedKeys.indexOf(key);
      if (from < 0 || to < 0) {
         this.toggle(key);
         return;
      }
      const on = !this.keys.has(key);
      const [start, end] = from < to ? [from, to] : [to, from];
      for (const k of orderedKeys.slice(start, end + 1)) {
         if (on) this.keys.add(k);
         else this.keys.delete(k);
      }
      this.anchor = key;
   }

   /** Select all of `keys` (or unselect them all when they all are). */
   toggleAll(keys) {
      if (this.mode !== 'multiple') return;
      const all = keys.length > 0 && keys.every((k) => this.keys.has(k));
      for (const k of keys) {
         if (all) this.keys.delete(k);
         else this.keys.add(k);
      }
   }

   /** 'all', 'some' or 'none' of `keys` are selected. */
   coverage(keys) {
      if (!keys.length) return 'none';
      let count = 0;
      for (const k of keys) if (this.keys.has(k)) count += 1;
      return count === 0 ? 'none' : count === keys.length ? 'all' : 'some';
   }

   /** Forget keys that are no longer in the data. */
   prune(validKeys) {
      const valid = validKeys instanceof Set ? validKeys : new Set(validKeys);
      let changed = false;
      for (const k of [...this.keys]) {
         if (!valid.has(k)) {
            this.keys.delete(k);
            changed = true;
         }
      }
      return changed;
   }

   toArray() { return [...this.keys]; }
}
