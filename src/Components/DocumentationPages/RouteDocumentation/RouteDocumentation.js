export default class RouteDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"static route config","expected":"Route stores path/component props for exact matching","kind":"script","content":"const route = await slice.build('Route', {\n  path: '/account',\n  component: 'CardDocumentation'\n});\n\nconst summary = document.createElement('p');\nsummary.textContent = `${route.path} -> ${route.component}`;\nreturn summary;"},{"label":"dynamic path matcher","expected":"Route extracts params from ${param} patterns","kind":"script","content":"const route = await slice.build('Route', {\n  path: '/users/${id}',\n  component: 'CardDocumentation'\n});\n\nconst matcher = route.compilePathPattern('/users/${id}');\nconst match = '/users/42'.match(matcher.regex);\nconst output = document.createElement('p');\noutput.textContent = match ? `Param ${matcher.paramNames[0]}=${match[1]}` : 'No match';\nreturn output;"},{"label":"metadata payload","expected":"Route keeps metadata available for routed component","kind":"script","content":"const route = await slice.build('Route', {\n  path: '/billing',\n  component: 'CardDocumentation',\n  metadata: { private: true, title: 'Billing' }\n});\n\nconst info = document.createElement('p');\ninfo.textContent = `Metadata title: ${route.props.metadata.title}`;\nreturn info;"},{"label":"showcase navigation controls","expected":"buttons call await slice.router.navigate to move between Route targets","kind":"script","content":"const routeHome = await slice.build('Route', {\n  path: '/docs/route-showcase/home',\n  component: 'DemoRouteHome',\n  metadata: { title: 'Route Showcase Home' }\n});\n\nconst routeDetails = await slice.build('Route', {\n  path: '/docs/route-showcase/details',\n  component: 'DemoRouteDetails',\n  metadata: { title: 'Route Showcase Details' }\n});\n\nconst title = document.createElement('p');\ntitle.textContent = 'Route showcase: use controls to navigate';\n\nconst controls = document.createElement('div');\ncontrols.style.display = 'flex';\ncontrols.style.gap = '8px';\ncontrols.style.margin = '8px 0 12px';\n\nconst goHome = await slice.build('Button', {\n  value: 'Go Home Route',\n  onClick: async () => {\n    await slice.router.navigate('/docs/route-showcase/home');\n  }\n});\n\nconst goDetails = await slice.build('Button', {\n  value: 'Go Details Route',\n  onClick: async () => {\n    await slice.router.navigate('/docs/route-showcase/details');\n  }\n});\n\ncontrols.appendChild(goHome);\ncontrols.appendChild(goDetails);\n\nconst note = document.createElement('p');\nnote.textContent = 'Current path: ' + window.location.pathname;\n\nconst host = document.createElement('div');\nhost.appendChild(title);\nhost.appendChild(controls);\nhost.appendChild(note);\nhost.appendChild(routeHome);\nhost.appendChild(routeDetails);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "route.md";
    this.markdownContent = "---\ntitle: Route\nroute: /docs/routing/route\nnavLabel: Route\nsection: Routing\ngroup: Containers\norder: 50\ndescription: Route container documentation with dynamic path and metadata scenarios.\ncomponent: RouteDocumentation\ngenerate: true\ntags: [route, routing, container]\n---\n\n# Route\n\n## Overview\n`Route` renders a single component when the current URL matches a target path.\n\n## Core Behavior\n- Shows its `component` when the current URL matches `path`; matching is case-insensitive and tolerant of a trailing slash.\n- Supports dynamic segments using `${param}` syntax.\n- Passes `params` and `metadata` to the routed component.\n- Reuses cached component instances and calls `update()` when needed.\n- Does **not** register its path with the Router. Declare the path in `routes.js` too, or a direct load of that URL resolves before the container mounts.\n\n## Prop Scenarios\n:::script label=\"static route config\" expected=\"Route stores path/component props for exact matching\"\nconst route = await slice.build('Route', {\n  path: '/account',\n  component: 'CardDocumentation'\n});\n\nconst summary = document.createElement('p');\nsummary.textContent = `${route.path} -> ${route.component}`;\nreturn summary;\n:::\n\n:::script label=\"dynamic path matcher\" expected=\"Route extracts params from ${param} patterns\"\nconst route = await slice.build('Route', {\n  path: '/users/${id}',\n  component: 'CardDocumentation'\n});\n\nconst matcher = route.compilePathPattern('/users/${id}');\nconst match = '/users/42'.match(matcher.regex);\nconst output = document.createElement('p');\noutput.textContent = match ? `Param ${matcher.paramNames[0]}=${match[1]}` : 'No match';\nreturn output;\n:::\n\n:::script label=\"metadata payload\" expected=\"Route keeps metadata available for routed component\"\nconst route = await slice.build('Route', {\n  path: '/billing',\n  component: 'CardDocumentation',\n  metadata: { private: true, title: 'Billing' }\n});\n\nconst info = document.createElement('p');\ninfo.textContent = `Metadata title: ${route.props.metadata.title}`;\nreturn info;\n:::\n\n:::script label=\"showcase navigation controls\" expected=\"buttons call await slice.router.navigate to move between Route targets\"\nconst routeHome = await slice.build('Route', {\n  path: '/docs/route-showcase/home',\n  component: 'DemoRouteHome',\n  metadata: { title: 'Route Showcase Home' }\n});\n\nconst routeDetails = await slice.build('Route', {\n  path: '/docs/route-showcase/details',\n  component: 'DemoRouteDetails',\n  metadata: { title: 'Route Showcase Details' }\n});\n\nconst title = document.createElement('p');\ntitle.textContent = 'Route showcase: use controls to navigate';\n\nconst controls = document.createElement('div');\ncontrols.style.display = 'flex';\ncontrols.style.gap = '8px';\ncontrols.style.margin = '8px 0 12px';\n\nconst goHome = await slice.build('Button', {\n  value: 'Go Home Route',\n  onClick: async () => {\n    await slice.router.navigate('/docs/route-showcase/home');\n  }\n});\n\nconst goDetails = await slice.build('Button', {\n  value: 'Go Details Route',\n  onClick: async () => {\n    await slice.router.navigate('/docs/route-showcase/details');\n  }\n});\n\ncontrols.appendChild(goHome);\ncontrols.appendChild(goDetails);\n\nconst note = document.createElement('p');\nnote.textContent = 'Current path: ' + window.location.pathname;\n\nconst host = document.createElement('div');\nhost.appendChild(title);\nhost.appendChild(controls);\nhost.appendChild(note);\nhost.appendChild(routeHome);\nhost.appendChild(routeDetails);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nUse `metadata` to keep guards and page policies declarative instead of hard-coding checks inside components.\n:::\n\n## Pitfalls\n:::warning\nDynamic params use `${param}` syntax, not `:param`.\n:::\n";
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
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
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
