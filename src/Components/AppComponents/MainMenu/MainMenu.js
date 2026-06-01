export default class MainMenu extends HTMLElement {
   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$menuButton = this.querySelector('.slice_menu_button');
      this.$closeButton = this.querySelector('.slice_close_menu');
      this.$menu = this.querySelector('.slice_menu');
      this.$treeHost = this.querySelector('.slice_menu_tree_host');
      this.$searchInput = this.querySelector('.slice_menu_search_input');
      this.$overlay = this.querySelector('.slice_menu_overlay');

      this.$menuButton.addEventListener('click', () => {
         this.handleOpenMenu();
      });
      this.$closeButton.addEventListener('click', () => {
         this.handleCloseMenu();
      });
      this.$overlay.addEventListener('click', () => {
         this.handleCloseMenu();
      });

      if (this.$searchInput) {
         this.$searchInput.addEventListener('input', () => {
            this.dispatchEvent(new CustomEvent('docs-menu-search', {
               bubbles: true,
               detail: {
                  query: this.$searchInput.value || ''
               }
            }));
         });
      }

      slice.controller.setComponentProps(this, props);
      this.debuggerProps = [];
   }

   init() {
      // Auto-close on hover-out is desktop-only behaviour. On touch devices the
      // browser emits a synthetic `mouseleave` right after every tap, which would
      // close the drawer the instant the user touches a TreeView caret/item and
      // makes the tree impossible to interact with on mobile. Only wire it up on
      // devices that actually hover with a fine pointer; on touch we rely on the
      // overlay tap and the close button.
      const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (canHover) {
         this.addEventListener('mouseleave', () => {
            if (this.classList.contains('slice_menu_open')) {
               this.handleCloseMenu();
            }
         });
      }
   }

   add(value) {
      this.setMenuTree(value);
   }

   setMenuTree(value) {
      if (!this.$treeHost) {
         return;
      }

      this.$treeHost.innerHTML = '';

      if (value instanceof Node) {
         this.$treeHost.appendChild(value);
      }
   }

   setEmptyState(message = 'No components found') {
      if (!this.$treeHost) {
         return;
      }

      this.$treeHost.innerHTML = '';
      const empty = document.createElement('p');
      empty.classList.add('slice_menu_empty');
      empty.textContent = message;
      this.$treeHost.appendChild(empty);
   }

   handleOpenMenu() {
      this.classList.add('slice_menu_open');
      if (this.$overlay) {
         this.$overlay.classList.add('is-visible');
      }
   }

   handleCloseMenu() {
      this.classList.remove('slice_menu_open');
      if (this.$overlay) {
         this.$overlay.classList.remove('is-visible');
      }
   }
}

customElements.define('slice-mainmenu', MainMenu);
