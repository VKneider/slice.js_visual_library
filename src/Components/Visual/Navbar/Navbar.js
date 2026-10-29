// Navbar — the top navigation bar: brand, links (with dropdowns nested as deep
// as you like), and actions, in five looks, with the current page marked and a
// mobile menu that behaves like one.
//
// ITEMS
//   { text, path }                 a route link (slice.router), marked active on its route
//   { text, href, target? }        an external link
//   { text, items: [...] }         a DropDown; `items` is DropDown's vocabulary,
//                                  submenus included (`type: 'dropdown'` + `options`
//                                  is the old form and still works)
//   Optional: icon (Icon name), exact (only the exact path is active), hidden.
//
// ACTIVE PAGE. The item whose path matches the URL (exactly, else the longest
// prefix) gets aria-current="page" and the indicator. It follows the router
// (`router:change`) and back/forward (`popstate`); `setActivePath()` sets it by hand.
//
// MOBILE. Below `breakpoint` the links move into a panel opened by a real
// hamburger button: a side drawer, a full screen, or a sheet under the bar.
// It traps focus, closes on Escape, on the backdrop and on navigation, and
// locks the page scroll while open. Shown, the panel is a `popover="manual"`:
// in the top layer, so the bar's own blur or hide-on-scroll transform (both
// create a containing block for fixed descendants) cannot trap it.
//
// The enumerated props are LITERAL arrays inside `static props`, read back by
// the setters from `Navbar.props` (COMPONENT_API_STANDARDS.md §10).

