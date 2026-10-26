import { applySize, SIZE_VALUES } from '../../shared/props.js';

// Content that folds open: one section, or a group of them (an accordion).
//
//   One section    title, subtitle, icon, badge, then text / content inside.
//   An accordion   items: [{ id, title, subtitle, icon, badge, text, content,
//                  open, disabled }]. One open at a time unless `multiple`.
//
// Each section is a native <details>/<summary>: the browser gives it the
// button role, Enter / Space, aria-expanded, and opens it when find-in-page
// lands on text inside. On top of that, Details animates the height, keeps
// the sections of a group exclusive, moves between summaries with the arrow
// keys, loads content on first open, and can remember what was open.
//
// Standalone sections with the same `name` close each other, like the native
// `name` attribute, so separate Details on a page can still act as one group.

const VARIANTS = ['outlined', 'separated', 'filled', 'ghost'];
const MARKERS = ['chevron', 'plus'];
const BADGE_VARIANTS = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const SINGLE_ID = 'details';
const CHEVRON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

let uid = 0;
// name -> the standalone Details sharing it, so opening one closes the others.
const groups = new Map();

export default class Details extends HTMLElement {
   static props = {
      // One section
      title: { type: 'string', default: '' },
      subtitle: { type: 'string', default: '' },
      text: { type: 'string', default: '' },
      content: { type: 'any', default: null },
      icon: { type: ['string', 'object'], default: null },
      badge: { type: 'any', default: null },
      open: { type: 'boolean', default: false },
      disabled: { type: 'boolean', default: false },
      name: { type: 'string', default: '' },
      // An accordion
      items: { type: 'array', default: [] },
      multiple: { type: 'boolean', default: false },
      // false keeps one section open in a group: the open one cannot be closed.
      collapsible: { type: 'boolean', default: true },
      stateKey: { type: 'string', default: '' },
      // Both
      variant: { type: 'string', default: 'outlined', allowedValues: VARIANTS },
      size: { type: 'string', default: 'md', allowedValues: SIZE_VALUES },
      marker: { type: 'string', default: 'chevron', allowedValues: MARKERS },
      onToggle: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-details');
      this.$list = this.querySelector('.slice-details__list');

      this._uid = ++uid;
      this._title = '';
      this._subtitle = '';
      this._text = '';
      this._content = null;
      this._icon = null;
      this._badge = null;
      this._open = false;
      this._disabled = false;
      this._name = '';
      this._items = [];
      this._multiple = false;
      this._collapsible = true;
      this._stateKey = '';
      this._variant = 'outlined';
      this._size = 'md';
      this._marker = 'chevron';
      this._onToggle = null;
      this._extra = [];          // nodes added with addDetail()

      this._ready = false;
      this._panels = new Map();  // id -> panel
      this._token = 0;

      this._handleKeydown = this._handleKeydown.bind(this);
      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this._ready = true;
      this.$list.addEventListener('keydown', this._handleKeydown);
      this._applyLooks();
      this._joinGroup();
      await this._render();
   }

   beforeDestroy() {
      this._ready = false;
      this._token++;
      this._leaveGroup();
      this.$list.removeEventListener('keydown', this._handleKeydown);
      for (const panel of this._panels.values()) this._disposePanel(panel);
      this._panels.clear();
   }

   // ── Props: one section ─────────────────────────────────────────

   get title() { return this._title; }
   set title(value) { this._title = value == null ? '' : String(value); this._refreshSingle(); }

   get subtitle() { return this._subtitle; }
   set subtitle(value) { this._subtitle = value == null ? '' : String(value); this._refreshSingle(); }

   get text() { return this._text; }
   set text(value) { this._text = value == null ? '' : String(value); this._refreshSingle(true); }

   get content() { return this._content; }
   set content(value) { this._content = value ?? null; this._refreshSingle(true); }

   get icon() { return this._icon; }
   set icon(value) { this._icon = value || null; this._refreshSingle(); }

   get badge() { return this._badge; }
   set badge(value) { this._badge = value === '' || value === false ? null : value ?? null; this._refreshSingle(); }

   get open() { return this._isSingle() ? this._panels.get(SINGLE_ID)?.open ?? this._open : this._open; }
   set open(value) {
      this._open = value === true;
      if (this._ready && this._isSingle()) this._setOpen(SINGLE_ID, this._open);
   }

   get disabled() { return this._disabled; }
   set disabled(value) { this._disabled = value === true; this._refreshSingle(); }

