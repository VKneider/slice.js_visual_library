import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

const bubble = (page) => page.locator('.slice-tooltip-bubble:popover-open');

async function setup(page, html) {
   await page.evaluate(async (html) => {
      const box = document.createElement('div');
      box.id = 'box';
      box.style.cssText = 'display:flex;gap:24px;padding:80px';
      box.innerHTML = html;
      document.body.appendChild(box);
      await slice.build('ToolTipProvider', { singleton: true });
      await new Promise((r) => setTimeout(r, 200));   // the styles preload
   }, html);
}

const provider = (page, fn, arg) => page.evaluate(async ({ fn, arg }) => {
   const tips = await slice.build('ToolTipProvider', { singleton: true });
   return new Function('tips', 'arg', fn)(tips, arg);
}, { fn, arg });

test.describe('ToolTipProvider', () => {
   test.beforeEach(async ({ mount }) => {
      await mount('Badge', { label: 'host' });
   });

   test('attach: focus shows the shared bubble, linked to the element; no ToolTip stays behind', async ({ page }) => {
      await setup(page, '<button id="save">Save</button>');
      await provider(page, 'tips.attach(document.querySelector("#save"), { text: "Saves the draft", shortcut: "⌘S" })');
      await page.keyboard.press('Tab');
      await expect(page.locator('#save')).toBeFocused();
      await expect(bubble(page)).toContainText('Saves the draft');
      await expect(bubble(page).locator('kbd')).toHaveText('⌘S');
      await expect(page.locator('#save')).toHaveAttribute('aria-describedby', /slice-tooltip-/);
      const left = await page.evaluate(() => [...slice.controller.activeComponents.values()].filter((c) => c.tagName === 'SLICE-TOOLTIP').length);
      expect(left).toBe(0);
   });

   test('scope: data attributes, read when shown, and elements added later', async ({ page }) => {
      await setup(page, '<div id="bar"><button id="a" data-tooltip="Bold" data-tooltip-shortcut="⌘B" data-tooltip-show-delay="0">B</button></div>');
      await provider(page, 'tips.scope(document.querySelector("#bar"))');
      await page.locator('#a').hover();
      await expect(bubble(page)).toContainText('Bold');
      await page.mouse.move(5, 500);
      await expect(bubble(page)).toHaveCount(0);
      // Changed attribute, and a button added after scope().
      await page.evaluate(() => {
         document.querySelector('#a').dataset.tooltip = 'Bold text';
         const b = document.createElement('button');
         b.id = 'b';
         b.textContent = 'I';
         b.dataset.tooltip = 'Italic';
         b.dataset.tooltipShowDelay = '0';
         document.querySelector('#bar').appendChild(b);
      });
      await page.locator('#a').hover();
      await expect(bubble(page)).toContainText('Bold text');
      await page.locator('#b').hover();
      await expect(bubble(page)).toContainText('Italic');
   });

   test('one bubble for every trigger', async ({ page }) => {
      await setup(page, '<button id="a" data-tooltip="A" data-tooltip-show-delay="0">A</button><button id="b" data-tooltip="B" data-tooltip-show-delay="0">B</button>');
      await provider(page, 'tips.scope(document.querySelector("#box"))');
      await page.locator('#a').hover();
      await page.locator('#b').hover();
      await expect(bubble(page)).toContainText('B');
      expect(await page.locator('.slice-tooltip-bubble').count()).toBe(1);
   });

   test('a span gets a tab stop so the keyboard can reach its tooltip; detach takes it back', async ({ page }) => {
      await setup(page, '<span id="apr">APR</span>');
      await provider(page, 'tips.attach(document.querySelector("#apr"), { text: "Annual percentage rate" })');
      await expect(page.locator('#apr')).toHaveAttribute('tabindex', '0');
      await page.keyboard.press('Tab');
      await expect(bubble(page)).toContainText('Annual percentage rate');
      await provider(page, 'tips.detach(document.querySelector("#apr"))');
      await expect(page.locator('#apr')).not.toHaveAttribute('tabindex');
      await expect(bubble(page)).toHaveCount(0);
   });

   test('click on the trigger hides it; Escape hides it', async ({ page }) => {
      await setup(page, '<button id="a" data-tooltip="Tip" data-tooltip-show-delay="0">A</button>');
      await provider(page, 'tips.scope(document.querySelector("#box"))');
      await page.locator('#a').hover();
      await expect(bubble(page)).toBeVisible();
      await page.locator('#a').click();
      await expect(bubble(page)).toHaveCount(0);
      await page.mouse.move(5, 500);
      await page.locator('#a').hover();
      await expect(bubble(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(bubble(page)).toHaveCount(0);
   });

   test('toggletip through the provider', async ({ page }) => {
      await setup(page, '<button id="info" aria-label="Why we ask">i</button>');
      await provider(page, 'tips.attach(document.querySelector("#info"), { mode: "toggletip", title: "Why we ask", text: "Only for delivery." })');
      await page.locator('#info').hover();
      await page.waitForTimeout(500);
      await expect(bubble(page)).toHaveCount(0);
      await page.locator('#info').click();
      await expect(bubble(page)).toContainText('Only for delivery.');
      await expect(page.locator('#info')).toHaveAttribute('aria-expanded', 'true');
      await page.locator('#info').click();
      await expect(bubble(page)).toHaveCount(0);
   });

   test('a removed trigger leaves nothing open', async ({ page }) => {
      await setup(page, '<button id="a" data-tooltip="Tip" data-tooltip-show-delay="0">A</button>');
      await provider(page, 'tips.scope(document.querySelector("#box"))');
      await page.locator('#a').hover();
      await expect(bubble(page)).toBeVisible();
      await page.evaluate(() => { document.querySelector('#a').remove(); window.dispatchEvent(new Event('resize')); });
      await expect(bubble(page)).toHaveCount(0);
   });

   test('destroying the provider stops it and removes the bubble', async ({ page }) => {
      await setup(page, '<button id="a" data-tooltip="Tip" data-tooltip-show-delay="0">A</button>');
      await provider(page, 'tips.scope(document.querySelector("#box"))');
      await page.locator('#a').hover();
      await expect(bubble(page)).toBeVisible();
      await provider(page, 'slice.controller.destroyComponent(tips)');
      expect(await page.locator('.slice-tooltip-bubble').count()).toBe(0);
      await page.mouse.move(5, 500);
      await page.locator('#a').hover();
      await page.waitForTimeout(100);
      expect(await page.locator('.slice-tooltip-bubble').count()).toBe(0);
   });
});