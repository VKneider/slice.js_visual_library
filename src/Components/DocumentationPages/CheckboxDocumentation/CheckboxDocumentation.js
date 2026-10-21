export default class CheckboxDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"default unchecked","expected":"checkbox starts unchecked with right label","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\r\n  label: 'Receive newsletter'\r\n});\r\n\r\nreturn checkbox;"},{"label":"pre-checked agreement","expected":"checkbox renders checked when checked is true","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\r\n  label: 'I agree with privacy policy',\r\n  checked: true\r\n});\r\n\r\nreturn checkbox;"},{"label":"disabled checkbox","expected":"disabled state blocks interaction","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\r\n  label: 'Managed by policy',\r\n  checked: true,\r\n  disabled: true\r\n});\r\n\r\nreturn checkbox;"},{"label":"checkbox with external toggle","expected":"button can update checkbox checked prop","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\r\n  label: 'Enable reminders',\r\n  checked: false\r\n});\r\n\r\nconst toggle = await slice.build('Button', {\r\n  value: 'Toggle reminders',\r\n  onClick: () => {\r\n    checkbox.checked = !checkbox.checked;\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(checkbox);\r\nhost.appendChild(toggle);\r\nreturn host;"},{"label":"labelPlacement variations","expected":"left/right/top/bottom placements render correctly","kind":"script","content":"const placements = ['left', 'right', 'top', 'bottom'];\r\nconst host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\r\nhost.style.gap = '8px';\r\n\r\nfor (const placement of placements) {\r\n  const item = await slice.build('Checkbox', {\r\n    label: `Placement ${placement}`,\r\n    checked: placement === 'left' || placement === 'top',\r\n    labelPlacement: placement\r\n  });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;"},{"label":"checked state variations","expected":"shows both checked=true and checked=false states","kind":"script","content":"const host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.gap = '10px';\r\n\r\nconst checkedOn = await slice.build('Checkbox', {\r\n  label: 'Checked true',\r\n  checked: true\r\n});\r\n\r\nconst checkedOff = await slice.build('Checkbox', {\r\n  label: 'Checked false',\r\n  checked: false\r\n});\r\n\r\nhost.appendChild(checkedOn);\r\nhost.appendChild(checkedOff);\r\nreturn host;"},{"label":"variant variations","expected":"default, outlined, soft, danger and plain styles","kind":"script","content":"const variants = ['default', 'outlined', 'soft', 'danger', 'plain'];\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.gap = '10px';\r\n\r\nfor (const variant of variants) {\r\n  const item = await slice.build('Checkbox', {\r\n    label: variant,\r\n    checked: true,\r\n    variant\r\n  });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;"},{"label":"size variations","expected":"sm, md and lg render at increasing sizes","kind":"script","content":"const sizes = ['sm', 'md', 'lg'];\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.alignItems = 'center';\r\nhost.style.gap = '10px';\r\n\r\nfor (const size of sizes) {\r\n  const item = await slice.build('Checkbox', {\r\n    label: size,\r\n    checked: true,\r\n    size\r\n  });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;"},{"label":"plain variant in a dense list","expected":"no container chip, just the box and label","kind":"script","content":"const host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gap = '4px';\r\n\r\nfor (const label of ['Enable notifications', 'Share usage data', 'Sync across devices']) {\r\n  const item = await slice.build('Checkbox', { label, variant: 'plain' });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;"},{"label":"borderless box via a custom property","expected":"box keeps its fill but loses the border","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\r\n  label: 'Borderless',\r\n  checked: true,\r\n  variant: 'plain'\r\n});\r\n\r\ncheckbox.style.setProperty('--slice-checkbox-box-border-width', '0');\r\ncheckbox.style.setProperty(\r\n  '--slice-checkbox-box-surface',\r\n  'color-mix(in srgb, var(--primary-color) 18%, transparent)'\r\n);\r\n\r\nreturn checkbox;"},{"label":"destructive confirmation","expected":"danger variant for an irreversible action","kind":"script","content":"const checkbox = await slice.build('Checkbox', {\r\n  label: 'I understand this permanently deletes my account',\r\n  variant: 'danger'\r\n});\r\n\r\nreturn checkbox;"}];
  }

  async init() {
    this.markdownPath = "checkbox.md";
    this.markdownContent = "---\r\ntitle: Checkbox\r\nroute: /docs/input/checkbox\r\nnavLabel: Checkbox\r\nsection: Input Components\r\ngroup: Basic\r\norder: 13\r\ndescription: Checkbox component documentation with practical prop scenarios.\r\ncomponent: CheckboxDocumentation\r\ngenerate: true\r\ntags: [checkbox, input, forms]\r\n---\r\n\r\n# Checkbox\r\n\r\n## Overview\r\n`Checkbox` handles boolean selection with optional label, placement, and disabled state.\r\n\r\n## Core Behavior\r\n- `checked` controls current selection state.\r\n- `onChange` fires with the new checked state (`true`/`false`) whenever the user toggles it, whether they click the box or the label. Assign `null` to clear the handler.\r\n- `label` and `labelPlacement` define readable form semantics.\r\n- `variant` sets the visual style: `default` (success accent), `outlined` (transparent surface, primary accent), `soft` (tinted surface, muted accent), `danger` (destructive confirmations) or `plain` (no container chip — just the bare box and label). Unknown values fall back to `default`.\r\n- Per-instance border tuning: set `--slice-checkbox-box-border-width` on the host to retune or remove the box border without touching the component (pair it with `--slice-checkbox-box-surface` so an unchecked box stays visible).\r\n- `size` (`sm` | `md` | `lg`) scales the box and its label together; `md` is the default.\r\n- `disabled` prevents interaction while keeping current value visible.\r\n- The real `<input>` is visually hidden behind the styled `.checkmark` but stays focusable, and the focus ring is drawn on the checkmark so keyboard users can see where they are.\r\n\r\n## Live Preview\r\n:::component name=\"Checkbox\"\r\n{\r\n  \"label\": \"Accept terms & conditions\",\r\n  \"checked\": true\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"default unchecked\" expected=\"checkbox starts unchecked with right label\"\r\nconst checkbox = await slice.build('Checkbox', {\r\n  label: 'Receive newsletter'\r\n});\r\n\r\nreturn checkbox;\r\n:::\r\n\r\n:::script label=\"pre-checked agreement\" expected=\"checkbox renders checked when checked is true\"\r\nconst checkbox = await slice.build('Checkbox', {\r\n  label: 'I agree with privacy policy',\r\n  checked: true\r\n});\r\n\r\nreturn checkbox;\r\n:::\r\n\r\n:::script label=\"disabled checkbox\" expected=\"disabled state blocks interaction\"\r\nconst checkbox = await slice.build('Checkbox', {\r\n  label: 'Managed by policy',\r\n  checked: true,\r\n  disabled: true\r\n});\r\n\r\nreturn checkbox;\r\n:::\r\n\r\n:::script label=\"checkbox with external toggle\" expected=\"button can update checkbox checked prop\"\r\nconst checkbox = await slice.build('Checkbox', {\r\n  label: 'Enable reminders',\r\n  checked: false\r\n});\r\n\r\nconst toggle = await slice.build('Button', {\r\n  value: 'Toggle reminders',\r\n  onClick: () => {\r\n    checkbox.checked = !checkbox.checked;\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(checkbox);\r\nhost.appendChild(toggle);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"labelPlacement variations\" expected=\"left/right/top/bottom placements render correctly\"\r\nconst placements = ['left', 'right', 'top', 'bottom'];\r\nconst host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';\r\nhost.style.gap = '8px';\r\n\r\nfor (const placement of placements) {\r\n  const item = await slice.build('Checkbox', {\r\n    label: `Placement ${placement}`,\r\n    checked: placement === 'left' || placement === 'top',\r\n    labelPlacement: placement\r\n  });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"checked state variations\" expected=\"shows both checked=true and checked=false states\"\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.gap = '10px';\r\n\r\nconst checkedOn = await slice.build('Checkbox', {\r\n  label: 'Checked true',\r\n  checked: true\r\n});\r\n\r\nconst checkedOff = await slice.build('Checkbox', {\r\n  label: 'Checked false',\r\n  checked: false\r\n});\r\n\r\nhost.appendChild(checkedOn);\r\nhost.appendChild(checkedOff);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"variant variations\" expected=\"default, outlined, soft, danger and plain styles\"\r\nconst variants = ['default', 'outlined', 'soft', 'danger', 'plain'];\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexWrap = 'wrap';\r\nhost.style.gap = '10px';\r\n\r\nfor (const variant of variants) {\r\n  const item = await slice.build('Checkbox', {\r\n    label: variant,\r\n    checked: true,\r\n    variant\r\n  });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"size variations\" expected=\"sm, md and lg render at increasing sizes\"\r\nconst sizes = ['sm', 'md', 'lg'];\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.alignItems = 'center';\r\nhost.style.gap = '10px';\r\n\r\nfor (const size of sizes) {\r\n  const item = await slice.build('Checkbox', {\r\n    label: size,\r\n    checked: true,\r\n    size\r\n  });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"plain variant in a dense list\" expected=\"no container chip, just the box and label\"\r\nconst host = document.createElement('div');\r\nhost.style.display = 'grid';\r\nhost.style.gap = '4px';\r\n\r\nfor (const label of ['Enable notifications', 'Share usage data', 'Sync across devices']) {\r\n  const item = await slice.build('Checkbox', { label, variant: 'plain' });\r\n  host.appendChild(item);\r\n}\r\n\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"borderless box via a custom property\" expected=\"box keeps its fill but loses the border\"\r\nconst checkbox = await slice.build('Checkbox', {\r\n  label: 'Borderless',\r\n  checked: true,\r\n  variant: 'plain'\r\n});\r\n\r\ncheckbox.style.setProperty('--slice-checkbox-box-border-width', '0');\r\ncheckbox.style.setProperty(\r\n  '--slice-checkbox-box-surface',\r\n  'color-mix(in srgb, var(--primary-color) 18%, transparent)'\r\n);\r\n\r\nreturn checkbox;\r\n:::\r\n\r\n:::script label=\"destructive confirmation\" expected=\"danger variant for an irreversible action\"\r\nconst checkbox = await slice.build('Checkbox', {\r\n  label: 'I understand this permanently deletes my account',\r\n  variant: 'danger'\r\n});\r\n\r\nreturn checkbox;\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"label\": \"Accept terms & conditions\",\r\n  \"checked\": true\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"label\": \"Accept terms & conditions\",\r\n  \"checked\": true\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Checkbox', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-13"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"checked\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"right\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"outlined\",\"soft\",\"danger\",\"plain\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"checked\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"labelPlacement\",\"type\":\"string\",\"required\":false,\"default\":\"right\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"outlined\",\"soft\",\"danger\",\"plain\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-checkboxdocumentation', CheckboxDocumentation);
