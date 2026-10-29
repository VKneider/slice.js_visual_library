import { applySize, SIZE_VALUES } from '../../shared/props.js';
import { texts } from '../../shared/text/texts.js';
// SideMenu — a navigation menu whose items open more items, as deep as needed.
//
// Two ways to show the levels, with the same items:
//   mode 'drill'  a submenu replaces the panel, with a back button and the
//                 level's name on top (phones, drawers, narrow sidebars);
//   mode 'tree'   a submenu opens under its item, indented (desktop sidebars);
//   mode 'auto'   tree when the menu is at least `breakpoint` wide, drill when
//                 narrower; it keeps its place when it switches.
//
// Each item does one thing:
//   { label, path }            goes to a route (slice.router); a real link, so
//                              Ctrl/⌘-click opens it in a tab
//   { label, href, target }    an outside link
//   { label, onClick }         an action: onClick({ item, menu, event })
//   { label, items }           opens a submenu; `items` can be a function, even
//                              async, and loads the first time it opens
//   { type: 'group', label, items }   a heading over items at the same level
//   { type: 'separator' }      a line
// and can have an icon, a badge, a description, `disabled`, `hidden` and
// `danger`. A submenu with a `path` too gets an "All …" link at its top in
// drill mode, and a link label beside its own toggle in tree mode.

const MODES = ['drill', 'tree', 'auto'];
const VARIANTS = ['soft', 'filled', 'ghost'];

const TEXTS = {
   label: 'Menu',
   back: 'Back to {label}',
   overview: 'All {label}',
   loading: 'Loading…',
   error: 'Could not load this menu.',
   retry: 'Try again',
   empty: 'Nothing here yet.',
   level: '{label}, {count} items',
   expand: 'Open {label}',
};

// Spanish mirrors TEXTS key by key; the app can override any of them with its dictionary.
const ES = {
   label: 'Menú',
   back: 'Volver a {label}',
   overview: 'Todo en {label}',
   loading: 'Cargando…',
   error: 'No se ha podido cargar este menú.',
   retry: 'Reintentar',
   empty: 'Aquí todavía no hay nada.',
   level: '{label}, {count} elementos',
   expand: 'Abrir {label}',
};

const t = texts('slice.sideMenu', { en: TEXTS, es: ES });

