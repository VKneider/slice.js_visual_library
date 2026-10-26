import { getter, read, readPath, writePath } from '../../shared/data/paths.js';
import { relativeTime, fullDate } from '../../shared/data/dates.js';
import { insertItem, patchItem, removeItems, restoreItems, revertItem } from '../../shared/data/collection.js';
import Selection from './parts/Selection.js';
import { groupItems } from './parts/grouping.js';
import { resolveActions, splitActions, confirmOf } from './parts/actions.js';
import Toolbar from './parts/Toolbar.js';

// DataList — a list of records an app works with: people, orders, tasks,
// files. Each item is a row (or a card) with a title, details, a status and
// actions; the list adds search, views, filters, sort, groups, selection,
// pages and the create / edit / delete of a CRUD.
//
// Where the items come from (one of three):
//   items: [...]               an array you own; set it again to change it
//   context: 'tasks'           a slice.context store: the list follows it, and
//                              add / update / remove write to it
//   load: async (query) => …   a server: called with { page, pageSize, search,
//                              filters, sort, view, signal }, returns
//                              { items, total } (or an array)
//
// What an item shows (a key, a path like 'owner.name', or (item) => value):
//   title, description, avatar, icon, image, meta, badge, tags, value,
//   timestamp — or renderItem(item) for the whole middle part.
//
// What opening an item shows: `detail` puts the whole record in a
// DescriptionList inside a drawer (or a dialog), with every field you list,
// editable where they say so; a saved edit updates the row too.
//
// Its own pieces live in parts/ (Selection, Toolbar, grouping, actions);
// what it shares with DescriptionList and Table lives in shared/data/ (see
// shared/README.md). The undo and error bar is an Alert.

const LAYOUTS = ['list', 'grid'];
const VARIANTS = ['outlined', 'separated', 'filled', 'ghost'];
const DENSITIES = ['compact', 'comfortable', 'spacious'];
const SELECTION = ['none', 'single', 'multiple'];
const PAGINATION = ['none', 'pages', 'load-more', 'infinite'];
const NARROW = 520;
const UNDO_MS = 5000;

const TEXTS = {
   label: 'List',
   search: 'Search',
   create: 'New',
   sortBy: 'Sort',
   ascending: 'Ascending',
   descending: 'Descending',
   any: 'Any',
   yes: 'Yes',
   no: 'No',
   clear: 'Clear',
   clearFilters: 'Clear search and filters',
   all: 'All',
   selectAll: 'Select all',
   selected: '{count} selected',
   selectItem: 'Select {title}',
   clearSelection: 'Clear selection',
   moreActions: 'More actions',
   loading: 'Loading…',
   loadMore: 'Load more',
   error: 'The list could not be loaded.',
   retry: 'Try again',
   end: 'That is everything.',
   empty: 'Nothing here yet',
   emptyText: '',
   noResults: 'Nothing matches',
   noResultsText: 'Try other words, or clear the search and filters.',
   count: '{count} items',
   countOf: '{shown} of {total}',
   removed: '{count} removed',
   removedOne: '“{title}” removed',
   undo: 'Undo',
   dismiss: 'Dismiss',
   saveError: 'The change could not be saved.',
   confirm: 'Confirm',
   cancel: 'Cancel',
   collapse: 'Hide {label}',
   expand: 'Show {label}',
   noGroup: 'Other',
   day_today: 'Today',
   day_yesterday: 'Yesterday',
   day_week: 'This week',
   day_month: 'This month',
   day_older: 'Older',
   day_future: 'Upcoming',
   day_none: 'No date',
   justNow: '',
};

