export default class IndexedDbManagerDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [];
  }

  async init() {
    this.markdownPath = "indexed-db-manager.md";
    this.markdownContent = "---\r\ntitle: IndexedDbManager\r\nroute: /docs/services/indexed-db-manager\r\nnavLabel: IndexedDbManager\r\nsection: Services\r\ngroup: Storage\r\norder: 20\r\ndescription: Async Service wrapper over IndexedDB for a single auto-keyed object store.\r\ncomponent: IndexedDbManagerDocumentation\r\ngenerate: true\r\ntags: [service, storage, indexeddb]\r\n---\r\n\r\n# IndexedDbManager\r\n\r\n## Overview\r\n`IndexedDbManager` is a **Service** component: a thin async wrapper over the browser's\r\nIndexedDB. Each instance manages **one object store** inside a database. The store is created\r\non demand with a `keyPath` of `'id'` and `autoIncrement: true`, so every item gets a numeric\r\n`id` automatically.\r\n\r\nBuild it with a `databaseName` and `storeName`:\r\n\r\n```javascript title=\"Build the service\"\r\nconst db = await slice.build('IndexedDbManager', {\r\n  sliceId: 'IndexedDbManager',\r\n  databaseName: 'app-db',\r\n  storeName: 'todos'\r\n});\r\n```\r\n\r\n## Methods\r\n\r\n| Method | Returns | Description |\r\n| --- | --- | --- |\r\n| `openDatabase()` | `Promise<IDBDatabase>` | Opens (and upgrades/creates the store if needed). Called automatically by the data methods. |\r\n| `closeDatabase()` | `void` | Closes the active connection. |\r\n| `addItem(item)` | `Promise<number>` | Adds an item; resolves with the generated `id`. |\r\n| `updateItem(item)` | `Promise<number>` | Upserts an item by its `id` (the `item` must include `id`). |\r\n| `getItem(id)` | `Promise<object \\| undefined>` | Reads one item by `id`. |\r\n| `deleteItem(id)` | `Promise<void>` | Removes one item by `id`. |\r\n| `getAllItems()` | `Promise<object[]>` | Returns every item in the store. |\r\n| `clearItems()` | `Promise<void>` | Empties the store. |\r\n\r\n## Usage\r\n\r\n```javascript title=\"CRUD round-trip\"\r\nconst db = await slice.build('IndexedDbManager', {\r\n  sliceId: 'IndexedDbManager',\r\n  databaseName: 'app-db',\r\n  storeName: 'todos'\r\n});\r\n\r\nconst id = await db.addItem({ text: 'Write docs', done: false });\r\n\r\nconst todo = await db.getItem(id);\r\nawait db.updateItem({ ...todo, done: true });\r\n\r\nconst all = await db.getAllItems();\r\n// -> [{ id, text: 'Write docs', done: true }]\r\n\r\nawait db.deleteItem(id);\r\n```\r\n\r\n```javascript title=\"Reset a store\"\r\nconst cache = await slice.build('IndexedDbManager', {\r\n  sliceId: 'IndexedDbManager',\r\n  databaseName: 'app-db',\r\n  storeName: 'http-cache'\r\n});\r\n\r\nawait cache.clearItems();\r\n```\r\n\r\n## Best Practices\r\n:::tip\r\nYou don't need to call `openDatabase()` yourself — every data method opens the database as\r\nneeded. Let `addItem` assign the `id`, and pass the full object (including `id`) to `updateItem`.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nAll data methods are asynchronous — always `await` them. `updateItem` and `deleteItem` require a\r\nvalid existing `id`. Each instance is bound to a single store; use separate instances (or\r\n`storeName`s) for different collections.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const db = await slice.build('IndexedDbManager', {\r\n  sliceId: 'IndexedDbManager',\r\n  databaseName: 'app-db',\r\n  storeName: 'todos'\r\n});\r",
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
            const lines = ["| Method | Returns | Description |\r","| --- | --- | --- |\r","| `openDatabase()` | `Promise<IDBDatabase>` | Opens (and upgrades/creates the store if needed). Called automatically by the data methods. |\r","| `closeDatabase()` | `void` | Closes the active connection. |\r","| `addItem(item)` | `Promise<number>` | Adds an item; resolves with the generated `id`. |\r","| `updateItem(item)` | `Promise<number>` | Upserts an item by its `id` (the `item` must include `id`). |\r","| `getItem(id)` | `Promise<object \\| undefined>` | Reads one item by `id`. |\r","| `deleteItem(id)` | `Promise<void>` | Removes one item by `id`. |\r","| `getAllItems()` | `Promise<object[]>` | Returns every item in the store. |\r","| `clearItems()` | `Promise<void>` | Empties the store. |\r"];
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
               value: "const db = await slice.build('IndexedDbManager', {\r\n  sliceId: 'IndexedDbManager',\r\n  databaseName: 'app-db',\r\n  storeName: 'todos'\r\n});\r\n\r\nconst id = await db.addItem({ text: 'Write docs', done: false });\r\n\r\nconst todo = await db.getItem(id);\r\nawait db.updateItem({ ...todo, done: true });\r\n\r\nconst all = await db.getAllItems();\r\n// -> [{ id, text: 'Write docs', done: true }]\r\n\r\nawait db.deleteItem(id);\r",
               language: "javascript"
            });
            if ("CRUD round-trip") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "CRUD round-trip";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const cache = await slice.build('IndexedDbManager', {\r\n  sliceId: 'IndexedDbManager',\r\n  databaseName: 'app-db',\r\n  storeName: 'http-cache'\r\n});\r\n\r\nawait cache.clearItems();\r",
               language: "javascript"
            });
            if ("Reset a store") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Reset a store";
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

customElements.define('slice-indexeddbmanagerdocumentation', IndexedDbManagerDocumentation);
