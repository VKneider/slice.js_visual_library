// Reconciles a container's children against a data array, so a variable-length
// list of child components stays in sync without hand-rolled diffing.
//
// Why this exists: the two obvious alternatives are both broken. `innerHTML = ''`
// wipes nodes without running beforeDestroy, leaking every child's listeners
// and registry entry; and re-creating a node runs its constructor again and does
// the same. So the order here is deliberate:
//
//   1. every live item -> find its node by stable sliceId and refresh it IN PLACE
//      (skipped when `equals` says the item did not change)
//   2. every child whose data is gone -> destroyComponent (runs beforeDestroy)
//   3. move only the nodes that are out of place — the fewest moves possible —
//      so the DOM sequence ends up matching `items` without re-creating anything
//
// Usage:
//   await dom.reconcile(listEl, rows, {
//     keyOf:    (row) => `row-${row.id}`,
//     component: 'Row',
//     props:    (row) => ({ label: row.name, onClick: () => open(row) }),
//     equals:   Object.is,   // optional: skip rows whose data object is unchanged
//   });
/**
 * @typedef {object} ReconcileOptions
 * @property {(item: any) => string} keyOf      stable id per item — the identity used across renders
 * @property {string} component                 component name to build for new items
 * @property {(item: any) => object} [props]    props for an item
 * @property {(node: any, props: object) => any} [refresh]  override the in-place update
 *           (use this for interdependent props or when the child builds async children)
 * @property {(previous: any, next: any) => boolean} [equals]  when it returns true for an
 *           item's previous and current data, that node is NOT refreshed. Omit it to
 *           refresh every surviving node on every render.
 */

export default class DomService {

   constructor() {
      // One queue per container. Two reconcile() calls arriving close enough
      // together would otherwise interleave their awaits: the second could prune
      // a node the first had just ordered, or both could decide to build the
      // same id. Keyed on the element, so nothing survives the container.
      this._queues = new WeakMap();
      // Per container: Map<sliceId, item> of the data each node was last
      // refreshed with — what `equals` compares against.
      this._lastItems = new WeakMap();
   }

   /**
    * @param {HTMLElement} container  parent that holds the child components
    * @param {Array} items             the data, in display order
    * @param {ReconcileOptions} options
    *
    * @returns {Promise<void>} resolves once the DOM reflects THIS call's items or
    *          a newer call's. Renders queue per container, and a render that is
    *          still waiting when a newer one arrives is skipped — only the latest
    *          state is applied.
    */
   reconcile(container, items, options = /** @type {ReconcileOptions} */ ({})) {
      if (!container) throw new Error('[DomService] reconcile() needs a container');

      let state = this._queues.get(container);
      if (!state) {
         state = { running: false, pending: null };
         this._queues.set(container, state);
      }

      return new Promise((resolve, reject) => {
         // Coalesce: a render that has not started yet is replaced by the newer
         // one, and its caller is settled together with it. Typing into a filter
         // that re-renders a list applies the last keystroke, not every one.
         if (state.pending) {
            state.pending.items = items;
            state.pending.options = options;
            state.pending.waiters.push({ resolve, reject });
         } else {
            state.pending = { items, options, waiters: [{ resolve, reject }] };
         }
         if (!state.running) this._drain(container, state);
      });
   }

   async _drain(container, state) {
      state.running = true;
      try {
         while (state.pending) {
            const job = state.pending;
            state.pending = null;
            try {
               await this._reconcile(container, job.items, job.options);
               job.waiters.forEach((w) => w.resolve());
            } catch (error) {
               // Settle and keep draining: one bad render must not freeze every
               // later render on that container.
               job.waiters.forEach((w) => w.reject(error));
            }
         }
      } finally {
         state.running = false;
         // Drop the queue once it drains, so a long-lived container does not
         // keep state between bursts.
         if (!state.pending && this._queues.get(container) === state) this._queues.delete(container);
      }
   }

