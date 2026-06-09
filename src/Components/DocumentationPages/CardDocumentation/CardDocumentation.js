export default class CardDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Variant gallery","expected":"renders default, outlined and elevated cards","kind":"script","content":"const variants = ['default', 'outlined', 'elevated'];\n\nconst grid = document.createElement('div');\n\nfor (const variant of variants) {\n  const card = await slice.build('Card', {\n    title: `Variant: ${variant}`,\n    text: 'Reusable content container',\n    variant\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;"},{"label":"Status cards with badge","expected":"renders status cards with colored badges","kind":"script","content":"const cards = [\n  { title: 'Build Pipeline', badge: 'Healthy' },\n  { title: 'QA Coverage', badge: 'Warning' },\n  { title: 'Deploy Queue', badge: 'Blocked' }\n];\n\nconst grid = document.createElement('div');\n\nfor (const config of cards) {\n  const card = await slice.build('Card', {\n    title: config.title,\n    text: 'Operational metric snapshot',\n    badge: config.badge,\n    variant: 'outlined'\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;"},{"label":"Card with expandable details","expected":"details panel can be toggled using card control","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Release Notes',\n  text: 'Version 1.0.1 includes route sync and parser hardening.',\n  details: 'Highlights: docs route auto-sync, tabs registration, script preview improvements.',\n  variant: 'outlined'\n});\n\nreturn card;"},{"label":"Card in a disabled state","expected":"disabled visual state is applied","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Project Onboarding',\n  text: 'Invite team members and configure permissions.',\n  variant: 'elevated',\n  disabled: true\n});\n\nreturn card;"},{"label":"Card as notification item","expected":"compact card for inbox and activity feeds","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Deployment completed',\n  text: 'Version 1.0.1 is now live in production.',\n  badge: 'Success',\n  variant: 'outlined'\n});\n\nreturn card;"},{"label":"Card with CTA workflow","expected":"card paired with follow-up action button","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Customer interview notes',\n  text: 'Summarize findings and send to product team.',\n  variant: 'elevated',\n  details: 'Open questions: onboarding friction, pricing clarity, mobile navigation expectations.'\n});\n\nconst action = await slice.build('Button', {\n  value: 'Open task',\n  customColor: { background: '#2563eb', text: '#ffffff' }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(action);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "card.md";
    this.markdownContent = "---\ntitle: Card\nroute: /docs/layout/card\nnavLabel: Card\nsection: Layout\ngroup: Containers\norder: 20\ndescription: Card documentation with prop scenario scripts.\ncomponent: CardDocumentation\ngenerate: true\ntags: [card, layout]\n---\n\n# Card\n\n## Overview\n`Card` provides a structured content shell with support for media, actions, badges, progress and interactive states.\n\n## Core Behavior\n- `Card` provides a reusable container for structured content with variant-driven presentation.\n- Interactive mode supports actionable cards for dashboards, release notes and workflow states.\n- Scenario scripts below cover status, metrics, and action-footer compositions used in production screens.\n\n## Live Preview\n:::component name=\"Card\"\n{\n  \"title\": \"Profile\",\n  \"text\": \"A reusable content container with a title and body.\",\n  \"variant\": \"elevated\"\n}\n:::\n\n## Prop Scenarios\n:::script label=\"Variant gallery\" expected=\"renders default, outlined and elevated cards\"\nconst variants = ['default', 'outlined', 'elevated'];\n\nconst grid = document.createElement('div');\n\nfor (const variant of variants) {\n  const card = await slice.build('Card', {\n    title: `Variant: ${variant}`,\n    text: 'Reusable content container',\n    variant\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;\n:::\n\n:::script label=\"Status cards with badge\" expected=\"renders status cards with colored badges\"\nconst cards = [\n  { title: 'Build Pipeline', badge: 'Healthy' },\n  { title: 'QA Coverage', badge: 'Warning' },\n  { title: 'Deploy Queue', badge: 'Blocked' }\n];\n\nconst grid = document.createElement('div');\n\nfor (const config of cards) {\n  const card = await slice.build('Card', {\n    title: config.title,\n    text: 'Operational metric snapshot',\n    badge: config.badge,\n    variant: 'outlined'\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;\n:::\n\n:::script label=\"Card with expandable details\" expected=\"details panel can be toggled using card control\"\nconst card = await slice.build('Card', {\n  title: 'Release Notes',\n  text: 'Version 1.0.1 includes route sync and parser hardening.',\n  details: 'Highlights: docs route auto-sync, tabs registration, script preview improvements.',\n  variant: 'outlined'\n});\n\nreturn card;\n:::\n\n:::script label=\"Card in a disabled state\" expected=\"disabled visual state is applied\"\nconst card = await slice.build('Card', {\n  title: 'Project Onboarding',\n  text: 'Invite team members and configure permissions.',\n  variant: 'elevated',\n  disabled: true\n});\n\nreturn card;\n:::\n\n:::script label=\"Card as notification item\" expected=\"compact card for inbox and activity feeds\"\nconst card = await slice.build('Card', {\n  title: 'Deployment completed',\n  text: 'Version 1.0.1 is now live in production.',\n  badge: 'Success',\n  variant: 'outlined'\n});\n\nreturn card;\n:::\n\n:::script label=\"Card with CTA workflow\" expected=\"card paired with follow-up action button\"\nconst card = await slice.build('Card', {\n  title: 'Customer interview notes',\n  text: 'Summarize findings and send to product team.',\n  variant: 'elevated',\n  details: 'Open questions: onboarding friction, pricing clarity, mobile navigation expectations.'\n});\n\nconst action = await slice.build('Button', {\n  value: 'Open task',\n  customColor: { background: '#2563eb', text: '#ffffff' }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(action);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nUse `variant` and `badge` together to surface status while keeping card content concise.\n:::\n\n## Pitfalls\n:::warning\nIf `progress` is outside `0-100`, progress visuals are removed by design.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"title\": \"Profile\",\n  \"text\": \"A reusable content container with a title and body.\",\n  \"variant\": \"elevated\"\n}") {
               try {
                  props = JSON.parse("{\n  \"title\": \"Profile\",\n  \"text\": \"A reusable content container with a title and body.\",\n  \"variant\": \"elevated\"\n}");
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
            if ("{\"props\":[{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"object\",\"required\":false,\"default\":\"[object Object]\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"image\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"elevated\",\"outlined\",\"minimal\"]},{\"path\":\"interactive\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"isOpen\",\"type\":\"boolean\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"details\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"badge\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"object\",\"required\":false,\"default\":\"[object Object]\",\"allowedValues\":[]},{\"path\":\"customColor\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"image\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"default\",\"allowedValues\":[\"default\",\"elevated\",\"outlined\",\"minimal\"]},{\"path\":\"interactive\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"isOpen\",\"type\":\"boolean\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"details\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"badge\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]}]}");
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

    const section = document.createElement('section');
    section.classList.add('doc-script-scenarios');

    const title = document.createElement('h2');
    title.textContent = 'Prop Scenarios';
    section.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.classList.add('doc-script-subtitle');
    subtitle.textContent = 'Interactive demos validating component behavior.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
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

      section.appendChild(demobox);
      demobox.appendCode(code);
      section.appendChild(errorMessage);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-carddocumentation', CardDocumentation);
