export default class BottomNavDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Variants and indicators","expected":"a filled capsule with a pill, a surface one with a line, and a glass one showing only the current label","kind":"script","content":"const items = [\n  { text: 'Home', path: '/docs', icon: 'home' },\n  { text: 'Search', path: '/search', icon: 'search' },\n  { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 3 },\n  { text: 'Profile', path: '/profile', icon: 'user', badge: true }\n];\nconst stage = document.createElement('div');\nstage.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%;padding:16px 0';\nfor (const extra of [{ variant: 'filled' }, { variant: 'surface', indicator: 'line' }, { variant: 'glass', labels: 'active' }]) {\n  const nav = await slice.build('BottomNav', { items, position: 'static', layout: 'floating', ...extra });\n  nav.setActivePath('/search');\n  stage.appendChild(nav);\n}\nreturn stage;"},{"label":"Raised centre action","expected":"a round + in the middle of the tabs","kind":"script","content":"const result = document.createElement('p');\nresult.style.textAlign = 'center';\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  layout: 'floating',\n  labels: 'none',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Search', path: '/search', icon: 'search' },\n    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 12 },\n    { text: 'Profile', path: '/profile', icon: 'user' }\n  ],\n  fab: { icon: 'plus', label: 'New post', onClick: () => { result.textContent = 'Compose a new post'; } }\n});\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(nav, result);\nreturn box;"},{"label":"Docked, as on a phone","expected":"a full-width bar on its bottom edge, with the centre action rising out of it","kind":"script","content":"const frame = document.createElement('div');\nframe.style.cssText = 'width:100%;max-width:390px;margin:0 auto;border:1px solid var(--slice-border-raised, #ddd);border-radius:24px;overflow:hidden;padding-top:120px;background:var(--secondary-background-color)';\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  layout: 'docked',\n  variant: 'surface',\n  indicator: 'line',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Search', path: '/search', icon: 'search' },\n    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 2 },\n    { text: 'Me', path: '/me', icon: 'user' }\n  ],\n  fab: { icon: 'plus', label: 'New' }\n});\nnav.setActivePath('/docs');\nframe.appendChild(nav);\nreturn frame;"},{"label":"Live badges","expected":"the Inbox badge counts up every second; Clear removes it","kind":"script","content":"const nav = await slice.build('BottomNav', {\n  position: 'static',\n  layout: 'floating',\n  variant: 'surface',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 1 }\n  ]\n});\nlet count = 1;\nconst timer = setInterval(() => {\n  if (!nav.isConnected) return clearInterval(timer);\n  count += 1;\n  nav.setBadge('/inbox', count);\n}, 1000);\nconst clear = await slice.build('Button', {\n  value: 'Clear',\n  variant: 'outlined',\n  size: 'sm',\n  onClick: () => { count = 0; nav.setBadge('/inbox', null); }\n});\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;width:100%';\nbox.append(nav, clear);\nreturn box;"},{"label":"Brand, tabs and actions","expected":"a brand, centred tabs and a Sign in button","kind":"script","content":"const nav = await slice.build('BottomNav', {\n  position: 'static',\n  layout: 'floating',\n  brand: { text: 'Acme', path: '/docs' },\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Guides', path: '/guides', icon: 'book' },\n    { text: 'More', items: [{ label: 'Changelog' }, { label: 'Roadmap' }] }\n  ],\n  buttons: [{ value: 'Sign in' }]\n});\nreturn nav;"}];
  }

  async init() {
    this.markdownPath = "bottom-nav.md";
    this.markdownContent = "---\ntitle: BottomNav\nroute: /docs/navigation/bottom-nav\nnavLabel: BottomNav\nsection: Navigation\ngroup: Core\norder: 33\ndescription: App-style bottom tab bar with variants, badges, a raised centre action, label modes, docking on phones and hide-on-scroll.\ncomponent: BottomNavDocumentation\ngenerate: true\ntags: [bottomnav, navigation, tabs, mobile, badge]\n---\n\n# BottomNav\n\n## Overview\n`BottomNav` is an app-style tab bar. On wide screens it floats as a capsule; on phones it docks to the bottom edge, leaving room for the home indicator. It shares `Navbar`'s API (`logo`, `items`, `buttons`, `position`, `direction`), so the two are interchangeable, and adds what a bottom bar needs: badges, a raised centre action, label modes and hiding while you scroll.\n\n## Core Behavior\n- `items` are the tabs:\n  - `{ text, path }` is a route tab, navigated through `slice.router`.\n  - `{ text, href }` is a plain link.\n  - `{ text, items: [...] }` is a [DropDown](/docs/navigation/dropdown) tab, and its menu opens upwards. `type: 'dropdown'` with `options` is the older form and still works.\n- Any tab can also take:\n  - `icon`, any `Icon` name, shown above the label.\n  - `badge`, a number (over 99 shows \"99+\"), some text, or `true` for a dot.\n  - `exact`, `hidden`, and `onClick(item, event)`.\n- Each tab is a real link. It works with the keyboard (**← →** move between tabs, **Home / End** jump to the ends), with middle-click and with screen readers. The current tab carries `aria-current=\"page\"`.\n- The current tab follows the URL: an exact match wins, otherwise the longest matching prefix. It keeps up with `slice.router` navigations and back / forward. `setActivePath(path)` sets it by hand, and `onChange(item)` tells you when a click changed it.\n- `setBadge(pathOrIndex, value)` updates a badge without rebuilding the bar; `null` removes it.\n- `brand` (`{ logo, text, path }`) or the older `logo` adds a brand on the start side. It is hidden when the bar is docked.\n- `buttons` add actions on the end side, drawn as the bar's own round pills (not `Button`): `{ value, icon, onClick, path }`. The emphasised one is filled; `variant: 'ghost'` gives a quiet one, and an icon without text makes a round icon button (name it with `ariaLabel`). `actions` takes the same configs or any node of your own. The tabs stay optically centred between the brand and the actions.\n- Every prop is reactive.\n\n## Looks and layout\n- `variant`:\n  - `'filled'` (default): the primary-colour capsule, with labels that pass AA contrast. Same name as in `Button`; `'solid'` also works.\n  - `'surface'`: the page colour with a fine border.\n  - `'glass'`: translucent and blurred.\n- `layout`:\n  - `'auto'` (default): floats on wide screens and docks at `breakpoint` (600px) and below.\n  - `'floating'` or `'docked'` force one look everywhere.\n- `labels`:\n  - `'always'` (default).\n  - `'active'`: only the current tab shows its name.\n  - `'none'`: icons only, but each label still names its link for screen readers.\n- `indicator` marks the current tab: `'pill'` (default, a pill that slides), `'line'` (an accent bar; on top of the tab when docked) or `'none'`.\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- `fab` adds a round centre action in the middle of the tabs: `{ icon, label, onClick, path }`. When the bar is docked it rises out of the bar.\n\n## Position and scrolling\n- `position`: `'fixed'` (default, pinned to the bottom), `'sticky'` or `'static'`. As before, any other value means `'static'`.\n- `spacer: true` makes a fixed bar keep its height at the bottom of the page, so it covers nothing. It is off by default, because pages built for it already add a `padding-bottom`.\n- `hideOnScroll` slides the bar away while you scroll down and brings it back as soon as you scroll up.\n- `direction: 'reverse'` mirrors the bar and the order of the tabs.\n\n## Live Preview\n:::component name=\"BottomNav\"\n{\n  \"position\": \"static\",\n  \"items\": [\n    { \"text\": \"Home\", \"path\": \"/\", \"icon\": \"home\" },\n    { \"text\": \"Docs\", \"path\": \"/docs\", \"icon\": \"book\" },\n    { \"text\": \"Inbox\", \"path\": \"/inbox\", \"icon\": \"inbox\", \"badge\": 4 },\n    { \"text\": \"Profile\", \"path\": \"/profile\", \"icon\": \"user\" }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"Variants and indicators\" expected=\"a filled capsule with a pill, a surface one with a line, and a glass one showing only the current label\"\nconst items = [\n  { text: 'Home', path: '/docs', icon: 'home' },\n  { text: 'Search', path: '/search', icon: 'search' },\n  { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 3 },\n  { text: 'Profile', path: '/profile', icon: 'user', badge: true }\n];\nconst stage = document.createElement('div');\nstage.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%;padding:16px 0';\nfor (const extra of [{ variant: 'filled' }, { variant: 'surface', indicator: 'line' }, { variant: 'glass', labels: 'active' }]) {\n  const nav = await slice.build('BottomNav', { items, position: 'static', layout: 'floating', ...extra });\n  nav.setActivePath('/search');\n  stage.appendChild(nav);\n}\nreturn stage;\n:::\n\n:::script label=\"Raised centre action\" expected=\"a round + in the middle of the tabs\"\nconst result = document.createElement('p');\nresult.style.textAlign = 'center';\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  layout: 'floating',\n  labels: 'none',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Search', path: '/search', icon: 'search' },\n    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 12 },\n    { text: 'Profile', path: '/profile', icon: 'user' }\n  ],\n  fab: { icon: 'plus', label: 'New post', onClick: () => { result.textContent = 'Compose a new post'; } }\n});\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(nav, result);\nreturn box;\n:::\n\n:::script label=\"Docked, as on a phone\" expected=\"a full-width bar on its bottom edge, with the centre action rising out of it\"\nconst frame = document.createElement('div');\nframe.style.cssText = 'width:100%;max-width:390px;margin:0 auto;border:1px solid var(--slice-border-raised, #ddd);border-radius:24px;overflow:hidden;padding-top:120px;background:var(--secondary-background-color)';\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  layout: 'docked',\n  variant: 'surface',\n  indicator: 'line',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Search', path: '/search', icon: 'search' },\n    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 2 },\n    { text: 'Me', path: '/me', icon: 'user' }\n  ],\n  fab: { icon: 'plus', label: 'New' }\n});\nnav.setActivePath('/docs');\nframe.appendChild(nav);\nreturn frame;\n:::\n\n:::script label=\"Live badges\" expected=\"the Inbox badge counts up every second; Clear removes it\"\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  layout: 'floating',\n  variant: 'surface',\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Inbox', path: '/inbox', icon: 'inbox', badge: 1 }\n  ]\n});\nlet count = 1;\nconst timer = setInterval(() => {\n  if (!nav.isConnected) return clearInterval(timer);\n  count += 1;\n  nav.setBadge('/inbox', count);\n}, 1000);\nconst clear = await slice.build('Button', {\n  value: 'Clear',\n  variant: 'outlined',\n  size: 'sm',\n  onClick: () => { count = 0; nav.setBadge('/inbox', null); }\n});\nconst box = document.createElement('div');\nbox.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;width:100%';\nbox.append(nav, clear);\nreturn box;\n:::\n\n:::script label=\"Brand, tabs and actions\" expected=\"a brand, centred tabs and a Sign in button\"\nconst nav = await slice.build('BottomNav', {\n  position: 'static',\n  layout: 'floating',\n  brand: { text: 'Acme', path: '/docs' },\n  items: [\n    { text: 'Home', path: '/docs', icon: 'home' },\n    { text: 'Guides', path: '/guides', icon: 'book' },\n    { text: 'More', items: [{ label: 'Changelog' }, { label: 'Roadmap' }] }\n  ],\n  buttons: [{ value: 'Sign in' }]\n});\nreturn nav;\n:::\n\n## Best Practices\n:::tip\nKeep three to five tabs. A bottom bar is reached with a thumb; more tabs than that make each target too small, so move the rest to a \"More\" dropdown tab.\n:::\n\n:::tip\nUse `badge: true` (a dot) for \"something new\" and numbers only when the count matters. A bar full of numbers stops meaning anything.\n:::\n\n## Pitfalls\n:::warning\nA fixed bar covers the bottom of the page. Either add a `padding-bottom` to your content or pass `spacer: true`, but not both.\n:::\n\n:::warning\nWith `labels: 'none'` give every tab an `icon`. A tab without one keeps showing its label (it would have nothing else to show), so the bar looks uneven.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"position\": \"static\",\n  \"items\": [\n    { \"text\": \"Home\", \"path\": \"/\", \"icon\": \"home\" },\n    { \"text\": \"Docs\", \"path\": \"/docs\", \"icon\": \"book\" },\n    { \"text\": \"Inbox\", \"path\": \"/inbox\", \"icon\": \"inbox\", \"badge\": 4 },\n    { \"text\": \"Profile\", \"path\": \"/profile\", \"icon\": \"user\" }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"position\": \"static\",\n  \"items\": [\n    { \"text\": \"Home\", \"path\": \"/\", \"icon\": \"home\" },\n    { \"text\": \"Docs\", \"path\": \"/docs\", \"icon\": \"book\" },\n    { \"text\": \"Inbox\", \"path\": \"/inbox\", \"icon\": \"inbox\", \"badge\": 4 },\n    { \"text\": \"Profile\", \"path\": \"/profile\", \"icon\": \"user\" }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('BottomNav', props);
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

customElements.define('slice-bottomnavdocumentation', BottomNavDocumentation);
