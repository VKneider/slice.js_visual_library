export default class AvatarGroupDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Project cards with members","expected":"three project Cards, each with a group of member avatars in its footer; +N opens a Modal with everyone on that project","kind":"script","content":"const people = ['Ana López', 'Lucas Molina', 'María Ruiz', 'José Pérez', 'Sofía Rey', 'Diego Fuentes', 'Carla Soto'].map((name, i) => ({ name, status: i % 3 === 0 ? 'online' : '' }));\nconst projects = [\n  { name: 'Website redesign', team: people.slice(0, 6) },\n  { name: 'Mobile app', team: people.slice(2, 5) },\n  { name: 'Public API', team: people.slice(1, 3) }\n];\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;width:100%';\nfor (const project of projects) {\n  const group = await slice.build('AvatarGroup', {\n    items: project.team,\n    max: 4,\n    onMoreClick: async () => {\n      const list = document.createElement('div');\n      list.style.cssText = 'display:grid;gap:10px';\n      for (const person of project.team) {\n        const row = document.createElement('div');\n        row.style.cssText = 'display:flex;gap:10px;align-items:center';\n        row.append(await slice.build('Avatar', { ...person, size: 'sm' }), person.name);\n        list.append(row);\n      }\n      const modal = await slice.build('Modal', { title: `${project.name} team`, size: 'sm', destroyOnClose: true, content: list, actions: [{ value: 'Close', variant: 'ghost' }] });\n      document.body.append(modal);\n      await modal.show();\n    }\n  });\n  grid.append(await slice.build('Card', { title: project.name, subtitle: `${project.team.length} members`, content: group }));\n}\nreturn grid;"}];
  }

  async init() {
    this.markdownPath = "avatar-group.md";
    this.markdownContent = "---\ntitle: AvatarGroup\nroute: /docs/display/avatar-group\nnavLabel: AvatarGroup\nsection: Display\ngroup: Basic\norder: 24.5\ndescription: A few people as overlapping avatars and \"+N\" for the rest, with each name on hover and one accessible name for the group.\ncomponent: AvatarGroupDocumentation\ngenerate: true\ntags: [avatar, group, people, members, assignees]\n---\n\n# AvatarGroup\n\n## Overview\n`AvatarGroup` shows who is involved in something: the members of a project, the people assigned to a task, who has seen a message. It shows the first faces, overlapped, and sums up the rest as \"+N\".\n\n### When to use it\n- **Members or assignees** on a card or a list row, where there is room for a few faces.\n- **\"Who is here\"**: people viewing a document, attending a meeting.\n\n### When not to use it\n- **When each person matters on their own**, with a name and actions: use a list of [Avatar](/docs/display/avatar)s with their names.\n- **One person**: use [Avatar](/docs/display/avatar).\n\n## Core Behavior\n- `items`: one object per person, with [Avatar](/docs/display/avatar)'s props (`{ name, src, status, … }`).\n- `max` (4 by default) is how many places it uses. With more people, the last place becomes \"+N\". With exactly `max` people, every face shows: never \"+1\".\n- Each face shows its name in a tooltip on hover, and \"+N\" lists the names it stands for. They come from the app's [ToolTipProvider](/docs/services/tooltip-provider). `tooltips: false` turns them off.\n- Screen readers hear the group once: \"6 people: Ana López, Lucas Molina, María Ruiz and 3 more\". The faces are not separate tab stops.\n- `onMoreClick({ items, group, event })` makes \"+N\" a button that gets the people it stands for, for example to open the full list.\n- `size` and `shape` apply to every face. `texts` translates the group's name.\n\n## Live Preview\n:::component name=\"AvatarGroup\"\n{\n  \"items\": [{ \"name\": \"Ana López\" }, { \"name\": \"Lucas Molina\" }, { \"name\": \"María Ruiz\" }, { \"name\": \"José Pérez\" }, { \"name\": \"Sofía Rey\" }],\n  \"max\": 4\n}\n:::\n\n## Examples\n:::script label=\"Project cards with members\" expected=\"three project Cards, each with a group of member avatars in its footer; +N opens a Modal with everyone on that project\"\nconst people = ['Ana López', 'Lucas Molina', 'María Ruiz', 'José Pérez', 'Sofía Rey', 'Diego Fuentes', 'Carla Soto'].map((name, i) => ({ name, status: i % 3 === 0 ? 'online' : '' }));\nconst projects = [\n  { name: 'Website redesign', team: people.slice(0, 6) },\n  { name: 'Mobile app', team: people.slice(2, 5) },\n  { name: 'Public API', team: people.slice(1, 3) }\n];\n\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;width:100%';\nfor (const project of projects) {\n  const group = await slice.build('AvatarGroup', {\n    items: project.team,\n    max: 4,\n    onMoreClick: async () => {\n      const list = document.createElement('div');\n      list.style.cssText = 'display:grid;gap:10px';\n      for (const person of project.team) {\n        const row = document.createElement('div');\n        row.style.cssText = 'display:flex;gap:10px;align-items:center';\n        row.append(await slice.build('Avatar', { ...person, size: 'sm' }), person.name);\n        list.append(row);\n      }\n      const modal = await slice.build('Modal', { title: `${project.name} team`, size: 'sm', destroyOnClose: true, content: list, actions: [{ value: 'Close', variant: 'ghost' }] });\n      document.body.append(modal);\n      await modal.show();\n    }\n  });\n  grid.append(await slice.build('Card', { title: project.name, subtitle: `${project.team.length} members`, content: group }));\n}\nreturn grid;\n:::\n\n## Best Practices\n:::tip\nKeep `max` small (3 to 5). The group says \"these people and some more\"; the full list belongs in a click on \"+N\".\n:::\n\n## Pitfalls\n:::warning\nGive every person a `name`. Without one, the face has no tooltip and the group's name cannot list them.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"items\": [{ \"name\": \"Ana López\" }, { \"name\": \"Lucas Molina\" }, { \"name\": \"María Ruiz\" }, { \"name\": \"José Pérez\" }, { \"name\": \"Sofía Rey\" }],\n  \"max\": 4\n}") {
               try {
                  props = JSON.parse("{\n  \"items\": [{ \"name\": \"Ana López\" }, { \"name\": \"Lucas Molina\" }, { \"name\": \"María Ruiz\" }, { \"name\": \"José Pérez\" }, { \"name\": \"Sofía Rey\" }],\n  \"max\": 4\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('AvatarGroup', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"4\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"any\",\"required\":false,\"default\":\"sm\",\"allowedValues\":[]},{\"path\":\"shape\",\"type\":\"string\",\"required\":false,\"default\":\"circle\",\"allowedValues\":[\"circle\",\"rounded\"]},{\"path\":\"tooltips\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"onMoreClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"4\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"any\",\"required\":false,\"default\":\"sm\",\"allowedValues\":[]},{\"path\":\"shape\",\"type\":\"string\",\"required\":false,\"default\":\"circle\",\"allowedValues\":[\"circle\",\"rounded\"]},{\"path\":\"tooltips\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"onMoreClick\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Avatar","path":"/docs/display/avatar"},{"text":"Avatar","path":"/docs/display/avatar"},{"text":"Avatar","path":"/docs/display/avatar"},{"text":"ToolTipProvider","path":"/docs/services/tooltip-provider"}];
         for (const [index, linkProps] of links.entries()) {
            const placeholder = this.querySelector('[data-inline-link="' + index + '"]');
            if (!placeholder) continue;
            const link = await slice.build('Link', linkProps);
            placeholder.replaceWith(link);
            this._inlineLinks.push(link);
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

customElements.define('slice-avatargroupdocumentation', AvatarGroupDocumentation);
