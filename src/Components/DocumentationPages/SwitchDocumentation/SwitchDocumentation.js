export default class SwitchDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"settings switch","expected":"switch renders with label and initial checked state","kind":"script","content":"const sw = await slice.build('Switch', {\r\n  label: 'Dark mode',\r\n  checked: true\r\n});\r\n\r\nreturn sw;"},{"label":"switch with callback","expected":"onChange runs on interaction and updates the status text","kind":"script","content":"const status = document.createElement('p');\r\nstatus.textContent = 'State: off';\r\n\r\nconst sw = await slice.build('Switch', {\r\n  label: 'Auto-save',\r\n  checked: false,\r\n  onChange: () => {\r\n    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(sw);\r\nhost.appendChild(status);\r\nreturn host;"},{"label":"disabled switch","expected":"disabled switch keeps value but blocks changes","kind":"script","content":"const sw = await slice.build('Switch', {\r\n  label: 'Controlled by admin',\r\n  checked: true,\r\n  disabled: true\r\n});\r\n\r\nreturn sw;"},{"label":"switch with custom color","expected":"customColor updates active visual accent","kind":"script","content":"const sw = await slice.build('Switch', {\r\n  label: 'Deploy protection',\r\n  checked: true,\r\n  customColor: { accent: '#16a34a' }\r\n});\r\n\r\nreturn sw;"},{"label":"labelPlacement variations","expected":"left/right/top/bottom placements render correctly","kind":"script","content":"const placements = ['left', 'right', 'top', 'bottom'];\r\nconst host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\r\nhost.style.gap = '8px';\r\n\r\nfor (const placement of placements) {\r\n  const item = await slice.build('Switch', {\r\n    label: `Placement ${placement}`,\r\n    checked: placement === 'left' || placement === 'top',\r\n    labelPlacement: placement\r\n  });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;"},{"label":"checked state variations","expected":"shows both checked=true and checked=false states","kind":"script","content":"const host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.gap = '10px';\r\n\r\nconst onState = await slice.build('Switch', {\r\n  label: 'Checked true',\r\n  checked: true\r\n});\r\n\r\nconst offState = await slice.build('Switch', {\r\n  label: 'Checked false',\r\n  checked: false\r\n});\r\n\r\nhost.appendChild(onState);\r\nhost.appendChild(offState);\r\nreturn host;"},{"label":"variant variations","expected":"default, outlined, soft, danger and plain styles","kind":"script","content":"const host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.gap = '10px';\r\n\r\nfor (const variant of ['default', 'outlined', 'soft', 'danger', 'plain']) {\r\n  host.appendChild(await slice.build('Switch', {\r\n    label: variant,\r\n    checked: true,\r\n    variant\r\n  }));\r\n}\r\n\r\nreturn host;"},{"label":"size variations","expected":"sm, md and lg render at increasing sizes","kind":"script","content":"const host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.alignItems = 'center';\r\nhost.style.gap = '10px';\r\n\r\nfor (const size of ['sm', 'md', 'lg']) {\r\n  host.appendChild(await slice.build('Switch', {\r\n    label: size,\r\n    checked: true,\r\n    size\r\n  }));\r\n}\r\n\r\nreturn host;"},{"label":"Switch and Checkbox side by side","expected":"same variant and size read as one family","kind":"script","content":"const host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.alignItems = 'center';\r\nhost.style.gap = '10px';\r\n\r\nhost.appendChild(await slice.build('Switch', { label: 'Sync', checked: true, variant: 'outlined', size: 'sm' }));\r\nhost.appendChild(await slice.build('Checkbox', { label: 'Remember me', checked: true, variant: 'outlined', size: 'sm' }));\r\n\r\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "switch.md";
    this.markdownContent = "---\r\ntitle: Switch\r\nroute: /docs/input/switch\r\nnavLabel: Switch\r\nsection: Input Components\r\ngroup: Basic\r\norder: 14\r\ndescription: Switch component documentation with practical interaction scenarios.\r\ncomponent: SwitchDocumentation\r\ngenerate: true\r\ntags: [switch, input, toggle]\r\n---\r\n\r\n# Switch\r\n\r\n## Overview\r\n`Switch` provides an on/off control for feature flags and settings toggles.\r\n\r\n## Core Behavior\r\n- `checked` controls active state.\r\n- `onChange` fires with the new checked state (`true`/`false`) when the user toggles it — by clicking the track, the label, or pressing Space. Setting `checked` from code does not fire it. Assign `null` to clear the handler.\r\n- `toggle` is the deprecated name for `onChange`. It still works and warns once.\r\n- `label` and `labelPlacement` improve context readability.\r\n- `variant` matches `Checkbox`: `default` (success accent), `outlined`, `soft`, `danger` (for a switch that turns on something risky) or `plain` (no container chip). Unknown values fall back to `default`.\r\n- `size` (`sm` | `md` | `lg`) scales the track, knob and label together; `md` is the default.\r\n- `customColor: { accent }` recolours the active track, in every variant.\r\n- The input is a real checkbox exposed with `role=\"switch\"`, so screen readers announce it as on/off. It is visually hidden but stays focusable, and the focus ring is drawn on the track.\r\n- Per-instance tuning: `--slice-switch-thumb`, `--slice-switch-track-surface`, `--slice-switch-track-border`, `--slice-switch-track-border-width` and `--slice-switch-height` can be set on the host.\r\n\r\n## Live Preview\r\n:::component name=\"Switch\"\r\n{\r\n  \"label\": \"Notifications\",\r\n  \"checked\": true\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"settings switch\" expected=\"switch renders with label and initial checked state\"\r\nconst sw = await slice.build('Switch', {\r\n  label: 'Dark mode',\r\n  checked: true\r\n});\r\n\r\nreturn sw;\r\n:::\r\n\r\n:::script label=\"switch with callback\" expected=\"onChange runs on interaction and updates the status text\"\r\nconst status = document.createElement('p');\r\nstatus.textContent = 'State: off';\r\n\r\nconst sw = await slice.build('Switch', {\r\n  label: 'Auto-save',\r\n  checked: false,\r\n  onChange: () => {\r\n    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(sw);\r\nhost.appendChild(status);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"disabled switch\" expected=\"disabled switch keeps value but blocks changes\"\r\nconst sw = await slice.build('Switch', {\r\n  label: 'Controlled by admin',\r\n  checked: true,\r\n  disabled: true\r\n});\r\n\r\nreturn sw;\r\n:::\r\n\r\n:::script label=\"switch with custom color\" expected=\"customColor updates active visual accent\"\r\nconst sw = await slice.build('Switch', {\r\n  label: 'Deploy protection',\r\n  checked: true,\r\n  customColor: { accent: '#16a34a' }\r\n});\r\n\r\nreturn sw;\r\n:::\r\n\r\n:::script label=\"labelPlacement variations\" expected=\"left/right/top/bottom placements render correctly\"\r\nconst placements = ['left', 'right', 'top', 'bottom'];\r\nconst host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\r\nhost.style.gap = '8px';\r\n\r\nfor (const placement of placements) {\r\n  const item = await slice.build('Switch', {\r\n    label: `Placement ${placement}`,\r\n    checked: placement === 'left' || placement === 'top',\r\n    labelPlacement: placement\r\n  });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"checked state variations\" expected=\"shows both checked=true and checked=false states\"\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.gap = '10px';\r\n\r\nconst onState = await slice.build('Switch', {\r\n  label: 'Checked true',\r\n  checked: true\r\n});\r\n\r\nconst offState = await slice.build('Switch', {\r\n  label: 'Checked false',\r\n  checked: false\r\n});\r\n\r\nhost.appendChild(onState);\r\nhost.appendChild(offState);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"variant variations\" expected=\"default, outlined, soft, danger and plain styles\"\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.gap = '10px';\r\n\r\nfor (const variant of ['default', 'outlined', 'soft', 'danger', 'plain']) {\r\n  host.appendChild(await slice.build('Switch', {\r\n    label: variant,\r\n    checked: true,\r\n    variant\r\n  }));\r\n}\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"size variations\" expected=\"sm, md and lg render at increasing sizes\"\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.alignItems = 'center';\r\nhost.style.gap = '10px';\r\n\r\nfor (const size of ['sm', 'md', 'lg']) {\r\n  host.appendChild(await slice.build('Switch', {\r\n    label: size,\r\n    checked: true,\r\n    size\r\n  }));\r\n}\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"Switch and Checkbox side by side\" expected=\"same variant and size read as one family\"\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.alignItems = 'center';\r\nhost.style.gap = '10px';\r\n\r\nhost.appendChild(await slice.build('Switch', { label: 'Sync', checked: true, variant: 'outlined', size: 'sm' }));\r\nhost.appendChild(await slice.build('Checkbox', { label: 'Remember me', checked: true, variant: 'outlined', size: 'sm' }));\r\n\r\nreturn host;\r\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"label\": \"Notifications\",\r\n  \"checked\": true\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"label\": \"Notifications\",\r\n  \"checked\": true\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Switch', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-11"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"checked\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"right\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"outlined\",\"soft\",\"danger\",\"plain\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"toggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"checked\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"right\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"outlined\",\"soft\",\"danger\",\"plain\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"toggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-switchdocumentation', SwitchDocumentation);
