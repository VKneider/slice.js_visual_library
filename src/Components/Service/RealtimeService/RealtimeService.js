// RealtimeService — what the server tells the app without being asked:
// a WebSocket or Server-Sent Events connection that stays up.
//
//   const live = await slice.build('RealtimeService', {
//     singleton: true, sliceId: 'live',
//     url: 'wss://api.example.com/live',      // or '/api/events' (SSE)
//     queries,                                 // a QueryService: messages can make queries stale
//   });
//
//   live.on('order.updated', this, (message) => this.flash(message.id));
//   live.invalidates('order.*', this, ['orders']);        // the lists and counters ask again
//   live.watch(this, (status) => this.$dot.tone = status === 'open' ? 'success' : 'warning');
//   live.send({ type: 'typing', room: 7 });             // WebSocket only
//
// It completes the data layer: FetchManager asks, QueryService keeps, and
// RealtimeService says when what is kept changed.
//
// What it takes care of:
//   - connecting when the first listener arrives (or on connect()), and
//     reconnecting when the connection drops: waiting longer each time, with
//     jitter, at once when the network comes back, never after disconnect();
//   - a message goes to the listeners of its channel (message.channel, .type
//     or .event; the event name for SSE), "order.*" for a family, "*" for all;
//   - listeners belong to a component and go with it;
//   - subscribe/unsubscribe frames to the server when a channel gets its
//     first listener or loses its last, sent again after every reconnect;
//   - send() while disconnected waits in a queue and goes out on reconnect;
//   - SSE: the id of the last event is sent again on reconnect
//     (?lastEventId=…), so the server can replay what was missed — what the
//     browser's own Last-Event-ID header does, which a new EventSource loses;
//   - after a reconnect, queries bound with invalidates() are made stale:
//     what changed while the app was offline is fetched again;
//   - a heartbeat that notices a connection that died without closing;
//   - the status (idle, connecting, open, reconnecting, closed), to show it.

const STATUSES = ['idle', 'connecting', 'open', 'reconnecting', 'closed'];

function defaultParse(data) {
   if (typeof data !== 'string') return data;
   try {
      return JSON.parse(data);
   } catch {
      return data;
   }
}

function defaultChannel(message) {
   if (!message || typeof message !== 'object') return 'message';
   return message.channel ?? message.type ?? message.event ?? 'message';
}

// 'order.*' matches 'order.updated' and 'order.created.v2'; '*' matches all.
function channelMatches(pattern, channel) {
   if (pattern === '*' || pattern === channel) return true;
   return pattern.endsWith('.*') && channel.startsWith(pattern.slice(0, -1));
}

function normalizeReconnect(value) {
   if (value === false) return null;
   const options = value && typeof value === 'object' ? value : {};
   return {
      delay: Number.isFinite(options.delay) ? options.delay : 1000,
      // Open this long before the waits start small again: a server that
      // accepts and drops at once must not be hammered.
      stableAfter: Number.isFinite(options.stableAfter) ? options.stableAfter : 5000,
      maxDelay: Number.isFinite(options.maxDelay) ? options.maxDelay : 30_000,
      factor: Number.isFinite(options.factor) ? options.factor : 2,
      attempts: Number.isFinite(options.attempts) ? options.attempts : Infinity,
      jitter: options.jitter !== false,
   };
}

