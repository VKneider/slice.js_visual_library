import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const ITEMS = [
   { id: 'shipping', title: 'Shipping', subtitle: '2–4 days', text: 'We ship from Maracaibo.' },
   { id: 'returns', title: 'Returns', text: '30 days to change your mind.' },
   { id: 'warranty', title: 'Warranty', text: 'One year.', disabled: true },
   { id: 'payment', title: 'Payment', text: 'Cards and transfers.' },
];

const item = (c, title) => c.locator(`.slice-details__item:has(.slice-details__title:text-is("${title}"))`);
const summary = (c, title) => item(c, title).locator('summary').first();

test.describe('Details — one section', () => {
   test('smoke: a native <details> with title, subtitle and text, closed', async ({ mount }) => {
      const c = await mount('Details', { title: 'What is included?', subtitle: 'Plan details', text: 'Source code, tests and docs.' });
      expect(c.pageErrors()).toEqual([]);
      await expect(c.locator('details.slice-details__item')).toHaveCount(1);
      await expect(c.locator('.slice-details__title')).toHaveText('What is included?');
      await expect(c.locator('.slice-details__subtitle')).toHaveText('Plan details');
      await expect(c.locator('details')).not.toHaveAttribute('open');
      await expect(c.locator('.slice-details__body')).toBeHidden();
   });

   test('a click opens it, a second closes it, and onToggle reports both', async ({ mount }) => {
      const c = await mount('Details', { title: 'T', text: 'Body text' }, { spies: ['onToggle'] });
      await c.locator('summary').click();
      await expect(c.locator('details')).toHaveAttribute('open');
      await expect(c.locator('.slice-details__text')).toHaveText('Body text');
      await expect(c.locator('.slice-details__text')).toBeVisible();
      expect(await c.component.evaluate((d) => d.open)).toBe(true);
      await c.locator('summary').click();
      await expect(c.locator('details')).not.toHaveAttribute('open');
      expect((await c.eventArgs('onToggle')).map((a) => a[0])).toEqual([true, false]);
   });

   test('Enter and Space on the summary toggle it', async ({ mount }) => {
      const c = await mount('Details', { title: 'T', text: 'Body' });
      await c.locator('summary').focus();
      await c.locator('summary').press('Enter');
      await expect(c.locator('details')).toHaveAttribute('open');
      await c.locator('summary').press(' ');
      await expect(c.locator('details')).not.toHaveAttribute('open');
   });

   test('open: true starts it open, and open from code toggles it', async ({ mount }) => {
      const c = await mount('Details', { title: 'T', text: 'Body', open: true });
      await expect(c.locator('details')).toHaveAttribute('open');
      await c.component.evaluate((d) => { d.open = false; });
      await expect(c.locator('details')).not.toHaveAttribute('open');
   });

   test('content takes nodes, and addDetail still appends', async ({ mount }) => {
      const c = await mount('Details', { title: 'Checklist', open: true });
      await c.component.evaluate((d) => {
         const ul = document.createElement('ul');
         ul.className = 'steps';
         ul.innerHTML = '<li>Run tests</li><li>Ship</li>';
         d.content = ul;
         const extra = document.createElement('p');
         extra.className = 'extra';
         extra.textContent = 'Added later';
         d.addDetail(extra);
      });
      await expect(c.locator('.slice-details__inner .steps li')).toHaveCount(2);
      await expect(c.locator('.slice-details__inner .extra')).toHaveText('Added later');
   });

   test('function content runs on first open only, with a shimmer meanwhile', async ({ mount }) => {
      const c = await mount('Details', { title: 'Lazy' });
      await c.component.evaluate((d) => {
         d.dataset.runs = '0';
         d.content = async () => {
            d.dataset.runs = String(Number(d.dataset.runs) + 1);
            await new Promise((r) => setTimeout(r, 300));
            return 'Loaded';
         };
      });
      await expect(c.component).toHaveAttribute('data-runs', '0');
      await c.locator('summary').click();
      await expect(c.locator('.slice-details__shimmer')).toBeVisible();
      await expect(c.locator('.slice-details__text')).toHaveText('Loaded');
      await c.locator('summary').click();
      await c.locator('summary').click();
      await expect(c.locator('.slice-details__text')).toHaveText('Loaded');
      await expect(c.component).toHaveAttribute('data-runs', '1');
   });

   test('a disabled section does not open', async ({ mount }) => {
      const c = await mount('Details', { title: 'Off', text: 'Body', disabled: true });
      await expect(c.locator('summary')).toHaveAttribute('aria-disabled', 'true');
      await c.locator('summary').click();
      await expect(c.locator('details')).not.toHaveAttribute('open');
   });

   test('standalone sections with the same name close each other', async ({ mount, page }) => {
      await mount('Details', { title: 'A', text: 'a', name: 'faq' });
      await page.evaluate(async () => {
         const root = document.querySelector('[data-test-root]');
         root.appendChild(await slice.build('Details', { title: 'B', text: 'b', name: 'faq' }));
         root.appendChild(await slice.build('Details', { title: 'C', text: 'c', name: 'other' }));
      });
      const a = page.locator('slice-details').filter({ hasText: 'A' }).locator('details');
      const b = page.locator('slice-details').filter({ hasText: 'B' }).locator('details');
      const other = page.locator('slice-details').filter({ hasText: 'C' }).locator('details');
      await a.locator('summary').click();
      await other.locator('summary').click();
      await b.locator('summary').click();
      await expect(b).toHaveAttribute('open');
      await expect(a).not.toHaveAttribute('open');
      await expect(other).toHaveAttribute('open');
   });

   test('find-in-page style: opening the element natively is followed', async ({ mount }) => {
      const c = await mount('Details', { title: 'Hidden', text: 'Needle' }, { spies: ['onToggle'] });
      await c.locator('details').evaluate((el) => { el.open = true; });
      await expect(c.locator('.slice-details__text')).toHaveText('Needle');
      await expect.poll(() => c.component.evaluate((d) => d.open)).toBe(true);
      expect((await c.eventArgs('onToggle'))[0][0]).toBe(true);
   });
});

