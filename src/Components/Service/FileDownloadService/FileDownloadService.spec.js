import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// A real download would need a browser download event and a filesystem, which
// makes for a flaky test. These specs instead observe the two things that are
// actually easy to get wrong — the Blob's type and the object URL's lifetime —
// by instrumenting the browser APIs the service calls.

/** Records every createObjectURL / revokeObjectURL / anchor click. */
async function instrument(page) {
   await page.evaluate(() => {
      window.__calls = { created: [], revoked: [], clicks: [] };
      window.__blobs = [];

      const create = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
         const url = create(blob);
         window.__calls.created.push(url);
         window.__blobs.push({ type: blob.type, size: blob.size });
         return url;
      };

      const revoke = URL.revokeObjectURL.bind(URL);
      URL.revokeObjectURL = (url) => {
         window.__calls.revoked.push(url);
         return revoke(url);
      };

      const click = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
         window.__calls.clicks.push({ href: this.href, download: this.download });
         // Swallow it so the test never touches the filesystem.
      };
      window.__restoreClick = () => { HTMLAnchorElement.prototype.click = click; };
   });
}

test.describe('FileDownloadService', () => {
   test('smoke: builds without errors', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['FileDownloadService'] });
      const ok = await h.page.evaluate(() => !!window.__sliceServices.FileDownloadService);
      expect(ok).toBe(true);
      expect(h.pageErrors()).toEqual([]);
   });

   test('download() builds a Blob with the given type and the right filename', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['FileDownloadService'] });
      await instrument(h.page);

      await h.page.evaluate(() => {
         window.__sliceServices.FileDownloadService.download('people.json', '{"a":1}', 'application/json');
      });

      const out = await h.page.evaluate(() => ({
         blobs: window.__blobs,
         clicks: window.__calls.clicks,
      }));

      expect(out.blobs).toHaveLength(1);
      expect(out.blobs[0].type).toBe('application/json');
      expect(out.blobs[0].size).toBe(7);
      expect(out.clicks).toHaveLength(1);
      expect(out.clicks[0].download).toBe('people.json');
      expect(h.pageErrors()).toEqual([]);
   });

   test('the mimeType defaults to text/plain', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['FileDownloadService'] });
      await instrument(h.page);

      await h.page.evaluate(() => {
         window.__sliceServices.FileDownloadService.download('notes.txt', 'hello');
      });

      const types = await h.page.evaluate(() => window.__blobs.map((b) => b.type));
      expect(types).toEqual(['text/plain']);
   });

   test('a Blob passed in is used as-is, not re-wrapped', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['FileDownloadService'] });
      await instrument(h.page);

      await h.page.evaluate(() => {
         const blob = new Blob(['id,name\n1,Ada\n'], { type: 'text/csv' });
         // A mimeType is passed too, and must be IGNORED: the Blob knows better.
         window.__sliceServices.FileDownloadService.download('out.csv', blob, 'application/json');
      });

      const out = await h.page.evaluate(() => window.__blobs);
      expect(out).toHaveLength(1);
      expect(out[0].type).toBe('text/csv');
      expect(out[0].size).toBe(14);   // 'id,name\n' + '1,Ada\n', i.e. the Blob untouched
   });

   test('the object URL is created, used and then revoked', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['FileDownloadService'] });
      await instrument(h.page);

      const out = await h.page.evaluate(async () => {
         window.__sliceServices.FileDownloadService.download('a.txt', 'x');
         const url = window.__calls.created[0];

         const anchorInTree = document.querySelector('a[download]');
         const hrefAtClick = window.__calls.clicks[0].href;
         const revokeRightAfter = window.__calls.revoked.length;

         // Revocation is deliberately deferred: revoking synchronously cancels
         // the download in some browsers.
         await new Promise((r) => setTimeout(r, 200));

         return {
            url,
            hrefAtClick,
            anchorInTree,
            revokeRightAfter,
            revokedLater: [...window.__calls.revoked],
            anchorAfter: document.querySelector('a[download]'),
         };
      });

      expect(out.url).toBeTruthy();
      expect(out.hrefAtClick).toContain(out.url);
      // The anchor is in the tree at click time (Firefox needs that), ...
      expect(out.anchorInTree).toBeTruthy();
      // ...but the URL is NOT revoked until later. ...
      expect(out.revokeRightAfter).toBe(0);
      // ...and afterwards both the URL and the anchor are gone, so neither leaks.
      expect(out.revokedLater).toContain(out.url);
      expect(out.anchorAfter).toBeFalsy();
   });

   test('open() targets a new tab and revokes its URL too', async ({ mountHtml }) => {
      const h = await mountHtml(`<div></div>`, { services: ['FileDownloadService'] });
      await instrument(h.page);
      await h.page.evaluate(() => { window.__opened = []; window.open = (...args) => { window.__opened.push(args); return null; }; });

      await h.page.evaluate(() => {
         window.__sliceServices.FileDownloadService.open('report body', 'text/plain');
      });

      const out = await h.page.evaluate(() => ({
         opened: window.__opened,
         created: window.__calls.created,
      }));

      expect(out.opened).toHaveLength(1);
      expect(out.opened[0][1]).toBe('_blank');
      expect(out.opened[0][2]).toContain('noopener');
      expect(out.created).toHaveLength(1);
   });
});
