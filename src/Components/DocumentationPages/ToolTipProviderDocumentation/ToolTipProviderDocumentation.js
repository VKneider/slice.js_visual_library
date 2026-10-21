export default class ToolTipProviderDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Data-attribute scope","expected":"three buttons share one tooltip bubble","kind":"script","content":"const container = document.createElement('div');\r\ncontainer.innerHTML = `\r\n  <div style=\"display:flex;gap:10px;margin-top:12px;\">\r\n    <button data-tooltip=\"Search documents\" data-tooltip-placement=\"bottom\">Search</button>\r\n    <button data-tooltip=\"Download report as PDF\" data-tooltip-placement=\"bottom\">Download</button>\r\n    <button data-tooltip=\"Delete permanently\" data-tooltip-placement=\"bottom\">Delete</button>\r\n  </div>\r\n`;\r\n\r\nconst tp = await slice.build('ToolTipProvider');\r\ntp.scope(container);\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'All three buttons share one bubble. Hover each to see the tooltip.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(container);\r\nreturn wrapper;"},{"label":"Programmatic attach","expected":"two programmatic tooltips with different placement","kind":"script","content":"const btn1 = document.createElement('button');\r\nbtn1.textContent = 'Top tooltip';\r\nObject.assign(btn1.style, { marginRight: '30px', padding: '6px 14px' });\r\n\r\nconst btn2 = document.createElement('button');\r\nbtn2.textContent = 'Right tooltip';\r\nObject.assign(btn2.style, { padding: '6px 14px' });\r\n\r\nconst tp2 = await slice.build('ToolTipProvider');\r\ntp2.attach(btn1, { text: 'Appears on top', placement: 'top', offset: 8 });\r\ntp2.attach(btn2, { text: 'Appears on the right side', placement: 'right', hideDelay: 300 });\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Top tooltip uses offset=8; right tooltip uses hideDelay=300ms.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(btn1);\r\nwrapper.appendChild(btn2);\r\nreturn wrapper;"},{"label":"Custom color via provider","expected":"brand-colored tooltip bubble","kind":"script","content":"const btn = document.createElement('button');\r\nbtn.textContent = 'Brand tooltip';\r\nObject.assign(btn.style, { padding: '6px 14px' });\r\n\r\nconst tp3 = await slice.build('ToolTipProvider');\r\ntp3.attach(btn, {\r\n  text: 'Matches brand colors',\r\n  placement: 'bottom',\r\n  customColor: { background: '#7c3aed', text: '#ffffff' }\r\n});\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'customColor is applied to the shared bubble.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(btn);\r\nreturn wrapper;"}];
  }

  async init() {
    this.markdownPath = "tooltip-provider.md";
    this.markdownContent = "---\r\ntitle: ToolTipProvider\r\nroute: /docs/services/tooltip-provider\r\nnavLabel: ToolTipProvider\r\nsection: Services\r\ngroup: Overlay\r\norder: 15\r\ndescription: Lightweight singleton Service for efficient tooltip management via programmatic and data-attribute APIs.\r\ncomponent: ToolTipProviderDocumentation\r\ngenerate: true\r\ntags: [tooltip, provider, service, overlay]\r\n---\r\n\r\n# ToolTipProvider\r\n\r\n## Overview\r\n`ToolTipProvider` is a **Service** — a lightweight singleton that manages N tooltip triggers through a **single shared bubble** and **one set of global listeners**. Use it when you have many tooltips on a page and want optimal performance.\r\n\r\nUnlike the `<slice-tooltip>` custom element (one bubble + listeners per instance), `ToolTipProvider` reuses everything:\r\n\r\n| Aspect | `<slice-tooltip>` (×N) | `ToolTipProvider` |\r\n|---|---|---|\r\n| Bubbles in DOM | N | 1 |\r\n| Global listeners | 3 × N | 3 |\r\n| Show/hide timers | N pairs | 1 pair |\r\n\r\n## Getting Started\r\nBuild a `ToolTipProvider` instance and call its methods against trigger elements:\r\n\r\n```javascript\r\nconst tp = await slice.build('ToolTipProvider');\r\ntp.attach(document.getElementById('save-btn'), {\r\n  text: 'Save changes',\r\n  placement: 'bottom'\r\n});\r\n```\r\n\r\nFor a shared singleton across your app, build with a fixed `sliceId`:\r\n\r\n```javascript\r\nconst tp = await slice.build('ToolTipProvider', { sliceId: 'app-tooltip' });\r\n```\r\n\r\n## API\r\n\r\n### `attach(element, config?)`\r\nRegisters an element as a tooltip trigger.\r\n\r\n| Param | Type | Default | Description |\r\n|---|---|---|---|\r\n| `element` | `Element` | — | The trigger node. Gets `tabindex=\"0\"` and event listeners. |\r\n| `config.text` | `string` | `data-tooltip` attr or `''` | Tooltip text. Empty = no bubble. |\r\n| `config.placement` | `string` | `data-tooltip-placement` or `'top'` | `'top'` \\| `'bottom'` \\| `'left'` \\| `'right'` |\r\n| `config.offset` | `number` | `data-tooltip-offset` or `10` | Gap from trigger (min `4`). |\r\n| `config.maxWidth` | `number` | `data-tooltip-max-width` or `300` | Bubble max-width (min `120`). |\r\n| `config.showDelay` | `number` | `data-tooltip-show-delay` or `0` | ms before bubble appears. |\r\n| `config.hideDelay` | `number` | `data-tooltip-hide-delay` or `120` | ms before bubble hides. |\r\n| `config.customColor` | `object` | `null` | `{ background, text }` |\r\n\r\n```javascript title=\"Programmatic attach\"\r\ntp.attach(document.getElementById('save-btn'), {\r\n  text: 'Save changes',\r\n  placement: 'bottom'\r\n});\r\n```\r\n\r\n### `detach(element)`\r\nUnregisters a trigger and removes its listeners.\r\n\r\n```javascript\r\ntp.detach(element);\r\n```\r\n\r\n### `scope(container)`\r\nScans `container` for `[data-tooltip]` elements and attaches each one. Config is read from `data-*` attributes:\r\n\r\n| Attribute | Maps to |\r\n|---|---|\r\n| `data-tooltip` | `text` |\r\n| `data-tooltip-placement` | `placement` |\r\n| `data-tooltip-offset` | `offset` |\r\n| `data-tooltip-max-width` | `maxWidth` |\r\n| `data-tooltip-show-delay` | `showDelay` |\r\n| `data-tooltip-hide-delay` | `hideDelay` |\r\n\r\n```html title=\"HTML with data attributes\"\r\n<div class=\"toolbar\">\r\n  <button data-tooltip=\"Search\" data-tooltip-placement=\"bottom\">Search</button>\r\n  <button data-tooltip=\"Download\" data-tooltip-placement=\"bottom\">Download</button>\r\n  <button data-tooltip=\"Delete\" data-tooltip-placement=\"bottom\" data-tooltip-offset=\"6\">Delete</button>\r\n</div>\r\n```\r\n\r\n```javascript title=\"Scan once\"\r\ntp.scope(document.querySelector('.toolbar'));\r\n```\r\n\r\n### Cleanup\r\nAs an app-lifetime singleton, `ToolTipProvider` removes all triggers, the shared bubble, and its global listeners automatically via the framework's `beforeDestroy` hook when it is torn down — you don't clean it up by hand. Use `detach(element)` to unregister a single trigger.\r\n\r\n## Live Demos\r\n\r\n:::script label=\"Data-attribute scope\" expected=\"three buttons share one tooltip bubble\"\r\nconst container = document.createElement('div');\r\ncontainer.innerHTML = `\r\n  <div style=\"display:flex;gap:10px;margin-top:12px;\">\r\n    <button data-tooltip=\"Search documents\" data-tooltip-placement=\"bottom\">Search</button>\r\n    <button data-tooltip=\"Download report as PDF\" data-tooltip-placement=\"bottom\">Download</button>\r\n    <button data-tooltip=\"Delete permanently\" data-tooltip-placement=\"bottom\">Delete</button>\r\n  </div>\r\n`;\r\n\r\nconst tp = await slice.build('ToolTipProvider');\r\ntp.scope(container);\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'All three buttons share one bubble. Hover each to see the tooltip.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(container);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Programmatic attach\" expected=\"two programmatic tooltips with different placement\"\r\nconst btn1 = document.createElement('button');\r\nbtn1.textContent = 'Top tooltip';\r\nObject.assign(btn1.style, { marginRight: '30px', padding: '6px 14px' });\r\n\r\nconst btn2 = document.createElement('button');\r\nbtn2.textContent = 'Right tooltip';\r\nObject.assign(btn2.style, { padding: '6px 14px' });\r\n\r\nconst tp2 = await slice.build('ToolTipProvider');\r\ntp2.attach(btn1, { text: 'Appears on top', placement: 'top', offset: 8 });\r\ntp2.attach(btn2, { text: 'Appears on the right side', placement: 'right', hideDelay: 300 });\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Top tooltip uses offset=8; right tooltip uses hideDelay=300ms.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(btn1);\r\nwrapper.appendChild(btn2);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Custom color via provider\" expected=\"brand-colored tooltip bubble\"\r\nconst btn = document.createElement('button');\r\nbtn.textContent = 'Brand tooltip';\r\nObject.assign(btn.style, { padding: '6px 14px' });\r\n\r\nconst tp3 = await slice.build('ToolTipProvider');\r\ntp3.attach(btn, {\r\n  text: 'Matches brand colors',\r\n  placement: 'bottom',\r\n  customColor: { background: '#7c3aed', text: '#ffffff' }\r\n});\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'customColor is applied to the shared bubble.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(note);\r\nwrapper.appendChild(btn);\r\nreturn wrapper;\r\n:::\r\n\r\n## When to Use Which\r\n\r\n| Scenario | Use |\r\n|---|---|\r\n| 1–3 tooltips, declarative markup | `<slice-tooltip>` component |\r\n| 10+ tooltips, dynamic content | `ToolTipProvider` |\r\n| Toolbar with icon buttons | `ToolTipProvider.scope()` + data attributes |\r\n| App-wide shared singleton | `slice.getComponent('ToolTipProvider')` |\r\n\r\n## Best Practices\r\n:::tip\r\nUse `scope()` on a container after the DOM is ready — it scans for `[data-tooltip]` once. For dynamic content, call `attach()` when new elements are inserted and `detach()` when removed.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\n`ToolTipProvider` uses a **shared bubble** — only one tooltip is visible at a time. If you need simultaneous tooltips (e.g., comparison of two elements), use individual `<slice-tooltip>` components instead.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| Aspect | `<slice-tooltip>` (×N) | `ToolTipProvider` |\r","|---|---|---|\r","| Bubbles in DOM | N | 1 |\r","| Global listeners | 3 × N | 3 |\r","| Show/hide timers | N pairs | 1 pair |\r"];
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
               value: "const tp = await slice.build('ToolTipProvider');\r\ntp.attach(document.getElementById('save-btn'), {\r\n  text: 'Save changes',\r\n  placement: 'bottom'\r\n});\r",
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
               value: "const tp = await slice.build('ToolTipProvider', { sliceId: 'app-tooltip' });\r",
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
            const lines = ["| Param | Type | Default | Description |\r","|---|---|---|---|\r","| `element` | `Element` | — | The trigger node. Gets `tabindex=\"0\"` and event listeners. |\r","| `config.text` | `string` | `data-tooltip` attr or `''` | Tooltip text. Empty = no bubble. |\r","| `config.placement` | `string` | `data-tooltip-placement` or `'top'` | `'top'` \\| `'bottom'` \\| `'left'` \\| `'right'` |\r","| `config.offset` | `number` | `data-tooltip-offset` or `10` | Gap from trigger (min `4`). |\r","| `config.maxWidth` | `number` | `data-tooltip-max-width` or `300` | Bubble max-width (min `120`). |\r","| `config.showDelay` | `number` | `data-tooltip-show-delay` or `0` | ms before bubble appears. |\r","| `config.hideDelay` | `number` | `data-tooltip-hide-delay` or `120` | ms before bubble hides. |\r","| `config.customColor` | `object` | `null` | `{ background, text }` |\r"];
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
               value: "tp.attach(document.getElementById('save-btn'), {\r\n  text: 'Save changes',\r\n  placement: 'bottom'\r\n});\r",
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
               value: "tp.detach(element);\r",
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
            const lines = ["| Attribute | Maps to |\r","|---|---|\r","| `data-tooltip` | `text` |\r","| `data-tooltip-placement` | `placement` |\r","| `data-tooltip-offset` | `offset` |\r","| `data-tooltip-max-width` | `maxWidth` |\r","| `data-tooltip-show-delay` | `showDelay` |\r","| `data-tooltip-hide-delay` | `hideDelay` |\r"];
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
               value: "<div class=\"toolbar\">\r\n  <button data-tooltip=\"Search\" data-tooltip-placement=\"bottom\">Search</button>\r\n  <button data-tooltip=\"Download\" data-tooltip-placement=\"bottom\">Download</button>\r\n  <button data-tooltip=\"Delete\" data-tooltip-placement=\"bottom\" data-tooltip-offset=\"6\">Delete</button>\r\n</div>\r",
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
               value: "tp.scope(document.querySelector('.toolbar'));\r",
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
            const lines = ["| Scenario | Use |\r","|---|---|\r","| 1–3 tooltips, declarative markup | `<slice-tooltip>` component |\r","| 10+ tooltips, dynamic content | `ToolTipProvider` |\r","| Toolbar with icon buttons | `ToolTipProvider.scope()` + data attributes |\r","| App-wide shared singleton | `slice.getComponent('ToolTipProvider')` |\r"];
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

customElements.define('slice-tooltipproviderdocumentation', ToolTipProviderDocumentation);
