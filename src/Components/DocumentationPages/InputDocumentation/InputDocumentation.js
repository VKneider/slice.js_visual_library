export default class InputDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Login form fields","expected":"email + password fields with proper input types","kind":"script","content":"const wrapper = document.createElement('div');\nwrapper.style.display = 'grid';\nwrapper.style.gap = '12px';\nwrapper.style.maxWidth = '420px';\n\nconst email = await slice.build('Input', {\n  placeholder: 'Email',\n  type: 'email',\n  required: true\n});\n\nconst password = await slice.build('Input', {\n  placeholder: 'Password',\n  type: 'password',\n  secret: true,\n  required: true\n});\n\nwrapper.appendChild(email);\nwrapper.appendChild(password);\nreturn wrapper;"},{"label":"Search + filter toolbar","expected":"search input paired with select control","kind":"script","content":"const row = document.createElement('div');\nrow.style.display = 'grid';\nrow.style.gridTemplateColumns = '2fr 1fr';\nrow.style.gap = '10px';\nrow.style.maxWidth = '560px';\n\nconst search = await slice.build('Input', {\n  placeholder: 'Search components',\n  type: 'text'\n});\n\nconst category = await slice.build('Select', {\n  label: 'Category',\n  visibleProp: 'label',\n  options: [\n    { label: 'All', value: 'all' },\n    { label: 'Input', value: 'input' },\n    { label: 'Layout', value: 'layout' }\n  ]\n});\n\nrow.appendChild(search);\nrow.appendChild(category);\nreturn row;"},{"label":"Validation ready email field","expected":"input with regex conditions and status button","kind":"script","content":"const wrapper = document.createElement('div');\nwrapper.style.display = 'grid';\nwrapper.style.gap = '8px';\nwrapper.style.maxWidth = '420px';\n\nconst email = await slice.build('Input', {\n  placeholder: 'Work email',\n  required: true,\n  conditions: {\n    regex: '^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$'\n  }\n});\n\nconst validate = await slice.build('Button', {\n  value: 'Validate',\n  onClickCallback: () => {\n    email.validateValue();\n  }\n});\n\nwrapper.appendChild(email);\nwrapper.appendChild(validate);\nreturn wrapper;"},{"label":"Disabled prefilled field","expected":"readonly-like field for immutable values","kind":"script","content":"const input = await slice.build('Input', {\n  placeholder: 'Workspace ID',\n  value: 'SLC-WS-0021',\n  disabled: true\n});\n\nreturn input;"}];
  }

  async init() {
    this.markdownPath = "input.md";
    this.markdownContent = "---\ntitle: Input\nroute: /docs/input/input\nnavLabel: Input\nsection: Input Components\ngroup: Basic\norder: 11\ndescription: Input component documentation with practical setup examples.\ncomponent: InputDocumentation\ngenerate: true\ntags: [input, forms]\n---\n\n# Input\n\n## Overview\n`Input` supports placeholder, value, type, required, disabled, secret and validation conditions.\n\n## Core Behavior\n- `Input` handles standard text entry, typed inputs, and optional required-state feedback.\n- Password flows can expose/hide value with `secret` while preserving form semantics.\n- Validation behavior is scenario-driven; use script blocks to verify condition checks in realistic forms.\n\n## Basic Usage\n```javascript title=\"Build input\"\nconst input = await slice.build('Input', {\n  placeholder: 'Email address',\n  type: 'email',\n  required: true\n});\n\nthis.appendChild(input);\n```\n\n## Practical Setups\n:::script label=\"Login form fields\" expected=\"email + password fields with proper input types\"\nconst wrapper = document.createElement('div');\nwrapper.style.display = 'grid';\nwrapper.style.gap = '12px';\nwrapper.style.maxWidth = '420px';\n\nconst email = await slice.build('Input', {\n  placeholder: 'Email',\n  type: 'email',\n  required: true\n});\n\nconst password = await slice.build('Input', {\n  placeholder: 'Password',\n  type: 'password',\n  secret: true,\n  required: true\n});\n\nwrapper.appendChild(email);\nwrapper.appendChild(password);\nreturn wrapper;\n:::\n\n:::script label=\"Search + filter toolbar\" expected=\"search input paired with select control\"\nconst row = document.createElement('div');\nrow.style.display = 'grid';\nrow.style.gridTemplateColumns = '2fr 1fr';\nrow.style.gap = '10px';\nrow.style.maxWidth = '560px';\n\nconst search = await slice.build('Input', {\n  placeholder: 'Search components',\n  type: 'text'\n});\n\nconst category = await slice.build('Select', {\n  label: 'Category',\n  visibleProp: 'label',\n  options: [\n    { label: 'All', value: 'all' },\n    { label: 'Input', value: 'input' },\n    { label: 'Layout', value: 'layout' }\n  ]\n});\n\nrow.appendChild(search);\nrow.appendChild(category);\nreturn row;\n:::\n\n:::script label=\"Validation ready email field\" expected=\"input with regex conditions and status button\"\nconst wrapper = document.createElement('div');\nwrapper.style.display = 'grid';\nwrapper.style.gap = '8px';\nwrapper.style.maxWidth = '420px';\n\nconst email = await slice.build('Input', {\n  placeholder: 'Work email',\n  required: true,\n  conditions: {\n    regex: '^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$'\n  }\n});\n\nconst validate = await slice.build('Button', {\n  value: 'Validate',\n  onClickCallback: () => {\n    email.validateValue();\n  }\n});\n\nwrapper.appendChild(email);\nwrapper.appendChild(validate);\nreturn wrapper;\n:::\n\n:::script label=\"Disabled prefilled field\" expected=\"readonly-like field for immutable values\"\nconst input = await slice.build('Input', {\n  placeholder: 'Workspace ID',\n  value: 'SLC-WS-0021',\n  disabled: true\n});\n\nreturn input;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const input = await slice.build('Input', {\n  placeholder: 'Email address',\n  type: 'email',\n  required: true\n});\n\nthis.appendChild(input);",
               language: "javascript"
            });
            if ("Build input") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build input";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `conditions` | `object` | `false` | `null` | - |","| `disabled` | `boolean` | `false` | `false` | - |","| `placeholder` | `string` | `false` | `` | - |","| `required` | `boolean` | `false` | `false` | - |","| `secret` | `boolean` | `false` | `false` | - |","| `type` | `string` | `false` | `text` | - |","| `value` | `string` | `false` | `` | - |"];
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

        const mount = (node) => {
          if (node instanceof Node) {
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, slice, document, mount);

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
      card.appendChild(code);
      card.appendChild(preview);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-inputdocumentation', InputDocumentation);
