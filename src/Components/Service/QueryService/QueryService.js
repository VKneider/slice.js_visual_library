// QueryService — what the app already knows from the server, whether it is
// still fresh, and who is showing it. The layer React Query or SWR are in
// React, the Slice way: a Service, watched by components like a hook.
//
//   const queries = await slice.build('QueryService', { singleton: true, sliceId: 'queries' });
//   const open = queries.query(['orders', { status: 'open' }],
//     ({ signal }) => http.get('/orders', { query: { status: 'open' }, signal }));
//
//   open.watch(this, (state) => { … });  // like a hook: now, and on every change
//   open.load();                           // fresh? nothing. In flight? shared. Else asks.
//   await queries.mutate(() => http.patch(`/orders/${id}`, changes), { invalidates: [['orders']] });
//
// It does not make requests itself: a query is a KEY (what the data is) and
// a FUNCTION (how to get it), any function that returns a promise — usually
// one that calls FetchManager. What it adds:
//   - one request for the same key, however many components ask at once;
//   - data kept for `staleTime`; after that, shown at once and refreshed behind
//     (stale-while-revalidate);
//   - invalidate(prefix) after a change: everything under it is stale, and
//     what is on screen asks again by itself;
//   - retries for failures worth retrying (not a 4xx);
//   - a refresh when the tab comes back or the network returns;
//   - queries nobody uses for `gcTime` are forgotten.
//
// State of a query: { status, data, error, fetching, updatedAt }
//   status   'idle' (never asked) | 'loading' (no data yet) | 'ready' | 'error'
//   fetching true while a request runs, also when refreshing data you have
//
// Server data lives here, not in slice.context. A context holds what the app
// owns (the session, the filters chosen, a cart); a query holds a copy of
// what the server owns. They meet in the key: a context decides WHICH data
// (['orders', filters]), the query keeps it. Each query tells only those who
// watch it, and forgets them when their component is destroyed (as
// slice.events does), so a change in one query costs nothing to the others.

const IDLE = Object.freeze({ status: 'idle', data: undefined, error: null, fetching: false, updatedAt: 0 });

// A stable text for a key: object keys sorted, so { a: 1, b: 2 } and
// { b: 2, a: 1 } are the same query.
function stable(value) {
   if (value === undefined) return 'undefined';
   if (value === null || typeof value !== 'object') return JSON.stringify(value);
   if (value instanceof Date) return `"${value.toISOString()}"`;
   if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
   // A Map or a Set would otherwise stringify to {} and collide with every
   // other one: same entries, in any order, is the same key.
   if (value instanceof Map) {
      const entries = [...value.entries()].map(([k, v]) => `${stable(k)}:${stable(v)}`).sort();
      return `map{${entries.join(',')}}`;
   }
   if (value instanceof Set) {
      return `set{${[...value].map(stable).sort().join(',')}}`;
   }
   if (typeof Blob !== 'undefined' && value instanceof Blob) {
      return `blob{${JSON.stringify(value.name || '')},${value.size},${JSON.stringify(value.type || '')}}`;
   }
   const proto = Object.getPrototypeOf(value);
   if (proto !== Object.prototype && proto !== null) {
      // A class instance (a URL, a custom type): there is nothing to walk. Same
      // type and same text is the same key; when it matters, key by its id.
      return `${value.constructor?.name || 'object'}(${String(value)})`;
   }
   const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
   return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
}

function toKey(key) {
   return Array.isArray(key) ? key : [key];
}

// ['orders'] is a prefix of ['orders', 'list', { page: 1 }].
function startsWith(key, prefix) {
   if (prefix.length > key.length) return false;
   return prefix.every((part, i) => stable(part) === stable(key[i]));
}

function abortError(signal) {
   return signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError');
}

// A 4xx (except 408 and 429) will not get better by asking again.
function worthRetrying(error) {
   const status = error?.status;
   if (typeof status !== 'number' || status === 0) return true;
   return status >= 500 || status === 408 || status === 429;
}

export default class QueryService {
   /**
    * @param {{ staleTime?: number, gcTime?: number, retry?: number, retryDelay?: number,
    *   refetchOnFocus?: boolean, refetchOnReconnect?: boolean, http?: any }} [props]
    */
   constructor(props = {}) {
      const options = props || {};
      this.staleTime = Number.isFinite(options.staleTime) ? options.staleTime : 30_000;
      this.gcTime = Number.isFinite(options.gcTime) ? options.gcTime : 5 * 60_000;
      this.retry = Number.isFinite(options.retry) ? Math.max(0, options.retry) : 1;
      this.retryDelay = Number.isFinite(options.retryDelay) ? options.retryDelay : 500;
      this.refetchOnFocus = options.refetchOnFocus !== false;
      this.refetchOnReconnect = options.refetchOnReconnect !== false;
      // Optional: a FetchManager, for the get() shortcut.
      this.http = options.http || null;

      /** @type {Map<string, any>} hash → entry */
      this._entries = new Map();
      /** @type {Set<{ prefix: any[], callback: () => void }>} who reloads on invalidate */
      this._listeners = new Set();
      this._gcTimer = 0;
      this._destroyed = false;

      this._onVisible = () => {
         if (document.visibilityState === 'visible' && this.refetchOnFocus) this._refetchStale();
      };
      this._onOnline = () => {
         if (this.refetchOnReconnect) this._refetchStale();
      };
   }

