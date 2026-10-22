// DropDown — a menu button: a trigger and a menu of links, actions, toggles and
// submenus, nested as deep as you like.
//
// ITEMS. One vocabulary for every level (the same one Table's menus speak):
//
//   'separator'                                   a divider
//   { type: 'label', label }                      a small group heading
//   { label, href | path }                        a link (`path` goes through slice.router)
//   { label, onClick(ctx) }                       an action (`callback` is the legacy name)
//   { label, checked }                            a checkbox item (toggles `checked`)
//   { type: 'radio', label, group, checked }      a radio item (one per group)
//   { label, items: [...] | () => items }         a submenu; the function form can be
//                                                 async, for menus loaded on demand
//   { render(ctx) }                               anything: return a node
//
// Optional on any item: icon (Icon name or Node), description, shortcut,
// danger, disabled, hidden (booleans or `(item) => boolean`), keepOpen, value.
// `text` and `options` are accepted as old names of `label` and `items`.
//
// LAYERING. Every menu panel is a `popover="manual"` element. Shown, it lives in
// the browser's top layer: no ancestor's `overflow: hidden` clips it (a Navbar
// menu scrolls sideways, a Card hides its overflow) and no `transform` (a
// sliding mobile nav) displaces it, while it stays a DOM child of this element,
// so the scoped CSS and `this.contains()` still work. Browsers without the
// Popover API fall back to `position: fixed` with a high z-index.
//
// NARROW SCREENS. A submenu that fits on neither side of its parent (a phone,
// or the fifth level on a laptop) opens STACKED: on top of its parent, with a
// "‹ Back" row, the way native apps drill down. Hover never opens a stacked
// submenu; a tap, a click or the keyboard does.
//
// KEYBOARD (WAI-ARIA menu button): Enter, Space or ArrowDown open on the first
// item, ArrowUp on the last; arrows, Home/End and typing a letter move; Enter,
// Space or ArrowRight open a submenu; ArrowLeft or Escape close one level;
// Tab closes everything.
//
// The enumerated props are LITERAL arrays inside `static props`, and the setters
// read them back from `DropDown.props` (COMPONENT_API_STANDARDS.md §10).

let _sliceDropDownSeq = 0;

// Hover intent, in ms: long enough that crossing an item on the way to a
// submenu does not slam it shut, short enough to feel immediate.
const SUBMENU_OPEN_DELAY = 90;
const SUBMENU_CLOSE_DELAY = 260;
const HOVER_OPEN_DELAY = 60;
const HOVER_CLOSE_DELAY = 240;
// Space kept between a panel and the viewport edge, and between the trigger and
// its menu.
const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 6;
// The narrowest a panel gets (keep in sync with min-width in DropDown.css).
const PANEL_MIN_WIDTH = 190;

export default class DropDown extends HTMLElement {

