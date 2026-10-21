---
title: RadioGroup
route: /docs/input/radio-group
navLabel: RadioGroup
section: Input Components
group: Basic
order: 14
description: Single-choice control that owns its value — keyboard, forms and card pickers included.
component: RadioGroupDocumentation
generate: true
tags: [radio, radiogroup, input, forms, choice]
---

# RadioGroup

## Overview
`RadioGroup` lets the user pick **exactly one** option from a short list. The group owns the value:
`value` is the selected option's `value` (or `null` while nothing is selected), and `onChange` fires
with the new one.

Use it when every option should be visible at once and there are only a handful of them (2–6). For a
long list use `Select`; for a single on/off setting use `Switch` or `Checkbox`.

## Core Behavior
- `options` is an array of `{ label, value, description?, disabled? }`. A bare string or number is shorthand for `{ label: String(x), value: x }`. An object without `value` uses its `label`.
- `value` selects the option whose `value` matches. The comparison is strict (`Object.is`), so `1` and `'1'` are different values.
- `value` may be passed before or after `options` — the selection is resolved once both exist. A value that matches no option leaves the group unselected (`value` becomes `null`) and logs a warning.
- Replacing `options` keeps the current value if it is still one of the options, and clears it otherwise.
- `onChange(value, option)` fires only when the **user** selects an option (click or arrow keys). Setting `value` from code never fires it. `option` is the original entry you passed. Assign `null` to clear the handler.
- `selectedOption` returns the original entry of the selected option (or `null`) — handy when options carry extra data such as a price.
- `name` is shared by every radio. It is generated when omitted, so two groups never interfere; set it when the group sits in a native `<form>`, which then submits the selected value under that name.
- `label` renders a `<legend>` that also names the group for screen readers.
- `disabled` disables the whole group; `disabled: true` on an option disables just that one.
- `required` sets native `required` on the radios and `aria-required` on the group.
- `orientation` is `vertical` (default) or `horizontal` (options wrap on narrow screens).
- `labelPlacement` (`right` | `left` | `top` | `bottom`) places each option's text relative to its circle.
- `variant`: `default` (success accent, matches `Checkbox`), `outlined`, `soft`, `plain` (no container chip) or `card` (every option is a selectable card — best with `description`). Unknown values fall back to `default`.
- `size` (`sm` | `md` | `lg`) scales circles and text together.
- `customColor: { accent }` recolours the selected circle and card, in every variant.

## Keyboard and accessibility
The options are real `<input type="radio">` elements inside a `<fieldset role="radiogroup">`, so the
browser provides the standard radio keyboard model:

- **Tab** enters the group on the selected option (or the first enabled one) and **Tab** again leaves it — the group is a single tab stop.
- **Arrow keys** move to the next/previous option **and select it**, skipping disabled options.
- **Space** selects the focused option.

`el.focus()` focuses the group the same way Tab would. The radios are visually hidden but stay in the
accessibility tree; the focus ring is drawn on the visible circle. Option descriptions are linked to
their radio with `aria-describedby`.

## Theming
Every visual knob is a custom property on the host, so one instance can be tuned without touching the
component: `--slice-radio-mark-size`, `--slice-radio-mark-border`, `--slice-radio-mark-border-width`,
`--slice-radio-mark-surface`, `--slice-radio-gap`, `--slice-radio-surface`,
`--slice-radio-surface-border`, `--slice-radio-card-surface` and `--slice-radio-card-border`. For the
accent colour use `customColor`.

## Live Preview
:::component name="RadioGroup"
{
  "label": "Plan",
  "options": [
    { "label": "Free", "value": "free" },
    { "label": "Pro", "value": "pro" },
    { "label": "Team", "value": "team" }
  ],
  "value": "pro"
}
:::

## Prop Scenarios
:::script label="basic group" expected="three options, Pro selected"
const group = await slice.build('RadioGroup', {
  label: 'Plan',
  options: [
    { label: 'Free', value: 'free' },
    { label: 'Pro', value: 'pro' },
    { label: 'Team', value: 'team' }
  ],
  value: 'pro'
});

return group;
:::

:::script label="onChange reports the selection" expected="the text below updates as you pick"
const output = document.createElement('p');
output.textContent = 'Nothing selected yet';

const group = await slice.build('RadioGroup', {
  label: 'Notifications',
  options: [
    { label: 'Everything', value: 'all' },
    { label: 'Mentions only', value: 'mentions' },
    { label: 'Nothing', value: 'none' }
  ],
  onChange: (value, option) => {
    output.textContent = `Selected: ${option.label} (${value})`;
  }
});

const host = document.createElement('div');
host.append(group, output);
return host;
:::

:::script label="shorthand options and horizontal layout" expected="sizes in a single row"
const group = await slice.build('RadioGroup', {
  label: 'Size',
  options: ['XS', 'S', 'M', 'L', 'XL'],
  value: 'M',
  orientation: 'horizontal'
});

return group;
:::

:::script label="card picker with descriptions" expected="each option is a card; Express is selected and Pickup is disabled"
const group = await slice.build('RadioGroup', {
  label: 'Shipping method',
  variant: 'card',
  orientation: 'horizontal',
  value: 'express',
  options: [
    { label: 'Standard', value: 'standard', description: '3–5 business days · Free' },
    { label: 'Express', value: 'express', description: 'Next business day · $9' },
    { label: 'Pickup', value: 'pickup', description: 'Not available in your area', disabled: true }
  ]
});

