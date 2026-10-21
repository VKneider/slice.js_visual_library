export default class DomServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"A reconciled list","expected":"three badges; add, reverse or remove with the buttons below","kind":"script","content":"// singleton: true is what you want for a stateless service like this one —\r\n// every script on the page shares the same instance instead of registering a\r\n// new one each time.\r\nconst dom = await slice.build('DomService', { singleton: true });\r\n\r\nconst store = [\r\n  { id: 'design', label: 'Design' },\r\n  { id: 'build', label: 'Build' },\r\n  { id: 'ship', label: 'Ship' },\r\n];\r\n\r\nconst list = document.createElement('div');\r\nlist.id = 'reconcile-demo-list';\r\nlist.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:flex-start;font-family:system-ui,sans-serif;';\r\n\r\nconst render = () => dom.reconcile(list, store, {\r\n  keyOf: (item) => `demo-chip-${item.id}`,\r\n  component: 'Badge',\r\n  props: (item) => ({ label: item.label, variant: 'accent' }),\r\n});\r\n\r\nconst controls = document.createElement('div');\r\ncontrols.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;';\r\n\r\nconst add = await slice.build('Button', {\r\n  value: 'Add item',\r\n  size: 'sm',\r\n  onClick: async () => {\r\n    store.push({ id: `n${Date.now()}`, label: `Item ${store.length + 1}` });\r\n    await render();\r\n  },\r\n});\r\n\r\nconst reverse = await slice.build('Button', {\r\n  value: 'Reverse',\r\n  size: 'sm',\r\n  variant: 'outlined',\r\n  onClick: async () => {\r\n    store.reverse();\r\n    await render();\r\n  },\r\n});\r\n\r\nconst drop = await slice.build('Button', {\r\n  value: 'Remove first',\r\n  size: 'sm',\r\n  variant: 'danger',\r\n  onClick: async () => {\r\n    store.shift();\r\n    await render();\r\n  },\r\n});\r\n\r\ncontrols.appendChild(add);\r\ncontrols.appendChild(reverse);\r\ncontrols.appendChild(drop);\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(controls);\r\nwrap.appendChild(list);\r\n\r\nawait render();\r\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "dom-service.md";
    this.markdownContent = "---\r\ntitle: DomService\r\nroute: /docs/services/dom-service\r\nnavLabel: DomService\r\nsection: Services\r\ngroup: Rendering\r\norder: 62\r\ndescription: Reconciles a list of data against the child components that render it, without leaking.\r\ncomponent: DomServiceDocumentation\r\ngenerate: true\r\ntags: [dom, list, reconcile, reconcile, rendering, service]\r\n---\r\n\r\n# DomService\r\n\r\n## Overview\r\n\r\n`DomService.reconcile()` is the canonical way to render a variable-length list of child components.\r\nGive it your data and a stable key per item; it keeps the DOM, the component registry and the\r\ndestroy lifecycle in sync.\r\n\r\n## Why it exists\r\n\r\nThe two obvious alternatives are both broken, in ways that only show up as a slow memory leak:\r\n\r\n- `container.innerHTML = ''` removes nodes **without running `beforeDestroy()`**. Every child's\r\n  document/window listeners, timers and registry entry survive. The framework never gets to clean up.\r\n- Re-creating a node (rather than moving it) re-runs its constructor and does the same thing.\r\n\r\nSo `reconcile` does three things, in this order:\r\n\r\n1. **Refresh in place.** For each item, find the existing node by its stable `sliceId` and update it.\r\n   Only a genuinely new item is built.\r\n2. **Prune.** Every child whose data is gone is destroyed with `slice.controller.destroyComponent`,\r\n   which runs `beforeDestroy()`. This happens **before** reordering so a dead node is never a\r\n   reorder target.\r\n3. **Enforce order, with the fewest moves.** The DOM is moved to match `items`. `insertBefore` **moves** a node, it does not clone it, so no constructor re-runs. The nodes already in the right relative order (the longest increasing run of their current positions) stay put and only the rest move: moving the first item to the end is one move, not one per item. That matters beyond speed — a moved node loses keyboard focus and restarts its CSS animations.\r\n\r\n## Concurrency: renders queue per container, and coalesce\r\n\r\n`reconcile` keeps one queue per container in a `WeakMap`. A render that arrives while another is\r\nstill running waits for it instead of interleaving — otherwise the second could prune a node the first\r\nhad just ordered, or both could decide to build the same id.\r\n\r\nRenders that are still **waiting** coalesce: if three calls arrive while one is running, only the\r\nnewest of the three is applied, and all three callers resolve when it is. A filter box that re-renders\r\na list on every keystroke therefore applies the last keystroke, not every intermediate one.\r\n\r\nTwo details worth knowing, because both were bugs first:\r\n\r\n- The chain continues on **failure**. `then(run, run)` rather than `then(run)`, so one bad render\r\n  cannot freeze every later render on that container.\r\n- The chain is **dropped when it drains**. A long-lived list does not accumulate one promise per\r\n  update.\r\n\r\nThe promise `reconcile` returns resolves once the DOM reflects *this* call's items or a newer call's.\r\nSo `await dom.reconcile(...)` really does mean \"the DOM is at least this fresh\". A render that was\r\nsuperseded before it started is never applied — its own `refresh` and `props` callbacks do not run.\r\n\r\n## Adoption, and a build that returns nothing\r\n\r\nBefore paying for a build, `reconcile` looks for a **direct child** with `slice-id=\"<key>\"` and adopts\r\nit (never a node nested deeper, which belongs to an inner list). The registry can lose track of a node — a build that failed part-way, a child the consumer\r\npre-rendered and appended by hand — while the DOM still holds it, and building it again would throw\r\n`already registered`.\r\n\r\nFor the same reason the final ordered list is assembled from the nodes that actually exist rather\r\nthan from the slots that were requested: `slice.build` legitimately returns nothing for an\r\nunregistered component name, and that must not shift every sibling by one.\r\n\r\n## Cost of a cold list\r\n\r\nThe **first** build is awaited on its own, because it warms the template cache; the rest then run in\r\nparallel. A cold list of *n* rows therefore costs **one** fetch per component type, not *n*.\r\n\r\n## API\r\n\r\n```js\r\nawait dom.reconcile(container, items, {\r\n  keyOf:     (item) => `row-${item.id}`,   // required: stable identity per item\r\n  component: 'Row',                      // required: built for new items\r\n  props:     (item) => ({ label: item.name }),\r\n  refresh:   (node, props) => { /* optional: replaces slice.setComponentProps */ },\r\n  equals:    Object.is,                    // optional: skip unchanged items\r\n});\r\n```\r\n\r\n- `keyOf(item)` — **the identity used across renders.** Derive it from a stable id, never from the\r\n  array index: an index key makes item 1 keep its component (and its state) when it becomes item 2.\r\n  It is also used to **adopt** an existing node, so it must be unique across the whole page, not just\r\n  within this list — two lists using `row-1` will fight over the same key.\r\n- `props(item)` — the props for one item.\r\n- `refresh(node, props)` — replaces the default `slice.setComponentProps(node, props)`. Use it when\r\n  props are interdependent, or when the child builds sub-components asynchronously and needs its own\r\n  `update()` in a specific order.\r\n- `equals(previous, next)` — optional. When it returns `true` for an item's data from the last render and its data now, that node is **not** refreshed (and `props(item)` is not called for it). Without it, every surviving node is refreshed on every render. Pass `Object.is` when you update data immutably (a changed row is a new object): re-rendering 1,000 rows after editing one then refreshes one. Do **not** use `Object.is` if you mutate item objects in place — the mutated row would look unchanged.\r\n\r\n`dom.destroyChildren(container)` tears down every registered child at once.\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"A reconciled list\" expected=\"three badges; add, reverse or remove with the buttons below\"\r\n// singleton: true is what you want for a stateless service like this one —\r\n// every script on the page shares the same instance instead of registering a\r\n// new one each time.\r\nconst dom = await slice.build('DomService', { singleton: true });\r\n\r\nconst store = [\r\n  { id: 'design', label: 'Design' },\r\n  { id: 'build', label: 'Build' },\r\n  { id: 'ship', label: 'Ship' },\r\n];\r\n\r\nconst list = document.createElement('div');\r\nlist.id = 'reconcile-demo-list';\r\nlist.style.cssText = 'display:flex;flex-direction:column;gap:8px;align-items:flex-start;font-family:system-ui,sans-serif;';\r\n\r\nconst render = () => dom.reconcile(list, store, {\r\n  keyOf: (item) => `demo-chip-${item.id}`,\r\n  component: 'Badge',\r\n  props: (item) => ({ label: item.label, variant: 'accent' }),\r\n});\r\n\r\nconst controls = document.createElement('div');\r\ncontrols.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;';\r\n\r\nconst add = await slice.build('Button', {\r\n  value: 'Add item',\r\n  size: 'sm',\r\n  onClick: async () => {\r\n    store.push({ id: `n${Date.now()}`, label: `Item ${store.length + 1}` });\r\n    await render();\r\n  },\r\n});\r\n\r\nconst reverse = await slice.build('Button', {\r\n  value: 'Reverse',\r\n  size: 'sm',\r\n  variant: 'outlined',\r\n  onClick: async () => {\r\n    store.reverse();\r\n    await render();\r\n  },\r\n});\r\n\r\nconst drop = await slice.build('Button', {\r\n  value: 'Remove first',\r\n  size: 'sm',\r\n  variant: 'danger',\r\n  onClick: async () => {\r\n    store.shift();\r\n    await render();\r\n  },\r\n});\r\n\r\ncontrols.appendChild(add);\r\ncontrols.appendChild(reverse);\r\ncontrols.appendChild(drop);\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(controls);\r\nwrap.appendChild(list);\r\n\r\nawait render();\r\nmount(wrap);\r\n:::\r\n\r\n## Best Practices\r\n\r\n:::tip\r\nWith immutable data, pass `equals: Object.is`. Re-rendering a long list after one row changes then\r\ntouches one node instead of all of them.\r\n:::\r\n\r\n:::tip\r\nKeys are page-wide `sliceId`s, not per-container. That is what lets an item **move between two\r\nlists** (a kanban column to another) and keep its component and state: reconcile the destination,\r\nthen the source. It is also why two unrelated lists must not share key prefixes.\r\n:::\r\n\r\n:::tip\r\nCall `reconcile` after every change to the data — a push, a filter, a re-sort — and nowhere else.\r\nConcurrent calls on the same container are queued rather than fought over, but two *different*\r\ndata sources reconciling one container is still a design error: each will prune what the other\r\njust built.\r\n:::\r\n\r\n:::tip\r\n`await` the call. The promise resolves after this render **and** any render already queued on the\r\ncontainer, so a mutation that triggers two `reconcile` calls can still `await` once and know the DOM\r\nmatches.\r\n:::\r\n\r\n:::tip\r\nReuse an item **object** across renders rather than rebuilding it, if the child keys off identity\r\nthe object carries. `TreeView` keeps a `WeakMap` from item to a generated id for items with no\r\n`path` or `id` of their own, because an index key would hand item 0's component — and its\r\nopen/closed state — to whatever took its place after a splice.\r\n:::\r\n\r\n## Pitfalls\r\n\r\n:::warning\r\nDo not use the array index as `keyOf`. With an index key, inserting at the front makes item 1 inherit\r\nitem 0's component — and its scroll position, its open/closed state, and its focus.\r\n:::\r\n\r\n:::warning\r\n`reconcile` only manages **direct** children that carry a `slice-id`. Anything you append by hand\r\ninside the container is left alone; wrap it if it should be reconciled with the data.\r\n:::\r\n\r\n:::warning\r\nNever spread an item straight into `props`. `props(item)` is assigned by name onto the element, and\r\nseveral common field names are getter-only DOM properties — `children` most of all — so\r\n`props: (item) => item` throws `Cannot set property children` and the row is silently never\r\ncreated. Forward only the keys the child declares.\r\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "await dom.reconcile(container, items, {\r\n  keyOf:     (item) => `row-${item.id}`,   // required: stable identity per item\r\n  component: 'Row',                      // required: built for new items\r\n  props:     (item) => ({ label: item.name }),\r\n  refresh:   (node, props) => { /* optional: replaces slice.setComponentProps */ },\r\n  equals:    Object.is,                    // optional: skip unchanged items\r\n});\r",
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
