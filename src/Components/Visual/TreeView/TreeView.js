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
      slice.controller.setComponentProps(this, props);
   }

   async init() {
      if (this.items) {
         await this.setTreeItems(this.items);
      }
      if (this._activePath) {
         this.activateByPath(this._activePath);
      }
      if (!this._routeListenerRegistered && typeof slice.router?.afterEach === 'function') {
        this._routeListenerRegistered = true;
        slice.router.afterEach((to) => {
          this.activateByPath(to.path);
        });
      }
   }

   set items(values) {
      this._items = values;
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
      for (let i = 0; i < items.length; i++) {
         await this.setTreeItem(items[i]);
      }
   }
}

customElements.define('slice-treeview', TreeView);
