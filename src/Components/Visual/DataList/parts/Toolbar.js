// Part of DataList: used only by DataList.js (see shared/README.md).
//
// The bar above the list: search, quick views, filters, sort, and "New".
//
// It only draws controls and reports what people pick; the list decides
// what that means (DataList._setSearch, _setView, _setFilter, _setSort).
// Everything it builds, it destroys in destroy().

export default class Toolbar {
   /** @param {any} list  the DataList */
   constructor(list) {
      this.list = list;
      this.$el = list.querySelector('.slice-data-list__toolbar');
      this.$search = list.querySelector('.slice-data-list__search');
      this.$views = list.querySelector('.slice-data-list__views');
      this.$controls = list.querySelector('.slice-data-list__controls');
      this.$summary = list.querySelector('.slice-data-list__summary');
      this.built = [];
      this.input = null;
      this.sortMenu = null;
      this.filterMenus = new Map();
      this._token = 0;
   }

   destroy() {
      this._token += 1;
      for (const component of this.built) slice.controller.destroyComponent(component);
      this.built = [];
      this.input = null;
      this.sortMenu = null;
      this.filterMenus.clear();
      this.$search.replaceChildren();
      this.$views.replaceChildren();
      this.$controls.replaceChildren();
   }

   async _build(name, props) {
      const component = await slice.build(/** @type {any} */ (name), props);
      if (component) this.built.push(component);
      return component;
   }

   /** Build (or rebuild) every control from the list's props. */
   async render() {
      this.destroy();
      const token = this._token;
      const list = this.list;
      const t = (key, values) => list._t(key, values);

      const tasks = [];

      if (list.searchable) {
         tasks.push(this._build('Input', {
            label: t('search'),
            value: list._search,
            icon: 'search',
            clearable: true,
            debounce: 200,
            size: 'sm',
            onChange: (value) => list._setSearch(value),
         }).then((input) => {
            this.input = input;
            if (token === this._token && input) this.$search.append(input);
         }));
      }

      if (list.createAction) {
         const create = list.createAction;
         tasks.push(this._build('Button', {
            value: create.label ?? t('create'),
            icon: create.icon ?? 'plus',
            size: 'sm',
            onClick: (event) => create.onClick?.({ list, event }),
         }).then((button) => ({ order: 9, node: button })));
      }

      for (const filter of list._filterDefs()) {
         tasks.push(this._buildFilter(filter).then((menu) => ({ order: 1, node: menu })));
      }

      if (Array.isArray(list.sortOptions) && list.sortOptions.length) {
         tasks.push(this._build('DropDown', {
            label: this._sortLabel(),
            icon: 'sort',
            variant: 'ghost',
            size: 'sm',
            placement: 'bottom-end',
            items: this._sortItems(),
         }).then((menu) => {
            this.sortMenu = menu;
            return { order: 5, node: menu };
         }));
      }

      const results = /** @type {any[]} */ (await Promise.all(tasks));
      if (token !== this._token) return;
      for (const entry of results.filter((r) => r && r.node).sort((a, b) => a.order - b.order)) {
         this.$controls.append(entry.node);
      }
      this.renderViews();
      this.sync();
   }

   // ── Views: All 42 · Open 12 · Mine 5 ──────────────────────────────

   renderViews() {
      const list = this.list;
      const views = list._viewList();
      this.$views.replaceChildren();
      this.$views.hidden = views.length === 0;
      if (!views.length) return;
      const counts = list._viewCounts();
      for (const view of views) {
         const button = document.createElement('button');
         button.type = 'button';
         button.className = 'slice-data-list__view';
         button.dataset.view = view.id;
         const active = view.id === list._viewId;
         button.setAttribute('aria-pressed', String(active));
         const label = document.createElement('span');
         label.textContent = view.label;
         button.append(label);
         const count = counts?.get(view.id);
         if (count !== undefined && list.showCounts !== false) {
            const badge = document.createElement('span');
            badge.className = 'slice-data-list__view-count';
            badge.textContent = String(count);
            button.append(badge);
         }
         button.addEventListener('click', () => list._setView(view.id));
         this.$views.append(button);
      }
   }

   // ── Filters: "Status: Open ▾" ─────────────────────────────────────