function fill(template, values = {}) {
   return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function reducedMotion() {
   return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default class DataList extends HTMLElement {
   static _seq = 0;

   static props = {
      // Where the items come from.
      items: { type: 'array', default: [] },
      context: { type: 'string', default: '' },
      contextPath: { type: 'string', default: 'items' },
      load: { type: 'function', default: null },
      itemKey: { type: 'any', default: 'id' },

      // What each item shows.
      title: { type: 'any', default: 'title' },
      description: { type: 'any', default: null },
      avatar: { type: 'any', default: null },
      icon: { type: 'any', default: null },
      image: { type: 'any', default: null },
      meta: { type: 'array', default: [] },
      badge: { type: 'any', default: null },
      tags: { type: 'any', default: null },
      value: { type: 'any', default: null },
      timestamp: { type: 'any', default: null },
      renderItem: { type: 'function', default: null },

      // What a click on an item does.
      path: { type: 'any', default: null },
      href: { type: 'any', default: null },
      onItemClick: { type: 'function', default: null },
      // The whole record when an item is opened: { fields, sections, title,
      // description, actions, commit, as: 'drawer' | 'center' | 'sheet',
      // size, side, list: { ...DescriptionList props } }.
      detail: { type: 'object', default: null },

      // Actions, selection and bulk actions.
      actions: { type: 'any', default: null },
      selection: { type: 'string', default: 'none', allowedValues: SELECTION },
      selected: { type: 'array', default: [] },
      onSelectionChange: { type: 'function', default: null },
      bulkActions: { type: 'array', default: [] },
      createAction: { type: 'object', default: null },

      // Finding things.
      searchable: { type: 'boolean', default: false },
      search: { type: 'string', default: '' },
      searchFields: { type: 'array', default: [] },
      sortOptions: { type: 'array', default: [] },
      sort: { type: 'object', default: null },
      filters: { type: 'array', default: [] },
      filterValues: { type: 'object', default: null },
      views: { type: 'array', default: [] },
      view: { type: 'string', default: '' },
      showCounts: { type: 'boolean', default: true },
      groupBy: { type: 'any', default: null },
      groupLabel: { type: 'function', default: null },
      groupOrder: { type: 'any', default: null },
      collapsibleGroups: { type: 'boolean', default: false },
      onQueryChange: { type: 'function', default: null },

      // How many at a time.
      pagination: { type: 'any', default: 'none' },
      pageSize: { type: 'number', default: 20 },
      totalItems: { type: 'number', default: null },
      maxHeight: { type: 'string', default: '' },

      // States.
      loading: { type: 'boolean', default: false },
      error: { type: 'string', default: '' },
      emptyState: { type: 'object', default: null },

      // Looks.
      layout: { type: 'string', default: 'list', allowedValues: LAYOUTS },
      minItemWidth: { type: 'number', default: 260 },
      variant: { type: 'string', default: 'outlined', allowedValues: VARIANTS },
      density: { type: 'string', default: 'comfortable', allowedValues: DENSITIES },
      label: { type: 'string', default: '' },
      texts: { type: 'object', default: null },
      stateKey: { type: 'string', default: '' },
      onError: { type: 'function', default: null },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.classList.add('slice-data-list');

      this.$toolbar = this.querySelector('.slice-data-list__toolbar');
      this.$bulk = this.querySelector('.slice-data-list__bulk');
      this.$selectAll = /** @type {HTMLInputElement} */ (this.querySelector('.slice-data-list__select-all-box'));
      this.$bulkText = this.querySelector('.slice-data-list__bulk-text');
      this.$bulkActions = this.querySelector('.slice-data-list__bulk-actions');
      this.$bulkClear = /** @type {HTMLButtonElement} */ (this.querySelector('.slice-data-list__bulk-clear'));
      this.$notice = this.querySelector('.slice-data-list__notice');
      this.$body = this.querySelector('.slice-data-list__body');
      this.$items = this.querySelector('.slice-data-list__items');
      this.$state = this.querySelector('.slice-data-list__state');
      this.$sentinel = this.querySelector('.slice-data-list__sentinel');
      this.$footer = this.querySelector('.slice-data-list__footer');
      this.$summary = this.querySelector('.slice-data-list__summary');
      this.$more = this.querySelector('.slice-data-list__more');
      this.$pager = this.querySelector('.slice-data-list__pager');
      this.$live = this.querySelector('.slice-data-list__live');

      // What an item shows (see the props).
      this._title = 'title';
      this._description = null;
      this._avatar = null;
      this._icon = null;
      this._image = null;
      this._badge = null;
      this._tags = null;
      this._value = null;
      this._timestamp = null;
      this._renderItem = null;
      this._path = null;
      this._href = null;
      this._actions = null;
      this._meta = [];
      this._onItemClick = null;
      this._detail = null;
      this._detailOpen = null;   // { key, modal, view } while a detail is open
      this._groupBy = null;
      this._groupLabel = null;
      this._groupOrder = null;
      this._collapsibleGroups = false;
      this._showCounts = true;
      this._emptyState = null;
      this._onQueryChange = null;
      this._onError = null;
      this._stateKey = '';
      this._onSelectionChange = null;
      this._bulkActions = [];
      this._createAction = null;
      this._searchable = false;
      this._searchFields = [];
      this._sortOptions = [];
      this._initialSort = null;
      this._filters = [];
      this._viewsList = [];
      this._paging = 'none';
      this._pageSize = 20;
      this._totalItemsProp = null;
      this._loading = false;
      this._errorText = '';
      this._layout = 'list';
      this._variant = 'outlined';
      this._density = 'comfortable';
      this._minItemWidth = 260;
      this._maxHeight = '';
      this._label = '';
      this._context = '';
      this._contextPath = 'items';
      this._contextWatch = null;
      this._load = null;
      this._itemKey = 'id';
      this._feed = null;
      this._feedDone = false;
      this._lastResult = null;
      this._abort = null;
      this._loadWatch = null;   // unsubscribe from a QueryService load
      this._alert = null;          // the undo / error bar (an Alert)
      this._noticeExpire = null;   // what makes the current undo final
      /** @type {WeakMap<Element, any>} row element → item key */
      this._rowKeys = new WeakMap();

      this._texts = { ...TEXTS };
      this._items = [];
      this._keyOf = getter('id');
      // Not `_selection`: Slice clears `_<prop>` for every prop on build, so
      // internal state never uses a prop's name.
      this._picked = new Selection('none');
      this._search = '';
      this._viewId = '';
      /** @type {Record<string, any[]>} */
      this._filterValues = {};
      /** @type {{ index: number, direction: 'asc' | 'desc' } | null} */
      this._sort = null;
      this._page = 1;
      this._revealed = 0;
      this._visible = [];      // every item that passes the query, sorted (local)
      this._shown = [];        // the items on screen
      this._total = 0;
      this._remoteItems = [];
      this._remoteTotal = null;
      this._fetchState = 'idle';  // idle | loading | error
      this._fetchError = null;
      this._busy = new Set();
      this._collapsed = new Set();
      /** @type {Map<any, { item: any, el: HTMLElement, rev: number }>} */
      this._rows = new Map();
      this._rowRev = 0;
      this._pending = new Set();
      this._built = {};
      this._ready = false;
      this._narrow = false;

      this._onBodyClick = this._onBodyClick.bind(this);
      this._onBodyChange = this._onBodyChange.bind(this);
      this._onKeyDown = this._onKeyDown.bind(this);

      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this._applyLooks();
      this._restoreState();
      this._engine = await slice.build('DataGridEngine', {
         sliceId: `slice-data-list-engine-${++DataList._seq}`,
         data: [],
         pageSize: this._pageSize,
      });
      this._ready = true;

      this.$items.addEventListener('click', this._onBodyClick);
      this.$items.addEventListener('change', this._onBodyChange);
      this.addEventListener('keydown', this._onKeyDown);
      this.$selectAll.addEventListener('change', () => this._toggleAllVisible());
      this.$bulkClear.addEventListener('click', () => this.clearSelection());
      // The undo and error bar is an Alert, built once and reused.
      this._alert = /** @type {any} */ (await slice.build(/** @type {any} */ ('Alert'), {
         open: false, size: 'sm', tone: 'neutral', variant: 'filled', dismissible: true, dismissLabel: this._t('dismiss'),
      }));
      if (this._alert) this.$notice.append(this._alert);

      this._resize = new ResizeObserver(() => {
         const narrow = this.clientWidth > 0 && this.clientWidth < NARROW;
         if (narrow !== this._narrow) {
            this._narrow = narrow;
            this.classList.toggle('is-narrow', narrow);
            this._rowRev += 1;
            this._renderItems();
         }
      });
      this._resize.observe(this);

      if (this._context) this._watchContext();
      this._toolbar = new Toolbar(this);
      await this._renderToolbar();
      // A `load` from QueryService says when its data went stale (after a
      // change somewhere else): ask again, keeping what is on screen.
      if (typeof this._load?.subscribe === 'function') this._loadWatch = this._load.subscribe(() => this.refresh());
      this._query({ reason: 'init' });
      // After the first rows are on screen, so "is the end in view?" is
      // asked of the real list.
      await this._setupPaging();
   }

   // Slice lifecycle: a cached route came back, and the data may have
   // changed meanwhile. (This is why the CRUD methods are addItem,
   // updateItem and removeItem: update() belongs to the framework.)
   update() {
      if (this._ready) this.refresh();
   }

   beforeDestroy() {
      this._ready = false;
      this._loadWatch?.();
      this._loadWatch = null;
      this.closeDetail();
      this._resize?.disconnect();
      this._abort?.abort();
      clearTimeout(this._saveTimer);
      // Leaving settles a waiting undo, as the time running out would.
      this._flushNotice();
      if (this._alert) slice.controller.destroyComponent(this._alert);
      this._alert = null;
      this._feed?.destroy();
      this._feed = null;
      this._toolbar?.destroy();
      for (const key of Object.keys(this._built)) {
         const component = this._built[key];
         if (component?.sliceId) slice.controller.destroyComponent(component);
      }
      this._built = {};
      this._discard(this.$items);
      this._discard(this.$bulkActions);
      this._discard(this.$state);
      if (this._engine) slice.controller.destroyComponent(this._engine);
      this._engine = null;
   }

   // ── Props ──────────────────────────────────────────────────────

   get items() { return this._source(); }
   set items(value) {
      this._items = Array.isArray(value) ? value : [];
      if (this._ready && !this._context && !this._remote) this._query({ reason: 'data', keepPage: true });
   }

   get context() { return this._context; }
   set context(value) { this._context = value ? String(value) : ''; }

   get contextPath() { return this._contextPath; }
   set contextPath(value) { this._contextPath = value ?? 'items'; }

   get load() { return this._load; }
   set load(value) { this._load = typeof value === 'function' ? value : null; }

   get itemKey() { return this._itemKey; }
   set itemKey(value) {
      this._itemKey = value ?? 'id';
      this._keyOf = getter(this._itemKey) || ((item) => item);
   }

   // What an item shows and does: store it, redraw the rows.
   get title() { return this._title; }
   set title(value) { this._title = value ?? null; this._redrawRows(); }
   get description() { return this._description; }
   set description(value) { this._description = value ?? null; this._redrawRows(); }
   get avatar() { return this._avatar; }
   set avatar(value) { this._avatar = value ?? null; this._redrawRows(); }
   get icon() { return this._icon; }
   set icon(value) { this._icon = value ?? null; this._redrawRows(); }
   get image() { return this._image; }
   set image(value) { this._image = value ?? null; this._redrawRows(); }
   get badge() { return this._badge; }
   set badge(value) { this._badge = value ?? null; this._redrawRows(); }
   get tags() { return this._tags; }
   set tags(value) { this._tags = value ?? null; this._redrawRows(); }
   get value() { return this._value; }
   set value(value) { this._value = value ?? null; this._redrawRows(); }
   get timestamp() { return this._timestamp; }
   set timestamp(value) { this._timestamp = value ?? null; this._redrawRows(); }
   get renderItem() { return this._renderItem; }
   set renderItem(value) { this._renderItem = value ?? null; this._redrawRows(); }
   get path() { return this._path; }
   set path(value) { this._path = value ?? null; this._redrawRows(); }
   get href() { return this._href; }
   set href(value) { this._href = value ?? null; this._redrawRows(); }
   get actions() { return this._actions; }
   set actions(value) { this._actions = value ?? null; this._redrawRows(); }
   get meta() { return this._meta; }
   set meta(value) { this._meta = value ?? null; this._redrawRows(); }
   get onItemClick() { return this._onItemClick; }
   set onItemClick(value) { this._onItemClick = value ?? null; this._redrawRows(); }
   get detail() { return this._detail; }
   set detail(value) {
      this._detail = value && typeof value === 'object' ? value : null;
      this._redrawRows();
   }

   // Groups: store, redraw.
   get groupBy() { return this._groupBy; }
   set groupBy(value) { this._groupBy = value ?? null; this._ready && this._renderItems(); }
   get groupLabel() { return this._groupLabel; }
   set groupLabel(value) { this._groupLabel = value ?? null; this._ready && this._renderItems(); }
   get groupOrder() { return this._groupOrder; }
   set groupOrder(value) { this._groupOrder = value ?? null; this._ready && this._renderItems(); }
   get collapsibleGroups() { return this._collapsibleGroups; }
   set collapsibleGroups(value) { this._collapsibleGroups = value ?? null; this._ready && this._renderItems(); }

   // Kept as given.
   get showCounts() { return this._showCounts; }
   set showCounts(value) { this._showCounts = value ?? null; }
   get emptyState() { return this._emptyState; }
   set emptyState(value) { this._emptyState = value ?? null; }
   get onQueryChange() { return this._onQueryChange; }
   set onQueryChange(value) { this._onQueryChange = value ?? null; }
   get onError() { return this._onError; }
   set onError(value) { this._onError = value ?? null; }
   get stateKey() { return this._stateKey; }
   set stateKey(value) { this._stateKey = value ?? null; }

   _redrawRows() {
      if (!this._ready) return;
      this._rowRev += 1;
      this._renderItems();
   }


   get selection() { return this._picked.mode; }
   set selection(value) {
      this._picked.mode = SELECTION.includes(value) ? value : 'none';
      if (this._picked.mode === 'none') this._picked.clear();
      this.dataset.selection = this._picked.mode;
      if (this._ready) { this._rowRev += 1; this._render(); }
   }

   get selected() { return this._picked.toArray(); }
   set selected(value) {
      this._picked.set(Array.isArray(value) ? value : []);
      this._ready && this._paintSelection();
   }

   get onSelectionChange() { return this._onSelectionChange; }
   set onSelectionChange(value) { this._onSelectionChange = typeof value === 'function' ? value : null; }

   get bulkActions() { return this._bulkActions; }
   set bulkActions(value) { this._bulkActions = Array.isArray(value) ? value : []; this._ready && this._renderBulk(true); }

   get createAction() { return this._createAction; }
   set createAction(value) { this._createAction = value && typeof value === 'object' ? value : null; this._ready && this._renderToolbar(); }

   get searchable() { return this._searchable; }
   set searchable(value) { this._searchable = value === true; this._ready && this._renderToolbar(); }

   get search() { return this._search; }
   set search(value) {
      this._search = value ? String(value) : '';
      if (this._ready) {
         if (this._toolbar?.input && this._toolbar.input.value !== this._search) this._toolbar.input.value = this._search;
         this._query({ reason: 'search' });
      }
   }

   get searchFields() { return this._searchFields; }
   set searchFields(value) { this._searchFields = Array.isArray(value) ? value : []; }

   get sortOptions() { return this._sortOptions; }
   set sortOptions(value) { this._sortOptions = Array.isArray(value) ? value.filter((o) => o && (o.key || o.value)) : []; this._ready && this._renderToolbar(); }

   get sort() {
      if (!this._sort) return null;
      const option = this._sortOptions?.[this._sort.index];
      return option ? { key: option.key, direction: this._sort.direction } : null;
   }
   set sort(value) {
      this._initialSort = value;
      if (!value) { this._sort = null; }
      else {
         const index = (this._sortOptions || []).findIndex((o) => o.key === value.key);
         this._sort = index >= 0 ? { index, direction: value.direction === 'desc' ? 'desc' : 'asc' } : null;
      }
      if (this._ready) { this._toolbar?.sync(); this._query({ reason: 'sort' }); }
   }

   get filters() { return this._filters; }
   set filters(value) { this._filters = Array.isArray(value) ? value.filter((f) => f && f.key) : []; this._ready && this._renderToolbar(); }

   get filterValues() { return { ...this._filterValues }; }
   set filterValues(value) {
      this._filterValues = {};
      for (const [key, values] of Object.entries(value || {})) {
         this._filterValues[key] = Array.isArray(values) ? values : values === undefined || values === null ? [] : [values];
      }
      if (this._ready) { this._toolbar?.sync(); this._query({ reason: 'filter' }); }
   }

   get views() { return this._viewsList; }
   set views(value) {
      this._viewsList = Array.isArray(value) ? value : [];
      if (!this._ready) return;
      // The current view may be gone: fall back to the first.
      if (!this._viewList().some((v) => v.id === this._viewId)) this._viewId = this._viewList()[0]?.id ?? '';
      this._renderToolbar();
      this._query({ reason: 'view' });
   }

   get view() { return this._viewId; }
   set view(value) {
      this._viewId = value ? String(value) : '';
      if (this._ready) { this._toolbar?.sync(); this._query({ reason: 'view' }); }
   }

   get pagination() { return this._paging; }
   /** @param {any} value true, { pageSize }, 'pages', 'load-more', 'infinite' or 'none' */
   set pagination(value) {
      this._paging = value === true || (value && typeof value === 'object') ? 'pages'
         : PAGINATION.includes(value) ? value : 'none';
      if (value && typeof value === 'object' && value.pageSize > 0) this._pageSize = value.pageSize;
      if (this._ready) { this._setupPaging(); this._query({ reason: 'pagination' }); }
   }

   get pageSize() { return this._pageSize; }
   set pageSize(value) { this._pageSize = Math.max(1, Number(value) || 20); }

   get page() { return this._page; }

   get loading() { return this._loading; }
   set loading(value) { this._loading = value === true; this._ready && this._render(); }

   get error() { return this._errorText; }
   set error(value) { this._errorText = value ? String(value) : ''; this._ready && this._render(); }

   get layout() { return this._layout; }
   set layout(value) { this._layout = LAYOUTS.includes(value) ? value : 'list'; this._applyLooks(); }

   get variant() { return this._variant; }
   set variant(value) { this._variant = VARIANTS.includes(value) ? value : 'outlined'; this._applyLooks(); }

   get density() { return this._density; }
   set density(value) { this._density = DENSITIES.includes(value) ? value : 'comfortable'; this._applyLooks(); }

   get minItemWidth() { return this._minItemWidth; }
   set minItemWidth(value) { this._minItemWidth = Math.max(120, Number(value) || 260); this._applyLooks(); }

   get maxHeight() { return this._maxHeight; }
   set maxHeight(value) { this._maxHeight = value ? String(value) : ''; this._applyLooks(); }

   get label() { return this._label; }
   set label(value) { this._label = value ? String(value) : ''; this._applyLooks(); }

   get texts() { return this._texts; }
   set texts(value) { this._texts = { ...TEXTS, ...(value && typeof value === 'object' ? value : {}) }; if (this._ready) { this._rowRev += 1; this._renderToolbar(); this._render(); } }

   // ── Reading the list ───────────────────────────────────────────

   /** Every item the list holds (all of them locally, the loaded ones remotely). */
   getItems() { return this._remote ? this._remoteItems.slice() : this._source().slice(); }

   /** The items that pass the search, view and filters, in order. */
   getVisibleItems() { return this._remote ? this._remoteItems.slice() : this._visible.slice(); }

   /** The selected items. */
   getSelectedItems() {
      const keys = this._picked.keys;
      return this.getItems().filter((item) => keys.has(this._keyOf(item)));
   }

   /** The item with this key. */
   getItem(key) { return this.getItems().find((item) => this._keyOf(item) === key) ?? null; }

   // ── Detail ─────────────────────────────────────────────────────

   /**
    * Open an item's detail: the record in a DescriptionList, in a drawer.
    * Resolves when it closes. Edits saved there update the row (through
    * `detail.commit`, like updateItem's commit).
    * @param {any} key
    */
   async openDetail(key) {
      const item = this.getItem(key);
      if (!item || !this._ready) return false;
      this.closeDetail();
      const detail = this._detail || {};
      const token = {};
      this._detailOpen = /** @type {any} */ ({ key, token, modal: null, view: null });

      const view = /** @type {any} */ (await slice.build(/** @type {any} */ ('DescriptionList'), {
         variant: 'separated',
         ...(detail.list || {}),
         item,
         fields: detail.fields || [],
         sections: detail.sections || [],
         actions: (detail.actions || []).map((action) => ({
            ...action,
            onClick: ({ item: current, event }) => action.onClick?.({ item: current, list: this, detail: view, event, close: () => this.closeDetail() }),
         })),
         commit: (change) => this._saveFromDetail(key, change),
      }));
      if (!view) return false;
      if (this._detailOpen?.token !== token || !this._ready) {
         slice.controller.destroyComponent(view);
         return false;
      }
      const modal = /** @type {any} */ (await slice.build('Modal', {
         title: this._detailText(detail.title ?? this._title, item),
         description: this._detailText(detail.description, item),
         layout: ['drawer', 'center', 'sheet', 'fullscreen'].includes(detail.as) ? detail.as : 'drawer',
         side: detail.side || 'right',
         size: detail.size || 'md',
         mobileLayout: 'sheet',
         destroyOnClose: true,
         content: [view],
         onClose: () => {
            if (this._detailOpen?.token === token) this._detailOpen = null;
         },
      }));
      if (!modal || this._detailOpen?.token !== token || !this._ready) {
         if (modal) slice.controller.destroyComponent(modal);
         slice.controller.destroyComponent(view);
         return false;
      }
      this._detailOpen.modal = modal;
      this._detailOpen.view = view;
      document.body.append(modal);
      await modal.show();
      return true;
   }

   /** Close the open detail, if any. */
   closeDetail() {
      const open = this._detailOpen;
      this._detailOpen = null;
      if (open?.modal?.isConnected) open.modal.close();
   }

   /** The key of the item whose detail is open (null when none). */
   get detailKey() { return this._detailOpen ? this._detailOpen.key : null; }

   async _saveFromDetail(key, { value, previous, item: next, key: field }) {
      const detail = this._detail || {};
      let failure = null;
      const commit = typeof detail.commit === 'function'
         ? async () => {
            try {
               return await detail.commit({ key: field, value, previous, item: next });
            } catch (error) {
               failure = error;
               throw error;
            }
         }
         : undefined;
      const ok = await this.updateItem(key, () => next, { commit });
      if (!ok) throw failure || new Error('');
      return this.getItem(key);
   }

   // The record changed (a store update, another edit): the open detail follows.
   _syncDetail() {
      const open = this._detailOpen;
      if (!open?.view) return;
      const item = this.getItem(open.key);
      if (!item) {
         this.closeDetail();
         return;
      }
      if (open.view.item !== item) open.view.item = item;
      const title = this._detailText(this._detail?.title ?? this._title, item);
      if (open.modal && open.modal.title !== title) open.modal.title = title;
   }

   _detailText(spec, item) {
      const value = read(item, spec);
      return value === null || value === undefined ? '' : String(value);
   }

   /** The query as it stands: { search, view, filters, sort, page, pageSize }. */
   get query() {
      return {
         search: this._search,
         view: this._viewId,
         filters: this._activeFilters(),
         sort: this.sort,
         page: this._page,
         pageSize: this._pageSize,
      };
   }

   // ── Changing the selection ─────────────────────────────────────

   select(keys) {
      this._picked.set(keys);
      this._paintSelection();
      this._emitSelection();
   }

   clearSelection() {
      this._picked.clear();
      this._paintSelection();
      this._emitSelection();
   }

   // ── CRUD ───────────────────────────────────────────────────────

   /**
    * Add an item. It shows at once; with `commit`, a failure takes it out
    * again and says so.
    * @param {any} item
    * @param {{ position?: 'start' | 'end' | number, commit?: () => any, highlight?: boolean }} [options]
    */
   async addItem(item, { position = 'start', commit, highlight = true } = {}) {
      const key = this._keyOf(item);
      this._write((list) => insertItem(list, item, position));
      if (highlight) this._highlight(key);
      if (!commit) return true;
      this._setBusy(key, true);
      try {
         const saved = await commit();
         this._setBusy(key, false);
         // The server's version (with its id, its dates) replaces ours.
         if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
            this._write((list) => list.map((it) => (this._keyOf(it) === key ? { ...it, ...saved } : it)));
         }
         return true;
      } catch (error) {
         this._setBusy(key, false);
         this._write((list) => removeItems(list, this._keyOf, [key]).list);
         this._failed(error, 'add', item);
         return false;
      }
   }

   /**
    * Change an item: `changes` are merged into it (or a function from the item
    * to them). With `commit`, a failure puts it back as it was.
    * @param {any} key
    * @param {object | ((item: any) => object)} changes
    * @param {{ commit?: (after: any, before: any) => any }} [options]
    */
   async updateItem(key, changes, { commit } = {}) {
      let result = null;
      this._write((list) => {
         result = patchItem(list, this._keyOf, key, changes);
         return result ? result.list : list;
      });
      if (!result) return false;
      if (!commit) return true;
      const { before, after } = result;
      this._setBusy(key, true);
      try {
         const saved = await commit(after, before);
         this._setBusy(key, false);
         if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
            this._write((list) => list.map((it) => (this._keyOf(it) === key ? { ...it, ...saved } : it)));
         }
         return true;
      } catch (error) {
         this._setBusy(key, false);
         this._write((list) => revertItem(list, this._keyOf, before));
         this._failed(error, 'update', before);
         return false;
      }
   }

   /**
    * Remove items. They leave at once. With `undo`, a bar offers to bring
    * them back for a few seconds, and `commit` runs only when that time is
    * over; without it, `commit` runs right away. A failed commit brings them
    * back.
    * @param {any | any[]} keys
    * @param {{ commit?: (items: any[]) => any, undo?: boolean }} [options]
    */
   async removeItem(keys, { commit, undo = false } = {}) {
      const list = Array.isArray(keys) ? keys : [keys];
      // A previous removal still waiting for its undo time: settle it first.
      await this._flushNotice();
      let removed = [];
      await this._animateOut(list);
      this._write((items) => {
         const result = removeItems(items, this._keyOf, list);
         removed = result.removed;
         return result.list;
      });
      if (!removed.length) return false;
      for (const key of list) this._picked.keys.delete(key);
      this._emitSelection();
      const gone = removed.map((r) => r.item);

      const persist = async () => {
         if (!commit) return true;
         try {
            await commit(gone);
            return true;
         } catch (error) {
            this._write((items) => restoreItems(items, removed));
            this._failed(error, 'remove', gone);
            return false;
         }
      };

      if (!undo) return persist();

      const title = gone.length === 1 ? String(read(gone[0], this._title) ?? '') : '';
      return new Promise((resolve) => {
         this._showNotice({
            text: gone.length === 1 && title ? this._t('removedOne', { title }) : this._t('removed', { count: gone.length }),
            actionLabel: this._t('undo'),
            action: () => {
               this._write((items) => restoreItems(items, removed));
               this._hideNotice(false);
               resolve(false);
            },
            timeout: UNDO_MS,
            // When the time is over (or the bar is closed): make it final.
            onExpire: async () => resolve(await persist()),
         });
      });
   }

   /** Load again: the current page from the server, or redraw local data. */
   refresh() {
      if (!this._ready) return;
      if (this._remote) this._query({ reason: 'refresh', keepPage: true });
      else this._query({ reason: 'refresh', keepPage: true });
   }

   /** Scroll an item into view and give it the focus. */
   focusItem(key) {
      const row = this._rows.get(key)?.el;
      if (!row) return;
      row.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      /** @type {HTMLElement} */ (row.querySelector('[data-row-focus]') || row)?.focus({ preventScroll: true });
   }

   // ── Where the data lives ───────────────────────────────────────

   get _remote() { return typeof this._load === 'function'; }

   _source() {
      if (this._context && typeof slice !== 'undefined' && slice.context?.getState) {
         const state = slice.context.getState(this._context);
         const value = readPath(state, Array.isArray(state) ? '' : this._contextPath);
         return Array.isArray(value) ? value : [];
      }
      return this._items;
   }

   // Apply a change to wherever the items live: the context (other
   // components see it too), the `items` array, or the loaded page.
   _write(change) {
      if (this._remote) {
         this._remoteItems = change(this._remoteItems.slice());
         this._render();
         return;
      }
      if (this._context && slice.context?.setState) {
         slice.context.setState(this._context, (prev) => {
            const path = Array.isArray(prev) ? '' : this._contextPath;
            const current = readPath(prev, path);
            return writePath(prev, path, change(Array.isArray(current) ? current : []));
         });
         // The watcher redraws; with no watcher (context created later), do it here.
         if (!this._contextWatch) this._query({ reason: 'data', keepPage: true });
         return;
      }
      this._items = change(this._items.slice());
      this._query({ reason: 'data', keepPage: true });
   }

   _watchContext() {
      if (!slice.context?.watch || !slice.context.has?.(this._context)) {
         slice.logger?.logWarning?.('DataList', `The context "${this._context}" does not exist. Create it with slice.context.create().`);
         return;
      }
      this._contextWatch = slice.context.watch(this._context, this, () => {
         if (this._ready) this._query({ reason: 'data', keepPage: true });
      }, (state) => readPath(state, Array.isArray(state) ? '' : this._contextPath));
   }

   // ── The query ──────────────────────────────────────────────────

   _viewList() {
      return (this._viewsList || []).map((view, index) => ({ ...view, id: String(view.id ?? view.value ?? view.label ?? index) }));
   }

   _currentView() {
      const views = this._viewList();
      return views.find((v) => v.id === this._viewId) || null;
   }

   _filterDefs() { return this._filters || []; }

   // The options of a filter: given, or the distinct values in the data.
   _filterOptions(filter) {
      if (Array.isArray(filter.options)) {
         return filter.options.map((o) => (o && typeof o === 'object' ? { value: o.value, label: String(o.label ?? o.value) } : { value: o, label: String(o) }));
      }
      if (this._remote) return [];
      const get = getter(filter.value ?? filter.key);
      const counts = new Map();
      for (const item of this._source()) {
         const raw = get(item);
         for (const v of Array.isArray(raw) ? raw : [raw]) {
            if (v === undefined || v === null || v === '') continue;
            counts.set(v, (counts.get(v) || 0) + 1);
         }
      }
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      return [...counts.entries()]
         .sort((a, b) => collator.compare(String(a[0]), String(b[0])))
         .map(([value, count]) => ({ value, label: String(value), count }));
   }

   _activeFilters() {
      const out = [];
      for (const filter of this._filterDefs()) {
         const values = this._filterValues[filter.key] ?? [];
         if (values.length) out.push({ key: filter.key, values: values.slice() });
      }
      return out;
   }

   _matchesFilters(item) {
      for (const filter of this._filterDefs()) {
         const values = this._filterValues[filter.key] ?? [];
         if (!values.length) continue;
         if (typeof filter.match === 'function') {
            if (!filter.match(item, values)) return false;
            continue;
         }
         const raw = read(item, filter.value ?? filter.key);
         if (filter.type === 'boolean') {
            if (!!raw !== values[0]) return false;
            continue;
         }
         const list = Array.isArray(raw) ? raw : [raw];
         if (!list.some((v) => values.includes(v))) return false;
      }
      return true;
   }

   _searchGetters() {
      const fields = this._searchFields?.length
         ? this._searchFields
         : [this._title, this._description, ...(this._meta || []).map((m) => (m && typeof m === 'object' ? m.value : m)), this._tags];
      return fields.map((f) => getter(f)).filter(Boolean).map((get) => (item) => {
         const value = get(item);
         return Array.isArray(value) ? value.map((v) => (v && typeof v === 'object' ? v.label ?? '' : v)).join(' ') : value;
      });
   }

   _viewCounts() {
      const views = this._viewList();
      if (!views.length || this._remote) {
         // Remote: counts only when the view brings its own.
         const given = views.filter((v) => typeof v.count === 'number');
         return given.length ? new Map(given.map((v) => [v.id, v.count])) : null;
      }
      const all = this._source();
      return new Map(views.map((view) => [view.id, typeof view.filter === 'function' ? all.filter(view.filter).length : all.length]));
   }

   _sortSpec() {
      if (!this._sort) return null;
      const option = this._sortOptions[this._sort.index];
      if (!option) return null;
      const get = typeof option.compare === 'function' ? null : getter(option.value ?? option.key);
      return {
         key: String(option.key ?? option.label),
         direction: this._sort.direction,
         accessor: get ? (item) => {
            const v = get(item);
            return v instanceof Date ? v.getTime() : v;
         } : undefined,
         comparator: typeof option.compare === 'function' ? option.compare : undefined,
      };
   }

   /**
    * Work out what is on screen. `reason` says why: a new search (back to
    * page 1), new data (stay on the page), and so on.
    * @param {{ reason?: string, keepPage?: boolean }} [options]
    */
   _query({ reason, keepPage = false } = {}) {
      if (!this._ready) return;
      const userChange = ['search', 'view', 'filter', 'sort'].includes(reason);
      if (!keepPage) this._page = 1;
      if (userChange) {
         this._saveState();
         this._onQueryChange?.(this.query);
      }

      if (this._remote) {
         if (this._paging === 'load-more' || this._paging === 'infinite') {
            if (reason !== 'data') this._feed?.reset();
         } else {
            this._fetch();
         }
         this._toolbar?.sync();
         return;
      }

      const view = this._currentView();
      const base = this._source();
      const viewed = view && typeof view.filter === 'function' ? base.filter(view.filter) : base;
      const filtered = this._filterDefs().length ? viewed.filter((item) => this._matchesFilters(item)) : viewed;
      const engine = this._engine;
      engine.setData(filtered);
      engine.setSearch(this._search, this._searchGetters());
      engine.setSort(this._sortSpec());
      this._visible = engine.sortedRows();
      this._total = this._visible.length;

      // Keys that are gone leave the selection.
      if (this._picked.size && reason === 'data') {
         const valid = new Set(base.map((item) => this._keyOf(item)));
         if (this._picked.prune(valid)) this._emitSelection();
      }

      if (this._paging === 'pages') {
         engine.setPageSize(this._pageSize);
         engine.setPage(this._page);
         this._page = engine.page;
         this._shown = engine.pageRows();
      } else if (this._paging === 'load-more' || this._paging === 'infinite') {
         // A new query starts from the first slice; new data keeps what was shown.
         if (!keepPage || !this._revealed) this._revealed = this._pageSize;
         this._revealed = Math.min(this._revealed, Math.max(this._pageSize, this._total));
         this._shown = this._visible.slice(0, this._revealed);
         // The feed may have reached the end of the old query: start it again,
         // and, once the rows are drawn, let it check whether the end of the
         // list is in view.
         if (this._feed && (!keepPage || this._feed.done)) {
            const feed = this._feed;
            feed.reset({ load: false });
            requestAnimationFrame(() => { if (this._feed === feed) feed.resume(); });
         }
      } else {
         this._shown = this._visible;
      }
      this._toolbar?.sync();
      this._render();
   }

   // Remote, one page at a time.
   async _fetch() {
      this._abort?.abort();
      const controller = new AbortController();
      this._abort = controller;
      this._fetchState = 'loading';
      this._fetchError = null;
      this._render();
      try {
         const result = await this._load({ ...this.query, signal: controller.signal, cursor: null });
         if (controller !== this._abort) return;
         this._acceptResult(result, { replace: true });
         this._fetchState = 'idle';
      } catch (error) {
         if (controller !== this._abort || error?.name === 'AbortError') return;
         this._fetchState = 'error';
         this._fetchError = error;
         this._onError?.(error, { type: 'load' });
      }
      this._render();
   }

   _acceptResult(result, { replace }) {
      const items = Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : [];
      const total = result && !Array.isArray(result) && Number.isFinite(result.total) ? result.total : null;
      this._remoteItems = replace ? items.slice() : this._remoteItems.concat(items);
      this._remoteTotal = total ?? this._totalItemsProp ?? null;
      if (this._picked.size && replace) {
         // Keep the selection: keys from other pages are still selected.
      }
      return items;
   }

   get totalItems() { return this._remote ? this._remoteTotal : this._total; }
   set totalItems(value) { this._totalItemsProp = Number.isFinite(value) ? value : null; }

   // ── Pages, "load more" and infinite scrolling ──────────────────

   async _setupPaging() {
      this._feed?.destroy();
      this._feed = null;
      this.dataset.pagination = this._paging;
      if (this._paging !== 'load-more' && this._paging !== 'infinite') return;
      const scroller = await slice.build(/** @type {any} */ ('InfiniteScrollService'), { singleton: true });
      if (!this._ready) return;
      this._feed = scroller.attach(this.$sentinel, {
         root: this._maxHeight ? this.$body : null,
         rootMargin: '400px',
         auto: this._paging === 'infinite',
         pageSize: this._pageSize,
         load: async ({ page, signal }) => {
            if (!this._remote) {
               // Local: show the next slice of what is already here.
               const from = this._revealed;
               return { items: this._visible.slice(from, from + this._pageSize), done: from + this._pageSize >= this._total };
            }
            this._page = page;
            const result = await this._load({ ...this.query, page, signal, cursor: this._feed?.cursor ?? null });
            this._lastResult = result;
            return result;
         },
         onItems: (items, { first }) => {
            if (this._remote) {
               this._acceptResult(this._lastResult ?? items, { replace: first });
            } else {
               this._revealed = Math.min(this._total, this._revealed + items.length);
               this._shown = this._visible.slice(0, this._revealed);
            }
            this._render();
         },
         onStateChange: (state, { error }) => {
            this._fetchState = state === 'loading' ? 'loading' : state === 'error' ? 'error' : 'idle';
            this._fetchError = error;
            this._feedDone = state === 'done';
            if (state === 'error') this._onError?.(error, { type: 'load' });
            this._render();
         },
      });
      // Remote lists load their first page through the feed.
      if (this._remote) this._feed.reset();
   }

   _loadMore() {
      this._feed?.loadMore();
   }

   // ── Rendering ──────────────────────────────────────────────────

   _applyLooks() {
      this.dataset.layout = this._layout || 'list';
      this.dataset.variant = this._variant || 'outlined';
      this.dataset.density = this._density || 'comfortable';
      this.style.setProperty('--slice-data-list-min-item', `${this._minItemWidth || 260}px`);
      if (this._maxHeight) this.style.setProperty('--slice-data-list-max-height', this._maxHeight);
      else this.style.removeProperty('--slice-data-list-max-height');
      this.classList.toggle('has-max-height', !!this._maxHeight);
      this.$items?.setAttribute('aria-label', this._label || this._t('label'));
   }

   async _renderToolbar() {
      if (!this._toolbar) return;
      const needed = this._searchable || this._viewList().length || this._filterDefs().length || (this._sortOptions || []).length || this._createAction;
      this.$toolbar.hidden = !needed;
      if (needed) await this._toolbar.render();
      else this._toolbar.destroy();
   }

   _render() {
      if (!this._ready) return;
      const shown = this._remote ? this._remoteItems : this._shown;
      if (this._remote) this._shown = shown;
      this._renderItems();
      this._renderState();
      this._renderFooter();
      this._renderBulk();
      this.toggleAttribute('aria-busy', this._fetchState === 'loading' || this._loading);
      this._syncDetail();
      this.classList.toggle('is-busy', (this._fetchState === 'loading' || this._loading) && shown.length > 0);
   }

   _renderItems() {
      if (!this._ready) return;
      const shown = this._shown;
      const groups = this._groupBy ? groupItems(shown, this._groupBy, { order: this._groupOrder, label: this._groupLabel, texts: this._texts }) : null;
      const keep = new Set();
      const nodes = [];

      const rowFor = (item) => {
         const key = this._keyOf(item);
         keep.add(key);
         const cached = this._rows.get(key);
         if (cached && cached.item === item && cached.rev === this._rowRev) return cached.el;
         if (cached) this._discard(cached.el);
         const el = this._renderRow(item, key);
         this._rows.set(key, { item, el, rev: this._rowRev });
         return el;
      };

      if (groups) {
         for (const group of groups) {
            const id = `g-${String(group.key)}`;
            const collapsed = this._collapsed.has(id);
            const header = document.createElement('li');
            header.className = 'slice-data-list__group';
            header.dataset.group = id;
            const heading = document.createElement(this._collapsibleGroups ? 'button' : 'div');
            heading.className = 'slice-data-list__group-label';
            if (heading instanceof HTMLButtonElement) {
               heading.type = 'button';
               heading.setAttribute('aria-expanded', String(!collapsed));
               heading.setAttribute('aria-label', this._t(collapsed ? 'expand' : 'collapse', { label: group.label }));
            }
            heading.setAttribute('role', heading instanceof HTMLButtonElement ? 'button' : 'heading');
            if (!(heading instanceof HTMLButtonElement)) heading.setAttribute('aria-level', '3');
            const text = document.createElement('span');
            text.textContent = group.label;
            const count = document.createElement('span');
            count.className = 'slice-data-list__group-count';
            count.textContent = String(group.items.length);
            heading.append(text, count);
            header.append(heading);
            nodes.push(header);
            if (!collapsed) for (const item of group.items) nodes.push(rowFor(item));
         }
      } else {
         for (const item of shown) nodes.push(rowFor(item));
      }

      // Rows no longer on screen: their components go with them.
      for (const [key, entry] of [...this._rows]) {
         if (!keep.has(key)) {
            this._discard(entry.el);
            this._rows.delete(key);
         }
      }
      this.$items.replaceChildren(...nodes);
      this._paintSelection(false);
   }

   _t(key, values) {
      return fill(this._texts[key] ?? TEXTS[key] ?? key, values);
   }

   // One item. Parts it does not have are not drawn.
   _renderRow(item, key) {
      const li = document.createElement('li');
      li.className = 'slice-data-list__item';
      li.dataset.key = String(key);
      this._rowKeys.set(li, key);
      if (this._busy.has(key)) li.classList.add('is-busy');

      const title = read(item, this._title);
      const titleText = title === undefined || title === null ? '' : String(title);

      // Selection.
      if (this._picked.mode !== 'none') {
         const box = document.createElement('input');
         box.type = this._picked.mode === 'single' ? 'radio' : 'checkbox';
         if (box.type === 'radio') box.name = `${this._uid()}-pick`;
         box.className = 'slice-data-list__check';
         box.dataset.select = '';
         box.setAttribute('aria-label', this._t('selectItem', { title: titleText }));
         li.append(box);
      }

      // Leading: avatar, icon or picture.
      const avatar = this._avatarProps(item);
      const icon = read(item, this._icon);
      const image = read(item, this._image);
      if (avatar || icon || image) {
         const lead = document.createElement('span');
         lead.className = 'slice-data-list__leading';
         if (avatar) this._mount(lead, 'Avatar', { size: this._density === 'compact' ? 'sm' : 'md', ...avatar });
         else if (image) {
            const img = document.createElement('img');
            img.className = 'slice-data-list__image';
            img.src = String(image);
            img.alt = '';
            img.loading = 'lazy';
            lead.append(img);
         } else {
            lead.classList.add('slice-data-list__leading--icon');
            this._mount(lead, 'Icon', { size: '20px', ...(typeof icon === 'object' ? icon : { name: String(icon) }) });
         }
         li.append(lead);
      }

      // Main: title, description, meta, tags (or renderItem).
      const main = document.createElement('div');
      main.className = 'slice-data-list__main';
      if (this._renderItem) {
         const content = this._renderItem(item, { list: this, key });
         if (content instanceof Node) main.append(content);
         else if (content !== undefined && content !== null) main.textContent = String(content);
      } else {
         main.append(this._renderTitle(item, titleText));
         const description = read(item, this._description);
         if (description !== undefined && description !== null && description !== '') {
            const p = document.createElement('div');
            p.className = 'slice-data-list__description';
            if (description instanceof Node) p.append(description);
            else p.textContent = String(description);
            main.append(p);
         }
         const meta = this._renderMeta(item);
         if (meta) main.append(meta);
         const tags = read(item, this._tags);
         if (Array.isArray(tags) && tags.length) {
            const box = document.createElement('div');
            box.className = 'slice-data-list__tags';
            for (const tag of tags) {
               const slot = document.createElement('span');
               box.append(slot);
               this._mount(slot, 'Chip', { size: 'sm', ...(tag && typeof tag === 'object' ? tag : { label: String(tag) }) });
            }
            main.append(box);
         }
      }
      li.append(main);

      // Trailing: value, badge, time.
      const value = read(item, this._value);
      const badge = read(item, this._badge);
      const time = read(item, this._timestamp);
      if ((value !== undefined && value !== null && value !== '') || badge || time) {
         const trail = document.createElement('div');
         trail.className = 'slice-data-list__trailing';
         if (value !== undefined && value !== null && value !== '') {
            const v = document.createElement('span');
            v.className = 'slice-data-list__value';
            if (value instanceof Node) v.append(value);
            else v.textContent = String(value);
            trail.append(v);
         }
         if (badge) {
            const slot = document.createElement('span');
            slot.className = 'slice-data-list__badge';
            trail.append(slot);
            this._mount(slot, 'Badge', { ...(typeof badge === 'object' ? badge : typeof badge === 'number' ? { value: badge } : { label: String(badge) }) });
         }
         if (time) {
            const t = document.createElement('time');
            t.className = 'slice-data-list__time';
            const text = relativeTime(time, { justNow: this._texts.justNow || undefined });
            t.textContent = text;
            t.title = fullDate(time);
            const date = time instanceof Date ? time : new Date(time);
            if (!Number.isNaN(date.getTime())) t.dateTime = date.toISOString();
            if (text) trail.append(t);
         }
         li.append(trail);
      }

      // Actions.
      const actions = resolveActions(this._actions, item);
      if (actions.length) li.append(this._renderActions(actions, item, titleText));
      return li;
   }

   _renderTitle(item, text) {
      const path = read(item, this._path);
      const href = read(item, this._href);
      const clickable = !!(path || href || this._onItemClick || this._detail);
      const el = document.createElement(path || href ? 'a' : clickable ? 'button' : 'span');
      el.className = 'slice-data-list__title';
      el.textContent = text;
      if (el instanceof HTMLAnchorElement) el.href = String(path || href);
      if (el instanceof HTMLButtonElement) el.type = 'button';
      if (clickable) {
         el.dataset.open = '';
         el.dataset.rowFocus = '';
         el.classList.add('is-stretched');
      }
      return el;
   }

   _renderMeta(item) {
      const meta = Array.isArray(this._meta) ? this._meta : [];
      if (!meta.length) return null;
      const box = document.createElement('div');
      box.className = 'slice-data-list__meta';
      for (const spec of meta) {
         const def = spec && typeof spec === 'object' && !Array.isArray(spec) ? spec : { value: spec };
         const raw = read(item, def.value);
         if (raw === undefined || raw === null || raw === '') continue;
         const entry = document.createElement('span');
         entry.className = 'slice-data-list__meta-item';
         if (def.icon) {
            const icon = document.createElement('span');
            icon.className = 'slice-data-list__meta-icon';
            icon.setAttribute('aria-hidden', 'true');
            entry.append(icon);
            this._mount(icon, 'Icon', { name: def.icon, size: '14px' });
         }
         const text = document.createElement('span');
         text.textContent = typeof def.format === 'function' ? String(def.format(raw, item)) : String(raw);
         if (def.label) text.setAttribute('aria-label', `${def.label}: ${text.textContent}`);
         entry.append(text);
         box.append(entry);
      }
      return box.childElementCount ? box : null;
   }

   _renderActions(actions, item, titleText) {
      const box = document.createElement('div');
      box.className = 'slice-data-list__actions';
      // On a narrow list every action goes in the menu.
      const { inline, menu } = this._narrow ? { inline: [], menu: actions } : splitActions(actions);
      for (const action of inline) {
         const slot = document.createElement('span');
         box.append(slot);
         this._mount(slot, 'Button', {
            value: action.iconOnly ? '' : action.label,
            ariaLabel: action.iconOnly ? action.label : undefined,
            icon: action.icon,
            variant: action.variant ?? (action.danger ? 'danger' : 'ghost'),
            size: 'sm',
            disabled: action.disabled,
            onClick: (event) => this._runAction(action, { item, event }),
         });
      }
      if (menu.length) {
         const slot = document.createElement('span');
         box.append(slot);
         this._mount(slot, 'DropDown', {
            label: '',
            icon: 'dots-vertical',
            caret: false,
            variant: 'ghost',
            size: 'sm',
            ariaLabel: `${this._t('moreActions')}: ${titleText}`,
            placement: 'bottom-end',
            items: menu.map((action) => (action === 'separator' ? 'separator' : {
               label: action.label,
               icon: action.icon,
               danger: action.danger,
               disabled: action.disabled,
               description: action.description,
               onClick: ({ event }) => this._runAction(action, { item, event }),
            })),
         });
      }
      return box;
   }

   _avatarProps(item) {
      if (!this._avatar) return null;
      const value = typeof this._avatar === 'function' ? this._avatar(item) : this._avatar;
      if (value === undefined || value === null || value === false) return null;
      if (typeof value === 'object') {
         // { src: 'photo', name: 'owner.name' } maps keys; values that are not
         // keys of the item are used as they are.
         if (typeof this._avatar === 'function') return value;
         const out = {};
         for (const [prop, spec] of Object.entries(value)) {
            const v = typeof spec === 'string' ? read(item, spec) : typeof spec === 'function' ? spec(item) : spec;
            out[prop] = v === undefined ? (typeof spec === 'string' ? '' : spec) : v;
         }
         return out;
      }
      // A key: its value is a picture address.
      const src = read(item, value);
      return { src: src ? String(src) : '', name: String(read(item, this._title) ?? '') };
   }

   // Loading, errors, empty and "nothing matches".
   _renderState() {
      const shown = this._shown;
      const loading = this._fetchState === 'loading' || this._loading;
      const error = this._fetchState === 'error' ? (this._fetchError?.message || this._t('error')) : this._errorText;
      this._discard(this.$state);
      this.$state.replaceChildren();
      this.$state.className = 'slice-data-list__state';

      if (error && !shown.length) {
         this.$state.hidden = false;
         this.$state.classList.add('is-error');
         this.$state.setAttribute('role', 'alert');
         const text = document.createElement('p');
         text.textContent = this._fetchState === 'error' ? this._t('error') : error;
         this.$state.append(text);
         if (this._remote || this._fetchState === 'error') {
            const slot = document.createElement('span');
            this.$state.append(slot);
            this._mount(slot, 'Button', { value: this._t('retry'), icon: 'refresh', variant: 'outlined', size: 'sm', onClick: () => this._retry() });
         }
         return;
      }
      this.$state.removeAttribute('role');

      if (loading && !shown.length) {
         this.$state.hidden = false;
         this.$state.classList.add('is-loading');
         this.$state.setAttribute('aria-label', this._t('loading'));
         for (let i = 0; i < 4; i++) {
            const row = document.createElement('div');
            row.className = 'slice-data-list__skeleton';
            row.innerHTML = '<span class="slice-data-list__skeleton-lead"></span><span class="slice-data-list__skeleton-lines"><i></i><i></i></span>';
            this.$state.append(row);
         }
         return;
      }
      this.$state.removeAttribute('aria-label');

      if (!shown.length) {
         this.$state.hidden = false;
         const filtered = !!(this._search || this._activeFilters().length || (this._currentView() && typeof this._currentView().filter === 'function'));
         if (filtered) {
            this.$state.classList.add('is-no-results');
            const slot = document.createElement('div');
            this.$state.append(slot);
            this._mount(slot, 'EmptyState', {
               icon: 'search',
               title: this._t('noResults'),
               description: this._t('noResultsText'),
               buttonLabel: this._t('clearFilters'),
               buttonOnClick: () => this.clearQuery(),
               iconSize: 'medium',
            });
            this._announce(this._t('noResults'));
         } else {
            const empty = this._emptyState || {};
            this.$state.classList.add('is-empty');
            const slot = document.createElement('div');
            this.$state.append(slot);
            const action = empty.action;
            this._mount(slot, 'EmptyState', {
               icon: empty.icon ?? 'inbox-full',
               title: empty.title ?? this._t('empty'),
               description: empty.description ?? empty.text ?? this._t('emptyText'),
               ...(action ? { buttonLabel: action.label, buttonOnClick: () => action.onClick?.({ list: this }) } : {}),
               iconSize: 'medium',
            });
         }
         return;
      }
      this.$state.hidden = true;
   }

   _renderFooter() {
      const shown = this._shown.length;
      const total = this.totalItems;
      let footer = false;

      // Summary. Paged: "21–40 of 45" (of what passes the query). Filtered:
      // "12 of 42" (of everything). Otherwise: "42 items".
      const all = this._remote ? total : this._source().length;
      if (shown && this._paging === 'pages' && total > shown) {
         this.$summary.textContent = this._t('countOf', { shown: this._rangeText(), total });
         footer = true;
      } else if (shown && !this._remote && all !== total) {
         this.$summary.textContent = this._t('countOf', { shown: total, total: all });
         footer = true;
      } else if (shown && total !== null && total !== undefined && total > shown) {
         this.$summary.textContent = this._t('countOf', { shown, total });
         footer = true;
      } else if (shown && total) {
         this.$summary.textContent = this._t('count', { count: total });
      } else {
         this.$summary.textContent = '';
      }

      // Pages.
      if (this._paging === 'pages' && total > this._pageSize) {
         footer = true;
         this._ensurePager(total);
      } else if (this._built.pager) {
         slice.controller.destroyComponent(this._built.pager);
         this._built.pager = null;
         this.$pager.replaceChildren();
      }

      // "Load more", or the infinite list's status.
      this.$more.replaceChildren();
      const growing = this._paging === 'load-more' || this._paging === 'infinite';
      if (growing && shown) {
         const done = this._remote ? this._feedDone : this._revealed >= this._total;
         if (this._fetchState === 'error' && shown) {
            const text = document.createElement('span');
            text.textContent = this._t('error');
            const retry = document.createElement('button');
            retry.type = 'button';
            retry.className = 'slice-data-list__link';
            retry.textContent = this._t('retry');
            retry.addEventListener('click', () => this._retry());
            this.$more.append(text, retry);
            footer = true;
         } else if (this._fetchState === 'loading') {
            const text = document.createElement('span');
            text.className = 'slice-data-list__more-loading';
            text.textContent = this._t('loading');
            this.$more.append(text);
            footer = true;
         } else if (!done && this._paging === 'load-more') {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'slice-data-list__load-more';
            button.textContent = this._t('loadMore');
            button.addEventListener('click', () => this._loadMore());
            this.$more.append(button);
            footer = true;
         } else if (done && this._texts.end && shown > this._pageSize) {
            const text = document.createElement('span');
            text.textContent = this._t('end');
            this.$more.append(text);
            footer = true;
         }
      }
      this.$footer.hidden = !footer;
   }

   _rangeText() {
      const from = (this._page - 1) * this._pageSize + 1;
      const to = from + this._shown.length - 1;
      return `${from}–${to}`;
   }

   async _ensurePager(total) {
      const pages = Math.max(1, Math.ceil(total / this._pageSize));
      if (this._built.pager) {
         const pager = this._built.pager;
         if (pager.totalPages !== pages) pager.totalPages = pages;
         if (pager.currentPage !== this._page) pager.currentPage = this._page;
         return;
      }
      if (this._pagerPending) return;
      this._pagerPending = true;
      const pager = await slice.build('Pagination', {
         totalPages: pages,
         currentPage: this._page,
         controlled: true,
         size: 'sm',
         variant: 'ghost',
         onPageChange: (page) => this._goToPage(page),
      });
      this._pagerPending = false;
      if (!this._ready || this._paging !== 'pages') {
         if (pager) slice.controller.destroyComponent(pager);
         return;
      }
      this._built.pager = pager;
      this.$pager.replaceChildren(pager);
      // The page may have moved while it was being built.
      pager.currentPage = this._page;
      pager.totalPages = Math.max(1, Math.ceil((this.totalItems || 0) / this._pageSize));
   }

   _goToPage(page) {
      this._page = Math.max(1, Number(page) || 1);
      if (this._remote) this._fetch();
      else {
         this._engine.setPage(this._page);
         this._page = this._engine.page;
         this._shown = this._engine.pageRows();
         this._render();
      }
      this._onQueryChange?.(this.query);
      // Back to the top of the list, not of the page.
      const top = this.getBoundingClientRect().top;
      if (top < 0) this.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
   }

   _retry() {
      if (this._feed && this._feed.state === 'error') this._feed.retry();
      else if (this._remote) this._fetch();
      else this.refresh();
   }

   /** Clear the search, the filters and the view. */
   clearQuery() {
      this._search = '';
      if (this._toolbar?.input) this._toolbar.input.value = '';
      this._filterValues = {};
      const views = this._viewList();
      this._viewId = views[0]?.id ?? '';
      this._toolbar?.sync();
      this._query({ reason: 'filter' });
   }

   // ── Selection ──────────────────────────────────────────────────

   _orderedKeys() {
      return this._shown.map((item) => this._keyOf(item));
   }

   _paintSelection(emitBulk = true) {
      const keys = this._picked.keys;
      for (const [key, entry] of this._rows) {
         const on = keys.has(key);
         entry.el.classList.toggle('is-selected', on);
         const box = /** @type {HTMLInputElement | null} */ (entry.el.querySelector('[data-select]'));
         if (box) box.checked = on;
      }
      if (emitBulk) this._renderBulk();
   }

   _toggleAllVisible() {
      // Everything that passes the query (locally), or the loaded items.
      const keys = (this._remote ? this._remoteItems : this._visible).map((item) => this._keyOf(item));
      this._picked.toggleAll(keys);
      this._paintSelection();
      this._emitSelection();
   }

   _emitSelection() {
      this._renderBulk();
      const keys = this._picked.toArray();
      this._onSelectionChange?.(keys, this.getSelectedItems());
      this.dispatchEvent(new CustomEvent('selection-change', { bubbles: true, detail: { keys } }));
   }

   _renderBulk(rebuild = false) {
      const multiple = this._picked.mode === 'multiple';
      const count = this._picked.size;
      this.$bulk.hidden = !multiple || (!this._shown.length && !count);
      if (!multiple) return;
      const keys = (this._remote ? this._remoteItems : this._visible).map((item) => this._keyOf(item));
      const coverage = this._picked.coverage(keys);
      this.$selectAll.checked = coverage === 'all';
      this.$selectAll.indeterminate = coverage === 'some';
      this.$selectAll.setAttribute('aria-label', this._t('selectAll'));
      this.$bulkText.textContent = count ? this._t('selected', { count }) : this._t('selectAll');
      this.$bulk.classList.toggle('has-selection', count > 0);
      this.$bulkClear.hidden = count === 0;
      this.$bulkClear.textContent = this._t('clearSelection');

      // The bulk buttons: rebuilt when the selection starts or ends, so
      // disabled/hidden functions see the selected items.
      const state = count > 0 ? 'on' : 'off';
      if (!rebuild && this._bulkState === state && state === 'off') return;
      this._bulkState = state;
      this._discard(this.$bulkActions);
      this.$bulkActions.replaceChildren();
      if (!count) return;
      const items = this.getSelectedItems();
      for (const action of resolveActions(this._bulkActions, items)) {
         if (action === 'separator') continue;
         const slot = document.createElement('span');
         this.$bulkActions.append(slot);
         this._mount(slot, 'Button', {
            value: action.label,
            icon: action.icon,
            variant: action.variant ?? (action.danger ? 'danger' : 'outlined'),
            size: 'sm',
            disabled: action.disabled,
            onClick: (event) => this._runAction(action, { items: this.getSelectedItems(), event }),
         });
      }
   }

   // ── Actions ────────────────────────────────────────────────────

   /** @param {any} action @param {{ item?: any, items?: any[], event?: any }} context */
   async _runAction(action, { item, items, event }) {
      if (!action || action.disabled) return;
      const target = item ?? items;
      const question = confirmOf(action, action.label);
      if (question) {
         const ok = await this._confirm(question, action.danger);
         if (!ok) return;
      }
      const keys = item ? [this._keyOf(item)] : (items || []).map((i) => this._keyOf(i));
      await action.onClick?.({ item, items: items ?? (item ? [item] : []), keys, list: this, event });
      // After a bulk action the selection is done with, unless it says otherwise.
      if (items && action.keepSelection !== true) this.clearSelection();
      return target;
   }

   async _confirm({ title, text, confirmLabel }, danger) {
      const modal = await slice.build('Modal', {
         title,
         size: 'sm',
         tone: danger ? 'danger' : 'info',
         destroyOnClose: true,
         content: text || '',
         actions: [
            { value: this._t('cancel'), variant: 'ghost', returnValue: 'cancel' },
            { value: confirmLabel || this._t('confirm'), variant: danger ? 'danger' : 'filled', returnValue: 'confirm' },
         ],
      });
      if (!modal) return false;
      document.body.append(modal);
      const result = await modal.show();
      return result?.returnValue === 'confirm';
   }

   // ── Events ─────────────────────────────────────────────────────

   _rowOf(node) {
      const li = /** @type {HTMLElement | null} */ (node?.closest?.('.slice-data-list__item'));
      return li && this.$items.contains(li) ? li : null;
   }

   _itemOf(li) {
      if (!li) return null;
      const entry = this._rows.get(this._rowKeys.get(li));
      return entry ? entry.item : null;
   }

   _onBodyClick(event) {
      const target = /** @type {HTMLElement} */ (event.target);
      const header = /** @type {HTMLElement | null} */ (target.closest('.slice-data-list__group'));
      if (header && this._collapsibleGroups && target.closest('button')) {
         const id = header.dataset.group;
         if (this._collapsed.has(id)) this._collapsed.delete(id);
         else this._collapsed.add(id);
         this._renderItems();
         this.$items.querySelector(`[data-group="${CSS.escape(id)}"] button`)?.focus();
         return;
      }
      const li = this._rowOf(target);
      if (!li) return;
      const item = this._itemOf(li);
      if (!item) return;
      if (target.closest('[data-select]')) {
         // Shift+click: a range.
         if (event.shiftKey && this._picked.mode === 'multiple') {
            event.preventDefault();
            this._picked.range(this._rowKeys.get(li), this._orderedKeys());
            this._paintSelection();
            this._emitSelection();
         }
         return;
      }
      if (target.closest('.slice-data-list__actions')) return;
      const opener = target.closest('[data-open]');
      if (opener) {
         const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
         const path = read(item, this._path);
         if (this._onItemClick) {
            this._onItemClick(item, { event, list: this });
            if (event.defaultPrevented) return;
         }
         if (path && !modified) {
            event.preventDefault();
            if (typeof slice?.router?.navigate === 'function') slice.router.navigate(String(path));
            else window.location.assign(String(path));
         } else if (this._detail && !path && !read(item, this._href)) {
            event.preventDefault();
            this.openDetail(this._keyOf(item));
         }
         return;
      }
      // A click on a row that opens nothing selects it.
      if (this._picked.mode !== 'none' && !target.closest('a, button, input, select, textarea')) {
         if (event.shiftKey && this._picked.mode === 'multiple') this._picked.range(this._rowKeys.get(li), this._orderedKeys());
         else this._picked.toggle(this._rowKeys.get(li));
         this._paintSelection();
         this._emitSelection();
      }
   }

   _onBodyChange(event) {
      const box = /** @type {HTMLInputElement} */ (event.target);
      if (!box.matches?.('[data-select]')) return;
      const li = this._rowOf(box);
      if (!li) return;
      this._picked.toggle(this._rowKeys.get(li), box.checked);
      this._paintSelection();
      this._emitSelection();
   }

   _onKeyDown(event) {
      const target = /** @type {HTMLElement} */ (event.target);
      const li = this._rowOf(target);
      if (!li) return;
      const focusables = () => [...this.$items.querySelectorAll('.slice-data-list__item')]
         .map((row) => /** @type {HTMLElement} */ (row.querySelector('[data-row-focus]') || row.querySelector('[data-select]')))
         .filter(Boolean);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
         if (target.closest('.slice-data-list__actions')) return;
         const list = focusables();
         const own = /** @type {HTMLElement} */ (li.querySelector('[data-row-focus]') || li.querySelector('[data-select]'));
         const at = list.indexOf(own);
         const next = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : at + (event.key === 'ArrowDown' ? 1 : -1);
         if (next >= 0 && next < list.length) {
            event.preventDefault();
            list[next].focus();
         }
         return;
      }
      // Space on an item that opens something selects it instead.
      if (event.key === ' ' && target.matches('[data-open]') && this._picked.mode !== 'none') {
         event.preventDefault();
         this._picked.toggle(this._rowKeys.get(li));
         this._paintSelection();
         this._emitSelection();
      }
   }

   // ── Busy rows, highlights, removals ────────────────────────────

   _setBusy(key, on) {
      if (on) this._busy.add(key);
      else this._busy.delete(key);
      const row = this._rows.get(key)?.el;
      if (row) {
         row.classList.toggle('is-busy', on);
         row.toggleAttribute('aria-busy', on);
      }
   }

   _highlight(key) {
      requestAnimationFrame(() => {
         const row = this._rows.get(key)?.el;
         if (!row) return;
         row.classList.add('is-new');
         row.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
         setTimeout(() => row.classList.remove('is-new'), 1600);
      });
   }

   _animateOut(keys) {
      if (reducedMotion()) return Promise.resolve();
      const rows = keys.map((key) => this._rows.get(key)?.el).filter((el) => el && el.isConnected);
      if (!rows.length || typeof rows[0].animate !== 'function') return Promise.resolve();
      return Promise.all(rows.map((row) => row.animate(
         [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(12px)' }],
         { duration: 160, easing: 'ease-in', fill: 'forwards' },
      ).finished.catch(() => {}))).then(() => {});
   }

   _failed(error, type, item) {
      slice.logger?.logWarning?.('DataList', `Could not ${type}`, error);
      this._onError?.(error, { type, item });
      this._showNotice({ text: this._t('saveError'), tone: 'error', timeout: 6000 });
   }

   // ── The notice bar (undo, errors) ──────────────────────────────

   // The bar is an Alert (Visual/Alert). An undo becomes final when the time
   // runs out or the bar is closed; using its action (Undo) does not make it.
   /** @param {{ text: string, actionLabel?: string, action?: () => void, timeout?: number, tone?: 'info' | 'error', onExpire?: () => any }} notice */
   _showNotice({ text, actionLabel, action, timeout = 0, tone = 'info', onExpire }) {
      if (!this._alert) return;
      this._noticeExpire = onExpire || null;
      this._alert.show({
         message: text,
         tone: tone === 'error' ? 'danger' : 'neutral',
         variant: 'filled',
         dismissLabel: this._t('dismiss'),
         timeout,
         actions: action ? [{ label: actionLabel || '', onClick: action }] : [],
         onDismiss: ({ reason }) => {
            const expire = this._noticeExpire;
            this._noticeExpire = null;
            if (reason !== 'action' && expire) return expire();
            return undefined;
         },
      });
   }

   // expire: the time ran out or the bar was closed (the change becomes final).
   _hideNotice(expire) {
      return this._alert?.hide(expire ? 'close' : 'action');
   }

   /** A waiting undo becomes final now (another removal came, or the list goes). */
   _flushNotice() {
      if (this._noticeExpire) return Promise.resolve(this._hideNotice(true));
      return Promise.resolve();
   }

   _announce(text) {
      this.$live.textContent = '';
      requestAnimationFrame(() => { this.$live.textContent = text; });
   }

   // ── Query changes from the toolbar ─────────────────────────────

   _setSearch(value) {
      if (value === this._search) return;
      this._search = value;
      this._query({ reason: 'search' });
   }

   _setView(id) {
      if (id === this._viewId) return;
      this._viewId = id;
      this._query({ reason: 'view' });
   }

   _setFilter(key, values) {
      this._filterValues = { ...this._filterValues, [key]: values };
      this._query({ reason: 'filter' });
   }

   _setSort(index, direction) {
      const option = this._sortOptions[index];
      if (!option) return;
      const dir = direction ?? (this._sort?.index === index ? this._sort.direction : option.direction === 'desc' ? 'desc' : 'asc');
      this._sort = { index, direction: dir };
      this._query({ reason: 'sort' });
   }

   // ── Remembered state ───────────────────────────────────────────

   _storageKey() { return this._stateKey ? `slice-data-list:${this._stateKey}` : ''; }

   _restoreState() {
      // Props first: `sort` was given before sortOptions existed.
      if (this._initialSort && !this._sort) {
         const index = (this._sortOptions || []).findIndex((o) => o.key === this._initialSort.key);
         if (index >= 0) this._sort = { index, direction: this._initialSort.direction === 'desc' ? 'desc' : 'asc' };
      }
      if (!this._viewId && this._viewList().length) this._viewId = this._viewList()[0].id;
      const storageKey = this._storageKey();
      if (!storageKey) return;
      try {
         const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
         if (!saved || saved.v !== 1) return;
         if (typeof saved.search === 'string') this._search = saved.search;
         if (typeof saved.view === 'string' && this._viewList().some((v) => v.id === saved.view)) this._viewId = saved.view;
         if (saved.filters && typeof saved.filters === 'object') {
            const known = new Set(this._filterDefs().map((f) => f.key));
            for (const [key, values] of Object.entries(saved.filters)) if (known.has(key) && Array.isArray(values)) this._filterValues[key] = values;
         }
         if (saved.sort && Number.isInteger(saved.sort.index) && this._sortOptions?.[saved.sort.index]) this._sort = saved.sort;
      } catch {
         // A saved state that cannot be read is ignored.
      }
   }

   _saveState() {
      const storageKey = this._storageKey();
      if (!storageKey) return;
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
         try {
            localStorage.setItem(storageKey, JSON.stringify({ v: 1, search: this._search, view: this._viewId, filters: this._filterValues, sort: this._sort }));
         } catch {
            // Storage full or blocked: the list works the same, it just forgets.
         }
      }, 300);
   }

   /** Forget what `stateKey` remembered. */
   clearSavedState() {
      try { if (this._storageKey()) localStorage.removeItem(this._storageKey()); } catch { /* blocked */ }
   }

   // ── Building children ──────────────────────────────────────────

   // Components inside rows are built after the row (it is drawn at once);
   // one that arrives after its row was discarded is destroyed.
   _mount(slot, name, props) {
      this._pending.add(slot);
      slice.build(/** @type {any} */ (name), props).then((component) => {
         this._pending.delete(slot);
         if (!component) return;
         if (slot.dataset.discarded || !this._ready) {
            slice.controller.destroyComponent(component);
            return;
         }
         slot.append(component);
      }).catch((error) => {
         this._pending.delete(slot);
         slice.logger?.logWarning?.('DataList', `Could not build ${name}`, error);
      });
   }

   _discard(container) {
      for (const slot of this._pending) {
         if (container.contains(slot)) slot.dataset.discarded = 'true';
      }
      slice.controller.destroyByContainer(container);
   }

   _uid() {
      if (!this._id) this._id = `data-list-${Math.random().toString(36).slice(2, 9)}`;
      return this._id;
   }
}

customElements.define('slice-data-list', DataList);
