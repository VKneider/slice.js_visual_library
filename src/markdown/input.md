---
title: Input
route: /docs/input/input
navLabel: Input
section: Input Components
group: Basic
order: 11
description: Text field with a floating label, variants, sizes, icon, prefix and suffix, clear button, help, errors, a counter and validation shared with Textarea.
component: InputDocumentation
generate: true
tags: [input, forms, field, validation]
---

# Input

## Overview
`Input` is a single-line text field. Underneath it is a real `<input>` labelled by a real `<label>`, so browser autofill, password managers, screen readers and native `<form>`s all work with it as they would with a plain field. It shares one look with [Textarea](/docs/input/textarea) and [Select](/docs/input/select): the same heights, border, focus ring, variants and help line. Its floating label and error shake are the same as Textarea's.

## Core Behavior
- `value` reads and sets the text. `onChange(value)` fires on every keystroke; with `debounce: 300` it fires once, 300 ms after typing stops (right for search).
- `type` is any native type: `text`, `email`, `password`, `number`, `url`, `tel`, `search`, `date`…
- `name` makes the field part of a native `<form>` (`FormData` sees it). `autocomplete`, `inputmode`, `min`, `max`, `step` and `pattern` are passed to the `<input>`.
- `onEnter(value, event)` fires on Enter.
- `focus()`, `blur()`, `select()` and `clear()` do what they say.
- `disabled` greys it out; `readonly` keeps it focusable and copyable but not editable.

## The label
- `label` floats: it sits inside the empty field and rises above it on focus or once there is a value. With a `label`, `placeholder` becomes the native hint, shown once the label has risen.
- `labelPlacement: 'above'` puts the label above the field, in the flow, the way forms usually do.
- `required` adds a red asterisk to the label.
- **Older API:** `placeholder` alone, with no `label`, is still the floating label, as it always was.
- With no visible label, give it an `ariaLabel` so screen readers can name it.

## Looks
- `variant`: `'outlined'` (default), `'filled'` (a tinted background, no border) or `'ghost'` (no background or border until hovered). The same names as Select and Button.
- `size`: `'sm'` (32px), `'md'` (42px, default) or `'lg'` (50px). The same heights as Select and Button, so a row of them lines up.
- `icon` is any [Icon](/docs/display/icon) name, shown at the start of the field.
- `prefix` and `suffix` are short texts inside the field: `'$'`, `'https://'`, `'kg'`, `'USD'`. A prefix keeps the label risen, since it sits where the resting label would.
- `clearable` adds a ✕ while there is text. Escape clears it too.
- `secret` with `type: 'password'` adds an eye that shows and hides the password.

## Help, errors and the counter
- `help` is a hint under the field.
- `error` is a message you set (from a server check, say). It replaces the help, turns the field red and is announced to screen readers. `error: ''` clears it.
- `invalid: true` turns the field red without a message (a Form uses this, since it prints its own).
- `showCount` shows the length under the field, against `maxlength` when there is one ("9 / 20").

## Validation
The rules are shared with Textarea:
- `required`;
- the native checks for the type: email and URL format, number ranges (`min`, `max`, `step`) and `pattern`;
- `minlength` and `maxlength`;
- `conditions`, the older rule object (character counts, lengths or a `regex`), with `conditionsMessage`;
- `validator(value)`, your own rule, returning a message or nothing.

When an error shows:
- An error shows when the person **leaves** the field, not while they type the first characters. From then on it follows the value **live**, so it disappears as soon as the value is fixed.
- An **empty** field is never turned red on its own: not when someone tabs through it, and not when its text is deleted. `required` and `minlength` are only claimed by `validate()`, which a form calls when someone tries to submit, with the shake. Until then an empty field is just empty.
- `validateOn: 'input'` judges on every keystroke; `'manual'` shows nothing until `validate()`.

Messages and methods:
- `messages` overrides the wording: `{ required, email, url, number, min, max, step, minlength, maxlength, pattern }`. `{min}`, `{max}`, `{step}`, `{minlength}` and `{maxlength}` are filled in.
- `validate()` shows the result, gives an invalid field one short shake and returns `true` or `false`.
- `validationMessage` returns the message without showing anything, and `isValid` says whether there is one.
- The older `validateValue()`, `triggerError()` and `triggerSuccess()` still work.

## Live Preview
:::component name="Input"
{
  "label": "Email",
  "type": "email",
  "icon": "user",
  "placeholder": "you@company.com",
  "help": "We never share it.",
  "required": true,
  "clearable": true
}
:::

