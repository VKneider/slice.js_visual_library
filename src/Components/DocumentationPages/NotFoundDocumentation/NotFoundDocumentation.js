export default class NotFoundDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Default 404 view","expected":"renders not found message","kind":"script","content":"const notFound = await slice.build('NotFound', {});\nreturn notFound;"},{"label":"Route fallback usage","expected":"renders not found inside route container","kind":"script","content":"const notFound = await slice.build('NotFound', {});\n\nconst route = await slice.build('Route', {\n  path: '/does-not-exist',\n  view: notFound\n});\n\nconst host = document.createElement('div');\nconst label = document.createElement('p');\nlabel.textContent = 'Route /does-not-exist mapped to NotFound:';\nhost.appendChild(label);\nhost.appendChild(route);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "not-found.md";
    this.markdownContent = "---\ntitle: NotFound\nroute: /docs/navigation/not-found\nnavLabel: NotFound\nsection: Navigation\ngroup: Core\norder: 40\ndescription: NotFound 404 page documentation with route fallback scenarios.\ncomponent: NotFoundDocumentation\ngenerate: true\ntags: [not-found, 404, navigation, routing]\n---\n\n# NotFound\n\n## Overview\n`NotFound` renders a 404 fallback page when no route matches the current URL. It sets the document title to \"404 - Not Found\" on initialization.\n\n## API and Behavior\n- No props required. Displays a static 404 message.\n- Automatically updates the page title on `init()`.\n- Composable inside `MultiRoute` as the default fallback view.\n\n## Live Preview\n:::component name=\"NotFound\"\n:::\n\n## Prop Scenarios\n:::script label=\"Default 404 view\" expected=\"renders not found message\"\nconst notFound = await slice.build('NotFound', {});\nreturn notFound;\n:::\n\n:::script label=\"Route fallback usage\" expected=\"renders not found inside route container\"\nconst notFound = await slice.build('NotFound', {});\n\nconst route = await slice.build('Route', {\n  path: '/does-not-exist',\n  view: notFound\n});\n\nconst host = document.createElement('div');\nconst label = document.createElement('p');\nlabel.textContent = 'Route /does-not-exist mapped to NotFound:';\nhost.appendChild(label);\nhost.appendChild(route);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nUse `NotFound` as the final route inside `MultiRoute` to catch unmatched paths.\n:::\n\n## Pitfalls\n:::warning\n`NotFound` is a presentation-only component. It does not provide automatic redirect logic.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("") {
               try {
                  props = JSON.parse("");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('NotFound', props);
            container.appendChild(component);
         }
       }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: 'â'
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
      // parse as this.scriptScenarios â€” so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all â€” the divs
      // were never filled, nothing in the repo reads .script-block â€” the real demos were
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

customElements.define('slice-notfounddocumentation', NotFoundDocumentation);
