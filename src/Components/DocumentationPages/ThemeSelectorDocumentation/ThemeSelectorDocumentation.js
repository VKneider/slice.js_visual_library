export default class ThemeSelectorDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [];
  }

  async init() {
    this.markdownPath = "theme-selector.md";
    this.markdownContent = "---\r\ntitle: ThemeSelector\r\nroute: /docs/input/theme-selector\r\nnavLabel: ThemeSelector\r\nsection: Input Components\r\ngroup: Basic\r\norder: 15\r\ndescription: A binary LIGHT/DARK toggle with sun and moon icons that switches the app theme and keeps every theme control in sync.\r\ncomponent: ThemeSelectorDocumentation\r\ngenerate: true\r\ntags: [theme, selector, toggle, dark-mode, settings, light]\r\n---\r\n\r\n# ThemeSelector\r\n\r\n## Overview\r\n`ThemeSelector` is a compact icon-only toggle that switches between **LIGHT** and **DARK**\r\nthemes. It renders a pill-shaped button with a sun icon for LIGHT and a moon icon for DARK;\r\nthe active option is highlighted with the `--primary-color` background.\r\n\r\nIt is the visual counterpart to [`ThemeSwitcher`](/docs/input/theme-switcher): use\r\n`ThemeSelector` when you want an icon-based binary control in a topbar or navbar, and\r\n`ThemeSwitcher` when you need a text-based control that cycles through an arbitrary list\r\nof themes.\r\n\r\n## Core Behavior\r\n- Reads the current theme from `slice.stylesManager.themeManager.currentTheme` on init and\r\n  marks the matching option as `.active`.\r\n- Clicking the button calls `slice.setTheme(next)`, toggling between `'LIGHT'` and `'DARK'`.\r\n- After setting the theme it dispatches a global `themeChanged` `CustomEvent` with\r\n  `{ detail: { themeName } }` so every other theme control on the page stays in sync.\r\n- It also **listens** for `themeChanged`, so changing the theme from another control (e.g.\r\n  `ThemeSwitcher`) updates the active option automatically.\r\n- A `.loading` class is applied during the async `slice.setTheme` call; the button becomes\r\n  non-interactive and visually dimmed until the theme finishes applying.\r\n\r\n## Live Preview\r\n:::component name=\"ThemeSelector\"\r\n{}\r\n:::\r\n\r\n## Example\r\n```javascript title=\"Build a theme selector and append it to a toolbar\"\r\nconst selector = await slice.build('ThemeSelector');\r\ntoolbar.appendChild(selector);\r\n```\r\n\r\n## Props\r\n`ThemeSelector` has no configurable props — it is a self-contained, single-purpose toggle\r\nthat reads the current theme directly from the framework's `themeManager`.\r\n\r\n## Best Practices\r\n:::tip\r\nPlace `ThemeSelector` in a persistent shell element (navbar, topbar, sidebar) so the user\r\ncan switch themes from any page. The component auto-syncs with other theme controls via the\r\n`themeChanged` event, so you can safely use multiple selectors and switchers on the same\r\npage.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\n`ThemeSelector` is hardcoded to the `'LIGHT'` / `'DARK'` pair. If your app uses additional\r\nthemes (e.g. `'SOLARIZED'`), use [`ThemeSwitcher`](/docs/input/theme-switcher) instead,\r\nwhich accepts a custom `themes` array.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{}") {
               try {
                  props = JSON.parse("{}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('ThemeSelector', props);
            container.appendChild(component);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const selector = await slice.build('ThemeSelector');\r\ntoolbar.appendChild(selector);\r",
               language: "javascript"
            });
            if ("Build a theme selector and append it to a toolbar") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build a theme selector and append it to a toolbar";
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

customElements.define('slice-themeselectordocumentation', ThemeSelectorDocumentation);