   init() {
      document.addEventListener('visibilitychange', this._onVisible);
      window.addEventListener('online', this._onOnline);
      this._gcTimer = window.setInterval(() => this._collect(), Math.max(1000, Math.min(this.gcTime, 60_000)));
   }

   beforeDestroy() {
      this._destroyed = true;
      document.removeEventListener('visibilitychange', this._onVisible);
      window.removeEventListener('online', this._onOnline);
      clearInterval(this._gcTimer);
      for (const entry of this._entries.values()) {
         entry.controller?.abort();
         entry.observers.clear();
      }
      this._entries.clear();
      this._listeners.clear();
   }

   // ── Queries ─────────────────────────────────────────────────────

   /**
    * A query: a key and how to get its data. Asking twice for the same key
    * gives the same data (the last `fn` given is the one used).
    * @param {any} key  ['orders', { status: 'open' }]
    * @param {(ctx: { signal: AbortSignal, key: any[] }) => Promise<any>} fn
    * @param {{ staleTime?: number, retry?: number, initialData?: any }} [options]
    */
   query(key, fn, options = {}) {
      const entry = this._entry(toKey(key));
      if (typeof fn === 'function') entry.fn = fn;
      if (Number.isFinite(options.staleTime)) entry.staleTime = options.staleTime;
      if (Number.isFinite(options.retry)) entry.retry = options.retry;
      if (options.initialData !== undefined && entry.state.status === 'idle') {
         this._publish(entry, { status: 'ready', data: options.initialData, updatedAt: Date.now() });
      }
      return entry.handle;
   }

   /** A GET through `http` (a FetchManager), as a query. */
   get(key, url, options = {}) {
      if (!this.http) throw new Error('QueryService.get() needs `http` (a FetchManager) in its props.');
      return this.query(key, ({ signal }) => this.http.get(url, { ...options, signal }), options);
   }

   /**
    * A `load` for DataList, Table or DescriptionList: each query they send
    * (page, search, filters, sort) is its own key under `prefix`, cached and
    * shared. An invalidation under `prefix` makes them load again.
    * @param {any[] | ((params: any) => any[])} prefix  ['orders', 'list'], or params → key
    * @param {(params: any, ctx: { signal: AbortSignal }) => Promise<any>} fn
    * @param {{ staleTime?: number, retry?: number, base?: any[] }} [options]
    *   `base` is where the listener sits when `prefix` is a key function that
    *   does not put the params last; by default the prefix itself (or the
    *   function's key without its last part).
    */
   loader(prefix, fn, options = {}) {
      const keyOf = typeof prefix === 'function' ? prefix : (params) => [...toKey(prefix), params];
      const base = options.base !== undefined
         ? toKey(options.base)
         : typeof prefix === 'function'
            ? toKey(prefix({})).slice(0, -1)
            : toKey(prefix);
      const load = (query = {}) => {
         const { signal, ...params } = query || {};
         const handle = this.query(keyOf(params), (ctx) => fn(params, ctx), options);
         return handle.load({ signal });
      };
      return this._subscribable(load, base);
   }

   /**
    * Run a change, then make what it touched stale (and refetch what is shown).
    * @param {() => Promise<any>} fn
    * @param {{ invalidates?: any[], onSuccess?: (result: any) => any, onError?: (error: any) => any }} [options]
    */
   async mutate(fn, { invalidates = [], onSuccess, onError } = {}) {
      try {
         const result = await fn();
         await onSuccess?.(result);
         for (const prefix of invalidates) this.invalidate(prefix);
         return result;
      } catch (error) {
         onError?.(error);
         throw error;
      }
   }

   /** Everything under `prefix` is stale; what is in use asks again now. */
   invalidate(prefix = []) {
      const target = toKey(prefix);
      for (const entry of this._entries.values()) {
         if (!startsWith(entry.key, target)) continue;
         entry.updatedAt = 0;
         if (entry.promise) entry.refetchAfter = true;
         else if (this._active(entry)) this._fetch(entry).catch(() => {});
      }
      for (const listener of this._listeners) {
         if (startsWith(listener.prefix, target) || startsWith(target, listener.prefix)) listener.callback();
      }
   }

