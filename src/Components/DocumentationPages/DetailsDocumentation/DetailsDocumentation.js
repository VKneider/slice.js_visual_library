export default class DetailsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"faq item","expected":"details renders title and expandable answer","kind":"script","content":"const details = await slice.build('Details', {\n  title: 'Can I use this in production?',\n  text: 'Yes, this component is intended for production usage.'\n});\n\nreturn details;"},{"label":"details with custom node","expected":"addDetail appends custom structured content","kind":"script","content":"const details = await slice.build('Details', {\n  title: 'Release checklist',\n  text: 'Main steps before deployment.'\n});\n\nconst list = document.createElement('ul');\n['Run tests', 'Generate docs', 'Verify routes'].forEach((item) => {\n  const li = document.createElement('li');\n  li.textContent = item;\n  list.appendChild(li);\n});\n\ndetails.addDetail(list);\nreturn details;"},{"label":"multiple details blocks","expected":"independent disclosure blocks can coexist","kind":"script","content":"const host = document.createElement('div');\n\nconst billing = await slice.build('Details', {\n  title: 'Billing policy',\n  text: 'Invoices are generated monthly.'\n});\n\nconst support = await slice.build('Details', {\n  title: 'Support policy',\n  text: 'Support available Monday to Friday.'\n});\n\nhost.appendChild(billing);\nhost.appendChild(support);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "details.md";
    this.markdownContent = "---\ntitle: Details\nroute: /docs/layout/details\nnavLabel: Details\nsection: Layout\ngroup: Containers\norder: 21\ndescription: Details component documentation with collapsible content scenarios.\ncomponent: DetailsDocumentation\ngenerate: true\ntags: [details, disclosure, layout]\n---\n\n# Details\n\n## Overview\n`Details` renders expandable sections for progressive disclosure of content.\n\n## Core Behavior\n- `title` defines the summary header.\n- `text` provides the default expanded description body.\n- `addDetail(node)` appends richer custom content into the expanded area.\n\n## Basic Usage\n```javascript title=\"Build details\"\nconst details = await slice.build('Details', {\n  title: 'What is included?',\n  text: 'Source code, tests, and docs.'\n});\n\nthis.appendChild(details);\n```\n\n## Prop Scenarios\n:::script label=\"faq item\" expected=\"details renders title and expandable answer\"\nconst details = await slice.build('Details', {\n  title: 'Can I use this in production?',\n  text: 'Yes, this component is intended for production usage.'\n});\n\nreturn details;\n:::\n\n:::script label=\"details with custom node\" expected=\"addDetail appends custom structured content\"\nconst details = await slice.build('Details', {\n  title: 'Release checklist',\n  text: 'Main steps before deployment.'\n});\n\nconst list = document.createElement('ul');\n['Run tests', 'Generate docs', 'Verify routes'].forEach((item) => {\n  const li = document.createElement('li');\n  li.textContent = item;\n  list.appendChild(li);\n});\n\ndetails.addDetail(list);\nreturn details;\n:::\n\n:::script label=\"multiple details blocks\" expected=\"independent disclosure blocks can coexist\"\nconst host = document.createElement('div');\n\nconst billing = await slice.build('Details', {\n  title: 'Billing policy',\n  text: 'Invoices are generated monthly.'\n});\n\nconst support = await slice.build('Details', {\n  title: 'Support policy',\n  text: 'Support available Monday to Friday.'\n});\n\nhost.appendChild(billing);\nhost.appendChild(support);\nreturn host;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const details = await slice.build('Details', {\n  title: 'What is included?',\n  text: 'Source code, tests, and docs.'\n});\n\nthis.appendChild(details);",
               language: "javascript"
            });
            if ("Build details") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build details";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `text` | `string` | `false` | `` | - |","| `title` | `string` | `false` | `` | - |"];
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

customElements.define('slice-detailsdocumentation', DetailsDocumentation);
