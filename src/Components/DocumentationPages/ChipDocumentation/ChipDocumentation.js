export default class ChipDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Chips","expected":"plain, accent and warning chips in a row","kind":"script","content":"const row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;';\n\nrow.appendChild(await slice.build('Chip', { label: 'All' }));\nrow.appendChild(await slice.build('Chip', { label: 'Active', variant: 'accent', icon: 'check' }));\nrow.appendChild(await slice.build('Chip', { label: 'Deprecated', variant: 'warning' }));\nrow.appendChild(await slice.build('Chip', { label: 'Archived', variant: 'neutral', size: 'sm' }));\nreturn row;"},{"label":"Removable chips","expected":"clicking the x reports which chip was removed","kind":"script","content":"const log = document.createElement('p');\nlog.textContent = 'Nothing removed yet';\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';\n\nfor (const label of ['Vue', 'React', 'Svelte']) {\n   row.appendChild(await slice.build('Chip', {\n      label,\n      removable: true,\n      onRemove: (removed) => { log.textContent = `Removed: ${removed}`; },\n   }));\n}\n\nconst wrap = document.createElement('div');\nwrap.appendChild(row);\nwrap.appendChild(log);\nreturn wrap;"}];
  }

  async init() {
    this.markdownPath = "chip.md";
    this.markdownContent = "---\ntitle: Chip\nroute: /docs/display/chip\nnavLabel: Chip\nsection: Display\ngroup: Basic\norder: 26\ndescription: Compact label for filters, tags and selections, optionally removable.\ncomponent: ChipDocumentation\ngenerate: true\ntags: [chip, tag, pill, filter, removable]\n---\n\n# Chip\n\n## Overview\n\nA `Chip` is a compact label for a filter, a tag, or a selected value in a multi-select. It sits\ninline, wraps long text with an ellipsis, and can carry an icon and a remove affordance.\n\nFor a read-only status pill, use `Badge` instead — a Badge carries state, a Chip carries a\nselection you can act on.\n\n## API\n\n- `label` (string)\n- `icon` (string) — an `Icon` name; empty renders no glyph\n- `variant` (`neutral` | `accent` | `success` | `warning` | `danger`, default `neutral`)\n- `size` (`sm` | `md`, default `md`)\n- `disabled` (boolean)\n- `removable` (boolean) — renders a real `<button>` remove affordance\n- `removeLabel` (string, default `\"Remove\"`) — used for the button's `aria-label` and tooltip\n- `onRemove` (function) — called with the chip's `label`\n\nThe remove button is labelled `\"<removeLabel>: <label>\"`, so a screen-reader user hears *which* chip\nthey are removing rather than a list of identical \"Remove\" buttons.\n\n## Prop Scenarios\n\n:::script label=\"Chips\" expected=\"plain, accent and warning chips in a row\"\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;';\n\nrow.appendChild(await slice.build('Chip', { label: 'All' }));\nrow.appendChild(await slice.build('Chip', { label: 'Active', variant: 'accent', icon: 'check' }));\nrow.appendChild(await slice.build('Chip', { label: 'Deprecated', variant: 'warning' }));\nrow.appendChild(await slice.build('Chip', { label: 'Archived', variant: 'neutral', size: 'sm' }));\nreturn row;\n:::\n\n:::script label=\"Removable chips\" expected=\"clicking the x reports which chip was removed\"\nconst log = document.createElement('p');\nlog.textContent = 'Nothing removed yet';\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8rem;color:var(--font-secondary-color);margin-top:10px;';\n\nconst row = document.createElement('div');\nrow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';\n\nfor (const label of ['Vue', 'React', 'Svelte']) {\n   row.appendChild(await slice.build('Chip', {\n      label,\n      removable: true,\n      onRemove: (removed) => { log.textContent = `Removed: ${removed}`; },\n   }));\n}\n\nconst wrap = document.createElement('div');\nwrap.appendChild(row);\nwrap.appendChild(log);\nreturn wrap;\n:::\n\n## Best Practices\n\n:::tip\nUse `Chip` for things the user chose and can remove, `Badge` for things the system decided. Mixing\nthe two makes it unclear whether a pill is clickable.\n:::\n\n## Pitfalls\n\n:::warning\nA Chip is not draggable. To reorder a list of chips, register them with `DragDropService` yourself —\nsorting is a container concern, not something a chip should own.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"neutral\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"removable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"removeLabel\",\"type\":\"string\",\"required\":false,\"default\":\"Remove\",\"allowedValues\":[]},{\"path\":\"onRemove\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"neutral\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"removable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"removeLabel\",\"type\":\"string\",\"required\":false,\"default\":\"Remove\",\"allowedValues\":[]},{\"path\":\"onRemove\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-chipdocumentation', ChipDocumentation);
