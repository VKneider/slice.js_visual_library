/**
 * Map a consumer's tree item onto TreeItem's props.
 *
 * `children` and `text` are accepted as aliases for `items` and `value`.
 * Not as a nicety: `children` is a getter-only property on `HTMLElement`, so
 * spreading an item that carries one made `setComponentProps` throw
 * `Cannot set property children`, the instance was never created, and a whole
 * branch of the tree vanished with nothing on screen but one console ERROR.
 *
 * Only the keys TreeItem declares are forwarded, so no future data shape can
 * clobber a native DOM property the same way.
 */
function treeItemProps(item, onClick) {
   const children = item.items ?? item.children;
   const props = {
      value: item.value ?? item.text ?? item.label ?? '',
      path: item.path ?? '',
   };

   if (Array.isArray(children) && children.length > 0) props.items = children;
   if (typeof onClick === 'function') props.onClick = onClick;
   else if (typeof item.onClick === 'function') props.onClick = item.onClick;

   return props;
}

const _sliceDeprecated = new Set();
function deprecate(oldName, newName) {
   if (_sliceDeprecated.has(oldName)) return;
   _sliceDeprecated.add(oldName);
   console.warn(`[Slice] "${oldName}" is deprecated; use "${newName}" instead.`);
}

export default class TreeView extends HTMLElement {

