export default class MultiRouteDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"app shell sections","expected":"route list models section switching in a persistent shell","kind":"script","content":"const multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/docs', component: 'DocumentationLibraryHome' },\n    { path: '/docs/input/button', component: 'ButtonDocumentation' },\n    { path: '/docs/layout/card', component: 'CardDocumentation' }\n  ]\n});\n\nconst summary = document.createElement('p');\nsummary.textContent = `Registered route entries: ${multi.props.routes.length}`;\nreturn summary;"},{"label":"dynamic route matching","expected":"matchRoute resolves params for ${param} patterns","kind":"script","content":"const multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/projects/${projectId}', component: 'CardDocumentation' },\n    { path: '/teams/${teamId}', component: 'CardDocumentation' }\n  ]\n});\n\nconst result = multi.matchRoute('/projects/alpha-42');\nconst output = document.createElement('p');\noutput.textContent = result.route\n  ? `Matched ${result.route.path} with projectId=${result.params.projectId}`\n  : 'No route matched';\nreturn output;"},{"label":"metadata per route","expected":"each route can carry metadata for guards and UI","kind":"script","content":"const multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/admin', component: 'CardDocumentation', metadata: { private: true, title: 'Admin' } },\n    { path: '/public', component: 'CardDocumentation', metadata: { private: false, title: 'Public' } }\n  ]\n});\n\nconst route = multi.props.routes.find((entry) => entry.path === '/admin');\nconst note = document.createElement('p');\nnote.textContent = `Admin route private=${route.metadata.private}`;\nreturn note;"}];
  }

  async init() {
    this.markdownPath = "multi-route.md";
    this.markdownContent = "---\ntitle: MultiRoute\nroute: /docs/routing/multi-route\nnavLabel: MultiRoute\nsection: Routing\ngroup: Containers\norder: 51\ndescription: MultiRoute container documentation with app-shell and dynamic route scenarios.\ncomponent: MultiRouteDocumentation\ngenerate: true\ntags: [multiroute, routing, app-shell]\n---\n\n# MultiRoute\n\n## Overview\n`MultiRoute` maps multiple URL paths to components and renders only the active match.\n\n## Core Behavior\n- Registers each route entry in the runtime router.\n- Supports exact and dynamic `${param}` path matching.\n- Caches rendered components and calls `update()` when reusing.\n- Emits `route-rendered` with `path`, `component`, `params`, and `metadata`.\n\n## Basic Usage\n```javascript title=\"Build MultiRoute container\"\nconst sections = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/account', component: 'AccountPage' },\n    { path: '/billing', component: 'BillingPage' }\n  ]\n});\n\nthis.appendChild(sections);\n```\n\n## Prop Scenarios\n:::script label=\"app shell sections\" expected=\"route list models section switching in a persistent shell\"\nconst multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/docs', component: 'DocumentationLibraryHome' },\n    { path: '/docs/input/button', component: 'ButtonDocumentation' },\n    { path: '/docs/layout/card', component: 'CardDocumentation' }\n  ]\n});\n\nconst summary = document.createElement('p');\nsummary.textContent = `Registered route entries: ${multi.props.routes.length}`;\nreturn summary;\n:::\n\n:::script label=\"dynamic route matching\" expected=\"matchRoute resolves params for ${param} patterns\"\nconst multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/projects/${projectId}', component: 'CardDocumentation' },\n    { path: '/teams/${teamId}', component: 'CardDocumentation' }\n  ]\n});\n\nconst result = multi.matchRoute('/projects/alpha-42');\nconst output = document.createElement('p');\noutput.textContent = result.route\n  ? `Matched ${result.route.path} with projectId=${result.params.projectId}`\n  : 'No route matched';\nreturn output;\n:::\n\n:::script label=\"metadata per route\" expected=\"each route can carry metadata for guards and UI\"\nconst multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/admin', component: 'CardDocumentation', metadata: { private: true, title: 'Admin' } },\n    { path: '/public', component: 'CardDocumentation', metadata: { private: false, title: 'Public' } }\n  ]\n});\n\nconst route = multi.props.routes.find((entry) => entry.path === '/admin');\nconst note = document.createElement('p');\nnote.textContent = `Admin route private=${route.metadata.private}`;\nreturn note;\n:::\n\n## Best Practices\n:::tip\nUse `MultiRoute` inside app-shell layouts where navbar/sidebar stay mounted while inner sections switch by URL.\n:::\n\n## Pitfalls\n:::warning\nDo not register duplicate route paths in the same `routes` array; the first registration wins.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const sections = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/account', component: 'AccountPage' },\n    { path: '/billing', component: 'BillingPage' }\n  ]\n});\n\nthis.appendChild(sections);",
               language: "javascript"
            });
            if ("Build MultiRoute container") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build MultiRoute container";
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

customElements.define('slice-multiroutedocumentation', MultiRouteDocumentation);
