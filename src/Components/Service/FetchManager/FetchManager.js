// FetchManager — the app's HTTP client: how to talk to the server.
//
//   const http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });
//   const page = await http.get('/orders', { query: { page: 2, status: 'open' }, signal });
//   const saved = await http.patch(`/orders/${id}`, { status: 'paid' });
//
// What it does, so an app does not repeat it on every call:
//   - baseUrl, default headers, a query object turned into ?a=1&b=2;
//   - a body sent the right way: an object or array as JSON, FormData,
//     Blob, URLSearchParams or a string as they are;
//   - the answer read the right way: JSON, text, a Blob, or null when the
//     server sends nothing (204);
//   - a failed answer THROWS: an HttpError with status, body, url, method.
//     Never a 500's error body returned as if it were data;
//   - a timeout, together with your own `signal` (cancel when you want);
//   - retries, if asked, only where it is safe (GET/HEAD, network errors,
//     408/429/5xx), waiting longer each time and honouring Retry-After;
//   - onRequest / onResponse / onResponseError: add a token to every
//     request, send a 401 to the login page.
//
// It knows nothing about caching or components: that is QueryService, which
// takes any function that returns a promise — usually one that calls this.
//
// The old API, request(method, data, endpoint, onSuccess, onError, retry,
// options), still works as it did and warns once that it is deprecated.

const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const LEGACY_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const SAFE_TO_RETRY = ['GET', 'HEAD', 'OPTIONS'];
const RETRY_STATUSES = [408, 429, 500, 502, 503, 504];

let warnedLegacy = false;

/**
 * A request that did not get a good answer.
 *   kind 'http'     the server answered with a status that is not 2xx
 *   kind 'network'  there was no answer (offline, DNS, CORS)
 *   kind 'timeout'  the answer took longer than `timeout`
 * A request cancelled with your own `signal` is not an HttpError: it rejects
 * with the signal's reason (an AbortError), as fetch does.
 */
class HttpError extends Error {
   /**
    * @param {{ kind: 'http' | 'network' | 'timeout' | 'parse' | string, status?: number, statusText?: string,
    *   body?: any, url?: string, method?: string, response?: Response | null, cause?: any }} details
    */
   constructor({ kind, status = 0, statusText = '', body = null, url, method, response = null, cause }) {
      super(HttpError.messageFor({ kind, status, statusText, body, url, method }), cause ? { cause } : undefined);
      this.name = 'HttpError';
      this.kind = kind;
      this.status = status;
      this.statusText = statusText;
      this.body = body;
      this.url = url;
      this.method = method;
      this.response = response;
   }

   // The server's own message when it sent one ("That email is already in
   // use."), else what happened in plain words.
   static messageFor({ kind, status, statusText, body, url, method }) {
      const own = body && typeof body === 'object' ? (body.message || body.error || body.detail) : '';
      if (typeof own === 'string' && own) return own;
      if (typeof body === 'string' && body && body.length < 200 && !/^\s*</.test(body)) return body;
      if (kind === 'timeout') return `${method} ${url} took too long to answer.`;
      if (kind === 'network') return `${method} ${url} could not reach the server.`;
      return `${method} ${url} answered ${status}${statusText ? ` ${statusText}` : ''}.`;
   }
}

function isPlainObject(value) {
   if (!value || typeof value !== 'object') return false;
   const proto = Object.getPrototypeOf(value);
   return proto === Object.prototype || proto === null;
}

function wait(ms, signal) {
   return new Promise((resolve, reject) => {
      if (signal?.aborted) {
         reject(signal.reason);
         return;
      }
      const timer = setTimeout(() => {
         signal?.removeEventListener('abort', onAbort);
         resolve(undefined);
      }, ms);
      const onAbort = () => {
         clearTimeout(timer);
         reject(signal.reason);
      };
      signal?.addEventListener('abort', onAbort, { once: true });
   });
}

export default class FetchManager {
   static HttpError = HttpError;

