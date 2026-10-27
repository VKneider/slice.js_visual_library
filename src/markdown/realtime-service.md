---
title: RealtimeService
route: /docs/services/realtime-service
navLabel: RealtimeService
section: Services
group: Networking
order: 32
description: What the server tells the app without being asked. A WebSocket or Server-Sent Events connection that stays up — reconnecting with growing waits, channels with listeners that go with their component, subscribe frames sent again after a reconnect, a send queue, a heartbeat — and messages that make QueryService queries stale.
component: RealtimeServiceDocumentation
generate: true
tags: [service, websocket, sse, server-sent events, realtime, live, push, reconnect, subscribe, channels, query, invalidate]
---

# RealtimeService

## Overview
`RealtimeService` keeps a connection to the server open so the server can tell the app when something changes: a WebSocket, or Server-Sent Events (SSE).

```js
const live = await slice.build('RealtimeService', {
  singleton: true,
  sliceId: 'live',
  url: 'wss://api.example.com/live',
  queries,                                   // a QueryService
});

live.invalidates('order.*', this, ['orders']);           // lists and counters of orders ask again
live.on('chat.message', this, (message) => this.append(message));
live.watch(this, (status) => { this.$status.tone = status === 'open' ? 'success' : 'warning'; });
```

It completes the data layer of [Data and the first load](/docs/guides/data-and-loading#layers-transport-cache-and-your-domain): [FetchManager](/docs/services/fetch-manager) asks, [QueryService](/docs/services/query-service) keeps, and RealtimeService says when what is kept changed.

What it takes care of:

- **Connecting and staying connected.** It connects when the first listener arrives (or on `connect()`). When the connection drops it reconnects, waiting longer each time (1 s, 2 s, 4 s… up to 30 s, with jitter), at once when the network comes back, and not at all while the browser is offline. A server that accepts and drops at once does not reset the waits.
- **Channels.** A message goes to the listeners of its channel: `message.channel`, `.type` or `.event` (or the event name in SSE). `'order.*'` listens to a family, `'*'` to everything.
- **Cleanup.** Every listener belongs to a component and goes with it.
- **Subscriptions.** With `subscribe`/`unsubscribe`, the server is told which channels have listeners: when a channel gets its first, when it loses its last, and again after every reconnect.
- **Sending** (WebSocket): `send()` while disconnected waits in a queue and goes out when the connection opens.
- **Queries.** `invalidates()` makes QueryService queries stale on a message, and after every reconnect, because what changed while the app was offline was never announced.
- **Resuming SSE.** The id of the last event (`id:` in the stream) is sent again on reconnect as `?lastEventId=…`, so the server can replay what was missed.
- **A heartbeat** that notices a connection that died without closing (a laptop waking up, a proxy that drops idle sockets).
- **The status**, to show it: `idle`, `connecting`, `open`, `reconnecting`, `closed`.

### When to use it
- Data that changes on the server while people look at it: orders arriving, a ticket assigned, a build finishing, sensors, prices.
- Several people on the same thing: chat, presence ("Ana is viewing"), "someone else edited this record".
- Notifications the server decides to send.

### When not to use it
- Data that is fine a few seconds late: QueryService's `staleTime` and its refresh when the tab comes back are simpler and cheaper.
- One answer to one question: [FetchManager](/docs/services/fetch-manager).
- Long work you start and wait for (an export): ask with FetchManager, then either poll its status or let the server announce it here.

### WebSocket or Server-Sent Events
| | WebSocket (`ws://`, `wss://`) | Server-Sent Events (`http://`, `https://`, a path) |
| --- | --- | --- |
| Direction | both ways: `send()` works | server → app only |
| Server | needs WebSocket support | any HTTP server that streams `text/event-stream` |
| Through proxies and firewalls | sometimes blocked | it is plain HTTP |
| Cookies | sent on connect | sent; `withCredentials: true` for another origin |
| Custom headers (`Authorization`) | not on the handshake | not at all (`EventSource` cannot): use a cookie or a token in the URL |
| Missed messages | ask again (`invalidates()`) | replayed from `lastEventId`, if the server keeps them |

The transport follows the URL; pass `transport` when the URL is a function.

## Build it
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string \| () => string` | — | Where to connect. A function is called on every (re)connect: put a fresh token in it. |
| `transport` | `'websocket' \| 'sse'` | from the URL | Needed when `url` is a function. |
| `protocols` | `string \| string[]` | — | WebSocket subprotocols. |
| `withCredentials` | `boolean` | `false` | SSE: send cookies to another origin. |
| `lastEventId` | `string` | `''` | SSE: resume from this event id on the first connection (one you stored, for example with StorageService). |
| `lastEventIdParam` | `string \| null` | `'lastEventId'` | SSE: the query parameter that carries the last event id on reconnect. `null`: do not send it. |
| `reconnect` | `false \| { delay, maxDelay, factor, attempts, jitter, stableAfter }` | `1000, 30000, 2, Infinity, true, 5000` | The waits between attempts. `stableAfter`: ms the connection must stay open before the waits start small again. `false`: never reconnect. |
| `heartbeat` | `{ interval, timeout, message }` | — | WebSocket: send `message` every `interval` ms; nothing heard for `interval + timeout` means the connection is dead, and it reconnects. |
| `subscribe` / `unsubscribe` | `(channel) => frame` | — | The frames that tell the server which channels to send. |
| `parse` | `(data) => message` | JSON, or the text as it is | How an incoming message is read. |
| `serialize` | `(message) => data` | JSON (strings as they are) | How `send()` writes. |
| `channelOf` | `(message) => string` | `channel ?? type ?? event` | The channel of a message. |
| `queueLimit` | `number` | `100` | Messages `send()` keeps while disconnected; the oldest go first. |
| `autoConnect` | `boolean` | `true` | Connect with the first listener (or the first `send()`). `false`: only `connect()` does. |
| `queries` | QueryService | — | For `invalidates()`. |

## Methods
| Method | Returns | Description |
| --- | --- | --- |
| `on(channel, component, handler)` | `() => void` | `handler(message, { channel, event, id })` for every message of the channel, while `component` lives. `id`: the SSE event id. |
| `invalidates(channel, component, keys, { onReconnect = true }?)` | `() => void` | Messages of the channel invalidate `keys` (`['orders']`, several as `[['orders'], ['stats']]`, or `(message) => keys`). Fixed keys are invalidated after every reconnect too. |
| `watch(component, callback)` | `() => void` | `callback(status, { attempt, retryIn, reconnected })` now and on every change. |
| `send(message)` | `boolean` | WebSocket only. `true`: sent now; `false`: queued until the connection opens. |
| `connect()` | `Promise<void>` | Opens it; resolves when it is open. Also starts again after `disconnect()` or after the attempts ran out. |
| `disconnect()` | — | Closes it and does not reconnect. Listeners stay for a later `connect()`. |
| `status` | `string` | `idle`, `connecting`, `open`, `reconnecting` or `closed`. |
| `lastEventId` | `string` | SSE: the id of the last event received. |

## Examples

### Orders that update themselves
The table loads through QueryService; the server announces changes, and the table asks again. Nothing in the page handles the messages one by one.

```js
// OrdersService (one Service per domain, see the guide)
export default class OrdersService {
  async init() {
    this.http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });
    this.queries = await slice.build('QueryService', { singleton: true, sliceId: 'queries', http: this.http });
    this.live = await slice.build('RealtimeService', {
      singleton: true, sliceId: 'live', url: '/api/events', queries: this.queries,
    });
  }

  loader() {
    return this.queries.loader(['orders', 'list'], (params, { signal }) => this.http.get('/orders', { query: params, signal }));
  }

  // "order.created", "order.updated", "order.deleted": every list and counter of orders asks again.
  followChanges(component) {
    return this.live.invalidates('order.*', component, ['orders']);
  }
}

