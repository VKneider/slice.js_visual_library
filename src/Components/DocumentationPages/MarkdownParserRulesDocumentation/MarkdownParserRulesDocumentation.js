export default class MarkdownParserRulesDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [];
  }

  async init() {
    this.markdownPath = "parser-rules.md";
    this.markdownContent = "---\ntitle: Markdown Parser Rules\nroute: /docs/internal/markdown-parser-rules\nnavLabel: Parser Rules\nsection: Internal\ngroup: Documentation\norder: 1\ndescription: Contract, template, and generation rules for Slice.js documentation pages.\ncomponent: MarkdownParserRulesDocumentation\ngenerate: true\ntags: [docs, parser, rules]\n---\n\n# Markdown Parser Rules\n\n## Scope\nDocumentation markdown files live in `src/markdown/` and are converted into Slice.js components in `src/Components/DocumentationPages/`.\n\n## Required Front Matter\nEvery markdown file must include:\n\n| Field | Required | Example |\n| --- | --- | --- |\n| `title` | yes | `Button` |\n| `route` | yes | `/docs/input/button` |\n| `section` | yes | `Input Components` |\n| `group` | yes | `Basic` |\n| `order` | yes | `10` |\n| `component` | yes | `ButtonDocumentation` |\n\nIf any required field is missing, `npm run docs:lint-md` fails.\n\n## Supported Blocks\n- Headings, paragraphs, lists\n- Fenced code blocks -> `CodeVisualizer`\n- Tables -> `Table`\n- `:::tip` / `:::warning`\n- `:::details title=\"...\"`\n- `:::component name=\"Button\"` with JSON props body\n- `:::script ...` for interactive prop scenarios\n\n## Script Scenario Contract\nUse script blocks to validate component props through runnable scenarios:\n\n```text\n:::script label=\"scenario name\" expected=\"expected outcome\"\n// JavaScript body with access to:\n// component (documentation component instance)\n// slice\n// document\n:::\n```\n\nThe parser renders a **Run** button for each script and reports PASS/FAIL in the page.\n\n## Registry and Styles\n- Generated components are added to `src/Components/components.js` with category `DocumentationPages`.\n- `CopyMarkdownMenu` is synced to `src/Components/AppComponents/CopyMarkdownMenu/`.\n- Global docs style is synced to `src/Styles/DocumentationBase.css`.\n\n## Commands\n```bash\nnpm run docs:lint-md\nnpm run docs:generate\nnpm run docs:sync-registry\n```\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| Field | Required | Example |","| --- | --- | --- |","| `title` | yes | `Button` |","| `route` | yes | `/docs/input/button` |","| `section` | yes | `Input Components` |","| `group` | yes | `Basic` |","| `order` | yes | `10` |","| `component` | yes | `ButtonDocumentation` |"];
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
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: ":::script label=\"scenario name\" expected=\"expected outcome\"\n// JavaScript body with access to:\n// component (documentation component instance)\n// slice\n// document\n:::",
               language: "text"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "npm run docs:lint-md\nnpm run docs:generate\nnpm run docs:sync-registry",
               language: "bash"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
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

customElements.define('slice-markdownparserrulesdocumentation', MarkdownParserRulesDocumentation);
