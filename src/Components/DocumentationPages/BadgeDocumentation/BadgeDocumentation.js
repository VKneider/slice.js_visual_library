export default class BadgeDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Semantic variants","expected":"six pills, each in its semantic theme colour","kind":"script","content":"const meanings = [\n  ['neutral', 'Archived'],\n  ['accent', 'Live'],\n  ['success', 'Healthy'],\n  ['warning', 'Degraded'],\n  ['danger', 'Down'],\n  ['info', 'Beta'],\n];\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';\n\nfor (const [variant, label] of meanings) {\n  row.appendChild(await slice.build('Badge', { variant, label }));\n}\nreturn row;"},{"label":"Counts","expected":"a count badge, and a capped one","kind":"script","content":"const row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\n\nrow.appendChild(await slice.build('Badge', { variant: 'accent', value: 3 }));\nrow.appendChild(await slice.build('Badge', { variant: 'danger', value: 1200 }));\nrow.appendChild(await slice.build('Badge', { variant: 'neutral', label: 'New' }));\nreturn row;"},{"label":"Dot","expected":"a bare dot with an accessible name","kind":"script","content":"const wrap = document.createElement('div');\nwrap.style.cssText = 'display:flex;gap:12px;align-items:center;font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);';\n\nconst badge = await slice.build('Badge', { variant: 'accent', dot: true, label: 'Unread messages' });\nwrap.appendChild(badge);\nwrap.appendChild(document.createTextNode('a dot carries no text, so it needs a label for screen readers'));\nreturn wrap;"}];
  }

  async init() {
    this.markdownPath = "badge.md";
    this.markdownContent = "---\ntitle: Badge\nroute: /docs/display/badge\nnavLabel: Badge\nsection: Display\ngroup: Basic\norder: 25\ndescription: Small status pill or count, with semantic variants that follow the theme.\ncomponent: BadgeDocumentation\ngenerate: true\ntags: [badge, pill, status, count, dot]\n---\n\n# Badge\n\n## Overview\n\nA `Badge` is a small status pill: a count, a label, or a bare dot. It answers \"what state is this\nthing in\" at a glance, next to a list item, a tab, an avatar or a button.\n\nVariants are **semantic** (`success`, `danger`, `warning`, `info`, `accent`), not decorative, and\neach derives from theme tokens — so a badge means the same thing in light and dark without you\npicking a colour.\n\n## API\n\n- `variant` (`neutral` | `accent` | `success` | `warning` | `danger` | `info`, default `neutral`)\n- `label` (string) — the text. Doubles as the accessible name when `dot` is set.\n- `value` (number | null) — a count. Wins over `label`, and is capped by `max` (`99` → `99+`).\n- `max` (number, default `99`) — the cap for `value`.\n- `dot` (boolean) — render a bare dot instead of text.\n- `size` (`sm` | `md`, default `md`)\n\n## Prop Scenarios\n\n:::script label=\"Semantic variants\" expected=\"six pills, each in its semantic theme colour\"\nconst meanings = [\n  ['neutral', 'Archived'],\n  ['accent', 'Live'],\n  ['success', 'Healthy'],\n  ['warning', 'Degraded'],\n  ['danger', 'Down'],\n  ['info', 'Beta'],\n];\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';\n\nfor (const [variant, label] of meanings) {\n  row.appendChild(await slice.build('Badge', { variant, label }));\n}\nreturn row;\n:::\n\n:::script label=\"Counts\" expected=\"a count badge, and a capped one\"\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\n\nrow.appendChild(await slice.build('Badge', { variant: 'accent', value: 3 }));\nrow.appendChild(await slice.build('Badge', { variant: 'danger', value: 1200 }));\nrow.appendChild(await slice.build('Badge', { variant: 'neutral', label: 'New' }));\nreturn row;\n:::\n\n:::script label=\"Dot\" expected=\"a bare dot with an accessible name\"\nconst wrap = document.createElement('div');\nwrap.style.cssText = 'display:flex;gap:12px;align-items:center;font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);';\n\nconst badge = await slice.build('Badge', { variant: 'accent', dot: true, label: 'Unread messages' });\nwrap.appendChild(badge);\nwrap.appendChild(document.createTextNode('a dot carries no text, so it needs a label for screen readers'));\nreturn wrap;\n:::\n\n## Best Practices\n\n:::tip\nOverlaid on a button or an avatar, keep the badge `absolute` in your own layout — `Badge` only\nstyles itself, not its position relative to a sibling.\n:::\n\n## Pitfalls\n\n:::warning\nColour alone is not enough of a signal. A `danger` badge next to a `success` one reads differently to\neveryone, but only the text tells a colourblind user which is which — keep `label` or `value` set.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["- `variant` (`neutral` | `accent` | `success` | `warning` | `danger` | `info`, default `neutral`)"];
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
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"neutral\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"99\",\"allowedValues\":[]},{\"path\":\"dot\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"neutral\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"99\",\"allowedValues\":[]},{\"path\":\"dot\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]}]}");
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

customElements.define('slice-badgedocumentation', BadgeDocumentation);