   static props = {
      // Trigger text. Empty is fine with an `icon` (give `ariaLabel` then).
      label: {
         type: 'string',
         default: '',
         required: false
      },
      // The menu. See the vocabulary at the top of this file.
      items: {
         type: 'array',
         default: [],
         required: false
      },
      // Old name of `items` (used when `items` is empty). Old option shapes
      // ({ text, href | path | callback }) keep working.
      options: {
         type: 'array',
         default: [],
         required: false
      },
      // Trigger style. `outlined` is the original look; `plain` is a bare,
      // text-coloured trigger for navigation bars.
      variant: {
         type: 'string',
         default: 'outlined',
         required: false,
         allowedValues: ['outlined', 'filled', 'soft', 'ghost', 'plain']
      },
      size: {
         type: 'string',
         default: 'md',
         required: false,
         allowedValues: ['sm', 'md', 'lg']
      },
      // An Icon name (or a Node) before the label.
      icon: {
         type: 'string',
         default: null,
         required: false
      },
      // The chevron after the label.
      caret: {
         type: 'boolean',
         default: true,
         required: false
      },
      // Accessible name for an icon-only trigger.
      ariaLabel: {
         type: 'string',
         default: null,
         required: false
      },
      // 'hover' also opens on pointer hover (mouse only: touch still taps),
      // the usual behaviour in a navigation bar. Click and keyboard always work.
      trigger: {
         type: 'string',
         default: 'click',
         required: false,
         allowedValues: ['click', 'hover']
      },
      // Where the menu prefers to open. It flips to the other side when that
      // one has no room, and never leaves the viewport.
      placement: {
         type: 'string',
         default: 'bottom-end',
         required: false,
         allowedValues: ['bottom-start', 'bottom-end', 'top-start', 'top-end']
      },
      disabled: {
         type: 'boolean',
         default: false,
         required: false
      },
      // Pick an item → the menu closes. Toggles (checkbox, radio) and items
      // with `keepOpen: true` always keep it open.
      closeOnSelect: {
         type: 'boolean',
         default: true,
         required: false
      },
      // `(item, ctx) => void` for every link, action or toggle picked, at any depth.
      onSelect: {
         type: 'function',
         default: null,
         required: false
      },
      // `(open) => void` when the menu opens or closes.
      onOpenChange: {
         type: 'function',
         default: null,
         required: false
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$trigger = this.querySelector('.slice_dropdown');
      this.$icon = this.querySelector('.slice_dropdown_icon');
      this.$label = this.querySelector('.slice_dropdown_label');
      this.$caret = this.querySelector('.slice_dropdown_caret');
      this.$box = this.querySelector('.slice_dropbox');

      this._uid = `slice-dropdown-${++_sliceDropDownSeq}`;
      this._panelSeq = 0;
      this.$trigger.id = `${this._uid}-trigger`;
      this.$box.id = `${this._uid}-menu`;
      this.$trigger.setAttribute('aria-controls', this.$box.id);
      this.$box.setAttribute('aria-labelledby', this.$trigger.id);

      this._items = [];
      this._options = [];
      this._levels = [];        // open panels, root first: { panel, entries, item }
      this._open = false;
      this._openToken = 0;
      this._iconToken = 0;
      this._hoverTimer = 0;
      this._hoverAction = null;
      this._typeahead = '';
      this._typeaheadTimer = 0;
      this._frame = 0;
      this._onSelect = null;
      this._onOpenChange = null;

      for (const name of [
         '_handleTriggerClick', '_handleTriggerKeydown', '_handleTriggerPointerEnter',
         '_handleHostPointerEnter', '_handleHostPointerLeave', '_handlePanelClick',
         '_handlePanelKeydown', '_handlePanelPointerOver', '_handleFocusOut',
         '_handleOutsidePointer', '_handleViewportChange'
      ]) {
         this[name] = this[name].bind(this);
      }

      this.$trigger.addEventListener('click', this._handleTriggerClick);
      this.$trigger.addEventListener('keydown', this._handleTriggerKeydown);
      this.$trigger.addEventListener('pointerenter', this._handleTriggerPointerEnter);
      this.addEventListener('pointerenter', this._handleHostPointerEnter);
      this.addEventListener('pointerleave', this._handleHostPointerLeave);
      this.addEventListener('focusout', this._handleFocusOut);
      this._wirePanel(this.$box);

      slice.controller.setComponentProps(this, props);
   }

   init() {
      // Defaults the framework did not run a setter for.
      if (this._variant === undefined) this.variant = DropDown.props.variant.default;
      if (this._size === undefined) this.size = DropDown.props.size.default;
      if (this._caret === undefined) this.caret = true;
      if (this._placement === undefined) this.placement = DropDown.props.placement.default;
      if (this._trigger === undefined) this.trigger = DropDown.props.trigger.default;
   }

   beforeDestroy() {
      this._closeAll(false, false);
      clearTimeout(this._hoverTimer);
      clearTimeout(this._typeaheadTimer);
      if (this._frame) cancelAnimationFrame(this._frame);
      // Installed only while open; removed again here in case (§9).
      this._toggleDocumentListeners(false);
      slice.controller.destroyByContainer(this.$icon);
   }

   // ------------------------------------------------------------------ props

   get label() { return this._label; }
   set label(value) {
      this._label = value === null || value === undefined ? '' : String(value);
      this.$label.textContent = this._label;
      this.$label.hidden = this._label === '';
      this._syncTriggerName();
   }

   get items() { return this._items; }
   set items(value) {
      this._items = Array.isArray(value) ? value : [];
      if (this._open) this._refreshOpen();
   }

   get options() { return this._options; }
   set options(value) {
      this._options = Array.isArray(value) ? value : [];
      if (this._open) this._refreshOpen();
   }

   get variant() { return this._variant; }
   set variant(value) {
      const { allowedValues, default: fallback } = DropDown.props.variant;
      const next = allowedValues.includes(value) ? value : fallback;
      for (const option of allowedValues) this.$trigger.classList.remove(`slice_dropdown--${option}`);
      this.$trigger.classList.add(`slice_dropdown--${next}`);
      this._variant = next;
   }

   get size() { return this._size; }
   set size(value) {
      const { allowedValues, default: fallback } = DropDown.props.size;
      this._size = allowedValues.includes(value) ? value : fallback;
      // DropDown.css reads data-size (sm / md / lg) off the host.
      this.dataset.size = this._size;
   }

   get icon() { return this._iconValue; }
   set icon(value) {
      this._iconValue = value ?? null;
      const token = ++this._iconToken;
      slice.controller.destroyByContainer(this.$icon);
      this.$icon.replaceChildren();
      this.$icon.hidden = !value;
      this.classList.toggle('slice_dropdown--has-icon', !!value);
      if (!value) return;
      this._makeIcon(value).then((node) => {
         if (token !== this._iconToken || !node) return;
         this.$icon.appendChild(node);
      });
   }

   get caret() { return this._caret; }
   set caret(value) {
      this._caret = value !== false;
      this.$caret.hidden = !this._caret;
   }

   get ariaLabel() { return this._ariaLabel; }
   set ariaLabel(value) {
      this._ariaLabel = value ? String(value) : null;
      this._syncTriggerName();
   }

   get trigger() { return this._trigger; }
   set trigger(value) {
      const { allowedValues, default: fallback } = DropDown.props.trigger;
      this._trigger = allowedValues.includes(value) ? value : fallback;
   }

   get placement() { return this._placement; }
   set placement(value) {
      const { allowedValues, default: fallback } = DropDown.props.placement;
      this._placement = allowedValues.includes(value) ? value : fallback;
      if (this._open) this._schedulePosition();
   }

   get disabled() { return this._disabled; }
   set disabled(value) {
      this._disabled = value === true;
      this.$trigger.disabled = this._disabled;
      this.classList.toggle('slice_dropdown--disabled', this._disabled);
      if (this._disabled) this._closeAll(false);
   }

   get closeOnSelect() { return this._closeOnSelect !== false; }
   set closeOnSelect(value) { this._closeOnSelect = value !== false; }

   get onSelect() { return this._onSelect; }
   set onSelect(value) { this._onSelect = typeof value === 'function' ? value : null; }

   get onOpenChange() { return this._onOpenChange; }
   set onOpenChange(value) { this._onOpenChange = typeof value === 'function' ? value : null; }

   /** Whether the menu is open. */
   get isOpen() { return this._open; }

   // ------------------------------------------------------------- public API

   /** Open the menu. `focus`: 'first' | 'last' | 'menu' (default) | 'none'. */
   async open({ focus = 'menu' } = {}) {
      if (this._disabled || this._open) return;
      const token = ++this._openToken;
      const entries = this._entries(this._rootItems());
      await this._renderPanel(this.$box, entries, 0);
      if (token !== this._openToken) return;
      this._levels = [{ panel: this.$box, entries, item: null }];
      this._open = true;
      this.$trigger.setAttribute('aria-expanded', 'true');
      this.classList.add('slice_dropdown--open');
      this.$box.classList.add('slice_dropbox_open');
      this.style.setProperty('--slice-dropdown-anchor-width', `${Math.round(this.$trigger.getBoundingClientRect().width)}px`);
      this._showPanel(this.$box);
      this._positionLevel(0);
      this._toggleDocumentListeners(true);
      this._focusIn(0, focus);
      if (this._onOpenChange) this._onOpenChange(true);
   }

   /** Close the menu (and every submenu). Focus returns to the trigger. */
   close() {
      this._closeAll(true);
   }

   /** Open when closed, close when open. */
   toggle(options) {
      if (this._open) this.close();
      else this.open(options);
   }

   // Old names.
   toggleDrop() { this.toggle(); }
   closeDrop() { this._closeAll(false); }

   // ------------------------------------------------------------ the entries

   _rootItems() {
      return this._items.length > 0 ? this._items : this._options;
   }

   // Normalise consumer items into entries. Hidden items are dropped here, and
   // separators are tidied: none leading, trailing or doubled.
   _entries(items) {
      const entries = [];
      const flag = (value, item) => (typeof value === 'function' ? value(item) === true : value === true);
      for (const item of Array.isArray(items) ? items : []) {
         if (item === null || item === undefined || item === false) continue;
         if (item === 'separator' || item?.type === 'separator') {
            entries.push({ kind: 'separator' });
            continue;
         }
         if (typeof item === 'string' || typeof item === 'number') {
            entries.push({ kind: 'action', item: { label: String(item) }, label: String(item) });
            continue;
         }
         if (typeof item !== 'object') continue;
         if (flag(item.hidden, item)) continue;
         if (item.type === 'label') {
            entries.push({ kind: 'label', item, label: String(item.label ?? item.text ?? '') });
            continue;
         }
         if (typeof item.render === 'function') {
            entries.push({ kind: 'custom', item });
            continue;
         }
         const children = item.items ?? item.children ?? item.options;
         let kind = 'action';
         if (Array.isArray(children) || typeof children === 'function') kind = 'submenu';
         else if (item.type === 'radio') kind = 'radio';
         else if (item.checked !== undefined) kind = 'checkbox';
         else if (item.href || item.path) kind = 'link';
         entries.push({
            kind,
            item,
            label: String(item.label ?? item.text ?? ''),
            children: kind === 'submenu' ? children : null,
            disabled: flag(item.disabled, item),
            checked: kind === 'checkbox' || kind === 'radio' ? flag(item.checked, item) : undefined
         });
      }
      return entries.filter((entry, i, all) => entry.kind !== 'separator' ||
         (i > 0 && i < all.length - 1 && all[i - 1].kind !== 'separator'));
   }

   _ctx(entry, event = null) {
      return {
         item: entry.item,
         value: entry.item?.value,
         dropdown: this,
         event,
         close: () => this._closeAll(true)
      };
   }

   // ------------------------------------------------------------ the panels

   _wirePanel(panel) {
      panel.addEventListener('click', this._handlePanelClick);
      panel.addEventListener('keydown', this._handlePanelKeydown);
      panel.addEventListener('pointerover', this._handlePanelPointerOver);
   }

   _newSubPanel(parentButton) {
      const panel = document.createElement('div');
      panel.className = 'slice_dropbox slice_dropbox--sub';
      panel.id = `${this._uid}-sub-${++this._panelSeq}`;
      panel.setAttribute('role', 'menu');
      panel.setAttribute('tabindex', '-1');
      panel.setAttribute('popover', 'manual');
      panel.setAttribute('aria-labelledby', parentButton.id);
      this._wirePanel(panel);
      this.appendChild(panel);
      return panel;
   }

   async _renderPanel(panel, entries, level) {
      slice.controller.destroyByContainer(panel);
      panel.dataset.level = String(level);
      const hasIcons = entries.some((entry) => entry.item?.icon);
      const hasChecks = entries.some((entry) => entry.kind === 'checkbox' || entry.kind === 'radio');
      panel.classList.toggle('slice_dropbox--icons', hasIcons);
      panel.classList.toggle('slice_dropbox--checks', hasChecks);

      const nodes = await Promise.all(entries.map((entry, index) => this._renderEntry(entry, index, level, hasChecks)));
      if (entries.length === 0) {
         nodes.push(this._el('div', 'slice_dropdown_empty', { role: 'presentation', text: 'No options' }));
      }
      panel.replaceChildren(...nodes);
   }

   async _renderEntry(entry, index, level, hasChecks) {
      if (entry.kind === 'separator') return this._el('div', 'slice_dropdown_separator', { role: 'separator' });
      if (entry.kind === 'label') return this._el('div', 'slice_dropdown_group_label', { role: 'presentation', text: entry.label });
      if (entry.kind === 'custom') {
         const box = this._el('div', 'slice_dropdown_custom', { role: 'presentation' });
         const content = await entry.item.render(this._ctx(entry));
         if (content instanceof Node) box.appendChild(content);
         else if (content !== null && content !== undefined) box.textContent = String(content);
         return box;
      }

      const item = entry.item;
      // A real link stays a real link: middle-click and "open in new tab" work.
      const asLink = entry.kind === 'link' && !entry.disabled && !!item.href && typeof (item.onClick ?? item.callback) !== 'function';
      const node = asLink ? document.createElement('a') : document.createElement('button');
      if (asLink) {
         node.href = item.href;
         if (item.target) node.target = item.target;
         if (item.target === '_blank') node.rel = 'noopener noreferrer';
      } else {
         node.type = 'button';
      }
      node.className = 'slice_dropdown_item';
      if (item.danger === true) node.classList.add('slice_dropdown_item--danger');
      node.id = `${this._uid}-item-${level}-${index}-${++this._panelSeq}`;
      node.tabIndex = -1;
      node.dataset.index = String(index);
      node.setAttribute('role', entry.kind === 'checkbox' ? 'menuitemcheckbox' : entry.kind === 'radio' ? 'menuitemradio' : 'menuitem');
      if (entry.checked !== undefined) node.setAttribute('aria-checked', entry.checked ? 'true' : 'false');
      if (entry.disabled) node.setAttribute('aria-disabled', 'true');
      if (entry.kind === 'submenu') {
         node.classList.add('slice_dropdown_item--submenu');
         node.setAttribute('aria-haspopup', 'menu');
         node.setAttribute('aria-expanded', 'false');
      }

      if (entry.kind === 'checkbox' || entry.kind === 'radio') {
         node.appendChild(this._el('span', `slice_dropdown_check slice_dropdown_check--${entry.kind}`, { 'aria-hidden': 'true' }));
      } else if (hasChecks) {
         // Keeps the labels of a mixed panel in one column.
         node.appendChild(this._el('span', 'slice_dropdown_check', { 'aria-hidden': 'true' }));
      }

      if (item.icon) {
         const slot = this._el('span', 'slice_dropdown_item_icon', { 'aria-hidden': 'true' });
         const icon = await this._makeIcon(item.icon);
         if (icon) slot.appendChild(icon);
         node.appendChild(slot);
      } else {
         node.appendChild(this._el('span', 'slice_dropdown_item_icon slice_dropdown_item_icon--empty', { 'aria-hidden': 'true' }));
      }

      const text = this._el('span', 'slice_dropdown_item_text');
      text.appendChild(this._el('span', 'slice_dropdown_item_label', { text: entry.label }));
      if (item.description) text.appendChild(this._el('span', 'slice_dropdown_item_description', { text: String(item.description) }));
      node.appendChild(text);

      if (item.shortcut) node.appendChild(this._el('kbd', 'slice_dropdown_item_shortcut', { text: String(item.shortcut) }));
      if (item.badge !== undefined && item.badge !== null && item.badge !== '') {
         node.appendChild(this._el('span', 'slice_dropdown_item_badge', { text: String(item.badge) }));
      }
      if (entry.kind === 'submenu') node.appendChild(this._el('span', 'slice_dropdown_item_chevron', { 'aria-hidden': 'true' }));
      return node;
   }

   _backRow(label) {
      const row = this._el('button', 'slice_dropdown_item slice_dropdown_back', { type: 'button', role: 'menuitem', tabindex: '-1' });
      row.appendChild(this._el('span', 'slice_dropdown_back_chevron', { 'aria-hidden': 'true' }));
      row.appendChild(this._el('span', 'slice_dropdown_item_label', { text: label }));
      row.setAttribute('aria-label', `Back to ${label ? 'the previous menu' : 'menu'}`);
      return row;
   }

   // A submenu that fits on neither side of its parent panel opens on top of it.
   _wouldStack(level) {
      const parent = this._levels[level]?.panel;
      if (!parent) return false;
      const rect = this._box(parent);
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const rightRoom = vw - rect.right - VIEWPORT_MARGIN;
      const leftRoom = rect.left - VIEWPORT_MARGIN;
      return Math.max(rightRoom, leftRoom) < PANEL_MIN_WIDTH;
   }

   async _makeIcon(value) {
      if (value instanceof Node) return value.cloneNode(true);
      if (typeof value !== 'string' || value === '') return null;
      try {
         return await slice.build('Icon', { name: value, size: 'small' });
      } catch {
         return null;
      }
   }

   _el(tag, className, attrs = {}) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      for (const [name, value] of Object.entries(attrs)) {
         if (name === 'text') node.textContent = value;
         else node.setAttribute(name, value);
      }
      return node;
   }

