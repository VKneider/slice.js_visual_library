import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Link renders a single <a> via DOM APIs (no template). Props: { path, classes, text }.
// Click is intercepted (event.preventDefault) and delegated to slice.router.navigate,
// so the anchor href stays in the DOM but no real navigation happens.

test.describe('Link', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Link', { text: 'Home', path: '/home' });
      await expect(c.component).toBeVisible();
      await expect(c.locator('a')).toBeVisible();
      expect(c.pageErrors()).toEqual([]);
   });

   test('text reflects to the anchor text content', async ({ mount }) => {
      const c = await mount('Link', { text: 'Documentation', path: '/docs' });
      await expect(c.locator('a')).toHaveText('Documentation');
   });

   test('path reflects to the anchor href and data-route is set', async ({ mount }) => {
      const c = await mount('Link', { text: 'Docs', path: '/docs' });
      await expect(c.locator('a')).toHaveAttribute('href', '/docs');
      await expect(c.locator('a')).toHaveAttribute('data-route', '');
   });

   test('classes prop is applied to the anchor', async ({ mount }) => {
      const c = await mount('Link', { text: 'X', path: '/x', classes: 'item nav-link' });
      await expect(c.locator('a')).toHaveClass('item nav-link');
   });

   test('defaults: missing path falls back to "#" and empty text', async ({ mount }) => {
      const c = await mount('Link');
      await expect(c.locator('a')).toHaveAttribute('href', '#');
      await expect(c.locator('a')).toHaveText('');
   });

   test('click is intercepted (preventDefault) without throwing', async ({ mount }) => {
      const c = await mount('Link', { text: 'Go', path: '/somewhere' });
      // onClick calls event.preventDefault() then slice.router.navigate(path).
      // We assert it does not error and the anchor remains in place.
      await c.locator('a').click();
      await expect(c.locator('a')).toHaveAttribute('href', '/somewhere');
      expect(c.pageErrors()).toEqual([]);
   });

   test('visual: rendered link @visual', async ({ mount }) => {
      const c = await mount('Link', { text: 'Home', path: '/home', classes: 'item' });
      await expect(c.component).toHaveScreenshot('link-default.png');
   });

   test('icon renders a decorative Icon inside .slice-link-icon', async ({ mount }) => {
      const c = await mount('Link', {
         text: 'Docs',
         path: '/docs',
         icon: 'check',
         iconColor: 'rgb(9, 9, 9)',
      });
      const holder = c.locator('.slice-link-icon');
      await expect(holder).toHaveAttribute('aria-hidden', 'true');
      await expect(holder.locator('slice-icon')).toBeAttached();
      const color = await holder.locator('slice-icon').evaluate((el) =>
         getComputedStyle(el).color
      );
      expect(color).toBe('rgb(9, 9, 9)');
   });

   test('sub stacks a title and a subtitle under the label', async ({ mount }) => {
      const c = await mount('Link', { text: 'Components', path: '/c', sub: '42 items' });
      await expect(c.locator('.slice-link-title')).toHaveText('Components');
      await expect(c.locator('.slice-link-sub')).toHaveText('42 items');
      // Without `sub` the text stays a plain text node.
      const plain = await mount('Link', { text: 'Components', path: '/c' });
      await expect(plain.locator('.slice-link-title')).toHaveCount(0);
   });

   test('the anchor is a flex row with a gap so icon and label do not collide', async ({ mount }) => {
      const c = await mount('Link', { text: 'Docs', path: '/docs', icon: 'check' });
      const box = await c.locator('a').evaluate((el) => {
         const cs = getComputedStyle(el);
         return { display: cs.display, gap: cs.columnGap, decoration: cs.textDecorationLine, color: cs.color };
      });
      expect(box.display).toBe('inline-flex');
      expect(parseFloat(box.gap)).toBeGreaterThan(0);
      expect(box.decoration).toBe('none');
   });

   test('text is never injected as markup', async ({ mount }) => {
      const c = await mount('Link', { text: '<img src=x onerror=alert(1)>', path: '/x' });
      // A text node, so the markup shows as literal text and no <img> exists.
      await expect(c.locator('a img')).toHaveCount(0);
      await expect(c.locator('a')).toHaveText('<img src=x onerror=alert(1)>');
   });
   test('a #section in the path: the router gets the page, then the section is scrolled to', async ({ mountHtml }) => {
      const h = await mountHtml('<div style="height:3000px"></div><h2 id="far-section">Far</h2><div style="height:3000px"></div>');
      const out = await h.page.evaluate(async () => {
         const calls = [];
         const original = slice.router.navigate;
         slice.router.navigate = async (path) => { calls.push(path); };
         const link = await slice.build('Link', { text: 'Far', path: '/docs/page#far-section' });
         const here = await slice.build('Link', { text: 'Here', path: '#far-section' });
         document.body.prepend(link, here);
         try {
            link.querySelector('a').click();
            await new Promise((r) => setTimeout(r, 100));
            const top = Math.round(document.getElementById('far-section').getBoundingClientRect().top);
            window.scrollTo(0, 0);
            here.querySelector('a').click();
            await new Promise((r) => setTimeout(r, 100));
            return { calls, top, hereTop: Math.round(document.getElementById('far-section').getBoundingClientRect().top) };
         } finally {
            slice.router.navigate = original;
            slice.controller.destroyComponent(link);
            slice.controller.destroyComponent(here);
         }
      });
      expect(out.calls).toEqual(['/docs/page']);   // '#far-section' alone does not navigate
      expect(out.top).toBeLessThan(50);
      expect(out.hereTop).toBeLessThan(50);
   });

   test('a malformed #hash does not throw', async ({ mountHtml }) => {
      const h = await mountHtml('<div style="height:2000px"></div>');
      const errors = [];
      h.page.on('pageerror', (error) => errors.push(error.message));
      await h.page.evaluate(async () => {
         const link = await slice.build('Link', { text: 'Odd', path: '#100%' });
         document.body.prepend(link);
         try {
            link.querySelector('a').click();
            await new Promise((r) => setTimeout(r, 120));
         } finally {
            slice.controller.destroyComponent(link);
         }
      });
      expect(errors).toEqual([]);
   });
});
