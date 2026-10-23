import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// Files cannot cross evaluate(), so they are made in the page from a spec.
async function drop(c, specs) {
   await c.locator('.slice-file-upload__zone').evaluate((zone, specs) => {
      const dt = new DataTransfer();
      for (const { name, type = 'text/plain', size = 1 } of specs) dt.items.add(new File(['x'.repeat(size)], name, { type }));
      zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
   }, specs);
}

const names = (c) => c.component.evaluate((el) => el.value.map((f) => f.name));
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

test.describe('FileUpload — picking', () => {
   test('smoke: a labelled zone around a focusable file input', async ({ mount }) => {
      const c = await mount('FileUpload', { label: 'Attachments', multiple: true, accept: '.pdf,image/*', maxSize: '5 MB' });
      expect(c.pageErrors()).toEqual([]);
      const input = c.locator('input.slice-file-upload__input');
      await expect(input).toHaveAttribute('accept', '.pdf,image/*');
      await expect(input).toHaveAttribute('multiple', '');
      await expect(c.locator('.slice-file-upload__label')).toHaveText('Attachments');
      await expect(input).toHaveAttribute('aria-labelledby', /label/);
      // The hint says what is allowed when none is given.
      await expect(c.locator('.slice-file-upload__hint')).toHaveText('PDF, Images · up to 5.0 MB');
      await expect(c.locator('.slice-file-upload__prompt')).toHaveText('Drag files here, or choose');
      await expect(c.locator('.slice-file-upload__browse')).toHaveText('choose');
      await input.focus();
      await expect(input).toBeFocused();
   });

   test('picking files lists them and fires onFiles and onChange', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true }, { spies: ['onFiles', 'onChange'] });
      await c.locator('input.slice-file-upload__input').setInputFiles([
         { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('aaa') },
         { name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('b') },
      ]);
      await expect(c.locator('.slice-file-upload__name')).toHaveText(['a.txt', 'b.txt']);
      await expect(c.locator('.slice-file-upload__detail').first()).toHaveText('3 B');
      expect(await names(c)).toEqual(['a.txt', 'b.txt']);
      expect(await c.events('onFiles')).toBe(1);
      expect(await c.events('onChange')).toBe(1);
      // Reset, so picking the same file again still fires a change.
      expect(await c.locator('input.slice-file-upload__input').evaluate((el) => el.value)).toBe('');
   });

   test('a drop adds files, and the highlight follows the drag', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true });
      const zone = c.locator('.slice-file-upload__zone');
      await zone.dispatchEvent('dragenter');
      await expect(zone).toHaveClass(/is-over/);
      await zone.dispatchEvent('dragleave');
      await expect(zone).not.toHaveClass(/is-over/);
      await zone.dispatchEvent('dragenter');
      await drop(c, [{ name: 'dropped.txt' }]);
      await expect(zone).not.toHaveClass(/is-over/);
      expect(await names(c)).toEqual(['dropped.txt']);
   });

   test('single file: a new pick replaces the old one', async ({ mount }) => {
      const c = await mount('FileUpload', {});
      await drop(c, [{ name: 'first.txt' }]);
      await drop(c, [{ name: 'second.txt' }]);
      expect(await names(c)).toEqual(['second.txt']);
   });

   test('pasting files adds them', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true });
      await c.component.evaluate((el) => {
         const dt = new DataTransfer();
         dt.items.add(new File(['x'], 'pasted.png', { type: 'image/png' }));
         el.$input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
      });
      expect(await names(c)).toEqual(['pasted.png']);
   });

   test('disabled: no drop, the input and the remove buttons are off', async ({ mount }) => {
      const c = await mount('FileUpload', { disabled: true });
      await expect(c.locator('input.slice-file-upload__input')).toBeDisabled();
      await drop(c, [{ name: 'x.txt' }]);
      expect(await names(c)).toEqual([]);
   });
});

