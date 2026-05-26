export default class CheckboxDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"default unchecked","expected":"checkbox starts unchecked with right label","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\n  label: 'Receive newsletter'\n});\n\nreturn checkbox;"},{"label":"pre-checked agreement","expected":"checkbox renders checked when checked is true","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\n  label: 'I agree with privacy policy',\n  checked: true\n});\n\nreturn checkbox;"},{"label":"disabled checkbox","expected":"disabled state blocks interaction","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\n  label: 'Managed by policy',\n  checked: true,\n  disabled: true\n});\n\nreturn checkbox;"},{"label":"checkbox with external toggle","expected":"button can update checkbox checked prop","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\n  label: 'Enable reminders',\n  checked: false\n});\n\nconst toggle = await slice.build('Button', {\n  value: 'Toggle reminders',\n  onClickCallback: () => {\n    checkbox.checked = !checkbox.checked;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(checkbox);\nhost.appendChild(toggle);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "checkbox.md";
    this.markdownContent = "---\ntitle: Checkbox\nroute: /docs/input/checkbox\nnavLabel: Checkbox\nsection: Input Components\ngroup: Basic\norder: 13\ndescription: Checkbox component documentation with practical prop scenarios.\ncomponent: CheckboxDocumentation\ngenerate: true\ntags: [checkbox, input, forms]\n---\n\n# Checkbox\n\n## Overview\n`Checkbox` handles boolean selection with optional label, placement, and disabled state.\n\n## Core Behavior\n- `checked` controls current selection state.\n- `label` and `labelPlacement` define readable form semantics.\n- `disabled` prevents interaction while keeping current value visible.\n\n## Basic Usage\n```javascript title=\"Build checkbox\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'Accept terms',\n  checked: false\n});\n\nthis.appendChild(checkbox);\n```\n\n## Prop Scenarios\n:::script label=\"default unchecked\" expected=\"checkbox starts unchecked with right label\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'Receive newsletter'\n});\n\nreturn checkbox;\n:::\n\n:::script label=\"pre-checked agreement\" expected=\"checkbox renders checked when checked is true\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'I agree with privacy policy',\n  checked: true\n});\n\nreturn checkbox;\n:::\n\n:::script label=\"disabled checkbox\" expected=\"disabled state blocks interaction\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'Managed by policy',\n  checked: true,\n  disabled: true\n});\n\nreturn checkbox;\n:::\n\n:::script label=\"checkbox with external toggle\" expected=\"button can update checkbox checked prop\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'Enable reminders',\n  checked: false\n});\n\nconst toggle = await slice.build('Button', {\n  value: 'Toggle reminders',\n  onClickCallback: () => {\n    checkbox.checked = !checkbox.checked;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(checkbox);\nhost.appendChild(toggle);\nreturn host;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const checkbox = await slice.build('Checkbox', {\n  label: 'Accept terms',\n  checked: false\n});\n\nthis.appendChild(checkbox);",
               language: "javascript"
            });
            if ("Build checkbox") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build checkbox";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `checked` | `boolean` | `false` | `false` | - |","| `customColor` | `string` | `false` | `null` | - |","| `disabled` | `boolean` | `false` | `false` | - |","| `label` | `string` | `false` | `null` | - |","| `labelPlacement` | `string` | `false` | `right` | - |"];
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

customElements.define('slice-checkboxdocumentation', CheckboxDocumentation);
