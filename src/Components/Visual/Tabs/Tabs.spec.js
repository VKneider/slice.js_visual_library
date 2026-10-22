import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Tabs item shape (§4): { id, label } (optional `panel`).
const ITEMS = [
   { id: 'one', label: 'One' },
   { id: 'two', label: 'Two' },
   { id: 'three', label: 'Three' },
];

test.describe('Tabs', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_tabs')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders one tab button per item with role="tab" and label text', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS });
      const buttons = c.locator('.slice_tab_button');
      await expect(buttons).toHaveCount(3);
      await expect(buttons.nth(0)).toHaveText('One');
      await expect(buttons.nth(0)).toHaveAttribute('role', 'tab');
      await expect(buttons.nth(1)).toHaveAttribute('data-tab-id', 'two');
   });

   test('first tab is active by default when no activeTab given', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS });
      const first = c.locator('.slice_tab_button[data-tab-id="one"]');
      await expect(first).toHaveClass(/active/);
      await expect(first).toHaveAttribute('aria-selected', 'true');
   });

   test('activeTab prop selects the matching tab', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS, activeTab: 'two' });
      const second = c.locator('.slice_tab_button[data-tab-id="two"]');
      await expect(second).toHaveClass(/active/);
      await expect(second).toHaveAttribute('aria-selected', 'true');
      await expect(c.locator('.slice_tab_button[data-tab-id="one"]')).toHaveAttribute(
         'aria-selected',
         'false'
      );
   });

   test('clicking a tab activates it and fires onChange with the new tab id', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS }, { spies: ['onChange'] });
      await c.locator('.slice_tab_button[data-tab-id="three"]').click();

      await expect(c.locator('.slice_tab_button[data-tab-id="three"]')).toHaveClass(/active/);
      expect(await c.events('onChange')).toBe(1);
      expect(await c.eventArgs('onChange')).toEqual([['three']]);
   });

   test('renders panels when items carry a string panel', async ({ mount }) => {
      const c = await mount('Tabs', {
         items: [
            { id: 'a', label: 'A', panel: 'Panel A' },
            { id: 'b', label: 'B', panel: 'Panel B' },
         ],
      });
      const panels = c.locator('.slice_tab_panel');
      await expect(panels).toHaveCount(2);
      await expect(c.locator('.slice_tab_panel[data-tab-id="a"]')).toHaveText('Panel A');
      await expect(c.locator('.slice_tab_panel[data-tab-id="a"]')).toHaveClass(/active/);
   });

   // §7 deprecation/alias contract: onTabChange -> onChange. Legacy still fires AND warns once.
   test('deprecated onTabChange still fires and warns once', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS }, { spies: ['onTabChange'] });
      await c.locator('.slice_tab_button[data-tab-id="two"]').click();

      expect(await c.events('onTabChange')).toBe(1);

      const deprecations = c.deprecationWarnings();
      expect(deprecations.some((w) => w.includes('onTabChange'))).toBe(true);
      expect(deprecations.filter((w) => w.includes('onTabChange')).length).toBe(1);
   });

   test('a11y: tablist has role and aria-label, buttons are role="tab"', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS });
      await expect(c.locator('.slice_tabs_list')).toHaveAttribute('role', 'tablist');
      await expect(c.locator('.slice_tabs_list')).toHaveAttribute('aria-label', 'Tabs');
      await expect(c.locator('.slice_tab_button').first()).toHaveAttribute('role', 'tab');
   });

   test('visual: tabs with three items @visual', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS, activeTab: 'two' });
      await expect(c.component).toHaveScreenshot('tabs-three.png');
   });

   test('variant defaults to primary and paints its modifier class', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS });
      await expect(c.locator('.slice_tabs_list')).toHaveClass(/variant-primary/);
   });

   test('variant:"secondary" switches the modifier class', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS, variant: 'secondary' });
      const list = c.locator('.slice_tabs_list');
      await expect(list).toHaveClass(/variant-secondary/);
      await expect(list).not.toHaveClass(/variant-primary/);
   });

   test('an unknown variant falls back to primary', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS, variant: 'tertiary' });
      await expect(c.locator('.slice_tabs_list')).toHaveClass(/variant-primary/);
   });

   test('the panels container collapses when no item carries a panel', async ({ mount }) => {
      const withPanel = await mount('Tabs', {
         items: [{ id: 'a', label: 'A', panel: 'hello' }],
      });
      await expect(withPanel.locator('.slice_tabs_panels')).toBeVisible();

      const bare = await mount('Tabs', { items: [{ id: 'a', label: 'A' }] });
      await expect(bare.locator('.slice_tabs_panels')).toBeHidden();
   });
});

