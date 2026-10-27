export default class NavbarDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"The five variants","expected":"filled, surface, glass, transparent and floating bars, each marking Docs as the current page","kind":"script","content":"const stage = document.createElement('div');\nstage.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;padding:16px 0;background:linear-gradient(135deg,color-mix(in srgb,var(--primary-color) 14%,transparent),transparent)';\nconst items = [\n  { text: 'Home', path: '/' },\n  { text: 'Docs', path: '/docs' },\n  { text: 'Products', items: [{ label: 'Table', path: '/docs/data/table' }, { label: 'DropDown', path: '/docs/navigation/dropdown' }] },\n  { text: 'Blog', href: '#' }\n];\nconst looks = [['filled', 'underline'], ['surface', 'underline'], ['glass', 'pill'], ['transparent', 'pill'], ['floating', 'pill']];\nfor (const [variant, indicator] of looks) {\n  const nav = await slice.build('Navbar', {\n    variant,\n    indicator,\n    brand: { text: variant },\n    items,\n    buttons: [{ value: 'Sign in' }]\n  });\n  nav.style.width = '100%';\n  nav.setActivePath('/docs');\n  stage.appendChild(nav);\n}\nreturn stage;"},{"label":"Product site: nested menus and actions","expected":"Products opens on hover with submenus; Sign up on the right","kind":"script","content":"const nav = await slice.build('Navbar', {\n  variant: 'surface',\n  align: 'start',\n  brand: { logo: '/images/Slice.js-logo.png', text: 'Slice.js', path: '/' },\n  items: [\n    {\n      text: 'Products',\n      items: [\n        { label: 'Analytics', icon: 'chart', description: 'Dashboards and reports' },\n        {\n          label: 'Automation', icon: 'rocket', items: [\n            { label: 'Workflows' },\n            { label: 'Integrations', items: [{ label: 'Slack' }, { label: 'GitHub' }] }\n          ]\n        }\n      ]\n    },\n    { text: 'Docs', path: '/docs' },\n    { text: 'Pricing', path: '/pricing' }\n  ],\n  buttons: [{ value: 'Log in', variant: 'ghost' }, { value: 'Sign up' }]\n});\nnav.style.width = '100%';\nreturn nav;"},{"label":"Your own actions: a theme toggle and an avatar menu","expected":"a theme switch and an icon-only DropDown on the right","kind":"script","content":"const avatar = await slice.build('DropDown', {\n  icon: 'user-circle',\n  ariaLabel: 'Account',\n  variant: 'ghost',\n  items: [\n    { type: 'label', label: 'Signed in as Ana' },\n    { label: 'Profile', icon: 'user' },\n    { label: 'Settings', icon: 'cog' },\n    'separator',\n    { label: 'Sign out', danger: true }\n  ]\n});\nconst theme = await slice.build('Button', {\n  value: 'Theme',\n  variant: 'soft',\n  size: 'sm',\n  onClick: () => slice.setTheme(slice.stylesManager.themeManager.currentTheme === 'LIGHT' ? 'DARK' : 'LIGHT')\n});\nconst nav = await slice.build('Navbar', {\n  variant: 'glass',\n  align: 'end',\n  indicator: 'pill',\n  brand: { text: 'Dashboard' },\n  items: [\n    { text: 'Overview', path: '/docs' },\n    { text: 'Users', path: '/docs/input/select' },\n    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }\n  ],\n  actions: [theme, avatar]\n});\nnav.style.width = '100%';\nreturn nav;"},{"label":"Mobile menu modes","expected":"three narrow bars; tap a hamburger to open a drawer, a full screen or a sheet","kind":"script","content":"const row = document.createElement('div');\nrow.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px;width:100%';\nfor (const mobileMenu of ['drawer', 'fullscreen', 'sheet']) {\n  const frame = document.createElement('div');\n  frame.style.cssText = 'flex:1 1 220px;min-width:0';\n  const nav = await slice.build('Navbar', {\n    variant: 'surface',\n    mobileMenu,\n    // A huge breakpoint keeps this demo in mobile mode on any screen.\n    breakpoint: 100000,\n    brand: { text: mobileMenu },\n    items: [\n      { text: 'Home', path: '/' },\n      { text: 'Docs', path: '/docs' },\n      { text: 'More', items: [{ label: 'Blog' }, { label: 'Changelog' }] }\n    ],\n    buttons: [{ value: 'Sign in' }]\n  });\n  nav.style.width = '100%';\n  frame.appendChild(nav);\n  row.appendChild(frame);\n}\nreturn row;"},{"label":"Sticky bar that hides on scroll","expected":"the bar sticks to the top of the page and hides while you scroll down","kind":"script","content":"const nav = await slice.build('Navbar', {\n  variant: 'glass',\n  position: 'sticky',\n  hideOnScroll: true,\n  brand: { text: 'Scroll me' },\n  items: [{ text: 'Home', path: '/' }, { text: 'Docs', path: '/docs' }]\n});\nnav.style.width = '100%';\nreturn nav;"}];
  }

  async init() {
    this.markdownPath = "navbar.md";
    this.markdownContent = "---\ntitle: Navbar\nroute: /docs/navigation/navbar\nnavLabel: Navbar\nsection: Navigation\ngroup: Core\norder: 30\ndescription: Top navigation bar with five variants, nested dropdowns, the current page marked, sticky or fixed positioning and a real mobile menu.\ncomponent: NavbarDocumentation\ngenerate: true\ntags: [navbar, navigation, header, menu, mobile]\n---\n\n# Navbar\n\n## Overview\n`Navbar` is the top navigation bar. It has a brand, links (dropdowns with submenus included) and actions, comes in five looks, marks the page you are on, and below a breakpoint turns into a mobile menu that behaves like one: a drawer, a full screen or a sheet.\n\n## Core Behavior\n- `brand` is `{ logo, text, path, alt }`: an image, a name, or both. `logo` (`{ src, path }`) is the older form and still works.\n- `items` are the links:\n  - `{ text, path }` is a route link, navigated through `slice.router`.\n  - `{ text, href, target }` is a plain or external link.\n  - `{ text, items: [...] }` is a `DropDown` with submenus as deep as you like. The bar shows it as plain text that opens on hover; click and keyboard work too. See [DropDown](/docs/navigation/dropdown) for what its items can be. `type: 'dropdown'` with `options` is the older form and still works.\n  - Any item can also take `icon`, `exact` (see below) or `hidden`.\n- `buttons` are Button configs (`{ value, onClick, icon, variant, color }`). `actions` takes the same configs or any node: a ThemeSwitcher, a search box, an avatar `DropDown`. They render in the order you give them.\n- Every prop is reactive: set `items`, `buttons`, `variant` or anything else at any time and the bar updates.\n\n## Looks\n- `variant`:\n  - `'filled'` (default): the primary colour, the original look. Same name as in `Button`; `'solid'` also works.\n  - `'surface'`: the page colour with a fine bottom border.\n  - `'glass'`: translucent, blurring what scrolls under it.\n  - `'transparent'`: no fill, for use over a hero; it turns into `surface` once the page scrolls.\n  - `'floating'`: a detached pill with a shadow.\n- `size`: `'sm'` (52px), `'md'` (64px, default) or `'lg'` (76px). To use another height, set the `--nav-height` CSS property on the element.\n- `align`: where the links sit, `'start'`, `'center'` (default) or `'end'`.\n- `indicator` marks the current page:\n  - `'underline'` (default): a bar that slides under the link.\n  - `'pill'`: a soft background that slides behind the link.\n  - `'none'`: colour only.\n\n## The current page\nThe link whose `path` matches the URL gets `aria-current=\"page\"` and the indicator.\n- An exact match wins. Otherwise the longest matching prefix wins, so `/docs/table` keeps \"Docs\" marked.\n- `'/'` only matches itself, and an item with `exact: true` only matches its own path.\n- A dropdown counts as current when any page inside it does, at any depth.\n- The bar follows `slice.router` navigations and the browser's back and forward buttons. `setActivePath(path)` sets it by hand; `setActivePath(null)` goes back to following the URL.\n\n## Position and scrolling\n- `position`:\n  - `'static'` (default): part of the page.\n  - `'sticky'`: sticks to the top while its parent scrolls.\n  - `'fixed'`: pinned to the viewport. With `spacer: true` the bar also keeps its height in the page, so it covers nothing. That is off by default, because pages built for the old fixed bar already leave room for it.\n- `hideOnScroll`: the bar slides away while you scroll down and comes back as soon as you scroll up.\n- Once the page scrolls, every variant gets the `nav_bar--scrolled` class: `surface` and `glass` gain a soft shadow, and `transparent` gains a fill.\n- `direction: 'reverse'` mirrors the bar.\n\n## Mobile\nAt `breakpoint` (768px by default) and below, the links and actions move behind a hamburger button that turns into an ✕.\n- `mobileMenu`:\n  - `'drawer'` (default): a panel from the side.\n  - `'fullscreen'`: the whole screen.\n  - `'sheet'`: a panel hanging under the bar, which stays visible.\n- While the menu is open:\n  - Focus stays inside it.\n  - **Escape**, the ✕, a tap on the dimmed area or following a link closes it, and focus returns to the hamburger.\n  - The page behind it does not scroll.\n- The menu closes on its own when the window grows past the breakpoint.\n- Dropdowns inside it stack their submenus with a \"‹ Back\" row.\n- `openMenu()`, `closeMenu()`, `toggleMenu()` and `isMenuOpen` drive it from code. `onMenuToggle(open)` tells you when it opens or closes.\n\n## Live Preview\n:::component name=\"Navbar\"\n{\n  \"variant\": \"surface\",\n  \"brand\": { \"text\": \"Northwind\", \"path\": \"/\" },\n  \"items\": [\n    { \"text\": \"Home\", \"path\": \"/\" },\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\n    { \"text\": \"Components\", \"path\": \"/docs/input/button\" }\n  ],\n  \"buttons\": [{ \"value\": \"Sign in\" }]\n}\n:::\n\n## Practical Setups\n:::script label=\"The five variants\" expected=\"filled, surface, glass, transparent and floating bars, each marking Docs as the current page\"\nconst stage = document.createElement('div');\nstage.style.cssText = 'display:flex;flex-direction:column;gap:16px;width:100%;padding:16px 0;background:linear-gradient(135deg,color-mix(in srgb,var(--primary-color) 14%,transparent),transparent)';\nconst items = [\n  { text: 'Home', path: '/' },\n  { text: 'Docs', path: '/docs' },\n  { text: 'Products', items: [{ label: 'Table', path: '/docs/data/table' }, { label: 'DropDown', path: '/docs/navigation/dropdown' }] },\n  { text: 'Blog', href: '#' }\n];\nconst looks = [['filled', 'underline'], ['surface', 'underline'], ['glass', 'pill'], ['transparent', 'pill'], ['floating', 'pill']];\nfor (const [variant, indicator] of looks) {\n  const nav = await slice.build('Navbar', {\n    variant,\n    indicator,\n    brand: { text: variant },\n    items,\n    buttons: [{ value: 'Sign in' }]\n  });\n  nav.style.width = '100%';\n  nav.setActivePath('/docs');\n  stage.appendChild(nav);\n}\nreturn stage;\n:::\n\n:::script label=\"Product site: nested menus and actions\" expected=\"Products opens on hover with submenus; Sign up on the right\"\nconst nav = await slice.build('Navbar', {\n  variant: 'surface',\n  align: 'start',\n  brand: { logo: '/images/Slice.js-logo.png', text: 'Slice.js', path: '/' },\n  items: [\n    {\n      text: 'Products',\n      items: [\n        { label: 'Analytics', icon: 'chart', description: 'Dashboards and reports' },\n        {\n          label: 'Automation', icon: 'rocket', items: [\n            { label: 'Workflows' },\n            { label: 'Integrations', items: [{ label: 'Slack' }, { label: 'GitHub' }] }\n          ]\n        }\n      ]\n    },\n    { text: 'Docs', path: '/docs' },\n    { text: 'Pricing', path: '/pricing' }\n  ],\n  buttons: [{ value: 'Log in', variant: 'ghost' }, { value: 'Sign up' }]\n});\nnav.style.width = '100%';\nreturn nav;\n:::\n\n:::script label=\"Your own actions: a theme toggle and an avatar menu\" expected=\"a theme switch and an icon-only DropDown on the right\"\nconst avatar = await slice.build('DropDown', {\n  icon: 'user-circle',\n  ariaLabel: 'Account',\n  variant: 'ghost',\n  items: [\n    { type: 'label', label: 'Signed in as Ana' },\n    { label: 'Profile', icon: 'user' },\n    { label: 'Settings', icon: 'cog' },\n    'separator',\n    { label: 'Sign out', danger: true }\n  ]\n});\nconst theme = await slice.build('Button', {\n  value: 'Theme',\n  variant: 'soft',\n  size: 'sm',\n  onClick: () => slice.setTheme(slice.stylesManager.themeManager.currentTheme === 'LIGHT' ? 'DARK' : 'LIGHT')\n});\nconst nav = await slice.build('Navbar', {\n  variant: 'glass',\n  align: 'end',\n  indicator: 'pill',\n  brand: { text: 'Dashboard' },\n  items: [\n    { text: 'Overview', path: '/docs' },\n    { text: 'Users', path: '/docs/input/select' },\n    { text: 'Logs', path: '/docs/internal/markdown-parser-rules' }\n  ],\n  actions: [theme, avatar]\n});\nnav.style.width = '100%';\nreturn nav;\n:::\n\n:::script label=\"Mobile menu modes\" expected=\"three narrow bars; tap a hamburger to open a drawer, a full screen or a sheet\"\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;flex-wrap:wrap;gap:16px;width:100%';\nfor (const mobileMenu of ['drawer', 'fullscreen', 'sheet']) {\n  const frame = document.createElement('div');\n  frame.style.cssText = 'flex:1 1 220px;min-width:0';\n  const nav = await slice.build('Navbar', {\n    variant: 'surface',\n    mobileMenu,\n    // A huge breakpoint keeps this demo in mobile mode on any screen.\n    breakpoint: 100000,\n    brand: { text: mobileMenu },\n    items: [\n      { text: 'Home', path: '/' },\n      { text: 'Docs', path: '/docs' },\n      { text: 'More', items: [{ label: 'Blog' }, { label: 'Changelog' }] }\n    ],\n    buttons: [{ value: 'Sign in' }]\n  });\n  nav.style.width = '100%';\n  frame.appendChild(nav);\n  row.appendChild(frame);\n}\nreturn row;\n:::\n\n:::script label=\"Sticky bar that hides on scroll\" expected=\"the bar sticks to the top of the page and hides while you scroll down\"\nconst nav = await slice.build('Navbar', {\n  variant: 'glass',\n  position: 'sticky',\n  hideOnScroll: true,\n  brand: { text: 'Scroll me' },\n  items: [{ text: 'Home', path: '/' }, { text: 'Docs', path: '/docs' }]\n});\nnav.style.width = '100%';\nreturn nav;\n:::\n\n## Best Practices\n:::tip\nKeep the bar to five or six top-level links and move the rest into dropdowns. The bar is the first thing people read, so short and scannable wins.\n:::\n\n:::tip\nUse `exact: true` on a link whose path is a prefix of other links' paths (an \"Overview\" at `/docs` next to \"API\" at `/docs/api`), so only one of them is marked as current.\n:::\n\n## Pitfalls\n:::warning\n`position: 'fixed'` takes the bar out of the page. Either leave room for it yourself (a `padding-top` on your content) or pass `spacer: true`, but not both.\n:::\n\n:::warning\n`hideOnScroll` and the scrolled state listen to the window's scroll. A bar inside a scrolling panel (not the page) will not see that panel scroll.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"variant\": \"surface\",\n  \"brand\": { \"text\": \"Northwind\", \"path\": \"/\" },\n  \"items\": [\n    { \"text\": \"Home\", \"path\": \"/\" },\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\n    { \"text\": \"Components\", \"path\": \"/docs/input/button\" }\n  ],\n  \"buttons\": [{ \"value\": \"Sign in\" }]\n}") {
               try {
                  props = JSON.parse("{\n  \"variant\": \"surface\",\n  \"brand\": { \"text\": \"Northwind\", \"path\": \"/\" },\n  \"items\": [\n    { \"text\": \"Home\", \"path\": \"/\" },\n    { \"text\": \"Docs\", \"path\": \"/docs\" },\n    { \"text\": \"Components\", \"path\": \"/docs/input/button\" }\n  ],\n  \"buttons\": [{ \"value\": \"Sign in\" }]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Navbar', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"logo\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"brand\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttons\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[\"filled\",\"surface\",\"glass\",\"transparent\",\"floating\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"position\",\"type\":\"string\",\"required\":false,\"default\":\"static\",\"allowedValues\":[\"static\",\"sticky\",\"fixed\"]},{\"path\":\"spacer\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"hideOnScroll\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"align\",\"type\":\"string\",\"required\":false,\"default\":\"center\",\"allowedValues\":[\"start\",\"center\",\"end\"]},{\"path\":\"indicator\",\"type\":\"string\",\"required\":false,\"default\":\"underline\",\"allowedValues\":[\"underline\",\"pill\",\"none\"]},{\"path\":\"direction\",\"type\":\"string\",\"required\":false,\"default\":\"normal\",\"allowedValues\":[\"normal\",\"reverse\"]},{\"path\":\"mobileMenu\",\"type\":\"string\",\"required\":false,\"default\":\"drawer\",\"allowedValues\":[\"drawer\",\"fullscreen\",\"sheet\"]},{\"path\":\"breakpoint\",\"type\":\"number\",\"required\":false,\"default\":\"768\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"Main\",\"allowedValues\":[]},{\"path\":\"onMenuToggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"logo\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"brand\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"buttons\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"filled\",\"allowedValues\":[\"filled\",\"surface\",\"glass\",\"transparent\",\"floating\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"position\",\"type\":\"string\",\"required\":false,\"default\":\"static\",\"allowedValues\":[\"static\",\"sticky\",\"fixed\"]},{\"path\":\"spacer\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"hideOnScroll\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"align\",\"type\":\"string\",\"required\":false,\"default\":\"center\",\"allowedValues\":[\"start\",\"center\",\"end\"]},{\"path\":\"indicator\",\"type\":\"string\",\"required\":false,\"default\":\"underline\",\"allowedValues\":[\"underline\",\"pill\",\"none\"]},{\"path\":\"direction\",\"type\":\"string\",\"required\":false,\"default\":\"normal\",\"allowedValues\":[\"normal\",\"reverse\"]},{\"path\":\"mobileMenu\",\"type\":\"string\",\"required\":false,\"default\":\"drawer\",\"allowedValues\":[\"drawer\",\"fullscreen\",\"sheet\"]},{\"path\":\"breakpoint\",\"type\":\"number\",\"required\":false,\"default\":\"768\",\"allowedValues\":[]},{\"path\":\"ariaLabel\",\"type\":\"string\",\"required\":false,\"default\":\"Main\",\"allowedValues\":[]},{\"path\":\"onMenuToggle\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"DropDown","path":"/docs/navigation/dropdown"}];
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

customElements.define('slice-navbardocumentation', NavbarDocumentation);
