export default class TableDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Table with data","expected":"renders table with headers and three rows","kind":"script","content":"const table = await slice.build('Table', {\n  headers: ['Feature', 'Version', 'Release'],\n  rows: [\n    ['Card component', '1.0.0', '2026-01-15'],\n    ['Route sync', '1.0.1', '2026-02-01'],\n    ['Tabs component', '1.1.0', '2026-03-10']\n  ]\n});\n\nreturn table;"},{"label":"Table with HTML cells","expected":"renders cells containing styled content","kind":"script","content":"const table = await slice.build('Table', {\n  headers: ['Package', 'Status', 'Action'],\n  rows: [\n    ['slice.js', '<span style=\"color:#16a34a\">Published</span>', '<button>View</button>'],\n    ['slice-cli', '<span style=\"color:#2563eb\">Beta</span>', '<button>Install</button>']\n  ]\n});\n\nreturn table;"},{"label":"Empty table","expected":"renders empty table container","kind":"script","content":"const table = await slice.build('Table', {\n  headers: [],\n  rows: []\n});\n\nreturn table;"}];
  }

  async init() {
    this.markdownPath = "table.md";
    this.markdownContent = "---\ntitle: Table\nroute: /docs/data/table\nnavLabel: Table\nsection: Data\ngroup: Tables\norder: 10\ndescription: Table documentation with header and row rendering scenarios.\ncomponent: TableDocumentation\ngenerate: true\ntags: [table, data, display]\n---\n\n# Table\n\n## Overview\n`Table` renders a structured HTML table from `headers` and `rows` arrays. Responsive by default with label-based cell display on narrow viewports.\n\n## API and Behavior\n- `headers` (array of strings) defines the table header row.\n- `rows` (array of arrays) defines data rows. Each cell supports HTML content via `innerHTML`.\n- Both props are reactive: changes trigger a full re-render.\n- Empty arrays render no table content.\n\n## Basic Usage\n```javascript title=\"Build table\"\nconst table = await slice.build('Table', {\n  headers: ['Name', 'Role', 'Status'],\n  rows: [\n    ['Alice', 'Engineer', 'Active'],\n    ['Bob', 'Designer', 'Inactive'],\n    ['Carol', 'Manager', 'Active']\n  ]\n});\n\nthis.appendChild(table);\n```\n\n## Prop Scenarios\n:::script label=\"Table with data\" expected=\"renders table with headers and three rows\"\nconst table = await slice.build('Table', {\n  headers: ['Feature', 'Version', 'Release'],\n  rows: [\n    ['Card component', '1.0.0', '2026-01-15'],\n    ['Route sync', '1.0.1', '2026-02-01'],\n    ['Tabs component', '1.1.0', '2026-03-10']\n  ]\n});\n\nreturn table;\n:::\n\n:::script label=\"Table with HTML cells\" expected=\"renders cells containing styled content\"\nconst table = await slice.build('Table', {\n  headers: ['Package', 'Status', 'Action'],\n  rows: [\n    ['slice.js', '<span style=\"color:#16a34a\">Published</span>', '<button>View</button>'],\n    ['slice-cli', '<span style=\"color:#2563eb\">Beta</span>', '<button>Install</button>']\n  ]\n});\n\nreturn table;\n:::\n\n:::script label=\"Empty table\" expected=\"renders empty table container\"\nconst table = await slice.build('Table', {\n  headers: [],\n  rows: []\n});\n\nreturn table;\n:::\n\n## Best Practices\n:::tip\nKeep row data uniform in length. Mismatched columns may produce uneven layout.\n:::\n\n## Pitfalls\n:::warning\nAvoid injecting unsanitized user content. Cells use `innerHTML`, which can introduce XSS if used with raw user input.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const table = await slice.build('Table', {\n  headers: ['Name', 'Role', 'Status'],\n  rows: [\n    ['Alice', 'Engineer', 'Active'],\n    ['Bob', 'Designer', 'Inactive'],\n    ['Carol', 'Manager', 'Active']\n  ]\n});\n\nthis.appendChild(table);",
               language: "javascript"
            });
            if ("Build table") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build table";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `headers` | `array` | `false` | `` | - |","| `rows` | `array` | `false` | `` | - |"];
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
    subtitle.textContent = 'Run each scenario to validate behavior and prevent regressions.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
      const card = document.createElement('article');
      card.classList.add('doc-script-card');

      const header = document.createElement('div');
      header.classList.add('doc-script-header');

      const heading = document.createElement('h3');
      heading.classList.add('doc-script-title');
      heading.textContent = scenario.label;
      header.appendChild(heading);

      card.appendChild(header);

      const preview = document.createElement('div');
      preview.classList.add('doc-script-preview');
      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        preview.innerHTML = '';
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed #f59e0b';
          fallback.style.borderRadius = '8px';
          fallback.style.background = '#fffbeb';
          fallback.style.color = '#92400e';
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
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            preview.appendChild(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                preview.appendChild(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });
      card.appendChild(preview);
      card.appendChild(code);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-tabledocumentation', TableDocumentation);
