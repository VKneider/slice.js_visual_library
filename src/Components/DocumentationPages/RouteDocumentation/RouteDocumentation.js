export default class RouteDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"static route config","expected":"Route stores path/component props for exact matching","kind":"script","content":"const route = await slice.build('Route', {\r\n  path: '/account',\r\n  component: 'CardDocumentation'\r\n});\r\n\r\nconst summary = document.createElement('p');\r\nsummary.textContent = `${route.path} -> ${route.component}`;\r\nreturn summary;"},{"label":"dynamic path matcher","expected":"Route extracts params from ${param} patterns","kind":"script","content":"const route = await slice.build('Route', {\r\n  path: '/users/${id}',\r\n  component: 'CardDocumentation'\r\n});\r\n\r\nconst matcher = route.compilePathPattern('/users/${id}');\r\nconst match = '/users/42'.match(matcher.regex);\r\nconst output = document.createElement('p');\r\noutput.textContent = match ? `Param ${matcher.paramNames[0]}=${match[1]}` : 'No match';\r\nreturn output;"},{"label":"metadata payload","expected":"Route keeps metadata available for routed component","kind":"script","content":"const route = await slice.build('Route', {\r\n  path: '/billing',\r\n  component: 'CardDocumentation',\r\n  metadata: { private: true, title: 'Billing' }\r\n});\r\n\r\nconst info = document.createElement('p');\r\ninfo.textContent = `Metadata title: ${route.props.metadata.title}`;\r\nreturn info;"},{"label":"showcase navigation controls","expected":"buttons call await slice.router.navigate to move between Route targets","kind":"script","content":"const routeHome = await slice.build('Route', {\r\n  path: '/docs/route-showcase/home',\r\n  component: 'DemoRouteHome',\r\n  metadata: { title: 'Route Showcase Home' }\r\n});\r\n\r\nconst routeDetails = await slice.build('Route', {\r\n  path: '/docs/route-showcase/details',\r\n  component: 'DemoRouteDetails',\r\n  metadata: { title: 'Route Showcase Details' }\r\n});\r\n\r\nconst title = document.createElement('p');\r\ntitle.textContent = 'Route showcase: use controls to navigate';\r\n\r\nconst controls = document.createElement('div');\r\ncontrols.style.display = 'flex';\r\ncontrols.style.gap = '8px';\r\ncontrols.style.margin = '8px 0 12px';\r\n\r\nconst goHome = await slice.build('Button', {\r\n  value: 'Go Home Route',\r\n  onClick: async () => {\r\n    await slice.router.navigate('/docs/route-showcase/home');\r\n  }\r\n});\r\n\r\nconst goDetails = await slice.build('Button', {\r\n  value: 'Go Details Route',\r\n  onClick: async () => {\r\n    await slice.router.navigate('/docs/route-showcase/details');\r\n  }\r\n});\r\n\r\ncontrols.appendChild(goHome);\r\ncontrols.appendChild(goDetails);\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Current path: ' + window.location.pathname;\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(title);\r\nhost.appendChild(controls);\r\nhost.appendChild(note);\r\nhost.appendChild(routeHome);\r\nhost.appendChild(routeDetails);\r\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "route.md";
    this.markdownContent = "---\r\ntitle: Route\r\nroute: /docs/routing/route\r\nnavLabel: Route\r\nsection: Routing\r\ngroup: Containers\r\norder: 50\r\ndescription: Route container documentation with dynamic path and metadata scenarios.\r\ncomponent: RouteDocumentation\r\ngenerate: true\r\ntags: [route, routing, container]\r\n---\r\n\r\n# Route\r\n\r\n## Overview\r\n`Route` renders a single component when the current URL matches a target path.\r\n\r\n## Core Behavior\r\n- Shows its `component` when the current URL matches `path`; matching is case-insensitive and tolerant of a trailing slash.\r\n- Supports dynamic segments using `${param}` syntax.\r\n- Passes `params` and `metadata` to the routed component.\r\n- Reuses cached component instances and calls `update()` when needed.\r\n- Does **not** register its path with the Router. Declare the path in `routes.js` too, or a direct load of that URL resolves before the container mounts.\r\n\r\n## Prop Scenarios\r\n:::script label=\"static route config\" expected=\"Route stores path/component props for exact matching\"\r\nconst route = await slice.build('Route', {\r\n  path: '/account',\r\n  component: 'CardDocumentation'\r\n});\r\n\r\nconst summary = document.createElement('p');\r\nsummary.textContent = `${route.path} -> ${route.component}`;\r\nreturn summary;\r\n:::\r\n\r\n:::script label=\"dynamic path matcher\" expected=\"Route extracts params from ${param} patterns\"\r\nconst route = await slice.build('Route', {\r\n  path: '/users/${id}',\r\n  component: 'CardDocumentation'\r\n});\r\n\r\nconst matcher = route.compilePathPattern('/users/${id}');\r\nconst match = '/users/42'.match(matcher.regex);\r\nconst output = document.createElement('p');\r\noutput.textContent = match ? `Param ${matcher.paramNames[0]}=${match[1]}` : 'No match';\r\nreturn output;\r\n:::\r\n\r\n:::script label=\"metadata payload\" expected=\"Route keeps metadata available for routed component\"\r\nconst route = await slice.build('Route', {\r\n  path: '/billing',\r\n  component: 'CardDocumentation',\r\n  metadata: { private: true, title: 'Billing' }\r\n});\r\n\r\nconst info = document.createElement('p');\r\ninfo.textContent = `Metadata title: ${route.props.metadata.title}`;\r\nreturn info;\r\n:::\r\n\r\n:::script label=\"showcase navigation controls\" expected=\"buttons call await slice.router.navigate to move between Route targets\"\r\nconst routeHome = await slice.build('Route', {\r\n  path: '/docs/route-showcase/home',\r\n  component: 'DemoRouteHome',\r\n  metadata: { title: 'Route Showcase Home' }\r\n});\r\n\r\nconst routeDetails = await slice.build('Route', {\r\n  path: '/docs/route-showcase/details',\r\n  component: 'DemoRouteDetails',\r\n  metadata: { title: 'Route Showcase Details' }\r\n});\r\n\r\nconst title = document.createElement('p');\r\ntitle.textContent = 'Route showcase: use controls to navigate';\r\n\r\nconst controls = document.createElement('div');\r\ncontrols.style.display = 'flex';\r\ncontrols.style.gap = '8px';\r\ncontrols.style.margin = '8px 0 12px';\r\n\r\nconst goHome = await slice.build('Button', {\r\n  value: 'Go Home Route',\r\n  onClick: async () => {\r\n    await slice.router.navigate('/docs/route-showcase/home');\r\n  }\r\n});\r\n\r\nconst goDetails = await slice.build('Button', {\r\n  value: 'Go Details Route',\r\n  onClick: async () => {\r\n    await slice.router.navigate('/docs/route-showcase/details');\r\n  }\r\n});\r\n\r\ncontrols.appendChild(goHome);\r\ncontrols.appendChild(goDetails);\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Current path: ' + window.location.pathname;\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(title);\r\nhost.appendChild(controls);\r\nhost.appendChild(note);\r\nhost.appendChild(routeHome);\r\nhost.appendChild(routeDetails);\r\nreturn host;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nUse `metadata` to keep guards and page policies declarative instead of hard-coding checks inside components.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nDynamic params use `${param}` syntax, not `:param`.\r\n:::\r\n";
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

customElements.define('slice-routedocumentation', RouteDocumentation);
