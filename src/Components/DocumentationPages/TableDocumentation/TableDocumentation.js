export default class TableDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Table with data","expected":"renders table with headers and three rows","kind":"script","content":"const table = await slice.build('Table', {\r\n  headers: ['Feature', 'Version', 'Release'],\r\n  rows: [\r\n    ['Card component', '1.0.0', '2026-01-15'],\r\n    ['Route sync', '1.0.1', '2026-02-01'],\r\n    ['Tabs component', '1.1.0', '2026-03-10']\r\n  ]\r\n});\r\n\r\nreturn table;"},{"label":"Rich cells (DOM nodes + trusted HTML)","expected":"cells hold real components and opt-in HTML; plain strings stay escaped","kind":"script","content":"const viewBtn = await slice.build('Button', { value: 'View' });\r\nconst installBtn = await slice.build('Button', { value: 'Install' });\r\n\r\nconst table = await slice.build('Table', {\r\n  headers: ['Package', 'Status', 'Action'],\r\n  rows: [\r\n    // { html } is an explicit opt-in for TRUSTED markup; plain strings are escaped.\r\n    ['slice.js',  { html: '<span style=\"color:var(--success-color)\">Published</span>' }, viewBtn],\r\n    ['slice-cli', { html: '<span style=\"color:var(--primary-color)\">Beta</span>' }, installBtn]\r\n  ]\r\n});\r\n\r\nreturn table;"},{"label":"Sortable + paginated","expected":"sortable columns, 5 rows per page, with a pager","kind":"script","content":"const people = Array.from({ length: 23 }, (_, i) => ({\r\n  name: 'Person ' + String(i + 1).padStart(2, '0'),\r\n  age: 20 + ((i * 7) % 40)\r\n}));\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Name', sortable: true },\r\n    { key: 'age',  label: 'Age',  sortable: true, align: 'right' }\r\n  ],\r\n  rows: people,\r\n  pagination: { pageSize: 5 },\r\n  defaultSort: { key: 'name', direction: 'asc' }\r\n});\r\n\r\nreturn table;"},{"label":"Header variants","expected":"three tables; solid reproduces the legacy look","kind":"script","content":"const solid = await slice.build('Table', {\r\n  headers: ['Name', 'Role'],\r\n  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],\r\n  headerVariant: 'solid'\r\n});\r\n\r\nconst plain = await slice.build('Table', {\r\n  headers: ['Name', 'Role'],\r\n  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],\r\n  headerVariant: 'none'\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.append(solid, plain);\r\nreturn wrapper;"},{"label":"Numbers align themselves","expected":"the Score column is right-aligned with tabular digits","kind":"script","content":"const table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Player' },\r\n    { key: 'score', label: 'Score' }\r\n  ],\r\n  rows: [\r\n    { name: 'Ada', score: 1280 },\r\n    { name: 'Linus', score: 9953 },\r\n    { name: 'Grace', score: 340 }\r\n  ]\r\n});\r\n\r\nreturn table;"}];
  }

  async init() {
    this.markdownPath = "table.md";
    this.markdownContent = "---\r\ntitle: Table\r\nroute: /docs/data/table\r\nnavLabel: Table\r\nsection: Data\r\ngroup: Tables\r\norder: 10\r\ndescription: Table documentation with header and row rendering scenarios.\r\ncomponent: TableDocumentation\r\ngenerate: true\r\ntags: [table, data, display]\r\n---\r\n\r\n# Table\r\n\r\n## Overview\r\n`Table` renders a structured HTML table from `headers` and `rows` arrays. Responsive by default with label-based cell display on narrow viewports.\r\n\r\n## API and Behavior\r\n- `headers` (array of strings) defines the table header row (rendered as `<th scope=\"col\">`).\r\n- `rows` (array of arrays) defines data rows. Each cell can be:\r\n  - a **string / number** → rendered as text (escaped, safe by default),\r\n  - a **DOM node** (e.g. a built component) → appended as-is,\r\n  - `{ html: '<...>' }` → explicit opt-in for **trusted** raw HTML.\r\n- Both props are reactive: changes trigger a full re-render.\r\n- Empty arrays render no table content.\r\n\r\n## Columns, sorting and pagination\r\nFor richer tables, use `columns` instead of `headers` — an array of column descriptors. Rows can then\r\nbe **objects** keyed by `key` (positional `headers` + array rows still work as before).\r\n\r\n- `columns`: `[{ key, label, sortable, align, render }]`.\r\n  - `key` — property to read from each row object (or column index for array rows).\r\n  - `label` — header text. `align` — `'left' | 'center' | 'right'`.\r\n  - `sortable` — make the column clickable to sort. `render(row)` — return a string / DOM node / `{ html }` for custom cells.\r\n  - A column whose rendered values are **all numbers** right-aligns itself (header included) with tabular\r\n    figures, unless you set `align` explicitly.\r\n- `sortable` (boolean) — default sortability for every column when not set per-column.\r\n- `defaultSort` — `{ key, direction: 'asc' | 'desc' }` applied on first render.\r\n- `pagination` — `true` or `{ pageSize }` to page the rows (renders a `Pagination` control). Reactive:\r\n  it can be turned on/off or resized at runtime — the pager is shown/hidden and the page size updated,\r\n  never destroyed and rebuilt.\r\n- `emptyMessage` — text shown when there are columns but no rows.\r\n- `headerVariant` — `'tinted'` (default) | `'solid'` | `'none'`. The default header is a quiet tint with\r\n  small uppercase labels; `'solid'` reproduces the older saturated `--primary-color` fill, and `'none'`\r\n  drops the fill but keeps the label treatment. Any unknown value falls back to `'tinted'`.\r\n- `onSortChange({ key, direction } | null)` and `onPageChange(page)` — fire on each change.\r\n\r\nClicking a sortable header cycles **ascending → descending → unsorted**, and sorting returns to page 1.\r\nSortable headers are keyboard-operable: they are focusable (`tabindex=\"0\"`) and respond to **Enter** /\r\n**Space**, with `aria-sort` kept in sync.\r\n\r\n- `loading` (boolean) — shows a self-contained busy overlay (a CSS spinner, no dependency on the\r\n  `Loading` component) and sets `aria-busy`. Drive it yourself in remote mode: set `true` before\r\n  fetching a page, `false` when the new `rows` are in.\r\n\r\n## Local vs remote data (`dataSource`)\r\n- **`'local'`** (default): you give the table **all** the rows; it sorts and paginates them itself.\r\n- **`'remote'`**: `rows` is just the **current page** (already sorted/sliced upstream, e.g. by a server).\r\n  The table renders it as-is, tracks the page/sort state, and **emits** `onSortChange` / `onPageChange`\r\n  so you can fetch the next slice. Provide `totalItems` so the pager can compute the page count.\r\n\r\nIn remote mode the table never re-orders or slices your rows — supplying the next page is your job.\r\n\r\n## Live Preview\r\n:::component name=\"Table\"\r\n{\r\n  \"headers\": [\r\n    \"Name\",\r\n    \"Role\",\r\n    \"Status\"\r\n  ],\r\n  \"rows\": [\r\n    [\r\n      \"Alice\",\r\n      \"Engineer\",\r\n      \"Active\"\r\n    ],\r\n    [\r\n      \"Bob\",\r\n      \"Designer\",\r\n      \"Away\"\r\n    ],\r\n    [\r\n      \"Carol\",\r\n      \"Manager\",\r\n      \"Active\"\r\n    ]\r\n  ]\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"Table with data\" expected=\"renders table with headers and three rows\"\r\nconst table = await slice.build('Table', {\r\n  headers: ['Feature', 'Version', 'Release'],\r\n  rows: [\r\n    ['Card component', '1.0.0', '2026-01-15'],\r\n    ['Route sync', '1.0.1', '2026-02-01'],\r\n    ['Tabs component', '1.1.0', '2026-03-10']\r\n  ]\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n:::script label=\"Rich cells (DOM nodes + trusted HTML)\" expected=\"cells hold real components and opt-in HTML; plain strings stay escaped\"\r\nconst viewBtn = await slice.build('Button', { value: 'View' });\r\nconst installBtn = await slice.build('Button', { value: 'Install' });\r\n\r\nconst table = await slice.build('Table', {\r\n  headers: ['Package', 'Status', 'Action'],\r\n  rows: [\r\n    // { html } is an explicit opt-in for TRUSTED markup; plain strings are escaped.\r\n    ['slice.js',  { html: '<span style=\"color:var(--success-color)\">Published</span>' }, viewBtn],\r\n    ['slice-cli', { html: '<span style=\"color:var(--primary-color)\">Beta</span>' }, installBtn]\r\n  ]\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n:::script label=\"Sortable + paginated\" expected=\"sortable columns, 5 rows per page, with a pager\"\r\nconst people = Array.from({ length: 23 }, (_, i) => ({\r\n  name: 'Person ' + String(i + 1).padStart(2, '0'),\r\n  age: 20 + ((i * 7) % 40)\r\n}));\r\n\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Name', sortable: true },\r\n    { key: 'age',  label: 'Age',  sortable: true, align: 'right' }\r\n  ],\r\n  rows: people,\r\n  pagination: { pageSize: 5 },\r\n  defaultSort: { key: 'name', direction: 'asc' }\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n:::tip\r\nCells holding a built component are **owned by the table**. A re-render — sorting, paging, or new `rows`\r\n— destroys the components it replaces, so they never pile up in memory. The table never destroys a node\r\nit is about to show again, so re-passing the same node on every render is safe too.\r\n:::\r\n\r\n## Header style\r\nThe header is a quiet tint by default, so it does not compete with the page's primary actions.\r\n`headerVariant: 'solid'` restores the older saturated fill, `'none'` removes the fill entirely:\r\n\r\n:::script label=\"Header variants\" expected=\"three tables; solid reproduces the legacy look\"\r\nconst solid = await slice.build('Table', {\r\n  headers: ['Name', 'Role'],\r\n  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],\r\n  headerVariant: 'solid'\r\n});\r\n\r\nconst plain = await slice.build('Table', {\r\n  headers: ['Name', 'Role'],\r\n  rows: [['Ada', 'Engineer'], ['Linus', 'Maintainer']],\r\n  headerVariant: 'none'\r\n});\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.append(solid, plain);\r\nreturn wrapper;\r\n:::\r\n\r\n## Match the column, not just the cell\r\nA numeric column right-aligns and uses tabular figures on its own, header included:\r\n\r\n:::script label=\"Numbers align themselves\" expected=\"the Score column is right-aligned with tabular digits\"\r\nconst table = await slice.build('Table', {\r\n  columns: [\r\n    { key: 'name', label: 'Player' },\r\n    { key: 'score', label: 'Score' }\r\n  ],\r\n  rows: [\r\n    { name: 'Ada', score: 1280 },\r\n    { name: 'Linus', score: 9953 },\r\n    { name: 'Grace', score: 340 }\r\n  ]\r\n});\r\n\r\nreturn table;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nKeep row data uniform in length. Mismatched columns may produce uneven layout.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nPlain string cells are escaped, so user data is safe by default. Only the explicit `{ html: '...' }` form is injected as raw HTML — never pass unsanitized user input through it.\r\n:::\r\n\r\n:::warning\r\nDo not keep your own reference to a component you hand to a cell and then expect it to survive a\r\nre-render: the table destroys what it replaces. Build a fresh node per render instead (that is what a\r\n`render(row)` callback naturally does).\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"headers\": [\r\n    \"Name\",\r\n    \"Role\",\r\n    \"Status\"\r\n  ],\r\n  \"rows\": [\r\n    [\r\n      \"Alice\",\r\n      \"Engineer\",\r\n      \"Active\"\r\n    ],\r\n    [\r\n      \"Bob\",\r\n      \"Designer\",\r\n      \"Away\"\r\n    ],\r\n    [\r\n      \"Carol\",\r\n      \"Manager\",\r\n      \"Active\"\r\n    ]\r\n  ]\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"headers\": [\r\n    \"Name\",\r\n    \"Role\",\r\n    \"Status\"\r\n  ],\r\n  \"rows\": [\r\n    [\r\n      \"Alice\",\r\n      \"Engineer\",\r\n      \"Active\"\r\n    ],\r\n    [\r\n      \"Bob\",\r\n      \"Designer\",\r\n      \"Away\"\r\n    ],\r\n    [\r\n      \"Carol\",\r\n      \"Manager\",\r\n      \"Active\"\r\n    ]\r\n  ]\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Table', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"headers\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"sortable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"defaultSort\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pagination\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"dataSource\",\"type\":\"string\",\"required\":false,\"default\":\"local\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"emptyMessage\",\"type\":\"string\",\"required\":false,\"default\":\"No data\",\"allowedValues\":[]},{\"path\":\"headerVariant\",\"type\":\"string\",\"required\":false,\"default\":\"tinted\",\"allowedValues\":[\"tinted\",\"solid\",\"none\"]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onSortChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"headers\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"sortable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"defaultSort\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"pagination\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"dataSource\",\"type\":\"string\",\"required\":false,\"default\":\"local\",\"allowedValues\":[]},{\"path\":\"totalItems\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"emptyMessage\",\"type\":\"string\",\"required\":false,\"default\":\"No data\",\"allowedValues\":[]},{\"path\":\"headerVariant\",\"type\":\"string\",\"required\":false,\"default\":\"tinted\",\"allowedValues\":[\"tinted\",\"solid\",\"none\"]},{\"path\":\"loading\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onSortChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onPageChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-tabledocumentation', TableDocumentation);
