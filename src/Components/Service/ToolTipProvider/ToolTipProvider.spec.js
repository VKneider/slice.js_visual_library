import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

test.describe('ToolTipProvider', () => {
  test('shows the shared bubble on focus and leaves no ToolTip component behind', async ({ mount, page }) => {
    await mount('Badge', { value: 'host' });
    await page.evaluate(async () => {
      const button = document.createElement('button');
      button.id = 'tip-target';
      button.textContent = 'Save';
      document.body.appendChild(button);
      const tips = await slice.build('ToolTipProvider', { singleton: true });
      tips.attach(button, { text: 'Saves the draft' });
      await new Promise((r) => setTimeout(r, 300));   // CSS preload settles
    });
    await page.locator('#tip-target').focus();
    await expect(page.getByText('Saves the draft')).toBeVisible();

    // The CSS preload builds one ToolTip; it must not stay registered.
    const tooltips = await page.evaluate(() =>
      [...slice.controller.activeComponents.values()].filter((c) => c.tagName === 'SLICE-TOOLTIP').length);
    expect(tooltips).toBe(0);
  });
});