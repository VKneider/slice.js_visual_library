export default class FetchManagerDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [];
  }

  async init() {
    this.markdownPath = "fetch-manager.md";
    this.markdownContent = "---\ntitle: FetchManager\nroute: /docs/services/fetch-manager\nnavLabel: FetchManager\nsection: Services\ngroup: Networking\norder: 30\ndescription: HTTP client Service over fetch with timeout, base URL, default headers and Loading integration.\ncomponent: FetchManagerDocumentation\ngenerate: true\ntags: [service, fetch, http, networking]\n---\n\n# FetchManager\n\n## Overview\n`FetchManager` is a **Service** component: an HTTP client built on the native `fetch` API. It\nadds an optional `baseUrl`, a request timeout (via `AbortController`), default headers, a simple\nlast-request cache, and automatic integration with the [`Loading`](/docs/feedback/loading)\noverlay — the spinner shows while a request is in flight and hides when it settles.\n\nBuild it with an optional `baseUrl` and `timeout` (ms, default `10000`):\n\n```javascript title=\"Build the service\"\nconst api = await slice.build('FetchManager', {\n  sliceId: 'FetchManager',\n  baseUrl: 'https://api.example.com',\n  timeout: 10000\n});\n```\n\n## Methods\n\n| Method | Returns | Description |\n| --- | --- | --- |\n| `request(method, data, endpoint, onSuccess, onError, refetchOnError, requestOptions)` | `Promise<any>` | Performs the request and resolves with the parsed JSON body. |\n| `enableCache()` | `void` | Caches the last successful response (keyed by `endpoint`). |\n| `disableCache()` | `void` | Turns the cache off. |\n| `setDefaultHeaders(headers)` | `void` | Headers merged into every request. |\n\n### `request` parameters\n\n| Param | Type | Notes |\n| --- | --- | --- |\n| `method` | `'GET' \\| 'POST' \\| 'PUT' \\| 'DELETE'` | Throws on anything else. |\n| `data` | `object \\| null` | Sent as a JSON body. Pass `null` for `GET`. |\n| `endpoint` | `string` | Appended to `baseUrl` when one is set. |\n| `onSuccess` | `(data, response) => void` | Called when `response.ok`. |\n| `onError` | `(data, response) => void` | Called on a non-ok response. |\n| `refetchOnError` | `boolean` | Retry **once** on error (default `false`). |\n| `requestOptions` | `object` | Extra `fetch` options; `requestOptions.headers` are merged in. |\n\n## Usage\n\n```javascript title=\"GET request\"\nconst api = await slice.build('FetchManager', {\n  sliceId: 'FetchManager',\n  baseUrl: 'https://jsonplaceholder.typicode.com'\n});\n\nconst post = await api.request('GET', null, '/posts/1');\n// -> { id: 1, title: '...', body: '...' }\n```\n\n```javascript title=\"POST with success/error callbacks\"\nconst api = await slice.build('FetchManager', { sliceId: 'FetchManager' });\n\napi.setDefaultHeaders({ Authorization: `Bearer ${token}` });\n\nawait api.request(\n  'POST',\n  { title: 'Hello', body: 'World' },\n  'https://jsonplaceholder.typicode.com/posts',\n  (data, res) => console.log('Created', res.status),\n  (data, res) => console.warn('Failed', res.status),\n  true // retry once on error\n);\n```\n\n## Best Practices\n:::tip\nSet a `baseUrl` once and pass relative `endpoint`s. Use `setDefaultHeaders` for cross-cutting\nheaders like auth tokens. Tune `timeout` (ms) per service — the request aborts automatically\nwhen it elapses.\n:::\n\n## Pitfalls\n:::warning\n`request` uses positional parameters — pass `null`/`undefined` to skip the ones you don't need,\nand remember `data` must be `null` for `GET`. The built-in cache is intentionally simple: it\nkeys only on `endpoint` and remembers a single last response, so it's best for read-heavy,\nlow-variance calls (call `disableCache()` when responses must always be fresh).\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const api = await slice.build('FetchManager', {\n  sliceId: 'FetchManager',\n  baseUrl: 'https://api.example.com',\n  timeout: 10000\n});",
               language: "javascript"
            });
            if ("Build the service") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build the service";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| Method | Returns | Description |","| --- | --- | --- |","| `request(method, data, endpoint, onSuccess, onError, refetchOnError, requestOptions)` | `Promise<any>` | Performs the request and resolves with the parsed JSON body. |","| `enableCache()` | `void` | Caches the last successful response (keyed by `endpoint`). |","| `disableCache()` | `void` | Turns the cache off. |","| `setDefaultHeaders(headers)` | `void` | Headers merged into every request. |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Param | Type | Notes |","| --- | --- | --- |","| `method` | `'GET' \\| 'POST' \\| 'PUT' \\| 'DELETE'` | Throws on anything else. |","| `data` | `object \\| null` | Sent as a JSON body. Pass `null` for `GET`. |","| `endpoint` | `string` | Appended to `baseUrl` when one is set. |","| `onSuccess` | `(data, response) => void` | Called when `response.ok`. |","| `onError` | `(data, response) => void` | Called on a non-ok response. |","| `refetchOnError` | `boolean` | Retry **once** on error (default `false`). |","| `requestOptions` | `object` | Extra `fetch` options; `requestOptions.headers` are merged in. |"];
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
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const api = await slice.build('FetchManager', {\n  sliceId: 'FetchManager',\n  baseUrl: 'https://jsonplaceholder.typicode.com'\n});\n\nconst post = await api.request('GET', null, '/posts/1');\n// -> { id: 1, title: '...', body: '...' }",
               language: "javascript"
            });
            if ("GET request") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "GET request";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const api = await slice.build('FetchManager', { sliceId: 'FetchManager' });\n\napi.setDefaultHeaders({ Authorization: `Bearer ${token}` });\n\nawait api.request(\n  'POST',\n  { title: 'Hello', body: 'World' },\n  'https://jsonplaceholder.typicode.com/posts',\n  (data, res) => console.log('Created', res.status),\n  (data, res) => console.warn('Failed', res.status),\n  true // retry once on error\n);",
               language: "javascript"
            });
            if ("POST with success/error callbacks") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "POST with success/error callbacks";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

  beforeDestroy() {
    // Cleanup timers, listeners, or pending work here
  }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: '❐'
    });

    container.appendChild(copyMenu);
  }

  async renderScriptScenarios() {
    if (!Array.isArray(this.scriptScenarios) || this.scriptScenarios.length === 0) return;
    const host = this.querySelector('.documentation-content');
    if (!host) return;

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

    const section = document.createElement('section');
    section.classList.add('doc-script-scenarios');

    const title = document.createElement('h2');
    title.textContent = 'Prop Scenarios';
    section.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.classList.add('doc-script-subtitle');
    subtitle.textContent = 'Interactive demos validating component behavior.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
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
          return createBuildFallbackNode(name);
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

      section.appendChild(demobox);
      demobox.appendCode(code);
      section.appendChild(errorMessage);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-fetchmanagerdocumentation', FetchManagerDocumentation);
