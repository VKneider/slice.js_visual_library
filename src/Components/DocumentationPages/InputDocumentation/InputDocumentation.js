export default class InputDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Login form fields","expected":"email + password fields with proper input types","kind":"script","content":"const wrapper = document.createElement('div');\n\nconst email = await slice.build('Input', {\n  placeholder: 'Email',\n  type: 'email',\n  required: true\n});\n\nconst password = await slice.build('Input', {\n  placeholder: 'Password',\n  type: 'password',\n  secret: true,\n  required: true\n});\n\nwrapper.appendChild(email);\nwrapper.appendChild(password);\nreturn wrapper;"},{"label":"Search + filter toolbar","expected":"search input paired with select control","kind":"script","content":"const row = document.createElement('div');\n\nconst search = await slice.build('Input', {\n  placeholder: 'Search components',\n  type: 'text'\n});\n\nconst category = await slice.build('Select', {\n  label: 'Category',\n  visibleProp: 'label',\n  options: [\n    { label: 'All', value: 'all' },\n    { label: 'Input', value: 'input' },\n    { label: 'Layout', value: 'layout' }\n  ]\n});\n\nrow.appendChild(search);\nrow.appendChild(category);\nreturn row;"},{"label":"Validation ready email field","expected":"input with regex conditions and status button","kind":"script","content":"const wrapper = document.createElement('div');\n\nconst email = await slice.build('Input', {\n  placeholder: 'Work email',\n  required: true,\n  conditions: {\n    regex: '^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$'\n  }\n});\n\nconst validate = await slice.build('Button', {\n  value: 'Validate',\n  onClick: () => {\n    email.validateValue();\n  }\n});\n\nwrapper.appendChild(email);\nwrapper.appendChild(validate);\nreturn wrapper;"},{"label":"Disabled prefilled field","expected":"readonly-like field for immutable values","kind":"script","content":"const input = await slice.build('Input', {\n  placeholder: 'Workspace ID',\n  value: 'SLC-WS-0021',\n  disabled: true\n});\n\nreturn input;"},{"label":"API key input with reveal","expected":"secret field can be toggled in secure workflows","kind":"script","content":"const apiKey = await slice.build('Input', {\n  placeholder: 'API Key',\n  type: 'password',\n  secret: true,\n  required: true\n});\n\nreturn apiKey;"},{"label":"Quick create form row","expected":"two inputs and action button compose a compact form","kind":"script","content":"const host = document.createElement('div');\n\nconst name = await slice.build('Input', {\n  placeholder: 'Project name',\n  type: 'text',\n  required: true\n});\n\nconst slug = await slice.build('Input', {\n  placeholder: 'project-slug',\n  type: 'text'\n});\n\nconst create = await slice.build('Button', {\n  value: 'Create'\n});\n\nhost.appendChild(name);\nhost.appendChild(slug);\nhost.appendChild(create);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "input.md";
    this.markdownContent = "---\ntitle: Input\nroute: /docs/input/input\nnavLabel: Input\nsection: Input Components\ngroup: Basic\norder: 11\ndescription: Input component documentation with practical setup examples.\ncomponent: InputDocumentation\ngenerate: true\ntags: [input, forms]\n---\n\n# Input\n\n## Overview\n`Input` supports placeholder, value, type, required, disabled, secret and validation conditions.\n\n## Core Behavior\n- `Input` handles standard text entry, typed inputs, and optional required-state feedback.\n- Password flows can expose/hide value with `secret` while preserving form semantics.\n- Validation behavior is scenario-driven; use script blocks to verify condition checks in realistic forms.\n\n## Live Preview\n:::component name=\"Input\"\n{\n  \"placeholder\": \"Email address\",\n  \"type\": \"email\"\n}\n:::\n\n## Practical Setups\n:::script label=\"Login form fields\" expected=\"email + password fields with proper input types\"\nconst wrapper = document.createElement('div');\n\nconst email = await slice.build('Input', {\n  placeholder: 'Email',\n  type: 'email',\n  required: true\n});\n\nconst password = await slice.build('Input', {\n  placeholder: 'Password',\n  type: 'password',\n  secret: true,\n  required: true\n});\n\nwrapper.appendChild(email);\nwrapper.appendChild(password);\nreturn wrapper;\n:::\n\n:::script label=\"Search + filter toolbar\" expected=\"search input paired with select control\"\nconst row = document.createElement('div');\n\nconst search = await slice.build('Input', {\n  placeholder: 'Search components',\n  type: 'text'\n});\n\nconst category = await slice.build('Select', {\n  label: 'Category',\n  visibleProp: 'label',\n  options: [\n    { label: 'All', value: 'all' },\n    { label: 'Input', value: 'input' },\n    { label: 'Layout', value: 'layout' }\n  ]\n});\n\nrow.appendChild(search);\nrow.appendChild(category);\nreturn row;\n:::\n\n:::script label=\"Validation ready email field\" expected=\"input with regex conditions and status button\"\nconst wrapper = document.createElement('div');\n\nconst email = await slice.build('Input', {\n  placeholder: 'Work email',\n  required: true,\n  conditions: {\n    regex: '^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$'\n  }\n});\n\nconst validate = await slice.build('Button', {\n  value: 'Validate',\n  onClick: () => {\n    email.validateValue();\n  }\n});\n\nwrapper.appendChild(email);\nwrapper.appendChild(validate);\nreturn wrapper;\n:::\n\n:::script label=\"Disabled prefilled field\" expected=\"readonly-like field for immutable values\"\nconst input = await slice.build('Input', {\n  placeholder: 'Workspace ID',\n  value: 'SLC-WS-0021',\n  disabled: true\n});\n\nreturn input;\n:::\n\n:::script label=\"API key input with reveal\" expected=\"secret field can be toggled in secure workflows\"\nconst apiKey = await slice.build('Input', {\n  placeholder: 'API Key',\n  type: 'password',\n  secret: true,\n  required: true\n});\n\nreturn apiKey;\n:::\n\n:::script label=\"Quick create form row\" expected=\"two inputs and action button compose a compact form\"\nconst host = document.createElement('div');\n\nconst name = await slice.build('Input', {\n  placeholder: 'Project name',\n  type: 'text',\n  required: true\n});\n\nconst slug = await slice.build('Input', {\n  placeholder: 'project-slug',\n  type: 'text'\n});\n\nconst create = await slice.build('Button', {\n  value: 'Create'\n});\n\nhost.appendChild(name);\nhost.appendChild(slug);\nhost.appendChild(create);\nreturn host;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"placeholder\": \"Email address\",\n  \"type\": \"email\"\n}") {
               try {
                  props = JSON.parse("{\n  \"placeholder\": \"Email address\",\n  \"type\": \"email\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Input', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"type\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"secret\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"type\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"secret\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-inputdocumentation', InputDocumentation);