   /**
    * @param {{ baseUrl?: string, timeout?: number, headers?: Record<string, string>, credentials?: RequestCredentials,
    *   retry?: number | { attempts?: number, delay?: number, statuses?: number[] },
    *   onRequest?: (request: any) => any, onResponse?: (response: Response, request: any) => any,
    *   onResponseError?: (error: HttpError, request: any) => any }} [props]
    */
   constructor(props = {}) {
      const options = props || {};
      this.baseUrl = typeof options.baseUrl === 'string' ? options.baseUrl : '';
      this.timeout = Number(options.timeout) > 0 ? Number(options.timeout) : 10000;
      /** @type {Record<string, string>} */
      this.headers = { ...(options.headers || {}) };
      this.credentials = options.credentials || undefined;
      this.retry = FetchManager._normalizeRetry(options.retry);
      this.onRequest = typeof options.onRequest === 'function' ? options.onRequest : null;
      this.onResponse = typeof options.onResponse === 'function' ? options.onResponse : null;
      this.onResponseError = typeof options.onResponseError === 'function' ? options.onResponseError : null;
      /** The class of the errors it throws: `error instanceof http.HttpError`. */
      this.HttpError = HttpError;

      // Requests in flight, cancelled if the service goes.
      this._inFlight = new Set();
      // The old API's cache (enableCache): last answer per method + url + body.
      this.methods = LEGACY_METHODS.slice();
      this.cacheEnabled = false;
      this.lastRequest = null;
   }

   beforeDestroy() {
      for (const controller of this._inFlight) controller.abort();
      this._inFlight.clear();
   }

   // ── The API ─────────────────────────────────────────────────────

   /** GET: the answer, read by its content type. */
   get(url, options = {}) { return this._send({ ...options, method: 'GET', url }); }
   head(url, options = {}) { return this._send({ ...options, method: 'HEAD', url }); }
   delete(url, options = {}) { return this._send({ ...options, method: 'DELETE', url }); }
   post(url, body, options = {}) { return this._send({ ...options, method: 'POST', url, body }); }
   put(url, body, options = {}) { return this._send({ ...options, method: 'PUT', url, body }); }
   patch(url, body, options = {}) { return this._send({ ...options, method: 'PATCH', url, body }); }

   /**
    * Any request: `request(url, { method, body, query, headers, signal, timeout, retry, responseType })`.
    * (The old form, request(method, data, endpoint, onSuccess, onError, retry, options), still works.)
    * @returns {Promise<any>}
    */
   request(...args) {
      if (FetchManager._isLegacyCall(args)) {
         // @ts-ignore — the old positional signature
         return this._legacyRequest(...args);
      }
      const [url, options = {}] = args;
      if (url && typeof url === 'object') return this._send({ ...url });
      return this._send({ ...options, url });
   }

   /** Headers sent with every request (merged over the ones already set). */
   setDefaultHeaders(headers) {
      this.headers = { ...this.headers, ...(headers || {}) };
   }

   /** The full URL a request would use: baseUrl + path + query. */
   url(path, query) {
      return this._buildUrl(path, query);
   }

   // Old API: a one-entry cache of the last answer. Kept for the old request();
   // caching belongs to QueryService.
   enableCache() { this.cacheEnabled = true; }
   disableCache() { this.cacheEnabled = false; this.lastRequest = null; }

   // ── The request ───────────────────────────────────────────────────

   async _send(options) {
      const method = String(options.method || 'GET').toUpperCase();
      if (!METHODS.includes(method)) throw new TypeError(`FetchManager: unknown method "${options.method}".`);
      const retry = options.retry !== undefined ? FetchManager._normalizeRetry(options.retry) : this.retry;
      const attempts = SAFE_TO_RETRY.includes(method) ? retry.attempts : 0;

      for (let attempt = 0; ; attempt += 1) {
         try {
            return await this._attempt({ ...options, method });
         } catch (error) {
            const retriable = error instanceof HttpError
               && (error.kind !== 'http' || retry.statuses.includes(error.status));
            if (!retriable || attempt >= attempts || options.signal?.aborted) throw error;
            await wait(FetchManager._retryDelay(error, retry.delay, attempt), options.signal);
         }
      }
   }

   async _attempt(options) {
      const { response, body, request } = await this._exchange(options);
      if (!response.ok) {
         const error = new HttpError({
            kind: 'http', status: response.status, statusText: response.statusText,
            body, url: request.url, method: request.method, response,
         });
         await this._failed(error, request);
         throw error;
      }
      return body;
   }

