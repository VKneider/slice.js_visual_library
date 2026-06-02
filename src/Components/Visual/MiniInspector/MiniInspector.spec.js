import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// MiniInspector reads a target component's `static props` and renders one editable
// control (.mini-inspector__row) per primitive prop (string/number/boolean).
// `title` -> .mini-inspector__title text. `target` accepts a sliceId string or a
// live instance; a string is resolved via slice.controller.getComponent().
// With no target/schema it renders a .mini-inspector__empty message.
//
// Note on harness boundary: `target` cannot be passed as a live instance object
// across the page.evaluate JSON boundary, and function props aren't relevant here.
// So the "real target" cases build a target by sliceId first (it stays registered
// in slice.controller.activeComponents) and pass that id as `target`. We pick
// ComponentShowcase as the target because it exposes two string props (title,
// badgeLabel) -> two editable rows. The array prop (variants) is non-primitive
// and is intentionally skipped by renderFields(), which we assert.
// Derived from MiniInspector.js and MiniInspector.html.

test.describe('MiniInspector', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('MiniInspector');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.mini-inspector')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('title defaults to "Inspector"', async ({ mount }) => {
      const c = await mount('MiniInspector');
      await expect(c.locator('.mini-inspector__title')).toHaveText('Inspector');
   });

   test('title reflects to .mini-inspector__title text', async ({ mount }) => {
      const c = await mount('MiniInspector', { title: 'Card props' });
      await expect(c.locator('.mini-inspector__title')).toHaveText('Card props');
   });

   test('no target => empty-state message', async ({ mount }) => {
      const c = await mount('MiniInspector', { title: 'X' });
      const empty = c.locator('.mini-inspector__empty');
      await expect(empty).toBeVisible();
      await expect(empty).toContainText('No target');
      await expect(c.locator('.mini-inspector__row')).toHaveCount(0);
   });

   test('resolves a target by sliceId and renders a row per primitive prop', async ({ mount }) => {
      // Build & register a target (stays in activeComponents even though the next
      // mount clears the harness root).
      await mount('ComponentShowcase', { sliceId: 'mi-target-showcase', title: 'T' });
      const c = await mount('MiniInspector', { title: 'Showcase', target: 'mi-target-showcase' });

      // ComponentShowcase static props: title (string), badgeLabel (string) are
      // primitive -> rows; variants (array) is skipped.
      await expect(c.locator('.mini-inspector__row')).toHaveCount(2);
      const labels = c.locator('.mini-inspector__label');
      await expect(labels.nth(0)).toHaveText('title');
      await expect(labels.nth(1)).toHaveText('badgeLabel');
   });

   test('string prop control is a text input prefilled with the current value', async ({ mount }) => {
      await mount('ComponentShowcase', { sliceId: 'mi-target-prefill', title: 'Hello' });
      const c = await mount('MiniInspector', { target: 'mi-target-prefill' });

      const titleInput = c.locator('.mini-inspector__row').nth(0).locator('input');
      await expect(titleInput).toHaveAttribute('type', 'text');
      await expect(titleInput).toHaveValue('Hello');
   });

   test('editing an input writes through to the live target prop', async ({ mount }) => {
      await mount('ComponentShowcase', { sliceId: 'mi-target-edit', title: 'Before' });
      const c = await mount('MiniInspector', { target: 'mi-target-edit' });

      const titleInput = c.locator('.mini-inspector__row').nth(0).locator('input');
      await titleInput.fill('After');

      // The setter on the target runs target.title = input.value on 'input'.
      const targetTitle = await c.component.evaluate(
         () => window.slice.controller.getComponent('mi-target-edit').title
      );
      expect(targetTitle).toBe('After');
   });

   test('a11y: each control is wrapped in a <label> with text', async ({ mount }) => {
      await mount('ComponentShowcase', { sliceId: 'mi-target-a11y', title: 'T' });
      const c = await mount('MiniInspector', { target: 'mi-target-a11y' });

      const rows = c.locator('.mini-inspector__row');
      await expect(rows).toHaveCount(2);
      // Rows are <label> elements wrapping a span label + input.
      expect(await rows.nth(0).evaluate((el) => el.tagName)).toBe('LABEL');
      await expect(rows.nth(0).locator('.mini-inspector__label')).not.toBeEmpty();
   });

   test('visual: inspector with two fields @visual', async ({ mount }) => {
      await mount('ComponentShowcase', { sliceId: 'mi-target-visual', title: 'T' });
      const c = await mount('MiniInspector', { title: 'Props', target: 'mi-target-visual' });
      await expect(c.component).toHaveScreenshot('mini-inspector.png');
   });
});
