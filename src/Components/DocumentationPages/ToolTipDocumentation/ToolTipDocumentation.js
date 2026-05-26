export default class ToolTipDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Hover tooltip","expected":"tooltip appears on hover over trigger text","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: 'This is a tooltip'\n});\n\ntooltip.textContent = 'Hover over this text';\n\nreturn tooltip;"},{"label":"Tooltip with button trigger","expected":"tooltip wraps a button element","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: 'Click to confirm'\n});\n\nconst button = await slice.build('Button', {\n  value: 'Submit'\n});\n\ntooltip.appendChild(button);\n\nconst host = document.createElement('div');\nhost.appendChild(tooltip);\nreturn host;"},{"label":"Empty text suppresses tooltip","expected":"no bubble appears on hover","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: ''\n});\n\ntooltip.textContent = 'Hover me (no tooltip)';\n\nreturn tooltip;"}];
  }

  async init() {
    this.markdownPath = "tooltip.md";
    this.markdownContent = "---\ntitle: ToolTip\nroute: /docs/display/tooltip\nnavLabel: ToolTip\nsection: Display\ngroup: Overlay\norder: 10\ndescription: ToolTip documentation with hover and focus trigger scenarios.\ncomponent: ToolTipDocumentation\ngenerate: true\ntags: [tooltip, overlay, display]\n---\n\n# ToolTip\n\n## Overview\n`ToolTip` displays a floating text label when the user hovers or focuses the wrapped content. The tooltip repositions itself to stay within the viewport.\n\n## API and Behavior\n- `text` sets the tooltip string. Empty text suppresses the tooltip.\n- Triggered by `mouseenter` / `mouseleave` and `focusin` / `focusout`.\n- Bubble is appended to `document.body` for accurate positioning.\n- Automatically flips above or below based on available space.\n- Cleans up the bubble element on disconnect or destroy.\n\n## Basic Usage\n```javascript title=\"Build tooltip\"\nconst tooltip = await slice.build('ToolTip', {\n  text: 'Save changes'\n});\n\ntooltip.textContent = 'Hover me';\n\nthis.appendChild(tooltip);\n```\n\n## Prop Scenarios\n:::script label=\"Hover tooltip\" expected=\"tooltip appears on hover over trigger text\"\nconst tooltip = await slice.build('ToolTip', {\n  text: 'This is a tooltip'\n});\n\ntooltip.textContent = 'Hover over this text';\n\nreturn tooltip;\n:::\n\n:::script label=\"Tooltip with button trigger\" expected=\"tooltip wraps a button element\"\nconst tooltip = await slice.build('ToolTip', {\n  text: 'Click to confirm'\n});\n\nconst button = await slice.build('Button', {\n  value: 'Submit'\n});\n\ntooltip.appendChild(button);\n\nconst host = document.createElement('div');\nhost.appendChild(tooltip);\nreturn host;\n:::\n\n:::script label=\"Empty text suppresses tooltip\" expected=\"no bubble appears on hover\"\nconst tooltip = await slice.build('ToolTip', {\n  text: ''\n});\n\ntooltip.textContent = 'Hover me (no tooltip)';\n\nreturn tooltip;\n:::\n\n## Best Practices\n:::tip\nWrap interactive elements like buttons or icons with `ToolTip` to provide contextual hints without cluttering the UI.\n:::\n\n## Pitfalls\n:::warning\nThe tooltip covers the trigger element's content. Place tooltip content as text nodes or child elements inside the component.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const tooltip = await slice.build('ToolTip', {\n  text: 'Save changes'\n});\n\ntooltip.textContent = 'Hover me';\n\nthis.appendChild(tooltip);",
               language: "javascript"
            });
            if ("Build tooltip") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build tooltip";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `text` | `string` | `false` | `` | - |"];
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

customElements.define('slice-tooltipdocumentation', ToolTipDocumentation);
