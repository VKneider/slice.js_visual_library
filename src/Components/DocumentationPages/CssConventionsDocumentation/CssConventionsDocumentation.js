export default class CssConventionsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Scoping demo","expected":"two buttons where only the scoped card has styles","kind":"script","content":"const btn = await slice.build('Button', { value: 'Show scoping demo' });\nbtn.onClick = async () => {\n  // Build a component to show how scoping works\n  const card = await slice.build('Card', {\n    title: 'Scoped',\n    value: 'Only <slice-card> styles apply here'\n  });\n  card.style.margin = '0';\n  const container = document.createElement('div');\n  container.style.display = 'flex';\n  container.style.flexDirection = 'column';\n  container.style.gap = '0.75rem';\n  container.style.padding = '1rem';\n  container.style.border = '1px dashed #ccc';\n  container.style.borderRadius = '0.5rem';\n\n  const p = document.createElement('p');\n  p.style.fontSize = '0.8rem';\n  p.style.margin = '0 0 0.5rem';\n  p.textContent = 'The Card below uses scoped selectors — its .slice_card styles cannot leak out or be overridden by global CSS:';\n  container.appendChild(p);\n  container.appendChild(card);\n  document.body.appendChild(container);\n  // Clean up after 5 seconds\n  setTimeout(() => container.remove(), 5000);\n};\nreturn btn;"}];
  }

  async init() {
    this.markdownPath = "css-conventions.md";
    this.markdownContent = "---\ntitle: CSS Conventions\nroute: /docs/internal/css-conventions\nnavLabel: CSS Conventions\nsection: Internal\ngroup: Documentation\norder: 2\ndescription: Three rules to write component CSS that never leaks — host scope, explicit display, and prefixed keyframes.\ncomponent: CssConventionsDocumentation\ngenerate: true\ntags: [css, scoping, encapsulation, display, conventions]\n---\n\n# CSS Conventions\n\nTwo problems component CSS has to solve:\n1. Styles inside your component leak **out** — `.container` in your component restyles every `.container` on the page.\n2. Styles **outside** leak **in** — a global reset or utility framework overrides your internal layout.\n\nThe fix is three dead-simple rules.\n\n---\n\n## 1. Scope everything under `slice-<name>`\n\nYour component's custom-element tag is your namespace. Every selector starts with it.\n\n```css\n/* ❌ affects every .slice_input in the app */\n.slice_input { ... }\n\n/* ✅ only fires inside <slice-input> */\nslice-input .slice_input { ... }\n```\n\n- The tag name is what `customElements.define('slice-...')` registers — it's **not** always the folder name (`Navbar` → `slice-nav-bar`, `MiniInspector` → `slice-mini-inspector`).\n- Generic names like `.container`, `.item`, `.card-title` are the most dangerous — always prefix.\n- `@media` / `@supports` blocks don't get a pass — scope the selectors inside them too.\n\n:::script label=\"Scoping demo\" expected=\"two buttons where only the scoped card has styles\"\nconst btn = await slice.build('Button', { value: 'Show scoping demo' });\nbtn.onClick = async () => {\n  // Build a component to show how scoping works\n  const card = await slice.build('Card', {\n    title: 'Scoped',\n    value: 'Only <slice-card> styles apply here'\n  });\n  card.style.margin = '0';\n  const container = document.createElement('div');\n  container.style.display = 'flex';\n  container.style.flexDirection = 'column';\n  container.style.gap = '0.75rem';\n  container.style.padding = '1rem';\n  container.style.border = '1px dashed #ccc';\n  container.style.borderRadius = '0.5rem';\n\n  const p = document.createElement('p');\n  p.style.fontSize = '0.8rem';\n  p.style.margin = '0 0 0.5rem';\n  p.textContent = 'The Card below uses scoped selectors — its .slice_card styles cannot leak out or be overridden by global CSS:';\n  container.appendChild(p);\n  container.appendChild(card);\n  document.body.appendChild(container);\n  // Clean up after 5 seconds\n  setTimeout(() => container.remove(), 5000);\n};\nreturn btn;\n:::\n\n---\n\n## 2. Set an explicit `display` on the host\n\nCustom elements default to `display: inline`. That silently:\n- Ignores `width` / `height`\n- Drops vertical `margin`\n- Sits the component on the text baseline\n\nSet `display` as the **first rule** in your CSS.\n\n```css\nslice-input  { display: block; }\nslice-button { display: inline-block; }\n```\n\n| `display` | When to use |\n| --- | --- |\n| `block` | form fields, layout/data containers, full-width strips (Input, Select, Textarea, Card, Grid, Tabs, Navbar, Pagination, …) |\n| `inline-block` | content-sized inline controls (Button, Switch, Checkbox, Icon) |\n| `inline-flex` / `flex` | the host is the flex container (ToolTip) |\n| `contents` | pure wrappers that should not introduce a box (Modal) |\n\n> The element selector is low-specificity, so consuming apps can still override it (`slice-button { display: flex }`). Declaring it just removes the broken `inline` default.\n\n---\n\n## 3. Prefix `@keyframes`\n\nKeyframe names are **global**. Bare `@keyframes spin` collides across components.\n\n```css\n/* ❌ */ @keyframes spin { ... }\n/* ✅ */ @keyframes slice_loading_spin { ... }\n```\n\n---\n\n## Exceptions (deliberate leaks)\n\nSome components append nodes to `document.body` — those elements live outside the component tree, so their styles stay global with a comment explaining why:\n\n- **ToolTip** — `.slice-tooltip-bubble*` appended to `document.body`\n- **Toast** — `.toast-provider-container*` created on `document.body`\n- **Icon** — `.slc-*` icon-font glyph stylesheet\n- **Card** — `.slice-card*` is the host's own class (`this.classList.add('slice-card')`), already host-scoped\n\n---\n\n## Common mistakes\n\n:::warning\n**Renaming a class to scope it changes the CSS selector, not the DOM.** Components keep adding the same class names, so `*.spec.js` assertions on `.some_class` still pass. If a rule was intentionally matching outside the component (a true leak), scoping will stop it — move that styling into the consuming app.\n:::\n\n:::warning\nScoping raises every rule's specificity uniformly (one element selector). If an app override stops working after you scope, **don't bump the component's specificity** — adjust the override instead.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "/* ❌ affects every .slice_input in the app */\n.slice_input { ... }\n\n/* ✅ only fires inside <slice-input> */\nslice-input .slice_input { ... }",
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
               value: "slice-input  { display: block; }\nslice-button { display: inline-block; }",
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
            const lines = ["| `display` | When to use |","| --- | --- |","| `block` | form fields, layout/data containers, full-width strips (Input, Select, Textarea, Card, Grid, Tabs, Navbar, Pagination, …) |","| `inline-block` | content-sized inline controls (Button, Switch, Checkbox, Icon) |","| `inline-flex` / `flex` | the host is the flex container (ToolTip) |","| `contents` | pure wrappers that should not introduce a box (Modal) |"];
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
               value: "/* ❌ */ @keyframes spin { ... }\n/* ✅ */ @keyframes slice_loading_spin { ... }",
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
