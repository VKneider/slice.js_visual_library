---
title: Textarea
route: /docs/input/textarea
navLabel: Textarea
section: Input Components
group: Basic
order: 13
description: Multi-line text input with a floating label, auto-grow, validation conditions and an onChange handler.
component: TextareaDocumentation
generate: true
tags: [textarea, input, forms, multiline]
---

# Textarea

## Overview
`Textarea` is the multi-line counterpart to [`Input`](/docs/input/input). It shares the
floating-label look and `conditions`-based validation, and adds textarea-specific options:
an initial `rows` height, optional `autoGrow` that expands the field as the user types, and
an `onChange(value)` handler.

## Core Behavior
- `value` / `placeholder` mirror `Input`. The label floats above the border on focus or once
  the field has a value.
- `rows` sets the initial visible height; `maxlength` caps the character count natively.
- `autoGrow` disables manual resize and grows the field to fit its content on every keystroke.
- `onChange` fires with the current string on every input event.
- `conditions` accepts `{ regex }` or `{ minLength, maxLength }`; call `validateValue()` to run
  the check and surface the error state.
- All listeners live on the component's own nodes, so there is nothing to clean up manually.

## Live Preview
:::component name="Textarea"
{
  "placeholder": "Write your message",
  "rows": 4
}
:::

## Example
```javascript title="Auto-growing comment box"
const comment = await slice.build('Textarea', {
  placeholder: 'Add a comment',
  autoGrow: true,
  maxlength: 500,
  onChange: (value) => slice.logger.logInfo('Comment', `${value.length} chars`)
});
this.appendChild(comment);
```

## Prop Scenarios
:::script label="default textarea" expected="multi-line field with a floating placeholder"
const textarea = await slice.build('Textarea', {
  placeholder: 'Your message',
  rows: 4
});
return textarea;
:::

:::script label="auto-grow field" expected="textarea grows as content is added and cannot be resized manually"
const textarea = await slice.build('Textarea', {
  placeholder: 'Tell us more...',
  autoGrow: true
});
return textarea;
:::

:::script label="prefilled disabled field" expected="readonly-like multi-line value"
const textarea = await slice.build('Textarea', {
  placeholder: 'Release notes',
  value: 'Line one\nLine two\nLine three',
  disabled: true
});
return textarea;
:::

:::script label="validated bio field" expected="minLength condition flips the field into the error state"
const wrapper = document.createElement('div');

const bio = await slice.build('Textarea', {
  placeholder: 'Short bio (min 20 chars)',
  rows: 3,
  required: true,
  conditions: { minLength: 20 }
});

const validate = await slice.build('Button', {
  value: 'Validate',
  onClick: () => bio.validateValue()
});

wrapper.appendChild(bio);
wrapper.appendChild(validate);
return wrapper;
:::

:::script label="character-limited field with live count" expected="onChange drives an external character counter"
const wrapper = document.createElement('div');

const counter = document.createElement('p');
counter.textContent = '0 / 140';

const textarea = await slice.build('Textarea', {
  placeholder: "What's happening?",
  maxlength: 140,
  autoGrow: true,
  onChange: (value) => {
    counter.textContent = `${value.length} / 140`;
  }
});

wrapper.appendChild(textarea);
wrapper.appendChild(counter);
return wrapper;
:::

## Best Practices
:::tip
Pair `autoGrow` with `maxlength` and an external counter (via `onChange`) for comment and
message boxes — it keeps the field compact while making the limit visible.
:::

## Pitfalls
:::warning
`conditions` only validates when you call `validateValue()` (e.g. from a submit handler), not on
every keystroke. Wire it to your `Form`'s submit flow rather than expecting live validation.
:::
