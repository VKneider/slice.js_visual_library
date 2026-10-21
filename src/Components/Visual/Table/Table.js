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

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [contenteditable="true"]';

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
    rowHeight: { type: 'number', default: 44 },

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
    this.$panel = this.querySelector('.table_filter_panel');
    this.$chips = this.querySelector('.table_chips');
    this.$wrapper = this.querySelector('.table_wrapper');
    this.$head = this.querySelector('.table_head');
    this.$body = this.querySelector('.table_body');
    this.$footer = this.querySelector('.table_footer');
    this.$table = this.querySelector('.table');
    this.$loading = this.querySelector('.table_loading');

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
    this.classList.toggle('table--clickable', !!this._onRowClick);
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

  set rowHeight(value) {
    this._rowHeight = Number.isFinite(value) && value > 0 ? value : 44;
    this.style.setProperty('--slice-table-row-height', `${this._rowHeight}px`);
    if (this._engine && this._virtual) this.renderTable();
  }
  get rowHeight() { return this._rowHeight; }

  async init() {
    this._resolvedColumns = this._resolveColumns();

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
    this._applyLayout();
    this._applyFilters(false, false);
    await this._applyPagination(); // builds the pager if paginating + renders
  }

  beforeDestroy() {
    this.$head.removeEventListener('click', this._handleHeaderClick);
    this.$head.removeEventListener('keydown', this._handleHeaderKeydown);
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._scrollFrame) cancelAnimationFrame(this._scrollFrame);
    clearTimeout(this._searchTimer);
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
        sticky: col.sticky === true
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
      sticky: false
    }));
  }

  _refreshColumns() {
    this._resolvedColumns = this._resolveColumns();
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
    const column = this._resolvedColumns[Number(cell.dataset.sortIndex)];
    this._engine.toggleSort(cell.dataset.sortKey, this._sortOptions(column));
    if (this._onSortChange) this._onSortChange(this._publicSort(this._engine.sort));
    this._resetScroll();
    this._afterStateChange();
  }

  _goToPage(page) {
    if (!this._engine) return;
    this._engine.setPage(page);
    if (this._onPageChange) this._onPageChange(this._engine.page);
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
    const searchAccessors = this._resolvedColumns
      .filter((column) => column.searchable)
      .map((column) => this._pathAccessor(column.searchValue) || this._valueAccessor(column));

    this._engine.setFilters(filters);
    this._engine.setSearch(this._query, searchAccessors);
    this._resetScroll();

    if (emit && this._onFilterChange) {
      this._onFilterChange({ search: this._query, filters: this._engine.filters });
    }
    if (render) this._afterStateChange();
  }

  _handleSearchInput() {
    clearTimeout(this._searchTimer);
    // Debounced: a 10,000-row filter per keystroke is wasted work while typing.
    this._searchTimer = setTimeout(() => {
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
        timer = setTimeout(commit, config.type === 'text' ? 200 : 120);
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
    const showToolbar = this._searchable || hasFilterUi;

    this.$toolbar.hidden = !showToolbar;
    this.$search.hidden = !this._searchable;
    this.$searchInput.placeholder = this._searchPlaceholder || this._text.searchPlaceholder;
    this.$searchInput.setAttribute('aria-label', this._text.searchLabel);
    this.$filtersToggle.hidden = !hasFilterUi;
    this.$filtersToggleLabel.textContent = this._text.filters;
    this.$filtersCount.hidden = filters.length === 0;
    this.$filtersCount.textContent = String(filters.length);
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
    this.$status.textContent = parts.join(' · ');
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
    this._renderChrome();
  }

  _visibleColumnsCount() {
    return this._resolvedColumns.length + (this._selection !== 'none' ? 1 : 0);
  }

  _renderHead() {
    const columns = this._resolvedColumns;
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
      const height = this._rowHeight || 44;
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
    const columns = this._resolvedColumns;
    const { rows, offset, total } = this._bodySource();

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
      if (cached && cached.row === row && cached.version === this._contentVersion) {
        return { key, row, index, cached };
      }
      const cells = columns.map((column) => (column.render ? column.render(row) : this._cellValue(row, column)));
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
      }
      this._applyAlignment(target, columns, numeric);
    }

    // Virtual: spacers stand in for the rows above and below the window, so the
    // scrollbar reflects the whole set.
    if (this._virtual && plan.length > 0) {
      const height = this._rowHeight || 44;
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
    this._layoutSticky();
  }

  _emptyRow() {
    const tr = document.createElement('tr');
    tr.className = 'table_empty_row';
    const td = document.createElement('td');
    td.className = 'table_empty';
    td.colSpan = this._visibleColumnsCount();
    if (this._engine.isFiltered && !this._remote) {
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

  _buildRow(row, cells, columns) {
    const tr = document.createElement('tr');
    if (this._onRowClick) tr.setAttribute('tabindex', '0');
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
    columns.forEach((column, columnIndex) => {
      const td = document.createElement('td');
      this.renderCell(td, cells[columnIndex]);
      if (column.label != null) td.dataset.label = String(column.label);
      td.dataset.columnIndex = String(columnIndex);
      tr.appendChild(td);
    });
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
    const columns = this._resolvedColumns;
    const stickyCount = columns.findIndex((column) => !column.sticky);
    const count = stickyCount === -1 ? columns.length : stickyCount;
    this.classList.toggle('table--sticky-columns', count > 0);
    const headRow = this.$head.firstElementChild;
    if (!headRow) return;
    const offset = this._selection !== 'none' ? 1 : 0;
    const stickyCells = count > 0 ? count + offset : 0;
    const lefts = [];
    let left = 0;
    for (let i = 0; i < stickyCells; i++) {
      lefts.push(left);
      left += headRow.children[i]?.getBoundingClientRect().width || 0;
    }
    const rows = [headRow, ...this.$body.children];
    for (const tr of rows) {
      if (tr.classList.contains('table_spacer') || tr.classList.contains('table_empty_row')) continue;
      Array.from(tr.children).forEach((cell, i) => {
        const sticky = i < stickyCells;
        cell.classList.toggle('table_cell--sticky', sticky);
        cell.classList.toggle('table_cell--sticky-edge', sticky && i === stickyCells - 1);
        if (sticky) cell.style.setProperty('--slice-table-sticky-left', `${lefts[i]}px`);
        else cell.style.removeProperty('--slice-table-sticky-left');
      });
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
    const all = this.$head.querySelector('.table_select_all');
    if (all) {
      const rows = this._selectableRows();
      let count = 0;
      rows.forEach((row) => {
        if (this._selectedKeys.has(this._keyOf(row, 0))) count += 1;
      });
      all.checked = rows.length > 0 && count === rows.length;
      all.indeterminate = count > 0 && count < rows.length;
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
    if (!this._onRowClick) return;
    if (event.target.closest(INTERACTIVE)) return;
    const tr = event.target.closest('tr');
    const row = tr ? this._renderedRows.get(tr.dataset.rowKey) : undefined;
    if (row !== undefined) this._onRowClick(row, event);
  }

  _handleBodyKeydown(event) {
    if (!this._onRowClick || event.key !== 'Enter') return;
    const tr = event.target;
    if (!(tr instanceof HTMLTableRowElement)) return;
    const row = this._renderedRows.get(tr.dataset.rowKey);
    if (row !== undefined) {
      event.preventDefault();
      this._onRowClick(row, event);
    }
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