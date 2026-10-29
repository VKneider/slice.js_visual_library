export default class NotFoundDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Default 404 view","expected":"renders not found message","kind":"script","content":"const notFound = await slice.build('NotFound', {});\nreturn notFound;"},{"label":"Route fallback usage","expected":"renders not found inside route container","kind":"script","content":"const notFound = await slice.build('NotFound', {});\n\nconst route = await slice.build('Route', {\n  path: '/does-not-exist',\n  view: notFound\n});\n\nconst host = document.createElement('div');\nconst label = document.createElement('p');\nlabel.textContent = 'Route /does-not-exist mapped to NotFound:';\nhost.appendChild(label);\nhost.appendChild(route);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "not-found.md";
    this.markdownContent = "---\ntitle: NotFound\nroute: /docs/navigation/not-found\nnavLabel: NotFound\nsection: Navigation\ngroup: Core\norder: 40\ndescription: NotFound 404 page documentation with route fallback scenarios.\ncomponent: NotFoundDocumentation\ngenerate: true\ntags: [not-found, 404, navigation, routing]\n---\n\n# NotFound\n\n## Overview\n`NotFound` renders a 404 fallback page when no route matches the current URL. It sets the document\ntitle to its translated title on initialization.\n\n## API and Behavior\n- No props required. Displays a static 404 message.\n- Routes: use it as the final route or as `MultiRoute`'s `fallback`.\n\n## Texts and translation\nThe three texts are marked and ship their own defaults (English and Spanish), so the component works\nwith the translator off and translates itself when it is on:\n\n| Key | English default | Spanish default |\n| --- | --- | --- |\n| `slice.notFound.title` | Page Not Found | Página no encontrada |\n| `slice.notFound.message` | The page you are looking for doesn't exist or has been moved. | La página que buscas no existe o se ha movido. |\n| `slice.notFound.home` | Go Home | Ir al inicio |\n\nAn app dictionary that defines these keys wins; the defaults are registered in the translator's\n`defaults` layer, never overriding the app. The home button receives the key as a prop\n(`slice.translator.ref`), so it follows a locale change.\n- Automatically updates the page title on `init()`.\n- Composable inside `MultiRoute` as the default fallback view.\n\n## Live Preview\n:::component name=\"NotFound\"\n:::\n\n## Prop Scenarios\n:::script label=\"Default 404 view\" expected=\"renders not found message\"\nconst notFound = await slice.build('NotFound', {});\nreturn notFound;\n:::\n\n:::script label=\"Route fallback usage\" expected=\"renders not found inside route container\"\nconst notFound = await slice.build('NotFound', {});\n\nconst route = await slice.build('Route', {\n  path: '/does-not-exist',\n  view: notFound\n});\n\nconst host = document.createElement('div');\nconst label = document.createElement('p');\nlabel.textContent = 'Route /does-not-exist mapped to NotFound:';\nhost.appendChild(label);\nhost.appendChild(route);\nreturn host;\n:::\n\n## Best Practices\n:::tip\nUse `NotFound` as the final route inside `MultiRoute` to catch unmatched paths.\n:::\n\n## Pitfalls\n:::warning\n`NotFound` is a presentation-only component. It does not provide automatic redirect logic.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| Key | English default | Spanish default |","| --- | --- | --- |","| `slice.notFound.title` | Page Not Found | Página no encontrada |","| `slice.notFound.message` | The page you are looking for doesn't exist or has been moved. | La página que buscas no existe o se ha movido. |","| `slice.notFound.home` | Go Home | Ir al inicio |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               // An escaped pipe (|) is a character inside the cell - a union
               // type, a value in prose - not a column break. Splitting on it
               // dropped every column after it (the description, usually).
               // (No regex here: this code lives in a template string, so every
               // backslash would have to be doubled, and a missed one shipped a
               // broken regex that killed the whole page.)
               const ESCAPED_PIPE = String.fromCharCode(92) + '|';
               const MARK = String.fromCharCode(1);
               return value
                  .split(ESCAPED_PIPE)
                  .join(MARK)
                  .split('|')
                  .map((cell) => cell.split(MARK).join('|').trim());
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
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            let props = {};
            if ("") {
               try {
                  props = JSON.parse("");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('NotFound', props);
            container.appendChild(component);
         }
       }
    await this.renderScriptScenarios();
  }

  async update() {
    // Refresh dynamic content here if needed
  }

   beforeDestroy() {
     for (const link of this._inlineLinks) {
       slice.controller.destroyComponent(link);
     }
     this._inlineLinks = [];
   }

  async setupCopyButton() {
    const container = this.querySelector('[data-copy-md]');
    if (!container) return;

    const copyMenu = await slice.build('CopyMarkdownMenu', {
      markdownPath: this.markdownPath,
      markdownContent: this.markdownContent,
      label: 'Copy as markdown'
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
      // parse as this.scriptScenarios â€” so the counts always line up. They used to be
      // ignored: every scenario was appended in one lump to the end of
      // .documentation-content under a second, generated <h2>Prop Scenarios</h2>. The
      // result was that the heading an author wrote sat over nothing at all â€” the divs
      // were never filled, nothing in the repo reads .script-block â€” the real demos were
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

customElements.define('slice-notfounddocumentation', NotFoundDocumentation);