test.describe('FileUpload — checks', () => {
   test('accept also filters dropped files, and rejections say why', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true, accept: '.pdf,image/*' }, { spies: ['onReject'] });
      await drop(c, [{ name: 'report.pdf', type: 'application/pdf' }, { name: 'photo.jpg', type: 'image/jpeg' }, { name: 'notes.txt' }]);
      expect(await names(c)).toEqual(['report.pdf', 'photo.jpg']);
      await expect(c.locator('.slice-file-upload__line--rejected')).toHaveText('notes.txt: This type of file is not allowed');
      expect(await c.events('onReject')).toBe(1);
   });

   test('the hint names each type once', async ({ mount }) => {
      const c = await mount('FileUpload', { accept: '.csv,text/csv' });
      await expect(c.locator('.slice-file-upload__hint')).toHaveText('CSV');
   });

   test('maxSize and maxFiles turn files away', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true, maxSize: 10, maxFiles: 2 });
      await drop(c, [{ name: 'big.txt', size: 50 }, { name: 'a.txt' }, { name: 'b.txt' }, { name: 'c.txt' }]);
      expect(await names(c)).toEqual(['a.txt', 'b.txt']);
      await expect(c.locator('.slice-file-upload__line--rejected')).toHaveText([
         'big.txt: Larger than 10 B',
         'c.txt: You can add up to 2 files',
      ]);
   });

   test('required stays quiet until validate(), which shakes and explains', async ({ mount }) => {
      const c = await mount('FileUpload', { required: true });
      await expect(c.component).not.toHaveClass(/is-invalid/);
      expect(await c.component.evaluate((el) => el.validate())).toBe(false);
      await expect(c.locator('.slice-file-upload__line--error')).toHaveText('Add at least one file');
      await expect(c.locator('.slice-file-upload__zone')).toHaveClass(/is-shaking/);
      await drop(c, [{ name: 'a.txt' }]);
      await expect(c.locator('.slice-file-upload__line--error')).toHaveCount(0);
      await expect(c.component).not.toHaveClass(/is-invalid/);
   });

   test('messages and texts translate it', async ({ mount }) => {
      const c = await mount('FileUpload', {
         multiple: true, accept: '.pdf',
         texts: { prompt: 'Arrastra archivos o {browse}', browse: 'elígelos' },
         messages: { type: 'Solo PDF' },
      });
      await expect(c.locator('.slice-file-upload__prompt')).toHaveText('Arrastra archivos o elígelos');
      await drop(c, [{ name: 'a.txt' }]);
      await expect(c.locator('.slice-file-upload__line--rejected')).toHaveText('a.txt: Solo PDF');
   });
});

test.describe('FileUpload — the list', () => {
   test('images get a preview; the object URL is revoked when the file goes', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true });
      await c.locator('input.slice-file-upload__input').setInputFiles([
         { name: 'dot.png', mimeType: 'image/png', buffer: Buffer.from(PNG, 'base64') },
         { name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') },
      ]);
      await expect(c.locator('.slice-file-upload__thumb img')).toHaveCount(1);
      await expect(c.locator('.slice-file-upload__thumb').nth(1)).toHaveText('PDF');
      const url = await c.locator('.slice-file-upload__thumb img').getAttribute('src');
      await c.locator('.slice-file-upload__action[data-action="remove"]').first().click();
      expect(await names(c)).toEqual(['doc.pdf']);
      const loads = await c.component.evaluate(async (_, url) => {
         try { await fetch(url); return true; } catch { return false; }
      }, url);
      expect(loads).toBe(false);
   });

   test('remove moves the focus to the next file, then back to the picker', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true });
      await drop(c, [{ name: 'a.txt' }, { name: 'b.txt' }]);
      await c.locator('.slice-file-upload__action').first().click();
      await expect(c.locator('.slice-file-upload__action')).toBeFocused();
      await c.locator('.slice-file-upload__action').click();
      await expect(c.locator('input.slice-file-upload__input')).toBeFocused();
      await expect(c.locator('.slice-file-upload__list')).toBeHidden();
   });

   test('list: false keeps the list to you', async ({ mount }) => {
      const c = await mount('FileUpload', { list: false });
      await drop(c, [{ name: 'a.txt' }]);
      await expect(c.locator('.slice-file-upload__list')).toBeHidden();
      expect(await names(c)).toEqual(['a.txt']);
   });

   test('value set from code, and clear()', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true });
      await c.component.evaluate((el) => { el.value = [new File(['1'], 'one.txt'), new File(['2'], 'two.txt')]; });
      await expect(c.locator('.slice-file-upload__name')).toHaveText(['one.txt', 'two.txt']);
      await c.component.evaluate((el) => el.clear());
      expect(await names(c)).toEqual([]);
   });

   test('with name, a hidden input carries the files for a plain form', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true, name: 'attachments' });
      await drop(c, [{ name: 'a.txt' }, { name: 'b.txt' }]);
      const posted = await c.component.evaluate((el) => {
         const input = el.querySelector('input[name="attachments"]');
         return [...input.files].map((f) => f.name);
      });
      expect(posted).toEqual(['a.txt', 'b.txt']);
   });
});

