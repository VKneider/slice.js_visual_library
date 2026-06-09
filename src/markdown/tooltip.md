---
title: ToolTip
route: /docs/display/tooltip
navLabel: ToolTip
section: Display
group: Overlay
order: 10
description: ToolTip documentation with hover, focus, placement, and delay scenarios.
component: ToolTipDocumentation
generate: true
tags: [tooltip, overlay, display]
---

# ToolTip

## Overview
`ToolTip` displays a floating text label when the user hovers or focuses the wrapped content. The tooltip repositions itself to stay within the viewport and falls back to alternative placements when space is limited.

## Core Behavior
- `text` sets the tooltip string. Empty text suppresses the tooltip entirely.
- Triggered by `mouseenter` / `mouseleave` and `focusin` / `focusout` (keyboard accessible).
- `placement` controls preferred direction (`top`, `bottom`, `left`, `right`); the tooltip auto-falls back to other sides if the viewport doesn't fit.
- `showDelay` / `hideDelay` add an intent delay for smoother hover experience.
- `offset` controls gap between trigger and bubble (min `4px`).
- `maxWidth` limits the bubble width (min `120px`).
- `customColor` accepts `{ background, text }` to override the default theme tokens.
- `Escape` key or clicking outside dismisses the bubble.
- Bubble is appended to `document.body` for accurate positioning.
- Sets `aria-describedby` on the host pointing to the bubble `id` when visible.

## Live Preview
:::component name="ToolTip"
{
  "text": "Save your work before leaving"
}
:::

## Placement Variants
Use `placement` to control where the bubble appears. The component automatically tries fallback positions when the preferred side has no room.

:::script label="Placement directions" expected="four tooltips with different placements"
const row = document.createElement('div');
row.style.cssText = 'display:flex;gap:24px;flex-wrap:wrap;align-items:center;padding:40px 0;';

for (const placement of ['top', 'bottom', 'left', 'right']) {
  const tt = await slice.build('ToolTip', {
    text: `${placement} tooltip`,
    placement
  });
  tt.textContent = placement;
  row.appendChild(tt);
}

return row;
:::

## Delay for Intent
Use `showDelay` to prevent flicker when the cursor passes over a trigger briefly. `hideDelay` keeps the bubble visible while moving between related triggers.

:::script label="Show delay (200ms)" expected="tooltip appears after a short wait"
const tt = await slice.build('ToolTip', {
  text: 'Appears after 200ms',
  showDelay: 200
});
tt.textContent = 'Hover me slowly';

const note = document.createElement('p');
note.textContent = 'Move cursor over the text and hold — the tooltip waits 200ms before appearing.';
note.style.marginTop = '0';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(tt);
return wrapper;
:::

:::script label="Hide delay (400ms)" expected="tooltip stays visible briefly after cursor leaves"
const tt = await slice.build('ToolTip', {
  text: 'Stays 400ms after you leave',
  hideDelay: 400
});
tt.textContent = 'Hover then move away quickly';

const hint = document.createElement('p');
hint.textContent = 'The bubble fades out slowly — good for reading longer hints.';

const wrapper = document.createElement('div');
wrapper.appendChild(hint);
wrapper.appendChild(tt);
return wrapper;
:::

## Auto-Placement Fallback
When the preferred `placement` has no room, the tooltip automatically falls back to the next available side.

:::script label="Auto fallback near edge" expected="tooltip flips above or below when side has no space"
const trigger = await slice.build('ToolTip', {
  text: 'Flipped to fit in viewport — the tooltip avoids clipping automatically.',
  placement: 'left'
});
trigger.textContent = 'Hover (near edge)';

const container = document.createElement('div');
container.style.cssText = 'display:flex;justify-content:flex-end;padding:20px;';
container.appendChild(trigger);

const note = document.createElement('p');
note.textContent = 'This tooltip requests placement=left but since there is no room it falls back to a visible side.';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(container);
return wrapper;
:::

