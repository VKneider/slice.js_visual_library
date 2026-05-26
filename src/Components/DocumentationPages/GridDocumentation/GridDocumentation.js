export default class GridDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"two-column card grid","expected":"grid renders card items in two columns","kind":"script","content":"const cardA = await slice.build('Card', {\n  title: 'Alpha',\n  text: 'First card',\n  variant: 'outlined'\n});\n\nconst cardB = await slice.build('Card', {\n  title: 'Beta',\n  text: 'Second card',\n  variant: 'outlined'\n});\n\nconst grid = await slice.build('Grid', {\n  columns: 2,\n  rows: 1,\n  gap: '12px',\n  items: [cardA, cardB]\n});\n\nreturn grid;"},{"label":"custom column template","expected":"columnTemplate overrides fixed columns repeat","kind":"script","content":"const a = document.createElement('div');\na.textContent = 'Main panel';\n\nconst b = document.createElement('div');\nb.textContent = 'Sidebar';\n\nconst grid = await slice.build('Grid', {\n  columnTemplate: '2fr 1fr',\n  rows: 1,\n  items: [a, b]\n});\n\nreturn grid;"},{"label":"dynamic grid update","expected":"items can be replaced by assigning new items array","kind":"script","content":"const first = document.createElement('div');\nfirst.textContent = 'Item 1';\n\nconst second = document.createElement('div');\nsecond.textContent = 'Item 2';\n\nconst third = document.createElement('div');\nthird.textContent = 'Item 3';\n\nconst grid = await slice.build('Grid', {\n  columns: 2,\n  rows: 2,\n  items: [first, second]\n});\n\ngrid.items = [first, second, third];\nreturn grid;"}];
  }

  async init() {
    this.markdownPath = "grid.md";
    this.markdownContent = "---\ntitle: Grid\nroute: /docs/layout/grid\nnavLabel: Grid\nsection: Layout\ngroup: Containers\norder: 22\ndescription: Grid component documentation with layout composition scenarios.\ncomponent: GridDocumentation\ngenerate: true\ntags: [grid, layout]\n---\n\n# Grid\n\n## Overview\n`Grid` arranges content in structured rows and columns with configurable templates and spacing.\n\n## Core Behavior\n- `columns` and `rows` define the base matrix.\n- `gap` controls spacing between cells.\n- `items` appends DOM nodes as grid children.\n\n## Basic Usage\n```javascript title=\"Build grid\"\nconst one = document.createElement('div');\none.textContent = 'One';\n\nconst two = document.createElement('div');\ntwo.textContent = 'Two';\n\nconst grid = await slice.build('Grid', {\n  columns: 2,\n  rows: 1,\n  items: [one, two]\n});\n\nthis.appendChild(grid);\n```\n\n## Prop Scenarios\n:::script label=\"two-column card grid\" expected=\"grid renders card items in two columns\"\nconst cardA = await slice.build('Card', {\n  title: 'Alpha',\n  text: 'First card',\n  variant: 'outlined'\n});\n\nconst cardB = await slice.build('Card', {\n  title: 'Beta',\n  text: 'Second card',\n  variant: 'outlined'\n});\n\nconst grid = await slice.build('Grid', {\n  columns: 2,\n  rows: 1,\n  gap: '12px',\n  items: [cardA, cardB]\n});\n\nreturn grid;\n:::\n\n:::script label=\"custom column template\" expected=\"columnTemplate overrides fixed columns repeat\"\nconst a = document.createElement('div');\na.textContent = 'Main panel';\n\nconst b = document.createElement('div');\nb.textContent = 'Sidebar';\n\nconst grid = await slice.build('Grid', {\n  columnTemplate: '2fr 1fr',\n  rows: 1,\n  items: [a, b]\n});\n\nreturn grid;\n:::\n\n:::script label=\"dynamic grid update\" expected=\"items can be replaced by assigning new items array\"\nconst first = document.createElement('div');\nfirst.textContent = 'Item 1';\n\nconst second = document.createElement('div');\nsecond.textContent = 'Item 2';\n\nconst third = document.createElement('div');\nthird.textContent = 'Item 3';\n\nconst grid = await slice.build('Grid', {\n  columns: 2,\n  rows: 2,\n  items: [first, second]\n});\n\ngrid.items = [first, second, third];\nreturn grid;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const one = document.createElement('div');\none.textContent = 'One';\n\nconst two = document.createElement('div');\ntwo.textContent = 'Two';\n\nconst grid = await slice.build('Grid', {\n  columns: 2,\n  rows: 1,\n  items: [one, two]\n});\n\nthis.appendChild(grid);",
               language: "javascript"
            });
            if ("Build grid") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build grid";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `columns` | `number` | `false` | `1` | - |","| `columnTemplate` | `string` | `false` | `null` | - |","| `gap` | `string` | `false` | `10px` | - |","| `items` | `array` | `false` | `` | - |","| `rows` | `number` | `false` | `1` | - |","| `rowTemplate` | `string` | `false` | `null` | - |"];
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

customElements.define('slice-griddocumentation', GridDocumentation);