   async _buildFilter(filter) {
      const menu = await this._build('DropDown', {
         label: this._filterLabel(filter),
         variant: 'outlined',
         size: 'sm',
         placement: 'bottom-start',
         closeOnSelect: false,
         items: this._filterItems(filter),
      });
      if (menu) {
         menu.classList.add('slice-data-list__filter');
         this.filterMenus.set(filter.key, menu);
      }
      return menu;
   }

   _filterItems(filter) {
      const list = this.list;
      const values = list._filterValues[filter.key] ?? [];
      const options = list._filterOptions(filter);
      if (filter.type === 'boolean') {
         const current = values[0];
         const option = (label, value) => ({
            type: 'radio', group: `filter-${filter.key}`, label, checked: current === value,
            onClick: () => list._setFilter(filter.key, value === undefined ? [] : [value]),
         });
         return [option(list._t('any'), undefined), option(filter.trueLabel ?? list._t('yes'), true), option(filter.falseLabel ?? list._t('no'), false)];
      }
      const multiple = filter.multiple !== false;
      const items = options.map((option) => ({
         type: multiple ? undefined : 'radio',
         group: multiple ? undefined : `filter-${filter.key}`,
         label: option.count !== undefined ? `${option.label}  (${option.count})` : option.label,
         checked: values.includes(option.value),
         keepOpen: multiple,
         onClick: () => {
            const now = list._filterValues[filter.key] ?? [];
            const next = multiple
               ? (now.includes(option.value) ? now.filter((v) => v !== option.value) : [...now, option.value])
               : [option.value];
            list._setFilter(filter.key, next);
         },
      }));
      if (values.length) {
         items.push('separator', { label: list._t('clear'), icon: 'close', onClick: () => list._setFilter(filter.key, []) });
      }
      return items;
   }

   _filterLabel(filter) {
      const list = this.list;
      const values = list._filterValues[filter.key] ?? [];
      if (!values.length) return filter.label;
      const options = list._filterOptions(filter);
      const names = values.map((v) => {
         if (filter.type === 'boolean') return v ? (filter.trueLabel ?? list._t('yes')) : (filter.falseLabel ?? list._t('no'));
         return options.find((o) => o.value === v)?.label ?? String(v);
      });
      return `${filter.label}: ${names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ')}`;
   }

   // ── Sort ──────────────────────────────────────────────────────────

   _sortItems() {
      const list = this.list;
      const current = list._sort;
      const items = list.sortOptions.map((option, index) => ({
         type: 'radio',
         group: 'sort',
         label: option.label,
         checked: !!current && current.index === index,
         onClick: () => list._setSort(index),
      }));
      if (current) {
         items.push('separator', {
            label: current.direction === 'desc' ? list._t('descending') : list._t('ascending'),
            icon: current.direction === 'desc' ? 'arrow-down' : 'arrow-up',
            onClick: () => list._setSort(current.index, current.direction === 'desc' ? 'asc' : 'desc'),
         });
      }
      return items;
   }

   _sortLabel() {
      const list = this.list;
      const current = list._sort;
      const option = current ? list.sortOptions[current.index] : null;
      return option ? `${list._t('sortBy')}: ${option.label}` : list._t('sortBy');
   }

   // Labels and states that change with the list, without rebuilding.
   sync() {
      const list = this.list;
      for (const filter of list._filterDefs()) {
         const menu = this.filterMenus.get(filter.key);
         if (!menu) continue;
         menu.label = this._filterLabel(filter);
         menu.items = this._filterItems(filter);
         menu.classList.toggle('is-active', (list._filterValues[filter.key] ?? []).length > 0);
      }
      if (this.sortMenu) {
         this.sortMenu.label = this._sortLabel();
         this.sortMenu.items = this._sortItems();
      }
      for (const button of this.$views.querySelectorAll('.slice-data-list__view')) {
         const active = /** @type {HTMLElement} */ (button).dataset.view === list._viewId;
         button.setAttribute('aria-pressed', String(active));
      }
      const counts = list._viewCounts();
      if (counts) {
         for (const button of this.$views.querySelectorAll('.slice-data-list__view')) {
            const count = counts.get(/** @type {HTMLElement} */ (button).dataset.view);
            const badge = button.querySelector('.slice-data-list__view-count');
            if (badge && count !== undefined) badge.textContent = String(count);
         }
      }
   }
}
