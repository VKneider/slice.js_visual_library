---
title: FetchManager
route: /docs/services/fetch-manager
navLabel: FetchManager
section: Services
group: Networking
order: 30
description: The app's HTTP client. get, post, patch… that return the data or throw an HttpError; baseUrl, default headers, query objects, JSON bodies, timeouts with your own signal, safe retries, and hooks to add a token or handle a 401 in one place.
component: FetchManagerDocumentation
generate: true
tags: [service, fetch, http, networking, api, request, error, retry, timeout, interceptor]
---

# FetchManager

## Overview
`FetchManager` is how a Slice app talks to its server. It is `fetch` with what every app ends up writing around it: a base URL, headers sent every time, a query object turned into `?page=2&status=open`, a body sent as JSON, the answer read the right way, a timeout, and — the important part — **a failed answer throws**.

```js
const http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });

const page = await http.get('/orders', { query: { page: 2, status: 'open' } });
const saved = await http.patch(`/orders/${id}`, { status: 'paid' });
```

It knows nothing about caching or about components. Keeping data, sharing it between components and refreshing it after a change is [QueryService](/docs/services/query-service), which uses the functions you write with this one. How the two fit into an app is in [Data and the first load](/docs/guides/data-and-loading#layers-transport-cache-and-your-domain).

### When to use it
- Any request to your own API or another HTTP API, from a domain Service (`OrdersService`), a `load` or a `commit`.
- You want errors you can show: the server's message, the status, the field.
- Every request needs the same token, header or 401 handling.

### When not to use it
- To keep data between pages or share it between components: [QueryService](/docs/services/query-service) (which calls this).
- Streaming answers you read as they arrive (Server-Sent Events, a `ReadableStream`): use `fetch` or `EventSource` directly, or `responseType: 'response'` and read `body` yourself.
- Uploads with a progress bar: `fetch` does not report upload progress; use `XMLHttpRequest` for that one request.

## Build it once
Build it as a singleton, usually in the App component or in a domain Service, so every part of the app uses the same configuration.

```js
const http = await slice.build('FetchManager', {
  singleton: true,
  sliceId: 'http',
  baseUrl: '/api',
  timeout: 15000,                       // ms; default 10000
  headers: { 'X-App-Version': '3.2.0' },
  credentials: 'include',               // send cookies to another origin
  retry: 2,                             // GET/HEAD only; see below
  onRequest: (request) => {
    const token = slice.context.getState('session')?.token;
    if (token) request.headers.Authorization = `Bearer ${token}`;
  },
  onResponseError: (error) => {
    if (error.status === 401) slice.router.navigate('/login');
  },
});
```

### Props
| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | `''` | Put before every relative URL. A full URL (`https://…`) is used as it is. |
| `timeout` | `number` | `10000` | Ms before a request fails with `kind: 'timeout'`. Per request: `{ timeout }`. |
| `headers` | `object` | `{}` | Sent with every request. `setDefaultHeaders()` adds more later. |
| `credentials` | `'omit' \| 'same-origin' \| 'include'` | — | As in `fetch`. |
| `retry` | `number \| { attempts, delay, statuses }` | `0` | Retries for GET and HEAD: on a network error, or on 408, 429, 500, 502, 503, 504. Waits `delay` (300 ms), then twice that…, or what `Retry-After` says. |
| `onRequest` | `(request) => void \| request` | — | Before each request. Change `request.headers`, `request.url`…, or return a new one. |
| `onResponse` | `(response, request) => void` | — | After each good answer (logging, reading a header). |
| `onResponseError` | `(error, request) => void` | — | Once for each failed request, after its retries. The error is still thrown to the caller. |

## Methods
| Method | Returns |
| --- | --- |
| `get(url, options?)` | `Promise<data>` |
| `post(url, body, options?)` | `Promise<data>` |
| `put(url, body, options?)` | `Promise<data>` |
| `patch(url, body, options?)` | `Promise<data>` |
| `delete(url, options?)` | `Promise<data>` |
| `head(url, options?)` | `Promise<null>` |
| `request(url, { method, body, … })` or `request({ url, method, … })` | `Promise<data>` |
| `setDefaultHeaders(headers)` | merges headers sent with every request |
| `url(path, query?)` | the full URL a request would use (for a link or an `<img src>`) |

### Options of a request
| Option | Description |
| --- | --- |
| `query` | An object for the query string. `null`, `undefined` and `''` are left out; an array repeats the key (`tags=a&tags=b`); a `Date` is sent as ISO. |
| `body` | An object or array is sent as JSON (with `Content-Type`). `FormData`, `Blob`, `URLSearchParams` and strings are sent as they are. |
| `headers` | Added to the default ones for this request. |
| `signal` | Your `AbortSignal`: cancel when the user leaves or asks again. Works together with `timeout`. |
| `timeout` | Ms, for this request. |
| `retry` | Overrides the service's `retry` for this request. |
| `responseType` | `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'response'` (the `Response`, unread). By default it follows the answer's `Content-Type`; a 204 gives `null`. |
| any `fetch` option | `cache`, `mode`, `keepalive`… are passed on. |

## Errors
A request that does not get a good answer **throws** an `HttpError`. Nothing to check after `await`: if the line after it runs, the data is good.

| Field | Meaning |
| --- | --- |
| `kind` | `'http'` (the server answered with a non-2xx status), `'network'` (no answer: offline, DNS, CORS), `'timeout'`. |
| `status` | The HTTP status; `0` when there was no answer. |
| `message` | The server's own message when it sent one (`body.message`, `body.error` or `body.detail`), else a plain sentence ("GET /api/orders answered 503."). |
| `body` | The answer, read (JSON or text). |
| `url`, `method`, `response` | What was asked, and the raw `Response`. |

Cancelling with your own `signal` is **not** an `HttpError`: it rejects with an `AbortError`, as `fetch` does. Components that take `load` already ignore it.

```js
try {
  await http.post('/users', { email });
} catch (error) {
  if (!(error instanceof http.HttpError)) throw error;          // a bug, not the server
  if (error.status === 422) emailInput.error = error.message;   // "That email is already in use."
  else toast.show({ tone: 'danger', message: error.message });
}
```

## Examples

### A domain Service
The usual place for requests is a Service per part of your app. Components call it; none of them build URLs.

```js
// src/Components/AppComponents/OrdersApi/OrdersApi.js
export default class OrdersApi {
  async init() {
    this.http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });
  }

  list({ page = 1, pageSize = 20, search = '', status, signal } = {}) {
    return this.http.get('/orders', { query: { page, size: pageSize, q: search, status }, signal });
  }
  get(id, { signal } = {}) { return this.http.get(`/orders/${id}`, { signal }); }
  update(id, changes) { return this.http.patch(`/orders/${id}`, changes); }
  remove(id) { return this.http.delete(`/orders/${id}`); }
  attach(id, file) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`/orders/${id}/files`, form);
  }
}
```

With [QueryService](/docs/services/query-service) on top, the same Service also keeps and shares what it loaded: see [the layers in the guide](/docs/guides/data-and-loading#layers-transport-cache-and-your-domain).

### A Table that loads pages from the server
`load` receives a `signal`. Pass it on, and a new search cancels the request for the old one.

```js
const orders = await slice.build('Table', {
  rowKey: 'id',
  pagination: { pageSize: 20 },
  columns: [{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }, { key: 'total', label: 'Total' }],
  load: ({ page, pageSize, search, signal }) =>
    http.get('/orders', { query: { page, size: pageSize, q: search }, signal }), // { items, total }
  commit: ({ row, key, value }) => http.patch(`/orders/${row.id}`, { [key]: value }),
});
```

When `commit` throws, the table takes the change back and shows `error.message`: the server's "Prices over 1,000 need approval." reaches the user without any code in between.

### Downloading a file
```js
const blob = await http.get(`/orders/${id}/invoice`, { responseType: 'blob' });
const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `invoice-${id}.pdf` });
link.click();
URL.revokeObjectURL(link.href);
```

### Refreshing a token once on 401
`onRequest` can return a new request, and `onResponseError` sees every failure. For a retry after refreshing, wrap the call:

```js
async function authed(call) {
  try {
    return await call();
  } catch (error) {
    if (error.status !== 401) throw error;
    await session.refresh();   // gets a new token into the 'session' context
    return call();             // onRequest adds the new one
  }
}

const me = await authed(() => http.get('/me'));
```

## Moving from `request(method, data, endpoint, …)`
The old call still works exactly as before, and the console warns once that it is deprecated. It returned the error body as if it were data and reported failures through callbacks; the new methods throw.

| Before | Now |
| --- | --- |
| `request('GET', null, '/orders')` | `get('/orders')` |
| `request('POST', data, '/orders', onOk, onError)` | `try { const saved = await post('/orders', data) } catch (error) { … }` |
| `request(…, refetchOnError = true)` | `retry: 1` (only GET and HEAD: a POST asked twice may create twice) |
| `enableCache()` | [QueryService](/docs/services/query-service): a cache per query, freshness, refresh after a change |

## Best practices
:::tip
- Build it once (`singleton: true`) and give components functions (`orders.list`), not URLs.
- Pass `signal` from `load` to `get`: a new search cancels the old request, and leaving the page cancels everything.
- Return useful messages from the server (`{ "message": "…" }`): `HttpError` shows them as they are.
- Put the token in `onRequest` and the 401 in `onResponseError`, not in every call.
:::

## Pitfalls
:::warning
Retries are only for GET and HEAD. A POST that timed out may have been saved; asking again could create the order twice. If your API supports it, send an idempotency key and retry it yourself.
:::

:::warning
Do not await requests in a component's `init()`: the app's loader waits for it. Give the request to a component's `load`, or start it without `await`. See [Data and the first load](/docs/guides/data-and-loading).
:::
