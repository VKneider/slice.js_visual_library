export default class ToastProviderDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\nconst btn = await slice.build('Button', {\n  value: 'Show toast',\n  onClick: () => provider.show('Hello from ToastProvider!', { type: 'success' })\n});\nmount(btn);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexWrap = 'wrap';\ncontainer.style.gap = '0.5rem';\n\nconst types = [\n  { value: 'Success', type: 'success', message: 'Operation completed successfully' },\n  { value: 'Error', type: 'error', message: 'Something went wrong' },\n  { value: 'Warning', type: 'warning', message: 'Check your input' },\n  { value: 'Info', type: 'info', message: 'New version available' },\n  { value: 'Default', type: 'default', message: 'Plain notification' }\n];\n\nfor (const t of types) {\n  const btn = await slice.build('Button', {\n    value: t.value, onClick: () => provider.show(t.message, { type: t.type })\n  });\n  container.appendChild(btn);\n}\nmount(container);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexWrap = 'wrap';\ncontainer.style.gap = '0.5rem';\n\nconst stickyBtn = await slice.build('Button', {\n  value: 'Sticky (stays open)', onClick: () => provider.show('Close me manually', { duration: 0 })\n});\ncontainer.appendChild(stickyBtn);\n\nconst shortBtn = await slice.build('Button', {\n  value: 'Short (1s)', onClick: () => provider.show('Quick toast!', { duration: 1000 })\n});\ncontainer.appendChild(shortBtn);\n\nmount(container);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\nconst btn = await slice.build('Button', {\n  value: 'Non-dismissable toast',\n  onClick: () => provider.show('Auto-dismiss only — no close button', { dismissable: false, duration: 3000 })\n});\nmount(btn);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\nconst btn = await slice.build('Button', {\n  value: 'Custom styled toast',\n  onClick: () => provider.show('Dark blue custom theme', {\n    type: 'info', duration: 0,\n    customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }\n  })\n});\nmount(btn);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\nlet lastId = null;\nconst showBtn = await slice.build('Button', {\n  value: 'Show toast',\n  onClick: async () => { lastId = await provider.show('Dismiss me with the button below', { duration: 0 }); }\n});\nconst dismissBtn = await slice.build('Button', {\n  value: 'Dismiss it',\n  onClick: () => { if (lastId) provider.dismiss(lastId); }\n});\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.gap = '0.5rem';\ncontainer.appendChild(showBtn);\ncontainer.appendChild(dismissBtn);\nmount(container);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexWrap = 'wrap';\ncontainer.style.gap = '0.5rem';\n\nconst showManyBtn = await slice.build('Button', {\n  value: 'Stack 3 toasts',\n  onClick: async () => {\n    await provider.show('Toast A', { type: 'info', duration: 0 });\n    await provider.show('Toast B', { type: 'warning', duration: 0 });\n    await provider.show('Toast C', { type: 'error', duration: 0 });\n  }\n});\ncontainer.appendChild(showManyBtn);\n\nconst clearBtn = await slice.build('Button', {\n  value: 'Clear all',\n  onClick: () => provider.clear()\n});\ncontainer.appendChild(clearBtn);\n\nmount(container);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexWrap = 'wrap';\ncontainer.style.gap = '0.5rem';\n\nconst positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];\nfor (const pos of positions) {\n  const btn = await slice.build('Button', {\n    value: pos,\n    onClick: () => { provider.setPosition(pos); provider.show('Position: ' + pos, { type: 'info', duration: 1500 }); }\n  });\n  container.appendChild(btn);\n}\nmount(container);"}];
  }

  async init() {
    this.markdownPath = "toast-provider.md";
    this.markdownContent = "---\ntitle: ToastProvider\nroute: /docs/services/toast-provider\nnavLabel: ToastProvider\nsection: Services\ngroup: Feedback\norder: 50\ndescription: Singleton service for programmatic toast management — show, dismiss, clear, and position notifications.\ncomponent: ToastProviderDocumentation\ngenerate: true\ntags: [toast, provider, service, notification]\n---\n\n# ToastProvider\n\nToastProvider is a singleton **Service** that manages a stack of notifications.  \nUnlike manually placing `<slice-toast>` elements, it handles the container, queue limits, positioning, and cleanup for you.\n\n> See the [Toast](/docs/visual/toast) component for the visual building block.\n\n## Getting the instance\n\n`ToastProvider` is registered as a `\"Service\"` type component. Build it to access the singleton:\n\n```js\nconst provider = await slice.build('ToastProvider');\n```\n\nBecause it is a singleton, build it once and recover the same instance anywhere with `slice.getComponent('ToastProvider')`.\n\n## Basic usage\n\n:::script\nconst provider = await slice.build('ToastProvider');\nconst btn = await slice.build('Button', {\n  value: 'Show toast',\n  onClick: () => provider.show('Hello from ToastProvider!', { type: 'success' })\n});\nmount(btn);\n:::\n\n## Toast types\n\nButtons for each type: success, error, warning, info, and default (no icon).\n\n:::script\nconst provider = await slice.build('ToastProvider');\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexWrap = 'wrap';\ncontainer.style.gap = '0.5rem';\n\nconst types = [\n  { value: 'Success', type: 'success', message: 'Operation completed successfully' },\n  { value: 'Error', type: 'error', message: 'Something went wrong' },\n  { value: 'Warning', type: 'warning', message: 'Check your input' },\n  { value: 'Info', type: 'info', message: 'New version available' },\n  { value: 'Default', type: 'default', message: 'Plain notification' }\n];\n\nfor (const t of types) {\n  const btn = await slice.build('Button', {\n    value: t.value, onClick: () => provider.show(t.message, { type: t.type })\n  });\n  container.appendChild(btn);\n}\nmount(container);\n:::\n\n## Configuration\n\n| Config        | Type              | Default     | Description                     |\n|---------------|-------------------|-------------|---------------------------------|\n| `type`        | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |\n| `duration`    | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky |\n| `dismissable` | `boolean`         | `true`      | Show close button               |\n| `customColor` | `object \\| null`  | `null`      | `{ background, text, accent }`  |\n\n### Duration\n\nSticky toasts (`duration: 0`) stay until manually closed. Short durations auto-dismiss quickly.\n\n:::script\nconst provider = await slice.build('ToastProvider');\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexWrap = 'wrap';\ncontainer.style.gap = '0.5rem';\n\nconst stickyBtn = await slice.build('Button', {\n  value: 'Sticky (stays open)', onClick: () => provider.show('Close me manually', { duration: 0 })\n});\ncontainer.appendChild(stickyBtn);\n\nconst shortBtn = await slice.build('Button', {\n  value: 'Short (1s)', onClick: () => provider.show('Quick toast!', { duration: 1000 })\n});\ncontainer.appendChild(shortBtn);\n\nmount(container);\n:::\n\n### Non-dismissable\n\nHide the close button for notifications that should auto-dismiss only.\n\n:::script\nconst provider = await slice.build('ToastProvider');\nconst btn = await slice.build('Button', {\n  value: 'Non-dismissable toast',\n  onClick: () => provider.show('Auto-dismiss only — no close button', { dismissable: false, duration: 3000 })\n});\nmount(btn);\n:::\n\n### Custom color\n\nApply a custom background, text, and accent.\n\n:::script\nconst provider = await slice.build('ToastProvider');\nconst btn = await slice.build('Button', {\n  value: 'Custom styled toast',\n  onClick: () => provider.show('Dark blue custom theme', {\n    type: 'info', duration: 0,\n    customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }\n  })\n});\nmount(btn);\n:::\n\n## Manual dismiss\n\n`show()` returns a unique id. Pass it to `dismiss(id)` to close a specific toast programmatically.\n\n:::script\nconst provider = await slice.build('ToastProvider');\nlet lastId = null;\nconst showBtn = await slice.build('Button', {\n  value: 'Show toast',\n  onClick: async () => { lastId = await provider.show('Dismiss me with the button below', { duration: 0 }); }\n});\nconst dismissBtn = await slice.build('Button', {\n  value: 'Dismiss it',\n  onClick: () => { if (lastId) provider.dismiss(lastId); }\n});\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.gap = '0.5rem';\ncontainer.appendChild(showBtn);\ncontainer.appendChild(dismissBtn);\nmount(container);\n:::\n\n## Clear all\n\nRemove every visible toast at once.\n\n:::script\nconst provider = await slice.build('ToastProvider');\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexWrap = 'wrap';\ncontainer.style.gap = '0.5rem';\n\nconst showManyBtn = await slice.build('Button', {\n  value: 'Stack 3 toasts',\n  onClick: async () => {\n    await provider.show('Toast A', { type: 'info', duration: 0 });\n    await provider.show('Toast B', { type: 'warning', duration: 0 });\n    await provider.show('Toast C', { type: 'error', duration: 0 });\n  }\n});\ncontainer.appendChild(showManyBtn);\n\nconst clearBtn = await slice.build('Button', {\n  value: 'Clear all',\n  onClick: () => provider.clear()\n});\ncontainer.appendChild(clearBtn);\n\nmount(container);\n:::\n\n## Positioning\n\nChange the position of the toast stack with `setPosition(position)`.\n\n| Position          | Description             |\n|-------------------|-------------------------|\n| `top-right`       | Top-right corner (default) |\n| `top-left`        | Top-left corner         |\n| `bottom-right`    | Bottom-right corner     |\n| `bottom-left`     | Bottom-left corner      |\n| `top-center`      | Top center              |\n| `bottom-center`   | Bottom center           |\n\n:::script\nconst provider = await slice.build('ToastProvider');\nconst container = document.createElement('div');\ncontainer.style.display = 'flex';\ncontainer.style.flexWrap = 'wrap';\ncontainer.style.gap = '0.5rem';\n\nconst positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];\nfor (const pos of positions) {\n  const btn = await slice.build('Button', {\n    value: pos,\n    onClick: () => { provider.setPosition(pos); provider.show('Position: ' + pos, { type: 'info', duration: 1500 }); }\n  });\n  container.appendChild(btn);\n}\nmount(container);\n:::\n\n## API\n\n| Method                                    | Returns    | Description                              |\n|-------------------------------------------|------------|------------------------------------------|\n| `show(message, config?)`                  | `string`   | Shows a toast, returns its unique id     |\n| `dismiss(id)`                             | `this`     | Dismisses the toast with the given id    |\n| `clear()`                                 | `this`     | Dismisses all visible toasts             |\n| `setPosition(position)`                   | `this`     | Changes the position                     |\n\n## Best practices\n\n- Build the provider once with `slice.build('ToastProvider')` and reuse the instance — it's a singleton.\n- Use `clear()` before changing routes or views to avoid stale notifications.\n- Use `duration: 0` for toasts that require user action to dismiss.\n- All six positions work with the stack layout — toasts never overlap.\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const provider = await slice.build('ToastProvider');",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            const lines = ["| Config        | Type              | Default     | Description                     |","|---------------|-------------------|-------------|---------------------------------|","| `type`        | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |","| `duration`    | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky |","| `dismissable` | `boolean`         | `true`      | Show close button               |","| `customColor` | `object \\| null`  | `null`      | `{ background, text, accent }`  |"];
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
         const container = this.querySelector('[data-block-id="doc-block-10"]');
         if (container) {
            const lines = ["| Position          | Description             |","|-------------------|-------------------------|","| `top-right`       | Top-right corner (default) |","| `top-left`        | Top-left corner         |","| `bottom-right`    | Bottom-right corner     |","| `bottom-left`     | Bottom-left corner      |","| `top-center`      | Top center              |","| `bottom-center`   | Bottom center           |"];
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
         const container = this.querySelector('[data-block-id="doc-block-12"]');
         if (container) {
            const lines = ["| Method                                    | Returns    | Description                              |","|-------------------------------------------|------------|------------------------------------------|","| `show(message, config?)`                  | `string`   | Shows a toast, returns its unique id     |","| `dismiss(id)`                             | `this`     | Dismisses the toast with the given id    |","| `clear()`                                 | `this`     | Dismisses all visible toasts             |","| `setPosition(position)`                   | `this`     | Changes the position                     |"];
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

customElements.define('slice-toastproviderdocumentation', ToastProviderDocumentation);