   _showPanel(panel) {
      panel.classList.remove('is-open');
      if (typeof panel.showPopover === 'function') {
         try {
            if (!panel.matches(':popover-open')) panel.showPopover();
         } catch {
            panel.classList.add('slice_dropbox--fixed');
         }
      } else {
         panel.classList.add('slice_dropbox--fixed');
      }
      panel.classList.add('is-shown');
      // Next frame: let the closed styles apply first, so the entrance animates.
      requestAnimationFrame(() => {
         if (panel.classList.contains('is-shown')) panel.classList.add('is-open');
      });
   }

   _hidePanel(panel) {
      panel.classList.remove('is-open', 'is-shown', 'slice_dropbox_open');
      if (typeof panel.hidePopover === 'function') {
         try {
            if (panel.matches(':popover-open')) panel.hidePopover();
         } catch {
            /* already hidden */
         }
      }
   }

   // --------------------------------------------------------------- open / close

   async _openSubmenu(level, button, focus) {
      const parent = this._levels[level];
      if (!parent) return;
      const entry = parent.entries[Number(button.dataset.index)];
      if (!entry || entry.kind !== 'submenu' || entry.disabled) return;
      // Already open for this item: just move focus in.
      const current = this._levels[level + 1];
      if (current && current.button === button) {
         this._focusIn(level + 1, focus);
         return;
      }
      this._closeFrom(level + 1);

      const stacked = this._wouldStack(level);
      const panel = this._newSubPanel(button);
      panel.classList.toggle('slice_dropbox--stacked', stacked);
      const token = ++this._openToken;
      const record = { panel, entries: [], item: entry.item, button, token, stacked };
      this._levels[level + 1] = record;
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-controls', panel.id);

      let children = entry.children;
      if (typeof children === 'function') {
         // Loading on demand: show the panel with a placeholder at once.
         panel.replaceChildren(this._el('div', 'slice_dropdown_loading', { role: 'presentation', text: 'Loading…' }));
         if (stacked) panel.prepend(this._backRow(entry.label));
         this._showPanel(panel);
         this._positionLevel(level + 1);
         try {
            children = await children(entry.item);
         } catch (error) {
            console.error('DropDown: loading a submenu failed', error);
            children = [];
         }
         if (this._levels[level + 1] !== record) return;
      }
      const entries = this._entries(children);
      record.entries = entries;
      await this._renderPanel(panel, entries, level + 1);
      if (this._levels[level + 1] !== record) return;
      if (record.stacked) panel.prepend(this._backRow(entry.label));
      this._showPanel(panel);
      this._positionLevel(level + 1);
      this._focusIn(level + 1, focus);
   }

