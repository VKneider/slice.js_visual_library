import test from 'node:test';
import assert from 'node:assert/strict';

import DataGridEngine from './DataGridEngine.js';

const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `n${String(i + 1).padStart(2, '0')}` }));

test.describe('DataGridEngine static helpers', () => {
  test('sortItems sorts ascending and descending, stably', () => {
    const data = [{ k: 2, t: 'a' }, { k: 1, t: 'b' }, { k: 2, t: 'c' }, { k: 1, t: 'd' }];
    const asc = DataGridEngine.sortItems(data, { key: 'k', direction: 'asc' });
    assert.deepEqual(asc.map((r) => r.t), ['b', 'd', 'a', 'c'], 'ties keep original order (stable)');
    const desc = DataGridEngine.sortItems(data, { key: 'k', direction: 'desc' });
    assert.deepEqual(desc.map((r) => r.t), ['a', 'c', 'b', 'd']);
  });

  test('sortItems pushes null/undefined first and is numeric-aware for strings', () => {
    const data = [{ k: 'b10' }, { k: null }, { k: 'b2' }, { k: undefined }];
    const asc = DataGridEngine.sortItems(data, { key: 'k', direction: 'asc' });
    assert.equal(asc[0].k, null);
    assert.equal(asc[1].k, undefined);
    assert.deepEqual(asc.slice(2).map((r) => r.k), ['b2', 'b10'], 'numeric collation: b2 < b10');
  });

  test('sortItems supports a custom accessor', () => {
    const data = [['z'], ['a'], ['m']];
    const sorted = DataGridEngine.sortItems(data, { accessor: (row) => row[0], direction: 'asc' });
    assert.deepEqual(sorted.map((r) => r[0]), ['a', 'm', 'z']);
  });

  test('paginate slices and reports totals, clamping out-of-range pages', () => {
    const data = rows(25);
    const p2 = DataGridEngine.paginate(data, 2, 10);
    assert.equal(p2.totalItems, 25);
    assert.equal(p2.totalPages, 3);
    assert.equal(p2.items.length, 10);
    assert.equal(p2.items[0].id, 11);
    assert.deepEqual([p2.start, p2.end], [10, 20]);

    const beyond = DataGridEngine.paginate(data, 99, 10);
    assert.equal(beyond.page, 3, 'page clamped to last');
    assert.equal(beyond.items.length, 5);
  });

  test('pageRange returns the full list when it fits (no ellipsis)', () => {
    assert.deepEqual(DataGridEngine.pageRange(1, 7, { siblings: 1, boundaries: 1 }), [1, 2, 3, 4, 5, 6, 7]);
  });

  test('pageRange inserts ellipses for large ranges', () => {
    assert.deepEqual(DataGridEngine.pageRange(10, 20), [1, '…', 9, 10, 11, '…', 20]);
    assert.deepEqual(DataGridEngine.pageRange(1, 20), [1, 2, 3, 4, 5, '…', 20]);
    assert.deepEqual(DataGridEngine.pageRange(20, 20), [1, '…', 16, 17, 18, 19, 20]);
  });
});

