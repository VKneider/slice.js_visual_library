export default class ToastDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Type variants","expected":"five toasts with different type icons and colors","kind":"script","content":"const container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexDirection = 'column';\r\ncontainer.style.gap = '0.5rem';\r\nconst types = ['success', 'error', 'warning', 'info', 'default'];\r\nconst labels = ['File saved', 'Connection lost', 'Low disk space', 'Update available', 'No icon variant'];\r\nfor (let i = 0; i < types.length; i++) {\r\n  container.appendChild(await slice.build('Toast', { message: labels[i], type: types[i], duration: 0 }));\r\n}\r\nreturn container;"},{"label":"Sticky toast (duration 0)","expected":"toast stays visible until closed","kind":"script","content":"return await slice.build('Toast', { message: 'This toast stays until you close it', type: 'warning', duration: 0 });"},{"label":"Custom color","expected":"toast with dark blue background and light blue accent","kind":"script","content":"return await slice.build('Toast', {\r\n  message: 'Custom-styled toast',\r\n  type: 'info',\r\n  duration: 0,\r\n  customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }\r\n});"},{"label":"Non-dismissable","expected":"toast with no close button","kind":"script","content":"return await slice.build('Toast', { message: 'Auto-dismiss only', dismissable: false });"}];
  }

  async init() {
    this.markdownPath = "toast.md";
    this.markdownContent = "---\r\ntitle: Toast\r\nroute: /docs/feedback/toast\r\nnavLabel: Toast\r\nsection: Feedback\r\ngroup: Notifications\r\norder: 10\r\ndescription: Toast notification component with type-based styling, auto-dismiss, and dismissable modes.\r\ncomponent: ToastDocumentation\r\ngenerate: true\r\ntags: [toast, notification, feedback, alert]\r\n---\r\n\r\n# Toast\r\n\r\n## Overview\r\nThe `Toast` component displays brief, auto-dismissible messages at the edge of the viewport. Use it for confirmations, errors, warnings, or any transient feedback.\r\n\r\n## Core Behavior\r\n- `type` selects one of five variants (`success`, `error`, `warning`, `info`, `default`) each with a distinct icon and color scheme derived from theme tokens.\r\n- `duration` controls auto-dismiss in milliseconds. Set `0` for sticky (manual close only).\r\n- `dismissable` toggles the close button. Defaults to `true`.\r\n- `customColor` overrides the background, text, and accent colors when you need an exact value.\r\n- The close button has `aria-label=\"Close\"`; the toast has `role=\"alert\"` for screen reader announcements.\r\n\r\n> For programmatic control (show / dismiss / queue management) use **[ToastProvider](/docs/services/toast-provider)**.\r\n\r\n## Live Preview\r\n:::component name=\"Toast\"\r\n{\r\n  \"message\": \"File saved successfully\",\r\n  \"type\": \"success\",\r\n  \"duration\": 0\r\n}\r\n:::\r\n\r\n## Types\r\nEach type maps to a theme token and an icon.\r\n\r\n| Type      | Description        | Icon |\r\n|-----------|--------------------|------|\r\n| `success` | Positive feedback  | ✓    |\r\n| `error`   | Failure / problem  | ✕    |\r\n| `warning` | Heads-up / caution | ⚠    |\r\n| `info`    | General info       | ℹ    |\r\n| `default` | Neutral (no icon)  | —    |\r\n\r\n:::script label=\"Type variants\" expected=\"five toasts with different type icons and colors\"\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexDirection = 'column';\r\ncontainer.style.gap = '0.5rem';\r\nconst types = ['success', 'error', 'warning', 'info', 'default'];\r\nconst labels = ['File saved', 'Connection lost', 'Low disk space', 'Update available', 'No icon variant'];\r\nfor (let i = 0; i < types.length; i++) {\r\n  container.appendChild(await slice.build('Toast', { message: labels[i], type: types[i], duration: 0 }));\r\n}\r\nreturn container;\r\n:::\r\n\r\n## Props\r\n\r\n| Prop           | Type              | Default     | Description                             |\r\n|----------------|-------------------|-------------|-----------------------------------------|\r\n| `message`      | `string`          | `''`        | Notification text                       |\r\n| `type`         | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |\r\n| `duration`     | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky        |\r\n| `dismissable`  | `boolean`         | `true`      | Show close button                       |\r\n| `customColor`  | `object \\| null`  | `null`      | `{ background, text, accent }`          |\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"Sticky toast (duration 0)\" expected=\"toast stays visible until closed\"\r\nreturn await slice.build('Toast', { message: 'This toast stays until you close it', type: 'warning', duration: 0 });\r\n:::\r\n\r\n:::script label=\"Custom color\" expected=\"toast with dark blue background and light blue accent\"\r\nreturn await slice.build('Toast', {\r\n  message: 'Custom-styled toast',\r\n  type: 'info',\r\n  duration: 0,\r\n  customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }\r\n});\r\n:::\r\n\r\n:::script label=\"Non-dismissable\" expected=\"toast with no close button\"\r\nreturn await slice.build('Toast', { message: 'Auto-dismiss only', dismissable: false });\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nUse `duration: 0` for toasts that require user action. Always provide a `type` to communicate severity. For many notifications in a view, use `ToastProvider` which handles queuing, positioning, and cleanup automatically.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nDo not stack multiple `<slice-toast>` elements manually — use `ToastProvider` for programmatic management. Avoid toasts for critical or mandatory information; prefer inline messages or modals for content users must acknowledge.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"message\": \"File saved successfully\",\r\n  \"type\": \"success\",\r\n  \"duration\": 0\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"message\": \"File saved successfully\",\r\n  \"type\": \"success\",\r\n  \"duration\": 0\r\n}");
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
            const lines = ["| Type      | Description        | Icon |\r","|-----------|--------------------|------|\r","| `success` | Positive feedback  | ✓    |\r","| `error`   | Failure / problem  | ✕    |\r","| `warning` | Heads-up / caution | ⚠    |\r","| `info`    | General info       | ℹ    |\r","| `default` | Neutral (no icon)  | —    |\r"];
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
            const lines = ["| Prop           | Type              | Default     | Description                             |\r","|----------------|-------------------|-------------|-----------------------------------------|\r","| `message`      | `string`          | `''`        | Notification text                       |\r","| `type`         | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |\r","| `duration`     | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky        |\r","| `dismissable`  | `boolean`         | `true`      | Show close button                       |\r","| `customColor`  | `object \\| null`  | `null`      | `{ background, text, accent }`          |\r"];
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

customElements.define('slice-toastdocumentation', ToastDocumentation);
