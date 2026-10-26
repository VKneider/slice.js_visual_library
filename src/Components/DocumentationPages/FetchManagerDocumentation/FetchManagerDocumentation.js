export default class FetchManagerDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [];
  }

  async init() {
    this.markdownPath = "fetch-manager.md";
    this.markdownContent = "---\ntitle: FetchManager\nroute: /docs/services/fetch-manager\nnavLabel: FetchManager\nsection: Services\ngroup: Networking\norder: 30\ndescription: The app's HTTP client. get, post, patch… that return the data or throw an HttpError; baseUrl, default headers, query objects, JSON bodies, timeouts with your own signal, safe retries, and hooks to add a token or handle a 401 in one place.\ncomponent: FetchManagerDocumentation\ngenerate: true\ntags: [service, fetch, http, networking, api, request, error, retry, timeout, interceptor]\n---\n\n# FetchManager\n\n## Overview\n`FetchManager` is how a Slice app talks to its server. It is `fetch` with what every app ends up writing around it: a base URL, headers sent every time, a query object turned into `?page=2&status=open`, a body sent as JSON, the answer read the right way, a timeout, and — the important part — **a failed answer throws**.\n\n```js\nconst http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });\n\nconst page = await http.get('/orders', { query: { page: 2, status: 'open' } });\nconst saved = await http.patch(`/orders/${id}`, { status: 'paid' });\n```\n\nIt knows nothing about caching or about components. Keeping data, sharing it between components and refreshing it after a change is [QueryService](/docs/services/query-service), which uses the functions you write with this one. How the two fit into an app is in [Data and the first load](/docs/guides/data-and-loading#layers-transport-cache-and-your-domain).\n\n### When to use it\n- Any request to your own API or another HTTP API, from a domain Service (`OrdersService`), a `load` or a `commit`.\n- You want errors you can show: the server's message, the status, the field.\n- Every request needs the same token, header or 401 handling.\n\n### When not to use it\n- To keep data between pages or share it between components: [QueryService](/docs/services/query-service) (which calls this).\n- Streaming answers you read as they arrive (Server-Sent Events, a `ReadableStream`): use `fetch` or `EventSource` directly, or `responseType: 'response'` and read `body` yourself.\n- Uploads with a progress bar: `fetch` does not report upload progress; use `XMLHttpRequest` for that one request.\n\n## Build it once\nBuild it as a singleton, usually in the App component or in a domain Service, so every part of the app uses the same configuration.\n\n```js\nconst http = await slice.build('FetchManager', {\n  singleton: true,\n  sliceId: 'http',\n  baseUrl: '/api',\n  timeout: 15000,                       // ms; default 10000\n  headers: { 'X-App-Version': '3.2.0' },\n  credentials: 'include',               // send cookies to another origin\n  retry: 2,                             // GET/HEAD only; see below\n  onRequest: (request) => {\n    const token = slice.context.getState('session')?.token;\n    if (token) request.headers.Authorization = `Bearer ${token}`;\n  },\n  onResponseError: (error) => {\n    if (error.status === 401) slice.router.navigate('/login');\n  },\n});\n```\n\n### Props\n| Prop | Type | Default | Description |\n| --- | --- | --- | --- |\n| `baseUrl` | `string` | `''` | Put before every relative URL. A full URL (`https://…`) is used as it is. |\n| `timeout` | `number` | `10000` | Ms before a request fails with `kind: 'timeout'`. Per request: `{ timeout }`. |\n| `headers` | `object` | `{}` | Sent with every request. `setDefaultHeaders()` adds more later. |\n| `credentials` | `'omit' \\| 'same-origin' \\| 'include'` | — | As in `fetch`. |\n| `retry` | `number \\| { attempts, delay, statuses }` | `0` | Retries for GET and HEAD: on a network error, or on 408, 429, 500, 502, 503, 504. Waits `delay` (300 ms), then twice that…, or what `Retry-After` says. |\n| `onRequest` | `(request) => void \\| request` | — | Before each request. Change `request.headers`, `request.url`…, or return a new one. |\n| `onResponse` | `(response, request) => void` | — | After each good answer (logging, reading a header). |\n| `onResponseError` | `(error, request) => void` | — | Once for each failed request, after its retries. The error is still thrown to the caller. |\n\n## Methods\n| Method | Returns |\n| --- | --- |\n| `get(url, options?)` | `Promise<data>` |\n| `post(url, body, options?)` | `Promise<data>` |\n| `put(url, body, options?)` | `Promise<data>` |\n| `patch(url, body, options?)` | `Promise<data>` |\n| `delete(url, options?)` | `Promise<data>` |\n| `head(url, options?)` | `Promise<null>` |\n| `request(url, { method, body, … })` or `request({ url, method, … })` | `Promise<data>` |\n| `setDefaultHeaders(headers)` | merges headers sent with every request |\n| `url(path, query?)` | the full URL a request would use (for a link or an `<img src>`) |\n\n### Options of a request\n| Option | Description |\n| --- | --- |\n| `query` | An object for the query string. `null`, `undefined` and `''` are left out; an array repeats the key (`tags=a&tags=b`); a `Date` is sent as ISO. |\n| `body` | An object or array is sent as JSON (with `Content-Type`). `FormData`, `Blob`, `URLSearchParams` and strings are sent as they are. |\n| `headers` | Added to the default ones for this request. |\n| `signal` | Your `AbortSignal`: cancel when the user leaves or asks again. Works together with `timeout`. |\n| `timeout` | Ms, for this request. |\n| `retry` | Overrides the service's `retry` for this request. |\n| `responseType` | `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'response'` (the `Response`, unread). By default it follows the answer's `Content-Type`; a 204 gives `null`. |\n| any `fetch` option | `cache`, `mode`, `keepalive`… are passed on. |\n\n## Errors\nA request that does not get a good answer **throws** an `HttpError`. Nothing to check after `await`: if the line after it runs, the data is good.\n\n| Field | Meaning |\n| --- | --- |\n| `kind` | `'http'` (the server answered with a non-2xx status), `'network'` (no answer: offline, DNS, CORS), `'timeout'`, `'parse'` (the answer said it was JSON and was not). |\n| `status` | The HTTP status; `0` when there was no answer. |\n| `message` | The server's own message when it sent one (`body.message`, `body.error` or `body.detail`), else a plain sentence (\"GET /api/orders answered 503.\"). |\n| `body` | The answer, read (JSON or text). |\n| `url`, `method`, `response` | What was asked, and the raw `Response`. |\n\nCancelling with your own `signal` is **not** an `HttpError`: it rejects with an `AbortError`, as `fetch` does. Components that take `load` already ignore it.\n\n```js\ntry {\n  await http.post('/users', { email });\n} catch (error) {\n  if (!(error instanceof http.HttpError)) throw error;          // a bug, not the server\n  if (error.status === 422) emailInput.error = error.message;   // \"That email is already in use.\"\n  else toast.show({ tone: 'danger', message: error.message });\n}\n```\n\n## Examples\n\n### A domain Service\nThe usual place for requests is a Service per part of your app. Components call it; none of them build URLs.\n\n```js\n// src/Components/AppComponents/OrdersApi/OrdersApi.js\nexport default class OrdersApi {\n  async init() {\n    this.http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });\n  }\n\n  list({ page = 1, pageSize = 20, search = '', status, signal } = {}) {\n    return this.http.get('/orders', { query: { page, size: pageSize, q: search, status }, signal });\n  }\n  get(id, { signal } = {}) { return this.http.get(`/orders/${id}`, { signal }); }\n  update(id, changes) { return this.http.patch(`/orders/${id}`, changes); }\n  remove(id) { return this.http.delete(`/orders/${id}`); }\n  attach(id, file) {\n    const form = new FormData();\n    form.append('file', file);\n    return this.http.post(`/orders/${id}/files`, form);\n  }\n}\n```\n\nWith [QueryService](/docs/services/query-service) on top, the same Service also keeps and shares what it loaded: see [the layers in the guide](/docs/guides/data-and-loading#layers-transport-cache-and-your-domain).\n\n### A Table that loads pages from the server\n`load` receives a `signal`. Pass it on, and a new search cancels the request for the old one.\n\n```js\nconst orders = await slice.build('Table', {\n  rowKey: 'id',\n  pagination: { pageSize: 20 },\n  columns: [{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }, { key: 'total', label: 'Total' }],\n  load: ({ page, pageSize, search, signal }) =>\n    http.get('/orders', { query: { page, size: pageSize, q: search }, signal }), // { items, total }\n  commit: ({ row, key, value }) => http.patch(`/orders/${row.id}`, { [key]: value }),\n});\n```\n\nWhen `commit` throws, the table takes the change back and shows `error.message`: the server's \"Prices over 1,000 need approval.\" reaches the user without any code in between.\n\n### Downloading a file\n```js\nconst blob = await http.get(`/orders/${id}/invoice`, { responseType: 'blob' });\nconst link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `invoice-${id}.pdf` });\nlink.click();\nURL.revokeObjectURL(link.href);\n```\n\n### Refreshing a token once on 401\n`onRequest` can return a new request, and `onResponseError` sees every failure. For a retry after refreshing, wrap the call:\n\n```js\nasync function authed(call) {\n  try {\n    return await call();\n  } catch (error) {\n    if (error.status !== 401) throw error;\n    await session.refresh();   // gets a new token into the 'session' context\n    return call();             // onRequest adds the new one\n  }\n}\n\nconst me = await authed(() => http.get('/me'));\n```\n\n## Moving from `request(method, data, endpoint, …)`\nThe old call still works exactly as before, and the console warns once that it is deprecated. It returned the error body as if it were data and reported failures through callbacks; the new methods throw.\n\n| Before | Now |\n| --- | --- |\n| `request('GET', null, '/orders')` | `get('/orders')` |\n| `request('POST', data, '/orders', onOk, onError)` | `try { const saved = await post('/orders', data) } catch (error) { … }` |\n| `request(…, refetchOnError = true)` | `retry: 1` (only GET and HEAD: a POST asked twice may create twice) |\n| `enableCache()` | [QueryService](/docs/services/query-service): a cache per query, freshness, refresh after a change |\n\n## Best practices\n:::tip\n- Build it once (`singleton: true`) and give components functions (`orders.list`), not URLs.\n- Pass `signal` from `load` to `get`: a new search cancels the old request, and leaving the page cancels everything.\n- Return useful messages from the server (`{ \"message\": \"…\" }`): `HttpError` shows them as they are.\n- Put the token in `onRequest` and the 401 in `onResponseError`, not in every call.\n:::\n\n## Pitfalls\n:::warning\nRetries are only for GET and HEAD. A POST that timed out may have been saved; asking again could create the order twice. If your API supports it, send an idempotency key and retry it yourself.\n:::\n\n:::warning\nDo not await requests in a component's `init()`: the app's loader waits for it. Give the request to a component's `load`, or start it without `await`. See [Data and the first load](/docs/guides/data-and-loading).\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });\n\nconst page = await http.get('/orders', { query: { page: 2, status: 'open' } });\nconst saved = await http.patch(`/orders/${id}`, { status: 'paid' });",
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
            const code = await slice.build('CodeVisualizer', {
               value: "const http = await slice.build('FetchManager', {\n  singleton: true,\n  sliceId: 'http',\n  baseUrl: '/api',\n  timeout: 15000,                       // ms; default 10000\n  headers: { 'X-App-Version': '3.2.0' },\n  credentials: 'include',               // send cookies to another origin\n  retry: 2,                             // GET/HEAD only; see below\n  onRequest: (request) => {\n    const token = slice.context.getState('session')?.token;\n    if (token) request.headers.Authorization = `Bearer ${token}`;\n  },\n  onResponseError: (error) => {\n    if (error.status === 401) slice.router.navigate('/login');\n  },\n});",
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Prop | Type | Default | Description |","| --- | --- | --- | --- |","| `baseUrl` | `string` | `''` | Put before every relative URL. A full URL (`https://…`) is used as it is. |","| `timeout` | `number` | `10000` | Ms before a request fails with `kind: 'timeout'`. Per request: `{ timeout }`. |","| `headers` | `object` | `{}` | Sent with every request. `setDefaultHeaders()` adds more later. |","| `credentials` | `'omit' \\| 'same-origin' \\| 'include'` | — | As in `fetch`. |","| `retry` | `number \\| { attempts, delay, statuses }` | `0` | Retries for GET and HEAD: on a network error, or on 408, 429, 500, 502, 503, 504. Waits `delay` (300 ms), then twice that…, or what `Retry-After` says. |","| `onRequest` | `(request) => void \\| request` | — | Before each request. Change `request.headers`, `request.url`…, or return a new one. |","| `onResponse` | `(response, request) => void` | — | After each good answer (logging, reading a header). |","| `onResponseError` | `(error, request) => void` | — | Once for each failed request, after its retries. The error is still thrown to the caller. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
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
            const lines = ["| Method | Returns |","| --- | --- |","| `get(url, options?)` | `Promise<data>` |","| `post(url, body, options?)` | `Promise<data>` |","| `put(url, body, options?)` | `Promise<data>` |","| `patch(url, body, options?)` | `Promise<data>` |","| `delete(url, options?)` | `Promise<data>` |","| `head(url, options?)` | `Promise<null>` |","| `request(url, { method, body, … })` or `request({ url, method, … })` | `Promise<data>` |","| `setDefaultHeaders(headers)` | merges headers sent with every request |","| `url(path, query?)` | the full URL a request would use (for a link or an `<img src>`) |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
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
            const lines = ["| Option | Description |","| --- | --- |","| `query` | An object for the query string. `null`, `undefined` and `''` are left out; an array repeats the key (`tags=a&tags=b`); a `Date` is sent as ISO. |","| `body` | An object or array is sent as JSON (with `Content-Type`). `FormData`, `Blob`, `URLSearchParams` and strings are sent as they are. |","| `headers` | Added to the default ones for this request. |","| `signal` | Your `AbortSignal`: cancel when the user leaves or asks again. Works together with `timeout`. |","| `timeout` | Ms, for this request. |","| `retry` | Overrides the service's `retry` for this request. |","| `responseType` | `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'response'` (the `Response`, unread). By default it follows the answer's `Content-Type`; a 204 gives `null`. |","| any `fetch` option | `cache`, `mode`, `keepalive`… are passed on. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
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
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const lines = ["| Field | Meaning |","| --- | --- |","| `kind` | `'http'` (the server answered with a non-2xx status), `'network'` (no answer: offline, DNS, CORS), `'timeout'`, `'parse'` (the answer said it was JSON and was not). |","| `status` | The HTTP status; `0` when there was no answer. |","| `message` | The server's own message when it sent one (`body.message`, `body.error` or `body.detail`), else a plain sentence (\"GET /api/orders answered 503.\"). |","| `body` | The answer, read (JSON or text). |","| `url`, `method`, `response` | What was asked, and the raw `Response`. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
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
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "try {\n  await http.post('/users', { email });\n} catch (error) {\n  if (!(error instanceof http.HttpError)) throw error;          // a bug, not the server\n  if (error.status === 422) emailInput.error = error.message;   // \"That email is already in use.\"\n  else toast.show({ tone: 'danger', message: error.message });\n}",
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
               value: "// src/Components/AppComponents/OrdersApi/OrdersApi.js\nexport default class OrdersApi {\n  async init() {\n    this.http = await slice.build('FetchManager', { singleton: true, sliceId: 'http', baseUrl: '/api' });\n  }\n\n  list({ page = 1, pageSize = 20, search = '', status, signal } = {}) {\n    return this.http.get('/orders', { query: { page, size: pageSize, q: search, status }, signal });\n  }\n  get(id, { signal } = {}) { return this.http.get(`/orders/${id}`, { signal }); }\n  update(id, changes) { return this.http.patch(`/orders/${id}`, changes); }\n  remove(id) { return this.http.delete(`/orders/${id}`); }\n  attach(id, file) {\n    const form = new FormData();\n    form.append('file', file);\n    return this.http.post(`/orders/${id}/files`, form);\n  }\n}",
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
               value: "const orders = await slice.build('Table', {\n  rowKey: 'id',\n  pagination: { pageSize: 20 },\n  columns: [{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }, { key: 'total', label: 'Total' }],\n  load: ({ page, pageSize, search, signal }) =>\n    http.get('/orders', { query: { page, size: pageSize, q: search }, signal }), // { items, total }\n  commit: ({ row, key, value }) => http.patch(`/orders/${row.id}`, { [key]: value }),\n});",
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
               value: "const blob = await http.get(`/orders/${id}/invoice`, { responseType: 'blob' });\nconst link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `invoice-${id}.pdf` });\nlink.click();\nURL.revokeObjectURL(link.href);",
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
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "async function authed(call) {\n  try {\n    return await call();\n  } catch (error) {\n    if (error.status !== 401) throw error;\n    await session.refresh();   // gets a new token into the 'session' context\n    return call();             // onRequest adds the new one\n  }\n}\n\nconst me = await authed(() => http.get('/me'));",
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
         const container = this.querySelector('[data-block-id="doc-block-12"]');
         if (container) {
            const lines = ["| Before | Now |","| --- | --- |","| `request('GET', null, '/orders')` | `get('/orders')` |","| `request('POST', data, '/orders', onOk, onError)` | `try { const saved = await post('/orders', data) } catch (error) { … }` |","| `request(…, refetchOnError = true)` | `retry: 1` (only GET and HEAD: a POST asked twice may create twice) |","| `enableCache()` | SLICE_INLINE_LINK_5_TOKEN: a cache per query, freshness, refresh after a change |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
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
         const links = [{"text":"QueryService","path":"/docs/services/query-service"},{"text":"Data and the first load","path":"/docs/guides/data-and-loading#layers-transport-cache-and-your-domain"},{"text":"QueryService","path":"/docs/services/query-service"},{"text":"QueryService","path":"/docs/services/query-service"},{"text":"the layers in the guide","path":"/docs/guides/data-and-loading#layers-transport-cache-and-your-domain"},{"text":"QueryService","path":"/docs/services/query-service"},{"text":"Data and the first load","path":"/docs/guides/data-and-loading"}];
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
      label: 'â'
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

customElements.define('slice-fetchmanagerdocumentation', FetchManagerDocumentation);
