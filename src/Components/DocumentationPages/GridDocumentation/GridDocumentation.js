export default class GridDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Metric cards dashboard","expected":"four cards with icons and badges","kind":"script","content":"const cards = await Promise.all([\r\n  slice.build('Card', { title: 'API Response', text: 'Avg 42ms latency', badge: 'Healthy', variant: 'elevated', icon: { name: 'chart-pie', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Error Rate', text: '0.3% of requests', badge: 'Warning', variant: 'elevated', icon: { name: 'exclamation-circle', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Uptime', text: '99.97% this month', badge: 'Healthy', variant: 'elevated', icon: { name: 'shield-check', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Queue Depth', text: '12 pending jobs', badge: 'Blocked', variant: 'elevated', icon: { name: 'inbox', iconStyle: 'filled' } })\r\n]);\r\n\r\nconst grid = await slice.build('Grid', {\r\n  columns: 2, rows: 2, gap: '12px',\r\n  items: cards\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.style.cssText = 'width:100%;';\r\nwrapper.appendChild(grid);\r\nreturn wrapper;"},{"label":"Editor toolbar grid","expected":"grid of icon buttons mimicking an editor toolbar","kind":"script","content":"const tools = [\r\n  { name: 'letter-bold', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'letter-italic', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'letter-underline', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'align-center', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'list', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'indent', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'code', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'table-column', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'palette', color: { background: '#7c3aed', text: '#ffffff' } },\r\n  { name: 'search', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'download', color: { background: '#2563eb', text: '#ffffff' } },\r\n  { name: 'undo', color: { background: '#f59e0b', text: '#ffffff' } }\r\n];\r\n\r\nconst btns = await Promise.all(tools.map(t =>\r\n  slice.build('Button', { value: '', icon: { name: t.name, iconStyle: 'filled' }, customColor: t.color })\r\n));\r\n\r\nconst grid = await slice.build('Grid', {\r\n  columns: 6, rows: 2, gap: '6px',\r\n  items: btns\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.style.cssText = 'width:100%;padding:8px;background:color-mix(in srgb,var(--primary-background-color) 98%,var(--primary-color));border-radius:8px;';\r\nwrapper.appendChild(grid);\r\nreturn wrapper;"},{"label":"Custom column template","expected":"sidebar + main layout using columnTemplate","kind":"script","content":"const sidebarCard = await slice.build('Card', { title: 'Navigation', text: 'Quick links', variant: 'minimal', icon: { name: 'home', iconStyle: 'filled' }, interactive: false });\r\nconst linkItems = await Promise.all([\r\n  slice.build('Button', { value: 'Dashboard', icon: { name: 'grid', iconStyle: 'filled' }, customColor: { background: 'transparent', text: 'var(--font-secondary-color)' } }),\r\n  slice.build('Button', { value: 'Analytics', icon: { name: 'chart-pie', iconStyle: 'filled' }, customColor: { background: 'transparent', text: 'var(--font-secondary-color)' } }),\r\n  slice.build('Button', { value: 'Settings', icon: { name: 'cog', iconStyle: 'filled' }, customColor: { background: 'transparent', text: 'var(--font-secondary-color)' } }),\r\n  slice.build('Button', { value: 'Profile', icon: { name: 'user', iconStyle: 'filled' }, customColor: { background: 'transparent', text: 'var(--font-secondary-color)' } })\r\n]);\r\n\r\nconst navContainer = document.createElement('div');\r\nnavContainer.style.cssText = 'display:flex;flex-direction:column;gap:4px;';\r\nnavContainer.appendChild(sidebarCard);\r\nlinkItems.forEach(item => navContainer.appendChild(item));\r\n\r\nconst mainCard = await slice.build('Card', {\r\n  title: 'Content Area', text: 'Main panel with detailed information. Cards and other components render naturally inside grid cells.', badge: 'Active', variant: 'elevated', icon: { name: 'file-lines', iconStyle: 'filled' }\r\n});\r\n\r\nconst grid = await slice.build('Grid', {\r\n  columnTemplate: '220px 1fr', gap: '12px', rows: 1, items: [navContainer, mainCard]\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.style.cssText = 'width:100%;';\r\nwrapper.appendChild(grid);\r\nreturn wrapper;"},{"label":"Dynamic grid update","expected":"items can be replaced by assigning new items array","kind":"script","content":"const icons = ['bell', 'calendar-month', 'rocket', 'bug', 'flag', 'credit-card'];\r\nconst addCard = async (label, badgeVal) => {\r\n  const idx = Math.floor(Math.random() * icons.length);\r\n  return slice.build('Card', { title: label, text: 'Dynamically added item', badge: badgeVal, variant: 'outlined', icon: { name: icons[idx], iconStyle: 'filled' } });\r\n};\r\n\r\nconst initial = await Promise.all([\r\n  addCard('Task Alpha', 'New'),\r\n  addCard('Task Beta', 'Active')\r\n]);\r\n\r\nconst grid = await slice.build('Grid', { columns: 2, rows: 2, gap: '10px', items: initial });\r\n\r\nconst addBtn = await slice.build('Button', {\r\n  value: 'Add card', onClick: async () => {\r\n    const newCard = await addCard('Task ' + Math.random().toString(36).slice(2,5), 'New');\r\n    const existing = grid.items || [];\r\n    grid.items = [...existing, newCard];\r\n  }\r\n});\r\n\r\nconst clearBtn = await slice.build('Button', {\r\n  value: 'Clear', customColor: { background: '#dc2626', text: '#ffffff' }, onClick: () => {\r\n    grid.clear();\r\n    grid.items = [];\r\n  }\r\n});\r\n\r\nconst toolbar = document.createElement('div');\r\ntoolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';\r\ntoolbar.appendChild(addBtn);\r\ntoolbar.appendChild(clearBtn);\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(toolbar);\r\nhost.appendChild(grid);\r\nreturn host;"},{"label":"Card variants in grid","expected":"four card variants displayed side by side","kind":"script","content":"const rebuilt = await Promise.all([\r\n  slice.build('Card', { title: 'Default', text: 'Standard card surface', variant: 'default', icon: { name: 'grid', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Elevated', text: 'Lifted with shadow', variant: 'elevated', icon: { name: 'upload', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Outlined', text: 'Bordered accent', variant: 'outlined', icon: { name: 'close-circle', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Minimal', text: 'Clean no-chrome', variant: 'minimal', icon: { name: 'minus', iconStyle: 'outlined' } })\r\n]);\r\n\r\nconst grid = await slice.build('Grid', { columns: 4, rows: 1, gap: '10px', items: rebuilt });\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.style.cssText = 'width:100%;';\r\nwrapper.appendChild(grid);\r\nreturn wrapper;"}];
  }

  async init() {
    this.markdownPath = "grid.md";
    this.markdownContent = "---\r\ntitle: Grid\r\nroute: /docs/layout/grid\r\nnavLabel: Grid\r\nsection: Layout\r\ngroup: Containers\r\norder: 22\r\ndescription: Grid component documentation with layout composition scenarios.\r\ncomponent: GridDocumentation\r\ngenerate: true\r\ntags: [grid, layout]\r\n---\r\n\r\n# Grid\r\n\r\n## Overview\r\n`Grid` arranges content in structured rows and columns with configurable templates and spacing.\r\n\r\n## Core Behavior\r\n- `columns` and `rows` define the base matrix.\r\n- `gap` controls spacing between cells.\r\n- `items` appends DOM nodes as grid children.\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"Metric cards dashboard\" expected=\"four cards with icons and badges\"\r\nconst cards = await Promise.all([\r\n  slice.build('Card', { title: 'API Response', text: 'Avg 42ms latency', badge: 'Healthy', variant: 'elevated', icon: { name: 'chart-pie', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Error Rate', text: '0.3% of requests', badge: 'Warning', variant: 'elevated', icon: { name: 'exclamation-circle', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Uptime', text: '99.97% this month', badge: 'Healthy', variant: 'elevated', icon: { name: 'shield-check', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Queue Depth', text: '12 pending jobs', badge: 'Blocked', variant: 'elevated', icon: { name: 'inbox', iconStyle: 'filled' } })\r\n]);\r\n\r\nconst grid = await slice.build('Grid', {\r\n  columns: 2, rows: 2, gap: '12px',\r\n  items: cards\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.style.cssText = 'width:100%;';\r\nwrapper.appendChild(grid);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Editor toolbar grid\" expected=\"grid of icon buttons mimicking an editor toolbar\"\r\nconst tools = [\r\n  { name: 'letter-bold', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'letter-italic', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'letter-underline', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'align-center', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'list', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'indent', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'code', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'table-column', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'palette', color: { background: '#7c3aed', text: '#ffffff' } },\r\n  { name: 'search', color: { background: '#e2e8f0', text: '#0f172a' } },\r\n  { name: 'download', color: { background: '#2563eb', text: '#ffffff' } },\r\n  { name: 'undo', color: { background: '#f59e0b', text: '#ffffff' } }\r\n];\r\n\r\nconst btns = await Promise.all(tools.map(t =>\r\n  slice.build('Button', { value: '', icon: { name: t.name, iconStyle: 'filled' }, customColor: t.color })\r\n));\r\n\r\nconst grid = await slice.build('Grid', {\r\n  columns: 6, rows: 2, gap: '6px',\r\n  items: btns\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.style.cssText = 'width:100%;padding:8px;background:color-mix(in srgb,var(--primary-background-color) 98%,var(--primary-color));border-radius:8px;';\r\nwrapper.appendChild(grid);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Custom column template\" expected=\"sidebar + main layout using columnTemplate\"\r\nconst sidebarCard = await slice.build('Card', { title: 'Navigation', text: 'Quick links', variant: 'minimal', icon: { name: 'home', iconStyle: 'filled' }, interactive: false });\r\nconst linkItems = await Promise.all([\r\n  slice.build('Button', { value: 'Dashboard', icon: { name: 'grid', iconStyle: 'filled' }, customColor: { background: 'transparent', text: 'var(--font-secondary-color)' } }),\r\n  slice.build('Button', { value: 'Analytics', icon: { name: 'chart-pie', iconStyle: 'filled' }, customColor: { background: 'transparent', text: 'var(--font-secondary-color)' } }),\r\n  slice.build('Button', { value: 'Settings', icon: { name: 'cog', iconStyle: 'filled' }, customColor: { background: 'transparent', text: 'var(--font-secondary-color)' } }),\r\n  slice.build('Button', { value: 'Profile', icon: { name: 'user', iconStyle: 'filled' }, customColor: { background: 'transparent', text: 'var(--font-secondary-color)' } })\r\n]);\r\n\r\nconst navContainer = document.createElement('div');\r\nnavContainer.style.cssText = 'display:flex;flex-direction:column;gap:4px;';\r\nnavContainer.appendChild(sidebarCard);\r\nlinkItems.forEach(item => navContainer.appendChild(item));\r\n\r\nconst mainCard = await slice.build('Card', {\r\n  title: 'Content Area', text: 'Main panel with detailed information. Cards and other components render naturally inside grid cells.', badge: 'Active', variant: 'elevated', icon: { name: 'file-lines', iconStyle: 'filled' }\r\n});\r\n\r\nconst grid = await slice.build('Grid', {\r\n  columnTemplate: '220px 1fr', gap: '12px', rows: 1, items: [navContainer, mainCard]\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.style.cssText = 'width:100%;';\r\nwrapper.appendChild(grid);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Dynamic grid update\" expected=\"items can be replaced by assigning new items array\"\r\nconst icons = ['bell', 'calendar-month', 'rocket', 'bug', 'flag', 'credit-card'];\r\nconst addCard = async (label, badgeVal) => {\r\n  const idx = Math.floor(Math.random() * icons.length);\r\n  return slice.build('Card', { title: label, text: 'Dynamically added item', badge: badgeVal, variant: 'outlined', icon: { name: icons[idx], iconStyle: 'filled' } });\r\n};\r\n\r\nconst initial = await Promise.all([\r\n  addCard('Task Alpha', 'New'),\r\n  addCard('Task Beta', 'Active')\r\n]);\r\n\r\nconst grid = await slice.build('Grid', { columns: 2, rows: 2, gap: '10px', items: initial });\r\n\r\nconst addBtn = await slice.build('Button', {\r\n  value: 'Add card', onClick: async () => {\r\n    const newCard = await addCard('Task ' + Math.random().toString(36).slice(2,5), 'New');\r\n    const existing = grid.items || [];\r\n    grid.items = [...existing, newCard];\r\n  }\r\n});\r\n\r\nconst clearBtn = await slice.build('Button', {\r\n  value: 'Clear', customColor: { background: '#dc2626', text: '#ffffff' }, onClick: () => {\r\n    grid.clear();\r\n    grid.items = [];\r\n  }\r\n});\r\n\r\nconst toolbar = document.createElement('div');\r\ntoolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';\r\ntoolbar.appendChild(addBtn);\r\ntoolbar.appendChild(clearBtn);\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(toolbar);\r\nhost.appendChild(grid);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"Card variants in grid\" expected=\"four card variants displayed side by side\"\r\nconst rebuilt = await Promise.all([\r\n  slice.build('Card', { title: 'Default', text: 'Standard card surface', variant: 'default', icon: { name: 'grid', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Elevated', text: 'Lifted with shadow', variant: 'elevated', icon: { name: 'upload', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Outlined', text: 'Bordered accent', variant: 'outlined', icon: { name: 'close-circle', iconStyle: 'filled' } }),\r\n  slice.build('Card', { title: 'Minimal', text: 'Clean no-chrome', variant: 'minimal', icon: { name: 'minus', iconStyle: 'outlined' } })\r\n]);\r\n\r\nconst grid = await slice.build('Grid', { columns: 4, rows: 1, gap: '10px', items: rebuilt });\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.style.cssText = 'width:100%;';\r\nwrapper.appendChild(grid);\r\nreturn wrapper;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nUse `gap` to control spacing — default is `10px`. Combine `columnTemplate` with fixed and flexible units (`200px 1fr`) for mixed layouts.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nGrid items must be valid DOM nodes. Strings are not automatically converted. Items array can be replaced at runtime via `grid.items = [...]`.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
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

      // Render where the author put the :::script blocks.
      //
      // The markdown parser already emits one <div class="script-block"> at the
      // position of each block, in document order, and those divs come from the same
      // parse as this.scriptScenarios — so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all — the divs
      // were never filled, nothing in the repo reads .script-block — the real demos were
      // exiled below the props table, and 38 of 53 pages showed the heading twice.
      const blocks = [...this.querySelectorAll('.script-block')];
      const inPlace = blocks.length === this.scriptScenarios.length;

      const section = document.createElement('section');
      if (!inPlace) {
         // Fallback, kept so a future parser change that desyncs the two cannot
         // silently drop every demo. An author-placed heading already exists in the
         // in-place case, so only invent one when we are building the section.
         section.classList.add('doc-script-scenarios');

         const title = document.createElement('h2');
         title.textContent = 'Prop Scenarios';
         section.appendChild(title);

         const subtitle = document.createElement('p');
         subtitle.classList.add('doc-script-subtitle');
         subtitle.textContent = 'Interactive demos validating component behavior.';
         section.appendChild(subtitle);
      }
      for (const [index, scenario] of this.scriptScenarios.entries()) {
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
      (inPlace ? blocks[index] : section).appendChild(demobox);
      demobox.appendCode(code);
      (inPlace ? blocks[index] : section).appendChild(errorMessage);

      await executeScenario();
    }
      if (!inPlace) host.appendChild(section);
  }
}

customElements.define('slice-griddocumentation', GridDocumentation);
