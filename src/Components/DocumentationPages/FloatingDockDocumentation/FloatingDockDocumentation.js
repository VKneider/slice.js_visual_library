export default class FloatingDockDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Dock with magnify","expected":"capsule of items that magnify toward the cursor","kind":"script","content":"const dock = await slice.build('FloatingDock', {\n  position: 'static',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Components', path: '/docs/navigation/navbar', icon: 'grid' },\n    { text: 'Docs', path: '/docs/navigation/tabs', icon: 'book' },\n    { text: 'API', path: '/docs/internal/markdown-parser-rules', icon: 'code' }\n  ]\n});\n\nreturn dock;"},{"label":"Dock with dropdown + action","expected":"text items, a dropdown group and a CTA button","kind":"script","content":"const dock = await slice.build('FloatingDock', {\n  position: 'static',\n  items: [\n    { text: 'Overview', path: '/docs', icon: 'home' },\n    {\n      text: 'Guides',\n      type: 'dropdown',\n      options: [\n        { text: 'Navbar', path: '/docs/navigation/navbar' },\n        { text: 'Tabs', path: '/docs/navigation/tabs' },\n        { text: 'DropDown', path: '/docs/navigation/dropdown' }\n      ]\n    }\n  ],\n  buttons: [\n    { value: 'GitHub', icon: 'github' }\n  ]\n});\n\nreturn dock;"},{"label":"Reverse direction","expected":"dock layout is mirrored","kind":"script","content":"const dock = await slice.build('FloatingDock', {\n  position: 'static',\n  direction: 'reverse',\n  items: [\n    { text: 'First', path: '/docs', icon: 'home' },\n    { text: 'Second', path: '/docs/navigation/tabs', icon: 'grid' },\n    { text: 'Third', path: '/docs/navigation/navbar', icon: 'book' }\n  ]\n});\n\nreturn dock;"}];
  }

  async init() {
    this.markdownPath = "floating-dock.md";
    this.markdownContent = "---\ntitle: FloatingDock\nroute: /docs/navigation/floating-dock\nnavLabel: FloatingDock\nsection: Navigation\ngroup: Core\norder: 34\ndescription: FloatingDock (macOS-style floating navigation capsule) documentation with practical scenarios.\ncomponent: FloatingDockDocumentation\ngenerate: true\ntags: [floatingdock, navigation, dock, mobile]\n---\n\n# FloatingDock\n\n## Overview\n`FloatingDock` is a glassy floating navigation capsule that hovers, centered, above the page.\nIts signature interaction is macOS-dock-style magnification: items grow and lift toward the\npointer. It shares the same API as `Navbar` (`logo`, `items`, `buttons`, `position`,\n`direction`), so it is a drop-in alternative to the classic top navbar.\n\n## Core Behavior\n- `items` accept the familiar `{ text, path }`, an optional `icon` (any valid `Icon` name),\n  or `type: 'dropdown'` with `options`.\n- On fine-pointer devices the items magnify based on their distance to the cursor (smoothstep\n  falloff). Touch devices keep the items calm and tappable — no magnification.\n- The active item is resolved from the current route (exact match, then longest prefix) and is\n  marked with a glowing accent dot; it re-syncs on browser back/forward.\n- `position: 'fixed'` floats the capsule centered at the top of the viewport; `position: 'static'`\n  renders it inline. `direction: 'reverse'` mirrors the layout (row-reverse).\n- On mobile the capsule collapses to the logo plus an animated hamburger; `items` and `buttons`\n  drop into a panel beneath the capsule. Tapping outside or choosing an item closes it.\n\n## Live Preview\n:::component name=\"FloatingDock\"\n{\n  \"position\": \"static\",\n  \"items\": [\n    {\n      \"text\": \"Home\",\n      \"path\": \"/docs\",\n      \"icon\": \"home\"\n    },\n    {\n      \"text\": \"Components\",\n      \"path\": \"/docs/navigation/navbar\",\n      \"icon\": \"grid\"\n    },\n    {\n      \"text\": \"Docs\",\n      \"path\": \"/docs/navigation/tabs\",\n      \"icon\": \"book\"\n    }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"Dock with magnify\" expected=\"capsule of items that magnify toward the cursor\"\nconst dock = await slice.build('FloatingDock', {\n  position: 'static',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Components', path: '/docs/navigation/navbar', icon: 'grid' },\n    { text: 'Docs', path: '/docs/navigation/tabs', icon: 'book' },\n    { text: 'API', path: '/docs/internal/markdown-parser-rules', icon: 'code' }\n  ]\n});\n\nreturn dock;\n:::\n\n:::script label=\"Dock with dropdown + action\" expected=\"text items, a dropdown group and a CTA button\"\nconst dock = await slice.build('FloatingDock', {\n  position: 'static',\n  items: [\n    { text: 'Overview', path: '/docs', icon: 'home' },\n    {\n      text: 'Guides',\n      type: 'dropdown',\n      options: [\n        { text: 'Navbar', path: '/docs/navigation/navbar' },\n        { text: 'Tabs', path: '/docs/navigation/tabs' },\n        { text: 'DropDown', path: '/docs/navigation/dropdown' }\n      ]\n    }\n  ],\n  buttons: [\n    { value: 'GitHub', icon: 'github' }\n  ]\n});\n\nreturn dock;\n:::\n\n:::script label=\"Reverse direction\" expected=\"dock layout is mirrored\"\nconst dock = await slice.build('FloatingDock', {\n  position: 'static',\n  direction: 'reverse',\n  items: [\n    { text: 'First', path: '/docs', icon: 'home' },\n    { text: 'Second', path: '/docs/navigation/tabs', icon: 'grid' },\n    { text: 'Third', path: '/docs/navigation/navbar', icon: 'book' }\n  ]\n});\n\nreturn dock;\n:::\n\n## Best Practices\n:::tip\nBecause the dock floats over content on `position: 'fixed'`, add some `padding-top` to your page\nso the first rows are never covered. Dropdowns open downward, which fits a top-anchored dock.\n:::\n\n## Pitfalls\n:::warning\nMagnification is intentionally disabled on touch devices and while the mobile panel is open.\nDo not rely on it for conveying state — the active item also carries an accent dot.\n:::\n";
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
            const component = await slice.build('FloatingDock', props);
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

customElements.define('slice-floatingdockdocumentation', FloatingDockDocumentation);
