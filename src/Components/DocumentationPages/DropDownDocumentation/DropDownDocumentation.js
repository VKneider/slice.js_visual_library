export default class DropDownDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Action menu","expected":"picking an item runs the action and shows the result","kind":"script","content":"const result = document.createElement('p');\nresult.textContent = 'No action yet';\nresult.style.cssText = 'font-family:system-ui,sans-serif;font-size:13px;color:#6b7280;';\n\nconst menu = await slice.build('DropDown', {\n  label: 'Export',\n  options: [\n    { text: 'Download JSON', callback: () => { result.textContent = 'Downloaded'; } },\n    { text: 'Print view', callback: () => { result.textContent = 'Print dialog opened'; } },\n    { text: 'Back to docs', path: '/docs' }\n  ]\n});\n\nconst host = document.createElement('div');\nhost.appendChild(menu);\nhost.appendChild(result);\nreturn host;"},{"label":"docs navigation dropdown","expected":"dropdown renders links for docs sections","kind":"script","content":"const menu = await slice.build('DropDown', {\n  label: 'Documentation',\n  options: [\n    { text: 'Button', href: '/docs/input/button' },\n    { text: 'Input', href: '/docs/input/input' },\n    { text: 'Card', href: '/docs/layout/card' }\n  ]\n});\n\nreturn menu;"},{"label":"product menu","expected":"dropdown can represent product navigation groups","kind":"script","content":"const menu = await slice.build('DropDown', {\n  label: 'Product',\n  options: [\n    { text: 'Overview', href: '/docs' },\n    { text: 'Changelog', href: '/docs/layout/details' },\n    { text: 'Roadmap', href: '/docs/navigation/tabs' }\n  ]\n});\n\nreturn menu;"}];
  }

  async init() {
    this.markdownPath = "dropdown.md";
    this.markdownContent = "---\ntitle: DropDown\nroute: /docs/navigation/dropdown\nnavLabel: DropDown\nsection: Navigation\ngroup: Core\norder: 32\ndescription: DropDown component documentation with practical navigation scenarios.\ncomponent: DropDownDocumentation\ngenerate: true\ntags: [dropdown, navigation]\n---\n\n# DropDown\n\n## Overview\n`DropDown` groups related links **or actions** under a compact expandable trigger.\n\n## Core Behavior\n- `label` sets the trigger text.\n- `options` renders items. Each item is a **link** (`text` + `href`/`path`, `path` navigates through `slice.router`) or an **action** (`text` + `callback`).\n- The menu opens on click and closes when you pick an option, click the trigger again, or click outside it.\n- The box is right-anchored so it stays on screen for a trigger at the end of a toolbar, and flips back to left-anchored below 760px.\n\n## Actions, not just links\nAn item with a `callback` runs the function and closes the menu. It never navigates — `callback`\ntakes precedence over `path`/`href`, so an item carrying both runs the callback and stays put. Before\n`callback`, the only way to express a non-navigating item was a placeholder `href: '#'` that went\nnowhere.\n\n:::script label=\"Action menu\" expected=\"picking an item runs the action and shows the result\"\nconst result = document.createElement('p');\nresult.textContent = 'No action yet';\nresult.style.cssText = 'font-family:system-ui,sans-serif;font-size:13px;color:#6b7280;';\n\nconst menu = await slice.build('DropDown', {\n  label: 'Export',\n  options: [\n    { text: 'Download JSON', callback: () => { result.textContent = 'Downloaded'; } },\n    { text: 'Print view', callback: () => { result.textContent = 'Print dialog opened'; } },\n    { text: 'Back to docs', path: '/docs' }\n  ]\n});\n\nconst host = document.createElement('div');\nhost.appendChild(menu);\nhost.appendChild(result);\nreturn host;\n:::\n\n## Live Preview\n:::component name=\"DropDown\"\n{\n  \"label\": \"Resources\",\n  \"options\": [\n    {\n      \"text\": \"Docs\",\n      \"href\": \"/docs\"\n    },\n    {\n      \"text\": \"GitHub\",\n      \"href\": \"#\"\n    }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"docs navigation dropdown\" expected=\"dropdown renders links for docs sections\"\nconst menu = await slice.build('DropDown', {\n  label: 'Documentation',\n  options: [\n    { text: 'Button', href: '/docs/input/button' },\n    { text: 'Input', href: '/docs/input/input' },\n    { text: 'Card', href: '/docs/layout/card' }\n  ]\n});\n\nreturn menu;\n:::\n\n:::script label=\"product menu\" expected=\"dropdown can represent product navigation groups\"\nconst menu = await slice.build('DropDown', {\n  label: 'Product',\n  options: [\n    { text: 'Overview', href: '/docs' },\n    { text: 'Changelog', href: '/docs/layout/details' },\n    { text: 'Roadmap', href: '/docs/navigation/tabs' }\n  ]\n});\n\nreturn menu;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
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
         const container = this.querySelector('[data-block-id="doc-block-5"]');
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

customElements.define('slice-dropdowndocumentation', DropDownDocumentation);
