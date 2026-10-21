export default class SliderDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"basic slider","expected":"a labelled slider at 40","kind":"script","content":"const slider = await slice.build('Slider', {\r\n  label: 'Volume',\r\n  value: 40\r\n});\r\n\r\nreturn slider;"},{"label":"onInput vs onChange","expected":"the first line updates while dragging, the second only on release","kind":"script","content":"const live = document.createElement('p');\r\nconst committed = document.createElement('p');\r\nlive.textContent = 'onInput: 50';\r\ncommitted.textContent = 'onChange: 50';\r\n\r\nconst slider = await slice.build('Slider', {\r\n  label: 'Brightness',\r\n  value: 50,\r\n  onInput: (value) => { live.textContent = `onInput: ${value}`; },\r\n  onChange: (value) => { committed.textContent = `onChange: ${value}`; }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.append(slider, live, committed);\r\nreturn host;"},{"label":"price range with formatted values","expected":"two thumbs, values shown as dollars","kind":"script","content":"const slider = await slice.build('Slider', {\r\n  label: 'Price',\r\n  range: true,\r\n  min: 0,\r\n  max: 500,\r\n  step: 10,\r\n  value: [80, 320],\r\n  formatValue: (v) => `$${v}`\r\n});\r\n\r\nreturn slider;"},{"label":"decimal step with a percentage","expected":"0 to 1 in tenths, shown as a percentage","kind":"script","content":"const slider = await slice.build('Slider', {\r\n  label: 'Opacity',\r\n  min: 0,\r\n  max: 1,\r\n  step: 0.1,\r\n  value: 0.6,\r\n  formatValue: (v) => `${Math.round(v * 100)}%`\r\n});\r\n\r\nreturn slider;"},{"label":"marks","expected":"labelled stops under the track; clicking one jumps there","kind":"script","content":"const slider = await slice.build('Slider', {\r\n  label: 'Quality',\r\n  min: 0,\r\n  max: 100,\r\n  step: 25,\r\n  value: 50,\r\n  showValue: false,\r\n  marks: [\r\n    { value: 0, label: 'Low' },\r\n    { value: 50, label: 'Medium' },\r\n    { value: 100, label: 'High' }\r\n  ]\r\n});\r\n\r\nreturn slider;"},{"label":"controlled from outside","expected":"the buttons set the value without firing onChange","kind":"script","content":"const slider = await slice.build('Slider', { label: 'Zoom', min: 50, max: 200, step: 10, value: 100, formatValue: (v) => `${v}%` });\r\n\r\nconst actions = document.createElement('div');\r\nactions.style.display = 'flex';\r\nactions.style.gap = '8px';\r\n\r\nfor (const value of [50, 100, 200]) {\r\n  actions.appendChild(await slice.build('Button', {\r\n    value: `${value}%`,\r\n    size: 'sm',\r\n    variant: 'outlined',\r\n    onClick: () => { slider.value = value; }\r\n  }));\r\n}\r\n\r\nconst host = document.createElement('div');\r\nhost.append(slider, actions);\r\nreturn host;"},{"label":"variant variations","expected":"default, outlined, soft and plain","kind":"script","content":"const host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\r\nhost.style.gap = '12px';\r\n\r\nfor (const variant of ['default', 'outlined', 'soft', 'plain']) {\r\n  host.appendChild(await slice.build('Slider', { label: variant, variant, value: 60 }));\r\n}\r\n\r\nreturn host;"},{"label":"sizes, disabled and custom accent","expected":"sm, md, lg, a disabled slider and an amber one","kind":"script","content":"const host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\r\nhost.style.gap = '12px';\r\n\r\nfor (const size of ['sm', 'md', 'lg']) {\r\n  host.appendChild(await slice.build('Slider', { label: `Size ${size}`, size, value: 40 }));\r\n}\r\nhost.appendChild(await slice.build('Slider', { label: 'Disabled', value: 60, disabled: true }));\r\nhost.appendChild(await slice.build('Slider', { label: 'Custom accent', value: 70, customColor: { accent: '#d97706' } }));\r\n\r\nreturn host;"},{"label":"inside a Form","expected":"submitting prints the numbers","kind":"script","content":"const result = document.createElement('pre');\r\n\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Save',\r\n  schema: [\r\n    { name: 'volume', component: 'Slider', props: { label: 'Volume', value: 30, variant: 'plain' } },\r\n    { name: 'budget', component: 'Slider', props: { label: 'Budget', range: true, max: 1000, step: 50, value: [200, 600], formatValue: (v) => `$${v}`, variant: 'plain' } }\r\n  ],\r\n  onSubmit: (values) => { result.textContent = JSON.stringify(values); }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.append(form, result);\r\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "slider.md";
    this.markdownContent = "---\r\ntitle: Slider\r\nroute: /docs/input/slider\r\nnavLabel: Slider\r\nsection: Input Components\r\ngroup: Basic\r\norder: 15\r\ndescription: Numeric slider with keyboard support, a two-thumb range mode, marks and formatted values.\r\ncomponent: SliderDocumentation\r\ngenerate: true\r\ntags: [slider, range, input, forms, number]\r\n---\r\n\r\n# Slider\r\n\r\n## Overview\r\n`Slider` picks a number within a range by dragging, clicking the track or using the keyboard. With `range: true` it has two thumbs and picks an interval (`[low, high]`), such as a price filter.\r\n\r\nUse it when an approximate value is fine and seeing it relative to the whole range helps (volume, opacity, a price band). When the exact number matters, prefer `Input` with a number type — dragging to precisely 1,375 is frustrating.\r\n\r\n## Core Behavior\r\n- `min`, `max` and `step` define the scale (defaults `0`, `100`, `1`). Decimal steps such as `0.1` work and never leak float noise (`0.30000000000000004` is stored as `0.3`).\r\n- `value` is a number, clamped to `min`/`max` and snapped to `step` counted from `min`. Props can arrive in any order: `{ value: 150, max: 200 }` keeps 150.\r\n- `range: true` makes `value` a `[low, high]` pair. A non-array value becomes `[min, max]`, a reversed pair is sorted, and a thumb stops at the other one instead of crossing it.\r\n- `onInput(value)` fires continuously while the value moves (dragging, a held arrow key). `onChange(value)` fires once the user commits it (thumb released, key pressed, mark clicked). Setting `value`, `min`, `max`, `step` or `range` from code fires neither. Assign `null` to clear a handler.\r\n- `value` returns a copy in range mode, so mutating the array you got back does not change the slider.\r\n- `formatValue(value)` formats the visible value **and** the `aria-valuetext` read by screen readers, for example `(v) => '$' + v`. If it throws, the plain number is shown.\r\n- `showValue: false` hides the value next to the label.\r\n- `marks` is an array of numbers or `{ value, label }`, drawn under the track. Clicking a mark moves the (nearest) thumb there. Marks outside `min`/`max` are ignored.\r\n- `label` names the slider; in range mode each thumb is named `\"<label> (minimum)\"` / `\"<label> (maximum)\"`.\r\n- `name` sets the native input name, so a surrounding `<form>` submits the value (both ends under the same name in range mode).\r\n- `disabled` blocks dragging, clicking and the keyboard.\r\n- `variant`: `default`, `outlined`, `soft` or `plain` (no container chip). `size`: `sm`, `md`, `lg`. `customColor: { accent }` recolours the fill and thumb, in every variant.\r\n\r\n## Keyboard and accessibility\r\nEach thumb is a native `<input type=\"range\">`, so the browser provides the standard slider behaviour:\r\n\r\n- **← / ↓** and **→ / ↑** move by one `step`.\r\n- **Page Up / Page Down** move by a larger amount.\r\n- **Home / End** jump to `min` / `max`.\r\n\r\nScreen readers announce the role, the name, the current value (or the `formatValue` text) and the bounds. `el.focus()` focuses the (low) thumb. The focus ring is drawn on the thumb. Marks are a pointer shortcut and are not extra tab stops.\r\n\r\n## Theming\r\nPer-instance custom properties on the host: `--slice-slider-track`, `--slice-slider-track-height`, `--slice-slider-thumb`, `--slice-slider-thumb-size`, `--slice-slider-thumb-border-width`, `--slice-slider-surface` and `--slice-slider-surface-border`. Use `customColor` for the accent.\r\n\r\n## Live Preview\r\n:::component name=\"Slider\"\r\n{\r\n  \"label\": \"Volume\",\r\n  \"value\": 40\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"basic slider\" expected=\"a labelled slider at 40\"\r\nconst slider = await slice.build('Slider', {\r\n  label: 'Volume',\r\n  value: 40\r\n});\r\n\r\nreturn slider;\r\n:::\r\n\r\n:::script label=\"onInput vs onChange\" expected=\"the first line updates while dragging, the second only on release\"\r\nconst live = document.createElement('p');\r\nconst committed = document.createElement('p');\r\nlive.textContent = 'onInput: 50';\r\ncommitted.textContent = 'onChange: 50';\r\n\r\nconst slider = await slice.build('Slider', {\r\n  label: 'Brightness',\r\n  value: 50,\r\n  onInput: (value) => { live.textContent = `onInput: ${value}`; },\r\n  onChange: (value) => { committed.textContent = `onChange: ${value}`; }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.append(slider, live, committed);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"price range with formatted values\" expected=\"two thumbs, values shown as dollars\"\r\nconst slider = await slice.build('Slider', {\r\n  label: 'Price',\r\n  range: true,\r\n  min: 0,\r\n  max: 500,\r\n  step: 10,\r\n  value: [80, 320],\r\n  formatValue: (v) => `$${v}`\r\n});\r\n\r\nreturn slider;\r\n:::\r\n\r\n:::script label=\"decimal step with a percentage\" expected=\"0 to 1 in tenths, shown as a percentage\"\r\nconst slider = await slice.build('Slider', {\r\n  label: 'Opacity',\r\n  min: 0,\r\n  max: 1,\r\n  step: 0.1,\r\n  value: 0.6,\r\n  formatValue: (v) => `${Math.round(v * 100)}%`\r\n});\r\n\r\nreturn slider;\r\n:::\r\n\r\n:::script label=\"marks\" expected=\"labelled stops under the track; clicking one jumps there\"\r\nconst slider = await slice.build('Slider', {\r\n  label: 'Quality',\r\n  min: 0,\r\n  max: 100,\r\n  step: 25,\r\n  value: 50,\r\n  showValue: false,\r\n  marks: [\r\n    { value: 0, label: 'Low' },\r\n    { value: 50, label: 'Medium' },\r\n    { value: 100, label: 'High' }\r\n  ]\r\n});\r\n\r\nreturn slider;\r\n:::\r\n\r\n:::script label=\"controlled from outside\" expected=\"the buttons set the value without firing onChange\"\r\nconst slider = await slice.build('Slider', { label: 'Zoom', min: 50, max: 200, step: 10, value: 100, formatValue: (v) => `${v}%` });\r\n\r\nconst actions = document.createElement('div');\r\nactions.style.display = 'flex';\r\nactions.style.gap = '8px';\r\n\r\nfor (const value of [50, 100, 200]) {\r\n  actions.appendChild(await slice.build('Button', {\r\n    value: `${value}%`,\r\n    size: 'sm',\r\n    variant: 'outlined',\r\n    onClick: () => { slider.value = value; }\r\n  }));\r\n}\r\n\r\nconst host = document.createElement('div');\r\nhost.append(slider, actions);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"variant variations\" expected=\"default, outlined, soft and plain\"\r\nconst host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\r\nhost.style.gap = '12px';\r\n\r\nfor (const variant of ['default', 'outlined', 'soft', 'plain']) {\r\n  host.appendChild(await slice.build('Slider', { label: variant, variant, value: 60 }));\r\n}\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"sizes, disabled and custom accent\" expected=\"sm, md, lg, a disabled slider and an amber one\"\r\nconst host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\r\nhost.style.gap = '12px';\r\n\r\nfor (const size of ['sm', 'md', 'lg']) {\r\n  host.appendChild(await slice.build('Slider', { label: `Size ${size}`, size, value: 40 }));\r\n}\r\nhost.appendChild(await slice.build('Slider', { label: 'Disabled', value: 60, disabled: true }));\r\nhost.appendChild(await slice.build('Slider', { label: 'Custom accent', value: 70, customColor: { accent: '#d97706' } }));\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"inside a Form\" expected=\"submitting prints the numbers\"\r\nconst result = document.createElement('pre');\r\n\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Save',\r\n  schema: [\r\n    { name: 'volume', component: 'Slider', props: { label: 'Volume', value: 30, variant: 'plain' } },\r\n    { name: 'budget', component: 'Slider', props: { label: 'Budget', range: true, max: 1000, step: 50, value: [200, 600], formatValue: (v) => `$${v}`, variant: 'plain' } }\r\n  ],\r\n  onSubmit: (values) => { result.textContent = JSON.stringify(values); }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.append(form, result);\r\nreturn host;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nAlways pass `formatValue` when the number has a unit. It is what a screen reader announces, so \"40%\" is understood where \"0.4\" is not.\r\n:::\r\n\r\n:::tip\r\nUse `onInput` for cheap live feedback (a preview) and `onChange` for anything expensive (a request, saving), so dragging does not fire a hundred requests.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nA slider has no intrinsic width. It reserves a minimum of `12rem` so it never collapses; give it a real width in tight rows.\r\n:::\r\n\r\n:::warning\r\nIn range mode, when both thumbs sit on the same value, dragging grabs the top one, which can only move away from the other in one direction. Use the keyboard (Tab to the other thumb) or click the track on the side you want.\r\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"label\": \"Volume\",\r\n  \"value\": 40\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"label\": \"Volume\",\r\n  \"value\": 40\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Slider', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"min\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"100\",\"allowedValues\":[]},{\"path\":\"step\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"range\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showValue\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"formatValue\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"marks\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"outlined\",\"soft\",\"plain\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"onInput\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"min\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"100\",\"allowedValues\":[]},{\"path\":\"step\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"range\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"showValue\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"formatValue\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"marks\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"outlined\",\"soft\",\"plain\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"onInput\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-sliderdocumentation', SliderDocumentation);
