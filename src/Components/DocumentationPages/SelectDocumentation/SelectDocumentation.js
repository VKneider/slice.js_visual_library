export default class SelectDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"User role selector","expected":"single select for role assignment","kind":"script","content":"const select = await slice.build('Select', {\n  label: 'Role',\n  visibleProp: 'label',\n  options: [\n    { label: 'Owner', value: 'owner' },\n    { label: 'Editor', value: 'editor' },\n    { label: 'Viewer', value: 'viewer' }\n  ]\n});\n\nreturn select;"},{"label":"Tag picker (multiple)","expected":"multi-select setup for content tags","kind":"script","content":"const select = await slice.build('Select', {\n  label: 'Tags',\n  multiple: true,\n  visibleProp: 'label',\n  options: [\n    { label: 'Frontend', id: 1 },\n    { label: 'Backend', id: 2 },\n    { label: 'Documentation', id: 3 },\n    { label: 'Release', id: 4 }\n  ]\n});\n\nreturn select;"},{"label":"Select inside filter row","expected":"select combined with search + action","kind":"script","content":"const row = document.createElement('div');\nrow.style.display = 'grid';\nrow.style.gridTemplateColumns = '2fr 1fr auto';\nrow.style.gap = '10px';\nrow.style.maxWidth = '640px';\n\nconst search = await slice.build('Input', {\n  placeholder: 'Search docs',\n  type: 'text'\n});\n\nconst select = await slice.build('Select', {\n  label: 'Section',\n  visibleProp: 'label',\n  options: [\n    { label: 'All', key: 'all' },\n    { label: 'Input', key: 'input' },\n    { label: 'Layout', key: 'layout' }\n  ]\n});\n\nconst apply = await slice.build('Button', {\n  value: 'Apply'\n});\n\nrow.appendChild(search);\nrow.appendChild(select);\nrow.appendChild(apply);\nreturn row;"}];
  }

  async init() {
    this.markdownPath = "select.md";
    this.markdownContent = "---\ntitle: Select\nroute: /docs/input/select\nnavLabel: Select\nsection: Input Components\ngroup: Basic\norder: 12\ndescription: Select component documentation with practical setup examples.\ncomponent: SelectDocumentation\ngenerate: true\ntags: [select, forms]\n---\n\n# Select\n\n## Overview\n`Select` supports single/multiple options, custom display property and callback on selection.\n\n## Core Behavior\n- `Select` supports single and multiple selection flows from a structured options source.\n- `visibleProp` maps option objects to user-facing labels without reshaping backend payloads.\n- Use the scenarios below to validate selection behavior in forms and filter toolbars.\n\n## Basic Usage\n```javascript title=\"Build select\"\nconst select = await slice.build('Select', {\n  label: 'Role',\n  visibleProp: 'label',\n  options: [\n    { label: 'Admin', value: 'admin' },\n    { label: 'Editor', value: 'editor' }\n  ]\n});\n\nthis.appendChild(select);\n```\n\n## Practical Setups\n:::script label=\"User role selector\" expected=\"single select for role assignment\"\nconst select = await slice.build('Select', {\n  label: 'Role',\n  visibleProp: 'label',\n  options: [\n    { label: 'Owner', value: 'owner' },\n    { label: 'Editor', value: 'editor' },\n    { label: 'Viewer', value: 'viewer' }\n  ]\n});\n\nreturn select;\n:::\n\n:::script label=\"Tag picker (multiple)\" expected=\"multi-select setup for content tags\"\nconst select = await slice.build('Select', {\n  label: 'Tags',\n  multiple: true,\n  visibleProp: 'label',\n  options: [\n    { label: 'Frontend', id: 1 },\n    { label: 'Backend', id: 2 },\n    { label: 'Documentation', id: 3 },\n    { label: 'Release', id: 4 }\n  ]\n});\n\nreturn select;\n:::\n\n:::script label=\"Select inside filter row\" expected=\"select combined with search + action\"\nconst row = document.createElement('div');\nrow.style.display = 'grid';\nrow.style.gridTemplateColumns = '2fr 1fr auto';\nrow.style.gap = '10px';\nrow.style.maxWidth = '640px';\n\nconst search = await slice.build('Input', {\n  placeholder: 'Search docs',\n  type: 'text'\n});\n\nconst select = await slice.build('Select', {\n  label: 'Section',\n  visibleProp: 'label',\n  options: [\n    { label: 'All', key: 'all' },\n    { label: 'Input', key: 'input' },\n    { label: 'Layout', key: 'layout' }\n  ]\n});\n\nconst apply = await slice.build('Button', {\n  value: 'Apply'\n});\n\nrow.appendChild(search);\nrow.appendChild(select);\nrow.appendChild(apply);\nreturn row;\n:::\n";
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
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `disabled` | `boolean` | `false` | `false` | - |","| `label` | `string` | `false` | `` | - |","| `multiple` | `boolean` | `false` | `false` | - |","| `onOptionSelect` | `function` | `false` | `null` | - |","| `options` | `array` | `false` | `` | - |","| `visibleProp` | `string` | `false` | `text` | - |"];
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

        const mount = (node) => {
          if (node instanceof Node) {
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, slice, document, mount);

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
      card.appendChild(code);
      card.appendChild(preview);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-selectdocumentation', SelectDocumentation);
