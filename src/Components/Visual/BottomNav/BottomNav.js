// BottomNav — an app-style tab bar: a floating capsule on wide screens that
// docks to the bottom edge on phones. It shares Navbar's API (`logo`, `items`,
// `buttons`, `position`, `direction`) and adds what a bottom bar needs:
// badges, a raised centre action, label modes, hide-on-scroll and the
// home-indicator (safe-area) inset.
//
// ITEMS
//   { text | label, path }       a route tab (slice.router), marked active on its route
//   { text, href, target? }      a plain link
//   { text, items: [...] }       a DropDown tab (`type: 'dropdown'` + `options` still works)
//   Optional: icon, badge (number, text, or true for a dot), exact, hidden,
//   onClick(item, event).
//
// Each tab is a real link (<a href>) inside its <li>, so it works with the
// keyboard, middle-click and screen readers; the current one carries
// aria-current="page". ← → move between tabs.
//
// The enumerated props are LITERAL arrays inside `static props`, read back by
// the setters from `BottomNav.props` (COMPONENT_API_STANDARDS.md §10).

const FAB_KEY = '__fab__';
let _sliceBottomNavSeq = 0;

export default class BottomNav extends HTMLElement {

   static props = {
      logo: {
         type: 'object',
         default: null,
         required: false
      },
      // `{ logo | src, text, path, alt }` (`logo` is the older name).
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
      buttons: {
         type: 'array',
         default: [],
         required: false
      },
      // Nodes (or Button configs) for the actions end, after `buttons`.
      actions: {
         type: 'array',
         default: [],
         required: false
      },
      // A raised round action in the middle of the tabs:
      // `{ icon, label, onClick(event), path }`.
      fab: {
         type: 'object',
         default: null,
         required: false
      },
      position: {
         type: 'string',
         default: 'fixed',
         required: false,
         allowedValues: ['fixed', 'sticky', 'static']
      },
      // `true`: a fixed bar keeps its height at the bottom of the page, so it
      // covers nothing. Off by default (pages built for it add a padding-bottom).
      spacer: {
         type: 'boolean',
         default: false,
         required: false
      },
      direction: {
         type: 'string',
         default: 'normal',
         required: false,
         allowedValues: ['normal', 'reverse']
      },
      variant: {
         type: 'string',
         default: 'filled',
         required: false,
         // `filled` is Button's name for the same idea; 'solid' is accepted as an alias.
         allowedValues: ['filled', 'surface', 'glass']
      },
      // 'auto' floats on wide screens and docks to the edge at `breakpoint`
      // and below; 'floating' and 'docked' force one.
      layout: {
         type: 'string',
         default: 'auto',
         required: false,
         allowedValues: ['auto', 'floating', 'docked']
      },
      breakpoint: {
         type: 'number',
         default: 600,
         required: false
      },
      // Tab labels: always shown, only on the current tab, or never (icons
      // only; the label still names the link for screen readers).
      labels: {
         type: 'string',
         default: 'always',
         required: false,
         allowedValues: ['always', 'active', 'none']
      },
      indicator: {
         type: 'string',
         default: 'pill',
         required: false,
         allowedValues: ['pill', 'line', 'none']
      },
      size: {
         type: 'string',
         default: 'md',
         required: false,
         allowedValues: ['sm', 'md', 'lg']
      },
      hideOnScroll: {
         type: 'boolean',
         default: false,
         required: false
      },
      ariaLabel: {
         type: 'string',
         default: 'Main',
         required: false
      },
      // `(item)` when the current tab changes by a click.
      onChange: {
         type: 'function',
         default: null,
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
      this.$actions = this.querySelector('.slice_bottomnav_actions');

      // The sliding indicator, created here so the template keeps a clean <ul>.
      this.$indicator = document.createElement('span');
      this.$indicator.className = 'slice_bottomnav_indicator';
      this.$indicator.setAttribute('aria-hidden', 'true');
      this.$tabs.appendChild(this.$indicator);

      this._uid = `slice-bottomnav-${++_sliceBottomNavSeq}`;
      this._badgeSeq = 0;
      this._tabsBaseMarginLeft = '0px';
      this._tabsBaseMarginRight = '0px';
      this._items = [];
      this._buttons = [];
      this._actions = [];
      this._entries = [];            // { li, link, item, paths, exact, key }
      this._tabsByPath = new Map();  // kept for setActivePath(path)
      this._activeTab = null;
      this._activePath = null;
      this._builtActions = [];
      this._ready = false;
      this._itemsToken = 0;
      this._actionsToken = 0;
      this._docked = false;
      this._lastScrollY = 0;
      this._scrollFrame = 0;
      this._onChange = null;

      for (const name of ['_onResize', '_onRoute', '_onScroll', '_onMedia', '_handleTabsClick', '_handleTabsKeydown', '_handleBrandClick']) {
         this[name] = this[name].bind(this);
      }
      this.$tabs.addEventListener('click', this._handleTabsClick);
      this.$tabs.addEventListener('keydown', this._handleTabsKeydown);
      this.$logoContainer.addEventListener('click', this._handleBrandClick);

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      for (const name of ['position', 'direction', 'variant', 'layout', 'labels', 'indicator', 'size', 'ariaLabel']) {
         if (this[`_${name}`] === undefined) this[name] = BottomNav.props[name].default;
      }
      if (this._breakpoint === undefined) this._breakpoint = BottomNav.props.breakpoint.default;

      // Raw window listeners: removed in beforeDestroy (§9).
      window.addEventListener('resize', this._onResize);
      window.addEventListener('popstate', this._onRoute);
      window.addEventListener('router:change', this._onRoute);
      // The router announces navigations on slice.events when the app enables
      // the event bus, and on window otherwise (never both): listen to both.
      if (slice.events && typeof slice.events.subscribe === 'function') {
         this._routeSubscription = slice.events.subscribe('router:change', this._onRoute, { component: this });
      }
      window.addEventListener('scroll', this._onScroll, { passive: true });
      if (typeof ResizeObserver === 'function') {
         this._resizeObserver = new ResizeObserver(() => {
            this._refreshIndicator();
            this._syncSpacer();
         });
         this._resizeObserver.observe(this.$bar);
      }

      this._ready = true;
      this._watchLayout();
      await this._renderItems();
      await this._renderActions();
      this._syncActiveFromLocation();
   }

   // A cached MultiRoute can revisit the view holding this bar: re-sync.
   update() {
      this._syncActiveFromLocation();
   }

   // Once in the document the tabs have a layout: place the indicator.
   connectedCallback() {
      requestAnimationFrame(() => this._refreshIndicator());
   }

   beforeDestroy() {
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('popstate', this._onRoute);
      window.removeEventListener('router:change', this._onRoute);
      if (this._routeSubscription && typeof slice.events?.unsubscribe === 'function') {
         slice.events.unsubscribe('router:change', this._routeSubscription);
         this._routeSubscription = null;
      }
      window.removeEventListener('scroll', this._onScroll);
      if (this._mql) this._mql.removeEventListener('change', this._onMedia);
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._scrollFrame) cancelAnimationFrame(this._scrollFrame);
      slice.controller.destroyByContainer(this.$tabs);
      slice.controller.destroyByContainer(this.$actions);
   }

