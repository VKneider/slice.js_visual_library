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

   test('leaf item does NOT have is-branch class', async ({ mount }) => {
      const c = await mount('TreeItem', { value: 'Leaf' });
      await expect(c.component).not.toHaveClass(/is-branch/);
   });

   test('branch item has is-branch class on the host', async ({ mount }) => {
      const c = await mount('TreeItem', {
         value: 'Parent',
         items: [{ value: 'Child', path: '/c' }],
      });
      await expect(c.component).toHaveClass(/is-branch/);
   });

   test('empty items array does not create a branch', async ({ mount }) => {
      const c = await mount('TreeItem', { value: 'Leaf', items: [] });
      await expect(c.component).not.toHaveClass(/is-branch/);
      await expect(c.locator('.caret')).toHaveCount(0);
   });

   test('setActive(true) adds is-active class to the label', async ({ mount, page }) => {
      const c = await mount('TreeItem', { value: 'Item' });
      await page.evaluate(() => {
         const el = document.querySelector('slice-treeitem');
         if (el) el.setActive(true);
      });
      await expect(c.locator('.slice_tree_item')).toHaveClass(/is-active/);
   });

   test('setActive(false) removes is-active class from the label', async ({ mount, page }) => {
      const c = await mount('TreeItem', { value: 'Item' });
      await page.evaluate(() => {
         const el = document.querySelector('slice-treeitem');
         if (el) el.setActive(true);
      });
      await expect(c.locator('.slice_tree_item')).toHaveClass(/is-active/);

      await page.evaluate(() => {
         const el = document.querySelector('slice-treeitem');
         if (el) el.setActive(false);
      });
      await expect(c.locator('.slice_tree_item')).not.toHaveClass(/is-active/);
   });

   test('restores open branch state from localStorage', async ({ mount, page }) => {
      await page.evaluate(() => {
         localStorage.clear();
         localStorage.setItem('treeitem-Parent', 'open');
      });

      const c = await mount('TreeItem', {
         value: 'Parent',
         items: [{ value: 'Child', path: '/c' }],
      });

      await expect(c.locator('.caret')).toHaveClass(/caret_open/);
      await expect(c.locator('.container').first()).toHaveClass(/container_open/);
   });

   test('branch label toggle persists open and closed state', async ({ mount, page }) => {
      await page.evaluate(() => localStorage.clear());
      const c = await mount('TreeItem', {
         value: 'Parent',
         items: [{ value: 'Child', path: '/c' }],
      });

      const parentLabel = c.component.locator(':scope > .slice_tree_item');
      const parentCaret = c.component.locator(':scope > .slice_tree_item .caret');
      const parentContainer = c.component.locator(':scope > .container');

      await parentLabel.click();
      await expect(parentCaret).toHaveClass(/caret_open/);
      await expect(parentContainer).toHaveClass(/container_open/);
      await expect
         .poll(() => page.evaluate(() => localStorage.getItem('treeitem-Parent')))
         .toBe('open');

      await parentLabel.click();
      await expect(parentCaret).not.toHaveClass(/caret_open/);
      await expect(parentContainer).not.toHaveClass(/container_open/);
      await expect
         .poll(() => page.evaluate(() => localStorage.getItem('treeitem-Parent')))
         .toBe('closed');
   });

   test('caret click toggles branch exactly once', async ({ mount, page }) => {
      await page.evaluate(() => localStorage.clear());
      const c = await mount('TreeItem', {
         value: 'Parent',
         items: [{ value: 'Child', path: '/c' }],
      });

      const parentCaret = c.component.locator(':scope > .slice_tree_item .caret');
      const parentContainer = c.component.locator(':scope > .container');

      await parentCaret.click();
      await expect(parentCaret).toHaveClass(/caret_open/);
      await expect(parentContainer).toHaveClass(/container_open/);
      await expect
         .poll(() => page.evaluate(() => localStorage.getItem('treeitem-Parent')))
         .toBe('open');
   });

   test('visual: branch tree item @visual', async ({ mount }) => {
      const c = await mount('TreeItem', {
         value: 'Parent',
         items: [{ value: 'Child', path: '/c' }],
      });
      await expect(c.component).toHaveScreenshot('treeitem-branch.png');
   });

