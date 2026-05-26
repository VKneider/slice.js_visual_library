export default class NavbarDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Product docs navbar","expected":"fixed navbar with product sections","kind":"script","content":"const nav = await slice.build('Navbar', {\n  position: 'fixed',\n  logo: { src: '/images/Slice.js-logo.png', path: '/' },\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Components', path: '/docs/input/button' },\n    { text: 'Architecture', path: '/docs/internal/markdown-parser-rules' }\n  ]\n});\n\nconst host = document.createElement('div');\nhost.appendChild(nav);\nreturn host;"},{"label":"Navbar with dropdown + actions","expected":"mix of text links, dropdown and CTA buttons","kind":"script","content":"const nav = await slice.build('Navbar', {\n  items: [\n    { text: 'Overview', path: '/docs' },\n    {\n      text: 'Guides',\n      type: 'dropdown',\n      options: [\n        { text: 'Input', path: '/docs/input/input' },\n        { text: 'Select', path: '/docs/input/select' },\n        { text: 'Card', path: '/docs/layout/card' }\n      ]\n    }\n  ],\n  buttons: [\n    { value: 'Try CLI', color: { button: '#2563eb', label: '#ffffff' } },\n    { value: 'GitHub' }\n  ]\n});\n\nreturn nav;"},{"label":"Dashboard navbar","expected":"compact top navigation for admin contexts","kind":"script","content":"const nav = await slice.build('Navbar', {\n  direction: 'normal',\n  items: [\n    { text: 'Dashboard', path: '/docs' },\n    { text: 'Users', path: '/docs/input/select' },\n    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }\n  ],\n  buttons: [\n    {\n      value: 'Theme',\n      onClickCallback: () => {\n        const current = slice.stylesManager.themeManager.currentTheme;\n        if (current === 'Slice') {\n          slice.setTheme('Light');\n        } else {\n          slice.setTheme('Slice');\n        }\n      }\n    }\n  ]\n});\n\nreturn nav;"}];
  }

  async init() {
    this.markdownPath = "navbar.md";
    this.markdownContent = "---\ntitle: Navbar\nroute: /docs/navigation/navbar\nnavLabel: Navbar\nsection: Navigation\ngroup: Core\norder: 30\ndescription: Navbar component documentation with practical setup examples.\ncomponent: NavbarDocumentation\ngenerate: true\ntags: [navbar, navigation]\n---\n\n# Navbar\n\n## Overview\n`Navbar` provides top-level navigation with optional logo, menu items and action buttons.\n\n## Core Behavior\n- `Navbar` organizes top-level navigation with optional branding, route links, dropdown groups and action buttons.\n- Layout behavior is controlled by positioning and direction settings to support product sites and internal dashboards.\n- Scenarios below focus on real navigation compositions rather than static prop duplication.\n\n## Basic Usage\n```javascript title=\"Build navbar\"\nconst nav = await slice.build('Navbar', {\n  position: 'fixed',\n  items: [\n    { text: 'Home', path: '/' },\n    { text: 'Docs', path: '/docs' }\n  ]\n});\n\nthis.appendChild(nav);\n```\n\n## Practical Setups\n:::script label=\"Product docs navbar\" expected=\"fixed navbar with product sections\"\nconst nav = await slice.build('Navbar', {\n  position: 'fixed',\n  logo: { src: '/images/Slice.js-logo.png', path: '/' },\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Components', path: '/docs/input/button' },\n    { text: 'Architecture', path: '/docs/internal/markdown-parser-rules' }\n  ]\n});\n\nconst host = document.createElement('div');\nhost.appendChild(nav);\nreturn host;\n:::\n\n:::script label=\"Navbar with dropdown + actions\" expected=\"mix of text links, dropdown and CTA buttons\"\nconst nav = await slice.build('Navbar', {\n  items: [\n    { text: 'Overview', path: '/docs' },\n    {\n      text: 'Guides',\n      type: 'dropdown',\n      options: [\n        { text: 'Input', path: '/docs/input/input' },\n        { text: 'Select', path: '/docs/input/select' },\n        { text: 'Card', path: '/docs/layout/card' }\n      ]\n    }\n  ],\n  buttons: [\n    { value: 'Try CLI', color: { button: '#2563eb', label: '#ffffff' } },\n    { value: 'GitHub' }\n  ]\n});\n\nreturn nav;\n:::\n\n:::script label=\"Dashboard navbar\" expected=\"compact top navigation for admin contexts\"\nconst nav = await slice.build('Navbar', {\n  direction: 'normal',\n  items: [\n    { text: 'Dashboard', path: '/docs' },\n    { text: 'Users', path: '/docs/input/select' },\n    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }\n  ],\n  buttons: [\n    {\n      value: 'Theme',\n      onClickCallback: () => {\n        const current = slice.stylesManager.themeManager.currentTheme;\n        if (current === 'Slice') {\n          slice.setTheme('Light');\n        } else {\n          slice.setTheme('Slice');\n        }\n      }\n    }\n  ]\n});\n\nreturn nav;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const nav = await slice.build('Navbar', {\n  position: 'fixed',\n  items: [\n    { text: 'Home', path: '/' },\n    { text: 'Docs', path: '/docs' }\n  ]\n});\n\nthis.appendChild(nav);",
               language: "javascript"
            });
            if ("Build navbar") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build navbar";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `buttons` | `array` | `false` | `` | - |","| `direction` | `string` | `false` | `normal` | - |","| `items` | `array` | `false` | `` | - |","| `logo` | `object` | `false` | `null` | - |","| `position` | `string` | `false` | `static` | - |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
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

        const mount = (node) => {
          if (node instanceof Node) {
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, slice, document, mount);

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
      card.appendChild(code);
      card.appendChild(preview);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-navbardocumentation', NavbarDocumentation);
