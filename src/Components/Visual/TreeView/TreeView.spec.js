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

   // Â§7 deprecation/alias contract.
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
      await page.evaluate(() => {
         const tv = document.querySelector('slice-treeview');
         if (tv) tv.setActiveTreeItem(tv.querySelector('.tree_item'));
      });
      const firstLabel = c.locator('.simple_treeview > .tree_item:first-child > .slice_tree_item');
      await expect(firstLabel).toHaveClass(/is-active/);

      // Activate Root B (switches active)
      await page.evaluate(() => {
         const tv = document.querySelector('slice-treeview');
         if (tv) tv.setActiveTreeItem(tv.querySelectorAll('.tree_item')[1]);
      });
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

   test('setting items after build re-renders', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS });
      await expect(c.locator('.simple_treeview > .tree_item')).toHaveCount(ITEMS.length);

      await c.component.evaluate((el) => { el.items = [{ path: 'solo', value: 'Solo' }]; });

      await expect.poll(() => c.locator('.simple_treeview > .tree_item').count()).toBe(1);
      await expect(c.locator('.simple_treeview')).toContainText('Solo');
   });

   test('re-rendering twice does not duplicate the tree', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS });
      await c.component.evaluate((el, items) => { el.items = items; }, ITEMS);
      await c.component.evaluate((el, items) => { el.items = items; }, ITEMS);

      await expect.poll(() => c.locator('.simple_treeview > .tree_item').count()).toBe(ITEMS.length);
   });

   test('a surviving TreeItem is MOVED, not rebuilt', async ({ mount, page }) => {
      await page.evaluate(() => localStorage.clear());
      const c = await mount('TreeView', { items: ITEMS });

      const out = await c.component.evaluate((el, items) => {
         const firstId = el.querySelector('.simple_treeview > .tree_item').sliceId;
         el.items = [...items].reverse();
         return { firstId };
      }, ITEMS);

      const ids = await c.component.evaluate((el) =>
         [...el.querySelectorAll('.simple_treeview > .tree_item')].map((n) => n.sliceId)
      );
      // Reversed, so the original first node is now LAST, and it is the same
      // node â€” a move, not a rebuild.
      expect(ids[ids.length - 1]).toBe(out.firstId);
      expect(new Set(ids).size).toBe(ITEMS.length);
   });

   test('a TreeItem whose data is gone is DESTROYED', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS, sliceId: 'tv-under-test' });

      const out = await c.component.evaluate(async (el, items) => {
         const idsBefore = [...el.querySelectorAll('.simple_treeview > .tree_item')].map((n) => n.sliceId);
         const registeredBefore = idsBefore.every((id) => slice.controller.activeComponents.has(id));

         el.items = [items[0]];
         // The setter kicks off an async reconcile; settle before asserting.
         await el._renderItems();

         return {
            registeredBefore,
            survivors: idsBefore.slice(1).filter((id) => slice.controller.activeComponents.has(id)),
            children: el.querySelectorAll('.simple_treeview > .tree_item').length,
         };
      }, ITEMS);

      expect(out.registeredBefore).toBe(true);
      expect(out.survivors).toEqual([]);
      expect(out.children).toBe(1);
      expect(c.pageErrors()).toEqual([]);
   });

   test('destroying the tree destroys its TreeItems', async ({ mount }) => {
      const c = await mount('TreeView', { items: ITEMS, sliceId: 'tv-destroy-me' });

      const out = await c.component.evaluate((el) => {
         const ids = [...el.querySelectorAll('.simple_treeview > .tree_item')].map((n) => n.sliceId);
         const before = ids.filter((id) => slice.controller.activeComponents.has(id)).length;

         slice.controller.destroyComponent('tv-destroy-me');
         return { before, total: ids.length, after: ids.filter((id) => slice.controller.activeComponents.has(id)).length };
      });

      expect(out.before).toBe(out.total);
      expect(out.after).toBe(0);
   });

   test('items without a path get stable per-object keys, not index keys', async ({ mount }) => {
      const c = await mount('TreeView', {});

      const out = await c.component.evaluate(async (el) => {
         // The same two objects on every render: they must map to the same nodes.
         const anon = [{ value: 'A' }, { value: 'B' }];
         el.items = anon;
         await el._renderItems();
         const firstIds = [...el.querySelectorAll('.simple_treeview > .tree_item')].map((n) => n.sliceId);

         el.items = anon;
         await el._renderItems();
         return {
            firstIds,
            secondIds: [...el.querySelectorAll('.simple_treeview > .tree_item')].map((n) => n.sliceId),
            count: el.querySelectorAll('.simple_treeview > .tree_item').length,
         };
      });

      // Two distinct keys, stable across renders. An index key would also be
      // stable here, but it would swap identities on any splice.
      expect(new Set(out.firstIds).size).toBe(2);
      expect(out.secondIds).toEqual(out.firstIds);
      expect(out.count).toBe(2);
   });