   /* ---------------------------------------------------------------- props */

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
   set items(values) {
      this._items = Array.isArray(values) ? values : [];
      if (this._ready) this._renderItems();
   }

   get buttons() { return this._buttons; }
   set buttons(values) {
      this._buttons = Array.isArray(values) ? values : [];
      if (this._ready) this._renderActions();
   }

   get actions() { return this._actions; }
   set actions(values) {
      this._actions = Array.isArray(values) ? values : [];
      if (this._ready) this._renderActions();
   }

   get fab() { return this._fab; }
   set fab(value) {
      this._fab = value && typeof value === 'object' ? value : null;
      if (this._ready) this._renderItems();
   }

   get position() { return this._position; }
   set position(value) {
      // As before: no value means the default ('fixed'); any value that is not
      // a known position means 'static'.
      const { allowedValues, default: fallback } = BottomNav.props.position;
      this._position = value === null || value === undefined ? fallback : allowedValues.includes(value) ? value : 'static';
      // The CSS targets the inner root, not the host.
      this.$root.dataset.position = this._position;
      this._syncSpacer();
   }

   get spacer() { return this._spacer === true; }
   set spacer(value) {
      this._spacer = value === true;
      this._syncSpacer();
   }

   get direction() { return this._direction; }
   set direction(value) {
      const next = this._pick('direction', value);
      const changed = next !== this._direction;
      this._direction = next;
      this.$bar.classList.toggle('slice_bottomnav_reverse', next === 'reverse');
      if (changed && this._ready) this._renderItems();
   }

