---
title: ToolTip
route: /docs/display/tooltip
navLabel: ToolTip
section: Display
group: Overlay
order: 10
description: ToolTip documentation with hover and focus trigger scenarios.
component: ToolTipDocumentation
generate: true
tags: [tooltip, overlay, display]
---

# ToolTip

## Overview
`ToolTip` displays a floating text label when the user hovers or focuses the wrapped content. The tooltip repositions itself to stay within the viewport.

## API and Behavior
- `text` sets the tooltip string. Empty text suppresses the tooltip.
- Triggered by `mouseenter` / `mouseleave` and `focusin` / `focusout`.
- Bubble is appended to `document.body` for accurate positioning.
- Automatically flips above or below based on available space.
- Cleans up the bubble element on disconnect or destroy.

## Basic Usage
```javascript title="Build tooltip"
const tooltip = await slice.build('ToolTip', {
  text: 'Save changes'
});

tooltip.textContent = 'Hover me';

this.appendChild(tooltip);
```

## Prop Scenarios
:::script label="Hover tooltip" expected="tooltip appears on hover over trigger text"
const tooltip = await slice.build('ToolTip', {
  text: 'This is a tooltip'
});

tooltip.textContent = 'Hover over this text';

return tooltip;
:::

:::script label="Tooltip with button trigger" expected="tooltip wraps a button element"
const tooltip = await slice.build('ToolTip', {
  text: 'Click to confirm'
});

const button = await slice.build('Button', {
  value: 'Submit'
});

tooltip.appendChild(button);

const host = document.createElement('div');
host.appendChild(tooltip);
return host;
:::

:::script label="Empty text suppresses tooltip" expected="no bubble appears on hover"
const tooltip = await slice.build('ToolTip', {
  text: ''
});

tooltip.textContent = 'Hover me (no tooltip)';

return tooltip;
:::

## Best Practices
:::tip
Wrap interactive elements like buttons or icons with `ToolTip` to provide contextual hints without cluttering the UI.
:::

## Pitfalls
:::warning
The tooltip covers the trigger element's content. Place tooltip content as text nodes or child elements inside the component.
:::
