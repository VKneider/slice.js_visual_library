export default class LayoutDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Swap views","expected":"renders layout and replaces initial view","kind":"script","content":"const layout = await slice.build('Layout', {});\n\nconst initial = document.createElement('p');\ninitial.textContent = 'First view';\nawait layout.showing(initial);\n\nconst replacement = document.createElement('p');\nreplacement.textContent = 'Replaced view';\nawait layout.showing(replacement);\n\nreturn layout;"},{"label":"Layout with card view","expected":"renders layout containing a card","kind":"script","content":"const layout = await slice.build('Layout', {});\n\nconst card = await slice.build('Card', {\n  title: 'Layout Demo',\n  text: 'This card is mounted inside a Layout container.',\n  variant: 'outlined'\n});\n\nawait layout.showing(card);\n\nreturn layout;"}];
  }

  async init() {
    this.markdownPath = "layout.md";
    this.markdownContent = "---\ntitle: Layout\nroute: /docs/layout/layout\nnavLabel: Layout\nsection: Layout\ngroup: Containers\norder: 10\ndescription: Layout container documentation with view swapping scenarios.\ncomponent: LayoutDocumentation\ngenerate: true\ntags: [layout, container]\n---\n\n# Layout\n\n## Overview\n`Layout` is a generic container that accepts a view node and swaps it on demand. It provides two methods: `onLayOut` for initial mounting and `showing` for replacing the current view.\n\n## API and Behavior\n- Accepts `layout` (initial node) and `view` (active view node) as props.\n- `showing(view)` replaces the current child with a new view node.\n- `onLayOut(view)` appends a view (used for initial layout setup).\n- Both props and methods accept any DOM node.\n\n## Basic Usage\n```javascript title=\"Build layout\"\nconst layout = await slice.build('Layout', {});\n\nconst view = document.createElement('div');\nview.textContent = 'Page content';\n\nawait layout.showing(view);\n\nthis.appendChild(layout);\n```\n\n## Prop Scenarios\n:::script label=\"Swap views\" expected=\"renders layout and replaces initial view\"\nconst layout = await slice.build('Layout', {});\n\nconst initial = document.createElement('p');\ninitial.textContent = 'First view';\nawait layout.showing(initial);\n\nconst replacement = document.createElement('p');\nreplacement.textContent = 'Replaced view';\nawait layout.showing(replacement);\n\nreturn layout;\n:::\n\n:::script label=\"Layout with card view\" expected=\"renders layout containing a card\"\nconst layout = await slice.build('Layout', {});\n\nconst card = await slice.build('Card', {\n  title: 'Layout Demo',\n  text: 'This card is mounted inside a Layout container.',\n  variant: 'outlined'\n});\n\nawait layout.showing(card);\n\nreturn layout;\n:::\n\n## Best Practices\n:::tip\nUse `Layout` as a viewport controller when you need to swap entire sections of a page without full navigation.\n:::\n\n## Pitfalls\n:::warning\n`showing` removes the previous child. Ensure stateful views persist their data externally if needed.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const layout = await slice.build('Layout', {});\n\nconst view = document.createElement('div');\nview.textContent = 'Page content';\n\nawait layout.showing(view);\n\nthis.appendChild(layout);",
               language: "javascript"
            });
            if ("Build layout") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build layout";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `layout` | `object` | `false` | `null` | - |","| `view` | `object` | `false` | `null` | - |"];
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

customElements.define('slice-layoutdocumentation', LayoutDocumentation);
