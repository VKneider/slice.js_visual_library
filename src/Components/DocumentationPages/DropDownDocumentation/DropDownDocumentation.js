export default class DropDownDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"docs navigation dropdown","expected":"dropdown renders links for docs sections","kind":"script","content":"const menu = await slice.build('DropDown', {\n  label: 'Documentation',\n  options: [\n    { text: 'Button', href: '/docs/input/button' },\n    { text: 'Input', href: '/docs/input/input' },\n    { text: 'Card', href: '/docs/layout/card' }\n  ]\n});\n\nreturn menu;"},{"label":"product menu","expected":"dropdown can represent product navigation groups","kind":"script","content":"const menu = await slice.build('DropDown', {\n  label: 'Product',\n  options: [\n    { text: 'Overview', href: '/docs' },\n    { text: 'Changelog', href: '/docs/layout/details' },\n    { text: 'Roadmap', href: '/docs/navigation/tabs' }\n  ]\n});\n\nreturn menu;"}];
  }

  async init() {
    this.markdownPath = "dropdown.md";
    this.markdownContent = "---\ntitle: DropDown\nroute: /docs/navigation/dropdown\nnavLabel: DropDown\nsection: Navigation\ngroup: Core\norder: 32\ndescription: DropDown component documentation with practical navigation scenarios.\ncomponent: DropDownDocumentation\ngenerate: true\ntags: [dropdown, navigation]\n---\n\n# DropDown\n\n## Overview\n`DropDown` groups related links under a compact expandable navigation trigger.\n\n## Core Behavior\n- `label` sets the trigger text.\n- `options` renders link items (`text` + `href`).\n- The menu opens on click and closes when you pick an option, click the trigger again, or click outside it.\n\n## Live Preview\n:::component name=\"DropDown\"\n{\n  \"label\": \"Resources\",\n  \"options\": [\n    {\n      \"text\": \"Docs\",\n      \"href\": \"/docs\"\n    },\n    {\n      \"text\": \"GitHub\",\n      \"href\": \"#\"\n    }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"docs navigation dropdown\" expected=\"dropdown renders links for docs sections\"\nconst menu = await slice.build('DropDown', {\n  label: 'Documentation',\n  options: [\n    { text: 'Button', href: '/docs/input/button' },\n    { text: 'Input', href: '/docs/input/input' },\n    { text: 'Card', href: '/docs/layout/card' }\n  ]\n});\n\nreturn menu;\n:::\n\n:::script label=\"product menu\" expected=\"dropdown can represent product navigation groups\"\nconst menu = await slice.build('DropDown', {\n  label: 'Product',\n  options: [\n    { text: 'Overview', href: '/docs' },\n    { text: 'Changelog', href: '/docs/layout/details' },\n    { text: 'Roadmap', href: '/docs/navigation/tabs' }\n  ]\n});\n\nreturn menu;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Resources\",\n  \"options\": [\n    {\n      \"text\": \"Docs\",\n      \"href\": \"/docs\"\n    },\n    {\n      \"text\": \"GitHub\",\n      \"href\": \"#\"\n    }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Resources\",\n  \"options\": [\n    {\n      \"text\": \"Docs\",\n      \"href\": \"/docs\"\n    },\n    {\n      \"text\": \"GitHub\",\n      \"href\": \"#\"\n    }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('DropDown', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]}]}");
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

customElements.define('slice-dropdowndocumentation', DropDownDocumentation);
