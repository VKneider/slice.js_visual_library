export default class DetailsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"faq item","expected":"details renders title and expandable answer","kind":"script","content":"const details = await slice.build('Details', {\r\n  title: 'Can I use this in production?',\r\n  text: 'Yes, this component is intended for production usage.'\r\n});\r\n\r\nreturn details;"},{"label":"details with custom node","expected":"addDetail appends custom structured content","kind":"script","content":"const details = await slice.build('Details', {\r\n  title: 'Release checklist',\r\n  text: 'Main steps before deployment.'\r\n});\r\n\r\nconst list = document.createElement('ul');\r\n['Run tests', 'Generate docs', 'Verify routes'].forEach((item) => {\r\n  const li = document.createElement('li');\r\n  li.textContent = item;\r\n  list.appendChild(li);\r\n});\r\n\r\ndetails.addDetail(list);\r\nreturn details;"},{"label":"multiple details blocks","expected":"independent disclosure blocks can coexist","kind":"script","content":"const host = document.createElement('div');\r\n\r\nconst billing = await slice.build('Details', {\r\n  title: 'Billing policy',\r\n  text: 'Invoices are generated monthly.'\r\n});\r\n\r\nconst support = await slice.build('Details', {\r\n  title: 'Support policy',\r\n  text: 'Support available Monday to Friday.'\r\n});\r\n\r\nhost.appendChild(billing);\r\nhost.appendChild(support);\r\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "details.md";
    this.markdownContent = "---\r\ntitle: Details\r\nroute: /docs/layout/details\r\nnavLabel: Details\r\nsection: Layout\r\ngroup: Containers\r\norder: 21\r\ndescription: Details component documentation with collapsible content scenarios.\r\ncomponent: DetailsDocumentation\r\ngenerate: true\r\ntags: [details, disclosure, layout]\r\n---\r\n\r\n# Details\r\n\r\n## Overview\r\n`Details` renders expandable sections for progressive disclosure of content.\r\n\r\n## Core Behavior\r\n- `title` defines the summary header.\r\n- `text` provides the default expanded description body.\r\n- `addDetail(node)` appends richer custom content into the expanded area.\r\n\r\n## Live Preview\r\n:::component name=\"Details\"\r\n{\r\n  \"title\": \"What's included?\",\r\n  \"text\": \"Source code, tests, and documentation.\"\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"faq item\" expected=\"details renders title and expandable answer\"\r\nconst details = await slice.build('Details', {\r\n  title: 'Can I use this in production?',\r\n  text: 'Yes, this component is intended for production usage.'\r\n});\r\n\r\nreturn details;\r\n:::\r\n\r\n:::script label=\"details with custom node\" expected=\"addDetail appends custom structured content\"\r\nconst details = await slice.build('Details', {\r\n  title: 'Release checklist',\r\n  text: 'Main steps before deployment.'\r\n});\r\n\r\nconst list = document.createElement('ul');\r\n['Run tests', 'Generate docs', 'Verify routes'].forEach((item) => {\r\n  const li = document.createElement('li');\r\n  li.textContent = item;\r\n  list.appendChild(li);\r\n});\r\n\r\ndetails.addDetail(list);\r\nreturn details;\r\n:::\r\n\r\n:::script label=\"multiple details blocks\" expected=\"independent disclosure blocks can coexist\"\r\nconst host = document.createElement('div');\r\n\r\nconst billing = await slice.build('Details', {\r\n  title: 'Billing policy',\r\n  text: 'Invoices are generated monthly.'\r\n});\r\n\r\nconst support = await slice.build('Details', {\r\n  title: 'Support policy',\r\n  text: 'Support available Monday to Friday.'\r\n});\r\n\r\nhost.appendChild(billing);\r\nhost.appendChild(support);\r\nreturn host;\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"title\": \"What's included?\",\r\n  \"text\": \"Source code, tests, and documentation.\"\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"title\": \"What's included?\",\r\n  \"text\": \"Source code, tests, and documentation.\"\r\n}");
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
