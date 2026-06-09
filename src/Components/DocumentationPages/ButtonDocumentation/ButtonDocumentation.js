export default class ButtonDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Variants","expected":"filled, outlined, ghost and soft buttons","kind":"script","content":"const row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';\n\nfor (const variant of ['filled', 'outlined', 'ghost', 'soft']) {\n  const btn = await slice.build('Button', { value: variant, variant });\n  row.appendChild(btn);\n}\n\nreturn row;"},{"label":"Primary and secondary variants","expected":"renders two styled action buttons","kind":"script","content":"const primary = await slice.build('Button', { value: 'Primary Action' });\nconst secondary = await slice.build('Button', {\n  value: 'Secondary Action',\n  customColor: { background: '#5468ff', text: '#ffffff' }\n});\n\nconst row = document.createElement('div');\nrow.appendChild(primary);\nrow.appendChild(secondary);\nreturn row;"},{"label":"Button with callback state","expected":"click toggles button label","kind":"script","content":"const clickButton = await slice.build('Button', {\n  value: 'Click me',\n  onClick: () => {\n    clickButton.value = clickButton.value === 'Click me' ? 'Clicked' : 'Click me';\n  }\n});\n\nconst helper = document.createElement('p');\nhelper.textContent = 'Click the button to toggle its text.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(helper);\nwrapper.appendChild(clickButton);\nreturn wrapper;"},{"label":"Icon + custom color use case","expected":"renders call-to-action button with icon","kind":"script","content":"const cta = await slice.build('Button', {\n  value: 'Download package',\n  icon: { name: 'download', iconStyle: 'filled' },\n  customColor: { background: '#16a34a', text: '#ffffff' }\n});\n\nconst text = document.createElement('p');\ntext.textContent = 'Typical CTA usage with icon and branded color.';\n\nconst block = document.createElement('div');\nblock.appendChild(text);\nblock.appendChild(cta);\nreturn block;"},{"label":"Toolbar action group","expected":"renders a compact row of related actions","kind":"script","content":"const actions = [\n  { value: 'Edit', icon: { name: 'edit', iconStyle: 'filled' } },\n  { value: 'Share', icon: { name: 'share-nodes', iconStyle: 'filled' }, customColor: { background: '#2563eb', text: '#ffffff' } },\n  { value: 'Delete', icon: { name: 'trash-bin', iconStyle: 'filled' }, customColor: { background: '#dc2626', text: '#ffffff' } }\n];\n\nconst row = document.createElement('div');\n\nfor (const config of actions) {\n  const button = await slice.build('Button', config);\n  row.appendChild(button);\n}\n\nreturn row;"},{"label":"Button inside card footer","expected":"button used as secondary action in card","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Invoice #412',\n  text: 'Pending approval from accounting.',\n  variant: 'outlined'\n});\n\nconst approve = await slice.build('Button', {\n  value: 'Approve',\n  customColor: { background: '#15803d', text: '#ffffff' }\n});\n\nconst reject = await slice.build('Button', {\n  value: 'Reject',\n  customColor: { background: '#b91c1c', text: '#ffffff' }\n});\n\nconst footer = document.createElement('div');\nfooter.appendChild(approve);\nfooter.appendChild(reject);\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(footer);\nreturn host;"},{"label":"Icon-only utility row","expected":"small icon buttons for quick actions","kind":"script","content":"const iconConfigs = [\n  { name: 'search', iconStyle: 'filled', color: '#0f172a' },\n  { name: 'download', iconStyle: 'filled', color: '#0f172a' },\n  { name: 'copy', iconStyle: 'filled', color: '#0f172a' }\n];\n\nconst row = document.createElement('div');\n\nfor (const iconConfig of iconConfigs) {\n  const button = await slice.build('Button', {\n    value: '',\n    icon: iconConfig,\n    customColor: { background: '#e2e8f0', text: '#0f172a' }\n  });\n  row.appendChild(button);\n}\n\nreturn row;"},{"label":"async loading action","expected":"button reflects loading-like action flow","kind":"script","content":"const submit = await slice.build('Button', {\n  value: 'Submit',\n  onClick: async () => {\n    submit.value = 'Submitting...';\n    await new Promise((resolve) => setTimeout(resolve, 400));\n    submit.value = 'Submitted';\n  }\n});\n\nreturn submit;"}];
  }

  async init() {
    this.markdownPath = "button.md";
    this.markdownContent = "---\ntitle: Button\nroute: /docs/input/button\nnavLabel: Button\nsection: Input Components\ngroup: Basic\norder: 10\ndescription: Button documentation with executable prop scenarios.\ncomponent: ButtonDocumentation\ngenerate: true\ntags: [button, input]\n---\n\n# Button\n\n## Overview\nThe `Button` component renders an action trigger and supports text, callback, icon and custom colors.\n\n## Core Behavior\n- `Button` dispatches action intent through `onClick` while keeping visual state driven by props.\n- The look is set with `variant` (`filled` · `outlined` · `ghost` · `soft`), all derived from theme tokens; `customColor` overrides the colors when you need an exact value.\n- Use script scenarios below as the living behavior contract; static props are documented in the generated props section.\n\n## Live Preview\n:::component name=\"Button\"\n{\n  \"value\": \"Save changes\"\n}\n:::\n\n## Variants\nAll variants are built from the theme tokens, so they follow the active theme automatically.\n\n:::script label=\"Variants\" expected=\"filled, outlined, ghost and soft buttons\"\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';\n\nfor (const variant of ['filled', 'outlined', 'ghost', 'soft']) {\n  const btn = await slice.build('Button', { value: variant, variant });\n  row.appendChild(btn);\n}\n\nreturn row;\n:::\n\n## Prop Scenarios\n:::script label=\"Primary and secondary variants\" expected=\"renders two styled action buttons\"\nconst primary = await slice.build('Button', { value: 'Primary Action' });\nconst secondary = await slice.build('Button', {\n  value: 'Secondary Action',\n  customColor: { background: '#5468ff', text: '#ffffff' }\n});\n\nconst row = document.createElement('div');\nrow.appendChild(primary);\nrow.appendChild(secondary);\nreturn row;\n:::\n\n:::script label=\"Button with callback state\" expected=\"click toggles button label\"\nconst clickButton = await slice.build('Button', {\n  value: 'Click me',\n  onClick: () => {\n    clickButton.value = clickButton.value === 'Click me' ? 'Clicked' : 'Click me';\n  }\n});\n\nconst helper = document.createElement('p');\nhelper.textContent = 'Click the button to toggle its text.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(helper);\nwrapper.appendChild(clickButton);\nreturn wrapper;\n:::\n\n:::script label=\"Icon + custom color use case\" expected=\"renders call-to-action button with icon\"\nconst cta = await slice.build('Button', {\n  value: 'Download package',\n  icon: { name: 'download', iconStyle: 'filled' },\n  customColor: { background: '#16a34a', text: '#ffffff' }\n});\n\nconst text = document.createElement('p');\ntext.textContent = 'Typical CTA usage with icon and branded color.';\n\nconst block = document.createElement('div');\nblock.appendChild(text);\nblock.appendChild(cta);\nreturn block;\n:::\n\n:::script label=\"Toolbar action group\" expected=\"renders a compact row of related actions\"\nconst actions = [\n  { value: 'Edit', icon: { name: 'edit', iconStyle: 'filled' } },\n  { value: 'Share', icon: { name: 'share-nodes', iconStyle: 'filled' }, customColor: { background: '#2563eb', text: '#ffffff' } },\n  { value: 'Delete', icon: { name: 'trash-bin', iconStyle: 'filled' }, customColor: { background: '#dc2626', text: '#ffffff' } }\n];\n\nconst row = document.createElement('div');\n\nfor (const config of actions) {\n  const button = await slice.build('Button', config);\n  row.appendChild(button);\n}\n\nreturn row;\n:::\n\n:::script label=\"Button inside card footer\" expected=\"button used as secondary action in card\"\nconst card = await slice.build('Card', {\n  title: 'Invoice #412',\n  text: 'Pending approval from accounting.',\n  variant: 'outlined'\n});\n\nconst approve = await slice.build('Button', {\n  value: 'Approve',\n  customColor: { background: '#15803d', text: '#ffffff' }\n});\n\nconst reject = await slice.build('Button', {\n  value: 'Reject',\n  customColor: { background: '#b91c1c', text: '#ffffff' }\n});\n\nconst footer = document.createElement('div');\nfooter.appendChild(approve);\nfooter.appendChild(reject);\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(footer);\nreturn host;\n:::\n\n:::script label=\"Icon-only utility row\" expected=\"small icon buttons for quick actions\"\nconst iconConfigs = [\n  { name: 'search', iconStyle: 'filled', color: '#0f172a' },\n  { name: 'download', iconStyle: 'filled', color: '#0f172a' },\n  { name: 'copy', iconStyle: 'filled', color: '#0f172a' }\n];\n\nconst row = document.createElement('div');\n\nfor (const iconConfig of iconConfigs) {\n  const button = await slice.build('Button', {\n    value: '',\n    icon: iconConfig,\n    customColor: { background: '#e2e8f0', text: '#0f172a' }\n  });\n  row.appendChild(button);\n}\n\nreturn row;\n:::\n\n:::script label=\"async loading action\" expected=\"button reflects loading-like action flow\"\nconst submit = await slice.build('Button', {\n  value: 'Submit',\n  onClick: async () => {\n    submit.value = 'Submitting...';\n    await new Promise((resolve) => setTimeout(resolve, 400));\n    submit.value = 'Submitted';\n  }\n});\n\nreturn submit;\n:::\n\n## Best Practices\n:::tip\nPrefer explicit `onClickCallback` instead of manually attaching listeners outside the component.\n:::\n\n## Pitfalls\n:::warning\nDo not pass non-object values into `customColor` or `icon`. Static props validation reports type warnings.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"value\": \"Save changes\"\n}") {
               try {
                  props = JSON.parse("{\n  \"value\": \"Save changes\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Button', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"Button\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[\"filled\",\"outlined\",\"ghost\",\"soft\"]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"Button\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[\"filled\",\"outlined\",\"ghost\",\"soft\"]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-buttondocumentation', ButtonDocumentation);
