export default class ModalDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Open and close","expected":"modal opens and closes via close button","kind":"script","content":"const btn = await slice.build('Button', {\n  value: 'Open modal',\n  onClick: async () => {\n    const modal = await slice.build('Modal', { title: 'Hello', open: true });\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;"},{"label":"Custom title and body","expected":"modal with custom title and body content","kind":"script","content":"const btn = await slice.build('Button', {\n  value: 'Open with custom content',\n  onClick: async () => {\n    const modal = await slice.build('Modal', { title: 'Confirm action', open: true });\n    const p = document.createElement('p');\n    p.textContent = 'Are you sure you want to proceed?';\nmodal.appendBody(p);\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;"},{"label":"Confirm action","expected":"modal with two action buttons","kind":"script","content":"const btn = await slice.build('Button', {\n  value: 'Delete item',\n  onClick: async () => {\n    const modal = await slice.build('Modal', {\n      title: 'Confirm delete',\n      open: true\n    });\n    const p = document.createElement('p');\n    p.textContent = 'Are you sure you want to delete this item? This action cannot be undone.';\n    modal.appendBody(p);\n    const cancelBtn = await slice.build('Button', {\n      value: 'Cancel',\n      onClick: () => modal.close()\n    });\n    const confirmBtn = await slice.build('Button', {\n      value: 'Delete',\n      customColor: { background: '#dc2626', text: '#ffffff' },\n      onClick: () => { modal.close('confirmed'); }\n    });\n    modal.appendFooter(cancelBtn);\n    modal.appendFooter(confirmBtn);\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;"},{"label":"Form demo","expected":"modal with form inputs inside Grid component","kind":"script","content":"const btn = await slice.build('Button', {\n  value: 'New User',\n  onClick: async () => {\n    const modal = await slice.build('Modal', {\n      title: 'New User',\n      open: true,\n      width: '520px'\n    });\n    const grid = await slice.build('Grid', {\n      columns: 2, gap: '0.75rem'\n    });\n    const firstName = await slice.build('Input', { placeholder: 'First name' });\n    const lastName = await slice.build('Input', { placeholder: 'Last name' });\n    const email = await slice.build('Input', { placeholder: 'Email', type: 'email' });\n    const role = await slice.build('Input', { placeholder: 'Role' });\n    const dept = await slice.build('Input', { placeholder: 'Department' });\n    grid.items = [firstName, lastName, email, role, dept];\n    email.style.gridColumn = '1 / -1';\n    modal.appendBody(grid);\n    const cancelBtn = await slice.build('Button', {\n      value: 'Cancel',\n      onClick: () => modal.close()\n    });\n    const saveBtn = await slice.build('Button', {\n      value: 'Save',\n      customColor: { background: '#059669', text: '#ffffff' },\n      onClick: () => modal.close('saved')\n    });\n    modal.appendFooter(cancelBtn);\n    modal.appendFooter(saveBtn);\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;"},{"label":"Non-dismissable","expected":"modal without close button, backdrop click or Escape","kind":"script","content":"const btn = await slice.build('Button', {\n  value: 'Non-dismissable',\n  onClick: async () => {\n    const modal = await slice.build('Modal', {\n      title: 'Attention',\n      open: true,\n      dismissable: false\n    });\n    const p = document.createElement('p');\n    p.textContent = 'This modal can only be closed programmatically.';\n    modal.appendBody(p);\n    const closeBtn = await slice.build('Button', {\n      value: 'Close me',\n      onClick: () => modal.close()\n    });\n    modal.appendFooter(closeBtn);\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;"}];
  }

  async init() {
    this.markdownPath = "modal.md";
    this.markdownContent = "---\ntitle: Modal\nroute: /docs/feedback/modal\nnavLabel: Modal\nsection: Feedback\ngroup: Overlay\norder: 10\ndescription: Modal dialog component built on native <dialog> with composition via slots, focus trap, and backdrop dismiss.\ncomponent: ModalDocumentation\ngenerate: true\ntags: [modal, dialog, overlay, feedback]\n---\n\n# Modal\n\n## Overview\nThe `Modal` component wraps the native `<dialog>` element to provide a focused overlay for confirmations, forms, alerts, and custom content. It uses `showModal()` for built-in focus trapping, Escape key handling, and backdrop styling.\n\n## Core Behavior\n- Built on `<dialog>` — focus trap, Escape dismiss, and `::backdrop` are handled natively.\n- `open` prop controls visibility. Set `true` to call `showModal()`.\n- `title` renders into a dedicated header slot.\n- `dismissable` controls the close button and backdrop click to dismiss.\n- `customColor` overrides the background, text, and accent colors.\n- The close button has `aria-label=\"Cerrar\"`; the dialog has `role=\"dialog\"` and `aria-modal=\"true\"` (native).\n- Use `appendBody(node)` and `appendFooter(node)` to compose custom content after mounting.\n\n## Props\n\n| Prop           | Type              | Default     | Description                             |\n|----------------|-------------------|-------------|-----------------------------------------|\n| `open`         | `boolean`         | `false`     | Show the modal via `showModal()`        |\n| `title`        | `string`          | `''`        | Header text                             |\n| `dismissable`  | `boolean`         | `true`      | Show close button + backdrop dismiss    |\n| `width`        | `string`          | `''`        | CSS width override (e.g. `400px`)       |\n| `maxWidth`     | `string`          | `''`        | CSS max-width override                  |\n| `customColor`  | `object \\| null`  | `null`      | `{ background, text, accent }`          |\n| `onClose`      | `function`        | `null`      | Called when the modal is dismissed      |\n\n## Prop Scenarios\n\n:::script label=\"Open and close\" expected=\"modal opens and closes via close button\"\nconst btn = await slice.build('Button', {\n  value: 'Open modal',\n  onClick: async () => {\n    const modal = await slice.build('Modal', { title: 'Hello', open: true });\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;\n:::\n\n:::script label=\"Custom title and body\" expected=\"modal with custom title and body content\"\nconst btn = await slice.build('Button', {\n  value: 'Open with custom content',\n  onClick: async () => {\n    const modal = await slice.build('Modal', { title: 'Confirm action', open: true });\n    const p = document.createElement('p');\n    p.textContent = 'Are you sure you want to proceed?';\nmodal.appendBody(p);\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;\n:::\n\n:::script label=\"Confirm action\" expected=\"modal with two action buttons\"\nconst btn = await slice.build('Button', {\n  value: 'Delete item',\n  onClick: async () => {\n    const modal = await slice.build('Modal', {\n      title: 'Confirm delete',\n      open: true\n    });\n    const p = document.createElement('p');\n    p.textContent = 'Are you sure you want to delete this item? This action cannot be undone.';\n    modal.appendBody(p);\n    const cancelBtn = await slice.build('Button', {\n      value: 'Cancel',\n      onClick: () => modal.close()\n    });\n    const confirmBtn = await slice.build('Button', {\n      value: 'Delete',\n      customColor: { background: '#dc2626', text: '#ffffff' },\n      onClick: () => { modal.close('confirmed'); }\n    });\n    modal.appendFooter(cancelBtn);\n    modal.appendFooter(confirmBtn);\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;\n:::\n\n:::script label=\"Form demo\" expected=\"modal with form inputs inside Grid component\"\nconst btn = await slice.build('Button', {\n  value: 'New User',\n  onClick: async () => {\n    const modal = await slice.build('Modal', {\n      title: 'New User',\n      open: true,\n      width: '520px'\n    });\n    const grid = await slice.build('Grid', {\n      columns: 2, gap: '0.75rem'\n    });\n    const firstName = await slice.build('Input', { placeholder: 'First name' });\n    const lastName = await slice.build('Input', { placeholder: 'Last name' });\n    const email = await slice.build('Input', { placeholder: 'Email', type: 'email' });\n    const role = await slice.build('Input', { placeholder: 'Role' });\n    const dept = await slice.build('Input', { placeholder: 'Department' });\n    grid.items = [firstName, lastName, email, role, dept];\n    email.style.gridColumn = '1 / -1';\n    modal.appendBody(grid);\n    const cancelBtn = await slice.build('Button', {\n      value: 'Cancel',\n      onClick: () => modal.close()\n    });\n    const saveBtn = await slice.build('Button', {\n      value: 'Save',\n      customColor: { background: '#059669', text: '#ffffff' },\n      onClick: () => modal.close('saved')\n    });\n    modal.appendFooter(cancelBtn);\n    modal.appendFooter(saveBtn);\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;\n:::\n\n:::script label=\"Non-dismissable\" expected=\"modal without close button, backdrop click or Escape\"\nconst btn = await slice.build('Button', {\n  value: 'Non-dismissable',\n  onClick: async () => {\n    const modal = await slice.build('Modal', {\n      title: 'Attention',\n      open: true,\n      dismissable: false\n    });\n    const p = document.createElement('p');\n    p.textContent = 'This modal can only be closed programmatically.';\n    modal.appendBody(p);\n    const closeBtn = await slice.build('Button', {\n      value: 'Close me',\n      onClick: () => modal.close()\n    });\n    modal.appendFooter(closeBtn);\n    document.body.appendChild(modal);\n  }\n});\nreturn btn;\n:::\n\n## Best Practices\n:::tip\nUse modal for focused tasks that require user input or confirmation before continuing. Always provide a clear way to dismiss (close button, cancel action, or Escape key). For simple notifications, prefer `Toast` instead.\n:::\n\n## Pitfalls\n:::warning\nThe modal creates a `<dialog>` in the top layer — ensure no other element interferes with `z-index` handling. Multiple open modals stack but the browser only allows one `<dialog>` in the top layer at a time; close one before opening another.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| Prop           | Type              | Default     | Description                             |","|----------------|-------------------|-------------|-----------------------------------------|","| `open`         | `boolean`         | `false`     | Show the modal via `showModal()`        |","| `title`        | `string`          | `''`        | Header text                             |","| `dismissable`  | `boolean`         | `true`      | Show close button + backdrop dismiss    |","| `width`        | `string`          | `''`        | CSS width override (e.g. `400px`)       |","| `maxWidth`     | `string`          | `''`        | CSS max-width override                  |","| `customColor`  | `object \\| null`  | `null`      | `{ background, text, accent }`          |","| `onClose`      | `function`        | `null`      | Called when the modal is dismissed      |"];
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
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"dismissable\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"width\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"maxWidth\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClose\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"dismissable\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"width\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"maxWidth\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClose\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-modaldocumentation', ModalDocumentation);