// The page
this.orders = await slice.build('OrdersService', { singleton: true, sliceId: 'orders' });
this.$table = await slice.build('Table', { load: this.orders.loader(), columns: COLUMNS, rowKey: 'id' });
this.orders.followChanges(this);
```

The server only has to send `{ "type": "order.updated", "id": 42 }`. When the connection comes back after a drop, the orders are asked again anyway.

### Only what changed
When a message carries the new record, put it in the query instead of asking the server again.

```js
live.on('order.updated', this, (message) => {
  queries.setData(['orders', 'one', message.order.id], message.order);   // the detail, at once
  queries.invalidate(['orders', 'list']);                                // the lists, which may reorder
});
```

### A chat room, with subscribe frames
The server sends a room's messages only to connections subscribed to it. The service sends the frames when a component starts listening, when the last one stops, and again after every reconnect.

```js
const live = await slice.build('RealtimeService', {
  singleton: true,
  sliceId: 'live',
  url: () => `wss://chat.example.com/socket?token=${session.token}`,   // a fresh token on every connect
  transport: 'websocket',
  subscribe: (channel) => ({ op: 'join', room: channel }),
  unsubscribe: (channel) => ({ op: 'leave', room: channel }),
  channelOf: (message) => message.room,
  heartbeat: { interval: 25_000, timeout: 10_000, message: { op: 'ping' } },
});

