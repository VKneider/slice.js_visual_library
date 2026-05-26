export default class CardDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Variant gallery","expected":"renders default, outlined and elevated cards","kind":"script","content":"const variants = ['default', 'outlined', 'elevated'];\n\nconst grid = document.createElement('div');\n\nfor (const variant of variants) {\n  const card = await slice.build('Card', {\n    title: `Variant: ${variant}`,\n    text: 'Reusable content container',\n    variant\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;"},{"label":"Status cards with badge + progress","expected":"renders metrics cards with clear status","kind":"script","content":"const cards = [\n  { title: 'Build Pipeline', badge: 'Healthy', progress: 82 },\n  { title: 'QA Coverage', badge: 'Warning', progress: 63 },\n  { title: 'Deploy Queue', badge: 'Blocked', progress: 22 }\n];\n\nconst grid = document.createElement('div');\n\nfor (const config of cards) {\n  const card = await slice.build('Card', {\n    title: config.title,\n    text: 'Operational metric snapshot',\n    badge: config.badge,\n    progress: config.progress,\n    variant: 'outlined'\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;"},{"label":"Card with expandable details","expected":"details panel can be toggled using card control","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Release Notes',\n  text: 'Version 1.0.1 includes route sync and parser hardening.',\n  details: 'Highlights: docs route auto-sync, tabs registration, script preview improvements.',\n  variant: 'outlined'\n});\n\nreturn card;"},{"label":"Card with loading and disabled states","expected":"loading and disabled visual states are applied","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Project Onboarding',\n  text: 'Invite team members and configure permissions.',\n  variant: 'elevated',\n  loading: true,\n  disabled: true\n});\n\nreturn card;"},{"label":"Card as notification item","expected":"compact card for inbox and activity feeds","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Deployment completed',\n  text: 'Version 1.0.1 is now live in production.',\n  badge: 'Success',\n  variant: 'outlined'\n});\n\nreturn card;"},{"label":"Card with CTA workflow","expected":"card paired with follow-up action button","kind":"script","content":"const card = await slice.build('Card', {\n  title: 'Customer interview notes',\n  text: 'Summarize findings and send to product team.',\n  variant: 'elevated',\n  details: 'Open questions: onboarding friction, pricing clarity, mobile navigation expectations.'\n});\n\nconst action = await slice.build('Button', {\n  value: 'Open task',\n  customColor: { button: '#2563eb', label: '#ffffff' }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(action);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "card.md";
    this.markdownContent = "---\ntitle: Card\nroute: /docs/layout/card\nnavLabel: Card\nsection: Layout\ngroup: Containers\norder: 20\ndescription: Card documentation with prop scenario scripts.\ncomponent: CardDocumentation\ngenerate: true\ntags: [card, layout]\n---\n\n# Card\n\n## Overview\n`Card` provides a structured content shell with support for media, actions, badges, progress and interactive states.\n\n## Core Behavior\n- `Card` provides a reusable container for structured content with variant-driven presentation.\n- Interactive mode supports actionable cards for dashboards, release notes and workflow states.\n- Scenario scripts below cover status, metrics, and action-footer compositions used in production screens.\n\n## Basic Usage\n```javascript title=\"Build card\"\nconst card = await slice.build('Card', {\n  title: 'Profile',\n  text: 'Card content',\n  variant: 'elevated'\n});\n\nthis.appendChild(card);\n```\n\n## Prop Scenarios\n:::script label=\"Variant gallery\" expected=\"renders default, outlined and elevated cards\"\nconst variants = ['default', 'outlined', 'elevated'];\n\nconst grid = document.createElement('div');\n\nfor (const variant of variants) {\n  const card = await slice.build('Card', {\n    title: `Variant: ${variant}`,\n    text: 'Reusable content container',\n    variant\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;\n:::\n\n:::script label=\"Status cards with badge + progress\" expected=\"renders metrics cards with clear status\"\nconst cards = [\n  { title: 'Build Pipeline', badge: 'Healthy', progress: 82 },\n  { title: 'QA Coverage', badge: 'Warning', progress: 63 },\n  { title: 'Deploy Queue', badge: 'Blocked', progress: 22 }\n];\n\nconst grid = document.createElement('div');\n\nfor (const config of cards) {\n  const card = await slice.build('Card', {\n    title: config.title,\n    text: 'Operational metric snapshot',\n    badge: config.badge,\n    progress: config.progress,\n    variant: 'outlined'\n  });\n  grid.appendChild(card);\n}\n\nreturn grid;\n:::\n\n:::script label=\"Card with expandable details\" expected=\"details panel can be toggled using card control\"\nconst card = await slice.build('Card', {\n  title: 'Release Notes',\n  text: 'Version 1.0.1 includes route sync and parser hardening.',\n  details: 'Highlights: docs route auto-sync, tabs registration, script preview improvements.',\n  variant: 'outlined'\n});\n\nreturn card;\n:::\n\n:::script label=\"Card with loading and disabled states\" expected=\"loading and disabled visual states are applied\"\nconst card = await slice.build('Card', {\n  title: 'Project Onboarding',\n  text: 'Invite team members and configure permissions.',\n  variant: 'elevated',\n  loading: true,\n  disabled: true\n});\n\nreturn card;\n:::\n\n:::script label=\"Card as notification item\" expected=\"compact card for inbox and activity feeds\"\nconst card = await slice.build('Card', {\n  title: 'Deployment completed',\n  text: 'Version 1.0.1 is now live in production.',\n  badge: 'Success',\n  variant: 'outlined'\n});\n\nreturn card;\n:::\n\n:::script label=\"Card with CTA workflow\" expected=\"card paired with follow-up action button\"\nconst card = await slice.build('Card', {\n  title: 'Customer interview notes',\n  text: 'Summarize findings and send to product team.',\n  variant: 'elevated',\n  details: 'Open questions: onboarding friction, pricing clarity, mobile navigation expectations.'\n});\n\nconst action = await slice.build('Button', {\n  value: 'Open task',\n  customColor: { button: '#2563eb', label: '#ffffff' }\n});\n\nconst host = document.createElement('div');\nhost.appendChild(card);\nhost.appendChild(action);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nUse `variant` and `badge` together to surface status while keeping card content concise.\n:::\n\n## Pitfalls\n:::warning\nIf `progress` is outside `0-100`, progress visuals are removed by design.\n:::\n";
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
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `actions` | `array` | `false` | `` | - |","| `badge` | `string` | `false` | `null` | - |","| `customColor` | `object` | `false` | `null` | - |","| `details` | `string` | `false` | `null` | - |","| `disabled` | `boolean` | `false` | `false` | - |","| `icon` | `object` | `false` | `[object Object]` | - |","| `image` | `string` | `false` | `null` | - |","| `interactive` | `boolean` | `false` | `true` | - |","| `isOpen` | `boolean` | `false` | `false` | - |","| `loading` | `boolean` | `false` | `false` | - |","| `onClick` | `function` | `false` | `null` | - |","| `progress` | `number` | `false` | `null` | - |","| `text` | `string` | `false` | `null` | - |","| `title` | `string` | `false` | `null` | - |","| `variant` | `string` | `false` | `default` | `default`, `elevated`, `outlined`, `minimal` |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
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

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed #f59e0b';
          fallback.style.borderRadius = '8px';
          fallback.style.background = '#fffbeb';
          fallback.style.color = '#92400e';
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
          return createBuildFallbackNode(name);
        };

        const mount = (node) => {
          if (node instanceof Node) {
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

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
      card.appendChild(preview);
      card.appendChild(code);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-carddocumentation', CardDocumentation);
