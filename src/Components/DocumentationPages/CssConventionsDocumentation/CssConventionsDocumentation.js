export default class CssConventionsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Scoping demo","expected":"two buttons where only the scoped card has styles","kind":"script","content":"const btn = await slice.build('Button', { value: 'Show scoping demo' });\r\nbtn.onClick = async () => {\r\n  // Build a component to show how scoping works\r\n  const card = await slice.build('Card', {\r\n    title: 'Scoped',\r\n    value: 'Only <slice-card> styles apply here'\r\n  });\r\n  card.style.margin = '0';\r\n  const container = document.createElement('div');\r\n  container.style.display = 'flex';\r\n  container.style.flexDirection = 'column';\r\n  container.style.gap = '0.75rem';\r\n  container.style.padding = '1rem';\r\n  container.style.border = '1px dashed #ccc';\r\n  container.style.borderRadius = '0.5rem';\r\n\r\n  const p = document.createElement('p');\r\n  p.style.fontSize = '0.8rem';\r\n  p.style.margin = '0 0 0.5rem';\r\n  p.textContent = 'The Card below uses scoped selectors — its .slice_card styles cannot leak out or be overridden by global CSS:';\r\n  container.appendChild(p);\r\n  container.appendChild(card);\r\n  document.body.appendChild(container);\r\n  // Clean up after 5 seconds\r\n  setTimeout(() => container.remove(), 5000);\r\n};\r\nreturn btn;"}];
  }

  async init() {
    this.markdownPath = "css-conventions.md";
    this.markdownContent = "---\r\ntitle: CSS Conventions\r\nroute: /docs/internal/css-conventions\r\nnavLabel: CSS Conventions\r\nsection: Internal\r\ngroup: Documentation\r\norder: 2\r\ndescription: Three rules to write component CSS that never leaks — host scope, explicit display, and prefixed keyframes.\r\ncomponent: CssConventionsDocumentation\r\ngenerate: true\r\ntags: [css, scoping, encapsulation, display, conventions]\r\n---\r\n\r\n# CSS Conventions\r\n\r\nTwo problems component CSS has to solve:\r\n1. Styles inside your component leak **out** — `.container` in your component restyles every `.container` on the page.\r\n2. Styles **outside** leak **in** — a global reset or utility framework overrides your internal layout.\r\n\r\nThe fix is three dead-simple rules.\r\n\r\n---\r\n\r\n## 1. Scope everything under `slice-<name>`\r\n\r\nYour component's custom-element tag is your namespace. Every selector starts with it.\r\n\r\n```css\r\n/* ❌ affects every .slice_input in the app */\r\n.slice_input { ... }\r\n\r\n/* ✅ only fires inside <slice-input> */\r\nslice-input .slice_input { ... }\r\n```\r\n\r\n- The tag name is what `customElements.define('slice-...')` registers — it's **not** always the folder name (`Navbar` → `slice-nav-bar`, `MiniInspector` → `slice-mini-inspector`).\r\n- Generic names like `.container`, `.item`, `.card-title` are the most dangerous — always prefix.\r\n- `@media` / `@supports` blocks don't get a pass — scope the selectors inside them too.\r\n\r\n:::script label=\"Scoping demo\" expected=\"two buttons where only the scoped card has styles\"\r\nconst btn = await slice.build('Button', { value: 'Show scoping demo' });\r\nbtn.onClick = async () => {\r\n  // Build a component to show how scoping works\r\n  const card = await slice.build('Card', {\r\n    title: 'Scoped',\r\n    value: 'Only <slice-card> styles apply here'\r\n  });\r\n  card.style.margin = '0';\r\n  const container = document.createElement('div');\r\n  container.style.display = 'flex';\r\n  container.style.flexDirection = 'column';\r\n  container.style.gap = '0.75rem';\r\n  container.style.padding = '1rem';\r\n  container.style.border = '1px dashed #ccc';\r\n  container.style.borderRadius = '0.5rem';\r\n\r\n  const p = document.createElement('p');\r\n  p.style.fontSize = '0.8rem';\r\n  p.style.margin = '0 0 0.5rem';\r\n  p.textContent = 'The Card below uses scoped selectors — its .slice_card styles cannot leak out or be overridden by global CSS:';\r\n  container.appendChild(p);\r\n  container.appendChild(card);\r\n  document.body.appendChild(container);\r\n  // Clean up after 5 seconds\r\n  setTimeout(() => container.remove(), 5000);\r\n};\r\nreturn btn;\r\n:::\r\n\r\n---\r\n\r\n## 2. Set an explicit `display` on the host\r\n\r\nCustom elements default to `display: inline`. That silently:\r\n- Ignores `width` / `height`\r\n- Drops vertical `margin`\r\n- Sits the component on the text baseline\r\n\r\nSet `display` as the **first rule** in your CSS.\r\n\r\n```css\r\nslice-input  { display: block; }\r\nslice-button { display: inline-block; }\r\n```\r\n\r\n| `display` | When to use |\r\n| --- | --- |\r\n| `block` | form fields, layout/data containers, full-width strips (Input, Select, Textarea, Card, Grid, Tabs, Navbar, Pagination, …) |\r\n| `inline-block` | content-sized inline controls (Button, Switch, Checkbox, Icon) |\r\n| `inline-flex` / `flex` | the host is the flex container (ToolTip) |\r\n| `contents` | pure wrappers that should not introduce a box (Modal) |\r\n\r\n> The element selector is low-specificity, so consuming apps can still override it (`slice-button { display: flex }`). Declaring it just removes the broken `inline` default.\r\n\r\n---\r\n\r\n## 3. Prefix `@keyframes`\r\n\r\nKeyframe names are **global**. Bare `@keyframes spin` collides across components.\r\n\r\n```css\r\n/* ❌ */ @keyframes spin { ... }\r\n/* ✅ */ @keyframes slice_loading_spin { ... }\r\n```\r\n\r\n---\r\n\r\n## Exceptions (deliberate leaks)\r\n\r\nSome components append nodes to `document.body` — those elements live outside the component tree, so their styles stay global with a comment explaining why:\r\n\r\n- **ToolTip** — `.slice-tooltip-bubble*` appended to `document.body`\r\n- **Toast** — `.toast-provider-container*` created on `document.body`\r\n- **Icon** — `.slc-*` icon-font glyph stylesheet\r\n- **Card** — `.slice-card*` is the host's own class (`this.classList.add('slice-card')`), already host-scoped\r\n\r\n---\r\n\r\n## Common mistakes\r\n\r\n:::warning\r\n**Renaming a class to scope it changes the CSS selector, not the DOM.** Components keep adding the same class names, so `*.spec.js` assertions on `.some_class` still pass. If a rule was intentionally matching outside the component (a true leak), scoping will stop it — move that styling into the consuming app.\r\n:::\r\n\r\n:::warning\r\nScoping raises every rule's specificity uniformly (one element selector). If an app override stops working after you scope, **don't bump the component's specificity** — adjust the override instead.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "/* ❌ affects every .slice_input in the app */\r\n.slice_input { ... }\r\n\r\n/* ✅ only fires inside <slice-input> */\r\nslice-input .slice_input { ... }\r",
               language: "css"
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
               value: "slice-input  { display: block; }\r\nslice-button { display: inline-block; }\r",
               language: "css"
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
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| `display` | When to use |\r","| --- | --- |\r","| `block` | form fields, layout/data containers, full-width strips (Input, Select, Textarea, Card, Grid, Tabs, Navbar, Pagination, …) |\r","| `inline-block` | content-sized inline controls (Button, Switch, Checkbox, Icon) |\r","| `inline-flex` / `flex` | the host is the flex container (ToolTip) |\r","| `contents` | pure wrappers that should not introduce a box (Modal) |\r"];
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
            const code = await slice.build('CodeVisualizer', {
               value: "/* ❌ */ @keyframes spin { ... }\r\n/* ✅ */ @keyframes slice_loading_spin { ... }\r",
               language: "css"
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

customElements.define('slice-cssconventionsdocumentation', CssConventionsDocumentation);
