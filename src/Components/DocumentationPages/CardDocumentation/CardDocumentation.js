export default class CardDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Variant gallery","expected":"renders default, outlined and elevated cards","kind":"script","content":"const variants = ['default', 'outlined', 'elevated'];\n\nconst grid = document.createElement('div');\ngrid.style.display = 'grid';\ngrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\ngrid.style.gap = '12px';\n\nfor (const variant of variants) {\n  const card = await slice.build('Card', {\n    title: `Variant: ${variant}`,\n    text: 'Reusable content container',\n    variant\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;"},{"label":"Status cards with badge + progress","expected":"renders metrics cards with clear status","kind":"script","content":"const cards = [\n  { title: 'Build Pipeline', badge: 'Healthy', progress: 82, customColor: { button: '#e2e8f0', label: '#0f172a' } },\n  { title: 'QA Coverage', badge: 'Warning', progress: 63, customColor: { button: '#fde68a', label: '#7c2d12' } },\n  { title: 'Deploy Queue', badge: 'Blocked', progress: 22, customColor: { button: '#fecaca', label: '#7f1d1d' } }\n];\n\nconst grid = document.createElement('div');\ngrid.style.display = 'grid';\ngrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';\ngrid.style.gap = '12px';\n\nfor (const config of cards) {\n  const card = await slice.build('Card', {\n    title: config.title,\n    text: 'Operational metric snapshot',\n    badge: config.badge,\n    progress: config.progress,\n    variant: 'outlined'\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;"},{"label":"Interactive card action","expected":"card click toggles contextual message","kind":"script","content":"const note = document.createElement('p');\nnote.textContent = 'Click the card to change this message.';\n\nconst card = await slice.build('Card', {\n  title: 'Release Notes',\n  text: 'Tap to acknowledge latest update.',\n  variant: 'minimal',\n  onClick: () => {\n    note.textContent = note.textContent.includes('acknowledge')\n      ? 'Release acknowledged by reviewer.'\n      : 'Click the card to change this message.';\n  }\n});\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(card);\nreturn wrapper;"},{"label":"Card with action footer","expected":"renders card paired with action buttons","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Project Onboarding',\n  text: 'Invite team members and configure permissions.',\n  variant: 'elevated'\n});\n\nconst invite = await slice.build('Button', { value: 'Invite', customColor: { button: '#2563eb', label: '#ffffff' } });\nconst permissions = await slice.build('Button', { value: 'Permissions' });\n\nconst actions = document.createElement('div');\nactions.style.display = 'flex';\nactions.style.gap = '8px';\nactions.style.marginTop = '8px';\nactions.appendChild(invite);\nactions.appendChild(permissions);\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(actions);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "card.md";
    this.markdownContent = "---\ntitle: Card\nroute: /docs/layout/card\nnavLabel: Card\nsection: Layout\ngroup: Containers\norder: 20\ndescription: Card documentation with prop scenario scripts.\ncomponent: CardDocumentation\ngenerate: true\ntags: [card, layout]\n---\n\n# Card\n\n## Overview\n`Card` provides a structured content shell with support for media, actions, badges, progress and interactive states.\n\n## Core Behavior\n- `Card` provides a reusable container for structured content with variant-driven presentation.\n- Interactive mode supports actionable cards for dashboards, release notes and workflow states.\n- Scenario scripts below cover status, metrics, and action-footer compositions used in production screens.\n\n## Basic Usage\n```javascript title=\"Build card\"\nconst card = await slice.build('Card', {\n  title: 'Profile',\n  text: 'Card content',\n  variant: 'elevated'\n});\n\nthis.appendChild(card);\n```\n\n## Prop Scenarios\n:::script label=\"Variant gallery\" expected=\"renders default, outlined and elevated cards\"\nconst variants = ['default', 'outlined', 'elevated'];\n\nconst grid = document.createElement('div');\ngrid.style.display = 'grid';\ngrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';\ngrid.style.gap = '12px';\n\nfor (const variant of variants) {\n  const card = await slice.build('Card', {\n    title: `Variant: ${variant}`,\n    text: 'Reusable content container',\n    variant\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;\n:::\n\n:::script label=\"Status cards with badge + progress\" expected=\"renders metrics cards with clear status\"\nconst cards = [\n  { title: 'Build Pipeline', badge: 'Healthy', progress: 82, customColor: { button: '#e2e8f0', label: '#0f172a' } },\n  { title: 'QA Coverage', badge: 'Warning', progress: 63, customColor: { button: '#fde68a', label: '#7c2d12' } },\n  { title: 'Deploy Queue', badge: 'Blocked', progress: 22, customColor: { button: '#fecaca', label: '#7f1d1d' } }\n];\n\nconst grid = document.createElement('div');\ngrid.style.display = 'grid';\ngrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';\ngrid.style.gap = '12px';\n\nfor (const config of cards) {\n  const card = await slice.build('Card', {\n    title: config.title,\n    text: 'Operational metric snapshot',\n    badge: config.badge,\n    progress: config.progress,\n    variant: 'outlined'\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;\n:::\n\n:::script label=\"Interactive card action\" expected=\"card click toggles contextual message\"\nconst note = document.createElement('p');\nnote.textContent = 'Click the card to change this message.';\n\nconst card = await slice.build('Card', {\n  title: 'Release Notes',\n  text: 'Tap to acknowledge latest update.',\n  variant: 'minimal',\n  onClick: () => {\n    note.textContent = note.textContent.includes('acknowledge')\n      ? 'Release acknowledged by reviewer.'\n      : 'Click the card to change this message.';\n  }\n});\n\nconst wrapper = document.createElement('div');\nwrapper.appendChild(note);\nwrapper.appendChild(card);\nreturn wrapper;\n:::\n\n:::script label=\"Card with action footer\" expected=\"renders card paired with action buttons\"\nconst card = await slice.build('Card', {\n  title: 'Project Onboarding',\n  text: 'Invite team members and configure permissions.',\n  variant: 'elevated'\n});\n\nconst invite = await slice.build('Button', { value: 'Invite', customColor: { button: '#2563eb', label: '#ffffff' } });\nconst permissions = await slice.build('Button', { value: 'Permissions' });\n\nconst actions = document.createElement('div');\nactions.style.display = 'flex';\nactions.style.gap = '8px';\nactions.style.marginTop = '8px';\nactions.appendChild(invite);\nactions.appendChild(permissions);\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(actions);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nUse `variant` and `badge` together to surface status while keeping card content concise.\n:::\n\n## Pitfalls\n:::warning\nIf `progress` is outside `0-100`, progress visuals are removed by design.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const card = await slice.build('Card', {\n  title: 'Profile',\n  text: 'Card content',\n  variant: 'elevated'\n});\n\nthis.appendChild(card);",
               language: "javascript"
            });
            if ("Build card") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build card";
               container.appendChild(label);
            }
            container.appendChild(code);
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
    subtitle.textContent = 'Run each scenario to validate behavior and prevent regressions.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
      const card = document.createElement('article');
      card.classList.add('doc-script-card');

      const header = document.createElement('div');
      header.classList.add('doc-script-header');

      const heading = document.createElement('h3');
      heading.classList.add('doc-script-title');
      heading.textContent = scenario.label;
      header.appendChild(heading);

      card.appendChild(header);

      const preview = document.createElement('div');
      preview.classList.add('doc-script-preview');
      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        preview.innerHTML = '';
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const mount = (node) => {
          if (node instanceof Node) {
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, slice, document, mount);

          if (result instanceof Node) {
            preview.appendChild(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                preview.appendChild(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });
      card.appendChild(code);
      card.appendChild(preview);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-carddocumentation', CardDocumentation);
