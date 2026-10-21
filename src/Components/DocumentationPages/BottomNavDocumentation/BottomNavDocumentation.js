export default class BottomNavDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"App-style tabs with icons","expected":"icon-over-label tabs with a sliding active indicator","kind":"script","content":"const nav = await slice.build('BottomNav', {\r\n  position: 'static',\r\n  items: [\r\n    { text: 'Home', path: '/docs', icon: 'home' },\r\n    { text: 'Components', path: '/docs/navigation/navbar', icon: 'grid' },\r\n    { text: 'Docs', path: '/docs/navigation/tabs', icon: 'book' }\r\n  ]\r\n});\r\n\r\nreturn nav;"},{"label":"Tabs + trailing action","expected":"tabs followed by a CTA button","kind":"script","content":"const nav = await slice.build('BottomNav', {\r\n  position: 'static',\r\n  items: [\r\n    { text: 'Overview', path: '/docs', icon: 'home' },\r\n    { text: 'Guides', path: '/docs/navigation/dropdown', icon: 'book' }\r\n  ],\r\n  buttons: [\r\n    { value: 'GitHub', icon: 'github' }\r\n  ]\r\n});\r\n\r\nreturn nav;"},{"label":"Reverse direction","expected":"tab order is mirrored","kind":"script","content":"const nav = await slice.build('BottomNav', {\r\n  position: 'static',\r\n  direction: 'reverse',\r\n  items: [\r\n    { text: 'First', path: '/docs', icon: 'home' },\r\n    { text: 'Second', path: '/docs/navigation/tabs', icon: 'grid' },\r\n    { text: 'Third', path: '/docs/navigation/navbar', icon: 'book' }\r\n  ]\r\n});\r\n\r\nreturn nav;"}];
  }

  async init() {
    this.markdownPath = "bottom-nav.md";
    this.markdownContent = "---\r\ntitle: BottomNav\r\nroute: /docs/navigation/bottom-nav\r\nnavLabel: BottomNav\r\nsection: Navigation\r\ngroup: Core\r\norder: 33\r\ndescription: BottomNav (floating bottom tab bar) documentation with practical navigation scenarios.\r\ncomponent: BottomNavDocumentation\r\ngenerate: true\r\ntags: [bottomnav, navigation, tabs, mobile]\r\n---\r\n\r\n# BottomNav\r\n\r\n## Overview\r\n`BottomNav` is an app-style floating bottom tab bar. It shares the exact same API\r\nas `Navbar` (`logo`, `items`, `buttons`, `position`, `direction`), so it works as a\r\ndrop-in alternative to the classic top navbar — especially on mobile, where it docks\r\nto the bottom edge instead of hiding navigation behind a hamburger.\r\n\r\n## Core Behavior\r\n- `items` render as tabs. Each item accepts the familiar `{ text, path }`, an optional\r\n  `icon` (any valid `Icon` name, shown above the label), or `type: 'dropdown'` with `options`.\r\n- A spring-eased indicator slides under the active tab. The active tab is resolved from the\r\n  current route (exact match first, then the longest matching prefix for nested routes such\r\n  as `/docs/button` highlighting the `/docs` tab) and re-syncs on browser back/forward.\r\n- `position: 'fixed'` floats the bar centered at the bottom on desktop and docks it full-width\r\n  to the bottom edge on mobile. `position: 'static'` renders it inline in normal flow.\r\n- `direction: 'reverse'` mirrors the tab order (row-reverse), matching `Navbar`.\r\n- `buttons` reuse the shared `Button` component and sit after the tabs as trailing actions.\r\n\r\n## Live Preview\r\n:::component name=\"BottomNav\"\r\n{\r\n  \"position\": \"static\",\r\n  \"items\": [\r\n    {\r\n      \"text\": \"Home\",\r\n      \"path\": \"/docs\",\r\n      \"icon\": \"home\"\r\n    },\r\n    {\r\n      \"text\": \"Components\",\r\n      \"path\": \"/docs/navigation/navbar\",\r\n      \"icon\": \"grid\"\r\n    },\r\n    {\r\n      \"text\": \"Docs\",\r\n      \"path\": \"/docs/navigation/tabs\",\r\n      \"icon\": \"book\"\r\n    }\r\n  ]\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"App-style tabs with icons\" expected=\"icon-over-label tabs with a sliding active indicator\"\r\nconst nav = await slice.build('BottomNav', {\r\n  position: 'static',\r\n  items: [\r\n    { text: 'Home', path: '/docs', icon: 'home' },\r\n    { text: 'Components', path: '/docs/navigation/navbar', icon: 'grid' },\r\n    { text: 'Docs', path: '/docs/navigation/tabs', icon: 'book' }\r\n  ]\r\n});\r\n\r\nreturn nav;\r\n:::\r\n\r\n:::script label=\"Tabs + trailing action\" expected=\"tabs followed by a CTA button\"\r\nconst nav = await slice.build('BottomNav', {\r\n  position: 'static',\r\n  items: [\r\n    { text: 'Overview', path: '/docs', icon: 'home' },\r\n    { text: 'Guides', path: '/docs/navigation/dropdown', icon: 'book' }\r\n  ],\r\n  buttons: [\r\n    { value: 'GitHub', icon: 'github' }\r\n  ]\r\n});\r\n\r\nreturn nav;\r\n:::\r\n\r\n:::script label=\"Reverse direction\" expected=\"tab order is mirrored\"\r\nconst nav = await slice.build('BottomNav', {\r\n  position: 'static',\r\n  direction: 'reverse',\r\n  items: [\r\n    { text: 'First', path: '/docs', icon: 'home' },\r\n    { text: 'Second', path: '/docs/navigation/tabs', icon: 'grid' },\r\n    { text: 'Third', path: '/docs/navigation/navbar', icon: 'book' }\r\n  ]\r\n});\r\n\r\nreturn nav;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nOn `position: 'fixed'`, add some `padding-bottom` to your page content so the floating bar\r\nnever covers the last rows. Pass a per-item `icon` for the clearest app-style tab pattern.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nAvoid `type: 'dropdown'` items inside a bottom-docked `BottomNav`: the shared `DropDown` opens\r\ndownward and would render off-screen. Use dropdowns in top-anchored navigations (`Navbar`,\r\n`FloatingDock`) instead.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"position\": \"static\",\r\n  \"items\": [\r\n    {\r\n      \"text\": \"Home\",\r\n      \"path\": \"/docs\",\r\n      \"icon\": \"home\"\r\n    },\r\n    {\r\n      \"text\": \"Components\",\r\n      \"path\": \"/docs/navigation/navbar\",\r\n      \"icon\": \"grid\"\r\n    },\r\n    {\r\n      \"text\": \"Docs\",\r\n      \"path\": \"/docs/navigation/tabs\",\r\n      \"icon\": \"book\"\r\n    }\r\n  ]\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"position\": \"static\",\r\n  \"items\": [\r\n    {\r\n      \"text\": \"Home\",\r\n      \"path\": \"/docs\",\r\n      \"icon\": \"home\"\r\n    },\r\n    {\r\n      \"text\": \"Components\",\r\n      \"path\": \"/docs/navigation/navbar\",\r\n      \"icon\": \"grid\"\r\n    },\r\n    {\r\n      \"text\": \"Docs\",\r\n      \"path\": \"/docs/navigation/tabs\",\r\n      \"icon\": \"book\"\r\n    }\r\n  ]\r\n}");
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

customElements.define('slice-bottomnavdocumentation', BottomNavDocumentation);
