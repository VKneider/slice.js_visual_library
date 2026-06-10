---
title: FetchManager
route: /docs/services/fetch-manager
navLabel: FetchManager
section: Services
group: Networking
order: 30
description: HTTP client Service over fetch with timeout, base URL, default headers and a simple cache.
component: FetchManagerDocumentation
generate: true
tags: [service, fetch, http, networking]
---

# FetchManager

## Overview
`FetchManager` is a **Service** component: an HTTP client built on the native `fetch` API. It
adds an optional `baseUrl`, a request timeout (via `AbortController`), default headers, and a simple
last-request cache. It does **not** drive any loading UI — show your own busy state around calls (e.g.
a component's `loading` prop) if you want one.

Build it with an optional `baseUrl` and `timeout` (ms, default `10000`):

```javascript title="Build the service"
const api = await slice.build('FetchManager', {
  sliceId: 'FetchManager',
  baseUrl: 'https://api.example.com',
  timeout: 10000
});
```

## Methods

| Method | Returns | Description |
| --- | --- | --- |
| `request(method, data, endpoint, onSuccess, onError, refetchOnError, requestOptions)` | `Promise<any>` | Performs the request and resolves with the parsed JSON body. |
| `enableCache()` | `void` | Caches the last successful response (keyed by `endpoint`). |
| `disableCache()` | `void` | Turns the cache off. |
| `setDefaultHeaders(headers)` | `void` | Headers merged into every request. |

### `request` parameters

| Param | Type | Notes |
| --- | --- | --- |
| `method` | `'GET' \| 'POST' \| 'PUT' \| 'DELETE'` | Throws on anything else. |
| `data` | `object \| null` | Sent as a JSON body. Pass `null` for `GET`. |
| `endpoint` | `string` | Appended to `baseUrl` when one is set. |
| `onSuccess` | `(data, response) => void` | Called when `response.ok`. |
| `onError` | `(data, response) => void` | Called on a non-ok response. |
| `refetchOnError` | `boolean` | Retry **once** on error (default `false`). |
| `requestOptions` | `object` | Extra `fetch` options; `requestOptions.headers` are merged in. |

## Usage

```javascript title="GET request"
const api = await slice.build('FetchManager', {
  sliceId: 'FetchManager',
  baseUrl: 'https://jsonplaceholder.typicode.com'
});

const post = await api.request('GET', null, '/posts/1');
// -> { id: 1, title: '...', body: '...' }
```

```javascript title="POST with success/error callbacks"
const api = await slice.build('FetchManager', { sliceId: 'FetchManager' });

api.setDefaultHeaders({ Authorization: `Bearer ${token}` });

await api.request(
  'POST',
  { title: 'Hello', body: 'World' },
  'https://jsonplaceholder.typicode.com/posts',
  (data, res) => console.log('Created', res.status),
  (data, res) => console.warn('Failed', res.status),
  true // retry once on error
);
```

## Best Practices
:::tip
Set a `baseUrl` once and pass relative `endpoint`s. Use `setDefaultHeaders` for cross-cutting
headers like auth tokens. Tune `timeout` (ms) per service — the request aborts automatically
when it elapses.
:::

## Pitfalls
:::warning
`request` uses positional parameters — pass `null`/`undefined` to skip the ones you don't need,
and remember `data` must be `null` for `GET`. The built-in cache is intentionally simple: it
keys only on `endpoint` and remembers a single last response, so it's best for read-heavy,
low-variance calls (call `disableCache()` when responses must always be fresh).
:::
