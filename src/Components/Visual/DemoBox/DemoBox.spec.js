import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// DemoBox props: label (string, default 'Demo') and expected (string, default '').
// label -> .demobox-label text; expected -> .demobox-expected text, hidden when empty.
// Public methods appendCode(node)/appendDemo(node)/clear() mutate .demobox-code /
// .demobox-preview. Those take a DOM Node (not serializable across the page
// boundary), so they're exercised via the page from inside the mounted subtree.
// Derived from DemoBox.js and DemoBox.html.

test.describe('DemoBox', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('DemoBox');
      await expect(c.component).toBeVisible();
      await expect(c.locator('.demobox')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('label defaults to "Demo"', async ({ mount }) => {
      const c = await mount('DemoBox');
      await expect(c.locator('.demobox-label')).toHaveText('Demo');
   });

   test('label reflects to .demobox-label text', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'Click example' });
      await expect(c.locator('.demobox-label')).toHaveText('Click example');
   });

   test('expected reflects to .demobox-expected and becomes visible', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'X', expected: 'fires onClick once' });
      const exp = c.locator('.demobox-expected');
      await expect(exp).toHaveText('fires onClick once');
      await expect(exp).toBeVisible();
   });

   test('no expected => .demobox-expected hidden (display:none)', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'X' });
      // init() hides the expected span when expected is empty.
      await expect(c.locator('.demobox-expected')).toBeHidden();
   });

   test('appendDemo appends a node into .demobox-preview', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'X' });
      await c.component.evaluate((el) => {
         const span = document.createElement('span');
         span.className = 'injected-demo';
         span.textContent = 'live';
         el.appendDemo(span);
      });
      await expect(c.locator('.demobox-preview .injected-demo')).toHaveText('live');
   });

   test('appendCode appends a node into .demobox-code', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'X' });
      await c.component.evaluate((el) => {
         const pre = document.createElement('pre');
         pre.className = 'injected-code';
         pre.textContent = 'const x = 1;';
         el.appendCode(pre);
      });
      await expect(c.locator('.demobox-code .injected-code')).toHaveText('const x = 1;');
   });

   test('appendCode ignores non-Node arguments', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'X' });
      await c.component.evaluate((el) => {
         el.appendCode('not a node');
         el.appendCode(null);
      });
      await expect(c.locator('.demobox-code')).toBeEmpty();
      expect(c.pageErrors()).toEqual([]);
   });

   test('clear() empties the preview', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'X' });
      await c.component.evaluate((el) => {
         const span = document.createElement('span');
         span.className = 'injected-demo';
         el.appendDemo(span);
         el.clear();
      });
      await expect(c.locator('.demobox-preview .injected-demo')).toHaveCount(0);
      await expect(c.locator('.demobox-preview')).toBeEmpty();
   });

   test('a11y: header label and expected live in .demobox-header', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'A', expected: 'B' });
      await expect(c.locator('.demobox-header .demobox-label')).toHaveText('A');
      await expect(c.locator('.demobox-header .demobox-expected')).toHaveText('B');
   });

   test('visual: demo box with label and expected @visual', async ({ mount }) => {
      const c = await mount('DemoBox', { label: 'Example', expected: 'renders correctly' });
      await expect(c.component).toHaveScreenshot('demo-box.png');
   });
});
