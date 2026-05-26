export default class TabsDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"basic tabs navigation","expected":"renders tabs and switches visible panel content","kind":"script","content":"const tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'overview', label: 'Overview' },\n    { id: 'usage', label: 'Usage' },\n    { id: 'history', label: 'History' }\n  ],\n  activeTab: 'overview'\n});\n\nconst content = document.createElement('div');\ncontent.style.marginTop = '10px';\ncontent.textContent = 'Overview content';\n\ntabs.onTabChange = (tabId) => {\n  if (tabId === 'usage') {\n    content.textContent = 'Usage content';\n  } else if (tabId === 'history') {\n    content.textContent = 'History content';\n  } else {\n    content.textContent = 'Overview content';\n  }\n};\n\nconst host = document.createElement('div');\nhost.appendChild(tabs);\nhost.appendChild(content);\nreturn host;"},{"label":"controlled active tab","expected":"external controls drive selected tab","kind":"script","content":"let active = 'profile';\n\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'profile', label: 'Profile' },\n    { id: 'security', label: 'Security' },\n    { id: 'billing', label: 'Billing' }\n  ],\n  activeTab: active,\n  onTabChange: (tabId) => {\n    active = tabId;\n    tabs.activeTab = active;\n    panel.textContent = `Current panel: ${active}`;\n  }\n});\n\nconst panel = document.createElement('div');\npanel.style.marginTop = '8px';\npanel.textContent = `Current panel: ${active}`;\n\nconst jumpToBilling = await slice.build('Button', {\n  value: 'Go to Billing',\n  onClickCallback: () => {\n    active = 'billing';\n    tabs.activeTab = active;\n    panel.textContent = `Current panel: ${active}`;\n  }\n});\n\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gap = '10px';\nhost.appendChild(tabs);\nhost.appendChild(jumpToBilling);\nhost.appendChild(panel);\nreturn host;"},{"label":"tabs with route-state integration","expected":"tab changes update route query state","kind":"script","content":"const mockRouteState = { section: 'summary' };\n\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'summary', label: 'Summary' },\n    { id: 'errors', label: 'Errors' },\n    { id: 'activity', label: 'Activity' }\n  ],\n  activeTab: mockRouteState.section,\n  onTabChange: (tabId) => {\n    mockRouteState.section = tabId;\n    status.textContent = `Route query ?section=${mockRouteState.section}`;\n  }\n});\n\nconst status = document.createElement('p');\nstatus.textContent = `Route query ?section=${mockRouteState.section}`;\n\nconst host = document.createElement('div');\nhost.appendChild(tabs);\nhost.appendChild(status);\nreturn host;"},{"label":"lazy panel rendering","expected":"panel content mounts only on first activation","kind":"script","content":"const mounted = new Set();\nconst panel = document.createElement('div');\npanel.style.marginTop = '8px';\n\nconst renderPanel = (tabId) => {\n  if (!mounted.has(tabId)) {\n    mounted.add(tabId);\n  }\n  panel.textContent = `Mounted panels: ${Array.from(mounted).join(', ')}`;\n};\n\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'alpha', label: 'Alpha' },\n    { id: 'beta', label: 'Beta' },\n    { id: 'gamma', label: 'Gamma' }\n  ],\n  activeTab: 'alpha',\n  onTabChange: (tabId) => {\n    renderPanel(tabId);\n  }\n});\n\nrenderPanel('alpha');\n\nconst host = document.createElement('div');\nhost.appendChild(tabs);\nhost.appendChild(panel);\nreturn host;"},{"label":"tabs inside analytics workspace","expected":"tabs compose with cards for segmented metrics","kind":"script","content":"const tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'traffic', label: 'Traffic' },\n    { id: 'conversion', label: 'Conversion' },\n    { id: 'retention', label: 'Retention' }\n  ],\n  activeTab: 'traffic'\n});\n\nconst card = await slice.build('Card', {\n  title: 'Traffic KPI',\n  text: 'Monitor active sessions and acquisition trends.',\n  variant: 'outlined'\n});\n\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gap = '10px';\nhost.appendChild(tabs);\nhost.appendChild(card);\nreturn host;"}];
  }

  async init() {
    this.markdownPath = "tabs.md";
    this.markdownContent = "---\ntitle: Tabs\nroute: /docs/navigation/tabs\nnavLabel: Tabs\nsection: Navigation\ngroup: Core\norder: 31\ndescription: Deep Tabs documentation with behavior-first scenarios and integration patterns.\ncomponent: TabsDocumentation\ngenerate: true\ntags: [tabs, navigation, routing]\n---\n\n# Tabs\n\n## Overview\n`Tabs` organizes related views in a compact navigation pattern where users switch context without leaving the current surface.\n\nUse it for dashboards, settings pages, reporting workspaces, and any area where users frequently compare categories.\n\n## Core behavior\n- Tabs keep one panel active at a time and visually mark the selected context.\n- Selection can be user-driven (click) or controlled from external state.\n- Panel content should stay focused and lightweight to keep context switches responsive.\n- Pair tabs with concise labels and stable ordering to preserve orientation.\n\n## Advanced use cases\n- Settings workspaces where each tab owns a form section and independent save flow.\n- Data-heavy dashboards where tabs split long pages into digestible operational slices.\n- Route-aware tabs that mirror URL query/path state so deep links open the right panel.\n- Lazy activation patterns where expensive content mounts only after first selection.\n\n## Prop Scenarios\n:::script label=\"basic tabs navigation\" expected=\"renders tabs and switches visible panel content\"\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'overview', label: 'Overview' },\n    { id: 'usage', label: 'Usage' },\n    { id: 'history', label: 'History' }\n  ],\n  activeTab: 'overview'\n});\n\nconst content = document.createElement('div');\ncontent.style.marginTop = '10px';\ncontent.textContent = 'Overview content';\n\ntabs.onTabChange = (tabId) => {\n  if (tabId === 'usage') {\n    content.textContent = 'Usage content';\n  } else if (tabId === 'history') {\n    content.textContent = 'History content';\n  } else {\n    content.textContent = 'Overview content';\n  }\n};\n\nconst host = document.createElement('div');\nhost.appendChild(tabs);\nhost.appendChild(content);\nreturn host;\n:::\n\n:::script label=\"controlled active tab\" expected=\"external controls drive selected tab\"\nlet active = 'profile';\n\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'profile', label: 'Profile' },\n    { id: 'security', label: 'Security' },\n    { id: 'billing', label: 'Billing' }\n  ],\n  activeTab: active,\n  onTabChange: (tabId) => {\n    active = tabId;\n    tabs.activeTab = active;\n    panel.textContent = `Current panel: ${active}`;\n  }\n});\n\nconst panel = document.createElement('div');\npanel.style.marginTop = '8px';\npanel.textContent = `Current panel: ${active}`;\n\nconst jumpToBilling = await slice.build('Button', {\n  value: 'Go to Billing',\n  onClickCallback: () => {\n    active = 'billing';\n    tabs.activeTab = active;\n    panel.textContent = `Current panel: ${active}`;\n  }\n});\n\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gap = '10px';\nhost.appendChild(tabs);\nhost.appendChild(jumpToBilling);\nhost.appendChild(panel);\nreturn host;\n:::\n\n:::script label=\"tabs with route-state integration\" expected=\"tab changes update route query state\"\nconst mockRouteState = { section: 'summary' };\n\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'summary', label: 'Summary' },\n    { id: 'errors', label: 'Errors' },\n    { id: 'activity', label: 'Activity' }\n  ],\n  activeTab: mockRouteState.section,\n  onTabChange: (tabId) => {\n    mockRouteState.section = tabId;\n    status.textContent = `Route query ?section=${mockRouteState.section}`;\n  }\n});\n\nconst status = document.createElement('p');\nstatus.textContent = `Route query ?section=${mockRouteState.section}`;\n\nconst host = document.createElement('div');\nhost.appendChild(tabs);\nhost.appendChild(status);\nreturn host;\n:::\n\n:::script label=\"lazy panel rendering\" expected=\"panel content mounts only on first activation\"\nconst mounted = new Set();\nconst panel = document.createElement('div');\npanel.style.marginTop = '8px';\n\nconst renderPanel = (tabId) => {\n  if (!mounted.has(tabId)) {\n    mounted.add(tabId);\n  }\n  panel.textContent = `Mounted panels: ${Array.from(mounted).join(', ')}`;\n};\n\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'alpha', label: 'Alpha' },\n    { id: 'beta', label: 'Beta' },\n    { id: 'gamma', label: 'Gamma' }\n  ],\n  activeTab: 'alpha',\n  onTabChange: (tabId) => {\n    renderPanel(tabId);\n  }\n});\n\nrenderPanel('alpha');\n\nconst host = document.createElement('div');\nhost.appendChild(tabs);\nhost.appendChild(panel);\nreturn host;\n:::\n\n:::script label=\"tabs inside analytics workspace\" expected=\"tabs compose with cards for segmented metrics\"\nconst tabs = await slice.build('Tabs', {\n  items: [\n    { id: 'traffic', label: 'Traffic' },\n    { id: 'conversion', label: 'Conversion' },\n    { id: 'retention', label: 'Retention' }\n  ],\n  activeTab: 'traffic'\n});\n\nconst card = await slice.build('Card', {\n  title: 'Traffic KPI',\n  text: 'Monitor active sessions and acquisition trends.',\n  variant: 'outlined'\n});\n\nconst host = document.createElement('div');\nhost.style.display = 'grid';\nhost.style.gap = '10px';\nhost.appendChild(tabs);\nhost.appendChild(card);\nreturn host;\n:::\n\n## Accessibility notes\n- Keep tab labels concise and unique so screen-reader users can distinguish options quickly.\n- Ensure visible focus styles remain clear for keyboard navigation.\n- Preserve logical tab order and avoid moving focus unexpectedly when panels switch.\n- If panel updates are significant, include clear heading structure inside each panel.\n\n## Best Practices\n:::tip\nUse tabs for sibling content groups only. If users must complete a sequence, prefer a stepper or wizard pattern.\n:::\n\n## Pitfalls\n:::warning\nDo not hide critical validation errors inside inactive tabs without a global indicator. Users should know where attention is required.\n:::\n";
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

        const mount = (node) => {
          if (node instanceof Node) {
            preview.appendChild(node);
          }
        };

        try {
          const fn = new AsyncFunction('component', 'slice', 'document', 'mount', scenario.content);
          const result = await fn(this, slice, document, mount);

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
      card.appendChild(code);
      card.appendChild(preview);
      card.appendChild(errorMessage);

      section.appendChild(card);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-tabsdocumentation', TabsDocumentation);
