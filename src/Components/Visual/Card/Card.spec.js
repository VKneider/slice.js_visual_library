import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Card baseline contract. Derived from Card.js / Card.html.
//   - tag: slice-card, host gets class `slice-card`
//   - title/text/details/badge -> textContent of .card-title/.card-text/
//     .card-details-content/.card-badge
//   - variant -> `card-<variant>` modifier class on the host (default 'default')
//   - interactive -> host gets role="button", tabindex="0", class `interactive`
//   - disabled -> host gets class `disabled`, aria-disabled="true"
//   - details present -> .card-toggle shown, host aria-expanded reflects open
//   - onClick fires on host click when interactive (spy)
//   - §7 alias: isOpen -> open, warns once

test.describe('Card', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('Card', { title: 'Hello' });
      await expect(c.component).toBeVisible();
      await expect(c.component).toHaveClass(/slice-card/);
      expect(c.pageErrors()).toEqual([]);
   });

   test('title and text reflect to the DOM', async ({ mount }) => {
      const c = await mount('Card', { title: 'My Title', text: 'My body text' });
      await expect(c.locator('.card-title')).toHaveText('My Title');
      await expect(c.locator('.card-text')).toHaveText('My body text');
   });

   test('badge reflects to the DOM', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', badge: 'NEW' });
      await expect(c.locator('.card-badge')).toHaveText('NEW');
   });

   test('default variant applies card-default class', async ({ mount }) => {
      const c = await mount('Card', { title: 'T' });
      await expect(c.component).toHaveClass(/card-default/);
   });

   test('variant applies matching modifier class (elevated)', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', variant: 'elevated' });
      await expect(c.component).toHaveClass(/card-elevated/);
   });

   test('variant applies matching modifier class (outlined)', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', variant: 'outlined' });
      await expect(c.component).toHaveClass(/card-outlined/);
   });

   test('interactive (default) sets role, tabindex and interactive class', async ({ mount }) => {
      const c = await mount('Card', { title: 'T' });
      await expect(c.component).toHaveAttribute('role', 'button');
      await expect(c.component).toHaveAttribute('tabindex', '0');
      await expect(c.component).toHaveClass(/interactive/);
   });

   test('interactive=false removes the interactive class', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', interactive: false });
      await expect(c.component).not.toHaveClass(/interactive/);
   });

   test('disabled adds disabled class and aria-disabled', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', disabled: true });
      await expect(c.component).toHaveClass(/disabled/);
      await expect(c.component).toHaveAttribute('aria-disabled', 'true');
   });

   test('details shows the toggle and renders details content', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', details: 'Extra info' });
      await expect(c.locator('.card-details-content')).toHaveText('Extra info');
      await expect(c.locator('.card-toggle')).toBeVisible();
   });

   test('no details hides the toggle', async ({ mount }) => {
      const c = await mount('Card', { title: 'T' });
      await expect(c.locator('.card-toggle')).toBeHidden();
   });

   test('toggle click expands the card (aria-expanded + is-open)', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', details: 'Extra info' });
      await expect(c.component).toHaveAttribute('aria-expanded', 'false');
      await c.locator('.card-toggle').click();
      await expect(c.component).toHaveAttribute('aria-expanded', 'true');
      await expect(c.component).toHaveClass(/is-open/);
   });

   test('onClick fires when the card is clicked (interactive)', async ({ mount }) => {
      const c = await mount('Card', { title: 'Clickable' }, { spies: ['onClick'] });
      await c.component.click();
      expect(await c.events('onClick')).toBe(1);
   });

   test('onClick does not fire when disabled', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', disabled: true }, { spies: ['onClick'] });
      // pointer-events:none is set on disabled; force the click to bypass it and
      // assert the handler guard (`!this.disabled`) still blocks the callback.
      await c.component.click({ force: true });
      expect(await c.events('onClick')).toBe(0);
   });

   // §7 deprecation/alias contract: isOpen -> open, still works and warns once.
   test('deprecated isOpen sets open state and warns once', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', isOpen: true });
      await expect(c.component).toHaveClass(/is-open/);
      await expect(c.component).toHaveAttribute('aria-expanded', 'true');

      const deprecations = c.deprecationWarnings();
      expect(deprecations.some((w) => w.includes('isOpen'))).toBe(true);
      expect(deprecations.filter((w) => w.includes('isOpen')).length).toBe(1);
   });

   test('visual: elevated card @visual', async ({ mount }) => {
      const c = await mount('Card', { title: 'Card', text: 'Body', variant: 'elevated' });
      await expect(c.component).toHaveScreenshot('card-elevated.png');
   });
});