let _sliceNavbarSeq = 0;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default class Navbar extends HTMLElement {

   static props = {
      // `{ src, path, alt?, text? }`. Kept for compatibility; `brand` is the same
      // thing with a clearer name.
      logo: {
         type: 'object',
         default: null,
         required: false
      },
      // `{ logo | src, text, path, alt }`: an image, a name, or both.
      brand: {
         type: 'object',
         default: null,
         required: false
      },
      items: {
         type: 'array',
         default: [],
         required: false
      },
      // Button configs: `{ value, onClick, icon, variant, color }`.
      buttons: {
         type: 'array',
         default: [],
         required: false
      },
      // Anything else for the right side: Nodes (a ThemeSwitcher, a DropDown
      // avatar menu, a search box) or Button configs. Rendered after `buttons`.
      actions: {
         type: 'array',
         default: [],
         required: false
      },
      variant: {
         type: 'string',
         default: 'filled',
         required: false,
         // `filled` is Button's name for the same idea; 'solid' is accepted as an alias.
         allowedValues: ['filled', 'surface', 'glass', 'transparent', 'floating']
      },
      size: {
         type: 'string',
         default: 'md',
         required: false,
         allowedValues: ['sm', 'md', 'lg']
      },
      // 'sticky' sticks to the top while its parent scrolls; 'fixed' pins it to
      // the viewport and keeps its space in the page (see `spacer`).
      position: {
         type: 'string',
         default: 'static',
         required: false,
         allowedValues: ['static', 'sticky', 'fixed']
      },
      // `true`: a fixed bar keeps its height in the page, so it covers nothing.
      // Off by default because pages built for the old fixed bar already leave
      // room for it (a padding-top), and would get the gap twice.
      spacer: {
         type: 'boolean',
         default: false,
         required: false
      },
      // Slide away while scrolling down, come back on the way up.
      hideOnScroll: {
         type: 'boolean',
         default: false,
         required: false
      },
      // Where the links sit between the brand and the actions.
      align: {
         type: 'string',
         default: 'center',
         required: false,
         allowedValues: ['start', 'center', 'end']
      },
      // How the current page is marked.
      indicator: {
         type: 'string',
         default: 'underline',
         required: false,
         allowedValues: ['underline', 'pill', 'none']
      },
      direction: {
         type: 'string',
         default: 'normal',
         required: false,
         allowedValues: ['normal', 'reverse']
      },
      mobileMenu: {
         type: 'string',
         default: 'drawer',
         required: false,
         allowedValues: ['drawer', 'fullscreen', 'sheet']
      },
      // Viewport width (px) at and below which the mobile menu takes over.
      breakpoint: {
         type: 'number',
         default: 768,
         required: false
      },
      // Accessible name of the <nav> landmark.
      ariaLabel: {
         type: 'string',
         default: 'Main',
         required: false
      },
      // `(open) => void` when the mobile menu opens or closes.
      onMenuToggle: {
         type: 'function',
         default: null,
         required: false
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$header = this.querySelector('.slice_nav_header');
      this.$logoContainer = this.querySelector('.logo_container');
      this.$navBar = this.querySelector('.slice_nav_bar');
      this.$panel = this.querySelector('.nav_bar_panel');
      this.$menuWrap = this.querySelector('.nav_bar_menu_wrap');
      this.$menu = this.querySelector('.nav_bar_menu');
      this.$indicator = this.querySelector('.nav_bar_indicator');
      this.$buttonsContainer = this.querySelector('.nav_bar_buttons');
      this.$mobileButton = this.querySelector('.mobile_menu_button');
      this.$closeMenu = this.querySelector('.mobile_close_menu');

      this._uid = `slice-navbar-${++_sliceNavbarSeq}`;
      this.$navBar.id = `${this._uid}-nav`;
      this.$mobileButton.setAttribute('aria-controls', this.$navBar.id);

      this._items = [];
      this._buttons = [];
      this._actions = [];
      this._ready = false;
      this._itemsToken = 0;
      this._actionsToken = 0;
      this._builtActions = [];     // what _renderActions put there (not what callers appended)
      this._entries = [];          // { li, paths: string[], anchor, exact }
      this._active = null;
      this._activePath = null;     // set by hand; null follows the URL
      this._mobile = false;
      this._menuOpen = false;
      this._lastScrollY = 0;
      this._scrollFrame = 0;
      this._indicatorFrame = 0;
      this._mql = null;
      this._savedOverflow = null;
      this._onMenuToggle = null;

      for (const name of [
         '_handleBrandClick', '_handleToggleClick', '_handleCloseClick', '_handleNavClick',
         '_handleNavKeydown', '_handleScroll', '_handleRouteChange', '_handleMediaChange'
      ]) {
         this[name] = this[name].bind(this);
      }
      this.$logoContainer.addEventListener('click', this._handleBrandClick);
      this.$mobileButton.addEventListener('click', this._handleToggleClick);
      this.$closeMenu.addEventListener('click', this._handleCloseClick);
      this.$navBar.addEventListener('click', this._handleNavClick);
      this.$navBar.addEventListener('keydown', this._handleNavKeydown);

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      // Defaults for props the framework did not run a setter for.
      for (const name of ['variant', 'size', 'position', 'align', 'indicator', 'direction', 'mobileMenu', 'ariaLabel']) {
         if (this[`_${name}`] === undefined) this[name] = Navbar.props[name].default;
      }
      if (this._breakpoint === undefined) this.breakpoint = Navbar.props.breakpoint.default;

      // Raw window / document listeners: removed in beforeDestroy (§9).
      window.addEventListener('scroll', this._handleScroll, { passive: true });
      window.addEventListener('popstate', this._handleRouteChange);
      window.addEventListener('router:change', this._handleRouteChange);
      // The router announces navigations on slice.events when the app enables
      // the event bus, and on window otherwise (never both): listen to both.
      if (slice.events && typeof slice.events.subscribe === 'function') {
         this._routeSubscription = slice.events.subscribe('router:change', this._handleRouteChange, { component: this });
      }
      if (typeof ResizeObserver === 'function') {
         this._resizeObserver = new ResizeObserver(() => {
            this._scheduleIndicator();
            this._syncSpacer();
         });
         this._resizeObserver.observe(this.$menuWrap);
         this._resizeObserver.observe(this.$header);
      }

      this._ready = true;
      this._watchBreakpoint();
      await this._renderItems();
      await this._renderActions();
      this._syncScroll(true);
      this._syncSpacer();
   }

   // A cached MultiRoute can bring the view holding this bar back: re-sync.
   update() {
      this._syncActive();
   }

   beforeDestroy() {
      window.removeEventListener('scroll', this._handleScroll);
      window.removeEventListener('popstate', this._handleRouteChange);
      window.removeEventListener('router:change', this._handleRouteChange);
      if (this._routeSubscription && typeof slice.events?.unsubscribe === 'function') {
         slice.events.unsubscribe('router:change', this._routeSubscription);
         this._routeSubscription = null;
      }
      if (this._mql) this._mql.removeEventListener('change', this._handleMediaChange);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._scrollFrame) cancelAnimationFrame(this._scrollFrame);
      if (this._indicatorFrame) cancelAnimationFrame(this._indicatorFrame);
      this._setMenuOpen(false, false);
      // Built children are not cascaded by the controller (slice.build passes no
      // parent), so they are destroyed explicitly.
      slice.controller.destroyByContainer(this.$menu);
      slice.controller.destroyByContainer(this.$buttonsContainer);
   }

   // ------------------------------------------------------------------ props

   get logo() { return this._logo; }
   set logo(value) {
      this._logo = value && typeof value === 'object' ? value : null;
      this._renderBrand();
   }

   get brand() { return this._brand; }
   set brand(value) {
      this._brand = value && typeof value === 'object' ? value : null;
      this._renderBrand();
   }

   get items() { return this._items; }
   set items(value) {
      this._items = Array.isArray(value) ? value : [];
      if (this._ready) this._renderItems();
   }

   get buttons() { return this._buttons; }
   set buttons(value) {
      this._buttons = Array.isArray(value) ? value : [];
      if (this._ready) this._renderActions();
   }

   get actions() { return this._actions; }
   set actions(value) {
      this._actions = Array.isArray(value) ? value : [];
      if (this._ready) this._renderActions();
   }

   get variant() { return this._variant; }
   set variant(value) {
      this._variant = this._pick('variant', value === 'solid' ? 'filled' : value);
      this.dataset.variant = this._variant;
      this._syncSpacer();
      if (this._ready) this._syncScroll(true);
   }

   get size() { return this._size; }
   set size(value) {
      this._size = this._pick('size', value);
      this.dataset.size = this._size;
      this._scheduleIndicator();
   }

   get position() { return this._position; }
   set position(value) {
      this._position = this._pick('position', value);
      this.dataset.position = this._position;
      // Old class names, kept for consumers' CSS.
      this.classList.toggle('nav_bar_fixed', this._position === 'fixed');
      this.classList.toggle('nav_bar_sticky', this._position === 'sticky');
      this._syncSpacer();
   }

   get spacer() { return this._spacer; }
   set spacer(value) {
      this._spacer = value === true;
      this._syncSpacer();
   }

   get hideOnScroll() { return this._hideOnScroll === true; }
   set hideOnScroll(value) {
      this._hideOnScroll = value === true;
      if (!this._hideOnScroll) this.classList.remove('nav_bar--hidden');
   }

   get align() { return this._align; }
   set align(value) {
      this._align = this._pick('align', value);
      this.dataset.align = this._align;
      this._scheduleIndicator();
   }

   get indicator() { return this._indicator; }
   set indicator(value) {
      this._indicator = this._pick('indicator', value);
      this.dataset.indicator = this._indicator;
      this._scheduleIndicator();
   }

   get direction() { return this._direction; }
   set direction(value) {
      this._direction = this._pick('direction', value);
      this.$header.classList.toggle('direction-row-reverse', this._direction === 'reverse');
   }

   get mobileMenu() { return this._mobileMenu; }
   set mobileMenu(value) {
      this._mobileMenu = this._pick('mobileMenu', value);
      this.dataset.mobileMenu = this._mobileMenu;
   }

   get breakpoint() { return this._breakpoint; }
   set breakpoint(value) {
      const number = Number(value);
      this._breakpoint = Number.isFinite(number) && number >= 0 ? number : Navbar.props.breakpoint.default;
      if (this._ready) this._watchBreakpoint();
   }

   get ariaLabel() { return this._ariaLabel; }
   set ariaLabel(value) {
      this._ariaLabel = value ? String(value) : Navbar.props.ariaLabel.default;
      this.$navBar.setAttribute('aria-label', this._ariaLabel);
   }

   get onMenuToggle() { return this._onMenuToggle; }
   set onMenuToggle(value) { this._onMenuToggle = typeof value === 'function' ? value : null; }

   /** Whether the mobile menu is open. */
   get isMenuOpen() { return this._menuOpen; }

   _pick(name, value) {
      const { allowedValues, default: fallback } = Navbar.props[name];
      return allowedValues.includes(value) ? value : fallback;
   }

   // ------------------------------------------------------------- public API

   openMenu() { if (this._mobile) this._setMenuOpen(true, true); }
   closeMenu() { this._setMenuOpen(false, true); }
   toggleMenu() { if (this._menuOpen) this.closeMenu(); else this.openMenu(); }

   /** Mark the item for `path` as current; `null` goes back to following the URL. */
   setActivePath(path) {
      this._activePath = path === null || path === undefined ? null : String(path);
      this._syncActive();
   }

   // Old API.
   async addItems(items) {
      for (const item of items) await this.addItem(item, this.$menu);
   }

   async addItem(value, addTo = this.$menu) {
      const entry = await this._buildItem(value);
      if (!entry) return;
      addTo.appendChild(entry.li);
      this._entries.push(entry);
      this._syncActive();
   }

   async addButton(value, addTo = this.$buttonsContainer) {
      const node = await this._buildAction(value);
      if (node) addTo.appendChild(node);
   }

   // ------------------------------------------------------------------ brand

   _renderBrand() {
      const brand = this._brand ?? this._logo;
      this.$logoContainer.replaceChildren();
      this.$logoContainer.hidden = !brand;
      if (!brand) {
         this.$logoContainer.removeAttribute('href');
         return;
      }
      const src = brand.logo ?? brand.src;
      if (src) {
         const img = document.createElement('img');
         img.src = src;
         img.alt = brand.alt ?? (brand.text ? '' : 'Home');
         this.$logoContainer.appendChild(img);
      }
      if (brand.text) {
         const text = document.createElement('span');
         text.className = 'nav_bar_brand_text';
         text.textContent = String(brand.text);
         this.$logoContainer.appendChild(text);
      }
      if (brand.path) this.$logoContainer.setAttribute('href', slice.href(brand.path));
      else this.$logoContainer.removeAttribute('href');
   }

   _handleBrandClick(event) {
      const brand = this._brand ?? this._logo;
      if (!brand?.path) return;
      if (typeof slice?.router?.navigate === 'function') {
         event.preventDefault();
         slice.router.navigate(brand.path);
      }
      this._setMenuOpen(false, false);
   }

   // ------------------------------------------------------------------ items

   async _renderItems() {
      const token = ++this._itemsToken;
      const built = [];
      for (const item of this._items) {
         const entry = await this._buildItem(item);
         if (token !== this._itemsToken) {
            // A newer `items` won: drop what this pass built.
            for (const other of [...built, entry]) if (other) slice.controller.destroyByContainer(other.li);
            return;
         }
         if (entry) built.push(entry);
      }
      slice.controller.destroyByContainer(this.$menu);
      this.$menu.replaceChildren(...built.map((entry) => entry.li));
      this._entries = built;
      this._active = null;
      this._syncActive();
   }

   async _buildItem(raw) {
      if (!raw || typeof raw !== 'object' || raw.hidden === true) return null;
      const text = String(raw.text ?? raw.label ?? '');
      const children = raw.items ?? (raw.type === 'dropdown' ? raw.options : null);
      const li = document.createElement('li');
      li.className = 'nav_bar_item';

      if (Array.isArray(children) || typeof children === 'function' || raw.type === 'dropdown') {
         li.classList.add('nav_bar_item--dropdown');
         const dropdown = await slice.build('DropDown', {
            label: text,
            items: children ?? [],
            variant: raw.variant ?? 'plain',
            trigger: raw.trigger ?? 'hover',
            placement: raw.placement ?? 'bottom-start',
            icon: raw.icon ?? null
         });
         dropdown.classList.add('item');
         li.appendChild(dropdown);
         return { li, anchor: dropdown.querySelector('.slice_dropdown'), paths: this._pathsOf(children), exact: false };
      }

      let anchor;
      if (raw.href && !raw.path) {
         anchor = document.createElement('a');
         anchor.className = 'item';
         anchor.href = raw.href;
         if (raw.target) anchor.target = raw.target;
         if (raw.target === '_blank') anchor.rel = 'noopener noreferrer';
         anchor.textContent = text;
         li.appendChild(anchor);
      } else {
         const link = await slice.build('Link', {
            text,
            path: raw.path ?? '#',
            classes: 'item',
            icon: raw.icon ?? '',
            iconSize: 'small'
         });
         li.appendChild(link);
         anchor = link.querySelector('a');
      }
      return { li, anchor, paths: raw.path ? [String(raw.path)] : [], exact: raw.exact === true };
   }

   // Every route path inside a dropdown, at any depth: the dropdown is "current"
   // when one of its pages is.
   _pathsOf(items) {
      const out = [];
      const walk = (list) => {
         if (!Array.isArray(list)) return;
         for (const item of list) {
            if (!item || typeof item !== 'object') continue;
            if (item.path) out.push(String(item.path));
            walk(item.items ?? item.options ?? item.children);
         }
      };
      walk(items);
      return out;
   }

   // ---------------------------------------------------------------- actions

   async _renderActions() {
      const token = ++this._actionsToken;
      const nodes = [];
      // In order: building one at a time keeps the order you gave.
      for (const value of [...this._buttons, ...this._actions]) {
         const node = await this._buildAction(value);
         if (token !== this._actionsToken) return;
         if (node) nodes.push(node);
      }
      // Only what this method built is replaced: apps also append their own
      // nodes here (a ThemeSelector), and those stay, after ours.
      for (const old of this._builtActions) {
         if (nodes.includes(old)) continue;
         slice.controller.destroyByContainer(old);
         if (old.sliceId) slice.controller.destroyComponent(old);
         old.remove();
      }
      this.$buttonsContainer.prepend(...nodes);
      this._builtActions = nodes;
   }

   async _buildAction(value) {
      if (value instanceof Node) return value;
      if (!value || typeof value !== 'object') return null;
      const props = {
         value: value.value ?? value.text ?? value.label ?? '',
         icon: value.icon,
         onClick: value.onClick ?? value.onClickCallback,
         size: value.size ?? 'sm'
      };
      if (value.color) props.customColor = value.color;
      else if (value.variant) props.variant = value.variant;
      // On the filled bar a filled primary button would vanish into the bar.
      else props.variant = this._variant === 'filled' ? 'soft' : 'filled';
      const button = await slice.build('Button', props);
      if (!value.color && !value.variant && this._variant === 'filled') button.classList.add('nav_bar_button--on-filled');
      return button;
   }

   // ----------------------------------------------------------- active page

   _handleRouteChange() {
      this._syncActive();
      this._setMenuOpen(false, false);
   }

   _syncActive() {
      const path = this._activePath ?? slice.path;
      let match = null;
      let best = -1;
      for (const entry of this._entries) {
         for (const candidate of entry.paths) {
            if (candidate === path) {
               if (candidate.length > best) {
                  best = candidate.length + 10000; // an exact hit beats any prefix
                  match = entry;
               }
            } else if (!entry.exact && candidate !== '/' && candidate !== '#' &&
               path.startsWith(candidate.endsWith('/') ? candidate : `${candidate}/`) && candidate.length > best) {
               best = candidate.length;
               match = entry;
            }
         }
      }
      for (const entry of this._entries) {
         const on = entry === match;
         entry.li.classList.toggle('is-active', on);
         if (entry.anchor) {
            if (on) entry.anchor.setAttribute('aria-current', 'page');
            else entry.anchor.removeAttribute('aria-current');
         }
      }
      this._active = match;
      this._scheduleIndicator();
   }

   _scheduleIndicator() {
      if (this._indicatorFrame || !this.$indicator) return;
      this._indicatorFrame = requestAnimationFrame(() => {
         this._indicatorFrame = 0;
         this._placeIndicator();
      });
   }

   _placeIndicator() {
      const li = this._active?.li;
      const show = !!li && this._indicator !== 'none' && !this._mobile && li.offsetWidth > 0;
      this.$indicator.classList.toggle('is-visible', show);
      if (!show) return;
      const target = li.querySelector('.item') ?? li;
      const wrap = this.$menuWrap.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      this.$indicator.style.width = `${box.width}px`;
      this.$indicator.style.height = this._indicator === 'pill' ? `${box.height}px` : '';
      const y = this._indicator === 'pill' ? box.top - wrap.top : box.bottom - wrap.top + 3;
      this.$indicator.style.transform = `translate(${box.left - wrap.left}px, ${y}px)`;
   }

   // ----------------------------------------------------------------- scroll

   _handleScroll() {
      if (this._scrollFrame) return;
      this._scrollFrame = requestAnimationFrame(() => {
         this._scrollFrame = 0;
         this._syncScroll(false);
      });
   }

   _syncScroll(initial) {
      const y = window.scrollY || 0;
      this.classList.toggle('nav_bar--scrolled', y > 4);
      if (this._hideOnScroll && !this._menuOpen && !initial) {
         const height = this.$header.offsetHeight;
         const delta = y - this._lastScrollY;
         if (y <= height) this.classList.remove('nav_bar--hidden');
         else if (delta > 4) this.classList.add('nav_bar--hidden');
         else if (delta < -4) this.classList.remove('nav_bar--hidden');
      }
      this._lastScrollY = y;
   }

   // A fixed bar is out of the flow; the host keeps its height in the page.
   _syncSpacer() {
      const fixed = this._position === 'fixed';
      const reserve = fixed && this._spacer === true;
      this.classList.toggle('nav_bar--spacer', reserve);
      if (reserve) {
         const header = this.$header;
         const style = getComputedStyle(header);
         const outer = header.offsetHeight + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
         this.style.setProperty('--nav-spacer', `${outer}px`);
      } else {
         this.style.removeProperty('--nav-spacer');
      }
   }

   // ----------------------------------------------------------------- mobile

   _watchBreakpoint() {
      if (this._mql) this._mql.removeEventListener('change', this._handleMediaChange);
      this._mql = window.matchMedia(`(max-width: ${this._breakpoint}px)`);
      this._mql.addEventListener('change', this._handleMediaChange);
      this._applyMobile(this._mql.matches);
   }

   _handleMediaChange(event) {
      this._applyMobile(event.matches);
   }

   _applyMobile(mobile) {
      if (mobile === this._mobile && this.classList.contains('nav_bar--mobile') === mobile) return;
      if (!mobile) this._setMenuOpen(false, false);
      this._mobile = mobile;
      this.classList.toggle('nav_bar--mobile', mobile);
      // The panel is a popover only while it is one; on desktop the UA's
      // `[popover] { display: none }` would hide the links.
      if (mobile) this.$navBar.setAttribute('popover', 'manual');
      else this.$navBar.removeAttribute('popover');
      this.$mobileButton.hidden = !mobile;
      this._scheduleIndicator();
   }

   _handleToggleClick() {
      this._setMenuOpen(!this._menuOpen, true);
   }

   _handleCloseClick() {
      this._setMenuOpen(false, true);
   }

   _handleNavClick(event) {
      if (!this._menuOpen) return;
      // The dimmed area around the panel.
      if (event.target === this.$navBar) {
         this._setMenuOpen(false, true);
         return;
      }
      // A followed link closes the menu (dropdown triggers do not).
      const link = event.target.closest('a[href]');
      if (link && this.$panel.contains(link) && !link.closest('slice-dropdown')) this._setMenuOpen(false, false);
   }

   _handleNavKeydown(event) {
      if (!this._menuOpen) return;
      if (event.key === 'Escape') {
         event.preventDefault();
         this._setMenuOpen(false, true);
         return;
      }
      if (event.key !== 'Tab') return;
      // Focus stays inside the open panel.
      const nodes = [...this.$panel.querySelectorAll(FOCUSABLE)].filter((node) =>
         node.offsetParent !== null && !node.closest('.slice_dropbox'));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
         event.preventDefault();
         last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
         event.preventDefault();
         first.focus();
      }
   }

   _setMenuOpen(open, moveFocus) {
      open = open === true && this._mobile;
      if (open === this._menuOpen) return;
      this._menuOpen = open;
      this.classList.toggle('nav_bar--open', open);
      this.$mobileButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      this.$mobileButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

      if (open) {
         // The sheet hangs from the bar's bottom edge.
         this.style.setProperty('--nav-sheet-top', `${Math.max(0, Math.round(this.$header.getBoundingClientRect().bottom))}px`);
         this.classList.remove('nav_bar--hidden');
         if (typeof this.$navBar.showPopover === 'function') {
            try {
               if (!this.$navBar.matches(':popover-open')) this.$navBar.showPopover();
            } catch {
               /* not a popover (no support): the fixed fallback styles apply */
            }
         }
         requestAnimationFrame(() => {
            if (this._menuOpen) this.$navBar.classList.add('is-open');
         });
         this._lockScroll(true);
         if (moveFocus) {
            const first = [...this.$panel.querySelectorAll(FOCUSABLE)].find((node) =>
               node !== this.$closeMenu && node.offsetParent !== null);
            (first ?? this.$closeMenu).focus({ preventScroll: true });
         }
      } else {
         this.$navBar.classList.remove('is-open');
         if (typeof this.$navBar.hidePopover === 'function') {
            try {
               if (this.$navBar.matches(':popover-open')) this.$navBar.hidePopover();
            } catch {
               /* already hidden */
            }
         }
         this._lockScroll(false);
         if (moveFocus && this.$mobileButton.isConnected && !this.$mobileButton.hidden) this.$mobileButton.focus({ preventScroll: true });
      }
      if (this._onMenuToggle) this._onMenuToggle(open);
   }

   _lockScroll(lock) {
      const root = document.documentElement;
      if (lock) {
         if (this._savedOverflow === null) this._savedOverflow = root.style.overflow;
         root.style.overflow = 'hidden';
      } else if (this._savedOverflow !== null) {
         root.style.overflow = this._savedOverflow;
         this._savedOverflow = null;
      }
   }
}

window.customElements.define('slice-nav-bar', Navbar);