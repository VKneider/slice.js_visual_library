import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// ComponentShowcase renders a grid of "variant cards" from a `variants` array.
// Each variant => .variant-card with a .variant-badge (badgeLabel), a
// .variant-label (variant.label) and, when present, a .variant-description.
// An optional `title` renders an <h3 class="showcase-title">.
// Derived from ComponentShowcase.js (render()) and ComponentShowcase.html.
//
// KNOWN COMPONENT BUG / mounting constraint (documented, not worked around in
// the component since we must not modify it):
//   `render()` iterates `this.variants` (getter -> this._variants). During build,
//   Controller.setComponentProps applies the static-prop DEFAULTS in declaration
//   order (variants, title, badgeLabel) BUT only for props the caller did NOT
//   pass. The `title`/`badgeLabel` setters call render() unconditionally (their
//   guard is `this.$root`/`this.$grid`, both already set in the constructor).
//   So if `variants` is omitted from the passed props while `title`/`badgeLabel`
//   are also omitted, `variants`' own default ([]) is applied first and all is
//   well — but if ANY of title/badgeLabel is omitted WHILE variants IS passed,
//   that prop's default setter runs render() BEFORE the variants setter assigns
//   `_variants`, throwing "this.variants is not iterable" and making slice.build
//   return null.
//   => The only safe ways to mount are: (a) pass NO props at all, or (b) pass
//      ALL THREE props with `variants` listed FIRST. These tests do exactly that.
//      As a result, "default badgeLabel / no-title" variations cannot be asserted
//      WITH variant cards present; the no-props case (empty grid) covers defaults.

const VARIANTS = [
   { label: 'Filled', description: 'Solid background' },
   { label: 'Outlined', description: 'Bordered only' },
   { label: 'Ghost' } // no description -> no .variant-description for this card
];

// Helper: always pass all three props, variants first, to avoid the setter-order
// build crash described above.
const fullProps = (overrides = {}) => ({
   variants: VARIANTS,
   title: 'Variants',
   badgeLabel: 'Variant',
   ...overrides
});

test.describe('ComponentShowcase', () => {
   test('smoke: builds with no props (empty grid) without errors', async ({ mount }) => {
      // No-props path is safe: variants default ([]) is applied first.
      const c = await mount('ComponentShowcase');
      // Empty grid has no box, so assert attached (not visible) here.
      await expect(c.component).toBeAttached();
      await expect(c.locator('.showcase')).toBeAttached();
      await expect(c.locator('.showcase-grid')).toBeAttached();
      await expect(c.locator('.variant-card')).toHaveCount(0);
      expect(c.pageErrors()).toEqual([]);
   });

   test('variants render one .variant-card each', async ({ mount }) => {
      const c = await mount('ComponentShowcase', fullProps());
      await expect(c.locator('.variant-card')).toHaveCount(3);
      await expect(c.locator('.variant-preview')).toHaveCount(3);
      expect(c.pageErrors()).toEqual([]);
   });

   test('variant.label reflects to .variant-label text', async ({ mount }) => {
      const c = await mount('ComponentShowcase', fullProps());
      const labels = c.locator('.variant-label');
      await expect(labels.nth(0)).toHaveText('Filled');
      await expect(labels.nth(1)).toHaveText('Outlined');
      await expect(labels.nth(2)).toHaveText('Ghost');
   });

   test('badgeLabel reflects to every .variant-badge', async ({ mount }) => {
      const c = await mount('ComponentShowcase', fullProps({ badgeLabel: 'Mode' }));
      const badges = c.locator('.variant-badge');
      await expect(badges).toHaveCount(3);
      await expect(badges.nth(0)).toHaveText('Mode');
      await expect(badges.nth(2)).toHaveText('Mode');
   });

   test('description renders only for variants that define one', async ({ mount }) => {
      const c = await mount('ComponentShowcase', fullProps());
      // Two of the three variants declare a description.
      await expect(c.locator('.variant-description')).toHaveCount(2);
      await expect(c.locator('.variant-description').nth(0)).toHaveText('Solid background');
   });

   test('title renders an .showcase-title heading', async ({ mount }) => {
      const c = await mount('ComponentShowcase', fullProps({ title: 'Button variants' }));
      await expect(c.locator('.showcase-title')).toHaveText('Button variants');
   });

   test('empty title => no .showcase-title heading', async ({ mount }) => {
      // Pass an empty-string title (still provided, so no default setter fires
      // before variants) -> render() skips the heading.
      const c = await mount('ComponentShowcase', fullProps({ title: '' }));
      await expect(c.locator('.showcase-title')).toHaveCount(0);
      await expect(c.locator('.variant-card')).toHaveCount(3);
   });

   test('a11y: title is a real <h3> heading', async ({ mount }) => {
      const c = await mount('ComponentShowcase', fullProps({ title: 'Section' }));
      const heading = c.locator('.showcase-title');
      await expect(heading).toBeVisible();
      expect(await heading.evaluate((el) => el.tagName)).toBe('H3');
   });

   test('visual: showcase grid @visual', async ({ mount }) => {
      const c = await mount('ComponentShowcase', fullProps({ title: 'Variants' }));
      await expect(c.component).toHaveScreenshot('component-showcase.png');
   });
});