## Examples
:::script label="Sign in" expected="Sign in validates both fields (the first problem gets the focus); Enter in the password signs in too"
const toasts = await slice.build('ToastProvider', { singleton: true });
const card = document.createElement('div');
card.style.cssText = 'display:flex;flex-direction:column;gap:18px;width:100%;max-width:380px;padding:24px;border:1px solid var(--slice-border-raised);border-radius:16px;background:var(--slice-surface-raised)';

const title = document.createElement('h3');
title.textContent = 'Welcome back';
title.style.margin = '0';

const email = await slice.build('Input', {
  label: 'Email', type: 'email', name: 'email', autocomplete: 'email', icon: 'user', required: true
});
const password = await slice.build('Input', {
  label: 'Password', type: 'password', name: 'password', autocomplete: 'current-password',
  secret: true, required: true, minlength: 8,
  onEnter: () => signIn()
});
const remember = await slice.build('Checkbox', { label: 'Keep me signed in', checked: true });

const signIn = () => {
  // validate() each field; focus the first one that fails.
  const fields = [email, password];
  const results = fields.map((f) => f.validate());
  const first = fields[results.indexOf(false)];
  if (first) return first.focus();
  toasts.show(`Signed in as ${email.value}`, { type: 'success' });
};
const button = await slice.build('Button', { value: 'Sign in', onClick: signIn });
button.style.alignSelf = 'stretch';

card.append(title, email, password, remember, button);
return card;
:::

:::script label="Search that filters a Table" expected="typing filters the table after a short pause; the badge counts the matches; ✕ or Escape clears"
const people = [
  { name: 'Ana López', role: 'Designer', city: 'Maracaibo' },
  { name: 'José Pérez', role: 'Engineer', city: 'Caracas' },
  { name: 'Lucas Molina', role: 'Engineer', city: 'Valencia' },
  { name: 'María Ruiz', role: 'Product', city: 'Mérida' },
  { name: 'Carlos Díaz', role: 'Support', city: 'Maracaibo' },
  { name: 'Elena Mora', role: 'Designer', city: 'Caracas' }
];
const table = await slice.build('Table', {
  columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'city', label: 'City' }],
  rows: people
});
table.style.width = '100%';
const count = await slice.build('Badge', { label: `${people.length} people`, tone: 'accent' });

const search = await slice.build('Input', {
  ariaLabel: 'Search people',
  placeholder: 'Search by name, role or city…',
  labelPlacement: 'above',
  icon: 'search',
  clearable: true,
  debounce: 250,
  onChange: (q) => {
    const query = q.trim().toLowerCase();
    const rows = people.filter((p) => Object.values(p).some((v) => v.toLowerCase().includes(query)));
    table.rows = rows;
    count.label = `${rows.length} ${rows.length === 1 ? 'person' : 'people'}`;
  }
});
search.style.flex = '1';

const bar = document.createElement('div');
bar.style.cssText = 'display:flex;gap:12px;align-items:center;margin-bottom:12px';
bar.append(search, count);
const box = document.createElement('div');
box.style.width = '100%';
box.append(bar, table);
return box;
:::

:::script label="Order line with a total" expected="quantity and price fields with prefix and suffix; the total updates live; out-of-range values explain themselves"
const qty = await slice.build('Input', {
  label: 'Quantity', type: 'number', value: '2', min: 1, max: 50, suffix: 'units', validateOn: 'input'
});
const price = await slice.build('Input', {
  label: 'Unit price', type: 'number', value: '19.90', step: '0.01', min: 0, prefix: '$', suffix: 'USD'
});
const discount = await slice.build('Select', {
  label: 'Discount', options: [{ label: 'None', value: 0 }, { label: '10%', value: 0.1 }, { label: '25%', value: 0.25 }], selected: 0
});
const total = document.createElement('div');
total.style.cssText = 'font-size:1.6rem;font-weight:700;font-variant-numeric:tabular-nums';

const update = () => {
  if (!qty.isValid || !price.isValid) { total.textContent = '—'; return; }
  const sum = Number(qty.value) * Number(price.value) * (1 - Number(discount.selected || 0));
  total.textContent = `$${sum.toFixed(2)}`;
};
qty.onChange = update;
price.onChange = update;
discount.onChange = update;
update();

const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px;align-items:end;width:100%';
const sumBox = document.createElement('div');
sumBox.append(Object.assign(document.createElement('div'), { textContent: 'Total', style: 'font-size:.8rem;opacity:.7' }), total);
grid.append(qty, price, discount, sumBox);
return grid;
:::

