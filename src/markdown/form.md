---
title: Form
route: /docs/input/form
navLabel: Form
section: Input Components
group: Basic
order: 5
description: Declarative forms with sections, descriptions and validation, composed from Slice components.
component: FormDocumentation
generate: true
tags: [form, forms, validation, input]
---

# Form

## Overview
`Form` builds a form from a **schema** and composes the library's own components (`Input`, `Select`,
`Checkbox`, `Switch`, …). It renders sections, separators, per-field labels/descriptions and validation
errors, reads the values back, and validates on submit. It is a plain Visual — drop it in a view or a
`Modal` body.

## Schema
Each item is discriminated by `kind`:

| `kind` | Fields | Renders |
| --- | --- | --- |
| `'section'` | `title`, `description` | a section header |
| `'separator'` | — | a divider |
| `'group'` | see below | a repeatable set of items |
| `'field'` (default) | see below | a labelled field wrapping a built component |

**Field item:**
- `name` — key in the values object.
- `label`, `description` — field chrome rendered by the Form.
- `component` — a Slice component name, built via `slice.build`.
- `props` — props passed to that component.
- `valueProp` — which prop holds the value (default `'value'`; use `'checked'` for `Checkbox`/`Switch`).
- `value` — initial value (merged into `props` under `valueProp`).
- `required` — `true` or a custom message.
- `validate(value, values)` — returns an error string (falsy when valid). Runs on submit.

## Steps

A schema item may be a `step`, with its own nested `schema`:

```javascript
schema: [
  { kind: 'step', label: 'Account', description: 'Where we sign you in', schema: [
      { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },
  ] },
  { kind: 'step', label: 'Profile', schema: [
      { kind: 'field', name: 'nickname', label: 'Nickname', component: 'Input' },
  ] },
]
```

- **Values live in one Form.** Every step's controls stay built, so what you typed on
  step 1 is still there after three Nexts. That is the thing wizards usually get wrong.
- **Next validates the steps behind you**, not just the current one, and refuses to move
  while any of them is invalid — painting the errors in place.
- **Back never validates.** Leaving a half-filled step is allowed; only moving on is gated.
- **The progress indicator cannot skip validation.** Clicking a step ahead is refused
  exactly as Next would be, so the indicator is a shortcut and not a hole.
- The last step's button is the **Submit** button, and says `submitText`.
- A schema with no `step` is one implicit step: no progress bar, no Back, no Next.

`stepIndex`, `stepCount`, `isStepped`, `nextStep()`, `prevStep()` and `gotoStep(i)`
are public. `nextText` sets the label of the advance button.

:::tip
Use a Modal for two or three short steps, and a route per step for anything longer. A Modal
has no URL, so there is nothing to link to and nothing for the back button to go back to.
:::

## Groups

A `group` is a set of fields the user can add as many of as they need — phone
numbers, addresses, team members. Without it, no flat schema can express "however
many of these do you have?".

```javascript
schema: [{
  kind: 'group',
  name: 'phones',
  label: 'Phone numbers',
  itemLabel: 'Phone',       // singular, used in the item tag and buttons
  min: 1,
  max: 3,
  fields: [                  // the repeated sub-schema
    { name: 'number', label: 'Number', component: 'Input', required: true },
    { name: 'note',   label: 'Note',   component: 'Input' },
  ],
}]
```

- `name` is required — without it the items could not be keyed at all.
- `min` and `max` bound the item count; the Remove buttons disappear at `min`
  and the Add button hides at `max`. Omit `min` and a group starts with one item.
- `value` seeds the first item, and `reset()` restores it.
- Each item's fields are stored internally as `phones[0].number`, so
  `setValue('phones[1].number', x)` and `setError(...)` work on them with no
  special cases.
- **`getValues()` hands the array back nested** — `{ phones: [{ number, note }] }`
  — which is the shape you declared. Flattening is an implementation detail you
  never see.
- Items are added and removed **in place**; the form is not re-rendered, so
  nothing typed elsewhere in it moves or is lost.
- `required` applies to every item, so an empty second phone blocks submit.

:::script
// Live: add and remove phone numbers.
const form = await slice.build('Form', {
  maxWidth: '460px',
  nextText: 'Save',
  schema: [
    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true },
    {
      kind: 'group',
      name: 'phones',
      label: 'Phone numbers',
      itemLabel: 'Phone',
      min: 1,
      max: 4,
      description: 'At least one. We only use these for delivery.',
      fields: [
        { name: 'number', label: 'Number', component: 'Input', required: true },
        { name: 'note', label: 'Note', component: 'Input' },
      ],
    },
  ],
});

return form;
:::

## Layout

Three presentation props, and one per-field opt-out.

| Prop | Default | What it does |
| --- | --- | --- |
| `variant` | `'card'` | `'card'` draws a raised surface. `'plain'` is rhythm only - use it when the form already sits inside one, such as a Modal body or a Card. |
| `columns` | `1` | Field grid columns. `2` is what makes a form read as designed rather than dumped. |
| `maxWidth` | `'40rem'` | Caps the form's width, so a single text field is not as wide as its container. |

