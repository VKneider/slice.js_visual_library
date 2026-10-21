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
    this.markdownContent = "---\ntitle: DomService\nroute: /docs/services/dom-service\nnavLabel: DomService\nsection: Services\ngroup: Rendering\norder: 62\ndescription: Reconciles a list of data against the child components that render it, without leaking.\ncomponent: DomServiceDocumentation\ngenerate: true\ntags: [dom, list, reconcile, reconcile, rendering, service]\n---\n\n# DomService\n\n## Overview\n\n`DomService.reconcile()` is the canonical way to render a variable-length list of child components.\nGive it your data and a stable key per item; it keeps the DOM, the component registry and the\ndestroy lifecycle in sync.\n\n## Why it exists\n\nThe two obvious alternatives are both broken, in ways that only show up as a slow memory leak:\n\n- `container.innerHTML = ''` removes nodes **without running `beforeDestroy()`**. Every child's\n  document/window listeners, timers and registry entry survive. The framework never gets to clean up.\n- Re-creating a node (rather than moving it) re-runs its constructor and does the same thing.\n\nSo `reconcile` does three things, in this order:\n\n1. **Refresh in place.** For each item, find the existing node by its stable `sliceId` and update it.\n   Only a genuinely new item is built.\n2. **Prune.** Every child whose data is gone is destroyed with `slice.controller.destroyComponent`,\n   which runs `beforeDestroy()`. This happens **before** reordering so a dead node is never a\n   reorder target.\n3. **Enforce order, with the fewest moves.** The DOM is moved to match `items`. `insertBefore` **moves** a node, it does not clone it, so no constructor re-runs. The nodes already in the right relative order (the longest increasing run of their current positions) stay put and only the rest move: moving the first item to the end is one move, not one per item. That matters beyond speed — a moved node loses keyboard focus and restarts its CSS animations.\n\n## Concurrency: renders queue per container, and coalesce\n\n`reconcile` keeps one queue per container in a `WeakMap`. A render that arrives while another is\nstill running waits for it instead of interleaving — otherwise the second could prune a node the first\nhad just ordered, or both could decide to build the same id.\n\nRenders that are still **waiting** coalesce: if three calls arrive while one is running, only the\nnewest of the three is applied, and all three callers resolve when it is. A filter box that re-renders\na list on every keystroke therefore applies the last keystroke, not every intermediate one.\n\nTwo details worth knowing, because both were bugs first:\n\n- The chain continues on **failure**. `then(run, run)` rather than `then(run)`, so one bad render\n  cannot freeze every later render on that container.\n- The chain is **dropped when it drains**. A long-lived list does not accumulate one promise per\n  update.\n\nThe promise `reconcile` returns resolves once the DOM reflects *this* call's items or a newer call's.\nSo `await dom.reconcile(...)` really does mean \"the DOM is at least this fresh\". A render that was\nsuperseded before it started is never applied — its own `refresh` and `props` callbacks do not run.\n\n## Adoption, and a build that returns nothing\n\nBefore paying for a build, `reconcile` looks for a **direct child** with `slice-id=\"<key>\"` and adopts\nit (never a node nested deeper, which belongs to an inner list). The registry can lose track of a node — a build that failed part-way, a child the consumer\npre-rendered and appended by hand — while the DOM still holds it, and building it again would throw\n`already registered`.\n\nFor the same reason the final ordered list is assembled from the nodes that actually exist rather\nthan from the slots that were requested: `slice.build` legitimately returns nothing for an\nunregistered component name, and that must not shift every sibling by one.\n\n## Cost of a cold list\n\nThe **first** build is awaited on its own, because it warms the template cache; the rest then run in\nparallel. A cold list of *n* rows therefore costs **one** fetch per component type, not *n*.\n\n## API\n\n```js\nawait dom.reconcile(container, items, {\n  keyOf:     (item) => `row-${item.id}`,   // required: stable identity per item\n  component: 'Row',                      // required: built for new items\n  props:     (item) => ({ label: item.name }),\n  refresh:   (node, props) => { /* optional: replaces slice.setComponentProps */ },\n  equals:    Object.is,                    // optional: skip unchanged items\n});\n```\n\n- `keyOf(item)` — **the identity used across renders.** Derive it from a stable id, never from the\n  array index: an index key makes item 1 keep its component (and its state) when it becomes item 2.\n  It is also used to **adopt** an existing node, so it must be unique across the whole page, not just\n  within this list — two lists using `row-1` will fight over the same key.\n- `props(item)` — the props for one item.\n- `refresh(node, props)` — replaces the default `slice.setComponentProps(node, props)`. Use it when\n  props are interdependent, or when the child builds sub-components asynchronously and needs its own\n  `update()` in a specific order.\n- `equals(previous, next)` — optional. When it returns `true` for an item's data from the last render and its data now, that node is **not** refreshed (and `props(item)` is not called for it). Without it, every surviving node is refreshed on every render. Pass `Object.is` when you update data immutably (a changed row is a new object): re-rendering 1,000 rows after editing one then refreshes one. Do **not** use `Object.is` if you mutate item objects in place — the mutated row would look unchanged.\n\n`dom.destroyChildren(container)` tears down every registered child at once.\n\n## Prop Scenarios\n\n:::script label=\"A reconciled list\" expected=\"three badges; add, reverse or remove with the buttons below\"\n// singleton: true is what you want for a stateless service like this one —\n// every script on the page shares the same instance instead of registering a\n// new one each time.\nconst dom = await slice.build('DomService', { singleton: true });\n\nconst store = [\n  { id: 'design', label: 'Design' },\n  { id: 'build', label: 'Build' },\n  { id: 'ship', label: 'Ship' },\n];\n\nconst list = document.createElement('div');\nlist.id = 'reconcile-demo-list';\nlist.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:flex-start;font-family:system-ui,sans-serif;';\n\nconst render = () => dom.reconcile(list, store, {\n  keyOf: (item) => `demo-chip-${item.id}`,\n  component: 'Badge',\n  props: (item) => ({ label: item.label, variant: 'accent' }),\n});\n\nconst controls = document.createElement('div');\ncontrols.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;';\n\nconst add = await slice.build('Button', {\n  value: 'Add item',\n  size: 'sm',\n  onClick: async () => {\n    store.push({ id: `n${Date.now()}`, label: `Item ${store.length + 1}` });\n    await render();\n  },\n});\n\nconst reverse = await slice.build('Button', {\n  value: 'Reverse',\n  size: 'sm',\n  variant: 'outlined',\n  onClick: async () => {\n    store.reverse();\n    await render();\n  },\n});\n\nconst drop = await slice.build('Button', {\n  value: 'Remove first',\n  size: 'sm',\n  variant: 'danger',\n  onClick: async () => {\n    store.shift();\n    await render();\n  },\n});\n\ncontrols.appendChild(add);\ncontrols.appendChild(reverse);\ncontrols.appendChild(drop);\n\nconst wrap = document.createElement('div');\nwrap.appendChild(controls);\nwrap.appendChild(list);\n\nawait render();\nmount(wrap);\n:::\n\n## Best Practices\n\n:::tip\nWith immutable data, pass `equals: Object.is`. Re-rendering a long list after one row changes then\ntouches one node instead of all of them.\n:::\n\n:::tip\nKeys are page-wide `sliceId`s, not per-container. That is what lets an item **move between two\nlists** (a kanban column to another) and keep its component and state: reconcile the destination,\nthen the source. It is also why two unrelated lists must not share key prefixes.\n:::\n\n:::tip\nCall `reconcile` after every change to the data — a push, a filter, a re-sort — and nowhere else.\nConcurrent calls on the same container are queued rather than fought over, but two *different*\ndata sources reconciling one container is still a design error: each will prune what the other\njust built.\n:::\n\n:::tip\n`await` the call. The promise resolves after this render **and** any render already queued on the\ncontainer, so a mutation that triggers two `reconcile` calls can still `await` once and know the DOM\nmatches.\n:::\n\n:::tip\nReuse an item **object** across renders rather than rebuilding it, if the child keys off identity\nthe object carries. `TreeView` keeps a `WeakMap` from item to a generated id for items with no\n`path` or `id` of their own, because an index key would hand item 0's component — and its\nopen/closed state — to whatever took its place after a splice.\n:::\n\n## Pitfalls\n\n:::warning\nDo not use the array index as `keyOf`. With an index key, inserting at the front makes item 1 inherit\nitem 0's component — and its scroll position, its open/closed state, and its focus.\n:::\n\n:::warning\n`reconcile` only manages **direct** children that carry a `slice-id`. Anything you append by hand\ninside the container is left alone; wrap it if it should be reconciled with the data.\n:::\n\n:::warning\nNever spread an item straight into `props`. `props(item)` is assigned by name onto the element, and\nseveral common field names are getter-only DOM properties — `children` most of all — so\n`props: (item) => item` throws `Cannot set property children` and the row is silently never\ncreated. Forward only the keys the child declares.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "await dom.reconcile(container, items, {\n  keyOf:     (item) => `row-${item.id}`,   // required: stable identity per item\n  component: 'Row',                      // required: built for new items\n  props:     (item) => ({ label: item.name }),\n  refresh:   (node, props) => { /* optional: replaces slice.setComponentProps */ },\n  equals:    Object.is,                    // optional: skip unchanged items\n});",
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

customElements.define('slice-domservicedocumentation', DomServiceDocumentation);
