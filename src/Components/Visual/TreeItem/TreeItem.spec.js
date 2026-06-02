import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// TreeItem renders a `.slice_tree_item` <label>. `value` sets its textContent.
// A leaf (no `items`) fires `onClick` on click. A branch (`items`) builds a
// nested container and a caret. Canonical handler: `onClick`; deprecated alias:
// `onClickCallback` (warns once).

test.describe('TreeItem', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('TreeItem', { value: 'Node' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_tree_item')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('value reflects to label text', async ({ mount }) => {
      const c = await mount('TreeItem', { value: 'My Node' });
      await expect(c.locator('.slice_tree_item')).toContainText('My Node');
   });

   test('onClick fires when a leaf item label is clicked', async ({ mount }) => {
      // No `items` and no `path` -> the label click handler invokes onClick.
      const c = await mount('TreeItem', { value: 'Leaf' }, { spies: ['onClick'] });
      await c.locator('.slice_tree_item').click();
      expect(await c.events('onClick')).toBe(1);
   });

   test('onClick receives the TreeItem instance as argument', async ({ mount }) => {
      const c = await mount('TreeItem', { value: 'Leaf' }, { spies: ['onClick'] });
      await c.locator('.slice_tree_item').click();
      const args = await c.eventArgs('onClick');
      // Handler is called as onClick(this); one call, one argument.
      expect(args.length).toBe(1);
      expect(args[0].length).toBe(1);
   });

   test('branch item renders a caret and a nested container', async ({ mount }) => {
      const c = await mount('TreeItem', {
         value: 'Parent',
         items: [{ value: 'Child', path: '/c' }],
      });
      await expect(c.locator('.caret').first()).toBeVisible();
      // The parent's own container (nested children may add their own .container too).
      await expect(c.locator('.container').first()).toBeAttached();
      // The nested child TreeItem is built into the container.
      await expect(c.locator('.container .slice_tree_item').first()).toContainText('Child');
   });

   // §7 deprecation/alias contract.
   test('deprecated onClickCallback still wires the handler and warns once', async ({ mount }) => {
      const c = await mount('TreeItem', { value: 'Legacy' }, { spies: ['onClickCallback'] });
      await c.locator('.slice_tree_item').click();

      expect(await c.events('onClickCallback')).toBe(1);

      const deprecations = c.deprecationWarnings();
      expect(deprecations.some((w) => w.includes('onClickCallback'))).toBe(true);
      expect(deprecations.filter((w) => w.includes('onClickCallback')).length).toBe(1);
   });

   test('a11y: item label is rendered and visible', async ({ mount }) => {
      const c = await mount('TreeItem', { value: 'A11y' });
      await expect(c.locator('.slice_tree_item')).toBeVisible();
   });

   test('visual: branch tree item @visual', async ({ mount }) => {
      const c = await mount('TreeItem', {
         value: 'Parent',
         items: [{ value: 'Child', path: '/c' }],
      });
      await expect(c.component).toHaveScreenshot('treeitem-branch.png');
   });
});
