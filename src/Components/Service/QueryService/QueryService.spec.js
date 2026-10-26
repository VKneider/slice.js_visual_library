import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// A pretend server under /__api: answers what `handler` says, counts requests.
async function server(page, handler, delay = 60) {
   const seen = [];
   await page.route('**/__api/**', async (route) => {
      const url = new URL(route.request().url());
      const entry = { method: route.request().method(), path: url.pathname.replace('/__api', ''), search: url.search };
      seen.push(entry);
      await new Promise((r) => setTimeout(r, delay));
      const [status, body] = handler(entry, seen.length);
      await route.fulfill({ status, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
   });
   return seen;
}

// Runs `code` with `http` (FetchManager) and `queries` (QueryService), then
// destroys both.
const run = (page, props, code) => page.evaluate(async ([p, src]) => {
   const http = await slice.build('FetchManager', { baseUrl: '/__api' });
   const queries = await slice.build('QueryService', { ...p, http });
   const wait = (ms) => new Promise((r) => setTimeout(r, ms));
   try {
      return await (0, eval)(`(async (http, queries, wait) => { ${src} })`)(http, queries, wait);
   } finally {
      slice.controller.destroyComponent(queries);
      slice.controller.destroyComponent(http);
   }
}, [props, code]);

test.describe('QueryService', () => {
   test('the same key asked at once is one request; key objects in any order are the same key', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, () => [200, [{ id: 1 }]]);
      const out = await run(h.page, {}, `
         const fn = ({ signal }) => http.get('/orders', { signal });
         const a = queries.query(['orders', { status: 'open', page: 1 }], fn);
         const b = queries.query(['orders', { page: 1, status: 'open' }], fn);
         const [x, y] = await Promise.all([a.load(), b.load(), a.load()]);
         return { same: a === b, x, y, status: a.state.status, fetching: a.state.fetching };
      `);
      expect(out).toEqual({ same: true, x: [{ id: 1 }], y: [{ id: 1 }], status: 'ready', fetching: false });
      expect(seen).toHaveLength(1);
   });

   test('fresh data is not asked again; stale data is, and refresh() always asks', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (_, n) => [200, { n }], 10);
      const out = await run(h.page, { staleTime: 150 }, `
         const q = queries.get(['me'], '/me');
         const first = await q.load();
         const fresh = await q.load();          // fresh: from memory
         await wait(200);
         const stale = await q.load();          // stale: asks
         const forced = await q.refresh();
         return [first.n, fresh.n, stale.n, forced.n];
      `);
      expect(out).toEqual([1, 1, 2, 3]);
      expect(seen).toHaveLength(3);
   });

   test('watch(): the state now and on every change; stale data stays shown while it refreshes', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await server(h.page, (_, n) => [200, { n }]);
      const out = await run(h.page, { staleTime: 0 }, `
         const host = await slice.build('Badge', { value: 'x' });
         const seen = [];
         const q = queries.get(['me'], '/me');
         q.watch(host, (s) => seen.push([s.status, s.fetching, s.data?.n ?? null]));
         await q.load();
         await q.refresh();
         slice.controller.destroyComponent(host);
         await q.refresh();                      // nobody watches now
         return seen;
      `);
      expect(out).toEqual([
         ['idle', false, null],
         ['loading', true, null],
         ['ready', false, 1],
         ['ready', true, 1],                       // refreshing: old data still there
         ['ready', false, 2],
      ]);
   });

   test('mutate() invalidates a prefix: what is watched asks again, the rest waits until it is used', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (req, n) => [200, req.method === 'PATCH' ? { ok: true } : { n }], 20);
      const out = await run(h.page, {}, `
         const host = await slice.build('Badge', { value: 'x' });
         const list = queries.get(['orders', 'list'], '/orders');
         const one = queries.get(['orders', 7], '/orders/7');
         const users = queries.get(['users'], '/users');
         list.watch(host, () => {});
         await Promise.all([list.load(), one.load(), users.load()]);
         await queries.mutate(() => http.patch('/orders/7', { status: 'paid' }), { invalidates: [['orders']] });
         await wait(80);
         const result = {
            listN: list.data.n,
            oneStale: one.data.n,                // not watched: still the old data
            oneNext: (await one.load()).n,       // used again: asks
            usersSame: (await users.load()).n,   // other prefix: untouched
         };
         slice.controller.destroyComponent(host);
         return result;
      `);
      expect(out.listN).toBeGreaterThan(3);
      expect(out.oneNext).toBeGreaterThan(out.oneStale);
      expect(out.usersSame).toBeLessThanOrEqual(3);
      expect(seen.filter((r) => r.path === '/orders')).toHaveLength(2);
      expect(seen.filter((r) => r.path === '/users')).toHaveLength(1);
   });

   test('errors: kept in the state; a 500 is retried, a 404 is not', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (req, n) => (req.path === '/missing' ? [404, { message: 'Not found' }]
         : (n < 3 ? [500, { message: 'busy' }] : [200, { ok: true }])), 5);
      const out = await run(h.page, { retry: 2, retryDelay: 10 }, `
         const missing = queries.get(['missing'], '/missing');
         let error;
         try { await missing.load(); } catch (e) { error = e.status; }
         const flaky = queries.get(['flaky'], '/flaky');
         const data = await flaky.load();
         return { error, state: [missing.state.status, missing.state.error?.status], data };
      `);
      expect(out).toEqual({ error: 404, state: ['error', 404], data: { ok: true } });
      expect(seen.filter((r) => r.path === '/missing')).toHaveLength(1);
      expect(seen.filter((r) => r.path === '/flaky')).toHaveLength(2);
   });

   test('a change tells only who watches that query; remove() leaves them idle; nothing in slice.context', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const out = await run(h.page, {}, `
         const a = await slice.build('Badge', { value: 'a' });
         const b = await slice.build('Badge', { value: 'b' });
         const calls = { cart: [], user: [] };
         queries.query(['cart']).watch(a, (s) => calls.cart.push(s.data?.items ?? null));
         queries.query(['user']).watch(b, (s) => calls.user.push(s.data?.name ?? null));
         queries.setData(['cart'], { items: 1 });
         queries.setData(['cart'], (cart) => ({ ...cart, items: cart.items + 1 }));
         const data = queries.getData(['cart']);
         queries.remove(['cart']);
         const contexts = ['queries'].filter((name) => slice.context.has(name));
         slice.controller.destroyComponent(a);
         const inspected = queries.inspect().map((q) => ({ key: q.key, status: q.status, watchers: q.watchers }));
         slice.controller.destroyComponent(b);
         return { calls, data, after: queries.getData(['cart']), contexts, inspected };
      `);
      expect(out).toEqual({
         calls: { cart: [null, 1, 2, null], user: [null] },
         data: { items: 2 },
         after: undefined,
         contexts: [],
         // 'cart' was still watched when removed: kept, empty, until it is collected.
         inspected: [{ key: ['cart'], status: 'idle', watchers: 0 }, { key: ['user'], status: 'idle', watchers: 1 }],
      });
   });

   test('a caller that aborts stops the request when nobody else waits for it', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await server(h.page, () => [200, { ok: true }], 400);
      const out = await run(h.page, {}, `
         const q = queries.get(['slow'], '/slow');
         const controller = new AbortController();
         const pending = q.load({ signal: controller.signal });
         await wait(50);
         controller.abort();
         let name;
         try { await pending; } catch (e) { name = e.name; }
         await wait(20);
         return { name, status: q.state.status, fetching: q.state.fetching };
      `);
      expect(out).toEqual({ name: 'AbortError', status: 'idle', fetching: false });
   });

   test('loader(): a DataList load, cached per query and reloaded by an invalidation', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (req, n) => [200, { items: [{ id: 1, name: `Order ${n}` }], total: 1 }], 20);
      const out = await h.page.evaluate(async () => {
         const http = await slice.build('FetchManager', { baseUrl: '/__api' });
         const queries = await slice.build('QueryService', { http });
         const list = await slice.build('DataList', {
            load: queries.loader(['orders', 'list'], (query, { signal }) => http.get('/orders', { query: { page: query.page }, signal })),
            itemKey: 'id',
            title: 'name',
         });
         document.body.append(list);
         const text = () => list.querySelector('.slice-data-list__items')?.textContent.trim();
         const until = async (check) => { for (let i = 0; i < 60 && !check(); i += 1) await new Promise((r) => setTimeout(r, 25)); };
         await until(() => text()?.includes('Order 1'));
         const first = text();
         queries.invalidate(['orders']);
         await until(() => text()?.includes('Order 2'));
         const second = text();
         slice.controller.destroyComponent(list);
         queries.invalidate(['orders']);       // gone: nothing listens
         await new Promise((r) => setTimeout(r, 80));
         slice.controller.destroyComponent(queries);
         slice.controller.destroyComponent(http);
         return { first, second };
      });
      expect(out.first).toContain('Order 1');
      expect(out.second).toContain('Order 2');
      expect(seen).toHaveLength(2);
   });
});