   get name() { return this._name; }
   set name(value) {
      if (this._ready) this._leaveGroup();
      this._name = value ? String(value) : '';
      if (this._ready) this._joinGroup();
   }

   // ── Props: an accordion ────────────────────────────────────────

   get items() { return this._items; }
   set items(value) { this._items = Array.isArray(value) ? value.filter(Boolean) : []; this._ready && this._render(); }

   get multiple() { return this._multiple; }
   set multiple(value) { this._multiple = value === true; }

   get collapsible() { return this._collapsible; }
   set collapsible(value) { this._collapsible = value !== false; }

   get stateKey() { return this._stateKey; }
   set stateKey(value) { this._stateKey = value ? String(value) : ''; }

   // ── Props: looks ───────────────────────────────────────────────

   get variant() { return this._variant; }
   set variant(value) {
      this._variant = VARIANTS.includes(value) ? value : 'outlined';
      for (const v of VARIANTS) this.classList.remove(`slice-details--${v}`);
      this.classList.add(`slice-details--${this._variant}`);
   }

   get size() { return this._size; }
   set size(value) { this._size = applySize(this, value, 'md'); }

   get marker() { return this._marker; }
   set marker(value) {
      this._marker = MARKERS.includes(value) ? value : 'chevron';
      this.dataset.marker = this._marker;
   }

   get onToggle() { return this._onToggle; }
   set onToggle(value) { this._onToggle = typeof value === 'function' ? value : null; }

   /** The ids of the open sections. */
   get openIds() {
      return [...this._panels.values()].filter((p) => p.open).map((p) => p.id);
   }

   // ── Methods ────────────────────────────────────────────────────

   /** Open a section (the only one, when there is just one). */
   show(id = this._firstId()) { return this._setOpen(id, true); }

   /** Close a section. */
   hide(id = this._firstId()) { return this._setOpen(id, false); }

   /** Open or close a section. */
   toggle(id = this._firstId()) {
      const panel = this._panels.get(id);
      return panel ? this._setOpen(id, !panel.open) : Promise.resolve();
   }

   /** Open every section. Only with `multiple`, or there is one section. */
   showAll() {
      if (!this._multiple && this._panels.size > 1) return Promise.resolve();
      return Promise.all([...this._panels.keys()].map((id) => this._setOpen(id, true)));
   }

   /** Close every section. */
   hideAll() {
      return Promise.all([...this._panels.keys()].map((id) => this._setOpen(id, false, { force: true })));
   }

   /** The content wrapper of a section, to add to or read from. */
   getPanel(id = this._firstId()) {
      return this._panels.get(id)?.$inner || null;
   }

   /** Kept for older code: appends a node to the section's content. */
   addDetail(node) {
      if (!(node instanceof Node)) {
         console.warn('[Details] addDetail(node) needs a DOM node.');
         return;
      }
      this._extra.push(node);
      const panel = this._panels.get(SINGLE_ID);
      if (panel?.loaded) panel.$inner.appendChild(node);
   }

   // ── Rendering ──────────────────────────────────────────────────

   _isSingle() {
      return this._items.length === 0;
   }

   _firstId() {
      return this._panels.keys().next().value;
   }

   _applyLooks() {
      if (!this.classList.contains(`slice-details--${this._variant}`)) this.variant = this._variant;
      if (!this.dataset.size) this.size = this._size;
      this.marker = this._marker;
   }

   _specs() {
      if (!this._isSingle()) {
         return this._items.map((item, i) => ({ ...item, id: item.id != null ? String(item.id) : `item-${i}` }));
      }
      return [{
         id: SINGLE_ID,
         title: this._title,
         subtitle: this._subtitle,
         text: this._text,
         content: this._content,
         icon: this._icon,
         badge: this._badge,
         open: this._open,
         disabled: this._disabled,
      }];
   }

