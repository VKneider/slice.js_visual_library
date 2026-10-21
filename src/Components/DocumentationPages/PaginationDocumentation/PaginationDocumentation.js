export default class PaginationDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Controlled pager","expected":"clicking a page moves the active page","kind":"script","content":"let page = 1;\r\nconst pager = await slice.build('Pagination', {\r\n  currentPage: page,\r\n  totalPages: 12,\r\n  showFirstLast: true,\r\n  onPageChange: (p) => { page = p; pager.currentPage = p; }\r\n});\r\n\r\nreturn pager;"},{"label":"Paginated item list","expected":"clicking pages shows different items on each page","kind":"script","content":"const items = Array.from({ length: 36 }, (_, i) => `Item ${String(i + 1).padStart(2, '0')}`);\r\nconst pageSize = 6;\r\nlet page = 1;\r\n\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexDirection = 'column';\r\ncontainer.style.gap = '12px';\r\n\r\nconst list = document.createElement('div');\r\nlist.style.display = 'flex';\r\nlist.style.flexDirection = 'column';\r\nlist.style.gap = '4px';\r\nlist.style.padding = '12px';\r\nlist.style.background = 'var(--color-surface, #f0f0f0)';\r\nlist.style.borderRadius = '8px';\r\nlist.style.minHeight = '160px';\r\nlist.style.fontFamily = 'monospace';\r\n\r\nfunction renderList() {\r\n  list.innerHTML = '';\r\n  const start = (page - 1) * pageSize;\r\n  const end = Math.min(start + pageSize, items.length);\r\n  for (let i = start; i < end; i++) {\r\n    const el = document.createElement('div');\r\n    el.textContent = items[i];\r\n    el.style.padding = '6px 10px';\r\n    el.style.background = 'var(--color-background, #fff)';\r\n    el.style.borderRadius = '4px';\r\n    el.style.border = '1px solid var(--color-border, #ddd)';\r\n    list.appendChild(el);\r\n  }\r\n}\r\nrenderList();\r\n\r\nconst pager = await slice.build('Pagination', {\r\n  currentPage: page,\r\n  totalPages: Math.ceil(items.length / pageSize),\r\n  showFirstLast: true,\r\n  onPageChange: (p) => { page = p; pager.currentPage = p; renderList(); }\r\n});\r\n\r\ncontainer.appendChild(list);\r\ncontainer.appendChild(pager);\r\nreturn container;"},{"label":"Custom siblings and boundaries","expected":"shows more pages around the current one and pinned edges","kind":"script","content":"const pager = await slice.build('Pagination', {\r\n  currentPage: 10,\r\n  totalPages: 30,\r\n  siblingCount: 2,\r\n  boundaryCount: 2,\r\n  showFirstLast: true,\r\n  onPageChange: (p) => { pager.currentPage = p; }\r\n});\r\nreturn pager;"},{"label":"First and last buttons","expected":"quick-jump controls are visible at both ends","kind":"script","content":"const pager = await slice.build('Pagination', {\r\n  currentPage: 7,\r\n  totalPages: 15,\r\n  showFirstLast: true,\r\n  onPageChange: (p) => { pager.currentPage = p; }\r\n});\r\nreturn pager;"},{"label":"Disabled pager","expected":"buttons are visible but not clickable","kind":"script","content":"const pager = await slice.build('Pagination', {\r\n  currentPage: 5,\r\n  totalPages: 10,\r\n  disabled: true,\r\n  onPageChange: (p) => { pager.currentPage = p; }\r\n});\r\nreturn pager;"}];
  }

  async init() {
    this.markdownPath = "pagination.md";
    this.markdownContent = "---\r\ntitle: Pagination\r\nroute: /docs/data/pagination\r\nnavLabel: Pagination\r\nsection: Data\r\ngroup: Tables\r\norder: 11\r\ndescription: A controlled page navigator with ellipsis ranges, reusable on its own or via Table.\r\ncomponent: PaginationDocumentation\r\ngenerate: true\r\ntags: [pagination, navigation, data]\r\n---\r\n\r\n# Pagination\r\n\r\n## Overview\r\n`Pagination` is a **controlled** page navigator. It holds no page state of its own: you pass the\r\n`currentPage`, and on a click it calls `onPageChange(page)` — you then update `currentPage` to move it.\r\nUse it on its own for lists and search results, or let [`Table`](/docs/data/table) compose it for you.\r\n\r\n## API and Behavior\r\n- `currentPage` (number) — the active page (you own this value).\r\n- `totalPages` (number) — total number of pages.\r\n- `siblingCount` (number, default `1`) — pages shown on each side of the current page.\r\n- `boundaryCount` (number, default `1`) — pages always shown at the start/end.\r\n- `showFirstLast` (boolean, default `false`) — render «first / last» controls.\r\n- `disabled` (boolean) — blocks navigation.\r\n- `onPageChange(page)` — called with the requested page (never the current one).\r\n\r\nLarge ranges collapse with an ellipsis, e.g. `1 … 9 10 11 … 20`. Because it is controlled, clicking a\r\npage does **not** move it until you set `currentPage` — this keeps it in sync with whatever owns the data.\r\n\r\n## Prop Scenarios\r\n:::script label=\"Controlled pager\" expected=\"clicking a page moves the active page\"\r\nlet page = 1;\r\nconst pager = await slice.build('Pagination', {\r\n  currentPage: page,\r\n  totalPages: 12,\r\n  showFirstLast: true,\r\n  onPageChange: (p) => { page = p; pager.currentPage = p; }\r\n});\r\n\r\nreturn pager;\r\n:::\r\n\r\n:::script label=\"Paginated item list\" expected=\"clicking pages shows different items on each page\"\r\nconst items = Array.from({ length: 36 }, (_, i) => `Item ${String(i + 1).padStart(2, '0')}`);\r\nconst pageSize = 6;\r\nlet page = 1;\r\n\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexDirection = 'column';\r\ncontainer.style.gap = '12px';\r\n\r\nconst list = document.createElement('div');\r\nlist.style.display = 'flex';\r\nlist.style.flexDirection = 'column';\r\nlist.style.gap = '4px';\r\nlist.style.padding = '12px';\r\nlist.style.background = 'var(--color-surface, #f0f0f0)';\r\nlist.style.borderRadius = '8px';\r\nlist.style.minHeight = '160px';\r\nlist.style.fontFamily = 'monospace';\r\n\r\nfunction renderList() {\r\n  list.innerHTML = '';\r\n  const start = (page - 1) * pageSize;\r\n  const end = Math.min(start + pageSize, items.length);\r\n  for (let i = start; i < end; i++) {\r\n    const el = document.createElement('div');\r\n    el.textContent = items[i];\r\n    el.style.padding = '6px 10px';\r\n    el.style.background = 'var(--color-background, #fff)';\r\n    el.style.borderRadius = '4px';\r\n    el.style.border = '1px solid var(--color-border, #ddd)';\r\n    list.appendChild(el);\r\n  }\r\n}\r\nrenderList();\r\n\r\nconst pager = await slice.build('Pagination', {\r\n  currentPage: page,\r\n  totalPages: Math.ceil(items.length / pageSize),\r\n  showFirstLast: true,\r\n  onPageChange: (p) => { page = p; pager.currentPage = p; renderList(); }\r\n});\r\n\r\ncontainer.appendChild(list);\r\ncontainer.appendChild(pager);\r\nreturn container;\r\n:::\r\n\r\n:::script label=\"Custom siblings and boundaries\" expected=\"shows more pages around the current one and pinned edges\"\r\nconst pager = await slice.build('Pagination', {\r\n  currentPage: 10,\r\n  totalPages: 30,\r\n  siblingCount: 2,\r\n  boundaryCount: 2,\r\n  showFirstLast: true,\r\n  onPageChange: (p) => { pager.currentPage = p; }\r\n});\r\nreturn pager;\r\n:::\r\n\r\n:::script label=\"First and last buttons\" expected=\"quick-jump controls are visible at both ends\"\r\nconst pager = await slice.build('Pagination', {\r\n  currentPage: 7,\r\n  totalPages: 15,\r\n  showFirstLast: true,\r\n  onPageChange: (p) => { pager.currentPage = p; }\r\n});\r\nreturn pager;\r\n:::\r\n\r\n:::script label=\"Disabled pager\" expected=\"buttons are visible but not clickable\"\r\nconst pager = await slice.build('Pagination', {\r\n  currentPage: 5,\r\n  totalPages: 10,\r\n  disabled: true,\r\n  onPageChange: (p) => { pager.currentPage = p; }\r\n});\r\nreturn pager;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nKeep the page number in the parent (or in a `DataGridEngine`) and treat `Pagination` as a pure view.\r\nFor tables, prefer `Table`'s built-in `pagination` prop over wiring this by hand.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nIt is **controlled**: if you never update `currentPage` in your `onPageChange` handler, the pager will\r\nappear stuck. That is by design — the owner of the data decides when the page actually changes.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"currentPage\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"totalPages\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"siblingCount\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"boundaryCount\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"showFirstLast\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"currentPage\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"totalPages\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"siblingCount\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"boundaryCount\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"showFirstLast\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-paginationdocumentation', PaginationDocumentation);
