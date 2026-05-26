export default class ElementCarrouselDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Three text slides","expected":"renders carrousel with three slides and dot indicators","kind":"script","content":"const carrousel = await slice.build('ElementCarrousel', {\n  elements: [\n    '<p style=\"text-align:center;padding:2rem\">Slide one</p>',\n    '<p style=\"text-align:center;padding:2rem\">Slide two</p>',\n    '<p style=\"text-align:center;padding:2rem\">Slide three</p>'\n  ]\n});\n\nreturn carrousel;"},{"label":"Slide with components","expected":"renders cards inside each carrousel slide","kind":"script","content":"const slide1 = await slice.build('Card', {\n  title: 'Feature A',\n  text: 'First feature highlight',\n  variant: 'outlined'\n});\n\nconst slide2 = await slice.build('Card', {\n  title: 'Feature B',\n  text: 'Second feature highlight',\n  variant: 'outlined'\n});\n\nconst slide3 = await slice.build('Card', {\n  title: 'Feature C',\n  text: 'Third feature highlight',\n  variant: 'outlined'\n});\n\nconst carrousel = await slice.build('ElementCarrousel', {\n  elements: [slide1, slide2, slide3]\n});\n\nreturn carrousel;"},{"label":"Single element","expected":"renders carrousel with one slide and no extra navigation","kind":"script","content":"const carrousel = await slice.build('ElementCarrousel', {\n  elements: ['<p style=\"text-align:center;padding:2rem\">Only slide</p>']\n});\n\nreturn carrousel;"}];
  }

  async init() {
    this.markdownPath = "carrousel.md";
    this.markdownContent = "---\ntitle: ElementCarrousel\nroute: /docs/layout/element-carrousel\nnavLabel: Carrousel\nsection: Layout\ngroup: Containers\norder: 25\ndescription: ElementCarrousel documentation with slide navigation and indicator scenarios.\ncomponent: ElementCarrouselDocumentation\ngenerate: true\ntags: [carrousel, carousel, layout, navigation]\n---\n\n# ElementCarrousel\n\n## Overview\n`ElementCarrousel` renders a horizontal slide carousel with prev/next buttons and dot indicators. Each slide accepts any DOM node or HTML string, making it suitable for feature showcases, testimonial rotators, and image galleries.\n\n## API and Behavior\n- Accepts `elements` (array of Nodes or strings) as its data source.\n- Slides are rendered as full-width panels with smooth CSS transition.\n- Dot indicators are clickable for direct navigation.\n- Arrow keys supported when the component has focus.\n- Resize-aware: repositions slides on window resize.\n- If `elements` is empty or not an array, no slides are rendered.\n\n## Basic Usage\n```javascript title=\"Build carrousel\"\nconst carrousel = await slice.build('ElementCarrousel', {\n  elements: [\n    document.createElement('div'),\n    document.createElement('div')\n  ]\n});\n\nthis.appendChild(carrousel);\n```\n\n## Prop Scenarios\n:::script label=\"Three text slides\" expected=\"renders carrousel with three slides and dot indicators\"\nconst carrousel = await slice.build('ElementCarrousel', {\n  elements: [\n    '<p style=\"text-align:center;padding:2rem\">Slide one</p>',\n    '<p style=\"text-align:center;padding:2rem\">Slide two</p>',\n    '<p style=\"text-align:center;padding:2rem\">Slide three</p>'\n  ]\n});\n\nreturn carrousel;\n:::\n\n:::script label=\"Slide with components\" expected=\"renders cards inside each carrousel slide\"\nconst slide1 = await slice.build('Card', {\n  title: 'Feature A',\n  text: 'First feature highlight',\n  variant: 'outlined'\n});\n\nconst slide2 = await slice.build('Card', {\n  title: 'Feature B',\n  text: 'Second feature highlight',\n  variant: 'outlined'\n});\n\nconst slide3 = await slice.build('Card', {\n  title: 'Feature C',\n  text: 'Third feature highlight',\n  variant: 'outlined'\n});\n\nconst carrousel = await slice.build('ElementCarrousel', {\n  elements: [slide1, slide2, slide3]\n});\n\nreturn carrousel;\n:::\n\n:::script label=\"Single element\" expected=\"renders carrousel with one slide and no extra navigation\"\nconst carrousel = await slice.build('ElementCarrousel', {\n  elements: ['<p style=\"text-align:center;padding:2rem\">Only slide</p>']\n});\n\nreturn carrousel;\n:::\n\n## Best Practices\n:::tip\nUse `Card` or custom styled nodes as slides to maintain consistent layout across a carrousel.\n:::\n\n## Pitfalls\n:::warning\nSlides must be uniform in height for smooth transitions. Avoid mixing very tall and very short content in the same carrousel.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "const carrousel = await slice.build('ElementCarrousel', {\n  elements: [\n    document.createElement('div'),\n    document.createElement('div')\n  ]\n});\n\nthis.appendChild(carrousel);",
               language: "javascript"
            });
            if ("Build carrousel") {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = "Build carrousel";
               container.appendChild(label);
            }
            container.appendChild(code);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Type | Required | Default | Allowed values |","| --- | --- | --- | --- | --- |","| `elements` | `array` | `false` | `` | - |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => formatCell(cell)));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
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
    subtitle.textContent = 'Run each scenario to validate behavior and prevent regressions.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
      const card = document.createElement('article');
      card.classList.add('doc-script-card');

      const header = document.createElement('div');
      header.classList.add('doc-script-header');

      const heading = document.createElement('h3');
      heading.classList.add('doc-script-title');
      heading.textContent = scenario.label;
      header.appendChild(heading);

      card.appendChild(header);

      const preview = document.createElement('div');
      preview.classList.add('doc-script-preview');
      const errorMessage = document.createElement('p');
      errorMessage.classList.add('doc-script-error');
      errorMessage.hidden = true;

      const executeScenario = async () => {
        preview.innerHTML = '';
        errorMessage.hidden = true;
        errorMessage.textContent = '';

        const createBuildFallbackNode = (name) => {
          const fallback = document.createElement('div');
          fallback.style.padding = '10px';
          fallback.style.border = '1px dashed #f59e0b';
          fallback.style.borderRadius = '8px';
          fallback.style.background = '#fffbeb';
          fallback.style.color = '#92400e';
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
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, safeSlice, document, mount);

          if (result instanceof Node) {
            preview.appendChild(result);
          } else if (Array.isArray(result)) {
            result.forEach((item) => {
              if (item instanceof Node) {
                preview.appendChild(item);
              }
            });
          }
        } catch (error) {
          errorMessage.textContent = 'Live preview error: ' + error.message;
          errorMessage.hidden = false;
        }
      };

      const code = await slice.build('CodeVisualizer', {
        value: scenario.content,
        language: 'javascript'
      });
      card.appendChild(preview);
      card.appendChild(code);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-elementcarrouseldocumentation', ElementCarrouselDocumentation);
