export default class EmptyStateDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"With an action","expected":"an icon, a title, a sentence and a button that logs the click","kind":"script","content":"const note = document.createElement('p');\nnote.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';\nnote.textContent = 'Click the button, then watch this line.';\n\nconst empty = await slice.build('EmptyState', {\n  icon: 'inbox-full',\n  title: 'No messages yet',\n  description: 'Replies from your team will show up here.',\n  buttonLabel: 'Invite a teammate',\n  buttonOnClick: () => { note.textContent = 'Teammate invited.'; },\n});\n\nmount(empty);\nmount(note);"},{"label":"Read-only","expected":"just the title and sentence","kind":"script","content":"return await slice.build('EmptyState', {\n  icon: 'search',\n  title: 'No results',\n  description: 'Try a different search term.',\n});"},{"label":"Minimal","expected":"a title with nothing else","kind":"script","content":"return await slice.build('EmptyState', { title: 'Nothing to show' });"}];
  }

  async init() {
    this.markdownPath = "empty-state.md";
    this.markdownContent = "---\ntitle: EmptyState\nroute: /docs/display/empty-state\nnavLabel: EmptyState\nsection: Display\ngroup: Basic\norder: 24\ndescription: The \"nothing here yet\" placeholder, with an optional icon, explanation and action.\ncomponent: EmptyStateDocumentation\ngenerate: true\ntags: [empty, placeholder, zero-state, onboarding]\n---\n\n# EmptyState\n\n## Overview\n\nThe block you show where content *would* be, if there were any. It carries an icon, a title, a\nsentence explaining what will appear there, and usually one action that fixes the emptiness.\n\nAn empty state is not decoration: it is the first thing a new user sees in that area, so the copy\nshould say what goes here and how to get the first one in.\n\n## API\n\n- `icon` (string, default `'inbox-full'`) — an `Icon` name. Empty renders no glyph.\n- `iconSize` (string, default `'large'`)\n- `title` (string) — the heading. Hidden when empty.\n- `description` (string) — the explanation. Hidden when empty.\n- `buttonLabel` (string) — label of the optional action `Button`\n- `buttonRoute` (string) — where the action navigates\n- `buttonOnClick` (function) — what the action does. **Wins over `buttonRoute`.**\n\n`buttonOnClick` rather than `onClick` because the click belongs to the child `Button`, not to the\nempty state itself.\n\n## Prop Scenarios\n\n:::script label=\"With an action\" expected=\"an icon, a title, a sentence and a button that logs the click\"\nconst note = document.createElement('p');\nnote.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';\nnote.textContent = 'Click the button, then watch this line.';\n\nconst empty = await slice.build('EmptyState', {\n  icon: 'inbox-full',\n  title: 'No messages yet',\n  description: 'Replies from your team will show up here.',\n  buttonLabel: 'Invite a teammate',\n  buttonOnClick: () => { note.textContent = 'Teammate invited.'; },\n});\n\nmount(empty);\nmount(note);\n:::\n\n:::script label=\"Read-only\" expected=\"just the title and sentence\"\nreturn await slice.build('EmptyState', {\n  icon: 'search',\n  title: 'No results',\n  description: 'Try a different search term.',\n});\n:::\n\n:::script label=\"Minimal\" expected=\"a title with nothing else\"\nreturn await slice.build('EmptyState', { title: 'Nothing to show' });\n:::\n\n## Best Practices\n\n:::tip\nWrite the description as a promise, not an apology: \"Replies will show up here\" beats \"There are no\nreplies\". One concrete action beats a paragraph of explanation.\n:::\n\n## Pitfalls\n\n:::warning\nGive it a real empty state only where the absence is expected. A request that failed to load looks\nidentical to an empty list, and \"Nothing here\" is the wrong message for a broken endpoint — handle\nerrors separately.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-4"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"inbox-full\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"description\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttonLabel\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttonRoute\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttonOnClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"iconSize\",\"type\":\"string\",\"required\":false,\"default\":\"large\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"inbox-full\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"description\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttonLabel\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttonRoute\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttonOnClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"iconSize\",\"type\":\"string\",\"required\":false,\"default\":\"large\",\"allowedValues\":[]}]}");
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

customElements.define('slice-emptystatedocumentation', EmptyStateDocumentation);
