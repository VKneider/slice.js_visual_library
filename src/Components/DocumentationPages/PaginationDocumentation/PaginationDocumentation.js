export default class PaginationDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Controlled pager","expected":"clicking a page moves the active page","kind":"script","content":"let page = 1;\nconst pager = await slice.build('Pagination', {\n  currentPage: page,\n  totalPages: 12,\n  showFirstLast: true,\n  onPageChange: (p) => { page = p; pager.currentPage = p; }\n});\n\nreturn pager;"},{"label":"Paginated item list","expected":"clicking pages shows different items on each page","kind":"script","content":"const items = Array.from({ length: 36 }, (_, i) => `Item ${String(i + 1).padStart(2, '0')}`);\nconst pageSize = 6;\nlet page = 1;\n\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexDirection = 'column';\ncontainer.style.gap = '12px';\n\nconst list = document.createElement('div');\nlist.style.display = 'flex';\nlist.style.flexDirection = 'column';\nlist.style.gap = '4px';\nlist.style.padding = '12px';\nlist.style.background = 'var(--color-surface, #f0f0f0)';\nlist.style.borderRadius = '8px';\nlist.style.minHeight = '160px';\nlist.style.fontFamily = 'monospace';\n\nfunction renderList() {\n  list.innerHTML = '';\n  const start = (page - 1) * pageSize;\n  const end = Math.min(start + pageSize, items.length);\n  for (let i = start; i < end; i++) {\n    const el = document.createElement('div');\n    el.textContent = items[i];\n    el.style.padding = '6px 10px';\n    el.style.background = 'var(--color-background, #fff)';\n    el.style.borderRadius = '4px';\n    el.style.border = '1px solid var(--color-border, #ddd)';\n    list.appendChild(el);\n  }\n}\nrenderList();\n\nconst pager = await slice.build('Pagination', {\n  currentPage: page,\n  totalPages: Math.ceil(items.length / pageSize),\n  showFirstLast: true,\n  onPageChange: (p) => { page = p; pager.currentPage = p; renderList(); }\n});\n\ncontainer.appendChild(list);\ncontainer.appendChild(pager);\nreturn container;"},{"label":"Custom siblings and boundaries","expected":"shows more pages around the current one and pinned edges","kind":"script","content":"const pager = await slice.build('Pagination', {\n  currentPage: 10,\n  totalPages: 30,\n  siblingCount: 2,\n  boundaryCount: 2,\n  showFirstLast: true,\n  onPageChange: (p) => { pager.currentPage = p; }\n});\nreturn pager;"},{"label":"First and last buttons","expected":"quick-jump controls are visible at both ends","kind":"script","content":"const pager = await slice.build('Pagination', {\n  currentPage: 7,\n  totalPages: 15,\n  showFirstLast: true,\n  onPageChange: (p) => { pager.currentPage = p; }\n});\nreturn pager;"},{"label":"Disabled pager","expected":"buttons are visible but not clickable","kind":"script","content":"const pager = await slice.build('Pagination', {\n  currentPage: 5,\n  totalPages: 10,\n  disabled: true,\n  onPageChange: (p) => { pager.currentPage = p; }\n});\nreturn pager;"}];
  }

  async init() {
    this.markdownPath = "pagination.md";
    this.markdownContent = "---\ntitle: Pagination\nroute: /docs/data/pagination\nnavLabel: Pagination\nsection: Data\ngroup: Tables\norder: 11\ndescription: A controlled page navigator with ellipsis ranges, reusable on its own or via Table.\ncomponent: PaginationDocumentation\ngenerate: true\ntags: [pagination, navigation, data]\n---\n\n# Pagination\n\n## Overview\n`Pagination` is a **controlled** page navigator. It holds no page state of its own: you pass the\n`currentPage`, and on a click it calls `onPageChange(page)` — you then update `currentPage` to move it.\nUse it on its own for lists and search results, or let [`Table`](/docs/data/table) compose it for you.\n\n## API and Behavior\n- `currentPage` (number) — the active page (you own this value).\n- `totalPages` (number) — total number of pages.\n- `siblingCount` (number, default `1`) — pages shown on each side of the current page.\n- `boundaryCount` (number, default `1`) — pages always shown at the start/end.\n- `showFirstLast` (boolean, default `false`) — render «first / last» controls.\n- `disabled` (boolean) — blocks navigation.\n- `onPageChange(page)` — called with the requested page (never the current one).\n\nLarge ranges collapse with an ellipsis, e.g. `1 … 9 10 11 … 20`. Because it is controlled, clicking a\npage does **not** move it until you set `currentPage` — this keeps it in sync with whatever owns the data.\n\n## Prop Scenarios\n:::script label=\"Controlled pager\" expected=\"clicking a page moves the active page\"\nlet page = 1;\nconst pager = await slice.build('Pagination', {\n  currentPage: page,\n  totalPages: 12,\n  showFirstLast: true,\n  onPageChange: (p) => { page = p; pager.currentPage = p; }\n});\n\nreturn pager;\n:::\n\n:::script label=\"Paginated item list\" expected=\"clicking pages shows different items on each page\"\nconst items = Array.from({ length: 36 }, (_, i) => `Item ${String(i + 1).padStart(2, '0')}`);\nconst pageSize = 6;\nlet page = 1;\n\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexDirection = 'column';\ncontainer.style.gap = '12px';\n\nconst list = document.createElement('div');\nlist.style.display = 'flex';\nlist.style.flexDirection = 'column';\nlist.style.gap = '4px';\nlist.style.padding = '12px';\nlist.style.background = 'var(--color-surface, #f0f0f0)';\nlist.style.borderRadius = '8px';\nlist.style.minHeight = '160px';\nlist.style.fontFamily = 'monospace';\n\nfunction renderList() {\n  list.innerHTML = '';\n  const start = (page - 1) * pageSize;\n  const end = Math.min(start + pageSize, items.length);\n  for (let i = start; i < end; i++) {\n    const el = document.createElement('div');\n    el.textContent = items[i];\n    el.style.padding = '6px 10px';\n    el.style.background = 'var(--color-background, #fff)';\n    el.style.borderRadius = '4px';\n    el.style.border = '1px solid var(--color-border, #ddd)';\n    list.appendChild(el);\n  }\n}\nrenderList();\n\nconst pager = await slice.build('Pagination', {\n  currentPage: page,\n  totalPages: Math.ceil(items.length / pageSize),\n  showFirstLast: true,\n  onPageChange: (p) => { page = p; pager.currentPage = p; renderList(); }\n});\n\ncontainer.appendChild(list);\ncontainer.appendChild(pager);\nreturn container;\n:::\n\n:::script label=\"Custom siblings and boundaries\" expected=\"shows more pages around the current one and pinned edges\"\nconst pager = await slice.build('Pagination', {\n  currentPage: 10,\n  totalPages: 30,\n  siblingCount: 2,\n  boundaryCount: 2,\n  showFirstLast: true,\n  onPageChange: (p) => { pager.currentPage = p; }\n});\nreturn pager;\n:::\n\n:::script label=\"First and last buttons\" expected=\"quick-jump controls are visible at both ends\"\nconst pager = await slice.build('Pagination', {\n  currentPage: 7,\n  totalPages: 15,\n  showFirstLast: true,\n  onPageChange: (p) => { pager.currentPage = p; }\n});\nreturn pager;\n:::\n\n:::script label=\"Disabled pager\" expected=\"buttons are visible but not clickable\"\nconst pager = await slice.build('Pagination', {\n  currentPage: 5,\n  totalPages: 10,\n  disabled: true,\n  onPageChange: (p) => { pager.currentPage = p; }\n});\nreturn pager;\n:::\n\n## Best Practices\n:::tip\nKeep the page number in the parent (or in a `DataGridEngine`) and treat `Pagination` as a pure view.\nFor tables, prefer `Table`'s built-in `pagination` prop over wiring this by hand.\n:::\n\n## Pitfalls\n:::warning\nIt is **controlled**: if you never update `currentPage` in your `onPageChange` handler, the pager will\nappear stuck. That is by design — the owner of the data decides when the page actually changes.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
    // No dynamic blocks
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

customElements.define('slice-paginationdocumentation', PaginationDocumentation);
