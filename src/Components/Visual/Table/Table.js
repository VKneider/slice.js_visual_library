export default class Table extends HTMLElement {
  static props = {
    // Legacy positional API (still supported): string headers + array-of-arrays rows.
    headers: { type: 'array', default: [], required: false },
    rows: { type: 'array', default: [], required: false },
    // Richer API: columns = [{ key, label, sortable, align, render }]. Rows may be
    // objects keyed by `key`. Takes precedence over `headers` when provided.
    columns: { type: 'array', default: null, required: false },
    sortable: { type: 'boolean', default: false },
    defaultSort: { type: 'object', default: null },
    // pagination: true | { pageSize }.
    pagination: { type: 'object', default: null },
    // 'local' (default): the table holds all rows and sorts/paginates them.
    // 'remote': `rows` is just the current page; the table tracks page/sort and
    // emits onSortChange/onPageChange so you fetch the next slice. Provide
    // `totalItems` so the pager can compute the page count.
    dataSource: { type: 'string', default: 'local' },
    totalItems: { type: 'number', default: null },
    emptyMessage: { type: 'string', default: 'No data' },
    // Self-contained busy overlay (no dependency on the Loading component). Drive
    // it yourself in remote mode: set true before fetching, false after.
    loading: { type: 'boolean', default: false },
    // Notifications. In 'remote' these are how you drive fetching; in 'local'
    // they are optional hooks (the table still sorts/pages locally).
    onSortChange: { type: 'function', default: null },
    onPageChange: { type: 'function', default: null }
  };

  static _seq = 0;

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$head = this.querySelector('.table_head');
    this.$body = this.querySelector('.table_body');
    this.$footer = this.querySelector('.table_footer');
    this.$table = this.querySelector('.table');
    this.$loading = this.querySelector('.table_loading');

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
    this._onSortChange = null;
    this._onPageChange = null;

    this._engine = null;
    this._pager = null;
    this._buildingPager = false;

    this._handleHeaderClick = this._handleHeaderClick.bind(this);
    this._handleHeaderKeydown = this._handleHeaderKeydown.bind(this);

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
    this._defaultSort = value && value.key ? value : null;
    if (this._engine && this._defaultSort) {
      this._engine.setSort(this._defaultSort);
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

  async init() {
    this._resolvedColumns = this._resolveColumns();

    // The engine owns the view state (data, page, sort). Built per-instance and
    // explicitly destroyed in beforeDestroy() (a Service has no DOM, so it is
    // not auto-cleaned by the parent's destroy cascade).
    this._engine = await slice.build('DataGridEngine', {
      sliceId: `slice-table-grid-${++Table._seq}`,
      data: this._rows,
      pageSize: this._effectivePageSize(),
      sort: this._defaultSort,
      manual: this._remote,
      totalItems: this._totalItems
    });

    this.$head.addEventListener('click', this._handleHeaderClick);
    this.$head.addEventListener('keydown', this._handleHeaderKeydown);
    await this._applyPagination(); // builds the pager if paginating + renders
  }

  beforeDestroy() {
    this.$head.removeEventListener('click', this._handleHeaderClick);
    this.$head.removeEventListener('keydown', this._handleHeaderKeydown);
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

  // --- internals ---
  _effectivePageSize() {
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
        align: col.align || 'left',
        render: typeof col.render === 'function' ? col.render : null
      }));
    }
    // Legacy: derive positional columns from string headers.
    return (this._headers || []).map((header, index) => ({
      key: index,
      label: header,
      sortable: this._sortable,
      align: 'left',
      render: null
    }));
  }

  _refreshColumns() {
    this._resolvedColumns = this._resolveColumns();
    this.renderTable();
  }

  _cellValue(row, column) {
    if (Array.isArray(row)) return row[column.key];
    if (row && typeof row === 'object') return row[column.key];
    return row;
  }

  _handleHeaderClick(event) {
    const cell = event.target.closest('[data-sort-key]');
    if (cell) this._sortByCell(cell);
  }

  _handleHeaderKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const cell = event.target.closest('[data-sort-key]');
    if (!cell) return;
    event.preventDefault();
    this._sortByCell(cell);
  }

  _sortByCell(cell) {
    if (!this._engine) return;
    this._engine.toggleSort(cell.dataset.sortKey);
    if (this._onSortChange) this._onSortChange(this._engine.sort);
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
    if (this._pager) this._pager.style.display = this._paginate ? '' : 'none';
    this._afterStateChange();
  }

  renderTable() {
    if (!this.$head || !this.$body || !this._engine) return;

    this.$head.innerHTML = '';
    this.$body.innerHTML = '';

    const columns = this._resolvedColumns;
    const sort = this._engine.sort;

    // Header
    if (columns.length > 0) {
      const headRow = document.createElement('tr');
      columns.forEach((column) => {
        const th = document.createElement('th');
        th.setAttribute('scope', 'col');
        if (column.align) th.style.textAlign = column.align;
        th.textContent = column.label != null ? String(column.label) : '';

        if (column.sortable) {
          th.classList.add('table_head_cell--sortable');
          th.dataset.sortKey = String(column.key);
          th.setAttribute('tabindex', '0'); // focusable; keyboard handled via keydown delegation
          const active = sort && String(sort.key) === String(column.key);
          const indicator = document.createElement('span');
          indicator.className = 'table_sort_indicator';
          indicator.setAttribute('aria-hidden', 'true');
          indicator.textContent = active ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ' ⇅';
          th.appendChild(indicator);
          th.setAttribute('aria-sort', active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none');
        }
        headRow.appendChild(th);
      });
      this.$head.appendChild(headRow);
    }

    // Body (sorted + paginated by the engine)
    const pageRows = this._engine.pageRows();

    if (pageRows.length === 0) {
      // Only show an empty-state row when the table has a column structure;
      // a fully-empty table (no columns) renders nothing (legacy behaviour).
      if (columns.length > 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.className = 'table_empty';
        td.colSpan = columns.length;
        td.textContent = this._emptyMessage;
        tr.appendChild(td);
        this.$body.appendChild(tr);
      }
      return;
    }

    pageRows.forEach((row) => {
      const tr = document.createElement('tr');
      columns.forEach((column) => {
        const td = document.createElement('td');
        if (column.align) td.style.textAlign = column.align;
        const value = column.render ? column.render(row) : this._cellValue(row, column);
        this.renderCell(td, value);
        if (column.label != null) td.dataset.label = String(column.label);
        tr.appendChild(td);
      });
      this.$body.appendChild(tr);
    });
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