   // One round trip: the response and its body, whatever the status. Throws
   // only when there is no answer (network, timeout) or it was cancelled.
   async _exchange(options) {
      const { method, signal, query, responseType = 'auto' } = options;
      let request = {
         url: this._buildUrl(options.url, query),
         method,
         headers: { ...this.headers, ...(options.headers || {}) },
         body: options.body,
         credentials: options.credentials ?? this.credentials,
         timeout: Number(options.timeout) > 0 ? Number(options.timeout) : this.timeout,
      };
      // onRequest may change the request (a token) or return a new one.
      if (this.onRequest) request = (await this.onRequest(request)) || request;

      const init = this._init(request, options);
      const controller = new AbortController();
      this._inFlight.add(controller);
      let timedOut = false;
      const onAbort = () => controller.abort(signal?.reason);
      if (signal?.aborted) controller.abort(signal.reason);
      else signal?.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => {
         timedOut = true;
         controller.abort();
      }, request.timeout);

      try {
         let response;
         try {
            response = await fetch(request.url, { ...init, signal: controller.signal });
         } catch (cause) {
            if (signal?.aborted) throw signal.reason ?? cause;
            throw new HttpError({ kind: timedOut ? 'timeout' : 'network', url: request.url, method, cause });
         }
         if (this.onResponse) await this.onResponse(response, request);
         let body;
         try {
            body = await FetchManager._read(response, method, responseType);
         } catch (cause) {
            if (signal?.aborted) throw signal.reason ?? cause;
            if (timedOut) throw new HttpError({ kind: 'timeout', url: request.url, method, cause });
            // A body that is not what its type promised (broken JSON) is a real
            // failure, not "nothing came back".
            if (cause instanceof HttpError) throw cause;
            body = null;
         }
         return { response, body, request };
      } catch (error) {
         if (error instanceof HttpError) await this._failed(error, request);
         throw error;
      } finally {
         clearTimeout(timer);
         signal?.removeEventListener('abort', onAbort);
         this._inFlight.delete(controller);
      }
   }

   // Every failure goes through onResponseError once (a 401 to the login page).
   async _failed(error, request) {
      if (error._reported) return;
      error._reported = true;
      if (this.onResponseError) await this.onResponseError(error, request);
      else if (error.kind !== 'http') slice.logger?.warn?.('FetchManager', error.message, error);
   }

   _init(request, options) {
      const headers = { ...request.headers };
      let body = request.body;
      // An object or an array goes as JSON; FormData, Blob, URLSearchParams,
      // a string or a buffer go as they are (the browser sets their type).
      if (body !== undefined && body !== null && (isPlainObject(body) || Array.isArray(body))) {
         body = JSON.stringify(body);
         if (!Object.keys(headers).some((h) => h.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
      }
      if (!Object.keys(headers).some((h) => h.toLowerCase() === 'accept')) {
         headers.Accept = 'application/json, text/plain, */*';
      }
      const { url, method, timeout, query, retry, responseType, signal, body: _b, headers: _h, credentials, ...rest } = options;
      const init = { ...rest, method: request.method, headers };
      if (request.credentials) init.credentials = request.credentials;
      if (body !== undefined && body !== null && request.method !== 'GET' && request.method !== 'HEAD') init.body = body;
      return init;
   }

   _buildUrl(path, query) {
      const raw = String(path ?? '');
      let url = /^[a-z][a-z\d+\-.]*:\/\//i.test(raw) || raw.startsWith('//') || !this.baseUrl
         ? raw
         : `${this.baseUrl.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`;
      const search = FetchManager._queryString(query);
      if (search) url += (url.includes('?') ? '&' : '?') + search;
      return url;
   }

   // ── Helpers ─────────────────────────────────────────────────────

   // { page: 2, tags: ['a', 'b'], from: Date, q: null } → page=2&tags=a&tags=b&from=…
   static _queryString(query) {
      if (!query) return '';
      if (query instanceof URLSearchParams) return query.toString();
      if (typeof query === 'string') return query.replace(/^\?/, '');
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
         if (value === undefined || value === null || value === '') continue;
         const values = Array.isArray(value) ? value : [value];
         for (const item of values) {
            if (item === undefined || item === null) continue;
            params.append(key, item instanceof Date ? item.toISOString()
               : typeof item === 'object' ? JSON.stringify(item) : String(item));
         }
      }
      return params.toString();
   }

   static async _read(response, method, responseType) {
      if (responseType === 'response') return response;
      if (method === 'HEAD' || response.status === 204 || response.status === 205) return null;
      if (responseType === 'json') return FetchManager._json(response);
      if (responseType === 'text') return response.text();
      if (responseType === 'blob') return response.blob();
      if (responseType === 'arrayBuffer') return response.arrayBuffer();
      const type = (response.headers.get('content-type') || '').toLowerCase();
      if (type.includes('json')) return FetchManager._json(response);
      if (type.startsWith('text/') || type.includes('xml') || type.includes('html') || !type) {
         const text = await response.text();
         return text === '' ? null : text;
      }
      return response.blob();
   }

   // A 200 whose body claims to be JSON but is not is a broken answer, not "no
   // data": the caller has to be able to tell it from an empty one.
   static async _json(response) {
      const text = await response.text();
      if (!text.trim()) return null;
      try {
         return JSON.parse(text);
      } catch (cause) {
         throw new HttpError({ kind: 'parse', status: response.status, url: response.url, cause });
      }
   }

   static _normalizeRetry(retry) {
      if (typeof retry === 'number') return { attempts: Math.max(0, retry), delay: 300, statuses: RETRY_STATUSES };
      const value = retry && typeof retry === 'object' ? retry : {};
      return {
         attempts: Math.max(0, Number(value.attempts) || 0),
         delay: Number(value.delay) >= 0 ? Number(value.delay) : 300,
         statuses: Array.isArray(value.statuses) ? value.statuses : RETRY_STATUSES,
      };
   }

   // 300 ms, 600 ms, 1.2 s…, or what the server asked for (Retry-After).
   static _retryDelay(error, base, attempt) {
      const after = error.response?.headers?.get?.('retry-after');
      if (after) {
         const seconds = Number(after);
         if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30000);
         const date = Date.parse(after);
         if (Number.isFinite(date)) return Math.max(0, Math.min(date - Date.now(), 30000));
      }
      // ±20 %, so many clients coming back at once (a reconnect) do not retry
      // in lockstep.
      const wait = base * 2 ** attempt;
      return Math.round(wait * (0.8 + Math.random() * 0.4));
   }

   static _isLegacyCall(args) {
      return args.length >= 3 && typeof args[0] === 'string' && LEGACY_METHODS.includes(args[0])
         && (args[1] === null || args[1] === undefined || typeof args[1] === 'object') && typeof args[2] === 'string';
   }

   // ── The old API ────────────────────────────────────────────────

   /**
    * request(method, data, endpoint, onSuccess, onError, refetchOnError, requestOptions):
    * the answer's body, even for a failed status (after onError), as it always
    * did. New code: get / post / put / patch / delete, which throw on failure.
    */
   async _legacyRequest(method, data, endpoint, onRequestSuccess, onRequestError, refetchOnError = false, requestOptions = {}) {
      if (!warnedLegacy) {
         warnedLegacy = true;
         slice.logger?.warn?.('FetchManager', 'request(method, data, endpoint, …) is deprecated. Use http.get(url), http.post(url, body)…, which throw an HttpError when the answer is not ok.');
      }
      if (!LEGACY_METHODS.includes(method)) throw new Error('Invalid method');
      if (data && typeof data !== 'object') throw new Error('Invalid data, not JSON');

      // The cache is per method, endpoint and body: a POST never gets a GET's answer.
      const cacheKey = `${method} ${endpoint} ${data ? JSON.stringify(data) : ''}`;
      if (this.cacheEnabled && this.lastRequest?.key === cacheKey) return this.lastRequest.output;

      let exchange;
      try {
         exchange = await this._exchange({
            ...requestOptions,
            method,
            url: endpoint,
            body: data || undefined,
            headers: requestOptions?.headers,
         });
      } catch (error) {
         slice.logger?.logError?.('FetchManager', error?.kind === 'network' ? 'Lost internet connection' : 'Request failed', error);
         throw error;
      }
      const { response, body: output } = exchange;
      if (response.ok) {
         if (typeof onRequestSuccess === 'function') onRequestSuccess(data, response);
      } else {
         if (typeof onRequestError === 'function') onRequestError(data, response);
         if (refetchOnError) {
            return this._legacyRequest(method, data, endpoint, onRequestSuccess, onRequestError, false, requestOptions);
         }
      }
      if (this.cacheEnabled) this.lastRequest = { key: cacheKey, data, output, endpoint };
      return output;
   }
}