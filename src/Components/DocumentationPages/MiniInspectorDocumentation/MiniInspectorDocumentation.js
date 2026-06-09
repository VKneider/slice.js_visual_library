export default class MiniInspectorDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"renders one control per editable prop","expected":"three rows for DemoButton (label, clicks, disabled)","kind":"script","content":"const target = await slice.build('DemoButton', { label: 'A' });\nconst inspector = await slice.build('MiniInspector', { target, title: 'DemoButton' });\n\nconst rows = inspector.querySelectorAll('.mini-inspector__row').length;\nif (rows !== 3) {\n  throw new Error('Expected 3 editable rows, got ' + rows);\n}\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '20px';\nhost.style.alignItems = 'flex-start';\nhost.appendChild(target);\nhost.appendChild(inspector);\nreturn host;"},{"label":"edits flow to the target through its setter","expected":"editing the label field updates the button text","kind":"script","content":"const target = await slice.build('DemoButton', { label: 'Before' });\nconst inspector = await slice.build('MiniInspector', { target });\n\n// The first text input is the string prop (label). Simulate a user edit.\nconst input = inspector.querySelector('input[type=\"text\"]');\ninput.value = 'After';\ninput.dispatchEvent(new Event('input'));\n\nconst shown = target.querySelector('.demo-button__label').textContent;\nif (shown !== 'After') {\n  throw new Error('Setter did not update the target. Got: ' + shown);\n}\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '20px';\nhost.appendChild(target);\nhost.appendChild(inspector);\nreturn host;"},{"label":"accepts a sliceId string as target","expected":"resolves the live component by sliceId","kind":"script","content":"const counter = await slice.build('DemoCounter', { sliceId: 'demo-counter-mi', label: 'Items' });\nconst inspector = await slice.build('MiniInspector', { target: 'demo-counter-mi', title: 'By sliceId' });\n\nconst rows = inspector.querySelectorAll('.mini-inspector__row').length;\nif (rows === 0) {\n  throw new Error('Inspector did not resolve the component from its sliceId');\n}\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '20px';\nhost.appendChild(counter);\nhost.appendChild(inspector);\nreturn host;"},{"label":"boolean prop toggling","expected":"DemoToggle inspected by MiniInspector","kind":"script","content":"const toggle = await slice.build('DemoToggle', { on: false, onText: 'Enabled', offText: 'Disabled' });\nconst inspector = await slice.build('MiniInspector', { target: toggle, title: 'DemoToggle' });\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '20px';\nhost.appendChild(toggle);\nhost.appendChild(inspector);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "mini-inspector.md";
    this.markdownContent = "---\ntitle: MiniInspector\nroute: /docs/utilities/mini-inspector\nnavLabel: MiniInspector\nsection: Utilities\ngroup: Developer\norder: 10\ndescription: MiniInspector documentation with executable live-editing scenarios.\ncomponent: MiniInspectorDocumentation\ngenerate: true\ntags: [inspector, devtools, props, setters]\n---\n\n# MiniInspector\n\n## Overview\n`MiniInspector` is a tiny, readable demonstration of how Slice's live state editing works. Point it\nat any component and it reads that component's `static props`, builds an editable control per prop,\nand on edit assigns `target[prop] = value` — which fires the target's setter and updates its UI\ninstantly. It's the same idea as the built-in DevTools inspector, in ~80 lines.\n\n## Core Behavior\n- Reads `target.constructor.props` and shows one control per editable prop (`string`, `number`, `boolean`).\n- Writes edits straight back through the target's setter (`target[prop] = value`); there is no extra binding layer.\n- `target` accepts a live component instance or a `sliceId` string.\n- It's a normal, theme-aware Visual component — it follows the active theme via CSS variables.\n\n## Prop Scenarios\n:::script label=\"renders one control per editable prop\" expected=\"three rows for DemoButton (label, clicks, disabled)\"\nconst target = await slice.build('DemoButton', { label: 'A' });\nconst inspector = await slice.build('MiniInspector', { target, title: 'DemoButton' });\n\nconst rows = inspector.querySelectorAll('.mini-inspector__row').length;\nif (rows !== 3) {\n  throw new Error('Expected 3 editable rows, got ' + rows);\n}\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '20px';\nhost.style.alignItems = 'flex-start';\nhost.appendChild(target);\nhost.appendChild(inspector);\nreturn host;\n:::\n\n:::script label=\"edits flow to the target through its setter\" expected=\"editing the label field updates the button text\"\nconst target = await slice.build('DemoButton', { label: 'Before' });\nconst inspector = await slice.build('MiniInspector', { target });\n\n// The first text input is the string prop (label). Simulate a user edit.\nconst input = inspector.querySelector('input[type=\"text\"]');\ninput.value = 'After';\ninput.dispatchEvent(new Event('input'));\n\nconst shown = target.querySelector('.demo-button__label').textContent;\nif (shown !== 'After') {\n  throw new Error('Setter did not update the target. Got: ' + shown);\n}\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '20px';\nhost.appendChild(target);\nhost.appendChild(inspector);\nreturn host;\n:::\n\n:::script label=\"accepts a sliceId string as target\" expected=\"resolves the live component by sliceId\"\nconst counter = await slice.build('DemoCounter', { sliceId: 'demo-counter-mi', label: 'Items' });\nconst inspector = await slice.build('MiniInspector', { target: 'demo-counter-mi', title: 'By sliceId' });\n\nconst rows = inspector.querySelectorAll('.mini-inspector__row').length;\nif (rows === 0) {\n  throw new Error('Inspector did not resolve the component from its sliceId');\n}\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '20px';\nhost.appendChild(counter);\nhost.appendChild(inspector);\nreturn host;\n:::\n\n:::script label=\"boolean prop toggling\" expected=\"DemoToggle inspected by MiniInspector\"\nconst toggle = await slice.build('DemoToggle', { on: false, onText: 'Enabled', offText: 'Disabled' });\nconst inspector = await slice.build('MiniInspector', { target: toggle, title: 'DemoToggle' });\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '20px';\nhost.appendChild(toggle);\nhost.appendChild(inspector);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nGive your component's props clear setters that do the DOM work — then the component is instantly\ninspectable, and editing a prop here behaves exactly like a prop change anywhere in your app.\n:::\n\n## Pitfalls\n:::warning\nThis demo only edits `string`, `number`, and `boolean` props. A prop only updates the UI if its\nsetter performs the DOM change — if editing does nothing, the bug is in the setter, not the inspector.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"target\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"Inspector\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"target\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"Inspector\",\"allowedValues\":[]}]}");
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

customElements.define('slice-miniinspectordocumentation', MiniInspectorDocumentation);
