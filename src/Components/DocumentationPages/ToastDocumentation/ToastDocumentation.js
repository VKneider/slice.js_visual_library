export default class ToastDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Type variants","expected":"five toasts with different type icons and colors","kind":"script","content":"const container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexDirection = 'column';\ncontainer.style.gap = '0.5rem';\nconst types = ['success', 'error', 'warning', 'info', 'default'];\nconst labels = ['File saved', 'Connection lost', 'Low disk space', 'Update available', 'No icon variant'];\nfor (let i = 0; i < types.length; i++) {\n  container.appendChild(await slice.build('Toast', { message: labels[i], type: types[i], duration: 0 }));\n}\nreturn container;"},{"label":"Sticky toast (duration 0)","expected":"toast stays visible until closed","kind":"script","content":"return await slice.build('Toast', { message: 'This toast stays until you close it', type: 'warning', duration: 0 });"},{"label":"Custom color","expected":"toast with dark blue background and light blue accent","kind":"script","content":"return await slice.build('Toast', {\n  message: 'Custom-styled toast',\n  type: 'info',\n  duration: 0,\n  customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }\n});"},{"label":"Non-dismissable","expected":"toast with no close button","kind":"script","content":"return await slice.build('Toast', { message: 'Auto-dismiss only', dismissable: false });"}];
  }

  async init() {
    this.markdownPath = "toast.md";
    this.markdownContent = "---\ntitle: Toast\nroute: /docs/feedback/toast\nnavLabel: Toast\nsection: Feedback\ngroup: Notifications\norder: 10\ndescription: Toast notification component with type-based styling, auto-dismiss, and dismissable modes.\ncomponent: ToastDocumentation\ngenerate: true\ntags: [toast, notification, feedback, alert]\n---\n\n# Toast\n\n## Overview\nThe `Toast` component displays brief, auto-dismissible messages at the edge of the viewport. Use it for confirmations, errors, warnings, or any transient feedback.\n\n## Core Behavior\n- `type` selects one of five variants (`success`, `error`, `warning`, `info`, `default`) each with a distinct icon and color scheme derived from theme tokens.\n- `duration` controls auto-dismiss in milliseconds. Set `0` for sticky (manual close only).\n- `dismissable` toggles the close button. Defaults to `true`.\n- `customColor` overrides the background, text, and accent colors when you need an exact value.\n- The close button has `aria-label=\"Close\"`; the toast has `role=\"alert\"` for screen reader announcements.\n\n> For programmatic control (show / dismiss / queue management) use **[ToastProvider](/docs/services/toast-provider)**.\n\n## Live Preview\n:::component name=\"Toast\"\n{\n  \"message\": \"File saved successfully\",\n  \"type\": \"success\",\n  \"duration\": 0\n}\n:::\n\n## Types\nEach type maps to a theme token and an icon.\n\n| Type      | Description        | Icon |\n|-----------|--------------------|------|\n| `success` | Positive feedback  | ✓    |\n| `error`   | Failure / problem  | ✕    |\n| `warning` | Heads-up / caution | ⚠    |\n| `info`    | General info       | ℹ    |\n| `default` | Neutral (no icon)  | —    |\n\n:::script label=\"Type variants\" expected=\"five toasts with different type icons and colors\"\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexDirection = 'column';\ncontainer.style.gap = '0.5rem';\nconst types = ['success', 'error', 'warning', 'info', 'default'];\nconst labels = ['File saved', 'Connection lost', 'Low disk space', 'Update available', 'No icon variant'];\nfor (let i = 0; i < types.length; i++) {\n  container.appendChild(await slice.build('Toast', { message: labels[i], type: types[i], duration: 0 }));\n}\nreturn container;\n:::\n\n## Props\n\n| Prop           | Type              | Default     | Description                             |\n|----------------|-------------------|-------------|-----------------------------------------|\n| `message`      | `string`          | `''`        | Notification text                       |\n| `type`         | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |\n| `duration`     | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky        |\n| `dismissable`  | `boolean`         | `true`      | Show close button                       |\n| `customColor`  | `object \\| null`  | `null`      | `{ background, text, accent }`          |\n\n## Prop Scenarios\n\n:::script label=\"Sticky toast (duration 0)\" expected=\"toast stays visible until closed\"\nreturn await slice.build('Toast', { message: 'This toast stays until you close it', type: 'warning', duration: 0 });\n:::\n\n:::script label=\"Custom color\" expected=\"toast with dark blue background and light blue accent\"\nreturn await slice.build('Toast', {\n  message: 'Custom-styled toast',\n  type: 'info',\n  duration: 0,\n  customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }\n});\n:::\n\n:::script label=\"Non-dismissable\" expected=\"toast with no close button\"\nreturn await slice.build('Toast', { message: 'Auto-dismiss only', dismissable: false });\n:::\n\n## Best Practices\n:::tip\nUse `duration: 0` for toasts that require user action. Always provide a `type` to communicate severity. For many notifications in a view, use `ToastProvider` which handles queuing, positioning, and cleanup automatically.\n:::\n\n## Pitfalls\n:::warning\nDo not stack multiple `<slice-toast>` elements manually — use `ToastProvider` for programmatic management. Avoid toasts for critical or mandatory information; prefer inline messages or modals for content users must acknowledge.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"message\": \"File saved successfully\",\n  \"type\": \"success\",\n  \"duration\": 0\n}") {
               try {
                  props = JSON.parse("{\n  \"message\": \"File saved successfully\",\n  \"type\": \"success\",\n  \"duration\": 0\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Toast', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| Type      | Description        | Icon |","|-----------|--------------------|------|","| `success` | Positive feedback  | ✓    |","| `error`   | Failure / problem  | ✕    |","| `warning` | Heads-up / caution | ⚠    |","| `info`    | General info       | ℹ    |","| `default` | Neutral (no icon)  | —    |"];
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
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| Prop           | Type              | Default     | Description                             |","|----------------|-------------------|-------------|-----------------------------------------|","| `message`      | `string`          | `''`        | Notification text                       |","| `type`         | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |","| `duration`     | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky        |","| `dismissable`  | `boolean`         | `true`      | Show close button                       |","| `customColor`  | `object \\| null`  | `null`      | `{ background, text, accent }`          |"];
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
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"message\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"type\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[]},{\"path\":\"duration\",\"type\":\"number\",\"required\":false,\"default\":\"4000\",\"allowedValues\":[]},{\"path\":\"dismissable\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"message\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"type\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[]},{\"path\":\"duration\",\"type\":\"number\",\"required\":false,\"default\":\"4000\",\"allowedValues\":[]},{\"path\":\"dismissable\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-toastdocumentation', ToastDocumentation);
