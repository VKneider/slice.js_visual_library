export default class ButtonDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Sizes","expected":"a full-size and a compact button side by side","kind":"script","content":"const row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nconst big = await slice.build('Button', { value: 'Save changes' });\r\nconst small = await slice.build('Button', { value: 'Save', size: 'sm' });\r\nrow.appendChild(big);\r\nrow.appendChild(small);\r\nmount(row);"},{"label":"Danger variant","expected":"a red destructive button","kind":"script","content":"const row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nconst save = await slice.build('Button', { value: 'Keep' });\r\nconst del = await slice.build('Button', {\r\n  value: 'Delete project',\r\n  variant: 'danger',\r\n  icon: { name: 'trash-bin', iconStyle: 'filled' }\r\n});\r\nrow.appendChild(save);\r\nrow.appendChild(del);\r\nmount(row);"},{"label":"Variants","expected":"filled, outlined, ghost and soft buttons","kind":"script","content":"const row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';\r\n\r\nfor (const variant of ['filled', 'outlined', 'ghost', 'soft']) {\r\n  const btn = await slice.build('Button', { value: variant, variant });\r\n  row.appendChild(btn);\r\n}\r\n\r\nreturn row;"},{"label":"Primary and secondary variants","expected":"renders two styled action buttons","kind":"script","content":"const primary = await slice.build('Button', { value: 'Primary Action' });\r\nconst secondary = await slice.build('Button', {\r\n  value: 'Secondary Action',\r\n  customColor: { background: '#5468ff', text: '#ffffff' }\r\n});\r\n\r\nconst row = document.createElement('div');\r\nrow.appendChild(primary);\r\nrow.appendChild(secondary);\r\nreturn row;"},{"label":"Button with callback state","expected":"click toggles button label","kind":"script","content":"const clickButton = await slice.build('Button', {\r\n  value: 'Click me',\r\n  onClick: () => {\r\n    clickButton.value = clickButton.value === 'Click me' ? 'Clicked' : 'Click me';\r\n  }\r\n});\r\n\r\nconst helper = document.createElement('p');\r\nhelper.textContent = 'Click the button to toggle its text.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(helper);\r\nwrapper.appendChild(clickButton);\r\nreturn wrapper;"},{"label":"Icon + custom color use case","expected":"renders call-to-action button with icon","kind":"script","content":"const cta = await slice.build('Button', {\r\n  value: 'Download package',\r\n  icon: { name: 'download', iconStyle: 'filled' },\r\n  customColor: { background: '#16a34a', text: '#ffffff' }\r\n});\r\n\r\nconst text = document.createElement('p');\r\ntext.textContent = 'Typical CTA usage with icon and branded color.';\r\n\r\nconst block = document.createElement('div');\r\nblock.appendChild(text);\r\nblock.appendChild(cta);\r\nreturn block;"},{"label":"Toolbar action group","expected":"renders a compact row of related actions","kind":"script","content":"const actions = [\r\n  { value: 'Edit', icon: { name: 'edit', iconStyle: 'filled' } },\r\n  { value: 'Share', icon: { name: 'share-nodes', iconStyle: 'filled' }, customColor: { background: '#2563eb', text: '#ffffff' } },\r\n  { value: 'Delete', icon: { name: 'trash-bin', iconStyle: 'filled' }, customColor: { background: '#dc2626', text: '#ffffff' } }\r\n];\r\n\r\nconst row = document.createElement('div');\r\n\r\nfor (const config of actions) {\r\n  const button = await slice.build('Button', config);\r\n  row.appendChild(button);\r\n}\r\n\r\nreturn row;"},{"label":"Button inside card footer","expected":"button used as secondary action in card","kind":"script","content":"const card = await slice.build('Card', {\r\n  title: 'Invoice #412',\r\n  text: 'Pending approval from accounting.',\r\n  variant: 'outlined'\r\n});\r\n\r\nconst approve = await slice.build('Button', {\r\n  value: 'Approve',\r\n  customColor: { background: '#15803d', text: '#ffffff' }\r\n});\r\n\r\nconst reject = await slice.build('Button', {\r\n  value: 'Reject',\r\n  customColor: { background: '#b91c1c', text: '#ffffff' }\r\n});\r\n\r\nconst footer = document.createElement('div');\r\nfooter.appendChild(approve);\r\nfooter.appendChild(reject);\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(card);\r\nhost.appendChild(footer);\r\nreturn host;"},{"label":"Icon-only utility row","expected":"small icon buttons for quick actions","kind":"script","content":"const iconConfigs = [\r\n  { name: 'search', iconStyle: 'filled', size: '16px', color: '#0f172a' },\r\n  { name: 'download', iconStyle: 'filled', size: '16px', color: '#0f172a' },\r\n  { name: 'copy', iconStyle: 'filled', size: '16px', color: '#0f172a' }\r\n];\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:6px;';\r\n\r\nfor (const iconConfig of iconConfigs) {\r\n  const button = await slice.build('Button', {\r\n    value: '',\r\n    size: 'sm',\r\n    icon: iconConfig,\r\n    customColor: { background: '#e2e8f0', text: '#0f172a' }\r\n  });\r\n  row.appendChild(button);\r\n}\r\n\r\nreturn row;"},{"label":"async loading action","expected":"button reflects loading-like action flow","kind":"script","content":"const submit = await slice.build('Button', {\r\n  value: 'Submit',\r\n  onClick: async () => {\r\n    submit.value = 'Submitting...';\r\n    await new Promise((resolve) => setTimeout(resolve, 400));\r\n    submit.value = 'Submitted';\r\n  }\r\n});\r\n\r\nreturn submit;"}];
  }

  async init() {
    this.markdownPath = "button.md";
    this.markdownContent = "---\r\ntitle: Button\r\nroute: /docs/input/button\r\nnavLabel: Button\r\nsection: Input Components\r\ngroup: Basic\r\norder: 10\r\ndescription: Button documentation with executable prop scenarios.\r\ncomponent: ButtonDocumentation\r\ngenerate: true\r\ntags: [button, input]\r\n---\r\n\r\n# Button\r\n\r\n## Overview\r\nThe `Button` component renders an action trigger and supports text, callback, icon and custom colors.\r\n\r\n## Core Behavior\r\n- `Button` dispatches action intent through `onClick` while keeping visual state driven by props.\r\n- The look is set with `variant` (`filled` · `outlined` · `ghost` · `soft` · `danger`), all derived from theme tokens; `customColor` overrides the colors when you need an exact value.\r\n- Density is set with `size` (`md` · `sm`); `sm` trims padding, type size and radius for toolbars and table rows.\r\n- `icon` takes either the object form `{ name, iconStyle }` or a bare name string, so `icon: 'trash-bin'` is enough when you do not need `iconStyle`.\r\n- Use script scenarios below as the living behavior contract; static props are documented in the generated props section.\r\n\r\n## Live Preview\r\n:::component name=\"Button\"\r\n{\r\n  \"value\": \"Save changes\"\r\n}\r\n:::\r\n\r\n## Variants\r\nAll variants are built from the theme tokens, so they follow the active theme automatically.\r\nUse `danger` for destructive actions (delete, remove, revoke) — it reads as a distinct intent, where\r\n`customColor` only repaints a button that already looks like every other one.\r\n\r\n## Sizes\r\n`size: 'sm'` is the compact modifier for dense rows. The class swap is idempotent, so toggling\r\n`size` back to `'md'` (or an unknown value) removes the modifier.\r\n\r\n:::script label=\"Sizes\" expected=\"a full-size and a compact button side by side\"\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nconst big = await slice.build('Button', { value: 'Save changes' });\r\nconst small = await slice.build('Button', { value: 'Save', size: 'sm' });\r\nrow.appendChild(big);\r\nrow.appendChild(small);\r\nmount(row);\r\n:::\r\n\r\n## Destructive action\r\n:::script label=\"Danger variant\" expected=\"a red destructive button\"\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;align-items:center;';\r\n\r\nconst save = await slice.build('Button', { value: 'Keep' });\r\nconst del = await slice.build('Button', {\r\n  value: 'Delete project',\r\n  variant: 'danger',\r\n  icon: { name: 'trash-bin', iconStyle: 'filled' }\r\n});\r\nrow.appendChild(save);\r\nrow.appendChild(del);\r\nmount(row);\r\n:::\r\n\r\n:::script label=\"Variants\" expected=\"filled, outlined, ghost and soft buttons\"\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center;';\r\n\r\nfor (const variant of ['filled', 'outlined', 'ghost', 'soft']) {\r\n  const btn = await slice.build('Button', { value: variant, variant });\r\n  row.appendChild(btn);\r\n}\r\n\r\nreturn row;\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"Primary and secondary variants\" expected=\"renders two styled action buttons\"\r\nconst primary = await slice.build('Button', { value: 'Primary Action' });\r\nconst secondary = await slice.build('Button', {\r\n  value: 'Secondary Action',\r\n  customColor: { background: '#5468ff', text: '#ffffff' }\r\n});\r\n\r\nconst row = document.createElement('div');\r\nrow.appendChild(primary);\r\nrow.appendChild(secondary);\r\nreturn row;\r\n:::\r\n\r\n:::script label=\"Button with callback state\" expected=\"click toggles button label\"\r\nconst clickButton = await slice.build('Button', {\r\n  value: 'Click me',\r\n  onClick: () => {\r\n    clickButton.value = clickButton.value === 'Click me' ? 'Clicked' : 'Click me';\r\n  }\r\n});\r\n\r\nconst helper = document.createElement('p');\r\nhelper.textContent = 'Click the button to toggle its text.';\r\n\r\nconst wrapper = document.createElement('div');\r\nwrapper.appendChild(helper);\r\nwrapper.appendChild(clickButton);\r\nreturn wrapper;\r\n:::\r\n\r\n:::script label=\"Icon + custom color use case\" expected=\"renders call-to-action button with icon\"\r\nconst cta = await slice.build('Button', {\r\n  value: 'Download package',\r\n  icon: { name: 'download', iconStyle: 'filled' },\r\n  customColor: { background: '#16a34a', text: '#ffffff' }\r\n});\r\n\r\nconst text = document.createElement('p');\r\ntext.textContent = 'Typical CTA usage with icon and branded color.';\r\n\r\nconst block = document.createElement('div');\r\nblock.appendChild(text);\r\nblock.appendChild(cta);\r\nreturn block;\r\n:::\r\n\r\n:::script label=\"Toolbar action group\" expected=\"renders a compact row of related actions\"\r\nconst actions = [\r\n  { value: 'Edit', icon: { name: 'edit', iconStyle: 'filled' } },\r\n  { value: 'Share', icon: { name: 'share-nodes', iconStyle: 'filled' }, customColor: { background: '#2563eb', text: '#ffffff' } },\r\n  { value: 'Delete', icon: { name: 'trash-bin', iconStyle: 'filled' }, customColor: { background: '#dc2626', text: '#ffffff' } }\r\n];\r\n\r\nconst row = document.createElement('div');\r\n\r\nfor (const config of actions) {\r\n  const button = await slice.build('Button', config);\r\n  row.appendChild(button);\r\n}\r\n\r\nreturn row;\r\n:::\r\n\r\n:::script label=\"Button inside card footer\" expected=\"button used as secondary action in card\"\r\nconst card = await slice.build('Card', {\r\n  title: 'Invoice #412',\r\n  text: 'Pending approval from accounting.',\r\n  variant: 'outlined'\r\n});\r\n\r\nconst approve = await slice.build('Button', {\r\n  value: 'Approve',\r\n  customColor: { background: '#15803d', text: '#ffffff' }\r\n});\r\n\r\nconst reject = await slice.build('Button', {\r\n  value: 'Reject',\r\n  customColor: { background: '#b91c1c', text: '#ffffff' }\r\n});\r\n\r\nconst footer = document.createElement('div');\r\nfooter.appendChild(approve);\r\nfooter.appendChild(reject);\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(card);\r\nhost.appendChild(footer);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"Icon-only utility row\" expected=\"small icon buttons for quick actions\"\r\nconst iconConfigs = [\r\n  { name: 'search', iconStyle: 'filled', size: '16px', color: '#0f172a' },\r\n  { name: 'download', iconStyle: 'filled', size: '16px', color: '#0f172a' },\r\n  { name: 'copy', iconStyle: 'filled', size: '16px', color: '#0f172a' }\r\n];\r\n\r\nconst row = document.createElement('div');\r\nrow.style.cssText = 'display:flex;gap:6px;';\r\n\r\nfor (const iconConfig of iconConfigs) {\r\n  const button = await slice.build('Button', {\r\n    value: '',\r\n    size: 'sm',\r\n    icon: iconConfig,\r\n    customColor: { background: '#e2e8f0', text: '#0f172a' }\r\n  });\r\n  row.appendChild(button);\r\n}\r\n\r\nreturn row;\r\n:::\r\n\r\n:::script label=\"async loading action\" expected=\"button reflects loading-like action flow\"\r\nconst submit = await slice.build('Button', {\r\n  value: 'Submit',\r\n  onClick: async () => {\r\n    submit.value = 'Submitting...';\r\n    await new Promise((resolve) => setTimeout(resolve, 400));\r\n    submit.value = 'Submitted';\r\n  }\r\n});\r\n\r\nreturn submit;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nPrefer explicit `onClickCallback` instead of manually attaching listeners outside the component.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nDo not pass non-object values into `customColor` or `icon`. Static props validation reports type warnings.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"value\": \"Save changes\"\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"value\": \"Save changes\"\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Button', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-12"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"Button\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[\"filled\",\"outlined\",\"ghost\",\"soft\",\"danger\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"className\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"value\",\"type\":\"string\",\"required\":false,\"default\":\"Button\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[\"filled\",\"outlined\",\"ghost\",\"soft\",\"danger\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"className\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-buttondocumentation', ButtonDocumentation);