   /** Ask before it is needed (a link the pointer is on). Errors are kept in the state. */
   prefetch(key, fn, options) {
      return this.query(key, fn, options).load().catch(() => undefined);
   }

   /** The data of a key now (undefined when there is none). */
   getData(key) {
      return this._entries.get(stable(toKey(key)))?.state.data;
   }

   /**
    * Change the data of a key without asking the server: after a save that
    * returned the new record, or for an optimistic change.
    */
   setData(key, updater) {
      const entry = this._entry(toKey(key));
      const data = typeof updater === 'function' ? updater(entry.state.data) : updater;
      this._publish(entry, { status: 'ready', data, error: null, updatedAt: Date.now() });
      return data;
   }

   /**
    * Forget the queries under `prefix` (all of them without one): their data
    * goes, and who watches them sees 'idle' (a sign-out, say).
    */
   remove(prefix = []) {
      const target = toKey(prefix);
      for (const [hash, entry] of [...this._entries]) {
         if (!startsWith(entry.key, target)) continue;
         entry.controller?.abort();
         entry.updatedAt = 0;
         this._publish(entry, IDLE);
         // A component still holds its handle: keep the entry, empty.
         if (!this._active(entry)) this._entries.delete(hash);
      }
   }

   /**
    * Every query as it is now, for debugging:
    * [{ key, status, fetching, updatedAt, stale, watchers }].
    */
   inspect() {
      return [...this._entries.values()].map((entry) => ({
         key: entry.key,
         status: entry.state.status,
         fetching: entry.state.fetching,
         updatedAt: entry.state.updatedAt,
         stale: !this._fresh(entry),
         watchers: this._active(entry) ? entry.observers.size : 0,
         data: entry.state.data,
         error: entry.state.error,
      }));
   }

   // ── Entries ─────────────────────────────────────────────────────

   _entry(key) {
      const hash = stable(key);
      let entry = this._entries.get(hash);
      if (entry) {
         entry.lastUsed = Date.now();
         return entry;
      }
      entry = {
         key, hash, fn: null, state: IDLE, data: undefined,
         updatedAt: 0, staleTime: null, retry: null,
         promise: null, controller: null, refetchAfter: false, waiters: 0,
         observers: new Map(), lastUsed: Date.now(), handle: null, publishing: false,
      };
      entry.handle = this._handle(entry);
      this._entries.set(hash, entry);
      return entry;
   }

   // What a component holds: read, load, refresh, watch.
   _handle(entry) {
      const service = this;
      const load = this._subscribable((options = {}) => service._load(entry, options), entry.key);
      return {
         key: entry.key,
         get state() { return entry.state; },
         get data() { return entry.state.data; },
         /** Load if needed (fresh: nothing; in flight: shared). Also usable as a component's `load`. */
         load,
         /** Ask again, showing what there is meanwhile. */
         refresh: () => service._load(entry, { force: true }),
         /** Make it stale (and refetch it if it is in use). */
         invalidate: () => service.invalidate(entry.key),
         setData: (updater) => service.setData(entry.key, updater),
         /**
          * Call `callback(state)` now and on every change, while `component`
          * lives: when it is destroyed it is forgotten, as slice.events does.
          * Returns a function to stop sooner.
          */
         watch(component, callback) {
            if (!component?.sliceId) throw new Error('watch(component, callback) needs a Slice component, to stop when it is destroyed.');
            if (typeof callback !== 'function') throw new Error('watch(component, callback) needs a callback.');
            const observer = { component, callback };
            entry.observers.set(observer, component);
            entry.lastUsed = Date.now();
            callback(entry.state);
            return () => { entry.observers.delete(observer); };
         },
      };
   }

   // A function that a component can also subscribe to: DataList, Table and
   // DescriptionList call `load.subscribe(reload)`, and an invalidation under
   // `prefix` reaches them.
   _subscribable(fn, prefix) {
      const service = this;
      return Object.assign(fn, {
         subscribe(callback) {
            const listener = { prefix: toKey(prefix), callback };
            service._listeners.add(listener);
            return () => service._listeners.delete(listener);
         },
      });
   }

   _fresh(entry) {
      const staleTime = entry.staleTime ?? this.staleTime;
      return entry.state.status === 'ready' && entry.updatedAt > 0 && Date.now() - entry.updatedAt < staleTime;
   }

   // A watching component is alive while the controller still has it (the
   // same check slice.events makes); the dead ones are dropped here.
   _prune(entry) {
      for (const [observer, component] of entry.observers) {
         if (slice.controller.activeComponents.get(component.sliceId) !== component) entry.observers.delete(observer);
      }
   }

   // In use: some component that watches it is still alive.
   _active(entry) {
      this._prune(entry);
      return entry.observers.size > 0;
   }

