export default class LocalStorageManagerDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [];
  }

  async init() {
    this.markdownPath = "local-storage-manager.md";
    this.markdownContent = "---\r\ntitle: LocalStorageManager\r\nroute: /docs/services/local-storage-manager\r\nnavLabel: LocalStorageManager\r\nsection: Services\r\ngroup: Storage\r\norder: 10\r\ndescription: Service wrapper over window.localStorage with automatic JSON serialization.\r\ncomponent: LocalStorageManagerDocumentation\r\ngenerate: true\r\ntags: [service, storage, localstorage]\r\n---\r\n\r\n# LocalStorageManager\r\n\r\n## Overview\r\n`LocalStorageManager` is a **Service** component: a plain logic class (no DOM, no template)\r\nthat wraps `window.localStorage` and serializes values to/from JSON automatically. Every\r\nmethod is wrapped in a `try/catch` so a failure never throws — it returns `null` or `false`.\r\n\r\nBuild it like any service, with a `sliceId`:\r\n\r\n```javascript title=\"Build the service\"\r\nconst store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\r\n```\r\n\r\n## Methods\r\n\r\n| Method | Returns | Description |\r\n| --- | --- | --- |\r\n| `getItem(key)` | parsed value, or `null` | Reads a key and `JSON.parse`s it. Returns `null` if missing or on parse error. |\r\n| `setItem(key, value)` | `boolean` | `JSON.stringify`s `value` and stores it. Returns `false` if storage fails (e.g. quota). |\r\n| `removeItem(key)` | `boolean` | Removes a single key. |\r\n| `clear()` | `boolean` | Clears the entire `localStorage` for the origin. |\r\n\r\n## Usage\r\n\r\n```javascript title=\"Store and read structured data\"\r\nconst store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\r\n\r\nstore.setItem('user', { id: 7, name: 'Ada', roles: ['admin'] });\r\n\r\nconst user = store.getItem('user');\r\n// -> { id: 7, name: 'Ada', roles: ['admin'] }\r\n\r\nstore.removeItem('user');\r\n```\r\n\r\n```javascript title=\"Persist UI preferences\"\r\nconst store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\r\n\r\nconst theme = store.getItem('theme') || 'LIGHT';\r\nslice.setTheme(theme);\r\n\r\n// later, when the user toggles:\r\nstore.setItem('theme', 'DARK');\r\n```\r\n\r\n## Best Practices\r\n:::tip\r\nValues are JSON-serialized, so plain objects and arrays round-trip cleanly. Always provide a\r\nfallback when reading (`store.getItem('key') ?? defaultValue`) since `getItem` returns `null`\r\nfor both \"missing\" and \"unparseable\".\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nOnly JSON-serializable values survive the round-trip — `Date`, `Map`, `Set`, and functions do\r\nnot. `localStorage` is synchronous and origin-scoped; for larger or structured datasets prefer\r\n[`IndexedDbManager`](/docs/services/indexed-db-manager).\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\r",
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
            const lines = ["| Method | Returns | Description |\r","| --- | --- | --- |\r","| `getItem(key)` | parsed value, or `null` | Reads a key and `JSON.parse`s it. Returns `null` if missing or on parse error. |\r","| `setItem(key, value)` | `boolean` | `JSON.stringify`s `value` and stores it. Returns `false` if storage fails (e.g. quota). |\r","| `removeItem(key)` | `boolean` | Removes a single key. |\r","| `clear()` | `boolean` | Clears the entire `localStorage` for the origin. |\r"];
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
            const code = await slice.build('CodeVisualizer', {
               value: "const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\r\n\r\nstore.setItem('user', { id: 7, name: 'Ada', roles: ['admin'] });\r\n\r\nconst user = store.getItem('user');\r\n// -> { id: 7, name: 'Ada', roles: ['admin'] }\r\n\r\nstore.removeItem('user');\r",
               language: "javascript"
            });
            if ("Store and read structured data") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Store and read structured data";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\r\n\r\nconst theme = store.getItem('theme') || 'LIGHT';\r\nslice.setTheme(theme);\r\n\r\n// later, when the user toggles:\r\nstore.setItem('theme', 'DARK');\r",
               language: "javascript"
            });
            if ("Persist UI preferences") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Persist UI preferences";
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

customElements.define('slice-localstoragemanagerdocumentation', LocalStorageManagerDocumentation);
