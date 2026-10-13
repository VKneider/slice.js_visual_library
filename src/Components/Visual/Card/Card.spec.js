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

// Regression specs for three defects found by probing a real Card in the
// browser, not by reading the code:
//
//  1. Card.css set `--card-shadow: none` on the card itself and then consumed it
//     two rules later, so NO Card had a shadow — `elevated` included.
//  2. `icon`'s default was a truthy object, and init() tests
//     `if (this._icon || this._image)`, so every Card reserved a media strip
//     and rendered the SliceJS logo whether one was asked for or not.
//  3. Hiding the strip then became impossible to do from CSS alone, because the
//     code path that hid it was the same one that decided there was nothing to
//     show.

test.describe('Card — media strip', () => {
   test('a card with no icon and no image shows NO media strip', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', text: 'B' });

      // The bug: an empty band across the top, always.
      await expect(c.locator('.card-media')).toBeHidden();
      await expect(c.locator('.card-media-content slice-icon')).toHaveCount(0);
   });

   test('a card never renders an icon nobody asked for', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', text: 'B' });
      // The default used to be { name: 'sliceJs' }, so every card shipped a
      // vendor logo.
      await expect(c.locator('slice-icon[name="sliceJs"]')).toHaveCount(0);
      expect(c.pageErrors()).toEqual([]);
   });

   test('an explicit icon renders in the strip and reveals it', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', text: 'B', icon: { name: 'star' } });

      await expect(c.locator('.card-media')).toBeVisible();
      await expect(c.locator('.card-media-content slice-icon')).toHaveCount(1);
   });

   test('an image reveals the strip too', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', image: '/x.png' });
      await expect(c.locator('.card-media')).toBeVisible();
   });

   test('an icon without a name is treated as no icon', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', icon: {} });
      await expect(c.locator('.card-media')).toBeHidden();
   });

   test('legacy iconStyle inside the icon object is accepted and ignored', async ({ mount }) => {
      // Public API: consumers may still pass it. It must not break the card, and
      // it must not reach Icon as a deprecated prop.
      const c = await mount('Card', { title: 'T', icon: { name: 'star', iconStyle: 'outlined' } });
      await expect(c.locator('.card-media-content slice-icon')).toHaveCount(1);
   });
});