```javascript
await slice.build('Form', {
  columns: 2,
  schema: [
    { kind: 'field', name: 'first', label: 'First name', component: 'Input' },
    { kind: 'field', name: 'last',  label: 'Last name',  component: 'Input' },
    // full width - an address or a textarea reads badly at half width
    { kind: 'field', name: 'bio', label: 'Bio', component: 'Textarea', full: true },
  ],
});
```

`full: true` on a **field** keeps it out of a shared grid row. Sections and
separators always span the full row.

:::tip
The container owns the spacing, not the controls. `Input`, `Select` and
`Textarea` carry no vertical margin of their own, so a form's rhythm is
decided in one place. If you need the old standalone spacing, set
`--control-margin-block` on the host.
:::

## Text fields
`Input` and `Textarea` know they are inside a Form and step aside for it:

- **The label is the Form's.** The field is set to `labelPlacement: 'above'` with no label of its own, so the Form's label is the only one. The field takes it as its accessible name, and clicking the label focuses the field.
- **The error is the Form's.** The field does not show its own messages (`validateOn: 'manual'`); the Form prints one message under it, in the same style for every kind of control. The field still draws its own red border, so there is one red edge in the field's own shape.
- **Its rules count.** After the schema's `required` and `validate`, the Form asks the field for its own verdict, so `type: 'email'`, `min`, `max`, `minlength` or a field `validator` set in `props` work without repeating them in the schema.
- **Errors follow the value.** A field with an error on screen is checked again as it is edited, so the message goes away as soon as it is fixed instead of waiting for the next Submit.
- **A failed Submit takes you there.** Focus moves to the first field with a problem.

Anything you pass in a field's `props` wins over these defaults.

## Methods
| Method | Description |
| --- | --- |
| `submit()` | Validates; calls `onSubmit(values)` and returns `true` if valid. |
| `validate()` | Runs validation, shows errors, focuses the first invalid field, returns a boolean. |
| `getValues()` | `{ name: value }` read from each field's component. |
| `setValue(name, value)` / `setError(name, msg)` / `clearErrors()` / `reset()` | Programmatic helpers. |

## Prop Scenarios
:::script label="Account form with sections, description & validation" expected="validates required + email on submit"
const form = await slice.build('Form', {
  submitText: 'Create account',
  resetText: 'Reset',
  // Two columns: short fields share a row, long ones opt out with full: true.
  columns: 2,
  schema: [
    { kind: 'section', title: 'Account', description: 'How you sign in' },
    { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },
    { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },
    { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,
      description: 'We never share it.',
      validate: (v) => (/\S+@\S+\.\S+/.test(v) ? null : 'Enter a valid email') },
    { kind: 'field', name: 'password', label: 'Password', component: 'Input',
      required: true, props: { secret: true } },
    { kind: 'separator' },
    { kind: 'section', title: 'Preferences' },
    { kind: 'field', name: 'newsletter', label: 'Email me product news',
      component: 'Switch', valueProp: 'checked', value: true, full: true },
    { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,
      props: { visibleProp: 'label', options: [{ label: 'Owner', value: 'owner' }, { label: 'Member', value: 'member' }] } }
  ],
  onSubmit: (values) => console.log('submit', values)
});

return form;
:::

:::script label="Form inside a Modal" expected="the form lives in the modal body"
// variant: 'plain' — the Modal body is already a surface, so a card inside
// it would be a box in a box.
const form = await slice.build('Form', {
  submitText: 'Save',
  variant: 'plain',
  schema: [
    { kind: 'field', name: 'title', label: 'Title', component: 'Input', required: true },
    { kind: 'field', name: 'pinned', label: 'Pin to top', component: 'Checkbox', valueProp: 'checked' }
  ],
  onSubmit: (values) => { console.log(values); modal.close(); }
});

const modal = await slice.build('Modal', { title: 'New note', open: true });
modal.appendBody(form);
return modal;
:::

:::script label="Profile form — Input + Select + Switch" expected="mixed components, valueProp for the switch"
const form = await slice.build('Form', {
  submitText: 'Save profile',
  schema: [
    { kind: 'section', title: 'Profile' },
    { kind: 'field', name: 'fullName', label: 'Full name', component: 'Input', required: true },
    { kind: 'field', name: 'role', label: 'Role', component: 'Select', required: true,
      props: {
        visibleProp: 'label',
        searchable: true,
        options: [
          { label: 'Owner', value: 'owner' },
          { label: 'Editor', value: 'editor' },
          { label: 'Viewer', value: 'viewer' }
        ]
      } },
    { kind: 'separator' },
    { kind: 'field', name: 'twoFactor', label: 'Enable two-factor auth',
      component: 'Switch', valueProp: 'checked', value: false }
  ],
  onSubmit: (values) => console.log('profile', values)
});

return form;
:::

:::script label="Cross-field validation (confirm password)" expected="confirm must match password"
const form = await slice.build('Form', {
  submitText: 'Set password',
  schema: [
    { kind: 'field', name: 'password', label: 'Password', component: 'Input',
      required: true, props: { secret: true } },
    { kind: 'field', name: 'confirm', label: 'Confirm password', component: 'Input',
      required: true, props: { secret: true },
      // the second arg is every current value — use it for cross-field rules
      validate: (value, values) => (value === values.password ? null : 'Passwords do not match') }
  ],
  onSubmit: (values) => console.log('ok', values)
});