test.describe('DataGridEngine instance state', () => {
  test('pageRows reflects current page and pageSize', () => {
    const e = new DataGridEngine({ data: rows(25), pageSize: 10 });
    assert.equal(e.totalPages, 3);
    assert.equal(e.pageRows()[0].id, 1);
    e.setPage(2);
    assert.equal(e.page, 2);
    assert.equal(e.pageRows()[0].id, 11);
  });

  test('setPage clamps to [1, totalPages]', () => {
    const e = new DataGridEngine({ data: rows(15), pageSize: 10 });
    e.setPage(99);
    assert.equal(e.page, 2);
    e.setPage(-5);
    assert.equal(e.page, 1);
  });

  test('changing data/pageSize re-clamps the current page', () => {
    const e = new DataGridEngine({ data: rows(25), pageSize: 10 });
    e.setPage(3);
    e.setData(rows(5));
    assert.equal(e.page, 1, 'page clamped after shrinking data');
    e.setData(rows(25)).setPage(3).setPageSize(25);
    assert.equal(e.page, 1, 'page clamped after growing pageSize');
  });

  test('toggleSort cycles asc → desc → unsorted and resets to page 1', () => {
    const e = new DataGridEngine({ data: rows(25), pageSize: 10 });
    e.setPage(3);
    e.toggleSort('id');
    assert.deepEqual(e.sort, { key: 'id', direction: 'asc' });
    assert.equal(e.page, 1, 'sorting resets to first page');
    e.toggleSort('id');
    assert.equal(e.sort.direction, 'desc');
    e.toggleSort('id');
    assert.equal(e.sort, null, 'third toggle clears the sort');
  });

  test('toggling a new key starts at asc', () => {
    const e = new DataGridEngine({ data: rows(5) });
    e.toggleSort('id');
    e.toggleSort('name');
    assert.deepEqual(e.sort, { key: 'name', direction: 'asc' });
  });

  test('pageRows applies the active sort before slicing', () => {
    const e = new DataGridEngine({ data: rows(25), pageSize: 10 });
    e.setSort({ key: 'id', direction: 'desc' });
    assert.equal(e.pageRows()[0].id, 25, 'descending: page 1 starts at the highest id');
  });

  test('toggleSort keeps the per-column accessor through the whole cycle', () => {
    const nested = [{ u: { n: 'b' } }, { u: { n: 'a' } }];
    const accessor = (row) => row.u.n;
    const e = new DataGridEngine({ data: nested });

    e.toggleSort('n', { accessor });
    assert.equal(e.sort.accessor, accessor, 'accessor survives the toggle');
    assert.equal(e.pageRows()[0].u.n, 'a', 'and is the one actually used to sort');

    e.toggleSort('n', { accessor }); // desc
    assert.equal(e.pageRows()[0].u.n, 'b');
    assert.equal(e.sort.accessor, accessor);

    e.toggleSort('n', { accessor }); // unsorted
    assert.equal(e.sort, null);
  });

  test('setSort keeps a custom comparator', () => {
    const data = [{ s: 'bbb' }, { s: 'a' }, { s: 'cc' }];
    const e = new DataGridEngine({ data });
    e.setSort({ key: 's', direction: 'asc', comparator: (a, b) => a.length - b.length });
    assert.deepEqual(e.pageRows().map((r) => r.s), ['a', 'cc', 'bbb']);
    assert.equal(typeof e.sort.comparator, 'function');
  });

  test('a sort key of 0 — the index a legacy column uses — is a real key', () => {
    const e = new DataGridEngine({ data: [['b'], ['a']], pageSize: 10 });
    e.setSort({ key: 0, direction: 'asc' });
    assert.equal(e.sort.key, 0);
    assert.equal(e.pageRows()[0][0], 'a');
  });

  test('toggleSort compares keys loosely, so 0 and "0" are the same column', () => {
    const e = new DataGridEngine({ data: [['b'], ['a']] });
    e.setSort({ key: 0, direction: 'asc' });
    e.toggleSort('0');
    assert.deepEqual(e.sort, { key: '0', direction: 'desc' });
  });
});

test.describe('DataGridEngine manual mode', () => {
  test('pageRows returns the data as-is (no local sort or slice)', () => {
    const data = rows(5); // already "the current page"
    const e = new DataGridEngine({ data, pageSize: 10, manual: true, totalItems: 100 });
    e.setSort({ key: 'id', direction: 'desc' }); // would reorder in local mode
    e.setPage(3); // would slice in local mode
    assert.deepEqual(e.pageRows(), data, 'data passes through untouched');
  });

  test('totalItems / totalPages come from the external total', () => {
    const e = new DataGridEngine({ data: rows(10), pageSize: 10, manual: true, totalItems: 95 });
    assert.equal(e.totalItems, 95);
    assert.equal(e.totalPages, 10, 'ceil(95/10)');
    e.setTotalItems(40);
    assert.equal(e.totalPages, 4);
  });

  test('setPage clamps against the external total, state still tracked', () => {
    const e = new DataGridEngine({ data: rows(10), pageSize: 10, manual: true, totalItems: 30 });
    e.setPage(99);
    assert.equal(e.page, 3, 'clamped to ceil(30/10) = 3');
    e.toggleSort('name');
    assert.deepEqual(e.sort, { key: 'name', direction: 'asc' });
    assert.equal(e.page, 1, 'sorting still resets the tracked page');
  });
});

// ------------------------------------------------------------------ filtering

const people = [
  { id: 1, name: 'José Pérez', city: 'Maracaibo', age: 34, active: true, joined: '2024-03-10', role: 'admin', tags: ['a', 'b'] },
  { id: 2, name: 'Ana López', city: 'Caracas', age: 28, active: false, joined: '2023-11-02', role: 'editor', tags: ['b'] },
  { id: 3, name: 'Lucas Molina', city: 'Maracaibo', age: 41, active: true, joined: '2025-01-20', role: 'viewer', tags: [] },
  { id: 4, name: 'María Ruiz', city: 'Valencia', age: null, active: true, joined: null, role: 'editor', tags: ['c'] },
  { id: 5, name: 'Pedro Díaz', city: '', age: 19, active: 'false', joined: '2024-12-31', role: 'viewer', tags: ['a'] },
];
const ids = (rows) => rows.map((r) => r.id);
const only = (filter) => ids(new DataGridEngine({ data: people, pageSize: 100 }).setFilters([filter]).pageRows());