export default class RealtimeService {
   /**
    * @param {{
    *   url?: string | (() => string),
    *   transport?: 'websocket' | 'sse',
    *   protocols?: string | string[],
    *   withCredentials?: boolean,
    *   lastEventId?: string,
    *   lastEventIdParam?: string | null,
    *   reconnect?: false | { delay?: number, maxDelay?: number, factor?: number, attempts?: number, jitter?: boolean, stableAfter?: number },
    *   heartbeat?: { interval?: number, timeout?: number, message?: any } | null,
    *   subscribe?: ((channel: string) => any) | null,
    *   unsubscribe?: ((channel: string) => any) | null,
    *   parse?: (data: any) => any,
    *   serialize?: (message: any) => any,
    *   channelOf?: (message: any) => string,
    *   queueLimit?: number,
    *   autoConnect?: boolean,
    *   queries?: any,
    * }} [props]
    */
   constructor(props = {}) {
      const options = props || {};
      this.url = options.url || '';
      this.transport = options.transport === 'sse' || options.transport === 'websocket' ? options.transport : null;
      this.protocols = options.protocols;
      this.withCredentials = options.withCredentials === true;
      // SSE: the id of the last event received ("id:" in the stream), sent
      // back on reconnect as ?<lastEventIdParam>=…. Give one to resume from a
      // stored position; lastEventIdParam: null to not send it.
      this._lastEventId = typeof options.lastEventId === 'string' ? options.lastEventId : '';
      this.lastEventIdParam = options.lastEventIdParam === null ? null : (options.lastEventIdParam || 'lastEventId');
      this.reconnect = normalizeReconnect(options.reconnect);
      this.heartbeat = options.heartbeat && typeof options.heartbeat === 'object'
         ? { interval: options.heartbeat.interval ?? 25_000, timeout: options.heartbeat.timeout ?? 10_000, message: options.heartbeat.message ?? 'ping' }
         : null;
      this.subscribeFrame = typeof options.subscribe === 'function' ? options.subscribe : null;
      this.unsubscribeFrame = typeof options.unsubscribe === 'function' ? options.unsubscribe : null;
      this.parse = typeof options.parse === 'function' ? options.parse : defaultParse;
      this.serialize = typeof options.serialize === 'function' ? options.serialize : (message) => (typeof message === 'string' ? message : JSON.stringify(message));
      this.channelOf = typeof options.channelOf === 'function' ? options.channelOf : defaultChannel;
      this.queueLimit = Number.isFinite(options.queueLimit) ? options.queueLimit : 100;
      this.autoConnect = options.autoConnect !== false;
      // A QueryService, for invalidates().
      this.queries = options.queries || null;

      this._status = 'idle';
      this._socket = null;            // WebSocket | EventSource
      this._wanted = false;           // connect() called and not disconnect()
      this._attempt = 0;
      this._retryTimer = 0;
      this._retryAt = 0;
      this._heartbeatTimer = 0;
      this._lastMessageAt = 0;
      this._openedAt = 0;
      this._everOpened = false;
      this._queue = [];
      /** @type {Set<any>} */
      this._listeners = new Set();
      /** @type {Set<any>} */
      this._watchers = new Set();
      /** @type {Set<string>} channels the server was told about (subscribe frames) */
      this._subscribed = new Set();
      this._sseEvents = new Set();
      this._opening = null;
      /** @type {{ resolve: (value?: any) => void, reject: (error: Error) => void } | null} */
      this._openWaiter = null;
      /** @type {Record<string, (event?: any) => void> | null} */
      this._handlers = null;

      this._onOnline = () => {
         if (this._wanted && this._status === 'reconnecting') this._retryNow();
      };
   }

   init() {
      window.addEventListener('online', this._onOnline);
   }

   beforeDestroy() {
      window.removeEventListener('online', this._onOnline);
      this.disconnect();
      this._listeners.clear();
      this._watchers.clear();
   }

   // ── Connection ──────────────────────────────────────────────────

   /** SSE: the id of the last event received ('' when none had one). */
   get lastEventId() { return this._lastEventId; }

   /** idle | connecting | open | reconnecting | closed */
   get status() { return this._status; }

   /** Open the connection. Resolves when it is open (the first time it opens). */
   connect() {
      this._wanted = true;
      if (this._status === 'open') return Promise.resolve();
      if (!this._socket && this._status !== 'reconnecting') {
         this._attempt = 0;
         this._open();
      }
      if (!this._opening) {
         this._opening = new Promise((resolve, reject) => { this._openWaiter = { resolve, reject }; });
         this._opening.catch(() => {});
      }
      return this._opening;
   }

