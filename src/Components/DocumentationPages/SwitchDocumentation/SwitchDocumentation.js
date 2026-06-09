export default class SwitchDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"settings switch","expected":"switch renders with label and initial checked state","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Dark mode',\n  checked: true\n});\n\nreturn sw;"},{"label":"switch with callback","expected":"toggle callback executes on interaction","kind":"script","content":"const status = document.createElement('p');\nstatus.textContent = 'State: off';\n\nconst sw = await slice.build('Switch', {\n  label: 'Auto-save',\n  checked: false,\n  onChange: () => {\n    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(sw);\nhost.appendChild(status);\nreturn host;"},{"label":"disabled switch","expected":"disabled switch keeps value but blocks changes","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Controlled by admin',\n  checked: true,\n  disabled: true\n});\n\nreturn sw;"},{"label":"switch with custom color","expected":"customColor updates active visual accent","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Deploy protection',\n  checked: true,\n  customColor: '#16a34a'\n});\n\nreturn sw;"},{"label":"labelPlacement variations","expected":"left/right/top/bottom placements render correctly","kind":"script","content":"const placements = ['left', 'right', 'top', 'bottom'];\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\nhost.style.gap = '8px';\n\nfor (const placement of placements) {\n  const item = await slice.build('Switch', {\n    label: `Placement ${placement}`,\n    checked: placement === 'left' || placement === 'top',\n    labelPlacement: placement\n  });\n  host.appendChild(item);\n}\n\nreturn host;"},{"label":"checked state variations","expected":"shows both checked=true and checked=false states","kind":"script","content":"const host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.gap = '10px';\n\nconst onState = await slice.build('Switch', {\n  label: 'Checked true',\n  checked: true\n});\n\nconst offState = await slice.build('Switch', {\n  label: 'Checked false',\n  checked: false\n});\n\nhost.appendChild(onState);\nhost.appendChild(offState);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "switch.md";
    this.markdownContent = "---\ntitle: Switch\nroute: /docs/input/switch\nnavLabel: Switch\nsection: Input Components\ngroup: Basic\norder: 14\ndescription: Switch component documentation with practical interaction scenarios.\ncomponent: SwitchDocumentation\ngenerate: true\ntags: [switch, input, toggle]\n---\n\n# Switch\n\n## Overview\n`Switch` provides an on/off control for feature flags and settings toggles.\n\n## Core Behavior\n- `checked` controls active state.\n- `label` and `labelPlacement` improve context readability.\n- `toggle` callback can run side-effects when users interact.\n\n## Live Preview\n:::component name=\"Switch\"\n{\n  \"label\": \"Notifications\",\n  \"checked\": true\n}\n:::\n\n## Prop Scenarios\n:::script label=\"settings switch\" expected=\"switch renders with label and initial checked state\"\nconst sw = await slice.build('Switch', {\n  label: 'Dark mode',\n  checked: true\n});\n\nreturn sw;\n:::\n\n:::script label=\"switch with callback\" expected=\"toggle callback executes on interaction\"\nconst status = document.createElement('p');\nstatus.textContent = 'State: off';\n\nconst sw = await slice.build('Switch', {\n  label: 'Auto-save',\n  checked: false,\n  onChange: () => {\n    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(sw);\nhost.appendChild(status);\nreturn host;\n:::\n\n:::script label=\"disabled switch\" expected=\"disabled switch keeps value but blocks changes\"\nconst sw = await slice.build('Switch', {\n  label: 'Controlled by admin',\n  checked: true,\n  disabled: true\n});\n\nreturn sw;\n:::\n\n:::script label=\"switch with custom color\" expected=\"customColor updates active visual accent\"\nconst sw = await slice.build('Switch', {\n  label: 'Deploy protection',\n  checked: true,\n  customColor: '#16a34a'\n});\n\nreturn sw;\n:::\n\n:::script label=\"labelPlacement variations\" expected=\"left/right/top/bottom placements render correctly\"\nconst placements = ['left', 'right', 'top', 'bottom'];\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\nhost.style.gap = '8px';\n\nfor (const placement of placements) {\n  const item = await slice.build('Switch', {\n    label: `Placement ${placement}`,\n    checked: placement === 'left' || placement === 'top',\n    labelPlacement: placement\n  });\n  host.appendChild(item);\n}\n\nreturn host;\n:::\n\n:::script label=\"checked state variations\" expected=\"shows both checked=true and checked=false states\"\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.gap = '10px';\n\nconst onState = await slice.build('Switch', {\n  label: 'Checked true',\n  checked: true\n});\n\nconst offState = await slice.build('Switch', {\n  label: 'Checked false',\n  checked: false\n});\n\nhost.appendChild(onState);\nhost.appendChild(offState);\nreturn host;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Notifications\",\n  \"checked\": true\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Notifications\",\n  \"checked\": true\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Switch', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"checked\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"right\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"toggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"checked\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"right\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"toggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

      section.appendChild(demobox);
      demobox.appendCode(code);
      section.appendChild(errorMessage);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-switchdocumentation', SwitchDocumentation);
