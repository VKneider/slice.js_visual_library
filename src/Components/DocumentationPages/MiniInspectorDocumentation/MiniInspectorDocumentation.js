export default class MiniInspectorDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"renders one control per editable prop","expected":"three rows for DemoButton (label, clicks, disabled)","kind":"script","content":"const target = await slice.build('DemoButton', { label: 'A' });\r\nconst inspector = await slice.build('MiniInspector', { target, title: 'DemoButton' });\r\n\r\nconst rows = inspector.querySelectorAll('.mini-inspector__row').length;\r\nif (rows !== 3) {\r\n  throw new Error('Expected 3 editable rows, got ' + rows);\r\n}\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.gap = '20px';\r\nhost.style.alignItems = 'flex-start';\r\nhost.appendChild(target);\r\nhost.appendChild(inspector);\r\nreturn host;"},{"label":"edits flow to the target through its setter","expected":"editing the label field updates the button text","kind":"script","content":"const target = await slice.build('DemoButton', { label: 'Before' });\r\nconst inspector = await slice.build('MiniInspector', { target });\r\n\r\n// The first text input is the string prop (label). Simulate a user edit.\r\nconst input = inspector.querySelector('input[type=\"text\"]');\r\ninput.value = 'After';\r\ninput.dispatchEvent(new Event('input'));\r\n\r\nconst shown = target.querySelector('.demo-button__label').textContent;\r\nif (shown !== 'After') {\r\n  throw new Error('Setter did not update the target. Got: ' + shown);\r\n}\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.gap = '20px';\r\nhost.appendChild(target);\r\nhost.appendChild(inspector);\r\nreturn host;"},{"label":"accepts a sliceId string as target","expected":"resolves the live component by sliceId","kind":"script","content":"const counter = await slice.build('DemoCounter', { sliceId: 'demo-counter-mi', label: 'Items' });\r\nconst inspector = await slice.build('MiniInspector', { target: 'demo-counter-mi', title: 'By sliceId' });\r\n\r\nconst rows = inspector.querySelectorAll('.mini-inspector__row').length;\r\nif (rows === 0) {\r\n  throw new Error('Inspector did not resolve the component from its sliceId');\r\n}\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.gap = '20px';\r\nhost.appendChild(counter);\r\nhost.appendChild(inspector);\r\nreturn host;"},{"label":"boolean prop toggling","expected":"DemoToggle inspected by MiniInspector","kind":"script","content":"const toggle = await slice.build('DemoToggle', { on: false, onText: 'Enabled', offText: 'Disabled' });\r\nconst inspector = await slice.build('MiniInspector', { target: toggle, title: 'DemoToggle' });\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.gap = '20px';\r\nhost.appendChild(toggle);\r\nhost.appendChild(inspector);\r\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "mini-inspector.md";
    this.markdownContent = "---\r\ntitle: MiniInspector\r\nroute: /docs/utilities/mini-inspector\r\nnavLabel: MiniInspector\r\nsection: Utilities\r\ngroup: Developer\r\norder: 10\r\ndescription: MiniInspector documentation with executable live-editing scenarios.\r\ncomponent: MiniInspectorDocumentation\r\ngenerate: true\r\ntags: [inspector, devtools, props, setters]\r\n---\r\n\r\n# MiniInspector\r\n\r\n## Overview\r\n`MiniInspector` is a tiny, readable demonstration of how Slice's live state editing works. Point it\r\nat any component and it reads that component's `static props`, builds an editable control per prop,\r\nand on edit assigns `target[prop] = value` — which fires the target's setter and updates its UI\r\ninstantly. It's the same idea as the built-in DevTools inspector, in ~80 lines.\r\n\r\n## Core Behavior\r\n- Reads `target.constructor.props` and shows one control per editable prop (`string`, `number`, `boolean`).\r\n- Writes edits straight back through the target's setter (`target[prop] = value`); there is no extra binding layer.\r\n- `target` accepts a live component instance or a `sliceId` string.\r\n- It's a normal, theme-aware Visual component — it follows the active theme via CSS variables.\r\n\r\n## Prop Scenarios\r\n:::script label=\"renders one control per editable prop\" expected=\"three rows for DemoButton (label, clicks, disabled)\"\r\nconst target = await slice.build('DemoButton', { label: 'A' });\r\nconst inspector = await slice.build('MiniInspector', { target, title: 'DemoButton' });\r\n\r\nconst rows = inspector.querySelectorAll('.mini-inspector__row').length;\r\nif (rows !== 3) {\r\n  throw new Error('Expected 3 editable rows, got ' + rows);\r\n}\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.gap = '20px';\r\nhost.style.alignItems = 'flex-start';\r\nhost.appendChild(target);\r\nhost.appendChild(inspector);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"edits flow to the target through its setter\" expected=\"editing the label field updates the button text\"\r\nconst target = await slice.build('DemoButton', { label: 'Before' });\r\nconst inspector = await slice.build('MiniInspector', { target });\r\n\r\n// The first text input is the string prop (label). Simulate a user edit.\r\nconst input = inspector.querySelector('input[type=\"text\"]');\r\ninput.value = 'After';\r\ninput.dispatchEvent(new Event('input'));\r\n\r\nconst shown = target.querySelector('.demo-button__label').textContent;\r\nif (shown !== 'After') {\r\n  throw new Error('Setter did not update the target. Got: ' + shown);\r\n}\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.gap = '20px';\r\nhost.appendChild(target);\r\nhost.appendChild(inspector);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"accepts a sliceId string as target\" expected=\"resolves the live component by sliceId\"\r\nconst counter = await slice.build('DemoCounter', { sliceId: 'demo-counter-mi', label: 'Items' });\r\nconst inspector = await slice.build('MiniInspector', { target: 'demo-counter-mi', title: 'By sliceId' });\r\n\r\nconst rows = inspector.querySelectorAll('.mini-inspector__row').length;\r\nif (rows === 0) {\r\n  throw new Error('Inspector did not resolve the component from its sliceId');\r\n}\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.gap = '20px';\r\nhost.appendChild(counter);\r\nhost.appendChild(inspector);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"boolean prop toggling\" expected=\"DemoToggle inspected by MiniInspector\"\r\nconst toggle = await slice.build('DemoToggle', { on: false, onText: 'Enabled', offText: 'Disabled' });\r\nconst inspector = await slice.build('MiniInspector', { target: toggle, title: 'DemoToggle' });\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.gap = '20px';\r\nhost.appendChild(toggle);\r\nhost.appendChild(inspector);\r\nreturn host;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nGive your component's props clear setters that do the DOM work — then the component is instantly\r\ninspectable, and editing a prop here behaves exactly like a prop change anywhere in your app.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nThis demo only edits `string`, `number`, and `boolean` props. A prop only updates the UI if its\r\nsetter performs the DOM change — if editing does nothing, the bug is in the setter, not the inspector.\r\n:::\r\n";
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

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
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
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-miniinspectordocumentation', MiniInspectorDocumentation);