   /** Close it and do not reconnect. on() listeners stay, for a later connect(). */
   disconnect() {
      this._wanted = false;
      clearTimeout(this._retryTimer);
      this._stopHeartbeat();
      const socket = this._socket;
      this._socket = null;
      if (socket) {
         this._detach(socket);
         socket.close();
      }
      this._subscribed.clear();
      this._openWaiter?.reject(new Error('RealtimeService: disconnected before it opened.'));
      this._openWaiter = null;
      this._opening = null;
      this._setStatus(this._everOpened || this._status !== 'idle' ? 'closed' : 'idle');
   }

   /**
    * Send a message (WebSocket only). While not open, it waits in a queue
    * (up to `queueLimit`) and goes out when the connection opens. Returns
    * true when it went out now.
    */
   send(message) {
      if (this._transport() !== 'websocket') throw new Error('RealtimeService: send() needs a WebSocket; Server-Sent Events only listen.');
      if (this._status === 'open' && this._socket) {
         this._socket.send(this.serialize(message));
         return true;
      }
      if (this._queue.length >= this.queueLimit) {
         this._queue.shift();
         slice.logger.warn('RealtimeService', `More than ${this.queueLimit} messages waiting for the connection: the oldest was dropped.`);
      }
      this._queue.push(message);
      if (this.autoConnect && this._status === 'idle') this.connect();
      return false;
   }

   // ── Listening ───────────────────────────────────────────────────

   /**
    * Call `handler(message, { channel, event, id })` for every message of
    * `channel` ('order.updated', 'order.*', '*'), while `component` lives.
    * The first listener opens the connection (unless autoConnect: false).
    * Returns a function that removes it.
    */
   on(channel, component, handler) {
      if (!component?.sliceId) throw new Error('on(channel, component, handler) needs a Slice component, to stop when it is destroyed.');
      if (typeof handler !== 'function') throw new Error('on(channel, component, handler) needs a handler.');
      const listener = { channel: String(channel), component, handler };
      this._listeners.add(listener);
      this._listenSse(listener.channel);
      this._syncSubscriptions();
      // The first listener opens the connection; after disconnect() it stays closed.
      if (this.autoConnect && this._status === 'idle') this.connect();
      return () => {
         this._listeners.delete(listener);
         this._syncSubscriptions();
      };
   }

   /**
    * Messages of `channel` make queries stale: `prefixes` is a list of query
    * keys (['orders'], ['orders', 7]) or `(message) => prefixes`. After a
    * reconnect, the fixed prefixes are invalidated too: what changed while
    * the app was offline is fetched again. Needs `queries` (a QueryService).
    */
   invalidates(channel, component, prefixes, { onReconnect = true } = {}) {
      if (!this.queries) throw new Error('invalidates() needs `queries` (a QueryService) in the props.');
      const keysOf = (message) => {
         const list = typeof prefixes === 'function' ? prefixes(message) : prefixes;
         if (!list) return [];
         // ['orders'] is one key; [['orders'], ['users']] are several.
         return Array.isArray(list[0]) ? list : [list];
      };
      const off = this.on(channel, component, (message) => {
         for (const key of keysOf(message)) this.queries.invalidate(key);
      });
      if (onReconnect && typeof prefixes !== 'function') {
         const watcher = { component, callback: (status, info) => {
            if (status === 'open' && info.reconnected) for (const key of keysOf(null)) this.queries.invalidate(key);
         } };
         this._watchers.add(watcher);
         return () => { off(); this._watchers.delete(watcher); };
      }
      return off;
   }

   /**
    * Call `callback(status, { attempt, retryIn, reconnected })` now and on
    * every change of status, while `component` lives.
    */
   watch(component, callback) {
      if (!component?.sliceId) throw new Error('watch(component, callback) needs a Slice component.');
      const watcher = { component, callback };
      this._watchers.add(watcher);
      callback(this._status, this._info(false));
      return () => { this._watchers.delete(watcher); };
   }

   // ── Inside ──────────────────────────────────────────────────────

   _transport() {
      if (this.transport) return this.transport;
      const url = String(typeof this.url === 'function' ? '' : this.url);
      return /^wss?:/i.test(url) ? 'websocket' : (typeof this.url === 'function' ? 'websocket' : 'sse');
   }