   /** @param {any} entry @param {{ force?: boolean, signal?: AbortSignal }} [options] */
   _load(entry, { force = false, signal } = {}) {
      entry.lastUsed = Date.now();
      if (!force && this._fresh(entry)) return Promise.resolve(entry.state.data);
      if (!entry.fn) return Promise.reject(new Error(`No function to load ${entry.hash}. Give one to query().`));
      const shared = this._fetch(entry, { force });
      // Nobody may be listening (a load() not awaited in init): the failure is
      // in the state, so it must not become an unhandled rejection.
      shared.catch(() => {});
      if (!signal) return shared;
      if (signal.aborted) return Promise.reject(abortError(signal));

      // This caller stops waiting when its signal aborts; the request itself
      // is cancelled only when nobody else waits for it and nothing shows it.
      entry.waiters += 1;
      return new Promise((resolve, reject) => {
         let done = false;
         const finish = () => {
            if (done) return;
            done = true;
            entry.waiters -= 1;
            signal.removeEventListener('abort', onAbort);
         };
         const onAbort = () => {
            finish();
            if (entry.waiters <= 0 && !this._active(entry)) entry.controller?.abort();
            reject(abortError(signal));
         };
         signal.addEventListener('abort', onAbort, { once: true });
         shared.then((data) => { finish(); resolve(data); }, (error) => { finish(); reject(error); });
      });
   }

   _fetch(entry, { force = false } = {}) {
      if (entry.promise) {
         if (force) entry.refetchAfter = true;
         return entry.promise;
      }
      const controller = new AbortController();
      entry.controller = controller;
      const hasData = entry.state.data !== undefined;
      this._publish(entry, { status: hasData ? entry.state.status === 'error' ? 'ready' : entry.state.status : 'loading', fetching: true, error: hasData ? entry.state.error : null });
      const retries = entry.retry ?? this.retry;

      const run = async () => {
         for (let attempt = 0; ; attempt += 1) {
            try {
               return await entry.fn({ signal: controller.signal, key: entry.key });
            } catch (error) {
               if (controller.signal.aborted || attempt >= retries || !worthRetrying(error)) throw error;
               await new Promise((r) => setTimeout(r, this.retryDelay * 2 ** attempt));
               if (controller.signal.aborted) throw abortError(controller.signal);
            }
         }
      };

      entry.promise = run()
         .then((data) => {
            if (this._destroyed) return data;
            entry.updatedAt = Date.now();
            this._publish(entry, { status: 'ready', data, error: null, fetching: false, updatedAt: entry.updatedAt });
            return data;
         }, (error) => {
            if (!this._destroyed) {
               if (controller.signal.aborted) {
                  // Cancelled: back to what it was, still not fetching.
                  this._publish(entry, { status: entry.state.data !== undefined ? 'ready' : 'idle', fetching: false });
               } else {
                  this._publish(entry, { status: 'error', error, fetching: false });
               }
            }
            throw error;
         })
         .finally(() => {
            if (entry.controller === controller) entry.controller = null;
            entry.promise = null;
            if (entry.refetchAfter && !this._destroyed) {
               entry.refetchAfter = false;
               this._fetch(entry).catch(() => {});
            }
         });
      return entry.promise;
   }

   _refetchStale() {
      for (const entry of this._entries.values()) {
         if (!this._fresh(entry) && entry.fn && this._active(entry)) this._fetch(entry).catch(() => {});
      }
   }

   // Forget what nobody has used for gcTime.
   _collect() {
      const now = Date.now();
      for (const [hash, entry] of [...this._entries]) {
         if (entry.promise || this._active(entry) || entry.waiters > 0) continue;
         if (now - entry.lastUsed < this.gcTime) continue;
         this._entries.delete(hash);
      }
   }

   // ── Telling who watches ────────────────────────────────────────

   // A new, frozen state each time: a watcher can compare by reference.
   _publish(entry, changes) {
      entry.state = Object.freeze({ ...IDLE, ...entry.state, ...changes });
      if (this._destroyed) return;
      this._prune(entry);
      // A watcher may publish again (a `setData` in its callback). The nested
      // call only records the new state; this loop then starts another pass, so
      // every watcher ends on the newest state instead of the one that happened
      // to be current when the loop started.
      if (entry.publishing) return;
      entry.publishing = true;
      try {
         let delivered;
         do {
            delivered = entry.state;
            for (const observer of [...entry.observers.keys()]) {
               if (entry.state !== delivered) break; // changed under us: another pass
               try {
                  observer.callback(delivered);
               } catch (error) {
                  slice.logger.error('QueryService', `A watcher of ${entry.hash} failed`, error);
               }
            }
         } while (entry.state !== delivered);
      } finally {
         entry.publishing = false;
      }
   }
}
