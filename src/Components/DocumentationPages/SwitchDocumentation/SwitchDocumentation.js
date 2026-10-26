export default class SwitchDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"settings switch","expected":"switch renders with label and initial checked state","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Dark mode',\n  checked: true\n});\n\nreturn sw;"},{"label":"switch with callback","expected":"onChange runs on interaction and updates the status text","kind":"script","content":"const status = document.createElement('p');\nstatus.textContent = 'State: off';\n\nconst sw = await slice.build('Switch', {\n  label: 'Auto-save',\n  checked: false,\n  onChange: () => {\n    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(sw);\nhost.appendChild(status);\nreturn host;"},{"label":"disabled switch","expected":"disabled switch keeps value but blocks changes","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Controlled by admin',\n  checked: true,\n  disabled: true\n});\n\nreturn sw;"},{"label":"switch with custom color","expected":"customColor updates active visual accent","kind":"script","content":"const sw = await slice.build('Switch', {\n  label: 'Deploy protection',\n  checked: true,\n  customColor: { accent: '#16a34a' }\n});\n\nreturn sw;"},{"label":"labelPlacement variations","expected":"left/right/top/bottom placements render correctly","kind":"script","content":"const placements = ['left', 'right', 'top', 'bottom'];\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\nhost.style.gap = '8px';\n\nfor (const placement of placements) {\n  const item = await slice.build('Switch', {\n    label: `Placement ${placement}`,\n    checked: placement === 'left' || placement === 'top',\n    labelPlacement: placement\n  });\n  host.appendChild(item);\n}\n\nreturn host;"},{"label":"checked state variations","expected":"shows both checked=true and checked=false states","kind":"script","content":"const host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.gap = '10px';\n\nconst onState = await slice.build('Switch', {\n  label: 'Checked true',\n  checked: true\n});\n\nconst offState = await slice.build('Switch', {\n  label: 'Checked false',\n  checked: false\n});\n\nhost.appendChild(onState);\nhost.appendChild(offState);\nreturn host;"},{"label":"variant variations","expected":"default, outlined, soft, danger and plain styles","kind":"script","content":"const host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.gap = '10px';\n\nfor (const variant of ['default', 'outlined', 'soft', 'danger', 'plain']) {\n  host.appendChild(await slice.build('Switch', {\n    label: variant,\n    checked: true,\n    variant\n  }));\n}\n\nreturn host;"},{"label":"size variations","expected":"sm, md and lg render at increasing sizes","kind":"script","content":"const host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.alignItems = 'center';\nhost.style.gap = '10px';\n\nfor (const size of ['sm', 'md', 'lg']) {\n  host.appendChild(await slice.build('Switch', {\n    label: size,\n    checked: true,\n    size\n  }));\n}\n\nreturn host;"},{"label":"Switch and Checkbox side by side","expected":"same variant and size read as one family","kind":"script","content":"const host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.alignItems = 'center';\nhost.style.gap = '10px';\n\nhost.appendChild(await slice.build('Switch', { label: 'Sync', checked: true, variant: 'outlined', size: 'sm' }));\nhost.appendChild(await slice.build('Checkbox', { label: 'Remember me', checked: true, variant: 'outlined', size: 'sm' }));\n\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "switch.md";
    this.markdownContent = "---\ntitle: Switch\nroute: /docs/input/switch\nnavLabel: Switch\nsection: Input Components\ngroup: Basic\norder: 14\ndescription: Switch component documentation with practical interaction scenarios.\ncomponent: SwitchDocumentation\ngenerate: true\ntags: [switch, input, toggle]\n---\n\n# Switch\n\n## Overview\n`Switch` provides an on/off control for feature flags and settings toggles.\n\n## Core Behavior\n- `checked` controls active state.\n- `onChange` fires with the new checked state (`true`/`false`) when the user toggles it — by clicking the track, the label, or pressing Space. Setting `checked` from code does not fire it. Assign `null` to clear the handler.\n- `toggle` is the deprecated name for `onChange`. It still works and warns once.\n- `label` and `labelPlacement` improve context readability.\n- `variant` matches `Checkbox`: `default` (success accent), `outlined`, `soft`, `danger` (for a switch that turns on something risky) or `plain` (no container chip). Unknown values fall back to `default`.\n- `size` (`sm` | `md` | `lg`) scales the track, knob and label together; `md` is the default.\n- `customColor: { accent }` recolours the active track, in every variant.\n- The input is a real checkbox exposed with `role=\"switch\"`, so screen readers announce it as on/off. It is visually hidden but stays focusable, and the focus ring is drawn on the track.\n- Per-instance tuning: `--slice-switch-thumb`, `--slice-switch-track-surface`, `--slice-switch-track-border`, `--slice-switch-track-border-width` and `--slice-switch-height` can be set on the host.\n\n## Live Preview\n:::component name=\"Switch\"\n{\n  \"label\": \"Notifications\",\n  \"checked\": true\n}\n:::\n\n## Prop Scenarios\n:::script label=\"settings switch\" expected=\"switch renders with label and initial checked state\"\nconst sw = await slice.build('Switch', {\n  label: 'Dark mode',\n  checked: true\n});\n\nreturn sw;\n:::\n\n:::script label=\"switch with callback\" expected=\"onChange runs on interaction and updates the status text\"\nconst status = document.createElement('p');\nstatus.textContent = 'State: off';\n\nconst sw = await slice.build('Switch', {\n  label: 'Auto-save',\n  checked: false,\n  onChange: () => {\n    status.textContent = `State: ${sw.checked ? 'on' : 'off'}`;\n  }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(sw);\nhost.appendChild(status);\nreturn host;\n:::\n\n:::script label=\"disabled switch\" expected=\"disabled switch keeps value but blocks changes\"\nconst sw = await slice.build('Switch', {\n  label: 'Controlled by admin',\n  checked: true,\n  disabled: true\n});\n\nreturn sw;\n:::\n\n:::script label=\"switch with custom color\" expected=\"customColor updates active visual accent\"\nconst sw = await slice.build('Switch', {\n  label: 'Deploy protection',\n  checked: true,\n  customColor: { accent: '#16a34a' }\n});\n\nreturn sw;\n:::\n\n:::script label=\"labelPlacement variations\" expected=\"left/right/top/bottom placements render correctly\"\nconst placements = ['left', 'right', 'top', 'bottom'];\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\nhost.style.gap = '8px';\n\nfor (const placement of placements) {\n  const item = await slice.build('Switch', {\n    label: `Placement ${placement}`,\n    checked: placement === 'left' || placement === 'top',\n    labelPlacement: placement\n  });\n  host.appendChild(item);\n}\n\nreturn host;\n:::\n\n:::script label=\"checked state variations\" expected=\"shows both checked=true and checked=false states\"\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.gap = '10px';\n\nconst onState = await slice.build('Switch', {\n  label: 'Checked true',\n  checked: true\n});\n\nconst offState = await slice.build('Switch', {\n  label: 'Checked false',\n  checked: false\n});\n\nhost.appendChild(onState);\nhost.appendChild(offState);\nreturn host;\n:::\n\n:::script label=\"variant variations\" expected=\"default, outlined, soft, danger and plain styles\"\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.gap = '10px';\n\nfor (const variant of ['default', 'outlined', 'soft', 'danger', 'plain']) {\n  host.appendChild(await slice.build('Switch', {\n    label: variant,\n    checked: true,\n    variant\n  }));\n}\n\nreturn host;\n:::\n\n:::script label=\"size variations\" expected=\"sm, md and lg render at increasing sizes\"\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.alignItems = 'center';\nhost.style.gap = '10px';\n\nfor (const size of ['sm', 'md', 'lg']) {\n  host.appendChild(await slice.build('Switch', {\n    label: size,\n    checked: true,\n    size\n  }));\n}\n\nreturn host;\n:::\n\n:::script label=\"Switch and Checkbox side by side\" expected=\"same variant and size read as one family\"\nconst host = document.createElement('div');\nhost.style.display = 'flex';\nhost.style.flexWrap = 'wrap';\nhost.style.alignItems = 'center';\nhost.style.gap = '10px';\n\nhost.appendChild(await slice.build('Switch', { label: 'Sync', checked: true, variant: 'outlined', size: 'sm' }));\nhost.appendChild(await slice.build('Checkbox', { label: 'Remember me', checked: true, variant: 'outlined', size: 'sm' }));\n\nreturn host;\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Notifications\",\n  \"checked\": true\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Notifications\",\n  \"checked\": true\n}");
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
