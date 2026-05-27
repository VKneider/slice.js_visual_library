---
title: Button
route: /docs/input/button
navLabel: Button
section: Input Components
group: Basic
order: 10
description: Complete documentation and prop scenarios for Button.
component: ButtonDocumentation
generate: false
tags: [button, input]
---

# Button

## Overview
Describe what this component solves, default behavior, and when to use it.

## API and Behavior
- Use this section for behavior contracts (events, lifecycle expectations, state transitions).
- Do not add manual props tables. The parser injects `Props (Generated from static props)` automatically.

## Example
```javascript title="Basic build"
const button = await slice.build('Button', { value: 'Save' });
this.appendChild(button);
```

## Prop Scenarios
:::script label="value updates label" expected="Button text is updated"
const target = await slice.build('Button', { value: 'Initial' });
target.value = 'Updated';
component.appendChild(target);
if (target.value !== 'Updated') {
  throw new Error('Expected value to be Updated');
}
:::

:::script label="onClickCallback fires" expected="Callback executes once"
let fired = 0;
const target = await slice.build('Button', {
  value: 'Click me',
  onClickCallback: () => {
    fired += 1;
  }
});
component.appendChild(target);
target.querySelector('.slice_button_container')?.click();
if (fired !== 1) {
  throw new Error('Expected callback to fire once');
}
:::

## Best Practices
:::tip
Use explicit prop scenarios for each behavior your team wants to preserve.
:::

## Pitfalls
:::warning
Do not omit required front matter fields. `docs:lint-md` fails the build.
:::
