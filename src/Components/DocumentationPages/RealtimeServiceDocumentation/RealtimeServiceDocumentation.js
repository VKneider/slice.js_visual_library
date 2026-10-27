export default class RealtimeServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [];
  }

  async init() {
    this.markdownPath = "realtime-service.md";
    this.markdownContent = "---\ntitle: RealtimeService\nroute: /docs/services/realtime-service\nnavLabel: RealtimeService\nsection: Services\ngroup: Networking\norder: 32\ndescription: What the server tells the app without being asked. A WebSocket or Server-Sent Events connection that stays up — reconnecting with growing waits, channels with listeners that go with their component, subscribe frames sent again after a reconnect, a send queue, a heartbeat — and messages that make QueryService queries stale.\ncomponent: RealtimeServiceDocumentation\ngenerate: true\ntags: [service, websocket, sse, server-sent events, realtime, live, push, reconnect, subscribe, channels, query, invalidate]\n---\n\n# RealtimeService\n\n## Overview\n`RealtimeService` keeps a connection to the server open so the server can tell the app when something changes: a WebSocket, or Server-Sent Events (SSE).\n\n```js\nconst live = await slice.build('RealtimeService', {\n  singleton: true,\n  sliceId: 'live',\n  url: 'wss://api.example.com/live',\n  queries,                                   // a QueryService\n});\n\nlive.invalidates('order.*', this, ['orders']);           // lists and counters of orders ask again\nlive.on('chat.message', this, (message) => this.append(message));\nlive.watch(this, (status) => { this.$status.tone = status === 'open' ? 'success' : 'warning'; });\n```\n\nIt completes the data layer of [Data and the first load](/docs/guides/data-and-loading#layers-transport-cache-and-your-domain): [FetchManager](/docs/services/fetch-manager) asks, [QueryService](/docs/services/query-service) keeps, and RealtimeService says when what is kept changed.\n\nWhat it takes care of:\n\n- **Connecting and staying connected.** It connects when the first listener arrives (or on `connect()`). When the connection drops it reconnects, waiting longer each time (1 s, 2 s, 4 s… up to 30 s, with jitter), at once when the network comes back, and not at all while the browser is offline. A server that accepts and drops at once does not reset the waits.\n- **Channels.** A message goes to the listeners of its channel: `message.channel`, `.type` or `.event` (or the event name in SSE). `'order.*'` listens to a family, `'*'` to everything.\n- **Cleanup.** Every listener belongs to a component and goes with it.\n- **Subscriptions.** With `subscribe`/`unsubscribe`, the server is told which channels have listeners: when a channel gets its first, when it loses its last, and again after every reconnect.\n- **Sending** (WebSocket): `send()` while disconnected waits in a queue and goes out when the connection opens.\n- **Queries.** `invalidates()` makes QueryService queries stale on a message, and after every reconnect, because what changed while the app was offline was never announced.\n- **Resuming SSE.** The id of the last event (`id:` in the stream) is sent again on reconnect as `?lastEventId=…`, so the server can replay what was missed.\n- **A heartbeat** that notices a connection that died without closing (a laptop waking up, a proxy that drops idle sockets).\n- **The status**, to show it: `idle`, `connecting`, `open`, `reconnecting`, `closed`.\n\n### When to use it\n- Data that changes on the server while people look at it: orders arriving, a ticket assigned, a build finishing, sensors, prices.\n- Several people on the same thing: chat, presence (\"Ana is viewing\"), \"someone else edited this record\".\n- Notifications the server decides to send.\n\n### When not to use it\n- Data that is fine a few seconds late: QueryService's `staleTime` and its refresh when the tab comes back are simpler and cheaper.\n- One answer to one question: [FetchManager](/docs/services/fetch-manager).\n- Long work you start and wait for (an export): ask with FetchManager, then either poll its status or let the server announce it here.\n\n### WebSocket or Server-Sent Events\n| | WebSocket (`ws://`, `wss://`) | Server-Sent Events (`http://`, `https://`, a path) |\n| --- | --- | --- |\n| Direction | both ways: `send()` works | server → app only |\n| Server | needs WebSocket support | any HTTP server that streams `text/event-stream` |\n| Through proxies and firewalls | sometimes blocked | it is plain HTTP |\n| Cookies | sent on connect | sent; `withCredentials: true` for another origin |\n| Custom headers (`Authorization`) | not on the handshake | not at all (`EventSource` cannot): use a cookie or a token in the URL |\n| Missed messages | ask again (`invalidates()`) | replayed from `lastEventId`, if the server keeps them |\n\nThe transport follows the URL; pass `transport` when the URL is a function.\n\n## Build it\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n| `url` | `string \\| () => string` | — | Where to connect. A function is called on every (re)connect: put a fresh token in it. |\n| `transport` | `'websocket' \\| 'sse'` | from the URL | Needed when `url` is a function. |\n| `protocols` | `string \\| string[]` | — | WebSocket subprotocols. |\n| `withCredentials` | `boolean` | `false` | SSE: send cookies to another origin. |\n| `lastEventId` | `string` | `''` | SSE: resume from this event id on the first connection (one you stored, for example with StorageService). |\n| `lastEventIdParam` | `string \\| null` | `'lastEventId'` | SSE: the query parameter that carries the last event id on reconnect. `null`: do not send it. |\n| `reconnect` | `false \\| { delay, maxDelay, factor, attempts, jitter, stableAfter }` | `1000, 30000, 2, Infinity, true, 5000` | The waits between attempts. `stableAfter`: ms the connection must stay open before the waits start small again. `false`: never reconnect. |\n| `heartbeat` | `{ interval, timeout, message }` | — | WebSocket: send `message` every `interval` ms; nothing heard for `interval + timeout` means the connection is dead, and it reconnects. |\n| `subscribe` / `unsubscribe` | `(channel) => frame` | — | The frames that tell the server which channels to send. |\n| `parse` | `(data) => message` | JSON, or the text as it is | How an incoming message is read. |\n| `serialize` | `(message) => data` | JSON (strings as they are) | How `send()` writes. |\n| `channelOf` | `(message) => string` | `channel ?? type ?? event` | The channel of a message. |\n| `queueLimit` | `number` | `100` | Messages `send()` keeps while disconnected; the oldest go first. |\n| `autoConnect` | `boolean` | `true` | Connect with the first listener (or the first `send()`). `false`: only `connect()` does. |\n| `queries` | QueryService | — | For `invalidates()`. |\n\n## Methods\n| Method | Returns | Description |\n| --- | --- | --- |\n| `on(channel, component, handler)` | `() => void` | `handler(message, { channel, event, id })` for every message of the channel, while `component` lives. `id`: the SSE event id. |\n| `invalidates(channel, component, keys, { onReconnect = true }?)` | `() => void` | Messages of the channel invalidate `keys` (`['orders']`, several as `[['orders'], ['stats']]`, or `(message) => keys`). Fixed keys are invalidated after every reconnect too. |\n| `watch(component, callback)` | `() => void` | `callback(status, { attempt, retryIn, reconnected })` now and on every change. |\n| `send(message)` | `boolean` | WebSocket only. `true`: sent now; `false`: queued until the connection opens. |\n| `connect()` | `Promise<void>` | Opens it; resolves when it is open. Also starts again after `disconnect()` or after the attempts ran out. |\n| `disconnect()` | — | Closes it and does not reconnect. Listeners stay for a later `connect()`. |\n| `status` | `string` | `idle`, `connecting`, `open`, `reconnecting` or `closed`. |\n| `lastEventId` | `string` | SSE: the id of the last event received. |\n\n## Examples\n\n### Orders that update themselves\nThe table loads through QueryService; the server announces changes, and the table asks again. Nothing in the page handles the messages one by one.\n\n```js\n// OrdersService (one Service per domain, see the guide)\nexport default class OrdersService {\n  async init() {\n    this.http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });\n    this.queries = await slice.build('QueryService', { singleton: true, sliceId: 'queries', http: this.http });\n    this.live = await slice.build('RealtimeService', {\n      singleton: true, sliceId: 'live', url: '/api/events', queries: this.queries,\n    });\n  }\n\n  loader() {\n    return this.queries.loader(['orders', 'list'], (params, { signal }) => this.http.get('/orders', { query: params, signal }));\n  }\n\n  // \"order.created\", \"order.updated\", \"order.deleted\": every list and counter of orders asks again.\n  followChanges(component) {\n    return this.live.invalidates('order.*', component, ['orders']);\n  }\n}\n\n// The page\nthis.orders = await slice.build('OrdersService', { singleton: true, sliceId: 'orders' });\nthis.$table = await slice.build('Table', { load: this.orders.loader(), columns: COLUMNS, rowKey: 'id' });\nthis.orders.followChanges(this);\n```\n\nThe server only has to send `{ \"type\": \"order.updated\", \"id\": 42 }`. When the connection comes back after a drop, the orders are asked again anyway.\n\n### Only what changed\nWhen a message carries the new record, put it in the query instead of asking the server again.\n\n```js\nlive.on('order.updated', this, (message) => {\n  queries.setData(['orders', 'one', message.order.id], message.order);   // the detail, at once\n  queries.invalidate(['orders', 'list']);                                // the lists, which may reorder\n});\n```\n\n### A chat room, with subscribe frames\nThe server sends a room's messages only to connections subscribed to it. The service sends the frames when a component starts listening, when the last one stops, and again after every reconnect.\n\n```js\nconst live = await slice.build('RealtimeService', {\n  singleton: true,\n  sliceId: 'live',\n  url: () => `wss://chat.example.com/socket?token=${session.token}`,   // a fresh token on every connect\n  transport: 'websocket',\n  subscribe: (channel) => ({ op: 'join', room: channel }),\n  unsubscribe: (channel) => ({ op: 'leave', room: channel }),\n  channelOf: (message) => message.room,\n  heartbeat: { interval: 25_000, timeout: 10_000, message: { op: 'ping' } },\n});\n\n// In the room component: joining is listening; leaving the page is leaving the room.\nlive.on(`room-${roomId}`, this, (message) => this.$messages.addItem(message));\nthis.$input.onEnter = (text) => live.send({ op: 'say', room: `room-${roomId}`, text });\n```\n\n### Showing the connection\n```js\nconst dot = await slice.build('Badge', { dot: true, label: 'Live', tone: 'neutral' });\nlive.watch(dot, (status, { retryIn }) => {\n  dot.tone = status === 'open' ? 'success' : status === 'reconnecting' ? 'warning' : 'neutral';\n  dot.label = status === 'reconnecting' ? `Reconnecting in ${Math.ceil(retryIn / 1000)} s` : status === 'open' ? 'Live' : 'Offline';\n});\n```\n\n### Notifications with Server-Sent Events\n```js\nconst live = await slice.build('RealtimeService', { singleton: true, sliceId: 'live', url: '/api/notifications', withCredentials: true });\nconst toasts = await slice.build('ToastProvider', { singleton: true });\n\nlive.on('notification', this, (n) => toasts.show(`${n.title}: ${n.body}`, { type: n.type || 'info' }));\n```\n\nThe server streams named events, each with an id:\n\n```text\nid: 1042\nevent: notification\ndata: {\"title\":\"Export ready\",\"body\":\"orders-2026-10.csv\",\"type\":\"success\"}\n```\n\nIf the connection drops after event 1042, the next one asks for `/api/notifications?lastEventId=1042`, and the server sends what came after it. A browser's own `EventSource` does this with the `Last-Event-ID` header, but only while the same `EventSource` lives; the service makes a new one on every reconnect (to control the waits), so it carries the id in the URL instead. Read it on the server from either:\n\n```js\n// Node / Express\nconst lastId = req.query.lastEventId ?? req.get('Last-Event-ID');\n```\n\nTo resume across visits too, keep `live.lastEventId` with [StorageService](/docs/services/storage-service) and pass it back as the `lastEventId` prop.\n\n## Best practices\n:::tip\n- One RealtimeService for the app (`singleton: true`), used from domain Services; components listen with `on()` and the listener goes with them.\n- Send **what changed** (`{ type, id }`) and let `invalidates()` or `setData()` decide what to ask again. The server does not need to know what each page shows.\n- Show the status somewhere discreet: people trust live data more when they can see it is live.\n:::\n\n## Pitfalls\n:::warning\nMessages sent while the app was disconnected are lost. That is why `invalidates()` asks again after every reconnect; with `on()` alone, ask again yourself when `watch()` reports `reconnected`.\n:::\n\n:::warning\nA token in the URL lives in server logs. Prefer a cookie, or a short-lived token from a function `url` (called on every connect, so it is always fresh).\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const live = await slice.build('RealtimeService', {\n  singleton: true,\n  sliceId: 'live',\n  url: 'wss://api.example.com/live',\n  queries,                                   // a QueryService\n});\n\nlive.invalidates('order.*', this, ['orders']);           // lists and counters of orders ask again\nlive.on('chat.message', this, (message) => this.append(message));\nlive.watch(this, (status) => { this.$status.tone = status === 'open' ? 'success' : 'warning'; });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| | WebSocket (`ws://`, `wss://`) | Server-Sent Events (`http://`, `https://`, a path) |","| --- | --- | --- |","| Direction | both ways: `send()` works | server → app only |","| Server | needs WebSocket support | any HTTP server that streams `text/event-stream` |","| Through proxies and firewalls | sometimes blocked | it is plain HTTP |","| Cookies | sent on connect | sent; `withCredentials: true` for another origin |","| Custom headers (`Authorization`) | not on the handshake | not at all (`EventSource` cannot): use a cookie or a token in the URL |","| Missed messages | ask again (`invalidates()`) | replayed from `lastEventId`, if the server keeps them |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Prop | Type | Default | Description |","| --- | --- | --- | --- |","| `url` | `string \\| () => string` | — | Where to connect. A function is called on every (re)connect: put a fresh token in it. |","| `transport` | `'websocket' \\| 'sse'` | from the URL | Needed when `url` is a function. |","| `protocols` | `string \\| string[]` | — | WebSocket subprotocols. |","| `withCredentials` | `boolean` | `false` | SSE: send cookies to another origin. |","| `lastEventId` | `string` | `''` | SSE: resume from this event id on the first connection (one you stored, for example with StorageService). |","| `lastEventIdParam` | `string \\| null` | `'lastEventId'` | SSE: the query parameter that carries the last event id on reconnect. `null`: do not send it. |","| `reconnect` | `false \\| { delay, maxDelay, factor, attempts, jitter, stableAfter }` | `1000, 30000, 2, Infinity, true, 5000` | The waits between attempts. `stableAfter`: ms the connection must stay open before the waits start small again. `false`: never reconnect. |","| `heartbeat` | `{ interval, timeout, message }` | — | WebSocket: send `message` every `interval` ms; nothing heard for `interval + timeout` means the connection is dead, and it reconnects. |","| `subscribe` / `unsubscribe` | `(channel) => frame` | — | The frames that tell the server which channels to send. |","| `parse` | `(data) => message` | JSON, or the text as it is | How an incoming message is read. |","| `serialize` | `(message) => data` | JSON (strings as they are) | How `send()` writes. |","| `channelOf` | `(message) => string` | `channel ?? type ?? event` | The channel of a message. |","| `queueLimit` | `number` | `100` | Messages `send()` keeps while disconnected; the oldest go first. |","| `autoConnect` | `boolean` | `true` | Connect with the first listener (or the first `send()`). `false`: only `connect()` does. |","| `queries` | QueryService | — | For `invalidates()`. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| Method | Returns | Description |","| --- | --- | --- |","| `on(channel, component, handler)` | `() => void` | `handler(message, { channel, event, id })` for every message of the channel, while `component` lives. `id`: the SSE event id. |","| `invalidates(channel, component, keys, { onReconnect = true }?)` | `() => void` | Messages of the channel invalidate `keys` (`['orders']`, several as `[['orders'], ['stats']]`, or `(message) => keys`). Fixed keys are invalidated after every reconnect too. |","| `watch(component, callback)` | `() => void` | `callback(status, { attempt, retryIn, reconnected })` now and on every change. |","| `send(message)` | `boolean` | WebSocket only. `true`: sent now; `false`: queued until the connection opens. |","| `connect()` | `Promise<void>` | Opens it; resolves when it is open. Also starts again after `disconnect()` or after the attempts ran out. |","| `disconnect()` | — | Closes it and does not reconnect. Listeners stay for a later `connect()`. |","| `status` | `string` | `idle`, `connecting`, `open`, `reconnecting` or `closed`. |","| `lastEventId` | `string` | SSE: the id of the last event received. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// OrdersService (one Service per domain, see the guide)\nexport default class OrdersService {\n  async init() {\n    this.http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });\n    this.queries = await slice.build('QueryService', { singleton: true, sliceId: 'queries', http: this.http });\n    this.live = await slice.build('RealtimeService', {\n      singleton: true, sliceId: 'live', url: '/api/events', queries: this.queries,\n    });\n  }\n\n  loader() {\n    return this.queries.loader(['orders', 'list'], (params, { signal }) => this.http.get('/orders', { query: params, signal }));\n  }\n\n  // \"order.created\", \"order.updated\", \"order.deleted\": every list and counter of orders asks again.\n  followChanges(component) {\n    return this.live.invalidates('order.*', component, ['orders']);\n  }\n}\n\n// The page\nthis.orders = await slice.build('OrdersService', { singleton: true, sliceId: 'orders' });\nthis.$table = await slice.build('Table', { load: this.orders.loader(), columns: COLUMNS, rowKey: 'id' });\nthis.orders.followChanges(this);",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "live.on('order.updated', this, (message) => {\n  queries.setData(['orders', 'one', message.order.id], message.order);   // the detail, at once\n  queries.invalidate(['orders', 'list']);                                // the lists, which may reorder\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const live = await slice.build('RealtimeService', {\n  singleton: true,\n  sliceId: 'live',\n  url: () => `wss://chat.example.com/socket?token=${session.token}`,   // a fresh token on every connect\n  transport: 'websocket',\n  subscribe: (channel) => ({ op: 'join', room: channel }),\n  unsubscribe: (channel) => ({ op: 'leave', room: channel }),\n  channelOf: (message) => message.room,\n  heartbeat: { interval: 25_000, timeout: 10_000, message: { op: 'ping' } },\n});\n\n// In the room component: joining is listening; leaving the page is leaving the room.\nlive.on(`room-${roomId}`, this, (message) => this.$messages.addItem(message));\nthis.$input.onEnter = (text) => live.send({ op: 'say', room: `room-${roomId}`, text });",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const dot = await slice.build('Badge', { dot: true, label: 'Live', tone: 'neutral' });\nlive.watch(dot, (status, { retryIn }) => {\n  dot.tone = status === 'open' ? 'success' : status === 'reconnecting' ? 'warning' : 'neutral';\n  dot.label = status === 'reconnecting' ? `Reconnecting in ${Math.ceil(retryIn / 1000)} s` : status === 'open' ? 'Live' : 'Offline';\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const live = await slice.build('RealtimeService', { singleton: true, sliceId: 'live', url: '/api/notifications', withCredentials: true });\nconst toasts = await slice.build('ToastProvider', { singleton: true });\n\nlive.on('notification', this, (n) => toasts.show(`${n.title}: ${n.body}`, { type: n.type || 'info' }));",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "id: 1042\nevent: notification\ndata: {\"title\":\"Export ready\",\"body\":\"orders-2026-10.csv\",\"type\":\"success\"}",
               language: "text"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "// Node / Express\nconst lastId = req.query.lastEventId ?? req.get('Last-Event-ID');",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const links = [{"text":"Data and the first load","path":"/docs/guides/data-and-loading#layers-transport-cache-and-your-domain"},{"text":"FetchManager","path":"/docs/services/fetch-manager"},{"text":"QueryService","path":"/docs/services/query-service"},{"text":"FetchManager","path":"/docs/services/fetch-manager"},{"text":"StorageService","path":"/docs/services/storage-service"}];
         for (const [index, linkProps] of links.entries()) {
            const placeholder = this.querySelector('[data-inline-link="' + index + '"]');
            if (!placeholder) continue;
            const link = await slice.build('Link', linkProps);
            placeholder.replaceWith(link);
            this._inlineLinks.push(link);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: 'Copy as markdown'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios â€” so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all â€” the divs
      // were never filled, nothing in the repo reads .script-block â€” the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
      const demobox = await slice.build('DemoBox', {
        label: scenario.label,
        expected: scenario.expected || ''
      });

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });

      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        demobox.clear();
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed var(--warning-color)';
          fallback.style.borderRadius = '8px';
          fallback.style.background = 'color-mix(in srgb, var(--primary-background-color) 85%, var(--warning-color))';
          fallback.style.color = 'var(--font-primary-color)';
          fallback.textContent = String(name || '')
            ? 'Component "' + String(name) + '" is not registered in this build yet.'
            : 'Requested component is not registered in this build yet.';
          return fallback;
        };

        const safeSlice = Object.create(slice);
        safeSlice.build = async (name, props) => {
          const built = await slice.build(name, props);
          if (built instanceof Node) {
            return built;
          }
          if (Array.isArray(built)) {
            const fragment = document.createDocumentFragment();
            let hasNode = false;
            built.forEach((item) => {
              if (item instanceof Node) {
                fragment.appendChild(item);
                hasNode = true;
              }
            });
            if (hasNode) {
              return fragment;
            }
          }
          return built ?? createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            demobox.appendDemo(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            demobox.appendDemo(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                demobox.appendDemo(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-realtimeservicedocumentation', RealtimeServiceDocumentation);
