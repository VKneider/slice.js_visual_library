export default class Grid extends HTMLElement {

   static props = {
      columns: {
         type: 'number',
         default: 1,
         required: false
      },
      rows: {
         type: 'number',
         default: 1,
         required: false
      },
      items: {
         type: 'array',
         default: [],
         required: false
      },
      gap: {
         type: 'string',
         default: '10px',
         required: false
      },
      columnTemplate: {
         type: 'string',
         default: null,
         required: false
      },
      rowTemplate: {
         type: 'string',
         default: null,
         required: false
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$grid = this.querySelector('.grid-container');

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      // Static props ensure columns and rows have default values
      // Apply gap if provided
      if (this.gap) {
         this.$grid.style.gap = this.gap;
      }
   }

   beforeDestroy() {
      // Without this every node handed to the grid — and every Slice component
      // among them — stayed in activeComponents after the grid was gone.
      this._removeChildren();
   }

   set columns(value) {
      this._columns = value;
      // Si hay un template personalizado, usarlo; sino usar repeat
      if (!this.columnTemplate) {
         this.$grid.style.gridTemplateColumns = `repeat(${value}, 1fr)`;
      }
   }

   get columns() {
      return this._columns;
   }

   set rows(value) {
      this._rows = value;
      // Si hay un template personalizado, usarlo; sino usar repeat
      if (!this.rowTemplate) {
         this.$grid.style.gridTemplateRows = `repeat(${value}, 1fr)`;
      }
   }

   get rows() {
      return this._rows;
   }

   set gap(value) {
      this._gap = value;
      if (this.$grid) {
         this.$grid.style.gap = value;
      }
   }

   get gap() {
      return this._gap;
   }

   set columnTemplate(value) {
      this._columnTemplate = value;
      if (value && this.$grid) {
         this.$grid.style.gridTemplateColumns = value;
      }
   }

   get columnTemplate() {
      return this._columnTemplate;
   }

   set rowTemplate(value) {
      this._rowTemplate = value;
      if (value && this.$grid) {
         this.$grid.style.gridTemplateRows = value;
      }
   }

   get rowTemplate() {
      return this._rowTemplate;
   }

   /**
    * Replace the grid's contents with `values`.
    *
    * REPLACES, it does not append. This used to append on every call, so
    * setting `items` twice showed every cell twice.
    *
    * The array holds live DOM nodes, so node identity IS the key: a node still
    * present is moved rather than re-created, which keeps its state (and, for a
    * Slice component, never re-runs its constructor).
    */
   set items(values) {
      this._items = Array.isArray(values) ? values : [];
      this._reconcileNodes(this._items);
   }

   get items() {
      return this._items;
   }

   /** Append a single node, for incremental use. `set items` is for wholesale. */
   async setItem(item) {
      if (!item || !item.classList) {
         console.warn('Grid: Invalid item provided to setItem', item);
         return;
      }
      item.classList.add('grid-item');
      this.$grid.appendChild(item);
      this._items = [...(this._items || []), item];
   }

   /** Convenience for `setItem` over a list. Appends — use `items` to replace. */
   async setItems(items) {
      if (!items || !Array.isArray(items)) {
         console.warn('Grid: Invalid items array provided', items);
         return;
      }
      for (const item of items) {
         await this.setItem(item);
      }
   }

   /** Remove everything, destroying any Slice components among the children. */
   clear() {
      this._removeChildren();
      this._items = [];
   }

   _reconcileNodes(nodes) {
      const wanted = nodes.filter((node) => {
         if (node && node.classList) return true;
         console.warn('Grid: Ignoring invalid item', node);
         return false;
      });
      const keep = new Set(wanted);

      // Remove what is gone BEFORE ordering, so a removed node is never a
      // move target. A Slice child must go through destroyComponent so its
      // beforeDestroy runs; innerHTML = '' would leave it registered forever.
      for (const child of Array.from(this.$grid.children)) {
         if (keep.has(child)) continue;
         const sliceId = child.getAttribute?.('slice-id');
         if (sliceId) slice.controller.destroyComponent(sliceId);
         else child.remove();
      }

      wanted.forEach((node, i) => {
         node.classList.add('grid-item');
         // insertBefore MOVES the node — it never clones, so no constructor
         // re-runs and nothing leaks.
         if (this.$grid.children[i] !== node) {
            this.$grid.insertBefore(node, this.$grid.children[i] || null);
         }
      });
   }

   _removeChildren() {
      if (!this.$grid) return;
      for (const child of Array.from(this.$grid.children)) {
         const sliceId = child.getAttribute?.('slice-id');
         if (sliceId) slice.controller.destroyComponent(sliceId);
         else child.remove();
      }
   }
}

customElements.define('slice-grid', Grid);