   static props = {
      items: {
         type: 'array',
         default: [],
         required: false
      },
      activePath: {
         type: 'string',
         default: '',
         required: false
      },
      /**
       * How much of the tree starts open.
       *
       * `'none'` (the default) leaves every branch to localStorage and to
       * activePath — right for a nav sidebar, which should show the current
       * page rather than the whole site.
       *
       * `'all'` opens every branch, for a tree you want to READ. Without it a
       * docs page handed a nested schema shows three flat rows with a caret
       * each and no visible hierarchy.
       */
      expanded: {
         type: 'string',
         default: 'none',
         required: false
      },
      // Canonical handler. `onClickCallback` is kept as a deprecated alias.
      onClick: {
         type: 'function',
         default: null
      },
      onClickCallback: {
         type: 'function',
         default: null
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$treeView = this.querySelector('.simple_treeview');
      this._previousActive = null;
      this._routeListenerRegistered = false;
      this._routeHandler = null;
      this._inited = false;
      // A stable id per item OBJECT, for items that carry no path/id of their
      // own. Keying on the array index instead would hand item 0's component —
      // and its open/closed state — to whoever took its place after a splice.
      this._anonymousIds = new WeakMap();
      this._anonymousSeq = 0;
      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this._inited = true;
      await this._renderItems();
      if (this._activePath) {
         this.activateByPath(this._activePath);
      }
      this._registerRouteListener();
   }

   beforeDestroy() {
      // Nothing tore these down before, so every TreeItem built from a previous
      // `items` stayed in activeComponents after the tree was gone.
      for (const child of Array.from(this.$treeView?.children || [])) {
         slice.controller.destroyComponent(child);
      }
      if (this._routeListenerRegistered && this._routeHandler) {
         slice.router?.removeAfterEach?.(this._routeHandler);
         this._routeListenerRegistered = false;
         this._routeHandler = null;
      }
   }

   /** Re-renders the tree. The setter used to only store the value. */
   set items(values) {
      this._items = values;
      this._renderItems();
   }

   get items() {
      return this._items;
   }

   set activePath(value) {
      this._activePath = value;
   }

   get activePath() {
      return this._activePath;
   }

   get onClick() {
      return this._onClick;
   }

   set onClick(value) {
      if (typeof value === 'function') this._onClick = value;
   }

   // Deprecated alias for onClick.
   set onClickCallback(value) {
      if (typeof value === 'function') {
         this._onClick ??= value;
         deprecate('onClickCallback', 'onClick');
      }
   }

   get expanded() {
      return this._expanded;
   }

   set expanded(value) {
      this._expanded = value;
      if (this._inited) this.openAllBranches();
   }

   /** Opens every branch in the tree, at any depth. */
   openAllBranches() {
      for (const branch of this.$treeView.querySelectorAll('slice-treeitem.is-branch')) {
         branch.setExpanded?.(true);
      }
   }

   setActiveTreeItem(treeItem) {
      if (this._previousActive && this._previousActive !== treeItem) {
         this._previousActive.setActive(false);
      }
      treeItem.setActive(true);
      this._previousActive = treeItem;
   }

   openBranch(branch) {
      const caret = branch.$item?.querySelector('.caret');
      const container = branch.$container;
      if (!caret || !container) return;
      caret.classList.add('caret_open');
      container.classList.add('container_open');
      // Keep opened branches fluid. Fixed pixel heights here can clip nested
      // items when descendants expand later (e.g. route-driven auto-open).
      container.style.height = 'auto';
      localStorage.setItem(branch.getContainerKey(), 'open');
   }

   openAncestors(treeItem) {
      const parentBranch = treeItem.parentElement?.closest('slice-treeitem');
      if (!parentBranch) return;
      this.openAncestors(parentBranch);
      this.openBranch(parentBranch);
   }

   activateByPath(path) {
      const find = (parent) => {
         const container = parent.tagName === 'SLICE-TREEVIEW'
            ? parent.querySelector('.simple_treeview')
            : parent.$container;
         if (!container) return false;
         for (const child of container.children) {
            if (child.tagName !== 'SLICE-TREEITEM') continue;
            if (child.path === path) {
               this.setActiveTreeItem(child);
               this.openAncestors(child);
               return true;
            }
            if (find(child)) return true;
         }
         return false;
      };
      find(this);
   }

   async setTreeItem(item) {
      if (this._onClick) {
         item.onClick = this._onClick;
      }
      const treeItem = await slice.build('TreeItem', item);
      treeItem.classList.add('tree_item');
      this.$treeView.appendChild(treeItem);
   }

   async setTreeItems(items) {
      this._items = items;
      await this._renderItems();
   }

   _keyOf(item) {
      if (item.path) return `treeitem-${item.path}`;
      if (item.id) return `treeitem-${item.id}`;
      if (!this._anonymousIds.has(item)) {
         this._anonymousSeq += 1;
         this._anonymousIds.set(item, `anon-${this._anonymousSeq}`);
      }
      return `treeitem-${this._anonymousIds.get(item)}`;
   }

   async _renderItems() {
      // The setters run from the constructor, before init(); there is nothing to
      // render against yet, and init() renders.
      if (!this._inited || !this.$treeView) return;

      // Literal slice.build so the CLI dependency analyser can see it.
      const dom = await slice.build('DomService', { singleton: true });

      // reconcile, not a loop of appendChild: that way a TreeItem whose data
      // survived keeps its node (and its open/closed state), one whose data is
      // gone is destroyed, and re-ordering moves rather than re-creates.
      await dom.reconcile(this.$treeView, this._items || [], {
         keyOf: (item) => this._keyOf(item),
         component: 'TreeItem',
         // Normalised rather than spread: see treeItemProps above.
         props: (item) => treeItemProps(item, this._onClick),
      });

      // reconcile() can adopt a node that predates this render, so the marker
      // class is re-asserted rather than assumed.
      for (const child of this.$treeView.children) {
         if (child.tagName === 'SLICE-TREEITEM') child.classList.add('tree_item');
      }

      // A re-render drops the DOM, so the active highlight has to be re-applied.
      if (this._activePath) this.activateByPath(this._activePath);

      // Last, so it overrides whatever activePath or localStorage decided.
      if (this._expanded === 'all') this.openAllBranches();
   }

   _registerRouteListener() {
      if (this._routeListenerRegistered) return;
      if (typeof slice.router?.afterEach !== 'function') return;

      this._routeListenerRegistered = true;
      this._routeHandler = (to) => this.activateByPath(to.path);
      slice.router.afterEach(this._routeHandler);
   }
}

customElements.define('slice-treeview', TreeView);
