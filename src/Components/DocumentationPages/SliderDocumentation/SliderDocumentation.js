export default class SliderDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"basic slider","expected":"a labelled slider at 40","kind":"script","content":"const slider = await slice.build('Slider', {\n  label: 'Volume',\n  value: 40\n});\n\nreturn slider;"},{"label":"onInput vs onChange","expected":"the first line updates while dragging, the second only on release","kind":"script","content":"const live = document.createElement('p');\nconst committed = document.createElement('p');\nlive.textContent = 'onInput: 50';\ncommitted.textContent = 'onChange: 50';\n\nconst slider = await slice.build('Slider', {\n  label: 'Brightness',\n  value: 50,\n  onInput: (value) => { live.textContent = `onInput: ${value}`; },\n  onChange: (value) => { committed.textContent = `onChange: ${value}`; }\n});\n\nconst host = document.createElement('div');\nhost.append(slider, live, committed);\nreturn host;"},{"label":"price range with formatted values","expected":"two thumbs, values shown as dollars","kind":"script","content":"const slider = await slice.build('Slider', {\n  label: 'Price',\n  range: true,\n  min: 0,\n  max: 500,\n  step: 10,\n  value: [80, 320],\n  formatValue: (v) => `$${v}`\n});\n\nreturn slider;"},{"label":"decimal step with a percentage","expected":"0 to 1 in tenths, shown as a percentage","kind":"script","content":"const slider = await slice.build('Slider', {\n  label: 'Opacity',\n  min: 0,\n  max: 1,\n  step: 0.1,\n  value: 0.6,\n  formatValue: (v) => `${Math.round(v * 100)}%`\n});\n\nreturn slider;"},{"label":"marks","expected":"labelled stops under the track; clicking one jumps there","kind":"script","content":"const slider = await slice.build('Slider', {\n  label: 'Quality',\n  min: 0,\n  max: 100,\n  step: 25,\n  value: 50,\n  showValue: false,\n  marks: [\n    { value: 0, label: 'Low' },\n    { value: 50, label: 'Medium' },\n    { value: 100, label: 'High' }\n  ]\n});\n\nreturn slider;"},{"label":"controlled from outside","expected":"the buttons set the value without firing onChange","kind":"script","content":"const slider = await slice.build('Slider', { label: 'Zoom', min: 50, max: 200, step: 10, value: 100, formatValue: (v) => `${v}%` });\n\nconst actions = document.createElement('div');\nactions.style.display = 'flex';\nactions.style.gap = '8px';\n\nfor (const value of [50, 100, 200]) {\n  actions.appendChild(await slice.build('Button', {\n    value: `${value}%`,\n    size: 'sm',\n    variant: 'outlined',\n    onClick: () => { slider.value = value; }\n  }));\n}\n\nconst host = document.createElement('div');\nhost.append(slider, actions);\nreturn host;"},{"label":"variant variations","expected":"default, outlined, soft and plain","kind":"script","content":"const host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\nhost.style.gap = '12px';\n\nfor (const variant of ['default', 'outlined', 'soft', 'plain']) {\n  host.appendChild(await slice.build('Slider', { label: variant, variant, value: 60 }));\n}\n\nreturn host;"},{"label":"sizes, disabled and custom accent","expected":"sm, md, lg, a disabled slider and an amber one","kind":"script","content":"const host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\nhost.style.gap = '12px';\n\nfor (const size of ['sm', 'md', 'lg']) {\n  host.appendChild(await slice.build('Slider', { label: `Size ${size}`, size, value: 40 }));\n}\nhost.appendChild(await slice.build('Slider', { label: 'Disabled', value: 60, disabled: true }));\nhost.appendChild(await slice.build('Slider', { label: 'Custom accent', value: 70, customColor: { accent: '#d97706' } }));\n\nreturn host;"},{"label":"inside a Form","expected":"submitting prints the numbers","kind":"script","content":"const result = document.createElement('pre');\n\nconst form = await slice.build('Form', {\n  submitText: 'Save',\n  schema: [\n    { name: 'volume', component: 'Slider', props: { label: 'Volume', value: 30, variant: 'plain' } },\n    { name: 'budget', component: 'Slider', props: { label: 'Budget', range: true, max: 1000, step: 50, value: [200, 600], formatValue: (v) => `$${v}`, variant: 'plain' } }\n  ],\n  onSubmit: (values) => { result.textContent = JSON.stringify(values); }\n});\n\nconst host = document.createElement('div');\nhost.append(form, result);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "slider.md";
    this.markdownContent = "---\ntitle: Slider\nroute: /docs/input/slider\nnavLabel: Slider\nsection: Input Components\ngroup: Basic\norder: 15\ndescription: Numeric slider with keyboard support, a two-thumb range mode, marks and formatted values.\ncomponent: SliderDocumentation\ngenerate: true\ntags: [slider, range, input, forms, number]\n---\n\n# Slider\n\n## Overview\n`Slider` picks a number within a range by dragging, clicking the track or using the keyboard. With `range: true` it has two thumbs and picks an interval (`[low, high]`), such as a price filter.\n\nUse it when an approximate value is fine and seeing it relative to the whole range helps (volume, opacity, a price band). When the exact number matters, prefer `Input` with a number type — dragging to precisely 1,375 is frustrating.\n\n## Core Behavior\n- `min`, `max` and `step` define the scale (defaults `0`, `100`, `1`). Decimal steps such as `0.1` work and never leak float noise (`0.30000000000000004` is stored as `0.3`).\n- `value` is a number, clamped to `min`/`max` and snapped to `step` counted from `min`. Props can arrive in any order: `{ value: 150, max: 200 }` keeps 150.\n- `range: true` makes `value` a `[low, high]` pair. A non-array value becomes `[min, max]`, a reversed pair is sorted, and a thumb stops at the other one instead of crossing it.\n- `onInput(value)` fires continuously while the value moves (dragging, a held arrow key). `onChange(value)` fires once the user commits it (thumb released, key pressed, mark clicked). Setting `value`, `min`, `max`, `step` or `range` from code fires neither. Assign `null` to clear a handler.\n- `value` returns a copy in range mode, so mutating the array you got back does not change the slider.\n- `formatValue(value)` formats the visible value **and** the `aria-valuetext` read by screen readers, for example `(v) => '$' + v`. If it throws, the plain number is shown.\n- `showValue: false` hides the value next to the label.\n- `marks` is an array of numbers or `{ value, label }`, drawn under the track. Clicking a mark moves the (nearest) thumb there. Marks outside `min`/`max` are ignored.\n- `label` names the slider; in range mode each thumb is named `\"<label> (minimum)\"` / `\"<label> (maximum)\"`.\n- `name` sets the native input name, so a surrounding `<form>` submits the value (both ends under the same name in range mode).\n- `disabled` blocks dragging, clicking and the keyboard.\n- `variant`: `default`, `outlined`, `soft` or `plain` (no container chip). `size`: `sm`, `md`, `lg`. `customColor: { accent }` recolours the fill and thumb, in every variant.\n\n## Keyboard and accessibility\nEach thumb is a native `<input type=\"range\">`, so the browser provides the standard slider behaviour:\n\n- **← / ↓** and **→ / ↑** move by one `step`.\n- **Page Up / Page Down** move by a larger amount.\n- **Home / End** jump to `min` / `max`.\n\nScreen readers announce the role, the name, the current value (or the `formatValue` text) and the bounds. `el.focus()` focuses the (low) thumb. The focus ring is drawn on the thumb. Marks are a pointer shortcut and are not extra tab stops.\n\n## Theming\nPer-instance custom properties on the host: `--slice-slider-track`, `--slice-slider-track-height`, `--slice-slider-thumb`, `--slice-slider-thumb-size`, `--slice-slider-thumb-border-width`, `--slice-slider-surface` and `--slice-slider-surface-border`. Use `customColor` for the accent.\n\n## Live Preview\n:::component name=\"Slider\"\n{\n  \"label\": \"Volume\",\n  \"value\": 40\n}\n:::\n\n## Prop Scenarios\n:::script label=\"basic slider\" expected=\"a labelled slider at 40\"\nconst slider = await slice.build('Slider', {\n  label: 'Volume',\n  value: 40\n});\n\nreturn slider;\n:::\n\n:::script label=\"onInput vs onChange\" expected=\"the first line updates while dragging, the second only on release\"\nconst live = document.createElement('p');\nconst committed = document.createElement('p');\nlive.textContent = 'onInput: 50';\ncommitted.textContent = 'onChange: 50';\n\nconst slider = await slice.build('Slider', {\n  label: 'Brightness',\n  value: 50,\n  onInput: (value) => { live.textContent = `onInput: ${value}`; },\n  onChange: (value) => { committed.textContent = `onChange: ${value}`; }\n});\n\nconst host = document.createElement('div');\nhost.append(slider, live, committed);\nreturn host;\n:::\n\n:::script label=\"price range with formatted values\" expected=\"two thumbs, values shown as dollars\"\nconst slider = await slice.build('Slider', {\n  label: 'Price',\n  range: true,\n  min: 0,\n  max: 500,\n  step: 10,\n  value: [80, 320],\n  formatValue: (v) => `$${v}`\n});\n\nreturn slider;\n:::\n\n:::script label=\"decimal step with a percentage\" expected=\"0 to 1 in tenths, shown as a percentage\"\nconst slider = await slice.build('Slider', {\n  label: 'Opacity',\n  min: 0,\n  max: 1,\n  step: 0.1,\n  value: 0.6,\n  formatValue: (v) => `${Math.round(v * 100)}%`\n});\n\nreturn slider;\n:::\n\n:::script label=\"marks\" expected=\"labelled stops under the track; clicking one jumps there\"\nconst slider = await slice.build('Slider', {\n  label: 'Quality',\n  min: 0,\n  max: 100,\n  step: 25,\n  value: 50,\n  showValue: false,\n  marks: [\n    { value: 0, label: 'Low' },\n    { value: 50, label: 'Medium' },\n    { value: 100, label: 'High' }\n  ]\n});\n\nreturn slider;\n:::\n\n:::script label=\"controlled from outside\" expected=\"the buttons set the value without firing onChange\"\nconst slider = await slice.build('Slider', { label: 'Zoom', min: 50, max: 200, step: 10, value: 100, formatValue: (v) => `${v}%` });\n\nconst actions = document.createElement('div');\nactions.style.display = 'flex';\nactions.style.gap = '8px';\n\nfor (const value of [50, 100, 200]) {\n  actions.appendChild(await slice.build('Button', {\n    value: `${value}%`,\n    size: 'sm',\n    variant: 'outlined',\n    onClick: () => { slider.value = value; }\n  }));\n}\n\nconst host = document.createElement('div');\nhost.append(slider, actions);\nreturn host;\n:::\n\n:::script label=\"variant variations\" expected=\"default, outlined, soft and plain\"\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\nhost.style.gap = '12px';\n\nfor (const variant of ['default', 'outlined', 'soft', 'plain']) {\n  host.appendChild(await slice.build('Slider', { label: variant, variant, value: 60 }));\n}\n\nreturn host;\n:::\n\n:::script label=\"sizes, disabled and custom accent\" expected=\"sm, md, lg, a disabled slider and an amber one\"\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\nhost.style.gap = '12px';\n\nfor (const size of ['sm', 'md', 'lg']) {\n  host.appendChild(await slice.build('Slider', { label: `Size ${size}`, size, value: 40 }));\n}\nhost.appendChild(await slice.build('Slider', { label: 'Disabled', value: 60, disabled: true }));\nhost.appendChild(await slice.build('Slider', { label: 'Custom accent', value: 70, customColor: { accent: '#d97706' } }));\n\nreturn host;\n:::\n\n:::script label=\"inside a Form\" expected=\"submitting prints the numbers\"\nconst result = document.createElement('pre');\n\nconst form = await slice.build('Form', {\n  submitText: 'Save',\n  schema: [\n    { name: 'volume', component: 'Slider', props: { label: 'Volume', value: 30, variant: 'plain' } },\n    { name: 'budget', component: 'Slider', props: { label: 'Budget', range: true, max: 1000, step: 50, value: [200, 600], formatValue: (v) => `$${v}`, variant: 'plain' } }\n  ],\n  onSubmit: (values) => { result.textContent = JSON.stringify(values); }\n});\n\nconst host = document.createElement('div');\nhost.append(form, result);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nAlways pass `formatValue` when the number has a unit. It is what a screen reader announces, so \"40%\" is understood where \"0.4\" is not.\n:::\n\n:::tip\nUse `onInput` for cheap live feedback (a preview) and `onChange` for anything expensive (a request, saving), so dragging does not fire a hundred requests.\n:::\n\n## Pitfalls\n:::warning\nA slider has no intrinsic width. It reserves a minimum of `12rem` so it never collapses; give it a real width in tight rows.\n:::\n\n:::warning\nIn range mode, when both thumbs sit on the same value, dragging grabs the top one, which can only move away from the other in one direction. Use the keyboard (Tab to the other thumb) or click the track on the side you want.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Volume\",\n  \"value\": 40\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Volume\",\n  \"value\": 40\n}");
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

customElements.define('slice-sliderdocumentation', SliderDocumentation);
