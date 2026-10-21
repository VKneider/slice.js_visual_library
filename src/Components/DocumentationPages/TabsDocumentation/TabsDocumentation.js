export default class TabsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"basic tabs navigation","expected":"renders tabs and switches visible panel content","kind":"script","content":"const overview = document.createElement('div');\r\noverview.textContent = 'This is the overview panel.';\r\n\r\nconst usage = document.createElement('div');\r\nusage.textContent = 'Usage instructions go here.';\r\n\r\nconst history = document.createElement('div');\r\nhistory.textContent = 'Changelog and version history.';\r\n\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'overview', label: 'Overview', panel: overview },\r\n    { id: 'usage', label: 'Usage', panel: usage },\r\n    { id: 'history', label: 'History', panel: history }\r\n  ],\r\n  activeTab: 'overview'\r\n});\r\nreturn tabs;"},{"label":"controlled active tab","expected":"external controls drive selected tab","kind":"script","content":"let active = 'profile';\r\n\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'profile', label: 'Profile' },\r\n    { id: 'security', label: 'Security' },\r\n    { id: 'billing', label: 'Billing' }\r\n  ],\r\n  activeTab: active,\r\n  onChange: (tabId) => {\r\n    active = tabId;\r\n    tabs.activeTab = active;\r\n    panel.textContent = `Current panel: ${active}`;\r\n  }\r\n});\r\n\r\nconst panel = document.createElement('div');\r\npanel.textContent = `Current panel: ${active}`;\r\n\r\nconst jumpToBilling = await slice.build('Button', {\r\n  value: 'Go to Billing',\r\n  onClick: () => {\r\n    active = 'billing';\r\n    tabs.activeTab = active;\r\n    panel.textContent = `Current panel: ${active}`;\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tabs);\r\nhost.appendChild(jumpToBilling);\r\nhost.appendChild(panel);\r\nreturn host;"},{"label":"tabs with route-state integration","expected":"tab changes update route query state","kind":"script","content":"const mockRouteState = { section: 'summary' };\r\n\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'summary', label: 'Summary' },\r\n    { id: 'errors', label: 'Errors' },\r\n    { id: 'activity', label: 'Activity' }\r\n  ],\r\n  activeTab: mockRouteState.section,\r\n  onChange: (tabId) => {\r\n    mockRouteState.section = tabId;\r\n    status.textContent = `Route query ?section=${mockRouteState.section}`;\r\n  }\r\n});\r\n\r\nconst status = document.createElement('p');\r\nstatus.textContent = `Route query ?section=${mockRouteState.section}`;\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tabs);\r\nhost.appendChild(status);\r\nreturn host;"},{"label":"lazy panel rendering","expected":"panel content mounts only on first activation","kind":"script","content":"const mounted = new Set();\r\nconst panel = document.createElement('div');\r\n\r\nconst renderPanel = (tabId) => {\r\n  if (!mounted.has(tabId)) {\r\n    mounted.add(tabId);\r\n  }\r\n  panel.textContent = `Mounted panels: ${Array.from(mounted).join(', ')}`;\r\n};\r\n\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'alpha', label: 'Alpha' },\r\n    { id: 'beta', label: 'Beta' },\r\n    { id: 'gamma', label: 'Gamma' }\r\n  ],\r\n  activeTab: 'alpha',\r\n  onChange: (tabId) => {\r\n    renderPanel(tabId);\r\n  }\r\n});\r\n\r\nrenderPanel('alpha');\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tabs);\r\nhost.appendChild(panel);\r\nreturn host;"},{"label":"tabs inside analytics workspace","expected":"tabs compose with cards for segmented metrics","kind":"script","content":"const tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'traffic', label: 'Traffic' },\r\n    { id: 'conversion', label: 'Conversion' },\r\n    { id: 'retention', label: 'Retention' }\r\n  ],\r\n  activeTab: 'traffic'\r\n});\r\n\r\nconst card = await slice.build('Card', {\r\n  title: 'Traffic KPI',\r\n  text: 'Monitor active sessions and acquisition trends.',\r\n  variant: 'outlined'\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tabs);\r\nhost.appendChild(card);\r\nreturn host;"},{"label":"tabs with static active panel","expected":"active tab can be preselected by activeTab","kind":"script","content":"const tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'details', label: 'Details' },\r\n    { id: 'members', label: 'Members' },\r\n    { id: 'billing', label: 'Billing' }\r\n  ],\r\n  activeTab: 'members'\r\n});\r\n\r\nreturn tabs;"},{"label":"Variants","expected":"an underline tab strip above a segmented control","kind":"script","content":"const strip = document.createElement('div');\r\nstrip.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';\r\n\r\nconst items = [\r\n  { id: 'overview', label: 'Overview' },\r\n  { id: 'activity', label: 'Activity' },\r\n  { id: 'settings', label: 'Settings' }\r\n];\r\n\r\nconst top = await slice.build('Tabs', { items, activeTab: 'overview' });\r\nconst inner = await slice.build('Tabs', { items, activeTab: 'overview', variant: 'secondary' });\r\n\r\nstrip.appendChild(top);\r\nstrip.appendChild(inner);\r\nreturn strip;"}];
  }

  async init() {
    this.markdownPath = "tabs.md";
    this.markdownContent = "---\r\ntitle: Tabs\r\nroute: /docs/navigation/tabs\r\nnavLabel: Tabs\r\nsection: Navigation\r\ngroup: Core\r\norder: 31\r\ndescription: Deep Tabs documentation with behavior-first scenarios and integration patterns.\r\ncomponent: TabsDocumentation\r\ngenerate: true\r\ntags: [tabs, navigation, routing]\r\n---\r\n\r\n# Tabs\r\n\r\n## Overview\r\n`Tabs` organizes related views in a compact navigation pattern where users switch context without leaving the current surface.\r\n\r\nUse it for dashboards, settings pages, reporting workspaces, and any area where users frequently compare categories.\r\n\r\n## Core behavior\r\n- Tabs keep one panel active at a time and visually mark the selected context.\r\n- Selection can be user-driven (click) or controlled from external state.\r\n- Panel content should stay focused and lightweight to keep context switches responsive.\r\n- Pair tabs with concise labels and stable ordering to preserve orientation.\r\n- `variant` picks the strip treatment: `primary` (default, underline) for top-level navigation, `secondary` (segmented control) for switching views inside one screen.\r\n- The panels container collapses itself when no item carries a `panel`, so a tab strip used purely as navigation adds no dead padding.\r\n\r\n## Advanced use cases\r\n- Settings workspaces where each tab owns a form section and independent save flow.\r\n- Data-heavy dashboards where tabs split long pages into digestible operational slices.\r\n- Route-aware tabs that mirror URL query/path state so deep links open the right panel.\r\n- Lazy activation patterns where expensive content mounts only after first selection.\r\n\r\n## Prop Scenarios\r\n:::script label=\"basic tabs navigation\" expected=\"renders tabs and switches visible panel content\"\r\nconst overview = document.createElement('div');\r\noverview.textContent = 'This is the overview panel.';\r\n\r\nconst usage = document.createElement('div');\r\nusage.textContent = 'Usage instructions go here.';\r\n\r\nconst history = document.createElement('div');\r\nhistory.textContent = 'Changelog and version history.';\r\n\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'overview', label: 'Overview', panel: overview },\r\n    { id: 'usage', label: 'Usage', panel: usage },\r\n    { id: 'history', label: 'History', panel: history }\r\n  ],\r\n  activeTab: 'overview'\r\n});\r\nreturn tabs;\r\n:::\r\n\r\n:::script label=\"controlled active tab\" expected=\"external controls drive selected tab\"\r\nlet active = 'profile';\r\n\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'profile', label: 'Profile' },\r\n    { id: 'security', label: 'Security' },\r\n    { id: 'billing', label: 'Billing' }\r\n  ],\r\n  activeTab: active,\r\n  onChange: (tabId) => {\r\n    active = tabId;\r\n    tabs.activeTab = active;\r\n    panel.textContent = `Current panel: ${active}`;\r\n  }\r\n});\r\n\r\nconst panel = document.createElement('div');\r\npanel.textContent = `Current panel: ${active}`;\r\n\r\nconst jumpToBilling = await slice.build('Button', {\r\n  value: 'Go to Billing',\r\n  onClick: () => {\r\n    active = 'billing';\r\n    tabs.activeTab = active;\r\n    panel.textContent = `Current panel: ${active}`;\r\n  }\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tabs);\r\nhost.appendChild(jumpToBilling);\r\nhost.appendChild(panel);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"tabs with route-state integration\" expected=\"tab changes update route query state\"\r\nconst mockRouteState = { section: 'summary' };\r\n\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'summary', label: 'Summary' },\r\n    { id: 'errors', label: 'Errors' },\r\n    { id: 'activity', label: 'Activity' }\r\n  ],\r\n  activeTab: mockRouteState.section,\r\n  onChange: (tabId) => {\r\n    mockRouteState.section = tabId;\r\n    status.textContent = `Route query ?section=${mockRouteState.section}`;\r\n  }\r\n});\r\n\r\nconst status = document.createElement('p');\r\nstatus.textContent = `Route query ?section=${mockRouteState.section}`;\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tabs);\r\nhost.appendChild(status);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"lazy panel rendering\" expected=\"panel content mounts only on first activation\"\r\nconst mounted = new Set();\r\nconst panel = document.createElement('div');\r\n\r\nconst renderPanel = (tabId) => {\r\n  if (!mounted.has(tabId)) {\r\n    mounted.add(tabId);\r\n  }\r\n  panel.textContent = `Mounted panels: ${Array.from(mounted).join(', ')}`;\r\n};\r\n\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'alpha', label: 'Alpha' },\r\n    { id: 'beta', label: 'Beta' },\r\n    { id: 'gamma', label: 'Gamma' }\r\n  ],\r\n  activeTab: 'alpha',\r\n  onChange: (tabId) => {\r\n    renderPanel(tabId);\r\n  }\r\n});\r\n\r\nrenderPanel('alpha');\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tabs);\r\nhost.appendChild(panel);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"tabs inside analytics workspace\" expected=\"tabs compose with cards for segmented metrics\"\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'traffic', label: 'Traffic' },\r\n    { id: 'conversion', label: 'Conversion' },\r\n    { id: 'retention', label: 'Retention' }\r\n  ],\r\n  activeTab: 'traffic'\r\n});\r\n\r\nconst card = await slice.build('Card', {\r\n  title: 'Traffic KPI',\r\n  text: 'Monitor active sessions and acquisition trends.',\r\n  variant: 'outlined'\r\n});\r\n\r\nconst host = document.createElement('div');\r\nhost.appendChild(tabs);\r\nhost.appendChild(card);\r\nreturn host;\r\n:::\r\n\r\n:::script label=\"tabs with static active panel\" expected=\"active tab can be preselected by activeTab\"\r\nconst tabs = await slice.build('Tabs', {\r\n  items: [\r\n    { id: 'details', label: 'Details' },\r\n    { id: 'members', label: 'Members' },\r\n    { id: 'billing', label: 'Billing' }\r\n  ],\r\n  activeTab: 'members'\r\n});\r\n\r\nreturn tabs;\r\n:::\r\n\r\n## Accessibility notes\r\n- Keep tab labels concise and unique so screen-reader users can distinguish options quickly.\r\n- Ensure visible focus styles remain clear for keyboard navigation.\r\n- Preserve logical tab order and avoid moving focus unexpectedly when panels switch.\r\n- If panel updates are significant, include clear heading structure inside each panel.\r\n\r\n## Best Practices\r\n:::tip\r\nUse tabs for sibling content groups only. If users must complete a sequence, prefer a stepper or wizard pattern.\r\n:::\r\n\r\n## Variants\r\n`primary` (the default) is the underline strip for top-level navigation. `variant: 'secondary'` is a\r\nsegmented control — the active tab becomes a filled pill — for switching between views of the same\r\nscreen. Same items, same behaviour, different affordance.\r\n\r\n:::script label=\"Variants\" expected=\"an underline tab strip above a segmented control\"\r\nconst strip = document.createElement('div');\r\nstrip.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';\r\n\r\nconst items = [\r\n  { id: 'overview', label: 'Overview' },\r\n  { id: 'activity', label: 'Activity' },\r\n  { id: 'settings', label: 'Settings' }\r\n];\r\n\r\nconst top = await slice.build('Tabs', { items, activeTab: 'overview' });\r\nconst inner = await slice.build('Tabs', { items, activeTab: 'overview', variant: 'secondary' });\r\n\r\nstrip.appendChild(top);\r\nstrip.appendChild(inner);\r\nreturn strip;\r\n:::\r\n\r\n## Pitfalls\r\n:::warning\r\nDo not hide critical validation errors inside inactive tabs without a global indicator. Users should know where attention is required.\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items[].id\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"items[].label\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"activeTab\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"primary\",\"allowedValues\":[\"primary\",\"secondary\"]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onTabChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"items\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"items[].id\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"items[].label\",\"type\":\"string\",\"required\":true,\"default\":null,\"allowedValues\":[]},{\"path\":\"activeTab\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"primary\",\"allowedValues\":[\"primary\",\"secondary\"]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onTabChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-tabsdocumentation', TabsDocumentation);