   get variant() { return this._variant; }
   set variant(value) {
      this._variant = this._pick('variant', value === 'solid' ? 'filled' : value);
      this.dataset.variant = this._variant;
   }

   get layout() { return this._layout; }
   set layout(value) {
      this._layout = this._pick('layout', value);
      this.dataset.layout = this._layout;
      if (this._ready) this._watchLayout();
   }

   get breakpoint() { return this._breakpoint; }
   set breakpoint(value) {
      const number = Number(value);
      this._breakpoint = Number.isFinite(number) && number >= 0 ? number : BottomNav.props.breakpoint.default;
      if (this._ready) this._watchLayout();
   }

   get labels() { return this._labels; }
   set labels(value) {
      this._labels = this._pick('labels', value);
      this.dataset.labels = this._labels;
      this._refreshIndicatorSoon();
   }

   get indicator() { return this._indicator; }
   set indicator(value) {
      this._indicator = this._pick('indicator', value);
      this.dataset.indicator = this._indicator;
      this._refreshIndicatorSoon();
   }

   get size() { return this._size; }
   set size(value) {
      this._size = this._pick('size', value);
      this.dataset.size = this._size;
      this._refreshIndicatorSoon();
   }

   get hideOnScroll() { return this._hideOnScroll === true; }
   set hideOnScroll(value) {
      this._hideOnScroll = value === true;
      if (!this._hideOnScroll) this.classList.remove('slice_bottomnav--hidden');
   }

   get ariaLabel() { return this._ariaLabel; }
   set ariaLabel(value) {
      this._ariaLabel = value ? String(value) : BottomNav.props.ariaLabel.default;
      this.$root.setAttribute('aria-label', this._ariaLabel);
   }

   get onChange() { return this._onChange; }
   set onChange(value) { this._onChange = typeof value === 'function' ? value : null; }

   _pick(name, value) {
      const { allowedValues, default: fallback } = BottomNav.props[name];
      return allowedValues.includes(value) ? value : fallback;
   }

   /* ----------------------------------------------------------- public API */

   /** Mark the tab for `path` as current; `null` goes back to following the URL. */
   setActivePath(path) {
      this._activePath = path === null || path === undefined ? null : String(path);
      this._syncActiveFromLocation();
   }

   /** Set a tab's badge (by path or index): a number, text, true (a dot) or null. */
   setBadge(target, value) {
      const entry = typeof target === 'number' ? this._entries.filter((e) => e.key !== FAB_KEY)[target] : this._entries.find((e) => e.paths.includes(String(target)));
      if (!entry) return;
      entry.item = { ...entry.item, badge: value };
      this._applyBadge(entry, value);
   }

   // Old API.
   async addItems(items) {
      for (const item of items) await this.addItem(item);
   }

   async addItem(value) {
      const entry = await this._buildTab(value);
      if (!entry) return;
      this.$tabs.appendChild(entry.li);
      this._register(entry);
      this._syncActiveFromLocation();
   }

   async addButton(value, addTo = this.$actions) {
      const node = await this._buildAction(value);
      if (node) addTo.appendChild(node);
      this._balanceTabs();
   }

   /* ----------------------------------------------------------------- brand */