   async _render() {
      const token = ++this._token;
      const specs = this._specs();
      const remembered = this._readState();
      const keep = new Set();
      const nodes = [];
      let openSeen = false;

      for (const spec of specs) {
         let panel = this._panels.get(spec.id);
         // A section whose content is the same thing keeps its body, and
         // whatever was typed or opened inside it.
         if (panel && (panel.spec.content !== spec.content || panel.spec.text !== spec.text)) {
            this._disposePanel(panel);
            this._panels.delete(spec.id);
            panel = null;
         }
         if (!panel) {
            panel = this._createPanel(spec);
            this._panels.set(spec.id, panel);
            let open = remembered ? remembered.includes(spec.id) : spec.open === true;
            if (open && !this._multiple && !this._isSingle()) {
               if (openSeen) open = false;
               openSeen = true;
            }
            if (open) this._openNow(panel);
         } else {
            panel.spec = spec;
            if (panel.open && !this._multiple) openSeen = true;
         }
         await this._renderHeader(panel, token);
         if (token !== this._token) return;
         keep.add(spec.id);
         nodes.push(panel.$details);
      }

      for (const [id, panel] of this._panels) {
         if (!keep.has(id)) {
            this._disposePanel(panel);
            this._panels.delete(id);
         }
      }
      // A group that may not close must start with one section open.
      if (!this._collapsible && !this._isSingle() && !this.openIds.length) {
         const first = [...this._panels.values()].find((p) => !p.spec.disabled);
         if (first) this._openNow(first);
      }
      this.$list.replaceChildren(...nodes);
      this.classList.toggle('slice-details--group', !this._isSingle());
   }

   _refreshSingle(contentChanged = false) {
      if (!this._ready || !this._isSingle()) return;
      if (contentChanged) {
         const panel = this._panels.get(SINGLE_ID);
         // Text and content render in place, so the section keeps its state.
         if (panel) {
            panel.spec = this._specs()[0];
            if (panel.loaded) this._fillBody(panel);
            return;
         }
      }
      this._render();
   }

   _createPanel(spec) {
      const id = `slice-details-${this._uid}-${String(spec.id).replace(/[^\w-]/g, '_')}`;
      const $details = document.createElement('details');
      $details.className = 'slice-details__item';
      const $summary = document.createElement('summary');
      $summary.className = 'slice-details__summary';
      $summary.id = `${id}-summary`;
      $summary.innerHTML = `<span class="slice-details__icon" hidden></span>
         <span class="slice-details__heading"><span class="slice-details__title"></span><span class="slice-details__subtitle" hidden></span></span>
         <span class="slice-details__badge" hidden></span>
         <span class="slice-details__marker" aria-hidden="true">${CHEVRON}</span>`;
      const $body = document.createElement('div');
      $body.className = 'slice-details__body';
      $body.id = `${id}-body`;
      $body.setAttribute('role', 'region');
      $body.setAttribute('aria-labelledby', $summary.id);
      const $inner = document.createElement('div');
      $inner.className = 'slice-details__inner';
      $body.appendChild($inner);
      $details.append($summary, $body);

      const panel = {
         id: spec.id, spec, open: false, loaded: false, loading: null,
         $details, $summary, $body, $inner,
         $icon: $summary.querySelector('.slice-details__icon'),
         $title: $summary.querySelector('.slice-details__title'),
         $subtitle: $summary.querySelector('.slice-details__subtitle'),
         $badge: $summary.querySelector('.slice-details__badge'),
         contentNodes: [], built: { icon: null, badge: null, iconKey: '', badgeKey: '' },
         animation: null,
      };
      panel.onClick = (event) => this._handleSummaryClick(event, panel);
      panel.onToggle = () => this._handleNativeToggle(panel);
      $summary.addEventListener('click', panel.onClick);
      $details.addEventListener('toggle', panel.onToggle);
      return panel;
   }

   async _renderHeader(panel, token) {
      const { spec } = panel;
      panel.$title.textContent = spec.title || '';
      panel.$subtitle.textContent = spec.subtitle || '';
      panel.$subtitle.hidden = !spec.subtitle;
      const disabled = spec.disabled === true;
      panel.$details.classList.toggle('is-disabled', disabled);
      if (disabled) {
         panel.$summary.setAttribute('aria-disabled', 'true');
         panel.$summary.tabIndex = -1;
      } else {
         panel.$summary.removeAttribute('aria-disabled');
         panel.$summary.removeAttribute('tabindex');
      }

      // Icon and badge are components: rebuild only when they change.
      const iconName = typeof spec.icon === 'string' ? spec.icon : spec.icon?.name || '';
      const iconKey = JSON.stringify(spec.icon || null);
      if (iconKey !== panel.built.iconKey) {
         panel.built.iconKey = iconKey;
         this._destroy(panel.built.icon);
         panel.built.icon = null;
         panel.$icon.hidden = !iconName;
         if (iconName) {
            const options = typeof spec.icon === 'object' ? spec.icon : {};
            const icon = await slice.build('Icon', { name: iconName, size: options.size || '20px', color: options.color || 'currentColor' });
            if (token !== this._token || !this._ready || panel.built.iconKey !== iconKey) {
               this._destroy(icon);
               return;
            }
            panel.built.icon = icon;
            if (icon) panel.$icon.replaceChildren(icon);
         }
      }

      const badgeProps = this._badgeProps(spec.badge);
      const badgeKey = JSON.stringify(badgeProps);
      if (badgeKey !== panel.built.badgeKey) {
         panel.built.badgeKey = badgeKey;
         this._destroy(panel.built.badge);
         panel.built.badge = null;
         panel.$badge.hidden = !badgeProps;
         if (badgeProps) {
            const badge = await slice.build('Badge', badgeProps);
            if (token !== this._token || !this._ready || panel.built.badgeKey !== badgeKey) {
               this._destroy(badge);
               return;
            }
            panel.built.badge = badge;
            if (badge) panel.$badge.replaceChildren(badge);
         }
      }
   }

