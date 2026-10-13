// Reconciles a container's children against a data array, so a variable-length
// list of child components stays in sync without hand-rolled diffing.
//
// Why this exists: the two obvious alternatives are both broken. `innerHTML = ''`
// wipes nodes without running beforeDestroy, leaking every child's listeners
// and registry entry; and re-creating a node runs its constructor again and does
// the same. So the order here is deliberate:
//
//   1. every live item -> find its node by stable sliceId and refresh it IN PLACE
//   2. every child whose data is gone -> destroyComponent (runs beforeDestroy)
//   3. move only the nodes that are out of place, so the DOM sequence ends up
//      matching `items` without any node being re-created
//
// Usage:
//   await dom.reconcile(listEl, rows, {
//     keyOf:    (row) => `row-${row.id}`,
//     component: 'Row',
//     props:    (row) => ({ label: row.name, onClick: () => open(row) }),
//   });
export default class DomService {

   constructor() {
      // One promise per container. Two reconcile() calls arriving close enough
      // together would otherwise interleave their awaits: the second could prune
      // a node the first had just ordered, or both could decide to build the
      // same id. Keyed on the element, so nothing survives the container.
      this._queues = new WeakMap();
   }

   /**
    * @param {HTMLElement} container  parent that holds the child components
    * @param {Array} items             the data, in display order
    * @param {object} options
    * @param {(item) => string} options.keyOf       stable id per item — the identity used across renders
    * @param {string} options.component             component name to build for new items
    * @param {(item) => object} [options.props]     props for an item
    * @param {(node, props) => any} [options.refresh]  override the in-place update
    *        (use this for interdependent props or when the child builds async children)
    *
    * @returns {Promise<void>} resolves when THIS render is applied, after any
    *          render already queued on the same container.
    */
   reconcile(container, items, options = {}) {
      if (!container) throw new Error('[DomService] reconcile() needs a container');

      const run = () => this._reconcile(container, items, options);
      // `then(run, run)`, not `then(run)`: a previous failure must not poison
      // the queue, or one bad render freezes every later one on that container.
      const previous = this._queues.get(container) || Promise.resolve();
      const current = previous.then(run, run);
      this._queues.set(container, current);

      return current.finally(() => {
         // Drop the chain once this is the last render queued on the container,
         // so a long-lived list does not accumulate one promise per update.
         if (this._queues.get(container) === current) this._queues.delete(container);
      });
   }

   async _reconcile(container, items, { keyOf, component, props, refresh } = {}) {
      // slice.setComponentProps covers the common case. A `refresh` override
      // exists because some children need their own update() (e.g. one that
      // builds a sub-component, where the order of prop application matters).
      const applyRefresh = refresh || ((node, p) => slice.setComponentProps(node, p));
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
         const p = props ? props(item) : {};

         const registered = slice.getComponent(sliceId);
         if (registered) {
            await applyRefresh(registered, p);
            slots[i] = registered;
            continue;
         }

         // Adopt a node the container already holds before paying for a build.
         // The registry can lose track of a node (a build that failed, a child
         // the consumer pre-rendered) while the DOM still has it — and building
         // it again would throw "already registered".
         const adopted = container.querySelector(`[slice-id="${CSS.escape(sliceId)}"]`);
         if (adopted) {
            slots[i] = adopted;
            continue;
         }

         toBuild.push({ index: i, sliceId, props: p });
      }

      // The first build is awaited on its own because it warms the template
      // cache; the rest then go in parallel, so a cold first paint costs ONE
      // fetch per component type instead of one per row.
      const [first, ...rest] = toBuild;
      if (first) {
         slots[first.index] = await slice.build(component, { sliceId: first.sliceId, ...first.props });
         const built = await Promise.all(
            rest.map((entry) => slice.build(component, { sliceId: entry.sliceId, ...entry.props }))
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

      // Move only what is out of place: insertBefore MOVES, it does not clone,
      // so no constructor re-runs and nothing leaks.
      ordered.forEach((node, i) => {
         if (container.children[i] !== node) {
            container.insertBefore(node, container.children[i] || null);
         }
      });
   }

   /** Detach and destroy every child component inside `container`. */
   destroyChildren(container) {
      if (!container) return;
      for (const child of Array.from(container.children)) {
         const id = child.getAttribute('slice-id');
         if (id) slice.controller.destroyComponent(id);
         else child.remove();
      }
   }
}
