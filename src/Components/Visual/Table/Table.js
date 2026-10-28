import { readPath, writePath } from '../../shared/data/paths.js';
import { insertItem, patchItem, removeItems, restoreItems, revertItem } from '../../shared/data/collection.js';
import { normalizeEdit, editKind, controlFor, readControl, validateValue, optionLabel, TEXT_KINDS } from '../../shared/editing/inlineControl.js';

// Default UI strings. Every one can be overridden through the `labels` prop
// (partially: only the keys you pass change), which is how a Spanish app gets a
// Spanish table without forking the component. `{shown}`, `{total}`, `{count}`
// are placeholders.
const DEFAULT_LABELS = {
  searchPlaceholder: 'Search…',
  searchLabel: 'Search the table',
  filters: 'Filters',
  clearAll: 'Clear all',
  clearFilters: 'Clear filters',
  showing: '{shown} of {total} rows',
  selected: '{count} selected',
  noResults: 'No rows match the current filters.',
  removeFilter: 'Remove filter',
  searchChip: 'Search',
  any: 'Any',
  yes: 'Yes',
  no: 'No',
  from: 'From',
  to: 'To',
  value: 'Value',
  operator: 'Condition',
  selectAll: 'Select all rows',
  selectRow: 'Select row',
  sortBy: 'Sort by',
  sortNone: 'Default order',
  ascending: 'Ascending',
  descending: 'Descending',
  export: 'Export',
  exportCsv: 'Download CSV',
  exportJson: 'Download JSON',
  exportCopy: 'Copy to clipboard',
  exportScopeFiltered: 'All matching rows ({count})',
  exportScopeSelected: 'Selected rows ({count})',
  copied: 'Copied {count} rows',
  copyFailed: 'Could not copy to the clipboard',
  exported: 'Exported {count} rows',
  view: 'View',
  columns: 'Columns',
  density: 'Density',
  densityCompact: 'Compact',
  densityComfortable: 'Comfortable',
  densitySpacious: 'Spacious',
  totals: 'Total',
  actions: 'Actions',
  rowActions: 'Row actions',
  details: 'Details',
  showDetails: 'Show details',
  hideDetails: 'Hide details',
  copyRow: 'Copy row',
  selectRowAction: 'Select',
  deselectRow: 'Deselect',
  detailEmpty: '—',
  undo: 'Undo',
  dismiss: 'Dismiss',
  removed: '{count} rows removed',
  removedOne: 'Row removed',
  saveError: 'The change could not be saved.',
  loadError: 'The rows could not be loaded.',
  retry: 'Try again',
  editCell: 'Edit {label}',
  copiedCell: 'Copied',
  operators: {
    contains: 'contains',
    notContains: 'does not contain',
    equals: 'is',
    notEquals: 'is not',
    startsWith: 'starts with',
    endsWith: 'ends with',
    empty: 'is empty',
    notEmpty: 'is not empty',
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    between: 'between',
    is: 'is',
    on: 'on',
    before: 'before',
    after: 'after',
    in: 'is any of',
    notIn: 'is none of'
  }
};

// Operators per filter type, first = default. Mirrors DataGridEngine.OPERATORS;
// duplicated (not imported) because a component may only import within
// src/Components and the engine is loaded through slice.build, not as a module.
const FILTER_OPERATORS = {
  text: ['contains', 'notContains', 'equals', 'notEquals', 'startsWith', 'endsWith', 'empty', 'notEmpty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'notEmpty'],
  boolean: ['is'],
  date: ['on', 'before', 'after', 'between', 'empty', 'notEmpty'],
  select: ['in', 'notIn', 'empty', 'notEmpty']
};

/**
 * @typedef {'filtered'|'selected'|'all'|'page'} ExportScope
 * @typedef {{ format?: 'csv'|'tsv'|'json', scope?: ExportScope, columns?: Array<string|number>,
 *             delimiter?: string, headers?: boolean, filename?: string }} ExportOptions
 */

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable="true"]';
const UNDO_MS = 5000;

export default class Table extends HTMLElement {
  static props = {
    // Legacy positional API (still supported): string headers + array-of-arrays rows.
    headers: { type: 'array', default: [], required: false },
    rows: { type: 'array', default: [], required: false },
    // Richer API: columns = [{ key, label, sortable, align, render, filter,
    // filterValue, searchable, searchValue, sticky, width, minWidth }]. Rows may
    // be objects keyed by `key`. Takes precedence over `headers` when provided.
    columns: { type: 'array', default: null, required: false },
    sortable: { type: 'boolean', default: false },
    defaultSort: { type: 'object', default: null },
    // pagination: true | { pageSize }.
    pagination: { type: 'object', default: null },
    // 'local' (default): the table holds all rows and filters/sorts/paginates them.
    // 'remote': `rows` is just the current page; the table tracks page, sort,
    // search and filters and emits onSortChange/onPageChange/onFilterChange so
    // you fetch the next slice. Provide `totalItems` so the pager can count pages.
    dataSource: { type: 'string', default: 'local' },
    totalItems: { type: 'number', default: null },
    emptyMessage: { type: 'string', default: 'No data' },
    // 'tinted' (default) is the quiet header the component now ships; 'solid'
    // reproduces the pre-tint look exactly (a saturated --primary-color fill) so an
    // existing page can opt out; 'none' removes the fill entirely. The list is a
    // LITERAL, inline, on purpose: `slice types generate` reads a literal array and
    // silently degrades a referenced one to `string` (see Checkbox.js).
    headerVariant: {
      type: 'string',
      default: 'tinted',
      required: false,
      allowedValues: ['tinted', 'solid', 'none']
    },
    // Self-contained busy overlay (no dependency on the Loading component). Drive
    // it yourself in remote mode: set true before fetching, false after.
    loading: { type: 'boolean', default: false },

    // ---- search & filters
    // A search box over every column (or those with `searchable !== false`).
    searchable: { type: 'boolean', default: false },
    searchPlaceholder: { type: 'string', default: null },
    // The current search query. Setting it from code does not fire onFilterChange.
    search: { type: 'string', default: '' },
    // A filter panel with one editor per column; the type is the column's
    // `filter` ('text' | 'number' | 'boolean' | 'date' | 'select' | { type,
    // options, label }) or is inferred from the data. A column opts out with
    // `filter: false`; without `filterable`, only columns that declare `filter` get one.
    filterable: { type: 'boolean', default: false },
    // Current filters: [{ key, type?, op?, value }]. Setting them from code does
    // not fire onFilterChange.
    filters: { type: 'array', default: null },
    // Fired with `{ search, filters }` whenever the user changes either.
    onFilterChange: { type: 'function', default: null },
    // Partial overrides for every UI string (see DEFAULT_LABELS), e.g. Spanish.
    labels: { type: 'object', default: null },

    // ---- rows
    // Stable identity per row: a key/path ('id', 'user.id') or a function. Used
    // by selection and to keep row elements across renders. Without it, row
    // OBJECTS are identified by reference.
    rowKey: { type: 'string', default: null },
    selection: {
      type: 'string',
      default: 'none',
      allowedValues: ['none', 'single', 'multiple']
    },
    // Selected row keys. Setting it from code does not fire onSelectionChange.
    selected: { type: 'array', default: null },
    // Fired with `(keys, rows)` when the user changes the selection.
    onSelectionChange: { type: 'function', default: null },
    // Fired with `(row, event)` on a click (or Enter) on a row, but not on a
    // link, button or input inside it.
    onRowClick: { type: 'function', default: null },

    // ---- layout
    // Keep the header visible while the rows scroll. Needs a bounded height:
    // `maxHeight`, or `virtual`.
    stickyHeader: { type: 'boolean', default: false },
    // CSS length capping the scroll area ('420px', '60vh'). In virtual mode it is
    // the fixed height of the viewport (480px when omitted).
    maxHeight: { type: 'string', default: null },
    // Render only the rows in view. Rows get a fixed height (`rowHeight`) and
    // pagination is ignored: the whole (filtered, sorted) set is one scroll.
    virtual: { type: 'boolean', default: false },
    // Fixed row height in virtual mode, in px. Defaults by density: 36 / 44 / 54.
    rowHeight: { type: 'number', default: null },

    // Below 640px: 'scroll' keeps the real table, scrolling sideways with the
    // first column pinned (sorting and selection keep working); 'cards' turns
    // each row into a card, with a sort bar above them.
    mobileLayout: {
      type: 'string',
      default: 'scroll',
      allowedValues: ['scroll', 'cards']
    },

    // ---- view
    // A View menu (with `densityToggle`) and/or column checkboxes (with
    // `columnToggle`). A column opts out with `hideable: false` and starts
    // hidden with `hidden: true`.
    columnToggle: { type: 'boolean', default: false },
    densityToggle: { type: 'boolean', default: false },
    // Keys of the hidden columns. Setting it from code does not fire onColumnsChange.
    hiddenColumns: { type: 'array', default: null },
    // Fired with the hidden keys when the user shows or hides a column.
    onColumnsChange: { type: 'function', default: null },
    density: {
      type: 'string',
      default: 'comfortable',
      allowedValues: ['compact', 'comfortable', 'spacious']
    },
    // Remember search, filters, sort, hidden columns and density in
    // localStorage under this key, and restore them on the next visit (the
    // saved state wins over the initial props).
    stateKey: { type: 'string', default: null },

    // ---- row detail & row menu
    // 'modal': clicking a row opens its detail in a Modal. 'expand': a chevron
    // opens it in place, under the row (virtual tables use the modal).
    rowDetail: {
      type: 'string',
      default: 'none',
      allowedValues: ['none', 'modal', 'expand']
    },
    // `(row) => Node | string | { html } | Promise<…>`. Without it, the detail
    // lists every column (hidden ones included) as label / value.
    renderDetail: { type: 'function', default: null },
    // `(row) => string` for the modal title; the first column's value otherwise.
    detailTitle: { type: 'function', default: null },
    // A ⋯ menu per row. `true` gives the default menu; an array of items (or
    // `(row) => items`) builds your own from built-ins ('details', 'copy',
    // 'select', 'separator') and `{ label, onClick, danger, disabled, hidden,
    // icon }` / `{ type: 'label' }` / `{ render }` items.
    rowActions: { type: 'array', default: null },
    // Take over the ⋯ button: `({ row, key, anchor, table, close }) => cleanup?`
    // opens YOUR menu (a Dropdown, a popover, a modal) instead of the table's.
    // Call `close()` when it closes; a returned function runs whenever the
    // table closes it (another menu opens, the row goes, the table is destroyed).
    onRowMenu: { type: 'function', default: null },

    // ---- export
    // An Export menu: CSV, JSON or the clipboard (tab-separated, pastes into a
    // spreadsheet), of the matching rows or of the selection. Also available
    // from code: exportData(), downloadData(), copyToClipboard().
    exportable: { type: 'boolean', default: false },
    // File name without extension.
    exportFilename: { type: 'string', default: 'table' },
    // Items of the Export menu, same vocabulary as rowActions; built-ins
    // 'scope', 'csv', 'json', 'copy'. Custom items get `{ table, scope, rows }`.
    exportMenu: { type: 'array', default: null },
    // Fired with `{ format, scope, count }` after every export.
    onExport: { type: 'function', default: null },

    // ---- data sources (besides `rows`)
    // A slice.context store: the table shows the array at `contextPath` ('' when
    // the state IS the array) and follows it; addRow / updateRow / removeRow and
    // cell edits write back to it, so every component reading it sees them.
    context: { type: 'string', default: '' },
    contextPath: { type: 'string', default: 'items' },
    // A server: `async ({ page, pageSize, search, filters, sort, signal }) =>
    // { items, total }` (or an array). Turns the table remote: it asks again on
    // every sort, page, search or filter, shows loading, and an error with Try
    // again. Set it when building the table (not reactive afterwards).
    load: { type: 'function', default: null },

    // ---- editing
    // Saving a cell edit (a column with `edit`): `({ row, before, key, value,
    // previous, column }) => any`. The cell shows the new value at once, busy;
    // it is written to the rows when this resolves (a returned object replaces
    // the row), and taken back, in red, if it throws or returns false.
    commit: { type: 'function', default: null },
    // After every saved cell edit: `({ row, key, value, previous })`.
    onCellChange: { type: 'function', default: null },
    // A load, a save or a CRUD commit failed: `(error, { type, row?, key? })`.
    onError: { type: 'function', default: null },

    // Notifications. In 'remote' these are how you drive fetching; in 'local'
    // they are optional hooks (the table still sorts/pages locally).
    onSortChange: { type: 'function', default: null },
    onPageChange: { type: 'function', default: null }
  };

  static _seq = 0;

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$component = this.querySelector('.table_component');
    this.$toolbar = this.querySelector('.table_toolbar');
    this.$search = this.querySelector('.table_search');
    this.$searchInput = this.querySelector('.table_search_input');
    this.$filtersToggle = this.querySelector('.table_filters_toggle');
    this.$filtersToggleLabel = this.querySelector('.table_filters_toggle_label');
    this.$filtersCount = this.querySelector('.table_filters_count');
    this.$status = this.querySelector('.table_status');
    this.$export = this.querySelector('.table_export');
    this.$exportToggle = this.querySelector('.table_export_toggle');
    this.$exportLabel = this.querySelector('.table_export_label');
    this.$cardsBar = this.querySelector('.table_cards_bar');
    this.$viewToggle = this.querySelector('.table_view_toggle');
    this.$viewLabel = this.querySelector('.table_view_label');
    this.$menu = this.querySelector('.table_menu');
    this.$foot = this.querySelector('.table_foot');
    this.$panel = this.querySelector('.table_filter_panel');
    this.$chips = this.querySelector('.table_chips');
    this.$wrapper = this.querySelector('.table_wrapper');
    this.$head = this.querySelector('.table_head');
    this.$body = this.querySelector('.table_body');
    this.$footer = this.querySelector('.table_footer');
    this.$table = this.querySelector('.table');
    this.$loading = this.querySelector('.table_loading');
    this.$notice = this.querySelector('.table_notice');

    // Internal state uses names no declared prop can derive (§10): the framework
    // nulls `_<prop>` for every declared prop before applying it.
    this._uid = `slice-table-${++Table._seq}`;
    this._headers = [];
    this._rows = [];
    this._columns = null;
    this._resolvedColumns = [];
    this._sortable = false;
    this._defaultSort = null;
    this._paginate = false;
    this._pageSize = 10;
    this._remote = false;
    this._totalItems = null;
    this._emptyMessage = 'No data';
    this._loading = false;
    this._headerVariant = 'tinted';
    this._onSortChange = null;
    this._onPageChange = null;

    this._query = '';
    this._filterState = new Map();     // key -> { type, op, value } as edited (may be incomplete)
    this._filterConfigs = [];          // resolved per-column filter editors' config
    this._editors = new Map();         // key -> { root, sync(state) }
    this._panelStale = true;
    this._panelOpen = false;
    this._text = DEFAULT_LABELS;
    this._selectedKeys = new Set();
    this._selectionAnchor = null;
    this._identity = new WeakMap();
    this._identitySeq = 0;
    this._rowCache = new Map();        // key -> { tr, row, version, numeric }
    this._renderedRows = new Map();    // key -> row, for the rows currently in the DOM
    this._contentVersion = 0;
    this._window = { start: -1, end: -1 };
    this._scrollFrame = 0;
    this._searchTimer = 0;
    this._resizeObserver = null;
    this._exportScope = 'filtered';
    this._flashText = '';
    this._flashTimer = 0;
    this._hidden = new Set();
    this._hiddenGiven = false;
    this._viewColumns = [];
    this._expanded = new Set();
    this._detailRows = new Map();
    this._detailSeq = 0;
    this._detailToken = 0;
    this._detailReturnKey = undefined;
    this._menuState = null;
    this._externalMenu = null;
    this._onRowMenu = null;
    this._persistTimer = 0;
    this._modal = null;

    // Data sources and CRUD.
    this._context = '';
    this._contextPath = 'items';
    this._load = null;
    this._commit = null;
    this._onCellChange = null;
    this._onError = null;
    this._contextWatch = null;
    this._abort = null;
    this._loadWatch = null;   // unsubscribe from a QueryService load
    this._fetchError = null;
    this._fetchQueued = false;
    this._busyRows = new Set();
    this._freshRows = new Set();
    this._timers = new Set();
    this._alert = null;                // the undo / error bar (an Alert)
    this._noticeExpire = null;         // what makes the current undo final
    // Cell editing.
    this._gridMode = false;            // some column has `edit`: cells are a grid
    this._activeCell = null;           // { rowKey, columnKey }
    this._cellEditor = null;           // the open editor
    this._busyCells = new Set();       // 'rowKey|columnKey'
    this._cellErrors = new Map();      // same id -> message
    this._kindMemo = null;

    this._engine = null;
    this._pager = null;
    this._buildingPager = false;
    this._mounted = false;

    this._handleHeaderClick = this._handleHeaderClick.bind(this);
    this._handleHeaderKeydown = this._handleHeaderKeydown.bind(this);
    this._handleHeadChange = this._handleHeadChange.bind(this);
    this._handleBodyClick = this._handleBodyClick.bind(this);
    this._handleBodyKeydown = this._handleBodyKeydown.bind(this);
    this._handleBodyChange = this._handleBodyChange.bind(this);
    this._handleScroll = this._handleScroll.bind(this);
    this._handleSearchInput = this._handleSearchInput.bind(this);
    this._handleSearchKeydown = this._handleSearchKeydown.bind(this);
    this._handleChipClick = this._handleChipClick.bind(this);
    this._toggleFilterPanel = this._toggleFilterPanel.bind(this);
    this._toggleExportMenu = this._toggleExportMenu.bind(this);
    this._toggleViewMenu = this._toggleViewMenu.bind(this);
    this._handleMenuClick = this._handleMenuClick.bind(this);
    this._handleMenuKeydown = this._handleMenuKeydown.bind(this);
    this._handleMenuFocusOut = this._handleMenuFocusOut.bind(this);
    this._handleOutsidePointer = this._handleOutsidePointer.bind(this);
    this._handleCardsBarChange = this._handleCardsBarChange.bind(this);
    this._handleCardsBarClick = this._handleCardsBarClick.bind(this);
    this._handleBodyDoubleClick = this._handleBodyDoubleClick.bind(this);
    this._handleBodyFocusOut = this._handleBodyFocusOut.bind(this);