// In the room component: joining is listening; leaving the page is leaving the room.
live.on(`room-${roomId}`, this, (message) => this.$messages.addItem(message));
this.$input.onEnter = (text) => live.send({ op: 'say', room: `room-${roomId}`, text });
```

### Showing the connection
```js
const dot = await slice.build('Badge', { dot: true, label: 'Live', tone: 'neutral' });
live.watch(dot, (status, { retryIn }) => {
  dot.tone = status === 'open' ? 'success' : status === 'reconnecting' ? 'warning' : 'neutral';
  dot.label = status === 'reconnecting' ? `Reconnecting in ${Math.ceil(retryIn / 1000)} s` : status === 'open' ? 'Live' : 'Offline';
});
```

### Notifications with Server-Sent Events
```js
const live = await slice.build('RealtimeService', { singleton: true, sliceId: 'live', url: '/api/notifications', withCredentials: true });
const toasts = await slice.build('ToastProvider', { singleton: true });

live.on('notification', this, (n) => toasts.show(`${n.title}: ${n.body}`, { type: n.type || 'info' }));
```

The server streams named events, each with an id:

```text
id: 1042
event: notification
data: {"title":"Export ready","body":"orders-2026-10.csv","type":"success"}
```

If the connection drops after event 1042, the next one asks for `/api/notifications?lastEventId=1042`, and the server sends what came after it. A browser's own `EventSource` does this with the `Last-Event-ID` header, but only while the same `EventSource` lives; the service makes a new one on every reconnect (to control the waits), so it carries the id in the URL instead. Read it on the server from either:

```js
// Node / Express
const lastId = req.query.lastEventId ?? req.get('Last-Event-ID');
```

To resume across visits too, keep `live.lastEventId` with [StorageService](/docs/services/storage-service) and pass it back as the `lastEventId` prop.

## Best practices
:::tip
- One RealtimeService for the app (`singleton: true`), used from domain Services; components listen with `on()` and the listener goes with them.
- Send **what changed** (`{ type, id }`) and let `invalidates()` or `setData()` decide what to ask again. The server does not need to know what each page shows.
- Show the status somewhere discreet: people trust live data more when they can see it is live.
:::

## Pitfalls
:::warning
Messages sent while the app was disconnected are lost. That is why `invalidates()` asks again after every reconnect; with `on()` alone, ask again yourself when `watch()` reports `reconnected`.
:::

:::warning
A token in the URL lives in server logs. Prefer a cookie, or a short-lived token from a function `url` (called on every connect, so it is always fresh).
:::