import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// A scrolling box with a sentinel at the end, and a pretend API of 95 items
// in pages of 20. Everything the test reads goes through the feed itself.
async function setup(page, { pageSize = 20, total = 95, delay = 30, height = 300, failOn = 0 } = {}) {
   await page.evaluate(async (opts) => {
      document.getElementById('feed-box')?.remove();
      const box = document.createElement('div');
      box.id = 'feed-box';
      box.style.cssText = `height:${opts.height}px;overflow:auto;border:1px solid #ccc`;
      const list = document.createElement('ul');
      list.id = 'feed-list';
      list.style.cssText = 'margin:0;padding:0;list-style:none';
      const sentinel = document.createElement('div');
      sentinel.id = 'feed-sentinel';
      sentinel.style.height = '1px';
      box.append(list, sentinel);
      document.body.append(box);

      const scroller = await slice.build('InfiniteScrollService', { singleton: true });
      const calls = [];
      const states = [];
      let failures = 0;
      const feed = scroller.attach(sentinel, {
         root: box,
         rootMargin: '100px',
         pageSize: opts.pageSize,
         load: async ({ page: p, signal }) => {
            calls.push(p);
            await new Promise((r) => setTimeout(r, opts.delay));
            if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
            if (opts.failOn === p && failures === 0) {
               failures += 1;
               throw new Error('offline');
            }
            const from = (p - 1) * opts.pageSize;
            const items = Array.from({ length: Math.max(0, Math.min(opts.pageSize, opts.total - from)) }, (_, i) => `Item ${from + i + 1}`);
            return { items };
         },
         onItems: (items, info) => {
            if (info.first) list.replaceChildren();
            for (const text of items) {
               const li = document.createElement('li');
               li.textContent = text;
               li.style.cssText = 'height:40px;border-bottom:1px solid #eee';
               list.append(li);
            }
         },
         onStateChange: (state) => states.push(state),
      });
      // The test reads these through the feed, not through the page.
      feed._test = { calls, states, scroller };
   }, { pageSize, total, delay, height, failOn });
}

const feed = (page, fn = (f) => f) => page.evaluate(async (src) => {
   const scroller = await slice.build('InfiniteScrollService', { singleton: true });
   const f = scroller.get(document.getElementById('feed-sentinel'));
   return new Function('feed', `return (${src})(feed)`)(f);
}, fn.toString());

const count = (page) => page.locator('#feed-list li').count();