function fill(template, values) {
   return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function reducedMotion() {
   return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default class SideMenu extends HTMLElement {
   static props = {
      items: { type: 'array', default: [] },
      mode: { type: 'string', default: 'drill', allowedValues: MODES },
      // mode 'auto': the menu's own width (px) from which it is a tree.
      breakpoint: { type: 'number', default: 480 },
      // The name of the first level, shown above it in drill mode.
      title: { type: 'string', default: '' },
      // The current page: its item is marked, and its level (drill) or its
      // branch (tree) is opened.
      activePath: { type: 'string', default: '' },
      // Follow slice.router: activePath changes with the URL.
      followRoute: { type: 'boolean', default: true },
      // Tree: false keeps one submenu open per level.
      multiple: { type: 'boolean', default: true },
      variant: { type: 'string', default: 'soft', allowedValues: VARIANTS },
      size: { type: 'string', default: 'md', allowedValues: SIZE_VALUES },
      label: { type: 'string', default: '' },
      texts: { type: 'object', default: null },
      // (item, { event, menu }) — return false to stop the navigation.
      onSelect: { type: 'function', default: null },
      // (item, open) — a submenu opened or closed.
      onOpenChange: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-side-menu');

      this.$nav = this.querySelector('.slice-side-menu__nav');
      this.$header = this.querySelector('.slice-side-menu__header');
      this.$viewport = this.querySelector('.slice-side-menu__viewport');
      this.$live = this.querySelector('.slice-side-menu__live');

      this._items = [];
      this._mode = 'drill';
      /** @type {'drill' | 'tree'} what is on screen (mode 'auto' picks one) */
      this._view = 'drill';
      this._breakpoint = 480;
      this._title = '';
      this._activePath = '';
      this._followRoute = true;
      this._multiple = true;
      this._variant = 'soft';
      this._label = '';
      this._texts = {};
      this._onSelect = null;
      this._onOpenChange = null;

      /** @type {Map<string, any>} */
      this._nodes = new Map();
      this._root = { key: '', children: [], loaded: true, depth: -1, parent: null, item: null };
      /** @type {string[]} drill: the open levels, from the top */
      this._trail = [];
      /** @type {Set<string>} tree: the open branches */
      this._expanded = new Set();
      this._ready = false;
      this._renderToken = 0;
      this._animations = new Set();
      /** @type {Set<HTMLElement>} slots whose Icon or Badge is still being built */
      this._pending = new Set();

      this._onClick = this._onClick.bind(this);
      this._onKeyDown = this._onKeyDown.bind(this);
      this._handleRoute = this._handleRoute.bind(this);

      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._ready = true;
      applySize(this, this._size);
      this.dataset.variant = this._variant;
      this.addEventListener('click', this._onClick);
      this.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('popstate', this._handleRoute);
      window.addEventListener('router:change', this._handleRoute);
      if (slice.events && typeof slice.events.subscribe === 'function') {
         this._routeSubscription = slice.events.subscribe('router:change', this._handleRoute, { component: this });
      }
      this._applyLabel();
      this._build();
      this._syncAuto();
      if (this._mode === 'auto') this._view = this._autoView();
      if (!this._activePath && this._followRoute) this._activePath = this._currentRoutePath();
      this._openToActive();
      this._render();
      // A language change repaints what the texts setter repaints. The open
      // level, the open branches and the current page stay as they are.
      slice.translator?.watch?.(this, () => {
         this._applyLabel();
         this._render();
      });
   }

   // A cached MultiRoute brought the view back: follow the URL again.
   update() {
      this._handleRoute();
   }

   beforeDestroy() {
      this._ready = false;
      this.removeEventListener('click', this._onClick);
      this.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('popstate', this._handleRoute);
      window.removeEventListener('router:change', this._handleRoute);
      if (this._routeSubscription && typeof slice.events?.unsubscribe === 'function') {
         slice.events.unsubscribe('router:change', this._routeSubscription);
         this._routeSubscription = null;
      }
      this._resize?.disconnect();
      this._resize = null;
      for (const animation of this._animations) animation.cancel();
      this._animations.clear();
      this._discard(this.$header);
      this._discard(this.$viewport);
   }

   // ── Props ──────────────────────────────────────────────────────

   get items() { return this._items; }
   set items(value) {
      this._items = Array.isArray(value) ? value : [];
      if (!this._ready) return;
      this._build();
      // Keep what was open, as far as it still exists.
      this._trail = this._trail.filter((key) => this._nodes.has(key));
      for (const key of [...this._expanded]) if (!this._nodes.has(key)) this._expanded.delete(key);
      this._render();
   }

   get mode() { return this._mode; }
   set mode(value) {
      this._mode = MODES.includes(value) ? value : 'drill';
      this._syncAuto();
      this._setView(this._mode === 'auto' ? this._autoView() : this._mode === 'tree' ? 'tree' : 'drill');
   }

   get breakpoint() { return this._breakpoint; }
   set breakpoint(value) {
      this._breakpoint = Math.max(0, Number(value) || 0);
      if (this._mode === 'auto') this._setView(this._autoView());
   }

   get title() { return this._title; }
   set title(value) { this._title = value ? String(value) : ''; this._ready && this._renderHeader(); }

   get activePath() { return this._activePath; }
   set activePath(value) {
      this._activePath = value ? String(value) : '';
      if (!this._ready) return;
      const before = `${this._trail.join('|')}#${[...this._expanded].join('|')}`;
      this._openToActive();
      const after = `${this._trail.join('|')}#${[...this._expanded].join('|')}`;
      // Already on screen: only the marks move.
      if (before === after) this._markCurrent();
      else this._render();
   }

   get followRoute() { return this._followRoute; }
   set followRoute(value) { this._followRoute = value !== false; }

   get multiple() { return this._multiple; }
   set multiple(value) { this._multiple = value !== false; }

   get variant() { return this._variant; }
   set variant(value) {
      this._variant = VARIANTS.includes(value) ? value : 'soft';
      this.dataset.variant = this._variant;
   }

   get size() { return this._size; }
   set size(value) { this._size = applySize(this, value); }

   get label() { return this._label; }
   set label(value) { this._label = value ? String(value) : ''; this._applyLabel(); }

   get texts() { return this._texts; }
   set texts(value) {
      this._texts = value && typeof value === 'object' ? { ...value } : {};
      this._applyLabel();
      this._ready && this._render();
   }

   get onSelect() { return this._onSelect; }
   set onSelect(value) { this._onSelect = typeof value === 'function' ? value : null; }

   get onOpenChange() { return this._onOpenChange; }
   set onOpenChange(value) { this._onOpenChange = typeof value === 'function' ? value : null; }

   /** Drill: how many levels deep the panel is (0 is the first level). */
   get level() { return this._trail.length; }

   /** Drill: the items whose submenus are open, from the top. Tree: the open branches. */
   get openItems() {
      const keys = this._view === 'drill' ? this._trail : [...this._expanded];
      return keys.map((key) => this._nodes.get(key)?.item).filter(Boolean);
   }

   // ── Methods ────────────────────────────────────────────────────

   /** Open an item's submenu (and every submenu above it). */
   async open(id) {
      const node = this._nodeFor(id);
      if (!node || !this._isBranch(node)) return;
      const chain = this._ancestors(node).concat(node).map((n) => n.key);
      if (this._view === 'drill') {
         await this._drillTo(chain, { direction: 'forward' });
      } else {
         for (const key of chain) this._expanded.add(key);
         await this._ensureLoaded(node);
         this._render();
      }
   }

   /** Close an item's submenu. In drill mode, go back to the level that holds it. */
   async close(id) {
      const node = this._nodeFor(id);
      if (!node) return;
      if (this._view === 'drill') {
         const at = this._trail.indexOf(node.key);
         if (at >= 0) await this._drillTo(this._trail.slice(0, at), { direction: 'back' });
      } else if (this._expanded.delete(node.key)) {
         this._onOpenChange?.(node.item, false);
         this._render();
      }
   }

   /** Drill: one level up. */
   back() {
      if (this._view !== 'drill' || !this._trail.length) return Promise.resolve();
      return this._drillTo(this._trail.slice(0, -1), { direction: 'back' });
   }

   /** Back to the first level, with every submenu closed. */
   reset() {
      if (this._view === 'drill') return this._drillTo([], { direction: 'back' });
      this._expanded.clear();
      this._render();
      return Promise.resolve();
   }

   /** Load a lazy submenu again (after the data changed, or failed). */
   async reload(id) {
      const node = this._nodeFor(id);
      if (!node || typeof node.loader !== 'function') return;
      node.loaded = false;
      node.children = [];
      await this._ensureLoaded(node, { force: true });
   }

   /** Move the focus to an item (or the first one on screen). */
   focus(id) {
      const row = id === undefined ? this._rows()[0] : this.$viewport.querySelector(`[data-key="${CSS.escape(this._nodeFor(id)?.key ?? '')}"]`);
      /** @type {HTMLElement} */ (row)?.focus();
   }

   // ── Model ──────────────────────────────────────────────────────

   _build() {
      this._nodes.clear();
      this._root = { key: '', children: [], loaded: true, depth: -1, parent: null, item: null };
      this._root.children = this._makeNodes(this._items, this._root, this._root.key);
   }

   // `parent` is the branch whose submenu holds these items (groups do not
   // count: their items belong to the same level).
   _makeNodes(list, parent, prefix) {
      const out = [];
      if (!Array.isArray(list)) return out;
      list.forEach((item, index) => {
         if (!item || typeof item !== 'object' || item.hidden) return;
         if (item.type === 'separator' || item.separator === true) {
            out.push({ type: 'separator', key: `${prefix}/—${index}` });
            return;
         }
         const label = String(item.label ?? item.text ?? item.value ?? '');
         const base = item.id ?? item.path ?? `${prefix}/${label || index}`;
         let key = String(base);
         while (this._nodes.has(key)) key += '·';
         if (item.type === 'group') {
            const group = { type: 'group', key, item, label, parent, depth: parent.depth + 1 };
            this._nodes.set(key, group);
            group.children = this._makeNodes(item.items ?? item.children, parent, key);
            out.push(group);
            return;
         }
         const node = {
            type: 'item', key, item, label, parent,
            depth: parent.depth + 1,
            path: typeof item.path === 'string' ? item.path : '',
            href: typeof item.href === 'string' ? item.href : '',
            loader: null,
            children: null,
            loaded: true,
            loading: false,
            error: null,
         };
         const sub = item.items ?? item.children;
         if (typeof sub === 'function') {
            node.loader = sub;
            node.children = [];
            node.loaded = false;
         } else if (Array.isArray(sub)) {
            node.children = this._makeNodes(sub, node, key);
         }
         this._nodes.set(key, node);
         out.push(node);
      });
      return out;
   }

   _isBranch(node) {
      return node?.type === 'item' && (node.loader !== null || Array.isArray(node.children));
   }

   _nodeFor(id) {
      if (id && typeof id === 'object') {
         for (const node of this._nodes.values()) if (node.item === id) return node;
         return null;
      }
      if (this._nodes.has(String(id))) return this._nodes.get(String(id));
      for (const node of this._nodes.values()) if (node.item?.id === id || (node.path && node.path === id)) return node;
      return null;
   }

   _ancestors(node) {
      const chain = [];
      let current = node.parent;
      while (current && current !== this._root) {
         chain.unshift(current);
         current = current.parent;
      }
      return chain;
   }

   // Every selectable item of a level, groups flattened.
   _levelItems(entries) {
      const out = [];
      for (const entry of entries || []) {
         if (entry.type === 'group') out.push(...this._levelItems(entry.children));
         else if (entry.type === 'item') out.push(entry);
      }
      return out;
   }

   _activeNode() {
      if (!this._activePath) return null;
      for (const node of this._nodes.values()) if (node.type === 'item' && node.path === this._activePath) return node;
      return null;
   }

   _openToActive() {
      const node = this._activeNode();
      if (!node) return;
      const chain = this._ancestors(node).map((n) => n.key);
      if (this._view === 'drill') this._trail = chain;
      for (const key of chain) this._expanded.add(key);
   }

   _deepestOpenTrail() {
      let best = [];
      for (const key of this._expanded) {
         const node = this._nodes.get(key);
         if (!node) continue;
         const chain = this._ancestors(node).concat(node);
         if (chain.every((n) => this._expanded.has(n.key)) && chain.length > best.length) best = chain.map((n) => n.key);
      }
      return best;
   }

   async _ensureLoaded(node, { force = false } = {}) {
      if (!node.loader || (node.loaded && !force) || node.loading) return node.pending;
      node.loading = true;
      node.error = null;
      this._refreshBranch(node);
      node.pending = (async () => {
         try {
            const list = await node.loader(node.item);
            for (const key of [...this._nodes.keys()]) {
               if (key !== node.key && this._ancestors(this._nodes.get(key)).includes(node)) this._nodes.delete(key);
            }
            node.children = this._makeNodes(list, node, node.key);
            node.loaded = true;
         } catch (error) {
            node.error = error || new Error('load failed');
            slice.logger?.logWarning?.('SideMenu', `Could not load the items of "${node.label}"`, error);
         } finally {
            node.loading = false;
            node.pending = null;
         }
         if (this._ready) this._refreshBranch(node);
      })();
      return node.pending;
   }

   // Redraw the part of the menu that shows a branch's items.
   _refreshBranch(node) {
      if (!this._ready) return;
      if (this._view === 'drill') {
         if (this._trail[this._trail.length - 1] === node.key) this._render();
      } else if (this._expanded.has(node.key)) {
         this._render();
      }
   }

   // ── Mode ───────────────────────────────────────────────────────

   /** @param {'drill' | 'tree'} next */
   _setView(next) {
      const previous = this._view;
      this._view = next;
      this.dataset.mode = next;
      if (!this._ready || previous === next) return;
      // The same place in the other form: the open drill levels become open
      // branches, and the deepest open branch becomes the drill level.
      if (next === 'tree') {
         for (const key of this._trail) this._expanded.add(key);
      } else {
         this._trail = this._deepestOpenTrail();
      }
      this._render();
   }

   /** @returns {'drill' | 'tree'} */
   _autoView() {
      const width = this.clientWidth || this.getBoundingClientRect().width;
      // Not laid out yet: drill fits anywhere.
      if (!width) return this._view;
      return width >= this._breakpoint ? 'tree' : 'drill';
   }

   // mode 'auto' watches the menu's width; the other modes do not.
   _syncAuto() {
      if (this._mode === 'auto' && this._ready && !this._resize) {
         this._resize = new ResizeObserver(() => this._setView(this._autoView()));
         this._resize.observe(this);
      } else if (this._mode !== 'auto' && this._resize) {
         this._resize.disconnect();
         this._resize = null;
      }
   }

   // ── Rendering ──────────────────────────────────────────────────

   _render() {
      if (!this._ready) return;
      this._renderToken += 1;
      this.dataset.mode = this._view;
      const hadFocus = this.contains(document.activeElement);
      const focusedKey = /** @type {HTMLElement} */ (document.activeElement)?.dataset?.key;
      this._renderHeader();
      this._discard(this.$viewport);
      this.$viewport.replaceChildren(this._view === 'drill' ? this._renderLevel(this._currentLevelNode()) : this._renderTree(this._root.children, 0));
      if (hadFocus && focusedKey) this.$viewport.querySelector(`[data-key="${CSS.escape(focusedKey)}"]`)?.focus();
   }

   _markCurrent() {
      const active = this._activeNode();
      const holders = active ? this._ancestors(active) : [];
      for (const row of this.$viewport.querySelectorAll('.slice-side-menu__row')) {
         const node = this._nodes.get(/** @type {HTMLElement} */ (row).dataset.key);
         const current = !!node?.path && node.path === this._activePath;
         row.classList.toggle('is-current', current);
         if (current) row.setAttribute('aria-current', 'page');
         else row.removeAttribute('aria-current');
         row.classList.toggle('has-current', /** @type {HTMLElement} */ (row).dataset.opens === 'true' && holders.includes(node));
      }
   }

   _currentLevelNode() {
      const key = this._trail[this._trail.length - 1];
      return key ? this._nodes.get(key) : this._root;
   }

   _renderHeader() {
      this._discard(this.$header);
      this.$header.replaceChildren();
      const level = this._view === 'drill' ? this._currentLevelNode() : this._root;
      if (this._view === 'drill' && level !== this._root) {
         const parent = level.parent === this._root ? null : level.parent;
         const back = document.createElement('button');
         back.type = 'button';
         back.className = 'slice-side-menu__back';
         back.setAttribute('aria-label', this._t('back', { label: parent?.label || this._title || this._t('label') }));
         const icon = document.createElement('span');
         icon.className = 'slice-side-menu__back-icon';
         this._mount(icon, 'Icon', { name: 'chevron-left', size: '18px' });
         const text = document.createElement('span');
         text.className = 'slice-side-menu__back-label';
         text.textContent = level.label;
         back.append(icon, text);
         this.$header.append(back);
         this.$header.hidden = false;
      } else if (this._title) {
         const title = document.createElement('div');
         title.className = 'slice-side-menu__title';
         title.textContent = this._title;
         this.$header.append(title);
         this.$header.hidden = false;
      } else {
         this.$header.hidden = true;
      }
   }

   // Drill: one level, as a list.
   _renderLevel(node) {
      const list = document.createElement('ul');
      list.className = 'slice-side-menu__list slice-side-menu__level';
      list.dataset.level = node.key;
      if (node !== this._root && node.path) {
         const li = document.createElement('li');
         li.className = 'slice-side-menu__item';
         li.append(this._renderRow(node, { overview: true }));
         list.append(li);
      }
      if (node.loading || node.error || (node.loader && !node.loaded)) {
         list.append(this._statusRow(node));
      } else {
         this._appendEntries(list, node.children, 0);
         if (!this._levelItems(node.children).length && node !== this._root) list.append(this._statusRow(node, 'empty'));
      }
      return list;
   }

   // Tree: a level and the open branches inside it.
   _renderTree(entries, depth) {
      const list = document.createElement('ul');
      list.className = 'slice-side-menu__list';
      if (depth === 0) list.classList.add('slice-side-menu__level');
      this._appendEntries(list, entries, depth);
      return list;
   }

   _appendEntries(list, entries, depth) {
      for (const entry of entries || []) {
         if (entry.type === 'separator') {
            const li = document.createElement('li');
            li.className = 'slice-side-menu__separator';
            li.setAttribute('role', 'separator');
            list.append(li);
         } else if (entry.type === 'group') {
            const li = document.createElement('li');
            li.className = 'slice-side-menu__group';
            const heading = document.createElement('div');
            heading.className = 'slice-side-menu__group-label';
            heading.id = `${this._uid()}-g`;
            heading.textContent = entry.label;
            heading.style.setProperty('--slice-side-menu-depth', String(depth));
            const inner = document.createElement('ul');
            inner.className = 'slice-side-menu__list';
            inner.setAttribute('aria-labelledby', heading.id);
            this._appendEntries(inner, entry.children, depth);
            li.append(heading, inner);
            list.append(li);
         } else {
            list.append(this._renderItem(entry, depth));
         }
      }
   }

   _renderItem(node, depth) {
      const li = document.createElement('li');
      li.className = 'slice-side-menu__item';
      const branch = this._isBranch(node);
      if (this._view === 'tree' && branch) {
         const open = this._expanded.has(node.key);
         li.classList.toggle('is-open', open);
         if (node.path) {
            // A link with its own toggle beside it.
            const line = document.createElement('div');
            line.className = 'slice-side-menu__split';
            line.append(this._renderRow(node, { depth }), this._renderToggle(node, open));
            li.append(line);
         } else {
            li.append(this._renderRow(node, { depth, open }));
         }
         if (open) {
            const body = document.createElement('div');
            body.className = 'slice-side-menu__children';
            body.id = this._childrenId(node);
            if (node.loading || node.error || (node.loader && !node.loaded)) {
               const status = document.createElement('ul');
               status.className = 'slice-side-menu__list';
               status.append(this._statusRow(node, undefined, depth + 1));
               body.append(status);
            } else if (!this._levelItems(node.children).length) {
               const status = document.createElement('ul');
               status.className = 'slice-side-menu__list';
               status.append(this._statusRow(node, 'empty', depth + 1));
               body.append(status);
            } else {
               body.append(this._renderTree(node.children, depth + 1));
            }
            li.append(body);
         }
      } else {
         li.append(this._renderRow(node, { depth }));
      }
      return li;
   }

   _renderToggle(node, open) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'slice-side-menu__toggle';
      toggle.dataset.toggle = node.key;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-controls', this._childrenId(node));
      toggle.setAttribute('aria-label', this._t('expand', { label: node.label }));
      toggle.disabled = !!node.item.disabled;
      const chevron = document.createElement('span');
      chevron.className = 'slice-side-menu__chevron';
      this._mount(chevron, 'Icon', { name: 'chevron-right', size: '16px' });
      toggle.append(chevron);
      return toggle;
   }

   // One row: a link, an action, or the opener of a submenu.
   _renderRow(node, { depth = 0, open = false, overview = false } = {}) {
      const item = node.item;
      const branch = this._isBranch(node) && !overview;
      // In tree mode a branch with a path is a link; its toggle is separate.
      const opens = branch && !(this._view === 'tree' && node.path);
      const isLink = !opens && !!(node.path || node.href);
      const row = document.createElement(isLink ? 'a' : 'button');
      row.className = 'slice-side-menu__row';
      row.dataset.key = node.key;
      if (overview) row.dataset.overview = 'true';
      row.style.setProperty('--slice-side-menu-depth', String(this._view === 'tree' ? depth : 0));
      if (isLink) {
         row.setAttribute('href', node.path ? slice.href(node.path) : node.href);
         if (node.href && item.target) row.setAttribute('target', item.target);
         if (node.href && item.target === '_blank') row.setAttribute('rel', 'noopener noreferrer');
      } else {
         /** @type {HTMLButtonElement} */ (row).type = 'button';
      }
      if (opens) {
         row.dataset.opens = 'true';
         if (this._view === 'tree') {
            row.setAttribute('aria-expanded', String(open));
            row.setAttribute('aria-controls', this._childrenId(node));
         }
      }
      if (item.disabled) {
         if (isLink) {
            row.setAttribute('aria-disabled', 'true');
            row.removeAttribute('href');
            row.setAttribute('role', 'link');
         } else {
            /** @type {HTMLButtonElement} */ (row).disabled = true;
         }
      }
      if (item.danger) row.classList.add('is-danger');
      const current = !!node.path && node.path === this._activePath;
      if (current) {
         row.setAttribute('aria-current', 'page');
         row.classList.add('is-current');
      }
      // A submenu that holds the current page is marked too.
      if (opens && this._activeNode() && this._ancestors(this._activeNode()).includes(node)) row.classList.add('has-current');

      if (item.icon && !overview) {
         const icon = document.createElement('span');
         icon.className = 'slice-side-menu__icon';
         icon.setAttribute('aria-hidden', 'true');
         const config = typeof item.icon === 'string' ? { name: item.icon } : item.icon;
         this._mount(icon, 'Icon', { size: '18px', ...config });
         row.append(icon);
      }
      const text = document.createElement('span');
      text.className = 'slice-side-menu__text';
      const label = document.createElement('span');
      label.className = 'slice-side-menu__label';
      label.textContent = overview ? this._t('overview', { label: node.label }) : node.label;
      text.append(label);
      if (item.description && !overview) {
         const description = document.createElement('span');
         description.className = 'slice-side-menu__description';
         description.textContent = String(item.description);
         text.append(description);
      }
      row.append(text);
      if (item.badge !== undefined && item.badge !== null && item.badge !== '' && !overview) {
         const badge = document.createElement('span');
         badge.className = 'slice-side-menu__badge';
         const config = typeof item.badge === 'object' ? item.badge : typeof item.badge === 'number' ? { value: item.badge } : { label: String(item.badge) };
         this._mount(badge, 'Badge', { size: 'sm', tone: 'neutral', ...config });
         row.append(badge);
      }
      if (opens) {
         const chevron = document.createElement('span');
         chevron.className = 'slice-side-menu__chevron';
         chevron.setAttribute('aria-hidden', 'true');
         this._mount(chevron, 'Icon', { name: 'chevron-right', size: '16px' });
         row.append(chevron);
      }
      return row;
   }

   _statusRow(node, kind, depth = 0) {
      const li = document.createElement('li');
      li.className = 'slice-side-menu__status';
      li.style.setProperty('--slice-side-menu-depth', String(this._view === 'tree' ? depth : 0));
      if (kind === 'empty') {
         li.textContent = this._t('empty');
      } else if (node.error) {
         li.classList.add('is-error');
         const text = document.createElement('span');
         text.textContent = this._t('error');
         const retry = document.createElement('button');
         retry.type = 'button';
         retry.className = 'slice-side-menu__retry';
         retry.dataset.retry = node.key;
         retry.textContent = this._t('retry');
         li.append(text, retry);
      } else {
         li.classList.add('is-loading');
         li.setAttribute('role', 'status');
         const spinner = document.createElement('span');
         spinner.className = 'slice-side-menu__spinner';
         spinner.setAttribute('aria-hidden', 'true');
         const text = document.createElement('span');
         text.textContent = this._t('loading');
         li.append(spinner, text);
      }
      return li;
   }

   // Icons and badges are Slice components, built after the row. One that
   // arrives after its row was replaced is destroyed at once.
   //
   // The menu may not be in the page yet (it is often built, then appended),
   // so "is the row on screen" is not the test: a row is gone when the part
   // of the menu holding it was discarded (_discard), or the menu destroyed.
   _mount(slot, name, props) {
      this._pending.add(slot);
      slice.build(name, props).then((component) => {
         this._pending.delete(slot);
         if (!component) return;
         if (slot.dataset.discarded || !this._ready) {
            slice.controller.destroyComponent(component);
            return;
         }
         slot.append(component);
      }).catch((error) => {
         this._pending.delete(slot);
         slice.logger?.logWarning?.('SideMenu', `Could not build ${name}`, error);
      });
   }

   // Destroy what was built inside a part of the menu that goes away, and
   // mark what is still being built there.
   _discard(container) {
      for (const slot of this._pending) {
         if (container.contains(slot)) slot.dataset.discarded = 'true';
      }
      slice.controller.destroyByContainer(container);
   }

   // ── Drill ──────────────────────────────────────────────────────

   async _drillTo(trail, { direction }) {
      const from = this._trail;
      const fromKey = from[from.length - 1] ?? '';
      const toKey = trail[trail.length - 1] ?? '';
      if (fromKey === toKey) return;
      const hadFocus = this.contains(document.activeElement);
      for (const key of from) if (!trail.includes(key)) this._onOpenChange?.(this._nodes.get(key)?.item, false);
      for (const key of trail) if (!from.includes(key)) this._onOpenChange?.(this._nodes.get(key)?.item, true);
      this._trail = trail;
      const node = this._currentLevelNode();
      const loading = node.loader ? this._ensureLoaded(node) : null;

      this._renderToken += 1;
      this._renderHeader();
      const oldLevel = /** @type {HTMLElement} */ (this.$viewport.firstElementChild);
      const newLevel = this._renderLevel(node);
      this.$viewport.append(newLevel);
      this._announce(node);

      // Focus: the first item of a level going in, the item that opened the
      // level going out.
      if (hadFocus) {
         const target = direction === 'back'
            ? newLevel.querySelector(`[data-key="${CSS.escape(fromKey)}"]`) || newLevel.querySelector('.slice-side-menu__row')
            : newLevel.querySelector('.slice-side-menu__row:not(:disabled)');
         (/** @type {HTMLElement} */ (target) || this.$header.querySelector('button'))?.focus({ preventScroll: true });
      }

      if (oldLevel) await this._slide(oldLevel, newLevel, direction);
      await loading;
   }

   _slide(oldLevel, newLevel, direction) {
      const done = () => {
         if (oldLevel.isConnected) {
            this._discard(oldLevel);
            oldLevel.remove();
         }
      };
      if (reducedMotion() || typeof newLevel.animate !== 'function') {
         done();
         return Promise.resolve();
      }
      const sign = direction === 'back' ? -1 : 1;
      const fromHeight = oldLevel.offsetHeight;
      oldLevel.classList.add('is-leaving');
      const toHeight = newLevel.offsetHeight;
      const options = { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' };
      const animations = [
         newLevel.animate([{ transform: `translateX(${sign * 100}%)` }, { transform: 'translateX(0)' }], options),
         oldLevel.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${sign * -30}%)`, opacity: 0 }], options),
         this.$viewport.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], options),
      ];
      for (const animation of animations) this._animations.add(animation);
      return Promise.all(animations.map((a) => a.finished.catch(() => {}))).then(() => {
         for (const animation of animations) this._animations.delete(animation);
         done();
      });
   }

   _announce(node) {
      const label = node === this._root ? (this._title || this._t('label')) : node.label;
      const count = this._levelItems(node.children).length;
      this.$live.textContent = node.loading || (node.loader && !node.loaded) ? this._t('loading') : this._t('level', { label, count });
   }

   // ── Tree ───────────────────────────────────────────────────────

   async _toggleTree(node, open = !this._expanded.has(node.key)) {
      if (open === this._expanded.has(node.key)) return;
      if (open) {
         if (!this._multiple) {
            // One open submenu per level: close the siblings.
            for (const key of [...this._expanded]) {
               const other = this._nodes.get(key);
               if (other && other !== node && other.parent === node.parent) this._expanded.delete(key);
            }
         }
         this._expanded.add(node.key);
      } else {
         this._expanded.delete(node.key);
      }
      this._onOpenChange?.(node.item, open);
      const loading = open && node.loader ? this._ensureLoaded(node) : null;
      this._render();
      if (open) this._animateOpen(node);
      await loading;
   }

   _animateOpen(node) {
      const body = /** @type {HTMLElement} */ (this.$viewport.querySelector(`#${CSS.escape(this._childrenId(node))}`));
      if (!body || reducedMotion() || typeof body.animate !== 'function') return;
      const height = body.scrollHeight;
      const animation = body.animate(
         [{ height: '0px', opacity: 0 }, { height: `${height}px`, opacity: 1 }],
         { duration: Math.min(280, 140 + height / 6), easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      this._animations.add(animation);
      animation.finished.catch(() => {}).finally(() => this._animations.delete(animation));
   }

   // ── Events ─────────────────────────────────────────────────────

   _onClick(event) {
      const target = /** @type {HTMLElement} */ (event.target);
      if (target.closest('.slice-side-menu__back')) {
         this.back();
         return;
      }
      const retry = /** @type {HTMLElement} */ (target.closest('[data-retry]'));
      if (retry) {
         this.reload(retry.dataset.retry);
         return;
      }
      const toggle = /** @type {HTMLElement} */ (target.closest('[data-toggle]'));
      if (toggle) {
         const node = this._nodes.get(toggle.dataset.toggle);
         if (node) this._toggleTree(node);
         return;
      }
      const row = /** @type {HTMLElement} */ (target.closest('.slice-side-menu__row'));
      if (!row || !this.$viewport.contains(row)) return;
      const node = this._nodes.get(row.dataset.key);
      if (!node) return;
      if (row.getAttribute('aria-disabled') === 'true' || node.item.disabled) {
         event.preventDefault();
         return;
      }
      if (row.dataset.opens === 'true') {
         if (this._view === 'drill') this._drillTo(this._ancestors(node).concat(node).map((n) => n.key), { direction: 'forward' });
         else this._toggleTree(node);
         return;
      }
      this._select(node, event);
   }

   _select(node, event) {
      const item = node.item;
      const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1;
      const result = this._onSelect?.(item, { event, menu: this });
      this.dispatchEvent(new CustomEvent('side-menu-select', { bubbles: true, detail: { item } }));
      if (typeof item.onClick === 'function') {
         item.onClick({ item, menu: this, event });
         if (!node.path && !node.href) return;
      }
      // Outside links, and links opened in a new tab, are left to the browser.
      if (!node.path || modified) return;
      event.preventDefault();
      if (result === false) return;
      this.activePath = node.path;
      if (typeof slice?.router?.navigate === 'function') slice.router.navigate(node.path);
      else window.location.assign(node.path);
   }

   _rows() {
      const rows = [
         ...this.$header.querySelectorAll('.slice-side-menu__back'),
         ...this.$viewport.querySelectorAll('.slice-side-menu__level:not(.is-leaving) .slice-side-menu__row, .slice-side-menu__level:not(.is-leaving) .slice-side-menu__toggle, .slice-side-menu__level:not(.is-leaving) .slice-side-menu__retry'),
      ];
      return /** @type {HTMLElement[]} */ (rows).filter((row) => !(/** @type {HTMLButtonElement} */ (row).disabled) && row.getAttribute('aria-disabled') !== 'true');
   }

   _onKeyDown(event) {
      const target = /** @type {HTMLElement} */ (event.target);
      if (!target.closest?.('.slice-side-menu__row, .slice-side-menu__toggle, .slice-side-menu__back, .slice-side-menu__retry')) return;
      const rows = this._rows();
      const at = rows.indexOf(target);
      const node = this._nodes.get(target.dataset.key || target.dataset.toggle || '');
      const move = (index) => {
         rows[Math.max(0, Math.min(rows.length - 1, index))]?.focus();
         event.preventDefault();
      };
      switch (event.key) {
         case 'ArrowDown': move(at + 1); break;
         case 'ArrowUp': move(at - 1); break;
         case 'Home': move(0); break;
         case 'End': move(rows.length - 1); break;
         case 'ArrowRight': {
            if (!node || !this._isBranch(node) || target.dataset.overview) return;
            event.preventDefault();
            if (this._view === 'drill') {
               if (target.dataset.opens === 'true') this._drillTo(this._ancestors(node).concat(node).map((n) => n.key), { direction: 'forward' });
            } else if (!this._expanded.has(node.key)) {
               this._toggleTree(node, true);
            } else {
               // Already open: into its first item.
               const first = this.$viewport.querySelector(`#${CSS.escape(this._childrenId(node))} .slice-side-menu__row`);
               /** @type {HTMLElement} */ (first)?.focus();
            }
            break;
         }
         case 'ArrowLeft': {
            event.preventDefault();
            if (this._view === 'drill') {
               this.back();
            } else if (node && this._isBranch(node) && this._expanded.has(node.key)) {
               this._toggleTree(node, false);
            } else if (node && node.parent && node.parent !== this._root) {
               // Up to the item that holds this one.
               const parentRow = this.$viewport.querySelector(`.slice-side-menu__row[data-key="${CSS.escape(node.parent.key)}"]`);
               /** @type {HTMLElement} */ (parentRow)?.focus();
            }
            break;
         }
         default:
      }
   }

   // ── Router ─────────────────────────────────────────────────────

   _currentRoutePath() {
      return slice.path;
   }

   _handleRoute() {
      if (!this._followRoute || !this._ready) return;
      const path = this._currentRoutePath();
      if (path === this._activePath) return;
      const known = [...this._nodes.values()].some((node) => node.path === path);
      if (!known) return;
      this.activePath = path;
   }

   // ── Helpers ────────────────────────────────────────────────────

   _applyLabel() {
      this.$nav?.setAttribute('aria-label', this._label || this._title || this._t('label'));
   }

   _uid() {
      if (!this._id) this._id = `side-menu-${Math.random().toString(36).slice(2, 9)}`;
      return `${this._id}-${(this._seq = (this._seq || 0) + 1)}`;
   }

   _childrenId(node) {
      if (!this._id) this._uid();
      let hash = 0;
      for (const ch of node.key) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
      return `${this._id}-c${(hash >>> 0).toString(36)}`;
   }

   _t(key, values = {}) {
      return fill(this._texts[key] ?? t(key), values);
   }
}

customElements.define('slice-side-menu', SideMenu);