// ── The rewrite: keyboard, ARIA, panels, closing, state, looks ──

const RICH = [
   { id: 'a', label: 'Alpha', panel: 'Panel A' },
   { id: 'b', label: 'Beta', panel: 'Panel B', disabled: true },
   { id: 'c', label: 'Gamma', panel: 'Panel C' },
   { id: 'd', label: 'Delta', panel: 'Panel D' },
];

test.describe('Tabs — behaviour', () => {
   test('ARIA: tabs control their panels, panels are labelled by their tabs, one tab is tabbable', async ({ mount }) => {
      const c = await mount('Tabs', { items: RICH });
      const tab = c.locator('.slice_tab_button[data-tab-id="a"]');
      const panelId = await tab.getAttribute('aria-controls');
      const panel = c.locator(`#${panelId}`);
      await expect(panel).toHaveAttribute('role', 'tabpanel');
      await expect(panel).toHaveAttribute('aria-labelledby', await tab.getAttribute('id'));
      await expect(tab).toHaveAttribute('tabindex', '0');
      await expect(c.locator('.slice_tab_button[data-tab-id="c"]')).toHaveAttribute('tabindex', '-1');
      await expect(panel).toBeVisible();
      await expect(c.locator('.slice_tab_panel[data-tab-id="c"]')).toBeHidden();
   });

   test('arrows move and select (skipping disabled tabs), Home and End jump', async ({ mount, page }) => {
      const c = await mount('Tabs', { items: RICH }, { spies: ['onChange'] });
      await c.locator('.slice_tab_button[data-tab-id="a"]').focus();
      await page.keyboard.press('ArrowRight');
      await expect(c.locator('.slice_tab_button[data-tab-id="c"]')).toBeFocused();
      await expect(c.locator('.slice_tab_button[data-tab-id="c"]')).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('End');
      await expect(c.locator('.slice_tab_button[data-tab-id="d"]')).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('ArrowRight');   // wraps
      await expect(c.locator('.slice_tab_button[data-tab-id="a"]')).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('Home');
      expect(await c.eventArgs('onChange')).toEqual([['c'], ['d'], ['a']]);
   });

   test("activation: 'manual' — arrows move the focus, Enter selects", async ({ mount, page }) => {
      const c = await mount('Tabs', { items: RICH, activation: 'manual' });
      await c.locator('.slice_tab_button[data-tab-id="a"]').focus();
      await page.keyboard.press('ArrowRight');
      const gamma = c.locator('.slice_tab_button[data-tab-id="c"]');
      await expect(gamma).toBeFocused();
      await expect(gamma).toHaveAttribute('aria-selected', 'false');
      await page.keyboard.press('Enter');
      await expect(gamma).toHaveAttribute('aria-selected', 'true');
   });

   test('vertical: up and down arrows, and aria-orientation', async ({ mount, page }) => {
      const c = await mount('Tabs', { items: RICH, orientation: 'vertical' });
      await expect(c.locator('.slice_tabs_list')).toHaveAttribute('aria-orientation', 'vertical');
      await c.locator('.slice_tab_button[data-tab-id="a"]').focus();
      await page.keyboard.press('ArrowDown');
      await expect(c.locator('.slice_tab_button[data-tab-id="c"]')).toHaveAttribute('aria-selected', 'true');
   });

   test('a function panel runs once, the first time its tab opens', async ({ mount, page }) => {
      await mount('Tabs', { items: [] });
      const calls = await page.evaluate(async () => {
         window.__calls = 0;
         const tabs = window.__sliceMounted;
         tabs.items = [
            { id: 'x', label: 'X', panel: 'Static' },
            { id: 'y', label: 'Y', panel: async () => { window.__calls += 1; await new Promise((r) => setTimeout(r, 50)); return 'Loaded Y'; } },
         ];
         await new Promise((r) => setTimeout(r, 100));
         const before = window.__calls;
         tabs.select('y');
         await new Promise((r) => setTimeout(r, 150));
         tabs.select('x');
         tabs.select('y');
         await new Promise((r) => setTimeout(r, 150));
         return { before, after: window.__calls, text: tabs.getPanel('y').textContent };
      });
      expect(calls).toEqual({ before: 0, after: 1, text: 'Loaded Y' });
   });

   test('keepMounted: false runs a function panel again each time', async ({ mount, page }) => {
      await mount('Tabs', { items: [], keepMounted: false });
      const after = await page.evaluate(async () => {
         window.__calls = 0;
         const tabs = window.__sliceMounted;
         tabs.items = [{ id: 'x', label: 'X', panel: 'x' }, { id: 'y', label: 'Y', panel: () => { window.__calls += 1; return 'y'; } }];
         for (const id of ['y', 'x', 'y', 'x', 'y']) { tabs.select(id); await new Promise((r) => setTimeout(r, 20)); }
         return window.__calls;
      });
      expect(after).toBe(3);
   });

   test('closable: ✕ removes the tab, selects its neighbour and destroys what its panel held', async ({ mount, page }) => {
      await mount('Tabs', { items: [] }, { spies: ['onClose'] });
      const ids = await page.evaluate(async () => {
         const tabs = window.__sliceMounted;
         const button = await slice.build('Button', { value: 'Inside' });
         tabs.items = [
            { id: 'one', label: 'One', panel: 'one' },
            { id: 'two', label: 'Two', panel: button, closable: true },
            { id: 'three', label: 'Three', panel: 'three' },
         ];
         tabs.select('two');
         await new Promise((r) => setTimeout(r, 50));
         return button.sliceId;
      });
      await page.locator('.slice_tab_button[data-tab-id="two"] .slice_tab_close').click();
      await expect(page.locator('.slice_tab_button[data-tab-id="two"]')).toHaveCount(0);
      await expect(page.locator('.slice_tab_button[data-tab-id="three"]')).toHaveAttribute('aria-selected', 'true');
      expect(await page.evaluate((id) => slice.controller.activeComponents.has(id), ids)).toBe(false);
   });

   test('onClose returning false keeps the tab; Delete closes from the keyboard', async ({ mount, page }) => {
      const c = await mount('Tabs', { items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], closable: true });
      await page.evaluate(() => { window.__sliceMounted.onClose = (id) => id !== 'a'; });
      await c.locator('.slice_tab_button[data-tab-id="a"]').focus();
      await page.keyboard.press('Delete');
      await expect(c.locator('.slice_tab_button')).toHaveCount(2);
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Delete');
      await expect(c.locator('.slice_tab_button')).toHaveCount(1);
      await expect(c.locator('.slice_tab_button[data-tab-id="a"]')).toBeFocused();
   });

   test('replacing items keeps the panel of a tab that survives, and destroys the rest', async ({ mount, page }) => {
      await mount('Tabs', { items: [] });
      const result = await page.evaluate(async () => {
         const tabs = window.__sliceMounted;
         const kept = await slice.build('Button', { value: 'Kept' });
         const gone = await slice.build('Button', { value: 'Gone' });
         const items = [{ id: 'k', label: 'K', panel: kept }, { id: 'g', label: 'G', panel: gone }];
         tabs.items = items;
         tabs.select('g');
         await new Promise((r) => setTimeout(r, 30));
         tabs.select('k');
         tabs.items = [items[0], { id: 'n', label: 'N', panel: 'New' }];
         await new Promise((r) => setTimeout(r, 30));
         return {
            kept: slice.controller.activeComponents.has(kept.sliceId) && kept.isConnected,
            gone: slice.controller.activeComponents.has(gone.sliceId),
         };
      });
      expect(result).toEqual({ kept: true, gone: false });
   });

   test('onBeforeChange can refuse a switch', async ({ mount, page }) => {
      const c = await mount('Tabs', { items: RICH });
      await page.evaluate(() => { window.__sliceMounted.onBeforeChange = (next) => next !== 'd'; });
      await c.locator('.slice_tab_button[data-tab-id="d"]').click();
      await expect(c.locator('.slice_tab_button[data-tab-id="a"]')).toHaveAttribute('aria-selected', 'true');
      await c.locator('.slice_tab_button[data-tab-id="c"]').click();
      await expect(c.locator('.slice_tab_button[data-tab-id="c"]')).toHaveAttribute('aria-selected', 'true');
   });

   test('stateKey remembers the tab across a rebuild', async ({ mount, page }) => {
      await mount('Tabs', { items: RICH, stateKey: 'spec-tabs' });
      await page.locator('.slice_tab_button[data-tab-id="d"]').click();
      const restored = await page.evaluate(async () => {
         const again = await slice.build('Tabs', { items: [
            { id: 'a', label: 'A' }, { id: 'c', label: 'C' }, { id: 'd', label: 'D' }], stateKey: 'spec-tabs' });
         document.body.appendChild(again);
         await new Promise((r) => setTimeout(r, 50));
         const id = again.activeTab;
         localStorage.removeItem('slice-tabs:spec-tabs');
         return id;
      });
      expect(restored).toBe('d');
   });

   test('urlParam writes the tab to the URL and reads it back', async ({ mount, page }) => {
      await mount('Tabs', { items: RICH, urlParam: 'tab' });
      await page.locator('.slice_tab_button[data-tab-id="c"]').click();
      expect(new URL(page.url()).searchParams.get('tab')).toBe('c');
      const fromUrl = await page.evaluate(async () => {
         const again = await slice.build('Tabs', { items: [{ id: 'a', label: 'A' }, { id: 'c', label: 'C' }], urlParam: 'tab' });
         document.body.appendChild(again);
         await new Promise((r) => setTimeout(r, 50));
         return again.activeTab;
      });
      expect(fromUrl).toBe('c');
   });

   test('badges: numbers (capped at 99+), text, a dot, and setBadge', async ({ mount, page }) => {
      const c = await mount('Tabs', { items: [
         { id: 'a', label: 'A', badge: 120 }, { id: 'b', label: 'B', badge: true }, { id: 'c', label: 'C' }] });
      await expect(c.locator('.slice_tab_button[data-tab-id="a"] .slice_tab_badge')).toHaveText('99+');
      await expect(c.locator('.slice_tab_button[data-tab-id="b"] .slice_tab_badge')).toHaveClass(/is-dot/);
      await page.evaluate(() => window.__sliceMounted.setBadge('c', 'New'));
      await expect(c.locator('.slice_tab_button[data-tab-id="c"] .slice_tab_badge')).toHaveText('New');
      await page.evaluate(() => window.__sliceMounted.setBadge('c', null));
      await expect(c.locator('.slice_tab_button[data-tab-id="c"] .slice_tab_badge')).toBeHidden();
   });

   test('the old variant names still work and keep their classes', async ({ mount, page }) => {
      const c = await mount('Tabs', { items: ITEMS, variant: 'secondary' });
      await expect(c.component).toHaveAttribute('data-variant', 'segmented');
      await expect(c.locator('.slice_tabs_list')).toHaveClass(/variant-secondary/);
      await page.evaluate(() => { window.__sliceMounted.variant = 'pill'; });
      await expect(c.component).toHaveAttribute('data-variant', 'pill');
   });

   test('the indicator sits under the active tab and follows it', async ({ mount }) => {
      const c = await mount('Tabs', { items: ITEMS, variant: 'pill' });
      const box = async (sel) => c.locator(sel).boundingBox();
      await expect.poll(async () => Math.round((await box('.slice_tabs_indicator')).x)).toBe(Math.round((await box('.slice_tab_button[data-tab-id="one"]')).x));
      await c.locator('.slice_tab_button[data-tab-id="three"]').click();
      await expect.poll(async () => Math.round((await box('.slice_tabs_indicator')).x)).toBe(Math.round((await box('.slice_tab_button[data-tab-id="three"]')).x));
   });

   test('too many tabs: arrows appear and scroll the strip', async ({ mount, page }) => {
      await page.setViewportSize({ width: 480, height: 400 });
      const items = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, label: `Long tab ${i}` }));
      const c = await mount('Tabs', { items });
      await expect(c.locator('.slice_tabs_scroll--end')).toBeVisible();
      await expect(c.locator('.slice_tabs_scroll--start')).toBeHidden();
      await c.locator('.slice_tabs_scroll--end').click();
      await expect(c.locator('.slice_tabs_scroll--start')).toBeVisible();
   });

   test('destroying the tabs destroys their icons and panel contents', async ({ mount, page }) => {
      await mount('Tabs', { items: [] });
      const alive = await page.evaluate(async () => {
         const tabs = window.__sliceMounted;
         const inside = await slice.build('Button', { value: 'x' });
         tabs.items = [{ id: 'a', label: 'A', icon: 'home', panel: inside }, { id: 'b', label: 'B', icon: 'cog' }];
         await new Promise((r) => setTimeout(r, 150));
         const ids = [inside.sliceId, ...[...tabs.querySelectorAll('slice-icon')].map((i) => i.sliceId)];
         slice.controller.destroyComponent(tabs);
         return ids.filter((id) => slice.controller.activeComponents.has(id));
      });
      expect(alive).toEqual([]);
   });
});