:::script label="Username with an availability check" expected="the format is checked locally; after a pause the 'server' answers: taken names show an error, free ones a confirmation"
const taken = ['admin', 'ana', 'slice', 'root'];
let request = 0;
const username = await slice.build('Input', {
  label: 'Username',
  prefix: '@',
  maxlength: 20,
  showCount: true,
  help: 'Letters, numbers and _ only',
  validateOn: 'input',
  validator: (v) => (/^[a-z0-9_]+$/i.test(v) ? null : 'Only letters, numbers and _'),
  debounce: 400,
  onChange: async (value) => {
    username.error = '';
    if (!value || !username.isValid) { username.help = 'Letters, numbers and _ only'; return; }
    const mine = ++request;
    username.help = 'Checking…';
    await new Promise((r) => setTimeout(r, 500));   // pretend to ask the server
    if (mine !== request) return;                    // an older answer arrived late
    if (taken.includes(value.toLowerCase())) username.error = `@${value} is taken`;
    else username.help = `✓ @${value} is available`;
  }
});
username.style.maxWidth = '360px';
return username;
:::

:::script label="Invite by email" expected="Enter adds an email as a chip; invalid ones are refused with a message; Send invites confirms"
const toasts = await slice.build('ToastProvider', { singleton: true });
const emails = new Set();
const chips = document.createElement('div');
chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;min-height:28px';

const input = await slice.build('Input', {
  label: 'Invite people',
  type: 'email',
  icon: 'user-add',
  placeholder: 'name@company.com, then Enter',
  help: 'Press Enter after each address',
  onEnter: async (value) => {
    const email = value.trim().toLowerCase();
    if (!email || !input.validate()) return;
    if (emails.has(email)) { input.error = 'Already on the list'; return; }
    emails.add(email);
    const chip = await slice.build('Chip', {
      label: email, size: 'sm', removable: true,
      onRemove: () => { emails.delete(email); slice.controller.destroyComponent(chip); chip.remove(); }
    });
    chips.appendChild(chip);
    input.clear();
  }
});
const send = await slice.build('Button', {
  value: 'Send invites',
  icon: 'user-add',
  onClick: () => {
    if (emails.size === 0) { input.error = 'Add at least one address'; input.focus(); return; }
    toasts.show(`Sent ${emails.size} invite${emails.size === 1 ? '' : 's'}`, { type: 'success' });
    emails.clear();
    slice.controller.destroyByContainer(chips);
    chips.replaceChildren();
  }
});
const box = document.createElement('div');
box.style.cssText = 'display:flex;flex-direction:column;gap:14px;width:100%;max-width:460px';
box.append(input, chips, send);
return box;
:::

:::script label="Looks at a glance" expected="the three variants, the three sizes, and the label above"
const grid = document.createElement('div');
grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:22px 18px;width:100%';
const specs = [
  { label: 'Outlined', value: 'Default look' },
  { label: 'Filled', variant: 'filled', value: 'Tinted, no border' },
  { label: 'Ghost', variant: 'ghost', placeholder: 'Shows on hover' },
  { label: 'Small', size: 'sm' },
  { label: 'Medium' },
  { label: 'Large', size: 'lg' },
  { label: 'Label above', labelPlacement: 'above', placeholder: 'Static label' },
  { label: 'Disabled', disabled: true, value: 'Not editable' },
  { label: 'Read-only', readonly: true, value: 'Copy me' }
];
for (const props of specs) grid.appendChild(await slice.build('Input', props));
return grid;
:::

## Best Practices
:::tip
Give every field a `label`. A placeholder disappears as soon as someone types, so it cannot be the only thing that says what the field is for. Use `placeholder` for an example of the format ("you@company.com").
:::

:::tip
Use the right `type` and `autocomplete`. `type: 'email'` brings the email keyboard on phones and the format check for free; `autocomplete: 'current-password'` lets password managers fill it.
:::

:::tip
For a server check (a username, a coupon), set `error` from your own code and clear it on the next change, as in the availability example. Keep the format rules in `validator` so they answer instantly.
:::

## Pitfalls
:::warning
Inputs no longer carry a 20px margin. Spacing belongs to whatever holds them (a Form, a grid, a flex column with a `gap`). To get the old spacing back on one field, set `--control-margin-block: 20px` on it.
:::

:::warning
Inside a [Form](/docs/input/form), the Form owns the label and the error: it sets `labelPlacement: 'above'`, turns off the field's own validation display and prints the message itself. Give the label to the schema item (`label: 'Email'`), not to the Input's `props`, or it shows twice.
:::

:::warning
`maxlength` stops typing at the limit. If you would rather let people type past it and show the error, use a `validator` that checks the length, with `showCount` to show how far over they are.
:::

## Language

The built-in texts are `slice.input.*` keys with English and Spanish defaults, registered by
`shared/text/texts.js` in the translator's lowest layer: an app dictionary always wins, and the
component keeps its English text when the translator is off.
The text prop `texts` still wins over the dictionary.
Keys: `clear`, `togglePassword`.
