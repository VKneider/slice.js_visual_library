export default class InputDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Sizes","expected":"a full-size and a compact field side by side","kind":"script","content":"const row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nrow.appendChild(await slice.build('Input', { placeholder: 'Email address', size: 'md' }));\r\nrow.appendChild(await slice.build('Input', { placeholder: 'Email address', size: 'sm' }));\r\nreturn row;"},{"label":"Login form fields","expected":"email + password fields with proper input types","kind":"script","content":"const wrapper = document.createElement('div');\r\n\r\nconst email = await slice.build('Input', {\r\n  placeholder: 'Email',\r\n  type: 'email',\r\n  required: true\r\n});\r\n\r\nconst password = await slice.build('Input', {\r\n  placeholder: 'Password',\r\n  type: 'password',\r\n  secret: true,\r\n  required: true\r\n});\r\n\r\nwrapper.appendChild(email);\r\nwrapper.appendChild(password);\r\nreturn wrapper;"},{"label":"Search + filter toolbar","expected":"search input paired with select control","kind":"script","content":"const row = document.createElement('div');\r\n\r\nconst search = await slice.build('Input', {\r\n  placeholder: 'Search components',\r\n  type: 'text'\r\n});\r\n\r\nconst category = await slice.build('Select', {\r\n  label: 'Category',\r\n  visibleProp: 'label',\r\n  options: [\r\n    { label: 'All', value: 'all' },\r\n    { label: 'Input', value: 'input' },\r\n    { label: 'Layout', value: 'layout' }\r\n  ]\r\n});\r\n\r\nrow.appendChild(search);\r\nrow.appendChild(category);\r\nreturn row;"},{"label":"Validation ready email field","expected":"input with regex conditions and status button","kind":"script","content":"const wrapper = document.createElement('div');\r\n\r\nconst email = await slice.build('Input', {\r\n  placeholder: 'Work email',\r\n  required: true,\r\n  conditions: {\r\n    regex: '^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$'\r\n  }\r\n});\r\n\r\nconst validate = await slice.build('Button', {\r\n  value: 'Validate',\r\n  onClick: () => {\r\n    email.validateValue();\r\n  }\r\n});\r\n\r\nwrapper.appendChild(email);\r\nwrapper.appendChild(validate);\r\nreturn wrapper;"},{"label":"Disabled prefilled field","expected":"readonly-like field for immutable values","kind":"script","content":"const input = await slice.build('Input', {\r\n  placeholder: 'Workspace ID',\r\n  value: 'SLC-WS-0021',\r\n  disabled: true\r\n});\r\n\r\nreturn input;"},{"label":"API key input with reveal","expected":"secret field can be toggled in secure workflows","kind":"script","content":"const apiKey = await slice.build('Input', {\r\n  placeholder: 'API Key',\r\n  type: 'password',\r\n  secret: true,\r\n  required: true\r\n});\r\n\r\nreturn apiKey;"},{"label":"Quick create form row","expected":"two inputs and action button compose a compact form","kind":"script","content":"const host = document.createElement('div');\r\n\r\nconst name = await slice.build('Input', {\r\n  placeholder: 'Project name',\r\n  type: 'text',\r\n  required: true\r\n});\r\n\r\nconst slug = await slice.build('Input', {\r\n  placeholder: 'project-slug',\r\n  type: 'text'\r\n});\r\n\r\nconst create = await slice.build('Button', {\r\n  value: 'Create'\r\n});\r\n\r\nhost.appendChild(name);\r\nhost.appendChild(slug);\r\nhost.appendChild(create);\r\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "input.md";
    this.markdownContent = "---\r\ntitle: Input\r\nroute: /docs/input/input\r\nnavLabel: Input\r\nsection: Input Components\r\ngroup: Basic\r\norder: 11\r\ndescription: Input component documentation with practical setup examples.\r\ncomponent: InputDocumentation\r\ngenerate: true\r\ntags: [input, forms]\r\n---\r\n\r\n# Input\r\n\r\n## Overview\r\n`Input` supports placeholder, value, type, required, disabled, secret and validation conditions.\r\n\r\n## Core Behavior\r\n- `Input` handles standard text entry, typed inputs, and optional required-state feedback.\r\n- `onChange` fires with the new value on every `input` event. `value` stays readable for pull-style consumers, and `onChange` can be cleared with `null`.\r\n- Password flows can expose/hide value with `secret` while preserving form semantics. The reveal toggle swaps two inline SVGs from its `aria-pressed` state, so the glyph inherits the field's colour instead of being a fixed emoji.\r\n- Density is set with `size` (`md` · `sm`), the same vocabulary `Button` uses, so a compact field beside a compact button reads as one density.\r\n- Validation behavior is scenario-driven; use script blocks to verify condition checks in realistic forms.\r\n\r\n## Sizes\r\n`size` shares `Button`'s vocabulary and its values: `sm` trims the inline padding to `6px 12px`,\r\nthe type to `12px`, and the radius to 0.7×, which is what `Button` already shipped for its own\r\n`--sm`. Measured side by side, the two controls land within **2px at `md` and 3px at `sm`** — they\r\nwere 24px and 11px apart before.\r\n\r\nThe class swap is idempotent: setting `size` back to `md`, or to a value outside the vocabulary,\r\nremoves the modifier rather than stacking a second one. `Input` keys the rule off `data-size` on\r\nits host, so `host.getAttribute('data-size')` reports what is actually applied.\r\n\r\n:::script label=\"Sizes\" expected=\"a full-size and a compact field side by side\"\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nrow.appendChild(await slice.build('Input', { placeholder: 'Email address', size: 'md' }));\r\nrow.appendChild(await slice.build('Input', { placeholder: 'Email address', size: 'sm' }));\r\nreturn row;\r\n:::\r\n\r\n## Live Preview\r\n:::component name=\"Input\"\r\n{\r\n  \"placeholder\": \"Email address\",\r\n  \"type\": \"email\"\r\n}\r\n:::\r\n\r\n## Live validation\r\n\r\nAn `Input` validates itself as you type in two cases, without any call from you:\r\n\r\n- `type: 'email'` — checked with the platform's own `validity.valid`, so a malformed address shows\r\n  the error state on the keystroke that breaks it;\r\n- `conditions` — run against the value on every keystroke.\r\n\r\nClearing the field always drops the error state, so an emptied field never keeps showing as invalid.\r\nCall `validateValue()` from a submit handler as well to cover the empty case.\r\n\r\n## Practical Setups\r\n:::script label=\"Login form fields\" expected=\"email + password fields with proper input types\"\r\nconst wrapper = document.createElement('div');\r\n\r\nconst email = await slice.build('Input', {\r\n  placeholder: 'Email',\r\n  type: 'email',\r\n  required: true\r\n});\r\n\r\nconst password = await slice.build('Input', {\r\n  placeholder: 'Password',\r\n  type: 'password',\r\n  secret: true,\r\n  required: true\r\n});\r\n\r\nwrapper.appendChild(email);\r\nwrapper.appendChild(password);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Search + filter toolbar\" expected=\"search input paired with select control\"\r\nconst row = document.createElement('div');\r\n\r\nconst search = await slice.build('Input', {\r\n  placeholder: 'Search components',\r\n  type: 'text'\r\n});\r\n\r\nconst category = await slice.build('Select', {\r\n  label: 'Category',\r\n  visibleProp: 'label',\r\n  options: [\r\n    { label: 'All', value: 'all' },\r\n    { label: 'Input', value: 'input' },\r\n    { label: 'Layout', value: 'layout' }\r\n  ]\r\n});\r\n\r\nrow.appendChild(search);\r\nrow.appendChild(category);\r\nreturn row;\r\n:::\r\n\r\n:::script label=\"Validation ready email field\" expected=\"input with regex conditions and status button\"\r\nconst wrapper = document.createElement('div');\r\n\r\nconst email = await slice.build('Input', {\r\n  placeholder: 'Work email',\r\n  required: true,\r\n  conditions: {\r\n    regex: '^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$'\r\n  }\r\n});\r\n\r\nconst validate = await slice.build('Button', {\r\n  value: 'Validate',\r\n  onClick: () => {\r\n    email.validateValue();\r\n  }\r\n});\r\n\r\nwrapper.appendChild(email);\r\nwrapper.appendChild(validate);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Disabled prefilled field\" expected=\"readonly-like field for immutable values\"\r\nconst input = await slice.build('Input', {\r\n  placeholder: 'Workspace ID',\r\n  value: 'SLC-WS-0021',\r\n  disabled: true\r\n});\r\n\r\nreturn input;\r\n:::\r\n\r\n:::script label=\"API key input with reveal\" expected=\"secret field can be toggled in secure workflows\"\r\nconst apiKey = await slice.build('Input', {\r\n  placeholder: 'API Key',\r\n  type: 'password',\r\n  secret: true,\r\n  required: true\r\n});\r\n\r\nreturn apiKey;\r\n:::\r\n\r\n:::script label=\"Quick create form row\" expected=\"two inputs and action button compose a compact form\"\r\nconst host = document.createElement('div');\r\n\r\nconst name = await slice.build('Input', {\r\n  placeholder: 'Project name',\r\n  type: 'text',\r\n  required: true\r\n});\r\n\r\nconst slug = await slice.build('Input', {\r\n  placeholder: 'project-slug',\r\n  type: 'text'\r\n});\r\n\r\nconst create = await slice.build('Button', {\r\n  value: 'Create'\r\n});\r\n\r\nhost.appendChild(name);\r\nhost.appendChild(slug);\r\nhost.appendChild(create);\r\nreturn host;\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"placeholder\": \"Email address\",\r\n  \"type\": \"email\"\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"placeholder\": \"Email address\",\r\n  \"type\": \"email\"\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Input', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"type\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"className\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"secret\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"type\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"className\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"secret\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-inputdocumentation', InputDocumentation);