test.describe('FileUpload — uploading', () => {
   test('upload shows progress, then done, and keeps the results', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true }, { spies: ['onUpload'] });
      await c.component.evaluate((el) => {
         el.upload = async (file, { onProgress }) => {
            for (const p of [0.25, 0.5, 0.75]) {
               await new Promise((r) => setTimeout(r, 60));
               onProgress(p);
            }
            await new Promise((r) => setTimeout(r, 60));
            return { url: `/files/${file.name}` };
         };
      });
      await drop(c, [{ name: 'a.txt' }]);
      await expect(c.locator('.slice-file-upload__bar')).toBeVisible();
      await expect(c.locator('.slice-file-upload__bar')).toHaveAttribute('aria-valuenow', /25|50|75/);
      expect(await c.component.evaluate((el) => el.validationMessage)).toBe('Wait for the uploads to finish');
      await expect(c.locator('.slice-file-upload__detail')).toHaveText('1 B · Uploaded');
      await expect(c.locator('.slice-file-upload__bar')).toBeHidden();
      expect(await c.component.evaluate((el) => el.results)).toEqual([{ url: '/files/a.txt' }]);
      expect(await c.events('onUpload')).toBe(1);
   });

   test('a failed upload can be retried', async ({ mount }) => {
      const c = await mount('FileUpload', {});
      await c.component.evaluate((el) => {
         el.dataset.tries = '0';
         el.upload = async () => {
            el.dataset.tries = String(Number(el.dataset.tries) + 1);
            await new Promise((r) => setTimeout(r, 30));
            if (el.dataset.tries === '1') throw new Error('Network down');
            return 'ok';
         };
      });
      await drop(c, [{ name: 'a.txt' }]);
      await expect(c.locator('.slice-file-upload__detail')).toHaveText('1 B · Upload failed: Network down');
      expect(await c.component.evaluate((el) => el.validationMessage)).toBe('Some files did not upload');
      await c.locator('.slice-file-upload__action[data-action="retry"]').click();
      await expect(c.locator('.slice-file-upload__detail')).toHaveText('1 B · Uploaded');
      expect(await c.component.evaluate((el) => el.validationMessage)).toBe('');
   });

   test('cancel aborts the upload and drops the file', async ({ mount }) => {
      const c = await mount('FileUpload', {});
      await c.component.evaluate((el) => {
         el.upload = (file, { signal }) => new Promise((resolve, reject) => {
            const t = setTimeout(() => resolve('late'), 5000);
            signal.addEventListener('abort', () => { clearTimeout(t); el.dataset.aborted = 'yes'; reject(new Error('aborted')); });
         });
      });
      await drop(c, [{ name: 'slow.txt' }]);
      await c.locator('.slice-file-upload__action[data-action="cancel"]').click();
      await expect(c.component).toHaveAttribute('data-aborted', 'yes');
      expect(await names(c)).toEqual([]);
   });

   test('autoUpload: false waits for uploadAll(), which runs at most `concurrency` at once', async ({ mount }) => {
      const c = await mount('FileUpload', { multiple: true, autoUpload: false, concurrency: 2 });
      await c.component.evaluate((el) => {
         el.dataset.peak = '0';
         let running = 0;
         el.upload = async () => {
            running++;
            el.dataset.peak = String(Math.max(Number(el.dataset.peak), running));
            await new Promise((r) => setTimeout(r, 50));
            running--;
            return true;
         };
      });
      await drop(c, [{ name: 'a.txt' }, { name: 'b.txt' }, { name: 'c.txt' }]);
      expect(await c.component.evaluate((el) => el.items.map((i) => i.status))).toEqual(['ready', 'ready', 'ready']);
      const statuses = await c.component.evaluate(async (el) => (await el.uploadAll()).map((i) => i.status));
      expect(statuses).toEqual(['done', 'done', 'done']);
      await expect(c.component).toHaveAttribute('data-peak', '2');
   });
});

test.describe('FileUpload — in a Form, and lifecycle', () => {
   test('inside a Form: required error from the Form, files in getValues()', async ({ mount }) => {
      const c = await mount('Form', {
         schema: [{ kind: 'field', name: 'cv', label: 'Your CV', component: 'FileUpload', required: true, props: { accept: '.pdf' } }],
      });
      expect(await c.component.evaluate((f) => f.submit())).toBe(false);
      await expect(c.locator('.slice-form__error')).toHaveText('This field is required');
      await c.locator('.slice-file-upload__zone').evaluate((zone) => {
         const dt = new DataTransfer();
         dt.items.add(new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }));
         zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
      });
      await expect(c.locator('.slice-form__error')).toHaveText('');
      expect(await c.component.evaluate((f) => f.getValues().cv.map((file) => file.name))).toEqual(['cv.pdf']);
   });

   test('destroying it aborts uploads and destroys its icon', async ({ mount, page }) => {
      const c = await mount('FileUpload', {});
      const iconId = await c.component.evaluate((el) => el.querySelector('slice-icon')?.sliceId);
      expect(iconId).toBeTruthy();
      await c.component.evaluate((el) => {
         el.upload = (file, { signal }) => new Promise((resolve) => {
            signal.addEventListener('abort', () => { document.body.dataset.uploadAborted = 'yes'; resolve(); });
         });
      });
      await drop(c, [{ name: 'a.txt' }]);
      await c.component.evaluate((el) => slice.controller.destroyComponent(el));
      expect(await page.evaluate(() => document.body.dataset.uploadAborted)).toBe('yes');
      expect(await page.evaluate((id) => !!slice.controller.getComponent(id), iconId)).toBe(false);
      await page.evaluate(() => delete document.body.dataset.uploadAborted);
   });

   test('visual: the drop zone @visual', async ({ mount }) => {
      const c = await mount('FileUpload', { prompt: 'Drop files here', hint: 'PNG or JPG' });
      await expect(c.component).toHaveScreenshot('file-upload-zone.png');
   });
});