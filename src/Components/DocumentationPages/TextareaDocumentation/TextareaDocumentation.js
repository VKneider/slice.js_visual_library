export default class TextareaDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"default textarea","expected":"multi-line field with a floating placeholder","kind":"script","content":"const textarea = await slice.build('Textarea', {\r\n  placeholder: 'Your message',\r\n  rows: 4\r\n});\r\nreturn textarea;"},{"label":"auto-grow field","expected":"textarea grows as content is added and cannot be resized manually","kind":"script","content":"const textarea = await slice.build('Textarea', {\r\n  placeholder: 'Tell us more...',\r\n  autoGrow: true\r\n});\r\nreturn textarea;"},{"label":"prefilled disabled field","expected":"readonly-like multi-line value","kind":"script","content":"const textarea = await slice.build('Textarea', {\r\n  placeholder: 'Release notes',\r\n  value: 'Line one\\nLine two\\nLine three',\r\n  disabled: true\r\n});\r\nreturn textarea;"},{"label":"validated bio field","expected":"minLength condition flips the field into the error state","kind":"script","content":"const wrapper = document.createElement('div');\r\n\r\nconst bio = await slice.build('Textarea', {\r\n  placeholder: 'Short bio (min 20 chars)',\r\n  rows: 3,\r\n  required: true,\r\n  conditions: { minLength: 20 }\r\n});\r\n\r\nconst validate = await slice.build('Button', {\r\n  value: 'Validate',\r\n  onClick: () => bio.validateValue()\r\n});\r\n\r\nwrapper.appendChild(bio);\r\nwrapper.appendChild(validate);\r\nreturn wrapper;"},{"label":"character-limited field with live count","expected":"onChange drives an external character counter","kind":"script","content":"const wrapper = document.createElement('div');\r\n\r\nconst counter = document.createElement('p');\r\ncounter.textContent = '0 / 140';\r\n\r\nconst textarea = await slice.build('Textarea', {\r\n  placeholder: \"What's happening?\",\r\n  maxlength: 140,\r\n  autoGrow: true,\r\n  onChange: (value) => {\r\n    counter.textContent = `${value.length} / 140`;\r\n  }\r\n});\r\n\r\nwrapper.appendChild(textarea);\r\nwrapper.appendChild(counter);\r\nreturn wrapper;"}];
  }

  async init() {
    this.markdownPath = "textarea.md";
    this.markdownContent = "---\r\ntitle: Textarea\r\nroute: /docs/input/textarea\r\nnavLabel: Textarea\r\nsection: Input Components\r\ngroup: Basic\r\norder: 13\r\ndescription: Multi-line text input with a floating label, auto-grow, validation conditions and an onChange handler.\r\ncomponent: TextareaDocumentation\r\ngenerate: true\r\ntags: [textarea, input, forms, multiline]\r\n---\r\n\r\n# Textarea\r\n\r\n## Overview\r\n`Textarea` is the multi-line counterpart to [`Input`](/docs/input/input). It shares the\r\nfloating-label look and `conditions`-based validation, and adds textarea-specific options:\r\nan initial `rows` height, optional `autoGrow` that expands the field as the user types, and\r\nan `onChange(value)` handler.\r\n\r\n## Core Behavior\r\n- `value` / `placeholder` mirror `Input`. The label floats above the border on focus or once\r\n  the field has a value.\r\n- `rows` sets the initial visible height; `maxlength` caps the character count natively.\r\n- `autoGrow` disables manual resize and grows the field to fit its content on every keystroke.\r\n- `onChange` fires with the current string on every input event.\r\n- `conditions` accepts `{ regex }` or `{ minLength, maxLength }`; they are checked live while typing\r\n  and can also be run on demand with `validateValue()`.\r\n  the check and surface the error state.\r\n- All listeners live on the component's own nodes, so there is nothing to clean up manually.\r\n\r\n## Live Preview\r\n:::component name=\"Textarea\"\r\n{\r\n  \"placeholder\": \"Write your message\",\r\n  \"rows\": 4\r\n}\r\n:::\r\n\r\n## Example\r\n```javascript title=\"Auto-growing comment box\"\r\nconst comment = await slice.build('Textarea', {\r\n  placeholder: 'Add a comment',\r\n  autoGrow: true,\r\n  maxlength: 500,\r\n  onChange: (value) => slice.logger.logInfo('Comment', `${value.length} chars`)\r\n});\r\nthis.appendChild(comment);\r\n```\r\n\r\n## Prop Scenarios\r\n:::script label=\"default textarea\" expected=\"multi-line field with a floating placeholder\"\r\nconst textarea = await slice.build('Textarea', {\r\n  placeholder: 'Your message',\r\n  rows: 4\r\n});\r\nreturn textarea;\r\n:::\r\n\r\n:::script label=\"auto-grow field\" expected=\"textarea grows as content is added and cannot be resized manually\"\r\nconst textarea = await slice.build('Textarea', {\r\n  placeholder: 'Tell us more...',\r\n  autoGrow: true\r\n});\r\nreturn textarea;\r\n:::\r\n\r\n:::script label=\"prefilled disabled field\" expected=\"readonly-like multi-line value\"\r\nconst textarea = await slice.build('Textarea', {\r\n  placeholder: 'Release notes',\r\n  value: 'Line one\\nLine two\\nLine three',\r\n  disabled: true\r\n});\r\nreturn textarea;\r\n:::\r\n\r\n:::script label=\"validated bio field\" expected=\"minLength condition flips the field into the error state\"\r\nconst wrapper = document.createElement('div');\r\n\r\nconst bio = await slice.build('Textarea', {\r\n  placeholder: 'Short bio (min 20 chars)',\r\n  rows: 3,\r\n  required: true,\r\n  conditions: { minLength: 20 }\r\n});\r\n\r\nconst validate = await slice.build('Button', {\r\n  value: 'Validate',\r\n  onClick: () => bio.validateValue()\r\n});\r\n\r\nwrapper.appendChild(bio);\r\nwrapper.appendChild(validate);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"character-limited field with live count\" expected=\"onChange drives an external character counter\"\r\nconst wrapper = document.createElement('div');\r\n\r\nconst counter = document.createElement('p');\r\ncounter.textContent = '0 / 140';\r\n\r\nconst textarea = await slice.build('Textarea', {\r\n  placeholder: \"What's happening?\",\r\n  maxlength: 140,\r\n  autoGrow: true,\r\n  onChange: (value) => {\r\n    counter.textContent = `${value.length} / 140`;\r\n  }\r\n});\r\n\r\nwrapper.appendChild(textarea);\r\nwrapper.appendChild(counter);\r\nreturn wrapper;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nPair `autoGrow` with `maxlength` and an external counter (via `onChange`) for comment and\r\nmessage boxes — it keeps the field compact while making the limit visible.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\n`conditions` also validates **live while typing** — as soon as the field has a value, `conditions`\r\nare checked on every keystroke. Call `validateValue()` from your `Form`'s submit handler as well so\r\nan empty field is caught on submit.\r\n:::\r\n\r\n## auto-grow details\r\n\r\n`autoGrow` measures `scrollHeight`, which is `0` whenever the field has no layout — while it is still\r\ndetached, or anywhere up the tree it is `display: none`. The component handles both:\r\n\r\n- the first real measurement happens in `connectedCallback`, not `init` (`slice.build` runs `init`\r\n  **before** the parent appends the node, so a naive first measurement collapses the field to `0px`);\r\n- a hidden field keeps its **last good height** instead of being squashed, and re-measures as soon as\r\n  it becomes visible again;\r\n- a `ResizeObserver` re-measures when the field's **width** changes, so text that re-wraps on a\r\n  container resize is not clipped. The observer is disconnected in `beforeDestroy()`.\r\n\r\nPadding is tokenised so a dense consumer can compact the field without desyncing the floating label:\r\n\r\n```css\r\nslice-textarea {\r\n  --slice-textarea-pad-y: 9px;\r\n  --slice-textarea-pad-x: 12px;\r\n}\r\n```\r\n\r\nThe label's rest position is derived from `--slice-textarea-pad-y`, so overriding the tokens moves\r\nboth the field and its label together.\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"placeholder\": \"Write your message\",\r\n  \"rows\": 4\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"placeholder\": \"Write your message\",\r\n  \"rows\": 4\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Textarea', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const comment = await slice.build('Textarea', {\r\n  placeholder: 'Add a comment',\r\n  autoGrow: true,\r\n  maxlength: 500,\r\n  onChange: (value) => slice.logger.logInfo('Comment', `${value.length} chars`)\r\n});\r\nthis.appendChild(comment);\r",
               language: "javascript"
            });
            if ("Auto-growing comment box") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Auto-growing comment box";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "slice-textarea {\r\n  --slice-textarea-pad-y: 9px;\r\n  --slice-textarea-pad-x: 12px;\r\n}\r",
               language: "css"
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
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"number\",\"required\":false,\"default\":\"3\",\"allowedValues\":[]},{\"path\":\"maxlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"readonly\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"autoGrow\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"rows\",\"type\":\"number\",\"required\":false,\"default\":\"3\",\"allowedValues\":[]},{\"path\":\"maxlength\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"readonly\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"autoGrow\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"conditions\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-textareadocumentation', TextareaDocumentation);
