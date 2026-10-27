import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

// The harness page with a #log, opened AFTER the routes are set: Playwright
// routes WebSockets through a script it injects when the page loads.
async function open(page) {
   await page.goto('/__test');
   await page.waitForFunction(() => !!window.slice?.router, null, { timeout: 30_000 });
   await page.waitForSelector('[data-test-root]', { state: 'attached' });
   await page.evaluate(() => { document.querySelector('[data-test-root]').innerHTML = '<pre id="log"></pre>'; });
   return { page };
}

// A pretend WebSocket server (Playwright answers ws://live.test/*): it keeps
// every connection, and records what the page sent. Set it before open().
async function wsServer(page, onConnect = () => {}) {
   const server = { sockets: [], received: [], times: [] };
   await page.routeWebSocket('ws://live.test/**', (ws) => {
      server.sockets.push(ws);
      server.times.push(Date.now());
      ws.onMessage((message) => server.received.push(String(message)));
      onConnect(ws, server.sockets.length);
   });
   return server;
}

// Builds the service as 'live' and a host component as 'live-host' (found
// again later with slice.controller.getComponent, nothing on window). Every
// message a listener gets, and every status, is written to #log.
const setup = (page, props, listen = []) => page.evaluate(async ([p, channels]) => {
   const log = document.getElementById('log');
   const write = (entry) => { log.textContent += `${JSON.stringify(entry)}\n`; };
   const { frames, ...rest } = p;
   const live = await slice.build('RealtimeService', {
      sliceId: 'live',
      ...rest,
      ...(frames ? { subscribe: (channel) => ({ op: 'sub', channel }), unsubscribe: (channel) => ({ op: 'unsub', channel }) } : {}),
   });
   const host = await slice.build('Badge', { sliceId: 'live-host', label: 'host' });
   document.body.append(host);
   live.watch(host, (status, info) => write({ status, reconnected: info.reconnected }));
   for (const channel of channels) live.on(channel, host, (message, meta) => write({ on: channel, channel: meta.channel, message }));
}, [props, listen]);

const entries = async (page) => (await page.locator('#log').textContent()).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
const until = async (page, check) => expect.poll(async () => check(await entries(page)), { timeout: 5000 }).toBe(true);
const inPage = (page, code) => page.evaluate((src) => (0, eval)(`(async () => {
   const live = slice.controller.getComponent('live');
   const host = slice.controller.getComponent('live-host');
   ${src}
})()`), code);

