import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('Chip', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Chip', { label: 'Vue' });
      await expect(c.locator('.slice_chip')).toBeVisible();
      await expect(c.locator('.slice_chip__label')).toHaveText('Vue');
      expect(c.pageErrors()).toEqual([]);
   });

   test('no remove affordance unless removable is set', async ({ mount }) => {
      const plain = await mount('Chip', { label: 'Plain' });
      await expect(plain.locator('.slice_chip__remove')).toBeHidden();

      const c = await mount('Chip', { label: 'Removable', removable: true });
      await expect(c.locator('.slice_chip__remove')).toBeVisible();
   });

   test('the remove affordance is a real button labelled for this chip', async ({ mount }) => {
      const c = await mount('Chip', { label: 'Vue', removable: true });
      const btn = c.locator('.slice_chip__remove');
      await expect(btn).toHaveAttribute('type', 'button');
      await expect(btn).toHaveAttribute('aria-label', 'Remove: Vue');
   });

   test('onRemove fires with the label', async ({ mount }) => {
      const c = await mount('Chip', { label: 'Vue', removable: true }, { spies: ['onRemove'] });
      await c.locator('.slice_chip__remove').click();
      await expect.poll(() => c.events('onRemove')).toBe(1);
      const args = await c.eventArgs('onRemove');
      expect(args[0]).toEqual(['Vue']);
   });

   test('a disabled chip ignores the remove click', async ({ mount }) => {
      const c = await mount('Chip', { label: 'Vue', removable: true, disabled: true }, { spies: ['onRemove'] });
      await expect(c.locator('.slice_chip')).toHaveClass(/is-disabled/);
      await c.locator('.slice_chip__remove').click({ force: true });
      expect(await c.events('onRemove')).toBe(0);
   });

   test('variant and size swap their modifier classes', async ({ mount }) => {
      const c = await mount('Chip', { label: 'X', variant: 'warning', size: 'sm' });
      await expect(c.locator('.slice_chip')).toHaveClass(/slice_chip--warning/);
      await expect(c.locator('.slice_chip')).toHaveClass(/slice_chip--sm/);

      await c.component.evaluate((el) => { el.variant = 'danger'; el.size = 'md'; });
      const cls = await c.locator('.slice_chip').getAttribute('class');
      expect(cls).toContain('slice_chip--danger');
      expect(cls).not.toContain('slice_chip--warning');
      expect(cls).toContain('slice_chip--md');
      expect(cls).not.toContain('slice_chip--sm/');
      // Only one variant modifier at a time.
      expect(cls.match(/slice_chip--(neutral|accent|success|warning|danger)/g)).toHaveLength(1);
   });

   test('an optional icon is built as a child component', async ({ mount }) => {
      const c = await mount('Chip', { label: 'Vue', icon: 'star' });
      await expect(c.locator('[data-el="icon"] slice-icon')).toBeAttached();
   });

   test('the label is escaped, never injected', async ({ mount }) => {
      const c = await mount('Chip', { label: '<img src=x onerror=alert(1)>' });
      await expect(c.locator('.slice_chip img')).toHaveCount(0);
      await expect(c.locator('.slice_chip__label')).toHaveText('<img src=x onerror=alert(1)>');
   });

   test('visual: chip with a remove affordance @visual', async ({ mount }) => {
      const c = await mount('Chip', { label: 'Vue', icon: 'star', variant: 'accent', removable: true });
      await expect(c.component).toHaveScreenshot('chip-removable.png');
   });
});