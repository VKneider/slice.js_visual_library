export default class BottomNav extends HTMLElement {

   static props = {
      logo: {
         type: 'object',
         default: null,
         required: false
      },
      items: {
         type: 'array',
         default: [],
         required: false
      },
      buttons: {
         type: 'array',
         default: [],
         required: false
      },
      position: {
         type: 'string',
         default: 'fixed',
         required: false
      },
      direction: {
         type: 'string',
         default: 'normal',
         required: false
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$root = this.querySelector('.slice_bottomnav');
      this.$bar = this.querySelector('.slice_bottomnav_bar');
      this.$logoContainer = this.querySelector('.slice_bottomnav_logo');
      this.$tabs = this.querySelector('.slice_bottomnav_tabs');
      this.$indicator = this.querySelector('.slice_bottomnav_indicator');
      this.$actions = this.querySelector('.slice_bottomnav_actions');

      // Keep a path -> tab map so the sliding indicator can follow route changes.
      this._tabsByPath = new Map();
      this._activeTab = null;

      // These listeners outlive the rendered subtree, so they are cleaned up
      // explicitly in beforeDestroy() (Slice does not auto-clean raw window/DOM
      // listeners attached outside of slice.events / slice.context).
      this._onResize = () => this._refreshIndicator();
      this._onPopState = () => this._syncActiveFromLocation();
      window.addEventListener('resize', this._onResize);
      window.addEventListener('popstate', this._onPopState);

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      if (this.items && this.items.length > 0) {
         await this.addItems(this.items);
      }

      if (this.buttons && this.buttons.length > 0) {
         for (const button of this.buttons) {
            await this.addButton(button, this.$actions);
         }
      }

      this._syncActiveFromLocation();
   }

   // A cached MultiRoute can revisit the view holding this component; re-sync the
   // active tab and re-measure the indicator when that happens.
   update() {
      this._syncActiveFromLocation();
   }

   // Once the bar is in the document its tabs finally have a measurable layout,
   // so this is the right moment to place the sliding indicator.
   connectedCallback() {
      requestAnimationFrame(() => this._refreshIndicator());
   }

   beforeDestroy() {
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('popstate', this._onPopState);
   }

   /* ---------------------------------------------------------------- props */

   get logo() {
      return this._logo;
   }

   set logo(value) {
      this._logo = value;
      if (!value) return;

      const img = document.createElement('img');
      img.src = value.src;
      img.alt = value.alt || '';
      this.$logoContainer.appendChild(img);
      this.$logoContainer.href = value.path || '#';
      this.$logoContainer.classList.add('is-visible');
   }

   get items() {
      return this._items;
   }

   set items(values) {
      this._items = values;
   }

   get buttons() {
      return this._buttons;
   }

   set buttons(values) {
      this._buttons = values;
   }

   get position() {
      return this._position;
   }

   set position(value) {
      this._position = value;
      // The CSS targets `.slice_bottomnav[data-position]` (the inner root), not
      // the host — otherwise the inner element keeps its HTML default `fixed`.
      this.$root.dataset.position = value === 'fixed' ? 'fixed' : 'static';
   }

   get direction() {
      return this._direction;
   }

   set direction(value) {
      this._direction = value;
      if (value === 'reverse') {
         this.$bar.classList.add('slice_bottomnav_reverse');
      } else {
         this.$bar.classList.remove('slice_bottomnav_reverse');
      }
   }

   /* ----------------------------------------------------------- rendering */

   async addItems(items) {
      for (let i = 0; i < items.length; i++) {
         await this.addItem(items[i]);
      }
   }

   async addItem(value) {
      if (!value.type) {
         value.type = 'text';
      }

      const tab = document.createElement('li');
      tab.classList.add('slice_bottomnav_tab');

      // Dropdown items keep parity with Navbar: they open the shared DropDown.
      if (value.type === 'dropdown') {
         tab.classList.add('is-dropdown');
         const dropdown = await slice.build('DropDown', {
            label: value.text,
            options: value.options
         });
         dropdown.classList.add('slice_bottomnav_dropdown');
         tab.appendChild(dropdown);
         this.$tabs.appendChild(tab);
         return;
      }

      // Optional per-item icon (any valid slice Icon name). Falls back to a
      // label-only tab so plain Navbar-style items keep working unchanged.
      if (value.icon) {
         const icon = await slice.build('Icon', {
            name: value.icon,
            size: 'small',
            color: 'currentColor'
         });
         icon.classList.add('slice_bottomnav_icon');
         tab.appendChild(icon);
      }

      const label = document.createElement('span');
      label.classList.add('slice_bottomnav_label');
      label.textContent = value.text || '';
      tab.appendChild(label);

      if (value.path) {
         tab.dataset.path = value.path;
         this._tabsByPath.set(value.path, tab);
         tab.addEventListener('click', () => {
            this._setActiveTab(tab);
            slice.router.navigate(value.path);
         });
      }

      this.$tabs.appendChild(tab);
   }

   async addButton(value, addTo) {
      if (!value.color) {
         value.color = {
            text: 'var(--primary-color-rgb)',
            background: 'var(--primary-background-color)'
         };
      }

      const button = await slice.build('Button', {
         value: value.value,
         customColor: value.color,
         icon: value.icon,
         onClick: value.onClick ?? value.onClickCallback
      });

      addTo.appendChild(button);
   }

   /* ------------------------------------------------------- active state */

   _syncActiveFromLocation() {
      const path = window.location.pathname;

      // Exact match first, then the longest path prefix (handles nested routes
      // such as /docs/button still highlighting the /docs tab).
      let match = this._tabsByPath.get(path);
      if (!match) {
         let bestLength = -1;
         for (const [tabPath, tab] of this._tabsByPath) {
            if (tabPath !== '/' && path.startsWith(tabPath) && tabPath.length > bestLength) {
               bestLength = tabPath.length;
               match = tab;
            }
         }
      }

      if (match) {
         this._setActiveTab(match);
      } else {
         this._activeTab?.classList.remove('is-active');
         this._activeTab = null;
         this._hideIndicator();
      }
   }

   _setActiveTab(tab) {
      if (this._activeTab === tab) {
         this._refreshIndicator();
         return;
      }

      this._activeTab?.classList.remove('is-active');
      tab.classList.add('is-active');
      this._activeTab = tab;
      this._refreshIndicator();
   }

   _refreshIndicator() {
      if (!this.$indicator || !this._activeTab) return;

      const width = this._activeTab.offsetWidth;
      const left = this._activeTab.offsetLeft;
      if (width === 0) return; // not laid out yet; connectedCallback/resize will retry

      this.$indicator.style.width = `${width}px`;
      this.$indicator.style.transform = `translateX(${left}px)`;
      this.$indicator.classList.add('is-visible');
   }

   _hideIndicator() {
      if (this.$indicator) {
         this.$indicator.classList.remove('is-visible');
      }
   }

   /* --------------------------------------------------------- public API */

   // Lets a consumer drive the active tab imperatively if they navigate by
   // means other than these tabs.
   setActivePath(path) {
      const tab = this._tabsByPath.get(path);
      if (tab) this._setActiveTab(tab);
   }
}

window.customElements.define('slice-bottom-nav', BottomNav);
