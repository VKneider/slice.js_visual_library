import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const ICON_SVG = 'slice-icon svg';

test.describe('Card — content', () => {
   test('smoke: title, subtitle and text, with nothing else drawn', async ({ mount }) => {
      const c = await mount('Card', { title: 'Build pipeline', subtitle: 'main · 2 min ago', text: 'All checks passed.' });
      expect(c.pageErrors()).toEqual([]);
      await expect(c.locator('.slice-card__title')).toHaveText('Build pipeline');
      await expect(c.locator('.slice-card__title')).toHaveAttribute('role', 'heading');
      await expect(c.locator('.slice-card__title')).toHaveAttribute('aria-level', '3');
      await expect(c.locator('.slice-card__subtitle')).toHaveText('main · 2 min ago');
      await expect(c.locator('.slice-card__text')).toHaveText('All checks passed.');
      await expect(c.locator('.slice-card__media')).toBeHidden();
      await expect(c.locator('.slice-card__footer')).toBeHidden();
      await expect(c.locator('.slice-card__badge')).toBeHidden();
   });

   test('a card that leads nowhere is not a button', async ({ mount }) => {
      const c = await mount('Card', { title: 'Static' });
      await expect(c.component).not.toHaveAttribute('role', 'button');
      await expect(c.component).not.toHaveAttribute('tabindex');
      await expect(c.locator('.slice-card__target')).toHaveCount(0);
   });

   test('headingLevel sets the title level', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', headingLevel: 2 });
      await expect(c.locator('.slice-card__title')).toHaveAttribute('aria-level', '2');
   });

   test('content takes nodes and text, and keeps a node it already holds', async ({ mount }) => {
      const c = await mount('Card', { title: 'Stats' });
      await c.component.evaluate((card) => {
         const stat = document.createElement('div');
         stat.className = 'stat';
         stat.textContent = '42 ms';
         card.content = [stat, 'p95 latency'];
      });
      await expect(c.locator('.slice-card__content .stat')).toHaveText('42 ms');
      await expect(c.locator('.slice-card__content .slice-card__paragraph')).toHaveText('p95 latency');
      const kept = await c.component.evaluate((card) => {
         const stat = card.content[0];
         stat.dataset.mark = 'kept';
         card.content = [stat];
         return card.querySelector('.stat').dataset.mark;
      });
      expect(kept).toBe('kept');
      await expect(c.locator('.slice-card__paragraph')).toHaveCount(0);
   });

   test('content components are destroyed when replaced', async ({ mount, page }) => {
      const c = await mount('Card', { title: 'Holder' });
      const id = await c.component.evaluate(async (card) => {
         const button = await slice.build('Button', { value: 'Inner' });
         card.content = button;
         return button.sliceId;
      });
      expect(await page.evaluate((id) => !!slice.controller.getComponent(id), id)).toBe(true);
      await c.component.evaluate((card) => { card.content = 'Nothing now'; });
      expect(await page.evaluate((id) => !!slice.controller.getComponent(id), id)).toBe(false);
   });
});

