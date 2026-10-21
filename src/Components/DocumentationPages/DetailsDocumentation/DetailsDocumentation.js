export default class DetailsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"faq item","expected":"details renders title and expandable answer","kind":"script","content":"const details = await slice.build('Details', {\n  title: 'Can I use this in production?',\n  text: 'Yes, this component is intended for production usage.'\n});\n\nreturn details;"},{"label":"details with custom node","expected":"addDetail appends custom structured content","kind":"script","content":"const details = await slice.build('Details', {\n  title: 'Release checklist',\n  text: 'Main steps before deployment.'\n});\n\nconst list = document.createElement('ul');\n['Run tests', 'Generate docs', 'Verify routes'].forEach((item) => {\n  const li = document.createElement('li');\n  li.textContent = item;\n  list.appendChild(li);\n});\n\ndetails.addDetail(list);\nreturn details;"},{"label":"multiple details blocks","expected":"independent disclosure blocks can coexist","kind":"script","content":"const host = document.createElement('div');\n\nconst billing = await slice.build('Details', {\n  title: 'Billing policy',\n  text: 'Invoices are generated monthly.'\n});\n\nconst support = await slice.build('Details', {\n  title: 'Support policy',\n  text: 'Support available Monday to Friday.'\n});\n\nhost.appendChild(billing);\nhost.appendChild(support);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "details.md";
    this.markdownContent = "---\ntitle: Details\nroute: /docs/layout/details\nnavLabel: Details\nsection: Layout\ngroup: Containers\norder: 21\ndescription: Details component documentation with collapsible content scenarios.\ncomponent: DetailsDocumentation\ngenerate: true\ntags: [details, disclosure, layout]\n---\n\n# Details\n\n## Overview\n`Details` renders expandable sections for progressive disclosure of content.\n\n## Core Behavior\n- `title` defines the summary header.\n- `text` provides the default expanded description body.\n- `addDetail(node)` appends richer custom content into the expanded area.\n\n## Live Preview\n:::component name=\"Details\"\n{\n  \"title\": \"What's included?\",\n  \"text\": \"Source code, tests, and documentation.\"\n}\n:::\n\n## Prop Scenarios\n:::script label=\"faq item\" expected=\"details renders title and expandable answer\"\nconst details = await slice.build('Details', {\n  title: 'Can I use this in production?',\n  text: 'Yes, this component is intended for production usage.'\n});\n\nreturn details;\n:::\n\n:::script label=\"details with custom node\" expected=\"addDetail appends custom structured content\"\nconst details = await slice.build('Details', {\n  title: 'Release checklist',\n  text: 'Main steps before deployment.'\n});\n\nconst list = document.createElement('ul');\n['Run tests', 'Generate docs', 'Verify routes'].forEach((item) => {\n  const li = document.createElement('li');\n  li.textContent = item;\n  list.appendChild(li);\n});\n\ndetails.addDetail(list);\nreturn details;\n:::\n\n:::script label=\"multiple details blocks\" expected=\"independent disclosure blocks can coexist\"\nconst host = document.createElement('div');\n\nconst billing = await slice.build('Details', {\n  title: 'Billing policy',\n  text: 'Invoices are generated monthly.'\n});\n\nconst support = await slice.build('Details', {\n  title: 'Support policy',\n  text: 'Support available Monday to Friday.'\n});\n\nhost.appendChild(billing);\nhost.appendChild(support);\nreturn host;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"title\": \"What's included?\",\n  \"text\": \"Source code, tests, and documentation.\"\n}") {
               try {
                  props = JSON.parse("{\n  \"title\": \"What's included?\",\n  \"text\": \"Source code, tests, and documentation.\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Details', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]}]}");
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

customElements.define('slice-detailsdocumentation', DetailsDocumentation);
