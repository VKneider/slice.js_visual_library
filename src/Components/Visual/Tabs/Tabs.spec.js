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
});