   // Close every level from `level` down (submenus are removed from the DOM).
   _closeFrom(level) {
      for (let i = this._levels.length - 1; i >= level; i--) {
         const record = this._levels[i];
         if (!record) continue;
         this._hidePanel(record.panel);
         slice.controller.destroyByContainer(record.panel);
         if (record.button) {
            record.button.setAttribute('aria-expanded', 'false');
            record.button.removeAttribute('aria-controls');
         }
         if (i > 0) record.panel.remove();
         else record.panel.replaceChildren();
      }
      this._levels.length = Math.min(this._levels.length, level);
   }

   _closeAll(focusTrigger, notify = true) {
      clearTimeout(this._hoverTimer);
      this._hoverAction = null;
      this._openToken++;
      if (!this._open) return;
      this._open = false;
      this._closeFrom(0);
      this._levels = [];
      this.$trigger.setAttribute('aria-expanded', 'false');
      this.classList.remove('slice_dropdown--open');
      this._toggleDocumentListeners(false);
      if (focusTrigger && this.$trigger.isConnected) this.$trigger.focus();
      if (notify && this._onOpenChange) this._onOpenChange(false);
   }

   // Items changed while open: redraw the root, drop the submenus.
   async _refreshOpen() {
      this._closeFrom(1);
      const entries = this._entries(this._rootItems());
      await this._renderPanel(this.$box, entries, 0);
      if (!this._open) return;
      this._levels = [{ panel: this.$box, entries, item: null }];
      this._positionLevel(0);
   }

