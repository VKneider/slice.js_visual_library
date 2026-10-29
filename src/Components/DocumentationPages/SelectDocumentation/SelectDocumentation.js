export default class SelectDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Searchable, grouped, with descriptions","expected":"type to filter; groups keep their headings; France is disabled","kind":"script","content":"const select = await slice.build('Select', {\n  label: 'Country',\n  placeholder: 'Type to search',\n  searchable: true,\n  clearable: true,\n  options: [\n    {\n      label: 'Americas', options: [\n        { value: 'ar', label: 'Argentina', description: 'Buenos Aires' },\n        { value: 'br', label: 'Brasil', description: 'Brasília' },\n        { value: 'mx', label: 'México', description: 'Ciudad de México' },\n        { value: 've', label: 'Venezuela', description: 'Caracas' }\n      ]\n    },\n    {\n      label: 'Europe', options: [\n        { value: 'es', label: 'España', description: 'Madrid' },\n        { value: 'fr', label: 'France', description: 'Not available yet', disabled: true }\n      ]\n    }\n  ],\n  selected: 've'\n});\nselect.style.maxWidth = '320px';\nreturn select;"},{"label":"Multiple with chips, Select all and a limit","expected":"picks show as chips; at most three","kind":"script","content":"const result = document.createElement('p');\nconst select = await slice.build('Select', {\n  label: 'Skills (up to 3)',\n  multiple: true,\n  searchable: true,\n  selectAll: true,\n  max: 3,\n  options: ['JavaScript', 'TypeScript', 'CSS', 'Node.js', 'Rust', 'Go'],\n  selected: ['JavaScript', 'CSS'],\n  onChange: (values) => { result.textContent = `Selected: ${values.join(', ') || 'none'}`; }\n});\nselect.style.maxWidth = '360px';\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(select, result);\nreturn box;"},{"label":"Creatable tags","expected":"type a new tag and press Enter to create it","kind":"script","content":"const select = await slice.build('Select', {\n  label: 'Tags',\n  multiple: true,\n  creatable: true,\n  options: ['bug', 'feature', 'docs'],\n  selected: ['bug'],\n  help: 'Type a tag that does not exist and press Enter'\n});\nselect.style.maxWidth = '360px';\nreturn select;"},{"label":"Options from a server","expected":"typing asks a (simulated) server; Loading… shows meanwhile","kind":"script","content":"const people = ['Ana López', 'Andrés Pérez', 'Beatriz Ruiz', 'Bruno Díaz', 'Carla Méndez', 'Carlos Rivas', 'Daniela Torres'];\nconst select = await slice.build('Select', {\n  label: 'Assignee',\n  placeholder: 'Type a name',\n  clearable: true,\n  loadOptions: async (query, { signal }) => {\n    await new Promise((resolve) => setTimeout(resolve, 500));\n    if (signal.aborted) return [];\n    return people\n      .filter((name) => name.toLowerCase().includes(query.toLowerCase()))\n      .map((name) => ({ value: name.toLowerCase().replace(/\\s+/g, '-'), label: name }));\n  }\n});\nselect.style.maxWidth = '320px';\nreturn select;"},{"label":"Variants, sizes and states","expected":"outlined, filled and ghost; small and large; an error and a hint","kind":"script","content":"const grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px 16px;width:100%';\nconst options = ['Draft', 'In review', 'Published'];\nconst fields = [\n  { label: 'Outlined', variant: 'outlined', selected: 'Draft' },\n  { label: 'Filled', variant: 'filled', selected: 'In review' },\n  { label: 'Ghost', variant: 'ghost', selected: 'Published' },\n  { label: 'Small', size: 'sm' },\n  { label: 'Large', size: 'lg', help: 'A hint under the field' },\n  { label: 'Status', required: true, error: 'Choose a status to continue' }\n];\nfor (const props of fields) grid.appendChild(await slice.build('Select', { options, ...props }));\nreturn grid;"},{"label":"5,000 options","expected":"the list scrolls smoothly; type a letter to jump","kind":"script","content":"const options = Array.from({ length: 5000 }, (_, i) => ({ value: i + 1, label: `Order #${String(i + 1).padStart(5, '0')}` }));\nconst select = await slice.build('Select', { label: 'Order', options, searchable: true });\nselect.style.maxWidth = '320px';\nreturn select;"}];
  }

  async init() {
    this.markdownPath = "select.md";
    this.markdownContent = "---\ntitle: Select\nroute: /docs/input/select\nnavLabel: Select\nsection: Input Components\ngroup: Basic\norder: 12\ndescription: Combobox with search, groups, multiple selection with chips, creatable options, server-loaded options and virtual scrolling.\ncomponent: SelectDocumentation\ngenerate: true\ntags: [select, combobox, forms, multiselect, autocomplete]\n---\n\n# Select\n\n## Overview\n`Select` lets people pick one value, or several, from a list. The list can be searched, grouped, loaded from a server as they type, extended by typing something new, and long enough to need virtual scrolling. The field follows the WAI-ARIA combobox pattern, so it works from the keyboard and with screen readers. The list floats above everything, so a parent with `overflow: hidden` never clips it.\n\n## Options\n`options` is an array of strings, numbers or objects:\n\n- `{ value, label }`: `value` is what you get back and `label` is what is shown. `text`, or whatever `visibleProp` names, also works as the label. An object without a `value` uses its `id`, else its label.\n- `disabled`, `icon` (an `Icon` name) and `description` (a quieter second line) are optional on any option.\n- `{ label, options: [...] }` is a group under a small heading.\n\n## Value\n- `selected` is the clean way to read and set it: the option's value for a single select, an array of values for `multiple`, `null` (or `[]`) when empty.\n- `selectedOptions` gives you the option objects you passed in, in the order they were picked.\n- `value` keeps its old shape for existing code: the option object (single), an array of them (multiple), or `[]` when empty.\n- Setting `selected` or `value` accepts any form: a value, an array of values, an option object, or an array of them. The order of the props does not matter; a value given before the options waits for them.\n- `onChange(selected, selectedOptions)` fires on every change, with `this` set to the Select. `onOptionSelect` is its older name.\n- `open()`, `close()`, `clear()` and `focus()` work from code. `isOpen` tells you whether the list is open.\n\n## Behavior\n- **Keyboard**:\n  - **↓ / ↑** open the list and move through it, skipping disabled options; **PageUp / PageDown** jump.\n  - **Enter** picks the highlighted option. **Escape** closes the list, or clears a `clearable` field.\n  - **Tab** leaves.\n  - In a field you cannot type in, letters jump to the matching option.\n- `searchable` filters as you type. Accents and capitals do not matter (\"espa\" finds \"España\"), and the matching text is highlighted.\n- `multiple` shows the picks as chips inside the field. Remove one with its ✕, or remove the last one with **Backspace**. The list stays open while you pick. `selectAll` adds a \"Select all\" row (a dash means some are picked) and `max` caps how many can be picked.\n- `creatable` offers \"Create …\" for text that matches no option. `onCreate(label)` can shape the new option, or return `false` to refuse it.\n- `loadOptions(query, { signal })` fetches options from a server. It runs when the list opens and again as the user types (after a short pause), and aborts the previous request. A loading row shows meanwhile. Values given before the options load keep their label.\n- Lists longer than 150 options render only the rows in view (`virtual: 'auto'`; `'on'` and `'off'` force it).\n- `clearable` adds a ✕ that empties the field.\n- `name` writes hidden inputs, so a plain `<form>` submits the value(s).\n\n## Looks\n- `variant`: `'outlined'` (default), `'filled'` or `'ghost'`, the same names `Button` uses.\n- `size`: `'sm'`, `'md'` (default) or `'lg'`.\n- `label` floats above the field once there is a value or the list is open; `placeholder` shows inside the field after that.\n- `help` adds a hint under the field. `error` replaces the hint, marks the field invalid (`aria-invalid`) and turns it red. `required` adds an asterisk and `aria-required`.\n\n## Live Preview\n:::component name=\"Select\"\n{\n  \"label\": \"Framework\",\n  \"options\": [\n    { \"value\": \"slice\", \"label\": \"Slice.js\" },\n    { \"value\": \"react\", \"label\": \"React\" },\n    { \"value\": \"vue\", \"label\": \"Vue\" }\n  ]\n}\n:::\n\n## Prop Scenarios\n:::script label=\"Searchable, grouped, with descriptions\" expected=\"type to filter; groups keep their headings; France is disabled\"\nconst select = await slice.build('Select', {\n  label: 'Country',\n  placeholder: 'Type to search',\n  searchable: true,\n  clearable: true,\n  options: [\n    {\n      label: 'Americas', options: [\n        { value: 'ar', label: 'Argentina', description: 'Buenos Aires' },\n        { value: 'br', label: 'Brasil', description: 'Brasília' },\n        { value: 'mx', label: 'México', description: 'Ciudad de México' },\n        { value: 've', label: 'Venezuela', description: 'Caracas' }\n      ]\n    },\n    {\n      label: 'Europe', options: [\n        { value: 'es', label: 'España', description: 'Madrid' },\n        { value: 'fr', label: 'France', description: 'Not available yet', disabled: true }\n      ]\n    }\n  ],\n  selected: 've'\n});\nselect.style.maxWidth = '320px';\nreturn select;\n:::\n\n:::script label=\"Multiple with chips, Select all and a limit\" expected=\"picks show as chips; at most three\"\nconst result = document.createElement('p');\nconst select = await slice.build('Select', {\n  label: 'Skills (up to 3)',\n  multiple: true,\n  searchable: true,\n  selectAll: true,\n  max: 3,\n  options: ['JavaScript', 'TypeScript', 'CSS', 'Node.js', 'Rust', 'Go'],\n  selected: ['JavaScript', 'CSS'],\n  onChange: (values) => { result.textContent = `Selected: ${values.join(', ') || 'none'}`; }\n});\nselect.style.maxWidth = '360px';\nconst box = document.createElement('div');\nbox.style.width = '100%';\nbox.append(select, result);\nreturn box;\n:::\n\n:::script label=\"Creatable tags\" expected=\"type a new tag and press Enter to create it\"\nconst select = await slice.build('Select', {\n  label: 'Tags',\n  multiple: true,\n  creatable: true,\n  options: ['bug', 'feature', 'docs'],\n  selected: ['bug'],\n  help: 'Type a tag that does not exist and press Enter'\n});\nselect.style.maxWidth = '360px';\nreturn select;\n:::\n\n:::script label=\"Options from a server\" expected=\"typing asks a (simulated) server; Loading… shows meanwhile\"\nconst people = ['Ana López', 'Andrés Pérez', 'Beatriz Ruiz', 'Bruno Díaz', 'Carla Méndez', 'Carlos Rivas', 'Daniela Torres'];\nconst select = await slice.build('Select', {\n  label: 'Assignee',\n  placeholder: 'Type a name',\n  clearable: true,\n  loadOptions: async (query, { signal }) => {\n    await new Promise((resolve) => setTimeout(resolve, 500));\n    if (signal.aborted) return [];\n    return people\n      .filter((name) => name.toLowerCase().includes(query.toLowerCase()))\n      .map((name) => ({ value: name.toLowerCase().replace(/\\s+/g, '-'), label: name }));\n  }\n});\nselect.style.maxWidth = '320px';\nreturn select;\n:::\n\n:::script label=\"Variants, sizes and states\" expected=\"outlined, filled and ghost; small and large; an error and a hint\"\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px 16px;width:100%';\nconst options = ['Draft', 'In review', 'Published'];\nconst fields = [\n  { label: 'Outlined', variant: 'outlined', selected: 'Draft' },\n  { label: 'Filled', variant: 'filled', selected: 'In review' },\n  { label: 'Ghost', variant: 'ghost', selected: 'Published' },\n  { label: 'Small', size: 'sm' },\n  { label: 'Large', size: 'lg', help: 'A hint under the field' },\n  { label: 'Status', required: true, error: 'Choose a status to continue' }\n];\nfor (const props of fields) grid.appendChild(await slice.build('Select', { options, ...props }));\nreturn grid;\n:::\n\n:::script label=\"5,000 options\" expected=\"the list scrolls smoothly; type a letter to jump\"\nconst options = Array.from({ length: 5000 }, (_, i) => ({ value: i + 1, label: `Order #${String(i + 1).padStart(5, '0')}` }));\nconst select = await slice.build('Select', { label: 'Order', options, searchable: true });\nselect.style.maxWidth = '320px';\nreturn select;\n:::\n\n## Best Practices\n:::tip\nUse `selected` and `onChange(selected)` in new code: you work with plain values (`'ve'`, `[1, 2]`) instead of option objects.\n:::\n\n:::tip\nTurn on `searchable` once a list has more than about ten options; nobody wants to scroll through 200 countries.\n:::\n\n## Pitfalls\n:::warning\n`loadOptions` replaces the options on every query. Keep your option values stable between queries (a database id, not an index), or a picked value will not be recognised when it comes back.\n:::\n\n:::warning\n`value` keeps returning option objects for compatibility. Reading `select.value.value` works for a single select but not for a multiple one; `selected` has no such trap.\n:::\n\n## Language\n\nThe built-in texts are `slice.select.*` keys with English and Spanish defaults, registered by\n`shared/text/texts.js` in the translator's lowest layer: an app dictionary always wins, and the\ncomponent keeps its English text when the translator is off.\nThe text prop `texts` still wins over the dictionary.\nKeys: `noResultsText`, `loadingText`, `remove`, `selectAll`, `clearSelection`, `create`.\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            let props = {};
            if ("{\n  \"label\": \"Framework\",\n  \"options\": [\n    { \"value\": \"slice\", \"label\": \"Slice.js\" },\n    { \"value\": \"react\", \"label\": \"React\" },\n    { \"value\": \"vue\", \"label\": \"Vue\" }\n  ]\n}") {
               try {
                  props = JSON.parse("{\n  \"label\": \"Framework\",\n  \"options\": [\n    { \"value\": \"slice\", \"label\": \"Slice.js\" },\n    { \"value\": \"react\", \"label\": \"React\" },\n    { \"value\": \"vue\", \"label\": \"Vue\" }\n  ]\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Select', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-8"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"selected\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"visibleProp\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"clearable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"selectAll\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"creatable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onCreate\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"loadOptions\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"virtual\",\"type\":\"string\",\"required\":false,\"default\":\"auto\",\"allowedValues\":[\"auto\",\"on\",\"off\"]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[\"outlined\",\"filled\",\"ghost\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"help\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"noResultsText\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"loadingText\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onOptionSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onOpenChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"options\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"value\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"selected\",\"type\":\"array\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"label\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"placeholder\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"visibleProp\",\"type\":\"string\",\"required\":false,\"default\":\"text\",\"allowedValues\":[]},{\"path\":\"multiple\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"searchable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"clearable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"disabled\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"required\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"selectAll\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"max\",\"type\":\"number\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"creatable\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"onCreate\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"loadOptions\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"virtual\",\"type\":\"string\",\"required\":false,\"default\":\"auto\",\"allowedValues\":[\"auto\",\"on\",\"off\"]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"outlined\",\"allowedValues\":[\"outlined\",\"filled\",\"ghost\"]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[\"sm\",\"md\",\"lg\"]},{\"path\":\"error\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"help\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"name\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"noResultsText\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"loadingText\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"texts\",\"type\":\"object\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onOptionSelect\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onOpenChange\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-selectdocumentation', SelectDocumentation);
