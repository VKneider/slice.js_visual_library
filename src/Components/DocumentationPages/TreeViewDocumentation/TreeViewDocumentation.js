export default class TreeViewDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Nested tree with navigation","expected":"renders tree with two levels of nesting","kind":"script","content":"const treeview = await slice.build('TreeView', {\n  items: [\n    {\n      value: 'Getting Started',\n      path: '/docs/getting-started',\n      items: [\n        { value: 'Installation', path: '/docs/installation' },\n        { value: 'Quick Start', path: '/docs/quick-start' }\n      ]\n    },\n    {\n      value: 'Components',\n      path: '/docs/components',\n      items: [\n        { value: 'Button', path: '/docs/input/button' },\n        { value: 'Card', path: '/docs/layout/card' },\n        { value: 'Table', path: '/docs/data/table' }\n      ]\n    },\n    {\n      value: 'API Reference',\n      path: '/docs/api'\n    }\n  ]\n});\n\nreturn treeview;"},{"label":"Flat tree without nesting","expected":"renders plain list of items","kind":"script","content":"const treeview = await slice.build('TreeView', {\n  items: [\n    { value: 'Dashboard', path: '/dashboard' },\n    { value: 'Settings', path: '/settings' },\n    { value: 'Profile', path: '/profile' },\n    { value: 'Help', path: '/help' }\n  ]\n});\n\nreturn treeview;"},{"label":"Tree with click callback","expected":"items log on click","kind":"script","content":"let lastClicked = null;\n\nconst treeview = await slice.build('TreeView', {\n  onClick: (item) => {\n    lastClicked = item;\n  },\n  items: [\n    { value: 'Option A', path: '/option-a' },\n    { value: 'Option B', path: '/option-b' }\n  ]\n});\n\nreturn treeview;"}];
  }

  async init() {
    this.markdownPath = "treeview.md";
    this.markdownContent = "---\ntitle: TreeView\nroute: /docs/navigation/treeview\nnavLabel: TreeView\nsection: Navigation\ngroup: Navigation\norder: 50\ndescription: TreeView documentation with nested item and navigation scenarios.\ncomponent: TreeViewDocumentation\ngenerate: true\ntags: [treeview, navigation, tree]\n---\n\n# TreeView\n\n## Overview\n`TreeView` renders a nested tree structure using `TreeItem` nodes. Each item can contain child items, and items with children include a collapsible caret. Supports click callbacks and path-based navigation.\n\n## API and Behavior\n- `items` (array of objects) defines the tree hierarchy.\n- Each item accepts: `value` (label), `path` (for navigation), `items` (child array), `onClickCallback`.\n- `onClickCallback` is propagated to all child `TreeItem` nodes.\n- `TreeView` uses `TreeItem` internally via `slice.build('TreeItem', ...)`.\n- Collapse state is persisted to `localStorage`.\n\n## Live Preview\n:::component name=\"TreeView\"\n{\n  \"items\": [\n    {\n      \"value\": \"Getting Started\",\n      \"path\": \"/docs\",\n      \"items\": [\n        {\n          \"value\": \"Installation\",\n          \"path\": \"/docs\"\n        },\n        {\n          \"value\": \"Quick Start\",\n          \"path\": \"/docs\"\n        }\n      ]\n    },\n    {\n      \"value\": \"Components\",\n      \"path\": \"/docs\",\n      \"items\": [\n        {\n          \"value\": \"Button\",\n          \"path\": \"/docs/input/button\"\n        },\n        {\n          \"value\": \"Card\",\n          \"path\": \"/docs/layout/card\"\n        }\n      ]\n    }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"Nested tree with navigation\" expected=\"renders tree with two levels of nesting\"\nconst treeview = await slice.build('TreeView', {\n  items: [\n    {\n      value: 'Getting Started',\n      path: '/docs/getting-started',\n      items: [\n        { value: 'Installation', path: '/docs/installation' },\n        { value: 'Quick Start', path: '/docs/quick-start' }\n      ]\n    },\n    {\n      value: 'Components',\n      path: '/docs/components',\n      items: [\n        { value: 'Button', path: '/docs/input/button' },\n        { value: 'Card', path: '/docs/layout/card' },\n        { value: 'Table', path: '/docs/data/table' }\n      ]\n    },\n    {\n      value: 'API Reference',\n      path: '/docs/api'\n    }\n  ]\n});\n\nreturn treeview;\n:::\n\n:::script label=\"Flat tree without nesting\" expected=\"renders plain list of items\"\nconst treeview = await slice.build('TreeView', {\n  items: [\n    { value: 'Dashboard', path: '/dashboard' },\n    { value: 'Settings', path: '/settings' },\n    { value: 'Profile', path: '/profile' },\n    { value: 'Help', path: '/help' }\n  ]\n});\n\nreturn treeview;\n:::\n\n:::script label=\"Tree with click callback\" expected=\"items log on click\"\nlet lastClicked = null;\n\nconst treeview = await slice.build('TreeView', {\n  onClick: (item) => {\n    lastClicked = item;\n  },\n  items: [\n    { value: 'Option A', path: '/option-a' },\n    { value: 'Option B', path: '/option-b' }\n  ]\n});\n\nreturn treeview;\n:::\n\n## Best Practices\n:::tip\nUse `path` on items that should navigate. Items without `path` toggle their children on click instead.\n:::\n\n## Pitfalls\n:::warning\n`TreeItem` uses `localStorage` to persist open/closed state. State persists across sessions for items with the same label.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"items\": [\n    {\n      \"value\": \"Getting Started\",\n      \"path\": \"/docs\",\n      \"items\": [\n        {\n          \"value\": \"Installation\",\n          \"path\": \"/docs\"\n        },\n        {\n          \"value\": \"Quick Start\",\n          \"path\": \"/docs\"\n        }\n      ]\n    },\n    {\n      \"value\": \"Components\",\n      \"path\": \"/docs\",\n      \"items\": [\n        {\n          \"value\": \"Button\",\n          \"path\": \"/docs/input/button\"\n        },\n        {\n          \"value\": \"Card\",\n          \"path\": \"/docs/layout/card\"\n        }\n      ]\n    }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"items\": [\n    {\n      \"value\": \"Getting Started\",\n      \"path\": \"/docs\",\n      \"items\": [\n        {\n          \"value\": \"Installation\",\n          \"path\": \"/docs\"\n        },\n        {\n          \"value\": \"Quick Start\",\n          \"path\": \"/docs\"\n        }\n      ]\n    },\n    {\n      \"value\": \"Components\",\n      \"path\": \"/docs\",\n      \"items\": [\n        {\n          \"value\": \"Button\",\n          \"path\": \"/docs/input/button\"\n        },\n        {\n          \"value\": \"Card\",\n          \"path\": \"/docs/layout/card\"\n        }\n      ]\n    }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('TreeView', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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
          return createBuildFallbackNode(name);
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

customElements.define('slice-treeviewdocumentation', TreeViewDocumentation);