   _toggleDocumentListeners(on) {
      const method = on ? 'addEventListener' : 'removeEventListener';
      document[method]('pointerdown', this._handleOutsidePointer, true);
      window[method]('resize', this._handleViewportChange);
      document[method]('scroll', this._handleViewportChange, true);
   }

   // ----------------------------------------------------------------- focus

   _focusables(level) {
      const record = this._levels[level];
      if (!record) return [];
      return [...record.panel.querySelectorAll(':scope > .slice_dropdown_item')]
         .filter((node) => node.getAttribute('aria-disabled') !== 'true');
   }

   _focusIn(level, focus) {
      const record = this._levels[level];
      if (!record || focus === 'none') return;
      const items = this._focusables(level);
      if (focus === 'first' && items[0]) items[0].focus({ preventScroll: true });
      else if (focus === 'last' && items.length > 0) items[items.length - 1].focus({ preventScroll: true });
      else record.panel.focus({ preventScroll: true });
   }

   _levelOf(node) {
      const panel = node?.closest?.('.slice_dropbox');
      if (!panel) return -1;
      return this._levels.findIndex((record) => record?.panel === panel);
   }

   _move(level, step, from) {
      const items = this._focusables(level);
      if (items.length === 0) return;
      const index = items.indexOf(from);
      let next;
      if (step === 'first') next = 0;
      else if (step === 'last') next = items.length - 1;
      else if (index === -1) next = step > 0 ? 0 : items.length - 1;
      else next = (index + step + items.length) % items.length;
      items[next].focus({ preventScroll: true });
      items[next].scrollIntoView({ block: 'nearest' });
   }

