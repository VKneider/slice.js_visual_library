export default class TableDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Table with data","expected":"renders table with headers and three rows","kind":"script","content":"const table = await slice.build('Table', {\n  headers: ['Feature', 'Version', 'Release'],\n  rows: [\n    ['Card component', '1.0.0', '2026-01-15'],\n    ['Route sync', '1.0.1', '2026-02-01'],\n    ['Tabs component', '1.1.0', '2026-03-10']\n  ]\n});\n\nreturn table;"},{"label":"Rich cells (DOM nodes + trusted HTML)","expected":"cells hold real components and opt-in HTML; plain strings stay escaped","kind":"script","content":"const viewBtn = await slice.build('Button', { value: 'View' });\nconst installBtn = await slice.build('Button', { value: 'Install' });\n\nconst table = await slice.build('Table', {\n  headers: ['Package', 'Status', 'Action'],\n  rows: [\n    // { html } is an explicit opt-in for TRUSTED markup; plain strings are escaped.\n    ['slice.js',  { html: '<span style=\"color:var(--success-color)\">Published</span>' }, viewBtn],\n    ['slice-cli', { html: '<span style=\"color:var(--primary-color)\">Beta</span>' }, installBtn]\n  ]\n});\n\nreturn table;"},{"label":"Sortable + paginated","expected":"sortable columns, 5 rows per page, with a pager","kind":"script","content":"const people = Array.from({ length: 23 }, (_, i) => ({\n  name: 'Person ' + String(i + 1).padStart(2, '0'),\n  age: 20 + ((i * 7) % 40)\n}));\n\nconst table = await slice.build('Table', {\n  columns: [\n    { key: 'name', label: 'Name', sortable: true },\n    { key: 'age',  label: 'Age',  sortable: true, align: 'right' }\n  ],\n  rows: people,\n  pagination: { pageSize: 5 },\n  defaultSort: { key: 'name', direction: 'asc' }\n});\n\nreturn table;"}];
  }

  async init() {
    this.markdownPath = "table.md";
    this.markdownContent = "---\ntitle: Table\nroute: /docs/data/table\nnavLabel: Table\nsection: Data\ngroup: Tables\norder: 10\ndescription: Table documentation with header and row rendering scenarios.\ncomponent: TableDocumentation\ngenerate: true\ntags: [table, data, display]\n---\n\n# Table\n\n## Overview\n`Table` renders a structured HTML table from `headers` and `rows` arrays. Responsive by default with label-based cell display on narrow viewports.\n\n## API and Behavior\n- `headers` (array of strings) defines the table header row (rendered as `<th scope=\"col\">`).\n- `rows` (array of arrays) defines data rows. Each cell can be:\n  - a **string / number** → rendered as text (escaped, safe by default),\n  - a **DOM node** (e.g. a built component) → appended as-is,\n  - `{ html: '<...>' }` → explicit opt-in for **trusted** raw HTML.\n- Both props are reactive: changes trigger a full re-render.\n- Empty arrays render no table content.\n\n## Columns, sorting and pagination\nFor richer tables, use `columns` instead of `headers` — an array of column descriptors. Rows can then\nbe **objects** keyed by `key` (positional `headers` + array rows still work as before).\n\n- `columns`: `[{ key, label, sortable, align, render }]`.\n  - `key` — property to read from each row object (or column index for array rows).\n  - `label` — header text. `align` — `'left' | 'center' | 'right'`.\n  - `sortable` — make the column clickable to sort. `render(row)` — return a string / DOM node / `{ html }` for custom cells.\n- `sortable` (boolean) — default sortability for every column when not set per-column.\n- `defaultSort` — `{ key, direction: 'asc' | 'desc' }` applied on first render.\n- `pagination` — `true` or `{ pageSize }` to page the rows (renders a `Pagination` control). Reactive:\n  it can be turned on/off or resized at runtime — the pager is shown/hidden and the page size updated,\n  never destroyed and rebuilt.\n- `emptyMessage` — text shown when there are columns but no rows.\n- `onSortChange({ key, direction } | null)` and `onPageChange(page)` — fire on each change.\n\nClicking a sortable header cycles **ascending → descending → unsorted**, and sorting returns to page 1.\nSortable headers are keyboard-operable: they are focusable (`tabindex=\"0\"`) and respond to **Enter** /\n**Space**, with `aria-sort` kept in sync.\n\n- `loading` (boolean) — shows a self-contained busy overlay (a CSS spinner, no dependency on the\n  `Loading` component) and sets `aria-busy`. Drive it yourself in remote mode: set `true` before\n  fetching a page, `false` when the new `rows` are in.\n\n## Local vs remote data (`dataSource`)\n- **`'local'`** (default): you give the table **all** the rows; it sorts and paginates them itself.\n- **`'remote'`**: `rows` is just the **current page** (already sorted/sliced upstream, e.g. by a server).\n  The table renders it as-is, tracks the page/sort state, and **emits** `onSortChange` / `onPageChange`\n  so you can fetch the next slice. Provide `totalItems` so the pager can compute the page count.\n\nIn remote mode the table never re-orders or slices your rows — supplying the next page is your job.\n\n## Live Preview\n:::component name=\"Table\"\n{\n  \"headers\": [\n    \"Name\",\n    \"Role\",\n    \"Status\"\n  ],\n  \"rows\": [\n    [\n      \"Alice\",\n      \"Engineer\",\n      \"Active\"\n    ],\n    [\n      \"Bob\",\n      \"Designer\",\n      \"Away\"\n    ],\n    [\n      \"Carol\",\n      \"Manager\",\n      \"Active\"\n    ]\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"Table with data\" expected=\"renders table with headers and three rows\"\nconst table = await slice.build('Table', {\n  headers: ['Feature', 'Version', 'Release'],\n  rows: [\n    ['Card component', '1.0.0', '2026-01-15'],\n    ['Route sync', '1.0.1', '2026-02-01'],\n    ['Tabs component', '1.1.0', '2026-03-10']\n  ]\n});\n\nreturn table;\n:::\n\n:::script label=\"Rich cells (DOM nodes + trusted HTML)\" expected=\"cells hold real components and opt-in HTML; plain strings stay escaped\"\nconst viewBtn = await slice.build('Button', { value: 'View' });\nconst installBtn = await slice.build('Button', { value: 'Install' });\n\nconst table = await slice.build('Table', {\n  headers: ['Package', 'Status', 'Action'],\n  rows: [\n    // { html } is an explicit opt-in for TRUSTED markup; plain strings are escaped.\n    ['slice.js',  { html: '<span style=\"color:var(--success-color)\">Published</span>' }, viewBtn],\n    ['slice-cli', { html: '<span style=\"color:var(--primary-color)\">Beta</span>' }, installBtn]\n  ]\n});\n\nreturn table;\n:::\n\n:::script label=\"Sortable + paginated\" expected=\"sortable columns, 5 rows per page, with a pager\"\nconst people = Array.from({ length: 23 }, (_, i) => ({\n  name: 'Person ' + String(i + 1).padStart(2, '0'),\n  age: 20 + ((i * 7) % 40)\n}));\n\nconst table = await slice.build('Table', {\n  columns: [\n    { key: 'name', label: 'Name', sortable: true },\n    { key: 'age',  label: 'Age',  sortable: true, align: 'right' }\n  ],\n  rows: people,\n  pagination: { pageSize: 5 },\n  defaultSort: { key: 'name', direction: 'asc' }\n});\n\nreturn table;\n:::\n\n## Best Practices\n:::tip\nKeep row data uniform in length. Mismatched columns may produce uneven layout.\n:::\n\n## Pitfalls\n:::warning\nPlain string cells are escaped, so user data is safe by default. Only the explicit `{ html: '...' }` form is injected as raw HTML — never pass unsanitized user input through it.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"headers\": [\n    \"Name\",\n    \"Role\",\n    \"Status\"\n  ],\n  \"rows\": [\n    [\n      \"Alice\",\n      \"Engineer\",\n      \"Active\"\n    ],\n    [\n      \"Bob\",\n      \"Designer\",\n      \"Away\"\n    ],\n    [\n      \"Carol\",\n      \"Manager\",\n      \"Active\"\n    ]\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"headers\": [\n    \"Name\",\n    \"Role\",\n    \"Status\"\n  ],\n  \"rows\": [\n    [\n      \"Alice\",\n      \"Engineer\",\n      \"Active\"\n    ],\n    [\n      \"Bob\",\n      \"Designer\",\n      \"Away\"\n    ],\n    [\n      \"Carol\",\n      \"Manager\",\n      \"Active\"\n    ]\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Table', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"headers\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"sortable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"defaultSort\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pagination\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"dataSource\",\"type\":\"string\",\"required\":false,\"default\":\"local\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"emptyMessage\",\"type\":\"string\",\"required\":false,\"default\":\"No data\",\"allowedValues\":[]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onSortChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"headers\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"sortable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"defaultSort\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pagination\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"dataSource\",\"type\":\"string\",\"required\":false,\"default\":\"local\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"emptyMessage\",\"type\":\"string\",\"required\":false,\"default\":\"No data\",\"allowedValues\":[]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onSortChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-tabledocumentation', TableDocumentation);
