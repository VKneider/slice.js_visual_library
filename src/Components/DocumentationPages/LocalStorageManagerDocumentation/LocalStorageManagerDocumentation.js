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
    this.markdownContent = "---\ntitle: LocalStorageManager\nroute: /docs/services/local-storage-manager\nnavLabel: LocalStorageManager\nsection: Services\ngroup: Storage\norder: 10\ndescription: Service wrapper over window.localStorage with automatic JSON serialization.\ncomponent: LocalStorageManagerDocumentation\ngenerate: true\ntags: [service, storage, localstorage]\n---\n\n# LocalStorageManager\n\n## Overview\n`LocalStorageManager` is a **Service** component: a plain logic class (no DOM, no template)\nthat wraps `window.localStorage` and serializes values to/from JSON automatically. Every\nmethod is wrapped in a `try/catch` so a failure never throws — it returns `null` or `false`.\n\nBuild it like any service, with a `sliceId`:\n\n```javascript title=\"Build the service\"\nconst store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\n```\n\n## Methods\n\n| Method | Returns | Description |\n| --- | --- | --- |\n| `getItem(key)` | parsed value, or `null` | Reads a key and `JSON.parse`s it. Returns `null` if missing or on parse error. |\n| `setItem(key, value)` | `boolean` | `JSON.stringify`s `value` and stores it. Returns `false` if storage fails (e.g. quota). |\n| `removeItem(key)` | `boolean` | Removes a single key. |\n| `clear()` | `boolean` | Clears the entire `localStorage` for the origin. |\n\n## Usage\n\n```javascript title=\"Store and read structured data\"\nconst store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\n\nstore.setItem('user', { id: 7, name: 'Ada', roles: ['admin'] });\n\nconst user = store.getItem('user');\n// -> { id: 7, name: 'Ada', roles: ['admin'] }\n\nstore.removeItem('user');\n```\n\n```javascript title=\"Persist UI preferences\"\nconst store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\n\nconst theme = store.getItem('theme') || 'LIGHT';\nslice.setTheme(theme);\n\n// later, when the user toggles:\nstore.setItem('theme', 'DARK');\n```\n\n## Best Practices\n:::tip\nValues are JSON-serialized, so plain objects and arrays round-trip cleanly. Always provide a\nfallback when reading (`store.getItem('key') ?? defaultValue`) since `getItem` returns `null`\nfor both \"missing\" and \"unparseable\".\n:::\n\n## Pitfalls\n:::warning\nOnly JSON-serializable values survive the round-trip — `Date`, `Map`, `Set`, and functions do\nnot. `localStorage` is synchronous and origin-scoped; for larger or structured datasets prefer\n[`IndexedDbManager`](/docs/services/indexed-db-manager).\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });",
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
            const lines = ["| Method | Returns | Description |","| --- | --- | --- |","| `getItem(key)` | parsed value, or `null` | Reads a key and `JSON.parse`s it. Returns `null` if missing or on parse error. |","| `setItem(key, value)` | `boolean` | `JSON.stringify`s `value` and stores it. Returns `false` if storage fails (e.g. quota). |","| `removeItem(key)` | `boolean` | Removes a single key. |","| `clear()` | `boolean` | Clears the entire `localStorage` for the origin. |"];
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
               value: "const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\n\nstore.setItem('user', { id: 7, name: 'Ada', roles: ['admin'] });\n\nconst user = store.getItem('user');\n// -> { id: 7, name: 'Ada', roles: ['admin'] }\n\nstore.removeItem('user');",
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
               value: "const store = await slice.build('LocalStorageManager', { sliceId: 'LocalStorageManager' });\n\nconst theme = store.getItem('theme') || 'LIGHT';\nslice.setTheme(theme);\n\n// later, when the user toggles:\nstore.setItem('theme', 'DARK');",
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

customElements.define('slice-localstoragemanagerdocumentation', LocalStorageManagerDocumentation);
