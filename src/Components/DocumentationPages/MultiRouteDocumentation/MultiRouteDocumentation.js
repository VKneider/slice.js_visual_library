export default class MultiRouteDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"app shell sections","expected":"route list models section switching in a persistent shell","kind":"script","content":"const multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/docs', component: 'DocumentationLibraryHome' },\n    { path: '/docs/input/button', component: 'ButtonDocumentation' },\n    { path: '/docs/layout/card', component: 'CardDocumentation' }\n  ]\n});\n\nconst summary = document.createElement('p');\nsummary.textContent = `Configured route entries: ${multi.props.routes.length}`;\nreturn summary;"},{"label":"dynamic route matching","expected":"matchRoute resolves params for ${param} patterns","kind":"script","content":"const multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/projects/${projectId}', component: 'CardDocumentation' },\n    { path: '/teams/${teamId}', component: 'CardDocumentation' }\n  ]\n});\n\nconst result = multi.matchRoute('/projects/alpha-42');\nconst output = document.createElement('p');\noutput.textContent = result.route\n  ? `Matched ${result.route.path} with projectId=${result.params.projectId}`\n  : 'No route matched';\nreturn output;"},{"label":"metadata per route","expected":"each route can carry metadata for guards and UI","kind":"script","content":"const multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/admin', component: 'CardDocumentation', metadata: { private: true, title: 'Admin' } },\n    { path: '/public', component: 'CardDocumentation', metadata: { private: false, title: 'Public' } }\n  ]\n});\n\nconst route = multi.props.routes.find((entry) => entry.path === '/admin');\nconst note = document.createElement('p');\nnote.textContent = `Admin route private=${route.metadata.private}`;\nreturn note;"},{"label":"tabs navigation showcase","expected":"tabs/buttons call await slice.router.navigate and MultiRoute switches content","kind":"script","content":"const tabs = document.createElement('div');\ntabs.style.display = 'flex';\ntabs.style.gap = '8px';\ntabs.style.marginBottom = '12px';\n\nconst routes = [\n  { path: '/docs/multiroute-showcase/overview', component: 'DemoRouteHome', metadata: { title: 'Overview' } },\n  { path: '/docs/multiroute-showcase/form', component: 'DemoRouteDetails', metadata: { title: 'Form' } },\n  { path: '/docs/multiroute-showcase/state', component: 'DemoRouteState', metadata: { title: 'State' } }\n];\n\nconst multi = await slice.build('MultiRoute', {\n  routes\n});\n\nfor (const entry of routes) {\n  const button = await slice.build('Button', {\n    value: entry.metadata.title,\n    onClick: async () => {\n      await slice.router.navigate(entry.path);\n    }\n  });\n  tabs.appendChild(button);\n}\n\nconst host = document.createElement('div');\nconst note = document.createElement('p');\nnote.textContent = 'Use buttons to navigate between MultiRoute paths.';\nhost.appendChild(note);\nhost.appendChild(tabs);\nhost.appendChild(multi);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "multi-route.md";
    this.markdownContent = "---\ntitle: MultiRoute\nroute: /docs/routing/multi-route\nnavLabel: MultiRoute\nsection: Routing\ngroup: Containers\norder: 51\ndescription: MultiRoute container documentation with app-shell and dynamic route scenarios.\ncomponent: MultiRouteDocumentation\ngenerate: true\ntags: [multiroute, routing, app-shell]\n---\n\n# MultiRoute\n\n## Overview\n`MultiRoute` maps multiple URL paths to components and renders only the active match.\n\n## Core Behavior\n- Shows the child whose `path` matches the current URL; matching is case-insensitive and tolerant of a trailing slash (`/About` and `/about/` match `/about`).\n- Supports exact and dynamic `${param}` path matching.\n- Caches rendered components and calls `update()` when reusing.\n- Emits `route-rendered` with `path`, `component`, `params`, and `metadata`.\n- Does **not** register its paths with the Router. `routes.js` is the single source of truth, so every path a MultiRoute can show must also exist there (in the App Shell pattern they point at the shell). Otherwise a direct load, refresh, or deep-link to that URL resolves before the container mounts and falls through to `/404`.\n\n## Prop Scenarios\n:::script label=\"app shell sections\" expected=\"route list models section switching in a persistent shell\"\nconst multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/docs', component: 'DocumentationLibraryHome' },\n    { path: '/docs/input/button', component: 'ButtonDocumentation' },\n    { path: '/docs/layout/card', component: 'CardDocumentation' }\n  ]\n});\n\nconst summary = document.createElement('p');\nsummary.textContent = `Configured route entries: ${multi.props.routes.length}`;\nreturn summary;\n:::\n\n:::script label=\"dynamic route matching\" expected=\"matchRoute resolves params for ${param} patterns\"\nconst multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/projects/${projectId}', component: 'CardDocumentation' },\n    { path: '/teams/${teamId}', component: 'CardDocumentation' }\n  ]\n});\n\nconst result = multi.matchRoute('/projects/alpha-42');\nconst output = document.createElement('p');\noutput.textContent = result.route\n  ? `Matched ${result.route.path} with projectId=${result.params.projectId}`\n  : 'No route matched';\nreturn output;\n:::\n\n:::script label=\"metadata per route\" expected=\"each route can carry metadata for guards and UI\"\nconst multi = await slice.build('MultiRoute', {\n  routes: [\n    { path: '/admin', component: 'CardDocumentation', metadata: { private: true, title: 'Admin' } },\n    { path: '/public', component: 'CardDocumentation', metadata: { private: false, title: 'Public' } }\n  ]\n});\n\nconst route = multi.props.routes.find((entry) => entry.path === '/admin');\nconst note = document.createElement('p');\nnote.textContent = `Admin route private=${route.metadata.private}`;\nreturn note;\n:::\n\n:::script label=\"tabs navigation showcase\" expected=\"tabs/buttons call await slice.router.navigate and MultiRoute switches content\"\nconst tabs = document.createElement('div');\ntabs.style.display = 'flex';\ntabs.style.gap = '8px';\ntabs.style.marginBottom = '12px';\n\nconst routes = [\n  { path: '/docs/multiroute-showcase/overview', component: 'DemoRouteHome', metadata: { title: 'Overview' } },\n  { path: '/docs/multiroute-showcase/form', component: 'DemoRouteDetails', metadata: { title: 'Form' } },\n  { path: '/docs/multiroute-showcase/state', component: 'DemoRouteState', metadata: { title: 'State' } }\n];\n\nconst multi = await slice.build('MultiRoute', {\n  routes\n});\n\nfor (const entry of routes) {\n  const button = await slice.build('Button', {\n    value: entry.metadata.title,\n    onClick: async () => {\n      await slice.router.navigate(entry.path);\n    }\n  });\n  tabs.appendChild(button);\n}\n\nconst host = document.createElement('div');\nconst note = document.createElement('p');\nnote.textContent = 'Use buttons to navigate between MultiRoute paths.';\nhost.appendChild(note);\nhost.appendChild(tabs);\nhost.appendChild(multi);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nUse `MultiRoute` inside app-shell layouts where navbar/sidebar stay mounted while inner sections switch by URL.\n:::\n\n## Pitfalls\n:::warning\nDo not declare duplicate route paths in the same `routes` array; the first match wins.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
    // No dynamic blocks
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

customElements.define('slice-multiroutedocumentation', MultiRouteDocumentation);
