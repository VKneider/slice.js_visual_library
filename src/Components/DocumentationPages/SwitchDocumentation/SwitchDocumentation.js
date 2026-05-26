export default class SwitchDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"settings switch","expected":"switch renders with label and initial checked state","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Dark mode',\n  checked: true\n});\n\nreturn sw;"},{"label":"switch with callback","expected":"toggle callback executes on interaction","kind":"script","content":"const status = document.createElement('p');\nstatus.textContent = 'State: off';\n\nconst sw = await slice.build('Switch', {\n  label: 'Auto-save',\n  checked: false,\n  toggle: () => {\n    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(sw);\nhost.appendChild(status);\nreturn host;"},{"label":"disabled switch","expected":"disabled switch keeps value but blocks changes","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Controlled by admin',\n  checked: true,\n  disabled: true\n});\n\nreturn sw;"},{"label":"switch with custom color","expected":"customColor updates active visual accent","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Deploy protection',\n  checked: true,\n  customColor: '#16a34a'\n});\n\nreturn sw;"}];
  }

  async init() {
    this.markdownPath = "switch.md";
    this.markdownContent = "---\ntitle: Switch\nroute: /docs/input/switch\nnavLabel: Switch\nsection: Input Components\ngroup: Basic\norder: 14\ndescription: Switch component documentation with practical interaction scenarios.\ncomponent: SwitchDocumentation\ngenerate: true\ntags: [switch, input, toggle]\n---\n\n# Switch\n\n## Overview\n`Switch` provides an on/off control for feature flags and settings toggles.\n\n## Core Behavior\n- `checked` controls active state.\n- `label` and `labelPlacement` improve context readability.\n- `toggle` callback can run side-effects when users interact.\n\n## Basic Usage\n```javascript title=\"Build switch\"\nconst notifications = await slice.build('Switch', {\n  label: 'Notifications',\n  checked: true\n});\n\nthis.appendChild(notifications);\n```\n\n## Prop Scenarios\n:::script label=\"settings switch\" expected=\"switch renders with label and initial checked state\"\nconst sw = await slice.build('Switch', {\n  label: 'Dark mode',\n  checked: true\n});\n\nreturn sw;\n:::\n\n:::script label=\"switch with callback\" expected=\"toggle callback executes on interaction\"\nconst status = document.createElement('p');\nstatus.textContent = 'State: off';\n\nconst sw = await slice.build('Switch', {\n  label: 'Auto-save',\n  checked: false,\n  toggle: () => {\n    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(sw);\nhost.appendChild(status);\nreturn host;\n:::\n\n:::script label=\"disabled switch\" expected=\"disabled switch keeps value but blocks changes\"\nconst sw = await slice.build('Switch', {\n  label: 'Controlled by admin',\n  checked: true,\n  disabled: true\n});\n\nreturn sw;\n:::\n\n:::script label=\"switch with custom color\" expected=\"customColor updates active visual accent\"\nconst sw = await slice.build('Switch', {\n  label: 'Deploy protection',\n  checked: true,\n  customColor: '#16a34a'\n});\n\nreturn sw;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const notifications = await slice.build('Switch', {\n  label: 'Notifications',\n  checked: true\n});\n\nthis.appendChild(notifications);",
               language: "javascript"
            });
            if ("Build switch") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build switch";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `checked` | `boolean` | `false` | `false` | - |","| `customColor` | `string` | `false` | `null` | - |","| `disabled` | `boolean` | `false` | `false` | - |","| `label` | `string` | `false` | `null` | - |","| `labelPlacement` | `string` | `false` | `right` | - |","| `toggle` | `function` | `false` | `null` | - |"];
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

customElements.define('slice-switchdocumentation', SwitchDocumentation);
