import { getter, read, readPath, writePath } from '../../shared/data/paths.js';
import { relativeTime, fullDate, toDate } from '../../shared/data/dates.js';
import { normalizeEdit, editKind, controlFor, readControl, validateValue, TEXT_KINDS } from '../../shared/editing/inlineControl.js';
// DescriptionList — one record, shown as label → value pairs: the detail of
// an order, a customer's profile, the settings of a project. Where DataList
// shows many records with a few properties each, DescriptionList shows one
// record with all of them.
//
//   await slice.build('DescriptionList', {
//     item: order,
//     fields: [
//       { key: 'id', label: 'Order', format: (id) => `#${id}`, copy: true },
//       { key: 'status', type: 'badge', badge: (s) => STATUS[s] },
//       { key: 'customer', type: 'avatar' },
//       { key: 'email', type: 'email', copy: true, edit: { required: true } },
//       { key: 'total', type: 'currency', currency: 'USD' },
//       { key: 'createdAt', label: 'Created', type: 'relative' },
//     ],
//     commit: ({ key, value, item }) => api.patch(`/orders/${item.id}`, { [key]: value }),
//   });
//
// Where the record comes from (one of three, like DataList):
//   item: {...}                an object you own; set it again to change it
//   context: 'order'           a slice.context store (contextPath picks the
//                              object inside it); it follows the store, and
//                              saved edits are written back to it
//   load: async ({ signal })   a server; reload() asks again
//
// A field: { key, label, type, format, render, badge, avatar, href, path,
//   copy, edit, help, span, hidden, empty }. `key` is a key or a path
//   ('customer.name'). Without `label`, the key is turned into one.
//
// variant: 'sheet' is the spreadsheet look: a grid of cells, the labels as
// shaded row headers, one active cell moved with the arrows and Tab, and
// edits made inside the cell (Enter or F2, a double click, or just typing),
// saved with Enter (then down) or Tab (then on), like Excel.
//
// Editing: a field with `edit` gets a pencil. The item changes when the save
// succeeds: `commit` runs first (the editor waits, busy), and only then is
// the new value written. A failed commit keeps the editor open with what
// was typed and says so. Without `commit`, the value is written at once.

const LAYOUTS = ['horizontal', 'stacked', 'grid'];
const VARIANTS = ['outlined', 'separated', 'filled', 'ghost', 'sheet'];
const DENSITIES = ['compact', 'comfortable', 'spacious'];
const TYPES = ['text', 'number', 'currency', 'percent', 'date', 'datetime', 'relative', 'boolean',
   'email', 'url', 'phone', 'badge', 'avatar', 'tags', 'list', 'code', 'multiline'];
const NARROW = 480;
const COPIED_MS = 1600;

const TEXTS = {
   empty: '—',
   yes: 'Yes',
   no: 'No',
   edit: 'Edit {label}',
   editing: 'Editing {label}',
   copy: 'Copy {label}',
   copied: 'Copied',
   save: 'Save',
   cancel: 'Cancel',
   saving: 'Saving…',
   saved: '{label} saved',
   saveError: 'The change could not be saved.',
   error: 'This could not be loaded.',
   retry: 'Try again',
   loading: 'Loading…',
   expand: 'Show {label}',
   collapse: 'Hide {label}',
};