// ── schema shape and row geometry ──────────────────────────────────────────
//
// Two defects here were invisible to every existing spec: the component built,
// the classes were right, and nothing failed. One dropped whole branches, the
// other silently clipped every row.

const ALT_ITEMS = [
   {
      text: 'Documents',
      children: [
         { text: 'Invoices.pdf', path: '/docs/invoices' },
         { text: 'Contracts', children: [{ text: '2024.pdf', path: '/docs/c24' }] },
         { text: 'Notes.md', path: '/docs/notes' },
      ],
   },
   { text: 'Images', children: [{ text: 'logo.png', path: '/img/logo' }] },
   { text: 'README.md', path: '/readme' },
];

test.describe('TreeView - schema tolerance', () => {
   test('an item using text + children renders the whole tree', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const state = await h.page.evaluate(async (items) => {
         const nav = await slice.build('TreeView', { items });
         document.body.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));
         const all = [...nav.querySelectorAll('slice-treeitem')];
         return {
            total: all.length,
            topLevel: nav.querySelectorAll(':scope > .simple_treeview > slice-treeitem').length,
            carets: nav.querySelectorAll('.caret').length,
            labels: all.map((it) => it.querySelector('.slice_tree_item')?.textContent.trim() ?? null),
         };
      }, ALT_ITEMS);

      // Before: ONE TreeItem, the only leaf without a `children` key. `children`
      // is a getter-only property on HTMLElement, so spreading the item made
      // setComponentProps throw "Cannot set property children" and the instance
      // was never created — every branch vanished, leaving one ERROR in a
      // console nobody was watching.
      expect(state.total).toBe(8);
      expect(state.topLevel).toBe(3);
      expect(state.carets).toBe(3);
      expect(state.labels).toContain('Documents');
      expect(state.labels).toContain('Invoices.pdf');
      expect(state.labels).toContain('README.md');
      expect(state.labels.every((l) => l && l.length > 0)).toBe(true);
   });

   test('building a tree logs no component errors', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);
      const errors = [];
      h.page.on('console', (m) => {
         if (m.type() === 'error') errors.push(m.text());
      });

      await h.page.evaluate(async (items) => {
         const nav = await slice.build('TreeView', { items });
         document.body.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));
      }, ALT_ITEMS);

      expect(errors.filter((e) => e.includes('Error creating instance'))).toEqual([]);
   });

   test('the documented value + items schema still works', async ({ mount }) => {
      const c = await mount('TreeView', {
         items: [
            { value: 'Root', items: [{ value: 'Child', path: '/c' }] },
            { value: 'Other', path: '/o' },
         ],
      });

      const labels = await c.component.evaluate((el) =>
         [...el.querySelectorAll('.slice_tree_item')].map((l) => l.textContent.trim())
      );

      // Every label present, in the DOM: a collapsed branch keeps its children
      // mounted, it just clips them, so asserting an exact order would be
      // asserting the tree's expansion state rather than its structure.
      expect(labels).toHaveLength(3);
      expect(labels.sort()).toEqual(['Child', 'Other', 'Root']);
   });

   test('the caller data is not mutated while building', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const mutated = await h.page.evaluate(async () => {
         const child = { value: 'Child', path: '/c' };
         const parent = { value: 'Parent', items: [child] };

         const nav = await slice.build('TreeView', { items: [parent] });
         document.body.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));

         return {
            // The old setItem did `value.onClick = this._onClick`, stamping the
            // handler onto the caller's own objects, so the first child built
            // shared its handler with every later branch.
            json: JSON.stringify(parent),
            childHasOnClick: Object.prototype.hasOwnProperty.call(child, 'onClick'),
            parentKeys: Object.keys(parent).join(','),
         };
      });

      expect(mutated.json).toBe(JSON.stringify({ value: 'Parent', items: [{ value: 'Child', path: '/c' }] }));
      expect(mutated.childHasOnClick).toBe(false);
      expect(mutated.parentKeys).toBe('value,items');
   });
});

