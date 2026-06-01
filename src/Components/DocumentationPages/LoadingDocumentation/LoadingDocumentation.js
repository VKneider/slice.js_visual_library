export default class LoadingDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"manual start and stop","expected":"loading appears then hides via API","kind":"script","content":"const loading = await slice.build('Loading');\n\nconst start = await slice.build('Button', {\n  value: 'Start loading',\n  onClick: () => loading.start()\n});\n\nconst stop = await slice.build('Button', {\n  value: 'Stop loading',\n  onClick: () => loading.stop()\n});\n\nconst host = document.createElement('div');\nhost.appendChild(start);\nhost.appendChild(stop);\nhost.appendChild(loading);\nreturn host;"},{"label":"active state toggle","expected":"active true/false controls visibility","kind":"script","content":"const loading = await slice.build('Loading', { active: false });\n\nconst activate = await slice.build('Button', {\n  value: 'Activate',\n  onClick: () => {\n    loading.active = true;\n  }\n});\n\nconst deactivate = await slice.build('Button', {\n  value: 'Deactivate',\n  onClick: () => {\n    loading.active = false;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(activate);\nhost.appendChild(deactivate);\nhost.appendChild(loading);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "loading.md";
    this.markdownContent = "---\ntitle: Loading\nroute: /docs/feedback/loading\nnavLabel: Loading\nsection: Feedback\ngroup: Status\norder: 40\ndescription: Loading component documentation with activation and container usage scenarios.\ncomponent: LoadingDocumentation\ngenerate: true\ntags: [loading, feedback]\n---\n\n# Loading\n\n## Overview\n`Loading` displays a blocking spinner overlay either fullscreen or inside a target container.\n\n## Core Behavior\n- `start(container?)` mounts the loading overlay.\n- `stop()` removes it and restores container styles.\n- `active` can be toggled as a reactive state prop.\n\n## Prop Scenarios\n:::script label=\"manual start and stop\" expected=\"loading appears then hides via API\"\nconst loading = await slice.build('Loading');\n\nconst start = await slice.build('Button', {\n  value: 'Start loading',\n  onClick: () => loading.start()\n});\n\nconst stop = await slice.build('Button', {\n  value: 'Stop loading',\n  onClick: () => loading.stop()\n});\n\nconst host = document.createElement('div');\nhost.appendChild(start);\nhost.appendChild(stop);\nhost.appendChild(loading);\nreturn host;\n:::\n\n:::script label=\"active state toggle\" expected=\"active true/false controls visibility\"\nconst loading = await slice.build('Loading', { active: false });\n\nconst activate = await slice.build('Button', {\n  value: 'Activate',\n  onClick: () => {\n    loading.active = true;\n  }\n});\n\nconst deactivate = await slice.build('Button', {\n  value: 'Deactivate',\n  onClick: () => {\n    loading.active = false;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(activate);\nhost.appendChild(deactivate);\nhost.appendChild(loading);\nreturn host;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"active\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"isActive\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"container\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"active\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"isActive\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"container\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-loadingdocumentation', LoadingDocumentation);