test.describe('InfiniteScrollService', () => {
   test.beforeEach(async ({ mount }) => {
      await mount('Badge', { label: 'host' });
   });

   test('the first page loads, and fills the box', async ({ page }) => {
      await setup(page);
      await expect.poll(() => count(page)).toBe(20);
      expect(await feed(page, (f) => [f.state, f.page])).toEqual(['idle', 2]);
   });

   test('scrolling to the end loads the next page, one request at a time', async ({ page }) => {
      await setup(page, { delay: 120 });
      await expect.poll(() => count(page)).toBe(20);
      // Hit the end several times while the request is in flight.
      for (let i = 0; i < 4; i++) {
         await page.locator('#feed-box').evaluate((el) => { el.scrollTop = el.scrollHeight; });
         await page.waitForTimeout(20);
      }
      await expect.poll(() => count(page)).toBe(40);
      expect(await feed(page, (f) => f._test.calls)).toEqual([1, 2]);
   });

   test('it stops at the end: a short page means done', async ({ page }) => {
      await setup(page, { total: 45 });
      for (let i = 0; i < 6; i++) {
         await page.locator('#feed-box').evaluate((el) => { el.scrollTop = el.scrollHeight; });
         await page.waitForTimeout(120);
      }
      await expect.poll(() => count(page)).toBe(45);
      expect(await feed(page, (f) => [f.state, f.done, f._test.calls])).toEqual(['done', true, [1, 2, 3]]);
   });

   test('a page that does not fill the box loads the next one by itself', async ({ page }) => {
      await setup(page, { pageSize: 3, height: 400 });
      // 3 items of 40px do not fill 400px: it keeps going until they do.
      await expect.poll(() => count(page)).toBeGreaterThanOrEqual(12);
      expect(await feed(page, (f) => f.state)).toBe('idle');
   });

   test('an error stops it until retry()', async ({ page }) => {
      await setup(page, { failOn: 2 });
      await expect.poll(() => count(page)).toBe(20);
      await page.locator('#feed-box').evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await expect.poll(() => feed(page, (f) => f.state)).toBe('error');
      expect(await feed(page, (f) => f.error.message)).toBe('offline');
      await page.locator('#feed-box').evaluate((el) => { el.scrollTop = 0; el.scrollTop = el.scrollHeight; });
      await page.waitForTimeout(150);
      expect(await feed(page, (f) => f.state)).toBe('error');
      await feed(page, (f) => f.retry());
      await expect.poll(() => count(page)).toBe(40);
   });

   test('reset() aborts the request in flight and starts over; the late answer is dropped', async ({ page }) => {
      await setup(page, { delay: 200 });
      await expect.poll(() => count(page)).toBe(20);
      await page.locator('#feed-box').evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await expect.poll(() => feed(page, (f) => f.state)).toBe('loading');
      // A new search: back to the top, and page 1 again.
      await page.locator('#feed-box').evaluate((el) => { el.scrollTop = 0; });
      await feed(page, (f) => { f.reset(); });
      await page.waitForTimeout(600);
      // Page 2's late answer never landed: 20 items, in order, none twice.
      const texts = await page.locator('#feed-list li').allTextContents();
      expect(texts).toEqual(Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`));
      expect(await feed(page, (f) => f._test.calls.slice(0, 3))).toEqual([1, 2, 1]);
   });

   test('autoLimit: after it, only loadMore() loads', async ({ page }) => {
      await setup(page);
      await expect.poll(() => count(page)).toBe(20);
      await feed(page, (f) => f.configure({ autoLimit: 0 }));
      await page.locator('#feed-box').evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await page.waitForTimeout(200);
      expect(await count(page)).toBe(20);
      await feed(page, (f) => f.loadMore());
      await expect.poll(() => count(page)).toBe(40);
   });

   test('cursor mode: the cursor goes back with the next request, and null ends it', async ({ page }) => {
      await page.evaluate(async () => {
         const sentinel = document.createElement('div');
         sentinel.id = 'cursor-sentinel';
         document.body.append(sentinel);
         const scroller = await slice.build('InfiniteScrollService', { singleton: true });
         const seen = [];
         const f = scroller.attach(sentinel, {
            auto: false,
            load: async ({ cursor }) => {
               seen.push(cursor);
               return cursor === 'b' ? { items: ['z'], cursor: null } : { items: ['x'], cursor: cursor ? 'b' : 'a' };
            },
         });
         f._seen = seen;
      });
      const run = (src) => page.evaluate(async (src) => {
         const scroller = await slice.build('InfiniteScrollService', { singleton: true });
         const f = scroller.get(document.getElementById('cursor-sentinel'));
         return new Function('f', `return (${src})(f)`)(f);
      }, src);
      await run(String((f) => f.loadMore()));
      await run(String((f) => f.loadMore()));
      await run(String((f) => f.loadMore()));
      expect(await run(String((f) => [f._seen, f.state]))).toEqual([[null, 'a', 'b'], 'done']);
   });

   test('detach() stops it and forgets the sentinel', async ({ page }) => {
      await setup(page, { delay: 150 });
      await expect.poll(() => count(page)).toBe(20);
      await page.locator('#feed-box').evaluate((el) => { el.scrollTop = el.scrollHeight; });
      const gone = await page.evaluate(async () => {
         const scroller = await slice.build('InfiniteScrollService', { singleton: true });
         const sentinel = document.getElementById('feed-sentinel');
         scroller.detach(sentinel);
         await new Promise((r) => setTimeout(r, 300));
         return scroller.get(sentinel) === null;
      });
      expect(gone).toBe(true);
      expect(await count(page)).toBe(20);
   });
});