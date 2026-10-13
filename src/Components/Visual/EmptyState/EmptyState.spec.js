import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('EmptyState', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('EmptyState', { title: 'Nothing here', description: 'Add your first item.' });
      await expect(c.locator('.slice_empty_state__title')).toHaveText('Nothing here');
      await expect(c.locator('.slice_empty_state__description')).toHaveText('Add your first item.');
      expect(c.pageErrors()).toEqual([]);
   });

   test('renders the icon as a child Icon component', async ({ mount }) => {
      const c = await mount('EmptyState', { title: 'Empty', icon: 'inbox-full' });
      await expect(c.locator('[data-el="icon"] slice-icon')).toBeAttached();
      await expect(c.component.locator('[data-el="icon"]')).toHaveAttribute('aria-hidden', 'true');
   });

   test('an empty icon name renders no glyph at all', async ({ mount }) => {
      const c = await mount('EmptyState', { title: 'Empty', icon: '' });
      await expect(c.locator('[data-el="icon"] slice-icon')).toHaveCount(0);
   });

   test('title and description hide themselves when empty', async ({ mount }) => {
      const c = await mount('EmptyState', {});
      await expect(c.locator('.slice_empty_state__title')).toBeHidden();
      await expect(c.locator('.slice_empty_state__description')).toBeHidden();
   });

   test('buttonLabel builds a real Button that fires its handler', async ({ mount }) => {
      const c = await mount('EmptyState', {
         title: 'No projects',
         buttonLabel: 'New project',
      }, { spies: ['buttonOnClick'] });

      const btn = c.locator('[data-el="action"] slice-button');
      await expect(btn).toBeAttached();
      await expect(btn.locator('.slice_button_value')).toHaveText('New project');
      await btn.locator('.slice_button_container').click();
      await expect.poll(() => c.events('buttonOnClick')).toBe(1);
   });

   test('rebuilding the action destroys the previous Button', async ({ mount }) => {
      const c = await mount('EmptyState', { buttonLabel: 'First' }, { spies: ['buttonOnClick'] });
      await expect(c.locator('[data-el="action"] slice-button')).toHaveCount(1);

      await c.component.evaluate((el) => { el.buttonLabel = 'Second'; });
      await expect(c.locator('[data-el="action"] slice-button')).toHaveCount(1);
      await expect(c.locator('.slice_button_value')).toHaveText('Second');
   });

   test('clearing buttonLabel removes the action entirely', async ({ mount }) => {
      const c = await mount('EmptyState', { buttonLabel: 'Go' }, { spies: ['buttonOnClick'] });
      await expect(c.locator('[data-el="action"] slice-button')).toHaveCount(1);
      await c.component.evaluate((el) => { el.buttonLabel = ''; });
      await expect(c.locator('[data-el="action"] slice-button')).toHaveCount(0);
   });

   test('buttonRoute navigates through the router', async ({ mount }) => {
      const c = await mount('EmptyState', { buttonLabel: 'Docs', buttonRoute: '/docs' });
      // Spy on the router from inside the page: the harness URL is /__test, so
      // the real navigation target is easier to assert directly.
      await c.component.evaluate((el) => {
         window.__navigated = [];
         const original = slice.router.navigate.bind(slice.router);
         slice.router.navigate = (path, ...rest) => {
            window.__navigated.push(path);
            return original(path, ...rest);
         };
      });
      await c.locator('[data-el="action"] .slice_button_container').click();
      await expect.poll(() => c.root.page().evaluate(() => window.__navigated || [])).toEqual(['/docs']);
   });

   test('buttonOnClick wins over buttonRoute', async ({ mount }) => {
      const c = await mount('EmptyState', {
         buttonLabel: 'Both',
         buttonRoute: '/docs',
      }, { spies: ['buttonOnClick'] });

      await c.component.evaluate((el) => {
         window.__navigated = [];
         const original = slice.router.navigate.bind(slice.router);
         slice.router.navigate = (path, ...rest) => {
            window.__navigated.push(path);
            return original(path, ...rest);
         };
      });
      await c.locator('[data-el="action"] .slice_button_container').click();
      await expect.poll(() => c.events('buttonOnClick')).toBe(1);
      expect(await c.root.page().evaluate(() => window.__navigated || [])).toEqual([]);
   });

   test('text is never injected as markup', async ({ mount }) => {
      const c = await mount('EmptyState', { title: '<img src=x onerror=alert(1)>' });
      await expect(c.locator('.slice_empty_state__title img')).toHaveCount(0);
      await expect(c.locator('.slice_empty_state__title')).toHaveText('<img src=x onerror=alert(1)>');
   });

   test('visual: empty state with an action @visual', async ({ mount }) => {
      const c = await mount('EmptyState', {
         icon: 'inbox-full',
         title: 'No messages yet',
         description: 'Replies to your team will show up here.',
         buttonLabel: 'Invite a teammate',
      }, { spies: ['buttonOnClick'] });
      await expect(c.component).toHaveScreenshot('emptystate-default.png');
   });
});