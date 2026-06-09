export default class BreadcrumbsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Docs hierarchy trail","expected":"parent sections are links and current page is highlighted","kind":"script","content":"const breadcrumbs = await slice.build('Breadcrumbs', {\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Navigation', path: '/docs/navigation' },\n    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }\n  ]\n});\n\nreturn breadcrumbs;"},{"label":"Collapsed long trail","expected":"middle segments collapse into ellipsis","kind":"script","content":"const breadcrumbs = await slice.build('Breadcrumbs', {\n  maxItems: 3,\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Navigation', path: '/docs/navigation' },\n    { text: 'Routing', path: '/docs/routing' },\n    { text: 'Guards', path: '/docs/routing/guards' }\n  ]\n});\n\nreturn breadcrumbs;"},{"label":"Route tree + currentPath (MultiRoute style)","expected":"trail resolves from children tree","kind":"script","content":"const routeChildren = [\n  {\n    path: '/docs',\n    text: 'Docs',\n    children: [\n      {\n        path: '/navigation',\n        text: 'Navigation',\n        children: [\n          { path: '/breadcrumbs', text: 'Breadcrumbs' }\n        ]\n      }\n    ]\n  }\n];\n\nconst breadcrumbs = await slice.build('Breadcrumbs', {\n  children: routeChildren,\n  currentPath: '/docs/navigation/breadcrumbs'\n});\n\nreturn breadcrumbs;"},{"label":"Functional MultiRoute + Demo components","expected":"breadcrumbs and view swap together","kind":"script","content":"const container = document.createElement('section');\ncontainer.style.display = 'grid';\ncontainer.style.gap = '10px';\n\nconst controls = document.createElement('div');\ncontrols.style.display = 'flex';\ncontrols.style.gap = '8px';\ncontrols.style.flexWrap = 'wrap';\n\nconst frame = document.createElement('div');\nframe.style.border = '1px solid color-mix(in srgb, var(--primary-color-shade) 55%, transparent)';\nframe.style.borderRadius = '10px';\nframe.style.padding = '10px';\n\nconst routes = [\n  { path: '/demo/home', component: 'DemoRouteHome' },\n  { path: '/demo/details', component: 'DemoRouteDetails' },\n  { path: '/demo/state', component: 'DemoRouteState' }\n];\n\nconst children = [\n  {\n    path: '/demo',\n    text: 'Demo',\n    children: [\n      {\n        path: '/home',\n        text: 'Home'\n      },\n      {\n        path: '/details',\n        text: 'Details'\n      },\n      {\n        path: '/state',\n        text: 'State'\n      }\n    ]\n  }\n];\n\nconst breadcrumbs = await slice.build('Breadcrumbs', {\n  children,\n  currentPath: '/demo/home'\n});\n\nconst multi = await slice.build('MultiRoute', { routes });\n\nlet demoPath = '/demo/home';\nconst originalMatchRoute = multi.matchRoute.bind(multi);\nmulti.matchRoute = () => originalMatchRoute(demoPath);\n\nconst setDemoPath = async (path) => {\n  demoPath = path;\n  breadcrumbs.currentPath = path;\n  await multi.render();\n};\n\nfor (const route of routes) {\n  const button = await slice.build('Button', {\n    value: route.path.split('/').pop(),\n    onClick: () => setDemoPath(route.path)\n  });\n  controls.appendChild(button);\n}\n\nframe.appendChild(multi);\ncontainer.appendChild(breadcrumbs);\ncontainer.appendChild(controls);\ncontainer.appendChild(frame);\n\nawait setDemoPath('/demo/home');\n\nreturn container;"},{"label":"Parent links only","expected":"current page is hidden for compact headers","kind":"script","content":"const breadcrumbs = await slice.build('Breadcrumbs', {\n  includeCurrent: false,\n  separator: '>',\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Navigation', path: '/docs/navigation' },\n    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }\n  ]\n});\n\nreturn breadcrumbs;"}];
  }

  async init() {
    this.markdownPath = "breadcrumbs.md";
    this.markdownContent = "---\ntitle: Breadcrumbs\nroute: /docs/navigation/breadcrumbs\nnavLabel: Breadcrumbs\nsection: Navigation\ngroup: Core\norder: 34\ndescription: Breadcrumbs component for hierarchical navigation context and quick backtracking.\ncomponent: BreadcrumbsDocumentation\ngenerate: true\ntags: [breadcrumbs, navigation, hierarchy]\n---\n\n# Breadcrumbs\n\n## Overview\n`Breadcrumbs` shows the current navigation hierarchy in a compact horizontal trail (for example:\n`Docs / Navigation / Breadcrumbs`). It helps users understand where they are and quickly go back\nto a parent section.\n\n## Core Behavior\n- `items` use the canonical navigation shape `{ text, path }`.\n- `children` accepts a route-tree shape (`{ path, text?, title?, children? }`) like route configs,\n  and auto-resolves the breadcrumb trail for `currentPath` (or `window.location.pathname`).\n- Every segment except the current one is rendered as a link and uses `slice.router.navigate(path)`.\n- The last segment is marked with `aria-current=\"page\"` by default.\n- `includeCurrent: false` hides the last segment when you only want parent links.\n- `maxItems` collapses long trails into an ellipsis segment (`...`) to keep layouts tidy.\n\n## Live Preview\n:::component name=\"Breadcrumbs\"\n{\n  \"items\": [\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\n    { \"text\": \"Navigation\", \"path\": \"/docs/navigation\" },\n    { \"text\": \"Breadcrumbs\", \"path\": \"/docs/navigation/breadcrumbs\" }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"Docs hierarchy trail\" expected=\"parent sections are links and current page is highlighted\"\nconst breadcrumbs = await slice.build('Breadcrumbs', {\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Navigation', path: '/docs/navigation' },\n    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }\n  ]\n});\n\nreturn breadcrumbs;\n:::\n\n:::script label=\"Collapsed long trail\" expected=\"middle segments collapse into ellipsis\"\nconst breadcrumbs = await slice.build('Breadcrumbs', {\n  maxItems: 3,\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Navigation', path: '/docs/navigation' },\n    { text: 'Routing', path: '/docs/routing' },\n    { text: 'Guards', path: '/docs/routing/guards' }\n  ]\n});\n\nreturn breadcrumbs;\n:::\n\n:::script label=\"Route tree + currentPath (MultiRoute style)\" expected=\"trail resolves from children tree\"\nconst routeChildren = [\n  {\n    path: '/docs',\n    text: 'Docs',\n    children: [\n      {\n        path: '/navigation',\n        text: 'Navigation',\n        children: [\n          { path: '/breadcrumbs', text: 'Breadcrumbs' }\n        ]\n      }\n    ]\n  }\n];\n\nconst breadcrumbs = await slice.build('Breadcrumbs', {\n  children: routeChildren,\n  currentPath: '/docs/navigation/breadcrumbs'\n});\n\nreturn breadcrumbs;\n:::\n\n:::script label=\"Functional MultiRoute + Demo components\" expected=\"breadcrumbs and view swap together\"\nconst container = document.createElement('section');\ncontainer.style.display = 'grid';\ncontainer.style.gap = '10px';\n\nconst controls = document.createElement('div');\ncontrols.style.display = 'flex';\ncontrols.style.gap = '8px';\ncontrols.style.flexWrap = 'wrap';\n\nconst frame = document.createElement('div');\nframe.style.border = '1px solid color-mix(in srgb, var(--primary-color-shade) 55%, transparent)';\nframe.style.borderRadius = '10px';\nframe.style.padding = '10px';\n\nconst routes = [\n  { path: '/demo/home', component: 'DemoRouteHome' },\n  { path: '/demo/details', component: 'DemoRouteDetails' },\n  { path: '/demo/state', component: 'DemoRouteState' }\n];\n\nconst children = [\n  {\n    path: '/demo',\n    text: 'Demo',\n    children: [\n      {\n        path: '/home',\n        text: 'Home'\n      },\n      {\n        path: '/details',\n        text: 'Details'\n      },\n      {\n        path: '/state',\n        text: 'State'\n      }\n    ]\n  }\n];\n\nconst breadcrumbs = await slice.build('Breadcrumbs', {\n  children,\n  currentPath: '/demo/home'\n});\n\nconst multi = await slice.build('MultiRoute', { routes });\n\nlet demoPath = '/demo/home';\nconst originalMatchRoute = multi.matchRoute.bind(multi);\nmulti.matchRoute = () => originalMatchRoute(demoPath);\n\nconst setDemoPath = async (path) => {\n  demoPath = path;\n  breadcrumbs.currentPath = path;\n  await multi.render();\n};\n\nfor (const route of routes) {\n  const button = await slice.build('Button', {\n    value: route.path.split('/').pop(),\n    onClick: () => setDemoPath(route.path)\n  });\n  controls.appendChild(button);\n}\n\nframe.appendChild(multi);\ncontainer.appendChild(breadcrumbs);\ncontainer.appendChild(controls);\ncontainer.appendChild(frame);\n\nawait setDemoPath('/demo/home');\n\nreturn container;\n:::\n\n:::script label=\"Parent links only\" expected=\"current page is hidden for compact headers\"\nconst breadcrumbs = await slice.build('Breadcrumbs', {\n  includeCurrent: false,\n  separator: '>',\n  items: [\n    { text: 'Docs', path: '/docs' },\n    { text: 'Navigation', path: '/docs/navigation' },\n    { text: 'Breadcrumbs', path: '/docs/navigation/breadcrumbs' }\n  ]\n});\n\nreturn breadcrumbs;\n:::\n\n## Best Practices\n:::tip\nUse `Breadcrumbs` near page titles or section headers, not as the primary navigation. Keep labels\nshort and meaningful so the trail stays scannable.\n:::\n\n:::tip\nWhen your app already has route definitions as trees (e.g. nested children under `Route`/`MultiRoute`),\npass that structure in `children` and provide `currentPath` so `Breadcrumbs` stays in sync without\nduplicating `items` arrays.\n:::\n\n## Pitfalls\n:::warning\nAvoid non-clickable parent segments with empty `path` values if users are expected to navigate\nback from the breadcrumb trail.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"items\": [\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\n    { \"text\": \"Navigation\", \"path\": \"/docs/navigation\" },\n    { \"text\": \"Breadcrumbs\", \"path\": \"/docs/navigation/breadcrumbs\" }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"items\": [\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\n    { \"text\": \"Navigation\", \"path\": \"/docs/navigation\" },\n    { \"text\": \"Breadcrumbs\", \"path\": \"/docs/navigation/breadcrumbs\" }\n  ]\n}");
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

customElements.define('slice-breadcrumbsdocumentation', BreadcrumbsDocumentation);