   _renderBrand() {
      const brand = this._brand ?? this._logo;
      this.$logoContainer.replaceChildren();
      this.$logoContainer.classList.toggle('is-visible', !!brand);
      if (!brand) {
         this.$logoContainer.removeAttribute('href');
         this._balanceTabs();
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
         text.className = 'slice_bottomnav_brand_text';
         text.textContent = String(brand.text);
         this.$logoContainer.appendChild(text);
      }
      this.$logoContainer.setAttribute('href', brand.path || '#');
      this._balanceTabs();
   }

   _handleBrandClick(event) {
      const brand = this._brand ?? this._logo;
      if (!brand?.path || typeof slice?.router?.navigate !== 'function') return;
      event.preventDefault();
      slice.router.navigate(brand.path);
   }

   /* ------------------------------------------------------------------ tabs */

   async _renderItems() {
      const token = ++this._itemsToken;
      const list = this._items.filter((item) => item && typeof item === 'object' && item.hidden !== true);
      const ordered = this._direction === 'reverse' ? [...list].reverse() : list;
      const built = [];
      for (const item of ordered) {
         const entry = await this._buildTab(item);
         if (token !== this._itemsToken) {
            for (const other of [...built, entry]) if (other) slice.controller.destroyByContainer(other.li);
            return;
         }
         if (entry) built.push(entry);
      }
      if (this._fab) {
         const fab = await this._buildFab(this._fab);
         if (token !== this._itemsToken) return;
         built.splice(Math.ceil(built.length / 2), 0, fab);
      }
      slice.controller.destroyByContainer(this.$tabs);
      this.$tabs.replaceChildren(this.$indicator, ...built.map((entry) => entry.li));
      this._entries = [];
      this._tabsByPath = new Map();
      for (const entry of built) this._register(entry);
      this._activeTab = null;
      this._syncActiveFromLocation();
   }

   _register(entry) {
      this._entries.push(entry);
      for (const path of entry.paths) if (!this._tabsByPath.has(path)) this._tabsByPath.set(path, entry.li);
   }

   async _buildTab(raw) {
      if (!raw || typeof raw !== 'object' || raw.hidden === true) return null;
      const text = String(raw.text ?? raw.label ?? '');
      const children = raw.items ?? (raw.type === 'dropdown' ? raw.options : null);
      const li = document.createElement('li');
      li.className = 'slice_bottomnav_tab';

      if (Array.isArray(children) || typeof children === 'function' || raw.type === 'dropdown') {
         li.classList.add('is-dropdown');
         // The menu opens upwards from a bar at the bottom, and flips when
         // there is no room (DropDown handles both).
         const dropdown = await slice.build('DropDown', {
            label: text,
            items: children ?? [],
            variant: raw.variant ?? 'plain',
            placement: raw.placement ?? (this._position === 'static' ? 'bottom-start' : 'top-start'),
            icon: raw.icon ?? null
         });
         dropdown.classList.add('slice_bottomnav_dropdown');
         li.appendChild(dropdown);
         return { li, link: dropdown.querySelector('.slice_dropdown'), item: raw, paths: this._pathsOf(children), exact: false, key: text };
      }

      const link = document.createElement('a');
      link.className = 'slice_bottomnav_link';
      link.href = raw.path ?? raw.href ?? '#';
      if (raw.target) link.target = raw.target;
      if (raw.target === '_blank') link.rel = 'noopener noreferrer';

      const iconWrap = document.createElement('span');
      iconWrap.className = 'slice_bottomnav_icon_wrap';
      if (raw.icon) {
         try {
            const icon = await slice.build('Icon', { name: raw.icon, size: 'medium', color: 'currentColor' });
            icon.classList.add('slice_bottomnav_icon');
            iconWrap.appendChild(icon);
         } catch {
            /* unknown icon: a label-only tab */
         }
      }
      link.appendChild(iconWrap);

      const label = document.createElement('span');
      label.className = 'slice_bottomnav_label';
      label.textContent = text;
      link.appendChild(label);
      if (raw.icon) link.setAttribute('title', text);

      if (raw.path) li.dataset.path = String(raw.path);
      li.appendChild(link);
      const entry = { li, link, item: raw, paths: raw.path ? [String(raw.path)] : [], exact: raw.exact === true, key: raw.path ?? text };
      this._applyBadge(entry, raw.badge);
      return entry;
   }

