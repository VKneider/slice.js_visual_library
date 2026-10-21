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
    this.markdownContent = "---\r\ntitle: FetchManager\r\nroute: /docs/services/fetch-manager\r\nnavLabel: FetchManager\r\nsection: Services\r\ngroup: Networking\r\norder: 30\r\ndescription: HTTP client Service over fetch with timeout, base URL, default headers and a simple cache.\r\ncomponent: FetchManagerDocumentation\r\ngenerate: true\r\ntags: [service, fetch, http, networking]\r\n---\r\n\r\n# FetchManager\r\n\r\n## Overview\r\n`FetchManager` is a **Service** component: an HTTP client built on the native `fetch` API. It\r\nadds an optional `baseUrl`, a request timeout (via `AbortController`), default headers, and a simple\r\nlast-request cache. It does **not** drive any loading UI — show your own busy state around calls (e.g.\r\na component's `loading` prop) if you want one.\r\n\r\nBuild it with an optional `baseUrl` and `timeout` (ms, default `10000`):\r\n\r\n```javascript title=\"Build the service\"\r\nconst api = await slice.build('FetchManager', {\r\n  sliceId: 'FetchManager',\r\n  baseUrl: 'https://api.example.com',\r\n  timeout: 10000\r\n});\r\n```\r\n\r\n## Methods\r\n\r\n| Method | Returns | Description |\r\n| --- | --- | --- |\r\n| `request(method, data, endpoint, onSuccess, onError, refetchOnError, requestOptions)` | `Promise<any>` | Performs the request and resolves with the parsed JSON body. |\r\n| `enableCache()` | `void` | Caches the last successful response (keyed by `endpoint`). |\r\n| `disableCache()` | `void` | Turns the cache off. |\r\n| `setDefaultHeaders(headers)` | `void` | Headers merged into every request. |\r\n\r\n### `request` parameters\r\n\r\n| Param | Type | Notes |\r\n| --- | --- | --- |\r\n| `method` | `'GET' \\| 'POST' \\| 'PUT' \\| 'DELETE'` | Throws on anything else. |\r\n| `data` | `object \\| null` | Sent as a JSON body. Pass `null` for `GET`. |\r\n| `endpoint` | `string` | Appended to `baseUrl` when one is set. |\r\n| `onSuccess` | `(data, response) => void` | Called when `response.ok`. |\r\n| `onError` | `(data, response) => void` | Called on a non-ok response. |\r\n| `refetchOnError` | `boolean` | Retry **once** on error (default `false`). |\r\n| `requestOptions` | `object` | Extra `fetch` options; `requestOptions.headers` are merged in. |\r\n\r\n## Usage\r\n\r\n```javascript title=\"GET request\"\r\nconst api = await slice.build('FetchManager', {\r\n  sliceId: 'FetchManager',\r\n  baseUrl: 'https://jsonplaceholder.typicode.com'\r\n});\r\n\r\nconst post = await api.request('GET', null, '/posts/1');\r\n// -> { id: 1, title: '...', body: '...' }\r\n```\r\n\r\n```javascript title=\"POST with success/error callbacks\"\r\nconst api = await slice.build('FetchManager', { sliceId: 'FetchManager' });\r\n\r\napi.setDefaultHeaders({ Authorization: `Bearer ${token}` });\r\n\r\nawait api.request(\r\n  'POST',\r\n  { title: 'Hello', body: 'World' },\r\n  'https://jsonplaceholder.typicode.com/posts',\r\n  (data, res) => console.log('Created', res.status),\r\n  (data, res) => console.warn('Failed', res.status),\r\n  true // retry once on error\r\n);\r\n```\r\n\r\n## Best Practices\r\n:::tip\r\nSet a `baseUrl` once and pass relative `endpoint`s. Use `setDefaultHeaders` for cross-cutting\r\nheaders like auth tokens. Tune `timeout` (ms) per service — the request aborts automatically\r\nwhen it elapses.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\n`request` uses positional parameters — pass `null`/`undefined` to skip the ones you don't need,\r\nand remember `data` must be `null` for `GET`. The built-in cache is intentionally simple: it\r\nkeys only on `endpoint` and remembers a single last response, so it's best for read-heavy,\r\nlow-variance calls (call `disableCache()` when responses must always be fresh).\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const api = await slice.build('FetchManager', {\r\n  sliceId: 'FetchManager',\r\n  baseUrl: 'https://api.example.com',\r\n  timeout: 10000\r\n});\r",
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
            const lines = ["| Method | Returns | Description |\r","| --- | --- | --- |\r","| `request(method, data, endpoint, onSuccess, onError, refetchOnError, requestOptions)` | `Promise<any>` | Performs the request and resolves with the parsed JSON body. |\r","| `enableCache()` | `void` | Caches the last successful response (keyed by `endpoint`). |\r","| `disableCache()` | `void` | Turns the cache off. |\r","| `setDefaultHeaders(headers)` | `void` | Headers merged into every request. |\r"];
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Param | Type | Notes |\r","| --- | --- | --- |\r","| `method` | `'GET' \\| 'POST' \\| 'PUT' \\| 'DELETE'` | Throws on anything else. |\r","| `data` | `object \\| null` | Sent as a JSON body. Pass `null` for `GET`. |\r","| `endpoint` | `string` | Appended to `baseUrl` when one is set. |\r","| `onSuccess` | `(data, response) => void` | Called when `response.ok`. |\r","| `onError` | `(data, response) => void` | Called on a non-ok response. |\r","| `refetchOnError` | `boolean` | Retry **once** on error (default `false`). |\r","| `requestOptions` | `object` | Extra `fetch` options; `requestOptions.headers` are merged in. |\r"];
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
            const code = await slice.build('CodeVisualizer', {
               value: "const api = await slice.build('FetchManager', {\r\n  sliceId: 'FetchManager',\r\n  baseUrl: 'https://jsonplaceholder.typicode.com'\r\n});\r\n\r\nconst post = await api.request('GET', null, '/posts/1');\r\n// -> { id: 1, title: '...', body: '...' }\r",
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
               value: "const api = await slice.build('FetchManager', { sliceId: 'FetchManager' });\r\n\r\napi.setDefaultHeaders({ Authorization: `Bearer ${token}` });\r\n\r\nawait api.request(\r\n  'POST',\r\n  { title: 'Hello', body: 'World' },\r\n  'https://jsonplaceholder.typicode.com/posts',\r\n  (data, res) => console.log('Created', res.status),\r\n  (data, res) => console.warn('Failed', res.status),\r\n  true // retry once on error\r\n);\r",
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

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
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