test.describe('Details — accordion', () => {
   test('items render one section each, in order', async ({ mount }) => {
      const c = await mount('Details', { items: ITEMS });
      await expect(c.locator('.slice-details__title')).toHaveText(['Shipping', 'Returns', 'Warranty', 'Payment']);
      await expect(c.component).toHaveClass(/slice-details--group/);
   });

   test('one open at a time by default', async ({ mount }) => {
      const c = await mount('Details', { items: ITEMS }, { spies: ['onToggle'] });
      await summary(c, 'Shipping').click();
      await summary(c, 'Returns').click();
      await expect(item(c, 'Returns')).toHaveAttribute('open');
      await expect(item(c, 'Shipping')).not.toHaveAttribute('open');
      expect(await c.component.evaluate((d) => d.openIds)).toEqual(['returns']);
      const args = await c.eventArgs('onToggle');
      expect(args.map((a) => [a[0], a[1]])).toEqual([['shipping', true], ['shipping', false], ['returns', true]]);
   });

   test('multiple keeps several open; showAll and hideAll', async ({ mount }) => {
      const c = await mount('Details', { items: ITEMS, multiple: true });
      await summary(c, 'Shipping').click();
      await summary(c, 'Returns').click();
      expect(await c.component.evaluate((d) => d.openIds)).toEqual(['shipping', 'returns']);
      await c.component.evaluate((d) => d.showAll());
      expect(await c.component.evaluate((d) => d.openIds)).toEqual(['shipping', 'returns', 'warranty', 'payment']);
      await c.component.evaluate((d) => d.hideAll());
      expect(await c.component.evaluate((d) => d.openIds)).toEqual([]);
   });

   test('only the first of several items marked open starts open, unless multiple', async ({ mount }) => {
      const c = await mount('Details', { items: ITEMS.map((i) => ({ ...i, open: true })) });
      expect(await c.component.evaluate((d) => d.openIds)).toEqual(['shipping']);
   });

   test('collapsible: false always keeps one open', async ({ mount }) => {
      const c = await mount('Details', { items: ITEMS, collapsible: false });
      expect(await c.component.evaluate((d) => d.openIds)).toEqual(['shipping']);
      await summary(c, 'Shipping').click();
      await expect(item(c, 'Shipping')).toHaveAttribute('open');
      await summary(c, 'Payment').click();
      expect(await c.component.evaluate((d) => d.openIds)).toEqual(['payment']);
   });

   test('arrow keys, Home and End move between summaries, skipping disabled ones', async ({ mount, page }) => {
      const c = await mount('Details', { items: ITEMS });
      await summary(c, 'Returns').focus();
      await page.keyboard.press('ArrowDown');
      await expect(summary(c, 'Payment')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(summary(c, 'Shipping')).toBeFocused();
      await page.keyboard.press('End');
      await expect(summary(c, 'Payment')).toBeFocused();
      await page.keyboard.press('Home');
      await expect(summary(c, 'Shipping')).toBeFocused();
      await page.keyboard.press('ArrowUp');
      await expect(summary(c, 'Payment')).toBeFocused();
   });

   test('show, hide and toggle by id', async ({ mount }) => {
      const c = await mount('Details', { items: ITEMS });
      await c.component.evaluate((d) => d.show('payment'));
      await expect(item(c, 'Payment')).toHaveAttribute('open');
      await c.component.evaluate((d) => d.toggle('payment'));
      await expect(item(c, 'Payment')).not.toHaveAttribute('open');
   });

   test('stateKey remembers what was open across a rebuild', async ({ mount, page }) => {
      await page.evaluate(() => localStorage.removeItem('slice-details:faq-test'));
      const c = await mount('Details', { items: ITEMS, stateKey: 'faq-test' });
      await summary(c, 'Payment').click();
      await expect(item(c, 'Payment')).toHaveAttribute('open');
      const c2 = await mount('Details', { items: ITEMS, stateKey: 'faq-test' });
      expect(await c2.component.evaluate((d) => d.openIds)).toEqual(['payment']);
      await page.evaluate(() => localStorage.removeItem('slice-details:faq-test'));
   });

   test('setting items again keeps a section whose content did not change', async ({ mount }) => {
      const c = await mount('Details', { items: ITEMS });
      await summary(c, 'Shipping').click();
      await c.component.evaluate((d) => {
         d.querySelector('details').dataset.mark = 'kept';
         d.items = [...d.items.slice(0, 2), { id: 'new', title: 'New', text: 'Fresh' }];
      });
      await expect(c.locator('.slice-details__title')).toHaveText(['Shipping', 'Returns', 'New']);
      await expect(item(c, 'Shipping')).toHaveAttribute('data-mark', 'kept');
      await expect(item(c, 'Shipping')).toHaveAttribute('open');
   });

   test('icons and badges are components, destroyed with the Details', async ({ mount, page }) => {
      const c = await mount('Details', {
         items: [{ id: 'a', title: 'A', icon: 'truck', badge: 'Free' }, { id: 'b', title: 'B', icon: 'clock', badge: { label: '3', variant: 'danger' } }],
      });
      await expect(c.locator('.slice-details__icon slice-icon svg')).toHaveCount(2);
      await expect(c.locator('.slice-details__badge slice-badge')).toHaveText(['Free', '3']);
      const ids = await c.component.evaluate((d) => [...d.querySelectorAll('slice-icon, slice-badge')].map((n) => n.sliceId));
      await c.component.evaluate((d) => slice.controller.destroyComponent(d));
      expect(await page.evaluate((ids) => ids.filter((id) => slice.controller.getComponent(id)), ids)).toEqual([]);
   });

   test('content components are destroyed when their section goes', async ({ mount, page }) => {
      const c = await mount('Details', { items: [{ id: 'a', title: 'A', open: true }] });
      const id = await c.component.evaluate(async (d) => {
         const button = await slice.build('Button', { value: 'Inside' });
         d.items = [{ id: 'a', title: 'A', content: button, open: true }];
         await new Promise((r) => setTimeout(r, 50));
         return button.sliceId;
      });
      await expect(c.locator('.slice-details__inner slice-button')).toHaveCount(1);
      await c.component.evaluate((d) => { d.items = [{ id: 'b', title: 'B' }]; });
      await expect.poll(() => page.evaluate((id) => !!slice.controller.getComponent(id), id)).toBe(false);
   });
});

test.describe('Details — looks', () => {
   test('variant, size and marker', async ({ mount }) => {
      const c = await mount('Details', { items: ITEMS, variant: 'separated', size: 'lg', marker: 'plus' });
      await expect(c.component).toHaveClass(/slice-details--separated/);
      await expect(c.component).toHaveAttribute('data-size', 'lg');
      await expect(c.component).toHaveAttribute('data-marker', 'plus');
      await c.component.evaluate((d) => { d.variant = 'nope'; });
      await expect(c.component).toHaveClass(/slice-details--outlined/);
   });

   test('visual: a closed section @visual', async ({ mount }) => {
      const c = await mount('Details', { title: 'More information', text: 'Body' });
      await expect(c.component).toHaveScreenshot('details-closed.png');
   });
});