test.describe('Card — media, marks and badge', () => {
   test('icon is the banner, headerIcon the mark beside the title', async ({ mount }) => {
      const c = await mount('Card', { title: 'Analytics', icon: 'chart-pie', headerIcon: 'user' });
      await expect(c.locator('.slice-card__media')).toBeVisible();
      await expect(c.locator(`.slice-card__media ${ICON_SVG}`)).toHaveCount(1);
      await expect(c.locator('.slice-card__mark')).toBeVisible();
      await expect(c.locator(`.slice-card__mark ${ICON_SVG}`)).toHaveCount(1);
   });

   test('legacy { name, iconStyle } icons still render, without a warning', async ({ mount }) => {
      const c = await mount('Card', { title: 'Legacy', icon: { name: 'rocket', iconStyle: 'filled' } });
      await expect(c.locator(`.slice-card__media ${ICON_SVG}`)).toHaveCount(1);
      expect(c.warnings().filter((w) => w.includes('iconStyle'))).toEqual([]);
   });

   test('an image is lazy, takes imageAlt, and falls back to the icon when it fails', async ({ mount }) => {
      const c = await mount('Card', { title: 'Cabin', image: '/missing-image.jpg', imageAlt: 'A wooden cabin', icon: 'home' });
      await expect(c.locator(`.slice-card__media ${ICON_SVG}`)).toHaveCount(1);
      await expect(c.locator('.slice-card__image')).toHaveCount(0);
      const c2 = await mount('Card', { title: 'Cabin', image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', imageAlt: 'A wooden cabin' });
      await expect(c2.locator('.slice-card__image')).toHaveAttribute('alt', 'A wooden cabin');
      await expect(c2.locator('.slice-card__image')).toHaveAttribute('loading', 'lazy');
   });

   test('badge: text, a number, or a Badge config — shown with or without media', async ({ mount }) => {
      const c = await mount('Card', { title: 'Pipeline', badge: 'Healthy' });
      await expect(c.locator('.slice-card__badge slice-badge')).toHaveText('Healthy');
      await c.component.evaluate((card) => { card.badge = 120; });
      await expect(c.locator('.slice-card__badge slice-badge')).toHaveText('99+');
      await c.component.evaluate((card) => { card.badge = { label: 'Blocked', variant: 'danger' }; });
      await expect(c.locator('.slice-card__badge slice-badge')).toHaveText('Blocked');
      expect(await c.locator('.slice-card__badge slice-badge').count()).toBe(1);
      await c.component.evaluate((card) => { card.badge = null; });
      await expect(c.locator('.slice-card__badge')).toBeHidden();
   });
});

test.describe('Card — leading somewhere', () => {
   test('onClick: the title is the button, and a click anywhere on the card fires it', async ({ mount }) => {
      const c = await mount('Card', { title: 'Open me', text: 'Body text' }, { spies: ['onClick'] });
      const target = c.locator('button.slice-card__target');
      await expect(target).toHaveText('Open me');
      // The title's hit area covers the card, so the click lands on it.
      await c.locator('.slice-card__text').click({ force: true });
      expect(await c.events('onClick')).toBe(1);
      await target.focus();
      await target.press('Enter');
      expect(await c.events('onClick')).toBe(2);
      await expect(c.component).toHaveClass(/is-clickable/);
   });

   test('onClick set after the card is built still works', async ({ mount }) => {
      const c = await mount('Card', { title: 'Late' });
      await c.component.evaluate((card) => {
         card.dataset.clicks = '0';
         card.onClick = () => { card.dataset.clicks = String(Number(card.dataset.clicks) + 1); };
      });
      await c.locator('.slice-card__title').click();
      await expect(c.component).toHaveAttribute('data-clicks', '1');
   });

   test('actions sit in the footer and do not fire the card', async ({ mount }) => {
      const c = await mount('Card', { title: 'Cabin' }, { spies: ['onClick'] });
      await c.component.evaluate((card) => {
         card.dataset.booked = '0';
         card.actions = [{ value: 'Book', variant: 'filled', onClick: ({ card: self }) => { self.dataset.booked = '1'; } }, { value: 'Save' }];
      });
      await expect(c.locator('.slice-card__footer slice-button')).toHaveCount(2);
      await c.locator('.slice-card__footer slice-button').first().click();
      await expect(c.component).toHaveAttribute('data-booked', '1');
      expect(await c.events('onClick')).toBe(0);
   });

   test('href makes the title a link that covers the card', async ({ mount }) => {
      const c = await mount('Card', { title: 'Docs', href: '#docs', target: '_blank' });
      const link = c.locator('a.slice-card__target');
      await expect(link).toHaveAttribute('href', '#docs');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
   });

   test('with no title, the target still has a name', async ({ mount }) => {
      const c = await mount('Card', { text: 'Only text', href: '#x', ariaLabel: 'Open the report' });
      await expect(c.locator('a.slice-card__target')).toHaveAttribute('aria-label', 'Open the report');
   });

   test('selectable: a toggle with aria-pressed and onSelect', async ({ mount }) => {
      const c = await mount('Card', { title: 'Pro', subtitle: '$12 / month', selectable: true }, { spies: ['onSelect'] });
      const target = c.locator('button.slice-card__target');
      await expect(target).toHaveAttribute('aria-pressed', 'false');
      await c.locator('.slice-card__subtitle').click({ force: true });
      await expect(target).toHaveAttribute('aria-pressed', 'true');
      await expect(c.component).toHaveClass(/is-selected/);
      expect((await c.eventArgs('onSelect'))[0][0]).toBe(true);
      await target.press('Space');
      await expect(target).toHaveAttribute('aria-pressed', 'false');
   });

   test('disabled: nothing fires, the actions are disabled too', async ({ mount }) => {
      const c = await mount('Card', { title: 'Off', disabled: true, actions: [{ value: 'Retry' }] }, { spies: ['onClick'] });
      await c.component.evaluate((card) => { card.onClick = () => { card.dataset.clicked = 'yes'; }; });
      await expect(c.component).toHaveAttribute('aria-disabled', 'true');
      await expect(c.locator('button.slice-card__target')).toBeDisabled();
      await expect(c.locator('.slice-card__footer .slice_button')).toBeDisabled();
      await c.locator('.slice-card__title').click({ force: true });
      await expect(c.component).not.toHaveAttribute('data-clicked');
      await c.component.evaluate((card) => { card.disabled = false; });
      await expect(c.locator('.slice-card__footer .slice_button')).toBeEnabled();
   });

   test('loading: a skeleton, busy, and the target is off', async ({ mount }) => {
      const c = await mount('Card', { title: 'Report', text: 'Ready', loading: true, href: '#r' });
      await expect(c.component).toHaveAttribute('aria-busy', 'true');
      await expect(c.locator('.slice-card__skeleton')).toBeVisible();
      await expect(c.locator('.slice-card__text')).toBeHidden();
      await expect(c.locator('a.slice-card__target')).not.toHaveAttribute('href');
      await c.component.evaluate((card) => { card.loading = false; });
      await expect(c.locator('.slice-card__text')).toBeVisible();
      await expect(c.locator('a.slice-card__target')).toHaveAttribute('href', '#r');
   });
});

test.describe('Card — looks', () => {
   test('variants, with default and minimal as aliases', async ({ mount }) => {
      const c = await mount('Card', { title: 'V' });
      await expect(c.component).toHaveClass(/slice-card--outlined/);
      for (const [given, expected] of [['elevated', 'elevated'], ['filled', 'filled'], ['ghost', 'ghost'], ['default', 'outlined'], ['minimal', 'ghost'], ['nope', 'outlined']]) {
         await c.component.evaluate((card, v) => { card.variant = v; }, given);
         await expect(c.component).toHaveClass(new RegExp(`slice-card--${expected}`));
         expect(await c.component.evaluate((card) => [...card.classList].filter((k) => k.startsWith('slice-card--') && k !== 'slice-card--horizontal').length)).toBe(1);
      }
   });

   test('elevated has a shadow and does not move out of place', async ({ mount }) => {
      const c = await mount('Card', { title: 'E', variant: 'elevated' });
      const style = await c.component.evaluate((el) => ({ shadow: getComputedStyle(el).boxShadow, transform: getComputedStyle(el).transform }));
      expect(style.shadow).not.toBe('none');
      expect(style.transform).toBe('none');
   });

   test('size scales the padding', async ({ mount }) => {
      const pad = async (size) => {
         const c = await mount('Card', { title: 'S', size });
         return c.locator('.slice-card__main').evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
      };
      const [sm, md, lg] = [await pad('sm'), await pad('md'), await pad('lg')];
      expect(sm).toBeLessThan(md);
      expect(md).toBeLessThan(lg);
   });

   test('horizontal puts the media beside the content', async ({ mount, page }) => {
      await page.setViewportSize({ width: 900, height: 700 });
      const c = await mount('Card', { title: 'Row', text: 'Beside', icon: 'file-lines', layout: 'horizontal' });
      const [media, main] = await Promise.all([
         c.locator('.slice-card__media').boundingBox(),
         c.locator('.slice-card__main').boundingBox(),
      ]);
      expect(main.x).toBeGreaterThanOrEqual(media.x + media.width - 1);
   });

   test('customColor retints one card', async ({ mount }) => {
      const c = await mount('Card', { title: 'C', customColor: { background: 'rgb(10, 20, 30)', text: 'rgb(250, 250, 250)' } });
      const style = await c.component.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
      expect(style).toEqual({ bg: 'rgb(10, 20, 30)', color: 'rgb(250, 250, 250)' });
   });

   test('visual: an elevated card @visual', async ({ mount }) => {
      const c = await mount('Card', { title: 'Card', text: 'Body', variant: 'elevated' });
      await expect(c.component).toHaveScreenshot('card-elevated.png');
   });
});

test.describe('Card — lifecycle', () => {
   test('details / open / isOpen are gone, with a warning', async ({ mount }) => {
      const c = await mount('Card', { title: 'Old', details: 'More text', isOpen: true });
      expect(c.pageErrors()).toEqual([]);
      expect(c.warnings().some((w) => w.includes('"details" was removed'))).toBe(true);
      expect(c.warnings().some((w) => w.includes('"isOpen" was removed'))).toBe(true);
   });

   test('destroying the card destroys every component it built', async ({ mount, page }) => {
      const c = await mount('Card', {
         title: 'Full', icon: 'home', headerIcon: 'user', badge: 'New', actions: [{ value: 'A' }, { value: 'B' }],
      });
      await expect(c.locator('.slice-card__footer slice-button')).toHaveCount(2);
      const ids = await c.component.evaluate((card) => [...card.querySelectorAll('[slice-id]')].map((n) => n.getAttribute('slice-id')).concat(
         [...card.querySelectorAll('slice-icon, slice-badge, slice-button')].map((n) => n.sliceId)).filter(Boolean));
      expect(ids.length).toBeGreaterThanOrEqual(5);
      await c.component.evaluate((card) => slice.controller.destroyComponent(card));
      const alive = await page.evaluate((ids) => ids.filter((id) => slice.controller.getComponent(id)), ids);
      expect(alive).toEqual([]);
   });

   test('changing actions quickly never doubles the buttons', async ({ mount }) => {
      const c = await mount('Card', { title: 'Race' });
      await c.component.evaluate((card) => {
         card.actions = [{ value: '1' }, { value: '2' }];
         card.actions = [{ value: 'only' }];
      });
      await expect(c.locator('.slice-card__footer slice-button')).toHaveCount(1);
      await expect(c.locator('.slice-card__footer')).toHaveText('only');
   });
});