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
    this.markdownContent = "---\ntitle: Loading\nroute: /docs/feedback/loading\nnavLabel: Loading\nsection: Feedback\ngroup: Status\norder: 40\ndescription: Loading component documentation with activation and container usage scenarios.\ncomponent: LoadingDocumentation\ngenerate: true\ntags: [loading, feedback]\n---\n\n# Loading\n\n## Overview\n`Loading` displays a blocking spinner overlay either fullscreen or inside a target container.\n\n## Core Behavior\n- `start(container?)` mounts the loading overlay.\n- `stop()` removes it and restores container styles.\n- `active` can be toggled as a reactive state prop.\n\n## Layering and motion\n\nThe overlay sets `z-index: 2147483000` inline when it starts, so it always covers the other global\nlayers it can share a page with — the toast stack sits at `11000` and a drag ghost at `999999`. It is\nalso the only value that beats both from CSS, since the host is positioned from JS.\n\nThe spinner animation is disabled under `prefers-reduced-motion: reduce`, so a user who has asked the\nsystem to calm things down gets a still overlay instead of a perpetual rotation.\n\n:::warning\nA native `<dialog>` (`Modal`) lives in the browser's **top layer**, which no `z-index` can cover. Do\nnot use `Loading` to block a modal — drive the modal's own state instead.\n:::\n\n## Prop Scenarios\n:::script label=\"manual start and stop\" expected=\"loading appears then hides via API\"\nconst loading = await slice.build('Loading');\n\nconst start = await slice.build('Button', {\n  value: 'Start loading',\n  onClick: () => loading.start()\n});\n\nconst stop = await slice.build('Button', {\n  value: 'Stop loading',\n  onClick: () => loading.stop()\n});\n\nconst host = document.createElement('div');\nhost.appendChild(start);\nhost.appendChild(stop);\nhost.appendChild(loading);\nreturn host;\n:::\n\n:::script label=\"active state toggle\" expected=\"active true/false controls visibility\"\nconst loading = await slice.build('Loading', { active: false });\n\nconst activate = await slice.build('Button', {\n  value: 'Activate',\n  onClick: () => {\n    loading.active = true;\n  }\n});\n\nconst deactivate = await slice.build('Button', {\n  value: 'Deactivate',\n  onClick: () => {\n    loading.active = false;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(activate);\nhost.appendChild(deactivate);\nhost.appendChild(loading);\nreturn host;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"minVisibleMs\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"active\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"isActive\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"container\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"minVisibleMs\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"active\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"isActive\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"container\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-loadingdocumentation', LoadingDocumentation);
