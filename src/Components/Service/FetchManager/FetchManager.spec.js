import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// A pretend server under /__api, answered by Playwright: each test says what
// it answers and reads back what the page sent.
async function server(page, handler) {
   const seen = [];
   await page.route('**/__api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const entry = {
         method: request.method(),
         path: url.pathname.replace('/__api', ''),
         search: url.search,
         headers: request.headers(),
         body: request.postData(),
      };
      seen.push(entry);
      await handler(route, entry, seen.length);
   });
   return seen;
}

const json = (route, status, body, headers = {}) => route.fulfill({
   status, headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
});

// Runs `code` in the page with an `http` built from `props` (plain values:
// tests that need functions in props build the service in the page).
const run = (page, props, code) => page.evaluate(async ([p, src]) => {
   const http = await slice.build('FetchManager', p);
   try {
      return await (0, eval)(`(async (http) => { ${src} })`)(http);
   } finally {
      slice.controller.destroyComponent(http);
   }
}, [props, code]);

test.describe('FetchManager', () => {
   test('get: baseUrl, a query object, and JSON read back', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (route) => json(route, 200, { items: [1, 2], total: 2 }));
      const out = await run(h.page, { baseUrl: '/__api/' }, `
         return http.get('/orders', { query: { page: 2, status: 'open', tags: ['a', 'b'], empty: '', none: null } });
      `);
      expect(out).toEqual({ items: [1, 2], total: 2 });
      expect(seen[0].method).toBe('GET');
      expect(seen[0].path).toBe('/orders');
      expect(seen[0].search).toBe('?page=2&status=open&tags=a&tags=b');
      expect(seen[0].headers.accept).toContain('application/json');
   });

   test('post / patch: an object goes as JSON; FormData as it is', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (route, req) => json(route, 201, { ok: true, method: req.method }));
      const out = await run(h.page, { baseUrl: '/__api' }, `
         const a = await http.post('/orders', { customer: 'Ana', total: 12.5 });
         const b = await http.patch('/orders/7', { status: 'paid' });
         const form = new FormData(); form.append('name', 'photo');
         await http.post('/files', form);
         return [a, b];
      `);
      expect(out).toEqual([{ ok: true, method: 'POST' }, { ok: true, method: 'PATCH' }]);
      expect(seen[0].headers['content-type']).toBe('application/json');
      expect(JSON.parse(seen[0].body)).toEqual({ customer: 'Ana', total: 12.5 });
      expect(seen[1].method).toBe('PATCH');
      expect(seen[2].headers['content-type']).toMatch(/^multipart\/form-data/);
   });

   test('a failed answer throws an HttpError with status, body and the server\'s message', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await server(h.page, (route) => json(route, 422, { message: 'That email is already in use.', field: 'email' }));
      const out = await run(h.page, { baseUrl: '/__api' }, `
         try { await http.post('/users', { email: 'a@b.c' }); return 'no error'; }
         catch (e) { return { isHttp: e instanceof http.HttpError, name: e.name, kind: e.kind, status: e.status, message: e.message, body: e.body, method: e.method, url: e.url }; }
      `);
      expect(out).toMatchObject({
         isHttp: true, name: 'HttpError', kind: 'http', status: 422, method: 'POST',
         message: 'That email is already in use.', body: { message: 'That email is already in use.', field: 'email' },
      });
      expect(out.url).toBe('/__api/users');
   });

   test('the answer is read by its type: nothing (204), text, JSON', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await server(h.page, (route, req) => {
         if (req.path === '/empty') return route.fulfill({ status: 204 });
         if (req.path === '/text') return route.fulfill({ status: 200, headers: { 'content-type': 'text/plain' }, body: 'pong' });
         return json(route, 200, { a: 1 });
      });
      const out = await run(h.page, { baseUrl: '/__api' }, `
         return [await http.delete('/empty'), await http.get('/text'), await http.get('/json')];
      `);
      expect(out).toEqual([null, 'pong', { a: 1 }]);
   });

   test('timeout: an HttpError of kind "timeout"; your own signal: an AbortError', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await server(h.page, async (route) => {
         await new Promise((r) => setTimeout(r, 600));
         await json(route, 200, {}).catch(() => {});
      });
      const out = await run(h.page, { baseUrl: '/__api', timeout: 150 }, `
         let timeout, abort;
         try { await http.get('/slow'); } catch (e) { timeout = { kind: e.kind, isHttp: e instanceof http.HttpError }; }
         const controller = new AbortController();
         setTimeout(() => controller.abort(), 50);
         try { await http.get('/slow', { signal: controller.signal, timeout: 5000 }); } catch (e) { abort = { name: e.name, isHttp: e instanceof http.HttpError }; }
         return { timeout, abort };
      `);
      expect(out.timeout).toEqual({ kind: 'timeout', isHttp: true });
      expect(out.abort).toEqual({ name: 'AbortError', isHttp: false });
   });

   test('no answer at all: kind "network"', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      await server(h.page, (route) => route.abort('internetdisconnected'));
      const out = await run(h.page, { baseUrl: '/__api' }, `
         try { await http.get('/x'); } catch (e) { return { kind: e.kind, status: e.status }; }
      `);
      expect(out).toEqual({ kind: 'network', status: 0 });
   });

   test('retry: a GET tries again on 503; a POST never does', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (route, req, n) => (n < 3 && req.method === 'GET'
         ? json(route, 503, { message: 'busy' })
         : (req.method === 'POST' ? json(route, 503, { message: 'busy' }) : json(route, 200, { ok: true }))));
      const out = await run(h.page, { baseUrl: '/__api', retry: { attempts: 3, delay: 10 } }, `
         const got = await http.get('/flaky');
         let post;
         try { await http.post('/flaky', { a: 1 }); } catch (e) { post = e.status; }
         return { got, post };
      `);
      expect(out).toEqual({ got: { ok: true }, post: 503 });
      expect(seen.filter((r) => r.method === 'GET')).toHaveLength(3);
      expect(seen.filter((r) => r.method === 'POST')).toHaveLength(1);
   });

   test('onRequest adds a token; onResponseError sees every failure once', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (route) => json(route, 401, { message: 'Sign in again.' }));
      const out = await h.page.evaluate(async () => {
         const errors = [];
         const http = await slice.build('FetchManager', {
            baseUrl: '/__api',
            onRequest: (req) => { req.headers.Authorization = 'Bearer abc'; },
            onResponseError: (error) => { errors.push(error.status); },
         });
         try { await http.get('/me'); } catch { /* expected */ }
         slice.controller.destroyComponent(http);
         return errors;
      });
      expect(out).toEqual([401]);
      expect(seen[0].headers.authorization).toBe('Bearer abc');
   });

   test('the old request() still works as before, and warns once', async ({ mountHtml }) => {
      const h = await mountHtml('<div></div>');
      const seen = await server(h.page, (route, req) => (req.path === '/bad'
         ? json(route, 500, { message: 'boom' })
         : json(route, 200, { method: req.method, n: Math.random() })));
      const out = await h.page.evaluate(async () => {
         const warnings = [];
         const listener = slice.logger.onLog((log) => { if (String(log.message).includes('deprecated')) warnings.push(log.message); });
         const http = await slice.build('FetchManager', { baseUrl: '/__api' });
         const calls = [];
         const bad = await http.request('GET', null, '/bad', () => calls.push('ok'), (d, res) => calls.push(`error ${res.status}`));
         http.enableCache();
         const first = await http.request('GET', null, '/orders');
         const again = await http.request('GET', null, '/orders');
         const posted = await http.request('POST', { a: 1 }, '/orders');
         slice.logger.offLog?.(listener);
         slice.controller.destroyComponent(http);
         return { bad, calls, sameCached: first.n === again.n, postMethod: posted.method, warnings: warnings.length };
      });
      expect(out).toEqual({ bad: { message: 'boom' }, calls: ['error 500'], sameCached: true, postMethod: 'POST', warnings: 1 });
      expect(seen.filter((r) => r.path === '/orders')).toHaveLength(2);
   });
});
