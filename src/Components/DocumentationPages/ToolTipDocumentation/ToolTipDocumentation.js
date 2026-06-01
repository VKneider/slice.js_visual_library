export default class ToolTipDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Hover tooltip","expected":"tooltip appears on hover over trigger text","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: 'This is a tooltip'\n});\n\ntooltip.textContent = 'Hover over this text';\n\nreturn tooltip;"},{"label":"Tooltip with button trigger","expected":"tooltip wraps a button element","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: 'Click to confirm'\n});\n\nconst button = await slice.build('Button', {\n  value: 'Submit'\n});\n\ntooltip.appendChild(button);\n\nconst host = document.createElement('div');\nhost.appendChild(tooltip);\nreturn host;"},{"label":"Empty text suppresses tooltip","expected":"no bubble appears on hover","kind":"script","content":"const tooltip = await slice.build('ToolTip', {\n  text: ''\n});\n\ntooltip.textContent = 'Hover me (no tooltip)';\n\nreturn tooltip;"}];
  }

  async init() {
    this.markdownPath = "tooltip.md";
    this.markdownContent = "---\ntitle: ToolTip\nroute: /docs/display/tooltip\nnavLabel: ToolTip\nsection: Display\ngroup: Overlay\norder: 10\ndescription: ToolTip documentation with hover and focus trigger scenarios.\ncomponent: ToolTipDocumentation\ngenerate: true\ntags: [tooltip, overlay, display]\n---\n\n# ToolTip\n\n## Overview\n`ToolTip` displays a floating text label when the user hovers or focuses the wrapped content. The tooltip repositions itself to stay within the viewport.\n\n## API and Behavior\n- `text` sets the tooltip string. Empty text suppresses the tooltip.\n- Triggered by `mouseenter` / `mouseleave` and `focusin` / `focusout`.\n- Bubble is appended to `document.body` for accurate positioning.\n- Automatically flips above or below based on available space.\n- Cleans up the bubble element on disconnect or destroy.\n\n## Prop Scenarios\n:::script label=\"Hover tooltip\" expected=\"tooltip appears on hover over trigger text\"\nconst tooltip = await slice.build('ToolTip', {\n  text: 'This is a tooltip'\n});\n\ntooltip.textContent = 'Hover over this text';\n\nreturn tooltip;\n:::\n\n:::script label=\"Tooltip with button trigger\" expected=\"tooltip wraps a button element\"\nconst tooltip = await slice.build('ToolTip', {\n  text: 'Click to confirm'\n});\n\nconst button = await slice.build('Button', {\n  value: 'Submit'\n});\n\ntooltip.appendChild(button);\n\nconst host = document.createElement('div');\nhost.appendChild(tooltip);\nreturn host;\n:::\n\n:::script label=\"Empty text suppresses tooltip\" expected=\"no bubble appears on hover\"\nconst tooltip = await slice.build('ToolTip', {\n  text: ''\n});\n\ntooltip.textContent = 'Hover me (no tooltip)';\n\nreturn tooltip;\n:::\n\n## Best Practices\n:::tip\nWrap interactive elements like buttons or icons with `ToolTip` to provide contextual hints without cluttering the UI.\n:::\n\n## Pitfalls\n:::warning\nThe tooltip covers the trigger element's content. Place tooltip content as text nodes or child elements inside the component.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"text\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]}]}");
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

customElements.define('slice-tooltipdocumentation', ToolTipDocumentation);