   _typeTo(level, char, from) {
      clearTimeout(this._typeaheadTimer);
      this._typeahead += char.toLowerCase();
      this._typeaheadTimer = window.setTimeout(() => { this._typeahead = ''; }, 500);
      const items = this._focusables(level);
      if (items.length === 0) return;
      const start = Math.max(0, items.indexOf(from));
      // A repeated single letter cycles through the items starting with it.
      const query = this._typeahead.length > 1 && new Set(this._typeahead).size === 1 ? this._typeahead[0] : this._typeahead;
      const offset = query.length === 1 ? 1 : 0;
      for (let i = 0; i < items.length; i++) {
         const candidate = items[(start + offset + i) % items.length];
         const text = candidate.querySelector('.slice_dropdown_item_label')?.textContent.trim().toLowerCase() ?? '';
         if (text.startsWith(query)) {
            candidate.focus({ preventScroll: true });
            return;
         }
      }
   }

   // ------------------------------------------------------------- activation

   async _activate(level, button, event, viaKeyboard) {
      if (button.classList.contains('slice_dropdown_back')) {
         event?.preventDefault();
         this._back(level);
         return;
      }
      const record = this._levels[level];
      const entry = record?.entries[Number(button.dataset.index)];
      if (!entry || entry.disabled) {
         event?.preventDefault();
         return;
      }
      if (entry.kind === 'submenu') {
         event?.preventDefault();
         await this._openSubmenu(level, button, viaKeyboard ? 'first' : 'menu');
         return;
      }

      const item = entry.item;
      const ctx = this._ctx(entry, event);
      const action = typeof item.onClick === 'function' ? item.onClick : typeof item.callback === 'function' ? item.callback : null;
      const toggle = entry.kind === 'checkbox' || entry.kind === 'radio';

      if (toggle) {
         event?.preventDefault();
         this._applyToggle(record, entry);
      }

      // An item with an action never navigates, even if it also has a path.
      if (action) {
         event?.preventDefault();
      } else if (entry.kind === 'link') {
         if (item.path && slice?.router?.navigate) {
            event?.preventDefault();
            this._closeAll(false);
            if (this._onSelect) this._onSelect(item, ctx);
            await slice.router.navigate(item.path);
            return;
         }
         // A plain href: the browser follows the <a> itself; close right after.
         if (this._onSelect) this._onSelect(item, ctx);
         window.setTimeout(() => this._closeAll(false), 0);
         return;
      }

      const keepOpen = toggle ? item.keepOpen !== false : item.keepOpen === true || !this.closeOnSelect;
      if (!keepOpen) this._closeAll(true);
      if (action) await action(ctx);
      if (this._onSelect) this._onSelect(item, ctx);
   }

   // Checkbox items flip `checked` on the item itself (unless it is a
   // function, which the consumer owns); radio items switch their group.
   _applyToggle(record, entry) {
      if (entry.kind === 'checkbox') {
         const next = !entry.checked;
         if (typeof entry.item.checked !== 'function') entry.item.checked = next;
         entry.checked = next;
      } else {
         const group = entry.item.group ?? null;
         for (const other of record.entries) {
            if (other.kind !== 'radio' || (other.item.group ?? null) !== group) continue;
            const on = other === entry;
            if (typeof other.item.checked !== 'function') other.item.checked = on;
            other.checked = on;
         }
      }
      record.entries.forEach((other, index) => {
         if (other.checked === undefined) return;
         const node = record.panel.querySelector(`:scope > .slice_dropdown_item[data-index="${index}"]`);
         if (node) node.setAttribute('aria-checked', other.checked ? 'true' : 'false');
      });
   }