test.describe('DataGridEngine filters: text', () => {
  test('contains ignores case and accents', () => {
    assert.deepEqual(only({ key: 'name', op: 'contains', value: 'JOSE' }), [1]);
    assert.deepEqual(only({ key: 'name', value: 'molina' }), [3], 'type and op default to text/contains');
  });
  test('equals, notEquals, startsWith, endsWith, notContains', () => {
    assert.deepEqual(only({ key: 'city', op: 'equals', value: 'maracaibo' }), [1, 3]);
    assert.deepEqual(only({ key: 'city', op: 'notEquals', value: 'Maracaibo' }), [2, 4, 5]);
    assert.deepEqual(only({ key: 'name', op: 'startsWith', value: 'ma' }), [4]);
    assert.deepEqual(only({ key: 'name', op: 'endsWith', value: 'ez' }), [1, 2]);
    assert.deepEqual(only({ key: 'name', op: 'notContains', value: 'lopez' }), [1, 3, 4, 5]);
  });
  test('empty and notEmpty need no value', () => {
    assert.deepEqual(only({ key: 'city', op: 'empty' }), [5]);
    assert.deepEqual(only({ key: 'city', op: 'notEmpty' }), [1, 2, 3, 4]);
  });
  test('an empty text value is inactive and filters nothing', () => {
    const e = new DataGridEngine({ data: people }).setFilters([{ key: 'name', value: '   ' }]);
    assert.equal(e.filters.length, 0);
    assert.equal(e.isFiltered, false);
    assert.equal(e.totalItems, 5);
  });
});

test.describe('DataGridEngine filters: number', () => {
  test('comparison operators', () => {
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'gt', value: 30 }), [1, 3]);
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'gte', value: 34 }), [1, 3]);
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'lt', value: '28' }), [5], 'a numeric string operand works');
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'lte', value: 28 }), [2, 5]);
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'eq', value: 41 }), [3]);
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'neq', value: 41 }), [1, 2, 5], 'a null age is not "≠ 41"');
  });
  test('between is inclusive and open-ended on either side', () => {
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'between', value: [20, 35] }), [1, 2]);
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'between', value: [null, 28] }), [2, 5]);
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'between', value: [40, ''] }), [3]);
  });
  test('empty catches null', () => {
    assert.deepEqual(only({ key: 'age', type: 'number', op: 'empty' }), [4]);
  });
  test('a between with no bounds is inactive', () => {
    assert.equal(DataGridEngine.isActive({ key: 'age', type: 'number', op: 'between', value: ['', null] }), false);
  });
});

test.describe('DataGridEngine filters: boolean, date, select', () => {
  test('boolean matches real booleans and boolean-ish strings', () => {
    assert.deepEqual(only({ key: 'active', type: 'boolean', value: true }), [1, 3, 4]);
    assert.deepEqual(only({ key: 'active', type: 'boolean', value: false }), [2, 5]);
    assert.deepEqual(only({ key: 'active', type: 'boolean', value: 'false' }), [2, 5]);
  });
  test('date on / before / after / between, by local calendar day', () => {
    assert.deepEqual(only({ key: 'joined', type: 'date', op: 'on', value: '2024-03-10' }), [1]);
    assert.deepEqual(only({ key: 'joined', type: 'date', op: 'before', value: '2024-01-01' }), [2]);
    assert.deepEqual(only({ key: 'joined', type: 'date', op: 'after', value: '2024-12-31' }), [3]);
    assert.deepEqual(only({ key: 'joined', type: 'date', op: 'between', value: ['2024-01-01', '2024-12-31'] }), [1, 5]);
    assert.deepEqual(only({ key: 'joined', type: 'date', op: 'between', value: ['2024-06-01', null] }), [3, 5]);
  });
  test('a Date object and an ISO string on the same day match "on"', () => {
    const e = new DataGridEngine({ data: [{ d: new Date(2024, 2, 10, 23, 30) }, { d: '2024-03-11' }] });
    e.setFilters([{ key: 'd', type: 'date', op: 'on', value: '2024-03-10' }]);
    assert.equal(e.totalItems, 1);
  });
  test('select in / notIn, loose on type, any value of a multi-valued cell', () => {
    assert.deepEqual(only({ key: 'role', type: 'select', value: ['admin', 'editor'] }), [1, 2, 4]);
    assert.deepEqual(only({ key: 'role', type: 'select', op: 'notIn', value: ['viewer'] }), [1, 2, 4]);
    assert.deepEqual(only({ key: 'id', type: 'select', value: ['2', 3] }), [2, 3]);
    assert.deepEqual(only({ key: 'tags', type: 'select', value: ['a'] }), [1, 5]);
    assert.deepEqual(only({ key: 'tags', type: 'select', op: 'empty' }), [3]);
  });
  test('an empty selection is inactive', () => {
    assert.equal(DataGridEngine.isActive({ key: 'role', type: 'select', value: [] }), false);
  });
});

