export default class LinkDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"basic route-aware link","expected":"clicking navigates through the router, href stays in the DOM","kind":"script","content":"const link = await slice.build('Link', { text: 'Components', path: '/docs' });\nmount(link);"},{"label":"icon + subtitle","expected":"a labelled link with an icon chip and a secondary line","kind":"script","content":"const row = document.createElement('div');\nrow.style.cssText = 'display:flex;flex-direction:column;gap:12px;font-family:system-ui,sans-serif;';\n\nconst docs = await slice.build('Link', {\n  text: 'Components',\n  sub: '42 items',\n  icon: 'rocket',\n  path: '/docs'\n});\n\nconst plain = await slice.build('Link', { text: 'Plain link', path: '/docs' });\n\nrow.appendChild(docs);\nrow.appendChild(plain);\nreturn row;"}];
  }

  async init() {
    this.markdownPath = "link.md";
    this.markdownContent = "---\ntitle: Link\nroute: /docs/navigation/link\nnavLabel: Link\nsection: Navigation Components\ngroup: Basic\norder: 30\ndescription: Route-aware anchor with optional icon and subtitle — the one link primitive that navigates through slice.router.\ncomponent: LinkDocumentation\ngenerate: true\ntags: [link, navigation, anchor]\n---\n\n# Link\n\n## Overview\n\n`Link` is a route-aware `<a>`: it keeps a real `href` in the DOM (so right-click → open in new tab\nstill works, and the URL is visible on hover) but intercepts the click and hands the path to\n`slice.router.navigate`, so navigation goes through the client-side router instead of a full page load.\n\nIt is built with DOM APIs (`setAttribute` / `textContent`) rather than an `innerHTML` template, so a\n`path` like `javascript:...` or text containing markup can never inject into the page.\n\n## API and Behavior\n\n- `path` — the route to navigate to. Also the anchor's `href`. Defaults to `'#'`.\n- `text` — the link label.\n- `classes` — extra class names applied to the `<a>`.\n- `icon` — an `Icon` name rendered before the label, `aria-hidden` (the label is the accessible name).\n- `iconSize` / `iconColor` — passed through to the `Icon`.\n- `sub` — a secondary line under the label (a count, a description).\n\nThe anchor is an inline flex row with a gap, `text-decoration: none` and `color: inherit`, so a link\nreads as part of its layout instead of fighting the UA's default link styling. Pass `classes` to add\nyour own hover/underline treatment.\n\n## Prop Scenarios\n\n:::script label=\"basic route-aware link\" expected=\"clicking navigates through the router, href stays in the DOM\"\nconst link = await slice.build('Link', { text: 'Components', path: '/docs' });\nmount(link);\n:::\n\n:::script label=\"icon + subtitle\" expected=\"a labelled link with an icon chip and a secondary line\"\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;flex-direction:column;gap:12px;font-family:system-ui,sans-serif;';\n\nconst docs = await slice.build('Link', {\n  text: 'Components',\n  sub: '42 items',\n  icon: 'rocket',\n  path: '/docs'\n});\n\nconst plain = await slice.build('Link', { text: 'Plain link', path: '/docs' });\n\nrow.appendChild(docs);\nrow.appendChild(plain);\nreturn row;\n:::\n\n## Best Practices\n\n:::tip\nUse `Link` for in-app navigation. For external destinations use a plain `<a>` with `target` /\n`rel` — routing an off-site URL through the router buys nothing.\n:::\n\n## Pitfalls\n\n:::warning\n`Link` has no template and no `setComponentProps`: its props are read once, in the constructor, from\nwhoever built the element. Changing them later means calling `render()` again — it is not a reactive\ncomponent like `Button` or `Tabs`.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
    // No dynamic blocks
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

customElements.define('slice-linkdocumentation', LinkDocumentation);
