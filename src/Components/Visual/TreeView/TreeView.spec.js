import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const _SET_ACTIVE_TREE_ITEM = 'setActiveTreeItem';

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

const DEEP_ITEMS = [
   {
      value: 'Navigation',
      items: [
         {
            value: 'Core',
            items: [
               { value: 'Navbar', path: '/docs/navigation/navbar' },
               { value: 'Tabs', path: '/docs/navigation/tabs' },
               { value: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }
            ]
         }
      ]
   }
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

   test('activePath activates matching leaf and opens parent branches', async ({ mount, page }) => {
      const c = await mount('TreeView', {
         items: ITEMS,
         activePath: '/b/1',
      });
      // The leaf "Child B1" should be active
      const leafLabel = c.locator('.container .slice_tree_item');
      await expect(leafLabel).toContainText('Child B1');
      await expect(leafLabel).toHaveClass(/is-active/);
      // The parent branch "Root B" should be open
      await expect(c.locator('.tree_item.is-branch > .slice_tree_item').first()).toContainText('Root B');
      const parentCaret = c.locator('.tree_item.is-branch .caret_open');
      await expect(parentCaret).toHaveCount(1);
   });

   test('setActiveTreeItem toggles active state between items', async ({ mount, page }) => {
      const c = await mount('TreeView', { items: ITEMS });
      // Activate Root A
      await page.evaluate(({ method }) => {
         const tv = document.querySelector('slice-treeview');
         if (tv) tv[method](tv.querySelector('.tree_item'));
      }, { method: _SET_ACTIVE_TREE_ITEM });
      const firstLabel = c.locator('.simple_treeview > .tree_item:first-child > .slice_tree_item');
      await expect(firstLabel).toHaveClass(/is-active/);

      // Activate Root B (switches active)
      await page.evaluate(({ method }) => {
         const tv = document.querySelector('slice-treeview');
         if (tv) tv[method](tv.querySelectorAll('.tree_item')[1]);
      }, { method: _SET_ACTIVE_TREE_ITEM });
      await expect(firstLabel).not.toHaveClass(/is-active/);
      const secondLabel = c.locator('.simple_treeview > .tree_item:nth-child(2) > .slice_tree_item');
      await expect(secondLabel).toHaveClass(/is-active/);
   });

   test('activePath with no match does not activate any item', async ({ mount }) => {
      const c = await mount('TreeView', {
         items: ITEMS,
         activePath: '/nonexistent',
      });
      const items = c.locator('.slice_tree_item');
      const count = await items.count();
      for (let i = 0; i < count; i++) {
         await expect(items.nth(i)).not.toHaveClass(/is-active/);
      }
   });

   test('restores open branch state from localStorage on mount', async ({ mount, page }) => {
      await page.evaluate(() => {
         localStorage.clear();
         localStorage.setItem('treeitem-Root B', 'open');
      });

      const c = await mount('TreeView', { items: ITEMS });
      await expect(c.locator('.tree_item.is-branch .caret')).toHaveClass(/caret_open/);
      await expect(c.locator('.tree_item.is-branch .container').first()).toHaveClass(/container_open/);
   });

   test('activePath opening a branch persists open state in localStorage', async ({ mount, page }) => {
      await page.evaluate(() => localStorage.clear());

      const c = await mount('TreeView', {
         items: ITEMS,
         activePath: '/b/1',
      });

      await expect(c.locator('.tree_item.is-branch .caret')).toHaveClass(/caret_open/);
      await expect
         .poll(() => page.evaluate(() => localStorage.getItem('treeitem-Root B')))
         .toBe('open');
   });

   test('activePath auto-open keeps ancestor containers at auto height', async ({ mount }) => {
      const c = await mount('TreeView', {
         items: DEEP_ITEMS,
         activePath: '/docs/navigation/breadcrumbs'
      });

      const heights = await c.locator('.simple_treeview').evaluate((root) => {
         const first = root.querySelector(':scope > .tree_item > .container');
         const second = root.querySelector(':scope > .tree_item > .container > slice-treeitem > .container');
         return {
            firstHeight: first?.style?.height || '',
            secondHeight: second?.style?.height || ''
         };
      });

      await expect(c.locator('.slice_tree_item.is-active')).toContainText('Breadcrumbs');
      await expect(c.locator('.simple_treeview > .tree_item > .container')).toHaveClass(/container_open/);
      await expect(c.locator('.simple_treeview > .tree_item > .container > slice-treeitem > .container')).toHaveClass(/container_open/);
      expect(heights.firstHeight).toBe('auto');
      expect(heights.secondHeight).toBe('auto');
   });

   test('branch toggle in TreeView writes closed state to localStorage', async ({ mount, page }) => {
      await page.evaluate(() => {
         localStorage.clear();
         localStorage.setItem('treeitem-Root B', 'open');
      });

      const c = await mount('TreeView', { items: ITEMS });
      const branchLabel = c.locator('.simple_treeview > .tree_item.is-branch > .slice_tree_item');
      const branchCaret = c.locator('.simple_treeview > .tree_item.is-branch > .slice_tree_item .caret');
      const branchContainer = c.locator('.simple_treeview > .tree_item.is-branch > .container');

      await expect(branchCaret).toHaveClass(/caret_open/);

      await branchLabel.click();
      await expect(branchCaret).not.toHaveClass(/caret_open/);
      await expect(branchContainer).not.toHaveClass(/container_open/);
      await expect
         .poll(() => page.evaluate(() => localStorage.getItem('treeitem-Root B')))
         .toBe('closed');
   });

   test('visual: tree with nested items @visual', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS });
      await expect(c.component).toHaveScreenshot('treeview-nested.png');
   });
});