test.describe('Card — elevation', () => {
   test('a card actually has a shadow', async ({ mount }) => {
      const c = await mount('Card', { title: 'T' });
      const shadow = await c.component.evaluate((el) => getComputedStyle(el).boxShadow);
      expect(shadow).not.toBe('none');
   });

   test('the shadow comes from the theme scale, tinted with the palette', async ({ mount }) => {
      const c = await mount('Card', { title: 'T' });

      const shadow = await c.component.evaluate((el) => getComputedStyle(el).boxShadow);
      // Not a neutral black: the scale is tinted with --primary-color-rgb, so
      // this reads as part of the theme instead of sitting on top of it.
      expect(shadow).not.toMatch(/rgba\(0, 0, 0/);

      const rgb = await c.component.evaluate((el) =>
         getComputedStyle(document.documentElement).getPropertyValue('--primary-color-rgb').trim()
      );
      expect(rgb).toBeTruthy();
      expect(shadow).toContain(`rgba(${rgb.replace(/\s+/g, ' ')},`);
   });

   test('elevated is a higher step of the same scale', async ({ mountHtml }) => {
      // Both cards in ONE page: the `mount` fixture clears the test root on every
      // call, so a second `mount` detaches the first and leaves both resolving
      // to the same computed value.
      const h = await mountHtml(`<div></div>`);
      const out = await h.page.evaluate(async () => {
         const plain = await slice.build('Card', { sliceId: 'elev-plain', title: 'T' });
         const elevated = await slice.build('Card', { sliceId: 'elev-high', title: 'T', variant: 'elevated' });
         document.body.appendChild(plain);
         document.body.appendChild(elevated);
         await new Promise((r) => setTimeout(r, 50));
         return {
            a: getComputedStyle(plain).boxShadow,
            b: getComputedStyle(elevated).boxShadow,
         };
      });
      const { a, b } = out;

      // --slice-shadow-md vs --slice-shadow-sm: different, and neither is none.
      expect(a).not.toBe('none');
      expect(b).not.toBe('none');
      expect(b).not.toBe(a);
   });
});

test.describe('Card — toggle', () => {
   test('the toggle only appears when there are details', async ({ mount }) => {
      const plain = await mount('Card', { title: 'T' });
      await expect(plain.locator('.card-toggle')).toBeHidden();

      const withDetails = await mount('Card', { title: 'T', details: 'More' });
      await expect(withDetails.locator('.card-toggle')).toBeVisible();
   });

   test('the chevron is a rendered svg, not an empty host', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', details: 'More' });

      // iconStyle used to be set on this icon. It is a no-op since the Lucide
      // migration, and the attribute never even matched the prop name.
      await expect(c.locator('.card-toggle slice-icon svg')).toHaveCount(1);
   });

   test('the toggle carries no deprecated iconStyle attribute', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', details: 'More' });

      const attr = await c.locator('.card-toggle slice-icon').getAttribute('iconstyle');
      expect(attr).toBeNull();
   });
});

   test('headerIcon renders beside the title', async ({ mount }) => {
      const c = await mount('Card', { title: 'Slice.js', headerIcon: 'sliceJs' });

      const icon = c.locator('.card-header-icon');
      await expect(icon).toBeVisible();
      await expect(icon.locator('slice-icon svg')).toHaveCount(1);
      // In the header, next to the title — not in the media banner.
      await expect(c.locator('.card-header .card-header-icon slice-icon')).toHaveCount(1);
      await expect(c.locator('.card-media-content slice-icon')).toHaveCount(0);
   });

   test('no headerIcon means the slot stays hidden', async ({ mount }) => {
      const c = await mount('Card', { title: 'Plain' });
      await expect(c.locator('.card-header-icon')).toBeHidden();
   });

   test('headerIcon accepts an object with size and color', async ({ mount }) => {
      const c = await mount('Card', {
         title: 'Custom',
         headerIcon: { name: 'star', size: '28px', color: 'var(--danger-color)' },
      });

      const icon = c.locator('.card-header-icon slice-icon');
      await expect(icon).toHaveCount(1);
      const fontSize = await icon.evaluate((el) => getComputedStyle(el).fontSize);
      expect(fontSize).toBe('28px');
   });

   test('headerIcon and the media icon are independent slots', async ({ mount }) => {
      const both = await mount('Card', { title: 'T', headerIcon: 'star', icon: { name: 'star' } });
      await expect(both.locator('.card-header-icon slice-icon')).toHaveCount(1);
      await expect(both.locator('.card-media-content slice-icon')).toHaveCount(1);

      // Header only: no banner strip.
      const headerOnly = await mount('Card', { title: 'T', headerIcon: 'star' });
      await expect(headerOnly.locator('.card-header-icon slice-icon')).toHaveCount(1);
      await expect(headerOnly.locator('.card-media')).toBeHidden();
   });

   test('destroying the card destroys the header icon', async ({ mount }) => {
      const c = await mount('Card', { title: 'T', headerIcon: 'star', sliceId: 'card-hdr-die' });

      const out = await c.component.evaluate((el) => {
         const before = slice.controller.activeComponents.has('card-hdr-die-header-icon');
         slice.controller.destroyComponent('card-hdr-die');
         return { before, after: slice.controller.activeComponents.has('card-hdr-die-header-icon') };
      });

      expect(out.before).toBe(true);
      expect(out.after).toBe(false);
   });

   test('a Slice brand mark is legible inside the header chip', async ({ mount }) => {
      const c = await mount('Card', { title: 'Slice.js', headerIcon: 'sliceJs' });

      // The mark must paint INSIDE its slot: the sprite marks carry a real
      // ~1000-unit viewBox, and getting that wrong made them cover the page.
      const fits = await c.component.evaluate((el) => {
         const svg = el.querySelector('.card-header-icon svg');
         const slot = el.querySelector('.card-header-icon').getBoundingClientRect();
         const box = svg.getBBox();
         const [, , vbW, vbH] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
         return {
            viewBox: `${vbW}x${vbH}`,
            fits: box.x >= -1 && box.y >= -1 && box.x + box.width <= vbW + 1 && box.y + box.height <= vbH + 1,
            slot: `${Math.round(slot.width)}x${Math.round(slot.height)}`,
         };
      });

      expect(fits.fits).toBe(true);
      expect(fits.viewBox).not.toBe('24x24');
   });
});
