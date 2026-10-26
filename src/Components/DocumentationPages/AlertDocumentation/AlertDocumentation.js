export default class AlertDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"After saving a form","expected":"a short profile form; Save shows a soft success alert above it for 4 seconds ('Profile saved'); with an empty name it shows a danger alert with the problem instead, which stays until it is closed","kind":"script","content":"const status = await slice.build('Alert', { open: false, dismissible: true });\nconst name = await slice.build('Input', { label: 'Name', value: 'Ana López' });\nconst email = await slice.build('Input', { label: 'Email', value: 'ana@acme.com', type: 'email' });\nconst save = await slice.build('Button', {\n  value: 'Save',\n  variant: 'filled',\n  onClick: () => {\n    if (!name.value.trim()) {\n      status.show({ tone: 'danger', title: 'The profile was not saved', message: 'Write a name first.', timeout: 0 });\n      return;\n    }\n    status.show({ tone: 'success', title: 'Profile saved', message: '', timeout: 4000 });\n  }\n});\nconst form = document.createElement('div');\nform.style.cssText = 'display:grid;gap:12px;width:100%;max-width:420px';\nform.append(status, name, email, save);\nreturn form;"},{"label":"Undo over a list","expected":"a list of three files with a Delete button each; Delete removes the file and a dark alert says 'report.pdf removed' with Undo for five seconds; Undo brings it back; if the time runs out the line below says it was deleted for good","kind":"script","content":"let files = ['report.pdf', 'budget.xlsx', 'photo.png'];\nconst list = document.createElement('ul');\nlist.style.cssText = 'display:grid;gap:6px;margin:0;padding:0;list-style:none';\nconst log = document.createElement('p');\nlog.style.cssText = 'margin:0;font-size:.85rem;opacity:.75';\nconst notice = await slice.build('Alert', { open: false, size: 'sm' });\n\nconst paint = async () => {\n  slice.controller.destroyByContainer(list);\n  list.replaceChildren();\n  for (const file of files) {\n    const li = document.createElement('li');\n    li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--primary-color) 6%,transparent)';\n    li.textContent = file;\n    li.append(await slice.build('Button', { value: 'Delete', variant: 'ghost', size: 'sm', onClick: () => remove(file) }));\n    list.append(li);\n  }\n};\nconst remove = (file) => {\n  const before = files;\n  files = files.filter((f) => f !== file);\n  paint();\n  notice.show({\n    tone: 'neutral', variant: 'filled', message: `${file} removed`, timeout: 5000, dismissible: true,\n    actions: [{ label: 'Undo', onClick: () => { files = before; paint(); } }],\n    onDismiss: ({ reason }) => { if (reason !== 'action') log.textContent = `${file} was deleted for good.`; }\n  });\n};\nawait paint();\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:420px';\nbox.append(notice, list, log);\nreturn box;"},{"label":"Account notices","expected":"three alerts stacked: an outlined warning 'Your trial ends in 3 days' with an Upgrade button, an info alert about scheduled maintenance that can be closed, and a filled danger alert 'Payment failed' with Update card and Contact support buttons","kind":"script","content":"const toasts = await slice.build('ToastProvider', { singleton: true });\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:640px';\nbox.append(\n  await slice.build('Alert', {\n    tone: 'warning', variant: 'outlined', title: 'Your trial ends in 3 days',\n    message: 'Upgrade to keep your projects and your team.',\n    actions: [{ label: 'Upgrade', variant: 'filled', keepOpen: true, onClick: () => toasts.show('Opening plans…') }]\n  }),\n  await slice.build('Alert', {\n    tone: 'info', dismissible: true,\n    message: 'Maintenance on Sunday from 02:00 to 03:00 (UTC-4). The app will be read-only.'\n  }),\n  await slice.build('Alert', {\n    tone: 'danger', variant: 'filled', title: 'Payment failed',\n    message: 'We could not charge the card ending in 4242.',\n    actions: [\n      { label: 'Update card', keepOpen: true, onClick: () => toasts.show('Card form') },\n      { label: 'Contact support', keepOpen: true, onClick: () => toasts.show('Support chat') }\n    ]\n  })\n);\nreturn box;"},{"label":"Tones and variants","expected":"a grid of five tones in soft, filled and outlined, each with a title and a message","kind":"script","content":"const grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;width:100%';\nfor (const variant of ['soft', 'filled', 'outlined']) {\n  for (const tone of ['neutral', 'info', 'success', 'warning', 'danger']) {\n    grid.append(await slice.build('Alert', { tone, variant, size: 'sm', title: `${tone} · ${variant}`, message: 'A short message.' }));\n  }\n}\nreturn grid;"}];
  }

  async init() {
    this.markdownPath = "alert.md";
    this.markdownContent = "---\ntitle: Alert\nroute: /docs/feedback/alert\nnavLabel: Alert\nsection: Feedback\ngroup: Notifications\norder: 9\ndescription: A message inside the page, next to what it is about. Tone for the meaning, variant for the loudness; a title, actions such as Undo or Try again, a close button, and a timeout that waits while you point at it.\ncomponent: AlertDocumentation\ngenerate: true\ntags: [alert, notice, banner, callout, message, undo, feedback]\n---\n\n# Alert\n\n## Overview\n`Alert` is a message that sits in the page, next to what it talks about: \"Changes saved\" above a form, \"Your trial ends in 3 days\" at the top of the billing page, \"2 rows removed · Undo\" over a list, \"The report could not be loaded · Try again\" where the report should be.\n\nTwo choices, as in [Badge](/docs/display/badge) and [Button](/docs/input/button):\n\n- **`tone`** is what it **means**: `neutral`, `info` (the default), `success`, `warning`, `danger`.\n- **`variant`** is how **loud** it is: `soft` (a tint, the default), `filled` (for what must be seen now) or `outlined`.\n\n### When to use it\n- **The result of something done on this page**: saved, sent, failed, with what to do next.\n- **A state of the page or the account**: a trial ending, a read-only record, a sync in progress.\n- **An undo**: \"Row removed · Undo\" for a few seconds. [DataList](/docs/data/datalist) and [Table](/docs/data/table) use an Alert for exactly this.\n- **An error with a way out**: \"Could not load · Try again\".\n\n### When not to use it\n- **Something that happened elsewhere, or that should not move the layout**: a [Toast](/docs/feedback/toast) floats over the app and goes away.\n- **A question that needs an answer before going on**: a [Modal](/docs/feedback/modal) or [ConfirmActionModal](/docs/display/confirm-action-modal).\n- **A status in a row or next to a title**: a [Badge](/docs/display/badge).\n- **A field's error**: the field shows it ([Input](/docs/input/input) `error`).\n\n## Core Behavior\n- `title` and `message`. Either can be left out.\n- `icon`: the tone gives one (`neutral` has none); an Icon name replaces it; `false` removes it.\n- `actions: [{ label, onClick({ alert, event }), variant, icon, keepOpen }]`: [Button](/docs/input/button)s on the right. Using one closes the alert, unless it says `keepOpen`.\n- `dismissible`: a ✕ to close it (`dismissLabel` is what screen readers hear).\n- `timeout`: milliseconds until it closes by itself. The time **stops while the pointer or the focus is on it**, so nobody loses an Undo in the middle of reaching for it.\n- `onDismiss({ reason })`: why it closed: `'close'` (the ✕), `'timeout'`, `'action'` or `'api'` (`hide()` from code).\n- `danger` and `warning` interrupt a screen reader (`role=\"alert\"`); the others wait their turn (`role=\"status\"`).\n\n### One alert, many messages\nAn alert can be placed once and reused: `open: false` starts it hidden, `show({ … })` shows it with new content, `hide()` takes it away. The `onDismiss` given to `show()` is for that showing only, which is what an undo needs:\n\n```js\nnotice.show({\n  tone: 'neutral', variant: 'filled', message: 'Row removed', timeout: 5000, dismissible: true,\n  actions: [{ label: 'Undo', onClick: restore }],\n  // The time ran out or it was closed: the removal is final.\n  onDismiss: ({ reason }) => { if (reason !== 'action') deleteForGood(); },\n});\n```\n\n## Looks\n- `size`: `'md'` (default) or `'sm'`.\n- Every tone, in every variant, is measured against WCAG AA in the light and the dark theme. It uses the same tokens as Badge (`--success-color-readable` and the rest; see [Badge › Theming](/docs/display/badge)).\n\n## Live Preview\n:::component name=\"Alert\"\n{\n  \"tone\": \"success\",\n  \"title\": \"Changes saved\",\n  \"message\": \"Your profile is up to date.\",\n  \"dismissible\": true\n}\n:::\n\n## Examples\n:::script label=\"After saving a form\" expected=\"a short profile form; Save shows a soft success alert above it for 4 seconds ('Profile saved'); with an empty name it shows a danger alert with the problem instead, which stays until it is closed\"\nconst status = await slice.build('Alert', { open: false, dismissible: true });\nconst name = await slice.build('Input', { label: 'Name', value: 'Ana López' });\nconst email = await slice.build('Input', { label: 'Email', value: 'ana@acme.com', type: 'email' });\nconst save = await slice.build('Button', {\n  value: 'Save',\n  variant: 'filled',\n  onClick: () => {\n    if (!name.value.trim()) {\n      status.show({ tone: 'danger', title: 'The profile was not saved', message: 'Write a name first.', timeout: 0 });\n      return;\n    }\n    status.show({ tone: 'success', title: 'Profile saved', message: '', timeout: 4000 });\n  }\n});\nconst form = document.createElement('div');\nform.style.cssText = 'display:grid;gap:12px;width:100%;max-width:420px';\nform.append(status, name, email, save);\nreturn form;\n:::\n\n:::script label=\"Undo over a list\" expected=\"a list of three files with a Delete button each; Delete removes the file and a dark alert says 'report.pdf removed' with Undo for five seconds; Undo brings it back; if the time runs out the line below says it was deleted for good\"\nlet files = ['report.pdf', 'budget.xlsx', 'photo.png'];\nconst list = document.createElement('ul');\nlist.style.cssText = 'display:grid;gap:6px;margin:0;padding:0;list-style:none';\nconst log = document.createElement('p');\nlog.style.cssText = 'margin:0;font-size:.85rem;opacity:.75';\nconst notice = await slice.build('Alert', { open: false, size: 'sm' });\n\nconst paint = async () => {\n  slice.controller.destroyByContainer(list);\n  list.replaceChildren();\n  for (const file of files) {\n    const li = document.createElement('li');\n    li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--primary-color) 6%,transparent)';\n    li.textContent = file;\n    li.append(await slice.build('Button', { value: 'Delete', variant: 'ghost', size: 'sm', onClick: () => remove(file) }));\n    list.append(li);\n  }\n};\nconst remove = (file) => {\n  const before = files;\n  files = files.filter((f) => f !== file);\n  paint();\n  notice.show({\n    tone: 'neutral', variant: 'filled', message: `${file} removed`, timeout: 5000, dismissible: true,\n    actions: [{ label: 'Undo', onClick: () => { files = before; paint(); } }],\n    onDismiss: ({ reason }) => { if (reason !== 'action') log.textContent = `${file} was deleted for good.`; }\n  });\n};\nawait paint();\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:420px';\nbox.append(notice, list, log);\nreturn box;\n:::\n\n:::script label=\"Account notices\" expected=\"three alerts stacked: an outlined warning 'Your trial ends in 3 days' with an Upgrade button, an info alert about scheduled maintenance that can be closed, and a filled danger alert 'Payment failed' with Update card and Contact support buttons\"\nconst toasts = await slice.build('ToastProvider', { singleton: true });\nconst box = document.createElement('div');\nbox.style.cssText = 'display:grid;gap:10px;width:100%;max-width:640px';\nbox.append(\n  await slice.build('Alert', {\n    tone: 'warning', variant: 'outlined', title: 'Your trial ends in 3 days',\n    message: 'Upgrade to keep your projects and your team.',\n    actions: [{ label: 'Upgrade', variant: 'filled', keepOpen: true, onClick: () => toasts.show('Opening plans…') }]\n  }),\n  await slice.build('Alert', {\n    tone: 'info', dismissible: true,\n    message: 'Maintenance on Sunday from 02:00 to 03:00 (UTC-4). The app will be read-only.'\n  }),\n  await slice.build('Alert', {\n    tone: 'danger', variant: 'filled', title: 'Payment failed',\n    message: 'We could not charge the card ending in 4242.',\n    actions: [\n      { label: 'Update card', keepOpen: true, onClick: () => toasts.show('Card form') },\n      { label: 'Contact support', keepOpen: true, onClick: () => toasts.show('Support chat') }\n    ]\n  })\n);\nreturn box;\n:::\n\n:::script label=\"Tones and variants\" expected=\"a grid of five tones in soft, filled and outlined, each with a title and a message\"\nconst grid = document.createElement('div');\ngrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;width:100%';\nfor (const variant of ['soft', 'filled', 'outlined']) {\n  for (const tone of ['neutral', 'info', 'success', 'warning', 'danger']) {\n    grid.append(await slice.build('Alert', { tone, variant, size: 'sm', title: `${tone} · ${variant}`, message: 'A short message.' }));\n  }\n}\nreturn grid;\n:::\n\n## Best Practices\n:::tip\nSay what happened and what to do next, in that order: \"The report could not be loaded · Try again\". An alert with no way out leaves people stuck.\n:::\n\n:::tip\nKeep `filled` for what must be seen now (a failed payment, an undo). A page with several filled alerts has no priority left.\n:::\n\n## Pitfalls\n:::warning\nDo not put a `timeout` on an error. A problem that disappears before it was read is a problem nobody fixes.\n:::\n\n:::warning\nColour is not the message. Keep the words clear enough that the alert makes sense in grey.\n:::";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "notice.show({\n  tone: 'neutral', variant: 'filled', message: 'Row removed', timeout: 5000, dismissible: true,\n  actions: [{ label: 'Undo', onClick: restore }],\n  // The time ran out or it was closed: the removal is final.\n  onDismiss: ({ reason }) => { if (reason !== 'action') deleteForGood(); },\n});",
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
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            let props = {};
            if ("{\n  \"tone\": \"success\",\n  \"title\": \"Changes saved\",\n  \"message\": \"Your profile is up to date.\",\n  \"dismissible\": true\n}") {
               try {
                  props = JSON.parse("{\n  \"tone\": \"success\",\n  \"title\": \"Changes saved\",\n  \"message\": \"Your profile is up to date.\",\n  \"dismissible\": true\n}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('Alert', props);
            container.appendChild(component);
         }
       }
      {
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"tone\",\"type\":\"string\",\"required\":false,\"default\":\"info\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"soft\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"message\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"any\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"dismissible\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"dismissLabel\",\"type\":\"string\",\"required\":false,\"default\":\"Dismiss\",\"allowedValues\":[]},{\"path\":\"timeout\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"onDismiss\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"tone\",\"type\":\"string\",\"required\":false,\"default\":\"info\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"soft\",\"allowedValues\":[]},{\"path\":\"size\",\"type\":\"string\",\"required\":false,\"default\":\"md\",\"allowedValues\":[]},{\"path\":\"title\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"message\",\"type\":\"string\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"icon\",\"type\":\"any\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"actions\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"dismissible\",\"type\":\"boolean\",\"required\":false,\"default\":\"false\",\"allowedValues\":[]},{\"path\":\"dismissLabel\",\"type\":\"string\",\"required\":false,\"default\":\"Dismiss\",\"allowedValues\":[]},{\"path\":\"timeout\",\"type\":\"number\",\"required\":false,\"default\":\"0\",\"allowedValues\":[]},{\"path\":\"onDismiss\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"open\",\"type\":\"boolean\",\"required\":false,\"default\":\"true\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Badge","path":"/docs/display/badge"},{"text":"Button","path":"/docs/input/button"},{"text":"DataList","path":"/docs/data/datalist"},{"text":"Table","path":"/docs/data/table"},{"text":"Toast","path":"/docs/feedback/toast"},{"text":"Modal","path":"/docs/feedback/modal"},{"text":"ConfirmActionModal","path":"/docs/display/confirm-action-modal"},{"text":"Badge","path":"/docs/display/badge"},{"text":"Input","path":"/docs/input/input"},{"text":"Button","path":"/docs/input/button"},{"text":"Badge › Theming","path":"/docs/display/badge"}];
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

customElements.define('slice-alertdocumentation', AlertDocumentation);
