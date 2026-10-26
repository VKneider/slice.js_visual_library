import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// A tiny picture that always loads, and an address that never does.
const PHOTO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="teal"/></svg>');
const BROKEN = '/no/such/photo.png';

test.describe('Avatar', () => {
   test('smoke: the picture, named for screen readers', async ({ mount }) => {
      const c = await mount('Avatar', { src: PHOTO, name: 'Ana López' });
      expect(c.pageErrors()).toEqual([]);
      await expect(c.component).toHaveClass(/slice-avatar/);
      await expect(c.component).toHaveAttribute('role', 'img');
      await expect(c.component).toHaveAttribute('aria-label', 'Ana López');
      await expect(c.locator('.slice-avatar__image')).toBeVisible();
      await expect(c.component).toHaveAttribute('data-showing', 'image');
   });

   test('initials from the name: first and last word, any alphabet', async ({ mount }) => {
      const c = await mount('Avatar', { name: 'ana maría lópez' });
      await expect(c.locator('.slice-avatar__initials')).toHaveText('AL');
      await c.component.evaluate((el) => { el.name = 'Victor'; });
      await expect(c.locator('.slice-avatar__initials')).toHaveText('V');
      await c.component.evaluate((el) => { el.name = 'Ñandú Ölund'; });
      await expect(c.locator('.slice-avatar__initials')).toHaveText('ÑÖ');
   });

   test('a picture that fails to load falls back to the initials', async ({ mount }) => {
      const c = await mount('Avatar', { src: BROKEN, name: 'Luis Galué' });
      await expect(c.component).toHaveAttribute('data-showing', 'initials');
      await expect(c.locator('.slice-avatar__image')).toBeHidden();
      await expect(c.locator('.slice-avatar__initials')).toHaveText('LG');
   });

   test('no picture and no name: the icon', async ({ mount }) => {
      const c = await mount('Avatar', {});
      await expect(c.component).toHaveAttribute('data-showing', 'icon');
      await expect(c.locator('.slice-avatar__icon slice-icon')).toHaveCount(1);
      await expect(c.component).toHaveAttribute('aria-label', 'Unknown user');
   });

   test('the same name always gets the same colour; different names usually differ', async ({ mount }) => {
      const c = await mount('Avatar', { name: 'Ana López' });
      const hue = (name) => c.component.evaluate((el, n) => { el.name = n; return el.style.getPropertyValue('--slice-avatar-hue'); }, name);
      const a1 = await hue('Ana López');
      const b = await hue('Luis Galué');
      const a2 = await hue('Ana López');
      expect(a1).toBe(a2);
      expect(a1).not.toBe(b);
   });

   test('status: a dot with its name in the label', async ({ mount }) => {
      const c = await mount('Avatar', { name: 'Ana', status: 'online' });
      await expect(c.locator('.slice-avatar__status')).toHaveAttribute('data-status', 'online');
      await expect(c.component).toHaveAttribute('aria-label', 'Ana, Online');
      await c.component.evaluate((el) => { el.status = ''; });
      await expect(c.locator('.slice-avatar__status')).toBeHidden();
   });

   test('badge: a count on the corner', async ({ mount }) => {
      const c = await mount('Avatar', { name: 'Ana', badge: 3 });
      await expect(c.locator('.slice-avatar__badge slice-badge')).toHaveText('3');
      await c.component.evaluate((el) => { el.badge = null; });
      await expect(c.locator('.slice-avatar__badge')).toBeHidden();
   });

   test('size: names and pixels; shape', async ({ mount }) => {
      const c = await mount('Avatar', { name: 'Ana', size: 'lg', shape: 'rounded' });
      expect(await c.component.evaluate((el) => el.getBoundingClientRect().width)).toBe(56);
      await expect(c.component).toHaveAttribute('data-shape', 'rounded');
      await c.component.evaluate((el) => { el.size = 72; });
      expect(await c.component.evaluate((el) => el.getBoundingClientRect().width)).toBe(72);
   });

   test('onClick makes it a button the keyboard can use', async ({ mount, page }) => {
      const c = await mount('Avatar', { name: 'Ana' }, { spies: ['onClick'] });
      await c.component.evaluate((el) => { el.onClick = () => { el._clicked = (el._clicked || 0) + 1; }; });
      await expect(c.component).toHaveAttribute('role', 'button');
      await expect(c.component).toHaveAttribute('tabindex', '0');
      await c.component.focus();
      await page.keyboard.press('Enter');
      await c.component.click();
      expect(await c.component.evaluate((el) => el._clicked)).toBe(2);
   });

   test('destroying it destroys its icon and badge', async ({ mount, page }) => {
      const c = await mount('Avatar', { badge: 5 });
      await expect(c.locator('slice-icon')).toHaveCount(1);
      await expect(c.locator('slice-badge')).toHaveCount(1);
      const ids = await c.component.evaluate((el) => [...el.querySelectorAll('[slice-id]')].map((n) => n.getAttribute('slice-id')));
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      expect(await page.evaluate((all) => all.filter((id) => !!slice.controller.getComponent(id)), ids)).toEqual([]);
   });
});