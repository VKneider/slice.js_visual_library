export default class StoreServiceDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Create, read, write","expected":"a counter that survives a reload","kind":"script","content":"const store = await slice.build('StoreService', { singleton: true });\r\n\r\n// Only the FIRST call creates; calling again is a no-op, so a service can\r\n// `ensure` its own context from init() without knowing who ran first.\r\nstore.ensure('demo-counter', { count: 0 });\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;align-items:flex-start;font-family:system-ui,sans-serif;';\r\n\r\nconst readout = document.createElement('p');\r\nreadout.style.cssText = 'font-size:1.1rem;font-weight:700;margin:0;';\r\nconst paint = () => { readout.textContent = `count: ${store.get('demo-counter').count}`; };\r\n\r\nconst inc = await slice.build('Button', {\r\n  value: '+1',\r\n  onClick: () => { store.set('demo-counter', (prev) => ({ ...prev, count: prev.count + 1 })); paint(); },\r\n});\r\n\r\nconst reset = await slice.build('Button', {\r\n  value: 'Reset',\r\n  size: 'sm',\r\n  variant: 'outlined',\r\n  onClick: () => { store.set('demo-counter', { count: 0 }); paint(); },\r\n});\r\n\r\npaint();\r\nwrap.appendChild(readout);\r\nwrap.appendChild(inc);\r\nwrap.appendChild(reset);\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Persisted: reload the page and the count survives.';\r\nnote.style.cssText = 'font-size:.75rem;color:var(--font-secondary-color);margin:0;';\r\nwrap.appendChild(note);\r\n\r\nmount(wrap);"}];
  }

  async init() {
    this.markdownPath = "store-service.md";
    this.markdownContent = "---\r\ntitle: StoreService\r\nroute: /docs/services/store-service\r\nnavLabel: StoreService\r\nsection: Services\r\ngroup: State\r\norder: 63\r\ndescription: A thin facade over slice.context, so context persistence is configured in one place.\r\ncomponent: StoreServiceDocumentation\r\ngenerate: true\r\ntags: [store, context, state, persistence, service]\r\n---\r\n\r\n# StoreService\r\n\r\n## Overview\r\n\r\nA small facade over `slice.context`. It exists so context **persistence is configured in one place**\r\ninstead of every state-owning service repeating `create(name, initial, { persist: true, ... })`.\r\n\r\nBuild it first in your composition root, then recover it anywhere with\r\n`slice.getComponent('StoreService')`.\r\n\r\n## API\r\n\r\n- `ensure(name, initialState, storageKey)` — create the context only if it does not exist. Idempotent.\r\n- `has(name)` / `get(name)`\r\n- `set(name, updater)` — `updater` is `(prev) => next`, the same contract as `slice.context.setState`.\r\n- `watch(name, component, callback, selector)` — subscribe a component to a slice of state.\r\n\r\nWatchers registered **with a component** are cleaned up automatically when it is destroyed — do not\r\nunwatch by hand. `selector` narrows the callback, so the watcher only fires when the relevant part\r\nchanges rather than on every write.\r\n\r\n## Prop Scenarios\r\n\r\n:::script label=\"Create, read, write\" expected=\"a counter that survives a reload\"\r\nconst store = await slice.build('StoreService', { singleton: true });\r\n\r\n// Only the FIRST call creates; calling again is a no-op, so a service can\r\n// `ensure` its own context from init() without knowing who ran first.\r\nstore.ensure('demo-counter', { count: 0 });\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;align-items:flex-start;font-family:system-ui,sans-serif;';\r\n\r\nconst readout = document.createElement('p');\r\nreadout.style.cssText = 'font-size:1.1rem;font-weight:700;margin:0;';\r\nconst paint = () => { readout.textContent = `count: ${store.get('demo-counter').count}`; };\r\n\r\nconst inc = await slice.build('Button', {\r\n  value: '+1',\r\n  onClick: () => { store.set('demo-counter', (prev) => ({ ...prev, count: prev.count + 1 })); paint(); },\r\n});\r\n\r\nconst reset = await slice.build('Button', {\r\n  value: 'Reset',\r\n  size: 'sm',\r\n  variant: 'outlined',\r\n  onClick: () => { store.set('demo-counter', { count: 0 }); paint(); },\r\n});\r\n\r\npaint();\r\nwrap.appendChild(readout);\r\nwrap.appendChild(inc);\r\nwrap.appendChild(reset);\r\n\r\nconst note = document.createElement('p');\r\nnote.textContent = 'Persisted: reload the page and the count survives.';\r\nnote.style.cssText = 'font-size:.75rem;color:var(--font-secondary-color);margin:0;';\r\nwrap.appendChild(note);\r\n\r\nmount(wrap);\r\n:::\r\n\r\n## Best Practices\r\n\r\n:::tip\r\nOne context per domain concept, not per screen: a `settings` context everyone reads beats three\r\ncopies of the same preferences that can drift apart.\r\n:::\r\n\r\n## Pitfalls\r\n\r\n:::warning\r\n`ensure` is create-if-absent, **not** a migration helper. Adding a key to a context's `initialState`\r\nafter release does not backfill it for a returning user — their stored copy is already there. Shape\r\nmigrations belong in the service that owns that state, in its own `init()`.\r\n:::";
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

customElements.define('slice-storeservicedocumentation', StoreServiceDocumentation);
