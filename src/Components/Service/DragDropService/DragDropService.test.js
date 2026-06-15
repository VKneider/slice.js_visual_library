import test from 'node:test';
import assert from 'node:assert/strict';

import { getHandleConfig, clamp, computeResizeRect } from './dndGeometry.js';

const rect = (top, left, width, height) => ({ top, left, width, height });

test.describe('getHandleConfig', () => {
  test('single-edge handles map to one edge', () => {
    assert.deepEqual(getHandleConfig('n').edges, ['n']);
    assert.deepEqual(getHandleConfig('s').edges, ['s']);
    assert.deepEqual(getHandleConfig('e').edges, ['e']);
    assert.deepEqual(getHandleConfig('w').edges, ['w']);
  });

  test('corner handles map to two edges', () => {
    assert.deepEqual(getHandleConfig('ne').edges, ['n', 'e']);
    assert.deepEqual(getHandleConfig('nw').edges, ['n', 'w']);
    assert.deepEqual(getHandleConfig('se').edges, ['s', 'e']);
    assert.deepEqual(getHandleConfig('sw').edges, ['s', 'w']);
  });

  test('unknown handle returns null', () => {
    assert.equal(getHandleConfig('middle'), null);
    assert.equal(getHandleConfig(''), null);
    assert.equal(getHandleConfig(undefined), null);
  });
});

test.describe('clamp', () => {
  test('returns the value when within range', () => {
    assert.equal(clamp(5, 0, 10), 5);
  });

  test('clamps to the bounds', () => {
    assert.equal(clamp(-3, 0, 10), 0, 'below min → min');
    assert.equal(clamp(42, 0, 10), 10, 'above max → max');
  });

  test('respects an Infinity upper bound (the service default for maxWidth/maxHeight)', () => {
    assert.equal(clamp(99999, 50, Infinity), 99999);
    assert.equal(clamp(10, 50, Infinity), 50, 'min still applies');
  });
});

test.describe('computeResizeRect — single edges', () => {
  test('east grows width by delta.x, origin and other dims unchanged', () => {
    const r = computeResizeRect(rect(0, 0, 100, 50), { x: 40, y: 0 }, ['e'], 50, 50, Infinity, Infinity);
    assert.deepEqual(r, rect(0, 0, 140, 50));
  });

  test('south grows height by delta.y', () => {
    const r = computeResizeRect(rect(0, 0, 100, 50), { x: 0, y: 30 }, ['s'], 50, 20, Infinity, Infinity);
    assert.deepEqual(r, rect(0, 0, 100, 80));
  });

  test('west moves left so the east edge stays pinned', () => {
    // Drag the west handle 30px to the left: width grows by 30, left shifts -30.
    const r = computeResizeRect(rect(0, 100, 100, 50), { x: -30, y: 0 }, ['w'], 50, 50, Infinity, Infinity);
    assert.deepEqual(r, rect(0, 70, 130, 50));
    assert.equal(r.left + r.width, 200, 'east edge (left+width) is invariant');
  });

  test('north moves top so the south edge stays pinned', () => {
    const r = computeResizeRect(rect(100, 0, 50, 100), { x: 0, y: -30 }, ['n'], 50, 50, Infinity, Infinity);
    assert.deepEqual(r, rect(70, 0, 50, 130));
    assert.equal(r.top + r.height, 200, 'south edge (top+height) is invariant');
  });
});

test.describe('computeResizeRect — clamping keeps the pinned edge fixed', () => {
  test('east clamps to maxWidth', () => {
    const r = computeResizeRect(rect(0, 0, 100, 50), { x: 500, y: 0 }, ['e'], 50, 50, 120, Infinity);
    assert.equal(r.width, 120);
    assert.equal(r.left, 0);
  });

  test('west clamps to maxWidth but keeps the east edge pinned', () => {
    // Want +500 width but max is 120 (grows only 20); left must move only -20.
    const r = computeResizeRect(rect(0, 100, 100, 50), { x: -500, y: 0 }, ['w'], 50, 50, 120, Infinity);
    assert.equal(r.width, 120);
    assert.equal(r.left, 80);
    assert.equal(r.left + r.width, 200, 'east edge stays at 200');
  });

  test('west clamps to minWidth without crossing the east edge', () => {
    // Drag east by 80 → would shrink to 20, but min is 50.
    const r = computeResizeRect(rect(0, 100, 100, 50), { x: 80, y: 0 }, ['w'], 50, 50, Infinity, Infinity);
    assert.equal(r.width, 50);
    assert.equal(r.left, 150);
    assert.equal(r.left + r.width, 200, 'east edge stays at 200');
  });

  test('north clamps to minHeight without crossing the south edge', () => {
    const r = computeResizeRect(rect(100, 0, 50, 100), { x: 0, y: 80 }, ['n'], 50, 50, Infinity, Infinity);
    assert.equal(r.height, 50);
    assert.equal(r.top, 150);
    assert.equal(r.top + r.height, 200, 'south edge stays at 200');
  });
});

test.describe('computeResizeRect — corners', () => {
  test('se grows both width and height from the same delta', () => {
    const r = computeResizeRect(rect(0, 0, 200, 120), { x: 40, y: 30 }, ['s', 'e'], 120, 80, Infinity, Infinity);
    assert.deepEqual(r, rect(0, 0, 240, 150));
  });

  test('nw moves both origin axes and pins the opposite corner', () => {
    const r = computeResizeRect(rect(100, 100, 100, 100), { x: -20, y: -40 }, ['n', 'w'], 50, 50, Infinity, Infinity);
    assert.deepEqual(r, rect(60, 80, 120, 140));
    assert.equal(r.left + r.width, 200, 'east edge pinned');
    assert.equal(r.top + r.height, 200, 'south edge pinned');
  });

  test('ne grows width (east) and moves top (north)', () => {
    const r = computeResizeRect(rect(100, 0, 100, 100), { x: 25, y: -10 }, ['n', 'e'], 50, 50, Infinity, Infinity);
    assert.deepEqual(r, rect(90, 0, 125, 110));
  });

  test('does not mutate the original rect', () => {
    const orig = rect(0, 0, 100, 100);
    const snapshot = { ...orig };
    computeResizeRect(orig, { x: 40, y: 40 }, ['s', 'e'], 50, 50, Infinity, Infinity);
    assert.deepEqual(orig, snapshot, 'input rect is left untouched');
  });
});