   // ---------------------------------------------------------------- events

   _handleTriggerClick(event) {
      event.stopPropagation();
      if (this._disabled) return;
      // Enter and Space reach here as a click with detail 0: a keyboard user
      // lands on the first item, a pointer user on the menu itself.
      if (this._open) this._closeAll(event.detail === 0);
      else this.open({ focus: event.detail === 0 ? 'first' : 'menu' });
   }

   _handleTriggerKeydown(event) {
      if (this._disabled) return;
      if (event.key === 'ArrowDown') {
         event.preventDefault();
         if (this._open) this._focusIn(0, 'first');
         else this.open({ focus: 'first' });
      } else if (event.key === 'ArrowUp') {
         event.preventDefault();
         if (this._open) this._focusIn(0, 'last');
         else this.open({ focus: 'last' });
      } else if (event.key === 'Escape' && this._open) {
         event.preventDefault();
         this._closeAll(true);
      }
   }

   _handleTriggerPointerEnter(event) {
      if (this._trigger !== 'hover' || event.pointerType !== 'mouse' || this._disabled) return;
      this._schedule({ type: 'open' }, HOVER_OPEN_DELAY, () => this.open({ focus: 'none' }));
   }

   _handleHostPointerEnter(event) {
      if (event.pointerType !== 'mouse') return;
      if (this._hoverAction?.type === 'closeAll') this._cancelHover();
   }

   _handleHostPointerLeave(event) {
      if (event.pointerType !== 'mouse') return;
      if (this._hoverAction?.type === 'open') this._cancelHover();
      if (this._trigger === 'hover' && this._open) {
         this._schedule({ type: 'closeAll' }, HOVER_CLOSE_DELAY, () => this._closeAll(false));
      }
   }

   _handlePanelPointerOver(event) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const level = this._levelOf(event.target);
      if (level === -1) return;
      // Reaching a submenu cancels the pending close of that submenu.
      if (this._hoverAction?.type === 'closeFrom' && this._hoverAction.level <= level) this._cancelHover();
      if (this._hoverAction?.type === 'closeAll') this._cancelHover();
      const button = event.target.closest('.slice_dropdown_item');
      if (!button || this._levelOf(button) !== level) return;
      if (button.getAttribute('aria-disabled') === 'true') return;
      if (document.activeElement !== button) button.focus({ preventScroll: true });

