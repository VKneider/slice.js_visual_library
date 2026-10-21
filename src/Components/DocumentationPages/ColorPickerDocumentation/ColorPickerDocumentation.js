export default class ColorPickerDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"plain picker","expected":"a labelled swatch showing its hex value","kind":"script","content":"const picker = await slice.build('ColorPicker', {\n  label: 'Primary color',\n  value: '#9333ea'\n});\nreturn picker;"},{"label":"with a CSS variable hint","expected":"the variable name under the control","kind":"script","content":"const picker = await slice.build('ColorPicker', {\n  label: 'Danger',\n  value: '#dc2626',\n  hint: '--danger-color'\n});\n\nconst host = document.createElement('div');\nhost.style.maxWidth = '280px';\nhost.appendChild(picker);\nreturn host;"},{"label":"colour table","expected":"a row of independent swatches, each with its own value","kind":"script","content":"const tokens = [\n  { label: 'Primary', value: '#9333ea' },\n  { label: 'Secondary', value: '#0891b2' },\n  { label: 'Success', value: '#059669' },\n  { label: 'Warning', value: '#d97706' },\n  { label: 'Danger', value: '#dc2626' }\n];\n\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';\nhost.style.gap = '0.75rem';\n\nfor (const token of tokens) {\n  host.appendChild(await slice.build('ColorPicker', {\n    label: token.label,\n    value: token.value,\n    hint: '--' + token.label.toLowerCase() + '-color'\n  }));\n}\nreturn host;"},{"label":"onChange on every edit","expected":"the swatch updates as the value is dragged","kind":"script","content":"const readout = document.createElement('p');\nreadout.style.fontFamily = 'var(--font-family-code, monospace)';\nreadout.style.marginTop = '0.5rem';\n\nconst picker = await slice.build('ColorPicker', {\n  label: 'Pick a colour',\n  value: '#059669',\n  onChange: (hex) => {\n    readout.textContent = 'onChange -> ' + hex;\n  }\n});\n\nconst host = document.createElement('div');\nhost.style.maxWidth = '280px';\nhost.appendChild(picker);\nhost.appendChild(readout);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "color-picker.md";
    this.markdownContent = "---\ntitle: ColorPicker\nroute: /docs/input/color-picker\nnavLabel: ColorPicker\nsection: Input Components\ngroup: Basic\norder: 17\ndescription: A labelled colour swatch with a hex readout that normalizes any CSS colour before the browser can silently black it out.\ncomponent: ColorPickerDocumentation\ngenerate: true\ntags: [color, colour, picker, swatch, theme, hex, form]\n---\n\n# ColorPicker\n\n## Overview\n\n`ColorPicker` is a labelled colour control: a native swatch, the current hex value, and an\noptional hint line underneath.\n\nIt wraps `<input type=\"color\">` rather than replacing it. The native control carries the OS\ncolour dialog, touch behaviour and keyboard support that a hand-rolled swatch grid never gets\nright for free — what it does not carry is a label, a readable value, or any way to report that\nit could not understand the colour you gave it.\n\n## Core Behavior\n- `label` names the control through a real `<label for>` association, so it appears as the\n  accessible name. Each instance generates its own input id, so several pickers on one page never\n  cross-wire.\n- `value` is always normalized to lowercase `#rrggbb`. `#rgb` is expanded and `rgb()` / `rgba()`\n  (comma or space syntax) are converted.\n- The hex readout mirrors the value. A native colour input shows nothing, so a colour table\n  cannot tell you what it is actually holding.\n- `hint` renders a small monospace line under the control — a CSS variable name, a usage note.\n- `onChange(value)` fires on every `input` event with the normalized hex, so it follows a drag\n  rather than waiting for the dialog to close.\n- `size` (`md` | `sm`) comes from the shared recipe every control validates against.\n- `customColor.accent` tints the swatch **border** only. Filling the swatch would fight the\n  colour the user actually picked, which is the one thing the control exists to show.\n- `disabled` removes the control from interaction.\n\n## Why not a bare `<input type=\"color\">`\n\nThe failure this component exists to absorb is silent. Hand a native colour input `rgb(0 128 0)`,\n`var(--brand)` or `rebeccapurple` and it renders **black** and reports nothing. The result looks\nlike a rendering bug, not a bad argument — so `ColorPicker` normalizes on the way in and shows\nyou the fallback it actually landed on.\n\n## Live Preview\n:::component name=\"ColorPicker\"\n{\n  \"label\": \"Primary color\",\n  \"value\": \"#9333ea\",\n  \"hint\": \"--primary-color\"\n}\n:::\n\n## Prop Scenarios\n:::script label=\"plain picker\" expected=\"a labelled swatch showing its hex value\"\nconst picker = await slice.build('ColorPicker', {\n  label: 'Primary color',\n  value: '#9333ea'\n});\nreturn picker;\n:::\n\n:::script label=\"with a CSS variable hint\" expected=\"the variable name under the control\"\nconst picker = await slice.build('ColorPicker', {\n  label: 'Danger',\n  value: '#dc2626',\n  hint: '--danger-color'\n});\n\nconst host = document.createElement('div');\nhost.style.maxWidth = '280px';\nhost.appendChild(picker);\nreturn host;\n:::\n\n:::script label=\"colour table\" expected=\"a row of independent swatches, each with its own value\"\nconst tokens = [\n  { label: 'Primary', value: '#9333ea' },\n  { label: 'Secondary', value: '#0891b2' },\n  { label: 'Success', value: '#059669' },\n  { label: 'Warning', value: '#d97706' },\n  { label: 'Danger', value: '#dc2626' }\n];\n\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';\nhost.style.gap = '0.75rem';\n\nfor (const token of tokens) {\n  host.appendChild(await slice.build('ColorPicker', {\n    label: token.label,\n    value: token.value,\n    hint: '--' + token.label.toLowerCase() + '-color'\n  }));\n}\nreturn host;\n:::\n\n:::script label=\"onChange on every edit\" expected=\"the swatch updates as the value is dragged\"\nconst readout = document.createElement('p');\nreadout.style.fontFamily = 'var(--font-family-code, monospace)';\nreadout.style.marginTop = '0.5rem';\n\nconst picker = await slice.build('ColorPicker', {\n  label: 'Pick a colour',\n  value: '#059669',\n  onChange: (hex) => {\n    readout.textContent = 'onChange -> ' + hex;\n  }\n});\n\nconst host = document.createElement('div');\nhost.style.maxWidth = '280px';\nhost.appendChild(picker);\nhost.appendChild(readout);\nreturn host;\n:::\n\n## Normalization\n`value` accepts the three spellings that actually reach a UI, and falls back for the rest.\n\n| Input | Result |\n| --- | --- |\n| `#9333ea` | `#9333ea` |\n| `#0f8` | `#00ff88` |\n| `rgb(147, 51, 234)` | `#9333ea` |\n| `rgb(147 51 234 / 0.5)` | `#9333ea` |\n| `var(--brand)` | `#000000` (documented fallback) |\n| `rebeccapurple` | `#000000` (documented fallback) |\n\nNamed colours and `oklch()` / `color-mix()` cannot be rendered in a swatch at all, so they fall\nback rather than going black in silence.\n\n## Best Practices\n:::tip\nUse `hint` for whatever the label cannot say in a couple of words — a CSS custom property name\nin a theme editor, a token key in a design system. It is rendered in the code font for exactly\nthat kind of identifier.\n:::\n\n:::tip\nPair `onChange` with `value` rather than only `onChange`. `onChange` fires on every input event\nduring a drag, so a consumer that does expensive work per call should debounce it.\n:::\n\n## Pitfalls\n:::warning\n`customColor` tints the border only. Setting `accent` to the same colour as `value` does not fill\nthe swatch — the whole point of the control is to show the value the user picked.\n:::\n\n:::warning\nThe hex readout is `aria-hidden`. Screen readers already announce the value through the input\nitself, and `<output>` has an implicit `role=\"status\"`, which would otherwise announce every\nintermediate value during a drag.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Primary color\",\n  \"value\": \"#9333ea\",\n  \"hint\": \"--primary-color\"\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Primary color\",\n  \"value\": \"#9333ea\",\n  \"hint\": \"--primary-color\"\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('ColorPicker', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const lines = ["| Input | Result |","| --- | --- |","| `#9333ea` | `#9333ea` |","| `#0f8` | `#00ff88` |","| `rgb(147, 51, 234)` | `#9333ea` |","| `rgb(147 51 234 / 0.5)` | `#9333ea` |","| `var(--brand)` | `#000000` (documented fallback) |","| `rebeccapurple` | `#000000` (documented fallback) |"];
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
            if ("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"DEFAULT_COLOR\",\"allowedValues\":[]},{\"path\":\"hint\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"className\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"DEFAULT_COLOR\",\"allowedValues\":[]},{\"path\":\"hint\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"className\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-colorpickerdocumentation', ColorPickerDocumentation);
