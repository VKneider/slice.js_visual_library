export default class BreadcrumbsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Docs hierarchy trail","expected":"parent sections are links and current page is highlighted","kind":"script","content":"const breadcrumbs = await slice.build('Breadcrumbs', {\r\n  items: [\r\n    { text: 'Docs', path: '/docs' },\r\n    { text: 'Navigation', path: '/docs/navigation' },\r\n    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }\r\n  ]\r\n});\r\n\r\nreturn breadcrumbs;"},{"label":"Collapsed long trail","expected":"middle segments collapse into ellipsis","kind":"script","content":"const breadcrumbs = await slice.build('Breadcrumbs', {\r\n  maxItems: 3,\r\n  items: [\r\n    { text: 'Docs', path: '/docs' },\r\n    { text: 'Navigation', path: '/docs/navigation' },\r\n    { text: 'Routing', path: '/docs/routing' },\r\n    { text: 'Guards', path: '/docs/routing/guards' }\r\n  ]\r\n});\r\n\r\nreturn breadcrumbs;"},{"label":"Route tree + currentPath (MultiRoute style)","expected":"trail resolves from children tree","kind":"script","content":"const routeChildren = [\r\n  {\r\n    path: '/docs',\r\n    text: 'Docs',\r\n    children: [\r\n      {\r\n        path: '/navigation',\r\n        text: 'Navigation',\r\n        children: [\r\n          { path: '/breadcrumbs', text: 'Breadcrumbs' }\r\n        ]\r\n      }\r\n    ]\r\n  }\r\n];\r\n\r\nconst breadcrumbs = await slice.build('Breadcrumbs', {\r\n  children: routeChildren,\r\n  currentPath: '/docs/navigation/breadcrumbs'\r\n});\r\n\r\nreturn breadcrumbs;"},{"label":"Functional MultiRoute + Demo components","expected":"breadcrumbs and view swap together","kind":"script","content":"const container = document.createElement('section');\r\ncontainer.style.display = 'grid';\r\ncontainer.style.gap = '10px';\r\n\r\nconst controls = document.createElement('div');\r\ncontrols.style.display = 'flex';\r\ncontrols.style.gap = '8px';\r\ncontrols.style.flexWrap = 'wrap';\r\n\r\nconst frame = document.createElement('div');\r\nframe.style.border = '1px solid color-mix(in srgb, var(--primary-color-shade) 55%, transparent)';\r\nframe.style.borderRadius = '10px';\r\nframe.style.padding = '10px';\r\n\r\nconst routes = [\r\n  { path: '/demo/home', component: 'DemoRouteHome' },\r\n  { path: '/demo/details', component: 'DemoRouteDetails' },\r\n  { path: '/demo/state', component: 'DemoRouteState' }\r\n];\r\n\r\nconst children = [\r\n  {\r\n    path: '/demo',\r\n    text: 'Demo',\r\n    children: [\r\n      {\r\n        path: '/home',\r\n        text: 'Home'\r\n      },\r\n      {\r\n        path: '/details',\r\n        text: 'Details'\r\n      },\r\n      {\r\n        path: '/state',\r\n        text: 'State'\r\n      }\r\n    ]\r\n  }\r\n];\r\n\r\nconst breadcrumbs = await slice.build('Breadcrumbs', {\r\n  children,\r\n  currentPath: '/demo/home'\r\n});\r\n\r\nconst multi = await slice.build('MultiRoute', { routes });\r\n\r\nlet demoPath = '/demo/home';\r\nconst originalMatchRoute = multi.matchRoute.bind(multi);\r\nmulti.matchRoute = () => originalMatchRoute(demoPath);\r\n\r\nconst setDemoPath = async (path) => {\r\n  demoPath = path;\r\n  breadcrumbs.currentPath = path;\r\n  await multi.render();\r\n};\r\n\r\nfor (const route of routes) {\r\n  const button = await slice.build('Button', {\r\n    value: route.path.split('/').pop(),\r\n    onClick: () => setDemoPath(route.path)\r\n  });\r\n  controls.appendChild(button);\r\n}\r\n\r\nframe.appendChild(multi);\r\ncontainer.appendChild(breadcrumbs);\r\ncontainer.appendChild(controls);\r\ncontainer.appendChild(frame);\r\n\r\nawait setDemoPath('/demo/home');\r\n\r\nreturn container;"},{"label":"Parent links only","expected":"current page is hidden for compact headers","kind":"script","content":"const breadcrumbs = await slice.build('Breadcrumbs', {\r\n  includeCurrent: false,\r\n  separator: '>',\r\n  items: [\r\n    { text: 'Docs', path: '/docs' },\r\n    { text: 'Navigation', path: '/docs/navigation' },\r\n    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }\r\n  ]\r\n});\r\n\r\nreturn breadcrumbs;"}];
  }

  async init() {
    this.markdownPath = "breadcrumbs.md";
    this.markdownContent = "---\r\ntitle: Breadcrumbs\r\nroute: /docs/navigation/breadcrumbs\r\nnavLabel: Breadcrumbs\r\nsection: Navigation\r\ngroup: Core\r\norder: 34\r\ndescription: Breadcrumbs component for hierarchical navigation context and quick backtracking.\r\ncomponent: BreadcrumbsDocumentation\r\ngenerate: true\r\ntags: [breadcrumbs, navigation, hierarchy]\r\n---\r\n\r\n# Breadcrumbs\r\n\r\n## Overview\r\n`Breadcrumbs` shows the current navigation hierarchy in a compact horizontal trail (for example:\r\n`Docs / Navigation / Breadcrumbs`). It helps users understand where they are and quickly go back\r\nto a parent section.\r\n\r\n## Core Behavior\r\n- `items` use the canonical navigation shape `{ text, path }`.\r\n- `children` accepts a route-tree shape (`{ path, text?, title?, children? }`) like route configs,\r\n  and auto-resolves the breadcrumb trail for `currentPath` (or `window.location.pathname`).\r\n- Every segment except the current one is rendered as a link and uses `slice.router.navigate(path)`.\r\n- The last segment is marked with `aria-current=\"page\"` by default.\r\n- `includeCurrent: false` hides the last segment when you only want parent links.\r\n- `maxItems` collapses long trails into an ellipsis segment (`...`) to keep layouts tidy.\r\n\r\n## Live Preview\r\n:::component name=\"Breadcrumbs\"\r\n{\r\n  \"items\": [\r\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\r\n    { \"text\": \"Navigation\", \"path\": \"/docs/navigation\" },\r\n    { \"text\": \"Breadcrumbs\", \"path\": \"/docs/navigation/breadcrumbs\" }\r\n  ]\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"Docs hierarchy trail\" expected=\"parent sections are links and current page is highlighted\"\r\nconst breadcrumbs = await slice.build('Breadcrumbs', {\r\n  items: [\r\n    { text: 'Docs', path: '/docs' },\r\n    { text: 'Navigation', path: '/docs/navigation' },\r\n    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }\r\n  ]\r\n});\r\n\r\nreturn breadcrumbs;\r\n:::\r\n\r\n:::script label=\"Collapsed long trail\" expected=\"middle segments collapse into ellipsis\"\r\nconst breadcrumbs = await slice.build('Breadcrumbs', {\r\n  maxItems: 3,\r\n  items: [\r\n    { text: 'Docs', path: '/docs' },\r\n    { text: 'Navigation', path: '/docs/navigation' },\r\n    { text: 'Routing', path: '/docs/routing' },\r\n    { text: 'Guards', path: '/docs/routing/guards' }\r\n  ]\r\n});\r\n\r\nreturn breadcrumbs;\r\n:::\r\n\r\n:::script label=\"Route tree + currentPath (MultiRoute style)\" expected=\"trail resolves from children tree\"\r\nconst routeChildren = [\r\n  {\r\n    path: '/docs',\r\n    text: 'Docs',\r\n    children: [\r\n      {\r\n        path: '/navigation',\r\n        text: 'Navigation',\r\n        children: [\r\n          { path: '/breadcrumbs', text: 'Breadcrumbs' }\r\n        ]\r\n      }\r\n    ]\r\n  }\r\n];\r\n\r\nconst breadcrumbs = await slice.build('Breadcrumbs', {\r\n  children: routeChildren,\r\n  currentPath: '/docs/navigation/breadcrumbs'\r\n});\r\n\r\nreturn breadcrumbs;\r\n:::\r\n\r\n:::script label=\"Functional MultiRoute + Demo components\" expected=\"breadcrumbs and view swap together\"\r\nconst container = document.createElement('section');\r\ncontainer.style.display = 'grid';\r\ncontainer.style.gap = '10px';\r\n\r\nconst controls = document.createElement('div');\r\ncontrols.style.display = 'flex';\r\ncontrols.style.gap = '8px';\r\ncontrols.style.flexWrap = 'wrap';\r\n\r\nconst frame = document.createElement('div');\r\nframe.style.border = '1px solid color-mix(in srgb, var(--primary-color-shade) 55%, transparent)';\r\nframe.style.borderRadius = '10px';\r\nframe.style.padding = '10px';\r\n\r\nconst routes = [\r\n  { path: '/demo/home', component: 'DemoRouteHome' },\r\n  { path: '/demo/details', component: 'DemoRouteDetails' },\r\n  { path: '/demo/state', component: 'DemoRouteState' }\r\n];\r\n\r\nconst children = [\r\n  {\r\n    path: '/demo',\r\n    text: 'Demo',\r\n    children: [\r\n      {\r\n        path: '/home',\r\n        text: 'Home'\r\n      },\r\n      {\r\n        path: '/details',\r\n        text: 'Details'\r\n      },\r\n      {\r\n        path: '/state',\r\n        text: 'State'\r\n      }\r\n    ]\r\n  }\r\n];\r\n\r\nconst breadcrumbs = await slice.build('Breadcrumbs', {\r\n  children,\r\n  currentPath: '/demo/home'\r\n});\r\n\r\nconst multi = await slice.build('MultiRoute', { routes });\r\n\r\nlet demoPath = '/demo/home';\r\nconst originalMatchRoute = multi.matchRoute.bind(multi);\r\nmulti.matchRoute = () => originalMatchRoute(demoPath);\r\n\r\nconst setDemoPath = async (path) => {\r\n  demoPath = path;\r\n  breadcrumbs.currentPath = path;\r\n  await multi.render();\r\n};\r\n\r\nfor (const route of routes) {\r\n  const button = await slice.build('Button', {\r\n    value: route.path.split('/').pop(),\r\n    onClick: () => setDemoPath(route.path)\r\n  });\r\n  controls.appendChild(button);\r\n}\r\n\r\nframe.appendChild(multi);\r\ncontainer.appendChild(breadcrumbs);\r\ncontainer.appendChild(controls);\r\ncontainer.appendChild(frame);\r\n\r\nawait setDemoPath('/demo/home');\r\n\r\nreturn container;\r\n:::\r\n\r\n:::script label=\"Parent links only\" expected=\"current page is hidden for compact headers\"\r\nconst breadcrumbs = await slice.build('Breadcrumbs', {\r\n  includeCurrent: false,\r\n  separator: '>',\r\n  items: [\r\n    { text: 'Docs', path: '/docs' },\r\n    { text: 'Navigation', path: '/docs/navigation' },\r\n    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }\r\n  ]\r\n});\r\n\r\nreturn breadcrumbs;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nUse `Breadcrumbs` near page titles or section headers, not as the primary navigation. Keep labels\r\nshort and meaningful so the trail stays scannable.\r\n:::\r\n\r\n:::tip\r\nWhen your app already has route definitions as trees (e.g. nested children under `Route`/`MultiRoute`),\r\npass that structure in `children` and provide `currentPath` so `Breadcrumbs` stays in sync without\r\nduplicating `items` arrays.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nAvoid non-clickable parent segments with empty `path` values if users are expected to navigate\r\nback from the breadcrumb trail.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"items\": [\r\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\r\n    { \"text\": \"Navigation\", \"path\": \"/docs/navigation\" },\r\n    { \"text\": \"Breadcrumbs\", \"path\": \"/docs/navigation/breadcrumbs\" }\r\n  ]\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"items\": [\r\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\r\n    { \"text\": \"Navigation\", \"path\": \"/docs/navigation\" },\r\n    { \"text\": \"Breadcrumbs\", \"path\": \"/docs/navigation/breadcrumbs\" }\r\n  ]\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Breadcrumbs', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items[].text\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"items[].path\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"children\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"children[].path\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"children[].text\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"children[].title\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"children[].children\",\"type\":\"array\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"currentPath\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"separator\",\"type\":\"string\",\"required\":false,\"default\":\"/\",\"allowedValues\":[]},{\"path\":\"includeCurrent\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"maxItems\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items[].text\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"items[].path\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"children\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"children[].path\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"children[].text\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"children[].title\",\"type\":\"string\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"children[].children\",\"type\":\"array\",\"required\":false,\"default\":null,\"allowedValues\":[]},{\"path\":\"currentPath\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"separator\",\"type\":\"string\",\"required\":false,\"default\":\"/\",\"allowedValues\":[]},{\"path\":\"includeCurrent\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"maxItems\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"onClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onClickCallback\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-breadcrumbsdocumentation', BreadcrumbsDocumentation);
