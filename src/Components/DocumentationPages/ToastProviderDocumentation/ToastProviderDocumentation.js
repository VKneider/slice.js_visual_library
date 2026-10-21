export default class ToastProviderDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\r\nconst btn = await slice.build('Button', {\r\n  value: 'Show toast',\r\n  onClick: () => provider.show('Hello from ToastProvider!', { type: 'success' })\r\n});\r\nmount(btn);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexWrap = 'wrap';\r\ncontainer.style.gap = '0.5rem';\r\n\r\nconst types = [\r\n  { value: 'Success', type: 'success', message: 'Operation completed successfully' },\r\n  { value: 'Error', type: 'error', message: 'Something went wrong' },\r\n  { value: 'Warning', type: 'warning', message: 'Check your input' },\r\n  { value: 'Info', type: 'info', message: 'New version available' },\r\n  { value: 'Default', type: 'default', message: 'Plain notification' }\r\n];\r\n\r\nfor (const t of types) {\r\n  const btn = await slice.build('Button', {\r\n    value: t.value, onClick: () => provider.show(t.message, { type: t.type })\r\n  });\r\n  container.appendChild(btn);\r\n}\r\nmount(container);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexWrap = 'wrap';\r\ncontainer.style.gap = '0.5rem';\r\n\r\nconst stickyBtn = await slice.build('Button', {\r\n  value: 'Sticky (stays open)', onClick: () => provider.show('Close me manually', { duration: 0 })\r\n});\r\ncontainer.appendChild(stickyBtn);\r\n\r\nconst shortBtn = await slice.build('Button', {\r\n  value: 'Short (1s)', onClick: () => provider.show('Quick toast!', { duration: 1000 })\r\n});\r\ncontainer.appendChild(shortBtn);\r\n\r\nmount(container);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\r\nconst btn = await slice.build('Button', {\r\n  value: 'Non-dismissable toast',\r\n  onClick: () => provider.show('Auto-dismiss only — no close button', { dismissable: false, duration: 3000 })\r\n});\r\nmount(btn);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\r\nconst btn = await slice.build('Button', {\r\n  value: 'Custom styled toast',\r\n  onClick: () => provider.show('Dark blue custom theme', {\r\n    type: 'info', duration: 0,\r\n    customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }\r\n  })\r\n});\r\nmount(btn);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\r\nlet lastId = null;\r\nconst showBtn = await slice.build('Button', {\r\n  value: 'Show toast',\r\n  onClick: async () => { lastId = await provider.show('Dismiss me with the button below', { duration: 0 }); }\r\n});\r\nconst dismissBtn = await slice.build('Button', {\r\n  value: 'Dismiss it',\r\n  onClick: () => { if (lastId) provider.dismiss(lastId); }\r\n});\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.gap = '0.5rem';\r\ncontainer.appendChild(showBtn);\r\ncontainer.appendChild(dismissBtn);\r\nmount(container);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexWrap = 'wrap';\r\ncontainer.style.gap = '0.5rem';\r\n\r\nconst showManyBtn = await slice.build('Button', {\r\n  value: 'Stack 3 toasts',\r\n  onClick: async () => {\r\n    await provider.show('Toast A', { type: 'info', duration: 0 });\r\n    await provider.show('Toast B', { type: 'warning', duration: 0 });\r\n    await provider.show('Toast C', { type: 'error', duration: 0 });\r\n  }\r\n});\r\ncontainer.appendChild(showManyBtn);\r\n\r\nconst clearBtn = await slice.build('Button', {\r\n  value: 'Clear all',\r\n  onClick: () => provider.clear()\r\n});\r\ncontainer.appendChild(clearBtn);\r\n\r\nmount(container);"},{"label":"Run scenario","expected":"","kind":"script","content":"const provider = await slice.build('ToastProvider');\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexWrap = 'wrap';\r\ncontainer.style.gap = '0.5rem';\r\n\r\nconst positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];\r\nfor (const pos of positions) {\r\n  const btn = await slice.build('Button', {\r\n    value: pos,\r\n    onClick: () => { provider.setPosition(pos); provider.show('Position: ' + pos, { type: 'info', duration: 1500 }); }\r\n  });\r\n  container.appendChild(btn);\r\n}\r\nmount(container);"}];
  }

  async init() {
    this.markdownPath = "toast-provider.md";
    this.markdownContent = "---\r\ntitle: ToastProvider\r\nroute: /docs/services/toast-provider\r\nnavLabel: ToastProvider\r\nsection: Services\r\ngroup: Feedback\r\norder: 50\r\ndescription: Singleton service for programmatic toast management — show, dismiss, clear, and position notifications.\r\ncomponent: ToastProviderDocumentation\r\ngenerate: true\r\ntags: [toast, provider, service, notification]\r\n---\r\n\r\n# ToastProvider\r\n\r\nToastProvider is a singleton **Service** that manages a stack of notifications.  \r\nUnlike manually placing `<slice-toast>` elements, it handles the container, queue limits, positioning, and cleanup for you.\r\n\r\n> See the [Toast](/docs/visual/toast) component for the visual building block.\r\n\r\n## Getting the instance\r\n\r\n`ToastProvider` is registered as a `\"Service\"` type component. Build it to access the singleton:\r\n\r\n```js\r\nconst provider = await slice.build('ToastProvider');\r\n```\r\n\r\nBecause it is a singleton, build it once and recover the same instance anywhere with `slice.getComponent('ToastProvider')`.\r\n\r\n## Basic usage\r\n\r\n:::script\r\nconst provider = await slice.build('ToastProvider');\r\nconst btn = await slice.build('Button', {\r\n  value: 'Show toast',\r\n  onClick: () => provider.show('Hello from ToastProvider!', { type: 'success' })\r\n});\r\nmount(btn);\r\n:::\r\n\r\n## Toast types\r\n\r\nButtons for each type: success, error, warning, info, and default (no icon).\r\n\r\n:::script\r\nconst provider = await slice.build('ToastProvider');\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexWrap = 'wrap';\r\ncontainer.style.gap = '0.5rem';\r\n\r\nconst types = [\r\n  { value: 'Success', type: 'success', message: 'Operation completed successfully' },\r\n  { value: 'Error', type: 'error', message: 'Something went wrong' },\r\n  { value: 'Warning', type: 'warning', message: 'Check your input' },\r\n  { value: 'Info', type: 'info', message: 'New version available' },\r\n  { value: 'Default', type: 'default', message: 'Plain notification' }\r\n];\r\n\r\nfor (const t of types) {\r\n  const btn = await slice.build('Button', {\r\n    value: t.value, onClick: () => provider.show(t.message, { type: t.type })\r\n  });\r\n  container.appendChild(btn);\r\n}\r\nmount(container);\r\n:::\r\n\r\n## Configuration\r\n\r\n| Config        | Type              | Default     | Description                     |\r\n|---------------|-------------------|-------------|---------------------------------|\r\n| `type`        | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |\r\n| `duration`    | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky |\r\n| `dismissable` | `boolean`         | `true`      | Show close button               |\r\n| `customColor` | `object \\| null`  | `null`      | `{ background, text, accent }`  |\r\n\r\n### Duration\r\n\r\nSticky toasts (`duration: 0`) stay until manually closed. Short durations auto-dismiss quickly.\r\n\r\n:::script\r\nconst provider = await slice.build('ToastProvider');\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexWrap = 'wrap';\r\ncontainer.style.gap = '0.5rem';\r\n\r\nconst stickyBtn = await slice.build('Button', {\r\n  value: 'Sticky (stays open)', onClick: () => provider.show('Close me manually', { duration: 0 })\r\n});\r\ncontainer.appendChild(stickyBtn);\r\n\r\nconst shortBtn = await slice.build('Button', {\r\n  value: 'Short (1s)', onClick: () => provider.show('Quick toast!', { duration: 1000 })\r\n});\r\ncontainer.appendChild(shortBtn);\r\n\r\nmount(container);\r\n:::\r\n\r\n### Non-dismissable\r\n\r\nHide the close button for notifications that should auto-dismiss only.\r\n\r\n:::script\r\nconst provider = await slice.build('ToastProvider');\r\nconst btn = await slice.build('Button', {\r\n  value: 'Non-dismissable toast',\r\n  onClick: () => provider.show('Auto-dismiss only — no close button', { dismissable: false, duration: 3000 })\r\n});\r\nmount(btn);\r\n:::\r\n\r\n### Custom color\r\n\r\nApply a custom background, text, and accent.\r\n\r\n:::script\r\nconst provider = await slice.build('ToastProvider');\r\nconst btn = await slice.build('Button', {\r\n  value: 'Custom styled toast',\r\n  onClick: () => provider.show('Dark blue custom theme', {\r\n    type: 'info', duration: 0,\r\n    customColor: { background: '#1e3a5f', text: '#e0f2fe', accent: '#38bdf8' }\r\n  })\r\n});\r\nmount(btn);\r\n:::\r\n\r\n## Manual dismiss\r\n\r\n`show()` returns a unique id. Pass it to `dismiss(id)` to close a specific toast programmatically.\r\n\r\n:::script\r\nconst provider = await slice.build('ToastProvider');\r\nlet lastId = null;\r\nconst showBtn = await slice.build('Button', {\r\n  value: 'Show toast',\r\n  onClick: async () => { lastId = await provider.show('Dismiss me with the button below', { duration: 0 }); }\r\n});\r\nconst dismissBtn = await slice.build('Button', {\r\n  value: 'Dismiss it',\r\n  onClick: () => { if (lastId) provider.dismiss(lastId); }\r\n});\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.gap = '0.5rem';\r\ncontainer.appendChild(showBtn);\r\ncontainer.appendChild(dismissBtn);\r\nmount(container);\r\n:::\r\n\r\n## Clear all\r\n\r\nRemove every visible toast at once.\r\n\r\n:::script\r\nconst provider = await slice.build('ToastProvider');\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexWrap = 'wrap';\r\ncontainer.style.gap = '0.5rem';\r\n\r\nconst showManyBtn = await slice.build('Button', {\r\n  value: 'Stack 3 toasts',\r\n  onClick: async () => {\r\n    await provider.show('Toast A', { type: 'info', duration: 0 });\r\n    await provider.show('Toast B', { type: 'warning', duration: 0 });\r\n    await provider.show('Toast C', { type: 'error', duration: 0 });\r\n  }\r\n});\r\ncontainer.appendChild(showManyBtn);\r\n\r\nconst clearBtn = await slice.build('Button', {\r\n  value: 'Clear all',\r\n  onClick: () => provider.clear()\r\n});\r\ncontainer.appendChild(clearBtn);\r\n\r\nmount(container);\r\n:::\r\n\r\n## Positioning\r\n\r\nChange the position of the toast stack with `setPosition(position)`.\r\n\r\n| Position          | Description             |\r\n|-------------------|-------------------------|\r\n| `top-right`       | Top-right corner (default) |\r\n| `top-left`        | Top-left corner         |\r\n| `bottom-right`    | Bottom-right corner     |\r\n| `bottom-left`     | Bottom-left corner      |\r\n| `top-center`      | Top center              |\r\n| `bottom-center`   | Bottom center           |\r\n\r\n:::script\r\nconst provider = await slice.build('ToastProvider');\r\nconst container = document.createElement('div');\r\ncontainer.style.display = 'flex';\r\ncontainer.style.flexWrap = 'wrap';\r\ncontainer.style.gap = '0.5rem';\r\n\r\nconst positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'];\r\nfor (const pos of positions) {\r\n  const btn = await slice.build('Button', {\r\n    value: pos,\r\n    onClick: () => { provider.setPosition(pos); provider.show('Position: ' + pos, { type: 'info', duration: 1500 }); }\r\n  });\r\n  container.appendChild(btn);\r\n}\r\nmount(container);\r\n:::\r\n\r\n## API\r\n\r\n| Method                                    | Returns    | Description                              |\r\n|-------------------------------------------|------------|------------------------------------------|\r\n| `show(message, config?)`                  | `string`   | Shows a toast, returns its unique id     |\r\n| `dismiss(id)`                             | `this`     | Dismisses the toast with the given id    |\r\n| `clear()`                                 | `this`     | Dismisses all visible toasts             |\r\n| `setPosition(position)`                   | `this`     | Changes the position                     |\r\n\r\n## Best practices\r\n\r\n- Build the provider once with `slice.build('ToastProvider')` and reuse the instance — it's a singleton.\r\n- Use `clear()` before changing routes or views to avoid stale notifications.\r\n- Use `duration: 0` for toasts that require user action to dismiss.\r\n- All six positions work with the stack layout — toasts never overlap.\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const provider = await slice.build('ToastProvider');\r",
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
            const lines = ["| Config        | Type              | Default     | Description                     |\r","|---------------|-------------------|-------------|---------------------------------|\r","| `type`        | `string`          | `'default'` | `success`, `error`, `warning`, `info`, `default` |\r","| `duration`    | `number`          | `4000`      | Auto-dismiss in ms. `0` = sticky |\r","| `dismissable` | `boolean`         | `true`      | Show close button               |\r","| `customColor` | `object \\| null`  | `null`      | `{ background, text, accent }`  |\r"];
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
            const lines = ["| Position          | Description             |\r","|-------------------|-------------------------|\r","| `top-right`       | Top-right corner (default) |\r","| `top-left`        | Top-left corner         |\r","| `bottom-right`    | Bottom-right corner     |\r","| `bottom-left`     | Bottom-left corner      |\r","| `top-center`      | Top center              |\r","| `bottom-center`   | Bottom center           |\r"];
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
            const lines = ["| Method                                    | Returns    | Description                              |\r","|-------------------------------------------|------------|------------------------------------------|\r","| `show(message, config?)`                  | `string`   | Shows a toast, returns its unique id     |\r","| `dismiss(id)`                             | `this`     | Dismisses the toast with the given id    |\r","| `clear()`                                 | `this`     | Dismisses all visible toasts             |\r","| `setPosition(position)`                   | `this`     | Changes the position                     |\r"];
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

customElements.define('slice-toastproviderdocumentation', ToastProviderDocumentation);
