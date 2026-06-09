---
title: ToolTipProvider
route: /docs/services/tooltip-provider
navLabel: ToolTipProvider
section: Services
group: Overlay
order: 15
description: Lightweight singleton Service for efficient tooltip management via programmatic and data-attribute APIs.
component: ToolTipProviderDocumentation
generate: true
tags: [tooltip, provider, service, overlay]
---

# ToolTipProvider

## Overview
`ToolTipProvider` is a **Service** — a lightweight singleton that manages N tooltip triggers through a **single shared bubble** and **one set of global listeners**. Use it when you have many tooltips on a page and want optimal performance.

Unlike the `<slice-tooltip>` custom element (one bubble + listeners per instance), `ToolTipProvider` reuses everything:

| Aspect | `<slice-tooltip>` (×N) | `ToolTipProvider` |
|---|---|---|
| Bubbles in DOM | N | 1 |
| Global listeners | 3 × N | 3 |
| Show/hide timers | N pairs | 1 pair |

## Getting Started
Build a `ToolTipProvider` instance and call its methods against trigger elements:

```javascript
const tp = await slice.build('ToolTipProvider');
tp.attach(document.getElementById('save-btn'), {
  text: 'Save changes',
  placement: 'bottom'
});
```

For a shared singleton across your app, build with a fixed `sliceId`:

```javascript
const tp = await slice.build('ToolTipProvider', { sliceId: 'app-tooltip' });
```

## API

### `attach(element, config?)`
Registers an element as a tooltip trigger.

| Param | Type | Default | Description |
|---|---|---|---|
| `element` | `Element` | — | The trigger node. Gets `tabindex="0"` and event listeners. |
| `config.text` | `string` | `data-tooltip` attr or `''` | Tooltip text. Empty = no bubble. |
| `config.placement` | `string` | `data-tooltip-placement` or `'top'` | `'top'` \| `'bottom'` \| `'left'` \| `'right'` |
| `config.offset` | `number` | `data-tooltip-offset` or `10` | Gap from trigger (min `4`). |
| `config.maxWidth` | `number` | `data-tooltip-max-width` or `300` | Bubble max-width (min `120`). |
| `config.showDelay` | `number` | `data-tooltip-show-delay` or `0` | ms before bubble appears. |
| `config.hideDelay` | `number` | `data-tooltip-hide-delay` or `120` | ms before bubble hides. |
| `config.customColor` | `object` | `null` | `{ background, text }` |

```javascript title="Programmatic attach"
tp.attach(document.getElementById('save-btn'), {
  text: 'Save changes',
  placement: 'bottom'
});
```

### `detach(element)`
Unregisters a trigger and removes its listeners.

```javascript
tp.detach(element);
```

### `scope(container)`
Scans `container` for `[data-tooltip]` elements and attaches each one. Config is read from `data-*` attributes:

| Attribute | Maps to |
|---|---|
| `data-tooltip` | `text` |
| `data-tooltip-placement` | `placement` |
| `data-tooltip-offset` | `offset` |
| `data-tooltip-max-width` | `maxWidth` |
| `data-tooltip-show-delay` | `showDelay` |
| `data-tooltip-hide-delay` | `hideDelay` |

```html title="HTML with data attributes"
<div class="toolbar">
  <button data-tooltip="Search" data-tooltip-placement="bottom">Search</button>
  <button data-tooltip="Download" data-tooltip-placement="bottom">Download</button>
  <button data-tooltip="Delete" data-tooltip-placement="bottom" data-tooltip-offset="6">Delete</button>
</div>
```

```javascript title="Scan once"
tp.scope(document.querySelector('.toolbar'));
```

### `destroy()`
Cleans up all triggers, removes the bubble, and clears global listeners.

## Live Demos

:::script label="Data-attribute scope" expected="three buttons share one tooltip bubble"
const container = document.createElement('div');
container.innerHTML = `
  <div style="display:flex;gap:10px;margin-top:12px;">
    <button data-tooltip="Search documents" data-tooltip-placement="bottom">Search</button>
    <button data-tooltip="Download report as PDF" data-tooltip-placement="bottom">Download</button>
    <button data-tooltip="Delete permanently" data-tooltip-placement="bottom">Delete</button>
  </div>
`;

const tp = await slice.build('ToolTipProvider');
tp.scope(container);

const note = document.createElement('p');
note.textContent = 'All three buttons share one bubble. Hover each to see the tooltip.';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(container);
return wrapper;
:::

:::script label="Programmatic attach" expected="two programmatic tooltips with different placement"
const btn1 = document.createElement('button');
btn1.textContent = 'Top tooltip';
Object.assign(btn1.style, { marginRight: '30px', padding: '6px 14px' });

const btn2 = document.createElement('button');
btn2.textContent = 'Right tooltip';
Object.assign(btn2.style, { padding: '6px 14px' });

const tp2 = await slice.build('ToolTipProvider');
tp2.attach(btn1, { text: 'Appears on top', placement: 'top', offset: 8 });
tp2.attach(btn2, { text: 'Appears on the right side', placement: 'right', hideDelay: 300 });

const note = document.createElement('p');
note.textContent = 'Top tooltip uses offset=8; right tooltip uses hideDelay=300ms.';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(btn1);
wrapper.appendChild(btn2);
return wrapper;
:::

:::script label="Custom color via provider" expected="brand-colored tooltip bubble"
const btn = document.createElement('button');
btn.textContent = 'Brand tooltip';
Object.assign(btn.style, { padding: '6px 14px' });

const tp3 = await slice.build('ToolTipProvider');
tp3.attach(btn, {
  text: 'Matches brand colors',
  placement: 'bottom',
  customColor: { background: '#7c3aed', text: '#ffffff' }
});

const note = document.createElement('p');
note.textContent = 'customColor is applied to the shared bubble.';

const wrapper = document.createElement('div');
wrapper.appendChild(note);
wrapper.appendChild(btn);
return wrapper;
:::

## When to Use Which

| Scenario | Use |
|---|---|
| 1–3 tooltips, declarative markup | `<slice-tooltip>` component |
| 10+ tooltips, dynamic content | `ToolTipProvider` |
| Toolbar with icon buttons | `ToolTipProvider.scope()` + data attributes |
| App-wide shared singleton | `ToolTipProvider.getInstance()` |

## Best Practices
:::tip
Use `scope()` on a container after the DOM is ready — it scans for `[data-tooltip]` once. For dynamic content, call `attach()` when new elements are inserted and `detach()` when removed.
:::

## Pitfalls
:::warning
`ToolTipProvider` uses a **shared bubble** — only one tooltip is visible at a time. If you need simultaneous tooltips (e.g., comparison of two elements), use individual `<slice-tooltip>` components instead.
:::
