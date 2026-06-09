export default class LayoutDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Swap views","expected":"renders layout and replaces initial view","kind":"script","content":"const layout = await slice.build('Layout', {});\n\nconst initial = document.createElement('p');\ninitial.textContent = 'First view';\nawait layout.showing(initial);\n\nconst replacement = document.createElement('p');\nreplacement.textContent = 'Replaced view';\nawait layout.showing(replacement);\n\nreturn layout;"},{"label":"Layout with card view","expected":"renders layout containing a card","kind":"script","content":"const layout = await slice.build('Layout', {});\n\nconst card = await slice.build('Card', {\n  title: 'Layout Demo',\n  text: 'This card is mounted inside a Layout container.',\n  variant: 'outlined'\n});\n\nawait layout.showing(card);\n\nreturn layout;"}];
  }

  async init() {
    this.markdownPath = "layout.md";
    this.markdownContent = "---\ntitle: Layout\nroute: /docs/layout/layout\nnavLabel: Layout\nsection: Layout\ngroup: Containers\norder: 10\ndescription: Layout container documentation with view swapping scenarios.\ncomponent: LayoutDocumentation\ngenerate: true\ntags: [layout, container]\n---\n\n# Layout\n\n## Overview\n`Layout` is a generic container that accepts a view node and swaps it on demand. It provides two methods: `onLayOut` for initial mounting and `showing` for replacing the current view.\n\n## API and Behavior\n- Accepts `layout` (initial node) and `view` (active view node) as props.\n- `showing(view)` replaces the current child with a new view node.\n- `onLayOut(view)` appends a view (used for initial layout setup).\n- Both props and methods accept any DOM node.\n\n## Prop Scenarios\n:::script label=\"Swap views\" expected=\"renders layout and replaces initial view\"\nconst layout = await slice.build('Layout', {});\n\nconst initial = document.createElement('p');\ninitial.textContent = 'First view';\nawait layout.showing(initial);\n\nconst replacement = document.createElement('p');\nreplacement.textContent = 'Replaced view';\nawait layout.showing(replacement);\n\nreturn layout;\n:::\n\n:::script label=\"Layout with card view\" expected=\"renders layout containing a card\"\nconst layout = await slice.build('Layout', {});\n\nconst card = await slice.build('Card', {\n  title: 'Layout Demo',\n  text: 'This card is mounted inside a Layout container.',\n  variant: 'outlined'\n});\n\nawait layout.showing(card);\n\nreturn layout;\n:::\n\n## Best Practices\n:::tip\nUse `Layout` as a viewport controller when you need to swap entire sections of a page without full navigation.\n:::\n\n## Pitfalls\n:::warning\n`showing` removes the previous child. Ensure stateful views persist their data externally if needed.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"layout\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"view\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"layout\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"view\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-layoutdocumentation', LayoutDocumentation);
