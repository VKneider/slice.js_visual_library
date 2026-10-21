export default class CardDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Variant gallery","expected":"renders default, outlined and elevated cards","kind":"script","content":"const variants = ['default', 'outlined', 'elevated'];\r\n\r\nconst grid = document.createElement('div');\r\n\r\nconst variantIcons = { default: 'star', outlined: 'info-circle', elevated: 'wand-magic-sparkles' };\r\n\r\nfor (const variant of variants) {\r\n  const card = await slice.build('Card', {\r\n    title: `Variant: ${variant}`,\r\n    text: 'Reusable content container',\r\n    headerIcon: variantIcons[variant] || 'star',\r\n    variant\r\n  });\r\n  grid.appendChild(card);\r\n}\r\n\r\nreturn grid;"},{"label":"Status cards with badge","expected":"renders status cards with colored badges","kind":"script","content":"const cards = [\r\n  { title: 'Build Pipeline', badge: 'Healthy', icon: 'check-circle' },\r\n  { title: 'QA Coverage', badge: 'Warning', icon: 'exclamation-circle' },\r\n  { title: 'Deploy Queue', badge: 'Blocked', icon: 'close-circle' }\r\n];\r\n\r\nconst grid = document.createElement('div');\r\n\r\nfor (const config of cards) {\r\n  const card = await slice.build('Card', {\r\n    title: config.title,\r\n    text: 'Operational metric snapshot',\r\n    headerIcon: config.icon,\r\n    badge: config.badge,\r\n    variant: 'outlined'\r\n  });\r\n  grid.appendChild(card);\r\n}\r\n\r\nreturn grid;"},{"label":"Card with expandable details","expected":"details panel can be toggled using card control","kind":"script","content":"const card = await slice.build('Card', {\r\n  title: 'Release Notes',\r\n  text: 'Version 1.0.1 includes route sync and parser hardening.',\r\n  headerIcon: 'check-circle',\r\n  details: 'Highlights: docs route auto-sync, tabs registration, script preview improvements.',\r\n  variant: 'outlined'\r\n});\r\n\r\nreturn card;"},{"label":"Card in a disabled state","expected":"disabled visual state is applied","kind":"script","content":"const card = await slice.build('Card', {\r\n  title: 'Project Onboarding',\r\n  text: 'Invite team members and configure permissions.',\r\n  headerIcon: 'user',\r\n  variant: 'elevated',\r\n  disabled: true\r\n});\r\n\r\nreturn card;"},{"label":"Card as notification item","expected":"compact card for inbox and activity feeds","kind":"script","content":"const card = await slice.build('Card', {\r\n  title: 'Deployment completed',\r\n  text: 'Version 1.0.1 is now live in production.',\r\n  badge: 'Success',\r\n  variant: 'outlined'\r\n});\r\n\r\nreturn card;"},{"label":"Card with CTA workflow","expected":"card paired with follow-up action button","kind":"script","content":"const card = await slice.build('Card', {\r\n  title: 'Customer interview notes',\r\n  text: 'Summarize findings and send to product team.',\r\n  variant: 'elevated',\r\n  details: 'Open questions: onboarding friction, pricing clarity, mobile navigation expectations.'\r\n});\r\n\r\nconst action = await slice.build('Button', {\r\n  value: 'Open task',\r\n  customColor: { background: '#2563eb', text: '#ffffff' }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(card);\r\nhost.appendChild(action);\r\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "card.md";
    this.markdownContent = "---\r\ntitle: Card\r\nroute: /docs/layout/card\r\nnavLabel: Card\r\nsection: Layout\r\ngroup: Containers\r\norder: 20\r\ndescription: Card documentation with prop scenario scripts.\r\ncomponent: CardDocumentation\r\ngenerate: true\r\ntags: [card, layout]\r\n---\r\n\r\n# Card\r\n\r\n## Overview\r\n`Card` provides a structured content shell with support for media, actions, badges, progress and interactive states.\r\n\r\n## Core Behavior\r\n- `Card` provides a reusable container for structured content with variant-driven presentation.\r\n- Interactive mode supports actionable cards for dashboards, release notes and workflow states.\r\n- Scenario scripts below cover status, metrics, and action-footer compositions used in production screens.\r\n\r\n## Live Preview\r\n:::component name=\"Card\"\r\n{\r\n  \"title\": \"Profile\",\r\n  \"text\": \"A reusable content container with a title and body.\",\r\n  \"variant\": \"elevated\"\r\n}\r\n:::\r\n\r\n## Icons\r\n\r\nTwo independent slots, and they are different things:\r\n\r\n- `headerIcon` — the small mark **beside the title**, in a rounded chip. This is the\r\n  usual \"card with an avatar or a glyph\" look. Accepts a name or\r\n  `{ name, size, color }`:\r\n\r\n  ```javascript\r\n  await slice.build('Card', { title: 'Slice.js', headerIcon: 'sliceJs' });\r\n  ```\r\n\r\n- `icon` — the **banner above the content**, for an image or a large mark. Use it for\r\n  artwork, not for a glyph; for a glyph, use `headerIcon`.\r\n\r\nNeither is shown unless you ask. A Card with neither has no icon row at all.\r\n\r\n:::tip\r\nThe Slice marks (`sliceJs`, `slicePizza`, `sliceLogo`, `singleSlice`) carry their own\r\nviewBox from the original sprite — `sliceJs` is 1061x1320, not 24x24 — so they fill the\r\nchip correctly instead of overflowing it.\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"Variant gallery\" expected=\"renders default, outlined and elevated cards\"\r\nconst variants = ['default', 'outlined', 'elevated'];\r\n\r\nconst grid = document.createElement('div');\r\n\r\nconst variantIcons = { default: 'star', outlined: 'info-circle', elevated: 'wand-magic-sparkles' };\r\n\r\nfor (const variant of variants) {\r\n  const card = await slice.build('Card', {\r\n    title: `Variant: ${variant}`,\r\n    text: 'Reusable content container',\r\n    headerIcon: variantIcons[variant] || 'star',\r\n    variant\r\n  });\r\n  grid.appendChild(card);\r\n}\r\n\r\nreturn grid;\r\n:::\r\n\r\n:::script label=\"Status cards with badge\" expected=\"renders status cards with colored badges\"\r\nconst cards = [\r\n  { title: 'Build Pipeline', badge: 'Healthy', icon: 'check-circle' },\r\n  { title: 'QA Coverage', badge: 'Warning', icon: 'exclamation-circle' },\r\n  { title: 'Deploy Queue', badge: 'Blocked', icon: 'close-circle' }\r\n];\r\n\r\nconst grid = document.createElement('div');\r\n\r\nfor (const config of cards) {\r\n  const card = await slice.build('Card', {\r\n    title: config.title,\r\n    text: 'Operational metric snapshot',\r\n    headerIcon: config.icon,\r\n    badge: config.badge,\r\n    variant: 'outlined'\r\n  });\r\n  grid.appendChild(card);\r\n}\r\n\r\nreturn grid;\r\n:::\r\n\r\n:::script label=\"Card with expandable details\" expected=\"details panel can be toggled using card control\"\r\nconst card = await slice.build('Card', {\r\n  title: 'Release Notes',\r\n  text: 'Version 1.0.1 includes route sync and parser hardening.',\r\n  headerIcon: 'check-circle',\r\n  details: 'Highlights: docs route auto-sync, tabs registration, script preview improvements.',\r\n  variant: 'outlined'\r\n});\r\n\r\nreturn card;\r\n:::\r\n\r\n:::script label=\"Card in a disabled state\" expected=\"disabled visual state is applied\"\r\nconst card = await slice.build('Card', {\r\n  title: 'Project Onboarding',\r\n  text: 'Invite team members and configure permissions.',\r\n  headerIcon: 'user',\r\n  variant: 'elevated',\r\n  disabled: true\r\n});\r\n\r\nreturn card;\r\n:::\r\n\r\n:::script label=\"Card as notification item\" expected=\"compact card for inbox and activity feeds\"\r\nconst card = await slice.build('Card', {\r\n  title: 'Deployment completed',\r\n  text: 'Version 1.0.1 is now live in production.',\r\n  badge: 'Success',\r\n  variant: 'outlined'\r\n});\r\n\r\nreturn card;\r\n:::\r\n\r\n:::script label=\"Card with CTA workflow\" expected=\"card paired with follow-up action button\"\r\nconst card = await slice.build('Card', {\r\n  title: 'Customer interview notes',\r\n  text: 'Summarize findings and send to product team.',\r\n  variant: 'elevated',\r\n  details: 'Open questions: onboarding friction, pricing clarity, mobile navigation expectations.'\r\n});\r\n\r\nconst action = await slice.build('Button', {\r\n  value: 'Open task',\r\n  customColor: { background: '#2563eb', text: '#ffffff' }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(card);\r\nhost.appendChild(action);\r\nreturn host;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nUse `variant` and `badge` together to surface status while keeping card content concise.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nIf `progress` is outside `0-100`, progress visuals are removed by design.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"title\": \"Profile\",\r\n  \"text\": \"A reusable content container with a title and body.\",\r\n  \"variant\": \"elevated\"\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"title\": \"Profile\",\r\n  \"text\": \"A reusable content container with a title and body.\",\r\n  \"variant\": \"elevated\"\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Card', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"headerIcon\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"image\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"elevated\",\"outlined\",\"minimal\"]},{\"path\":\"interactive\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"isOpen\",\"type\":\"boolean\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"details\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"badge\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"headerIcon\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"any\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"image\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"elevated\",\"outlined\",\"minimal\"]},{\"path\":\"interactive\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"isOpen\",\"type\":\"boolean\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"details\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"badge\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]}]}");
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

customElements.define('slice-carddocumentation', CardDocumentation);
