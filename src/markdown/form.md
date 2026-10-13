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

## Methods
| Method | Description |
| --- | --- |
| `submit()` | Validates; calls `onSubmit(values)` and returns `true` if valid. |
| `validate()` | Runs validation, shows errors, returns a boolean. |
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
tear down whatever hosts it (a Modal, a view).
:::