    slice.controller.setComponentProps(this, props || {});
  }

  // --- setters (store raw; reactive once the engine exists) ---
  set headers(value) {
    this._headers = Array.isArray(value) ? value : [];
    if (this._engine && !this._columns) this._refreshColumns();
  }
  get headers() { return this._headers; }

  set rows(value) {
    this._rows = Array.isArray(value) ? value : [];
    this._contentVersion += 1;
    this._panelStale = true;
    if (this._engine) {
      this._engine.setData(this._rows).setPageSize(this._effectivePageSize());
      this._afterStateChange();
    }
  }
  get rows() { return this._rows; }

  set columns(value) {
    this._columns = Array.isArray(value) ? value : null;
    if (this._engine) this._refreshColumns();
  }
  get columns() { return this._columns; }

  set sortable(value) {
    this._sortable = value === true;
    if (this._engine) this._refreshColumns();
  }

  set defaultSort(value) {
    // `key: 0` is the index of the first column in a legacy `headers` table, so the
    // guard cannot be truthiness.
    this._defaultSort = value && value.key !== undefined && value.key !== null ? value : null;
    if (this._engine && this._defaultSort) {
      this._engine.setSort({ ...this._defaultSort, ...this._sortOptionsFor(this._defaultSort.key) });
      this._afterStateChange();
    }
  }

  set pagination(value) {
    if (value && typeof value === 'object') {
      this._paginate = true;
      this._pageSize = value.pageSize > 0 ? value.pageSize : 10;
    } else {
      this._paginate = value === true;
      this._pageSize = 10;
    }
    // Reactive: reconfigure the engine + show/hide (or lazily build) the pager —
    // no destroy/recreate. Before init() the engine isn't ready yet; init applies it.
    if (this._engine) this._applyPagination();
  }

  set dataSource(value) {
    this._remote = value === 'remote';
    // resolved at init(); changing it after build is not reactive.
  }

  set totalItems(value) {
    this._totalItems = Number.isFinite(value) ? value : null;
    if (this._engine && this._remote) {
      this._engine.setTotalItems(this._totalItems);
      this._afterStateChange();
    }
  }

  set emptyMessage(value) {
    this._emptyMessage = typeof value === 'string' ? value : 'No data';
    if (this._engine) this.renderTable();
  }

  // Unknown values fall back to the declared default (§3.3). Both the list and the
  // default come from `static props`, so the runtime and the generated union accept
  // exactly the same set. The class swap is idempotent: remove every variant, then
  // add the resolved one.
  set headerVariant(value) {
    const { allowedValues, default: fallback } = Table.props.headerVariant;
    const next = allowedValues.includes(value) ? value : fallback;
    for (const variant of allowedValues) this.classList.remove('table--header-' + variant);
    this.classList.add('table--header-' + next);
    this._headerVariant = next;
  }
  get headerVariant() { return this._headerVariant; }

  set onSortChange(value) {
    this._onSortChange = typeof value === 'function' ? value : null;
  }

  set onPageChange(value) {
    this._onPageChange = typeof value === 'function' ? value : null;
  }

  // ---- data sources & editing

  set context(value) {
    this._context = typeof value === 'string' ? value : '';
    if (this._mounted && this._context) {
      if (!this._contextWatch) this._watchContext();
      this._readContext();
    }
  }
  get context() { return this._context; }

  set contextPath(value) {
    this._contextPath = typeof value === 'string' ? value : 'items';
    if (this._mounted && this._context) this._readContext();
  }
  get contextPath() { return this._contextPath; }

  set load(value) {
    this._load = typeof value === 'function' ? value : null;
    // A server pages, sorts and filters: the table only shows what it sends.
    if (this._load && !this._engine) this._remote = true;
  }
  get load() { return this._load; }

  set commit(value) { this._commit = typeof value === 'function' ? value : null; }
  get commit() { return this._commit; }

  set onCellChange(value) { this._onCellChange = typeof value === 'function' ? value : null; }
  get onCellChange() { return this._onCellChange; }

  set onError(value) { this._onError = typeof value === 'function' ? value : null; }
  get onError() { return this._onError; }

  set loading(value) {
    this._loading = value === true;
    if (this.$loading) this.$loading.classList.toggle('table_loading--active', this._loading);
    if (this.$table) this.$table.setAttribute('aria-busy', this._loading ? 'true' : 'false');
  }
  get loading() { return this._loading; }

  // ---- search & filters

  set searchable(value) {
    this._searchable = value === true;
    if (this._mounted) this._renderChrome();
  }
  get searchable() { return this._searchable; }

  set searchPlaceholder(value) {
    this._searchPlaceholder = typeof value === 'string' && value ? value : null;
    if (this._mounted) this._renderChrome();
  }
  get searchPlaceholder() { return this._searchPlaceholder; }

  set search(value) {
    this._query = typeof value === 'string' ? value : '';
    if (this.$searchInput && this.$searchInput.value !== this._query) this.$searchInput.value = this._query;
    if (this._engine) this._applyFilters(false);
  }
  get search() { return this._query; }

  set filterable(value) {
    this._filterable = value === true;
    this._panelStale = true;
    if (this._mounted) {
      this._resolveFilterConfigs();
      this._renderChrome();
      this.renderTable();
    }
  }
  get filterable() { return this._filterable; }

  set filters(value) {
    this._filterState = new Map();
    for (const filter of Array.isArray(value) ? value : []) {
      if (!filter || filter.key === undefined || filter.key === null) continue;
      this._filterState.set(String(filter.key), { type: filter.type, op: filter.op, value: filter.value });
    }
    if (this._engine) {
      this._syncEditors();
      this._applyFilters(false);
    }
  }
  /** The ACTIVE filters (incomplete ones being typed are not included). */
  get filters() {
    return this._engine ? this._engine.filters : [];
  }

  set onFilterChange(value) {
    this._onFilterChange = typeof value === 'function' ? value : null;
  }
  get onFilterChange() { return this._onFilterChange; }

  set labels(value) {
    const custom = value && typeof value === 'object' ? value : {};
    this._labels = value && typeof value === 'object' ? value : null;
    this._text = {
      ...DEFAULT_LABELS,
      ...custom,
      operators: { ...DEFAULT_LABELS.operators, ...(custom.operators || {}) }
    };
    this._panelStale = true;
    this._contentVersion += 1;
    if (this._mounted) {
      this._renderChrome();
      this.renderTable();
    }
  }
  get labels() { return this._labels; }

  // ---- rows

  set rowKey(value) {
    this._rowKey = typeof value === 'function' || (typeof value === 'string' && value) ? value : null;
    this._rowCache.clear();
    if (this._engine) this.renderTable();
  }
  get rowKey() { return this._rowKey; }

  set selection(value) {
    const { allowedValues, default: fallback } = Table.props.selection;
    this._selection = allowedValues.includes(value) ? value : fallback;
    this.classList.toggle('table--selectable', this._selection !== 'none');
    if (this._selection === 'single' && this._selectedKeys.size > 1) {
      this._selectedKeys = new Set([...this._selectedKeys].slice(0, 1));
    }
    this._contentVersion += 1;
    if (this._engine) this.renderTable();
  }
  get selection() { return this._selection; }

  set selected(value) {
    const keys = Array.isArray(value) ? value.map((key) => String(key)) : [];
    this._selectedKeys = new Set(this._selection === 'single' ? keys.slice(0, 1) : keys);
    if (this._engine) this._paintSelection();
  }
  /** Keys of the selected rows. */
  get selected() {
    return [...this._selectedKeys];
  }

  set onSelectionChange(value) {
    this._onSelectionChange = typeof value === 'function' ? value : null;
  }
  get onSelectionChange() { return this._onSelectionChange; }

  set onRowClick(value) {
    this._onRowClick = typeof value === 'function' ? value : null;
    this._syncClickable();
    this._contentVersion += 1;
    if (this._engine) this.renderTable();
  }
  get onRowClick() { return this._onRowClick; }

  // ---- layout

  set stickyHeader(value) {
    this._stickyHeader = value === true;
    this._applyLayout();
  }
  get stickyHeader() { return this._stickyHeader; }

  set maxHeight(value) {
    this._maxHeight = typeof value === 'string' && value ? value : null;
    this._applyLayout();
  }
  get maxHeight() { return this._maxHeight; }

  set virtual(value) {
    this._virtual = value === true;
    this._applyLayout();
    if (this._engine) {
      this._engine.setPageSize(this._effectivePageSize());
      if (this._pager) this._pager.style.display = this._paginate && !this._virtual ? '' : 'none';
      this._afterStateChange();
    }
  }
  get virtual() { return this._virtual; }

  set mobileLayout(value) {
    const { allowedValues, default: fallback } = Table.props.mobileLayout;
    this._mobileLayout = allowedValues.includes(value) ? value : fallback;
    this.classList.toggle('table--cards', this._mobileLayout === 'cards');
    if (this._engine) this.renderTable();
  }
  get mobileLayout() { return this._mobileLayout; }

  set exportable(value) {
    this._exportable = value === true;
    if (!this._exportable) this._closeExportMenu(false);
    if (this._mounted) this._renderChrome();
  }
  get exportable() { return this._exportable; }

  set exportFilename(value) {
    this._exportFilename = typeof value === 'string' && value.trim() ? value.trim() : 'table';
  }
  get exportFilename() { return this._exportFilename; }

  set onExport(value) {
    this._onExport = typeof value === 'function' ? value : null;
  }
  get onExport() { return this._onExport; }

  set rowHeight(value) {
    this._rowHeight = Number.isFinite(value) && value > 0 ? value : null;
    this.style.setProperty('--slice-table-row-height', `${this._effectiveRowHeight()}px`);
    if (this._engine && this._virtual) this.renderTable();
  }
  get rowHeight() { return this._rowHeight; }

  _effectiveRowHeight() {
    return this._rowHeight || { compact: 36, comfortable: 44, spacious: 54 }[this._density] || 44;
  }

  set columnToggle(value) {
    this._columnToggle = value === true;
    if (this._mounted) this._renderChrome();
  }
  get columnToggle() { return this._columnToggle; }

  set densityToggle(value) {
    this._densityToggle = value === true;
    if (this._mounted) this._renderChrome();
  }
  get densityToggle() { return this._densityToggle; }

  set hiddenColumns(value) {
    this._hidden = new Set((Array.isArray(value) ? value : []).map((key) => String(key)));
    this._hiddenGiven = Array.isArray(value);
    if (this._engine) this._refreshView();
  }
  get hiddenColumns() { return [...this._hidden]; }

  set onColumnsChange(value) {
    this._onColumnsChange = typeof value === 'function' ? value : null;
  }
  get onColumnsChange() { return this._onColumnsChange; }

  set density(value) {
    const { allowedValues, default: fallback } = Table.props.density;
    const next = allowedValues.includes(value) ? value : fallback;
    // The default density IS the base style, so it needs no class.
    for (const option of allowedValues) this.classList.remove('table--density-' + option);
    if (next !== fallback) this.classList.add('table--density-' + next);
    this._density = next;
    this.style.setProperty('--slice-table-row-height', `${this._effectiveRowHeight()}px`);
    // While booting, init renders once everything (columns included) is ready.
    if (this._engine && !this._booting) this.renderTable();
  }
  get density() { return this._density; }

  set stateKey(value) {
    this._stateKey = typeof value === 'string' && value ? value : null;
  }
  get stateKey() { return this._stateKey; }

  set rowDetail(value) {
    const { allowedValues, default: fallback } = Table.props.rowDetail;
    this._rowDetail = allowedValues.includes(value) ? value : fallback;
    this._expanded.clear();
    this._contentVersion += 1;
    this._syncClickable();
    if (this._engine) this.renderTable();
  }
  get rowDetail() { return this._rowDetail; }

  set renderDetail(value) {
    this._renderDetail = typeof value === 'function' ? value : null;
    this._detailRows.clear();
  }
  get renderDetail() { return this._renderDetail; }

  set detailTitle(value) {
    this._detailTitle = typeof value === 'function' ? value : null;
  }
  get detailTitle() { return this._detailTitle; }

  set rowActions(value) {
    this._rowActions = Array.isArray(value) || typeof value === 'function' || value === true ? value : null;
    this._contentVersion += 1;
    if (this._engine) this.renderTable();
  }
  get rowActions() { return this._rowActions; }

  set onRowMenu(value) {
    const next = typeof value === 'function' ? value : null;
    if (next === this._onRowMenu) return;
    this._closeExternalMenu(false);
    this._onRowMenu = next;
    this._contentVersion += 1;
    if (this._engine) this.renderTable();
  }
  get onRowMenu() { return this._onRowMenu; }

  set exportMenu(value) {
    this._exportMenu = Array.isArray(value) ? value : null;
  }
  get exportMenu() { return this._exportMenu; }

  async init() {
    // Nothing is saved while booting: only what the USER changes is remembered,
    // or the initial props would be frozen into storage on the first visit.
    this._booting = true;
    this._resolvedColumns = this._resolveColumns();
    this._syncGridMode();

    // The engine owns the view state (data, search, filters, page, sort). Built
    // per-instance and explicitly destroyed in beforeDestroy() (a Service has no
    // DOM, so it is not auto-cleaned by the parent's destroy cascade).
    this._engine = await slice.build('DataGridEngine', {
      sliceId: `slice-table-grid-${Table._seq}-${++this._identitySeq}`,
      data: this._rows,
      pageSize: this._effectivePageSize(),
      sort: this._defaultSort,
      manual: this._remote,
      totalItems: this._totalItems
    });
    this._mounted = true;

    this.$head.addEventListener('click', this._handleHeaderClick);
    this.$head.addEventListener('keydown', this._handleHeaderKeydown);
    this.$head.addEventListener('change', this._handleHeadChange);
    this.$body.addEventListener('click', this._handleBodyClick);
    this.$body.addEventListener('keydown', this._handleBodyKeydown);
    this.$body.addEventListener('change', this._handleBodyChange);
    this.$wrapper.addEventListener('scroll', this._handleScroll, { passive: true });
    this.$searchInput.addEventListener('input', this._handleSearchInput);
    this.$searchInput.addEventListener('keydown', this._handleSearchKeydown);
    this.$chips.addEventListener('click', this._handleChipClick);
    this.$filtersToggle.addEventListener('click', this._toggleFilterPanel);
    this.$exportToggle.addEventListener('click', this._toggleExportMenu);
    this.$viewToggle.addEventListener('click', this._toggleViewMenu);
    this.$menu.addEventListener('click', this._handleMenuClick);
    this.$menu.addEventListener('keydown', this._handleMenuKeydown);
    this.$menu.addEventListener('focusout', this._handleMenuFocusOut);
    this.$cardsBar.addEventListener('change', this._handleCardsBarChange);
    this.$cardsBar.addEventListener('click', this._handleCardsBarClick);
    this.$body.addEventListener('dblclick', this._handleBodyDoubleClick);
    this.$body.addEventListener('focusout', this._handleBodyFocusOut);
    // The undo and error bar is an Alert, built once and reused.
    this._alert = /** @type {any} */ (await slice.build(/** @type {any} */ ('Alert'), {
      open: false, size: 'sm', tone: 'neutral', variant: 'filled', dismissible: true, dismissLabel: this._text.dismiss
    }));
    if (this._alert) this.$notice.appendChild(this._alert);
    if (this._context) {
      this._watchContext();
      const rows = this._contextRows();
      if (rows) {
        this._rows = rows;
        this._engine.setData(rows);
      }
    }

    this.$searchInput.value = this._query;
    this.$panel.id = `${this._uid}-filters`;
    this.$filtersToggle.setAttribute('aria-controls', this.$panel.id);

    // Sticky columns are positioned from measured widths, which change with the
    // content and the viewport. Disconnected in beforeDestroy (§9).
    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(() => this._layoutSticky());
      this._resizeObserver.observe(this.$table);
    }

    this._resolveFilterConfigs();
    const restored = this._restoreState();
    if (!this._hiddenGiven) {
      for (const column of this._resolvedColumns) if (column.hidden) this._hidden.add(String(column.key));
    }
    this._computeView();
    this._applyLayout();
    this._applyFilters(false, false);
    // A remote table must fetch what the restored state asks for.
    if (restored && this._remote) {
      if (this._onFilterChange && this._engine.isFiltered) this._onFilterChange({ search: this._query, filters: this._engine.filters });
      if (this._onSortChange && this._engine.sort) this._onSortChange(this._publicSort(this._engine.sort));
    }
    await this._applyPagination(); // builds the pager if paginating + renders
    this._booting = false;
    // A `load` from QueryService says when its data went stale (after a
    // change somewhere else): ask again, keeping what is on screen.
    if (typeof this._load?.subscribe === 'function') this._loadWatch = this._load.subscribe(() => this.reload());
    if (this._load) this._fetch();
  }

  // A cached route came back: the data may have changed meanwhile.
  update() {
    if (this._mounted) this.reload();
  }

  beforeDestroy() {
    this.$head.removeEventListener('click', this._handleHeaderClick);
    this.$head.removeEventListener('keydown', this._handleHeaderKeydown);
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._scrollFrame) cancelAnimationFrame(this._scrollFrame);
    this._mounted = false;
    this._loadWatch?.();
    this._loadWatch = null;
    this._abort?.abort();
    this._closeCellEditor(false);
    for (const timer of this._timers) clearTimeout(timer);
    this._timers.clear();
    // Leaving settles a waiting undo, as the time running out would.
    this._flushNotice();
    if (this._alert) slice.controller.destroyComponent(this._alert);
    this._alert = null;
    this.$body.removeEventListener('dblclick', this._handleBodyDoubleClick);
    this.$body.removeEventListener('focusout', this._handleBodyFocusOut);
    clearTimeout(this._searchTimer);
    clearTimeout(this._flashTimer);
    // A pending save would be lost with the component: write it now.
    if (this._persistTimer) this._saveState();
    // Installed on document while a menu is open (§9).
    document.removeEventListener('pointerdown', this._handleOutsidePointer, true);
    this._closeExternalMenu(false);
    slice.controller.destroyByContainer(this.$menu);
    slice.controller.destroyByContainer(this.$foot);
    if (this._modal) {
      if (this._modal.open) this._modal.open = false;
      slice.controller.destroyComponent(this._modal);
      this._modal = null;
    }
    // Cells appended after init() are not in childrenIndex, so the destroy
    // cascade never reaches them (same reason as _releaseChildren).
    slice.controller.destroyByContainer(this.$head);
    slice.controller.destroyByContainer(this.$body);
    // Children built via slice.build are NOT auto-cascaded on destroy (the
    // controller's childrenIndex is only populated when registerComponent gets
    // a parent, which slice.build never passes). Destroy both explicitly.
    if (this._engine) {
      slice.controller.destroyComponent(this._engine);
      this._engine = null;
    }
    if (this._pager) {
      slice.controller.destroyComponent(this._pager);
      this._pager = null;
    }
  }

  // ---------------------------------------------------------------- public

  /** Every row that passes the search and filters, in the current sort order. */
  getFilteredRows() {
    return this._engine ? [...this._engine.sortedRows()] : [];
  }

  /** The selected rows (from the rows the table holds). */
  getSelectedRows() {
    if (this._selectedKeys.size === 0) return [];
    return this._rows.filter((row, index) => this._selectedKeys.has(this._keyOf(row, index)));
  }

  /** Set, replace or (with null) remove the filter on one column, as the user would. */
  setFilter(key, filter) {
    const id = String(key);
    if (filter === null || filter === undefined) this._filterState.delete(id);
    else this._filterState.set(id, { type: filter.type, op: filter.op, value: filter.value });
    this._syncEditors();
    this._applyFilters(true);
  }

  /** Remove the search and every filter, as the user would ("Clear all"). */
  clearFilters() {
    this._query = '';
    this.$searchInput.value = '';
    this._filterState.clear();
    this._syncEditors();
    this._applyFilters(true);
  }

  // --- internals ---
  _effectivePageSize() {
    // Virtual mode scrolls the whole set; pagination does not apply.
    if (this._virtual) return Math.max(1, this._rows.length);
    // In remote mode the rows ARE one page, so pageSize drives totalPages
    // (combined with totalItems); never derive it from the row count.
    if (this._remote || this._paginate) return this._pageSize;
    return Math.max(1, this._rows.length);
  }

  _resolveColumns() {
    if (Array.isArray(this._columns) && this._columns.length) {
      return this._columns.map((col, index) => ({
        key: col.key !== undefined ? col.key : index,
        label: col.label !== undefined ? col.label : String(col.key !== undefined ? col.key : index),
        sortable: col.sortable !== undefined ? col.sortable : this._sortable,
        // Only what the author DECLARED, not a filled-in 'left' default: a filled
        // default would make every column "explicitly aligned" and silently disable
        // the automatic right-alignment of numeric cells. Cells default to left
        // through plain CSS.
        align: col.align || null,
        // Sorting by something other than `row[key]`: a function or a nested path
        // ('user.name'), plus an optional custom comparison.
        sortValue: col.sortValue !== undefined ? col.sortValue : null,
        compare: typeof col.compare === 'function' ? col.compare : null,
        // Column sizing (#9). `width` is a CSS length; `minWidth` floors the column
        // when the layout is `auto` and the content would squeeze it further.
        width: col.width !== undefined && col.width !== null ? col.width : null,
        minWidth: col.minWidth !== undefined && col.minWidth !== null ? col.minWidth : null,
        render: typeof col.render === 'function' ? col.render : null,
        // Filtering and search read the DATA, not what `render` draws.
        filter: col.filter !== undefined ? col.filter : null,
        filterValue: col.filterValue !== undefined ? col.filterValue : null,
        searchable: col.searchable !== false,
        searchValue: col.searchValue !== undefined ? col.searchValue : null,
        sticky: col.sticky === true,
        exportable: col.exportable !== false,
        exportValue: col.exportValue !== undefined ? col.exportValue : null,
        // 'sum' | 'avg' | 'count' | 'min' | 'max' | (values, rows) => any
        aggregate: col.aggregate !== undefined && col.aggregate !== null ? col.aggregate : null,
        aggregateFormat: typeof col.aggregateFormat === 'function' ? col.aggregateFormat : null,
        hideable: col.hideable !== false,
        hidden: col.hidden === true,
        // Editing in the cell: true, a control type, or { type, options,
        // required, min, max, step, validate, parse } (shared/editing/inlineControl.js).
        edit: normalizeEdit(col.edit)
      }));
    }
    // Legacy: derive positional columns from string headers.
    return (this._headers || []).map((header, index) => ({
      key: index,
      label: header,
      sortable: this._sortable,
      align: null,
      sortValue: null,
      compare: null,
      width: null,
      minWidth: null,
      render: null,
      filter: null,
      filterValue: null,
      searchable: true,
      searchValue: null,
      sticky: false,
      exportable: true,
      exportValue: null,
      aggregate: null,
      aggregateFormat: null,
      hideable: true,
      hidden: false,
      edit: null
    }));
  }

  _refreshColumns() {
    this._resolvedColumns = this._resolveColumns();
    this._syncGridMode();
    this._computeView();
    this._contentVersion += 1;
    this._panelStale = true;
    this._resolveFilterConfigs();
    this._applyFilters(false, false);
    this.renderTable();
  }

  _cellValue(row, column) {
    if (Array.isArray(row)) return row[column.key];
    if (row && typeof row === 'object') return row[column.key];
    return row;
  }

  // A function, a nested key path ('user.name') or null (→ fallback).
  _pathAccessor(spec) {
    if (typeof spec === 'function') return spec;
    if (typeof spec === 'string' && spec) {
      const path = spec.split('.');
      return (row) => path.reduce((value, part) => (value == null ? undefined : value[part]), row);
    }
    return null;
  }

  _valueAccessor(column) {
    return this._pathAccessor(column.filterValue) || ((row) => this._cellValue(row, column));
  }

  // A column can sort by something other than `row[key]`: `sortValue` is a function
  // or a nested key path ('user.name'), and `compare(a, b)` replaces the default
  // comparison. Both are handed to the engine as part of the sort state, which is
  // what threads them through the asc → desc → unsorted cycle.
  _sortAccessor(column) {
    if (!column) return null;
    return this._pathAccessor(column.sortValue);
  }

  _sortOptions(column) {
    return {
      accessor: this._sortAccessor(column),
      comparator: column && typeof column.compare === 'function' ? column.compare : null
    };
  }

  _sortOptionsFor(key) {
    return this._sortOptions(this._resolvedColumns.find((entry) => String(entry.key) === String(key)));
  }

  // The engine's sort state carries the column's functions; the PUBLIC payload must
  // not, or every click would hand the consumer a pile of closures. Keep the shape
  // consumers already rely on: `{ key, direction }` or null.
  _publicSort(sort) {
    return sort ? { key: sort.key, direction: sort.direction } : null;
  }

  _handleHeaderClick(event) {
    if (event.target.closest('.table_select')) return;
    const cell = event.target.closest('[data-sort-key]');
    if (cell) this._sortByCell(cell);
  }

  _handleHeaderKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.target.closest('.table_select')) return;
    const cell = event.target.closest('[data-sort-key]');
    if (!cell) return;
    event.preventDefault();
    this._sortByCell(cell);
  }

  _sortByCell(cell) {
    if (!this._engine) return;
    const column = this._viewColumns[Number(cell.dataset.sortIndex)];
    this._engine.toggleSort(cell.dataset.sortKey, this._sortOptions(column));
    if (this._onSortChange) this._onSortChange(this._publicSort(this._engine.sort));
    this._queueFetch();
    this._persist();
    this._resetScroll();
    this._afterStateChange();
  }

  _goToPage(page) {
    if (!this._engine) return;
    this._engine.setPage(page);
    if (this._onPageChange) this._onPageChange(this._engine.page);
    this._queueFetch();
    this._afterStateChange();
  }

  _afterStateChange() {
    if (this._pager) {
      this._pager.totalPages = this._engine.totalPages;
      this._pager.currentPage = this._engine.page;
    }
    this.renderTable();
  }

  // Reactive pagination: reconfigure the engine's page size, lazily build the
  // pager the first time it is needed, then just show/hide it — never destroy
  // and recreate. The pager is a controlled component, so reconfiguring is a
  // matter of setting its props (done in _afterStateChange).
  async _applyPagination() {
    if (!this._engine) return;
    this._engine.setPageSize(this._effectivePageSize());
    if (this._paginate && !this._pager && !this._buildingPager) {
      this._buildingPager = true;
      this._pager = await slice.build('Pagination', {
        currentPage: this._engine.page,
        totalPages: this._engine.totalPages,
        // The engine owns the page; the pager reports and follows it.
        controlled: true,
        onPageChange: (page) => this._goToPage(page)
      });
      this._buildingPager = false;
      this.$footer.appendChild(this._pager);
    }
    if (this._pager) this._pager.style.display = this._paginate && !this._virtual ? '' : 'none';
    this._afterStateChange();
  }

  _applyLayout() {
    this.classList.toggle('table--virtual', this._virtual === true);
    const sticky = this._stickyHeader === true || this._virtual === true;
    this.classList.toggle('table--sticky-header', sticky);
    if (!this.$wrapper) return;
    if (this._virtual) {
      this.$wrapper.style.height = this._maxHeight || '480px';
      this.$wrapper.style.maxHeight = '';
    } else {
      this.$wrapper.style.height = '';
      this.$wrapper.style.maxHeight = this._maxHeight || '';
    }
    this.classList.toggle('table--scroll-y', !!(this._virtual || this._maxHeight));
  }

  _resetScroll() {
    if (this.$wrapper && (this._virtual || this._maxHeight)) this.$wrapper.scrollTop = 0;
  }

  // ------------------------------------------------------------- filtering

  _label(key, vars = {}) {
    const template = this._text[key] ?? DEFAULT_LABELS[key] ?? '';
    return String(template).replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? String(vars[name]) : ''));
  }

  _opLabel(op) {
    return this._text.operators?.[op] ?? DEFAULT_LABELS.operators[op] ?? op;
  }

  // Which columns get a filter editor, of what type, with which options.
  _resolveFilterConfigs() {
    const configs = [];
    for (const column of this._resolvedColumns) {
      const spec = column.filter;
      if (spec === false) continue;
      if (!this._filterable && (spec === null || spec === undefined)) continue;
      const declared = typeof spec === 'string' ? spec : spec && typeof spec === 'object' ? spec.type : null;
      const read = this._valueAccessor(column);
      const values = this._rows.map((row) => read(row));
      // The engine's class (DataGridEngine) carries the static inferType helper.
      const engineClass = /** @type {any} */ (this._engine?.constructor);
      const type = FILTER_OPERATORS[declared]
        ? declared
        : engineClass && typeof engineClass.inferType === 'function'
          ? engineClass.inferType(values)
          : 'text';
      const config = {
        key: String(column.key),
        label: (spec && typeof spec === 'object' && spec.label) || (column.label != null ? String(column.label) : String(column.key)),
        type,
        placeholder: spec && typeof spec === 'object' ? spec.placeholder || null : null,
        options: null
      };
      if (type === 'select') config.options = this._selectOptions(spec, values);
      configs.push(config);
    }
    this._filterConfigs = configs;
  }

  _selectOptions(spec, values) {
    const declared = spec && typeof spec === 'object' && Array.isArray(spec.options) ? spec.options : null;
    if (declared) {
      return declared.map((option) => (option && typeof option === 'object'
        ? { value: option.value, label: option.label !== undefined ? String(option.label) : String(option.value) }
        : { value: option, label: String(option) }));
    }
    const seen = new Map();
    for (const value of values) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item === null || item === undefined || item === '') continue;
        if (!seen.has(String(item))) seen.set(String(item), item);
      }
    }
    return [...seen.values()]
      .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }))
      .slice(0, 100)
      .map((value) => ({ value, label: String(value) }));
  }

  _configFor(key) {
    return this._filterConfigs.find((config) => config.key === String(key)) || null;
  }

  // Push the edited state into the engine. `emit` is false for programmatic
  // changes (props), true for user ones; `render` is false when the caller
  // renders itself.
  _applyFilters(emit, render = true) {
    if (!this._engine) return;
    const filters = [];
    for (const [key, state] of this._filterState) {
      const column = this._resolvedColumns.find((col) => String(col.key) === key);
      const config = this._configFor(key);
      const filter = {
        key: column ? column.key : key,
        type: state.type || (config ? config.type : 'text'),
        op: state.op,
        value: state.value
      };
      if (column) filter.accessor = this._valueAccessor(column);
      filters.push(filter);
    }
    // The search covers the columns the user can SEE.
    const searchAccessors = (this._viewColumns.length ? this._viewColumns : this._resolvedColumns)
      .filter((column) => column.searchable)
      .map((column) => this._pathAccessor(column.searchValue) || this._valueAccessor(column));

    this._engine.setFilters(filters);
    this._engine.setSearch(this._query, searchAccessors);
    this._resetScroll();

    if (emit && this._onFilterChange) {
      this._onFilterChange({ search: this._query, filters: this._engine.filters });
    }
    this._queueFetch();
    this._persist();
    if (render) this._afterStateChange();
  }

  _handleSearchInput() {
    clearTimeout(this._searchTimer);
    // Debounced: a 10,000-row filter per keystroke is wasted work while typing.
    this._searchTimer = window.setTimeout(() => {
      this._query = this.$searchInput.value;
      this._applyFilters(true);
    }, 180);
  }

  _handleSearchKeydown(event) {
    if (event.key === 'Escape' && this.$searchInput.value) {
      event.preventDefault();
      clearTimeout(this._searchTimer);
      this.$searchInput.value = '';
      this._query = '';
      this._applyFilters(true);
    } else if (event.key === 'Enter') {
      clearTimeout(this._searchTimer);
      this._query = this.$searchInput.value;
      this._applyFilters(true);
    }
  }

  _toggleFilterPanel() {
    this._panelOpen = !this._panelOpen;
    if (this._panelOpen && this._panelStale) this._buildPanel();
    this.$panel.hidden = !this._panelOpen;
    this.$filtersToggle.setAttribute('aria-expanded', this._panelOpen ? 'true' : 'false');
    this.$filtersToggle.classList.toggle('table_filters_toggle--open', this._panelOpen);
    if (this._panelOpen) {
      const first = this.$panel.querySelector('select, input');
      if (first) first.focus();
    }
  }

  // ----------------------------------------------------------- filter panel

  _buildPanel() {
    this._panelStale = false;
    this._editors.clear();
    const nodes = this._filterConfigs.map((config) => this._buildEditor(config));
    this.$panel.replaceChildren(...nodes);
    this._syncEditors();
  }

  _setFilterState(key, next) {
    this._filterState.set(key, next);
    this._applyFilters(true);
  }

  _el(tag, className, attrs = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'text') el.textContent = value;
      else if (value !== null && value !== undefined) el.setAttribute(name, value);
    }
    return el;
  }

  _buildEditor(config) {
    const id = `${this._uid}-f-${config.key.replace(/[^\w-]/g, '_')}`;
    const root = this._el('div', `table_filter table_filter--${config.type}`, { 'data-filter-key': config.key, role: 'group', 'aria-labelledby': `${id}-label` });
    root.appendChild(this._el('span', 'table_filter_label', { id: `${id}-label`, text: config.label }));
    const controls = this._el('div', 'table_filter_controls');
    root.appendChild(controls);
    const state = () => this._filterState.get(config.key) || { type: config.type };

    let sync;
    if (config.type === 'boolean') {
      const select = this._el('select', 'table_filter_input', { 'aria-label': config.label });
      for (const [value, text] of [['', this._text.any], ['true', this._text.yes], ['false', this._text.no]]) {
        select.appendChild(this._el('option', null, { value, text }));
      }
      select.addEventListener('change', () => {
        if (select.value === '') this._filterState.delete(config.key);
        else this._filterState.set(config.key, { type: 'boolean', op: 'is', value: select.value === 'true' });
        this._applyFilters(true);
      });
      controls.appendChild(select);
      sync = (s) => {
        select.value = s && typeof s.value === 'boolean' ? String(s.value) : s && (s.value === 'true' || s.value === 'false') ? s.value : '';
      };
    } else if (config.type === 'select') {
      const op = this._opSelect(config, id);
      const list = this._el('div', 'table_filter_options', { role: 'group', 'aria-label': config.label });
      const boxes = config.options.map((option, index) => {
        const label = this._el('label', 'table_filter_option');
        const box = this._el('input', null, { type: 'checkbox', id: `${id}-o${index}` });
        box.dataset.index = String(index);
        label.append(box, this._el('span', null, { text: option.label }));
        list.appendChild(label);
        return box;
      });
      const commit = () => {
        const value = boxes.filter((box) => box.checked).map((box) => config.options[Number(box.dataset.index)].value);
        this._setFilterState(config.key, { type: 'select', op: op.value, value });
      };
      list.addEventListener('change', commit);
      op.addEventListener('change', () => {
        list.hidden = op.value === 'empty' || op.value === 'notEmpty';
        commit();
      });
      controls.append(op, list);
      sync = (s) => {
        op.value = s && s.op && FILTER_OPERATORS.select.includes(s.op) ? s.op : 'in';
        list.hidden = op.value === 'empty' || op.value === 'notEmpty';
        const chosen = new Set((Array.isArray(s?.value) ? s.value : s?.value != null ? [s.value] : []).map((v) => String(v)));
        boxes.forEach((box, index) => { box.checked = chosen.has(String(config.options[index].value)); });
      };
    } else {
      // text, number, date: operator + one input (two for `between`).
      const op = this._opSelect(config, id);
      const inputType = config.type === 'number' ? 'number' : config.type === 'date' ? 'date' : 'text';
      const first = this._el('input', 'table_filter_input', {
        type: inputType,
        'aria-label': `${config.label} ${this._text.value}`,
        placeholder: config.placeholder || (inputType === 'text' ? this._text.value : null)
      });
      const second = this._el('input', 'table_filter_input', { type: inputType, 'aria-label': `${config.label} ${this._text.to}` });
      const range = this._el('div', 'table_filter_range');
      range.append(first, second);
      let timer = 0;
      const read = () => {
        if (op.value === 'between') {
          const parse = (input) => (input.value === '' ? null : config.type === 'number' ? Number(input.value) : input.value);
          return [parse(first), parse(second)];
        }
        if (first.value === '') return '';
        return config.type === 'number' ? Number(first.value) : first.value;
      };
      const layout = () => {
        const noValue = op.value === 'empty' || op.value === 'notEmpty';
        range.hidden = noValue;
        second.hidden = op.value !== 'between';
        first.setAttribute('aria-label', `${config.label} ${op.value === 'between' ? this._text.from : this._text.value}`);
        if (op.value === 'between') first.placeholder = this._text.from;
        if (op.value === 'between') second.placeholder = this._text.to;
      };
      const commit = () => this._setFilterState(config.key, { type: config.type, op: op.value, value: read() });
      const commitSoon = () => {
        clearTimeout(timer);
        timer = window.setTimeout(commit, config.type === 'text' ? 200 : 120);
      };
      first.addEventListener('input', commitSoon);
      second.addEventListener('input', commitSoon);
      op.addEventListener('change', () => { layout(); commit(); });
      controls.append(op, range);
      sync = (s) => {
        const ops = FILTER_OPERATORS[config.type];
        op.value = s && ops.includes(s.op) ? s.op : ops[0];
        layout();
        const value = s ? s.value : '';
        if (op.value === 'between') {
          const [lo, hi] = Array.isArray(value) ? value : [value, null];
          first.value = lo === null || lo === undefined ? '' : String(lo);
          second.value = hi === null || hi === undefined ? '' : String(hi);
        } else {
          first.value = value === null || value === undefined || Array.isArray(value) ? '' : String(value);
          second.value = '';
        }
      };
    }

    this._editors.set(config.key, { root, sync: () => sync(state()) });
    return root;
  }

  _opSelect(config, id) {
    const select = this._el('select', 'table_filter_op', { 'aria-label': `${config.label} ${this._text.operator}`, id: `${id}-op` });
    for (const op of FILTER_OPERATORS[config.type]) {
      select.appendChild(this._el('option', null, { value: op, text: this._opLabel(op) }));
    }
    return select;
  }

  // Bring the editors in line with the state (after a chip removal, "Clear all"
  // or a programmatic change) without rebuilding them, so focus is never lost.
  _syncEditors() {
    if (this._panelStale) return;
    for (const editor of this._editors.values()) editor.sync();
  }

  // ------------------------------------------------------- chips & toolbar

  _formatDay(value) {
    if (value === null || value === undefined || value === '') return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value);
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
    } catch {
      return date.toDateString();
    }
  }

  _filterText(filter) {
    const config = this._configFor(filter.key);
    const label = config ? config.label : String(filter.key);
    const op = this._opLabel(filter.op);
    if (filter.op === 'empty' || filter.op === 'notEmpty') return `${label} ${op}`;
    const show = (value) => (filter.type === 'date' ? this._formatDay(value) : String(value));
    switch (filter.type) {
      case 'boolean':
        return `${label}: ${filter.value === true || filter.value === 'true' ? this._text.yes : this._text.no}`;
      case 'select': {
        const options = config?.options || [];
        const names = (Array.isArray(filter.value) ? filter.value : [filter.value]).map((value) => {
          const match = options.find((option) => String(option.value) === String(value));
          return match ? match.label : String(value);
        });
        const shown = names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3}` : names.join(', ');
        return `${label} ${op}: ${shown}`;
      }
      case 'number':
      case 'date': {
        if (filter.op === 'between') {
          const [lo, hi] = Array.isArray(filter.value) ? filter.value : [filter.value, null];
          const has = (v) => v !== null && v !== undefined && v !== '';
          if (has(lo) && has(hi)) return `${label} ${op} ${show(lo)} – ${show(hi)}`;
          if (has(lo)) return `${label} ${this._opLabel(filter.type === 'date' ? 'after' : 'gte')} ${show(lo)}`;
          return `${label} ${this._opLabel(filter.type === 'date' ? 'before' : 'lte')} ${show(hi)}`;
        }
        return `${label} ${op} ${show(filter.value)}`;
      }
      default:
        return `${label} ${op} “${filter.value}”`;
    }
  }

  _chip(text, data) {
    const chip = this._el('span', 'table_chip');
    chip.appendChild(this._el('span', 'table_chip_text', { text }));
    const remove = this._el('button', 'table_chip_remove', {
      type: 'button',
      'aria-label': `${this._text.removeFilter}: ${text}`
    });
    for (const [name, value] of Object.entries(data)) remove.dataset[name] = value;
    remove.appendChild(this._el('span', null, { 'aria-hidden': 'true', text: '×' }));
    chip.appendChild(remove);
    return chip;
  }

  _handleChipClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.classList.contains('table_chips_clear')) {
      this.clearFilters();
      if (this.$searchInput && this._searchable) this.$searchInput.focus();
      return;
    }
    if (button.dataset.search !== undefined) {
      this._query = '';
      this.$searchInput.value = '';
    } else if (button.dataset.filterKey !== undefined) {
      this._filterState.delete(button.dataset.filterKey);
      this._syncEditors();
    }
    this._applyFilters(true);
    // Keep the keyboard user in the chip row, not on <body>.
    const next = this.$chips.querySelector('button');
    if (next) next.focus();
  }

  // Toolbar, chips and status: everything around the table.
  _renderChrome() {
    if (!this._engine) return;
    const filters = this._engine.filters;
    const hasFilterUi = this._filterConfigs.length > 0;
    const hasView = this._columnToggle === true || this._densityToggle === true;
    const showToolbar = this._searchable || hasFilterUi || this._exportable || hasView;

    this.$toolbar.hidden = !showToolbar;
    this.$search.hidden = !this._searchable;
    this.$searchInput.placeholder = this._searchPlaceholder || this._text.searchPlaceholder;
    this.$searchInput.setAttribute('aria-label', this._text.searchLabel);
    this.$filtersToggle.hidden = !hasFilterUi;
    this.$filtersToggleLabel.textContent = this._text.filters;
    this.$filtersCount.hidden = filters.length === 0;
    this.$filtersCount.textContent = String(filters.length);
    this.$export.hidden = !this._exportable;
    this.$viewToggle.hidden = !hasView;
    this.$viewLabel.textContent = this._text.view;
    this.$exportLabel.textContent = this._text.export;
    if (!hasFilterUi && this._panelOpen) this._toggleFilterPanel();
    if (this._panelOpen && this._panelStale) this._buildPanel();

    // Active filters as removable chips.
    const query = this._query.trim();
    const chips = [];
    if (query) chips.push(this._chip(`${this._text.searchChip}: “${query}”`, { search: '' }));
    for (const filter of filters) chips.push(this._chip(this._filterText(filter), { filterKey: String(filter.key) }));
    if (chips.length > 0) {
      chips.push(this._el('button', 'table_chips_clear', { type: 'button', text: this._text.clearAll }));
    }
    this.$chips.replaceChildren(...chips);
    this.$chips.hidden = chips.length === 0;

    // "12 of 200 rows" while narrowed, the selection count when selecting.
    const parts = [];
    if (this._engine.isFiltered) {
      parts.push(this._label('showing', { shown: this._engine.totalItems, total: this._engine.totalUnfiltered }));
    }
    if (this._selection !== 'none' && this._selectedKeys.size > 0) {
      parts.push(this._label('selected', { count: this._selectedKeys.size }));
    }
    // A transient confirmation ("Copied 12 rows") wins for a moment.
    this.$status.textContent = this._flashText || parts.join(' · ');
    this._renderCardsBar();
  }

  _flash(text) {
    clearTimeout(this._flashTimer);
    this._flashText = text;
    this._renderChrome();
    this._flashTimer = window.setTimeout(() => {
      this._flashText = '';
      if (this._engine) this._renderChrome();
    }, 2500);
  }

  // ------------------------------------------------------------- rendering

  // Stable identity of a row, as a string. `rowKey` (path or function) when
  // given; otherwise the row object itself (by reference), or its position for
  // a primitive row.
  _keyOf(row, index) {
    if (typeof this._rowKey === 'function') return String(this._rowKey(row));
    if (typeof this._rowKey === 'string') {
      const read = this._pathAccessor(this._rowKey);
      return String(read(row));
    }
    if (row && typeof row === 'object') {
      let id = this._identity.get(row);
      if (!id) {
        id = `r${++this._identitySeq}`;
        this._identity.set(row, id);
      }
      return id;
    }
    return `i${index}:${String(row)}`;
  }

  renderTable() {
    if (!this.$head || !this.$body || !this._engine) return;
    this._renderHead();
    this._renderBody(true);
    this._renderFoot();
    this._renderChrome();
  }

  // Cells in one row: selection, expand toggle, the visible columns, actions.
  _visibleColumnsCount() {
    return this._viewColumns.length +
      (this._selection !== 'none' ? 1 : 0) +
      (this._hasExpand() ? 1 : 0) +
      (this._hasActions() ? 1 : 0);
  }

  _renderHead() {
    const columns = this._viewColumns;
    const sort = this._engine.sort;
    const activeFilters = new Set(this._engine.filters.map((filter) => String(filter.key)));

    // A rebuilt header must not drop the keyboard user's focus (a sort click).
    const focused = this.$head.contains(document.activeElement) ? document.activeElement : null;
    const focusKey = focused?.closest?.('[data-sort-key]')?.dataset.sortKey ?? null;
    const focusSelectAll = !!focused?.closest?.('.table_select');

    this._releaseChildren(this.$head, []);
    this.$head.replaceChildren();
    if (columns.length === 0) return;

    const headRow = document.createElement('tr');
    if (this._selection !== 'none') {
      const th = this._el('th', 'table_select_cell', { scope: 'col' });
      if (this._selection === 'multiple') {
        const box = this._el('input', 'table_select table_select_all', { type: 'checkbox', 'aria-label': this._text.selectAll });
        th.appendChild(box);
      } else {
        th.appendChild(this._el('span', 'table_visually_hidden', { text: this._text.selectRow }));
      }
      headRow.appendChild(th);
    }
    if (this._hasExpand()) {
      const th = this._el('th', 'table_expand_cell', { scope: 'col' });
      th.appendChild(this._el('span', 'table_visually_hidden', { text: this._text.details }));
      headRow.appendChild(th);
    }

    columns.forEach((column, columnIndex) => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.dataset.columnIndex = String(columnIndex);
      const thAlign = this._alignClass(column.align) || (this._numericColumns?.[columnIndex] ? 'table_cell--num' : '');
      if (thAlign) th.classList.add(thAlign);
      if (column.width !== null) th.style.width = typeof column.width === 'number' ? `${column.width}px` : column.width;
      if (column.minWidth !== null) th.style.minWidth = typeof column.minWidth === 'number' ? `${column.minWidth}px` : column.minWidth;
      th.textContent = column.label != null ? String(column.label) : '';

      if (activeFilters.has(String(column.key))) {
        th.classList.add('table_head_cell--filtered');
        th.appendChild(this._el('span', 'table_filter_dot', { 'aria-hidden': 'true' }));
      }

      if (column.sortable) {
        th.classList.add('table_head_cell--sortable');
        th.dataset.sortKey = String(column.key);
        th.dataset.sortIndex = String(columnIndex);
        th.setAttribute('tabindex', '0'); // focusable; keyboard handled via keydown delegation
        const active = sort && String(sort.key) === String(column.key);
        const direction = active ? (sort.direction === 'asc' ? 'asc' : 'desc') : null;
        const indicator = document.createElement('span');
        // Empty on purpose: the chevron is drawn in CSS in a fixed-width slot, so
        // the label cannot shift when the sort state changes.
        indicator.className = 'table_sort_indicator' + (direction ? ` table_sort_indicator--${direction}` : '');
        indicator.setAttribute('aria-hidden', 'true');
        th.appendChild(indicator);
        th.setAttribute('aria-sort', active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none');
      }
      headRow.appendChild(th);
    });
    if (this._hasActions()) {
      const th = this._el('th', 'table_actions_cell', { scope: 'col' });
      th.appendChild(this._el('span', 'table_visually_hidden', { text: this._text.actions }));
      headRow.appendChild(th);
    }
    this.$head.appendChild(headRow);

    if (focusKey !== null) {
      const again = this.$head.querySelector(`[data-sort-key="${CSS.escape(focusKey)}"]`);
      if (again) again.focus();
    } else if (focusSelectAll) {
      this.$head.querySelector('.table_select_all')?.focus();
    }
  }

  // The rows to draw: one page, or (virtual) a window of the whole set.
  _bodySource() {
    if (this._virtual) {
      const all = this._engine.sortedRows();
      const height = this._effectiveRowHeight();
      const viewport = this.$wrapper.clientHeight || 480;
      const headHeight = this.$head.offsetHeight || 0;
      const top = Math.max(0, this.$wrapper.scrollTop - headHeight);
      const overscan = 6;
      const start = Math.max(0, Math.floor(top / height) - overscan);
      const end = Math.min(all.length, Math.ceil((top + viewport) / height) + overscan);
      return { rows: all.slice(start, end), offset: start, total: all.length };
    }
    const rows = this._engine.pageRows();
    const offset = this._remote ? 0 : (this._engine.page - 1) * this._engine.pageSize;
    return { rows, offset, total: this._remote ? rows.length : this._engine.totalItems };
  }

  _renderBody(force) {
    // A row menu whose row this render removes (filtered out, scrolled away,
    // another page) closes with it.
    if (this._menuState || this._externalMenu) queueMicrotask(() => this._dropStaleMenus());
    const columns = this._viewColumns;
    const { rows, offset, total } = this._bodySource();
    // Rebuilt rows must not drop the keyboard user's place in the grid.
    const refocus = this._gridMode && !this._cellEditor && this.$body.contains(document.activeElement);

    if (!force && this._window.start === offset && this._window.end === offset + rows.length) return;
    this._window = { start: offset, end: offset + rows.length };

    // Resolve every NEW row's cells before touching the DOM. `render()` is a
    // consumer callback (call it once per row per render, never twice), and the
    // resolved nodes are what tells the eviction below which children this
    // render keeps. A row whose object and content version are unchanged keeps
    // its <tr> as-is — sorting, filtering or scrolling does not rebuild it.
    const plan = rows.map((row, i) => {
      const index = offset + i;
      const key = this._keyOf(row, index);
      const cached = this._rowCache.get(key);
      // A row with an open cell editor keeps its <tr> (and the editor) even if
      // the row changed meanwhile; it is redrawn when the editor closes.
      const holdsEditor = this._cellEditor && this._cellEditor.rowKey === key;
      if (cached && (cached.row === row || holdsEditor) && cached.version === this._contentVersion) {
        return { key, row, index, cached };
      }
      const cells = columns.map((column) => this._displayCell(row, column));
      return { key, row, index, cells };
    });

    // A column whose rendered values are ALL finite numbers right-aligns as a whole,
    // header included. Mixed columns are left alone rather than aligned cell by
    // cell, which reads as broken.
    const numeric = columns.map((column, columnIndex) =>
      !column.align &&
      plan.length > 0 &&
      plan.every((entry) => (entry.cached ? entry.cached.numeric[columnIndex] : this._isNumeric(entry.cells[columnIndex])))
    );
    const numericChanged = !this._numericColumns || numeric.some((flag, i) => flag !== this._numericColumns[i]);
    this._numericColumns = numeric;
    if (numericChanged) this._renderHead();

    const target = [];
    const nextCache = new Map();
    this._renderedRows = new Map();

    if (plan.length === 0) {
      if (columns.length > 0) target.push(this._emptyRow());
    } else {
      for (const entry of plan) {
        const tr = entry.cached ? entry.cached.tr : this._buildRow(entry.row, entry.cells, columns);
        tr.dataset.rowKey = entry.key;
        tr.dataset.rowIndex = String(entry.index);
        if (this._virtual) tr.setAttribute('aria-rowindex', String(entry.index + 2));
        else tr.removeAttribute('aria-rowindex');
        const flags = entry.cached
          ? entry.cached.numeric
          : entry.cells.map((value) => this._isNumeric(value));
        nextCache.set(entry.key, { tr, row: entry.row, version: this._contentVersion, numeric: flags });
        this._renderedRows.set(entry.key, entry.row);
        target.push(tr);
        if (this._hasExpand()) {
          const open = this._expanded.has(entry.key);
          const toggle = tr.querySelector('.table_expand_toggle');
          if (toggle) {
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', `${open ? this._text.hideDetails : this._text.showDetails}${this._rowNameOf(tr)}`);
          }
          tr.classList.toggle('table_row--expanded', open);
          if (open) {
            const detail = this._detailRowFor(entry.key, entry.row);
            if (toggle) toggle.setAttribute('aria-controls', detail.firstElementChild.id);
            target.push(detail);
          }
        }
      }
      // Details of rows no longer shown are dropped (their content was evicted).
      for (const key of [...this._detailRows.keys()]) {
        if (!this._expanded.has(key) || !this._renderedRows.has(key)) this._detailRows.delete(key);
      }
      this._applyAlignment(target, columns, numeric);
    }

    // Virtual: spacers stand in for the rows above and below the window, so the
    // scrollbar reflects the whole set.
    if (this._virtual && plan.length > 0) {
      const height = this._effectiveRowHeight();
      target.unshift(this._spacer(offset * height));
      target.push(this._spacer((total - offset - plan.length) * height));
      this.$table.setAttribute('aria-rowcount', String(total + 1));
    } else {
      this.$table.removeAttribute('aria-rowcount');
    }

    // Evict whatever this render no longer shows (rows gone, rows rebuilt),
    // except nodes it re-appends.
    this._releaseChildren(this.$body, target);
    // Only rows still on screen stay cached: a row that left had its components
    // destroyed just above, so reusing its <tr> later would show dead ones.
    this._rowCache = nextCache;
    this._place(this.$body, target);

    this._paintSelection(false);
    this._paintRowStates();
    if (this._gridMode) this._syncActiveCell(refocus);
    this._layoutSticky();
  }

  _emptyRow() {
    const tr = document.createElement('tr');
    tr.className = 'table_empty_row';
    const td = document.createElement('td');
    td.className = 'table_empty';
    td.colSpan = this._visibleColumnsCount();
    if (this._fetchError) {
      // The server failed: say so, and offer to ask again.
      td.classList.add('table_empty--error');
      td.setAttribute('role', 'alert');
      td.appendChild(this._el('span', null, { text: this._text.loadError }));
      const retry = this._el('button', 'table_empty_clear', { type: 'button', text: this._text.retry });
      retry.addEventListener('click', () => this.reload());
      td.appendChild(retry);
    } else if (this._engine.isFiltered && !this._remote) {
      td.appendChild(this._el('span', null, { text: this._text.noResults }));
      const clear = this._el('button', 'table_empty_clear', { type: 'button', text: this._text.clearFilters });
      clear.addEventListener('click', () => this.clearFilters());
      td.appendChild(clear);
    } else {
      td.textContent = this._emptyMessage;
    }
    tr.appendChild(td);
    return tr;
  }

  _spacer(height) {
    const tr = this._el('tr', 'table_spacer', { 'aria-hidden': 'true' });
    const td = document.createElement('td');
    td.colSpan = this._visibleColumnsCount();
    td.style.height = `${Math.max(0, height)}px`;
    tr.appendChild(td);
    return tr;
  }

  // ", Ana López" — names a row for the buttons inside it.
  _rowNameOf(tr) {
    const name = tr.dataset.rowName;
    return name ? `: ${name}` : '';
  }

  _buildRow(row, cells, columns) {
    const tr = document.createElement('tr');
    // In a grid the cells are the tab stops, not the rows.
    if (this._syncClickable() && !this._gridMode) tr.setAttribute('tabindex', '0');
    const nameCell = cells.find((value) => typeof value === 'string' || typeof value === 'number');
    if (nameCell !== undefined) tr.dataset.rowName = String(nameCell);
    if (this._selection !== 'none') {
      const td = this._el('td', 'table_select_cell');
      const box = this._el('input', 'table_select table_select_row', {
        type: this._selection === 'single' ? 'radio' : 'checkbox',
        name: this._selection === 'single' ? `${this._uid}-select` : null,
        'aria-label': this._rowLabel(cells)
      });
      td.appendChild(box);
      tr.appendChild(td);
    }
    if (this._hasExpand()) {
      const td = this._el('td', 'table_expand_cell');
      const toggle = this._el('button', 'table_expand_toggle', { type: 'button', 'aria-expanded': 'false' });
      toggle.appendChild(this._el('span', 'table_expand_chevron', { 'aria-hidden': 'true' }));
      td.appendChild(toggle);
      tr.appendChild(td);
    }
    columns.forEach((column, columnIndex) => {
      const td = document.createElement('td');
      this.renderCell(td, cells[columnIndex]);
      if (column.label != null) td.dataset.label = String(column.label);
      td.dataset.columnIndex = String(columnIndex);
      if (this._gridMode) {
        // A grid: every data cell can be reached with the arrows (one tab
        // stop, roving), and the editable ones open an editor in place.
        td.tabIndex = -1;
        td.dataset.cell = '';
        if (column.edit) {
          td.classList.add('table_cell--editable');
          td.dataset.edit = this._cellKind(column);
        } else {
          td.setAttribute('aria-readonly', 'true');
        }
      }
      // The card title in the mobile 'cards' layout.
      if (columnIndex === 0) td.classList.add('table_primary_cell');
      tr.appendChild(td);
    });
    if (this._hasActions()) {
      const td = this._el('td', 'table_actions_cell');
      const button = this._el('button', 'table_row_menu_toggle', {
        type: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': 'false',
        'aria-label': `${this._text.rowActions}${nameCell !== undefined ? `: ${nameCell}` : ''}`
      });
      button.appendChild(this._el('span', 'table_row_menu_dots', { 'aria-hidden': 'true' }));
      td.appendChild(button);
      tr.appendChild(td);
    }
    return tr;
  }

  // "Select row: Ana López" — the first text cell names the row.
  _rowLabel(cells) {
    const first = cells.find((value) => typeof value === 'string' || typeof value === 'number');
    return first !== undefined ? `${this._text.selectRow}: ${first}` : this._text.selectRow;
  }

  _applyAlignment(trs, columns, numeric) {
    const classes = columns.map((column, i) => this._alignClass(column.align) || (numeric[i] ? 'table_cell--num' : ''));
    for (const tr of trs) {
      for (const td of tr.children) {
        const index = td.dataset.columnIndex;
        if (index === undefined) continue;
        td.classList.remove('table_cell--left', 'table_cell--center', 'table_cell--right', 'table_cell--num');
        const cls = classes[Number(index)];
        if (cls) td.classList.add(cls);
      }
    }
  }

  // Put `target` into `container` in order with the fewest moves (the nodes
  // already in a correct relative order stay put), so a focused control in a
  // row that did not move keeps its focus.
  _place(container, target) {
    const keep = new Set(target);
    for (const child of Array.from(container.children)) {
      if (!keep.has(child)) child.remove();
    }
    const position = new Map();
    Array.from(container.children).forEach((child, i) => position.set(child, i));
    const seq = target.map((node) => (position.has(node) ? position.get(node) : -1));
    const stable = this._longestIncreasing(seq);
    let anchor = null;
    for (let i = target.length - 1; i >= 0; i--) {
      if (!stable.has(i)) container.insertBefore(target[i], anchor);
      anchor = target[i];
    }
  }

  _longestIncreasing(seq) {
    const tails = [];
    const prev = new Array(seq.length).fill(-1);
    for (let i = 0; i < seq.length; i++) {
      const v = seq[i];
      if (v < 0) continue;
      let lo = 0;
      let hi = tails.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (seq[tails[mid]] < v) lo = mid + 1; else hi = mid;
      }
      if (lo > 0) prev[i] = tails[lo - 1];
      tails[lo] = i;
    }
    const result = new Set();
    let k = tails.length ? tails[tails.length - 1] : -1;
    while (k !== -1) {
      result.add(k);
      k = prev[k];
    }
    return result;
  }

  _handleScroll() {
    if (!this._virtual || this._scrollFrame) return;
    this._scrollFrame = requestAnimationFrame(() => {
      this._scrollFrame = 0;
      if (this._engine) this._renderBody(false);
    });
  }

  // ----------------------------------------------------------- sticky cols

  // Leading columns marked `sticky` (and the selection column before them)
  // stay put while the table scrolls sideways. Their `left` offsets come from
  // the measured widths, so they follow the content.
  _layoutSticky() {
    const columns = this._viewColumns;
    const stickyCount = columns.findIndex((column) => !column.sticky);
    const count = stickyCount === -1 ? columns.length : stickyCount;
    this.classList.toggle('table--sticky-columns', count > 0);
    const headRow = this.$head.firstElementChild;
    if (!headRow) return;
    const offset = (this._selection !== 'none' ? 1 : 0) + (this._hasExpand() ? 1 : 0);
    const stickyCells = count > 0 ? count + offset : 0;
    const lefts = [];
    let left = 0;
    for (let i = 0; i < stickyCells; i++) {
      lefts.push(left);
      left += headRow.children[i]?.getBoundingClientRect().width || 0;
    }
    // On phones, the 'scroll' layout pins the first column (and the selection
    // column) when nothing is pinned explicitly, so a row stays identifiable
    // while it scrolls sideways. Applied by the media query only.
    const mobileCells = count === 0 && this._mobileLayout === 'scroll' && columns.length > 1 ? 1 + offset : 0;
    const mobileLefts = [];
    let mobileLeft = 0;
    for (let i = 0; i < mobileCells; i++) {
      mobileLefts.push(mobileLeft);
      mobileLeft += headRow.children[i]?.getBoundingClientRect().width || 0;
    }
    const rows = [headRow, ...this.$body.children, ...this.$foot.children];
    for (const tr of rows) {
      if (tr.classList.contains('table_spacer') || tr.classList.contains('table_empty_row') || tr.classList.contains('table_detail_row')) continue;
      Array.from(tr.children).forEach((cell, i) => {
        const sticky = i < stickyCells;
        const mobile = i < mobileCells;
        cell.classList.toggle('table_cell--sticky', sticky);
        cell.classList.toggle('table_cell--sticky-edge', sticky && i === stickyCells - 1);
        cell.classList.toggle('table_cell--mobile-sticky', mobile);
        cell.classList.toggle('table_cell--mobile-sticky-edge', mobile && i === mobileCells - 1);
        if (sticky) cell.style.setProperty('--slice-table-sticky-left', `${lefts[i]}px`);
        else if (mobile) cell.style.setProperty('--slice-table-sticky-left', `${mobileLefts[i]}px`);
        else cell.style.removeProperty('--slice-table-sticky-left');
      });
    }
  }

  // ------------------------------------------------------- cards sort bar

  // In the 'cards' layout the header is hidden on phones, so sorting and
  // select-all move into a bar above the cards. Shown by the media query only.
  _renderCardsBar() {
    const sortable = this._viewColumns.filter((column) => column.sortable);
    const multiple = this._selection === 'multiple';
    const useful = this._mobileLayout === 'cards' && (sortable.length > 0 || multiple);
    this.$cardsBar.hidden = !useful;
    if (!useful) {
      this.$cardsBar.replaceChildren();
      return;
    }
    // Rebuilding would drop focus from the select while a keyboard user is in it.
    if (this.$cardsBar.childElementCount > 0 && this.$cardsBar.contains(document.activeElement)) {
      this._syncCardsBar();
      return;
    }
    const nodes = [];
    if (multiple) {
      const label = this._el('label', 'table_cards_select');
      label.append(
        this._el('input', 'table_select table_select_all', { type: 'checkbox' }),
        this._el('span', null, { text: this._text.selectAll })
      );
      nodes.push(label);
    }
    if (sortable.length > 0) {
      const sort = this._el('select', 'table_cards_sort', { 'aria-label': this._text.sortBy });
      sort.appendChild(this._el('option', null, { value: '', text: `${this._text.sortBy}: ${this._text.sortNone}` }));
      for (const column of sortable) {
        sort.appendChild(this._el('option', null, { value: String(column.key), text: `${this._text.sortBy}: ${column.label}` }));
      }
      const direction = this._el('button', 'table_cards_direction', { type: 'button' });
      nodes.push(sort, direction);
    }
    this.$cardsBar.replaceChildren(...nodes);
    this._syncCardsBar();
  }

  _syncCardsBar() {
    const sort = this._engine.sort;
    const select = this.$cardsBar.querySelector('.table_cards_sort');
    const direction = this.$cardsBar.querySelector('.table_cards_direction');
    if (select) select.value = sort ? String(sort.key) : '';
    if (direction) {
      const desc = sort?.direction === 'desc';
      direction.hidden = !sort;
      direction.textContent = desc ? '↓' : '↑';
      direction.setAttribute('aria-label', desc ? this._text.descending : this._text.ascending);
      direction.title = desc ? this._text.descending : this._text.ascending;
    }
    this._paintSelection(false);
  }

  _applySort(sort) {
    this._engine.setSort(sort ? { ...sort, ...this._sortOptionsFor(sort.key) } : null);
    if (this._onSortChange) this._onSortChange(this._publicSort(this._engine.sort));
    this._queueFetch();
    this._persist();
    this._resetScroll();
    this._afterStateChange();
  }

  _handleCardsBarChange(event) {
    if (event.target.classList.contains('table_select_all')) {
      this._handleHeadChange(event);
      return;
    }
    if (event.target.classList.contains('table_cards_sort')) {
      const key = event.target.value;
      const column = this._resolvedColumns.find((col) => String(col.key) === key);
      this._applySort(column ? { key: column.key, direction: 'asc' } : null);
    }
  }

  _handleCardsBarClick(event) {
    if (!event.target.closest('.table_cards_direction')) return;
    const sort = this._engine.sort;
    if (sort) this._applySort({ key: sort.key, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
  }

  // ---------------------------------------------------------------- export

  /** Columns that go into an export, optionally limited to `keys`. */
  _exportColumns(keys) {
    // Without `columns`, export what the user sees; with it, any column.
    const wanted = Array.isArray(keys) ? new Set(keys.map((key) => String(key))) : null;
    const source = wanted ? this._resolvedColumns : this._viewColumns;
    return source.filter((column) => column.exportable && (!wanted || wanted.has(String(column.key))));
  }

  /** The rows of an export scope, in the order the user sees them. */
  _exportRows(scope) {
    if (!this._engine) return [];
    switch (scope) {
      case 'all':
        return [...this._rows];
      case 'page':
        return [...this._engine.pageRows()];
      case 'selected': {
        const order = this._remote ? this._rows : this._engine.sortedRows();
        const picked = order.filter((row, index) => this._selectedKeys.has(this._keyOf(row, index)));
        // A selected row hidden by a filter is still selected; keep it.
        const seen = new Set(picked);
        for (const row of this.getSelectedRows()) if (!seen.has(row)) picked.push(row);
        return picked;
      }
      default:
        return [...this._engine.sortedRows()];
    }
  }

  // The DATA value of a cell (exportValue → filterValue → row[key]), never
  // what `render` draws: a rendered cell is often a node, a badge, a link.
  _exportValue(row, column) {
    const read = this._pathAccessor(column.exportValue) || this._valueAccessor(column);
    const value = read(row);
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
      if (!Number.isFinite(value.getTime())) return '';
      const midnight = value.getHours() === 0 && value.getMinutes() === 0 && value.getSeconds() === 0;
      const pad = (n) => String(n).padStart(2, '0');
      const day = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
      return midnight ? day : value.toISOString();
    }
    if (Array.isArray(value)) return value.map((item) => (item === null || item === undefined ? '' : String(item))).join(', ');
    if (value instanceof Node) return value.textContent || '';
    if (typeof value === 'object') {
      try { return JSON.stringify(value); } catch { return String(value); }
    }
    return value;
  }

  // One CSV/TSV cell. A string starting with = + - @ (or a tab / CR) gets an
  // apostrophe in front: a spreadsheet would otherwise run it as a FORMULA
  // ("CSV injection"). Real numbers are left alone.
  _delimited(value, delimiter) {
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+([.,]\d+)?$/.test(text)) text = `'${text}`;
    if (delimiter === '\t') return text.replace(/[\t\r\n]+/g, ' ');
    return /["\r\n]/.test(text) || text.includes(delimiter) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  /**
   * Serialize rows. Nothing is downloaded: this returns the text.
   * @param {ExportOptions} [options]
   * @returns {string}
   */
  exportData(options = {}) {
    const format = options.format === 'json' || options.format === 'tsv' ? options.format : 'csv';
    const columns = this._exportColumns(options.columns);
    const rows = this._exportRows(options.scope || 'filtered');
    if (format === 'json') {
      const out = rows.map((row) => {
        const item = {};
        for (const column of columns) {
          const read = this._pathAccessor(column.exportValue) || this._valueAccessor(column);
          const value = read(row);
          item[String(column.key)] = value instanceof Node ? value.textContent : value === undefined ? null : value;
        }
        return item;
      });
      return JSON.stringify(out, null, 2);
    }
    const delimiter = format === 'tsv' ? '\t' : (typeof options.delimiter === 'string' && options.delimiter ? options.delimiter : ',');
    const lines = [];
    if (options.headers !== false) {
      lines.push(columns.map((column) => this._delimited(column.label != null ? String(column.label) : String(column.key), delimiter)).join(delimiter));
    }
    for (const row of rows) {
      lines.push(columns.map((column) => this._delimited(this._exportValue(row, column), delimiter)).join(delimiter));
    }
    // CRLF: what RFC 4180 specifies and what Excel expects.
    return lines.join('\r\n');
  }

  /**
   * Save the rows as a file (CSV by default). The CSV starts with a UTF-8 BOM
   * so Excel opens accents correctly ("José", not "JosÃ©").
   * @param {ExportOptions} [options]  `format` is 'csv' (default) or 'json'
   */
  async downloadData(options = {}) {
    const format = options.format === 'json' ? 'json' : 'csv';
    const scope = options.scope || 'filtered';
    const content = this.exportData({ ...options, format });
    const name = (typeof options.filename === 'string' && options.filename.trim()) || this._exportFilename || 'table';
    const file = format === 'json'
      ? { name: `${name}.json`, body: content, type: 'application/json;charset=utf-8' }
      : { name: `${name}.csv`, body: `\uFEFF${content}`, type: 'text/csv;charset=utf-8' };
    // Literal slice.build so the CLI dependency analyser can see it. A singleton
    // service lives for the app, so it is not destroyed here.
    const files = await slice.build('FileDownloadService', { singleton: true });
    files.download(file.name, file.body, file.type);
    const count = this._exportRows(scope).length;
    this._flash(this._label('exported', { count }));
    if (this._onExport) this._onExport({ format, scope, count });
  }

  /**
   * Copy the rows as tab-separated text: pasted into Excel or Google Sheets it
   * lands in cells. Resolves to true when the clipboard accepted it.
   * @param {ExportOptions} [options]  `format` is ignored: always tab-separated
   */
  async copyToClipboard(options = {}) {
    const scope = options.scope || 'filtered';
    const text = this.exportData({ ...options, format: 'tsv' });
    const count = this._exportRows(scope).length;
    try {
      await navigator.clipboard.writeText(text);
      this._flash(this._label('copied', { count }));
      if (this._onExport) this._onExport({ format: 'clipboard', scope, count });
      return true;
    } catch {
      this._flash(this._text.copyFailed);
      return false;
    }
  }

  // ============================================================= menu engine
  //
  // ONE floating menu serves the Export button, the View button and every
  // row's ⋯ button. Menus are built from ITEMS, and consumers compose their
  // own from the same vocabulary (rowActions, exportMenu):
  //
  //   'separator' | 'details' | 'copy' | 'select' | 'csv' | 'json' | ...  built-in ids
  //   { label, icon?, onClick(ctx), danger?, disabled?, hidden?, checked?, shortcut? }
  //   { type: 'label', label }        a group heading
  //   { render: (ctx) => Node }       anything else, as-is
  //
  // `disabled`, `hidden` and `checked` may be booleans or functions of the
  // menu's subject (the row, for a row menu). Every ctx also carries
  // `close()`, so a custom item (a form inside the menu) can close it.

  /**
   * Turn consumer items into menu entries. `builtin(id)` resolves the string
   * ids for this menu; `ctx` is what custom onClick/render receive.
   */
  _menuEntries(items, builtin, ctx, subject) {
    const entries = [];
    const flag = (value) => (typeof value === 'function' ? value(subject) === true : value === true);
    // Bound to THIS menu: a stale close() (kept by a custom item after the
    // menu was replaced) does nothing.
    const state = this._menuState;
    if (ctx && typeof ctx === 'object' && !('close' in ctx)) {
      ctx.close = (focusAnchor = true) => {
        if (state && this._menuState === state) this._closeMenu(focusAnchor !== false);
      };
    }
    for (const item of Array.isArray(items) ? items : []) {
      if (item === null || item === undefined || item === false) continue;
      if (item === 'separator' || item?.type === 'separator') {
        entries.push({ type: 'separator' });
        continue;
      }
      if (typeof item === 'string') {
        const resolved = builtin(item);
        if (Array.isArray(resolved)) entries.push(...resolved);
        else if (resolved) entries.push(resolved);
        continue;
      }
      if (typeof item !== 'object') continue;
      if (flag(item.hidden)) continue;
      if (item.type === 'label') {
        entries.push({ type: 'label', label: String(item.label ?? '') });
        continue;
      }
      if (typeof item.render === 'function') {
        entries.push({ type: 'custom', render: () => item.render(ctx) });
        continue;
      }
      const checkable = item.checked !== undefined;
      entries.push({
        type: checkable ? 'checkbox' : 'action',
        label: String(item.label ?? ''),
        icon: item.icon ?? null,
        shortcut: item.shortcut ?? null,
        danger: item.danger === true,
        disabled: flag(item.disabled),
        checked: checkable ? flag(item.checked) : undefined,
        keepOpen: item.keepOpen === true,
        run: () => { if (typeof item.onClick === 'function') item.onClick(ctx); }
      });
    }
    // Tidy separators: none leading, trailing or doubled.
    return entries.filter((entry, i, all) => entry.type !== 'separator' ||
      (i > 0 && i < all.length - 1 && all[i - 1].type !== 'separator'));
  }

  _openMenu(anchor, build) {
    this._closeMenu(false);
    this._closeExternalMenu(false);
    this._menuState = { anchor, build, entries: [] };
    this._renderMenu();
    this.$menu.hidden = false;
    this._positionMenu();
    anchor.setAttribute('aria-expanded', 'true');
    // Outside presses close it; removed on close and in beforeDestroy (§9).
    document.addEventListener('pointerdown', this._handleOutsidePointer, true);
    this._menuButtons().find((button) => button.getAttribute('aria-disabled') !== 'true')?.focus();
  }

  _renderMenu(focusIndex = null) {
    const state = this._menuState;
    if (!state) return;
    slice.controller.destroyByContainer(this.$menu);
    state.entries = state.build();
    const nodes = state.entries.map((entry, index) => {
      if (entry.type === 'separator') return this._el('div', 'table_menu_separator', { role: 'separator' });
      if (entry.type === 'label') return this._el('div', 'table_menu_label', { role: 'presentation', text: entry.label });
      if (entry.type === 'custom') {
        const box = this._el('div', 'table_menu_custom', { role: 'presentation' });
        const content = entry.render();
        if (content instanceof Node) box.appendChild(content);
        else if (content !== null && content !== undefined) box.textContent = String(content);
        return box;
      }
      const role = entry.type === 'checkbox' ? 'menuitemcheckbox' : entry.type === 'radio' ? 'menuitemradio' : 'menuitem';
      const button = this._el('button', 'table_menu_item' + (entry.danger ? ' table_menu_item--danger' : ''), { type: 'button', role, tabindex: '-1' });
      button.dataset.index = String(index);
      if (entry.checked !== undefined) button.setAttribute('aria-checked', entry.checked ? 'true' : 'false');
      if (entry.disabled) button.setAttribute('aria-disabled', 'true');
      if (entry.icon instanceof Node) button.appendChild(entry.icon);
      else if (entry.icon) button.appendChild(this._el('span', 'table_menu_icon', { 'aria-hidden': 'true', text: String(entry.icon) }));
      button.appendChild(this._el('span', 'table_menu_text', { text: entry.label }));
      if (entry.shortcut) button.appendChild(this._el('span', 'table_menu_shortcut', { text: String(entry.shortcut) }));
      return button;
    });
    this.$menu.replaceChildren(...nodes);
    if (focusIndex !== null) this.$menu.querySelector(`[data-index="${focusIndex}"]`)?.focus();
  }

  // Below the anchor, right edges aligned; above it when there is no room below.
  _positionMenu() {
    const state = this._menuState;
    if (!state) return;
    const host = this.$component.getBoundingClientRect();
    const anchor = state.anchor.getBoundingClientRect();
    const menu = this.$menu.getBoundingClientRect();
    let top = anchor.bottom - host.top + 4;
    if (anchor.bottom + menu.height + 8 > window.innerHeight && anchor.top - menu.height - 8 > 0) {
      top = anchor.top - host.top - menu.height - 4;
    }
    let left = anchor.right - host.left - menu.width;
    if (host.left + left < 4) left = 4 - host.left;
    this.$menu.style.top = `${Math.round(top)}px`;
    this.$menu.style.left = `${Math.round(left)}px`;
  }

  _closeMenu(focusAnchor) {
    const state = this._menuState;
    if (!state) return;
    this._menuState = null;
    this.$menu.hidden = true;
    slice.controller.destroyByContainer(this.$menu);
    this.$menu.replaceChildren();
    state.anchor.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', this._handleOutsidePointer, true);
    if (focusAnchor && state.anchor.isConnected) state.anchor.focus();
  }

  _menuButtons() {
    return [...this.$menu.querySelectorAll('.table_menu_item')];
  }

  _handleOutsidePointer(event) {
    const state = this._menuState;
    if (state && !this.$menu.contains(event.target) && !state.anchor.contains(event.target)) this._closeMenu(false);
  }

  _handleMenuKeydown(event) {
    // Inside custom content (an input, a slider) the keys belong to it; only
    // Escape still closes the menu. Tab moves through it (focusout closes).
    if (event.target.closest?.('.table_menu_custom')) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this._closeMenu(true);
      }
      return;
    }
    const items = this._menuButtons().filter((button) => button.getAttribute('aria-disabled') !== 'true');
    const index = items.indexOf(/** @type {any} */ (document.activeElement));
    if (event.key === 'Escape') {
      event.preventDefault();
      this._closeMenu(true);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      (event.key === 'Home' ? items[0] : items[items.length - 1])?.focus();
    } else if (event.key === 'Tab' && !this.$menu.querySelector('.table_menu_custom')) {
      this._closeMenu(false);
    }
  }

  // Focus leaving the menu (Tab out of custom content, a click elsewhere that
  // takes focus) closes it; moving between its own parts does not.
  _handleMenuFocusOut(event) {
    const state = this._menuState;
    const next = event.relatedTarget;
    if (!state || !next) return;
    if (this.$menu.contains(next) || state.anchor.contains(next)) return;
    this._closeMenu(false);
  }

  _handleMenuClick(event) {
    const button = event.target.closest('.table_menu_item');
    const state = this._menuState;
    if (!button || !state || button.getAttribute('aria-disabled') === 'true') return;
    const index = Number(button.dataset.index);
    const entry = state.entries[index];
    if (!entry) return;
    if (entry.keepOpen) {
      // Toggles (a column, the density) keep the menu open and redraw it.
      entry.run();
      this._renderMenu(index);
      return;
    }
    this._closeMenu(true);
    entry.run();
  }

  // Compatibility: the exportable setter closes "the export menu".
  _closeExportMenu(focusToggle) {
    if (this._menuState && this._menuState.anchor === this.$exportToggle) this._closeMenu(focusToggle);
  }

  // ------------------------------------------------------------ export menu

  _toggleExportMenu() {
    if (this._menuState?.anchor === this.$exportToggle) {
      this._closeMenu(true);
      return;
    }
    this._openMenu(this.$exportToggle, () => this._exportEntries());
  }

  _exportEntries() {
    const selected = this._selectedKeys.size;
    if (selected === 0 && this._exportScope === 'selected') this._exportScope = 'filtered';
    const scope = /** @type {ExportScope} */ (this._exportScope);
    const ctx = {
      table: this,
      scope,
      get rows() { return this.table._exportRows(scope); }
    };
    const builtin = (id) => {
      switch (id) {
        case 'scope':
          if (selected === 0) return null;
          return [
            { type: 'radio', label: this._label('exportScopeFiltered', { count: this._exportRows('filtered').length }), checked: scope === 'filtered', keepOpen: true, run: () => { this._exportScope = 'filtered'; } },
            { type: 'radio', label: this._label('exportScopeSelected', { count: selected }), checked: scope === 'selected', keepOpen: true, run: () => { this._exportScope = 'selected'; } },
            { type: 'separator' }
          ];
        case 'csv': return { type: 'action', label: this._text.exportCsv, run: () => this.downloadData({ format: 'csv', scope }) };
        case 'json': return { type: 'action', label: this._text.exportJson, run: () => this.downloadData({ format: 'json', scope }) };
        case 'copy': return { type: 'action', label: this._text.exportCopy, run: () => this.copyToClipboard({ scope }) };
        default: return null;
      }
    };
    return this._menuEntries(this._exportMenu || ['scope', 'csv', 'json', 'copy'], builtin, ctx, null);
  }

  // -------------------------------------------------------------- view menu

  _toggleViewMenu() {
    if (this._menuState?.anchor === this.$viewToggle) {
      this._closeMenu(true);
      return;
    }
    this._openMenu(this.$viewToggle, () => this._viewEntries());
  }

  _viewEntries() {
    const entries = [];
    if (this._densityToggle) {
      entries.push({ type: 'label', label: this._text.density });
      for (const [value, key] of [['compact', 'densityCompact'], ['comfortable', 'densityComfortable'], ['spacious', 'densitySpacious']]) {
        entries.push({
          type: 'radio',
          label: this._text[key],
          checked: this._density === value,
          keepOpen: true,
          run: () => {
            this.density = value;
            this._persist();
          }
        });
      }
    }
    if (this._columnToggle) {
      if (entries.length > 0) entries.push({ type: 'separator' });
      entries.push({ type: 'label', label: this._text.columns });
      const visible = this._viewColumns.length;
      for (const column of this._resolvedColumns) {
        const key = String(column.key);
        const shown = !this._hidden.has(key);
        entries.push({
          type: 'checkbox',
          label: column.label != null ? String(column.label) : key,
          checked: shown,
          // The last visible column cannot go: a table with no columns is not a table.
          disabled: !column.hideable || (shown && visible <= 1),
          keepOpen: true,
          run: () => this.setColumnVisible(column.key, !shown)
        });
      }
    }
    return entries;
  }

  /** Show or hide a column, as the user would (fires onColumnsChange). */
  setColumnVisible(key, visible) {
    const id = String(key);
    const column = this._resolvedColumns.find((col) => String(col.key) === id);
    if (!column || (!visible && !column.hideable)) return;
    if (!visible && !this._hidden.has(id) && this._viewColumns.length <= 1) return;
    if (visible) this._hidden.delete(id);
    else this._hidden.add(id);
    this._refreshView();
    this._persist();
    if (this._onColumnsChange) this._onColumnsChange([...this._hidden]);
  }

  _computeView() {
    const visible = this._resolvedColumns.filter((column) => !this._hidden.has(String(column.key)));
    this._viewColumns = visible.length > 0 ? visible : this._resolvedColumns.slice(0, 1);
    // Rows cached for the previous set of columns are stale.
    this._contentVersion += 1;
  }

  // Visibility changed: cells are rebuilt (their columns changed), search
  // re-targets the visible columns, and every derived piece redraws.
  _refreshView() {
    this._computeView();
    this._numericColumns = null;
    if (this._engine) this._applyFilters(false);
  }

  // ---------------------------------------------------------------- row menu

  _rowEntries(row, key) {
    const spec = this._rowActions;
    let items;
    if (typeof spec === 'function') items = spec(row);
    else if (Array.isArray(spec)) items = spec;
    else items = ['details', 'copy', 'select'];
    const ctx = { row, key, table: this };
    const builtin = (id) => {
      switch (id) {
        case 'details':
          return { type: 'action', label: this._text.details, run: () => this._openDetail(row, key, true) };
        case 'copy':
          return { type: 'action', label: this._text.copyRow, run: () => this._copyRow(row) };
        case 'select': {
          if (this._selection === 'none') return null;
          const on = this._selectedKeys.has(key);
          return {
            type: 'action',
            label: on ? this._text.deselectRow : this._text.selectRowAction,
            run: () => {
              if (this._selection === 'single') this._selectedKeys = new Set(on ? [] : [key]);
              else if (on) this._selectedKeys.delete(key);
              else this._selectedKeys.add(key);
              this._emitSelection();
            }
          };
        }
        default:
          return null;
      }
    };
    return this._menuEntries(items, builtin, ctx, row);
  }

  _openRowMenu(button) {
    const tr = button.closest('tr');
    const key = tr?.dataset.rowKey;
    const row = key !== undefined ? this._renderedRows.get(key) : undefined;
    if (row === undefined) return;
    if (this._menuState?.anchor === button) {
      this._closeMenu(true);
      return;
    }
    if (this._onRowMenu) {
      this._openExternalMenu(button, row, key);
      return;
    }
    this._openMenu(button, () => this._rowEntries(row, key));
  }

  // onRowMenu: the consumer draws the menu; the table keeps the button's
  // state (aria-expanded), the toggle, and closing it when something else
  // takes over.
  _openExternalMenu(button, row, key) {
    if (this._externalMenu?.anchor === button) {
      this._closeExternalMenu(true);
      return;
    }
    this._closeMenu(false);
    this._closeExternalMenu(false);
    const state = { anchor: button, cleanup: null };
    this._externalMenu = state;
    button.setAttribute('aria-expanded', 'true');
    const close = (focusAnchor = true) => {
      if (this._externalMenu === state) this._closeExternalMenu(focusAnchor !== false);
    };
    let result;
    try {
      result = this._onRowMenu({ row, key, anchor: button, table: this, close });
    } catch (error) {
      close(false);
      throw error;
    }
    if (typeof result === 'function') state.cleanup = result;
  }

  _dropStaleMenus() {
    if (this._menuState && !this._menuState.anchor.isConnected) this._closeMenu(false);
    if (this._externalMenu && !this._externalMenu.anchor.isConnected) this._closeExternalMenu(false);
  }

  _closeExternalMenu(focusAnchor) {
    const state = this._externalMenu;
    if (!state) return;
    this._externalMenu = null;
    state.anchor.setAttribute('aria-expanded', 'false');
    if (state.cleanup) {
      try {
        state.cleanup();
      } catch (error) {
        console.error('Table: onRowMenu cleanup failed', error);
      }
    }
    if (focusAnchor && state.anchor.isConnected) state.anchor.focus();
  }

  async _copyRow(row) {
    const columns = this._viewColumns.filter((column) => column.exportable);
    const header = columns.map((column) => this._delimited(column.label != null ? String(column.label) : String(column.key), '\t')).join('\t');
    const line = columns.map((column) => this._delimited(this._exportValue(row, column), '\t')).join('\t');
    try {
      await navigator.clipboard.writeText(`${header}\r\n${line}`);
      this._flash(this._label('copied', { count: 1 }));
    } catch {
      this._flash(this._text.copyFailed);
    }
  }

  // ------------------------------------------------------------- row detail

  _hasExpand() {
    return this._rowDetail === 'expand' && !this._virtual;
  }

  _hasActions() {
    return !!this._onRowMenu || (this._rowActions !== null && this._rowActions !== undefined && this._rowActions !== false);
  }

  _syncClickable() {
    const clickable = !!this._onRowClick || (this._rowDetail && this._rowDetail !== 'none');
    this.classList.toggle('table--clickable', clickable);
    return clickable;
  }

  _detailTitleFor(row) {
    if (typeof this._detailTitle === 'function') {
      const title = this._detailTitle(row);
      if (title !== null && title !== undefined) return String(title);
    }
    const first = this._resolvedColumns[0];
    if (!first) return this._text.details;
    const value = this._valueAccessor(first)(row);
    return value === null || value === undefined || typeof value === 'object' ? this._text.details : String(value);
  }

  // What a detail shows: `renderDetail(row)` when given (a Node, a string,
  // `{ html }` or a Promise of one of those); otherwise every column — hidden
  // ones included — as a label / value list.
  async _detailContent(row) {
    const box = this._el('div', 'table_detail');
    if (typeof this._renderDetail === 'function') {
      const value = await this._renderDetail(row);
      this.renderCell(box, value);
      return box;
    }
    const list = this._el('dl', 'table_detail_list');
    for (const column of this._resolvedColumns) {
      const dt = this._el('dt', null, { text: column.label != null ? String(column.label) : String(column.key) });
      const dd = document.createElement('dd');
      const value = column.render ? column.render(row) : this._cellValue(row, column);
      if (value === null || value === undefined || value === '') dd.textContent = this._text.detailEmpty;
      else this.renderCell(dd, value);
      list.append(dt, dd);
    }
    box.appendChild(list);
    return box;
  }

  /** Open the detail of a row, as a click would (modal, or expanded in place). */
  openDetail(rowOrKey) {
    const key = typeof rowOrKey === 'object' && rowOrKey !== null ? this._keyOf(rowOrKey, 0) : String(rowOrKey);
    const row = typeof rowOrKey === 'object' && rowOrKey !== null
      ? rowOrKey
      : this._rows.find((candidate, index) => this._keyOf(candidate, index) === key);
    if (row !== undefined) this._openDetail(row, key, false);
  }

  _openDetail(row, key, fromMenu) {
    if (this._hasExpand() && !fromMenu) {
      this._toggleExpanded(key);
      return;
    }
    if (this._hasExpand() && fromMenu) {
      if (!this._expanded.has(key)) this._toggleExpanded(key);
      return;
    }
    this._openDetailModal(row, key);
  }

  async _openDetailModal(row, key) {
    const token = ++this._detailToken;
    this._detailReturnKey = key;
    if (!this._modal) {
      // Built once per table and reused; destroyed in beforeDestroy (a
      // component built after init() is not in the destroy cascade).
      this._modal = await slice.build('Modal', {
        title: '',
        maxWidth: '640px',
        onClose: () => this._handleDetailClosed()
      });
      this.$component.appendChild(this._modal);
    }
    if (token !== this._detailToken || !this._engine) return;
    const body = this._modal.querySelector('.slice-modal__body');
    if (body) {
      slice.controller.destroyByContainer(body);
      body.replaceChildren(this._el('div', 'table_detail_loading', { text: '…' }));
    }
    this._modal.title = this._detailTitleFor(row);
    this._modal.open = true;
    const content = await this._detailContent(row);
    if (token !== this._detailToken || !body) return;
    body.replaceChildren(content);
  }

  _handleDetailClosed() {
    this._detailToken += 1;
    const body = this._modal?.querySelector('.slice-modal__body');
    if (body) {
      slice.controller.destroyByContainer(body);
      body.replaceChildren();
    }
    // Back to the row the detail came from.
    const key = this._detailReturnKey;
    if (key !== undefined) {
      const tr = this.$body.querySelector(`tr[data-row-key="${CSS.escape(key)}"]`);
      if (tr instanceof HTMLElement && tr.tabIndex >= 0) tr.focus();
    }
  }

  _toggleExpanded(key) {
    if (this._expanded.has(key)) this._expanded.delete(key);
    else this._expanded.add(key);
    this._renderBody(true);
  }

  _detailRowFor(key, row) {
    const cached = this._detailRows.get(key);
    if (cached && cached.row === row && cached.version === this._contentVersion) return cached.tr;
    const tr = this._el('tr', 'table_detail_row');
    tr.dataset.detailFor = key;
    const td = this._el('td', 'table_detail_cell', { id: `${this._uid}-detail-${this._detailSeq++}` });
    td.colSpan = this._visibleColumnsCount();
    td.appendChild(this._el('div', 'table_detail_loading', { text: '…' }));
    tr.appendChild(td);
    this._detailContent(row).then((content) => {
      if (tr.isConnected || this._detailRows.get(key)?.tr === tr) td.replaceChildren(content);
    });
    this._detailRows.set(key, { tr, row, version: this._contentVersion });
    return tr;
  }

  // ----------------------------------------------------------------- totals

  _aggregate(column, rows) {
    const read = this._valueAccessor(column);
    const values = rows.map((row) => read(row));
    if (typeof column.aggregate === 'function') return column.aggregate(values, rows);
    if (column.aggregate === 'count') {
      return values.filter((value) => value !== null && value !== undefined && value !== '').length;
    }
    const numbers = values
      .map((value) => (typeof value === 'number' ? value : value === null || value === undefined || value === '' || typeof value === 'boolean' ? NaN : Number(value)))
      .filter((value) => Number.isFinite(value));
    if (numbers.length === 0) return null;
    switch (column.aggregate) {
      case 'sum': return numbers.reduce((total, value) => total + value, 0);
      case 'avg': return numbers.reduce((total, value) => total + value, 0) / numbers.length;
      case 'min': return numbers.reduce((low, value) => (value < low ? value : low), numbers[0]);
      case 'max': return numbers.reduce((high, value) => (value > high ? value : high), numbers[0]);
      default: return null;
    }
  }

  _formatAggregate(value) {
    if (value === null || value === undefined) return this._text.detailEmpty;
    if (typeof value === 'number') {
      try {
        return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
      } catch {
        return String(Math.round(value * 100) / 100);
      }
    }
    return value;
  }

  // A totals row over every row that passes the filters (not just the page).
  _renderFoot() {
    const columns = this._viewColumns;
    const any = columns.some((column) => column.aggregate);
    this._releaseChildren(this.$foot, []);
    this.$foot.replaceChildren();
    this.$foot.hidden = !any;
    if (!any) return;
    const rows = this._remote ? this._rows : this._engine.sortedRows();
    const tr = this._el('tr', 'table_total_row');
    if (this._selection !== 'none') tr.appendChild(this._el('td', 'table_select_cell'));
    if (this._hasExpand()) tr.appendChild(this._el('td', 'table_expand_cell'));
    columns.forEach((column, columnIndex) => {
      const td = document.createElement('td');
      td.dataset.columnIndex = String(columnIndex);
      // The "Total" label always opens the row, in the first column, ahead of
      // that column's own total if it has one.
      if (columnIndex === 0) {
        td.classList.add('table_total_first');
        td.appendChild(this._el('span', 'table_total_label', { text: this._text.totals }));
      } else if (column.label != null) {
        td.dataset.label = String(column.label);
      }
      if (column.aggregate) {
        const raw = this._aggregate(column, rows);
        const shown = column.aggregateFormat ? column.aggregateFormat(raw, rows) : this._formatAggregate(raw);
        const value = this._el('span', 'table_total_value');
        this.renderCell(value, shown);
        td.appendChild(value);
        // Aligned like the column's body cells.
        const align = this._alignClass(column.align) ||
          (this._numericColumns?.[columnIndex] || (typeof raw === 'number' && columnIndex > 0) ? 'table_cell--num' : '');
        if (align) td.classList.add(align);
      }
      tr.appendChild(td);
    });
    if (this._hasActions()) tr.appendChild(this._el('td', 'table_actions_cell'));
    this.$foot.appendChild(tr);
  }

  // ------------------------------------------------------------ persistence

  _storageKey() {
    return this._stateKey ? `slice-table:${this._stateKey}` : null;
  }

  // Saved state wins over the initial props: the point is to come back to the
  // table as it was left. Unknown columns and bad values are ignored.
  _restoreState() {
    const key = this._storageKey();
    if (!key) return null;
    let data;
    try {
      data = JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
    if (!data || data.v !== 1) return null;
    const known = new Map(this._resolvedColumns.map((column) => [String(column.key), column]));
    if (typeof data.search === 'string') {
      this._query = data.search;
      this.$searchInput.value = data.search;
    }
    if (Array.isArray(data.filters)) {
      this._filterState = new Map();
      for (const filter of data.filters) {
        if (!filter || filter.key === undefined || filter.key === null) continue;
        this._filterState.set(String(filter.key), { type: filter.type, op: filter.op, value: filter.value });
      }
    }
    if (Array.isArray(data.hidden)) {
      this._hidden = new Set(data.hidden.map((k) => String(k)).filter((k) => known.get(k)?.hideable));
      this._hiddenGiven = true;
    }
    if (typeof data.density === 'string') this.density = data.density;
    if (data.sort && data.sort.key !== undefined && known.has(String(data.sort.key))) {
      const column = known.get(String(data.sort.key));
      this._engine.setSort({ key: column.key, direction: data.sort.direction, ...this._sortOptions(column) });
    }
    return data;
  }

  _persist() {
    if (!this._storageKey() || !this._mounted || this._booting) return;
    clearTimeout(this._persistTimer);
    this._persistTimer = window.setTimeout(() => this._saveState(), 150);
  }

  _saveState() {
    clearTimeout(this._persistTimer);
    this._persistTimer = 0;
    const key = this._storageKey();
    if (!key || !this._engine) return;
    try {
      localStorage.setItem(key, JSON.stringify({
        v: 1,
        search: this._query,
        filters: this._engine.filters,
        sort: this._publicSort(this._engine.sort),
        hidden: [...this._hidden],
        density: this._density
      }));
    } catch {
      // Storage full, blocked or unavailable: the table works without it.
    }
  }

  /** Forget the saved view state (search, filters, sort, columns, density). */
  clearSavedState() {
    clearTimeout(this._persistTimer);
    this._persistTimer = 0;
    const key = this._storageKey();
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to forget.
    }
  }


  // ------------------------------------------------------- data & CRUD

  /** Load the rows again (from `load`, or the store), or redraw them. */
  reload() {
    if (this._load) return this._fetch();
    if (this._context) this._readContext();
    else this.renderTable();
    return Promise.resolve();
  }

  /** The row with this key (a `rowKey` value), or null. */
  getRow(key) {
    const id = this._idOf(key);
    return this._rows.find((row, index) => this._keyOf(row, index) === id) ?? null;
  }

  /**
   * Add a row. It shows at once; with `commit`, a failure takes it out again
   * and says so. A returned object (with the server's id) replaces it.
   * @param {any} row
   * @param {{ position?: 'start' | 'end' | number, commit?: (row: any) => any, highlight?: boolean }} [options]
   */
  async addRow(row, { position = 'start', commit, highlight = true } = {}) {
    const key = this._idOf(row);
    this._writeRows((rows) => insertItem(rows, row, position));
    if (highlight) this._highlightRow(key);
    if (!commit) return true;
    this._setRowBusy(key, true);
    try {
      const saved = await commit(row);
      this._setRowBusy(key, false);
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        this._writeRows((rows) => rows.map((it) => (this._idOf(it) === key ? { ...it, ...saved } : it)));
      }
      return true;
    } catch (error) {
      this._setRowBusy(key, false);
      this._writeRows((rows) => removeItems(rows, this._rowKeyFn(), [key]).list);
      this._failed(error, 'add', row);
      return false;
    }
  }

  /**
   * Change a row: `changes` are merged into it (or a function from the row to
   * them). With `commit`, a failure puts it back as it was.
   * @param {any} key  a rowKey value, or the row itself
   * @param {object | ((row: any) => object)} changes
   * @param {{ commit?: (after: any, before: any) => any }} [options]
   */
  async updateRow(key, changes, { commit } = {}) {
    const id = this._idOf(key);
    let result = null;
    this._writeRows((rows) => {
      result = patchItem(rows, this._rowKeyFn(), id, changes);
      return result ? result.list : rows;
    });
    if (!result) return false;
    if (!commit) return true;
    const { before, after } = result;
    this._setRowBusy(id, true);
    try {
      const saved = await commit(after, before);
      this._setRowBusy(id, false);
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        this._writeRows((rows) => rows.map((it) => (this._idOf(it) === id ? { ...it, ...saved } : it)));
      }
      return true;
    } catch (error) {
      this._setRowBusy(id, false);
      this._writeRows((rows) => revertItem(rows, this._rowKeyFn(), before));
      this._failed(error, 'update', before);
      return false;
    }
  }

  /**
   * Remove rows. They leave at once. With `undo`, a bar offers to bring them
   * back for a few seconds, and `commit` runs when that time is over; without
   * it, `commit` runs right away. A failed commit brings them back.
   * @param {any | any[]} keys
   * @param {{ commit?: (rows: any[]) => any, undo?: boolean }} [options]
   */
  async removeRow(keys, { commit, undo = false } = {}) {
    const ids = (Array.isArray(keys) ? keys : [keys]).map((key) => this._idOf(key));
    // A previous removal still waiting for its undo time: settle it first.
    await this._flushNotice();
    let removed = [];
    this._writeRows((rows) => {
      const result = removeItems(rows, this._rowKeyFn(), ids);
      removed = result.removed;
      return result.list;
    });
    if (!removed.length) return false;
    let deselected = false;
    for (const id of ids) deselected = this._selectedKeys.delete(id) || deselected;
    if (deselected) this._emitSelection();
    const gone = removed.map((entry) => entry.item);

    const persist = async () => {
      if (!commit) return true;
      try {
        await commit(gone);
        return true;
      } catch (error) {
        this._writeRows((rows) => restoreItems(rows, removed));
        this._failed(error, 'remove', gone);
        return false;
      }
    };
    if (!undo) return persist();

    return new Promise((resolve) => {
      this._showNotice({
        text: gone.length === 1 ? this._text.removedOne : this._label('removed', { count: gone.length }),
        actionLabel: this._text.undo,
        action: () => {
          this._writeRows((rows) => restoreItems(rows, removed));
          this._hideNotice(false);
          resolve(false);
        },
        timeout: UNDO_MS,
        // When the time is over (or the bar is closed): make it final.
        onExpire: async () => resolve(await persist())
      });
    });
  }

  // `key` may be a rowKey value or a row object.
  _idOf(key) {
    return key !== null && typeof key === 'object' ? this._keyOf(key, 0) : String(key);
  }

  _rowKeyFn() {
    return (row) => this._keyOf(row, 0);
  }

  _contextRows() {
    if (!slice.context?.has?.(this._context)) return null;
    const state = slice.context.getState(this._context);
    const value = readPath(state, Array.isArray(state) ? '' : this._contextPath);
    return Array.isArray(value) ? value : [];
  }

  _readContext() {
    const rows = this._contextRows();
    if (rows) this._setRows(rows);
  }

  _watchContext() {
    if (!slice.context?.watch || !slice.context.has?.(this._context)) {
      slice.logger?.warn?.('Table', `The context "${this._context}" does not exist. Create it with slice.context.create().`);
      return;
    }
    this._contextWatch = slice.context.watch(this._context, this, () => {
      if (this._mounted) this._readContext();
    }, (state) => readPath(state, Array.isArray(state) ? '' : this._contextPath));
  }

  // New rows from inside the table (CRUD, the store, the server). Unlike the
  // `rows` setter, rows whose objects did not change keep their <tr>.
  _setRows(rows) {
    this._rows = rows;
    this._panelStale = true;
    if (!this._engine) return;
    this._engine.setData(rows).setPageSize(this._effectivePageSize());
    this._afterStateChange();
  }

  // Apply a change to wherever the rows live: the store (everyone sees it),
  // or the table's own rows (`rows`, or the page `load` returned).
  _writeRows(change) {
    if (this._context && slice.context?.setState && slice.context.has?.(this._context)) {
      slice.context.setState(this._context, (prev) => {
        const path = Array.isArray(prev) ? '' : this._contextPath;
        const current = readPath(prev, path);
        return writePath(prev, path, change(Array.isArray(current) ? current : []));
      });
      if (!this._contextWatch) this._readContext();
      return;
    }
    this._setRows(change(this._rows.slice()));
  }

  _queueFetch() {
    if (!this._load || this._booting || !this._mounted || this._fetchQueued) return;
    // One request for a burst of changes (a sort and a page reset together).
    this._fetchQueued = true;
    queueMicrotask(() => {
      this._fetchQueued = false;
      this._fetch();
    });
  }

  async _fetch() {
    if (!this._load || !this._engine || !this._mounted) return;
    this._abort?.abort();
    const abort = new AbortController();
    this._abort = abort;
    this.loading = true;
    try {
      const result = await this._load({
        page: this._engine.page,
        pageSize: this._engine.pageSize,
        search: this._query,
        filters: this._engine.filters,
        sort: this._publicSort(this._engine.sort),
        signal: abort.signal
      });
      if (abort.signal.aborted || !this._mounted) return;
      const rows = Array.isArray(result) ? result : (result?.items ?? result?.rows ?? []);
      const total = !Array.isArray(result) && Number.isFinite(result?.total) ? result.total : null;
      this._fetchError = null;
      this._totalItems = total;
      this._engine.setTotalItems(total);
      this._setRows(Array.isArray(rows) ? rows : []);
    } catch (error) {
      if (abort.signal.aborted || !this._mounted) return;
      this._fetchError = error;
      this._setRows([]);
      this._onError?.(error, { type: 'load' });
    } finally {
      if (this._abort === abort) {
        this._abort = null;
        if (this._mounted) this.loading = false;
      }
    }
  }

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
      dismissLabel: this._text.dismiss,
      timeout,
      actions: action ? [{ label: actionLabel || '', onClick: action }] : [],
      onDismiss: ({ reason }) => {
        const expire = this._noticeExpire;
        this._noticeExpire = null;
        if (reason !== 'action' && expire) return expire();
        return undefined;
      }
    });
  }

  _hideNotice(expire) {
    return this._alert?.hide(expire ? 'close' : 'action');
  }

  _flushNotice() {
    if (this._noticeExpire) return Promise.resolve(this._hideNotice(true));
    return Promise.resolve();
  }

  _failed(error, type, row) {
    slice.logger?.warn?.('Table', `Could not ${type}`, error);
    this._onError?.(error, { type, row });
    const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
    this._showNotice({ text: `${this._text.saveError}${detail}`, tone: 'error', timeout: 6000 });
  }

  _setRowBusy(key, on) {
    if (on) this._busyRows.add(key);
    else this._busyRows.delete(key);
    this._paintRowStates();
  }

  _highlightRow(key) {
    this._freshRows.add(key);
    this._paintRowStates();
    const tr = this._trOf(key);
    tr?.scrollIntoView?.({ block: 'nearest' });
    const timer = window.setTimeout(() => {
      this._timers.delete(timer);
      this._freshRows.delete(key);
      if (this._mounted) this._paintRowStates();
    }, 1600);
    this._timers.add(timer);
  }

  _trOf(key) {
    return /** @type {HTMLTableRowElement | null} */ (this.$body.querySelector(`tr[data-row-key="${CSS.escape(String(key))}"]`));
  }

  // Busy and new rows, busy and failed cells: classes that survive a re-render.
  _paintRowStates() {
    for (const tr of this.$body.children) {
      const key = /** @type {HTMLElement} */ (tr).dataset.rowKey;
      if (key === undefined) continue;
      const busy = this._busyRows.has(key);
      tr.classList.toggle('table_row--saving', busy);
      if (busy) tr.setAttribute('aria-busy', 'true');
      else tr.removeAttribute('aria-busy');
      tr.classList.toggle('table_row--new', this._freshRows.has(key));
      if (!this._gridMode) continue;
      for (const td of tr.querySelectorAll('td[data-cell]')) {
        const id = this._cellId(key, this._columnOfCell(td)?.key);
        td.classList.toggle('table_cell--saving', this._busyCells.has(id));
        const message = this._cellErrors.get(id);
        td.classList.toggle('table_cell--error', !!message);
        if (message) {
          td.title = message;
          td.setAttribute('aria-invalid', 'true');
        } else if (td.hasAttribute('aria-invalid')) {
          td.removeAttribute('title');
          td.removeAttribute('aria-invalid');
        }
      }
    }
  }

  // ------------------------------------------------------- cell editing

  _syncGridMode() {
    this._gridMode = this._resolvedColumns.some((column) => column.edit);
    this.classList.toggle('table--editable', this._gridMode);
    // An editable table is a grid: the cells are what the keyboard moves through.
    if (this._gridMode) this.$table.setAttribute('role', 'grid');
    else this.$table.removeAttribute('role');
  }

  // The control a column edits with: what `edit` says, else guessed from
  // its data (yes/no → a checkbox, numbers → a number field). Remembered per
  // set of rows: it is asked for every cell.
  _cellKind(column) {
    if (!column.edit) return '';
    if (!this._kindMemo || this._kindMemo.rows !== this._rows) this._kindMemo = { rows: this._rows, kinds: new Map() };
    const memo = this._kindMemo.kinds;
    const id = String(column.key);
    if (!memo.has(id)) {
      const sample = this._rows.map((row) => this._cellValue(row, column)).find((value) => value !== null && value !== undefined);
      const type = typeof sample === 'boolean' ? 'boolean' : typeof sample === 'number' ? 'number' : '';
      memo.set(id, editKind(column.edit, type));
    }
    return memo.get(id);
  }

  // What a cell shows: `render` first; an editable yes/no is a checkbox; a
  // value from a list of options shows that option's label.
  _displayCell(row, column) {
    if (column.render) return column.render(row);
    const value = this._cellValue(row, column);
    if (!column.edit) return value;
    const kind = this._cellKind(column);
    if (kind === 'switch') {
      const box = this._el('input', 'table_cell_check', { type: 'checkbox', tabindex: '-1', 'aria-label': String(column.label ?? '') });
      box.checked = value === true;
      return box;
    }
    if (Array.isArray(column.edit.options)) {
      const label = optionLabel(column.edit.options, value);
      if (label !== undefined) return label;
    }
    return value;
  }

  _cellId(rowKey, columnKey) {
    return `${rowKey}|${columnKey}`;
  }

  _columnOfCell(td) {
    return this._viewColumns[Number(td?.dataset?.columnIndex)];
  }

  _cellsOfRow(tr) {
    return /** @type {HTMLElement[]} */ ([...tr.querySelectorAll('td[data-cell]')]);
  }

  _gridRows() {
    return /** @type {HTMLTableRowElement[]} */ ([...this.$body.children].filter((tr) => /** @type {HTMLElement} */ (tr).dataset.rowKey !== undefined));
  }

  _cellAt(rowKey, columnKey) {
    const tr = this._trOf(rowKey);
    if (!tr) return null;
    return this._cellsOfRow(tr).find((td) => String(this._columnOfCell(td)?.key) === String(columnKey)) || null;
  }

  /** Focus a cell (by row key and column key) and make it the active one. */
  focusCell(rowKey, columnKey) {
    const td = this._cellAt(this._idOf(rowKey), columnKey);
    if (!td) return false;
    this._setActiveCell(td, true);
    return true;
  }

  /** The active cell: { rowKey, columnKey }, or null. */
  get activeCell() { return this._activeCell ? { ...this._activeCell } : null; }

  _setActiveCell(td, focus) {
    for (const cell of this.$body.querySelectorAll('td[data-cell][tabindex="0"]')) {
      if (cell !== td) /** @type {HTMLElement} */ (cell).tabIndex = -1;
    }
    td.tabIndex = 0;
    const tr = td.closest('tr');
    this._activeCell = { rowKey: tr.dataset.rowKey, columnKey: String(this._columnOfCell(td)?.key) };
    if (focus) {
      td.focus({ preventScroll: true });
      td.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }

  // Exactly one cell is the grid's tab stop, after every render.
  _syncActiveCell(refocus) {
    const rows = this._gridRows();
    if (!rows.length) return;
    let td = this._activeCell ? this._cellAt(this._activeCell.rowKey, this._activeCell.columnKey) : null;
    if (!td) td = this._cellsOfRow(rows[0])[0] || null;
    if (!td) return;
    this._setActiveCell(td, refocus);
  }

  // The cell to go to from `td`: 'up' | 'down' | 'left' | 'right' | 'next' |
  // 'prev' | 'home' | 'end' | 'first' | 'last'. Null at an edge.
  _cellFrom(td, direction) {
    const tr = td.closest('tr');
    const rows = this._gridRows();
    const r = rows.indexOf(tr);
    const cells = this._cellsOfRow(tr);
    const c = cells.indexOf(td);
    const columnKey = String(this._columnOfCell(td)?.key);
    const inRow = (row, key) => this._cellsOfRow(row).find((cell) => String(this._columnOfCell(cell)?.key) === key) || null;
    switch (direction) {
      case 'up': return r > 0 ? inRow(rows[r - 1], columnKey) : null;
      case 'down': return r < rows.length - 1 ? inRow(rows[r + 1], columnKey) : null;
      case 'left': return cells[c - 1] || null;
      case 'right': return cells[c + 1] || null;
      case 'home': return cells[0] || null;
      case 'end': return cells[cells.length - 1] || null;
      case 'first': return this._cellsOfRow(rows[0])[0] || null;
      case 'last': {
        const lastCells = this._cellsOfRow(rows[rows.length - 1]);
        return lastCells[lastCells.length - 1] || null;
      }
      case 'next': return cells[c + 1] || (rows[r + 1] ? this._cellsOfRow(rows[r + 1])[0] : null) || null;
      case 'prev': {
        if (cells[c - 1]) return cells[c - 1];
        const above = rows[r - 1] ? this._cellsOfRow(rows[r - 1]) : [];
        return above[above.length - 1] || null;
      }
      default: return null;
    }
  }

  _printable(event) {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  }

  // Returns true when it handled the key.
  _handleGridKeydown(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const editor = this._cellEditor;
    if (editor && editor.box.contains(target)) {
      if (event.key === 'Escape') {
        // Inside a Modal, Escape closes the editor, not the dialog.
        event.preventDefault();
        event.stopPropagation();
        this.cancelCellEdit();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        this.saveCellEdit({ move: event.shiftKey ? 'prev' : 'next' });
      } else if (event.key === 'Enter' && event.altKey && editor.kind === 'textarea') {
        event.preventDefault();
        const area = /** @type {HTMLTextAreaElement} */ (target);
        area.setRangeText?.('\n', area.selectionStart, area.selectionEnd, 'end');
        area.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !['select', 'date'].includes(editor.kind)) {
        event.preventDefault();
        this.saveCellEdit({ move: 'down' });
      }
      return true;
    }
    // Keys pressed while the editor is still being built are kept for it.
    if (editor && !editor.control) {
      if (this._printable(event)) {
        editor.typed += event.key;
        event.preventDefault();
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        editor.then = event.key === 'Tab' ? (event.shiftKey ? 'prev' : 'next') : 'down';
        event.preventDefault();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelCellEdit();
      }
      return true;
    }

    const td = /** @type {HTMLElement | null} */ (target.closest('td[data-cell]'));
    if (!td || (target !== td && !target.classList.contains('table_cell_check'))) return false;
    const column = this._columnOfCell(td);
    const kind = column?.edit ? this._cellKind(column) : '';
    const go = (direction) => {
      const next = this._cellFrom(td, direction);
      if (next) this._setActiveCell(next, true);
      return next;
    };
    const key = event.key;
    const ctrl = event.ctrlKey || event.metaKey;

    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      go({ ArrowDown: 'down', ArrowUp: 'up', ArrowLeft: 'left', ArrowRight: 'right' }[key]);
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      go(key === 'Home' ? (ctrl ? 'first' : 'home') : (ctrl ? 'last' : 'end'));
    } else if (key === 'Tab' && !event.altKey && !ctrl) {
      // At the first or last cell, Tab leaves the table as usual.
      if (go(event.shiftKey ? 'prev' : 'next')) event.preventDefault();
    } else if ((key === ' ' || key === 'Enter') && kind === 'switch') {
      event.preventDefault();
      const box = /** @type {HTMLInputElement | null} */ (td.querySelector('.table_cell_check'));
      if (box) {
        box.checked = !box.checked;
        this._saveCell(td, box.checked, { pending: false });
      }
    } else if ((key === 'Enter' || key === 'F2') && kind) {
      event.preventDefault();
      this._openCellEditor(td);
    } else if (key === 'Enter') {
      // A cell that does not edit opens its row, as a row click does.
      if (this._activateRow(/** @type {HTMLTableRowElement} */ (td.closest('tr')), event)) event.preventDefault();
    } else if (ctrl && key.toLowerCase() === 'c' && !String(window.getSelection?.() || '')) {
      event.preventDefault();
      this._copyCell(td);
    } else if ((key === 'Delete' || key === 'Backspace') && kind && kind !== 'switch' && !column.edit.required) {
      event.preventDefault();
      this._saveCell(td, null);
    } else if (this._printable(event) && TEXT_KINDS.includes(kind)) {
      // Typing on a cell replaces its value, like a spreadsheet.
      event.preventDefault();
      this._openCellEditor(td, { initial: event.key });
    } else {
      return false;
    }
    return true;
  }

  _handleBodyDoubleClick(event) {
    if (!this._gridMode) return;
    const td = /** @type {HTMLElement | null} */ (event.target.closest('td.table_cell--editable'));
    if (!td || event.target.closest(INTERACTIVE) || td.classList.contains('table_cell--editing')) return;
    if (td.dataset.edit === 'switch') return;
    this._openCellEditor(td);
  }

  // A text edit is saved when focus leaves its cell, as in a spreadsheet.
  _handleBodyFocusOut(event) {
    const editor = this._cellEditor;
    if (!editor || !TEXT_KINDS.includes(editor.kind) || !editor.box.contains(event.target)) return;
    const timer = window.setTimeout(() => {
      this._timers.delete(timer);
      if (this._cellEditor !== editor || !editor.control) return;
      if (editor.box.contains(document.activeElement)) return;
      this.saveCellEdit({ blur: true });
    }, 0);
    this._timers.add(timer);
  }

  /**
   * Open the editor of a cell. `initial` starts it with that text instead of
   * the value (as typing on a cell does).
   * @param {any} rowKey
   * @param {string | number} columnKey
   * @param {{ initial?: any }} [options]
   */
  editCell(rowKey, columnKey, { initial } = {}) {
    const td = this._cellAt(this._idOf(rowKey), columnKey);
    if (!td || !td.classList.contains('table_cell--editable')) return Promise.resolve(false);
    return this._openCellEditor(td, { initial });
  }

  /** @param {HTMLElement} td @param {{ initial?: any }} [options] */
  async _openCellEditor(td, { initial } = {}) {
    const column = this._columnOfCell(td);
    const tr = /** @type {HTMLTableRowElement} */ (td.closest('tr'));
    const rowKey = tr.dataset.rowKey;
    const row = this._renderedRows.get(rowKey);
    if (!column?.edit || row === undefined) return false;
    const kind = this._cellKind(column);
    if (kind === 'switch') return false;
    this._closeCellEditor(false);
    this._setActiveCell(td, false);
    const id = this._cellId(rowKey, column.key);
    this._cellErrors.delete(id);

    const box = this._el('div', 'table_cell_editor');
    td.classList.add('table_cell--editing');
    td.classList.remove('table_cell--error');
    this._releaseChildren(td, []);
    td.replaceChildren(box);
    const editor = { rowKey, columnKey: String(column.key), column, kind, td, box, control: null, typed: '', then: '' };
    this._cellEditor = editor;

    const value = initial !== undefined ? initial : this._cellValue(row, column);
    const { name, props } = controlFor({
      kind, value, edit: column.edit, label: String(column.label ?? ''), compact: true,
      onPick: () => this.saveCellEdit({ move: '' })
    });
    const control = /** @type {any} */ (await slice.build(/** @type {any} */ (name), props));
    if (!control) return false;
    if (!this._mounted || this._cellEditor !== editor) {
      slice.controller.destroyComponent(control);
      return false;
    }
    editor.control = control;
    box.appendChild(control);
    if (kind === 'select') control.querySelector('input')?.setAttribute('aria-label', String(column.label ?? ''));
    if (editor.typed && kind !== 'select' && 'value' in control) control.value = `${control.value ?? ''}${editor.typed}`;
    const field = /** @type {HTMLInputElement | null} */ (box.querySelector('input:not([type="hidden"]), textarea'));
    field?.focus();
    if (field && ['text', 'search', 'url', 'tel', 'email', 'password', 'textarea'].includes(field.type || 'textarea')) {
      try { field.setSelectionRange(field.value.length, field.value.length); } catch { /* not a text field */ }
    }
    if (editor.then) this.saveCellEdit({ move: editor.then });
    return true;
  }

  /** Close the open cell editor without saving. */
  cancelCellEdit() {
    const editor = this._cellEditor;
    if (!editor) return;
    this._closeCellEditor(true);
    const td = this._cellAt(editor.rowKey, editor.columnKey);
    if (td) this._setActiveCell(td, true);
  }

  /**
   * Save what is in the open cell editor; `move` then goes 'down', 'next' or
   * 'prev'. Resolves to whether it was saved.
   */
  async saveCellEdit({ move = '', blur = false } = {}) {
    const editor = this._cellEditor;
    if (!editor || !editor.control) return false;
    const row = this._renderedRows.get(editor.rowKey);
    const value = readControl(editor.control, editor.kind, editor.column.edit);
    const message = validateValue(editor.control, value, editor.column.edit, row);
    if (message === null) return false;
    if (message) {
      this._showNotice({ text: message, tone: 'error', timeout: 4000 });
      return false;
    }
    const target = move ? this._cellFrom(editor.td, move) : null;
    const targetAt = target ? { rowKey: target.closest('tr').dataset.rowKey, columnKey: String(this._columnOfCell(target)?.key) } : null;
    this._closeCellEditor(true);
    const td = this._cellAt(editor.rowKey, editor.columnKey);
    if (!td) return false;
    const saving = this._saveCell(td, value);
    if (!blur) {
      const next = targetAt ? this._cellAt(targetAt.rowKey, targetAt.columnKey) : td;
      if (next) this._setActiveCell(next, true);
    }
    return saving;
  }

  // redraw: put the row's real content back (cancel), not the editor's.
  _closeCellEditor(redraw) {
    const editor = this._cellEditor;
    if (!editor) return;
    this._cellEditor = null;
    if (editor.control) slice.controller.destroyComponent(editor.control);
    editor.td.classList.remove('table_cell--editing');
    if (redraw && this._mounted) {
      // The row kept its <tr> while editing: draw it again from its data.
      this._rowCache.delete(editor.rowKey);
      this._renderBody(true);
    }
  }

  /**
   * Save one cell. The cell shows the value at once (busy); `commit` runs; the
   * row changes when it succeeds. A failure draws the old value back, red.
   * @param {HTMLElement} td
   * @param {any} value
   * @param {{ pending?: boolean }} [options]
   */
  async _saveCell(td, value, { pending = true } = {}) {
    const column = this._columnOfCell(td);
    const rowKey = td.closest('tr')?.dataset.rowKey;
    const before = this.getRow(rowKey);
    if (!column || rowKey === undefined || !before) return false;
    const key = String(column.key);
    const previous = this._cellValue(before, column);
    if (Object.is(previous, value)) return true;
    const id = this._cellId(rowKey, key);
    this._cellErrors.delete(id);
    const next = writePath(before, key, value);

    if (pending) {
      // Show what was typed while the save runs.
      this._releaseChildren(td, []);
      td.replaceChildren();
      this.renderCell(td, this._displayCell(next, column));
    }
    let saved = next;
    if (this._commit) {
      this._busyCells.add(id);
      this._paintRowStates();
      try {
        const result = await this._commit({
          row: next, before, key, value, previous,
          column: { key: column.key, label: column.label }
        });
        if (result === false) throw new Error('');
        // The server's version wins; otherwise apply the change to the row as
        // it is NOW, so a save that finished meanwhile is not undone.
        saved = result && typeof result === 'object' && !Array.isArray(result)
          ? result
          : writePath(this.getRow(rowKey) || before, key, value);
      } catch (error) {
        this._busyCells.delete(id);
        if (!this._mounted) return false;
        const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
        this._cellErrors.set(id, `${this._text.saveError}${detail}`);
        this._onError?.(error, { type: 'edit', row: before, key });
        this._showNotice({ text: `${this._text.saveError}${detail}`, tone: 'error', timeout: 6000 });
        // Draw the row again from its (unchanged) data: the old value, in red.
        this._rowCache.delete(rowKey);
        this._renderBody(true);
        return false;
      }
      this._busyCells.delete(id);
      if (!this._mounted) return false;
    }
    this._writeRows((rows) => rows.map((row, index) => (this._keyOf(row, index) === rowKey ? saved : row)));
    this._onCellChange?.({ row: saved, key, value, previous });
    return true;
  }

  async _copyCell(td) {
    const column = this._columnOfCell(td);
    const row = this._renderedRows.get(td.closest('tr')?.dataset.rowKey);
    if (!column || row === undefined) return;
    const value = this._cellValue(row, column);
    const text = value === null || value === undefined ? '' : (typeof value === 'object' ? td.textContent.trim() : String(value));
    try {
      await navigator.clipboard.writeText(text);
      this._flash(this._text.copiedCell);
    } catch {
      this._flash(this._text.copyFailed);
    }
  }

  // ------------------------------------------------------------- selection

  // The rows "select all" acts on: every filtered row locally, the page in remote.
  _selectableRows() {
    return this._remote ? this._engine.pageRows() : this._engine.sortedRows();
  }

  _paintSelection(chrome = true) {
    if (this._selection === 'none') return;
    for (const tr of this.$body.children) {
      const key = tr.dataset.rowKey;
      if (key === undefined) continue;
      const on = this._selectedKeys.has(key);
      tr.classList.toggle('table_row--selected', on);
      const box = tr.querySelector('.table_select_row');
      if (box) box.checked = on;
    }
    // The header one, and the cards bar one on phones.
    const boxes = this.querySelectorAll('.table_select_all');
    if (boxes.length > 0) {
      const rows = this._selectableRows();
      let count = 0;
      rows.forEach((row) => {
        if (this._selectedKeys.has(this._keyOf(row, 0))) count += 1;
      });
      boxes.forEach((all) => {
        all.checked = rows.length > 0 && count === rows.length;
        all.indeterminate = count > 0 && count < rows.length;
      });
    }
    if (chrome) this._renderChrome();
  }

  _emitSelection() {
    this._paintSelection();
    if (!this._onSelectionChange) return;
    const keys = [...this._selectedKeys];
    const known = new Map();
    this._rows.forEach((row, index) => known.set(this._keyOf(row, index), row));
    this._onSelectionChange(keys, keys.map((key) => known.get(key)).filter((row) => row !== undefined));
  }

  _handleHeadChange(event) {
    if (!event.target.classList.contains('table_select_all')) return;
    const rows = this._selectableRows();
    if (event.target.checked) rows.forEach((row) => this._selectedKeys.add(this._keyOf(row, 0)));
    else rows.forEach((row) => this._selectedKeys.delete(this._keyOf(row, 0)));
    this._emitSelection();
  }

  _handleBodyChange(event) {
    const box = event.target;
    if (box.classList?.contains('table_cell_check')) {
      // A yes/no cell saves the moment it is flipped.
      const td = box.closest('td[data-cell]');
      if (td) this._saveCell(td, box.checked, { pending: false });
      return;
    }
    if (!box.classList || !box.classList.contains('table_select_row')) return;
    const tr = box.closest('tr');
    const key = tr?.dataset.rowKey;
    if (key === undefined) return;

    if (this._selection === 'single') {
      this._selectedKeys = new Set(box.checked ? [key] : []);
    } else if (this._shiftRange && this._selectionAnchor !== null) {
      // Shift+click: everything between the last clicked row and this one, in
      // the order the user sees, takes this row's new state.
      const order = this._selectableRows().map((row) => this._keyOf(row, 0));
      const a = order.indexOf(this._selectionAnchor);
      const b = order.indexOf(key);
      if (a !== -1 && b !== -1) {
        const [from, to] = a < b ? [a, b] : [b, a];
        for (let i = from; i <= to; i++) {
          if (box.checked) this._selectedKeys.add(order[i]);
          else this._selectedKeys.delete(order[i]);
        }
      } else if (box.checked) this._selectedKeys.add(key);
      else this._selectedKeys.delete(key);
    } else if (box.checked) {
      this._selectedKeys.add(key);
    } else {
      this._selectedKeys.delete(key);
    }
    this._selectionAnchor = key;
    this._shiftRange = false;
    this._emitSelection();
  }

  _handleBodyClick(event) {
    // Remember Shift for the `change` that follows a click on a checkbox.
    if (event.target.classList?.contains('table_select_row')) {
      this._shiftRange = event.shiftKey === true;
      return;
    }
    const menuButton = event.target.closest('.table_row_menu_toggle');
    if (menuButton) {
      this._openRowMenu(menuButton);
      return;
    }
    const expandButton = event.target.closest('.table_expand_toggle');
    if (expandButton) {
      const key = expandButton.closest('tr')?.dataset.rowKey;
      if (key !== undefined) this._toggleExpanded(key);
      return;
    }
    if (this._gridMode) {
      const td = event.target.closest('td[data-cell]');
      if (td && !td.classList.contains('table_cell--editing')) {
        this._setActiveCell(td, !event.target.closest(INTERACTIVE));
        // A click on an editable cell picks it; a double click edits it.
        if (td.classList.contains('table_cell--editable')) return;
      }
    }
    if (event.target.closest(INTERACTIVE)) return;
    const tr = event.target.closest('tr');
    this._activateRow(tr, event);
  }

  _handleBodyKeydown(event) {
    if (this._gridMode && this._handleGridKeydown(event)) return;
    if (event.key !== 'Enter') return;
    const tr = event.target;
    if (!(tr instanceof HTMLTableRowElement)) return;
    if (this._activateRow(tr, event)) event.preventDefault();
  }

  // A click (or Enter) on a row: onRowClick, then the detail if there is one.
  _activateRow(tr, event) {
    const key = tr?.dataset.rowKey;
    const row = key !== undefined ? this._renderedRows.get(key) : undefined;
    if (row === undefined) return false;
    let handled = false;
    if (this._onRowClick) {
      this._onRowClick(row, event);
      handled = true;
    }
    if (this._rowDetail === 'modal' || this._rowDetail === 'expand') {
      this._openDetail(row, key, false);
      handled = true;
    }
    return handled;
  }

  // Alignment travels as a class, not an inline style: an inline `text-align` can
  // only be beaten with `!important`.
  _alignClass(align) {
    return align === 'left' || align === 'center' || align === 'right' ? `table_cell--${align}` : '';
  }

  // A column of figures reads badly left-aligned with proportional digits, and
  // reflows whenever a value changes width.
  _isNumeric(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  // A re-render replaces rows, so whatever the previous render left in them has
  // to go. A `render(row)` callback typically builds a component per call, and
  // without this every sort, page change or `rows` update orphaned one in
  // `activeComponents` forever — the documented `innerHTML = ''` case in
  // slice.js/AGENTS.md.
  //
  // `incoming` holds the nodes THIS render shows (cells, or whole kept rows);
  // they are kept. Re-passing the same node on every render is legitimate (see
  // markdown/table.md), and destroying a node we are about to append again would
  // leave the table displaying a dead component.
  _releaseChildren(container, incoming) {
    if (!container) return;
    const controller = slice.controller;

    const keep = new Set();
    for (const node of incoming) {
      if (!(node instanceof Node)) continue;
      if (node.sliceId) keep.add(node.sliceId);
      if (typeof node.querySelectorAll !== 'function') continue;
      node.querySelectorAll('[slice-id]').forEach((el) => {
        keep.add(el.getAttribute('slice-id') || el.sliceId);
      });
    }

    // Collect first, destroy once: destroying a parent cascades to its children,
    // and asking for an id twice logs "not found".
    const evicted = [];
    container.querySelectorAll('[slice-id]').forEach((el) => {
      const sliceId = el.getAttribute('slice-id') || el.sliceId;
      if (sliceId && !keep.has(sliceId) && controller.activeComponents.has(sliceId)) {
        evicted.push(sliceId);
      }
    });
    if (evicted.length > 0) controller.destroyComponent(evicted);
  }

  // Cells are rendered safely by default. A cell can be:
  //  - a DOM Node            -> appended as-is (recommended for rich content)
  //  - { html: '<...>' }     -> explicit opt-in for TRUSTED raw HTML
  //  - anything else         -> coerced to text via textContent (escaped, no XSS)
  renderCell(td, cell) {
    if (cell instanceof Node) {
      td.appendChild(cell);
    } else if (cell && typeof cell === 'object' && typeof cell.html === 'string') {
      td.innerHTML = cell.html;
    } else {
      td.textContent = cell === null || cell === undefined ? '' : String(cell);
    }
  }
}

customElements.define('slice-table', Table);
