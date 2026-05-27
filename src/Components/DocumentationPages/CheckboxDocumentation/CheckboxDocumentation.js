export default class CheckboxDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"default unchecked","expected":"checkbox starts unchecked with right label","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\n  label: 'Receive newsletter'\n});\n\nreturn checkbox;"},{"label":"pre-checked agreement","expected":"checkbox renders checked when checked is true","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\n  label: 'I agree with privacy policy',\n  checked: true\n});\n\nreturn checkbox;"},{"label":"disabled checkbox","expected":"disabled state blocks interaction","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\n  label: 'Managed by policy',\n  checked: true,\n  disabled: true\n});\n\nreturn checkbox;"},{"label":"checkbox with external toggle","expected":"button can update checkbox checked prop","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\n  label: 'Enable reminders',\n  checked: false\n});\n\nconst toggle = await slice.build('Button', {\n  value: 'Toggle reminders',\n  onClickCallback: () => {\n    checkbox.checked = !checkbox.checked;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(checkbox);\nhost.appendChild(toggle);\nreturn host;"},{"label":"labelPlacement variations","expected":"left/right/top/bottom placements render correctly","kind":"script","content":"const placements = ['left', 'right', 'top', 'bottom'];\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\nhost.style.gap = '8px';\n\nfor (const placement of placements) {\n  const item = await slice.build('Checkbox', {\n    label: `Placement ${placement}`,\n    checked: placement === 'left' || placement === 'top',\n    labelPlacement: placement\n  });\n  host.appendChild(item);\n}\n\nreturn host;"},{"label":"checked state variations","expected":"shows both checked=true and checked=false states","kind":"script","content":"const host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.gap = '10px';\n\nconst checkedOn = await slice.build('Checkbox', {\n  label: 'Checked true',\n  checked: true\n});\n\nconst checkedOff = await slice.build('Checkbox', {\n  label: 'Checked false',\n  checked: false\n});\n\nhost.appendChild(checkedOn);\nhost.appendChild(checkedOff);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "checkbox.md";
    this.markdownContent = "---\ntitle: Checkbox\nroute: /docs/input/checkbox\nnavLabel: Checkbox\nsection: Input Components\ngroup: Basic\norder: 13\ndescription: Checkbox component documentation with practical prop scenarios.\ncomponent: CheckboxDocumentation\ngenerate: true\ntags: [checkbox, input, forms]\n---\n\n# Checkbox\n\n## Overview\n`Checkbox` handles boolean selection with optional label, placement, and disabled state.\n\n## Core Behavior\n- `checked` controls current selection state.\n- `label` and `labelPlacement` define readable form semantics.\n- `disabled` prevents interaction while keeping current value visible.\n\n## Basic Usage\n```javascript title=\"Build checkbox\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'Accept terms',\n  checked: false\n});\n\nthis.appendChild(checkbox);\n```\n\n## Prop Scenarios\n:::script label=\"default unchecked\" expected=\"checkbox starts unchecked with right label\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'Receive newsletter'\n});\n\nreturn checkbox;\n:::\n\n:::script label=\"pre-checked agreement\" expected=\"checkbox renders checked when checked is true\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'I agree with privacy policy',\n  checked: true\n});\n\nreturn checkbox;\n:::\n\n:::script label=\"disabled checkbox\" expected=\"disabled state blocks interaction\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'Managed by policy',\n  checked: true,\n  disabled: true\n});\n\nreturn checkbox;\n:::\n\n:::script label=\"checkbox with external toggle\" expected=\"button can update checkbox checked prop\"\nconst checkbox = await slice.build('Checkbox', {\n  label: 'Enable reminders',\n  checked: false\n});\n\nconst toggle = await slice.build('Button', {\n  value: 'Toggle reminders',\n  onClickCallback: () => {\n    checkbox.checked = !checkbox.checked;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(checkbox);\nhost.appendChild(toggle);\nreturn host;\n:::\n\n:::script label=\"labelPlacement variations\" expected=\"left/right/top/bottom placements render correctly\"\nconst placements = ['left', 'right', 'top', 'bottom'];\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\nhost.style.gap = '8px';\n\nfor (const placement of placements) {\n  const item = await slice.build('Checkbox', {\n    label: `Placement ${placement}`,\n    checked: placement === 'left' || placement === 'top',\n    labelPlacement: placement\n  });\n  host.appendChild(item);\n}\n\nreturn host;\n:::\n\n:::script label=\"checked state variations\" expected=\"shows both checked=true and checked=false states\"\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.gap = '10px';\n\nconst checkedOn = await slice.build('Checkbox', {\n  label: 'Checked true',\n  checked: true\n});\n\nconst checkedOff = await slice.build('Checkbox', {\n  label: 'Checked false',\n  checked: false\n});\n\nhost.appendChild(checkedOn);\nhost.appendChild(checkedOff);\nreturn host;\n:::\n";
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
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"checked\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"right\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"checked\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"right\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
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

customElements.define('slice-checkboxdocumentation', CheckboxDocumentation);