test.describe('RealtimeService', () => {
   test('the first listener connects; messages go to their channel, a family ("order.*") and "*"', async ({ page }) => {
      const server = await wsServer(page);
      const h = await open(page);
      await setup(h.page, { url: 'ws://live.test/socket' }, ['order.updated', 'order.*', '*']);
      await until(h.page, (log) => log.some((e) => e.status === 'open'));
      server.sockets[0].send(JSON.stringify({ type: 'order.updated', id: 7 }));
      server.sockets[0].send(JSON.stringify({ channel: 'user.joined', name: 'Ana' }));
      server.sockets[0].send('plain text');
      await until(h.page, (log) => log.filter((e) => e.on).length === 5);
      const log = await entries(h.page);
      expect(log.filter((e) => e.status).map((e) => e.status)).toEqual(['idle', 'connecting', 'open']);
      expect(log.filter((e) => e.on).map((e) => [e.on, e.channel])).toEqual([
         ['order.updated', 'order.updated'], ['order.*', 'order.updated'], ['*', 'order.updated'],
         ['*', 'user.joined'],
         ['*', 'message'],
      ]);
      expect(log.find((e) => e.on === 'order.updated').message).toEqual({ type: 'order.updated', id: 7 });
      expect(log.filter((e) => e.on === '*').at(-1).message).toBe('plain text');
   });

   test('send(): now when open, queued while connecting; subscribe frames on the first listener, again after a reconnect, unsubscribe on the last', async ({ page }) => {
      const server = await wsServer(page);
      const h = await open(page);
      // Functions cannot cross into the page as props: the frames are made there.
      await setup(h.page, { url: 'ws://live.test/socket', reconnect: { delay: 50, jitter: false }, frames: true }, ['room.7']);
      await inPage(h.page, `live.send({ op: 'hello' });`);       // still connecting: queued
      await until(h.page, (log) => log.some((e) => e.status === 'open'));
      await expect.poll(() => server.received.length).toBe(2);
      expect(server.received.map((m) => JSON.parse(m))).toEqual([{ op: 'sub', channel: 'room.7' }, { op: 'hello' }]);

      const sentNow = await inPage(h.page, `return live.send({ op: 'typing' });`);
      expect(sentNow).toBe(true);
      server.sockets[0].close();
      await until(h.page, (log) => log.filter((e) => e.status === 'open').length === 2);
      await expect.poll(() => server.received.length).toBe(4);
      expect(JSON.parse(server.received[3])).toEqual({ op: 'sub', channel: 'room.7' });   // again, on the new connection

      await inPage(h.page, `slice.controller.destroyComponent(host);`);   // its listener goes…
      await inPage(h.page, `const other = await slice.build('Badge', { label: 'x' }); live.on('room.8', other, () => {});`);
      await expect.poll(() => server.received.slice(4).map((m) => JSON.parse(m))).toEqual([
         { op: 'sub', channel: 'room.8' }, { op: 'unsub', channel: 'room.7' },
      ]);
   });

   test('reconnects with growing waits after a drop (also when the server drops it at once), and says so; disconnect() stays closed', async ({ page }) => {
      // Connections 2 and 3 are dropped by the server as soon as they arrive.
      const server = await wsServer(page, (ws, n) => { if (n === 2 || n === 3) setTimeout(() => ws.close(), 0); });
      const h = await open(page);
      await setup(h.page, { url: 'ws://live.test/socket', reconnect: { delay: 60, factor: 2, jitter: false } }, ['*']);
      await until(h.page, (log) => log.some((e) => e.status === 'open'));
      server.sockets[0].close();
      await expect.poll(() => server.sockets.length, { timeout: 5000 }).toBe(4);
      await until(h.page, (log) => log.at(-1).status === 'open');
      const gaps = server.times.slice(1).map((t, i) => t - server.times[i]);
      // After the first drop: 60, then 120, then 240 ms (the quick drops do not reset the waits).
      expect(gaps[1]).toBeGreaterThanOrEqual(120 - 15);
      expect(gaps[2]).toBeGreaterThanOrEqual(240 - 15);
      const statuses = (await entries(h.page)).filter((e) => e.status);
      expect(statuses.at(-1)).toEqual({ status: 'open', reconnected: true });
      expect(statuses.some((e) => e.status === 'reconnecting')).toBe(true);

      await inPage(h.page, `live.disconnect();`);
      await h.page.waitForTimeout(400);
      expect(server.sockets).toHaveLength(4);
      expect((await entries(h.page)).filter((e) => e.status).at(-1).status).toBe('closed');
   });

   test('gives up after `attempts`, and connect() tries again', async ({ page }) => {
      const server = await wsServer(page, (ws, n) => { if (n > 1 && n < 5) setTimeout(() => ws.close(), 0); });
      const h = await open(page);
      await setup(h.page, { url: 'ws://live.test/socket', reconnect: { delay: 20, attempts: 2, jitter: false } }, ['*']);
      await until(h.page, (log) => log.some((e) => e.status === 'open'));
      server.sockets[0].close();
      await until(h.page, (log) => log.at(-1).status === 'closed');
      expect(server.sockets).toHaveLength(3);
      await inPage(h.page, `live.connect().catch(() => {});`);
      await expect.poll(() => server.sockets.length, { timeout: 5000 }).toBe(5);
      await until(h.page, (log) => log.at(-1).status === 'open');
   });

   test('invalidates(): a message makes queries stale, and so does a reconnect (what changed while offline)', async ({ page }) => {
      const server = await wsServer(page);
      const h = await open(page);
      await h.page.evaluate(async () => {
         const log = document.getElementById('log');
         const queries = await slice.build('QueryService', { sliceId: 'live-queries' });
         const live = await slice.build('RealtimeService', { sliceId: 'live', url: 'ws://live.test/socket', queries, reconnect: { delay: 30, jitter: false } });
         const host = await slice.build('Badge', { sliceId: 'live-host', label: 'host' });
         let asked = 0;
         const orders = queries.query(['orders', 'list'], async () => { asked += 1; return asked; });
         orders.watch(host, (state) => { if (state.status === 'ready' && !state.fetching) log.textContent += `${JSON.stringify({ data: state.data })}\n`; });
         orders.load();
         live.invalidates('order.*', host, ['orders']);
         live.watch(host, (status) => { log.textContent += `${JSON.stringify({ status })}\n`; });
      });
      await until(h.page, (log) => log.some((e) => e.status === 'open') && log.some((e) => e.data === 1));
      server.sockets[0].send(JSON.stringify({ type: 'order.updated', id: 3 }));
      await until(h.page, (log) => log.some((e) => e.data === 2));
      server.sockets[0].send(JSON.stringify({ type: 'user.joined' }));          // another channel: nothing
      server.sockets[0].close();                                                 // a reconnect: asked again
      await until(h.page, (log) => log.some((e) => e.data === 3));
      await h.page.waitForTimeout(150);
      expect((await entries(h.page)).filter((e) => 'data' in e).map((e) => e.data)).toEqual([1, 2, 3]);
   });

   test('Server-Sent Events: named events and plain messages; the stream ending is a reconnect that resumes from the last event id', async ({ mountHtml }) => {
      const h = await mountHtml('<pre id="log"></pre>');
      const asked = [];
      await h.page.route('**/__live/events**', (route) => {
         const url = new URL(route.request().url());
         asked.push(url.searchParams.get('lastEventId'));
         const n = asked.length;
         return route.fulfill({
            status: 200,
            headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
            body: `id: ${n}-a\nevent: order.updated\ndata: {"id":${n}}\n\nid: ${n}-b\ndata: {"type":"user.joined","name":"Ana"}\n\n`,
         });
      });
      await setup(h.page, { url: '/__live/events?room=7', reconnect: { delay: 50, jitter: false } }, ['order.updated', 'user.*']);
      await until(h.page, (log) => log.filter((e) => e.on === 'order.updated').length >= 2);
      const log = await entries(h.page);
      expect(log.find((e) => e.on === 'order.updated').message).toEqual({ id: 1 });
      expect(log.find((e) => e.on === 'user.*')).toMatchObject({ channel: 'user.joined', message: { type: 'user.joined', name: 'Ana' } });
      expect(log.some((e) => e.status === 'reconnecting')).toBe(true);
      // The first connection had no id to give; the next one resumes after "1-b".
      expect(asked.slice(0, 2)).toEqual([null, '1-b']);
      const state = await inPage(h.page, `
         let sendError = '';
         try { live.send('x'); } catch (e) { sendError = e.message; }
         const id = live.lastEventId;
         live.disconnect();
         return { sendError, id };
      `);
      expect(state.sendError).toContain('Server-Sent Events only listen');
      expect(state.id).toMatch(/^\d+-b$/);
   });

   test('SSE: a stored lastEventId resumes the first connection; lastEventIdParam names it, or null leaves it out', async ({ mountHtml }) => {
      const h = await mountHtml('<pre id="log"></pre>');
      const urls = [];
      await h.page.route('**/__live/**', (route) => {
         urls.push(new URL(route.request().url()).search);
         return route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: 'id: 9\ndata: {"type":"ping"}\n\n' });
      });
      await h.page.evaluate(async () => {
         const host = await slice.build('Badge', { label: 'host' });
         const a = await slice.build('RealtimeService', { url: '/__live/a', lastEventId: '41', lastEventIdParam: 'since', reconnect: false });
         const b = await slice.build('RealtimeService', { url: '/__live/b', lastEventId: '41', lastEventIdParam: null, reconnect: false });
         a.on('*', host, () => {});
         b.on('*', host, () => {});
         await new Promise((r) => setTimeout(r, 400));
         a.disconnect();
         b.disconnect();
      });
      expect(urls).toContain('?since=41');
      expect(urls).toContain('');
   });

   test('heartbeat: a connection that stops answering is replaced', async ({ page }) => {
      const server = await wsServer(page);
      const h = await open(page);
      await setup(h.page, { url: 'ws://live.test/socket', heartbeat: { interval: 100, timeout: 50, message: { op: 'ping' } }, reconnect: { delay: 20, jitter: false } }, ['*']);
      await until(h.page, (log) => log.filter((e) => e.status === 'open').length >= 2);   // the server never answers the pings
      expect(server.received.filter((m) => m === '{"op":"ping"}').length).toBeGreaterThanOrEqual(1);
      expect(server.sockets.length).toBeGreaterThanOrEqual(2);
      await inPage(h.page, `live.disconnect();`);
   });

   test('offline: it waits for the network instead of retrying, and reconnects as soon as it is back', async ({ page, context }) => {
      const server = await wsServer(page);
      const h = await open(page);
      await setup(h.page, { url: 'ws://live.test/socket', reconnect: { delay: 20, jitter: false } }, ['*']);
      await until(h.page, (log) => log.some((e) => e.status === 'open'));
      await context.setOffline(true);
      server.sockets[0].close();
      await until(h.page, (log) => log.at(-1).status === 'reconnecting');
      await h.page.waitForTimeout(200);
      expect(server.sockets).toHaveLength(1);                     // no attempts while offline
      await context.setOffline(false);
      await until(h.page, (log) => log.filter((e) => e.status === 'open').length >= 2);
      expect(server.sockets).toHaveLength(2);
   });
});