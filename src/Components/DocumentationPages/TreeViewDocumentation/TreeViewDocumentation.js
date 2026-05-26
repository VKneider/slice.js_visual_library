export default class TreeViewDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Nested tree with navigation","expected":"renders tree with two levels of nesting","kind":"script","content":"const treeview = await slice.build('TreeView', {\n  items: [\n    {\n      value: 'Getting Started',\n      path: '/docs/getting-started',\n      items: [\n        { value: 'Installation', path: '/docs/installation' },\n        { value: 'Quick Start', path: '/docs/quick-start' }\n      ]\n    },\n    {\n      value: 'Components',\n      path: '/docs/components',\n      items: [\n        { value: 'Button', path: '/docs/input/button' },\n        { value: 'Card', path: '/docs/layout/card' },\n        { value: 'Table', path: '/docs/data/table' }\n      ]\n    },\n    {\n      value: 'API Reference',\n      path: '/docs/api'\n    }\n  ]\n});\n\nreturn treeview;"},{"label":"Flat tree without nesting","expected":"renders plain list of items","kind":"script","content":"const treeview = await slice.build('TreeView', {\n  items: [\n    { value: 'Dashboard', path: '/dashboard' },\n    { value: 'Settings', path: '/settings' },\n    { value: 'Profile', path: '/profile' },\n    { value: 'Help', path: '/help' }\n  ]\n});\n\nreturn treeview;"},{"label":"Tree with click callback","expected":"items log on click","kind":"script","content":"let lastClicked = null;\n\nconst treeview = await slice.build('TreeView', {\n  onClickCallback: (item) => {\n    lastClicked = item;\n  },\n  items: [\n    { value: 'Option A', path: '/option-a' },\n    { value: 'Option B', path: '/option-b' }\n  ]\n});\n\nreturn treeview;"}];
  }

  async init() {
    this.markdownPath = "treeview.md";
    this.markdownContent = "---\ntitle: TreeView\nroute: /docs/navigation/treeview\nnavLabel: TreeView\nsection: Navigation\ngroup: Navigation\norder: 50\ndescription: TreeView documentation with nested item and navigation scenarios.\ncomponent: TreeViewDocumentation\ngenerate: true\ntags: [treeview, navigation, tree]\n---\n\n# TreeView\n\n## Overview\n`TreeView` renders a nested tree structure using `TreeItem` nodes. Each item can contain child items, and items with children include a collapsible caret. Supports click callbacks and path-based navigation.\n\n## API and Behavior\n- `items` (array of objects) defines the tree hierarchy.\n- Each item accepts: `value` (label), `path` (for navigation), `items` (child array), `onClickCallback`.\n- `onClickCallback` is propagated to all child `TreeItem` nodes.\n- `TreeView` uses `TreeItem` internally via `slice.build('TreeItem', ...)`.\n- Collapse state is persisted to `localStorage`.\n\n## Basic Usage\n```javascript title=\"Build treeview\"\nconst treeview = await slice.build('TreeView', {\n  items: [\n    {\n      value: 'Section 1',\n      path: '/section-1',\n      items: [\n        { value: 'Subsection 1.1', path: '/section-1/sub-1' }\n      ]\n    }\n  ]\n});\n\nthis.appendChild(treeview);\n```\n\n## Prop Scenarios\n:::script label=\"Nested tree with navigation\" expected=\"renders tree with two levels of nesting\"\nconst treeview = await slice.build('TreeView', {\n  items: [\n    {\n      value: 'Getting Started',\n      path: '/docs/getting-started',\n      items: [\n        { value: 'Installation', path: '/docs/installation' },\n        { value: 'Quick Start', path: '/docs/quick-start' }\n      ]\n    },\n    {\n      value: 'Components',\n      path: '/docs/components',\n      items: [\n        { value: 'Button', path: '/docs/input/button' },\n        { value: 'Card', path: '/docs/layout/card' },\n        { value: 'Table', path: '/docs/data/table' }\n      ]\n    },\n    {\n      value: 'API Reference',\n      path: '/docs/api'\n    }\n  ]\n});\n\nreturn treeview;\n:::\n\n:::script label=\"Flat tree without nesting\" expected=\"renders plain list of items\"\nconst treeview = await slice.build('TreeView', {\n  items: [\n    { value: 'Dashboard', path: '/dashboard' },\n    { value: 'Settings', path: '/settings' },\n    { value: 'Profile', path: '/profile' },\n    { value: 'Help', path: '/help' }\n  ]\n});\n\nreturn treeview;\n:::\n\n:::script label=\"Tree with click callback\" expected=\"items log on click\"\nlet lastClicked = null;\n\nconst treeview = await slice.build('TreeView', {\n  onClickCallback: (item) => {\n    lastClicked = item;\n  },\n  items: [\n    { value: 'Option A', path: '/option-a' },\n    { value: 'Option B', path: '/option-b' }\n  ]\n});\n\nreturn treeview;\n:::\n\n## Best Practices\n:::tip\nUse `path` on items that should navigate. Items without `path` toggle their children on click instead.\n:::\n\n## Pitfalls\n:::warning\n`TreeItem` uses `localStorage` to persist open/closed state. State persists across sessions for items with the same label.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const treeview = await slice.build('TreeView', {\n  items: [\n    {\n      value: 'Section 1',\n      path: '/section-1',\n      items: [\n        { value: 'Subsection 1.1', path: '/section-1/sub-1' }\n      ]\n    }\n  ]\n});\n\nthis.appendChild(treeview);",
               language: "javascript"
            });
            if ("Build treeview") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build treeview";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `items` | `array` | `false` | `` | - |","| `onClickCallback` | `function` | `false` | `null` | - |"];
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

customElements.define('slice-treeviewdocumentation', TreeViewDocumentation);
