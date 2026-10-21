export default class ThemeSwitcherDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"default button variant","expected":"compact pill showing the active theme name","kind":"script","content":"const switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Theme'\r\n});\r\nreturn switcher;"},{"label":"menu-item variant","expected":"full-width row with caption on the left and value on the right","kind":"script","content":"const switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Appearance',\r\n  variant: 'menu-item'\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.style.maxWidth = '240px';\r\nhost.appendChild(switcher);\r\nreturn host;"},{"label":"custom theme list","expected":"cycles through the provided themes in order","kind":"script","content":"const switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Theme',\r\n  themes: ['LIGHT', 'DARK']\r\n});\r\nreturn switcher;"},{"label":"onChange callback","expected":"status text updates each time the theme is switched","kind":"script","content":"const status = document.createElement('p');\r\nstatus.textContent = 'Click the switcher to change the theme';\r\n\r\nconst switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Theme',\r\n  onChange: (name) => {\r\n    status.textContent = `Active theme: ${name}`;\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexDirection = 'column';\r\nhost.style.gap = '10px';\r\nhost.appendChild(switcher);\r\nhost.appendChild(status);\r\nreturn host;"},{"label":"display map","expected":"the pill reads 'Light' with a sun icon instead of 'LIGHT'","kind":"script","content":"const switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Theme',\r\n  display: {\r\n    LIGHT: { label: 'Light', icon: 'sun' },\r\n    DARK: { label: 'Dark', icon: 'moon' }\r\n  }\r\n});\r\nreturn switcher;"}];
  }

  async init() {
    this.markdownPath = "theme-switcher.md";
    this.markdownContent = "---\r\ntitle: ThemeSwitcher\r\nroute: /docs/input/theme-switcher\r\nnavLabel: ThemeSwitcher\r\nsection: Input Components\r\ngroup: Basic\r\norder: 16\r\ndescription: A one-click control that cycles through your registered themes and keeps every theme control in sync.\r\ncomponent: ThemeSwitcherDocumentation\r\ngenerate: true\r\ntags: [theme, switcher, toggle, dark-mode, settings]\r\n---\r\n\r\n# ThemeSwitcher\r\n\r\n## Overview\r\n`ThemeSwitcher` is a single button that **cycles** through the themes you give it,\r\nshowing the active theme's name as its value. It is the lightweight counterpart to\r\n[`ThemeSelector`](/docs/input/theme-selector): use `ThemeSelector` for a binary\r\nLIGHT/DARK toggle with icons, and `ThemeSwitcher` when you want a compact text control\r\nthat walks an arbitrary list of themes (e.g. `LIGHT → DARK → SOLARIZED → …`).\r\n\r\nIt works in two visual variants — a compact `button` pill for topbars/toolbars, and a\r\nfull-width `menu-item` row for dropdowns and user menus.\r\n\r\n## Core Behavior\r\n- `themes` is the ordered list to cycle through. Each click advances to the next entry\r\n  and wraps around at the end. Defaults to `['LIGHT', 'DARK']`.\r\n- On switch it calls `slice.setTheme(next)`, dispatches a global `themeChanged`\r\n  `CustomEvent` (so every other theme control on the page stays in sync), and invokes\r\n  the optional `onChange(themeName)` handler.\r\n- It also **listens** for `themeChanged`, so changing the theme anywhere else updates\r\n  the displayed value automatically.\r\n- `variant` switches the layout: `'button'` (default) hides the caption and renders a\r\n  pill; `'menu-item'` shows the `label` caption on the left and the value on the right.\r\n- `display` maps a theme name to its label and icon, e.g. `{ LIGHT: { label: 'Light', icon: 'sun' } }`.\r\n  It is **opt-in and empty by default**, so without it the raw registered theme name (`LIGHT`,\r\n  `SOLARIZED`) is what the user sees. A theme with no entry falls back to its raw name and a generic\r\n  palette icon, so a custom theme never renders blank.\r\n- The control renders an icon slot that follows the current theme; an unknown icon name is ignored\r\n  rather than breaking the button.\r\n- The document listener is registered in `init()` and removed in `beforeDestroy()`.\r\n\r\n## Live Preview\r\n:::component name=\"ThemeSwitcher\"\r\n{\r\n  \"label\": \"Theme\",\r\n  \"variant\": \"button\"\r\n}\r\n:::\r\n\r\n## Example\r\n```javascript title=\"Cycle through three themes in a topbar\"\r\nconst switcher = await slice.build('ThemeSwitcher', {\r\n  themes: ['LIGHT', 'DARK', 'SOLARIZED'],\r\n  variant: 'button',\r\n  onChange: (name) => slice.logger.logInfo('App', `Theme changed to ${name}`)\r\n});\r\nthis.appendChild(switcher);\r\n```\r\n\r\n## Prop Scenarios\r\n:::script label=\"default button variant\" expected=\"compact pill showing the active theme name\"\r\nconst switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Theme'\r\n});\r\nreturn switcher;\r\n:::\r\n\r\n:::script label=\"menu-item variant\" expected=\"full-width row with caption on the left and value on the right\"\r\nconst switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Appearance',\r\n  variant: 'menu-item'\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.style.maxWidth = '240px';\r\nhost.appendChild(switcher);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"custom theme list\" expected=\"cycles through the provided themes in order\"\r\nconst switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Theme',\r\n  themes: ['LIGHT', 'DARK']\r\n});\r\nreturn switcher;\r\n:::\r\n\r\n:::script label=\"onChange callback\" expected=\"status text updates each time the theme is switched\"\r\nconst status = document.createElement('p');\r\nstatus.textContent = 'Click the switcher to change the theme';\r\n\r\nconst switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Theme',\r\n  onChange: (name) => {\r\n    status.textContent = `Active theme: ${name}`;\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.style.display = 'flex';\r\nhost.style.flexDirection = 'column';\r\nhost.style.gap = '10px';\r\nhost.appendChild(switcher);\r\nhost.appendChild(status);\r\nreturn host;\r\n:::\r\n\r\n## Friendly theme names\r\nBy default the switcher prints the registered theme name. `display` maps a name to what the user\r\nshould actually read, plus an icon — without renaming the theme itself.\r\n\r\n:::script label=\"display map\" expected=\"the pill reads 'Light' with a sun icon instead of 'LIGHT'\"\r\nconst switcher = await slice.build('ThemeSwitcher', {\r\n  label: 'Theme',\r\n  display: {\r\n    LIGHT: { label: 'Light', icon: 'sun' },\r\n    DARK: { label: 'Dark', icon: 'moon' }\r\n  }\r\n});\r\nreturn switcher;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nUse the same theme names you registered in `sliceConfig.json` (`themeManager`). The value\r\nshown by the switcher is exactly the name passed to `slice.setTheme`, so keep them\r\nconsistent across `ThemeSwitcher`, `ThemeSelector`, and any custom theme UI.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\n`themes` must list theme names that actually exist under your themes folder. Cycling to\r\nan unregistered name makes `slice.setTheme` fail; the error is logged via\r\n`slice.logger.logError` and the displayed value falls back to the current theme.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"label\": \"Theme\",\r\n  \"variant\": \"button\"\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"label\": \"Theme\",\r\n  \"variant\": \"button\"\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('ThemeSwitcher', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const switcher = await slice.build('ThemeSwitcher', {\r\n  themes: ['LIGHT', 'DARK', 'SOLARIZED'],\r\n  variant: 'button',\r\n  onChange: (name) => slice.logger.logInfo('App', `Theme changed to ${name}`)\r\n});\r\nthis.appendChild(switcher);\r",
               language: "javascript"
            });
            if ("Cycle through three themes in a topbar") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Cycle through three themes in a topbar";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"themes\",\"type\":\"array\",\"required\":false,\"default\":\"LIGHT,DARK\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"button\",\"allowedValues\":[\"button\",\"menu-item\"]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"Theme\",\"allowedValues\":[]},{\"path\":\"display\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"themes\",\"type\":\"array\",\"required\":false,\"default\":\"LIGHT,DARK\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"button\",\"allowedValues\":[\"button\",\"menu-item\"]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"Theme\",\"allowedValues\":[]},{\"path\":\"display\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-themeswitcherdocumentation', ThemeSwitcherDocumentation);