   _badgeProps(value) {
      if (value === null || value === undefined || value === '' || value === false) return null;
      if (typeof value === 'number') return { value, tone: 'neutral' };
      if (typeof value === 'string') return { label: value, tone: 'neutral' };
      if (typeof value === 'object') {
         // `variant` used to carry the meaning; Badge now calls it `tone`.
         const { variant, ...rest } = value;
         const tone = BADGE_VARIANTS.includes(value.tone) ? value.tone : BADGE_VARIANTS.includes(variant) ? variant : 'neutral';
         return { ...rest, tone, ...(variant && !BADGE_VARIANTS.includes(variant) ? { variant } : {}) };
      }
      return null;
   }

   // Content renders the first time a section opens, so a closed section that
   // holds a Table or a request costs nothing until someone looks.
   async _load(panel) {
      if (panel.loaded) return;
      if (panel.loading) return panel.loading;
      panel.loading = (async () => {
         await this._fillBody(panel);
         panel.loaded = true;
         panel.loading = null;
      })();
      return panel.loading;
   }

   async _fillBody(panel) {
      const { spec } = panel;
      let content = spec.content;
      if (typeof content === 'function') {
         panel.$inner.replaceChildren(this._shimmer());
         panel.$details.setAttribute('aria-busy', 'true');
         try {
            content = await content({ id: spec.id, item: spec, details: this });
         } catch (error) {
            console.warn('[Details] content function failed', error);
            content = null;
         }
         panel.$details.removeAttribute('aria-busy');
         if (!this._ready || this._panels.get(spec.id) !== panel) {
            this._destroyList(Array.isArray(content) ? content : [content]);
            return;
         }
      }
      const list = [];
      if (spec.text) list.push(spec.text);
      for (const item of Array.isArray(content) ? content : [content]) {
         if (item !== null && item !== undefined && item !== false && item !== '') list.push(item);
      }
      if (spec.id === SINGLE_ID) list.push(...this._extra);
      const nodes = list.map((item) => {
         if (item instanceof Node) return item;
         const p = document.createElement('p');
         p.className = 'slice-details__text';
         p.textContent = String(item);
         return p;
      });
      this._destroyList(panel.contentNodes.filter((n) => !nodes.includes(n)));
      panel.$inner.replaceChildren(...nodes);
      panel.contentNodes = nodes;
   }

   _shimmer() {
      const box = document.createElement('div');
      box.className = 'slice-details__shimmer';
      box.innerHTML = '<span></span><span></span><span></span>';
      return box;
   }

   // ── Opening and closing ────────────────────────────────────────

   _openNow(panel) {
      panel.open = true;
      panel.$details.open = true;
      this._load(panel);
   }

   async _setOpen(id, open, { force = false, animate = true } = {}) {
      const panel = this._panels.get(id);
      if (!panel || panel.open === open) return;
      if (!open && !force && !this._collapsible && !this._isSingle()) return;
      if (open) {
         panel.open = true;
         panel.$details.open = true;
         this._closeSiblings(panel);
         const loading = this._load(panel);
         this._afterToggle(panel);
         if (animate) await this._animate(panel, true);
         await loading;
      } else {
         panel.open = false;
         this._afterToggle(panel);
         if (animate) await this._animate(panel, false);
         // Opened again while closing: leave it open.
         if (!panel.open) panel.$details.open = false;
      }
   }

   _closeSiblings(panel) {
      if (this._multiple) return;
      for (const other of this._panels.values()) {
         if (other !== panel && other.open) this._setOpen(other.id, false, { force: true });
      }
      if (this._isSingle() && this._name) {
         for (const other of groups.get(this._name) || []) {
            if (other !== this && other.open) other.hide();
         }
      }
   }

