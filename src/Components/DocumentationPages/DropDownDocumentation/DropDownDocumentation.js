export default class DropDownDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Nested menu with icons, toggles and a danger zone","expected":"a menu with sections; Settings opens a submenu, which opens another","kind":"script","content":"const result = document.createElement('p');\nresult.textContent = 'Pick something.';\n\nconst menu = await slice.build('DropDown', {\n  label: 'Account',\n  icon: 'user',\n  variant: 'soft',\n  placement: 'bottom-start',\n  onSelect: (item) => { result.textContent = `Picked: ${item.label}`; },\n  items: [\n    { type: 'label', label: 'Signed in as José' },\n    { label: 'Profile', icon: 'user', shortcut: '⌘P' },\n    { label: 'Billing', icon: 'credit-card', description: 'Plans, invoices and payment', badge: 3 },\n    {\n      label: 'Settings', icon: 'cog', items: [\n        { label: 'General' },\n        {\n          label: 'Appearance', items: [\n            { type: 'radio', group: 'theme', label: 'Light', checked: true },\n            { type: 'radio', group: 'theme', label: 'Dark' },\n            'separator',\n            { label: 'Accent colour', items: [{ label: 'Purple' }, { label: 'Orange' }, { label: 'Teal' }] }\n          ]\n        },\n        { label: 'Email notifications', checked: true }\n      ]\n    },\n    'separator',\n    { label: 'Sign out', icon: 'arrow-right-to-bracket' },\n    { label: 'Delete account', icon: 'trash-bin', danger: true }\n  ]\n});\n\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(menu, result);\nreturn box;"},{"label":"Trigger variants and sizes","expected":"five trigger styles, three sizes and an icon-only button","kind":"script","content":"const items = [{ label: 'Edit' }, { label: 'Duplicate' }, 'separator', { label: 'Delete', danger: true }];\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;width:100%';\nfor (const variant of ['outlined', 'filled', 'soft', 'ghost', 'plain']) {\n  row.appendChild(await slice.build('DropDown', { label: variant, variant, items }));\n}\nfor (const size of ['sm', 'md', 'lg']) {\n  row.appendChild(await slice.build('DropDown', { label: `Size ${size}`, size, items }));\n}\nrow.appendChild(await slice.build('DropDown', { icon: 'dots-vertical', ariaLabel: 'More actions', variant: 'ghost', items }));\nreturn row;"},{"label":"Submenu loaded on demand","expected":"Recent projects shows a loading row, then the list","kind":"script","content":"const menu = await slice.build('DropDown', {\n  label: 'Open',\n  placement: 'bottom-start',\n  items: [\n    { label: 'New project', shortcut: '⌘N' },\n    {\n      label: 'Recent projects',\n      items: async () => {\n        await new Promise((resolve) => setTimeout(resolve, 600));\n        return ['Inventory', 'Website', 'Mobile app'].map((name) => ({ label: name, onClick: () => console.log('open', name) }));\n      }\n    }\n  ]\n});\nreturn menu;"},{"label":"Custom content inside the menu","expected":"a search box filters nothing yet, but you can type in it; Escape closes","kind":"script","content":"const menu = await slice.build('DropDown', {\n  label: 'Jump to',\n  placement: 'bottom-start',\n  items: [\n    {\n      render: ({ close }) => {\n        const input = document.createElement('input');\n        input.type = 'search';\n        input.placeholder = 'Type a page and press Enter';\n        input.style.cssText = 'width:100%;box-sizing:border-box;padding:6px 8px';\n        input.addEventListener('keydown', (event) => {\n          if (event.key === 'Enter') close();\n        });\n        return input;\n      }\n    },\n    'separator',\n    { label: 'Dashboard', path: '/docs' },\n    { label: 'Settings', path: '/docs/input/switch' }\n  ]\n});\nreturn menu;"},{"label":"Action menu (legacy options)","expected":"picking an item runs the action and shows the result","kind":"script","content":"const result = document.createElement('p');\nresult.textContent = 'No action yet';\n\nconst menu = await slice.build('DropDown', {\n  label: 'Export',\n  options: [\n    { text: 'Download JSON', callback: () => { result.textContent = 'Downloaded'; } },\n    { text: 'Print view', callback: () => { result.textContent = 'Print dialog opened'; } },\n    { text: 'Back to docs', path: '/docs' }\n  ]\n});\n\nconst host = document.createElement('div');\nhost.appendChild(menu);\nhost.appendChild(result);\nreturn host;"},{"label":"Navbar with nested menus","expected":"Products opens on hover; Automation and Integrations open submenus","kind":"script","content":"const nav = await slice.build('Navbar', {\n  items: [\n    { text: 'Home', path: '/docs' },\n    {\n      text: 'Products',\n      items: [\n        { label: 'Analytics', icon: 'chart', description: 'Dashboards and reports' },\n        {\n          label: 'Automation', icon: 'rocket', items: [\n            { label: 'Workflows' },\n            { label: 'Integrations', items: [{ label: 'Slack' }, { label: 'GitHub' }, { label: 'Jira' }] }\n          ]\n        },\n        { label: 'Security', icon: 'shield-check' }\n      ]\n    },\n    { text: 'Docs', items: [{ label: 'Guides', path: '/docs' }, { label: 'API', path: '/docs/data/table' }] }\n  ]\n});\nnav.style.width = '100%';\nreturn nav;"}];
  }

  async init() {
    this.markdownPath = "dropdown.md";
    this.markdownContent = "---\ntitle: DropDown\nroute: /docs/navigation/dropdown\nnavLabel: DropDown\nsection: Navigation\ngroup: Core\norder: 32\ndescription: Menu button with links, actions, toggles and nested submenus, trigger variants, smart placement and full keyboard support.\ncomponent: DropDownDocumentation\ngenerate: true\ntags: [dropdown, menu, navigation, submenu, actions]\n---\n\n# DropDown\n\n## Overview\n`DropDown` is a menu button: a trigger and a menu of links, actions, checkboxes, radio options and **submenus nested as deep as you need**. You build the menu from plain objects, and the same vocabulary works at every level.\n\n## Core Behavior\n- `label` sets the trigger text and `items` the menu. `options` is the old name of `items` and still works.\n- The menu opens on click (or on hover with `trigger: 'hover'`). It closes when you pick an item, press Escape, click outside or tab away.\n- The menu is drawn in the browser's top layer, so a parent with `overflow: hidden` does not clip it and a transformed parent (a sliding mobile nav) does not move it.\n- It opens where `placement` says (`'bottom-end'` by default). If there is no room it flips to the other side, and it never leaves the screen.\n- `onSelect(item, ctx)` fires for every link, action or toggle picked, at any depth. `onOpenChange(open)` fires when the menu opens or closes.\n- `open()`, `close()` and `toggle()` drive it from code. `isOpen` tells you whether it is open.\n\n## Building the menu\nEvery entry in `items` (and in any submenu) is one of these:\n\n- `{ label, href }`: a link. It is a real `<a>`, so middle-click and \"open in new tab\" work. Use `target: '_blank'` for a new tab.\n- `{ label, path }`: a route, navigated through `slice.router`.\n- `{ label, onClick(ctx) }`: an action. An item with an action never navigates, even if it also has a `path`. `callback` is the old name of `onClick`.\n- `{ label, items: [...] }`: a submenu. Nest as deep as you like. `items` can also be a function, even an async one, to load the submenu when it opens; a loading row shows meanwhile.\n- `{ label, checked }`: a checkbox item. Picking it flips `checked` and keeps the menu open.\n- `{ type: 'radio', group, label, checked }`: a radio item. Only one per `group` is checked.\n- `'separator'`: a divider. Leading, trailing and doubled separators are removed.\n- `{ type: 'label', label }`: a small section heading.\n- `{ render(ctx) }`: anything you build, such as a search field or a slider. Keys typed in it belong to it, and Escape still closes the menu.\n\nAny item can also take `icon` (an `Icon` name or a node), `description` (a second, quieter line), `shortcut`, `badge`, `danger` (red, for destructive actions), `disabled`, `hidden` (`true` or a function of the item), `keepOpen` and `value`.\n\n`ctx` is `{ item, value, dropdown, event, close() }`. `close()` lets your custom content close the menu.\n\n## The trigger\n- `variant`: `'outlined'` (default), `'filled'`, `'soft'`, `'ghost'` or `'plain'`. `'plain'` is bare text in the colour around it, made for navigation bars.\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- `icon` puts an `Icon` before the label. With no `label` the trigger is a square icon button; give it `ariaLabel` so screen readers can name it.\n- `caret: false` hides the chevron. `disabled` turns the whole dropdown off.\n\n## Keyboard\n- On the trigger: **Enter**, **Space** or **↓** open the menu on the first item, **↑** on the last.\n- In the menu: **↑ ↓** move (disabled items are skipped), **Home / End** jump, and typing a letter jumps to the next item starting with it.\n- **→** or **Enter** opens a submenu. **←** or **Escape** closes one level and returns to the item that opened it. Escape on the first level returns to the trigger.\n- **Tab** closes everything.\n\n## Submenus on any screen\nSubmenus open beside their item and flip to the other side at the screen edge. With the mouse, hovering opens them after a short pause, so crossing an item on the way to a submenu does not shut it.\n\nWhen a submenu fits on neither side, as on a phone or several levels deep on a laptop, it **stacks**: it opens on top of its parent with a \"‹ Back\" row, like the drill-down menus of native apps. Hover never opens a stacked submenu; a tap or the keyboard does.\n\n## Live Preview\n:::component name=\"DropDown\"\n{\n  \"label\": \"Resources\",\n  \"items\": [\n    { \"label\": \"Docs\", \"href\": \"/docs\" },\n    { \"label\": \"Components\", \"items\": [\n      { \"label\": \"Button\", \"href\": \"/docs/input/button\" },\n      { \"label\": \"Table\", \"href\": \"/docs/data/table\" }\n    ] },\n    \"separator\",\n    { \"label\": \"GitHub\", \"href\": \"#\" }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"Nested menu with icons, toggles and a danger zone\" expected=\"a menu with sections; Settings opens a submenu, which opens another\"\nconst result = document.createElement('p');\nresult.textContent = 'Pick something.';\n\nconst menu = await slice.build('DropDown', {\n  label: 'Account',\n  icon: 'user',\n  variant: 'soft',\n  placement: 'bottom-start',\n  onSelect: (item) => { result.textContent = `Picked: ${item.label}`; },\n  items: [\n    { type: 'label', label: 'Signed in as José' },\n    { label: 'Profile', icon: 'user', shortcut: '⌘P' },\n    { label: 'Billing', icon: 'credit-card', description: 'Plans, invoices and payment', badge: 3 },\n    {\n      label: 'Settings', icon: 'cog', items: [\n        { label: 'General' },\n        {\n          label: 'Appearance', items: [\n            { type: 'radio', group: 'theme', label: 'Light', checked: true },\n            { type: 'radio', group: 'theme', label: 'Dark' },\n            'separator',\n            { label: 'Accent colour', items: [{ label: 'Purple' }, { label: 'Orange' }, { label: 'Teal' }] }\n          ]\n        },\n        { label: 'Email notifications', checked: true }\n      ]\n    },\n    'separator',\n    { label: 'Sign out', icon: 'arrow-right-to-bracket' },\n    { label: 'Delete account', icon: 'trash-bin', danger: true }\n  ]\n});\n\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(menu, result);\nreturn box;\n:::\n\n:::script label=\"Trigger variants and sizes\" expected=\"five trigger styles, three sizes and an icon-only button\"\nconst items = [{ label: 'Edit' }, { label: 'Duplicate' }, 'separator', { label: 'Delete', danger: true }];\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;align-items:center;width:100%';\nfor (const variant of ['outlined', 'filled', 'soft', 'ghost', 'plain']) {\n  row.appendChild(await slice.build('DropDown', { label: variant, variant, items }));\n}\nfor (const size of ['sm', 'md', 'lg']) {\n  row.appendChild(await slice.build('DropDown', { label: `Size ${size}`, size, items }));\n}\nrow.appendChild(await slice.build('DropDown', { icon: 'dots-vertical', ariaLabel: 'More actions', variant: 'ghost', items }));\nreturn row;\n:::\n\n:::script label=\"Submenu loaded on demand\" expected=\"Recent projects shows a loading row, then the list\"\nconst menu = await slice.build('DropDown', {\n  label: 'Open',\n  placement: 'bottom-start',\n  items: [\n    { label: 'New project', shortcut: '⌘N' },\n    {\n      label: 'Recent projects',\n      items: async () => {\n        await new Promise((resolve) => setTimeout(resolve, 600));\n        return ['Inventory', 'Website', 'Mobile app'].map((name) => ({ label: name, onClick: () => console.log('open', name) }));\n      }\n    }\n  ]\n});\nreturn menu;\n:::\n\n:::script label=\"Custom content inside the menu\" expected=\"a search box filters nothing yet, but you can type in it; Escape closes\"\nconst menu = await slice.build('DropDown', {\n  label: 'Jump to',\n  placement: 'bottom-start',\n  items: [\n    {\n      render: ({ close }) => {\n        const input = document.createElement('input');\n        input.type = 'search';\n        input.placeholder = 'Type a page and press Enter';\n        input.style.cssText = 'width:100%;box-sizing:border-box;padding:6px 8px';\n        input.addEventListener('keydown', (event) => {\n          if (event.key === 'Enter') close();\n        });\n        return input;\n      }\n    },\n    'separator',\n    { label: 'Dashboard', path: '/docs' },\n    { label: 'Settings', path: '/docs/input/switch' }\n  ]\n});\nreturn menu;\n:::\n\n:::script label=\"Action menu (legacy options)\" expected=\"picking an item runs the action and shows the result\"\nconst result = document.createElement('p');\nresult.textContent = 'No action yet';\n\nconst menu = await slice.build('DropDown', {\n  label: 'Export',\n  options: [\n    { text: 'Download JSON', callback: () => { result.textContent = 'Downloaded'; } },\n    { text: 'Print view', callback: () => { result.textContent = 'Print dialog opened'; } },\n    { text: 'Back to docs', path: '/docs' }\n  ]\n});\n\nconst host = document.createElement('div');\nhost.appendChild(menu);\nhost.appendChild(result);\nreturn host;\n:::\n\n## In a Navbar\nGive a `Navbar` item an `items` array and it becomes a dropdown: plain text in the bar, opening on hover (click and keyboard work too), with any submenus you nest. `type: 'dropdown'` with `options` keeps working. Per item you can override `variant`, `trigger`, `placement` and `icon`.\n\n:::script label=\"Navbar with nested menus\" expected=\"Products opens on hover; Automation and Integrations open submenus\"\nconst nav = await slice.build('Navbar', {\n  items: [\n    { text: 'Home', path: '/docs' },\n    {\n      text: 'Products',\n      items: [\n        { label: 'Analytics', icon: 'chart', description: 'Dashboards and reports' },\n        {\n          label: 'Automation', icon: 'rocket', items: [\n            { label: 'Workflows' },\n            { label: 'Integrations', items: [{ label: 'Slack' }, { label: 'GitHub' }, { label: 'Jira' }] }\n          ]\n        },\n        { label: 'Security', icon: 'shield-check' }\n      ]\n    },\n    { text: 'Docs', items: [{ label: 'Guides', path: '/docs' }, { label: 'API', path: '/docs/data/table' }] }\n  ]\n});\nnav.style.width = '100%';\nreturn nav;\n:::\n\n## Best Practices\n:::tip\nKeep menus shallow when you can: two or three levels read well. Go deeper for real hierarchies (a file tree, categories), not to hide options.\n:::\n\n:::tip\nUse `danger: true` for destructive actions and put them last, after a separator, so they are never the item a quick click lands on.\n:::\n\n## Pitfalls\n:::warning\nCheckbox and radio items keep their state on the item objects (`checked` is flipped in place). Rebuild the array from your own state if you need the menu to reflect changes made elsewhere, or pass `checked` as a function.\n:::\n\n:::warning\nAn icon-only trigger has no visible text, so give it `ariaLabel`; otherwise screen readers announce an unnamed button.\n:::\n\n## Language\n\nThe built-in texts are `slice.dropDown.*` keys with English and Spanish defaults, registered by\n`shared/text/texts.js` in the translator's lowest layer: an app dictionary always wins, and the\ncomponent keeps its English text when the translator is off.\nThe text prop `texts` still wins over the dictionary.\nKeys: `noOptions`, `loading`, `backToPrevious`, `backToMenu`.\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Resources\",\n  \"items\": [\n    { \"label\": \"Docs\", \"href\": \"/docs\" },\n    { \"label\": \"Components\", \"items\": [\n      { \"label\": \"Button\", \"href\": \"/docs/input/button\" },\n      { \"label\": \"Table\", \"href\": \"/docs/data/table\" }\n    ] },\n    \"separator\",\n    { \"label\": \"GitHub\", \"href\": \"#\" }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Resources\",\n  \"items\": [\n    { \"label\": \"Docs\", \"href\": \"/docs\" },\n    { \"label\": \"Components\", \"items\": [\n      { \"label\": \"Button\", \"href\": \"/docs/input/button\" },\n      { \"label\": \"Table\", \"href\": \"/docs/data/table\" }\n    ] },\n    \"separator\",\n    { \"label\": \"GitHub\", \"href\": \"#\" }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('DropDown', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[\"outlined\",\"filled\",\"soft\",\"ghost\",\"plain\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"caret\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"trigger\",\"type\":\"string\",\"required\":false,\"default\":\"click\",\"allowedValues\":[\"click\",\"hover\"]},{\"path\":\"placement\",\"type\":\"string\",\"required\":false,\"default\":\"bottom-end\",\"allowedValues\":[\"bottom-start\",\"bottom-end\",\"top-start\",\"top-end\"]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"closeOnSelect\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"onSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onOpenChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[\"outlined\",\"filled\",\"soft\",\"ghost\",\"plain\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"caret\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"trigger\",\"type\":\"string\",\"required\":false,\"default\":\"click\",\"allowedValues\":[\"click\",\"hover\"]},{\"path\":\"placement\",\"type\":\"string\",\"required\":false,\"default\":\"bottom-end\",\"allowedValues\":[\"bottom-start\",\"bottom-end\",\"top-start\",\"top-end\"]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"closeOnSelect\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]},{\"path\":\"onSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onOpenChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-dropdowndocumentation', DropDownDocumentation);
