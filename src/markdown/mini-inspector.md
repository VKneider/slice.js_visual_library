---
title: MiniInspector
route: /docs/utilities/mini-inspector
navLabel: MiniInspector
section: Utilities
group: Developer
order: 10
description: MiniInspector documentation with executable live-editing scenarios.
component: MiniInspectorDocumentation
generate: true
tags: [inspector, devtools, props, setters]
---

# MiniInspector

## Overview
`MiniInspector` is a tiny, readable demonstration of how Slice's live state editing works. Point it
at any component and it reads that component's `static props`, builds an editable control per prop,
and on edit assigns `target[prop] = value` — which fires the target's setter and updates its UI
instantly. It's the same idea as the built-in DevTools inspector, in ~80 lines.

## Core Behavior
- Reads `target.constructor.props` and shows one control per editable prop (`string`, `number`, `boolean`).
- Writes edits straight back through the target's setter (`target[prop] = value`); there is no extra binding layer.
- `target` accepts a live component instance or a `sliceId` string.
- It's a normal, theme-aware Visual component — it follows the active theme via CSS variables.

## Basic Usage
```javascript title="Inspect a component"
const card = await slice.build('Card', { sliceId: 'demo-card', title: 'Hello' });
this.appendChild(card);

const inspector = await slice.build('MiniInspector', { target: card, title: 'Card props' });
this.appendChild(inspector);
// Edit a field in the inspector -> the card updates instantly via its setter.
```

## Prop Scenarios
:::script label="renders one control per editable prop" expected="three rows for DemoButton (label, clicks, disabled)"
const target = await slice.build('DemoButton', { label: 'A' });
const inspector = await slice.build('MiniInspector', { target, title: 'DemoButton' });

const rows = inspector.querySelectorAll('.mini-inspector__row').length;
if (rows !== 3) {
  throw new Error('Expected 3 editable rows, got ' + rows);
}

const host = document.createElement('div');
host.style.display = 'flex';
host.style.gap = '20px';
host.style.alignItems = 'flex-start';
host.appendChild(target);
host.appendChild(inspector);
return host;
:::

:::script label="edits flow to the target through its setter" expected="editing the label field updates the button text"
const target = await slice.build('DemoButton', { label: 'Before' });
const inspector = await slice.build('MiniInspector', { target });

// The first text input is the string prop (label). Simulate a user edit.
const input = inspector.querySelector('input[type="text"]');
input.value = 'After';
input.dispatchEvent(new Event('input'));

const shown = target.querySelector('.demo-button__label').textContent;
if (shown !== 'After') {
  throw new Error('Setter did not update the target. Got: ' + shown);
}

const host = document.createElement('div');
host.style.display = 'flex';
host.style.gap = '20px';
host.appendChild(target);
host.appendChild(inspector);
return host;
:::

:::script label="accepts a sliceId string as target" expected="resolves the live component by sliceId"
const counter = await slice.build('DemoCounter', { sliceId: 'demo-counter-mi', label: 'Items' });
const inspector = await slice.build('MiniInspector', { target: 'demo-counter-mi', title: 'By sliceId' });

const rows = inspector.querySelectorAll('.mini-inspector__row').length;
if (rows === 0) {
  throw new Error('Inspector did not resolve the component from its sliceId');
}

const host = document.createElement('div');
host.style.display = 'flex';
host.style.gap = '20px';
host.appendChild(counter);
host.appendChild(inspector);
return host;
:::

:::script label="boolean prop toggling" expected="DemoToggle inspected by MiniInspector"
const toggle = await slice.build('DemoToggle', { on: false, onText: 'Enabled', offText: 'Disabled' });
const inspector = await slice.build('MiniInspector', { target: toggle, title: 'DemoToggle' });

const host = document.createElement('div');
host.style.display = 'flex';
host.style.gap = '20px';
host.appendChild(toggle);
host.appendChild(inspector);
return host;
:::

## Best Practices
:::tip
Give your component's props clear setters that do the DOM work — then the component is instantly
inspectable, and editing a prop here behaves exactly like a prop change anywhere in your app.
:::

## Pitfalls
:::warning
This demo only edits `string`, `number`, and `boolean` props. A prop only updates the UI if its
setter performs the DOM change — if editing does nothing, the bug is in the setter, not the inspector.
:::