return form;
:::

:::script label="Server-side errors via setError()" expected="onSubmit can flag a field after an async check"
const form = await slice.build('Form', {
  submitText: 'Claim username',
  schema: [
    { kind: 'field', name: 'username', label: 'Username', component: 'Input', required: true,
      description: 'Try "admin" to see a server-side error.' }
  ],
  onSubmit: async (values) => {
    // pretend to hit an API
    const taken = values.username.toLowerCase() === 'admin';
    if (taken) {
      form.setError('username', 'That username is already taken');
    } else {
      console.log('available', values.username);
    }
  }
});

return form;
:::

:::script label="Settings form with multiple sections" expected="grouped fields with separators"
const form = await slice.build('Form', {
  submitText: 'Apply settings',
  resetText: 'Reset',
  schema: [
    { kind: 'section', title: 'Notifications', description: 'How we reach you' },
    { kind: 'field', name: 'emailNotifs', label: 'Email notifications',
      component: 'Checkbox', valueProp: 'checked', value: true },
    { kind: 'field', name: 'smsNotifs', label: 'SMS notifications',
      component: 'Checkbox', valueProp: 'checked', value: false },
    { kind: 'separator' },
    { kind: 'section', title: 'Display' },
    { kind: 'field', name: 'density', label: 'Density', component: 'Select',
      props: {
        visibleProp: 'label',
        options: [
          { label: 'Comfortable', value: 'comfortable' },
          { label: 'Compact', value: 'compact' }
        ]
      } }
  ],
  onSubmit: (values) => console.log('settings', values)
});

return form;
:::

:::script label="Multi-page onboarding" expected="try Next with the fields empty — it refuses and tells you why"
const log = document.createElement('p');
log.style.cssText = 'font-family:system-ui,sans-serif;font-size:.8em;color:var(--font-secondary-color);margin:0';

const form = await slice.build('Form', {
  columns: 2,
  submitText: 'Create account',
  nextText: 'Next',
  schema: [
    {
      kind: 'step',
      label: 'Account',
      description: 'Where we send your sign-in link.',
      schema: [
        { kind: 'field', name: 'email', label: 'Email', component: 'Input', required: true,
          props: { type: 'email' } },
        { kind: 'field', name: 'password', label: 'Password', component: 'Input',
          required: true, props: { secret: true } },
      ],
    },
    {
      kind: 'step',
      label: 'Profile',
      description: 'How people see you.',
      schema: [
        { kind: 'field', name: 'firstName', label: 'First name', component: 'Input', required: true },
        { kind: 'field', name: 'lastName', label: 'Last name', component: 'Input', required: true },
        { kind: 'field', name: 'bio', label: 'Bio', component: 'Input', full: true,
          description: 'Optional. Shown under your name.' },
      ],
    },
    {
      kind: 'step',
      label: 'Preferences',
      description: 'You can change these later.',
      schema: [
        { kind: 'field', name: 'newsletter', label: 'Email me product news',
          component: 'Switch', valueProp: 'checked', full: true },
        { kind: 'field', name: 'role', label: 'Role', component: 'Select', full: true,
          props: { visibleProp: 'label', options: [
            { label: 'Owner', value: 'owner' },
            { label: 'Member', value: 'member' },
          ] } },
      ],
    },
  ],
  onSubmit: (values) => {
    log.textContent = 'Submitted: ' + Object.keys(values).join(', ');
    console.log('submit', values);
  },
});

const wrap = document.createElement('div');
wrap.appendChild(form);
wrap.appendChild(log);
return wrap;
:::

## Best Practices
:::tip
Let the Form own the field's `label`/`description`; don't also set the component's own `label` in
`props` or it doubles up (for `Checkbox`/`Switch` you may prefer the component's inline label — then omit
the field `label`).
:::

:::tip
`validate(value, values)` receives **all** current values as its second argument — use it for cross-field
rules (confirm-password, date ranges). For server-side errors, call `form.setError(name, message)` from an
async `onSubmit`.
:::

## Pitfalls

:::warning
A field whose `component` is missing — or names something that is not registered — renders **nothing**
where the control should be. It is left visible as a dashed marker naming the problem, and the Form logs
a warning naming the field, but the field contributes **no key** to `getValues()`.

That is worth knowing at submit time: a broken field does not block the form, it just quietly
disappears from the payload. If a field is required, the usual validation is what catches it.
:::

:::warning
The Form **builds** its field + button components with `slice.build` and destroys them in
`beforeDestroy()`. Components built with `slice.build` are not auto-destroyed by a parent — so destroy
the `Form` itself through `slice.controller.destroyComponent(form)` / `destroyByContainer(node)` when you
tear down whatever hosts it (a view). A [Modal](/docs/feedback/modal) destroys what is in its body when
it is destroyed, so a Form in a Modal with `destroyOnClose: true` is taken care of.
:::