   _alive(component) {
      return slice.controller.activeComponents.get(component?.sliceId) === component;
   }

   _prune() {
      for (const listener of [...this._listeners]) if (!this._alive(listener.component)) this._listeners.delete(listener);
      for (const watcher of [...this._watchers]) if (!this._alive(watcher.component)) this._watchers.delete(watcher);
   }

   _open() {
      const url = this._withLastEventId(typeof this.url === 'function' ? this.url() : this.url);
      if (!url) throw new Error('RealtimeService needs a `url`.');
      this._setStatus(this._everOpened || this._attempt > 0 ? 'reconnecting' : 'connecting');
      let socket;
      try {
         socket = this._transport() === 'websocket'
            ? new WebSocket(url, this.protocols)
            : new EventSource(url, { withCredentials: this.withCredentials });
      } catch (error) {
         slice.logger.error('RealtimeService', `Could not open ${url}`, error);
         this._scheduleRetry();
         return;
      }
      this._socket = socket;
      this._handlers = {
         open: () => this._opened(),
         message: (event) => this._received(event.data, event.type, event.lastEventId),
         error: () => {
            // EventSource reconnects by itself and keeps readyState CONNECTING;
            // we take over, so its delays follow ours.
            if (this._transport() === 'sse') this._closed();
         },
         close: () => this._closed(),
      };
      socket.addEventListener('open', this._handlers.open);
      socket.addEventListener('message', this._handlers.message);
      socket.addEventListener('error', this._handlers.error);
      if (this._transport() === 'websocket') socket.addEventListener('close', this._handlers.close);
      for (const name of this._sseEvents) socket.addEventListener(name, this._handlers.message);
   }

   // SSE: the URL with ?lastEventId=… when an event id is known, so a new
   // EventSource can resume where the last one stopped.
   _withLastEventId(url) {
      if (!url || this._transport() !== 'sse' || !this._lastEventId || !this.lastEventIdParam) return url;
      const absolute = new URL(url, window.location.href);
      absolute.searchParams.set(this.lastEventIdParam, this._lastEventId);
      // Keep a same-origin URL relative, as it was given.
      return absolute.origin === window.location.origin && !/^[a-z]+:/i.test(url)
         ? `${absolute.pathname}${absolute.search}${absolute.hash}`
         : absolute.href;
   }

   _detach(socket) {
      if (!this._handlers) return;
      socket.removeEventListener('open', this._handlers.open);
      socket.removeEventListener('message', this._handlers.message);
      socket.removeEventListener('error', this._handlers.error);
      socket.removeEventListener('close', this._handlers.close);
      for (const name of this._sseEvents) socket.removeEventListener(name, this._handlers.message);
   }

   _opened() {
      const reconnected = this._everOpened;
      this._everOpened = true;
      this._openedAt = Date.now();
      this._lastMessageAt = Date.now();
      this._subscribed.clear();
      this._setStatus('open', { reconnected });
      this._syncSubscriptions();
      // What waited for the connection.
      const queued = this._queue.splice(0);
      for (const message of queued) this._socket?.send(this.serialize(message));
      this._startHeartbeat();
      this._openWaiter?.resolve();
      this._openWaiter = null;
   }

   _closed() {
      const socket = this._socket;
      this._socket = null;
      if (socket) {
         this._detach(socket);
         try { socket.close(); } catch { /* already closed */ }
      }
      this._stopHeartbeat();
      // It stayed open long enough: the next wait starts small again.
      if (this._openedAt && this.reconnect && Date.now() - this._openedAt >= this.reconnect.stableAfter) this._attempt = 0;
      this._openedAt = 0;
      if (!this._wanted) return;
      this._scheduleRetry();
   }