   /**
    * @param {HTMLElement} container
    * @param {Array} items
    * @param {ReconcileOptions} options
    */
   async _reconcile(container, items, options) {
      const { keyOf, component, props, refresh, equals } = options || /** @type {ReconcileOptions} */ ({});
      // slice.setComponentProps covers the common case. A `refresh` override
      // exists because some children need their own update() (e.g. one that
      // builds a sub-component, where the order of prop application matters).
      const applyRefresh = refresh || ((node, p) => slice.setComponentProps(node, p));
      const skipUnchanged = typeof equals === 'function';
      const previousItems = this._lastItems.get(container) || new Map();
      const nextItems = new Map();
      const list = items || [];
      const alive = new Set();
      // Indexed by position in `list`, so the display order comes from the data
      // regardless of the order the nodes happened to be produced in.
      const slots = new Array(list.length);
      const toBuild = [];

      for (let i = 0; i < list.length; i++) {
         const item = list[i];
         const sliceId = keyOf(item);
         alive.add(sliceId);
         nextItems.set(sliceId, item);

         const registered = slice.getComponent(sliceId);
         if (registered) {
            const unchanged = skipUnchanged
               && previousItems.has(sliceId)
               && registered.parentElement === container
               && equals(previousItems.get(sliceId), item);
            if (!unchanged) await applyRefresh(registered, props ? props(item) : {});
            slots[i] = registered;
            continue;
         }

         // Adopt a node the container already holds before paying for a build.
         // The registry can lose track of a node (a build that failed, a child
         // the consumer pre-rendered) while the DOM still has it — and building
         // it again would throw "already registered". Direct children only: a
         // nested list's node with the same key must never be pulled up a level.
         const adopted = this._childBySliceId(container, sliceId);
         if (adopted) {
            slots[i] = adopted;
            continue;
         }

         toBuild.push({ index: i, sliceId, props: props ? props(item) : {} });
      }

      // The first build is awaited on its own because it warms the template
      // cache; the rest then go in parallel, so a cold first paint costs ONE
      // fetch per component type instead of one per row.
      const [first, ...rest] = toBuild;
      // `component` is any registered name, chosen by the caller at runtime; the
      // generated name union is not available in every project this ships to.
      const name = /** @type {any} */ (component);
      if (first) {
         slots[first.index] = await slice.build(name, { sliceId: first.sliceId, ...first.props });
         const built = await Promise.all(
            rest.map((entry) => slice.build(name, { sliceId: entry.sliceId, ...entry.props }))
         );
         rest.forEach((entry, n) => { slots[entry.index] = built[n]; });
      }

      // Prune BEFORE reordering, so a destroyed node is never a reorder target.
      for (const child of Array.from(container.children)) {
         const id = child.getAttribute('slice-id');
         if (id && !alive.has(id)) {
            slice.controller.destroyComponent(id);
         }
      }

      // A build can legitimately return nothing (unknown component), so the
      // ordered list is built from what actually exists.
      const ordered = slots.filter(Boolean);
      this._order(container, ordered);

      // Only remember data once the render has fully applied.
      this._lastItems.set(container, nextItems);
   }

   _childBySliceId(container, sliceId) {
      for (const child of container.children) {
         if (child.getAttribute('slice-id') === sliceId) return child;
      }
      return null;
   }

   /**
    * Put `ordered` into `container` in that sequence with the fewest moves.
    * Nodes that are already in a correct relative order (the longest increasing
    * run of their current positions) stay put; only the others move. Each move
    * is an insertBefore, which MOVES — no constructor re-runs — but a moved
    * node still loses focus and restarts its CSS animations, so fewer is better.
    */
   _order(container, ordered) {
      if (ordered.length === 0) return;

      const position = new Map();
      Array.from(container.children).forEach((child, i) => position.set(child, i));
      const current = ordered.map((node) => (position.has(node) ? position.get(node) : -1));
      const stable = this._longestIncreasing(current);

      // Walk backwards so every insert has its final right-hand neighbour. A node
      // that is new to the container (-1) is never "stable", so it is inserted.
      // Children the service does not manage (no slice-id in `items`) are not
      // touched: they keep their place among the stable nodes.
      let anchor = null;
      for (let i = ordered.length - 1; i >= 0; i--) {
         const node = ordered[i];
         if (!stable.has(i)) container.insertBefore(node, anchor);
         anchor = node;
      }
   }

   /**
    * Indexes (into `seq`) of one longest strictly increasing subsequence,
    * ignoring -1 (nodes not yet in the container). O(n log n).
    */
   _longestIncreasing(seq) {
      const tails = [];      // tails[k] = index in seq of the smallest tail of a run of length k+1
      const prev = new Array(seq.length).fill(-1);
      for (let i = 0; i < seq.length; i++) {
         const v = seq[i];
         if (v < 0) continue;
         let lo = 0;
         let hi = tails.length;
         while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (seq[tails[mid]] < v) lo = mid + 1; else hi = mid;
         }
         if (lo > 0) prev[i] = tails[lo - 1];
         tails[lo] = i;
      }
      const result = new Set();
      let k = tails.length ? tails[tails.length - 1] : -1;
      while (k !== -1) {
         result.add(k);
         k = prev[k];
      }
      return result;
   }

   /** Detach and destroy every child component inside `container`. */
   destroyChildren(container) {
      if (!container) return;
      for (const child of Array.from(container.children)) {
         const id = child.getAttribute('slice-id');
         if (id) slice.controller.destroyComponent(id);
         else child.remove();
      }
      this._lastItems.delete(container);
   }
}