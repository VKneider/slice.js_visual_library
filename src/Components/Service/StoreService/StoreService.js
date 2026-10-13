// A thin facade over `slice.context`, so context persistence is configured in
// ONE place instead of being re-declared by every service that owns state.
//
// Built first in an app's composition root, then recovered with
// `slice.getComponent('StoreService')`.
//
// `ensure` is create-if-absent and idempotent. It is deliberately NOT a
// migration helper: adding a key to a context's initialState later does NOT
// backfill it for a returning user, so shape migrations belong in the service
// that owns that state, in its own init().
export default class StoreService {

   /** Create the context only if it does not exist yet. */
   ensure(name, initialState, storageKey) {
      if (!slice.context.has(name)) {
         slice.context.create(name, initialState, { persist: true, storageKey });
      }
   }

   has(name) {
      return slice.context.has(name);
   }

   get(name) {
      return slice.context.getState(name);
   }

   /**
    * @param {string} name
    * @param {(prev) => any} updater  same contract as slice.context.setState
    */
   set(name, updater) {
      slice.context.setState(name, updater);
   }

   /**
    * Subscribe a component to a slice of state.
    *
    * Watchers registered with `component` are cleaned up automatically when it
    * is destroyed — do not unwatch by hand. `selector` narrows the callback to a
    * slice of state, so the watcher only fires when the relevant part changes.
    */
   watch(name, component, callback, selector) {
      slice.context.watch(name, component, callback, selector);
   }
}