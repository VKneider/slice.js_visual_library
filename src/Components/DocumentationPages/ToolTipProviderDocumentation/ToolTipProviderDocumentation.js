export default class ToolTipProviderDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Data-attribute scope","expected":"three buttons share one tooltip bubble","kind":"script","content":"const container = document.createElement('div');\ncontainer.innerHTML = `\n  <div style=\"display:flex;gap:10px;margin-top:12px;\">\n    <button data-tooltip=\"Search documents\" data-tooltip-placement=\"bottom\">Search</button>\n    <button data-tooltip=\"Download report as PDF\" data-tooltip-placement=\"bottom\">Download</button>\n    <button data-tooltip=\"Delete permanently\" data-tooltip-placement=\"bottom\">Delete</button>\n  </div>\n`;\n\nconst tp = await slice.build('ToolTipProvider');\ntp.scope(container);\n\nconst note = document.createElement('p');\nnote.textContent = 'All three buttons share one bubble. Hover each to see the tooltip.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(container);\nreturn wrapper;"},{"label":"Programmatic attach","expected":"two programmatic tooltips with different placement","kind":"script","content":"const btn1 = document.createElement('button');\nbtn1.textContent = 'Top tooltip';\nObject.assign(btn1.style, { marginRight: '30px', padding: '6px 14px' });\n\nconst btn2 = document.createElement('button');\nbtn2.textContent = 'Right tooltip';\nObject.assign(btn2.style, { padding: '6px 14px' });\n\nconst tp2 = await slice.build('ToolTipProvider');\ntp2.attach(btn1, { text: 'Appears on top', placement: 'top', offset: 8 });\ntp2.attach(btn2, { text: 'Appears on the right side', placement: 'right', hideDelay: 300 });\n\nconst note = document.createElement('p');\nnote.textContent = 'Top tooltip uses offset=8; right tooltip uses hideDelay=300ms.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(btn1);\nwrapper.appendChild(btn2);\nreturn wrapper;"},{"label":"Custom color via provider","expected":"brand-colored tooltip bubble","kind":"script","content":"const btn = document.createElement('button');\nbtn.textContent = 'Brand tooltip';\nObject.assign(btn.style, { padding: '6px 14px' });\n\nconst tp3 = await slice.build('ToolTipProvider');\ntp3.attach(btn, {\n  text: 'Matches brand colors',\n  placement: 'bottom',\n  customColor: { background: '#7c3aed', text: '#ffffff' }\n});\n\nconst note = document.createElement('p');\nnote.textContent = 'customColor is applied to the shared bubble.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(btn);\nreturn wrapper;"}];
  }

  async init() {
    this.markdownPath = "tooltip-provider.md";
    this.markdownContent = "---\ntitle: ToolTipProvider\nroute: /docs/services/tooltip-provider\nnavLabel: ToolTipProvider\nsection: Services\ngroup: Overlay\norder: 15\ndescription: Lightweight singleton Service for efficient tooltip management via programmatic and data-attribute APIs.\ncomponent: ToolTipProviderDocumentation\ngenerate: true\ntags: [tooltip, provider, service, overlay]\n---\n\n# ToolTipProvider\n\n## Overview\n`ToolTipProvider` is a **Service** — a lightweight singleton that manages N tooltip triggers through a **single shared bubble** and **one set of global listeners**. Use it when you have many tooltips on a page and want optimal performance.\n\nUnlike the `<slice-tooltip>` custom element (one bubble + listeners per instance), `ToolTipProvider` reuses everything:\n\n| Aspect | `<slice-tooltip>` (×N) | `ToolTipProvider` |\n|---|---|---|\n| Bubbles in DOM | N | 1 |\n| Global listeners | 3 × N | 3 |\n| Show/hide timers | N pairs | 1 pair |\n\n## Getting Started\nBuild a `ToolTipProvider` instance and call its methods against trigger elements:\n\n```javascript\nconst tp = await slice.build('ToolTipProvider');\ntp.attach(document.getElementById('save-btn'), {\n  text: 'Save changes',\n  placement: 'bottom'\n});\n```\n\nFor a shared singleton across your app, build with a fixed `sliceId`:\n\n```javascript\nconst tp = await slice.build('ToolTipProvider', { sliceId: 'app-tooltip' });\n```\n\n## API\n\n### `attach(element, config?)`\nRegisters an element as a tooltip trigger.\n\n| Param | Type | Default | Description |\n|---|---|---|---|\n| `element` | `Element` | — | The trigger node. Gets `tabindex=\"0\"` and event listeners. |\n| `config.text` | `string` | `data-tooltip` attr or `''` | Tooltip text. Empty = no bubble. |\n| `config.placement` | `string` | `data-tooltip-placement` or `'top'` | `'top'` \\| `'bottom'` \\| `'left'` \\| `'right'` |\n| `config.offset` | `number` | `data-tooltip-offset` or `10` | Gap from trigger (min `4`). |\n| `config.maxWidth` | `number` | `data-tooltip-max-width` or `300` | Bubble max-width (min `120`). |\n| `config.showDelay` | `number` | `data-tooltip-show-delay` or `0` | ms before bubble appears. |\n| `config.hideDelay` | `number` | `data-tooltip-hide-delay` or `120` | ms before bubble hides. |\n| `config.customColor` | `object` | `null` | `{ background, text }` |\n\n```javascript title=\"Programmatic attach\"\ntp.attach(document.getElementById('save-btn'), {\n  text: 'Save changes',\n  placement: 'bottom'\n});\n```\n\n### `detach(element)`\nUnregisters a trigger and removes its listeners.\n\n```javascript\ntp.detach(element);\n```\n\n### `scope(container)`\nScans `container` for `[data-tooltip]` elements and attaches each one. Config is read from `data-*` attributes:\n\n| Attribute | Maps to |\n|---|---|\n| `data-tooltip` | `text` |\n| `data-tooltip-placement` | `placement` |\n| `data-tooltip-offset` | `offset` |\n| `data-tooltip-max-width` | `maxWidth` |\n| `data-tooltip-show-delay` | `showDelay` |\n| `data-tooltip-hide-delay` | `hideDelay` |\n\n```html title=\"HTML with data attributes\"\n<div class=\"toolbar\">\n  <button data-tooltip=\"Search\" data-tooltip-placement=\"bottom\">Search</button>\n  <button data-tooltip=\"Download\" data-tooltip-placement=\"bottom\">Download</button>\n  <button data-tooltip=\"Delete\" data-tooltip-placement=\"bottom\" data-tooltip-offset=\"6\">Delete</button>\n</div>\n```\n\n```javascript title=\"Scan once\"\ntp.scope(document.querySelector('.toolbar'));\n```\n\n### Cleanup\nAs an app-lifetime singleton, `ToolTipProvider` removes all triggers, the shared bubble, and its global listeners automatically via the framework's `beforeDestroy` hook when it is torn down — you don't clean it up by hand. Use `detach(element)` to unregister a single trigger.\n\n## Live Demos\n\n:::script label=\"Data-attribute scope\" expected=\"three buttons share one tooltip bubble\"\nconst container = document.createElement('div');\ncontainer.innerHTML = `\n  <div style=\"display:flex;gap:10px;margin-top:12px;\">\n    <button data-tooltip=\"Search documents\" data-tooltip-placement=\"bottom\">Search</button>\n    <button data-tooltip=\"Download report as PDF\" data-tooltip-placement=\"bottom\">Download</button>\n    <button data-tooltip=\"Delete permanently\" data-tooltip-placement=\"bottom\">Delete</button>\n  </div>\n`;\n\nconst tp = await slice.build('ToolTipProvider');\ntp.scope(container);\n\nconst note = document.createElement('p');\nnote.textContent = 'All three buttons share one bubble. Hover each to see the tooltip.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(container);\nreturn wrapper;\n:::\n\n:::script label=\"Programmatic attach\" expected=\"two programmatic tooltips with different placement\"\nconst btn1 = document.createElement('button');\nbtn1.textContent = 'Top tooltip';\nObject.assign(btn1.style, { marginRight: '30px', padding: '6px 14px' });\n\nconst btn2 = document.createElement('button');\nbtn2.textContent = 'Right tooltip';\nObject.assign(btn2.style, { padding: '6px 14px' });\n\nconst tp2 = await slice.build('ToolTipProvider');\ntp2.attach(btn1, { text: 'Appears on top', placement: 'top', offset: 8 });\ntp2.attach(btn2, { text: 'Appears on the right side', placement: 'right', hideDelay: 300 });\n\nconst note = document.createElement('p');\nnote.textContent = 'Top tooltip uses offset=8; right tooltip uses hideDelay=300ms.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(btn1);\nwrapper.appendChild(btn2);\nreturn wrapper;\n:::\n\n:::script label=\"Custom color via provider\" expected=\"brand-colored tooltip bubble\"\nconst btn = document.createElement('button');\nbtn.textContent = 'Brand tooltip';\nObject.assign(btn.style, { padding: '6px 14px' });\n\nconst tp3 = await slice.build('ToolTipProvider');\ntp3.attach(btn, {\n  text: 'Matches brand colors',\n  placement: 'bottom',\n  customColor: { background: '#7c3aed', text: '#ffffff' }\n});\n\nconst note = document.createElement('p');\nnote.textContent = 'customColor is applied to the shared bubble.';\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(btn);\nreturn wrapper;\n:::\n\n## When to Use Which\n\n| Scenario | Use |\n|---|---|\n| 1–3 tooltips, declarative markup | `<slice-tooltip>` component |\n| 10+ tooltips, dynamic content | `ToolTipProvider` |\n| Toolbar with icon buttons | `ToolTipProvider.scope()` + data attributes |\n| App-wide shared singleton | `slice.getComponent('ToolTipProvider')` |\n\n## Best Practices\n:::tip\nUse `scope()` on a container after the DOM is ready — it scans for `[data-tooltip]` once. For dynamic content, call `attach()` when new elements are inserted and `detach()` when removed.\n:::\n\n## Pitfalls\n:::warning\n`ToolTipProvider` uses a **shared bubble** — only one tooltip is visible at a time. If you need simultaneous tooltips (e.g., comparison of two elements), use individual `<slice-tooltip>` components instead.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| Aspect | `<slice-tooltip>` (×N) | `ToolTipProvider` |","|---|---|---|","| Bubbles in DOM | N | 1 |","| Global listeners | 3 × N | 3 |","| Show/hide timers | N pairs | 1 pair |"];
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
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const tp = await slice.build('ToolTipProvider');\ntp.attach(document.getElementById('save-btn'), {\n  text: 'Save changes',\n  placement: 'bottom'\n});",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const tp = await slice.build('ToolTipProvider', { sliceId: 'app-tooltip' });",
               language: "javascript"
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
            const lines = ["| Param | Type | Default | Description |","|---|---|---|---|","| `element` | `Element` | — | The trigger node. Gets `tabindex=\"0\"` and event listeners. |","| `config.text` | `string` | `data-tooltip` attr or `''` | Tooltip text. Empty = no bubble. |","| `config.placement` | `string` | `data-tooltip-placement` or `'top'` | `'top'` \\| `'bottom'` \\| `'left'` \\| `'right'` |","| `config.offset` | `number` | `data-tooltip-offset` or `10` | Gap from trigger (min `4`). |","| `config.maxWidth` | `number` | `data-tooltip-max-width` or `300` | Bubble max-width (min `120`). |","| `config.showDelay` | `number` | `data-tooltip-show-delay` or `0` | ms before bubble appears. |","| `config.hideDelay` | `number` | `data-tooltip-hide-delay` or `120` | ms before bubble hides. |","| `config.customColor` | `object` | `null` | `{ background, text }` |"];
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
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "tp.attach(document.getElementById('save-btn'), {\n  text: 'Save changes',\n  placement: 'bottom'\n});",
               language: "javascript"
            });
            if ("Programmatic attach") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Programmatic attach";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "tp.detach(element);",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const lines = ["| Attribute | Maps to |","|---|---|","| `data-tooltip` | `text` |","| `data-tooltip-placement` | `placement` |","| `data-tooltip-offset` | `offset` |","| `data-tooltip-max-width` | `maxWidth` |","| `data-tooltip-show-delay` | `showDelay` |","| `data-tooltip-hide-delay` | `hideDelay` |"];
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
            const code = await slice.build('CodeVisualizer', {
               value: "<div class=\"toolbar\">\n  <button data-tooltip=\"Search\" data-tooltip-placement=\"bottom\">Search</button>\n  <button data-tooltip=\"Download\" data-tooltip-placement=\"bottom\">Download</button>\n  <button data-tooltip=\"Delete\" data-tooltip-placement=\"bottom\" data-tooltip-offset=\"6\">Delete</button>\n</div>",
               language: "html"
            });
            if ("HTML with data attributes") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "HTML with data attributes";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "tp.scope(document.querySelector('.toolbar'));",
               language: "javascript"
            });
            if ("Scan once") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Scan once";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-13"]');
         if (container) {
            const lines = ["| Scenario | Use |","|---|---|","| 1–3 tooltips, declarative markup | `<slice-tooltip>` component |","| 10+ tooltips, dynamic content | `ToolTipProvider` |","| Toolbar with icon buttons | `ToolTipProvider.scope()` + data attributes |","| App-wide shared singleton | `slice.getComponent('ToolTipProvider')` |"];
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

customElements.define('slice-tooltipproviderdocumentation', ToolTipProviderDocumentation);
