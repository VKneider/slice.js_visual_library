export default class RouteDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"static route config","expected":"Route stores path/component props for exact matching","kind":"script","content":"const route = await slice.build('Route', {\n  path: '/account',\n  component: 'CardDocumentation'\n});\n\nconst summary = document.createElement('p');\nsummary.textContent = `${route.path} -> ${route.component}`;\nreturn summary;"},{"label":"dynamic path matcher","expected":"Route extracts params from ${param} patterns","kind":"script","content":"const route = await slice.build('Route', {\n  path: '/users/${id}',\n  component: 'CardDocumentation'\n});\n\nconst matcher = route.compilePathPattern('/users/${id}');\nconst match = '/users/42'.match(matcher.regex);\nconst output = document.createElement('p');\noutput.textContent = match ? `Param ${matcher.paramNames[0]}=${match[1]}` : 'No match';\nreturn output;"},{"label":"metadata payload","expected":"Route keeps metadata available for routed component","kind":"script","content":"const route = await slice.build('Route', {\n  path: '/billing',\n  component: 'CardDocumentation',\n  metadata: { private: true, title: 'Billing' }\n});\n\nconst info = document.createElement('p');\ninfo.textContent = `Metadata title: ${route.props.metadata.title}`;\nreturn info;"}];
  }

  async init() {
    this.markdownPath = "route.md";
    this.markdownContent = "---\ntitle: Route\nroute: /docs/routing/route\nnavLabel: Route\nsection: Routing\ngroup: Containers\norder: 50\ndescription: Route container documentation with dynamic path and metadata scenarios.\ncomponent: RouteDocumentation\ngenerate: true\ntags: [route, routing, container]\n---\n\n# Route\n\n## Overview\n`Route` renders a single component when the current URL matches a target path.\n\n## Core Behavior\n- Registers its own `path` + `component` into router map when mounted.\n- Supports dynamic segments using `${param}` syntax.\n- Passes `params` and `metadata` to the routed component.\n- Reuses cached component instances and calls `update()` when needed.\n\n## Basic Usage\n```javascript title=\"Build route container\"\nconst route = await slice.build('Route', {\n  path: '/settings',\n  component: 'SettingsPage',\n  metadata: { requiresAuth: true }\n});\n\nthis.appendChild(route);\n```\n\n## Prop Scenarios\n:::script label=\"static route config\" expected=\"Route stores path/component props for exact matching\"\nconst route = await slice.build('Route', {\n  path: '/account',\n  component: 'CardDocumentation'\n});\n\nconst summary = document.createElement('p');\nsummary.textContent = `${route.path} -> ${route.component}`;\nreturn summary;\n:::\n\n:::script label=\"dynamic path matcher\" expected=\"Route extracts params from ${param} patterns\"\nconst route = await slice.build('Route', {\n  path: '/users/${id}',\n  component: 'CardDocumentation'\n});\n\nconst matcher = route.compilePathPattern('/users/${id}');\nconst match = '/users/42'.match(matcher.regex);\nconst output = document.createElement('p');\noutput.textContent = match ? `Param ${matcher.paramNames[0]}=${match[1]}` : 'No match';\nreturn output;\n:::\n\n:::script label=\"metadata payload\" expected=\"Route keeps metadata available for routed component\"\nconst route = await slice.build('Route', {\n  path: '/billing',\n  component: 'CardDocumentation',\n  metadata: { private: true, title: 'Billing' }\n});\n\nconst info = document.createElement('p');\ninfo.textContent = `Metadata title: ${route.props.metadata.title}`;\nreturn info;\n:::\n\n## Best Practices\n:::tip\nUse `metadata` to keep guards and page policies declarative instead of hard-coding checks inside components.\n:::\n\n## Pitfalls\n:::warning\nDynamic params use `${param}` syntax, not `:param`.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const route = await slice.build('Route', {\n  path: '/settings',\n  component: 'SettingsPage',\n  metadata: { requiresAuth: true }\n});\n\nthis.appendChild(route);",
               language: "javascript"
            });
            if ("Build route container") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build route container";
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

customElements.define('slice-routedocumentation', RouteDocumentation);
