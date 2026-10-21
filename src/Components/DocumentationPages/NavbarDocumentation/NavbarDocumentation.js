export default class NavbarDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Product docs navbar","expected":"fixed navbar with product sections","kind":"script","content":"const nav = await slice.build('Navbar', {\r\n  position: 'fixed',\r\n  logo: { src: '/images/Slice.js-logo.png', path: '/' },\r\n  items: [\r\n    { text: 'Docs', path: '/docs' },\r\n    { text: 'Components', path: '/docs/input/button' },\r\n    { text: 'Architecture', path: '/docs/internal/markdown-parser-rules' }\r\n  ]\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(nav);\r\nreturn host;"},{"label":"Navbar with dropdown + actions","expected":"mix of text links, dropdown and CTA buttons","kind":"script","content":"const nav = await slice.build('Navbar', {\r\n  items: [\r\n    { text: 'Overview', path: '/docs' },\r\n    {\r\n      text: 'Guides',\r\n      type: 'dropdown',\r\n      options: [\r\n        { text: 'Input', path: '/docs/input/input' },\r\n        { text: 'Select', path: '/docs/input/select' },\r\n        { text: 'Card', path: '/docs/layout/card' }\r\n      ]\r\n    }\r\n  ],\r\n  buttons: [\r\n    { value: 'Try CLI', color: { background: '#2563eb', text: '#ffffff' } },\r\n    { value: 'GitHub' }\r\n  ]\r\n});\r\n\r\nreturn nav;"},{"label":"Dashboard navbar","expected":"compact top navigation for admin contexts","kind":"script","content":"const nav = await slice.build('Navbar', {\r\n  direction: 'normal',\r\n  items: [\r\n    { text: 'Dashboard', path: '/docs' },\r\n    { text: 'Users', path: '/docs/input/select' },\r\n    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }\r\n  ],\r\n  buttons: [\r\n    {\r\n      value: 'Theme',\r\n      onClick: () => {\r\n        const current = slice.stylesManager.themeManager.currentTheme;\r\n        if (current === 'LIGHT') {\r\n          slice.setTheme('DARK');\r\n        } else {\r\n          slice.setTheme('LIGHT');\r\n        }\r\n      }\r\n    }\r\n  ]\r\n});\r\n\r\nreturn nav;"}];
  }

  async init() {
    this.markdownPath = "navbar.md";
    this.markdownContent = "---\r\ntitle: Navbar\r\nroute: /docs/navigation/navbar\r\nnavLabel: Navbar\r\nsection: Navigation\r\ngroup: Core\r\norder: 30\r\ndescription: Navbar component documentation with practical setup examples.\r\ncomponent: NavbarDocumentation\r\ngenerate: true\r\ntags: [navbar, navigation]\r\n---\r\n\r\n# Navbar\r\n\r\n## Overview\r\n`Navbar` provides top-level navigation with optional logo, menu items and action buttons.\r\n\r\n## Core Behavior\r\n- `Navbar` organizes top-level navigation with optional branding, route links, dropdown groups and action buttons.\r\n- Layout behavior is controlled by positioning and direction settings to support product sites and internal dashboards.\r\n- Scenarios below focus on real navigation compositions rather than static prop duplication.\r\n\r\n## Live Preview\r\n:::component name=\"Navbar\"\r\n{\r\n  \"position\": \"static\",\r\n  \"items\": [\r\n    {\r\n      \"text\": \"Home\",\r\n      \"path\": \"/\"\r\n    },\r\n    {\r\n      \"text\": \"Docs\",\r\n      \"path\": \"/docs\"\r\n    },\r\n    {\r\n      \"text\": \"Components\",\r\n      \"path\": \"/docs/input/button\"\r\n    }\r\n  ]\r\n}\r\n:::\r\n\r\n## Practical Setups\r\n:::script label=\"Product docs navbar\" expected=\"fixed navbar with product sections\"\r\nconst nav = await slice.build('Navbar', {\r\n  position: 'fixed',\r\n  logo: { src: '/images/Slice.js-logo.png', path: '/' },\r\n  items: [\r\n    { text: 'Docs', path: '/docs' },\r\n    { text: 'Components', path: '/docs/input/button' },\r\n    { text: 'Architecture', path: '/docs/internal/markdown-parser-rules' }\r\n  ]\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(nav);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"Navbar with dropdown + actions\" expected=\"mix of text links, dropdown and CTA buttons\"\r\nconst nav = await slice.build('Navbar', {\r\n  items: [\r\n    { text: 'Overview', path: '/docs' },\r\n    {\r\n      text: 'Guides',\r\n      type: 'dropdown',\r\n      options: [\r\n        { text: 'Input', path: '/docs/input/input' },\r\n        { text: 'Select', path: '/docs/input/select' },\r\n        { text: 'Card', path: '/docs/layout/card' }\r\n      ]\r\n    }\r\n  ],\r\n  buttons: [\r\n    { value: 'Try CLI', color: { background: '#2563eb', text: '#ffffff' } },\r\n    { value: 'GitHub' }\r\n  ]\r\n});\r\n\r\nreturn nav;\r\n:::\r\n\r\n:::script label=\"Dashboard navbar\" expected=\"compact top navigation for admin contexts\"\r\nconst nav = await slice.build('Navbar', {\r\n  direction: 'normal',\r\n  items: [\r\n    { text: 'Dashboard', path: '/docs' },\r\n    { text: 'Users', path: '/docs/input/select' },\r\n    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }\r\n  ],\r\n  buttons: [\r\n    {\r\n      value: 'Theme',\r\n      onClick: () => {\r\n        const current = slice.stylesManager.themeManager.currentTheme;\r\n        if (current === 'LIGHT') {\r\n          slice.setTheme('DARK');\r\n        } else {\r\n          slice.setTheme('LIGHT');\r\n        }\r\n      }\r\n    }\r\n  ]\r\n});\r\n\r\nreturn nav;\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"position\": \"static\",\r\n  \"items\": [\r\n    {\r\n      \"text\": \"Home\",\r\n      \"path\": \"/\"\r\n    },\r\n    {\r\n      \"text\": \"Docs\",\r\n      \"path\": \"/docs\"\r\n    },\r\n    {\r\n      \"text\": \"Components\",\r\n      \"path\": \"/docs/input/button\"\r\n    }\r\n  ]\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"position\": \"static\",\r\n  \"items\": [\r\n    {\r\n      \"text\": \"Home\",\r\n      \"path\": \"/\"\r\n    },\r\n    {\r\n      \"text\": \"Docs\",\r\n      \"path\": \"/docs\"\r\n    },\r\n    {\r\n      \"text\": \"Components\",\r\n      \"path\": \"/docs/input/button\"\r\n    }\r\n  ]\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Navbar', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"logo\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttons\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"position\",\"type\":\"string\",\"required\":false,\"default\":\"static\",\"allowedValues\":[]},{\"path\":\"direction\",\"type\":\"string\",\"required\":false,\"default\":\"normal\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"logo\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttons\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"position\",\"type\":\"string\",\"required\":false,\"default\":\"static\",\"allowedValues\":[]},{\"path\":\"direction\",\"type\":\"string\",\"required\":false,\"default\":\"normal\",\"allowedValues\":[]}]}");
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

customElements.define('slice-navbardocumentation', NavbarDocumentation);
