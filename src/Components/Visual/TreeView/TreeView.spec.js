import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// TreeView renders a `.simple_treeview` container and builds one TreeItem child
// per top-level `items` node. Node shape: { value, path?, items? }.
// Canonical handler: `onClick`; deprecated alias: `onClickCallback` (warns once).

const ITEMS = [
   { value: 'Root A', path: '/a' },
   {
      value: 'Root B',
      items: [{ value: 'Child B1', path: '/b/1' }],
   },
];

test.describe('TreeView', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('TreeView');
      // The mounted element and its container exist; an empty tree has no
      // intrinsic size, so assert attachment rather than visibility.
      await expect(c.component).toBeAttached();
      await expect(c.locator('.simple_treeview')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders one TreeItem per top-level item', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS });
      // Each top-level node becomes a `slice-treeitem.tree_item` appended to the container.
      await expect(c.locator('.simple_treeview > .tree_item')).toHaveCount(2);
      await expect(c.locator('.slice_tree_item').first()).toContainText('Root A');
   });

   test('empty items renders an empty container', async ({ mount }) => {
      const c = await mount('TreeView', { items: [] });
      await expect(c.locator('.simple_treeview')).toBeAttached();
      await expect(c.locator('.simple_treeview > .tree_item')).toHaveCount(0);
   });

   test('onClick fires when a leaf tree item is clicked', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS }, { spies: ['onClick'] });
      // First node ("Root A") is a leaf (has a path), so its label click invokes onClick.
      await c.locator('.slice_tree_item').first().click();
      expect(await c.events('onClick')).toBe(1);
   });

   // §7 deprecation/alias contract.
   test('deprecated onClickCallback still wires the handler and warns once', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS }, { spies: ['onClickCallback'] });
      await c.locator('.slice_tree_item').first().click();

      expect(await c.events('onClickCallback')).toBe(1);

      const deprecations = c.deprecationWarnings();
      expect(deprecations.some((w) => w.includes('onClickCallback'))).toBe(true);
      expect(deprecations.filter((w) => w.includes('onClickCallback')).length).toBe(1);
   });

   test('a11y: container is present and exposes its items', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS });
      await expect(c.locator('.simple_treeview')).toBeVisible();
      await expect(c.locator('.slice_tree_item').first()).toBeVisible();
   });

   test('visual: tree with nested items @visual', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS });
      await expect(c.component).toHaveScreenshot('treeview-nested.png');
   });
});
