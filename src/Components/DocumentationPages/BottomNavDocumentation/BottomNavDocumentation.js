export default class BottomNavDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"App-style tabs with icons","expected":"icon-over-label tabs with a sliding active indicator","kind":"script","content":"const nav = await slice.build('BottomNav', {\n  position: 'static',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Components', path: '/docs/navigation/navbar', icon: 'grid' },\n    { text: 'Docs', path: '/docs/navigation/tabs', icon: 'book' }\n  ]\n});\n\nreturn nav;"},{"label":"Tabs + trailing action","expected":"tabs followed by a CTA button","kind":"script","content":"const nav = await slice.build('BottomNav', {\n  position: 'static',\n  items: [\n    { text: 'Overview', path: '/docs', icon: 'home' },\n    { text: 'Guides', path: '/docs/navigation/dropdown', icon: 'book' }\n  ],\n  buttons: [\n    { value: 'GitHub', icon: 'github' }\n  ]\n});\n\nreturn nav;"},{"label":"Reverse direction","expected":"tab order is mirrored","kind":"script","content":"const nav = await slice.build('BottomNav', {\n  position: 'static',\n  direction: 'reverse',\n  items: [\n    { text: 'First', path: '/docs', icon: 'home' },\n    { text: 'Second', path: '/docs/navigation/tabs', icon: 'grid' },\n    { text: 'Third', path: '/docs/navigation/navbar', icon: 'book' }\n  ]\n});\n\nreturn nav;"}];
  }

  async init() {
    this.markdownPath = "bottom-nav.md";
    this.markdownContent = "---\ntitle: BottomNav\nroute: /docs/navigation/bottom-nav\nnavLabel: BottomNav\nsection: Navigation\ngroup: Core\norder: 33\ndescription: BottomNav (floating bottom tab bar) documentation with practical navigation scenarios.\ncomponent: BottomNavDocumentation\ngenerate: true\ntags: [bottomnav, navigation, tabs, mobile]\n---\n\n# BottomNav\n\n## Overview\n`BottomNav` is an app-style floating bottom tab bar. It shares the exact same API\nas `Navbar` (`logo`, `items`, `buttons`, `position`, `direction`), so it works as a\ndrop-in alternative to the classic top navbar — especially on mobile, where it docks\nto the bottom edge instead of hiding navigation behind a hamburger.\n\n## Core Behavior\n- `items` render as tabs. Each item accepts the familiar `{ text, path }`, an optional\n  `icon` (any valid `Icon` name, shown above the label), or `type: 'dropdown'` with `options`.\n- A spring-eased indicator slides under the active tab. The active tab is resolved from the\n  current route (exact match first, then the longest matching prefix for nested routes such\n  as `/docs/button` highlighting the `/docs` tab) and re-syncs on browser back/forward.\n- `position: 'fixed'` floats the bar centered at the bottom on desktop and docks it full-width\n  to the bottom edge on mobile. `position: 'static'` renders it inline in normal flow.\n- `direction: 'reverse'` mirrors the tab order (row-reverse), matching `Navbar`.\n- `buttons` reuse the shared `Button` component and sit after the tabs as trailing actions.\n\n## Live Preview\n:::component name=\"BottomNav\"\n{\n  \"position\": \"static\",\n  \"items\": [\n    {\n      \"text\": \"Home\",\n      \"path\": \"/docs\",\n      \"icon\": \"home\"\n    },\n    {\n      \"text\": \"Components\",\n      \"path\": \"/docs/navigation/navbar\",\n      \"icon\": \"grid\"\n    },\n    {\n      \"text\": \"Docs\",\n      \"path\": \"/docs/navigation/tabs\",\n      \"icon\": \"book\"\n    }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"App-style tabs with icons\" expected=\"icon-over-label tabs with a sliding active indicator\"\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Components', path: '/docs/navigation/navbar', icon: 'grid' },\n    { text: 'Docs', path: '/docs/navigation/tabs', icon: 'book' }\n  ]\n});\n\nreturn nav;\n:::\n\n:::script label=\"Tabs + trailing action\" expected=\"tabs followed by a CTA button\"\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  items: [\n    { text: 'Overview', path: '/docs', icon: 'home' },\n    { text: 'Guides', path: '/docs/navigation/dropdown', icon: 'book' }\n  ],\n  buttons: [\n    { value: 'GitHub', icon: 'github' }\n  ]\n});\n\nreturn nav;\n:::\n\n:::script label=\"Reverse direction\" expected=\"tab order is mirrored\"\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  direction: 'reverse',\n  items: [\n    { text: 'First', path: '/docs', icon: 'home' },\n    { text: 'Second', path: '/docs/navigation/tabs', icon: 'grid' },\n    { text: 'Third', path: '/docs/navigation/navbar', icon: 'book' }\n  ]\n});\n\nreturn nav;\n:::\n\n## Best Practices\n:::tip\nOn `position: 'fixed'`, add some `padding-bottom` to your page content so the floating bar\nnever covers the last rows. Pass a per-item `icon` for the clearest app-style tab pattern.\n:::\n\n## Pitfalls\n:::warning\nAvoid `type: 'dropdown'` items inside a bottom-docked `BottomNav`: the shared `DropDown` opens\ndownward and would render off-screen. Use dropdowns in top-anchored navigations (`Navbar`,\n`FloatingDock`) instead.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"position\": \"static\",\n  \"items\": [\n    {\n      \"text\": \"Home\",\n      \"path\": \"/docs\",\n      \"icon\": \"home\"\n    },\n    {\n      \"text\": \"Components\",\n      \"path\": \"/docs/navigation/navbar\",\n      \"icon\": \"grid\"\n    },\n    {\n      \"text\": \"Docs\",\n      \"path\": \"/docs/navigation/tabs\",\n      \"icon\": \"book\"\n    }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"position\": \"static\",\n  \"items\": [\n    {\n      \"text\": \"Home\",\n      \"path\": \"/docs\",\n      \"icon\": \"home\"\n    },\n    {\n      \"text\": \"Components\",\n      \"path\": \"/docs/navigation/navbar\",\n      \"icon\": \"grid\"\n    },\n    {\n      \"text\": \"Docs\",\n      \"path\": \"/docs/navigation/tabs\",\n      \"icon\": \"book\"\n    }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('BottomNav', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"logo\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttons\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"position\",\"type\":\"string\",\"required\":false,\"default\":\"fixed\",\"allowedValues\":[]},{\"path\":\"direction\",\"type\":\"string\",\"required\":false,\"default\":\"normal\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"logo\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttons\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"position\",\"type\":\"string\",\"required\":false,\"default\":\"fixed\",\"allowedValues\":[]},{\"path\":\"direction\",\"type\":\"string\",\"required\":false,\"default\":\"normal\",\"allowedValues\":[]}]}");
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
          return createBuildFallbackNode(name);
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

customElements.define('slice-bottomnavdocumentation', BottomNavDocumentation);
