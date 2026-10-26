// InfiniteScrollService — loads the next page when the end of a list comes
// into view. Headless: it draws nothing. You put an element (the "sentinel")
// at the end of your list; the service watches it and calls your `load`.
//
//   const scroller = await slice.build('InfiniteScrollService', { singleton: true });
//   const feed = scroller.attach(sentinel, {
//      root: listBox,                 // the scrolling box (null: the page)
//      load: async ({ page, cursor, signal }) => {
//         const res = await fetch(`/api/posts?page=${page}`, { signal });
//         return res.json();          // { items, cursor?, done? } or an array
//      },
//      onItems: (items) => render(items),
//      onStateChange: (state) => showSpinner(state === 'loading'),
//   });
//   …
//   feed.reset();                     // the search changed: from page 1 again
//   scroller.detach(sentinel);        // or feed.destroy()
//
// What it takes care of:
//   - one request at a time: scrolling fast never asks for a page twice;
//   - reset() aborts the request in flight (its `signal`), and a late answer
//     to an old query is dropped, so results never mix;
//   - a first page that does not fill the box loads the next one, until the
//     box scrolls or there is nothing more;
//   - errors stop it in 'error' until retry(); the end stops it in 'done'.
//
// The end comes from the answer: `done: true`, `hasMore: false`, a `cursor`
// key that is null, an empty page, or fewer items than `pageSize`.

const STATES = ['idle', 'loading', 'error', 'done'];

class Feed {
   constructor(service, sentinel, config) {
      this._service = service;
      this.sentinel = sentinel;
      this._config = {
         root: null,
         rootMargin: '600px',
         startPage: 1,
         pageSize: 0,
         auto: true,
         // After this many pages loaded by scrolling alone, wait for
         // loadMore() (a "Load more" button), so the footer stays reachable.
         autoLimit: Infinity,
         ...config,
      };
      this._state = 'idle';
      this._page = this._config.startPage;
      this._cursor = this._config.cursor ?? null;
      this._error = null;
      this._token = 0;
      this._controller = null;
      this._visible = false;
      this._autoLoads = 0;
      this._paused = false;
      this._destroyed = false;
      this._prefill = 0;

      if (typeof IntersectionObserver === 'function') {
         this._observer = new IntersectionObserver((entries) => {
            const entry = entries[entries.length - 1];
            this._visible = !!entry?.isIntersecting;
            if (this._visible) this._autoLoad();
         }, { root: this._config.root || null, rootMargin: this._config.rootMargin, threshold: 0 });
         this._observer.observe(sentinel);
      }
   }

   // ── State ─────────────────────────────────────────────────────

   /** 'idle' | 'loading' | 'error' | 'done' */
   get state() { return this._state; }
   get loading() { return this._state === 'loading'; }
   get done() { return this._state === 'done'; }
   get error() { return this._error; }
   /** The next page it will ask for. */
   get page() { return this._page; }
   /** The cursor it will send with the next request. */
   get cursor() { return this._cursor; }

   // ── Control ───────────────────────────────────────────────────

   /** Load the next page now (a "Load more" button). */
   loadMore() {
      if (this._destroyed || this._state === 'loading' || this._state === 'done') return Promise.resolve(false);
      this._autoLoads = 0;
      return this._load();
   }

   /** After an error: try the same page again. */
   retry() {
      if (this._state !== 'error') return Promise.resolve(false);
      return this._load();
   }

   /**
    * Start over (a new search, a new filter): the request in flight is
    * aborted and its answer dropped. With `load` (default), page 1 loads
    * right away.
    * @param {{ load?: boolean, page?: number, cursor?: any }} [options]
    */
   reset({ load = true, page, cursor } = {}) {
      this._abort();
      this._page = page ?? this._config.startPage;
      this._cursor = cursor ?? this._config.cursor ?? null;
      this._error = null;
      this._autoLoads = 0;
      this._prefill = 0;
      this._setState('idle');
      if (load && !this._destroyed) return this._load();
      return Promise.resolve(false);
   }

   /** Stop loading on scroll (loadMore() still works). */
   pause() { this._paused = true; }

   resume() {
      this._paused = false;
      this._checkVisible();
   }

   /** Change options later: { load, pageSize, auto, autoLimit, … }. */
   configure(config = {}) {
      Object.assign(this._config, config);
   }

   destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      this._abort();
      this._observer?.disconnect();
      this._observer = null;
      this._service._forget(this.sentinel, this);
   }

   // ── Loading ───────────────────────────────────────────────────

   _autoLoad() {
      if (this._destroyed || this._paused || !this._config.auto) return;
      if (this._state !== 'idle') return;
      if (this._autoLoads >= this._config.autoLimit) return;
      this._autoLoads += 1;
      this._load();
   }

   async _load() {
      const load = this._config.load;
      if (typeof load !== 'function') return false;
      this._abort();
      const token = ++this._token;
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      this._controller = controller;
      const page = this._page;
      const cursor = this._cursor;
      this._error = null;
      this._setState('loading');

      let result;
      try {
         result = await load({ page, cursor, pageSize: this._config.pageSize, signal: controller?.signal, feed: this });
      } catch (error) {
         if (token !== this._token || this._destroyed) return false;
         // An abort we asked for is not an error.
         if (error?.name === 'AbortError') return false;
         this._controller = null;
         this._error = error || new Error('Load failed');
         this._setState('error');
         this._config.onError?.(this._error, { page, cursor });
         return false;
      }
      // An answer to an old query (reset or destroyed meanwhile): dropped.
      if (token !== this._token || this._destroyed) return false;
      this._controller = null;

      const { items, done, nextCursor } = this._read(result);
      this._page = page + 1;
      this._cursor = nextCursor;
      try {
         this._config.onItems?.(items, { page, cursor, first: page === this._config.startPage, feed: this });
      } catch (error) {
         slice?.logger?.logError?.('InfiniteScrollService', 'onItems threw', error);
      }
      this._setState(done ? 'done' : 'idle');
      if (!done) this._afterLoad();
      return true;
   }

   _read(result) {
      const items = Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : [];
      const object = result && !Array.isArray(result) && typeof result === 'object' ? result : {};
      const hasCursorKey = Object.prototype.hasOwnProperty.call(object, 'cursor') || Object.prototype.hasOwnProperty.call(object, 'nextCursor');
      const nextCursor = object.nextCursor ?? object.cursor ?? null;
      const pageSize = Number(this._config.pageSize) || 0;
      const done = object.done === true
         || object.hasMore === false
         || (hasCursorKey && (nextCursor === null || nextCursor === undefined))
         || items.length === 0
         || (pageSize > 0 && items.length < pageSize);
      return { items, done, nextCursor };
   }

   // The box is not full yet (the sentinel is still in view after the new
   // items were drawn): load the next page. The observer does not fire again
   // for a sentinel that never left the view, so this checks by hand.
   _afterLoad() {
      const check = () => {
         if (this._destroyed) return;
         this._checkVisible();
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(check));
      else setTimeout(check, 0);
   }

   _checkVisible() {
      if (this._destroyed || !this.sentinel.isConnected) return;
      const margin = parseFloat(this._config.rootMargin) || 0;
      const root = this._config.root;
      const box = root ? root.getBoundingClientRect() : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
      const rect = this.sentinel.getBoundingClientRect();
      this._visible = rect.top <= box.bottom + margin && rect.bottom >= box.top - margin;
      if (!this._visible) {
         this._prefill = 0;
         return;
      }
      // A guard against a list that never grows (items with no height).
      if (++this._prefill > 20) return;
      this._autoLoad();
   }

   _abort() {
      this._token += 1;
      this._controller?.abort();
      this._controller = null;
      if (this._state === 'loading') this._setState('idle');
   }

   _setState(state) {
      if (!STATES.includes(state) || state === this._state) return;
      this._state = state;
      this._config.onStateChange?.(state, { error: this._error, feed: this });
   }
}

export default class InfiniteScrollService {
   constructor() {
      /** @type {Map<Element, Feed>} */
      this._feeds = new Map();
   }

   /**
    * Watch `sentinel` and load pages as it comes into view.
    * @param {Element} sentinel  an element at the end of the list
    * @param {object} config     { load, onItems, onStateChange, onError, root,
    *                              rootMargin, pageSize, startPage, cursor, auto, autoLimit }
    */
   attach(sentinel, config = {}) {
      if (!(sentinel instanceof Element)) throw new TypeError('InfiniteScrollService.attach needs an element');
      this._feeds.get(sentinel)?.destroy();
      const feed = new Feed(this, sentinel, config);
      this._feeds.set(sentinel, feed);
      return feed;
   }

   /** Stop watching a sentinel; its request in flight is aborted. */
   detach(sentinel) {
      this._feeds.get(sentinel)?.destroy();
   }

   /** The feed attached to a sentinel, if any. */
   get(sentinel) {
      return this._feeds.get(sentinel) || null;
   }

   _forget(sentinel, feed) {
      if (this._feeds.get(sentinel) === feed) this._feeds.delete(sentinel);
   }

   // Framework teardown hook.
   beforeDestroy() {
      for (const feed of [...this._feeds.values()]) feed.destroy();
      this._feeds.clear();
   }
}