export default class ButtonDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Primary and secondary variants","expected":"renders two styled action buttons","kind":"script","content":"const primary = await slice.build('Button', { value: 'Primary Action' });\nconst secondary = await slice.build('Button', {\n  value: 'Secondary Action',\n  customColor: { button: '#5468ff', label: '#ffffff' }\n});\n\nconst row = document.createElement('div');\nrow.appendChild(primary);\nrow.appendChild(secondary);\nreturn row;"},{"label":"Button with callback state","expected":"click toggles button label","kind":"script","content":"const clickButton = await slice.build('Button', {\n  value: 'Click me',\n  onClickCallback: () => {\n    clickButton.value = clickButton.value === 'Click me' ? 'Clicked' : 'Click me';\n  }\n});\n\nconst helper = document.createElement('p');\nhelper.textContent = 'Click the button to toggle its text.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(helper);\nwrapper.appendChild(clickButton);\nreturn wrapper;"},{"label":"Icon + custom color use case","expected":"renders call-to-action button with icon","kind":"script","content":"const cta = await slice.build('Button', {\n  value: 'Download package',\n  icon: { name: 'download', iconStyle: 'solid' },\n  customColor: { button: '#16a34a', label: '#ffffff' }\n});\n\nconst text = document.createElement('p');\ntext.textContent = 'Typical CTA usage with icon and branded color.';\n\nconst block = document.createElement('div');\nblock.appendChild(text);\nblock.appendChild(cta);\nreturn block;"},{"label":"Toolbar action group","expected":"renders a compact row of related actions","kind":"script","content":"const actions = [\n  { value: 'Edit' },\n  { value: 'Share', customColor: { button: '#2563eb', label: '#ffffff' } },\n  { value: 'Delete', customColor: { button: '#dc2626', label: '#ffffff' } }\n];\n\nconst row = document.createElement('div');\n\nfor (const config of actions) {\n  const button = await slice.build('Button', config);\n  row.appendChild(button);\n}\n\nreturn row;"},{"label":"Button inside card footer","expected":"button used as secondary action in card","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Invoice #412',\n  text: 'Pending approval from accounting.',\n  variant: 'outlined'\n});\n\nconst approve = await slice.build('Button', {\n  value: 'Approve',\n  customColor: { button: '#15803d', label: '#ffffff' }\n});\n\nconst reject = await slice.build('Button', {\n  value: 'Reject',\n  customColor: { button: '#b91c1c', label: '#ffffff' }\n});\n\nconst footer = document.createElement('div');\nfooter.appendChild(approve);\nfooter.appendChild(reject);\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(footer);\nreturn host;"},{"label":"Icon-only utility row","expected":"small icon buttons for quick actions","kind":"script","content":"const iconConfigs = [\n  { name: 'search', iconStyle: 'solid', color: '#0f172a' },\n  { name: 'download', iconStyle: 'solid', color: '#0f172a' },\n  { name: 'copy', iconStyle: 'solid', color: '#0f172a' }\n];\n\nconst row = document.createElement('div');\n\nfor (const iconConfig of iconConfigs) {\n  const button = await slice.build('Button', {\n    value: '',\n    icon: iconConfig,\n    customColor: { button: '#e2e8f0', label: '#0f172a' }\n  });\n  row.appendChild(button);\n}\n\nreturn row;"},{"label":"async loading action","expected":"button reflects loading-like action flow","kind":"script","content":"const submit = await slice.build('Button', {\n  value: 'Submit',\n  onClickCallback: async () => {\n    submit.value = 'Submitting...';\n    await new Promise((resolve) => setTimeout(resolve, 400));\n    submit.value = 'Submitted';\n  }\n});\n\nreturn submit;"}];
  }

  async init() {
    this.markdownPath = "button.md";
    this.markdownContent = "---\ntitle: Button\nroute: /docs/input/button\nnavLabel: Button\nsection: Input Components\ngroup: Basic\norder: 10\ndescription: Button documentation with executable prop scenarios.\ncomponent: ButtonDocumentation\ngenerate: true\ntags: [button, input]\n---\n\n# Button\n\n## Overview\nThe `Button` component renders an action trigger and supports text, callback, icon and custom colors.\n\n## Core Behavior\n- `Button` dispatches action intent through `onClickCallback` while keeping visual state driven by props.\n- Style variants are controlled with `customColor` and optional icon metadata for call-to-action and utility patterns.\n- Use script scenarios below as the living behavior contract; static props are documented in the generated props section.\n\n## Basic Usage\n```javascript title=\"Build button\"\nconst saveButton = await slice.build('Button', {\n  value: 'Save',\n  onClickCallback: () => console.log('Saved')\n});\n\nthis.appendChild(saveButton);\n```\n\n## Prop Scenarios\n:::script label=\"Primary and secondary variants\" expected=\"renders two styled action buttons\"\nconst primary = await slice.build('Button', { value: 'Primary Action' });\nconst secondary = await slice.build('Button', {\n  value: 'Secondary Action',\n  customColor: { button: '#5468ff', label: '#ffffff' }\n});\n\nconst row = document.createElement('div');\nrow.appendChild(primary);\nrow.appendChild(secondary);\nreturn row;\n:::\n\n:::script label=\"Button with callback state\" expected=\"click toggles button label\"\nconst clickButton = await slice.build('Button', {\n  value: 'Click me',\n  onClickCallback: () => {\n    clickButton.value = clickButton.value === 'Click me' ? 'Clicked' : 'Click me';\n  }\n});\n\nconst helper = document.createElement('p');\nhelper.textContent = 'Click the button to toggle its text.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(helper);\nwrapper.appendChild(clickButton);\nreturn wrapper;\n:::\n\n:::script label=\"Icon + custom color use case\" expected=\"renders call-to-action button with icon\"\nconst cta = await slice.build('Button', {\n  value: 'Download package',\n  icon: { name: 'download', iconStyle: 'solid' },\n  customColor: { button: '#16a34a', label: '#ffffff' }\n});\n\nconst text = document.createElement('p');\ntext.textContent = 'Typical CTA usage with icon and branded color.';\n\nconst block = document.createElement('div');\nblock.appendChild(text);\nblock.appendChild(cta);\nreturn block;\n:::\n\n:::script label=\"Toolbar action group\" expected=\"renders a compact row of related actions\"\nconst actions = [\n  { value: 'Edit' },\n  { value: 'Share', customColor: { button: '#2563eb', label: '#ffffff' } },\n  { value: 'Delete', customColor: { button: '#dc2626', label: '#ffffff' } }\n];\n\nconst row = document.createElement('div');\n\nfor (const config of actions) {\n  const button = await slice.build('Button', config);\n  row.appendChild(button);\n}\n\nreturn row;\n:::\n\n:::script label=\"Button inside card footer\" expected=\"button used as secondary action in card\"\nconst card = await slice.build('Card', {\n  title: 'Invoice #412',\n  text: 'Pending approval from accounting.',\n  variant: 'outlined'\n});\n\nconst approve = await slice.build('Button', {\n  value: 'Approve',\n  customColor: { button: '#15803d', label: '#ffffff' }\n});\n\nconst reject = await slice.build('Button', {\n  value: 'Reject',\n  customColor: { button: '#b91c1c', label: '#ffffff' }\n});\n\nconst footer = document.createElement('div');\nfooter.appendChild(approve);\nfooter.appendChild(reject);\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(footer);\nreturn host;\n:::\n\n:::script label=\"Icon-only utility row\" expected=\"small icon buttons for quick actions\"\nconst iconConfigs = [\n  { name: 'search', iconStyle: 'solid', color: '#0f172a' },\n  { name: 'download', iconStyle: 'solid', color: '#0f172a' },\n  { name: 'copy', iconStyle: 'solid', color: '#0f172a' }\n];\n\nconst row = document.createElement('div');\n\nfor (const iconConfig of iconConfigs) {\n  const button = await slice.build('Button', {\n    value: '',\n    icon: iconConfig,\n    customColor: { button: '#e2e8f0', label: '#0f172a' }\n  });\n  row.appendChild(button);\n}\n\nreturn row;\n:::\n\n:::script label=\"async loading action\" expected=\"button reflects loading-like action flow\"\nconst submit = await slice.build('Button', {\n  value: 'Submit',\n  onClickCallback: async () => {\n    submit.value = 'Submitting...';\n    await new Promise((resolve) => setTimeout(resolve, 400));\n    submit.value = 'Submitted';\n  }\n});\n\nreturn submit;\n:::\n\n## Best Practices\n:::tip\nPrefer explicit `onClickCallback` instead of manually attaching listeners outside the component.\n:::\n\n## Pitfalls\n:::warning\nDo not pass non-object values into `customColor` or `icon`. Static props validation reports type warnings.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const saveButton = await slice.build('Button', {\n  value: 'Save',\n  onClickCallback: () => console.log('Saved')\n});\n\nthis.appendChild(saveButton);",
               language: "javascript"
            });
            if ("Build button") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build button";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `customColor` | `object` | `false` | `null` | - |","| `icon` | `object` | `false` | `null` | - |","| `onClickCallback` | `function` | `false` | `null` | - |","| `value` | `string` | `false` | `Button` | - |"];
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

customElements.define('slice-buttondocumentation', ButtonDocumentation);
