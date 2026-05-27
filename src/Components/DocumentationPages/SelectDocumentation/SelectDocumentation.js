export default class SelectDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"User role selector","expected":"single select for role assignment","kind":"script","content":"const select = await slice.build('Select', {\n  label: 'Role',\n  visibleProp: 'label',\n  options: [\n    { label: 'Owner', value: 'owner' },\n    { label: 'Editor', value: 'editor' },\n    { label: 'Viewer', value: 'viewer' }\n  ]\n});\n\nreturn select;"},{"label":"Tag picker (multiple)","expected":"multi-select setup for content tags","kind":"script","content":"const select = await slice.build('Select', {\n  label: 'Tags',\n  multiple: true,\n  visibleProp: 'label',\n  options: [\n    { label: 'Frontend', id: 1 },\n    { label: 'Backend', id: 2 },\n    { label: 'Documentation', id: 3 },\n    { label: 'Release', id: 4 }\n  ]\n});\n\nreturn select;"},{"label":"Select inside filter row","expected":"select combined with search + action","kind":"script","content":"const row = document.createElement('div');\n\nconst search = await slice.build('Input', {\n  placeholder: 'Search docs',\n  type: 'text'\n});\n\nconst select = await slice.build('Select', {\n  label: 'Section',\n  visibleProp: 'label',\n  options: [\n    { label: 'All', key: 'all' },\n    { label: 'Input', key: 'input' },\n    { label: 'Layout', key: 'layout' }\n  ]\n});\n\nconst apply = await slice.build('Button', {\n  value: 'Apply'\n});\n\nrow.appendChild(search);\nrow.appendChild(select);\nrow.appendChild(apply);\nreturn row;"},{"label":"Controlled default selection","expected":"value can be initialized from option objects","kind":"script","content":"const options = [\n  { label: 'Daily', key: 'daily' },\n  { label: 'Weekly', key: 'weekly' },\n  { label: 'Monthly', key: 'monthly' }\n];\n\nconst select = await slice.build('Select', {\n  label: 'Report cadence',\n  visibleProp: 'label',\n  options\n});\n\nselect.value = [options[1]];\nreturn select;"},{"label":"Multi-select + submit action","expected":"selected values can be consumed by a follow-up action","kind":"script","content":"const options = [\n  { label: 'Frontend', id: 'fe' },\n  { label: 'Backend', id: 'be' },\n  { label: 'Design', id: 'design' }\n];\n\nconst picker = await slice.build('Select', {\n  label: 'Team roles',\n  multiple: true,\n  visibleProp: 'label',\n  options\n});\n\nconst submit = await slice.build('Button', {\n  value: 'Save roles',\n  onClickCallback: () => {\n    const selected = picker.value;\n    if (Array.isArray(selected)) {\n      console.log('Selected roles:', selected.map((item) => item.label));\n    }\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(picker);\nhost.appendChild(submit);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "select.md";
    this.markdownContent = "---\ntitle: Select\nroute: /docs/input/select\nnavLabel: Select\nsection: Input Components\ngroup: Basic\norder: 12\ndescription: Select component documentation with practical setup examples.\ncomponent: SelectDocumentation\ngenerate: true\ntags: [select, forms]\n---\n\n# Select\n\n## Overview\n`Select` supports single/multiple options, custom display property and callback on selection.\n\n## Core Behavior\n- `Select` supports single and multiple selection flows from a structured options source.\n- `visibleProp` maps option objects to user-facing labels without reshaping backend payloads.\n- Use the scenarios below to validate selection behavior in forms and filter toolbars.\n\n## Basic Usage\n```javascript title=\"Build select\"\nconst select = await slice.build('Select', {\n  label: 'Role',\n  visibleProp: 'label',\n  options: [\n    { label: 'Admin', value: 'admin' },\n    { label: 'Editor', value: 'editor' }\n  ]\n});\n\nthis.appendChild(select);\n```\n\n## Practical Setups\n:::script label=\"User role selector\" expected=\"single select for role assignment\"\nconst select = await slice.build('Select', {\n  label: 'Role',\n  visibleProp: 'label',\n  options: [\n    { label: 'Owner', value: 'owner' },\n    { label: 'Editor', value: 'editor' },\n    { label: 'Viewer', value: 'viewer' }\n  ]\n});\n\nreturn select;\n:::\n\n:::script label=\"Tag picker (multiple)\" expected=\"multi-select setup for content tags\"\nconst select = await slice.build('Select', {\n  label: 'Tags',\n  multiple: true,\n  visibleProp: 'label',\n  options: [\n    { label: 'Frontend', id: 1 },\n    { label: 'Backend', id: 2 },\n    { label: 'Documentation', id: 3 },\n    { label: 'Release', id: 4 }\n  ]\n});\n\nreturn select;\n:::\n\n:::script label=\"Select inside filter row\" expected=\"select combined with search + action\"\nconst row = document.createElement('div');\n\nconst search = await slice.build('Input', {\n  placeholder: 'Search docs',\n  type: 'text'\n});\n\nconst select = await slice.build('Select', {\n  label: 'Section',\n  visibleProp: 'label',\n  options: [\n    { label: 'All', key: 'all' },\n    { label: 'Input', key: 'input' },\n    { label: 'Layout', key: 'layout' }\n  ]\n});\n\nconst apply = await slice.build('Button', {\n  value: 'Apply'\n});\n\nrow.appendChild(search);\nrow.appendChild(select);\nrow.appendChild(apply);\nreturn row;\n:::\n\n:::script label=\"Controlled default selection\" expected=\"value can be initialized from option objects\"\nconst options = [\n  { label: 'Daily', key: 'daily' },\n  { label: 'Weekly', key: 'weekly' },\n  { label: 'Monthly', key: 'monthly' }\n];\n\nconst select = await slice.build('Select', {\n  label: 'Report cadence',\n  visibleProp: 'label',\n  options\n});\n\nselect.value = [options[1]];\nreturn select;\n:::\n\n:::script label=\"Multi-select + submit action\" expected=\"selected values can be consumed by a follow-up action\"\nconst options = [\n  { label: 'Frontend', id: 'fe' },\n  { label: 'Backend', id: 'be' },\n  { label: 'Design', id: 'design' }\n];\n\nconst picker = await slice.build('Select', {\n  label: 'Team roles',\n  multiple: true,\n  visibleProp: 'label',\n  options\n});\n\nconst submit = await slice.build('Button', {\n  value: 'Save roles',\n  onClickCallback: () => {\n    const selected = picker.value;\n    if (Array.isArray(selected)) {\n      console.log('Selected roles:', selected.map((item) => item.label));\n    }\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(picker);\nhost.appendChild(submit);\nreturn host;\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const select = await slice.build('Select', {\n  label: 'Role',\n  visibleProp: 'label',\n  options: [\n    { label: 'Admin', value: 'admin' },\n    { label: 'Editor', value: 'editor' }\n  ]\n});\n\nthis.appendChild(select);",
               language: "javascript"
            });
            if ("Build select") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build select";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"visibleProp\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"onOptionSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"visibleProp\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"onOptionSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-selectdocumentation', SelectDocumentation);