## Keyboard & Dismiss
The tooltip is fully keyboard accessible and respects common dismiss patterns.

:::script label="Focus trigger (keyboard)" expected="tooltip appears when trigger receives focus"
const tt = await slice.build('ToolTip', {
  text: 'Appears on focus — try tabbing to this element.'
});
tt.textContent = 'Focus me (tab key)';

const note = document.createElement('p');
note.textContent = 'The tooltip activates on focusin (keyboard) just like mouseenter. Press Escape or click outside to close.';
note.style.marginTop = '0';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(tt);
return wrapper;
:::

## Custom Width and Offset
`maxWidth` controls how wide the bubble can grow (default `300px`). `offset` tightens or increases the gap between trigger and bubble (minimum `4px`).

:::script label="Long text with maxWidth" expected="tooltip wraps text within 180px"
const tt = await slice.build('ToolTip', {
  text: 'This is a longer description that wraps to multiple lines at 180px',
  maxWidth: 180
});
tt.textContent = 'Narrow tooltip';

const note = document.createElement('p');
note.textContent = 'The bubble is capped at 180px wide so long text wraps.';
note.style.marginTop = '0';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(tt);
return wrapper;
:::

:::script label="Tight offset (4px)" expected="bubble appears close to trigger"
const tt = await slice.build('ToolTip', {
  text: 'Tight spacing',
  offset: 4
});
tt.textContent = 'Hover (4px gap)';

const note = document.createElement('p');
note.textContent = 'Offset of 4px places the bubble very close to the trigger.';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(tt);
return wrapper;
:::

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

:::script label="Toolbar with icon buttons" expected="multiple tooltips in a toolbar row"
const icons = [
  { name: 'search', label: 'Search documents' },
  { name: 'download', label: 'Download report' },
  { name: 'share-nodes', label: 'Share with team' },
  { name: 'trash-bin', label: 'Delete item' }
];

const toolbar = document.createElement('div');
toolbar.style.cssText = 'display:flex;gap:6px;padding:8px 12px;border:1px solid var(--outline-primary);border-radius:8px;width:fit-content;';

for (const item of icons) {
  const icon = await slice.build('Icon', { name: item.name, iconStyle: 'filled', size: '18px' });
  const tt = await slice.build('ToolTip', {
    text: item.label,
    placement: 'bottom',
    hideDelay: 200
  });
  tt.appendChild(icon);
  toolbar.appendChild(tt);
}

const label = document.createElement('p');
label.textContent = 'Common UI pattern: icon toolbar with bottom tooltips and a short hideDelay for smooth transitions.';
label.style.marginTop = '0';

const wrapper = document.createElement('div');
wrapper.appendChild(label);
wrapper.appendChild(toolbar);
return wrapper;
:::

:::script label="Custom color tooltip" expected="tooltip with purple background and white text"
const tt = await slice.build('ToolTip', {
  text: 'Branded tooltip',
  customColor: { background: '#7c3aed', text: '#ffffff' }
});
tt.textContent = 'Hover for purple tooltip';

const note = document.createElement('p');
note.textContent = 'Use customColor to match your brand palette.';
note.style.marginTop = '0';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(tt);
return wrapper;
:::

## Best Practices
:::tip
Pair tooltips with interactive elements (icon buttons, truncated text, input labels) to provide contextual hints without cluttering the UI. Use `hideDelay` (300–500ms) when tooltips contain multi-line content so users have time to read.
:::

## ToolTipProvider
For pages with many tooltips (toolbars, data tables, icon grids), use [`ToolTipProvider`](/docs/services/tooltip-provider) — a singleton Service that shares one bubble and one set of listeners across all triggers via a programmatic or `data-tooltip` API.

## Pitfalls
:::warning
The tooltip bubble is appended to `document.body` — ensure `z-index: 10000` does not conflict with other overlays. For critical information, prefer visible labels instead of tooltips.
:::