// ── the caret must stand on its own ────────────────────────────────────────
//
// The shape of the caret came from a bare `.caret` rule in the app's global
// stylesheet. The component does not ship that file, so anyone who installed
// TreeItem got a 0x0 div: no triangle, and — because a branch carrying a `path`
// only toggles from its caret — no way to open it at all.

test.describe('TreeItem - caret', () => {
   /**
    * Neutralises every global `.caret` rule on the page, reproducing what a
    * consumer who did NOT get the app stylesheet sees, then reads the caret back.
    */
   async function caretWithoutGlobalStylesheet(h, items) {
      return h.page.evaluate(async (data) => {
         for (const sheet of document.styleSheets) {
            let rules;
            try {
               rules = [...sheet.cssRules];
            } catch {
               continue;
            }
            for (const rule of rules) {
               if (rule.selectorText === '.caret') {
                  // Keep it matching, strip its geometry.
                  rule.style.cssText = 'width:0;height:0;border:0';
               }
            }
         }

         const stage = document.createElement('div');
         stage.style.cssText = 'padding:24px;background:#fff;width:420px';
         document.body.appendChild(stage);

         const nav = await slice.build('TreeView', { items: data });
         stage.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));

         const caret = nav.querySelector('.caret');
         const r = caret.getBoundingClientRect();
         const cs = getComputedStyle(caret);
         return {
            w: r.width,
            h: r.height,
            borderTop: parseFloat(cs.borderTopWidth) || 0,
            cursor: cs.cursor,
            transform: cs.transform,
         };
      }, items);
   }

   const TREE = [{ value: 'Docs', items: [{ value: 'A.pdf', path: '/a' }] }];

   test('has a visible size with no global stylesheet present', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const caret = await caretWithoutGlobalStylesheet(h, TREE);

      // Before the fix: 0 x 0, so nothing was drawn and nothing could be clicked.
      expect(caret.w).toBeGreaterThan(0);
      expect(caret.h).toBeGreaterThan(0);
      // Drawn with borders rather than content, which is what the triangle is.
      expect(caret.borderTop).toBeGreaterThan(0);
      expect(caret.cursor).toBe('pointer');
   });

   test('is identical with and without the global rule', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const withGlobal = await h.page.evaluate(async (data) => {
         const stage = document.createElement('div');
         stage.style.cssText = 'padding:24px;width:420px';
         document.body.appendChild(stage);
         const nav = await slice.build('TreeView', { items: data });
         stage.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));
         const r = nav.querySelector('.caret').getBoundingClientRect();
         return { w: r.width, h: r.height };
      }, TREE);

      const without = await caretWithoutGlobalStylesheet(h, TREE);

      // The component's own rule outranks the global one, so owning the shape
      // changed nothing for existing consumers of the app stylesheet.
      expect(without.w).toBeCloseTo(withGlobal.w, 1);
      expect(without.h).toBeCloseTo(withGlobal.h, 1);
   });

   test('a closed caret points sideways and an open one points down', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const angles = await h.page.evaluate(async (data) => {
         const stage = document.createElement('div');
         stage.style.cssText = 'padding:24px;width:420px';
         document.body.appendChild(stage);
         const nav = await slice.build('TreeView', { items: data });
         stage.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));

         const caret = nav.querySelector('.caret');
         const closed = getComputedStyle(caret).transform;

         caret.click();
         await new Promise((r) => setTimeout(r, 500));
         const open = getComputedStyle(caret).transform;

         return { closed, open };
      }, TREE);

      // rotate(-90deg) and rotate(0deg) respectively. If these ever compare
      // equal the caret no longer signals which way it will move.
      expect(angles.closed).not.toBe(angles.open);
      expect(angles.closed).toBe('matrix(0, -1, 1, 0, 0, 0)');
      expect(angles.open).toBe('matrix(1, 0, 0, 1, 0, 0)');
   });
});});
