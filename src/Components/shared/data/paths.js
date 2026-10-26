// Reading and writing values inside records, by key, by path or by function.
// Used by DataList, DescriptionList and Table (and grouping in DataList).
//
// Every part of a record can be given three ways:
//   'name'          a key of the record
//   'owner.name'    a path into it
//   (item) => …     a function
// getter() and read() resolve the three, so the components never care which.
// readPath() / writePath() read and write a dotted path in a store's state;
// writePath() copies only the objects along the path, the way a store expects.

/**
 * A getter for a key, a path or a function.
 * @param {string | ((item: any) => any) | null | undefined} spec
 * @returns {((item: any) => any) | null}
 */
export function getter(spec) {
   if (typeof spec === 'function') return spec;
   if (typeof spec !== 'string' || spec === '') return null;
   if (!spec.includes('.')) return (item) => (item == null ? undefined : item[spec]);
   const parts = spec.split('.');
   return (item) => parts.reduce((value, part) => (value == null ? undefined : value[part]), item);
}

/** The value `spec` points at in `item` (undefined when there is no spec). */
export function read(item, spec) {
   const get = getter(spec);
   return get ? get(item) : undefined;
}

/** The value at a dotted path inside a state object ('' is the state itself). */
export function readPath(state, path) {
   if (!path) return state;
   return path.split('.').reduce((value, part) => (value == null ? undefined : value[part]), state);
}

/**
 * A copy of `state` with `value` at the dotted path ('' replaces the state).
 * Only the objects along the path are copied, the way a store expects.
 */
export function writePath(state, path, value) {
   if (!path) return value;
   const [head, ...rest] = path.split('.');
   return { ...(state || {}), [head]: writePath(state?.[head], rest.join('.'), value) };
}