return group;
:::

:::script label="options carrying extra data" expected="selectedOption exposes the price of the chosen plan"
const plans = [
  { label: 'Monthly', value: 'monthly', price: 12, description: '$12 / month' },
  { label: 'Yearly', value: 'yearly', price: 120, description: '$120 / year — two months free' }
];

const total = document.createElement('p');

const group = await slice.build('RadioGroup', {
  label: 'Billing',
  variant: 'card',
  options: plans,
  value: 'yearly',
  onChange: () => {
    total.textContent = `Total today: $${group.selectedOption.price}`;
  }
});
total.textContent = `Total today: $${group.selectedOption.price}`;

const host = document.createElement('div');
host.append(group, total);
return host;
:::

:::script label="controlled from outside" expected="the buttons change the selection without firing onChange"
const group = await slice.build('RadioGroup', {
  label: 'Theme',
  options: [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' }
  ],
  value: 'system'
});

const actions = document.createElement('div');
actions.style.display = 'flex';
actions.style.gap = '8px';

for (const value of ['light', 'dark', 'system']) {
  actions.appendChild(await slice.build('Button', {
    value: `Set ${value}`,
    size: 'sm',
    variant: 'outlined',
    onClick: () => { group.value = value; }
  }));
}

actions.appendChild(await slice.build('Button', {
  value: 'Clear',
  size: 'sm',
  variant: 'ghost',
  onClick: () => { group.value = null; }
}));

const host = document.createElement('div');
host.append(group, actions);
return host;
:::

:::script label="disabled group and disabled option" expected="the first group is fully disabled; in the second only Team is"
const options = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' },
  { label: 'Team', value: 'team' }
];

const locked = await slice.build('RadioGroup', {
  label: 'Managed by your organisation',
  options,
  value: 'pro',
  disabled: true
});

const partial = await slice.build('RadioGroup', {
  label: 'Upgrade to',
  options: options.map((o) => (o.value === 'team' ? { ...o, disabled: true } : o))
});

const host = document.createElement('div');
host.style.display = 'flex';
host.style.flexWrap = 'wrap';
host.style.gap = '16px';
host.append(locked, partial);
return host;
:::

:::script label="variant variations" expected="default, outlined, soft and plain side by side"
const host = document.createElement('div');
host.style.display = 'flex';
host.style.flexWrap = 'wrap';
host.style.gap = '16px';

for (const variant of ['default', 'outlined', 'soft', 'plain']) {
  host.appendChild(await slice.build('RadioGroup', {
    label: variant,
    variant,
    options: ['One', 'Two'],
    value: 'Two'
  }));
}

return host;
:::

:::script label="size and label placement" expected="sm, md and lg groups; the last puts labels on the left"
const host = document.createElement('div');
host.style.display = 'flex';
host.style.flexWrap = 'wrap';
host.style.alignItems = 'flex-start';
host.style.gap = '16px';

for (const size of ['sm', 'md', 'lg']) {
  host.appendChild(await slice.build('RadioGroup', {
    label: `Size ${size}`,
    size,
    options: ['Daily', 'Weekly'],
    value: 'Weekly'
  }));
}

host.appendChild(await slice.build('RadioGroup', {
  label: 'Labels on the left',
  labelPlacement: 'left',
  options: ['Daily', 'Weekly'],
  value: 'Daily'
}));

return host;
:::

:::script label="custom accent" expected="the selected circle uses the custom colour"
const group = await slice.build('RadioGroup', {
  label: 'Priority',
  options: ['Low', 'Normal', 'High'],
  value: 'High',
  customColor: { accent: '#d97706' }
});

return group;
:::

:::script label="inside a Form" expected="submitting without a choice shows the required message"
const result = document.createElement('pre');

const form = await slice.build('Form', {
  submitText: 'Continue',
  schema: [
    {
      name: 'contact',
      component: 'RadioGroup',
      required: 'Choose how we should contact you',
      props: {
        label: 'Preferred contact',
        variant: 'plain',
        orientation: 'horizontal',
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Don’t contact me', value: 'none' }
        ]
      }
    }
  ],
  onSubmit: (values) => {
    result.textContent = JSON.stringify(values);
  }
});

const host = document.createElement('div');
host.append(form, result);
return host;
:::

## Best Practices
:::tip
Order options in a meaningful way (cheapest first, most common first) and pre-select a sensible
default when one exists — a group with nothing selected forces an extra decision.
:::

:::tip
Inside a `Form`, put the label on the **RadioGroup** (`props.label`) rather than on the Form field, and
use `variant: 'plain'`. The group's legend is what names it for screen readers; a Form field label sits
next to the group but is not associated with it.
:::

## Pitfalls
:::warning
`value` is compared strictly. If your options use numbers (`value: 1`), set `value: 1`, not `'1'` —
otherwise nothing is selected and a warning is logged.
:::

:::warning
Do not use a RadioGroup for actions. Selecting an option should only change a value; if picking it
should immediately trigger an action, use buttons instead.
:::
