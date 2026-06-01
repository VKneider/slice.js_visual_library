export default class FloatingDock extends HTMLElement {

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

      this.$dock = this.querySelector('.slice_dock');
      this.$capsule = this.querySelector('.slice_dock_capsule');
      this.$logoContainer = this.querySelector('.slice_dock_logo');
      this.$toggle = this.querySelector('.slice_dock_toggle');
      this.$items = this.querySelector('.slice_dock_items');
      this.$actions = this.querySelector('.slice_dock_actions');

      this._itemEls = [];
      this._centers = [];
      this._tabsByPath = new Map();
      this._activeItem = null;

      // Only fine-pointer devices that hover get the macOS-style magnification;
      // on touch the items stay calm and tappable.
      this._canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

      this.$toggle.addEventListener('click', (event) => {
         event.stopPropagation();
         this._toggleMobile();
      });

      // Mobile: tap outside the dock closes the expanded panel.
      this._onOutsideClick = (event) => {
         if (!this.contains(event.target)) this._closeMobile();
      };

      // Bound handlers for listeners that outlive the subtree (cleaned in beforeDestroy).
      this._onResize = () => this._measure();
      this._onPopState = () => this._syncActiveFromLocation();

      if (this._canHover) {
         this._onPointerMove = (event) => this._magnify(event.clientX);
         this._onPointerLeave = () => this._resetMagnify();
         this.$items.addEventListener('pointermove', this._onPointerMove);
         this.$items.addEventListener('pointerleave', this._onPointerLeave);
      }

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

      document.addEventListener('click', this._onOutsideClick);
      window.addEventListener('resize', this._onResize);
      window.addEventListener('popstate', this._onPopState);

      this._syncActiveFromLocation();
   }

   update() {
      this._syncActiveFromLocation();
   }

   connectedCallback() {
      requestAnimationFrame(() => this._measure());
   }

   beforeDestroy() {
      document.removeEventListener('click', this._onOutsideClick);
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
      this.$dock.dataset.position = value === 'fixed' ? 'fixed' : 'static';
   }

   get direction() {
      return this._direction;
   }

   set direction(value) {
      this._direction = value;
      if (value === 'reverse') {
         this.$capsule.classList.add('slice_dock_reverse');
      } else {
         this.$capsule.classList.remove('slice_dock_reverse');
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

      const item = document.createElement('li');
      item.classList.add('slice_dock_item');

      if (value.type === 'dropdown') {
         item.classList.add('is-dropdown');
         const dropdown = await slice.build('DropDown', {
            label: value.text,
            options: value.options
         });
         item.appendChild(dropdown);
         this.$items.appendChild(item);
         this._itemEls.push(item);
         return;
      }

      if (value.icon) {
         const icon = await slice.build('Icon', {
            name: value.icon,
            size: 'small',
            color: 'currentColor'
         });
         icon.classList.add('slice_dock_icon');
         item.appendChild(icon);
      }

      const label = document.createElement('span');
      label.classList.add('slice_dock_label');
      label.textContent = value.text || '';
      item.appendChild(label);

      if (value.path) {
         item.dataset.path = value.path;
         this._tabsByPath.set(value.path, item);
         item.addEventListener('click', () => {
            this._setActiveItem(item);
            this._closeMobile();
            slice.router.navigate(value.path);
         });
      }

      this.$items.appendChild(item);
      this._itemEls.push(item);
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

   /* ------------------------------------------------------- dock magnify */

   _measure() {
      // Cache each item's horizontal centre (relative to the track) so the
      // pointermove handler stays cheap.
      this._centers = this._itemEls.map((el) => el.offsetLeft + el.offsetWidth / 2);
   }

   _magnify(clientX) {
      if (this.$dock.dataset.state === 'open') return; // skip while mobile panel is open
      const rect = this.$items.getBoundingClientRect();
      const x = clientX - rect.left;
      const radius = 120;

      this._itemEls.forEach((el, i) => {
         const center = this._centers[i] ?? (el.offsetLeft + el.offsetWidth / 2);
         const t = Math.max(0, 1 - Math.abs(x - center) / radius);
         const eased = t * t * (3 - 2 * t); // smoothstep
         el.style.transform = `translateY(${-9 * eased}px) scale(${1 + 0.26 * eased})`;
         el.style.zIndex = eased > 0.4 ? '2' : '1';
      });
   }

   _resetMagnify() {
      this._itemEls.forEach((el) => {
         el.style.transform = '';
         el.style.zIndex = '';
      });
   }

   /* -------------------------------------------------------- mobile panel */

   _toggleMobile() {
      if (this.$dock.dataset.state === 'open') {
         this._closeMobile();
      } else {
         this._openMobile();
      }
   }

   _openMobile() {
      this.$dock.dataset.state = 'open';
      this.$toggle.setAttribute('aria-expanded', 'true');
      this._resetMagnify();
   }

   _closeMobile() {
      this.$dock.dataset.state = 'closed';
      this.$toggle.setAttribute('aria-expanded', 'false');
   }

   /* ------------------------------------------------------- active state */

   _syncActiveFromLocation() {
      const path = window.location.pathname;
      let match = this._tabsByPath.get(path);

      if (!match) {
         let best = -1;
         for (const [itemPath, el] of this._tabsByPath) {
            if (itemPath !== '/' && path.startsWith(itemPath) && itemPath.length > best) {
               best = itemPath.length;
               match = el;
            }
         }
      }

      if (match) {
         this._setActiveItem(match);
      } else {
         this._activeItem?.classList.remove('is-active');
         this._activeItem = null;
      }
   }

   _setActiveItem(item) {
      if (this._activeItem === item) return;
      this._activeItem?.classList.remove('is-active');
      item.classList.add('is-active');
      this._activeItem = item;
   }

   setActivePath(path) {
      const item = this._tabsByPath.get(path);
      if (item) this._setActiveItem(item);
   }
}

window.customElements.define('slice-floating-dock', FloatingDock);
