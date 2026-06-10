import DataGridEngine from '../../Service/DataGridEngine/DataGridEngine.js';

// Pagination — a controlled, presentational pager.
//
// It owns no page state: the consumer holds the current page and passes it in
// via `currentPage`; on a click it calls `onPageChange(page)` but does NOT move
// itself — update `currentPage` to reflect the new page. Reusable on its own
// (lists, search results) or composed by Table. The page-button layout is
// computed with DataGridEngine.pageRange (single source of truth).
export default class Pagination extends HTMLElement {
  static props = {
    currentPage: { type: 'number', default: 1 },
    totalPages: { type: 'number', default: 1 },
    siblingCount: { type: 'number', default: 1 },
    boundaryCount: { type: 'number', default: 1 },
    showFirstLast: { type: 'boolean', default: false },
    disabled: { type: 'boolean', default: false },
    onPageChange: { type: 'function', default: null }
  };

  constructor(props) {
    super();
    slice.attachTemplate(this);

    this.$nav = this.querySelector('.slice-pagination');

    this._currentPage = 1;
    this._totalPages = 1;
    this._siblingCount = 1;
    this._boundaryCount = 1;
    this._showFirstLast = false;
    this._disabled = false;
    this._onPageChange = null;

    this._handleClick = this._handleClick.bind(this);

    slice.controller.setComponentProps(this, props || {});
  }

  set currentPage(value) {
    this._currentPage = Number.isFinite(value) ? Math.trunc(value) : 1;
    this._render();
  }
  get currentPage() { return this._currentPage; }

  set totalPages(value) {
    this._totalPages = Math.max(1, Number.isFinite(value) ? Math.trunc(value) : 1);
    this._currentPage = Math.min(this._currentPage, this._totalPages);
    this._render();
  }
  get totalPages() { return this._totalPages; }

  set siblingCount(value) {
    this._siblingCount = Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 1);
    this._render();
  }

  set boundaryCount(value) {
    this._boundaryCount = Math.max(1, Number.isFinite(value) ? Math.trunc(value) : 1);
    this._render();
  }

  set showFirstLast(value) {
    this._showFirstLast = value === true;
    this._render();
  }

  set disabled(value) {
    this._disabled = value === true;
    this._render();
  }
  get disabled() { return this._disabled; }

  set onPageChange(value) {
    this._onPageChange = typeof value === 'function' ? value : null;
  }

  init() {
    this.$nav.addEventListener('click', this._handleClick);
    this._render();
  }

  beforeDestroy() {
    this.$nav.removeEventListener('click', this._handleClick);
  }

  // Programmatic navigation — same controlled contract: emits, doesn't move.
  goTo(page) {
    const next = this._normalizePage(page);
    if (next !== this._currentPage) this._emit(next);
  }

  _handleClick(event) {
    if (this._disabled) return;
    const control = event.target.closest('[data-page]');
    if (!control || control.hasAttribute('disabled')) return;
    const page = Number(control.dataset.page);
    if (!Number.isFinite(page) || page === this._currentPage) return;
    this._emit(this._normalizePage(page));
  }

  _emit(page) {
    if (this._onPageChange) this._onPageChange(page);
  }

  _normalizePage(value) {
    const p = Number.isFinite(value) ? Math.trunc(value) : 1;
    return Math.min(Math.max(1, p), this._totalPages);
  }

  _render() {
    if (!this.$nav) return;
    this.$nav.innerHTML = '';

    const cur = Math.min(this._currentPage, this._totalPages);
    const total = this._totalPages;
    const atStart = cur <= 1;
    const atEnd = cur >= total;

    if (this._showFirstLast) {
      this.$nav.appendChild(this._control({ page: 1, label: '«', aria: 'First page', disabled: atStart }));
    }
    this.$nav.appendChild(this._control({ page: cur - 1, label: '‹', aria: 'Previous page', disabled: atStart }));

    const pages = DataGridEngine.pageRange(cur, total, {
      siblings: this._siblingCount,
      boundaries: this._boundaryCount
    });
    for (const page of pages) {
      if (page === '…') {
        this.$nav.appendChild(this._ellipsis());
      } else {
        this.$nav.appendChild(
          this._control({ page, label: String(page), aria: `Page ${page}`, current: page === cur })
        );
      }
    }

    this.$nav.appendChild(this._control({ page: cur + 1, label: '›', aria: 'Next page', disabled: atEnd }));
    if (this._showFirstLast) {
      this.$nav.appendChild(this._control({ page: total, label: '»', aria: 'Last page', disabled: atEnd }));
    }
  }

  _control({ page, label, aria, current = false, disabled = false }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slice-pagination__item';
    button.textContent = label;
    button.dataset.page = String(page);
    button.setAttribute('aria-label', aria);
    if (current) {
      button.classList.add('slice-pagination__item--current');
      button.setAttribute('aria-current', 'page');
    }
    if (disabled || this._disabled) {
      button.setAttribute('disabled', '');
    }
    return button;
  }

  _ellipsis() {
    const span = document.createElement('span');
    span.className = 'slice-pagination__ellipsis';
    span.textContent = '…';
    span.setAttribute('aria-hidden', 'true');
    return span;
  }
}

customElements.define('slice-pagination', Pagination);
