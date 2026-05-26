export default class NotFoundDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Default 404 view","expected":"renders not found message","kind":"script","content":"const notFound = await slice.build('NotFound', {});\nreturn notFound;"},{"label":"Route fallback usage","expected":"renders not found inside route container","kind":"script","content":"const notFound = await slice.build('NotFound', {});\n\nconst route = await slice.build('Route', {\n  path: '/does-not-exist',\n  view: notFound\n});\n\nconst host = document.createElement('div');\nconst label = document.createElement('p');\nlabel.textContent = 'Route /does-not-exist mapped to NotFound:';\nhost.appendChild(label);\nhost.appendChild(route);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "not-found.md";
    this.markdownContent = "---\ntitle: NotFound\nroute: /docs/navigation/not-found\nnavLabel: NotFound\nsection: Navigation\ngroup: Core\norder: 40\ndescription: NotFound 404 page documentation with route fallback scenarios.\ncomponent: NotFoundDocumentation\ngenerate: true\ntags: [not-found, 404, navigation, routing]\n---\n\n# NotFound\n\n## Overview\n`NotFound` renders a 404 fallback page when no route matches the current URL. It sets the document title to \"404 - Not Found\" on initialization.\n\n## API and Behavior\n- No props required. Displays a static 404 message.\n- Automatically updates the page title on `init()`.\n- Composable inside `MultiRoute` as the default fallback view.\n\n## Basic Usage\n```javascript title=\"Build not found page\"\nconst notFound = await slice.build('NotFound', {});\nthis.appendChild(notFound);\n```\n\n## Prop Scenarios\n:::script label=\"Default 404 view\" expected=\"renders not found message\"\nconst notFound = await slice.build('NotFound', {});\nreturn notFound;\n:::\n\n:::script label=\"Route fallback usage\" expected=\"renders not found inside route container\"\nconst notFound = await slice.build('NotFound', {});\n\nconst route = await slice.build('Route', {\n  path: '/does-not-exist',\n  view: notFound\n});\n\nconst host = document.createElement('div');\nconst label = document.createElement('p');\nlabel.textContent = 'Route /does-not-exist mapped to NotFound:';\nhost.appendChild(label);\nhost.appendChild(route);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nUse `NotFound` as the final route inside `MultiRoute` to catch unmatched paths.\n:::\n\n## Pitfalls\n:::warning\n`NotFound` is a presentation-only component. It does not provide automatic redirect logic.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const notFound = await slice.build('NotFound', {});\nthis.appendChild(notFound);",
               language: "javascript"
            });
            if ("Build not found page") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build not found page";
               container.appendChild(label);
            }
            container.appendChild(code);
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

customElements.define('slice-notfounddocumentation', NotFoundDocumentation);
