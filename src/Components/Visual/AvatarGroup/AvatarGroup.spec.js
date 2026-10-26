import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const PEOPLE = [
   { name: 'Ana López' }, { name: 'Luis Galué' }, { name: 'María Ruiz' },
   { name: 'José Pérez' }, { name: 'Sofía Rey' }, { name: 'Diego Fuentes' },
];

test.describe('AvatarGroup', () => {
   test('max faces, then +N, with one name for the whole group', async ({ mount }) => {
      const c = await mount('AvatarGroup', { items: PEOPLE, max: 4 });
      await expect(c.locator('slice-avatar')).toHaveCount(3);
      await expect(c.locator('.slice-avatar-group__more')).toHaveText('+3');
      await expect(c.component).toHaveAttribute('role', 'group');
      await expect(c.component).toHaveAttribute('aria-label', '6 people: Ana López, Luis Galué, María Ruiz and 3 more');
      await expect(c.locator('.slice-avatar-group__more')).toHaveAttribute('data-tooltip', 'José Pérez, Sofía Rey, Diego Fuentes');
   });

   test('exactly max people: every face, no +1', async ({ mount }) => {
      const c = await mount('AvatarGroup', { items: PEOPLE.slice(0, 4), max: 4 });
      await expect(c.locator('slice-avatar')).toHaveCount(4);
      await expect(c.locator('.slice-avatar-group__more')).toHaveCount(0);
   });

   test('faces show their name on hover but are not tab stops', async ({ mount, page }) => {
      const c = await mount('AvatarGroup', { items: PEOPLE.slice(0, 3) });
      const first = c.locator('slice-avatar').first();
      await expect(first).toHaveAttribute('data-tooltip', 'Ana López');
      await expect(first).toHaveAttribute('tabindex', '-1');
      await first.hover();
      await expect(page.locator('.slice-tooltip-bubble:popover-open')).toContainText('Ana López');
   });

   test('onMoreClick makes +N a button that gets the rest', async ({ mount }) => {
      const c = await mount('AvatarGroup', { items: PEOPLE, max: 3 });
      await c.component.evaluate((el) => { el.onMoreClick = ({ items }) => { el._rest = items.map((i) => i.name); }; });
      const more = c.locator('button.slice-avatar-group__more');
      await expect(more).toHaveAttribute('aria-label', '4 more');
      await more.click();
      expect(await c.component.evaluate((el) => el._rest)).toEqual(['María Ruiz', 'José Pérez', 'Sofía Rey', 'Diego Fuentes']);
   });

   test('new items replace the faces, and the old ones are destroyed', async ({ mount, page }) => {
      const c = await mount('AvatarGroup', { items: PEOPLE.slice(0, 2) });
      const ids = await c.component.evaluate((el) => [...el.querySelectorAll('slice-avatar')].map((n) => n.sliceId));
      await c.component.evaluate((el) => { el.items = [{ name: 'Nuevo' }]; });
      await expect(c.locator('slice-avatar')).toHaveCount(1);
      expect(await page.evaluate((all) => all.filter((id) => !!slice.controller.getComponent(id)), ids)).toEqual([]);
   });
});