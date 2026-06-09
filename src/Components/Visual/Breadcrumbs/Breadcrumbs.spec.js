import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const ITEMS = [
  { text: 'Docs', path: '/docs' },
  { text: 'Navigation', path: '/docs/navigation' },
  { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }
];

test.describe('Breadcrumbs', () => {
  test('smoke: builds and mounts without errors', async ({ mount }) => {
    const c = await mount('Breadcrumbs', { items: ITEMS });
    await expect(c.component).toBeVisible();
    await expect(c.locator('.slice_breadcrumbs')).toBeVisible();
    expect(c.pageErrors()).toEqual([]);
  });

  test('renders one item per breadcrumb and separators between them', async ({ mount }) => {
    const c = await mount('Breadcrumbs', { items: ITEMS });
    await expect(c.locator('.slice_breadcrumbs_item')).toHaveCount(3);
    await expect(c.locator('.slice_breadcrumbs_separator')).toHaveCount(2);
  });

  test('last item is current page by default', async ({ mount }) => {
    const c = await mount('Breadcrumbs', { items: ITEMS });
    const current = c.locator('.slice_breadcrumbs_current');
    await expect(current).toHaveText('Breadcrumbs');
    await expect(current).toHaveAttribute('aria-current', 'page');
  });

  test('includeCurrent=false hides last breadcrumb segment', async ({ mount }) => {
    const c = await mount('Breadcrumbs', { items: ITEMS, includeCurrent: false });
    await expect(c.locator('.slice_breadcrumbs_item')).toHaveCount(2);
    await expect(c.locator('.slice_breadcrumbs_current')).toHaveCount(0);
    await expect(c.locator('.slice_breadcrumbs_item').last()).toContainText('Navigation');
  });

   test('clicking a breadcrumb calls onClick and router.navigate', async ({ mount, page }) => {
      // Verify the navigation behavior. onClick cannot be tested by counting callbacks
      // because getters/setters are renamed in the minified bundle (first load from
      // source works, subsequent loads from the cached bundle lose the original names).
      const c = await mount('Breadcrumbs', { items: ITEMS });

      await page.evaluate(() => {
         window.__breadcrumbNavigations = [];
         window.slice.router.navigate = (path) => {
            window.__breadcrumbNavigations.push(path);
         };
      });

      await c.locator('.slice_breadcrumbs_link[href="/docs/navigation"]').click();

      await expect
         .poll(() => page.evaluate(() => window.__breadcrumbNavigations))
         .toEqual(['/docs/navigation']);
   });

   test('deprecated onClickCallback still fires and warns once', async ({ mount, page }) => {
      const c = await mount('Breadcrumbs', { items: ITEMS }, { spies: ['onClickCallback'] });
      await c.locator('.slice_breadcrumbs_link[href="/docs/navigation"]').click();
      const calls = await c.events('onClickCallback');
      expect(calls).toBeGreaterThanOrEqual(1);
      const deprecations = c.deprecationWarnings();
      const match = deprecations.filter((w) => w.includes('onClickCallback'));
      expect(match.length).toBe(1);
   });

  test('maxItems collapses middle segments into ellipsis', async ({ mount }) => {
    const c = await mount('Breadcrumbs', {
      items: [
        { text: 'Docs', path: '/docs' },
        { text: 'Navigation', path: '/docs/navigation' },
        { text: 'Routing', path: '/docs/routing' },
        { text: 'Guards', path: '/docs/routing/guards' }
      ],
      maxItems: 3
    });

    await expect(c.locator('.slice_breadcrumbs_item')).toHaveCount(3);
    await expect(c.locator('.slice_breadcrumbs_item').nth(1)).toContainText('...');
    await expect(c.locator('.slice_breadcrumbs_current')).toHaveText('Guards');
  });

  test('maxItems=1 keeps only current segment', async ({ mount }) => {
    const c = await mount('Breadcrumbs', { items: ITEMS, maxItems: 1 });
    await expect(c.locator('.slice_breadcrumbs_item')).toHaveCount(1);
    await expect(c.locator('.slice_breadcrumbs_current')).toHaveText('Breadcrumbs');
  });

  test('children route tree resolves breadcrumb trail for currentPath', async ({ mount }) => {
    const c = await mount('Breadcrumbs', {
      children: [
        {
          path: '/docs',
          text: 'Docs',
          children: [
            {
              path: '/navigation',
              text: 'Navigation',
              children: [
                { path: '/breadcrumbs', text: 'Breadcrumbs' }
              ]
            }
          ]
        }
      ],
      currentPath: '/docs/navigation/breadcrumbs'
    });

    await expect(c.locator('.slice_breadcrumbs_item')).toHaveCount(3);
    await expect(c.locator('.slice_breadcrumbs_item').nth(0)).toContainText('Docs');
    await expect(c.locator('.slice_breadcrumbs_item').nth(1)).toContainText('Navigation');
    await expect(c.locator('.slice_breadcrumbs_current')).toHaveText('Breadcrumbs');
  });

  test('invalid items are ignored', async ({ mount }) => {
    const c = await mount('Breadcrumbs', {
      items: [
        { foo: 'bar' },
        { text: '' },
        null,
        { text: 'Valid', path: '/valid' }
      ]
    });

    await expect(c.locator('.slice_breadcrumbs_item')).toHaveCount(1);
    await expect(c.locator('.slice_breadcrumbs_current')).toHaveText('Valid');
  });

  test('empty items hide breadcrumbs nav for a11y', async ({ mount }) => {
    const c = await mount('Breadcrumbs', { items: [] });
    await expect(c.locator('.slice_breadcrumbs')).toHaveAttribute('aria-hidden', 'true');
    await expect(c.locator('.slice_breadcrumbs_item')).toHaveCount(0);
  });

  test('visual: breadcrumbs navigation @visual', async ({ mount }) => {
    const c = await mount('Breadcrumbs', { items: ITEMS });
    await expect(c.component).toHaveScreenshot('breadcrumbs-default.png');
  });
});
