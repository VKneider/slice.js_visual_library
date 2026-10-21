export default class FormDocumentation extends HTMLElement {
  constructor(props) {
    super();
    slice.attachTemplate(this);
    slice.controller.setComponentProps(this, props);
    this.debuggerProps = [];
    this.scriptScenarios = [{"label":"Run scenario","expected":"","kind":"script","content":"// Live: add and remove phone numbers.\r\nconst form = await slice.build('Form', {\r\n  maxWidth: '460px',\r\n  nextText: 'Save',\r\n  schema: [\r\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\r\n    {\r\n      kind: 'group',\r\n      name: 'phones',\r\n      label: 'Phone numbers',\r\n      itemLabel: 'Phone',\r\n      min: 1,\r\n      max: 4,\r\n      description: 'At least one. We only use these for delivery.',\r\n      fields: [\r\n        { name: 'number', label: 'Number', component: 'Input', required: true },\r\n        { name: 'note', label: 'Note', component: 'Input' },\r\n      ],\r\n    },\r\n  ],\r\n});\r\n\r\nreturn form;"},{"label":"Account form with sections, description & validation","expected":"validates required + email on submit","kind":"script","content":"const form = await slice.build('Form', {\r\n  submitText: 'Create account',\r\n  resetText: 'Reset',\r\n  // Two columns: short fields share a row, long ones opt out with full: true.\r\n  columns: 2,\r\n  schema: [\r\n    { kind: 'section', title: 'Account', description: 'How you sign in' },\r\n    { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },\r\n    { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },\r\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,\r\n      description: 'We never share it.',\r\n      validate: (v) => (/\\S+@\\S+\\.\\S+/.test(v) ? null : 'Enter a valid email') },\r\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\r\n      required: true, props: { secret: true } },\r\n    { kind: 'separator' },\r\n    { kind: 'section', title: 'Preferences' },\r\n    { kind: 'field', name: 'newsletter', label: 'Email me product news',\r\n      component: 'Switch', valueProp: 'checked', value: true, full: true },\r\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,\r\n      props: { visibleProp: 'label', options: [{ label: 'Owner', value: 'owner' }, { label: 'Member', value: 'member' }] } }\r\n  ],\r\n  onSubmit: (values) => console.log('submit', values)\r\n});\r\n\r\nreturn form;"},{"label":"Form inside a Modal","expected":"the form lives in the modal body","kind":"script","content":"// variant: 'plain' — the Modal body is already a surface, so a card inside\r\n// it would be a box in a box.\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Save',\r\n  variant: 'plain',\r\n  schema: [\r\n    { kind: 'field', name: 'title', label: 'Title', component: 'Input', required: true },\r\n    { kind: 'field', name: 'pinned', label: 'Pin to top', component: 'Checkbox', valueProp: 'checked' }\r\n  ],\r\n  onSubmit: (values) => { console.log(values); modal.close(); }\r\n});\r\n\r\nconst modal = await slice.build('Modal', { title: 'New note', open: true });\r\nmodal.appendBody(form);\r\nreturn modal;"},{"label":"Profile form — Input + Select + Switch","expected":"mixed components, valueProp for the switch","kind":"script","content":"const form = await slice.build('Form', {\r\n  submitText: 'Save profile',\r\n  schema: [\r\n    { kind: 'section', title: 'Profile' },\r\n    { kind: 'field', name: 'fullName', label: 'Full name', component: 'Input', required: true },\r\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', required: true,\r\n      props: {\r\n        visibleProp: 'label',\r\n        searchable: true,\r\n        options: [\r\n          { label: 'Owner', value: 'owner' },\r\n          { label: 'Editor', value: 'editor' },\r\n          { label: 'Viewer', value: 'viewer' }\r\n        ]\r\n      } },\r\n    { kind: 'separator' },\r\n    { kind: 'field', name: 'twoFactor', label: 'Enable two-factor auth',\r\n      component: 'Switch', valueProp: 'checked', value: false }\r\n  ],\r\n  onSubmit: (values) => console.log('profile', values)\r\n});\r\n\r\nreturn form;"},{"label":"Cross-field validation (confirm password)","expected":"confirm must match password","kind":"script","content":"const form = await slice.build('Form', {\r\n  submitText: 'Set password',\r\n  schema: [\r\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\r\n      required: true, props: { secret: true } },\r\n    { kind: 'field', name: 'confirm', label: 'Confirm password', component: 'Input',\r\n      required: true, props: { secret: true },\r\n      // the second arg is every current value — use it for cross-field rules\r\n      validate: (value, values) => (value === values.password ? null : 'Passwords do not match') }\r\n  ],\r\n  onSubmit: (values) => console.log('ok', values)\r\n});\r\n\r\nreturn form;"},{"label":"Server-side errors via setError()","expected":"onSubmit can flag a field after an async check","kind":"script","content":"const form = await slice.build('Form', {\r\n  submitText: 'Claim username',\r\n  schema: [\r\n    { kind: 'field', name: 'username', label: 'Username', component: 'Input', required: true,\r\n      description: 'Try \"admin\" to see a server-side error.' }\r\n  ],\r\n  onSubmit: async (values) => {\r\n    // pretend to hit an API\r\n    const taken = values.username.toLowerCase() === 'admin';\r\n    if (taken) {\r\n      form.setError('username', 'That username is already taken');\r\n    } else {\r\n      console.log('available', values.username);\r\n    }\r\n  }\r\n});\r\n\r\nreturn form;"},{"label":"Settings form with multiple sections","expected":"grouped fields with separators","kind":"script","content":"const form = await slice.build('Form', {\r\n  submitText: 'Apply settings',\r\n  resetText: 'Reset',\r\n  schema: [\r\n    { kind: 'section', title: 'Notifications', description: 'How we reach you' },\r\n    { kind: 'field', name: 'emailNotifs', label: 'Email notifications',\r\n      component: 'Checkbox', valueProp: 'checked', value: true },\r\n    { kind: 'field', name: 'smsNotifs', label: 'SMS notifications',\r\n      component: 'Checkbox', valueProp: 'checked', value: false },\r\n    { kind: 'separator' },\r\n    { kind: 'section', title: 'Display' },\r\n    { kind: 'field', name: 'density', label: 'Density', component: 'Select',\r\n      props: {\r\n        visibleProp: 'label',\r\n        options: [\r\n          { label: 'Comfortable', value: 'comfortable' },\r\n          { label: 'Compact', value: 'compact' }\r\n        ]\r\n      } }\r\n  ],\r\n  onSubmit: (values) => console.log('settings', values)\r\n});\r\n\r\nreturn form;"},{"label":"Multi-page onboarding","expected":"try Next with the fields empty — it refuses and tells you why","kind":"script","content":"const log = document.createElement('p');\r\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8em;color:var(--font-secondary-color);margin:0';\r\n\r\nconst form = await slice.build('Form', {\r\n  columns: 2,\r\n  submitText: 'Create account',\r\n  nextText: 'Next',\r\n  schema: [\r\n    {\r\n      kind: 'step',\r\n      label: 'Account',\r\n      description: 'Where we send your sign-in link.',\r\n      schema: [\r\n        { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\r\n        { kind: 'field', name: 'password', label: 'Password', component: 'Input',\r\n          required: true, props: { secret: true } },\r\n      ],\r\n    },\r\n    {\r\n      kind: 'step',\r\n      label: 'Profile',\r\n      description: 'How people see you.',\r\n      schema: [\r\n        { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },\r\n        { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },\r\n        { kind: 'field', name: 'bio', label: 'Bio', component: 'Input', full: true,\r\n          description: 'Optional. Shown under your name.' },\r\n      ],\r\n    },\r\n    {\r\n      kind: 'step',\r\n      label: 'Preferences',\r\n      description: 'You can change these later.',\r\n      schema: [\r\n        { kind: 'field', name: 'newsletter', label: 'Email me product news',\r\n          component: 'Switch', valueProp: 'checked', full: true },\r\n        { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,\r\n          props: { visibleProp: 'label', options: [\r\n            { label: 'Owner', value: 'owner' },\r\n            { label: 'Member', value: 'member' },\r\n          ] } },\r\n      ],\r\n    },\r\n  ],\r\n  onSubmit: (values) => {\r\n    log.textContent = 'Submitted: ' + Object.keys(values).join(', ');\r\n    console.log('submit', values);\r\n  },\r\n});\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(form);\r\nwrap.appendChild(log);\r\nreturn wrap;"}];
  }

  async init() {
    this.markdownPath = "form.md";
    this.markdownContent = "---\r\ntitle: Form\r\nroute: /docs/input/form\r\nnavLabel: Form\r\nsection: Input Components\r\ngroup: Basic\r\norder: 5\r\ndescription: Declarative forms with sections, descriptions and validation, composed from Slice components.\r\ncomponent: FormDocumentation\r\ngenerate: true\r\ntags: [form, forms, validation, input]\r\n---\r\n\r\n# Form\r\n\r\n## Overview\r\n`Form` builds a form from a **schema** and composes the library's own components (`Input`, `Select`,\r\n`Checkbox`, `Switch`, …). It renders sections, separators, per-field labels/descriptions and validation\r\nerrors, reads the values back, and validates on submit. It is a plain Visual — drop it in a view or a\r\n`Modal` body.\r\n\r\n## Schema\r\nEach item is discriminated by `kind`:\r\n\r\n| `kind` | Fields | Renders |\r\n| --- | --- | --- |\r\n| `'section'` | `title`, `description` | a section header |\r\n| `'separator'` | — | a divider |\r\n| `'group'` | see below | a repeatable set of items |\r\n| `'field'` (default) | see below | a labelled field wrapping a built component |\r\n\r\n**Field item:**\r\n- `name` — key in the values object.\r\n- `label`, `description` — field chrome rendered by the Form.\r\n- `component` — a Slice component name, built via `slice.build`.\r\n- `props` — props passed to that component.\r\n- `valueProp` — which prop holds the value (default `'value'`; use `'checked'` for `Checkbox`/`Switch`).\r\n- `value` — initial value (merged into `props` under `valueProp`).\r\n- `required` — `true` or a custom message.\r\n- `validate(value, values)` — returns an error string (falsy when valid). Runs on submit.\r\n\r\n## Steps\r\n\r\nA schema item may be a `step`, with its own nested `schema`:\r\n\r\n```javascript\r\nschema: [\r\n  { kind: 'step', label: 'Account', description: 'Where we sign you in', schema: [\r\n      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\r\n  ] },\r\n  { kind: 'step', label: 'Profile', schema: [\r\n      { kind: 'field', name: 'nickname', label: 'Nickname', component: 'Input' },\r\n  ] },\r\n]\r\n```\r\n\r\n- **Values live in one Form.** Every step's controls stay built, so what you typed on\r\n  step 1 is still there after three Nexts. That is the thing wizards usually get wrong.\r\n- **Next validates the steps behind you**, not just the current one, and refuses to move\r\n  while any of them is invalid — painting the errors in place.\r\n- **Back never validates.** Leaving a half-filled step is allowed; only moving on is gated.\r\n- **The progress indicator cannot skip validation.** Clicking a step ahead is refused\r\n  exactly as Next would be, so the indicator is a shortcut and not a hole.\r\n- The last step's button is the **Submit** button, and says `submitText`.\r\n- A schema with no `step` is one implicit step: no progress bar, no Back, no Next.\r\n\r\n`stepIndex`, `stepCount`, `isStepped`, `nextStep()`, `prevStep()` and `gotoStep(i)`\r\nare public. `nextText` sets the label of the advance button.\r\n\r\n:::tip\r\nUse a Modal for two or three short steps, and a route per step for anything longer. A Modal\r\nhas no URL, so there is nothing to link to and nothing for the back button to go back to.\r\n:::\r\n\r\n## Groups\r\n\r\nA `group` is a set of fields the user can add as many of as they need — phone\r\nnumbers, addresses, team members. Without it, no flat schema can express \"however\r\nmany of these do you have?\".\r\n\r\n```javascript\r\nschema: [{\r\n  kind: 'group',\r\n  name: 'phones',\r\n  label: 'Phone numbers',\r\n  itemLabel: 'Phone',       // singular, used in the item tag and buttons\r\n  min: 1,\r\n  max: 3,\r\n  fields: [                  // the repeated sub-schema\r\n    { name: 'number', label: 'Number', component: 'Input', required: true },\r\n    { name: 'note',   label: 'Note',   component: 'Input' },\r\n  ],\r\n}]\r\n```\r\n\r\n- `name` is required — without it the items could not be keyed at all.\r\n- `min` and `max` bound the item count; the Remove buttons disappear at `min`\r\n  and the Add button hides at `max`. Omit `min` and a group starts with one item.\r\n- `value` seeds the first item, and `reset()` restores it.\r\n- Each item's fields are stored internally as `phones[0].number`, so\r\n  `setValue('phones[1].number', x)` and `setError(...)` work on them with no\r\n  special cases.\r\n- **`getValues()` hands the array back nested** — `{ phones: [{ number, note }] }`\r\n  — which is the shape you declared. Flattening is an implementation detail you\r\n  never see.\r\n- Items are added and removed **in place**; the form is not re-rendered, so\r\n  nothing typed elsewhere in it moves or is lost.\r\n- `required` applies to every item, so an empty second phone blocks submit.\r\n\r\n:::script\r\n// Live: add and remove phone numbers.\r\nconst form = await slice.build('Form', {\r\n  maxWidth: '460px',\r\n  nextText: 'Save',\r\n  schema: [\r\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\r\n    {\r\n      kind: 'group',\r\n      name: 'phones',\r\n      label: 'Phone numbers',\r\n      itemLabel: 'Phone',\r\n      min: 1,\r\n      max: 4,\r\n      description: 'At least one. We only use these for delivery.',\r\n      fields: [\r\n        { name: 'number', label: 'Number', component: 'Input', required: true },\r\n        { name: 'note', label: 'Note', component: 'Input' },\r\n      ],\r\n    },\r\n  ],\r\n});\r\n\r\nreturn form;\r\n:::\r\n\r\n## Layout\r\n\r\nThree presentation props, and one per-field opt-out.\r\n\r\n| Prop | Default | What it does |\r\n| --- | --- | --- |\r\n| `variant` | `'card'` | `'card'` draws a raised surface. `'plain'` is rhythm only - use it when the form already sits inside one, such as a Modal body or a Card. |\r\n| `columns` | `1` | Field grid columns. `2` is what makes a form read as designed rather than dumped. |\r\n| `maxWidth` | `'40rem'` | Caps the form's width, so a single text field is not as wide as its container. |\r\n\r\n```javascript\r\nawait slice.build('Form', {\r\n  columns: 2,\r\n  schema: [\r\n    { kind: 'field', name: 'first', label: 'First name', component: 'Input' },\r\n    { kind: 'field', name: 'last',  label: 'Last name',  component: 'Input' },\r\n    // full width - an address or a textarea reads badly at half width\r\n    { kind: 'field', name: 'bio', label: 'Bio', component: 'Textarea', full: true },\r\n  ],\r\n});\r\n```\r\n\r\n`full: true` on a **field** keeps it out of a shared grid row. Sections and\r\nseparators always span the full row.\r\n\r\n:::tip\r\nThe container owns the spacing, not the controls. `Input`, `Select` and\r\n`Textarea` carry no vertical margin of their own, so a form's rhythm is\r\ndecided in one place. If you need the old standalone spacing, set\r\n`--control-margin-block` on the host.\r\n:::\r\n\r\n## Methods\r\n| Method | Description |\r\n| --- | --- |\r\n| `submit()` | Validates; calls `onSubmit(values)` and returns `true` if valid. |\r\n| `validate()` | Runs validation, shows errors, returns a boolean. |\r\n| `getValues()` | `{ name: value }` read from each field's component. |\r\n| `setValue(name, value)` / `setError(name, msg)` / `clearErrors()` / `reset()` | Programmatic helpers. |\r\n\r\n## Prop Scenarios\r\n:::script label=\"Account form with sections, description & validation\" expected=\"validates required + email on submit\"\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Create account',\r\n  resetText: 'Reset',\r\n  // Two columns: short fields share a row, long ones opt out with full: true.\r\n  columns: 2,\r\n  schema: [\r\n    { kind: 'section', title: 'Account', description: 'How you sign in' },\r\n    { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },\r\n    { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },\r\n    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,\r\n      description: 'We never share it.',\r\n      validate: (v) => (/\\S+@\\S+\\.\\S+/.test(v) ? null : 'Enter a valid email') },\r\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\r\n      required: true, props: { secret: true } },\r\n    { kind: 'separator' },\r\n    { kind: 'section', title: 'Preferences' },\r\n    { kind: 'field', name: 'newsletter', label: 'Email me product news',\r\n      component: 'Switch', valueProp: 'checked', value: true, full: true },\r\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,\r\n      props: { visibleProp: 'label', options: [{ label: 'Owner', value: 'owner' }, { label: 'Member', value: 'member' }] } }\r\n  ],\r\n  onSubmit: (values) => console.log('submit', values)\r\n});\r\n\r\nreturn form;\r\n:::\r\n\r\n:::script label=\"Form inside a Modal\" expected=\"the form lives in the modal body\"\r\n// variant: 'plain' — the Modal body is already a surface, so a card inside\r\n// it would be a box in a box.\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Save',\r\n  variant: 'plain',\r\n  schema: [\r\n    { kind: 'field', name: 'title', label: 'Title', component: 'Input', required: true },\r\n    { kind: 'field', name: 'pinned', label: 'Pin to top', component: 'Checkbox', valueProp: 'checked' }\r\n  ],\r\n  onSubmit: (values) => { console.log(values); modal.close(); }\r\n});\r\n\r\nconst modal = await slice.build('Modal', { title: 'New note', open: true });\r\nmodal.appendBody(form);\r\nreturn modal;\r\n:::\r\n\r\n:::script label=\"Profile form — Input + Select + Switch\" expected=\"mixed components, valueProp for the switch\"\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Save profile',\r\n  schema: [\r\n    { kind: 'section', title: 'Profile' },\r\n    { kind: 'field', name: 'fullName', label: 'Full name', component: 'Input', required: true },\r\n    { kind: 'field', name: 'role', label: 'Role', component: 'Select', required: true,\r\n      props: {\r\n        visibleProp: 'label',\r\n        searchable: true,\r\n        options: [\r\n          { label: 'Owner', value: 'owner' },\r\n          { label: 'Editor', value: 'editor' },\r\n          { label: 'Viewer', value: 'viewer' }\r\n        ]\r\n      } },\r\n    { kind: 'separator' },\r\n    { kind: 'field', name: 'twoFactor', label: 'Enable two-factor auth',\r\n      component: 'Switch', valueProp: 'checked', value: false }\r\n  ],\r\n  onSubmit: (values) => console.log('profile', values)\r\n});\r\n\r\nreturn form;\r\n:::\r\n\r\n:::script label=\"Cross-field validation (confirm password)\" expected=\"confirm must match password\"\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Set password',\r\n  schema: [\r\n    { kind: 'field', name: 'password', label: 'Password', component: 'Input',\r\n      required: true, props: { secret: true } },\r\n    { kind: 'field', name: 'confirm', label: 'Confirm password', component: 'Input',\r\n      required: true, props: { secret: true },\r\n      // the second arg is every current value — use it for cross-field rules\r\n      validate: (value, values) => (value === values.password ? null : 'Passwords do not match') }\r\n  ],\r\n  onSubmit: (values) => console.log('ok', values)\r\n});\r\n\r\nreturn form;\r\n:::\r\n\r\n:::script label=\"Server-side errors via setError()\" expected=\"onSubmit can flag a field after an async check\"\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Claim username',\r\n  schema: [\r\n    { kind: 'field', name: 'username', label: 'Username', component: 'Input', required: true,\r\n      description: 'Try \"admin\" to see a server-side error.' }\r\n  ],\r\n  onSubmit: async (values) => {\r\n    // pretend to hit an API\r\n    const taken = values.username.toLowerCase() === 'admin';\r\n    if (taken) {\r\n      form.setError('username', 'That username is already taken');\r\n    } else {\r\n      console.log('available', values.username);\r\n    }\r\n  }\r\n});\r\n\r\nreturn form;\r\n:::\r\n\r\n:::script label=\"Settings form with multiple sections\" expected=\"grouped fields with separators\"\r\nconst form = await slice.build('Form', {\r\n  submitText: 'Apply settings',\r\n  resetText: 'Reset',\r\n  schema: [\r\n    { kind: 'section', title: 'Notifications', description: 'How we reach you' },\r\n    { kind: 'field', name: 'emailNotifs', label: 'Email notifications',\r\n      component: 'Checkbox', valueProp: 'checked', value: true },\r\n    { kind: 'field', name: 'smsNotifs', label: 'SMS notifications',\r\n      component: 'Checkbox', valueProp: 'checked', value: false },\r\n    { kind: 'separator' },\r\n    { kind: 'section', title: 'Display' },\r\n    { kind: 'field', name: 'density', label: 'Density', component: 'Select',\r\n      props: {\r\n        visibleProp: 'label',\r\n        options: [\r\n          { label: 'Comfortable', value: 'comfortable' },\r\n          { label: 'Compact', value: 'compact' }\r\n        ]\r\n      } }\r\n  ],\r\n  onSubmit: (values) => console.log('settings', values)\r\n});\r\n\r\nreturn form;\r\n:::\r\n\r\n:::script label=\"Multi-page onboarding\" expected=\"try Next with the fields empty — it refuses and tells you why\"\r\nconst log = document.createElement('p');\r\nlog.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8em;color:var(--font-secondary-color);margin:0';\r\n\r\nconst form = await slice.build('Form', {\r\n  columns: 2,\r\n  submitText: 'Create account',\r\n  nextText: 'Next',\r\n  schema: [\r\n    {\r\n      kind: 'step',\r\n      label: 'Account',\r\n      description: 'Where we send your sign-in link.',\r\n      schema: [\r\n        { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\r\n        { kind: 'field', name: 'password', label: 'Password', component: 'Input',\r\n          required: true, props: { secret: true } },\r\n      ],\r\n    },\r\n    {\r\n      kind: 'step',\r\n      label: 'Profile',\r\n      description: 'How people see you.',\r\n      schema: [\r\n        { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },\r\n        { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },\r\n        { kind: 'field', name: 'bio', label: 'Bio', component: 'Input', full: true,\r\n          description: 'Optional. Shown under your name.' },\r\n      ],\r\n    },\r\n    {\r\n      kind: 'step',\r\n      label: 'Preferences',\r\n      description: 'You can change these later.',\r\n      schema: [\r\n        { kind: 'field', name: 'newsletter', label: 'Email me product news',\r\n          component: 'Switch', valueProp: 'checked', full: true },\r\n        { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,\r\n          props: { visibleProp: 'label', options: [\r\n            { label: 'Owner', value: 'owner' },\r\n            { label: 'Member', value: 'member' },\r\n          ] } },\r\n      ],\r\n    },\r\n  ],\r\n  onSubmit: (values) => {\r\n    log.textContent = 'Submitted: ' + Object.keys(values).join(', ');\r\n    console.log('submit', values);\r\n  },\r\n});\r\n\r\nconst wrap = document.createElement('div');\r\nwrap.appendChild(form);\r\nwrap.appendChild(log);\r\nreturn wrap;\r\n:::\r\n\r\n## Best Practices\r\n:::tip\r\nLet the Form own the field's `label`/`description`; don't also set the component's own `label` in\r\n`props` or it doubles up (for `Checkbox`/`Switch` you may prefer the component's inline label — then omit\r\nthe field `label`).\r\n:::\r\n\r\n:::tip\r\n`validate(value, values)` receives **all** current values as its second argument — use it for cross-field\r\nrules (confirm-password, date ranges). For server-side errors, call `form.setError(name, message)` from an\r\nasync `onSubmit`.\r\n:::\r\n\r\n## Pitfalls\r\n\r\n:::warning\r\nA field whose `component` is missing — or names something that is not registered — renders **nothing**\r\nwhere the control should be. It is left visible as a dashed marker naming the problem, and the Form logs\r\na warning naming the field, but the field contributes **no key** to `getValues()`.\r\n\r\nThat is worth knowing at submit time: a broken field does not block the form, it just quietly\r\ndisappears from the payload. If a field is required, the usual validation is what catches it.\r\n:::\r\n\r\n:::warning\r\nThe Form **builds** its field + button components with `slice.build` and destroys them in\r\n`beforeDestroy()`. Components built with `slice.build` are not auto-destroyed by a parent — so destroy\r\nthe `Form` itself through `slice.controller.destroyComponent(form)` / `destroyByContainer(node)` when you\r\ntear down whatever hosts it (a Modal, a view).\r\n:::\r\n";
    if (true) {
      await this.setupCopyButton();
    }
      {
         const container = this.querySelector('[data-block-id="doc-block-1"]');
         if (container) {
            const lines = ["| `kind` | Fields | Renders |\r","| --- | --- | --- |\r","| `'section'` | `title`, `description` | a section header |\r","| `'separator'` | — | a divider |\r","| `'group'` | see below | a repeatable set of items |\r","| `'field'` (default) | see below | a labelled field wrapping a built component |\r"];
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
               value: "schema: [\r\n  { kind: 'step', label: 'Account', description: 'Where we sign you in', schema: [\r\n      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },\r\n  ] },\r\n  { kind: 'step', label: 'Profile', schema: [\r\n      { kind: 'field', name: 'nickname', label: 'Nickname', component: 'Input' },\r\n  ] },\r\n]\r",
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
               value: "schema: [{\r\n  kind: 'group',\r\n  name: 'phones',\r\n  label: 'Phone numbers',\r\n  itemLabel: 'Phone',       // singular, used in the item tag and buttons\r\n  min: 1,\r\n  max: 3,\r\n  fields: [                  // the repeated sub-schema\r\n    { name: 'number', label: 'Number', component: 'Input', required: true },\r\n    { name: 'note',   label: 'Note',   component: 'Input' },\r\n  ],\r\n}]\r",
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
            const lines = ["| Prop | Default | What it does |\r","| --- | --- | --- |\r","| `variant` | `'card'` | `'card'` draws a raised surface. `'plain'` is rhythm only - use it when the form already sits inside one, such as a Modal body or a Card. |\r","| `columns` | `1` | Field grid columns. `2` is what makes a form read as designed rather than dumped. |\r","| `maxWidth` | `'40rem'` | Caps the form's width, so a single text field is not as wide as its container. |\r"];
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
               value: "await slice.build('Form', {\r\n  columns: 2,\r\n  schema: [\r\n    { kind: 'field', name: 'first', label: 'First name', component: 'Input' },\r\n    { kind: 'field', name: 'last',  label: 'Last name',  component: 'Input' },\r\n    // full width - an address or a textarea reads badly at half width\r\n    { kind: 'field', name: 'bio', label: 'Bio', component: 'Textarea', full: true },\r\n  ],\r\n});\r",
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
            const lines = ["| Method | Description |\r","| --- | --- |\r","| `submit()` | Validates; calls `onSubmit(values)` and returns `true` if valid. |\r","| `validate()` | Runs validation, shows errors, returns a boolean. |\r","| `getValues()` | `{ name: value }` read from each field's component. |\r","| `setValue(name, value)` / `setError(name, msg)` / `clearErrors()` / `reset()` | Programmatic helpers. |\r"];
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

customElements.define('slice-formdocumentation', FormDocumentation);
