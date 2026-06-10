export default class FormDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Account form with sections, description & validation","expected":"validates required + email on submit","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Create account',\n  resetText: 'Reset',\n  schema: [\n    { kind: 'section', title: 'Account', description: 'How you sign in' },\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,\n      description: 'We never share it.',\n      validate: (v) => (/\\S+@\\S+\\.\\S+/.test(v) ? null : 'Enter a valid email') },\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n      required: true, props: { secret: true } },\n    { kind: 'separator' },\n    { kind: 'section', title: 'Preferences' },\n    { kind: 'field', name: 'newsletter', label: 'Email me product news',\n      component: 'Switch', valueProp: 'checked', value: true }\n  ],\n  onSubmit: (values) => console.log('submit', values)\n});\n\nreturn form;"},{"label":"Form inside a Modal","expected":"the form lives in the modal body","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Save',\n  schema: [\n    { kind: 'field', name: 'title', label: 'Title', component: 'Input', required: true },\n    { kind: 'field', name: 'pinned', label: 'Pin to top', component: 'Checkbox', valueProp: 'checked' }\n  ],\n  onSubmit: (values) => { console.log(values); modal.close(); }\n});\n\nconst modal = await slice.build('Modal', { title: 'New note', open: true });\nmodal.appendBody(form);\nreturn modal;"},{"label":"Profile form — Input + Select + Switch","expected":"mixed components, valueProp for the switch","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Save profile',\n  schema: [\n    { kind: 'section', title: 'Profile' },\n    { kind: 'field', name: 'fullName', label: 'Full name', component: 'Input', required: true },\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', required: true,\n      props: {\n        visibleProp: 'label',\n        searchable: true,\n        options: [\n          { label: 'Owner', value: 'owner' },\n          { label: 'Editor', value: 'editor' },\n          { label: 'Viewer', value: 'viewer' }\n        ]\n      } },\n    { kind: 'separator' },\n    { kind: 'field', name: 'twoFactor', label: 'Enable two-factor auth',\n      component: 'Switch', valueProp: 'checked', value: false }\n  ],\n  onSubmit: (values) => console.log('profile', values)\n});\n\nreturn form;"},{"label":"Cross-field validation (confirm password)","expected":"confirm must match password","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Set password',\n  schema: [\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n      required: true, props: { secret: true } },\n    { kind: 'field', name: 'confirm', label: 'Confirm password', component: 'Input',\n      required: true, props: { secret: true },\n      // the second arg is every current value — use it for cross-field rules\n      validate: (value, values) => (value === values.password ? null : 'Passwords do not match') }\n  ],\n  onSubmit: (values) => console.log('ok', values)\n});\n\nreturn form;"},{"label":"Server-side errors via setError()","expected":"onSubmit can flag a field after an async check","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Claim username',\n  schema: [\n    { kind: 'field', name: 'username', label: 'Username', component: 'Input', required: true,\n      description: 'Try \"admin\" to see a server-side error.' }\n  ],\n  onSubmit: async (values) => {\n    // pretend to hit an API\n    const taken = values.username.toLowerCase() === 'admin';\n    if (taken) {\n      form.setError('username', 'That username is already taken');\n    } else {\n      console.log('available', values.username);\n    }\n  }\n});\n\nreturn form;"},{"label":"Settings form with multiple sections","expected":"grouped fields with separators","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Apply settings',\n  resetText: 'Reset',\n  schema: [\n    { kind: 'section', title: 'Notifications', description: 'How we reach you' },\n    { kind: 'field', name: 'emailNotifs', label: 'Email notifications',\n      component: 'Checkbox', valueProp: 'checked', value: true },\n    { kind: 'field', name: 'smsNotifs', label: 'SMS notifications',\n      component: 'Checkbox', valueProp: 'checked', value: false },\n    { kind: 'separator' },\n    { kind: 'section', title: 'Display' },\n    { kind: 'field', name: 'density', label: 'Density', component: 'Select',\n      props: {\n        visibleProp: 'label',\n        options: [\n          { label: 'Comfortable', value: 'comfortable' },\n          { label: 'Compact', value: 'compact' }\n        ]\n      } }\n  ],\n  onSubmit: (values) => console.log('settings', values)\n});\n\nreturn form;"}];
  }

  async init() {
    this.markdownPath = "form.md";
    this.markdownContent = "---\ntitle: Form\nroute: /docs/input/form\nnavLabel: Form\nsection: Input Components\ngroup: Basic\norder: 5\ndescription: Declarative forms with sections, descriptions and validation, composed from Slice components.\ncomponent: FormDocumentation\ngenerate: true\ntags: [form, forms, validation, input]\n---\n\n# Form\n\n## Overview\n`Form` builds a form from a **schema** and composes the library's own components (`Input`, `Select`,\n`Checkbox`, `Switch`, …). It renders sections, separators, per-field labels/descriptions and validation\nerrors, reads the values back, and validates on submit. It is a plain Visual — drop it in a view or a\n`Modal` body.\n\n## Schema\nEach item is discriminated by `kind`:\n\n| `kind` | Fields | Renders |\n| --- | --- | --- |\n| `'section'` | `title`, `description` | a section header |\n| `'separator'` | — | a divider |\n| `'field'` (default) | see below | a labelled field wrapping a built component |\n\n**Field item:**\n- `name` — key in the values object.\n- `label`, `description` — field chrome rendered by the Form.\n- `component` — a Slice component name, built via `slice.build`.\n- `props` — props passed to that component.\n- `valueProp` — which prop holds the value (default `'value'`; use `'checked'` for `Checkbox`/`Switch`).\n- `value` — initial value (merged into `props` under `valueProp`).\n- `required` — `true` or a custom message.\n- `validate(value, values)` — returns an error string (falsy when valid). Runs on submit.\n\n## Methods\n| Method | Description |\n| --- | --- |\n| `submit()` | Validates; calls `onSubmit(values)` and returns `true` if valid. |\n| `validate()` | Runs validation, shows errors, returns a boolean. |\n| `getValues()` | `{ name: value }` read from each field's component. |\n| `setValue(name, value)` / `setError(name, msg)` / `clearErrors()` / `reset()` | Programmatic helpers. |\n\n## Prop Scenarios\n:::script label=\"Account form with sections, description & validation\" expected=\"validates required + email on submit\"\nconst form = await slice.build('Form', {\n  submitText: 'Create account',\n  resetText: 'Reset',\n  schema: [\n    { kind: 'section', title: 'Account', description: 'How you sign in' },\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,\n      description: 'We never share it.',\n      validate: (v) => (/\\S+@\\S+\\.\\S+/.test(v) ? null : 'Enter a valid email') },\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n      required: true, props: { secret: true } },\n    { kind: 'separator' },\n    { kind: 'section', title: 'Preferences' },\n    { kind: 'field', name: 'newsletter', label: 'Email me product news',\n      component: 'Switch', valueProp: 'checked', value: true }\n  ],\n  onSubmit: (values) => console.log('submit', values)\n});\n\nreturn form;\n:::\n\n:::script label=\"Form inside a Modal\" expected=\"the form lives in the modal body\"\nconst form = await slice.build('Form', {\n  submitText: 'Save',\n  schema: [\n    { kind: 'field', name: 'title', label: 'Title', component: 'Input', required: true },\n    { kind: 'field', name: 'pinned', label: 'Pin to top', component: 'Checkbox', valueProp: 'checked' }\n  ],\n  onSubmit: (values) => { console.log(values); modal.close(); }\n});\n\nconst modal = await slice.build('Modal', { title: 'New note', open: true });\nmodal.appendBody(form);\nreturn modal;\n:::\n\n:::script label=\"Profile form — Input + Select + Switch\" expected=\"mixed components, valueProp for the switch\"\nconst form = await slice.build('Form', {\n  submitText: 'Save profile',\n  schema: [\n    { kind: 'section', title: 'Profile' },\n    { kind: 'field', name: 'fullName', label: 'Full name', component: 'Input', required: true },\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', required: true,\n      props: {\n        visibleProp: 'label',\n        searchable: true,\n        options: [\n          { label: 'Owner', value: 'owner' },\n          { label: 'Editor', value: 'editor' },\n          { label: 'Viewer', value: 'viewer' }\n        ]\n      } },\n    { kind: 'separator' },\n    { kind: 'field', name: 'twoFactor', label: 'Enable two-factor auth',\n      component: 'Switch', valueProp: 'checked', value: false }\n  ],\n  onSubmit: (values) => console.log('profile', values)\n});\n\nreturn form;\n:::\n\n:::script label=\"Cross-field validation (confirm password)\" expected=\"confirm must match password\"\nconst form = await slice.build('Form', {\n  submitText: 'Set password',\n  schema: [\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n      required: true, props: { secret: true } },\n    { kind: 'field', name: 'confirm', label: 'Confirm password', component: 'Input',\n      required: true, props: { secret: true },\n      // the second arg is every current value — use it for cross-field rules\n      validate: (value, values) => (value === values.password ? null : 'Passwords do not match') }\n  ],\n  onSubmit: (values) => console.log('ok', values)\n});\n\nreturn form;\n:::\n\n:::script label=\"Server-side errors via setError()\" expected=\"onSubmit can flag a field after an async check\"\nconst form = await slice.build('Form', {\n  submitText: 'Claim username',\n  schema: [\n    { kind: 'field', name: 'username', label: 'Username', component: 'Input', required: true,\n      description: 'Try \"admin\" to see a server-side error.' }\n  ],\n  onSubmit: async (values) => {\n    // pretend to hit an API\n    const taken = values.username.toLowerCase() === 'admin';\n    if (taken) {\n      form.setError('username', 'That username is already taken');\n    } else {\n      console.log('available', values.username);\n    }\n  }\n});\n\nreturn form;\n:::\n\n:::script label=\"Settings form with multiple sections\" expected=\"grouped fields with separators\"\nconst form = await slice.build('Form', {\n  submitText: 'Apply settings',\n  resetText: 'Reset',\n  schema: [\n    { kind: 'section', title: 'Notifications', description: 'How we reach you' },\n    { kind: 'field', name: 'emailNotifs', label: 'Email notifications',\n      component: 'Checkbox', valueProp: 'checked', value: true },\n    { kind: 'field', name: 'smsNotifs', label: 'SMS notifications',\n      component: 'Checkbox', valueProp: 'checked', value: false },\n    { kind: 'separator' },\n    { kind: 'section', title: 'Display' },\n    { kind: 'field', name: 'density', label: 'Density', component: 'Select',\n      props: {\n        visibleProp: 'label',\n        options: [\n          { label: 'Comfortable', value: 'comfortable' },\n          { label: 'Compact', value: 'compact' }\n        ]\n      } }\n  ],\n  onSubmit: (values) => console.log('settings', values)\n});\n\nreturn form;\n:::\n\n## Best Practices\n:::tip\nLet the Form own the field's `label`/`description`; don't also set the component's own `label` in\n`props` or it doubles up (for `Checkbox`/`Switch` you may prefer the component's inline label — then omit\nthe field `label`).\n:::\n\n:::tip\n`validate(value, values)` receives **all** current values as its second argument — use it for cross-field\nrules (confirm-password, date ranges). For server-side errors, call `form.setError(name, message)` from an\nasync `onSubmit`.\n:::\n\n## Pitfalls\n:::warning\nThe Form **builds** its field + button components with `slice.build` and destroys them in\n`beforeDestroy()`. Components built with `slice.build` are not auto-destroyed by a parent — so destroy\nthe `Form` itself through `slice.controller.destroyComponent(form)` / `destroyByContainer(node)` when you\ntear down whatever hosts it (a Modal, a view).\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| `kind` | Fields | Renders |","| --- | --- | --- |","| `'section'` | `title`, `description` | a section header |","| `'separator'` | — | a divider |","| `'field'` (default) | see below | a labelled field wrapping a built component |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-2"]');
         if (container) {
            const lines = ["| Method | Description |","| --- | --- |","| `submit()` | Validates; calls `onSubmit(values)` and returns `true` if valid. |","| `validate()` | Runs validation, shows errors, returns a boolean. |","| `getValues()` | `{ name: value }` read from each field's component. |","| `setValue(name, value)` / `setError(name, msg)` / `clearErrors()` / `reset()` | Programmatic helpers. |"];
            const clean = (line) => {
               let value = line.trim();
               if (value.startsWith('|')) {
                  value = value.slice(1);
               }
               if (value.endsWith('|')) {
                  value = value.slice(0, -1);
               }
               return value.split('|').map((cell) => cell.trim());
            };

            const formatCell = (text) => {
               let output = text
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');

               const applyBold = (input) => {
                  let result = '';
                  let index = 0;
                  while (index < input.length) {
                     const start = input.indexOf('**', index);
                     if (start === -1) {
                        result += input.slice(index);
                        break;
                     }
                     const end = input.indexOf('**', start + 2);
                     if (end === -1) {
                        result += input.slice(index);
                        break;
                     }
                     result += input.slice(index, start) + '<strong>' + input.slice(start + 2, end) + '</strong>';
                     index = end + 2;
                  }
                  return result;
               };

               const applyInlineCode = (input) => {
                  const parts = input.split(String.fromCharCode(96));
                  if (parts.length === 1) return input;
                  return parts
                     .map((part, idx) => (idx % 2 === 1 ? '<code>' + part + '</code>' : part))
                     .join('');
               };

               output = applyBold(output);
               output = applyInlineCode(output);
               return output;
            };

            const headers = lines.length > 0 ? clean(lines[0]) : [];
            // Cells carry trusted inline markup (code/bold) from the parser, so
            // they use Table's explicit { html } opt-in (Table escapes plain strings).
            const rows = lines.slice(2).map((line) => clean(line).map((cell) => ({ html: formatCell(cell) })));
            const table = await slice.build('Table', { headers, rows });
            container.appendChild(table);
         }
      }
      {
         const container = this.querySelector('[data-block-id="doc-block-9"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"schema\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"submitText\",\"type\":\"string\",\"required\":false,\"default\":\"Submit\",\"allowedValues\":[]},{\"path\":\"resetText\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSubmit\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"schema\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"submitText\",\"type\":\"string\",\"required\":false,\"default\":\"Submit\",\"allowedValues\":[]},{\"path\":\"resetText\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSubmit\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
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

customElements.define('slice-formdocumentation', FormDocumentation);
