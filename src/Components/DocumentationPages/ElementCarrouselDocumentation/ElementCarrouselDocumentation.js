export default class ElementCarrouselDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Feature cards showcase","expected":"three feature cards in a carrousel with navigation","kind":"script","content":"const slide1 = await slice.build('Card', {\n  title: 'Real-time Sync', text: 'Data stays current across all devices without manual refresh.', badge: 'New', variant: 'elevated', icon: { name: 'cloud-arrow-up', iconStyle: 'filled' }\n});\n\nconst slide2 = await slice.build('Card', {\n  title: 'Analytics Dashboard', text: 'Track metrics and visualize trends with interactive charts.', badge: 'Popular', variant: 'elevated', icon: { name: 'chart-mixed-dollar', iconStyle: 'filled' }\n});\n\nconst slide3 = await slice.build('Card', {\n  title: 'Team Collaboration', text: 'Share workspaces, comment on changes, and manage permissions.', badge: 'Enterprise', variant: 'elevated', icon: { name: 'users-group', iconStyle: 'filled' }\n});\n\nconst carrousel = await slice.build('ElementCarrousel', {\n  elements: [slide1, slide2, slide3]\n});\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(carrousel);\nreturn wrapper;"},{"label":"Cards with action buttons","expected":"each slide has a card and a call-to-action button","kind":"script","content":"const slides = await Promise.all([\n  (async () => {\n    const card = await slice.build('Card', { title: 'Deploy v2.1', text: 'New routing engine and caching layer.', badge: 'Ready', variant: 'outlined', icon: { name: 'rocket', iconStyle: 'filled' } });\n    const btn = await slice.build('Button', { value: 'Deploy now', customColor: { button: '#16a34a', label: '#ffffff' }, icon: { name: 'play', iconStyle: 'filled' } });\n    const col = document.createElement('div');\n    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';\n    col.appendChild(card); col.appendChild(btn);\n    return col;\n  })(),\n  (async () => {\n    const card = await slice.build('Card', { title: 'Review PR #412', text: 'Branch: feat/parser-cache. 3 approvals needed.', badge: 'Pending', variant: 'outlined', icon: { name: 'code-pull-request', iconStyle: 'filled' } });\n    const btn = await slice.build('Button', { value: 'Open review', customColor: { button: '#2563eb', label: '#ffffff' }, icon: { name: 'eye', iconStyle: 'filled' } });\n    const col = document.createElement('div');\n    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';\n    col.appendChild(card); col.appendChild(btn);\n    return col;\n  })(),\n  (async () => {\n    const card = await slice.build('Card', { title: 'Run tests', text: 'Suite: integration. 142 tests, 2 flaky.', badge: 'Warning', variant: 'outlined', icon: { name: 'bug', iconStyle: 'filled' } });\n    const btn = await slice.build('Button', { value: 'Re-run', customColor: { button: '#dc2626', label: '#ffffff' }, icon: { name: 'refresh', iconStyle: 'outlined' } });\n    const col = document.createElement('div');\n    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';\n    col.appendChild(card); col.appendChild(btn);\n    return col;\n  })()\n]);\n\nconst carrousel = await slice.build('ElementCarrousel', { elements: slides });\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(carrousel);\nreturn wrapper;"},{"label":"Custom color cards","expected":"cards with different accent colors in a carrousel","kind":"script","content":"const slides = await Promise.all([\n  slice.build('Card', { title: 'CPU Usage', text: 'Current: 34% — well within threshold.', badge: 'Healthy', variant: 'default', icon: { name: 'computer-speaker', iconStyle: 'filled' }, customColor: { accent: '#0891b2' } }),\n  slice.build('Card', { title: 'Memory', text: '6.2GB / 16GB allocated.', badge: 'Warning', variant: 'default', icon: { name: 'database', iconStyle: 'filled' }, customColor: { accent: '#d97706' } }),\n  slice.build('Card', { title: 'Disk I/O', text: 'Read: 240MB/s · Write: 180MB/s', badge: 'Healthy', variant: 'default', icon: { name: 'inbox', iconStyle: 'filled' }, customColor: { accent: '#16a34a' } }),\n  slice.build('Card', { title: 'Network', text: '1.2 Gbps inbound · 800 Mbps outbound', badge: 'Critical', variant: 'default', icon: { name: 'globe', iconStyle: 'filled' }, customColor: { accent: '#dc2626' } })\n]);\n\nconst carrousel = await slice.build('ElementCarrousel', { elements: slides });\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(carrousel);\nreturn wrapper;"},{"label":"Button toolbar walkthrough","expected":"carrousel showing different button configurations","kind":"script","content":"const toolbars = await Promise.all([\n  (async () => {\n    const btns = await Promise.all([\n      slice.build('Button', { value: 'Save', icon: { name: 'download', iconStyle: 'filled' }, customColor: { button: '#16a34a', label: '#ffffff' } }),\n      slice.build('Button', { value: 'Cancel', customColor: { button: '#e2e8f0', label: '#0f172a' } })\n    ]);\n    const grid = await slice.build('Grid', { columns: 2, gap: '8px', items: btns });\n    const label = document.createElement('div');\n    label.textContent = 'Save / Cancel';\n    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';\n    const box = document.createElement('div');\n    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';\n    box.appendChild(label); box.appendChild(grid);\n    return box;\n  })(),\n  (async () => {\n    const btns = await Promise.all([\n      slice.build('Button', { value: 'Edit', icon: { name: 'pen', iconStyle: 'filled' } }),\n      slice.build('Button', { value: 'Share', icon: { name: 'share-nodes', iconStyle: 'filled' }, customColor: { button: '#2563eb', label: '#ffffff' } }),\n      slice.build('Button', { value: 'Delete', icon: { name: 'trash-bin', iconStyle: 'filled' }, customColor: { button: '#dc2626', label: '#ffffff' } })\n    ]);\n    const grid = await slice.build('Grid', { columns: 3, gap: '6px', items: btns });\n    const label = document.createElement('div');\n    label.textContent = 'Edit / Share / Delete';\n    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';\n    const box = document.createElement('div');\n    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';\n    box.appendChild(label); box.appendChild(grid);\n    return box;\n  })(),\n  (async () => {\n    const btns = await Promise.all([\n      slice.build('Button', { value: 'Approve', icon: { name: 'badge-check', iconStyle: 'filled' }, customColor: { button: '#16a34a', label: '#ffffff' } }),\n      slice.build('Button', { value: 'Reject', icon: { name: 'close-circle', iconStyle: 'filled' }, customColor: { button: '#dc2626', label: '#ffffff' } }),\n      slice.build('Button', { value: 'Request changes', icon: { name: 'edit', iconStyle: 'filled' }, customColor: { button: '#f59e0b', label: '#ffffff' } })\n    ]);\n    const grid = await slice.build('Grid', { columns: 3, gap: '6px', items: btns });\n    const label = document.createElement('div');\n    label.textContent = 'Approve / Reject / Request changes';\n    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';\n    const box = document.createElement('div');\n    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';\n    box.appendChild(label); box.appendChild(grid);\n    return box;\n  })()\n]);\n\nconst carrousel = await slice.build('ElementCarrousel', { elements: toolbars });\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(carrousel);\nreturn wrapper;"}];
  }

  async init() {
    this.markdownPath = "carrousel.md";
    this.markdownContent = "---\ntitle: ElementCarrousel\nroute: /docs/layout/element-carrousel\nnavLabel: Carrousel\nsection: Layout\ngroup: Containers\norder: 25\ndescription: ElementCarrousel documentation with slide navigation and indicator scenarios.\ncomponent: ElementCarrouselDocumentation\ngenerate: true\ntags: [carrousel, carousel, layout, navigation]\n---\n\n# ElementCarrousel\n\n## Overview\n`ElementCarrousel` renders a horizontal slide carousel with prev/next buttons and dot indicators. Each slide accepts any DOM node or HTML string.\n\n## API and Behavior\n- Accepts `elements` (array of Nodes or strings) as its data source.\n- Slides are rendered as full-width panels with smooth CSS transition.\n- Dot indicators are clickable for direct navigation.\n- Arrow keys supported when the component has focus.\n- Resize-aware: repositions slides on window resize.\n- If `elements` is empty or not an array, no slides are rendered.\n\n## Prop Scenarios\n\n:::script label=\"Feature cards showcase\" expected=\"three feature cards in a carrousel with navigation\"\nconst slide1 = await slice.build('Card', {\n  title: 'Real-time Sync', text: 'Data stays current across all devices without manual refresh.', badge: 'New', variant: 'elevated', icon: { name: 'cloud-arrow-up', iconStyle: 'filled' }\n});\n\nconst slide2 = await slice.build('Card', {\n  title: 'Analytics Dashboard', text: 'Track metrics and visualize trends with interactive charts.', badge: 'Popular', variant: 'elevated', icon: { name: 'chart-mixed-dollar', iconStyle: 'filled' }\n});\n\nconst slide3 = await slice.build('Card', {\n  title: 'Team Collaboration', text: 'Share workspaces, comment on changes, and manage permissions.', badge: 'Enterprise', variant: 'elevated', icon: { name: 'users-group', iconStyle: 'filled' }\n});\n\nconst carrousel = await slice.build('ElementCarrousel', {\n  elements: [slide1, slide2, slide3]\n});\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(carrousel);\nreturn wrapper;\n:::\n\n:::script label=\"Cards with action buttons\" expected=\"each slide has a card and a call-to-action button\"\nconst slides = await Promise.all([\n  (async () => {\n    const card = await slice.build('Card', { title: 'Deploy v2.1', text: 'New routing engine and caching layer.', badge: 'Ready', variant: 'outlined', icon: { name: 'rocket', iconStyle: 'filled' } });\n    const btn = await slice.build('Button', { value: 'Deploy now', customColor: { button: '#16a34a', label: '#ffffff' }, icon: { name: 'play', iconStyle: 'filled' } });\n    const col = document.createElement('div');\n    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';\n    col.appendChild(card); col.appendChild(btn);\n    return col;\n  })(),\n  (async () => {\n    const card = await slice.build('Card', { title: 'Review PR #412', text: 'Branch: feat/parser-cache. 3 approvals needed.', badge: 'Pending', variant: 'outlined', icon: { name: 'code-pull-request', iconStyle: 'filled' } });\n    const btn = await slice.build('Button', { value: 'Open review', customColor: { button: '#2563eb', label: '#ffffff' }, icon: { name: 'eye', iconStyle: 'filled' } });\n    const col = document.createElement('div');\n    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';\n    col.appendChild(card); col.appendChild(btn);\n    return col;\n  })(),\n  (async () => {\n    const card = await slice.build('Card', { title: 'Run tests', text: 'Suite: integration. 142 tests, 2 flaky.', badge: 'Warning', variant: 'outlined', icon: { name: 'bug', iconStyle: 'filled' } });\n    const btn = await slice.build('Button', { value: 'Re-run', customColor: { button: '#dc2626', label: '#ffffff' }, icon: { name: 'refresh', iconStyle: 'outlined' } });\n    const col = document.createElement('div');\n    col.style.cssText = 'display:flex;flex-direction:column;gap:12px;';\n    col.appendChild(card); col.appendChild(btn);\n    return col;\n  })()\n]);\n\nconst carrousel = await slice.build('ElementCarrousel', { elements: slides });\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(carrousel);\nreturn wrapper;\n:::\n\n:::script label=\"Custom color cards\" expected=\"cards with different accent colors in a carrousel\"\nconst slides = await Promise.all([\n  slice.build('Card', { title: 'CPU Usage', text: 'Current: 34% — well within threshold.', badge: 'Healthy', variant: 'default', icon: { name: 'computer-speaker', iconStyle: 'filled' }, customColor: { accent: '#0891b2' } }),\n  slice.build('Card', { title: 'Memory', text: '6.2GB / 16GB allocated.', badge: 'Warning', variant: 'default', icon: { name: 'database', iconStyle: 'filled' }, customColor: { accent: '#d97706' } }),\n  slice.build('Card', { title: 'Disk I/O', text: 'Read: 240MB/s · Write: 180MB/s', badge: 'Healthy', variant: 'default', icon: { name: 'inbox', iconStyle: 'filled' }, customColor: { accent: '#16a34a' } }),\n  slice.build('Card', { title: 'Network', text: '1.2 Gbps inbound · 800 Mbps outbound', badge: 'Critical', variant: 'default', icon: { name: 'globe', iconStyle: 'filled' }, customColor: { accent: '#dc2626' } })\n]);\n\nconst carrousel = await slice.build('ElementCarrousel', { elements: slides });\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(carrousel);\nreturn wrapper;\n:::\n\n:::script label=\"Button toolbar walkthrough\" expected=\"carrousel showing different button configurations\"\nconst toolbars = await Promise.all([\n  (async () => {\n    const btns = await Promise.all([\n      slice.build('Button', { value: 'Save', icon: { name: 'download', iconStyle: 'filled' }, customColor: { button: '#16a34a', label: '#ffffff' } }),\n      slice.build('Button', { value: 'Cancel', customColor: { button: '#e2e8f0', label: '#0f172a' } })\n    ]);\n    const grid = await slice.build('Grid', { columns: 2, gap: '8px', items: btns });\n    const label = document.createElement('div');\n    label.textContent = 'Save / Cancel';\n    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';\n    const box = document.createElement('div');\n    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';\n    box.appendChild(label); box.appendChild(grid);\n    return box;\n  })(),\n  (async () => {\n    const btns = await Promise.all([\n      slice.build('Button', { value: 'Edit', icon: { name: 'pen', iconStyle: 'filled' } }),\n      slice.build('Button', { value: 'Share', icon: { name: 'share-nodes', iconStyle: 'filled' }, customColor: { button: '#2563eb', label: '#ffffff' } }),\n      slice.build('Button', { value: 'Delete', icon: { name: 'trash-bin', iconStyle: 'filled' }, customColor: { button: '#dc2626', label: '#ffffff' } })\n    ]);\n    const grid = await slice.build('Grid', { columns: 3, gap: '6px', items: btns });\n    const label = document.createElement('div');\n    label.textContent = 'Edit / Share / Delete';\n    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';\n    const box = document.createElement('div');\n    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';\n    box.appendChild(label); box.appendChild(grid);\n    return box;\n  })(),\n  (async () => {\n    const btns = await Promise.all([\n      slice.build('Button', { value: 'Approve', icon: { name: 'badge-check', iconStyle: 'filled' }, customColor: { button: '#16a34a', label: '#ffffff' } }),\n      slice.build('Button', { value: 'Reject', icon: { name: 'close-circle', iconStyle: 'filled' }, customColor: { button: '#dc2626', label: '#ffffff' } }),\n      slice.build('Button', { value: 'Request changes', icon: { name: 'edit', iconStyle: 'filled' }, customColor: { button: '#f59e0b', label: '#ffffff' } })\n    ]);\n    const grid = await slice.build('Grid', { columns: 3, gap: '6px', items: btns });\n    const label = document.createElement('div');\n    label.textContent = 'Approve / Reject / Request changes';\n    label.style.cssText = 'font-size:.8rem;color:var(--font-secondary-color);margin-bottom:8px;text-align:center;';\n    const box = document.createElement('div');\n    box.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:1rem;';\n    box.appendChild(label); box.appendChild(grid);\n    return box;\n  })()\n]);\n\nconst carrousel = await slice.build('ElementCarrousel', { elements: toolbars });\n\nconst wrapper = document.createElement('div');\nwrapper.style.cssText = 'width:100%;';\nwrapper.appendChild(carrousel);\nreturn wrapper;\n:::\n\n## Best Practices\n:::tip\nUse `Card` or custom component nodes as slides to maintain consistent layout across a carrousel.\n:::\n\n## Pitfalls\n:::warning\nSlides must be uniform in height for smooth transitions. Avoid mixing very tall and very short content in the same carrousel.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"elements\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"elements\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]}]}");
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

    const section = document.createElement('section');
    section.classList.add('doc-script-scenarios');

    const title = document.createElement('h2');
    title.textContent = 'Prop Scenarios';
    section.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.classList.add('doc-script-subtitle');
    subtitle.textContent = 'Interactive demos validating component behavior.';
    section.appendChild(subtitle);

    for (const scenario of this.scriptScenarios) {
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

      section.appendChild(demobox);
      demobox.appendCode(code);
      section.appendChild(errorMessage);

      await executeScenario();
    }

    host.appendChild(section);
  }
}

customElements.define('slice-elementcarrouseldocumentation', ElementCarrouselDocumentation);
