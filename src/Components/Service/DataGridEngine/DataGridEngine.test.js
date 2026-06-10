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