test.describe('DataGridEngine search and combinations', () => {
  test('search matches any column, every term, ignoring accents', () => {
    const e = new DataGridEngine({ data: people, pageSize: 100 });
    e.setSearch('maracaibo');
    assert.deepEqual(ids(e.pageRows()), [1, 3]);
    e.setSearch('perez maracaibo');
    assert.deepEqual(ids(e.pageRows()), [1], 'both terms must match');
    e.setSearch('  ');
    assert.equal(e.totalItems, 5);
  });
  test('search can be limited to some accessors', () => {
    const e = new DataGridEngine({ data: people, pageSize: 100 });
    e.setSearch('maracaibo', [(row) => row.name]);
    assert.equal(e.totalItems, 0);
  });
  test('search, several filters and sort combine (AND)', () => {
    const e = new DataGridEngine({ data: people, pageSize: 100 });
    e.setSearch('a');
    e.setFilters([
      { key: 'active', type: 'boolean', value: true },
      { key: 'age', type: 'number', op: 'gt', value: 30 },
    ]);
    e.setSort({ key: 'age', direction: 'desc' });
    assert.deepEqual(ids(e.pageRows()), [3, 1]);
    assert.equal(e.totalUnfiltered, 5);
    assert.equal(e.isFiltered, true);
  });
  test('a custom accessor reads nested values', () => {
    const data = [{ user: { name: 'Ana' } }, { user: { name: 'Bob' } }];
    const e = new DataGridEngine({ data });
    e.setFilters([{ key: 'user', accessor: (row) => row.user.name, value: 'bo' }]);
    assert.equal(e.totalItems, 1);
  });
  test('filtering resets to page 1 and pages over the filtered rows', () => {
    const e = new DataGridEngine({ data: rows(30), pageSize: 10 });
    e.setPage(3);
    e.setFilters([{ key: 'id', type: 'number', op: 'lte', value: 15 }]);
    assert.equal(e.page, 1);
    assert.equal(e.totalItems, 15);
    assert.equal(e.totalPages, 2);
  });
  test('filters getter omits accessors and normalizes defaults', () => {
    const e = new DataGridEngine({ data: people });
    e.setFilters([{ key: 'name', value: 'ana', accessor: (r) => r.name }]);
    assert.deepEqual(e.filters, [{ key: 'name', type: 'text', op: 'contains', value: 'ana' }]);
  });
  test('derived rows are memoized until something changes', () => {
    const e = new DataGridEngine({ data: people, pageSize: 2 });
    e.setFilters([{ key: 'active', type: 'boolean', value: true }]);
    const a = e.sortedRows();
    e.setPage(2);
    assert.equal(e.sortedRows(), a, 'paging does not re-filter');
    e.setSort({ key: 'age', direction: 'asc' });
    assert.notEqual(e.sortedRows(), a, 'sorting rebuilds');
  });
  test('manual mode tracks filters but never applies them', () => {
    const e = new DataGridEngine({ data: people.slice(0, 2), manual: true, totalItems: 50, pageSize: 2 });
    e.setFilters([{ key: 'name', value: 'zzz' }]);
    assert.equal(e.pageRows().length, 2);
    assert.equal(e.totalItems, 50);
    assert.equal(e.filters.length, 1);
  });
});

test.describe('DataGridEngine.inferType', () => {
  test('infers number, boolean, date, select and text', () => {
    assert.equal(DataGridEngine.inferType(people.map((p) => p.age)), 'number');
    assert.equal(DataGridEngine.inferType([true, false, null]), 'boolean');
    assert.equal(DataGridEngine.inferType(people.map((p) => p.joined)), 'date');
    assert.equal(DataGridEngine.inferType(['a', 'b', 'a', 'b', 'a']), 'select');
    assert.equal(DataGridEngine.inferType(people.map((p) => p.name)), 'text');
    assert.equal(DataGridEngine.inferType([]), 'text');
  });
});