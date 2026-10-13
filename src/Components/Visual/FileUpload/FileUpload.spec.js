import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Playwright cannot pass a File through dispatchEvent's init object, and a File
// does not survive JSON serialisation into a spy, so both are built inside the
// page.
test.describe('FileUpload', () => {
   test('smoke: builds and mounts without errors', async ({ mount }) => {
      const c = await mount('FileUpload', { prompt: 'Drop files here' });
      await expect(c.locator('[data-el="prompt"]')).toHaveText('Drop files here');
      await expect(c.locator('input[type="file"]')).toBeAttached();
      expect(c.pageErrors()).toEqual([]);
   });

   test('accept and multiple reach the native input', async ({ mount }) => {
      const c = await mount('FileUpload', { accept: 'image/*,.png', multiple: true });
      const input = c.locator('input[type="file"]');
      await expect(input).toHaveAttribute('accept', 'image/*,.png');
      await expect(input).toHaveAttribute('multiple', '');
   });

   test('an empty accept means "any file"', async ({ mount }) => {
      const c = await mount('FileUpload', { accept: '.json' });
      await c.component.evaluate((el) => { el.accept = ''; });
      await expect(c.locator('input[type="file"]')).not.toHaveAttribute('accept', /.+/);
   });

   test('picking a file fires onFiles with the file list', async ({ mount }) => {
      const c = await mount('FileUpload', {}, { spies: ['onFiles'] });
      await c.root.page().evaluate(() => {
         window.__names = [];
         window.__sliceMounted.onFiles = (files) => { window.__names.push(files.map((f) => f.name)); };
      });
      await c.locator('input[type="file"]').setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') });

      await expect.poll(() => c.root.page().evaluate(() => window.__names)).toEqual([['a.txt']]);
      // Reset so picking the SAME file again still fires a change event.
      const cleared = await c.locator('input[type="file"]').evaluate((el) => el.value === '');
      expect(cleared).toBe(true);
   });

   test('a drop fires onFiles and clears the hover state', async ({ mount }) => {
      const c = await mount('FileUpload', {});
      await c.root.page().evaluate(() => {
         window.__names = [];
         window.__sliceMounted.onFiles = (files) => { window.__names.push(files.map((f) => f.name)); };
      });
      const zone = c.locator('.slice_file_upload__zone');

      await zone.dispatchEvent('dragover');
      await expect(zone).toHaveClass(/is-over/);

      // The File has to be constructed in the page: it cannot cross evaluate().
      await zone.evaluate((el) => {
         const file = new File(['x'], 'dropped.txt', { type: 'text/plain' });
         const dt = new DataTransfer();
         dt.items.add(file);
         el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
      });

      await expect(zone).not.toHaveClass(/is-over/);
      await expect.poll(() => c.root.page().evaluate(() => window.__names)).toEqual([['dropped.txt']]);
   });

   test('a disabled upload ignores the drop', async ({ mount }) => {
      const c = await mount('FileUpload', { disabled: true });
      await c.root.page().evaluate(() => {
         window.__names = [];
         window.__sliceMounted.onFiles = (files) => { window.__names.push(files.map((f) => f.name)); };
      });
      const zone = c.locator('.slice_file_upload__zone');
      await expect(zone).toHaveClass(/is-disabled/);
      await expect(c.locator('input[type="file"]')).toBeDisabled();

      await zone.evaluate((el) => {
         const dt = new DataTransfer();
         dt.items.add(new File(['x'], 'dropped.txt', { type: 'text/plain' }));
         el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
      });
      expect(await c.root.page().evaluate(() => window.__names)).toEqual([]);
   });

   test('the list shows the picked files only when asked', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true });
      const list = c.locator('[data-el="list"]');
      await expect(list).toBeHidden();

      await c.component.evaluate((el) => { el.list = true; });
      await c.locator('input[type="file"]').setInputFiles([
         { name: 'one.txt', mimeType: 'text/plain', buffer: Buffer.from('1') },
         { name: 'two.txt', mimeType: 'text/plain', buffer: Buffer.from('2') },
      ]);
      await expect(list.locator('li')).toHaveCount(2);
      await expect(list.locator('li').first()).toHaveText('one.txt');
   });

   test('the zone is a label wrapping the input, so it is keyboard operable', async ({ mount }) => {
      const c = await mount('FileUpload', {});
      await expect(c.locator('label.slice_file_upload')).toBeAttached();
      await expect(c.locator('label.slice_file_upload input[type="file"]')).toHaveCount(1);
      const input = c.locator('input[type="file"]');
      const reachable = await input.evaluate((el) => el.tabIndex >= 0 && !el.disabled);
      expect(reachable).toBe(true);
   });

   test('hint is optional', async ({ mount }) => {
      const c = await mount('FileUpload', { hint: 'PNG or JPG, up to 2MB' });
      await expect(c.locator('[data-el="hint"]')).toHaveText('PNG or JPG, up to 2MB');

      await c.component.evaluate((el) => { el.hint = ''; });
      await expect(c.locator('[data-el="hint"]')).toBeHidden();
   });

   test('visual: drop zone @visual', async ({ mount }) => {
      const c = await mount('FileUpload', { hint: 'PNG, JPG or PDF' });
      await expect(c.component).toHaveScreenshot('fileupload-default.png');
   });
});