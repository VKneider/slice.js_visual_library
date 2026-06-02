import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Layout baseline contract. Derived from Layout.js (Layout.html is empty — the
// component is a bare container that appends `layout` and `view` nodes).
//   - tag: slice-layout
//   - props `layout` and `view` are objects expected to be live DOM nodes; init
//     appends them (onLayOut / showing use appendChild).
//
// LIMITATION: both meaningful props (`layout`, `view`) require live DOM nodes,
// which cannot be serialized across the page boundary via `mount` props. Passing
// plain objects would make appendChild throw, so the node-insertion behaviour is
// not exercised here. We assert the component still builds and mounts cleanly
// with no props (defaults are null, so init() is a no-op) and is a valid host.

test.describe('Layout', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Layout');
      await expect(c.component).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('mounts as a slice-layout custom element', async ({ mount }) => {
      const c = await mount('Layout');
      await expect(c.component).toHaveJSProperty('tagName', 'SLICE-LAYOUT');
   });

   test('renders no children when layout/view are not provided', async ({ mount }) => {
      const c = await mount('Layout');
      // Defaults are null -> init() appends nothing.
      await expect(c.locator(':scope > slice-layout > *')).toHaveCount(0);
      expect(c.pageErrors()).toEqual([]);
   });

   test('visual: empty layout host @visual', async ({ mount }) => {
      const c = await mount('Layout');
      await expect(c.component).toHaveScreenshot('layout-empty.png');
   });
});