   _afterToggle(panel) {
      if (this._isSingle()) this._open = panel.open;
      this._writeState();
      const detail = { id: panel.id, open: panel.open, item: this._isSingle() ? null : panel.spec };
      if (this._isSingle()) this._onToggle?.(panel.open, { details: this });
      else this._onToggle?.(panel.id, panel.open, { item: panel.spec, details: this });
      this.dispatchEvent(new CustomEvent('details-toggle', { bubbles: true, detail }));
   }

   _animate(panel, opening) {
      panel.animation?.cancel();
      const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce || typeof panel.$body.animate !== 'function') return Promise.resolve();
      const full = panel.$body.scrollHeight;
      const from = opening ? 0 : panel.$body.getBoundingClientRect().height;
      const to = opening ? full : 0;
      panel.$details.classList.add('is-animating');
      const animation = panel.$body.animate(
         [{ height: `${from}px`, opacity: opening ? 0 : 1 }, { height: `${to}px`, opacity: opening ? 1 : 0 }],
         { duration: Math.min(320, 160 + full / 6), easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
      panel.animation = animation;
      return animation.finished.catch(() => {}).finally(() => {
         if (panel.animation === animation) {
            panel.animation = null;
            panel.$details.classList.remove('is-animating');
         }
      });
   }

   _handleSummaryClick(event, panel) {
      // The summary would toggle <details> at once; take over to animate it.
      event.preventDefault();
      if (panel.spec.disabled) return;
      this._setOpen(panel.id, !panel.open);
   }

   // The browser opened or closed a section by itself (find-in-page landing
   // on hidden text, or code setting `open` on the element): follow it.
   _handleNativeToggle(panel) {
      const open = panel.$details.open;
      if (open === panel.open || panel.$details.classList.contains('is-animating')) return;
      if (open) {
         panel.open = true;
         this._closeSiblings(panel);
         this._load(panel);
         this._afterToggle(panel);
      } else {
         panel.open = false;
         this._afterToggle(panel);
      }
   }

   // Arrow keys move between the summaries of a group (WAI-ARIA accordion).
   _handleKeydown(event) {
      const summary = event.target.closest?.('.slice-details__summary');
      if (!summary || summary.closest('slice-details') !== this) return;
      const all = [...this._panels.values()].filter((p) => !p.spec.disabled).map((p) => p.$summary);
      const index = all.indexOf(summary);
      if (index === -1) return;
      let next = null;
      if (event.key === 'ArrowDown') next = all[(index + 1) % all.length];
      else if (event.key === 'ArrowUp') next = all[(index - 1 + all.length) % all.length];
      else if (event.key === 'Home') next = all[0];
      else if (event.key === 'End') next = all[all.length - 1];
      if (!next) return;
      event.preventDefault();
      next.focus();
   }

   // ── State ──────────────────────────────────────────────────────

   _readState() {
      if (!this._stateKey) return null;
      try {
         const raw = localStorage.getItem(`slice-details:${this._stateKey}`);
         return raw ? JSON.parse(raw) : null;
      } catch {
         return null;
      }
   }

   _writeState() {
      if (!this._stateKey) return;
      try {
         localStorage.setItem(`slice-details:${this._stateKey}`, JSON.stringify(this.openIds));
      } catch { /* storage unavailable */ }
   }

   _joinGroup() {
      if (!this._name) return;
      if (!groups.has(this._name)) groups.set(this._name, new Set());
      groups.get(this._name).add(this);
   }

   _leaveGroup() {
      const set = this._name && groups.get(this._name);
      if (!set) return;
      set.delete(this);
      if (!set.size) groups.delete(this._name);
   }

   // ── Cleanup ────────────────────────────────────────────────────

   _disposePanel(panel) {
      panel.animation?.cancel();
      panel.$summary.removeEventListener('click', panel.onClick);
      panel.$details.removeEventListener('toggle', panel.onToggle);
      this._destroy(panel.built.icon);
      this._destroy(panel.built.badge);
      this._destroyList(panel.contentNodes);
      panel.contentNodes = [];
      panel.$details.remove();
   }

   _destroy(node) {
      if (node?.sliceId) slice.controller.destroyComponent(node);
   }

   _destroyList(nodes) {
      for (const node of nodes) {
         if (!(node instanceof Node)) continue;
         if (node.sliceId) slice.controller.destroyComponent(node);
         else if (node instanceof Element) slice.controller.destroyByContainer(node);
         node.remove?.();
      }
   }
}

customElements.define('slice-details', Details);