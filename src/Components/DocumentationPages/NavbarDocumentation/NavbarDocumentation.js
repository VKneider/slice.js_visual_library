export default class NavbarDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Product docs navbar","expected":"fixed navbar with product sections","kind":"script","content":"const nav = await slice.build('Navbar', {\n  position: 'fixed',\n  logo: { src: '/images/Slice.js-logo.png', path: '/' },\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Components', path: '/docs/input/button' },\n    { text: 'Architecture', path: '/docs/internal/markdown-parser-rules' }\n  ]\n});\n\nconst host = document.createElement('div');\nhost.appendChild(nav);\nreturn host;"},{"label":"Navbar with dropdown + actions","expected":"mix of text links, dropdown and CTA buttons","kind":"script","content":"const nav = await slice.build('Navbar', {\n  items: [\n    { text: 'Overview', path: '/docs' },\n    {\n      text: 'Guides',\n      type: 'dropdown',\n      options: [\n        { text: 'Input', path: '/docs/input/input' },\n        { text: 'Select', path: '/docs/input/select' },\n        { text: 'Card', path: '/docs/layout/card' }\n      ]\n    }\n  ],\n  buttons: [\n    { value: 'Try CLI', color: { background: '#2563eb', text: '#ffffff' } },\n    { value: 'GitHub' }\n  ]\n});\n\nreturn nav;"},{"label":"Dashboard navbar","expected":"compact top navigation for admin contexts","kind":"script","content":"const nav = await slice.build('Navbar', {\n  direction: 'normal',\n  items: [\n    { text: 'Dashboard', path: '/docs' },\n    { text: 'Users', path: '/docs/input/select' },\n    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }\n  ],\n  buttons: [\n    {\n      value: 'Theme',\n      onClick: () => {\n        const current = slice.stylesManager.themeManager.currentTheme;\n        if (current === 'LIGHT') {\n          slice.setTheme('DARK');\n        } else {\n          slice.setTheme('LIGHT');\n        }\n      }\n    }\n  ]\n});\n\nreturn nav;"}];
  }

  async init() {
    this.markdownPath = "navbar.md";
    this.markdownContent = "---\ntitle: Navbar\nroute: /docs/navigation/navbar\nnavLabel: Navbar\nsection: Navigation\ngroup: Core\norder: 30\ndescription: Navbar component documentation with practical setup examples.\ncomponent: NavbarDocumentation\ngenerate: true\ntags: [navbar, navigation]\n---\n\n# Navbar\n\n## Overview\n`Navbar` provides top-level navigation with optional logo, menu items and action buttons.\n\n## Core Behavior\n- `Navbar` organizes top-level navigation with optional branding, route links, dropdown groups and action buttons.\n- Layout behavior is controlled by positioning and direction settings to support product sites and internal dashboards.\n- Scenarios below focus on real navigation compositions rather than static prop duplication.\n\n## Live Preview\n:::component name=\"Navbar\"\n{\n  \"position\": \"static\",\n  \"items\": [\n    {\n      \"text\": \"Home\",\n      \"path\": \"/\"\n    },\n    {\n      \"text\": \"Docs\",\n      \"path\": \"/docs\"\n    },\n    {\n      \"text\": \"Components\",\n      \"path\": \"/docs/input/button\"\n    }\n  ]\n}\n:::\n\n## Practical Setups\n:::script label=\"Product docs navbar\" expected=\"fixed navbar with product sections\"\nconst nav = await slice.build('Navbar', {\n  position: 'fixed',\n  logo: { src: '/images/Slice.js-logo.png', path: '/' },\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Components', path: '/docs/input/button' },\n    { text: 'Architecture', path: '/docs/internal/markdown-parser-rules' }\n  ]\n});\n\nconst host = document.createElement('div');\nhost.appendChild(nav);\nreturn host;\n:::\n\n:::script label=\"Navbar with dropdown + actions\" expected=\"mix of text links, dropdown and CTA buttons\"\nconst nav = await slice.build('Navbar', {\n  items: [\n    { text: 'Overview', path: '/docs' },\n    {\n      text: 'Guides',\n      type: 'dropdown',\n      options: [\n        { text: 'Input', path: '/docs/input/input' },\n        { text: 'Select', path: '/docs/input/select' },\n        { text: 'Card', path: '/docs/layout/card' }\n      ]\n    }\n  ],\n  buttons: [\n    { value: 'Try CLI', color: { background: '#2563eb', text: '#ffffff' } },\n    { value: 'GitHub' }\n  ]\n});\n\nreturn nav;\n:::\n\n:::script label=\"Dashboard navbar\" expected=\"compact top navigation for admin contexts\"\nconst nav = await slice.build('Navbar', {\n  direction: 'normal',\n  items: [\n    { text: 'Dashboard', path: '/docs' },\n    { text: 'Users', path: '/docs/input/select' },\n    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }\n  ],\n  buttons: [\n    {\n      value: 'Theme',\n      onClick: () => {\n        const current = slice.stylesManager.themeManager.currentTheme;\n        if (current === 'LIGHT') {\n          slice.setTheme('DARK');\n        } else {\n          slice.setTheme('LIGHT');\n        }\n      }\n    }\n  ]\n});\n\nreturn nav;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"position\": \"static\",\n  \"items\": [\n    {\n      \"text\": \"Home\",\n      \"path\": \"/\"\n    },\n    {\n      \"text\": \"Docs\",\n      \"path\": \"/docs\"\n    },\n    {\n      \"text\": \"Components\",\n      \"path\": \"/docs/input/button\"\n    }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"position\": \"static\",\n  \"items\": [\n    {\n      \"text\": \"Home\",\n      \"path\": \"/\"\n    },\n    {\n      \"text\": \"Docs\",\n      \"path\": \"/docs\"\n    },\n    {\n      \"text\": \"Components\",\n      \"path\": \"/docs/input/button\"\n    }\n  ]\n}");
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

customElements.define('slice-navbardocumentation', NavbarDocumentation);