test.describe('TreeView - row geometry', () => {
   test('no row is wider than the tree', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async (items) => {
         const stage = document.createElement('div');
         stage.style.cssText = 'padding:24px;width:468px';
         document.body.appendChild(stage);

         const nav = await slice.build('TreeView', { items });
         stage.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));
         for (const c of nav.querySelectorAll('.container')) c.classList.add('container_open');
         await new Promise((r) => setTimeout(r, 400));

         const host = nav.getBoundingClientRect();
         const rows = [...nav.querySelectorAll('.slice_tree_item')].map((l) => {
            const r = l.getBoundingClientRect();
            return { text: l.textContent.trim().slice(0, 16), w: r.width, over: r.right > host.right + 0.5 };
         });
         return { hostW: host.width, rows };
      }, [
         { value: 'Docs', items: [{ value: 'A.pdf', path: '/a' }, { value: 'B.pdf', path: '/b' }] },
         { value: 'Readme', path: '/r' },
      ]);

      expect(out.rows.length).toBeGreaterThan(2);
      // `width: 100%` with content-box sizing put the 10px of horizontal padding
      // on top: every row measured 488px inside a 468px tree, and
      // `.simple_treeview`'s overflow-x: hidden cut it with no scrollbar.
      for (const row of out.rows) {
         expect(row.over, `"${row.text}" overflows the tree`).toBe(false);
         expect(row.w, `"${row.text}" width`).toBeLessThanOrEqual(out.hostW + 0.5);
      }
   });
});
// ── expanded: a tree you can be shown ──────────────────────────────────────
//
// Without this, a nested schema rendered three flat rows, 79-119px of blank
// space where the children should be, and a label that did nothing when
// clicked — because the label's toggle is only wired for branches with no
// `path`, and the only auto-open lever was `activePath`, which is about
// navigation rather than expansion.

const NESTED = [
   {
      value: 'Getting Started',
      path: '/docs/getting-started',
      items: [
         { value: 'Installation', path: '/docs/installation' },
         { value: 'Quick Start', path: '/docs/quick-start' },
      ],
   },
   {
      value: 'Components',
      path: '/docs/components',
      items: [
         { value: 'Button', path: '/docs/input/button' },
         { value: 'Card', path: '/docs/layout/card' },
      ],
   },
   { value: 'API Reference', path: '/docs/api' },
];

test.describe('TreeView - expanded', () => {
   /** Counts the TreeItems a user can actually see, not just those in the DOM. */
   const visibleCount = (h, props) =>
      h.page.evaluate(async (p) => {
         const stage = document.createElement('div');
         stage.id = 'stage';
         stage.style.cssText = 'padding:24px;width:420px';
         document.body.appendChild(stage);

         const nav = await slice.build('TreeView', p);
         stage.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));

         const all = [...nav.querySelectorAll('slice-treeitem')];
         const visible = all.filter((it) => it.parentElement.getBoundingClientRect().height > 0);

         return {
            inDom: all.length,
            visible: visible.length,
            labels: visible.map((it) => it.querySelector('.slice_tree_item').textContent.trim()),
         };
      }, props);

   test("expanded: 'all' shows every branch", async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await visibleCount(h, { items: NESTED, expanded: 'all' });

      expect(out.inDom).toBe(7);
      expect(out.visible).toBe(7);
      expect(out.labels).toContain('Installation');
      expect(out.labels).toContain('Components');
   });

   test('the default still collapses, so a nav sidebar is unaffected', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await visibleCount(h, { items: NESTED });

      // Only the three top-level rows. Before the fix this looked broken
      // rather than collapsed, which is the whole point of `expanded`.
      expect(out.inDom).toBe(7);
      expect(out.visible).toBe(3);
   });

   test('a branch label does nothing on click, which is why expanded exists', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const result = await h.page.evaluate(async (items) => {
         const nav = await slice.build('TreeView', { items });
         document.body.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));

         const branch = [...nav.querySelectorAll('slice-treeitem')].find((it) => it.querySelector('.caret'));
         branch.querySelector('.slice_tree_item').click();
         await new Promise((r) => setTimeout(r, 600));

         const byLabel = !!branch.querySelector('.container_open');

         branch.querySelector('.caret').click();
         await new Promise((r) => setTimeout(r, 600));

         return { byLabel, byCaret: !!branch.querySelector('.container_open') };
      }, NESTED);

      // Documented, not accidental: a branch with a `path` keeps its label free.
      expect(result.byLabel).toBe(false);
      expect(result.byCaret).toBe(true);
   });

   test('setExpanded opens one branch without touching the rest', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`);

      const out = await h.page.evaluate(async (items) => {
         const nav = await slice.build('TreeView', { items });
         document.body.appendChild(nav);
         await new Promise((r) => setTimeout(r, 900));

         const branches = [...nav.querySelectorAll('slice-treeitem.is-branch')];
         const heights = () => branches.map((b) => Math.round(b.$container.getBoundingClientRect().height));

         const before = heights();
         branches[0].setExpanded(true);
         await new Promise((r) => setTimeout(r, 400));

         return { before, after: heights() };
      }, NESTED);

      expect(out.before).toEqual([0, 0]);
      expect(out.after[0]).toBeGreaterThan(0);
      expect(out.after[1]).toBe(0);
   });
});});