   _scheduleRetry() {
      if (!this.reconnect || this._attempt >= this.reconnect.attempts) {
         this._wanted = false;
         this._setStatus('closed');
         this._openWaiter?.reject(new Error('RealtimeService: the connection could not be opened.'));
         this._openWaiter = null;
         this._opening = null;
         return;
      }
      const { delay, maxDelay, factor, jitter } = this.reconnect;
      let wait = Math.min(maxDelay, delay * factor ** this._attempt);
      if (jitter) wait = wait / 2 + Math.random() * (wait / 2);
      this._attempt += 1;
      this._retryAt = Date.now() + wait;
      this._setStatus('reconnecting');
      clearTimeout(this._retryTimer);
      // Offline: wait for the `online` event instead of trying in vain.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
      this._retryTimer = window.setTimeout(() => this._open(), wait);
   }

   _retryNow() {
      clearTimeout(this._retryTimer);
      this._open();
   }

   _received(data, eventName, eventId) {
      this._lastMessageAt = Date.now();
      if (eventId) this._lastEventId = eventId;
      let message;
      try {
         message = this.parse(data);
      } catch (error) {
         slice.logger.error('RealtimeService', 'A message could not be read', error);
         return;
      }
      const channel = eventName && eventName !== 'message' ? eventName : String(this.channelOf(message));
      this._prune();
      for (const listener of [...this._listeners]) {
         if (!channelMatches(listener.channel, channel)) continue;
         try {
            listener.handler(message, { channel, event: eventName, id: eventId || '' });
         } catch (error) {
            slice.logger.error('RealtimeService', `A listener of "${listener.channel}" failed`, error);
         }
      }
   }

   // SSE: named events ("event: order.updated") arrive only to listeners of
   // that name, so each exact channel is listened to on the EventSource.
   _listenSse(channel) {
      if (channel === '*' || channel.endsWith('.*') || this._sseEvents.has(channel)) return;
      this._sseEvents.add(channel);
      if (this._socket && this._transport() === 'sse' && this._handlers) this._socket.addEventListener(channel, this._handlers.message);
   }

   // Tell the server which channels have listeners (when subscribe/unsubscribe
   // frames are configured).
   _syncSubscriptions() {
      if (!this.subscribeFrame || this._status !== 'open' || this._transport() !== 'websocket') return;
      this._prune();
      const wanted = new Set([...this._listeners].map((listener) => listener.channel));
      for (const channel of wanted) {
         if (this._subscribed.has(channel)) continue;
         this._subscribed.add(channel);
         const frame = this.subscribeFrame(channel);
         if (frame !== undefined && frame !== null) this._socket.send(this.serialize(frame));
      }
      for (const channel of [...this._subscribed]) {
         if (wanted.has(channel)) continue;
         this._subscribed.delete(channel);
         const frame = this.unsubscribeFrame?.(channel);
         if (frame !== undefined && frame !== null) this._socket.send(this.serialize(frame));
      }
   }

   _startHeartbeat() {
      if (!this.heartbeat || this._transport() !== 'websocket') return;
      this._stopHeartbeat();
      const { interval, timeout, message } = this.heartbeat;
      this._heartbeatTimer = window.setInterval(() => {
         if (this._status !== 'open' || !this._socket) return;
         // Nothing heard for a whole interval plus the timeout: the connection
         // died without telling us. Start over.
         if (Date.now() - this._lastMessageAt > interval + timeout) {
            slice.logger.warn('RealtimeService', 'No answer from the server: reconnecting.');
            this._closed();
            return;
         }
         this._socket.send(this.serialize(message));
      }, interval);
   }

   _stopHeartbeat() {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = 0;
   }

   _info(reconnected) {
      return {
         attempt: this._attempt,
         retryIn: this._status === 'reconnecting' ? Math.max(0, this._retryAt - Date.now()) : 0,
         reconnected: !!reconnected,
      };
   }

   _setStatus(status, { reconnected = false } = {}) {
      if (!STATUSES.includes(status)) return;
      const changed = status !== this._status;
      this._status = status;
      // 'reconnecting' is told on every attempt (attempt and retryIn change).
      if (!changed && status !== 'reconnecting') return;
      this._prune();
      const info = this._info(reconnected);
      for (const watcher of [...this._watchers]) {
         try {
            watcher.callback(status, info);
         } catch (error) {
            slice.logger.error('RealtimeService', 'A status watcher failed', error);
         }
      }
   }
}