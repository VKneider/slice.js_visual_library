export default class DomServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"A reconciled list","expected":"three badges; add, reverse or remove with the buttons below","kind":"script","content":"// singleton: true is what you want for a stateless service like this one —\n// every script on the page shares the same instance instead of registering a\n// new one each time.\nconst dom = await slice.build('DomService', { singleton: true });\n\nconst store = [\n  { id: 'design', label: 'Design' },\n  { id: 'build', label: 'Build' },\n  { id: 'ship', label: 'Ship' },\n];\n\nconst list = document.createElement('div');\nlist.id = 'reconcile-demo-list';\nlist.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:flex-start;font-family:system-ui,sans-serif;';\n\nconst render = () => dom.reconcile(list, store, {\n  keyOf: (item) => `demo-chip-${item.id}`,\n  component: 'Badge',\n  props: (item) => ({ label: item.label, variant: 'accent' }),\n});\n\nconst controls = document.createElement('div');\ncontrols.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;';\n\nconst add = await slice.build('Button', {\n  value: 'Add item',\n  size: 'sm',\n  onClick: async () => {\n    store.push({ id: `n${Date.now()}`, label: `Item ${store.length + 1}` });\n    await render();\n  },\n});\n\nconst reverse = await slice.build('Button', {\n  value: 'Reverse',\n  size: 'sm',\n  variant: 'outlined',\n  onClick: async () => {\n    store.reverse();\n    await render();\n  },\n});\n\nconst drop = await slice.build('Button', {\n  value: 'Remove first',\n  size: 'sm',\n  variant: 'danger',\n  onClick: async () => {\n    store.shift();\n    await render();\n  },\n});\n\ncontrols.appendChild(add);\ncontrols.appendChild(reverse);\ncontrols.appendChild(drop);\n\nconst wrap = document.createElement('div');\nwrap.appendChild(controls);\nwrap.appendChild(list);\n\nawait render();\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "dom-service.md";
    this.markdownContent = "---\ntitle: DomService\nroute: /docs/services/dom-service\nnavLabel: DomService\nsection: Services\ngroup: Rendering\norder: 62\ndescription: Reconciles a list of data against the child components that render it, without leaking.\ncomponent: DomServiceDocumentation\ngenerate: true\ntags: [dom, list, reconcile, reconcile, rendering, service]\n---\n\n# DomService\n\n## Overview\n\n`DomService.reconcile()` is the canonical way to render a variable-length list of child components.\nGive it your data and a stable key per item; it keeps the DOM, the component registry and the\ndestroy lifecycle in sync.\n\n## Why it exists\n\nThe two obvious alternatives are both broken, in ways that only show up as a slow memory leak:\n\n- `container.innerHTML = ''` removes nodes **without running `beforeDestroy()`**. Every child's\n  document/window listeners, timers and registry entry survive. The framework never gets to clean up.\n- Re-creating a node (rather than moving it) re-runs its constructor and does the same thing.\n\nSo `reconcile` does three things, in this order:\n\n1. **Refresh in place.** For each item, find the existing node by its stable `sliceId` and update it.\n   Only a genuinely new item is built.\n2. **Prune.** Every child whose data is gone is destroyed with `slice.controller.destroyComponent`,\n   which runs `beforeDestroy()`. This happens **before** reordering so a dead node is never a\n   reorder target.\n3. **Enforce order.** The DOM is moved to match `items`. `insertBefore` **moves** a node, it does not\n   clone it, so no constructor re-runs — and only nodes that are actually out of place move.\n\n## API\n\n```js\nawait dom.reconcile(container, items, {\n  keyOf:     (item) => `row-${item.id}`,   // required: stable identity per item\n  component: 'Row',                      // required: built for new items\n  props:     (item) => ({ label: item.name }),\n  refresh:   (node, props) => { /* optional: replaces slice.setComponentProps */ },\n});\n```\n\n- `keyOf(item)` — **the identity used across renders.** Derive it from a stable id, never from the\n  array index: an index key makes item 1 keep its component (and its state) when it becomes item 2.\n- `props(item)` — the props for one item.\n- `refresh(node, props)` — replaces the default `slice.setComponentProps(node, props)`. Use it when\n  props are interdependent, or when the child builds sub-components asynchronously and needs its own\n  `update()` in a specific order.\n\n`dom.destroyChildren(container)` tears down every registered child at once.\n\n## Prop Scenarios\n\n:::script label=\"A reconciled list\" expected=\"three badges; add, reverse or remove with the buttons below\"\n// singleton: true is what you want for a stateless service like this one —\n// every script on the page shares the same instance instead of registering a\n// new one each time.\nconst dom = await slice.build('DomService', { singleton: true });\n\nconst store = [\n  { id: 'design', label: 'Design' },\n  { id: 'build', label: 'Build' },\n  { id: 'ship', label: 'Ship' },\n];\n\nconst list = document.createElement('div');\nlist.id = 'reconcile-demo-list';\nlist.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:flex-start;font-family:system-ui,sans-serif;';\n\nconst render = () => dom.reconcile(list, store, {\n  keyOf: (item) => `demo-chip-${item.id}`,\n  component: 'Badge',\n  props: (item) => ({ label: item.label, variant: 'accent' }),\n});\n\nconst controls = document.createElement('div');\ncontrols.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;';\n\nconst add = await slice.build('Button', {\n  value: 'Add item',\n  size: 'sm',\n  onClick: async () => {\n    store.push({ id: `n${Date.now()}`, label: `Item ${store.length + 1}` });\n    await render();\n  },\n});\n\nconst reverse = await slice.build('Button', {\n  value: 'Reverse',\n  size: 'sm',\n  variant: 'outlined',\n  onClick: async () => {\n    store.reverse();\n    await render();\n  },\n});\n\nconst drop = await slice.build('Button', {\n  value: 'Remove first',\n  size: 'sm',\n  variant: 'danger',\n  onClick: async () => {\n    store.shift();\n    await render();\n  },\n});\n\ncontrols.appendChild(add);\ncontrols.appendChild(reverse);\ncontrols.appendChild(drop);\n\nconst wrap = document.createElement('div');\nwrap.appendChild(controls);\nwrap.appendChild(list);\n\nawait render();\nmount(wrap);\n:::\n\n## Best Practices\n\n:::tip\nCall `reconcile` after every change to the data — a push, a filter, a re-sort — and nowhere else.\nIf two places reconcile the same container, they will fight over the order.\n:::\n\n## Pitfalls\n\n:::warning\nDo not use the array index as `keyOf`. With an index key, inserting at the front makes item 1 inherit\nitem 0's component — and its scroll position, its open/closed state, and its focus.\n:::\n\n:::warning\n`reconcile` only manages **direct** children that carry a `slice-id`. Anything you append by hand\ninside the container is left alone; wrap it if it should be reconciled with the data.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "await dom.reconcile(container, items, {\n  keyOf:     (item) => `row-${item.id}`,   // required: stable identity per item\n  component: 'Row',                      // required: built for new items\n  props:     (item) => ({ label: item.name }),\n  refresh:   (node, props) => { /* optional: replaces slice.setComponentProps */ },\n});",
               language: "js"
            });
            if (null) {
               const label = document.createElement('div');
               label.classList.add('code-block-title');
               label.textContent = null;
               container.appendChild(label);
            }
            container.appendChild(code);
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

customElements.define('slice-domservicedocumentation', DomServiceDocumentation);