   async _buildFab(raw) {
      const li = document.createElement('li');
      li.className = 'slice_bottomnav_fab';
      const button = document.createElement(raw.path ? 'a' : 'button');
      button.className = 'slice_bottomnav_fab_button';
      if (raw.path) button.href = raw.path;
      else button.type = 'button';
      button.setAttribute('aria-label', String(raw.label ?? raw.text ?? 'Action'));
      if (raw.icon) {
         try {
            button.appendChild(await slice.build('Icon', { name: raw.icon, size: 'medium', color: 'currentColor' }));
         } catch {
            button.textContent = '+';
         }
      } else button.textContent = '+';
      li.appendChild(button);
      return { li, link: button, item: raw, paths: [], exact: true, key: FAB_KEY };
   }

   _applyBadge(entry, value) {
      const wrap = entry.li.querySelector('.slice_bottomnav_icon_wrap');
      if (!wrap) return;
      wrap.querySelector('.slice_bottomnav_badge')?.remove();
      entry.link.removeAttribute('aria-describedby');
      if (value === undefined || value === null || value === false || value === '' || value === 0) return;
      const badge = document.createElement('span');
      badge.className = 'slice_bottomnav_badge';
      if (value === true) {
         badge.classList.add('slice_bottomnav_badge--dot');
         badge.setAttribute('aria-label', 'New');
      } else {
         const number = Number(value);
         badge.textContent = Number.isFinite(number) && number > 99 ? '99+' : String(value);
      }
      badge.id = `${this._uid}-badge-${++this._badgeSeq}`;
      entry.link.setAttribute('aria-describedby', badge.id);
      wrap.appendChild(badge);
   }

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

   _entryOf(node) {
      const li = node?.closest?.('.slice_bottomnav_tab, .slice_bottomnav_fab');
      return this._entries.find((entry) => entry.li === li) ?? null;
   }

   async _handleTabsClick(event) {
      const entry = this._entryOf(event.target);
      if (!entry || entry.li.classList.contains('is-dropdown')) return;
      const item = entry.item;
      if (entry.key === FAB_KEY) {
         if (typeof item.onClick === 'function') item.onClick(event);
         if (item.path && typeof slice?.router?.navigate === 'function') {
            event.preventDefault();
            await slice.router.navigate(item.path);
         }
         return;
      }
      if (typeof item.onClick === 'function') item.onClick(item, event);
      if (event.defaultPrevented) return;
      if (item.path) {
         event.preventDefault();
         const changed = this._activeTab !== entry.li;
         this._setActiveTab(entry.li);
         if (changed && this._onChange) this._onChange(item);
         if (typeof slice?.router?.navigate === 'function') await slice.router.navigate(item.path);
      } else if (!item.href) {
         event.preventDefault();
      }
   }

