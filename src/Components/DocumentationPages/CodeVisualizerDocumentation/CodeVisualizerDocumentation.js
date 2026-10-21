export default class CodeVisualizerDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"JavaScript highlighting","expected":"renders JS code with keyword and string colors","kind":"script","content":"const code = await slice.build('CodeVisualizer', {\r\n  value: `function greet(name) {\r\n  const message = \"Hello, \" + name;\r\n  console.log(message);\r\n  return message;\r\n}\r\n\r\ngreet(\"World\");`,\r\n  language: 'javascript'\r\n});\r\n\r\nreturn code;"},{"label":"HTML highlighting","expected":"renders HTML code with tag and attribute colors","kind":"script","content":"const code = await slice.build('CodeVisualizer', {\r\n  value: `<div class=\"container\">\r\n  <h1>Title</h1>\r\n  <p>Description here</p>\r\n</div>`,\r\n  language: 'html'\r\n});\r\n\r\nreturn code;"},{"label":"CSS highlighting","expected":"renders CSS with selector and property colors","kind":"script","content":"const code = await slice.build('CodeVisualizer', {\r\n  value: `.container {\r\n  display: flex;\r\n  gap: 1rem;\r\n  padding: 2rem;\r\n  background: #f9fafb;\r\n  border-radius: 8px;\r\n}`,\r\n  language: 'css'\r\n});\r\n\r\nreturn code;"},{"label":"Unknown language fallback","expected":"renders plain escaped code without colors","kind":"script","content":"const code = await slice.build('CodeVisualizer', {\r\n  value: 'some raw text without highlighting',\r\n  language: 'text'\r\n});\r\n\r\nreturn code;"}];
  }

  async init() {
    this.markdownPath = "code-visualizer.md";
    this.markdownContent = "---\r\ntitle: CodeVisualizer\r\nroute: /docs/display/code-visualizer\r\nnavLabel: CodeVisualizer\r\nsection: Display\r\ngroup: Code\r\norder: 10\r\ndescription: CodeVisualizer documentation with syntax highlighting and copy scenarios.\r\ncomponent: CodeVisualizerDocumentation\r\ngenerate: true\r\ntags: [code, syntax, highlight, display]\r\n---\r\n\r\n# CodeVisualizer\r\n\r\n## Overview\r\n`CodeVisualizer` displays syntax-highlighted code blocks with a copy-to-clipboard button. Supports JavaScript, HTML, and CSS highlighting with token-based colorization.\r\n\r\n## API and Behavior\r\n- Accepts `value` (code string) and `language` (`javascript`, `html`, `css`, or `js`).\r\n- Syntax highlighting is applied client-side via token extraction.\r\n- Copy button writes the raw unformatted code to the clipboard.\r\n- Button shows visual feedback on success or error.\r\n\r\n## Live Preview\r\n:::component name=\"CodeVisualizer\"\r\n{\r\n  \"value\": \"const answer = 42;\\nconsole.log(answer);\",\r\n  \"language\": \"javascript\"\r\n}\r\n:::\r\n\r\n## Prop Scenarios\r\n:::script label=\"JavaScript highlighting\" expected=\"renders JS code with keyword and string colors\"\r\nconst code = await slice.build('CodeVisualizer', {\r\n  value: `function greet(name) {\r\n  const message = \"Hello, \" + name;\r\n  console.log(message);\r\n  return message;\r\n}\r\n\r\ngreet(\"World\");`,\r\n  language: 'javascript'\r\n});\r\n\r\nreturn code;\r\n:::\r\n\r\n:::script label=\"HTML highlighting\" expected=\"renders HTML code with tag and attribute colors\"\r\nconst code = await slice.build('CodeVisualizer', {\r\n  value: `<div class=\"container\">\r\n  <h1>Title</h1>\r\n  <p>Description here</p>\r\n</div>`,\r\n  language: 'html'\r\n});\r\n\r\nreturn code;\r\n:::\r\n\r\n:::script label=\"CSS highlighting\" expected=\"renders CSS with selector and property colors\"\r\nconst code = await slice.build('CodeVisualizer', {\r\n  value: `.container {\r\n  display: flex;\r\n  gap: 1rem;\r\n  padding: 2rem;\r\n  background: #f9fafb;\r\n  border-radius: 8px;\r\n}`,\r\n  language: 'css'\r\n});\r\n\r\nreturn code;\r\n:::\r\n\r\n:::script label=\"Unknown language fallback\" expected=\"renders plain escaped code without colors\"\r\nconst code = await slice.build('CodeVisualizer', {\r\n  value: 'some raw text without highlighting',\r\n  language: 'text'\r\n});\r\n\r\nreturn code;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nUse `CodeVisualizer` inside documentation pages or tutorials to show inline code examples with copy support.\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nLanguage must match exactly (`javascript`, `html`, or `css`). Unknown languages render unhighlighted escaped text.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\r\n  \"value\": \"const answer = 42;\\nconsole.log(answer);\",\r\n  \"language\": \"javascript\"\r\n}") {
               try {
                  props = JSON.parse("{\r\n  \"value\": \"const answer = 42;\\nconsole.log(answer);\",\r\n  \"language\": \"javascript\"\r\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('CodeVisualizer', props);
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

customElements.define('slice-codevisualizerdocumentation', CodeVisualizerDocumentation);
