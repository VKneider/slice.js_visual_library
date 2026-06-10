// DataGridEngine — a stateful, headless data engine for tables/lists.
//
// It owns the view state (data, page, pageSize, sort) and exposes derived data
// (pageRows, totalPages, pageRange) + mutators (setPage, toggleSort, setData).
// No DOM, no rendering — consumers bring the UI (Table, custom lists, the
// Pagination component).
//
// Built per consumer via slice.build('DataGridEngine', { sliceId, data, ... });
// the owner destroys it in beforeDestroy(). Pure one-off math is also available
// as static helpers so callers that don't need state can skip the instance.

const _SET_DATA = 'setData';
const _SET_PAGE_SIZE = 'setPageSize';
const _SET_PAGE = 'setPage';
const _SET_SORT = 'setSort';
const _SET_TOTAL_ITEMS = 'setTotalItems';

export default class DataGridEngine {
  constructor(props = {}) {
    this._data = Array.isArray(props.data) ? props.data : [];
    this._pageSize = props.pageSize > 0 ? props.pageSize : 10;
    this._page = 1;
    this._sort = props.sort && props.sort.key ? { ...props.sort } : null;
    // Manual mode: the data is already the current page (sorted + sliced
    // elsewhere, e.g. a server). The engine then only TRACKS page/sort state
    // and computes totals from an externally supplied totalItems — it does not
    // sort or slice the data itself.
    this._manual = props.manual === true;
    this._totalItemsOverride = Number.isFinite(props.totalItems) ? props.totalItems : null;
    this._clampPage();
  }

  // --- state mutators (chainable) ---
  [_SET_DATA](data) {
    this._data = Array.isArray(data) ? data : [];
    this._clampPage();
    return this;
  }

  [_SET_PAGE_SIZE](size) {
    if (size > 0) {
      this._pageSize = size;
      this._clampPage();
    }
    return this;
  }

  [_SET_PAGE](page) {
    this._page = this._clamp(page);
    return this;
  }

  [_SET_SORT](sort) {
    this._sort = sort && sort.key ? { key: sort.key, direction: sort.direction === 'desc' ? 'desc' : 'asc' } : null;
    this._page = 1;
    return this;
  }

  // Externally-known total (manual mode). Drives totalPages when set.
  [_SET_TOTAL_ITEMS](total) {
    this._totalItemsOverride = Number.isFinite(total) ? total : null;
    this._clampPage();
    return this;
  }

  // Cycles a column through asc → desc → unsorted.
  toggleSort(key) {
    if (!this._sort || this._sort.key !== key) {
      this._sort = { key, direction: 'asc' };
    } else if (this._sort.direction === 'asc') {
      this._sort = { key, direction: 'desc' };
    } else {
      this._sort = null;
    }
    this._page = 1;
    return this;
  }

  // --- derived state ---
  get page() { return this._page; }
  get pageSize() { return this._pageSize; }
  get sort() { return this._sort ? { ...this._sort } : null; }
  get totalItems() {
    if (this._manual && this._totalItemsOverride !== null) return this._totalItemsOverride;
    return this._data.length;
  }
  get totalPages() { return Math.max(1, Math.ceil(this.totalItems / this._pageSize)); }

  // Rows for the current page. In manual mode the data IS the page, so it is
  // returned as-is; otherwise it is sorted and sliced locally.
  pageRows() {
    if (this._manual) return this._data;
    const sorted = this._sort ? DataGridEngine.sortItems(this._data, this._sort) : this._data;
    const start = (this._page - 1) * this._pageSize;
    return sorted.slice(start, start + this._pageSize);
  }

  // Page-button layout for the current page, e.g. [1, '…', 4, 5, 6, '…', 20].
  pageRange(options = {}) {
    return DataGridEngine.pageRange(this._page, this.totalPages, options);
  }

  // --- internals ---
  _clamp(page) {
    const p = Number.isFinite(page) ? Math.trunc(page) : 1;
    return Math.min(Math.max(1, p), this.totalPages);
  }

  _clampPage() {
    this._page = this._clamp(this._page);
  }

  // --- pure static helpers (no instance / no state) ---
  static sortItems(items, options = {}) {
    if (!Array.isArray(items)) return [];
    const { key, accessor, comparator } = options;
    const get = accessor || ((row) => (Array.isArray(row) ? row[key] : row == null ? undefined : row[key]));
    const cmp = comparator || DataGridEngine._defaultComparator;
    const dir = options.direction === 'desc' ? -1 : 1;
    // Stable sort: decorate with original index, break ties by it.
    return items
      .map((row, index) => ({ row, index }))
      .sort((a, b) => cmp(get(a.row), get(b.row)) * dir || a.index - b.index)
      .map((entry) => entry.row);
  }

  static paginate(items, page, pageSize) {
    const list = Array.isArray(items) ? items : [];
    const size = pageSize > 0 ? pageSize : 10;
    const totalItems = list.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / size));
    const p = Math.min(Math.max(1, Number.isFinite(page) ? Math.trunc(page) : 1), totalPages);
    const start = (p - 1) * size;
    const end = Math.min(start + size, totalItems);
    return { items: list.slice(start, end), page: p, pageSize: size, totalItems, totalPages, start, end };
  }

  static pageRange(current, totalPages, { siblings = 1, boundaries = 1 } = {}) {
    const total = Math.max(1, Number.isFinite(totalPages) ? Math.trunc(totalPages) : 1);
    const cur = Math.min(Math.max(1, Number.isFinite(current) ? Math.trunc(current) : 1), total);
    const range = (start, end) =>
      start > end ? [] : Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const totalSlots = boundaries * 2 + siblings * 2 + 3;
    if (total <= totalSlots) return range(1, total);

    const startPages = range(1, boundaries);
    const endPages = range(total - boundaries + 1, total);

    const siblingsStart = Math.max(
      Math.min(cur - siblings, total - boundaries - siblings * 2 - 1),
      boundaries + 2
    );
    const siblingsEnd = Math.min(
      Math.max(cur + siblings, boundaries + siblings * 2 + 2),
      total - boundaries - 1
    );

    return [
      ...startPages,
      siblingsStart > boundaries + 2 ? '…' : boundaries + 1 < total - boundaries ? boundaries + 1 : null,
      ...range(siblingsStart, siblingsEnd),
      siblingsEnd < total - boundaries - 1 ? '…' : total - boundaries > boundaries ? total - boundaries : null,
      ...endPages
    ].filter((item) => item !== null);
  }

  static _defaultComparator(a, b) {
    const aNull = a == null;
    const bNull = b == null;
    if (aNull && bNull) return 0; // both nullish → tie (stable index keeps order)
    if (aNull) return -1;
    if (bNull) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }
}