      const next = this._levels[level + 1];
      if (button.classList.contains('slice_dropdown_item--submenu')) {
         if (next?.button === button) {
            this._cancelHover();
            return;
         }
         if (this._wouldStack(level)) return;
         this._schedule({ type: 'openSub', level, button }, SUBMENU_OPEN_DELAY, () => this._openSubmenu(level, button, 'none'));
      } else if (next) {
         this._schedule({ type: 'closeFrom', level: level + 1 }, SUBMENU_CLOSE_DELAY, () => this._closeFrom(level + 1));
      }
   }

   _schedule(action, delay, run) {
      if (this._hoverAction && this._hoverAction.type === action.type &&
         this._hoverAction.level === action.level && this._hoverAction.button === action.button) return;
      clearTimeout(this._hoverTimer);
      this._hoverAction = action;
      this._hoverTimer = window.setTimeout(() => {
         this._hoverAction = null;
         run();
      }, delay);
   }

   _cancelHover() {
      clearTimeout(this._hoverTimer);
      this._hoverAction = null;
   }

   _handlePanelClick(event) {
      const button = event.target.closest('.slice_dropdown_item');
      if (!button) return;
      const level = this._levelOf(button);
      if (level === -1) return;
      this._cancelHover();
      this._activate(level, button, event, event.detail === 0);
   }

   _handlePanelKeydown(event) {
      const level = this._levelOf(event.target);
      if (level === -1) return;
      // Keys typed in custom content belong to it; Escape still closes a level.
      if (event.target.closest('.slice_dropdown_custom')) {
         if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this._back(level);
         }
         return;
      }
      const current = event.target.closest('.slice_dropdown_item');
      switch (event.key) {
         case 'ArrowDown':
            event.preventDefault();
            this._move(level, 1, current);
            break;
         case 'ArrowUp':
            event.preventDefault();
            this._move(level, -1, current);
            break;
         case 'Home':
         case 'PageUp':
            event.preventDefault();
            this._move(level, 'first', current);
            break;
         case 'End':
         case 'PageDown':
            event.preventDefault();
            this._move(level, 'last', current);
            break;
         case 'ArrowRight':
            if (current?.classList.contains('slice_dropdown_item--submenu')) {
               event.preventDefault();
               this._openSubmenu(level, current, 'first');
            }
            break;
         case 'ArrowLeft':
            if (level > 0) {
               event.preventDefault();
               this._back(level);
            }
            break;
         case 'Escape':
            event.preventDefault();
            event.stopPropagation();
            this._back(level);
            break;
         case 'Enter':
         case ' ':
            if (current) {
               event.preventDefault();
               this._activate(level, current, event, true);
            }
            break;
         case 'Tab':
            // Leave from the trigger, as if the menu were not there.
            this._closeAll(true);
            break;
         default:
            if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== ' ') {
               this._typeTo(level, event.key, current);
            }
      }
   }

   // One level back: a submenu closes onto its item; the root closes onto the trigger.
   _back(level) {
      if (level === 0) {
         this._closeAll(true);
         return;
      }
      const record = this._levels[level];
      this._closeFrom(level);
      record?.button?.focus({ preventScroll: true });
   }

   _handleFocusOut(event) {
      if (!this._open) return;
      const next = event.relatedTarget;
      if (next && !this.contains(next)) this._closeAll(false);
   }

   _handleOutsidePointer(event) {
      if (!this.contains(event.target)) this._closeAll(false);
   }

   _handleViewportChange() {
      this._schedulePosition();
   }

   _schedulePosition() {
      if (this._frame) return;
      this._frame = requestAnimationFrame(() => {
         this._frame = 0;
         for (let i = 0; i < this._levels.length; i++) this._positionLevel(i);
      });
   }

   // ------------------------------------------------------------ positioning

   _positionLevel(level) {
      const record = this._levels[level];
      if (!record) return;
      const panel = record.panel;
      const vw = document.documentElement.clientWidth || window.innerWidth;
      const vh = window.innerHeight;
      const m = VIEWPORT_MARGIN;
      panel.style.maxHeight = '';
      // Sizes from offset*, not getBoundingClientRect: the entrance animation
      // scales the panels, and a menu must not be placed by a moving target.
      let width = panel.offsetWidth;
      let height = panel.offsetHeight;
      let top;
      let left;
      let side;

      if (level === 0) {
         const anchor = this.$trigger.getBoundingClientRect();
         const [vertical, align] = this._placement.split('-');
         const below = vh - anchor.bottom - TRIGGER_GAP - m;
         const above = anchor.top - TRIGGER_GAP - m;
         let openDown = vertical === 'bottom' ? (height <= below || below >= above) : !(height <= above || above >= below);
         const room = openDown ? below : above;
         if (height > room) {
            panel.style.maxHeight = `${Math.max(120, Math.floor(room))}px`;
            height = panel.offsetHeight;
         }
         top = openDown ? anchor.bottom + TRIGGER_GAP : anchor.top - TRIGGER_GAP - height;
         left = align === 'start' ? anchor.left : anchor.right - width;
         side = openDown ? 'bottom' : 'top';
      } else if (record.stacked) {
         // On top of the parent, at least as big, so it reads as a new page.
         const parent = this._box(this._levels[level - 1].panel);
         panel.style.minWidth = `${Math.round(parent.width)}px`;
         panel.style.minHeight = `${Math.round(Math.min(parent.height, vh - 2 * m))}px`;
         width = panel.offsetWidth;
         height = panel.offsetHeight;
         left = parent.left;
         top = parent.top;
         side = 'stack';
         if (top + height > vh - m) {
            panel.style.maxHeight = `${vh - top - m}px`;
            height = panel.offsetHeight;
         }
      } else {
         const parentPanel = this._levels[level - 1].panel;
         const parent = this._box(parentPanel);
         // The item's top inside its (fixed, possibly scrolled) panel.
         const itemTop = parent.top + record.button.offsetTop - parentPanel.scrollTop;
         const overlap = 4;
         const rightRoom = vw - parent.right - m;
         const leftRoom = parent.left - m;
         // Keep going the way the previous level went, while there is room.
         const prefersLeft = this._levels[level - 1].panel.dataset.side === 'left';
         let toLeft = prefersLeft ? width <= leftRoom || leftRoom > rightRoom : !(width <= rightRoom) && leftRoom > rightRoom;
         left = toLeft ? parent.left - width + overlap : parent.right - overlap;
         side = toLeft ? 'left' : 'right';
         if (height > vh - 2 * m) {
            panel.style.maxHeight = `${vh - 2 * m}px`;
            height = panel.offsetHeight;
         }
         // Line the first item up with the parent item.
         const padding = parseFloat(getComputedStyle(panel).paddingTop) || 0;
         top = itemTop - padding;
      }

      left = Math.min(Math.max(m, left), Math.max(m, vw - width - m));
      top = Math.min(Math.max(m, top), Math.max(m, vh - height - m));
      panel.style.left = `${Math.round(left)}px`;
      panel.style.top = `${Math.round(top)}px`;
      panel.dataset.side = side;
   }

   // ------------------------------------------------------------- helpers

   // A panel's box as placed (style left/top + layout size), ignoring the
   // transform of its entrance animation.
   _box(panel) {
      const left = parseFloat(panel.style.left) || 0;
      const top = parseFloat(panel.style.top) || 0;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      return { left, top, width, height, right: left + width, bottom: top + height };
   }

   _syncTriggerName() {
      if (this._ariaLabel) this.$trigger.setAttribute('aria-label', this._ariaLabel);
      else this.$trigger.removeAttribute('aria-label');
   }
}

customElements.define('slice-dropdown', DropDown);