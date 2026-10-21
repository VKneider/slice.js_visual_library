export default class SelectDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Searchable + clearable country picker","expected":"type to filter, clear button resets","kind":"script","content":"const select = await slice.build('Select', {\r\n  label: 'Country',\r\n  searchable: true,\r\n  clearable: true,\r\n  placeholder: 'Type to search…',\r\n  visibleProp: 'name',\r\n  options: [\r\n    { name: 'Argentina', code: 'AR' },\r\n    { name: 'Brazil', code: 'BR' },\r\n    { name: 'Canada', code: 'CA' },\r\n    { name: 'Denmark', code: 'DK' },\r\n    { name: 'Egypt', code: 'EG' }\r\n  ]\r\n});\r\n\r\nreturn select;"},{"label":"User role selector","expected":"single select for role assignment","kind":"script","content":"const select = await slice.build('Select', {\r\n  label: 'Role',\r\n  visibleProp: 'label',\r\n  options: [\r\n    { label: 'Owner', value: 'owner' },\r\n    { label: 'Editor', value: 'editor' },\r\n    { label: 'Viewer', value: 'viewer' }\r\n  ]\r\n});\r\n\r\nreturn select;"},{"label":"Tag picker (multiple)","expected":"multi-select setup for content tags","kind":"script","content":"const select = await slice.build('Select', {\r\n  label: 'Tags',\r\n  multiple: true,\r\n  visibleProp: 'label',\r\n  options: [\r\n    { label: 'Frontend', id: 1 },\r\n    { label: 'Backend', id: 2 },\r\n    { label: 'Documentation', id: 3 },\r\n    { label: 'Release', id: 4 }\r\n  ]\r\n});\r\n\r\nreturn select;"},{"label":"Select inside filter row","expected":"select combined with search + action","kind":"script","content":"const row = document.createElement('div');\r\n\r\nconst search = await slice.build('Input', {\r\n  placeholder: 'Search docs',\r\n  type: 'text'\r\n});\r\n\r\nconst select = await slice.build('Select', {\r\n  label: 'Section',\r\n  visibleProp: 'label',\r\n  options: [\r\n    { label: 'All', key: 'all' },\r\n    { label: 'Input', key: 'input' },\r\n    { label: 'Layout', key: 'layout' }\r\n  ]\r\n});\r\n\r\nconst apply = await slice.build('Button', {\r\n  value: 'Apply'\r\n});\r\n\r\nrow.appendChild(search);\r\nrow.appendChild(select);\r\nrow.appendChild(apply);\r\nreturn row;"},{"label":"Controlled default selection","expected":"value can be initialized from option objects","kind":"script","content":"const options = [\r\n  { label: 'Daily', key: 'daily' },\r\n  { label: 'Weekly', key: 'weekly' },\r\n  { label: 'Monthly', key: 'monthly' }\r\n];\r\n\r\nconst select = await slice.build('Select', {\r\n  label: 'Report cadence',\r\n  visibleProp: 'label',\r\n  options\r\n});\r\n\r\nselect.value = [options[1]];\r\nreturn select;"},{"label":"Multi-select + submit action","expected":"selected values can be consumed by a follow-up action","kind":"script","content":"const options = [\r\n  { label: 'Frontend', id: 'fe' },\r\n  { label: 'Backend', id: 'be' },\r\n  { label: 'Design', id: 'design' }\r\n];\r\n\r\nconst picker = await slice.build('Select', {\r\n  label: 'Team roles',\r\n  multiple: true,\r\n  visibleProp: 'label',\r\n  options\r\n});\r\n\r\nconst submit = await slice.build('Button', {\r\n  value: 'Save roles',\r\n  onClick: () => {\r\n    const selected = picker.value;\r\n    if (Array.isArray(selected)) {\r\n      console.log('Selected roles:', selected.map((item) => item.label));\r\n    }\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(picker);\r\nhost.appendChild(submit);\r\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "select.md";
    this.markdownContent = "---\r\ntitle: Select\r\nroute: /docs/input/select\r\nnavLabel: Select\r\nsection: Input Components\r\ngroup: Basic\r\norder: 12\r\ndescription: Select component documentation with practical setup examples.\r\ncomponent: SelectDocumentation\r\ngenerate: true\r\ntags: [select, forms]\r\n---\r\n\r\n# Select\r\n\r\n## Overview\r\n`Select` supports single/multiple options, custom display property and callback on selection.\r\n\r\n## Core Behavior\r\n- `Select` supports single and multiple selection flows from a structured options source.\r\n- `visibleProp` maps option objects to user-facing labels without reshaping backend payloads.\r\n- Use the scenarios below to validate selection behavior in forms and filter toolbars.\r\n\r\n## Search, clear & keyboard\r\n- `searchable` (boolean) — type into the field to filter options by their `visibleProp` text; a\r\n  \"No results\" row appears when nothing matches. `placeholder` sets the hint shown while searching.\r\n- `clearable` (boolean) — shows a clear button once something is selected; clicking it resets the\r\n  value and fires `onChange`.\r\n- Keyboard: **↑/↓** move the highlight, **Enter** selects the highlighted option (or toggles the menu),\r\n  **Home/End** jump to the first/last option, **Esc** closes. `aria-expanded` / `aria-selected` are kept\r\n  in sync.\r\n\r\n## Live Preview\r\n:::component name=\"Select\"\r\n{\r\n  \"label\": \"Role\",\r\n  \"visibleProp\": \"label\",\r\n  \"options\": [\r\n    {\r\n      \"label\": \"Admin\",\r\n      \"value\": \"admin\"\r\n    },\r\n    {\r\n      \"label\": \"Editor\",\r\n      \"value\": \"editor\"\r\n    },\r\n    {\r\n      \"label\": \"Viewer\",\r\n      \"value\": \"viewer\"\r\n    }\r\n  ]\r\n}\r\n:::\r\n\r\n## Practical Setups\r\n:::script label=\"Searchable + clearable country picker\" expected=\"type to filter, clear button resets\"\r\nconst select = await slice.build('Select', {\r\n  label: 'Country',\r\n  searchable: true,\r\n  clearable: true,\r\n  placeholder: 'Type to search…',\r\n  visibleProp: 'name',\r\n  options: [\r\n    { name: 'Argentina', code: 'AR' },\r\n    { name: 'Brazil', code: 'BR' },\r\n    { name: 'Canada', code: 'CA' },\r\n    { name: 'Denmark', code: 'DK' },\r\n    { name: 'Egypt', code: 'EG' }\r\n  ]\r\n});\r\n\r\nreturn select;\r\n:::\r\n\r\n:::script label=\"User role selector\" expected=\"single select for role assignment\"\r\nconst select = await slice.build('Select', {\r\n  label: 'Role',\r\n  visibleProp: 'label',\r\n  options: [\r\n    { label: 'Owner', value: 'owner' },\r\n    { label: 'Editor', value: 'editor' },\r\n    { label: 'Viewer', value: 'viewer' }\r\n  ]\r\n});\r\n\r\nreturn select;\r\n:::\r\n\r\n:::script label=\"Tag picker (multiple)\" expected=\"multi-select setup for content tags\"\r\nconst select = await slice.build('Select', {\r\n  label: 'Tags',\r\n  multiple: true,\r\n  visibleProp: 'label',\r\n  options: [\r\n    { label: 'Frontend', id: 1 },\r\n    { label: 'Backend', id: 2 },\r\n    { label: 'Documentation', id: 3 },\r\n    { label: 'Release', id: 4 }\r\n  ]\r\n});\r\n\r\nreturn select;\r\n:::\r\n\r\n:::script label=\"Select inside filter row\" expected=\"select combined with search + action\"\r\nconst row = document.createElement('div');\r\n\r\nconst search = await slice.build('Input', {\r\n  placeholder: 'Search docs',\r\n  type: 'text'\r\n});\r\n\r\nconst select = await slice.build('Select', {\r\n  label: 'Section',\r\n  visibleProp: 'label',\r\n  options: [\r\n    { label: 'All', key: 'all' },\r\n    { label: 'Input', key: 'input' },\r\n    { label: 'Layout', key: 'layout' }\r\n  ]\r\n});\r\n\r\nconst apply = await slice.build('Button', {\r\n  value: 'Apply'\r\n});\r\n\r\nrow.appendChild(search);\r\nrow.appendChild(select);\r\nrow.appendChild(apply);\r\nreturn row;\r\n:::\r\n\r\n:::script label=\"Controlled default selection\" expected=\"value can be initialized from option objects\"\r\nconst options = [\r\n  { label: 'Daily', key: 'daily' },\r\n  { label: 'Weekly', key: 'weekly' },\r\n  { label: 'Monthly', key: 'monthly' }\r\n];\r\n\r\nconst select = await slice.build('Select', {\r\n  label: 'Report cadence',\r\n  visibleProp: 'label',\r\n  options\r\n});\r\n\r\nselect.value = [options[1]];\r\nreturn select;\r\n:::\r\n\r\n:::script label=\"Multi-select + submit action\" expected=\"selected values can be consumed by a follow-up action\"\r\nconst options = [\r\n  { label: 'Frontend', id: 'fe' },\r\n  { label: 'Backend', id: 'be' },\r\n  { label: 'Design', id: 'design' }\r\n];\r\n\r\nconst picker = await slice.build('Select', {\r\n  label: 'Team roles',\r\n  multiple: true,\r\n  visibleProp: 'label',\r\n  options\r\n});\r\n\r\nconst submit = await slice.build('Button', {\r\n  value: 'Save roles',\r\n  onClick: () => {\r\n    const selected = picker.value;\r\n    if (Array.isArray(selected)) {\r\n      console.log('Selected roles:', selected.map((item) => item.label));\r\n    }\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(picker);\r\nhost.appendChild(submit);\r\nreturn host;\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"label\": \"Role\",\r\n  \"visibleProp\": \"label\",\r\n  \"options\": [\r\n    {\r\n      \"label\": \"Admin\",\r\n      \"value\": \"admin\"\r\n    },\r\n    {\r\n      \"label\": \"Editor\",\r\n      \"value\": \"editor\"\r\n    },\r\n    {\r\n      \"label\": \"Viewer\",\r\n      \"value\": \"viewer\"\r\n    }\r\n  ]\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"label\": \"Role\",\r\n  \"visibleProp\": \"label\",\r\n  \"options\": [\r\n    {\r\n      \"label\": \"Admin\",\r\n      \"value\": \"admin\"\r\n    },\r\n    {\r\n      \"label\": \"Editor\",\r\n      \"value\": \"editor\"\r\n    },\r\n    {\r\n      \"label\": \"Viewer\",\r\n      \"value\": \"viewer\"\r\n    }\r\n  ]\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Select', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"visibleProp\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"clearable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onOptionSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"visibleProp\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"clearable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onOptionSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-selectdocumentation', SelectDocumentation);
