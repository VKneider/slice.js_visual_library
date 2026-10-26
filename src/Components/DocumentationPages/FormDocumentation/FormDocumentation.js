export default class FormDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
     this.debuggerProps = [];
     this._inlineLinks = [];
     this.scriptScenarios = [{"label":"Run scenario","expected":"","kind":"script","content":"// Live: add and remove phone numbers.\nconst form = await slice.build('Form', {\n  maxWidth: '460px',\n  nextText: 'Save',\n  schema: [\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\n    {\n      kind: 'group',\n      name: 'phones',\n      label: 'Phone numbers',\n      itemLabel: 'Phone',\n      min: 1,\n      max: 4,\n      description: 'At least one. We only use these for delivery.',\n      fields: [\n        { name: 'number', label: 'Number', component: 'Input', required: true },\n        { name: 'note', label: 'Note', component: 'Input' },\n      ],\n    },\n  ],\n});\n\nreturn form;"},{"label":"Account form with sections, description & validation","expected":"validates required + email on submit","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Create account',\n  resetText: 'Reset',\n  // Two columns: short fields share a row, long ones opt out with full: true.\n  columns: 2,\n  schema: [\n    { kind: 'section', title: 'Account', description: 'How you sign in' },\n    { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },\n    { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,\n      description: 'We never share it.',\n      validate: (v) => (/\\S+@\\S+\\.\\S+/.test(v) ? null : 'Enter a valid email') },\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n      required: true, props: { secret: true } },\n    { kind: 'separator' },\n    { kind: 'section', title: 'Preferences' },\n    { kind: 'field', name: 'newsletter', label: 'Email me product news',\n      component: 'Switch', valueProp: 'checked', value: true, full: true },\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,\n      props: { visibleProp: 'label', options: [{ label: 'Owner', value: 'owner' }, { label: 'Member', value: 'member' }] } }\n  ],\n  onSubmit: (values) => console.log('submit', values)\n});\n\nreturn form;"},{"label":"Form inside a Modal","expected":"the form lives in the modal body","kind":"script","content":"// variant: 'plain' — the Modal body is already a surface, so a card inside\n// it would be a box in a box.\nconst form = await slice.build('Form', {\n  submitText: 'Save',\n  variant: 'plain',\n  schema: [\n    { kind: 'field', name: 'title', label: 'Title', component: 'Input', required: true },\n    { kind: 'field', name: 'pinned', label: 'Pin to top', component: 'Checkbox', valueProp: 'checked' }\n  ],\n  onSubmit: (values) => { console.log(values); modal.close(); }\n});\n\nconst modal = await slice.build('Modal', { title: 'New note', open: true });\nmodal.appendBody(form);\nreturn modal;"},{"label":"Profile form — Input + Select + Switch","expected":"mixed components, valueProp for the switch","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Save profile',\n  schema: [\n    { kind: 'section', title: 'Profile' },\n    { kind: 'field', name: 'fullName', label: 'Full name', component: 'Input', required: true },\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', required: true,\n      props: {\n        visibleProp: 'label',\n        searchable: true,\n        options: [\n          { label: 'Owner', value: 'owner' },\n          { label: 'Editor', value: 'editor' },\n          { label: 'Viewer', value: 'viewer' }\n        ]\n      } },\n    { kind: 'separator' },\n    { kind: 'field', name: 'twoFactor', label: 'Enable two-factor auth',\n      component: 'Switch', valueProp: 'checked', value: false }\n  ],\n  onSubmit: (values) => console.log('profile', values)\n});\n\nreturn form;"},{"label":"Cross-field validation (confirm password)","expected":"confirm must match password","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Set password',\n  schema: [\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n      required: true, props: { secret: true } },\n    { kind: 'field', name: 'confirm', label: 'Confirm password', component: 'Input',\n      required: true, props: { secret: true },\n      // the second arg is every current value — use it for cross-field rules\n      validate: (value, values) => (value === values.password ? null : 'Passwords do not match') }\n  ],\n  onSubmit: (values) => console.log('ok', values)\n});\n\nreturn form;"},{"label":"Server-side errors via setError()","expected":"onSubmit can flag a field after an async check","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Claim username',\n  schema: [\n    { kind: 'field', name: 'username', label: 'Username', component: 'Input', required: true,\n      description: 'Try \"admin\" to see a server-side error.' }\n  ],\n  onSubmit: async (values) => {\n    // pretend to hit an API\n    const taken = values.username.toLowerCase() === 'admin';\n    if (taken) {\n      form.setError('username', 'That username is already taken');\n    } else {\n      console.log('available', values.username);\n    }\n  }\n});\n\nreturn form;"},{"label":"Settings form with multiple sections","expected":"grouped fields with separators","kind":"script","content":"const form = await slice.build('Form', {\n  submitText: 'Apply settings',\n  resetText: 'Reset',\n  schema: [\n    { kind: 'section', title: 'Notifications', description: 'How we reach you' },\n    { kind: 'field', name: 'emailNotifs', label: 'Email notifications',\n      component: 'Checkbox', valueProp: 'checked', value: true },\n    { kind: 'field', name: 'smsNotifs', label: 'SMS notifications',\n      component: 'Checkbox', valueProp: 'checked', value: false },\n    { kind: 'separator' },\n    { kind: 'section', title: 'Display' },\n    { kind: 'field', name: 'density', label: 'Density', component: 'Select',\n      props: {\n        visibleProp: 'label',\n        options: [\n          { label: 'Comfortable', value: 'comfortable' },\n          { label: 'Compact', value: 'compact' }\n        ]\n      } }\n  ],\n  onSubmit: (values) => console.log('settings', values)\n});\n\nreturn form;"},{"label":"Multi-page onboarding","expected":"try Next with the fields empty — it refuses and tells you why","kind":"script","content":"const log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8em;color:var(--font-secondary-color);margin:0';\n\nconst form = await slice.build('Form', {\n  columns: 2,\n  submitText: 'Create account',\n  nextText: 'Next',\n  schema: [\n    {\n      kind: 'step',\n      label: 'Account',\n      description: 'Where we send your sign-in link.',\n      schema: [\n        { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,\n          props: { type: 'email' } },\n        { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n          required: true, props: { secret: true } },\n      ],\n    },\n    {\n      kind: 'step',\n      label: 'Profile',\n      description: 'How people see you.',\n      schema: [\n        { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },\n        { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },\n        { kind: 'field', name: 'bio', label: 'Bio', component: 'Input', full: true,\n          description: 'Optional. Shown under your name.' },\n      ],\n    },\n    {\n      kind: 'step',\n      label: 'Preferences',\n      description: 'You can change these later.',\n      schema: [\n        { kind: 'field', name: 'newsletter', label: 'Email me product news',\n          component: 'Switch', valueProp: 'checked', full: true },\n        { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,\n          props: { visibleProp: 'label', options: [\n            { label: 'Owner', value: 'owner' },\n            { label: 'Member', value: 'member' },\n          ] } },\n      ],\n    },\n  ],\n  onSubmit: (values) => {\n    log.textContent = 'Submitted: ' + Object.keys(values).join(', ');\n    console.log('submit', values);\n  },\n});\n\nconst wrap = document.createElement('div');\nwrap.appendChild(form);\nwrap.appendChild(log);\nreturn wrap;"}];
  }

  async init() {
    this.markdownPath = "form.md";
    this.markdownContent = "---\ntitle: Form\nroute: /docs/input/form\nnavLabel: Form\nsection: Input Components\ngroup: Basic\norder: 5\ndescription: Declarative forms with sections, descriptions and validation, composed from Slice components.\ncomponent: FormDocumentation\ngenerate: true\ntags: [form, forms, validation, input]\n---\n\n# Form\n\n## Overview\n`Form` builds a form from a **schema** and composes the library's own components (`Input`, `Select`,\n`Checkbox`, `Switch`, …). It renders sections, separators, per-field labels/descriptions and validation\nerrors, reads the values back, and validates on submit. It is a plain Visual — drop it in a view or a\n`Modal` body.\n\n## Schema\nEach item is discriminated by `kind`:\n\n| `kind` | Fields | Renders |\n| --- | --- | --- |\n| `'section'` | `title`, `description` | a section header |\n| `'separator'` | — | a divider |\n| `'group'` | see below | a repeatable set of items |\n| `'field'` (default) | see below | a labelled field wrapping a built component |\n\n**Field item:**\n- `name` — key in the values object.\n- `label`, `description` — field chrome rendered by the Form.\n- `component` — a Slice component name, built via `slice.build`.\n- `props` — props passed to that component.\n- `valueProp` — which prop holds the value (default `'value'`; use `'checked'` for `Checkbox`/`Switch`).\n- `value` — initial value (merged into `props` under `valueProp`).\n- `required` — `true` or a custom message.\n- `validate(value, values)` — returns an error string (falsy when valid). Runs on submit.\n\n## Steps\n\nA schema item may be a `step`, with its own nested `schema`:\n\n```javascript\nschema: [\n  { kind: 'step', label: 'Account', description: 'Where we sign you in', schema: [\n      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\n  ] },\n  { kind: 'step', label: 'Profile', schema: [\n      { kind: 'field', name: 'nickname', label: 'Nickname', component: 'Input' },\n  ] },\n]\n```\n\n- **Values live in one Form.** Every step's controls stay built, so what you typed on\n  step 1 is still there after three Nexts. That is the thing wizards usually get wrong.\n- **Next validates the steps behind you**, not just the current one, and refuses to move\n  while any of them is invalid — painting the errors in place.\n- **Back never validates.** Leaving a half-filled step is allowed; only moving on is gated.\n- **The progress indicator cannot skip validation.** Clicking a step ahead is refused\n  exactly as Next would be, so the indicator is a shortcut and not a hole.\n- The last step's button is the **Submit** button, and says `submitText`.\n- A schema with no `step` is one implicit step: no progress bar, no Back, no Next.\n\n`stepIndex`, `stepCount`, `isStepped`, `nextStep()`, `prevStep()` and `gotoStep(i)`\nare public. `nextText` sets the label of the advance button.\n\n:::tip\nUse a Modal for two or three short steps, and a route per step for anything longer. A Modal\nhas no URL, so there is nothing to link to and nothing for the back button to go back to.\n:::\n\n## Groups\n\nA `group` is a set of fields the user can add as many of as they need — phone\nnumbers, addresses, team members. Without it, no flat schema can express \"however\nmany of these do you have?\".\n\n```javascript\nschema: [{\n  kind: 'group',\n  name: 'phones',\n  label: 'Phone numbers',\n  itemLabel: 'Phone',       // singular, used in the item tag and buttons\n  min: 1,\n  max: 3,\n  fields: [                  // the repeated sub-schema\n    { name: 'number', label: 'Number', component: 'Input', required: true },\n    { name: 'note',   label: 'Note',   component: 'Input' },\n  ],\n}]\n```\n\n- `name` is required — without it the items could not be keyed at all.\n- `min` and `max` bound the item count; the Remove buttons disappear at `min`\n  and the Add button hides at `max`. Omit `min` and a group starts with one item.\n- `value` seeds the first item, and `reset()` restores it.\n- Each item's fields are stored internally as `phones[0].number`, so\n  `setValue('phones[1].number', x)` and `setError(...)` work on them with no\n  special cases.\n- **`getValues()` hands the array back nested** — `{ phones: [{ number, note }] }`\n  — which is the shape you declared. Flattening is an implementation detail you\n  never see.\n- Items are added and removed **in place**; the form is not re-rendered, so\n  nothing typed elsewhere in it moves or is lost.\n- `required` applies to every item, so an empty second phone blocks submit.\n\n:::script\n// Live: add and remove phone numbers.\nconst form = await slice.build('Form', {\n  maxWidth: '460px',\n  nextText: 'Save',\n  schema: [\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\n    {\n      kind: 'group',\n      name: 'phones',\n      label: 'Phone numbers',\n      itemLabel: 'Phone',\n      min: 1,\n      max: 4,\n      description: 'At least one. We only use these for delivery.',\n      fields: [\n        { name: 'number', label: 'Number', component: 'Input', required: true },\n        { name: 'note', label: 'Note', component: 'Input' },\n      ],\n    },\n  ],\n});\n\nreturn form;\n:::\n\n## Layout\n\nThree presentation props, and one per-field opt-out.\n\n| Prop | Default | What it does |\n| --- | --- | --- |\n| `variant` | `'card'` | `'card'` draws a raised surface. `'plain'` is rhythm only - use it when the form already sits inside one, such as a Modal body or a Card. |\n| `columns` | `1` | Field grid columns. `2` is what makes a form read as designed rather than dumped. |\n| `maxWidth` | `'40rem'` | Caps the form's width, so a single text field is not as wide as its container. |\n\n```javascript\nawait slice.build('Form', {\n  columns: 2,\n  schema: [\n    { kind: 'field', name: 'first', label: 'First name', component: 'Input' },\n    { kind: 'field', name: 'last',  label: 'Last name',  component: 'Input' },\n    // full width - an address or a textarea reads badly at half width\n    { kind: 'field', name: 'bio', label: 'Bio', component: 'Textarea', full: true },\n  ],\n});\n```\n\n`full: true` on a **field** keeps it out of a shared grid row. Sections and\nseparators always span the full row.\n\n:::tip\nThe container owns the spacing, not the controls. `Input`, `Select` and\n`Textarea` carry no vertical margin of their own, so a form's rhythm is\ndecided in one place. If you need the old standalone spacing, set\n`--control-margin-block` on the host.\n:::\n\n## Text fields\n`Input` and `Textarea` know they are inside a Form and step aside for it:\n\n- **The label is the Form's.** The field is set to `labelPlacement: 'above'` with no label of its own, so the Form's label is the only one. The field takes it as its accessible name, and clicking the label focuses the field.\n- **The error is the Form's.** The field does not show its own messages (`validateOn: 'manual'`); the Form prints one message under it, in the same style for every kind of control. The field still draws its own red border, so there is one red edge in the field's own shape.\n- **Its rules count.** After the schema's `required` and `validate`, the Form asks the field for its own verdict, so `type: 'email'`, `min`, `max`, `minlength` or a field `validator` set in `props` work without repeating them in the schema.\n- **Errors follow the value.** A field with an error on screen is checked again as it is edited, so the message goes away as soon as it is fixed instead of waiting for the next Submit.\n- **A failed Submit takes you there.** Focus moves to the first field with a problem.\n\nAnything you pass in a field's `props` wins over these defaults.\n\n## Methods\n| Method | Description |\n| --- | --- |\n| `submit()` | Validates; calls `onSubmit(values)` and returns `true` if valid. |\n| `validate()` | Runs validation, shows errors, focuses the first invalid field, returns a boolean. |\n| `getValues()` | `{ name: value }` read from each field's component. |\n| `setValue(name, value)` / `setError(name, msg)` / `clearErrors()` / `reset()` | Programmatic helpers. |\n\n## Prop Scenarios\n:::script label=\"Account form with sections, description & validation\" expected=\"validates required + email on submit\"\nconst form = await slice.build('Form', {\n  submitText: 'Create account',\n  resetText: 'Reset',\n  // Two columns: short fields share a row, long ones opt out with full: true.\n  columns: 2,\n  schema: [\n    { kind: 'section', title: 'Account', description: 'How you sign in' },\n    { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },\n    { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,\n      description: 'We never share it.',\n      validate: (v) => (/\\S+@\\S+\\.\\S+/.test(v) ? null : 'Enter a valid email') },\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n      required: true, props: { secret: true } },\n    { kind: 'separator' },\n    { kind: 'section', title: 'Preferences' },\n    { kind: 'field', name: 'newsletter', label: 'Email me product news',\n      component: 'Switch', valueProp: 'checked', value: true, full: true },\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,\n      props: { visibleProp: 'label', options: [{ label: 'Owner', value: 'owner' }, { label: 'Member', value: 'member' }] } }\n  ],\n  onSubmit: (values) => console.log('submit', values)\n});\n\nreturn form;\n:::\n\n:::script label=\"Form inside a Modal\" expected=\"the form lives in the modal body\"\n// variant: 'plain' — the Modal body is already a surface, so a card inside\n// it would be a box in a box.\nconst form = await slice.build('Form', {\n  submitText: 'Save',\n  variant: 'plain',\n  schema: [\n    { kind: 'field', name: 'title', label: 'Title', component: 'Input', required: true },\n    { kind: 'field', name: 'pinned', label: 'Pin to top', component: 'Checkbox', valueProp: 'checked' }\n  ],\n  onSubmit: (values) => { console.log(values); modal.close(); }\n});\n\nconst modal = await slice.build('Modal', { title: 'New note', open: true });\nmodal.appendBody(form);\nreturn modal;\n:::\n\n:::script label=\"Profile form — Input + Select + Switch\" expected=\"mixed components, valueProp for the switch\"\nconst form = await slice.build('Form', {\n  submitText: 'Save profile',\n  schema: [\n    { kind: 'section', title: 'Profile' },\n    { kind: 'field', name: 'fullName', label: 'Full name', component: 'Input', required: true },\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', required: true,\n      props: {\n        visibleProp: 'label',\n        searchable: true,\n        options: [\n          { label: 'Owner', value: 'owner' },\n          { label: 'Editor', value: 'editor' },\n          { label: 'Viewer', value: 'viewer' }\n        ]\n      } },\n    { kind: 'separator' },\n    { kind: 'field', name: 'twoFactor', label: 'Enable two-factor auth',\n      component: 'Switch', valueProp: 'checked', value: false }\n  ],\n  onSubmit: (values) => console.log('profile', values)\n});\n\nreturn form;\n:::\n\n:::script label=\"Cross-field validation (confirm password)\" expected=\"confirm must match password\"\nconst form = await slice.build('Form', {\n  submitText: 'Set password',\n  schema: [\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n      required: true, props: { secret: true } },\n    { kind: 'field', name: 'confirm', label: 'Confirm password', component: 'Input',\n      required: true, props: { secret: true },\n      // the second arg is every current value — use it for cross-field rules\n      validate: (value, values) => (value === values.password ? null : 'Passwords do not match') }\n  ],\n  onSubmit: (values) => console.log('ok', values)\n});\n\nreturn form;\n:::\n\n:::script label=\"Server-side errors via setError()\" expected=\"onSubmit can flag a field after an async check\"\nconst form = await slice.build('Form', {\n  submitText: 'Claim username',\n  schema: [\n    { kind: 'field', name: 'username', label: 'Username', component: 'Input', required: true,\n      description: 'Try \"admin\" to see a server-side error.' }\n  ],\n  onSubmit: async (values) => {\n    // pretend to hit an API\n    const taken = values.username.toLowerCase() === 'admin';\n    if (taken) {\n      form.setError('username', 'That username is already taken');\n    } else {\n      console.log('available', values.username);\n    }\n  }\n});\n\nreturn form;\n:::\n\n:::script label=\"Settings form with multiple sections\" expected=\"grouped fields with separators\"\nconst form = await slice.build('Form', {\n  submitText: 'Apply settings',\n  resetText: 'Reset',\n  schema: [\n    { kind: 'section', title: 'Notifications', description: 'How we reach you' },\n    { kind: 'field', name: 'emailNotifs', label: 'Email notifications',\n      component: 'Checkbox', valueProp: 'checked', value: true },\n    { kind: 'field', name: 'smsNotifs', label: 'SMS notifications',\n      component: 'Checkbox', valueProp: 'checked', value: false },\n    { kind: 'separator' },\n    { kind: 'section', title: 'Display' },\n    { kind: 'field', name: 'density', label: 'Density', component: 'Select',\n      props: {\n        visibleProp: 'label',\n        options: [\n          { label: 'Comfortable', value: 'comfortable' },\n          { label: 'Compact', value: 'compact' }\n        ]\n      } }\n  ],\n  onSubmit: (values) => console.log('settings', values)\n});\n\nreturn form;\n:::\n\n:::script label=\"Multi-page onboarding\" expected=\"try Next with the fields empty — it refuses and tells you why\"\nconst log = document.createElement('p');\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8em;color:var(--font-secondary-color);margin:0';\n\nconst form = await slice.build('Form', {\n  columns: 2,\n  submitText: 'Create account',\n  nextText: 'Next',\n  schema: [\n    {\n      kind: 'step',\n      label: 'Account',\n      description: 'Where we send your sign-in link.',\n      schema: [\n        { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,\n          props: { type: 'email' } },\n        { kind: 'field', name: 'password', label: 'Password', component: 'Input',\n          required: true, props: { secret: true } },\n      ],\n    },\n    {\n      kind: 'step',\n      label: 'Profile',\n      description: 'How people see you.',\n      schema: [\n        { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },\n        { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },\n        { kind: 'field', name: 'bio', label: 'Bio', component: 'Input', full: true,\n          description: 'Optional. Shown under your name.' },\n      ],\n    },\n    {\n      kind: 'step',\n      label: 'Preferences',\n      description: 'You can change these later.',\n      schema: [\n        { kind: 'field', name: 'newsletter', label: 'Email me product news',\n          component: 'Switch', valueProp: 'checked', full: true },\n        { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,\n          props: { visibleProp: 'label', options: [\n            { label: 'Owner', value: 'owner' },\n            { label: 'Member', value: 'member' },\n          ] } },\n      ],\n    },\n  ],\n  onSubmit: (values) => {\n    log.textContent = 'Submitted: ' + Object.keys(values).join(', ');\n    console.log('submit', values);\n  },\n});\n\nconst wrap = document.createElement('div');\nwrap.appendChild(form);\nwrap.appendChild(log);\nreturn wrap;\n:::\n\n## Best Practices\n:::tip\nLet the Form own the field's `label`/`description`; don't also set the component's own `label` in\n`props` or it doubles up (for `Checkbox`/`Switch` you may prefer the component's inline label — then omit\nthe field `label`).\n:::\n\n:::tip\n`validate(value, values)` receives **all** current values as its second argument — use it for cross-field\nrules (confirm-password, date ranges). For server-side errors, call `form.setError(name, message)` from an\nasync `onSubmit`.\n:::\n\n## Pitfalls\n\n:::warning\nA field whose `component` is missing — or names something that is not registered — renders **nothing**\nwhere the control should be. It is left visible as a dashed marker naming the problem, and the Form logs\na warning naming the field, but the field contributes **no key** to `getValues()`.\n\nThat is worth knowing at submit time: a broken field does not block the form, it just quietly\ndisappears from the payload. If a field is required, the usual validation is what catches it.\n:::\n\n:::warning\nThe Form **builds** its field + button components with `slice.build` and destroys them in\n`beforeDestroy()`. Components built with `slice.build` are not auto-destroyed by a parent — so destroy\nthe `Form` itself through `slice.controller.destroyComponent(form)` / `destroyByContainer(node)` when you\ntear down whatever hosts it (a view). A [Modal](/docs/feedback/modal) destroys what is in its body when\nit is destroyed, so a Form in a Modal with `destroyOnClose: true` is taken care of.\n:::\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| `kind` | Fields | Renders |","| --- | --- | --- |","| `'section'` | `title`, `description` | a section header |","| `'separator'` | — | a divider |","| `'group'` | see below | a repeatable set of items |","| `'field'` (default) | see below | a labelled field wrapping a built component |"];
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
            const code = await slice.build('CodeVisualizer', {
               value: "schema: [\n  { kind: 'step', label: 'Account', description: 'Where we sign you in', schema: [\n      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\n  ] },\n  { kind: 'step', label: 'Profile', schema: [\n      { kind: 'field', name: 'nickname', label: 'Nickname', component: 'Input' },\n  ] },\n]",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-3"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "schema: [{\n  kind: 'group',\n  name: 'phones',\n  label: 'Phone numbers',\n  itemLabel: 'Phone',       // singular, used in the item tag and buttons\n  min: 1,\n  max: 3,\n  fields: [                  // the repeated sub-schema\n    { name: 'number', label: 'Number', component: 'Input', required: true },\n    { name: 'note',   label: 'Note',   component: 'Input' },\n  ],\n}]",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-5"]');
         if (container) {
            const lines = ["| Prop | Default | What it does |","| --- | --- | --- |","| `variant` | `'card'` | `'card'` draws a raised surface. `'plain'` is rhythm only - use it when the form already sits inside one, such as a Modal body or a Card. |","| `columns` | `1` | Field grid columns. `2` is what makes a form read as designed rather than dumped. |","| `maxWidth` | `'40rem'` | Caps the form's width, so a single text field is not as wide as its container. |"];
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
         const container = this.querySelector('[data-block-id="doc-block-6"]');
         if (container) {
            const code = await slice.build('CodeVisualizer', {
               value: "await slice.build('Form', {\n  columns: 2,\n  schema: [\n    { kind: 'field', name: 'first', label: 'First name', component: 'Input' },\n    { kind: 'field', name: 'last',  label: 'Last name',  component: 'Input' },\n    // full width - an address or a textarea reads badly at half width\n    { kind: 'field', name: 'bio', label: 'Bio', component: 'Textarea', full: true },\n  ],\n});",
               language: "javascript"
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
         const container = this.querySelector('[data-block-id="doc-block-7"]');
         if (container) {
            const lines = ["| Method | Description |","| --- | --- |","| `submit()` | Validates; calls `onSubmit(values)` and returns `true` if valid. |","| `validate()` | Runs validation, shows errors, focuses the first invalid field, returns a boolean. |","| `getValues()` | `{ name: value }` read from each field's component. |","| `setValue(name, value)` / `setError(name, msg)` / `clearErrors()` / `reset()` | Programmatic helpers. |"];
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
         const container = this.querySelector('[data-block-id="doc-block-15"]');
         if (container) {
            let props = {};
            if ("{\"props\":[{\"path\":\"schema\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"submitText\",\"type\":\"string\",\"required\":false,\"default\":\"Submit\",\"allowedValues\":[]},{\"path\":\"resetText\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSubmit\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"nextText\",\"type\":\"string\",\"required\":false,\"default\":\"Next\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"card\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"maxWidth\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}") {
               try {
                  props = JSON.parse("{\"props\":[{\"path\":\"schema\",\"type\":\"array\",\"required\":false,\"default\":\"\",\"allowedValues\":[]},{\"path\":\"submitText\",\"type\":\"string\",\"required\":false,\"default\":\"Submit\",\"allowedValues\":[]},{\"path\":\"resetText\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"onSubmit\",\"type\":\"function\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]},{\"path\":\"nextText\",\"type\":\"string\",\"required\":false,\"default\":\"Next\",\"allowedValues\":[]},{\"path\":\"variant\",\"type\":\"string\",\"required\":false,\"default\":\"card\",\"allowedValues\":[]},{\"path\":\"columns\",\"type\":\"number\",\"required\":false,\"default\":\"1\",\"allowedValues\":[]},{\"path\":\"maxWidth\",\"type\":\"string\",\"required\":false,\"default\":\"null\",\"allowedValues\":[]}]}");
               } catch (error) {
                  console.warn('Invalid component props JSON:', error);
               }
            }
            const component = await slice.build('PropsTable', props);
            container.appendChild(component);
         }
       }
      {
         const links = [{"text":"Modal","path":"/docs/feedback/modal"}];
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

customElements.define('slice-formdocumentation', FormDocumentation);
