export default class CodeVisualizerDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"JavaScript highlighting","expected":"renders JS code with keyword and string colors","kind":"script","content":"const code = await slice.build('CodeVisualizer', {\n  value: `function greet(name) {\n  const message = \"Hello, \" + name;\n  console.log(message);\n  return message;\n}\n\ngreet(\"World\");`,\n  language: 'javascript'\n});\n\nreturn code;"},{"label":"HTML highlighting","expected":"renders HTML code with tag and attribute colors","kind":"script","content":"const code = await slice.build('CodeVisualizer', {\n  value: `<div class=\"container\">\n  <h1>Title</h1>\n  <p>Description here</p>\n</div>`,\n  language: 'html'\n});\n\nreturn code;"},{"label":"CSS highlighting","expected":"renders CSS with selector and property colors","kind":"script","content":"const code = await slice.build('CodeVisualizer', {\n  value: `.container {\n  display: flex;\n  gap: 1rem;\n  padding: 2rem;\n  background: #f9fafb;\n  border-radius: 8px;\n}`,\n  language: 'css'\n});\n\nreturn code;"},{"label":"Unknown language fallback","expected":"renders plain escaped code without colors","kind":"script","content":"const code = await slice.build('CodeVisualizer', {\n  value: 'some raw text without highlighting',\n  language: 'text'\n});\n\nreturn code;"}];
  }

  async init() {
    this.markdownPath = "code-visualizer.md";
    this.markdownContent = "---\ntitle: CodeVisualizer\nroute: /docs/display/code-visualizer\nnavLabel: CodeVisualizer\nsection: Display\ngroup: Code\norder: 10\ndescription: CodeVisualizer documentation with syntax highlighting and copy scenarios.\ncomponent: CodeVisualizerDocumentation\ngenerate: true\ntags: [code, syntax, highlight, display]\n---\n\n# CodeVisualizer\n\n## Overview\n`CodeVisualizer` displays syntax-highlighted code blocks with a copy-to-clipboard button. Supports JavaScript, HTML, and CSS highlighting with token-based colorization.\n\n## API and Behavior\n- Accepts `value` (code string) and `language` (`javascript`, `html`, `css`, or `js`).\n- Syntax highlighting is applied client-side via token extraction.\n- Copy button writes the raw unformatted code to the clipboard.\n- Button shows visual feedback on success or error.\n\n## Basic Usage\n```javascript title=\"Build code visualizer\"\nconst code = await slice.build('CodeVisualizer', {\n  value: 'const x = 42;',\n  language: 'javascript'\n});\n\nthis.appendChild(code);\n```\n\n## Prop Scenarios\n:::script label=\"JavaScript highlighting\" expected=\"renders JS code with keyword and string colors\"\nconst code = await slice.build('CodeVisualizer', {\n  value: `function greet(name) {\n  const message = \"Hello, \" + name;\n  console.log(message);\n  return message;\n}\n\ngreet(\"World\");`,\n  language: 'javascript'\n});\n\nreturn code;\n:::\n\n:::script label=\"HTML highlighting\" expected=\"renders HTML code with tag and attribute colors\"\nconst code = await slice.build('CodeVisualizer', {\n  value: `<div class=\"container\">\n  <h1>Title</h1>\n  <p>Description here</p>\n</div>`,\n  language: 'html'\n});\n\nreturn code;\n:::\n\n:::script label=\"CSS highlighting\" expected=\"renders CSS with selector and property colors\"\nconst code = await slice.build('CodeVisualizer', {\n  value: `.container {\n  display: flex;\n  gap: 1rem;\n  padding: 2rem;\n  background: #f9fafb;\n  border-radius: 8px;\n}`,\n  language: 'css'\n});\n\nreturn code;\n:::\n\n:::script label=\"Unknown language fallback\" expected=\"renders plain escaped code without colors\"\nconst code = await slice.build('CodeVisualizer', {\n  value: 'some raw text without highlighting',\n  language: 'text'\n});\n\nreturn code;\n:::\n\n## Best Practices\n:::tip\nUse `CodeVisualizer` inside documentation pages or tutorials to show inline code examples with copy support.\n:::\n\n## Pitfalls\n:::warning\nLanguage must match exactly (`javascript`, `html`, or `css`). Unknown languages render unhighlighted escaped text.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const code = await slice.build('CodeVisualizer', {\n  value: 'const x = 42;',\n  language: 'javascript'\n});\n\nthis.appendChild(code);",
               language: "javascript"
            });
            if ("Build code visualizer") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build code visualizer";
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

customElements.define('slice-codevisualizerdocumentation', CodeVisualizerDocumentation);
