export default class ToolTipProviderDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"A toolbar from data attributes","expected":"a toolbar of icon buttons described only by data attributes, sharing one bubble; most buttons show a shortcut; moving along shows each label at once after the first","kind":"script","content":"const tips = await slice.build('ToolTipProvider', { singleton: true });\nconst tools = [\n  ['letter-bold', 'Bold', '⌘B'], ['letter-italic', 'Italic', '⌘I'], ['letter-underline', 'Underline', '⌘U'], null,\n  ['list', 'Bulleted list', '⇧⌘8'], ['align-center', 'Centre', '⇧⌘E'], null,\n  ['link', 'Insert link', '⌘K'], ['image', 'Insert image', ''], ['table-row', 'Insert a row', '']\n];\nconst bar = document.createElement('div');\nbar.setAttribute('role', 'toolbar');\nbar.setAttribute('aria-label', 'Formatting');\nbar.style.cssText = 'display:inline-flex;flex-wrap:wrap;gap:4px;padding:6px;border:1px solid var(--slice-border-raised);border-radius:12px';\nfor (const tool of tools) {\n  if (!tool) {\n    const sep = document.createElement('span');\n    sep.style.cssText = 'width:1px;margin:4px 4px;background:var(--slice-border-raised)';\n    bar.appendChild(sep);\n    continue;\n  }\n  const [icon, label, shortcut] = tool;\n  const button = await slice.build('Button', { value: '', ariaLabel: label, icon, variant: 'ghost', size: 'sm' });\n  // The tooltip lives in attributes: no ToolTip component per button.\n  button.dataset.tooltip = label;\n  if (shortcut) button.dataset.tooltipShortcut = shortcut;\n  button.dataset.tooltipPlacement = 'bottom';\n  bar.appendChild(button);\n}\ntips.scope(bar);\nreturn bar;"},{"label":"Truncated cells in a growing list","expected":"a list of files whose long names are cut with an ellipsis; hovering or tabbing to a name shows it in full; Add file adds rows that get tooltips without any extra call","kind":"script","content":"const tips = await slice.build('ToolTipProvider', { singleton: true });\nconst list = document.createElement('ul');\nlist.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;grid-template-columns:minmax(0,1fr);gap:6px;width:min(320px,100%)';\n\nconst names = [\n  'Quarterly financial report – final version (approved by the board).pdf',\n  'Team offsite photos, Mérida, October 2026.zip',\n  'contract-acme-renewal-2027-signed.docx'\n];\nlet n = 0;\nconst addRow = (name) => {\n  const li = document.createElement('li');\n  li.style.cssText = 'display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--slice-border-raised);border-radius:10px';\n  const label = document.createElement('span');\n  label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0';\n  label.textContent = name;\n  // The full name, for when it does not fit.\n  label.dataset.tooltip = name;\n  label.dataset.tooltipPlacement = 'top-start';\n  label.tabIndex = 0;\n  li.appendChild(label);\n  list.appendChild(li);\n};\nnames.forEach(addRow);\n// One call for the list: rows added later are covered too.\ntips.scope(list);\n\nconst add = await slice.build('Button', {\n  value: 'Add file', icon: 'plus', variant: 'outlined', size: 'sm',\n  onClick: () => addRow(`Scanned receipt ${++n} – supermarket, pharmacy and fuel for the month.pdf`)\n});\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;justify-items:start';\nbox.append(list, add);\nreturn box;"},{"label":"Attach from code, with a toggletip","expected":"three Buttons get rich tooltips through attach(); an ⓘ gets a toggletip that opens on click and holds a link","kind":"script","content":"const tips = await slice.build('ToolTipProvider', { singleton: true });\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap';\n\nconst save = await slice.build('Button', { value: 'Save', icon: 'download' });\nconst share = await slice.build('Button', { value: 'Share', icon: 'share-nodes', variant: 'outlined' });\nconst archive = await slice.build('Button', { value: 'Archive', icon: 'archive', variant: 'ghost' });\ntips.attach(save, { text: 'Save the draft', shortcut: '⌘S' });\ntips.attach(share, { title: 'Share', text: 'Anyone with the link can view it.', variant: 'light', placement: 'bottom' });\ntips.attach(archive, { text: 'Move it out of the list. You can restore it later.', variant: 'accent', placement: 'right' });\n\nconst info = await slice.build('Button', { value: '', ariaLabel: 'About sharing', icon: 'info-circle', variant: 'ghost', size: 'sm' });\ntips.attach(info, { mode: 'toggletip', title: 'About sharing', text: 'Links expire after 30 days. Manage them in Settings → Sharing.', variant: 'light' });\n\nrow.append(save, share, archive, info);\nreturn row;"}];
  }

  async init() {
    this.markdownPath = "tooltip-provider.md";
    this.markdownContent = "---\ntitle: ToolTipProvider\nroute: /docs/services/tooltip-provider\nnavLabel: ToolTipProvider\nsection: Services\ngroup: Overlay\norder: 15\ndescription: Tooltips for many elements with one shared bubble and no component per trigger. Data attributes or attach(), elements added later included, and the same behaviour as ToolTip.\ncomponent: ToolTipProviderDocumentation\ngenerate: true\ntags: [tooltip, provider, service, overlay, data-attributes]\n---\n\n# ToolTipProvider\n\n## Overview\n`ToolTipProvider` is a Service that gives tooltips to many elements with **one shared bubble** and **one set of listeners on the document**. Nothing is built per trigger: a toolbar of twenty buttons or a table of a thousand cells costs one bubble.\n\nIt behaves exactly like [ToolTip](/docs/display/tooltip), because both run on the same code:\n- the delay and warm-up;\n- the top layer above Modals;\n- Escape, hovering the bubble, a long press on touch;\n- title and shortcut, twelve placements, the variants, and toggletips.\n\n```javascript\nconst tips = await slice.build('ToolTipProvider', { singleton: true });\ntips.scope(document.querySelector('#toolbar'));         // every [data-tooltip] inside\ntips.attach(saveButton, { text: 'Save', shortcut: '⌘S' });\n```\n\n`{ singleton: true }` makes every build return the same provider, so the whole app shares one. A second provider logs a warning.\n\n### ToolTip or ToolTipProvider?\n| You have | Use |\n|---|---|\n| A few tooltips you build with their buttons | `ToolTip` around each one |\n| Many plain tooltips: a toolbar, a table, a list | `ToolTipProvider.scope()` with data attributes |\n| Markup you do not build yourself (HTML from a server, a rich-text editor) | `ToolTipProvider.scope()` |\n| A tooltip with a node inside, or one that changes often | `ToolTip` (`content`, `text`) |\n\n## API\n\n### `scope(container)`\nEvery element with `data-tooltip` (or `data-tooltip-title`) inside `container` gets a tooltip:\n- **including elements added later**, because the provider looks for the trigger when the pointer or the focus arrives, not when you call `scope()`;\n- the attributes are read when the tooltip shows, so changing `data-tooltip` changes the tooltip.\n\n`unscope(container)` stops it.\n\n| Attribute | Same as |\n|---|---|\n| `data-tooltip` | `text` |\n| `data-tooltip-title` | `title` |\n| `data-tooltip-shortcut` | `shortcut` |\n| `data-tooltip-placement` | `placement` (`top`, `bottom-start`, …) |\n| `data-tooltip-variant` | `variant` (`inverse`, `light`, `accent`) |\n| `data-tooltip-size` | `size` (`sm`, `md`) |\n| `data-tooltip-mode` | `mode` (`tooltip`, `toggletip`) |\n| `data-tooltip-offset`, `data-tooltip-max-width` | `offset`, `maxWidth` |\n| `data-tooltip-show-delay`, `data-tooltip-hide-delay` | `showDelay`, `hideDelay` |\n\n### `attach(element, config)` and `detach(element)`\n`attach` gives one element a tooltip from code, with the same options as ToolTip: `text`, `title`, `shortcut`, `placement`, `variant`, `size`, `mode`, `offset`, `maxWidth`, `showDelay`, `hideDelay`, `arrow` and `customColor`.\n- The config wins over the element's data attributes.\n- Calling it again merges the new config into the old one.\n- `detach` removes the tooltip.\n\nConfigs are kept in a `WeakMap`. An element removed from the page takes its config with it, so forgetting `detach` leaks nothing.\n\n### `show(element)` and `hide()`\nThese open and close a tooltip from code. `open` tells whether one is showing.\n\n### Keyboard reach\nAn element with nothing focusable in it (a `<span>`, an icon) gets `tabindex=\"0\"` from `attach()` or `scope()`. Keyboard users can then reach its tooltip, and `detach` takes the tab stop back. Buttons and links already have one, and nothing is added.\n\n### Cleanup\nDestroying the provider (`slice.controller.destroyComponent(tips)`) removes the bubble and the document listeners.\n\n## Examples\n:::script label=\"A toolbar from data attributes\" expected=\"a toolbar of icon buttons described only by data attributes, sharing one bubble; most buttons show a shortcut; moving along shows each label at once after the first\"\nconst tips = await slice.build('ToolTipProvider', { singleton: true });\nconst tools = [\n  ['letter-bold', 'Bold', '⌘B'], ['letter-italic', 'Italic', '⌘I'], ['letter-underline', 'Underline', '⌘U'], null,\n  ['list', 'Bulleted list', '⇧⌘8'], ['align-center', 'Centre', '⇧⌘E'], null,\n  ['link', 'Insert link', '⌘K'], ['image', 'Insert image', ''], ['table-row', 'Insert a row', '']\n];\nconst bar = document.createElement('div');\nbar.setAttribute('role', 'toolbar');\nbar.setAttribute('aria-label', 'Formatting');\nbar.style.cssText = 'display:inline-flex;flex-wrap:wrap;gap:4px;padding:6px;border:1px solid var(--slice-border-raised);border-radius:12px';\nfor (const tool of tools) {\n  if (!tool) {\n    const sep = document.createElement('span');\n    sep.style.cssText = 'width:1px;margin:4px 4px;background:var(--slice-border-raised)';\n    bar.appendChild(sep);\n    continue;\n  }\n  const [icon, label, shortcut] = tool;\n  const button = await slice.build('Button', { value: '', ariaLabel: label, icon, variant: 'ghost', size: 'sm' });\n  // The tooltip lives in attributes: no ToolTip component per button.\n  button.dataset.tooltip = label;\n  if (shortcut) button.dataset.tooltipShortcut = shortcut;\n  button.dataset.tooltipPlacement = 'bottom';\n  bar.appendChild(button);\n}\ntips.scope(bar);\nreturn bar;\n:::\n\n:::script label=\"Truncated cells in a growing list\" expected=\"a list of files whose long names are cut with an ellipsis; hovering or tabbing to a name shows it in full; Add file adds rows that get tooltips without any extra call\"\nconst tips = await slice.build('ToolTipProvider', { singleton: true });\nconst list = document.createElement('ul');\nlist.style.cssText = 'margin:0;padding:0;list-style:none;display:grid;grid-template-columns:minmax(0,1fr);gap:6px;width:min(320px,100%)';\n\nconst names = [\n  'Quarterly financial report – final version (approved by the board).pdf',\n  'Team offsite photos, Mérida, October 2026.zip',\n  'contract-acme-renewal-2027-signed.docx'\n];\nlet n = 0;\nconst addRow = (name) => {\n  const li = document.createElement('li');\n  li.style.cssText = 'display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--slice-border-raised);border-radius:10px';\n  const label = document.createElement('span');\n  label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0';\n  label.textContent = name;\n  // The full name, for when it does not fit.\n  label.dataset.tooltip = name;\n  label.dataset.tooltipPlacement = 'top-start';\n  label.tabIndex = 0;\n  li.appendChild(label);\n  list.appendChild(li);\n};\nnames.forEach(addRow);\n// One call for the list: rows added later are covered too.\ntips.scope(list);\n\nconst add = await slice.build('Button', {\n  value: 'Add file', icon: 'plus', variant: 'outlined', size: 'sm',\n  onClick: () => addRow(`Scanned receipt ${++n} – supermarket, pharmacy and fuel for the month.pdf`)\n});\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:12px;justify-items:start';\nbox.append(list, add);\nreturn box;\n:::\n\n:::script label=\"Attach from code, with a toggletip\" expected=\"three Buttons get rich tooltips through attach(); an ⓘ gets a toggletip that opens on click and holds a link\"\nconst tips = await slice.build('ToolTipProvider', { singleton: true });\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap';\n\nconst save = await slice.build('Button', { value: 'Save', icon: 'download' });\nconst share = await slice.build('Button', { value: 'Share', icon: 'share-nodes', variant: 'outlined' });\nconst archive = await slice.build('Button', { value: 'Archive', icon: 'archive', variant: 'ghost' });\ntips.attach(save, { text: 'Save the draft', shortcut: '⌘S' });\ntips.attach(share, { title: 'Share', text: 'Anyone with the link can view it.', variant: 'light', placement: 'bottom' });\ntips.attach(archive, { text: 'Move it out of the list. You can restore it later.', variant: 'accent', placement: 'right' });\n\nconst info = await slice.build('Button', { value: '', ariaLabel: 'About sharing', icon: 'info-circle', variant: 'ghost', size: 'sm' });\ntips.attach(info, { mode: 'toggletip', title: 'About sharing', text: 'Links expire after 30 days. Manage them in Settings → Sharing.', variant: 'light' });\n\nrow.append(save, share, archive, info);\nreturn row;\n:::\n\n## Best Practices\n:::tip\nUse one provider for the whole app (`{ singleton: true }`) and `scope()` the containers that hold tooltips: the toolbar, the table, the sidebar. Rows and buttons added later are covered with no extra code.\n:::\n\n:::tip\nGive truncated text a tooltip with the full text. Make the element focusable (`tabIndex = 0`) or let `scope()` do it, so keyboard users can read it too.\n:::\n\n## Pitfalls\n:::warning\nOne provider shows one tooltip at a time, and so does ToolTip: opening one closes any other. A comparison that needs two explanations side by side belongs on the page, not in tooltips.\n:::\n\n:::warning\nAn element added after `scope()` does not get the automatic `tabindex`. If it is not focusable on its own (a `<span>`), set `tabIndex = 0` on it, or call `attach()` for it.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const tips = await slice.build('ToolTipProvider', { singleton: true });\ntips.scope(document.querySelector('#toolbar'));         // every [data-tooltip] inside\ntips.attach(saveButton, { text: 'Save', shortcut: '⌘S' });",
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
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| You have | Use |","|---|---|","| A few tooltips you build with their buttons | `ToolTip` around each one |","| Many plain tooltips: a toolbar, a table, a list | `ToolTipProvider.scope()` with data attributes |","| Markup you do not build yourself (HTML from a server, a rich-text editor) | `ToolTipProvider.scope()` |","| A tooltip with a node inside, or one that changes often | `ToolTip` (`content`, `text`) |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const lines = ["| Attribute | Same as |","|---|---|","| `data-tooltip` | `text` |","| `data-tooltip-title` | `title` |","| `data-tooltip-shortcut` | `shortcut` |","| `data-tooltip-placement` | `placement` (`top`, `bottom-start`, …) |","| `data-tooltip-variant` | `variant` (`inverse`, `light`, `accent`) |","| `data-tooltip-size` | `size` (`sm`, `md`) |","| `data-tooltip-mode` | `mode` (`tooltip`, `toggletip`) |","| `data-tooltip-offset`, `data-tooltip-max-width` | `offset`, `maxWidth` |","| `data-tooltip-show-delay`, `data-tooltip-hide-delay` | `showDelay`, `hideDelay` |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
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
         const links = [{"text":"ToolTip","path":"/docs/display/tooltip"}];
         for (const [index, linkProps] of links.entries()) {
            const placeholder = this.querySelector('[data-inline-link="' + index + '"]');
            if (!placeholder) continue;
            const link = await slice.build('Link', linkProps);
            placeholder.replaceWith(link);
            this._inlineLinks.push(link);
         }
      }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: 'Copy as markdown'
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
      // parse as this.scriptScenarios â€” so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all â€” the divs
      // were never filled, nothing in the repo reads .script-block â€” the real demos were
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