   // ← → between tabs (each tab is still its own tab stop).
   _handleTabsKeydown(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
      if (event.target.closest('.slice_dropbox')) return;
      const links = this._entries.map((entry) => entry.link).filter(Boolean);
      const index = links.indexOf(event.target);
      if (index === -1) return;
      event.preventDefault();
      let next;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = links.length - 1;
      else next = (index + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
      links[next].focus();
   }

   /* --------------------------------------------------------------- actions */

   async _renderActions() {
      const token = ++this._actionsToken;
      const nodes = [];
      for (const value of [...this._buttons, ...this._actions]) {
         const node = await this._buildAction(value);
         if (token !== this._actionsToken) return;
         if (node) nodes.push(node);
      }
      // Only what this method built is replaced; nodes apps append stay.
      for (const old of this._builtActions) {
         if (nodes.includes(old)) continue;
         slice.controller.destroyByContainer(old);
         if (old.sliceId) slice.controller.destroyComponent(old);
         old.remove();
      }
      this.$actions.prepend(...nodes);
      this._builtActions = nodes;
      this._balanceTabs();
      this._refreshIndicatorSoon();
   }

   // `buttons` configs are drawn as the bar's own pills, not as Button: a
   // rectangular control does not belong inside a capsule. A config with an
   // icon and no text becomes a round icon button. Nodes are used as given.
   async _buildAction(value) {
      if (value instanceof Node) return value;
      if (!value || typeof value !== 'object') return null;
      const text = String(value.value ?? value.text ?? value.label ?? '');
      const iconName = typeof value.icon === 'string' ? value.icon : value.icon?.name;
      const node = document.createElement(value.path || value.href ? 'a' : 'button');
      node.className = 'slice_bottomnav_action';
      if (value.path || value.href) node.href = value.path ?? value.href;
      else node.type = 'button';
      if (value.variant === 'ghost' || value.variant === 'outlined') node.classList.add('slice_bottomnav_action--quiet');
      if (iconName) {
         try {
            const icon = await slice.build('Icon', { name: iconName, size: 'small', color: 'currentColor' });
            icon.classList.add('slice_bottomnav_action_icon');
            node.appendChild(icon);
         } catch {
            /* unknown icon: text only */
         }
      }
      if (text) {
         const label = document.createElement('span');
         label.className = 'slice_bottomnav_action_label';
         label.textContent = text;
         node.appendChild(label);
      } else {
         node.classList.add('slice_bottomnav_action--icon');
         node.setAttribute('aria-label', String(value.ariaLabel ?? value.title ?? 'Action'));
      }
      // `color: { text, background }` as before.
      if (value.color?.background) node.style.background = value.color.background;
      if (value.color?.text) node.style.color = value.color.text;
      const onClick = value.onClick ?? value.onClickCallback;
      node.addEventListener('click', async (event) => {
         if (typeof onClick === 'function') await onClick(event);
         if (value.path && !event.defaultPrevented && typeof slice?.router?.navigate === 'function') {
            event.preventDefault();
            await slice.router.navigate(value.path);
         }
      });
      return node;
   }

   /* ---------------------------------------------------------- active state */

   _onRoute() {
      this._syncActiveFromLocation();
   }

   _syncActiveFromLocation() {
      const path = this._activePath ?? window.location.pathname;
      // Exact match first, then the longest prefix (/docs/button keeps /docs);
      // '/' and `exact` tabs only match themselves.
      let match = null;
      let best = -1;
      for (const entry of this._entries) {
         for (const candidate of entry.paths) {
            if (candidate === path) {
               if (candidate.length + 10000 > best) {
                  best = candidate.length + 10000;
                  match = entry;
               }
            } else if (!entry.exact && candidate !== '/' && path.startsWith(candidate.endsWith('/') ? candidate : `${candidate}/`) && candidate.length > best) {
               best = candidate.length;
               match = entry;
            }
         }
      }
      if (match) this._setActiveTab(match.li);
      else {
         this._clearActive();
         this._hideIndicator();
      }
   }

   _clearActive() {
      for (const entry of this._entries) {
         entry.li.classList.remove('is-active');
         entry.link?.removeAttribute('aria-current');
      }
      this._activeTab = null;
   }

   _setActiveTab(tab) {
      if (this._activeTab !== tab) {
         this._clearActive();
         tab.classList.add('is-active');
         const entry = this._entries.find((e) => e.li === tab);
         entry?.link?.setAttribute('aria-current', 'page');
         this._activeTab = tab;
      }
      this._refreshIndicator();
   }

   _refreshIndicatorSoon() {
      requestAnimationFrame(() => this._refreshIndicator());
   }

   _refreshIndicator() {
      this._balanceTabs();
      if (!this.$indicator || !this._activeTab || this._indicator === 'none') {
         this.$indicator?.classList.remove('is-visible');
         return;
      }
      const width = this._activeTab.offsetWidth;
      const left = this._activeTab.offsetLeft;
      if (width === 0) return; // not laid out yet; connectedCallback / resize retry
      this.$indicator.style.width = `${width}px`;
      this.$indicator.style.transform = `translateX(${left}px)`;
      this.$indicator.classList.add('is-visible');
   }

   _hideIndicator() {
      this._balanceTabs();
      this.$indicator?.classList.remove('is-visible');
   }

   // Keeps the tabs optically centred in the bar when a logo or actions sit on
   // one side only, by padding the other side with the difference.
   _balanceTabs() {
      if (!this.$bar || !this.$tabs) return;
      if (this._docked) {
         this.$tabs.style.marginLeft = this._tabsBaseMarginLeft;
         this.$tabs.style.marginRight = this._tabsBaseMarginRight;
         return;
      }
      const style = getComputedStyle(this.$bar);
      const gap = Number.parseFloat(style.columnGap || style.gap || '0') || 0;
      const outer = (element) => {
         const s = getComputedStyle(element);
         return element.offsetWidth + (Number.parseFloat(s.marginLeft || '0') || 0) + (Number.parseFloat(s.marginRight || '0') || 0);
      };
      const logoVisible = this.$logoContainer.classList.contains('is-visible') && getComputedStyle(this.$logoContainer).display !== 'none';
      const actionsVisible = this.$actions.childElementCount > 0 && getComputedStyle(this.$actions).display !== 'none';
      const leftWidth = logoVisible ? outer(this.$logoContainer) + gap : 0;
      const rightWidth = actionsVisible ? outer(this.$actions) + gap : 0;
      const diff = Math.round(Math.abs(leftWidth - rightWidth) * 10) / 10;
      const [start, end] = this._direction === 'reverse' ? ['marginRight', 'marginLeft'] : ['marginLeft', 'marginRight'];
      this.$tabs.style.marginLeft = this._tabsBaseMarginLeft;
      this.$tabs.style.marginRight = this._tabsBaseMarginRight;
      if (leftWidth > rightWidth) this.$tabs.style[end] = `${diff}px`;
      else if (rightWidth > leftWidth) this.$tabs.style[start] = `${diff}px`;
   }

   /* ---------------------------------------------------------- layout, scroll */

   _watchLayout() {
      if (this._mql) this._mql.removeEventListener('change', this._onMedia);
      this._mql = null;
      if (this._layout === 'auto') {
         this._mql = window.matchMedia(`(max-width: ${this._breakpoint}px)`);
         this._mql.addEventListener('change', this._onMedia);
         this._applyDocked(this._mql.matches);
      } else {
         this._applyDocked(this._layout === 'docked');
      }
   }

   _onMedia(event) {
      this._applyDocked(event.matches);
   }

   _applyDocked(docked) {
      this._docked = docked;
      this.classList.toggle('slice_bottomnav--docked', docked);
      this._refreshIndicatorSoon();
      this._syncSpacer();
   }

   _onResize() {
      this._refreshIndicator();
      this._syncSpacer();
   }

   _onScroll() {
      if (!this._hideOnScroll || this._scrollFrame) return;
      this._scrollFrame = requestAnimationFrame(() => {
         this._scrollFrame = 0;
         const y = window.scrollY || 0;
         const delta = y - this._lastScrollY;
         if (y < 40) this.classList.remove('slice_bottomnav--hidden');
         else if (delta > 4) this.classList.add('slice_bottomnav--hidden');
         else if (delta < -4) this.classList.remove('slice_bottomnav--hidden');
         this._lastScrollY = y;
      });
   }

   // A fixed bar can reserve its height at the bottom of the page.
   _syncSpacer() {
      const reserve = this._position === 'fixed' && this._spacer === true;
      this.classList.toggle('slice_bottomnav--spacer', reserve);
      if (!reserve || !this.$root) {
         this.style.removeProperty('--bottomnav-spacer');
         return;
      }
      const rect = this.$root.getBoundingClientRect();
      const fromBottom = Math.max(0, window.innerHeight - rect.bottom);
      this.style.setProperty('--bottomnav-spacer', `${Math.ceil(rect.height + fromBottom)}px`);
   }
}

window.customElements.define('slice-bottom-nav', BottomNav);