function fill(template, values = {}) {
   return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

/** 'createdAt' → 'Created at', 'customer.full_name' → 'Full name'. */
function humanize(key) {
   const last = String(key).split('.').pop() || '';
   const words = last.replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim().toLowerCase();
   return words.charAt(0).toUpperCase() + words.slice(1);
}

function isEmpty(value) {
   return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

export default class DescriptionList extends HTMLElement {
   static props = {
      // Where the record comes from.
      item: { type: 'object', default: null },
      context: { type: 'string', default: '' },
      // Where the record sits inside the context's state ('' is the state).
      contextPath: { type: 'string', default: '' },
      load: { type: 'function', default: null },
      // What it shows.
      fields: { type: 'array', default: [] },
      // Groups of fields with a heading: [{ title, description, fields, collapsible, collapsed }].
      sections: { type: 'array', default: [] },
      title: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      // Buttons in the header: [{ label, icon, variant, danger, iconOnly, disabled, onClick({ item, list, event }) }].
      actions: { type: 'array', default: [] },
      // Editing.
      commit: { type: 'function', default: null },
      onChange: { type: 'function', default: null },
      onError: { type: 'function', default: null },
      readonly: { type: 'boolean', default: false },
      // Looks.
      layout: { type: 'string', default: 'horizontal', allowedValues: LAYOUTS },
      columns: { type: 'number', default: 2 },
      labelWidth: { type: 'string', default: '' },
      variant: { type: 'string', default: 'outlined', allowedValues: VARIANTS },
      density: { type: 'string', default: 'comfortable', allowedValues: DENSITIES },
      loading: { type: 'boolean', default: false },
      hideEmpty: { type: 'boolean', default: false },
      locale: { type: 'string', default: '' },
      texts: { type: 'object', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-description-list');

      this.$header = this.querySelector('.slice-description-list__header');
      this.$title = this.querySelector('.slice-description-list__title');
      this.$description = this.querySelector('.slice-description-list__description');
      this.$actions = this.querySelector('.slice-description-list__actions');
      this.$state = this.querySelector('.slice-description-list__state');
      this.$stateText = this.querySelector('.slice-description-list__state-text');
      this.$retry = this.querySelector('.slice-description-list__retry');
      this.$body = this.querySelector('.slice-description-list__body');
      this.$live = this.querySelector('.slice-description-list__live');

      this._item = null;
      this._context = '';
      this._contextPath = '';
      this._load = null;
      this._fields = [];
      this._sections = [];
      this._title = '';
      this._description = '';
      this._actions = [];
      this._commit = null;
      this._onChange = null;
      this._onError = null;
      this._readonly = false;
      this._layout = 'horizontal';
      this._columns = 2;
      this._labelWidth = '';
      this._variant = 'outlined';
      this._density = 'comfortable';
      this._loading = false;
      this._hideEmpty = false;
      this._locale = '';
      this._texts = { ...TEXTS };

      // Internal state: never a prop's `_<name>`, which Slice resets on build.
      this._loaded = null;          // the record `load` returned
      this._fetchState = 'idle';    // idle | loading | error
      this._abort = null;
      this._loadWatch = null;   // unsubscribe from a QueryService load
      this._contextWatch = null;
      /** @type {Map<string, any>} field id → its cell */
      this._cells = new Map();
      this._editingId = '';
      this._editor = null;          // { id, control, kind, buttons: [] }
      this._busyIds = new Set();
      this._closedSections = new Set();
      this._activeId = '';          // sheet: the active cell
      this._pending = new Set();
      this._timers = new Set();
      this._ready = false;
      this._narrow = false;

      this._onKeyDown = this._onKeyDown.bind(this);
      this._onClick = this._onClick.bind(this);
      this._onDoubleClick = this._onDoubleClick.bind(this);
      this._onFocusOut = this._onFocusOut.bind(this);

      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._ready = true;
      this._applyLooks();
      this.$body.addEventListener('click', this._onClick);
      this.$body.addEventListener('dblclick', this._onDoubleClick);
      this.$body.addEventListener('focusout', this._onFocusOut);
      this.addEventListener('keydown', this._onKeyDown);
      this._resize = new ResizeObserver(() => {
         const narrow = this.clientWidth > 0 && this.clientWidth < NARROW;
         if (narrow !== this._narrow) {
            this._narrow = narrow;
            this.classList.toggle('is-narrow', narrow);
         }
      });
      this._resize.observe(this);
      if (this._context) this._watchContext();
      this._renderHeader();
      // With a server, the first paint is already the skeleton, not dashes.
      if (this._load) this._fetchState = 'loading';
      this._render();
      // A `load` from QueryService says when its data went stale (after a
      // change somewhere else): ask again, keeping what is on screen.
      if (typeof this._load?.subscribe === 'function') this._loadWatch = this._load.subscribe(() => this.reload());
      if (this._load) this._fetch();
   }

   // A cached route came back: the record may have changed meanwhile.
   update() {
      if (this._ready) this.reload();
   }

   beforeDestroy() {
      this._ready = false;
      this._loadWatch?.();
      this._loadWatch = null;
      this._resize?.disconnect();
      this._abort?.abort();
      for (const timer of this._timers) clearTimeout(timer);
      this._timers.clear();
      this._closeEditor();
      this._discard(this.$actions);
      this._discard(this.$retry);
      this._discard(this.$body);
      this._cells.clear();
   }

   // ── Props ──────────────────────────────────────────────────────

   /** The record as it is now (after any saved edits). */
   get item() { return this._current(); }
   set item(value) {
      this._item = value && typeof value === 'object' ? value : null;
      this._paint();
   }

   get context() { return this._context; }
   set context(value) {
      this._context = value ? String(value) : '';
      if (this._ready && this._context && !this._contextWatch) this._watchContext();
      this._paint();
   }

   get contextPath() { return this._contextPath; }
   set contextPath(value) { this._contextPath = value ? String(value) : ''; this._paint(); }

   get load() { return this._load; }
   set load(value) {
      this._load = typeof value === 'function' ? value : null;
      if (this._ready && this._load) this._fetch();
   }

   get fields() { return this._fields; }
   set fields(value) { this._fields = Array.isArray(value) ? value : []; this._render(); }

   get sections() { return this._sections; }
   set sections(value) { this._sections = Array.isArray(value) ? value : []; this._render(); }

   get title() { return this._title; }
   set title(value) { this._title = value ? String(value) : ''; this._renderHeader(); }

   get description() { return this._description; }
   set description(value) { this._description = value ? String(value) : ''; this._renderHeader(); }

   get actions() { return this._actions; }
   set actions(value) { this._actions = Array.isArray(value) ? value : []; this._renderHeader(); }

   get commit() { return this._commit; }
   set commit(value) { this._commit = typeof value === 'function' ? value : null; }

   get onChange() { return this._onChange; }
   set onChange(value) { this._onChange = typeof value === 'function' ? value : null; }

   get onError() { return this._onError; }
   set onError(value) { this._onError = typeof value === 'function' ? value : null; }

   get readonly() { return this._readonly; }
   set readonly(value) {
      this._readonly = value === true;
      if (this._readonly) this._closeEditor();
      this._repaintAll();
   }

   get layout() { return this._layout; }
   set layout(value) { this._layout = LAYOUTS.includes(value) ? value : 'horizontal'; this._applyLooks(); }

   get columns() { return this._columns; }
   set columns(value) {
      const n = Math.round(Number(value));
      this._columns = n >= 1 ? Math.min(n, 6) : 2;
      this._applyLooks();
   }

   get labelWidth() { return this._labelWidth; }
   set labelWidth(value) { this._labelWidth = value ? String(value) : ''; this._applyLooks(); }

   get variant() { return this._variant; }
   set variant(value) {
      const was = this._variant;
      this._variant = VARIANTS.includes(value) ? value : 'outlined';
      this._applyLooks();
      // The sheet has its own editor (in the cell) and its own tab stops.
      if ((was === 'sheet') !== (this._variant === 'sheet')) this._render();
   }

   get _sheet() { return this._variant === 'sheet'; }

   get density() { return this._density; }
   set density(value) { this._density = DENSITIES.includes(value) ? value : 'comfortable'; this._applyLooks(); }

   get loading() { return this._loading; }
   set loading(value) { this._loading = value === true; this._repaintAll(); }

   get hideEmpty() { return this._hideEmpty; }
   set hideEmpty(value) { this._hideEmpty = value === true; this._repaintAll(); }

   get locale() { return this._locale; }
   set locale(value) { this._locale = value ? String(value) : ''; this._repaintAll(); }

   get texts() { return this._texts; }
   set texts(value) {
      this._texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) };
      this._render();
   }

   /** The field being edited ('' when none). */
   get editing() { return this._editingId; }

   // ── Methods ────────────────────────────────────────────────────

   /** The value of one field, read from the current record. */
   getValue(key) {
      return read(this._current(), key);
   }

   /**
    * Change one field the way an edit does: through `commit` when there is
    * one, written only if it succeeds. Resolves to whether it was saved.
    */
   async setValue(key, value) {
      const cell = this._cellFor(key) || { id: String(key), field: this._normalize({ key }) };
      return this._save(cell, value);
   }

   /**
    * Open the editor of a field (one with `edit`). Resolves to whether it
    * opened. `initial` starts it with that text instead of the value (the
    * sheet does this when someone just starts typing).
    * @param {any} key
    * @param {{ initial?: any }} [options]
    */
   async edit(key, { initial } = {}) {
      const cell = this._cellFor(key);
      if (!cell || !this._canEdit(cell.field) || !this._current()) return false;
      if (this._editKind(cell.field) === 'switch') {
         if (this._sheet) this._setActive(cell, true);
         else this._focusIn(cell.content);
         return true;
      }
      if (this._editingId === cell.id) return true;
      this._closeEditor();
      if (this._sheet) this._setActive(cell, false);
      return this._openEditor(cell, { initial });
   }

   /** Close the editor without saving. */
   cancelEdit() {
      const id = this._editingId;
      if (!id) return;
      // What failed is no longer on screen: neither is its message.
      this._showError(this._cells.get(id), '');
      this._closeEditor();
      const cell = this._cells.get(id);
      if (this._sheet && cell) this._setActive(cell, true);
      else this._focusBack(cell);
   }

   /** Save what is in the open editor. Resolves to whether it was saved. */
   async save({ move = '', blur = false } = {}) {
      const editor = this._editor;
      if (!editor) return false;
      const cell = this._cells.get(editor.id);
      if (!cell) return false;
      const value = this._readControl(editor);
      const message = validateValue(editor.control, value, cell.field.edit, this._current());
      if (message === null) return false;
      if (message) {
         this._showError(cell, message);
         return false;
      }
      if (this._sheet) return this._saveCell(cell, value, move, { focus: !blur });
      const saved = await this._save(cell, value, editor);
      if (saved && this._editor === editor) {
         this._closeEditor();
         this._focusBack(cell);
      }
      return saved;
   }

   /** Sheet: the active cell's field ('' when none). */
   get activeField() { return this._activeId; }

   /** Sheet: make a field's cell the active one, and focus it. */
   activate(key) {
      const cell = this._cellFor(key);
      if (!cell || !this._sheet) return false;
      this._setActive(cell, true);
      return true;
   }

   /** Ask `load` again, or redraw from the current record. */
   reload() {
      if (this._load) return this._fetch();
      this._repaintAll();
      return Promise.resolve();
   }

   /** Move focus to a field: its editor, its control, or its first button. */
   focusField(key) {
      const cell = this._cellFor(key);
      if (!cell) return false;
      cell.row.scrollIntoView?.({ block: 'nearest' });
      return this._focusIn(cell.row) || false;
   }

   // ── Data ───────────────────────────────────────────────────────

   _current() {
      if (this._context && typeof slice !== 'undefined' && slice.context?.getState) {
         if (!slice.context.has?.(this._context)) return null;
         const value = readPath(slice.context.getState(this._context), this._contextPath);
         return value && typeof value === 'object' ? value : null;
      }
      if (this._load) return this._loaded;
      return this._item;
   }

   _writeItem(next) {
      if (this._context && slice.context?.setState) {
         slice.context.setState(this._context, (prev) => writePath(prev, this._contextPath, next));
         if (!this._contextWatch) this._paint();
         return;
      }
      if (this._load) this._loaded = next;
      else this._item = next;
      this._paint();
   }

   _watchContext() {
      if (!slice.context?.watch || !slice.context.has?.(this._context)) {
         slice.logger?.warn?.('DescriptionList', `The context "${this._context}" does not exist. Create it with slice.context.create().`);
         return;
      }
      this._contextWatch = slice.context.watch(this._context, this, () => this._paint(),
         (state) => readPath(state, this._contextPath));
   }

   async _fetch() {
      if (!this._ready || !this._load) return;
      this._abort?.abort();
      const abort = new AbortController();
      this._abort = abort;
      this._fetchState = 'loading';
      this._renderState();
      this._repaintAll();
      try {
         const record = await this._load({ signal: abort.signal });
         if (abort.signal.aborted || !this._ready) return;
         this._loaded = record && typeof record === 'object' ? record : null;
         this._fetchState = 'idle';
      } catch (error) {
         if (abort.signal.aborted || !this._ready) return;
         this._fetchState = 'error';
         this._onError?.(error, { type: 'load' });
      }
      this._renderState();
      this._repaintAll();
   }

   async _save(cell, value, editor = null) {
      const field = cell.field;
      if (typeof field.key !== 'string' || !field.key) return false;
      const before = this._current();
      if (!before) return false;
      const previous = read(before, field.key);
      if (Object.is(previous, value)) return true;
      this._showError(cell, '');

      if (this._commit) {
         this._setBusy(cell, true, editor);
         try {
            const result = await this._commit({
               key: field.key, value, previous, field,
               item: writePath(before, field.key, value), before,
            });
            if (result === false) throw new Error(this._t('saveError'));
            if (!this._ready) return false;
            this._setBusy(cell, false, editor);
            // The server's version (with its dates) wins; otherwise apply the
            // change to the record as it is NOW, so a save that finished
            // meanwhile is not undone.
            const next = result && typeof result === 'object' && !Array.isArray(result)
               ? result
               : writePath(this._current() || before, field.key, value);
            this._finishSave(cell, next, value, previous);
            return true;
         } catch (error) {
            if (!this._ready) return false;
            this._setBusy(cell, false, editor);
            const message = error instanceof Error && error.message && error.message !== this._t('saveError')
               ? `${this._t('saveError')} ${error.message}`
               : this._t('saveError');
            this._showError(cell, message);
            this._announce(message);
            this._onError?.(error, { type: 'save', key: field.key, value });
            return false;
         }
      }
      this._finishSave(cell, writePath(before, field.key, value), value, previous);
      return true;
   }

   _finishSave(cell, next, value, previous) {
      this._writeItem(next);
      this._announce(this._t('saved', { label: cell.field.label }));
      this._onChange?.({ key: cell.field.key, value, previous, item: this._current() });
   }

   // ── Fields ─────────────────────────────────────────────────────

   _normalize(spec, index = 0) {
      const field = typeof spec === 'string' ? { key: spec } : { ...(spec || {}) };
      field.type = TYPES.includes(field.type) ? field.type : 'text';
      if (!field.label) field.label = typeof field.key === 'string' ? humanize(field.key) : '';
      field.id = typeof field.key === 'string' && field.key ? field.key : `field-${index}`;
      field.get = getter(field.key) || (() => undefined);
      field.edit = normalizeEdit(field.edit);
      return field;
   }

   _sectionList() {
      const sections = this._sections.length ? this._sections : [{ fields: this._fields }];
      let index = 0;
      return sections.map((section, s) => ({
         ...section,
         id: String(section.id ?? section.title ?? `section-${s}`),
         fields: (Array.isArray(section.fields) ? section.fields : []).map((f) => this._normalize(f, index++)),
      }));
   }

   _cellFor(key) {
      if (this._cells.has(String(key))) return this._cells.get(String(key));
      for (const cell of this._cells.values()) if (cell.field.key === key) return cell;
      return null;
   }

   _canEdit(field) {
      return !!field.edit && !this._readonly && typeof field.key === 'string' && !field.render;
   }

   _editKind(field) {
      return editKind(field.edit, field.type);
   }

   // ── Rendering ──────────────────────────────────────────────────

   _t(key, values) { return fill(this._texts[key] ?? TEXTS[key] ?? key, values); }

   _applyLooks() {
      this.dataset.layout = this._layout;
      this.dataset.variant = this._variant;
      this.dataset.density = this._density;
      this.style.setProperty('--slice-description-list-columns', String(this._columns));
      if (this._labelWidth) this.style.setProperty('--slice-description-list-label', this._labelWidth);
      else this.style.removeProperty('--slice-description-list-label');
   }

   _renderHeader() {
      if (!this._ready) return;
      this.$title.textContent = this._title;
      this.$title.hidden = !this._title;
      this.$description.textContent = this._description;
      this.$description.hidden = !this._description;
      this._discard(this.$actions);
      this.$actions.replaceChildren();
      for (const action of this._actions) {
         if (!action) continue;
         const slot = document.createElement('span');
         this.$actions.append(slot);
         this._mount(slot, 'Button', {
            value: action.iconOnly ? '' : (action.label || ''),
            ariaLabel: action.iconOnly ? action.label : undefined,
            icon: action.icon,
            variant: action.variant ?? (action.danger ? 'danger' : 'outlined'),
            size: 'sm',
            disabled: action.disabled === true,
            onClick: (event) => action.onClick?.({ item: this._current(), list: this, event }),
         });
      }
      this.$header.hidden = !this._title && !this._description && !this._actions.length;
   }

   _renderState() {
      const failed = this._fetchState === 'error' && !this._current();
      this.$state.hidden = !failed;
      this.$body.hidden = failed;
      if (!failed) return;
      this.$stateText.textContent = this._t('error');
      if (!this.$retry.dataset.mounted) {
         this.$retry.dataset.mounted = 'true';
         this._mount(this.$retry, 'Button', {
            value: this._t('retry'),
            variant: 'outlined',
            size: 'sm',
            onClick: () => this._fetch(),
         });
      }
   }

   // The structure: sections, rows, empty cells. Values are painted after.
   _render() {
      if (!this._ready) return;
      this._closeEditor();
      this._discard(this.$body);
      this.$body.replaceChildren();
      this._cells.clear();

      for (const section of this._sectionList()) {
         const box = document.createElement('section');
         box.className = 'slice-description-list__section';
         const list = document.createElement('dl');
         list.className = 'slice-description-list__fields';
         list.id = `${this._uid()}-${section.id.replace(/\W+/g, '-')}`;

         if (section.title) {
            const head = document.createElement('div');
            head.className = 'slice-description-list__section-head';
            const heading = document.createElement('h4');
            heading.className = 'slice-description-list__section-title';
            if (section.collapsible) {
               if (section.collapsed && !this._closedSections.has(`seen:${section.id}`)) {
                  this._closedSections.add(section.id);
                  this._closedSections.add(`seen:${section.id}`);
               }
               const closed = this._closedSections.has(section.id);
               const toggle = document.createElement('button');
               toggle.type = 'button';
               toggle.className = 'slice-description-list__section-toggle';
               toggle.setAttribute('aria-expanded', String(!closed));
               toggle.setAttribute('aria-controls', list.id);
               toggle.innerHTML = '<span class="slice-description-list__chevron" aria-hidden="true"></span>';
               toggle.append(section.title);
               toggle.addEventListener('click', () => this._toggleSection(section.id, toggle, list));
               heading.append(toggle);
               list.hidden = closed;
            } else {
               heading.textContent = section.title;
            }
            head.append(heading);
            if (section.description) {
               const text = document.createElement('p');
               text.className = 'slice-description-list__section-description';
               text.textContent = section.description;
               head.append(text);
            }
            box.append(head);
         }

         for (const field of section.fields) list.append(this._renderRow(field));
         box.append(list);
         this.$body.append(box);
      }
      this._renderState();
      this._paint();
   }

   _renderRow(field) {
      const row = document.createElement('div');
      row.className = 'slice-description-list__field';
      row.dataset.key = field.id;
      if (field.span === 'full' || field.span === 2 || field.span === 3) row.dataset.span = String(field.span);

      const term = document.createElement('dt');
      term.className = 'slice-description-list__label';
      const label = document.createElement('span');
      label.className = 'slice-description-list__label-text';
      label.textContent = field.label;
      term.append(label);
      if (field.help) {
         const help = document.createElement('span');
         help.className = 'slice-description-list__help';
         help.textContent = field.help;
         term.append(help);
      }

      const value = document.createElement('dd');
      value.className = 'slice-description-list__value';
      const content = document.createElement('div');
      content.className = 'slice-description-list__content';
      const tools = document.createElement('div');
      tools.className = 'slice-description-list__tools';
      const error = document.createElement('p');
      error.className = 'slice-description-list__error';
      error.hidden = true;
      const main = document.createElement('div');
      main.className = 'slice-description-list__main';
      main.append(content, tools);
      value.append(main, error);

      term.id = `${this._uid()}-label-${field.id.replace(/\W+/g, '-')}`;
      if (this._sheet) {
         // Roving tab stop: only the active cell is in the Tab order.
         value.tabIndex = -1;
         value.dataset.cell = '';
         value.setAttribute('aria-labelledby', term.id);
      }
      row.append(term, value);
      this._cells.set(field.id, {
         id: field.id, field, row, content, tools, error, main, dd: value,
         painted: false, value: undefined, item: undefined, loading: false,
      });
      return row;
   }

   _toggleSection(id, toggle, list) {
      const closed = !this._closedSections.has(id);
      if (closed) this._closedSections.add(id);
      else this._closedSections.delete(id);
      toggle.setAttribute('aria-expanded', String(!closed));
      toggle.setAttribute('aria-label', this._t(closed ? 'expand' : 'collapse', { label: toggle.textContent }));
      list.hidden = closed;
   }

   _repaintAll() {
      for (const cell of this._cells.values()) cell.painted = false;
      this._paint();
   }

   // Paint the values that changed. A field being edited or saved is left
   // alone, so a store update elsewhere never wipes what someone is typing.
   _paint() {
      if (!this._ready) return;
      const item = this._current();
      const loading = !item && (this._loading || this._fetchState === 'loading');
      this.classList.toggle('is-loading', loading);
      this.setAttribute('aria-busy', String(loading));
      this._renderState();

      for (const cell of this._cells.values()) {
         if (cell.id === this._editingId || this._busyIds.has(cell.id)) continue;
         const field = cell.field;
         const value = item ? field.get(item) : undefined;
         const hidden = !loading && ((typeof field.hidden === 'function' && item && field.hidden(item) === true)
            || field.hidden === true || (this._hideEmpty && isEmpty(value)));
         cell.row.hidden = hidden;

         const usesItem = typeof field.render === 'function' || typeof field.format === 'function'
            || typeof field.badge === 'function' || typeof field.avatar === 'function' || typeof field.href === 'function';
         const same = cell.painted && cell.loading === loading && Object.is(cell.value, value)
            && (!usesItem || cell.item === item);
         if (same) continue;
         cell.painted = true;
         cell.loading = loading;
         cell.value = value;
         cell.item = item;
         this._paintCell(cell, value, item, loading);
      }
      if (this._sheet) this._syncActive();
   }

   _paintCell(cell, value, item, loading) {
      const { field, content, tools } = cell;
      this._discard(content);
      this._discard(tools);
      content.replaceChildren();
      tools.replaceChildren();
      cell.row.classList.remove('is-empty');

      if (loading) {
         const bone = document.createElement('span');
         bone.className = 'slice-description-list__skeleton';
         bone.style.width = `${40 + ((field.label.length * 7) % 45)}%`;
         content.append(bone);
         return;
      }

      // No record yet: nothing to show (and nothing to hand to `render`).
      const empty = !item || (isEmpty(value) && typeof field.render !== 'function');
      const editKind = this._canEdit(field) && item ? this._editKind(field) : '';

      if (editKind === 'switch') {
         this._paintSwitch(cell, value);
      } else if (empty) {
         cell.row.classList.add('is-empty');
         content.textContent = field.empty ?? this._t('empty');
      } else {
         this._renderValue(content, field, value, item);
      }

      if (this._sheet) {
         // The sheet edits and copies from the keyboard and the cell itself.
         cell.dd.toggleAttribute('data-editable', !!editKind);
         cell.dd.setAttribute('aria-readonly', String(!editKind));
         return;
      }
      if (field.copy && !empty && editKind !== 'switch') {
         tools.append(this._toolButton('file-copy', this._t('copy', { label: field.label }), () => this._copy(cell), 'copy'));
      }
      if (editKind && editKind !== 'switch') {
         tools.append(this._toolButton('pen', this._t('edit', { label: field.label }), () => this.edit(cell.id)));
      }
   }

   _toolButton(icon, label, onClick, tool = icon) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slice-description-list__tool';
      button.dataset.tool = tool;
      button.setAttribute('aria-label', label);
      button.title = label;
      button.addEventListener('click', onClick);
      this._mount(button, 'Icon', { name: icon, size: '16px' });
      return button;
   }

   // ── Values ─────────────────────────────────────────────────────

   _renderValue(content, field, value, item) {
      if (typeof field.render === 'function') {
         const out = field.render(value, item);
         if (out instanceof Node) content.append(out);
         else if (!isEmpty(out)) content.textContent = String(out);
         else content.textContent = field.empty ?? this._t('empty');
         return;
      }

      let node;
      switch (field.type) {
         case 'badge': {
            const props = typeof field.badge === 'function' ? field.badge(value, item)
               : field.badge && typeof field.badge === 'object' ? field.badge[value] : null;
            const slot = document.createElement('span');
            this._mount(slot, 'Badge', { label: this._text(field, value, item), ...(props || {}) });
            node = slot;
            break;
         }
         case 'avatar': {
            const props = typeof field.avatar === 'function' ? field.avatar(value, item)
               : typeof value === 'object' ? { name: value.name, src: value.src ?? value.avatar ?? value.photo } : { name: String(value) };
            const person = document.createElement('span');
            person.className = 'slice-description-list__person';
            const slot = document.createElement('span');
            this._mount(slot, 'Avatar', { size: 'sm', ...props });
            const name = document.createElement('span');
            name.textContent = typeof field.format === 'function' ? this._text(field, value, item) : (props?.name || this._text(field, value, item));
            person.append(slot, name);
            node = person;
            break;
         }
         case 'tags': {
            const box = document.createElement('span');
            box.className = 'slice-description-list__tags';
            for (const tag of Array.isArray(value) ? value : [value]) {
               const slot = document.createElement('span');
               const props = typeof field.tag === 'function' ? field.tag(tag, item)
                  : (tag && typeof tag === 'object' ? tag : { label: String(tag) });
               this._mount(slot, 'Badge', { shape: 'rounded', ...props });
               box.append(slot);
            }
            node = box;
            break;
         }
         case 'boolean': {
            const slot = document.createElement('span');
            const on = value === true || value === 'true' || value === 1;
            this._mount(slot, 'Badge', { label: this._t(on ? 'yes' : 'no'), tone: on ? 'success' : 'neutral', indicator: true });
            node = slot;
            break;
         }
         case 'email':
         case 'url':
         case 'phone': {
            const link = document.createElement('a');
            const text = String(value);
            link.href = field.type === 'email' ? `mailto:${text}` : field.type === 'phone' ? `tel:${text.replace(/[^\d+]/g, '')}` : text;
            if (field.type === 'url') {
               link.target = '_blank';
               link.rel = 'noopener noreferrer';
            }
            link.className = 'slice-description-list__link';
            link.textContent = this._text(field, value, item);
            node = link;
            break;
         }
         case 'code': {
            const code = document.createElement('code');
            code.className = 'slice-description-list__code';
            code.textContent = this._text(field, value, item);
            node = code;
            break;
         }
         case 'relative': {
            const time = document.createElement('time');
            const date = toDate(value);
            if (date) time.dateTime = date.toISOString();
            time.title = fullDate(value, this._locale || undefined);
            time.textContent = this._text(field, value, item);
            node = time;
            break;
         }
         case 'list': {
            const list = document.createElement('ul');
            list.className = 'slice-description-list__list';
            for (const entry of Array.isArray(value) ? value : [value]) {
               const li = document.createElement('li');
               li.textContent = typeof field.format === 'function' ? String(field.format(entry, item)) : String(entry);
               list.append(li);
            }
            node = list;
            break;
         }
         default: {
            const span = document.createElement('span');
            span.className = 'slice-description-list__text';
            if (field.type === 'multiline') span.classList.add('is-multiline');
            if (['number', 'currency', 'percent'].includes(field.type)) span.classList.add('is-numeric');
            span.textContent = this._text(field, value, item);
            node = span;
         }
      }

      // Any field can be a link: to an app route (path) or an address (href).
      const path = typeof field.path === 'function' ? field.path(item) : field.path;
      const href = typeof field.href === 'function' ? field.href(item) : field.href;
      if ((path || href) && !['email', 'url', 'phone'].includes(field.type)) {
         const link = document.createElement('a');
         link.className = 'slice-description-list__link';
         link.href = slice.href(path || href);
         if (path) {
            link.addEventListener('click', (event) => {
               if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
               event.preventDefault();
               slice.router?.navigate?.(path);
            });
         } else if (/^https?:/i.test(href)) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
         }
         link.append(node);
         node = link;
      }
      content.append(node);
   }

   /** The value as text: `format` first, then the type's own format. */
   _text(field, value, item) {
      if (typeof field.format === 'function') return String(field.format(value, item) ?? '');
      const locale = this._locale || document.documentElement.lang || undefined;
      try {
         switch (field.type) {
            case 'number':
               return new Intl.NumberFormat(locale, { maximumFractionDigits: field.digits ?? 2 }).format(Number(value))
                  + (field.unit ? ` ${field.unit}` : '');
            case 'currency':
               return new Intl.NumberFormat(locale, { style: 'currency', currency: field.currency || 'USD' }).format(Number(value));
            case 'percent':
               return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: field.digits ?? 1 }).format(Number(value));
            case 'date':
            case 'datetime': {
               const date = toDate(value);
               if (!date) return String(value);
               return new Intl.DateTimeFormat(locale, field.type === 'date'
                  ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' }).format(date);
            }
            case 'relative':
               return relativeTime(value, { locale });
            default:
         }
      } catch {
         // An unknown currency or locale: show the raw value rather than nothing.
      }
      if (Array.isArray(value)) return value.join(', ');
      if (value && typeof value === 'object') return String(value.label ?? value.name ?? value.title ?? JSON.stringify(value));
      return String(value);
   }

   // ── Copy ───────────────────────────────────────────────────────

   async _copy(cell) {
      const item = this._current();
      const value = item ? cell.field.get(item) : undefined;
      const text = typeof cell.field.copy === 'function'
         ? String(cell.field.copy(value, item) ?? '')
         : (value !== null && typeof value === 'object' ? cell.content.textContent.trim() : String(value ?? ''));
      let done;
      try {
         await navigator.clipboard.writeText(text);
         done = true;
      } catch {
         // No clipboard API (or no permission): the old way.
         const area = document.createElement('textarea');
         area.value = text;
         area.setAttribute('readonly', '');
         area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
         document.body.append(area);
         area.select();
         try { done = document.execCommand('copy'); } catch { done = false; }
         area.remove();
      }
      if (!done || !this._ready) return;
      if (this._sheet) {
         cell.dd.classList.add('is-copied');
         const flash = setTimeout(() => {
            this._timers.delete(flash);
            cell.dd.classList.remove('is-copied');
         }, 700);
         this._timers.add(flash);
      }
      const button = /** @type {HTMLElement | null} */ (cell.tools.querySelector('[data-tool="copy"]'));
      if (button) {
         const icon = /** @type {any} */ (button.querySelector('slice-icon'));
         button.classList.add('is-done');
         if (icon) icon.name = 'check';
         const timer = setTimeout(() => {
            this._timers.delete(timer);
            button.classList.remove('is-done');
            if (icon) icon.name = 'file-copy';
         }, COPIED_MS);
         this._timers.add(timer);
      }
      this._announce(this._t('copied'));
   }

   // ── Editing ────────────────────────────────────────────────────

   _paintSwitch(cell, value) {
      const slot = document.createElement('span');
      slot.className = 'slice-description-list__switch';
      cell.content.append(slot);
      const checked = value === true || value === 'true' || value === 1;
      this._mount(slot, 'Switch', {
         checked,
         label: this._t(checked ? 'yes' : 'no'),
         size: 'sm',
         variant: 'plain',
         onChange: async (on) => {
            const control = /** @type {any} */ (slot.querySelector('slice-switch'));
            if (control) control.label = this._t(on ? 'yes' : 'no');
            const saved = await this._save(cell, on);
            if (!saved && control && this._ready) {
               control.checked = !on;
               control.label = this._t(!on ? 'yes' : 'no');
            }
         },
      }, (component) => {
         const input = component.querySelector('input');
         input?.setAttribute('aria-label', cell.field.label);
         // In the sheet the cell is the tab stop; Space and Enter flip it.
         if (this._sheet && input) input.tabIndex = -1;
      });
   }

   /** @param {any} cell @param {{ initial?: any }} [options] */
   async _openEditor(cell, { initial } = {}) {
      const field = cell.field;
      const kind = this._editKind(field);
      const value = initial !== undefined ? initial : field.get(this._current());
      const id = cell.id;
      this._editingId = id;
      this._showError(cell, '');
      cell.row.classList.add('is-editing');
      cell.main.hidden = true;

      const box = document.createElement('div');
      box.className = 'slice-description-list__editor';
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', this._t('editing', { label: field.label }));
      const controlSlot = document.createElement('div');
      controlSlot.className = 'slice-description-list__control';
      const buttons = document.createElement('div');
      buttons.className = 'slice-description-list__editor-actions';
      box.append(controlSlot, buttons);
      cell.main.after(box);
      const editor = { id, kind, box, control: null, buttons: [], typed: '', then: '' };
      this._editor = editor;

      const sheet = this._sheet;
      const { name, props } = this._controlFor(field, kind, value, sheet);
      const [control, save, cancel] = await Promise.all([
         slice.build(/** @type {any} */ (name), props),
         // The sheet saves with Enter and Tab, like a spreadsheet: no buttons.
         sheet ? null : slice.build('Button', { value: this._t('save'), icon: { name: 'check' }, variant: 'filled', size: 'sm', onClick: () => this.save() }),
         sheet ? null : slice.build('Button', { value: this._t('cancel'), variant: 'ghost', size: 'sm', onClick: () => this.cancelEdit() }),
      ]);
      if (!this._ready || this._editor !== editor) {
         for (const built of [control, save, cancel]) if (built) slice.controller.destroyComponent(built);
         return false;
      }
      editor.control = control;
      editor.buttons = [save, cancel].filter(Boolean);
      if (control) controlSlot.append(control);
      buttons.append(...editor.buttons);
      if (kind === 'select') control?.querySelector('input')?.setAttribute('aria-label', field.label);
      // Keys typed while the control was being built.
      if (editor.typed && control && 'value' in control && kind !== 'select') {
         control.value = `${control.value ?? ''}${editor.typed}`;
      }
      this._focusIn(controlSlot);
      // The caret at the end, as F2 leaves it in a spreadsheet.
      const field$ = /** @type {HTMLInputElement | null} */ (controlSlot.querySelector('input:not([type="hidden"]), textarea'));
      if (field$ && typeof field$.setSelectionRange === 'function' && ['text', 'search', 'url', 'tel', 'email', 'password', 'textarea'].includes(field$.type || 'textarea')) {
         try { field$.setSelectionRange(field$.value.length, field$.value.length); } catch { /* not a text field */ }
      }
      // Enter or Tab pressed before the editor was there: do it now.
      if (editor.then) this.save({ move: editor.then });
      return true;
   }

   // The control itself is shared with Table (shared/editing/inlineControl.js).
   _controlFor(field, kind, value, sheet = false) {
      return controlFor({
         kind, value, edit: field.edit || {}, label: field.label, compact: sheet,
         // preventDefault: focus goes back to the pencil, and the Enter must
         // not reach it as a click that opens the editor again. (The sheet
         // handles Enter itself: save, then down.)
         onEnter: sheet ? null : (_value, event) => {
            event?.preventDefault();
            this.save();
         },
         // The sheet saves a choice the moment it is made.
         onPick: sheet ? () => this.save() : null,
      });
   }

   _readControl(editor) {
      const field = this._cells.get(editor.id)?.field;
      return readControl(editor.control, editor.kind, field?.edit || {});
   }

   _closeEditor() {
      const editor = this._editor;
      if (!editor) return;
      this._editor = null;
      const cell = this._cells.get(editor.id);
      this._editingId = '';
      if (editor.control) slice.controller.destroyComponent(editor.control);
      for (const button of editor.buttons) slice.controller.destroyComponent(button);
      editor.box.remove();
      if (cell) {
         cell.row.classList.remove('is-editing', 'is-saving');
         cell.row.removeAttribute('aria-busy');
         cell.main.hidden = false;
         cell.painted = false;
      }
      if (this._ready) this._paint();
   }

   _setBusy(cell, on, editor) {
      if (on) this._busyIds.add(cell.id);
      else this._busyIds.delete(cell.id);
      cell.row.classList.toggle('is-saving', on);
      if (on) cell.row.setAttribute('aria-busy', 'true');
      else cell.row.removeAttribute('aria-busy');
      if (editor) {
         for (const button of editor.buttons) button.disabled = on;
         const save = editor.buttons[0];
         if (save) save.value = on ? this._t('saving') : this._t('save');
      }
      if (on) this._announce(this._t('saving'));
   }

   _showError(cell, message) {
      if (!cell?.error) return;
      cell.error.textContent = message;
      cell.error.hidden = !message;
      cell.row.classList.toggle('has-error', !!message);
   }

   // ── Events ─────────────────────────────────────────────────────

   _onClick(event) {
      // A click on a value of an editable field opens its editor (not on
      // links, buttons or controls inside it).
      const target = /** @type {HTMLElement} */ (event.target);
      if (this._sheet) {
         // The sheet: a click picks the cell; a double click edits it.
         const dd = /** @type {HTMLElement | null} */ (target.closest('[data-cell]'));
         const cell = dd ? this._cellOfDd(dd) : null;
         if (cell && cell.id !== this._editingId) {
            this._setActive(cell, !target.closest('a, button, input, textarea, slice-switch'));
         }
         return;
      }
      if (target.closest('a, button, input, textarea, slice-switch, .slice-description-list__editor')) return;
      const content = target.closest('.slice-description-list__content');
      if (!content) return;
      const row = /** @type {HTMLElement | null} */ (content.closest('.slice-description-list__field'));
      const cell = row ? this._cells.get(row.dataset.key) : null;
      if (cell && this._canEdit(cell.field) && this._editKind(cell.field) !== 'switch') this.edit(cell.id);
   }

   _onDoubleClick(event) {
      if (!this._sheet) return;
      const target = /** @type {HTMLElement} */ (event.target);
      if (target.closest('a, button, slice-switch, .slice-description-list__editor')) return;
      const dd = /** @type {HTMLElement | null} */ (target.closest('[data-cell]'));
      const cell = dd ? this._cellOfDd(dd) : null;
      if (cell && this._canEdit(cell.field)) this.edit(cell.id);
   }

   // The sheet saves an edit when focus leaves the cell, as a spreadsheet does.
   _onFocusOut(event) {
      const editor = this._editor;
      if (!this._sheet || !editor || !TEXT_KINDS.includes(editor.kind)) return;
      if (!editor.box.contains(/** @type {Node} */ (event.target))) return;
      const timer = setTimeout(() => {
         this._timers.delete(timer);
         if (this._editor !== editor || !editor.control) return;
         if (editor.box.contains(document.activeElement)) return;
         this.save({ blur: true });
      }, 0);
      this._timers.add(timer);
   }

   _onKeyDown(event) {
      const target = /** @type {HTMLElement} */ (event.target);
      const editor = this._editor;
      if (editor && editor.box.contains(target)) {
         if (event.key === 'Escape') {
            // Inside a Modal, Escape closes the editor, not the dialog.
            event.preventDefault();
            event.stopPropagation();
            this.cancelEdit();
         } else if (this._sheet && event.key === 'Tab') {
            event.preventDefault();
            this.save({ move: event.shiftKey ? 'prev' : 'next' });
         } else if (this._sheet && event.key === 'Enter' && event.altKey && editor.kind === 'textarea') {
            // Alt+Enter: a new line inside the cell, as in Excel.
            event.preventDefault();
            const area = /** @type {HTMLTextAreaElement} */ (target);
            area.setRangeText?.('\n', area.selectionStart, area.selectionEnd, 'end');
            area.dispatchEvent(new Event('input', { bubbles: true }));
         } else if (this._sheet && event.key === 'Enter' && !event.shiftKey && !event.altKey
            && !['select', 'date'].includes(editor.kind)) {
            // Enter saves and goes down, in a textarea too (Shift or Alt+Enter
            // for a new line), like a spreadsheet cell.
            event.preventDefault();
            this.save({ move: 'down' });
         } else if (!this._sheet && event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            this.save();
         }
         return;
      }
      if (!this._sheet) return;
      // Typed while the editor is still being built: keep it for the
      // editor, and a fast Enter, Tab or Escape for when it is there.
      if (editor && !editor.control) {
         if (this._printable(event)) {
            editor.typed += event.key;
            event.preventDefault();
         } else if (event.key === 'Enter' && (event.altKey || event.shiftKey) && editor.kind === 'textarea') {
            editor.typed += '\n';
            event.preventDefault();
         } else if (event.key === 'Enter' || event.key === 'Tab') {
            editor.then = event.key === 'Tab' ? (event.shiftKey ? 'prev' : 'next') : 'down';
            event.preventDefault();
         } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.cancelEdit();
         }
         return;
      }
      const dd = /** @type {HTMLElement | null} */ (target.closest?.('[data-cell]'));
      const cell = dd && this.$body.contains(dd) ? this._cellOfDd(dd) : null;
      if (!cell) return;
      this._onSheetKey(event, cell);
   }

   _onSheetKey(event, cell) {
      const key = event.key;
      const go = (direction) => {
         const next = this._move(cell, direction);
         if (next) this._setActive(next, true);
         return next;
      };
      const grid = this._layout === 'grid' && !this._narrow;
      const kind = this._canEdit(cell.field) ? this._editKind(cell.field) : '';

      if (key === 'ArrowDown' || key === 'ArrowUp') {
         event.preventDefault();
         go(key === 'ArrowDown' ? 'down' : 'up');
      } else if ((key === 'ArrowRight' || key === 'ArrowLeft') && grid) {
         event.preventDefault();
         go(key === 'ArrowRight' ? 'next' : 'prev');
      } else if (key === 'Home' || key === 'End') {
         event.preventDefault();
         go(key === 'Home' ? 'first' : 'last');
      } else if (key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey) {
         // At the first or last cell, Tab leaves the sheet as usual.
         if (go(event.shiftKey ? 'prev' : 'next')) event.preventDefault();
      } else if ((key === 'Enter' || key === 'F2' || key === ' ') && kind === 'switch') {
         event.preventDefault();
         this._toggleCell(cell);
      } else if ((key === 'Enter' || key === 'F2') && kind) {
         event.preventDefault();
         this.edit(cell.id);
      } else if (key === 'Enter') {
         event.preventDefault();
         go('down');
      } else if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'c' && !String(window.getSelection?.() || '')) {
         event.preventDefault();
         this._copy(cell);
      } else if ((key === 'Delete' || key === 'Backspace') && kind && kind !== 'switch' && !cell.field.edit?.required) {
         event.preventDefault();
         this._saveCell(cell, null, '');
      } else if (this._printable(event) && TEXT_KINDS.includes(kind)) {
         // Typing on a cell replaces its value, like a spreadsheet.
         event.preventDefault();
         this.edit(cell.id, { initial: event.key });
      }
   }

   _printable(event) {
      return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
   }

   // ── Sheet ──────────────────────────────────────────────────────

   /** The cells that can be visited, in reading order. */
   _navCells() {
      return [...this._cells.values()].filter((cell) => !cell.row.hidden && cell.dd
         && !(/** @type {HTMLElement | null} */ (cell.row.parentElement))?.hidden);
   }

   _cellOfDd(dd) {
      const row = /** @type {HTMLElement | null} */ (dd.closest('.slice-description-list__field'));
      return row ? this._cells.get(row.dataset.key) || null : null;
   }

   _move(cell, direction) {
      const cells = this._navCells();
      const index = cells.indexOf(cell);
      if (!cells.length) return null;
      if (direction === 'first') return cells[0];
      if (direction === 'last') return cells[cells.length - 1];
      if (direction === 'next') return cells[index + 1] || null;
      if (direction === 'prev') return index > 0 ? cells[index - 1] : null;
      // Up and down: in one column, the neighbour; in a grid, the cell
      // above or below, the nearest to this one's column.
      if (this._layout !== 'grid' || this._narrow) {
         return direction === 'down' ? cells[index + 1] || null : (index > 0 ? cells[index - 1] : null);
      }
      const from = cell.row.getBoundingClientRect();
      const fromX = from.left + from.width / 2;
      const down = direction === 'down';
      const candidates = cells.map((c) => ({ c, r: c.row.getBoundingClientRect() }))
         .filter(({ r }) => (down ? r.top >= from.bottom - 2 : r.bottom <= from.top + 2));
      if (!candidates.length) return null;
      const edge = down ? Math.min(...candidates.map(({ r }) => r.top)) : Math.max(...candidates.map(({ r }) => r.bottom));
      const line = candidates.filter(({ r }) => Math.abs((down ? r.top : r.bottom) - edge) < 3);
      line.sort((a, b) => Math.abs(a.r.left + a.r.width / 2 - fromX) - Math.abs(b.r.left + b.r.width / 2 - fromX));
      return line[0]?.c || null;
   }

   _setActive(cell, focus) {
      const previous = this._cells.get(this._activeId);
      if (previous && previous !== cell) {
         previous.dd.tabIndex = -1;
         previous.dd.classList.remove('is-active');
      }
      this._activeId = cell.id;
      cell.dd.tabIndex = 0;
      cell.dd.classList.add('is-active');
      if (focus) {
         cell.dd.focus({ preventScroll: true });
         cell.row.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      }
   }

   // Exactly one cell is the sheet's tab stop, even after rows hide or the
   // fields change.
   _syncActive() {
      const cells = this._navCells();
      if (!cells.length) return;
      let active = this._cells.get(this._activeId);
      if (!active || !cells.includes(active)) active = cells[0];
      for (const cell of this._cells.values()) {
         if (cell !== active && cell.dd) {
            cell.dd.tabIndex = -1;
            cell.dd.classList.remove('is-active');
         }
      }
      this._setActive(active, false);
   }

   /**
    * Save a value typed in the sheet: the cell shows it at once (busy while
    * `commit` runs), the active cell moves on, and a failure brings the old
    * value back with the message in the cell.
    */
   async _saveCell(cell, value, move, { focus = true } = {}) {
      const target = move ? this._move(cell, move) : null;
      const kind = this._canEdit(cell.field) ? this._editKind(cell.field) : '';
      this._closeEditor();
      const saving = this._save(cell, value);
      if (this._busyIds.has(cell.id) && kind !== 'switch') {
         this._discard(cell.content);
         cell.content.replaceChildren();
         const pending = document.createElement('span');
         pending.className = 'slice-description-list__text';
         pending.textContent = isEmpty(value) ? (cell.field.empty ?? this._t('empty')) : this._text(cell.field, value, this._current());
         cell.content.append(pending);
      }
      if (focus) this._setActive(target || cell, true);
      const saved = await saving;
      if (!saved && this._ready) {
         cell.painted = false;
         this._paint();
      }
      return saved;
   }

   _toggleCell(cell) {
      const item = this._current();
      if (!item) return;
      const on = cell.field.get(item) === true;
      const control = /** @type {any} */ (cell.content.querySelector('slice-switch'));
      if (control) {
         control.checked = !on;
         control.label = this._t(!on ? 'yes' : 'no');
      }
      this._saveCell(cell, !on, '');
   }

   // ── Helpers ────────────────────────────────────────────────────

   _focusIn(container) {
      const target = /** @type {HTMLElement | null} */ (container?.querySelector?.('input:not([type="hidden"]), textarea, button, a[href], [tabindex="0"]'));
      if (target) {
         target.focus();
         return true;
      }
      // The control may still be building.
      if (container && this._ready) {
         const timer = setTimeout(() => {
            this._timers.delete(timer);
            /** @type {HTMLElement | null} */ (container.querySelector?.('input:not([type="hidden"]), textarea, button'))?.focus();
         }, 60);
         this._timers.add(timer);
      }
      return false;
   }

   // After an editor closes, focus goes back to the pencil that opened it.
   _focusBack(cell) {
      /** @type {HTMLElement | null} */ (cell?.tools.querySelector('[data-tool="pen"]'))?.focus();
   }

   _announce(text) {
      this.$live.textContent = '';
      const timer = setTimeout(() => {
         this._timers.delete(timer);
         if (this._ready) this.$live.textContent = text;
      }, 30);
      this._timers.add(timer);
   }

   // Children are built after their slot; one that finishes after its slot
   // was discarded (a repaint, a destroy) is destroyed instead of kept.
   _mount(slot, name, props, onBuilt) {
      this._pending.add(slot);
      slice.build(/** @type {any} */ (name), props).then((component) => {
         this._pending.delete(slot);
         if (!component) return;
         if (slot.dataset.discarded || !this._ready) {
            slice.controller.destroyComponent(component);
            return;
         }
         slot.append(component);
         onBuilt?.(component);
      }).catch((error) => {
         this._pending.delete(slot);
         slice.logger?.warn?.('DescriptionList', `Could not build ${name}`, error);
      });
   }

   _discard(container) {
      for (const slot of this._pending) {
         if (container.contains(slot)) slot.dataset.discarded = 'true';
      }
      slice.controller.destroyByContainer(container);
   }

   _uid() {
      if (!this._id) this._id = `description-list-${Math.random().toString(36).slice(2, 9)}`;
      return this._id;
   }
}

customElements.define('slice-description-list', DescriptionList);
