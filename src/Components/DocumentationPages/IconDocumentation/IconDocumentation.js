export default class IconDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Filled vs outlined","expected":"renders two icons with different styles","kind":"script","content":"const filled = await slice.build('Icon', {\n  name: 'star',\n  iconStyle: 'filled',\n  size: 'large',\n  color: '#f59e0b'\n});\n\nconst outlined = await slice.build('Icon', {\n  name: 'star',\n  iconStyle: 'outlined',\n  size: 'large',\n  color: '#6b7280'\n});\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '1rem';\nhost.style.alignItems = 'center';\nhost.appendChild(filled);\nhost.appendChild(outlined);\nreturn host;"},{"label":"Size variants","expected":"renders icons at small, medium and large sizes","kind":"script","content":"const small = await slice.build('Icon', {\n  name: 'settings',\n  size: 'small',\n  color: '#2563eb'\n});\n\nconst medium = await slice.build('Icon', {\n  name: 'settings',\n  size: 'medium',\n  color: '#2563eb'\n});\n\nconst large = await slice.build('Icon', {\n  name: 'settings',\n  size: 'large',\n  color: '#2563eb'\n});\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '1rem';\nhost.style.alignItems = 'center';\nhost.appendChild(small);\nhost.appendChild(medium);\nhost.appendChild(large);\nreturn host;"},{"label":"Custom color","expected":"renders icon with custom hex color","kind":"script","content":"const icon = await slice.build('Icon', {\n  name: 'favorite',\n  size: 'large',\n  color: '#ef4444'\n});\n\nreturn icon;"}];
  }

  async init() {
    this.markdownPath = "icon.md";
    this.markdownContent = "---\ntitle: Icon\nroute: /docs/display/icon\nnavLabel: Icon\nsection: Display\ngroup: Basic\norder: 20\ndescription: Icon documentation with name, size, color and style prop scenarios.\ncomponent: IconDocumentation\ngenerate: true\ntags: [icon, display]\n---\n\n# Icon\n\n## Overview\n`Icon` renders a Material-style icon from a predefined symbol set. Supports filled and outlined styles, configurable size, and custom color.\n\n## API and Behavior\n- `name` selects the icon symbol (default: `youtube`).\n- `iconStyle` accepts `filled` or `outlined`.\n- `size` accepts `small` (16px), `medium` (20px), `large` (24px), or a custom pixel value.\n- `color` sets the icon color via CSS color value.\n- An `update()` method reapplies all props, useful after route navigation.\n\n## Basic Usage\n```javascript title=\"Build icon\"\nconst icon = await slice.build('Icon', {\n  name: 'home',\n  size: 'large',\n  color: '#2563eb'\n});\n\nthis.appendChild(icon);\n```\n\n## Prop Scenarios\n:::script label=\"Filled vs outlined\" expected=\"renders two icons with different styles\"\nconst filled = await slice.build('Icon', {\n  name: 'star',\n  iconStyle: 'filled',\n  size: 'large',\n  color: '#f59e0b'\n});\n\nconst outlined = await slice.build('Icon', {\n  name: 'star',\n  iconStyle: 'outlined',\n  size: 'large',\n  color: '#6b7280'\n});\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '1rem';\nhost.style.alignItems = 'center';\nhost.appendChild(filled);\nhost.appendChild(outlined);\nreturn host;\n:::\n\n:::script label=\"Size variants\" expected=\"renders icons at small, medium and large sizes\"\nconst small = await slice.build('Icon', {\n  name: 'settings',\n  size: 'small',\n  color: '#2563eb'\n});\n\nconst medium = await slice.build('Icon', {\n  name: 'settings',\n  size: 'medium',\n  color: '#2563eb'\n});\n\nconst large = await slice.build('Icon', {\n  name: 'settings',\n  size: 'large',\n  color: '#2563eb'\n});\n\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.gap = '1rem';\nhost.style.alignItems = 'center';\nhost.appendChild(small);\nhost.appendChild(medium);\nhost.appendChild(large);\nreturn host;\n:::\n\n:::script label=\"Custom color\" expected=\"renders icon with custom hex color\"\nconst icon = await slice.build('Icon', {\n  name: 'favorite',\n  size: 'large',\n  color: '#ef4444'\n});\n\nreturn icon;\n:::\n\n## Best Practices\n:::tip\nUse consistent `size` and `color` values within a feature to maintain visual alignment.\n:::\n\n## Pitfalls\n:::warning\nNot every Material icon name is available. Verify the icon name against the included symbol set before use.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const icon = await slice.build('Icon', {\n  name: 'home',\n  size: 'large',\n  color: '#2563eb'\n});\n\nthis.appendChild(icon);",
               language: "javascript"
            });
            if ("Build icon") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build icon";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `color` | `string` | `false` | `black` | - |","| `iconStyle` | `string` | `false` | `filled` | - |","| `name` | `string` | `false` | `youtube` | - |","| `size` | `string` | `false` | `small` | - |"];
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

customElements.define('slice-icondocumentation', IconDocumentation);
