import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ElementCarrousel baseline contract. Derived from ElementCarrousel.js / .html.
//   - tag: slice-element-carrousel
//   - host a11y: role="region", aria-roledescription="carousel", tabindex="0"
//   - prev/next buttons get aria-label
//   - `elements`: array; non-Node entries render as String(element) in a
//     <li.slice_carousel_slide> on .slice_carousel_track, with a matching
//     <button.slice_carousel_indicator> dot per element.
//   - first slide + first dot get `current-slide`
//   - next/prev buttons and dot clicks move `current-slide` between dots
//   - ArrowRight/ArrowLeft keydown on the host triggers next/prev
//
// Strings serialize across the page boundary, so the element-rendering and
// navigation contract is fully exercised (Node entries are also supported by
// the component but cannot be passed via serialized props).

const ITEMS = ['One', 'Two', 'Three'];

test.describe('ElementCarrousel', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await expect(c.component).toBeVisible();
      await expect(c.locator('.slice_carousel_track')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('a11y: host carousel region attributes', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await expect(c.component).toHaveAttribute('role', 'region');
      await expect(c.component).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(c.component).toHaveAttribute('tabindex', '0');
   });

   test('a11y: prev/next buttons have aria-labels', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await expect(c.locator('.slice_carousel_prev')).toHaveAttribute('aria-label', 'Previous slide');
      await expect(c.locator('.slice_carousel_next')).toHaveAttribute('aria-label', 'Next slide');
   });

   test('renders one slide and one dot per element', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await expect(c.locator('.slice_carousel_slide')).toHaveCount(3);
      await expect(c.locator('.slice_carousel_indicator')).toHaveCount(3);
   });

   test('renders string elements as slide text content', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await expect(c.locator('.slice_carousel_slide').nth(0)).toHaveText('One');
      await expect(c.locator('.slice_carousel_slide').nth(2)).toHaveText('Three');
   });

   test('first slide and first dot are current on render', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await expect(c.locator('.slice_carousel_slide').nth(0)).toHaveClass(/current-slide/);
      await expect(c.locator('.slice_carousel_indicator').nth(0)).toHaveClass(/current-slide/);
   });

   test('next button moves current-slide dot forward', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await c.locator('.slice_carousel_next').click();
      await expect(c.locator('.slice_carousel_indicator').nth(1)).toHaveClass(/current-slide/);
      await expect(c.locator('.slice_carousel_indicator').nth(0)).not.toHaveClass(/current-slide/);
   });

   test('prev button from first wraps to the last dot', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await c.locator('.slice_carousel_prev').click();
      await expect(c.locator('.slice_carousel_indicator').nth(2)).toHaveClass(/current-slide/);
   });

   test('clicking a dot moves to that slide', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await c.locator('.slice_carousel_indicator').nth(2).click();
      await expect(c.locator('.slice_carousel_indicator').nth(2)).toHaveClass(/current-slide/);
   });

   test('ArrowRight keydown advances the carousel', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await c.component.focus();
      await c.component.press('ArrowRight');
      await expect(c.locator('.slice_carousel_indicator').nth(1)).toHaveClass(/current-slide/);
   });

   test('empty elements renders no slides without errors', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: [] });
      await expect(c.locator('.slice_carousel_slide')).toHaveCount(0);
      expect(c.pageErrors()).toEqual([]);
   });

   test('visual: three-item carousel @visual', async ({ mount }) => {
      const c = await mount('ElementCarrousel', { elements: ITEMS });
      await expect(c.component).toHaveScreenshot('carrousel-three.png');
   });
});
