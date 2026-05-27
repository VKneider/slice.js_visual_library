export default class GridDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Metric cards dashboard","expected":"four cards with icons and badges","kind":"script","content":"const cards = await Promise.all([\n  slice.build('Card', { title: 'API Response', text: 'Avg 42ms latency', badge: 'Healthy', variant: 'elevated', icon: { name: 'chart-pie', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Error Rate', text: '0.3% of requests', badge: 'Warning', variant: 'elevated', icon: { name: 'exclamation-circle', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Uptime', text: '99.97% this month', badge: 'Healthy', variant: 'elevated', icon: { name: 'shield-check', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Queue Depth', text: '12 pending jobs', badge: 'Blocked', variant: 'elevated', icon: { name: 'inbox', iconStyle: 'filled' } })\n]);\n\nconst grid = await slice.build('Grid', {\n  columns: 2, rows: 2, gap: '12px',\n  items: cards\n});\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(grid);\nreturn wrapper;"},{"label":"Editor toolbar grid","expected":"grid of icon buttons mimicking an editor toolbar","kind":"script","content":"const tools = [\n  { name: 'letter-bold', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'letter-italic', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'letter-underline', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'align-center', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'list', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'indent', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'code', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'table-column', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'palette', color: { button: '#7c3aed', label: '#ffffff' } },\n  { name: 'search', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'download', color: { button: '#2563eb', label: '#ffffff' } },\n  { name: 'undo', color: { button: '#f59e0b', label: '#ffffff' } }\n];\n\nconst btns = await Promise.all(tools.map(t =>\n  slice.build('Button', { value: '', icon: { name: t.name, iconStyle: 'filled' }, customColor: t.color })\n));\n\nconst grid = await slice.build('Grid', {\n  columns: 6, rows: 2, gap: '6px',\n  items: btns\n});\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;padding:8px;background:color-mix(in srgb,var(--primary-background-color) 98%,var(--primary-color));border-radius:8px;';\nwrapper.appendChild(grid);\nreturn wrapper;"},{"label":"Custom column template","expected":"sidebar + main layout using columnTemplate","kind":"script","content":"const sidebarCard = await slice.build('Card', { title: 'Navigation', text: 'Quick links', variant: 'minimal', icon: { name: 'home', iconStyle: 'filled' }, interactive: false });\nconst linkItems = await Promise.all([\n  slice.build('Button', { value: 'Dashboard', icon: { name: 'grid', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),\n  slice.build('Button', { value: 'Analytics', icon: { name: 'chart-pie', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),\n  slice.build('Button', { value: 'Settings', icon: { name: 'cog', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),\n  slice.build('Button', { value: 'Profile', icon: { name: 'user', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } })\n]);\n\nconst navContainer = document.createElement('div');\nnavContainer.style.cssText = 'display:flex;flex-direction:column;gap:4px;';\nnavContainer.appendChild(sidebarCard);\nlinkItems.forEach(item => navContainer.appendChild(item));\n\nconst mainCard = await slice.build('Card', {\n  title: 'Content Area', text: 'Main panel with detailed information. Cards and other components render naturally inside grid cells.', badge: 'Active', variant: 'elevated', icon: { name: 'file-lines', iconStyle: 'filled' }\n});\n\nconst grid = await slice.build('Grid', {\n  columnTemplate: '220px 1fr', gap: '12px', rows: 1, items: [navContainer, mainCard]\n});\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(grid);\nreturn wrapper;"},{"label":"Dynamic grid update","expected":"items can be replaced by assigning new items array","kind":"script","content":"const icons = ['bell', 'calendar-month', 'rocket', 'bug', 'flag', 'credit-card'];\nconst addCard = async (label, badgeVal) => {\n  const idx = Math.floor(Math.random() * icons.length);\n  return slice.build('Card', { title: label, text: 'Dynamically added item', badge: badgeVal, variant: 'outlined', icon: { name: icons[idx], iconStyle: 'filled' } });\n};\n\nconst initial = await Promise.all([\n  addCard('Task Alpha', 'New'),\n  addCard('Task Beta', 'Active')\n]);\n\nconst grid = await slice.build('Grid', { columns: 2, rows: 2, gap: '10px', items: initial });\n\nconst addBtn = await slice.build('Button', {\n  value: 'Add card', onClickCallback: async () => {\n    const newCard = await addCard('Task ' + Math.random().toString(36).slice(2,5), 'New');\n    const existing = grid.items || [];\n    grid.items = [...existing, newCard];\n  }\n});\n\nconst clearBtn = await slice.build('Button', {\n  value: 'Clear', customColor: { button: '#dc2626', label: '#ffffff' }, onClickCallback: () => {\n    grid.clear();\n    grid.items = [];\n  }\n});\n\nconst toolbar = document.createElement('div');\ntoolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';\ntoolbar.appendChild(addBtn);\ntoolbar.appendChild(clearBtn);\n\nconst host = document.createElement('div');\nhost.appendChild(toolbar);\nhost.appendChild(grid);\nreturn host;"},{"label":"Card variants in grid","expected":"four card variants displayed side by side","kind":"script","content":"const rebuilt = await Promise.all([\n  slice.build('Card', { title: 'Default', text: 'Standard card surface', variant: 'default', icon: { name: 'grid', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Elevated', text: 'Lifted with shadow', variant: 'elevated', icon: { name: 'upload', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Outlined', text: 'Bordered accent', variant: 'outlined', icon: { name: 'close-circle', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Minimal', text: 'Clean no-chrome', variant: 'minimal', icon: { name: 'minus', iconStyle: 'outlined' } })\n]);\n\nconst grid = await slice.build('Grid', { columns: 4, rows: 1, gap: '10px', items: rebuilt });\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(grid);\nreturn wrapper;"}];
  }

  async init() {
    this.markdownPath = "grid.md";
    this.markdownContent = "---\ntitle: Grid\nroute: /docs/layout/grid\nnavLabel: Grid\nsection: Layout\ngroup: Containers\norder: 22\ndescription: Grid component documentation with layout composition scenarios.\ncomponent: GridDocumentation\ngenerate: true\ntags: [grid, layout]\n---\n\n# Grid\n\n## Overview\n`Grid` arranges content in structured rows and columns with configurable templates and spacing.\n\n## Core Behavior\n- `columns` and `rows` define the base matrix.\n- `gap` controls spacing between cells.\n- `items` appends DOM nodes as grid children.\n\n## Basic Usage\n```javascript title=\"Build grid\"\nconst one = document.createElement('div');\none.textContent = 'One';\n\nconst two = document.createElement('div');\ntwo.textContent = 'Two';\n\nconst grid = await slice.build('Grid', {\n  columns: 2,\n  rows: 1,\n  items: [one, two]\n});\n\nthis.appendChild(grid);\n```\n\n## Prop Scenarios\n\n:::script label=\"Metric cards dashboard\" expected=\"four cards with icons and badges\"\nconst cards = await Promise.all([\n  slice.build('Card', { title: 'API Response', text: 'Avg 42ms latency', badge: 'Healthy', variant: 'elevated', icon: { name: 'chart-pie', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Error Rate', text: '0.3% of requests', badge: 'Warning', variant: 'elevated', icon: { name: 'exclamation-circle', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Uptime', text: '99.97% this month', badge: 'Healthy', variant: 'elevated', icon: { name: 'shield-check', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Queue Depth', text: '12 pending jobs', badge: 'Blocked', variant: 'elevated', icon: { name: 'inbox', iconStyle: 'filled' } })\n]);\n\nconst grid = await slice.build('Grid', {\n  columns: 2, rows: 2, gap: '12px',\n  items: cards\n});\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(grid);\nreturn wrapper;\n:::\n\n:::script label=\"Editor toolbar grid\" expected=\"grid of icon buttons mimicking an editor toolbar\"\nconst tools = [\n  { name: 'letter-bold', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'letter-italic', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'letter-underline', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'align-center', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'list', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'indent', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'code', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'table-column', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'palette', color: { button: '#7c3aed', label: '#ffffff' } },\n  { name: 'search', color: { button: '#e2e8f0', label: '#0f172a' } },\n  { name: 'download', color: { button: '#2563eb', label: '#ffffff' } },\n  { name: 'undo', color: { button: '#f59e0b', label: '#ffffff' } }\n];\n\nconst btns = await Promise.all(tools.map(t =>\n  slice.build('Button', { value: '', icon: { name: t.name, iconStyle: 'filled' }, customColor: t.color })\n));\n\nconst grid = await slice.build('Grid', {\n  columns: 6, rows: 2, gap: '6px',\n  items: btns\n});\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;padding:8px;background:color-mix(in srgb,var(--primary-background-color) 98%,var(--primary-color));border-radius:8px;';\nwrapper.appendChild(grid);\nreturn wrapper;\n:::\n\n:::script label=\"Custom column template\" expected=\"sidebar + main layout using columnTemplate\"\nconst sidebarCard = await slice.build('Card', { title: 'Navigation', text: 'Quick links', variant: 'minimal', icon: { name: 'home', iconStyle: 'filled' }, interactive: false });\nconst linkItems = await Promise.all([\n  slice.build('Button', { value: 'Dashboard', icon: { name: 'grid', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),\n  slice.build('Button', { value: 'Analytics', icon: { name: 'chart-pie', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),\n  slice.build('Button', { value: 'Settings', icon: { name: 'cog', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } }),\n  slice.build('Button', { value: 'Profile', icon: { name: 'user', iconStyle: 'filled' }, customColor: { button: 'transparent', label: 'var(--font-secondary-color)' } })\n]);\n\nconst navContainer = document.createElement('div');\nnavContainer.style.cssText = 'display:flex;flex-direction:column;gap:4px;';\nnavContainer.appendChild(sidebarCard);\nlinkItems.forEach(item => navContainer.appendChild(item));\n\nconst mainCard = await slice.build('Card', {\n  title: 'Content Area', text: 'Main panel with detailed information. Cards and other components render naturally inside grid cells.', badge: 'Active', variant: 'elevated', icon: { name: 'file-lines', iconStyle: 'filled' }\n});\n\nconst grid = await slice.build('Grid', {\n  columnTemplate: '220px 1fr', gap: '12px', rows: 1, items: [navContainer, mainCard]\n});\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(grid);\nreturn wrapper;\n:::\n\n:::script label=\"Dynamic grid update\" expected=\"items can be replaced by assigning new items array\"\nconst icons = ['bell', 'calendar-month', 'rocket', 'bug', 'flag', 'credit-card'];\nconst addCard = async (label, badgeVal) => {\n  const idx = Math.floor(Math.random() * icons.length);\n  return slice.build('Card', { title: label, text: 'Dynamically added item', badge: badgeVal, variant: 'outlined', icon: { name: icons[idx], iconStyle: 'filled' } });\n};\n\nconst initial = await Promise.all([\n  addCard('Task Alpha', 'New'),\n  addCard('Task Beta', 'Active')\n]);\n\nconst grid = await slice.build('Grid', { columns: 2, rows: 2, gap: '10px', items: initial });\n\nconst addBtn = await slice.build('Button', {\n  value: 'Add card', onClickCallback: async () => {\n    const newCard = await addCard('Task ' + Math.random().toString(36).slice(2,5), 'New');\n    const existing = grid.items || [];\n    grid.items = [...existing, newCard];\n  }\n});\n\nconst clearBtn = await slice.build('Button', {\n  value: 'Clear', customColor: { button: '#dc2626', label: '#ffffff' }, onClickCallback: () => {\n    grid.clear();\n    grid.items = [];\n  }\n});\n\nconst toolbar = document.createElement('div');\ntoolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';\ntoolbar.appendChild(addBtn);\ntoolbar.appendChild(clearBtn);\n\nconst host = document.createElement('div');\nhost.appendChild(toolbar);\nhost.appendChild(grid);\nreturn host;\n:::\n\n:::script label=\"Card variants in grid\" expected=\"four card variants displayed side by side\"\nconst rebuilt = await Promise.all([\n  slice.build('Card', { title: 'Default', text: 'Standard card surface', variant: 'default', icon: { name: 'grid', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Elevated', text: 'Lifted with shadow', variant: 'elevated', icon: { name: 'upload', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Outlined', text: 'Bordered accent', variant: 'outlined', icon: { name: 'close-circle', iconStyle: 'filled' } }),\n  slice.build('Card', { title: 'Minimal', text: 'Clean no-chrome', variant: 'minimal', icon: { name: 'minus', iconStyle: 'outlined' } })\n]);\n\nconst grid = await slice.build('Grid', { columns: 4, rows: 1, gap: '10px', items: rebuilt });\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(grid);\nreturn wrapper;\n:::\n\n## Best Practices\n:::tip\nUse `gap` to control spacing — default is `10px`. Combine `columnTemplate` with fixed and flexible units (`200px 1fr`) for mixed layouts.\n:::\n\n## Pitfalls\n:::warning\nGrid items must be valid DOM nodes. Strings are not automatically converted. Items array can be replaced at runtime via `grid.items = [...]`.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const one = document.createElement('div');\none.textContent = 'One';\n\nconst two = document.createElement('div');\ntwo.textContent = 'Two';\n\nconst grid = await slice.build('Grid', {\n  columns: 2,\n  rows: 1,\n  items: [one, two]\n});\n\nthis.appendChild(grid);",
               language: "javascript"
            });
            if ("Build grid") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build grid";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"columns\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"gap\",\"type\":\"string\",\"required\":false,\"default\":\"10px\",\"allowedValues\":[]},{\"path\":\"columnTemplate\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"rowTemplate\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"columns\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"gap\",\"type\":\"string\",\"required\":false,\"default\":\"10px\",\"allowedValues\":[]},{\"path\":\"columnTemplate\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"rowTemplate\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-griddocumentation', GridDocumentation);
